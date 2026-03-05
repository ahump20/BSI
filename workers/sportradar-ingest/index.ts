/**
 * BSI Sportradar Ingest — Cron Worker
 *
 * Polls Sportradar MLB v8 API on cron schedule, archives raw payloads
 * to R2, writes normalized pitch events to D1, computes ABS aggregates
 * and stores them in KV for fast frontend reads.
 *
 * Two cron frequencies:
 *   - Every 2 min:  active game PBP + pitch metrics (game hours only)
 *   - Every 15 min: changes/corrections endpoint
 *
 * Rate-limit aware: 1 QPS for trial access, built-in throttle.
 *
 * Deploy: wrangler deploy --config workers/sportradar-ingest/wrangler.toml
 */

// ---------------------------------------------------------------------------
// Environment
// ---------------------------------------------------------------------------

interface Env {
  SPORTRADAR_API_KEY: string;
  KV: KVNamespace;
  DB: D1Database;
  R2: R2Bucket;
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const SPORTRADAR_BASE = 'https://api.sportradar.com/mlb/trial/v8/en';
const TIMEOUT_MS = 12_000;
const THROTTLE_MS = 1100; // > 1 QPS for trial safety

const KV_KEYS = {
  challengesByRole: 'sportradar:abs:challenges-by-role',
  recentGames: 'sportradar:abs:recent-games',
  lastSync: 'sportradar:abs:last-sync',
};

const KV_TTL = {
  aggregates: 300,  // 5 min
  lastSync: 3600,   // 1 hour
};

// ---------------------------------------------------------------------------
// Season + time awareness
// ---------------------------------------------------------------------------

function isMLBSeason(): boolean {
  const month = new Date().getMonth() + 1;
  return month >= 3 && month <= 10; // March through October
}

function isGameHours(): boolean {
  // Games typically run 1pm–1am CT
  const ct = new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' });
  const hour = new Date(ct).getHours();
  return hour >= 12 || hour <= 1;
}

function isFrequentCron(cron: string): boolean {
  return cron.includes('*/2');
}

function todayParts(): { year: number; month: number; day: number } {
  const d = new Date();
  return { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() };
}

function todayString(): string {
  return new Date().toISOString().slice(0, 10);
}

// ---------------------------------------------------------------------------
// Throttled Sportradar fetch
// ---------------------------------------------------------------------------

let lastFetchTime = 0;

async function sportradarFetch<T>(
  endpoint: string,
  apiKey: string,
): Promise<{ ok: boolean; data?: T; error?: string; raw?: string }> {
  // Rate limit
  const now = Date.now();
  const elapsed = now - lastFetchTime;
  if (elapsed < THROTTLE_MS) {
    await new Promise((r) => setTimeout(r, THROTTLE_MS - elapsed));
  }
  lastFetchTime = Date.now();

  const url = `${SPORTRADAR_BASE}/${endpoint}`;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    const res = await fetch(url, {
      headers: {
        'x-api-key': apiKey,
        Accept: 'application/json',
        'User-Agent': 'BSI-Sportradar-Ingest/1.0',
      },
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (!res.ok) {
      return { ok: false, error: `HTTP ${res.status}: ${res.statusText}` };
    }

    const raw = await res.text();
    const data = JSON.parse(raw) as T;
    return { ok: true, data, raw };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Fetch failed' };
  }
}

// ---------------------------------------------------------------------------
// Payload hashing (for idempotency)
// ---------------------------------------------------------------------------

async function hashPayload(raw: string): Promise<string> {
  const encoded = new TextEncoder().encode(raw);
  const buf = await crypto.subtle.digest('SHA-256', encoded);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// ---------------------------------------------------------------------------
// D1 operations
// ---------------------------------------------------------------------------

async function upsertGame(
  db: D1Database,
  game: { id: string; scheduled: string; home_abbr: string; away_abbr: string; venue?: string; status: string },
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO sportradar_game (game_id, scheduled_start, home_team, away_team, venue, status, last_synced)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)
       ON CONFLICT(game_id) DO UPDATE SET
         status = excluded.status,
         last_synced = excluded.last_synced`,
    )
    .bind(game.id, game.scheduled, game.home_abbr, game.away_abbr, game.venue || null, game.status, new Date().toISOString())
    .run();
}

async function insertPitchEvent(
  db: D1Database,
  event: {
    id: string;
    gameId: string;
    atBatId: string;
    pitcherId: string;
    batterId: string;
    inning: number;
    half: string;
    pitchNumber: number;
    outcomeId: string;
    outcomeDesc: string;
    isChallenge: boolean;
    challengeTeam?: string;
    challengeRole?: string;
    challengeResult?: string;
    wallClock?: string;
    rawJson?: string;
  },
): Promise<void> {
  await db
    .prepare(
      `INSERT OR IGNORE INTO sportradar_pitch_event
       (id, game_id, at_bat_id, pitcher_id, batter_id, inning, half, pitch_number,
        outcome_id, outcome_desc, is_challenge, challenge_team, challenge_role, challenge_result,
        wall_clock, raw_json)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16)`,
    )
    .bind(
      event.id, event.gameId, event.atBatId, event.pitcherId, event.batterId,
      event.inning, event.half, event.pitchNumber,
      event.outcomeId, event.outcomeDesc,
      event.isChallenge ? 1 : 0,
      event.challengeTeam || null, event.challengeRole || null, event.challengeResult || null,
      event.wallClock || null, event.rawJson || null,
    )
    .run();
}

async function logIngest(
  db: D1Database,
  key: string,
  provider: string,
  gameId: string | null,
  hash: string,
): Promise<boolean> {
  // Returns true if this is a new entry (not duplicate)
  try {
    await db
      .prepare(
        `INSERT INTO sportradar_ingest_log (idempotency_key, provider, game_id, received_at, payload_hash)
         VALUES (?1, ?2, ?3, ?4, ?5)`,
      )
      .bind(key, provider, gameId, new Date().toISOString(), hash)
      .run();
    return true;
  } catch {
    // Unique constraint violation = duplicate
    return false;
  }
}

// ---------------------------------------------------------------------------
// ABS Challenge detection from PBP events
// ---------------------------------------------------------------------------

interface PBPGame {
  game?: { id?: string; home?: { abbr?: string }; away?: { abbr?: string } };
  innings?: Array<{
    number?: number;
    halfs?: Array<{
      half?: string;
      events?: Array<{
        id?: string;
        type?: string;
        at_bat?: {
          id?: string;
          hitter_id?: string;
          pitcher_id?: string;
          events?: Array<{
            id?: string;
            sequence?: number;
            outcome_id?: string;
            outcome_desc?: string;
            type?: string;
            pitcher?: { id?: string };
            hitter?: { id?: string };
            mlb_pitch_data?: Record<string, unknown>;
          }>;
        };
        wall_clock?: { value?: string };
      }>;
    }>;
  }>;
}

/**
 * Detect ABS challenge events in play-by-play data.
 *
 * Sportradar encodes challenges in the PBP event stream — look for
 * outcome descriptions containing "challenge" keywords. The exact
 * encoding may vary; we cast a wide net and refine as we see real data.
 */
function extractPitchEvents(pbp: PBPGame, gameId: string) {
  const events: Array<{
    id: string;
    gameId: string;
    atBatId: string;
    pitcherId: string;
    batterId: string;
    inning: number;
    half: string;
    pitchNumber: number;
    outcomeId: string;
    outcomeDesc: string;
    isChallenge: boolean;
    challengeTeam?: string;
    challengeRole?: string;
    challengeResult?: string;
    wallClock?: string;
    rawJson?: string;
  }> = [];

  const challengePattern = /challenge|abs|automated.*ball.*strike|robot.*ump/i;
  const overturnedPattern = /overturned|reversed|changed/i;

  for (const inning of pbp.innings || []) {
    for (const half of inning.halfs || []) {
      for (const event of half.events || []) {
        const ab = event.at_bat;
        if (!ab?.events) continue;

        for (const pitch of ab.events) {
          const outcomeDesc = pitch.outcome_desc || '';
          const isChallenge = challengePattern.test(outcomeDesc) || challengePattern.test(pitch.type || '');

          let challengeRole: string | undefined;
          let challengeResult: string | undefined;
          let challengeTeam: string | undefined;

          if (isChallenge) {
            challengeResult = overturnedPattern.test(outcomeDesc) ? 'overturned' : 'confirmed';
            // Determine role from context — the challenger is typically identified in the description
            if (/catcher/i.test(outcomeDesc)) challengeRole = 'catcher';
            else if (/hitter|batter/i.test(outcomeDesc)) challengeRole = 'hitter';
            else if (/pitcher/i.test(outcomeDesc)) challengeRole = 'pitcher';
            else challengeRole = 'unknown';

            // Determine which team challenged based on half inning
            // Top inning (T) = away team batting, so challenges could be from either side
            const homeAbbr = pbp.game?.home?.abbr || '';
            const awayAbbr = pbp.game?.away?.abbr || '';
            if (/home/i.test(outcomeDesc)) challengeTeam = homeAbbr;
            else if (/away|visiting/i.test(outcomeDesc)) challengeTeam = awayAbbr;
            else challengeTeam = half.half === 'T' ? awayAbbr : homeAbbr;
          }

          events.push({
            id: pitch.id || `${gameId}-${ab.id}-${pitch.sequence || 0}`,
            gameId,
            atBatId: ab.id || '',
            pitcherId: pitch.pitcher?.id || ab.pitcher_id || '',
            batterId: pitch.hitter?.id || ab.hitter_id || '',
            inning: inning.number || 0,
            half: half.half || '',
            pitchNumber: pitch.sequence || 0,
            outcomeId: pitch.outcome_id || '',
            outcomeDesc,
            isChallenge,
            challengeTeam,
            challengeRole,
            challengeResult,
            wallClock: event.wall_clock?.value,
            rawJson: isChallenge ? JSON.stringify(pitch) : undefined,
          });
        }
      }
    }
  }

  return events;
}

// ---------------------------------------------------------------------------
// ABS Aggregate computation → KV
// ---------------------------------------------------------------------------

async function computeAndStoreAggregates(db: D1Database, kv: KVNamespace): Promise<void> {
  // Challenges by role (all time)
  const roleRows = await db
    .prepare(
      `SELECT challenge_role as role,
              COUNT(*) as challenges,
              SUM(CASE WHEN challenge_result = 'overturned' THEN 1 ELSE 0 END) as overturned
       FROM sportradar_pitch_event
       WHERE is_challenge = 1 AND challenge_role IS NOT NULL
       GROUP BY challenge_role`,
    )
    .all();

  const challengesByRole = (roleRows.results || []).map((row: Record<string, unknown>) => ({
    role: row.role as string,
    challenges: row.challenges as number,
    overturned: row.overturned as number,
    successRate:
      (row.challenges as number) > 0
        ? Math.round(((row.overturned as number) / (row.challenges as number)) * 1000) / 10
        : 0,
  }));

  // Recent games with challenge activity
  const gameRows = await db
    .prepare(
      `SELECT g.game_id, g.scheduled_start as date, g.away_team as away, g.home_team as home,
              COUNT(*) as totalChallenges,
              SUM(CASE WHEN p.challenge_result = 'overturned' THEN 1 ELSE 0 END) as overturned
       FROM sportradar_pitch_event p
       JOIN sportradar_game g ON p.game_id = g.game_id
       WHERE p.is_challenge = 1
       GROUP BY g.game_id
       ORDER BY g.scheduled_start DESC
       LIMIT 20`,
    )
    .all();

  const recentGames = (gameRows.results || []).map((row: Record<string, unknown>) => ({
    gameId: row.game_id as string,
    date: (row.date as string).slice(0, 10),
    away: row.away as string,
    home: row.home as string,
    totalChallenges: row.totalChallenges as number,
    overturned: row.overturned as number,
    avgChallengeTime: 17.0, // Sportradar doesn't provide challenge duration; use league avg
  }));

  await kv.put(KV_KEYS.challengesByRole, JSON.stringify(challengesByRole), { expirationTtl: KV_TTL.aggregates });
  await kv.put(KV_KEYS.recentGames, JSON.stringify(recentGames), { expirationTtl: KV_TTL.aggregates });
  await kv.put(KV_KEYS.lastSync, new Date().toISOString(), { expirationTtl: KV_TTL.lastSync });
}

// ---------------------------------------------------------------------------
// Main ingestion flow
// ---------------------------------------------------------------------------

async function ingestDailyGames(env: Env): Promise<{ gamesProcessed: number; pitchesStored: number; errors: string[] }> {
  const { year, month, day } = todayParts();
  const errors: string[] = [];
  let gamesProcessed = 0;
  let pitchesStored = 0;

  // 1. Fetch daily schedule
  const m = String(month).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  const schedResult = await sportradarFetch<{ date?: string; games?: Array<Record<string, unknown>> }>(
    `games/${year}/${m}/${d}/schedule.json`,
    env.SPORTRADAR_API_KEY,
  );

  if (!schedResult.ok || !schedResult.data?.games) {
    errors.push(`Schedule fetch failed: ${schedResult.error || 'no games'}`);
    return { gamesProcessed, pitchesStored, errors };
  }

  // Archive raw schedule to R2
  if (schedResult.raw) {
    await env.R2.put(`sportradar/schedule/${year}-${m}-${d}.json`, schedResult.raw);
  }

  const games = schedResult.data.games;

  // 2. Process active/recently-finished games
  for (const game of games) {
    const gameId = game.id as string;
    const status = (game.status as string) || '';

    if (!gameId) continue;

    // Only process games that are in-progress or recently completed
    const processable = ['inprogress', 'complete', 'closed'].includes(status.toLowerCase());
    if (!processable) {
      // Still upsert game for schedule tracking
      await upsertGame(env.DB, {
        id: gameId,
        scheduled: (game.scheduled as string) || '',
        home_abbr: (game.home as { abbr?: string })?.abbr || (game.home_team as string) || '',
        away_abbr: (game.away as { abbr?: string })?.abbr || (game.away_team as string) || '',
        venue: (game.venue as { name?: string })?.name,
        status,
      });
      continue;
    }

    // Check idempotency — skip if we already ingested this game state
    const idempotencyKey = `sportradar:${gameId}:${status}`;

    // Fetch PBP
    const pbpResult = await sportradarFetch<PBPGame>(
      `games/${gameId}/pbp.json`,
      env.SPORTRADAR_API_KEY,
    );

    if (!pbpResult.ok || !pbpResult.data) {
      errors.push(`PBP fetch failed for ${gameId}: ${pbpResult.error}`);
      continue;
    }

    // Archive raw PBP to R2
    if (pbpResult.raw) {
      await env.R2.put(`sportradar/pbp/${gameId}-${Date.now()}.json`, pbpResult.raw);

      // Check idempotency with payload hash
      const payloadHash = await hashPayload(pbpResult.raw);
      const isNew = await logIngest(env.DB, `${idempotencyKey}:${payloadHash}`, 'sportradar', gameId, payloadHash);
      if (!isNew) {
        continue; // Already processed this exact payload
      }
    }

    // Upsert game record
    await upsertGame(env.DB, {
      id: gameId,
      scheduled: (game.scheduled as string) || '',
      home_abbr: (game.home as { abbr?: string })?.abbr || (game.home_team as string) || '',
      away_abbr: (game.away as { abbr?: string })?.abbr || (game.away_team as string) || '',
      venue: (game.venue as { name?: string })?.name,
      status,
    });

    // Extract and store pitch events
    const pitchEvents = extractPitchEvents(pbpResult.data, gameId);
    for (const pe of pitchEvents) {
      await insertPitchEvent(env.DB, pe);
      pitchesStored++;
    }

    gamesProcessed++;
  }

  return { gamesProcessed, pitchesStored, errors };
}

// ---------------------------------------------------------------------------
// Cron handler
// ---------------------------------------------------------------------------

export default {
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    if (!env.SPORTRADAR_API_KEY) {
      console.error('SPORTRADAR_API_KEY not configured');
      return;
    }

    const frequent = isFrequentCron(event.cron);

    // Frequent cron (*/2): only run during game hours in season
    if (frequent && (!isMLBSeason() || !isGameHours())) {
      return;
    }

    try {
      if (frequent) {
        // Full ingest: schedule → PBP → pitch events → aggregates
        const result = await ingestDailyGames(env);
        console.log(`Ingest complete: ${result.gamesProcessed} games, ${result.pitchesStored} pitches`);
        if (result.errors.length > 0) {
          console.warn('Ingest errors:', result.errors);
        }
      } else {
        // Off-hours: just check for changes/corrections
        const { year, month, day } = todayParts();
        const m = String(month).padStart(2, '0');
        const d = String(day).padStart(2, '0');
        const changesResult = await sportradarFetch<{ changes?: Array<{ game_id?: string }> }>(
          `league/${year}/${m}/${d}/changes.json`,
          env.SPORTRADAR_API_KEY,
        );

        if (changesResult.ok && changesResult.data?.changes?.length) {
          console.log(`${changesResult.data.changes.length} changes detected, triggering re-ingest`);
          await ingestDailyGames(env);
        }
      }

      // Recompute aggregates after any data changes
      ctx.waitUntil(computeAndStoreAggregates(env.DB, env.KV));
    } catch (err) {
      console.error('Sportradar ingest failed:', err);
    }
  },

  // Manual trigger via HTTP (for testing)
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/trigger') {
      if (!env.SPORTRADAR_API_KEY) {
        return new Response(JSON.stringify({ error: 'SPORTRADAR_API_KEY not configured' }), { status: 500 });
      }

      const result = await ingestDailyGames(env);
      ctx.waitUntil(computeAndStoreAggregates(env.DB, env.KV));

      return new Response(JSON.stringify({
        ...result,
        timestamp: new Date().toISOString(),
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (url.pathname === '/health') {
      const lastSync = await env.KV.get(KV_KEYS.lastSync);
      return new Response(JSON.stringify({
        status: 'ok',
        lastSync,
        season: isMLBSeason(),
        gameHours: isGameHours(),
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response('BSI Sportradar Ingest Worker', { status: 200 });
  },
};
