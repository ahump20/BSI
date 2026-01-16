'use client';

import type { PlayFilter } from '@/lib/types/adapters';

export interface PlayByPlayFiltersProps {
  filter: PlayFilter;
  onFilterChange: (filter: PlayFilter) => void;
  playCount: number;
  className?: string;
}

const FILTER_LABELS: Record<PlayFilter, string> = {
  all: 'All Plays',
  scoring: 'Scoring',
  key: 'Key Plays',
};

export function PlayByPlayFilters({
  filter,
  onFilterChange,
  playCount,
  className = '',
}: PlayByPlayFiltersProps) {
  return (
    <div className={className}>
      {/* Filter tabs */}
      <div className="flex gap-2">
        {(['all', 'scoring', 'key'] as PlayFilter[]).map((f) => (
          <button
            key={f}
            onClick={() => onFilterChange(f)}
            className={`px-3 py-1.5 text-sm rounded transition-colors ${
              filter === f
                ? 'bg-burnt-orange text-white'
                : 'bg-white/10 text-white/70 hover:bg-white/15'
            }`}
            aria-pressed={filter === f}
          >
            {FILTER_LABELS[f]}
          </button>
        ))}
      </div>

      {/* Play count */}
      <p className="text-white/40 text-xs mt-2">
        Showing {playCount} {playCount === 1 ? 'play' : 'plays'}
      </p>
    </div>
  );
}

export default PlayByPlayFilters;
