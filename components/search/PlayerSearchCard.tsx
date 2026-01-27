'use client';

import type { JSX } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';

interface PlayerResult {
  id: string;
  name: string;
  position: string;
  team: string;
  teamId: string;
  sport: string;
  number?: string;
  headshot?: string;
  stats?: string;
}

interface PlayerSearchCardProps {
  player: PlayerResult;
}

const SPORT_COLORS: Record<string, string> = {
  mlb: 'bg-red-600',
  nfl: 'bg-blue-700',
  nba: 'bg-orange-600',
  cfb: 'bg-green-700',
  cbb: 'bg-purple-700',
};

function getSportColor(sport: string): string {
  return SPORT_COLORS[sport.toLowerCase()] || 'bg-gray-600';
}

function buildPlayerHref(sport: string, playerId: string): string {
  const sportLower = sport.toLowerCase();
  switch (sportLower) {
    case 'mlb':
      return `/mlb/players/${playerId}`;
    case 'nfl':
      return `/nfl/players/${playerId}`;
    case 'nba':
      return `/nba/players/${playerId}`;
    case 'cfb':
      return `/college-football/players/${playerId}`;
    case 'cbb':
      return `/college-basketball/players/${playerId}`;
    default:
      return `/players/${playerId}`;
  }
}

export function PlayerSearchCard({ player }: PlayerSearchCardProps): JSX.Element {
  return (
    <Link href={buildPlayerHref(player.sport, player.id)} className="block group">
      <Card
        variant="default"
        padding="md"
        className="h-full transition-all group-hover:border-burnt-orange"
      >
        <div className="flex items-center gap-4">
          {/* Player Avatar */}
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${getSportColor(player.sport)} group-hover:scale-105 transition-transform`}
          >
            {player.number ? `#${player.number}` : player.name.charAt(0)}
          </div>

          {/* Player Info */}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-white group-hover:text-burnt-orange transition-colors truncate">
              {player.name}
            </p>
            <p className="text-xs text-text-tertiary truncate">
              {player.position} • {player.team}
            </p>
            {player.stats && (
              <p className="text-sm text-text-secondary mt-0.5 font-mono">{player.stats}</p>
            )}
          </div>

          {/* Sport Badge */}
          <span
            className={`px-2 py-1 ${getSportColor(player.sport)} text-white text-xs font-bold rounded uppercase`}
          >
            {player.sport}
          </span>

          {/* Arrow */}
          <svg
            viewBox="0 0 24 24"
            className="w-5 h-5 text-text-tertiary group-hover:text-burnt-orange transition-colors"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M9 18l6-6-6-6" />
          </svg>
        </div>
      </Card>
    </Link>
  );
}
