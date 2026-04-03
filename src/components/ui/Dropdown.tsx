'use client';

import { useEffect, useRef, type ReactNode } from 'react';

export interface DropdownItem {
  icon?: ReactNode;
  label: string;
  onClick: () => void;
  variant?: 'default' | 'danger';
}

export interface DropdownProps {
  items: DropdownItem[];
  isOpen: boolean;
  onClose: () => void;
}

export function Dropdown({ items, isOpen, onClose }: DropdownProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={ref}
      className="bg-background rounded-lg shadow-lg border border-border py-1 z-50 animate-[dropdownIn_150ms_ease-out]"
      style={{ minWidth: 160 }}
    >
      {items.map((item, i) => {
        if (i > 0 && items[i - 1].variant !== item.variant) {
          return (
            <div key={`sep-${i}`}>
              <div className="h-px bg-border mx-2 my-1" />
              <DropdownRow item={item} onClose={onClose} />
            </div>
          );
        }
        return <DropdownRow key={item.label} item={item} onClose={onClose} />;
      })}
    </div>
  );
}

function DropdownRow({ item, onClose }: { item: DropdownItem; onClose: () => void }) {
  const isDanger = item.variant === 'danger';

  return (
    <button
      type="button"
      onClick={() => { item.onClick(); onClose(); }}
      className={[
        'w-full flex items-center gap-2.5 px-4 py-2.5 text-[14px] transition-colors cursor-pointer',
        isDanger
          ? 'text-destructive hover:bg-red-50'
          : 'text-foreground hover:bg-gray-50',
      ].join(' ')}
    >
      {item.icon && <span className="shrink-0 w-[14px] h-[14px] flex items-center justify-center">{item.icon}</span>}
      <span>{item.label}</span>
    </button>
  );
}
