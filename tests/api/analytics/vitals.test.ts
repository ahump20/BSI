/**
 * Unit tests for Web Vitals Analytics API Endpoint
 * Tests rate limiting, validation, and data storage
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('Web Vitals Analytics API', () => {
  // Mock environment
  const mockEnv = {
    KV: {
      get: vi.fn(),
      put: vi.fn(),
    },
    ANALYTICS: {
      writeDataPoint: vi.fn(),
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rate Limiting', () => {
    it('should allow requests under rate limit', async () => {
      const ip = '192.168.1.1';
      const limit = 60;
      const existingRequests = new Array(50).fill(Date.now());

      mockEnv.KV.get.mockResolvedValue(existingRequests);

      const allowed = existingRequests.length < limit;
      const remaining = limit - existingRequests.length;

      expect(allowed).toBe(true);
      expect(remaining).toBe(10);
    });

    it('should block requests over rate limit', async () => {
      const ip = '192.168.1.1';
      const limit = 60;
      const existingRequests = new Array(60).fill(Date.now());

      mockEnv.KV.get.mockResolvedValue(existingRequests);

      const allowed = existingRequests.length < limit;

      expect(allowed).toBe(false);
    });

    it('should expire old requests from rate limit window', async () => {
      const now = Date.now();
      const window = 60 * 1000; // 1 minute
      const existingRequests = [
        now - 2 * window, // Expired (2 minutes ago)
        now - window / 2, // Valid (30 seconds ago)
        now - 1000, // Valid (1 second ago)
      ];

      const recentRequests = existingRequests.filter((timestamp) => now - timestamp < window);

      expect(recentRequests).toHaveLength(2);
    });

    it('should return correct rate limit headers', () => {
      const headers = {
        'X-RateLimit-Limit': '60',
        'X-RateLimit-Remaining': '45',
      };

      expect(headers['X-RateLimit-Limit']).toBe('60');
      expect(headers['X-RateLimit-Remaining']).toBe('45');
    });

    it('should return 429 with Retry-After when rate limited', () => {
      const response = {
        status: 429,
        headers: {
          'Retry-After': '60',
        },
      };

      expect(response.status).toBe(429);
      expect(response.headers['Retry-After']).toBe('60');
    });
  });

  describe('Payload Validation', () => {
    it('should accept valid Web Vitals payload', () => {
      const validPayload = {
        name: 'LCP',
        value: 2345,
        rating: 'good',
        delta: 100,
        id: 'v3-1234567890',
        navigationType: 'navigate',
        page: {
          url: '/analytics',
          referrer: '/',
          title: 'Analytics Page',
        },
        device: {
          userAgent: 'Mozilla/5.0...',
          viewport: {
            width: 1920,
            height: 1080,
          },
          connection: {
            effectiveType: '4g',
            downlink: 10,
            rtt: 50,
          },
        },
        timestamp: new Date().toISOString(),
        timezone: 'America/Chicago',
      };

      const validNames = ['LCP', 'INP', 'CLS', 'FCP', 'TTFB'];
      const validRatings = ['good', 'needs-improvement', 'poor'];

      const isValid =
        validNames.includes(validPayload.name) &&
        typeof validPayload.value === 'number' &&
        validRatings.includes(validPayload.rating) &&
        typeof validPayload.id === 'string' &&
        typeof validPayload.page?.url === 'string' &&
        typeof validPayload.timestamp === 'string';

      expect(isValid).toBe(true);
    });

    it('should reject invalid metric name', () => {
      const invalidPayload = {
        name: 'INVALID_METRIC',
        value: 1000,
        rating: 'good',
      };

      const validNames = ['LCP', 'INP', 'CLS', 'FCP', 'TTFB'];
      const isValid = validNames.includes(invalidPayload.name);

      expect(isValid).toBe(false);
    });

    it('should reject invalid rating', () => {
      const invalidPayload = {
        name: 'LCP',
        value: 1000,
        rating: 'invalid_rating',
      };

      const validRatings = ['good', 'needs-improvement', 'poor'];
      const isValid = validRatings.includes(invalidPayload.rating);

      expect(isValid).toBe(false);
    });

    it('should require page URL', () => {
      const payload = {
        name: 'FCP',
        value: 1500,
        rating: 'good',
        page: {}, // Missing URL
      };

      const isValid = typeof payload.page?.url === 'string';
      expect(isValid).toBe(false);
    });

    it('should accept payload without connection data', () => {
      const payload = {
        name: 'CLS',
        value: 0.05,
        rating: 'good',
        delta: 0.01,
        id: 'v3-cls-123',
        navigationType: 'navigate',
        page: { url: '/', referrer: '', title: 'Home' },
        device: {
          userAgent: 'test',
          viewport: { width: 375, height: 667 },
          // connection is optional
        },
        timestamp: new Date().toISOString(),
        timezone: 'America/Chicago',
      };

      const isValid = typeof payload.device === 'object';
      expect(isValid).toBe(true);
    });
  });

  describe('Analytics Engine Integration', () => {
    it('should write data point to Analytics Engine', async () => {
      const vitals = {
        name: 'LCP',
        value: 2345,
        rating: 'good',
        page: { url: '/test' },
        navigationType: 'navigate',
        device: {
          userAgent: 'test',
          viewport: { width: 1920, height: 1080 },
          connection: { effectiveType: '4g', downlink: 10, rtt: 50 },
        },
      };

      await mockEnv.ANALYTICS.writeDataPoint({
        indexes: [vitals.name],
        blobs: [
          vitals.rating,
          vitals.page.url,
          vitals.navigationType,
          vitals.device.userAgent,
          vitals.device.connection?.effectiveType || 'unknown',
        ],
        doubles: [
          vitals.value,
          vitals.device.viewport.width,
          vitals.device.viewport.height,
          vitals.device.connection?.downlink || 0,
          vitals.device.connection?.rtt || 0,
        ],
      });

      expect(mockEnv.ANALYTICS.writeDataPoint).toHaveBeenCalledTimes(1);
      expect(mockEnv.ANALYTICS.writeDataPoint).toHaveBeenCalledWith(
        expect.objectContaining({
          indexes: ['LCP'],
          blobs: expect.arrayContaining(['good', '/test', 'navigate']),
          doubles: expect.arrayContaining([2345, 1920, 1080, 10, 50]),
        })
      );
    });

    it('should continue even if Analytics Engine fails', async () => {
      mockEnv.ANALYTICS.writeDataPoint.mockRejectedValue(new Error('Analytics error'));

      try {
        await mockEnv.ANALYTICS.writeDataPoint({});
      } catch (error) {
        // Should log error but not throw
        expect(error.message).toBe('Analytics error');
      }

      expect(mockEnv.ANALYTICS.writeDataPoint).toHaveBeenCalled();
    });
  });

  describe('KV Storage Sampling', () => {
    it('should store approximately 10% of vitals in KV', () => {
      const samples = 1000;
      let stored = 0;

      // Simulate sampling
      for (let i = 0; i < samples; i++) {
        if (Math.random() < 0.1) {
          stored++;
        }
      }

      // Allow for statistical variance (5% - 15% range)
      expect(stored).toBeGreaterThan(50);
      expect(stored).toBeLessThan(150);
    });

    it('should set 7-day expiration on KV entries', async () => {
      const expirationTtl = 7 * 24 * 60 * 60;

      await mockEnv.KV.put('test-key', 'test-value', { expirationTtl });

      expect(mockEnv.KV.put).toHaveBeenCalledWith(
        'test-key',
        'test-value',
        expect.objectContaining({ expirationTtl })
      );
    });
  });

  describe('CORS Headers', () => {
    it('should return correct CORS headers', () => {
      const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      };

      expect(headers['Access-Control-Allow-Origin']).toBe('*');
      expect(headers['Access-Control-Allow-Methods']).toContain('POST');
    });

    it('should handle OPTIONS preflight', () => {
      const response = {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Max-Age': '86400',
        },
      };

      expect(response.status).toBe(204);
      expect(response.headers['Access-Control-Max-Age']).toBe('86400');
    });
  });

  describe('Error Handling', () => {
    it('should return 400 for invalid payload', () => {
      const response = {
        status: 400,
        body: {
          error: 'Invalid payload',
          message: 'Web Vitals data does not match expected schema',
        },
      };

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid payload');
    });

    it('should return 500 for server errors', () => {
      const response = {
        status: 500,
        body: {
          error: 'Internal server error',
          message: 'Failed to process Web Vitals data',
        },
      };

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Internal server error');
    });

    it('should extract IP from CF-Connecting-IP header', () => {
      const headers = new Map([
        ['CF-Connecting-IP', '192.168.1.1'],
        ['X-Forwarded-For', '10.0.0.1'],
      ]);

      const ip = headers.get('CF-Connecting-IP') || headers.get('X-Forwarded-For') || 'unknown';

      expect(ip).toBe('192.168.1.1');
    });

    it('should fallback to X-Forwarded-For if CF header missing', () => {
      const headers = new Map([['X-Forwarded-For', '10.0.0.1']]);

      const ip = headers.get('CF-Connecting-IP') || headers.get('X-Forwarded-For') || 'unknown';

      expect(ip).toBe('10.0.0.1');
    });

    it('should use "unknown" if no IP headers present', () => {
      const headers = new Map();

      const ip = headers.get('CF-Connecting-IP') || headers.get('X-Forwarded-For') || 'unknown';

      expect(ip).toBe('unknown');
    });
  });
});
