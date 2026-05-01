import { Download, FolderOpen, Shield, ChevronRight } from 'lucide-react';
import { FadeIn } from '@/src/components/features/landing/_components/FadeIn';

const flow = [
  { Icon: Download, label: '수집' },
  { Icon: FolderOpen, label: '정돈' },
  { Icon: Shield, label: '감시' },
];

export function CoreValue() {
  return (
    <section className="bg-foreground">
      <div className="max-w-[1200px] mx-auto px-6 py-12 md:py-16">
        <FadeIn>
          <p className="max-w-3xl mx-auto text-center text-[26px] md:text-[34px] leading-[1.35] font-bold text-white tracking-tight">
            당신이 코딩하는 모든 순간을
            <br className="hidden md:block" />
            <span className="text-white/90">사수가 수집하고, 정돈하고, 감시합니다</span>
          </p>
        </FadeIn>

        <FadeIn delay={150}>
          <div className="mt-10 md:mt-12 flex items-center justify-center gap-8">
            {flow.map(({ Icon, label }, idx) => (
              <div key={label} className="flex items-center gap-8">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center">
                    <Icon strokeWidth={2} className="w-7 h-7 text-white" />
                  </div>
                  <span className="text-base font-medium text-white">
                    {label}
                  </span>
                </div>
                {idx < flow.length - 1 && (
                  <ChevronRight
                    strokeWidth={2}
                    className="w-5 h-5 text-white/40 shrink-0 -mt-9"
                  />
                )}
              </div>
            ))}
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
