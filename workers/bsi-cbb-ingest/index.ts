/**
 * BSI College Baseball Ingest — Cron Worker
 *
 * Pre-caches scores, standings, and rankings into KV so the main worker
 * serves cached data instantly. Two cron frequencies:
 *   - Every 2 min:  scores (live games during season)
 *   - Every 15 min: standings + rankings
 *
 * Season awareness: Feb-Jun is baseball season (2-min scores).
 * Off-season reduces to daily score checks.
 *
 * Deploy: wrangler deploy --config workers/bsi-cbb-ingest/wrangler.toml
 */

interface Env {
  KV: KVNamespace;
  RAPIDAPI_KEY?: string;
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const ESPN_BASE = 'https://site.api.espn.com';
const SPORT_PATH = 'baseball/college-baseball';
const HIGHLIGHTLY_HOST = 'mlb-college-baseball-api.p.rapidapi.com';
const HIGHLIGHTLY_BASE = `https://${HIGHLIGHTLY_HOST}`;
const TIMEOUT_MS = 12_000;

const CONFERENCES = ['SEC', 'ACC', 'Big 12', 'Big Ten', 'Pac-12'];

// KV TTLs (seconds)
const TTL = {
  scores: 120,       // 2 min — refreshed by cron
  standings: 1800,   // 30 min
  rankings: 1800,    // 30 min
  trending: 600,     // 10 min
};

// ---------------------------------------------------------------------------
// Season awareness
// ---------------------------------------------------------------------------

function isBaseballSeason(): boolean {
  const month = new Date().getMonth() + 1; // 1-indexed
  return month >= 2 && month <= 6; // Feb through June
}

function isScoresCron(cron: string): boolean {
  return cron.includes('*/2');
}

// ---------------------------------------------------------------------------
// Fetch helpers
// ---------------------------------------------------------------------------

async function safeFetch<T>(url: string, headers?: Record<string, string>): Promise<{ ok: boolean; data?: T; error?: string }> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    const res = await fetch(url, {
      headers: { 'User-Agent': 'BSI-CBB-Ingest/1.0', ...headers },
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}` };
    return { ok: true, data: (await res.json()) as T };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Fetch failed' };
  }
}

function highlightlyHeaders(apiKey: string): Record<string, string> {
  return {
    'x-rapidapi-key': apiKey,
    'x-rapidapi-host': HIGHLIGHTLY_HOST,
    Accept: 'application/json',
  };
}

// ---------------------------------------------------------------------------
// Ingest: Scores
// ---------------------------------------------------------------------------

async function ingestScores(env: Env): Promise<{ source: string; count: number; error?: string }> {
  const today = new Date().toISOString().split('T')[0];
  const dateKey = today.replace(/-/g, '');

  // Highlightly first
  if (env.RAPIDAPI_KEY) {
    const result = await safeFetch<Record<string, unknown>>(
      `${HIGHLIGHTLY_BASE}/matches?league=NCAA&date=${today}`,
      highlightlyHeaders(env.RAPIDAPI_KEY)
    );

    if (result.ok && result.data) {
      await Promise.all([
        env.KV.put(`cb:scores:today`, JSON.stringify(result.data), { expirationTtl: TTL.scores }),
        env.KV.put(`cb:scores:${today}`, JSON.stringify(result.data), { expirationTtl: TTL.scores * 5 }),
      ]);
      const count = ((result.data as Record<string, unknown>).data as unknown[] ?? []).length;
      return { source: 'highlightly', count };
    }
  }

  // ESPN fallback
  const result = await safeFetch<Record<string, unknown>>(
    `${ESPN_BASE}/apis/site/v2/sports/${SPORT_PATH}/scoreboard?dates=${dateKey}`
  );

  if (result.ok && result.data) {
    const events = (result.data.events ?? []) as unknown[];
    // Normalize ESPN events to match the format the main worker expects
    const normalized = { data: events, totalCount: events.length };
    await Promise.all([
      env.KV.put(`cb:scores:today`, JSON.stringify(normalized), { expirationTtl: TTL.scores }),
      env.KV.put(`cb:scores:${today}`, JSON.stringify(normalized), { expirationTtl: TTL.scores * 5 }),
    ]);
    return { source: 'espn', count: events.length };
  }

  return { source: 'none', count: 0, error: result.error };
}

// ---------------------------------------------------------------------------
// Ingest: Standings
// ---------------------------------------------------------------------------

async function ingestStandings(env: Env): Promise<{ source: string; conferences: number; error?: string }> {
  // Highlightly first
  if (env.RAPIDAPI_KEY) {
    let hlSuccess = 0;
    for (const conf of CONFERENCES) {
      const result = await safeFetch<Record<string, unknown>>(
        `${HIGHLIGHTLY_BASE}/standings?league=NCAA&abbreviation=${encodeURIComponent(conf)}`,
        highlightlyHeaders(env.RAPIDAPI_KEY)
      );
      if (result.ok && result.data) {
        await env.KV.put(`cb:standings:v3:${conf}`, JSON.stringify(result.data), { expirationTtl: TTL.standings });
        hlSuccess++;
      }
    }
    if (hlSuccess > 0) return { source: 'highlightly', conferences: hlSuccess };
  }

  // ESPN fallback — single standings endpoint
  const result = await safeFetch<Record<string, unknown>>(
    `${ESPN_BASE}/apis/site/v2/sports/${SPORT_PATH}/standings`
  );

  if (result.ok && result.data) {
    const children = (result.data.children ?? []) as Record<string, unknown>[];

    // Write per-conference
    let written = 0;
    for (const conf of CONFERENCES) {
      const match = children.find((c) =>
        ((c.name as string) ?? '').toLowerCase().includes(conf.toLowerCase())
      );
      if (match) {
        await env.KV.put(`cb:standings:v3:${conf}`, JSON.stringify([match]), { expirationTtl: TTL.standings });
        written++;
      }
    }

    // Also write NCAA-level (all)
    await env.KV.put('cb:standings:v3:NCAA', JSON.stringify(children), { expirationTtl: TTL.standings });
    return { source: 'espn', conferences: written };
  }

  return { source: 'none', conferences: 0, error: result.error };
}

// ---------------------------------------------------------------------------
// Ingest: Rankings
// ---------------------------------------------------------------------------

async function ingestRankings(env: Env): Promise<{ source: string; error?: string }> {
  // Highlightly first
  if (env.RAPIDAPI_KEY) {
    const result = await safeFetch<Record<string, unknown>>(
      `${HIGHLIGHTLY_BASE}/rankings?league=NCAA`,
      highlightlyHeaders(env.RAPIDAPI_KEY)
    );
    if (result.ok && result.data) {
      await env.KV.put('cb:rankings', JSON.stringify(result.data), { expirationTtl: TTL.rankings });
      return { source: 'highlightly' };
    }
  }

  // ESPN fallback
  const result = await safeFetch<Record<string, unknown>>(
    `${ESPN_BASE}/apis/site/v2/sports/${SPORT_PATH}/rankings`
  );

  if (result.ok && result.data) {
    const rankings = (result.data.rankings ?? []) as unknown[];
    await env.KV.put('cb:rankings', JSON.stringify(rankings), { expirationTtl: TTL.rankings });
    return { source: 'espn' };
  }

  return { source: 'none', error: result.error };
}

// ---------------------------------------------------------------------------
// Ingest: Trending (derived from today's scores)
// ---------------------------------------------------------------------------

async function ingestTrending(env: Env): Promise<void> {
  const raw = await env.KV.get('cb:scores:today', 'text');
  if (!raw) return;

  try {
    const scores = JSON.parse(raw) as Record<string, unknown>;
    const games = (scores.data ?? []) as Record<string, unknown>[];

    // Simple trending: closest games + highest scoring
    const trending = games
      .filter((g) => {
        const status = g.status as Record<string, unknown> | undefined;
        const type = (status?.type as string) ?? '';
        return type === 'inprogress' || type === 'finished';
      })
      .slice(0, 10)
      .map((g) => ({
        id: g.id,
        homeTeam: ((g.homeTeam as Record<string, unknown>)?.name as string) ?? '',
        awayTeam: ((g.awayTeam as Record<string, unknown>)?.name as string) ?? '',
        homeScore: Number(g.homeScore ?? 0),
        awayScore: Number(g.awayScore ?? 0),
        status: g.status,
      }));

    if (trending.length > 0) {
      await env.KV.put('cb:trending', JSON.stringify({
        data: trending,
        totalCount: trending.length,
        lastUpdated: new Date().toISOString(),
      }), { expirationTtl: TTL.trending });
    }
  } catch {
    // Non-fatal
  }
}

// ---------------------------------------------------------------------------
// Worker entry
// ---------------------------------------------------------------------------

export default {
  async scheduled(event: ScheduledEvent, env: Env, _ctx: ExecutionContext): Promise<void> {
    const cronStr = event.cron ?? '';
    const season = isBaseballSeason();
    const now = new Date().toISOString();

    const results: Record<string, unknown> = { timestamp: now, season };

    if (isScoresCron(cronStr)) {
      // 2-minute cron: scores only (skip off-season unless it's the daily check)
      if (season) {
        results.scores = await ingestScores(env);
        await ingestTrending(env);
      }
      // Off-season: only run scores once per hour (when minute is 0 or 2)
      else {
        const minute = new Date().getMinutes();
        if (minute <= 2) {
          results.scores = await ingestScores(env);
        } else {
          results.scores = { skipped: 'off-season' };
        }
      }
    } else {
      // 15-minute cron: standings + rankings
      results.standings = await ingestStandings(env);
      results.rankings = await ingestRankings(env);

      // Also run scores and trending on the 15-min tick
      if (season) {
        results.scores = await ingestScores(env);
        await ingestTrending(env);
      }
    }

    // Store last ingest summary
    await env.KV.put('cbb-ingest:last-run', JSON.stringify(results), { expirationTtl: 86400 });
  },

  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/status') {
      const lastRun = await env.KV.get('cbb-ingest:last-run', 'text');

      // Check cache freshness
      const scoresFresh = !!(await env.KV.get('cb:scores:today', 'text'));
      const rankingsFresh = !!(await env.KV.get('cb:rankings', 'text'));
      const standingsFresh = !!(await env.KV.get('cb:standings:v3:NCAA', 'text'));

      return new Response(JSON.stringify({
        season: isBaseballSeason(),
        lastRun: lastRun ? JSON.parse(lastRun) : null,
        cache: {
          scores: scoresFresh,
          rankings: rankingsFresh,
          standings: standingsFresh,
        },
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Manual trigger — run full ingest
    const scores = await ingestScores(env);
    const standings = await ingestStandings(env);
    const rankings = await ingestRankings(env);
    await ingestTrending(env);

    const summary = {
      ok: true,
      timestamp: new Date().toISOString(),
      scores,
      standings,
      rankings,
    };

    await env.KV.put('cbb-ingest:last-run', JSON.stringify(summary), { expirationTtl: 86400 });

    return new Response(JSON.stringify(summary), {
      headers: { 'Content-Type': 'application/json' },
    });
  },
};
