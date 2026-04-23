'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { createClient } from '@/src/lib/supabase/client';

function LoginContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  const handleGoogleLogin = async () => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  return (
    <div className="h-full flex flex-col items-center justify-center bg-muted">
      <div className="flex flex-col items-center gap-8 max-w-[360px] w-full">
        {/* Logo */}
        <div className="flex flex-col items-center gap-2">
          <h1 className="text-[28px] font-bold text-foreground">Asktree</h1>
          <p className="text-[14px] text-muted-foreground text-center leading-relaxed">
            AI가 망가뜨린 코드를 자동으로 감지하고,<br />
            고치는 법을 알려주고, 다시는 안 망가지게 지켜줍니다.
          </p>
        </div>

        {/* Login Card */}
        <div className="w-full bg-card rounded-2xl border border-border shadow-card p-8 flex flex-col gap-4">
          {error === 'auth_failed' && (
            <div className="bg-destructive/5 border border-destructive/20 text-destructive text-[13px] rounded-lg px-3 py-2.5 text-center">
              로그인에 실패했습니다. 다시 시도해주세요.
            </div>
          )}
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 h-12 px-6 bg-foreground text-background text-[14px] font-semibold rounded-lg hover:bg-gray-800 transition-colors cursor-pointer"
          >
            <GoogleIcon />
            Google로 시작하기
          </button>
        </div>

        {/* Footer */}
        <p className="text-[12px] text-gray-400 text-center">
          로그인 시 서비스 이용약관에 동의하게 됩니다.
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="h-full bg-muted" />}>
      <LoginContent />
    </Suspense>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.997 8.997 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
    </svg>
  );
}
