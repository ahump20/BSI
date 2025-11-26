/**
 * Guess the Stat API
 * GET /api/guess/daily - Get today's stat challenge
 * POST /api/guess/submit - Submit a guess
 * GET /api/guess/leaderboard - Top guessers
 */

interface Env {
  DB: D1Database;
  KV: KVNamespace;
  AI: Ai;
}

interface GuessRound {
  id: string;
  stat_type: string;
  hint_level_1: string;
  hint_level_2: string | null;
  hint_level_3: string | null;
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

function getTodayCST(): string {
  const now = new Date();
  const cst = new Date(now.toLocaleString('en-US', { timeZone: 'America/Chicago' }));
  return cst.toISOString().split('T')[0];
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env, params } = context;
  const url = new URL(request.url);
  const route = (params.route as string[])?.join('/') || '';

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  try {
    await ensureTables(env.DB);

    if (route === 'daily' && request.method === 'GET') {
      return await getDailyChallenge(env);
    }

    if (route === 'submit' && request.method === 'POST') {
      return await submitGuess(env, request);
    }

    if (route === 'leaderboard' && request.method === 'GET') {
      return await getLeaderboard(env);
    }

    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: CORS_HEADERS,
    });
  } catch (error) {
    console.error('[Guess API] Error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: CORS_HEADERS,
    });
  }
};

async function ensureTables(db: D1Database): Promise<void> {
  await db.batch([
    db.prepare(`
      CREATE TABLE IF NOT EXISTS guess_stat_rounds (
        id TEXT PRIMARY KEY,
        player_id TEXT NOT NULL,
        player_name TEXT,
        stat_type TEXT NOT NULL,
        stat_label TEXT,
        actual_value REAL NOT NULL,
        hint_level_1 TEXT NOT NULL,
        hint_level_2 TEXT,
        hint_level_3 TEXT,
        active_date TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `),
    db.prepare(`
      CREATE TABLE IF NOT EXISTS guess_stat_attempts (
        id TEXT PRIMARY KEY,
        round_id TEXT NOT NULL,
        user_id TEXT,
        guessed_value REAL NOT NULL,
        error_pct REAL NOT NULL,
        hints_used INTEGER DEFAULT 0,
        score INTEGER NOT NULL,
        created_at TEXT NOT NULL
      )
    `),
  ]);

  // Seed sample rounds if empty
  const count = await db
    .prepare('SELECT COUNT(*) as count FROM guess_stat_rounds')
    .first<{ count: number }>();
  if (count?.count === 0) {
    await seedRounds(db);
  }
}

async function seedRounds(db: D1Database): Promise<void> {
  const today = getTodayCST();
  const rounds = [
    {
      id: 'round_1',
      player_id: 'player_01',
      player_name: 'Hidden Player',
      stat_type: 'batting_avg',
      stat_label: 'Batting Average',
      actual_value: 0.312,
      hint_level_1: 'This SEC slugger was a consensus All-American in 2024.',
      hint_level_2: 'He led the conference in total bases.',
      hint_level_3: 'His team made it to the College World Series.',
      active_date: today,
    },
    {
      id: 'round_2',
      player_id: 'player_02',
      player_name: 'Hidden Player',
      stat_type: 'era',
      stat_label: 'ERA',
      actual_value: 2.45,
      hint_level_1: 'This ACC pitcher was drafted in the first round.',
      hint_level_2: 'He threw a no-hitter during his junior year.',
      hint_level_3: 'His fastball averaged 96 mph.',
      active_date: today,
    },
    {
      id: 'round_3',
      player_id: 'player_03',
      player_name: 'Hidden Player',
      stat_type: 'home_runs',
      stat_label: 'Home Runs',
      actual_value: 28,
      hint_level_1: 'This Big 12 power hitter set a school record.',
      hint_level_2: 'He transferred from a JUCO program.',
      hint_level_3: 'His team won their conference tournament.',
      active_date: today,
    },
  ];

  const stmt = db.prepare(`
    INSERT OR REPLACE INTO guess_stat_rounds
    (id, player_id, player_name, stat_type, stat_label, actual_value, hint_level_1, hint_level_2, hint_level_3, active_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  await db.batch(
    rounds.map((r) =>
      stmt.bind(
        r.id,
        r.player_id,
        r.player_name,
        r.stat_type,
        r.stat_label,
        r.actual_value,
        r.hint_level_1,
        r.hint_level_2,
        r.hint_level_3,
        r.active_date
      )
    )
  );
}

async function getDailyChallenge(env: Env): Promise<Response> {
  const today = getTodayCST();

  const result = await env.DB.prepare(
    `
    SELECT id, stat_type, stat_label, hint_level_1, hint_level_2, hint_level_3
    FROM guess_stat_rounds
    WHERE active_date = ?
    ORDER BY RANDOM()
    LIMIT 1
  `
  )
    .bind(today)
    .first<GuessRound & { stat_label: string }>();

  if (!result) {
    return new Response(
      JSON.stringify({
        available: false,
        message: 'No challenge available today. Check back tomorrow!',
      }),
      { headers: CORS_HEADERS }
    );
  }

  return new Response(
    JSON.stringify({
      available: true,
      roundId: result.id,
      statType: result.stat_type,
      statLabel: result.stat_label || formatStatType(result.stat_type),
      hints: [result.hint_level_1],
      hintsAvailable: [result.hint_level_2, result.hint_level_3].filter(Boolean).length,
      date: today,
      dataStamp: {
        timestamp: new Date().toISOString(),
        timezone: 'America/Chicago',
        source: 'BlazeSportsIntel.com',
      },
    }),
    { headers: CORS_HEADERS }
  );
}

async function submitGuess(env: Env, request: Request): Promise<Response> {
  const body = (await request.json()) as {
    roundId: string;
    guess: number;
    hintsUsed: number;
    userId?: string;
  };

  if (!body.roundId || body.guess === undefined) {
    return new Response(JSON.stringify({ error: 'Missing roundId or guess' }), {
      status: 400,
      headers: CORS_HEADERS,
    });
  }

  const round = await env.DB.prepare(
    'SELECT actual_value, player_name, stat_label FROM guess_stat_rounds WHERE id = ?'
  )
    .bind(body.roundId)
    .first<{ actual_value: number; player_name: string; stat_label: string }>();

  if (!round) {
    return new Response(JSON.stringify({ error: 'Round not found' }), {
      status: 404,
      headers: CORS_HEADERS,
    });
  }

  const errorPct = Math.abs((body.guess - round.actual_value) / round.actual_value) * 100;

  // Score calculation: 1000 base, -10 per % error, -50 per hint used
  let score = Math.max(0, Math.round(1000 - errorPct * 10 - body.hintsUsed * 50));

  // Bonus for exact match
  if (errorPct < 1) {
    score += 500;
  } else if (errorPct < 5) {
    score += 200;
  } else if (errorPct < 10) {
    score += 100;
  }

  const attemptId = `attempt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  await env.DB.prepare(
    `
    INSERT INTO guess_stat_attempts (id, round_id, user_id, guessed_value, error_pct, hints_used, score, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `
  )
    .bind(
      attemptId,
      body.roundId,
      body.userId || null,
      body.guess,
      errorPct,
      body.hintsUsed,
      score,
      new Date().toISOString()
    )
    .run();

  return new Response(
    JSON.stringify({
      correct: errorPct < 5,
      actualValue: round.actual_value,
      playerName: round.player_name,
      statLabel: round.stat_label,
      guess: body.guess,
      errorPercent: Math.round(errorPct * 10) / 10,
      score,
      rating: getRating(errorPct),
    }),
    { headers: CORS_HEADERS }
  );
}

function getRating(errorPct: number): string {
  if (errorPct < 1) return 'Perfect!';
  if (errorPct < 5) return 'Excellent!';
  if (errorPct < 10) return 'Great!';
  if (errorPct < 20) return 'Good';
  if (errorPct < 30) return 'Close';
  return 'Keep Trying';
}

function formatStatType(type: string): string {
  const map: Record<string, string> = {
    batting_avg: 'Batting Average',
    era: 'ERA',
    home_runs: 'Home Runs',
    strikeouts: 'Strikeouts',
    rbi: 'RBIs',
    wins: 'Wins',
  };
  return map[type] || type;
}

async function getLeaderboard(env: Env): Promise<Response> {
  const result = await env.DB.prepare(
    `
    SELECT user_id, SUM(score) as total_score, COUNT(*) as attempts, AVG(error_pct) as avg_error
    FROM guess_stat_attempts
    WHERE user_id IS NOT NULL
    GROUP BY user_id
    ORDER BY total_score DESC
    LIMIT 10
  `
  ).all<{
    user_id: string;
    total_score: number;
    attempts: number;
    avg_error: number;
  }>();

  const leaderboard =
    result.results?.map((entry, index) => ({
      rank: index + 1,
      userId: entry.user_id,
      totalScore: entry.total_score,
      attempts: entry.attempts,
      avgError: Math.round(entry.avg_error * 10) / 10,
    })) || [];

  return new Response(JSON.stringify({ leaderboard }), { headers: CORS_HEADERS });
}
