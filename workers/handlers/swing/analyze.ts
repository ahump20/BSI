/**
 * Swing Analysis Worker Handler
 * Receives swing video + metrics, stores in R2 + D1.
 */

import type { Env } from '../../shared/types';

interface SwingUploadBody {
  swingId: string;
  sport: string;
  metrics: string; // JSON
  overallScore: string;
  frameCount: string;
}

export async function handleSwingAnalyze(
  req: Request,
  env: Env,
  ctx?: ExecutionContext,
): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const formData = await req.formData();
    const video = formData.get('video') as File | null;
    const swingId = formData.get('swingId') as string;
    const sport = formData.get('sport') as string;
    const metricsJson = formData.get('metrics') as string;
    const overallScore = formData.get('overallScore') as string;
    const frameCount = formData.get('frameCount') as string;

    if (!swingId || !sport || !metricsJson) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get user from BSI key (optional — works without auth for free tier)
    const bsiKey = req.headers.get('X-BSI-Key');
    const userId = bsiKey || 'anonymous';

    // Store video in R2 (background — don't block response)
    if (video && env.ASSETS_BUCKET) {
      const videoKey = `swing-videos/${userId}/${swingId}.${video.type === 'video/mp4' ? 'mp4' : 'webm'}`;
      ctx?.waitUntil(
        env.ASSETS_BUCKET.put(videoKey, video.stream(), {
          httpMetadata: { contentType: video.type },
          customMetadata: { swingId, sport, userId },
        }),
      );
    }

    // Store analysis in D1
    if (env.DB) {
      // Ensure table exists (idempotent)
      ctx?.waitUntil(
        env.DB.exec(`
          CREATE TABLE IF NOT EXISTS swing_analyses (
            swing_id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            sport TEXT NOT NULL,
            overall_score INTEGER NOT NULL,
            metrics_json TEXT NOT NULL,
            frame_count INTEGER,
            created_at TEXT DEFAULT (datetime('now')),
            updated_at TEXT DEFAULT (datetime('now'))
          )
        `),
      );

      await env.DB.prepare(
        `INSERT OR REPLACE INTO swing_analyses
         (swing_id, user_id, sport, overall_score, metrics_json, frame_count, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
      )
        .bind(swingId, userId, sport, parseInt(overallScore) || 0, metricsJson, parseInt(frameCount) || 0)
        .run();
    }

    return new Response(
      JSON.stringify({
        success: true,
        swingId,
        meta: {
          source: 'BSI Swing Intelligence',
          fetched_at: new Date().toISOString(),
          timezone: 'America/Chicago',
        },
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  } catch (err) {
    console.error('[swing/analyze] error:', err instanceof Error ? err.message : err);
    return new Response(
      JSON.stringify({ error: 'Failed to store swing analysis' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
}
