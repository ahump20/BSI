/**
 * College Baseball Rankings API
 * Returns preseason and weekly poll rankings from D1Baseball, Baseball America
 *
 * Caching: 15 minutes (rankings don't change frequently)
 * Data source: D1 database (college_baseball_rankings + college_baseball_teams)
 *
 * Response Contract: Uses BSI standard APIResponse format
 * - status: 'ok' | 'invalid' | 'unavailable'
 * - data: payload or null
 * - source: 'd1' | 'kv-cache'
 */

import { rateLimit, rateLimitError, corsHeaders } from '../_utils.js';

// Minimum rankings required for valid response (D1 Baseball has 25 ranked teams)
const MIN_RANKINGS_REQUIRED = 15;

const CACHE_KEY_PREFIX = 'college-baseball:rankings';

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  // Rate limiting: 100 requests per minute per IP
  const limit = await rateLimit(env, request, 100, 60000);
  if (!limit.allowed) {
    return rateLimitError(limit.resetAt, limit.retryAfter);
  }

  try {
    const source = url.searchParams.get('source') || 'd1baseball';
    const season = url.searchParams.get('season') || '2026';
    const limit_param = parseInt(url.searchParams.get('limit') || '25', 10);

    const cacheKey = `${CACHE_KEY_PREFIX}:${source}:${season}:${limit_param}`;

    // Check cache first
    if (env.CACHE) {
      const cached = await env.CACHE.get(cacheKey);
      if (cached) {
        const data = JSON.parse(cached);
        // Standard APIResponse format from cache
        return new Response(
          JSON.stringify({
            data: data.rankings,
            status: 'ok',
            source: 'kv-cache',
            lastUpdated: data.updatedAt,
            reason: '',
            meta: {
              cache: { hit: true, ttlSeconds: 900 },
              planTier: 'highlightly_pro',
              quota: { remaining: 0, resetAt: '' },
            },
            // Legacy fields for backwards compatibility
            rankings: data.rankings,
            source_poll: data.source,
            season: data.season,
            week: data.week,
            count: data.count,
          }),
          {
            status: 200,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
              'Cache-Control': 'public, max-age=900, stale-while-revalidate=300',
              'X-BSI-Status': 'ok',
              'X-BSI-Source': 'kv-cache',
            },
          }
        );
      }
    }

    // Query D1 database for rankings with team details
    if (!env.DB) {
      throw new Error('Database not configured');
    }

    // Use DISTINCT to avoid duplicates from multiple poll updates
    const query = `
      SELECT DISTINCT
        r.rank,
        r.previous_rank,
        r.source,
        r.week,
        r.season,
        MAX(r.updated_at) as updated_at,
        t.id as team_id,
        t.name as team_name,
        t.mascot,
        t.abbreviation,
        t.conference,
        t.logo_url,
        t.primary_color,
        t.secondary_color
      FROM college_baseball_rankings r
      INNER JOIN college_baseball_teams t ON r.team_id = t.id
      WHERE r.source = ?
        AND r.season = ?
      GROUP BY r.team_id, r.rank
      ORDER BY r.rank ASC
      LIMIT ?
    `;

    const result = await env.DB.prepare(query).bind(source, parseInt(season), limit_param).all();

    const rankings = result.results.map((row) => ({
      rank: row.rank,
      previousRank: row.previous_rank,
      change: row.previous_rank ? row.previous_rank - row.rank : null,
      team: {
        id: row.team_id,
        name: row.team_name,
        mascot: row.mascot,
        abbreviation: row.abbreviation,
        conference: row.conference,
        logo: row.logo_url,
        colors: {
          primary: row.primary_color,
          secondary: row.secondary_color,
        },
      },
    }));

    const updatedAt = result.results[0]?.updated_at || new Date().toISOString();

    // SEMANTIC VALIDATION: Check minimum density before serving
    if (rankings.length < MIN_RANKINGS_REQUIRED) {
      return new Response(
        JSON.stringify({
          data: null,
          status: 'invalid',
          source: 'd1',
          lastUpdated: updatedAt,
          reason: `Insufficient rankings data: found ${rankings.length}, expected at least ${MIN_RANKINGS_REQUIRED}`,
          meta: {
            cache: { hit: false, ttlSeconds: 0 },
            planTier: 'highlightly_pro',
            quota: { remaining: 0, resetAt: '' },
          },
        }),
        {
          status: 200, // 200 with status:'invalid' per contract
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
            'X-BSI-Status': 'invalid',
            'X-BSI-Source': 'd1',
          },
        }
      );
    }

    const responseData = {
      rankings,
      source,
      season: parseInt(season),
      week: result.results[0]?.week || 0,
      count: rankings.length,
      updatedAt,
      dataStamp: {
        source: 'D1 Database (college_baseball_rankings)',
        fetchedAt: new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' }) + ' CT',
      },
    };

    // Cache the response
    if (env.CACHE) {
      await env.CACHE.put(
        cacheKey,
        JSON.stringify(responseData),
        { expirationTtl: 900 } // 15 minutes
      );
    }

    // Standard APIResponse format with legacy fields for backwards compatibility
    return new Response(
      JSON.stringify({
        data: rankings,
        status: 'ok',
        source: 'd1',
        lastUpdated: updatedAt,
        reason: '',
        meta: {
          cache: { hit: false, ttlSeconds: 900 },
          planTier: 'highlightly_pro',
          quota: { remaining: 0, resetAt: '' },
        },
        // Legacy fields for backwards compatibility
        rankings,
        source_poll: source,
        season: parseInt(season),
        week: result.results[0]?.week || 0,
        count: rankings.length,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=900, stale-while-revalidate=300',
          'X-BSI-Status': 'ok',
          'X-BSI-Source': 'd1',
        },
      }
    );
  } catch (error) {
    // Standard APIResponse error format
    return new Response(
      JSON.stringify({
        data: null,
        status: 'unavailable',
        source: 'd1',
        lastUpdated: new Date().toISOString(),
        reason: error.message || 'Failed to fetch rankings',
        meta: {
          cache: { hit: false, ttlSeconds: 0 },
          planTier: 'highlightly_pro',
          quota: { remaining: 0, resetAt: '' },
        },
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'X-BSI-Status': 'unavailable',
          'X-BSI-Source': 'd1',
        },
      }
    );
  }
}
