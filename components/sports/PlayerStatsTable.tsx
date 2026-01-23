'use client';

/**
 * Player Stats Table Component
 *
 * Extended stats table for player-specific displays with headshots,
 * sortable columns, and sport-specific stat categories.
 */

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import type { UnifiedSportKey, DetailedPlayerBoxStats } from '@/lib/types/adapters';
import {
  getSportConfig,
  getSportTheme,
  getSportCategory,
  getBoxScoreColumns,
  type StatCategory,
} from '@/lib/config/sport-config';

export interface PlayerStatsTableProps {
  players: DetailedPlayerBoxStats[];
  sport: UnifiedSportKey;
  category: StatCategory;
  /** Show player headshots */
  showHeadshots?: boolean;
  /** Link players to their profile pages */
  linkToProfile?: boolean;
  /** Base URL for player profiles (e.g., /nfl/players) */
  profileBaseUrl?: string;
  /** Enable column sorting */
  sortable?: boolean;
  /** Default sort column */
  defaultSort?: string;
  /** Default sort direction */
  defaultSortDir?: 'asc' | 'desc';
  /** Variant display mode */
  variant?: 'compact' | 'full';
  /** Show team info */
  showTeam?: boolean;
  className?: string;
}

type SortDirection = 'asc' | 'desc';

/**
 * Parse stat value for sorting (handles strings like "5-10" for FG)
 */
function parseStatValue(value: unknown): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    // Handle ratio strings like "5-10" - use first number
    if (value.includes('-')) {
      const [first] = value.split('-');
      return parseFloat(first) || 0;
    }
    // Handle percentage strings
    if (value.includes('%')) {
      return parseFloat(value.replace('%', '')) || 0;
    }
    return parseFloat(value) || 0;
  }
  return 0;
}

/**
 * Player headshot with fallback
 */
function PlayerHeadshot({
  url,
  name,
  position,
}: {
  url?: string;
  name: string;
  position?: string;
}) {
  if (url) {
    return (
      <img
        src={url}
        alt={name}
        className="w-10 h-10 rounded-full object-cover bg-white/10"
        loading="lazy"
      />
    );
  }

  // Fallback with initials
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-white">
      {initials}
    </div>
  );
}

/**
 * Sort indicator icon
 */
function SortIndicator({ direction }: { direction?: SortDirection }) {
  if (!direction) {
    return (
      <svg className="w-3 h-3 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
        />
      </svg>
    );
  }

  return direction === 'asc' ? (
    <svg
      className="w-3 h-3 text-burnt-orange"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
    </svg>
  ) : (
    <svg
      className="w-3 h-3 text-burnt-orange"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );
}

export function PlayerStatsTable({
  players,
  sport,
  category,
  showHeadshots = false,
  linkToProfile = false,
  profileBaseUrl,
  sortable = true,
  defaultSort,
  defaultSortDir = 'desc',
  variant = 'full',
  showTeam = false,
  className = '',
}: PlayerStatsTableProps) {
  const { columns, statKeys, compoundStats } = getBoxScoreColumns(sport, category, variant);
  const theme = getSportTheme(sport);

  // Sort state
  const [sortColumn, setSortColumn] = useState<string | null>(defaultSort || null);
  const [sortDir, setSortDir] = useState<SortDirection>(defaultSortDir);

  // Handle column header click for sorting
  const handleSort = (column: string) => {
    if (!sortable) return;

    if (sortColumn === column) {
      // Toggle direction
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(column);
      setSortDir('desc');
    }
  };

  // Sort players
  const sortedPlayers = useMemo(() => {
    if (!sortColumn) return players;

    const columnIndex = columns.indexOf(sortColumn);
    if (columnIndex === -1) return players;

    // Find the stat key for this column
    let statKey: string;
    if (compoundStats && compoundStats[sortColumn]) {
      statKey = compoundStats[sortColumn][0]; // Sort by first part of compound stat
    } else {
      statKey = statKeys[columnIndex];
    }

    return [...players].sort((a, b) => {
      const aVal = parseStatValue(a.stats[statKey] ?? a[statKey as keyof DetailedPlayerBoxStats]);
      const bVal = parseStatValue(b.stats[statKey] ?? b[statKey as keyof DetailedPlayerBoxStats]);

      return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
    });
  }, [players, sortColumn, sortDir, columns, statKeys, compoundStats]);

  // Get stat value for display
  const getStatDisplay = (
    player: DetailedPlayerBoxStats,
    column: string,
    colIndex: number
  ): string => {
    // Handle compound stats like C/ATT
    if (compoundStats && compoundStats[column]) {
      const [key1, key2] = compoundStats[column];
      const val1 = player.stats[key1] ?? '-';
      const val2 = player.stats[key2] ?? '-';
      return `${val1}/${val2}`;
    }

    const statKey = statKeys[colIndex];
    const value = player.stats[statKey] ?? player[statKey as keyof DetailedPlayerBoxStats];

    if (value === undefined || value === null) return '-';
    return String(value);
  };

  return (
    <Card variant="default" className={className}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-white/50 border-b border-white/10">
              {/* Player column - sticky */}
              <th className="text-left py-3 pr-4 font-medium sticky left-0 bg-charcoal z-10 min-w-[180px]">
                Player
              </th>

              {/* Position column */}
              <th className="text-center py-3 px-2 font-medium w-12">POS</th>

              {/* Team column (optional) */}
              {showTeam && <th className="text-center py-3 px-2 font-medium w-14">Team</th>}

              {/* Stat columns */}
              {columns.map((col, i) => (
                <th
                  key={col}
                  className={`text-center py-3 px-2 font-medium w-14 ${
                    sortable ? 'cursor-pointer hover:text-white transition-colors' : ''
                  }`}
                  onClick={() => handleSort(col)}
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>{col}</span>
                    {sortable && (
                      <SortIndicator direction={sortColumn === col ? sortDir : undefined} />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {sortedPlayers.map((player, i) => {
              const playerContent = (
                <div className="flex items-center gap-3">
                  {showHeadshots && (
                    <PlayerHeadshot
                      url={player.headshotUrl}
                      name={player.player.displayName}
                      position={player.position}
                    />
                  )}
                  <div className="min-w-0">
                    <div className="font-medium text-white truncate">
                      {player.player.displayName}
                    </div>
                    {player.player.jersey && (
                      <div className="text-xs text-white/40">#{player.player.jersey}</div>
                    )}
                  </div>
                </div>
              );

              return (
                <tr key={player.player.id || i} className="hover:bg-white/5 transition-colors">
                  {/* Player cell */}
                  <td className="py-3 pr-4 sticky left-0 bg-charcoal z-10">
                    {linkToProfile && profileBaseUrl ? (
                      <Link
                        href={`${profileBaseUrl}/${player.player.id}`}
                        className="block hover:opacity-80 transition-opacity"
                      >
                        {playerContent}
                      </Link>
                    ) : (
                      playerContent
                    )}
                  </td>

                  {/* Position */}
                  <td className="text-center py-3 px-2 text-white/50 font-mono text-xs">
                    {player.position || '-'}
                  </td>

                  {/* Team (optional) */}
                  {showTeam && (
                    <td className="text-center py-3 px-2 text-white/50 font-mono text-xs">
                      {player.player.team?.abbreviation || '-'}
                    </td>
                  )}

                  {/* Stat cells */}
                  {columns.map((col, colIndex) => {
                    const value = getStatDisplay(player, col, colIndex);
                    const isHighlighted = sortColumn === col;

                    return (
                      <td
                        key={col}
                        className={`text-center py-3 px-2 font-mono ${
                          isHighlighted ? 'text-white font-semibold' : 'text-white/70'
                        }`}
                      >
                        {value}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Empty state */}
      {sortedPlayers.length === 0 && (
        <div className="py-8 text-center text-white/50">No player stats available</div>
      )}
    </Card>
  );
}

/**
 * Loading skeleton for PlayerStatsTable
 */
export function PlayerStatsTableSkeleton({
  rows = 10,
  showHeadshots = false,
}: {
  rows?: number;
  showHeadshots?: boolean;
}) {
  return (
    <Card variant="default">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-white/50 border-b border-white/10">
              <th className="text-left py-3 pr-4 font-medium">Player</th>
              <th className="text-center py-3 px-2 font-medium w-12">POS</th>
              {Array.from({ length: 6 }, (_, i) => (
                <th key={i} className="text-center py-3 px-2 font-medium w-14">
                  <div className="skeleton w-8 h-4 rounded mx-auto" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {Array.from({ length: rows }, (_, i) => (
              <tr key={i}>
                <td className="py-3 pr-4">
                  <div className="flex items-center gap-3">
                    {showHeadshots && <div className="skeleton w-10 h-10 rounded-full" />}
                    <div>
                      <div className="skeleton w-24 h-4 rounded mb-1" />
                      <div className="skeleton w-8 h-3 rounded" />
                    </div>
                  </div>
                </td>
                <td className="text-center py-3 px-2">
                  <div className="skeleton w-6 h-4 rounded mx-auto" />
                </td>
                {Array.from({ length: 6 }, (_, j) => (
                  <td key={j} className="text-center py-3 px-2">
                    <div className="skeleton w-8 h-4 rounded mx-auto" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

export default PlayerStatsTable;
