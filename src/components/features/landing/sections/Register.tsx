'use client';

import { useState, type FormEvent } from 'react';
import { Button, InputField } from '@/src/components/ui';
import { FadeIn } from '@/src/components/features/landing/_components/FadeIn';

const DETAIL_FORM_URL = 'https://forms.gle/placeholder';

type Status = 'idle' | 'submitting' | 'success' | 'error';

export function Register() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === 'submitting') return;

    const trimmed = email.trim();
    if (!trimmed) {
      setStatus('error');
      setMessage('이메일을 입력해주세요.');
      return;
    }

    setStatus('submitting');
    setMessage(null);

    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmed }),
      });

      if (res.ok) {
        setStatus('success');
        setMessage('등록 완료! Beta 출시 시 이메일로 알려드리겠습니다.');
        return;
      }

      const body = await res.json().catch(() => ({}));
      if (res.status === 409) {
        setStatus('success');
        setMessage('이미 등록된 이메일입니다. Beta 출시 시 알려드릴게요.');
        return;
      }

      setStatus('error');
      setMessage(body.error ?? '등록에 실패했습니다. 잠시 후 다시 시도해주세요.');
    } catch {
      setStatus('error');
      setMessage('네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    }
  }

  const isSuccess = status === 'success';
  const isError = status === 'error';

  return (
    <section id="register" className="bg-white">
      <div className="max-w-3xl mx-auto px-6 py-24 md:py-32 text-center">
        <FadeIn>
          <h2 className="text-[32px] md:text-[44px] leading-[1.15] font-bold text-foreground tracking-tight">
            사수가 준비되고 있습니다.
          </h2>
          <p className="mt-5 text-[16px] md:text-[17px] text-muted-foreground leading-relaxed">
            Beta 출시 시 가장 먼저 알려드립니다.
            <br />
            사전 등록하시면 무료 500 크레딧을 드립니다.
          </p>
        </FadeIn>

        <FadeIn delay={150}>
          <div className="mt-10 max-w-md mx-auto">
            {isSuccess ? (
              <div className="rounded-xl border border-border bg-gray-50 px-6 py-5">
                <p className="text-[15px] font-semibold text-foreground">
                  {message}
                </p>
                <a
                  href={DETAIL_FORM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-block text-[13px] text-primary hover:underline"
                >
                  더 자세한 정보를 알려주시면 맞춤 안내를 드려요 →
                </a>
              </div>
            ) : (
              <>
                <form
                  onSubmit={handleSubmit}
                  className="flex flex-col sm:flex-row gap-3"
                >
                  <InputField
                    type="text"
                    inputMode="email"
                    autoComplete="email"
                    placeholder="이메일 주소"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (status === 'error') {
                        setStatus('idle');
                        setMessage(null);
                      }
                    }}
                    className="flex-1"
                    aria-label="이메일"
                  />
                  <Button
                    type="submit"
                    size="lg"
                    disabled={status === 'submitting'}
                  >
                    {status === 'submitting' ? '등록 중…' : '사전 등록하기'}
                  </Button>
                </form>
                {isError && message && (
                  <p className="mt-3 text-[13px] text-destructive text-left">
                    {message}
                  </p>
                )}
              </>
            )}
            <p className="mt-5 text-[13px] text-muted-foreground">
              곧 출시 — 사전 등록하고 가장 먼저 만나보세요.
            </p>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
