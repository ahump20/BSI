/// <reference types="@cloudflare/workers-types" />
/**
 * BSI: Inferno Sprint - Leaderboard Worker
 *
 * Endpoints:
 *   POST /api/score - Submit a score with anti-cheat validation
 *   GET /api/leaderboard - Get top scores
 *   GET /api/version - Get current game version
 */

interface Env {
  LEADERBOARD_KV: KVNamespace;
  SCORE_SECRET: string; // Secret for signing run receipts
}

interface ScoreSubmission {
  time: number;
  souls: number;
  seed: string;
  timestamp: number;
  playerName?: string;
}

interface LeaderboardEntry {
  playerName: string;
  time: number;
  timestamp: number;
  rank?: number;
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const GAME_VERSION = "1.0.0";
const MAX_LEADERBOARD_SIZE = 100;
const MIN_VALID_TIME = 15; // Minimum possible time (anti-cheat)
const MAX_VALID_TIME = 300; // Maximum valid time (5 minutes)
const REQUIRED_SOULS = 13;

// Simple hash for anti-cheat validation
async function hashScore(time: number, souls: number, seed: string, secret: string): Promise<string> {
  const data = `${time.toFixed(2)}:${souls}:${seed}:${secret}`;
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest("SHA-256", dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Validate score submission
function validateSubmission(submission: ScoreSubmission): { valid: boolean; error?: string } {
  if (typeof submission.time !== "number" || isNaN(submission.time)) {
    return { valid: false, error: "Invalid time" };
  }

  if (submission.time < MIN_VALID_TIME) {
    return { valid: false, error: "Time too fast - possible cheating detected" };
  }

  if (submission.time > MAX_VALID_TIME) {
    return { valid: false, error: "Time exceeded maximum" };
  }

  if (submission.souls !== REQUIRED_SOULS) {
    return { valid: false, error: "Must collect all 13 souls" };
  }

  if (typeof submission.timestamp !== "number" || submission.timestamp > Date.now() + 60000) {
    return { valid: false, error: "Invalid timestamp" };
  }

  return { valid: true };
}

// Generate anonymous player name
function generateAnonymousName(): string {
  const adjectives = ["Swift", "Blazing", "Shadow", "Ember", "Infernal", "Dark", "Rapid", "Fierce"];
  const nouns = ["Runner", "Sprinter", "Soul", "Demon", "Shade", "Phantom", "Hunter", "Blazer"];
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const num = Math.floor(Math.random() * 1000);
  return `${adj}${noun}${num}`;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: CORS_HEADERS });
    }

    try {
      // GET /api/version
      if (url.pathname === "/api/version" && request.method === "GET") {
        return Response.json(
          {
            version: GAME_VERSION,
            minValidTime: MIN_VALID_TIME,
            maxValidTime: MAX_VALID_TIME,
          },
          { headers: CORS_HEADERS }
        );
      }

      // GET /api/leaderboard
      if (url.pathname === "/api/leaderboard" && request.method === "GET") {
        const limit = Math.min(parseInt(url.searchParams.get("limit") || "25"), MAX_LEADERBOARD_SIZE);

        // Get leaderboard from KV
        const leaderboardData = await env.LEADERBOARD_KV.get("leaderboard", "json");
        const leaderboard: LeaderboardEntry[] = (leaderboardData as LeaderboardEntry[]) || [];

        // Return top scores with ranks
        const topScores = leaderboard.slice(0, limit).map((entry, index) => ({
          ...entry,
          rank: index + 1,
        }));

        return Response.json(
          {
            leaderboard: topScores,
            totalEntries: leaderboard.length,
          },
          { headers: CORS_HEADERS }
        );
      }

      // POST /api/score
      if (url.pathname === "/api/score" && request.method === "POST") {
        const submission: ScoreSubmission = await request.json();

        // Validate submission
        const validation = validateSubmission(submission);
        if (!validation.valid) {
          return Response.json({ error: validation.error }, { status: 400, headers: CORS_HEADERS });
        }

        // Generate hash for verification (can be checked server-side later)
        const scoreHash = await hashScore(
          submission.time,
          submission.souls,
          submission.seed,
          env.SCORE_SECRET || "bsi-inferno-default-secret"
        );

        // Create leaderboard entry
        const entry: LeaderboardEntry = {
          playerName: submission.playerName || generateAnonymousName(),
          time: Math.round(submission.time * 100) / 100, // Round to 2 decimals
          timestamp: submission.timestamp,
        };

        // Get current leaderboard
        const leaderboardData = await env.LEADERBOARD_KV.get("leaderboard", "json");
        const leaderboard: LeaderboardEntry[] = (leaderboardData as LeaderboardEntry[]) || [];

        // Add new entry and sort
        leaderboard.push(entry);
        leaderboard.sort((a, b) => a.time - b.time);

        // Keep only top scores
        const trimmedLeaderboard = leaderboard.slice(0, MAX_LEADERBOARD_SIZE);

        // Save updated leaderboard
        await env.LEADERBOARD_KV.put("leaderboard", JSON.stringify(trimmedLeaderboard));

        // Find rank of submitted score
        const rank = trimmedLeaderboard.findIndex(
          (e) => e.time === entry.time && e.timestamp === entry.timestamp
        ) + 1;

        return Response.json(
          {
            success: true,
            rank: rank > 0 ? rank : null,
            hash: scoreHash.substring(0, 16), // Return partial hash for client verification
          },
          { headers: CORS_HEADERS }
        );
      }

      // 404 for unknown routes
      return Response.json({ error: "Not found" }, { status: 404, headers: CORS_HEADERS });
    } catch (error) {
      console.error("Worker error:", error);
      return Response.json({ error: "Internal server error" }, { status: 500, headers: CORS_HEADERS });
    }
  },
};
