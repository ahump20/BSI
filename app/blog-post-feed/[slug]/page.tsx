'use client';

import { use, useState, useEffect } from 'react';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Badge } from '@/components/ui/Badge';
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

interface BlogPostItemResponse {
  post: BlogPost | null;
  content: string | null;
  contentType: string;
  meta: { source: string; fetched_at: string; timezone: string };
  message?: string;
  error?: string;
}

// ── Known slugs for generateStaticParams ──────────────────────────────────

export async function generateStaticParams() {
  return [
    { slug: 'texas-baseball-week-1-recap-lamar-preview-michigan-state-series-2026' },
    { slug: 'cardinals-strategic-intelligence-2025' },
    { slug: 'texas-longhorns-sec-revenue-transformation' },
    { slug: 'championship-leadership-nick-saban' },
    { slug: 'augie-garrido-legacy-of-leadership' },
    { slug: 'nil-revolution-college-athletics' },
  ];
}

// ── Category label map ──────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<string, string> = {
  editorial: 'Sports Editorial',
  'sports-operations': 'Sports Operations',
  leadership: 'Leadership',
  'sports-business': 'Sports Business',
};

const CATEGORY_BADGE: Record<string, 'primary' | 'info' | 'success' | 'warning' | 'accent'> = {
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

// ── Markdown renderer (no external dependency) ─────────────────────────────
//
// Lightweight converter: handles headers, bold, italic, tables, lists,
// code blocks, and horizontal rules. Keeps the BSI design system intact.

function renderMarkdown(md: string): string {
  // Strip YAML frontmatter
  let text = md.replace(/^---[\s\S]*?---\n/, '').trim();

  // Fenced code blocks
  text = text.replace(/```[\w]*\n([\s\S]*?)```/g, (_m, code: string) => {
    const safe = code.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return `<pre class="overflow-x-auto rounded-lg bg-white/5 border border-white/10 p-4 my-4 text-sm font-mono text-white/80 leading-relaxed"><code>${safe}</code></pre>`;
  });

  // Inline code
  text = text.replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 rounded bg-white/10 text-[#FF6B35] text-sm font-mono">$1</code>');

  // Tables — minimal support
  const tableBlockRegex = /(\|.+\|\n)+/g;
  text = text.replace(tableBlockRegex, (table: string) => {
    const rows = table.trim().split('\n');
    let html = '<div class="overflow-x-auto my-6"><table class="w-full text-sm border-collapse">';
    rows.forEach((row, i) => {
      if (/^[\|:\s-]+$/.test(row)) return; // skip separator row
      const cells = row.split('|').filter((_, ci) => ci > 0 && ci < row.split('|').length - 1);
      const tag = i === 0 ? 'th' : 'td';
      const cellClass =
        tag === 'th'
          ? 'px-3 py-2 text-left text-xs font-bold uppercase tracking-wider text-white/60 border-b border-white/10'
          : 'px-3 py-2 text-left text-white/70 border-b border-white/5';
      html += `<tr>${cells.map((c) => `<${tag} class="${cellClass}">${c.trim()}</${tag}>`).join('')}</tr>`;
    });
    html += '</table></div>';
    return html;
  });

  // Blockquotes
  text = text.replace(/^> (.+)$/gm, '<blockquote class="border-l-4 border-[#BF5700] pl-4 my-4 text-white/60 italic">$1</blockquote>');

  // Horizontal rules
  text = text.replace(/^---$/gm, '<hr class="my-8 border-white/10" />');

  // Headers
  text = text.replace(/^### (.+)$/gm, '<h3 class="font-display text-xl font-bold uppercase tracking-wide text-white mt-8 mb-3">$1</h3>');
  text = text.replace(/^## (.+)$/gm, '<h2 class="font-display text-2xl md:text-3xl font-bold uppercase tracking-wide text-white mt-10 mb-4">$1</h2>');
  text = text.replace(/^# (.+)$/gm, '<h1 class="font-display text-3xl md:text-4xl font-bold uppercase tracking-wide text-white mt-10 mb-4">$1</h1>');

  // Bold / italic
  text = text.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-bold text-white">$1</strong>');
  text = text.replace(/\*([^*]+)\*/g, '<em class="italic text-white/80">$1</em>');

  // Unordered lists — group consecutive items
  text = text.replace(/((?:^[-*] .+\n?)+)/gm, (block: string) => {
    const items = block
      .trim()
      .split('\n')
      .map((line) => `<li class="ml-4 text-white/70 leading-relaxed list-disc">${line.replace(/^[-*] /, '')}</li>`)
      .join('');
    return `<ul class="my-4 space-y-1">${items}</ul>`;
  });

  // Ordered lists
  text = text.replace(/((?:^\d+\. .+\n?)+)/gm, (block: string) => {
    const items = block
      .trim()
      .split('\n')
      .map((line) => `<li class="ml-4 text-white/70 leading-relaxed list-decimal">${line.replace(/^\d+\. /, '')}</li>`)
      .join('');
    return `<ol class="my-4 space-y-1">${items}</ol>`;
  });

  // Links
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-[#BF5700] hover:text-[#FF6B35] underline underline-offset-2 transition-colors" target="_blank" rel="noopener noreferrer">$1</a>');

  // Paragraphs — wrap lines not starting with HTML tags
  const paragraphLines = text.split('\n');
  const output: string[] = [];
  for (const line of paragraphLines) {
    const trimmed = line.trim();
    if (!trimmed) {
      output.push('');
    } else if (trimmed.startsWith('<')) {
      output.push(trimmed);
    } else {
      output.push(`<p class="text-white/70 leading-relaxed mb-4">${trimmed}</p>`);
    }
  }

  return output.join('\n');
}

// ── Article skeleton ────────────────────────────────────────────────────────

function ArticleSkeleton() {
  return (
    <div className="animate-pulse space-y-6 max-w-3xl">
      <div className="h-4 w-24 rounded bg-white/5" />
      <div className="h-12 w-3/4 rounded bg-white/5" />
      <div className="h-4 w-1/2 rounded bg-white/5" />
      <div className="h-px bg-white/5" />
      <div className="space-y-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className={`h-4 rounded bg-white/5 ${i % 3 === 0 ? 'w-2/3' : 'w-full'}`} />
        ))}
      </div>
    </div>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────

export default function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { data, loading, error } = useSportData<BlogPostItemResponse>(
    `/api/blog-post-feed/${slug}`
  );

  const post = data?.post ?? null;
  const rawContent = data?.content ?? null;
  const [renderedHtml, setRenderedHtml] = useState<string>('');

  // Render markdown client-side
  useEffect(() => {
    if (rawContent) {
      setRenderedHtml(renderMarkdown(rawContent));
    }
  }, [rawContent]);

  return (
    <>
      <Section padding="lg">
        <Container>
          {/* Back nav */}
          <div className="mb-8">
            <Link
              href="/blog-post-feed"
              className="inline-flex items-center gap-2 text-xs text-white/40 hover:text-white/70 transition-colors uppercase tracking-widest font-semibold"
            >
              <span>←</span>
              <span>Blog Post Feed</span>
            </Link>
          </div>

          {loading && <ArticleSkeleton />}

          {error && (
            <div className="text-center py-20">
              <p className="text-red-400/60 text-sm">Failed to load this article. Please try again.</p>
            </div>
          )}

          {!loading && !error && !post && (
            <div className="text-center py-20">
              <p className="text-white/30 text-sm">Article not found.</p>
              <Link
                href="/blog-post-feed"
                className="mt-4 inline-block text-xs text-[#BF5700] hover:text-[#FF6B35] transition-colors"
              >
                ← Back to all articles
              </Link>
            </div>
          )}

          {post && (
            <div className="max-w-3xl">
              {/* Article header */}
              <header className="mb-10">
                <div className="flex flex-wrap items-center gap-3 mb-5">
                  {post.featured && (
                    <Badge variant="primary" size="sm">
                      Featured
                    </Badge>
                  )}
                  <Badge variant={CATEGORY_BADGE[post.category] ?? 'accent'} size="sm">
                    {CATEGORY_LABELS[post.category] ?? post.category}
                  </Badge>
                </div>

                <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold uppercase tracking-wide text-white mb-4 leading-tight">
                  {post.title}
                </h1>

                {post.subtitle && (
                  <p className="text-white/60 text-lg md:text-xl font-medium mb-4">
                    {post.subtitle}
                  </p>
                )}

                {post.description && (
                  <p className="text-white/40 text-sm md:text-base leading-relaxed mb-6">
                    {post.description}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-4 text-xs text-white/40 pb-6 border-b border-white/10">
                  <span className="font-semibold text-white/60">{post.author}</span>
                  <span>·</span>
                  <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
                  <span>·</span>
                  <span>{post.readTimeMins} min read</span>
                  {post.wordCount > 0 && (
                    <>
                      <span>·</span>
                      <span>{post.wordCount.toLocaleString()} words</span>
                    </>
                  )}
                </div>

                {post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-4">
                    {post.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider border border-white/10 text-white/40"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </header>

              {/* Article body */}
              {renderedHtml ? (
                <article
                  className="prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: renderedHtml }}
                />
              ) : (
                rawContent && (
                  <article className="text-white/70 leading-relaxed whitespace-pre-wrap font-mono text-sm">
                    {rawContent}
                  </article>
                )
              )}

              {/* Source context footer */}
              {post.sourceContext && (
                <div className="mt-12 pt-6 border-t border-white/10">
                  <p className="text-xs text-white/20 font-mono">
                    Source: {post.sourceContext}
                  </p>
                </div>
              )}

              {/* Back link */}
              <div className="mt-12 pt-6 border-t border-white/10">
                <Link
                  href="/blog-post-feed"
                  className="inline-flex items-center gap-2 text-xs text-[#BF5700] hover:text-[#FF6B35] transition-colors uppercase tracking-widest font-semibold"
                >
                  <span>←</span>
                  <span>All articles</span>
                </Link>
              </div>
            </div>
          )}
        </Container>
      </Section>

      <Footer />
    </>
  );
}
