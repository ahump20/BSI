/**
 * Blaze Sports Intel - Game Monitor Durable Object
 * Provides continuous polling for live game monitoring
 *
 * This Durable Object runs continuously and polls external sports APIs
 * at 15-second intervals to detect significant events.
 *
 * @version 1.0.0
 * @created 2025-10-31
 */

import { LiveMonitor } from './live-monitor';

interface Env {
  DB: D1Database;
  KV: KVNamespace;
}

export class GameMonitorDO {
  private state: DurableObjectState;
  private env: Env;
  private pollInterval = 15000; // 15 seconds
  private isMonitoring = false;

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;
  }

  /**
   * Handles HTTP requests to start/stop monitoring
   */
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    try {
      if (path === '/start' && request.method === 'POST') {
        return await this.startMonitoring();
      } else if (path === '/stop' && request.method === 'POST') {
        return await this.stopMonitoring();
      } else if (path === '/status' && request.method === 'GET') {
        return await this.getStatus();
      }

      return new Response('Not Found', { status: 404 });
    } catch (error) {
      console.error('GameMonitorDO fetch error:', error);
      return new Response(
        JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }

  /**
   * Cloudflare Durable Object alarm handler
   * Called at scheduled intervals to perform polling
   */
  async alarm(): Promise<void> {
    if (!this.isMonitoring) {
      console.log('[GameMonitorDO] Monitoring stopped, skipping alarm');
      return;
    }

    try {
      console.log('[GameMonitorDO] Alarm triggered, starting poll cycle');
      await this.pollAllActiveGames();

      // Schedule next alarm
      const nextAlarmTime = Date.now() + this.pollInterval;
      await this.state.storage.setAlarm(nextAlarmTime);
      console.log(
        `[GameMonitorDO] Next alarm scheduled for ${new Date(nextAlarmTime).toISOString()}`
      );
    } catch (error) {
      console.error('[GameMonitorDO] Alarm error:', error);
      // Still schedule next alarm even if this cycle failed
      await this.state.storage.setAlarm(Date.now() + this.pollInterval);
    }
  }

  /**
   * Start continuous monitoring
   */
  private async startMonitoring(): Promise<Response> {
    console.log('[GameMonitorDO] Start monitoring requested');

    this.isMonitoring = true;
    await this.state.storage.put('isMonitoring', true);

    // Schedule immediate first poll
    await this.state.storage.setAlarm(Date.now() + 1000); // Start in 1 second

    console.log('[GameMonitorDO] Monitoring started, first alarm scheduled');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Monitoring started',
        pollIntervalSeconds: this.pollInterval / 1000,
        nextPollTime: new Date(Date.now() + 1000).toISOString(),
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  /**
   * Stop continuous monitoring
   */
  private async stopMonitoring(): Promise<Response> {
    console.log('[GameMonitorDO] Stop monitoring requested');

    this.isMonitoring = false;
    await this.state.storage.put('isMonitoring', false);
    await this.state.storage.deleteAlarm();

    console.log('[GameMonitorDO] Monitoring stopped, alarm cancelled');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Monitoring stopped',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  /**
   * Get current monitoring status
   */
  private async getStatus(): Promise<Response> {
    const isMonitoring = (await this.state.storage.get<boolean>('isMonitoring')) ?? false;
    const lastPollTime = await this.state.storage.get<string>('lastPollTime');
    const pollCount = (await this.state.storage.get<number>('pollCount')) ?? 0;

    return new Response(
      JSON.stringify({
        isMonitoring,
        lastPollTime,
        pollCount,
        pollIntervalSeconds: this.pollInterval / 1000,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  /**
   * Poll all active games and detect events
   */
  private async pollAllActiveGames(): Promise<void> {
    const startTime = Date.now();
    console.log('[GameMonitorDO] Starting poll cycle');

    try {
      // Get all active monitors from database - fetch ALL columns to match LiveGame type
      const result = await this.env.DB.prepare(
        `
        SELECT *
        FROM live_games
        WHERE is_active = 1
        ORDER BY created_at DESC
      `
      ).all();

      const activeGames = result.results ?? [];
      console.log(`[GameMonitorDO] Found ${activeGames.length} active games to poll`);

      if (activeGames.length === 0) {
        console.log('[GameMonitorDO] No active games, skipping poll cycle');
        return;
      }

      // Create LiveMonitor instance
      const monitor = new LiveMonitor(this.env);

      // Poll each game
      for (const game of activeGames) {
        try {
          const sport = (game as any).sport;
          const gameId = (game as any).game_id;
          const awayTeam = (game as any).away_team;
          const homeTeam = (game as any).home_team;
          const id = (game as any).id;

          console.log(
            `[GameMonitorDO] Polling ${sport.toUpperCase()} game ${gameId}: ${awayTeam} @ ${homeTeam}`
          );

          // Call pollGame method which handles all sports
          await monitor.pollGame(id);

          console.log(`[GameMonitorDO] Successfully polled ${sport.toUpperCase()} game ${gameId}`);
        } catch (error) {
          console.error(`[GameMonitorDO] Error polling game:`, error);
          // Continue with next game even if this one fails
        }
      }

      // Update poll statistics
      const pollCount = ((await this.state.storage.get<number>('pollCount')) ?? 0) + 1;
      await this.state.storage.put('pollCount', pollCount);
      await this.state.storage.put('lastPollTime', new Date().toISOString());

      const duration = Date.now() - startTime;
      console.log(
        `[GameMonitorDO] Poll cycle complete in ${duration}ms (${pollCount} total polls)`
      );
    } catch (error) {
      console.error('[GameMonitorDO] Poll cycle error:', error);
      throw error;
    }
  }
}
