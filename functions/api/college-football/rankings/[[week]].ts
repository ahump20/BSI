/**
 * College Football Rankings API Endpoint
 *
 * GET /api/college-football/rankings/:week
 *   - Returns rankings for a specific week
 *   - Includes AP Top 25, Coaches Poll, and CFP Rankings
 *
 * GET /api/college-football/rankings/latest
 *   - Returns latest available rankings
 *
 * Query Parameters:
 *   - year: season year (default: current year)
 *   - seasonType: 'regular' | 'postseason' (default: 'regular')
 *   - poll: filter by specific poll ('AP Top 25', 'Coaches Poll', 'Playoff Committee Rankings')
 *
 * Examples:
 *   /api/college-football/rankings/11
 *   /api/college-football/rankings/latest?year=2025
 *   /api/college-football/rankings/11?poll=AP%20Top%2025
 */

import { CFBDAdapter } from '../../../../lib/adapters/cfbd-adapter';

interface Env {
  CACHE: KVNamespace;
  ANALYTICS?: AnalyticsEngineDataset;
  CFBD_API_KEY?: string;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, params, env } = context;

  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  // Handle OPTIONS request
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    // Check for API key
    const apiKey = env.CFBD_API_KEY || 'fGJioao24tAaWLyWOh5MmLHl8DwJsKLfv5Lg73mbZsNQogP9XeOXi3l/1o28soOi';
    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error: 'Configuration error',
          message: 'CFBD API key not configured',
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Extract week from URL params
    const weekParam = params.week as string | string[];
    const week = Array.isArray(weekParam) ? weekParam[0] : weekParam;

    // Parse query parameters
    const url = new URL(request.url);
    const year = parseInt(
      url.searchParams.get('year') || new Date().getFullYear().toString(),
      10
    );
    const seasonType = (url.searchParams.get('seasonType') || 'regular') as 'regular' | 'postseason';
    const pollFilter = url.searchParams.get('poll') || undefined;

    // Initialize adapter
    const adapter = new CFBDAdapter(apiKey, env.CACHE);

    let rankings;
    let weekNum;

    if (week === 'latest' || !week || week === 'undefined') {
      // Fetch latest rankings
      // Try to get current week rankings, fall back to previous weeks if not available
      weekNum = getCurrentWeek();
      rankings = await adapter.fetchRankings(year, weekNum, seasonType);

      // If no rankings found, try previous weeks
      while (rankings.length === 0 && weekNum > 0) {
        weekNum--;
        rankings = await adapter.fetchRankings(year, weekNum, seasonType);
      }
    } else {
      weekNum = parseInt(week, 10);
      if (isNaN(weekNum)) {
        return new Response(
          JSON.stringify({
            error: 'Invalid week',
            message: 'Week must be a number or "latest"',
          }),
          {
            status: 400,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
            },
          }
        );
      }

      rankings = await adapter.fetchRankings(year, weekNum, seasonType);
    }

    // Filter by poll if specified
    if (pollFilter) {
      rankings = rankings.filter(r => r.poll === pollFilter);
    }

    const response = {
      season: year,
      week: weekNum,
      seasonType,
      polls: rankings.map(ranking => ({
        poll: ranking.poll,
        totalRanked: ranking.ranks.length,
        ranks: ranking.ranks,
      })),
      summary: {
        apTop25: rankings.find(r => r.poll === 'AP Top 25')?.ranks || null,
        coachesPoll: rankings.find(r => r.poll === 'Coaches Poll')?.ranks || null,
        cfpRankings: rankings.find(r => r.poll === 'Playoff Committee Rankings')?.ranks || null,
      },
      meta: {
        dataSource: 'College Football Data API (api.collegefootballdata.com)',
        lastUpdated: new Date().toISOString(),
        timezone: 'America/Chicago',
      },
    };

    // Track analytics
    if (env.ANALYTICS) {
      try {
        env.ANALYTICS.writeDataPoint({
          blobs: ['college_football_rankings', `week_${weekNum}`],
          doubles: [rankings.length],
          indexes: [`${year}`],
        });
      } catch (error) {
        console.warn('Analytics write failed:', error);
      }
    }

    return new Response(JSON.stringify(response, null, 2), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=1800, s-maxage=3600', // 30min client, 1hr CDN
      },
    });
  } catch (error) {
    console.error('College football rankings error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return new Response(
      JSON.stringify({
        error: 'Failed to fetch rankings',
        message: errorMessage,
        details: process.env.NODE_ENV === 'development' ? error : undefined,
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
};

/**
 * Get current week number based on date
 */
function getCurrentWeek(): number {
  const now = new Date();
  const year = now.getFullYear();

  // Season typically starts around September 1
  const seasonStart = new Date(year, 7, 25); // August 25 approximation

  if (now < seasonStart) {
    return 0; // Pre-season
  }

  const diffTime = now.getTime() - seasonStart.getTime();
  const diffWeeks = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7));

  return Math.min(diffWeeks + 1, 15); // Cap at week 15 (regular season max)
}
