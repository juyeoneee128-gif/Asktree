import { FadeIn } from '@/src/components/features/landing/_components/FadeIn';

export function CoreValue() {
  return (
    <section className="bg-gray-50 border-y border-border">
      <div className="max-w-[1200px] mx-auto px-6 py-24 md:py-32">
        <FadeIn>
          <p className="max-w-3xl mx-auto text-center text-[28px] md:text-[36px] leading-[1.35] font-bold text-foreground tracking-tight">
            CodeSasu는 AI가 코딩하는 모든 순간을
            <br className="hidden md:block" />
            <span className="text-primary"> 수집하고, 정돈하고, 감시합니다.</span>
          </p>
        </FadeIn>
      </div>
    </section>
  );
}
