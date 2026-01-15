'use client';

import { cn } from '@/lib/utils';

export type PortalStatus = 'in_portal' | 'committed' | 'withdrawn' | 'signed';

export interface StatusBadgeProps {
  status: PortalStatus | string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'glow';
  className?: string;
}

const statusVariants = {
  in_portal: {
    bg: 'bg-warning/20',
    text: 'text-warning',
    border: 'border-warning/30',
    glow: 'shadow-[0_0_12px_rgba(245,158,11,0.25)]',
    label: 'In Portal',
  },
  committed: {
    bg: 'bg-success/20',
    text: 'text-success-light',
    border: 'border-success/30',
    glow: 'shadow-[0_0_12px_rgba(34,197,94,0.25)]',
    label: 'Committed',
  },
  signed: {
    bg: 'bg-burnt-orange/20',
    text: 'text-burnt-orange',
    border: 'border-burnt-orange/30',
    glow: 'shadow-[0_0_12px_rgba(191,87,0,0.25)]',
    label: 'Signed',
  },
  withdrawn: {
    bg: 'bg-charcoal-500/30',
    text: 'text-text-muted',
    border: 'border-white/10',
    glow: '',
    label: 'Withdrawn',
  },
};

const sizeVariants = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-xs',
  lg: 'px-3 py-1.5 text-sm',
};

export function StatusBadge({
  status,
  size = 'md',
  variant = 'default',
  className,
}: StatusBadgeProps) {
  const config = statusVariants[status as PortalStatus] || statusVariants.in_portal;

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium border',
        'transition-all duration-300',
        config.bg,
        config.text,
        config.border,
        variant === 'glow' && config.glow,
        sizeVariants[size],
        className
      )}
    >
      {/* Animated pulse dot for in_portal */}
      {status === 'in_portal' && (
        <span className="relative mr-1.5">
          <span className="absolute inset-0 rounded-full bg-burnt-orange animate-ping opacity-75" />
          <span className="relative inline-block w-1.5 h-1.5 rounded-full bg-burnt-orange" />
        </span>
      )}
      {config.label}
    </span>
  );
}
