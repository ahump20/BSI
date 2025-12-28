/**
 * CFB Previews API
 *
 * Returns a list of game preview articles from Coded Content.
 * First checks KV cache, then falls back to D1.
 *
 * GET /api/cfb/previews?limit=12&offset=0
 */

export interface Env {
  DB: D1Database;
  CACHE: KVNamespace;
}

interface ArticleCard {
  slug: string;
  title: string;
  excerpt: string | null;
  contentType: string;
  publishedAt: string | null;
  gameId: string | null;
}

interface ApiResponse {
  articles: ArticleCard[];
  total: number;
  limit: number;
  offset: number;
}

const CACHE_KEY = 'cfb:previews:current';
const DEFAULT_LIMIT = 12;
const MAX_LIMIT = 50;

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
    'Cache-Control': 'public, max-age=300', // 5 minutes
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

  try {
    const limitParam = url.searchParams.get('limit');
    const offsetParam = url.searchParams.get('offset');

    const limit = Math.min(
      Math.max(1, parseInt(limitParam || String(DEFAULT_LIMIT), 10)),
      MAX_LIMIT
    );
    const offset = Math.max(0, parseInt(offsetParam || '0', 10));

    // Try KV cache first (only for default pagination)
    if (offset === 0 && limit <= DEFAULT_LIMIT && env.CACHE) {
      const cached = await env.CACHE.get(CACHE_KEY);
      if (cached) {
        try {
          const articles = JSON.parse(cached) as ArticleCard[];
          const response: ApiResponse = {
            articles: articles.slice(0, limit),
            total: articles.length,
            limit,
            offset: 0,
          };
          return new Response(JSON.stringify(response), {
            headers: { ...headers, 'X-Cache': 'HIT' },
          });
        } catch {
          // Invalid cache data, fall through to DB
        }
      }
    }

    // Fetch from D1
    const countResult = await env.DB.prepare(
      `SELECT COUNT(*) as total FROM coded_content_articles
       WHERE league = 'cfb' AND content_type = 'preview'`
    ).first<{ total: number }>();

    const total = countResult?.total || 0;

    const articlesResult = await env.DB.prepare(
      `SELECT slug, title, excerpt, content_type, published_at, game_id
       FROM coded_content_articles
       WHERE league = 'cfb' AND content_type = 'preview'
       ORDER BY published_at DESC
       LIMIT ? OFFSET ?`
    )
      .bind(limit, offset)
      .all();

    const articles: ArticleCard[] = (articlesResult.results || []).map((row) => ({
      slug: row.slug as string,
      title: row.title as string,
      excerpt: row.excerpt as string | null,
      contentType: row.content_type as string,
      publishedAt: row.published_at
        ? new Date((row.published_at as number) * 1000).toISOString()
        : null,
      gameId: row.game_id as string | null,
    }));

    const response: ApiResponse = {
      articles,
      total,
      limit,
      offset,
    };

    return new Response(JSON.stringify(response), {
      headers: { ...headers, 'X-Cache': 'MISS' },
    });
  } catch (error: unknown) {
    console.error('CFB Previews API error:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to fetch previews',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers,
      }
    );
  }
};
