'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

export interface StatRow {
  season: string;
  team: string;
  [key: string]: string | number;
}

export interface PlayerStatsProps {
  position: string;
  stats: StatRow[];
  careerTotals?: StatRow;
}

interface StatColumn {
  key: string;
  label: string;
  width?: string;
}

const QB_COLUMNS: StatColumn[] = [
  { key: 'season', label: 'Season', width: 'w-20' },
  { key: 'team', label: 'Team', width: 'w-14' },
  { key: 'g', label: 'G', width: 'w-10' },
  { key: 'comp', label: 'CMP', width: 'w-12' },
  { key: 'att', label: 'ATT', width: 'w-12' },
  { key: 'pct', label: 'PCT', width: 'w-14' },
  { key: 'yds', label: 'YDS', width: 'w-16' },
  { key: 'td', label: 'TD', width: 'w-10' },
  { key: 'int', label: 'INT', width: 'w-10' },
];

const RB_COLUMNS: StatColumn[] = [
  { key: 'season', label: 'Season', width: 'w-20' },
  { key: 'team', label: 'Team', width: 'w-14' },
  { key: 'g', label: 'G', width: 'w-10' },
  { key: 'car', label: 'CAR', width: 'w-12' },
  { key: 'yds', label: 'YDS', width: 'w-16' },
  { key: 'avg', label: 'AVG', width: 'w-12' },
  { key: 'td', label: 'TD', width: 'w-10' },
  { key: 'rec', label: 'REC', width: 'w-12' },
  { key: 'recYds', label: 'REC YDS', width: 'w-16' },
];

const WR_COLUMNS: StatColumn[] = [
  { key: 'season', label: 'Season', width: 'w-20' },
  { key: 'team', label: 'Team', width: 'w-14' },
  { key: 'g', label: 'G', width: 'w-10' },
  { key: 'rec', label: 'REC', width: 'w-12' },
  { key: 'tgt', label: 'TGT', width: 'w-12' },
  { key: 'yds', label: 'YDS', width: 'w-16' },
  { key: 'avg', label: 'AVG', width: 'w-12' },
  { key: 'td', label: 'TD', width: 'w-10' },
];

const PITCHER_COLUMNS: StatColumn[] = [
  { key: 'season', label: 'Season', width: 'w-20' },
  { key: 'team', label: 'Team', width: 'w-14' },
  { key: 'g', label: 'G', width: 'w-10' },
  { key: 'gs', label: 'GS', width: 'w-10' },
  { key: 'w', label: 'W', width: 'w-10' },
  { key: 'l', label: 'L', width: 'w-10' },
  { key: 'ip', label: 'IP', width: 'w-14' },
  { key: 'era', label: 'ERA', width: 'w-14' },
  { key: 'so', label: 'SO', width: 'w-12' },
];

const BATTER_COLUMNS: StatColumn[] = [
  { key: 'season', label: 'Season', width: 'w-20' },
  { key: 'team', label: 'Team', width: 'w-14' },
  { key: 'g', label: 'G', width: 'w-10' },
  { key: 'ab', label: 'AB', width: 'w-12' },
  { key: 'h', label: 'H', width: 'w-12' },
  { key: 'hr', label: 'HR', width: 'w-10' },
  { key: 'rbi', label: 'RBI', width: 'w-12' },
  { key: 'avg', label: 'AVG', width: 'w-14' },
  { key: 'obp', label: 'OBP', width: 'w-14' },
];

const DEFAULT_COLUMNS: StatColumn[] = [
  { key: 'season', label: 'Season', width: 'w-20' },
  { key: 'team', label: 'Team', width: 'w-14' },
  { key: 'g', label: 'G', width: 'w-10' },
  { key: 'pts', label: 'PTS', width: 'w-12' },
  { key: 'reb', label: 'REB', width: 'w-12' },
  { key: 'ast', label: 'AST', width: 'w-12' },
  { key: 'stl', label: 'STL', width: 'w-10' },
  { key: 'blk', label: 'BLK', width: 'w-10' },
];

function getColumnsForPosition(position: string): StatColumn[] {
  const pos = position.toUpperCase();
  if (pos === 'QB' || pos === 'QUARTERBACK') return QB_COLUMNS;
  if (pos === 'RB' || pos === 'HB' || pos === 'RUNNING BACK') return RB_COLUMNS;
  if (pos === 'WR' || pos === 'TE' || pos === 'WIDE RECEIVER' || pos === 'TIGHT END')
    return WR_COLUMNS;
  if (pos === 'P' || pos === 'SP' || pos === 'RP' || pos === 'PITCHER') return PITCHER_COLUMNS;
  if (['C', 'SS', '1B', '2B', '3B', 'OF', 'LF', 'CF', 'RF', 'DH'].includes(pos))
    return BATTER_COLUMNS;
  return DEFAULT_COLUMNS;
}

export function PlayerStats({ position, stats, careerTotals }: PlayerStatsProps) {
  const [view, setView] = useState<'season' | 'career'>('season');
  const columns = getColumnsForPosition(position);

  return (
    <Card variant="default" padding="lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <svg
            className="w-5 h-5 text-burnt-orange"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M18 20V10M12 20V4M6 20v-6" />
          </svg>
          Career Statistics
        </CardTitle>
        <div className="flex gap-2">
          <button
            onClick={() => setView('season')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
              view === 'season'
                ? 'bg-burnt-orange text-white'
                : 'bg-bg-tertiary text-text-secondary hover:text-white'
            }`}
          >
            By Season
          </button>
          <button
            onClick={() => setView('career')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
              view === 'career'
                ? 'bg-burnt-orange text-white'
                : 'bg-bg-tertiary text-text-secondary hover:text-white'
            }`}
          >
            Career Totals
          </button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-subtle">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={`py-3 px-2 text-text-tertiary font-medium uppercase text-xs tracking-wider ${
                      col.key === 'season' || col.key === 'team' ? 'text-left' : 'text-center'
                    } ${col.width || ''}`}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {stats.map((row, idx) => (
                <tr
                  key={idx}
                  className="border-b border-border-subtle hover:bg-bg-tertiary/50 transition-colors"
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`py-3 px-2 ${
                        col.key === 'season' || col.key === 'team'
                          ? 'text-left font-medium text-white'
                          : 'text-center text-text-secondary'
                      }`}
                    >
                      {row[col.key] ?? '-'}
                    </td>
                  ))}
                </tr>
              ))}
              {/* Career Totals Row */}
              {careerTotals && (
                <tr className="bg-gradient-to-r from-burnt-orange/10 to-gold/10 font-semibold">
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`py-3 px-2 ${
                        col.key === 'season' || col.key === 'team'
                          ? 'text-left text-white'
                          : 'text-center text-white'
                      }`}
                    >
                      {col.key === 'season'
                        ? 'Career'
                        : col.key === 'team'
                          ? '-'
                          : (careerTotals[col.key] ?? '-')}
                    </td>
                  ))}
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
