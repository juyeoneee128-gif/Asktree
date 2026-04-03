import { GlobalHeader } from '@/src/components/layout/GlobalHeader';

export default function ClaudeMdPage() {
  return (
    <>
      <GlobalHeader
        leftContent={<span className="text-[14px] font-semibold text-foreground">AI 가이드라인 5건</span>}
        rightContent={<span className="text-[13px] text-gray-400">Phase 3에서 구현</span>}
      />
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <p className="text-muted-foreground text-[14px]">CLAUDE.md 탭 — Phase 3에서 구현</p>
      </div>
    </>
  );
}
