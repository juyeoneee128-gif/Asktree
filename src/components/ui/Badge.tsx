import type { HTMLAttributes } from 'react';

export type BadgeVariant =
  | 'critical'
  | 'warning'
  | 'info'
  | 'implemented'
  | 'partial'
  | 'unimplemented'
  | 'attention'
  | 'sidebar';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  /** sidebar variant uses circular 20x20 style */
  children: React.ReactNode;
}

const variantStyles: Record<BadgeVariant, string> = {
  critical: 'bg-critical-bg text-critical',
  warning: 'bg-warning-orange-bg text-warning-orange',
  info: 'bg-info-blue-bg text-info-blue',
  implemented: 'bg-status-implemented-bg text-status-implemented',
  partial: 'bg-status-partial-bg text-status-partial',
  unimplemented: 'bg-status-unimplemented-bg text-status-unimplemented',
  attention: 'bg-status-attention-bg text-status-attention',
  sidebar: 'bg-muted text-muted-foreground',
};

export function Badge({ variant = 'info', className = '', children, ...props }: BadgeProps) {
  const isSidebar = variant === 'sidebar';

  return (
    <span
      className={[
        'inline-flex items-center justify-center font-semibold',
        isSidebar
          ? 'w-5 h-5 rounded-full text-[11px]'
          : 'px-2 py-0.5 rounded-full text-[12px]',
        variantStyles[variant],
        className,
      ].join(' ')}
      {...props}
    >
      {children}
    </span>
  );
}
