/**
 * Multi-Source Data Aggregator for College Baseball
 *
 * Implements priority-based fallback logic across multiple API sources:
 * 1. NCAA API (henrygd/ncaa-api) - Free, primary source
 * 2. ESPN API - Free, backup (unofficial)
 * 3. Highlightly API - Paid, premium features
 *
 * Features:
 * - Automatic failover between sources
 * - KV-based caching with configurable TTLs
 * - Rate limit tracking and respect
 * - Health monitoring per source
 * - Unified data normalization
 *
 * @author BSI Team
 * @created 2025-01-16
 */

import {
  NCAAApiClient,
  createNCAAApiClient,
  type NCAAGame,
  type NCAAStandingsTeam,
  type NCAATeamRanking,
  type NCAABoxScore,
  type NCAAApiResponse,
} from '../api-clients/ncaa-api';

import {
  ESPNApiClient,
  createESPNApiClient,
  type ESPNEvent,
  type ESPNCompetitor,
  type ESPNStandingsEntry,
  type ESPNRankedTeam,
  type ESPNApiResponse,
} from '../api-clients/espn-api';

import {
  HighlightlyApiClient,
  createHighlightlyApiClient,
  type HighlightlyMatch,
  type HighlightlyStandingsTeam,
  type HighlightlyBoxScore,
  type HighlightlyApiResponse,
} from '../api-clients/highlightly-api';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export interface AggregatorConfig {
  /** KV namespace for caching */
  cache?: KVNamespace;
  /** Highlightly RapidAPI key (optional, enables premium source) */
  highlightlyApiKey?: string;
  /** NCAA API base URL (default: public instance) */
  ncaaApiUrl?: string;
  /** Enable/disable specific sources */
  enabledSources?: {
    ncaa?: boolean;
    espn?: boolean;
    highlightly?: boolean;
  };
  /** Cache TTLs in seconds */
  cacheTTL?: {
    liveScores?: number; // Default: 60
    standings?: number; // Default: 3600
    rankings?: number; // Default: 3600
    teams?: number; // Default: 86400
    boxScores?: number; // Default: 86400
  };
}

export type DataSource = 'ncaa-api' | 'espn' | 'highlightly';

export interface SourceHealth {
  source: DataSource;
  healthy: boolean;
  latency_ms: number;
  lastCheck: string;
  consecutiveFailures: number;
  error?: string;
}

// Normalized Game Format
export interface NormalizedGame {
  // Identifiers
  gameId: string;
  ncaaGameId?: string;
  espnEventId?: string;
  highlightlyMatchId?: number;

  // Teams
  homeTeam: NormalizedTeam;
  awayTeam: NormalizedTeam;

  // Scores
  homeScore: number;
  awayScore: number;
  homeHits?: number;
  awayHits?: number;
  homeErrors?: number;
  awayErrors?: number;

  // Status
  status: 'scheduled' | 'in_progress' | 'final' | 'postponed' | 'cancelled';
  inning?: number;
  inningHalf?: 'top' | 'bottom';
  outs?: number;

  // Linescore
  homeLinescore?: number[];
  awayLinescore?: number[];

  // Schedule
  scheduledDate: string;
  scheduledTime?: string;
  startTimestamp?: number;

  // Venue
  venue?: string;
  city?: string;
  state?: string;
  attendance?: number;

  // Broadcast
  broadcasts?: string[];

  // Metadata
  dataSource: DataSource;
  fetchedAt: string;
  cached?: boolean;
}

export interface NormalizedTeam {
  teamId: string;
  name: string;
  abbreviation?: string;
  logo?: string;
  rank?: number;
  record?: string;
}

// Normalized Standings Format
export interface NormalizedStanding {
  teamId: string;
  teamName: string;
  teamLogo?: string;
  conference: string;
  division?: string;

  // Record
  overallWins: number;
  overallLosses: number;
  conferenceWins: number;
  conferenceLosses: number;
  winPct: number;
  conferenceWinPct?: number;

  // Additional Stats
  streak?: string;
  lastTen?: string;
  gamesBack?: number;
  runsScored?: number;
  runsAllowed?: number;
  runDifferential?: number;

  // Metadata
  conferenceRank?: number;
  dataSource: DataSource;
  fetchedAt: string;
}

// Normalized Ranking Format
export interface NormalizedRanking {
  rank: number;
  previousRank?: number;
  teamId: string;
  teamName: string;
  teamLogo?: string;
  record?: string;
  points?: number;
  firstPlaceVotes?: number;

  // Metadata
  pollName: string;
  week?: number;
  dataSource: DataSource;
  fetchedAt: string;
}

// Aggregator Response
export interface AggregatorResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  source: DataSource;
  fallbackUsed: boolean;
  fallbackSources?: DataSource[];
  cached: boolean;
  timestamp: string;
  duration_ms: number;
}

// =============================================================================
// MULTI-SOURCE DATA AGGREGATOR CLASS
// =============================================================================

export class CollegeBaseballAggregator {
  private readonly config: Required<AggregatorConfig>;
  private readonly ncaaClient: NCAAApiClient;
  private readonly espnClient: ESPNApiClient;
  private readonly highlightlyClient: HighlightlyApiClient | null;

  private sourceHealth: Map<DataSource, SourceHealth> = new Map();

  // Cache key prefixes
  private static readonly CACHE_PREFIX = 'cbb:';
  private static readonly CACHE_KEYS = {
    LIVE_SCORES: 'cbb:live-scores',
    STANDINGS: 'cbb:standings',
    RANKINGS: 'cbb:rankings',
    TEAMS: 'cbb:teams',
    SOURCE_HEALTH: 'cbb:source-health',
  };

  constructor(config: AggregatorConfig = {}) {
    this.config = {
      cache: config.cache,
      highlightlyApiKey: config.highlightlyApiKey || '',
      ncaaApiUrl: config.ncaaApiUrl || NCAAApiClient.PUBLIC_INSTANCE,
      enabledSources: {
        ncaa: config.enabledSources?.ncaa ?? true,
        espn: config.enabledSources?.espn ?? true,
        highlightly: config.enabledSources?.highlightly ?? !!config.highlightlyApiKey,
      },
      cacheTTL: {
        liveScores: config.cacheTTL?.liveScores ?? 60,
        standings: config.cacheTTL?.standings ?? 3600,
        rankings: config.cacheTTL?.rankings ?? 3600,
        teams: config.cacheTTL?.teams ?? 86400,
        boxScores: config.cacheTTL?.boxScores ?? 86400,
      },
    };

    // Initialize API clients
    this.ncaaClient = createNCAAApiClient({ baseUrl: this.config.ncaaApiUrl });
    this.espnClient = createESPNApiClient();
    this.highlightlyClient = this.config.highlightlyApiKey
      ? createHighlightlyApiClient(this.config.highlightlyApiKey)
      : null;

    // Initialize source health tracking
    this.initSourceHealth();
  }

  private initSourceHealth(): void {
    const sources: DataSource[] = ['ncaa-api', 'espn', 'highlightly'];
    for (const source of sources) {
      this.sourceHealth.set(source, {
        source,
        healthy: true,
        latency_ms: 0,
        lastCheck: new Date().toISOString(),
        consecutiveFailures: 0,
      });
    }
  }

  // ---------------------------------------------------------------------------
  // CACHE HELPERS
  // ---------------------------------------------------------------------------

  private async getFromCache<T>(key: string): Promise<T | null> {
    if (!this.config.cache) return null;

    try {
      const cached = await this.config.cache.get(key, 'json');
      return cached as T | null;
    } catch {
      return null;
    }
  }

  private async setCache<T>(key: string, data: T, ttl: number): Promise<void> {
    if (!this.config.cache) return;

    try {
      await this.config.cache.put(key, JSON.stringify(data), {
        expirationTtl: ttl,
      });
    } catch {
      // Ignore cache write failures
    }
  }

  // ---------------------------------------------------------------------------
  // SOURCE HEALTH TRACKING
  // ---------------------------------------------------------------------------

  private recordSuccess(source: DataSource, latency_ms: number): void {
    const health = this.sourceHealth.get(source);
    if (health) {
      health.healthy = true;
      health.latency_ms = latency_ms;
      health.lastCheck = new Date().toISOString();
      health.consecutiveFailures = 0;
      health.error = undefined;
    }
  }

  private recordFailure(source: DataSource, error: string): void {
    const health = this.sourceHealth.get(source);
    if (health) {
      health.consecutiveFailures++;
      health.lastCheck = new Date().toISOString();
      health.error = error;
      // Mark as unhealthy after 3 consecutive failures
      if (health.consecutiveFailures >= 3) {
        health.healthy = false;
      }
    }
  }

  private isSourceHealthy(source: DataSource): boolean {
    return this.sourceHealth.get(source)?.healthy ?? false;
  }

  private getOrderedSources(): DataSource[] {
    const sources: DataSource[] = [];

    // Priority order: ncaa-api > espn > highlightly
    if (this.config.enabledSources.ncaa && this.isSourceHealthy('ncaa-api')) {
      sources.push('ncaa-api');
    }
    if (this.config.enabledSources.espn && this.isSourceHealthy('espn')) {
      sources.push('espn');
    }
    if (
      this.config.enabledSources.highlightly &&
      this.highlightlyClient &&
      this.isSourceHealthy('highlightly')
    ) {
      sources.push('highlightly');
    }

    // Add unhealthy sources as last resort
    if (this.config.enabledSources.ncaa && !sources.includes('ncaa-api')) {
      sources.push('ncaa-api');
    }
    if (this.config.enabledSources.espn && !sources.includes('espn')) {
      sources.push('espn');
    }
    if (
      this.config.enabledSources.highlightly &&
      this.highlightlyClient &&
      !sources.includes('highlightly')
    ) {
      sources.push('highlightly');
    }

    return sources;
  }

  // ---------------------------------------------------------------------------
  // DATA NORMALIZATION
  // ---------------------------------------------------------------------------

  private normalizeNCAAGame(game: NCAAGame): NormalizedGame {
    return {
      gameId: `ncaa-${game.gameId}`,
      ncaaGameId: game.gameId,
      homeTeam: {
        teamId: game.home.teamId,
        name: game.home.name,
        abbreviation: game.home.abbreviation,
        logo: game.home.logo,
        rank: game.home.rank,
        record: game.home.record,
      },
      awayTeam: {
        teamId: game.away.teamId,
        name: game.away.name,
        abbreviation: game.away.abbreviation,
        logo: game.away.logo,
        rank: game.away.rank,
        record: game.away.record,
      },
      homeScore: game.home.score,
      awayScore: game.away.score,
      status:
        game.status === 'pre'
          ? 'scheduled'
          : game.status === 'in'
            ? 'in_progress'
            : game.status === 'final'
              ? 'final'
              : 'scheduled',
      inning: game.period,
      homeLinescore: game.home.linescores,
      awayLinescore: game.away.linescores,
      scheduledDate: game.startDate,
      scheduledTime: game.startTime,
      venue: game.venue,
      attendance: game.attendance,
      broadcasts: game.broadcasts,
      dataSource: 'ncaa-api',
      fetchedAt: new Date().toISOString(),
    };
  }

  private normalizeESPNGame(event: ESPNEvent): NormalizedGame {
    const competition = event.competitions?.[0];
    const homeCompetitor = competition?.competitors?.find((c) => c.homeAway === 'home');
    const awayCompetitor = competition?.competitors?.find((c) => c.homeAway === 'away');

    return {
      gameId: `espn-${event.id}`,
      espnEventId: event.id,
      homeTeam: {
        teamId: homeCompetitor?.team?.abbreviation?.toLowerCase() || homeCompetitor?.team?.id || '',
        name: homeCompetitor?.team?.displayName || homeCompetitor?.team?.name || '',
        abbreviation: homeCompetitor?.team?.abbreviation,
        logo: homeCompetitor?.team?.logo,
        rank: homeCompetitor?.curatedRank?.current,
        record: homeCompetitor?.records?.[0]?.summary,
      },
      awayTeam: {
        teamId: awayCompetitor?.team?.abbreviation?.toLowerCase() || awayCompetitor?.team?.id || '',
        name: awayCompetitor?.team?.displayName || awayCompetitor?.team?.name || '',
        abbreviation: awayCompetitor?.team?.abbreviation,
        logo: awayCompetitor?.team?.logo,
        rank: awayCompetitor?.curatedRank?.current,
        record: awayCompetitor?.records?.[0]?.summary,
      },
      homeScore: parseInt(homeCompetitor?.score || '0', 10),
      awayScore: parseInt(awayCompetitor?.score || '0', 10),
      homeHits: homeCompetitor?.hits,
      awayHits: awayCompetitor?.hits,
      homeErrors: homeCompetitor?.errors,
      awayErrors: awayCompetitor?.errors,
      status:
        event.status?.type?.state === 'pre'
          ? 'scheduled'
          : event.status?.type?.state === 'in'
            ? 'in_progress'
            : event.status?.type?.state === 'post'
              ? 'final'
              : 'scheduled',
      inning: event.status?.period,
      homeLinescore: homeCompetitor?.linescores?.map((l) => l.value),
      awayLinescore: awayCompetitor?.linescores?.map((l) => l.value),
      scheduledDate: event.date.split('T')[0],
      scheduledTime: event.date.split('T')[1]?.slice(0, 5),
      startTimestamp: new Date(event.date).getTime(),
      venue: competition?.venue?.fullName,
      city: competition?.venue?.address?.city,
      state: competition?.venue?.address?.state,
      attendance: competition?.attendance,
      broadcasts: competition?.broadcasts?.flatMap((b) => b.names || []),
      dataSource: 'espn',
      fetchedAt: new Date().toISOString(),
    };
  }

  private normalizeHighlightlyGame(match: HighlightlyMatch): NormalizedGame {
    return {
      gameId: `hl-${match.id}`,
      highlightlyMatchId: match.id,
      homeTeam: {
        teamId: match.homeTeam.slug || String(match.homeTeam.id),
        name: match.homeTeam.name,
        abbreviation: match.homeTeam.shortName,
        logo: match.homeTeam.logo,
        rank: match.homeTeam.ranking,
        record: match.homeTeam.record
          ? `${match.homeTeam.record.wins}-${match.homeTeam.record.losses}`
          : undefined,
      },
      awayTeam: {
        teamId: match.awayTeam.slug || String(match.awayTeam.id),
        name: match.awayTeam.name,
        abbreviation: match.awayTeam.shortName,
        logo: match.awayTeam.logo,
        rank: match.awayTeam.ranking,
        record: match.awayTeam.record
          ? `${match.awayTeam.record.wins}-${match.awayTeam.record.losses}`
          : undefined,
      },
      homeScore: match.homeScore,
      awayScore: match.awayScore,
      status:
        match.status.type === 'notstarted'
          ? 'scheduled'
          : match.status.type === 'inprogress'
            ? 'in_progress'
            : match.status.type === 'finished'
              ? 'final'
              : match.status.type === 'postponed'
                ? 'postponed'
                : match.status.type === 'cancelled'
                  ? 'cancelled'
                  : 'scheduled',
      inning: match.currentInning,
      inningHalf: match.currentInningHalf,
      outs: match.outs,
      homeLinescore: match.innings?.map((i) => i.homeRuns),
      awayLinescore: match.innings?.map((i) => i.awayRuns),
      scheduledDate: new Date(match.startTimestamp * 1000).toISOString().split('T')[0],
      startTimestamp: match.startTimestamp,
      venue: match.venue?.name,
      city: match.venue?.city,
      state: match.venue?.state,
      attendance: match.attendance,
      dataSource: 'highlightly',
      fetchedAt: new Date().toISOString(),
    };
  }

  // ---------------------------------------------------------------------------
  // PUBLIC API METHODS
  // ---------------------------------------------------------------------------

  /**
   * Get live scores with automatic source fallback
   */
  async getLiveScores(): Promise<AggregatorResponse<NormalizedGame[]>> {
    const startTime = Date.now();
    const cacheKey = CollegeBaseballAggregator.CACHE_KEYS.LIVE_SCORES;
    const fallbackSources: DataSource[] = [];

    // Check cache first
    const cached = await this.getFromCache<NormalizedGame[]>(cacheKey);
    if (cached) {
      return {
        success: true,
        data: cached,
        source: 'ncaa-api', // Assume primary
        fallbackUsed: false,
        cached: true,
        timestamp: new Date().toISOString(),
        duration_ms: Date.now() - startTime,
      };
    }

    // Try sources in priority order
    const sources = this.getOrderedSources();

    for (const source of sources) {
      try {
        let games: NormalizedGame[] = [];

        if (source === 'ncaa-api') {
          const response = await this.ncaaClient.getTodayScoreboard('d1');
          if (response.success && response.data) {
            games = response.data.games.map((g) => this.normalizeNCAAGame(g));
            this.recordSuccess(source, response.duration_ms);
          } else {
            throw new Error(response.error || 'NCAA API failed');
          }
        } else if (source === 'espn') {
          const response = await this.espnClient.getTodayScoreboard();
          if (response.success && response.data?.events) {
            games = response.data.events.map((e) => this.normalizeESPNGame(e));
            this.recordSuccess(source, response.duration_ms);
          } else {
            throw new Error(response.error || 'ESPN API failed');
          }
        } else if (source === 'highlightly' && this.highlightlyClient) {
          const response = await this.highlightlyClient.getTodayGames();
          if (response.success && response.data?.data) {
            games = response.data.data.map((m) => this.normalizeHighlightlyGame(m));
            this.recordSuccess(source, response.duration_ms);
          } else {
            throw new Error(response.error || 'Highlightly API failed');
          }
        }

        // Cache the result
        await this.setCache(cacheKey, games, this.config.cacheTTL.liveScores);

        return {
          success: true,
          data: games,
          source,
          fallbackUsed: fallbackSources.length > 0,
          fallbackSources: fallbackSources.length > 0 ? fallbackSources : undefined,
          cached: false,
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        this.recordFailure(source, errorMessage);
        fallbackSources.push(source);
        continue;
      }
    }

    // All sources failed
    return {
      success: false,
      error: 'All data sources failed',
      source: 'ncaa-api',
      fallbackUsed: true,
      fallbackSources,
      cached: false,
      timestamp: new Date().toISOString(),
      duration_ms: Date.now() - startTime,
    };
  }

  /**
   * Get standings with automatic source fallback
   */
  async getStandings(): Promise<AggregatorResponse<NormalizedStanding[]>> {
    const startTime = Date.now();
    const cacheKey = CollegeBaseballAggregator.CACHE_KEYS.STANDINGS;
    const fallbackSources: DataSource[] = [];

    // Check cache first
    const cached = await this.getFromCache<NormalizedStanding[]>(cacheKey);
    if (cached) {
      return {
        success: true,
        data: cached,
        source: 'ncaa-api',
        fallbackUsed: false,
        cached: true,
        timestamp: new Date().toISOString(),
        duration_ms: Date.now() - startTime,
      };
    }

    const sources = this.getOrderedSources();

    for (const source of sources) {
      try {
        const standings: NormalizedStanding[] = [];
        const now = new Date().toISOString();

        if (source === 'ncaa-api') {
          const response = await this.ncaaClient.getStandings('d1');
          if (response.success && response.data?.conferences) {
            for (const conf of response.data.conferences) {
              for (let i = 0; i < conf.teams.length; i++) {
                const team = conf.teams[i];
                standings.push({
                  teamId: team.teamId,
                  teamName: team.teamName,
                  teamLogo: team.teamLogo,
                  conference: conf.name,
                  overallWins: team.overallWins,
                  overallLosses: team.overallLosses,
                  conferenceWins: team.conferenceWins,
                  conferenceLosses: team.conferenceLosses,
                  winPct: team.winPct,
                  conferenceWinPct: team.conferenceWinPct,
                  streak: team.streak,
                  conferenceRank: i + 1,
                  dataSource: 'ncaa-api',
                  fetchedAt: now,
                });
              }
            }
            this.recordSuccess(source, response.duration_ms);
          } else {
            throw new Error(response.error || 'NCAA API failed');
          }
        } else if (source === 'espn') {
          const response = await this.espnClient.getStandings();
          if (response.success && response.data?.children) {
            for (const conf of response.data.children) {
              const entries = conf.standings?.entries || [];
              for (let i = 0; i < entries.length; i++) {
                const entry = entries[i];
                const stats = entry.stats || [];
                const getStatValue = (name: string): number => {
                  const stat = stats.find((s) => s.name === name || s.abbreviation === name);
                  return stat?.value ?? 0;
                };

                standings.push({
                  teamId: entry.team.abbreviation?.toLowerCase() || entry.team.id,
                  teamName: entry.team.displayName || entry.team.name || '',
                  teamLogo: entry.team.logo,
                  conference: conf.name || '',
                  overallWins: getStatValue('wins'),
                  overallLosses: getStatValue('losses'),
                  conferenceWins: getStatValue('conferenceWins'),
                  conferenceLosses: getStatValue('conferenceLosses'),
                  winPct: getStatValue('winPercent'),
                  conferenceRank: i + 1,
                  dataSource: 'espn',
                  fetchedAt: now,
                });
              }
            }
            this.recordSuccess(source, response.duration_ms);
          } else {
            throw new Error(response.error || 'ESPN API failed');
          }
        } else if (source === 'highlightly' && this.highlightlyClient) {
          const response = await this.highlightlyClient.getNCAStandings();
          if (response.success && response.data) {
            for (const conf of response.data) {
              for (const team of conf.teams) {
                standings.push({
                  teamId: team.team.slug || String(team.team.id),
                  teamName: team.team.name,
                  teamLogo: team.team.logo,
                  conference: conf.conference.name,
                  overallWins: team.wins,
                  overallLosses: team.losses,
                  conferenceWins: team.conferenceWins,
                  conferenceLosses: team.conferenceLosses,
                  winPct: team.winPercentage,
                  conferenceWinPct: team.conferenceWinPercentage,
                  streak: team.streak,
                  lastTen: team.lastTen,
                  gamesBack: team.gamesBack,
                  runsScored: team.runsScored,
                  runsAllowed: team.runsAllowed,
                  runDifferential: team.runDifferential,
                  conferenceRank: team.rank,
                  dataSource: 'highlightly',
                  fetchedAt: now,
                });
              }
            }
            this.recordSuccess(source, response.duration_ms);
          } else {
            throw new Error(response.error || 'Highlightly API failed');
          }
        }

        // Cache the result
        await this.setCache(cacheKey, standings, this.config.cacheTTL.standings);

        return {
          success: true,
          data: standings,
          source,
          fallbackUsed: fallbackSources.length > 0,
          fallbackSources: fallbackSources.length > 0 ? fallbackSources : undefined,
          cached: false,
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        this.recordFailure(source, errorMessage);
        fallbackSources.push(source);
        continue;
      }
    }

    return {
      success: false,
      error: 'All data sources failed',
      source: 'ncaa-api',
      fallbackUsed: true,
      fallbackSources,
      cached: false,
      timestamp: new Date().toISOString(),
      duration_ms: Date.now() - startTime,
    };
  }

  /**
   * Get rankings with automatic source fallback
   */
  async getRankings(): Promise<AggregatorResponse<NormalizedRanking[]>> {
    const startTime = Date.now();
    const cacheKey = CollegeBaseballAggregator.CACHE_KEYS.RANKINGS;
    const fallbackSources: DataSource[] = [];

    // Check cache first
    const cached = await this.getFromCache<NormalizedRanking[]>(cacheKey);
    if (cached) {
      return {
        success: true,
        data: cached,
        source: 'ncaa-api',
        fallbackUsed: false,
        cached: true,
        timestamp: new Date().toISOString(),
        duration_ms: Date.now() - startTime,
      };
    }

    const sources = this.getOrderedSources();

    for (const source of sources) {
      try {
        let rankings: NormalizedRanking[] = [];
        const now = new Date().toISOString();

        if (source === 'ncaa-api') {
          const response = await this.ncaaClient.getRankings('d1');
          if (response.success && response.data?.teams) {
            rankings = response.data.teams.map((team) => ({
              rank: team.rank,
              previousRank: team.previousRank,
              teamId: team.teamId,
              teamName: team.teamName,
              teamLogo: team.teamLogo,
              record: team.record,
              points: team.points,
              firstPlaceVotes: team.firstPlaceVotes,
              pollName: response.data!.pollName,
              week: response.data!.week,
              dataSource: 'ncaa-api' as DataSource,
              fetchedAt: now,
            }));
            this.recordSuccess(source, response.duration_ms);
          } else {
            throw new Error(response.error || 'NCAA API failed');
          }
        } else if (source === 'espn') {
          const response = await this.espnClient.getRankings();
          if (response.success && response.data?.rankings) {
            const poll = response.data.rankings[0]; // First poll
            if (poll?.ranks) {
              rankings = poll.ranks.map((team) => ({
                rank: team.current,
                previousRank: team.previous,
                teamId: team.team.abbreviation?.toLowerCase() || team.team.id,
                teamName: team.team.displayName || team.team.name || '',
                teamLogo: team.team.logo,
                record: team.recordSummary,
                points: team.points,
                firstPlaceVotes: team.firstPlaceVotes,
                pollName: poll.name,
                dataSource: 'espn' as DataSource,
                fetchedAt: now,
              }));
            }
            this.recordSuccess(source, response.duration_ms);
          } else {
            throw new Error(response.error || 'ESPN API failed');
          }
        } else if (source === 'highlightly' && this.highlightlyClient) {
          // Highlightly doesn't have a direct rankings endpoint
          // Fall through to next source
          throw new Error('Highlightly does not support rankings');
        }

        // Cache the result
        await this.setCache(cacheKey, rankings, this.config.cacheTTL.rankings);

        return {
          success: true,
          data: rankings,
          source,
          fallbackUsed: fallbackSources.length > 0,
          fallbackSources: fallbackSources.length > 0 ? fallbackSources : undefined,
          cached: false,
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        this.recordFailure(source, errorMessage);
        fallbackSources.push(source);
        continue;
      }
    }

    return {
      success: false,
      error: 'All data sources failed',
      source: 'ncaa-api',
      fallbackUsed: true,
      fallbackSources,
      cached: false,
      timestamp: new Date().toISOString(),
      duration_ms: Date.now() - startTime,
    };
  }

  /**
   * Get source health status
   */
  getSourceHealth(): SourceHealth[] {
    return Array.from(this.sourceHealth.values());
  }

  /**
   * Check all source health
   */
  async checkAllSourceHealth(): Promise<SourceHealth[]> {
    const checks: Promise<void>[] = [];

    if (this.config.enabledSources.ncaa) {
      checks.push(
        this.ncaaClient.healthCheck().then((result) => {
          if (result.healthy) {
            this.recordSuccess('ncaa-api', result.latency_ms);
          } else {
            this.recordFailure('ncaa-api', result.error || 'Health check failed');
          }
        })
      );
    }

    if (this.config.enabledSources.espn) {
      checks.push(
        this.espnClient.healthCheck().then((result) => {
          if (result.healthy) {
            this.recordSuccess('espn', result.latency_ms);
          } else {
            this.recordFailure('espn', result.error || 'Health check failed');
          }
        })
      );
    }

    if (this.config.enabledSources.highlightly && this.highlightlyClient) {
      checks.push(
        this.highlightlyClient.healthCheck().then((result) => {
          if (result.healthy) {
            this.recordSuccess('highlightly', result.latency_ms);
          } else {
            this.recordFailure('highlightly', result.error || 'Health check failed');
          }
        })
      );
    }

    await Promise.allSettled(checks);

    return this.getSourceHealth();
  }
}

// =============================================================================
// FACTORY FUNCTION
// =============================================================================

/**
 * Create a new College Baseball Data Aggregator instance
 *
 * @param config - Configuration options
 * @returns CollegeBaseballAggregator instance
 */
export function createAggregator(config?: AggregatorConfig): CollegeBaseballAggregator {
  return new CollegeBaseballAggregator(config);
}

// =============================================================================
// DEFAULT EXPORT
// =============================================================================

export default CollegeBaseballAggregator;
