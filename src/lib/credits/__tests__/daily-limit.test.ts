import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Supabase mock ───
const state = {
  rows: new Map<string, { count: number }>(),
  insertError: null as { code?: string; message: string } | null,
};

function key(projectId: string, date: string) {
  return `${projectId}::${date}`;
}

const supabaseMock = {
  from: (table: string) => {
    if (table !== 'daily_analysis_count') {
      throw new Error(`unexpected table: ${table}`);
    }
    return {
      select: () => ({
        eq: (_col1: string, _val1: string) => ({
          eq: (_col2: string, _val2: string) => ({
            maybeSingle: () => {
              const row = state.rows.get(key(_val1, _val2));
              return Promise.resolve({ data: row ?? null, error: null });
            },
            single: () => {
              const row = state.rows.get(key(_val1, _val2));
              return Promise.resolve({
                data: row ?? null,
                error: row ? null : { message: 'not found' },
              });
            },
          }),
        }),
      }),
      insert: (data: { project_id: string; date: string; count: number }) => {
        if (state.insertError) {
          return Promise.resolve({ error: state.insertError });
        }
        const k = key(data.project_id, data.date);
        if (state.rows.has(k)) {
          return Promise.resolve({
            error: { code: '23505', message: 'duplicate key' },
          });
        }
        state.rows.set(k, { count: data.count });
        return Promise.resolve({ error: null });
      },
      update: (data: { count: number }) => ({
        eq: (_c1: string, projectId: string) => ({
          eq: (_c2: string, date: string) => {
            const k = key(projectId, date);
            const existing = state.rows.get(k);
            if (existing) state.rows.set(k, { count: data.count });
            return Promise.resolve({ error: null });
          },
        }),
      }),
    };
  },
};

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => supabaseMock,
}));

beforeEach(() => {
  state.rows.clear();
  state.insertError = null;
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://test';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test';
});

describe('incrementDailyCount', () => {
  it('첫 호출 시 INSERT → count 1', async () => {
    const { incrementDailyCount } = await import('../daily-limit');
    const c = await incrementDailyCount('p-1');
    expect(c).toBe(1);
  });

  it('두 번째 호출 시 UPDATE로 증가', async () => {
    const { incrementDailyCount } = await import('../daily-limit');
    await incrementDailyCount('p-1');
    const c = await incrementDailyCount('p-1');
    expect(c).toBe(2);
  });

  it('서로 다른 프로젝트는 독립 카운트', async () => {
    const { incrementDailyCount } = await import('../daily-limit');
    await incrementDailyCount('p-1');
    await incrementDailyCount('p-1');
    const cA = await incrementDailyCount('p-2');
    expect(cA).toBe(1);
  });
});

describe('getDailyCount / checkDailyLimit', () => {
  it('row 없으면 0', async () => {
    const { getDailyCount } = await import('../daily-limit');
    expect(await getDailyCount('p-1')).toBe(0);
  });

  it('상한 초과 검사 (>= limit)', async () => {
    const { incrementDailyCount, checkDailyLimit } = await import('../daily-limit');
    for (let i = 0; i < 3; i++) await incrementDailyCount('p-1');

    expect(await checkDailyLimit('p-1', 5)).toBe(false);
    expect(await checkDailyLimit('p-1', 3)).toBe(true);
    expect(await checkDailyLimit('p-1', 2)).toBe(true);
  });
});
