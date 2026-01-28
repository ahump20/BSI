/**
 * Portal Event Sentiment API
 *
 * POST endpoint that processes portal events and updates fanbase sentiment.
 * Validates the payload, processes via sentiment-engine, updates D1, and invalidates KV cache.
 *
 * @author Austin Humphrey - Blaze Sports Intel
 */

import type { CloudflareEnv } from '@/lib/prediction/types';
import {
  processEvent,
  type SentimentEvent,
  type PortalEventMeta,
} from '@/lib/fanbase/sentiment-engine';
import type { FanbaseSentiment } from '@/lib/fanbase/types';

interface Env extends CloudflareEnv {
  FANBASE_DB: D1Database;
  BSI_FANBASE_CACHE: KVNamespace;
}

/**
 * Validate that the request body is a valid SentimentEvent.
 */
function validatePortalEvent(body: unknown): body is SentimentEvent {
  if (!body || typeof body !== 'object') return false;

  const event = body as Partial<SentimentEvent>;

  if (!event.id || typeof event.id !== 'string') return false;
  if (!event.schoolId || typeof event.schoolId !== 'string') return false;
  if (
    !event.eventType ||
    !['transfer_portal_gain', 'transfer_portal_loss'].includes(event.eventType)
  ) {
    return false;
  }
  if (!event.timestamp || typeof event.timestamp !== 'string') return false;
  if (!event.metadata || typeof event.metadata !== 'object') return false;

  const meta = event.metadata as Partial<PortalEventMeta>;
  if (!meta.playerName || typeof meta.playerName !== 'string') return false;
  if (!meta.position || typeof meta.position !== 'string') return false;
  if (typeof meta.rating !== 'number' || meta.rating < 0 || meta.rating > 5) return false;

  return true;
}

/**
 * Get current sentiment for a school from D1.
 */
async function getCurrentSentiment(
  db: D1Database,
  schoolId: string
): Promise<FanbaseSentiment | null> {
  const result = await db
    .prepare(
      `SELECT sentiment_overall, sentiment_optimism, sentiment_loyalty, sentiment_volatility
       FROM fanbase_profiles
       WHERE id = ?`
    )
    .bind(schoolId)
    .first<{
      sentiment_overall: number;
      sentiment_optimism: number;
      sentiment_loyalty: number;
      sentiment_volatility: number;
    }>();

  if (!result) return null;

  return {
    overall: result.sentiment_overall,
    optimism: result.sentiment_optimism,
    loyalty: result.sentiment_loyalty,
    volatility: result.sentiment_volatility,
  };
}

/**
 * Update sentiment in D1.
 */
async function updateSentiment(
  db: D1Database,
  schoolId: string,
  sentiment: FanbaseSentiment
): Promise<void> {
  await db
    .prepare(
      `UPDATE fanbase_profiles
       SET sentiment_overall = ?,
           sentiment_optimism = ?,
           sentiment_loyalty = ?,
           sentiment_volatility = ?,
           updated_at = ?
       WHERE id = ?`
    )
    .bind(
      sentiment.overall,
      sentiment.optimism,
      sentiment.loyalty,
      sentiment.volatility,
      new Date().toISOString(),
      schoolId
    )
    .run();
}

/**
 * Insert event into sentiment_events table.
 */
async function insertSentimentEvent(db: D1Database, event: SentimentEvent): Promise<void> {
  const meta = event.metadata as PortalEventMeta;

  await db
    .prepare(
      `INSERT INTO sentiment_events (
        id, fanbase_id, event_type, timestamp,
        player_name, position, rating, from_school, to_school,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      event.id,
      event.schoolId,
      event.eventType,
      event.timestamp,
      meta.playerName,
      meta.position,
      meta.rating,
      meta.fromSchool ?? null,
      meta.toSchool ?? null,
      new Date().toISOString()
    )
    .run();
}

/**
 * Invalidate KV cache for affected school.
 */
async function invalidateCache(cache: KVNamespace, schoolId: string): Promise<void> {
  // Delete cached sentiment data for this school
  await Promise.all([
    cache.delete(`sentiment:${schoolId}`),
    cache.delete(`profile:${schoolId}`),
    cache.delete(`snapshots:${schoolId}`),
  ]);
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  try {
    const body = await request.json();

    // Validate the event
    if (!validatePortalEvent(body)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: { code: 'INVALID_PAYLOAD', message: 'Invalid portal event payload' },
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const event = body as SentimentEvent;

    // Check for required bindings
    if (!env.FANBASE_DB) {
      return new Response(
        JSON.stringify({
          success: false,
          error: { code: 'CONFIG_ERROR', message: 'FANBASE_DB binding not configured' },
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get current sentiment
    const currentSentiment = await getCurrentSentiment(env.FANBASE_DB, event.schoolId);

    if (!currentSentiment) {
      return new Response(
        JSON.stringify({
          success: false,
          error: { code: 'NOT_FOUND', message: `School ${event.schoolId} not found` },
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Process the event to get updated sentiment
    const updatedSentiment = processEvent(event, currentSentiment);

    // Update D1 with new sentiment
    await updateSentiment(env.FANBASE_DB, event.schoolId, updatedSentiment);

    // Insert event record
    await insertSentimentEvent(env.FANBASE_DB, event);

    // Invalidate KV cache
    if (env.BSI_FANBASE_CACHE) {
      await invalidateCache(env.BSI_FANBASE_CACHE, event.schoolId);
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          schoolId: event.schoolId,
          eventType: event.eventType,
          previousSentiment: currentSentiment,
          updatedSentiment,
          delta: {
            overall: updatedSentiment.overall - currentSentiment.overall,
            optimism: updatedSentiment.optimism - currentSentiment.optimism,
          },
        },
        meta: {
          timestamp: new Date().toISOString(),
          processingTimeMs: 0, // Would track actual time in production
        },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Portal event processing error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
