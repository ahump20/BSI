'use client';

import React, { useState, useMemo } from 'react';
import { withAlpha } from '@/lib/utils/color';

interface ParkFactorRow {
  team: string;
  venue_name?: string | null;
  conference?: string | null;
  runs_factor: number;
  hits_factor?: number;
  hr_factor?: number;
  bb_factor?: number;
  so_factor?: number;
  sample_games: number;
}

interface ParkFactorTableProps {
  data: ParkFactorRow[];
  isPro?: boolean;
  className?: string;
}

type SortKey = 'runs_factor' | 'team' | 'sample_games';
type SortDir = 'asc' | 'desc';

/**
 * Thermometer color for park factor — continuous gradient.
 * Cold blue (pitcher-friendly) → neutral gray → hot red (hitter-friendly).
 */
function thermometerColor(factor: number): string {
  if (factor >= 1.20) return '#c0392b';
  if (factor >= 1.10) return '#e74c3c';
  if (factor >= 1.05) return '#d4775c';
  if (factor >= 0.95) return '#aaaaaa';
  if (factor >= 0.90) return '#5b9bd5';
  if (factor >= 0.85) return '#2980b9';
  return '#1a5276';
}

/** Map factor to a bar width (0-100%) centered on 1.0. */
function thermometerWidth(factor: number): number {
  // Scale: 0.70 → 0%, 1.00 → 50%, 1.30 → 100%
  return Math.max(5, Math.min(100, ((factor - 0.70) / 0.60) * 100));
}

function formatFactor(f: number): string {
  return f.toFixed(3);
}

export function ParkFactorTable({ data, isPro = false, className = '' }: ParkFactorTableProps) {
  const [groupByConf, setGroupByConf] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>('runs_factor');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const sorted = useMemo(() => {
    const s = [...data].sort((a, b) => {
      if (sortKey === 'team') {
        const cmp = a.team.localeCompare(b.team);
        return sortDir === 'asc' ? cmp : -cmp;
      }
      const aVal = a[sortKey] ?? 0;
      const bVal = b[sortKey] ?? 0;
      return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
    });
    if (!groupByConf) return s;
    return s.sort((a, b) => {
      const confA = a.conference || 'Unknown';
      const confB = b.conference || 'Unknown';
      return confA.localeCompare(confB) || b.runs_factor - a.runs_factor;
    });
  }, [data, groupByConf, sortKey, sortDir]);

  const displayData = isPro ? sorted : sorted.slice(0, 5);

  // Track conference headers for grouping
  let lastConf = '';

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir(key === 'team' ? 'asc' : 'desc');
    }
  }

  return (
    <div className={`bg-background-primary border border-border-subtle rounded-xl overflow-hidden ${className}`}>
      <div className="px-5 py-4 border-b border-border-subtle flex items-center justify-between">
        <h3 className="font-display text-base uppercase tracking-wider text-text-primary">Park Factors</h3>
        <button
          onClick={() => setGroupByConf(!groupByConf)}
          className="text-[10px] font-mono text-text-muted hover:text-text-muted transition-colors"
        >
          {groupByConf ? 'Sort by factor' : 'Group by conference'}
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-subtle">
              <th
                className="pl-5 pr-2 py-3 text-left cursor-pointer"
                onClick={() => handleSort('team')}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleSort('team'); } }}
                tabIndex={0}
                role="columnheader"
                aria-sort={sortKey === 'team' ? (sortDir === 'asc' ? 'ascending' : 'descending') : undefined}
              >
                <span className={`text-[10px] font-display uppercase tracking-widest ${sortKey === 'team' ? 'text-burnt-orange' : 'text-text-muted'}`}>
                  Team {sortKey === 'team' && (sortDir === 'asc' ? '▲' : '▼')}
                </span>
              </th>
              <th className="px-2 py-3 text-left hidden sm:table-cell">
                <span className="text-[10px] font-display uppercase tracking-widest text-text-muted">Venue</span>
              </th>
              <th
                className="px-2 py-3 text-center cursor-pointer"
                onClick={() => handleSort('runs_factor')}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleSort('runs_factor'); } }}
                tabIndex={0}
                role="columnheader"
                aria-sort={sortKey === 'runs_factor' ? (sortDir === 'asc' ? 'ascending' : 'descending') : undefined}
              >
                <span className={`text-[10px] font-display uppercase tracking-widest ${sortKey === 'runs_factor' ? 'text-burnt-orange' : 'text-text-muted'}`}>
                  Runs {sortKey === 'runs_factor' && (sortDir === 'asc' ? '▲' : '▼')}
                </span>
              </th>
              <th className="px-2 py-3 hidden md:table-cell">
                <span className="text-[10px] font-display uppercase tracking-widest text-text-muted">Factor</span>
              </th>
              <th
                className="px-2 py-3 text-center hidden md:table-cell cursor-pointer"
                onClick={() => handleSort('sample_games')}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleSort('sample_games'); } }}
                tabIndex={0}
                role="columnheader"
                aria-sort={sortKey === 'sample_games' ? (sortDir === 'asc' ? 'ascending' : 'descending') : undefined}
              >
                <span className={`text-[10px] font-display uppercase tracking-widest ${sortKey === 'sample_games' ? 'text-burnt-orange' : 'text-text-muted'}`}>
                  Games {sortKey === 'sample_games' && (sortDir === 'asc' ? '▲' : '▼')}
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            {displayData.map((row, i) => {
              // Conference header row when grouping
              let confHeader: React.ReactNode = null;
              if (groupByConf && row.conference && row.conference !== lastConf) {
                lastConf = row.conference;
                confHeader = (
                  <tr key={`conf-${row.conference}`} className="bg-surface-light">
                    <td colSpan={5} className="pl-5 py-2">
                      <span className="text-[10px] font-display uppercase tracking-widest text-burnt-orange">
                        {row.conference}
                      </span>
                    </td>
                  </tr>
                );
              }

              const color = thermometerColor(row.runs_factor);
              const width = thermometerWidth(row.runs_factor);

              return (
                <React.Fragment key={`${row.team}-${i}`}>{confHeader}
                <tr className="border-b border-border-subtle">
                  <td className="pl-5 pr-2 py-3">
                    <span className="text-text-primary text-sm font-medium">{row.team}</span>
                    {row.conference && !groupByConf && (
                      <span className="ml-1.5 text-[10px] text-text-muted">{row.conference}</span>
                    )}
                  </td>
                  <td className="px-2 py-3 hidden sm:table-cell">
                    <span className="text-text-muted text-xs">{row.venue_name || '—'}</span>
                  </td>
                  <td className="px-2 py-3 text-center">
                    <span
                      className="inline-block px-1.5 py-0.5 rounded font-mono text-xs font-bold tabular-nums"
                      style={{ color, backgroundColor: withAlpha(color, 0.13) }}
                    >
                      {formatFactor(row.runs_factor)}
                    </span>
                  </td>
                  {/* Thermometer bar */}
                  <td className="px-2 py-3 hidden md:table-cell">
                    <div className="w-full h-[6px] rounded-full bg-surface-light overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${width}%`, backgroundColor: color }}
                      />
                    </div>
                  </td>
                  <td className="px-2 py-3 text-center hidden md:table-cell">
                    <span className="text-text-muted text-xs font-mono">{row.sample_games}</span>
                  </td>
                </tr></React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {!isPro && data.length > 5 && (
        <div className="px-5 py-3 border-t border-border-subtle text-center">
          <a
            href="/pricing"
            className="text-xs text-burnt-orange hover:text-ember font-medium transition-colors"
          >
            Upgrade to Pro for all {data.length} venues
          </a>
        </div>
      )}
    </div>
  );
}
