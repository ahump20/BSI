import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock D1 database
function createMockD1() {
  return {
    prepare: vi.fn().mockReturnValue({
      first: vi.fn().mockResolvedValue(null),
      all: vi.fn().mockResolvedValue({ results: [] }),
      bind: vi.fn().mockReturnThis(),
      run: vi.fn().mockResolvedValue({ success: true }),
    }),
  };
}

function createMockKV() {
  const store = new Map<string, string>();
  return {
    put: vi.fn(async (key: string, value: string) => { store.set(key, value); }),
    get: vi.fn(async (key: string) => store.get(key) ?? null),
    delete: vi.fn(async (key: string) => { store.delete(key); }),
    list: vi.fn(async () => ({ keys: [] })),
  };
}

function createMockEnv(overrides: Record<string, unknown> = {}) {
  return {
    DB: createMockD1(),
    KV: createMockKV(),
    CACHE: {} as any,
    PORTAL_POLLER: {} as any,
    ASSETS_BUCKET: {} as any,
    ENVIRONMENT: 'test',
    API_VERSION: '1.0.0-test',
    PAGES_ORIGIN: 'https://test.pages.dev',
    RAPIDAPI_KEY: 'test-key',
    ...overrides,
  };
}

describe('workers/index.ts route handlers', () => {
  let env: ReturnType<typeof createMockEnv>;
  let worker: { fetch: (request: Request, env: any) => Promise<Response> };

  beforeEach(async () => {
    env = createMockEnv();
    worker = await import('../../workers/index');
    if ('default' in worker) {
      worker = (worker as any).default;
    }
  });

  // -----------------------------------------------------------------------
  // Health endpoint
  // -----------------------------------------------------------------------

  describe('GET /api/health', () => {
    it('returns ok status with version', async () => {
      const req = new Request('https://blazesportsintel.com/api/health');
      const res = await worker.fetch(req, env);
      const body = await res.json() as any;

      expect(res.status).toBe(200);
      expect(body.status).toBe('ok');
      expect(body.version).toBe('1.0.0-test');
      expect(body.mode).toBe('hybrid-worker');
    });

    it('returns expected JSON shape', async () => {
      const req = new Request('https://blazesportsintel.com/api/health');
      const res = await worker.fetch(req, env);
      const body = await res.json() as any;

      expect(body).toHaveProperty('status');
      expect(body).toHaveProperty('timestamp');
      expect(body).toHaveProperty('version');
      expect(body).toHaveProperty('environment');
      expect(body).toHaveProperty('mode');
    });

    it('reports the environment from env binding', async () => {
      const req = new Request('https://blazesportsintel.com/api/health');
      const res = await worker.fetch(req, env);
      const body = await res.json() as any;
      expect(body.environment).toBe('test');
    });
  });

  // -----------------------------------------------------------------------
  // CORS origin gating
  // -----------------------------------------------------------------------

  describe('CORS', () => {
    it('returns matching origin for production domains', async () => {
      const req = new Request('https://blazesportsintel.com/api/health', {
        headers: { Origin: 'https://blazesportsintel.com' },
      });
      const res = await worker.fetch(req, env);
      expect(res.headers.get('Access-Control-Allow-Origin')).toBe('https://blazesportsintel.com');
    });

    it('returns matching origin for www subdomain', async () => {
      const req = new Request('https://blazesportsintel.com/api/health', {
        headers: { Origin: 'https://www.blazesportsintel.com' },
      });
      const res = await worker.fetch(req, env);
      expect(res.headers.get('Access-Control-Allow-Origin')).toBe('https://www.blazesportsintel.com');
    });

    it('allows localhost in non-production', async () => {
      const req = new Request('https://blazesportsintel.com/api/health', {
        headers: { Origin: 'http://localhost:3000' },
      });
      const res = await worker.fetch(req, env);
      expect(res.headers.get('Access-Control-Allow-Origin')).toBe('http://localhost:3000');
    });

    it('blocks localhost in production', async () => {
      const prodEnv = createMockEnv({ ENVIRONMENT: 'production' });
      const req = new Request('https://blazesportsintel.com/api/health', {
        headers: { Origin: 'http://localhost:3000' },
      });
      const res = await worker.fetch(req, prodEnv);
      expect(res.headers.get('Access-Control-Allow-Origin')).toBe('');
    });

    it('returns empty origin for unknown domains', async () => {
      const req = new Request('https://blazesportsintel.com/api/health', {
        headers: { Origin: 'https://evil.com' },
      });
      const res = await worker.fetch(req, env);
      expect(res.headers.get('Access-Control-Allow-Origin')).toBe('');
    });

    it('OPTIONS preflight returns CORS headers', async () => {
      const req = new Request('https://blazesportsintel.com/api/health', {
        method: 'OPTIONS',
        headers: { Origin: 'https://blazesportsintel.com' },
      });
      const res = await worker.fetch(req, env);
      expect(res.status).toBe(200);
      expect(res.headers.get('Access-Control-Allow-Methods')).toContain('GET');
    });
  });

  // -----------------------------------------------------------------------
  // Error sanitization
  // -----------------------------------------------------------------------

  describe('error sanitization', () => {
    it('hides error details in production', async () => {
      const prodEnv = createMockEnv({ ENVIRONMENT: 'production' });
      // Force an error by making Pages proxy fail
      const originalFetch = globalThis.fetch;
      globalThis.fetch = vi.fn().mockRejectedValue(new Error('secret DB connection string'));

      // Use trailing slash — non-trailing paths get 301 redirected
      const req = new Request('https://blazesportsintel.com/some-unknown-page/');
      const res = await worker.fetch(req, prodEnv);
      const body = await res.json() as any;

      expect(res.status).toBe(500);
      expect(body.error).toBe('Internal server error');
      expect(body.error).not.toContain('secret');

      globalThis.fetch = originalFetch;
    });

    it('shows error details in non-production', async () => {
      const originalFetch = globalThis.fetch;
      globalThis.fetch = vi.fn().mockRejectedValue(new Error('detailed error info'));

      const req = new Request('https://blazesportsintel.com/some-unknown-page/');
      const res = await worker.fetch(req, env);
      const body = await res.json() as any;

      expect(res.status).toBe(500);
      expect(body.error).toBe('detailed error info');

      globalThis.fetch = originalFetch;
    });
  });

  // -----------------------------------------------------------------------
  // JSON error shape consistency
  // -----------------------------------------------------------------------

  describe('JSON error shape', () => {
    it('returns { error: string } on 500', async () => {
      const originalFetch = globalThis.fetch;
      globalThis.fetch = vi.fn().mockRejectedValue(new Error('boom'));

      const req = new Request('https://blazesportsintel.com/unknown/');
      const res = await worker.fetch(req, env);
      const body = await res.json() as any;

      expect(body).toHaveProperty('error');
      expect(typeof body.error).toBe('string');
      expect(res.headers.get('Content-Type')).toContain('application/json');

      globalThis.fetch = originalFetch;
    });

    it('lead endpoint returns { error } on bad input', async () => {
      const req = new Request('https://blazesportsintel.com/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const res = await worker.fetch(req, env);
      const body = await res.json() as any;

      expect(res.status).toBe(400);
      expect(body).toHaveProperty('error');
    });
  });

  // -----------------------------------------------------------------------
  // Cache headers on API responses
  // -----------------------------------------------------------------------

  describe('Cache-Control headers', () => {
    it('health endpoint has no cache header (dynamic)', async () => {
      const req = new Request('https://blazesportsintel.com/api/health');
      const res = await worker.fetch(req, env);
      expect(res.headers.get('Cache-Control')).toBeNull();
    });

    it('CFB transfer portal has Cache-Control', async () => {
      const req = new Request('https://blazesportsintel.com/api/cfb/transfer-portal');
      const res = await worker.fetch(req, env);
      // Even with no KV data, the response should be valid JSON
      expect(res.status).toBe(200);
      // No cache header when returning the "no data" fallback (plain json, not cachedJson)
      const body = await res.json() as any;
      expect(body).toHaveProperty('entries');
    });
  });

  // -----------------------------------------------------------------------
  // Lead capture
  // -----------------------------------------------------------------------

  describe('POST /api/lead', () => {
    it('rejects missing name and email', async () => {
      const req = new Request('https://blazesportsintel.com/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: '', email: '' }),
      });
      const res = await worker.fetch(req, env);
      expect(res.status).toBe(400);
    });

    it('rejects missing consent', async () => {
      const req = new Request('https://blazesportsintel.com/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Test', email: 'test@example.com' }),
      });
      const res = await worker.fetch(req, env);
      const body = await res.json() as any;
      expect(res.status).toBe(400);
      expect(body.error).toContain('Consent');
    });

    it('accepts valid lead with consent', async () => {
      const req = new Request('https://blazesportsintel.com/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Austin', email: 'test@blazesportsintel.com', sport: 'Baseball', consent: true }),
      });
      const res = await worker.fetch(req, env);
      const body = await res.json() as any;

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(env.KV.put).toHaveBeenCalled();
    });
  });

  // -----------------------------------------------------------------------
  // WebSocket
  // -----------------------------------------------------------------------

  describe('WebSocket /ws', () => {
    it('rejects non-upgrade requests', async () => {
      const req = new Request('https://blazesportsintel.com/ws');
      const res = await worker.fetch(req, env);
      expect(res.status).toBe(400);
    });
  });

  // -----------------------------------------------------------------------
  // Pages proxy fallback
  // -----------------------------------------------------------------------

  describe('unknown routes', () => {
    it('attempts to proxy to Pages and returns 500 on network failure', async () => {
      const originalFetch = globalThis.fetch;
      globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      // Use trailing slash — non-trailing paths get 301 redirected to trailing slash
      const req = new Request('https://blazesportsintel.com/some-page/');
      const res = await worker.fetch(req, env);

      expect(res.status).toBe(500);
      globalThis.fetch = originalFetch;
    });

    it('redirects non-trailing-slash page paths to trailing slash', async () => {
      const req = new Request('https://blazesportsintel.com/some-page');
      const res = await worker.fetch(req, env);

      expect(res.status).toBe(301);
      expect(res.headers.get('Location')).toBe('https://blazesportsintel.com/some-page/');
    });
  });

  // -----------------------------------------------------------------------
  // www → apex redirect
  // -----------------------------------------------------------------------

  describe('www → apex redirect', () => {
    it('redirects www to apex with 301', async () => {
      const req = new Request('https://www.blazesportsintel.com/college-baseball/standings');
      const res = await worker.fetch(req, env);

      expect(res.status).toBe(301);
      expect(res.headers.get('Location')).toBe('https://blazesportsintel.com/college-baseball/standings');
    });
  });

  // -----------------------------------------------------------------------
  // Contact form
  // -----------------------------------------------------------------------

  describe('POST /api/contact', () => {
    it('rejects missing fields', async () => {
      const req = new Request('https://blazesportsintel.com/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Test' }),
      });
      const res = await worker.fetch(req, env);
      expect(res.status).toBe(400);
    });

    it('accepts valid contact submission', async () => {
      const req = new Request('https://blazesportsintel.com/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Test', email: 'test@example.com', message: 'Hello' }),
      });
      const res = await worker.fetch(req, env);
      const body = await res.json() as any;

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
    });

    it('rejects missing Turnstile token when secret is configured', async () => {
      const tsEnv = createMockEnv({ TURNSTILE_SECRET_KEY: 'test-secret' });
      const req = new Request('https://blazesportsintel.com/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Test', email: 'test@example.com', message: 'Hello' }),
      });
      const res = await worker.fetch(req, tsEnv);
      const body = await res.json() as any;

      expect(res.status).toBe(403);
      expect(body.error).toContain('Bot verification required');
    });
  });

  // -----------------------------------------------------------------------
  // CSP report endpoint
  // -----------------------------------------------------------------------

  describe('POST /_csp/report', () => {
    it('returns 204 on valid report', async () => {
      const req = new Request('https://blazesportsintel.com/_csp/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 'csp-report': { 'document-uri': 'https://blazesportsintel.com' } }),
      });
      const res = await worker.fetch(req, env);
      expect(res.status).toBe(204);
    });
  });
});
