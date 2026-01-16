/**
 * Blaze Sports Intel - Win Probability WebSocket Handler
 *
 * Real-time WebSocket connection for live win probability updates.
 * Clients connect to: wss://blazesportsintel.com/ws/win-probability?gameId=xxx
 *
 * Server sends updates every 30 seconds or on significant events:
 * {
 *   "type": "win_prob_update",
 *   "gameId": "game_123",
 *   "timestamp": "2025-10-17T12:30:45Z",
 *   "home_win_pct": 0.62,
 *   "away_win_pct": 0.38,
 *   "change_pct": +0.08,
 *   "leverage_index": 1.85,
 *   "situation": { inning: 7, outs: 2, ... }
 * }
 *
 * Uses Cloudflare Durable Objects for WebSocket state management.
 */

export class WinProbabilitySocket {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.sessions = new Map(); // Map<sessionId, WebSocket>
    this.gameSubscriptions = new Map(); // Map<gameId, Set<sessionId>>
    this.updateIntervals = new Map(); // Map<gameId, intervalId>
  }

  async fetch(request) {
    const url = new URL(request.url);

    // Handle WebSocket upgrade
    if (request.headers.get('Upgrade') === 'websocket') {
      return this.handleWebSocket(request);
    }

    // HTTP endpoints for connection management
    if (url.pathname === '/stats') {
      return this.getStats();
    }

    return new Response('WebSocket endpoint', { status: 200 });
  }

  /**
   * Handle WebSocket connection
   */
  async handleWebSocket(request) {
    const url = new URL(request.url);
    const gameId = url.searchParams.get('gameId');

    if (!gameId) {
      return new Response('Missing gameId parameter', { status: 400 });
    }

    // Create WebSocket pair
    const [client, server] = Object.values(new WebSocketPair());

    // Accept WebSocket connection
    server.accept();

    // Generate session ID
    const sessionId = crypto.randomUUID();

    // Store session
    this.sessions.set(sessionId, server);

    // Subscribe to game updates
    if (!this.gameSubscriptions.has(gameId)) {
      this.gameSubscriptions.set(gameId, new Set());
    }
    this.gameSubscriptions.get(gameId).add(sessionId);

    // Store gameId for this session
    server.gameId = gameId;
    server.sessionId = sessionId;

    // Set up event listeners
    server.addEventListener('message', (event) => {
      this.handleMessage(server, event.data);
    });

    server.addEventListener('close', () => {
      this.handleClose(server);
    });

    server.addEventListener('error', (error) => {
      console.error('WebSocket error:', error);
      this.handleClose(server);
    });

    // Send initial connection confirmation
    server.send(
      JSON.stringify({
        type: 'connected',
        sessionId,
        gameId,
        timestamp: new Date().toISOString(),
      })
    );

    // Send current win probability immediately
    await this.sendCurrentWinProbability(server, gameId);

    // Start update interval for this game if not already running
    if (!this.updateIntervals.has(gameId)) {
      const intervalId = setInterval(async () => {
        await this.broadcastGameUpdate(gameId);
      }, 30000); // Update every 30 seconds

      this.updateIntervals.set(gameId, intervalId);
    }

    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  }

  /**
   * Handle incoming WebSocket message
   */
  handleMessage(socket, message) {
    try {
      const data = JSON.parse(message);

      switch (data.type) {
        case 'ping':
          socket.send(
            JSON.stringify({
              type: 'pong',
              timestamp: new Date().toISOString(),
            })
          );
          break;

        case 'subscribe':
          // Switch subscription to different game
          this.unsubscribeFromGame(socket);
          socket.gameId = data.gameId;
          this.subscribeToGame(socket, data.gameId);
          this.sendCurrentWinProbability(socket, data.gameId);
          break;

        case 'request_update':
          // Immediate update request
          this.sendCurrentWinProbability(socket, socket.gameId);
          break;

        default:
          socket.send(
            JSON.stringify({
              type: 'error',
              message: 'Unknown message type',
            })
          );
      }
    } catch (error) {
      console.error('Message handling error:', error);
      socket.send(
        JSON.stringify({
          type: 'error',
          message: 'Invalid message format',
        })
      );
    }
  }

  /**
   * Handle WebSocket close
   */
  handleClose(socket) {
    const sessionId = socket.sessionId;
    const gameId = socket.gameId;

    // Remove from sessions
    this.sessions.delete(sessionId);

    // Remove from game subscriptions
    if (gameId && this.gameSubscriptions.has(gameId)) {
      this.gameSubscriptions.get(gameId).delete(sessionId);

      // If no more subscribers, clear interval
      if (this.gameSubscriptions.get(gameId).size === 0) {
        this.gameSubscriptions.delete(gameId);

        if (this.updateIntervals.has(gameId)) {
          clearInterval(this.updateIntervals.get(gameId));
          this.updateIntervals.delete(gameId);
        }
      }
    }

    console.log(`WebSocket closed: ${sessionId}, Game: ${gameId}`);
  }

  /**
   * Subscribe to game updates
   */
  subscribeToGame(socket, gameId) {
    if (!this.gameSubscriptions.has(gameId)) {
      this.gameSubscriptions.set(gameId, new Set());
    }
    this.gameSubscriptions.get(gameId).add(socket.sessionId);
  }

  /**
   * Unsubscribe from current game
   */
  unsubscribeFromGame(socket) {
    if (socket.gameId && this.gameSubscriptions.has(socket.gameId)) {
      this.gameSubscriptions.get(socket.gameId).delete(socket.sessionId);
    }
  }

  /**
   * Send current win probability to socket
   */
  async sendCurrentWinProbability(socket, gameId) {
    try {
      // Fetch current win probability from API
      const response = await fetch(
        `https://blazesportsintel.com/api/v1/predictive/games/${gameId}/win-prob`,
        { headers: { 'User-Agent': 'Blaze-WebSocket-Internal' } }
      );

      if (!response.ok) {
        socket.send(
          JSON.stringify({
            type: 'error',
            message: 'Failed to fetch win probability',
          })
        );
        return;
      }

      const data = await response.json();

      // Send to client
      socket.send(
        JSON.stringify({
          type: 'win_prob_update',
          gameId,
          timestamp: new Date().toISOString(),
          home_win_pct: data.current_probability?.home_win_pct,
          away_win_pct: data.current_probability?.away_win_pct,
          confidence_interval: data.current_probability?.confidence_interval,
          situation: data.situation,
          change_pct: data.probability_change?.change_pct || 0,
          leverage_index: data.probability_change?.leverage_index || 1.0,
          game_status: data.game.status,
        })
      );
    } catch (error) {
      console.error('Error sending win probability:', error);
      socket.send(
        JSON.stringify({
          type: 'error',
          message: 'Internal server error',
        })
      );
    }
  }

  /**
   * Broadcast update to all subscribers of a game
   */
  async broadcastGameUpdate(gameId) {
    const subscribers = this.gameSubscriptions.get(gameId);
    if (!subscribers || subscribers.size === 0) return;

    try {
      // Fetch current win probability
      const response = await fetch(
        `https://blazesportsintel.com/api/v1/predictive/games/${gameId}/win-prob`,
        { headers: { 'User-Agent': 'Blaze-WebSocket-Internal' } }
      );

      if (!response.ok) return;

      const data = await response.json();

      // Prepare broadcast message
      const message = JSON.stringify({
        type: 'win_prob_update',
        gameId,
        timestamp: new Date().toISOString(),
        home_win_pct: data.current_probability?.home_win_pct,
        away_win_pct: data.current_probability?.away_win_pct,
        confidence_interval: data.current_probability?.confidence_interval,
        situation: data.situation,
        change_pct: data.probability_change?.change_pct || 0,
        leverage_index: data.probability_change?.leverage_index || 1.0,
        game_status: data.game.status,
      });

      // Send to all subscribers
      for (const sessionId of subscribers) {
        const socket = this.sessions.get(sessionId);
        if (socket && socket.readyState === WebSocket.READY_STATE_OPEN) {
          socket.send(message);
        }
      }

      // If game is final, stop updates
      if (data.game.status === 'final' && this.updateIntervals.has(gameId)) {
        clearInterval(this.updateIntervals.get(gameId));
        this.updateIntervals.delete(gameId);
      }
    } catch (error) {
      console.error('Broadcast error:', error);
    }
  }

  /**
   * Get connection stats
   */
  async getStats() {
    const stats = {
      total_sessions: this.sessions.size,
      active_games: this.gameSubscriptions.size,
      games: [],
    };

    for (const [gameId, subscribers] of this.gameSubscriptions) {
      stats.games.push({
        gameId,
        subscribers: subscribers.size,
      });
    }

    return new Response(JSON.stringify(stats, null, 2), {
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

/**
 * Export Durable Object
 */
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Route to Durable Object
    if (url.pathname.startsWith('/ws/win-probability')) {
      const id = env.WIN_PROB_SOCKET.idFromName('global');
      const stub = env.WIN_PROB_SOCKET.get(id);
      return stub.fetch(request);
    }

    return new Response('Not found', { status: 404 });
  },
};
