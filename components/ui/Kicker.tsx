'use client';

import { forwardRef, HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

// ========================================
// Kicker Component
// ========================================

export interface KickerProps extends HTMLAttributes<HTMLSpanElement> {
  /** Color variant */
  variant?: 'default' | 'muted' | 'white';
  /** Size variant */
  size?: 'sm' | 'md';
}

const kickerVariantClasses = {
  default: 'text-burnt-orange',
  muted: 'text-text-tertiary',
  white: 'text-text-primary',
};

const kickerSizeClasses = {
  sm: 'text-[10px] tracking-[0.2em]',
  md: 'text-xs tracking-[0.15em]',
};

/**
 * Kicker component
 * Small eyebrow/label text typically used above headlines
 */
export const Kicker = forwardRef<HTMLSpanElement, KickerProps>(
  ({ className, variant = 'default', size = 'md', ...props }, ref) => (
    <span
      ref={ref}
      className={cn(
        'inline-block font-semibold uppercase',
        kickerVariantClasses[variant],
        kickerSizeClasses[size],
        className
      )}
      {...props}
    />
  )
);

Kicker.displayName = 'Kicker';

// ========================================
// Divider Component
// ========================================

export interface DividerProps extends HTMLAttributes<HTMLDivElement> {
  /** Visual variant */
  variant?: 'default' | 'subtle' | 'accent' | 'gradient';
  /** Orientation */
  orientation?: 'horizontal' | 'vertical';
  /** Add spacing */
  spacing?: 'none' | 'sm' | 'md' | 'lg';
  /** Optional label in center */
  label?: string;
}

const dividerVariantClasses = {
  default: 'bg-border-default',
  subtle: 'bg-border-subtle',
  accent: 'bg-burnt-orange/30',
  gradient: 'bg-gradient-to-r from-transparent via-border-default to-transparent',
};

const spacingClasses = {
  none: '',
  sm: 'my-4',
  md: 'my-8',
  lg: 'my-12',
};

/**
 * Divider component
 * Visual separator with optional label
 */
export const Divider = forwardRef<HTMLDivElement, DividerProps>(
  ({ 
    className, 
    variant = 'default', 
    orientation = 'horizontal',
    spacing = 'md',
    label,
    ...props 
  }, ref) => {
    if (orientation === 'vertical') {
      return (
        <div
          ref={ref}
          role="separator"
          aria-orientation="vertical"
          className={cn(
            'w-px h-full min-h-[1rem]',
            dividerVariantClasses[variant],
            className
          )}
          {...props}
        />
      );
    }

    if (label) {
      return (
        <div
          ref={ref}
          role="separator"
          aria-orientation="horizontal"
          className={cn(
            'flex items-center gap-4',
            spacingClasses[spacing],
            className
          )}
          {...props}
        >
          <div className={cn('flex-1 h-px', dividerVariantClasses[variant])} />
          <span className="text-xs text-text-tertiary uppercase tracking-wider">
            {label}
          </span>
          <div className={cn('flex-1 h-px', dividerVariantClasses[variant])} />
        </div>
      );
    }

    return (
      <div
        ref={ref}
        role="separator"
        aria-orientation="horizontal"
        className={cn(
          'w-full h-px',
          dividerVariantClasses[variant],
          spacingClasses[spacing],
          className
        )}
        {...props}
      />
    );
  }
);

Divider.displayName = 'Divider';

export default { Kicker, Divider };
