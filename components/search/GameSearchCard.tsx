'use client';

import type { JSX } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';

interface GameResult {
  id: string;
  homeTeam: { name: string; abbreviation: string; score?: number };
  awayTeam: { name: string; abbreviation: string; score?: number };
  date: string;
  status: string;
  sport: string;
  venue?: string;
}

interface GameSearchCardProps {
  game: GameResult;
}

const SPORT_COLORS: Record<string, string> = {
  mlb: 'bg-red-600',
  nfl: 'bg-blue-700',
  nba: 'bg-orange-600',
  cfb: 'bg-green-700',
  cbb: 'bg-purple-700',
  college_baseball: 'bg-amber-700',
};

const SPORT_LABELS: Record<string, string> = {
  mlb: 'MLB',
  nfl: 'NFL',
  nba: 'NBA',
  cfb: 'CFB',
  cbb: 'CBB',
  college_baseball: 'CBB',
};

function getSportColor(sport: string): string {
  return SPORT_COLORS[sport.toLowerCase()] || 'bg-gray-600';
}

function buildGameHref(sport: string, gameId: string): string {
  const sportLower = sport.toLowerCase();
  return `/games/${sportLower}/${gameId}`;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'America/Chicago',
  });
}

export function GameSearchCard({ game }: GameSearchCardProps): JSX.Element {
  const isFinal = game.status.toLowerCase() === 'final';
  const isLive =
    game.status.toLowerCase().includes('live') || game.status.toLowerCase().includes('in progress');

  return (
    <Link href={buildGameHref(game.sport, game.id)} className="block group">
      <Card
        variant={isLive ? 'live' : 'default'}
        padding="md"
        className="h-full transition-all group-hover:border-burnt-orange"
      >
        <div className="flex items-center gap-4">
          {/* Sport Badge */}
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center text-white text-xs font-bold ${getSportColor(game.sport)}`}
          >
            {SPORT_LABELS[game.sport.toLowerCase()] || game.sport.toUpperCase()}
          </div>

          {/* Matchup */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-white group-hover:text-burnt-orange transition-colors">
                {game.awayTeam.abbreviation}
              </span>
              {game.awayTeam.score !== undefined && (
                <span className="text-lg font-bold text-white">{game.awayTeam.score}</span>
              )}
              <span className="text-text-tertiary">@</span>
              <span className="font-semibold text-white group-hover:text-burnt-orange transition-colors">
                {game.homeTeam.abbreviation}
              </span>
              {game.homeTeam.score !== undefined && (
                <span className="text-lg font-bold text-white">{game.homeTeam.score}</span>
              )}
            </div>
            <p className="text-xs text-text-tertiary truncate">
              {formatDate(game.date)}
              {game.venue && ` • ${game.venue}`}
            </p>
          </div>

          {/* Status Badge */}
          <span
            className={`px-2 py-1 text-xs font-semibold rounded ${
              isFinal
                ? 'bg-bg-tertiary text-text-secondary'
                : isLive
                  ? 'bg-error text-white animate-pulse'
                  : 'bg-burnt-orange/20 text-burnt-orange'
            }`}
          >
            {game.status}
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
