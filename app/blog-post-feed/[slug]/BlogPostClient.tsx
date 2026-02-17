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
  source_context: string | null;
}

interface PostResponse {
  post: BlogPost;
  content: string;
  meta: { source: string; fetched_at: string; timezone: string };
}

// ---------------------------------------------------------------------------
// Lightweight markdown renderer — handles the exact patterns BSI content uses
// ---------------------------------------------------------------------------

type MdNode =
  | { type: 'h2'; text: string }
  | { type: 'h3'; text: string }
  | { type: 'hr' }
  | { type: 'table'; headers: string[]; rows: string[][] }
  | { type: 'ul'; items: string[] }
  | { type: 'ol'; items: string[] }
  | { type: 'p'; text: string }
  | { type: 'blank' };

function applyInline(text: string): React.ReactNode[] {
  // Handle **bold**
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="text-white font-semibold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

function parseMarkdown(raw: string): MdNode[] {
  const lines = raw.split('\n');
  const nodes: MdNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Horizontal rule
    if (/^\s*---\s*$/.test(line)) {
      nodes.push({ type: 'hr' });
      i++;
      continue;
    }

    // h2
    const h2 = line.match(/^## (.+)$/);
    if (h2) {
      nodes.push({ type: 'h2', text: h2[1] });
      i++;
      continue;
    }

    // h3
    const h3 = line.match(/^### (.+)$/);
    if (h3) {
      nodes.push({ type: 'h3', text: h3[1] });
      i++;
      continue;
    }

    // Table — collect consecutive | lines
    if (line.trimStart().startsWith('|')) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trimStart().startsWith('|')) {
        tableLines.push(lines[i]);
        i++;
      }
      // First line = headers, second = separator (skip), rest = data
      const parseRow = (row: string) =>
        row.split('|').slice(1, -1).map((c) => c.trim());

      if (tableLines.length >= 2) {
        const headers = parseRow(tableLines[0]);
        const rows = tableLines.slice(2).map(parseRow);
        nodes.push({ type: 'table', headers, rows });
      }
      continue;
    }

    // Unordered list — collect consecutive "- " lines
    if (/^- /.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^- /.test(lines[i])) {
        items.push(lines[i].replace(/^- /, ''));
        i++;
      }
      nodes.push({ type: 'ul', items });
      continue;
    }

    // Ordered list — "1) " or "1. " format
    if (/^\d+[.)]\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+[.)]\s/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+[.)]\s/, ''));
        i++;
      }
      nodes.push({ type: 'ol', items });
      continue;
    }

    // Blank line
    if (line.trim() === '') {
      nodes.push({ type: 'blank' });
      i++;
      continue;
    }

    // Paragraph text
    nodes.push({ type: 'p', text: line });
    i++;
  }

  return nodes;
}

function MarkdownRenderer({ content }: { content: string }) {
  const nodes = parseMarkdown(content);

  return (
    <div className="space-y-1">
      {nodes.map((node, idx) => {
        switch (node.type) {
          case 'h2':
            return (
              <h2
                key={idx}
                className="font-display text-2xl md:text-3xl font-bold text-white uppercase tracking-display mt-10 mb-4 first:mt-0"
              >
                {node.text}
              </h2>
            );

          case 'h3':
            return (
              <h3
                key={idx}
                className="font-display text-lg font-bold text-white uppercase tracking-wide mt-7 mb-3"
              >
                {node.text}
              </h3>
            );

          case 'hr':
            return (
              <hr
                key={idx}
                className="my-8 border-t border-border-subtle"
              />
            );

          case 'table':
            return (
              <div key={idx} className="overflow-x-auto my-6 rounded-lg border border-border-subtle">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border-subtle bg-surface-light">
                      {node.headers.map((h, hi) => (
                        <th
                          key={hi}
                          className="px-4 py-2.5 text-left text-text-tertiary font-medium font-display uppercase tracking-wide text-xs whitespace-nowrap"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {node.rows.map((row, ri) => (
                      <tr
                        key={ri}
                        className="border-t border-border-subtle hover:bg-surface-light/50 transition-colors"
                      >
                        {row.map((cell, ci) => (
                          <td
                            key={ci}
                            className="px-4 py-2.5 text-text-secondary"
                          >
                            {applyInline(cell)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );

          case 'ul':
            return (
              <ul key={idx} className="my-3 space-y-1.5 pl-1">
                {node.items.map((item, ii) => (
                  <li key={ii} className="flex items-start gap-2 text-text-secondary leading-relaxed">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-burnt-orange flex-shrink-0" />
                    <span>{applyInline(item)}</span>
                  </li>
                ))}
              </ul>
            );

          case 'ol':
            return (
              <ol key={idx} className="my-3 space-y-1.5 pl-1">
                {node.items.map((item, ii) => (
                  <li key={ii} className="flex items-start gap-3 text-text-secondary leading-relaxed">
                    <span className="mt-0.5 font-display text-burnt-orange font-bold text-sm flex-shrink-0 w-5 text-right">
                      {ii + 1})
                    </span>
                    <span>{applyInline(item)}</span>
                  </li>
                ))}
              </ol>
            );

          case 'blank':
            return <div key={idx} className="h-3" />;

          case 'p':
            return (
              <p key={idx} className="text-text-secondary leading-relaxed">
                {applyInline(node.text)}
              </p>
            );

          default:
            return null;
        }
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'America/Chicago',
  });
}

const CATEGORY_VARIANTS: Record<string, 'primary' | 'success' | 'secondary'> = {
  'sports-editorial': 'primary',
  'sports-business': 'success',
  leadership: 'secondary',
};

const CATEGORY_LABELS: Record<string, string> = {
  'sports-editorial': 'Sports Editorial',
  'sports-business': 'Sports Business',
  leadership: 'Leadership',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function BlogPostClient() {
  const params = useParams();
  const slug = params.slug as string;

  const [post, setPost] = useState<BlogPost | null>(null);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPost() {
      try {
        const res = await fetch(`/api/blog-post-feed/${slug}`);
        if (res.status === 404) {
          setError('Article not found');
          return;
        }
        if (!res.ok) throw new Error('Failed to fetch article');
        const data: PostResponse = await res.json();
        setPost(data.post);
        setContent(data.content ?? '');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load article');
      } finally {
        setLoading(false);
      }
    }
    fetchPost();
  }, [slug]);

  return (
    <>
      <main id="main-content" className="min-h-screen bg-midnight">
        {/* Hero */}
        <Section
          padding="lg"
          className="bg-gradient-to-b from-charcoal to-midnight relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-radial from-burnt-orange/5 via-transparent to-transparent pointer-events-none" />

          <Container>
            <div className="max-w-3xl mx-auto">
              {/* Breadcrumb */}
              <nav className="mb-8">
                <ol className="flex items-center gap-2 text-sm text-text-tertiary">
                  <li>
                    <Link href="/" className="hover:text-burnt-orange transition-colors">
                      BSI
                    </Link>
                  </li>
                  <li>/</li>
                  <li>
                    <Link
                      href="/blog-post-feed"
                      className="hover:text-burnt-orange transition-colors"
                    >
                      Writing
                    </Link>
                  </li>
                  <li>/</li>
                  <li className="text-text-secondary truncate max-w-48">Article</li>
                </ol>
              </nav>

              {loading ? (
                <div className="animate-pulse space-y-4">
                  <div className="h-5 bg-surface-secondary rounded w-1/4" />
                  <div className="h-10 bg-surface-secondary rounded w-3/4" />
                  <div className="h-5 bg-surface-secondary rounded w-1/2" />
                  <div className="h-4 bg-surface-secondary rounded w-1/3 mt-6" />
                </div>
              ) : error ? (
                <Card variant="default" padding="lg" className="text-center">
                  <h1 className="text-2xl font-semibold text-white mb-4">{error}</h1>
                  <p className="text-text-tertiary mb-6">
                    This article doesn&apos;t exist or hasn&apos;t been published yet.
                  </p>
                  <Link href="/blog-post-feed">
                    <Button variant="primary">← Back to Writing</Button>
                  </Link>
                </Card>
              ) : post ? (
                <div>
                  {/* Meta badges */}
                  <div className="flex flex-wrap items-center gap-2 mb-5">
                    <Badge
                      variant={CATEGORY_VARIANTS[post.category] ?? 'secondary'}
                    >
                      {CATEGORY_LABELS[post.category] ?? post.category}
                    </Badge>
                    {post.featured && <Badge variant="primary">Featured</Badge>}
                    {post.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="secondary" size="sm">{tag}</Badge>
                    ))}
                  </div>

                  {/* Title */}
                  <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold uppercase tracking-display text-white mb-4 leading-tight">
                    {post.title}
                  </h1>

                  {post.subtitle && (
                    <p className="text-xl text-text-secondary leading-relaxed mb-5">
                      {post.subtitle}
                    </p>
                  )}

                  {/* Byline */}
                  <div className="flex flex-wrap items-center gap-3 text-sm text-text-tertiary border-t border-border-subtle pt-5">
                    <span className="font-medium text-text-secondary">{post.author}</span>
                    <span>·</span>
                    <span>{formatDate(post.published_at)}</span>
                    <span>·</span>
                    <span>{post.read_time_mins} min read</span>
                    {post.word_count > 0 && (
                      <>
                        <span>·</span>
                        <span>{post.word_count.toLocaleString()} words</span>
                      </>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          </Container>
        </Section>

        {/* Article body */}
        {post && !loading && !error && (
          <Section padding="lg" background="midnight">
            <Container>
              <div className="max-w-3xl mx-auto">
                <Card variant="default" padding="lg">
                  <article>
                    {content ? (
                      <MarkdownRenderer content={content} />
                    ) : (
                      <p className="text-text-tertiary italic">
                        Article content coming soon.
                      </p>
                    )}
                  </article>

                  {/* Footer */}
                  <div className="mt-10 pt-6 border-t border-border-subtle">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="text-xs text-text-tertiary">
                        <span>Blaze Sports Intel · {formatDate(post.published_at)}</span>
                        {post.source_context && (
                          <span className="ml-2 opacity-60">· {post.source_context}</span>
                        )}
                      </div>
                      <span className="text-xs text-text-tertiary">
                        blazesportsintel.com
                      </span>
                    </div>
                  </div>
                </Card>

                {/* Back link */}
                <div className="mt-8 text-center">
                  <Link href="/blog-post-feed">
                    <Button variant="secondary">← Back to Writing</Button>
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
