/**
 * Provider Manager with Failover Logic
 *
 * Orchestrates data fetching with automatic failover:
 * 1. SportsDataIO (primary)
 * 2. NCAA API (backup)
 * 3. ESPN API (tertiary)
 *
 * Implements circuit breaker pattern to avoid cascading failures.
 */

import { SportsDataIOAdapter } from './sports-data-io';
import { NCAAAPIAdapter } from './ncaa-api';
import { ESPNAPIAdapter } from './espn-api';
import type {
  Env,
  GamesQueryParams,
  TeamStatsQueryParams,
  ProviderGame,
  ProviderTeamStats
} from '../../workers/ingest/types';
import type { PrismaClient } from '@prisma/client/edge';

interface CircuitBreakerState {
  failures: number;
  lastFailure: number | null;
  isOpen: boolean;
}

export class ProviderManager {
  private sportsDataIO: SportsDataIOAdapter;
  private ncaaAPI: NCAAAPIAdapter;
  private espnAPI: ESPNAPIAdapter;

  // Circuit breaker state for each provider
  private circuitBreakers: Map<string, CircuitBreakerState>;

  // Circuit breaker thresholds
  private static readonly FAILURE_THRESHOLD = 3; // Open circuit after 3 failures
  private static readonly RESET_TIMEOUT = 60000; // Reset after 60 seconds

  constructor(env: Env, private readonly prisma: PrismaClient) {
    this.sportsDataIO = new SportsDataIOAdapter(env.SPORTSDATA_API_KEY);
    this.ncaaAPI = new NCAAAPIAdapter(env.NCAA_API_KEY);
    this.espnAPI = new ESPNAPIAdapter(env.ESPN_API_KEY);

    this.circuitBreakers = new Map([
      ['sportsDataIO', { failures: 0, lastFailure: null, isOpen: false }],
      ['ncaaAPI', { failures: 0, lastFailure: null, isOpen: false }],
      ['espnAPI', { failures: 0, lastFailure: null, isOpen: false }]
    ]);
  }

  /**
   * Fetch games with automatic failover
   */
  async getGames(params: GamesQueryParams): Promise<ProviderGame[]> {
    const providers: Array<{
      name: string;
      adapter: SportsDataIOAdapter | NCAAAPIAdapter | ESPNAPIAdapter;
    }> = [
      { name: 'sportsDataIO', adapter: this.sportsDataIO },
      { name: 'ncaaAPI', adapter: this.ncaaAPI },
      { name: 'espnAPI', adapter: this.espnAPI }
    ];

    for (const { name, adapter } of providers) {
      // Check circuit breaker
      if (this.isCircuitOpen(name)) {
        console.warn(`[ProviderManager] Circuit breaker open for ${name}, skipping`);
        continue;
      }

      try {
        console.log(`[ProviderManager] Attempting to fetch games from ${name}...`);

        const games = await adapter.getGames(params);

        // Success - reset circuit breaker
        this.recordSuccess(name);

        console.log(`[ProviderManager] Successfully fetched ${games.length} games from ${name}`);
        await this.ensureTeamsForGames(games);
        return games;
      } catch (error) {
        console.error(`[ProviderManager] ${name} failed:`, error);

        // Record failure
        this.recordFailure(name);

        // Continue to next provider
        continue;
      }
    }

    // All providers failed
    throw new Error('[ProviderManager] All providers failed to fetch games');
  }

  /**
   * Ensure teams referenced by provider games exist in the database.
   * Returns a mapping of provider IDs to internal IDs (currently identical but future-proofed).
   */
  async ensureTeamsForGames(games: ProviderGame[]): Promise<Map<string, string>> {
    const identifiers = new Map<string, { name: string; slug?: string }>();

    for (const game of games) {
      if (game.homeTeamId) {
        identifiers.set(game.homeTeamId, {
          name: game.homeTeamName || `Team ${game.homeTeamId}`,
          slug: game.homeTeamSlug,
        });
      }
      if (game.awayTeamId) {
        identifiers.set(game.awayTeamId, {
          name: game.awayTeamName || `Team ${game.awayTeamId}`,
          slug: game.awayTeamSlug,
        });
      }
    }

    if (identifiers.size === 0) {
      return new Map();
    }

    const providerIds = Array.from(identifiers.keys());

    const existing = await this.prisma.team.findMany({
      where: { id: { in: providerIds } },
      select: { id: true },
    });

    const existingIds = new Set(existing.map((team) => team.id));
    const resolved = new Map<string, string>();

    await Promise.all(
      providerIds.map(async (providerId) => {
        const identity = identifiers.get(providerId)!;

        if (existingIds.has(providerId)) {
          resolved.set(providerId, providerId);
          return;
        }

        const slug = identity.slug ?? this.generateSlug(identity.name, providerId);
        const abbreviation = identity.name
          .replace(/[^A-Z]/g, '')
          .slice(0, 3)
          .toUpperCase() || providerId.slice(0, 3).toUpperCase();

        const record = await this.prisma.team.upsert({
          where: { id: providerId },
          update: {
            name: identity.name,
            slug,
            abbreviation,
            sport: 'BASEBALL',
          },
          create: {
            id: providerId,
            slug,
            name: identity.name,
            nickname: identity.name,
            school: identity.name,
            abbreviation,
            sport: 'BASEBALL',
            division: 'D1',
          },
        });

        resolved.set(providerId, record.id);
      })
    );

    return resolved;
  }

  private generateSlug(name: string, fallback: string): string {
    const base = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '')
      .replace(/-{2,}/g, '-');

    if (base.length === 0) {
      return `team-${fallback.toLowerCase()}`;
    }

    return base;
  }

  /**
   * Fetch team stats with automatic failover
   */
  async getTeamStats(params: TeamStatsQueryParams): Promise<ProviderTeamStats> {
    const providers: Array<{
      name: string;
      adapter: SportsDataIOAdapter | NCAAAPIAdapter | ESPNAPIAdapter;
    }> = [
      { name: 'sportsDataIO', adapter: this.sportsDataIO },
      { name: 'ncaaAPI', adapter: this.ncaaAPI },
      { name: 'espnAPI', adapter: this.espnAPI }
    ];

    for (const { name, adapter } of providers) {
      // Check circuit breaker
      if (this.isCircuitOpen(name)) {
        console.warn(`[ProviderManager] Circuit breaker open for ${name}, skipping`);
        continue;
      }

      try {
        console.log(`[ProviderManager] Attempting to fetch team stats from ${name}...`);

        const stats = await adapter.getTeamStats(params);

        // Success - reset circuit breaker
        this.recordSuccess(name);

        console.log(`[ProviderManager] Successfully fetched team stats from ${name}`);
        return stats;
      } catch (error) {
        console.error(`[ProviderManager] ${name} failed:`, error);

        // Record failure
        this.recordFailure(name);

        // Continue to next provider
        continue;
      }
    }

    // All providers failed
    throw new Error('[ProviderManager] All providers failed to fetch team stats');
  }

  /**
   * Check if circuit breaker is open for a provider
   */
  private isCircuitOpen(providerName: string): boolean {
    const breaker = this.circuitBreakers.get(providerName);
    if (!breaker) return false;

    // If circuit is open, check if reset timeout has passed
    if (breaker.isOpen && breaker.lastFailure) {
      const elapsed = Date.now() - breaker.lastFailure;
      if (elapsed > ProviderManager.RESET_TIMEOUT) {
        // Reset circuit breaker
        breaker.isOpen = false;
        breaker.failures = 0;
        breaker.lastFailure = null;
        console.log(`[ProviderManager] Circuit breaker reset for ${providerName}`);
        return false;
      }
    }

    return breaker.isOpen;
  }

  /**
   * Record a successful request
   */
  private recordSuccess(providerName: string): void {
    const breaker = this.circuitBreakers.get(providerName);
    if (!breaker) return;

    // Reset failures
    breaker.failures = 0;
    breaker.lastFailure = null;
    breaker.isOpen = false;
  }

  /**
   * Record a failed request
   */
  private recordFailure(providerName: string): void {
    const breaker = this.circuitBreakers.get(providerName);
    if (!breaker) return;

    breaker.failures++;
    breaker.lastFailure = Date.now();

    // Open circuit if threshold reached
    if (breaker.failures >= ProviderManager.FAILURE_THRESHOLD) {
      breaker.isOpen = true;
      console.warn(
        `[ProviderManager] Circuit breaker opened for ${providerName} after ${breaker.failures} failures`
      );
    }
  }

  /**
   * Get circuit breaker status for monitoring
   */
  getCircuitBreakerStatus(): Record<string, CircuitBreakerState> {
    const status: Record<string, CircuitBreakerState> = {};

    this.circuitBreakers.forEach((breaker, name) => {
      status[name] = { ...breaker };
    });

    return status;
  }
}
