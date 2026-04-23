import { type NextRequest } from 'next/server';
import { updateSession } from '@/src/lib/supabase/proxy';

// Next.js 16: middleware → proxy 컨벤션
export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * 아래 경로는 proxy 제외 (정적 자산 + Next 내부 경로):
     * - _next/static (정적 번들)
     * - _next/image (이미지 최적화)
     * - _next/webpack-hmr (개발 HMR)
     * - favicon.ico
     * - 이미지/폰트 등 정적 파일 확장자
     * /auth/*, /api/* 등 공개 경로는 proxy 안에서 분기 처리.
     */
    '/((?!_next/static|_next/image|_next/webpack-hmr|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf)$).*)',
  ],
};
