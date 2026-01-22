/**
 * Blaze Sports Intel - Vision AI Baselines API
 *
 * Manages user calibration baselines for pose estimation.
 * Baselines store personalized reference points for form analysis.
 *
 * Endpoints:
 * - GET /api/v1/vision/baselines - Load user's saved baseline
 * - POST /api/v1/vision/baselines - Save new baseline
 */

interface Env {
  DB: D1Database;
  KV: KVNamespace;
}

interface Baseline {
  stability: number;
  shoulderSymmetry: number;
  hipSymmetry: number;
  spineLean: number;
  energy?: number;
  steadiness?: number;
  savedAt: number;
}

interface BaselineRecord {
  user_id: string;
  baseline_data: string;
  created_at: string;
  updated_at: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://blazesportsintel.com',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Accept, Authorization',
  'Content-Type': 'application/json',
};

// Handle OPTIONS preflight
export async function onRequestOptions(): Promise<Response> {
  return new Response(null, { status: 204, headers: corsHeaders });
}

// GET - Load saved baseline
export async function onRequestGet(context: { request: Request; env: Env }): Promise<Response> {
  const { request, env } = context;

  try {
    // Get user ID from header or query param (for now, use a session-based approach)
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId') || 'anonymous';

    // Try KV cache first
    const cacheKey = `vision:baseline:${userId}`;
    const cached = await env.KV?.get(cacheKey);
    if (cached) {
      const baseline = JSON.parse(cached);
      return new Response(
        JSON.stringify({
          success: true,
          baseline,
          source: 'cache',
        }),
        { status: 200, headers: corsHeaders }
      );
    }

    // Query D1 database
    if (env.DB) {
      const result = await env.DB.prepare(
        'SELECT baseline_data, updated_at FROM vision_baselines WHERE user_id = ? ORDER BY updated_at DESC LIMIT 1'
      )
        .bind(userId)
        .first<BaselineRecord>();

      if (result) {
        const baseline = JSON.parse(result.baseline_data);

        // Cache for 1 hour
        await env.KV?.put(cacheKey, result.baseline_data, { expirationTtl: 3600 });

        return new Response(
          JSON.stringify({
            success: true,
            baseline,
            updatedAt: result.updated_at,
            source: 'database',
          }),
          { status: 200, headers: corsHeaders }
        );
      }
    }

    // No baseline found
    return new Response(
      JSON.stringify({
        success: true,
        baseline: null,
        message: 'No baseline saved yet',
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    console.error('Failed to load baseline:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to load baseline',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: corsHeaders }
    );
  }
}

// POST - Save baseline
export async function onRequestPost(context: { request: Request; env: Env }): Promise<Response> {
  const { request, env } = context;

  try {
    const body = (await request.json()) as { baseline: Baseline; userId?: string };
    const { baseline, userId = 'anonymous' } = body;

    // Validate baseline data
    if (
      !baseline ||
      typeof baseline.stability !== 'number' ||
      typeof baseline.shoulderSymmetry !== 'number' ||
      typeof baseline.hipSymmetry !== 'number' ||
      typeof baseline.spineLean !== 'number' ||
      (baseline.energy !== undefined && typeof baseline.energy !== 'number') ||
      (baseline.steadiness !== undefined && typeof baseline.steadiness !== 'number')
    ) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid baseline data',
          message: 'Baseline must include stability, shoulderSymmetry, hipSymmetry, and spineLean',
        }),
        { status: 400, headers: corsHeaders }
      );
    }

    const now = new Date().toISOString();
    const baselineJson = JSON.stringify(baseline);

    // Save to D1 database
    if (env.DB) {
      await env.DB.prepare(
        `INSERT INTO vision_baselines (user_id, baseline_data, created_at, updated_at)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(user_id) DO UPDATE SET baseline_data = ?, updated_at = ?`
      )
        .bind(userId, baselineJson, now, now, baselineJson, now)
        .run();
    }

    // Update KV cache
    const cacheKey = `vision:baseline:${userId}`;
    await env.KV?.put(cacheKey, baselineJson, { expirationTtl: 3600 });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Baseline saved successfully',
        savedAt: now,
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    console.error('Failed to save baseline:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to save baseline',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: corsHeaders }
    );
  }
}
