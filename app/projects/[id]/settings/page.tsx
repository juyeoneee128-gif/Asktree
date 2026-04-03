import { GlobalHeader } from '@/src/components/layout/GlobalHeader';

export default function SettingsPage() {
  return (
    <>
      <GlobalHeader
        leftContent={<span className="text-[14px] font-semibold text-foreground">프로젝트 설정</span>}
        rightContent={<span className="text-[13px] text-gray-400">Phase 7에서 구현</span>}
      />
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <p className="text-muted-foreground text-[14px]">프로젝트 설정 — Phase 7에서 구현</p>
      </div>
    </>
  );
}
