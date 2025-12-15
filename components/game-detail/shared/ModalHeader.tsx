'use client';

import type { ModalHeaderProps } from '../GameDetailModal.types';
import { LiveBadge, GameStatusBadge } from '@/components/ui/Badge';

export function ModalHeader({ game, onClose }: ModalHeaderProps) {
  const isLive = game.status === 'LIVE';
  const isFinal = game.status === 'FINAL';

  // Format game time display
  const getTimeDisplay = () => {
    if (isLive && game.sportData) {
      if ('inning' in game.sportData && game.sportData.inning) {
        const half = game.sportData.inningHalf === 'TOP' ? 'Top' : 'Bot';
        return `${half} ${game.sportData.inning}`;
      }
      if ('quarter' in game.sportData && game.sportData.quarter) {
        return `Q${game.sportData.quarter} ${game.sportData.timeRemaining || ''}`;
      }
      if ('period' in game.sportData && game.sportData.period) {
        return `P${game.sportData.period} ${game.sportData.timeRemaining || ''}`;
      }
    }
    if (isFinal) return 'Final';
    return new Date(game.scheduledAt).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <div className="bg-charcoal border-b border-white/10">
      {/* Close button and status row */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/5">
        <div className="flex items-center gap-2">
          {isLive ? <LiveBadge /> : <GameStatusBadge status={game.status.toLowerCase() as any} />}
          <span className="text-white/50 text-xs font-mono">{getTimeDisplay()}</span>
        </div>
        <button
          onClick={onClose}
          aria-label="Close game detail"
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors text-white/60 hover:text-white"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* Score display */}
      <div className="px-4 py-4">
        {/* Away Team */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            {game.awayRanking && (
              <span className="text-burnt-orange text-xs font-bold">#{game.awayRanking}</span>
            )}
            {game.awayTeam.logo ? (
              <img
                src={game.awayTeam.logo}
                alt={game.awayTeam.name}
                className="w-10 h-10 object-contain"
              />
            ) : (
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                style={{ backgroundColor: game.awayTeam.color || '#333' }}
              >
                {game.awayTeam.abbreviation.slice(0, 2)}
              </div>
            )}
            <div>
              <p className="text-white font-semibold">{game.awayTeam.name}</p>
              {game.awayTeam.record && (
                <p className="text-white/50 text-xs">{game.awayTeam.record.overall}</p>
              )}
            </div>
          </div>
          <span
            className={`text-3xl font-mono font-bold ${
              !isFinal
                ? 'text-white'
                : game.awayScore !== null &&
                    game.homeScore !== null &&
                    game.awayScore > game.homeScore
                  ? 'text-success'
                  : game.awayScore !== null &&
                      game.homeScore !== null &&
                      game.awayScore < game.homeScore
                    ? 'text-white/50'
                    : 'text-white'
            }`}
          >
            {game.awayScore ?? '-'}
          </span>
        </div>

        {/* Home Team */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {game.homeRanking && (
              <span className="text-burnt-orange text-xs font-bold">#{game.homeRanking}</span>
            )}
            {game.homeTeam.logo ? (
              <img
                src={game.homeTeam.logo}
                alt={game.homeTeam.name}
                className="w-10 h-10 object-contain"
              />
            ) : (
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                style={{ backgroundColor: game.homeTeam.color || '#333' }}
              >
                {game.homeTeam.abbreviation.slice(0, 2)}
              </div>
            )}
            <div>
              <p className="text-white font-semibold">{game.homeTeam.name}</p>
              {game.homeTeam.record && (
                <p className="text-white/50 text-xs">{game.homeTeam.record.overall}</p>
              )}
            </div>
          </div>
          <span
            className={`text-3xl font-mono font-bold ${
              !isFinal
                ? 'text-white'
                : game.homeScore !== null &&
                    game.awayScore !== null &&
                    game.homeScore > game.awayScore
                  ? 'text-success'
                  : game.homeScore !== null &&
                      game.awayScore !== null &&
                      game.homeScore < game.awayScore
                    ? 'text-white/50'
                    : 'text-white'
            }`}
          >
            {game.homeScore ?? '-'}
          </span>
        </div>

        {/* Venue info */}
        {(game.venue || game.broadcast) && (
          <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-white/40">
            {game.venue && <span>{game.venue}</span>}
            {game.broadcast && <span className="text-burnt-orange/70">{game.broadcast}</span>}
          </div>
        )}
      </div>
    </div>
  );
}
