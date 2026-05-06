import { createClient } from '@supabase/supabase-js';
import type { Database } from '../supabase/types';
import { decryptApiKey } from '../crypto/api-key';

function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * 사용자가 BYOK API 키를 등록했는지 여부.
 */
export async function hasUserApiKey(userId: string): Promise<boolean> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from('users')
    .select('encrypted_api_key')
    .eq('id', userId)
    .single();

  return !!data?.encrypted_api_key;
}

/**
 * 복호화된 사용자 API 키를 반환합니다. 없거나 복호화 실패 시 null.
 *
 * 분석 직전에 호출 — 메모리 보관 시간을 최소화.
 */
export async function getUserApiKey(userId: string): Promise<string | null> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from('users')
    .select('encrypted_api_key')
    .eq('id', userId)
    .single();

  if (!data?.encrypted_api_key) return null;

  try {
    return decryptApiKey(data.encrypted_api_key);
  } catch (err) {
    console.error('[getUserApiKey] decrypt failed:', (err as Error).message);
    return null;
  }
}

/**
 * BYOK 키 유효성 검증 — Haiku로 max_tokens=10 테스트 호출.
 * 401/403이면 false, 그 외 성공이면 true.
 *
 * 키 등록 시점에 호출. 분석 도중 실패는 별도 처리 (호출 측에서 catch).
 */
export async function validateApiKey(apiKey: string): Promise<{
  valid: boolean;
  reason?: 'unauthorized' | 'forbidden' | 'unknown';
  message?: string;
}> {
  try {
    const Anthropic = (await import('@anthropic-ai/sdk')).default;
    const client = new Anthropic({ apiKey });

    await client.messages.create({
      model: process.env.MODEL_BYOK_VALIDATE || 'claude-haiku-4-5-20251001',
      max_tokens: 10,
      messages: [{ role: 'user', content: 'ping' }],
    });

    return { valid: true };
  } catch (err) {
    const e = err as { status?: number; message?: string };
    if (e.status === 401) {
      return { valid: false, reason: 'unauthorized', message: e.message };
    }
    if (e.status === 403) {
      return { valid: false, reason: 'forbidden', message: e.message };
    }
    return { valid: false, reason: 'unknown', message: e.message };
  }
}
