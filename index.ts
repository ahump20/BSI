import type { D1Database, KVNamespace, ExecutionContext } from '@cloudflare/workers-types';
import { BaseballAnalyticsService } from './api/services/baseball-analytics-service';

interface Env {
  DB: D1Database;
  KV?: KVNamespace;
}

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
};

export default {
  async fetch(request: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method.toUpperCase();

    if (method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    const analyticsService = new BaseballAnalyticsService(env.DB, env.KV);

    try {
      if (method === 'GET' && path === '/api/v1/baseball/umpire-zones') {
        const gameId = url.searchParams.get('gameId');
        const umpireId = url.searchParams.get('umpireId');
        const season = url.searchParams.get('season') ?? undefined;
        if (!gameId || !umpireId) {
          return jsonResponse({ error: 'gameId and umpireId are required query parameters.' }, 400);
        }

        const data = await analyticsService.getUmpireZoneProbabilities({ gameId, umpireId, season });
        return jsonResponse(data);
      }

      if (method === 'GET' && path === '/api/v1/baseball/workload-risk') {
        const pitcherId = url.searchParams.get('pitcherId');
        const season = url.searchParams.get('season') ?? undefined;
        if (!pitcherId) {
          return jsonResponse({ error: 'pitcherId is a required query parameter.' }, 400);
        }

        const data = await analyticsService.getPitcherWorkloadRisk({ pitcherId, season });
        return jsonResponse(data);
      }

      if (method === 'GET' && path === '/api/v1/baseball/situational-predictions') {
        const gameId = url.searchParams.get('gameId');
        if (!gameId) {
          return jsonResponse({ error: 'gameId is a required query parameter.' }, 400);
        }

        const inningParam = url.searchParams.get('inning');
        const outsParam = url.searchParams.get('outs');
        const baseState = url.searchParams.get('baseState') ?? undefined;
        const inning = inningParam ? Number.parseInt(inningParam, 10) : undefined;
        const outs = outsParam ? Number.parseInt(outsParam, 10) : undefined;

        const data = await analyticsService.getSituationalPredictions({ gameId, inning, outs, baseState });
        return jsonResponse(data);
      }

      if (path.startsWith('/api/v1/baseball/trpc/')) {
        return handleTrpcRequest(request, analyticsService);
      }

      if (method === 'GET' && path === '/api/games/live') {
        const games = await fetchLiveGames(env);
        return jsonResponse({ games });
      }

      if (method === 'GET' && /^\/api\/games\/[^/]+\/boxscore$/.test(path)) {
        const gameId = path.split('/')[3];
        const boxScore = await fetchBoxScore(gameId, env);
        return jsonResponse(boxScore);
      }

      if (method === 'GET' && /^\/api\/standings\/[^/]+$/.test(path)) {
        const conference = path.split('/')[3];
        const standings = await fetchStandings(conference, env);
        return jsonResponse(standings);
      }

      return new Response('Not Found', { status: 404, headers: CORS_HEADERS });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('API Error:', message, error);
      return jsonResponse({ error: message }, 500);
    }
  },
};

async function handleTrpcRequest(request: Request, analyticsService: BaseballAnalyticsService): Promise<Response> {
  if (request.method.toUpperCase() !== 'POST') {
    return jsonResponse({ error: 'Only POST is allowed for tRPC procedures.' }, 405);
  }

  const url = new URL(request.url);
  const procedure = url.pathname.replace('/api/v1/baseball/trpc/', '');

  let input: Record<string, unknown> = {};
  try {
    const body = await request.json();
    input = typeof body === 'object' && body !== null ? (body.input ?? body) : {};
  } catch (error) {
    console.warn('tRPC payload parse error', error);
  }

  try {
    switch (procedure) {
      case 'umpireZones': {
        const gameId = String(input.gameId ?? '');
        const umpireId = String(input.umpireId ?? '');
        const season = input.season ? String(input.season) : undefined;
        if (!gameId || !umpireId) {
          return trpcErrorResponse('BAD_REQUEST', 'gameId and umpireId are required inputs.');
        }
        const data = await analyticsService.getUmpireZoneProbabilities({ gameId, umpireId, season });
        return trpcSuccessResponse(data);
      }
      case 'pitcherWorkloadRisk': {
        const pitcherId = String(input.pitcherId ?? '');
        const season = input.season ? String(input.season) : undefined;
        if (!pitcherId) {
          return trpcErrorResponse('BAD_REQUEST', 'pitcherId is a required input.');
        }
        const data = await analyticsService.getPitcherWorkloadRisk({ pitcherId, season });
        return trpcSuccessResponse(data);
      }
      case 'situationalPredictions': {
        const gameId = String(input.gameId ?? '');
        if (!gameId) {
          return trpcErrorResponse('BAD_REQUEST', 'gameId is a required input.');
        }
        const inning = input.inning !== undefined ? Number(input.inning) : undefined;
        const outs = input.outs !== undefined ? Number(input.outs) : undefined;
        const baseState = input.baseState ? String(input.baseState) : undefined;
        const data = await analyticsService.getSituationalPredictions({ gameId, inning, outs, baseState });
        return trpcSuccessResponse(data);
      }
      default:
        return trpcErrorResponse('NOT_FOUND', `Unknown tRPC procedure: ${procedure}`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return trpcErrorResponse('INTERNAL_SERVER_ERROR', message);
  }
}

async function fetchLiveGames(env: Env): Promise<any[]> {
  const cacheKey = 'baseball:live-games';
  const cached = await readKvJson<any[]>(env.KV, cacheKey);
  if (cached) {
    return cached;
  }

  const statement = env.DB.prepare(`
    SELECT
      g.game_id,
      g.game_date,
      g.game_time,
      g.status,
      g.home_score,
      g.away_score,
      g.innings,
      ht.name AS home_team_name,
      ht.abbreviation AS home_team_abbr,
      at.name AS away_team_name,
      at.abbreviation AS away_team_abbr,
      g.venue_name
    FROM games g
    JOIN teams ht ON ht.team_id = g.home_team_id
    JOIN teams at ON at.team_id = g.away_team_id
    WHERE g.status IN ('scheduled', 'in_progress')
    ORDER BY g.game_date ASC, g.game_time ASC
    LIMIT 25
  `);

  const { results } = await statement.all();
  const games = results.map((row: any) => ({
    gameId: Number(row.game_id),
    date: row.game_date,
    time: row.game_time,
    status: row.status,
    venue: row.venue_name,
    home: {
      name: row.home_team_name,
      abbreviation: row.home_team_abbr,
      score: row.home_score !== null ? Number(row.home_score) : null,
    },
    away: {
      name: row.away_team_name,
      abbreviation: row.away_team_abbr,
      score: row.away_score !== null ? Number(row.away_score) : null,
    },
    innings: row.innings !== null ? Number(row.innings) : null,
  }));

  await writeKvJson(env.KV, cacheKey, games, 30);
  return games;
}

async function fetchBoxScore(gameId: string, env: Env): Promise<Record<string, unknown>> {
  const cacheKey = `baseball:box-score:${gameId}`;
  const cached = await readKvJson<Record<string, unknown>>(env.KV, cacheKey);
  if (cached) {
    return cached;
  }

  const gameStatement = env.DB.prepare(`
    SELECT
      g.game_id,
      g.game_date,
      g.game_time,
      g.status,
      g.home_score,
      g.away_score,
      g.innings,
      ht.name AS home_team_name,
      at.name AS away_team_name
    FROM games g
    JOIN teams ht ON ht.team_id = g.home_team_id
    JOIN teams at ON at.team_id = g.away_team_id
    WHERE g.game_id = ?
  `);
  const game = await gameStatement.bind(gameId).first();
  if (!game) {
    throw new Error('Game not found');
  }

  const battingStatement = env.DB.prepare(`
    SELECT
      bs.team_id,
      bs.player_id,
      p.full_name,
      bs.at_bats,
      bs.hits,
      bs.rbi,
      bs.home_runs
    FROM batting_stats bs
    JOIN players p ON p.player_id = bs.player_id
    WHERE bs.game_id = ?
    ORDER BY bs.hits DESC, bs.rbi DESC
    LIMIT 12
  `);
  const battingLeadersResult = await battingStatement.bind(gameId).all();

  const pitchingStatement = env.DB.prepare(`
    SELECT
      ps.team_id,
      ps.player_id,
      p.full_name,
      ps.innings_pitched,
      ps.pitches_thrown,
      ps.strikeouts,
      ps.walks,
      ps.runs_allowed
    FROM pitching_stats ps
    JOIN players p ON p.player_id = ps.player_id
    WHERE ps.game_id = ?
    ORDER BY ps.innings_pitched DESC
  `);
  const pitchingResult = await pitchingStatement.bind(gameId).all();

  const response = {
    game: {
      gameId: Number(game.game_id),
      date: game.game_date,
      time: game.game_time,
      status: game.status,
      innings: game.innings !== null ? Number(game.innings) : null,
      score: {
        home: game.home_score !== null ? Number(game.home_score) : null,
        away: game.away_score !== null ? Number(game.away_score) : null,
      },
      teams: {
        home: String(game.home_team_name),
        away: String(game.away_team_name),
      },
    },
    battingLeaders: battingLeadersResult.results.map((row: any) => ({
      teamId: Number(row.team_id),
      playerId: Number(row.player_id),
      playerName: row.full_name,
      atBats: Number(row.at_bats ?? 0),
      hits: Number(row.hits ?? 0),
      rbi: Number(row.rbi ?? 0),
      homeRuns: Number(row.home_runs ?? 0),
    })),
    pitchingLines: pitchingResult.results.map((row: any) => ({
      teamId: Number(row.team_id),
      playerId: Number(row.player_id),
      playerName: row.full_name,
      inningsPitched: Number(row.innings_pitched ?? 0),
      pitches: Number(row.pitches_thrown ?? 0),
      strikeouts: Number(row.strikeouts ?? 0),
      walks: Number(row.walks ?? 0),
      runsAllowed: Number(row.runs_allowed ?? 0),
    })),
  };

  await writeKvJson(env.KV, cacheKey, response, 45);
  return response;
}

async function fetchStandings(conferenceAbbreviation: string, env: Env): Promise<Record<string, unknown>> {
  const cacheKey = `baseball:standings:${conferenceAbbreviation.toUpperCase()}`;
  const cached = await readKvJson<Record<string, unknown>>(env.KV, cacheKey);
  if (cached) {
    return cached;
  }

  const statement = env.DB.prepare(`
    SELECT
      t.team_id,
      t.name,
      t.abbreviation,
      tss.wins,
      tss.losses,
      tss.conference_wins,
      tss.conference_losses,
      tss.rpi,
      tss.strength_of_schedule
    FROM team_season_stats tss
    JOIN teams t ON t.team_id = tss.team_id
    JOIN conferences c ON c.conference_id = t.conference_id
    JOIN seasons s ON s.season_id = tss.season_id
    WHERE c.abbreviation = ?
      AND s.is_active = 1
    ORDER BY tss.conference_wins DESC, tss.wins DESC
    LIMIT 25
  `);

  const { results } = await statement.bind(conferenceAbbreviation).all();
  const standings = {
    conference: conferenceAbbreviation,
    updatedAt: new Date().toISOString(),
    teams: results.map((row: any) => ({
      teamId: Number(row.team_id),
      name: row.name,
      abbreviation: row.abbreviation,
      overall: {
        wins: Number(row.wins ?? 0),
        losses: Number(row.losses ?? 0),
      },
      conference: {
        wins: Number(row.conference_wins ?? 0),
        losses: Number(row.conference_losses ?? 0),
      },
      rpi: row.rpi !== null ? Number(row.rpi) : null,
      strengthOfSchedule: row.strength_of_schedule !== null ? Number(row.strength_of_schedule) : null,
    })),
  };

  await writeKvJson(env.KV, cacheKey, standings, 300);
  return standings;
}

function jsonResponse(data: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...CORS_HEADERS,
      ...headers,
    },
  });
}

function trpcSuccessResponse(result: unknown): Response {
  return jsonResponse({ result: { data: result } });
}

function trpcErrorResponse(code: string, message: string): Response {
  return jsonResponse({ error: { code, message } }, code === 'NOT_FOUND' ? 404 : code === 'BAD_REQUEST' ? 400 : 500);
}

async function readKvJson<T>(kv: KVNamespace | undefined, key: string): Promise<T | null> {
  if (!kv) {
    return null;
  }
  const raw = await kv.get(key);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as T;
  } catch (error) {
    console.warn('KV parse error for key', key, error);
    return null;
  }
}

async function writeKvJson(kv: KVNamespace | undefined, key: string, value: unknown, ttlSeconds: number): Promise<void> {
  if (!kv) {
    return;
  }
  await kv.put(key, JSON.stringify(value), { expirationTtl: ttlSeconds });
}
