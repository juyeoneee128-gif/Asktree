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
  formatSignaturesSection,
} from '../prompts';

describe('도구 스키마', () => {
  it('EXTRACT_FEATURES_TOOL에 features 필드가 정의되어 있다', () => {
    expect(EXTRACT_FEATURES_TOOL.name).toBe('report_extracted_features');
    const schema = EXTRACT_FEATURES_TOOL.input_schema as Record<string, unknown>;
    expect(schema.required).toContain('features');
  });

  it('EXTRACT_FEATURES_TOOL은 document_type을 enum + required로 정의한다', () => {
    const schema = EXTRACT_FEATURES_TOOL.input_schema as {
      properties: { document_type: { type: string; enum: string[] } };
      required: string[];
    };
    expect(schema.required).toContain('document_type');
    expect(schema.required).toContain('features');
    expect(schema.properties.document_type.type).toBe('string');
    expect(schema.properties.document_type.enum).toEqual(['prd', 'spec', 'other']);
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
    expect(EXTRACT_FEATURES_SYSTEM).toContain('기능을 추출');
    expect(EXTRACT_FEATURES_SYSTEM).toContain('UI/디자인');
  });

  it('기능 추출 프롬프트에 1단계 분류 + 2단계 추출 가이드가 포함된다', () => {
    expect(EXTRACT_FEATURES_SYSTEM).toContain('1단계: 문서 분류');
    expect(EXTRACT_FEATURES_SYSTEM).toContain('2단계: 기능 추출');
    // 3개 분류 라벨 + 정의 키워드
    expect(EXTRACT_FEATURES_SYSTEM).toContain('"prd"');
    expect(EXTRACT_FEATURES_SYSTEM).toContain('"spec"');
    expect(EXTRACT_FEATURES_SYSTEM).toContain('"other"');
    expect(EXTRACT_FEATURES_SYSTEM).toContain('컴포넌트 목록');
    expect(EXTRACT_FEATURES_SYSTEM).toContain('회의록');
    expect(EXTRACT_FEATURES_SYSTEM).toContain('핸드오프');
    // other이면 빈 배열 강제
    expect(EXTRACT_FEATURES_SYSTEM).toContain('"other"이면 features를 반드시 빈 배열');
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

describe('buildAssessMessage — file_signatures 통합', () => {
  function feature(id = 'f1', name = '로그인') {
    return { id, name, total_items: 3, prd_summary: '이메일 로그인' };
  }

  it('시그니처 없으면 시그니처 섹션을 포함하지 않는다 (기존 동작 보존)', () => {
    const msg = buildAssessMessage({
      features: [feature()],
      sessions: [{ title: 's', summary: null, changed_files: [] }],
    });
    expect(msg).not.toContain('## 파일 시그니처');
  });

  it('시그니처가 있으면 메시지에 포함된다', () => {
    const msg = buildAssessMessage({
      features: [feature()],
      sessions: [],
      file_signatures: [
        {
          file_path: 'src/auth/login.ts',
          functions: ['handleLogin', 'validateEmail'],
          imports: ['next/server'],
          exports: ['handleLogin'],
          patterns: ['supabase.auth.signInWithPassword'],
          line_count: 120,
        },
      ],
    });
    expect(msg).toContain('## 파일 시그니처');
    expect(msg).toContain('src/auth/login.ts (line 120)');
    expect(msg).toContain('fns: handleLogin, validateEmail');
    expect(msg).toContain('imports: next/server');
    expect(msg).toContain('patterns: supabase.auth.signInWithPassword');
  });

  it('빈 항목(예: imports)은 출력되지 않는다', () => {
    const msg = buildAssessMessage({
      features: [feature()],
      sessions: [],
      file_signatures: [
        {
          file_path: 'a.ts',
          functions: ['foo'],
          imports: [],
          exports: [],
          patterns: [],
          line_count: 10,
        },
      ],
    });
    expect(msg).toContain('fns: foo');
    expect(msg).not.toContain('imports:');
    expect(msg).not.toContain('patterns:');
  });
});

describe('formatSignaturesSection — 토큰 한도 처리', () => {
  it('빈 배열은 빈 문자열', () => {
    expect(formatSignaturesSection([])).toBe('');
  });

  it('line_count desc 정렬 후 작은 파일이 먼저 잘린다', () => {
    // 큰 시그니처 여러 개 만들어서 한도 초과 유도
    const many = Array.from({ length: 200 }, (_, i) => ({
      file_path: `src/f${i}.ts`,
      functions: ['fn1', 'fn2', 'fn3', 'fn4', 'fn5'],
      imports: ['mod1', 'mod2'],
      exports: ['e1'],
      patterns: ['supabase.auth.x', 'fetch'],
      line_count: i + 1, // i 작을수록 작은 파일
    }));

    const out = formatSignaturesSection(many);
    // 가장 큰 파일은 포함됨
    expect(out).toContain('src/f199.ts');
    // 한도로 잘렸다는 footer 있음
    expect(out).toContain('생략됨');
  });

  it('한도 안에 들어가면 모두 포함', () => {
    const small = [
      {
        file_path: 'a.ts',
        functions: ['f'],
        imports: [],
        exports: [],
        patterns: [],
        line_count: 5,
      },
    ];
    const out = formatSignaturesSection(small);
    expect(out).toContain('a.ts');
    expect(out).not.toContain('생략됨');
  });
});

describe('ASSESS_FEATURES_SYSTEM — 시그니처 강화', () => {
  it('시그니처 활용 + fallback 키워드 포함', () => {
    expect(ASSESS_FEATURES_SYSTEM).toContain('파일 시그니처');
    expect(ASSESS_FEATURES_SYSTEM).toContain('Fallback');
    expect(ASSESS_FEATURES_SYSTEM).toContain('합집합 머지');
    expect(ASSESS_FEATURES_SYSTEM).toContain('패턴 부재가 더 강한 신호');
    // status 정의 보존
    expect(ASSESS_FEATURES_SYSTEM).toContain('implemented');
    expect(ASSESS_FEATURES_SYSTEM).toContain('partial');
    expect(ASSESS_FEATURES_SYSTEM).toContain('unimplemented');
    expect(ASSESS_FEATURES_SYSTEM).toContain('attention');
  });
});
