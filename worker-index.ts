/**
 * Blaze Sports Intel - Worker Entry Point
 * Exports Durable Objects and handles worker-level routing
 */

import baseballRankings from './data/baseball-rankings.json' assert { type: 'json' };

export { GameMonitorDO } from './lib/reconstruction/GameMonitorDO';

type BaseballRankingsPayload = {
  lastUpdated: string;
  rankings: Array<{
    rank: number;
    team: string;
    record: string;
  }>;
};

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
      const payload = baseballRankings as BaseballRankingsPayload;
      return new Response(JSON.stringify(payload), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=1800, stale-while-revalidate=900'
        }
      });
    }

    // All other requests return 404
    return new Response('Not Found', { status: 404 });
  }
};
