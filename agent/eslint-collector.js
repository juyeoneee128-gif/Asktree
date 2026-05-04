// agent/eslint-collector.js — CodeSasu 표준 규칙셋으로 변경 파일을 ESLint로 분석.
// 결과는 사용자 머신을 떠나기 전 정규화된 구조로 변환되어 push 페이로드에 첨부.

import { readFile, stat } from 'node:fs/promises';
import { join, extname, isAbsolute, resolve, relative } from 'node:path';
import { ESLint } from 'eslint';
import { ESLINT_FLAT_CONFIG, LINTABLE_EXTENSIONS } from './eslint-rules.js';

// 단일 파일 사이즈 상한 — 1MB 초과 시 분석 건너뜀 (ESLint 파서 hang 방지)
const MAX_FILE_BYTES = 1_000_000;
// 파일당 최대 이슈 (한 파일이 1000건 토하는 케이스 방지)
const MAX_ISSUES_PER_FILE = 50;
// 전체 이슈 상한 — 페이로드/LLM 컨텍스트 비대화 방지
const MAX_TOTAL_ISSUES = 200;

let cachedEslint = null;

function getEslint() {
  if (!cachedEslint) {
    cachedEslint = new ESLint({
      // 사용자 프로젝트의 .eslintrc/eslint.config 무시 — CodeSasu 규칙만 적용
      overrideConfigFile: true,
      overrideConfig: ESLINT_FLAT_CONFIG,
      // 파서 에러 등 lint 에러도 결과로 반환 (throw 안 함)
      ignore: false,
    });
  }
  return cachedEslint;
}

/**
 * 변경 파일 목록을 받아 ESLint로 분석.
 *
 * @param {string} cwd - git work tree 루트
 * @param {Array<{file_path: string, change_type: 'added'|'modified'|'deleted'}>} changes
 * @returns {Promise<{ results: Array, warnings: string[] }>}
 *   results: ESLintIssue[] — { file_path, line, column, rule_id, severity, message }
 */
export async function runEslint(cwd, changes) {
  const warnings = [];
  const results = [];

  if (!cwd) {
    warnings.push('eslint: cwd missing — skipped');
    return { results, warnings };
  }

  const targets = changes.filter((c) => {
    if (c.change_type === 'deleted') return false;
    const ext = extname(c.file_path).toLowerCase();
    return LINTABLE_EXTENSIONS.has(ext);
  });

  if (targets.length === 0) {
    return { results, warnings };
  }

  let eslint;
  try {
    eslint = getEslint();
  } catch (err) {
    warnings.push(`eslint: init failed (${err.message}) — analysis skipped`);
    return { results, warnings };
  }

  for (const target of targets) {
    if (results.length >= MAX_TOTAL_ISSUES) {
      warnings.push(
        `eslint: hit total issue cap (${MAX_TOTAL_ISSUES}) — remaining files skipped`
      );
      break;
    }

    const absolute = await safeResolve(cwd, target.file_path);
    if (!absolute) {
      warnings.push(`eslint: ${target.file_path} resolves outside cwd — skipped`);
      continue;
    }

    let stats;
    try {
      stats = await stat(absolute);
    } catch {
      // 파일이 사라진 경우 (rare race) — skip
      continue;
    }
    if (!stats.isFile()) continue;
    if (stats.size > MAX_FILE_BYTES) {
      warnings.push(
        `eslint: ${target.file_path} exceeds ${MAX_FILE_BYTES} bytes — skipped`
      );
      continue;
    }

    let content;
    try {
      content = await readFile(absolute, 'utf8');
    } catch (err) {
      warnings.push(`eslint: read ${target.file_path} failed (${err.message})`);
      continue;
    }

    let lintResults;
    try {
      lintResults = await eslint.lintText(content, { filePath: absolute });
    } catch (err) {
      warnings.push(`eslint: lint ${target.file_path} failed (${err.message})`);
      continue;
    }

    let perFileCount = 0;
    for (const result of lintResults) {
      for (const msg of result.messages) {
        if (perFileCount >= MAX_ISSUES_PER_FILE) {
          warnings.push(
            `eslint: ${target.file_path} hit per-file cap (${MAX_ISSUES_PER_FILE})`
          );
          break;
        }
        if (results.length >= MAX_TOTAL_ISSUES) break;

        results.push({
          file_path: target.file_path,
          line: msg.line ?? 0,
          column: msg.column ?? 0,
          rule_id: msg.ruleId ?? null,
          severity: msg.severity, // 1=warn, 2=error
          message: msg.message,
        });
        perFileCount += 1;
      }
    }
  }

  return { results, warnings };
}

/**
 * cwd 외부로의 path traversal을 차단하면서 절대 경로로 변환.
 * file_path가 cwd 바깥을 가리키면 null을 반환.
 */
async function safeResolve(cwd, filePath) {
  const cwdAbs = resolve(cwd);
  const candidate = isAbsolute(filePath) ? filePath : join(cwdAbs, filePath);
  const candidateAbs = resolve(candidate);
  const rel = relative(cwdAbs, candidateAbs);
  if (rel.startsWith('..') || isAbsolute(rel)) return null;
  return candidateAbs;
}
