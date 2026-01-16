'use client';

import { useState, useMemo } from 'react';
import type { NormalizedPlay, PlayFilter, UnifiedSportKey } from '@/lib/types/adapters';
import { Card } from '@/components/ui/Card';
import { PlayByPlayFilters } from './PlayByPlayFilters';
import { PlayByPlaySection } from './PlayByPlaySection';
import { PlayCard } from './PlayCard';

export interface PlayByPlayProps {
  plays: NormalizedPlay[];
  sport: UnifiedSportKey;
  loading?: boolean;
  showFilters?: boolean;
  defaultFilter?: PlayFilter;
  defaultExpandedPeriods?: string[];
  onVideoClick?: (play: NormalizedPlay) => void;
  className?: string;
}

/**
 * Universal Play-by-Play component
 *
 * Displays play-by-play data with filtering and collapsible periods.
 * Works with any sport (MLB, NFL, NBA, College).
 */
export function PlayByPlay({
  plays,
  sport,
  loading = false,
  showFilters = true,
  defaultFilter = 'all',
  defaultExpandedPeriods = ['1'],
  onVideoClick,
  className = '',
}: PlayByPlayProps) {
  const [filter, setFilter] = useState<PlayFilter>(defaultFilter);
  const [expandedPeriods, setExpandedPeriods] = useState<Set<string>>(
    new Set(defaultExpandedPeriods)
  );

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
      const inning = Math.ceil(Number(period) / 2);
      const half = Number(period) % 2 === 1 ? 'Top' : 'Bottom';
      return `${half} ${inning}`;
    }
    if (isFootball) {
      return `Q${period}`;
    }
    // Basketball or generic
    return `Period ${period}`;
  };

  // Loading state
  if (loading) {
    return (
      <div className={`space-y-3 ${className}`}>
        <div className="skeleton w-48 h-10 rounded" />
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="skeleton w-full h-20 rounded" />
        ))}
      </div>
    );
  }

  // Empty state
  if (plays.length === 0) {
    return (
      <div className={className}>
        <Card variant="default">
          <div className="text-center py-8">
            <svg
              className="w-12 h-12 mx-auto text-white/20 mb-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <p className="text-white/50">No play-by-play data available</p>
            <p className="text-white/30 text-sm mt-1">
              Check back during the game for live updates
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Filters */}
      {showFilters && (
        <PlayByPlayFilters
          filter={filter}
          onFilterChange={setFilter}
          playCount={filteredPlays.length}
        />
      )}

      {/* Plays by period */}
      <div className="space-y-2">
        {Array.from(playsByPeriod.entries()).map(([period, periodPlays]) => (
          <PlayByPlaySection
            key={period}
            period={period}
            periodLabel={getPeriodLabel(period)}
            playCount={periodPlays.length}
            isExpanded={expandedPeriods.has(period)}
            onToggle={() => togglePeriod(period)}
          >
            {periodPlays.map((play) => (
              <PlayCard key={play.playId} play={play} onVideoClick={onVideoClick} />
            ))}
          </PlayByPlaySection>
        ))}
      </div>
    </div>
  );
}

// Loading skeleton for use in suspense boundaries
export function PlayByPlaySkeleton() {
  return (
    <div className="space-y-3">
      <div className="skeleton w-48 h-10 rounded" />
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="skeleton w-full h-20 rounded" />
      ))}
    </div>
  );
}

export default PlayByPlay;
