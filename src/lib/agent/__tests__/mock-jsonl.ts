import type { AgentPushPayload } from '../validate-payload';

// 코드 세션 JSONL (Write/Edit 포함)
export const MOCK_JSONL_LINES = [
  '{"type":"queue-operation","operation":"enqueue","timestamp":"2026-04-08T10:00:00Z","sessionId":"test-session-001"}',
  '{"type":"queue-operation","operation":"dequeue","timestamp":"2026-04-08T10:00:00Z","sessionId":"test-session-001"}',

  // 첫 프롬프트 (cwd, version, entrypoint 포함)
  '{"type":"user","parentUuid":null,"isSidechain":false,"promptId":"p1","uuid":"u1","timestamp":"2026-04-08T10:00:01Z","message":{"role":"user","content":[{"type":"text","text":"<ide_opened_file>The user opened src/auth/login.ts</ide_opened_file>"},{"type":"text","text":"로그인 에러 처리 추가해줘"}]},"permissionMode":"default","userType":"external","entrypoint":"claude-vscode","cwd":"/Users/dev/project","sessionId":"test-session-001","version":"2.1.90","gitBranch":"main"}',

  // assistant — thinking
  '{"type":"assistant","parentUuid":"u1","isSidechain":false,"uuid":"a1","timestamp":"2026-04-08T10:00:02Z","requestId":"r1","message":{"model":"claude-sonnet-4-20250514","id":"msg1","type":"message","role":"assistant","content":[{"type":"thinking","thinking":"파일을 읽어보겠습니다"}],"stop_reason":"end_turn","usage":{"input_tokens":100,"output_tokens":50}}}',

  // assistant — tool_use (Read)
  '{"type":"assistant","parentUuid":"u1","isSidechain":false,"uuid":"a2","timestamp":"2026-04-08T10:00:03Z","requestId":"r2","message":{"model":"claude-sonnet-4-20250514","id":"msg2","type":"message","role":"assistant","content":[{"type":"tool_use","id":"tu1","name":"Read","input":{"file_path":"/Users/dev/project/src/auth/login.ts"}}],"stop_reason":"tool_use","usage":{"input_tokens":150,"output_tokens":30}}}',

  // user — tool_result
  '{"type":"user","parentUuid":"a2","isSidechain":false,"promptId":"p2","uuid":"u2","timestamp":"2026-04-08T10:00:04Z","message":{"role":"user","content":[{"type":"tool_result","tool_use_id":"tu1","content":"export function login() { ... }"}]},"toolUseResult":{"matches":1}}',

  // assistant — text + tool_use (Edit)
  '{"type":"assistant","parentUuid":"u2","isSidechain":false,"uuid":"a3","timestamp":"2026-04-08T10:00:05Z","requestId":"r3","message":{"model":"claude-sonnet-4-20250514","id":"msg3","type":"message","role":"assistant","content":[{"type":"text","text":"에러 처리를 추가하겠습니다."},{"type":"tool_use","id":"tu2","name":"Edit","input":{"file_path":"/Users/dev/project/src/auth/login.ts","old_string":"export function login()","new_string":"export function login() { try {"}}],"stop_reason":"tool_use","usage":{"input_tokens":200,"output_tokens":80}}}',

  // user — tool_result
  '{"type":"user","parentUuid":"a3","isSidechain":false,"promptId":"p3","uuid":"u3","timestamp":"2026-04-08T10:00:06Z","message":{"role":"user","content":[{"type":"tool_result","tool_use_id":"tu2","content":"OK"}]},"toolUseResult":{"matches":1}}',

  // assistant — tool_use (Write)
  '{"type":"assistant","parentUuid":"u3","isSidechain":false,"uuid":"a4","timestamp":"2026-04-08T10:00:07Z","requestId":"r4","message":{"model":"claude-sonnet-4-20250514","id":"msg4","type":"message","role":"assistant","content":[{"type":"tool_use","id":"tu3","name":"Write","input":{"file_path":"/Users/dev/project/src/auth/error-handler.ts","content":"export class AuthError {}"}}],"stop_reason":"tool_use","usage":{"input_tokens":250,"output_tokens":40}}}',

  // user — tool_result
  '{"type":"user","parentUuid":"a4","isSidechain":false,"promptId":"p4","uuid":"u4","timestamp":"2026-04-08T10:00:08Z","message":{"role":"user","content":[{"type":"tool_result","tool_use_id":"tu3","content":"OK"}]}}',

  // assistant — 완료 응답
  '{"type":"assistant","parentUuid":"u4","isSidechain":false,"uuid":"a5","timestamp":"2026-04-08T10:00:09Z","requestId":"r5","message":{"model":"claude-sonnet-4-20250514","id":"msg5","type":"message","role":"assistant","content":[{"type":"text","text":"완료했습니다."}],"stop_reason":"end_turn","usage":{"input_tokens":300,"output_tokens":60}}}',

  // ai-title
  '{"type":"ai-title","sessionId":"test-session-001","aiTitle":"로그인 에러 처리 추가"}',

  // last-prompt
  '{"type":"last-prompt","lastPrompt":"로그인 에러 처리 추가해줘","sessionId":"test-session-001"}',
];

export const MOCK_JSONL = MOCK_JSONL_LINES.join('\n');

// ai-title 없는 JSONL
export const MOCK_JSONL_NO_TITLE_LINES = MOCK_JSONL_LINES.filter(
  (line) => !line.includes('"ai-title"')
);
export const MOCK_JSONL_NO_TITLE = MOCK_JSONL_NO_TITLE_LINES.join('\n');

// 손상된 줄이 포함된 JSONL
export const MOCK_JSONL_WITH_CORRUPT = [
  MOCK_JSONL_LINES[0],
  'THIS IS NOT VALID JSON {{{',
  MOCK_JSONL_LINES[2],
  '{"incomplete": true',
  MOCK_JSONL_LINES[MOCK_JSONL_LINES.length - 2], // ai-title
].join('\n');

// 에러 감지 테스트용 JSONL — is_error=true / 키워드 매칭 / "no errors" 부정문
export const MOCK_JSONL_WITH_ERRORS = [
  '{"type":"user","parentUuid":null,"isSidechain":false,"promptId":"p1","uuid":"u1","timestamp":"2026-04-08T10:00:00Z","message":{"role":"user","content":[{"type":"text","text":"build 실행해줘"}]},"cwd":"/Users/dev/x","sessionId":"err-session"}',

  // assistant — Bash tool_use 3건 (각각 다른 결과)
  '{"type":"assistant","parentUuid":"u1","uuid":"a1","timestamp":"2026-04-08T10:00:01Z","message":{"model":"m","role":"assistant","content":[{"type":"tool_use","id":"tu1","name":"Bash","input":{"command":"npm test"}},{"type":"tool_use","id":"tu2","name":"Bash","input":{"command":"npm build"}},{"type":"tool_use","id":"tu3","name":"Bash","input":{"command":"echo done"}}]}}',

  // user — tool_result 3건
  // tu1: is_error=true (확실한 에러)
  // tu2: error 키워드 매칭
  // tu3: "no errors" — 부정문이므로 false positive 차단
  '{"type":"user","parentUuid":"a1","uuid":"u2","timestamp":"2026-04-08T10:00:02Z","message":{"role":"user","content":[{"type":"tool_result","tool_use_id":"tu1","content":"connection refused","is_error":true},{"type":"tool_result","tool_use_id":"tu2","content":"Build failed: missing module"},{"type":"tool_result","tool_use_id":"tu3","content":"Tests passed with no errors"}]},"toolUseResult":{}}',
].join('\n');

// tool_result만 있는 JSONL (프롬프트 없음)
export const MOCK_JSONL_TOOL_ONLY = [
  '{"type":"queue-operation","operation":"enqueue","timestamp":"2026-04-08T10:00:00Z","sessionId":"test-002"}',
  '{"type":"user","parentUuid":"x","isSidechain":false,"promptId":"p1","uuid":"u1","timestamp":"2026-04-08T10:00:01Z","message":{"role":"user","content":[{"type":"tool_result","tool_use_id":"t1","content":"OK"}]},"toolUseResult":{"matches":1}}',
  '{"type":"assistant","parentUuid":"u1","isSidechain":false,"uuid":"a1","timestamp":"2026-04-08T10:00:02Z","requestId":"r1","message":{"model":"claude-sonnet-4-20250514","id":"m1","type":"message","role":"assistant","content":[{"type":"text","text":"완료"}],"stop_reason":"end_turn","usage":{"input_tokens":50,"output_tokens":10}}}',
].join('\n');

// Push 페이로드 mock
export const MOCK_PUSH_PAYLOAD: AgentPushPayload = {
  project_id: 'test-project-uuid',
  session_data: {
    jsonl_log: MOCK_JSONL,
    diffs: [
      {
        file_path: 'src/auth/login.ts',
        diff_content:
          '@@ -1,3 +1,7 @@\n+try {\n   const user = await db.findUser(email);\n+} catch(e) {\n+  throw new AuthError(e.message);\n+}',
        change_type: 'modified',
      },
      {
        file_path: 'src/auth/error-handler.ts',
        diff_content:
          '@@ -0,0 +1,1 @@\n+export class AuthError {}',
        change_type: 'added',
      },
    ],
  },
  metadata: {
    agent_version: '1.0.0',
    pushed_at: '2026-04-08T10:00:10Z',
  },
};
