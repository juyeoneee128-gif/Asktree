import { FadeIn } from '@/src/components/features/landing/_components/FadeIn';

const paragraphs: string[] = [
  'AI로 누구나 코딩하는 시대, 그런데 왜 완성까지는 어려울까요?',
  'AI에게 "이거 만들어줘" 명령하면 프로토타입의 상당 부분까지는 아주 빠르게 만들어줍니다. 그런데 \'제대로 된 제품\'까지 가는 후반 과정에서 막히곤 하는데요.',
  '명확한 상태 관리 없이 반복 수정이 누적되면서 코드가 슬금슬금 변형됩니다. 어제까지 잘 되던 기능이 오늘 갑자기 안 됩니다. 빌드는 되는데, 뭐가 잘못된 건지 알 수가 없습니다.',
  '개발자가 아니라면, 문제 원인을 구조적으로 추적하기 어렵기 때문입니다.',
  '그래서 다시 AI에게 "고쳐줘"라고 합니다. AI가 부분적으로 해결하지만, 또다시 다른 곳에서 문제가 생깁니다. 이 도돌이표를 몇 번이고 반복하다가, 결국 스파게티 코드가 됩니다.',
  '하지만 이 문제는 단순히 코드를 몰라서 발생하는 것이 아닙니다.',
  '개발자 역시 코드 유실, 에러, 기능 깨짐을 겪습니다. 다만 차이는, 테스트, 버전 관리(Git), 코드 리뷰 등으로 구성된 검증 체계를 통해 이러한 문제를 지속적으로 발견하고 통제할 수 있다는 점입니다.',
  '변경 사항을 하나하나 추적하고, 이전 버전과 비교하며, 문제를 해결하는 일련의 과정. 비개발자는 이러한 절차와 도구에 접근하기 어렵기 때문에, 문제의 원인을 구조적으로 파악하기가 쉽지 않습니다.',
  'AI는 \'코드 생성\'과 일부 개발 작업을 대체했을 뿐, 개발 워크플로우 전체를 대체하지는 않습니다. 설계, 변경 관리, 검증, 리뷰 — 이 과정은 여전히 사람이 주도해야 합니다.',
];

const closing: string[] = [
  '비개발자도 완성된 제품을 만들 수 있도록, CodeSasu가 검토와 리뷰를 책임집니다.',
  '코딩하는 모든 순간을 자동으로 수집하고, 무엇이 바뀌었는지 정돈하고, 문제가 생기면 사수처럼 먼저 알려줍니다.',
  '코드를 몰라도 괜찮아요. 사수가 지켜보고 있으니까.',
];

export function AboutEssay() {
  return (
    <section className="bg-white">
      <div className="max-w-[680px] mx-auto px-6 py-24 md:py-32">
        <FadeIn>
          <div className="flex flex-col gap-7 text-[17px] md:text-[18px] leading-[1.85] text-foreground">
            {paragraphs.map((p, idx) => (
              <p key={idx}>{p}</p>
            ))}
          </div>
        </FadeIn>

        <FadeIn delay={100}>
          <div className="mt-10 flex flex-col gap-7 text-[17px] md:text-[18px] leading-[1.85] text-foreground font-semibold">
            {closing.map((p, idx) => (
              <p key={idx}>{p}</p>
            ))}
          </div>
        </FadeIn>

        <FadeIn delay={200}>
          <div className="mt-16 pt-8 border-t border-border">
            <p className="text-[15px] font-semibold text-foreground">
              Journey Kim
            </p>
            <p className="mt-1 text-[14px] text-muted-foreground">
              Founder, CodeSasu
            </p>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
