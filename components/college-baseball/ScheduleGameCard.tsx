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
      <div className={`bg-[var(--surface-press-box)] rounded-sm border transition-all hover:border-[var(--bsi-primary)] hover:bg-surface ${
        isLive ? 'border-[var(--bsi-primary)]/30' : 'border-border'
      }`}>
        <div className={`px-3 py-1.5 rounded-t-sm flex items-center justify-between ${
          isLive ? 'bg-[var(--bsi-primary)]/10' : isFinal ? 'bg-[var(--surface-press-box)]' : 'bg-[var(--bsi-primary)]/10'
        }`}>
          <span className={`text-xs font-semibold uppercase ${
            isLive ? 'text-[var(--bsi-primary)]' : isFinal ? 'text-[rgba(196,184,165,0.35)]' : 'text-[var(--bsi-primary)]'
          }`}>
            {isLive ? (
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-[var(--bsi-primary)] rounded-full animate-pulse" />
                {game.inning ? `Inn ${game.inning}` : 'Live'}
              </span>
            ) : isFinal ? 'Final' : game.time}
          </span>
          <span className="text-[10px] text-[rgba(196,184,165,0.35)] font-medium">
            {game.homeTeam.conference || game.awayTeam.conference || 'NCAA'}
          </span>
        </div>
        <div className="p-3 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-6 h-6 bg-[var(--surface-press-box)] rounded-full flex items-center justify-center text-[10px] font-bold text-[var(--bsi-primary)] flex-shrink-0">
                {game.awayTeam.shortName?.slice(0, 3).toUpperCase() || 'AWY'}
              </div>
              <span className={`font-semibold text-sm truncate ${awayWon ? 'text-[var(--bsi-bone)]' : 'text-[var(--bsi-dust)]'}`}>
                {game.awayTeam.name}
              </span>
            </div>
            <span className={`text-lg font-bold font-mono ml-2 ${
              isScheduled ? 'text-[rgba(196,184,165,0.35)]' : awayWon ? 'text-[var(--bsi-bone)]' : 'text-[rgba(196,184,165,0.35)]'
            }`}>
              {game.awayTeam.score !== null ? game.awayTeam.score : '-'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-6 h-6 bg-[var(--surface-press-box)] rounded-full flex items-center justify-center text-[10px] font-bold text-[var(--bsi-primary)] flex-shrink-0">
                {game.homeTeam.shortName?.slice(0, 3).toUpperCase() || 'HME'}
              </div>
              <span className={`font-semibold text-sm truncate ${homeWon ? 'text-[var(--bsi-bone)]' : 'text-[var(--bsi-dust)]'}`}>
                {game.homeTeam.name}
              </span>
            </div>
            <span className={`text-lg font-bold font-mono ml-2 ${
              isScheduled ? 'text-[rgba(196,184,165,0.35)]' : homeWon ? 'text-[var(--bsi-bone)]' : 'text-[rgba(196,184,165,0.35)]'
            }`}>
              {game.homeTeam.score !== null ? game.homeTeam.score : '-'}
            </span>
          </div>
        </div>
        {game.venue && game.venue !== 'TBD' && (
          <div className="px-3 pb-2 text-[10px] text-[rgba(196,184,165,0.35)] truncate">
            {game.venue}
          </div>
        )}
      </div>
    </Link>
  );
}
