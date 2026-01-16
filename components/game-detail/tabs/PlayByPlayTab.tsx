'use client';

import { useState, useMemo } from 'react';
import type { PlayByPlayTabProps } from '../GameDetailModal.types';
import type { PlayFilter, NormalizedPlay } from '@/lib/types/adapters';
import { Card } from '@/components/ui/Card';

export function PlayByPlayTab({ plays, sport, loading }: PlayByPlayTabProps) {
  const [filter, setFilter] = useState<PlayFilter>('all');
  const [expandedPeriods, setExpandedPeriods] = useState<Set<string>>(new Set(['1']));

  // Filter plays based on selected filter
  const filteredPlays = useMemo(() => {
    switch (filter) {
      case 'scoring':
        return plays.filter((p) => p.isScoring);
      case 'key':
        return plays.filter((p) => p.isKeyPlay);
      default:
        return plays;
    }
  }, [plays, filter]);

  // Group plays by period
  const playsByPeriod = useMemo(() => {
    const groups = new Map<string, NormalizedPlay[]>();

    filteredPlays.forEach((play) => {
      const periodKey = String(play.period);
      if (!groups.has(periodKey)) {
        groups.set(periodKey, []);
      }
      groups.get(periodKey)!.push(play);
    });

    return groups;
  }, [filteredPlays]);

  // Toggle period expansion
  const togglePeriod = (period: string) => {
    const newExpanded = new Set(expandedPeriods);
    if (newExpanded.has(period)) {
      newExpanded.delete(period);
    } else {
      newExpanded.add(period);
    }
    setExpandedPeriods(newExpanded);
  };

  // Get period label based on sport
  const getPeriodLabel = (period: string) => {
    const isBaseball = sport === 'mlb' || sport === 'cbb';
    const isFootball = sport === 'nfl' || sport === 'ncaaf';

    if (isBaseball) {
      return `${Number(period) % 2 === 1 ? 'Top' : 'Bot'} ${Math.ceil(Number(period) / 2)}`;
    }
    if (isFootball) {
      return `Q${period}`;
    }
    return `Period ${period}`;
  };

  // Loading state
  if (loading) {
    return (
      <div className="p-4 space-y-3">
        <div className="skeleton w-full h-10 rounded" />
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="skeleton w-full h-20 rounded" />
        ))}
      </div>
    );
  }

  // Empty state
  if (plays.length === 0) {
    return (
      <div className="p-4">
        <Card variant="default">
          <div className="text-center py-8">
            <p className="text-white/50">No play-by-play data available</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Filter tabs */}
      <div className="flex gap-2">
        {(['all', 'scoring', 'key'] as PlayFilter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 text-sm rounded transition-colors ${
              filter === f
                ? 'bg-burnt-orange text-white'
                : 'bg-white/10 text-white/70 hover:bg-white/15'
            }`}
          >
            {f === 'all' ? 'All Plays' : f === 'scoring' ? 'Scoring' : 'Key Plays'}
          </button>
        ))}
      </div>

      {/* Play count */}
      <p className="text-white/40 text-xs">
        Showing {filteredPlays.length} {filteredPlays.length === 1 ? 'play' : 'plays'}
      </p>

      {/* Plays by period */}
      <div className="space-y-2">
        {Array.from(playsByPeriod.entries()).map(([period, periodPlays]) => (
          <Card key={period} variant="default" padding="none">
            {/* Period header */}
            <button
              onClick={() => togglePeriod(period)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors"
            >
              <span className="text-sm font-semibold text-white">{getPeriodLabel(period)}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-white/50">{periodPlays.length} plays</span>
                <svg
                  className={`w-4 h-4 text-white/50 transition-transform ${
                    expandedPeriods.has(period) ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </button>

            {/* Period plays */}
            {expandedPeriods.has(period) && (
              <div className="border-t border-white/10">
                {periodPlays.map((play) => (
                  <PlayCard key={play.playId} play={play} />
                ))}
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}

// Individual play card
function PlayCard({ play }: { play: NormalizedPlay }) {
  return (
    <div
      className={`px-4 py-3 border-b border-white/5 last:border-0 ${
        play.isScoring ? 'bg-burnt-orange/10 border-l-2 border-l-burnt-orange' : ''
      }`}
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
      {play.videoUrl && (
        <button className="mt-2 flex items-center gap-1 text-xs text-burnt-orange hover:text-burnt-orange/80 transition-colors">
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
