import { Lock, ShieldCheck, FileSearch } from 'lucide-react';
import { FadeIn } from '@/src/components/features/landing/_components/FadeIn';

const policies = [
  {
    Icon: Lock,
    title: '코드 원본은 저장하지 않습니다',
    body: '분석 후 즉시 파기 (Ephemeral Processing)',
  },
  {
    Icon: ShieldCheck,
    title: '암호화된 통신',
    body: 'HTTPS + AES-256 암호화 저장',
  },
  {
    Icon: FileSearch,
    title: '투명한 수집 범위',
    body: '수집: 세션 로그, 변경 diff, docs 문서\n미수집: .env, 비밀번호, 개인정보',
  },
];

export function DataPolicy() {
  return (
    <section className="bg-white">
      <div className="max-w-[1200px] mx-auto px-6 py-24 md:py-32">
        <FadeIn>
          <div className="max-w-2xl text-center mx-auto mb-16">
            <p className="text-[13px] font-semibold text-primary tracking-wide mb-3">
              Data policy
            </p>
            <h2 className="text-[32px] md:text-[44px] leading-[1.15] font-bold text-foreground tracking-tight">
              당신의 코드는 안전합니다
            </h2>
          </div>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-5xl mx-auto">
          {policies.map(({ Icon, title, body }, idx) => (
            <FadeIn key={title} delay={idx * 100}>
              <div className="h-full rounded-2xl border border-border bg-white p-7">
                <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center mb-5">
                  <Icon size={20} className="text-primary" />
                </div>
                <h3 className="text-[16px] font-bold text-foreground tracking-tight">
                  {title}
                </h3>
                <p className="mt-2.5 text-[14px] text-muted-foreground leading-relaxed whitespace-pre-line">
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
