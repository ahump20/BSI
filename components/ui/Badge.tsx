'use client';

import type { HTMLAttributes } from 'react';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'success' | 'warning' | 'error' | 'info' | 'neutral';
  size?: 'sm' | 'md';
}

const variantStyles = {
  primary: 'bg-burnt-orange/20 text-burnt-orange',
  success: 'bg-success/20 text-success',
  warning: 'bg-warning/20 text-warning',
  error: 'bg-error/20 text-error',
  info: 'bg-info/20 text-info',
  neutral: 'bg-white/10 text-white/70',
};

const sizeStyles = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-0.5 text-sm',
};

export function Badge({
  variant = 'primary',
  size = 'sm',
  className = '',
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}

// Live Badge with pulsing indicator
export function LiveBadge({ className = '' }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-success/20 text-success ${className}`}
    >
      <span className="w-1.5 h-1.5 bg-success rounded-full animate-pulse" />
      LIVE
    </span>
  );
}

// Status Badge for game states
export type GameStatus = 'scheduled' | 'live' | 'final' | 'delayed' | 'postponed';

export function GameStatusBadge({
  status,
  className = '',
}: {
  status: GameStatus;
  className?: string;
}) {
  const statusConfig = {
    scheduled: { label: 'Scheduled', variant: 'neutral' as const },
    live: { label: 'LIVE', variant: 'success' as const },
    final: { label: 'Final', variant: 'neutral' as const },
    delayed: { label: 'Delayed', variant: 'warning' as const },
    postponed: { label: 'Postponed', variant: 'error' as const },
  };

  const config = statusConfig[status];

  if (status === 'live') {
    return <LiveBadge className={className} />;
  }

  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  );
}

// Data Source Badge
export function DataSourceBadge({
  source,
  timestamp,
  className = '',
}: {
  source: string;
  timestamp?: string;
  className?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs text-white/50 ${className}`}>
      <span>Source: {source}</span>
      {timestamp && (
        <>
          <span>"</span>
          <span>Updated: {timestamp}</span>
        </>
      )}
    </span>
  );
}
