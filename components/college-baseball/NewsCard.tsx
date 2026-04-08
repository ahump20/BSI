'use client';

import { getRelativeTime } from '@/lib/utils/timezone';

interface NewsCardProps {
  title: string;
  description: string;
  url: string;
  imageUrl?: string;
  source: 'espn' | 'highlightly' | 'bsi';
  category: string;
  publishedAt: string;
}

const SOURCE_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  espn: { bg: 'bg-[rgba(75,156,211,0.2)] border-[rgba(75,156,211,0.4)]', text: 'text-heritage-columbia', label: 'ESPN' },
  highlightly: { bg: 'bg-success/20 border-success/40', text: 'text-success', label: 'Highlightly' },
  bsi: { bg: 'bg-burnt-orange/20 border-burnt-orange/40', text: 'text-burnt-orange', label: 'BSI' },
};

const CATEGORY_STYLES: Record<string, string> = {
  scores: 'bg-bsi-primary/15 text-bsi-primary border-bsi-primary/30',
  transfers: 'bg-warning/15 text-warning border-warning/30',
  recruiting: 'bg-heritage-columbia/15 text-heritage-columbia border-heritage-columbia/30',
  editorial: 'bg-heritage-columbia/15 text-heritage-columbia border-heritage-columbia/30',
  analysis: 'bg-heritage-columbia/15 text-heritage-columbia border-heritage-columbia/30',
  rankings: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  general: 'bg-surface text-text-muted border-border-strong',
};

export function NewsCard({
  title,
  description,
  url,
  imageUrl,
  source,
  category,
  publishedAt,
}: NewsCardProps) {
  const sourceStyle = SOURCE_STYLES[source] || SOURCE_STYLES.bsi;
  const categoryStyle = CATEGORY_STYLES[category] || CATEGORY_STYLES.general;
  const relativeTime = publishedAt ? getRelativeTime(publishedAt) : '';

  return (
    <a
      href={url}
      target={url.startsWith('/') ? '_self' : '_blank'}
      rel={url.startsWith('/') ? undefined : 'noopener noreferrer'}
      className="block group"
    >
      <div className="bg-background-secondary border border-border rounded-[2px] overflow-hidden hover:border-burnt-orange/40 hover:-translate-y-0.5 transition-all duration-200">
        {/* Image header (optional) */}
        {imageUrl && (
          <div
            className="relative h-40 overflow-hidden"
            style={{ background: 'linear-gradient(135deg, rgba(107,142,35,0.15) 0%, var(--surface-dugout) 100%)' }}
          >
            <img
              src={imageUrl}
              alt={title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          </div>
        )}

        <div className="p-4">
          {/* Badges row */}
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            {/* Source badge */}
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider border ${sourceStyle.bg} ${sourceStyle.text}`}
            >
              {sourceStyle.label}
            </span>

            {/* Category tag */}
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider border ${categoryStyle}`}
            >
              {category}
            </span>

            {/* Timestamp */}
            {relativeTime && (
              <span className="text-[10px] text-text-muted ml-auto flex-shrink-0">
                {relativeTime}
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="font-semibold text-text-primary text-sm leading-snug group-hover:text-burnt-orange transition-colors line-clamp-2">
            {title}
          </h3>

          {/* Description — truncated to 2 lines */}
          {description && (
            <p className="text-text-muted text-xs leading-relaxed mt-2 line-clamp-2">
              {description}
            </p>
          )}
        </div>
      </div>
    </a>
  );
}

export default NewsCard;
