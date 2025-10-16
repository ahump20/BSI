/**
 * Cloudflare Workers API - Live Sports Data
 * Real-time scores, rankings, and stats using actual API keys
 */

interface QueueMessage<T = unknown> {
  id: string;
  timestamp?: number;
  body?: T | string | ArrayBuffer;
  sequence?: number;
}

interface QueueListResult<T = unknown> {
  messages?: QueueMessage<T>[];
}

interface LiveStatsQueue<T = unknown> {
  list?: (options?: { limit?: number }) => Promise<QueueListResult<T> | QueueMessage<T>[]>;
  receive?: (options?: { maxMessages?: number }) => Promise<QueueMessage<T>[]>;
  dequeue?: (options?: { batchSize?: number }) => Promise<QueueMessage<T>[]>;
  acknowledge?: (ids: string[]) => Promise<void>;
  ack?: (ids: string[]) => Promise<void>;
}

interface Env {
  SPORTSDATAIO_API_KEY: string;
  CFBDATA_API_KEY: string;
  THEODDS_API_KEY: string;
  SPORTS_CACHE: KVNamespace;
  NCAA_BASEBALL_QUEUE?: LiveStatsQueue<NCAABaseballQueuePayload>;
}

interface BaseState {
  first: boolean;
  second: boolean;
  third: boolean;
}

interface NCAABaseballQueuePayload {
  gameId: string;
  sequence?: number;
  timestamp?: string;
  event?: {
    type?: string;
    description?: string;
    batter?: string;
    pitcher?: string;
    result?: string;
    pitchCount?: {
      balls?: number;
      strikes?: number;
      pitches?: number;
    };
  };
  state?: {
    inning?: number;
    half?: 'top' | 'bottom';
    outs?: number;
    balls?: number;
    strikes?: number;
    pitches?: number;
    bases?: {
      first?: boolean;
      second?: boolean;
      third?: boolean;
      onFirst?: boolean;
      onSecond?: boolean;
      onThird?: boolean;
    };
    score?: {
      home?: number;
      away?: number;
    };
  };
  winExpectancy?: {
    home?: number;
    away?: number;
    source?: string;
  };
  previousWinExpectancy?: {
    home?: number;
    away?: number;
  };
}

interface LiveFrame {
  sequence: number;
  timestamp: string;
  inning: number;
  half: 'top' | 'bottom';
  outs: number;
  bases: BaseState;
  count: {
    balls: number;
    strikes: number;
    pitches: number;
  };
  score: {
    home: number;
    away: number;
  };
  event: {
    type: string;
    description: string;
    batter?: string;
    pitcher?: string;
    result?: string;
  };
  winExpectancy: {
    home: number | null;
    away: number | null;
    delta: number | null;
    source?: string;
  };
}

interface InningSnapshot {
  inning: number;
  half: 'top' | 'bottom';
  startSequence: number;
  endSequence: number;
  events: Array<{
    sequence: number;
    timestamp: string;
    summary: string;
    outs: number;
    bases: BaseState;
    score: LiveFrame['score'];
    winExpectancy: LiveFrame['winExpectancy'];
  }>;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env, params } = context;
  const url = new URL(request.url);

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const route = (params.route as string[]) || [];
    const [sport, action] = route;

    // Route handling
    switch (`${sport}/${action}`) {
      case 'ncaa/football':
        return await getNCAAFootball(url, env);

      case 'ncaa/baseball':
        return await streamNCAABaseball(url, env);

      case 'mlb/scores':
        return await getMLBScores(url, env);

      case 'nfl/scores':
        return await getNFLScores(url, env);

      case 'nba/scores':
        return await getNBAScores(url, env);

      case 'all/scores':
        return await getAllScores(url, env);

      default:
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Invalid route',
            availableRoutes: [
              '/api/live/ncaa/football',
              '/api/live/ncaa/baseball',
              '/api/live/mlb/scores',
              '/api/live/nfl/scores',
              '/api/live/nba/scores',
              '/api/live/all/scores',
            ],
          }),
          {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
    }
  } catch (error: any) {
    console.error('API Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Internal server error',
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
};

/**
 * Get NCAA Football Rankings
 */
async function getNCAAFootball(url: URL, env: Env) {
  const year = url.searchParams.get('year') || '2025';
  const week = url.searchParams.get('week');
  const cacheKey = `ncaa:football:${year}:${week || 'latest'}`;

  // Try cache first
  const cached = await env.SPORTS_CACHE?.get(cacheKey, 'json');
  if (cached && (cached as any).expires > Date.now()) {
    return new Response(
      JSON.stringify({ ...(cached as any).data, cached: true }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=300',
        },
      }
    );
  }

  // Fetch from CollegeFootballData API
  const weekParam = week ? `&week=${week}` : '';
  const apiUrl = `https://api.collegefootballdata.com/rankings?year=${year}${weekParam}`;

  const response = await fetch(apiUrl, {
    headers: {
      'Authorization': `Bearer ${env.CFBDATA_API_KEY}`,
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`CollegeFootballData API error: ${response.status}`);
  }

  const data = await response.json();

  // Transform to our format
  const rankings: any[] = [];

  if (Array.isArray(data) && data.length > 0) {
    const latestPoll = data[0];
    const apPoll = latestPoll.polls?.find((p: any) => p.poll === 'AP Top 25');

    if (apPoll) {
      apPoll.ranks?.forEach((rank: any) => {
        const wins = rank.wins || 0;
        const losses = rank.losses || 0;
        const totalGames = wins + losses || 1;
        const winPct = wins / totalGames;

        // Blaze Composite Rating
        const performance = winPct * 40;
        const talent = 75 * 0.3;
        const historical = 75 * 0.2;
        const sos = 75 * 0.1;
        const compositeRating = Math.round((performance + talent + historical + sos) * 10) / 10;

        rankings.push({
          rank: rank.rank,
          team: rank.school,
          school: rank.school,
          conference: rank.conference || '',
          record: `${wins}-${losses}`,
          wins,
          losses,
          winPct: Math.round(winPct * 1000) / 1000,
          rating: compositeRating,
          firstPlaceVotes: rank.firstPlaceVotes || 0,
          points: rank.points || 0,
        });
      });
    }
  }

  const responseData = {
    success: true,
    sport: 'ncaa-football',
    season: year,
    week: week || 'latest',
    rankings,
    meta: {
      dataSource: 'CollegeFootballData API',
      lastUpdated: new Date().toISOString(),
      timezone: 'America/Chicago',
      totalTeams: rankings.length,
    },
  };

  // Cache for 5 minutes
  if (env.SPORTS_CACHE) {
    await env.SPORTS_CACHE.put(
      cacheKey,
      JSON.stringify({
        data: responseData,
        expires: Date.now() + 5 * 60 * 1000,
      }),
      { expirationTtl: 300 }
    );
  }

  return new Response(JSON.stringify({ ...responseData, cached: false }), {
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=300',
    },
  });
}

async function streamNCAABaseball(url: URL, env: Env) {
  const gameId = url.searchParams.get('gameId');
  const sequenceParam = url.searchParams.get('sequence');

  if (!gameId) {
    return new Response(
      JSON.stringify({ success: false, error: 'Missing required gameId query parameter' }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  let sinceSequence = 0;
  if (sequenceParam) {
    sinceSequence = Number(sequenceParam);
    if (!Number.isFinite(sinceSequence) || sinceSequence < 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'sequence must be a non-negative number' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
  }

  const queueMessages = await readQueueMessages(env.NCAA_BASEBALL_QUEUE);
  const frames: LiveFrame[] = [];
  const ackIds: string[] = [];
  let latestSequence = sinceSequence;
  let previousWinExpectancyHint: number | null = null;

  for (const message of queueMessages) {
    const payload = normaliseQueuePayload(message.body);
    if (!payload || payload.gameId !== gameId) {
      continue;
    }

    const resolvedSequence = resolveSequenceNumber(payload, message);
    if (resolvedSequence <= sinceSequence) {
      // Preserve the last seen win expectancy to provide delta when we return cached data
      if (payload.winExpectancy?.home != null) {
        previousWinExpectancyHint = normaliseProbability(payload.winExpectancy.home);
      }
      continue;
    }

    const frame = mapPayloadToFrame(payload, message, resolvedSequence);
    if (!frame) {
      continue;
    }

    frames.push(frame);
    ackIds.push(message.id);
    latestSequence = Math.max(latestSequence, resolvedSequence);
  }

  frames.sort((a, b) => a.sequence - b.sequence);
  applyWinExpectancyDelta(frames, previousWinExpectancyHint);

  if (ackIds.length > 0) {
    await acknowledgeQueueMessages(env.NCAA_BASEBALL_QUEUE, ackIds);
  }

  const cacheKey = `ncaa:baseball:live:${gameId}`;
  let cacheHit = false;

  if (env.SPORTS_CACHE) {
    if (frames.length > 0) {
      const latestFrame = frames[frames.length - 1];
      await env.SPORTS_CACHE.put(cacheKey, JSON.stringify(latestFrame), { expirationTtl: 10 });
    } else {
      const cachedFrame = (await env.SPORTS_CACHE.get(cacheKey, 'json')) as LiveFrame | null;
      if (cachedFrame && cachedFrame.sequence > sinceSequence) {
        frames.push(cachedFrame);
        frames.sort((a, b) => a.sequence - b.sequence);
        applyWinExpectancyDelta(frames, previousWinExpectancyHint);
        latestSequence = Math.max(latestSequence, cachedFrame.sequence);
        cacheHit = true;
      }
    }
  }

  const innings = buildInningSnapshots(frames);

  const responseBody = {
    success: true,
    sport: 'ncaa-baseball',
    gameId,
    sequence: latestSequence,
    frames,
    innings,
    meta: {
      dataSource: 'BSI LiveStats Ingest',
      lastUpdated: new Date().toISOString(),
      delivered: frames.length,
      cacheHit,
    },
  };

  return new Response(JSON.stringify(responseBody), {
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store, max-age=0',
    },
  });
}

async function readQueueMessages(
  queue?: LiveStatsQueue<NCAABaseballQueuePayload>
): Promise<QueueMessage<NCAABaseballQueuePayload>[]> {
  if (!queue) {
    return [];
  }

  try {
    if (typeof queue.list === 'function') {
      const result = await queue.list({ limit: 200 });
      if (Array.isArray(result)) {
        return result as QueueMessage<NCAABaseballQueuePayload>[];
      }
      if (result?.messages && Array.isArray(result.messages)) {
        return result.messages as QueueMessage<NCAABaseballQueuePayload>[];
      }
    }

    if (typeof queue.receive === 'function') {
      const messages = await queue.receive({ maxMessages: 200 });
      if (Array.isArray(messages)) {
        return messages as QueueMessage<NCAABaseballQueuePayload>[];
      }
    }

    if (typeof queue.dequeue === 'function') {
      const messages = await queue.dequeue({ batchSize: 200 });
      if (Array.isArray(messages)) {
        return messages as QueueMessage<NCAABaseballQueuePayload>[];
      }
    }
  } catch (error) {
    console.error('Failed to read NCAA baseball queue:', error);
  }

  return [];
}

function normalizeQueuePayload(body: any): NCAABaseballQueuePayload | null {
  if (!body) {
    return null;
  }

  if (typeof body === 'string') {
    try {
      return JSON.parse(body);
    } catch (error) {
      console.error('Unable to parse NCAA baseball queue payload string:', error);
      return null;
    }
  }

  if (body instanceof ArrayBuffer) {
    try {
      const decoded = new TextDecoder().decode(body);
      return JSON.parse(decoded);
    } catch (error) {
      console.error('Unable to decode NCAA baseball queue ArrayBuffer:', error);
      return null;
    }
  }

  if (ArrayBuffer.isView(body)) {
    try {
      const decoded = new TextDecoder().decode(body as ArrayBufferView);
      return JSON.parse(decoded);
    } catch (error) {
      console.error('Unable to decode NCAA baseball queue buffer view:', error);
      return null;
    }
  }

  if (typeof body === 'object') {
    return body as NCAABaseballQueuePayload;
  }

  return null;
}

function resolveSequenceNumber(
  payload: NCAABaseballQueuePayload,
  message: QueueMessage<NCAABaseballQueuePayload>
): number {
  if (typeof payload.sequence === 'number') {
    return payload.sequence;
  }

  if (typeof message.sequence === 'number') {
    return message.sequence;
  }

  if (typeof message.timestamp === 'number') {
    return message.timestamp;
  }

  if (payload.timestamp) {
    const parsed = Date.parse(payload.timestamp);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }

  return Date.now();
}

function mapPayloadToFrame(
  payload: NCAABaseballQueuePayload,
  message: QueueMessage<NCAABaseballQueuePayload>,
  sequence: number
): LiveFrame | null {
  const inning = toPositiveInteger(payload.state?.inning, 1);
  const half = normaliseHalf(payload.state?.half);
  const outs = toPositiveInteger(payload.state?.outs, 0);
  const bases = normaliseBaseState(payload.state?.bases);

  const pitchCount = payload.event?.pitchCount || {};
  const count = {
    balls: toPositiveInteger(payload.state?.balls ?? pitchCount.balls, 0),
    strikes: toPositiveInteger(payload.state?.strikes ?? pitchCount.strikes, 0),
    pitches: toPositiveInteger(payload.state?.pitches ?? pitchCount.pitches, 0),
  };

  const score = {
    home: toPositiveInteger(payload.state?.score?.home, 0),
    away: toPositiveInteger(payload.state?.score?.away, 0),
  };

  const event = {
    type: payload.event?.type || 'unknown',
    description: payload.event?.description || payload.event?.result || 'Play update',
    batter: payload.event?.batter,
    pitcher: payload.event?.pitcher,
    result: payload.event?.result,
  };

  const homeProbability = normaliseProbability(payload.winExpectancy?.home);
  const awayProbability = normaliseProbability(payload.winExpectancy?.away);
  const previousHomeProbability = normaliseProbability(payload.previousWinExpectancy?.home);

  const delta =
    homeProbability != null && previousHomeProbability != null
      ? roundToPrecision(homeProbability - previousHomeProbability)
      : null;

  const timestamp = payload.timestamp
    ? new Date(payload.timestamp).toISOString()
    : message.timestamp
    ? new Date(message.timestamp).toISOString()
    : new Date().toISOString();

  return {
    sequence,
    timestamp,
    inning,
    half,
    outs,
    bases,
    count,
    score,
    event,
    winExpectancy: {
      home: homeProbability,
      away: awayProbability,
      delta,
      source: payload.winExpectancy?.source,
    },
  };
}

function applyWinExpectancyDelta(frames: LiveFrame[], fallback: number | null) {
  let previousHome = fallback ?? null;

  for (const frame of frames) {
    if (frame.winExpectancy.home != null) {
      if (previousHome != null) {
        frame.winExpectancy.delta = roundToPrecision(frame.winExpectancy.home - previousHome);
      } else if (frame.winExpectancy.delta != null) {
        frame.winExpectancy.delta = roundToPrecision(frame.winExpectancy.delta);
      } else {
        frame.winExpectancy.delta = null;
      }

      previousHome = frame.winExpectancy.home;
    } else {
      frame.winExpectancy.delta = null;
    }
  }
}

async function acknowledgeQueueMessages(
  queue: LiveStatsQueue<NCAABaseballQueuePayload> | undefined,
  ids: string[]
) {
  if (!queue || ids.length === 0) {
    return;
  }

  try {
    if (typeof queue.acknowledge === 'function') {
      await queue.acknowledge(ids);
      return;
    }

    if (typeof queue.ack === 'function') {
      await queue.ack(ids);
    }
  } catch (error) {
    console.error('Failed to acknowledge NCAA baseball queue messages:', error);
  }
}

function buildInningSnapshots(frames: LiveFrame[]): InningSnapshot[] {
  const innings = new Map<string, InningSnapshot>();

  for (const frame of frames) {
    const key = `${frame.inning}-${frame.half}`;
    if (!innings.has(key)) {
      innings.set(key, {
        inning: frame.inning,
        half: frame.half,
        startSequence: frame.sequence,
        endSequence: frame.sequence,
        events: [],
      });
    }

    const snapshot = innings.get(key)!;
    snapshot.startSequence = Math.min(snapshot.startSequence, frame.sequence);
    snapshot.endSequence = Math.max(snapshot.endSequence, frame.sequence);
    snapshot.events.push({
      sequence: frame.sequence,
      timestamp: frame.timestamp,
      summary: frame.event.description,
      outs: frame.outs,
      bases: frame.bases,
      score: frame.score,
      winExpectancy: frame.winExpectancy,
    });
  }

  const order = (half: 'top' | 'bottom') => (half === 'top' ? 0 : 1);

  return Array.from(innings.values())
    .map((snapshot) => ({
      ...snapshot,
      events: snapshot.events.sort((a, b) => a.sequence - b.sequence),
    }))
    .sort((a, b) => {
      if (a.inning === b.inning) {
        if (a.half === b.half) {
          return a.startSequence - b.startSequence;
        }
        return order(a.half) - order(b.half);
      }
      return a.inning - b.inning;
    });
}

function normalizeBaseState(bases?: NCAABaseballQueuePayload['state']['bases']): BaseState {
  return {
    first: Boolean(bases?.first ?? bases?.onFirst ?? false),
    second: Boolean(bases?.second ?? bases?.onSecond ?? false),
    third: Boolean(bases?.third ?? bases?.onThird ?? false),
  };
}

function toPositiveInteger(value: unknown, fallback: number): number {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue) || numberValue < 0) {
    return fallback;
  }
  return Math.trunc(numberValue);
}

function normaliseHalf(half?: string | null): 'top' | 'bottom' {
  if (!half) {
    return 'top';
  }

  const lowered = half.toLowerCase();
  if (lowered.startsWith('bot')) {
    return 'bottom';
  }
  return 'top';
}

function normalizeProbability(value: unknown): number | null {
  if (value == null) {
    return null;
  }

  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return null;
  }

  if (numeric >= 0 && numeric <= 1) {
    return roundToPrecision(numeric);
  }

  if (numeric >= 0 && numeric <= 100) {
    return roundToPrecision(numeric / 100);
  }

  const clamped = Math.min(Math.max(numeric, 0), 1);
  return roundToPrecision(clamped);
}

function roundToPrecision(value: number): number {
  return Math.round(value * 10000) / 10000;
}

/**
 * Get Live MLB Scores
 */
async function getMLBScores(url: URL, env: Env) {
  const date = url.searchParams.get('date') || new Date().toISOString().split('T')[0];
  const cacheKey = `mlb:live:${date}`;

  // Try cache first (30-second TTL for live data)
  const cached = await env.SPORTS_CACHE?.get(cacheKey, 'json');
  if (cached && (cached as any).expires > Date.now()) {
    return new Response(
      JSON.stringify({ ...(cached as any).data, cached: true }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=30',
        },
      }
    );
  }

  // Fetch from SportsDataIO
  const apiUrl = `https://api.sportsdata.io/v3/mlb/scores/json/GamesByDate/${date}`;

  const response = await fetch(apiUrl, {
    headers: {
      'Ocp-Apim-Subscription-Key': env.SPORTSDATAIO_API_KEY,
    },
  });

  if (!response.ok) {
    throw new Error(`SportsDataIO API error: ${response.status}`);
  }

  const data = await response.json();

  const games = (Array.isArray(data) ? data : []).map((game: any) => ({
    id: game.GameID?.toString(),
    sport: 'baseball',
    homeTeam: {
      id: game.HomeTeamID?.toString(),
      name: game.HomeTeam,
      score: game.HomeTeamRuns || 0,
      logo: `https://cdn.sportsdata.io/mlb/logos/${game.HomeTeam}.png`,
    },
    awayTeam: {
      id: game.AwayTeamID?.toString(),
      name: game.AwayTeam,
      score: game.AwayTeamRuns || 0,
      logo: `https://cdn.sportsdata.io/mlb/logos/${game.AwayTeam}.png`,
    },
    status: game.Status === 'Final' ? 'final' : game.Status === 'InProgress' ? 'in_progress' : 'scheduled',
    inning: game.Inning ? `Inning ${game.Inning}` : null,
    inningHalf: game.InningHalf,
    venue: game.Stadium,
    date: game.DateTime,
  }));

  const responseData = {
    success: true,
    sport: 'mlb',
    date,
    games,
    meta: {
      dataSource: 'SportsDataIO',
      lastUpdated: new Date().toISOString(),
      timezone: 'America/Chicago',
      totalGames: games.length,
    },
  };

  // Cache for 30 seconds
  if (env.SPORTS_CACHE) {
    await env.SPORTS_CACHE.put(
      cacheKey,
      JSON.stringify({
        data: responseData,
        expires: Date.now() + 30 * 1000,
      }),
      { expirationTtl: 30 }
    );
  }

  return new Response(JSON.stringify({ ...responseData, cached: false }), {
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=30',
    },
  });
}

/**
 * Get Live NFL Scores
 */
async function getNFLScores(url: URL, env: Env) {
  const season = url.searchParams.get('season') || '2025';
  const week = url.searchParams.get('week') || 'current';
  const cacheKey = `nfl:live:${season}:${week}`;

  // Try cache first (30-second TTL)
  const cached = await env.SPORTS_CACHE?.get(cacheKey, 'json');
  if (cached && (cached as any).expires > Date.now()) {
    return new Response(
      JSON.stringify({ ...(cached as any).data, cached: true }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=30',
        },
      }
    );
  }

  // Fetch from SportsDataIO
  const apiUrl = `https://api.sportsdata.io/v3/nfl/scores/json/ScoresByWeek/${season}/${week}`;

  const response = await fetch(apiUrl, {
    headers: {
      'Ocp-Apim-Subscription-Key': env.SPORTSDATAIO_API_KEY,
    },
  });

  if (!response.ok) {
    throw new Error(`SportsDataIO API error: ${response.status}`);
  }

  const data = await response.json();

  const games = (Array.isArray(data) ? data : []).map((game: any) => ({
    id: game.ScoreID?.toString(),
    sport: 'football',
    homeTeam: {
      id: game.HomeTeamID?.toString(),
      name: game.HomeTeam,
      score: game.HomeScore || 0,
      logo: `https://cdn.sportsdata.io/nfl/logos/${game.HomeTeam}.png`,
    },
    awayTeam: {
      id: game.AwayTeamID?.toString(),
      name: game.AwayTeam,
      score: game.AwayScore || 0,
      logo: `https://cdn.sportsdata.io/nfl/logos/${game.AwayTeam}.png`,
    },
    status: game.Status === 'Final' ? 'final' : game.Status === 'InProgress' ? 'in_progress' : 'scheduled',
    quarter: game.Quarter ? `Q${game.Quarter}` : null,
    timeRemaining: game.TimeRemaining,
    venue: game.Stadium,
    date: game.DateTime,
  }));

  const responseData = {
    success: true,
    sport: 'nfl',
    season,
    week,
    games,
    meta: {
      dataSource: 'SportsDataIO',
      lastUpdated: new Date().toISOString(),
      timezone: 'America/Chicago',
      totalGames: games.length,
    },
  };

  // Cache for 30 seconds
  if (env.SPORTS_CACHE) {
    await env.SPORTS_CACHE.put(
      cacheKey,
      JSON.stringify({
        data: responseData,
        expires: Date.now() + 30 * 1000,
      }),
      { expirationTtl: 30 }
    );
  }

  return new Response(JSON.stringify({ ...responseData, cached: false }), {
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=30',
    },
  });
}

/**
 * Get Live NBA Scores
 */
async function getNBAScores(url: URL, env: Env) {
  const date = url.searchParams.get('date') || new Date().toISOString().split('T')[0];
  const cacheKey = `nba:live:${date}`;

  // Try cache first (30-second TTL)
  const cached = await env.SPORTS_CACHE?.get(cacheKey, 'json');
  if (cached && (cached as any).expires > Date.now()) {
    return new Response(
      JSON.stringify({ ...(cached as any).data, cached: true }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=30',
        },
      }
    );
  }

  // Fetch from SportsDataIO
  const apiUrl = `https://api.sportsdata.io/v3/nba/scores/json/GamesByDate/${date}`;

  const response = await fetch(apiUrl, {
    headers: {
      'Ocp-Apim-Subscription-Key': env.SPORTSDATAIO_API_KEY,
    },
  });

  if (!response.ok) {
    throw new Error(`SportsDataIO API error: ${response.status}`);
  }

  const data = await response.json();

  const games = (Array.isArray(data) ? data : []).map((game: any) => ({
    id: game.GameID?.toString(),
    sport: 'basketball',
    homeTeam: {
      id: game.HomeTeamID?.toString(),
      name: game.HomeTeam,
      score: game.HomeTeamScore || 0,
      logo: `https://cdn.sportsdata.io/nba/logos/${game.HomeTeam}.png`,
    },
    awayTeam: {
      id: game.AwayTeamID?.toString(),
      name: game.AwayTeam,
      score: game.AwayTeamScore || 0,
      logo: `https://cdn.sportsdata.io/nba/logos/${game.AwayTeam}.png`,
    },
    status: game.Status === 'Final' ? 'final' : game.Status === 'InProgress' ? 'in_progress' : 'scheduled',
    quarter: game.Quarter ? `Q${game.Quarter}` : null,
    timeRemaining: game.TimeRemaining,
    venue: game.Stadium,
    date: game.DateTime,
  }));

  const responseData = {
    success: true,
    sport: 'nba',
    date,
    games,
    meta: {
      dataSource: 'SportsDataIO',
      lastUpdated: new Date().toISOString(),
      timezone: 'America/Chicago',
      totalGames: games.length,
    },
  };

  // Cache for 30 seconds
  if (env.SPORTS_CACHE) {
    await env.SPORTS_CACHE.put(
      cacheKey,
      JSON.stringify({
        data: responseData,
        expires: Date.now() + 30 * 1000,
      }),
      { expirationTtl: 30 }
    );
  }

  return new Response(JSON.stringify({ ...responseData, cached: false }), {
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=30',
    },
  });
}

/**
 * Get All Live Scores (aggregated)
 */
async function getAllScores(url: URL, env: Env) {
  const date = url.searchParams.get('date') || new Date().toISOString().split('T')[0];

  // Fetch all sports in parallel
  const [mlb, nfl, nba] = await Promise.allSettled([
    getMLBScores(new URL(`?date=${date}`, url), env).then(r => r.json()),
    getNFLScores(new URL('?week=current', url), env).then(r => r.json()),
    getNBAScores(new URL(`?date=${date}`, url), env).then(r => r.json()),
  ]);

  const allGames: any[] = [];

  if (mlb.status === 'fulfilled' && mlb.value.success) {
    allGames.push(...mlb.value.games);
  }
  if (nfl.status === 'fulfilled' && nfl.value.success) {
    allGames.push(...nfl.value.games);
  }
  if (nba.status === 'fulfilled' && nba.value.success) {
    allGames.push(...nba.value.games);
  }

  return new Response(
    JSON.stringify({
      success: true,
      date,
      games: allGames,
      meta: {
        dataSource: 'SportsDataIO',
        lastUpdated: new Date().toISOString(),
        timezone: 'America/Chicago',
        totalGames: allGames.length,
      },
    }),
    {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=30',
      },
    }
  );
}