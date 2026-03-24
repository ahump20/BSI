'use client';

import { useSportData } from '@/lib/hooks/useSportData';
import { fmt3, fmtPct } from '@/lib/utils/format';

// ─── Types ─────────────────────────────────────────────────────────────────

interface TeamSabermetrics {
  batting: { woba: number; wrc_plus: number; k_pct: number; bb_pct: number };
  pitching: { fip: number };
  league: { woba: number; fip: number };
  meta?: { fetched_at?: string };
}

// ─── Component ─────────────────────────────────────────────────────────────

interface LiveStatsBadgeProps {
  espnId: string;
}

/**
 * Compact inline card showing current-season sabermetric stats.
 * Hides entirely if data is unavailable — no error state shown.
 */
export function LiveStatsBadge({ espnId }: LiveStatsBadgeProps) {
  const { data, loading, error } = useSportData<TeamSabermetrics>(
    `/api/college-baseball/teams/${espnId}/sabermetrics`,
    { timeout: 8000 },
  );

  // Hide completely if loading, error, or no data
  if (loading || error || !data) return null;

  const aboveAvgWoba = data.batting.woba > data.league.woba;
  const aboveAvgFip = data.pitching.fip < data.league.fip;

  const timestamp = data.meta?.fetched_at
    ? new Date(data.meta.fetched_at).toLocaleString('en-US', {
        timeZone: 'America/Chicago',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      }) + ' CT'
    : null;

  return (
    <div className="mt-6 rounded-sm bg-[var(--surface-press-box)] border border-border-subtle p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-2 h-2 rounded-full bg-[var(--bsi-primary)] animate-pulse" />
        <span className="text-[10px] uppercase tracking-wider text-text-muted font-semibold">
          Live Data
        </span>
        {timestamp && (
          <span className="text-[10px] text-text-muted ml-auto">{timestamp}</span>
        )}
      </div>
      <div className="flex flex-wrap gap-4">
        <div>
          <div
            className="font-mono text-lg font-bold"
            style={{ color: aboveAvgWoba ? 'var(--bsi-primary)' : undefined }}
          >
            {fmt3(data.batting.woba)}
          </div>
          <div className="text-text-muted text-[10px]">wOBA</div>
        </div>
        <div>
          <div
            className="font-mono text-lg font-bold"
            style={{ color: data.batting.wrc_plus >= 100 ? 'var(--bsi-primary)' : undefined }}
          >
            {Math.round(data.batting.wrc_plus)}
          </div>
          <div className="text-text-muted text-[10px]">wRC+</div>
        </div>
        <div>
          <div
            className="font-mono text-lg font-bold"
            style={{ color: aboveAvgFip ? 'var(--bsi-primary)' : undefined }}
          >
            {data.pitching.fip.toFixed(2)}
          </div>
          <div className="text-text-muted text-[10px]">FIP</div>
        </div>
        <div>
          <div className="font-mono text-lg font-bold text-text-primary">
            {fmtPct(data.batting.k_pct)}
          </div>
          <div className="text-text-muted text-[10px]">K%</div>
        </div>
        <div>
          <div className="font-mono text-lg font-bold text-text-primary">
            {fmtPct(data.batting.bb_pct)}
          </div>
          <div className="text-text-muted text-[10px]">BB%</div>
        </div>
      </div>
    </div>
  );
}
