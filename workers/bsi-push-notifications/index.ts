interface Env {
  DB: D1Database;
  CACHE: KVNamespace;
  EXPO_PUSH_URL: string;
  RATE_LIMIT_MINUTES: string;
  ENVIRONMENT: string;
}

interface PushRegistration {
  id: string;
  expo_token: string;
  platform: string;
  favorite_teams: string;
  active_sports: string;
  enabled: number;
}

interface ExpoPushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: string;
  badge?: number;
  categoryId?: string;
}

interface ScoreGame {
  id: string;
  sport?: string;
  status?: string;
  homeTeam?: { name?: string; abbreviation?: string; score?: number };
  awayTeam?: { name?: string; abbreviation?: string; score?: number };
}

// ── Registration Handler ──────────────────────────────────────
async function handleRegister(request: Request, env: Env): Promise<Response> {
  try {
    const body = (await request.json()) as {
      token?: string;
      favoriteTeams?: string[];
      activeSports?: string[];
    };

    if (!body.token || !body.token.startsWith('ExponentPushToken[')) {
      return new Response(
        JSON.stringify({ error: 'Invalid Expo push token' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const favoriteTeams = JSON.stringify(body.favoriteTeams ?? []);
    const activeSports = JSON.stringify(
      body.activeSports ?? [
        'college-baseball',
        'mlb',
        'nfl',
        'cfb',
        'nba',
      ],
    );

    await env.DB.prepare(
      `INSERT INTO push_registrations (expo_token, favorite_teams, active_sports)
       VALUES (?, ?, ?)
       ON CONFLICT(expo_token) DO UPDATE SET
         favorite_teams = excluded.favorite_teams,
         active_sports = excluded.active_sports,
         enabled = 1,
         updated_at = datetime('now')`,
    )
      .bind(body.token, favoriteTeams, activeSports)
      .run();

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// ── Internal Send Handler ─────────────────────────────────────
async function handleSend(request: Request, env: Env): Promise<Response> {
  const adminKey = request.headers.get('X-Admin-Key');
  if (!adminKey) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = (await request.json()) as {
      title: string;
      body: string;
      data?: Record<string, unknown>;
      sport?: string;
    };

    const registrations = await env.DB.prepare(
      'SELECT * FROM push_registrations WHERE enabled = 1',
    )
      .all<PushRegistration>();

    const targets = registrations.results.filter((reg) => {
      if (!body.sport) return true;
      const sports: string[] = JSON.parse(reg.active_sports);
      return sports.includes(body.sport);
    });

    const messages: ExpoPushMessage[] = targets.map((reg) => ({
      to: reg.expo_token,
      title: body.title,
      body: body.body,
      data: body.data,
      sound: 'default',
    }));

    if (messages.length > 0) {
      await sendExpoPush(messages, env);
    }

    return new Response(
      JSON.stringify({ success: true, sent: messages.length }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// ── Expo Push Sender ──────────────────────────────────────────
async function sendExpoPush(
  messages: ExpoPushMessage[],
  env: Env,
): Promise<void> {
  // Expo recommends batches of 100
  const batchSize = 100;
  for (let i = 0; i < messages.length; i += batchSize) {
    const batch = messages.slice(i, i + batchSize);
    await fetch(env.EXPO_PUSH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(batch),
    });
  }
}

// ── Rate Limiter ──────────────────────────────────────────────
async function isRateLimited(
  env: Env,
  registrationId: string,
  gameId: string,
): Promise<boolean> {
  const minutes = parseInt(env.RATE_LIMIT_MINUTES, 10) || 15;
  const cutoff = new Date(Date.now() - minutes * 60 * 1000).toISOString();

  const result = await env.DB.prepare(
    `SELECT COUNT(*) as count FROM push_send_log
     WHERE registration_id = ? AND game_id = ? AND sent_at > ?`,
  )
    .bind(registrationId, gameId, cutoff)
    .first<{ count: number }>();

  return (result?.count ?? 0) > 0;
}

async function logSend(
  env: Env,
  registrationId: string,
  gameId: string,
): Promise<void> {
  await env.DB.prepare(
    'INSERT INTO push_send_log (registration_id, game_id) VALUES (?, ?)',
  )
    .bind(registrationId, gameId)
    .run();
}

// ── Scheduled Handler (cron) ──────────────────────────────────
async function handleScheduled(env: Env): Promise<void> {
  // Fetch live scores from cache
  const cachedScores = await env.CACHE.get('scores:overview', 'json') as
    | Record<string, ScoreGame[]>
    | null;

  if (!cachedScores) return;

  // Find live games
  const liveGames: ScoreGame[] = [];
  for (const games of Object.values(cachedScores)) {
    if (Array.isArray(games)) {
      liveGames.push(
        ...games.filter(
          (g) => g.status === 'live' || g.status === 'in_progress',
        ),
      );
    }
  }

  if (liveGames.length === 0) return;

  // Get all active registrations
  const registrations = await env.DB.prepare(
    'SELECT * FROM push_registrations WHERE enabled = 1',
  )
    .all<PushRegistration>();

  if (registrations.results.length === 0) return;

  const messages: ExpoPushMessage[] = [];

  for (const game of liveGames) {
    const home = game.homeTeam?.name ?? game.homeTeam?.abbreviation ?? 'Home';
    const away = game.awayTeam?.name ?? game.awayTeam?.abbreviation ?? 'Away';
    const homeScore = game.homeTeam?.score ?? 0;
    const awayScore = game.awayTeam?.score ?? 0;

    for (const reg of registrations.results) {
      // Check sport filter
      const activeSports: string[] = JSON.parse(reg.active_sports);
      if (game.sport && !activeSports.includes(game.sport)) continue;

      // Check rate limit
      const limited = await isRateLimited(env, reg.id, game.id);
      if (limited) continue;

      messages.push({
        to: reg.expo_token,
        title: `${away} @ ${home}`,
        body: `${away} ${awayScore} - ${home} ${homeScore}`,
        data: {
          gameId: game.id,
          sport: game.sport ?? '',
          type: 'live_score',
        },
        sound: 'default',
      });

      await logSend(env, reg.id, game.id);
    }
  }

  if (messages.length > 0) {
    await sendExpoPush(messages, env);
  }
}

// ── CORS ──────────────────────────────────────────────────────
function corsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Key, X-BSI-Key',
  };
}

// ── Worker Export ─────────────────────────────────────────────
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }

    const url = new URL(request.url);

    if (url.pathname === '/api/push/register' && request.method === 'POST') {
      const response = await handleRegister(request, env);
      const headers = new Headers(response.headers);
      for (const [k, v] of Object.entries(corsHeaders())) headers.set(k, v);
      return new Response(response.body, {
        status: response.status,
        headers,
      });
    }

    if (url.pathname === '/api/push/send' && request.method === 'POST') {
      const response = await handleSend(request, env);
      const headers = new Headers(response.headers);
      for (const [k, v] of Object.entries(corsHeaders())) headers.set(k, v);
      return new Response(response.body, {
        status: response.status,
        headers,
      });
    }

    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    });
  },

  async scheduled(
    _event: ScheduledEvent,
    env: Env,
    _ctx: ExecutionContext,
  ): Promise<void> {
    await handleScheduled(env);
  },
};
