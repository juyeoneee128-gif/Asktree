import { NextResponse } from 'next/server';
import { createClient } from '@/src/lib/supabase/server';
import { ensureUser } from '@/src/lib/supabase/ensure-user';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/projects';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // public.users 테이블에 유저 레코드 보장
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await ensureUser({
          id: user.id,
          email: user.email,
          user_metadata: user.user_metadata as Record<string, string>,
        });
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/auth/login?error=auth_failed`);
}
