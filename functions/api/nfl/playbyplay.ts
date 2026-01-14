/**
 * NFL Play-by-Play API Endpoint
 * Returns play-by-play data with EPA/WPA metrics
 */

import { nflPlayByPlayService } from '../../../lib/services/nfl-playbyplay';

export async function onRequestGet(context: any) {
  const { request } = context;
  const url = new URL(request.url);
  const gameId = url.searchParams.get('gameId');

  if (!gameId) {
    return new Response(
      JSON.stringify({
        error: 'Missing gameId parameter',
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    const playByPlay = await nflPlayByPlayService.getPlayByPlay(gameId);
    const epaMetrics = await nflPlayByPlayService.getEPAMetrics(gameId);
    const wpaMetrics = await nflPlayByPlayService.getWPAMetrics(gameId);

    return new Response(
      JSON.stringify({
        playByPlay,
        epaMetrics,
        wpaMetrics,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=30',
        },
      }
    );
  } catch (error) {
    console.error('Error fetching play-by-play data:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to fetch play-by-play data',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
