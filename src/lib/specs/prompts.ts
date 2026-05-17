import type { Tool } from '@anthropic-ai/sdk/resources/messages';

// ─── 도구 스키마: 기능 추출 (5-1) ───

export const EXTRACT_FEATURES_TOOL: Tool = {
  name: 'report_extracted_features',
  description:
    'Classify the document type, then report the list of features (only when document_type is "prd" or "spec").',
  input_schema: {
    type: 'object' as const,
    properties: {
      document_type: {
        type: 'string',
        enum: ['prd', 'spec', 'other'],
        description:
          'prd: 제품 기획서/요구사항/기능 명세서. spec: 기술 명세/API 설계/DB 스키마. other: 컴포넌트 목록·회의록·핸드오프·이슈 메모·스타일 가이드 등 기능 추출 대상이 아닌 문서. "other"이면 features는 반드시 빈 배열.',
      },
      features: {
        type: 'array',
        description:
          '추출된 기능 목록. document_type이 "other"이면 반드시 빈 배열([])을 반환.',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string', description: '기능명 (한국어, 20자 이내)' },
            total_items: { type: 'integer', description: '세부 요구사항 수 (expected_items.length와 일치해야 함)' },
            prd_summary: { type: 'string', description: '핵심 요구사항 1~2문장 요약' },
            expected_items: {
              type: 'array',
              items: { type: 'string' },
              description: '이 기능이 갖춰야 할 세부 구현 항목 전체 목록. 한국어 1줄 1항목. prd_summary가 명시한 모든 세부 동작/요구사항을 분해.',
            },
          },
          required: ['name', 'total_items', 'prd_summary', 'expected_items'],
        },
      },
    },
    required: ['document_type', 'features'],
  },
};

// ─── 도구 스키마: 구현 판정 (5-2) ───

export const ASSESS_FEATURES_TOOL: Tool = {
  name: 'report_assessment',
  description: 'Report the implementation status assessment for each feature.',
  input_schema: {
    type: 'object' as const,
    properties: {
      assessments: {
        type: 'array',
        description: '각 기능의 구현 상태 판정 결과',
        items: {
          type: 'object',
          properties: {
            feature_id: { type: 'string', description: '기능 ID (입력에서 제공된 ID)' },
            status: {
              type: 'string',
              enum: ['implemented', 'partial', 'unimplemented', 'attention'],
              description: 'implemented: 전체 구현, partial: 일부, unimplemented: 미구현, attention: 확인 필요',
            },
            implemented_items: {
              type: 'array',
              items: { type: 'string' },
              description: '구현된 세부 항목 목록',
            },
            related_files: {
              type: 'array',
              items: { type: 'string' },
              description: '관련 파일 경로',
            },
          },
          required: ['feature_id', 'status', 'implemented_items', 'related_files'],
        },
      },
    },
    required: ['assessments'],
  },
};

// ─── 도구 스키마: Reverse IA (5-3) ───

export const REVERSE_IA_TOOL: Tool = {
  name: 'report_reverse_features',
  description: 'Report features extracted from code and session logs.',
  input_schema: {
    type: 'object' as const,
    properties: {
      features: {
        type: 'array',
        description: '코드/로그에서 역추출된 기능 목록',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string', description: '기능명 (한국어, 20자 이내)' },
            total_items: { type: 'integer', description: '세부 항목 수' },
            implemented_items: {
              type: 'array',
              items: { type: 'string' },
              description: '구현된 세부 항목 목록',
            },
            related_files: {
              type: 'array',
              items: { type: 'string' },
              description: '관련 파일 경로',
            },
            prd_summary: { type: 'string', description: '기능 요약 1~2문장' },
          },
          required: ['name', 'total_items', 'implemented_items', 'related_files', 'prd_summary'],
        },
      },
    },
    required: ['features'],
  },
};

// ─── 시스템 프롬프트 ───

export const EXTRACT_FEATURES_SYSTEM = `당신은 소프트웨어 기획서 분석 전문가입니다.
주어진 문서를 먼저 분류한 뒤, 분류 결과에 따라 기능을 추출하세요.
결과를 report_extracted_features 도구로 보고하세요.

## 1단계: 문서 분류

이 문서의 내용을 읽고 아래 유형 중 하나로 분류하라:

- **"prd"**: 제품 기획서, 요구사항 정의서, 기능 명세서
  → 구현해야 할 기능/요구사항이 서술되어 있는 문서
- **"spec"**: 기술 명세, API 설계, 데이터베이스 스키마 정의
  → 구현 방법이 구체적으로 정의된 문서
- **"other"**: 위에 해당하지 않는 문서
  → 컴포넌트 목록, 디자인 프레임 목록, 회의록, 논의 문서,
    이슈/버그 목록, 핸드오프 메모, 스타일 가이드

### 분류 판단 기준
- 문서에 "~기능을 제공한다", "~할 수 있다", "~를 구현한다" 같은
  요구사항 서술이 있으면 → **"prd"**
- 문서에 API 엔드포인트, DB 테이블, 데이터 플로우가 정의되어 있으면 → **"spec"**
- 문서가 목록 나열(컴포넌트명, 파일명, 프레임명)만 하고
  구현 요구사항이 없으면 → **"other"**

## 2단계: 기능 추출

document_type이 "prd" 또는 "spec"인 경우에만 기능을 추출하라.
**"other"이면 features를 반드시 빈 배열([])로 반환하라.** 기능을 추출하지 마세요.

## 추출 규칙 (prd/spec일 때만 적용)
- 각 기능은 독립적으로 구현 가능한 단위로 분리하세요
- 하위 항목(세부 요구사항)이 있으면 total_items로 카운트하세요
- prd_summary는 해당 기능의 핵심 요구사항 1~2문장 요약
- UI/디자인 요구사항은 제외하고, 로직/데이터/API 기능만 추출하세요
- 기능이 없으면 빈 배열을 반환하세요

## expected_items 작성 규칙 (필수)
각 기능에 대해, 그 기능이 "완전히 구현됐다"고 말하려면 무엇이 필요한지 항목 단위로 분해하라.
prd_summary가 명시한 모든 세부 동작/요구사항을 1줄 1항목으로 나열한다.

### 예시
기능명: '사용자 인증'
prd_summary: '이메일/소셜 로그인, 세션 관리, 로그아웃 지원'
expected_items:
  - '이메일 로그인 (회원가입 + 로그인)'
  - '소셜 로그인 (Google/Naver)'
  - '세션 관리 (토큰 발급/만료/갱신)'
  - '로그아웃 (세션 정리)'

→ total_items는 expected_items의 개수와 일치해야 한다.
→ expected_items가 비어있으면 안 된다 — 기능을 추출했다는 건 최소 1개 이상의 세부 항목이 있다는 뜻.

## 기능명 규칙 (중요)
- 기능명은 **반드시 한국어**로 작성하세요 (20자 이내).
- 기획서에 영어 기술 용어가 그대로 등장하더라도 한국어로 번역하세요.
  - 예: "Ephemeral Processing" → "임시 데이터 처리"
  - 예: "OAuth Login" → "소셜 로그인"
  - 예: "Rate Limiting" → "요청 속도 제한"
- 고유명사(제품명, 외부 서비스명 등)가 아닌 일반 기술 용어는 모두 한국어로 번역하세요.`;

export const ASSESS_FEATURES_SYSTEM = `당신은 코드 구현 현황 판정 전문가입니다.
기획서의 기능 목록과 실제 코드(소스코드 또는 파일 시그니처 + 세션 로그)를 비교하여
각 기능의 구현 상태를 판정하세요.
결과를 report_assessment 도구로 보고하세요.

## 근거 우선순위

1. **소스코드 (가장 강력)**: "## 관련 소스 파일" 섹션이 있으면 그것을 1순위 근거로 사용.
   파일명 추정이 아닌 실제 함수 본문/라우트 핸들러/렌더링 흐름을 직접 확인하라.
2. **파일 시그니처**: 소스코드가 없을 때 fallback. 패턴 부재가 더 강한 신호.
3. **세션 로그**: 보조 컨텍스트. 단독 근거로 사용 금지.

## 입력 데이터

- **기능 목록**: 기획서에서 추출한 기능 ID/이름/요구사항 요약
- **세션 로그**: AI가 수행한 작업 제목·요약·변경 파일 (시간순)
- **관련 소스 파일** (있을 경우): 기능 키워드로 매칭된 실제 파일 본문
- **파일 시그니처** (있을 경우): 파일별 functions/imports/exports/patterns/line_count 누적
  - 두 경로에서 누적됨: 정적 분석 LLM(diff 기반) + 세션 로그 정규식(Read tool 기반)
  - 합집합 머지이므로 stale 함수가 남아있을 수 있음 — 패턴 부재가 더 강한 신호

## 판정 기준 (중요)

관련 파일이 존재하는 것만으로 'implemented'로 판정하지 마세요.
해당 기능의 **핵심 로직**(라우트 핸들러의 실제 처리 로직, 컴포넌트 렌더링 및 상태 관리, 데이터 처리/변환/검증 등)이 실제로 구현되어 있는지 확인하세요.

### 시그니처 기반 판정 (시그니처가 있을 때 우선 적용)
- **implemented**: 핵심 함수/패턴이 시그니처에 존재 (예: 인증 기능 → patterns에 supabase.auth.signInWith*, 결제 → stripe.charges.*)
- **partial**: 일부 함수만 있거나 핵심 패턴이 누락 (예: 회원가입 폼은 있지만 검증 로직 함수 부재)
- **unimplemented**: 관련 파일 자체가 시그니처에 없거나, 시그니처에 관련 패턴이 전무
- **attention**: 시그니처는 있지만 함수/패턴이 기획서와 일치하지 않거나 모호 → 사람 확인 필요

### Fallback (시그니처가 비어있거나 해당 파일이 없을 때)
시그니처 정보가 부족하면 기존 방식으로 판정:
- 변경 파일명과 세션 요약, 세션에서 수행된 작업 내용을 종합
- 파일명이 기능과 관련 있어 보이더라도, 실제 로직이 작성된 정황이 없으면 'implemented'로 판정하지 마세요
- 파일만 생성되고 내용이 채워진 근거가 없다면 'unimplemented' 또는 'partial'

## status 값 정의
- **implemented**: 전체 구현. implemented_items에 소스코드와 prd_summary에서 확인된 세부 구현 항목들을 구체적으로 나열하라. related_files에 관련 파일 포함.
- **partial**: 일부 구현. implemented_items에 구현된 항목만 나열.
- **unimplemented**: 미구현. implemented_items는 빈 배열.
- **attention**: 구현되었으나 기획서와 다르거나 누락된 부분이 있어 사람 확인이 필요.

## expected_items 활용 (있을 경우 — 최우선)
입력의 각 기능에는 "이 기능이 갖춰야 할 세부 항목 전체 목록"인 expected_items가 주어진다.
implemented_items는 expected_items 중 실제 소스코드에서 구현이 확인된 부분집합만 반환한다.

### 매칭 규칙
- implemented_items에 넣는 각 항목명은 **expected_items에 등장한 정확한 이름** 그대로 사용한다.
- 부분 표현/약어/재작성 금지 — UI에서 정확한 매칭(Set 비교)으로 체크박스를 그리기 때문.

### status 판단 기준 (expected_items가 있을 때)
- implemented_items.length === expected_items.length → 'implemented'
- 0 < implemented_items.length < expected_items.length → 'partial'
- implemented_items.length === 0 → 'unimplemented'
- 모호하면 'attention'

### expected_items가 빈 배열일 때 (legacy 데이터 fallback)
기존 휴리스틱(소스코드/시그니처 기반 판정)을 그대로 사용. implemented_items 작성 규칙은 아래.

## implemented_items 작성 규칙 (legacy/fallback)
- **implemented 상태**: prd_summary와 소스코드에서 확인된 모든 세부 동작을 나열
- **partial 상태**: 구현이 확인된 항목만 나열
- **unimplemented 상태**: 빈 배열
- **implemented/partial에서 빈 배열은 허용하지 않음** — 채울 항목이 정말 없으면 status를 attention으로 바꾸어라

### 예시
'사용자 인증' 기능이 implemented이면:
  implemented_items: ['이메일 로그인', '소셜 로그인(Google)', '세션 관리', '로그아웃']
처럼 실제 소스코드에서 확인된 동작을 1줄 1항목으로 나열한다.

## 규칙
- 모든 feature_id에 대해 판정 결과를 반환하세요
- 확실하지 않으면 'attention'으로 판정하세요
- related_files는 시그니처에 등장하는 file_path를 우선 사용 (없으면 세션 changed_files에서)`;

export const REVERSE_IA_SYSTEM = `당신은 코드 분석을 통한 기능 추출 전문가입니다.
프로젝트의 세션 로그(사용자 프롬프트 + 변경 파일 + 요약)를 분석하여
프로젝트에 구현된 기능 목록을 추출하세요.
결과를 report_reverse_features 도구로 보고하세요.

## 추출 규칙
- 세션의 프롬프트와 변경 파일에서 기능 단위를 식별하세요
- 각 기능은 독립적으로 이해 가능한 단위여야 합니다
- 이미 구현된 것이므로 implemented_items에 세부 항목을 나열하세요
- related_files에 관련 파일 경로를 포함하세요
- 중복 기능은 병합하세요

## 기능명 규칙 (중요)
- 기능명은 **반드시 한국어**로 작성하세요 (20자 이내).
- 코드나 프롬프트에 영어 기술 용어가 그대로 등장하더라도 한국어로 번역하세요.
  - 예: "Ephemeral Processing" → "임시 데이터 처리"
  - 예: "OAuth Login" → "소셜 로그인"
  - 예: "Rate Limiting" → "요청 속도 제한"
- 고유명사(제품명, 외부 서비스명 등)가 아닌 일반 기술 용어는 모두 한국어로 번역하세요.`;

// ─── 메시지 빌더 ───

export function buildExtractFeaturesMessage(documentContent: string, documentType: string): string {
  return `## 문서 유형: ${documentType}

## 기획서 내용
${documentContent}`;
}

export interface AssessFileSignature {
  file_path: string;
  functions: string[];
  imports: string[];
  exports: string[];
  patterns: string[];
  line_count: number;
}

export interface AssessInput {
  features: {
    id: string;
    name: string;
    total_items: number;
    prd_summary: string | null;
    expected_items?: string[];
  }[];
  sessions: { title: string; summary: string | null; changed_files: string[] }[];
  file_signatures?: AssessFileSignature[];
}

function formatFeatureLine(f: {
  id: string;
  name: string;
  total_items: number;
  prd_summary: string | null;
  expected_items?: string[];
}): string {
  const items = (f.expected_items ?? []).filter((x): x is string => typeof x === 'string');
  if (items.length === 0) {
    // legacy: expected_items 없음 — 기존 형식 유지
    return `- [${f.id}] ${f.name} (세부 ${f.total_items}개): ${f.prd_summary ?? ''}`;
  }
  const itemLines = items.map((it) => `    - ${it}`).join('\n');
  return `- [${f.id}] ${f.name}: ${f.prd_summary ?? ''}\n  expected_items:\n${itemLines}`;
}

/**
 * 시그니처 메시지에 포함될 토큰 추정 한도. Sonnet/Haiku 입력 한도(200K) 대비 보수적 — 약 24K char (≈6K token).
 * 한도 초과 시 line_count 큰 순으로 자른다 (큰 파일이 핵심 로직 보유 가능성 높음).
 */
const SIGNATURES_MAX_CHARS = 24000;

export function buildAssessMessage(input: AssessInput): string {
  const featureList = input.features.map(formatFeatureLine).join('\n');

  const sessionList = input.sessions
    .map((s) => `- ${s.title}: ${s.summary ?? ''}\n  변경 파일: ${s.changed_files.join(', ') || '없음'}`)
    .join('\n');

  const sigSection = formatSignaturesSection(input.file_signatures ?? []);

  return `## 기능 목록
${featureList}

## 세션 로그
${sessionList}${sigSection}`;
}

/**
 * 시그니처 목록을 메시지 섹션 텍스트로 포맷합니다.
 * - 빈 배열이면 빈 문자열 (시스템 프롬프트의 fallback 가이드가 동작)
 * - 토큰 한도 임박 시 line_count desc 정렬 후 자름 (핵심 파일 우선 보존)
 */
export function formatSignaturesSection(sigs: AssessFileSignature[]): string {
  if (sigs.length === 0) return '';

  // line_count desc 정렬 (큰 파일 우선)
  const sorted = [...sigs].sort((a, b) => b.line_count - a.line_count);

  const lines: string[] = [];
  let totalChars = 0;
  let truncatedCount = 0;

  for (const sig of sorted) {
    const block = formatSignatureBlock(sig);
    if (totalChars + block.length > SIGNATURES_MAX_CHARS) {
      truncatedCount = sorted.length - lines.length;
      break;
    }
    lines.push(block);
    totalChars += block.length;
  }

  if (lines.length === 0) return '';

  let footer = '';
  if (truncatedCount > 0) {
    footer = `\n(line_count 작은 ${truncatedCount}개 파일은 토큰 한도로 생략됨)`;
  }

  return `\n\n## 파일 시그니처 (정적 분석 + 세션 로그 누적)\n${lines.join('\n')}${footer}`;
}

function formatSignatureBlock(sig: AssessFileSignature): string {
  const parts: string[] = [`- ${sig.file_path} (line ${sig.line_count})`];
  if (sig.functions.length > 0) parts.push(`  fns: ${sig.functions.join(', ')}`);
  if (sig.imports.length > 0) parts.push(`  imports: ${sig.imports.join(', ')}`);
  if (sig.exports.length > 0) parts.push(`  exports: ${sig.exports.join(', ')}`);
  if (sig.patterns.length > 0) parts.push(`  patterns: ${sig.patterns.join(', ')}`);
  return parts.join('\n');
}

// ─── 소스코드 기반 판정 (full_scan 경로) ───

export interface AssessSourceFile {
  path: string;
  content: string;
  line_count: number;
}

export interface AssessWithSourceInput {
  features: {
    id: string;
    name: string;
    total_items: number;
    prd_summary: string | null;
    expected_items?: string[];
  }[];
  sessions: { title: string; summary: string | null; changed_files: string[] }[];
  source_files: AssessSourceFile[];
}

/**
 * 소스코드 기반 메시지의 토큰 예산. 약 100K char ≈ 25K token — Sonnet 200K 한도의 1/8.
 * 시스템 프롬프트 + 도구 정의 + 응답 여유를 고려한 보수적 수치.
 */
const SOURCE_MESSAGE_MAX_CHARS = 100_000;

/**
 * 기능명 → 검색 키워드 변환 사전.
 * 한국어 기능명에 자주 등장하는 단어 → 영문 코드 패턴 후보로 매핑.
 * 매칭은 키워드 OR 조건. 사전에 없으면 기능명 자체를 키워드로 사용.
 */
const KEYWORD_MAP: Record<string, string[]> = {
  인증: ['auth', 'login', 'signin', 'signup', 'session'],
  로그인: ['login', 'signin', 'oauth'],
  회원가입: ['signup', 'register', 'create.*user'],
  결제: ['payment', 'billing', 'stripe', 'checkout', 'charge'],
  알림: ['notif', 'toast', 'alert'],
  분석: ['analy', 'detect', 'scan'],
  세션: ['session'],
  이슈: ['issue', 'problem'],
  보호: ['guideline', 'rule', 'protect'],
  설정: ['setting', 'config', 'preference'],
  대시보드: ['dashboard'],
  프로젝트: ['project'],
  파일: ['file', 'upload', 'storage'],
  크레딧: ['credit', 'usage', 'quota'],
  검색: ['search', 'query', 'filter'],
  업로드: ['upload', 'multer', 'formdata'],
  다운로드: ['download', 'export'],
  댓글: ['comment'],
  게시: ['post', 'publish'],
  태그: ['tag'],
  사용자: ['user', 'account', 'profile'],
  계정: ['account', 'user', 'profile'],
  권한: ['permission', 'role', 'access', 'rls'],
  암호화: ['encrypt', 'crypto', 'pgcrypto', 'aes'],
  api: ['api', 'route', 'endpoint', 'handler'],
  데이터베이스: ['db', 'supabase', 'postgres', 'migration'],
  마이그레이션: ['migration', '\\.sql'],
  온보딩: ['onboarding', 'welcome'],
  랜딩: ['landing', 'marketing'],
  기획서: ['spec', 'prd', 'feature'],
  현황: ['status', 'progress', 'metric'],
  로그: ['log', 'audit'],
};

/**
 * 기능명에서 검색 키워드 목록을 추출합니다.
 * 1. 공백/조사 제거 → 토큰화
 * 2. KEYWORD_MAP에서 매핑된 영문 키워드 + 토큰 자체(영문 소문자)
 * 3. 최소 1자 이상 + 한글/영문만
 */
export function extractFeatureKeywords(name: string): string[] {
  const keywords = new Set<string>();
  const tokens = name
    .toLowerCase()
    .replace(/[^a-z0-9가-힣\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 0);

  for (const token of tokens) {
    if (KEYWORD_MAP[token]) {
      for (const k of KEYWORD_MAP[token]) keywords.add(k);
    }
    if (/^[a-z0-9]+$/.test(token) && token.length >= 2) {
      keywords.add(token);
    }
  }

  // fallback: 키워드가 하나도 안 나오면 전체 이름을 정규화해서 사용
  if (keywords.size === 0) {
    const fallback = name.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (fallback.length >= 2) keywords.add(fallback);
  }

  return [...keywords];
}

/**
 * 기능별로 관련 있는 소스 파일을 매칭하여 반환합니다.
 * - path 또는 content에 키워드가 등장하면 매칭
 * - 기능당 최대 maxPerFeature 개 (line_count 작은 순 — 핵심 로직 우선 가설)
 */
export function matchSourcesByKeywords(
  keywords: string[],
  sources: AssessSourceFile[],
  maxPerFeature = 10
): AssessSourceFile[] {
  if (keywords.length === 0) return [];
  const lowered = keywords.map((k) => k.toLowerCase());

  const matched = sources.filter((s) => {
    const pathLower = s.path.toLowerCase();
    if (lowered.some((k) => pathLower.includes(k))) return true;
    const contentLower = s.content.toLowerCase();
    return lowered.some((k) => contentLower.includes(k));
  });

  // line_count 오름차순 — 작고 응집된 핵심 로직 우선
  matched.sort((a, b) => a.line_count - b.line_count);
  return matched.slice(0, maxPerFeature);
}

export function buildAssessWithSourceMessage(input: AssessWithSourceInput): string {
  const featureList = input.features.map(formatFeatureLine).join('\n');

  const sessionList = input.sessions
    .map((s) => `- ${s.title}: ${s.summary ?? ''}\n  변경 파일: ${s.changed_files.join(', ') || '없음'}`)
    .join('\n');

  // 기능별 키워드 매칭 → 파일 중복 제거 → 토큰 한도 내 슬라이스
  const featureToFiles = new Map<string, AssessSourceFile[]>();
  const usedPaths = new Set<string>();

  for (const f of input.features) {
    const keywords = extractFeatureKeywords(f.name);
    const matched = matchSourcesByKeywords(keywords, input.source_files);
    featureToFiles.set(f.id, matched);
    for (const m of matched) usedPaths.add(m.path);
  }

  // 파일별로 한 번씩만 포함 (전체 메시지 단일 섹션)
  const includedFiles: AssessSourceFile[] = [];
  let totalChars = 0;
  const pathByFile = new Map<string, AssessSourceFile>(
    input.source_files.map((f) => [f.path, f])
  );

  for (const path of usedPaths) {
    const file = pathByFile.get(path);
    if (!file) continue;
    const block = `\n\n### ${file.path} (line ${file.line_count})\n\`\`\`\n${file.content}\n\`\`\``;
    if (totalChars + block.length > SOURCE_MESSAGE_MAX_CHARS) break;
    includedFiles.push(file);
    totalChars += block.length;
  }

  // 기능별 매칭 표 (LLM에게 어느 파일이 어느 기능과 관련 있는지 힌트)
  const matchingTable = input.features
    .map((f) => {
      const files = featureToFiles.get(f.id) ?? [];
      const included = files
        .filter((file) => includedFiles.some((inc) => inc.path === file.path))
        .map((file) => file.path);
      const list = included.length > 0 ? included.join(', ') : '(매칭 파일 없음)';
      return `- [${f.id}] ${f.name} → ${list}`;
    })
    .join('\n');

  const sourcesSection = includedFiles
    .map(
      (f) => `### ${f.path} (line ${f.line_count})\n\`\`\`\n${f.content}\n\`\`\``
    )
    .join('\n\n');

  return `## 기능 목록
${featureList}

## 세션 로그
${sessionList}

## 기능 ↔ 파일 매칭 (키워드 기반 사전 매칭, 참고용)
${matchingTable}

## 관련 소스 파일 (실제 코드 — 1순위 근거)
${sourcesSection || '(매칭된 소스 파일 없음 — 세션 로그를 fallback으로 사용)'}`;
}

export interface ReverseIAInput {
  sessions: { title: string; summary: string | null; prompts: string[]; changed_files: string[] }[];
}

export function buildReverseIAMessage(input: ReverseIAInput): string {
  const sessionList = input.sessions
    .map((s, i) => {
      const promptStr = s.prompts.slice(0, 5).map((p) => `    "${p.slice(0, 100)}"`).join('\n');
      return `### 세션 ${i + 1}: ${s.title}
  요약: ${s.summary ?? '없음'}
  변경 파일: ${s.changed_files.join(', ') || '없음'}
  프롬프트:
${promptStr}`;
    })
    .join('\n\n');

  return `## 프로젝트 세션 로그
${sessionList}`;
}
