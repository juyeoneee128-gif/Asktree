import type { Tool } from '@anthropic-ai/sdk/resources/messages';

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
              description: '왜 문제인가. "~하면 ~할 수 있습니다" 형태의 위험 설명.',
            },
            fix_command: {
              type: 'string',
              description: '비개발자가 Claude Code 터미널에 복사-붙여넣기할 자연어 명령어. 코드 블록이 아닌 자연어로 작성.',
            },
            file: {
              type: 'string',
              description: '관련 파일 경로 (상대 경로)',
            },
            basis: {
              type: 'string',
              description: '기술 근거 (OWASP, 보안 원칙 등)',
            },
          },
          required: ['title', 'level', 'fact', 'detail', 'fix_command', 'file', 'basis'],
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

// ─── 시스템 프롬프트 ───

export const STATIC_ANALYSIS_SYSTEM = `당신은 코드 보안 및 품질 분석 전문가입니다.
주어진 diff를 분석하여 이슈를 감지하고, report_analysis_results 도구로 결과를 보고하세요.

## 감지 카테고리
1. **API 키/시크릿 노출** (critical) — 하드코딩된 키, 토큰, 비밀번호, 시크릿
2. **인증/권한 부재** (critical) — 인증 없는 API 엔드포인트, 권한 미확인
3. **에러 처리 누락** (warning) — try-catch 없는 async/await, 에러 무시
4. **SQL 인젝션 위험** (critical) — 문자열 결합 쿼리, 미검증 사용자 입력
5. **XSS 위험** (warning) — 사용자 입력의 미이스케이프 렌더링, dangerouslySetInnerHTML
6. **민감 정보 로깅** (warning) — console.log에 비밀번호, 토큰, 개인정보 출력
7. **환경변수 미검증** (warning) — process.env 값을 null 체크 없이 사용
8. **미사용 코드** (info) — import했지만 사용하지 않는 함수/변수

## 필수 규칙
- 이슈가 없으면 반드시 빈 배열을 반환하세요. 없는 문제를 만들어내지 마세요.
- fix_command는 반드시 자연어 명령어여야 합니다. 코드 블록(함수 호출, import문 등)을 쓰지 마세요.
  - 좋은 예: "src/api/users.ts 파일의 GET /api/users 엔드포인트에 인증 미들웨어를 추가해줘. 현재 누구나 접근 가능한 상태야."
  - 나쁜 예: "app.get('/api/users', authMiddleware, handler)"
- fact는 "~이 감지되었습니다" 형태의 객관적 사실만 서술하세요.
- detail은 "~하면 ~할 수 있습니다" 형태로 위험을 설명하세요.
- basis는 "OWASP A01:2021 Broken Access Control" 같은 구체적 기술 근거를 명시하세요.
- file은 diff에 등장하는 실제 파일 경로만 사용하세요. 존재하지 않는 파일을 만들어내지 마세요.`;

export const SESSION_COMPARISON_SYSTEM = `당신은 코드 변경 감지 전문가입니다.
두 세션 간의 변경 사항을 비교하여, 이전 세션의 기능이 삭제되거나 의도치 않게 변경되었는지 분석하세요.
결과를 report_analysis_results 도구로 보고하세요.

## 감지 항목
1. **기능 삭제** (critical) — 이전에 있던 함수/컴포넌트/라우트/API 엔드포인트가 삭제됨
2. **동작 변경** (warning) — 함수의 리턴 타입, 파라미터, 핵심 로직이 변경됨
3. **설정 변경** (warning) — 환경변수, config 파일의 값이 변경됨
4. **의존성 제거** (info) — package.json에서 패키지가 삭제됨

## 필수 규칙
- 의도적인 리팩토링/개선은 이슈가 아닙니다. 이름 변경 + 동일 기능 유지는 정상입니다.
- "삭제"가 감지되어도, 같은 diff 내에서 대체 구현이 있으면 이슈로 보고하지 마세요.
- 이슈가 없으면 반드시 빈 배열을 반환하세요.
- fix_command는 자연어 CLI 명령어 형태로 작성하세요.
  - 예: "이전 세션에서 삭제된 validateEmail 함수를 src/utils/validation.ts에 복구해줘. 이메일 형식 검증 로직이 필요해."
- file은 diff에 등장하는 실제 파일 경로만 사용하세요.`;

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
