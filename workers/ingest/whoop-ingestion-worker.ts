/**
 * WHOOP Ingestion Worker (Cloudflare Worker)
 *
 * Scheduled worker that syncs wearables data from WHOOP v2 API
 * for all active devices with athlete consent.
 *
 * Triggers:
 * 1. CRON: Every hour (0 * * * *)
 * 2. Webhook: Real-time updates from WHOOP
 *
 * @see https://developers.cloudflare.com/workers/
 */

import { createWHOOPAdapter, NormalizedWearablesReading, NormalizedDailySummary } from '../../lib/adapters/whoop-adapter';

// ============================================================================
// TYPES
// ============================================================================

export interface Env {
  // Environment variables
  WHOOP_CLIENT_ID: string;
  WHOOP_CLIENT_SECRET: string;
  WHOOP_REDIRECT_URI: string;
  WHOOP_WEBHOOK_SECRET: string;
  ENCRYPTION_KEY: string;

  // Database connection
  DATABASE_URL: string;

  // R2 Storage (for raw data backup)
  R2_BUCKET: R2Bucket;

  // KV Store (for caching)
  KV_CACHE: KVNamespace;
}

interface WearableDevice {
  device_id: string;
  player_id: string;
  access_token_encrypted: string;
  refresh_token_encrypted: string;
  token_expires_at: Date;
  last_sync_at: Date | null;
}

// ============================================================================
// WORKER ENTRYPOINT
// ============================================================================

export default {
  /**
   * Scheduled trigger (CRON: every hour)
   */
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    console.log('[WHOOP Worker] Scheduled sync started at', new Date().toISOString());

    try {
      const results = await syncAllDevices(env);
      console.log('[WHOOP Worker] Sync complete:', results);
    } catch (error) {
      console.error('[WHOOP Worker] Sync failed:', error);
      throw error;
    }
  },

  /**
   * HTTP trigger (for webhooks and manual invocations)
   */
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // Webhook endpoint
    if (url.pathname === '/webhooks/whoop' && request.method === 'POST') {
      return handleWHOOPWebhook(request, env);
    }

    // Manual sync trigger (for testing)
    if (url.pathname === '/sync' && request.method === 'POST') {
      const results = await syncAllDevices(env);
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
// SYNC LOGIC
// ============================================================================

/**
 * Sync all active wearable devices
 */
async function syncAllDevices(env: Env): Promise<any> {
  const db = await connectDatabase(env.DATABASE_URL);
  const whoopAdapter = createWHOOPAdapter({
    clientId: env.WHOOP_CLIENT_ID,
    clientSecret: env.WHOOP_CLIENT_SECRET,
    redirectUri: env.WHOOP_REDIRECT_URI,
  });

  // Get all active devices
  const devicesResult = await db.query(`
    SELECT
      device_id,
      player_id,
      access_token_encrypted,
      refresh_token_encrypted,
      token_expires_at,
      last_sync_at
    FROM wearables_devices
    WHERE is_active = TRUE
      AND consent_granted = TRUE
      AND (last_sync_at IS NULL OR last_sync_at < NOW() - INTERVAL '1 hour')
    ORDER BY last_sync_at ASC NULLS FIRST
    LIMIT 50
  `);

  const devices: WearableDevice[] = devicesResult.rows;
  console.log(`[WHOOP Worker] Found ${devices.length} devices to sync`);

  const results = {
    total: devices.length,
    synced: 0,
    failed: 0,
    errors: [] as any[],
  };

  for (const device of devices) {
    try {
      await syncDevice(device, whoopAdapter, db, env);
      results.synced++;
    } catch (error) {
      console.error(`[WHOOP Worker] Failed to sync device ${device.device_id}:`, error);
      results.failed++;
      results.errors.push({
        device_id: device.device_id,
        error: error instanceof Error ? error.message : String(error),
      });

      // Update device sync status
      await db.query(`
        UPDATE wearables_devices
        SET sync_status = 'error',
            sync_error_message = $1,
            updated_at = NOW()
        WHERE device_id = $2
      `, [error instanceof Error ? error.message : String(error), device.device_id]);
    }
  }

  return results;
}

/**
 * Sync a single wearable device
 */
async function syncDevice(
  device: WearableDevice,
  whoopAdapter: any,
  db: any,
  env: Env
): Promise<void> {
  console.log(`[WHOOP Worker] Syncing device ${device.device_id} for player ${device.player_id}`);

  // Decrypt access token
  let accessToken = decrypt(device.access_token_encrypted, env.ENCRYPTION_KEY);

  // Check if token is expired
  if (new Date(device.token_expires_at) < new Date()) {
    console.log(`[WHOOP Worker] Access token expired, refreshing...`);
    const refreshToken = decrypt(device.refresh_token_encrypted, env.ENCRYPTION_KEY);

    try {
      const newTokens = await whoopAdapter.refreshAccessToken(refreshToken);
      accessToken = newTokens.access_token;

      // Update tokens in database
      await db.query(`
        UPDATE wearables_devices
        SET access_token_encrypted = $1,
            refresh_token_encrypted = $2,
            token_expires_at = $3,
            updated_at = NOW()
        WHERE device_id = $4
      `, [
        encrypt(newTokens.access_token, env.ENCRYPTION_KEY),
        encrypt(newTokens.refresh_token, env.ENCRYPTION_KEY),
        new Date(Date.now() + newTokens.expires_in * 1000),
        device.device_id,
      ]);
    } catch (error) {
      console.error(`[WHOOP Worker] Token refresh failed:`, error);
      throw error;
    }
  }

  // Determine sync window
  const lastSync = device.last_sync_at || new Date(Date.now() - 7 * 86400000); // 7 days ago if never synced
  const now = new Date();

  // Fetch cycle data (combines recovery, sleep, strain)
  const cycleData = await whoopAdapter.getCycleData(accessToken, lastSync, now);
  console.log(`[WHOOP Worker] Fetched ${cycleData.length} cycles from WHOOP`);

  if (cycleData.length === 0) {
    console.log(`[WHOOP Worker] No new data for device ${device.device_id}`);
    await db.query(`
      UPDATE wearables_devices
      SET last_sync_at = NOW(), sync_status = 'success'
      WHERE device_id = $1
    `, [device.device_id]);
    return;
  }

  // Also fetch recovery and sleep data for more detail
  const recoveryData = await whoopAdapter.getRecoveryData(accessToken, lastSync, now);
  const sleepData = await whoopAdapter.getSleepData(accessToken, lastSync, now);

  // Process each cycle
  for (const cycle of cycleData) {
    // Find matching recovery and sleep data
    const recovery = recoveryData.find((r: any) => r.cycle_id === cycle.id);
    const sleep = sleepData.find((s: any) => s.id === cycle.sleep_id);

    // Normalize to readings
    if (recovery) {
      const readings = whoopAdapter.normalizeRecoveryData(device.player_id, recovery);
      await insertReadings(readings, device.device_id, db, env);
    }

    if (sleep) {
      const readings = whoopAdapter.normalizeSleepData(device.player_id, sleep);
      await insertReadings(readings, device.device_id, db, env);
    }

    // Create daily summary
    const dailySummary = whoopAdapter.normalizeCycleDataToDailySummary(
      device.player_id,
      cycle,
      recovery,
      sleep
    );
    await upsertDailySummary(dailySummary, device.device_id, db);

    // Backup raw data to R2
    await backupRawData(env.R2_BUCKET, device.player_id, cycle.id, {
      cycle,
      recovery,
      sleep,
    });
  }

  // Update device sync status
  await db.query(`
    UPDATE wearables_devices
    SET last_sync_at = NOW(),
        sync_status = 'success',
        sync_error_message = NULL,
        updated_at = NOW()
    WHERE device_id = $1
  `, [device.device_id]);

  console.log(`[WHOOP Worker] Successfully synced device ${device.device_id}`);
}

/**
 * Insert wearables readings into database
 */
async function insertReadings(
  readings: NormalizedWearablesReading[],
  deviceId: string,
  db: any,
  env: Env
): Promise<void> {
  for (const reading of readings) {
    try {
      await db.query(`
        INSERT INTO wearables_readings (
          device_id,
          player_id,
          reading_timestamp,
          timezone_offset,
          metric_type,
          metric_value,
          metric_unit,
          quality_score,
          activity_state,
          source_session_id,
          raw_payload,
          data_source
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        ON CONFLICT (device_id, metric_type, reading_timestamp) DO UPDATE
        SET metric_value = EXCLUDED.metric_value,
            quality_score = EXCLUDED.quality_score,
            raw_payload = EXCLUDED.raw_payload
      `, [
        deviceId,
        reading.player_id,
        reading.reading_timestamp,
        reading.timezone_offset,
        reading.metric_type,
        reading.metric_value,
        reading.metric_unit,
        reading.quality_score,
        reading.activity_state,
        reading.source_session_id,
        JSON.stringify(reading.raw_payload),
        reading.data_source,
      ]);
    } catch (error) {
      console.error(`[WHOOP Worker] Failed to insert reading:`, error);
      // Continue with other readings
    }
  }
}

/**
 * Upsert daily summary
 */
async function upsertDailySummary(
  summary: NormalizedDailySummary,
  deviceId: string,
  db: any
): Promise<void> {
  await db.query(`
    INSERT INTO wearables_daily_summary (
      device_id,
      player_id,
      summary_date,
      hrv_rmssd_avg,
      hrv_rmssd_min,
      hrv_rmssd_max,
      hrv_baseline_deviation,
      resting_hr_avg,
      resting_hr_min,
      hr_variability_index,
      day_strain,
      recovery_score,
      sleep_performance_score,
      total_sleep_minutes,
      rem_sleep_minutes,
      deep_sleep_minutes,
      sleep_efficiency,
      respiratory_rate_avg,
      data_completeness,
      raw_payload,
      data_source
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
    ON CONFLICT (device_id, summary_date) DO UPDATE
    SET hrv_rmssd_avg = EXCLUDED.hrv_rmssd_avg,
        resting_hr_avg = EXCLUDED.resting_hr_avg,
        day_strain = EXCLUDED.day_strain,
        recovery_score = EXCLUDED.recovery_score,
        sleep_performance_score = EXCLUDED.sleep_performance_score,
        total_sleep_minutes = EXCLUDED.total_sleep_minutes,
        rem_sleep_minutes = EXCLUDED.rem_sleep_minutes,
        deep_sleep_minutes = EXCLUDED.deep_sleep_minutes,
        sleep_efficiency = EXCLUDED.sleep_efficiency,
        respiratory_rate_avg = EXCLUDED.respiratory_rate_avg,
        data_completeness = EXCLUDED.data_completeness,
        raw_payload = EXCLUDED.raw_payload,
        updated_at = NOW()
  `, [
    deviceId,
    summary.player_id,
    summary.summary_date,
    summary.hrv_rmssd_avg,
    summary.hrv_rmssd_min,
    summary.hrv_rmssd_max,
    summary.hrv_baseline_deviation,
    summary.resting_hr_avg,
    summary.resting_hr_min,
    summary.hr_variability_index,
    summary.day_strain,
    summary.recovery_score,
    summary.sleep_performance_score,
    summary.total_sleep_minutes,
    summary.rem_sleep_minutes,
    summary.deep_sleep_minutes,
    summary.sleep_efficiency,
    summary.respiratory_rate_avg,
    summary.data_completeness,
    JSON.stringify(summary.raw_payload),
    summary.data_source,
  ]);
}

/**
 * Backup raw data to R2 for audit trail
 */
async function backupRawData(
  bucket: R2Bucket,
  playerId: string,
  cycleId: number,
  data: any
): Promise<void> {
  const key = `whoop/raw/${playerId}/${new Date().toISOString().split('T')[0]}/${cycleId}.json`;

  await bucket.put(key, JSON.stringify(data, null, 2), {
    httpMetadata: {
      contentType: 'application/json',
    },
  });
}

// ============================================================================
// WEBHOOK HANDLER
// ============================================================================

/**
 * Handle WHOOP webhook events
 */
async function handleWHOOPWebhook(request: Request, env: Env): Promise<Response> {
  const signature = request.headers.get('X-WHOOP-Signature');
  if (!signature) {
    return new Response('Missing signature', { status: 401 });
  }

  const body = await request.text();

  // Verify webhook signature
  const whoopAdapter = createWHOOPAdapter({
    clientId: env.WHOOP_CLIENT_ID,
    clientSecret: env.WHOOP_CLIENT_SECRET,
    redirectUri: env.WHOOP_REDIRECT_URI,
  });

  const isValid = whoopAdapter.verifyWebhookSignature(
    body,
    signature,
    env.WHOOP_WEBHOOK_SECRET
  );

  if (!isValid) {
    console.error('[WHOOP Webhook] Invalid signature');
    return new Response('Invalid signature', { status: 403 });
  }

  const event = JSON.parse(body);
  console.log('[WHOOP Webhook] Received event:', event.type);

  // Process webhook event asynchronously
  // (in production, use a queue like Cloudflare Queues)
  const db = await connectDatabase(env.DATABASE_URL);

  try {
    await processWebhookEvent(event, db, env);
    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error('[WHOOP Webhook] Processing failed:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

/**
 * Process webhook event
 */
async function processWebhookEvent(event: any, db: any, env: Env): Promise<void> {
  // Find device by user_id
  const deviceResult = await db.query(`
    SELECT device_id, player_id, access_token_encrypted
    FROM wearables_devices
    WHERE raw_payload->>'user_id' = $1
      AND is_active = TRUE
  `, [event.user_id.toString()]);

  if (deviceResult.rows.length === 0) {
    console.log(`[WHOOP Webhook] No device found for user ${event.user_id}`);
    return;
  }

  const device = deviceResult.rows[0];

  // Trigger immediate sync for this device
  const whoopAdapter = createWHOOPAdapter({
    clientId: env.WHOOP_CLIENT_ID,
    clientSecret: env.WHOOP_CLIENT_SECRET,
    redirectUri: env.WHOOP_REDIRECT_URI,
  });

  await syncDevice(device, whoopAdapter, db, env);
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Connect to PostgreSQL database
 */
async function connectDatabase(databaseUrl: string): Promise<any> {
  // In production, use @neondatabase/serverless or postgres.js
  // For now, return a mock interface
  const { Client } = require('pg');
  const client = new Client({ connectionString: databaseUrl });
  await client.connect();
  return client;
}

/**
 * Encrypt data using AES-256
 */
function encrypt(data: string, key: string): string {
  // In production, use Web Crypto API
  // For now, return base64 encoded (NOT SECURE)
  return Buffer.from(data).toString('base64');
}

/**
 * Decrypt data using AES-256
 */
function decrypt(encryptedData: string, key: string): string {
  // In production, use Web Crypto API
  // For now, return base64 decoded (NOT SECURE)
  return Buffer.from(encryptedData, 'base64').toString('utf-8');
}
