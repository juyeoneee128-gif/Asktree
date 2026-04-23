import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * 공개 경로 판정:
 * - /auth/* (로그인/콜백/로그아웃)
 * - /api/agent/* (로컬 에이전트 데이터 수신 — 별도 토큰 검증)
 * 나머지는 인증 필요.
 */
function isPublicPath(pathname: string): boolean {
  return pathname.startsWith('/auth') || pathname.startsWith('/api/agent');
}

export async function updateSession(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // 환경변수 누락 시: 무한 대기/크래시 방지. 로그만 찍고 요청 통과.
  if (!supabaseUrl || !supabaseKey) {
    console.error(
      '[proxy] Supabase 환경변수(NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY)가 설정되지 않았습니다. .env.local을 확인하세요.'
    );
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // 미인증 + 비공개 경로 → /auth/login
  if (!user && !isPublicPath(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = '/auth/login';
    url.search = '';
    return NextResponse.redirect(url);
  }

  // 인증됨 + 로그인 페이지 → /projects (정확히 /auth/login만 매치하여 루프 방지)
  if (user && pathname === '/auth/login') {
    const url = request.nextUrl.clone();
    url.pathname = '/projects';
    url.search = '';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
