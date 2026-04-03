import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

/**
 * public.users 테이블에 유저 레코드가 존재하는지 확인하고,
 * 없으면 생성합니다. (트리거 미작동 대비 안전장치)
 *
 * service_role 키를 사용하여 RLS를 우회합니다.
 */
export async function ensureUser(authUser: {
  id: string;
  email?: string;
  user_metadata?: Record<string, string>;
}) {
  const supabaseAdmin = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // 이미 존재하는지 확인
  const { data: existing } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('id', authUser.id)
    .single();

  if (existing) return;

  // 없으면 생성
  const metadata = authUser.user_metadata ?? {};
  await supabaseAdmin.from('users').insert({
    id: authUser.id,
    name: metadata.full_name ?? metadata.name ?? '',
    email: authUser.email ?? metadata.email ?? '',
    avatar_url: metadata.avatar_url ?? metadata.picture ?? null,
  });
}
