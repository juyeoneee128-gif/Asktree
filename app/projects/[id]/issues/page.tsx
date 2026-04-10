'use client';

import { useMemo, useState } from 'react';
import { ShieldCheck, CircleCheck, Search, Play } from 'lucide-react';
import { GlobalHeader } from '@/src/components/layout/GlobalHeader';
import { MasterDetailLayout } from '@/src/components/layout/MasterDetailLayout';
import { Badge } from '@/src/components/ui/Badge';
import { Modal } from '@/src/components/ui/Modal';
import { Button } from '@/src/components/ui/Button';
import { GuidelinePreview } from '@/src/components/composite/GuidelinePreview';
import { IssueListSection } from '@/src/components/features/issues/IssueListSection';
import { IssueDetailPanel } from '@/src/components/features/issues/IssueDetailPanel';
import { mockIssues, mockGuidelines, type Issue } from '@/src/lib/mock-data';

export default function IssuesPage() {
  const [issues, setIssues] = useState<Issue[]>(mockIssues);
  const [selectedId, setSelectedId] = useState<string | null>(
    mockIssues.find((i) => i.status === 'unconfirmed')?.id ?? null
  );
  const [confirmModalIssueId, setConfirmModalIssueId] = useState<string | null>(null);

  const grouped = useMemo(() => {
    return {
      unconfirmed: issues.filter((i) => i.status === 'unconfirmed'),
      confirmed: issues.filter((i) => i.status === 'confirmed'),
      resolved: issues.filter((i) => i.status === 'resolved'),
    };
  }, [issues]);

  const counts = useMemo(() => {
    const unresolved = issues.filter((i) => i.status !== 'resolved');
    return {
      critical: unresolved.filter((i) => i.level === 'critical').length,
      warning: unresolved.filter((i) => i.level === 'warning').length,
      info: unresolved.filter((i) => i.level === 'info').length,
    };
  }, [issues]);

  const selectedIssue = useMemo(
    () => issues.find((i) => i.id === selectedId) ?? null,
    [issues, selectedId]
  );

  const handleConfirm = (id: string) => {
    setIssues((prev) =>
      prev.map((i) => (i.id === id ? { ...i, status: 'confirmed' as const } : i))
    );
    setConfirmModalIssueId(id);
  };

  const handleResolve = (id: string) => {
    setIssues((prev) =>
      prev.map((i) => (i.id === id ? { ...i, status: 'resolved' as const } : i))
    );
  };

  const modalIssue = useMemo(
    () => issues.find((i) => i.id === confirmModalIssueId) ?? null,
    [issues, confirmModalIssueId]
  );

  const suggestedGuideline = useMemo(() => {
    if (!modalIssue) return null;
    return mockGuidelines.find((g) => g.sourceIssueId === modalIssue.id) ?? null;
  }, [modalIssue]);

  // 빈 상태 판정
  const isEmpty = issues.length === 0;
  const isAllResolved = !isEmpty && grouped.unconfirmed.length === 0 && grouped.confirmed.length === 0;

  // 우측 패널에 표시할 콘텐츠 결정
  let detailContent;
  if (isEmpty) {
    detailContent = (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <div className="flex flex-col items-center text-center px-6">
          <Search size={40} className="text-gray-400" />
          <h2 className="mt-4 text-[20px] font-semibold text-foreground">
            아직 감지된 이슈가 없습니다
          </h2>
          <p className="mt-2 text-[14px] text-muted-foreground">
            코딩 세션이 끝나면 AI가 자동으로
          </p>
          <p className="text-[14px] text-muted-foreground">
            코드를 분석하고, 문제가 발견되면 여기에 표시됩니다.
          </p>
          <div className="mt-8">
            <Button variant="primary" size="lg" className="gap-2 px-7">
              <Play size={16} />
              분석 실행
            </Button>
          </div>
          <p className="mt-4 text-[12px] text-muted-foreground">
            또는 다음 코딩 세션 후 자동으로 분석됩니다.
          </p>
        </div>
      </div>
    );
  } else if (isAllResolved && !selectedIssue) {
    detailContent = (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <div className="flex flex-col items-center text-center px-6">
          <CircleCheck size={40} className="text-success" />
          <h2 className="mt-4 text-[20px] font-semibold text-foreground">
            모든 이슈가 해결되었습니다
          </h2>
          <p className="mt-2 text-[14px] text-muted-foreground">
            프로젝트에 등록된 모든 이슈가 확인 및 해결 처리되었습니다.
          </p>
          <p className="mt-3 text-[12px] text-gray-400">
            마지막 업데이트: 방금 전
          </p>
        </div>
      </div>
    );
  } else {
    detailContent = (
      <IssueDetailPanel
        issue={selectedIssue}
        onConfirm={handleConfirm}
        onResolve={handleResolve}
      />
    );
  }

  return (
    <>
      <GlobalHeader
        leftContent={
          <div className="flex items-center gap-2">
            {counts.critical > 0 && (
              <Badge variant="critical">Critical {counts.critical}</Badge>
            )}
            {counts.warning > 0 && (
              <Badge variant="warning">Warning {counts.warning}</Badge>
            )}
            {counts.info > 0 && (
              <Badge variant="info">Info {counts.info}</Badge>
            )}
            {counts.critical + counts.warning + counts.info === 0 && (
              <span className="text-[14px] text-muted-foreground">감지된 이슈 없음</span>
            )}
          </div>
        }
        rightContent={
          <span className="text-[13px] text-muted-foreground">마지막 분석 5분 전</span>
        }
      />

      <MasterDetailLayout
        listContent={
          <div className="flex flex-col">
            <IssueListSection
              title="미확인"
              status="unconfirmed"
              issues={grouped.unconfirmed}
              selectedIssueId={selectedId}
              onSelectIssue={setSelectedId}
              defaultOpen
            />
            <IssueListSection
              title="확인 완료"
              status="confirmed"
              issues={grouped.confirmed}
              selectedIssueId={selectedId}
              onSelectIssue={setSelectedId}
              defaultOpen
            />
            <IssueListSection
              title="해결됨"
              status="resolved"
              issues={grouped.resolved}
              selectedIssueId={selectedId}
              onSelectIssue={setSelectedId}
              defaultOpen={isAllResolved}
            />
          </div>
        }
        detailContent={detailContent}
      />

      {/* 확인 완료 후 보호 규칙 제안 모달 */}
      <Modal
        isOpen={confirmModalIssueId !== null}
        onClose={() => setConfirmModalIssueId(null)}
        title="보호 규칙을 추가할까요?"
        icon={<ShieldCheck size={20} className="text-primary" />}
        width={520}
        actions={[
          {
            label: '나중에',
            variant: 'ghost',
            onClick: () => setConfirmModalIssueId(null),
          },
          {
            label: 'CLAUDE.md에 추가',
            variant: 'primary',
            onClick: () => setConfirmModalIssueId(null),
          },
        ]}
      >
        <p className="text-[14px] text-muted-foreground leading-relaxed mb-4">
          이 이슈가 다시 발생하지 않도록 CLAUDE.md에 보호 규칙을 추가할 수 있습니다.
          한 번 추가된 규칙은 Claude Code가 같은 실수를 반복하지 않게 도와줍니다.
        </p>
        {suggestedGuideline && (
          <GuidelinePreview rule={suggestedGuideline.rule} />
        )}
      </Modal>
    </>
  );
}
