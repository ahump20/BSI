import type CacheService from './cache-service.js';
import type LoggerService from './logger-service.js';

export interface StrengthSnapshot {
  teamId: string;
  conference: string;
  currentRpi: number;
  currentSor: number;
  currentWins: number;
  currentLosses: number;
  futureOpponents: OpponentProjection[];
}

export interface OpponentProjection {
  teamId: string;
  name: string;
  conference?: string;
  rpi: number;
  sor: number;
  games?: number;
  winProbability?: number;
  location?: 'home' | 'away' | 'neutral';
}

export interface ForecastOptions {
  mode?: 'basic' | 'advanced';
  iterations?: number;
  deterministic?: boolean;
  seed?: number;
  cacheTtlSeconds?: number;
}

export interface ForecastResult {
  baseline: ProjectionSummary;
  expected: ProjectionSummary;
  distribution: DistributionSummary;
  scenarios: ScenarioSummary[];
  delta: {
    wins: number;
    rpi: number;
    sor: number;
  };
  meta: {
    iterations: number;
    mode: 'basic' | 'advanced';
    cached: boolean;
    cacheKey: string;
    durationMs: number;
  };
}

export interface ProjectionSummary {
  wins: number;
  losses: number;
  rpi: number;
  sor: number;
}

export interface DistributionSummary {
  wins: DistributionMetric;
  rpi: DistributionMetric;
  sor: DistributionMetric;
}

export interface DistributionMetric {
  mean: number;
  median: number;
  p75: number;
  p90: number;
  min: number;
  max: number;
}

export interface ScenarioSummary {
  label: string;
  wins: number;
  losses: number;
  rpi: number;
  sor: number;
  probability: number;
}

interface SimulationSample {
  wins: number;
  losses: number;
  rpi: number;
  sor: number;
}

interface SerializedCache {
  result: ForecastResult;
  storedAt: string;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export default class ConferenceStrengthService {
  private cache?: CacheService;
  private logger?: LoggerService;
  private defaults: Required<Pick<ForecastOptions, 'iterations' | 'mode'>> & {
    cacheTtlSeconds: number;
  };

  constructor(cache?: CacheService, logger?: LoggerService, defaults?: Partial<ForecastOptions>) {
    this.cache = cache;
    this.logger = logger;
    this.defaults = {
      iterations: defaults?.iterations && defaults.iterations > 0 ? defaults.iterations : 400,
      mode: defaults?.mode === 'advanced' ? 'advanced' : 'basic',
      cacheTtlSeconds: defaults?.cacheTtlSeconds && defaults.cacheTtlSeconds > 0 ? defaults.cacheTtlSeconds : 120,
    };
  }

  async forecastStrength(snapshot: StrengthSnapshot, options?: ForecastOptions): Promise<ForecastResult> {
    const resolvedOptions: Required<ForecastOptions> = {
      mode: options?.mode || this.defaults.mode,
      iterations: options?.iterations && options.iterations > 0 ? options.iterations : this.defaults.iterations,
      deterministic: options?.deterministic ?? options?.mode === 'basic',
      seed: options?.seed ?? Date.now(),
      cacheTtlSeconds: options?.cacheTtlSeconds ?? this.defaults.cacheTtlSeconds,
    };

    const cacheKey = this.buildCacheKey(snapshot, resolvedOptions);

    const start = Date.now();
    if (this.cache) {
      const cached = await this.getFromCache(cacheKey);
      if (cached) {
        this.logger?.debug?.(`conference-strength cache hit: ${cacheKey}`);
        return {
          ...cached.result,
          meta: {
            ...cached.result.meta,
            cached: true,
            cacheKey,
            durationMs: Date.now() - start,
          },
        };
      }
    }

    const baseline: ProjectionSummary = {
      wins: snapshot.currentWins,
      losses: snapshot.currentLosses,
      rpi: snapshot.currentRpi,
      sor: snapshot.currentSor,
    };

    const samples: SimulationSample[] = resolvedOptions.deterministic
      ? [this.runDeterministic(snapshot)]
      : this.runMonteCarlo(snapshot, resolvedOptions.iterations, resolvedOptions.seed);

    const expected = this.computeExpected(samples);
    const distribution = this.computeDistribution(samples);
    const scenarios = this.buildScenarios(samples, baseline);

    const result: ForecastResult = {
      baseline,
      expected,
      distribution,
      scenarios,
      delta: {
        wins: expected.wins - baseline.wins,
        rpi: expected.rpi - baseline.rpi,
        sor: expected.sor - baseline.sor,
      },
      meta: {
        iterations: samples.length,
        mode: resolvedOptions.mode,
        cached: false,
        cacheKey,
        durationMs: Date.now() - start,
      },
    };

    if (this.cache) {
      await this.cacheResult(cacheKey, result, resolvedOptions.cacheTtlSeconds);
    }

    return result;
  }

  private runDeterministic(snapshot: StrengthSnapshot): SimulationSample {
    const wins = snapshot.currentWins;
    const losses = snapshot.currentLosses;

    let expectedWins = wins;
    let expectedLosses = losses;

    for (const opponent of snapshot.futureOpponents) {
      const games = opponent.games && opponent.games > 0 ? opponent.games : 1;
      const probability = this.estimateWinProbability(snapshot, opponent);
      expectedWins += games * probability;
      expectedLosses += games * (1 - probability);
    }

    const rpi = this.computeRpi(snapshot, expectedWins, expectedLosses);
    const sor = this.computeSor(snapshot, expectedWins, expectedLosses);

    return {
      wins: expectedWins,
      losses: expectedLosses,
      rpi,
      sor,
    };
  }

  private runMonteCarlo(snapshot: StrengthSnapshot, iterations: number, seed: number): SimulationSample[] {
    const random = this.createRandom(seed);
    const samples: SimulationSample[] = [];

    for (let i = 0; i < iterations; i++) {
      let wins = snapshot.currentWins;
      let losses = snapshot.currentLosses;

      for (const opponent of snapshot.futureOpponents) {
        const games = opponent.games && opponent.games > 0 ? opponent.games : 1;
        const probability = this.estimateWinProbability(snapshot, opponent);

        for (let g = 0; g < games; g++) {
          const value = random();
          if (value <= probability) {
            wins += 1;
          } else {
            losses += 1;
          }
        }
      }

      const rpi = this.computeRpi(snapshot, wins, losses);
      const sor = this.computeSor(snapshot, wins, losses);

      samples.push({ wins, losses, rpi, sor });
    }

    return samples;
  }

  private computeExpected(samples: SimulationSample[]): ProjectionSummary {
    const total = samples.reduce(
      (acc, sample) => {
        acc.wins += sample.wins;
        acc.losses += sample.losses;
        acc.rpi += sample.rpi;
        acc.sor += sample.sor;
        return acc;
      },
      { wins: 0, losses: 0, rpi: 0, sor: 0 }
    );

    const count = samples.length;
    return {
      wins: total.wins / count,
      losses: total.losses / count,
      rpi: total.rpi / count,
      sor: total.sor / count,
    };
  }

  private computeDistribution(samples: SimulationSample[]): DistributionSummary {
    const sortedWins = [...samples].sort((a, b) => a.wins - b.wins);
    const sortedRpi = [...samples].sort((a, b) => a.rpi - b.rpi);
    const sortedSor = [...samples].sort((a, b) => a.sor - b.sor);

    const toMetric = (values: number[]): DistributionMetric => {
      const len = values.length;
      const median = this.percentile(values, 0.5);
      return {
        mean: values.reduce((acc, value) => acc + value, 0) / len,
        median,
        p75: this.percentile(values, 0.75),
        p90: this.percentile(values, 0.9),
        min: values[0],
        max: values[len - 1],
      };
    };

    return {
      wins: toMetric(sortedWins.map((sample) => sample.wins)),
      rpi: toMetric(sortedRpi.map((sample) => sample.rpi)),
      sor: toMetric(sortedSor.map((sample) => sample.sor)),
    };
  }

  private percentile(values: number[], percentile: number): number {
    if (values.length === 0) {
      return 0;
    }

    if (values.length === 1) {
      return values[0];
    }

    const index = clamp(percentile, 0, 1) * (values.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);

    if (lower === upper) {
      return values[lower];
    }

    const weight = index - lower;
    return values[lower] * (1 - weight) + values[upper] * weight;
  }

  private buildScenarios(samples: SimulationSample[], baseline: ProjectionSummary): ScenarioSummary[] {
    if (samples.length === 1) {
      const sample = samples[0];
      return [
        {
          label: 'expected',
          wins: sample.wins,
          losses: sample.losses,
          rpi: sample.rpi,
          sor: sample.sor,
          probability: 1,
        },
      ];
    }

    const sortedByWins = [...samples].sort((a, b) => a.wins - b.wins);
    const sortedByRpi = [...samples].sort((a, b) => a.rpi - b.rpi);

    const best = sortedByWins[sortedByWins.length - 1];
    const worst = sortedByWins[0];
    const median = sortedByWins[Math.floor(sortedByWins.length / 2)];

    const extremeRpi = sortedByRpi[sortedByRpi.length - 1];

    return [
      {
        label: 'baseline',
        wins: baseline.wins,
        losses: baseline.losses,
        rpi: baseline.rpi,
        sor: baseline.sor,
        probability: 0,
      },
      {
        label: 'median',
        wins: median.wins,
        losses: median.losses,
        rpi: median.rpi,
        sor: median.sor,
        probability: 0.5,
      },
      {
        label: 'best-case',
        wins: best.wins,
        losses: best.losses,
        rpi: best.rpi,
        sor: best.sor,
        probability: 0.1,
      },
      {
        label: 'worst-case',
        wins: worst.wins,
        losses: worst.losses,
        rpi: worst.rpi,
        sor: worst.sor,
        probability: 0.1,
      },
      {
        label: 'rpi-upside',
        wins: extremeRpi.wins,
        losses: extremeRpi.losses,
        rpi: extremeRpi.rpi,
        sor: extremeRpi.sor,
        probability: 0.05,
      },
    ];
  }

  private estimateWinProbability(snapshot: StrengthSnapshot, opponent: OpponentProjection): number {
    if (typeof opponent.winProbability === 'number') {
      return clamp(opponent.winProbability, 0.05, 0.95);
    }

    const rpiDelta = snapshot.currentRpi - opponent.rpi;
    const sorDelta = snapshot.currentSor - opponent.sor;
    const base = 0.5 + rpiDelta * 0.1 + sorDelta * 0.05;

    let adjustment = 0;
    switch (opponent.location) {
      case 'home':
        adjustment = 0.035;
        break;
      case 'away':
        adjustment = -0.035;
        break;
      default:
        adjustment = 0;
    }

    return clamp(base + adjustment, 0.1, 0.9);
  }

  private computeRpi(snapshot: StrengthSnapshot, wins: number, losses: number): number {
    const totalGames = wins + losses;
    if (totalGames === 0) {
      return snapshot.currentRpi;
    }

    const winningPct = wins / totalGames;

    const opponentRpi = snapshot.futureOpponents.reduce((acc, opponent) => {
      const games = opponent.games && opponent.games > 0 ? opponent.games : 1;
      return acc + opponent.rpi * games;
    }, 0);

    const opponentWp = snapshot.futureOpponents.reduce((acc, opponent) => {
      const games = opponent.games && opponent.games > 0 ? opponent.games : 1;
      const opponentWinPct = this.estimateOpponentWinningPct(opponent);
      return acc + opponentWinPct * games;
    }, 0);

    const totalFutureGames = snapshot.futureOpponents.reduce((acc, opponent) => acc + (opponent.games && opponent.games > 0 ? opponent.games : 1), 0);

    const strengthOfSchedule = totalFutureGames > 0 ? opponentWp / totalFutureGames : 0.5;
    const opponentsOpponents = totalFutureGames > 0 ? opponentRpi / totalFutureGames : snapshot.currentRpi;

    return 0.25 * winningPct + 0.5 * strengthOfSchedule + 0.25 * opponentsOpponents;
  }

  private computeSor(snapshot: StrengthSnapshot, wins: number, losses: number): number {
    const totalGames = wins + losses;
    if (totalGames === 0) {
      return snapshot.currentSor;
    }

    const baseline = snapshot.currentSor;
    const difficultyScore = snapshot.futureOpponents.reduce((acc, opponent) => {
      const games = opponent.games && opponent.games > 0 ? opponent.games : 1;
      const probability = this.estimateWinProbability(snapshot, opponent);
      const difficulty = 1 - probability;
      return acc + difficulty * games;
    }, 0);

    const normalizedDifficulty = difficultyScore / totalGames;
    const winIndex = wins / totalGames;

    return clamp(baseline * 0.6 + normalizedDifficulty * 0.3 + winIndex * 0.1, 0, 1);
  }

  private estimateOpponentWinningPct(opponent: OpponentProjection): number {
    const normalizedRpi = clamp(opponent.rpi, 0, 1);
    const normalizedSor = clamp(opponent.sor, 0, 1);
    return 0.55 * normalizedRpi + 0.45 * normalizedSor;
  }

  private buildCacheKey(snapshot: StrengthSnapshot, options: ForecastOptions): string {
    const opponentKey = snapshot.futureOpponents
      .map((opponent) => [opponent.teamId, opponent.games ?? 1, opponent.winProbability ?? 'auto', opponent.location ?? 'neutral'].join(':'))
      .join('|');

    const parts = [
      'conference-strength',
      snapshot.teamId,
      snapshot.conference,
      snapshot.currentRpi.toFixed(4),
      snapshot.currentSor.toFixed(4),
      snapshot.currentWins,
      snapshot.currentLosses,
      opponentKey,
      options.mode || 'basic',
      options.iterations || 0,
      options.deterministic ? 'det' : 'mc',
    ];

    return parts.join('::');
  }

  private async getFromCache(cacheKey: string): Promise<SerializedCache | null> {
    if (!this.cache) {
      return null;
    }

    const raw = await this.cache.get(cacheKey);
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(typeof raw === 'string' ? raw : String(raw)) as SerializedCache;
    } catch (error) {
      this.logger?.warn?.(`conference-strength cache parse failed: ${cacheKey}`, { error });
      return null;
    }
  }

  private async cacheResult(cacheKey: string, result: ForecastResult, ttlSeconds: number): Promise<void> {
    if (!this.cache) {
      return;
    }

    const payload: SerializedCache = {
      result,
      storedAt: new Date().toISOString(),
    };

    try {
      await this.cache.put(cacheKey, JSON.stringify(payload), { expirationTtl: ttlSeconds });
    } catch (error) {
      this.logger?.warn?.(`conference-strength cache write failed: ${cacheKey}`, { error });
    }
  }

  private createRandom(seed: number): () => number {
    let state = seed % 2147483647;
    if (state <= 0) {
      state += 2147483646;
    }

    return () => {
      state = (state * 16807) % 2147483647;
      return (state - 1) / 2147483646;
    };
  }
}
