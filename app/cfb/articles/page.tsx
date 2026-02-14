'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ScrollReveal } from '@/components/cinematic';
import { Footer } from '@/components/layout-ds/Footer';

interface Article {
  id: number;
  article_type: 'preview' | 'recap' | 'analysis';
  title: string;
  slug: string;
  summary: string | null;
  conference: string | null;
  published_at: string;
}

interface ArticlesResponse {
  meta: { source: string; timezone: string };
  articles: Article[];
}

export default function CFBArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchArticles() {
      try {
        const res = await fetch('/api/college-football/articles');
        if (!res.ok) throw new Error('Failed to fetch articles');
        const data: ArticlesResponse = await res.json();
        setArticles(data.articles || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load articles');
      } finally {
        setLoading(false);
      }
    }
    fetchArticles();
  }, []);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'America/Chicago',
    });

  const typeVariant = (type: string) =>
    type === 'preview' ? 'primary' : type === 'recap' ? 'success' : 'secondary';

  return (
    <>
      <main id="main-content">
        <Section padding="sm" className="border-b border-border-subtle">
          <Container>
            <nav className="flex items-center gap-2 text-sm">
              <Link href="/cfb" className="text-text-tertiary hover:text-burnt-orange transition-colors">
                CFB
              </Link>
              <span className="text-text-tertiary">/</span>
              <span className="text-white font-medium">Articles</span>
            </nav>
          </Container>
        </Section>

        <Section padding="md" className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-radial from-burnt-orange/10 via-transparent to-transparent pointer-events-none" />
          <Container>
            <ScrollReveal direction="up">
              <Badge variant="primary" className="mb-4">Coverage</Badge>
            </ScrollReveal>
            <ScrollReveal direction="up" delay={100}>
              <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold uppercase tracking-display text-gradient-blaze mb-4">
                CFB Articles
              </h1>
            </ScrollReveal>
            <ScrollReveal direction="up" delay={150}>
              <p className="text-text-secondary max-w-2xl">
                Previews, recaps, and analysis from across college football. AI-powered coverage that goes beyond the box score.
              </p>
            </ScrollReveal>
          </Container>
        </Section>

        <Section padding="lg" background="charcoal" borderTop>
          <Container>
            {loading ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="bg-graphite rounded-lg p-6 animate-pulse">
                    <div className="h-4 bg-surface-secondary rounded w-1/4 mb-3" />
                    <div className="h-6 bg-surface-secondary rounded w-3/4 mb-2" />
                    <div className="h-4 bg-surface-secondary rounded w-full" />
                  </div>
                ))}
              </div>
            ) : error ? (
              <Card variant="default" padding="lg" className="text-center">
                <p className="text-text-secondary mb-2">Unable to load articles</p>
                <p className="text-text-tertiary text-sm">{error}</p>
              </Card>
            ) : articles.length === 0 ? (
              <Card variant="default" padding="lg" className="text-center">
                <div className="py-8">
                  <p className="text-text-secondary text-lg mb-2">No articles published yet</p>
                  <p className="text-text-tertiary text-sm">
                    CFB coverage will appear here as articles are generated during the season.
                  </p>
                </div>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {articles.map((article) => (
                  <ScrollReveal key={article.id}>
                    <Link href={`/cfb/articles/${article.slug}`} className="block">
                      <Card variant="hover" padding="md" className="h-full">
                        <div className="flex items-center gap-2 mb-3">
                          <Badge variant={typeVariant(article.article_type)} size="sm">
                            {article.article_type.charAt(0).toUpperCase() + article.article_type.slice(1)}
                          </Badge>
                          {article.conference && (
                            <Badge variant="secondary" size="sm">{article.conference}</Badge>
                          )}
                        </div>
                        <h3 className="font-display text-lg font-bold text-white uppercase tracking-wide mb-2 line-clamp-2">
                          {article.title}
                        </h3>
                        {article.summary && (
                          <p className="text-text-secondary text-sm line-clamp-3 mb-3">
                            {article.summary}
                          </p>
                        )}
                        <p className="text-text-tertiary text-xs">{formatDate(article.published_at)}</p>
                      </Card>
                    </Link>
                  </ScrollReveal>
                ))}
              </div>
            )}
          </Container>
        </Section>
      </main>

      <Footer />
    </>
  );
}
