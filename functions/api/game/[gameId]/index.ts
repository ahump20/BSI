/**
 * Game Detail API Route
 *
 * Returns comprehensive game data including summary, box score, and status.
 *
 * GET /api/game/:gameId?sport=mlb|nfl|nba|cbb|cfb
 */

import { ESPNUnifiedAdapter, type SportKey } from '@/lib/adapters/espn-unified-adapter';

interface Env {
  BSI_CACHE?: KVNamespace;
}

const SPORT_MAP: Record<string, SportKey> = {
  mlb: 'mlb',
  nfl: 'nfl',
  nba: 'nba',
  cbb: 'cbb',
  ncaab: 'ncaab',
  cfb: 'ncaaf',
  ncaaf: 'ncaaf',
  wnba: 'wnba',
  nhl: 'nhl',
};

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { gameId } = context.params;
  const url = new URL(context.request.url);
  const sportParam = url.searchParams.get('sport') || 'mlb';
  const sport = SPORT_MAP[sportParam.toLowerCase()] || 'mlb';

  if (!gameId || typeof gameId !== 'string') {
    return new Response(JSON.stringify({ error: 'Game ID required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const adapter = new ESPNUnifiedAdapter(context.env.BSI_CACHE);
    const summary = await adapter.getGameSummary(sport, gameId);

    return new Response(
      JSON.stringify({
        success: true,
        game: summary.game,
        boxscore: summary.boxscore,
        leaders: summary.leaders,
        winProbability: summary.winProbability,
        dataStamp: {
          timestamp: new Date().toISOString(),
          source: 'ESPN',
          sport,
        },
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=30',
        },
      }
    );
  } catch (error) {
    console.error(`[Game API] Error fetching game ${gameId}:`, error);
    return new Response(
      JSON.stringify({
        error: 'Failed to fetch game data',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
