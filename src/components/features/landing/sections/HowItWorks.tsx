import { FadeIn } from '@/src/components/features/landing/_components/FadeIn';

const steps = [
  {
    number: '01',
    title: '에이전트 설치',
    body: '터미널에 한 줄 붙여넣기. 3분이면 끝.',
  },
  {
    number: '02',
    title: '평소처럼 코딩',
    body: 'Claude Code로 작업하세요. 백그라운드에서 자동 수집.',
  },
  {
    number: '03',
    title: '웹에서 확인',
    body: '코딩이 끝나면 CodeSasu를 열어보세요. 이슈, 현황, 세션 요약이 이미 준비되어 있습니다.',
  },
];

export function HowItWorks() {
  return (
    <section className="bg-gray-50 border-y border-border">
      <div className="max-w-[1200px] mx-auto px-6 py-24 md:py-32">
        <FadeIn>
          <div className="max-w-2xl mb-16 md:mb-20">
            <p className="text-[13px] font-semibold text-primary tracking-wide mb-3">
              How it works
            </p>
            <h2 className="text-[32px] md:text-[44px] leading-[1.15] font-bold text-foreground tracking-tight">
              사용법은 단순합니다.
            </h2>
          </div>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {steps.map((step, idx) => (
            <FadeIn key={step.number} delay={idx * 100}>
              <div className="h-full rounded-2xl border border-border bg-white p-8">
                <p className="text-[40px] md:text-[48px] font-bold text-primary leading-none tracking-tight">
                  {step.number}
                </p>
                <h3 className="mt-6 text-[18px] md:text-[20px] font-bold text-foreground tracking-tight">
                  {step.title}
                </h3>
                <p className="mt-3 text-[14px] md:text-[15px] text-muted-foreground leading-relaxed">
                  {step.body}
                </p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
