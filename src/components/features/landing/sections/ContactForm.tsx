'use client';

import { useState, type FormEvent } from 'react';
import { Button, InputField, Textarea } from '@/src/components/ui';
import { FadeIn } from '@/src/components/features/landing/_components/FadeIn';

type Status = 'idle' | 'submitting' | 'success' | 'error';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ContactForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [organization, setOrganization] = useState('');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    email?: string;
    content?: string;
  }>({});

  function clearError() {
    if (status === 'error') {
      setStatus('idle');
      setErrorMessage(null);
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === 'submitting') return;

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedOrg = organization.trim();
    const trimmedContent = content.trim();

    const nextErrors: typeof fieldErrors = {};
    if (!trimmedName) nextErrors.name = '성함을 입력해주세요';
    if (!trimmedEmail) nextErrors.email = '이메일을 입력해주세요';
    else if (!EMAIL_REGEX.test(trimmedEmail))
      nextErrors.email = '올바른 이메일 형식이 아닙니다';
    if (!trimmedContent) nextErrors.content = '문의 내용을 입력해주세요';

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      return;
    }
    setFieldErrors({});

    setStatus('submitting');
    setErrorMessage(null);

    try {
      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: trimmedName,
          email: trimmedEmail,
          organization: trimmedOrg || undefined,
          content: trimmedContent,
        }),
      });

      if (res.ok) {
        setStatus('success');
        return;
      }

      const body = await res.json().catch(() => ({}));
      setStatus('error');
      setErrorMessage(
        body.error ?? '전송에 실패했습니다 잠시 후 다시 시도해주세요'
      );
    } catch {
      setStatus('error');
      setErrorMessage(
        '네트워크 오류가 발생했습니다 잠시 후 다시 시도해주세요'
      );
    }
  }

  if (status === 'success') {
    return (
      <section className="bg-white">
        <div className="max-w-[560px] mx-auto px-6 pb-24 md:pb-32">
          <FadeIn>
            <div className="rounded-2xl border border-border bg-[#FAFAF9] px-8 py-10 text-center">
              <p className="text-[18px] font-bold text-foreground tracking-tight">
                문의가 접수되었습니다
              </p>
              <p className="mt-3 text-[14px] text-muted-foreground leading-relaxed">
                빠른 시일 내에 답변드리겠습니다
                <br />
                또는 hello@codesasu.app으로 직접 문의하실 수 있습니다
              </p>
            </div>
          </FadeIn>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-white">
      <div className="max-w-[560px] mx-auto px-6 pb-24 md:pb-32">
        <FadeIn>
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <InputField
              label="성함 *"
              placeholder="홍길동"
              autoComplete="name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (fieldErrors.name) {
                  setFieldErrors((prev) => ({ ...prev, name: undefined }));
                }
                clearError();
              }}
              error={fieldErrors.name}
            />
            <InputField
              label="이메일 *"
              type="text"
              inputMode="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (fieldErrors.email) {
                  setFieldErrors((prev) => ({ ...prev, email: undefined }));
                }
                clearError();
              }}
              error={fieldErrors.email}
            />
            <InputField
              label="소속"
              placeholder="회사 또는 팀 (선택)"
              autoComplete="organization"
              value={organization}
              onChange={(e) => {
                setOrganization(e.target.value);
                clearError();
              }}
            />
            <Textarea
              label="내용 *"
              placeholder="문의 내용을 자유롭게 작성해주세요"
              rows={7}
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                if (fieldErrors.content) {
                  setFieldErrors((prev) => ({ ...prev, content: undefined }));
                }
                clearError();
              }}
              error={fieldErrors.content}
            />

            <div className="mt-2">
              <Button
                type="submit"
                size="lg"
                disabled={status === 'submitting'}
                className="w-full"
              >
                {status === 'submitting' ? '전송 중…' : '문의 보내기'}
              </Button>
              {status === 'error' && errorMessage && (
                <p className="mt-3 text-[13px] text-destructive">
                  {errorMessage}
                </p>
              )}
            </div>
          </form>

          <p className="mt-8 text-center text-[13px] text-muted-foreground leading-relaxed">
            또는{' '}
            <a
              href="mailto:hello@codesasu.app"
              className="text-primary hover:underline"
            >
              hello@codesasu.app
            </a>
            으로 직접 문의하실 수 있습니다
          </p>
        </FadeIn>
      </div>
    </section>
  );
}
