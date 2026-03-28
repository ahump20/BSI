'use client';

import { PercentileBar } from './PercentileBar';
import { MetricGate } from './MetricGate';
import { MetricExplainer } from './MetricExplainer';
import { fmt3 } from '@/lib/utils/format';

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

const defaultFormat = fmt3;

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
    <div className={`bg-[var(--surface-scoreboard)] border border-[var(--border-vintage)] rounded-sm overflow-hidden ${className}`}>
      <div className="px-5 py-3 border-b border-[var(--border-vintage)] flex items-center justify-between">
        <h4 className="font-display text-sm uppercase tracking-wider text-[var(--bsi-bone)]">{title}</h4>
        {profileUrl && (
          <a
            href={profileUrl}
            className="text-[10px] font-mono text-[var(--bsi-primary)] hover:text-[var(--bsi-primary)] transition-colors"
          >
            Full Profile →
          </a>
        )}
      </div>

      {/* Free stats */}
      <div className="px-5 py-3 space-y-2">
        {freeStats.map(stat => (
          <div key={stat.label} className="flex items-center justify-between">
            <MetricExplainer metric={stat.label} className="text-[11px] text-[rgba(196,184,165,0.35)] font-mono uppercase tracking-wide">
              {stat.label}
            </MetricExplainer>
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
              <span className="text-sm text-[var(--bsi-bone)] font-mono tabular-nums">
                {(stat.format || defaultFormat)(stat.value)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Pro stats */}
      {proStats.length > 0 && (
        <MetricGate isPro={isPro} metricName="wRC+, FIP, eBA" className="border-t border-[var(--border-vintage)]">
          <div className="px-5 py-3 space-y-2">
            {proStats.map(stat => (
              <div key={stat.label} className="flex items-center justify-between">
                <MetricExplainer metric={stat.label} className="text-[11px] text-[rgba(196,184,165,0.35)] font-mono uppercase tracking-wide">
                  {stat.label}
                </MetricExplainer>
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
                  <span className="text-sm text-[var(--bsi-bone)] font-mono tabular-nums">
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
