'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Badge, DataSourceBadge } from '@/components/ui/Badge';
import { ScrollReveal } from '@/components/cinematic';

import { Skeleton } from '@/components/ui/Skeleton';
import { formatTimestamp, getRelativeTime } from '@/lib/utils/timezone';
import { getReadApiUrl } from '@/lib/utils/public-api';

interface NewsItem {
  id: string;
  title: string;
  summary: string;
  source: string;
  url: string;
  publishedAt: string;
  category: 'trade' | 'injury' | 'game' | 'analysis' | 'general';
  team?: string;
}

interface NewsApiResponse {
  articles?: Array<{
    headline?: string;
    description?: string;
    published?: string;
    link?: string;
    source?: string;
    images?: Array<{ url?: string }>;
    categories?: Array<{
      type?: string;
      description?: string;
    }>;
  }>;
  meta?: {
    fetched_at?: string;
    timezone?: string;
    source?: string;
  };
}

const categoryColors: Record<string, { background: string }> = {
  trade: { background: 'var(--bsi-primary)' },
  injury: { background: 'var(--error, #ef4444)' },
  game: { background: 'var(--success, #22c55e)' },
  analysis: { background: 'var(--info, #3b82f6)' },
  general: { background: 'rgba(196,184,165,0.5)' },
};

function inferMLBCategory(
  article: NonNullable<NewsApiResponse['articles']>[number],
): NewsItem['category'] {
  const categoryText = (article.categories || [])
    .map((category) => category.description || '')
    .join(' ');
  const text = `${article.headline || ''} ${article.description || ''} ${categoryText}`.toLowerCase();

  if (
    /\binjur|il\b|disabled list|out indefinitely|shut down|rehab assignment|activated from il/.test(
      text,
    )
  ) {
    return 'injury';
  }

  if (
    /\btrade|traded|contract|extension|signs?|signed|signing|deal|acquire|acquired|free agent|waiver|non-tender|opts? out\b/.test(
      text,
    )
  ) {
    return 'trade';
  }

  if (
    /\bbeats?\b|\bbeat\b|defeats?|walk-off|sweep|series|opener|recap|final|game story|wins?\b|loss\b|homers?\b|shutout\b/.test(
      text,
    )
  ) {
    return 'game';
  }

  if (
    /\banalysis|preview|projection|projections|rankings?|fantasy|draft guide|strategy|scouting|breakdown\b/.test(
      text,
    )
  ) {
    return 'analysis';
  }

  return 'general';
}

function getMLBTeam(
  article: NonNullable<NewsApiResponse['articles']>[number],
): string | undefined {
  return article.categories?.find((category) => category.type === 'team')?.description;
}

export default function MLBNewsPage() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [lastUpdated, setLastUpdated] = useState('');
  const [sourceLabel, setSourceLabel] = useState('ESPN');

  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const fetchNews = async () => {
      setLoading(true);
      try {
        const res = await fetch(getReadApiUrl('/api/mlb/news'), { signal: controller.signal });
        if (!res.ok) throw new Error('Failed to fetch news');
        const data = (await res.json()) as NewsApiResponse;
        const normalized = (data.articles || []).map((article, index) => ({
          id: `mlb-news-${index}`,
          title: article.headline || 'Untitled',
          summary: article.description || '',
          source: article.source || data.meta?.source || 'ESPN',
          url: article.link || '#',
          publishedAt: article.published || data.meta?.fetched_at || new Date().toISOString(),
          category: inferMLBCategory(article),
          team: getMLBTeam(article),
        }));

        setNews(normalized.filter((item) => item.url !== '#'));
        setLastUpdated(data.meta?.fetched_at || '');
        setSourceLabel(data.meta?.source || 'ESPN');
        setLoading(false);
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;
        setError(err instanceof Error ? err.message : 'Unknown error');
        setLoading(false);
      }
    };

    fetchNews();
    return () => { controller.abort(); clearTimeout(timeout); };
  }, []);

  const filteredNews = filter === 'all' ? news : news.filter((item) => item.category === filter);

  const categories = [
    { id: 'all', label: 'All News' },
    { id: 'trade', label: 'Trades' },
    { id: 'injury', label: 'Injuries' },
    { id: 'game', label: 'Games' },
    { id: 'analysis', label: 'Analysis' },
  ];

  return (
    <>
      <div className="min-h-screen bg-surface-scoreboard text-bsi-bone">
        {/* Breadcrumb */}
        <Section padding="sm" style={{ borderBottom: '1px solid var(--border-vintage)' }}>
          <Container>
            <nav className="flex items-center gap-2 text-sm">
              <Link
                href="/mlb"
                className="transition-colors hover:opacity-80"
                style={{ color: 'rgba(196,184,165,0.5)' }}
              >
                MLB
              </Link>
              <span style={{ color: 'rgba(196,184,165,0.5)' }}>/</span>
              <span className="font-medium text-bsi-bone">News</span>
            </nav>
          </Container>
        </Section>

        {/* Header */}
        <Section padding="md" className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-radial from-burnt-orange/10 via-transparent to-transparent pointer-events-none" />
          <Container>
            <ScrollReveal>
              <h1
                className="text-3xl md:text-4xl font-bold uppercase tracking-display text-gradient-blaze mb-2 font-display"
              >
                MLB News
              </h1>
              <p className="max-w-2xl text-bsi-dust">
                Trades, injuries, game recaps, and analysis—without the hot takes. Just the news
                that matters.
              </p>
            </ScrollReveal>
          </Container>
        </Section>

        {/* Filters */}
        <Section padding="sm" background="charcoal" borderTop>
          <Container>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setFilter(cat.id)}
                  className="px-4 py-2 rounded-sm text-sm font-medium whitespace-nowrap transition-colors"
                  style={{
                    background: filter === cat.id ? 'var(--bsi-primary)' : 'var(--surface-dugout)',
                    color: filter === cat.id ? '#fff' : 'var(--bsi-dust)',
                  }}
                >
                  {cat.label}
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
                <p className="text-sm mt-1 text-bsi-dust">{error}</p>
              </Card>
            ) : filteredNews.length === 0 ? (
              <Card variant="default" padding="lg">
                <div className="text-center py-8">
                  <svg
                    viewBox="0 0 24 24"
                    className="w-16 h-16 mx-auto mb-4"
                    style={{ color: 'rgba(196,184,165,0.5)' }}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <path d="M19 20H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v1m2 13a2 2 0 0 1-2-2V7m2 13a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2m-4-3H9M7 16h6M7 12h10" />
                  </svg>
                  <p className="text-bsi-dust">No news in this category right now.</p>
                  <p className="text-sm mt-2" style={{ color: 'rgba(196,184,165,0.5)' }}>
                    Offseason can be quiet—or it can explode with trades. Refresh or check back
                    later.
                  </p>
                </div>
              </Card>
            ) : (
              <ScrollReveal>
                <div className="space-y-4">
                  {filteredNews.map((item) => (
                    <Card
                      key={item.id}
                      variant="default"
                      padding="md"
                      className="hover:border-burnt-orange transition-all group"
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge
                              variant="secondary"
                              className="text-white"
                              style={categoryColors[item.category]}
                            >
                              {item.category}
                            </Badge>
                            {item.team && <Badge variant="outline">{item.team}</Badge>}
                            <span className="text-xs" style={{ color: 'rgba(196,184,165,0.5)' }}>
                              {getRelativeTime(item.publishedAt)}
                            </span>
                          </div>
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block"
                          >
                            <h3 className="font-semibold text-lg transition-colors text-bsi-bone">
                              {item.title}
                            </h3>
                            <p className="text-sm mt-1 line-clamp-2 text-bsi-dust">
                              {item.summary}
                            </p>
                          </a>
                          <p className="text-xs mt-2" style={{ color: 'rgba(196,184,165,0.5)' }}>via {item.source}</p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </ScrollReveal>
            )}

            {/* Data Source Footer */}
            <div className="mt-8 pt-4" style={{ borderTop: '1px solid var(--border-vintage)' }}>
              <DataSourceBadge
                source={sourceLabel}
                timestamp={formatTimestamp(lastUpdated)}
              />
            </div>
          </Container>
        </Section>
      </div>

    </>
  );
}
