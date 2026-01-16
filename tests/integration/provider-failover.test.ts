/**
 * Provider Failover Integration Tests
 *
 * Tests the circuit breaker pattern and provider failover logic
 * for the data ingestion worker.
 *
 * Run with: npm run test:integration:failover
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

interface ProviderConfig {
  name: string;
  priority: number;
  circuitBreakerThreshold: number;
  resetTimeout: number;
}

interface ProviderStatus {
  name: string;
  available: boolean;
  consecutiveFailures: number;
  lastFailureTime: number | null;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
}

// Mock provider configurations
const PROVIDERS: ProviderConfig[] = [
  {
    name: 'SportsDataIO',
    priority: 1,
    circuitBreakerThreshold: 3,
    resetTimeout: 60000, // 1 minute
  },
  {
    name: 'NCAA_API',
    priority: 2,
    circuitBreakerThreshold: 3,
    resetTimeout: 60000,
  },
  {
    name: 'ESPN',
    priority: 3,
    circuitBreakerThreshold: 5,
    resetTimeout: 120000, // 2 minutes
  },
];

/**
 * Simulates the provider failover logic from workers/ingest/index.ts
 */
class ProviderFailoverSimulator {
  private providers: Map<string, ProviderStatus>;
  private config: ProviderConfig[];

  constructor(config: ProviderConfig[]) {
    this.config = config;
    this.providers = new Map();

    // Initialize provider status
    config.forEach((provider) => {
      this.providers.set(provider.name, {
        name: provider.name,
        available: true,
        consecutiveFailures: 0,
        lastFailureTime: null,
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
      });
    });
  }

  /**
   * Get next available provider in priority order
   */
  getNextProvider(): string | null {
    const now = Date.now();

    // Sort by priority
    const sortedProviders = [...this.config].sort((a, b) => a.priority - b.priority);

    for (const config of sortedProviders) {
      const status = this.providers.get(config.name)!;

      // Check if circuit breaker should reset
      if (!status.available && status.lastFailureTime) {
        const timeSinceFailure = now - status.lastFailureTime;
        if (timeSinceFailure >= config.resetTimeout) {
          status.available = true;
          status.consecutiveFailures = 0;
          status.lastFailureTime = null;
        }
      }

      // Return first available provider
      if (status.available) {
        return config.name;
      }
    }

    return null; // All providers unavailable
  }

  /**
   * Record successful request
   */
  recordSuccess(providerName: string): void {
    const status = this.providers.get(providerName);
    if (!status) return;

    status.totalRequests++;
    status.successfulRequests++;
    status.consecutiveFailures = 0;
    status.available = true;
  }

  /**
   * Record failed request
   */
  recordFailure(providerName: string): void {
    const status = this.providers.get(providerName);
    if (!status) return;

    const config = this.config.find((p) => p.name === providerName)!;

    status.totalRequests++;
    status.failedRequests++;
    status.consecutiveFailures++;
    status.lastFailureTime = Date.now();

    // Trip circuit breaker if threshold exceeded
    if (status.consecutiveFailures >= config.circuitBreakerThreshold) {
      status.available = false;
    }
  }

  /**
   * Get provider statistics
   */
  getStats(): ProviderStatus[] {
    return Array.from(this.providers.values());
  }

  /**
   * Get provider by name
   */
  getProvider(name: string): ProviderStatus | undefined {
    return this.providers.get(name);
  }

  /**
   * Reset all providers (for testing)
   */
  reset(): void {
    this.config.forEach((provider) => {
      this.providers.set(provider.name, {
        name: provider.name,
        available: true,
        consecutiveFailures: 0,
        lastFailureTime: null,
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
      });
    });
  }
}

describe('Provider Failover Logic', () => {
  let simulator: ProviderFailoverSimulator;

  beforeEach(() => {
    simulator = new ProviderFailoverSimulator(PROVIDERS);
  });

  describe('Basic Failover', () => {
    it('should return primary provider when all are available', () => {
      const provider = simulator.getNextProvider();
      expect(provider).toBe('SportsDataIO');
    });

    it('should failover to secondary after primary failures', () => {
      // Simulate 3 failures on primary
      for (let i = 0; i < 3; i++) {
        simulator.recordFailure('SportsDataIO');
      }

      const provider = simulator.getNextProvider();
      expect(provider).toBe('NCAA_API');
    });

    it('should failover through all providers in priority order', () => {
      // Trip SportsDataIO circuit breaker
      for (let i = 0; i < 3; i++) {
        simulator.recordFailure('SportsDataIO');
      }
      expect(simulator.getNextProvider()).toBe('NCAA_API');

      // Trip NCAA_API circuit breaker
      for (let i = 0; i < 3; i++) {
        simulator.recordFailure('NCAA_API');
      }
      expect(simulator.getNextProvider()).toBe('ESPN');

      // Trip ESPN circuit breaker
      for (let i = 0; i < 5; i++) {
        simulator.recordFailure('ESPN');
      }
      expect(simulator.getNextProvider()).toBeNull();
    });
  });

  describe('Circuit Breaker', () => {
    it('should trip circuit breaker after threshold failures', () => {
      const provider = simulator.getProvider('SportsDataIO')!;

      // Before failures
      expect(provider.available).toBe(true);

      // Trip circuit breaker (3 failures)
      simulator.recordFailure('SportsDataIO');
      simulator.recordFailure('SportsDataIO');
      simulator.recordFailure('SportsDataIO');

      // After threshold
      expect(simulator.getProvider('SportsDataIO')!.available).toBe(false);
    });

    it('should reset circuit breaker after timeout', async () => {
      // Trip circuit breaker
      for (let i = 0; i < 3; i++) {
        simulator.recordFailure('SportsDataIO');
      }
      expect(simulator.getProvider('SportsDataIO')!.available).toBe(false);

      // Advance time by 61 seconds (past 60s reset timeout)
      vi.useFakeTimers();
      vi.advanceTimersByTime(61000);

      // Circuit should reset
      const provider = simulator.getNextProvider();
      expect(provider).toBe('SportsDataIO');
      expect(simulator.getProvider('SportsDataIO')!.available).toBe(true);

      vi.useRealTimers();
    });

    it('should respect different reset timeouts per provider', async () => {
      // Trip both SportsDataIO (60s timeout) and ESPN (120s timeout)
      for (let i = 0; i < 3; i++) {
        simulator.recordFailure('SportsDataIO');
      }
      for (let i = 0; i < 5; i++) {
        simulator.recordFailure('ESPN');
      }

      vi.useFakeTimers();

      // After 61s, SportsDataIO should reset but ESPN should not
      vi.advanceTimersByTime(61000);
      expect(simulator.getProvider('SportsDataIO')!.available).toBe(true);
      expect(simulator.getProvider('ESPN')!.available).toBe(false);

      // After another 60s (121s total), ESPN should reset
      vi.advanceTimersByTime(60000);
      expect(simulator.getProvider('ESPN')!.available).toBe(true);

      vi.useRealTimers();
    });
  });

  describe('Success Recovery', () => {
    it('should reset consecutive failures on success', () => {
      // 2 failures (below threshold)
      simulator.recordFailure('SportsDataIO');
      simulator.recordFailure('SportsDataIO');
      expect(simulator.getProvider('SportsDataIO')!.consecutiveFailures).toBe(2);

      // Success resets counter
      simulator.recordSuccess('SportsDataIO');
      expect(simulator.getProvider('SportsDataIO')!.consecutiveFailures).toBe(0);
      expect(simulator.getProvider('SportsDataIO')!.available).toBe(true);
    });

    it('should allow primary to be tried again after recovery', () => {
      // Trip circuit breaker
      for (let i = 0; i < 3; i++) {
        simulator.recordFailure('SportsDataIO');
      }

      // Should failover to NCAA_API
      expect(simulator.getNextProvider()).toBe('NCAA_API');

      // Simulate successful NCAA_API request
      simulator.recordSuccess('NCAA_API');

      // Reset SportsDataIO circuit
      vi.useFakeTimers();
      vi.advanceTimersByTime(61000);

      // Should try SportsDataIO again
      expect(simulator.getNextProvider()).toBe('SportsDataIO');

      vi.useRealTimers();
    });
  });

  describe('Statistics Tracking', () => {
    it('should track total requests per provider', () => {
      simulator.recordSuccess('SportsDataIO');
      simulator.recordSuccess('SportsDataIO');
      simulator.recordFailure('SportsDataIO');

      const stats = simulator.getProvider('SportsDataIO')!;
      expect(stats.totalRequests).toBe(3);
      expect(stats.successfulRequests).toBe(2);
      expect(stats.failedRequests).toBe(1);
    });

    it('should calculate success rate accurately', () => {
      // 7 successes, 3 failures
      for (let i = 0; i < 7; i++) {
        simulator.recordSuccess('SportsDataIO');
      }
      for (let i = 0; i < 3; i++) {
        simulator.recordFailure('NCAA_API');
      }

      const sportsDataIO = simulator.getProvider('SportsDataIO')!;
      const ncaaAPI = simulator.getProvider('NCAA_API')!;

      expect(sportsDataIO.successfulRequests / sportsDataIO.totalRequests).toBe(1.0);
      expect(ncaaAPI.failedRequests / ncaaAPI.totalRequests).toBe(1.0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle all providers being unavailable', () => {
      // Trip all circuit breakers
      for (let i = 0; i < 3; i++) {
        simulator.recordFailure('SportsDataIO');
      }
      for (let i = 0; i < 3; i++) {
        simulator.recordFailure('NCAA_API');
      }
      for (let i = 0; i < 5; i++) {
        simulator.recordFailure('ESPN');
      }

      expect(simulator.getNextProvider()).toBeNull();
    });

    it('should handle rapid successive failures', () => {
      // 10 rapid failures on primary
      for (let i = 0; i < 10; i++) {
        simulator.recordFailure('SportsDataIO');
      }

      const status = simulator.getProvider('SportsDataIO')!;
      expect(status.available).toBe(false);
      expect(status.failedRequests).toBe(10);
    });

    it('should maintain state across multiple failover cycles', () => {
      // Cycle 1: SportsDataIO fails
      for (let i = 0; i < 3; i++) {
        simulator.recordFailure('SportsDataIO');
      }
      expect(simulator.getNextProvider()).toBe('NCAA_API');

      // Cycle 2: NCAA_API fails
      for (let i = 0; i < 3; i++) {
        simulator.recordFailure('NCAA_API');
      }
      expect(simulator.getNextProvider()).toBe('ESPN');

      // Verify accumulated stats
      const stats = simulator.getStats();
      expect(stats.find((s) => s.name === 'SportsDataIO')!.failedRequests).toBe(3);
      expect(stats.find((s) => s.name === 'NCAA_API')!.failedRequests).toBe(3);
    });
  });
});

describe('Production Scenario Simulations', () => {
  let simulator: ProviderFailoverSimulator;

  beforeEach(() => {
    simulator = new ProviderFailoverSimulator(PROVIDERS);
  });

  it('should handle SportsDataIO rate limit scenario', () => {
    // Simulate rate limit (429 responses) - 3 consecutive failures
    for (let i = 0; i < 3; i++) {
      simulator.recordFailure('SportsDataIO');
    }

    // Should failover to NCAA_API
    expect(simulator.getNextProvider()).toBe('NCAA_API');

    // NCAA_API serves successfully for 60 seconds
    vi.useFakeTimers();
    for (let i = 0; i < 10; i++) {
      simulator.recordSuccess('NCAA_API');
    }
    vi.advanceTimersByTime(61000);

    // SportsDataIO circuit should reset
    expect(simulator.getNextProvider()).toBe('SportsDataIO');

    vi.useRealTimers();
  });

  it('should handle NCAA maintenance window', () => {
    // Trip SportsDataIO
    for (let i = 0; i < 3; i++) {
      simulator.recordFailure('SportsDataIO');
    }

    // NCAA_API under maintenance
    for (let i = 0; i < 3; i++) {
      simulator.recordFailure('NCAA_API');
    }

    // Should use ESPN as last resort
    expect(simulator.getNextProvider()).toBe('ESPN');

    // ESPN serves successfully
    for (let i = 0; i < 5; i++) {
      simulator.recordSuccess('ESPN');
    }

    expect(simulator.getProvider('ESPN')!.successfulRequests).toBe(5);
  });

  it('should recover when primary provider returns', () => {
    // Initial failure cascade
    for (let i = 0; i < 3; i++) {
      simulator.recordFailure('SportsDataIO');
    }
    expect(simulator.getNextProvider()).toBe('NCAA_API');

    // NCAA_API serves for a while
    for (let i = 0; i < 20; i++) {
      simulator.recordSuccess('NCAA_API');
    }

    // Time passes, SportsDataIO circuit resets
    vi.useFakeTimers();
    vi.advanceTimersByTime(61000);

    // Should prefer primary again
    expect(simulator.getNextProvider()).toBe('SportsDataIO');

    // Verify SportsDataIO can serve successfully again
    simulator.recordSuccess('SportsDataIO');
    expect(simulator.getProvider('SportsDataIO')!.available).toBe(true);

    vi.useRealTimers();
  });
});
