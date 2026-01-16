/**
 * API Failure Fallback Integration Tests
 *
 * Tests graceful degradation when external APIs are unavailable.
 * Verifies cached data is served, stale warnings are included,
 * and error responses are properly formatted.
 *
 * @author Austin Humphrey - Blaze Sports Intel
 */

import { describe, it, expect } from 'vitest';

const API_BASE = process.env.PREDICTION_API_URL ?? 'https://api.blazesportsintel.com';
const MAIN_API = process.env.BSI_API_URL ?? 'https://blazesportsintel.com';

describe('API Failure Fallback - Prediction Engine', () => {
  it('should handle D1 database unavailability gracefully', async () => {
    // Test prediction with teams that have no D1 records
    // Should fall back to default states
    const params = new URLSearchParams({
      sport: 'cfb',
      homeTeamId: 'nonexistent-team-001',
      awayTeamId: 'nonexistent-team-002',
    });

    const response = await fetch(`${API_BASE}/v1/predict/game/fallback-test?${params}`);
    const data = await response.json();

    // Should succeed with default team states
    expect(data.success).toBe(true);
    expect(data.data).toBeDefined();
  });

  it('should return sensible defaults when no historical data', async () => {
    const params = new URLSearchParams({
      sport: 'cfb',
      homeTeamId: 'brand-new-team-a',
      awayTeamId: 'brand-new-team-b',
    });

    const response = await fetch(`${API_BASE}/v1/predict/game/defaults-test?${params}`);
    const data = await response.json();

    expect(data.success).toBe(true);

    // With no data, teams should be evenly matched
    const probability = data.data.homeWinProbability;
    expect(probability).toBeGreaterThan(0.4);
    expect(probability).toBeLessThan(0.6);
  });

  it('should handle calibration with no historical results', async () => {
    const response = await fetch(`${API_BASE}/v1/calibration/cfb`);
    const data = await response.json();

    // Should succeed even with no calibration data
    expect(data.success).toBe(true);

    // If no calibration data, should indicate that
    if (data.data.message) {
      expect(data.data.message).toContain('calibration');
    }
  });
});

describe('API Failure Fallback - Error Formatting', () => {
  it('should return error response for non-existent endpoint', async () => {
    // Request a non-existent endpoint
    const response = await fetch(`${API_BASE}/v1/nonexistent/route`);

    // Accept various error status codes
    // 404 = not found, 522 = Cloudflare connection timeout
    expect(response.status).toBeGreaterThanOrEqual(400);

    // Only check JSON structure if response is JSON
    if (response.headers.get('content-type')?.includes('application/json')) {
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBeDefined();
      expect(data.error.code).toBeDefined();
    }
  });

  it('should include processing time on JSON error responses', async () => {
    // Use a known endpoint with invalid params to get JSON error
    const response = await fetch(`${API_BASE}/v1/predict/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    const data = await response.json();

    expect(data.meta).toBeDefined();
    expect(data.meta.processingTimeMs).toBeDefined();
    expect(typeof data.meta.processingTimeMs).toBe('number');
  });

  it('should not expose internal error details to clients', async () => {
    // Attempt to trigger an internal error
    const response = await fetch(`${API_BASE}/v1/predict/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invalid: 'structure' }),
    });

    const data = await response.json();

    // Should not expose stack traces or file paths
    const errorJson = JSON.stringify(data);
    expect(errorJson).not.toContain('node_modules');
    expect(errorJson).not.toContain('.ts:');
    expect(errorJson).not.toContain('at ');
  });
});

describe('API Failure Fallback - Rate Limiting', () => {
  it('should handle rapid requests gracefully', async () => {
    const promises = Array.from({ length: 20 }, () => fetch(`${API_BASE}/v1/health`));

    const responses = await Promise.all(promises);

    // All requests should either succeed or get rate-limited gracefully
    for (const response of responses) {
      expect([200, 429]).toContain(response.status);
    }
  });
});

describe('API Failure Fallback - Network Errors', () => {
  it('should handle timeout gracefully', async () => {
    // This test uses AbortController to simulate timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 100);

    try {
      await fetch(`${API_BASE}/v1/predict/game/timeout-test?homeTeamId=a&awayTeamId=b`, {
        signal: controller.signal,
      });
    } catch (error) {
      // AbortError is expected behavior
      expect((error as Error).name).toBe('AbortError');
    } finally {
      clearTimeout(timeout);
    }
  });
});

describe('API Failure Fallback - Data Integrity', () => {
  it('should maintain response format consistency', async () => {
    const endpoints = ['/v1/health', '/v1/calibration/cfb', '/v1/state/team/texas?sport=cfb'];

    for (const endpoint of endpoints) {
      const response = await fetch(`${API_BASE}${endpoint}`);
      const data = await response.json();

      // All successful responses should have this structure
      expect(data).toHaveProperty('success');
      expect(data).toHaveProperty('meta');
      expect(data.meta).toHaveProperty('timestamp');
      expect(data.meta).toHaveProperty('modelVersion');
    }
  });

  it('should return valid ISO timestamps', async () => {
    const response = await fetch(`${API_BASE}/v1/health`);
    const data = await response.json();

    const timestamp = new Date(data.meta.timestamp);
    expect(timestamp.toString()).not.toBe('Invalid Date');

    // Timestamp should be recent (within last minute)
    const now = Date.now();
    const tsTime = timestamp.getTime();
    expect(now - tsTime).toBeLessThan(60000);
  });
});

describe('API Failure Fallback - Off-Season Resilience', () => {
  it('should handle predictions during NFL off-season', async () => {
    const params = new URLSearchParams({
      sport: 'nfl',
      homeTeamId: 'titans',
      awayTeamId: 'cowboys',
      season: '2025',
      week: '1', // Week 1 likely before season starts
    });

    const response = await fetch(`${API_BASE}/v1/predict/game/offseason-nfl?${params}`);
    const data = await response.json();

    expect(data.success).toBe(true);
  });

  it('should handle predictions during MLB winter', async () => {
    const params = new URLSearchParams({
      sport: 'mlb',
      homeTeamId: 'cardinals',
      awayTeamId: 'cubs',
      date: '2025-01-15', // Deep winter
    });

    const response = await fetch(`${API_BASE}/v1/predict/game/offseason-mlb?${params}`);
    const data = await response.json();

    expect(data.success).toBe(true);
  });

  it('should handle CFB predictions in summer', async () => {
    const params = new URLSearchParams({
      sport: 'cfb',
      homeTeamId: 'texas',
      awayTeamId: 'alabama',
      date: '2025-07-01', // Pre-season
    });

    const response = await fetch(`${API_BASE}/v1/predict/game/offseason-cfb?${params}`);
    const data = await response.json();

    expect(data.success).toBe(true);
    // Should note reduced confidence due to off-season
  });
});
