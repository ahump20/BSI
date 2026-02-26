'use client';

import { PercentileBar } from './PercentileBar';
import { MetricGate } from './MetricGate';

interface StatItem {
  label: string;
  value: number;
  percentile?: number;
  higherIsBetter?: boolean;
  format?: (v: number) => string;
  pro?: boolean;
}

interface AdvancedStatsCardProps {
  title: string;
  stats: StatItem[];
  isPro?: boolean;
  /** Link to full Savant profile */
  profileUrl?: string;
  className?: string;
}

const defaultFormat = (v: number) => v.toFixed(3).replace(/^0/, '');

/**
 * AdvancedStatsCard — compact card for embedding advanced stats
 * on existing pages (player detail, team overview).
 * Shows key metrics with optional percentile bars.
 */
export function AdvancedStatsCard({
  title,
  stats,
  isPro = false,
  profileUrl,
  className = '',
}: AdvancedStatsCardProps) {
  const freeStats = stats.filter(s => !s.pro);
  const proStats = stats.filter(s => s.pro);

  return (
    <div className={`bg-background-primary border border-border-subtle rounded-xl overflow-hidden ${className}`}>
      <div className="px-5 py-3 border-b border-border-subtle flex items-center justify-between">
        <h4 className="font-display text-sm uppercase tracking-wider text-text-primary">{title}</h4>
        {profileUrl && (
          <a
            href={profileUrl}
            className="text-[10px] font-mono text-burnt-orange hover:text-ember transition-colors"
          >
            Full Profile →
          </a>
        )}
      </div>

      {/* Free stats */}
      <div className="px-5 py-3 space-y-2">
        {freeStats.map(stat => (
          <div key={stat.label} className="flex items-center justify-between">
            <span className="text-[11px] text-text-muted font-mono uppercase tracking-wide">
              {stat.label}
            </span>
            <div className="flex items-center gap-3">
              {stat.percentile != null && (
                <div className="w-24 hidden sm:block">
                  <PercentileBar
                    value={stat.percentile}
                    label=""
                    higherIsBetter={stat.higherIsBetter ?? true}
                    showValue={false}
                  />
                </div>
              )}
              <span className="text-sm text-white font-mono tabular-nums">
                {(stat.format || defaultFormat)(stat.value)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Pro stats */}
      {proStats.length > 0 && (
        <MetricGate isPro={isPro} metricName="wRC+, FIP, eBA" className="border-t border-white/[0.04]">
          <div className="px-5 py-3 space-y-2">
            {proStats.map(stat => (
              <div key={stat.label} className="flex items-center justify-between">
                <span className="text-[11px] text-text-muted font-mono uppercase tracking-wide">
                  {stat.label}
                </span>
                <div className="flex items-center gap-3">
                  {stat.percentile != null && (
                    <div className="w-24 hidden sm:block">
                      <PercentileBar
                        value={stat.percentile}
                        label=""
                        higherIsBetter={stat.higherIsBetter ?? true}
                        showValue={false}
                      />
                    </div>
                  )}
                  <span className="text-sm text-white font-mono tabular-nums">
                    {(stat.format || defaultFormat)(stat.value)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </MetricGate>
      )}
    </div>
  );
}
