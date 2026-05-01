import { Terminal, Code, LayoutDashboard } from 'lucide-react';
import { FadeIn } from '@/src/components/features/landing/_components/FadeIn';

const steps = [
  {
    number: '01',
    Icon: Terminal,
    title: '에이전트 설치',
    body: '터미널에 붙여넣어 간편하게 설치',
  },
  {
    number: '02',
    Icon: Code,
    title: '평소처럼 코딩',
    body: 'Claude Code로 작업하면, 백그라운드에서 자동 수집',
  },
  {
    number: '03',
    Icon: LayoutDashboard,
    title: '웹에서 확인',
    body: '코딩이 끝나면 CodeSasu에서 이슈, 현황, 세션 요약 확인',
  },
];

export function HowItWorks() {
  return (
    <section className="bg-[#FAFAF9] border-y border-border">
      <div className="max-w-[1200px] mx-auto px-6 py-16 md:py-24">
        <FadeIn>
          <div className="max-w-2xl mb-14 md:mb-16">
            <h2 className="text-[32px] md:text-[44px] leading-[1.15] font-bold text-foreground tracking-tight">
              사용법은 간단해요
            </h2>
          </div>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {steps.map(({ number, Icon, title, body }, idx) => (
            <FadeIn key={number} delay={idx * 100}>
              <div className="h-full rounded-2xl border border-border bg-white p-8">
                <div className="flex items-start justify-between">
                  <p className="text-[40px] md:text-[48px] font-bold text-[#7C2D12] leading-none tracking-tight">
                    {number}
                  </p>
                  <div className="w-12 h-12 rounded-xl bg-[#FFF7ED] flex items-center justify-center">
                    <Icon size={22} className="text-[#9A3412]" />
                  </div>
                </div>
                <h3 className="mt-6 text-[18px] md:text-[20px] font-semibold text-foreground tracking-tight">
                  {title}
                </h3>
                <p className="mt-3 text-[14px] md:text-[15px] font-medium text-muted-foreground leading-relaxed">
                  {body}
                </p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
