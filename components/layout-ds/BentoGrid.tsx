'use client';

/**
 * BentoGrid - Modern dashboard-style modular grid layout
 *
 * Inspired by Apple's bento box design pattern.
 * Provides flexible, responsive grid layouts for data dashboards.
 *
 * Usage:
 *   <BentoGrid>
 *     <BentoCard size="1x1" title="Stat">...</BentoCard>
 *     <BentoCard size="2x1" title="Chart">...</BentoCard>
 *     <BentoCard size="2x2" featured>...</BentoCard>
 *   </BentoGrid>
 */

import { type ReactNode, type JSX } from 'react';
import { cn } from '@/lib/utils';

// ============================================================================
// BentoGrid Container
// ============================================================================

export interface BentoGridProps {
  /** Grid items */
  children: ReactNode;
  /** Number of columns (defaults to 4) */
  columns?: 2 | 3 | 4;
  /** Gap between items */
  gap?: 'sm' | 'md' | 'lg';
  /** Additional className */
  className?: string;
}

const columnClasses = {
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
};

const gapClasses = {
  sm: 'gap-3',
  md: 'gap-4',
  lg: 'gap-6',
};

export function BentoGrid({ children, columns = 4, gap = 'md', className }: BentoGridProps) {
  return (
    <div className={cn('grid w-full', columnClasses[columns], gapClasses[gap], className)}>
      {children}
    </div>
  );
}

// ============================================================================
// BentoCard Component
// ============================================================================

export type BentoCardSize = '1x1' | '2x1' | '1x2' | '2x2';

export interface BentoCardProps {
  /** Card content */
  children: ReactNode;
  /** Size variant */
  size?: BentoCardSize;
  /** Card title */
  title?: string;
  /** Card subtitle */
  subtitle?: string;
  /** Icon element */
  icon?: ReactNode;
  /** Featured styling (larger title, gradient background) */
  featured?: boolean;
  /** Make card interactive (hover effects) */
  interactive?: boolean;
  /** Click handler */
  onClick?: () => void;
  /** Additional className */
  className?: string;
}

const sizeClasses: Record<BentoCardSize, string> = {
  '1x1': 'col-span-1 row-span-1 min-h-[180px]',
  '2x1': 'col-span-1 sm:col-span-2 row-span-1 min-h-[180px]',
  '1x2': 'col-span-1 row-span-1 sm:row-span-2 min-h-[180px] sm:min-h-[380px]',
  '2x2': 'col-span-1 sm:col-span-2 row-span-1 sm:row-span-2 min-h-[180px] sm:min-h-[380px]',
};

export function BentoCard({
  children,
  size = '1x1',
  title,
  subtitle,
  icon,
  featured = false,
  interactive = false,
  onClick,
  className,
}: BentoCardProps) {
  const Component = onClick ? 'button' : 'div';

  return (
    <Component
      onClick={onClick}
      className={cn(
        // Base styles
        'relative overflow-hidden rounded-2xl p-5',
        'bg-white/[0.08] backdrop-blur-xl',
        'border border-white/[0.15]',
        // Size
        sizeClasses[size],
        // Featured variant
        featured && [
          'bg-gradient-to-br from-white/[0.12] to-white/[0.08]',
          'border-burnt-orange/25',
        ],
        // Interactive styles
        (interactive || onClick) && [
          'cursor-pointer',
          'transition-all duration-300 ease-out',
          'hover:translate-y-[-4px] hover:scale-[1.01]',
          'hover:shadow-xl hover:shadow-burnt-orange/10',
          'hover:border-burnt-orange',
          // Glow effect on hover
          'before:absolute before:inset-0',
          'before:bg-gradient-radial before:from-burnt-orange/20 before:to-transparent',
          'before:opacity-0 before:transition-opacity before:duration-300',
          'hover:before:opacity-50',
          // Click feedback
          'active:scale-[0.99] active:translate-y-0',
        ],
        // Button reset if clickable
        onClick && 'text-left w-full',
        className
      )}
    >
      {/* Header with icon and title */}
      {(title || icon) && (
        <div className="flex items-center justify-between mb-4">
          <div>
            {title && (
              <h3 className={cn('font-semibold text-white', featured ? 'text-2xl' : 'text-lg')}>
                {title}
              </h3>
            )}
            {subtitle && <p className="text-sm text-white/55 mt-1">{subtitle}</p>}
          </div>
          {icon && (
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-burnt-orange text-white text-xl">
              {icon}
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 flex flex-col">{children}</div>
    </Component>
  );
}

// ============================================================================
// BentoStat - Specialized card for displaying statistics
// ============================================================================

export interface BentoStatProps {
  /** Stat value */
  value: string | number;
  /** Stat label */
  label: string;
  /** Delta/change indicator */
  delta?: {
    value: string | number;
    positive?: boolean;
  };
  /** Icon */
  icon?: ReactNode;
  /** Size variant */
  size?: BentoCardSize;
  /** Additional className */
  className?: string;
}

export function BentoStat({ value, label, delta, icon, size = '1x1', className }: BentoStatProps) {
  return (
    <BentoCard size={size} className={cn('text-center', className)}>
      <div className="flex flex-col items-center justify-center h-full">
        {icon && <div className="mb-3 text-burnt-orange text-2xl">{icon}</div>}
        <div className="font-mono text-4xl font-bold text-burnt-orange leading-tight">{value}</div>
        <div className="text-sm text-white/55 uppercase tracking-wider mt-2">{label}</div>
        {delta && (
          <div
            className={cn(
              'inline-flex items-center gap-1 text-sm font-medium mt-2',
              delta.positive ? 'text-green-400' : 'text-red-400'
            )}
          >
            <span>
              {delta.positive ? '+' : ''}
              {delta.value}
            </span>
          </div>
        )}
      </div>
    </BentoCard>
  );
}

// ============================================================================
// Default exports
// ============================================================================

export default BentoGrid;
