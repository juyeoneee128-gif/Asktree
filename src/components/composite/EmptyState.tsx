import type { ReactNode } from 'react';
import { Button } from '../ui/Button';

export interface EmptyStateAction {
  label: string;
  onClick: () => void;
}

export interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description?: string;
  primaryAction?: EmptyStateAction;
  secondaryAction?: EmptyStateAction;
}

export function EmptyState({
  icon,
  title,
  description,
  primaryAction,
  secondaryAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-6">
      {/* Icon */}
      <div className="mb-4">{icon}</div>

      {/* Title */}
      <h3 className="text-[20px] font-semibold text-foreground">{title}</h3>

      {/* Description */}
      {description && (
        <p className="text-[14px] text-muted-foreground mt-2 max-w-[360px] leading-relaxed">
          {description}
        </p>
      )}

      {/* Primary CTA */}
      {primaryAction && (
        <div className="mt-6 w-full max-w-[240px]">
          <Button className="w-full" onClick={primaryAction.onClick}>
            {primaryAction.label}
          </Button>
        </div>
      )}

      {/* Secondary */}
      {secondaryAction && (
        <div className="mt-3 w-full max-w-[240px]">
          <Button variant="outline" className="w-full" onClick={secondaryAction.onClick}>
            {secondaryAction.label}
          </Button>
        </div>
      )}
    </div>
  );
}
