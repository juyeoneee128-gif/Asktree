import { type AnchorHTMLAttributes, forwardRef } from 'react';

export type TextLinkVariant = 'primary' | 'destructive' | 'muted';

export interface TextLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  variant?: TextLinkVariant;
  /** 13px or 14px */
  fontSize?: 13 | 14;
}

const variantStyles: Record<TextLinkVariant, string> = {
  primary: 'text-primary hover:underline',
  destructive: 'text-destructive hover:underline',
  muted: 'text-gray-400 hover:text-muted-foreground',
};

export const TextLink = forwardRef<HTMLAnchorElement, TextLinkProps>(
  ({ variant = 'primary', fontSize = 14, className = '', children, ...props }, ref) => {
    return (
      <a
        ref={ref}
        className={[
          'inline-flex items-center no-underline font-medium cursor-pointer transition-colors duration-150',
          variantStyles[variant],
          className,
        ].join(' ')}
        style={{ fontSize: `${fontSize}px` }}
        {...props}
      >
        {children}
      </a>
    );
  }
);

TextLink.displayName = 'TextLink';
