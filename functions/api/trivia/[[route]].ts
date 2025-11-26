/**
 * Daily Trivia Challenge API
 * GET /api/trivia/daily - Get today's trivia questions
 * POST /api/trivia/submit - Submit an answer
 * GET /api/trivia/streak - Get user's streak info
 * GET /api/trivia/leaderboard - Top players
 */

interface Env {
  DB: D1Database;
  KV: KVNamespace;
}

interface TriviaQuestion {
  id: string;
  question: string;
  options: string[];
  category: string;
  difficulty: number;
  sport: string | null;
}

interface SubmitRequest {
  questionId: string;
  selectedAnswer: string;
  responseTimeMs?: number;
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

// Generate session ID for anonymous users
function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

// Get today's date in America/Chicago
function getTodayCST(): string {
  const now = new Date();
  const cst = new Date(now.toLocaleString('en-US', { timeZone: 'America/Chicago' }));
  return cst.toISOString().split('T')[0];
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env, params } = context;
  const url = new URL(request.url);
  const route = (params.route as string[])?.join('/') || '';

  // Handle preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  try {
    // Ensure tables exist
    await ensureTables(env.DB);

    if (route === 'daily' && request.method === 'GET') {
      return await getDailyTrivia(env, url);
    }

    if (route === 'submit' && request.method === 'POST') {
      return await submitAnswer(env, request);
    }

    if (route === 'streak' && request.method === 'GET') {
      return await getStreak(env, url);
    }

    if (route === 'leaderboard' && request.method === 'GET') {
      return await getLeaderboard(env);
    }

    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: CORS_HEADERS,
    });
  } catch (error) {
    console.error('[Trivia API] Error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : String(error),
      }),
      { status: 500, headers: CORS_HEADERS }
    );
  }
};

async function ensureTables(db: D1Database): Promise<void> {
  await db.batch([
    db.prepare(`
      CREATE TABLE IF NOT EXISTS trivia_questions (
        id TEXT PRIMARY KEY,
        question TEXT NOT NULL,
        answer TEXT NOT NULL,
        options JSON NOT NULL,
        category TEXT NOT NULL,
        difficulty INTEGER NOT NULL,
        sport TEXT,
        explanation TEXT,
        source TEXT,
        active BOOLEAN DEFAULT TRUE,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `),
    db.prepare(`
      CREATE TABLE IF NOT EXISTS trivia_responses (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        question_id TEXT NOT NULL,
        selected_answer TEXT NOT NULL,
        correct INTEGER NOT NULL,
        response_time_ms INTEGER,
        session_id TEXT,
        answered_at TEXT NOT NULL
      )
    `),
    db.prepare(`
      CREATE TABLE IF NOT EXISTS trivia_streaks (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL UNIQUE,
        current_streak INTEGER DEFAULT 0,
        best_streak INTEGER DEFAULT 0,
        total_correct INTEGER DEFAULT 0,
        total_attempted INTEGER DEFAULT 0,
        last_played_date TEXT,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `),
  ]);

  // Seed initial questions if empty
  const count = await db.prepare('SELECT COUNT(*) as count FROM trivia_questions').first<{ count: number }>();
  if (count?.count === 0) {
    await seedQuestions(db);
  }
}

async function seedQuestions(db: D1Database): Promise<void> {
  const questions = [
    {
      id: 'q1',
      question: 'Which school has won the most College World Series titles?',
      answer: 'USC',
      options: JSON.stringify(['USC', 'LSU', 'Texas', 'Florida']),
      category: 'baseball',
      difficulty: 2,
      sport: 'baseball',
      explanation: 'USC has won 12 CWS titles, though they last won in 1998.',
      source: 'NCAA Records',
    },
    {
      id: 'q2',
      question: 'Who holds the MLB record for career home runs?',
      answer: 'Barry Bonds',
      options: JSON.stringify(['Barry Bonds', 'Hank Aaron', 'Babe Ruth', 'Alex Rodriguez']),
      category: 'records',
      difficulty: 1,
      sport: 'baseball',
      explanation: 'Barry Bonds hit 762 career home runs from 1986-2007.',
      source: 'Baseball-Reference',
    },
    {
      id: 'q3',
      question: 'Which SEC team won the 2024 College World Series?',
      answer: 'Texas A&M',
      options: JSON.stringify(['Texas A&M', 'Tennessee', 'Florida', 'LSU']),
      category: 'baseball',
      difficulty: 1,
      sport: 'baseball',
      explanation: 'Texas A&M defeated Tennessee 6-5 in the finals for their first CWS title.',
      source: 'NCAA Baseball',
    },
    {
      id: 'q4',
      question: 'What is the minimum number of innings in an official MLB game?',
      answer: '5',
      options: JSON.stringify(['5', '7', '9', '6']),
      category: 'baseball',
      difficulty: 2,
      sport: 'baseball',
      explanation: 'A game becomes official after 5 innings (or 4.5 if home team leads).',
      source: 'MLB Rulebook',
    },
    {
      id: 'q5',
      question: 'Which college football team has the most national championships?',
      answer: 'Alabama',
      options: JSON.stringify(['Alabama', 'Notre Dame', 'Ohio State', 'Oklahoma']),
      category: 'football',
      difficulty: 1,
      sport: 'football',
      explanation: 'Alabama claims 18 national championships.',
      source: 'NCAA Records',
    },
    {
      id: 'q6',
      question: 'What year did the College Football Playoff begin?',
      answer: '2014',
      options: JSON.stringify(['2014', '2012', '2016', '2010']),
      category: 'football',
      difficulty: 2,
      sport: 'football',
      explanation: 'The first CFP took place in the 2014 season, with Ohio State winning.',
      source: 'College Football Playoff',
    },
    {
      id: 'q7',
      question: 'Which pitcher has the most career strikeouts in MLB history?',
      answer: 'Nolan Ryan',
      options: JSON.stringify(['Nolan Ryan', 'Randy Johnson', 'Roger Clemens', 'Steve Carlton']),
      category: 'records',
      difficulty: 1,
      sport: 'baseball',
      explanation: 'Nolan Ryan recorded 5,714 career strikeouts.',
      source: 'Baseball-Reference',
    },
    {
      id: 'q8',
      question: 'How many teams are in the SEC after the 2024 expansion?',
      answer: '16',
      options: JSON.stringify(['16', '14', '18', '12']),
      category: 'football',
      difficulty: 2,
      sport: 'football',
      explanation: 'Texas and Oklahoma joined in 2024, bringing the total to 16.',
      source: 'SEC Conference',
    },
    {
      id: 'q9',
      question: "What is a 'golden sombrero' in baseball?",
      answer: 'Striking out 4 times in one game',
      options: JSON.stringify([
        'Striking out 4 times in one game',
        'Hitting for the cycle',
        'A walk-off home run',
        'Stealing 4 bases in one game',
      ]),
      category: 'history',
      difficulty: 2,
      sport: 'baseball',
      explanation: "A golden sombrero is the dubious 'achievement' of striking out 4 times in one game.",
      source: 'Baseball Terminology',
    },
    {
      id: 'q10',
      question: 'Which NBA team has won the most championships?',
      answer: 'Boston Celtics',
      options: JSON.stringify(['Boston Celtics', 'Los Angeles Lakers', 'Chicago Bulls', 'Golden State Warriors']),
      category: 'basketball',
      difficulty: 1,
      sport: 'basketball',
      explanation: 'The Celtics have won 18 NBA championships (as of 2024).',
      source: 'NBA Records',
    },
  ];

  const stmt = db.prepare(`
    INSERT INTO trivia_questions (id, question, answer, options, category, difficulty, sport, explanation, source)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  await db.batch(
    questions.map((q) =>
      stmt.bind(q.id, q.question, q.answer, q.options, q.category, q.difficulty, q.sport, q.explanation, q.source)
    )
  );
}

async function getDailyTrivia(env: Env, url: URL): Promise<Response> {
  const today = getTodayCST();
  const count = parseInt(url.searchParams.get('count') || '3', 10);
  const category = url.searchParams.get('category');

  // Try to get cached daily questions from KV
  const cacheKey = `trivia:daily:${today}:${category || 'all'}`;
  const cached = await env.KV?.get(cacheKey);

  if (cached) {
    return new Response(cached, { headers: CORS_HEADERS });
  }

  // Get random questions
  let query = `
    SELECT id, question, options, category, difficulty, sport
    FROM trivia_questions
    WHERE active = TRUE
  `;

  if (category) {
    query += ` AND category = '${category}'`;
  }

  query += ` ORDER BY RANDOM() LIMIT ${Math.min(count, 10)}`;

  const result = await env.DB.prepare(query).all<TriviaQuestion>();

  const questions = result.results?.map((q) => ({
    id: q.id,
    question: q.question,
    options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options,
    category: q.category,
    difficulty: q.difficulty,
    sport: q.sport,
  }));

  const response = {
    date: today,
    questions,
    sessionId: generateSessionId(),
    dataStamp: {
      timestamp: new Date().toISOString(),
      timezone: 'America/Chicago',
      source: 'BlazeSportsIntel.com',
    },
  };

  // Cache for 6 hours
  await env.KV?.put(cacheKey, JSON.stringify(response), { expirationTtl: 21600 });

  return new Response(JSON.stringify(response), { headers: CORS_HEADERS });
}

async function submitAnswer(env: Env, request: Request): Promise<Response> {
  const body: SubmitRequest = await request.json();

  if (!body.questionId || !body.selectedAnswer) {
    return new Response(JSON.stringify({ error: 'Missing questionId or selectedAnswer' }), {
      status: 400,
      headers: CORS_HEADERS,
    });
  }

  // Get the correct answer
  const question = await env.DB.prepare('SELECT answer, explanation, source FROM trivia_questions WHERE id = ?')
    .bind(body.questionId)
    .first<{ answer: string; explanation: string; source: string }>();

  if (!question) {
    return new Response(JSON.stringify({ error: 'Question not found' }), {
      status: 404,
      headers: CORS_HEADERS,
    });
  }

  const isCorrect = body.selectedAnswer === question.answer;
  const responseId = `resp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const now = new Date().toISOString();

  // Store response
  await env.DB.prepare(
    `
    INSERT INTO trivia_responses (id, question_id, selected_answer, correct, response_time_ms, answered_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `
  )
    .bind(responseId, body.questionId, body.selectedAnswer, isCorrect ? 1 : 0, body.responseTimeMs || null, now)
    .run();

  return new Response(
    JSON.stringify({
      correct: isCorrect,
      correctAnswer: question.answer,
      explanation: question.explanation,
      source: question.source,
      responseId,
      dataStamp: {
        timestamp: now,
        timezone: 'America/Chicago',
        source: 'BlazeSportsIntel.com',
      },
    }),
    { headers: CORS_HEADERS }
  );
}

async function getStreak(env: Env, url: URL): Promise<Response> {
  const userId = url.searchParams.get('userId');

  if (!userId) {
    return new Response(
      JSON.stringify({
        currentStreak: 0,
        bestStreak: 0,
        totalCorrect: 0,
        totalAttempted: 0,
        message: 'Sign in to track your streak!',
      }),
      { headers: CORS_HEADERS }
    );
  }

  const streak = await env.DB.prepare(
    `
    SELECT current_streak, best_streak, total_correct, total_attempted, last_played_date
    FROM trivia_streaks
    WHERE user_id = ?
  `
  )
    .bind(userId)
    .first<{
      current_streak: number;
      best_streak: number;
      total_correct: number;
      total_attempted: number;
      last_played_date: string;
    }>();

  if (!streak) {
    return new Response(
      JSON.stringify({
        currentStreak: 0,
        bestStreak: 0,
        totalCorrect: 0,
        totalAttempted: 0,
        accuracy: 0,
      }),
      { headers: CORS_HEADERS }
    );
  }

  const accuracy = streak.total_attempted > 0 ? Math.round((streak.total_correct / streak.total_attempted) * 100) : 0;

  return new Response(
    JSON.stringify({
      currentStreak: streak.current_streak,
      bestStreak: streak.best_streak,
      totalCorrect: streak.total_correct,
      totalAttempted: streak.total_attempted,
      lastPlayed: streak.last_played_date,
      accuracy,
    }),
    { headers: CORS_HEADERS }
  );
}

async function getLeaderboard(env: Env): Promise<Response> {
  const result = await env.DB.prepare(
    `
    SELECT user_id, best_streak, total_correct, total_attempted
    FROM trivia_streaks
    ORDER BY best_streak DESC, total_correct DESC
    LIMIT 10
  `
  ).all<{
    user_id: string;
    best_streak: number;
    total_correct: number;
    total_attempted: number;
  }>();

  const leaderboard =
    result.results?.map((entry, index) => ({
      rank: index + 1,
      userId: entry.user_id,
      bestStreak: entry.best_streak,
      totalCorrect: entry.total_correct,
      accuracy:
        entry.total_attempted > 0 ? Math.round((entry.total_correct / entry.total_attempted) * 100) : 0,
    })) || [];

  return new Response(
    JSON.stringify({
      leaderboard,
      updatedAt: new Date().toISOString(),
    }),
    { headers: CORS_HEADERS }
  );
}
