/**
 * Coded Content Ingestion Worker
 *
 * Fetches CFB game previews and recaps from SportsDataIO Coded Content API.
 * Stores articles in D1 and caches lists in KV for fast retrieval.
 *
 * Schedule:
 * - Every 10 minutes baseline
 * - Optionally every 2-5 minutes on Saturdays (peak CFB)
 *
 * @version 1.0.0
 */

import type {
  CodedContentEnv,
  CodedContentArticle,
  CodedContentProviderArticle,
  IngestionResult,
  CodedContentType,
  CACHE_KEYS,
  CACHE_TTL,
} from '../../src/types/coded-content.types';

/**
 * Sanitize HTML to remove scripts and unsafe content
 */
function sanitizeHtml(html: string): string {
  if (!html) return '';

  let sanitized = html;

  // Remove script tags and contents
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  // Remove on* event handlers
  sanitized = sanitized.replace(/\s+on\w+\s*=\s*["'][^"']*["']/gi, '');
  sanitized = sanitized.replace(/\s+on\w+\s*=\s*[^\s>]+/gi, '');

  // Remove javascript: URLs
  sanitized = sanitized.replace(/href\s*=\s*["']javascript:[^"']*["']/gi, 'href="#"');
  sanitized = sanitized.replace(/src\s*=\s*["']javascript:[^"']*["']/gi, 'src=""');

  // Remove data: URLs for scripts
  sanitized = sanitized.replace(/src\s*=\s*["']data:text\/javascript[^"']*["']/gi, 'src=""');

  // Remove iframe tags
  sanitized = sanitized.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');

  // Remove object/embed tags
  sanitized = sanitized.replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '');
  sanitized = sanitized.replace(/<embed\b[^>]*>/gi, '');

  return sanitized;
}

/**
 * Generate a stable, URL-safe slug from title and provider ID
 */
function generateSlug(title: string, providerId: string): string {
  // Clean and normalize title
  const cleanTitle = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 60)
    .replace(/-$/, '');

  // Add truncated provider ID for uniqueness
  const idSuffix = providerId.substring(0, 8);

  return `${cleanTitle}-${idSuffix}`;
}

/**
 * Build request URL with auth
 */
function buildRequestUrl(
  baseUrl: string,
  endpoint: string,
  params: Record<string, string>,
  env: CodedContentEnv
): string {
  const url = new URL(endpoint, baseUrl);

  // Add query params
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  // Add auth as query param if configured
  if (env.CODED_CONTENT_AUTH_MODE === 'query') {
    url.searchParams.set(
      env.CODED_CONTENT_AUTH_QUERY_PARAM || 'key',
      env.CODED_CONTENT_API_KEY
    );
  }

  return url.toString();
}

/**
 * Build request headers with auth
 */
function buildRequestHeaders(env: CodedContentEnv): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'User-Agent': 'BSI-Ingest/1.0',
  };

  // Add auth header if configured
  if (env.CODED_CONTENT_AUTH_MODE === 'header') {
    const headerName = env.CODED_CONTENT_AUTH_HEADER || 'Ocp-Apim-Subscription-Key';
    headers[headerName] = env.CODED_CONTENT_API_KEY;
  }

  return headers;
}

/**
 * Fetch articles from provider API
 */
async function fetchFromProvider(
  env: CodedContentEnv,
  contentType: CodedContentType,
  dateFrom: Date,
  dateTo: Date
): Promise<CodedContentProviderArticle[]> {
  const typeIdentifier =
    contentType === 'preview'
      ? env.CODED_CONTENT_TYPE_PREVIEW
      : env.CODED_CONTENT_TYPE_RECAP;

  const params = {
    league: env.CODED_CONTENT_LEAGUE_CFB,
    contentType: typeIdentifier,
    dateFrom: dateFrom.toISOString().split('T')[0],
    dateTo: dateTo.toISOString().split('T')[0],
  };

  const url = buildRequestUrl(
    env.CODED_CONTENT_BASE_URL,
    '/content/articles',
    params,
    env
  );

  const headers = buildRequestHeaders(env);

  console.log(`[CodedContent] Fetching ${contentType}s from ${params.dateFrom} to ${params.dateTo}`);

  const response = await fetch(url, {
    method: 'GET',
    headers,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Provider API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json() as { articles?: CodedContentProviderArticle[] };
  return data.articles || [];
}

/**
 * Optional: Rewrite content in BSI voice using Workers AI
 */
async function rewriteInBsiVoice(
  content: string,
  ai: Ai
): Promise<string> {
  const systemPrompt = `You are a sports content editor for Blaze Sports Intel (BSI).
Rewrite the following content in the BSI voice:
- Direct, data-first, no fluff
- No "clash of titans" or empty hype
- Use short paragraphs
- Call out actual hinge points: trenches, QB pressure, third down, red zone, turnovers, explosives
- Frame predictions as "projections", not gambling advice
- Confident, a little sharp, never corny
- "Born to blaze the path less beaten" energy

Preserve all facts, statistics, team names, and player names exactly.
Return only the rewritten HTML content, no additional commentary.`;

  const response = await ai.run('@cf/meta/llama-3-8b-instruct', {
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Rewrite this content:\n\n${content}` },
    ],
    max_tokens: 4096,
  });

  if ('response' in response && typeof response.response === 'string') {
    return response.response;
  }

  // Return original if rewrite fails
  return content;
}

/**
 * Upsert article into D1
 */
async function upsertArticle(
  db: D1Database,
  article: CodedContentProviderArticle,
  contentType: CodedContentType,
  env: CodedContentEnv
): Promise<'inserted' | 'updated'> {
  const provider = 'sportsdataio-coded-content';
  const id = `${provider}:${article.contentId}`;
  const slug = generateSlug(article.title, article.contentId);
  const now = Math.floor(Date.now() / 1000);

  // Sanitize HTML
  let bodyHtml = sanitizeHtml(article.bodyHtml);

  // Optional BSI voice rewrite
  if (env.ENABLE_BSI_REWRITE === 'true' && env.AI) {
    try {
      bodyHtml = await rewriteInBsiVoice(bodyHtml, env.AI);
      bodyHtml = sanitizeHtml(bodyHtml); // Re-sanitize after AI
    } catch (error) {
      console.warn(`[CodedContent] BSI rewrite failed for ${article.contentId}:`, error);
      // Continue with original content
    }
  }

  const publishedAt = article.publishedAt
    ? Math.floor(new Date(article.publishedAt).getTime() / 1000)
    : null;
  const updatedAt = article.updatedAt
    ? Math.floor(new Date(article.updatedAt).getTime() / 1000)
    : publishedAt;

  // Check if article exists
  const existing = await db
    .prepare('SELECT id FROM coded_content_articles WHERE id = ?')
    .bind(id)
    .first();

  if (existing) {
    // Update existing
    await db
      .prepare(
        `UPDATE coded_content_articles SET
          title = ?,
          slug = ?,
          excerpt = ?,
          body_html = ?,
          published_at = ?,
          updated_at = ?,
          game_id = ?,
          team_ids = ?,
          metadata_json = ?,
          last_seen_at = ?
        WHERE id = ?`
      )
      .bind(
        article.title,
        slug,
        article.excerpt || null,
        bodyHtml,
        publishedAt,
        updatedAt,
        article.gameId || null,
        article.teamIds ? JSON.stringify(article.teamIds) : null,
        JSON.stringify(article.metadata || {}),
        now,
        id
      )
      .run();

    return 'updated';
  }

  // Insert new
  await db
    .prepare(
      `INSERT INTO coded_content_articles (
        id, provider, provider_content_id, league, content_type,
        title, slug, excerpt, body_html, published_at, updated_at,
        game_id, team_ids, metadata_json, created_at, last_seen_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      id,
      provider,
      article.contentId,
      'cfb',
      contentType,
      article.title,
      slug,
      article.excerpt || null,
      bodyHtml,
      publishedAt,
      updatedAt,
      article.gameId || null,
      article.teamIds ? JSON.stringify(article.teamIds) : null,
      JSON.stringify(article.metadata || {}),
      now,
      now
    )
    .run();

  return 'inserted';
}

/**
 * Update KV cache with latest article lists
 */
async function updateCache(
  db: D1Database,
  cache: KVNamespace,
  contentType: CodedContentType
): Promise<void> {
  const cacheKey =
    contentType === 'preview' ? 'cfb:previews:current' : 'cfb:recaps:latest';

  const limit = contentType === 'preview' ? 12 : 10;

  const articles = await db
    .prepare(
      `SELECT slug, title, excerpt, content_type, published_at, game_id
       FROM coded_content_articles
       WHERE league = 'cfb' AND content_type = ?
       ORDER BY published_at DESC
       LIMIT ?`
    )
    .bind(contentType, limit)
    .all();

  const cards = (articles.results || []).map((row) => ({
    slug: row.slug as string,
    title: row.title as string,
    excerpt: row.excerpt as string | null,
    contentType: row.content_type as CodedContentType,
    publishedAt: row.published_at
      ? new Date((row.published_at as number) * 1000).toISOString()
      : null,
    gameId: row.game_id as string | null,
  }));

  await cache.put(cacheKey, JSON.stringify(cards), {
    expirationTtl: 300, // 5 minutes
  });

  console.log(`[CodedContent] Updated cache: ${cacheKey} with ${cards.length} items`);
}

/**
 * Ingest content for a specific type
 */
async function ingestContentType(
  env: CodedContentEnv,
  contentType: CodedContentType
): Promise<IngestionResult> {
  const now = new Date();
  const result: IngestionResult = {
    provider: 'sportsdataio-coded-content',
    league: 'cfb',
    contentType,
    fetched: 0,
    inserted: 0,
    updated: 0,
    errors: 0,
    timestamp: now.toISOString(),
  };

  // Define date windows
  const dateFrom =
    contentType === 'preview'
      ? now // previews: now -> +7 days
      : new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000); // recaps: -2 days -> now

  const dateTo =
    contentType === 'preview'
      ? new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
      : now;

  try {
    const articles = await fetchFromProvider(env, contentType, dateFrom, dateTo);
    result.fetched = articles.length;

    console.log(`[CodedContent] Fetched ${articles.length} ${contentType}s`);

    for (const article of articles) {
      // Validate required fields
      if (!article.title || !article.bodyHtml) {
        console.warn(`[CodedContent] Skipping article ${article.contentId}: missing required fields`);
        result.errors++;
        continue;
      }

      try {
        const outcome = await upsertArticle(env.DB, article, contentType, env);
        if (outcome === 'inserted') {
          result.inserted++;
        } else {
          result.updated++;
        }
      } catch (error) {
        console.error(`[CodedContent] Failed to upsert ${article.contentId}:`, error);
        result.errors++;
      }
    }

    // Update KV cache
    await updateCache(env.DB, env.CACHE, contentType);
  } catch (error) {
    console.error(`[CodedContent] Failed to fetch ${contentType}s:`, error);
    result.errors++;
  }

  return result;
}

/**
 * Main ingestion function
 */
export async function ingestCodedContent(
  env: CodedContentEnv
): Promise<IngestionResult[]> {
  console.log('[CodedContent] Starting CFB content ingestion...');

  const results: IngestionResult[] = [];

  // Ingest previews
  results.push(await ingestContentType(env, 'preview'));

  // Ingest recaps
  results.push(await ingestContentType(env, 'recap'));

  console.log('[CodedContent] Ingestion complete:', {
    previews: results[0],
    recaps: results[1],
  });

  return results;
}

/**
 * Worker handlers
 */
export const codedContentWorker = {
  /**
   * Scheduled handler for cron triggers
   */
  async scheduled(
    event: ScheduledEvent,
    env: CodedContentEnv,
    ctx: ExecutionContext
  ): Promise<void> {
    console.log(`[CodedContent] Cron triggered: ${event.cron}`);

    try {
      const results = await ingestCodedContent(env);

      // Log summary
      const totalFetched = results.reduce((sum, r) => sum + r.fetched, 0);
      const totalInserted = results.reduce((sum, r) => sum + r.inserted, 0);
      const totalUpdated = results.reduce((sum, r) => sum + r.updated, 0);
      const totalErrors = results.reduce((sum, r) => sum + r.errors, 0);

      console.log(`[CodedContent] Summary: fetched=${totalFetched}, inserted=${totalInserted}, updated=${totalUpdated}, errors=${totalErrors}`);
    } catch (error) {
      console.error('[CodedContent] Ingestion failed:', error);
      throw error;
    }
  },

  /**
   * HTTP handler for manual triggers
   */
  async fetch(
    request: Request,
    env: CodedContentEnv,
    ctx: ExecutionContext
  ): Promise<Response> {
    const url = new URL(request.url);

    // Health check
    if (url.pathname === '/health') {
      return new Response(
        JSON.stringify({
          status: 'ok',
          timestamp: new Date().toISOString(),
          service: 'coded-content-ingest',
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Manual trigger (dev only)
    if (url.pathname === '/ingest/coded-content') {
      ctx.waitUntil(ingestCodedContent(env));
      return new Response(
        JSON.stringify({ message: 'Coded Content ingestion started' }),
        {
          status: 202,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response('Not Found', { status: 404 });
  },
};

export default codedContentWorker;
