import type { HTMLAttributes, ReactNode } from 'react';

export type CardVariant = 'default' | 'danger';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  padding?: string;
  hasBorder?: boolean;
  variant?: CardVariant;
}

export function Card({
  children,
  padding = '20px',
  hasBorder = true,
  variant = 'default',
  className = '',
  ...props
}: CardProps) {
  return (
    <div
      className={[
        'bg-card rounded-xl shadow-card transition-shadow hover:shadow-card-hover',
        hasBorder
          ? variant === 'danger'
            ? 'border border-red-300'
            : 'border border-border'
          : '',
        className,
      ].join(' ')}
      style={{ padding }}
      {...props}
    >
      {children}
    </div>
  );
}
