/**
 * CFB Article Detail API
 *
 * Returns a single article by slug from Coded Content.
 *
 * GET /api/cfb/articles/:slug
 */

export interface Env {
  DB: D1Database;
  CACHE: KVNamespace;
}

interface ArticleMetadata {
  seoTitle?: string;
  metaDescription?: string;
  homeTeam?: string;
  awayTeam?: string;
  gameDate?: string;
  venue?: string;
  [key: string]: unknown;
}

interface ArticleDetail {
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

interface ApiResponse {
  article: ArticleDetail;
}

const CACHE_PREFIX = 'cfb:article:';
const CACHE_TTL = 600; // 10 minutes

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env, params } = context;
  const slug = params.slug as string;

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
    'Cache-Control': 'public, max-age=600', // 10 minutes
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers });
  }

  if (request.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers,
    });
  }

  if (!slug) {
    return new Response(JSON.stringify({ error: 'Slug is required' }), {
      status: 400,
      headers,
    });
  }

  try {
    // Try KV cache first
    const cacheKey = `${CACHE_PREFIX}${slug}`;
    if (env.CACHE) {
      const cached = await env.CACHE.get(cacheKey);
      if (cached) {
        return new Response(cached, {
          headers: { ...headers, 'X-Cache': 'HIT' },
        });
      }
    }

    // Fetch from D1
    const result = await env.DB.prepare(
      `SELECT slug, title, excerpt, body_html, content_type,
              published_at, updated_at, game_id, metadata_json
       FROM coded_content_articles
       WHERE slug = ? AND league = 'cfb'
       LIMIT 1`
    )
      .bind(slug)
      .first();

    if (!result) {
      return new Response(JSON.stringify({ error: 'Article not found' }), {
        status: 404,
        headers,
      });
    }

    // Parse metadata
    let metadata: ArticleMetadata = {};
    try {
      metadata = JSON.parse((result.metadata_json as string) || '{}');
    } catch {
      metadata = {};
    }

    const article: ArticleDetail = {
      slug: result.slug as string,
      title: result.title as string,
      excerpt: result.excerpt as string | null,
      bodyHtml: result.body_html as string,
      contentType: result.content_type as string,
      publishedAt: result.published_at
        ? new Date((result.published_at as number) * 1000).toISOString()
        : null,
      updatedAt: result.updated_at
        ? new Date((result.updated_at as number) * 1000).toISOString()
        : null,
      gameId: result.game_id as string | null,
      metadata,
    };

    const response: ApiResponse = { article };
    const json = JSON.stringify(response);

    // Cache for 10 minutes
    if (env.CACHE) {
      await env.CACHE.put(cacheKey, json, { expirationTtl: CACHE_TTL });
    }

    return new Response(json, {
      headers: { ...headers, 'X-Cache': 'MISS' },
    });
  } catch (error: unknown) {
    console.error('CFB Article API error:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to fetch article',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers,
      }
    );
  }
};
