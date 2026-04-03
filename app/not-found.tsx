import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="h-full flex flex-col items-center justify-center gap-4">
      <h1 className="text-[48px] font-bold text-foreground">404</h1>
      <p className="text-[16px] text-muted-foreground">페이지를 찾을 수 없습니다</p>
      <div className="flex gap-3 mt-4">
        <Link
          href="/projects"
          className="px-4 py-2.5 bg-primary text-white text-[14px] font-semibold rounded-lg hover:bg-primary-hover transition-colors"
        >
          홈으로 돌아가기
        </Link>
      </div>
    </div>
  );
}
