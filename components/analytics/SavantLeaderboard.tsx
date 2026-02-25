'use client';

import { useState, useMemo } from 'react';
import { MetricGate } from './MetricGate';
import { MetricTooltip, METRIC_DEFS } from './MetricTooltip';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ColumnDef {
  key: string;
  label: string;
  /** Metric key for tooltip lookup */
  metricKey?: string;
  /** Whether higher values are better (affects color) */
  higherIsBetter?: boolean;
  /** Format function */
  format?: (v: number) => string;
  /** Pro-only column */
  pro?: boolean;
  /** Hide on mobile */
  hideMobile?: boolean;
}

interface SavantLeaderboardProps {
  data: Record<string, unknown>[];
  columns: ColumnDef[];
  title: string;
  isPro?: boolean;
  initialRows?: number;
  onPlayerClick?: (playerId: string) => void;
  className?: string;
}

type SortDir = 'asc' | 'desc';

// ---------------------------------------------------------------------------
// Format helpers
// ---------------------------------------------------------------------------

const fmt3 = (v: number) => v.toFixed(3).replace(/^0/, '');
const fmt2 = (v: number) => v.toFixed(2);
const fmt1 = (v: number) => v.toFixed(1);
const fmtPct = (v: number) => `${(v * 100).toFixed(1)}%`;
const fmtInt = (v: number) => String(Math.round(v));

export { fmt3, fmt2, fmt1, fmtPct, fmtInt };

// ---------------------------------------------------------------------------
// Default column sets
// ---------------------------------------------------------------------------

export const BATTING_COLUMNS: ColumnDef[] = [
  { key: 'avg', label: 'AVG', format: fmt3 },
  { key: 'obp', label: 'OBP', format: fmt3 },
  { key: 'slg', label: 'SLG', format: fmt3 },
  { key: 'k_pct', label: 'K%', format: fmtPct, higherIsBetter: false },
  { key: 'bb_pct', label: 'BB%', format: fmtPct },
  { key: 'iso', label: 'ISO', metricKey: 'ISO', format: fmt3 },
  { key: 'babip', label: 'BABIP', metricKey: 'BABIP', format: fmt3, hideMobile: true },
  { key: 'woba', label: 'wOBA', metricKey: 'wOBA', format: fmt3, pro: true },
  { key: 'wrc_plus', label: 'wRC+', metricKey: 'wRC+', format: fmtInt, pro: true, hideMobile: true },
  { key: 'ops_plus', label: 'OPS+', metricKey: 'OPS+', format: fmtInt, pro: true, hideMobile: true },
];

export const PITCHING_COLUMNS: ColumnDef[] = [
  { key: 'era', label: 'ERA', format: fmt2, higherIsBetter: false },
  { key: 'whip', label: 'WHIP', format: fmt2, higherIsBetter: false },
  { key: 'k_9', label: 'K/9', format: fmt1 },
  { key: 'bb_9', label: 'BB/9', format: fmt1, higherIsBetter: false },
  { key: 'hr_9', label: 'HR/9', format: fmt1, higherIsBetter: false, hideMobile: true },
  { key: 'fip', label: 'FIP', metricKey: 'FIP', format: fmt2, higherIsBetter: false, pro: true },
  { key: 'era_minus', label: 'ERA-', metricKey: 'ERA-', format: fmtInt, higherIsBetter: false, pro: true, hideMobile: true },
  { key: 'k_bb', label: 'K/BB', metricKey: 'K/BB', format: fmt2, pro: true, hideMobile: true },
  { key: 'lob_pct', label: 'LOB%', metricKey: 'LOB%', format: fmtPct, pro: true, hideMobile: true },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SavantLeaderboard({
  data,
  columns,
  title,
  isPro = false,
  initialRows = 25,
  onPlayerClick,
  className = '',
}: SavantLeaderboardProps) {
  const [sortKey, setSortKey] = useState(columns[0]?.key || '');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [showAll, setShowAll] = useState(false);

  const sorted = useMemo(() => {
    const s = [...data].sort((a, b) => {
      const aVal = (a[sortKey] as number) ?? 0;
      const bVal = (b[sortKey] as number) ?? 0;
      return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
    });
    return showAll ? s : s.slice(0, initialRows);
  }, [data, sortKey, sortDir, showAll, initialRows]);

  function handleSort(key: string) {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  }

  return (
    <div className={`bg-[#0D0D0D] border border-white/[0.06] rounded-xl overflow-hidden ${className}`}>
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/[0.04] flex items-center justify-between">
        <h3 className="font-display text-base uppercase tracking-wider text-white">{title}</h3>
        <span className="text-[10px] font-mono text-white/20 tabular-nums">
          {data.length} player{data.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.04]">
              <th className="pl-5 pr-2 py-3 text-left">
                <span className="text-[10px] font-display uppercase tracking-widest text-white/30">#</span>
              </th>
              <th className="px-2 py-3 text-left">
                <span className="text-[10px] font-display uppercase tracking-widest text-white/30">Player</span>
              </th>
              <th className="px-2 py-3 text-left hidden sm:table-cell">
                <span className="text-[10px] font-display uppercase tracking-widest text-white/30">Team</span>
              </th>
              {columns.map(col => (
                <th
                  key={col.key}
                  className={`px-2 py-3 text-center ${col.hideMobile ? 'hidden md:table-cell' : ''}`}
                >
                  <button
                    onClick={() => handleSort(col.key)}
                    className={`flex items-center gap-1 text-[10px] font-display uppercase tracking-widest transition-colors mx-auto ${
                      sortKey === col.key ? 'text-[#BF5700]' : 'text-white/30 hover:text-white/50'
                    }`}
                  >
                    {col.metricKey && METRIC_DEFS[col.metricKey] ? (
                      <MetricTooltip
                        metric={col.metricKey}
                        description={METRIC_DEFS[col.metricKey].description}
                        context={METRIC_DEFS[col.metricKey].context}
                      >
                        {col.label}
                      </MetricTooltip>
                    ) : (
                      col.label
                    )}
                    {col.pro && !isPro && (
                      <span className="text-[7px] text-[#BF5700] ml-0.5">PRO</span>
                    )}
                    {sortKey === col.key && (
                      <span className="text-[8px]">{sortDir === 'desc' ? '\u25BC' : '\u25B2'}</span>
                    )}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((row, i) => {
              const rank = i + 1;
              const playerId = row.player_id as string;
              return (
                <tr
                  key={playerId || i}
                  onClick={() => playerId && onPlayerClick?.(playerId)}
                  className={`border-b border-white/[0.02] transition-colors ${
                    onPlayerClick ? 'cursor-pointer hover:bg-white/[0.03]' : ''
                  } ${rank <= 3 ? 'bg-[#BF5700]/[0.03]' : ''}`}
                >
                  <td className="pl-5 pr-2 py-3">
                    <span className={`text-xs font-mono tabular-nums ${
                      rank <= 3 ? 'text-[#BF5700] font-bold' : 'text-white/20'
                    }`}>
                      {rank}
                    </span>
                  </td>
                  <td className="px-2 py-3">
                    <div>
                      <span className="text-white font-medium text-sm">
                        {row.player_name as string}
                      </span>
                      {row.position && (
                        <span className="ml-1.5 text-[10px] text-white/25 uppercase">
                          {row.position as string}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-2 py-3 hidden sm:table-cell">
                    <span className="text-white/40 text-xs">{row.team as string}</span>
                  </td>
                  {columns.map(col => {
                    const val = row[col.key];
                    const isGated = col.pro && !isPro;
                    const display = val != null && !isGated
                      ? (col.format ? col.format(val as number) : String(val))
                      : '—';

                    return (
                      <td
                        key={col.key}
                        className={`px-2 py-3 text-center font-mono tabular-nums text-xs ${
                          col.hideMobile ? 'hidden md:table-cell' : ''
                        } ${isGated ? 'text-white/10' : 'text-white/60'}`}
                      >
                        {display}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Show more */}
      {!showAll && data.length > initialRows && (
        <div className="px-5 py-3 border-t border-white/[0.04] text-center">
          {isPro ? (
            <button
              onClick={() => setShowAll(true)}
              className="text-xs text-[#BF5700] hover:text-[#FF6B35] font-medium transition-colors"
            >
              Show all {data.length} players
            </button>
          ) : (
            <a
              href="/pricing"
              className="text-xs text-[#BF5700] hover:text-[#FF6B35] font-medium transition-colors"
            >
              Upgrade to Pro for full leaderboard ({data.length} players)
            </a>
          )}
        </div>
      )}
    </div>
  );
}
