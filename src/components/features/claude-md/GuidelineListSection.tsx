'use client';

import { useState } from 'react';
import { SectionHeader } from '@/src/components/layout/SectionHeader';
import { ListItem } from '@/src/components/ui/ListItem';
import type { Guideline, Issue, IssueLevel } from '@/src/lib/mock-data';

export type GuidelineSectionStatus = 'unapplied' | 'applied';

export interface GuidelineListSectionProps {
  title: string;
  status: GuidelineSectionStatus;
  guidelines: Guideline[];
  /** 가이드라인의 sourceIssueId로 매칭되는 이슈 정보 (배지 컬러 등에 사용) */
  issuesById: Record<string, Issue | undefined>;
  selectedGuidelineId: string | null;
  onSelectGuideline: (id: string) => void;
  defaultOpen?: boolean;
}

const levelToColor: Record<IssueLevel, string> = {
  critical: '#DC2626',
  warning: '#F97316',
  info: '#3B82F6',
};

export function GuidelineListSection({
  title,
  status,
  guidelines,
  issuesById,
  selectedGuidelineId,
  onSelectGuideline,
  defaultOpen = true,
}: GuidelineListSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultOpen);

  return (
    <div>
      <SectionHeader
        title={title}
        count={guidelines.length}
        isExpanded={isExpanded}
        onToggle={() => setIsExpanded((v) => !v)}
      />
      {isExpanded && (
        <div>
          {guidelines.length === 0 ? (
            <div className="px-5 py-4 text-[13px] text-gray-400 border-b border-border">
              항목 없음
            </div>
          ) : (
            guidelines.map((guideline) => {
              const sourceIssue = issuesById[guideline.sourceIssueId];
              const level = sourceIssue?.level ?? 'info';
              const sessionLabel =
                status === 'unapplied'
                  ? `${guideline.detectedAt}에 감지`
                  : `${guideline.detectedAt}에 감지 · CLAUDE.md 적용 완료`;

              return (
                <ListItem
                  key={guideline.id}
                  title={guideline.title}
                  subtitle={sessionLabel}
                  badge={
                    status === 'unapplied'
                      ? { label: level, variant: level }
                      : undefined
                  }
                  isSelected={selectedGuidelineId === guideline.id}
                  status={status === 'applied' ? 'confirmed' : 'active'}
                  accentColor={levelToColor[level]}
                  onClick={() => onSelectGuideline(guideline.id)}
                />
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

