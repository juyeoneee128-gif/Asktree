import { createClient } from '@supabase/supabase-js';
import type { Database } from '../supabase/types';

/**
 * 에이전트 토큰을 검증하고 해당 project_id를 반환합니다.
 * service_role 키로 RLS를 우회합니다.
 */
export async function verifyAgentToken(
  token: string
): Promise<{ project_id: string } | null> {
  const supabaseAdmin = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await supabaseAdmin
    .from('projects')
    .select('id')
    .eq('agent_token', token)
    .single();

  if (error || !data) return null;

  return { project_id: data.id };
}

/**
 * Authorization 헤더에서 Bearer 토큰을 추출합니다.
 */
export function extractBearerToken(
  authHeader: string | null
): string | null {
  if (!authHeader) return null;
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  return match ? match[1] : null;
}
