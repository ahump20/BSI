'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useSportData } from '@/lib/hooks/useSportData';
import { ScrollReveal } from '@/components/cinematic';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Badge } from '@/components/ui/Badge';
import { formatDateInTimezone } from '@/lib/utils/timezone';
import {
  type Editorial,
  type EditorialListResponse,
  getEditorialHref,
  readTime,
} from '@/lib/editorial';

function formatDate(dateStr: string): string {
  return formatDateInTimezone(dateStr + 'T12:00:00', undefined, 'medium');
}

// ---------------------------------------------------------------------------
// Hardcoded fallback — used when API is down
// ---------------------------------------------------------------------------

const FALLBACK_ARTICLES: Editorial[] = [
  {
    id: 0,
    slug: 'week-4-preview',
    date: '2026-03-03',
    title: 'Week 4 Preview: Last Call Before Conference Play',
    preview: 'Final non-conference weekend before SEC and Big 12 open. Rotation order finalized, bullpen roles locked.',
    teams: [],
    wordCount: 3200,
    createdAt: '2026-03-03',
  },
  {
    id: 1,
    slug: 'weekend-3-recap',
    date: '2026-03-02',
    title: 'Weekend 3 Recap: Six Ranked Teams Fall, Texas Stays Perfect',
    preview: 'UCLA survives 10 innings against Mississippi State. Texas sweeps the BRUCE BOLT Classic at 11-0.',
    teams: [],
    wordCount: 3500,
    createdAt: '2026-03-02',
  },
  {
    id: 2,
    slug: 'texas-week-3-recap',
    date: '2026-03-01',
    title: 'Texas Week 3: BRUCE BOLT Classic Sweep, Schlossnagle Hits 1,000',
    preview: 'Three wins. First ranked victory. A coaching milestone. The Longhorns are 11-0.',
    teams: ['Texas'],
    wordCount: 4000,
    createdAt: '2026-03-01',
  },
  {
    id: 3,
    slug: 'texas-houston-christian-preview',
    date: '2026-03-03',
    title: 'Texas vs. Houston Christian Preview',
    preview: 'Midweek at Disch-Falk. Cozart on the mound. Texas 11-0 vs. a Southland team that walked off from 7 down.',
    teams: ['Texas'],
    wordCount: 2200,
    createdAt: '2026-03-03',
  },
];

// ---------------------------------------------------------------------------
// Skeleton loaders
// ---------------------------------------------------------------------------

function SkeletonFeatured() {
  return (
    <div className="bg-surface-light border border-border rounded-[2px] p-5 md:p-7 animate-pulse">
      <div className="h-4 w-24 bg-surface rounded mb-3" />
      <div className="h-6 w-3/4 bg-surface rounded mb-2" />
      <div className="h-4 w-full bg-surface rounded mb-1" />
      <div className="h-4 w-2/3 bg-surface rounded" />
    </div>
  );
}

function SkeletonSecondary() {
  return (
    <div className="bg-surface-light border border-border rounded-[2px] p-4 animate-pulse h-full">
      <div className="h-3 w-16 bg-surface rounded mb-3" />
      <div className="h-5 w-5/6 bg-surface rounded mb-2" />
      <div className="h-3 w-full bg-surface rounded" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// EditorialFeed
// ---------------------------------------------------------------------------

export function EditorialFeed() {
  const { data, loading, error } = useSportData<EditorialListResponse>(
    '/api/college-baseball/editorial/list',
    { refreshInterval: 300000 }, // 5 min
  );

  const articles = useMemo(() => {
    const list = data?.editorials;
    if (!list || list.length === 0) return null;
    return list;
  }, [data]);

  // Use API data if available, fallback to hardcoded when empty or errored
  const displayArticles = articles || FALLBACK_ARTICLES;

  // Loading state
  if (loading && !displayArticles) {
    return (
      <Section padding="sm" className="py-4">
        <Container>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-bold text-text-primary uppercase tracking-wide">
              Latest Analysis
            </h2>
            <Link
              href="/college-baseball/editorial"
              className="text-sm text-burnt-orange hover:text-ember transition-colors"
            >
              All Articles →
            </Link>
          </div>
          <div className="space-y-3">
            <SkeletonFeatured />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[1, 2, 3].map((i) => (
                <SkeletonSecondary key={i} />
              ))}
            </div>
          </div>
        </Container>
      </Section>
    );
  }

  // No data at all (no API result, no error fallback)
  if (!displayArticles) return null;

  const [featured, ...rest] = displayArticles;
  const secondary = rest.slice(0, 3);

  return (
    <Section padding="sm" className="py-4">
      <Container>
        <ScrollReveal>
          {/* Section header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h2 className="font-display text-lg font-bold text-text-primary uppercase tracking-wide">
                Latest Analysis
              </h2>
              {articles && !error && (
                <Badge variant="secondary" className="text-[10px]">
                  {articles.length} articles
                </Badge>
              )}
            </div>
            <Link
              href="/college-baseball/editorial"
              className="text-sm text-burnt-orange hover:text-ember transition-colors"
            >
              All Articles →
            </Link>
          </div>

          {/* Featured article */}
          <Link href={getEditorialHref(featured)}>
            <div
              className="border border-burnt-orange/30 rounded-[2px] p-4 md:p-6 hover:border-burnt-orange/60 transition-all group cursor-pointer mb-3"
              style={{ background: 'linear-gradient(to right, rgba(var(--bsi-primary-rgb), 0.2), rgba(140, 98, 57, 0.15))' }}
            >
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {featured.teams.length > 0 && (
                      <Badge variant="primary">{featured.teams[0]}</Badge>
                    )}
                    <span className="text-text-muted text-[10px] uppercase tracking-wider">
                      {formatDate(featured.date)}
                    </span>
                    {featured.wordCount > 0 && (
                      <span className="text-text-muted text-[10px]">
                        · {readTime(featured.wordCount)}
                      </span>
                    )}
                  </div>
                  <h3 className="font-display text-lg md:text-xl font-bold text-text-primary uppercase tracking-wide group-hover:text-burnt-orange transition-colors">
                    {featured.title}
                  </h3>
                  {featured.preview && (
                    <p className="text-text-muted text-sm mt-1 line-clamp-2">
                      {featured.preview}
                    </p>
                  )}
                </div>
                <svg viewBox="0 0 24 24" className="w-6 h-6 text-burnt-orange flex-shrink-0 ml-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </div>
            </div>
          </Link>

          {/* Secondary articles grid */}
          {secondary.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {secondary.map((article) => (
                <Link key={article.id} href={getEditorialHref(article)}>
                  <div className="bg-surface-light border border-border rounded-[2px] p-3 md:p-4 hover:border-burnt-orange/40 transition-all group cursor-pointer h-full">
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {article.teams.length > 0 && (
                            <span className="text-burnt-orange/70 text-[10px] font-semibold uppercase tracking-wider">
                              {article.teams[0]}
                            </span>
                          )}
                          <span className="text-text-muted text-[10px]">
                            {formatDate(article.date)}
                          </span>
                        </div>
                        <h4 className="font-display text-sm font-bold text-text-primary uppercase tracking-wide group-hover:text-burnt-orange transition-colors">
                          {article.title}
                        </h4>
                        {article.preview && (
                          <p className="text-text-muted text-xs mt-0.5 line-clamp-2">
                            {article.preview}
                          </p>
                        )}
                      </div>
                      <svg viewBox="0 0 24 24" className="w-4 h-4 text-text-muted flex-shrink-0 ml-3" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 18l6-6-6-6" />
                      </svg>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </ScrollReveal>
      </Container>
    </Section>
  );
}
