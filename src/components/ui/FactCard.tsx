import type { ReactNode } from 'react';

export type FactCardLevel = 'critical' | 'warning' | 'info';

export interface FactCardProps {
  children: ReactNode;
  level?: FactCardLevel;
}

const levelColors: Record<FactCardLevel, string> = {
  critical: '#DC2626',
  warning: '#F97316',
  info: '#3B82F6',
};

export function FactCard({ children, level = 'info' }: FactCardProps) {
  return (
    <div
      className="bg-card rounded-xl p-4 border border-border"
      style={{ borderLeft: `3px solid ${levelColors[level]}` }}
    >
      <div className="text-[14px] text-foreground">{children}</div>
    </div>
  );
}
