/**
 * NFL Standings API - Real SportsDataIO Data
 * Comprehensive NFL standings with division/conference breakdowns
 *
 * Endpoints:
 * - GET /api/nfl/standings - Current season standings
 * - GET /api/nfl/standings?season=2024 - Historical standings
 *
 * Data Source: SportsDataIO NFL API
 */

import { createSportsDataIOAdapter } from '../../../lib/adapters/sportsdataio';
import { corsHeaders, getSportsDataApiKey } from '../_utils';

interface Env {
  SPORTS_DATA_IO_API_KEY?: string;
  SPORTSDATAIO_API_KEY?: string;
  SPORTSDATAIO_KEY?: string;
  SPORTSDATA_API_KEY?: string;
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

    const apiKey = getSportsDataApiKey(env);
    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error: 'Missing SportsDataIO configuration',
          details: 'SPORTS_DATA_IO_API_KEY is not configured',
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    const adapter = createSportsDataIOAdapter(apiKey);

    // Fetch standings from SportsDataIO — fall back to previous year if current season is empty
    let response = await adapter.getNFLStandings(season);
    let effectiveSeason = season || new Date().getFullYear();
    if (!season && response.success && Array.isArray(response.data) && response.data.length === 0) {
      effectiveSeason = new Date().getFullYear() - 1;
      response = await adapter.getNFLStandings(effectiveSeason);
    }

    if (!response.success || !response.data) {
      return new Response(
        JSON.stringify({
          error: 'Failed to fetch NFL standings',
          details: response.error,
          source: response.source,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const raw = response.data;

    // Flat array the UI consumes directly (Team interface)
    const teams = raw.map((t: any) => ({
      teamName: t.City ? `${t.City} ${t.Name}` : t.Name,
      wins: t.Wins,
      losses: t.Losses,
      ties: t.Ties,
      winPercentage: t.Percentage,
      division: t.Division,
      conference: t.Conference,
      pointsFor: t.PointsFor,
      pointsAgainst: t.PointsAgainst,
      streak: t.Streak != null ? `${t.Streak > 0 ? 'W' : 'L'}${Math.abs(t.Streak)}` : '-',
    }));

    return new Response(
      JSON.stringify({
        success: true,
        season: effectiveSeason,
        standings: teams,
        teams,
        source: response.source,
        meta: {
          totalTeams: teams.length,
          dataSource: 'SportsDataIO',
          lastUpdated: new Date().toISOString(),
          timezone: 'America/Chicago',
          cached: response.source.cacheHit,
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
    console.error('NFL Standings Error:', error);
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
