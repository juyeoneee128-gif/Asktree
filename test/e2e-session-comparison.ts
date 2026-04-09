/**
 * Asktree E2E Test 1: 세션 간 비교 검증
 *
 * 실행: npx tsx test/e2e-session-comparison.ts
 *
 * ⚠️ 실제 Claude API 호출 (약 11,000 토큰, ~$0.06)
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { parseSession } from '../src/lib/agent/parse-session';
import { saveSession, updateAgentStatus } from '../src/lib/agent/save-session';
import { saveEphemeralDiffs } from '../src/lib/agent/ephemeral';
import { runAnalysis } from '../src/lib/analysis/run-analysis';
import type { Database } from '../src/lib/supabase/types';
import type { DiffEntry } from '../src/lib/agent/validate-payload';

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ─── Mock Diffs ───

// Push 1: Tier 0~1 시점의 코드 (정상 코드 + 약간의 이슈)
const PUSH1_DIFFS: DiffEntry[] = [
  {
    file_path: 'src/lib/supabase/types.ts',
    diff_content: `@@ -0,0 +1,40 @@
+export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];
+
+export interface Database {
+  public: {
+    Tables: {
+      users: {
+        Row: {
+          id: string;
+          name: string;
+          email: string;
+          credits: number;
+        };
+      };
+      projects: {
+        Row: {
+          id: string;
+          user_id: string;
+          name: string;
+        };
+      };
+    };
+  };
+}`,
    change_type: 'added',
  },
  {
    file_path: 'app/api/projects/route.ts',
    diff_content: `@@ -0,0 +1,30 @@
+import { NextResponse } from 'next/server';
+import { createClient } from '@/src/lib/supabase/server';
+
+export async function GET() {
+  const supabase = await createClient();
+  const { data: { user } } = await supabase.auth.getUser();
+
+  if (!user) {
+    return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
+  }
+
+  const { data, error } = await supabase
+    .from('projects')
+    .select('*')
+    .eq('user_id', user.id);
+
+  if (error) {
+    return NextResponse.json({ error: error.message }, { status: 500 });
+  }
+
+  return NextResponse.json(data);
+}`,
    change_type: 'added',
  },
];

// Push 2: Tier 6 시점 — types.ts 확장(정상) + route.ts 인증 실수 삭제(이슈)
const PUSH2_DIFFS: DiffEntry[] = [
  {
    file_path: 'src/lib/supabase/types.ts',
    diff_content: `@@ -10,6 +10,7 @@
           email: string;
           credits: number;
+          encrypted_api_key: string | null;
         };
       };`,
    change_type: 'modified',
  },
  {
    file_path: 'app/api/projects/route.ts',
    diff_content: `@@ -3,12 +3,8 @@
 import { createClient } from '@/src/lib/supabase/server';

 export async function GET() {
   const supabase = await createClient();
-  const { data: { user } } = await supabase.auth.getUser();
-
-  if (!user) {
-    return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
-  }

   const { data, error } = await supabase
     .from('projects')
-    .select('*')
-    .eq('user_id', user.id);
+    .select('*');

   if (error) {
     return NextResponse.json({ error: error.message }, { status: 500 });`,
    change_type: 'modified',
  },
  {
    file_path: 'src/lib/credits/deduct.ts',
    diff_content: `@@ -0,0 +1,15 @@
+import { createClient } from '@supabase/supabase-js';
+
+export async function deductCredit(userId: string, amount: number = 1) {
+  const supabase = createClient(
+    process.env.NEXT_PUBLIC_SUPABASE_URL!,
+    process.env.SUPABASE_SERVICE_ROLE_KEY!
+  );
+
+  const { data: user } = await supabase
+    .from('users')
+    .select('credits')
+    .eq('id', userId)
+    .single();
+
+  console.log("User credits:", user?.credits, "deducting:", amount);
+}`,
    change_type: 'added',
  },
];

// ─── 결과 수집 ───

interface TestResult {
  push1: {
    session_id: string;
    title: string;
    files_changed: number;
    issues_found: number;
    issues_created: number;
    token_input: number;
    token_output: number;
    warnings: string[];
    issues: { title: string; level: string; file: string; fact: string }[];
  };
  push2: {
    session_id: string;
    title: string;
    files_changed: number;
    issues_found: number;
    issues_created: number;
    token_input: number;
    token_output: number;
    warnings: string[];
    issues: { title: string; level: string; file: string; fact: string }[];
    session_comparison_triggered: boolean;
    overlapping_files: string[];
  };
  total_tokens: { input: number; output: number };
}

// ─── 메인 ───

async function main() {
  console.log('=== E2E Test 1: 세션 간 비교 검증 ===');
  console.log('⚠️  실제 Claude API 호출 (약 11,000 토큰, ~$0.06)\n');

  let projectId: string | null = null;
  let testUserId: string | null = null;
  const result = {} as TestResult;

  try {
    // ── Step 1: 테스트 프로젝트 생성 ──
    console.log('[1/7] 테스트 프로젝트 생성...');

    const testEmail = `e2e-compare-${Date.now()}@asktree.dev`;
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: 'e2e-test-password-12345',
      email_confirm: true,
      user_metadata: { full_name: 'E2E Compare Test' },
    });

    if (authError || !authUser.user) throw new Error(`Auth 유저 생성 실패: ${authError?.message}`);
    testUserId = authUser.user.id;

    const { data: project, error: projError } = await supabase
      .from('projects')
      .insert({ user_id: testUserId, name: 'E2E Session Comparison Test' })
      .select('id, agent_token')
      .single();

    if (projError || !project) throw new Error(`프로젝트 생성 실패: ${projError?.message}`);
    projectId = project.id;
    console.log(`  project_id: ${projectId}\n`);

    // ── Step 2: Push 1 (Session A) ──
    console.log('[2/7] Push 1: Session A (Tier 0~1 시점)...');

    const jsonl1 = readFileSync('test/fixtures/sample-session.jsonl', 'utf-8');
    const parsed1 = parseSession(jsonl1);
    const save1 = await saveSession(projectId, parsed1);
    if ('duplicate' in save1) throw new Error('중복 세션');

    const sid1 = save1.saved.id;
    await saveEphemeralDiffs(sid1, PUSH1_DIFFS);
    await updateAgentStatus(projectId);

    console.log(`  session_id: ${sid1}`);
    console.log(`  title: ${parsed1.title}`);
    console.log(`  diffs: ${PUSH1_DIFFS.length}개 파일\n`);

    // ── Step 3: 분석 1 실행 ──
    console.log('[3/7] 분석 1 실행 (정적 분석만)...');
    const analysis1 = await runAnalysis(projectId, sid1);

    result.push1 = {
      session_id: sid1,
      title: parsed1.title,
      files_changed: PUSH1_DIFFS.length,
      issues_found: analysis1.total_issues_found,
      issues_created: analysis1.issues_created,
      token_input: analysis1.token_usage.input,
      token_output: analysis1.token_usage.output,
      warnings: analysis1.warnings,
      issues: [],
    };

    const { data: issues1 } = await supabase
      .from('issues')
      .select('title, level, file, fact')
      .eq('session_id', sid1);

    result.push1.issues = (issues1 ?? []).map((i) => ({
      title: i.title, level: i.level, file: i.file, fact: i.fact,
    }));

    console.log(`  이슈: ${analysis1.total_issues_found}건 감지, ${analysis1.issues_created}건 생성`);
    console.log(`  토큰: 입력 ${analysis1.token_usage.input} / 출력 ${analysis1.token_usage.output}`);
    console.log(`  경고: ${analysis1.warnings.join(', ') || '없음'}\n`);

    // ── Step 4: Push 2 (Session B — 교집합 파일 포함) ──
    console.log('[4/7] Push 2: Session B (Tier 6 시점, 교집합 파일 포함)...');

    // Session B용 JSONL 생성 (sample을 수정하여 다른 sessionId 사용)
    const jsonl2 = jsonl1.replace(
      /aaaaaaaa-bbbb-cccc-dddd-b9b63678cf16/g,
      'bbbbbbbb-cccc-dddd-eeee-123456789012'
    );
    const parsed2 = parseSession(jsonl2);
    const save2 = await saveSession(projectId, parsed2);
    if ('duplicate' in save2) throw new Error('중복 세션');

    const sid2 = save2.saved.id;
    await saveEphemeralDiffs(sid2, PUSH2_DIFFS);

    console.log(`  session_id: ${sid2}`);
    console.log(`  session_number: ${save2.saved.number}`);
    console.log(`  diffs: ${PUSH2_DIFFS.length}개 파일`);

    // 교집합 미리 계산
    const files1 = new Set(PUSH1_DIFFS.map((d) => d.file_path));
    const files2 = new Set(PUSH2_DIFFS.map((d) => d.file_path));
    const overlap = [...files2].filter((f) => files1.has(f));
    console.log(`  교집합: ${overlap.length}개 파일 → [${overlap.join(', ')}]\n`);

    // ── Step 5: 분석 2 실행 (정적 + 세션 비교) ──
    console.log('[5/7] 분석 2 실행 (정적 분석 + 세션 간 비교)...');
    const analysis2 = await runAnalysis(projectId, sid2);

    const sessionCompTriggered = !analysis2.warnings.includes('No previous session to compare')
      && !analysis2.warnings.includes('No overlapping files between sessions');

    result.push2 = {
      session_id: sid2,
      title: parsed2.title,
      files_changed: PUSH2_DIFFS.length,
      issues_found: analysis2.total_issues_found,
      issues_created: analysis2.issues_created,
      token_input: analysis2.token_usage.input,
      token_output: analysis2.token_usage.output,
      warnings: analysis2.warnings,
      issues: [],
      session_comparison_triggered: sessionCompTriggered,
      overlapping_files: overlap,
    };

    const { data: issues2 } = await supabase
      .from('issues')
      .select('title, level, file, fact')
      .eq('session_id', sid2);

    result.push2.issues = (issues2 ?? []).map((i) => ({
      title: i.title, level: i.level, file: i.file, fact: i.fact,
    }));

    console.log(`  이슈: ${analysis2.total_issues_found}건 감지, ${analysis2.issues_created}건 생성`);
    console.log(`  세션 비교 트리거: ${sessionCompTriggered ? '✅ YES' : '❌ NO'}`);
    console.log(`  토큰: 입력 ${analysis2.token_usage.input} / 출력 ${analysis2.token_usage.output}`);
    console.log(`  경고: ${analysis2.warnings.join(', ') || '없음'}\n`);

    // ── Step 6: 결과 상세 출력 ──
    console.log('[6/7] 결과 상세...');

    console.log('\n  === Push 1 이슈 ===');
    for (const issue of result.push1.issues) {
      const icon = { critical: '🔴', warning: '🟡', info: '🔵' }[issue.level] ?? '⚪';
      console.log(`  ${icon} [${issue.level}] ${issue.title} — ${issue.file}`);
    }

    console.log('\n  === Push 2 이슈 ===');
    for (const issue of result.push2.issues) {
      const icon = { critical: '🔴', warning: '🟡', info: '🔵' }[issue.level] ?? '⚪';
      console.log(`  ${icon} [${issue.level}] ${issue.title} — ${issue.file}`);
    }

    result.total_tokens = {
      input: result.push1.token_input + result.push2.token_input,
      output: result.push1.token_output + result.push2.token_output,
    };

    console.log(`\n  총 토큰: 입력 ${result.total_tokens.input} / 출력 ${result.total_tokens.output}`);

    // ── 결과 파일 저장 ──
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const resultPath = `docs/test-results/test1-session-comparison-${dateStr}.md`;

    const md = generateMarkdownReport(result, dateStr);
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

    console.log('\n=== ✅ 테스트 완료 ===');

  } catch (err) {
    console.error('\n❌ 테스트 실패:', (err as Error).message);
    console.error((err as Error).stack);

    if (projectId) {
      await supabase.from('projects').delete().eq('id', projectId);
    }
    if (testUserId) {
      await supabase.auth.admin.deleteUser(testUserId);
    }
    process.exit(1);
  }
}

// ─── Markdown 리포트 생성 ───

function generateMarkdownReport(r: TestResult, dateStr: string): string {
  const push1Issues = r.push1.issues
    .map((i) => `| ${i.level} | ${i.title} | ${i.file} | ${i.fact} |`)
    .join('\n');

  const push2Issues = r.push2.issues
    .map((i) => `| ${i.level} | ${i.title} | ${i.file} | ${i.fact} |`)
    .join('\n');

  return `# Test 1: 세션 간 비교 검증

- 실행일: ${dateStr}
- 목적: 연속 2개 세션 push 시 세션 간 비교(3-2)가 정상 작동하는지 검증

## 테스트 시나리오

1. Push 1 (Session A): 기초 코드 생성 (types.ts + projects/route.ts)
2. Push 2 (Session B): types.ts 확장(정상) + route.ts 인증 삭제(의도적 이슈) + deduct.ts 추가
3. 분석 2에서 세션 간 비교가 트리거되는지 확인

## 입력 데이터 요약

### Push 1
- JSONL: sample-session.jsonl (Pencil 세션 로그)
- Mock diff: ${r.push1.files_changed}개 파일
- 파일: src/lib/supabase/types.ts, app/api/projects/route.ts

### Push 2
- JSONL: sample-session.jsonl (sessionId 변경)
- Mock diff: ${r.push2.files_changed}개 파일
- 파일: types.ts(수정), route.ts(인증 삭제), deduct.ts(신규)
- 교집합: ${r.push2.overlapping_files.join(', ')}

## 결과

### 세션 간 비교

| 항목 | 결과 |
|------|------|
| 세션 비교 트리거 | ${r.push2.session_comparison_triggered ? '✅ YES' : '❌ NO'} |
| 교집합 파일 수 | ${r.push2.overlapping_files.length}개 |
| 교집합 파일 | ${r.push2.overlapping_files.join(', ')} |

### Push 1 감지 결과

- 이슈: ${r.push1.issues_found}건 감지, ${r.push1.issues_created}건 생성
- 토큰: 입력 ${r.push1.token_input} / 출력 ${r.push1.token_output}
- 경고: ${r.push1.warnings.join(', ') || '없음'}

| Level | Title | File | Fact |
|-------|-------|------|------|
${push1Issues || '| - | 이슈 없음 | - | - |'}

### Push 2 감지 결과

- 이슈: ${r.push2.issues_found}건 감지, ${r.push2.issues_created}건 생성
- 토큰: 입력 ${r.push2.token_input} / 출력 ${r.push2.token_output}
- 경고: ${r.push2.warnings.join(', ') || '없음'}

| Level | Title | File | Fact |
|-------|-------|------|------|
${push2Issues || '| - | 이슈 없음 | - | - |'}

## 토큰 소모량

| 구분 | Input | Output | 합계 |
|------|-------|--------|------|
| Push 1 | ${r.push1.token_input} | ${r.push1.token_output} | ${r.push1.token_input + r.push1.token_output} |
| Push 2 | ${r.push2.token_input} | ${r.push2.token_output} | ${r.push2.token_input + r.push2.token_output} |
| **총합** | **${r.total_tokens.input}** | **${r.total_tokens.output}** | **${r.total_tokens.input + r.total_tokens.output}** |

## 판정

- 세션 간 비교 작동: ${r.push2.session_comparison_triggered ? '**PASS**' : '**FAIL**'}
- 교집합 계산: ${r.push2.overlapping_files.length > 0 ? '**PASS**' : '**FAIL**'}
- 전체 결과: ${r.push2.session_comparison_triggered && r.push2.overlapping_files.length > 0 ? '**PASS**' : '**FAIL**'}
`;
}

main();
