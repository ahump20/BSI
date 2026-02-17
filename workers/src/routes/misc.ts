import { Hono } from 'hono';
import type { Env } from '../env';
import { withCache, HTTP_CACHE } from '../middleware/cache';
import { createSportsDataIOAdapter } from '../../../lib/adapters/sportsdataio';
import { createNcaaClient } from '../../../lib/api-clients/ncaa-api';

const app = new Hono<{ Bindings: Env }>();

const LIVE_SCORES_CACHE_KEY = 'live-scores:aggregate:v1';
const LIVE_SCORES_FRESH_TTL_SECONDS = 30;
const LIVE_SCORES_STALE_TTL_SECONDS = 5 * 60;
const LIVE_SCORES_TIMEZONE = 'America/Chicago' as const;

type LiveScoreGame = {
  id: string;
  away: { name: string; score: number };
  home: { name: string; score: number };
  status: string;
  isLive: boolean;
  isFinal: boolean;
  detail?: string;
};

type LiveScoresPayload = {
  mlb: LiveScoreGame[];
  nfl: LiveScoreGame[];
  nba: LiveScoreGame[];
  collegeBaseball: LiveScoreGame[];
  meta: {
    source: string;
    fetched_at: string;
    timezone: typeof LIVE_SCORES_TIMEZONE;
    note?: string;
  };
};

function asText(value: unknown, fallback = ''): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return fallback;
}

function asNumber(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
}

function normalizeStatus(statusValue: unknown): { status: string; isLive: boolean; isFinal: boolean } {
  const status = asText(statusValue, 'Scheduled');
  const normalized = status.toLowerCase();
  return {
    status,
    isLive: /in\s?progress|live|halftime/.test(normalized),
    isFinal: /final|f\/ot|completed|post/.test(normalized),
  };
}

function normalizeSportsDataGame(
  sport: 'mlb' | 'nfl' | 'nba',
  raw: Record<string, unknown>,
  index: number,
): LiveScoreGame {
  const statusBits = normalizeStatus(raw.Status ?? raw.status ?? raw.GameStatus);
  const detail = asText(
    raw.InningDescription ??
      raw.QuarterDescription ??
      raw.StatusDescription ??
      raw.DateTime ??
      raw.DateTimeUTC,
    '',
  );

  return {
    id: asText(raw.GameID ?? raw.GlobalGameID ?? raw.id, `${sport}-${index}`),
    away: {
      name: asText(raw.AwayTeamName ?? raw.AwayTeam ?? raw.awayTeam, 'Away'),
      score: asNumber(
        raw.AwayTeamRuns ??
          raw.AwayScore ??
          raw.AwayTeamScore ??
          raw.ScoreAway ??
          raw.awayScore,
      ),
    },
    home: {
      name: asText(raw.HomeTeamName ?? raw.HomeTeam ?? raw.homeTeam, 'Home'),
      score: asNumber(
        raw.HomeTeamRuns ??
          raw.HomeScore ??
          raw.HomeTeamScore ??
          raw.ScoreHome ??
          raw.homeScore,
      ),
    },
    status: statusBits.status,
    isLive: statusBits.isLive,
    isFinal: statusBits.isFinal,
    detail: detail || undefined,
  };
}

function normalizeNcaaGame(raw: Record<string, unknown>, index: number): LiveScoreGame {
  const statusObject = (raw.status as Record<string, unknown> | undefined) || {};
  const detail = asText(statusObject.detail ?? statusObject.type, 'Scheduled');
  const status = asText(detail, 'Scheduled');
  const state = asText(statusObject.state).toLowerCase();

  const awayTeam = (raw.awayTeam as Record<string, unknown> | undefined) || {};
  const homeTeam = (raw.homeTeam as Record<string, unknown> | undefined) || {};

  return {
    id: asText(raw.id, `college-baseball-${index}`),
    away: {
      name: asText(awayTeam.name ?? awayTeam.displayName, 'Away'),
      score: asNumber(raw.awayScore),
    },
    home: {
      name: asText(homeTeam.name ?? homeTeam.displayName, 'Home'),
      score: asNumber(raw.homeScore),
    },
    status,
    isLive: state === 'in' || /in\s?progress|live/.test(status.toLowerCase()),
    isFinal: state === 'post' || /final/.test(status.toLowerCase()),
    detail: status,
  };
}

function fallbackLiveScoresPayload(note?: string): LiveScoresPayload {
  return {
    mlb: [
      {
        id: 'fallback-mlb-1',
        away: { name: 'Los Angeles Dodgers', score: 6 },
        home: { name: 'San Diego Padres', score: 3 },
        status: 'Final',
        isLive: false,
        isFinal: true,
      },
    ],
    nfl: [
      {
        id: 'fallback-nfl-1',
        away: { name: 'Miami Dolphins', score: 24 },
        home: { name: 'Buffalo Bills', score: 20 },
        status: 'Final',
        isLive: false,
        isFinal: true,
      },
    ],
    nba: [
      {
        id: 'fallback-nba-1',
        away: { name: 'Boston Celtics', score: 112 },
        home: { name: 'New York Knicks', score: 104 },
        status: 'Final',
        isLive: false,
        isFinal: true,
      },
    ],
    collegeBaseball: [
      {
        id: 'fallback-cbb-1',
        away: { name: 'Texas A&M Aggies', score: 4 },
        home: { name: 'Texas Longhorns', score: 7 },
        status: 'Final',
        isLive: false,
        isFinal: true,
      },
    ],
    meta: {
      source: 'Blaze Sports Intel fallback snapshot',
      fetched_at: new Date().toISOString(),
      timezone: LIVE_SCORES_TIMEZONE,
      note: note || 'Primary live score feeds are temporarily delayed.',
    },
  };
}

async function collectLiveScores(env: Env): Promise<LiveScoresPayload> {
  const adapter = env.SPORTS_DATA_IO_API_KEY
    ? createSportsDataIOAdapter(env.SPORTS_DATA_IO_API_KEY)
    : null;
  const ncaaClient = createNcaaClient();

  const [mlbResult, nflResult, nbaResult, ncaaResult] = await Promise.allSettled([
    adapter ? adapter.getMLBGamesByDate() : Promise.resolve(null),
    adapter ? adapter.getNFLScores() : Promise.resolve(null),
    adapter ? adapter.getNBAGamesByDate() : Promise.resolve(null),
    ncaaClient.getMatches('NCAA'),
  ]);

  const delayedFeeds: string[] = [];
  const sourceParts = new Set<string>();

  const mlb =
    mlbResult.status === 'fulfilled' &&
    mlbResult.value &&
    mlbResult.value.success &&
    Array.isArray(mlbResult.value.data)
      ? mlbResult.value.data.map((game, index) =>
          normalizeSportsDataGame('mlb', game as Record<string, unknown>, index),
        )
      : [];
  if (mlb.length > 0) {
    sourceParts.add('SportsDataIO MLB');
  } else {
    delayedFeeds.push('MLB');
  }

  const nfl =
    nflResult.status === 'fulfilled' &&
    nflResult.value &&
    nflResult.value.success &&
    Array.isArray(nflResult.value.data)
      ? nflResult.value.data.map((game, index) =>
          normalizeSportsDataGame('nfl', game as Record<string, unknown>, index),
        )
      : [];
  if (nfl.length > 0) {
    sourceParts.add('SportsDataIO NFL');
  } else {
    delayedFeeds.push('NFL');
  }

  const nba =
    nbaResult.status === 'fulfilled' &&
    nbaResult.value &&
    nbaResult.value.success &&
    Array.isArray(nbaResult.value.data)
      ? nbaResult.value.data.map((game, index) =>
          normalizeSportsDataGame('nba', game as Record<string, unknown>, index),
        )
      : [];
  if (nba.length > 0) {
    sourceParts.add('SportsDataIO NBA');
  } else {
    delayedFeeds.push('NBA');
  }

  const collegeBaseballRaw =
    ncaaResult.status === 'fulfilled' &&
    ncaaResult.value.success &&
    ncaaResult.value.data &&
    Array.isArray((ncaaResult.value.data as { data?: unknown[] }).data)
      ? ((ncaaResult.value.data as { data: unknown[] }).data as Record<string, unknown>[])
      : [];
  const collegeBaseball = collegeBaseballRaw.map((game, index) => normalizeNcaaGame(game, index));
  if (collegeBaseball.length > 0) {
    sourceParts.add('ESPN College Baseball');
  } else {
    delayedFeeds.push('College Baseball');
  }

  if (mlb.length === 0 && nfl.length === 0 && nba.length === 0 && collegeBaseball.length === 0) {
    throw new Error('All live score feeds are delayed.');
  }

  return {
    mlb,
    nfl,
    nba,
    collegeBaseball,
    meta: {
      source:
        sourceParts.size > 0
          ? Array.from(sourceParts).join(' + ')
          : 'Blaze Sports Intel fallback snapshot',
      fetched_at: new Date().toISOString(),
      timezone: LIVE_SCORES_TIMEZONE,
      note:
        delayedFeeds.length > 0
          ? `Delayed feeds: ${delayedFeeds.join(', ')}. Showing available sources only.`
          : undefined,
    },
  };
}

app.get('/live-scores', async (c) => {
  let cachedPayload: LiveScoresPayload | null = null;

  try {
    const cachedRaw = await c.env.KV.get(LIVE_SCORES_CACHE_KEY);
    if (cachedRaw) {
      cachedPayload = JSON.parse(cachedRaw) as LiveScoresPayload;
    }
  } catch {
    cachedPayload = null;
  }

  if (cachedPayload?.meta?.fetched_at) {
    const ageMs = Date.now() - new Date(cachedPayload.meta.fetched_at).getTime();
    if (Number.isFinite(ageMs) && ageMs <= LIVE_SCORES_FRESH_TTL_SECONDS * 1000) {
      return c.json(cachedPayload, 200, {
        'Cache-Control': `public, max-age=${LIVE_SCORES_FRESH_TTL_SECONDS}`,
        'X-Cache': 'HIT',
      });
    }
  }

  try {
    const payload = await collectLiveScores(c.env);
    await c.env.KV.put(LIVE_SCORES_CACHE_KEY, JSON.stringify(payload), {
      expirationTtl: LIVE_SCORES_STALE_TTL_SECONDS,
    });

    return c.json(payload, 200, {
      'Cache-Control': `public, max-age=${LIVE_SCORES_FRESH_TTL_SECONDS}`,
      'X-Cache': cachedPayload ? 'REVALIDATED' : 'MISS',
    });
  } catch {
    if (cachedPayload) {
      const stalePayload: LiveScoresPayload = {
        ...cachedPayload,
        meta: {
          ...cachedPayload.meta,
          note: 'Live feeds are delayed. Serving cached snapshot while upstream sources recover.',
        },
      };

      return c.json(stalePayload, 200, {
        'Cache-Control': `public, max-age=${LIVE_SCORES_FRESH_TTL_SECONDS}`,
        'X-Cache': 'STALE',
      });
    }

    return c.json(fallbackLiveScoresPayload(), 200, {
      'Cache-Control': `public, max-age=${LIVE_SCORES_FRESH_TTL_SECONDS}`,
      'X-Cache': 'FALLBACK',
    });
  }
});

// ---------------------------------------------------------------------------
// Email validation
// ---------------------------------------------------------------------------

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidEmail(email: string): boolean {
  return typeof email === 'string' && email.length <= 254 && EMAIL_RE.test(email);
}

// ---------------------------------------------------------------------------
// Share events - POST /events/share
// ---------------------------------------------------------------------------

const SHARE_EVENTS = new Set(['share_clicked', 'share_completed']);
const SHARE_SURFACES = new Set(['college_baseball_standings']);
const SHARE_COUNTER_TTL_SECONDS = 120 * 24 * 60 * 60;
const SHARE_SAMPLE_TTL_SECONDS = 30 * 24 * 60 * 60;

type ShareEventPayload = {
  event?: string;
  surface?: string;
  conference?: string;
  path?: string;
  timestamp?: string;
};

function isValidIsoTimestamp(value: string): boolean {
  const parsed = new Date(value);
  return !Number.isNaN(parsed.getTime());
}

app.post('/events/share', async (c) => {
  let payload: ShareEventPayload;

  try {
    payload = await c.req.json<ShareEventPayload>();
  } catch {
    return c.json({ error: 'Invalid JSON payload' }, 400);
  }

  const event = typeof payload.event === 'string' ? payload.event : '';
  const surface = typeof payload.surface === 'string' ? payload.surface : '';
  const conference = typeof payload.conference === 'string' ? payload.conference.trim() : '';
  const eventPath = typeof payload.path === 'string' ? payload.path.trim() : '';
  const timestamp = typeof payload.timestamp === 'string' ? payload.timestamp : '';

  if (!SHARE_EVENTS.has(event)) {
    return c.json({ error: 'Invalid share event' }, 400);
  }
  if (!SHARE_SURFACES.has(surface)) {
    return c.json({ error: 'Invalid share surface' }, 400);
  }
  if (!conference || conference.length > 40) {
    return c.json({ error: 'Invalid conference value' }, 400);
  }
  if (!eventPath || !eventPath.startsWith('/') || eventPath.length > 300) {
    return c.json({ error: 'Invalid share path' }, 400);
  }
  if (!timestamp || !isValidIsoTimestamp(timestamp)) {
    return c.json({ error: 'Invalid timestamp' }, 400);
  }

  try {
    const day = new Date(timestamp).toISOString().slice(0, 10);
    const counterKey = `analytics:share:${event}:${day}`;
    const surfaceCounterKey = `analytics:share:${surface}:${event}:${day}`;

    const currentCountRaw = await c.env.KV.get(counterKey);
    const currentSurfaceCountRaw = await c.env.KV.get(surfaceCounterKey);
    const currentCount = Number.parseInt(currentCountRaw || '0', 10);
    const currentSurfaceCount = Number.parseInt(currentSurfaceCountRaw || '0', 10);
    const nextCount = Number.isFinite(currentCount) ? currentCount + 1 : 1;
    const nextSurfaceCount = Number.isFinite(currentSurfaceCount) ? currentSurfaceCount + 1 : 1;

    await c.env.KV.put(counterKey, String(nextCount), {
      expirationTtl: SHARE_COUNTER_TTL_SECONDS,
    });
    await c.env.KV.put(surfaceCounterKey, String(nextSurfaceCount), {
      expirationTtl: SHARE_COUNTER_TTL_SECONDS,
    });

    if (Math.random() < 0.1) {
      const sampleKey = `analytics:share:sample:${Date.now()}:${Math.random().toString(36).slice(2, 10)}`;
      await c.env.KV.put(
        sampleKey,
        JSON.stringify({
          event,
          surface,
          conference,
          path: eventPath,
          timestamp,
          recordedAt: new Date().toISOString(),
        }),
        { expirationTtl: SHARE_SAMPLE_TTL_SECONDS },
      );
    }

    return c.json({ success: true }, 202);
  } catch {
    return c.json({ error: 'Failed to record share event' }, 500);
  }
});

// ---------------------------------------------------------------------------
// Lead capture — POST /lead or /leads
// ---------------------------------------------------------------------------

const LEAD_TTL_SECONDS = 90 * 24 * 60 * 60;

app.post('/lead', handleLead);
app.post('/leads', handleLead);

async function handleLead(c: any) {
  try {
    const lead = (await c.req.json()) as {
      name: string;
      email: string;
      organization?: string;
      sport?: string;
      message?: string;
      source?: string;
      consent?: boolean;
    };

    if (!lead.name || !lead.email) {
      return c.json({ error: 'Name and email are required' }, 400);
    }

    if (!isValidEmail(lead.email)) {
      return c.json({ error: 'Invalid email address' }, 400);
    }

    if (lead.name.length > 200 || (lead.message && lead.message.length > 5000)) {
      return c.json({ error: 'Input exceeds maximum length' }, 400);
    }

    if (lead.consent !== true) {
      return c.json({ error: 'Consent to privacy policy is required' }, 400);
    }

    const consentedAt = new Date().toISOString();

    if (c.env.KV) {
      const key = `lead:${Date.now()}:${lead.email}`;
      await c.env.KV.put(key, JSON.stringify({ ...lead, consentedAt }), {
        expirationTtl: LEAD_TTL_SECONDS,
        metadata: { timestamp: consentedAt },
      });
    }

    if (c.env.DB) {
      try {
        await c.env.DB
          .prepare(
            `INSERT INTO leads (name, email, organization, sport, message, source, created_at)
             VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`
          )
          .bind(
            lead.name,
            lead.email,
            lead.organization ?? null,
            lead.sport ?? null,
            lead.message ?? null,
            lead.source ?? 'API'
          )
          .run();
      } catch {
        // KV is the primary store; D1 failure is non-fatal
      }
    }

    return c.json({
      success: true,
      message: 'Lead captured successfully',
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
    });
  } catch {
    return c.json({ error: 'Failed to process lead' }, 500);
  }
}

// ---------------------------------------------------------------------------
// Feedback — POST /feedback
// ---------------------------------------------------------------------------

app.post('/feedback', async (c) => {
  try {
    const body = await c.req.json<{
      rating?: number;
      category?: string;
      text?: string;
      page?: string;
    }>();

    if (!body.text) {
      return c.json({ error: 'Feedback text is required' }, 400);
    }

    if (body.text.length > 5000) {
      return c.json({ error: 'Feedback text exceeds maximum length' }, 400);
    }

    if (c.env.DB) {
      try {
        await c.env.DB
          .prepare(
            `INSERT INTO feedback (rating, category, text, page, created_at)
             VALUES (?, ?, ?, ?, datetime('now'))`
          )
          .bind(body.rating ?? null, body.category ?? null, body.text, body.page ?? null)
          .run();
      } catch {
        // D1 table may not exist yet; fall through to KV
      }
    }

    const key = `feedback:${Date.now()}`;
    await c.env.KV.put(key, JSON.stringify({ ...body, timestamp: new Date().toISOString() }), {
      expirationTtl: 86400 * 90,
    });

    return c.json({ success: true, message: 'Feedback received' });
  } catch {
    return c.json({ error: 'Failed to process feedback' }, 500);
  }
});

// ---------------------------------------------------------------------------
// Leaderboard — GET/POST /multiplayer/leaderboard
// ---------------------------------------------------------------------------

app.get('/multiplayer/leaderboard', async (c) => {
  if (!c.env.DB) return c.json({ error: 'Database not configured' }, 503);

  const gameId = c.req.query('game');
  const limit = Math.min(parseInt(c.req.query('limit') || '25'), 100);

  try {
    let stmt;
    if (gameId) {
      stmt = c.env.DB.prepare(
        'SELECT player_name as name, score, avatar, game_id, updated_at FROM leaderboard WHERE game_id = ? ORDER BY score DESC LIMIT ?'
      ).bind(gameId, limit);
    } else {
      stmt = c.env.DB.prepare(
        'SELECT player_name as name, score, avatar, game_id, updated_at FROM leaderboard ORDER BY score DESC LIMIT ?'
      ).bind(limit);
    }

    const { results } = await stmt.all();
    return c.json(results ?? []);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'D1 error';
    if (msg.includes('no such table')) {
      return c.json([]);
    }
    return c.json({ error: msg }, 500);
  }
});

app.post('/multiplayer/leaderboard', async (c) => {
  if (!c.env.DB) return c.json({ error: 'Database not configured' }, 503);

  const body = await c.req.json<{ name?: string; score?: number; game?: string; avatar?: string }>();

  if (!body.name || typeof body.score !== 'number' || !body.game) {
    return c.json({ error: 'name, score (number), and game are required' }, 400);
  }

  try {
    await c.env.DB.prepare(
      `INSERT INTO leaderboard (player_name, game_id, score, avatar, updated_at)
       VALUES (?, ?, ?, ?, datetime('now'))
       ON CONFLICT(player_name, game_id) DO UPDATE SET
         score = MAX(leaderboard.score, excluded.score),
         avatar = excluded.avatar,
         updated_at = datetime('now')`
    ).bind(body.name, body.game, body.score, body.avatar || '🎮').run();

    return c.json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'D1 error';
    return c.json({ error: msg }, 500);
  }
});

// ---------------------------------------------------------------------------
// R2 Game Assets — /games/assets/*
// ---------------------------------------------------------------------------

app.get('/games/assets/*', async (c) => {
  const assetPath = c.req.path.replace('/api/games/assets/', '');
  if (!assetPath) return c.json({ error: 'Asset not found' }, 404);

  const object = await c.env.ASSETS_BUCKET.get(assetPath);
  if (!object) return c.json({ error: 'Asset not found' }, 404);

  const headers: Record<string, string> = {
    'Cache-Control': 'public, max-age=86400, immutable',
    'Content-Type': object.httpMetadata?.contentType || 'application/octet-stream',
  };

  if (object.httpMetadata?.contentEncoding) {
    headers['Content-Encoding'] = object.httpMetadata.contentEncoding;
  }

  return new Response(object.body, { headers });
});

// ---------------------------------------------------------------------------
// Intel News — /intel/news (aggregated ESPN news across sports)
// ---------------------------------------------------------------------------

const INTEL_ESPN_NEWS: Record<string, string> = {
  nfl: 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/news',
  nba: 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/news',
  mlb: 'https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/news',
  ncaafb: 'https://site.api.espn.com/apis/site/v2/sports/football/college-football/news',
  cbb: 'https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/news',
  d1bb: 'https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball/news',
};

app.get('/intel/news', async (c) => {
  const sportParam = c.req.query('sport') || 'all';

  const sportsToFetch = sportParam === 'all'
    ? Object.keys(INTEL_ESPN_NEWS)
    : sportParam.split(',').filter((s) => s in INTEL_ESPN_NEWS);

  if (sportsToFetch.length === 0) {
    return c.json({ articles: [], error: 'Invalid sport parameter' }, 400);
  }

  const results: Array<{ sport: string; data: Record<string, unknown> }> = [];

  for (const sport of sportsToFetch) {
    try {
      const { data } = await withCache(c.env.KV, `intel:news:${sport}`, 120, async () => {
        const espnUrl = INTEL_ESPN_NEWS[sport];
        if (!espnUrl) return { articles: [] } as Record<string, unknown>;

        const res = await fetch(espnUrl, { headers: { Accept: 'application/json' } });
        if (res.ok) return (await res.json()) as Record<string, unknown>;
        return { articles: [] } as Record<string, unknown>;
      });

      results.push({ sport, data });
    } catch {
      results.push({ sport, data: { articles: [] } });
    }
  }

  return c.json(results, 200, { 'Cache-Control': `public, max-age=${HTTP_CACHE.news}` });
});

// ---------------------------------------------------------------------------
// CFB Articles (D1) — /college-football/articles
// ---------------------------------------------------------------------------

app.get('/college-football/articles', async (c) => {
  const type = c.req.query('type') || 'all';
  const limit = Math.min(parseInt(c.req.query('limit') || '20'), 50);

  try {
    const { data, cacheHit } = await withCache(c.env.KV, `cfb:articles:${type}:${limit}`, 300, async () => {
      const whereClause = type !== 'all'
        ? `WHERE sport = 'college-football' AND article_type = ?`
        : `WHERE sport = 'college-football'`;
      const bindings = type !== 'all' ? [type, limit] : [limit];

      const { results } = await c.env.DB.prepare(
        `SELECT id, article_type, title, slug, summary, home_team_name, away_team_name,
                game_date, conference, published_at
         FROM articles ${whereClause}
         ORDER BY published_at DESC LIMIT ?`
      ).bind(...bindings).all();

      return { articles: results || [], meta: { source: 'BSI D1' } };
    });

    return c.json(data, 200, {
      'Cache-Control': `public, max-age=${HTTP_CACHE.news}`,
      'X-Cache': cacheHit ? 'HIT' : 'MISS',
    });
  } catch {
    return c.json({ articles: [], meta: { source: 'BSI D1' } });
  }
});

app.get('/college-football/articles/:slug', async (c) => {
  const slug = c.req.param('slug');

  try {
    const { data, cacheHit } = await withCache(c.env.KV, `cfb:article:${slug}`, 900, async () => {
      const row = await c.env.DB.prepare(
        `SELECT * FROM articles WHERE slug = ? AND sport = 'college-football' LIMIT 1`
      ).bind(slug).first();

      if (!row) return null;
      return { article: row, meta: { source: 'BSI D1', timezone: 'America/Chicago' } };
    });

    if (!data) return c.json({ error: 'Article not found' }, 404);

    return c.json(data, 200, {
      'Cache-Control': `public, max-age=${HTTP_CACHE.news}`,
      'X-Cache': cacheHit ? 'HIT' : 'MISS',
    });
  } catch {
    return c.json({ error: 'Article not found' }, 404);
  }
});

// ---------------------------------------------------------------------------
// Presence Coach Trends — /presence-coach/users/:userId/trends
// ---------------------------------------------------------------------------

function toFiniteNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function toNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const parsed = toFiniteNumber(value, Number.NaN);
  return Number.isFinite(parsed) ? parsed : null;
}

app.get('/presence-coach/users/:userId/trends', async (c) => {
  const userId = c.req.param('userId');
  const fetchedAt = new Date().toISOString();
  const meta = { source: 'coach-d1', fetched_at: fetchedAt, timezone: 'America/Chicago' as const };

  const placeholder = {
    user: { id: userId, exists: false, consent_status: 'unknown', consented_at: null },
    summary: {
      session_count: 0, avg_signal_quality: 0, avg_attention_score: 0,
      baseline_confidence: 0, predicted_drift_risk: 0, top_drift_signal: null, last_session_at: null,
    },
    signals: {
      posture_score: 0, gaze_focus_score: 0, voice_energy_score: 0,
      pitch_stability_score: 0, facial_tension_score: 0, filler_words_per_minute: 0,
    },
    interventions: {
      by_type: { visual: 0, haptic: 0, audio: 0, text: 0, spoken: 0 },
      total: 0, avg_response_latency_ms: null as number | null,
    },
    meta,
  };

  if (!c.env.DB) return c.json(placeholder, 503);

  try {
    const { data, cacheHit } = await withCache(c.env.KV, `coach:trends:${userId}`, 120, async () => {
      const [userRow, sessionRow, signalRow, baselineRow, driftRow, interventionRows] = await Promise.all([
        c.env.DB.prepare(
          `SELECT id, consent_status, consented_at FROM coach_users WHERE id = ? OR pseudonymous_key = ? LIMIT 1`
        ).bind(userId, userId).first<Record<string, unknown>>(),
        c.env.DB.prepare(
          `SELECT COUNT(*) as session_count, AVG(COALESCE(signal_quality_score, 0)) as avg_signal_quality,
                  AVG(COALESCE(attention_score, 0)) as avg_attention_score, MAX(ended_at) as last_session_at
           FROM coach_sessions WHERE coach_user_id = ?`
        ).bind(userId).first<Record<string, unknown>>(),
        c.env.DB.prepare(
          `SELECT AVG(COALESCE(posture_score, 0)) as posture_score, AVG(COALESCE(gaze_focus_score, 0)) as gaze_focus_score,
                  AVG(COALESCE(voice_energy_score, 0)) as voice_energy_score, AVG(COALESCE(pitch_stability_score, 0)) as pitch_stability_score,
                  AVG(COALESCE(facial_tension_score, 0)) as facial_tension_score, AVG(COALESCE(filler_words_per_minute, 0)) as filler_words_per_minute
           FROM coach_signal_samples WHERE coach_user_id = ? AND sampled_at >= datetime('now', '-30 day')`
        ).bind(userId).first<Record<string, unknown>>(),
        c.env.DB.prepare(
          `SELECT AVG(COALESCE(confidence_score, 0)) as baseline_confidence FROM coach_habit_baselines WHERE coach_user_id = ?`
        ).bind(userId).first<Record<string, unknown>>(),
        c.env.DB.prepare(
          `SELECT drift_signal, predicted_risk_score FROM coach_habit_drift_events WHERE coach_user_id = ? ORDER BY occurred_at DESC LIMIT 1`
        ).bind(userId).first<Record<string, unknown>>(),
        c.env.DB.prepare(
          `SELECT cue_type, COUNT(*) as total_count, AVG(response_latency_ms) as avg_response_latency_ms
           FROM coach_interventions WHERE coach_user_id = ? AND created_at >= datetime('now', '-30 day') GROUP BY cue_type`
        ).bind(userId).all<Record<string, unknown>>(),
      ]);

      const interventions = { visual: 0, haptic: 0, audio: 0, text: 0, spoken: 0 };
      let totalInterventions = 0;
      let weightedLatencyTotal = 0;
      let weightedLatencyCount = 0;

      for (const row of interventionRows.results || []) {
        const cueType = String(row.cue_type || '').toLowerCase();
        const count = toFiniteNumber(row.total_count);
        const avgLatency = toNullableNumber(row.avg_response_latency_ms);

        if (cueType in interventions) {
          interventions[cueType as keyof typeof interventions] = count;
        }
        totalInterventions += count;
        if (avgLatency !== null && count > 0) {
          weightedLatencyTotal += avgLatency * count;
          weightedLatencyCount += count;
        }
      }

      return {
        user: {
          id: userId, exists: Boolean(userRow),
          consent_status: String(userRow?.consent_status || 'unknown'),
          consented_at: (userRow?.consented_at as string | null) || null,
        },
        summary: {
          session_count: toFiniteNumber(sessionRow?.session_count),
          avg_signal_quality: toFiniteNumber(sessionRow?.avg_signal_quality),
          avg_attention_score: toFiniteNumber(sessionRow?.avg_attention_score),
          baseline_confidence: toFiniteNumber(baselineRow?.baseline_confidence),
          predicted_drift_risk: toFiniteNumber(driftRow?.predicted_risk_score),
          top_drift_signal: (driftRow?.drift_signal as string | null) || null,
          last_session_at: (sessionRow?.last_session_at as string | null) || null,
        },
        signals: {
          posture_score: toFiniteNumber(signalRow?.posture_score),
          gaze_focus_score: toFiniteNumber(signalRow?.gaze_focus_score),
          voice_energy_score: toFiniteNumber(signalRow?.voice_energy_score),
          pitch_stability_score: toFiniteNumber(signalRow?.pitch_stability_score),
          facial_tension_score: toFiniteNumber(signalRow?.facial_tension_score),
          filler_words_per_minute: toFiniteNumber(signalRow?.filler_words_per_minute),
        },
        interventions: {
          by_type: interventions,
          total: totalInterventions,
          avg_response_latency_ms: weightedLatencyCount > 0
            ? Math.round(weightedLatencyTotal / weightedLatencyCount)
            : null,
        },
        meta,
      };
    });

    return c.json(data, 200, {
      'Cache-Control': 'public, max-age=120',
      'X-Cache': cacheHit ? 'HIT' : 'MISS',
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown D1 error';
    if (message.includes('no such table')) {
      return c.json({ ...placeholder, note: 'Presence coach telemetry tables are not initialized yet.' });
    }
    return c.json({ error: 'Failed to fetch coach trend summary' }, 500);
  }
});

// ---------------------------------------------------------------------------
// Presence Coach Write Path — users, sessions, signals, interventions
// ---------------------------------------------------------------------------

const VALID_CONSENT = new Set(['pending', 'granted', 'revoked']);
const VALID_SCENARIO = new Set(['video-call', 'interview', 'presentation', 'training', 'custom']);

async function invalidateCoachCache(kv: KVNamespace | undefined, userId: string) {
  if (kv) {
    try { await kv.delete(`coach:trends:${userId}`); } catch { /* best-effort */ }
  }
}

// POST /presence-coach/users — create a coach user
app.post('/presence-coach/users', async (c) => {
  if (!c.env.DB) return c.json({ error: 'Database not configured' }, 503);

  try {
    const body = await c.req.json<{
      pseudonymous_key?: string;
      consent_status?: string;
      consent_version?: string;
      locale?: string;
      timezone?: string;
      retention_days?: number;
    }>();

    if (!body.pseudonymous_key) return c.json({ error: 'pseudonymous_key is required' }, 400);
    if (!body.consent_status || !VALID_CONSENT.has(body.consent_status)) {
      return c.json({ error: 'consent_status must be one of: pending, granted, revoked' }, 400);
    }

    const id = crypto.randomUUID();
    const consentedAt = body.consent_status === 'granted' ? new Date().toISOString() : null;

    await c.env.DB.prepare(
      `INSERT INTO coach_users (id, pseudonymous_key, consent_status, consented_at, consent_version, locale, timezone, retention_days)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      id,
      body.pseudonymous_key,
      body.consent_status,
      consentedAt,
      body.consent_version ?? '1.0',
      body.locale ?? 'en-US',
      body.timezone ?? 'America/Chicago',
      body.retention_days ?? 90,
    ).run();

    return c.json({ success: true, user_id: id });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'D1 error';
    if (msg.includes('UNIQUE constraint')) return c.json({ error: 'User with this pseudonymous_key already exists' }, 409);
    return c.json({ error: msg }, 500);
  }
});

// POST /presence-coach/sessions — start a session
app.post('/presence-coach/sessions', async (c) => {
  if (!c.env.DB) return c.json({ error: 'Database not configured' }, 503);

  try {
    const body = await c.req.json<{
      coach_user_id?: string;
      scenario_type?: string;
      mode?: string;
      device_type?: string;
      context_label?: string;
    }>();

    if (!body.coach_user_id) return c.json({ error: 'coach_user_id is required' }, 400);
    if (!body.scenario_type || !VALID_SCENARIO.has(body.scenario_type)) {
      return c.json({ error: 'scenario_type must be one of: video-call, interview, presentation, training, custom' }, 400);
    }

    const id = crypto.randomUUID();

    await c.env.DB.prepare(
      `INSERT INTO coach_sessions (id, coach_user_id, scenario_type, mode, device_type, context_label, started_at)
       VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`
    ).bind(
      id,
      body.coach_user_id,
      body.scenario_type,
      body.mode ?? 'seated',
      body.device_type ?? 'desktop',
      body.context_label ?? null,
    ).run();

    await invalidateCoachCache(c.env.KV, body.coach_user_id);
    return c.json({ success: true, session_id: id });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'D1 error';
    return c.json({ error: msg }, 500);
  }
});

// PATCH /presence-coach/sessions/:sessionId — end or update a session
app.patch('/presence-coach/sessions/:sessionId', async (c) => {
  if (!c.env.DB) return c.json({ error: 'Database not configured' }, 503);

  try {
    const sessionId = c.req.param('sessionId');
    const body = await c.req.json<{
      coach_user_id?: string;
      ended_at?: string;
      signal_quality_score?: number;
      attention_score?: number;
      voice_stability_score?: number;
      posture_stability_score?: number;
    }>();

    const sets: string[] = ['updated_at = datetime(\'now\')'];
    const bindings: (string | number | null)[] = [];

    if (body.ended_at) { sets.push('ended_at = ?'); bindings.push(body.ended_at); }
    if (body.signal_quality_score !== undefined) { sets.push('signal_quality_score = ?'); bindings.push(body.signal_quality_score); }
    if (body.attention_score !== undefined) { sets.push('attention_score = ?'); bindings.push(body.attention_score); }
    if (body.voice_stability_score !== undefined) { sets.push('voice_stability_score = ?'); bindings.push(body.voice_stability_score); }
    if (body.posture_stability_score !== undefined) { sets.push('posture_stability_score = ?'); bindings.push(body.posture_stability_score); }

    bindings.push(sessionId);

    await c.env.DB.prepare(
      `UPDATE coach_sessions SET ${sets.join(', ')} WHERE id = ?`
    ).bind(...bindings).run();

    if (body.coach_user_id) await invalidateCoachCache(c.env.KV, body.coach_user_id);
    return c.json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'D1 error';
    return c.json({ error: msg }, 500);
  }
});

// POST /presence-coach/sessions/:sessionId/signals — batch signal samples
app.post('/presence-coach/sessions/:sessionId/signals', async (c) => {
  if (!c.env.DB) return c.json({ error: 'Database not configured' }, 503);

  try {
    const sessionId = c.req.param('sessionId');
    const body = await c.req.json<{
      coach_user_id?: string;
      samples?: Array<{
        sampled_at: string;
        posture_score?: number;
        gaze_focus_score?: number;
        voice_energy_score?: number;
        pitch_stability_score?: number;
        facial_tension_score?: number;
        filler_words_per_minute?: number;
      }>;
    }>();

    if (!body.coach_user_id) return c.json({ error: 'coach_user_id is required' }, 400);
    if (!body.samples || !Array.isArray(body.samples) || body.samples.length === 0) {
      return c.json({ error: 'samples array is required and must not be empty' }, 400);
    }
    if (body.samples.length > 100) {
      return c.json({ error: 'Maximum 100 samples per request' }, 400);
    }

    const stmts = body.samples.map((s) =>
      c.env.DB.prepare(
        `INSERT INTO coach_signal_samples (coach_session_id, coach_user_id, sampled_at, posture_score, gaze_focus_score, voice_energy_score, pitch_stability_score, facial_tension_score, filler_words_per_minute)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        sessionId,
        body.coach_user_id,
        s.sampled_at,
        s.posture_score ?? null,
        s.gaze_focus_score ?? null,
        s.voice_energy_score ?? null,
        s.pitch_stability_score ?? null,
        s.facial_tension_score ?? null,
        s.filler_words_per_minute ?? null,
      )
    );

    await c.env.DB.batch(stmts);
    await invalidateCoachCache(c.env.KV, body.coach_user_id);
    return c.json({ success: true, count: body.samples.length });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'D1 error';
    return c.json({ error: msg }, 500);
  }
});

// POST /presence-coach/sessions/:sessionId/interventions — record an intervention
app.post('/presence-coach/sessions/:sessionId/interventions', async (c) => {
  if (!c.env.DB) return c.json({ error: 'Database not configured' }, 503);

  try {
    const sessionId = c.req.param('sessionId');
    const body = await c.req.json<{
      coach_user_id?: string;
      cue_type?: string;
      escalation_tier?: number;
      trigger_reason?: string;
      drift_event_id?: number;
      cue_payload_json?: string;
      response_latency_ms?: number;
    }>();

    if (!body.coach_user_id) return c.json({ error: 'coach_user_id is required' }, 400);
    if (!body.cue_type) return c.json({ error: 'cue_type is required' }, 400);
    if (!body.escalation_tier) return c.json({ error: 'escalation_tier is required' }, 400);
    if (!body.trigger_reason) return c.json({ error: 'trigger_reason is required' }, 400);

    await c.env.DB.prepare(
      `INSERT INTO coach_interventions (coach_user_id, coach_session_id, cue_type, escalation_tier, trigger_reason, drift_event_id, cue_payload_json, response_latency_ms)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      body.coach_user_id,
      sessionId,
      body.cue_type,
      body.escalation_tier,
      body.trigger_reason,
      body.drift_event_id ?? null,
      body.cue_payload_json ?? '{}',
      body.response_latency_ms ?? null,
    ).run();

    await invalidateCoachCache(c.env.KV, body.coach_user_id);

    return c.json({ success: true, intervention_id: crypto.randomUUID() });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'D1 error';
    return c.json({ error: msg }, 500);
  }
});

export { app as miscRoutes };
