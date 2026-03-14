/**
 * Swing History Worker Handler
 * Fetches swing analysis history for a user from D1.
 */

import type { Env } from '../../shared/types';

export async function handleSwingHistory(
  req: Request,
  env: Env,
): Promise<Response> {
  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const bsiKey = req.headers.get('X-BSI-Key');
  const userId = bsiKey || 'anonymous';

  if (!env.DB) {
    return new Response(
      JSON.stringify({
        swings: [],
        meta: {
          source: 'BSI Swing Intelligence',
          fetched_at: new Date().toISOString(),
          timezone: 'America/Chicago',
        },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  }

  try {
    const result = await env.DB.prepare(
      `SELECT swing_id, sport, overall_score, metrics_json, frame_count, created_at
       FROM swing_analyses
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT 50`,
    )
      .bind(userId)
      .all<{
        swing_id: string;
        sport: string;
        overall_score: number;
        metrics_json: string;
        frame_count: number;
        created_at: string;
      }>();

    const swings = (result.results || []).map((row) => {
      let metrics: { key: string; value: number; score: number; label: string }[] = [];
      try {
        metrics = JSON.parse(row.metrics_json);
      } catch {
        // Corrupted metrics — return empty
      }

      return {
        swingId: row.swing_id,
        sport: row.sport,
        overallScore: row.overall_score,
        createdAt: row.created_at,
        metrics,
      };
    });

    return new Response(
      JSON.stringify({
        swings,
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
    console.error('[swing/history] error:', err instanceof Error ? err.message : err);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch swing history' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
}
