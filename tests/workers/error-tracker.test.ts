/**
 * Error Tracker Tests — Tail Worker
 *
 * Verifies that the tail consumer correctly extracts errors from log events,
 * stores individual entries + fingerprint-based cluster summaries in KV,
 * and sends webhook alerts.
 *
 * KV write pattern per error batch:
 *   1. Raw entry:    err:{date}:{ts}:{rand}     (7-day TTL)
 *   2. Cluster:      err-cluster:{fingerprint}   (24h TTL)
 *   3. Cluster index: err-clusters:index          (24h TTL)
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

  // ── Individual error storage ──

  it('stores uncaught exceptions in KV', async () => {
    const event = makeTailItem({
      exceptions: [{ name: 'TypeError', message: 'x is not a function', timestamp: Date.now() }],
    });

    await worker.tail([event], env);

    // Should write: 1 raw entry + 1 cluster + 1 index = 3 minimum
    expect(env.ERROR_LOG.put).toHaveBeenCalledTimes(3);
    const rawCall = env.ERROR_LOG.put.mock.calls.find(
      ([key]: [string]) => key.startsWith('err:') && !key.startsWith('err-cluster')
    );
    expect(rawCall).toBeDefined();
    const parsed = JSON.parse(rawCall![1]);
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

    // 1 raw entry + 1 cluster + 1 index = 3
    expect(env.ERROR_LOG.put).toHaveBeenCalledTimes(3);
    const rawCall = env.ERROR_LOG.put.mock.calls.find(
      ([key]: [string]) => key.startsWith('err:') && !key.startsWith('err-cluster')
    );
    const parsed = JSON.parse(rawCall![1]);
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

    // 1 raw + 1 cluster + 1 index = 3
    expect(env.ERROR_LOG.put).toHaveBeenCalledTimes(3);
    const rawCall = env.ERROR_LOG.put.mock.calls.find(
      ([key]: [string]) => key.startsWith('err:') && !key.startsWith('err-cluster')
    );
    const parsed = JSON.parse(rawCall![1]);
    expect(parsed.type).toBe('bad_outcome');
    expect(parsed.outcome).toBe('exceededCpu');
  });

  it('skips ok and canceled outcomes', async () => {
    await worker.tail([makeTailItem({ outcome: 'ok' })], env);
    await worker.tail([makeTailItem({ outcome: 'canceled' })], env);

    expect(env.ERROR_LOG.put).not.toHaveBeenCalled();
  });

  it('uses 7-day TTL on raw error writes', async () => {
    const event = makeTailItem({
      exceptions: [{ name: 'Error', message: 'test', timestamp: Date.now() }],
    });

    await worker.tail([event], env);

    const rawCall = env.ERROR_LOG.put.mock.calls.find(
      ([key]: [string]) => key.startsWith('err:') && !key.startsWith('err-cluster')
    );
    expect(rawCall![2].expirationTtl).toBe(7 * 24 * 60 * 60);
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

  // ── Clustering behavior ──

  it('writes cluster summary with fingerprint key', async () => {
    const event = makeTailItem({
      exceptions: [{ name: 'Error', message: 'timeout connecting to DB', timestamp: Date.now() }],
    });

    await worker.tail([event], env);

    const clusterCall = env.ERROR_LOG.put.mock.calls.find(
      ([key]: [string]) => key.startsWith('err-cluster:') && !key.includes('index')
    );
    expect(clusterCall).toBeDefined();
    const cluster = JSON.parse(clusterCall![1]);
    expect(cluster.fingerprint).toBeTruthy();
    expect(cluster.worker).toBe('blazesportsintel-worker-prod');
    expect(cluster.count).toBe(1);
    expect(cluster.kind).toBe('exception');
    expect(clusterCall![2].expirationTtl).toBe(24 * 60 * 60);
  });

  it('writes cluster index listing active fingerprints', async () => {
    const event = makeTailItem({
      exceptions: [{ name: 'Error', message: 'crash', timestamp: Date.now() }],
    });

    await worker.tail([event], env);

    const indexCall = env.ERROR_LOG.put.mock.calls.find(
      ([key]: [string]) => key === 'err-clusters:index'
    );
    expect(indexCall).toBeDefined();
    const index = JSON.parse(indexCall![1]);
    expect(Array.isArray(index)).toBe(true);
    expect(index.length).toBe(1);
  });

  it('groups same-fingerprint errors within a batch', async () => {
    const event = makeTailItem({
      exceptions: [
        { name: 'Error', message: 'timeout connecting to DB', timestamp: Date.now() },
        { name: 'Error', message: 'timeout connecting to DB', timestamp: Date.now() },
      ],
    });

    await worker.tail([event], env);

    // 2 raw entries + 1 cluster (same fingerprint) + 1 index = 4
    const rawCalls = env.ERROR_LOG.put.mock.calls.filter(
      ([key]: [string]) => key.startsWith('err:') && !key.startsWith('err-cluster')
    );
    expect(rawCalls.length).toBe(2);

    const clusterCalls = env.ERROR_LOG.put.mock.calls.filter(
      ([key]: [string]) => key.startsWith('err-cluster:') && !key.includes('index')
    );
    expect(clusterCalls.length).toBe(1);

    const cluster = JSON.parse(clusterCalls[0][1]);
    expect(cluster.count).toBe(2);
  });

  it('creates separate clusters for different error types', async () => {
    const event = makeTailItem({
      outcome: 'exceededCpu',
      exceptions: [{ name: 'TypeError', message: 'x is not a function', timestamp: Date.now() }],
    });

    await worker.tail([event], env);

    // 2 raw entries + 2 clusters (different fingerprints) + 1 index = 5
    const clusterCalls = env.ERROR_LOG.put.mock.calls.filter(
      ([key]: [string]) => key.startsWith('err-cluster:') && !key.includes('index')
    );
    expect(clusterCalls.length).toBe(2);

    const indexCall = env.ERROR_LOG.put.mock.calls.find(
      ([key]: [string]) => key === 'err-clusters:index'
    );
    const index = JSON.parse(indexCall![1]);
    expect(index.length).toBe(2);
  });
});
