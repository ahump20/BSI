'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Badge } from '@/components/ui/Badge';
import { ScrollReveal } from '@/components/cinematic';
import { Footer } from '@/components/layout-ds/Footer';
import { useSportData } from '@/lib/hooks/useSportData';

// ── Types ──────────────────────────────────────────────────────────────────

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
  publishedAt: string;
  readTimeMins: number;
  wordCount: number;
  sourceContext: string | null;
  createdAt: string;
}

interface BlogPostFeedResponse {
  posts: BlogPost[];
  total: number;
  limit: number;
  offset: number;
  meta: { source: string; fetched_at: string; timezone: string };
  message?: string;
}

// ── Category config ────────────────────────────────────────────────────────

type CategoryFilter =
  | 'all'
  | 'editorial'
  | 'sports-operations'
  | 'leadership'
  | 'sports-business';

const CATEGORY_LABELS: Record<CategoryFilter, string> = {
  all: 'All',
  editorial: 'Sports Editorial',
  'sports-operations': 'Sports Operations',
  leadership: 'Leadership',
  'sports-business': 'Sports Business',
};

const CATEGORY_BADGE_VARIANT: Record<string, 'primary' | 'info' | 'success' | 'warning' | 'accent'> = {
  editorial: 'primary',
  'sports-operations': 'info',
  leadership: 'success',
  'sports-business': 'warning',
};

// ── Helpers ────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'America/Chicago',
    });
  } catch {
    return iso;
  }
}

function categoryBadgeVariant(cat: string) {
  return CATEGORY_BADGE_VARIANT[cat] ?? 'accent';
}

// ── Featured Hero Card ──────────────────────────────────────────────────────

function FeaturedCard({ post }: { post: BlogPost }) {
  return (
    <Link href={`/blog-post-feed/${post.slug}`} className="block group">
      <div className="relative rounded-2xl border border-white/10 bg-gradient-to-br from-[#BF5700]/10 via-black/40 to-black/60 p-8 md:p-10 overflow-hidden hover:border-[#BF5700]/40 transition-colors duration-300">
        {/* Glow accent */}
        <div className="absolute top-0 left-0 w-48 h-48 bg-[#BF5700]/10 rounded-full -translate-x-24 -translate-y-24 blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <Badge variant="primary" size="sm">
              Featured
            </Badge>
            <Badge variant={categoryBadgeVariant(post.category)} size="sm">
              {CATEGORY_LABELS[post.category as CategoryFilter] ?? post.category}
            </Badge>
          </div>

          <h2 className="font-display text-2xl md:text-3xl lg:text-4xl font-bold uppercase tracking-wide text-white mb-3 group-hover:text-[#FF6B35] transition-colors duration-200 leading-tight">
            {post.title}
          </h2>

          {post.subtitle && (
            <p className="text-white/60 text-base md:text-lg mb-4 font-medium">{post.subtitle}</p>
          )}

          {post.description && (
            <p className="text-white/50 text-sm md:text-base leading-relaxed mb-6 max-w-2xl">
              {post.description}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-4 text-xs text-white/40">
            <span className="font-medium text-white/60">{post.author}</span>
            <span>·</span>
            <span>{formatDate(post.publishedAt)}</span>
            <span>·</span>
            <span>{post.readTimeMins} min read</span>
          </div>

          {post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {post.tags.slice(0, 4).map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider border border-white/10 text-white/40"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

// ── Article Card ────────────────────────────────────────────────────────────

function ArticleCard({ post }: { post: BlogPost }) {
  return (
    <Link href={`/blog-post-feed/${post.slug}`} className="block group h-full">
      <div className="h-full flex flex-col rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/20 transition-all duration-200 p-6">
        <div className="flex items-start justify-between gap-3 mb-3">
          <Badge variant={categoryBadgeVariant(post.category)} size="sm">
            {CATEGORY_LABELS[post.category as CategoryFilter] ?? post.category}
          </Badge>
          <span className="text-[10px] text-white/30 whitespace-nowrap mt-0.5 font-mono">
            {post.readTimeMins} min
          </span>
        </div>

        <h3 className="font-display text-base md:text-lg font-bold uppercase tracking-wide text-white mb-2 group-hover:text-[#FF6B35] transition-colors duration-200 leading-snug flex-1">
          {post.title}
        </h3>

        {post.description && (
          <p className="text-white/40 text-sm leading-relaxed mb-4 line-clamp-2">
            {post.description}
          </p>
        )}

        <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
          <span className="text-xs text-white/30">{formatDate(post.publishedAt)}</span>
          <span className="text-xs text-[#BF5700] font-medium group-hover:text-[#FF6B35] transition-colors">
            Read →
          </span>
        </div>
      </div>
    </Link>
  );
}

// ── Loading Skeleton ────────────────────────────────────────────────────────

function FeedSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-56 rounded-2xl bg-white/5" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-48 rounded-xl bg-white/5" />
        ))}
      </div>
    </div>
  );
}

// ── Empty State ─────────────────────────────────────────────────────────────

function EmptyFeed({ category }: { category: CategoryFilter }) {
  return (
    <div className="text-center py-20">
      <p className="text-white/30 text-sm">
        {category === 'all'
          ? 'No articles published yet. Check back soon.'
          : `No ${CATEGORY_LABELS[category]} articles yet.`}
      </p>
    </div>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────

export default function BlogPostFeedPage() {
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('all');

  const apiUrl =
    activeCategory === 'all'
      ? '/api/blog-post-feed?limit=24'
      : `/api/blog-post-feed?limit=24&category=${activeCategory}`;

  const { data, loading, error } = useSportData<BlogPostFeedResponse>(apiUrl);

  const allPosts = data?.posts ?? [];
  const featuredPost = allPosts.find((p) => p.featured) ?? null;
  const gridPosts = allPosts.filter((p) => !p.featured || activeCategory !== 'all');

  return (
    <>
      {/* Hero header */}
      <Section padding="lg">
        <Container>
          <ScrollReveal direction="up">
            <div className="max-w-3xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-1 h-10 rounded-full bg-[#BF5700]" />
                <span className="text-[#BF5700] text-xs font-bold uppercase tracking-[0.2em]">
                  Blaze Sports Intel
                </span>
              </div>
              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold uppercase tracking-wide text-white mb-4 leading-none">
                Blog Post Feed
              </h1>
              <p className="text-white/50 text-base md:text-lg leading-relaxed">
                Feature articles, sports intelligence analysis, and editorial writing
                by Austin Humphrey — spanning game recaps, organizational strategy,
                leadership frameworks, and sports business.
              </p>
            </div>
          </ScrollReveal>
        </Container>
      </Section>

      {/* Category filter tabs */}
      <Section padding="sm">
        <Container>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(CATEGORY_LABELS) as CategoryFilter[]).map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider border transition-all duration-200 ${
                  activeCategory === cat
                    ? 'bg-[#BF5700]/20 text-[#FF6B35] border-[#BF5700]/40'
                    : 'bg-white/5 text-white/50 border-white/10 hover:bg-white/10 hover:text-white/70'
                }`}
              >
                {CATEGORY_LABELS[cat]}
              </button>
            ))}
          </div>
        </Container>
      </Section>

      {/* Feed content */}
      <Section padding="md">
        <Container>
          {loading && <FeedSkeleton />}

          {error && (
            <div className="text-center py-20">
              <p className="text-red-400/60 text-sm">Failed to load articles. Please try again.</p>
            </div>
          )}

          {!loading && !error && (
            <>
              {allPosts.length === 0 ? (
                <EmptyFeed category={activeCategory} />
              ) : (
                <div className="space-y-8">
                  {/* Featured hero (only shown in "All" view) */}
                  {featuredPost && activeCategory === 'all' && (
                    <ScrollReveal direction="up">
                      <FeaturedCard post={featuredPost} />
                    </ScrollReveal>
                  )}

                  {/* Article grid */}
                  {gridPosts.length > 0 && (
                    <ScrollReveal direction="up" delay={0.1}>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {gridPosts.map((post) => (
                          <ArticleCard key={post.slug} post={post} />
                        ))}
                      </div>
                    </ScrollReveal>
                  )}
                </div>
              )}
            </>
          )}
        </Container>
      </Section>

      <Footer />
    </>
  );
}
