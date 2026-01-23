/**
 * BSI Rankings API Endpoint
 * Serves college football rankings with correct HTTP status codes.
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

/** Ranking record type */
interface RankingRecord {
  rank: number;
  team: string;
  record: string;
  conference?: string;
  points?: number;
  previousRank?: number;
}

/** Valid ranking polls */
const VALID_POLLS = ['ap', 'coaches', 'cfp'] as const;
type Poll = (typeof VALID_POLLS)[number];

/**
 * Handle GET requests for rankings
 *
 * Routes:
 * - /api/v1/rankings/cfb/ap - AP Top 25
 * - /api/v1/rankings/cfb/coaches - Coaches Poll
 * - /api/v1/rankings/cfb/cfp - College Football Playoff Rankings
 */
export async function onRequestGet(context: EventContext<Env>): Promise<Response> {
  const url = new URL(context.request.url);
  const pathParts = url.pathname.split('/').filter(Boolean);

  // Expected: ['api', 'v1', 'rankings', sport, poll]
  if (pathParts.length < 5) {
    return new Response(
      JSON.stringify({
        status: 'invalid',
        data: null,
        error: {
          code: 'INVALID_PATH',
          message: 'Expected format: /api/v1/rankings/{sport}/{poll}',
        },
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  const sport = pathParts[3];
  const poll = pathParts[4] as Poll;

  // Only CFB rankings supported currently
  if (sport !== 'cfb') {
    return new Response(
      JSON.stringify({
        status: 'invalid',
        data: null,
        error: {
          code: 'INVALID_SPORT',
          message: 'Only "cfb" (college football) rankings are currently supported',
        },
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // Validate poll type
  if (!VALID_POLLS.includes(poll)) {
    return new Response(
      JSON.stringify({
        status: 'invalid',
        data: null,
        error: {
          code: 'INVALID_POLL',
          message: `Poll must be one of: ${VALID_POLLS.join(', ')}`,
        },
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // Build cache key and dataset ID
  const cacheKey = `cfb:rankings:${poll}`;
  const datasetId = `cfb-rankings-${poll}`;

  // Read with validation and HTTP status reconstruction
  const result = await validatedRead<RankingRecord>(
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
