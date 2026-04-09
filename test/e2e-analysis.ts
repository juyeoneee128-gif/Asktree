/**
 * Asktree E2E Analysis Test
 *
 * 실행: npx tsx test/e2e-analysis.ts
 *
 * ⚠️ 실제 Claude API를 호출합니다 (약 2,300 토큰, ~$0.02 소모)
 * ⚠️ .env.local에 ANTHROPIC_API_KEY, SUPABASE_URL, SERVICE_ROLE_KEY 필요
 * ⚠️ 002_agent_pipeline.sql 마이그레이션이 Supabase에 적용되어 있어야 합니다
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { parseSession } from '../src/lib/agent/parse-session';
import { saveSession, updateAgentStatus } from '../src/lib/agent/save-session';
import { saveEphemeralDiffs } from '../src/lib/agent/ephemeral';
import { runAnalysis } from '../src/lib/analysis/run-analysis';
import type { Database } from '../src/lib/supabase/types';
import type { DiffEntry } from '../src/lib/agent/validate-payload';

// ─── 설정 ───

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 테스트용 mock diff (의도적 보안 이슈 포함)
const TEST_DIFFS: DiffEntry[] = [
  {
    file_path: 'src/config.ts',
    diff_content: `@@ -1,3 +1,5 @@
+const API_KEY = "sk-ant-api03-FAKE-KEY-DO-NOT-USE";
+const DB_PASSWORD = "super_secret_123";
 export const config = {
-  apiKey: process.env.API_KEY,
+  apiKey: API_KEY,
+  dbPassword: DB_PASSWORD,
 };`,
    change_type: 'modified',
  },
  {
    file_path: 'src/api/users.ts',
    diff_content: `@@ -0,0 +1,6 @@
+export async function getUsers(req, res) {
+  const users = await db.query("SELECT * FROM users WHERE name = '" + req.query.name + "'");
+  console.log("User password:", users[0].password);
+  res.json(users);
+}`,
    change_type: 'added',
  },
];

// ─── 헬퍼 ───

function log(step: string, msg: string) {
  console.log(`  ${msg}`);
}

function header(step: string) {
  console.log(`\n${step}`);
}

// ─── 메인 ───

async function main() {
  console.log('=== Asktree E2E Analysis Test ===');
  console.log('⚠️  실제 Claude API 호출 (약 2,300 토큰, ~$0.02)');
  console.log('');

  let projectId: string | null = null;

  try {
    // ── Step 1: 테스트 프로젝트 생성 ──
    header('[1/6] 테스트 프로젝트 생성...');

    // Supabase Auth에 테스트 유저 생성 (auth.users → trigger로 public.users 자동 생성)
    const testEmail = `e2e-test-${Date.now()}@asktree.dev`;
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: 'e2e-test-password-12345',
      email_confirm: true,
      user_metadata: { full_name: 'E2E Test User' },
    });

    if (authError || !authUser.user) {
      throw new Error(`Auth 유저 생성 실패: ${authError?.message}`);
    }

    const testUserId = authUser.user.id;
    log('1', `테스트 유저 생성: ${testUserId} (${testEmail})`);

    const { data: project, error: projError } = await supabase
      .from('projects')
      .insert({ user_id: testUserId, name: 'E2E Test Project' })
      .select('id, agent_token')
      .single();

    if (projError || !project) {
      throw new Error(`프로젝트 생성 실패: ${projError?.message}`);
    }

    projectId = project.id;
    log('1', `project_id: ${projectId}`);
    log('1', `agent_token: ${project.agent_token}`);

    // ── Step 2: JSONL 파싱 + 세션 저장 ──
    header('[2/6] JSONL 파싱 + 세션 저장...');

    const jsonlLog = readFileSync('test/fixtures/sample-session.jsonl', 'utf-8');
    const parsed = parseSession(jsonlLog);

    log('2', `제목: ${parsed.title}`);
    log('2', `프롬프트: ${parsed.prompts.length}개`);
    log('2', `변경 파일(JSONL): ${parsed.changed_files}개`);

    const saveResult = await saveSession(projectId, parsed);
    if ('duplicate' in saveResult) {
      throw new Error('중복 세션');
    }

    const sessionId = saveResult.saved.id;
    log('2', `session_id: ${sessionId}`);
    log('2', `session_number: ${saveResult.saved.number}`);

    // ── Step 3: Ephemeral diff 저장 ──
    header('[3/6] Ephemeral diff 저장...');

    await saveEphemeralDiffs(sessionId, TEST_DIFFS);
    log('3', `${TEST_DIFFS.length}개 diff 저장 완료`);
    log('3', `파일: ${TEST_DIFFS.map((d) => d.file_path).join(', ')}`);

    // 에이전트 상태 업데이트
    await updateAgentStatus(projectId);
    log('3', '에이전트 상태: connected');

    // ── Step 4: 분석 실행 ──
    header('[4/6] 분석 엔진 실행 (Claude API 호출)...');
    log('4', '⏳ Claude Sonnet API 호출 중...');

    const startTime = Date.now();
    const analysisResult = await runAnalysis(projectId, sessionId);
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    log('4', `⏱️  소요 시간: ${elapsed}초`);
    log('4', `감지된 이슈: ${analysisResult.total_issues_found}건`);
    log('4', `신규 생성: ${analysisResult.issues_created}건`);
    log('4', `재감지: ${analysisResult.issues_redetected}건`);
    log('4', `토큰: 입력 ${analysisResult.token_usage.input} / 출력 ${analysisResult.token_usage.output}`);

    if (analysisResult.warnings.length > 0) {
      log('4', `경고: ${analysisResult.warnings.join(', ')}`);
    }

    // ── Step 5: DB 결과 검증 ──
    header('[5/6] DB 결과 검증...');

    // 세션 확인
    const { data: savedSession } = await supabase
      .from('sessions')
      .select('id, number, title, summary, files_changed')
      .eq('id', sessionId)
      .single();

    if (savedSession) {
      log('5', `세션: #${savedSession.number} "${savedSession.title}"`);
      log('5', `요약: ${savedSession.summary}`);
    }

    // 이슈 확인
    const { data: issues } = await supabase
      .from('issues')
      .select('title, level, fact, fix_command, file, basis, status')
      .eq('session_id', sessionId)
      .order('level');

    if (issues && issues.length > 0) {
      log('5', `\n  === 감지된 이슈 (${issues.length}건) ===`);
      for (const issue of issues) {
        const levelColor = { critical: '🔴', warning: '🟡', info: '🔵' }[issue.level] ?? '⚪';
        console.log(`  ${levelColor} [${issue.level}] ${issue.title}`);
        console.log(`     파일: ${issue.file}`);
        console.log(`     사실: ${issue.fact}`);
        console.log(`     Fix: ${issue.fix_command}`);
        console.log(`     근거: ${issue.basis}`);
        console.log('');
      }
    } else {
      log('5', '이슈 없음 (분석에서 이슈를 감지하지 못함)');
    }

    // ephemeral 삭제 확인
    const { data: ephemeral } = await supabase
      .from('ephemeral_data')
      .select('id')
      .eq('session_id', sessionId);

    log('5', `Ephemeral 잔여: ${ephemeral?.length ?? 0}건 (0이면 정상 삭제)`);

    // ── Step 6: 정리 ──
    header('[6/6] 정리...');

    await supabase.from('projects').delete().eq('id', projectId);
    projectId = null;
    log('6', '테스트 프로젝트 삭제 완료 (cascade: sessions, issues, ephemeral)');

    // 테스트 유저도 정리 (auth.users 삭제 → cascade로 public.users도 삭제)
    await supabase.auth.admin.deleteUser(testUserId);
    log('6', '테스트 유저 삭제 완료');

    console.log('\n=== ✅ 테스트 완료 ===');
    console.log(`총 토큰: 입력 ${analysisResult.token_usage.input} / 출력 ${analysisResult.token_usage.output}`);

  } catch (err) {
    console.error('\n❌ 테스트 실패:', (err as Error).message);
    console.error((err as Error).stack);

    // 실패 시에도 정리
    if (projectId) {
      console.log('\n정리 중...');
      await supabase.from('projects').delete().eq('id', projectId);
      // cleanup에서는 userId를 모르므로 프로젝트만 삭제
      console.log('테스트 프로젝트 정리 완료');
    }

    process.exit(1);
  }
}

main();
