'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { CloudUpload, FileText, Plus } from 'lucide-react';
import { GlobalHeader } from '@/src/components/layout/GlobalHeader';
import { MasterDetailLayout } from '@/src/components/layout/MasterDetailLayout';
import { Button } from '@/src/components/ui/Button';
import { SpecDocList } from '@/src/components/features/specs/SpecDocList';
import { SpecFeatureList } from '@/src/components/features/specs/SpecFeatureList';
import {
  SpecUploadModal,
  type SpecUploadValue,
} from '@/src/components/features/specs/SpecUploadModal';
import {
  fetchSpecDocuments,
  fetchSpecFeatures,
  createSpecDocument,
  deleteSpecDocument,
} from '@/src/lib/api/specs';
import { PageSkeleton } from '@/src/components/ui/Skeleton';
import type { SpecDocument, SpecFeature } from '@/src/lib/mock-data';

export default function SpecsPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [documents, setDocuments] = useState<SpecDocument[]>([]);
  const [features, setFeatures] = useState<SpecFeature[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [reverseRunning, setReverseRunning] = useState(false);
  const [reverseError, setReverseError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const [docs, featuresResult] = await Promise.all([
        fetchSpecDocuments(projectId),
        fetchSpecFeatures(projectId),
      ]);
      setDocuments(docs);
      setFeatures(featuresResult.features);
    } catch (e) {
      setError(e instanceof Error ? e.message : '데이터를 불러올 수 없습니다');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    load();
  }, [load]);

  // 문서가 없어도 Reverse IA로 추출된 기능이 있으면 빈 상태로 보지 않음
  const isEmpty = documents.length === 0 && features.length === 0;

  const handleAddDocument = () => setIsModalOpen(true);

  const handleReverseIA = async () => {
    if (reverseRunning) return;
    setReverseRunning(true);
    setReverseError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/specs/reverse-ia`, {
        method: 'POST',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 402) {
          throw new Error(
            `${data.error ?? '크레딧이 부족합니다'}${
              typeof data.remaining === 'number' ? ` (남은 크레딧: ${data.remaining})` : ''
            }`
          );
        }
        throw new Error(data.error ?? '자동 추출에 실패했습니다');
      }
      await load();
      router.refresh();
    } catch (e) {
      setReverseError(e instanceof Error ? e.message : '자동 추출에 실패했습니다');
    } finally {
      setReverseRunning(false);
    }
  };

  const handleDeleteDocument = async (id: string) => {
    try {
      await deleteSpecDocument(projectId, id);
      await load();
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : '문서 삭제에 실패했습니다');
    }
  };

  const handleSubmitUpload = async (value: SpecUploadValue) => {
    try {
      setUploading(true);
      await createSpecDocument(projectId, {
        name: value.name,
        type: value.type,
        content: value.content,
      });
      setIsModalOpen(false);
      await load();
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : '문서 업로드에 실패했습니다');
    } finally {
      setUploading(false);
    }
  };

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
          <span className="text-[16px] font-semibold text-foreground">기획 문서</span>
        }
        rightContent={
          !isEmpty && (
            <Button variant="outline" size="sm" onClick={handleAddDocument} className="gap-1.5">
              <Plus size={14} />
              문서 추가
            </Button>
          )
        }
      />

      {isEmpty ? (
        <div className="flex-1 bg-gray-50 flex items-center justify-center">
          <div className="flex flex-col items-center text-center max-w-[480px] px-6">
            <FileText size={48} className="text-gray-300" />
            <h2 className="mt-4 text-[20px] font-semibold text-foreground">
              기획 문서를 업로드하세요.
            </h2>
            <p className="mt-3 text-[14px] text-muted-foreground">
              PRD, 기능명세서, 정보구조도 등
            </p>
            <p className="text-[14px] text-muted-foreground">
              어떤 기획 문서든 업로드할 수 있습니다.
            </p>
            <p className="text-[14px] text-muted-foreground">
              AI가 기능 목록을 자동으로 추출합니다.
            </p>
            <div className="mt-8">
              <Button variant="primary" size="lg" className="gap-2 px-7" onClick={handleAddDocument}>
                <CloudUpload size={18} />
                문서 업로드하기
              </Button>
            </div>
            <p className="mt-4 text-[12px] text-muted-foreground">.md .txt .pdf .docx 지원</p>
            <p className="text-[12px] text-muted-foreground">
              텍스트 기반 파일에서 가장 정확합니다
            </p>

            {/* Reverse IA — 코드에서 기능 자동 추출 */}
            <div className="mt-6 flex flex-col items-center gap-1">
              {reverseRunning ? (
                <span className="text-[13px] text-muted-foreground">
                  코드에서 기능을 추출하고 있습니다...
                </span>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleReverseIA}
                    className="text-[13px] text-primary hover:underline cursor-pointer"
                  >
                    또는 코드에서 기능 자동 추출
                  </button>
                  <span className="text-[12px] text-gray-400">
                    Claude API가 호출되며 1 크레딧이 차감됩니다 (30초~1분 소요)
                  </span>
                </>
              )}
              {reverseError && (
                <span className="mt-1 text-[12px] text-destructive">{reverseError}</span>
              )}
            </div>
          </div>
        </div>
      ) : (
        <MasterDetailLayout
          listWidth="420px"
          listContent={
            <div className="p-5">
              <SpecDocList documents={documents} onDelete={handleDeleteDocument} />
            </div>
          }
          detailContent={
            <div className="p-5">
              <SpecFeatureList features={features} />
            </div>
          }
        />
      )}

      <SpecUploadModal
        isOpen={isModalOpen}
        onClose={() => !uploading && setIsModalOpen(false)}
        onSubmit={handleSubmitUpload}
      />
    </>
  );
}
