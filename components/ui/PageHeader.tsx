'use client';

import { forwardRef, HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface PageHeaderProps extends HTMLAttributes<HTMLDivElement> {
  /** Page title */
  title: string;
  /** Optional subtitle/description */
  subtitle?: string;
  /** Kicker/eyebrow text above title */
  kicker?: string;
  /** Alignment */
  align?: 'left' | 'center';
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Actions slot (buttons, etc.) */
  actions?: React.ReactNode;
  /** Add gradient text effect to title */
  gradient?: boolean;
}

const titleSizeClasses = {
  sm: 'text-2xl md:text-3xl',
  md: 'text-3xl md:text-4xl lg:text-5xl',
  lg: 'text-4xl md:text-5xl lg:text-6xl',
};

const subtitleSizeClasses = {
  sm: 'text-sm md:text-base',
  md: 'text-base md:text-lg',
  lg: 'text-lg md:text-xl',
};

/**
 * PageHeader component
 * Consistent page title treatment with optional kicker, subtitle, and actions
 */
export const PageHeader = forwardRef<HTMLDivElement, PageHeaderProps>(
  (
    {
      className,
      title,
      subtitle,
      kicker,
      align = 'left',
      size = 'md',
      actions,
      gradient = false,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn('mb-8 md:mb-12', align === 'center' && 'text-center', className)}
        {...props}
      >
        <div
          className={cn(
            'flex flex-col gap-4',
            align === 'center' && 'items-center',
            actions && 'md:flex-row md:items-end md:justify-between'
          )}
        >
          <div className={cn(actions && 'md:max-w-2xl')}>
            {kicker && <span className="kicker block mb-2 md:mb-3">{kicker}</span>}

            <h1
              className={cn(
                'font-display font-bold uppercase tracking-display',
                titleSizeClasses[size],
                gradient && 'text-gradient-blaze',
                !gradient && 'text-text-primary'
              )}
            >
              {title}
            </h1>

            {subtitle && (
              <p
                className={cn(
                  'mt-3 md:mt-4 text-text-secondary max-w-2xl',
                  subtitleSizeClasses[size],
                  align === 'center' && 'mx-auto'
                )}
              >
                {subtitle}
              </p>
            )}
          </div>

          {actions && <div className="flex-shrink-0">{actions}</div>}
        </div>
      </div>
    );
  }
);

PageHeader.displayName = 'PageHeader';

export default PageHeader;
