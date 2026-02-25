'use client';

import { useState, ReactNode } from 'react';

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
        <span className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 rounded-lg bg-[#1A1A1A] border border-white/10 shadow-xl">
          <span className="block text-xs font-mono text-[#BF5700] font-bold mb-1">
            {metric}
          </span>
          <span className="block text-[11px] text-white/70 leading-relaxed">
            {description}
          </span>
          {context && (
            <span className="block text-[10px] text-white/40 mt-1.5 font-mono">
              {context}
            </span>
          )}
          {/* Arrow */}
          <span className="absolute top-full left-1/2 -translate-x-1/2 -mt-px w-0 h-0 border-x-[6px] border-x-transparent border-t-[6px] border-t-white/10" />
        </span>
      )}
    </span>
  );
}

/** Pre-built definitions for common metrics. */
export const METRIC_DEFS: Record<string, { description: string; context?: string }> = {
  wOBA: {
    description: 'Weighted On-Base Average. Values each way of reaching base by its run-production value. The single best publicly available batting metric.',
    context: 'League avg ~.320. Elite >.400',
  },
  'wRC+': {
    description: 'Weighted Runs Created Plus. Compares a hitter to league average, adjusted for park factor. 100 = average.',
    context: '100 = avg. 150 = 50% better',
  },
  'OPS+': {
    description: 'Adjusted OPS. Compares OBP + SLG to league average with park adjustment. Simpler than wRC+ but less precise.',
    context: '100 = avg. 130 = very good',
  },
  FIP: {
    description: 'Fielding Independent Pitching. Measures what a pitcher controls: strikeouts, walks, HBP, home runs. Strips out defense and luck on batted balls.',
    context: 'Scaled like ERA. League avg ~4.00',
  },
  xFIP: {
    description: 'Expected FIP. Same as FIP but replaces actual HR with expected HR based on fly ball rate. Smooths home run luck.',
    context: 'Scaled like ERA. More stable than FIP',
  },
  'ERA-': {
    description: 'ERA Minus. 100 = league average. Lower is better. Park-adjusted.',
    context: '100 = avg. 80 = 20% better',
  },
  ISO: {
    description: 'Isolated Power. SLG minus AVG. Measures raw extra-base power divorced from batting average.',
    context: 'League avg ~.150. Power hitters >.200',
  },
  BABIP: {
    description: 'Batting Average on Balls in Play. How often batted balls (excluding HR and K) become hits. Extreme values often regress.',
    context: 'League avg ~.300',
  },
  'LOB%': {
    description: 'Left On Base Percentage. How well a pitcher strands baserunners. Very high LOB% tends to regress.',
    context: 'League avg ~72%',
  },
  'K/BB': {
    description: 'Strikeout to walk ratio. Measures a pitcher\'s command and ability to miss bats while avoiding free passes.',
    context: 'Good ≥3.0. Elite ≥4.0',
  },
};
