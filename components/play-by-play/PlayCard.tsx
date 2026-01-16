'use client';

import type { NormalizedPlay } from '@/lib/types/adapters';

export interface PlayCardProps {
  play: NormalizedPlay;
  showVideo?: boolean;
  onVideoClick?: (play: NormalizedPlay) => void;
  className?: string;
}

export function PlayCard({ play, showVideo = true, onVideoClick, className = '' }: PlayCardProps) {
  return (
    <div
      className={`px-4 py-3 border-b border-white/5 last:border-0 ${
        play.isScoring ? 'bg-burnt-orange/10 border-l-2 border-l-burnt-orange' : ''
      } ${className}`}
    >
      {/* Play header */}
      <div className="flex items-center gap-2 text-xs text-white/50 mb-1">
        <span className="font-mono">{play.gameTime}</span>
        {play.team && (
          <>
            <span className="text-white/30">|</span>
            <span className="font-medium text-white/70">{play.team.abbreviation}</span>
          </>
        )}
        {play.isKeyPlay && !play.isScoring && (
          <span className="px-1.5 py-0.5 bg-gold/20 text-gold text-[10px] rounded font-semibold">
            KEY
          </span>
        )}
      </div>

      {/* Play description */}
      <p className="text-white/90 text-sm">{play.description}</p>

      {/* Score after (for scoring plays) */}
      {play.isScoring && (
        <p className="text-burnt-orange text-xs mt-1 font-medium">
          Score: {play.scoreAfter.away} - {play.scoreAfter.home}
        </p>
      )}

      {/* Players involved */}
      {play.players.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {play.players.map((player, i) => (
            <span key={i} className="text-xs text-white/40">
              {player.name} ({player.role}){i < play.players.length - 1 && ', '}
            </span>
          ))}
        </div>
      )}

      {/* Video button (if available) */}
      {showVideo && play.videoUrl && (
        <button
          onClick={() => onVideoClick?.(play)}
          className="mt-2 flex items-center gap-1 text-xs text-burnt-orange hover:text-burnt-orange/80 transition-colors"
        >
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
          Watch highlight
        </button>
      )}

      {/* Win probability delta */}
      {play.winProbDelta !== undefined && Math.abs(play.winProbDelta) > 5 && (
        <div className="mt-2 text-xs">
          <span className="text-white/40">Win Prob: </span>
          <span
            className={
              play.winProbDelta > 0 ? 'text-success' : play.winProbDelta < 0 ? 'text-error' : ''
            }
          >
            {play.winProbDelta > 0 ? '+' : ''}
            {play.winProbDelta.toFixed(1)}%
          </span>
        </div>
      )}
    </div>
  );
}

export default PlayCard;
