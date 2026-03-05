'use client';

import Link from 'next/link';

interface GameTeam {
  name: string;
  score: number;
  isWinner?: boolean;
  hits?: number;
  errors?: number;
}

export interface GameScoreCardGame {
  id: string | number;
  away: GameTeam;
  home: GameTeam;
  status: string;
  isLive: boolean;
  isFinal: boolean;
  detail?: string;
  venue?: string;
}

interface GameScoreCardProps {
  game: GameScoreCardGame;
  showHitsErrors?: boolean;
  href?: string;
}

function TeamRow({ team, isLive }: { team: GameTeam; isLive: boolean }) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <span className="font-semibold text-text-primary">{team.name}</span>
      {team.isWinner && (
        <svg viewBox="0 0 24 24" className="w-4 h-4 text-success" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
        </svg>
      )}
      <span
        className="ml-auto text-burnt-orange font-bold text-lg"
        {...(isLive ? { 'aria-live': 'polite' as const } : {})}
      >
        {team.score}
      </span>
    </div>
  );
}

function CardContent({ game, showHitsErrors }: { game: GameScoreCardGame; showHitsErrors: boolean }) {
  return (
    <div
      className={`bg-graphite rounded-lg p-4 flex justify-between items-center border ${
        game.isLive ? 'border-success' : 'border-border-subtle'
      }`}
    >
      <div className="flex-1">
        <TeamRow team={game.away} isLive={game.isLive} />
        <TeamRow team={game.home} isLive={game.isLive} />
      </div>
      <div className="ml-6 text-right min-w-[100px]">
        {game.isLive ? (
          <div className="flex items-center justify-end gap-1.5">
            <span className="w-2 h-2 bg-success rounded-full animate-pulse" />
            <span className="text-success font-semibold text-sm">
              {game.detail || 'Live'}
            </span>
          </div>
        ) : (
          <div
            className={`font-semibold text-sm ${
              game.isFinal ? 'text-text-tertiary' : 'text-burnt-orange'
            }`}
          >
            {game.status}
          </div>
        )}
        {game.venue && (
          <div className="text-xs text-text-tertiary mt-1">{game.venue}</div>
        )}
        {showHitsErrors && (game.isFinal || game.isLive) && (
          <div className="text-xs text-text-tertiary mt-1">
            H: {game.away.hits ?? 0}-{game.home.hits ?? 0} | E:{' '}
            {game.away.errors ?? 0}-{game.home.errors ?? 0}
          </div>
        )}
      </div>
    </div>
  );
}

export function GameScoreCard({ game, showHitsErrors = false, href }: GameScoreCardProps) {
  if (href) {
    return (
      <Link href={href} className="block">
        <CardContent game={game} showHitsErrors={showHitsErrors} />
      </Link>
    );
  }
  return <CardContent game={game} showHitsErrors={showHitsErrors} />;
}
