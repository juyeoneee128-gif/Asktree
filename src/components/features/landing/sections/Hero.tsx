import Image from 'next/image';
import { Button } from '@/src/components/ui';

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="max-w-[1200px] mx-auto px-6 pt-20 pb-16 md:pt-32 md:pb-24">
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto">
          <span className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-primary bg-orange-50 px-4 py-1.5 rounded-pill mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            Beta · 사전 등록 중
          </span>
          <h1 className="text-[40px] md:text-[56px] leading-[1.1] font-bold text-foreground tracking-tight">
            내 손안의 사수 개발자
          </h1>
          <p className="mt-7 text-[18px] md:text-[20px] font-medium text-muted-foreground leading-relaxed max-w-2xl">
            AI가 내 코딩 과정을 지켜보고,
            <br />
            문제가 생기면 먼저 알려줍니다
          </p>
          <div className="mt-10 flex flex-col items-center gap-3">
            <a href="#register">
              <Button size="lg">사전 등록하기</Button>
            </a>
            <p className="text-sm text-muted-foreground">
              사전 등록 시 무료 500 크레딧
            </p>
          </div>
        </div>

        <div className="mt-16 md:mt-24 max-w-5xl mx-auto">
          <div className="relative rounded-xl border border-border bg-white shadow-lg overflow-hidden">
            <div className="h-9 border-b border-border bg-gray-100 flex items-center gap-1.5 px-4">
              <span className="w-3 h-3 rounded-full bg-gray-300" />
              <span className="w-3 h-3 rounded-full bg-gray-300" />
              <span className="w-3 h-3 rounded-full bg-gray-300" />
            </div>
            <div className="relative aspect-[16/10] bg-gray-50">
              <Image
                src="/landing/screen-issues.png"
                alt="이슈 탭 미리보기"
                fill
                priority
                sizes="(min-width: 1024px) 1024px, 100vw"
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
