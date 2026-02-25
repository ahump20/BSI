/**
 * BSI Synthetic Monitor — Cron Worker
 *
 * Hits critical endpoints every 5 minutes, stores results in KV.
 * Sends failure alerts via webhook (Discord/Slack/email service).
 *
 * Deploy: wrangler deploy --config workers/synthetic-monitor/wrangler.toml
 */

interface Env {
  MONITOR_KV: KVNamespace;
  ALERT_WEBHOOK_URL?: string;
}

interface CheckResult {
  url: string;
  status: number | 'error';
  latencyMs: number;
  ok: boolean;
  error?: string;
  checkedAt: string;
}

const ENDPOINTS = [
  { url: 'https://blazesportsintel.com/', name: 'Homepage' },
  { url: 'https://blazesportsintel.com/api/health', name: 'API Health' },
  { url: 'https://blazesportsintel.com/api/college-baseball/scores', name: 'CB Scores' },
  { url: 'https://blazesportsintel.com/api/college-baseball/standings?conference=SEC', name: 'CB Standings' },
  { url: 'https://blazesportsintel.com/scores/', name: 'Scores Page' },
] as const;

const TIMEOUT_MS = 10_000;
const RESULT_TTL = 7 * 24 * 60 * 60; // 7 days

async function checkEndpoint(url: string): Promise<CheckResult> {
  const start = Date.now();
  const checkedAt = new Date().toISOString();

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const res = await fetch(url, {
      method: 'GET',
      headers: { 'User-Agent': 'BSI-Synthetic-Monitor/1.0' },
      signal: controller.signal,
    });

    clearTimeout(timer);
    const latencyMs = Date.now() - start;

    return {
      url,
      status: res.status,
      latencyMs,
      ok: res.ok,
      checkedAt,
    };
  } catch (err) {
    return {
      url,
      status: 'error',
      latencyMs: Date.now() - start,
      ok: false,
      error: err instanceof Error ? err.message : 'Unknown error',
      checkedAt,
    };
  }
}

export default {
  async scheduled(_event: ScheduledEvent, env: Env, _ctx: ExecutionContext): Promise<void> {
    const results = await Promise.all(
      ENDPOINTS.map((ep) => checkEndpoint(ep.url)),
    );

    const timestamp = new Date().toISOString();
    const dateKey = timestamp.slice(0, 16).replace(/[:.]/g, '-'); // 2026-02-12T14-30

    // Store individual check results
    await Promise.all(
      results.map((result, i) =>
        env.MONITOR_KV.put(
          `check:${ENDPOINTS[i].name.toLowerCase().replace(/\s+/g, '-')}:${dateKey}`,
          JSON.stringify(result),
          { expirationTtl: RESULT_TTL },
        ),
      ),
    );

    // Store summary
    const summary = {
      timestamp,
      results: results.map((r, i) => ({
        name: ENDPOINTS[i].name,
        ...r,
      })),
      allHealthy: results.every((r) => r.ok),
    };

    await env.MONITOR_KV.put(
      `summary:latest`,
      JSON.stringify(summary),
    );

    await env.MONITOR_KV.put(
      `summary:${dateKey}`,
      JSON.stringify(summary),
      { expirationTtl: RESULT_TTL },
    );

    // Alert on failures
    const failures = results.filter((r) => !r.ok);
    if (failures.length > 0 && env.ALERT_WEBHOOK_URL) {
      const failureNames = failures
        .map((f, i) => {
          const ep = ENDPOINTS.find((e) => e.url === f.url);
          return `${ep?.name ?? f.url}: ${f.status}${f.error ? ` (${f.error})` : ''}`;
        })
        .join('\n');

      try {
        await fetch(env.ALERT_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: `[BSI Monitor] ${failures.length}/${ENDPOINTS.length} endpoints DOWN:\n${failureNames}`,
          }),
        });
      } catch {
        // Alert failure is non-critical
      }
    }
  },

  /** Manual trigger via HTTP for testing */
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/status') {
      const latest = await env.MONITOR_KV.get('summary:latest', 'text');
      if (!latest) {
        return new Response(JSON.stringify({ error: 'No monitoring data yet' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return new Response(latest, {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Trigger a manual check
    await this.scheduled({} as ScheduledEvent, env, { waitUntil: () => {}, passThroughOnException: () => {} } as unknown as ExecutionContext);

    return new Response(JSON.stringify({ ok: true, message: 'Check completed' }), {
      headers: { 'Content-Type': 'application/json' },
    });
  },
};
