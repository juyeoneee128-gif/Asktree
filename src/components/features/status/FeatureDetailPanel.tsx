'use client';

import { Check, Square, AlertTriangle, FileText, Upload } from 'lucide-react';
import { Button } from '@/src/components/ui/Button';
import type { Feature, FeatureStatus } from '@/src/lib/mock-data';

export interface FeatureDetailPanelProps {
  feature: Feature | null;
  onUploadDoc?: () => void;
}

const statusColor: Record<FeatureStatus, string> = {
  implemented: '#0F172A',
  partial: '#F97316',
  attention: '#DC2626',
  unimplemented: '#A8A29E',
};

const statusLabel: Record<FeatureStatus, string> = {
  implemented: '구현 완료',
  partial: '부분 구현',
  attention: '확인 필요',
  unimplemented: '미구현',
};

const statusIcon: Record<FeatureStatus, string> = {
  implemented: '✓',
  partial: '◐',
  attention: '!',
  unimplemented: '○',
};

export function FeatureDetailPanel({ feature, onUploadDoc }: FeatureDetailPanelProps) {
  if (!feature) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <FileText size={36} className="mx-auto text-gray-300 mb-3" />
          <p className="text-[14px] text-muted-foreground">
            왼쪽에서 기능을 선택하면 상세 내용이 표시됩니다.
          </p>
        </div>
      </div>
    );
  }

  const color = statusColor[feature.status];
  const checkedCount = feature.implementedItems.filter((i) => i.checked).length;
  const isUnimplemented = feature.status === 'unimplemented';

  return (
    <div className="flex flex-col h-full overflow-y-auto" style={{ padding: 32, gap: 20 }}>
      {/* Title row */}
      <div className="flex items-center gap-3">
        <span
          className="shrink-0 inline-flex items-center justify-center rounded-full"
          style={{
            width: 22,
            height: 22,
            backgroundColor: isUnimplemented ? 'transparent' : color,
            border: isUnimplemented ? `1.5px solid ${color}` : 'none',
            color: '#FFFFFF',
            fontSize: 13,
            fontWeight: 700,
          }}
          aria-hidden
        >
          {!isUnimplemented && statusIcon[feature.status]}
        </span>
        <h1
          className="flex items-center gap-2"
          style={{
            fontSize: 20,
            fontWeight: 700,
            color: 'var(--color-foreground)',
            letterSpacing: '-0.4px',
            lineHeight: 1.4,
          }}
        >
          {feature.name}
          <span className="text-gray-400 mx-1">—</span>
          <span style={{ color }}>{statusLabel[feature.status]}</span>
        </h1>
      </div>

      {/* Metric cards row */}
      <div className="grid grid-cols-3 gap-4">
        <MetricBox
          label="구현 항목"
          value={`${checkedCount}/${feature.totalItems || 0}`}
        />
        <MetricBox
          label="감지 이슈"
          value={`${feature.issueCount}건`}
          valueColor={feature.status === 'attention' ? '#DC2626' : undefined}
        />
        <MetricBox
          label="마지막 세션"
          value={feature.lastSession === '-' ? '—' : feature.lastSession}
          subtitle={feature.lastSession === '-' ? undefined : '2시간 전'}
        />
      </div>

      {/* Implementation items */}
      <div
        className="rounded-xl border border-border bg-card shadow-card"
        style={{ padding: 20 }}
      >
        <div className="flex items-center justify-between mb-3">
          <h3
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: 'var(--color-foreground)',
            }}
          >
            구현 항목
          </h3>
          {feature.relatedFiles.length > 0 && (
            <span style={{ fontSize: 12, color: 'var(--color-muted-foreground)' }}>
              관련 파일: {feature.relatedFiles[0]}
            </span>
          )}
        </div>

        {feature.implementedItems.length === 0 ? (
          <p className="text-[13px] text-gray-400 py-2">
            이 기능은 아직 코드에서 발견되지 않았습니다.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {feature.implementedItems.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2">
                {item.checked ? (
                  <Check size={14} className="text-foreground shrink-0" strokeWidth={3} />
                ) : (
                  <Square size={14} className="text-gray-300 shrink-0" />
                )}
                <span
                  className="flex-1"
                  style={{
                    fontSize: 13,
                    color: item.checked ? 'var(--color-foreground)' : 'var(--color-muted-foreground)',
                    textDecoration: item.checked ? 'none' : 'none',
                    lineHeight: 1.5,
                  }}
                >
                  {item.name}
                </span>
                {item.line && item.line > 0 && (
                  <span style={{ fontSize: 12, color: '#A8A29E' }}>
                    L{item.line}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Attention warning box (only for attention status) */}
      {feature.status === 'attention' && (
        <div
          className="rounded-xl"
          style={{
            backgroundColor: '#FEF2F2',
            border: '1px solid #FECACA',
            padding: 16,
          }}
        >
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle size={14} className="text-destructive" />
            <span
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: '#DC2626',
              }}
            >
              확인 필요 1건
            </span>
          </div>
          <p style={{ fontSize: 13, color: '#7F1D1D', lineHeight: 1.5 }}>
            기획서에는 수수료 계산식이 명시되어 있으나, 코드에서 일치되지 않은 부분이 있습니다.
          </p>
        </div>
      )}

      {/* Spec note */}
      <div
        className="rounded-xl border border-border bg-card shadow-card"
        style={{ padding: 16 }}
      >
        <div className="flex items-center justify-between mb-2">
          <h3
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--color-muted-foreground)',
            }}
          >
            기획서 참고
          </h3>
          {feature.status === 'unimplemented' && (
            <button
              type="button"
              onClick={onUploadDoc}
              className="inline-flex items-center gap-1 text-primary hover:underline cursor-pointer"
              style={{ fontSize: 12 }}
            >
              <Upload size={12} />
              문서 업로드
            </button>
          )}
        </div>
        {feature.prdSummary ? (
          <p
            style={{
              fontSize: 13,
              color: 'var(--color-foreground)',
              lineHeight: 1.5,
            }}
          >
            FRD 원문: {feature.prdSummary}
          </p>
        ) : (
          <p style={{ fontSize: 13, color: 'var(--color-muted-foreground)' }}>
            관련 기획서가 없습니다.
          </p>
        )}
      </div>

      {/* Tech detail row */}
      {feature.relatedFiles.length > 0 && (
        <div
          className="rounded-xl border border-border bg-card shadow-card"
          style={{ padding: 16 }}
        >
          <div className="grid grid-cols-3 gap-4">
            <TechCol label="기술 스택" value={feature.techStack} />
            <TechCol label="관련 파일" value={feature.relatedFiles.join(', ')} />
            <TechCol label="감지 시간" value="3시간 전" />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── 헬퍼 ───

function MetricBox({
  label,
  value,
  valueColor,
  subtitle,
}: {
  label: string;
  value: string;
  valueColor?: string;
  subtitle?: string;
}) {
  return (
    <div
      className="rounded-xl border border-border bg-card shadow-card flex flex-col"
      style={{ padding: 16, gap: 4 }}
    >
      <span style={{ fontSize: 12, color: '#A8A29E' }}>{label}</span>
      <span
        style={{
          fontSize: 24,
          fontWeight: 700,
          color: valueColor ?? 'var(--color-foreground)',
          lineHeight: 1.2,
        }}
      >
        {value}
      </span>
      {subtitle && (
        <span style={{ fontSize: 12, color: '#A8A29E' }}>{subtitle}</span>
      )}
    </div>
  );
}

function TechCol({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col" style={{ gap: 4 }}>
      <span style={{ fontSize: 12, color: '#A8A29E' }}>{label}</span>
      <span
        className="truncate"
        style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-foreground)' }}
      >
        {value}
      </span>
    </div>
  );
}
