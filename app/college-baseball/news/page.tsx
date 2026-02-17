'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { DataSourceBadge } from '@/components/ui/Badge';
import { ScrollReveal } from '@/components/cinematic';
import { Footer } from '@/components/layout-ds/Footer';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatTimestamp } from '@/lib/utils/timezone';
import { NewsCard } from '@/components/college-baseball/NewsCard';
import { SearchBar } from '@/components/college-baseball/SearchBar';

interface NewsItem {
  id: string;
  title: string;
  summary: string;
  source: string;
  url: string;
  publishedAt: string;
  category: 'recruiting' | 'transfer' | 'game' | 'rankings' | 'analysis' | 'general';
  team?: string;
  conference?: string;
}

interface NewsApiResponse {
  articles?: NewsItem[];
}

/** Map existing API categories to the display filter categories */
function mapCategory(apiCategory: string): string {
  switch (apiCategory) {
    case 'game':
    case 'rankings':
      return 'scores';
    case 'transfer':
      return 'transfers';
    case 'recruiting':
      return 'recruiting';
    case 'analysis':
      return 'editorial';
    default:
      return 'all';
  }
}

/** Assign a date group label based on publishedAt */
function getDateGroup(publishedAt: string): string {
  const now = new Date();
  const then = new Date(publishedAt);

  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayStart = new Date(todayStart.getTime() - 86_400_000);
  const weekStart = new Date(todayStart.getTime() - 7 * 86_400_000);

  if (then >= todayStart) return 'Today';
  if (then >= yesterdayStart) return 'Yesterday';
  if (then >= weekStart) return 'This Week';
  return 'Earlier';
}

const filterTabs = [
  { id: 'all', label: 'All' },
  { id: 'scores', label: 'Scores' },
  { id: 'transfers', label: 'Transfers' },
  { id: 'recruiting', label: 'Recruiting' },
  { id: 'editorial', label: 'Editorial' },
] as const;

export default function CollegeBaseballNewsPage() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    const fetchNews = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/college-baseball/news');
        if (!res.ok) throw new Error('Failed to fetch news');
        const data = (await res.json()) as NewsApiResponse;
        setNews(data.articles || []);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setLoading(false);
      }
    };

    fetchNews();
  }, []);

  /** Filter articles by the selected category tab */
  const filteredNews = useMemo(() => {
    if (filter === 'all') return news;
    return news.filter((item) => mapCategory(item.category) === filter);
  }, [news, filter]);

  /** Group filtered articles by date */
  const groupedNews = useMemo(() => {
    const groups: { label: string; items: NewsItem[] }[] = [];
    const groupMap = new Map<string, NewsItem[]>();
    const order = ['Today', 'Yesterday', 'This Week', 'Earlier'];

    for (const item of filteredNews) {
      const group = getDateGroup(item.publishedAt);
      if (!groupMap.has(group)) {
        groupMap.set(group, []);
      }
      groupMap.get(group)!.push(item);
    }

    for (const label of order) {
      const items = groupMap.get(label);
      if (items && items.length > 0) {
        groups.push({ label, items });
      }
    }

    return groups;
  }, [filteredNews]);

  return (
    <>
      <main id="main-content">
        {/* Breadcrumb */}
        <Section padding="sm" className="border-b border-border-subtle">
          <Container>
            <nav className="flex items-center gap-2 text-sm">
              <Link
                href="/college-baseball"
                className="text-text-tertiary hover:text-burnt-orange transition-colors"
              >
                College Baseball
              </Link>
              <span className="text-text-tertiary">/</span>
              <span className="text-white font-medium">News</span>
            </nav>
          </Container>
        </Section>

        {/* Header */}
        <Section padding="md" className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-radial from-burnt-orange/10 via-transparent to-transparent pointer-events-none" />
          <Container>
            <ScrollReveal>
              <h1 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-display text-gradient-blaze mb-2">
                College Baseball News
              </h1>
              <p className="text-text-secondary max-w-2xl mb-6">
                The transfer portal moves, recruiting wins, and game coverage ESPN won't give you.
                All 300+ D1 programs, actually covered.
              </p>
              <SearchBar />
            </ScrollReveal>
          </Container>
        </Section>

        {/* Category Filter Tabs */}
        <Section padding="sm" background="charcoal" borderTop>
          <Container>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {filterTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setFilter(tab.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                    filter === tab.id
                      ? 'bg-burnt-orange text-white'
                      : 'bg-graphite text-text-secondary hover:bg-white/10'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </Container>
        </Section>

        {/* News Feed */}
        <Section padding="lg" background="charcoal">
          <Container>
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Card key={i} variant="default" padding="md">
                    <Skeleton variant="text" width="80%" height={24} />
                    <Skeleton variant="text" width="100%" height={16} className="mt-2" />
                    <Skeleton variant="text" width="60%" height={16} className="mt-1" />
                  </Card>
                ))}
              </div>
            ) : error ? (
              <Card variant="default" padding="lg" className="bg-error/10 border-error/30">
                <p className="text-error font-semibold">Unable to Load News</p>
                <p className="text-text-secondary text-sm mt-1">{error}</p>
              </Card>
            ) : filteredNews.length === 0 ? (
              <Card variant="default" padding="lg">
                <div className="text-center py-8">
                  <svg
                    viewBox="0 0 24 24"
                    className="w-16 h-16 text-text-tertiary mx-auto mb-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <path d="M19 20H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v1m2 13a2 2 0 0 1-2-2V7m2 13a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2m-4-3H9M7 16h6M7 12h10" />
                  </svg>
                  <p className="text-text-secondary">No news in this category right now.</p>
                  <p className="text-text-tertiary text-sm mt-2">
                    The transfer portal can be quiet between waves. Fall ball wraps, portal opens,
                    then it's chaos. Stay tuned.
                  </p>
                </div>
              </Card>
            ) : (
              <ScrollReveal>
                <div className="space-y-8">
                  {groupedNews.map((group) => (
                    <div key={group.label}>
                      {/* Date Group Header */}
                      <h2 className="text-text-tertiary text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-3">
                        <span>{group.label}</span>
                        <span className="flex-1 h-px bg-border-subtle" />
                        <span className="text-text-tertiary/60">
                          {group.items.length} article{group.items.length !== 1 ? 's' : ''}
                        </span>
                      </h2>

                      {/* News Cards */}
                      <div className="space-y-3">
                        {group.items.map((item) => (
                          <NewsCard
                            key={item.id}
                            title={item.title}
                            source={item.source}
                            category={mapCategory(item.category)}
                            timestamp={item.publishedAt}
                            excerpt={item.summary}
                            url={item.url}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollReveal>
            )}

            {/* Data Source Footer */}
            <div className="mt-8 pt-4 border-t border-border-subtle">
              <DataSourceBadge
                source="D1Baseball / NCAA / Official Program Sources"
                timestamp={formatTimestamp()}
              />
            </div>
          </Container>
        </Section>
      </main>

      <Footer />
    </>
  );
}
