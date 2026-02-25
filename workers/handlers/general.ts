/**
 * General handlers — teams list, model health, analytics, weekly brief.
 */

import type { Env } from '../shared/types';
import { json, cachedJson, kvGet, kvPut } from '../shared/helpers';
import { HTTP_CACHE, CACHE_TTL } from '../shared/constants';
import { getTeams as espnGetTeams, transformTeams, type ESPNSport } from '../../lib/api-clients/espn-api';

// =============================================================================
// Analytics Engine helpers
// =============================================================================

export function emitOpsEvent(
  env: Env,
  event: string,
  blobs: string[] = [],
  doubles: number[] = [],
): void {
  if (!env.OPS_EVENTS) return;
  try {
    env.OPS_EVENTS.writeDataPoint({
      indexes: [event],
      blobs,
      doubles,
    });
  } catch {
    // Non-fatal — analytics should never break a request
  }
}

export async function handleTeams(league: string, env: Env): Promise<Response> {
  const key = league.toUpperCase();
  const sportMap: Record<string, ESPNSport> = { MLB: 'mlb', NFL: 'nfl', NBA: 'nba' };
  const sport = sportMap[key];

  if (!sport) return json([], 200);

  const cacheKey = `teams:list:${key}`;
  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) return json(cached, 200, { 'X-Cache': 'HIT' });

  try {
    const raw = await espnGetTeams(sport) as Record<string, unknown>;
    const { teams } = transformTeams(raw);
    const result = teams.map((t) => ({
      id: t.id,
      name: t.name,
      league: key,
      abbreviation: t.abbreviation,
      logos: t.logos,
      color: t.color,
    }));
    await kvPut(env.KV, cacheKey, result, CACHE_TTL.standings);
    return json(result, 200, { 'X-Cache': 'MISS' });
  } catch (err) {
    console.error('[teams] ESPN fetch failed:', err instanceof Error ? err.message : err);
    return json([], 200);
  }
}

export async function handleModelHealth(env: Env): Promise<Response> {
  const cacheKey = 'model-health:all';
  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) {
    return cachedJson(cached, 200, 600, { 'X-Cache': 'HIT' });
  }

  try {
    const result = await env.DB
      .prepare(
        `SELECT week, accuracy, sport, created_at as recordedAt
         FROM model_health
         ORDER BY created_at DESC
         LIMIT 12`
      )
      .all();

    const weeks = result.results || [];
    const payload = { weeks, lastUpdated: new Date().toISOString() };
    await kvPut(env.KV, cacheKey, payload, 600);
    return cachedJson(payload, 200, 600, { 'X-Cache': 'MISS' });
  } catch (err) {
    console.error('[model-health] D1 query failed:', err instanceof Error ? err.message : err);
    return json({
      weeks: [],
      lastUpdated: new Date().toISOString(),
      note: 'Model health data temporarily unavailable',
    }, 503);
  }
}

export async function handleAnalyticsEvent(request: Request, env: Env): Promise<Response> {
  try {
    const body = await request.json() as { event?: string; properties?: Record<string, unknown> };
    if (!body?.event) {
      return new Response(null, { status: 204 });
    }

    // Prefer Analytics Engine for structured, queryable event tracking
    if (env.OPS_EVENTS) {
      emitOpsEvent(env, body.event, [
        JSON.stringify(body.properties || {}).slice(0, 256),
      ]);
    } else {
      // Fallback to KV if Analytics Engine not bound
      const date = new Date().toISOString().slice(0, 10);
      const uid = Math.random().toString(36).slice(2, 10);
      await kvPut(env.KV, `analytics:${date}:${body.event}:${uid}`, body, 2592000);
    }
  } catch (err) {
    console.error('[analytics]', err instanceof Error ? err.message : err);
  }
  return new Response(null, { status: 204 });
}

export async function handleWeeklyBrief(env: Env): Promise<Response> {
  const cacheKey = 'intel:weekly-brief:latest';
  const brief = await kvGet<Record<string, unknown>>(env.KV, cacheKey);

  if (brief) {
    return cachedJson({
      brief,
      meta: { source: 'bsi-intel', fetched_at: new Date().toISOString(), timezone: 'America/Chicago' },
    }, 200, 300);
  }

  // No brief published — return framework structure
  return json({
    brief: null,
    status: 'not_published',
    message: 'Weekly brief not yet published for this week.',
    framework: {
      sections: ['Decision Register', 'Five Feeds', 'ICE Scoring', 'KPIs'],
      publishSchedule: 'Mondays during the college baseball season',
    },
    meta: { source: 'bsi-intel', fetched_at: new Date().toISOString(), timezone: 'America/Chicago' },
  });
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
