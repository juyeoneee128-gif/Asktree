import Link from 'next/link';
import { Button } from '@/src/components/ui';

export function FinalCTA() {
  return (
    <section id="final-cta" className="bg-white">
      <div className="max-w-[1200px] mx-auto px-6 py-20 md:py-28">
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-orange-50 via-white to-orange-50 border border-border px-8 py-16 md:py-20 text-center">
          <h2 className="text-[28px] md:text-[40px] font-bold text-foreground tracking-tight leading-tight">
            10크레딧 무료.
            <br />
            카드 등록 없이 바로 시작하세요.
          </h2>
          <p className="mt-5 text-[15px] md:text-[16px] text-muted-foreground">
            설치 3분. 첫 분석 결과까지 5분.
          </p>
          <div className="mt-8">
            <Link href="/auth/login">
              <Button size="lg">무료로 시작하기</Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
