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
import { logger } from '../utils/logger';
import type {
  Env,
  GamesQueryParams,
  TeamStatsQueryParams,
  ProviderGame,
  ProviderTeamStats,
} from '../../workers/ingest/types';

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

  constructor(env: Env) {
    this.sportsDataIO = new SportsDataIOAdapter(env.SPORTSDATA_API_KEY);
    this.ncaaAPI = new NCAAAPIAdapter(env.NCAA_API_KEY);
    this.espnAPI = new ESPNAPIAdapter(env.ESPN_API_KEY);

    this.circuitBreakers = new Map([
      ['sportsDataIO', { failures: 0, lastFailure: null, isOpen: false }],
      ['ncaaAPI', { failures: 0, lastFailure: null, isOpen: false }],
      ['espnAPI', { failures: 0, lastFailure: null, isOpen: false }],
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
      { name: 'espnAPI', adapter: this.espnAPI },
    ];

    for (const { name, adapter } of providers) {
      // Check circuit breaker
      if (this.isCircuitOpen(name)) {
        logger.warn({ provider: name }, 'Circuit breaker open, skipping provider');
        continue;
      }

      try {
        logger.debug({ provider: name }, 'Attempting to fetch games');

        const games = await adapter.getGames(params);

        // Success - reset circuit breaker
        this.recordSuccess(name);

        logger.info({ provider: name, count: games.length }, 'Successfully fetched games');
        return games;
      } catch (error) {
        logger.error({ provider: name, error }, 'Provider failed');

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
   * Fetch team stats with automatic failover
   */
  async getTeamStats(params: TeamStatsQueryParams): Promise<ProviderTeamStats> {
    const providers: Array<{
      name: string;
      adapter: SportsDataIOAdapter | NCAAAPIAdapter | ESPNAPIAdapter;
    }> = [
      { name: 'sportsDataIO', adapter: this.sportsDataIO },
      { name: 'ncaaAPI', adapter: this.ncaaAPI },
      { name: 'espnAPI', adapter: this.espnAPI },
    ];

    for (const { name, adapter } of providers) {
      // Check circuit breaker
      if (this.isCircuitOpen(name)) {
        logger.warn({ provider: name }, 'Circuit breaker open, skipping provider');
        continue;
      }

      try {
        logger.debug({ provider: name }, 'Attempting to fetch team stats');

        const stats = await adapter.getTeamStats(params);

        // Success - reset circuit breaker
        this.recordSuccess(name);

        logger.info({ provider: name }, 'Successfully fetched team stats');
        return stats;
      } catch (error) {
        logger.error({ provider: name, error }, 'Provider failed');

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
        logger.debug({ provider: providerName }, 'Circuit breaker reset');
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
      logger.warn({ provider: providerName, failures: breaker.failures }, 'Circuit breaker opened');
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
