/**
 * BSI Live Scores — WebSocket Durable Object Worker
 *
 * Standalone Worker that manages real-time score updates for college baseball
 * via a Durable Object (LiveScoresBroadcaster). Clients connect over WebSocket
 * and receive delta-only score updates every 15 seconds.
 *
 * Deployed separately from the main blazesportsintel-worker.
 *
 * @see workers/handlers/college-baseball.ts for Highlightly API patterns
 */

import {
  HighlightlyApiClient,
  type HighlightlyMatch,
} from '../../lib/api-clients/highlightly-api';
import { computeMMI, type MMIInput } from '../../lib/analytics/mmi';
import { fetchLiveGames, isValidSport, type Sport, type RawLiveGame } from './sources';

// =============================================================================
// Types
// =============================================================================

interface Env {
  LIVE_SCORES: DurableObjectNamespace;
  RAPIDAPI_KEY: string;
  SPORTSDATAIO_KEY?: string;
  ENVIRONMENT: string;
}

/** Simplified game shape broadcast to WebSocket clients. */
interface LiveGame {
  id: string;
  status: 'pre' | 'in' | 'post' | 'postponed' | 'cancelled';
  detailedState: string;
  inning: number | undefined;
  inningHalf: 'top' | 'bottom' | undefined;
  outs: number | undefined;
  awayTeam: {
    id: number;
    name: string;
    shortName: string;
    score: number;
    record: string | undefined;
    conference: string;
    ranking: number | undefined;
  };
  homeTeam: {
    id: number;
    name: string;
    shortName: string;
    score: number;
    record: string | undefined;
    conference: string;
    ranking: number | undefined;
  };
  startTime: string;
  venue: string;
  mmi?: number;
}

interface WsMessage {
  type: 'score_update' | 'game_start' | 'game_end' | 'connected' | 'error' | 'heartbeat';
  games?: LiveGame[];
  mmi?: Record<string, number>;
  message?: string;
  timestamp: string;
  meta?: {
    source: string;
    connectedClients: number;
    pollIntervalMs: number;
    sport?: string;
  };
}

// =============================================================================
// Transform — Highlightly match -> LiveGame
// =============================================================================

function matchToLiveGame(match: HighlightlyMatch): LiveGame {
  const statusType = match.status?.type ?? 'notstarted';
  const formatRecord = (r?: { wins: number; losses: number }) =>
    r ? `${r.wins}-${r.losses}` : undefined;

  return {
    id: String(match.id),
    status:
      statusType === 'inprogress'
        ? 'in'
        : statusType === 'finished'
          ? 'post'
          : statusType === 'postponed'
            ? 'postponed'
            : statusType === 'cancelled'
              ? 'cancelled'
              : 'pre',
    detailedState: match.status?.description ?? statusType,
    inning: match.currentInning,
    inningHalf: match.currentInningHalf,
    outs: match.outs,
    awayTeam: {
      id: match.awayTeam?.id ?? 0,
      name: match.awayTeam?.name ?? 'Away',
      shortName: match.awayTeam?.shortName ?? '',
      score: match.awayScore ?? 0,
      record: formatRecord(match.awayTeam?.record),
      conference: match.awayTeam?.conference?.name ?? '',
      ranking: match.awayTeam?.ranking,
    },
    homeTeam: {
      id: match.homeTeam?.id ?? 0,
      name: match.homeTeam?.name ?? 'Home',
      shortName: match.homeTeam?.shortName ?? '',
      score: match.homeScore ?? 0,
      record: formatRecord(match.homeTeam?.record),
      conference: match.homeTeam?.conference?.name ?? '',
      ranking: match.homeTeam?.ranking,
    },
    startTime: new Date(match.startTimestamp * 1000).toISOString(),
    venue: match.venue?.name ?? 'TBD',
  };
}

// =============================================================================
// Delta detection — compare snapshots by game ID
// =============================================================================

function computeGameFingerprint(game: LiveGame): string {
  return [
    game.status,
    game.inning,
    game.inningHalf,
    game.outs,
    game.awayTeam.score,
    game.homeTeam.score,
    game.detailedState,
  ].join('|');
}

interface DeltaResult {
  changed: LiveGame[];
  started: LiveGame[];
  ended: LiveGame[];
}

function computeDelta(
  previous: Map<string, LiveGame>,
  current: Map<string, LiveGame>
): DeltaResult {
  const changed: LiveGame[] = [];
  const started: LiveGame[] = [];
  const ended: LiveGame[] = [];

  for (const [id, game] of current) {
    const prev = previous.get(id);
    if (!prev) {
      // New game appeared (or newly started)
      if (game.status === 'in') {
        started.push(game);
      }
      continue;
    }

    const prevFp = computeGameFingerprint(prev);
    const curFp = computeGameFingerprint(game);

    if (prevFp !== curFp) {
      // State changed
      if (prev.status !== 'post' && game.status === 'post') {
        ended.push(game);
      } else if (prev.status === 'pre' && game.status === 'in') {
        started.push(game);
      } else {
        changed.push(game);
      }
    }
  }

  // Games that vanished from current — likely finished or removed
  for (const [id, prev] of previous) {
    if (!current.has(id) && prev.status === 'in') {
      ended.push({ ...prev, status: 'post' });
    }
  }

  return { changed, started, ended };
}

// =============================================================================
// Durable Object — LiveScoresBroadcaster
// =============================================================================

const POLL_INTERVAL_MS = 15_000;

export class LiveScoresBroadcaster {
  private state: DurableObjectState;
  private env: Env;
  private sessions: Set<WebSocket>;
  private previousSnapshot: Map<string, LiveGame>;

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;
    this.sessions = new Set();
    this.previousSnapshot = new Map();

    // Restore previous snapshot from storage on cold start
    this.state.blockConcurrencyWhile(async () => {
      const stored = await this.state.storage.get<[string, LiveGame][]>('snapshot');
      if (stored) {
        this.previousSnapshot = new Map(stored);
      }
    });
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // --- WebSocket upgrade ---
    if (request.headers.get('Upgrade') === 'websocket') {
      const pair = new WebSocketPair();
      const [client, server] = Object.values(pair);

      this.state.acceptWebSocket(server);
      this.sessions.add(server);

      // Send welcome message
      const welcome: WsMessage = {
        type: 'connected',
        message: 'Connected to BSI Live Scores',
        timestamp: new Date().toISOString(),
        meta: {
          source: 'highlightly',
          connectedClients: this.sessions.size,
          pollIntervalMs: POLL_INTERVAL_MS,
        },
      };
      server.send(JSON.stringify(welcome));

      // Send current snapshot so the client has immediate data
      if (this.previousSnapshot.size > 0) {
        const liveGames = Array.from(this.previousSnapshot.values()).filter(
          (g) => g.status === 'in'
        );
        if (liveGames.length > 0) {
          const initial: WsMessage = {
            type: 'score_update',
            games: liveGames,
            timestamp: new Date().toISOString(),
          };
          server.send(JSON.stringify(initial));
        }
      }

      // Ensure alarm is running when at least one client connects
      const currentAlarm = await this.state.storage.getAlarm();
      if (!currentAlarm) {
        await this.state.storage.setAlarm(Date.now() + POLL_INTERVAL_MS);
      }

      return new Response(null, { status: 101, webSocket: client });
    }

    // --- Control endpoints ---
    if (url.pathname === '/start') {
      const currentAlarm = await this.state.storage.getAlarm();
      if (!currentAlarm) {
        await this.state.storage.setAlarm(Date.now() + POLL_INTERVAL_MS);
      }
      return new Response(JSON.stringify({ status: 'started' }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (url.pathname === '/stop') {
      await this.state.storage.deleteAlarm();
      return new Response(JSON.stringify({ status: 'stopped' }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (url.pathname === '/status') {
      const alarm = await this.state.storage.getAlarm();
      const lastPoll = await this.state.storage.get<string>('lastPoll');
      return new Response(
        JSON.stringify({
          alarmSet: !!alarm,
          lastPoll: lastPoll || 'never',
          connectedClients: this.sessions.size,
          trackedGames: this.previousSnapshot.size,
          liveGames: Array.from(this.previousSnapshot.values()).filter(
            (g) => g.status === 'in'
          ).length,
        }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response('Not found', { status: 404 });
  }

  // ---------------------------------------------------------------------------
  // Alarm — polls Highlightly and broadcasts deltas
  // ---------------------------------------------------------------------------

  async alarm(): Promise<void> {
    try {
      await this.pollAndBroadcast();
    } catch (err) {
      console.error(
        '[LiveScoresBroadcaster] alarm error:',
        err instanceof Error ? err.message : err
      );
      // Broadcast error to clients
      this.broadcast({
        type: 'error',
        message: 'Score update temporarily unavailable',
        timestamp: new Date().toISOString(),
      });
    }

    // Reschedule if clients are connected
    this.cleanupDeadSessions();
    if (this.sessions.size > 0) {
      await this.state.storage.setAlarm(Date.now() + POLL_INTERVAL_MS);
    } else {
      // No clients — stop polling to save resources, but keep snapshot
      await this.state.storage.put('lastPoll', new Date().toISOString());
    }
  }

  // ---------------------------------------------------------------------------
  // WebSocket lifecycle (Hibernation API)
  // ---------------------------------------------------------------------------

  webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): void {
    try {
      const data = JSON.parse(typeof message === 'string' ? message : new TextDecoder().decode(message));
      if (data.type === 'ping') {
        ws.send(JSON.stringify({ type: 'heartbeat', timestamp: new Date().toISOString() }));
      }
    } catch {
      // Ignore malformed
    }
  }

  webSocketClose(ws: WebSocket): void {
    this.sessions.delete(ws);
  }

  webSocketError(ws: WebSocket): void {
    this.sessions.delete(ws);
  }

  // ---------------------------------------------------------------------------
  // Core: Poll + Delta + Broadcast
  // ---------------------------------------------------------------------------

  private async pollAndBroadcast(): Promise<void> {
    if (!this.env.RAPIDAPI_KEY) {
      console.error('[LiveScoresBroadcaster] RAPIDAPI_KEY not set');
      this.broadcast({
        type: 'error',
        message: 'Live scores temporarily unavailable',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const client = new HighlightlyApiClient({ rapidApiKey: this.env.RAPIDAPI_KEY });
    const result = await client.getMatches('NCAA');

    if (!result.success || !result.data) {
      console.error(
        '[LiveScoresBroadcaster] Highlightly fetch failed:',
        result.error
      );
      return;
    }

    const matches: HighlightlyMatch[] = result.data.data ?? [];
    const currentSnapshot = new Map<string, LiveGame>();

    for (const match of matches) {
      const game = matchToLiveGame(match);
      currentSnapshot.set(game.id, game);
    }

    // Compute MMI for in-progress baseball games
    const mmiMap: Record<string, number> = {};
    for (const [id, game] of currentSnapshot) {
      if (game.status === 'in' && game.inning != null) {
        const mmiInput: MMIInput = {
          homeScore: game.homeTeam.score,
          awayScore: game.awayTeam.score,
          inning: game.inning,
          inningHalf: game.inningHalf ?? 'top',
          totalInnings: 9,
          recentHomeRuns: 0,
          recentAwayRuns: 0,
          baseSituation: 'empty',
        };
        const mmiValue = computeMMI(mmiInput);
        mmiMap[id] = mmiValue;
        game.mmi = mmiValue;
      }
    }

    // Delta detection
    const delta = computeDelta(this.previousSnapshot, currentSnapshot);

    // Broadcast started games
    if (delta.started.length > 0) {
      this.broadcast({
        type: 'game_start',
        games: delta.started,
        mmi: mmiMap,
        timestamp: new Date().toISOString(),
      });
    }

    // Broadcast ended games
    if (delta.ended.length > 0) {
      this.broadcast({
        type: 'game_end',
        games: delta.ended,
        timestamp: new Date().toISOString(),
      });
    }

    // Broadcast changed scores
    if (delta.changed.length > 0) {
      this.broadcast({
        type: 'score_update',
        games: delta.changed,
        mmi: mmiMap,
        timestamp: new Date().toISOString(),
      });
    }

    // Store snapshot
    this.previousSnapshot = currentSnapshot;
    await this.state.storage.put(
      'snapshot',
      Array.from(currentSnapshot.entries())
    );
    await this.state.storage.put('lastPoll', new Date().toISOString());
  }

  // ---------------------------------------------------------------------------
  // Broadcast to all connected clients
  // ---------------------------------------------------------------------------

  private broadcast(message: WsMessage): void {
    const payload = JSON.stringify(message);
    const dead: WebSocket[] = [];

    for (const ws of this.sessions) {
      try {
        ws.send(payload);
      } catch {
        dead.push(ws);
      }
    }

    for (const ws of dead) {
      this.sessions.delete(ws);
      try {
        ws.close(1011, 'Send failed');
      } catch {
        // Already closed
      }
    }
  }

  private cleanupDeadSessions(): void {
    const dead: WebSocket[] = [];
    for (const ws of this.sessions) {
      try {
        // readyState 3 = CLOSED
        if ((ws as unknown as { readyState: number }).readyState >= 2) {
          dead.push(ws);
        }
      } catch {
        dead.push(ws);
      }
    }
    for (const ws of dead) {
      this.sessions.delete(ws);
    }
  }
}

// =============================================================================
// Worker Entry Point
// =============================================================================

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // CORS headers for all responses
    const corsHeaders: Record<string, string> = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Upgrade, Connection',
      'Access-Control-Max-Age': '86400',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Resolve sport from query param (default: college-baseball)
    const sport = url.searchParams.get('sport') || 'college-baseball';

    // WebSocket upgrade -> route to sport-specific DO instance
    if (url.pathname === '/ws') {
      const id = env.LIVE_SCORES.idFromName(sport);
      const stub = env.LIVE_SCORES.get(id);
      return stub.fetch(request);
    }

    // Control endpoints -> route to sport-specific DO instance
    if (['/start', '/stop', '/status'].includes(url.pathname)) {
      const id = env.LIVE_SCORES.idFromName(sport);
      const stub = env.LIVE_SCORES.get(id);
      const res = await stub.fetch(request);
      // Add CORS to control responses
      const body = await res.text();
      return new Response(body, {
        status: res.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Health / info
    if (url.pathname === '/health') {
      return new Response(
        JSON.stringify({
          status: 'ok',
          service: 'bsi-live-scores',
          timestamp: new Date().toISOString(),
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        service: 'BSI Live Scores WebSocket',
        endpoints: {
          ws: '/ws',
          start: '/start',
          stop: '/stop',
          status: '/status',
          health: '/health',
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  },
};
