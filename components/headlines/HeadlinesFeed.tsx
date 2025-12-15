'use client';

import { useState } from 'react';
import type { Headline, HeadlineCategory, UnifiedSportKey } from '@/lib/types/adapters';
import { Card } from '@/components/ui/Card';
import { HeadlineCard, HeadlineCardSkeleton } from './HeadlineCard';

export interface HeadlinesFeedProps {
  headlines: Headline[];
  loading?: boolean;
  title?: string;
  layout?: 'list' | 'featured' | 'mixed';
  maxItems?: number;
  showFilters?: boolean;
  sport?: UnifiedSportKey;
  onHeadlineClick?: (headline: Headline) => void;
  onViewAll?: () => void;
  className?: string;
}

const CATEGORY_FILTERS: { value: HeadlineCategory | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'BREAKING', label: 'Breaking' },
  { value: 'INJURY', label: 'Injuries' },
  { value: 'TRADE', label: 'Trades' },
  { value: 'SCORE', label: 'Scores' },
  { value: 'ANALYSIS', label: 'Analysis' },
];

export function HeadlinesFeed({
  headlines,
  loading = false,
  title = 'Latest Headlines',
  layout = 'list',
  maxItems,
  showFilters = false,
  sport,
  onHeadlineClick,
  onViewAll,
  className = '',
}: HeadlinesFeedProps) {
  const [categoryFilter, setCategoryFilter] = useState<HeadlineCategory | 'ALL'>('ALL');

  // Filter headlines
  const filteredHeadlines = headlines.filter((h) => {
    if (categoryFilter !== 'ALL' && h.category !== categoryFilter) return false;
    if (sport && h.sport !== sport) return false;
    return true;
  });

  const displayHeadlines = maxItems ? filteredHeadlines.slice(0, maxItems) : filteredHeadlines;
  const hasMore = maxItems ? filteredHeadlines.length > maxItems : false;

  // Loading state
  if (loading) {
    return (
      <div className={className}>
        {title && <h3 className="text-white font-semibold mb-3">{title}</h3>}
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <HeadlineCardSkeleton
              key={i}
              variant={layout === 'featured' ? 'featured' : 'default'}
            />
          ))}
        </div>
      </div>
    );
  }

  // Empty state
  if (headlines.length === 0) {
    return (
      <div className={className}>
        {title && <h3 className="text-white font-semibold mb-3">{title}</h3>}
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
                d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
              />
            </svg>
            <p className="text-white/50">No headlines available</p>
            <p className="text-white/30 text-sm mt-1">Check back later for the latest news</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        {title && <h3 className="text-white font-semibold">{title}</h3>}
        {hasMore && onViewAll && (
          <button
            onClick={onViewAll}
            className="text-burnt-orange text-sm hover:text-burnt-orange/80 transition-colors"
          >
            View all →
          </button>
        )}
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
          {CATEGORY_FILTERS.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setCategoryFilter(filter.value)}
              className={`px-3 py-1 text-xs rounded-full whitespace-nowrap transition-colors ${
                categoryFilter === filter.value
                  ? 'bg-burnt-orange text-white'
                  : 'bg-white/10 text-white/60 hover:bg-white/20'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      )}

      {/* Headlines List */}
      {layout === 'featured' && displayHeadlines.length > 0 && (
        <div className="space-y-4">
          {/* Featured headline */}
          <HeadlineCard
            headline={displayHeadlines[0]}
            variant="featured"
            onClick={() => onHeadlineClick?.(displayHeadlines[0])}
          />
          {/* Rest as compact */}
          {displayHeadlines.slice(1).map((headline) => (
            <HeadlineCard
              key={headline.id}
              headline={headline}
              variant="compact"
              onClick={() => onHeadlineClick?.(headline)}
            />
          ))}
        </div>
      )}

      {layout === 'mixed' && displayHeadlines.length > 0 && (
        <div className="space-y-4">
          {/* Top 2 as featured */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {displayHeadlines.slice(0, 2).map((headline) => (
              <HeadlineCard
                key={headline.id}
                headline={headline}
                variant="featured"
                onClick={() => onHeadlineClick?.(headline)}
              />
            ))}
          </div>
          {/* Rest as list */}
          <div className="space-y-2">
            {displayHeadlines.slice(2).map((headline) => (
              <HeadlineCard
                key={headline.id}
                headline={headline}
                variant="default"
                onClick={() => onHeadlineClick?.(headline)}
              />
            ))}
          </div>
        </div>
      )}

      {layout === 'list' && (
        <div className="space-y-2">
          {displayHeadlines.map((headline) => (
            <HeadlineCard
              key={headline.id}
              headline={headline}
              variant="default"
              onClick={() => onHeadlineClick?.(headline)}
            />
          ))}
        </div>
      )}

      {/* No results after filtering */}
      {filteredHeadlines.length === 0 && headlines.length > 0 && (
        <Card variant="default">
          <div className="text-center py-6">
            <p className="text-white/50">No headlines match this filter</p>
            <button
              onClick={() => setCategoryFilter('ALL')}
              className="text-burnt-orange text-sm mt-2 hover:text-burnt-orange/80"
            >
              Clear filter
            </button>
          </div>
        </Card>
      )}

      {/* View all button (mobile) */}
      {hasMore && onViewAll && (
        <button
          onClick={onViewAll}
          className="w-full mt-4 py-2 text-burnt-orange text-sm border border-burnt-orange/30 rounded hover:bg-burnt-orange/10 transition-colors md:hidden"
        >
          View all headlines
        </button>
      )}
    </div>
  );
}

// Loading skeleton
export function HeadlinesFeedSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <HeadlineCardSkeleton key={i} />
      ))}
    </div>
  );
}

export default HeadlinesFeed;
