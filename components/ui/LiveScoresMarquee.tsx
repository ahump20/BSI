'use client';

/**
 * LiveScoresMarquee - Scrolling ticker for live sports scores
 *
 * Displays a horizontally scrolling ticker of live game scores,
 * similar to ESPN's bottom-of-screen ticker.
 *
 * Features:
 * - Auto-scrolling animation
 * - Pause on hover
 * - Live game indicator with pulsing dot
 * - Support for multiple sports
 * - Responsive sizing
 */

import { type JSX } from 'react';
import { cn } from '@/lib/utils';

export type GameStatus = 'live' | 'final' | 'scheduled';
export type SportType = 'mlb' | 'nfl' | 'ncaaf' | 'ncaab' | 'nba';

export interface TickerGame {
  id: string;
  sport: SportType;
  status: GameStatus;
  awayTeam: {
    name: string;
    abbreviation: string;
    score?: number;
  };
  homeTeam: {
    name: string;
    abbreviation: string;
    score?: number;
  };
  /** For live games: "Top 7th", "3rd Quarter", etc. */
  period?: string;
  /** For scheduled games: "7:05 PM" */
  startTime?: string;
}

export interface LiveScoresMarqueeProps {
  /** Array of games to display */
  games: TickerGame[];
  /** Animation speed */
  speed?: 'slow' | 'normal' | 'fast';
  /** Pause animation on hover */
  pauseOnHover?: boolean;
  /** Additional className */
  className?: string;
  /** Empty state message */
  emptyMessage?: string;
}

const sportColors: Record<SportType, string> = {
  mlb: 'text-red-400',
  nfl: 'text-blue-400',
  ncaaf: 'text-orange-400',
  ncaab: 'text-amber-400',
  nba: 'text-purple-400',
};

const sportLabels: Record<SportType, string> = {
  mlb: 'MLB',
  nfl: 'NFL',
  ncaaf: 'CFB',
  ncaab: 'CBB',
  nba: 'NBA',
};

function GameTicker({ game }: { game: TickerGame }): JSX.Element {
  const isLive = game.status === 'live';
  const isFinal = game.status === 'final';

  return (
    <div className="inline-flex items-center gap-3 px-4 py-2 bg-white/5 rounded-lg border border-white/10">
      {/* Sport Badge */}
      <span
        className={cn('text-xs font-semibold uppercase tracking-wider', sportColors[game.sport])}
      >
        {sportLabels[game.sport]}
      </span>

      {/* Live Indicator */}
      {isLive && (
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          <span className="text-xs font-medium text-red-400 uppercase">Live</span>
        </span>
      )}

      {/* Matchup */}
      <div className="flex items-center gap-2">
        {/* Away Team */}
        <span className="font-semibold text-white/90">{game.awayTeam.abbreviation}</span>
        {game.awayTeam.score !== undefined && (
          <span className="font-mono font-bold text-white">{game.awayTeam.score}</span>
        )}

        <span className="text-white/40">@</span>

        {/* Home Team */}
        <span className="font-semibold text-white/90">{game.homeTeam.abbreviation}</span>
        {game.homeTeam.score !== undefined && (
          <span className="font-mono font-bold text-white">{game.homeTeam.score}</span>
        )}
      </div>

      {/* Status/Period */}
      <span className="text-xs text-white/50">
        {isFinal && 'Final'}
        {isLive && game.period}
        {game.status === 'scheduled' && game.startTime}
      </span>
    </div>
  );
}

export function LiveScoresMarquee({
  games,
  speed = 'normal',
  pauseOnHover = true,
  className,
  emptyMessage = 'No live games',
}: LiveScoresMarqueeProps): JSX.Element {
  const speedDuration = {
    slow: '60s',
    normal: '40s',
    fast: '25s',
  }[speed];

  if (games.length === 0) {
    return (
      <div
        className={cn('py-3 bg-true-black/80 backdrop-blur-sm border-y border-white/10', className)}
      >
        <div className="text-center text-sm text-white/40">{emptyMessage}</div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'relative overflow-hidden py-3 bg-true-black/80 backdrop-blur-sm border-y border-white/10',
        className
      )}
    >
      {/* Gradient fade edges */}
      <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-true-black to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-true-black to-transparent z-10 pointer-events-none" />

      {/* Scrolling track */}
      <div
        className={cn(
          'inline-flex gap-6 whitespace-nowrap',
          pauseOnHover && 'hover:[animation-play-state:paused]'
        )}
        style={{
          animation: `scroll-left ${speedDuration} linear infinite`,
        }}
      >
        {/* Double content for seamless loop */}
        {[...games, ...games].map((game, index) => (
          <GameTicker key={`${game.id}-${index}`} game={game} />
        ))}
      </div>

      {/* Animation keyframes - injected inline for component encapsulation */}
      <style jsx>{`
        @keyframes scroll-left {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </div>
  );
}

export default LiveScoresMarquee;
