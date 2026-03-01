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
    date: '2026-02-17',
    title: 'Texas Week 1: 27 Runs. One Hit Allowed by Volantis.',
    preview: 'UC Davis swept 27–7. Volantis earns SEC honors. Michigan State — fresh off upsetting No. 8 Louisville — arrives for Weekend 2.',
    teams: ['Texas'],
    wordCount: 2800,
    createdAt: '2026-02-17',
  },
  {
    id: 1,
    date: '2026-02-10',
    title: 'Texas 2026 Season Preview',
    preview: '3,818 wins. 130 years. The definitive deep dive.',
    teams: ['Texas'],
    wordCount: 4200,
    createdAt: '2026-02-10',
  },
  {
    id: 2,
    date: '2026-02-16',
    title: 'Week 1 National Recap',
    preview: 'Three grand slams. One record book.',
    teams: [],
    wordCount: 3500,
    createdAt: '2026-02-16',
  },
  {
    id: 3,
    date: '2026-02-14',
    title: 'SEC Opening Weekend Preview',
    preview: '13 ranked teams. The deepest conference.',
    teams: [],
    wordCount: 3000,
    createdAt: '2026-02-14',
  },
];

// ---------------------------------------------------------------------------
// Skeleton loaders
// ---------------------------------------------------------------------------

function SkeletonFeatured() {
  return (
    <div className="bg-surface-light border border-border rounded-xl p-5 md:p-7 animate-pulse">
      <div className="h-4 w-24 bg-surface rounded mb-3" />
      <div className="h-6 w-3/4 bg-surface rounded mb-2" />
      <div className="h-4 w-full bg-surface rounded mb-1" />
      <div className="h-4 w-2/3 bg-surface rounded" />
    </div>
  );
}

function SkeletonSecondary() {
  return (
    <div className="bg-surface-light border border-border rounded-xl p-4 animate-pulse h-full">
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
            <div className="bg-gradient-to-r from-burnt-orange/20 to-[#500000]/20 border border-burnt-orange/30 rounded-xl p-4 md:p-6 hover:border-burnt-orange/60 transition-all group cursor-pointer mb-3">
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
                  <div className="bg-surface-light border border-border rounded-xl p-3 md:p-4 hover:border-burnt-orange/40 transition-all group cursor-pointer h-full">
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
