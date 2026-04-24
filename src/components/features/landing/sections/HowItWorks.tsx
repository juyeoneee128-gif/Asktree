import { Download, Code2, Sparkles, CheckCircle2 } from 'lucide-react';

const steps = [
  {
    icon: Download,
    title: '에이전트 설치',
    description: '터미널에 한 줄 붙여넣기. 원클릭 설치.',
  },
  {
    icon: Code2,
    title: '평소처럼 코딩',
    description: 'Claude Code로 작업하세요. 백그라운드에서 자동 수집.',
  },
  {
    icon: Sparkles,
    title: '자동 분석',
    description: '세션이 끝나면 Asktree가 코드를 분석합니다.',
  },
  {
    icon: CheckCircle2,
    title: '이슈 확인 + Fix',
    description: '문제를 확인하고, Fix를 복사해서 붙여넣기. 보호 규칙 추가.',
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-white">
      <div className="max-w-[1200px] mx-auto px-6 py-20 md:py-24">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="text-[28px] md:text-[36px] font-bold text-foreground tracking-tight">
            이렇게 동작합니다
          </h2>
          <p className="mt-4 text-[16px] text-muted-foreground leading-relaxed">
            설치 3분, 첫 분석까지 5분.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 md:gap-4">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div key={idx} className="relative flex flex-col items-center text-center px-2">
                <div className="relative mb-5">
                  <div className="w-14 h-14 rounded-2xl bg-white border border-border shadow-card flex items-center justify-center">
                    <Icon size={22} className="text-primary" />
                  </div>
                  <span className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-primary text-white text-[12px] font-bold flex items-center justify-center">
                    {idx + 1}
                  </span>
                </div>
                <h3 className="text-[16px] font-bold text-foreground mb-2">
                  {step.title}
                </h3>
                <p className="text-[13px] text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
