'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { FadeIn } from '@/src/components/features/landing/_components/FadeIn';

const faqs = [
  {
    q: '코드를 모르는데 쓸 수 있나요?',
    a: '네. CodeSasu의 모든 안내는 비개발자 언어로 제공됩니다. Fix 명령어를 복사해서 Claude Code에 붙여넣기만 하면 됩니다.',
  },
  {
    q: '내 코드가 서버에 저장되나요?',
    a: '아닙니다. 코드 원본은 분석 후 즉시 파기됩니다(Ephemeral Processing). 분석 결과만 안전하게 저장됩니다.',
  },
  {
    q: 'Claude Code 외에 다른 도구도 지원하나요?',
    a: '현재는 Claude Code 전용입니다. Cursor, Windsurf 등은 곧 지원 예정입니다.',
  },
  {
    q: '무료로 쓸 수 있나요?',
    a: 'Beta 기간 동안 사전 등록자에게 500크레딧을 무료로 드립니다. 본인의 Claude API 키를 등록하면 추가 비용 없이 계속 사용할 수 있습니다.',
  },
  {
    q: '기존 SonarQube나 ESLint와 뭐가 다른가요?',
    a: 'SonarQube/ESLint는 개발자용 정적 분석 도구입니다. CodeSasu는 같은 가치(이슈 감지 + 현황 트래킹)를 비개발자 언어로 제공하고, 세션 단위로 자동 수집·요약·보호 규칙까지 만들어줍니다.',
  },
];

export function FAQ() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <section id="faq" className="bg-gray-50 border-y border-border">
      <div className="max-w-3xl mx-auto px-6 py-24 md:py-32">
        <FadeIn>
          <div className="text-center mb-14">
            <p className="text-[13px] font-semibold text-primary tracking-wide mb-3">
              FAQ
            </p>
            <h2 className="text-[32px] md:text-[44px] leading-[1.15] font-bold text-foreground tracking-tight">
              자주 묻는 질문
            </h2>
          </div>
        </FadeIn>
        <FadeIn delay={100}>
          <div className="flex flex-col gap-3">
            {faqs.map((item, idx) => {
              const isOpen = openIdx === idx;
              return (
                <div
                  key={idx}
                  className="rounded-xl border border-border bg-white overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => setOpenIdx(isOpen ? null : idx)}
                    className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <span className="text-[15px] font-semibold text-foreground">
                      {item.q}
                    </span>
                    <ChevronDown
                      size={18}
                      className={[
                        'flex-shrink-0 text-muted-foreground transition-transform duration-200',
                        isOpen ? 'rotate-180' : '',
                      ].join(' ')}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-5 -mt-1">
                      <p className="text-[14px] text-muted-foreground leading-relaxed">
                        {item.a}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
