'use client';

import type { Headline, HeadlineSource, HeadlineCategory } from '@/lib/types/adapters';

export interface HeadlineCardProps {
  headline: Headline;
  variant?: 'default' | 'compact' | 'featured';
  showImage?: boolean;
  showSource?: boolean;
  onClick?: () => void;
  className?: string;
}

const SOURCE_COLORS: Record<HeadlineSource, string> = {
  ESPN: 'text-red-400',
  ATHLETIC: 'text-orange-400',
  MLB: 'text-blue-400',
  NFL: 'text-green-400',
  NCAA: 'text-purple-400',
  BSI: 'text-burnt-orange',
  AP: 'text-white/60',
  CUSTOM: 'text-white/50',
};

const CATEGORY_BADGES: Record<HeadlineCategory, { label: string; color: string }> = {
  BREAKING: { label: 'BREAKING', color: 'bg-red-600 text-white' },
  INJURY: { label: 'INJURY', color: 'bg-yellow-600 text-black' },
  TRADE: { label: 'TRADE', color: 'bg-purple-600 text-white' },
  SCORE: { label: 'SCORE', color: 'bg-green-600 text-white' },
  PREVIEW: { label: 'PREVIEW', color: 'bg-blue-600 text-white' },
  RECAP: { label: 'RECAP', color: 'bg-gray-600 text-white' },
  ANALYSIS: { label: 'ANALYSIS', color: 'bg-burnt-orange text-white' },
  GENERAL: { label: '', color: '' },
};

function formatRelativeTime(timestamp: string): string {
  const now = new Date();
  const then = new Date(timestamp);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return then.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function HeadlineCard({
  headline,
  variant = 'default',
  showImage = true,
  showSource = true,
  onClick,
  className = '',
}: HeadlineCardProps) {
  const categoryBadge = CATEGORY_BADGES[headline.category];
  const isClickable = !!onClick || !!headline.url;

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (headline.url) {
      window.open(headline.url, '_blank', 'noopener,noreferrer');
    }
  };

  if (variant === 'compact') {
    return (
      <button
        onClick={handleClick}
        disabled={!isClickable}
        className={`w-full text-left flex items-start gap-3 p-2 rounded hover:bg-white/5 transition-colors ${className}`}
      >
        {headline.category !== 'GENERAL' && categoryBadge.label && (
          <span
            className={`px-1.5 py-0.5 text-[10px] font-bold rounded shrink-0 ${categoryBadge.color}`}
          >
            {categoryBadge.label}
          </span>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm line-clamp-2">{headline.title}</p>
          <div className="flex items-center gap-2 mt-1 text-xs text-white/40">
            {showSource && (
              <span className={SOURCE_COLORS[headline.source]}>{headline.source}</span>
            )}
            <span>{formatRelativeTime(headline.publishedAt)}</span>
          </div>
        </div>
      </button>
    );
  }

  if (variant === 'featured') {
    return (
      <button
        onClick={handleClick}
        disabled={!isClickable}
        className={`w-full text-left group relative overflow-hidden rounded-lg ${className}`}
      >
        {showImage && headline.imageUrl ? (
          <div className="aspect-video relative">
            <img
              src={headline.imageUrl}
              alt={headline.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
          </div>
        ) : (
          <div className="aspect-video bg-charcoal" />
        )}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          {headline.category !== 'GENERAL' && categoryBadge.label && (
            <span
              className={`inline-block px-2 py-1 text-xs font-bold rounded mb-2 ${categoryBadge.color}`}
            >
              {categoryBadge.label}
            </span>
          )}
          <h3 className="text-white font-semibold text-lg line-clamp-2 group-hover:text-burnt-orange transition-colors">
            {headline.title}
          </h3>
          {headline.summary && (
            <p className="text-white/60 text-sm mt-1 line-clamp-2">{headline.summary}</p>
          )}
          <div className="flex items-center gap-2 mt-2 text-xs text-white/40">
            {showSource && (
              <span className={SOURCE_COLORS[headline.source]}>{headline.source}</span>
            )}
            <span>{formatRelativeTime(headline.publishedAt)}</span>
          </div>
        </div>
      </button>
    );
  }

  // Default variant
  return (
    <button
      onClick={handleClick}
      disabled={!isClickable}
      className={`w-full text-left group flex gap-3 p-3 rounded-lg bg-charcoal/50 hover:bg-charcoal transition-colors ${className}`}
    >
      {showImage && headline.imageUrl && (
        <div className="w-20 h-14 rounded overflow-hidden shrink-0">
          <img
            src={headline.imageUrl}
            alt=""
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2">
          {headline.category !== 'GENERAL' && categoryBadge.label && (
            <span
              className={`px-1.5 py-0.5 text-[10px] font-bold rounded shrink-0 ${categoryBadge.color}`}
            >
              {categoryBadge.label}
            </span>
          )}
          <h4 className="text-white text-sm font-medium line-clamp-2 group-hover:text-burnt-orange transition-colors">
            {headline.title}
          </h4>
        </div>
        <div className="flex items-center gap-2 mt-1 text-xs text-white/40">
          {showSource && <span className={SOURCE_COLORS[headline.source]}>{headline.source}</span>}
          <span>{formatRelativeTime(headline.publishedAt)}</span>
          {headline.author && <span>• {headline.author}</span>}
        </div>
      </div>
    </button>
  );
}

export function HeadlineCardSkeleton({
  variant = 'default',
}: {
  variant?: 'default' | 'compact' | 'featured';
}) {
  if (variant === 'compact') {
    return (
      <div className="flex items-start gap-3 p-2">
        <div className="skeleton w-16 h-4 rounded" />
        <div className="flex-1">
          <div className="skeleton w-full h-4 rounded mb-1" />
          <div className="skeleton w-24 h-3 rounded" />
        </div>
      </div>
    );
  }

  if (variant === 'featured') {
    return <div className="aspect-video skeleton rounded-lg" />;
  }

  return (
    <div className="flex gap-3 p-3 bg-charcoal/50 rounded-lg">
      <div className="skeleton w-20 h-14 rounded" />
      <div className="flex-1">
        <div className="skeleton w-full h-4 rounded mb-2" />
        <div className="skeleton w-3/4 h-4 rounded mb-2" />
        <div className="skeleton w-24 h-3 rounded" />
      </div>
    </div>
  );
}

export default HeadlineCard;
