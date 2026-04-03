import { type ButtonHTMLAttributes, forwardRef } from 'react';

export type ButtonVariant =
  | 'primary'
  | 'outline'
  | 'ghost'
  | 'confirm'
  | 'destructive'
  | 'destructive-ghost';

export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-primary text-primary-foreground hover:bg-primary-hover active:bg-primary-active',
  outline:
    'border border-border text-foreground bg-transparent hover:bg-muted active:bg-gray-200',
  ghost:
    'bg-transparent text-muted-foreground hover:bg-muted active:bg-gray-200',
  confirm:
    'bg-gray-700 text-white hover:bg-gray-800 active:bg-gray-900',
  destructive:
    'bg-destructive text-white hover:bg-destructive-hover active:bg-destructive-active',
  'destructive-ghost':
    'border border-red-300 text-destructive bg-transparent hover:bg-red-50 active:bg-red-100',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-[13px]',
  md: 'h-10 px-4 text-[14px]',
  lg: 'h-12 px-6 text-[16px]',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', className = '', children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={[
          'inline-flex items-center justify-center font-semibold',
          'rounded-lg transition-colors duration-150',
          'cursor-pointer disabled:opacity-50 disabled:pointer-events-none',
          variantStyles[variant],
          sizeStyles[size],
          className,
        ].join(' ')}
        disabled={disabled}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
