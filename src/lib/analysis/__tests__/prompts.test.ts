import { describe, it, expect } from 'vitest';
import {
  buildStaticAnalysisMessage,
  buildSessionComparisonMessage,
  buildGuidelineMessage,
  ANALYSIS_RESULT_TOOL,
  GUIDELINE_RESULT_TOOL,
  STATIC_ANALYSIS_SYSTEM,
  SESSION_COMPARISON_SYSTEM,
  GUIDELINE_GENERATION_SYSTEM,
} from '../prompts';

describe('프롬프트 템플릿', () => {
  it('정적 분석 메시지를 올바르게 조립한다', () => {
    const msg = buildStaticAnalysisMessage({
      projectName: 'CodeSasu',
      sessionTitle: '로그인 에러 처리 추가',
      filesChanged: ['src/auth/login.ts', 'src/auth/error.ts'],
      diffs: '--- src/auth/login.ts ---\n+ try {',
    });

    expect(msg).toContain('CodeSasu');
    expect(msg).toContain('로그인 에러 처리 추가');
    expect(msg).toContain('src/auth/login.ts');
    expect(msg).toContain('+ try {');
  });

  it('세션 비교 메시지를 올바르게 조립한다', () => {
    const msg = buildSessionComparisonMessage({
      prevSessionTitle: '이전 세션',
      prevFilesChanged: ['a.ts'],
      prevSummary: '이전 요약',
      currentSessionTitle: '현재 세션',
      currentFilesChanged: ['a.ts', 'b.ts'],
      currentSummary: '현재 요약',
      currentDiffs: '--- a.ts ---\n- old\n+ new',
    });

    expect(msg).toContain('이전 세션');
    expect(msg).toContain('현재 세션');
    expect(msg).toContain('--- a.ts ---');
  });

  it('가이드라인 메시지를 올바르게 조립한다', () => {
    const msg = buildGuidelineMessage({
      issueTitle: 'API 키 하드코딩',
      issueFact: 'API 키가 노출되었습니다.',
      issueDetail: '보안 위험입니다.',
      issueFile: 'src/config.ts',
      issueBasis: 'OWASP A02',
    });

    expect(msg).toContain('API 키 하드코딩');
    expect(msg).toContain('src/config.ts');
    expect(msg).toContain('OWASP A02');
  });
});

describe('도구 스키마', () => {
  it('ANALYSIS_RESULT_TOOL에 필수 필드가 정의되어 있다', () => {
    expect(ANALYSIS_RESULT_TOOL.name).toBe('report_analysis_results');
    const schema = ANALYSIS_RESULT_TOOL.input_schema as Record<string, unknown>;
    expect(schema.required).toContain('issues');
  });

  it('GUIDELINE_RESULT_TOOL에 필수 필드가 정의되어 있다', () => {
    expect(GUIDELINE_RESULT_TOOL.name).toBe('report_guideline');
    const schema = GUIDELINE_RESULT_TOOL.input_schema as Record<string, unknown>;
    expect(schema.required).toContain('title');
    expect(schema.required).toContain('rule');
  });
});

describe('시스템 프롬프트', () => {
  it('정적 분석 프롬프트에 감지 카테고리가 포함되어 있다', () => {
    expect(STATIC_ANALYSIS_SYSTEM).toContain('API 키/시크릿 노출');
    expect(STATIC_ANALYSIS_SYSTEM).toContain('인증/권한 부재');
    expect(STATIC_ANALYSIS_SYSTEM).toContain('자연어 명령어');
  });

  it('세션 비교 프롬프트에 감지 항목이 포함되어 있다', () => {
    expect(SESSION_COMPARISON_SYSTEM).toContain('기능 삭제');
    expect(SESSION_COMPARISON_SYSTEM).toContain('동작 변경');
  });

  it('가이드라인 프롬프트에 작성 가이드가 포함되어 있다', () => {
    expect(GUIDELINE_GENERATION_SYSTEM).toContain('명령형 문체');
    expect(GUIDELINE_GENERATION_SYSTEM).toContain('하지 마라');
  });
});
