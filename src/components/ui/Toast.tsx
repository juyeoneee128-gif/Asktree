'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { Check } from 'lucide-react';

export interface ToastProps {
  message: string;
  icon?: ReactNode;
  duration?: number;
  isVisible: boolean;
  onHide?: () => void;
}

export function Toast({
  message,
  icon = <Check size={14} className="text-success" />,
  duration = 3000,
  isVisible,
  onHide,
}: ToastProps) {
  const [phase, setPhase] = useState<'in' | 'visible' | 'out' | 'hidden'>('hidden');

  useEffect(() => {
    if (isVisible) {
      setPhase('in');
      const visibleTimer = setTimeout(() => setPhase('visible'), 300);
      const outTimer = setTimeout(() => setPhase('out'), duration);
      const hideTimer = setTimeout(() => {
        setPhase('hidden');
        onHide?.();
      }, duration + 300);
      return () => {
        clearTimeout(visibleTimer);
        clearTimeout(outTimer);
        clearTimeout(hideTimer);
      };
    } else {
      setPhase('hidden');
    }
  }, [isVisible, duration, onHide]);

  if (phase === 'hidden') return null;

  return (
    <div
      className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-gray-900 rounded-lg px-5 py-3 shadow-lg transition-opacity duration-300"
      style={{
        opacity: phase === 'out' ? 0 : phase === 'in' ? 0 : 1,
        animation: phase === 'in' ? 'fadeIn 300ms ease-out forwards' : undefined,
      }}
    >
      {icon}
      <span className="text-[13px] text-white whitespace-nowrap">{message}</span>
    </div>
  );
}
