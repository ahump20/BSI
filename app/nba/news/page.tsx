'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Badge, DataSourceBadge } from '@/components/ui/Badge';
import { ScrollReveal } from '@/components/cinematic';
import { Footer } from '@/components/layout-ds/Footer';
import { formatTimestamp, getRelativeTime } from '@/lib/utils/timezone';

interface NewsItem {
  sport: string;
  title: string;
  description: string;
  published: string;
  link: string;
  source: string;
  image: string | null;
}

interface NewsResponse {
  success: boolean;
  count: number;
  headlines: NewsItem[];
  meta: {
    fetchedAt: string;
    timezone: string;
    source: string;
  };
}

function SkeletonNewsCard() {
  return (
    <Card variant="default" padding="md" className="animate-pulse">
      <div className="flex gap-4">
        <div className="w-24 h-24 bg-graphite rounded-lg flex-shrink-0 hidden sm:block" />
        <div className="flex-1 space-y-3">
          <div className="h-5 bg-graphite rounded w-3/4" />
          <div className="h-4 bg-graphite/50 rounded w-full" />
          <div className="h-4 bg-graphite/50 rounded w-2/3" />
          <div className="flex gap-2">
            <div className="h-5 w-16 bg-graphite rounded" />
            <div className="h-5 w-12 bg-graphite/50 rounded" />
          </div>
        </div>
      </div>
    </Card>
  );
}

function NewsCard({ item }: { item: NewsItem }) {
  return (
    <a href={item.link} target="_blank" rel="noopener noreferrer" className="block">
      <Card
        variant="hover"
        padding="md"
        className="h-full transition-all duration-300 hover:border-burnt-orange group"
      >
        <div className="flex gap-4">
          {item.image && (
            <div className="relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden hidden sm:block">
              <Image
                src={item.image}
                alt=""
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                sizes="96px"
                unoptimized
              />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <h3 className="font-display font-bold text-white text-lg leading-tight group-hover:text-burnt-orange transition-colors line-clamp-2">
              {item.title}
            </h3>

            {item.description && (
              <p className="text-text-secondary text-sm mt-2 line-clamp-2">{item.description}</p>
            )}

            <div className="flex items-center gap-3 mt-3 flex-wrap">
              <Badge variant="primary" className="text-xs">
                NBA
              </Badge>
              <span className="text-text-tertiary text-xs">{getRelativeTime(item.published)}</span>
              <span className="text-text-tertiary text-xs">via {item.source}</span>
            </div>
          </div>
        </div>
      </Card>
    </a>
  );
}

export default function NBANewsPage() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>(formatTimestamp());

  const fetchNews = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/news?sport=nba&limit=20');
      if (!res.ok) {
        throw new Error(`Failed to fetch news: ${res.status}`);
      }

      const data: NewsResponse = await res.json();
      setNews(data.headlines || []);
      setLastUpdated(formatTimestamp());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load news');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNews();

    // Refresh news every 5 minutes
    const interval = setInterval(fetchNews, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchNews]);

  return (
    <>
      <main id="main-content">
        {/* Breadcrumb */}
        <Section padding="sm" className="border-b border-border-subtle">
          <Container>
            <nav className="flex items-center gap-2 text-sm">
              <Link
                href="/nba"
                className="text-text-tertiary hover:text-burnt-orange transition-colors"
              >
                NBA
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
            <ScrollReveal direction="up">
              <Badge variant="primary" className="mb-4">
                Latest Updates
              </Badge>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={100}>
              <h1 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-display text-gradient-blaze">
                NBA News
              </h1>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={150}>
              <p className="text-text-secondary mt-2 max-w-2xl">
                Breaking news, trade rumors, injury updates, and game recaps from around the league.
                Auto-refreshes every 5 minutes.
              </p>
            </ScrollReveal>
          </Container>
        </Section>

        {/* News Feed */}
        <Section padding="lg" background="charcoal" borderTop>
          <Container>
            {error && (
              <Card variant="default" padding="lg" className="mb-6 bg-error/10 border-error/30">
                <p className="text-error font-semibold">Error loading news</p>
                <p className="text-text-secondary text-sm mt-1">{error}</p>
                <button
                  onClick={fetchNews}
                  className="mt-3 px-4 py-2 bg-burnt-orange text-white rounded-lg text-sm hover:bg-burnt-orange/80 transition-colors"
                >
                  Try Again
                </button>
              </Card>
            )}

            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <SkeletonNewsCard key={i} />
                ))}
              </div>
            ) : news.length === 0 ? (
              <Card variant="default" padding="lg" className="text-center">
                <div className="py-8">
                  <div className="text-6xl mb-4">📰</div>
                  <p className="text-text-secondary text-lg">No NBA news available right now</p>
                  <p className="text-text-tertiary text-sm mt-2">
                    Check back soon for the latest updates from around the league.
                  </p>
                </div>
              </Card>
            ) : (
              <div className="space-y-4">
                {/* Featured Article - First item larger */}
                {news.length > 0 && (
                  <ScrollReveal direction="up">
                    <a
                      href={news[0].link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block"
                    >
                      <Card
                        variant="hover"
                        padding="lg"
                        className="relative overflow-hidden group border-burnt-orange/30"
                      >
                        <div className="flex flex-col md:flex-row gap-6">
                          {news[0].image && (
                            <div className="relative w-full md:w-64 h-48 md:h-40 flex-shrink-0 rounded-lg overflow-hidden">
                              <Image
                                src={news[0].image}
                                alt=""
                                fill
                                className="object-cover group-hover:scale-105 transition-transform duration-500"
                                sizes="(max-width: 768px) 100vw, 256px"
                                unoptimized
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                            </div>
                          )}

                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-3">
                              <Badge variant="primary">Featured</Badge>
                              <span className="text-text-tertiary text-sm">
                                {getRelativeTime(news[0].published)}
                              </span>
                            </div>

                            <h2 className="font-display font-bold text-white text-xl md:text-2xl leading-tight group-hover:text-burnt-orange transition-colors">
                              {news[0].title}
                            </h2>

                            {news[0].description && (
                              <p className="text-text-secondary mt-3 line-clamp-3">
                                {news[0].description}
                              </p>
                            )}

                            <p className="text-text-tertiary text-sm mt-4">via {news[0].source}</p>
                          </div>
                        </div>
                      </Card>
                    </a>
                  </ScrollReveal>
                )}

                {/* Rest of the news */}
                <div className="grid gap-4 md:grid-cols-2">
                  {news.slice(1).map((item, index) => (
                    <ScrollReveal key={item.link + index} direction="up" delay={(index % 4) * 50}>
                      <NewsCard item={item} />
                    </ScrollReveal>
                  ))}
                </div>
              </div>
            )}

            {/* Data Source Footer */}
            <div className="mt-8 pt-4 border-t border-border-subtle">
              <DataSourceBadge source="ESPN NBA News API" timestamp={lastUpdated} />
            </div>
          </Container>
        </Section>

        {/* Quick Links */}
        <Section padding="md" background="midnight" borderTop>
          <Container>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/nba/games"
                className="px-6 py-3 bg-graphite rounded-lg text-text-secondary hover:text-white hover:bg-white/10 transition-all"
              >
                Live Scores →
              </Link>
              <Link
                href="/nba/standings"
                className="px-6 py-3 bg-graphite rounded-lg text-text-secondary hover:text-white hover:bg-white/10 transition-all"
              >
                Standings →
              </Link>
              <Link
                href="/nba/teams"
                className="px-6 py-3 bg-graphite rounded-lg text-text-secondary hover:text-white hover:bg-white/10 transition-all"
              >
                All Teams →
              </Link>
            </div>
          </Container>
        </Section>
      </main>

      <Footer />
    </>
  );
}
