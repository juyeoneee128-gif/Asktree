'use client';

import { Check } from 'lucide-react';
import { Badge, type BadgeVariant } from './Badge';

export type ListItemStatus = 'active' | 'confirmed' | 'resolved';

export interface ListItemProps {
  title: string;
  subtitle?: string;
  badge?: { label: string; variant: BadgeVariant };
  isSelected?: boolean;
  status?: ListItemStatus;
  /** 선택 시 좌측 세로선 컬러 (CSS color) */
  accentColor?: string;
  onClick?: () => void;
}

export function ListItem({
  title,
  subtitle,
  badge,
  isSelected = false,
  status = 'active',
  accentColor = 'var(--color-primary)',
  onClick,
}: ListItemProps) {
  const isConfirmed = status === 'confirmed';
  const isResolved = status === 'resolved';

  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'w-full text-left px-5 py-3 border-b border-border transition-colors cursor-pointer relative',
        isSelected ? 'bg-background' : 'bg-transparent hover:bg-gray-50',
      ].join(' ')}
    >
      {/* Accent bar */}
      {isSelected && (
        <div
          className="absolute left-0 top-0 bottom-0 w-[3px] rounded-r-sm"
          style={{ backgroundColor: accentColor }}
        />
      )}

      <div className="flex items-start gap-2">
        {/* Badge */}
        {badge && !isConfirmed && !isResolved && (
          <Badge variant={badge.variant} className="mt-0.5 shrink-0">{badge.label}</Badge>
        )}

        <div className="flex-1 min-w-0">
          {/* Title */}
          <div className="flex items-center gap-1.5">
            <span
              className={[
                'text-[14px] font-semibold truncate',
                isResolved
                  ? 'text-gray-400 line-through'
                  : isConfirmed
                    ? 'text-muted-foreground'
                    : 'text-foreground',
              ].join(' ')}
            >
              {title}
            </span>
          </div>

          {/* Subtitle */}
          {subtitle && (
            <span
              className={[
                'text-[12px] mt-0.5 block truncate',
                isResolved ? 'text-gray-300' : 'text-gray-400',
              ].join(' ')}
            >
              {subtitle}
            </span>
          )}
        </div>

        {/* Check icon for confirmed / resolved */}
        {(isConfirmed || isResolved) && (
          <Check
            size={16}
            className={[
              'shrink-0 mt-0.5',
              isResolved ? 'text-gray-300' : 'text-foreground',
            ].join(' ')}
          />
        )}
      </div>
    </button>
  );
}
