import { describe, it, expect } from 'vitest';
import {
  buildStaticAnalysisMessage,
  buildSessionComparisonMessage,
  buildGuidelineMessage,
  buildStaticAnalysisSystem,
  buildSessionComparisonSystem,
  ANALYSIS_RESULT_TOOL,
  GUIDELINE_RESULT_TOOL,
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

  it('ANALYSIS_RESULT_TOOL의 issue 항목에 confidence/start_line/end_line이 required로 포함된다', () => {
    const schema = ANALYSIS_RESULT_TOOL.input_schema as {
      properties: { issues: { items: { required: string[]; properties: Record<string, { type: string }> } } };
    };
    const itemRequired = schema.properties.issues.items.required;
    const itemProps = schema.properties.issues.items.properties;

    expect(itemRequired).toContain('confidence');
    expect(itemRequired).toContain('start_line');
    expect(itemRequired).toContain('end_line');
    expect(itemProps.confidence.type).toBe('number');
    expect(itemProps.start_line.type).toBe('integer');
    expect(itemProps.end_line.type).toBe('integer');
  });

  it('GUIDELINE_RESULT_TOOL에 필수 필드가 정의되어 있다', () => {
    expect(GUIDELINE_RESULT_TOOL.name).toBe('report_guideline');
    const schema = GUIDELINE_RESULT_TOOL.input_schema as Record<string, unknown>;
    expect(schema.required).toContain('title');
    expect(schema.required).toContain('rule');
  });
});

describe('buildStaticAnalysisSystem — 6섹션 구조', () => {
  it('6개 섹션 헤더를 모두 포함한다', () => {
    const prompt = buildStaticAnalysisSystem('full');
    expect(prompt).toContain('# ① 역할 정의');
    expect(prompt).toContain('# ② 입력 포맷');
    expect(prompt).toContain('# ③ 판단 기준');
    expect(prompt).toContain('# ④ 작성 가이드');
    expect(prompt).toContain('# ⑤ 출력 스키마');
    expect(prompt).toContain('# ⑥ Example output');
  });

  it('diff 포맷 설명에 라인 prefix 의미가 포함된다', () => {
    const prompt = buildStaticAnalysisSystem('full');
    expect(prompt).toContain('`+`');
    expect(prompt).toContain('`-`');
    expect(prompt).toContain('컨텍스트');
  });

  it('partial-context 경고가 포함된다', () => {
    const prompt = buildStaticAnalysisSystem('full');
    expect(prompt).toContain('전체 코드베이스가 아니라');
    expect(prompt).toContain('외부에서 정의된 함수');
    expect(prompt).toContain('import');
  });

  it('Negative list가 포함된다', () => {
    const prompt = buildStaticAnalysisSystem('full');
    expect(prompt).toContain('docstring');
    expect(prompt).toContain('타입 힌트');
    expect(prompt).toContain('Prettier');
    expect(prompt).toContain('사용되지 않는 import');
    expect(prompt).toContain('패키지 버전');
    expect(prompt).toContain('console.log');
  });

  it('신뢰도 가이드가 포함된다', () => {
    const prompt = buildStaticAnalysisSystem('full');
    expect(prompt).toContain('확실한');
    expect(prompt).toContain('confidence');
    expect(prompt).toContain('불확실');
  });

  it('Example output 블록에 신규 필드가 포함된다', () => {
    const prompt = buildStaticAnalysisSystem('full');
    expect(prompt).toContain('"confidence":');
    expect(prompt).toContain('"start_line":');
    expect(prompt).toContain('"end_line":');
  });
});

describe('buildStaticAnalysisSystem — 모드 분기', () => {
  it('인자 없이 호출하면 full 모드와 동일한 출력을 반환한다', () => {
    expect(buildStaticAnalysisSystem()).toBe(buildStaticAnalysisSystem('full'));
  });

  it('full 모드는 13개 카테고리를 모두 포함한다', () => {
    const prompt = buildStaticAnalysisSystem('full');
    expect(prompt).toContain('API 키/시크릿 노출');
    expect(prompt).toContain('인증/권한 부재');
    expect(prompt).toContain('에러 처리 누락');
    expect(prompt).toContain('SQL 인젝션 위험');
    expect(prompt).toContain('XSS 위험');
    expect(prompt).toContain('민감 정보 로깅');
    expect(prompt).toContain('환경변수 미검증');
    expect(prompt).toContain('중복 API 엔드포인트');
    expect(prompt).toContain('레이어 무시');
    expect(prompt).toContain('순환 의존성');
    expect(prompt).toContain('거대 파일');
    expect(prompt).toContain('미사용 코드');
  });

  it('full 모드는 critical 5/warning 10/info 5 상한을 명시한다', () => {
    const prompt = buildStaticAnalysisSystem('full');
    expect(prompt).toContain('critical: 최대 5건');
    expect(prompt).toContain('warning: 최대 10건');
    expect(prompt).toContain('info: 최대 5건');
  });

  it('problems_only 모드는 "확실한 문제만 보고" 문구를 포함한다', () => {
    const prompt = buildStaticAnalysisSystem('problems_only');
    expect(prompt).toContain('확실한 보안/기능 문제만');
    expect(prompt).toContain('개선 제안');
  });

  it('problems_only 모드는 critical 3/warning 5/info 0 상한을 명시한다', () => {
    const prompt = buildStaticAnalysisSystem('problems_only');
    expect(prompt).toContain('critical: 최대 3건');
    expect(prompt).toContain('warning: 최대 5건');
    expect(prompt).toContain('info: 최대 0건');
  });

  it('problems_only 모드는 critical 5개 카테고리만 카테고리 선언으로 포함', () => {
    const prompt = buildStaticAnalysisSystem('problems_only');
    // 포함되는 critical 카테고리 선언 — "**이름** (critical)" 형식
    expect(prompt).toContain('**API 키/시크릿 노출** (critical)');
    expect(prompt).toContain('**인증/권한 부재** (critical)');
    expect(prompt).toContain('**SQL 인젝션 위험** (critical)');
    expect(prompt).toContain('**레이어 무시** (critical)');
    expect(prompt).toContain('**.env 파일이 .gitignore에 누락** (critical)');
    // 카테고리 선언으로 등장하지 않아야 하는 warning/info 항목
    expect(prompt).not.toContain('**에러 처리 누락** (warning)');
    expect(prompt).not.toContain('**XSS 위험** (warning)');
    expect(prompt).not.toContain('**민감 정보 로깅** (warning)');
    expect(prompt).not.toContain('**환경변수 미검증** (warning)');
    expect(prompt).not.toContain('**중복 API 엔드포인트** (warning)');
    expect(prompt).not.toContain('**순환 의존성** (warning)');
    expect(prompt).not.toContain('**거대 파일** (warning)');
    expect(prompt).not.toContain('**미사용 코드** (info)');
  });

  it('problems_only 모드는 추가 negative list 항목을 포함한다', () => {
    const prompt = buildStaticAnalysisSystem('problems_only');
    expect(prompt).toContain('성능 개선 제안');
    expect(prompt).toContain('best practice');
    expect(prompt).toContain('리팩토링 제안');
  });

  it('full ≠ problems_only — 두 모드는 서로 다른 프롬프트를 생성한다', () => {
    expect(buildStaticAnalysisSystem('full')).not.toBe(
      buildStaticAnalysisSystem('problems_only')
    );
  });
});

describe('buildSessionComparisonSystem — 모드 분기', () => {
  it('인자 없이 호출하면 full 모드와 동일하다', () => {
    expect(buildSessionComparisonSystem()).toBe(
      buildSessionComparisonSystem('full')
    );
  });

  it('full 모드는 6섹션 구조와 6개 카테고리를 갖는다', () => {
    const prompt = buildSessionComparisonSystem('full');
    expect(prompt).toContain('# ① 역할 정의');
    expect(prompt).toContain('# ② 입력 포맷');
    expect(prompt).toContain('# ③ 판단 기준');
    expect(prompt).toContain('# ④ 작성 가이드');
    expect(prompt).toContain('# ⑤ 출력 스키마');
    expect(prompt).toContain('# ⑥ Example output');
    // 6개 카테고리 선언 (기존 4 + 신규 2)
    expect(prompt).toContain('**기능 삭제**');
    expect(prompt).toContain('**동작 변경**');
    expect(prompt).toContain('**설정 변경**');
    expect(prompt).toContain('**의존성 제거**');
    expect(prompt).toContain('**API 계약 변경**');
    expect(prompt).toContain('**스키마 변경**');
  });

  it('full 모드는 critical 5/warning 5/info 3 상한을 명시한다', () => {
    const prompt = buildSessionComparisonSystem('full');
    expect(prompt).toContain('critical: 최대 5건');
    expect(prompt).toContain('warning: 최대 5건');
    expect(prompt).toContain('info: 최대 3건');
  });

  it('problems_only 모드는 기능 삭제 + 스키마 변경만 카테고리 선언으로 포함', () => {
    const prompt = buildSessionComparisonSystem('problems_only');
    expect(prompt).toContain('**기능 삭제**');
    expect(prompt).toContain('**스키마 변경**');
    // 카테고리 선언으로 등장하지 않아야 하는 항목
    expect(prompt).not.toContain('**동작 변경**');
    expect(prompt).not.toContain('**설정 변경**');
    expect(prompt).not.toContain('**의존성 제거**');
    expect(prompt).not.toContain('**API 계약 변경**');
  });

  it('problems_only 모드는 critical 3/warning 2/info 0 상한을 명시한다', () => {
    const prompt = buildSessionComparisonSystem('problems_only');
    expect(prompt).toContain('critical: 최대 3건');
    expect(prompt).toContain('warning: 최대 2건');
    expect(prompt).toContain('info: 최대 0건');
  });

  it('partial-context 경고와 신뢰도 가이드가 양쪽 모드에 포함된다', () => {
    for (const mode of ['full', 'problems_only'] as const) {
      const prompt = buildSessionComparisonSystem(mode);
      expect(prompt).toContain('전체 코드베이스');
      expect(prompt).toContain('confidence');
      expect(prompt).toContain('리팩토링');
    }
  });
});

describe('buildSessionComparisonSystem — A/B/C 판정 구조', () => {
  it('full 모드는 A/B/C 3티어 판정 트리를 명시한다', () => {
    const prompt = buildSessionComparisonSystem('full');
    expect(prompt).toContain('A → B → C');
    expect(prompt).toContain('### A. 명확한 의도적 변경');
    expect(prompt).toContain('### B. 의심스러운 변경');
    expect(prompt).toContain('### C. 확실한 사고');
  });

  it('A 티어는 "보고하지 마세요" 지침을 포함한다', () => {
    const prompt = buildSessionComparisonSystem('full');
    expect(prompt).toMatch(/A[\s\S]*명확한 의도적 변경[\s\S]*보고하지 마세요/);
    expect(prompt).toContain('이름·위치만 바뀐 리팩토링');
    expect(prompt).toContain('파일 이동(rename)');
  });

  it('B 티어는 warning + confidence 0.6~0.85를 매핑한다', () => {
    const prompt = buildSessionComparisonSystem('full');
    expect(prompt).toMatch(/B[\s\S]*의심스러운[\s\S]*warning[\s\S]*0\.6~0\.85/);
    expect(prompt).toContain('대체 구현이 diff에 보이지 않음');
    expect(prompt).toContain('패키지를 사용하는 코드가 diff에 잔존');
  });

  it('C 티어는 critical + confidence 0.9+를 매핑한다', () => {
    const prompt = buildSessionComparisonSystem('full');
    expect(prompt).toMatch(/C[\s\S]*확실한 사고[\s\S]*critical[\s\S]*0\.9\+/);
    expect(prompt).toContain('핵심 파일');
    expect(prompt).toContain('마이그레이션 파일 없음');
  });

  it('problems_only 모드는 C 티어 위주 가이드를 명시한다', () => {
    const prompt = buildSessionComparisonSystem('problems_only');
    expect(prompt).toContain('C 티어');
    expect(prompt).toMatch(/B 티어.*무시/);
    // problems_only에는 full의 A→B→C 평가 트리가 들어가지 않음 (간소화 버전 사용)
    expect(prompt).not.toContain('A → B → C');
  });
});

describe('buildSessionComparisonSystem — Example output', () => {
  it('full 모드 ⑥은 critical + warning 두 예시를 포함한다', () => {
    const prompt = buildSessionComparisonSystem('full');
    // critical 예시 — 결제 API route 삭제
    expect(prompt).toContain('"결제 API route 삭제"');
    expect(prompt).toContain('app/api/checkout/route.ts');
    expect(prompt).toContain('"level": "critical"');
    // warning 예시 — Stripe 의존성 제거 + 사용 코드 잔존
    expect(prompt).toContain('"Stripe 의존성 제거 + 사용 코드 잔존"');
    expect(prompt).toContain('src/hooks/useCheckout.ts');
    expect(prompt).toContain('"level": "warning"');
  });

  it('problems_only 모드 ⑥은 critical 예시 1개만 포함한다', () => {
    const prompt = buildSessionComparisonSystem('problems_only');
    expect(prompt).toContain('"결제 API route 삭제"');
    expect(prompt).toContain('"level": "critical"');
    // warning 예시는 problems_only 예시에 없어야 함
    expect(prompt).not.toContain('"Stripe 의존성 제거 + 사용 코드 잔존"');
  });

  it('Example output에 신규 필드(confidence/start_line/end_line)가 포함된다', () => {
    const prompt = buildSessionComparisonSystem('full');
    expect(prompt).toContain('"confidence":');
    expect(prompt).toContain('"start_line":');
    expect(prompt).toContain('"end_line":');
  });
});

describe('GUIDELINE_GENERATION_SYSTEM', () => {
  it('가이드라인 프롬프트에 작성 가이드가 포함된다', () => {
    expect(GUIDELINE_GENERATION_SYSTEM).toContain('명령형 문체');
    expect(GUIDELINE_GENERATION_SYSTEM).toContain('하지 마라');
  });
});
