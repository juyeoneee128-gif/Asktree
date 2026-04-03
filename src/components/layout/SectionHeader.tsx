'use client';

import { ChevronDown, ChevronRight } from 'lucide-react';

export interface SectionHeaderProps {
  title: string;
  count: number;
  isExpanded: boolean;
  onToggle: () => void;
}

export function SectionHeader({ title, count, isExpanded, onToggle }: SectionHeaderProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="w-full flex items-center gap-2 px-5 py-2 bg-gray-200 cursor-pointer hover:bg-gray-300 transition-colors"
    >
      {isExpanded ? (
        <ChevronDown size={14} className="text-muted-foreground shrink-0" />
      ) : (
        <ChevronRight size={14} className="text-muted-foreground shrink-0" />
      )}
      <span className="text-[12px] font-bold text-muted-foreground">
        {title} ({count})
      </span>
    </button>
  );
}
