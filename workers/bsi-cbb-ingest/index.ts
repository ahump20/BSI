/**
 * BSI College Baseball Ingest — Cron Worker
 *
 * Pre-caches scores, standings, and rankings in the same KV namespace
 * the main worker reads from. This ensures users always hit warm cache
 * instead of triggering live API calls.
 *
 * Cron triggers:
 *   - Every 2 min: Scores (only during baseball season Feb–Jun)
 *   - Every 15 min: Standings, Rankings, Trending
 *
 * Data source priority: Highlightly Pro → ESPN/NCAA fallback
 *
 * Deploy: wrangler deploy --config workers/bsi-cbb-ingest/wrangler.toml
 */

import {
  HighlightlyApiClient,
  createHighlightlyClient,
} from '../../lib/api-clients/highlightly-api';
import type {
  HighlightlyMatch,
} from '../../lib/api-clients/highlightly-api';
import { createNcaaClient } from '../../lib/api-clients/ncaa-api';

interface Env {
  KV: KVNamespace;
  RAPIDAPI_KEY?: string;
}

// KV TTLs match the main worker's CACHE_TTL constants
const TTL = {
  scores: 60,        // 1 min
  standings: 1800,   // 30 min
  rankings: 1800,    // 30 min
  trending: 300,     // 5 min
};

// Major conferences to pre-cache standings for
const CONFERENCES = ['NCAA', 'SEC', 'ACC', 'Big 12', 'Big Ten', 'Pac-12'];

/** Is it baseball season? Feb 14 – Jun 30 */
function isBaseBallSeason(): boolean {
  const now = new Date();
  const month = now.getMonth(); // 0-indexed
  return month >= 1 && month <= 5; // Feb (1) through Jun (5)
}

/** Is this a 15-minute cron tick? (vs a 2-minute tick) */
function is15MinTick(cron: string): boolean {
  return cron === '*/15 * * * *';
}

async function kvPut(kv: KVNamespace, key: string, data: unknown, ttl: number): Promise<void> {
  await kv.put(key, JSON.stringify(data), { expirationTtl: ttl });
}

// ---------------------------------------------------------------------------
// Ingest functions
// ---------------------------------------------------------------------------

async function ingestScores(env: Env): Promise<{ ok: boolean; count: number }> {
  const today = new Date().toISOString().split('T')[0];
  const cacheKeyToday = 'cb:scores:today';
  const cacheKeyDate = `cb:scores:${today}`;

  // Try Highlightly first
  if (env.RAPIDAPI_KEY) {
    try {
      const client = createHighlightlyClient(env.RAPIDAPI_KEY);
      const result = await client.getMatches('NCAA', today);
      if (result.success && result.data) {
        await Promise.all([
          kvPut(env.KV, cacheKeyToday, result.data, TTL.scores),
          kvPut(env.KV, cacheKeyDate, result.data, TTL.scores),
        ]);
        return { ok: true, count: result.data.data?.length ?? 0 };
      }
    } catch {
      // Fall through
    }
  }

  // ESPN fallback
  try {
    const client = createNcaaClient();
    const result = await client.getMatches('NCAA', today);
    if (result.success && result.data) {
      await Promise.all([
        kvPut(env.KV, cacheKeyToday, result.data, TTL.scores),
        kvPut(env.KV, cacheKeyDate, result.data, TTL.scores),
      ]);
      return { ok: true, count: result.data.data?.length ?? 0 };
    }
  } catch {
    // Both failed
  }

  return { ok: false, count: 0 };
}

async function ingestStandings(env: Env): Promise<{ ok: boolean; conferences: number }> {
  let successCount = 0;

  for (const conf of CONFERENCES) {
    const cacheKey = `cb:standings:${conf}`;

    // Try Highlightly first
    if (env.RAPIDAPI_KEY) {
      try {
        const client = createHighlightlyClient(env.RAPIDAPI_KEY);
        const result = await client.getStandings(conf);
        if (result.success && result.data) {
          await kvPut(env.KV, cacheKey, result.data, TTL.standings);
          successCount++;
          continue;
        }
      } catch {
        // Fall through
      }
    }

    // ESPN fallback
    try {
      const client = createNcaaClient();
      const result = await client.getStandings(conf);
      if (result.success && result.data) {
        await kvPut(env.KV, cacheKey, result.data, TTL.standings);
        successCount++;
      }
    } catch {
      // Skip this conference
    }
  }

  return { ok: successCount > 0, conferences: successCount };
}

async function ingestRankings(env: Env): Promise<{ ok: boolean }> {
  const cacheKey = 'cb:rankings';

  // Try Highlightly first
  if (env.RAPIDAPI_KEY) {
    try {
      const client = createHighlightlyClient(env.RAPIDAPI_KEY);
      const result = await client.getRankings();
      if (result.success && result.data) {
        await kvPut(env.KV, cacheKey, result.data, TTL.rankings);
        return { ok: true };
      }
    } catch {
      // Fall through
    }
  }

  // ESPN fallback
  try {
    const client = createNcaaClient();
    const result = await client.getRankings();
    if (result.success && result.data) {
      await kvPut(env.KV, cacheKey, result.data, TTL.rankings);
      return { ok: true };
    }
  } catch {
    // Both failed
  }

  return { ok: false };
}

async function ingestTrending(env: Env): Promise<{ ok: boolean; topGames: number }> {
  const cacheKey = 'cb:trending';

  // Use today's scores to compute trending
  const scoresRaw = await env.KV.get('cb:scores:today', 'text');
  if (!scoresRaw) return { ok: false, topGames: 0 };

  try {
    const scores = JSON.parse(scoresRaw) as { data?: Record<string, unknown>[] };
    const games = scores.data || [];

    const finishedGames = games
      .filter((g) => {
        const status = g.status as Record<string, unknown> | undefined;
        const type = (status?.type as string) || '';
        return type === 'finished' || type === 'post';
      })
      .sort((a, b) => {
        const marginA = Math.abs(Number(a.homeScore ?? 0) - Number(a.awayScore ?? 0));
        const marginB = Math.abs(Number(b.homeScore ?? 0) - Number(b.awayScore ?? 0));
        return marginA - marginB;
      });

    const topGames = finishedGames.slice(0, 5).map((g) => ({
      id: g.id,
      homeTeam: (g.homeTeam as Record<string, unknown>)?.name,
      awayTeam: (g.awayTeam as Record<string, unknown>)?.name,
      homeScore: g.homeScore,
      awayScore: g.awayScore,
      margin: Math.abs(Number(g.homeScore ?? 0) - Number(g.awayScore ?? 0)),
    }));

    const payload = { trendingPlayers: [], topGames };
    await kvPut(env.KV, cacheKey, payload, TTL.trending);
    return { ok: true, topGames: topGames.length };
  } catch {
    return { ok: false, topGames: 0 };
  }
}

// ---------------------------------------------------------------------------
// Entry points
// ---------------------------------------------------------------------------

export default {
  async scheduled(event: ScheduledEvent, env: Env, _ctx: ExecutionContext): Promise<void> {
    const cronStr = event.cron;
    const inSeason = isBaseBallSeason();

    // Scores: every 2 min during season, skip off-season for the 2-min trigger
    if (!is15MinTick(cronStr)) {
      if (inSeason) {
        await ingestScores(env);
      }
      // Off-season 2-min ticks do nothing — standings/rankings only run at 15-min
      return;
    }

    // 15-minute tick: standings, rankings, trending (and scores if in season)
    const results = await Promise.allSettled([
      inSeason ? ingestScores(env) : Promise.resolve({ ok: true, count: 0 }),
      ingestStandings(env),
      ingestRankings(env),
      ingestTrending(env),
    ]);

    // Store ingest status for monitoring
    const status = {
      timestamp: new Date().toISOString(),
      inSeason,
      scores: results[0].status === 'fulfilled' ? results[0].value : { ok: false },
      standings: results[1].status === 'fulfilled' ? results[1].value : { ok: false },
      rankings: results[2].status === 'fulfilled' ? results[2].value : { ok: false },
      trending: results[3].status === 'fulfilled' ? results[3].value : { ok: false },
    };

    await env.KV.put('cbb-ingest:status', JSON.stringify(status), { expirationTtl: 3600 });
  },

  /** Manual trigger + status endpoint */
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/status') {
      const raw = await env.KV.get('cbb-ingest:status', 'text');
      if (!raw) {
        return new Response(JSON.stringify({ error: 'No ingest data yet' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return new Response(raw, {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Trigger full ingest manually
    await this.scheduled(
      { cron: '*/15 * * * *' } as ScheduledEvent,
      env,
      { waitUntil: () => {}, passThroughOnException: () => {} } as unknown as ExecutionContext,
    );

    const status = await env.KV.get('cbb-ingest:status', 'text');
    return new Response(status || JSON.stringify({ ok: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  },
};
