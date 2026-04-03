'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';

export interface ModalAction {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'outline' | 'ghost' | 'destructive';
}

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  actions?: ModalAction[];
  width?: number;
}

const actionVariantStyles: Record<string, string> = {
  primary: 'bg-primary text-primary-foreground hover:bg-primary-hover active:bg-primary-active',
  outline: 'border border-border text-foreground hover:bg-muted active:bg-gray-200',
  ghost: 'text-muted-foreground hover:bg-muted active:bg-gray-200',
  destructive: 'bg-destructive text-white hover:bg-destructive-hover active:bg-destructive-active',
};

export function Modal({
  isOpen,
  onClose,
  title,
  icon,
  children,
  actions,
  width = 480,
}: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center animate-[fadeIn_200ms_ease-out]"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Modal */}
      <div
        className="relative bg-background rounded-2xl shadow-xl p-8 animate-[scaleIn_200ms_ease-out]"
        style={{ width, maxWidth: 'calc(100vw - 48px)', maxHeight: 'calc(100vh - 48px)' }}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-foreground transition-colors cursor-pointer"
        >
          <X size={20} />
        </button>

        {/* Title */}
        <div className="flex items-center gap-2 mb-6">
          {icon && <span className="shrink-0">{icon}</span>}
          <h2 className="text-[20px] font-bold text-foreground">{title}</h2>
        </div>

        {/* Body */}
        <div className="overflow-y-auto">{children}</div>

        {/* Actions */}
        {actions && actions.length > 0 && (
          <div className="flex justify-end gap-3 mt-6">
            {actions.map((action) => (
              <button
                key={action.label}
                type="button"
                onClick={action.onClick}
                className={[
                  'px-4 py-2.5 text-[14px] font-semibold rounded-lg transition-colors cursor-pointer',
                  actionVariantStyles[action.variant ?? 'primary'],
                ].join(' ')}
              >
                {action.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
