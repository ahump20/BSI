/**
 * MLB Leaderboards API Endpoint
 *
 * GET /api/mlb/leaderboards/:category
 *   - Fetches MLB leaderboards with advanced sabermetrics from FanGraphs
 *   - Returns sortable batting and pitching leaderboards
 *
 * Query Parameters:
 *   - season: number (default: current year)
 *   - stat: 'bat' | 'pit' (default: 'bat')
 *   - pos: Position filter (default: 'all')
 *   - lg: League filter 'all' | 'al' | 'nl' (default: 'all')
 *   - qual: Qualified players only 'y' | 'n' (default: 'y')
 *   - sortby: Column to sort by (default: 'WAR')
 *   - sortdir: 'asc' | 'desc' (default: 'desc')
 *   - limit: Number of results (default: 50, max: 500)
 *   - page: Page number (default: 1)
 *
 * Examples:
 *   /api/mlb/leaderboards/batting?season=2025&sortby=wRC+&limit=100
 *   /api/mlb/leaderboards/pitching?season=2025&sortby=FIP&lg=nl
 *   /api/mlb/leaderboards/war?stat=bat&pos=of&limit=25
 */

import { FanGraphsAdapter } from '../../../../lib/adapters/fangraphs-adapter';

interface Env {
  CACHE: KVNamespace;
  ANALYTICS?: AnalyticsEngineDataset;
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
    // Extract category from URL params
    const categoryParam = params.category as string | string[];
    const category = Array.isArray(categoryParam) ? categoryParam[0] : categoryParam;

    // Parse query parameters
    const url = new URL(request.url);
    const season = parseInt(
      url.searchParams.get('season') || new Date().getFullYear().toString(),
      10
    );
    const stat = (url.searchParams.get('stat') || 'bat') as 'bat' | 'pit';
    const pos = url.searchParams.get('pos') || 'all';
    const lg = (url.searchParams.get('lg') || 'all') as 'all' | 'al' | 'nl';
    const qual = (url.searchParams.get('qual') || 'y') as 'y' | 'n';
    const sortby = url.searchParams.get('sortby') || 'WAR';
    const sortdir = (url.searchParams.get('sortdir') || 'desc') as 'asc' | 'desc';
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50', 10), 500);
    const page = parseInt(url.searchParams.get('page') || '1', 10);

    // Initialize adapter
    const adapter = new FanGraphsAdapter(env.CACHE);

    // Determine leaderboard type from category
    let leaderboardData;
    let leaderboardType: 'bat' | 'pit' = stat;

    switch (category) {
      case 'batting':
        leaderboardType = 'bat';
        break;
      case 'pitching':
        leaderboardType = 'pit';
        break;
      case 'war':
        // WAR leaderboard - can be either batting or pitching based on stat param
        leaderboardType = stat;
        break;
      case 'wrc':
      case 'woba':
      case 'babip':
        // Batting-specific metrics
        leaderboardType = 'bat';
        break;
      case 'fip':
      case 'xfip':
      case 'siera':
      case 'era':
        // Pitching-specific metrics
        leaderboardType = 'pit';
        break;
      default:
        // Default to batting if category not recognized
        leaderboardType = 'bat';
    }

    // Fetch leaderboard data
    if (leaderboardType === 'bat') {
      leaderboardData = await adapter.fetchBattingLeaderboard({
        pos,
        stats: 'bat',
        lg,
        qual,
        type: '8', // Standard batting with advanced stats
        season,
        sortcol: sortby,
        sortdir,
        pageitems: limit,
        pagenum: page,
      });
    } else {
      leaderboardData = await adapter.fetchPitchingLeaderboard({
        pos: 'all',
        stats: 'pit',
        lg,
        qual,
        type: '8', // Standard pitching with advanced stats
        season,
        sortcol: sortby,
        sortdir,
        pageitems: limit,
        pagenum: page,
      });
    }

    // Build response with metadata
    const response = {
      leaderboard: {
        category,
        type: leaderboardType,
        season,
        league: lg,
        position: pos,
        qualified: qual === 'y',
        sortBy: sortby,
        sortDirection: sortdir,
      },
      data: leaderboardData.data,
      pagination: {
        page: leaderboardData.page,
        pageSize: leaderboardData.pageItems,
        totalResults: leaderboardData.totalResults,
        totalPages: Math.ceil(leaderboardData.totalResults / leaderboardData.pageItems),
      },
      meta: {
        dataSource: 'FanGraphs',
        lastUpdated: new Date().toISOString(),
        timezone: 'America/Chicago',
        description:
          category === 'batting'
            ? 'MLB batting leaderboard with advanced sabermetrics (wOBA, wRC+, WAR)'
            : 'MLB pitching leaderboard with advanced metrics (FIP, xFIP, SIERA, WAR)',
      },
    };

    // Track analytics
    if (env.ANALYTICS) {
      try {
        env.ANALYTICS.writeDataPoint({
          blobs: ['mlb_leaderboard', category, leaderboardType],
          doubles: [1],
          indexes: [`${season}`],
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
        'Cache-Control': 'public, max-age=600, s-maxage=3600', // 10min client, 1hr CDN
      },
    });
  } catch (error) {
    console.error('MLB leaderboard error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return new Response(
      JSON.stringify({
        error: 'Failed to fetch leaderboard',
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
