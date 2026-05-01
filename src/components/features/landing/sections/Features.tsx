import { FadeIn } from '@/src/components/features/landing/_components/FadeIn';

interface Feature {
  eyebrow: string;
  title: string;
  body: string;
  visualLabel: string;
}

const features: Feature[] = [
  {
    eyebrow: '01 · 자동 수집',
    title: '에이전트가 알아서 수집합니다',
    body: '터미널에 한 줄 설치하면, Claude Code 세션이 끝날 때마다 코드 변경, 작업 내역, 기획서(docs/*.md)를 자동으로 수집합니다\n따로 업로드하거나 설정할 필요 없습니다',
    visualLabel: 'CLI 터미널 — 에이전트 로그',
  },
  {
    eyebrow: '02 · 세션 보관',
    title: '내 코딩 과정을 아카이빙합니다',
    body: '“이번 세션: 결제 모듈 추가, 인증 미들웨어 수정”\n세션마다 무엇을 했는지 자동으로 정리합니다\n코드를 몰라도 프로젝트의 현재 상태를 한눈에 파악할 수 있습니다',
    visualLabel: '세션 요약 화면',
  },
  {
    eyebrow: '03 · 이슈 감지',
    title: '보이지 않는 이슈를 먼저 알려줍니다',
    body: '빌드는 되지만 기능이 깨진 문제, 인증을 우회하는 위험한 코드, 같은 기능이 중복으로 만들어진 구조까지\n코드를 몰라도 문제의 심각도와 해결 방법을 바로 확인할 수 있습니다',
    visualLabel: '이슈 탭 — Fact / Detail / Fix',
  },
  {
    eyebrow: '04 · 현황 트래킹',
    title: '기획 대비 어디까지 왔는지 한눈에',
    body: '기획서에 적은 기능이 실제로 얼마나 구현되었는지 자동 대조합니다\n구현률 바와 기능 목록으로 진행 상황을 시각화합니다',
    visualLabel: '현황 탭 — 구현률 + 기능 목록',
  },
  {
    eyebrow: '05 · 보호 규칙',
    title: '한 번 발생한 문제는 두 번 없도록',
    body: '감지된 문제를 CLAUDE.md 보호 규칙으로 자동 생성합니다\n규칙이 쌓일수록 AI가 같은 실수를 반복하지 않는 선순환이 만들어집니다',
    visualLabel: 'CLAUDE.md 탭 — 보호 규칙',
  },
];

function FeatureBlock({ feature, reverse }: { feature: Feature; reverse: boolean }) {
  return (
    <div
      className={[
        'grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20 items-center',
        reverse ? 'md:[&>*:first-child]:order-2' : '',
      ].join(' ')}
    >
      <div className="max-w-[420px]">
        <p className="text-[13px] font-semibold text-muted-foreground tracking-wide mb-4">
          {feature.eyebrow}
        </p>
        <h3 className="text-[24px] md:text-[32px] leading-[1.25] font-semibold text-foreground tracking-tight">
          {feature.title}
        </h3>
        <p className="mt-5 text-[15px] md:text-[16px] font-medium text-muted-foreground leading-relaxed whitespace-pre-line">
          {feature.body}
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-white shadow-card overflow-hidden">
        <div className="h-9 border-b border-border bg-gray-100 flex items-center gap-1.5 px-4">
          <span className="w-3 h-3 rounded-full bg-gray-300" />
          <span className="w-3 h-3 rounded-full bg-gray-300" />
          <span className="w-3 h-3 rounded-full bg-gray-300" />
        </div>
        <div className="aspect-[4/3] bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
          <p className="text-[13px] font-medium text-muted-foreground">
            {feature.visualLabel}
          </p>
        </div>
      </div>
    </div>
  );
}

export function Features() {
  return (
    <section id="features" className="bg-white">
      <div className="max-w-[1200px] mx-auto px-6 py-16 md:py-24">
        <FadeIn>
          <div className="max-w-2xl mb-16 md:mb-20">
            <h2 className="text-[32px] md:text-[44px] leading-[1.15] font-bold text-foreground tracking-tight">
              CodeSasu로 자기주도적 코딩하기
            </h2>
          </div>
        </FadeIn>

        <div className="flex flex-col gap-16 md:gap-24">
          {features.map((feature, idx) => (
            <FadeIn key={idx}>
              <FeatureBlock feature={feature} reverse={idx % 2 === 1} />
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
