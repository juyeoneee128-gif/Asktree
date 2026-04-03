'use client';

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="h-full flex flex-col items-center justify-center gap-4">
      <h1 className="text-[48px] font-bold text-foreground">500</h1>
      <p className="text-[16px] text-muted-foreground">서버 오류가 발생했습니다</p>
      <div className="flex gap-3 mt-4">
        <button
          type="button"
          onClick={reset}
          className="px-4 py-2.5 bg-primary text-white text-[14px] font-semibold rounded-lg hover:bg-primary-hover transition-colors cursor-pointer"
        >
          다시 시도
        </button>
        <a
          href="/projects"
          className="px-4 py-2.5 border border-border text-foreground text-[14px] font-semibold rounded-lg hover:bg-muted transition-colors"
        >
          홈으로 돌아가기
        </a>
      </div>
    </div>
  );
}
