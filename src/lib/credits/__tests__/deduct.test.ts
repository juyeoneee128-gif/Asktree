import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Mock Supabase admin client ───
const userRow = { credits: 10, used_this_month: 5 };
const updateMock = vi.fn().mockResolvedValue({ error: null });
const insertMock = vi.fn().mockResolvedValue({ error: null });

const supabaseMock = {
  from: vi.fn((table: string) => {
    if (table === 'users') {
      return {
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({ data: userRow, error: null }),
          }),
        }),
        update: (data: { credits: number; used_this_month: number }) => {
          updateMock(data);
          return {
            eq: () => Promise.resolve({ error: null }),
          };
        },
      };
    }
    if (table === 'credit_usage') {
      return { insert: insertMock };
    }
    throw new Error(`unexpected table: ${table}`);
  }),
};

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => supabaseMock,
}));

beforeEach(() => {
  userRow.credits = 10;
  userRow.used_this_month = 5;
  updateMock.mockClear();
  insertMock.mockClear();
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://test';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test';
});

describe('deductCredit', () => {
  it('차감 후 잔여를 반환하고 credit_usage에 음수 amount 기록', async () => {
    const { deductCredit } = await import('../deduct');

    const result = await deductCredit('user-1', 1, {
      reason: 'push_analysis',
      projectId: 'p-1',
      sessionId: 's-1',
    });

    expect(result.remaining).toBe(9);
    expect(updateMock).toHaveBeenCalledWith({ credits: 9, used_this_month: 6 });
    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'user-1',
        project_id: 'p-1',
        session_id: 's-1',
        amount: -1,
        balance_after: 9,
        reason: 'push_analysis',
      })
    );
  });

  it('수동 분석 2 차감', async () => {
    const { deductCredit } = await import('../deduct');

    const result = await deductCredit('user-1', 2, { reason: 'manual_analysis' });

    expect(result.remaining).toBe(8);
    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({ amount: -2, reason: 'manual_analysis' })
    );
  });

  it('잔여 부족 시 InsufficientCreditsError throw + 차감 안 함', async () => {
    userRow.credits = 1;
    const { deductCredit, InsufficientCreditsError } = await import('../deduct');

    await expect(
      deductCredit('user-1', 2, { reason: 'manual_analysis' })
    ).rejects.toBeInstanceOf(InsufficientCreditsError);

    expect(updateMock).not.toHaveBeenCalled();
    expect(insertMock).not.toHaveBeenCalled();
  });
});

describe('checkCredits', () => {
  it('충분하면 잔여 반환', async () => {
    const { checkCredits } = await import('../deduct');
    expect(await checkCredits('u', 5)).toBe(10);
  });

  it('부족하면 InsufficientCreditsError', async () => {
    userRow.credits = 0;
    const { checkCredits, InsufficientCreditsError } = await import('../deduct');
    await expect(checkCredits('u', 1)).rejects.toBeInstanceOf(InsufficientCreditsError);
  });
});
