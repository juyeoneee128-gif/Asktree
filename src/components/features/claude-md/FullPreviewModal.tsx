'use client';

import { useEffect, useRef, useState } from 'react';
import { X, Copy, Check } from 'lucide-react';
import type { Guideline } from '@/src/lib/mock-data';

export interface FullPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  guidelines: Guideline[];
  /** 헤더에 보여줄 프로젝트명 (예: "ASKTREE") */
  projectName?: string;
}

export function FullPreviewModal({
  isOpen,
  onClose,
  guidelines,
  projectName = 'ASKTREE',
}: FullPreviewModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // 전체 텍스트 조합
  const fullText = [
    `# [${projectName} AI 가이드라인]`,
    '',
    ...guidelines.map((g) => `## ${g.title}\n${g.rule}`),
  ].join('\n');

  const handleCopyAll = async () => {
    await navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center animate-[fadeIn_200ms_ease-out]"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      {/* Overlay */}
      <div className="absolute inset-0" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} />

      {/* Modal */}
      <div
        className="relative rounded-xl flex flex-col animate-[scaleIn_200ms_ease-out]"
        style={{
          width: 800,
          height: 600,
          maxWidth: 'calc(100vw - 48px)',
          maxHeight: 'calc(100vh - 48px)',
          backgroundColor: '#0C0A09',
          boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
        }}
      >
        {/* Header — macOS dots + title + close */}
        <div
          className="flex items-center justify-between shrink-0"
          style={{
            padding: '16px 24px',
            backgroundColor: '#1C1917',
            borderBottom: '1px solid #292524',
            borderTopLeftRadius: 12,
            borderTopRightRadius: 12,
          }}
        >
          <div className="flex items-center gap-2">
            <span className="rounded-full" style={{ width: 10, height: 10, backgroundColor: '#FF5F57' }} />
            <span className="rounded-full" style={{ width: 10, height: 10, backgroundColor: '#FEBC2E' }} />
            <span className="rounded-full" style={{ width: 10, height: 10, backgroundColor: '#28C840' }} />
          </div>
          <span style={{ color: '#A8A29E', fontSize: 14, fontWeight: 600 }}>
            CLAUDE.md 미리보기
          </span>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer transition-colors"
            style={{ color: '#6B7280' }}
            aria-label="닫기"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body — markdown preview */}
        <div
          className="flex-1 overflow-y-auto"
          style={{ padding: 32, backgroundColor: '#0C0A09' }}
        >
          <h1
            style={{
              color: '#FFFFFF',
              fontSize: 20,
              fontWeight: 700,
              margin: 0,
            }}
          >
            # [{projectName} AI 가이드라인]
          </h1>
          <div style={{ height: 16 }} />

          {guidelines.map((g, i) => (
            <div key={g.id}>
              <h2
                style={{
                  color: '#E67D22',
                  fontSize: 16,
                  fontWeight: 600,
                  margin: 0,
                }}
              >
                ## {g.title}
              </h2>
              <pre
                className="font-mono whitespace-pre-wrap m-0"
                style={{
                  color: '#D6D3D1',
                  fontSize: 14,
                  lineHeight: 1.6,
                  marginTop: 4,
                }}
              >
                {g.rule}
              </pre>
              {i < guidelines.length - 1 && <div style={{ height: 16 }} />}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between shrink-0"
          style={{
            padding: '12px 24px',
            backgroundColor: '#1C1917',
            borderTop: '1px solid #292524',
            borderBottomLeftRadius: 12,
            borderBottomRightRadius: 12,
          }}
        >
          <span style={{ color: '#6B7280', fontSize: 12 }}>
            이 내용이 CLAUDE.md 파일에 추가됩니다
          </span>
          <button
            type="button"
            onClick={handleCopyAll}
            className="inline-flex items-center gap-2 rounded-xl cursor-pointer transition-colors"
            style={{
              padding: '8px 16px',
              backgroundColor: '#E67D22',
              color: '#FFFFFF',
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? '복사됨' : '전체 복사'}
          </button>
        </div>
      </div>
    </div>
  );
}
