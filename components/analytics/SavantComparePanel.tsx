'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { getPercentileColor } from './PercentileBar';
import { withAlpha } from '@/lib/utils/color';
import type { ColumnDef } from './SavantLeaderboard';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ComparePlayer {
  player_id: string;
  player_name: string;
  team: string;
  position: string;
  percentiles?: Record<string, number>;
  [key: string]: unknown;
}

interface SavantComparePanelProps {
  players: ComparePlayer[];
  columns: ColumnDef[];
  allData: Record<string, unknown>[];
  isPro: boolean;
  onRemove: (playerId: string) => void;
  onClear: () => void;
}

// Player colors for visual differentiation in comparison
const COMPARE_COLORS = [
  '#BF5700', // burnt-orange
  '#4B9CD3', // columbia-blue
  '#22D3EE', // cyan
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SavantComparePanel({
  players,
  columns,
  allData,
  isPro,
  onRemove,
  onClear,
}: SavantComparePanelProps) {
  // Compute percentiles for selected players from the full dataset
  const percentileMap = useMemo(() => {
    const map = new Map<string, Map<string, number>>();

    for (const col of columns) {
      // Extract all valid values for this column
      const allVals: number[] = [];
      for (const row of allData) {
        const v = row[col.key];
        if (v != null && typeof v === 'number' && Number.isFinite(v)) {
          allVals.push(v);
        }
      }
      allVals.sort((a, b) => a - b);
      const n = allVals.length;

      for (const player of players) {
        const val = player[col.key];
        if (val == null || typeof val !== 'number' || !Number.isFinite(val)) continue;

        const below = allVals.filter(v => v < val).length;
        const pctl = n > 1 ? Math.round((below / (n - 1)) * 100) : 50;

        if (!map.has(player.player_id)) {
          map.set(player.player_id, new Map());
        }
        map.get(player.player_id)!.set(col.key, pctl);
      }
    }

    return map;
  }, [players, columns, allData]);

  if (players.length < 2) return null;

  return (
    <div
      className="rounded-sm overflow-hidden border mb-6"
      style={{
        background: 'var(--surface-dugout, #161616)',
        borderColor: 'var(--border-vintage, rgba(140,98,57,0.3))',
      }}
    >
      {/* Header */}
      <div
        className="px-5 py-4 border-b flex items-center justify-between flex-wrap gap-3"
        style={{
          borderColor: 'var(--border-vintage, rgba(140,98,57,0.3))',
          borderTop: '2px solid var(--bsi-primary, #BF5700)',
        }}
      >
        <div className="flex items-center gap-3">
          <h3
            className="text-sm uppercase tracking-wider"
            style={{ fontFamily: 'var(--bsi-font-display)', color: 'var(--bsi-bone)' }}
          >
            Player Comparison
          </h3>
          <span className="text-[10px] font-mono tabular-nums" style={{ color: 'var(--bsi-dust)' }}>
            {players.length} player{players.length !== 1 ? 's' : ''}
          </span>
        </div>
        <button
          onClick={onClear}
          className="text-[10px] font-mono uppercase tracking-wider transition-colors cursor-pointer"
          style={{ color: 'var(--bsi-primary)' }}
        >
          Clear All
        </button>
      </div>

      {/* Player tags */}
      <div className="px-5 py-3 flex items-center gap-3 flex-wrap border-b" style={{ borderColor: 'rgba(140,98,57,0.15)' }}>
        {players.map((player, i) => (
          <div
            key={player.player_id}
            className="flex items-center gap-2 px-3 py-1.5 rounded-sm"
            style={{
              background: withAlpha(COMPARE_COLORS[i] || COMPARE_COLORS[0], 0.12),
              border: `1px solid ${withAlpha(COMPARE_COLORS[i] || COMPARE_COLORS[0], 0.3)}`,
            }}
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{ background: COMPARE_COLORS[i] || COMPARE_COLORS[0] }}
            />
            <Link
              href={`/college-baseball/savant/player/${player.player_id}`}
              className="text-xs font-medium transition-colors hover:opacity-80"
              style={{ color: COMPARE_COLORS[i] || COMPARE_COLORS[0] }}
            >
              {player.player_name}
            </Link>
            <span className="text-[10px]" style={{ color: 'var(--bsi-dust)' }}>
              {player.team}
            </span>
            <button
              onClick={() => onRemove(player.player_id)}
              className="text-[rgba(196,184,165,0.35)] hover:text-[var(--bsi-bone)] transition-colors ml-1 cursor-pointer"
              aria-label={`Remove ${player.player_name}`}
            >
              <svg viewBox="0 0 16 16" className="w-3 h-3" fill="currentColor">
                <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
              </svg>
            </button>
          </div>
        ))}
      </div>

      {/* Metric comparison bars */}
      <div className="px-5 py-4">
        {columns.map(col => {
          const isGated = col.pro && !isPro;

          // Check if at least one player has a value for this metric
          const hasValue = players.some(p => {
            const v = p[col.key];
            return v != null && typeof v === 'number' && Number.isFinite(v);
          });
          if (!hasValue) return null;

          return (
            <div key={col.key} className="mb-4 last:mb-0">
              <div className="flex items-center gap-2 mb-2">
                <span
                  className="text-[10px] uppercase tracking-widest font-mono"
                  style={{ color: 'var(--bsi-dust)' }}
                >
                  {col.label}
                </span>
                {isGated && (
                  <span className="text-[7px] font-mono uppercase px-1 py-0.5 rounded-sm"
                    style={{ background: 'rgba(191,87,0,0.15)', color: 'var(--bsi-primary)' }}>
                    PRO
                  </span>
                )}
              </div>

              {isGated ? (
                <div className="h-8 rounded-sm flex items-center justify-center"
                  style={{ background: 'rgba(140,98,57,0.06)' }}>
                  <span className="text-[10px] font-mono" style={{ color: 'var(--bsi-dust)' }}>
                    Upgrade to compare
                  </span>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {players.map((player, i) => {
                    const val = player[col.key];
                    if (val == null || typeof val !== 'number') return null;

                    const pctl = percentileMap.get(player.player_id)?.get(col.key) ?? 50;
                    const higherIsBetter = col.higherIsBetter ?? true;
                    const color = COMPARE_COLORS[i] || COMPARE_COLORS[0];
                    const pctlColor = getPercentileColor(pctl, higherIsBetter);
                    const barWidth = Math.max(3, pctl);
                    const formatted = col.format ? col.format(val) : String(val);

                    return (
                      <div key={player.player_id} className="flex items-center gap-2">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ background: color }}
                        />
                        <span className="text-[10px] font-mono w-20 truncate shrink-0" style={{ color }}>
                          {player.player_name.split(' ').pop()}
                        </span>
                        <div className="flex-1 h-[8px] rounded-full overflow-hidden relative" style={{ background: 'rgba(140,98,57,0.12)' }}>
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${barWidth}%`, backgroundColor: color, opacity: 0.8 }}
                          />
                        </div>
                        <span className="text-[11px] font-mono font-bold tabular-nums w-12 text-right shrink-0" style={{ color: pctlColor }}>
                          {formatted}
                        </span>
                        <span
                          className="text-[9px] font-mono font-bold tabular-nums w-7 text-center rounded-full py-0.5 text-white shrink-0"
                          style={{ backgroundColor: pctlColor }}
                        >
                          {Math.round(pctl)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
