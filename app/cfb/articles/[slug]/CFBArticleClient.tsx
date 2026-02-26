'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Footer } from '@/components/layout-ds/Footer';

interface Article {
  id: number;
  article_type: 'preview' | 'recap' | 'analysis';
  game_id: number | null;
  title: string;
  slug: string;
  summary: string | null;
  content: string;
  home_team_name: string | null;
  away_team_name: string | null;
  game_date: string | null;
  sport: string;
  conference: string | null;
  published_at: string;
  source_url: string | null;
  metadata: {
    source?: string;
    model?: string;
    author?: string;
  } | null;
}

interface ArticleResponse {
  meta: {
    source: string;
    timezone: string;
  };
  article: Article;
}

export function CFBArticleClient() {
  const params = useParams();
  const slug = params.slug as string;
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchArticle() {
      try {
        const response = await fetch(`/api/college-football/articles/${slug}`);

        if (response.status === 404) {
          setError('Article not found');
          return;
        }

        if (!response.ok) {
          throw new Error('Failed to fetch article');
        }

        const data: ArticleResponse = await response.json();
        setArticle(data.article);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load article');
      } finally {
        setLoading(false);
      }
    }

    fetchArticle();
  }, [slug]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'America/Chicago',
    });
  };

  return (
    <>
      <main id="main-content" className="min-h-screen bg-midnight">
        {/* Hero Section */}
        <Section
          padding="lg"
          className="bg-gradient-to-b from-charcoal to-midnight relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-radial from-burnt-orange/5 via-transparent to-transparent pointer-events-none" />

          <Container>
            <div className="max-w-3xl mx-auto">
              {/* Breadcrumb */}
              <nav className="mb-6">
                <ol className="flex items-center gap-2 text-sm text-text-tertiary">
                  <li>
                    <Link href="/cfb" className="hover:text-burnt-orange transition-colors">
                      CFB
                    </Link>
                  </li>
                  <li>/</li>
                  <li>Articles</li>
                </ol>
              </nav>

              {loading ? (
                <div className="animate-pulse">
                  <div className="h-8 bg-surface-secondary rounded w-1/4 mb-4" />
                  <div className="h-12 bg-surface-secondary rounded w-3/4 mb-4" />
                  <div className="h-4 bg-surface-secondary rounded w-1/2" />
                </div>
              ) : error ? (
                <Card variant="default" padding="lg" className="text-center">
                  <h1 className="text-2xl font-semibold text-text-primary mb-4">{error}</h1>
                  <p className="text-text-tertiary mb-6">
                    The article you&apos;re looking for doesn&apos;t exist or has been removed.
                  </p>
                  <Link href="/cfb">
                    <Button variant="primary">Back to CFB</Button>
                  </Link>
                </Card>
              ) : article ? (
                <>
                  {/* Article Header */}
                  <div className="mb-8">
                    <div className="flex items-center gap-3 mb-4">
                      <Badge
                        variant={
                          article.article_type === 'preview'
                            ? 'primary'
                            : article.article_type === 'recap'
                              ? 'success'
                              : 'secondary'
                        }
                      >
                        {article.article_type.charAt(0).toUpperCase() +
                          article.article_type.slice(1)}
                      </Badge>
                      {article.conference && (
                        <Badge variant="secondary">{article.conference}</Badge>
                      )}
                    </div>

                    <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold uppercase tracking-display text-text-primary mb-4">
                      {article.title}
                    </h1>

                    {article.summary && (
                      <p className="text-lg text-text-secondary">{article.summary}</p>
                    )}

                    {/* Meta info */}
                    <div className="flex flex-wrap items-center gap-4 mt-6 text-sm text-text-tertiary">
                      <span>{formatDate(article.published_at)}</span>
                      {article.metadata?.source && (
                        <>
                          <span>•</span>
                          <span>Source: {article.metadata.source}</span>
                        </>
                      )}
                      {article.metadata?.author && (
                        <>
                          <span>•</span>
                          <span>By {article.metadata.author}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Teams Banner */}
                  {article.home_team_name && article.away_team_name && (
                    <Card variant="default" padding="md" className="mb-8">
                      <div className="flex items-center justify-center gap-4 text-lg font-semibold">
                        <span className="text-text-primary">{article.away_team_name}</span>
                        <span className="text-text-tertiary">@</span>
                        <span className="text-text-primary">{article.home_team_name}</span>
                      </div>
                      {article.game_date && (
                        <div className="text-center text-sm text-text-tertiary mt-2">
                          {formatDate(article.game_date)}
                        </div>
                      )}
                    </Card>
                  )}
                </>
              ) : null}
            </div>
          </Container>
        </Section>

        {/* Article Content */}
        {article && (
          <Section padding="lg" background="midnight">
            <Container>
              <div className="max-w-3xl mx-auto">
                <Card variant="default" padding="lg">
                  <article className="prose prose-invert prose-lg max-w-none">
                    <div className="whitespace-pre-line text-text-secondary leading-relaxed">
                      {article.content}
                    </div>
                  </article>

                  {/* Article Footer */}
                  <div className="mt-8 pt-6 border-t border-border-subtle">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="text-xs text-text-tertiary">
                        {article.metadata?.model && (
                          <span className="inline-flex items-center gap-1">
                            <svg
                              viewBox="0 0 24 24"
                              className="w-4 h-4 stroke-burnt-orange fill-none stroke-[1.5]"
                            >
                              <rect x="4" y="4" width="16" height="16" rx="2" />
                              <circle cx="9" cy="9" r="1.5" />
                              <circle cx="15" cy="9" r="1.5" />
                              <path d="M9 15h6" />
                            </svg>
                            Powered by Workers AI
                          </span>
                        )}
                      </div>

                      {article.source_url && (
                        <a
                          href={article.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-burnt-orange text-sm hover:text-ember transition-colors"
                        >
                          View Original Source →
                        </a>
                      )}
                    </div>
                  </div>
                </Card>

                {/* Back to CFB */}
                <div className="mt-8 text-center">
                  <Link href="/cfb">
                    <Button variant="secondary">← Back to CFB Coverage</Button>
                  </Link>
                </div>
              </div>
            </Container>
          </Section>
        )}
      </main>

      <Footer />
    </>
  );
}
