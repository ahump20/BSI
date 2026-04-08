import type { ScheduledController } from '@cloudflare/workers-types';
import { Hono } from 'hono';
import { securityMiddleware } from '../shared/security';

type PushType = 'score_update' | 'article';

interface PushRegistrationBody {
  expoPushToken: string;
  favoriteTeams: string[];
}

interface NormalizedGame {
  gameId: string;
  sport: string;
  status: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
}

interface CachedScoresPayload {
  games?: unknown[];
  data?: unknown[];
}

interface Env {
  DB: D1Database;
  BSI_PROD_DB: D1Database;
  BSI_PROD_CACHE: KVNamespace;
  BSI_KEYS: KVNamespace;
  RATE_LIMIT_KV: KVNamespace;
}

const app = new Hono<{ Bindings: Env }>();

app.use('*', securityMiddleware);

app.use('*', async (c, next) => {
  if (c.req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  await next();

  c.header('Access-Control-Allow-Origin', '*');
  c.header('Vary', 'Origin');
});

function asNonEmptyString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === 'string' ? item.trim().toUpperCase() : ''))
    .filter((item) => item.length > 0)
    .slice(0, 25);
}

function parseRegisterBody(body: unknown): PushRegistrationBody | null {
  if (!body || typeof body !== 'object') return null;

  const source = body as Record<string, unknown>;
  const expoPushToken = asNonEmptyString(source.expoPushToken);
  const favoriteTeams = asStringArray(source.favoriteTeams);

  if (!expoPushToken) return null;
  if (!expoPushToken.startsWith('ExponentPushToken[') && !expoPushToken.startsWith('ExpoPushToken[')) return null;

  return { expoPushToken, favoriteTeams };
}

function getTextField(record: Record<string, unknown>, candidates: string[]): string {
  for (const key of candidates) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (typeof value === 'number') return String(value);
  }
  return '';
}

function getNumberField(record: Record<string, unknown>, candidates: string[]): number {
  for (const key of candidates) {
    const value = record[key];
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string') {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return 0;
}

function normalizeGame(raw: unknown): NormalizedGame | null {
  if (!raw || typeof raw !== 'object') return null;
  const game = raw as Record<string, unknown>;

  const gameId = getTextField(game, ['gameId', 'id', 'eventId']);
  const sport = getTextField(game, ['sport', 'league']).toLowerCase();
  const status = getTextField(game, ['status', 'gameStatus', 'displayStatus']).toLowerCase();

  const homeTeam = getTextField(game, ['homeTeamAbbr', 'home_abbr', 'homeTeam', 'home_name']);
  const awayTeam = getTextField(game, ['awayTeamAbbr', 'away_abbr', 'awayTeam', 'away_name']);
  const homeScore = getNumberField(game, ['homeScore', 'home_score']);
  const awayScore = getNumberField(game, ['awayScore', 'away_score']);

  if (!gameId || !sport || !homeTeam || !awayTeam) return null;

  return { gameId, sport, status, homeTeam, awayTeam, homeScore, awayScore };
}

function getLeader(game: NormalizedGame): string {
  if (game.homeScore === game.awayScore) return 'tie';
  return game.homeScore > game.awayScore ? game.homeTeam : game.awayTeam;
}

function isLiveStatus(status: string): boolean {
  return ['live', 'in_progress', 'in progress', 'ongoing'].some((token) => status.includes(token));
}

function isFinalStatus(status: string): boolean {
  return ['final', 'completed'].some((token) => status.includes(token));
}

async function readState(env: Env, gameId: string): Promise<NormalizedGame | null> {
  const value = await env.BSI_PROD_CACHE.get(`push:last:${gameId}`);
  if (!value) return null;

  try {
    const parsed = JSON.parse(value) as NormalizedGame;
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed;
  } catch {
    return null;
  }
}

async function writeState(env: Env, game: NormalizedGame): Promise<void> {
  await env.BSI_PROD_CACHE.put(`push:last:${game.gameId}`, JSON.stringify(game), {
    expirationTtl: 60 * 60 * 24,
  });
}

function buildPushBody(game: NormalizedGame, trigger: 'game_start' | 'lead_change' | 'final'): { title: string; body: string } {
  const score = `${game.awayTeam} ${game.awayScore} - ${game.homeTeam} ${game.homeScore}`;

  if (trigger === 'game_start') {
    return {
      title: `${game.awayTeam} at ${game.homeTeam} is live`,
      body: `Game start: ${score}`,
    };
  }

  if (trigger === 'final') {
    return {
      title: 'Final score update',
      body: score,
    };
  }

  return {
    title: 'Lead change alert',
    body: score,
  };
}

async function isRateLimited(env: Env, token: string, gameId: string, now: number): Promise<boolean> {
  const key = `push:rate:${token}:${gameId}`;
  const existing = await env.RATE_LIMIT_KV.get(key);
  if (existing) return true;
  await env.RATE_LIMIT_KV.put(key, String(now), { expirationTtl: 60 * 15 });
  return false;
}

async function sendExpoPush(token: string, title: string, body: string, data: { type: PushType; id: string; sport: string }): Promise<void> {
  const response = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ to: token, sound: 'default', title, body, data }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Expo push failed: ${response.status} ${text}`);
  }
}

app.post('/api/push/register', async (c) => {
  try {
    const payload = parseRegisterBody(await c.req.json());
    if (!payload) {
      return c.json({ error: 'Invalid payload' }, 400);
    }

    const favoriteTeamsJson = JSON.stringify(payload.favoriteTeams);

    await c.env.DB.prepare(
      `INSERT INTO push_registrations (expo_push_token, favorite_teams, platform, created_at, updated_at)
       VALUES (?, ?, 'ios', datetime('now'), datetime('now'))
       ON CONFLICT(expo_push_token) DO UPDATE SET
         favorite_teams = excluded.favorite_teams,
         updated_at = datetime('now')`
    ).bind(payload.expoPushToken, favoriteTeamsJson).run();

    return c.json({ ok: true }, 200);
  } catch (error) {
    console.error('[bsi-push-notifications] register failed', error);
    return c.json({ error: 'Registration failed' }, 500);
  }
});

app.post('/api/push/send', async (c) => {
  const authHeader = c.req.header('Authorization') ?? '';
  const secret = await c.env.BSI_KEYS.get('PUSH_INTERNAL_SECRET');

  if (!secret || authHeader !== `Bearer ${secret}`) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const body = await c.req.json() as { title?: unknown; body?: unknown; data?: unknown; token?: unknown };

    const token = asNonEmptyString(body.token);
    const title = asNonEmptyString(body.title);
    const messageBody = asNonEmptyString(body.body);

    if (!token || !title || !messageBody || typeof body.data !== 'object' || body.data === null) {
      return c.json({ error: 'Invalid payload' }, 400);
    }

    const dataRecord = body.data as Record<string, unknown>;
    const type = dataRecord.type === 'article' ? 'article' : 'score_update';
    const id = asNonEmptyString(dataRecord.id);
    const sport = asNonEmptyString(dataRecord.sport) ?? 'unknown';

    if (!id) {
      return c.json({ error: 'Invalid payload' }, 400);
    }

    await sendExpoPush(token, title, messageBody, { type, id, sport });
    return c.json({ ok: true }, 200);
  } catch (error) {
    console.error('[bsi-push-notifications] direct send failed', error);
    return c.json({ error: 'Send failed' }, 500);
  }
});

app.get('/health', (c) => c.json({ ok: true, service: 'bsi-push-notifications' }));

async function runScheduledTask(env: Env): Promise<void> {
  try {
    const response = await fetch('https://blazesportsintel.com/api/scores/cached');
    if (!response.ok) throw new Error(`scores fetch failed (${response.status})`);

    const payload = await response.json() as CachedScoresPayload;
    const rows = Array.isArray(payload.games) ? payload.games : Array.isArray(payload.data) ? payload.data : [];
    const games = rows.map(normalizeGame).filter((g): g is NormalizedGame => g !== null);

    if (!games.length) return;

    const registrationsRaw = await env.DB.prepare(
      'SELECT expo_push_token, favorite_teams FROM push_registrations WHERE platform = ?'
    ).bind('ios').all();

    const registrations = registrationsRaw.results as Array<{ expo_push_token: string; favorite_teams: string }>;
    if (!registrations.length) return;

    const now = Date.now();

    for (const game of games) {
      const previous = await readState(env, game.gameId);
      await writeState(env, game);

      let trigger: 'game_start' | 'lead_change' | 'final' | null = null;

      if (!previous && isLiveStatus(game.status)) {
        trigger = 'game_start';
      } else if (previous && !isFinalStatus(previous.status) && isFinalStatus(game.status)) {
        trigger = 'final';
      } else if (previous && getLeader(previous) !== getLeader(game) && getLeader(game) !== 'tie') {
        trigger = 'lead_change';
      }

      if (!trigger) continue;

      const pushContent = buildPushBody(game, trigger);

      for (const registration of registrations) {
        let favorites: string[] = [];
        try {
          const parsed = JSON.parse(registration.favorite_teams) as unknown;
          favorites = asStringArray(parsed);
        } catch {
          favorites = [];
        }

        const matchesTeam = favorites.length === 0
          ? false
          : favorites.includes(game.homeTeam.toUpperCase()) || favorites.includes(game.awayTeam.toUpperCase());

        if (!matchesTeam) continue;

        const rateLimited = await isRateLimited(env, registration.expo_push_token, game.gameId, now);
        if (rateLimited) continue;

        try {
          await sendExpoPush(registration.expo_push_token, pushContent.title, pushContent.body, {
            type: 'score_update',
            id: game.gameId,
            sport: game.sport,
          });
        } catch (error) {
          console.error('[bsi-push-notifications] scheduled send failed', error);
        }
      }
    }
  } catch (error) {
    console.error('[bsi-push-notifications] scheduled task failed', error);
  }
}

const worker: ExportedHandler<Env> = {
  fetch: app.fetch,
  scheduled: (event: ScheduledController, env: Env, ctx: ExecutionContext) => {
    void event;
    ctx.waitUntil((async () => {
      await runScheduledTask(env);
    })());
  },
};

export default worker;
