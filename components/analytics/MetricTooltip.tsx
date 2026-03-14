'use client';

import { useState, ReactNode } from 'react';
import { METRIC_DEFINITIONS } from '@/lib/data/metric-definitions';

interface MetricTooltipProps {
  /** The metric abbreviation (e.g., "wOBA", "FIP") */
  metric: string;
  /** Plain-English explanation */
  description: string;
  /** What 100 means (for indexed stats) or typical range */
  context?: string;
  children: ReactNode;
  className?: string;
}

/**
 * MetricTooltip — explains what a stat means on hover/tap.
 * Mobile: tap to toggle. Desktop: hover.
 * Keeps the learning curve low for fans new to sabermetrics.
 */
export function MetricTooltip({
  metric,
  description,
  context,
  children,
  className = '',
}: MetricTooltipProps) {
  const [open, setOpen] = useState(false);

  return (
    <span
      className={`relative inline-flex items-center cursor-help ${className}`}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onClick={() => setOpen(!open)}
    >
      {children}
      {open && (
        <span className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 rounded-sm bg-background-secondary border border-border shadow-xl">
          <span className="block text-xs font-mono text-burnt-orange font-bold mb-1">
            {metric}
          </span>
          <span className="block text-[11px] text-text-secondary leading-relaxed">
            {description}
          </span>
          {context && (
            <span className="block text-[10px] text-text-muted mt-1.5 font-mono">
              {context}
            </span>
          )}
          {/* Arrow */}
          <span className="absolute top-full left-1/2 -translate-x-1/2 -mt-px w-0 h-0 border-x-[6px] border-x-transparent border-t-[6px] border-t-border" />
        </span>
      )}
    </span>
  );
}

/**
 * METRIC_DEFS — derived from the centralized metric-definitions glossary.
 * Kept as a re-export for backward compatibility with SavantLeaderboard.
 */
export const METRIC_DEFS: Record<string, { description: string; context?: string }> =
  Object.fromEntries(
    Object.entries(METRIC_DEFINITIONS).map(([key, def]) => [
      key,
      { description: def.description, context: def.context },
    ]),
  );
