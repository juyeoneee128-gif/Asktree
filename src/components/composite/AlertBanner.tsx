'use client';

import { X, AlertTriangle, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';

export type AlertBannerVariant = 'warning' | 'error';

export interface AlertBannerAction {
  label: string;
  onClick: () => void;
}

export interface AlertBannerProps {
  variant?: AlertBannerVariant;
  message: string;
  action?: AlertBannerAction;
  onClose?: () => void;
}

const variantStyles: Record<AlertBannerVariant, { bg: string; icon: typeof AlertTriangle }> = {
  warning: { bg: 'bg-orange-50', icon: AlertTriangle },
  error: { bg: 'bg-red-50', icon: AlertCircle },
};

export function AlertBanner({ variant = 'warning', message, action, onClose }: AlertBannerProps) {
  const config = variantStyles[variant];
  const Icon = config.icon;

  return (
    <div className={['w-full flex items-center gap-3 px-6 py-3', config.bg].join(' ')}>
      <Icon size={16} className={variant === 'error' ? 'text-destructive shrink-0' : 'text-warning-orange shrink-0'} />
      <span className="text-[14px] text-foreground flex-1">{message}</span>
      {action && (
        <Button size="sm" variant={variant === 'error' ? 'destructive' : 'primary'} onClick={action.onClick}>
          {action.label}
        </Button>
      )}
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="text-gray-400 hover:text-foreground transition-colors cursor-pointer shrink-0"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}
