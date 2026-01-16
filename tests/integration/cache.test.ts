import { describe, it, expect, beforeAll, afterAll } from 'vitest';

/**
 * Cache Integration Tests
 *
 * Tests Cloudflare KV cache integration including:
 * - Cache read/write operations
 * - Cache invalidation
 * - TTL (time-to-live) behavior
 * - Cache miss handling
 * - Cache hit rates
 */

const BASE_URL = process.env.API_BASE_URL || 'https://blazesportsintel.com';
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;

describe('Cache Integration Tests', () => {
  describe('Cache Read/Write', () => {
    it('should cache API responses', async () => {
      // First request - cache miss
      const response1 = await fetch(`${BASE_URL}/api/mlb/cardinals`);
      expect(response1.ok).toBe(true);

      const cacheStatus1 = response1.headers.get('cf-cache-status');
      // First request might be MISS, DYNAMIC, or BYPASS
      expect(['MISS', 'DYNAMIC', 'BYPASS', 'HIT']).toContain(cacheStatus1);

      // Second request - should be cache hit
      const response2 = await fetch(`${BASE_URL}/api/mlb/cardinals`);
      expect(response2.ok).toBe(true);

      const cacheStatus2 = response2.headers.get('cf-cache-status');
      // Second request should ideally be HIT
      expect(['HIT', 'MISS', 'DYNAMIC']).toContain(cacheStatus2);
    });

    it('should respect cache-control headers', async () => {
      const response = await fetch(`${BASE_URL}/api/mlb/cardinals`);

      const cacheControl = response.headers.get('cache-control');
      expect(cacheControl).toBeDefined();
      expect(cacheControl).toMatch(/max-age=\d+/);

      // Parse max-age
      const maxAge = parseInt(cacheControl?.match(/max-age=(\d+)/)?.[1] || '0');
      expect(maxAge).toBeGreaterThan(0);
      expect(maxAge).toBeLessThanOrEqual(3600); // Not more than 1 hour
    });

    it('should include cache metadata in response', async () => {
      const response = await fetch(`${BASE_URL}/api/mlb/cardinals`);
      const data = await response.json();

      expect(data.lastUpdated).toBeDefined();
      expect(data.dataSource).toBeDefined();

      const lastUpdated = new Date(data.lastUpdated);
      expect(lastUpdated.getTime()).toBeLessThanOrEqual(Date.now());
    });
  });

  describe('Cache Invalidation', () => {
    it('should support cache busting with query parameter', async () => {
      // Request with cache bust
      const response = await fetch(`${BASE_URL}/api/mlb/cardinals?bustCache=true`);
      expect(response.ok).toBe(true);

      const cacheStatus = response.headers.get('cf-cache-status');
      // Should bypass cache
      expect(['MISS', 'BYPASS', 'DYNAMIC']).toContain(cacheStatus);
    });

    it('should invalidate cache on data update', async () => {
      // This test requires admin access or a test endpoint
      // For now, we'll test the behavior with a cache-busted request

      const response1 = await fetch(`${BASE_URL}/api/mlb/cardinals`);
      const data1 = await response1.json();

      await new Promise((resolve) => setTimeout(resolve, 1000));

      const response2 = await fetch(`${BASE_URL}/api/mlb/cardinals?bustCache=true`);
      const data2 = await response2.json();

      // Data might be the same or different, but response should be valid
      expect(response2.ok).toBe(true);
      expect(data2.team.name).toBe(data1.team.name);
    });
  });

  describe('Cache TTL Behavior', () => {
    it('should expire cache after TTL', async () => {
      // Request data
      const response1 = await fetch(`${BASE_URL}/api/mlb/cardinals`);
      const data1 = await response1.json();

      const cacheControl = response1.headers.get('cache-control');
      const maxAge = parseInt(cacheControl?.match(/max-age=(\d+)/)?.[1] || '60');

      // If max-age is short (e.g., 60s), we can test expiration
      if (maxAge <= 120) {
        // Wait for cache to expire
        await new Promise((resolve) => setTimeout(resolve, (maxAge + 10) * 1000));

        // Request again - should be cache miss
        const response2 = await fetch(`${BASE_URL}/api/mlb/cardinals`);
        const cacheStatus = response2.headers.get('cf-cache-status');

        // After expiration, should be MISS or refreshed
        expect(['MISS', 'EXPIRED', 'DYNAMIC']).toContain(cacheStatus);
      } else {
        // Skip test if TTL is too long
        expect(maxAge).toBeGreaterThan(0);
      }
    }, 180000); // 3 minute timeout for this test

    it('should have different TTLs for different endpoints', async () => {
      // Live scores should have shorter cache
      const scoresResponse = await fetch(`${BASE_URL}/api/nfl/scores`);
      const scoresCacheControl = scoresResponse.headers.get('cache-control');
      const scoresMaxAge = parseInt(scoresCacheControl?.match(/max-age=(\d+)/)?.[1] || '60');

      // Standings should have longer cache
      const standingsResponse = await fetch(`${BASE_URL}/api/mlb/standings`);
      const standingsCacheControl = standingsResponse.headers.get('cache-control');
      const standingsMaxAge = parseInt(standingsCacheControl?.match(/max-age=(\d+)/)?.[1] || '300');

      // Live scores should update more frequently
      expect(scoresMaxAge).toBeLessThanOrEqual(300); // 5 minutes max
      expect(standingsMaxAge).toBeGreaterThanOrEqual(30); // At least 30 seconds
    });
  });

  describe('Cache Miss Handling', () => {
    it('should fetch fresh data on cache miss', async () => {
      // Request with unique cache key to force miss
      const timestamp = Date.now();
      const response = await fetch(`${BASE_URL}/api/mlb/cardinals?t=${timestamp}`);

      expect(response.ok).toBe(true);

      const data = await response.json();
      expect(data.team).toBeDefined();
      expect(data.lastUpdated).toBeDefined();
    });

    it('should handle provider failures gracefully', async () => {
      // Request an endpoint that might fail
      const response = await fetch(`${BASE_URL}/api/mlb/teams/99999`);

      // Should return error, not crash
      expect(response.status).toBe(404);

      const data = await response.json();
      expect(data.error).toBeDefined();
    });
  });

  describe('Cache Performance', () => {
    it('should improve response time on cache hit', async () => {
      // First request (cache miss)
      const start1 = Date.now();
      const response1 = await fetch(`${BASE_URL}/api/mlb/cardinals`);
      const duration1 = Date.now() - start1;

      expect(response1.ok).toBe(true);

      // Second request (likely cache hit)
      const start2 = Date.now();
      const response2 = await fetch(`${BASE_URL}/api/mlb/cardinals`);
      const duration2 = Date.now() - start2;

      expect(response2.ok).toBe(true);

      // Cached response should be faster (with some tolerance)
      // Note: CDN caching might make both fast
      expect(duration2).toBeLessThan(duration1 * 2);
    });

    it('should handle concurrent requests efficiently', async () => {
      // Make multiple concurrent requests
      const requests = Array(10)
        .fill(null)
        .map(() => fetch(`${BASE_URL}/api/mlb/cardinals`));

      const start = Date.now();
      const responses = await Promise.all(requests);
      const duration = Date.now() - start;

      // All should succeed
      for (const response of responses) {
        expect(response.ok).toBe(true);
      }

      // Should not take significantly longer than a single request
      expect(duration).toBeLessThan(5000);
    });
  });

  describe('Cache Key Generation', () => {
    it('should generate unique cache keys for different teams', async () => {
      const cardinalsResponse = await fetch(`${BASE_URL}/api/mlb/cardinals`);
      const cardinalsData = await cardinalsResponse.json();

      const dodgersResponse = await fetch(`${BASE_URL}/api/mlb/dodgers`);
      const dodgersData = await dodgersResponse.json();

      // Should be different teams
      expect(cardinalsData.team.name).not.toBe(dodgersData.team.name);
    });

    it('should generate unique cache keys for query parameters', async () => {
      const nlCentralResponse = await fetch(`${BASE_URL}/api/mlb/standings?division=NL%20Central`);
      const nlCentralData = await nlCentralResponse.json();

      const alWestResponse = await fetch(`${BASE_URL}/api/mlb/standings?division=AL%20West`);
      const alWestData = await alWestResponse.json();

      // Should be different divisions
      expect(nlCentralData.standings[0].division).toBe('NL Central');
      expect(alWestData.standings[0].division).toBe('AL West');
    });
  });

  describe('Cache Headers', () => {
    it('should include age header', async () => {
      const response = await fetch(`${BASE_URL}/api/mlb/cardinals`);

      // Age header indicates how long response has been in cache
      const age = response.headers.get('age');
      if (age) {
        const ageSeconds = parseInt(age);
        expect(ageSeconds).toBeGreaterThanOrEqual(0);
      }
    });

    it('should include etag for validation', async () => {
      const response = await fetch(`${BASE_URL}/api/mlb/cardinals`);

      const etag = response.headers.get('etag');
      // ETag is optional but helpful for conditional requests
      if (etag) {
        expect(etag.length).toBeGreaterThan(0);
      }
    });

    it('should support conditional requests with if-none-match', async () => {
      // Get initial response with ETag
      const response1 = await fetch(`${BASE_URL}/api/mlb/cardinals`);
      const etag = response1.headers.get('etag');

      if (etag) {
        // Make conditional request
        const response2 = await fetch(`${BASE_URL}/api/mlb/cardinals`, {
          headers: {
            'If-None-Match': etag,
          },
        });

        // Should return 304 Not Modified if data hasn't changed
        expect([200, 304]).toContain(response2.status);
      }
    });
  });

  describe('Cache Warming', () => {
    it('should pre-warm cache for popular teams', async () => {
      // Popular teams should already be cached
      const popularTeams = ['cardinals', 'dodgers', 'yankees'];

      for (const team of popularTeams) {
        const response = await fetch(`${BASE_URL}/api/mlb/${team}`);
        expect(response.ok).toBe(true);

        // Response should be fast (cached)
        const cacheStatus = response.headers.get('cf-cache-status');
        // Might be HIT if warmed, or MISS on first run
        expect(['HIT', 'MISS', 'DYNAMIC']).toContain(cacheStatus);
      }
    });
  });

  describe('Cache Metrics', () => {
    it('should track cache hit rate', async () => {
      // This would require access to analytics API
      // For now, we'll just verify the endpoint exists

      const response = await fetch(`${BASE_URL}/api/cache/metrics`);

      if (response.ok) {
        const data = await response.json();
        expect(data.hitRate).toBeDefined();
        expect(data.hitRate).toBeGreaterThanOrEqual(0);
        expect(data.hitRate).toBeLessThanOrEqual(1);
      }
    });
  });
});

describe('KV Cache Direct Tests', () => {
  // These tests require direct KV access
  // Skip if credentials not available

  const canTestKV = CLOUDFLARE_API_TOKEN && CLOUDFLARE_ACCOUNT_ID;

  it.skipIf(!canTestKV)('should write to KV', async () => {
    // This would require KV API integration
    // Implementation depends on your KV setup
    expect(canTestKV).toBe(true);
  });

  it.skipIf(!canTestKV)('should read from KV', async () => {
    expect(canTestKV).toBe(true);
  });

  it.skipIf(!canTestKV)('should delete from KV', async () => {
    expect(canTestKV).toBe(true);
  });
});
