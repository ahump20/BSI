/**
 * Prediction handlers — submit and accuracy endpoints.
 */

import type { Env, PredictionPayload } from '../shared/types';
import { cachedJson, json, kvGet, kvPut, logError } from '../shared/helpers';

const VALID_SPORTS = new Set([
  'college-baseball', 'mlb', 'nfl', 'nba', 'cfb', 'cbb',
]);

const MAX_STRING_LENGTH = 200;
const SAFE_ID_PATTERN = /^[a-zA-Z0-9_-]+$/;

function validatePrediction(body: unknown): { valid: true; data: PredictionPayload } | { valid: false; error: string } {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Request body must be a JSON object' };
  }

  const b = body as Record<string, unknown>;
  const { gameId, sport, predictedWinner, confidence, spread, overUnder } = b;

  if (typeof gameId !== 'string' || gameId.length === 0 || gameId.length > MAX_STRING_LENGTH || !SAFE_ID_PATTERN.test(gameId)) {
    return { valid: false, error: 'gameId must be a non-empty alphanumeric string (max 200 chars, hyphens/underscores allowed)' };
  }
  if (typeof sport !== 'string' || !VALID_SPORTS.has(sport)) {
    return { valid: false, error: `sport must be one of: ${[...VALID_SPORTS].join(', ')}` };
  }
  if (typeof predictedWinner !== 'string' || predictedWinner.length === 0 || predictedWinner.length > MAX_STRING_LENGTH || !/^[a-zA-Z0-9 .&'()-]+$/.test(predictedWinner)) {
    return { valid: false, error: 'predictedWinner must be a non-empty string with only letters, numbers, spaces, periods, ampersands, apostrophes, hyphens, and parentheses (max 200 chars)' };
  }
  if (confidence !== undefined && confidence !== null) {
    if (typeof confidence !== 'number' || confidence < 0 || confidence > 1 || !isFinite(confidence)) {
      return { valid: false, error: 'confidence must be a number between 0 and 1' };
    }
  }
  if (spread !== undefined && spread !== null) {
    if (typeof spread !== 'number' || !isFinite(spread)) {
      return { valid: false, error: 'spread must be a finite number' };
    }
  }
  if (overUnder !== undefined && overUnder !== null) {
    if (typeof overUnder !== 'number' || !isFinite(overUnder) || overUnder < 0) {
      return { valid: false, error: 'overUnder must be a non-negative finite number' };
    }
  }

  return {
    valid: true,
    data: {
      gameId: gameId as string,
      sport: sport as string,
      predictedWinner: predictedWinner as string,
      confidence: (typeof confidence === 'number' ? confidence : 0),
      spread: typeof spread === 'number' ? spread : undefined,
      overUnder: typeof overUnder === 'number' ? overUnder : undefined,
    },
  };
}

export async function handlePredictionSubmit(request: Request, env: Env): Promise<Response> {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return json({ error: 'Invalid JSON body' }, 400);
    }

    const result = validatePrediction(body);
    if (!result.valid) {
      return json({ error: result.error }, 400);
    }

    const { gameId, sport, predictedWinner, confidence, spread, overUnder } = result.data;

    await env.DB
      .prepare(
        `INSERT INTO predictions (game_id, sport, predicted_winner, confidence, spread, over_under, created_at)
         VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`
      )
      .bind(gameId, sport, predictedWinner, confidence, spread ?? null, overUnder ?? null)
      .run();

    return json({ success: true, gameId });
  } catch (err) {
    await logError(env, err instanceof Error ? err.message : String(err), 'predictions:submit');
    return json({ error: 'Failed to record prediction' }, 500);
  }
}


export async function handlePredictionAccuracy(env: Env): Promise<Response> {
  try {
    const cacheKey = 'predictions:accuracy';
    const cached = await kvGet<unknown>(env.KV, cacheKey);
    if (cached) {
      return cachedJson(cached, 200, 300, { 'X-Cache': 'HIT' });
    }
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
    await logError(env, err instanceof Error ? err.message : String(err), 'predictions:accuracy');
    return json({
      overall: { total: 0, correct: 0, accuracy: 0 },
      bySport: {},
      note: 'Predictions data temporarily unavailable',
    }, 503);
  }
}
