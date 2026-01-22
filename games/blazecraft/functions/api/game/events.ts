/**
 * BlazeCraft Game Events Endpoint
 *
 * GET  /api/game/events - SSE stream of game events
 * POST /api/game/events - Internal endpoint for poller to write events
 *
 * KV Key Patterns:
 *   BSI_GAME_SCORES:{sport}:{date}     -> JSON scores array (TTL: 30s)
 *   BSI_GAME_EVENTS:{seq}:{id}         -> Event queue item (TTL: 120s)
 *   BSI_CLIENT_CURSOR:{clientId}       -> Last seq seen (TTL: 300s)
 *   BSI_POLL_LOCK:{sport}              -> Rate limit lock (TTL: 10s)
 *   BSI_GLOBAL_SEQ                     -> Global sequence counter
 */

interface Env {
  BLAZECRAFT_CACHE: KVNamespace;
  BLAZECRAFT_ANALYTICS: AnalyticsEngineDataset;
  BSI_API_KEY?: string;
}

type SportType = 'mlb' | 'nfl' | 'nba' | 'college-baseball' | 'college-football';
type GameEventType =
  | 'WORLD_TICK'
  | 'GAME_START'
  | 'GAME_UPDATE'
  | 'GAME_FINAL'
  | 'STANDINGS_DELTA'
  | 'LINEUP_POSTED'
  | 'ODDS_SHIFT'
  | 'HIGHLIGHT_CLIP'
  | 'INJURY_ALERT';
type PremiumTier = 'pro' | 'elite' | null;

interface GameEvent {
  id: string;
  type: GameEventType;
  source: 'bsi' | 'agent' | 'system' | 'demo';
  timestamp: string;
  seq: number;
  payload: Record<string, unknown>;
  premiumTier: PremiumTier;
}

interface BSIScoreResponse {
  games?: Array<{
    id?: string;
    gameId?: string;
    homeTeam?: string;
    home_team?: string;
    awayTeam?: string;
    away_team?: string;
    homeScore?: number;
    home_score?: number;
    awayScore?: number;
    away_score?: number;
    status?: string;
    inning?: string;
    quarter?: string;
    clock?: string;
  }>;
}

// Key prefixes
const EVENTS_PREFIX = 'BSI_GAME_EVENTS:';
const SCORES_PREFIX = 'BSI_GAME_SCORES:';
const CURSOR_PREFIX = 'BSI_CLIENT_CURSOR:';
const LOCK_PREFIX = 'BSI_POLL_LOCK:';
const SEQ_KEY = 'BSI_GLOBAL_SEQ';

// Premium event types
const PREMIUM_EVENTS = new Set<GameEventType>(['LINEUP_POSTED', 'ODDS_SHIFT', 'HIGHLIGHT_CLIP']);

/**
 * Check if request is authorized via Bearer token or X-API-Key header
 */
function isAuthorized(request: Request, env: Env): boolean {
  const required = env.BSI_API_KEY;
  if (!required) return true; // no key configured = allow (dev mode)
  const auth = request.headers.get('Authorization') || '';
  const bearer = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  const xKey = (request.headers.get('X-API-Key') || '').trim();
  return bearer === required || xKey === required;
}

// Sports to poll
const ENABLED_SPORTS: SportType[] = ['mlb', 'nfl', 'nba'];

/**
 * Get next global sequence number
 */
async function getNextSeq(kv: KVNamespace): Promise<number> {
  const current = parseInt(await kv.get(SEQ_KEY) || '0', 10);
  const next = current + 1;
  await kv.put(SEQ_KEY, next.toString());
  return next;
}

/**
 * Write event to KV queue
 */
async function writeEvent(
  kv: KVNamespace,
  type: GameEventType,
  source: 'bsi' | 'agent' | 'system' | 'demo',
  payload: Record<string, unknown>,
  premiumTier: PremiumTier = null
): Promise<GameEvent> {
  const seq = await getNextSeq(kv);
  const id = crypto.randomUUID().slice(0, 8);

  const event: GameEvent = {
    id,
    type,
    source,
    timestamp: new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' }),
    seq,
    payload,
    premiumTier,
  };

  const key = `${EVENTS_PREFIX}${seq}:${id}`;
  await kv.put(key, JSON.stringify(event), { expirationTtl: 120 });

  return event;
}

/**
 * Check if tier has access to event
 */
function canAccessEvent(event: GameEvent, tier: PremiumTier): boolean {
  if (!PREMIUM_EVENTS.has(event.type)) return true;
  if (event.premiumTier === null) return true;
  if (tier === 'elite') return true;
  if (tier === 'pro' && event.premiumTier === 'pro') return true;
  return false;
}

/**
 * Acquire poll lock for a sport (prevents concurrent polls)
 */
async function acquireLock(kv: KVNamespace, sport: SportType): Promise<boolean> {
  const key = `${LOCK_PREFIX}${sport}`;
  const existing = await kv.get(key);
  if (existing) return false;

  await kv.put(key, Date.now().toString(), { expirationTtl: 10 });
  return true;
}

/**
 * Normalize score status
 */
function normalizeStatus(status: string): 'scheduled' | 'in_progress' | 'final' | 'delayed' {
  const s = status.toLowerCase();
  if (s.includes('progress') || s.includes('live') || s.includes('active')) return 'in_progress';
  if (s.includes('final') || s.includes('complete') || s.includes('ended')) return 'final';
  if (s.includes('delay') || s.includes('postpone')) return 'delayed';
  return 'scheduled';
}

interface NormalizedScore {
  gameId: string;
  sport: SportType;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  status: 'scheduled' | 'in_progress' | 'final' | 'delayed';
  period?: string;
  clock?: string;
}

/**
 * Poll BSI for score updates
 */
async function pollBSI(env: Env, sport: SportType): Promise<void> {
  const kv = env.BLAZECRAFT_CACHE;

  if (!await acquireLock(kv, sport)) return;

  try {
    const apiKey = env.BSI_API_KEY || '';
    const response = await fetch(`https://blazesportsintel.com/api/scores/${sport}`, {
      headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : {},
    });

    if (!response.ok) return;

    const data = await response.json() as BSIScoreResponse;
    if (!data.games) return;

    const today = new Date().toISOString().slice(0, 10);
    const cacheKey = `${SCORES_PREFIX}${sport}:${today}`;
    const cached = await kv.get(cacheKey);
    const prevScores: Record<string, NormalizedScore> = cached ? JSON.parse(cached) : {};

    const newScores: Record<string, NormalizedScore> = {};

    for (const game of data.games) {
      const gameId = String(game.id || game.gameId || `${sport}-${Date.now()}`);
      const score: NormalizedScore = {
        gameId,
        sport,
        homeTeam: String(game.homeTeam || game.home_team || 'Home'),
        awayTeam: String(game.awayTeam || game.away_team || 'Away'),
        homeScore: Number(game.homeScore || game.home_score || 0),
        awayScore: Number(game.awayScore || game.away_score || 0),
        status: normalizeStatus(String(game.status || 'scheduled')),
        period: game.inning || game.quarter,
        clock: game.clock,
      };

      newScores[gameId] = score;
      const prev = prevScores[gameId];

      // Detect game start
      if (prev?.status === 'scheduled' && score.status === 'in_progress') {
        await writeEvent(kv, 'GAME_START', 'bsi', {
          gameId: score.gameId,
          sport: score.sport,
          homeTeam: score.homeTeam,
          awayTeam: score.awayTeam,
          startTime: new Date().toISOString(),
        });
      }

      // Detect score change
      if (prev && (prev.homeScore !== score.homeScore || prev.awayScore !== score.awayScore)) {
        const prevLead = prev.homeScore > prev.awayScore ? 'home' : prev.awayScore > prev.homeScore ? 'away' : 'tie';
        await writeEvent(kv, 'GAME_UPDATE', 'bsi', {
          gameId: score.gameId,
          sport: score.sport,
          homeTeam: score.homeTeam,
          awayTeam: score.awayTeam,
          homeScore: score.homeScore,
          awayScore: score.awayScore,
          period: score.period,
          clock: score.clock,
          previousLead: prevLead,
        });
      }

      // Detect game end
      if (prev?.status === 'in_progress' && score.status === 'final') {
        const winner = score.homeScore > score.awayScore ? score.homeTeam : score.awayTeam;
        await writeEvent(kv, 'GAME_FINAL', 'bsi', {
          gameId: score.gameId,
          sport: score.sport,
          homeTeam: score.homeTeam,
          awayTeam: score.awayTeam,
          homeScore: score.homeScore,
          awayScore: score.awayScore,
          winner,
        });
      }
    }

    await kv.put(cacheKey, JSON.stringify(newScores), { expirationTtl: 30 });
  } catch (err) {
    console.error(`[GameEvents] Poll error for ${sport}:`, err);
  }
}

/**
 * GET - SSE stream of events
 */
async function handleSSE(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const clientId = url.searchParams.get('clientId') || crypto.randomUUID();
  const tier = (url.searchParams.get('tier') as PremiumTier) || null;

  const kv = env.BLAZECRAFT_CACHE;
  const cursorKey = `${CURSOR_PREFIX}${clientId}`;
  let lastSeq = parseInt(await kv.get(cursorKey) || '0', 10);

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (eventType: string, data: unknown): void => {
        const msg = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(msg));
      };

      send('connected', { clientId, timestamp: Date.now() });

      let isRunning = true;
      let tickCounter = 0;

      const poll = async (): Promise<void> => {
        if (!isRunning) return;

        try {
          // Every 10 polls (5s), trigger BSI poll for each sport
          tickCounter++;
          if (tickCounter >= 10) {
            tickCounter = 0;
            for (const sport of ENABLED_SPORTS) {
              pollBSI(env, sport).catch(() => {});
            }
          }

          // Fetch events newer than cursor
          const list = await kv.list({ prefix: EVENTS_PREFIX });

          for (const key of list.keys) {
            const parts = key.name.split(':');
            const seq = parseInt(parts[1], 10);

            if (seq > lastSeq) {
              const eventData = await kv.get(key.name);
              if (eventData) {
                const event = JSON.parse(eventData) as GameEvent;
                if (canAccessEvent(event, tier)) {
                  send('game_event', event);
                }
                lastSeq = seq;
              }
            }
          }

          await kv.put(cursorKey, lastSeq.toString(), { expirationTtl: 300 });

          // Heartbeat every poll
          send('heartbeat', { timestamp: Date.now(), seq: lastSeq });
        } catch (err) {
          console.error('[SSE] Poll error:', err);
        }

        if (isRunning) {
          setTimeout(poll, 500);
        }
      };

      poll();

      request.signal?.addEventListener('abort', () => {
        isRunning = false;
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
    },
  });
}

/**
 * POST - Write event (internal or from agent)
 */
async function handlePost(request: Request, env: Env): Promise<Response> {
  if (!isAuthorized(request, env)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }

  try {
    const body = await request.json() as Partial<GameEvent>;

    if (!body.type) {
      return new Response(JSON.stringify({ error: 'Missing event type' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const event = await writeEvent(
      env.BLAZECRAFT_CACHE,
      body.type as GameEventType,
      body.source || 'system',
      (body.payload || {}) as Record<string, unknown>,
      body.premiumTier || null
    );

    env.BLAZECRAFT_ANALYTICS?.writeDataPoint({
      blobs: [event.type, event.source, event.id],
      doubles: [event.seq],
      indexes: [event.type],
    });

    return new Response(JSON.stringify({ success: true, event }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err) {
    console.error('[GameEvents] POST error:', err);
    return new Response(JSON.stringify({ error: 'Invalid request body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

/**
 * OPTIONS - CORS preflight
 */
function handleOptions(): Response {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
      'Access-Control-Max-Age': '86400',
    },
  });
}

/**
 * Main handler
 */
export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  if (request.method === 'OPTIONS') return handleOptions();
  if (request.method === 'GET') return handleSSE(request, env);
  if (request.method === 'POST') return handlePost(request, env);

  return new Response('Method not allowed', { status: 405 });
};
