/**
 * BSI Game Backend Worker
 *
 * Mobile backyard baseball game API with D1, KV, and R2 integration.
 * Handles game saves, leaderboards, characters, stadiums, and match results.
 *
 * @module bsi-game-backend
 */

import { z } from 'zod';

// ============================================
// Type Definitions
// ============================================

interface Env {
  DB: D1Database;
  CACHE: KVNamespace;
  ASSETS: R2Bucket;
  RATE_LIMIT_SECRET: string;
}

interface User {
  id: string;
  username: string;
  created_at: string;
  last_played: string;
}

interface Progress {
  user_id: string;
  unlocked_characters: string[];
  unlocked_stadiums: string[];
  coins: number;
  total_games: number;
  total_wins: number;
  season_progress: SeasonProgress;
}

interface SeasonProgress {
  current_season: number;
  games_played: number;
  wins: number;
  losses: number;
  championship_wins: number;
}

interface Match {
  id: string;
  user_id: string;
  opponent_type: 'cpu' | 'player';
  user_score: number;
  opponent_score: number;
  stadium: string;
  played_at: string;
}

interface LeaderboardEntry {
  user_id: string;
  username: string;
  category: string;
  score: number;
  updated_at: string;
  rank?: number;
}

interface Character {
  id: string;
  name: string;
  emoji: string;
  age: number;
  hometown: string;
  bio: string;
  stats: CharacterStats;
  ability: CharacterAbility;
  colors: { primary: string; secondary: string };
  unlockCondition: string;
  spriteUrl?: string;
}

interface CharacterStats {
  power: number;
  contact: number;
  speed: number;
  fielding: number;
  pitching: number;
}

interface CharacterAbility {
  name: string;
  description: string;
  cooldown: number;
}

interface Stadium {
  id: string;
  name: string;
  location: string;
  description: string;
  theme: string;
  environment: StadiumEnvironment;
  dimensions: StadiumDimensions;
  features: StadiumFeature[];
  weather: StadiumWeather;
  unlockCondition: string;
  imageUrl?: string;
}

interface StadiumEnvironment {
  background: string;
  grass: string;
  dirt: string;
  fence: string;
}

interface StadiumDimensions {
  leftField: number;
  centerField: number;
  rightField: number;
}

interface StadiumFeature {
  type: string;
  name: string;
  position: { x: number; y: number };
  effect: string;
}

interface StadiumWeather {
  wind: { x: number; y: number };
  temperature: number;
  condition: string;
}

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

// ============================================
// Zod Validation Schemas
// ============================================

const UserIdSchema = z.string().uuid();

const SaveGameSchema = z.object({
  userId: z.string().uuid(),
  username: z
    .string()
    .min(3)
    .max(20)
    .regex(/^[a-zA-Z0-9_]+$/),
  progress: z.object({
    unlocked_characters: z.array(z.string()).default([]),
    unlocked_stadiums: z.array(z.string()).default([]),
    coins: z.number().int().min(0).default(0),
    total_games: z.number().int().min(0).default(0),
    total_wins: z.number().int().min(0).default(0),
    season_progress: z
      .object({
        current_season: z.number().int().min(1).default(1),
        games_played: z.number().int().min(0).default(0),
        wins: z.number().int().min(0).default(0),
        losses: z.number().int().min(0).default(0),
        championship_wins: z.number().int().min(0).default(0),
      })
      .default({
        current_season: 1,
        games_played: 0,
        wins: 0,
        losses: 0,
        championship_wins: 0,
      }),
  }),
});

const LeaderboardSubmitSchema = z.object({
  userId: z.string().uuid(),
  category: z.enum(['wins', 'home_runs', 'season', 'total_score']),
  score: z.number().int().min(0),
});

const MatchResultSchema = z.object({
  userId: z.string().uuid(),
  opponentType: z.enum(['cpu', 'player']),
  userScore: z.number().int().min(0).max(99),
  opponentScore: z.number().int().min(0).max(99),
  stadium: z.string(),
  matchStats: z
    .object({
      hits: z.number().int().min(0).optional(),
      homeRuns: z.number().int().min(0).optional(),
      strikeouts: z.number().int().min(0).optional(),
      innings: z.number().int().min(1).max(9).optional(),
    })
    .optional(),
});

// ============================================
// Rate Limiting
// ============================================

class RateLimiter {
  private cache: KVNamespace;
  private maxRequests: number;
  private windowSeconds: number;

  constructor(cache: KVNamespace, maxRequests = 60, windowSeconds = 60) {
    this.cache = cache;
    this.maxRequests = maxRequests;
    this.windowSeconds = windowSeconds;
  }

  async isAllowed(clientId: string): Promise<{ allowed: boolean; remaining: number }> {
    const key = `rate_limit:game:${clientId}`;
    const current = await this.cache.get(key);
    const count = current ? parseInt(current, 10) : 0;

    if (count >= this.maxRequests) {
      return { allowed: false, remaining: 0 };
    }

    await this.cache.put(key, String(count + 1), {
      expirationTtl: this.windowSeconds,
    });

    return { allowed: true, remaining: this.maxRequests - count - 1 };
  }
}

// ============================================
// CORS Headers
// ============================================

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-ID',
  'Access-Control-Max-Age': '86400',
};

function corsResponse(response: Response): Response {
  const headers = new Headers(response.headers);
  Object.entries(CORS_HEADERS).forEach(([key, value]) => {
    headers.set(key, value);
  });
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

// ============================================
// Response Helpers
// ============================================

function jsonResponse<T>(data: T, status = 200): Response {
  const response: ApiResponse<T> = {
    success: status >= 200 && status < 300,
    data,
    timestamp: new Date().toISOString(),
  };
  return corsResponse(
    new Response(JSON.stringify(response), {
      status,
      headers: { 'Content-Type': 'application/json' },
    })
  );
}

function errorResponse(message: string, status = 400): Response {
  const response: ApiResponse = {
    success: false,
    error: message,
    timestamp: new Date().toISOString(),
  };
  return corsResponse(
    new Response(JSON.stringify(response), {
      status,
      headers: { 'Content-Type': 'application/json' },
    })
  );
}

// ============================================
// Database Operations
// ============================================

async function initializeDatabase(db: D1Database): Promise<void> {
  // Users table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      last_played TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  // Progress table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS progress (
      user_id TEXT PRIMARY KEY REFERENCES users(id),
      unlocked_characters TEXT DEFAULT '[]',
      unlocked_stadiums TEXT DEFAULT '[]',
      coins INTEGER DEFAULT 0,
      total_games INTEGER DEFAULT 0,
      total_wins INTEGER DEFAULT 0,
      season_progress TEXT DEFAULT '{}'
    )
  `);

  // Matches table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS matches (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      opponent_type TEXT NOT NULL CHECK(opponent_type IN ('cpu', 'player')),
      user_score INTEGER NOT NULL,
      opponent_score INTEGER NOT NULL,
      stadium TEXT NOT NULL,
      played_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  // Leaderboard table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS leaderboard (
      user_id TEXT NOT NULL REFERENCES users(id),
      category TEXT NOT NULL CHECK(category IN ('wins', 'home_runs', 'season', 'total_score')),
      score INTEGER NOT NULL,
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (user_id, category)
    )
  `);

  // Indexes for performance
  await db.exec(`CREATE INDEX IF NOT EXISTS idx_matches_user_id ON matches(user_id)`);
  await db.exec(
    `CREATE INDEX IF NOT EXISTS idx_leaderboard_category_score ON leaderboard(category, score DESC)`
  );
}

// ============================================
// Character Data (Embedded from game assets)
// ============================================

const CHARACTERS: Character[] = [
  {
    id: 'maya-thunder',
    name: 'Maya Thunder',
    emoji: '⚡',
    age: 11,
    hometown: 'Boerne, TX',
    bio: 'Lightning-fast outfielder with incredible instincts',
    stats: { power: 6, contact: 8, speed: 10, fielding: 9, pitching: 5 },
    ability: {
      name: 'Thunder Steal',
      description: 'Steals bases 75% faster with 90% success rate',
      cooldown: 2,
    },
    colors: { primary: '#FFD700', secondary: '#1E90FF' },
    unlockCondition: 'starter',
  },
  {
    id: 'jackson-rocket',
    name: 'Jackson "Rocket" Rodriguez',
    emoji: '🚀',
    age: 12,
    hometown: 'San Antonio, TX',
    bio: 'Power hitter who crushes homers over the fence',
    stats: { power: 10, contact: 6, speed: 5, fielding: 7, pitching: 6 },
    ability: {
      name: 'Launch Pad',
      description: 'Next home run goes 50% farther for bonus points',
      cooldown: 3,
    },
    colors: { primary: '#E74C3C', secondary: '#C0392B' },
    unlockCondition: 'starter',
  },
  {
    id: 'emma-glove',
    name: 'Emma "Glove" Chen',
    emoji: '🧤',
    age: 10,
    hometown: 'Austin, TX',
    bio: 'Defensive wizard who makes impossible catches look easy',
    stats: { power: 5, contact: 7, speed: 7, fielding: 10, pitching: 7 },
    ability: {
      name: 'Gold Glove Dive',
      description: 'Can catch any ball within the field for one play',
      cooldown: 4,
    },
    colors: { primary: '#F39C12', secondary: '#E67E22' },
    unlockCondition: 'starter',
  },
  {
    id: 'tyler-knuckle',
    name: 'Tyler "Knuckle" Williams',
    emoji: '🎯',
    age: 11,
    hometown: 'Houston, TX',
    bio: 'Crafty pitcher with pinpoint accuracy and tricky moves',
    stats: { power: 4, contact: 6, speed: 6, fielding: 8, pitching: 10 },
    ability: {
      name: 'Phantom Ball',
      description: 'Next pitch becomes nearly invisible for 2 seconds',
      cooldown: 3,
    },
    colors: { primary: '#3498DB', secondary: '#2980B9' },
    unlockCondition: 'win5',
  },
  {
    id: 'sophia-spark',
    name: 'Sophia "Spark" Martinez',
    emoji: '✨',
    age: 12,
    hometown: 'Dallas, TX',
    bio: 'All-around player with clutch performance in big moments',
    stats: { power: 7, contact: 8, speed: 8, fielding: 8, pitching: 7 },
    ability: {
      name: 'Clutch Mode',
      description: 'All stats increase by 20% in final inning',
      cooldown: 0,
    },
    colors: { primary: '#9B59B6', secondary: '#8E44AD' },
    unlockCondition: 'win10',
  },
  {
    id: 'marcus-dash',
    name: 'Marcus "Dash" Johnson',
    emoji: '💨',
    age: 11,
    hometown: 'Fort Worth, TX',
    bio: 'Speedy center fielder who covers the whole outfield',
    stats: { power: 5, contact: 7, speed: 10, fielding: 9, pitching: 4 },
    ability: {
      name: 'Wind Sprint',
      description: 'Moves twice as fast for 10 seconds',
      cooldown: 4,
    },
    colors: { primary: '#1ABC9C', secondary: '#16A085' },
    unlockCondition: 'win15',
  },
  {
    id: 'olivia-cannon',
    name: 'Olivia "Cannon" Lee',
    emoji: '💪',
    age: 12,
    hometown: 'Arlington, TX',
    bio: 'Strong-armed catcher with a rifle throw to second',
    stats: { power: 8, contact: 7, speed: 4, fielding: 9, pitching: 6 },
    ability: {
      name: 'Laser Throw',
      description: 'Throws out any base stealer for one play',
      cooldown: 3,
    },
    colors: { primary: '#E67E22', secondary: '#D35400' },
    unlockCondition: 'win20',
  },
  {
    id: 'carlos-magic',
    name: 'Carlos "Magic" Garcia',
    emoji: '🎩',
    age: 10,
    hometown: 'El Paso, TX',
    bio: 'Trick-shot specialist who makes impossible plays',
    stats: { power: 6, contact: 9, speed: 7, fielding: 8, pitching: 7 },
    ability: {
      name: 'Lucky Bounce',
      description: '15% chance any fair ball becomes a hit',
      cooldown: 0,
    },
    colors: { primary: '#34495E', secondary: '#2C3E50' },
    unlockCondition: 'win25',
  },
  {
    id: 'isabella-ice',
    name: 'Isabella "Ice" Nguyen',
    emoji: '❄️',
    age: 11,
    hometown: 'Plano, TX',
    bio: 'Cool under pressure with nerves of steel',
    stats: { power: 7, contact: 8, speed: 6, fielding: 7, pitching: 9 },
    ability: {
      name: 'Ice Cold',
      description: 'No pressure penalties in high-leverage situations',
      cooldown: 0,
    },
    colors: { primary: '#ECF0F1', secondary: '#BDC3C7' },
    unlockCondition: 'win30',
  },
  {
    id: 'ryan-wall',
    name: 'Ryan "The Wall" Brown',
    emoji: '🛡️',
    age: 12,
    hometown: 'Corpus Christi, TX',
    bio: 'First baseman who blocks everything that comes his way',
    stats: { power: 8, contact: 7, speed: 4, fielding: 10, pitching: 5 },
    ability: {
      name: 'Iron Wall',
      description: 'Prevents all ground balls from getting through infield',
      cooldown: 5,
    },
    colors: { primary: '#95A5A6', secondary: '#7F8C8D' },
    unlockCondition: 'win35',
  },
  {
    id: 'lily-zoom',
    name: 'Lily "Zoom" Park',
    emoji: '🎨',
    age: 10,
    hometown: 'Frisco, TX',
    bio: 'Creative player who finds unique ways to score runs',
    stats: { power: 6, contact: 9, speed: 9, fielding: 7, pitching: 6 },
    ability: {
      name: 'Creative Play',
      description: 'Can turn singles into doubles with smart baserunning',
      cooldown: 2,
    },
    colors: { primary: '#FF69B4', secondary: '#FF1493' },
    unlockCondition: 'win40',
  },
  {
    id: 'diego-fire',
    name: 'Diego "Fire" Ramirez',
    emoji: '🔥',
    age: 12,
    hometown: 'Laredo, TX',
    bio: 'Fiery competitor with unstoppable determination',
    stats: { power: 9, contact: 8, speed: 7, fielding: 8, pitching: 8 },
    ability: {
      name: 'Hot Streak',
      description: 'Each consecutive hit increases power by 15%',
      cooldown: 0,
    },
    colors: { primary: '#FF4500', secondary: '#FF6347' },
    unlockCondition: 'win50',
  },
];

// ============================================
// Stadium Data (Embedded from game assets)
// ============================================

const STADIUMS: Stadium[] = [
  {
    id: 'boerne-backyard',
    name: 'Boerne Backyard',
    location: 'Boerne, TX',
    description: 'Classic Texas hill country backyard with oak trees and a tire swing',
    theme: 'hill-country',
    environment: { background: '#87CEEB', grass: '#90EE90', dirt: '#D2691E', fence: '#8B4513' },
    dimensions: { leftField: 180, centerField: 220, rightField: 180 },
    features: [
      {
        type: 'tree',
        name: 'Oak Tree',
        position: { x: -150, y: 200 },
        effect: 'Balls that hit the tree drop straight down for an automatic double',
      },
      {
        type: 'obstacle',
        name: 'Tire Swing',
        position: { x: 100, y: 190 },
        effect: 'Hit the tire for bonus points!',
      },
      {
        type: 'bonus',
        name: 'Hill Slope',
        position: { x: 0, y: 210 },
        effect: 'Ground balls roll faster uphill, slower downhill',
      },
    ],
    weather: { wind: { x: 0.5, y: 0 }, temperature: 85, condition: 'sunny' },
    unlockCondition: 'starter',
  },
  {
    id: 'san-antonio-lot',
    name: 'San Antonio Sand Lot',
    location: 'San Antonio, TX',
    description: 'Dusty lot near the Alamo with unique southwest character',
    theme: 'desert',
    environment: { background: '#FFD700', grass: '#DAA520', dirt: '#D2B48C', fence: '#CD853F' },
    dimensions: { leftField: 190, centerField: 200, rightField: 210 },
    features: [
      {
        type: 'obstacle',
        name: 'Cactus Garden',
        position: { x: -180, y: 180 },
        effect: 'Balls landing in cactus are ground rule doubles',
      },
      {
        type: 'bonus',
        name: 'Desert Wind',
        position: { x: 0, y: 0 },
        effect: 'Strong crosswind affects all fly balls',
      },
      {
        type: 'feature',
        name: 'Lizard Rock',
        position: { x: 50, y: 150 },
        effect: 'Hit the rock for a lucky bounce',
      },
    ],
    weather: { wind: { x: -1.5, y: 0 }, temperature: 95, condition: 'hot' },
    unlockCondition: 'win8',
  },
  {
    id: 'austin-treehouse',
    name: 'Austin Treehouse Field',
    location: 'Austin, TX',
    description: 'Shaded field beneath a massive treehouse fortress',
    theme: 'forest',
    environment: { background: '#228B22', grass: '#32CD32', dirt: '#8B4513', fence: '#2F4F2F' },
    dimensions: { leftField: 185, centerField: 230, rightField: 185 },
    features: [
      {
        type: 'structure',
        name: 'Treehouse',
        position: { x: 0, y: 220 },
        effect: 'Home runs through treehouse opening earn triple points',
      },
      {
        type: 'obstacle',
        name: 'Rope Ladder',
        position: { x: -100, y: 190 },
        effect: 'Balls caught in ladder are automatic outs',
      },
      {
        type: 'bonus',
        name: 'Shade Zone',
        position: { x: 0, y: 100 },
        effect: 'Balls in shade are harder to see',
      },
    ],
    weather: { wind: { x: 0, y: 0.3 }, temperature: 78, condition: 'partly-cloudy' },
    unlockCondition: 'win15',
  },
  {
    id: 'houston-bayou',
    name: 'Houston Bayou Diamond',
    location: 'Houston, TX',
    description: 'Field next to bayou with unpredictable weather',
    theme: 'wetlands',
    environment: { background: '#4682B4', grass: '#3CB371', dirt: '#A0522D', fence: '#708090' },
    dimensions: { leftField: 195, centerField: 210, rightField: 175 },
    features: [
      {
        type: 'hazard',
        name: 'Bayou Water',
        position: { x: 200, y: 150 },
        effect: 'Balls in water are home runs (but lost balls!)',
      },
      {
        type: 'obstacle',
        name: 'Dock',
        position: { x: 180, y: 170 },
        effect: 'Can catch balls off the dock for spectacular plays',
      },
      {
        type: 'weather',
        name: 'Humidity',
        position: { x: 0, y: 0 },
        effect: 'Heavy air makes balls drop faster',
      },
    ],
    weather: { wind: { x: 0.8, y: -0.5 }, temperature: 92, condition: 'humid' },
    unlockCondition: 'win25',
  },
  {
    id: 'dallas-construction',
    name: 'Dallas Construction Site',
    location: 'Dallas, TX',
    description: 'Urban lot surrounded by construction equipment and barriers',
    theme: 'urban',
    environment: { background: '#696969', grass: '#556B2F', dirt: '#BC8F8F', fence: '#FFD700' },
    dimensions: { leftField: 170, centerField: 240, rightField: 170 },
    features: [
      {
        type: 'obstacle',
        name: 'Crane',
        position: { x: 0, y: 230 },
        effect: 'Home runs that hit the crane bucket score 5x points!',
      },
      {
        type: 'structure',
        name: 'Concrete Mixer',
        position: { x: -160, y: 160 },
        effect: 'Balls bounce unpredictably off construction equipment',
      },
      {
        type: 'bonus',
        name: 'Hard Hat Zone',
        position: { x: 120, y: 140 },
        effect: 'Doubles scored here earn safety bonus points',
      },
    ],
    weather: { wind: { x: 0, y: 0.8 }, temperature: 88, condition: 'clear' },
    unlockCondition: 'win40',
  },
];

// ============================================
// Route Handlers
// ============================================

async function handleSaveGame(request: Request, env: Env): Promise<Response> {
  try {
    const body = await request.json();
    const validation = SaveGameSchema.safeParse(body);

    if (!validation.success) {
      return errorResponse(
        `Validation error: ${validation.error.errors.map((e) => e.message).join(', ')}`,
        400
      );
    }

    const { userId, username, progress } = validation.data;

    // Upsert user
    await env.DB.prepare(
      `
      INSERT INTO users (id, username, last_played)
      VALUES (?, ?, datetime('now'))
      ON CONFLICT(id) DO UPDATE SET
        last_played = datetime('now')
    `
    )
      .bind(userId, username)
      .run();

    // Upsert progress
    await env.DB.prepare(
      `
      INSERT INTO progress (user_id, unlocked_characters, unlocked_stadiums, coins, total_games, total_wins, season_progress)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET
        unlocked_characters = excluded.unlocked_characters,
        unlocked_stadiums = excluded.unlocked_stadiums,
        coins = excluded.coins,
        total_games = excluded.total_games,
        total_wins = excluded.total_wins,
        season_progress = excluded.season_progress
    `
    )
      .bind(
        userId,
        JSON.stringify(progress.unlocked_characters),
        JSON.stringify(progress.unlocked_stadiums),
        progress.coins,
        progress.total_games,
        progress.total_wins,
        JSON.stringify(progress.season_progress)
      )
      .run();

    // Invalidate cache
    await env.CACHE.delete(`game:progress:${userId}`);

    return jsonResponse({ saved: true, userId });
  } catch (error) {
    console.error('[SaveGame] Error:', error);
    return errorResponse('Failed to save game progress', 500);
  }
}

async function handleLoadGame(userId: string, env: Env): Promise<Response> {
  try {
    const validation = UserIdSchema.safeParse(userId);
    if (!validation.success) {
      return errorResponse('Invalid user ID format', 400);
    }

    // Check cache first
    const cached = await env.CACHE.get(`game:progress:${userId}`, 'json');
    if (cached) {
      return jsonResponse(cached);
    }

    // Query database
    const userResult = await env.DB.prepare(
      `
      SELECT u.id, u.username, u.created_at, u.last_played,
             p.unlocked_characters, p.unlocked_stadiums, p.coins,
             p.total_games, p.total_wins, p.season_progress
      FROM users u
      LEFT JOIN progress p ON u.id = p.user_id
      WHERE u.id = ?
    `
    )
      .bind(userId)
      .first();

    if (!userResult) {
      return errorResponse('User not found', 404);
    }

    const gameData = {
      user: {
        id: userResult.id as string,
        username: userResult.username as string,
        created_at: userResult.created_at as string,
        last_played: userResult.last_played as string,
      },
      progress: {
        unlocked_characters: JSON.parse((userResult.unlocked_characters as string) || '[]'),
        unlocked_stadiums: JSON.parse((userResult.unlocked_stadiums as string) || '[]'),
        coins: (userResult.coins as number) || 0,
        total_games: (userResult.total_games as number) || 0,
        total_wins: (userResult.total_wins as number) || 0,
        season_progress: JSON.parse((userResult.season_progress as string) || '{}'),
      },
    };

    // Cache for 5 minutes
    await env.CACHE.put(`game:progress:${userId}`, JSON.stringify(gameData), {
      expirationTtl: 300,
    });

    return jsonResponse(gameData);
  } catch (error) {
    console.error('[LoadGame] Error:', error);
    return errorResponse('Failed to load game progress', 500);
  }
}

async function handleGetLeaderboard(url: URL, env: Env): Promise<Response> {
  try {
    const category = url.searchParams.get('category') || 'wins';
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '100', 10), 100);

    // Check cache first
    const cacheKey = `game:leaderboard:${category}:${limit}`;
    const cached = await env.CACHE.get(cacheKey, 'json');
    if (cached) {
      return jsonResponse(cached);
    }

    // Query database
    const results = await env.DB.prepare(
      `
      SELECT l.user_id, u.username, l.category, l.score, l.updated_at
      FROM leaderboard l
      JOIN users u ON l.user_id = u.id
      WHERE l.category = ?
      ORDER BY l.score DESC
      LIMIT ?
    `
    )
      .bind(category, limit)
      .all();

    const leaderboard: LeaderboardEntry[] = (results.results || []).map((row, index) => ({
      user_id: row.user_id as string,
      username: row.username as string,
      category: row.category as string,
      score: row.score as number,
      updated_at: row.updated_at as string,
      rank: index + 1,
    }));

    // Cache for 1 minute (leaderboards update frequently)
    await env.CACHE.put(cacheKey, JSON.stringify(leaderboard), { expirationTtl: 60 });

    return jsonResponse(leaderboard);
  } catch (error) {
    console.error('[GetLeaderboard] Error:', error);
    return errorResponse('Failed to retrieve leaderboard', 500);
  }
}

async function handleSubmitLeaderboard(request: Request, env: Env): Promise<Response> {
  try {
    const body = await request.json();
    const validation = LeaderboardSubmitSchema.safeParse(body);

    if (!validation.success) {
      return errorResponse(
        `Validation error: ${validation.error.errors.map((e) => e.message).join(', ')}`,
        400
      );
    }

    const { userId, category, score } = validation.data;

    // Verify user exists
    const user = await env.DB.prepare('SELECT id FROM users WHERE id = ?').bind(userId).first();
    if (!user) {
      return errorResponse('User not found', 404);
    }

    // Only update if score is higher
    const existing = await env.DB.prepare(
      `
      SELECT score FROM leaderboard WHERE user_id = ? AND category = ?
    `
    )
      .bind(userId, category)
      .first();

    if (existing && (existing.score as number) >= score) {
      return jsonResponse({
        submitted: false,
        reason: 'Existing score is higher or equal',
        currentScore: existing.score,
      });
    }

    // Upsert leaderboard entry
    await env.DB.prepare(
      `
      INSERT INTO leaderboard (user_id, category, score, updated_at)
      VALUES (?, ?, ?, datetime('now'))
      ON CONFLICT(user_id, category) DO UPDATE SET
        score = excluded.score,
        updated_at = datetime('now')
    `
    )
      .bind(userId, category, score)
      .run();

    // Invalidate leaderboard cache
    await env.CACHE.delete(`game:leaderboard:${category}:100`);

    // Get new rank
    const rankResult = await env.DB.prepare(
      `
      SELECT COUNT(*) + 1 as rank
      FROM leaderboard
      WHERE category = ? AND score > ?
    `
    )
      .bind(category, score)
      .first();

    return jsonResponse({
      submitted: true,
      category,
      score,
      rank: rankResult?.rank || 1,
    });
  } catch (error) {
    console.error('[SubmitLeaderboard] Error:', error);
    return errorResponse('Failed to submit score', 500);
  }
}

async function handleGetPlayers(url: URL, env: Env): Promise<Response> {
  try {
    const userId = url.searchParams.get('userId');

    // Get all characters with unlock status if userId provided
    let unlockedCharacters: string[] = [];
    if (userId) {
      const progress = await env.DB.prepare(
        `
        SELECT unlocked_characters FROM progress WHERE user_id = ?
      `
      )
        .bind(userId)
        .first();

      if (progress) {
        unlockedCharacters = JSON.parse((progress.unlocked_characters as string) || '[]');
      }
    }

    // Fetch sprite URLs from R2 if available
    const charactersWithAssets = await Promise.all(
      CHARACTERS.map(async (char) => {
        let spriteUrl: string | undefined;
        try {
          const sprite = await env.ASSETS.head(`characters/${char.id}/sprite.png`);
          if (sprite) {
            spriteUrl = `https://assets.blazesportsintel.com/characters/${char.id}/sprite.png`;
          }
        } catch {
          // Asset not found, skip
        }

        const isUnlocked = userId
          ? char.unlockCondition === 'starter' || unlockedCharacters.includes(char.id)
          : char.unlockCondition === 'starter';

        return {
          ...char,
          spriteUrl,
          unlocked: isUnlocked,
        };
      })
    );

    return jsonResponse({
      characters: charactersWithAssets,
      total: CHARACTERS.length,
      unlocked: charactersWithAssets.filter((c) => c.unlocked).length,
    });
  } catch (error) {
    console.error('[GetPlayers] Error:', error);
    return errorResponse('Failed to retrieve players', 500);
  }
}

async function handleGetStadiums(url: URL, env: Env): Promise<Response> {
  try {
    const userId = url.searchParams.get('userId');

    // Get unlocked stadiums if userId provided
    let unlockedStadiums: string[] = [];
    if (userId) {
      const progress = await env.DB.prepare(
        `
        SELECT unlocked_stadiums FROM progress WHERE user_id = ?
      `
      )
        .bind(userId)
        .first();

      if (progress) {
        unlockedStadiums = JSON.parse((progress.unlocked_stadiums as string) || '[]');
      }
    }

    // Fetch image URLs from R2 if available
    const stadiumsWithAssets = await Promise.all(
      STADIUMS.map(async (stadium) => {
        let imageUrl: string | undefined;
        try {
          const image = await env.ASSETS.head(`stadiums/${stadium.id}/background.png`);
          if (image) {
            imageUrl = `https://assets.blazesportsintel.com/stadiums/${stadium.id}/background.png`;
          }
        } catch {
          // Asset not found, skip
        }

        const isUnlocked = userId
          ? stadium.unlockCondition === 'starter' || unlockedStadiums.includes(stadium.id)
          : stadium.unlockCondition === 'starter';

        return {
          ...stadium,
          imageUrl,
          unlocked: isUnlocked,
        };
      })
    );

    return jsonResponse({
      stadiums: stadiumsWithAssets,
      total: STADIUMS.length,
      unlocked: stadiumsWithAssets.filter((s) => s.unlocked).length,
    });
  } catch (error) {
    console.error('[GetStadiums] Error:', error);
    return errorResponse('Failed to retrieve stadiums', 500);
  }
}

async function handleMatchResult(request: Request, env: Env): Promise<Response> {
  try {
    const body = await request.json();
    const validation = MatchResultSchema.safeParse(body);

    if (!validation.success) {
      return errorResponse(
        `Validation error: ${validation.error.errors.map((e) => e.message).join(', ')}`,
        400
      );
    }

    const { userId, opponentType, userScore, opponentScore, stadium, matchStats } = validation.data;

    // Verify user exists
    const user = await env.DB.prepare('SELECT id FROM users WHERE id = ?').bind(userId).first();
    if (!user) {
      return errorResponse('User not found', 404);
    }

    // Create match record
    const matchId = crypto.randomUUID();
    await env.DB.prepare(
      `
      INSERT INTO matches (id, user_id, opponent_type, user_score, opponent_score, stadium, played_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `
    )
      .bind(matchId, userId, opponentType, userScore, opponentScore, stadium)
      .run();

    // Update progress
    const isWin = userScore > opponentScore;
    await env.DB.prepare(
      `
      UPDATE progress SET
        total_games = total_games + 1,
        total_wins = total_wins + ?
      WHERE user_id = ?
    `
    )
      .bind(isWin ? 1 : 0, userId)
      .run();

    // Update wins leaderboard if applicable
    if (isWin) {
      const currentProgress = await env.DB.prepare(
        `
        SELECT total_wins FROM progress WHERE user_id = ?
      `
      )
        .bind(userId)
        .first();

      if (currentProgress) {
        await env.DB.prepare(
          `
          INSERT INTO leaderboard (user_id, category, score, updated_at)
          VALUES (?, 'wins', ?, datetime('now'))
          ON CONFLICT(user_id, category) DO UPDATE SET
            score = excluded.score,
            updated_at = datetime('now')
        `
        )
          .bind(userId, currentProgress.total_wins)
          .run();
      }
    }

    // Update home runs leaderboard if provided
    if (matchStats?.homeRuns && matchStats.homeRuns > 0) {
      await env.DB.prepare(
        `
        INSERT INTO leaderboard (user_id, category, score, updated_at)
        VALUES (?, 'home_runs', COALESCE(
          (SELECT score FROM leaderboard WHERE user_id = ? AND category = 'home_runs'), 0
        ) + ?, datetime('now'))
        ON CONFLICT(user_id, category) DO UPDATE SET
          score = score + ?,
          updated_at = datetime('now')
      `
      )
        .bind(userId, userId, matchStats.homeRuns, matchStats.homeRuns)
        .run();
    }

    // Check for unlock progress
    const progress = await env.DB.prepare(
      `
      SELECT total_wins, unlocked_characters, unlocked_stadiums FROM progress WHERE user_id = ?
    `
    )
      .bind(userId)
      .first();

    const totalWins = (progress?.total_wins as number) || 0;
    const currentCharacters = JSON.parse((progress?.unlocked_characters as string) || '[]');
    const currentStadiums = JSON.parse((progress?.unlocked_stadiums as string) || '[]');

    // Check for new character unlocks
    const newCharacterUnlocks: string[] = [];
    for (const char of CHARACTERS) {
      if (char.unlockCondition !== 'starter' && !currentCharacters.includes(char.id)) {
        const requiredWins = parseInt(char.unlockCondition.replace('win', ''), 10);
        if (totalWins >= requiredWins) {
          newCharacterUnlocks.push(char.id);
        }
      }
    }

    // Check for new stadium unlocks
    const newStadiumUnlocks: string[] = [];
    for (const stadium of STADIUMS) {
      if (stadium.unlockCondition !== 'starter' && !currentStadiums.includes(stadium.id)) {
        const requiredWins = parseInt(stadium.unlockCondition.replace('win', ''), 10);
        if (totalWins >= requiredWins) {
          newStadiumUnlocks.push(stadium.id);
        }
      }
    }

    // Update unlocks if any
    if (newCharacterUnlocks.length > 0 || newStadiumUnlocks.length > 0) {
      const updatedCharacters = [...currentCharacters, ...newCharacterUnlocks];
      const updatedStadiums = [...currentStadiums, ...newStadiumUnlocks];

      await env.DB.prepare(
        `
        UPDATE progress SET
          unlocked_characters = ?,
          unlocked_stadiums = ?
        WHERE user_id = ?
      `
      )
        .bind(JSON.stringify(updatedCharacters), JSON.stringify(updatedStadiums), userId)
        .run();
    }

    // Invalidate cache
    await env.CACHE.delete(`game:progress:${userId}`);
    await env.CACHE.delete('game:leaderboard:wins:100');
    if (matchStats?.homeRuns) {
      await env.CACHE.delete('game:leaderboard:home_runs:100');
    }

    return jsonResponse({
      matchId,
      result: isWin ? 'win' : userScore === opponentScore ? 'tie' : 'loss',
      score: `${userScore}-${opponentScore}`,
      newUnlocks: {
        characters: newCharacterUnlocks.map((id) => CHARACTERS.find((c) => c.id === id)),
        stadiums: newStadiumUnlocks.map((id) => STADIUMS.find((s) => s.id === id)),
      },
    });
  } catch (error) {
    console.error('[MatchResult] Error:', error);
    return errorResponse('Failed to record match result', 500);
  }
}

// ============================================
// Main Worker Export
// ============================================

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const method = request.method;

    // Handle CORS preflight
    if (method === 'OPTIONS') {
      return corsResponse(new Response(null, { status: 204 }));
    }

    // Health check
    if (url.pathname === '/health' || url.pathname === '/api/health') {
      return jsonResponse({
        status: 'healthy',
        worker: 'bsi-game-backend',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
      });
    }

    // Rate limiting
    const clientId =
      request.headers.get('X-Client-ID') || request.headers.get('CF-Connecting-IP') || 'anonymous';
    const rateLimiter = new RateLimiter(env.CACHE, 100, 60);
    const rateLimit = await rateLimiter.isAllowed(clientId);

    if (!rateLimit.allowed) {
      return errorResponse('Rate limit exceeded. Please try again later.', 429);
    }

    // Initialize database tables on first request (idempotent)
    ctx.waitUntil(initializeDatabase(env.DB));

    // Route handling
    try {
      // POST /api/game/save - Save game progress
      if (url.pathname === '/api/game/save' && method === 'POST') {
        return await handleSaveGame(request, env);
      }

      // GET /api/game/load/:userId - Load saved game
      if (url.pathname.startsWith('/api/game/load/') && method === 'GET') {
        const userId = url.pathname.split('/').pop();
        if (!userId) {
          return errorResponse('User ID required', 400);
        }
        return await handleLoadGame(userId, env);
      }

      // GET /api/leaderboard - Get top scores
      if (url.pathname === '/api/leaderboard' && method === 'GET') {
        return await handleGetLeaderboard(url, env);
      }

      // POST /api/leaderboard/submit - Submit high score
      if (url.pathname === '/api/leaderboard/submit' && method === 'POST') {
        return await handleSubmitLeaderboard(request, env);
      }

      // GET /api/players - Get available characters
      if (url.pathname === '/api/players' && method === 'GET') {
        return await handleGetPlayers(url, env);
      }

      // GET /api/stadiums - Get unlocked stadiums
      if (url.pathname === '/api/stadiums' && method === 'GET') {
        return await handleGetStadiums(url, env);
      }

      // POST /api/match/result - Record match results
      if (url.pathname === '/api/match/result' && method === 'POST') {
        return await handleMatchResult(request, env);
      }

      // 404 for unknown routes
      return errorResponse('Endpoint not found', 404);
    } catch (error) {
      console.error('[Worker] Unhandled error:', error);
      return errorResponse('Internal server error', 500);
    }
  },
};
