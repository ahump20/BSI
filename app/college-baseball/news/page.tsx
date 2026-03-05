'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { DataSourceBadge } from '@/components/ui/Badge';
import { ScrollReveal } from '@/components/cinematic';
import { Footer } from '@/components/layout-ds/Footer';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatTimestamp } from '@/lib/utils/timezone';
import { useSportData } from '@/lib/hooks/useSportData';
import { NewsCard } from '@/components/college-baseball/NewsCard';

interface EnhancedNewsItem {
  id: string;
  title: string;
  description: string;
  source: 'espn' | 'highlightly' | 'bsi';
  url: string;
  imageUrl?: string;
  publishedAt: string;
  category: string;
  team?: string;
}

interface EnhancedNewsApiResponse {
  articles?: EnhancedNewsItem[];
  sources?: { espn: number; highlightly: number; total: number };
  meta?: { source: string; fetched_at: string; timezone: string };
}

const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'scores', label: 'Scores' },
  { id: 'transfers', label: 'Transfers' },
  { id: 'recruiting', label: 'Recruiting' },
  { id: 'editorial', label: 'Editorial' },
  { id: 'analysis', label: 'Analysis' },
  { id: 'rankings', label: 'Rankings' },
];

const SOURCE_FILTERS = [
  { id: 'all', label: 'All Sources' },
  { id: 'espn', label: 'ESPN' },
  { id: 'highlightly', label: 'Highlightly' },
  { id: 'bsi', label: 'BSI' },
];

function getDateGroup(publishedAt: string): string {
  if (!publishedAt) return 'Older';
  const pubDate = new Date(publishedAt);
  if (isNaN(pubDate.getTime())) return 'Older';

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayStart = new Date(todayStart.getTime() - 86400000);
  const weekStart = new Date(todayStart.getTime() - 6 * 86400000);

  if (pubDate >= todayStart) return 'Today';
  if (pubDate >= yesterdayStart) return 'Yesterday';
  if (pubDate >= weekStart) return 'This Week';
  return 'Older';
}

const GROUP_ORDER = ['Today', 'Yesterday', 'This Week', 'Older'];

export default function CollegeBaseballNewsPage() {
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');

  const { data, loading, error } = useSportData<EnhancedNewsApiResponse>(
    '/api/college-baseball/news/enhanced',
  );

  const filtered = useMemo(() => {
    const articles = data?.articles || [];
    return articles.filter((item) => {
      const matchCategory = categoryFilter === 'all' || item.category === categoryFilter;
      const matchSource = sourceFilter === 'all' || item.source === sourceFilter;
      return matchCategory && matchSource;
    });
  }, [data?.articles, categoryFilter, sourceFilter]);

  const grouped = useMemo(() => {
    const groups = new Map<string, EnhancedNewsItem[]>();
    for (const item of filtered) {
      const group = getDateGroup(item.publishedAt);
      if (!groups.has(group)) groups.set(group, []);
      groups.get(group)!.push(item);
    }
    return GROUP_ORDER
      .filter((g) => groups.has(g))
      .map((g) => ({ label: g, items: groups.get(g)! }));
  }, [filtered]);

  const lastUpdated = data?.meta?.fetched_at || '';
  const sourceLabel = data?.meta?.source || 'ESPN + Highlightly';

  return (
    <>
      <div>
        <Section padding="sm" className="border-b border-border-subtle">
          <Container>
            <nav className="flex items-center gap-2 text-sm">
              <Link href="/college-baseball" className="text-text-tertiary hover:text-burnt-orange transition-colors">
                College Baseball
              </Link>
              <span className="text-text-tertiary">/</span>
              <span className="text-text-primary font-medium">News</span>
            </nav>
          </Container>
        </Section>

        <Section padding="md" className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-radial from-burnt-orange/10 via-transparent to-transparent pointer-events-none" />
          <Container>
            <ScrollReveal>
              <h1 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-display text-gradient-blaze mb-2">
                College Baseball News
              </h1>
              <p className="text-text-secondary max-w-2xl">
                The transfer portal moves, recruiting wins, and game coverage ESPN won&apos;t give you.
                All 300+ D1 programs, actually covered.
              </p>
              {data?.sources && (
                <p className="text-text-tertiary text-xs mt-2">
                  {data.sources.total} articles from {data.sources.espn} ESPN + {data.sources.highlightly} Highlightly sources
                </p>
              )}
            </ScrollReveal>
          </Container>
        </Section>

        <Section padding="sm" background="charcoal" borderTop>
          <Container>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCategoryFilter(cat.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                    categoryFilter === cat.id
                      ? 'bg-burnt-orange text-white'
                      : 'bg-background-tertiary text-text-secondary hover:bg-surface-medium'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 mt-2">
              {SOURCE_FILTERS.map((src) => (
                <button
                  key={src.id}
                  onClick={() => setSourceFilter(src.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                    sourceFilter === src.id
                      ? 'bg-surface-medium text-text-primary border border-border-strong'
                      : 'bg-surface-light text-text-muted hover:bg-surface-medium hover:text-text-tertiary'
                  }`}
                >
                  {src.label}
                </button>
              ))}
            </div>
          </Container>
        </Section>

        <Section padding="lg" background="charcoal">
          <Container>
            {loading ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Card key={i} variant="default" padding="md">
                    <Skeleton variant="rectangular" width="100%" height={160} />
                    <Skeleton variant="text" width="80%" height={20} className="mt-3" />
                    <Skeleton variant="text" width="100%" height={14} className="mt-2" />
                    <Skeleton variant="text" width="60%" height={14} className="mt-1" />
                  </Card>
                ))}
              </div>
            ) : error ? (
              <Card variant="default" padding="lg" className="bg-error/10 border-error/30">
                <p className="text-error font-semibold">Unable to Load News</p>
                <p className="text-text-secondary text-sm mt-1">{error}</p>
              </Card>
            ) : filtered.length === 0 ? (
              <Card variant="default" padding="lg">
                <div className="text-center py-8">
                  <svg viewBox="0 0 24 24" className="w-16 h-16 text-text-tertiary mx-auto mb-4" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M19 20H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v1m2 13a2 2 0 0 1-2-2V7m2 13a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2m-4-3H9M7 16h6M7 12h10" />
                  </svg>
                  <p className="text-text-secondary">No news in this category right now.</p>
                  <p className="text-text-tertiary text-sm mt-2">
                    The transfer portal can be quiet between waves. Fall ball wraps, portal opens,
                    then it&apos;s chaos. Stay tuned.
                  </p>
                </div>
              </Card>
            ) : (
              <ScrollReveal>
                <div className="space-y-8">
                  {grouped.map((group) => (
                    <div key={group.label}>
                      <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4">
                        {group.label}
                      </h2>
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {group.items.map((item) => (
                          <NewsCard
                            key={item.id}
                            title={item.title}
                            description={item.description}
                            url={item.url}
                            imageUrl={item.imageUrl}
                            source={item.source}
                            category={item.category}
                            publishedAt={item.publishedAt}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollReveal>
            )}

            <div className="mt-8 pt-4 border-t border-border-subtle">
              <DataSourceBadge source={sourceLabel} timestamp={formatTimestamp(lastUpdated)} />
            </div>
          </Container>
        </Section>
      </div>
      <Footer />
    </>
  );
}
