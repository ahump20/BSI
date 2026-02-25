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
import { teamMetadata } from '../../lib/data/team-metadata';
import {
  getScoreboard,
  transformScoreboard,
} from '../../lib/api-clients/espn-api';
import { processFinishedGames } from './college-baseball';
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

// ---------------------------------------------------------------------------
// Search Index Population
// ---------------------------------------------------------------------------

/** Static pages to index for search. */
const INDEXED_PAGES = [
  { name: 'MLB Baseball', url: '/mlb', sport: 'mlb' },
  { name: 'NFL Football', url: '/nfl', sport: 'nfl' },
  { name: 'NBA Basketball', url: '/nba', sport: 'nba' },
  { name: 'College Football', url: '/cfb', sport: 'cfb' },
  { name: 'College Baseball', url: '/college-baseball', sport: 'ncaa' },
  { name: 'Scores', url: '/scores', sport: '' },
  { name: 'Dashboard', url: '/dashboard', sport: '' },
  { name: 'Arcade Games', url: '/arcade', sport: '' },
  { name: 'Data Sources', url: '/data-sources', sport: '' },
  { name: 'Pricing', url: '/pricing', sport: '' },
  { name: 'About BSI', url: '/about', sport: '' },
  { name: 'College Baseball Rankings', url: '/college-baseball/rankings', sport: 'ncaa' },
  { name: 'College Baseball Standings', url: '/college-baseball/standings', sport: 'ncaa' },
  { name: 'College Baseball Scores', url: '/college-baseball/scores', sport: 'ncaa' },
  { name: 'Transfer Portal', url: '/college-baseball/transfer-portal', sport: 'ncaa' },
];

/**
 * Populate D1 FTS5 search index. Runs once per day.
 * Full rebuild: clears the FTS5 table and inserts all known entities.
 */
async function populateSearchIndex(env: Env): Promise<void> {
  if (!env.DB) return; // D1 not bound — skip silently

  // Clear existing FTS5 content for full rebuild
  await env.DB.prepare('DELETE FROM search_index').run();
  await env.DB.prepare('DELETE FROM search_index_meta').run();

  const rows: Array<{ name: string; type: string; sport: string; url: string }> = [];

  // College baseball teams from teamMetadata
  for (const [slug, meta] of Object.entries(teamMetadata)) {
    rows.push({
      name: `${meta.name} ${meta.abbreviation} ${meta.shortName}`,
      type: 'team',
      sport: 'College Baseball',
      url: `/college-baseball/teams/${slug}`,
    });
  }

  // Static pages
  for (const page of INDEXED_PAGES) {
    rows.push({ name: page.name, type: 'page', sport: page.sport, url: page.url });
  }

  // Articles from KV (if available)
  try {
    const newsCached = await kvGet<{ articles?: Array<{ id: string; title: string; url?: string }> }>(env.KV, 'cb:news');
    if (newsCached?.articles) {
      for (const article of newsCached.articles) {
        rows.push({
          name: article.title,
          type: 'article',
          sport: 'College Baseball',
          url: article.url || '/college-baseball/news',
        });
      }
    }
  } catch {
    // Non-fatal — articles are supplementary
  }

  // Batch insert in chunks of 50 (D1 batch limit considerations)
  const CHUNK_SIZE = 50;
  for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
    const chunk = rows.slice(i, i + CHUNK_SIZE);
    const stmts = chunk.map((row) =>
      env.DB.prepare('INSERT INTO search_index (name, type, sport, url) VALUES (?, ?, ?, ?)')
        .bind(row.name, row.type, row.sport, row.url)
    );
    await env.DB.batch(stmts);
  }

  // Write meta for tracking
  const metaStmts = rows.map((row) =>
    env.DB.prepare("INSERT OR REPLACE INTO search_index_meta (url, updated_at) VALUES (?, datetime('now'))")
      .bind(row.url)
  );
  for (let i = 0; i < metaStmts.length; i += CHUNK_SIZE) {
    await env.DB.batch(metaStmts.slice(i, i + CHUNK_SIZE));
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

  // Write provider health summary to KV for the dashboard health panel
  const now = new Date().toISOString();
  const providerHealth: Record<string, { status: 'ok' | 'degraded' | 'down'; lastSuccessAt?: string; lastCheckAt: string }> = {};

  for (let i = 0; i < activeSports.length; i++) {
    const sport = activeSports[i];
    const result = scoreResults[i];
    const succeeded = result.status === 'fulfilled' && result.value;
    providerHealth[sport] = {
      status: succeeded ? 'ok' : 'degraded',
      ...(succeeded ? { lastSuccessAt: now } : {}),
      lastCheckAt: now,
    };
  }

  if (ncaaActive) {
    providerHealth['rankings'] = {
      status: rankingsCached ? 'ok' : 'degraded',
      ...(rankingsCached ? { lastSuccessAt: now } : {}),
      lastCheckAt: now,
    };
  }

  await kvPut(env.KV, 'health:providers:latest', {
    providers: providerHealth,
    checkedAt: now,
    activeSports,
  }, 300); // 5-minute TTL

  // Ingest finished college baseball box scores every 10 minutes
  if (ncaaActive) {
    try {
      const ingestGateKey = 'cron:cbb:ingest:last';
      const lastIngest = await kvGet<string>(env.KV, ingestGateKey);
      const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
      if (!lastIngest || lastIngest < tenMinAgo) {
        const ingestResult = await processFinishedGames(env, date);
        await kvPut(env.KV, ingestGateKey, now, 900); // 15-min TTL
        console.log(`[cron] Stats ingested: ${ingestResult.processed} games, ${ingestResult.skipped} skipped, ${ingestResult.errors.length} errors`);

        // Invalidate caches so next request picks up fresh data + sabermetrics derivation
        if (ingestResult.processed > 0) {
          await env.KV.delete('cb:leaders');
          await env.KV.delete('cb:saber:league:2026');
          console.log('[cron] Invalidated leaders + sabermetrics caches after ingest');
        }
      }
    } catch (err) {
      await logError(env, `cron:stats-ingest: ${err instanceof Error ? err.message : 'unknown'}`, 'cron-ingest');
    }
  }

  // NOTE: The full backfill sync (syncTeamCumulativeStats) iterates scoreboards
  // day-by-day — too expensive for recurring cron. Use the admin endpoint
  // /api/college-baseball/sync-stats?team=<id>&key=<admin_key> for backfills.
  // Daily processFinishedGames above now captures OBP/SLG from box scores,
  // enabling sabermetric derivation of 2B/3B/HBP in downstream handlers.

  // Populate search index once per day (gated by KV timestamp)
  try {
    const searchGateKey = `search:index:last-populated`;
    const lastPopulated = await kvGet<string>(env.KV, searchGateKey);
    if (!lastPopulated || lastPopulated.slice(0, 10) !== date) {
      await populateSearchIndex(env);
      await kvPut(env.KV, searchGateKey, now, 86400);
      console.log('[cron] Search index populated');
    }
  } catch (err) {
    await logError(env, `cron:search-index: ${err instanceof Error ? err.message : 'unknown'}`, 'cron-search');
  }
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

/**
 * Return provider health status from KV. Used by the dashboard health panel.
 */
export async function handleHealthProviders(env: Env): Promise<Response> {
  const health = await kvGet<{
    providers: Record<string, { status: string; lastSuccessAt?: string; lastCheckAt: string }>;
    checkedAt: string;
    activeSports: string[];
  }>(env.KV, 'health:providers:latest');

  if (health) {
    return new Response(JSON.stringify(health), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=30',
      },
    });
  }

  return new Response(JSON.stringify({ providers: {}, checkedAt: null, activeSports: [] }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
