'use client';

export type GameStatus = 'scheduled' | 'in_progress' | 'final' | 'delayed' | 'postponed';

export interface TeamInfo {
  name: string;
  abbreviation: string;
  logo: string;
  score?: number;
  record?: string;
}

export interface ScoreHeaderGame {
  id: string;
  away: TeamInfo;
  home: TeamInfo;
  status: GameStatus;
  period?: string;
  clock?: string;
  startTime?: string;
  venue?: string;
  broadcast?: string;
}

interface ScoreHeaderProps {
  /** Game data to display */
  game: ScoreHeaderGame;
  /** Optional className for the container */
  className?: string;
  /** Optional back button click handler */
  onBack?: () => void;
}

/**
 * ScoreHeader - Sticky header for game detail pages
 *
 * Shows live/final score at top of game pages (box score, play-by-play, recap).
 * Features:
 * - Sticky positioning at top of viewport
 * - Live pulse animation for in-progress games
 * - Team logos, abbreviations, and scores
 * - Period/clock display or final/scheduled status
 */
export function ScoreHeader({ game, className = '', onBack }: ScoreHeaderProps) {
  const { away, home, status, period, clock, startTime } = game;
  const isLive = status === 'in_progress';
  const isFinal = status === 'final';
  const isDelayed = status === 'delayed' || status === 'postponed';

  const getStatusDisplay = () => {
    if (isLive) {
      return `${period || ''} ${clock || ''}`.trim() || 'LIVE';
    }
    if (isFinal) {
      return 'Final';
    }
    if (isDelayed) {
      return status === 'postponed' ? 'PPD' : 'Delayed';
    }
    return startTime || 'TBD';
  };

  const getStatusClass = () => {
    if (isLive) return 'text-red-500 animate-pulse';
    if (isFinal) return 'text-emerald-500';
    if (isDelayed) return 'text-amber-500';
    return 'text-gray-400';
  };

  return (
    <header
      className={`sticky top-0 z-50 bg-charcoal border-b border-gray-700 ${className}`}
    >
      {/* Optional back button row */}
      {onBack && (
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
          aria-label="Go back"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
      )}

      {/* Main score display */}
      <div className="flex items-center justify-between gap-4 p-4">
        {/* Away Team */}
        <div className="flex items-center gap-2 flex-1">
          <img
            src={away.logo}
            alt={away.name}
            className="w-10 h-10 object-contain"
            loading="lazy"
          />
          <span className="font-display text-xl font-bold uppercase">
            {away.abbreviation}
          </span>
          <span className="font-mono text-3xl font-bold">
            {away.score ?? '-'}
          </span>
        </div>

        {/* Status */}
        <div className="text-center min-w-20">
          <div className={`text-sm uppercase font-medium ${getStatusClass()}`}>
            {getStatusDisplay()}
          </div>
          {game.venue && !isLive && (
            <div className="text-xs text-gray-500 mt-1 truncate max-w-24">
              {game.broadcast || game.venue}
            </div>
          )}
        </div>

        {/* Home Team */}
        <div className="flex items-center gap-2 flex-1 justify-end flex-row-reverse">
          <img
            src={home.logo}
            alt={home.name}
            className="w-10 h-10 object-contain"
            loading="lazy"
          />
          <span className="font-display text-xl font-bold uppercase">
            {home.abbreviation}
          </span>
          <span className="font-mono text-3xl font-bold">
            {home.score ?? '-'}
          </span>
        </div>
      </div>
    </header>
  );
}

export default ScoreHeader;
