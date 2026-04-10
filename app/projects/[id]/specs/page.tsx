'use client';

import { useState } from 'react';
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
  mockSpecDocuments,
  mockSpecFeatures,
  type SpecDocument,
  type SpecFeature,
} from '@/src/lib/mock-data';

export default function SpecsPage() {
  const [documents, setDocuments] = useState<SpecDocument[]>(mockSpecDocuments);
  const [features, setFeatures] = useState<SpecFeature[]>(mockSpecFeatures);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const isEmpty = documents.length === 0;

  const handleAddDocument = () => setIsModalOpen(true);

  const handleDeleteDocument = (id: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id));
    // 문서가 모두 사라지면 추출된 기능도 비웁니다 (MVP 단순화).
    if (documents.length <= 1) setFeatures([]);
  };

  const handleSubmitUpload = (value: SpecUploadValue) => {
    const today = new Date()
      .toISOString()
      .slice(0, 10)
      .replace(/-/g, '.');

    const newDoc: SpecDocument = {
      id: `doc-${Date.now()}`,
      name: value.name,
      type: value.type,
      uploadedAt: today,
    };
    setDocuments((prev) => [...prev, newDoc]);
    // MVP: 문서가 처음 추가될 때 모의 추출 결과 복원
    if (features.length === 0) setFeatures(mockSpecFeatures);

    setIsModalOpen(false);
  };

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
            <p className="text-[12px] text-muted-foreground">텍스트 기반 파일에서 가장 정확합니다</p>
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
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmitUpload}
      />
    </>
  );
}
