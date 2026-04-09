/**
 * Rankings Caching — caches college baseball rankings in KV.
 *
 * Uses the same fallback chain as the rankings handler:
 * Highlightly -> ESPN -> NCAA.
 */

import type { Env } from '../../shared/types';
import { kvGet, kvPut, getHighlightlyClient, getCollegeClient, logError } from '../../shared/helpers';
import { CACHE_TTL } from '../../shared/constants';
import { flattenESPNPolls } from '../college-baseball/standings';

/**
 * Weekly rotation of the current rankings snapshot into the "previous" slot so
 * the rankings handler can return trend (week-over-week movement) data. Without
 * this, `cb:rankings:prev` stays empty forever and the rankings table renders
 * every team with a null trend (no up/down arrows), which looks like a bug to
 * visitors who expect poll movement indicators.
 *
 * Runs inside the cron path since the cron is what keeps the rankings cache warm.
 * Rotation only fires if 7+ days have passed since the last rotation — this gives
 * poll-style weekly movement rather than 6h movement.
 */
async function rotateWeeklyIfDue(env: Env): Promise<void> {
  const prevRotateKey = 'cb:rankings:prev:rotated_at';
  const prevKey = 'cb:rankings:prev';
  const currentKey = 'cb:rankings:v2';
  const weekSeconds = 7 * 24 * 60 * 60;

  const lastRotate = await env.KV.get(prevRotateKey);
  const lastRotateMs = lastRotate ? Date.parse(lastRotate) : 0;
  const weekAgoMs = Date.now() - weekSeconds * 1000;

  if (lastRotateMs >= weekAgoMs) return;

  const currentSnapshot = await kvGet<unknown>(env.KV, currentKey);
  if (!currentSnapshot) return;

  // Archive current → prev (14 day TTL so it survives missed cron windows)
  await kvPut(env.KV, prevKey, currentSnapshot, 14 * 24 * 60 * 60);
  await env.KV.put(prevRotateKey, new Date().toISOString(), { expirationTtl: 14 * 24 * 60 * 60 });
}

/**
 * Cache college baseball rankings in KV.
 * Uses the same fallback chain as the rankings handler: Highlightly -> ESPN -> NCAA.
 */
export async function cacheRankings(env: Env): Promise<boolean> {
  const key = 'cron:cbb:rankings:latest';
  const now = new Date().toISOString();

  try {
    // Archive last week's rankings into the prev slot before we overwrite current.
    // This is what lets the UI show week-over-week movement arrows.
    await rotateWeeklyIfDue(env);

    // Try Highlightly first
    const hlClient = getHighlightlyClient(env);
    if (hlClient) {
      try {
        const result = await hlClient.getRankings();
        if (result.success && result.data) {
          const payload = {
            rankings: result.data,
            meta: { source: 'highlightly', fetched_at: result.timestamp, timezone: 'America/Chicago', sport: 'college-baseball' },
          };
          await kvPut(env.KV, key, payload, 86400); // 24 hours
          // Also write to the handler's cache key so the handler reads it
          await kvPut(env.KV, 'cb:rankings:v2', payload, CACHE_TTL.rankings);
          return true;
        }
      } catch (err) {
        console.warn(`[cron] Highlightly rankings failed, falling back to ESPN: ${err instanceof Error ? err.message : 'unknown'}`);
      }
    }

    // ESPN fallback
    const espnUrl = 'https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball/rankings';
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(espnUrl, { signal: controller.signal });
    clearTimeout(timeout);

    if (res.ok) {
      const raw = (await res.json()) as Record<string, unknown>;
      const rawRankings = (raw.rankings as unknown[]) || [];
      if (rawRankings.length > 0) {
        const rankings = flattenESPNPolls(rawRankings);
        const payload = {
          rankings,
          timestamp: now,
          meta: { source: 'espn', fetched_at: now, timezone: 'America/Chicago', sport: 'college-baseball', degraded: true },
        };
        await kvPut(env.KV, key, payload, 86400);
        await kvPut(env.KV, 'cb:rankings:v2', payload, CACHE_TTL.rankings);
        return true;
      }
    }

    // NCAA client fallback
    const client = getCollegeClient();
    const result = await client.getRankings();
    if (result.success && Array.isArray(result.data) && result.data.length > 0) {
      const payload = {
        rankings: result.data,
        timestamp: result.timestamp,
        meta: { source: 'ncaa', fetched_at: result.timestamp, timezone: 'America/Chicago', sport: 'college-baseball' },
      };
      await kvPut(env.KV, key, payload, 86400);
      await kvPut(env.KV, 'cb:rankings:v2', payload, CACHE_TTL.rankings);
      return true;
    }

    return false;
  } catch (err) {
    await logError(env, `cron:rankings: ${err instanceof Error ? err.message : 'unknown'}`, 'cron-rankings');
    return false;
  }
}
