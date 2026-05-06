import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import { encryptApiKey } from '../../crypto/api-key';

const userRow: { encrypted_api_key: string | null } = { encrypted_api_key: null };

const supabaseMock = {
  from: (_table: string) => ({
    select: () => ({
      eq: () => ({
        single: () => Promise.resolve({ data: userRow, error: null }),
      }),
    }),
  }),
};

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => supabaseMock,
}));

beforeAll(() => {
  process.env.API_KEY_ENCRYPTION_SECRET = 'test-encryption-secret-32-chars!';
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://test';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test';
});

beforeEach(() => {
  userRow.encrypted_api_key = null;
});

describe('hasUserApiKey', () => {
  it('null이면 false', async () => {
    const { hasUserApiKey } = await import('../byok');
    expect(await hasUserApiKey('user-1')).toBe(false);
  });

  it('암호화된 키 있으면 true', async () => {
    userRow.encrypted_api_key = encryptApiKey('sk-ant-test');
    const { hasUserApiKey } = await import('../byok');
    expect(await hasUserApiKey('user-1')).toBe(true);
  });
});

describe('getUserApiKey', () => {
  it('null이면 null 반환', async () => {
    const { getUserApiKey } = await import('../byok');
    expect(await getUserApiKey('user-1')).toBeNull();
  });

  it('암호화된 키를 복호화해서 반환', async () => {
    userRow.encrypted_api_key = encryptApiKey('sk-ant-real-key');
    const { getUserApiKey } = await import('../byok');
    expect(await getUserApiKey('user-1')).toBe('sk-ant-real-key');
  });

  it('복호화 실패 시 null 반환', async () => {
    userRow.encrypted_api_key = 'malformed-base64-data';
    const { getUserApiKey } = await import('../byok');
    expect(await getUserApiKey('user-1')).toBeNull();
  });
});
