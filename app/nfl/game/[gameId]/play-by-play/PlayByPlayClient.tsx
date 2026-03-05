'use client';

import { useState, useMemo } from 'react';
import { useGameData, type Play } from '../layout';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { getQuarterLabel } from '@/lib/utils/game-helpers';

/**
 * Play-by-Play Page
 *
 * Displays plays organized by quarter with scoring play filters.
 * ESPN plays shape: [{id, text, period: {number}, clock: {displayValue}, scoringPlay, scoreValue, homeScore, awayScore, team, start, end, statYardage}]
 */

export default function PlayByPlayClient() {
  const { game, loading, error } = useGameData();
  const [filter, setFilter] = useState<'all' | 'scoring'>('all');
  const [expandedQuarters, setExpandedQuarters] = useState<Set<number>>(new Set([1]));

  const plays = useMemo(() => (game?.plays || []) as Play[], [game?.plays]);

  // Filter plays
  const filteredPlays = useMemo(() => {
    if (filter === 'scoring') {
      return plays.filter((p) => p.scoringPlay);
    }
    return plays;
  }, [plays, filter]);

  // Group plays by quarter
  const playsByQuarter = useMemo(() => {
    const groups: Record<number, Play[]> = {};
    filteredPlays.forEach((play) => {
      const q = play.period?.number || 1;
      if (!groups[q]) groups[q] = [];
      groups[q].push(play);
    });
    return groups;
  }, [filteredPlays]);

  if (loading || error || !game) {
    return null; // Layout handles loading/error states
  }

  const homeTeam = game.competitors?.find((c) => c.homeAway === 'home');
  const awayTeam = game.competitors?.find((c) => c.homeAway === 'away');

  const toggleQuarter = (q: number) => {
    const next = new Set(expandedQuarters);
    if (next.has(q)) {
      next.delete(q);
    } else {
      next.add(q);
    }
    setExpandedQuarters(next);
  };

  const scoringCount = plays.filter((p) => p.scoringPlay).length;

  // No plays available
  if (plays.length === 0) {
    return (
      <Card variant="default" padding="lg">
        <div className="text-center py-8">
          <svg
            viewBox="0 0 24 24"
            className="w-16 h-16 text-text-tertiary mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14,2 14,8 20,8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10,9 9,9 8,9" />
          </svg>
          <p className="text-text-secondary">Play-by-play data not available yet</p>
          <p className="text-text-tertiary text-sm mt-2">
            Live play updates will appear here once the game begins
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-4 mb-6">
        <span className="text-text-tertiary text-sm">Filter:</span>
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-burnt-orange text-white'
                : 'bg-background-tertiary text-text-secondary hover:bg-surface-medium'
            }`}
          >
            All Plays ({plays.length})
          </button>
          <button
            onClick={() => setFilter('scoring')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'scoring'
                ? 'bg-burnt-orange text-white'
                : 'bg-background-tertiary text-text-secondary hover:bg-surface-medium'
            }`}
          >
            Scoring ({scoringCount})
          </button>
        </div>
      </div>

      {/* Plays by Quarter */}
      <div className="space-y-2">
        {Object.entries(playsByQuarter)
          .sort(([a], [b]) => Number(a) - Number(b))
          .map(([quarter, quarterPlays]) => {
            const q = Number(quarter);
            const isExpanded = expandedQuarters.has(q);
            const qScoringCount = quarterPlays.filter((p) => p.scoringPlay).length;

            return (
              <Card key={q} variant="default" padding="none">
                {/* Quarter Header */}
                <button
                  onClick={() => toggleQuarter(q)}
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-surface-light transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-burnt-orange font-semibold uppercase text-sm tracking-wide">
                      {getQuarterLabel(q)}
                    </span>
                    {qScoringCount > 0 && (
                      <Badge variant="success" size="sm">
                        {qScoringCount} scoring play{qScoringCount > 1 ? 's' : ''}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-text-tertiary text-sm">{quarterPlays.length} plays</span>
                    <svg
                      viewBox="0 0 24 24"
                      className={`w-5 h-5 text-text-tertiary transition-transform ${
                        isExpanded ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </div>
                </button>

                {/* Plays List */}
                {isExpanded && (
                  <div className="border-t border-border-subtle">
                    {quarterPlays.map((play, idx) => (
                      <div
                        key={play.id || idx}
                        className={`px-4 py-3 border-b border-border-subtle last:border-0 ${
                          play.scoringPlay
                            ? 'bg-burnt-orange/10 border-l-4 border-l-burnt-orange'
                            : ''
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            {/* Down and distance context */}
                            {play.start?.down && (
                              <p className="text-xs text-text-tertiary mb-1">
                                {play.start.down}
                                {play.start.down === 1
                                  ? 'st'
                                  : play.start.down === 2
                                    ? 'nd'
                                    : play.start.down === 3
                                      ? 'rd'
                                      : 'th'}
                                {play.start.distance ? ` & ${play.start.distance}` : ''}
                                {play.start.yardLine
                                  ? ` at ${play.team?.abbreviation || ''} ${play.start.yardLine}`
                                  : ''}
                              </p>
                            )}
                            <p className="text-text-secondary text-sm">
                              {play.text || play.shortText || 'Play'}
                            </p>
                            {play.scoringPlay && (
                              <div className="mt-2 flex items-center gap-3">
                                {play.scoreValue && (
                                  <Badge variant="primary" size="sm">
                                    +{play.scoreValue} pt{play.scoreValue > 1 ? 's' : ''}
                                  </Badge>
                                )}
                                <span className="text-xs text-text-tertiary">
                                  Score: {awayTeam?.team?.abbreviation} {play.awayScore} -{' '}
                                  {homeTeam?.team?.abbreviation} {play.homeScore}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            {play.clock?.displayValue && (
                              <span className="text-xs text-text-tertiary font-mono whitespace-nowrap">
                                {play.clock.displayValue}
                              </span>
                            )}
                            {play.statYardage !== undefined && play.statYardage !== 0 && (
                              <span
                                className={`text-xs font-mono ${
                                  play.statYardage > 0 ? 'text-success' : 'text-error'
                                }`}
                              >
                                {play.statYardage > 0 ? '+' : ''}
                                {play.statYardage} yds
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            );
          })}
      </div>

      {/* No results for filter */}
      {filteredPlays.length === 0 && filter === 'scoring' && (
        <Card variant="default" padding="lg">
          <div className="text-center py-6">
            <p className="text-text-secondary">No scoring plays yet</p>
            <p className="text-text-tertiary text-sm mt-1">
              Defense is winning this one so far
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
