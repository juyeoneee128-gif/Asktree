/**
 * Asktree E2E Test 3: OWASP/CWE 보안 감지 정확도
 *
 * 실행: npx tsx test/e2e-security-detection.ts
 *
 * ⚠️ 실제 Claude API 호출 (약 6,000 토큰, ~$0.03)
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

// ─── 7개 보안 취약점 Diff (compact) ───

const SECURITY_DIFFS: DiffEntry[] = [
  // 1. XSS
  { file_path: 'src/components/Comment.tsx', diff_content: `+export function Comment({ commentId }: { commentId: string }) {\n+  const [c, setC] = useState<any>(null);\n+  useEffect(() => fetch('/api/comments/'+commentId).then(r=>r.json()).then(setC), []);\n+  return <div dangerouslySetInnerHTML={{ __html: c?.body }} />;\n+}`, change_type: 'added' },
  // 2. SSRF
  { file_path: 'src/api/proxy/route.ts', diff_content: `+export async function POST(req: Request) {\n+  const { url } = await req.json();\n+  const res = await fetch(url);\n+  return NextResponse.json({ data: await res.text() });\n+}`, change_type: 'added' },
  // 3. Path Traversal
  { file_path: 'src/api/files/route.ts', diff_content: `+export async function GET(req: Request) {\n+  const name = new URL(req.url).searchParams.get('name');\n+  const content = readFileSync(path.join(process.cwd(), 'uploads', name!), 'utf-8');\n+  return NextResponse.json({ content });\n+}`, change_type: 'added' },
  // 4. Insecure Deserialization
  { file_path: 'src/utils/config-loader.ts', diff_content: `+export function loadConfig(p: string) {\n+  return eval('(' + require('fs').readFileSync(p,'utf-8') + ')');\n+}\n+export function parseUserConfig(input: string) {\n+  return new Function('return ' + input)();\n+}`, change_type: 'added' },
  // 5. JWT Secret
  { file_path: 'src/lib/jwt.ts', diff_content: `+const JWT_SECRET = 'my-super-secret-jwt-key-2026';\n+const REFRESH_SECRET = 'refresh-token-secret-key-private';\n+export function signToken(p: object) { return require('jsonwebtoken').sign(p, JWT_SECRET); }\n+export function signRefresh(p: object) { return require('jsonwebtoken').sign(p, REFRESH_SECRET); }`, change_type: 'added' },
  // 6. CORS
  { file_path: 'src/middleware/cors.ts', diff_content: `+export function corsMiddleware() {\n+  const r = NextResponse.next();\n+  r.headers.set('Access-Control-Allow-Origin', '*');\n+  r.headers.set('Access-Control-Allow-Credentials', 'true');\n+  return r;\n+}`, change_type: 'added' },
  // 7. Race Condition
  { file_path: 'src/api/credits/deduct/route.ts', diff_content: `+export async function POST(req: Request) {\n+  const { userId, amount } = await req.json();\n+  const { data: user } = await supabase.from('users').select('credits').eq('id', userId).single();\n+  if (!user || user.credits < amount) return NextResponse.json({ error: 'no' }, { status: 400 });\n+  await supabase.from('users').update({ credits: user.credits - amount }).eq('id', userId);\n+  return NextResponse.json({ remaining: user.credits - amount });\n+}`, change_type: 'added' },
];

// ─── 취약점 정의 ───

interface VulnDef {
  id: number;
  name: string;
  file: string;
  owasp: string;
  cwe: string;
  inPrompt: boolean;
  keywords: string[];  // 감지 판별용 키워드 (title/fact에 하나라도 포함되면 감지)
}

const VULNS: VulnDef[] = [
  { id: 1, name: 'XSS (dangerouslySetInnerHTML)', file: 'src/components/Comment.tsx', owasp: 'A03:2021', cwe: 'CWE-79', inPrompt: true, keywords: ['xss', 'dangerouslysetinnerhtml', 'innerHTML', '스크립트', '크로스사이트'] },
  { id: 2, name: 'SSRF (서버 사이드 요청 위조)', file: 'src/api/proxy/route.ts', owasp: 'A10:2021', cwe: 'CWE-918', inPrompt: false, keywords: ['ssrf', 'url', 'fetch', '요청 위조', '서버.*요청', 'proxy'] },
  { id: 3, name: 'Path Traversal (경로 조작)', file: 'src/api/files/route.ts', owasp: 'A01:2021', cwe: 'CWE-22', inPrompt: false, keywords: ['path', 'traversal', '경로', '디렉토리', 'filename', '파일.*접근', '../../'] },
  { id: 4, name: 'Insecure Deserialization (eval/Function)', file: 'src/utils/config-loader.ts', owasp: 'A08:2021', cwe: 'CWE-502', inPrompt: false, keywords: ['eval', 'function', '역직렬화', 'deserialization', '코드.*실행', '임의.*실행'] },
  { id: 5, name: 'JWT Secret 하드코딩', file: 'src/lib/jwt.ts', owasp: 'A02:2021', cwe: 'CWE-798', inPrompt: true, keywords: ['jwt', 'secret', '하드코딩', '시크릿', '토큰.*키'] },
  { id: 6, name: 'CORS 와일드카드', file: 'src/middleware/cors.ts', owasp: 'A05:2021', cwe: 'CWE-942', inPrompt: false, keywords: ['cors', 'origin', '와일드카드', 'allow-origin', '\\*'] },
  { id: 7, name: 'Race Condition (TOCTOU)', file: 'src/api/credits/deduct/route.ts', owasp: 'A04:2021', cwe: 'CWE-362', inPrompt: false, keywords: ['race', 'toctou', '동시', '경쟁', '차감.*동시', 'concurrent'] },
];

// ─── 타입 ───

interface IssueInfo {
  title: string;
  level: string;
  file: string;
  fact: string;
  basis: string;
  fix_command: string;
}

// ─── 메인 ───

async function main() {
  console.log('=== E2E Test 3: OWASP/CWE 보안 감지 정확도 ===');
  console.log('⚠️  실제 Claude API 호출 (약 6,000 토큰, ~$0.03)\n');

  let projectId: string | null = null;
  let testUserId: string | null = null;

  try {
    // ── Step 1: 프로젝트 생성 ──
    console.log('[1/5] 테스트 프로젝트 생성...');
    const testEmail = `e2e-security-${Date.now()}@asktree.dev`;
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: testEmail, password: 'e2e-test-password-12345', email_confirm: true,
      user_metadata: { full_name: 'E2E Security Test' },
    });
    if (authError || !authUser.user) throw new Error(`Auth: ${authError?.message}`);
    testUserId = authUser.user.id;

    const { data: project, error: projError } = await supabase
      .from('projects').insert({ user_id: testUserId, name: 'E2E Security Detection Test' })
      .select('id').single();
    if (projError || !project) throw new Error(`Project: ${projError?.message}`);
    projectId = project.id;
    console.log(`  project_id: ${projectId}\n`);

    // ── Step 2: Push ──
    console.log('[2/5] Push: 7개 보안 취약점 diff...');
    const jsonl = readFileSync('test/fixtures/sample-session.jsonl', 'utf-8');
    const parsed = parseSession(jsonl);
    const saveResult = await saveSession(projectId, parsed);
    if ('duplicate' in saveResult) throw new Error('중복');
    const sid = saveResult.saved.id;
    await saveEphemeralDiffs(sid, SECURITY_DIFFS);
    await mergeChangedFiles(sid, SECURITY_DIFFS.map((d) => d.file_path));
    await updateAgentStatus(projectId);
    console.log(`  session: #${saveResult.saved.number}, ${SECURITY_DIFFS.length}파일\n`);

    // ── Step 3: 분석 ──
    console.log('[3/5] 분석 실행...');
    const startTime = Date.now();
    const analysis = await runAnalysis(projectId, sid);
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    const { data: issues } = await supabase
      .from('issues')
      .select('title, level, file, fact, basis, fix_command')
      .eq('session_id', sid);
    const allIssues = (issues ?? []) as IssueInfo[];

    console.log(`  ⏱️ ${elapsed}초`);
    console.log(`  이슈: ${allIssues.length}건`);
    console.log(`  토큰: ${analysis.token_usage.input}+${analysis.token_usage.output}\n`);

    // ── Step 4: 판정 ──
    console.log('[4/5] 판정...\n');

    const detectionResults: { vuln: VulnDef; detected: boolean; matchedIssues: IssueInfo[] }[] = [];
    const matchedIssueIds = new Set<number>();

    for (const vuln of VULNS) {
      const matched: IssueInfo[] = [];

      for (let i = 0; i < allIssues.length; i++) {
        const issue = allIssues[i];

        // 파일 매칭 또는 키워드 매칭
        const textToSearch = `${issue.title} ${issue.fact} ${issue.basis}`.toLowerCase();
        const fileMatch = issue.file === vuln.file;
        const kwMatch = vuln.keywords.some((kw) => new RegExp(kw, 'i').test(textToSearch));

        if (fileMatch || kwMatch) {
          matched.push(issue);
          matchedIssueIds.add(i);
        }
      }

      detectionResults.push({ vuln, detected: matched.length > 0, matchedIssues: matched });

      const icon = matched.length > 0 ? '✅' : '❌';
      const promptTag = vuln.inPrompt ? '(프롬프트 명시)' : '(프롬프트 미명시)';
      console.log(`  ${icon} #${vuln.id} ${vuln.name} ${promptTag}`);
      if (matched.length > 0) {
        for (const m of matched) {
          console.log(`     → [${m.level}] ${m.title}`);
          console.log(`       ${m.fact.slice(0, 120)}`);
        }
      } else {
        console.log(`     → 미감지`);
      }
      console.log('');
    }

    // false positive 체크
    const fpIssues = allIssues.filter((_, i) => !matchedIssueIds.has(i));

    const detected = detectionResults.filter((r) => r.detected).length;
    const total = VULNS.length;
    console.log(`  === 감지율: ${detected}/${total} ===\n`);

    if (fpIssues.length > 0) {
      console.log(`  === False Positive: ${fpIssues.length}건 ===`);
      for (const fp of fpIssues) {
        console.log(`  ⚠️ [${fp.level}] ${fp.title} — ${fp.file}`);
        console.log(`     ${fp.fact.slice(0, 120)}`);
      }
      console.log('');
    }

    // ── 결과 저장 ──
    const dateStr = new Date().toISOString().slice(0, 10);
    const resultPath = `docs/test-results/test3-security-detection-${dateStr}.md`;
    const md = generateReport(detectionResults, allIssues, fpIssues, analysis, dateStr);
    mkdirSync('docs/test-results', { recursive: true });
    writeFileSync(resultPath, md, 'utf-8');
    console.log(`  📄 결과 저장: ${resultPath}`);

    // ── Step 5: 정리 ──
    console.log('\n[5/5] 정리...');
    await supabase.from('projects').delete().eq('id', projectId);
    projectId = null;
    await supabase.auth.admin.deleteUser(testUserId);
    testUserId = null;
    console.log('  삭제 완료');

    console.log(`\n=== ${detected >= 6 ? '✅' : '⚠️'} 감지율: ${detected}/${total} ===`);

  } catch (err) {
    console.error('\n❌ 실패:', (err as Error).message);
    console.error((err as Error).stack);
    if (projectId) await supabase.from('projects').delete().eq('id', projectId);
    if (testUserId) await supabase.auth.admin.deleteUser(testUserId);
    process.exit(1);
  }
}

// ─── Markdown ───

function generateReport(
  results: { vuln: VulnDef; detected: boolean; matchedIssues: IssueInfo[] }[],
  allIssues: IssueInfo[],
  fpIssues: IssueInfo[],
  analysis: { token_usage: { input: number; output: number }; warnings: string[] },
  dateStr: string
): string {
  const detected = results.filter((r) => r.detected).length;
  const total = results.length;

  const detectionTable = results.map((r) => {
    const status = r.detected ? 'PASS' : 'FAIL';
    const prompt = r.vuln.inPrompt ? '✅' : '❌';
    const issueStr = r.matchedIssues.map((i) => `[${i.level}] ${i.title}`).join('<br>') || '-';
    return `| ${status} | ${r.vuln.id}. ${r.vuln.name} | ${r.vuln.owasp} | ${r.vuln.cwe} | ${prompt} | ${issueStr} |`;
  }).join('\n');

  const allIssueTable = allIssues.map((i) =>
    `| ${i.level} | ${i.title} | ${i.file} | ${i.fact} | ${i.basis} |`
  ).join('\n');

  const fpTable = fpIssues.length > 0
    ? fpIssues.map((i) => `| ${i.level} | ${i.title} | ${i.file} | ${i.fact} |`).join('\n')
    : '| - | False Positive 없음 | - | - |';

  // 미감지 항목 개선안
  const missed = results.filter((r) => !r.detected);
  let improvementSection = '';
  if (missed.length > 0) {
    const improvements = missed.map((r) => {
      const suggestions: Record<string, string> = {
        'SSRF': `9. **SSRF (Server-Side Request Forgery)** (critical) — 사용자 입력 URL로 서버에서 fetch/axios/http 요청. 내부 네트워크 접근 위험`,
        'Path Traversal': `10. **경로 조작 (Path Traversal)** (critical) — 사용자 입력을 파일 경로에 직접 사용 (../../ 등). fs.readFile, path.join에 미검증 입력`,
        'Insecure Deserialization': `11. **안전하지 않은 코드 실행** (critical) — eval(), new Function(), vm.runInContext 등으로 외부 데이터 실행`,
        'CORS': `12. **CORS 와일드카드** (warning) — Access-Control-Allow-Origin: * 와 Credentials: true 동시 설정`,
        'Race Condition': `13. **Race Condition (TOCTOU)** (warning) — 조회→검증→갱신 사이에 동시 요청으로 데이터 무결성 훼손. 트랜잭션/락 미사용`,
      };
      const key = Object.keys(suggestions).find((k) => r.vuln.name.includes(k)) ?? '';
      return `### ${r.vuln.id}. ${r.vuln.name}\n- OWASP: ${r.vuln.owasp} / ${r.vuln.cwe}\n- 추가할 프롬프트 카테고리:\n\`\`\`\n${suggestions[key] ?? '(카테고리 추가 필요)'}\n\`\`\`\n`;
    }).join('\n');

    improvementSection = `## 프롬프트 개선안 (미감지 ${missed.length}건)

${improvements}

### prompts.ts 수정 방법
\`STATIC_ANALYSIS_SYSTEM\`의 \`## 감지 카테고리\` 섹션에 위 항목을 추가하면 됩니다.
`;
  }

  return `# Test 3: OWASP/CWE 보안 감지 정확도

- 실행일: ${dateStr}
- 목적: 7개 실전 보안 취약점에 대한 정적 분석 감지율 측정

## 감지율: ${detected}/${total} (${Math.round(detected / total * 100)}%)

| 판정 | 취약점 | OWASP | CWE | 프롬프트 명시 | 감지된 이슈 |
|------|--------|-------|-----|-------------|------------|
${detectionTable}

## 전체 감지 이슈 (${allIssues.length}건)

| Level | Title | File | Fact | Basis |
|-------|-------|------|------|-------|
${allIssueTable || '| - | - | - | - | - |'}

## False Positive

| Level | Title | File | Fact |
|-------|-------|------|------|
${fpTable}

## 토큰 소모

| Input | Output | 합계 |
|-------|--------|------|
| ${analysis.token_usage.input} | ${analysis.token_usage.output} | ${analysis.token_usage.input + analysis.token_usage.output} |

${improvementSection}

## 경고

${analysis.warnings.map((w) => `- ${w}`).join('\n') || '- 없음'}
`;
}

main();
