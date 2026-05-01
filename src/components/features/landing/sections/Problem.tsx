import { AlertTriangle, HelpCircle, RefreshCw } from 'lucide-react';
import { FadeIn } from '@/src/components/features/landing/_components/FadeIn';

const pains = [
  {
    Icon: AlertTriangle,
    text: '리팩토링했더니 결제 기능이 사라졌는데, 이틀 뒤에 발견했어요',
  },
  {
    Icon: HelpCircle,
    text: '빌드는 되는데, 뭐가 잘못된 건지 모르겠어요',
  },
  {
    Icon: RefreshCw,
    text: '대화가 길어지면서 코드가 슬금슬금 변형되는 것 같아요',
  },
];

export function Problem() {
  return (
    <section className="bg-white">
      <div className="max-w-[1200px] mx-auto px-6 py-16 md:py-24">
        <FadeIn>
          <blockquote className="max-w-3xl mx-auto text-center">
            <p className="text-[28px] md:text-[36px] leading-[1.4] font-semibold text-foreground tracking-tight">
              바이브 코딩, 시작은 쉽지만
              <br className="hidden md:block" />
              왜 수정이 반복될수록 점점 어딘가가 망가질까요?
            </p>
          </blockquote>
        </FadeIn>

        <div className="mt-14 md:mt-16 grid grid-cols-1 md:grid-cols-3 gap-5 max-w-5xl mx-auto">
          {pains.map(({ Icon, text }, idx) => (
            <FadeIn key={idx} delay={idx * 100}>
              <div className="h-full rounded-2xl border border-border bg-[#FAFAF9] p-7">
                <div className="w-10 h-10 rounded-lg bg-[#FFF7ED] flex items-center justify-center mb-5">
                  <Icon size={20} className="text-[#E67D22]" />
                </div>
                <p className="text-[15px] font-medium leading-relaxed text-foreground">
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
