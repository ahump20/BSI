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
  espn: { bg: 'bg-[rgba(75,156,211,0.2)] border-[rgba(75,156,211,0.4)]', text: 'text-[var(--heritage-columbia-blue)]', label: 'ESPN' },
  highlightly: { bg: 'bg-[var(--bsi-success)]/20 border-[var(--bsi-success)]/40', text: 'text-[var(--bsi-success)]', label: 'Highlightly' },
  bsi: { bg: 'bg-[var(--bsi-primary)]/20 border-[var(--bsi-primary)]/40', text: 'text-[var(--bsi-primary)]', label: 'BSI' },
};

const CATEGORY_STYLES: Record<string, string> = {
  scores: 'bg-[var(--bsi-primary)]/15 text-[var(--bsi-primary)] border-[var(--bsi-primary)]/30',
  transfers: 'bg-[var(--bsi-warning)]/15 text-[var(--bsi-warning)] border-[var(--bsi-warning)]/30',
  recruiting: 'bg-[var(--heritage-columbia-blue)]/15 text-[var(--heritage-columbia-blue)] border-[var(--heritage-columbia-blue)]/30',
  editorial: 'bg-[var(--heritage-columbia-blue)]/15 text-[var(--heritage-columbia-blue)] border-[var(--heritage-columbia-blue)]/30',
  analysis: 'bg-[var(--heritage-columbia-blue)]/15 text-[var(--heritage-columbia-blue)] border-[var(--heritage-columbia-blue)]/30',
  rankings: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  general: 'bg-surface text-[rgba(196,184,165,0.35)] border-[rgba(140,98,57,0.5)]',
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
      <div className="bg-[var(--surface-dugout)] border border-[var(--border-vintage)] rounded-[2px] overflow-hidden hover:border-[var(--bsi-primary)]/40 hover:-translate-y-0.5 transition-all duration-200">
        {/* Image header (optional) */}
        {imageUrl && (
          <div className="relative h-40 overflow-hidden bg-[var(--surface-press-box)]">
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
              <span className="text-[10px] text-[rgba(196,184,165,0.35)] ml-auto flex-shrink-0">
                {relativeTime}
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="font-semibold text-[var(--bsi-bone)] text-sm leading-snug group-hover:text-[var(--bsi-primary)] transition-colors line-clamp-2">
            {title}
          </h3>

          {/* Description — truncated to 2 lines */}
          {description && (
            <p className="text-[rgba(196,184,165,0.35)] text-xs leading-relaxed mt-2 line-clamp-2">
              {description}
            </p>
          )}
        </div>
      </div>
    </a>
  );
}

export default NewsCard;
