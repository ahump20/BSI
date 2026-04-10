/**
 * Cron Handler — Pre-warms KV cache for scores and rankings.
 *
 * Runs on a schedule defined in wrangler.toml. Fetches scores for all
 * in-season sports and writes to KV so client requests never hit upstream
 * APIs directly — they read from KV in sub-10ms.
 *
 * Also orchestrates daily jobs: rankings, search index, HAVF, and MMI.
 */

import type { Env } from '../../shared/types';
import { kvGet, kvPut, getSDIOClient, logError } from '../../shared/helpers';
import { getSeasonPhase, type SportKey } from '../../../lib/season';
import { teamMetadata } from '../../../lib/data/team-metadata';
import {
  getScoreboard,
  transformScoreboard,
} from '../../../lib/api-clients/espn-api';
import { processFinishedGames } from '../college-baseball';
import {
  transformSDIOMLBScores,
  transformSDIONFLScores,
  transformSDIONBAScores,
} from '../../../lib/api-clients/sportsdataio-api';

// Sub-module imports
import { cacheRankings } from './rankings';
import { populateSearchIndex } from './search-index';
import { computeHAVFDaily } from './havf';
import { computeAndStoreMMI, computeMMIForNewGames } from './mmi';

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
    } catch (err) {
      console.warn(`[cron] SDIO MLB failed, falling back to ESPN: ${err instanceof Error ? err.message : 'unknown'}`);
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
    } catch (err) {
      console.warn(`[cron] SDIO NFL failed, falling back to ESPN: ${err instanceof Error ? err.message : 'unknown'}`);
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
    } catch (err) {
      console.warn(`[cron] SDIO NBA failed, falling back to ESPN: ${err instanceof Error ? err.message : 'unknown'}`);
    }
  }
  const raw = await getScoreboard('nba', todayESPN());
  return transformScoreboard(raw as Record<string, unknown>);
}

/** Fetch college baseball scores via ESPN. */
async function fetchCollegeBaseballScores(_env: Env): Promise<unknown> {
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
 * Main cron entry point. Called by the Workers runtime on schedule.
 */
export async function handleScheduled(env: Env): Promise<void> {
  const date = todayCST();
  const activeSports = getActiveSportKeys();

  console.info(`[cron] Warming cache for ${activeSports.length} active sports: ${activeSports.join(', ')}`);

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

  console.info(`[cron] Done: ${scoreSuccesses}/${activeSports.length} scores cached, rankings=${rankingsCached}`);

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
        console.info(`[cron] Stats ingested: ${ingestResult.processed} games, ${ingestResult.skipped} skipped, ${ingestResult.errors.length} errors`);

        // Invalidate caches so next request picks up fresh data + sabermetrics derivation
        if (ingestResult.processed > 0) {
          await env.KV.delete('cb:leaders');
          await env.KV.delete('cb:saber:league:2026');

          // Invalidate team-level KV caches for affected teams
          if (ingestResult.affectedTeamIds?.length) {
            const espnToSlug = new Map<string, string>();
            for (const [slug, meta] of Object.entries(teamMetadata)) {
              if (meta.espnId) espnToSlug.set(String(meta.espnId), slug);
            }
            const toDelete = ingestResult.affectedTeamIds
              .map(id => ({ espnId: id, slug: espnToSlug.get(id) }))
              .filter((e): e is { espnId: string; slug: string } => !!e.slug);
            const unmapped = ingestResult.affectedTeamIds.filter(id => !espnToSlug.has(id));

            const deleteResults = await Promise.allSettled(
              toDelete.map(async ({ slug }) => {
                await env.KV.delete(`cb:team:${slug}`);
                return slug;
              })
            );
            const invalidated = deleteResults
              .filter((r): r is PromiseFulfilledResult<string> => r.status === 'fulfilled')
              .map(r => r.value);
            const failedDeletes = deleteResults.filter(r => r.status === 'rejected').length;

            if (invalidated.length > 0) {
              console.info(`[cron] Invalidated team caches: ${invalidated.join(', ')}`);
            }
            if (failedDeletes > 0) {
              console.warn(`[cron] Failed to invalidate ${failedDeletes} team cache(s)`);
            }
            if (unmapped.length > 0) {
              console.warn(`[cron] Unmapped espnIds (no teamMetadata): ${unmapped.join(', ')}`);
            }
          }

          console.info('[cron] Invalidated leaders + sabermetrics caches after ingest');
        }
      }
    } catch (err) {
      await logError(env, `cron:stats-ingest: ${err instanceof Error ? err.message : 'unknown'}`, 'cron-ingest');
    }
  }

  // Compute MMI momentum snapshots for newly finished games
  if (ncaaActive) {
    try {
      const mmiComputed = await computeMMIForNewGames(env, date);
      if (mmiComputed > 0) {
        console.info(`[cron] MMI computed for ${mmiComputed} game(s)`);
      }
    } catch (err) {
      await logError(env, `cron:mmi: ${err instanceof Error ? err.message : 'unknown'}`, 'cron-mmi');
    }
  }

  // NOTE: The full backfill sync (syncTeamCumulativeStats) iterates scoreboards
  // day-by-day — too expensive for recurring cron. Use the admin endpoint
  // /api/college-baseball/sync-stats?team=<id>&key=<admin_key> for backfills.
  // Daily processFinishedGames above now captures OBP/SLG from box scores,
  // enabling sabermetric derivation of 2B/3B/HBP in downstream handlers.

  // Compute HAV-F scores daily (gated by KV timestamp)
  if (ncaaActive) {
    try {
      const havfGateKey = 'cron:havf:last-computed';
      const lastComputed = await kvGet<string>(env.KV, havfGateKey);
      if (!lastComputed || lastComputed.slice(0, 10) !== date) {
        await computeHAVFDaily(env);
        await kvPut(env.KV, havfGateKey, now, 86400);
        console.info('[cron] HAV-F scores computed');
      }
    } catch (err) {
      await logError(env, `cron:havf: ${err instanceof Error ? err.message : 'unknown'}`, 'cron-havf');
    }
  }

  // Populate search index once per day (gated by KV timestamp)
  try {
    const searchGateKey = `search:index:last-populated`;
    const lastPopulated = await kvGet<string>(env.KV, searchGateKey);
    if (!lastPopulated || lastPopulated.slice(0, 10) !== date) {
      await populateSearchIndex(env);
      await kvPut(env.KV, searchGateKey, now, 86400);
      console.info('[cron] Search index populated');
    }
  } catch (err) {
    await logError(env, `cron:search-index: ${err instanceof Error ? err.message : 'unknown'}`, 'cron-search');
  }

  // Compute MMI for finished college baseball games (gated: max once per hour)
  if (ncaaActive) {
    try {
      const mmiGateKey = 'mmi:last-compute';
      const lastMMI = await kvGet<string>(env.KV, mmiGateKey);
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      if (!lastMMI || lastMMI < oneHourAgo) {
        const mmiResult = await computeAndStoreMMI(env);
        await kvPut(env.KV, mmiGateKey, now, 3600);
        if (mmiResult.processed > 0) {
          // Clear trending cache so next request picks up new data
          await env.KV.delete('mmi:trending');
          console.info(`[cron] MMI computed: ${mmiResult.processed} games`);
        }
        if (mmiResult.errors.length > 0) {
          console.warn(`[cron] MMI errors: ${mmiResult.errors.join('; ')}`);
        }
      }
    } catch (err) {
      await logError(env, `cron:mmi: ${err instanceof Error ? err.message : 'unknown'}`, 'cron-mmi');
    }
  }

  // Self-healing monitor: check D1 sabermetric tables for staleness.
  // Runs every 5 minutes (gated). Writes status to KV for the freshness
  // dashboard. When tables go stale, logs a healing alert.
  try {
    const healGateKey = 'healing:last-check';
    const lastHealCheck = await kvGet<string>(env.KV, healGateKey);
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    if (!lastHealCheck || lastHealCheck < fiveMinAgo) {
      const tables = [
        { name: 'cbb_batting_advanced', threshold: 7 },   // 6h cron + 1h buffer
        { name: 'cbb_pitching_advanced', threshold: 7 },
        { name: 'cbb_conference_strength', threshold: 25 }, // daily cron + 1h buffer
        { name: 'cbb_park_factors', threshold: 170 },       // weekly (Sunday)
      ];

      const staleAlerts: string[] = [];
      for (const t of tables) {
        try {
          const row = await env.DB.prepare(
            `SELECT MAX(computed_at) as latest FROM ${t.name}`
          ).first<{ latest: string | null }>();

          if (row?.latest) {
            const computed = new Date(row.latest).getTime();
            const hoursAgo = (Date.now() - computed) / (1000 * 60 * 60);
            if (hoursAgo > t.threshold) {
              staleAlerts.push(`${t.name}: ${Math.round(hoursAgo)}h stale (threshold: ${t.threshold}h)`);
            }
          }
        } catch {
          // Table may not exist yet — non-fatal
        }
      }

      const healStatus = {
        checkedAt: now,
        stale: staleAlerts,
        healthy: staleAlerts.length === 0,
      };

      await kvPut(env.KV, 'healing:d1:status', healStatus, 600); // 10-min TTL
      await kvPut(env.KV, healGateKey, now, 300); // 5-min gate

      if (staleAlerts.length > 0) {
        console.warn(`[cron:healing] Stale D1 tables detected: ${staleAlerts.join(', ')}`);
      }
    }
  } catch (err) {
    // Non-critical — don't break the cron for healing checks
    console.error('[cron:healing]', err instanceof Error ? err.message : err);
  }

  // Daily deep freshness audit (gated to once per day in CT).
  // Pings upstream APIs (Highlightly, ESPN, SportsDataIO), aggregates the
  // full freshness report, and writes it to KV so the dashboard, alerts,
  // and the daily Claude Code remote trigger can all read a consistent view.
  try {
    const auditGateKey = 'cron:freshness-audit:last';
    const lastAudit = await kvGet<string>(env.KV, auditGateKey);
    if (!lastAudit || lastAudit.slice(0, 10) !== date) {
      const { buildFreshnessReport } = await import('../freshness');
      const report = await buildFreshnessReport(env, /* deep */ true);

      // Persist the daily snapshot — 48h TTL gives us coverage if a day's gate fails.
      const snapshot = {
        ranAt: now,
        summary: report.summary,
        liveEndpoints: report.liveEndpoints,
        d1Tables: report.d1Tables,
        upstream: report.upstream,
        cronHealth: report.cronHealth,
      };
      await kvPut(env.KV, 'freshness:daily:latest', snapshot, 48 * 60 * 60);
      await kvPut(env.KV, auditGateKey, now, 36 * 60 * 60);

      // If anything is broken, drop a structured alert into KV for the
      // synthetic monitor to escalate via Resend. We only treat 'stale' and
      // 'missing' as alertable — 'degraded' and 'off-season' are noise.
      const broken: string[] = [];
      for (const e of report.liveEndpoints) {
        if (e.status === 'stale' || e.status === 'missing') {
          broken.push(`${e.name} (${e.sport}): ${e.status.toUpperCase()}`);
        }
      }
      for (const t of report.d1Tables) {
        if (t.status === 'stale' || t.status === 'missing') {
          broken.push(`D1 ${t.name}: ${t.status.toUpperCase()}`);
        }
      }
      for (const u of report.upstream || []) {
        if (u.status === 'down') {
          broken.push(`UPSTREAM ${u.provider}: DOWN${u.error ? ` (${u.error})` : ''}`);
        }
      }

      if (broken.length > 0) {
        await kvPut(env.KV, 'freshness:daily:alerts', {
          ranAt: now,
          count: broken.length,
          items: broken,
        }, 48 * 60 * 60);
        console.warn(`[cron:freshness-audit] ${broken.length} broken: ${broken.join(' | ')}`);
      } else {
        // Clear any prior alert key so the dashboard knows we're clean.
        await env.KV.delete('freshness:daily:alerts');
        console.info(`[cron:freshness-audit] All ${report.summary.total} sources clean`);
      }
    }
  } catch (err) {
    // Non-critical — daily audit failing should never break the minute cron.
    console.error('[cron:freshness-audit]', err instanceof Error ? err.message : err);
  }
}

/**
 * Read cached scores from KV. Returns the pre-warmed payload or null.
 */
export async function handleCachedScores(sport: string, env: Env): Promise<Response> {
  try {
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
  } catch (err) {
    console.error('[handleCachedScores]', err instanceof Error ? err.message : err);
    return new Response(JSON.stringify({ error: 'Internal server error', status: 500 }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

/**
 * Return provider health status from KV. Used by the dashboard health panel.
 */
export async function handleHealthProviders(env: Env): Promise<Response> {
  try {
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
  } catch (err) {
    console.error('[handleHealthProviders]', err instanceof Error ? err.message : err);
    return new Response(JSON.stringify({ error: 'Internal server error', status: 500 }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
