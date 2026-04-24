import { AlertTriangle, BugOff, UserX } from 'lucide-react';
import { Card } from '@/src/components/ui';

const problems = [
  {
    icon: AlertTriangle,
    text: "AI한테 '리팩토링해줘' 했더니 3일간 만든 기능이 통째로 사라진 적",
  },
  {
    icon: BugOff,
    text: '빌드는 되는데, 결제가 안 되거나 로그인이 깨진 걸 하루 뒤에 발견한 적',
  },
  {
    icon: UserX,
    text: '뭐가 잘못됐는지 모르겠어서 프리랜서 개발자를 불러야 했던 적',
  },
];

export function Problem() {
  return (
    <section className="bg-gray-50 border-y border-border">
      <div className="max-w-[1200px] mx-auto px-6 py-20 md:py-24">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-[28px] md:text-[36px] font-bold text-foreground tracking-tight">
            혹시 이런 경험 있으신가요?
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {problems.map((item, idx) => {
            const Icon = item.icon;
            return (
              <Card key={idx} padding="28px">
                <div className="flex flex-col gap-4">
                  <div className="w-11 h-11 rounded-lg bg-orange-50 flex items-center justify-center">
                    <Icon size={20} className="text-primary" />
                  </div>
                  <p className="text-[15px] text-foreground leading-relaxed">
                    {item.text}
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
