'use client';

import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ScrollReveal } from '@/components/cinematic';
import { Navbar } from '@/components/layout-ds/Navbar';
import { Footer } from '@/components/layout-ds/Footer';

const navItems = [
  { label: 'Home', href: '/' },
  { label: 'College Baseball', href: '/college-baseball' },
  { label: 'MLB', href: '/mlb' },
  { label: 'NFL', href: '/nfl' },
  { label: 'CFB', href: '/cfb' },
  { label: 'Dashboard', href: '/dashboard' },
];

interface ArticleMetadata {
  seoTitle?: string;
  metaDescription?: string;
  homeTeam?: string;
  awayTeam?: string;
  gameDate?: string;
  venue?: string;
}

interface ArticleData {
  slug: string;
  title: string;
  excerpt: string | null;
  bodyHtml: string;
  contentType: string;
  publishedAt: string | null;
  updatedAt: string | null;
  gameId: string | null;
  metadata: ArticleMetadata;
}

interface CFBArticleClientProps {
  article: ArticleData;
}

function formatDate(dateString: string | null): string {
  if (!dateString) return '';

  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'America/Chicago',
  });
}

function formatTime(dateString: string | null): string {
  if (!dateString) return '';

  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'America/Chicago',
  });
}

export default function CFBArticleClient({ article }: CFBArticleClientProps) {
  const isPreview = article.contentType === 'preview';
  const backLink = isPreview ? '/cfb/previews' : '/cfb/recaps';
  const backLabel = isPreview ? 'All Previews' : 'All Recaps';

  return (
    <>
      <Navbar items={navItems} />

      <main id="main-content">
        <article>
          {/* Article Header */}
          <Section padding="lg" className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-radial from-burnt-orange/10 via-transparent to-transparent pointer-events-none" />

            <Container>
              <ScrollReveal direction="up">
                {/* Breadcrumb */}
                <nav className="mb-8 text-sm" aria-label="Breadcrumb">
                  <ol className="flex items-center gap-2 text-text-tertiary">
                    <li>
                      <Link href="/cfb" className="hover:text-burnt-orange transition-colors">
                        CFB
                      </Link>
                    </li>
                    <li>/</li>
                    <li>
                      <Link href={backLink} className="hover:text-burnt-orange transition-colors">
                        {backLabel}
                      </Link>
                    </li>
                    <li>/</li>
                    <li className="text-text-secondary truncate max-w-xs">{article.title}</li>
                  </ol>
                </nav>

                {/* Badge and Date */}
                <div className="flex flex-wrap items-center gap-4 mb-6">
                  <Badge variant={isPreview ? 'primary' : 'success'}>
                    {isPreview ? 'Game Preview' : 'Game Recap'}
                  </Badge>
                  {article.publishedAt && (
                    <time
                      dateTime={article.publishedAt}
                      className="text-sm text-text-tertiary"
                    >
                      {formatDate(article.publishedAt)} at {formatTime(article.publishedAt)} CT
                    </time>
                  )}
                </div>

                {/* Title */}
                <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold uppercase tracking-display mb-6">
                  {article.title}
                </h1>

                {/* Excerpt */}
                {article.excerpt && (
                  <p className="text-xl text-text-secondary max-w-3xl leading-relaxed">
                    {article.excerpt}
                  </p>
                )}

                {/* Game Metadata */}
                {(article.metadata.homeTeam || article.metadata.venue || article.metadata.gameDate) && (
                  <div className="mt-8 p-4 bg-charcoal/50 rounded-lg border border-border-subtle">
                    <div className="flex flex-wrap gap-6 text-sm">
                      {article.metadata.homeTeam && article.metadata.awayTeam && (
                        <div>
                          <span className="text-text-tertiary">Matchup:</span>{' '}
                          <span className="text-white font-medium">
                            {article.metadata.awayTeam} @ {article.metadata.homeTeam}
                          </span>
                        </div>
                      )}
                      {article.metadata.venue && (
                        <div>
                          <span className="text-text-tertiary">Venue:</span>{' '}
                          <span className="text-white">{article.metadata.venue}</span>
                        </div>
                      )}
                      {article.metadata.gameDate && (
                        <div>
                          <span className="text-text-tertiary">Game Date:</span>{' '}
                          <span className="text-white">{article.metadata.gameDate}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </ScrollReveal>
            </Container>
          </Section>

          {/* Article Body */}
          <Section padding="lg" background="charcoal">
            <Container>
              <ScrollReveal>
                <div
                  className="prose prose-invert prose-lg max-w-4xl mx-auto
                    prose-headings:font-display prose-headings:uppercase prose-headings:tracking-wide
                    prose-h2:text-2xl prose-h2:text-white prose-h2:border-b prose-h2:border-border-subtle prose-h2:pb-2 prose-h2:mb-6
                    prose-h3:text-xl prose-h3:text-white
                    prose-p:text-text-secondary prose-p:leading-relaxed
                    prose-strong:text-white prose-strong:font-semibold
                    prose-a:text-burnt-orange prose-a:no-underline hover:prose-a:underline
                    prose-ul:text-text-secondary prose-ol:text-text-secondary
                    prose-li:marker:text-burnt-orange
                    prose-blockquote:border-l-burnt-orange prose-blockquote:text-text-tertiary prose-blockquote:italic
                    prose-code:text-burnt-orange prose-code:bg-midnight prose-code:px-1 prose-code:rounded"
                  dangerouslySetInnerHTML={{ __html: article.bodyHtml }}
                />
              </ScrollReveal>

              {/* Article Footer */}
              <ScrollReveal delay={100}>
                <div className="mt-12 pt-8 border-t border-border-subtle max-w-4xl mx-auto">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    {article.updatedAt && article.updatedAt !== article.publishedAt && (
                      <p className="text-sm text-text-tertiary">
                        Last updated: {formatDate(article.updatedAt)}
                      </p>
                    )}
                    <div className="flex gap-4">
                      <Link href={backLink}>
                        <Button variant="secondary" size="sm">
                          ← {backLabel}
                        </Button>
                      </Link>
                      <Link href="/cfb">
                        <Button variant="primary" size="sm">
                          All CFB Coverage
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            </Container>
          </Section>
        </article>
      </main>

      <Footer />
    </>
  );
}
