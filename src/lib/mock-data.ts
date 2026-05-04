/**
 * CodeSasu Mock Data (중앙 관리)
 * API 연동 시 이 파일만 교체하면 됨.
 */

// ─── 프로젝트 ───

export interface Project {
  id: string;
  name: string;
  agentStatus: 'connected' | 'disconnected';
  lastAnalysis?: string;
  issueCount: { critical: number; warning: number; info: number };
  implementationRate: number;
  createdAt: string;
}

export const mockProjects: Project[] = [
  {
    id: 'proj-1',
    name: 'CodeSasu',
    agentStatus: 'connected',
    lastAnalysis: '5분 전',
    issueCount: { critical: 2, warning: 3, info: 1 },
    implementationRate: 65,
    createdAt: '2026-03-28',
  },
  {
    id: 'proj-2',
    name: 'My SaaS',
    agentStatus: 'disconnected',
    lastAnalysis: '2시간 전',
    issueCount: { critical: 0, warning: 1, info: 0 },
    implementationRate: 40,
    createdAt: '2026-03-15',
  },
  {
    id: 'proj-3',
    name: 'Portfolio Site',
    agentStatus: 'connected',
    issueCount: { critical: 0, warning: 0, info: 0 },
    implementationRate: 100,
    createdAt: '2026-02-20',
  },
];

// ─── 이슈 ───

export type IssueLevel = 'critical' | 'warning' | 'info';
export type IssueStatus = 'unconfirmed' | 'confirmed' | 'resolved';

export interface Issue {
  id: string;
  title: string;
  level: IssueLevel;
  status: IssueStatus;
  fact: string;
  detail: string;
  fixCommand: string;
  file: string;
  basis: string;
  detectedAt: string;
  isRedetected?: boolean;
  confidence?: number;
  startLine?: number;
  endLine?: number;
}

export const mockIssues: Issue[] = [
  {
    id: 'issue-1',
    title: 'API 키가 코드에 노출됨',
    level: 'critical',
    status: 'unconfirmed',
    fact: '소스 코드에 API 키가 하드코딩되어 있습니다. 이 키가 Git에 커밋되면 외부에 노출될 수 있습니다.',
    detail: 'src/config.ts 파일 12번째 줄에 Anthropic API 키가 직접 문자열로 입력되어 있습니다. 이는 OWASP Top 10의 A01:2021 – Broken Access Control에 해당합니다.',
    fixCommand: 'src/config.ts 파일에서 하드코딩된 API 키를 환경변수(process.env.ANTHROPIC_API_KEY)로 교체해줘. .env.local 파일에 키를 옮기고, .gitignore에 .env.local이 포함되어 있는지 확인해줘.',
    file: 'src/config.ts:12',
    basis: 'API 키 하드코딩 패턴 감지',
    detectedAt: '2분 전',
  },
  {
    id: 'issue-2',
    title: '인증 미들웨어 부재',
    level: 'critical',
    status: 'unconfirmed',
    fact: 'API 라우트에 인증 체크가 없어서 누구나 데이터에 접근할 수 있습니다.',
    detail: 'app/api/ 하위 라우트 핸들러 8개 중 인증 미들웨어가 적용된 것이 0개입니다.',
    fixCommand: 'app/api/ 하위의 모든 라우트 핸들러에 인증 미들웨어를 추가해줘. middleware.ts에서 /api/* 경로에 대해 세션 토큰을 검증하도록 구현해줘.',
    file: 'app/api/',
    basis: '인증 미들웨어 부재 감지',
    detectedAt: '2분 전',
  },
  {
    id: 'issue-3',
    title: 'API 호출 에러 처리 누락',
    level: 'warning',
    status: 'unconfirmed',
    fact: 'API 호출 시 에러 처리가 누락되어 있어, 서버 오류 시 사용자에게 빈 화면이 표시될 수 있습니다.',
    detail: 'src/api/auth.ts의 loginUser 함수에서 fetch 호출이 try-catch 없이 실행됩니다.',
    fixCommand: 'src/api/auth.ts 파일의 loginUser 함수에 try-catch를 추가해줘. catch 블록에서 에러를 콘솔에 출력하고, 사용자에게 "로그인에 실패했습니다" 메시지를 보여줘.',
    file: 'src/api/auth.ts:42',
    basis: 'try-catch 누락 감지',
    detectedAt: '5분 전',
  },
  {
    id: 'issue-4',
    title: '환경변수 검증 누락',
    level: 'warning',
    status: 'unconfirmed',
    fact: '필수 환경변수가 설정되지 않았을 때 서버가 조용히 실패합니다.',
    detail: 'SUPABASE_URL, SUPABASE_ANON_KEY 등 필수 환경변수의 존재 여부를 체크하는 코드가 없습니다.',
    fixCommand: 'src/lib/env.ts 파일을 만들어서 필수 환경변수를 검증하는 함수를 추가해줘. 서버 시작 시 누락된 환경변수가 있으면 에러를 throw해줘.',
    file: 'src/lib/supabase.ts',
    basis: '환경변수 미검증 감지',
    detectedAt: '5분 전',
  },
  {
    id: 'issue-5',
    title: '미호출 함수 존재',
    level: 'info',
    status: 'confirmed',
    fact: 'formatCurrency 함수가 정의되어 있지만 어디서도 호출되지 않습니다.',
    detail: 'src/utils/format.ts에 정의된 formatCurrency가 프로젝트 전체에서 import되지 않습니다.',
    fixCommand: 'src/utils/format.ts에서 formatCurrency 함수가 호출되지 않고 있어. 이 함수가 실제로 필요한지 확인하고, 불필요하면 삭제해줘.',
    file: 'src/utils/format.ts:8',
    basis: '미사용 코드 감지',
    detectedAt: '10분 전',
  },
  {
    id: 'issue-6',
    title: '보안 헤더 설정 누락',
    level: 'warning',
    status: 'resolved',
    fact: 'HTTP 보안 헤더가 설정되지 않아 XSS, 클릭재킹 등의 공격에 취약합니다.',
    detail: 'next.config.ts에 보안 관련 HTTP 헤더(CSP, X-Frame-Options 등)가 설정되어 있지 않습니다.',
    fixCommand: 'next.config.ts에 보안 헤더를 추가해줘.',
    file: 'next.config.ts',
    basis: '보안 헤더 미설정 감지',
    detectedAt: '1시간 전',
  },
];

// ─── CLAUDE.md 가이드라인 ───

export interface Guideline {
  id: string;
  title: string;
  rule: string;
  status: 'unapplied' | 'applied';
  sourceIssueId: string;
  detectedAt: string;
}

export const mockGuidelines: Guideline[] = [
  {
    id: 'guide-1',
    title: 'API 키 보안',
    rule: `# 보호 규칙: API 키 보안\n- src/config.ts의 API_KEY는 반드시 환경변수로 관리\n- 하드코딩된 API 키를 절대 커밋하지 않음\n- .env 파일은 .gitignore에 포함`,
    status: 'unapplied',
    sourceIssueId: 'issue-1',
    detectedAt: '2분 전',
  },
  {
    id: 'guide-2',
    title: '인증 미들웨어 필수',
    rule: `# 보호 규칙: 인증 미들웨어\n- app/api/ 하위 모든 라우트에 인증 미들웨어 적용 필수\n- 인증 없는 API 엔드포인트를 절대 생성하지 않음`,
    status: 'unapplied',
    sourceIssueId: 'issue-2',
    detectedAt: '2분 전',
  },
  {
    id: 'guide-3',
    title: '보안 헤더 유지',
    rule: `# 보호 규칙: 보안 헤더\n- next.config.ts의 보안 헤더 설정을 삭제하지 않음\n- CSP, X-Frame-Options, X-Content-Type-Options 필수 유지`,
    status: 'applied',
    sourceIssueId: 'issue-6',
    detectedAt: '1시간 전',
  },
];

// ─── 현황 (기능 목록) ───

export type FeatureStatus = 'implemented' | 'partial' | 'attention' | 'unimplemented';

export interface FeatureItem {
  name: string;
  line?: number;
  checked: boolean;
}

export interface Feature {
  id: string;
  name: string;
  status: FeatureStatus;
  implementedItems: FeatureItem[];
  totalItems: number;
  issueCount: number;
  lastSession: string;
  techStack: string;
  relatedFiles: string[];
  prdSummary?: string;
}

export const mockFeatures: Feature[] = [
  {
    id: 'feat-1',
    name: '사용자 인증 (로그인/회원가입)',
    status: 'implemented',
    implementedItems: [
      { name: 'Google OAuth 로그인', line: 15, checked: true },
      { name: '세션 관리', line: 42, checked: true },
      { name: '로그아웃', line: 67, checked: true },
    ],
    totalItems: 3,
    issueCount: 0,
    lastSession: '세션 #12',
    techStack: 'NextAuth, Supabase',
    relatedFiles: ['src/app/api/auth/[...nextauth]/route.ts', 'src/lib/auth.ts'],
    prdSummary: 'Google OAuth를 통한 로그인. 세션 토큰 기반 인증.',
  },
  {
    id: 'feat-2',
    name: '대시보드 메인 페이지',
    status: 'partial',
    implementedItems: [
      { name: '프로젝트 카드 그리드', line: 8, checked: true },
      { name: '프로젝트 생성', line: 0, checked: false },
      { name: '프로젝트 삭제', line: 0, checked: false },
    ],
    totalItems: 3,
    issueCount: 1,
    lastSession: '세션 #11',
    techStack: 'Next.js, React',
    relatedFiles: ['src/app/projects/page.tsx'],
    prdSummary: '프로젝트 목록 표시. 생성/삭제/편집 기능.',
  },
  {
    id: 'feat-3',
    name: 'API 연동 (Supabase)',
    status: 'attention',
    implementedItems: [
      { name: 'Supabase 클라이언트 초기화', line: 5, checked: true },
      { name: '프로젝트 CRUD', line: 20, checked: true },
      { name: '에러 핸들링', line: 0, checked: false },
    ],
    totalItems: 3,
    issueCount: 2,
    lastSession: '세션 #10',
    techStack: 'Supabase, PostgreSQL',
    relatedFiles: ['src/lib/supabase.ts', 'src/api/projects.ts'],
    prdSummary: 'Supabase를 통한 데이터 저장. 프로젝트/세션/이슈 관리.',
  },
  {
    id: 'feat-4',
    name: '결제 시스템',
    status: 'unimplemented',
    implementedItems: [],
    totalItems: 4,
    issueCount: 0,
    lastSession: '-',
    techStack: '-',
    relatedFiles: [],
    prdSummary: '크레딧 충전 및 구독 관리. Phase 2 예정.',
  },
];

// ─── 세션 ───

export type SessionLogEntry =
  | { type: 'user'; content: string }
  | { type: 'assistant'; content: string }
  | {
      type: 'tool';
      action: string;
      file?: string;
      lines?: { kind: 'add' | 'remove' | 'info'; text: string }[];
    };

export interface Session {
  id: string;
  number: number;
  title: string;
  date: string;
  filesChanged: number;
  toolUseCount: number;
  hasIssue?: boolean;
  summary: string;
  changedFiles: { name: string; type: 'new' | 'modified' }[];
  prompts: string[];
  log: SessionLogEntry[];
}

export const mockSessions: Session[] = [
  {
    id: 'session-9',
    number: 9,
    title: '대시보드 리팩토링',
    date: '오늘 14:20',
    filesChanged: 2,
    toolUseCount: 6,
    hasIssue: true,
    summary: '대시보드 카드 컴포넌트를 분리하고 props 구조를 단순화했습니다. 다만 일부 영역에서 hardcoded 값이 남아 후속 분석이 필요합니다.',
    changedFiles: [
      { name: 'app/dashboard/page.tsx', type: 'modified' },
      { name: 'components/DashboardCard.tsx', type: 'new' },
    ],
    prompts: [
      '대시보드의 카드 영역을 별도 컴포넌트로 분리해줘.',
    ],
    log: [
      { type: 'user', content: '대시보드의 카드 영역을 별도 컴포넌트로 분리해줘.' },
      { type: 'assistant', content: '카드 부분을 DashboardCard 컴포넌트로 추출하고, props로 title/value/trend 를 받도록 정리하겠습니다.' },
      {
        type: 'tool',
        action: 'Create file',
        file: 'components/DashboardCard.tsx',
        lines: [
          { kind: 'info', text: '  + DashboardCard({ title, value, trend })' },
          { kind: 'info', text: '  + 트렌드 화살표 아이콘 처리' },
        ],
      },
      {
        type: 'tool',
        action: 'Edit file',
        file: 'app/dashboard/page.tsx',
        lines: [
          { kind: 'remove', text: '  - 인라인 카드 마크업 4블록' },
          { kind: 'add', text: '  + DashboardCard 인스턴스 4개로 교체' },
        ],
      },
    ],
  },
  {
    id: 'session-8',
    number: 8,
    title: '거래 입력 기능 추가',
    date: '오늘 11:05',
    filesChanged: 3,
    toolUseCount: 7,
    summary: '거래 입력 테이블에 행 추가, 수정, 삭제 기능과 기간 필터를 구현했습니다.',
    changedFiles: [
      { name: 'transactions/page.tsx', type: 'new' },
      { name: 'lib/transaction-api.ts', type: 'new' },
      { name: 'components/Table.tsx', type: 'modified' },
    ],
    prompts: [
      '거래 내역을 입력하고 수정할 수 있는 테이블을 만들어줘. 기간 필터도 넣어줘.',
    ],
    log: [
      {
        type: 'user',
        content: '거래 내역을 입력하고 수정할 수 있는 테이블을 만들어줘. 기간 필터도 넣어줘.',
      },
      {
        type: 'assistant',
        content:
          "I'll create a transaction input table with CRUD functionality and a date range filter. Let me start by setting up the database schema and API routes.",
      },
      {
        type: 'tool',
        action: 'Create file',
        file: 'lib/transaction-api.ts',
        lines: [
          { kind: 'info', text: '  + createTransaction(data)' },
          { kind: 'info', text: '  + updateTransaction(id, data)' },
          { kind: 'info', text: '  + deleteTransaction(id)' },
          { kind: 'info', text: '  + getTransactions(dateRange)' },
        ],
      },
      {
        type: 'tool',
        action: 'Create file',
        file: 'transactions/page.tsx',
        lines: [
          { kind: 'info', text: '  + TransactionTable component' },
          { kind: 'info', text: '  + DateRangeFilter component' },
          { kind: 'info', text: '  + AddRowButton, EditModal, DeleteConfirm' },
        ],
      },
      {
        type: 'tool',
        action: 'Edit file',
        file: 'components/Table.tsx',
        lines: [
          { kind: 'remove', text: '  - Removed hardcoded columns' },
          { kind: 'add', text: '  + Added dynamic column config' },
          { kind: 'add', text: '  + Added sortable headers' },
        ],
      },
    ],
  },
  {
    id: 'session-7',
    number: 7,
    title: '수수료 정책 구현',
    date: '어제 16:30',
    filesChanged: 1,
    toolUseCount: 3,
    summary: '거래 금액에 따른 수수료 계산 로직을 추가했습니다.',
    changedFiles: [{ name: 'lib/fee-policy.ts', type: 'new' }],
    prompts: ['거래 금액별 수수료 정책을 적용해줘.'],
    log: [
      { type: 'user', content: '거래 금액별 수수료 정책을 적용해줘.' },
      { type: 'assistant', content: '구간별 수수료 테이블을 만들고 함수로 계산하도록 구현하겠습니다.' },
      {
        type: 'tool',
        action: 'Create file',
        file: 'lib/fee-policy.ts',
        lines: [
          { kind: 'info', text: '  + FEE_TIERS 상수' },
          { kind: 'info', text: '  + calculateFee(amount)' },
        ],
      },
    ],
  },
  {
    id: 'session-6',
    number: 6,
    title: '거래처 등록 기능 구현',
    date: '어제 10:15',
    filesChanged: 4,
    toolUseCount: 9,
    summary: '거래처 CRUD와 검색/필터 기능을 추가했습니다.',
    changedFiles: [
      { name: 'partners/page.tsx', type: 'new' },
      { name: 'lib/partner-api.ts', type: 'new' },
      { name: 'components/SearchBox.tsx', type: 'new' },
      { name: 'components/Sidebar.tsx', type: 'modified' },
    ],
    prompts: ['거래처를 등록/검색할 수 있는 페이지를 만들어줘.'],
    log: [
      { type: 'user', content: '거래처를 등록/검색할 수 있는 페이지를 만들어줘.' },
      { type: 'assistant', content: '거래처 페이지와 API 모듈, 그리고 공용 검색 박스 컴포넌트를 만들겠습니다.' },
      {
        type: 'tool',
        action: 'Create file',
        file: 'partners/page.tsx',
        lines: [{ kind: 'info', text: '  + PartnersPage 라우트' }],
      },
      {
        type: 'tool',
        action: 'Create file',
        file: 'lib/partner-api.ts',
        lines: [
          { kind: 'info', text: '  + listPartners()' },
          { kind: 'info', text: '  + createPartner()' },
        ],
      },
    ],
  },
  {
    id: 'session-5',
    number: 5,
    title: '인증 설정',
    date: '3/15 14:00',
    filesChanged: 2,
    toolUseCount: 5,
    summary: 'Google OAuth 로그인을 연결하고 세션 미들웨어를 추가했습니다.',
    changedFiles: [
      { name: 'app/api/auth/[...nextauth]/route.ts', type: 'new' },
      { name: 'middleware.ts', type: 'modified' },
    ],
    prompts: ['NextAuth로 Google OAuth를 붙여줘.'],
    log: [
      { type: 'user', content: 'NextAuth로 Google OAuth를 붙여줘.' },
      { type: 'assistant', content: 'NextAuth providers에 Google을 추가하고 미들웨어로 보호하겠습니다.' },
    ],
  },
  {
    id: 'session-4',
    number: 4,
    title: '프로젝트 초기 세팅',
    date: '3/15 09:30',
    filesChanged: 3,
    toolUseCount: 4,
    summary: '디렉토리 구조를 정리하고 기본 라우트를 만들었습니다.',
    changedFiles: [
      { name: 'app/layout.tsx', type: 'modified' },
      { name: 'app/page.tsx', type: 'new' },
      { name: 'next.config.ts', type: 'modified' },
    ],
    prompts: ['App Router 기준으로 기본 폴더 구조를 잡아줘.'],
    log: [
      { type: 'user', content: 'App Router 기준으로 기본 폴더 구조를 잡아줘.' },
      { type: 'assistant', content: 'app/ 하위 라우트와 layout, page 파일을 정리했습니다.' },
    ],
  },
  {
    id: 'session-3',
    number: 3,
    title: 'DB 스키마 설계',
    date: '3/14 15:00',
    filesChanged: 2,
    toolUseCount: 3,
    summary: 'Supabase에 users, projects 테이블을 생성하는 마이그레이션을 작성했습니다.',
    changedFiles: [
      { name: 'supabase/migrations/001_init.sql', type: 'new' },
      { name: 'lib/types.ts', type: 'modified' },
    ],
    prompts: ['users, projects 테이블 스키마를 만들어줘.'],
    log: [
      { type: 'user', content: 'users, projects 테이블 스키마를 만들어줘.' },
      { type: 'assistant', content: 'PK/FK 관계와 created_at 컬럼을 포함해 마이그레이션을 작성했습니다.' },
    ],
  },
  {
    id: 'session-2',
    number: 2,
    title: 'UI 프레임워크 설정',
    date: '3/14 10:00',
    filesChanged: 5,
    toolUseCount: 6,
    summary: 'Tailwind v4와 디자인 토큰을 설정하고 폰트를 적용했습니다.',
    changedFiles: [
      { name: 'app/globals.css', type: 'new' },
      { name: 'tailwind.config.ts', type: 'new' },
      { name: 'app/layout.tsx', type: 'modified' },
      { name: 'package.json', type: 'modified' },
      { name: 'postcss.config.js', type: 'new' },
    ],
    prompts: ['Tailwind v4와 Pretendard 폰트를 적용해줘.'],
    log: [
      { type: 'user', content: 'Tailwind v4와 Pretendard 폰트를 적용해줘.' },
      { type: 'assistant', content: 'globals.css에 디자인 토큰을 정의하고 layout에 폰트를 연결했습니다.' },
    ],
  },
  {
    id: 'session-1',
    number: 1,
    title: '프로젝트 생성',
    date: '3/13 14:00 · 첫 분석',
    filesChanged: 0,
    toolUseCount: 1,
    summary: 'Next.js 프로젝트를 새로 만들고 CodeSasu 에이전트를 연결했습니다.',
    changedFiles: [],
    prompts: ['Next.js 16 프로젝트를 만들어줘.'],
    log: [
      { type: 'user', content: 'Next.js 16 프로젝트를 만들어줘.' },
      { type: 'assistant', content: 'create-next-app 으로 새 프로젝트를 생성했습니다.' },
    ],
  },
];

// ─── 기획서 ───

export type SpecDocType = 'FRD' | 'PRD';

export interface SpecDocument {
  id: string;
  name: string;
  uploadedAt: string;
  type: SpecDocType;
}

export interface SpecFeature {
  id: string;
  name: string;
  /** 이 기능이 추출된 문서의 종류들 (한 기능이 여러 문서에 등장할 수 있음) */
  sources: SpecDocType[];
  status: FeatureStatus;
}

export const mockSpecDocuments: SpecDocument[] = [
  {
    id: 'doc-1',
    name: 'MVP_기능정의서_FRD_v1.0.md',
    uploadedAt: '2026.03.10',
    type: 'FRD',
  },
  {
    id: 'doc-2',
    name: 'CodeSasu_PRD_v6.0.md',
    uploadedAt: '2026.03.17',
    type: 'PRD',
  },
];

export const mockSpecFeatures: SpecFeature[] = [
  { id: 'sf-1', name: '거래처 등록/관리', sources: ['FRD'], status: 'implemented' },
  { id: 'sf-2', name: '인플루언서 구분/원천세 설정', sources: ['FRD'], status: 'unimplemented' },
  { id: 'sf-3', name: '판매수수료 정책 관리', sources: ['FRD'], status: 'implemented' },
  { id: 'sf-4', name: '거래 입력 테이블', sources: ['FRD'], status: 'partial' },
  { id: 'sf-5', name: '집계/리포트', sources: ['PRD'], status: 'implemented' },
  { id: 'sf-6', name: '발행(지시) 리스트', sources: ['PRD'], status: 'implemented' },
  { id: 'sf-7', name: '세금 체크리스트 + 알림', sources: ['FRD', 'PRD'], status: 'unimplemented' },
];

// ─── 사용자 ───

export interface User {
  name: string;
  email: string;
  avatar?: string;
  loginMethod: 'Google';
  credits: number;
  totalCredits: number;
  usedThisMonth: number;
}

export const mockUser: User = {
  name: '홍길동',
  email: 'user@example.com',
  loginMethod: 'Google',
  credits: 36,
  totalCredits: 100,
  usedThisMonth: 64,
};
