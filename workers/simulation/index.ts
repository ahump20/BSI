import {
  BaseballSimulator,
  BivariatePoissonSimulator,
  PARXSimulator,
  SimulationResults,
  SimulationTeamInput,
  TeamPerformanceRow,
  TeamStrengthAnalyzer,
  TeamStrengthProfile,
  UncertaintyAnalyzer,
} from '../../lib/simulation';
import { SimulationCoordinator } from '../../lib/simulation/simulation-coordinator';
import type { Env, SimulationRequestBody, SimulationResponsePayload } from './types';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/health') {
      return new Response(
        JSON.stringify({
          status: 'healthy',
          worker: 'simulation',
          timestamp: new Date().toISOString(),
        }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (request.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405 });
    }

    if (url.pathname !== '/simulate' && url.pathname !== '/api/simulate') {
      return new Response('Not Found', { status: 404 });
    }

    try {
      const body = (await request.json()) as SimulationRequestBody;
      this.validateRequest(body);

      const iterations = body.iterations ?? 10000;
      const cacheKey = `sim:${body.sport}:${body.homeTeam.id}:${body.awayTeam.id}:${body.date}:${iterations}`;
      const cachedResult = await env.KV.get(cacheKey);
      if (cachedResult) {
        return new Response(cachedResult, { headers: { 'Content-Type': 'application/json' } });
      }

      const strengthProfiles = await this.loadTeamStrengths(env, body);

      const homeTeam = { ...body.homeTeam, ...strengthProfiles[body.homeTeam.id] } as SimulationTeamInput;
      const awayTeam = { ...body.awayTeam, ...strengthProfiles[body.awayTeam.id] } as SimulationTeamInput;

      const simulator = this.getSimulator(body.sport);
      const coordinator = new SimulationCoordinator(env);

      const runBatch = async (batchIterations: number): Promise<SimulationResults> =>
        this.runSimulation(simulator, body.sport, homeTeam, awayTeam, batchIterations, body.correlation);

      const results = body.useParallel
        ? await coordinator.distributeSimulations(
            {
              homeTeam,
              awayTeam,
              sport: body.sport,
              iterations,
              correlation: body.correlation,
            },
            iterations,
            runBatch
          )
        : await runBatch(iterations);

      const uncertaintyAnalyzer = new UncertaintyAnalyzer();
      const confidence = uncertaintyAnalyzer.calculateConfidenceIntervals({
        outcomes: results.outcomes,
        meanProbability: results.homeWinProbability,
      });

      const responsePayload: SimulationResponsePayload = {
        results: this.sanitizeResults(results),
        confidence,
        timestamp: new Date().toISOString(),
        source: `Monte Carlo simulation (${iterations.toLocaleString()} iterations)`,
        methodology: results.model,
        citations: [
          'Angelini & De Angelis (2017)',
          'Reade et al. (2020)',
          'Pritchard et al. (2024)',
        ],
      };

      await env.KV.put(cacheKey, JSON.stringify(responsePayload), { expirationTtl: 3600 });

      return new Response(JSON.stringify(responsePayload), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('[SimulationWorker] Error running simulation', error);
      return new Response(JSON.stringify({ error: (error as Error).message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  },

  validateRequest(body: SimulationRequestBody): void {
    if (!body.homeTeam?.id || !body.awayTeam?.id) {
      throw new Error('Home and away teams are required');
    }
    if (!body.sport) {
      throw new Error('Sport is required');
    }
    if (!body.date) {
      throw new Error('Date is required');
    }
  },

  async loadTeamStrengths(env: Env, body: SimulationRequestBody): Promise<Record<string, TeamStrengthProfile>> {
    const strengthMap: Record<string, TeamStrengthProfile> = {};

    const [homeStrength, awayStrength] = await Promise.all([
      this.getCachedStrength(env, body.homeTeam.id),
      this.getCachedStrength(env, body.awayTeam.id),
    ]);

    if (homeStrength) {
      strengthMap[body.homeTeam.id] = homeStrength;
    }
    if (awayStrength) {
      strengthMap[body.awayTeam.id] = awayStrength;
    }

    const missingTeams = [body.homeTeam.id, body.awayTeam.id].filter((teamId) => !strengthMap[teamId]);

    if (missingTeams.length > 0) {
      const historicalData = await env.DB.prepare(
        `SELECT team_id, opponent_id, date, sport, points_scored, points_allowed, offensive_epa, defensive_epa, success_rate
         FROM team_performance
         WHERE team_id IN (?1, ?2)
           AND date >= date('now', '-30 days')
         ORDER BY date DESC`
      )
        .bind(body.homeTeam.id, body.awayTeam.id)
        .all<TeamPerformanceRow>();

      const analyzer = new TeamStrengthAnalyzer(historicalData.results);
      const calculated = analyzer.calculate([body.homeTeam.id, body.awayTeam.id]);

      await Promise.all(
        Object.values(calculated).map((profile) =>
          env.KV.put(`strength:${profile.teamId}`, JSON.stringify(profile), { expirationTtl: 21600 })
        )
      );

      Object.assign(strengthMap, calculated);
    }

    const ensureProfile = (teamId: string): TeamStrengthProfile => {
      if (strengthMap[teamId]) {
        return strengthMap[teamId];
      }

      const fallbackRecent = teamId === body.homeTeam.id
        ? (body.homeTeam.recentForm as number[] | undefined) ?? []
        : (body.awayTeam.recentForm as number[] | undefined) ?? [];

      const profile: TeamStrengthProfile = {
        teamId,
        attackStrength: 1,
        defenseStrength: 1,
        recentForm: fallbackRecent,
        offensiveEPA: 0,
        defensiveEPA: 0,
        successRate: 0.5,
        baselineRating: 1,
        formRating: fallbackRecent.length > 0
          ? fallbackRecent.reduce((acc, value) => acc + value, 0) / fallbackRecent.length
          : 0.5,
        teamOPS: 0.72,
      };

      strengthMap[teamId] = profile;
      return profile;
    };

    ensureProfile(body.homeTeam.id);
    ensureProfile(body.awayTeam.id);

    return strengthMap;
  },

  async getCachedStrength(env: Env, teamId: string): Promise<TeamStrengthProfile | undefined> {
    const cached = await env.KV.get(`strength:${teamId}`);
    if (!cached) {
      return undefined;
    }
    try {
      const parsed = JSON.parse(cached) as TeamStrengthProfile;
      return parsed;
    } catch (error) {
      console.warn('[SimulationWorker] Failed to parse cached strength', error);
      return undefined;
    }
  },

  getSimulator(sport: string): PARXSimulator | BivariatePoissonSimulator | BaseballSimulator {
    const normalized = sport.toLowerCase();

    if (normalized === 'baseball' || normalized === 'mlb') {
      return new BaseballSimulator();
    }

    if (['soccer', 'hockey', 'lacrosse'].includes(normalized)) {
      return new BivariatePoissonSimulator();
    }

    return new PARXSimulator();
  },

  async runSimulation(
    simulator: PARXSimulator | BivariatePoissonSimulator | BaseballSimulator,
    sport: string,
    homeTeam: SimulationTeamInput,
    awayTeam: SimulationTeamInput,
    iterations: number,
    correlation = 0.1
  ): Promise<SimulationResults> {
    if (simulator instanceof BaseballSimulator) {
      return simulator.simulateGame(homeTeam, awayTeam, iterations);
    }

    if (simulator instanceof BivariatePoissonSimulator) {
      return simulator.simulateGame(homeTeam, awayTeam, iterations, correlation);
    }

    return simulator.simulateGame(homeTeam, awayTeam, iterations);
  },

  sanitizeResults(results: SimulationResults): SimulationResponsePayload['results'] {
    const { outcomes, rawCounts, ...rest } = results;
    const limitedDistribution = rest.scoreDistribution.slice(0, 25).map((entry) => ({
      score: entry.score,
      probability: entry.probability,
      count: entry.count,
    }));

    return {
      ...rest,
      scoreDistribution: limitedDistribution,
    };
  },
};
