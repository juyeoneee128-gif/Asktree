'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const faqs = [
  {
    q: '코드를 모르는데 쓸 수 있나요?',
    a: 'CodeSasu의 모든 안내는 비개발자 언어로 제공됩니다. Fix 명령어를 복사해서 Claude Code에 붙여넣기만 하면 됩니다.',
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
    a: '가입 시 10크레딧이 무료로 제공됩니다. 본인의 Claude API 키를 등록하면 추가 비용 없이 계속 사용할 수 있습니다.',
  },
  {
    q: 'SonarQube와 뭐가 다른가요?',
    a: 'SonarQube는 개발자용입니다. CodeSasu는 같은 가치(이슈 감지 + 현황 트래킹)를 비개발자 언어로 제공합니다.',
  },
];

export function FAQ() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <section id="faq" className="bg-gray-50 border-y border-border">
      <div className="max-w-3xl mx-auto px-6 py-20 md:py-24">
        <div className="text-center mb-12">
          <h2 className="text-[28px] md:text-[36px] font-bold text-foreground tracking-tight">
            자주 묻는 질문
          </h2>
        </div>
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
      </div>
    </section>
  );
}
