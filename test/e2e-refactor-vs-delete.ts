/**
 * Asktree E2E Test 2: 의도적 리팩토링 vs 실수 삭제 구분
 *
 * 실행: npx tsx test/e2e-refactor-vs-delete.ts
 *
 * ⚠️ 실제 Claude API 호출 (약 9,000 토큰, ~$0.05)
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { parseSession } from '../src/lib/agent/parse-session';
import { saveSession, updateAgentStatus, mergeChangedFiles } from '../src/lib/agent/save-session';
import { saveEphemeralDiffs } from '../src/lib/agent/ephemeral';
import { runAnalysis } from '../src/lib/analysis/run-analysis';
import type { Database } from '../src/lib/supabase/types';
import type { DiffEntry } from '../src/lib/agent/validate-payload';

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ─── Push 1: 기존 코드 상태 ───

const PUSH1_DIFFS: DiffEntry[] = [
  {
    file_path: 'src/utils/validation.ts',
    diff_content: `@@ -0,0 +1,35 @@
+/**
+ * 이메일 유효성 검증
+ */
+export function validateEmail(email: string): boolean {
+  if (!email || typeof email !== 'string') return false;
+  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$/;
+  if (!emailRegex.test(email)) return false;
+  if (email.length > 254) return false;
+  const [local] = email.split('@');
+  if (local.length > 64) return false;
+  return true;
+}
+
+/**
+ * 비밀번호 강도 검증
+ * - 최소 8자, 대소문자 + 숫자 + 특수문자 포함
+ */
+export function validatePassword(password: string): boolean {
+  if (!password || password.length < 8) return false;
+  if (password.length > 128) return false;
+  const hasUpper = /[A-Z]/.test(password);
+  const hasLower = /[a-z]/.test(password);
+  const hasNumber = /[0-9]/.test(password);
+  const hasSpecial = /[!@#$%^&*()_+\\-=\\[\\]{};':",.<>?]/.test(password);
+  return hasUpper && hasLower && hasNumber && hasSpecial;
+}`,
    change_type: 'added',
  },
  {
    file_path: 'src/services/auth-service.ts',
    diff_content: `@@ -0,0 +1,82 @@
+import { validateEmail, validatePassword } from '../utils/validation';
+import { createClient } from '@supabase/supabase-js';
+
+interface LoginResult {
+  user: { id: string; email: string };
+  session: { token: string; expiresAt: string };
+}
+
+/**
+ * 로그인 처리
+ * 1. 입력값 검증
+ * 2. DB 사용자 조회
+ * 3. 비밀번호 검증
+ * 4. 세션 토큰 생성
+ * 5. 로그인 로그 기록
+ * 6. 마지막 로그인 시간 갱신
+ */
+export async function login(email: string, password: string): Promise<LoginResult> {
+  // 1. 입력값 검증
+  if (!validateEmail(email)) {
+    throw new Error('유효하지 않은 이메일 형식입니다');
+  }
+  if (!validatePassword(password)) {
+    throw new Error('비밀번호는 8자 이상, 대소문자+숫자+특수문자를 포함해야 합니다');
+  }
+
+  // 2. DB 사용자 조회
+  const supabase = createClient(
+    process.env.NEXT_PUBLIC_SUPABASE_URL!,
+    process.env.SUPABASE_SERVICE_ROLE_KEY!
+  );
+
+  const { data: user, error } = await supabase
+    .from('users')
+    .select('id, email, name')
+    .eq('email', email)
+    .single();
+
+  if (error || !user) {
+    throw new Error('사용자를 찾을 수 없습니다');
+  }
+
+  // 3. 비밀번호 검증 (bcrypt)
+  // const isValid = await bcrypt.compare(password, user.password_hash);
+  // if (!isValid) throw new Error('비밀번호가 일치하지 않습니다');
+
+  // 4. 세션 토큰 생성
+  const token = crypto.randomUUID();
+  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
+
+  await supabase.from('sessions').insert({
+    project_id: user.id,
+    number: 1,
+    title: 'login-session',
+    summary: 'User login session',
+  });
+
+  // 5. 로그인 로그 기록
+  console.log(\`[auth] User \${user.id} logged in at \${new Date().toISOString()}\`);
+
+  // 6. 마지막 로그인 시간 갱신
+  await supabase
+    .from('users')
+    .update({ updated_at: new Date().toISOString() } as any)
+    .eq('id', user.id);
+
+  return {
+    user: { id: user.id, email: user.email },
+    session: { token, expiresAt },
+  };
+}`,
    change_type: 'added',
  },
  {
    file_path: 'src/api/auth/route.ts',
    diff_content: `@@ -0,0 +1,20 @@
+import { NextResponse } from 'next/server';
+import { login } from '../../services/auth-service';
+
+export async function POST(req: Request) {
+  try {
+    const { email, password } = await req.json();
+    const result = await login(email, password);
+    return NextResponse.json(result);
+  } catch (err) {
+    return NextResponse.json(
+      { error: (err as Error).message },
+      { status: 401 }
+    );
+  }
+}`,
    change_type: 'added',
  },
];

// ─── Push 2: A(리팩토링) + B(실수 삭제) + C(부분 덮어쓰기) ───

const PUSH2_DIFFS: DiffEntry[] = [
  // A. 의도적 리팩토링: validateEmail → isValidEmail (양쪽 모두 수정)
  // B. 실수 삭제: validatePassword 삭제 (호출부 미수정)
  {
    file_path: 'src/utils/validation.ts',
    diff_content: `@@ -1,35 +1,18 @@
 /**
- * 이메일 유효성 검증
+ * 이메일 유효성 검증 (리팩토링: 함수명 변경)
  */
-export function validateEmail(email: string): boolean {
+export function isValidEmail(email: string): boolean {
   if (!email || typeof email !== 'string') return false;
   const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$/;
   if (!emailRegex.test(email)) return false;
   if (email.length > 254) return false;
   const [local] = email.split('@');
   if (local.length > 64) return false;
   return true;
 }
-
-/**
- * 비밀번호 강도 검증
- * - 최소 8자, 대소문자 + 숫자 + 특수문자 포함
- */
-export function validatePassword(password: string): boolean {
-  if (!password || password.length < 8) return false;
-  if (password.length > 128) return false;
-  const hasUpper = /[A-Z]/.test(password);
-  const hasLower = /[a-z]/.test(password);
-  const hasNumber = /[0-9]/.test(password);
-  const hasSpecial = /[!@#$%^&*()_+\\-=\\[\\]{};':",.<>?]/.test(password);
-  return hasUpper && hasLower && hasNumber && hasSpecial;
-}`,
    change_type: 'modified',
  },

  // A. 리팩토링 반영 (호출부 수정) + B. validatePassword 호출은 그대로 + C. 80줄→12줄
  {
    file_path: 'src/services/auth-service.ts',
    diff_content: `@@ -1,82 +1,12 @@
-import { validateEmail, validatePassword } from '../utils/validation';
-import { createClient } from '@supabase/supabase-js';
-
-interface LoginResult {
-  user: { id: string; email: string };
-  session: { token: string; expiresAt: string };
-}
-
-/**
- * 로그인 처리
- * 1. 입력값 검증
- * 2. DB 사용자 조회
- * 3. 비밀번호 검증
- * 4. 세션 토큰 생성
- * 5. 로그인 로그 기록
- * 6. 마지막 로그인 시간 갱신
- */
-export async function login(email: string, password: string): Promise<LoginResult> {
-  // 1. 입력값 검증
-  if (!validateEmail(email)) {
-    throw new Error('유효하지 않은 이메일 형식입니다');
-  }
-  if (!validatePassword(password)) {
-    throw new Error('비밀번호는 8자 이상, 대소문자+숫자+특수문자를 포함해야 합니다');
-  }
-
-  // 2. DB 사용자 조회
-  const supabase = createClient(
-    process.env.NEXT_PUBLIC_SUPABASE_URL!,
-    process.env.SUPABASE_SERVICE_ROLE_KEY!
-  );
-
-  const { data: user, error } = await supabase
-    .from('users')
-    .select('id, email, name')
-    .eq('email', email)
-    .single();
-
-  if (error || !user) {
-    throw new Error('사용자를 찾을 수 없습니다');
-  }
-
-  // 3. 비밀번호 검증 (bcrypt)
-  // const isValid = await bcrypt.compare(password, user.password_hash);
-  // if (!isValid) throw new Error('비밀번호가 일치하지 않습니다');
-
-  // 4. 세션 토큰 생성
-  const token = crypto.randomUUID();
-  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
-
-  await supabase.from('sessions').insert({
-    project_id: user.id,
-    number: 1,
-    title: 'login-session',
-    summary: 'User login session',
-  });
-
-  // 5. 로그인 로그 기록
-  console.log(\`[auth] User \${user.id} logged in at \${new Date().toISOString()}\`);
-
-  // 6. 마지막 로그인 시간 갱신
-  await supabase
-    .from('users')
-    .update({ updated_at: new Date().toISOString() } as any)
-    .eq('id', user.id);
-
-  return {
-    user: { id: user.id, email: user.email },
-    session: { token, expiresAt },
-  };
-}
+import { isValidEmail } from '../utils/validation';
+import { validatePassword } from '../utils/validation';
+
+export async function login(email: string, password: string) {
+  if (!isValidEmail(email)) throw new Error('Invalid email');
+  if (!validatePassword(password)) throw new Error('Weak password');
+
+  // 단순 조회만 남음 — 세션 생성, 토큰, 로그 기록 모두 삭제됨
+  return { success: true };
+}`,
    change_type: 'modified',
  },

  // route.ts는 변경 없음 (교집합 확인용으로 동일 내용 유지)
  {
    file_path: 'src/api/auth/route.ts',
    diff_content: `@@ -1,4 +1,4 @@
 import { NextResponse } from 'next/server';
-import { login } from '../../services/auth-service';
+import { login } from '../../services/auth-service';  // no change, just re-saved

 export async function POST(req: Request) {`,
    change_type: 'modified',
  },
];

// ─── 결과 수집 타입 ───

interface IssueInfo {
  title: string;
  level: string;
  file: string;
  fact: string;
  fix_command: string;
}

interface PushResult {
  session_id: string;
  issues: IssueInfo[];
  token_input: number;
  token_output: number;
  warnings: string[];
}

interface Verdict {
  name: string;
  expected: string;
  actual: string;
  pass: boolean;
  detail: string;
}

// ─── 메인 ───

async function main() {
  console.log('=== E2E Test 2: 리팩토링 vs 실수 삭제 구분 ===');
  console.log('⚠️  실제 Claude API 호출 (약 9,000 토큰, ~$0.05)\n');

  let projectId: string | null = null;
  let testUserId: string | null = null;

  const push1Result = {} as PushResult;
  const push2Result = {} as PushResult;

  try {
    // ── Step 1: 테스트 프로젝트 생성 ──
    console.log('[1/7] 테스트 프로젝트 생성...');
    const testEmail = `e2e-refactor-${Date.now()}@asktree.dev`;
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: testEmail, password: 'e2e-test-password-12345', email_confirm: true,
      user_metadata: { full_name: 'E2E Refactor Test' },
    });
    if (authError || !authUser.user) throw new Error(`Auth 유저 생성 실패: ${authError?.message}`);
    testUserId = authUser.user.id;

    const { data: project, error: projError } = await supabase
      .from('projects')
      .insert({ user_id: testUserId, name: 'E2E Refactor vs Delete Test' })
      .select('id').single();
    if (projError || !project) throw new Error(`프로젝트 생성 실패: ${projError?.message}`);
    projectId = project.id;
    console.log(`  project_id: ${projectId}\n`);

    // ── Step 2: Push 1 ──
    console.log('[2/7] Push 1: 기존 코드 상태 (3파일)...');
    const jsonl1 = readFileSync('test/fixtures/sample-session.jsonl', 'utf-8');
    const parsed1 = parseSession(jsonl1);
    const save1 = await saveSession(projectId, parsed1);
    if ('duplicate' in save1) throw new Error('중복');
    const sid1 = save1.saved.id;
    await saveEphemeralDiffs(sid1, PUSH1_DIFFS);
    await mergeChangedFiles(sid1, PUSH1_DIFFS.map((d) => d.file_path));
    await updateAgentStatus(projectId);
    console.log(`  session: #${save1.saved.number}, diff ${PUSH1_DIFFS.length}파일\n`);

    // ── Step 3: 분석 1 ──
    console.log('[3/7] 분석 1 실행...');
    const a1 = await runAnalysis(projectId, sid1);
    const { data: issues1 } = await supabase.from('issues').select('title, level, file, fact, fix_command').eq('session_id', sid1);
    push1Result.session_id = sid1;
    push1Result.issues = (issues1 ?? []) as IssueInfo[];
    push1Result.token_input = a1.token_usage.input;
    push1Result.token_output = a1.token_usage.output;
    push1Result.warnings = a1.warnings;
    console.log(`  이슈: ${a1.total_issues_found}건, 토큰: ${a1.token_usage.input}+${a1.token_usage.output}\n`);

    // ── Step 4: Push 2 ──
    console.log('[4/7] Push 2: A(리팩토링) + B(실수 삭제) + C(부분 덮어쓰기)...');
    const jsonl2 = jsonl1.replace(
      /aaaaaaaa-bbbb-cccc-dddd-b9b63678cf16/g,
      'cccccccc-dddd-eeee-ffff-123456789012'
    );
    const parsed2 = parseSession(jsonl2);
    const save2 = await saveSession(projectId, parsed2);
    if ('duplicate' in save2) throw new Error('중복');
    const sid2 = save2.saved.id;
    await saveEphemeralDiffs(sid2, PUSH2_DIFFS);
    await mergeChangedFiles(sid2, PUSH2_DIFFS.map((d) => d.file_path));

    // 교집합 확인
    const files1 = new Set(PUSH1_DIFFS.map((d) => d.file_path));
    const files2 = new Set(PUSH2_DIFFS.map((d) => d.file_path));
    const overlap = [...files2].filter((f) => files1.has(f));
    console.log(`  session: #${save2.saved.number}, diff ${PUSH2_DIFFS.length}파일`);
    console.log(`  교집합: ${overlap.length}개 → [${overlap.join(', ')}]\n`);

    // ── Step 5: 분석 2 (정적 + 세션 비교) ──
    console.log('[5/7] 분석 2 실행 (정적 + 세션 비교)...');
    const startTime = Date.now();
    const a2 = await runAnalysis(projectId, sid2);
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    const sessionCompTriggered = !a2.warnings.includes('No previous session to compare')
      && !a2.warnings.includes('No overlapping files between sessions');

    const { data: issues2 } = await supabase.from('issues').select('title, level, file, fact, fix_command').eq('session_id', sid2);
    push2Result.session_id = sid2;
    push2Result.issues = (issues2 ?? []) as IssueInfo[];
    push2Result.token_input = a2.token_usage.input;
    push2Result.token_output = a2.token_usage.output;
    push2Result.warnings = a2.warnings;

    console.log(`  ⏱️ ${elapsed}초`);
    console.log(`  세션 비교 트리거: ${sessionCompTriggered ? '✅ YES' : '❌ NO'}`);
    console.log(`  이슈: ${a2.total_issues_found}건, 토큰: ${a2.token_usage.input}+${a2.token_usage.output}\n`);

    // ── Step 6: 판정 ──
    console.log('[6/7] 판정...\n');

    const verdicts: Verdict[] = [];

    // A. 리팩토링 → false positive 체크
    const fpIssues = push2Result.issues.filter((i) =>
      (i.title.includes('validateEmail') || i.title.includes('isValidEmail'))
      && (i.title.includes('리네이밍') || i.title.includes('이름 변경') || i.title.includes('rename'))
    );
    const aIssues = push2Result.issues.filter((i) =>
      i.fact.toLowerCase().includes('validateemail') && i.fact.toLowerCase().includes('isvalidemail')
    );
    const aFP = fpIssues.length > 0 || aIssues.length > 0;
    verdicts.push({
      name: 'A. 의도적 리팩토링 (validateEmail→isValidEmail)',
      expected: '이슈 아님 (false positive 0)',
      actual: aFP ? `❌ False Positive ${fpIssues.length + aIssues.length}건` : '✅ 이슈 없음',
      pass: !aFP,
      detail: aFP ? (fpIssues.concat(aIssues)).map((i) => i.title).join(', ') : '리팩토링을 정상으로 인식',
    });

    // B. validatePassword 삭제 → 감지 체크
    const bIssues = push2Result.issues.filter((i) =>
      i.fact.toLowerCase().includes('validatepassword')
      || i.title.toLowerCase().includes('validatepassword')
      || i.title.includes('비밀번호 검증')
      || i.title.includes('삭제')
    );
    verdicts.push({
      name: 'B. 실수 삭제 (validatePassword 삭제, 호출부 미수정)',
      expected: 'critical 이슈 감지',
      actual: bIssues.length > 0 ? `✅ ${bIssues.length}건 감지` : '❌ 미감지 (false negative)',
      pass: bIssues.length > 0,
      detail: bIssues.map((i) => `[${i.level}] ${i.title}`).join(', ') || 'N/A',
    });

    // C. login 80줄→12줄 → 감지 체크
    const cIssues = push2Result.issues.filter((i) =>
      i.fact.includes('login') || i.title.includes('login')
      || i.fact.includes('세션') || i.fact.includes('토큰')
      || i.title.includes('축소') || i.title.includes('소실') || i.title.includes('삭제')
      || i.title.includes('기능') || i.title.includes('로직')
    );
    verdicts.push({
      name: 'C. 부분 덮어쓰기 (login 80줄→12줄)',
      expected: 'warning~critical 이슈 감지',
      actual: cIssues.length > 0 ? `✅ ${cIssues.length}건 감지` : '❌ 미감지 (false negative)',
      pass: cIssues.length > 0,
      detail: cIssues.map((i) => `[${i.level}] ${i.title}`).join(', ') || 'N/A',
    });

    // 세션 비교 트리거
    verdicts.push({
      name: '세션 비교 트리거',
      expected: 'YES',
      actual: sessionCompTriggered ? '✅ YES' : '❌ NO',
      pass: sessionCompTriggered,
      detail: sessionCompTriggered ? `교집합 ${overlap.length}파일` : a2.warnings.join(', '),
    });

    // 출력
    for (const v of verdicts) {
      console.log(`  ${v.pass ? '✅' : '❌'} ${v.name}`);
      console.log(`     기대: ${v.expected}`);
      console.log(`     결과: ${v.actual}`);
      console.log(`     상세: ${v.detail}\n`);
    }

    console.log('  === Push 2 전체 이슈 목록 ===');
    for (const i of push2Result.issues) {
      const icon = { critical: '🔴', warning: '🟡', info: '🔵' }[i.level] ?? '⚪';
      console.log(`  ${icon} [${i.level}] ${i.title} — ${i.file}`);
      console.log(`     ${i.fact}`);
    }

    // ── 결과 파일 저장 ──
    const dateStr = new Date().toISOString().slice(0, 10);
    const resultPath = `docs/test-results/test2-refactor-vs-delete-${dateStr}.md`;
    const md = generateReport(push1Result, push2Result, verdicts, overlap, sessionCompTriggered, dateStr);
    mkdirSync('docs/test-results', { recursive: true });
    writeFileSync(resultPath, md, 'utf-8');
    console.log(`\n  📄 결과 저장: ${resultPath}`);

    // ── Step 7: 정리 ──
    console.log('\n[7/7] 정리...');
    await supabase.from('projects').delete().eq('id', projectId);
    projectId = null;
    await supabase.auth.admin.deleteUser(testUserId);
    testUserId = null;
    console.log('  테스트 데이터 삭제 완료');

    const allPass = verdicts.every((v) => v.pass);
    console.log(`\n=== ${allPass ? '✅ ALL PASS' : '⚠️ PARTIAL FAIL'} ===`);

  } catch (err) {
    console.error('\n❌ 테스트 실패:', (err as Error).message);
    console.error((err as Error).stack);
    if (projectId) await supabase.from('projects').delete().eq('id', projectId);
    if (testUserId) await supabase.auth.admin.deleteUser(testUserId);
    process.exit(1);
  }
}

// ─── Markdown 리포트 ───

function generateReport(
  p1: PushResult, p2: PushResult, verdicts: Verdict[],
  overlap: string[], sessionCompTriggered: boolean, dateStr: string
): string {
  const p1Issues = p1.issues.map((i) => `| ${i.level} | ${i.title} | ${i.file} | ${i.fact} |`).join('\n');
  const p2Issues = p2.issues.map((i) => `| ${i.level} | ${i.title} | ${i.file} | ${i.fact} |`).join('\n');
  const verdictRows = verdicts.map((v) =>
    `| ${v.pass ? 'PASS' : 'FAIL'} | ${v.name} | ${v.expected} | ${v.actual} |`
  ).join('\n');

  const totalInput = p1.token_input + p2.token_input;
  const totalOutput = p1.token_output + p2.token_output;
  const allPass = verdicts.every((v) => v.pass);

  return `# Test 2: 의도적 리팩토링 vs 실수 삭제 구분

- 실행일: ${dateStr}
- 목적: 세션 간 비교가 리팩토링/삭제/덮어쓰기를 정확히 구분하는지 검증

## 테스트 시나리오

### Push 1 (기존 코드)
- validation.ts: validateEmail (20줄) + validatePassword (15줄)
- auth-service.ts: login 함수 (82줄, 6단계 로직)
- auth/route.ts: API 라우트 (login 호출)

### Push 2 (3가지 변경)
| 변경 | 내용 | 기대 |
|------|------|------|
| A. 리팩토링 | validateEmail → isValidEmail (호출부 함께 수정) | 이슈 아님 |
| B. 실수 삭제 | validatePassword 삭제 (호출부 미수정) | critical |
| C. 부분 덮어쓰기 | login 82줄 → 12줄 (세션/토큰/로그 소실) | warning~critical |

## 판정 결과

| 판정 | 항목 | 기대 | 결과 |
|------|------|------|------|
${verdictRows}

**전체: ${allPass ? 'ALL PASS' : 'PARTIAL FAIL'}**

## 세션 간 비교

| 항목 | 결과 |
|------|------|
| 세션 비교 트리거 | ${sessionCompTriggered ? 'YES' : 'NO'} |
| 교집합 파일 | ${overlap.join(', ')} |
| 교집합 수 | ${overlap.length}개 |

## Push 1 이슈

| Level | Title | File | Fact |
|-------|-------|------|------|
${p1Issues || '| - | 이슈 없음 | - | - |'}

## Push 2 이슈

| Level | Title | File | Fact |
|-------|-------|------|------|
${p2Issues || '| - | 이슈 없음 | - | - |'}

## 토큰 소모량

| 구분 | Input | Output | 합계 |
|------|-------|--------|------|
| Push 1 | ${p1.token_input} | ${p1.token_output} | ${p1.token_input + p1.token_output} |
| Push 2 | ${p2.token_input} | ${p2.token_output} | ${p2.token_input + p2.token_output} |
| **총합** | **${totalInput}** | **${totalOutput}** | **${totalInput + totalOutput}** |

## Push 2 경고

${p2.warnings.map((w) => `- ${w}`).join('\n') || '- 없음'}
`;
}

main();
