'use client';

import { AlertCircle, Info } from 'lucide-react';
import { Badge } from '@/src/components/ui/Badge';
import { FactCard } from '@/src/components/ui/FactCard';
import { FixBox } from '@/src/components/ui/FixBox';
import { TechDetailCard } from '@/src/components/ui/TechDetailCard';
import { Button } from '@/src/components/ui/Button';
import type { Issue, IssueLevel } from '@/src/lib/mock-data';

export interface IssueDetailPanelProps {
  issue: Issue | null;
  onConfirm?: (id: string) => void;
  onResolve?: (id: string) => void;
  onCopyFix?: () => void;
}

const levelToLabel: Record<IssueLevel, string> = {
  critical: 'Critical',
  warning: 'Warning',
  info: 'Info',
};

/** "src/config.ts:12" → "config.ts" */
function getFileBaseName(file: string): string {
  const lastSlash = file.lastIndexOf('/');
  const base = lastSlash >= 0 ? file.slice(lastSlash + 1) : file;
  return base.split(':')[0];
}

export function IssueDetailPanel({
  issue,
  onConfirm,
  onResolve,
  onCopyFix,
}: IssueDetailPanelProps) {
  if (!issue) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <AlertCircle size={36} className="mx-auto text-gray-300 mb-3" />
          <p className="text-[14px] text-muted-foreground">
            왼쪽에서 이슈를 선택하면 상세 내용이 표시됩니다.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-6 py-6">
        {/* Header: Badge + Title + Subtitle + Divider */}
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant={issue.level}>{levelToLabel[issue.level]}</Badge>
            {issue.isRedetected && (
              <span
                className="inline-flex items-center px-2 py-0.5 rounded-full text-[12px] font-semibold"
                style={{ backgroundColor: '#FED7AA', color: '#9A3412' }}
              >
                재감지
              </span>
            )}
            <h1
              className="text-foreground"
              style={{
                fontSize: 22,
                fontWeight: 700,
                letterSpacing: '-0.45px',
                lineHeight: 1.4,
              }}
            >
              {issue.title}
            </h1>
          </div>
          <p
            className="text-muted-foreground"
            style={{
              fontSize: 12,
              lineHeight: 1.33,
              paddingLeft: 0,
            }}
          >
            {getFileBaseName(issue.file)}
          </p>
          <div className="h-px bg-border mt-4" />
        </div>

        {/* Fact card */}
        <div className="mb-4">
          <FactCard level={issue.level}>{issue.fact}</FactCard>
        </div>

        {/* Detail card */}
        <div className="mb-4">
          <div className="bg-card rounded-xl border border-border shadow-card p-5">
            <p
              className="text-foreground whitespace-pre-wrap"
              style={{
                fontSize: 14,
                lineHeight: 1.43,
                letterSpacing: '-0.15px',
              }}
            >
              {issue.detail}
            </p>
          </div>
        </div>

        {/* Fix box */}
        <div className="mb-4">
          <FixBox command={issue.fixCommand} onCopy={onCopyFix} />
        </div>

        {/* Tech detail */}
        <div className="mb-4">
          <TechDetailCard
            file={issue.file}
            basis={issue.basis}
            time={issue.detectedAt}
          />
        </div>

        {/* Centered guidance text */}
        <div className="flex items-center justify-center gap-1.5 mt-6">
          <Info size={14} className="text-gray-400 shrink-0" />
          <span
            className="text-gray-400"
            style={{ fontSize: 12 }}
          >
            확인 시 이 기능의 보호 규칙(CLAUDE.md) 추가를 제안합니다.
          </span>
        </div>
      </div>

      {/* Footer with small confirm button (right-aligned, per user request) */}
      <div className="border-t border-border bg-background px-6 py-3 flex items-center justify-end gap-3 shrink-0">
        {issue.status === 'unconfirmed' && (
          <Button variant="confirm" size="sm" onClick={() => onConfirm?.(issue.id)}>
            확인 완료
          </Button>
        )}
        {issue.status === 'confirmed' && (
          <Button variant="primary" size="sm" onClick={() => onResolve?.(issue.id)}>
            해결됨으로 변경
          </Button>
        )}
        {issue.status === 'resolved' && (
          <span className="text-[13px] text-gray-400">이미 해결된 이슈입니다.</span>
        )}
      </div>
    </div>
  );
}
