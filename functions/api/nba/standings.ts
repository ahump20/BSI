/**
 * NBA Standings API - Real SportsDataIO Data
 * Comprehensive NBA standings with conference/division breakdowns
 *
 * Endpoints:
 * - GET /api/nba/standings - Current season standings
 * - GET /api/nba/standings?season=2024 - Historical standings
 *
 * Data Source: SportsDataIO NBA API
 */

import { createSportsDataIOAdapter } from '../../../lib/adapters/sportsdataio';
import { corsHeaders } from '../_utils';

interface Env {
  SPORTSDATAIO_API_KEY: string;
  KV: KVNamespace;
}

export const onRequest: PagesFunction<Env> = async ({ request, env }) => {
  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  try {
    const url = new URL(request.url);
    const season = url.searchParams.get('season') || undefined;

    // Create adapter with env API key
    const adapter = createSportsDataIOAdapter(env.SPORTSDATAIO_API_KEY);

    // Fetch standings from SportsDataIO
    const response = await adapter.getNBAStandings(season);

    if (!response.success || !response.data) {
      return new Response(
        JSON.stringify({
          error: 'Failed to fetch NBA standings',
          details: response.error,
          source: response.source
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Organize standings by conference and division
    const standings = response.data;
    const organized = {
      eastern: {
        atlantic: standings.filter(t => t.Conference === 'Eastern' && t.Division === 'Atlantic')
          .sort((a, b) => b.Wins - a.Wins),
        central: standings.filter(t => t.Conference === 'Eastern' && t.Division === 'Central')
          .sort((a, b) => b.Wins - a.Wins),
        southeast: standings.filter(t => t.Conference === 'Eastern' && t.Division === 'Southeast')
          .sort((a, b) => b.Wins - a.Wins)
      },
      western: {
        northwest: standings.filter(t => t.Conference === 'Western' && t.Division === 'Northwest')
          .sort((a, b) => b.Wins - a.Wins),
        pacific: standings.filter(t => t.Conference === 'Western' && t.Division === 'Pacific')
          .sort((a, b) => b.Wins - a.Wins),
        southwest: standings.filter(t => t.Conference === 'Western' && t.Division === 'Southwest')
          .sort((a, b) => b.Wins - a.Wins)
      }
    };

    return new Response(
      JSON.stringify({
        success: true,
        season: season || new Date().getFullYear().toString(),
        standings: organized,
        rawData: standings,
        source: response.source,
        meta: {
          totalTeams: standings.length,
          dataProvider: 'SportsDataIO',
          timezone: 'America/Chicago',
          cached: response.source.cacheHit
        }
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=300' // 5 minutes
        }
      }
    );
  } catch (error) {
    console.error('NBA Standings Error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
};
