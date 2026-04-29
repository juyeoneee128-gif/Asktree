import Link from 'next/link';
import { Button } from '@/src/components/ui';

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="max-w-[1200px] mx-auto px-6 pt-20 pb-16 md:pt-28 md:pb-24">
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto">
          <span className="inline-block text-[13px] font-semibold text-primary bg-orange-50 px-3 py-1 rounded-pill mb-5">
            Beta 출시
          </span>
          <h1 className="text-[36px] md:text-[52px] leading-[1.15] font-bold text-foreground tracking-tight">
            코딩하는 동안,
            <br />
            CodeSasu가 계속 지켜봅니다
          </h1>
          <p className="mt-6 text-[16px] md:text-[18px] text-muted-foreground leading-relaxed max-w-2xl">
            내 코딩 과정을 기억하는 사수: 코드를 몰라도 괜찮아요. 사수가
            지켜보고 있으니까.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center gap-3">
            <Link href="/auth/login">
              <Button size="lg">무료로 시작하기</Button>
            </Link>
            <span className="text-[13px] text-muted-foreground">
              10크레딧 무료 · 카드 등록 없이
            </span>
          </div>
        </div>

        {/* 히어로 이미지 placeholder */}
        <div className="mt-14 md:mt-20 max-w-5xl mx-auto">
          <div className="relative rounded-2xl border border-border bg-white shadow-xl overflow-hidden">
            <div className="h-9 border-b border-border bg-gray-100 flex items-center gap-1.5 px-4">
              <span className="w-3 h-3 rounded-full bg-gray-300" />
              <span className="w-3 h-3 rounded-full bg-gray-300" />
              <span className="w-3 h-3 rounded-full bg-gray-300" />
            </div>
            <div className="aspect-[16/9] bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
              <div className="text-center">
                <p className="text-[14px] font-semibold text-muted-foreground">
                  이슈 탭 미리보기
                </p>
                <p className="text-[12px] text-gray-400 mt-1">
                  실제 스크린샷으로 교체 예정
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
