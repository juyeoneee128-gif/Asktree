'use client';

import { useState } from 'react';
import { FileText, MoreVertical, Trash2 } from 'lucide-react';
import { Dropdown } from '@/src/components/ui/Dropdown';
import type { SpecDocument } from '@/src/lib/mock-data';

export interface SpecDocListProps {
  documents: SpecDocument[];
  onDelete?: (id: string) => void;
}

export function SpecDocList({ documents, onDelete }: SpecDocListProps) {
  return (
    <div className="flex flex-col gap-4">
      <p
        className="text-[14px] font-semibold text-muted-foreground"
        style={{ letterSpacing: '-0.15px', lineHeight: 1.43 }}
      >
        첨부된 문서 ({documents.length})
      </p>
      <div className="flex flex-col">
        {documents.map((doc, i) => (
          <SpecDocRow
            key={doc.id}
            document={doc}
            isLast={i === documents.length - 1}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
}

function SpecDocRow({
  document,
  isLast,
  onDelete,
}: {
  document: SpecDocument;
  isLast: boolean;
  onDelete?: (id: string) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div
      className={[
        'flex items-center justify-between gap-2 py-3',
        isLast ? '' : 'border-b border-border',
      ].join(' ')}
    >
      <div className="flex items-center gap-2 min-w-0">
        <FileText size={16} className="text-foreground shrink-0" />
        <div className="flex flex-col gap-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span
              className="px-1.5 py-px rounded-full bg-muted text-[10px] font-semibold text-gray-500 shrink-0"
              style={{ letterSpacing: '0.2px' }}
            >
              {document.type}
            </span>
            <span className="text-[14px] text-foreground truncate">{document.name}</span>
          </div>
          <span className="text-[12px] text-muted-foreground">
            {document.uploadedAt} 업로드
          </span>
        </div>
      </div>

      <div className="relative shrink-0">
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          className="p-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          aria-label="문서 메뉴 열기"
        >
          <MoreVertical size={16} />
        </button>
        {menuOpen && (
          <div className="absolute right-0 top-full mt-1 z-10">
            <Dropdown
              isOpen={menuOpen}
              onClose={() => setMenuOpen(false)}
              items={[
                {
                  icon: <Trash2 size={14} />,
                  label: '문서 삭제',
                  onClick: () => onDelete?.(document.id),
                  variant: 'danger',
                },
              ]}
            />
          </div>
        )}
      </div>
    </div>
  );
}
