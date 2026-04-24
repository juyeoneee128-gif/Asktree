'use client';

import { useMemo, useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Folder, RefreshCw } from 'lucide-react';
import { GlobalHeader } from '@/src/components/layout/GlobalHeader';
import { MasterDetailLayout } from '@/src/components/layout/MasterDetailLayout';
import { Button } from '@/src/components/ui/Button';
import { ProgressBar } from '@/src/components/ui/ProgressBar';
import { Badge } from '@/src/components/ui/Badge';
import { Modal } from '@/src/components/ui/Modal';
import { EmptyState } from '@/src/components/composite/EmptyState';
import { FeatureListItem } from '@/src/components/features/status/FeatureListItem';
import { FeatureDetailPanel } from '@/src/components/features/status/FeatureDetailPanel';
import { fetchStatusFeatures, assessFeatures } from '@/src/lib/api/specs';
import { PageSkeleton } from '@/src/components/ui/Skeleton';
import type { Feature } from '@/src/lib/mock-data';

export default function StatusPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const projectId = params?.id ?? '';
  const issuesHref = projectId ? `/projects/${projectId}/issues` : '/projects';

  const [features, setFeatures] = useState<Feature[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [analyzeModalOpen, setAnalyzeModalOpen] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  const load = useCallback(async () => {
    if (!projectId) return;
    try {
      setError(null);
      const { features: fetched } = await fetchStatusFeatures(projectId);
      setFeatures(fetched);
      setSelectedId((prev) => prev ?? fetched[0]?.id ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : '기능 목록을 불러올 수 없습니다');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    load();
  }, [load]);

  const selectedFeature = useMemo(
    () => features.find((f) => f.id === selectedId) ?? null,
    [features, selectedId]
  );

  const stats = useMemo(() => {
    const total = features.length;
    const counts = {
      implemented: features.filter((f) => f.status === 'implemented').length,
      partial: features.filter((f) => f.status === 'partial').length,
      attention: features.filter((f) => f.status === 'attention').length,
      unimplemented: features.filter((f) => f.status === 'unimplemented').length,
    };
    const rate =
      total > 0
        ? Math.round(((counts.implemented + counts.partial * 0.5) / total) * 100)
        : 0;
    return { total, counts, rate };
  }, [features]);

  const handleAnalyze = async () => {
    if (!projectId) return;
    try {
      setAnalyzing(true);
      await assessFeatures(projectId);
      setAnalyzeModalOpen(false);
      await load();
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : '분석 실행에 실패했습니다');
    } finally {
      setAnalyzing(false);
    }
  };

  const isEmpty = features.length === 0;

  if (loading) {
    return <PageSkeleton />;
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
          <div className="flex items-center gap-4 flex-1">
            <span className="text-[16px] font-semibold text-foreground shrink-0">
              기획 대비 구현 현황
            </span>
            {!isEmpty && (
              <div className="flex items-center gap-3">
                <div style={{ width: 200 }}>
                  <ProgressBar value={stats.rate} />
                </div>
                <span
                  style={{
                    fontSize: 18,
                    fontWeight: 700,
                    color: 'var(--color-foreground)',
                  }}
                >
                  {stats.rate}%
                </span>
              </div>
            )}
          </div>
        }
        rightContent={
          !isEmpty && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <Badge variant="implemented">구현 {stats.counts.implemented}</Badge>
                <Badge variant="partial">부분 {stats.counts.partial}</Badge>
                <Badge variant="attention">확인 {stats.counts.attention}</Badge>
                <Badge variant="unimplemented">미구현 {stats.counts.unimplemented}</Badge>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => setAnalyzeModalOpen(true)}
              >
                <RefreshCw size={12} />
                다시 분석
              </Button>
            </div>
          )
        }
      />

      {isEmpty ? (
        <div className="flex-1 bg-gray-50">
          <EmptyState
            icon={<Folder size={48} className="text-gray-300" />}
            title="프로젝트를 연동하면"
            description="AI가 자동으로 기능을 분석합니다. 에이전트를 설치하거나 기획서 문서를 업로드해주세요."
            primaryAction={{
              label: '에이전트 설치하기',
              onClick: () => {},
            }}
            secondaryAction={{
              label: '기획서 문서 업로드하기',
              onClick: () => {},
            }}
          />
        </div>
      ) : (
        <MasterDetailLayout
          listContent={
            <div className="flex flex-col">
              {features.map((feature) => (
                <FeatureListItem
                  key={feature.id}
                  feature={feature}
                  isSelected={selectedId === feature.id}
                  onClick={() => setSelectedId(feature.id)}
                />
              ))}
            </div>
          }
          detailContent={
            <FeatureDetailPanel
              feature={selectedFeature}
              issuesHref={issuesHref}
              onUploadDoc={() => {}}
            />
          }
        />
      )}

      {/* 분석 실행 확인 모달 */}
      <Modal
        isOpen={analyzeModalOpen}
        onClose={() => !analyzing && setAnalyzeModalOpen(false)}
        title="분석을 실행하시겠습니까?"
        icon={<RefreshCw size={20} className="text-primary" />}
        width={440}
        actions={[
          {
            label: '취소',
            variant: 'ghost',
            onClick: () => setAnalyzeModalOpen(false),
          },
          {
            label: analyzing ? '실행 중...' : '실행',
            variant: 'primary',
            onClick: handleAnalyze,
          },
        ]}
      >
        <p className="text-[14px] text-muted-foreground leading-relaxed mb-4">
          현재 코드와 기획서를 기반으로 전체 기능의 구현 현황을 재분석합니다.
          Claude API가 호출되며 크레딧이 차감됩니다.
        </p>
        <div
          className="flex items-center justify-between rounded-lg"
          style={{
            padding: 12,
            backgroundColor: 'var(--color-muted)',
          }}
        >
          <span style={{ fontSize: 13, color: 'var(--color-muted-foreground)' }}>
            예상 소요 크레딧
          </span>
          <span
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: 'var(--color-primary)',
            }}
          >
            약 1 크레딧
          </span>
        </div>
      </Modal>
    </>
  );
}
