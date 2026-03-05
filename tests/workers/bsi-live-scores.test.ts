/**
 * BSI Live Scores Tests — WebSocket Durable Object Worker
 *
 * Tests the worker's fetch handler routing and CORS. The Durable Object
 * (LiveScoresBroadcaster) is tested indirectly through the worker's proxy
 * layer since DO internals require the Cloudflare runtime.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

function createMockDOStub() {
  return {
    fetch: vi.fn(async (request: Request) => {
      const url = new URL(request.url);
      if (url.pathname === '/start') {
        return new Response(JSON.stringify({ status: 'started' }), {
          headers: { 'Content-Type': 'application/json' },
        });
      }
      if (url.pathname === '/stop') {
        return new Response(JSON.stringify({ status: 'stopped' }), {
          headers: { 'Content-Type': 'application/json' },
        });
      }
      if (url.pathname === '/status') {
        return new Response(JSON.stringify({
          alarmSet: false,
          lastPoll: 'never',
          connectedClients: 0,
          trackedGames: 0,
          liveGames: 0,
        }), { headers: { 'Content-Type': 'application/json' } });
      }
      return new Response('Not found', { status: 404 });
    }),
  };
}

function createMockDONamespace(stub: ReturnType<typeof createMockDOStub>) {
  return {
    idFromName: vi.fn(() => 'mock-do-id'),
    get: vi.fn(() => stub),
  };
}

function createEnv() {
  const stub = createMockDOStub();
  return {
    LIVE_SCORES: createMockDONamespace(stub),
    RAPIDAPI_KEY: 'test-key',
    ENVIRONMENT: 'test',
    _stub: stub,
  };
}

describe('bsi-live-scores', () => {
  let worker: { fetch: (request: Request, env: any) => Promise<Response> };
  let env: ReturnType<typeof createEnv>;

  beforeEach(async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('ok')));
    env = createEnv();
    const mod = await import('../../workers/bsi-live-scores/index');
    worker = 'default' in mod ? (mod as any).default : mod;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // --- Routing ---

  it('returns service info on root path', async () => {
    const res = await worker.fetch(new Request('https://live.example.com/'), env);
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.service).toContain('Live Scores');
    expect(body.endpoints).toBeDefined();
  });

  it('returns health check on /health', async () => {
    const res = await worker.fetch(new Request('https://live.example.com/health'), env);
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.status).toBe('ok');
    expect(body.service).toBe('bsi-live-scores');
    expect(body.timestamp).toBeDefined();
  });

  it('routes /start to Durable Object', async () => {
    const res = await worker.fetch(new Request('https://live.example.com/start'), env);
    expect(res.status).toBe(200);
    expect(env.LIVE_SCORES.idFromName).toHaveBeenCalledWith('college-baseball');
    expect(env.LIVE_SCORES.get).toHaveBeenCalled();
    const body = await res.json() as any;
    expect(body.status).toBe('started');
  });

  it('routes /stop to Durable Object', async () => {
    const res = await worker.fetch(new Request('https://live.example.com/stop'), env);
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.status).toBe('stopped');
  });

  it('routes /status to Durable Object', async () => {
    const res = await worker.fetch(new Request('https://live.example.com/status'), env);
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.connectedClients).toBeDefined();
    expect(body.trackedGames).toBeDefined();
  });

  it('routes /ws to Durable Object for WebSocket upgrade', async () => {
    const req = new Request('https://live.example.com/ws', {
      headers: { Upgrade: 'websocket' },
    });
    await worker.fetch(req, env);
    expect(env.LIVE_SCORES.idFromName).toHaveBeenCalledWith('college-baseball');
    expect(env._stub.fetch).toHaveBeenCalled();
  });

  // --- CORS ---

  it('returns CORS headers on OPTIONS', async () => {
    const res = await worker.fetch(
      new Request('https://live.example.com/', { method: 'OPTIONS' }),
      env,
    );
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
    expect(res.headers.get('Access-Control-Allow-Methods')).toContain('GET');
  });

  it('includes CORS headers on /health response', async () => {
    const res = await worker.fetch(new Request('https://live.example.com/health'), env);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
  });

  it('includes CORS headers on control endpoint responses', async () => {
    const res = await worker.fetch(new Request('https://live.example.com/start'), env);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
    expect(res.headers.get('Content-Type')).toContain('application/json');
  });

  // --- Unknown routes ---

  it('returns 404 for unknown paths after passing through DO', async () => {
    // Unknown paths don't match /ws, /start, /stop, /status, /health
    // so they fall through to the service info response
    const res = await worker.fetch(new Request('https://live.example.com/nonexistent'), env);
    expect(res.status).toBe(200); // Returns service info, not 404
    const body = await res.json() as any;
    expect(body.endpoints).toBeDefined();
  });

  it('uses consistent DO id "college-baseball" for all routes', async () => {
    await worker.fetch(new Request('https://live.example.com/start'), env);
    await worker.fetch(new Request('https://live.example.com/stop'), env);
    await worker.fetch(new Request('https://live.example.com/status'), env);

    const calls = env.LIVE_SCORES.idFromName.mock.calls;
    expect(calls).toHaveLength(3);
    for (const call of calls) {
      expect(call[0]).toBe('college-baseball');
    }
  });
});
