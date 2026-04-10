'use client';

import { useMemo, useState } from 'react';
import { Shield, Eye, ShieldCheck, TriangleAlert } from 'lucide-react';
import { GlobalHeader } from '@/src/components/layout/GlobalHeader';
import { MasterDetailLayout } from '@/src/components/layout/MasterDetailLayout';
import { Button } from '@/src/components/ui/Button';
import { Modal } from '@/src/components/ui/Modal';
import { EmptyState } from '@/src/components/composite/EmptyState';
import { GuidelineListSection } from '@/src/components/features/claude-md/GuidelineListSection';
import { GuidelineDetailPanel } from '@/src/components/features/claude-md/GuidelineDetailPanel';
import { FullPreviewModal } from '@/src/components/features/claude-md/FullPreviewModal';
import { mockGuidelines, mockIssues, type Guideline, type Issue } from '@/src/lib/mock-data';

export default function ClaudeMdPage() {
  const [guidelines, setGuidelines] = useState<Guideline[]>(mockGuidelines);
  const [selectedId, setSelectedId] = useState<string | null>(
    mockGuidelines.find((g) => g.status === 'unapplied')?.id ?? null
  );
  const [previewOpen, setPreviewOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // sourceIssueId로 이슈 조회 가능한 맵
  const issuesById = useMemo<Record<string, Issue | undefined>>(() => {
    return mockIssues.reduce<Record<string, Issue | undefined>>((acc, issue) => {
      acc[issue.id] = issue;
      return acc;
    }, {});
  }, []);

  const grouped = useMemo(() => {
    return {
      unapplied: guidelines.filter((g) => g.status === 'unapplied'),
      applied: guidelines.filter((g) => g.status === 'applied'),
    };
  }, [guidelines]);

  const selectedGuideline = useMemo(
    () => guidelines.find((g) => g.id === selectedId) ?? null,
    [guidelines, selectedId]
  );

  const selectedSourceIssue = selectedGuideline
    ? issuesById[selectedGuideline.sourceIssueId] ?? null
    : null;

  const deleteTarget = useMemo(
    () => guidelines.find((g) => g.id === deleteTargetId) ?? null,
    [guidelines, deleteTargetId]
  );

  const handleApplyToClaudeMd = (id: string) => {
    setGuidelines((prev) =>
      prev.map((g) => (g.id === id ? { ...g, status: 'applied' as const } : g))
    );
  };

  const handleConfirmDelete = () => {
    if (!deleteTargetId) return;
    setGuidelines((prev) => prev.filter((g) => g.id !== deleteTargetId));
    if (selectedId === deleteTargetId) setSelectedId(null);
    setDeleteTargetId(null);
  };

  const isEmpty = guidelines.length === 0;

  return (
    <>
      <GlobalHeader
        leftContent={
          <div className="flex items-center gap-2">
            <Shield size={20} className="text-primary" />
            <span className="text-[16px] font-bold text-foreground">
              AI 가이드라인 {guidelines.length}건
            </span>
          </div>
        }
        rightContent={
          !isEmpty && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => setPreviewOpen(true)}
            >
              <Eye size={14} />
              CLAUDE.md 미리보기
            </Button>
          )
        }
      />

      {isEmpty ? (
        <div className="flex-1 bg-gray-50">
          <EmptyState
            icon={<ShieldCheck size={48} className="text-gray-300" />}
            title="아직 AI 가이드라인이 없습니다."
            description="[이슈] 탭에서 이슈를 확인하면 가이드라인이 자동으로 생성됩니다. CLAUDE.md란? Claude Code가 매 세션 시작 시 읽는 프로젝트 규칙 파일입니다."
          />
        </div>
      ) : (
        <MasterDetailLayout
          listContent={
            <div className="flex flex-col">
              <GuidelineListSection
                title="미적용"
                status="unapplied"
                guidelines={grouped.unapplied}
                issuesById={issuesById}
                selectedGuidelineId={selectedId}
                onSelectGuideline={setSelectedId}
                defaultOpen
              />
              <GuidelineListSection
                title="적용 완료"
                status="applied"
                guidelines={grouped.applied}
                issuesById={issuesById}
                selectedGuidelineId={selectedId}
                onSelectGuideline={setSelectedId}
                defaultOpen
              />
            </div>
          }
          detailContent={
            <GuidelineDetailPanel
              guideline={selectedGuideline}
              sourceIssue={selectedSourceIssue}
              onCopyToClaudeMd={handleApplyToClaudeMd}
              onDelete={(id) => setDeleteTargetId(id)}
            />
          }
        />
      )}

      {/* CLAUDE.md 미리보기 모달 — 적용 완료 항목만 포함 */}
      <FullPreviewModal
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
        guidelines={grouped.applied}
      />

      {/* 삭제 확인 모달 */}
      <Modal
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTargetId(null)}
        title="가이드라인을 삭제하시겠습니까?"
        icon={<TriangleAlert size={20} className="text-destructive" />}
        width={480}
        actions={[
          {
            label: '취소',
            variant: 'outline',
            onClick: () => setDeleteTargetId(null),
          },
          {
            label: '삭제',
            variant: 'destructive',
            onClick: handleConfirmDelete,
          },
        ]}
      >
        <p className="text-[14px] text-muted-foreground leading-relaxed">
          {deleteTarget?.title} 가이드라인이 삭제됩니다.
        </p>
        <p className="text-[14px] text-muted-foreground leading-relaxed mt-1">
          삭제 후에도 CLAUDE.md 파일에서 직접 제거해야 합니다.
        </p>
      </Modal>
    </>
  );
}
