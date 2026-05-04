// agent/docs-collector.js — 프로젝트 docs/ 폴더의 *.md를 자동 수집.
// 결과는 push payload의 session_data.docs_files로 전송되어 서버가 변경 감지 후
// 기능 추출(extractFeatures)을 자동 재실행한다.

import { readdir, readFile, stat } from 'node:fs/promises';
import { join, isAbsolute, resolve, relative } from 'node:path';

// 단일 파일 상한 — 50KB 초과 파일은 skip (잘리면 PRD 의미 손실)
const MAX_FILE_BYTES = 50_000;
// 전체 docs 합 상한 — 500KB. 초과 시 작은 파일부터 채움
const MAX_TOTAL_BYTES = 500_000;
// 재귀 깊이 상한 (방어용 — 심볼릭 링크 루프 등)
const MAX_DEPTH = 8;

/**
 * cwd 하위 docs/ 폴더를 재귀 스캔하여 .md 파일을 수집.
 *
 * @param {string} cwd - 프로젝트 루트
 * @returns {Promise<{
 *   docs: Array<{ path: string, content: string, modified_at: string }>,
 *   warnings: string[]
 * }>}
 */
export async function collectDocs(cwd) {
  const warnings = [];

  if (!cwd) {
    return { docs: [], warnings: ['docs: cwd missing — skipped'] };
  }

  const cwdAbs = resolve(cwd);
  const docsRoot = join(cwdAbs, 'docs');

  let rootStat;
  try {
    rootStat = await stat(docsRoot);
  } catch (err) {
    if (err.code === 'ENOENT') {
      return { docs: [], warnings: [] }; // docs 폴더 없음 — 정상
    }
    return { docs: [], warnings: [`docs: stat failed (${err.message})`] };
  }

  if (!rootStat.isDirectory()) {
    return { docs: [], warnings: ['docs: docs/ exists but is not a directory'] };
  }

  // 재귀 스캔 — 각 .md 파일에 대해 size + content + mtime 수집
  const candidates = [];
  await walkMarkdownFiles(docsRoot, cwdAbs, 0, candidates, warnings);

  // 50KB 초과 skip 적용
  const eligible = [];
  for (const c of candidates) {
    if (c.size > MAX_FILE_BYTES) {
      warnings.push(
        `docs: ${c.path} exceeds ${MAX_FILE_BYTES} bytes (${c.size}) — skipped`
      );
      continue;
    }
    eligible.push(c);
  }

  // 500KB 전체 상한 — 작은 파일부터 채움 (큰 파일이 먼저 잘림)
  eligible.sort((a, b) => a.size - b.size);
  const docs = [];
  let totalBytes = 0;
  for (const c of eligible) {
    if (totalBytes + c.size > MAX_TOTAL_BYTES) {
      warnings.push(
        `docs: ${c.path} (${c.size}B) skipped — total budget ${MAX_TOTAL_BYTES} reached`
      );
      continue;
    }

    let content;
    try {
      content = await readFile(c.absolute, 'utf8');
    } catch (err) {
      warnings.push(`docs: read ${c.path} failed (${err.message})`);
      continue;
    }

    docs.push({
      path: c.path,
      content,
      modified_at: c.mtime.toISOString(),
    });
    totalBytes += c.size;
  }

  // path 알파벳 정렬 — 결정적 순서
  docs.sort((a, b) => a.path.localeCompare(b.path));

  return { docs, warnings };
}

async function walkMarkdownFiles(dir, cwdAbs, depth, out, warnings) {
  if (depth > MAX_DEPTH) {
    warnings.push(`docs: max depth ${MAX_DEPTH} hit at ${dir} — skipped deeper`);
    return;
  }

  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch (err) {
    warnings.push(`docs: readdir ${dir} failed (${err.message})`);
    return;
  }

  for (const entry of entries) {
    const absolute = join(dir, entry.name);

    // 심볼릭 링크는 따라가지 않음 (cwd 외부 가리킬 수 있음)
    if (entry.isSymbolicLink()) {
      warnings.push(`docs: ${entry.name} is a symlink — skipped`);
      continue;
    }

    if (entry.isDirectory()) {
      await walkMarkdownFiles(absolute, cwdAbs, depth + 1, out, warnings);
      continue;
    }

    if (!entry.isFile()) continue;

    // .md 확장자만 (소문자 비교)
    if (!entry.name.toLowerCase().endsWith('.md')) continue;

    // cwd 외부 path traversal 차단
    const rel = relative(cwdAbs, absolute);
    if (rel.startsWith('..') || isAbsolute(rel)) continue;

    let s;
    try {
      s = await stat(absolute);
    } catch {
      continue;
    }

    out.push({
      path: rel.split(/[\\/]/).join('/'), // POSIX 슬래시
      absolute,
      size: s.size,
      mtime: s.mtime,
    });
  }
}
