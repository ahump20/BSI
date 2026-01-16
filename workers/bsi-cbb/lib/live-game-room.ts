/**
 * BSI Live Game Room - Durable Object for WebSocket Connections
 *
 * Manages real-time WebSocket connections for live game updates.
 * Each game gets its own Durable Object instance, identified by game ID.
 *
 * Message Types (Server → Client):
 * - score_update: Score changed
 * - inning_update: Inning/period changed
 * - play_update: New play happened
 * - game_state: Full game state refresh
 * - heartbeat: Connection keepalive
 *
 * Message Types (Client → Server):
 * - subscribe: Subscribe to game updates
 * - unsubscribe: Stop receiving updates
 * - ping: Keepalive ping
 */

import { DurableObject } from 'cloudflare:workers';

// Empty env interface - Durable Objects don't need specific bindings for this use case
interface Env {}

// =============================================================================
// TYPES
// =============================================================================

interface GameState {
  gameId: string;
  status: 'scheduled' | 'pre_game' | 'in_progress' | 'delayed' | 'final' | 'postponed';
  homeTeam: {
    id: string;
    name: string;
    abbreviation?: string;
    score: number;
  };
  awayTeam: {
    id: string;
    name: string;
    abbreviation?: string;
    score: number;
  };
  inning?: number;
  inningHalf?: 'top' | 'bottom';
  period?: number;
  clock?: string;
  lastPlay?: string;
  lastUpdated: string;
}

interface WebSocketMessage {
  type: string;
  payload?: unknown;
  timestamp: string;
}

interface ClientMessage {
  type: 'subscribe' | 'unsubscribe' | 'ping';
  gameId?: string;
}

// =============================================================================
// LIVE GAME ROOM DURABLE OBJECT
// =============================================================================

export class LiveGameRoom extends DurableObject {
  private sessions: Map<WebSocket, { gameId: string; connectedAt: string }>;
  private gameState: GameState | null;
  private heartbeatInterval: ReturnType<typeof setInterval> | null;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.sessions = new Map();
    this.gameState = null;
    this.heartbeatInterval = null;

    // Restore any hibernated WebSocket sessions
    this.ctx.getWebSockets().forEach((ws) => {
      const meta = ws.deserializeAttachment() as { gameId: string; connectedAt: string } | null;
      if (meta) {
        this.sessions.set(ws, meta);
      }
    });

    // Start heartbeat if we have sessions
    if (this.sessions.size > 0) {
      this.startHeartbeat();
    }
  }

  // ---------------------------------------------------------------------------
  // HTTP HANDLER (WebSocket Upgrade)
  // ---------------------------------------------------------------------------

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // Handle WebSocket upgrade
    if (request.headers.get('Upgrade') === 'websocket') {
      return this.handleWebSocketUpgrade(request, url);
    }

    // REST endpoints for the Durable Object
    switch (url.pathname) {
      case '/state':
        return this.handleGetState();
      case '/update':
        if (request.method === 'POST') {
          return this.handleUpdateState(request);
        }
        break;
      case '/broadcast':
        if (request.method === 'POST') {
          return this.handleBroadcast(request);
        }
        break;
      case '/stats':
        return this.handleStats();
    }

    return new Response('Not Found', { status: 404 });
  }

  private async handleWebSocketUpgrade(_request: Request, url: URL): Promise<Response> {
    const gameId = url.searchParams.get('gameId');

    if (!gameId) {
      return new Response('Missing gameId query parameter', { status: 400 });
    }

    // Create WebSocket pair
    const pair = new WebSocketPair();
    const client = pair[0];
    const server = pair[1];

    if (!client || !server) {
      return new Response('Failed to create WebSocket pair', { status: 500 });
    }

    // Accept the connection with hibernation support
    this.ctx.acceptWebSocket(server);

    // Store session metadata
    const meta = { gameId, connectedAt: new Date().toISOString() };
    server.serializeAttachment(meta);
    this.sessions.set(server, meta);

    // Start heartbeat if this is the first connection
    if (this.sessions.size === 1) {
      this.startHeartbeat();
    }

    // Send initial game state if available
    if (this.gameState && this.gameState.gameId === gameId) {
      server.send(
        JSON.stringify({
          type: 'game_state',
          payload: this.gameState,
          timestamp: new Date().toISOString(),
        })
      );
    }

    console.log(
      `[LiveGameRoom] New connection for game ${gameId}. Total sessions: ${this.sessions.size}`
    );

    return new Response(null, { status: 101, webSocket: client });
  }

  private handleGetState(): Response {
    return new Response(
      JSON.stringify({
        state: this.gameState,
        connections: this.sessions.size,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  private async handleUpdateState(request: Request): Promise<Response> {
    try {
      const newState = (await request.json()) as GameState;
      const previousState = this.gameState;
      this.gameState = {
        ...newState,
        lastUpdated: new Date().toISOString(),
      };

      // Store state in Durable Object storage for persistence
      await this.ctx.storage.put('gameState', this.gameState);

      // Determine what changed and broadcast appropriate messages
      if (previousState) {
        // Score change
        if (
          previousState.homeTeam.score !== newState.homeTeam.score ||
          previousState.awayTeam.score !== newState.awayTeam.score
        ) {
          this.broadcast({
            type: 'score_update',
            payload: {
              homeScore: newState.homeTeam.score,
              awayScore: newState.awayTeam.score,
              previousHomeScore: previousState.homeTeam.score,
              previousAwayScore: previousState.awayTeam.score,
            },
            timestamp: new Date().toISOString(),
          });
        }

        // Inning/period change
        if (
          previousState.inning !== newState.inning ||
          previousState.inningHalf !== newState.inningHalf
        ) {
          this.broadcast({
            type: 'inning_update',
            payload: {
              inning: newState.inning,
              inningHalf: newState.inningHalf,
            },
            timestamp: new Date().toISOString(),
          });
        }

        // Status change (e.g., game started, game ended)
        if (previousState.status !== newState.status) {
          this.broadcast({
            type: 'status_update',
            payload: {
              status: newState.status,
              previousStatus: previousState.status,
            },
            timestamp: new Date().toISOString(),
          });
        }
      } else {
        // First state update - send full state
        this.broadcast({
          type: 'game_state',
          payload: this.gameState,
          timestamp: new Date().toISOString(),
        });
      }

      return new Response(JSON.stringify({ success: true, connections: this.sessions.size }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: 'Invalid state update' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  private async handleBroadcast(request: Request): Promise<Response> {
    try {
      const message = (await request.json()) as WebSocketMessage;
      this.broadcast(message);

      return new Response(
        JSON.stringify({
          success: true,
          recipients: this.sessions.size,
        }),
        {
          headers: { 'Content-Type': 'application/json' },
        }
      );
    } catch (error) {
      return new Response(JSON.stringify({ error: 'Invalid broadcast message' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  private handleStats(): Response {
    const gameIds = new Set<string>();
    this.sessions.forEach((meta) => gameIds.add(meta.gameId));

    return new Response(
      JSON.stringify({
        totalConnections: this.sessions.size,
        gamesBeingWatched: Array.from(gameIds),
        hasGameState: this.gameState !== null,
        gameId: this.gameState?.gameId,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // ---------------------------------------------------------------------------
  // WEBSOCKET EVENT HANDLERS (Hibernation API)
  // ---------------------------------------------------------------------------

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
    try {
      const data = JSON.parse(message as string) as ClientMessage;

      switch (data.type) {
        case 'ping':
          ws.send(
            JSON.stringify({
              type: 'pong',
              timestamp: new Date().toISOString(),
            })
          );
          break;

        case 'subscribe':
          // Client can change which game they're watching
          if (data.gameId) {
            const meta = this.sessions.get(ws);
            if (meta) {
              meta.gameId = data.gameId;
              ws.serializeAttachment(meta);
            }
            // Send current state for the new game if available
            if (this.gameState && this.gameState.gameId === data.gameId) {
              ws.send(
                JSON.stringify({
                  type: 'game_state',
                  payload: this.gameState,
                  timestamp: new Date().toISOString(),
                })
              );
            }
          }
          break;

        case 'unsubscribe':
          // Client wants to stop receiving updates but keep connection
          const meta = this.sessions.get(ws);
          if (meta) {
            meta.gameId = '';
            ws.serializeAttachment(meta);
          }
          break;
      }
    } catch (error) {
      console.error('[LiveGameRoom] Error processing message:', error);
    }
  }

  async webSocketClose(ws: WebSocket, code: number, _reason: string): Promise<void> {
    this.sessions.delete(ws);
    console.log(
      `[LiveGameRoom] Connection closed (code: ${code}). Remaining sessions: ${this.sessions.size}`
    );

    // Stop heartbeat if no more connections
    if (this.sessions.size === 0) {
      this.stopHeartbeat();
    }
  }

  async webSocketError(ws: WebSocket, error: Error): Promise<void> {
    console.error('[LiveGameRoom] WebSocket error:', error);
    this.sessions.delete(ws);

    if (this.sessions.size === 0) {
      this.stopHeartbeat();
    }
  }

  // ---------------------------------------------------------------------------
  // BROADCAST & HEARTBEAT
  // ---------------------------------------------------------------------------

  private broadcast(message: WebSocketMessage): void {
    const gameId = this.gameState?.gameId;
    const messageStr = JSON.stringify(message);

    this.sessions.forEach((meta, ws) => {
      // Only send to clients watching this game (or all if no gameId filter)
      if (!gameId || meta.gameId === gameId || meta.gameId === '') {
        try {
          ws.send(messageStr);
        } catch (error) {
          // Connection probably closed, will be cleaned up by webSocketClose
          console.error('[LiveGameRoom] Failed to send to WebSocket:', error);
        }
      }
    });
  }

  private startHeartbeat(): void {
    if (this.heartbeatInterval) return;

    // Send heartbeat every 30 seconds to keep connections alive
    this.heartbeatInterval = setInterval(() => {
      this.broadcast({
        type: 'heartbeat',
        payload: { connections: this.sessions.size },
        timestamp: new Date().toISOString(),
      });
    }, 30000);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  // ---------------------------------------------------------------------------
  // LIFECYCLE
  // ---------------------------------------------------------------------------

  async alarm(): Promise<void> {
    // Clean up stale connections or perform periodic tasks
    console.log(`[LiveGameRoom] Alarm triggered. Sessions: ${this.sessions.size}`);

    // If no connections, clear the game state to save storage
    if (this.sessions.size === 0 && this.gameState) {
      await this.ctx.storage.delete('gameState');
      this.gameState = null;
    }
  }
}

// =============================================================================
// HELPER: GET DURABLE OBJECT STUB
// =============================================================================

export function getLiveGameRoomStub(
  namespace: DurableObjectNamespace,
  gameId: string
): DurableObjectStub {
  // Use the game ID as the Durable Object ID for consistent routing
  const id = namespace.idFromName(gameId);
  return namespace.get(id);
}
