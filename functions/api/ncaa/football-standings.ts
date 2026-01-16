/**
 * NCAA Football Standings API - Real SportsDataIO Data
 * Comprehensive college football standings with conference breakdowns
 *
 * Endpoints:
 * - GET /api/ncaa/football-standings - Current season standings
 * - GET /api/ncaa/football-standings?season=2024 - Historical standings
 * - GET /api/ncaa/football-standings?conference=SEC - Filter by conference
 *
 * Data Source: SportsDataIO NCAA Football API
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
      headers: corsHeaders,
    });
  }

  try {
    const url = new URL(request.url);
    const season = url.searchParams.get('season')
      ? parseInt(url.searchParams.get('season')!)
      : undefined;
    const conferenceFilter = url.searchParams.get('conference');

    // Create adapter with env API key
    const adapter = createSportsDataIOAdapter(env.SPORTSDATAIO_API_KEY);

    // Fetch standings from SportsDataIO
    const response = await adapter.getNCAAFStandings(season);

    if (!response.success || !response.data) {
      return new Response(
        JSON.stringify({
          error: 'Failed to fetch NCAA Football standings',
          details: response.error,
          source: response.source,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    let standings = response.data;

    // Filter by conference if specified
    if (conferenceFilter) {
      standings = standings.filter(
        (t) => t.Conference.toLowerCase() === conferenceFilter.toLowerCase()
      );
    }

    // Organize by conference
    const conferences: Record<string, typeof standings> = {};
    standings.forEach((team) => {
      if (!conferences[team.Conference]) {
        conferences[team.Conference] = [];
      }
      conferences[team.Conference].push(team);
    });

    // Sort each conference by wins
    Object.keys(conferences).forEach((conf) => {
      conferences[conf].sort((a, b) => b.Wins - a.Wins);
    });

    return new Response(
      JSON.stringify({
        success: true,
        season: season || new Date().getFullYear(),
        standings: {
          byConference: conferences,
          all: standings.sort((a, b) => b.Wins - a.Wins),
        },
        rawData: standings,
        source: response.source,
        meta: {
          totalTeams: standings.length,
          conferences: Object.keys(conferences).length,
          dataProvider: 'SportsDataIO',
          timezone: 'America/Chicago',
          cached: response.source.cacheHit,
          filterApplied: conferenceFilter || 'none',
        },
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=300', // 5 minutes
        },
      }
    );
  } catch (error) {
    console.error('NCAA Football Standings Error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
};
