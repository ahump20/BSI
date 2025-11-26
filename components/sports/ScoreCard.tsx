'use client';

import { LiveBadge, GameStatusBadge, type GameStatus } from '@/components/ui/Badge';

interface Team {
  name: string;
  abbreviation: string;
  score: number;
  logo?: string;
}

interface ScoreCardProps {
  homeTeam: Team;
  awayTeam: Team;
  status: GameStatus;
  gameTime?: string;
  venue?: string;
  inning?: string;
  quarter?: string;
  period?: string;
  broadcast?: string;
}

export function ScoreCard({
  homeTeam,
  awayTeam,
  status,
  gameTime,
  venue,
  inning,
  quarter,
  period,
  broadcast,
}: ScoreCardProps) {
  const currentPeriod = inning || quarter || period;

  return (
    <div className="glass-card p-4 hover:shadow-glow-sm transition-shadow">
      {/* Header */}
      <div className="flex justify-between items-center mb-3">
        <GameStatusBadge status={status} />
        {currentPeriod && status === 'live' && (
          <span className="text-xs text-white/50 font-mono">{currentPeriod}</span>
        )}
        {gameTime && status === 'scheduled' && (
          <span className="text-xs text-white/50">{gameTime}</span>
        )}
      </div>

      {/* Teams */}
      <div className="space-y-3">
        {/* Away Team */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sm font-bold">
              {awayTeam.abbreviation.slice(0, 2)}
            </div>
            <div>
              <p className="text-white font-medium">{awayTeam.name}</p>
              <p className="text-white/50 text-xs">{awayTeam.abbreviation}</p>
            </div>
          </div>
          <span
            className={`text-2xl font-mono font-bold ${
              status !== 'scheduled' && awayTeam.score > homeTeam.score
                ? 'text-success'
                : 'text-white'
            }`}
          >
            {status === 'scheduled' ? '-' : awayTeam.score}
          </span>
        </div>

        {/* Home Team */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sm font-bold">
              {homeTeam.abbreviation.slice(0, 2)}
            </div>
            <div>
              <p className="text-white font-medium">{homeTeam.name}</p>
              <p className="text-white/50 text-xs">{homeTeam.abbreviation}</p>
            </div>
          </div>
          <span
            className={`text-2xl font-mono font-bold ${
              status !== 'scheduled' && homeTeam.score > awayTeam.score
                ? 'text-success'
                : 'text-white'
            }`}
          >
            {status === 'scheduled' ? '-' : homeTeam.score}
          </span>
        </div>
      </div>

      {/* Footer */}
      {(venue || broadcast) && (
        <div className="mt-3 pt-3 border-t border-white/10 flex justify-between items-center text-xs text-white/40">
          {venue && <span>{venue}</span>}
          {broadcast && <span>{broadcast}</span>}
        </div>
      )}
    </div>
  );
}

// Loading skeleton
export function ScoreCardSkeleton() {
  return (
    <div className="glass-card p-4">
      <div className="flex justify-between items-center mb-3">
        <div className="skeleton w-16 h-5 rounded" />
        <div className="skeleton w-12 h-4 rounded" />
      </div>
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="skeleton w-8 h-8 rounded-full" />
            <div>
              <div className="skeleton w-24 h-4 rounded mb-1" />
              <div className="skeleton w-12 h-3 rounded" />
            </div>
          </div>
          <div className="skeleton w-8 h-8 rounded" />
        </div>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="skeleton w-8 h-8 rounded-full" />
            <div>
              <div className="skeleton w-24 h-4 rounded mb-1" />
              <div className="skeleton w-12 h-3 rounded" />
            </div>
          </div>
          <div className="skeleton w-8 h-8 rounded" />
        </div>
      </div>
    </div>
  );
}
