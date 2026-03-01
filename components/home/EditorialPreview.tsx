'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { ScrollReveal } from '@/components/cinematic';
import { useSportData } from '@/lib/hooks/useSportData';
import { Badge } from '@/components/ui/Badge';
import { formatDateInTimezone } from '@/lib/utils/timezone';

// ────────────────────────────────────────
// Types — matches EditorialFeed.tsx
// ────────────────────────────────────────

interface Editorial {
  id: number;
  slug?: string;
  date: string;
  title: string;
  preview: string;
  teams: string[];
  wordCount: number;
  createdAt: string;
}

interface EditorialListResponse {
  editorials: Editorial[];
  meta?: { source?: string; fetched_at?: string };
}

// ────────────────────────────────────────
// Slug derivation — identical to EditorialFeed.tsx
// ────────────────────────────────────────

function titleToSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

const SLUG_OVERRIDES: Record<string, string> = {
  'texas-week-1-27-runs-one-hit-allowed-by-volantis': 'texas-week-1-recap',
  'sec-opening-weekend-preview': 'sec-opening-weekend',
  'week-1-national-recap': 'week-1-recap',
};

function getEditorialHref(article: Editorial): string {
  if (article.slug) return `/college-baseball/editorial/${article.slug}`;
  const raw = titleToSlug(article.title);
  const slug = SLUG_OVERRIDES[raw] || raw;
  return `/college-baseball/editorial/${slug}`;
}

function readTime(words: number): string {
  const mins = Math.max(1, Math.round(words / 250));
  return `${mins} min read`;
}

function formatDate(dateStr: string): string {
  return formatDateInTimezone(dateStr + 'T12:00:00', undefined, 'compact');
}

// ────────────────────────────────────────
// Hardcoded fallback — used when API is down
// ────────────────────────────────────────

const FALLBACK_ARTICLES: Editorial[] = [
  {
    id: 0,
    date: '2026-02-17',
    title: 'Texas Week 1: 27 Runs. One Hit Allowed by Volantis.',
    preview: 'UC Davis swept 27–7. Volantis earns SEC honors. Michigan State arrives for Weekend 2.',
    teams: ['Texas'],
    wordCount: 2800,
    createdAt: '2026-02-17',
  },
  {
    id: 1,
    date: '2026-02-16',
    title: 'Week 1 National Recap: Three Grand Slams. One Record Book.',
    preview: 'Opening weekend delivered chaos across the SEC, Big 12, and ACC.',
    teams: [],
    wordCount: 3500,
    createdAt: '2026-02-16',
  },
  {
    id: 2,
    date: '2026-02-14',
    title: 'SEC Opening Weekend Preview',
    preview: '13 ranked teams. The deepest conference in college baseball.',
    teams: [],
    wordCount: 3000,
    createdAt: '2026-02-14',
  },
  {
    id: 3,
    date: '2026-02-10',
    title: 'Texas 2026 Season Preview',
    preview: '3,818 wins. 130 years. The definitive deep dive.',
    teams: ['Texas'],
    wordCount: 4200,
    createdAt: '2026-02-10',
  },
];

// ────────────────────────────────────────
// Component
// ────────────────────────────────────────

/**
 * EditorialPreview — D1-backed dynamic editorial feed for the homepage.
 * Fetches /api/college-baseball/editorial/list, shows 1 featured + 3 secondary.
 * Falls back to hardcoded articles if the API is unavailable.
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
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-background-secondary to-background-primary">
        <div className="max-w-5xl mx-auto">
          <div className="mb-10">
            <div className="h-3 w-20 bg-surface rounded mb-4 animate-pulse" />
            <div className="h-8 w-48 bg-surface rounded animate-pulse" />
          </div>
          <div className="space-y-4">
            <div className="h-40 bg-surface-light border border-border rounded-2xl animate-pulse" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-surface-light border border-border rounded-2xl animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-background-secondary to-background-primary">
      <div className="max-w-5xl mx-auto">
        <ScrollReveal direction="up">
          <div className="flex items-center justify-between mb-10">
            <div>
              <span className="inline-block text-xs font-semibold uppercase tracking-[0.2em] text-burnt-orange mb-4">
                From the Press Box
              </span>
              <div className="flex items-center gap-3">
                <h2 className="font-display text-3xl md:text-4xl font-bold text-text-primary uppercase tracking-wide">
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
              className="text-sm font-semibold text-burnt-orange hover:text-ember transition-colors flex items-center gap-1"
            >
              All Articles
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </ScrollReveal>

        {/* Featured article */}
        <ScrollReveal direction="up">
          <Link href={getEditorialHref(featured)} className="group block mb-4">
            <article className="rounded-2xl border border-burnt-orange/20 bg-gradient-to-r from-burnt-orange/10 to-transparent p-6 md:p-8 transition-all duration-300 hover:border-burnt-orange/50 hover:shadow-[0_0_30px_rgba(191,87,0,0.08)]">
              <div className="flex items-center gap-2 mb-3">
                {featured.teams?.length > 0 && (
                  <Badge variant="primary" size="sm">{featured.teams[0]}</Badge>
                )}
                <span className="text-[10px] text-text-muted uppercase tracking-wider">
                  {formatDate(featured.date)}
                </span>
                {featured.wordCount > 0 && (
                  <span className="text-[10px] text-text-muted">
                    · {readTime(featured.wordCount)}
                  </span>
                )}
              </div>
              <h3 className="font-serif text-xl md:text-2xl font-bold text-text-primary leading-snug mb-3 group-hover:text-burnt-orange transition-colors">
                {featured.title}
              </h3>
              <p className="text-sm text-text-muted leading-relaxed line-clamp-2 mb-4">
                {featured.preview}
              </p>
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-burnt-orange group-hover:gap-2.5 transition-all">
                Read
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
            </article>
          </Link>
        </ScrollReveal>

        {/* Secondary articles */}
        {secondary.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {secondary.map((article, i) => (
              <ScrollReveal key={article.id} direction="up" delay={i * 80}>
                <Link href={getEditorialHref(article)} className="group block h-full">
                  <article className="h-full rounded-2xl border border-border bg-surface-light p-5 md:p-6 transition-all duration-300 hover:border-burnt-orange/40 hover:bg-surface-light">
                    <div className="flex items-center gap-2 mb-2">
                      {article.teams?.length > 0 && (
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-burnt-orange/70">
                          {article.teams[0]}
                        </span>
                      )}
                      <span className="text-[10px] text-text-muted">
                        {formatDate(article.date)}
                      </span>
                    </div>
                    <h3 className="font-serif text-base font-bold text-text-primary leading-snug mb-2 group-hover:text-burnt-orange transition-colors line-clamp-2">
                      {article.title}
                    </h3>
                    <p className="text-xs text-text-muted leading-relaxed line-clamp-2">
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
          <p className="text-[10px] text-text-muted mt-4">
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
