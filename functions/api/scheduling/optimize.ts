/**
 * Schedule Optimization API Endpoint
 *
 * Provides:
 * - Monte Carlo simulations for remaining schedule
 * - Win probability calculations
 * - What-if scenario analysis
 * - Schedule optimization recommendations
 * - Conference strength rankings
 *
 * Query Parameters:
 * - teamId: string (required) - Team identifier
 * - iterations: number (optional) - Monte Carlo iterations (default: 10000)
 * - scenarios: boolean (optional) - Include what-if scenarios (default: true)
 * - optimize: boolean (optional) - Include optimization recommendations (default: true)
 *
 * Integration Points:
 * - ScheduleOptimizer component (main UI)
 * - ConferenceStrengthDashboard component
 * - Team profile pages
 *
 * Data Sources: D1 Database, NCAA Stats API, Conference APIs
 * Last Updated: October 19, 2025
 * Timezone: America/Chicago
 */

import type { PagesFunction, KVNamespace, D1Database } from '@cloudflare/workers-types';
import {
  ScheduleOptimizer,
  RemainingSchedule,
  ScheduleGame,
} from '../../../lib/analytics/baseball/schedule-optimizer';
import {
  ConferenceStrengthModel,
  TeamRecord,
  RPICalculation,
  SOSCalculation,
  ISRCalculation,
} from '../../../lib/analytics/baseball/conference-strength-model';

// ============================================================================
// Type Definitions
// ============================================================================

interface OptimizationRequest {
  teamId: string;
  iterations?: number;
  scenarios?: boolean;
  optimize?: boolean;
}

interface OptimizationResponse {
  simulation: any;
  whatIfScenarios?: any[];
  optimization?: any;
  conferenceStrength?: any;
  metadata: {
    teamId: string;
    teamName: string;
    dataSource: string;
    lastUpdated: string;
    cacheStatus: 'hit' | 'miss';
  };
}

// ============================================================================
// API Handler
// ============================================================================

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);

  // Extract query parameters
  const teamId = url.searchParams.get('teamId');
  const iterations = parseInt(url.searchParams.get('iterations') || '10000', 10);
  const includeScenarios = url.searchParams.get('scenarios') !== 'false';
  const includeOptimization = url.searchParams.get('optimize') !== 'false';

  if (!teamId) {
    return Response.json({ error: 'Missing teamId parameter' }, { status: 400 });
  }

  try {
    // Check KV cache first
    const cacheKey = `schedule-optimization:${teamId}:${iterations}:${includeScenarios}:${includeOptimization}`;
    const cached = await env.KV.get<OptimizationResponse>(cacheKey, 'json');

    if (cached) {
      return Response.json(
        {
          ...cached,
          metadata: {
            ...cached.metadata,
            cacheStatus: 'hit',
          },
        },
        {
          headers: {
            'Cache-Control': 'public, max-age=300, s-maxage=900',
            'X-Cache-Status': 'hit',
          },
        }
      );
    }

    // Fetch data and run optimization
    const result = await runOptimization(
      {
        teamId,
        iterations,
        scenarios: includeScenarios,
        optimize: includeOptimization,
      },
      env
    );

    // Cache for 15 minutes
    await env.KV.put(cacheKey, JSON.stringify(result), {
      expirationTtl: 900,
    });

    return Response.json(result, {
      headers: {
        'Cache-Control': 'public, max-age=300, s-maxage=900',
        'X-Cache-Status': 'miss',
      },
    });
  } catch (error) {
    console.error('Schedule optimization error:', error);
    return Response.json(
      {
        error: 'Failed to optimize schedule',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Run schedule optimization
 */
async function runOptimization(
  request: OptimizationRequest,
  env: Env
): Promise<OptimizationResponse> {
  // Fetch team data
  const team = await fetchTeamData(request.teamId, env);

  if (!team) {
    throw new Error('Team not found');
  }

  // Fetch all teams for RPI/SOS/ISR calculations
  const allTeams = await fetchAllTeams(env);

  // Calculate metrics
  const rpiResults = ConferenceStrengthModel.calculateRPI(allTeams);
  const rpiMap = new Map(rpiResults.map((r) => [r.teamId, r]));

  const sosResults = ConferenceStrengthModel.calculateSOS(allTeams, rpiMap);
  const sosMap = new Map(sosResults.map((r) => [r.teamId, r]));

  const isrResults = ConferenceStrengthModel.calculateISR(allTeams);
  const isrMap = new Map(isrResults.map((r) => [r.teamId, r]));

  // Get team metrics (use database ID, not team key)
  const teamRPI = rpiMap.get(team.record.teamId);
  const teamSOS = sosMap.get(team.record.teamId);
  const teamISR = isrMap.get(team.record.teamId);

  // If metrics can't be calculated (insufficient data), return a partial response
  if (!teamRPI || !teamSOS || !teamISR) {
    return {
      simulation: null,
      whatIfScenarios: null,
      optimization: null,
      conferenceStrength: null,
      metadata: {
        teamId: request.teamId,
        teamName: team.schedule.teamName,
        dataSource: 'BlazeSportsIntel Schedule Optimizer',
        lastUpdated: new Date().toISOString(),
        cacheStatus: 'miss',
        error: 'Insufficient data for RPI/SOS/ISR calculations',
        details: `Found ${allTeams.length} teams, ${team.schedule.remainingGames.length} remaining games, ${team.record.opponents.length} played opponents`,
      },
    } as any;
  }

  const teamMetrics = {
    rpi: teamRPI,
    sos: teamSOS,
    isr: teamISR,
  };

  // Build opponent metrics map
  const opponentMetrics = new Map<
    string,
    {
      rpi: RPICalculation;
      sos: SOSCalculation;
      isr: ISRCalculation;
    }
  >();

  for (const game of team.schedule.remainingGames) {
    const oppRPI = rpiMap.get(game.opponent.teamId);
    const oppSOS = sosMap.get(game.opponent.teamId);
    const oppISR = isrMap.get(game.opponent.teamId);

    if (oppRPI && oppSOS && oppISR) {
      opponentMetrics.set(game.opponent.teamId, {
        rpi: oppRPI,
        sos: oppSOS,
        isr: oppISR,
      });
    }
  }

  // Run Monte Carlo simulation
  const simulation = ScheduleOptimizer.runMonteCarloSimulation(
    team.schedule,
    teamMetrics,
    opponentMetrics,
    request.iterations
  );

  // Generate what-if scenarios (optional)
  let whatIfScenarios;
  if (request.scenarios) {
    whatIfScenarios = ScheduleOptimizer.generateWhatIfScenarios(
      simulation,
      team.schedule,
      teamMetrics
    );
  }

  // Generate optimization recommendations (optional)
  let optimization;
  if (request.optimize) {
    optimization = ScheduleOptimizer.optimizeSchedule(
      simulation,
      team.schedule,
      teamMetrics,
      opponentMetrics
    );
  }

  // Calculate conference strength
  const conferenceStrengths = ConferenceStrengthModel.calculateConferenceStrength(
    allTeams.filter((t) => t.conference === team.schedule.conference),
    allTeams
  );

  const conferenceStrength = conferenceStrengths.find(
    (c) => c.conference === team.schedule.conference
  );

  return {
    simulation,
    whatIfScenarios,
    optimization,
    conferenceStrength,
    metadata: {
      teamId: team.schedule.teamId, // Use database ID (integer) to match simulation
      teamName: team.schedule.teamName,
      dataSource: 'BlazeSportsIntel Schedule Optimizer',
      lastUpdated: new Date().toISOString(),
      cacheStatus: 'miss',
    },
  };
}

/**
 * Fetch team data from database
 */
async function fetchTeamData(
  teamId: string,
  env: Env
): Promise<{
  schedule: RemainingSchedule;
  record: TeamRecord;
} | null> {
  // Fetch team info
  const teamResult = await env.DB.prepare(
    `
    SELECT
      id,
      name,
      conference,
      wins,
      losses,
      conference_wins,
      conference_losses,
      home_wins,
      home_losses,
      away_wins,
      away_losses,
      neutral_wins,
      neutral_losses,
      runs_scored,
      runs_allowed
    FROM teams
    WHERE key = ?
  `
  )
    .bind(teamId)
    .first();

  if (!teamResult) {
    return null;
  }

  // Fetch remaining schedule
  const now = new Date().toISOString();
  const scheduleResults = await env.DB.prepare(
    `
    SELECT
      g.id as game_id,
      g.game_date as date,
      g.home_team_id,
      g.away_team_id,
      g.neutral_site,
      g.status,
      g.home_score,
      g.away_score,
      CASE
        WHEN g.home_team_id = ? THEN away.id
        ELSE home.id
      END as opponent_id,
      CASE
        WHEN g.home_team_id = ? THEN away.name
        ELSE home.name
      END as opponent_name,
      CASE
        WHEN g.home_team_id = ? THEN away.conference
        ELSE home.conference
      END as opponent_conference
    FROM games g
    LEFT JOIN teams home ON g.home_team_id = home.id
    LEFT JOIN teams away ON g.away_team_id = away.id
    WHERE (g.home_team_id = ? OR g.away_team_id = ?)
      AND g.game_date >= ?
      AND g.status != 'final'
    ORDER BY g.game_date ASC
  `
  )
    .bind(teamResult.id, teamResult.id, teamResult.id, teamResult.id, teamResult.id, now)
    .all();

  if (!scheduleResults.success) {
    throw new Error('Failed to fetch schedule');
  }

  // Map to ScheduleGame objects
  const remainingGames: ScheduleGame[] = scheduleResults.results.map((row: any) => {
    const isHome = row.home_team_id === teamId;
    const isNeutral = row.neutral_site === 1;

    return {
      gameId: row.game_id,
      date: row.date,
      opponent: {
        teamId: row.opponent_id,
        teamName: row.opponent_name,
        conference: row.opponent_conference,
      },
      location: isNeutral ? 'neutral' : isHome ? 'home' : 'away',
      completed: false,
    };
  });

  // Fetch opponents list for RPI calculation
  const opponentsResults = await env.DB.prepare(
    `
    SELECT DISTINCT
      CASE
        WHEN g.home_team_id = ? THEN g.away_team_id
        ELSE g.home_team_id
      END as opponent_id
    FROM games g
    WHERE (g.home_team_id = ? OR g.away_team_id = ?)
      AND g.status = 'final'
  `
  )
    .bind(teamResult.id, teamResult.id, teamResult.id)
    .all();

  const opponents = opponentsResults.success
    ? opponentsResults.results.map((row: any) => row.opponent_id)
    : [];

  const schedule: RemainingSchedule = {
    teamId: teamResult.id as string,
    teamName: teamResult.name as string,
    conference: teamResult.conference as string,
    currentRecord: {
      wins: teamResult.wins as number,
      losses: teamResult.losses as number,
    },
    remainingGames,
  };

  const record: TeamRecord = {
    teamId: teamResult.id as string,
    teamName: teamResult.name as string,
    conference: teamResult.conference as string,
    wins: teamResult.wins as number,
    losses: teamResult.losses as number,
    conferenceWins: teamResult.conference_wins as number,
    conferenceLosses: teamResult.conference_losses as number,
    homeWins: teamResult.home_wins as number,
    homeLosses: teamResult.home_losses as number,
    awayWins: teamResult.away_wins as number,
    awayLosses: teamResult.away_losses as number,
    neutralWins: teamResult.neutral_wins as number,
    neutralLosses: teamResult.neutral_losses as number,
    runsScored: teamResult.runs_scored as number,
    runsAllowed: teamResult.runs_allowed as number,
    opponents,
  };

  return { schedule, record };
}

/**
 * Fetch all teams for RPI calculations
 */
async function fetchAllTeams(env: Env): Promise<TeamRecord[]> {
  const results = await env.DB.prepare(
    `
    SELECT
      t.id,
      t.name,
      t.conference,
      t.wins,
      t.losses,
      t.conference_wins,
      t.conference_losses,
      t.home_wins,
      t.home_losses,
      t.away_wins,
      t.away_losses,
      t.neutral_wins,
      t.neutral_losses,
      t.runs_scored,
      t.runs_allowed
    FROM teams t
    WHERE t.sport = 'baseball'
  `
  ).all();

  if (!results.success) {
    throw new Error('Failed to fetch teams');
  }

  // For each team, fetch their opponents
  const teams: TeamRecord[] = [];

  for (const row of results.results) {
    const opponentsResults = await env.DB.prepare(
      `
      SELECT DISTINCT
        CASE
          WHEN g.home_team_id = ? THEN g.away_team_id
          ELSE g.home_team_id
        END as opponent_id
      FROM games g
      WHERE (g.home_team_id = ? OR g.away_team_id = ?)
        AND g.status = 'final'
    `
    )
      .bind(row.id, row.id, row.id)
      .all();

    const opponents = opponentsResults.success
      ? opponentsResults.results.map((opp: any) => opp.opponent_id)
      : [];

    teams.push({
      teamId: row.id as string,
      teamName: row.name as string,
      conference: row.conference as string,
      wins: row.wins as number,
      losses: row.losses as number,
      conferenceWins: row.conference_wins as number,
      conferenceLosses: row.conference_losses as number,
      homeWins: row.home_wins as number,
      homeLosses: row.home_losses as number,
      awayWins: row.away_wins as number,
      awayLosses: row.away_losses as number,
      neutralWins: row.neutral_wins as number,
      neutralLosses: row.neutral_losses as number,
      runsScored: row.runs_scored as number,
      runsAllowed: row.runs_allowed as number,
      opponents,
    });
  }

  return teams;
}

// ============================================================================
// Environment Types
// ============================================================================

interface Env {
  KV: KVNamespace;
  DB: D1Database;
}
