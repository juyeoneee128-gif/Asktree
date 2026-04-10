'use client';

import type { Feature, FeatureStatus } from '@/src/lib/mock-data';

export interface FeatureListItemProps {
  feature: Feature;
  isSelected: boolean;
  onClick: () => void;
}

const statusColor: Record<FeatureStatus, string> = {
  implemented: '#0F172A',     // 네이비
  partial: '#F97316',          // 주황
  attention: '#DC2626',        // 빨강
  unimplemented: '#A8A29E',    // 회색
};

const statusIconChar: Record<FeatureStatus, string> = {
  implemented: '✓',
  partial: '◐',
  attention: '!',
  unimplemented: '○',
};

const statusLabel: Record<FeatureStatus, string> = {
  implemented: '구현 완료',
  partial: '부분 구현',
  attention: '확인 필요',
  unimplemented: '미구현',
};

export function FeatureListItem({ feature, isSelected, onClick }: FeatureListItemProps) {
  const color = statusColor[feature.status];

  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'w-full text-left transition-colors cursor-pointer relative',
        isSelected ? 'bg-card' : 'bg-transparent hover:bg-gray-50',
      ].join(' ')}
      style={{
        padding: '16px 20px',
        borderBottom: '1px solid var(--color-border)',
      }}
    >
      {/* Left accent bar when selected */}
      {isSelected && (
        <div
          className="absolute left-0 top-0 bottom-0"
          style={{ width: 3, backgroundColor: 'var(--color-primary)' }}
        />
      )}

      <div className="flex items-center gap-3">
        {/* Status dot icon */}
        <span
          className="shrink-0 inline-flex items-center justify-center rounded-full"
          style={{
            width: 18,
            height: 18,
            backgroundColor: feature.status === 'unimplemented' ? 'transparent' : color,
            border: feature.status === 'unimplemented' ? `1.5px solid ${color}` : 'none',
            color: '#FFFFFF',
            fontSize: 11,
            fontWeight: 700,
          }}
          aria-hidden
        >
          {feature.status !== 'unimplemented' && statusIconChar[feature.status]}
        </span>

        <div className="flex-1 min-w-0">
          <div
            className="truncate"
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: color,
              lineHeight: 1.4,
            }}
          >
            {feature.name}
          </div>
          <div
            className="mt-0.5 truncate"
            style={{ fontSize: 12, color: 'var(--color-muted-foreground)' }}
          >
            {statusLabel[feature.status]}
            {feature.totalItems > 0 && ` · ${feature.implementedItems.filter((i) => i.checked).length}/${feature.totalItems}`}
          </div>
        </div>
      </div>
    </button>
  );
}
