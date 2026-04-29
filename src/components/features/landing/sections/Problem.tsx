import { FadeIn } from '@/src/components/features/landing/_components/FadeIn';

const pains = [
  '리팩토링했더니 결제 기능이 사라졌는데, 이틀 뒤에 발견',
  '빌드는 되는데, 뭐가 잘못된 건지 알 수가 없음',
  '컨텍스트가 길어지면서 코드가 슬금슬금 변형됨',
];

export function Problem() {
  return (
    <section className="bg-white">
      <div className="max-w-[1200px] mx-auto px-6 py-24 md:py-32">
        <FadeIn>
          <blockquote className="max-w-3xl mx-auto text-center">
            <p className="text-[28px] md:text-[36px] leading-[1.4] font-semibold text-foreground tracking-tight">
              &ldquo;AI한테 &lsquo;이거 만들어줘&rsquo; 하면 뚝딱 나오는데,
              <br className="hidden md:block" />
              왜 자꾸 어딘가가 망가져 있을까요?&rdquo;
            </p>
          </blockquote>
        </FadeIn>

        <div className="mt-16 md:mt-20 grid grid-cols-1 md:grid-cols-3 gap-5 max-w-5xl mx-auto">
          {pains.map((text, idx) => (
            <FadeIn key={idx} delay={idx * 100}>
              <div className="h-full rounded-2xl border border-border bg-white p-7">
                <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center mb-5">
                  <span className="text-[18px] font-bold text-primary">
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                </div>
                <p className="text-[15px] leading-relaxed text-foreground">
                  {text}
                </p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
