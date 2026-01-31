/**
 * BSI Portal Cron Worker
 *
 * Scheduled worker that triggers transfer portal data sync every 5 minutes.
 * POSTs to /api/portal/sync with cron auth header.
 * Logs sync results to KV for monitoring.
 */

interface Env {
  KV: KVNamespace;
  SYNC_URL: string;
  CRON_SECRET: string;
}

interface SyncResult {
  success: boolean;
  inserted?: number;
  updated?: number;
  changelog_events?: number;
  error?: string;
  timestamp: string;
  duration_ms: number;
}

export default {
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    const start = Date.now();
    const timestamp = new Date().toISOString();

    const syncUrl = env.SYNC_URL || 'https://blazesportsintel.com/api/portal/sync';

    let result: SyncResult;

    try {
      const response = await fetch(syncUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-BSI-Cron': env.CRON_SECRET || 'bsi-cron-scheduled',
        },
      });

      const data = (await response.json()) as Record<string, unknown>;
      const duration = Date.now() - start;

      if (response.ok && data.success) {
        result = {
          success: true,
          inserted: data.inserted as number,
          updated: data.updated as number,
          changelog_events: data.changelog_events as number,
          timestamp,
          duration_ms: duration,
        };
      } else {
        result = {
          success: false,
          error: (data.error as string) || `HTTP ${response.status}`,
          timestamp,
          duration_ms: duration,
        };
      }
    } catch (err) {
      result = {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error',
        timestamp,
        duration_ms: Date.now() - start,
      };
    }

    // Log to KV for monitoring
    ctx.waitUntil(
      Promise.all([
        env.KV.put('portal:cron:last_run', JSON.stringify(result), { expirationTtl: 86400 }),
        env.KV.put(
          `portal:cron:log:${timestamp}`,
          JSON.stringify(result),
          { expirationTtl: 604800 } // 7 days
        ),
      ])
    );
  },
};
