'use client';

import Link from 'next/link';

interface ScheduleGame {
  id: string;
  date: string;
  time: string;
  status: 'scheduled' | 'live' | 'final' | 'postponed' | 'canceled';
  inning?: number;
  homeTeam: {
    id: string;
    name: string;
    shortName: string;
    conference: string;
    score: number | null;
    record: { wins: number; losses: number };
  };
  awayTeam: {
    id: string;
    name: string;
    shortName: string;
    conference: string;
    score: number | null;
    record: { wins: number; losses: number };
  };
  venue: string;
  tv?: string;
}

export type { ScheduleGame };

export function ScheduleGameCard({ game }: { game: ScheduleGame }) {
  const isLive = game.status === 'live';
  const isFinal = game.status === 'final';
  const isScheduled = game.status === 'scheduled';
  const awayWon = isFinal && (game.awayTeam.score ?? 0) > (game.homeTeam.score ?? 0);
  const homeWon = isFinal && (game.homeTeam.score ?? 0) > (game.awayTeam.score ?? 0);

  return (
    <Link href={`/college-baseball/game/${game.id}`} className="block">
      <div className={`bg-surface-light rounded-lg border transition-all hover:border-burnt-orange hover:bg-surface ${
        isLive ? 'border-green-500/30' : 'border-border'
      }`}>
        <div className={`px-3 py-1.5 rounded-t-lg flex items-center justify-between ${
          isLive ? 'bg-green-500/10' : isFinal ? 'bg-surface-light' : 'bg-burnt-orange/10'
        }`}>
          <span className={`text-xs font-semibold uppercase ${
            isLive ? 'text-green-400' : isFinal ? 'text-text-muted' : 'text-burnt-orange'
          }`}>
            {isLive ? (
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                {game.inning ? `Inn ${game.inning}` : 'Live'}
              </span>
            ) : isFinal ? 'Final' : game.time}
          </span>
          <span className="text-[10px] text-text-muted font-medium">
            {game.homeTeam.conference || game.awayTeam.conference || 'NCAA'}
          </span>
        </div>
        <div className="p-3 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-6 h-6 bg-surface-light rounded-full flex items-center justify-center text-[10px] font-bold text-burnt-orange flex-shrink-0">
                {game.awayTeam.shortName?.slice(0, 3).toUpperCase() || 'AWY'}
              </div>
              <span className={`font-semibold text-sm truncate ${awayWon ? 'text-text-primary' : 'text-text-secondary'}`}>
                {game.awayTeam.name}
              </span>
            </div>
            <span className={`text-lg font-bold font-mono ml-2 ${
              isScheduled ? 'text-text-muted' : awayWon ? 'text-text-primary' : 'text-text-muted'
            }`}>
              {game.awayTeam.score !== null ? game.awayTeam.score : '-'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-6 h-6 bg-surface-light rounded-full flex items-center justify-center text-[10px] font-bold text-burnt-orange flex-shrink-0">
                {game.homeTeam.shortName?.slice(0, 3).toUpperCase() || 'HME'}
              </div>
              <span className={`font-semibold text-sm truncate ${homeWon ? 'text-text-primary' : 'text-text-secondary'}`}>
                {game.homeTeam.name}
              </span>
            </div>
            <span className={`text-lg font-bold font-mono ml-2 ${
              isScheduled ? 'text-text-muted' : homeWon ? 'text-text-primary' : 'text-text-muted'
            }`}>
              {game.homeTeam.score !== null ? game.homeTeam.score : '-'}
            </span>
          </div>
        </div>
        {game.venue && game.venue !== 'TBD' && (
          <div className="px-3 pb-2 text-[10px] text-text-muted truncate">
            {game.venue}
          </div>
        )}
      </div>
    </Link>
  );
}
