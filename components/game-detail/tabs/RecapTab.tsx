'use client';

import type { RecapTabProps } from '../GameDetailModal.types';
import { Card } from '@/components/ui/Card';

export function RecapTab({ recap, game, loading }: RecapTabProps) {
  // Loading state
  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <div className="skeleton w-3/4 h-8 rounded" />
        <div className="skeleton w-full h-4 rounded" />
        <div className="skeleton w-full h-4 rounded" />
        <div className="skeleton w-2/3 h-4 rounded" />
      </div>
    );
  }

  // No recap available for non-final games
  if (game.status !== 'FINAL') {
    return (
      <div className="p-4">
        <Card variant="default">
          <div className="text-center py-8">
            <p className="text-white/50">Recap available after game ends</p>
          </div>
        </Card>
      </div>
    );
  }

  // No recap data
  if (!recap) {
    return (
      <div className="p-4">
        <Card variant="default">
          <div className="text-center py-8">
            <p className="text-white/50">Recap not available yet</p>
            <p className="text-white/30 text-sm mt-1">Check back soon</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Headline */}
      <Card variant="default">
        <h2 className="text-xl font-bold text-white mb-3">{recap.headline}</h2>
        <p className="text-white/70 leading-relaxed">{recap.summary}</p>

        {/* Source attribution */}
        {recap.source && (
          <div className="mt-4 pt-3 border-t border-white/10">
            <p className="text-xs text-white/40">
              Source: {recap.source}
              {recap.sourceUrl && (
                <a
                  href={recap.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-2 text-burnt-orange hover:underline"
                >
                  Read more
                </a>
              )}
            </p>
          </div>
        )}
      </Card>

      {/* MVP/Star of the Game */}
      {recap.mvp && (
        <Card variant="default" className="border border-burnt-orange/20">
          <div className="flex items-center gap-3">
            {recap.mvp.headshotUrl ? (
              <img
                src={recap.mvp.headshotUrl}
                alt={recap.mvp.player}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-burnt-orange/20 flex items-center justify-center">
                <span className="text-burnt-orange font-bold">MVP</span>
              </div>
            )}
            <div>
              <p className="text-xs text-burnt-orange font-semibold">Player of the Game</p>
              <p className="text-white font-semibold">{recap.mvp.player}</p>
              <p className="text-white/50 text-sm">{recap.mvp.team}</p>
              <p className="text-white/70 text-sm mt-1">{recap.mvp.statLine}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Key Plays */}
      {recap.keyPlays.length > 0 && (
        <Card variant="default">
          <h3 className="text-sm font-semibold text-white/70 mb-3">Key Plays</h3>
          <div className="space-y-3">
            {recap.keyPlays.map((play, index) => (
              <div
                key={play.playId}
                className={`p-3 rounded ${
                  play.isScoring
                    ? 'bg-burnt-orange/10 border-l-2 border-burnt-orange'
                    : 'bg-white/5'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-5 h-5 rounded-full bg-charcoal flex items-center justify-center text-xs text-white/50">
                    {index + 1}
                  </span>
                  <span className="text-xs text-white/50">{play.gameTime}</span>
                  {play.team && (
                    <span className="text-xs text-white/70 font-medium">
                      {play.team.abbreviation}
                    </span>
                  )}
                </div>
                <p className="text-white/90 text-sm">{play.description}</p>
                {play.isScoring && (
                  <p className="text-burnt-orange text-xs mt-1">
                    Score: {play.scoreAfter.away} - {play.scoreAfter.home}
                  </p>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
