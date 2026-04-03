import { GlobalHeader } from '@/src/components/layout/GlobalHeader';

export default function SessionsPage() {
  return (
    <>
      <GlobalHeader
        leftContent={<span className="text-[14px] font-semibold text-foreground">전체 세션 12개</span>}
        rightContent={<span className="text-[13px] text-gray-400">Phase 5에서 구현</span>}
      />
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <p className="text-muted-foreground text-[14px]">[세션] 탭 — Phase 5에서 구현</p>
      </div>
    </>
  );
}
