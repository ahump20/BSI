'use client';

import { useState, useMemo } from 'react';
import { useGameData } from '../layout';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

/**
 * College Baseball Play-by-Play Page
 *
 * Displays all plays organized by inning with scoring plays highlighted.
 */
export default function CollegePlayByPlayClient() {
  const { game, loading, error } = useGameData();
  const [filter, setFilter] = useState<'all' | 'scoring'>('all');
  const [expandedInnings, setExpandedInnings] = useState<Set<string>>(new Set(['1']));

  // Memoize to ensure stable reference when game?.plays is undefined
  const plays = useMemo(() => game?.plays || [], [game?.plays]);

  // Filter plays
  const filteredPlays = useMemo(() => {
    if (filter === 'scoring') {
      return plays.filter((p) => p.isScoring);
    }
    return plays;
  }, [plays, filter]);

  // Group plays by inning
  const playsByInning = useMemo(() => {
    const groups: Record<string, typeof plays> = {};
    filteredPlays.forEach((play) => {
      const key = `${play.halfInning === 'top' ? 'Top' : 'Bot'} ${play.inning}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(play);
    });
    return groups;
  }, [filteredPlays]);

  if (loading || error || !game) {
    return null; // Layout handles loading/error states
  }

  const toggleInning = (inning: string) => {
    const newExpanded = new Set(expandedInnings);
    if (newExpanded.has(inning)) {
      newExpanded.delete(inning);
    } else {
      newExpanded.add(inning);
    }
    setExpandedInnings(newExpanded);
  };

  // No plays available
  if (plays.length === 0) {
    return (
      <Card variant="default" padding="lg">
        <div className="text-center py-8">
          <svg
            viewBox="0 0 24 24"
            className="w-16 h-16 text-[rgba(196,184,165,0.5)] mx-auto mb-4"
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
          <p className="text-[var(--bsi-dust)]">Play-by-play data not available yet.</p>
          <p className="text-[rgba(196,184,165,0.5)] text-sm mt-2">
            When the game starts, every pitch, every swing, every play shows up here—the kind of
            detail ESPN can't be bothered to track for college baseball.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-4 mb-6">
        <span className="text-[rgba(196,184,165,0.5)] text-sm">Filter:</span>
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-sm text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-[var(--bsi-primary)] text-white'
                : 'bg-[var(--surface-dugout)] text-[var(--bsi-dust)] hover:bg-[var(--surface-press-box)]'
            }`}
          >
            All Plays ({plays.length})
          </button>
          <button
            onClick={() => setFilter('scoring')}
            className={`px-4 py-2 rounded-sm text-sm font-medium transition-colors ${
              filter === 'scoring'
                ? 'bg-[var(--bsi-primary)] text-white'
                : 'bg-[var(--surface-dugout)] text-[var(--bsi-dust)] hover:bg-[var(--surface-press-box)]'
            }`}
          >
            Scoring ({plays.filter((p) => p.isScoring).length})
          </button>
        </div>
      </div>

      {/* Plays by Inning */}
      <div className="space-y-2">
        {Object.entries(playsByInning).map(([inning, inningPlays]) => {
          const isExpanded = expandedInnings.has(inning);
          const scoringCount = inningPlays.filter((p) => p.isScoring).length;

          return (
            <Card key={inning} variant="default" padding="none">
              {/* Inning Header */}
              <button
                onClick={() => toggleInning(inning)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-[var(--surface-press-box)] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-[var(--bsi-primary)] font-semibold uppercase text-sm tracking-wide">
                    {inning}
                  </span>
                  {scoringCount > 0 && (
                    <Badge variant="success" size="sm">
                      {scoringCount} run{scoringCount > 1 ? 's' : ''}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[rgba(196,184,165,0.5)] text-sm">{inningPlays.length} plays</span>
                  <svg
                    viewBox="0 0 24 24"
                    className={`w-5 h-5 text-[rgba(196,184,165,0.5)] transition-transform ${
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
                <div className="border-t border-[var(--border-vintage)]">
                  {inningPlays.map((play) => (
                    <div
                      key={play.id}
                      className={`px-4 py-3 border-b border-[var(--border-vintage)] last:border-0 ${
                        play.isScoring ? 'bg-[var(--bsi-primary)]/10 border-l-4 border-l-burnt-orange' : ''
                      }`}
                    >
                      <p className="text-[var(--bsi-dust)] text-sm">{play.description}</p>
                      {play.isScoring && (
                        <div className="mt-2 flex items-center gap-3">
                          <Badge variant="primary" size="sm">
                            +{play.runsScored} Run{play.runsScored > 1 ? 's' : ''}
                          </Badge>
                          <span className="text-xs text-[rgba(196,184,165,0.5)]">
                            Score: {game?.teams.away.abbreviation} {play.scoreAfter.away} -{' '}
                            {game?.teams.home.abbreviation} {play.scoreAfter.home}
                          </span>
                        </div>
                      )}
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
            <p className="text-[var(--bsi-dust)]">No scoring plays yet.</p>
            <p className="text-[rgba(196,184,165,0.5)] text-sm mt-1">
              Some of the best college games are pitcher's duels. Patience.
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
