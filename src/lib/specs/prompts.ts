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
- 기능명은 한국어, 20자 이내
- UI/디자인 요구사항은 제외하고, 로직/데이터/API 기능만 추출하세요
- 기능이 없으면 빈 배열을 반환하세요`;

export const ASSESS_FEATURES_SYSTEM = `당신은 코드 구현 현황 판정 전문가입니다.
기획서의 기능 목록과 실제 코드 변경(세션 로그)을 비교하여
각 기능의 구현 상태를 판정하세요.
결과를 report_assessment 도구로 보고하세요.

## 판정 기준
- **implemented**: 모든 세부 요구사항이 구현됨. related_files에 관련 파일 포함.
- **partial**: 일부만 구현됨. implemented_items에 구현된 항목만 나열.
- **unimplemented**: 관련 코드 변경이 전혀 없음. implemented_items는 빈 배열.
- **attention**: 구현되었으나 기획서와 다르거나 누락된 부분이 있어 확인 필요.

## 규칙
- 변경 파일명과 세션 요약을 기반으로 판정하세요
- 파일명이 기능과 관련 있어 보이면 해당 기능에 연결하세요
- 확실하지 않으면 attention으로 판정하세요
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
- 기능명은 한국어, 20자 이내
- 중복 기능은 병합하세요`;

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
