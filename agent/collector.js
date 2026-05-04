import { readFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { runEslint } from './eslint-collector.js';
import { collectDocs } from './docs-collector.js';

const execFileAsync = promisify(execFile);

const MAX_BYTES_PER_FILE = 10_000;
const MAX_TOTAL_PAYLOAD_BYTES = 9 * 1024 * 1024; // 10MB 한도보다 여유 두기

export async function collectSession(jsonlPath) {
  const raw = await readFile(jsonlPath, 'utf8');
  const { sessionId, cwd, warnings } = parseJsonlMeta(raw);

  if (!sessionId) {
    return { ok: false, reason: 'no_session_id', warnings };
  }

  let diffs = [];
  let gitWarnings = [];
  if (cwd) {
    const result = await collectGitDiffs(cwd);
    diffs = result.diffs;
    gitWarnings = result.warnings;
  } else {
    gitWarnings.push('cwd not found in JSONL — diffs empty');
  }

  diffs = enforcePayloadBudget(diffs, raw.length);

  // 변경 파일에 대해 ESLint 분석 (실패해도 push는 계속 진행)
  let eslintResults = [];
  let eslintWarnings = [];
  try {
    const eslintRun = await runEslint(
      cwd,
      diffs.map((d) => ({ file_path: d.file_path, change_type: d.change_type }))
    );
    eslintResults = eslintRun.results;
    eslintWarnings = eslintRun.warnings;
  } catch (err) {
    eslintWarnings.push(`eslint run threw: ${err.message}`);
  }

  // docs/*.md 자동 수집 (실패해도 push는 계속 진행)
  let docsFiles = [];
  let docsWarnings = [];
  try {
    const docsRun = await collectDocs(cwd);
    docsFiles = docsRun.docs;
    docsWarnings = docsRun.warnings;
  } catch (err) {
    docsWarnings.push(`docs collect threw: ${err.message}`);
  }

  return {
    ok: true,
    sessionId,
    cwd,
    jsonlLog: raw,
    diffs,
    eslintResults,
    docsFiles,
    warnings: [...warnings, ...gitWarnings, ...eslintWarnings, ...docsWarnings],
  };
}

function parseJsonlMeta(raw) {
  const warnings = [];
  let sessionId = null;
  let cwd = null;

  const lines = raw.split('\n');
  for (const line of lines) {
    if (!line.trim()) continue;
    let entry;
    try {
      entry = JSON.parse(line);
    } catch {
      continue;
    }
    if (!sessionId && typeof entry.sessionId === 'string') {
      sessionId = entry.sessionId;
    }
    if (!cwd && typeof entry.cwd === 'string') {
      cwd = entry.cwd;
    }
    if (sessionId && cwd) break;
  }

  if (!sessionId) warnings.push('sessionId not found in JSONL');
  return { sessionId, cwd, warnings };
}

async function collectGitDiffs(cwd) {
  const warnings = [];
  try {
    await execFileAsync('git', ['rev-parse', '--is-inside-work-tree'], { cwd });
  } catch {
    warnings.push(`${cwd} is not a git work tree — diffs empty`);
    return { diffs: [], warnings };
  }

  let nameStatus;
  try {
    const { stdout } = await execFileAsync('git', ['diff', 'HEAD', '--name-status', '-z'], {
      cwd,
      maxBuffer: 20 * 1024 * 1024,
    });
    nameStatus = stdout;
  } catch (err) {
    warnings.push(`git diff --name-status failed: ${err.message}`);
    return { diffs: [], warnings };
  }

  const changes = parseNameStatus(nameStatus);
  const diffs = [];
  for (const { status, file } of changes) {
    const changeType = mapChangeType(status);
    let diffContent = '';
    try {
      const { stdout } = await execFileAsync('git', ['diff', 'HEAD', '--', file], {
        cwd,
        maxBuffer: 20 * 1024 * 1024,
      });
      diffContent = stdout;
    } catch (err) {
      warnings.push(`git diff for ${file} failed: ${err.message}`);
      continue;
    }
    if (diffContent.length > MAX_BYTES_PER_FILE) {
      diffContent = diffContent.slice(0, MAX_BYTES_PER_FILE) + '\n// ...(truncated)';
    }
    diffs.push({ file_path: file, diff_content: diffContent, change_type: changeType });
  }

  return { diffs, warnings };
}

function parseNameStatus(stdout) {
  const parts = stdout.split('\0').filter(Boolean);
  const changes = [];
  let i = 0;
  while (i < parts.length) {
    const status = parts[i];
    i += 1;
    if (status.startsWith('R') || status.startsWith('C')) {
      // R<score>: old \0 new
      const oldPath = parts[i];
      const newPath = parts[i + 1];
      i += 2;
      if (newPath) changes.push({ status: 'M', file: newPath });
      if (oldPath && oldPath !== newPath) changes.push({ status: 'D', file: oldPath });
    } else {
      const file = parts[i];
      i += 1;
      if (file) changes.push({ status, file });
    }
  }
  return changes;
}

function mapChangeType(status) {
  if (status === 'A') return 'added';
  if (status === 'D') return 'deleted';
  return 'modified';
}

function enforcePayloadBudget(diffs, jsonlSize) {
  let total = jsonlSize;
  const out = [];
  for (const d of diffs) {
    const size = d.file_path.length + d.diff_content.length + 50;
    if (total + size > MAX_TOTAL_PAYLOAD_BYTES) break;
    out.push(d);
    total += size;
  }
  return out;
}
