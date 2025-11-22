/**
 * MLB Standings API - Real SportsDataIO Data
 * Comprehensive MLB standings with division/league breakdowns
 *
 * Endpoints:
 * - GET /api/mlb/standings - Current season standings
 * - GET /api/mlb/standings?season=2024 - Historical standings
 *
 * Data Source: SportsDataIO MLB API
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
    const season = url.searchParams.get('season') ? parseInt(url.searchParams.get('season')!) : undefined;

    // Create adapter with env API key
    const adapter = createSportsDataIOAdapter(env.SPORTSDATAIO_API_KEY);

    // Fetch standings from SportsDataIO
    const response = await adapter.getMLBStandings(season);

    if (!response.success || !response.data) {
      return new Response(
        JSON.stringify({
          error: 'Failed to fetch MLB standings',
          details: response.error,
          source: response.source
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Organize standings by division
    const standings = response.data;
    const organized = {
      american: {
        east: standings.filter(t => t.League === 'AL' && t.Division === 'East')
          .sort((a, b) => b.Wins - a.Wins),
        central: standings.filter(t => t.League === 'AL' && t.Division === 'Central')
          .sort((a, b) => b.Wins - a.Wins),
        west: standings.filter(t => t.League === 'AL' && t.Division === 'West')
          .sort((a, b) => b.Wins - a.Wins)
      },
      national: {
        east: standings.filter(t => t.League === 'NL' && t.Division === 'East')
          .sort((a, b) => b.Wins - a.Wins),
        central: standings.filter(t => t.League === 'NL' && t.Division === 'Central')
          .sort((a, b) => b.Wins - a.Wins),
        west: standings.filter(t => t.League === 'NL' && t.Division === 'West')
          .sort((a, b) => b.Wins - a.Wins)
      }
    };

    return new Response(
      JSON.stringify({
        success: true,
        season: season || new Date().getFullYear(),
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
    console.error('MLB Standings Error:', error);
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
