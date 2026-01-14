/**
 * Predictions API Endpoint
 * Returns game predictions for specified sport
 */

import { predictionService } from '../../../lib/services/predictions';

export async function onRequestGet(context: any) {
  const { request, params } = context;
  const url = new URL(request.url);
  const sport = params.sport || url.searchParams.get('sport');
  const gameId = url.searchParams.get('gameId');

  if (!sport || !gameId) {
    return new Response(
      JSON.stringify({
        error: 'Missing required parameters: sport and gameId',
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    const prediction = await predictionService.predictGame(gameId, sport);
    const playerProps = await predictionService.predictPlayerProps(gameId, sport);
    const metrics = await predictionService.getMetrics();

    return new Response(
      JSON.stringify({
        prediction,
        playerProps,
        metrics,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=300',
        },
      }
    );
  } catch (error) {
    console.error('Error generating predictions:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to generate predictions',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
