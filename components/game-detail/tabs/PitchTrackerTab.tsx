'use client';

import { usePitchData } from '@/lib/hooks/usePitchData';
import { PitchTracker } from '@/components/pitch-tracker';

interface PitchTrackerTabProps {
  gameId: string;
  /** For MLB games, this should be the gamePk number */
  gamePk?: number;
  loading?: boolean;
}

/**
 * PitchTrackerTab Component
 *
 * Displays real-time pitch tracking for MLB games within the GameDetailModal.
 * Uses MLB StatsAPI for pitch-by-pitch data with live polling.
 */
export function PitchTrackerTab({
  gameId,
  gamePk,
  loading: externalLoading,
}: PitchTrackerTabProps) {
  // Convert gameId to gamePk if not provided
  const mlbGamePk = gamePk || parseInt(gameId, 10) || null;

  const { atBats, currentAtBatIndex, gameState, loading, error } = usePitchData(mlbGamePk, {
    pollInterval: 10000,
    enablePolling: true,
  });

  // External loading state
  if (externalLoading) {
    return (
      <div className="p-4">
        <div className="flex gap-4">
          <div className="skeleton w-48 h-60 rounded-lg" />
          <div className="flex-1 space-y-2">
            <div className="skeleton w-full h-10 rounded" />
            <div className="skeleton w-full h-8 rounded" />
            <div className="skeleton w-full h-8 rounded" />
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-4">
        <div className="text-center py-8 bg-charcoal rounded-lg">
          <svg
            className="w-12 h-12 mx-auto text-red-500/50 mb-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <p className="text-white/50">Unable to load pitch data</p>
          <p className="text-white/30 text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  // Non-MLB game state
  if (!mlbGamePk || isNaN(mlbGamePk)) {
    return (
      <div className="p-4">
        <div className="text-center py-8 bg-charcoal rounded-lg">
          <svg
            className="w-12 h-12 mx-auto text-white/20 mb-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <circle cx="12" cy="12" r="10" strokeWidth="1.5" />
            <path strokeLinecap="round" strokeWidth="1.5" d="M9 9l6 6m0-6l-6 6" />
          </svg>
          <p className="text-white/50">Pitch tracking not available</p>
          <p className="text-white/30 text-sm mt-1">
            Pitch-by-pitch data is only available for MLB games
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Live game state indicator */}
      {gameState && (
        <div className="px-4 py-2 bg-charcoal/50 border-b border-white/10">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-3">
              <span className="text-white/70">
                {gameState.inningHalf === 'top' ? 'Top' : 'Bot'} {gameState.inning}
              </span>
              <span className="text-white/40">|</span>
              <span className="text-white/70">
                {gameState.outs} {gameState.outs === 1 ? 'Out' : 'Outs'}
              </span>
              <span className="text-white/40">|</span>
              <span className="font-mono text-burnt-orange">
                {gameState.balls}-{gameState.strikes}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {/* Bases indicator */}
              <div className="flex items-center gap-0.5">
                <div
                  className={`w-2 h-2 rotate-45 ${gameState.runners.second ? 'bg-burnt-orange' : 'bg-white/20'}`}
                />
              </div>
              <div className="flex flex-col gap-0.5">
                <div
                  className={`w-2 h-2 rotate-45 ${gameState.runners.third ? 'bg-burnt-orange' : 'bg-white/20'}`}
                />
                <div
                  className={`w-2 h-2 rotate-45 ${gameState.runners.first ? 'bg-burnt-orange' : 'bg-white/20'}`}
                />
              </div>
            </div>
            <div className="flex items-center gap-2 font-mono">
              <span className="text-white">{gameState.awayScore}</span>
              <span className="text-white/40">-</span>
              <span className="text-white">{gameState.homeScore}</span>
            </div>
          </div>
        </div>
      )}

      {/* Pitch tracker */}
      <PitchTracker
        atBats={atBats}
        currentAtBatIndex={currentAtBatIndex}
        showAdvanced
        loading={loading}
      />
    </div>
  );
}
