import { Button } from '@/src/components/ui';

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="max-w-[1200px] mx-auto px-6 pt-20 pb-16 md:pt-32 md:pb-24">
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto">
          <span className="inline-block text-[13px] font-semibold text-primary bg-orange-50 px-3 py-1 rounded-pill mb-6">
            Beta
          </span>
          <h1 className="text-[40px] md:text-[56px] leading-[1.1] font-bold text-foreground tracking-tight">
            내 손안의 사수 개발자
          </h1>
          <p className="mt-7 text-[18px] md:text-[20px] text-muted-foreground leading-relaxed max-w-2xl">
            AI가 내 코딩 과정을 지켜보고,
            <br />
            문제가 생기면 먼저 알려줍니다
          </p>
          <div className="mt-10 flex justify-center">
            <a href="#register">
              <Button size="lg">사전 등록하기</Button>
            </a>
          </div>
        </div>

        <div className="mt-16 md:mt-24 max-w-5xl mx-auto">
          <div className="relative rounded-2xl border border-border bg-white shadow-xl overflow-hidden">
            <div className="h-9 border-b border-border bg-gray-100 flex items-center gap-1.5 px-4">
              <span className="w-3 h-3 rounded-full bg-gray-300" />
              <span className="w-3 h-3 rounded-full bg-gray-300" />
              <span className="w-3 h-3 rounded-full bg-gray-300" />
            </div>
            <div className="aspect-[16/9] bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
              <div className="text-center">
                <p className="text-[14px] font-semibold text-muted-foreground">
                  제품 미리보기
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
