import { GlobalHeader } from '@/src/components/layout/GlobalHeader';

export default function SpecsPage() {
  return (
    <>
      <GlobalHeader
        leftContent={<span className="text-[14px] font-semibold text-foreground">기획서 관리</span>}
        rightContent={<span className="text-[13px] text-gray-400">Phase 6에서 구현</span>}
      />
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <p className="text-muted-foreground text-[14px]">기획서 탭 — Phase 6에서 구현</p>
      </div>
    </>
  );
}
