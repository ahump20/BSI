/**
 * Synthetic Monitor Tests — Cron Worker
 *
 * Verifies endpoint checking, KV summary storage, and failure alerting.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

function createMockKV() {
  const store = new Map<string, string>();
  return {
    put: vi.fn(async (key: string, value: string, opts?: { expirationTtl?: number }) => {
      store.set(key, value);
    }),
    get: vi.fn(async (key: string, type?: string) => store.get(key) ?? null),
    _store: store,
  };
}

function createMockEnv(overrides: Record<string, unknown> = {}) {
  return {
    MONITOR_KV: createMockKV(),
    ALERT_WEBHOOK_URL: undefined as string | undefined,
    ...overrides,
  };
}

describe('bsi-synthetic-monitor', () => {
  let worker: { scheduled: (event: any, env: any, ctx: any) => Promise<void>; fetch: (req: Request, env: any) => Promise<Response> };
  let env: ReturnType<typeof createMockEnv>;
  const mockCtx = { waitUntil: vi.fn(), passThroughOnException: vi.fn() };

  beforeEach(async () => {
    env = createMockEnv();
    // Mock fetch to simulate healthy endpoints
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('ok', { status: 200 })));
    const mod = await import('../../workers/synthetic-monitor/index');
    worker = 'default' in mod ? (mod as any).default : mod;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('checks all configured endpoints on scheduled trigger', async () => {
    await worker.scheduled({} as any, env, mockCtx);

    // Should have called fetch for each endpoint (no webhook when all healthy)
    expect(vi.mocked(fetch).mock.calls.length).toBeGreaterThanOrEqual(5);
  });

  it('stores summary:latest in KV', async () => {
    await worker.scheduled({} as any, env, mockCtx);

    expect(env.MONITOR_KV.put).toHaveBeenCalledWith(
      'summary:latest',
      expect.any(String),
    );

    const latestCall = env.MONITOR_KV.put.mock.calls.find(
      (c: any[]) => c[0] === 'summary:latest',
    );
    const summary = JSON.parse(latestCall![1]);
    expect(summary.timestamp).toBeDefined();
    // Match however many endpoints the worker defines — don't hardcode
    expect(summary.results.length).toBeGreaterThanOrEqual(5);
    expect(summary.allHealthy).toBe(true);
  });

  it('stores individual check results with TTL', async () => {
    await worker.scheduled({} as any, env, mockCtx);

    const checkCalls = env.MONITOR_KV.put.mock.calls.filter(
      (c: any[]) => c[0].startsWith('check:'),
    );
    expect(checkCalls.length).toBeGreaterThanOrEqual(5);
    expect(checkCalls[0][2]?.expirationTtl).toBe(7 * 24 * 60 * 60);
  });

  it('sends webhook alert on endpoint failure', async () => {
    env.ALERT_WEBHOOK_URL = 'https://hooks.example.com/alert';
    // First call succeeds (for endpoints), then fails for one
    const mockFetch = vi.fn()
      .mockResolvedValueOnce(new Response('ok', { status: 200 }))
      .mockResolvedValueOnce(new Response('ok', { status: 200 }))
      .mockRejectedValueOnce(new Error('Connection refused'))
      .mockResolvedValueOnce(new Response('ok', { status: 200 }))
      .mockResolvedValueOnce(new Response('ok', { status: 200 }))
      .mockResolvedValue(new Response('ok')); // webhook call
    vi.stubGlobal('fetch', mockFetch);

    await worker.scheduled({} as any, env, mockCtx);

    // Should have sent an alert webhook
    const webhookCall = mockFetch.mock.calls.find(
      (c: any[]) => typeof c[0] === 'string' && c[0].includes('hooks.example.com'),
    );
    expect(webhookCall).toBeDefined();
  });

  it('GET /status returns latest summary from KV', async () => {
    const summary = JSON.stringify({ allHealthy: true, results: [] });
    env.MONITOR_KV._store.set('summary:latest', summary);
    env.MONITOR_KV.get.mockResolvedValueOnce(summary);

    const req = new Request('https://monitor.example.com/status');
    const res = await worker.fetch(req, env);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual(JSON.parse(summary));
  });

  it('GET /status returns 404 when no data exists', async () => {
    const req = new Request('https://monitor.example.com/status');
    const res = await worker.fetch(req, env);

    expect(res.status).toBe(404);
  });
});
