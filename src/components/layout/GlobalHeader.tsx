import type { ReactNode } from 'react';

export interface GlobalHeaderProps {
  leftContent?: ReactNode;
  rightContent?: ReactNode;
}

export function GlobalHeader({ leftContent, rightContent }: GlobalHeaderProps) {
  return (
    <header className="flex items-center justify-between h-[56px] px-6 bg-muted border-b border-border shrink-0">
      <div className="flex items-center gap-3">{leftContent}</div>
      <div className="flex items-center gap-3">{rightContent}</div>
    </header>
  );
}
