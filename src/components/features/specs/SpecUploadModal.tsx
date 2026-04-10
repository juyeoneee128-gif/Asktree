'use client';

import { useEffect, useState } from 'react';
import { CloudUpload } from 'lucide-react';
import { Modal } from '@/src/components/ui/Modal';
import type { SpecDocType } from '@/src/lib/mock-data';

export interface SpecUploadValue {
  name: string;
  type: SpecDocType;
  content: string;
}

export interface SpecUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (value: SpecUploadValue) => void;
}

export function SpecUploadModal({ isOpen, onClose, onSubmit }: SpecUploadModalProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<SpecDocType>('PRD');
  const [content, setContent] = useState('');

  useEffect(() => {
    if (isOpen) {
      setName('');
      setType('PRD');
      setContent('');
    }
  }, [isOpen]);

  const canSubmit = name.trim().length > 0 && content.trim().length > 0;

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit({ name: name.trim(), type, content: content.trim() });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="기획 문서 추가"
      icon={<CloudUpload size={20} className="text-primary" />}
      width={560}
      actions={[
        { label: '취소', variant: 'ghost', onClick: onClose },
        { label: '추가하기', variant: 'primary', onClick: handleSubmit },
      ]}
    >
      <div className="flex flex-col gap-4">
        <p className="text-[13px] text-muted-foreground leading-relaxed">
          기획서 내용을 복사해서 아래에 붙여넣으세요. AI가 기능 목록을 자동으로 추출합니다.
        </p>

        {/* Name + Type row */}
        <div className="flex gap-3">
          <div className="flex-1 flex flex-col gap-1.5">
            <label className="text-[12px] font-medium text-muted-foreground">문서명</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: Asktree_PRD_v6.0.md"
              className="w-full h-10 px-3 rounded-lg border border-border bg-background text-[14px] text-foreground focus:outline-none focus:border-primary"
            />
          </div>
          <div className="flex flex-col gap-1.5" style={{ width: 120 }}>
            <label className="text-[12px] font-medium text-muted-foreground">유형</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as SpecDocType)}
              className="w-full h-10 px-3 rounded-lg border border-border bg-background text-[14px] text-foreground focus:outline-none focus:border-primary cursor-pointer"
            >
              <option value="PRD">PRD</option>
              <option value="FRD">FRD</option>
            </select>
          </div>
        </div>

        {/* Content textarea */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[12px] font-medium text-muted-foreground">본문 내용</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="문서 본문을 여기에 붙여넣으세요..."
            rows={10}
            className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-[13px] text-foreground focus:outline-none focus:border-primary resize-none"
            style={{ fontFamily: 'var(--font-mono)', lineHeight: 1.6 }}
          />
        </div>
      </div>
    </Modal>
  );
}
