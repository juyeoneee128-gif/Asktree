import Link from 'next/link';
import { FileQuestion } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-full flex items-center justify-center bg-muted px-6">
      <div className="w-full max-w-[420px] bg-card rounded-2xl border border-border shadow-card p-10 flex flex-col items-center text-center gap-5">
        <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
          <FileQuestion size={28} className="text-muted-foreground" />
        </div>
        <div className="flex flex-col gap-1.5">
          <h1 className="text-[22px] font-bold text-foreground">페이지를 찾을 수 없습니다</h1>
          <p className="text-[13px] text-muted-foreground leading-relaxed">
            요청하신 페이지가 존재하지 않거나 이동되었습니다.
          </p>
        </div>
        <Link
          href="/projects"
          className="mt-2 px-5 py-2.5 bg-primary text-white text-[14px] font-semibold rounded-lg hover:bg-primary-hover transition-colors"
        >
          홈으로 돌아가기
        </Link>
      </div>
    </div>
  );
}
