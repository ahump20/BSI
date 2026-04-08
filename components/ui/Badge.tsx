import React, { ReactNode } from 'react';
import type { DataMetaLike } from '@/lib/utils/data-meta';
import { getDataSourceLabel, normalizeDataMeta } from '@/lib/utils/data-meta';

/** Savant percentile tier — maps to the 6-tier scale */
export type PercentileTier = 'elite' | 'great' | 'above' | 'avg' | 'below' | 'poor';

export interface BadgeProps {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'outline' | 'default' | 'info' | 'accent'
    | 'elite' | 'great' | 'above' | 'avg' | 'below' | 'poor';
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
  /* Savant percentile tiers */
  elite: 'bg-[#ef4444]/20 text-[#ef4444] border-[#ef4444]/30',
  great: 'bg-[#f97316]/20 text-[#f97316] border-[#f97316]/30',
  above: 'bg-[#eab308]/20 text-[#eab308] border-[#eab308]/30',
  avg: 'bg-[#8890a4]/20 text-[#8890a4] border-[#8890a4]/30',
  below: 'bg-[#3b82f6]/20 text-[#3b82f6] border-[#3b82f6]/30',
  poor: 'bg-[#6366f1]/20 text-[#6366f1] border-[#6366f1]/30',
};

/** Get the percentile tier for a given percentile value */
export function getPercentileTier(pct: number, higherIsBetter = true): PercentileTier {
  const effective = higherIsBetter ? pct : 100 - pct;
  if (effective >= 90) return 'elite';
  if (effective >= 75) return 'great';
  if (effective >= 60) return 'above';
  if (effective >= 40) return 'avg';
  if (effective >= 25) return 'below';
  return 'poor';
}

const sizeClasses: Record<string, string> = {
  sm: 'px-2 py-0.5 text-[10px]',
  md: 'px-3 py-1 text-xs',
};

export function Badge({ children, variant = 'primary', size = 'md', style, className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-sm font-semibold border ${sizeClasses[size] ?? sizeClasses.md} ${variantClasses[variant] ?? variantClasses.secondary} ${className}`}
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
      <span className="w-2 h-2 bg-bsi-primary rounded-full animate-pulse mr-1.5" />
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
  source?: string;
  timestamp?: string;
  meta?: DataMetaLike | null;
  className?: string;
}

export function DataSourceBadge({ source, timestamp, meta, className = '' }: DataSourceBadgeProps) {
  const normalized = normalizeDataMeta(meta, {
    source,
    lastUpdated: timestamp,
  });
  const effectiveSource = getDataSourceLabel(normalized, source ?? 'Blaze Sports Intel');
  const effectiveTimestamp = normalized?.lastUpdated ?? timestamp;

  return (
    <div className={`flex items-center gap-2 text-xs text-text-muted ${className}`} suppressHydrationWarning>
      <span className="font-medium">{effectiveSource}</span>
      {effectiveTimestamp && (
        <>
          <span>|</span>
          <span suppressHydrationWarning>{effectiveTimestamp}</span>
        </>
      )}
    </div>
  );
}
