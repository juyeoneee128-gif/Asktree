import { Eye, BarChart3, Shield } from 'lucide-react';
import { Card } from '@/src/components/ui';

const values = [
  {
    icon: Eye,
    title: '보이지 않는 위험을 먼저 알려줍니다',
    description:
      'AI가 기존 기능을 삭제해도, 빌드는 통과합니다. 에러가 안 뜨니까 알 수도 없죠. CodeSasu는 매 세션마다 코드를 비교해서, 빌드는 되지만 기능이 망가진 문제를 자동으로 찾아냅니다.',
  },
  {
    icon: BarChart3,
    title: '기획서 대비 어디까지 왔는지 보여줍니다',
    description:
      "'기획서에 적은 7개 기능 중 3개가 아직 미완성입니다. 결제 연동부터 해결하세요.' — 코드를 몰라도 프로젝트의 현재 상태를 한눈에 파악할 수 있습니다.",
  },
  {
    icon: Shield,
    title: '한 번 당한 문제는 두 번 없게 지켜줍니다',
    description:
      '감지된 문제를 CLAUDE.md 보호 규칙으로 자동 생성합니다. 규칙이 쌓일수록 AI가 함부로 건드리지 못하는 선순환이 만들어집니다.',
  },
];

export function ValueProps() {
  return (
    <section id="value" className="bg-white">
      <div className="max-w-[1200px] mx-auto px-6 py-20 md:py-24">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="text-[28px] md:text-[36px] font-bold text-foreground tracking-tight">
            CodeSasu가 해주는 세 가지
          </h2>
          <p className="mt-4 text-[16px] text-muted-foreground leading-relaxed">
            감지하고, 보여주고, 지켜줍니다.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {values.map((item, idx) => {
            const Icon = item.icon;
            return (
              <Card key={idx} padding="28px">
                <div className="flex flex-col gap-4">
                  <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center">
                    <Icon size={22} className="text-primary" />
                  </div>
                  <h3 className="text-[17px] font-bold text-foreground leading-snug">
                    {item.title}
                  </h3>
                  <p className="text-[14px] text-muted-foreground leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
