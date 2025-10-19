import type { D1Database, KVNamespace } from '@cloudflare/workers-types';

export interface UmpireZoneProbability {
  zone: 'inner' | 'outer' | 'high' | 'low';
  calledStrikeProbability: number;
  chaseRate: number;
  swingRate: number;
  sampleSize: number;
}

export interface UmpireZoneProbabilityResponse {
  gameId: string;
  umpireId: string;
  sampleSize: number;
  baselineStrikeProbability: number;
  zones: UmpireZoneProbability[];
  confidence: number;
  updatedAt: string;
  source: 'kv' | 'derived';
}

export interface PitcherWorkloadRiskResponse {
  pitcherId: string;
  season: string | null;
  workloadIndex: number;
  riskTier: 'low' | 'medium' | 'high';
  recommendedRestDays: number;
  rollingAveragePitches: number;
  shortRestAppearances: number;
  recentAppearances: Array<{
    gameId: number;
    gameDate: string;
    pitches: number;
    innings: number;
    strikeouts: number;
    walks: number;
  }>;
  seasonTotals: {
    totalPitches: number;
    totalInnings: number;
    appearances: number;
  };
  lastUpdated: string;
}

export interface SituationalPredictionEntry {
  context: string;
  homeTeamProbability: number;
  awayTeamProbability: number;
  leverageIndex: number;
  supportingMetrics: Record<string, number>;
}

export interface SituationalPredictionsResponse {
  gameId: string;
  scenario: string;
  inning: number | null;
  outs: number | null;
  baseState: string;
  predictions: SituationalPredictionEntry[];
  confidence: number;
  generatedAt: string;
  modelVersion: string;
}

export interface BaseballAnalyticsServiceOptions {
  cacheTtlSeconds?: number;
}

export class BaseballAnalyticsService {
  private readonly db: D1Database;
  private readonly kv?: KVNamespace;
  private readonly cacheTtl: number;

  constructor(db: D1Database, kv?: KVNamespace, options: BaseballAnalyticsServiceOptions = {}) {
    this.db = db;
    this.kv = kv;
    this.cacheTtl = options.cacheTtlSeconds ?? 60;
  }

  async getUmpireZoneProbabilities(params: {
    gameId: string;
    umpireId: string;
    season?: string;
  }): Promise<UmpireZoneProbabilityResponse> {
    const cacheKey = `baseball:umpire-zone:${params.gameId}:${params.umpireId}`;
    const cached = await this.readCache<UmpireZoneProbabilityResponse>(cacheKey);
    if (cached) {
      return { ...cached, source: 'kv' };
    }

    const derived = await this.deriveUmpireZoneProbabilities(params);
    await this.writeCache(cacheKey, derived, this.cacheTtl);
    return derived;
  }

  async getPitcherWorkloadRisk(params: {
    pitcherId: string;
    season?: string;
  }): Promise<PitcherWorkloadRiskResponse> {
    const season = params.season ?? (await this.resolveSeasonForPitcher(params.pitcherId));
    const cacheKey = `baseball:pitcher-workload:${params.pitcherId}:${season ?? 'unknown'}`;
    const cached = await this.readCache<PitcherWorkloadRiskResponse>(cacheKey);
    if (cached) {
      return cached;
    }

    const appearances = await this.queryRecentPitcherAppearances(params.pitcherId, 5);
    const seasonTotals = await this.queryPitcherSeasonTotals(params.pitcherId, season);

    const rollingAveragePitches = this.calculateRollingAverage(appearances.map((a) => a.pitches), 3);
    const restDays = this.calculateRestDays(appearances.map((a) => a.gameDate));
    const shortRestAppearances = restDays.filter((days) => days !== null && days < 3).length;
    const workloadIndex = this.calculateWorkloadIndex({
      rollingAveragePitches,
      restDays,
      appearances,
      seasonTotals,
    });

    const response: PitcherWorkloadRiskResponse = {
      pitcherId: params.pitcherId,
      season: season ?? null,
      workloadIndex,
      riskTier: workloadIndex >= 0.7 ? 'high' : workloadIndex >= 0.45 ? 'medium' : 'low',
      recommendedRestDays: workloadIndex >= 0.7 ? 4 : workloadIndex >= 0.45 ? 3 : 2,
      rollingAveragePitches,
      shortRestAppearances,
      recentAppearances: appearances,
      seasonTotals,
      lastUpdated: new Date().toISOString(),
    };

    await this.writeCache(cacheKey, response, this.cacheTtl);
    return response;
  }

  async getSituationalPredictions(params: {
    gameId: string;
    inning?: number;
    outs?: number;
    baseState?: string;
  }): Promise<SituationalPredictionsResponse> {
    const cacheKey = `baseball:situational:${params.gameId}:${params.inning ?? 'live'}:${params.outs ?? 'x'}:${params.baseState ?? 'empty'}`;
    const cached = await this.readCache<SituationalPredictionsResponse>(cacheKey);
    if (cached) {
      return cached;
    }

    const game = await this.loadGameMetadata(params.gameId);
    const teamStats = await this.loadTeamSeasonStats(game.season_id, [game.home_team_id, game.away_team_id]);
    const recentForm = await this.loadRecentGames(game.season_id, [game.home_team_id, game.away_team_id], 6);

    const scenario = params.baseState ?? 'empty';
    const baseMultiplier = this.deriveBaseStateMultiplier(scenario);
    const inning = params.inning ?? null;
    const outs = params.outs ?? null;

    const homeStats = teamStats.find((team) => team.team_id === game.home_team_id);
    const awayStats = teamStats.find((team) => team.team_id === game.away_team_id);
    if (!homeStats || !awayStats) {
      throw new Error('Season statistics unavailable for one or both teams');
    }

    const homeRecentRunDifferential = this.computeRecentRunDifferential(recentForm.filter((g) => g.team_id === game.home_team_id));
    const awayRecentRunDifferential = this.computeRecentRunDifferential(recentForm.filter((g) => g.team_id === game.away_team_id));

    const leverageIndex = this.calculateLeverageIndex({
      game,
      inning,
      outs,
      baseMultiplier,
    });

    const offenseDelta = (Number(homeStats.on_base_percentage ?? 0) - Number(awayStats.on_base_percentage ?? 0)) * 1.5;
    const sluggingDelta = (Number(homeStats.slugging_percentage ?? 0) - Number(awayStats.slugging_percentage ?? 0)) * 1.2;
    const runPreventionDelta = (Number(awayStats.team_era ?? 0) - Number(homeStats.team_era ?? 0)) / 10;
    const formDelta = (homeRecentRunDifferential - awayRecentRunDifferential) / 20;

    const baselineHome = 0.5 + offenseDelta + sluggingDelta + runPreventionDelta + formDelta;

    const predictions: SituationalPredictionEntry[] = [
      this.buildPredictionEntry('score_next_half_inning', baselineHome, leverageIndex, baseMultiplier, {
        homeOBP: Number(homeStats.on_base_percentage ?? 0),
        awayOBP: Number(awayStats.on_base_percentage ?? 0),
        homeSlugging: Number(homeStats.slugging_percentage ?? 0),
        awaySlugging: Number(awayStats.slugging_percentage ?? 0),
      }),
      this.buildPredictionEntry('allow_run_next_half_inning', 1 - baselineHome + runPreventionDelta * 0.5, leverageIndex, baseMultiplier * 0.9, {
        homeERA: Number(homeStats.team_era ?? 0),
        awayERA: Number(awayStats.team_era ?? 0),
      }),
      this.buildPredictionEntry('steal_success_probability', baselineHome + baseMultiplier * 0.1, leverageIndex * 0.8, baseMultiplier, {
        homeStolenBases: Number(homeStats.stolen_bases ?? 0),
        awayStolenBases: Number(awayStats.stolen_bases ?? 0),
      }),
      this.buildPredictionEntry('double_play_probability', 0.45 - baseMultiplier * 0.2 + leverageIndex * 0.05, leverageIndex, baseMultiplier * 0.7, {
        homeGroundBallRate: Number(homeStats.runs_allowed ?? 0) / Math.max(1, Number(homeStats.innings_pitched ?? 1)),
        awayGroundBallRate: Number(awayStats.runs_allowed ?? 0) / Math.max(1, Number(awayStats.innings_pitched ?? 1)),
      }),
    ];

    const response: SituationalPredictionsResponse = {
      gameId: params.gameId,
      scenario,
      inning,
      outs,
      baseState: scenario,
      predictions,
      confidence: Math.min(0.95, 0.55 + leverageIndex * 0.1 + baseMultiplier * 0.05),
      generatedAt: new Date().toISOString(),
      modelVersion: 'coaching-hub-v1.2.0',
    };

    await this.writeCache(cacheKey, response, 30);
    return response;
  }

  private async deriveUmpireZoneProbabilities(params: {
    gameId: string;
    umpireId: string;
    season?: string;
  }): Promise<UmpireZoneProbabilityResponse> {
    const aggregateStatement = this.db.prepare(`
      SELECT
        COALESCE(SUM(ps.strikes), 0) AS strikes,
        COALESCE(SUM(ps.pitches_thrown), 0) AS pitches,
        COALESCE(SUM(ps.walks), 0) AS walks,
        COALESCE(SUM(ps.hit_batters), 0) AS hit_batters,
        COALESCE(SUM(ps.strikeouts), 0) AS strikeouts,
        COALESCE(SUM(ps.wild_pitches), 0) AS wild_pitches
      FROM pitching_stats ps
      WHERE ps.game_id = ?
    `);

    const aggregateResult = await aggregateStatement.bind(params.gameId).all();
    const totals = aggregateResult.results[0] ?? {
      strikes: 0,
      pitches: 0,
      walks: 0,
      hit_batters: 0,
      strikeouts: 0,
      wild_pitches: 0,
    };

    const sampleSize = Number(totals.pitches ?? 0);
    const baselineStrikeProbability = sampleSize > 0 ? this.round(Number(totals.strikes ?? 0) / sampleSize) : 0;
    const walkRate = sampleSize > 0 ? (Number(totals.walks ?? 0) + Number(totals.hit_batters ?? 0)) / sampleSize : 0;
    const swingMissRate = sampleSize > 0 ? Number(totals.strikeouts ?? 0) / Math.max(1, sampleSize / 4) : 0;

    const zoneDistributions = this.estimateZoneDistributions({
      baselineStrikeProbability,
      walkRate,
      swingMissRate,
      wildPitchRate: sampleSize > 0 ? Number(totals.wild_pitches ?? 0) / sampleSize : 0,
    });

    const response: UmpireZoneProbabilityResponse = {
      gameId: params.gameId,
      umpireId: params.umpireId,
      sampleSize,
      baselineStrikeProbability,
      zones: zoneDistributions.map((zone) => ({
        ...zone,
        calledStrikeProbability: this.round(zone.calledStrikeProbability),
        chaseRate: this.round(zone.chaseRate),
        swingRate: this.round(zone.swingRate),
        sampleSize: Math.round(zone.sampleSize * (sampleSize || 0)),
      })),
      confidence: this.round(Math.min(0.95, 0.3 + sampleSize / 250)),
      updatedAt: new Date().toISOString(),
      source: 'derived',
    };

    return response;
  }

  private estimateZoneDistributions(input: {
    baselineStrikeProbability: number;
    walkRate: number;
    swingMissRate: number;
    wildPitchRate: number;
  }): UmpireZoneProbability[] {
    const weightInner = Math.max(0.15, input.swingMissRate * 0.6 + 0.2);
    const weightOuter = Math.max(0.2, input.walkRate * 0.8 + 0.2);
    const weightHigh = Math.max(0.15, input.swingMissRate * 0.4 + 0.15);
    const weightLow = Math.max(0.15, input.walkRate * 0.4 + input.wildPitchRate * 0.5 + 0.15);
    const totalWeight = weightInner + weightOuter + weightHigh + weightLow;

    const normalized = {
      inner: weightInner / totalWeight,
      outer: weightOuter / totalWeight,
      high: weightHigh / totalWeight,
      low: weightLow / totalWeight,
    };

    const baseline = input.baselineStrikeProbability;

    return [
      {
        zone: 'inner',
        calledStrikeProbability: this.clampProbability(baseline + 0.08 - input.walkRate * 0.2),
        chaseRate: this.clampProbability(0.28 + normalized.inner * 0.4),
        swingRate: this.clampProbability(0.55 + normalized.inner * 0.2),
        sampleSize: normalized.inner,
      },
      {
        zone: 'outer',
        calledStrikeProbability: this.clampProbability(baseline - 0.05 + input.walkRate * 0.3),
        chaseRate: this.clampProbability(0.24 + normalized.outer * 0.3),
        swingRate: this.clampProbability(0.48 - input.walkRate * 0.1 + normalized.outer * 0.1),
        sampleSize: normalized.outer,
      },
      {
        zone: 'high',
        calledStrikeProbability: this.clampProbability(baseline - 0.02 + input.swingMissRate * 0.2),
        chaseRate: this.clampProbability(0.22 + normalized.high * 0.35),
        swingRate: this.clampProbability(0.46 + normalized.high * 0.25),
        sampleSize: normalized.high,
      },
      {
        zone: 'low',
        calledStrikeProbability: this.clampProbability(baseline - 0.03 - input.wildPitchRate * 0.3),
        chaseRate: this.clampProbability(0.31 + normalized.low * 0.25),
        swingRate: this.clampProbability(0.42 + normalized.low * 0.18),
        sampleSize: normalized.low,
      },
    ].map((zone) => ({
      ...zone,
      sampleSize: zone.sampleSize,
    }));
  }

  private calculateRollingAverage(values: number[], windowSize: number): number {
    if (values.length === 0) {
      return 0;
    }
    const slice = values.slice(0, windowSize);
    const sum = slice.reduce((acc, value) => acc + value, 0);
    return this.round(sum / slice.length);
  }

  private calculateRestDays(gameDates: string[]): Array<number | null> {
    const restDays: Array<number | null> = [];
    for (let i = 0; i < gameDates.length - 1; i += 1) {
      const current = new Date(gameDates[i]);
      const next = new Date(gameDates[i + 1]);
      if (Number.isNaN(current.getTime()) || Number.isNaN(next.getTime())) {
        restDays.push(null);
      } else {
        const diff = Math.max(0, Math.round((current.getTime() - next.getTime()) / (1000 * 60 * 60 * 24)));
        restDays.push(diff);
      }
    }
    return restDays;
  }

  private calculateWorkloadIndex(input: {
    rollingAveragePitches: number;
    restDays: Array<number | null>;
    appearances: Array<{ pitches: number; innings: number; gameDate: string; strikeouts: number; walks: number; gameId: number }>;
    seasonTotals: { totalPitches: number; totalInnings: number; appearances: number };
  }): number {
    const fatigueComponent = Math.min(1, input.rollingAveragePitches / 95);
    const restPenalty = input.restDays.reduce((acc, days) => {
      if (days === null) return acc;
      if (days <= 1) return acc + 0.25;
      if (days === 2) return acc + 0.15;
      return acc + 0.05;
    }, 0);

    const volumeComponent = input.seasonTotals.totalPitches > 0
      ? Math.min(1, input.seasonTotals.totalPitches / 1500)
      : 0;

    const stressEvents = input.appearances.filter((appearance) => appearance.pitches >= 25 || appearance.innings >= 2.0);
    const stressComponent = stressEvents.length / Math.max(1, input.appearances.length);

    const workloadIndex = fatigueComponent * 0.4 + volumeComponent * 0.25 + restPenalty * 0.2 + stressComponent * 0.15;
    return this.round(Math.min(0.99, workloadIndex));
  }

  private deriveBaseStateMultiplier(baseState: string): number {
    switch (baseState) {
      case 'runner_on_first':
        return 0.25;
      case 'runner_on_second':
        return 0.32;
      case 'runner_on_third':
        return 0.4;
      case 'runners_on_first_and_second':
        return 0.45;
      case 'runners_on_corners':
        return 0.5;
      case 'bases_loaded':
        return 0.6;
      default:
        return 0.18;
    }
  }

  private calculateLeverageIndex(input: {
    game: any;
    inning: number | null;
    outs: number | null;
    baseMultiplier: number;
  }): number {
    const inningFactor = input.inning ? Math.min(1, Math.max(0.2, input.inning / 9)) : 0.45;
    const closeScore = Math.abs(Number(input.game.home_score ?? 0) - Number(input.game.away_score ?? 0));
    const scoreFactor = closeScore <= 1 ? 0.35 : closeScore <= 3 ? 0.2 : 0.1;
    const outsFactor = input.outs !== null ? [0.15, 0.25, 0.4][Math.min(2, input.outs)] : 0.25;

    return this.round(Math.min(1, inningFactor * 0.5 + scoreFactor * 0.3 + outsFactor * 0.2 + input.baseMultiplier * 0.2));
  }

  private buildPredictionEntry(
    context: string,
    baselineHome: number,
    leverageIndex: number,
    baseMultiplier: number,
    supportingMetrics: Record<string, number>,
  ): SituationalPredictionEntry {
    const adjustedHome = this.clampProbability(baselineHome + baseMultiplier * 0.1 + leverageIndex * 0.05);
    const adjustedAway = this.clampProbability(1 - adjustedHome);

    return {
      context,
      homeTeamProbability: adjustedHome,
      awayTeamProbability: adjustedAway,
      leverageIndex,
      supportingMetrics,
    };
  }

  private computeRecentRunDifferential(games: Array<{ run_differential: number }>): number {
    if (games.length === 0) {
      return 0;
    }
    const total = games.reduce((acc, game) => acc + Number(game.run_differential ?? 0), 0);
    return total / games.length;
  }

  private async loadGameMetadata(gameId: string): Promise<any> {
    const statement = this.db.prepare(`
      SELECT
        g.game_id,
        g.season_id,
        g.home_team_id,
        g.away_team_id,
        g.home_score,
        g.away_score,
        g.status,
        g.innings,
        g.game_date
      FROM games g
      WHERE g.game_id = ?
    `);
    const result = await statement.bind(gameId).first();
    if (!result) {
      throw new Error('Game not found');
    }
    return result;
  }

  private async loadTeamSeasonStats(seasonId: number, teamIds: number[]): Promise<any[]> {
    const placeholders = teamIds.map(() => '?').join(',');
    const statement = this.db.prepare(`
      SELECT
        tss.team_id,
        tss.wins,
        tss.losses,
        tss.runs_scored,
        tss.runs_allowed,
        tss.slugging_percentage,
        tss.on_base_percentage,
        tss.team_era,
        tss.stolen_bases,
        tss.innings_pitched
      FROM team_season_stats tss
      WHERE tss.season_id = ? AND tss.team_id IN (${placeholders})
    `);
    const result = await statement.bind(seasonId, ...teamIds).all();
    return result.results;
  }

  private async loadRecentGames(seasonId: number, teamIds: number[], limit: number): Promise<any[]> {
    const placeholders = teamIds.map(() => '?').join(',');
    const statement = this.db.prepare(`
      SELECT
        g.game_id,
        g.game_date,
        CASE
          WHEN g.home_team_id = t.team_id THEN g.home_score - g.away_score
          ELSE g.away_score - g.home_score
        END AS run_differential,
        t.team_id
      FROM games g
      JOIN teams t ON (t.team_id = g.home_team_id OR t.team_id = g.away_team_id)
      WHERE g.season_id = ?
        AND t.team_id IN (${placeholders})
      ORDER BY g.game_date DESC
      LIMIT ?
    `);
    const result = await statement.bind(seasonId, ...teamIds, limit * teamIds.length).all();
    return result.results;
  }

  private async queryRecentPitcherAppearances(pitcherId: string, limit: number): Promise<Array<{
    gameId: number;
    gameDate: string;
    pitches: number;
    innings: number;
    strikeouts: number;
    walks: number;
  }>> {
    const statement = this.db.prepare(`
      SELECT
        ps.game_id AS gameId,
        g.game_date AS gameDate,
        COALESCE(ps.pitches_thrown, 0) AS pitches,
        COALESCE(ps.innings_pitched, 0) AS innings,
        COALESCE(ps.strikeouts, 0) AS strikeouts,
        COALESCE(ps.walks, 0) AS walks
      FROM pitching_stats ps
      JOIN games g ON g.game_id = ps.game_id
      WHERE ps.player_id = ?
      ORDER BY g.game_date DESC
      LIMIT ?
    `);
    const result = await statement.bind(pitcherId, limit).all();
    return result.results.map((row: any) => ({
      gameId: Number(row.gameId),
      gameDate: row.gameDate,
      pitches: Number(row.pitches ?? 0),
      innings: Number(row.innings ?? 0),
      strikeouts: Number(row.strikeouts ?? 0),
      walks: Number(row.walks ?? 0),
    }));
  }

  private async queryPitcherSeasonTotals(pitcherId: string, season: string | null): Promise<{
    totalPitches: number;
    totalInnings: number;
    appearances: number;
  }> {
    let statement;
    if (season) {
      statement = this.db.prepare(`
        SELECT
          COALESCE(SUM(ps.pitches_thrown), 0) AS totalPitches,
          COALESCE(SUM(ps.innings_pitched), 0) AS totalInnings,
          COUNT(*) AS appearances
        FROM pitching_stats ps
        JOIN games g ON g.game_id = ps.game_id
        JOIN seasons s ON s.season_id = g.season_id
        WHERE ps.player_id = ?
          AND s.year = ?
      `);
    } else {
      statement = this.db.prepare(`
        SELECT
          COALESCE(SUM(ps.pitches_thrown), 0) AS totalPitches,
          COALESCE(SUM(ps.innings_pitched), 0) AS totalInnings,
          COUNT(*) AS appearances
        FROM pitching_stats ps
        WHERE ps.player_id = ?
      `);
    }

    const result = season ? await statement.bind(pitcherId, season).first() : await statement.bind(pitcherId).first();
    if (!result) {
      return { totalPitches: 0, totalInnings: 0, appearances: 0 };
    }

    return {
      totalPitches: Number(result.totalPitches ?? 0),
      totalInnings: Number(result.totalInnings ?? 0),
      appearances: Number(result.appearances ?? 0),
    };
  }

  private async resolveSeasonForPitcher(pitcherId: string): Promise<string | null> {
    const statement = this.db.prepare(`
      SELECT s.year
      FROM pitching_stats ps
      JOIN games g ON g.game_id = ps.game_id
      JOIN seasons s ON s.season_id = g.season_id
      WHERE ps.player_id = ?
      ORDER BY g.game_date DESC
      LIMIT 1
    `);
    const result = await statement.bind(pitcherId).first();
    if (!result) {
      return null;
    }
    return String(result.year);
  }

  private async readCache<T>(key: string): Promise<T | null> {
    if (!this.kv) {
      return null;
    }
    const raw = await this.kv.get(key);
    if (!raw) {
      return null;
    }
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  private async writeCache(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    if (!this.kv) {
      return;
    }
    await this.kv.put(key, JSON.stringify(value), { expirationTtl: ttlSeconds });
  }

  private clampProbability(value: number): number {
    if (!Number.isFinite(value)) {
      return 0;
    }
    return Math.min(0.99, Math.max(0.01, value));
  }

  private round(value: number, precision = 4): number {
    const multiplier = 10 ** precision;
    return Math.round(value * multiplier) / multiplier;
  }
}
