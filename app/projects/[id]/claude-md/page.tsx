'use client';

import { useMemo, useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Shield, Eye, ShieldCheck, TriangleAlert } from 'lucide-react';
import { GlobalHeader } from '@/src/components/layout/GlobalHeader';
import { MasterDetailLayout } from '@/src/components/layout/MasterDetailLayout';
import { Button } from '@/src/components/ui/Button';
import { Modal } from '@/src/components/ui/Modal';
import { EmptyState } from '@/src/components/composite/EmptyState';
import { GuidelineListSection } from '@/src/components/features/claude-md/GuidelineListSection';
import { GuidelineDetailPanel } from '@/src/components/features/claude-md/GuidelineDetailPanel';
import { FullPreviewModal } from '@/src/components/features/claude-md/FullPreviewModal';
import {
  fetchGuidelines,
  patchGuideline,
  deleteGuideline,
} from '@/src/lib/api/guidelines';
import { fetchIssues } from '@/src/lib/api/issues';
import type { Guideline, Issue } from '@/src/lib/mock-data';

export default function ClaudeMdPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [guidelines, setGuidelines] = useState<Guideline[]>([]);
  const [issuesById, setIssuesById] = useState<Record<string, Issue | undefined>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const [guidelinesResult, issuesResult] = await Promise.all([
        fetchGuidelines(projectId),
        fetchIssues(projectId),
      ]);
      setGuidelines(guidelinesResult.guidelines);

      const issueMap: Record<string, Issue | undefined> = {};
      issuesResult.issues.forEach((i) => {
        issueMap[i.id] = i;
      });
      setIssuesById(issueMap);

      const firstUnapplied = guidelinesResult.guidelines.find(
        (g) => g.status === 'unapplied'
      );
      setSelectedId(firstUnapplied?.id ?? guidelinesResult.guidelines[0]?.id ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : '데이터를 불러올 수 없습니다');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    load();
  }, [load]);

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

  const selectedSourceIssue =
    selectedGuideline && selectedGuideline.sourceIssueId
      ? issuesById[selectedGuideline.sourceIssueId] ?? null
      : null;

  const deleteTarget = useMemo(
    () => guidelines.find((g) => g.id === deleteTargetId) ?? null,
    [guidelines, deleteTargetId]
  );

  const handleApplyToClaudeMd = async (id: string) => {
    try {
      const updated = await patchGuideline(projectId, id, 'applied');
      setGuidelines((prev) => prev.map((g) => (g.id === id ? updated : g)));
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'CLAUDE.md 추가에 실패했습니다');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTargetId) return;
    try {
      await deleteGuideline(projectId, deleteTargetId);
      setGuidelines((prev) => prev.filter((g) => g.id !== deleteTargetId));
      if (selectedId === deleteTargetId) setSelectedId(null);
      setDeleteTargetId(null);
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : '삭제에 실패했습니다');
    }
  };

  const isEmpty = guidelines.length === 0;

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-[14px] text-muted-foreground">로딩 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-[14px] text-destructive">{error}</p>
      </div>
    );
  }

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
