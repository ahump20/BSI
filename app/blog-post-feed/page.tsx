'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ScrollReveal } from '@/components/cinematic';
import { Footer } from '@/components/layout-ds/Footer';

interface BlogPost {
  id: number;
  slug: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  author: string;
  category: string;
  tags: string[];
  featured: boolean;
  published_at: string;
  read_time_mins: number;
  word_count: number;
}

interface FeedResponse {
  posts: BlogPost[];
  total: number;
  meta: { source: string; fetched_at: string; timezone: string };
}

const CATEGORIES = [
  { key: 'all', label: 'All' },
  { key: 'sports-editorial', label: 'Sports Editorial' },
  { key: 'sports-business', label: 'Sports Business' },
  { key: 'leadership', label: 'Leadership' },
] as const;

type CategoryKey = (typeof CATEGORIES)[number]['key'];

const CATEGORY_VARIANTS: Record<string, 'primary' | 'success' | 'secondary'> = {
  'sports-editorial': 'primary',
  'sports-business': 'success',
  leadership: 'secondary',
};

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'America/Chicago',
  });
}

function categoryLabel(cat: string): string {
  const found = CATEGORIES.find((c) => c.key === cat);
  return found ? found.label : cat;
}

// ---------------------------------------------------------------------------
// Featured Hero Card
// ---------------------------------------------------------------------------

function FeaturedCard({ post }: { post: BlogPost }) {
  return (
    <Link href={`/blog-post-feed/${post.slug}`} className="block group">
      <div className="relative rounded-xl overflow-hidden border border-burnt-orange/30 bg-gradient-to-br from-charcoal-900 via-graphite to-midnight hover:border-burnt-orange/60 transition-all duration-300">
        {/* Glow accent */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-burnt-orange via-ember to-burnt-orange/50" />
        <div className="p-8 md:p-10">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <Badge variant="primary" size="sm">Featured</Badge>
            <Badge
              variant={CATEGORY_VARIANTS[post.category] ?? 'secondary'}
              size="sm"
            >
              {categoryLabel(post.category)}
            </Badge>
            {post.tags.slice(0, 2).map((tag) => (
              <Badge key={tag} variant="secondary" size="sm">{tag}</Badge>
            ))}
          </div>

          <h2 className="font-display text-2xl md:text-3xl lg:text-4xl font-bold uppercase tracking-display text-white mb-3 group-hover:text-burnt-orange transition-colors duration-200 leading-tight">
            {post.title}
          </h2>

          {post.subtitle && (
            <p className="text-text-secondary text-lg mb-4 leading-relaxed">
              {post.subtitle}
            </p>
          )}

          {post.description && (
            <p className="text-text-tertiary text-sm line-clamp-3 mb-6 max-w-2xl">
              {post.description}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-4 text-sm text-text-tertiary">
            <span className="font-medium text-text-secondary">{post.author}</span>
            <span>·</span>
            <span>{formatDate(post.published_at)}</span>
            <span>·</span>
            <span>{post.read_time_mins} min read</span>
          </div>

          <div className="mt-6 inline-flex items-center gap-2 text-burnt-orange font-medium text-sm group-hover:gap-3 transition-all duration-200">
            Read article
            <span className="text-base">→</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Article grid card
// ---------------------------------------------------------------------------

function ArticleCard({ post }: { post: BlogPost }) {
  return (
    <Link href={`/blog-post-feed/${post.slug}`} className="block h-full">
      <Card variant="hover" padding="md" className="h-full flex flex-col">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <Badge
            variant={CATEGORY_VARIANTS[post.category] ?? 'secondary'}
            size="sm"
          >
            {categoryLabel(post.category)}
          </Badge>
        </div>

        <h3 className="font-display text-lg font-bold text-white uppercase tracking-wide mb-2 line-clamp-2 leading-snug flex-1">
          {post.title}
        </h3>

        {post.description && (
          <p className="text-text-secondary text-sm line-clamp-3 mb-4 leading-relaxed">
            {post.description}
          </p>
        )}

        <div className="mt-auto pt-3 border-t border-border-subtle flex items-center justify-between text-xs text-text-tertiary">
          <span>{formatDate(post.published_at)}</span>
          <span>{post.read_time_mins} min</span>
        </div>
      </Card>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Skeleton loader
// ---------------------------------------------------------------------------

function SkeletonCard() {
  return (
    <div className="bg-graphite rounded-lg p-6 animate-pulse">
      <div className="h-4 bg-surface-secondary rounded w-1/4 mb-3" />
      <div className="h-6 bg-surface-secondary rounded w-3/4 mb-2" />
      <div className="h-4 bg-surface-secondary rounded w-full mb-1" />
      <div className="h-4 bg-surface-secondary rounded w-2/3" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function BlogPostFeedPage() {
  const [allPosts, setAllPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<CategoryKey>('all');

  useEffect(() => {
    async function fetchFeed() {
      try {
        const res = await fetch('/api/blog-post-feed?limit=50');
        if (!res.ok) throw new Error('Failed to fetch feed');
        const data: FeedResponse = await res.json();
        setAllPosts(data.posts ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load articles');
      } finally {
        setLoading(false);
      }
    }
    fetchFeed();
  }, []);

  const filteredPosts =
    activeCategory === 'all'
      ? allPosts
      : allPosts.filter((p) => p.category === activeCategory);

  const featuredPost = filteredPosts.find((p) => p.featured) ?? filteredPosts[0] ?? null;
  const gridPosts = featuredPost
    ? filteredPosts.filter((p) => p.slug !== featuredPost.slug)
    : filteredPosts;

  return (
    <>
      <main id="main-content">
        {/* Breadcrumb */}
        <Section padding="sm" className="border-b border-border-subtle">
          <Container>
            <nav className="flex items-center gap-2 text-sm text-text-tertiary">
              <Link href="/" className="hover:text-burnt-orange transition-colors">
                BSI
              </Link>
              <span>/</span>
              <span className="text-white font-medium">Writing</span>
            </nav>
          </Container>
        </Section>

        {/* Hero header */}
        <Section padding="md" className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-radial from-burnt-orange/8 via-transparent to-transparent pointer-events-none" />
          <Container>
            <ScrollReveal direction="up">
              <Badge variant="primary" className="mb-4">Editorial</Badge>
            </ScrollReveal>
            <ScrollReveal direction="up" delay={80}>
              <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold uppercase tracking-display text-gradient-blaze mb-4">
                The Blaze Intel
              </h1>
            </ScrollReveal>
            <ScrollReveal direction="up" delay={150}>
              <p className="text-text-secondary max-w-xl text-base leading-relaxed">
                Original analysis on the athletes, programs, and markets that mainstream sports
                media passes over. Old-school instinct, new-school data.
              </p>
            </ScrollReveal>
          </Container>
        </Section>

        {/* Category tabs */}
        <Section padding="none" className="border-b border-border-subtle bg-midnight/40">
          <Container>
            <div className="flex items-center gap-1 overflow-x-auto py-3 scrollbar-none">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => setActiveCategory(cat.key)}
                  className={`
                    flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-150
                    ${
                      activeCategory === cat.key
                        ? 'bg-burnt-orange text-white'
                        : 'text-text-tertiary hover:text-white hover:bg-surface-light'
                    }
                  `}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </Container>
        </Section>

        {/* Content */}
        <Section padding="lg" background="charcoal" borderTop>
          <Container>
            {loading ? (
              <div className="space-y-8">
                <div className="animate-pulse rounded-xl bg-graphite h-64" />
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <SkeletonCard key={i} />
                  ))}
                </div>
              </div>
            ) : error ? (
              <Card variant="default" padding="lg" className="text-center">
                <p className="text-text-secondary mb-2">Unable to load articles</p>
                <p className="text-text-tertiary text-sm">{error}</p>
              </Card>
            ) : filteredPosts.length === 0 ? (
              <Card variant="default" padding="lg" className="text-center">
                <div className="py-10">
                  <p className="text-text-secondary text-lg mb-2">No articles in this category yet</p>
                  <button
                    onClick={() => setActiveCategory('all')}
                    className="text-burnt-orange text-sm hover:text-ember transition-colors mt-2"
                  >
                    ← View all articles
                  </button>
                </div>
              </Card>
            ) : (
              <div className="space-y-10">
                {/* Featured hero */}
                {featuredPost && (
                  <ScrollReveal direction="up">
                    <FeaturedCard post={featuredPost} />
                  </ScrollReveal>
                )}

                {/* Article grid */}
                {gridPosts.length > 0 && (
                  <>
                    {featuredPost && (
                      <div className="flex items-center gap-3">
                        <span className="font-display text-sm uppercase tracking-widest text-text-tertiary">
                          More Articles
                        </span>
                        <div className="flex-1 h-px bg-border-subtle" />
                      </div>
                    )}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {gridPosts.map((post) => (
                        <ScrollReveal key={post.id}>
                          <ArticleCard post={post} />
                        </ScrollReveal>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </Container>
        </Section>
      </main>

      <Footer />
    </>
  );
}
