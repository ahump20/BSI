'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { ScrollReveal } from '@/components/cinematic';
import { useSportData } from '@/lib/hooks/useSportData';
import { Badge } from '@/components/ui/Badge';
import { formatDateInTimezone } from '@/lib/utils/timezone';
import {
  type Editorial,
  type EditorialListResponse,
  getEditorialHref,
  readTime,
} from '@/lib/editorial';

function formatDate(dateStr: string): string {
  return formatDateInTimezone(dateStr + 'T12:00:00', undefined, 'compact');
}

// ────────────────────────────────────────
// Hardcoded fallback — used when API is down
// ────────────────────────────────────────

const FALLBACK_ARTICLES: Editorial[] = [
  {
    id: 0,
    slug: 'week-5-conference-play-opens',
    date: '2026-03-11',
    title: 'Week 5: Conference Play Opens, Early Standings Already Shifting',
    preview: 'SEC, Big 12, ACC, and Pac-12 all played meaningful conference openers this weekend. Early series results already separate the contenders.',
    teams: [],
    wordCount: 3400,
    createdAt: '2026-03-11',
  },
  {
    id: 1,
    slug: 'weekend-4-recap-conference-stakes',
    date: '2026-03-10',
    title: 'Weekend 4 Recap: Conference Stakes Arrive Early',
    preview: 'The first full weekend of league play produced series wins that will matter in June. Several Top 25 teams stumbled in their conference debuts.',
    teams: [],
    wordCount: 3600,
    createdAt: '2026-03-10',
  },
  {
    id: 2,
    slug: 'sec-big12-opening-weekend',
    date: '2026-03-10',
    title: 'SEC and Big 12 Opening Weekend: Who Established Early Dominance',
    preview: 'Conference openers reveal rotation depth. The teams that swept are ahead of schedule; the teams that got swept have work to do.',
    teams: [],
    wordCount: 3800,
    createdAt: '2026-03-10',
  },
  {
    id: 3,
    slug: 'mid-major-watch-week-5',
    date: '2026-03-11',
    title: 'Mid-Major Watch: Week 5 Programs Building RPI Résumés',
    preview: 'While the Power conferences opened league play, mid-majors kept stacking non-conference wins. These programs are building postseason cases in March.',
    teams: [],
    wordCount: 2400,
    createdAt: '2026-03-11',
  },
];

// ────────────────────────────────────────
// Component
// ────────────────────────────────────────

/**
 * EditorialPreview — D1-backed dynamic editorial feed for the homepage.
 * Heritage vintage magazine spread: full-width featured card with corner marks,
 * Oswald headline, Cormorant excerpt, heritage-stamp category kicker,
 * supporting articles with sport-color left accent bar.
 */
export function EditorialPreview() {
  const { data, loading, error } = useSportData<EditorialListResponse>(
    '/api/college-baseball/editorial/list',
    { refreshInterval: 300_000 }, // 5 min
  );

  const articles = useMemo(() => {
    return data?.editorials && data.editorials.length > 0
      ? data.editorials
      : null;
  }, [data]);

  const displayArticles = articles || FALLBACK_ARTICLES;
  const isUsingFallback = !articles;
  const [featured, ...rest] = displayArticles;
  const secondary = rest.slice(0, 3);
  const articleCount = articles?.length ?? null;
  const fetchedAt = data?.meta?.fetched_at;

  // Loading skeleton
  if (loading && !articles) {
    return (
      <section className="py-16 px-4 sm:px-6 lg:px-8" style={{ background: 'var(--surface-dugout)' }}>
        <div className="max-w-5xl mx-auto">
          <div className="mb-10">
            <div className="h-3 w-20 bg-surface rounded mb-4 animate-pulse" />
            <div className="h-8 w-48 bg-surface rounded animate-pulse" />
          </div>
          <div className="space-y-4">
            <div className="h-40 border animate-pulse" style={{ background: 'var(--surface-press-box)', borderColor: 'var(--border-vintage)', borderRadius: '2px' }} />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 border animate-pulse" style={{ background: 'var(--surface-press-box)', borderColor: 'var(--border-vintage)', borderRadius: '2px' }} />
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8" style={{ background: 'var(--surface-dugout)' }}>
      <div className="max-w-5xl mx-auto">
        <ScrollReveal direction="up">
          <div className="flex items-center justify-between mb-10">
            <div>
              <span className="heritage-stamp mb-4">
                From the Press Box
              </span>
              <div className="flex items-center gap-3 mt-3">
                <div className="section-rule-thick" />
                <h2 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-wide text-[var(--bsi-bone)]">
                  Editorial
                </h2>
                {articleCount !== null && !error && (
                  <Badge variant="secondary" size="sm">
                    {articleCount} articles
                  </Badge>
                )}
              </div>
            </div>
            <Link
              href="/college-baseball/editorial"
              className="text-sm font-semibold transition-colors flex items-center gap-1"
              style={{ color: 'var(--heritage-columbia-blue)' }}
            >
              All Articles
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </ScrollReveal>

        {/* Featured article — full-width heritage card with corner marks */}
        <ScrollReveal direction="up">
          <Link href={getEditorialHref(featured)} className="group block mb-4">
            <article
              className="heritage-card corner-marks p-6 md:p-8 transition-all duration-300"
              style={{ borderLeftWidth: '3px', borderLeftColor: 'var(--bsi-primary)' }}
            >
              <div className="flex items-center gap-2 mb-3">
                {featured.teams?.length > 0 && (
                  <Badge variant="primary" size="sm">{featured.teams[0]}</Badge>
                )}
                <span className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--bsi-dust)', fontFamily: 'var(--bsi-font-data)' }}>
                  {formatDate(featured.date)}
                </span>
                {featured.wordCount > 0 && (
                  <span className="text-[10px]" style={{ color: 'var(--bsi-dust)', fontFamily: 'var(--bsi-font-data)' }}>
                    · {readTime(featured.wordCount)}
                  </span>
                )}
              </div>
              <h3 className="font-display text-xl md:text-2xl font-bold uppercase leading-snug mb-3 group-hover:text-burnt-orange transition-colors text-[var(--bsi-bone)]">
                {featured.title}
              </h3>
              <p className="text-sm leading-relaxed line-clamp-2 mb-4 font-serif" style={{ color: 'var(--bsi-dust)' }}>
                {featured.preview}
              </p>
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold group-hover:gap-2.5 transition-all" style={{ color: 'var(--heritage-columbia-blue)' }}>
                Read
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
            </article>
          </Link>
        </ScrollReveal>

        {/* Heritage divider */}
        <div className="heritage-divider" />

        {/* Secondary articles — compact cards with sport-color left accent bar */}
        {secondary.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {secondary.map((article, i) => (
              <ScrollReveal key={article.id} direction="up" delay={i * 80}>
                <Link href={getEditorialHref(article)} className="group block h-full">
                  <article
                    className="h-full heritage-card p-5 md:p-6 transition-all duration-300"
                    style={{ borderLeftWidth: '2px', borderLeftColor: 'var(--bsi-primary)' }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {article.teams?.length > 0 && (
                        <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--heritage-bronze)' }}>
                          {article.teams[0]}
                        </span>
                      )}
                      <span className="text-[10px]" style={{ color: 'var(--bsi-dust)', fontFamily: 'var(--bsi-font-data)' }}>
                        {formatDate(article.date)}
                      </span>
                    </div>
                    <h3 className="font-display text-base font-bold uppercase leading-snug mb-2 group-hover:text-burnt-orange transition-colors line-clamp-2 text-[var(--bsi-bone)]">
                      {article.title}
                    </h3>
                    <p className="text-xs leading-relaxed line-clamp-2 font-serif" style={{ color: 'var(--bsi-dust)' }}>
                      {article.preview}
                    </p>
                  </article>
                </Link>
              </ScrollReveal>
            ))}
          </div>
        )}

        {/* Attribution */}
        {!loading && (
          <p className="text-[10px] mt-4" style={{ color: 'var(--bsi-dust)', fontFamily: 'var(--bsi-font-data)' }}>
            {isUsingFallback ? 'Showing recent highlights' : 'Source: BSI Editorial · D1'}
            {fetchedAt && !isUsingFallback && (
              <> · Updated {new Date(fetchedAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/Chicago' })} CT</>
            )}
          </p>
        )}
      </div>
    </section>
  );
}
