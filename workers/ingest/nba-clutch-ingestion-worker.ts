/**
 * NBA Clutch Data Ingestion Worker (Cloudflare Worker)
 *
 * Scheduled worker that ingests play-by-play data from NBA Stats API
 * and identifies clutch situations (last 5:00, margin ≤5).
 *
 * Triggers:
 * 1. CRON: Every 5 minutes during NBA season (October-June)
 * 2. Manual: POST /ingest-game/:gameId
 *
 * @see https://developers.cloudflare.com/workers/
 */

import {
  createNBAStatsClutchAdapter,
  ClutchSituation,
  ClutchPlayerAction,
} from '../../lib/adapters/nba-stats-clutch-adapter';

// ============================================================================
// TYPES
// ============================================================================

export interface Env {
  // Database connection
  DATABASE_URL: string;

  // R2 Storage (for raw data backup)
  R2_BUCKET: R2Bucket;

  // KV Store (for tracking processed games)
  KV_CACHE: KVNamespace;

  // NBA Stats API config (optional)
  NBA_STATS_USER_AGENT?: string;
  NBA_STATS_REFERER?: string;
}

interface GameToProcess {
  game_id: string;
  game_date: Date;
  season: string;
  home_team_id: string;
  away_team_id: string;
  status: string; // 'scheduled', 'in_progress', 'final'
}

// ============================================================================
// WORKER ENTRYPOINT
// ============================================================================

export default {
  /**
   * Scheduled trigger (CRON: every 5 minutes during season)
   */
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    console.log('[NBA Clutch Worker] Scheduled run started at', new Date().toISOString());

    try {
      const results = await ingestTodaysGames(env);
      console.log('[NBA Clutch Worker] Ingestion complete:', results);
    } catch (error) {
      console.error('[NBA Clutch Worker] Ingestion failed:', error);
      throw error;
    }
  },

  /**
   * HTTP trigger (for manual invocations)
   */
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // Manual game ingestion
    if (url.pathname.startsWith('/ingest-game/') && request.method === 'POST') {
      const gameId = url.pathname.split('/').pop();
      if (!gameId) {
        return new Response('Missing game ID', { status: 400 });
      }

      try {
        const result = await ingestGame(gameId, env);
        return new Response(JSON.stringify(result), {
          headers: { 'Content-Type': 'application/json' },
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: String(error) }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    // Batch ingestion for date range
    if (url.pathname === '/ingest-range' && request.method === 'POST') {
      const body = (await request.json()) as { startDate: string; endDate: string };
      const results = await ingestDateRange(body.startDate, body.endDate, env);
      return new Response(JSON.stringify(results), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Health check
    if (url.pathname === '/health') {
      return new Response(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response('Not Found', { status: 404 });
  },
};

// ============================================================================
// INGESTION LOGIC
// ============================================================================

/**
 * Ingest all games from today
 */
async function ingestTodaysGames(env: Env): Promise<any> {
  const db = await connectDatabase(env.DATABASE_URL);
  const today = new Date().toISOString().split('T')[0];

  // Get games scheduled for today
  const gamesResult = await db.query(
    `
    SELECT
      game_id,
      game_date,
      season,
      home_team_id,
      away_team_id,
      status
    FROM games
    WHERE game_date::date = $1
      AND sport = 'basketball'
      AND status IN ('in_progress', 'final')
    ORDER BY game_date DESC
  `,
    [today]
  );

  const games: GameToProcess[] = gamesResult.rows;
  console.log(`[NBA Clutch Worker] Found ${games.length} games to process`);

  const results = {
    total: games.length,
    processed: 0,
    skipped: 0,
    failed: 0,
    errors: [] as any[],
  };

  for (const game of games) {
    try {
      // Check if already processed (use KV cache)
      const cacheKey = `nba-clutch:processed:${game.game_id}`;
      const alreadyProcessed = await env.KV_CACHE.get(cacheKey);

      if (alreadyProcessed && game.status === 'final') {
        console.log(`[NBA Clutch Worker] Game ${game.game_id} already processed, skipping`);
        results.skipped++;
        continue;
      }

      await ingestGame(game.game_id, env);
      results.processed++;

      // Mark as processed if game is final
      if (game.status === 'final') {
        await env.KV_CACHE.put(cacheKey, 'true', { expirationTtl: 86400 * 30 }); // 30 days
      }
    } catch (error) {
      console.error(`[NBA Clutch Worker] Failed to process game ${game.game_id}:`, error);
      results.failed++;
      results.errors.push({
        game_id: game.game_id,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return results;
}

/**
 * Ingest a single game
 */
async function ingestGame(gameId: string, env: Env): Promise<any> {
  console.log(`[NBA Clutch Worker] Processing game ${gameId}`);

  const db = await connectDatabase(env.DATABASE_URL);
  const nbaAdapter = createNBAStatsClutchAdapter({
    userAgent: env.NBA_STATS_USER_AGENT,
    referer: env.NBA_STATS_REFERER,
  });

  // 1. Fetch play-by-play data
  const playByPlay = await nbaAdapter.getPlayByPlay(gameId);
  console.log(`[NBA Clutch Worker] Fetched ${playByPlay.length} play-by-play events`);

  // Backup raw play-by-play data to R2
  await backupRawData(env.R2_BUCKET, gameId, 'play-by-play', playByPlay);

  // 2. Identify clutch situations
  const clutchSituations = nbaAdapter.identifyClutchSituations(playByPlay, gameId);
  console.log(`[NBA Clutch Worker] Identified ${clutchSituations.length} clutch situations`);

  if (clutchSituations.length === 0) {
    console.log(`[NBA Clutch Worker] No clutch situations found for game ${gameId}`);
    return { gameId, clutchSituations: 0, actions: 0 };
  }

  // 3. Get game summary for playoff context
  const gameSummary = await nbaAdapter.getGameSummary(gameId);
  const isPlayoff = gameSummary?.resultSets?.[0]?.rowSet?.[0]?.[4] === 'Playoffs'; // Adjust based on actual API

  // 4. Insert clutch situations
  const situationIds: string[] = [];
  for (const situation of clutchSituations) {
    situation.playoff_game = isPlayoff;

    const result = await db.query(
      `
      INSERT INTO clutch_situations (
        game_id,
        situation_type,
        start_timestamp,
        end_timestamp,
        game_clock_start,
        game_clock_end,
        period,
        score_margin,
        score_margin_absolute,
        home_score,
        away_score,
        is_clutch_time,
        clutch_intensity,
        playoff_game,
        elimination_game,
        raw_payload,
        data_source
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      ON CONFLICT (game_id, start_timestamp) DO UPDATE
      SET clutch_intensity = EXCLUDED.clutch_intensity,
          playoff_game = EXCLUDED.playoff_game,
          updated_at = NOW()
      RETURNING situation_id
    `,
      [
        situation.game_id,
        situation.situation_type,
        situation.start_timestamp,
        situation.end_timestamp,
        situation.game_clock_start,
        situation.game_clock_end,
        situation.period,
        situation.score_margin,
        situation.score_margin_absolute,
        situation.home_score,
        situation.away_score,
        situation.is_clutch_time,
        situation.clutch_intensity,
        situation.playoff_game,
        situation.elimination_game,
        JSON.stringify(situation.raw_payload),
        situation.data_source,
      ]
    );

    situationIds.push(result.rows[0].situation_id);
  }

  // 5. Extract player actions
  const allActions = nbaAdapter.extractClutchPlayerActions(playByPlay, clutchSituations, gameId);
  console.log(`[NBA Clutch Worker] Extracted ${allActions.length} player actions`);

  // 6. Insert player actions
  let actionsInserted = 0;
  for (let i = 0; i < allActions.length; i++) {
    const action = allActions[i];
    const situationId = situationIds[Math.floor(i / (allActions.length / situationIds.length))]; // Map actions to situations

    try {
      await db.query(
        `
        INSERT INTO clutch_player_actions (
          situation_id,
          game_id,
          player_id,
          action_timestamp,
          action_type,
          action_subtype,
          is_successful,
          points_scored,
          shot_distance,
          shot_location_x,
          shot_location_y,
          defender_distance,
          touch_time,
          expected_points,
          points_over_expected,
          raw_payload,
          data_source
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
        ON CONFLICT DO NOTHING
      `,
        [
          situationId,
          action.game_id,
          action.player_id,
          action.action_timestamp,
          action.action_type,
          action.action_subtype,
          action.is_successful,
          action.points_scored,
          action.shot_distance,
          action.shot_location_x,
          action.shot_location_y,
          action.defender_distance,
          action.touch_time,
          action.expected_points,
          action.points_over_expected,
          JSON.stringify(action.raw_payload),
          action.data_source,
        ]
      );

      actionsInserted++;
    } catch (error) {
      console.error(`[NBA Clutch Worker] Failed to insert action:`, error);
      // Continue with other actions
    }
  }

  console.log(
    `[NBA Clutch Worker] Successfully processed game ${gameId}: ${clutchSituations.length} situations, ${actionsInserted} actions`
  );

  return {
    gameId,
    clutchSituations: clutchSituations.length,
    actions: actionsInserted,
  };
}

/**
 * Ingest games for a date range (for historical backfill)
 */
async function ingestDateRange(startDate: string, endDate: string, env: Env): Promise<any> {
  const db = await connectDatabase(env.DATABASE_URL);

  const gamesResult = await db.query(
    `
    SELECT game_id
    FROM games
    WHERE game_date::date BETWEEN $1 AND $2
      AND sport = 'basketball'
      AND status = 'final'
    ORDER BY game_date ASC
  `,
    [startDate, endDate]
  );

  const gameIds: string[] = gamesResult.rows.map((r: any) => r.game_id);
  console.log(
    `[NBA Clutch Worker] Found ${gameIds.length} games in range ${startDate} to ${endDate}`
  );

  const results = {
    total: gameIds.length,
    processed: 0,
    failed: 0,
    errors: [] as any[],
  };

  for (const gameId of gameIds) {
    try {
      await ingestGame(gameId, env);
      results.processed++;

      // Rate limiting: wait 3 seconds between requests
      await sleep(3000);
    } catch (error) {
      console.error(`[NBA Clutch Worker] Failed to process game ${gameId}:`, error);
      results.failed++;
      results.errors.push({
        game_id: gameId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return results;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Backup raw data to R2 for audit trail
 */
async function backupRawData(
  bucket: R2Bucket,
  gameId: string,
  dataType: string,
  data: any
): Promise<void> {
  const key = `nba/${dataType}/${new Date().toISOString().split('T')[0]}/${gameId}.json`;

  await bucket.put(key, JSON.stringify(data, null, 2), {
    httpMetadata: {
      contentType: 'application/json',
    },
  });
}

/**
 * Connect to PostgreSQL database
 */
async function connectDatabase(databaseUrl: string): Promise<any> {
  // In production, use @neondatabase/serverless or postgres.js
  const { Client } = require('pg');
  const client = new Client({ connectionString: databaseUrl });
  await client.connect();
  return client;
}

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
