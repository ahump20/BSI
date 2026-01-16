/**
 * Blaze Sports Intel - Live Event Monitoring API
 * Start/stop live game monitoring
 *
 * POST /api/live-events/monitor - Start monitoring a game
 * DELETE /api/live-events/monitor/:id - Stop monitoring
 * GET /api/live-events/monitor - Get active monitors
 */

import type {
  StartMonitoringRequest,
  StartMonitoringResponse as _StartMonitoringResponse,
} from '../../../lib/reconstruction/types';
import { LiveMonitor } from '../../../lib/reconstruction/live-monitor';

interface Env {
  DB: D1Database;
  KV: KVNamespace;
  GAME_MONITOR: DurableObjectNamespace;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const request = (await context.request.json()) as StartMonitoringRequest;

    // Validate request
    if (
      !request.sport ||
      !request.gameId ||
      !request.homeTeam ||
      !request.awayTeam ||
      !request.startTime
    ) {
      return new Response(JSON.stringify({ success: false, error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const monitor = new LiveMonitor(context.env);
    const response = await monitor.startMonitoring(request);

    // Initialize Durable Object for continuous polling
    if (response.success) {
      try {
        const id = context.env.GAME_MONITOR.idFromName('global-monitor');
        const stub = context.env.GAME_MONITOR.get(id);
        await stub.fetch('https://do/start', { method: 'POST' });
        console.log('[monitor] Durable Object polling started');
      } catch (error) {
        console.error('[monitor] Failed to start Durable Object:', error);
        // Don't fail the request if DO initialization fails
      }
    }

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('Error starting monitoring:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const monitor = new LiveMonitor(context.env);
    const activeMonitors = await monitor.getActiveMonitors();

    return new Response(JSON.stringify({ monitors: activeMonitors }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=15',
      },
    });
  } catch (error) {
    console.error('Error fetching monitors:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

export const onRequestDelete: PagesFunction<Env> = async (context) => {
  try {
    const url = new URL(context.request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return new Response(JSON.stringify({ error: 'Missing game ID' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const monitor = new LiveMonitor(context.env);
    await monitor.stopMonitoring(id);

    return new Response(JSON.stringify({ success: true, message: 'Monitoring stopped' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error stopping monitoring:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
