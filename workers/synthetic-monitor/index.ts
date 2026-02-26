/**
 * BSI Synthetic Monitor — Cron Worker
 *
 * Hits critical endpoints every 5 minutes, stores results in KV.
 * Sends failure alerts via webhook (Discord/Slack/email service).
 * Detects schema drift on JSON API responses and archives raw data to R2.
 *
 * Deploy: wrangler deploy --config workers/synthetic-monitor/wrangler.toml
 */

interface Env {
  MONITOR_KV: KVNamespace;
  DATA_LAKE: R2Bucket;
  ALERT_WEBHOOK_URL?: string;
}

interface CheckResult {
  url: string;
  status: number | 'error';
  latencyMs: number;
  ok: boolean;
  error?: string;
  checkedAt: string;
  schemaDrift?: boolean;
  previousSignature?: string;
  currentSignature?: string;
}

interface EndpointConfig {
  url: string;
  name: string;
  /** Parse response body and check for schema drift (JSON APIs only) */
  parseBody: boolean;
}

const ENDPOINTS: readonly EndpointConfig[] = [
  { url: 'https://blazesportsintel.com/', name: 'Homepage', parseBody: false },
  { url: 'https://blazesportsintel.com/api/health', name: 'API Health', parseBody: true },
  { url: 'https://blazesportsintel.com/api/status', name: 'System Status', parseBody: true },
  { url: 'https://blazesportsintel.com/api/college-baseball/scores', name: 'CB Scores', parseBody: true },
  { url: 'https://blazesportsintel.com/api/college-baseball/standings?conference=SEC', name: 'CB Standings', parseBody: true },
  { url: 'https://blazesportsintel.com/scores/', name: 'Scores Page', parseBody: false },
  { url: 'https://blazesportsintel.com/api/savant/batting/leaderboard', name: 'Savant Leaderboard', parseBody: true },
  { url: 'https://blazesportsintel.com/api/savant/conference-strength?conference=SEC', name: 'Savant Conference', parseBody: true },
] as const;

const TIMEOUT_MS = 10_000;
const RESULT_TTL = 7 * 24 * 60 * 60; // 7 days
const SIG_TTL = 30 * 24 * 60 * 60; // 30 days for baseline signatures
const SIG_PREV_TTL = 7 * 24 * 60 * 60; // 7 days for previous signatures

// ---------------------------------------------------------------------------
// Structural signature generator
// ---------------------------------------------------------------------------

function generateStructuralSignature(
  obj: unknown,
  depth: number = 0,
  maxDepth: number = 4,
): string {
  if (depth >= maxDepth) return 'truncated';

  if (obj === null) return 'null';
  if (obj === undefined) return 'undefined';

  const type = typeof obj;
  if (type === 'string') return 'string';
  if (type === 'number') return 'number';
  if (type === 'boolean') return 'boolean';

  if (Array.isArray(obj)) {
    if (obj.length === 0) return 'array<empty>';
    // Sample first element for the array type signature
    const elementSig = generateStructuralSignature(obj[0], depth + 1, maxDepth);
    return `array<${elementSig}>`;
  }

  if (type === 'object') {
    const record = obj as Record<string, unknown>;
    const keys = Object.keys(record).sort();
    if (keys.length === 0) return 'object{}';
    const fields = keys.map(
      (k) => `${k}:${generateStructuralSignature(record[k], depth + 1, maxDepth)}`,
    );
    return `object{${fields.join(',')}}`;
  }

  return type;
}

// ---------------------------------------------------------------------------
// Endpoint checker
// ---------------------------------------------------------------------------

async function checkEndpoint(
  ep: EndpointConfig,
  env: Env,
  ctx: ExecutionContext,
): Promise<CheckResult> {
  const start = Date.now();
  const checkedAt = new Date().toISOString();
  const slug = ep.name.toLowerCase().replace(/\s+/g, '-');

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const res = await fetch(ep.url, {
      method: 'GET',
      headers: { 'User-Agent': 'BSI-Synthetic-Monitor/2.0' },
      signal: controller.signal,
    });

    clearTimeout(timer);
    const latencyMs = Date.now() - start;

    const result: CheckResult = {
      url: ep.url,
      status: res.status,
      latencyMs,
      ok: res.ok,
      checkedAt,
    };

    // Schema drift detection for JSON endpoints
    if (ep.parseBody && res.ok) {
      try {
        const body = await res.json();
        const currentSig = generateStructuralSignature(body);
        const sigKey = `schema-sig:${slug}`;
        const prevSigKey = `schema-sig-prev:${slug}`;
        const storedSig = await env.MONITOR_KV.get(sigKey, 'text');

        if (!storedSig) {
          // Bootstrap: store first signature as baseline
          await env.MONITOR_KV.put(sigKey, currentSig, { expirationTtl: SIG_TTL });
        } else if (storedSig !== currentSig) {
          // Schema drift detected
          result.schemaDrift = true;
          result.previousSignature = storedSig;
          result.currentSignature = currentSig;

          // Archive raw response to R2 for debugging
          ctx.waitUntil(
            env.DATA_LAKE.put(
              `raw-responses/drift/${slug}/${checkedAt.replace(/[:.]/g, '-')}.json`,
              JSON.stringify(body),
              {
                httpMetadata: { contentType: 'application/json' },
                customMetadata: {
                  endpoint: ep.name,
                  previous_signature: storedSig,
                  current_signature: currentSig,
                  detected_at: checkedAt,
                },
              },
            ).catch(() => { /* non-critical */ }),
          );

          // Preserve old sig, store new
          await env.MONITOR_KV.put(prevSigKey, storedSig, { expirationTtl: SIG_PREV_TTL });
          await env.MONITOR_KV.put(sigKey, currentSig, { expirationTtl: SIG_TTL });
        }
      } catch {
        // Body parse failure — don't block the health check
      }
    }

    return result;
  } catch (err) {
    return {
      url: ep.url,
      status: 'error',
      latencyMs: Date.now() - start,
      ok: false,
      error: err instanceof Error ? err.message : 'Unknown error',
      checkedAt,
    };
  }
}

// ---------------------------------------------------------------------------
// Alert helpers
// ---------------------------------------------------------------------------

async function sendAlert(env: Env, message: string): Promise<void> {
  if (!env.ALERT_WEBHOOK_URL) return;
  try {
    await fetch(env.ALERT_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: message }),
    });
  } catch {
    // Alert failure is non-critical
  }
}

// ---------------------------------------------------------------------------
// Worker export
// ---------------------------------------------------------------------------

export default {
  async scheduled(_event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    const results = await Promise.all(
      ENDPOINTS.map((ep) => checkEndpoint(ep, env, ctx)),
    );

    const timestamp = new Date().toISOString();
    const dateKey = timestamp.slice(0, 16).replace(/[:.]/g, '-');

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
      driftDetected: results.some((r) => r.schemaDrift),
    };

    await env.MONITOR_KV.put('summary:latest', JSON.stringify(summary));

    await env.MONITOR_KV.put(
      `summary:${dateKey}`,
      JSON.stringify(summary),
      { expirationTtl: RESULT_TTL },
    );

    // Alert on HTTP failures
    const failures = results.filter((r) => !r.ok);
    if (failures.length > 0) {
      const failureNames = failures
        .map((f) => {
          const ep = ENDPOINTS.find((e) => e.url === f.url);
          return `${ep?.name ?? f.url}: ${f.status}${f.error ? ` (${f.error})` : ''}`;
        })
        .join('\n');

      await sendAlert(
        env,
        `[BSI Monitor] ${failures.length}/${ENDPOINTS.length} endpoints DOWN:\n${failureNames}`,
      );
    }

    // Alert on schema drift (separate from HTTP failures)
    const drifted = results.filter((r) => r.schemaDrift);
    if (drifted.length > 0) {
      const driftNames = drifted
        .map((d) => {
          const ep = ENDPOINTS.find((e) => e.url === d.url);
          return `${ep?.name ?? d.url}: schema changed`;
        })
        .join('\n');

      await sendAlert(
        env,
        `[BSI Monitor] Schema drift detected on ${drifted.length} endpoint(s):\n${driftNames}`,
      );
    }
  },

  /** Manual trigger via HTTP for testing */
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
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
    await this.scheduled({} as ScheduledEvent, env, ctx);

    return new Response(JSON.stringify({ ok: true, message: 'Check completed' }), {
      headers: { 'Content-Type': 'application/json' },
    });
  },
};
