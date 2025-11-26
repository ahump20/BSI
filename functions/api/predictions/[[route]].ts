/**
 * Beat the Line - Predictions API
 * GET /api/predictions/props - Get today's props
 * POST /api/predictions/submit - Submit a prediction
 * GET /api/predictions/history - User's prediction history
 * GET /api/predictions/leaderboard - Top predictors
 */

interface Env {
  DB: D1Database;
  KV: KVNamespace;
}

interface Prop {
  id: string;
  sport: string;
  prop_type: string;
  description: string;
  line_value: number;
  expires_at: string;
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

    if (route === 'props' && request.method === 'GET') {
      return await getProps(env, url);
    }

    if (route === 'submit' && request.method === 'POST') {
      return await submitPrediction(env, request);
    }

    if (route === 'history' && request.method === 'GET') {
      return await getHistory(env, url);
    }

    if (route === 'leaderboard' && request.method === 'GET') {
      return await getLeaderboard(env);
    }

    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: CORS_HEADERS,
    });
  } catch (error) {
    console.error('[Predictions API] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: CORS_HEADERS }
    );
  }
};

async function ensureTables(db: D1Database): Promise<void> {
  await db.batch([
    db.prepare(`
      CREATE TABLE IF NOT EXISTS prediction_props (
        id TEXT PRIMARY KEY,
        sport TEXT NOT NULL,
        prop_type TEXT NOT NULL,
        description TEXT NOT NULL,
        line_value REAL,
        game_id TEXT,
        player_id TEXT,
        expires_at TEXT NOT NULL,
        result TEXT,
        actual_value REAL,
        source TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `),
    db.prepare(`
      CREATE TABLE IF NOT EXISTS user_predictions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        prop_id TEXT NOT NULL,
        prediction TEXT NOT NULL,
        confidence INTEGER,
        result TEXT,
        points_earned INTEGER DEFAULT 0,
        created_at TEXT NOT NULL
      )
    `),
  ]);

  // Seed sample props if empty
  const count = await db.prepare('SELECT COUNT(*) as count FROM prediction_props WHERE expires_at > datetime("now")').first<{ count: number }>();
  if (count?.count === 0) {
    await seedProps(db);
  }
}

async function seedProps(db: D1Database): Promise<void> {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const expiresAt = tomorrow.toISOString();

  const props = [
    {
      id: 'prop_1',
      sport: 'baseball',
      prop_type: 'over_under',
      description: 'Total runs in today\'s Texas vs. Texas A&M game',
      line_value: 8.5,
      expires_at: expiresAt,
      source: 'BlazeSportsIntel',
    },
    {
      id: 'prop_2',
      sport: 'baseball',
      prop_type: 'player_prop',
      description: 'Jac Caglianone strikeouts',
      line_value: 7.5,
      expires_at: expiresAt,
      source: 'BlazeSportsIntel',
    },
    {
      id: 'prop_3',
      sport: 'football',
      prop_type: 'spread',
      description: 'Alabama vs. Georgia point spread',
      line_value: -3.5,
      expires_at: expiresAt,
      source: 'BlazeSportsIntel',
    },
    {
      id: 'prop_4',
      sport: 'baseball',
      prop_type: 'over_under',
      description: 'Combined hits in SEC Championship',
      line_value: 15.5,
      expires_at: expiresAt,
      source: 'BlazeSportsIntel',
    },
    {
      id: 'prop_5',
      sport: 'basketball',
      prop_type: 'player_prop',
      description: 'Ja Morant total points',
      line_value: 24.5,
      expires_at: expiresAt,
      source: 'BlazeSportsIntel',
    },
  ];

  const stmt = db.prepare(`
    INSERT OR REPLACE INTO prediction_props (id, sport, prop_type, description, line_value, expires_at, source)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  await db.batch(
    props.map((p) => stmt.bind(p.id, p.sport, p.prop_type, p.description, p.line_value, p.expires_at, p.source))
  );
}

async function getProps(env: Env, url: URL): Promise<Response> {
  const sport = url.searchParams.get('sport');

  let query = `
    SELECT id, sport, prop_type, description, line_value, expires_at
    FROM prediction_props
    WHERE expires_at > datetime('now')
  `;

  if (sport) {
    query += ` AND sport = '${sport}'`;
  }

  query += ` ORDER BY expires_at ASC LIMIT 20`;

  const result = await env.DB.prepare(query).all<Prop>();

  const props = result.results?.map((p) => ({
    id: p.id,
    sport: p.sport,
    type: p.prop_type,
    description: p.description,
    line: p.line_value,
    expiresAt: p.expires_at,
  })) || [];

  return new Response(
    JSON.stringify({
      props,
      date: getTodayCST(),
      dataStamp: {
        timestamp: new Date().toISOString(),
        timezone: 'America/Chicago',
        source: 'BlazeSportsIntel.com',
      },
    }),
    { headers: CORS_HEADERS }
  );
}

async function submitPrediction(env: Env, request: Request): Promise<Response> {
  const body = await request.json() as {
    propId: string;
    prediction: 'over' | 'under' | 'home' | 'away';
    confidence?: number;
    userId?: string;
  };

  if (!body.propId || !body.prediction) {
    return new Response(JSON.stringify({ error: 'Missing propId or prediction' }), {
      status: 400,
      headers: CORS_HEADERS,
    });
  }

  // Verify prop exists and hasn't expired
  const prop = await env.DB.prepare(
    'SELECT id, description, expires_at FROM prediction_props WHERE id = ? AND expires_at > datetime("now")'
  )
    .bind(body.propId)
    .first<{ id: string; description: string; expires_at: string }>();

  if (!prop) {
    return new Response(JSON.stringify({ error: 'Prop not found or expired' }), {
      status: 404,
      headers: CORS_HEADERS,
    });
  }

  // Check if user already predicted this prop
  if (body.userId) {
    const existing = await env.DB.prepare(
      'SELECT id FROM user_predictions WHERE user_id = ? AND prop_id = ?'
    )
      .bind(body.userId, body.propId)
      .first();

    if (existing) {
      return new Response(JSON.stringify({ error: 'Already submitted prediction for this prop' }), {
        status: 400,
        headers: CORS_HEADERS,
      });
    }
  }

  const predictionId = `pred_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const userId = body.userId || `anon_${Math.random().toString(36).substring(2, 11)}`;

  await env.DB.prepare(`
    INSERT INTO user_predictions (id, user_id, prop_id, prediction, confidence, result, created_at)
    VALUES (?, ?, ?, ?, ?, 'pending', ?)
  `)
    .bind(predictionId, userId, body.propId, body.prediction, body.confidence || 3, new Date().toISOString())
    .run();

  return new Response(
    JSON.stringify({
      success: true,
      predictionId,
      message: `Prediction submitted: ${body.prediction.toUpperCase()} on "${prop.description}"`,
      expiresAt: prop.expires_at,
    }),
    { headers: CORS_HEADERS }
  );
}

async function getHistory(env: Env, url: URL): Promise<Response> {
  const userId = url.searchParams.get('userId');

  if (!userId) {
    return new Response(JSON.stringify({ error: 'userId required' }), {
      status: 400,
      headers: CORS_HEADERS,
    });
  }

  const result = await env.DB.prepare(`
    SELECT
      up.id, up.prediction, up.confidence, up.result, up.points_earned, up.created_at,
      pp.description, pp.line_value, pp.sport, pp.actual_value
    FROM user_predictions up
    JOIN prediction_props pp ON up.prop_id = pp.id
    WHERE up.user_id = ?
    ORDER BY up.created_at DESC
    LIMIT 50
  `)
    .bind(userId)
    .all<{
      id: string;
      prediction: string;
      confidence: number;
      result: string;
      points_earned: number;
      created_at: string;
      description: string;
      line_value: number;
      sport: string;
      actual_value: number | null;
    }>();

  const history = result.results?.map((h) => ({
    id: h.id,
    sport: h.sport,
    description: h.description,
    line: h.line_value,
    prediction: h.prediction,
    confidence: h.confidence,
    result: h.result,
    actualValue: h.actual_value,
    pointsEarned: h.points_earned,
    createdAt: h.created_at,
  })) || [];

  // Calculate stats
  const total = history.length;
  const correct = history.filter((h) => h.result === 'correct').length;
  const pending = history.filter((h) => h.result === 'pending').length;

  return new Response(
    JSON.stringify({
      history,
      stats: {
        total,
        correct,
        incorrect: total - correct - pending,
        pending,
        accuracy: total - pending > 0 ? Math.round((correct / (total - pending)) * 100) : 0,
      },
    }),
    { headers: CORS_HEADERS }
  );
}

async function getLeaderboard(env: Env): Promise<Response> {
  const result = await env.DB.prepare(`
    SELECT
      user_id,
      COUNT(*) as total_predictions,
      SUM(CASE WHEN result = 'correct' THEN 1 ELSE 0 END) as correct,
      SUM(points_earned) as total_points
    FROM user_predictions
    WHERE result IN ('correct', 'incorrect')
    GROUP BY user_id
    HAVING total_predictions >= 5
    ORDER BY total_points DESC
    LIMIT 20
  `).all<{
    user_id: string;
    total_predictions: number;
    correct: number;
    total_points: number;
  }>();

  const leaderboard = result.results?.map((entry, index) => ({
    rank: index + 1,
    userId: entry.user_id,
    predictions: entry.total_predictions,
    correct: entry.correct,
    accuracy: Math.round((entry.correct / entry.total_predictions) * 100),
    points: entry.total_points,
  })) || [];

  return new Response(
    JSON.stringify({ leaderboard }),
    { headers: CORS_HEADERS }
  );
}
