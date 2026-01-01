'use client';

import { cn } from '@/lib/utils';

export interface StarRatingProps {
  stars: number;
  maxStars?: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

const sizeMap = {
  sm: 'w-3 h-3',
  md: 'w-3.5 h-3.5',
  lg: 'w-4 h-4',
};

export function StarRating({
  stars,
  maxStars = 5,
  size = 'md',
  showLabel = false,
  className,
}: StarRatingProps) {
  const iconSize = sizeMap[size];

  return (
    <div className={cn('flex items-center gap-0.5', className)}>
      {[...Array(maxStars)].map((_, i) => (
        <svg
          key={i}
          className={cn(
            iconSize,
            'transition-all duration-300',
            i < stars
              ? 'text-gold fill-gold drop-shadow-[0_0_4px_rgba(201,162,39,0.5)]'
              : 'text-charcoal-600 fill-charcoal-600'
          )}
          viewBox="0 0 24 24"
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
      {showLabel && (
        <span className="ml-1 text-xs text-text-muted">
          {stars}-Star
        </span>
      )}
    </div>
  );
}

// Elite badge for 5-star recruits
export function EliteBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full',
        'text-[10px] font-bold uppercase tracking-wide',
        'bg-gradient-to-r from-gold/20 to-gold/10',
        'text-gold border border-gold/30',
        'shadow-[0_0_8px_rgba(201,162,39,0.2)]',
        className
      )}
    >
      <svg className="w-3 h-3 fill-gold" viewBox="0 0 24 24">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
      Elite
    </span>
  );
}
