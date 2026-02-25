/**
 * Blaze Field Site Tests — CDN + API Worker
 *
 * Verifies R2 asset serving, MIME type detection, CORS restrictions,
 * event ingestion, and agent events endpoint.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

function createMockKV() {
  const store = new Map<string, string>();
  return {
    put: vi.fn(async (key: string, value: string, opts?: { expirationTtl?: number }) => {
      store.set(key, value);
    }),
    get: vi.fn(async (key: string, type?: string) => {
      const val = store.get(key);
      if (!val) return null;
      return type === 'json' ? JSON.parse(val) : val;
    }),
    _store: store,
  };
}

function createMockR2() {
  const objects = new Map<string, { body: ReadableStream; httpEtag: string }>();
  return {
    get: vi.fn(async (key: string) => objects.get(key) ?? null),
    _put: (key: string, content: string) => {
      objects.set(key, {
        body: new ReadableStream({
          start(controller) { controller.enqueue(new TextEncoder().encode(content)); controller.close(); },
        }),
        httpEtag: `"${key}-etag"`,
      });
    },
  };
}

function createEnv(overrides: Record<string, unknown> = {}) {
  return {
    ASSETS: createMockR2(),
    MONITOR_KV: createMockKV(),
    ...overrides,
  };
}

describe('blaze-field-site', () => {
  let worker: { fetch: (request: Request, env: any) => Promise<Response> };
  let env: ReturnType<typeof createEnv>;

  beforeEach(async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('ok')));
    env = createEnv();
    const mod = await import('../../workers/blaze-field-site/index');
    worker = 'default' in mod ? (mod as any).default : mod;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // --- Asset Serving ---

  it('serves index.html for root path', async () => {
    env.ASSETS._put('index.html', '<html>BlazeCraft</html>');
    const res = await worker.fetch(new Request('https://blazecraft.app/'), env);
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toContain('text/html');
  });

  it('serves JS with correct MIME type', async () => {
    env.ASSETS._put('assets/main.abc12345.js', 'console.log("hi")');
    const res = await worker.fetch(new Request('https://blazecraft.app/assets/main.abc12345.js'), env);
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toContain('application/javascript');
  });

  it('uses immutable cache for hashed assets', async () => {
    env.ASSETS._put('assets/style.abc12345.css', 'body{}');
    const res = await worker.fetch(new Request('https://blazecraft.app/assets/style.abc12345.css'), env);
    expect(res.headers.get('Cache-Control')).toContain('immutable');
  });

  it('returns 404 for missing assets', async () => {
    const res = await worker.fetch(new Request('https://blazecraft.app/nonexistent.js'), env);
    expect(res.status).toBe(404);
  });

  it('SPA fallback serves index.html for non-asset paths', async () => {
    env.ASSETS._put('index.html', '<html>SPA</html>');
    const res = await worker.fetch(new Request('https://blazecraft.app/dashboard'), env);
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toContain('text/html');
  });

  // --- CORS ---

  it('returns open CORS on GET /api/status', async () => {
    env.MONITOR_KV._store.set('summary:latest', '{"ok":true}');
    env.MONITOR_KV.get.mockResolvedValueOnce('{"ok":true}');
    const res = await worker.fetch(new Request('https://blazecraft.app/api/status'), env);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
  });

  it('restricts CORS on OPTIONS for POST endpoints', async () => {
    const req = new Request('https://blazecraft.app/api/events/ingest', {
      method: 'OPTIONS',
      headers: { Origin: 'https://evil.com' },
    });
    const res = await worker.fetch(req, env);
    expect(res.status).toBe(204);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBeFalsy();
  });

  it('allows CORS from blazecraft.app on POST endpoints', async () => {
    const req = new Request('https://blazecraft.app/api/events/ingest', {
      method: 'OPTIONS',
      headers: { Origin: 'https://blazecraft.app' },
    });
    const res = await worker.fetch(req, env);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('https://blazecraft.app');
  });

  // --- Event Ingestion ---

  it('accepts valid event POST', async () => {
    const req = new Request('https://blazecraft.app/api/events/ingest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: 'https://blazecraft.app' },
      body: JSON.stringify({ type: 'tool_use', agentId: 'test-agent', sessionId: 'sess-1' }),
    });
    const res = await worker.fetch(req, env);
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.ok).toBe(true);
  });

  it('rejects event POST missing required fields', async () => {
    const req = new Request('https://blazecraft.app/api/events/ingest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'tool_use' }), // missing agentId
    });
    const res = await worker.fetch(req, env);
    expect(res.status).toBe(400);
  });

  // --- Agent Events ---

  it('returns empty events when no sessions exist', async () => {
    const res = await worker.fetch(new Request('https://blazecraft.app/api/agent-events'), env);
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.events).toEqual([]);
    expect(body.count).toBe(0);
  });
});
