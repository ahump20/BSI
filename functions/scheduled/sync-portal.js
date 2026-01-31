/**
 * Transfer Portal Scheduled Sync
 *
 * Cron-triggered function that calls the portal sync endpoint
 * to pull latest transfer data from Highlightly / RapidAPI.
 *
 * Schedule: Every 4 hours (configured in wrangler.toml or Pages dashboard)
 *   0 * /4 * * *
 *
 * This runs as a Cloudflare Pages scheduled function.
 * It calls the /api/portal/sync endpoint with the internal cron header.
 */

export default {
  async scheduled(event, env, ctx) {
    const syncUrl = 'https://blazesportsintel.com/api/portal/sync';

    try {
      const response = await fetch(syncUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-BSI-Cron': 'portal-sync',
        },
      });

      const result = await response.json();

      await env.KV.put(
        'portal:cron_last_run',
        JSON.stringify({
          timestamp: new Date().toISOString(),
          status: response.ok ? 'success' : 'error',
          http_status: response.status,
          result,
        }),
        { expirationTtl: 86400 }
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      await env.KV.put(
        'portal:cron_last_run',
        JSON.stringify({
          timestamp: new Date().toISOString(),
          status: 'error',
          message,
        }),
        { expirationTtl: 86400 }
      );
    }
  },
};
