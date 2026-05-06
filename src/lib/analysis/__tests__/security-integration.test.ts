import { describe, it, expect, vi, beforeEach } from 'vitest';

// callClaude를 mock하여 analyzeStatic이 LLM에 보낸 user message를 캡처
const callClaudeMock = vi.fn();

vi.mock('../claude-client', async () => {
  const actual = await vi.importActual<typeof import('../claude-client')>('../claude-client');
  return {
    ...actual,
    callClaude: (...args: Parameters<typeof actual.callClaude>) => callClaudeMock(...args),
  };
});

// Supabase admin client는 session-comparator에서만 사용 — 정적 분석 단독 테스트는 무관
vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from: () => ({
      select: () => ({ eq: () => ({ single: () => ({ data: null, error: null }) }) }),
    }),
  }),
}));

beforeEach(() => {
  callClaudeMock.mockReset();
  callClaudeMock.mockResolvedValue({
    toolInputs: [
      {
        issues: [],
        analysis_summary: 'no issues',
      },
    ],
    tokenUsage: { input: 100, output: 50 },
    rawResponse: {},
  });
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://test';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test';
});

describe('analyzeStatic — 보안 계약', () => {
  it('LLM에 전달되는 user message는 민감 데이터가 마스킹된 상태여야 한다', async () => {
    const { analyzeStatic } = await import('../static-analyzer');

    const sensitiveDiff = [
      '--- a/.env',
      '+++ b/.env',
      '@@ -1,2 +1,3 @@',
      '+DATABASE_URL=postgres://admin:supersecret@db.prod/main',
      '+API_KEY=sk-abc123def456ghi789jklmnop',
      '+contact_email=admin@company.com',
    ].join('\n');

    await analyzeStatic({
      projectName: 'test',
      sessionTitle: 's1',
      filesChanged: ['.env'],
      diffs: [
        {
          file_path: '.env',
          diff_content: sensitiveDiff,
        },
      ],
    });

    expect(callClaudeMock).toHaveBeenCalled();
    const callArgs = callClaudeMock.mock.calls[0][0];
    const userMessage: string = callArgs.userMessage;

    // 원본 민감 데이터가 LLM에 노출되지 않아야 함
    expect(userMessage).not.toContain('postgres://admin:supersecret');
    expect(userMessage).not.toContain('sk-abc123def456ghi789jklmnop');
    expect(userMessage).not.toContain('admin@company.com');

    // 마스킹 placeholder가 들어있어야 함
    expect(userMessage).toContain('[ENV_MASKED]');
    expect(userMessage).toContain('[EMAIL_MASKED]');
  });

  it('마스킹 적용 시 결과 warnings에 mask count 포함', async () => {
    const { analyzeStatic } = await import('../static-analyzer');

    const result = await analyzeStatic({
      projectName: 'test',
      sessionTitle: 's1',
      filesChanged: ['.env'],
      diffs: [
        {
          file_path: '.env',
          diff_content: '+DATABASE_URL=postgres://x:y@h/d',
        },
      ],
    });

    const hasSecurityWarning = result.warnings.some((w) =>
      w.startsWith('Security: masked')
    );
    expect(hasSecurityWarning).toBe(true);
  });

  it('민감 데이터 없는 diff는 mask warning 미포함', async () => {
    const { analyzeStatic } = await import('../static-analyzer');

    const result = await analyzeStatic({
      projectName: 'test',
      sessionTitle: 's1',
      filesChanged: ['app.ts'],
      diffs: [
        {
          file_path: 'app.ts',
          diff_content: '+const x = add(a, b);',
        },
      ],
    });

    const hasSecurityWarning = result.warnings.some((w) =>
      w.startsWith('Security: masked')
    );
    expect(hasSecurityWarning).toBe(false);
  });
});
