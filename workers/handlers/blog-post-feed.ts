/**
 * Blog Post Feed — Worker Handler
 *
 * Serves metadata from D1 (blog_posts table) and full markdown
 * content from R2 (blog-posts/{slug}.md).
 *
 * Routes:
 *   GET /api/blog-post-feed                 → list with optional filters
 *   GET /api/blog-post-feed/:slug           → single article (metadata + content)
 */

import type { Env } from '../shared/types';
import { json, cachedJson, kvGet, kvPut, dataHeaders } from '../shared/helpers';
import { HTTP_CACHE } from '../shared/constants';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BlogPostRow {
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
  created_at: string;
  updated_at: string;
}

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

export interface BlogPostFeedListParams {
  category?: string;
  featured?: boolean;
  limit?: number;
  offset?: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function rowToPost(row: BlogPostRow): BlogPost {
  let tags: string[] = [];
  try {
    tags = JSON.parse(row.tags) as string[];
  } catch {
    tags = row.tags ? row.tags.split(',').map((t) => t.trim()) : [];
  }

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    subtitle: row.subtitle ?? null,
    description: row.description ?? null,
    author: row.author,
    category: row.category,
    tags,
    featured: row.featured === 1,
    publishedAt: row.published_at,
    readTimeMins: row.read_time_mins,
    wordCount: row.word_count,
    sourceContext: row.source_context ?? null,
    createdAt: row.created_at,
  };
}

// ---------------------------------------------------------------------------
// Schema bootstrap (idempotent — runs once on cold start if needed)
// ---------------------------------------------------------------------------

async function ensureSchema(env: Env): Promise<void> {
  try {
    await env.DB.prepare(
      `CREATE TABLE IF NOT EXISTS blog_posts (
        id             INTEGER PRIMARY KEY AUTOINCREMENT,
        slug           TEXT    NOT NULL UNIQUE,
        title          TEXT    NOT NULL,
        subtitle       TEXT,
        description    TEXT,
        author         TEXT    NOT NULL DEFAULT 'Austin Humphrey',
        category       TEXT    NOT NULL DEFAULT 'editorial',
        tags           TEXT    DEFAULT '[]',
        featured       INTEGER NOT NULL DEFAULT 0,
        published      INTEGER NOT NULL DEFAULT 1,
        published_at   TEXT    NOT NULL,
        read_time_mins INTEGER DEFAULT 5,
        word_count     INTEGER DEFAULT 0,
        source_context TEXT,
        created_at     TEXT    DEFAULT (datetime('now')),
        updated_at     TEXT    DEFAULT (datetime('now'))
      )`
    ).run();

    // Ensure indexes exist
    await env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_bp_published_at ON blog_posts(published_at DESC)`).run();
    await env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_bp_category ON blog_posts(category)`).run();
    await env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_bp_featured ON blog_posts(featured)`).run();
    await env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_bp_published ON blog_posts(published)`).run();
  } catch (err) {
    // Log but don't crash — table may already exist
    console.warn('[blog-post-feed] schema bootstrap warning:', err instanceof Error ? err.message : err);
  }
}

let schemaEnsured = false;

async function bootstrapOnce(env: Env): Promise<void> {
  if (!schemaEnsured) {
    await ensureSchema(env);
    schemaEnsured = true;
  }
}

// ---------------------------------------------------------------------------
// GET /api/blog-post-feed
// ---------------------------------------------------------------------------

export async function handleBlogPostFeedList(
  env: Env,
  params: BlogPostFeedListParams = {}
): Promise<Response> {
  await bootstrapOnce(env);

  const { category, featured, limit = 20, offset = 0 } = params;
  const now = new Date().toISOString();

  // Build deterministic cache key from params
  const cacheKey = `bp:feed:list:${category ?? 'all'}:${featured ? '1' : '0'}:${limit}:${offset}`;

  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) {
    return cachedJson(cached, 200, HTTP_CACHE.news, {
      ...dataHeaders(now, 'cache'),
      'X-Cache': 'HIT',
    });
  }

  try {
    // Build WHERE clauses dynamically
    const whereClauses: string[] = ['published = 1'];
    const bindings: (string | number)[] = [];

    if (category && category !== 'all') {
      whereClauses.push('category = ?');
      bindings.push(category);
    }
    if (featured === true) {
      whereClauses.push('featured = 1');
    }

    const where = whereClauses.join(' AND ');
    const safeLimit = Math.min(Math.max(1, limit), 50);
    const safeOffset = Math.max(0, offset);

    const { results } = await env.DB.prepare(
      `SELECT id, slug, title, subtitle, description, author, category, tags,
              featured, published, published_at, read_time_mins, word_count,
              source_context, created_at, updated_at
       FROM blog_posts
       WHERE ${where}
       ORDER BY featured DESC, published_at DESC
       LIMIT ${safeLimit} OFFSET ${safeOffset}`
    )
      .bind(...bindings)
      .all<BlogPostRow>();

    const posts = (results ?? []).map(rowToPost);

    const payload = {
      posts,
      total: posts.length,
      limit: safeLimit,
      offset: safeOffset,
      meta: { source: 'bsi-d1', fetched_at: now, timezone: 'America/Chicago' },
    };

    await kvPut(env.KV, cacheKey, payload, 300); // 5-min cache
    return cachedJson(payload, 200, HTTP_CACHE.news, {
      ...dataHeaders(now, 'bsi-d1'),
      'X-Cache': 'MISS',
    });
  } catch (err) {
    console.error('[blog-post-feed] D1 list query failed:', err instanceof Error ? err.message : err);
    return json(
      {
        posts: [],
        total: 0,
        limit,
        offset,
        meta: { source: 'bsi-d1', fetched_at: now, timezone: 'America/Chicago' },
        message: 'Blog post feed is being set up.',
      },
      200
    );
  }
}

// ---------------------------------------------------------------------------
// GET /api/blog-post-feed/:slug
// ---------------------------------------------------------------------------

export async function handleBlogPostFeedItem(
  slug: string,
  env: Env
): Promise<Response> {
  await bootstrapOnce(env);

  const now = new Date().toISOString();

  // Basic slug validation — only allow URL-safe characters
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return json(
      {
        error: 'Invalid slug format.',
        meta: { source: 'bsi', fetched_at: now, timezone: 'America/Chicago' },
      },
      400
    );
  }

  try {
    // Fetch metadata from D1
    const row = await env.DB.prepare(
      `SELECT id, slug, title, subtitle, description, author, category, tags,
              featured, published, published_at, read_time_mins, word_count,
              source_context, created_at, updated_at
       FROM blog_posts
       WHERE slug = ? AND published = 1
       LIMIT 1`
    )
      .bind(slug)
      .first<BlogPostRow>();

    if (!row) {
      return json(
        {
          post: null,
          content: null,
          meta: { source: 'bsi-d1', fetched_at: now, timezone: 'America/Chicago' },
          message: `No published article found for slug "${slug}".`,
        },
        404
      );
    }

    const post = rowToPost(row);

    // Fetch full markdown content from R2
    const r2Key = `blog-posts/${slug}.md`;
    const object = await env.ASSETS_BUCKET.get(r2Key);

    let content: string | null = null;
    if (object) {
      content = await object.text();
    }

    return json({
      post,
      content,
      contentType: 'text/markdown',
      meta: { source: 'bsi-d1+r2', fetched_at: now, timezone: 'America/Chicago' },
    });
  } catch (err) {
    console.error('[blog-post-feed] item fetch failed:', err instanceof Error ? err.message : err);
    return json(
      {
        post: null,
        content: null,
        meta: { source: 'bsi', fetched_at: now, timezone: 'America/Chicago' },
        error: 'Failed to retrieve article.',
      },
      500
    );
  }
}
