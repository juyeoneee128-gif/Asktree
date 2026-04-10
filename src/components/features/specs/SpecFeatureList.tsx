'use client';

import type { FeatureStatus, SpecFeature } from '@/src/lib/mock-data';

export interface SpecFeatureListProps {
  features: SpecFeature[];
}

const statusColor: Record<FeatureStatus, string> = {
  implemented: '#1E40AF',
  partial: '#C2410C',
  attention: '#DC2626',
  unimplemented: '#A8A29E',
};

export function SpecFeatureList({ features }: SpecFeatureListProps) {
  return (
    <div className="flex flex-col gap-4">
      {/* Title card */}
      <div className="bg-card rounded-xl shadow-card p-6 flex flex-col gap-2">
        <h2 className="text-[20px] font-bold text-foreground">통합 기능 목록</h2>
        <p className="text-[12px] text-muted-foreground" style={{ lineHeight: 1.5 }}>
          첨부된 모든 문서를 종합하여 AI가 추출한 기능 목록입니다.
        </p>
      </div>

      {/* Feature card */}
      <div className="bg-card rounded-xl shadow-card px-6 py-2 flex flex-col">
        {features.map((feature, i) => (
          <SpecFeatureRow
            key={feature.id}
            index={i + 1}
            feature={feature}
            isLast={i === features.length - 1}
          />
        ))}
      </div>
    </div>
  );
}

function SpecFeatureRow({
  index,
  feature,
  isLast,
}: {
  index: number;
  feature: SpecFeature;
  isLast: boolean;
}) {
  return (
    <div
      className={[
        'flex items-center gap-2 py-3',
        isLast ? '' : 'border-b border-border',
      ].join(' ')}
    >
      <span
        className="w-1.5 h-1.5 rounded-full shrink-0"
        style={{ backgroundColor: statusColor[feature.status] }}
      />
      <span className="text-[15px] text-foreground truncate">
        {index}. {feature.name}
      </span>
      <div className="flex items-center gap-1 shrink-0">
        {feature.sources.map((source) => (
          <span
            key={source}
            className="px-1.5 py-px rounded-full bg-muted text-[10px] font-medium text-gray-500"
            style={{ letterSpacing: '0.2px' }}
          >
            {source}
          </span>
        ))}
      </div>
    </div>
  );
}
