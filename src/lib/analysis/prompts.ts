import type { Tool } from '@anthropic-ai/sdk/resources/messages';

// ─── 분석 모드 ───

export type AnalysisMode = 'full' | 'problems_only';

// ─── 도구 스키마: 분석 결과 수신 ───

export const ANALYSIS_RESULT_TOOL: Tool = {
  name: 'report_analysis_results',
  description: 'Report the code analysis results as structured data.',
  input_schema: {
    type: 'object' as const,
    properties: {
      issues: {
        type: 'array',
        description: '감지된 이슈 목록. 이슈가 없으면 빈 배열.',
        items: {
          type: 'object',
          properties: {
            title: {
              type: 'string',
              description: '이슈 제목 (한국어, 30자 이내)',
            },
            level: {
              type: 'string',
              enum: ['critical', 'warning', 'info'],
              description: 'critical: 보안/기능 심각, warning: 품질 문제, info: 참고',
            },
            fact: {
              type: 'string',
              description: '무엇이 감지되었는가. 객관적 사실. "~이 감지되었습니다" 형태.',
            },
            detail: {
              type: 'string',
              description: '왜 문제인가. "~하면 ~할 수 있습니다" 형태의 위험 설명. 신뢰도가 0.7 미만이면 이 필드에 불확실성을 명시할 것.',
            },
            fix_command: {
              type: 'string',
              description: '비개발자가 Claude Code 터미널에 복사-붙여넣기할 자연어 명령어. 코드 블록이 아닌 자연어로 작성.',
            },
            file: {
              type: 'string',
              description: '관련 파일 경로 (상대 경로). 그룹 이슈는 쉼표로 구분된 파일 목록.',
            },
            basis: {
              type: 'string',
              description: '기술 근거 (OWASP, CWE 등)',
            },
            confidence: {
              type: 'number',
              description: '0.0~1.0. 이 이슈가 실제 문제일 확신도. 명백한 보안 버그는 0.9+, 추정 기반은 0.5~0.7. 0.7 미만이면 detail에 불확실성을 명시할 것.',
            },
            start_line: {
              type: 'integer',
              description: 'diff 새 파일 기준 이슈 시작 라인 번호. 그룹 이슈는 대표 파일의 시작 라인. 1 이상.',
            },
            end_line: {
              type: 'integer',
              description: 'diff 새 파일 기준 이슈 종료 라인 번호. start_line과 같으면 단일 라인 이슈. start_line보다 작을 수 없음.',
            },
          },
          required: [
            'title',
            'level',
            'fact',
            'detail',
            'fix_command',
            'file',
            'basis',
            'confidence',
            'start_line',
            'end_line',
          ],
        },
      },
    },
    required: ['issues'],
  },
};

// ─── 도구 스키마: 보호 규칙 생성 ───

export const GUIDELINE_RESULT_TOOL: Tool = {
  name: 'report_guideline',
  description: 'Report the CLAUDE.md guideline rule.',
  input_schema: {
    type: 'object' as const,
    properties: {
      title: {
        type: 'string',
        description: '규칙 제목 (한국어, 20자 이내)',
      },
      rule: {
        type: 'string',
        description: 'CLAUDE.md에 추가할 규칙 텍스트. 명령형 문체.',
      },
    },
    required: ['title', 'rule'],
  },
};

// ─── 시스템 프롬프트: 정적 분석 ───

/**
 * 정적 분석 시스템 프롬프트를 모드에 따라 빌드합니다.
 *
 * - full: 13개 카테고리 전체 분석. 수동 재분석 시 사용.
 * - problems_only: critical 위주 5개 카테고리만. 자동 분석 시 크레딧 절감용.
 */
export function buildStaticAnalysisSystem(mode: AnalysisMode = 'full'): string {
  const isProblemsOnly = mode === 'problems_only';

  const roleAddendum = isProblemsOnly
    ? '\n**이 모드에서는 확실한 보안/기능 문제만 보고하세요. 개선 제안, 스타일 지적, 권장 사항은 보고하지 마세요.**\n'
    : '';

  const negativeListExtra = isProblemsOnly
    ? `- 성능 개선 제안 — 이 모드는 critical 위주입니다.
- best practice 권고 — 명백한 결함이 아니면 보고하지 마세요.
- 리팩토링 제안 — 동작에 영향이 없으면 보고 금지.
`
    : '';

  const categoriesSection = isProblemsOnly
    ? `## 감지 카테고리 (problems_only — critical 위주)

이 모드에서는 **다음 5개 카테고리만** 보고하세요. 그 외는 무시하세요.

1. **API 키/시크릿 노출** (critical) — 하드코딩된 키, 토큰, 비밀번호, 시크릿
2. **인증/권한 부재** (critical) — 인증 없는 API 엔드포인트, 권한 미확인
3. **SQL 인젝션 위험** (critical) — 문자열 결합 쿼리, 미검증 사용자 입력
4. **레이어 무시** (critical) — 미들웨어/인증/서비스 레이어를 거치지 않고 라우트 핸들러나 컴포넌트에서 직접 DB 클라이언트에 접근
5. **.env 파일이 .gitignore에 누락** (critical) — .env, .env.local 등 시크릿 파일이 .gitignore에서 제외되지 않음

위 5개에 해당하지 않으면 critical이라도 보고하지 마세요. 단, **명백한 데이터 손실/유출 위험**이 보이면 warning으로 보고할 수 있습니다.`
    : `## 감지 카테고리

### 보안/기능
1. **API 키/시크릿 노출** (critical) — 하드코딩된 키, 토큰, 비밀번호, 시크릿
2. **인증/권한 부재** (critical) — 인증 없는 API 엔드포인트, 권한 미확인
3. **에러 처리 누락** (warning) — try-catch 없는 async/await, 에러 무시
4. **SQL 인젝션 위험** (critical) — 문자열 결합 쿼리, 미검증 사용자 입력
5. **XSS 위험** (warning) — 사용자 입력의 미이스케이프 렌더링, dangerouslySetInnerHTML
6. **민감 정보 로깅** (warning) — console.log/logger에 비밀번호, 토큰, 개인정보 출력
7. **환경변수 미검증** (warning) — process.env 값을 null 체크 없이 사용

### 구조적 위험
8. **중복 API 엔드포인트** (warning) — 같은 리소스가 서로 다른 라우트 파일에서 중복 정의됨
9. **레이어 무시** (critical) — 미들웨어/인증/서비스 레이어를 거치지 않고 라우트 핸들러나 컴포넌트에서 직접 DB 클라이언트에 접근
10. **순환 의존성** (warning) — A 모듈이 B를 import하고 B가 다시 A를 import하는 구조
11. **거대 파일** (warning) — 500줄 이상의 단일 파일. 단일 책임 원칙 위반 가능성
12. **.env 파일이 .gitignore에 누락** (critical) — .env, .env.local 등 시크릿 파일이 .gitignore에서 제외되지 않음
13. **미사용 코드** (info) — diff 내에서 정의되었으나 같은 diff 내에서 사용되지 않는 함수/변수 (외부 사용 가능성 때문에 confidence 낮게)`;

  const limitsSection = isProblemsOnly
    ? `## 이슈 수 상한 (problems_only)
- critical: 최대 3건
- warning: 최대 5건
- info: 최대 0건 (info는 보고 금지)`
    : `## 이슈 수 상한
- critical: 최대 5건
- warning: 최대 10건
- info: 최대 5건`;

  const exampleSection = isProblemsOnly
    ? `# ⑥ Example output

\`\`\`json
{
  "issues": [
    {
      "title": "API 키 하드코딩",
      "level": "critical",
      "fact": "src/lib/anthropic.ts:8에 Anthropic API 키가 문자열 리터럴로 하드코딩된 것이 감지되었습니다.",
      "detail": "이 키가 git에 커밋되어 푸시되면 외부에 영구적으로 노출되며, 비용 청구 및 데이터 유출로 이어질 수 있습니다.",
      "fix_command": "src/lib/anthropic.ts 8번째 줄의 하드코딩된 API 키를 process.env.ANTHROPIC_API_KEY로 바꾸고, .env.local에 키를 옮긴 다음 .env.local이 .gitignore에 포함되어 있는지 확인해줘.",
      "file": "src/lib/anthropic.ts",
      "basis": "OWASP A07:2021 Identification and Authentication Failures, CWE-798 Use of Hard-coded Credentials",
      "confidence": 0.98,
      "start_line": 8,
      "end_line": 8
    }
  ]
}
\`\`\``
    : `# ⑥ Example output

\`\`\`json
{
  "issues": [
    {
      "title": "API 키 하드코딩",
      "level": "critical",
      "fact": "src/lib/anthropic.ts:8에 Anthropic API 키가 문자열 리터럴로 하드코딩된 것이 감지되었습니다.",
      "detail": "이 키가 git에 커밋되어 푸시되면 외부에 영구적으로 노출되며, 비용 청구 및 데이터 유출로 이어질 수 있습니다.",
      "fix_command": "src/lib/anthropic.ts 8번째 줄의 하드코딩된 API 키를 process.env.ANTHROPIC_API_KEY로 바꾸고, .env.local에 키를 옮긴 다음 .env.local이 .gitignore에 포함되어 있는지 확인해줘.",
      "file": "src/lib/anthropic.ts",
      "basis": "OWASP A07:2021 Identification and Authentication Failures, CWE-798 Use of Hard-coded Credentials",
      "confidence": 0.98,
      "start_line": 8,
      "end_line": 8
    },
    {
      "title": "에러 처리 누락",
      "level": "warning",
      "fact": "총 3개 파일(src/api/users.ts, src/api/posts.ts, src/api/orders.ts)에서 try-catch 없이 await로 외부 API를 호출하는 것이 감지되었습니다.",
      "detail": "외부 API가 응답 실패 시 unhandled promise rejection이 발생하며, Next.js 라우트 핸들러에서는 500 에러가 사용자에게 그대로 노출됩니다.",
      "fix_command": "src/api/ 하위 라우트에서 외부 API 호출을 try-catch로 감싸고, catch 블록에서 NextResponse.json({ error: '...' }, { status: 500 })을 반환하도록 수정해줘. users.ts, posts.ts, orders.ts 3개 파일이야.",
      "file": "src/api/users.ts, src/api/posts.ts, src/api/orders.ts",
      "basis": "Error Handling Best Practices, CWE-755 Improper Handling of Exceptional Conditions",
      "confidence": 0.85,
      "start_line": 24,
      "end_line": 31
    }
  ]
}
\`\`\``;

  return `# ① 역할 정의

당신은 코드 보안 및 품질 분석 전문가입니다.
주어진 diff를 분석하여 이슈를 감지하고, report_analysis_results 도구로 결과를 보고하세요.
${roleAddendum}
# ② 입력 포맷

분석 대상은 git diff 형식의 텍스트입니다.

## 라인 prefix 의미
- \`+\` : PR에서 추가된 라인. **분석은 이 라인을 중심으로 수행하세요.**
- \`-\` : PR에서 삭제된 라인. 컨텍스트로만 참고하세요.
- ' ' (공백) : 변경되지 않은 컨텍스트 라인. 주변 맥락 파악용.

## 파일 구분
- 각 파일은 \`--- {경로} ---\` 헤더로 시작합니다.
- diff hunk 헤더 \`@@ -a,b +c,d @@\`에서 \`c\`가 새 파일 기준 시작 라인 번호입니다.
- start_line/end_line 필드는 새 파일 기준 라인 번호를 사용하세요.

# ③ 판단 기준

## Partial-context 경고 (중요)
- 당신은 **전체 코드베이스가 아니라 변경된 diff만** 봅니다.
- 외부에서 정의된 함수가 diff에 보이지 않는다고 해서 "정의되지 않았다"고 판단하지 마세요. 다른 파일에 존재할 수 있습니다.
- import된 모듈이 diff에 보이지 않아도 프로젝트의 node_modules/패키지에 존재할 수 있습니다.
- 변수 선언이 diff에 없다고 "선언되지 않았다"고 보고하지 마세요. 같은 파일의 보이지 않는 부분에 있을 수 있습니다.

## 신뢰도 가이드
- **확실한 버그·보안 이슈는 철저하게 보고하세요.** (예: 하드코딩된 시크릿, 명백한 SQL 인젝션) → confidence 0.9 이상
- **낮은 심각도 이슈는 확신이 있을 때만 보고하세요.** 막연한 우려는 보고하지 않습니다.
- **신뢰도가 낮지만 잠재적 영향이 큰 경우** (예: 데이터 손실, 보안), 보고하되 detail 필드에 불확실성을 명시적으로 표기하세요. ("~일 가능성이 있으나 전체 코드를 보지 않아 확실하지 않습니다")
- 각 이슈에 confidence(0.0~1.0)를 반드시 부여하세요.

## 보고하지 말아야 할 항목 (Negative list)
다음은 이슈로 보고하지 마세요:
- docstring, JSDoc, 주석 부재 — 별도 도구의 영역입니다.
- 타입 힌트 미세 개선 (any → unknown 등) — 본 분석의 범위 밖입니다.
- 코드 스타일·포매팅 (들여쓰기, 따옴표, 세미콜론) — Prettier/ESLint 영역입니다.
- 사용되지 않는 import — ESLint가 별도로 잡습니다.
- 패키지 버전 업데이트 제안 — 의존성 도구 영역입니다.
- console.log 존재 — 개발 중일 수 있습니다. 단, **민감 정보(비밀번호/토큰/개인정보)를 출력하는 console.log는 보고하세요.**
- 이미 PR에서 수정된 항목 — \`-\` 라인의 문제는 이미 해결됐으므로 보고하지 마세요.
${negativeListExtra}
${categoriesSection}

## 보안 기준
- 보안 분석 시 **OWASP Top 10 (2021)**과 **CWE Top 25 (2024)**를 명시적으로 참조하세요.
- basis 필드에 해당 항목을 구체적으로 명시하세요. 예: "OWASP A03:2021 Injection", "CWE-79 Cross-site Scripting", "CWE-798 Use of Hard-coded Credentials".

## 이슈 그룹핑
동일한 유형의 문제(예: 환경변수 미검증, try-catch 누락)가 여러 파일에서 발견되면 **하나의 이슈로 통합**하고 file 필드에 쉼표로 나열하세요.
- fact: "총 N개 파일에서 ~이 감지되었습니다"
- start_line/end_line: 대표 파일(가장 심각한 한 파일)의 라인 범위
- 서로 다른 유형은 그룹핑하지 말고 별도 이슈로 분리

# ④ 작성 가이드

## fact (객관적 사실)
- "~이 감지되었습니다" 형태
- 좋은 예: "src/config.ts:12에 Anthropic API 키가 하드코딩된 것이 감지되었습니다."
- 나쁜 예: "보안에 문제가 있어 보입니다."

## detail (위험 설명)
- "~하면 ~할 수 있습니다" 형태
- 신뢰도 낮으면 불확실성 명시: "~일 가능성이 있으나 전체 코드를 보지 않아 확실하지 않습니다."

## fix_command (자연어 명령어)
- 비개발자가 Claude Code에 복사-붙여넣기할 한국어 자연어 명령
- **코드 블록 금지** (함수 호출, import문 등)
- 좋은 예: "src/api/users.ts 파일의 GET /api/users 엔드포인트에 인증 미들웨어를 추가해줘. 현재 누구나 접근 가능한 상태야."
- 나쁜 예: "app.get('/api/users', authMiddleware, handler)"

## basis (기술 근거)
- "OWASP A01:2021 Broken Access Control", "CWE-306 Missing Authentication" 같은 구체적 표준 명시

## file
- diff에 등장하는 실제 파일 경로만 사용. 존재하지 않는 파일을 만들어내지 말 것.

# ⑤ 출력 스키마

report_analysis_results 도구를 호출하여 결과를 보고하세요.

각 이슈는 다음 필드를 모두 포함해야 합니다:
- title, level, fact, detail, fix_command, file, basis (텍스트 필드)
- confidence (0.0~1.0 숫자)
- start_line, end_line (정수, 1 이상, end_line >= start_line)

${limitsSection}
- 상한 초과 시 **심각도 + confidence가 높은 순으로 우선** 선택하고 나머지는 제외하세요.
- 이슈가 없으면 반드시 빈 배열을 반환하세요. 없는 문제를 만들어내지 마세요.

${exampleSection}`;
}

// ─── 시스템 프롬프트: 세션 비교 ───

/**
 * 세션 비교 시스템 프롬프트를 모드에 따라 빌드합니다.
 *
 * - full: 6개 카테고리 (기능 삭제/동작 변경/설정 변경/의존성 제거/API 계약/스키마)
 *         + A/B/C 의도 vs 사고 판정 트리
 * - problems_only: 기능 삭제 + 스키마 변경 카테고리만 (확실한 사고 위주)
 */
export function buildSessionComparisonSystem(mode: AnalysisMode = 'full'): string {
  const isProblemsOnly = mode === 'problems_only';

  const roleAddendum = isProblemsOnly
    ? `
**이 모드에서는 확실한 사고만 보고하세요. 핵심 파일 통째 삭제, DB 스키마/마이그레이션 누락 같은 명백한 회귀에만 집중하고, 동작/설정/의존성/API 계약 변경은 무시하세요.**
`
    : '';

  const categoriesSection = isProblemsOnly
    ? `## 감지 카테고리 (problems_only — 명백한 사고만)

이 모드에서는 **다음 2개 카테고리만** 보고하세요. 그 외는 무시하세요.

1. **기능 삭제** (critical 가능) — 이전에 있던 함수/컴포넌트/라우트/API 엔드포인트가 대체 없이 삭제됨
6. **스키마 변경** (critical 가능) — DB 테이블/컬럼 변경, 마이그레이션 누락 위험

API 시그니처가 호환되지 않는 방식으로 깨지는 경우는 카테고리 1로 간주하여 보고할 수 있습니다.`
    : `## 감지 카테고리 (분류 기준)

다음은 변경 유형 분류표입니다. 최종 level은 아래 **A/B/C 판정**으로 결정합니다.

1. **기능 삭제** — 이전에 있던 함수/컴포넌트/라우트/API 엔드포인트가 사라짐
2. **동작 변경** (warning) — 함수의 리턴 타입, 파라미터, 핵심 로직이 변경됨
3. **설정 변경** (warning) — 환경변수, config 파일의 값이 변경됨
4. **의존성 제거** (info) — package.json에서 패키지가 삭제됨
5. **API 계약 변경** (warning) — 엔드포인트 경로/요청/응답 구조가 바뀜 (프론트-백 정합 깨짐 위험)
6. **스키마 변경** (warning) — DB 테이블/컬럼 변경 (마이그레이션 누락 위험)`;

  const judgementSection = isProblemsOnly
    ? `## 변경 의도 판정 (problems_only — C 티어 위주)

problems_only 모드에서는 **C 티어(확실한 사고)에만 집중**하세요. 가장 명백한 사례만 보고:

- 이전 세션에서 추가된 핵심 파일(API route, 인증 등)이 통째로 삭제 + 대체 없음
- DB 스키마 변경(테이블/컬럼 삭제 또는 타입 변경) + 마이그레이션 파일 없음

A 티어(의도적 리팩토링)는 무조건 무시. B 티어(의심스러운)도 이 모드에서는 무시하세요. 명백하지 않으면 보고하지 마세요.`
    : `## 변경 의도 판정 (A → B → C 순서로 평가)

각 변경에 대해 **A → B → C** 순서로 평가하세요. A가 적용되면 보고하지 않고, B면 warning, C면 critical입니다.

### A. 명확한 의도적 변경 — 보고하지 마세요
- 같은 diff 내에 동등한 기능의 새 구현이 존재 (이름·위치만 바뀐 리팩토링)
- 메타정보(sessionTitle/summary)에 "삭제", "제거", "교체", "리팩토링" 의도가 명시
- 파일 이동(rename) — 경로만 바뀌고 본문 동일
- 주석·docstring·포매팅 변경, 사용되지 않는 import 제거

### B. 의심스러운 변경 — warning으로 보고 (confidence 0.6~0.85)
- 기능이 삭제되었으나 대체 구현이 diff에 보이지 않음 (다른 파일에 있을 가능성도 detail에 명시)
- 의존성 제거 + 해당 패키지를 사용하는 코드가 diff에 잔존
- 환경변수 제거 + 코드에서 참조 잔존
- API 엔드포인트 경로 변경, 호출 측 코드는 변경 안 됨
- DB 컬럼 타입 변경 + 해당 컬럼을 다루는 코드 미수정

### C. 확실한 사고 — critical로 보고 (confidence 0.9+)
- 이전 세션에서 추가된 핵심 파일(API route, 인증, middleware 등)이 통째로 삭제 + 대체 없음
- package.json 핵심 의존성 제거 + 관련 코드 미수정 (런타임 에러 확정)
- .env 변수 삭제 + 코드에서 해당 변수 참조 잔존
- DB 스키마 변경(컬럼 삭제·타입 변경) + 마이그레이션 파일 없음 또는 backfill 누락`;

  const limitsSection = isProblemsOnly
    ? `## 이슈 수 상한 (problems_only)
- critical: 최대 3건
- warning: 최대 2건
- info: 최대 0건 (info는 보고 금지)`
    : `## 이슈 수 상한
- critical: 최대 5건
- warning: 최대 5건
- info: 최대 3건`;

  const exampleSection = isProblemsOnly
    ? `# ⑥ Example output

\`\`\`json
{
  "issues": [
    {
      "title": "결제 API route 삭제",
      "level": "critical",
      "fact": "이전 세션에서 추가된 app/api/checkout/route.ts가 현재 세션에서 대체 구현 없이 삭제되었습니다.",
      "detail": "결제 흐름을 처리하던 엔드포인트가 사라졌고 다른 파일에 동등 구현이 보이지 않습니다. 프론트의 결제 호출이 404로 떨어져 전체 결제 기능이 중단됩니다.",
      "fix_command": "이전 세션에서 app/api/checkout/route.ts에 있던 결제 API route를 복구해줘. Stripe Payment Intent를 생성하고 webhook을 처리하는 로직이야.",
      "file": "app/api/checkout/route.ts",
      "basis": "기능 회귀 (C 티어 — 핵심 라우트 통째 삭제)",
      "confidence": 0.95,
      "start_line": 1,
      "end_line": 1
    }
  ]
}
\`\`\``
    : `# ⑥ Example output

\`\`\`json
{
  "issues": [
    {
      "title": "결제 API route 삭제",
      "level": "critical",
      "fact": "이전 세션에서 추가된 app/api/checkout/route.ts가 현재 세션에서 대체 구현 없이 삭제되었습니다.",
      "detail": "결제 흐름을 처리하던 엔드포인트가 사라졌고 다른 파일에 동등 구현이 보이지 않습니다. 프론트의 결제 호출이 404로 떨어져 전체 결제 기능이 중단됩니다.",
      "fix_command": "이전 세션에서 app/api/checkout/route.ts에 있던 결제 API route를 복구해줘. Stripe Payment Intent를 생성하고 webhook을 처리하는 로직이야.",
      "file": "app/api/checkout/route.ts",
      "basis": "기능 회귀 (C 티어 — 핵심 라우트 통째 삭제)",
      "confidence": 0.95,
      "start_line": 1,
      "end_line": 1
    },
    {
      "title": "Stripe 의존성 제거 + 사용 코드 잔존",
      "level": "warning",
      "fact": "package.json에서 stripe 패키지가 제거되었지만 src/hooks/useCheckout.ts에서 여전히 import 중입니다.",
      "detail": "런타임에 'Cannot find module stripe' 에러가 발생하여 결제 훅을 사용하는 페이지가 깨집니다. 의존성 제거가 의도였다면 사용 코드도 함께 정리되어야 합니다.",
      "fix_command": "package.json에 stripe 의존성을 다시 추가하거나, src/hooks/useCheckout.ts에서 stripe 사용 코드를 제거하고 결제 훅을 다른 방식으로 구현해줘.",
      "file": "package.json, src/hooks/useCheckout.ts",
      "basis": "의존성 제거 (B 티어 — 사용 코드 미수정)",
      "confidence": 0.85,
      "start_line": 14,
      "end_line": 14
    }
  ]
}
\`\`\``;

  return `# ① 역할 정의

당신은 코드 변경 감지 전문가입니다.
두 세션 간의 변경 사항을 비교하여, 이전 세션의 기능이 삭제되거나 의도치 않게 변경되었는지 분석하세요.
결과를 report_analysis_results 도구로 보고하세요.
${roleAddendum}
# ② 입력 포맷

현재 세션의 git diff와 두 세션의 메타정보(제목/요약/변경 파일)가 제공됩니다.

## 라인 prefix 의미
- \`+\` : 현재 세션에서 추가된 라인
- \`-\` : 현재 세션에서 삭제된 라인 — **세션 비교에서는 이 라인이 핵심 분석 대상입니다.**
- ' ' : 변경되지 않은 컨텍스트 라인

## 파일 구분
- 각 파일은 \`--- {경로} ---\` 헤더로 시작합니다.
- start_line/end_line은 **삭제 이슈의 경우 이전 파일 기준**, **변경 이슈의 경우 새 파일 기준** 라인을 사용하세요.

# ③ 판단 기준

## Partial-context 경고
- 당신은 두 세션의 diff와 메타정보만 봅니다. 전체 코드베이스나 git history는 보지 않습니다.
- 같은 diff 내에서 함수가 다른 이름으로 재정의된 흔적이 있으면 "삭제"가 아니라 **리팩토링**일 수 있습니다.
- 메타정보의 sessionTitle/summary가 "리팩토링", "이름 변경" 등을 명시하면 의도된 변경으로 간주하세요.

## 신뢰도 가이드
- A 티어(의도적)는 confidence 무관 — 보고하지 마세요.
- B 티어(의심스러움)는 confidence 0.6~0.85, detail에 불확실성 명시
- C 티어(확실한 사고)는 confidence 0.9+
- 의도 판단이 모호하면 detail에 "리팩토링일 수 있습니다" 명시 + B 티어 + 낮은 confidence

${judgementSection}

${categoriesSection}

# ④ 작성 가이드

## fact
- "이전 세션에서 ~했던 ~가 현재 세션에서 ~되었습니다" 형태
- 예: "이전 세션에서 정의되었던 validateEmail 함수가 현재 세션에서 삭제되었습니다."

## detail
- 사고 시나리오를 구체적으로 (어떤 사용자 흐름이 깨지는지)
- B 티어는 불확실성 명시 ("다른 파일에 동등 구현이 있을 가능성은 확인하지 못했습니다")

## fix_command
- "이전 세션에서 삭제된 X를 Y에 복구해줘. ~ 로직이 필요해." 형태의 자연어

## basis
- "기능 회귀 (C 티어)", "의존성 제거 (B 티어 — 사용 코드 미수정)" 형태로 카테고리 + 티어 명시

## file
- diff에 등장하는 실제 파일 경로만 사용. 그룹 이슈는 쉼표로 나열.

# ⑤ 출력 스키마

report_analysis_results 도구를 호출하여 결과를 보고하세요.
각 이슈에 confidence(0.0~1.0), start_line, end_line(정수)을 반드시 포함하세요.

${limitsSection}
- 이슈가 없으면 반드시 빈 배열 반환

${exampleSection}`;
}

export const GUIDELINE_GENERATION_SYSTEM = `당신은 CLAUDE.md 보호 규칙 작성 전문가입니다.
주어진 이슈를 기반으로, Claude Code가 같은 실수를 반복하지 않도록 하는 규칙을 작성하세요.
결과를 report_guideline 도구로 보고하세요.

## 규칙 작성 가이드
- 명령형 문체 ("~하지 마라", "반드시 ~해라")
- 구체적 파일명/경로 포함
- 1~3줄 이내로 간결하게
- Claude Code가 이해할 수 있는 명확한 지시

## 예시
이슈: "src/config.ts에 API 키 하드코딩"
규칙: "src/config.ts 또는 다른 소스 파일에 API 키, 시크릿, 토큰을 절대 하드코딩하지 마라. 반드시 환경변수(process.env)를 사용해라."`;

// ─── 유저 메시지 빌더 ───

export interface StaticAnalysisInput {
  projectName: string;
  sessionTitle: string;
  filesChanged: string[];
  diffs: string; // 모든 diff를 합친 문자열
}

export function buildStaticAnalysisMessage(input: StaticAnalysisInput): string {
  return `## 분석 대상
- 프로젝트: ${input.projectName}
- 세션 제목: ${input.sessionTitle}
- 변경 파일: ${input.filesChanged.join(', ')}

## Diff 내용
\`\`\`
${input.diffs}
\`\`\``;
}

export interface SessionComparisonInput {
  prevSessionTitle: string;
  prevFilesChanged: string[];
  prevSummary: string;
  currentSessionTitle: string;
  currentFilesChanged: string[];
  currentSummary: string;
  currentDiffs: string;
}

export function buildSessionComparisonMessage(input: SessionComparisonInput): string {
  return `## 이전 세션
- 제목: ${input.prevSessionTitle}
- 변경 파일: ${input.prevFilesChanged.join(', ')}
- 요약: ${input.prevSummary}

## 현재 세션
- 제목: ${input.currentSessionTitle}
- 변경 파일: ${input.currentFilesChanged.join(', ')}
- 요약: ${input.currentSummary}

## 현재 세션의 Diff
\`\`\`
${input.currentDiffs}
\`\`\``;
}

export interface GuidelineInput {
  issueTitle: string;
  issueFact: string;
  issueDetail: string;
  issueFile: string;
  issueBasis: string;
}

export function buildGuidelineMessage(input: GuidelineInput): string {
  return `## 이슈 정보
- 제목: ${input.issueTitle}
- 사실: ${input.issueFact}
- 상세: ${input.issueDetail}
- 파일: ${input.issueFile}
- 근거: ${input.issueBasis}`;
}
