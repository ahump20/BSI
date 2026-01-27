'use client';

import type { JSX } from 'react';
import { useRecentSearches } from '@/lib/hooks/useRecentSearches';

interface RecentSearchesProps {
  onSelect: (query: string) => void;
  className?: string;
}

export function RecentSearches({
  onSelect,
  className = '',
}: RecentSearchesProps): JSX.Element | null {
  const { recentSearches, removeSearch, clearSearches } = useRecentSearches();

  if (recentSearches.length === 0) {
    return null;
  }

  return (
    <div className={`${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-text-secondary">Recent Searches</h3>
        <button
          onClick={clearSearches}
          className="text-xs text-text-tertiary hover:text-text-secondary transition-colors"
        >
          Clear all
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {recentSearches.map((search) => (
          <div key={search.query} className="group flex items-center gap-1">
            <button
              onClick={() => onSelect(search.query)}
              className="px-3 py-1.5 bg-bg-tertiary rounded-lg text-sm text-text-secondary hover:bg-burnt-orange/20 hover:text-burnt-orange transition-colors"
            >
              {search.query}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                removeSearch(search.query);
              }}
              className="w-5 h-5 flex items-center justify-center rounded-full text-text-tertiary hover:bg-error/20 hover:text-error opacity-0 group-hover:opacity-100 transition-all"
              aria-label={`Remove ${search.query} from recent searches`}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
