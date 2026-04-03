'use client';

import { forwardRef, type InputHTMLAttributes } from 'react';

export interface InputFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
  type?: 'text' | 'password';
}

export const InputField = forwardRef<HTMLInputElement, InputFieldProps>(
  ({ label, error, type = 'text', className = '', ...props }, ref) => {
    return (
      <div className="flex flex-col">
        {label && (
          <label className="text-[13px] text-muted-foreground mb-2">{label}</label>
        )}
        <input
          ref={ref}
          type={type}
          className={[
            'px-4 py-3 border rounded-lg text-[14px] text-foreground placeholder:text-gray-300 transition-colors',
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

InputField.displayName = 'InputField';
