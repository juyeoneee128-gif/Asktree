/**
 * Asktree Mock Data (중앙 관리)
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
    name: 'Asktree',
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

export interface Session {
  id: string;
  number: number;
  title: string;
  date: string;
  filesChanged: number;
  summary: string;
  changedFiles: { name: string; type: 'new' | 'modified' }[];
  prompts: string[];
  rawLog: string;
}

export const mockSessions: Session[] = [
  {
    id: 'session-12',
    number: 12,
    title: '인증 시스템 구현',
    date: '2026-04-03 14:30',
    filesChanged: 5,
    summary: 'Google OAuth 로그인을 구현하고, NextAuth 설정을 완료했습니다. 세션 관리와 로그아웃 기능을 추가했습니다.',
    changedFiles: [
      { name: 'src/app/api/auth/[...nextauth]/route.ts', type: 'new' },
      { name: 'src/lib/auth.ts', type: 'new' },
      { name: 'src/middleware.ts', type: 'modified' },
      { name: 'package.json', type: 'modified' },
      { name: '.env.local', type: 'modified' },
    ],
    prompts: [
      'Google OAuth 로그인을 구현해줘. NextAuth를 사용해서.',
      '세션 미들웨어를 추가해줘. /api/* 경로는 인증이 필요하게.',
    ],
    rawLog: '> User: Google OAuth 로그인을 구현해줘...\n> Assistant: NextAuth.js를 설정하겠습니다...\n> [파일 생성] src/app/api/auth/[...nextauth]/route.ts\n> ...',
  },
  {
    id: 'session-11',
    number: 11,
    title: '프로젝트 카드 UI 구현',
    date: '2026-04-02 16:00',
    filesChanged: 3,
    summary: '프로젝트 메인 홈의 카드 그리드 레이아웃을 구현했습니다.',
    changedFiles: [
      { name: 'src/app/projects/page.tsx', type: 'modified' },
      { name: 'src/components/ProjectCard.tsx', type: 'new' },
      { name: 'src/styles/globals.css', type: 'modified' },
    ],
    prompts: [
      '프로젝트 메인 페이지에 카드 그리드를 만들어줘.',
    ],
    rawLog: '> User: 프로젝트 메인 페이지에 카드 그리드를 만들어줘...\n> Assistant: 프로젝트 카드 컴포넌트를 만들겠습니다...\n> ...',
  },
];

// ─── 기획서 ───

export interface SpecDocument {
  id: string;
  name: string;
  uploadedAt: string;
  type: 'FRD' | 'PRD';
}

export interface SpecFeature {
  id: string;
  name: string;
  source: 'FRD' | 'PRD';
  status: FeatureStatus;
}

export const mockSpecDocuments: SpecDocument[] = [
  { id: 'doc-1', name: 'Asktree PRD v9.0.pdf', uploadedAt: '2026-04-01', type: 'PRD' },
  { id: 'doc-2', name: '기능명세서 v9.0.pdf', uploadedAt: '2026-04-01', type: 'FRD' },
];

export const mockSpecFeatures: SpecFeature[] = [
  { id: 'sf-1', name: '자동 코드 파손 감지', source: 'PRD', status: 'implemented' },
  { id: 'sf-2', name: 'Fix 명령어 생성', source: 'PRD', status: 'implemented' },
  { id: 'sf-3', name: 'CLAUDE.md 보호 규칙 생성', source: 'PRD', status: 'partial' },
  { id: 'sf-4', name: 'PRD 대비 구현 현황', source: 'FRD', status: 'partial' },
  { id: 'sf-5', name: '세션 로그 수집/분석', source: 'FRD', status: 'implemented' },
  { id: 'sf-6', name: '결제 시스템', source: 'PRD', status: 'unimplemented' },
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
