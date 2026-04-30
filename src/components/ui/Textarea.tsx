'use client';

import { forwardRef, type TextareaHTMLAttributes } from 'react';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, rows = 6, className = '', ...props }, ref) => {
    return (
      <div className="flex flex-col">
        {label && (
          <label className="text-[13px] text-muted-foreground mb-2">{label}</label>
        )}
        <textarea
          ref={ref}
          rows={rows}
          className={[
            'px-4 py-3 border rounded-lg text-[14px] text-foreground placeholder:text-gray-300 transition-colors resize-y',
            error
              ? 'border-destructive focus:border-destructive'
              : 'border-border focus:border-primary',
            'focus:outline-none',
            className,
          ].join(' ')}
          {...props}
        />
        {error && (
          <span className="text-[12px] text-destructive mt-1.5">{error}</span>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
