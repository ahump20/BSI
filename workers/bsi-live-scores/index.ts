/**
 * BSI Live Scores — WebSocket Worker with Durable Objects
 *
 * Real-time college baseball score updates via WebSocket. The LiveScoresDO
 * Durable Object maintains WebSocket connections and polls the ESPN college
 * baseball scoreboard API every 15 seconds, broadcasting only changed games
 * (deltas) to all connected clients.
 *
 * Routes:
 *   GET /ws      — Upgrade to WebSocket (proxied to LiveScoresDO)
 *   GET /health  — Health check
 *   GET /scores  — REST fallback returning current scores from KV cache
 *
 * Deploy: wrangler deploy --config workers/bsi-live-scores/wrangler.toml
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Env {
  LIVE_SCORES: DurableObjectNamespace;
  BSI_PROD_CACHE: KVNamespace;
  TIMEZONE: string;
}

interface GameCompetitor {
  team?: { displayName?: string; abbreviation?: string; logo?: string };
  score?: string;
  homeAway?: string;
  winner?: boolean;
}

interface GameStatus {
  type?: { id?: string; name?: string; state?: string; completed?: boolean; description?: string; detail?: string };
  period?: number;
  displayClock?: string;
}

interface ESPNEvent {
  id: string;
  name?: string;
  shortName?: string;
  date?: string;
  status?: GameStatus;
  competitions?: Array<{
    id?: string;
    competitors?: GameCompetitor[];
    situation?: {
      balls?: number;
      strikes?: number;
      outs?: number;
      onFirst?: boolean;
      onSecond?: boolean;
      onThird?: boolean;
      batter?: { displayName?: string };
      pitcher?: { displayName?: string };
    };
  }>;
}

interface ESPNScoreboard {
  events?: ESPNEvent[];
}

export interface NormalizedGame {
  id: string;
  name: string;
  shortName: string;
  date: string;
  status: {
    state: string;
    detail: string;
    period: number;
    completed: boolean;
  };
  homeTeam: {
    name: string;
    abbreviation: string;
    score: number;
    logo: string;
    winner: boolean;
  };
  awayTeam: {
    name: string;
    abbreviation: string;
    score: number;
    logo: string;
    winner: boolean;
  };
  situation?: {
    balls: number;
    strikes: number;
    outs: number;
    onFirst: boolean;
    onSecond: boolean;
    onThird: boolean;
    batter: string;
    pitcher: string;
  };
}

interface ScoresUpdateMessage {
  type: 'scores_update';
  games: NormalizedGame[];
  meta: {
    source: 'espn';
    fetched_at: string;
    timezone: 'America/Chicago';
  };
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ESPN_SCOREBOARD_URL =
  'https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball/scoreboard';
const POLL_INTERVAL_MS = 15_000;
const FETCH_TIMEOUT_MS = 10_000;
const KV_SCORES_KEY = 'live:cbb:scores';
const KV_SCORES_TTL = 60;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function normalizeGame(event: ESPNEvent): NormalizedGame {
  const competition = event.competitions?.[0];
  const competitors = competition?.competitors ?? [];
  const home = competitors.find((c) => c.homeAway === 'home');
  const away = competitors.find((c) => c.homeAway === 'away');
  const status = event.status;
  const situation = competition?.situation;

  return {
    id: event.id,
    name: event.name ?? '',
    shortName: event.shortName ?? '',
    date: event.date ?? '',
    status: {
      state: status?.type?.state ?? 'pre',
      detail: status?.type?.detail ?? '',
      period: status?.period ?? 0,
      completed: status?.type?.completed ?? false,
    },
    homeTeam: {
      name: home?.team?.displayName ?? 'TBD',
      abbreviation: home?.team?.abbreviation ?? '',
      score: parseInt(home?.score ?? '0', 10) || 0,
      logo: home?.team?.logo ?? '',
      winner: home?.winner ?? false,
    },
    awayTeam: {
      name: away?.team?.displayName ?? 'TBD',
      abbreviation: away?.team?.abbreviation ?? '',
      score: parseInt(away?.score ?? '0', 10) || 0,
      logo: away?.team?.logo ?? '',
      winner: away?.winner ?? false,
    },
    ...(situation
      ? {
          situation: {
            balls: situation.balls ?? 0,
            strikes: situation.strikes ?? 0,
            outs: situation.outs ?? 0,
            onFirst: situation.onFirst ?? false,
            onSecond: situation.onSecond ?? false,
            onThird: situation.onThird ?? false,
            batter: situation.batter?.displayName ?? '',
            pitcher: situation.pitcher?.displayName ?? '',
          },
        }
      : {}),
  };
}

function gameFingerprint(game: NormalizedGame): string {
  return [
    game.id,
    game.homeTeam.score,
    game.awayTeam.score,
    game.status.state,
    game.status.detail,
    game.status.period,
    game.status.completed,
    game.situation?.outs ?? '',
    game.situation?.balls ?? '',
    game.situation?.strikes ?? '',
  ].join('|');
}

// ---------------------------------------------------------------------------
// Durable Object: LiveScoresDO
// ---------------------------------------------------------------------------

export class LiveScoresDO {
  private state: DurableObjectState;
  private env: Env;
  private sessions: Set<WebSocket> = new Set();
  private currentGames: Map<string, NormalizedGame> = new Map();
  private fingerprints: Map<string, string> = new Map();
  private pollAlarmSet = false;

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/ws') {
      return this.handleWebSocket(request);
    }

    return new Response('Not found', { status: 404 });
  }

  private handleWebSocket(_request: Request): Response {
    const pair = new WebSocketPair();
    const [client, server] = [pair[0], pair[1]];

    this.state.acceptWebSocket(server);
    this.sessions.add(server);

    // Send current state to the newly connected client
    if (this.currentGames.size > 0) {
      const games = Array.from(this.currentGames.values());
      const message: ScoresUpdateMessage = {
        type: 'scores_update',
        games,
        meta: {
          source: 'espn',
          fetched_at: new Date().toISOString(),
          timezone: 'America/Chicago',
        },
      };
      try {
        server.send(JSON.stringify(message));
      } catch {
        // Client may have disconnected immediately
      }
    }

    // Schedule polling alarm if not already set
    if (!this.pollAlarmSet) {
      this.schedulePollAlarm();
    }

    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketClose(ws: WebSocket, _code: number, _reason: string, _wasClean: boolean): Promise<void> {
    this.sessions.delete(ws);
  }

  async webSocketError(ws: WebSocket, _error: unknown): Promise<void> {
    this.sessions.delete(ws);
    try {
      ws.close(1011, 'WebSocket error');
    } catch {
      // Already closed
    }
  }

  async webSocketMessage(_ws: WebSocket, _message: string | ArrayBuffer): Promise<void> {
    // Clients don't send actionable messages; ignore gracefully
  }

  async alarm(): Promise<void> {
    this.pollAlarmSet = false;

    // Clean up dead connections
    for (const ws of this.sessions) {
      try {
        ws.send('');
        // If ping fails, readyState check
      } catch {
        this.sessions.delete(ws);
      }
    }

    // No connected clients — stop polling
    if (this.sessions.size === 0) {
      this.currentGames.clear();
      this.fingerprints.clear();
      return;
    }

    await this.fetchAndBroadcast();
    this.schedulePollAlarm();
  }

  private schedulePollAlarm(): void {
    this.pollAlarmSet = true;
    this.state.storage.setAlarm(Date.now() + POLL_INTERVAL_MS);
  }

  private async fetchAndBroadcast(): Promise<void> {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

      const response = await fetch(ESPN_SCOREBOARD_URL, {
        headers: { 'User-Agent': 'BSI-LiveScores/1.0' },
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (!response.ok) return;

      const data = (await response.json()) as ESPNScoreboard;
      const events = data.events ?? [];
      const games = events.map(normalizeGame);
      const now = new Date().toISOString();

      // Compute delta — only games whose fingerprint changed
      const changedGames: NormalizedGame[] = [];

      for (const game of games) {
        const fp = gameFingerprint(game);
        const prevFp = this.fingerprints.get(game.id);

        if (fp !== prevFp) {
          changedGames.push(game);
          this.fingerprints.set(game.id, fp);
        }

        this.currentGames.set(game.id, game);
      }

      // Remove games no longer in the scoreboard
      const currentIds = new Set(games.map((g) => g.id));
      for (const id of this.currentGames.keys()) {
        if (!currentIds.has(id)) {
          this.currentGames.delete(id);
          this.fingerprints.delete(id);
        }
      }

      // Broadcast delta if anything changed
      if (changedGames.length > 0) {
        const message: ScoresUpdateMessage = {
          type: 'scores_update',
          games: changedGames,
          meta: {
            source: 'espn',
            fetched_at: now,
            timezone: 'America/Chicago',
          },
        };
        const payload = JSON.stringify(message);
        this.broadcast(payload);
      }

      // Write full state to KV for REST fallback
      const allGames = Array.from(this.currentGames.values());
      await this.env.BSI_PROD_CACHE.put(
        KV_SCORES_KEY,
        JSON.stringify({
          games: allGames,
          meta: { source: 'espn', fetched_at: now, timezone: 'America/Chicago' },
        }),
        { expirationTtl: KV_SCORES_TTL }
      );
    } catch {
      // Non-fatal — will retry on next alarm
    }
  }

  private broadcast(payload: string): void {
    for (const ws of this.sessions) {
      try {
        ws.send(payload);
      } catch {
        this.sessions.delete(ws);
        try {
          ws.close(1011, 'Send failed');
        } catch {
          // Already closed
        }
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Hono App
// ---------------------------------------------------------------------------

const app = new Hono<{ Bindings: Env }>();

app.use('*', cors({
  origin: [
    'https://blazesportsintel.com',
    'https://www.blazesportsintel.com',
    'http://localhost:3000',
  ],
  allowMethods: ['GET', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Upgrade', 'Connection'],
  maxAge: 86400,
}));

// Health check
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    worker: 'bsi-live-scores',
    timestamp: new Date().toISOString(),
    timezone: c.env.TIMEZONE,
  });
});

// REST fallback — return current scores from KV cache
app.get('/scores', async (c) => {
  const cached = await c.env.BSI_PROD_CACHE.get(KV_SCORES_KEY, 'text');

  if (!cached) {
    return c.json({
      games: [],
      meta: {
        source: 'espn',
        fetched_at: new Date().toISOString(),
        timezone: 'America/Chicago',
      },
    });
  }

  return c.json(JSON.parse(cached));
});

// WebSocket upgrade — proxy to Durable Object
app.get('/ws', async (c) => {
  const upgradeHeader = c.req.header('Upgrade');
  if (upgradeHeader !== 'websocket') {
    return c.text('Expected WebSocket upgrade', 426);
  }

  const id = c.env.LIVE_SCORES.idFromName('scores-singleton');
  const stub = c.env.LIVE_SCORES.get(id);

  return stub.fetch(new Request('https://do/ws', {
    headers: c.req.raw.headers,
  }));
});

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

export default app;
