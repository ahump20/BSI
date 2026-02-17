/**
 * Blog Post Feed — Worker handler
 *
 * Two endpoints:
 *   GET /api/blog-post-feed           → paginated list of published posts
 *   GET /api/blog-post-feed/:slug     → single post with full markdown content from R2
 *
 * Storage:
 *   D1 (env.DB):            blog_posts table — metadata + index
 *   R2 (env.ASSETS_BUCKET): blog-posts/{slug}.md — full markdown content
 *   KV (env.KV):            cache keys bp:feed:* and bp:item:*
 */

import type { Env } from '../shared/types';
import { json, cachedJson, kvGet, kvPut, dataHeaders } from '../shared/helpers';
import { HTTP_CACHE } from '../shared/constants';

interface BlogPost {
  id: number;
  slug: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  author: string;
  category: string;
  tags: string;
  featured: number;
  published: number;
  published_at: string;
  read_time_mins: number;
  word_count: number;
  source_context: string | null;
}

export interface BlogPostFeedParams {
  category?: string;
  featured?: boolean;
  limit: number;
  offset: number;
}

// ---------------------------------------------------------------------------
// Feed list — paginated, KV-cached 300s
// ---------------------------------------------------------------------------

export async function handleBlogPostFeedList(
  env: Env,
  params: BlogPostFeedParams
): Promise<Response> {
  const { category, featured, limit, offset } = params;
  const page = Math.floor(offset / limit);
  const cacheKey = `bp:feed:${category ?? 'all'}:${featured ? '1' : '0'}:${page}`;
  const now = new Date().toISOString();

  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) {
    return cachedJson(cached, 200, HTTP_CACHE.standings, {
      ...dataHeaders(now, 'cache'),
      'X-Cache': 'HIT',
    });
  }

  try {
    const conditions: string[] = ['published = 1'];
    const bindings: (string | number)[] = [];

    if (category) {
      conditions.push('category = ?');
      bindings.push(category);
    }
    if (featured) {
      conditions.push('featured = 1');
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const { results } = await env.DB.prepare(
      `SELECT id, slug, title, subtitle, description, author, category, tags,
              featured, published_at, read_time_mins, word_count
       FROM blog_posts
       ${where}
       ORDER BY published_at DESC
       LIMIT ? OFFSET ?`
    )
      .bind(...bindings, limit, offset)
      .all<Omit<BlogPost, 'published' | 'source_context'>>();

    const countRow = await env.DB.prepare(
      `SELECT COUNT(*) as total FROM blog_posts ${where}`
    )
      .bind(...bindings)
      .first<{ total: number }>();

    const payload = {
      posts: results.map((p) => ({
        ...p,
        tags: safeParseJson(p.tags, []),
        featured: Boolean(p.featured),
      })),
      total: countRow?.total ?? results.length,
      limit,
      offset,
      meta: {
        source: 'BSI D1',
        fetched_at: now,
        timezone: 'America/Chicago',
      },
    };

    await kvPut(env.KV, cacheKey, payload, 300);
    return cachedJson(payload, 200, HTTP_CACHE.standings, {
      ...dataHeaders(now, 'BSI D1'),
      'X-Cache': 'MISS',
    });
  } catch (err) {
    console.error('[blog-post-feed] list error:', err);
    return json(
      {
        posts: [],
        total: 0,
        limit,
        offset,
        meta: { source: 'error', fetched_at: now, timezone: 'America/Chicago' },
      },
      200
    );
  }
}

// ---------------------------------------------------------------------------
// Single post — D1 metadata + R2 content, KV-cached 900s
// ---------------------------------------------------------------------------

export async function handleBlogPostFeedItem(slug: string, env: Env): Promise<Response> {
  const cacheKey = `bp:item:${slug}`;
  const now = new Date().toISOString();

  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) {
    return cachedJson(cached, 200, HTTP_CACHE.schedule, {
      ...dataHeaders(now, 'cache'),
      'X-Cache': 'HIT',
    });
  }

  try {
    const row = await env.DB.prepare(
      `SELECT * FROM blog_posts WHERE slug = ? AND published = 1 LIMIT 1`
    )
      .bind(slug)
      .first<BlogPost>();

    if (!row) {
      return json({ error: 'Post not found' }, 404);
    }

    // Fetch markdown from R2
    const r2Object = await env.ASSETS_BUCKET.get(`blog-posts/${slug}.md`);
    const content = r2Object ? await r2Object.text() : '';

    const payload = {
      post: {
        ...row,
        tags: safeParseJson(row.tags, []),
        featured: Boolean(row.featured),
        published: Boolean(row.published),
      },
      content,
      meta: {
        source: 'BSI D1 + R2',
        fetched_at: now,
        timezone: 'America/Chicago',
      },
    };

    await kvPut(env.KV, cacheKey, payload, 900);
    return cachedJson(payload, 200, HTTP_CACHE.schedule, {
      ...dataHeaders(now, 'BSI D1 + R2'),
      'X-Cache': 'MISS',
    });
  } catch (err) {
    console.error('[blog-post-feed] item error:', err);
    return json({ error: 'Post not found' }, 404);
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function safeParseJson<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}
