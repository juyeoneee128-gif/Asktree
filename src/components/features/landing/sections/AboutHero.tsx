import Image from 'next/image';

export function AboutHero() {
  return (
    <section className="relative overflow-hidden">
      <div
        className="absolute inset-0 -z-10 bg-gradient-to-br from-orange-50 via-white to-gray-50"
        aria-hidden
      />
      <div className="max-w-[1200px] mx-auto px-6 pt-32 pb-24 md:pt-44 md:pb-32">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight leading-[1.25]">
              AI의 모든 행동을 추적하는
              <br />
              코드 리뷰 에이전트
            </h1>
            <p className="text-lg md:text-xl font-normal text-muted-foreground mt-4 leading-[1.55]">
              코드를 모르는 빌더를 위한
              <br />
              사수 개발자를 만들고 있습니다
            </p>
          </div>

          <div className="relative aspect-[5/4] rounded-2xl overflow-hidden">
            <Image
              src="/landing/codesasu_about_hero.png"
              alt="CodeSasu 로고와 코드 리뷰 아이콘들"
              fill
              priority
              sizes="(min-width: 768px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
