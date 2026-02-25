/**
 * Prediction handlers — submit and accuracy endpoints.
 */

import type { Env, PredictionPayload } from '../shared/types';
import { json, kvGet, kvPut } from '../shared/helpers';

export async function handlePredictionSubmit(request: Request, env: Env): Promise<Response> {
  try {
    const body = await request.json() as PredictionPayload;
    const { gameId, sport, predictedWinner, confidence, spread, overUnder } = body;

    if (!gameId || !sport || !predictedWinner) {
      return json({ error: 'Missing required fields: gameId, sport, predictedWinner' }, 400);
    }

    await env.DB
      .prepare(
        `INSERT INTO predictions (game_id, sport, predicted_winner, confidence, spread, over_under, created_at)
         VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`
      )
      .bind(gameId, sport, predictedWinner, confidence || 0, spread || null, overUnder || null)
      .run();

    return json({ success: true, gameId });
  } catch {
    return json({ error: 'Failed to record prediction' }, 500);
  }
}


export async function handlePredictionAccuracy(env: Env): Promise<Response> {
  const cacheKey = 'predictions:accuracy';
  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) {
    return cachedJson(cached, 200, 300, { 'X-Cache': 'HIT' });
  }

  try {
    const result = await env.DB
      .prepare(
        `SELECT
           p.sport,
           COUNT(*) as total,
           SUM(CASE WHEN p.predicted_winner = o.actual_winner THEN 1 ELSE 0 END) as correct
         FROM predictions p
         INNER JOIN outcomes o ON p.game_id = o.game_id
         GROUP BY p.sport`
      )
      .all();

    const bySport: Record<string, { total: number; correct: number; accuracy: number }> = {};
    let totalAll = 0;
    let correctAll = 0;

    for (const row of result.results || []) {
      const r = row as { sport: string; total: number; correct: number };
      bySport[r.sport] = {
        total: r.total,
        correct: r.correct,
        accuracy: r.total > 0 ? r.correct / r.total : 0,
      };
      totalAll += r.total;
      correctAll += r.correct;
    }

    const payload = {
      overall: {
        total: totalAll,
        correct: correctAll,
        accuracy: totalAll > 0 ? correctAll / totalAll : 0,
      },
      bySport,
      lastUpdated: new Date().toISOString(),
    };

    await kvPut(env.KV, cacheKey, payload, 300);
    return cachedJson(payload, 200, 300, { 'X-Cache': 'MISS' });
  } catch (err) {
    console.error('[predictions] D1 query failed:', err instanceof Error ? err.message : err);
    return json({
      overall: { total: 0, correct: 0, accuracy: 0 },
      bySport: {},
      note: 'Predictions data temporarily unavailable',
    }, 503);
  }
}
