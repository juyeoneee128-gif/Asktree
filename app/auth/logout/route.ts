import { NextResponse } from 'next/server';
import { createClient } from '@/src/lib/supabase/server';

// POST /auth/logout — 로그아웃
export async function POST(request: Request) {
  const supabase = await createClient();
  await supabase.auth.signOut();

  const { origin } = new URL(request.url);
  return NextResponse.redirect(`${origin}/auth/login`, { status: 302 });
}
