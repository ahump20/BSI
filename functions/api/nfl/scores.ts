/**
 * NFL Live Scores API - Real SportsDataIO Data
 * Live and completed game scores with real-time updates
 *
 * Endpoints:
 * - GET /api/nfl/scores - Current week's games
 * - GET /api/nfl/scores?week=5 - Specific week
 * - GET /api/nfl/scores?season=2024&week=5 - Historical week
 *
 * Data Source: SportsDataIO NFL API
 * Update Frequency: 30 seconds for live games
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
    const seasonParam = url.searchParams.get('season');
    const weekParam = url.searchParams.get('week');

    const season = seasonParam ? parseInt(seasonParam) : undefined;
    const week = weekParam ? parseInt(weekParam) : undefined;

    // Create adapter with env API key
    const adapter = createSportsDataIOAdapter(env.SPORTSDATAIO_API_KEY);

    // Fetch scores from SportsDataIO
    const response = await adapter.getNFLScores(season, week);

    if (!response.success || !response.data) {
      return new Response(
        JSON.stringify({
          error: 'Failed to fetch NFL scores',
          details: response.error,
          source: response.source
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const games = response.data;

    // Categorize games by status
    const categorized = {
      live: games.filter(g => g.Status === 'InProgress' || g.Status === 'Halftime'),
      final: games.filter(g => g.Status === 'Final' || g.Status === 'F/OT'),
      scheduled: games.filter(g => g.Status === 'Scheduled' || g.Status === 'Pregame')
    };

    return new Response(
      JSON.stringify({
        success: true,
        season: season || new Date().getFullYear(),
        week: week || (games[0]?.Week || 1),
        games: categorized,
        rawData: games,
        source: response.source,
        meta: {
          totalGames: games.length,
          liveGames: categorized.live.length,
          completedGames: categorized.final.length,
          scheduledGames: categorized.scheduled.length,
          dataProvider: 'SportsDataIO',
          timezone: 'America/Chicago',
          cached: response.source.cacheHit,
          updateFrequency: categorized.live.length > 0 ? '30 seconds' : '5 minutes'
        }
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          // Live games: 30s cache, otherwise 5min
          'Cache-Control': categorized.live.length > 0
            ? 'public, max-age=30'
            : 'public, max-age=300'
        }
      }
    );
  } catch (error) {
    console.error('NFL Scores Error:', error);
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
