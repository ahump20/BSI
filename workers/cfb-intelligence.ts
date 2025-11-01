import type {
  D1Database,
  KVNamespace,
  R2Bucket,
  ExecutionContext,
  ScheduledEvent,
} from '@cloudflare/workers-types';

export interface Env {
  DB: D1Database;
  CFB_CACHE: KVNamespace;
  GAME_DATA: R2Bucket;
}

interface Team {
  id: string;
  name: string;
  conference: string;
  division: string; // FBS, FCS, D2, D3
  recruiting_rank?: number | null;
}

interface Game {
  id: string;
  home_team_id: string;
  away_team_id: string;
  scheduled_time: string;
  status: 'scheduled' | 'live' | 'final';
  home_score: number;
  away_score: number;
  quarter: number;
  time_remaining: string | null;
}

interface GameAnalytics {
  game_id: string;
  timestamp: string;
  home_epa: number | null;
  away_epa: number | null;
  home_success_rate: number | null;
  away_success_rate: number | null;
  home_win_probability: number | null;
  upset_probability: number | null;
}

interface RecruitingImpactRow {
  name: string;
  conference: string;
  division: string;
  recruiting_rank: number;
  games_played: number;
  avg_epa: number | null;
  avg_success_rate: number | null;
}

type CorsHeaders = Record<string, string>;

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    const corsHeaders: CorsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Content-Type': 'application/json',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      if (path === '/cfb/games/live') {
        return await handleLiveGames(env, corsHeaders);
      }

      if (path === '/cfb/games/upsets') {
        return await handleUpsetAlerts(env, corsHeaders);
      }

      if (path.startsWith('/cfb/team/')) {
        const teamId = path.split('/').pop();
        if (!teamId) {
          return new Response(
            JSON.stringify({ error: 'Team identifier missing' }),
            { status: 400, headers: corsHeaders },
          );
        }
        return await handleTeamAnalytics(env, teamId, corsHeaders);
      }

      if (path === '/cfb/recruiting/impact') {
        return await handleRecruitingImpact(env, corsHeaders);
      }

      if (path === '/cfb/ingest') {
        return await ingestGameData(env, corsHeaders);
      }

      return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers: corsHeaders,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return new Response(
        JSON.stringify({
          error: 'Internal server error',
          details: message,
        }),
        {
          status: 500,
          headers: corsHeaders,
        },
      );
    }
  },

  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    const headers: CorsHeaders = {
      'Content-Type': 'application/json',
    };

    ctx.waitUntil(ingestGameData(env, headers));
  },
};

async function handleLiveGames(env: Env, headers: CorsHeaders): Promise<Response> {
  const cached = await env.CFB_CACHE.get('live_games', 'json');
  if (cached) {
    return new Response(JSON.stringify(cached), { headers });
  }

  const statement = env.DB.prepare(`
    SELECT 
      g.id,
      g.home_team_id,
      g.away_team_id,
      ht.name AS home_team,
      at.name AS away_team,
      ht.conference AS home_conference,
      at.conference AS away_conference,
      ht.division AS home_division,
      at.division AS away_division,
      g.home_score,
      g.away_score,
      g.quarter,
      g.time_remaining,
      ga.home_epa,
      ga.away_epa,
      ga.home_success_rate,
      ga.away_success_rate,
      ga.home_win_probability,
      ga.upset_probability
    FROM games g
    JOIN teams ht ON g.home_team_id = ht.id
    JOIN teams at ON g.away_team_id = at.id
    LEFT JOIN game_analytics ga ON g.id = ga.game_id
    WHERE g.status = 'live'
    AND ga.timestamp = (
      SELECT MAX(timestamp)
      FROM game_analytics
      WHERE game_id = g.id
    )
    ORDER BY
      CASE
        WHEN ht.division = 'FCS' OR at.division = 'FCS' THEN 0
        WHEN ht.conference IN ('MAC', 'Sun Belt', 'C-USA', 'MWC', 'AAC')
          OR at.conference IN ('MAC', 'Sun Belt', 'C-USA', 'MWC', 'AAC') THEN 1
        ELSE 2
      END,
      ga.upset_probability DESC
  `);

  const { results } = await statement.all<Record<string, unknown>>();

  await env.CFB_CACHE.put('live_games', JSON.stringify(results), {
    expirationTtl: 30,
  });

  return new Response(JSON.stringify(results), { headers });
}

async function handleUpsetAlerts(env: Env, headers: CorsHeaders): Promise<Response> {
  const cached = await env.CFB_CACHE.get('upset_alerts', 'json');
  if (cached) {
    return new Response(JSON.stringify(cached), { headers });
  }

  const statement = env.DB.prepare(`
    SELECT 
      g.id,
      ht.name AS home_team,
      at.name AS away_team,
      ht.division AS home_division,
      at.division AS away_division,
      g.home_score,
      g.away_score,
      g.status,
      g.scheduled_time,
      ga.upset_probability,
      ga.home_win_probability,
      CASE
        WHEN ga.home_win_probability < 0.5 THEN 'home_underdog'
        ELSE 'away_underdog'
      END AS underdog
    FROM games g
    JOIN teams ht ON g.home_team_id = ht.id
    JOIN teams at ON g.away_team_id = at.id
    JOIN game_analytics ga ON g.id = ga.game_id
    WHERE ga.upset_probability > 0.30
      AND g.status IN ('scheduled', 'live')
      AND ga.timestamp = (
        SELECT MAX(timestamp)
        FROM game_analytics
        WHERE game_id = g.id
      )
    ORDER BY ga.upset_probability DESC
    LIMIT 20
  `);

  const { results } = await statement.all<Record<string, unknown>>();

  await env.CFB_CACHE.put('upset_alerts', JSON.stringify(results), {
    expirationTtl: 300,
  });

  return new Response(JSON.stringify(results), { headers });
}

async function handleTeamAnalytics(
  env: Env,
  teamId: string,
  headers: CorsHeaders,
): Promise<Response> {
  const cacheKey = `team_${teamId}`;
  const cached = await env.CFB_CACHE.get(cacheKey, 'json');
  if (cached) {
    return new Response(JSON.stringify(cached), { headers });
  }

  const teamStatement = env.DB.prepare(`
    SELECT 
      t.id,
      t.name,
      t.conference,
      t.division,
      t.recruiting_rank,
      COUNT(DISTINCT g.id) AS games_played,
      SUM(CASE
        WHEN (g.home_team_id = t.id AND g.home_score > g.away_score)
          OR (g.away_team_id = t.id AND g.away_score > g.home_score)
        THEN 1 ELSE 0
      END) AS wins,
      AVG(CASE
        WHEN g.home_team_id = t.id THEN ga.home_epa
        ELSE ga.away_epa
      END) AS avg_epa,
      AVG(CASE
        WHEN g.home_team_id = t.id THEN ga.home_success_rate
        ELSE ga.away_success_rate
      END) AS avg_success_rate
    FROM teams t
    LEFT JOIN games g ON (g.home_team_id = t.id OR g.away_team_id = t.id)
      AND g.status = 'final'
    LEFT JOIN game_analytics ga ON g.id = ga.game_id
    WHERE t.id = ?
    GROUP BY t.id
  `).bind(teamId);

  const { results: teamData } = await teamStatement.all<Record<string, unknown>>();

  if (!teamData || teamData.length === 0) {
    return new Response(JSON.stringify({ error: 'Team not found' }), {
      status: 404,
      headers,
    });
  }

  const recentStatement = env.DB.prepare(`
    SELECT 
      g.id,
      g.scheduled_time,
      CASE
        WHEN g.home_team_id = ? THEN at.name
        ELSE ht.name
      END AS opponent,
      CASE
        WHEN g.home_team_id = ? THEN 'home'
        ELSE 'away'
      END AS location,
      g.home_score,
      g.away_score,
      CASE
        WHEN g.home_team_id = ? THEN ga.home_epa
        ELSE ga.away_epa
      END AS team_epa,
      CASE
        WHEN g.home_team_id = ? THEN ga.home_success_rate
        ELSE ga.away_success_rate
      END AS team_success_rate
    FROM games g
    JOIN teams ht ON g.home_team_id = ht.id
    JOIN teams at ON g.away_team_id = at.id
    LEFT JOIN game_analytics ga ON g.id = ga.game_id
    WHERE (g.home_team_id = ? OR g.away_team_id = ?)
      AND g.status = 'final'
    ORDER BY g.scheduled_time DESC
    LIMIT 10
  `).bind(teamId, teamId, teamId, teamId, teamId, teamId);

  const { results: recentGames } = await recentStatement.all<Record<string, unknown>>();

  const responsePayload = {
    team: teamData[0],
    recent_games: recentGames,
  };

  await env.CFB_CACHE.put(cacheKey, JSON.stringify(responsePayload), {
    expirationTtl: 600,
  });

  return new Response(JSON.stringify(responsePayload), { headers });
}

async function handleRecruitingImpact(env: Env, headers: CorsHeaders): Promise<Response> {
  const statement = env.DB.prepare(`
    SELECT 
      t.name,
      t.conference,
      t.division,
      t.recruiting_rank,
      COUNT(DISTINCT g.id) AS games_played,
      AVG(CASE
        WHEN g.home_team_id = t.id THEN ga.home_epa
        ELSE ga.away_epa
      END) AS avg_epa,
      AVG(CASE
        WHEN g.home_team_id = t.id THEN ga.home_success_rate
        ELSE ga.away_success_rate
      END) AS avg_success_rate
    FROM teams t
    LEFT JOIN games g ON (g.home_team_id = t.id OR g.away_team_id = t.id)
      AND g.status = 'final'
    LEFT JOIN game_analytics ga ON g.id = ga.game_id
    WHERE t.recruiting_rank IS NOT NULL
    GROUP BY t.id
    HAVING games_played >= 5
    ORDER BY t.recruiting_rank ASC
    LIMIT 50
  `);

  const { results } = await statement.all<RecruitingImpactRow>();

  const rankings = results.map((record) => Number(record.recruiting_rank));
  const epas = results.map((record) => Number(record.avg_epa ?? 0));

  const correlation = calculateCorrelation(rankings, epas);

  const payload = {
    teams: results,
    correlation: {
      recruiting_to_epa: correlation,
      interpretation:
        correlation < -0.5
          ? 'Strong negative correlation: higher recruiting ranks (lower numbers) correlate with better EPA'
          : "Weak correlation: recruiting rank doesn't strongly predict performance",
    },
  };

  return new Response(JSON.stringify(payload), { headers });
}

async function ingestGameData(env: Env, headers: CorsHeaders): Promise<Response> {
  const timestamp = new Date().toISOString();

  await env.GAME_DATA.put(
    `ingestion_logs/${timestamp}.json`,
    JSON.stringify({
      timestamp,
      status: 'completed',
      games_processed: 0,
    }),
  );

  return new Response(
    JSON.stringify({
      success: true,
      timestamp,
    }),
    { headers },
  );
}

function calculateCorrelation(x: number[], y: number[]): number {
  const n = x.length;
  if (n === 0 || n !== y.length) {
    return 0;
  }

  const sumX = x.reduce((acc, value) => acc + value, 0);
  const sumY = y.reduce((acc, value) => acc + value, 0);
  const sumXY = x.reduce((acc, value, index) => acc + value * y[index], 0);
  const sumX2 = x.reduce((acc, value) => acc + value * value, 0);
  const sumY2 = y.reduce((acc, value) => acc + value * value, 0);

  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt(
    (n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY),
  );

  if (denominator === 0) {
    return 0;
  }

  return numerator / denominator;
}
