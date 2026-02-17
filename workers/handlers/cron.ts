/**
 * Cron Handler — Pre-warms KV cache for scores and rankings.
 *
 * Runs on a schedule defined in wrangler.toml. Fetches scores for all
 * in-season sports and writes to KV so client requests never hit upstream
 * APIs directly — they read from KV in sub-10ms.
 *
 * Also caches college baseball rankings daily.
 */

import type { Env } from '../shared/types';
import { kvGet, kvPut, getSDIOClient, getCollegeClient, getHighlightlyClient, logError } from '../shared/helpers';
import { CACHE_TTL } from '../shared/constants';
import { getSeasonPhase, type SportKey } from '../../lib/season';
import {
  getScoreboard,
  transformScoreboard,
} from '../../lib/api-clients/espn-api';
import {
  transformSDIOMLBScores,
  transformSDIONFLScores,
  transformSDIONBAScores,
} from '../../lib/api-clients/sportsdataio-api';

/** KV key pattern for cached scores: `scores:cached:{sport}:{date}` */
function scoresCacheKey(sport: string, date: string): string {
  return `scores:cached:${sport}:${date}`;
}

/** Today's date in YYYY-MM-DD format (America/Chicago). */
function todayCST(): string {
  return new Date().toLocaleString('en-CA', { timeZone: 'America/Chicago' }).split(',')[0];
}

/** Today's date in YYYYMMDD format for ESPN API. */
function todayESPN(): string {
  return todayCST().replace(/-/g, '');
}

type SportScoreFetcher = (env: Env) => Promise<unknown>;

/**
 * Fetch and cache scores for a single sport.
 * Returns true if data was written, false if skipped or failed.
 */
async function cacheScoresForSport(
  sport: string,
  fetcher: SportScoreFetcher,
  env: Env,
  date: string,
): Promise<boolean> {
  const key = scoresCacheKey(sport, date);

  try {
    const data = await fetcher(env);

    // Never overwrite with empty data
    if (!data || (Array.isArray(data) && data.length === 0)) {
      return false;
    }

    const payload = {
      data,
      meta: {
        source: 'cron-cache',
        cachedAt: new Date().toISOString(),
        sport,
        date,
      },
    };

    // Cache for 2 minutes — cron runs every 30s-60s so this is always fresh
    await kvPut(env.KV, key, payload, 120);
    return true;
  } catch (err) {
    await logError(env, `cron:${sport}: ${err instanceof Error ? err.message : 'unknown'}`, 'cron-scores');
    return false;
  }
}

/** Fetch MLB scores via SportsDataIO with ESPN fallback. */
async function fetchMLBScores(env: Env): Promise<unknown> {
  const sdio = getSDIOClient(env);
  if (sdio) {
    try {
      return transformSDIOMLBScores(await sdio.getMLBScores());
    } catch {
      // Fall through to ESPN
    }
  }
  const raw = await getScoreboard('mlb', todayESPN());
  return transformScoreboard(raw as Record<string, unknown>);
}

/** Fetch NFL scores via SportsDataIO with ESPN fallback. */
async function fetchNFLScores(env: Env): Promise<unknown> {
  const sdio = getSDIOClient(env);
  if (sdio) {
    try {
      return transformSDIONFLScores(await sdio.getNFLScoresByDate());
    } catch {
      // Fall through to ESPN
    }
  }
  const raw = await getScoreboard('nfl', todayESPN());
  return transformScoreboard(raw as Record<string, unknown>);
}

/** Fetch NBA scores via SportsDataIO with ESPN fallback. */
async function fetchNBAScores(env: Env): Promise<unknown> {
  const sdio = getSDIOClient(env);
  if (sdio) {
    try {
      return transformSDIONBAScores(await sdio.getNBAScores());
    } catch {
      // Fall through to ESPN
    }
  }
  const raw = await getScoreboard('nba', todayESPN());
  return transformScoreboard(raw as Record<string, unknown>);
}

/** Fetch college baseball scores via ESPN. */
async function fetchCollegeBaseballScores(env: Env): Promise<unknown> {
  const raw = await getScoreboard('college-baseball', todayESPN());
  return transformScoreboard(raw as Record<string, unknown>);
}

const SPORT_FETCHERS: Record<string, SportScoreFetcher> = {
  mlb: fetchMLBScores,
  nfl: fetchNFLScores,
  nba: fetchNBAScores,
  ncaa: fetchCollegeBaseballScores,
};

/** Which sports to cache — only those currently in-season. */
function getActiveSportKeys(): string[] {
  const now = new Date();
  const sports: SportKey[] = ['mlb', 'nfl', 'nba', 'ncaa'];
  return sports.filter((s) => getSeasonPhase(s, now).phase !== 'offseason');
}

/**
 * Cache college baseball rankings in KV.
 * Uses the same fallback chain as the rankings handler: Highlightly → ESPN → NCAA.
 */
async function cacheRankings(env: Env): Promise<boolean> {
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
            meta: { dataSource: 'highlightly', lastUpdated: result.timestamp, sport: 'college-baseball' },
          };
          await kvPut(env.KV, key, payload, 86400); // 24 hours
          // Also write to the handler's cache key so the handler reads it
          await kvPut(env.KV, 'cb:rankings:v2', payload, CACHE_TTL.rankings);
          return true;
        }
      } catch {
        // Fall through
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
      const rankings = (raw.rankings as unknown[]) || [];
      if (rankings.length > 0) {
        const payload = {
          rankings,
          timestamp: now,
          meta: { dataSource: 'espn', lastUpdated: now, sport: 'college-baseball' },
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
        meta: { dataSource: 'ncaa', lastUpdated: result.timestamp, sport: 'college-baseball' },
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

/**
 * Main cron entry point. Called by the Workers runtime on schedule.
 */
export async function handleScheduled(env: Env): Promise<void> {
  const date = todayCST();
  const activeSports = getActiveSportKeys();

  console.log(`[cron] Warming cache for ${activeSports.length} active sports: ${activeSports.join(', ')}`);

  // Cache scores for all active sports in parallel
  const scoreResults = await Promise.allSettled(
    activeSports.map((sport) => {
      const fetcher = SPORT_FETCHERS[sport];
      if (!fetcher) return Promise.resolve(false);
      return cacheScoresForSport(sport, fetcher, env, date);
    })
  );

  const scoreSuccesses = scoreResults.filter(
    (r) => r.status === 'fulfilled' && r.value
  ).length;

  // Cache rankings (college baseball only, once per cron cycle)
  const ncaaActive = activeSports.includes('ncaa');
  let rankingsCached = false;
  if (ncaaActive) {
    rankingsCached = await cacheRankings(env);
  }

  console.log(`[cron] Done: ${scoreSuccesses}/${activeSports.length} scores cached, rankings=${rankingsCached}`);
}

/**
 * Read cached scores from KV. Returns the pre-warmed payload or null.
 */
export async function handleCachedScores(sport: string, env: Env): Promise<Response> {
  const date = todayCST();
  const key = scoresCacheKey(sport, date);
  const cached = await kvGet<{ data: unknown; meta: unknown }>(env.KV, key);

  if (cached) {
    return new Response(JSON.stringify(cached), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=15',
        'X-Cache': 'HIT',
        'X-Source': 'cron-cache',
      },
    });
  }

  // No cached data — return 204 so client knows to fall back to live endpoint
  return new Response(null, { status: 204 });
}
