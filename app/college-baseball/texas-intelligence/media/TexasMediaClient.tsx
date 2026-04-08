'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge, DataSourceBadge } from '@/components/ui/Badge';
import { ScrollReveal } from '@/components/cinematic';
import { TeamVideoPanel } from '@/components/college-baseball/TeamVideoPanel';
import { teamMetadata, getLogoUrl } from '@/lib/data/team-metadata';

const TEAM_ID = 'texas';
const ACCENT = '#BF5700';

// ─── Types ──────────────────────────────────────────────────────────────────

interface NewsArticle {
  title: string;
  link: string;
  source: string;
  publishedAt: string;
  description: string;
}

interface NewsResponse {
  articles: NewsArticle[];
  total: number;
  meta: { source: string; fetched_at: string };
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function TexasMediaClient() {
  const meta = teamMetadata[TEAM_ID];
  const espnId = meta?.espnId || '251';
  const logoUrl = getLogoUrl(espnId, meta?.logoId);

  const [news, setNews] = useState<NewsResponse | null>(null);
  const [newsLoading, setNewsLoading] = useState(true);
  const [newsError, setNewsError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/college-baseball/texas-intelligence/news')
      .then((r) => (r.ok ? (r.json() as Promise<NewsResponse>) : Promise.reject(r.status)))
      .then((d) => { if (!cancelled) { setNews(d); setNewsLoading(false); } })
      .catch(() => { if (!cancelled) { setNewsLoading(false); setNewsError(true); } });
    return () => { cancelled = true; };
  }, []);

  return (
    <>
      <main id="main-content">
        {/* Breadcrumb */}
        <Section padding="sm" className="border-b border-border">
          <Container>
            <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm">
              <Link href="/college-baseball" className="text-text-muted hover:text-burnt-orange transition-colors">College Baseball</Link>
              <span className="text-text-muted">/</span>
              <Link href="/college-baseball/texas-intelligence" className="text-text-muted hover:text-burnt-orange transition-colors">Texas Intel</Link>
              <span className="text-text-muted">/</span>
              <span className="text-text-primary">Media</span>
            </nav>
          </Container>
        </Section>

        {/* Hero */}
        <Section padding="lg" className="relative overflow-hidden bg-surface-scoreboard">
          <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: ACCENT }} />
          <Container>
            <ScrollReveal direction="up">
              <div className="flex items-center gap-4">
                <img src={logoUrl} alt="Texas" className="w-12 h-12 object-contain" loading="eager" />
                <div>
                  <span className="heritage-stamp text-[10px]">Media Archive</span>
                  <h1 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-wide text-text-primary mt-1">
                    Texas Media Archive
                  </h1>
                  <p className="text-text-secondary text-sm mt-2">
                    Video highlights, news, and social content — curated and live-aggregated.
                  </p>
                </div>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* Film Room — full video library */}
        <Section padding="lg" borderTop>
          <Container>
            <ScrollReveal direction="up">
              <div className="mb-6">
                <span className="heritage-stamp text-[10px]">BSI Film Room</span>
                <h2 className="font-display text-2xl md:text-3xl font-bold uppercase tracking-wide text-text-primary mt-1">
                  Film Room
                </h2>
              </div>
            </ScrollReveal>
            <div className="[&_iframe]:w-full [&_iframe]:aspect-video [&_iframe]:rounded-sm">
              <TeamVideoPanel teamId={TEAM_ID} />
            </div>
          </Container>
        </Section>

        {/* News Articles */}
        <Section padding="lg" background="charcoal" borderTop>
          <Container>
            <ScrollReveal direction="up">
              <div className="mb-6">
                <span className="heritage-stamp text-[10px]">News Intelligence</span>
                <h2 className="font-display text-2xl md:text-3xl font-bold uppercase tracking-wide text-text-primary mt-1">
                  Latest News
                </h2>
              </div>
            </ScrollReveal>

            {newsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-20 bg-surface-light rounded-sm animate-pulse" />
                ))}
              </div>
            ) : news && news.articles.length > 0 ? (
              <div className="space-y-3">
                {news.articles.map((article, idx) => (
                  <ScrollReveal key={`${article.link}-${idx}`} direction="up">
                    <a
                      href={article.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block"
                    >
                      <Card variant="default" padding="md" className="hover:border-burnt-orange/30 transition-colors cursor-pointer">
                        <CardContent>
                          <div className="flex items-center gap-2 mb-1.5">
                            <Badge variant="secondary" size="sm">{article.source}</Badge>
                            <span className="text-text-muted text-[10px]">
                              {new Date(article.publishedAt).toLocaleDateString('en-US', {
                                month: 'short', day: 'numeric',
                              })}
                            </span>
                          </div>
                          <h3 className="font-display font-bold text-sm uppercase tracking-wide text-text-primary line-clamp-2">
                            {article.title}
                          </h3>
                          {article.description && (
                            <p className="text-text-muted text-xs leading-relaxed mt-1 line-clamp-2">
                              {article.description}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    </a>
                  </ScrollReveal>
                ))}
              </div>
            ) : (
              <Card padding="lg" className="text-center">
                <p className="text-text-muted text-sm">
                  {newsError ? 'Unable to load news. Try refreshing the page.' : 'News aggregation is refreshing. Check back soon.'}
                </p>
              </Card>
            )}

            {news && news.articles.length > 0 && (
              <div className="mt-4">
                <DataSourceBadge
                  source={news.meta?.source ?? 'BSI News Aggregation'}
                  timestamp={
                    news.meta?.fetched_at
                      ? new Date(news.meta.fetched_at).toLocaleString('en-US', {
                          timeZone: 'America/Chicago',
                          month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
                        }) + ' CT'
                      : 'Live'
                  }
                />
              </div>
            )}
          </Container>
        </Section>

        {/* Footer nav */}
        <Section padding="md" borderTop>
          <Container>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <DataSourceBadge
                source="BSI Intelligence"
                timestamp={
                  news?.meta?.fetched_at
                    ? new Date(news.meta.fetched_at).toLocaleString('en-US', {
                        timeZone: 'America/Chicago',
                        month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
                      }) + ' CT'
                    : 'Live'
                }
              />
              <div className="flex flex-wrap gap-4">
                <Link href="/college-baseball/texas-intelligence" className="text-sm text-burnt-orange hover:text-ember transition-colors">
                  &larr; Back to Hub
                </Link>
                <Link href="/college-baseball/editorial" className="text-sm text-text-muted hover:text-text-primary transition-colors">
                  All Editorial &rarr;
                </Link>
              </div>
            </div>
          </Container>
        </Section>
      </main>
    </>
  );
}
