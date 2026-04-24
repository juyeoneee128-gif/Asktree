import type { Tool } from '@anthropic-ai/sdk/resources/messages';

// ─── 도구 스키마: 기능 추출 (5-1) ───

export const EXTRACT_FEATURES_TOOL: Tool = {
  name: 'report_extracted_features',
  description: 'Report the list of features extracted from the spec document.',
  input_schema: {
    type: 'object' as const,
    properties: {
      features: {
        type: 'array',
        description: '추출된 기능 목록',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string', description: '기능명 (한국어, 20자 이내)' },
            total_items: { type: 'integer', description: '세부 요구사항 수' },
            prd_summary: { type: 'string', description: '핵심 요구사항 1~2문장 요약' },
          },
          required: ['name', 'total_items', 'prd_summary'],
        },
      },
    },
    required: ['features'],
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
주어진 기획서에서 구현해야 할 기능 목록을 추출하세요.
결과를 report_extracted_features 도구로 보고하세요.

## 추출 규칙
- 각 기능은 독립적으로 구현 가능한 단위로 분리하세요
- 하위 항목(세부 요구사항)이 있으면 total_items로 카운트하세요
- prd_summary는 해당 기능의 핵심 요구사항 1~2문장 요약
- UI/디자인 요구사항은 제외하고, 로직/데이터/API 기능만 추출하세요
- 기능이 없으면 빈 배열을 반환하세요

## 기능명 규칙 (중요)
- 기능명은 **반드시 한국어**로 작성하세요 (20자 이내).
- 기획서에 영어 기술 용어가 그대로 등장하더라도 한국어로 번역하세요.
  - 예: "Ephemeral Processing" → "임시 데이터 처리"
  - 예: "OAuth Login" → "소셜 로그인"
  - 예: "Rate Limiting" → "요청 속도 제한"
- 고유명사(제품명, 외부 서비스명 등)가 아닌 일반 기술 용어는 모두 한국어로 번역하세요.`;

export const ASSESS_FEATURES_SYSTEM = `당신은 코드 구현 현황 판정 전문가입니다.
기획서의 기능 목록과 실제 코드 변경(세션 로그)을 비교하여
각 기능의 구현 상태를 판정하세요.
결과를 report_assessment 도구로 보고하세요.

## 판정 기준 (중요)
관련 파일이 존재하는 것만으로 'implemented'로 판정하지 마세요.
해당 기능의 **핵심 로직**(라우트 핸들러의 실제 처리 로직, 컴포넌트 렌더링 및 상태 관리, 데이터 처리/변환/검증 등)이 실제로 구현되어 있는지 확인하세요.

- **implemented**: 파일이 존재하고 해당 기능의 핵심 로직이 모두 구현됨. related_files에 관련 파일 포함.
- **partial**: 파일이 존재하고 일부 로직은 구현되었으나 세부 요구사항 중 일부가 누락됨. implemented_items에 구현된 항목만 나열.
- **unimplemented**: 관련 파일 자체가 없거나, 파일은 존재하지만 placeholder/stub/빈 함수/TODO 주석만 있어 실질 로직이 없음. implemented_items는 빈 배열.
- **attention**: 구현되었으나 기획서와 다르거나 누락된 부분이 있어 사람 확인이 필요함.

## 규칙
- 변경 파일명과 세션 요약, 세션에서 수행된 작업 내용을 종합하여 판정하세요
- 파일명이 기능과 관련 있어 보이더라도, 해당 파일에서 실제 로직이 작성된 정황(세션 요약, 프롬프트 내용)이 없으면 'implemented'로 판정하지 마세요
- 파일만 생성되고 내용이 채워진 근거가 없다면 'unimplemented' 또는 'partial'로 판정하세요
- 확실하지 않으면 'attention'으로 판정하세요
- 모든 feature_id에 대해 판정 결과를 반환하세요`;

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

export interface AssessInput {
  features: { id: string; name: string; total_items: number; prd_summary: string | null }[];
  sessions: { title: string; summary: string | null; changed_files: string[] }[];
}

export function buildAssessMessage(input: AssessInput): string {
  const featureList = input.features
    .map((f) => `- [${f.id}] ${f.name} (세부 ${f.total_items}개): ${f.prd_summary ?? ''}`)
    .join('\n');

  const sessionList = input.sessions
    .map((s) => `- ${s.title}: ${s.summary ?? ''}\n  변경 파일: ${s.changed_files.join(', ') || '없음'}`)
    .join('\n');

  return `## 기능 목록
${featureList}

## 세션 로그
${sessionList}`;
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
