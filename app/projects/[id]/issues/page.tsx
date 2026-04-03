import { GlobalHeader } from '@/src/components/layout/GlobalHeader';
import { Badge } from '@/src/components/ui/Badge';

export default function IssuesPage() {
  return (
    <>
      <GlobalHeader
        leftContent={
          <div className="flex items-center gap-2">
            <Badge variant="critical">Critical 2</Badge>
            <Badge variant="warning">Warning 3</Badge>
            <Badge variant="info">Info 1</Badge>
          </div>
        }
        rightContent={<span className="text-[13px] text-gray-400">Phase 2에서 구현</span>}
      />
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <p className="text-muted-foreground text-[14px]">[이슈] 탭 — Phase 2에서 구현</p>
      </div>
    </>
  );
}
