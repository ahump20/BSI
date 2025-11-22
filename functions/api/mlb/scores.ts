/**
 * MLB Live Scores API - Real SportsDataIO Data
 * Live and completed game scores with real-time updates
 *
 * Endpoints:
 * - GET /api/mlb/scores - Today's games
 * - GET /api/mlb/scores?date=2025-NOV-13 - Specific date (YYYY-MMM-DD format)
 *
 * Data Source: SportsDataIO MLB API
 * Update Frequency: 30 seconds for live games
 */

import { createSportsDataIOAdapter } from '../../../lib/adapters/sportsdataio';
import { corsHeaders } from '../_utils';
import { DateTime } from 'luxon';

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
    const dateParam = url.searchParams.get('date');

    // Validate and format date
    let date: string | undefined;
    if (dateParam) {
      try {
        // Parse and format to SportsDataIO format (YYYY-MMM-DD)
        const parsed = DateTime.fromISO(dateParam, { zone: 'America/Chicago' });
        date = parsed.toFormat('yyyy-MMM-dd').toUpperCase();
      } catch {
        return new Response(
          JSON.stringify({
            error: 'Invalid date format',
            message: 'Date must be in YYYY-MM-DD format',
            example: '2025-11-13'
          }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
    }

    // Create adapter with env API key
    const adapter = createSportsDataIOAdapter(env.SPORTSDATAIO_API_KEY);

    // Fetch scores from SportsDataIO
    const response = await adapter.getMLBScores(date);

    if (!response.success || !response.data) {
      return new Response(
        JSON.stringify({
          error: 'Failed to fetch MLB scores',
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
      live: games.filter(g => g.Status === 'InProgress'),
      final: games.filter(g => g.Status === 'Final' || g.Status === 'F/OT'),
      scheduled: games.filter(g => g.Status === 'Scheduled' || g.Status === 'Pregame')
    };

    return new Response(
      JSON.stringify({
        success: true,
        date: date || DateTime.now().setZone('America/Chicago').toFormat('yyyy-MMM-dd').toUpperCase(),
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
    console.error('MLB Scores Error:', error);
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
