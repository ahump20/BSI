'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { MetricTooltip, METRIC_DEFS } from './MetricTooltip';
import { getPercentileColor } from './PercentileBar';
import { withAlpha } from '@/lib/utils/color';
import { fmt3, fmt2, fmt1, fmtPct, fmtInt } from '@/lib/utils/format';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ColumnDef {
  key: string;
  label: string;
  /** Metric key for tooltip lookup */
  metricKey?: string;
  /** Whether higher values are better (affects heatmap color) */
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
  /** Compare mode: set of selected player IDs */
  compareSelected?: Set<string>;
  /** Callback when compare checkbox is toggled */
  onCompareToggle?: (playerId: string) => void;
  /** Max players that can be compared */
  maxCompare?: number;
  className?: string;
}

type SortDir = 'asc' | 'desc';

// ---------------------------------------------------------------------------
// Format helpers — re-exported so callers of SavantLeaderboard can use them
// without a separate import of lib/utils/format.
// ---------------------------------------------------------------------------

export { fmt3, fmt2, fmt1, fmtPct, fmtInt };

/**
 * Threshold-based cell background for pitching metrics.
 * Returns a subtle background color when a value crosses a notable threshold.
 */
function getThresholdBg(key: string, val: number): string | undefined {
  switch (key) {
    case 'era': return val < 2 ? 'rgba(34, 211, 238, 0.08)' : undefined;
    case 'k_9': return val >= 14 ? 'rgba(239, 68, 68, 0.08)' : undefined;
    case 'whip': return val < 0.5 ? 'rgba(34, 197, 94, 0.08)' : undefined;
    case 'k_bb': return val >= 8 ? 'rgba(34, 197, 94, 0.08)' : undefined;
    case 'fip': return val < 2 ? 'rgba(34, 211, 238, 0.08)' : val > 6 ? 'rgba(239, 68, 68, 0.06)' : undefined;
    default: return undefined;
  }
}

// ---------------------------------------------------------------------------
// Default column sets
// ---------------------------------------------------------------------------

export const BATTING_COLUMNS: ColumnDef[] = [
  { key: 'avg', label: 'AVG', format: fmt3, higherIsBetter: true },
  { key: 'obp', label: 'OBP', format: fmt3, higherIsBetter: true },
  { key: 'slg', label: 'SLG', format: fmt3, higherIsBetter: true },
  { key: 'k_pct', label: 'K%', format: fmtPct, higherIsBetter: false },
  { key: 'bb_pct', label: 'BB%', format: fmtPct, higherIsBetter: true },
  { key: 'iso', label: 'ISO', metricKey: 'ISO', format: fmt3, higherIsBetter: true },
  { key: 'babip', label: 'BABIP', metricKey: 'BABIP', format: fmt3, hideMobile: true },
  { key: 'woba', label: 'wOBA', metricKey: 'wOBA', format: fmt3, higherIsBetter: true },
  { key: 'wrc_plus', label: 'wRC+', metricKey: 'wRC+', format: fmtInt, hideMobile: true, higherIsBetter: true },
  { key: 'ops_plus', label: 'OPS+', metricKey: 'OPS+', format: fmtInt, hideMobile: true, higherIsBetter: true },
];

export const PITCHING_COLUMNS: ColumnDef[] = [
  { key: 'era', label: 'ERA', format: fmt2, higherIsBetter: false },
  { key: 'whip', label: 'WHIP', format: fmt2, higherIsBetter: false },
  { key: 'k_9', label: 'K/9', format: fmt1, higherIsBetter: true },
  { key: 'bb_9', label: 'BB/9', format: fmt1, higherIsBetter: false },
  { key: 'hr_9', label: 'HR/9', format: fmt1, higherIsBetter: false, hideMobile: true },
  { key: 'fip', label: 'FIP', metricKey: 'FIP', format: fmt2, higherIsBetter: false },
  { key: 'era_minus', label: 'ERA-', metricKey: 'ERA-', format: fmtInt, higherIsBetter: false, hideMobile: true },
  { key: 'k_bb', label: 'K/BB', metricKey: 'K/BB', format: fmt2, pro: true, hideMobile: true, higherIsBetter: true },
  { key: 'lob_pct', label: 'LOB%', metricKey: 'LOB%', format: fmtPct, pro: true, hideMobile: true, higherIsBetter: true },
];

// ---------------------------------------------------------------------------
// Percentile computation
// ---------------------------------------------------------------------------

/**
 * Build a percentile rank map for each column from the FULL dataset.
 * Returns { [columnKey]: Map<rowIndex, percentile 0-100> }.
 */
function computePercentiles(
  allData: Record<string, unknown>[],
  columns: ColumnDef[],
): Map<string, number[]> {
  const result = new Map<string, number[]>();

  for (const col of columns) {
    const values: { index: number; val: number }[] = [];
    for (let i = 0; i < allData.length; i++) {
      const v = allData[i][col.key];
      if (v != null && typeof v === 'number' && Number.isFinite(v)) {
        values.push({ index: i, val: v });
      }
    }

    // Sort ascending by value
    values.sort((a, b) => a.val - b.val);

    const pctls = new Array<number>(allData.length).fill(50);
    const n = values.length;
    for (let rank = 0; rank < n; rank++) {
      // Percentile: percentage of values below this one
      pctls[values[rank].index] = n > 1 ? (rank / (n - 1)) * 100 : 50;
    }

    result.set(col.key, pctls);
  }

  return result;
}

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
  compareSelected,
  onCompareToggle,
  maxCompare = 3,
  className = '',
}: SavantLeaderboardProps) {
  const [sortKey, setSortKey] = useState(columns[0]?.key || '');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [showAll, setShowAll] = useState(false);

  // Core metrics are free — show full leaderboard on all tiers
  const effectiveRows = initialRows;

  // Compute percentiles from FULL dataset (before sort/slice)
  const percentiles = useMemo(() => computePercentiles(data, columns), [data, columns]);

  // Build sort order — track original indices for percentile lookup
  const sortedWithIndex = useMemo(() => {
    const indexed = data.map((row, i) => ({ row, originalIndex: i }));
    indexed.sort((a, b) => {
      const aVal = (a.row[sortKey] as number) ?? 0;
      const bVal = (b.row[sortKey] as number) ?? 0;
      return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
    });
    return showAll ? indexed : indexed.slice(0, effectiveRows);
  }, [data, sortKey, sortDir, showAll, effectiveRows]);

  function handleSort(key: string) {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  }

  return (
    <div className={`bg-background-primary border border-border-subtle rounded-sm overflow-hidden ${className}`}>
      {/* Header */}
      <div className="px-5 py-4 border-b border-border-subtle flex items-center justify-between">
        <h3 className="font-display text-base uppercase tracking-wider text-text-primary">{title}</h3>
        <span className="text-[10px] font-mono text-text-muted tabular-nums">
          {data.length} player{data.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-subtle" style={{ borderTop: '2px solid var(--svt-accent, #BF5700)' }}>
              {onCompareToggle && (
                <th className="pl-3 pr-0 py-3 w-8">
                  <span className="text-[10px] font-display uppercase tracking-widest text-text-muted" title="Compare players">
                    <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 text-text-muted" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M4 8h8M8 4v8" />
                    </svg>
                  </span>
                </th>
              )}
              <th className="pl-5 pr-2 py-3 text-left">
                <span className="text-[10px] font-display uppercase tracking-widest text-text-muted">#</span>
              </th>
              <th className="px-2 py-3 text-left">
                <span className="text-[10px] font-display uppercase tracking-widest text-text-muted">Player</span>
              </th>
              <th className="px-2 py-3 text-left hidden sm:table-cell">
                <span className="text-[10px] font-display uppercase tracking-widest text-text-muted">Team</span>
              </th>
              {columns.map(col => (
                <th
                  key={col.key}
                  className={`px-1.5 py-3 text-center ${col.hideMobile ? 'hidden md:table-cell' : ''}`}
                >
                  <button
                    onClick={() => handleSort(col.key)}
                    className={`flex items-center gap-1 text-[10px] font-display uppercase tracking-widest transition-colors mx-auto cursor-pointer ${
                      sortKey === col.key ? 'text-burnt-orange' : 'text-text-muted hover:text-text-secondary'
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
                      <span className="text-[7px] text-burnt-orange ml-0.5">PRO</span>
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
            {sortedWithIndex.map(({ row, originalIndex }, i) => {
              const rank = i + 1;
              const playerId = row.player_id as string;
              const isCompareSelected = compareSelected?.has(playerId) ?? false;
              const canAddMore = !compareSelected || compareSelected.size < maxCompare;
              return (
                <tr
                  key={playerId || i}
                  onClick={() => playerId && onPlayerClick?.(playerId)}
                  className={`border-b border-border-subtle transition-colors hover:bg-surface-light/50 ${i % 2 === 1 ? 'bg-[rgba(255,255,255,0.01)]' : ''} ${
                    onPlayerClick ? 'cursor-pointer' : ''
                  } ${isCompareSelected ? '!bg-[rgba(191,87,0,0.06)]' : ''}`}
                >
                  {onCompareToggle && (
                    <td className="pl-3 pr-0 py-2.5 w-8">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (playerId && (isCompareSelected || canAddMore)) {
                            onCompareToggle(playerId);
                          }
                        }}
                        disabled={!isCompareSelected && !canAddMore}
                        className={`w-4 h-4 rounded-sm border transition-colors flex items-center justify-center cursor-pointer ${
                          isCompareSelected
                            ? 'bg-burnt-orange border-burnt-orange'
                            : canAddMore
                              ? 'border-border-subtle hover:border-burnt-orange/50'
                              : 'border-border-subtle opacity-30 cursor-not-allowed'
                        }`}
                        aria-label={isCompareSelected ? `Remove ${row.player_name} from comparison` : `Add ${row.player_name} to comparison`}
                      >
                        {isCompareSelected && (
                          <svg viewBox="0 0 16 16" className="w-2.5 h-2.5 text-white" fill="currentColor">
                            <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 0 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0z"/>
                          </svg>
                        )}
                      </button>
                    </td>
                  )}
                  <td className="pl-5 pr-2 py-2.5">
                    <span className={`text-xs font-mono tabular-nums ${
                      rank <= 3 ? 'text-burnt-orange font-bold' : 'text-text-muted'
                    }`}>
                      {rank}
                    </span>
                  </td>
                  <td className="px-2 py-2.5">
                    <div>
                      {playerId ? (
                        <Link
                          href={`/college-baseball/savant/player/${playerId}`}
                          className="text-text-primary font-medium text-sm hover:text-burnt-orange transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {row.player_name as string}
                        </Link>
                      ) : (
                        <span className="text-text-primary font-medium text-sm">
                          {row.player_name as string}
                        </span>
                      )}
                      {row.position && (row.position as string) !== 'UN' && (
                        <span className="ml-1.5 text-[10px] text-text-muted uppercase">
                          {row.position as string}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-2 py-2.5 hidden sm:table-cell">
                    <span className="text-text-muted text-xs">{row.team as string}</span>
                  </td>
                  {columns.map(col => {
                    const val = row[col.key];
                    const isGated = col.pro && !isPro;
                    const display = val != null && !isGated
                      ? (col.format ? col.format(val as number) : String(val))
                      : isGated ? null : '—';

                    // Percentile heatmap background
                    const pctlArr = percentiles.get(col.key);
                    const pctl = pctlArr ? pctlArr[originalIndex] : 50;
                    const higherIsBetter = col.higherIsBetter ?? true;
                    const showHeatmap = val != null && !isGated && col.higherIsBetter !== undefined;
                    const bgColor = showHeatmap
                      ? getPercentileColor(pctl, higherIsBetter)
                      : undefined;

                    const thresholdBg = !showHeatmap && val != null && !isGated
                      ? getThresholdBg(col.key, val as number)
                      : undefined;

                    return (
                      <td
                        key={col.key}
                        className={`px-1.5 py-2.5 text-center ${
                          col.hideMobile ? 'hidden md:table-cell' : ''
                        }`}
                      >
                        {isGated ? (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-sm">
                            <span className="font-mono tabular-nums text-xs text-text-muted/30 blur-[3px] select-none" aria-hidden="true">
                              {col.format ? col.format(col.key === 'wrc_plus' || col.key === 'ops_plus' || col.key === 'era_minus' ? 105 : col.key === 'fip' || col.key === 'era' ? 3.85 : col.key === 'k_bb' ? 2.80 : col.key === 'lob_pct' ? 0.72 : 0.320) : '0.0'}
                            </span>
                            <svg className="w-2.5 h-2.5 text-burnt-orange/60" viewBox="0 0 16 16" fill="currentColor">
                              <path d="M8 1a4 4 0 0 0-4 4v2H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V8a1 1 0 0 0-1-1h-1V5a4 4 0 0 0-4-4zm2 6H6V5a2 2 0 1 1 4 0v2z"/>
                            </svg>
                          </span>
                        ) : (
                          <span
                            className={`inline-block px-1.5 py-0.5 rounded-sm font-mono tabular-nums text-xs ${
                              showHeatmap ? 'text-white font-medium' : col.key === 'fip' ? 'text-[var(--svt-accent,_#BF5700)] font-bold' : 'text-text-secondary'
                            }`}
                            style={showHeatmap ? {
                              backgroundColor: withAlpha(bgColor, 0.13),
                              color: bgColor,
                            } : thresholdBg ? {
                              backgroundColor: thresholdBg,
                            } : undefined}
                          >
                            {display}
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>

          {/* Inline upgrade banner — shown at free-tier row boundary */}
          {!isPro && sortedWithIndex.length >= 10 && data.length > 10 && (
            <tbody>
              <tr>
                <td
                  colSpan={columns.length + 3 + (onCompareToggle ? 1 : 0)}
                  className="px-0 py-0"
                >
                  <div className="relative overflow-hidden my-1">
                    <div className="absolute inset-0 bg-gradient-to-r from-burnt-orange/5 via-burnt-orange/10 to-burnt-orange/5" />
                    <div className="relative flex items-center justify-between px-5 py-3">
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-display uppercase tracking-widest text-burnt-orange font-bold">
                          PRO
                        </span>
                        <span className="text-xs text-text-muted">
                          {data.length - 10} more players with wOBA, wRC+, FIP, ERA-
                        </span>
                      </div>
                      <a
                        href="/pricing"
                        className="text-[11px] font-mono text-burnt-orange hover:text-ember transition-colors uppercase tracking-wider font-medium"
                      >
                        Unlock Full Leaderboard
                      </a>
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          )}
        </table>
      </div>

      {/* Footer — show all button */}
      {!showAll && data.length > effectiveRows && (
        <div className="px-5 py-4 border-t border-border-subtle">
          <button
            onClick={() => setShowAll(true)}
            className="w-full text-center text-xs text-burnt-orange hover:text-ember font-medium transition-colors"
          >
            Show all {data.length} players
          </button>
        </div>
      )}
    </div>
  );
}
