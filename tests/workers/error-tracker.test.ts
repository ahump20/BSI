/**
 * Error Tracker Tests — Tail Worker
 *
 * Verifies that the tail consumer correctly extracts errors from log events,
 * stores them in KV with proper key format and TTL, and sends webhook alerts.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

function createMockKV() {
  const store = new Map<string, string>();
  return {
    put: vi.fn(async (key: string, value: string, opts?: { expirationTtl?: number }) => {
      store.set(key, value);
    }),
    get: vi.fn(async (key: string) => store.get(key) ?? null),
    _store: store,
  };
}

function createMockEnv(overrides: Record<string, unknown> = {}) {
  return {
    ERROR_LOG: createMockKV(),
    ALERT_WEBHOOK_URL: undefined as string | undefined,
    ...overrides,
  };
}

function makeTailItem(overrides: Record<string, unknown> = {}) {
  return {
    scriptName: 'blazesportsintel-worker-prod',
    event: { request: { url: 'https://blazesportsintel.com/api/health', method: 'GET' } },
    eventTimestamp: Date.now(),
    logs: [],
    exceptions: [],
    outcome: 'ok',
    ...overrides,
  };
}

describe('bsi-error-tracker', () => {
  let worker: { tail: (events: any[], env: any) => Promise<void> };
  let env: ReturnType<typeof createMockEnv>;

  beforeEach(async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('ok')));
    env = createMockEnv();
    const mod = await import('../../workers/error-tracker/index');
    worker = 'default' in mod ? (mod as any).default : mod;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('stores uncaught exceptions in KV', async () => {
    const event = makeTailItem({
      exceptions: [{ name: 'TypeError', message: 'x is not a function', timestamp: Date.now() }],
    });

    await worker.tail([event], env);

    expect(env.ERROR_LOG.put).toHaveBeenCalledTimes(1);
    const [key, value] = env.ERROR_LOG.put.mock.calls[0];
    expect(key).toMatch(/^err:\d{4}-\d{2}-\d{2}:\d+:/);
    const parsed = JSON.parse(value);
    expect(parsed.type).toBe('exception');
    expect(parsed.name).toBe('TypeError');
    expect(parsed.worker).toBe('blazesportsintel-worker-prod');
  });

  it('stores error-level log lines in KV', async () => {
    const event = makeTailItem({
      logs: [
        { level: 'error', message: ['Something broke'], timestamp: Date.now() },
        { level: 'log', message: ['This is fine'], timestamp: Date.now() },
      ],
    });

    await worker.tail([event], env);

    expect(env.ERROR_LOG.put).toHaveBeenCalledTimes(1);
    const parsed = JSON.parse(env.ERROR_LOG.put.mock.calls[0][1]);
    expect(parsed.type).toBe('log_error');
    expect(parsed.message).toBe('Something broke');
  });

  it('ignores non-error log levels', async () => {
    const event = makeTailItem({
      logs: [
        { level: 'log', message: ['info message'], timestamp: Date.now() },
        { level: 'warn', message: ['warning message'], timestamp: Date.now() },
      ],
    });

    await worker.tail([event], env);

    expect(env.ERROR_LOG.put).not.toHaveBeenCalled();
  });

  it('captures bad outcomes (exceededCpu, etc.)', async () => {
    const event = makeTailItem({ outcome: 'exceededCpu' });

    await worker.tail([event], env);

    expect(env.ERROR_LOG.put).toHaveBeenCalledTimes(1);
    const parsed = JSON.parse(env.ERROR_LOG.put.mock.calls[0][1]);
    expect(parsed.type).toBe('bad_outcome');
    expect(parsed.outcome).toBe('exceededCpu');
  });

  it('skips ok and canceled outcomes', async () => {
    await worker.tail([makeTailItem({ outcome: 'ok' })], env);
    await worker.tail([makeTailItem({ outcome: 'canceled' })], env);

    expect(env.ERROR_LOG.put).not.toHaveBeenCalled();
  });

  it('uses 7-day TTL on KV writes', async () => {
    const event = makeTailItem({
      exceptions: [{ name: 'Error', message: 'test', timestamp: Date.now() }],
    });

    await worker.tail([event], env);

    const opts = env.ERROR_LOG.put.mock.calls[0][2];
    expect(opts.expirationTtl).toBe(7 * 24 * 60 * 60);
  });

  it('sends webhook alert when ALERT_WEBHOOK_URL is set', async () => {
    env.ALERT_WEBHOOK_URL = 'https://hooks.example.com/alert';
    const event = makeTailItem({
      exceptions: [{ name: 'Error', message: 'crash', timestamp: Date.now() }],
    });

    await worker.tail([event], env);

    expect(fetch).toHaveBeenCalledWith(
      'https://hooks.example.com/alert',
      expect.objectContaining({ method: 'POST' }),
    );
  });
});
