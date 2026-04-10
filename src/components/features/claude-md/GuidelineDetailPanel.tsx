'use client';

import { useState } from 'react';
import { Copy, Check, ShieldCheck, Trash2 } from 'lucide-react';
import { Badge } from '@/src/components/ui/Badge';
import { Button } from '@/src/components/ui/Button';
import type { Guideline, Issue, IssueLevel } from '@/src/lib/mock-data';

export interface GuidelineDetailPanelProps {
  guideline: Guideline | null;
  /** 원본 이슈 (배지 + 감지 이력 표시용) */
  sourceIssue: Issue | null;
  onCopyToClaudeMd?: (id: string) => void;
  onDelete?: (id: string) => void;
}

const levelToLabel: Record<IssueLevel, string> = {
  critical: 'Critical',
  warning: 'Warning',
  info: 'Info',
};

export function GuidelineDetailPanel({
  guideline,
  sourceIssue,
  onCopyToClaudeMd,
  onDelete,
}: GuidelineDetailPanelProps) {
  const [copied, setCopied] = useState(false);

  if (!guideline) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <ShieldCheck size={36} className="mx-auto text-gray-300 mb-3" />
          <p className="text-[14px] text-muted-foreground">
            왼쪽에서 가이드라인을 선택하면 상세 내용이 표시됩니다.
          </p>
        </div>
      </div>
    );
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(guideline.rule);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const level = sourceIssue?.level ?? 'info';

  return (
    <div className="flex flex-col h-full overflow-y-auto px-6 py-6 gap-4">
      {/* Header: Badge + Title */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Badge variant={level}>{levelToLabel[level]}</Badge>
          <h1
            className="text-foreground"
            style={{
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: '-0.45px',
              lineHeight: 1.4,
            }}
          >
            {guideline.title}
          </h1>
        </div>
        <div className="h-px bg-border" />
      </div>

      {/* Dark code block (rule) */}
      <div
        className="rounded-xl shadow-card flex flex-col gap-2.5"
        style={{ backgroundColor: '#1C1917', padding: 16 }}
      >
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 rounded-md transition-colors cursor-pointer"
            style={{
              padding: '4px 10px',
              border: '1px solid rgba(255,255,255,0.25)',
              color: '#FFFFFF',
              fontSize: 11,
              fontWeight: 500,
            }}
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            {copied ? '복사됨' : '복사'}
          </button>
        </div>
        <pre
          className="font-mono whitespace-pre-wrap break-words m-0"
          style={{
            color: '#FFFFFF',
            fontSize: 13,
            lineHeight: 1.6,
            letterSpacing: '-0.15px',
          }}
        >
          {guideline.rule}
        </pre>
      </div>

      {/* Detection history card */}
      <div
        className="rounded-xl shadow-card border border-border bg-card"
        style={{ padding: 16 }}
      >
        <h3
          className="text-foreground"
          style={{ fontSize: 12, fontWeight: 600, lineHeight: 1.33 }}
        >
          감지 이력
        </h3>
        <p
          className="text-muted-foreground mt-2"
          style={{ fontSize: 13, lineHeight: 1.4 }}
        >
          감지: {guideline.detectedAt}
        </p>
        {sourceIssue && (
          <p
            className="text-muted-foreground mt-1"
            style={{ fontSize: 13, lineHeight: 1.4 }}
          >
            원인: {sourceIssue.fact.split('.')[0]}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          className="gap-2"
          onClick={() => {
            handleCopy();
            onCopyToClaudeMd?.(guideline.id);
          }}
        >
          <Copy size={16} />
          CLAUDE.md에 복사
        </Button>
        <Button
          variant="outline"
          className="gap-2"
          onClick={() => onDelete?.(guideline.id)}
        >
          <Trash2 size={16} />
          삭제
        </Button>
      </div>
    </div>
  );
}
