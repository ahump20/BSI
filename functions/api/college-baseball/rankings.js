/**
 * College Baseball Rankings API
 * Returns preseason and weekly poll rankings from D1Baseball, Baseball America
 *
 * Caching: 15 minutes (rankings don't change frequently)
 * Data source: D1 database (college_baseball_rankings + college_baseball_teams)
 */

import { rateLimit, rateLimitError, corsHeaders } from '../_utils.js';

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

    // Check cache
    if (env.CACHE) {
      const cached = await env.CACHE.get(cacheKey);
      if (cached) {
        const data = JSON.parse(cached);
        return new Response(
          JSON.stringify({
            success: true,
            ...data,
            cached: true,
          }),
          {
            status: 200,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
              'Cache-Control': 'public, max-age=900, stale-while-revalidate=300',
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

    const responseData = {
      rankings,
      source,
      season: parseInt(season),
      week: result.results[0]?.week || 0,
      count: rankings.length,
      updatedAt: result.results[0]?.updated_at || new Date().toISOString(),
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

    return new Response(
      JSON.stringify({
        success: true,
        ...responseData,
        cached: false,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=900, stale-while-revalidate=300',
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to fetch rankings',
        message: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
}
