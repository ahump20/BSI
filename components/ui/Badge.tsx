import React, { ReactNode } from 'react';

export interface BadgeProps {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'outline' | 'default' | 'info' | 'accent';
  size?: 'sm' | 'md';
  style?: React.CSSProperties;
  className?: string;
}

const variantClasses: Record<string, string> = {
  primary: 'bg-burnt-orange/20 text-burnt-orange border-burnt-orange/30',
  secondary: 'bg-surface text-text-secondary border-border-strong',
  success: 'bg-success/20 text-success-light border-success/30',
  warning: 'bg-warning/20 text-warning-light border-warning/30',
  error: 'bg-error/20 text-error-light border-error/30',
  outline: 'bg-transparent text-text-secondary border-border-strong',
  default: 'bg-surface text-text-secondary border-border-strong',
  info: 'bg-info/20 text-info-light border-info/30',
  accent: 'bg-burnt-orange/20 text-ember border-burnt-orange/30',
};

const sizeClasses: Record<string, string> = {
  sm: 'px-2 py-0.5 text-[10px]',
  md: 'px-3 py-1 text-xs',
};

export function Badge({ children, variant = 'primary', size = 'md', style, className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full font-semibold border ${sizeClasses[size] ?? sizeClasses.md} ${variantClasses[variant] ?? variantClasses.secondary} ${className}`}
      style={style}
    >
      {children}
    </span>
  );
}

// Re-export FreshnessBadge so existing `import { FreshnessBadge } from './Badge'` works
export { FreshnessBadge } from './FreshnessBadge';

/**
 * @deprecated Use `FreshnessBadge` instead — it shows honest data freshness.
 * Kept for backwards compat; renders a static "LIVE" badge with no data awareness.
 */
export function LiveBadge({ className = '' }: { className?: string }) {
  return (
    <Badge variant="success" className={className}>
      <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse mr-1.5" />
      LIVE
    </Badge>
  );
}

export type GameStatus = 'scheduled' | 'live' | 'final' | 'postponed' | 'cancelled' | 'canceled' | 'delayed';

const statusConfig: Record<GameStatus, { label: string; variant: BadgeProps['variant'] }> = {
  scheduled: { label: 'Scheduled', variant: 'secondary' },
  live: { label: 'LIVE', variant: 'success' },
  final: { label: 'Final', variant: 'default' },
  postponed: { label: 'PPD', variant: 'warning' },
  cancelled: { label: 'Cancelled', variant: 'error' },
  canceled: { label: 'Cancelled', variant: 'error' },
  delayed: { label: 'Delayed', variant: 'warning' },
};

export function GameStatusBadge({ status, className = '' }: { status: GameStatus; className?: string }) {
  const config = statusConfig[status] ?? statusConfig.scheduled;
  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  );
}

interface DataSourceBadgeProps {
  source: string;
  timestamp?: string;
  className?: string;
}

export function DataSourceBadge({ source, timestamp, className = '' }: DataSourceBadgeProps) {
  return (
    <div className={`flex items-center gap-2 text-xs text-text-muted ${className}`}>
      <span className="font-medium">{source}</span>
      {timestamp && (
        <>
          <span>|</span>
          <span>{timestamp}</span>
        </>
      )}
    </div>
  );
}
