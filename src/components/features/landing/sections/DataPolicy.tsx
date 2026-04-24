import { Trash2, ShieldCheck, FileCheck } from 'lucide-react';
import { Card } from '@/src/components/ui';

const items = [
  {
    icon: Trash2,
    title: '코드 원본은 저장하지 않습니다',
    description:
      '분석 후 즉시 파기됩니다 (Ephemeral Processing). 서버에는 분석 결과만 안전하게 저장됩니다.',
  },
  {
    icon: ShieldCheck,
    title: '암호화된 통신',
    description:
      '에이전트와 서버 간 모든 데이터는 HTTPS로 암호화되어 전송됩니다. API 키는 AES-256으로 서버에서 암호화 저장됩니다.',
  },
  {
    icon: FileCheck,
    title: '투명한 수집 범위',
    description:
      '수집하는 것: Claude Code 세션 로그, 변경된 파일 diff. 수집하지 않는 것: .env, 비밀번호, 개인정보.',
  },
];

export function DataPolicy() {
  return (
    <section className="bg-white">
      <div className="max-w-[1200px] mx-auto px-6 py-20 md:py-24">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="text-[28px] md:text-[36px] font-bold text-foreground tracking-tight">
            데이터 관리 정책
          </h2>
          <p className="mt-4 text-[16px] text-muted-foreground leading-relaxed">
            내 코드는 내 것. 데이터는 투명하게 관리됩니다.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {items.map((item, idx) => {
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
