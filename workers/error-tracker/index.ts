/**
 * BSI Error Tracker — Tail Worker
 *
 * Consumes logs from blazesportsintel-worker-prod via Cloudflare Tail Workers.
 * Filters for errors and exceptions, stores them in KV with 7-day TTL.
 *
 * Architecture:
 *   blazesportsintel-worker-prod → [tail] → bsi-error-tracker → KV (BSI_ERROR_LOG)
 *
 * To attach this worker as a tail consumer, add to the producer's wrangler.toml:
 *   [tail_consumers]
 *   - { service = "bsi-error-tracker" }
 *
 * Query errors:
 *   wrangler kv key list --namespace-id=<BSI_ERROR_LOG_ID> --prefix="err:"
 *   wrangler kv get --namespace-id=<BSI_ERROR_LOG_ID> "err:<key>"
 */

interface Env {
  ERROR_LOG: KVNamespace;
  ALERT_WEBHOOK_URL?: string;
}

interface TailMessage {
  readonly scriptName: string | null;
  readonly event:
    | { readonly request: { readonly url: string; readonly method: string } }
    | null;
  readonly eventTimestamp: number | null;
  readonly logs: ReadonlyArray<{
    readonly level: string;
    readonly message: readonly string[];
    readonly timestamp: number;
  }>;
  readonly exceptions: ReadonlyArray<{
    readonly name: string;
    readonly message: string;
    readonly timestamp: number;
  }>;
  readonly outcome: string;
}

interface TailItem {
  readonly scriptName: string | null;
  readonly event:
    | { readonly request: { readonly url: string; readonly method: string } }
    | null;
  readonly eventTimestamp: number | null;
  readonly logs: ReadonlyArray<{
    readonly level: string;
    readonly message: readonly string[];
    readonly timestamp: number;
  }>;
  readonly exceptions: ReadonlyArray<{
    readonly name: string;
    readonly message: string;
    readonly timestamp: number;
  }>;
  readonly outcome: string;
}

const SEVEN_DAYS = 7 * 24 * 60 * 60;

function generateKey(): string {
  const now = new Date();
  const datePrefix = now.toISOString().slice(0, 10); // 2026-02-12
  const ts = now.getTime();
  const rand = Math.random().toString(36).slice(2, 8);
  return `err:${datePrefix}:${ts}:${rand}`;
}

export default {
  async tail(events: TailItem[], env: Env): Promise<void> {
    const errors: Array<Record<string, unknown>> = [];

    for (const event of events) {
      const requestUrl = event.event?.request?.url ?? 'unknown';
      const requestMethod = event.event?.request?.method ?? 'unknown';
      const worker = event.scriptName ?? 'unknown';

      // Capture uncaught exceptions
      for (const exception of event.exceptions) {
        errors.push({
          type: 'exception',
          worker,
          name: exception.name,
          message: exception.message,
          timestamp: new Date(exception.timestamp).toISOString(),
          requestUrl,
          requestMethod,
          outcome: event.outcome,
        });
      }

      // Capture error-level log lines
      for (const log of event.logs) {
        if (log.level !== 'error') continue;

        // Try to parse structured JSON log from our logger
        let parsed: Record<string, unknown> | null = null;
        try {
          if (log.message.length === 1 && log.message[0].startsWith('{')) {
            parsed = JSON.parse(log.message[0]);
          }
        } catch {
          // Not JSON — store as raw message
        }

        errors.push({
          type: 'log_error',
          worker,
          ...(parsed ?? { message: log.message.join(' ') }),
          logTimestamp: new Date(log.timestamp).toISOString(),
          requestUrl,
          requestMethod,
          outcome: event.outcome,
        });
      }

      // Capture non-OK outcomes (e.g., exceededCpu, exceededMemory, scriptNotFound)
      if (event.outcome !== 'ok' && event.outcome !== 'canceled') {
        errors.push({
          type: 'bad_outcome',
          worker,
          outcome: event.outcome,
          timestamp: event.eventTimestamp
            ? new Date(event.eventTimestamp).toISOString()
            : new Date().toISOString(),
          requestUrl,
          requestMethod,
        });
      }
    }

    // Store each error in KV
    const writes = errors.map((error) =>
      env.ERROR_LOG.put(generateKey(), JSON.stringify(error), {
        expirationTtl: SEVEN_DAYS,
      }),
    );

    await Promise.all(writes);

    // Optional: send webhook alert for critical errors
    if (errors.length > 0 && env.ALERT_WEBHOOK_URL) {
      const summary = `${errors.length} error(s) from ${[...new Set(errors.map(e => e.worker))].join(', ')}`;
      try {
        await fetch(env.ALERT_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: `[BSI Error Tracker] ${summary}`,
            errors: errors.slice(0, 5), // First 5 for brevity
          }),
        });
      } catch {
        // Alert failure is non-critical — don't let it break error tracking
      }
    }
  },
};
