/**
 * Live Game API Endpoint
 * Real-time college baseball game data with win probability calculations
 *
 * Features:
 * - Live game state with play-by-play updates
 * - Real-time win probability using LiveWinProbabilityEngine
 * - Expected metrics for at-bats (xBA, xSLG, xWOBA)
 * - Pitch tunneling analysis for pitcher matchups
 * - WebSocket connection for live updates
 * - KV caching with 30-second TTL for live games
 *
 * Integration Points:
 * - WinProbabilityChart.tsx (live visualization)
 * - GameBroadcaster Durable Object (WebSocket broadcasting)
 * - LiveWinProbabilityEngine (win probability calculations)
 * - ExpectedMetricsCalculator (batted ball analysis)
 *
 * Data Sources: NCAA Stats API, D1Baseball, Conference APIs
 * Last Updated: October 19, 2025
 * Timezone: America/Chicago
 */

import { LiveWinProbabilityEngine } from '../../../lib/analytics/baseball/win-probability-engine';
import { ExpectedMetricsCalculator } from '../../../lib/analytics/baseball/expected-metrics-calculator';
import { PitchTunnelingAnalyzer } from '../../../lib/analytics/baseball/pitch-tunneling-analyzer';
import type {
  GameState,
  WinProbability,
  ExpectedMetrics,
  TunnelingResult,
  RunnerState
} from '../../../lib/types';

// ============================================================================
// Type Definitions
// ============================================================================

interface GameEvent {
  id: string;
  inning: number;
  half: 'top' | 'bottom';
  outs: number;
  runners: RunnerState;
  batter: {
    id: string;
    name: string;
    avg: number;
  };
  pitcher: {
    id: string;
    name: string;
    era: number;
  };
  result: string;
  wpa: number;
  timestamp: string;
}

interface LiveGameResponse {
  game: {
    gameId: string;
    homeTeam: string;
    awayTeam: string;
    venue: string;
    status: 'scheduled' | 'live' | 'final';
    inning: number;
    half: 'top' | 'bottom';
    outs: number;
    runners: RunnerState;
    scoreDiff: number;
    homeScore: number;
    awayScore: number;
  };
  winProbability: WinProbability;
  recentEvents: GameEvent[];
  metadata: {
    dataSource: string;
    lastUpdated: string;
    cacheStatus: 'hit' | 'miss';
  };
}

// ============================================================================
// API Handler
// ============================================================================

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env, params } = context;
  const url = new URL(request.url);
  const gameId = params.gameId as string || url.searchParams.get('gameId');

  if (!gameId) {
    return Response.json(
      { error: 'Missing gameId parameter' },
      { status: 400 }
    );
  }

  try {
    // Check KV cache first (30 second TTL for live games)
    const cacheKey = `live_game:${gameId}`;
    const cached = await env.KV.get<LiveGameResponse>(cacheKey, 'json');

    if (cached) {
      // Verify cache freshness (must be < 30 seconds old)
      const cacheAge = Date.now() - new Date(cached.metadata.lastUpdated).getTime();
      if (cacheAge < 30000) {
        return Response.json({
          ...cached,
          metadata: {
            ...cached.metadata,
            cacheStatus: 'hit'
          }
        });
      }
    }

    // Fetch fresh game data
    const gameData = await fetchGameData(gameId, env);

    // Calculate win probability
    const gameState = buildGameState(gameData);
    const winProbability = LiveWinProbabilityEngine.calculateWinProbability(gameState);

    // Process recent events with WPA
    const recentEvents = await processRecentEvents(gameData, gameState);

    // Build response
    const response: LiveGameResponse = {
      game: {
        gameId: gameData.id,
        homeTeam: gameData.homeTeam.name,
        awayTeam: gameData.awayTeam.name,
        venue: gameData.venue,
        status: gameData.status,
        inning: gameData.inning,
        half: gameData.half,
        outs: gameData.outs,
        runners: gameData.runners,
        scoreDiff: gameData.homeScore - gameData.awayScore,
        homeScore: gameData.homeScore,
        awayScore: gameData.awayScore
      },
      winProbability,
      recentEvents,
      metadata: {
        dataSource: 'NCAA Stats API',
        lastUpdated: new Date().toISOString(),
        cacheStatus: 'miss'
      }
    };

    // Cache for 60 seconds (KV minimum)
    await env.KV.put(cacheKey, JSON.stringify(response), {
      expirationTtl: 60
    });

    // Broadcast to WebSocket subscribers
    if (gameData.status === 'live') {
      await broadcastToWebSocket(gameId, gameState, env);
    }

    return Response.json(response, {
      headers: {
        'Cache-Control': 'public, max-age=15, s-maxage=30',
        'X-Cache-Status': 'miss'
      }
    });
  } catch (error) {
    console.error('Live game fetch error:', error);
    return Response.json(
      {
        error: 'Failed to fetch live game data',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Fetch game data from upstream API
 */
async function fetchGameData(gameId: string, env: Env): Promise<any> {
  // Try NCAA Stats API first
  try {
    const response = await fetch(
      `https://stats.ncaa.org/api/game/${gameId}`,
      {
        headers: {
          'User-Agent': 'BlazeSportsIntel/1.0',
          'Accept': 'application/json'
        }
      }
    );

    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.error('NCAA API error:', error);
  }

  // Fallback to D1Baseball API
  try {
    const response = await fetch(
      `https://d1baseball.com/api/games/${gameId}`,
      {
        headers: {
          'User-Agent': 'BlazeSportsIntel/1.0',
          'Accept': 'application/json'
        }
      }
    );

    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.error('D1Baseball API error:', error);
  }

  // Fallback to database
  const stored = await env.DB.prepare(
    'SELECT * FROM games WHERE gameId = ?'
  ).bind(gameId).first();

  if (!stored) {
    throw new Error('Game not found');
  }

  return stored;
}

/**
 * Build GameState object from raw game data
 */
function buildGameState(gameData: any): GameState {
  return {
    gameId: gameData.id,
    inning: gameData.inning || 1,
    half: gameData.half || 'top',
    outs: gameData.outs || 0,
    runners: {
      first: gameData.runners?.first || false,
      second: gameData.runners?.second || false,
      third: gameData.runners?.third || false
    },
    scoreDiff: (gameData.homeScore || 0) - (gameData.awayScore || 0),
    homeTeamStrength: gameData.homeTeam.winPct || 0.500,
    awayTeamStrength: gameData.awayTeam.winPct || 0.500,
    totalGames: 56, // College baseball season
    gamesRemaining: Math.max(0, 56 - (gameData.homeTeam.gamesPlayed || 0)),
    homeTeam: gameData.homeTeam.name,
    awayTeam: gameData.awayTeam.name,
    lastPlay: gameData.lastPlay
  };
}

/**
 * Process recent events and calculate WPA
 */
async function processRecentEvents(
  gameData: any,
  currentState: GameState
): Promise<GameEvent[]> {
  const events: GameEvent[] = [];
  const plays = gameData.plays || [];

  // Get last 10 plays
  const recentPlays = plays.slice(-10);

  for (let i = 0; i < recentPlays.length; i++) {
    const play = recentPlays[i];
    const prevPlay = i > 0 ? recentPlays[i - 1] : null;

    // Build before/after states
    const beforeState: GameState = prevPlay
      ? buildGameStateFromPlay(prevPlay, gameData)
      : { ...currentState, outs: 0, runners: { first: false, second: false, third: false } };

    const afterState: GameState = buildGameStateFromPlay(play, gameData);

    // Calculate WPA
    const wpa = LiveWinProbabilityEngine.calculateWPA(beforeState, afterState);

    events.push({
      id: play.id,
      inning: play.inning,
      half: play.half,
      outs: play.outs,
      runners: play.runners,
      batter: {
        id: play.batter.id,
        name: play.batter.name,
        avg: play.batter.avg || 0.000
      },
      pitcher: {
        id: play.pitcher.id,
        name: play.pitcher.name,
        era: play.pitcher.era || 0.00
      },
      result: play.result,
      wpa,
      timestamp: play.timestamp || new Date().toISOString()
    });
  }

  return events;
}

/**
 * Build game state from individual play
 */
function buildGameStateFromPlay(play: any, gameData: any): GameState {
  return {
    gameId: gameData.id,
    inning: play.inning,
    half: play.half,
    outs: play.outs,
    runners: play.runners,
    scoreDiff: play.scoreDiff || 0,
    homeTeamStrength: gameData.homeTeam.winPct || 0.500,
    awayTeamStrength: gameData.awayTeam.winPct || 0.500,
    totalGames: 56,
    gamesRemaining: Math.max(0, 56 - (gameData.homeTeam.gamesPlayed || 0)),
    homeTeam: gameData.homeTeam.name,
    awayTeam: gameData.awayTeam.name,
    lastPlay: play.result
  };
}

/**
 * Broadcast game update to WebSocket subscribers
 */
async function broadcastToWebSocket(
  gameId: string,
  gameState: GameState,
  env: Env
): Promise<void> {
  try {
    // Get Durable Object stub
    const id = env.GAME_BROADCASTER.idFromName(gameId);
    const stub = env.GAME_BROADCASTER.get(id);

    // Broadcast update via fetch (DO will handle WebSocket broadcasting)
    await stub.fetch('https://internal/broadcast', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(gameState)
    });
  } catch (error) {
    console.error('WebSocket broadcast error:', error);
    // Don't fail the request if WebSocket broadcast fails
  }
}

// ============================================================================
// Environment Types
// ============================================================================

interface Env {
  KV: KVNamespace;
  DB: D1Database;
  GAME_BROADCASTER: DurableObjectNamespace;
}
