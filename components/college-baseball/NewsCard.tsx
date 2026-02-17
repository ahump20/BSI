'use client';

import React from 'react';

interface NewsCardProps {
  title: string;
  source: string;
  category: string;
  timestamp: string;
  excerpt: string;
  url?: string;
}

const sourceBadgeColors: Record<string, string> = {
  ESPN: 'bg-red-600 text-white',
  espn: 'bg-red-600 text-white',
  BSI: 'bg-burnt-orange text-white',
  bsi: 'bg-burnt-orange text-white',
  Highlightly: 'bg-blue-600 text-white',
  highlightly: 'bg-blue-600 text-white',
};

const categoryTagColors: Record<string, string> = {
  scores: 'bg-success/20 text-success border border-success/30',
  transfers: 'bg-warning/20 text-warning border border-warning/30',
  recruiting: 'bg-burnt-orange/20 text-burnt-orange border border-burnt-orange/30',
  editorial: 'bg-info/20 text-info border border-info/30',
};

function getRelativeTimestamp(timestamp: string): string {
  const now = Date.now();
  const then = new Date(timestamp).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60_000);
  const diffHrs = Math.floor(diffMs / 3_600_000);
  const diffDays = Math.floor(diffMs / 86_400_000);

  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHrs < 24) return `${diffHrs}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(timestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export function NewsCard({ title, source, category, timestamp, excerpt, url }: NewsCardProps) {
  const sourceBadge = sourceBadgeColors[source] || 'bg-text-tertiary text-white';
  const categoryTag = categoryTagColors[category] || 'bg-graphite text-text-secondary border border-border-subtle';

  const cardContent = (
    <div className="rounded-xl bg-graphite border border-border-subtle hover:border-burnt-orange transition-all p-4 md:p-5 group">
      {/* Top row: source badge, category tag, timestamp */}
      <div className="flex items-center gap-2 flex-wrap mb-3">
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${sourceBadge}`}
        >
          {source}
        </span>
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize ${categoryTag}`}
        >
          {category}
        </span>
        <span className="text-text-tertiary text-xs ml-auto whitespace-nowrap">
          {getRelativeTimestamp(timestamp)}
        </span>
      </div>

      {/* Title */}
      <h3 className="text-white font-semibold text-base md:text-lg leading-snug group-hover:text-burnt-orange transition-colors mb-2">
        {title}
      </h3>

      {/* Excerpt */}
      <p className="text-text-secondary text-sm leading-relaxed line-clamp-2">
        {excerpt}
      </p>
    </div>
  );

  if (url) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="block">
        {cardContent}
      </a>
    );
  }

  return cardContent;
}

export default NewsCard;
