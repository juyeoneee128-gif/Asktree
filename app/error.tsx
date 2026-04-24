'use client';

import { TriangleAlert } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-full flex items-center justify-center bg-muted px-6">
      <div className="w-full max-w-[460px] bg-card rounded-2xl border border-border shadow-card p-10 flex flex-col items-center text-center gap-5">
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center"
          style={{ backgroundColor: '#FEE2E2' }}
        >
          <TriangleAlert size={28} className="text-destructive" />
        </div>
        <div className="flex flex-col gap-1.5">
          <h1 className="text-[22px] font-bold text-foreground">문제가 발생했습니다</h1>
          <p className="text-[13px] text-muted-foreground leading-relaxed">
            일시적인 오류일 수 있습니다. 새로고침하거나 잠시 후 다시 시도해주세요.
          </p>
        </div>

        {process.env.NODE_ENV !== 'production' && error?.message && (
          <pre
            className="w-full text-[11px] text-destructive bg-red-50 rounded-md px-3 py-2 text-left overflow-x-auto"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            {error.message}
          </pre>
        )}

        <div className="flex gap-2 mt-2">
          <button
            type="button"
            onClick={reset}
            className="px-5 py-2.5 bg-primary text-white text-[14px] font-semibold rounded-lg hover:bg-primary-hover transition-colors cursor-pointer"
          >
            새로고침
          </button>
          <a
            href="/projects"
            className="px-5 py-2.5 border border-border text-foreground text-[14px] font-semibold rounded-lg hover:bg-muted transition-colors"
          >
            홈으로 돌아가기
          </a>
        </div>
      </div>
    </div>
  );
}
