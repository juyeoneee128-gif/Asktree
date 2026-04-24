#!/usr/bin/env node
/**
 * Asktree 자체를 테스트 대상으로 POST /api/agent/push 호출.
 *
 * 사용법:
 *   ASKTREE_PROJECT_ID=<uuid> ASKTREE_AGENT_TOKEN=<token> node scripts/push-asktree.mjs
 *
 * 옵션 환경변수:
 *   ASKTREE_API_URL   (기본: http://localhost:3000)
 *   ASKTREE_ROOT      (기본: /Users/juyeoneee/Desktop/asktree)
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const PROJECT_ID = process.env.ASKTREE_PROJECT_ID;
const AGENT_TOKEN = process.env.ASKTREE_AGENT_TOKEN;
const API_URL = process.env.ASKTREE_API_URL ?? 'http://localhost:3000';
const ROOT = process.env.ASKTREE_ROOT ?? '/Users/juyeoneee/Desktop/asktree';

if (!PROJECT_ID || !AGENT_TOKEN) {
  console.error('ERROR: ASKTREE_PROJECT_ID and ASKTREE_AGENT_TOKEN are required.');
  console.error('Usage:');
  console.error('  ASKTREE_PROJECT_ID=<uuid> ASKTREE_AGENT_TOKEN=<token> node scripts/push-asktree.mjs');
  process.exit(1);
}

const EXCLUDE_DIRS = new Set(['node_modules', '.next', '.git', 'dist', 'build', '.turbo', '.vercel', '__tests__']);
const INCLUDE_EXT = ['.ts', '.tsx', '.js', '.jsx', '.mjs'];
const EXCLUDE_FILE_PATTERNS = [/\.stories\.tsx?$/, /\.test\.(ts|tsx|js|jsx|mjs)$/, /\.spec\.(ts|tsx|js|jsx|mjs)$/];
const MAX_BYTES_PER_FILE = 10_000;

function isExcludedFile(name) {
  return EXCLUDE_FILE_PATTERNS.some((re) => re.test(name));
}

function walk(dir, acc = []) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return acc;
  }
  for (const entry of entries) {
    const full = join(dir, entry);
    let stat;
    try {
      stat = statSync(full);
    } catch {
      continue;
    }
    if (stat.isDirectory()) {
      if (!EXCLUDE_DIRS.has(entry)) walk(full, acc);
    } else if (INCLUDE_EXT.some((e) => entry.endsWith(e)) && !isExcludedFile(entry)) {
      acc.push(full);
    }
  }
  return acc;
}

const files = walk(ROOT);
console.log(`Found ${files.length} files under ${ROOT}`);

const diffs = files.map((f) => {
  let content = readFileSync(f, 'utf8');
  if (content.length > MAX_BYTES_PER_FILE) {
    content = content.slice(0, MAX_BYTES_PER_FILE) + '\n// ...(truncated)';
  }
  return {
    file_path: relative(ROOT, f),
    diff_content: content.split('\n').map((l) => '+' + l).join('\n'),
    change_type: 'modified',
  };
});

// 파일 트리도 간단히 추가
const file_tree = files.map((f) => ({
  path: relative(ROOT, f),
  type: 'file',
  size: readFileSync(f).length,
}));

const sessionId = `test-${Date.now()}`;
const now = new Date().toISOString();

const jsonlLines = [
  JSON.stringify({ type: 'queue-operation', operation: 'enqueue', timestamp: now, sessionId }),
  JSON.stringify({
    type: 'user',
    parentUuid: null,
    isSidechain: false,
    promptId: 'p1',
    uuid: 'u1',
    timestamp: now,
    message: {
      role: 'user',
      content: [{ type: 'text', text: 'Asktree 전체 코드 분석 테스트 (push-asktree.mjs)' }],
    },
    permissionMode: 'default',
    userType: 'external',
    entrypoint: 'test-script',
    cwd: ROOT,
    sessionId,
    version: '2.1.90',
    gitBranch: 'main',
  }),
  JSON.stringify({
    type: 'assistant',
    parentUuid: 'u1',
    isSidechain: false,
    uuid: 'a1',
    timestamp: now,
    requestId: 'r1',
    message: {
      model: 'claude-sonnet-4-5',
      id: 'msg1',
      type: 'message',
      role: 'assistant',
      content: [{ type: 'text', text: '전체 코드를 점검합니다.' }],
      stop_reason: 'end_turn',
      usage: { input_tokens: 100, output_tokens: 50 },
    },
  }),
  JSON.stringify({ type: 'ai-title', sessionId, aiTitle: 'Asktree 전체 코드 분석 테스트' }),
  JSON.stringify({ type: 'last-prompt', lastPrompt: 'Asktree 전체 코드 분석 테스트', sessionId }),
];

const payload = {
  project_id: PROJECT_ID,
  session_data: {
    jsonl_log: jsonlLines.join('\n'),
    diffs,
    file_tree,
  },
  metadata: {
    agent_version: 'test-0.1.0',
    pushed_at: now,
    entrypoint: 'test-script',
  },
};

const raw = JSON.stringify(payload);
const sizeMB = (raw.length / 1024 / 1024).toFixed(2);
console.log(`Payload: ${files.length} files, ${diffs.length} diffs, ${sizeMB} MB (limit 10 MB)`);

if (raw.length > 10 * 1024 * 1024) {
  console.error('ERROR: payload exceeds 10 MB. Lower MAX_BYTES_PER_FILE or add more exclusions.');
  process.exit(1);
}

console.log(`POST ${API_URL}/api/agent/push ...`);
const start = Date.now();

const res = await fetch(`${API_URL}/api/agent/push`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${AGENT_TOKEN}`,
  },
  body: raw,
});

const elapsed = ((Date.now() - start) / 1000).toFixed(2);
console.log(`Response ${res.status} in ${elapsed}s`);

const body = await res.json().catch(() => ({ raw: 'non-json response' }));
console.log(JSON.stringify(body, null, 2));

if (res.ok && body.session_id) {
  console.log('\n✓ Push succeeded. Auto-analysis is running in the background.');
  console.log('  session_id:', body.session_id);
  console.log('  브라우저에서 [이슈] 탭을 확인하세요 (분석 완료에 30초~2분 소요).');
}
