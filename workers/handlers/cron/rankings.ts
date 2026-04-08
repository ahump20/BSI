/**
 * Rankings Caching — caches college baseball rankings in KV.
 *
 * Uses the same fallback chain as the rankings handler:
 * Highlightly -> ESPN -> NCAA.
 */

import type { Env } from '../../shared/types';
import { kvPut, getHighlightlyClient, getCollegeClient, logError } from '../../shared/helpers';
import { CACHE_TTL } from '../../shared/constants';
import { flattenESPNPolls } from '../college-baseball/standings';

/**
 * Cache college baseball rankings in KV.
 * Uses the same fallback chain as the rankings handler: Highlightly -> ESPN -> NCAA.
 */
export async function cacheRankings(env: Env): Promise<boolean> {
  const key = 'cron:cbb:rankings:latest';
  const now = new Date().toISOString();

  try {
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
