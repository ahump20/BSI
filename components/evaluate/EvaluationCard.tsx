'use client';

import { PercentileBar } from '@/components/analytics/PercentileBar';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import type { EvaluationProfile, EvaluationMetric } from '@/lib/evaluate/metrics';
import { classifyTier, tierColor, getCategories, SPORT_LABELS } from '@/lib/evaluate/metrics';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function groupByCategory(metrics: EvaluationMetric[]): Map<string, EvaluationMetric[]> {
  const groups = new Map<string, EvaluationMetric[]>();
  for (const m of metrics) {
    const list = groups.get(m.category) || [];
    list.push(m);
    groups.set(m.category, list);
  }
  return groups;
}

function categoryLabel(cat: string): string {
  return cat.charAt(0).toUpperCase() + cat.slice(1);
}

// ---------------------------------------------------------------------------
// Tier Badge
// ---------------------------------------------------------------------------

function TierBadge({ tier, percentile }: { tier: string; percentile: number }) {
  const color = tierColor(tier as ReturnType<typeof classifyTier>);
  return (
    <div className="flex items-center gap-3">
      <div
        className="flex items-center justify-center w-14 h-14 rounded-sm border-2 font-display text-2xl font-bold tabular-nums"
        style={{ borderColor: color, color }}
      >
        {percentile}
      </div>
      <div>
        <p
          className="font-display text-sm uppercase tracking-wider font-bold"
         
        >
          {tier}
        </p>
        <p className="text-[11px] text-text-muted">Overall Percentile</p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface EvaluationCardProps {
  profile: EvaluationProfile;
  /** Compact mode hides some detail for comparison view */
  compact?: boolean;
  className?: string;
}

export function EvaluationCard({ profile, compact = false, className = '' }: EvaluationCardProps) {
  const { player, evaluation } = profile;
  const groups = groupByCategory(evaluation.metrics);
  const categories = getCategories(
    evaluation.metrics.map((m) => ({
      key: m.key,
      label: m.label,
      category: m.category,
      higherIsBetter: m.higherIsBetter,
      format: () => m.displayValue,
    }))
  );

  return (
    <Card padding="none" className={`overflow-hidden ${className}`}>
      {/* Header */}
      <div className="px-5 py-4 border-b border-border-subtle">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Headshot */}
            {player.headshot && (
              <div className="w-16 h-16 rounded-sm overflow-hidden bg-surface-press-box flex-shrink-0">
                <img
                  src={player.headshot}
                  alt={player.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            )}

            <div>
              <h3 className="font-display text-xl md:text-2xl font-bold uppercase tracking-wider text-text-primary">
                {player.name}
              </h3>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <Badge variant="primary" size="sm">{player.position}</Badge>
                <Badge variant="secondary" size="sm">{player.team}</Badge>
                <span className="text-[10px] font-mono text-text-muted uppercase">
                  {SPORT_LABELS[player.sport]}
                </span>
              </div>
              {!compact && player.bio && (
                <div className="flex items-center gap-3 mt-1.5 text-[11px] text-text-muted">
                  {player.bio.height && <span>{player.bio.height}</span>}
                  {player.bio.weight && <span>{player.bio.weight} lbs</span>}
                  {player.bio.age && <span>Age {player.bio.age}</span>}
                  {player.bio.experience && <span>{player.bio.experience}</span>}
                </div>
              )}
            </div>
          </div>

          <TierBadge tier={evaluation.tier} percentile={evaluation.overallPercentile} />
        </div>
      </div>

      {/* Metrics by Category */}
      <div className="px-5 py-4 space-y-5">
        {categories.map((cat) => {
          const catMetrics = groups.get(cat);
          if (!catMetrics || catMetrics.length === 0) return null;
          return (
            <div key={cat}>
              <h4 className="text-[10px] font-mono uppercase tracking-widest text-text-muted mb-2.5">
                {categoryLabel(cat)}
              </h4>
              <div className="space-y-2">
                {catMetrics.map((m) => (
                  <PercentileBar
                    key={m.key}
                    label={m.label}
                    value={m.percentile}
                    statValue={m.displayValue}
                    higherIsBetter={true} // Already inverted in the API
                  />
                ))}
              </div>
            </div>
          );
        })}

        {evaluation.metrics.length === 0 && (
          <p className="text-text-muted text-sm text-center py-4">
            No evaluation data available for this player.
          </p>
        )}
      </div>
    </Card>
  );
}
