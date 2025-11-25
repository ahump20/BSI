/**
 * Enhanced Provider Manager
 *
 * Orchestrates data fetching across multiple sports data providers with:
 * - Automatic failover with circuit breaker pattern
 * - Rate limiting per provider
 * - Provider health monitoring
 * - Sport-specific provider prioritization
 *
 * Provider Hierarchy:
 * 1. Primary: SportsDataIO (paid, most reliable)
 * 2. Primary: CFBD (college football specific)
 * 3. Secondary: BALLDONTLIE (free tier, good coverage)
 * 4. Secondary: NCAA Enhanced (comprehensive college data)
 * 5. Tertiary: ESPN Unified (fallback, rate limited)
 *
 * Design Philosophy:
 * - No fake data. Better to fail than return incorrect information.
 * - Transparent fallback - log which provider served the request.
 * - Respect rate limits - don't abuse free APIs.
 */

import { ESPNUnifiedAdapter, type ESPNGame, type SportKey as ESPNSportKey } from './espn-unified-adapter';
import { BalldontlieAdapter, type BDLGame, type BDLSportKey } from './balldontlie-adapter';
import { NCAAEnhancedAdapter, type NCAAGame, type NCAASport, type NCADivision } from './ncaa-enhanced-adapter';
import { CFBDAdapter, type CFBDGame } from './cfbd-adapter';
import { SportsDataIOAdapter } from './sports-data-io';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type UnifiedSportKey =
  | 'ncaaf'
  | 'ncaab'
  | 'wcbb'
  | 'nfl'
  | 'nba'
  | 'wnba'
  | 'mlb'
  | 'cbb'
  | 'nhl';

export type UnifiedGameStatus = 'SCHEDULED' | 'LIVE' | 'FINAL' | 'POSTPONED' | 'CANCELLED' | 'DELAYED';

export interface UnifiedGame {
  id: string;
  sport: UnifiedSportKey;
  scheduledAt: string;
  status: UnifiedGameStatus;
  homeTeamId: string;
  awayTeamId: string;
  homeTeamName: string;
  awayTeamName: string;
  homeTeamAbbrev?: string;
  awayTeamAbbrev?: string;
  homeTeamLogo?: string;
  awayTeamLogo?: string;
  homeScore: number | null;
  awayScore: number | null;
  homeRanking?: number;
  awayRanking?: number;
  venue?: string;
  broadcast?: string;
  conference?: string;
  isConferenceGame?: boolean;
  week?: number;
  postseason?: boolean;
  provider: string;
  fetchedAt: string;
  // Sport-specific data
  sportData?: any;
}

export interface ProviderHealth {
  name: string;
  isHealthy: boolean;
  failures: number;
  lastFailure: number | null;
  lastSuccess: number | null;
  circuitOpen: boolean;
  requestsToday: number;
  dailyLimit: number;
}

export interface ProviderConfig {
  name: string;
  priority: number;
  sports: UnifiedSportKey[];
  rateLimit: {
    requests: number;
    windowMs: number;
  };
  dailyLimit?: number;
}

interface CircuitBreakerState {
  failures: number;
  lastFailure: number | null;
  lastSuccess: number | null;
  isOpen: boolean;
}

interface RateLimiterState {
  count: number;
  resetAt: number;
  dailyCount: number;
  dailyResetAt: number;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const CIRCUIT_BREAKER_CONFIG = {
  failureThreshold: 3,
  resetTimeoutMs: 60000, // 1 minute
  halfOpenRequests: 1,
};

const PROVIDER_CONFIGS: ProviderConfig[] = [
  // Primary providers (paid/reliable)
  {
    name: 'sportsDataIO',
    priority: 1,
    sports: ['mlb', 'nfl', 'nba', 'nhl', 'ncaaf', 'ncaab'],
    rateLimit: { requests: 100, windowMs: 60000 },
    dailyLimit: 10000,
  },
  {
    name: 'cfbd',
    priority: 1,
    sports: ['ncaaf'],
    rateLimit: { requests: 100, windowMs: 60000 },
    dailyLimit: 1000, // Free tier limit
  },
  // Secondary providers (free tiers with good coverage)
  {
    name: 'balldontlie',
    priority: 2,
    sports: ['ncaaf', 'ncaab', 'nfl', 'nba', 'mlb', 'nhl', 'wnba'],
    rateLimit: { requests: 60, windowMs: 60000 },
    dailyLimit: 1000,
  },
  {
    name: 'ncaa',
    priority: 2,
    sports: ['ncaaf', 'ncaab', 'wcbb', 'cbb'],
    rateLimit: { requests: 60, windowMs: 60000 },
  },
  // Tertiary (fallback)
  {
    name: 'espn',
    priority: 3,
    sports: ['ncaaf', 'ncaab', 'wcbb', 'nfl', 'nba', 'wnba', 'mlb', 'cbb', 'nhl'],
    rateLimit: { requests: 30, windowMs: 60000 },
  },
];

// ============================================================================
// ENVIRONMENT INTERFACE
// ============================================================================

export interface EnhancedProviderEnv {
  KV?: KVNamespace;
  SPORTSDATA_API_KEY?: string;
  CFBD_API_KEY?: string;
  BALLDONTLIE_API_KEY?: string;
  NCAA_API_URL?: string;
  NCAA_API_KEY?: string;
}

// ============================================================================
// MAIN CLASS
// ============================================================================

export class EnhancedProviderManager {
  private espn: ESPNUnifiedAdapter;
  private balldontlie?: BalldontlieAdapter;
  private ncaa: NCAAEnhancedAdapter;
  private cfbd?: CFBDAdapter;
  private sportsDataIO?: SportsDataIOAdapter;

  private circuitBreakers: Map<string, CircuitBreakerState>;
  private rateLimiters: Map<string, RateLimiterState>;
  private providerConfigs: Map<string, ProviderConfig>;

  constructor(env: EnhancedProviderEnv) {
    // Initialize adapters
    this.espn = new ESPNUnifiedAdapter(env.KV);

    if (env.BALLDONTLIE_API_KEY) {
      this.balldontlie = new BalldontlieAdapter(env.BALLDONTLIE_API_KEY, env.KV);
    }

    this.ncaa = new NCAAEnhancedAdapter({
      baseUrl: env.NCAA_API_URL,
      kv: env.KV,
      apiKey: env.NCAA_API_KEY,
    });

    if (env.CFBD_API_KEY) {
      this.cfbd = new CFBDAdapter(env.CFBD_API_KEY, env.KV);
    }

    if (env.SPORTSDATA_API_KEY) {
      this.sportsDataIO = new SportsDataIOAdapter(env.SPORTSDATA_API_KEY);
    }

    // Initialize state maps
    this.circuitBreakers = new Map();
    this.rateLimiters = new Map();
    this.providerConfigs = new Map();

    // Initialize all providers
    PROVIDER_CONFIGS.forEach((config) => {
      this.providerConfigs.set(config.name, config);
      this.circuitBreakers.set(config.name, {
        failures: 0,
        lastFailure: null,
        lastSuccess: null,
        isOpen: false,
      });
      this.rateLimiters.set(config.name, {
        count: 0,
        resetAt: Date.now() + config.rateLimit.windowMs,
        dailyCount: 0,
        dailyResetAt: this.getEndOfDay(),
      });
    });
  }

  // ==========================================================================
  // PUBLIC API
  // ==========================================================================

  /**
   * Get games for a sport with automatic failover
   */
  async getGames(
    sport: UnifiedSportKey,
    options: {
      date?: string;
      week?: number;
      conference?: string;
      teamId?: string;
      preferredProvider?: string;
    } = {}
  ): Promise<UnifiedGame[]> {
    const providers = this.getProvidersForSport(sport, options.preferredProvider);

    for (const providerName of providers) {
      if (!this.canUseProvider(providerName)) {
        console.warn(`[EnhancedProviderManager] Skipping ${providerName} - circuit open or rate limited`);
        continue;
      }

      try {
        console.log(`[EnhancedProviderManager] Fetching ${sport} games from ${providerName}`);
        this.incrementRateLimit(providerName);

        const games = await this.fetchFromProvider(providerName, sport, options);
        this.recordSuccess(providerName);

        console.log(`[EnhancedProviderManager] Got ${games.length} games from ${providerName}`);
        return games;
      } catch (error) {
        console.error(`[EnhancedProviderManager] ${providerName} failed:`, error);
        this.recordFailure(providerName);
      }
    }

    throw new Error(`[EnhancedProviderManager] All providers failed for ${sport}`);
  }

  /**
   * Get live games across all sports
   */
  async getLiveGames(sports?: UnifiedSportKey[]): Promise<UnifiedGame[]> {
    const targetSports = sports || ['ncaaf', 'ncaab', 'nfl', 'nba', 'mlb', 'nhl'];
    const allGames: UnifiedGame[] = [];

    // Fetch in parallel
    const results = await Promise.allSettled(
      targetSports.map((sport) => this.getGames(sport))
    );

    results.forEach((result) => {
      if (result.status === 'fulfilled') {
        const liveGames = result.value.filter((g) => g.status === 'LIVE');
        allGames.push(...liveGames);
      }
    });

    return allGames;
  }

  /**
   * Get today's games for a sport
   */
  async getTodaysGames(sport: UnifiedSportKey): Promise<UnifiedGame[]> {
    const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
    return this.getGames(sport, { date: today });
  }

  /**
   * Get provider health status
   */
  getProviderHealth(): ProviderHealth[] {
    return Array.from(this.providerConfigs.entries()).map(([name, config]) => {
      const breaker = this.circuitBreakers.get(name)!;
      const limiter = this.rateLimiters.get(name)!;

      return {
        name,
        isHealthy: !breaker.isOpen && !this.isRateLimited(name),
        failures: breaker.failures,
        lastFailure: breaker.lastFailure,
        lastSuccess: breaker.lastSuccess,
        circuitOpen: breaker.isOpen,
        requestsToday: limiter.dailyCount,
        dailyLimit: config.dailyLimit || Infinity,
      };
    });
  }

  /**
   * Reset a provider's circuit breaker (manual intervention)
   */
  resetProvider(providerName: string): void {
    const breaker = this.circuitBreakers.get(providerName);
    if (breaker) {
      breaker.isOpen = false;
      breaker.failures = 0;
      breaker.lastFailure = null;
      console.log(`[EnhancedProviderManager] Circuit breaker manually reset for ${providerName}`);
    }
  }

  // ==========================================================================
  // PROVIDER FETCH IMPLEMENTATIONS
  // ==========================================================================

  private async fetchFromProvider(
    providerName: string,
    sport: UnifiedSportKey,
    options: {
      date?: string;
      week?: number;
      conference?: string;
      teamId?: string;
    }
  ): Promise<UnifiedGame[]> {
    switch (providerName) {
      case 'espn':
        return this.fetchFromESPN(sport, options);

      case 'balldontlie':
        return this.fetchFromBalldontlie(sport, options);

      case 'ncaa':
        return this.fetchFromNCAA(sport, options);

      case 'cfbd':
        return this.fetchFromCFBD(sport, options);

      case 'sportsDataIO':
        return this.fetchFromSportsDataIO(sport, options);

      default:
        throw new Error(`Unknown provider: ${providerName}`);
    }
  }

  private async fetchFromESPN(
    sport: UnifiedSportKey,
    options: { date?: string; week?: number; conference?: string }
  ): Promise<UnifiedGame[]> {
    const espnSport = this.mapToESPNSport(sport);
    const games = await this.espn.getScoreboard(espnSport, {
      date: options.date,
      week: options.week,
      conference: options.conference,
    });

    return games.map((game) => this.transformESPNGame(game, sport));
  }

  private async fetchFromBalldontlie(
    sport: UnifiedSportKey,
    options: { date?: string; week?: number }
  ): Promise<UnifiedGame[]> {
    if (!this.balldontlie) {
      throw new Error('BALLDONTLIE adapter not configured');
    }

    const bdlSport = this.mapToBDLSport(sport);
    const params: any = {};

    if (options.date) {
      params.dates = [this.formatDateForBDL(options.date)];
    }

    const response = await this.balldontlie.getGames(bdlSport, params);
    return response.data.map((game) => this.transformBDLGame(game, sport));
  }

  private async fetchFromNCAA(
    sport: UnifiedSportKey,
    options: { date?: string; week?: number; conference?: string }
  ): Promise<UnifiedGame[]> {
    const ncaaSport = this.mapToNCAASport(sport);
    const division = this.getNCADivision(sport);

    const now = new Date();
    const year = now.getFullYear();
    const month = options.date ? parseInt(options.date.slice(4, 6)) : now.getMonth() + 1;
    const day = options.date ? parseInt(options.date.slice(6, 8)) : now.getDate();

    const scoreboard = await this.ncaa.getScoreboard({
      sport: ncaaSport,
      division,
      year,
      month,
      day,
      week: options.week,
      conference: options.conference,
    });

    return scoreboard.games.map((game) => this.transformNCAAGame(game, sport));
  }

  private async fetchFromCFBD(
    sport: UnifiedSportKey,
    options: { date?: string; week?: number; conference?: string }
  ): Promise<UnifiedGame[]> {
    if (!this.cfbd || sport !== 'ncaaf') {
      throw new Error('CFBD only supports college football');
    }

    const now = new Date();
    const year = now.getFullYear();
    const week = options.week || this.getCurrentCFBWeek();

    const games = await this.cfbd.fetchGames(year, week, 'regular', options.conference);
    return games.map((game) => this.transformCFBDGame(game));
  }

  private async fetchFromSportsDataIO(
    sport: UnifiedSportKey,
    options: { date?: string }
  ): Promise<UnifiedGame[]> {
    if (!this.sportsDataIO) {
      throw new Error('SportsDataIO adapter not configured');
    }

    // SportsDataIO requires sport-specific implementation
    // This is a placeholder - actual implementation depends on SportsDataIO adapter methods
    throw new Error('SportsDataIO fetch not yet implemented for unified manager');
  }

  // ==========================================================================
  // TRANSFORM HELPERS
  // ==========================================================================

  private transformESPNGame(game: ESPNGame, sport: UnifiedSportKey): UnifiedGame {
    return {
      id: game.id,
      sport,
      scheduledAt: game.scheduledAt,
      status: game.status as UnifiedGameStatus,
      homeTeamId: game.homeTeamId,
      awayTeamId: game.awayTeamId,
      homeTeamName: game.homeTeamName,
      awayTeamName: game.awayTeamName,
      homeTeamAbbrev: game.homeTeamAbbrev,
      awayTeamAbbrev: game.awayTeamAbbrev,
      homeTeamLogo: game.homeTeamLogo,
      awayTeamLogo: game.awayTeamLogo,
      homeScore: game.homeScore,
      awayScore: game.awayScore,
      homeRanking: game.homeRanking,
      awayRanking: game.awayRanking,
      venue: game.venue,
      broadcast: game.broadcast,
      conference: game.conference,
      isConferenceGame: game.isConferenceGame,
      provider: 'ESPN',
      fetchedAt: new Date().toISOString(),
      sportData: game.sportData,
    };
  }

  private transformBDLGame(game: BDLGame, sport: UnifiedSportKey): UnifiedGame {
    return {
      id: game.id.toString(),
      sport,
      scheduledAt: game.date,
      status: this.mapBDLStatus(game.status),
      homeTeamId: game.home_team.id.toString(),
      awayTeamId: game.visitor_team.id.toString(),
      homeTeamName: game.home_team.school || game.home_team.name || '',
      awayTeamName: game.visitor_team.school || game.visitor_team.name || '',
      homeTeamAbbrev: game.home_team.abbreviation,
      awayTeamAbbrev: game.visitor_team.abbreviation,
      homeScore: game.home_team_score,
      awayScore: game.visitor_team_score,
      week: game.week,
      postseason: game.postseason,
      provider: 'BALLDONTLIE',
      fetchedAt: new Date().toISOString(),
    };
  }

  private transformNCAAGame(game: NCAAGame, sport: UnifiedSportKey): UnifiedGame {
    return {
      id: game.id,
      sport,
      scheduledAt: game.date,
      status: this.mapNCAAStatus(game.state),
      homeTeamId: game.home.id,
      awayTeamId: game.away.id,
      homeTeamName: game.home.name,
      awayTeamName: game.away.name,
      homeTeamAbbrev: game.home.abbreviation,
      awayTeamAbbrev: game.away.abbreviation,
      homeTeamLogo: game.home.logo,
      awayTeamLogo: game.away.logo,
      homeScore: game.homeScore,
      awayScore: game.awayScore,
      homeRanking: game.home.ranking,
      awayRanking: game.away.ranking,
      venue: game.venue,
      broadcast: game.broadcast,
      provider: 'NCAA',
      fetchedAt: new Date().toISOString(),
      sportData: game.sportData,
    };
  }

  private transformCFBDGame(game: CFBDGame): UnifiedGame {
    return {
      id: game.id.toString(),
      sport: 'ncaaf',
      scheduledAt: game.startDate,
      status: game.completed ? 'FINAL' : 'SCHEDULED',
      homeTeamId: game.homeId.toString(),
      awayTeamId: game.awayId.toString(),
      homeTeamName: game.homeTeam,
      awayTeamName: game.awayTeam,
      homeScore: game.homePoints ?? null,
      awayScore: game.awayPoints ?? null,
      venue: game.venue,
      conference: game.homeConference,
      isConferenceGame: game.conferenceGame,
      week: game.week,
      postseason: game.seasonType === 'postseason',
      provider: 'CFBD',
      fetchedAt: new Date().toISOString(),
    };
  }

  // ==========================================================================
  // MAPPING HELPERS
  // ==========================================================================

  private mapToESPNSport(sport: UnifiedSportKey): ESPNSportKey {
    const map: Record<UnifiedSportKey, ESPNSportKey> = {
      ncaaf: 'ncaaf',
      ncaab: 'ncaab',
      wcbb: 'wcbb',
      nfl: 'nfl',
      nba: 'nba',
      wnba: 'wnba',
      mlb: 'mlb',
      cbb: 'cbb',
      nhl: 'nhl',
    };
    return map[sport];
  }

  private mapToBDLSport(sport: UnifiedSportKey): BDLSportKey {
    const map: Partial<Record<UnifiedSportKey, BDLSportKey>> = {
      ncaaf: 'ncaaf',
      ncaab: 'ncaab',
      nfl: 'nfl',
      nba: 'nba',
      wnba: 'wnba',
      mlb: 'mlb',
      nhl: 'nhl',
    };
    const result = map[sport];
    if (!result) throw new Error(`Sport ${sport} not supported by BALLDONTLIE`);
    return result;
  }

  private mapToNCAASport(sport: UnifiedSportKey): NCAASport {
    const map: Partial<Record<UnifiedSportKey, NCAASport>> = {
      ncaaf: 'football',
      ncaab: 'basketball-men',
      wcbb: 'basketball-women',
      cbb: 'baseball',
    };
    const result = map[sport];
    if (!result) throw new Error(`Sport ${sport} not supported by NCAA adapter`);
    return result;
  }

  private getNCADivision(sport: UnifiedSportKey): NCADivision {
    if (sport === 'ncaaf') return 'fbs';
    return 'd1';
  }

  private mapBDLStatus(status: string): UnifiedGameStatus {
    const map: Record<string, UnifiedGameStatus> = {
      scheduled: 'SCHEDULED',
      in_progress: 'LIVE',
      final: 'FINAL',
      postponed: 'POSTPONED',
      cancelled: 'CANCELLED',
    };
    return map[status] || 'SCHEDULED';
  }

  private mapNCAAStatus(state: string): UnifiedGameStatus {
    const map: Record<string, UnifiedGameStatus> = {
      pre: 'SCHEDULED',
      live: 'LIVE',
      final: 'FINAL',
      postponed: 'POSTPONED',
      canceled: 'CANCELLED',
    };
    return map[state] || 'SCHEDULED';
  }

  private formatDateForBDL(date: string): string {
    // Convert YYYYMMDD to YYYY-MM-DD
    return `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}`;
  }

  private getCurrentCFBWeek(): number {
    const now = new Date();
    const year = now.getFullYear();
    const seasonStart = new Date(year, 7, 25);
    if (now < seasonStart) return 0;
    const diffWeeks = Math.floor((now.getTime() - seasonStart.getTime()) / (7 * 24 * 60 * 60 * 1000));
    return Math.min(Math.max(diffWeeks + 1, 1), 15);
  }

  // ==========================================================================
  // CIRCUIT BREAKER & RATE LIMITING
  // ==========================================================================

  private getProvidersForSport(sport: UnifiedSportKey, preferredProvider?: string): string[] {
    // Get all providers that support this sport
    const supportingProviders = PROVIDER_CONFIGS
      .filter((config) => config.sports.includes(sport))
      .sort((a, b) => a.priority - b.priority);

    // Extract names
    let providers = supportingProviders.map((p) => p.name);

    // Move preferred provider to front if specified
    if (preferredProvider && providers.includes(preferredProvider)) {
      providers = [preferredProvider, ...providers.filter((p) => p !== preferredProvider)];
    }

    return providers;
  }

  private canUseProvider(providerName: string): boolean {
    return !this.isCircuitOpen(providerName) && !this.isRateLimited(providerName);
  }

  private isCircuitOpen(providerName: string): boolean {
    const breaker = this.circuitBreakers.get(providerName);
    if (!breaker) return false;

    if (breaker.isOpen && breaker.lastFailure) {
      const elapsed = Date.now() - breaker.lastFailure;
      if (elapsed > CIRCUIT_BREAKER_CONFIG.resetTimeoutMs) {
        // Half-open state - allow one request
        breaker.isOpen = false;
        breaker.failures = 0;
        console.log(`[EnhancedProviderManager] Circuit breaker half-open for ${providerName}`);
        return false;
      }
    }

    return breaker.isOpen;
  }

  private isRateLimited(providerName: string): boolean {
    const limiter = this.rateLimiters.get(providerName);
    const config = this.providerConfigs.get(providerName);
    if (!limiter || !config) return false;

    const now = Date.now();

    // Reset window rate limit
    if (now > limiter.resetAt) {
      limiter.count = 0;
      limiter.resetAt = now + config.rateLimit.windowMs;
    }

    // Reset daily rate limit
    if (now > limiter.dailyResetAt) {
      limiter.dailyCount = 0;
      limiter.dailyResetAt = this.getEndOfDay();
    }

    // Check limits
    if (limiter.count >= config.rateLimit.requests) {
      return true;
    }

    if (config.dailyLimit && limiter.dailyCount >= config.dailyLimit) {
      return true;
    }

    return false;
  }

  private incrementRateLimit(providerName: string): void {
    const limiter = this.rateLimiters.get(providerName);
    if (limiter) {
      limiter.count++;
      limiter.dailyCount++;
    }
  }

  private recordSuccess(providerName: string): void {
    const breaker = this.circuitBreakers.get(providerName);
    if (breaker) {
      breaker.failures = 0;
      breaker.lastSuccess = Date.now();
      breaker.isOpen = false;
    }
  }

  private recordFailure(providerName: string): void {
    const breaker = this.circuitBreakers.get(providerName);
    if (breaker) {
      breaker.failures++;
      breaker.lastFailure = Date.now();

      if (breaker.failures >= CIRCUIT_BREAKER_CONFIG.failureThreshold) {
        breaker.isOpen = true;
        console.warn(
          `[EnhancedProviderManager] Circuit breaker OPEN for ${providerName} after ${breaker.failures} failures`
        );
      }
    }
  }

  private getEndOfDay(): number {
    const now = new Date();
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    return endOfDay.getTime();
  }
}
