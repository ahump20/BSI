import type { Env, ScoreSubmission } from './types';

const VALID_GAME_IDS = ['blitz', 'hotdog-dash', 'sandlot-sluggers'];
const MAX_NAME_LENGTH = 24;

/** Per-game score bounds and minimum play duration (seconds) for anti-cheat */
const GAME_RULES: Record<string, { maxScore: number; minDurationSec: number }> = {
  'blitz':            { maxScore: 500,     minDurationSec: 15 },
  'hotdog-dash':      { maxScore: 100_000, minDurationSec: 10 },
  'sandlot-sluggers': { maxScore: 200,     minDurationSec: 20 },
};
const DEFAULT_RULES = { maxScore: 999_999, minDurationSec: 5 };

/** Max submissions per IP per game per hour */
const RATE_LIMIT_PER_HOUR = 20;

function hashIp(ip: string): string {
  // Simple non-reversible hash for storage (not crypto-grade, just privacy)
  let hash = 0;
  for (let i = 0; i < ip.length; i++) {
    hash = ((hash << 5) - hash + ip.charCodeAt(i)) | 0;
  }
  return hash.toString(36);
}

/** Validate and insert a score */
export async function submitScore(body: ScoreSubmission, ip: string, env: Env): Promise<Response> {
  const { gameId, playerName, score, metadata } = body;

  // Validate
  if (!gameId || !VALID_GAME_IDS.includes(gameId)) {
    return json({ error: 'Invalid gameId' }, 400);
  }
  if (!playerName || typeof playerName !== 'string' || playerName.trim().length === 0) {
    return json({ error: 'playerName required' }, 400);
  }
  if (playerName.length > MAX_NAME_LENGTH) {
    return json({ error: `playerName max ${MAX_NAME_LENGTH} chars` }, 400);
  }
  const rules = GAME_RULES[gameId] ?? DEFAULT_RULES;

  if (typeof score !== 'number' || !Number.isFinite(score) || score < 0 || score > rules.maxScore) {
    return json({ error: 'Invalid score' }, 400);
  }

  // Timing anti-cheat: reject suspiciously fast games
  const durationSec = typeof metadata?.durationSeconds === 'number' ? metadata.durationSeconds : null;
  if (durationSec !== null && durationSec < rules.minDurationSec) {
    return json({ error: 'Score rejected' }, 400);
  }

  const ipHash = hashIp(ip);

  // Rate limiting via KV — max N submissions per IP+game per hour
  const rlKey = `rl:${ipHash}:${gameId}`;
  const rlRaw = await env.RATE_LIMIT.get(rlKey);
  const rlCount = rlRaw ? parseInt(rlRaw, 10) : 0;
  if (rlCount >= RATE_LIMIT_PER_HOUR) {
    return json({ error: 'Rate limited' }, 429);
  }
  await env.RATE_LIMIT.put(rlKey, String(rlCount + 1), { expirationTtl: 3600 });

  const metaJson = metadata ? JSON.stringify(metadata) : null;

  await env.DB.prepare(
    `INSERT INTO leaderboard_entries (game_id, player_name, score, metadata, submitted_at, ip_hash)
     VALUES (?, ?, ?, ?, datetime('now'), ?)`
  ).bind(gameId, playerName.trim(), Math.floor(score), metaJson, ipHash).run();

  return json({ ok: true });
}

/** Get top scores for a specific game */
export async function getGameLeaderboard(gameId: string, limit: number, env: Env): Promise<Response> {
  if (!VALID_GAME_IDS.includes(gameId)) {
    return json({ error: 'Invalid gameId' }, 400);
  }

  const clampedLimit = Math.min(Math.max(1, limit), 50);

  const { results } = await env.DB.prepare(
    `SELECT id, game_id, player_name, score, submitted_at
     FROM leaderboard_entries
     WHERE game_id = ?
     ORDER BY score DESC, submitted_at ASC
     LIMIT ?`
  ).bind(gameId, clampedLimit).all();

  return json({ entries: results });
}

/** Get global top scores across all games */
export async function getGlobalLeaderboard(limit: number, env: Env): Promise<Response> {
  const clampedLimit = Math.min(Math.max(1, limit), 50);

  const { results } = await env.DB.prepare(
    `SELECT id, game_id, player_name, score, submitted_at
     FROM leaderboard_entries
     ORDER BY score DESC, submitted_at ASC
     LIMIT ?`
  ).bind(clampedLimit).all();

  return json({ entries: results });
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
