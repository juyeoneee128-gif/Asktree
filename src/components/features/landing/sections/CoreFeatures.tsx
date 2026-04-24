import { Bug, BarChart3, Shield, FileText } from 'lucide-react';

interface FeatureItem {
  icon: typeof Bug;
  title: string;
  description: string;
  placeholderLabel: string;
}

const features: FeatureItem[] = [
  {
    icon: Bug,
    title: 'AI가 망가뜨린 코드를 자동으로 감지',
    description:
      '빌드는 되지만 기능이 깨진 문제, OWASP 보안 취약점, 환경변수 누락까지 자동으로 찾아냅니다. Fact → Detail → Fix 구조로 비개발자도 바로 이해하고 조치할 수 있습니다.',
    placeholderLabel: '이슈 탭 미리보기',
  },
  {
    icon: BarChart3,
    title: '기획 대비 어디까지 왔는지 한눈에',
    description:
      '기획서에 적은 기능이 실제로 얼마나 구현되었는지 PRD vs 코드를 자동 대조합니다. 구현완료 / 부분구현 / 미구현 상태를 한눈에 확인하세요.',
    placeholderLabel: '현황 탭 미리보기',
  },
  {
    icon: Shield,
    title: '한 번 당한 문제는 두 번 없게',
    description:
      '감지된 문제를 CLAUDE.md 보호 규칙으로 자동 생성합니다. 규칙이 쌓일수록 AI가 함부로 건드리지 못하는 선순환이 만들어집니다. 보호 규칙을 복사해서 CLAUDE.md에 붙여넣기만 하면 됩니다.',
    placeholderLabel: 'CLAUDE.md 탭 미리보기',
  },
  {
    icon: FileText,
    title: '모든 작업 내역을 자동으로 기록',
    description:
      'Claude Code 작업 내역이 자동으로 기록됩니다. 세션별 변경 파일, 프롬프트 수, 도구 사용 횟수를 한눈에 확인하세요. 에이전트가 백그라운드에서 알아서 수집합니다.',
    placeholderLabel: '세션 탭 미리보기',
  },
];

export function CoreFeatures() {
  return (
    <section className="bg-gray-50 border-y border-border">
      <div className="max-w-[1200px] mx-auto px-6 py-20 md:py-28">
        <div className="text-center max-w-2xl mx-auto mb-16 md:mb-20">
          <h2 className="text-[28px] md:text-[36px] font-bold text-foreground tracking-tight">
            기능별로 자세히 살펴보세요
          </h2>
          <p className="mt-4 text-[16px] text-muted-foreground leading-relaxed">
            이슈 감지 · 현황 트래킹 · 보호 규칙 · 세션 로그
          </p>
        </div>

        <div className="flex flex-col gap-20 md:gap-28">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            const reversed = idx % 2 === 1;
            return (
              <div
                key={feature.title}
                className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center"
              >
                <div
                  className={[
                    'flex flex-col gap-4',
                    reversed ? 'md:order-2' : 'md:order-1',
                  ].join(' ')}
                >
                  <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center">
                    <Icon size={22} className="text-primary" />
                  </div>
                  <h3 className="text-[22px] md:text-[28px] font-bold text-foreground tracking-tight leading-snug">
                    {feature.title}
                  </h3>
                  <p className="text-[15px] md:text-[16px] text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
                <div className={reversed ? 'md:order-1' : 'md:order-2'}>
                  <div className="relative rounded-2xl border border-border bg-white shadow-xl overflow-hidden">
                    <div className="h-9 border-b border-border bg-gray-100 flex items-center gap-1.5 px-4">
                      <span className="w-3 h-3 rounded-full bg-gray-300" />
                      <span className="w-3 h-3 rounded-full bg-gray-300" />
                      <span className="w-3 h-3 rounded-full bg-gray-300" />
                    </div>
                    <div className="aspect-[16/9] bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                      <div className="text-center">
                        <p className="text-[14px] font-semibold text-muted-foreground">
                          {feature.placeholderLabel}
                        </p>
                        <p className="text-[12px] text-gray-400 mt-1">
                          실제 스크린샷으로 교체 예정
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
