'use client';

import { useState, useRef, type ReactNode } from 'react';
import { Info } from 'lucide-react';

export interface TooltipProps {
  content: string;
  children?: ReactNode;
}

export function Tooltip({ content, children }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const triggerRef = useRef<HTMLSpanElement>(null);

  const trigger = children ?? (
    <Info size={16} className="text-gray-400" />
  );

  return (
    <span
      ref={triggerRef}
      className="relative inline-flex items-center"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {trigger}

      {visible && (
        <span className="absolute top-full left-0 mt-1.5 z-50 animate-[fadeIn_150ms_ease-out]">
          {/* Arrow */}
          <span
            className="absolute -top-1 left-3 w-2 h-2 bg-gray-900 rotate-45"
          />
          {/* Body */}
          <span
            className="relative block bg-gray-900 rounded-lg px-3 py-2 text-[12px] text-white max-w-[240px] leading-relaxed"
          >
            {content}
          </span>
        </span>
      )}
    </span>
  );
}
