/**
 * BSI Games API Endpoint
 * Serves live and upcoming games with correct HTTP status codes.
 */

import { validatedRead, toResponse } from '../../../../lib/validated-read';

/** Environment bindings */
interface Env {
  BSI_CACHE: KVNamespace;
  BSI_BACKUP?: R2Bucket;
}

/** Context from Cloudflare Pages Functions */
interface EventContext<E> {
  request: Request;
  env: E;
  params: Record<string, string>;
}

/** Game record type */
interface GameRecord {
  gameId: string;
  homeTeam: string;
  awayTeam: string;
  status: string;
  homeScore?: number;
  awayScore?: number;
  scheduledAt?: string;
  inning?: string;
  quarter?: string;
}

/**
 * Handle GET requests for games
 *
 * Routes:
 * - /api/v1/games/cbb/live - Live college baseball games
 * - /api/v1/games/cbb/upcoming - Upcoming college baseball games
 * - /api/v1/games/cfb/live - Live college football games
 */
export async function onRequestGet(context: EventContext<Env>): Promise<Response> {
  const url = new URL(context.request.url);
  const pathParts = url.pathname.split('/').filter(Boolean);

  // Expected: ['api', 'v1', 'games', sport, type]
  if (pathParts.length < 5) {
    return new Response(
      JSON.stringify({
        status: 'invalid',
        data: null,
        error: {
          code: 'INVALID_PATH',
          message: 'Expected format: /api/v1/games/{sport}/{type}',
        },
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  const sport = pathParts[3]; // cbb or cfb
  const gameType = pathParts[4]; // live or upcoming

  // Validate sport
  if (!['cbb', 'cfb'].includes(sport)) {
    return new Response(
      JSON.stringify({
        status: 'invalid',
        data: null,
        error: {
          code: 'INVALID_SPORT',
          message: 'Sport must be "cbb" (college baseball) or "cfb" (college football)',
        },
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // Validate game type
  if (!['live', 'upcoming'].includes(gameType)) {
    return new Response(
      JSON.stringify({
        status: 'invalid',
        data: null,
        error: {
          code: 'INVALID_GAME_TYPE',
          message: 'Game type must be "live" or "upcoming"',
        },
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // Build cache key and dataset ID
  const cacheKey = `${sport}:games:${gameType}`;
  const datasetId = `${sport}-games-${gameType}`;

  // Read with validation and HTTP status reconstruction
  const result = await validatedRead<GameRecord>(
    context.env.BSI_CACHE,
    context.env.BSI_BACKUP ?? null,
    cacheKey,
    datasetId
  );

  // Return response with correct HTTP status
  return toResponse(result);
}

export default {
  onRequestGet,
};
