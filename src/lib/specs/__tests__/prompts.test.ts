import { describe, it, expect } from 'vitest';
import {
  EXTRACT_FEATURES_TOOL,
  ASSESS_FEATURES_TOOL,
  REVERSE_IA_TOOL,
  EXTRACT_FEATURES_SYSTEM,
  ASSESS_FEATURES_SYSTEM,
  REVERSE_IA_SYSTEM,
  buildExtractFeaturesMessage,
  buildAssessMessage,
  buildReverseIAMessage,
} from '../prompts';

describe('도구 스키마', () => {
  it('EXTRACT_FEATURES_TOOL에 features 필드가 정의되어 있다', () => {
    expect(EXTRACT_FEATURES_TOOL.name).toBe('report_extracted_features');
    const schema = EXTRACT_FEATURES_TOOL.input_schema as Record<string, unknown>;
    expect(schema.required).toContain('features');
  });

  it('ASSESS_FEATURES_TOOL에 assessments 필드가 정의되어 있다', () => {
    expect(ASSESS_FEATURES_TOOL.name).toBe('report_assessment');
    const schema = ASSESS_FEATURES_TOOL.input_schema as Record<string, unknown>;
    expect(schema.required).toContain('assessments');
  });

  it('REVERSE_IA_TOOL에 features 필드가 정의되어 있다', () => {
    expect(REVERSE_IA_TOOL.name).toBe('report_reverse_features');
    const schema = REVERSE_IA_TOOL.input_schema as Record<string, unknown>;
    expect(schema.required).toContain('features');
  });
});

describe('시스템 프롬프트', () => {
  it('기능 추출 프롬프트에 핵심 지시가 포함되어 있다', () => {
    expect(EXTRACT_FEATURES_SYSTEM).toContain('기획서');
    expect(EXTRACT_FEATURES_SYSTEM).toContain('기능 목록');
    expect(EXTRACT_FEATURES_SYSTEM).toContain('UI/디자인');
  });

  it('판정 프롬프트에 판정 기준이 포함되어 있다', () => {
    expect(ASSESS_FEATURES_SYSTEM).toContain('implemented');
    expect(ASSESS_FEATURES_SYSTEM).toContain('partial');
    expect(ASSESS_FEATURES_SYSTEM).toContain('unimplemented');
    expect(ASSESS_FEATURES_SYSTEM).toContain('attention');
  });

  it('Reverse IA 프롬프트에 역추출 지시가 포함되어 있다', () => {
    expect(REVERSE_IA_SYSTEM).toContain('세션 로그');
    expect(REVERSE_IA_SYSTEM).toContain('기능 추출');
    expect(REVERSE_IA_SYSTEM).toContain('related_files');
  });
});

describe('메시지 빌더', () => {
  it('기능 추출 메시지를 올바르게 조립한다', () => {
    const msg = buildExtractFeaturesMessage('## 1. 로그인\n- 이메일 로그인', 'FRD');
    expect(msg).toContain('FRD');
    expect(msg).toContain('로그인');
    expect(msg).toContain('이메일');
  });

  it('판정 메시지를 올바르게 조립한다', () => {
    const msg = buildAssessMessage({
      features: [
        { id: 'f1', name: '로그인', total_items: 3, prd_summary: '이메일 로그인 기능' },
      ],
      sessions: [
        { title: '로그인 구현', summary: '로그인 완료', changed_files: ['src/auth/login.ts'] },
      ],
    });
    expect(msg).toContain('[f1] 로그인');
    expect(msg).toContain('src/auth/login.ts');
  });

  it('Reverse IA 메시지를 올바르게 조립한다', () => {
    const msg = buildReverseIAMessage({
      sessions: [
        {
          title: '초기 설정',
          summary: '프로젝트 초기화',
          prompts: ['Next.js 프로젝트 초기화해줘'],
          changed_files: ['package.json', 'tsconfig.json'],
        },
      ],
    });
    expect(msg).toContain('세션 1: 초기 설정');
    expect(msg).toContain('Next.js 프로젝트 초기화해줘');
    expect(msg).toContain('package.json');
  });

  it('프롬프트를 최대 5개까지만 포함한다', () => {
    const prompts = Array.from({ length: 10 }, (_, i) => `프롬프트 ${i}`);
    const msg = buildReverseIAMessage({
      sessions: [{ title: 't', summary: null, prompts, changed_files: [] }],
    });
    expect(msg).toContain('프롬프트 4');
    expect(msg).not.toContain('프롬프트 5');
  });
});
