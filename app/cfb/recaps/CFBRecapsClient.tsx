'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ScrollReveal } from '@/components/cinematic';
import { Navbar } from '@/components/layout-ds/Navbar';
import { Footer } from '@/components/layout-ds/Footer';
import { CFBArticleCard } from '@/components/cfb';
import { Skeleton } from '@/components/ui/Skeleton';

const navItems = [
  { label: 'Home', href: '/' },
  { label: 'College Baseball', href: '/college-baseball' },
  { label: 'MLB', href: '/mlb' },
  { label: 'NFL', href: '/nfl' },
  { label: 'CFB', href: '/cfb' },
  { label: 'Dashboard', href: '/dashboard' },
];

interface ArticleData {
  slug: string;
  title: string;
  excerpt: string | null;
  contentType: 'preview' | 'recap';
  publishedAt: string | null;
  gameId: string | null;
}

const LIMIT = 12;

export default function CFBRecapsClient() {
  const [articles, setArticles] = useState<ArticleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);

  async function fetchArticles(currentOffset: number, append = false) {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const response = await fetch(
        `/api/cfb/recaps?limit=${LIMIT}&offset=${currentOffset}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch recaps');
      }

      const data = await response.json();

      if (append) {
        setArticles((prev) => [...prev, ...(data.articles || [])]);
      } else {
        setArticles(data.articles || []);
      }
      setTotal(data.total || 0);
      setOffset(currentOffset + LIMIT);
    } catch (err) {
      console.error('CFB Recaps fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load recaps');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }

  useEffect(() => {
    fetchArticles(0);
  }, []);

  const hasMore = articles.length < total;

  return (
    <>
      <Navbar items={navItems} />

      <main id="main-content">
        <Section padding="lg" className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-radial from-burnt-orange/15 via-transparent to-transparent pointer-events-none" />

          <Container>
            <ScrollReveal direction="up">
              <div className="mb-6">
                <Link
                  href="/cfb"
                  className="text-sm text-text-tertiary hover:text-burnt-orange transition-colors"
                >
                  ← Back to CFB
                </Link>
              </div>

              <div className="text-center mb-12">
                <Badge variant="success" className="mb-4">
                  Game Recaps
                </Badge>
                <h1 className="font-display text-4xl md:text-5xl font-bold uppercase tracking-display mt-2">
                  All <span className="text-gradient-blaze">Recaps</span>
                </h1>
                <p className="text-text-secondary mt-4 max-w-2xl mx-auto">
                  Post-game breakdowns covering how games were decided and what it means going forward.
                  Sharp analysis within hours of final whistles.
                </p>
              </div>
            </ScrollReveal>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="space-y-4 p-4 bg-charcoal rounded-lg">
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-text-tertiary mb-4">{error}</p>
                <Button variant="secondary" onClick={() => fetchArticles(0)}>
                  Try Again
                </Button>
              </div>
            ) : articles.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-text-tertiary">No recaps available yet.</p>
                <p className="text-sm text-text-muted mt-2">
                  Check back after games are completed.
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {articles.map((article) => (
                    <CFBArticleCard
                      key={article.slug}
                      slug={article.slug}
                      title={article.title}
                      excerpt={article.excerpt}
                      contentType={article.contentType}
                      publishedAt={article.publishedAt}
                      gameId={article.gameId}
                    />
                  ))}
                </div>

                {hasMore && (
                  <div className="mt-12 text-center">
                    <Button
                      variant="secondary"
                      onClick={() => fetchArticles(offset, true)}
                      disabled={loadingMore}
                    >
                      {loadingMore ? 'Loading...' : `Load More (${total - articles.length} remaining)`}
                    </Button>
                  </div>
                )}
              </>
            )}
          </Container>
        </Section>
      </main>

      <Footer />
    </>
  );
}
