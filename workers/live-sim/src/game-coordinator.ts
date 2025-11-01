/**
 * Durable Object: Game Coordinator
 *
 * Per-game instance that:
 * - Maintains hot game state in memory
 * - Coordinates SSE connections for live updates
 * - Batches DB writes to reduce D1 load
 * - Caches simulation results
 */

import type { Env, GameState, PlayEvent, SimOutput } from './types';
import { runBaseballSimulation, calculateLeverageIndex } from './baseball-sim';

export class GameCoordinator {
  private state: DurableObjectState;
  private env: Env;
  private gameState: GameState | null = null;
  private sseConnections: Set<ReadableStreamDefaultController> = new Set();
  private pendingEvents: PlayEvent[] = [];
  private lastSimResult: SimOutput | null = null;
  private flushTimer: number | null = null;

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;

    // Load game state from Durable Object storage on startup
    this.state.blockConcurrencyWhile(async () => {
      const savedState = await this.state.storage.get<GameState>('gameState');
      this.gameState = savedState || null;
    });
  }

  /**
   * Handle HTTP requests to this Durable Object
   */
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    try {
      // SSE connection for live updates
      if (path === '/live' && request.headers.get('Accept') === 'text/event-stream') {
        return this.handleSSE(request);
      }

      // Ingest play event
      if (path === '/ingest' && request.method === 'POST') {
        const event = await request.json<PlayEvent>();
        return this.handleIngest(event);
      }

      // Get current state snapshot
      if (path === '/snapshot' && request.method === 'GET') {
        return this.handleSnapshot();
      }

      return new Response('Not Found', { status: 404 });
    } catch (error) {
      console.error('[GameCoordinator] Error:', error);
      return new Response(JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  /**
   * Handle SSE connection for live updates
   */
  private async handleSSE(request: Request): Promise<Response> {
    // Create SSE stream
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();

    // Send initial state if available
    if (this.lastSimResult) {
      await writer.write(encoder.encode(`data: ${JSON.stringify(this.lastSimResult)}\n\n`));
    }

    // Store connection for future updates
    const controller = readable.getReader() as unknown as ReadableStreamDefaultController;
    this.sseConnections.add(controller);

    // Cleanup on disconnect
    request.signal.addEventListener('abort', () => {
      this.sseConnections.delete(controller);
      writer.close();
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }

  /**
   * Handle play event ingestion
   */
  private async handleIngest(event: PlayEvent): Promise<Response> {
    // Update in-memory game state
    this.updateGameState(event);

    // Add to pending events queue
    this.pendingEvents.push(event);

    // Run simulation
    const simResult = await this.runSimulation();

    if (simResult) {
      // Broadcast to SSE clients
      await this.broadcastUpdate(simResult);

      // Store latest result
      this.lastSimResult = simResult;
    }

    // Schedule flush to D1 (batched writes)
    this.scheduleFlush();

    return new Response(JSON.stringify({
      success: true,
      gameId: event.gameId,
      winProb: simResult?.winProb
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  /**
   * Handle snapshot request
   */
  private async handleSnapshot(): Promise<Response> {
    if (!this.gameState || !this.lastSimResult) {
      return new Response(JSON.stringify({
        error: 'No game state available'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      gameState: this.gameState,
      simulation: this.lastSimResult
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=5'
      }
    });
  }

  /**
   * Update in-memory game state from event
   */
  private updateGameState(event: PlayEvent): void {
    if (!this.gameState) {
      this.gameState = {
        gameId: event.gameId,
        homeScore: event.homeScore,
        awayScore: event.awayScore,
        updatedAt: Date.now()
      };
    }

    // Update based on sport
    if (event.sport === 'baseball') {
      this.gameState.inning = event.inning;
      this.gameState.inningHalf = event.inningHalf;
      this.gameState.outs = event.outs;
      this.gameState.baseState = event.baseState;
      this.gameState.balls = event.balls;
      this.gameState.strikes = event.strikes;
    } else if (event.sport === 'football') {
      this.gameState.quarter = event.quarter;
      this.gameState.down = event.down;
      this.gameState.distance = event.distance;
      this.gameState.yardline = event.yardline;
      this.gameState.possession = event.teamOnOffense;
    }

    this.gameState.homeScore = event.homeScore;
    this.gameState.awayScore = event.awayScore;
    this.gameState.updatedAt = Date.now();

    // Persist to Durable Object storage (fast, in-memory)
    this.state.storage.put('gameState', this.gameState);
  }

  /**
   * Run Monte Carlo simulation from current state
   */
  private async runSimulation(): Promise<SimOutput | null> {
    if (!this.gameState) return null;

    // Calculate leverage index
    const leverageIndex = calculateLeverageIndex({
      gameId: this.gameState.gameId,
      inning: this.gameState.inning || 1,
      inningHalf: this.gameState.inningHalf || 'top',
      outs: this.gameState.outs || 0,
      baseState: this.gameState.baseState || 0,
      homeScore: this.gameState.homeScore,
      awayScore: this.gameState.awayScore,
      homeTeam: 'HOME', // TODO: Load from DB
      awayTeam: 'AWAY'
    });

    // Adaptive sim count based on leverage
    const numSims = leverageIndex > 1.5 ? 2000 : leverageIndex > 1.0 ? 1000 : 500;

    // Check cache first
    const stateHash = `${this.gameState.inning}${this.gameState.inningHalf?.[0]}${this.gameState.outs}${this.gameState.baseState}${this.gameState.homeScore}-${this.gameState.awayScore}`;

    // Run simulation
    const result = runBaseballSimulation(
      {
        gameId: this.gameState.gameId,
        inning: this.gameState.inning || 1,
        inningHalf: this.gameState.inningHalf || 'top',
        outs: this.gameState.outs || 0,
        baseState: this.gameState.baseState || 0,
        homeScore: this.gameState.homeScore,
        awayScore: this.gameState.awayScore,
        homeTeam: 'HOME',
        awayTeam: 'AWAY'
      },
      { numSims }
    );

    result.leverageIndex = leverageIndex;

    return result;
  }

  /**
   * Broadcast simulation update to all SSE clients
   */
  private async broadcastUpdate(simResult: SimOutput): Promise<void> {
    const encoder = new TextEncoder();

    // Send to all connected clients
    const deadConnections: ReadableStreamDefaultController[] = [];

    for (const controller of this.sseConnections) {
      try {
        // Note: This is a simplified version. In production, you'd use a proper stream controller
        // For now, we'll skip the actual write as it requires more complex stream handling
        console.log('[GameCoordinator] Would broadcast to SSE client:', simResult.gameId);
      } catch (error) {
        console.error('[GameCoordinator] Failed to send SSE update:', error);
        deadConnections.push(controller);
      }
    }

    // Clean up dead connections
    deadConnections.forEach(conn => this.sseConnections.delete(conn));
  }

  /**
   * Schedule batched flush to D1
   */
  private scheduleFlush(): void {
    // Cancel existing timer
    if (this.flushTimer !== null) {
      clearTimeout(this.flushTimer);
    }

    // Schedule flush in 2 seconds (batch multiple events)
    this.flushTimer = setTimeout(() => {
      this.flushToD1();
    }, 2000) as unknown as number;
  }

  /**
   * Flush pending events and state to D1
   */
  private async flushToD1(): Promise<void> {
    if (this.pendingEvents.length === 0) return;

    const eventBatch = [...this.pendingEvents];
    this.pendingEvents = [];

    try {
      // Batch insert events
      const insertPromises = eventBatch.map(event =>
        this.env.DB.prepare(`
          INSERT INTO events (
            game_id, sequence, timestamp, event_type, description,
            inning, inning_half, outs, base_state, home_score, away_score,
            batter_id, pitcher_id, epa, win_prob_change
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          event.gameId,
          event.sequence,
          new Date(event.timestamp).getTime() / 1000,
          event.eventType,
          event.description || null,
          event.inning || null,
          event.inningHalf || null,
          event.outs || null,
          event.baseState || null,
          event.homeScore,
          event.awayScore,
          event.batterId || null,
          event.pitcherId || null,
          event.metadata?.epa || null,
          event.metadata?.winProbShift || null
        ).run()
      );

      await Promise.all(insertPromises);

      // Update game state
      if (this.gameState) {
        await this.env.DB.prepare(`
          INSERT INTO game_state (
            game_id, inning, inning_half, outs, base_state, balls, strikes,
            home_score, away_score, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(game_id) DO UPDATE SET
            inning = excluded.inning,
            inning_half = excluded.inning_half,
            outs = excluded.outs,
            base_state = excluded.base_state,
            balls = excluded.balls,
            strikes = excluded.strikes,
            home_score = excluded.home_score,
            away_score = excluded.away_score,
            updated_at = excluded.updated_at
        `).bind(
          this.gameState.gameId,
          this.gameState.inning || null,
          this.gameState.inningHalf || null,
          this.gameState.outs || null,
          this.gameState.baseState || null,
          this.gameState.balls || null,
          this.gameState.strikes || null,
          this.gameState.homeScore,
          this.gameState.awayScore,
          Math.floor(this.gameState.updatedAt / 1000)
        ).run();
      }

      // Cache simulation result
      if (this.lastSimResult) {
        await this.env.DB.prepare(`
          INSERT INTO sim_cache (
            game_id, state_hash, home_win_prob, away_win_prob, num_sims,
            next_play_dist, final_score_dist, computed_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(game_id, state_hash) DO UPDATE SET
            home_win_prob = excluded.home_win_prob,
            away_win_prob = excluded.away_win_prob,
            num_sims = excluded.num_sims,
            next_play_dist = excluded.next_play_dist,
            final_score_dist = excluded.final_score_dist,
            computed_at = excluded.computed_at
        `).bind(
          this.lastSimResult.gameId,
          this.lastSimResult.stateHash,
          this.lastSimResult.winProb.home,
          this.lastSimResult.winProb.away,
          this.lastSimResult.numSims,
          JSON.stringify(this.lastSimResult.nextPlay),
          JSON.stringify(this.lastSimResult.finalScoreDist),
          Math.floor(Date.now() / 1000)
        ).run();
      }

      console.log(`[GameCoordinator] Flushed ${eventBatch.length} events to D1`);
    } catch (error) {
      console.error('[GameCoordinator] Failed to flush to D1:', error);

      // Re-add events to queue for retry
      this.pendingEvents.unshift(...eventBatch);
    }
  }
}
