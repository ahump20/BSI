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
  espn: { bg: 'bg-[#004C97]/20 border-[#004C97]/40', text: 'text-[#4A90D9]', label: 'ESPN' },
  highlightly: { bg: 'bg-emerald-500/20 border-emerald-500/40', text: 'text-emerald-400', label: 'Highlightly' },
  bsi: { bg: 'bg-burnt-orange/20 border-burnt-orange/40', text: 'text-burnt-orange', label: 'BSI' },
};

const CATEGORY_STYLES: Record<string, string> = {
  scores: 'bg-green-500/15 text-green-400 border-green-500/30',
  transfers: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  recruiting: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  editorial: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  analysis: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
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
      <div className="bg-background-secondary border border-border rounded-xl overflow-hidden hover:border-burnt-orange/40 hover:-translate-y-0.5 transition-all duration-200">
        {/* Image header (optional) */}
        {imageUrl && (
          <div className="relative h-40 overflow-hidden bg-surface-light">
            <img
              src={imageUrl}
              alt=""
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
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
