import type { Env } from '../shared/types';
import { json, cachedJson, kvGet, kvPut, cvApiResponse } from '../shared/helpers';

export async function handleCVPitcherMechanics(playerId: string, env: Env): Promise<Response> {
  const cacheKey = `cv:pitcher:${playerId}:latest`;
  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) {
    return cachedJson(cvApiResponse(cached, 'cv-cache', true), 200, 300, { 'X-Cache': 'HIT' });
  }

  try {
    const result = await env.DB.prepare(
      `SELECT * FROM pitcher_biomechanics WHERE player_id = ? ORDER BY game_date DESC LIMIT 1`
    ).bind(playerId).first();

    if (!result) {
      return json(cvApiResponse(null, 'cv-d1', false), 404);
    }

    await kvPut(env.KV, cacheKey, result, 300);
    return cachedJson(cvApiResponse(result, 'cv-d1', false), 200, 300, { 'X-Cache': 'MISS' });
  } catch (err) {
    const msg = err instanceof Error ? err.message : '';
    if (msg.includes('no such table')) return json({ error: 'CV data not yet available', detail: 'Table not initialized' }, 404);
    return json({ error: 'Failed to fetch pitcher mechanics' }, 500);
  }
}

export async function handleCVPitcherHistory(playerId: string, url: URL, env: Env): Promise<Response> {
  const range = url.searchParams.get('range') || '30d';
  const days = parseInt(range.replace('d', ''), 10) || 30;
  const cacheKey = `cv:pitcher:${playerId}:history:${days}d`;
  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) {
    return cachedJson(cvApiResponse(cached, 'cv-cache', true), 200, 3600, { 'X-Cache': 'HIT' });
  }

  try {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const cutoffStr = cutoff.toISOString().split('T')[0];

    const { results } = await env.DB.prepare(
      `SELECT * FROM pitcher_biomechanics WHERE player_id = ? AND game_date >= ? ORDER BY game_date ASC`
    ).bind(playerId, cutoffStr).all();

    await kvPut(env.KV, cacheKey, results, 3600);
    return cachedJson(cvApiResponse(results, 'cv-d1', false), 200, 3600, { 'X-Cache': 'MISS' });
  } catch (err) {
    const msg = err instanceof Error ? err.message : '';
    if (msg.includes('no such table')) return json({ error: 'CV data not yet available', detail: 'Table not initialized' }, 404);
    return json({ error: 'Failed to fetch pitcher history' }, 500);
  }
}

export async function handleCVInjuryAlerts(url: URL, env: Env): Promise<Response> {
  const sport = url.searchParams.get('sport') || 'mlb';
  const threshold = parseInt(url.searchParams.get('threshold') || '70', 10);
  const clampedThreshold = Math.max(0, Math.min(100, threshold));

  try {
    const league = sport === 'college-baseball' ? 'college-baseball' : 'mlb';
    const { results } = await env.DB.prepare(
      `SELECT * FROM pitcher_biomechanics WHERE league = ? AND fatigue_score >= ? ORDER BY fatigue_score DESC LIMIT 25`
    ).bind(league, clampedThreshold).all();

    return cachedJson(cvApiResponse(results, 'cv-d1', false), 200, 60);
  } catch (err) {
    const msg = err instanceof Error ? err.message : '';
    if (msg.includes('no such table')) return json({ error: 'CV data not yet available', detail: 'Table not initialized' }, 404);
    return json({ error: 'Failed to fetch injury alerts' }, 500);
  }
}

export async function handleCVAdoption(url: URL, env: Env): Promise<Response> {
  const sport = url.searchParams.get('sport');
  const cacheKey = `cv:adoption:${sport || 'all'}`;
  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) {
    return cachedJson(cvApiResponse(cached, 'cv-cache', true), 200, 86400, { 'X-Cache': 'HIT' });
  }

  try {
    const query = sport
      ? `SELECT * FROM cv_adoption_tracker WHERE sport = ? ORDER BY verified_date DESC`
      : `SELECT * FROM cv_adoption_tracker ORDER BY sport, verified_date DESC`;
    const stmt = sport ? env.DB.prepare(query).bind(sport) : env.DB.prepare(query);
    const { results } = await stmt.all();

    await kvPut(env.KV, cacheKey, results, 86400);
    return cachedJson(cvApiResponse(results, 'cv-d1', false), 200, 86400, { 'X-Cache': 'MISS' });
  } catch (err) {
    const msg = err instanceof Error ? err.message : '';
    if (msg.includes('no such table')) return json({ error: 'CV data not yet available', detail: 'Table not initialized' }, 404);
    return json({ error: 'Failed to fetch CV adoption data' }, 500);
  }
}
