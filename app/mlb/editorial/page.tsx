'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ScrollReveal } from '@/components/cinematic';
import { IntelSignup } from '@/components/home/IntelSignup';
import { Footer } from '@/components/layout-ds/Footer';

// ── Filter tags ──────────────────────────────────────────────────────────

type FilterTag = 'All' | 'AL East' | 'AL Central' | 'AL West' | 'NL East' | 'NL Central' | 'NL West' | 'Preview' | 'Analysis';

const FILTER_TAGS: FilterTag[] = ['All', 'AL East', 'AL Central', 'AL West', 'NL East', 'NL Central', 'NL West', 'Preview', 'Analysis'];

// ── Feature articles ────────────────────────────────────────────────────

interface FeatureArticle {
  title: string;
  slug: string;
  description: string;
  date: string;
  readTime: string;
  badge: string;
  tags: FilterTag[];
}

const FEATURE_ARTICLES: FeatureArticle[] = [
  {
    title: '2026 MLB Season Preview: The Offseason That Reshuffled Everything',
    slug: '2026-season-preview',
    description:
      'Tucker\'s record AAV. Robot umpires. Nine new managers. The Mets\' total roster overhaul. Division-by-division analysis of every contender, every rebuild, and the mechanisms that will decide October.',
    date: 'February 25, 2026',
    readTime: '22 min',
    badge: 'Season Preview',
    tags: ['Preview'],
  },
];

// ── Filter bar ──────────────────────────────────────────────────────────

function TagFilterBar({ activeTag, onTagChange }: { activeTag: FilterTag; onTagChange: (tag: FilterTag) => void }) {
  return (
    <Section padding="sm" className="border-b border-border sticky top-0 z-30 bg-background-secondary/95 backdrop-blur-sm">
      <Container>
        <nav className="flex items-center gap-2 overflow-x-auto scrollbar-hide -mx-1 px-1 py-1" aria-label="Filter articles by tag">
          {FILTER_TAGS.map((tag) => {
            const isActive = tag === activeTag;
            return (
              <button
                key={tag}
                onClick={() => onTagChange(tag)}
                className={`
                  shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider
                  border transition-all whitespace-nowrap
                  ${isActive
                    ? 'bg-burnt-orange/20 text-burnt-orange border-burnt-orange/40'
                    : 'bg-surface-light text-text-muted border-border hover:text-text-secondary hover:border-border-subtle'
                  }
                `}
                aria-pressed={isActive}
              >
                {tag}
              </button>
            );
          })}
        </nav>
      </Container>
    </Section>
  );
}

// ── Page ────────────────────────────────────────────────────────────────

export default function MLBEditorialPage() {
  const [activeTag, setActiveTag] = useState<FilterTag>('All');

  const filteredArticles = activeTag === 'All'
    ? FEATURE_ARTICLES
    : FEATURE_ARTICLES.filter((a) => a.tags.includes(activeTag));

  const featured = filteredArticles[0] ?? null;
  const remainingArticles = filteredArticles.slice(featured ? 1 : 0);

  return (
    <>
      <main id="main-content">
        {/* Breadcrumb */}
        <Section padding="sm" className="border-b border-border">
          <Container>
            <nav className="flex items-center gap-2 text-sm">
              <Link href="/mlb" className="text-text-muted hover:text-burnt-orange transition-colors">
                MLB
              </Link>
              <span className="text-text-muted">/</span>
              <span className="text-text-primary">Editorial</span>
            </nav>
          </Container>
        </Section>

        {/* Hero */}
        <Section padding="lg" className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-burnt-orange/8 via-transparent to-[#C9A227]/5 pointer-events-none" />
          <Container>
            <ScrollReveal direction="up">
              <div className="max-w-3xl mb-8">
                <Badge variant="primary" className="mb-4">2026 Season</Badge>
                <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold uppercase tracking-wide mb-4">
                  MLB{' '}
                  <span className="text-gradient-blaze">Editorial</span>
                </h1>
                <p className="text-text-tertiary text-lg leading-relaxed">
                  Season previews, division analysis, and long-form coverage of all 30 teams.
                  The depth this sport has always deserved.
                </p>
              </div>
            </ScrollReveal>

            {/* Featured Article */}
            {featured && (
              <ScrollReveal direction="up" delay={100}>
                <Link href={`/mlb/editorial/${featured.slug}`} className="block group">
                  <div className="relative bg-gradient-to-r from-burnt-orange/15 to-[#C9A227]/10 border border-burnt-orange/25 rounded-xl p-6 md:p-8 hover:border-burnt-orange/50 transition-all overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-radial from-[#C9A227]/10 to-transparent pointer-events-none" />
                    <div className="relative">
                      <div className="flex items-center gap-3 mb-3">
                        <Badge variant="secondary">{featured.badge}</Badge>
                        <span className="text-text-muted text-sm">{featured.date}</span>
                        <span className="text-text-muted text-sm">{featured.readTime}</span>
                      </div>
                      <h2 className="font-display text-2xl md:text-3xl font-bold text-text-primary uppercase tracking-wide group-hover:text-burnt-orange transition-colors mb-2">
                        {featured.title}
                      </h2>
                      <p className="text-text-tertiary max-w-xl">{featured.description}</p>
                      <div className="mt-4 flex items-center gap-2 text-burnt-orange text-sm font-semibold group-hover:text-ember transition-colors">
                        Read article
                        <svg viewBox="0 0 24 24" className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M9 18l6-6-6-6" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </Link>
              </ScrollReveal>
            )}
          </Container>
        </Section>

        {/* Tag Filter Bar */}
        <TagFilterBar activeTag={activeTag} onTagChange={setActiveTag} />

        {/* Remaining Articles */}
        {remainingArticles.length > 0 && (
          <Section padding="lg" background="charcoal" borderTop>
            <Container>
              <ScrollReveal direction="up">
                <h2 className="font-display text-xl font-bold uppercase tracking-wide text-text-secondary mb-6">
                  All Articles
                </h2>
              </ScrollReveal>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {remainingArticles.map((article, i) => (
                  <ScrollReveal key={article.slug} direction="up" delay={i * 60}>
                    <Link href={`/mlb/editorial/${article.slug}`} className="block group">
                      <Card variant="default" padding="md" className="h-full hover:border-burnt-orange/30 transition-all">
                        <div className="flex items-center gap-2 mb-3">
                          <Badge variant="secondary">{article.badge}</Badge>
                          <span className="text-text-muted text-xs">{article.readTime}</span>
                        </div>
                        <h3 className="font-display text-sm font-bold text-text-primary uppercase tracking-wide group-hover:text-burnt-orange transition-colors mb-1.5">
                          {article.title}
                        </h3>
                        <p className="text-text-muted text-xs leading-relaxed">{article.description}</p>
                        <p className="text-text-muted text-[10px] mt-3">{article.date}</p>
                      </Card>
                    </Link>
                  </ScrollReveal>
                ))}
              </div>
            </Container>
          </Section>
        )}

        {/* Empty state */}
        {filteredArticles.length === 0 && (
          <Section padding="lg">
            <Container>
              <div className="text-center py-12">
                <p className="text-text-muted text-sm">No editorial content matches this filter yet.</p>
                <button
                  onClick={() => setActiveTag('All')}
                  className="mt-4 text-burnt-orange hover:text-ember text-sm font-semibold transition-colors"
                >
                  Clear filter
                </button>
              </div>
            </Container>
          </Section>
        )}

        {/* Stats Band */}
        <Section padding="md" background="midnight" borderTop>
          <Container>
            <ScrollReveal direction="up">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                <div>
                  <div className="font-display text-3xl font-bold text-burnt-orange">30</div>
                  <div className="text-text-muted text-xs uppercase tracking-wider mt-1">MLB Teams</div>
                </div>
                <div>
                  <div className="font-display text-3xl font-bold text-burnt-orange">6</div>
                  <div className="text-text-muted text-xs uppercase tracking-wider mt-1">Divisions</div>
                </div>
                <div>
                  <div className="font-display text-3xl font-bold text-[#C9A227]">162</div>
                  <div className="text-text-muted text-xs uppercase tracking-wider mt-1">Games / Season</div>
                </div>
                <div>
                  <div className="font-display text-3xl font-bold text-burnt-orange">1</div>
                  <div className="text-text-muted text-xs uppercase tracking-wider mt-1">Feature Article</div>
                </div>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* Email Capture */}
        <Section padding="md" borderTop>
          <Container>
            <div className="max-w-md mx-auto">
              <IntelSignup sport="mlb" />
            </div>
          </Container>
        </Section>

        {/* Data Attribution */}
        <Section padding="sm" borderTop>
          <Container>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <p className="text-text-muted text-xs">
                Data: MLB / ESPN / FanGraphs / Baseball Prospectus &mdash; February 2026
              </p>
              <Link href="/mlb" className="text-sm text-burnt-orange hover:text-ember transition-colors">
                &larr; Back to MLB
              </Link>
            </div>
          </Container>
        </Section>
      </main>

      <Footer />
    </>
  );
}
