'use client';

import { useState } from 'react';
import { SectionHeader } from '@/src/components/layout/SectionHeader';
import { ListItem } from '@/src/components/ui/ListItem';
import type { Issue, IssueLevel } from '@/src/lib/mock-data';

export type IssueSectionStatus = 'unconfirmed' | 'confirmed' | 'resolved';

export interface IssueListSectionProps {
  title: string;
  status: IssueSectionStatus;
  issues: Issue[];
  selectedIssueId: string | null;
  onSelectIssue: (id: string) => void;
  defaultOpen?: boolean;
}

const levelToColor: Record<IssueLevel, string> = {
  critical: '#DC2626',
  warning: '#F97316',
  info: '#3B82F6',
};

const statusToListItemStatus: Record<IssueSectionStatus, 'active' | 'confirmed' | 'resolved'> = {
  unconfirmed: 'active',
  confirmed: 'confirmed',
  resolved: 'resolved',
};

const statusToText: Record<IssueSectionStatus, string> = {
  unconfirmed: '미확인',
  confirmed: '확인 완료',
  resolved: '해결됨',
};

/** "src/config.ts:12" → "config.ts" */
function getFileBaseName(file: string): string {
  const lastSlash = file.lastIndexOf('/');
  const base = lastSlash >= 0 ? file.slice(lastSlash + 1) : file;
  return base.split(':')[0];
}

export function IssueListSection({
  title,
  status,
  issues,
  selectedIssueId,
  onSelectIssue,
  defaultOpen = true,
}: IssueListSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultOpen);

  return (
    <div>
      <SectionHeader
        title={title}
        count={issues.length}
        isExpanded={isExpanded}
        onToggle={() => setIsExpanded((v) => !v)}
      />
      {isExpanded && (
        <div>
          {issues.length === 0 ? (
            <div className="px-5 py-4 text-[13px] text-gray-400 border-b border-border">
              항목 없음
            </div>
          ) : (
            issues.map((issue) => (
              <ListItem
                key={issue.id}
                title={issue.title}
                subtitle={`${getFileBaseName(issue.file)} · ${statusToText[status]}`}
                badge={
                  status === 'unconfirmed'
                    ? { label: issue.level, variant: issue.level }
                    : undefined
                }
                isSelected={selectedIssueId === issue.id}
                status={statusToListItemStatus[status]}
                accentColor={levelToColor[issue.level]}
                onClick={() => onSelectIssue(issue.id)}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}
