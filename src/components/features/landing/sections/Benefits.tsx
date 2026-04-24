import { Zap, MessageCircleHeart, Lock } from 'lucide-react';
import { Card } from '@/src/components/ui';

const benefits = [
  {
    icon: Zap,
    title: '코딩하면 자동으로 분석',
    description:
      '따로 뭔가를 실행하거나 설정할 필요 없습니다. 에이전트가 백그라운드에서 알아서 합니다.',
  },
  {
    icon: MessageCircleHeart,
    title: '코드를 몰라도 괜찮습니다',
    description:
      "모든 안내는 비개발자 언어로 제공됩니다. '이 함수를 복원하세요'가 아니라 '결제 기능이 삭제되었습니다. 이 명령어를 붙여넣으세요'라고 알려줍니다.",
  },
  {
    icon: Lock,
    title: '내 코드는 서버에 저장되지 않습니다',
    description:
      '분석 후 즉시 파기됩니다(Ephemeral Processing). 분석 결과만 저장합니다.',
  },
];

export function Benefits() {
  return (
    <section className="bg-white">
      <div className="max-w-[1200px] mx-auto px-6 py-20 md:py-24">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="text-[28px] md:text-[36px] font-bold text-foreground tracking-tight">
            그래서 뭐가 좋냐면요
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {benefits.map((item, idx) => {
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
