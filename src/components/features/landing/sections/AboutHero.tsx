export function AboutHero() {
  return (
    <section className="relative overflow-hidden">
      <div
        className="absolute inset-0 -z-10 bg-gradient-to-br from-orange-50 via-white to-gray-50"
        aria-hidden
      />
      <div className="max-w-[1200px] mx-auto px-6 pt-32 pb-24 md:pt-44 md:pb-32">
        <h1 className="max-w-4xl text-[36px] md:text-[56px] leading-[1.15] font-bold text-foreground tracking-tight">
          AI 시대의 코드 검증 체계를
          <br className="hidden md:block" />
          만들고 있습니다.
        </h1>
      </div>
    </section>
  );
}
