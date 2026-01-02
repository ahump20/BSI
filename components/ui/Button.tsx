import { forwardRef, type ButtonHTMLAttributes, type AnchorHTMLAttributes } from 'react';
import Link from 'next/link';

type ButtonBaseProps = {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'link';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
};

type ButtonAsButton = ButtonBaseProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof ButtonBaseProps> & {
    href?: undefined;
  };

type ButtonAsLink = ButtonBaseProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof ButtonBaseProps> & {
    href: string;
  };

export type ButtonProps = ButtonAsButton | ButtonAsLink;

const variantStyles = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  ghost: 'btn-ghost',
  outline:
    'border border-burnt-orange text-burnt-orange hover:bg-burnt-orange hover:text-white transition-colors',
  link: 'text-burnt-orange hover:underline p-0',
};

const sizeStyles = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-6 py-3',
  lg: 'px-8 py-4 text-lg',
};

export const Button = forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps>(
  (props, ref) => {
    const {
      variant = 'primary',
      size = 'md',
      isLoading,
      className = '',
      children,
      ...restProps
    } = props;

    const baseClasses = variantStyles[variant];
    const sizeClasses = variant === 'link' ? '' : sizeStyles[size];
    const combinedClasses = `${baseClasses} ${sizeClasses} ${className}`.trim();

    const content = isLoading ? (
      <span className="flex items-center gap-2">
        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        Loading...
      </span>
    ) : (
      children
    );

    // If href is provided, render as Next.js Link
    if ('href' in props && props.href) {
      const { href, disabled, ...linkProps } = restProps as ButtonAsLink & { disabled?: boolean };
      return (
        <Link
          ref={ref as React.Ref<HTMLAnchorElement>}
          href={href}
          className={`${combinedClasses} inline-flex items-center justify-center ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
          aria-disabled={disabled}
          {...linkProps}
        >
          {content}
        </Link>
      );
    }

    // Otherwise render as button
    const { disabled, ...buttonProps } = restProps as ButtonAsButton;
    return (
      <button
        ref={ref as React.Ref<HTMLButtonElement>}
        className={combinedClasses}
        disabled={disabled || isLoading}
        {...buttonProps}
      >
        {content}
      </button>
    );
  }
);

Button.displayName = 'Button';
