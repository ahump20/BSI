/**
 * Blaze Sports Intel - Worker Entry Point
 * Exports Durable Objects and handles worker-level routing
 */

export { GameMonitorDO } from './lib/reconstruction/GameMonitorDO';

import baseballRankingsWorker from './workers/baseball-rankings';

/**
 * Default export for ES Module Worker
 * Handles HTTP requests to the worker
 */
export default {
  async fetch(request: Request, env: any): Promise<Response> {
    const url = new URL(request.url);

    // Health check endpoint
    if (url.pathname === '/health') {
      return new Response(JSON.stringify({
        status: 'healthy',
        service: 'blazesports-game-monitor',
        timestamp: new Date().toISOString()
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (url.pathname === '/baseball/rankings') {
      return baseballRankingsWorker.fetch(request, env);
    }

    // All other requests return 404
    return new Response('Not Found', { status: 404 });
  }
};
