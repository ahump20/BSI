/**
 * Live Scores WebSocket Durable Object
 *
 * Real-time sports score streaming using Cloudflare Durable Objects
 * with WebSocket Hibernation for cost-efficient persistent connections.
 *
 * Features:
 * - WebSocket Hibernation API for minimal compute charges during idle periods
 * - Subscription-based filtering by sport, team, and conference
 * - Automatic reconnection handling
 * - Broadcast score updates to relevant subscribers
 * - Auto-response for ping/pong to maintain connections during hibernation
 *
 * Architecture:
 * - Worker handles HTTP routing and WebSocket upgrades
 * - Durable Object manages WebSocket connections and state
 * - Uses acceptWebSocket() for hibernation-enabled connections
 * - Session data persists across hibernation via serializeAttachment()
 *
 * Brand: BlazeSportsIntel - "Born to Blaze the Path Less Beaten"
 * No fake data. Real-time scores or nothing.
 *
 * @see https://developers.cloudflare.com/durable-objects/examples/websocket-hibernation-server/
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface Env {
  LIVE_SCORES: DurableObjectNamespace;
  KV?: KVNamespace;
  CFBD_API_KEY?: string;
  BALLDONTLIE_API_KEY?: string;
}

export type SportKey =
  | 'ncaaf'
  | 'ncaab'
  | 'wcbb'
  | 'nfl'
  | 'nba'
  | 'wnba'
  | 'mlb'
  | 'cbb'
  | 'nhl'
  | 'all';

export interface SubscriptionFilter {
  sports: SportKey[];
  teams?: string[]; // Team IDs or abbreviations
  conferences?: string[]; // Conference names (SEC, Big Ten, etc.)
  liveOnly?: boolean;
}

export interface ScoreUpdate {
  type: 'score_update' | 'game_start' | 'game_end' | 'status_change';
  sport: SportKey;
  gameId: string;
  timestamp: string;
  data: {
    homeTeamId: string;
    awayTeamId: string;
    homeTeamName: string;
    awayTeamName: string;
    homeScore: number | null;
    awayScore: number | null;
    status: string;
    period?: number;
    clock?: string;
    conference?: string;
    venue?: string;
    broadcast?: string;
    // Sport-specific fields
    sportData?: any;
  };
}

export interface ClientMessage {
  type: 'subscribe' | 'unsubscribe' | 'ping' | 'get_state';
  filter?: SubscriptionFilter;
  requestId?: string;
}

export interface ServerMessage {
  type: 'subscribed' | 'unsubscribed' | 'pong' | 'state' | 'score_update' | 'error' | 'connected';
  requestId?: string;
  data?: any;
  error?: string;
}

interface SessionData {
  id: string;
  filter: SubscriptionFilter;
  connectedAt: string;
  lastActivity: string;
}

// ============================================================================
// WORKER (HTTP ENTRY POINT)
// ============================================================================

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Health check
    if (url.pathname === '/health') {
      return new Response(
        JSON.stringify({
          status: 'healthy',
          service: 'live-scores-websocket',
          timestamp: new Date().toISOString(),
        }),
        {
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache',
          },
        }
      );
    }

    // WebSocket endpoint
    if (url.pathname === '/ws' || url.pathname === '/live') {
      // Verify WebSocket upgrade
      const upgradeHeader = request.headers.get('Upgrade');
      if (upgradeHeader !== 'websocket') {
        return new Response('Expected WebSocket upgrade', {
          status: 426,
          headers: {
            'Content-Type': 'text/plain',
            Upgrade: 'websocket',
          },
        });
      }

      // Route to singleton Durable Object for all connections
      // This allows broadcasting to all connected clients
      const id = env.LIVE_SCORES.idFromName('global-live-scores');
      const durableObject = env.LIVE_SCORES.get(id);

      return durableObject.fetch(request);
    }

    // API endpoint to trigger score updates (called by ingest workers)
    if (url.pathname === '/api/broadcast' && request.method === 'POST') {
      try {
        const update = (await request.json()) as ScoreUpdate;

        const id = env.LIVE_SCORES.idFromName('global-live-scores');
        const durableObject = env.LIVE_SCORES.get(id);

        // Forward to Durable Object
        return durableObject.fetch(
          new Request('http://internal/broadcast', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(update),
          })
        );
      } catch (error) {
        return new Response(
          JSON.stringify({ error: 'Invalid broadcast payload' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // API endpoint to get connection stats
    if (url.pathname === '/api/stats') {
      const id = env.LIVE_SCORES.idFromName('global-live-scores');
      const durableObject = env.LIVE_SCORES.get(id);

      return durableObject.fetch(
        new Request('http://internal/stats', { method: 'GET' })
      );
    }

    return new Response('Not Found', { status: 404 });
  },
};

// ============================================================================
// DURABLE OBJECT (WEBSOCKET MANAGER)
// ============================================================================

export class LiveScoresDO implements DurableObject {
  private state: DurableObjectState;
  private sessions: Map<WebSocket, SessionData>;
  private env: Env;

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;
    this.sessions = new Map();

    // Restore sessions from hibernation
    // When DO wakes from hibernation, getWebSockets() returns all connected sockets
    this.state.getWebSockets().forEach((ws) => {
      try {
        const attachment = ws.deserializeAttachment() as SessionData | null;
        if (attachment) {
          this.sessions.set(ws, attachment);
        }
      } catch (error) {
        console.warn('[LiveScoresDO] Failed to restore session from hibernation:', error);
      }
    });

    // Configure auto-response for ping/pong during hibernation
    // This keeps connections alive without waking the DO
    this.state.setWebSocketAutoResponse(
      new WebSocketRequestResponsePair('{"type":"ping"}', '{"type":"pong"}')
    );

    console.log(`[LiveScoresDO] Initialized with ${this.sessions.size} restored sessions`);
  }

  // ==========================================================================
  // HTTP HANDLER
  // ==========================================================================

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // Internal broadcast endpoint
    if (url.pathname === '/broadcast' && request.method === 'POST') {
      const update = (await request.json()) as ScoreUpdate;
      await this.broadcastUpdate(update);
      return new Response(JSON.stringify({ success: true, recipients: this.sessions.size }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Internal stats endpoint
    if (url.pathname === '/stats') {
      const stats = this.getConnectionStats();
      return new Response(JSON.stringify(stats), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // WebSocket upgrade request
    const upgradeHeader = request.headers.get('Upgrade');
    if (upgradeHeader !== 'websocket') {
      return new Response('Expected WebSocket', { status: 426 });
    }

    // Parse initial filter from query params
    const initialFilter = this.parseFilterFromUrl(url);

    // Create WebSocket pair
    const [client, server] = Object.values(new WebSocketPair());

    // Accept with hibernation support
    // This is the key API that enables hibernation
    this.state.acceptWebSocket(server);

    // Create session data
    const sessionId = crypto.randomUUID();
    const sessionData: SessionData = {
      id: sessionId,
      filter: initialFilter,
      connectedAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
    };

    // Serialize session data to survive hibernation
    // Limited to 2KB, so keep it lean
    server.serializeAttachment(sessionData);
    this.sessions.set(server, sessionData);

    // Send welcome message
    server.send(
      JSON.stringify({
        type: 'connected',
        data: {
          sessionId,
          filter: initialFilter,
          message: 'Connected to BlazeSportsIntel Live Scores',
        },
      } as ServerMessage)
    );

    console.log(`[LiveScoresDO] New connection: ${sessionId}, total: ${this.sessions.size}`);

    return new Response(null, { status: 101, webSocket: client });
  }

  // ==========================================================================
  // WEBSOCKET HIBERNATION HANDLERS
  // ==========================================================================

  /**
   * Called when WebSocket receives a message
   * This wakes the DO from hibernation if it was sleeping
   */
  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
    let session = this.sessions.get(ws);

    // Restore session if needed (after hibernation wake)
    if (!session) {
      try {
        const attachment = ws.deserializeAttachment() as SessionData | null;
        if (attachment) {
          session = attachment;
          this.sessions.set(ws, session);
        }
      } catch {
        // Session lost, close connection
        ws.close(1011, 'Session expired');
        return;
      }
    }

    if (!session) {
      ws.close(1011, 'No session found');
      return;
    }

    // Update last activity
    session.lastActivity = new Date().toISOString();
    ws.serializeAttachment(session);

    // Parse message
    let msg: ClientMessage;
    try {
      msg = JSON.parse(message as string);
    } catch {
      this.sendError(ws, 'Invalid JSON message');
      return;
    }

    // Handle message types
    switch (msg.type) {
      case 'subscribe':
        await this.handleSubscribe(ws, session, msg);
        break;

      case 'unsubscribe':
        await this.handleUnsubscribe(ws, session, msg);
        break;

      case 'get_state':
        await this.handleGetState(ws, session, msg);
        break;

      case 'ping':
        // Handled by auto-response, but handle manually if it comes through
        ws.send(JSON.stringify({ type: 'pong', requestId: msg.requestId }));
        break;

      default:
        this.sendError(ws, `Unknown message type: ${(msg as any).type}`);
    }
  }

  /**
   * Called when WebSocket connection closes
   */
  async webSocketClose(ws: WebSocket, code: number, reason: string): Promise<void> {
    const session = this.sessions.get(ws);
    if (session) {
      console.log(`[LiveScoresDO] Connection closed: ${session.id}, code: ${code}, reason: ${reason}`);
    }
    this.sessions.delete(ws);
  }

  /**
   * Called when WebSocket encounters an error
   */
  async webSocketError(ws: WebSocket, error: unknown): Promise<void> {
    const session = this.sessions.get(ws);
    console.error(`[LiveScoresDO] WebSocket error for ${session?.id}:`, error);
    this.sessions.delete(ws);
  }

  // ==========================================================================
  // MESSAGE HANDLERS
  // ==========================================================================

  private async handleSubscribe(ws: WebSocket, session: SessionData, msg: ClientMessage): Promise<void> {
    if (!msg.filter) {
      this.sendError(ws, 'Missing filter in subscribe message', msg.requestId);
      return;
    }

    // Validate filter
    const validatedFilter = this.validateFilter(msg.filter);
    if (!validatedFilter) {
      this.sendError(ws, 'Invalid filter', msg.requestId);
      return;
    }

    // Update session filter
    session.filter = validatedFilter;
    ws.serializeAttachment(session);
    this.sessions.set(ws, session);

    ws.send(
      JSON.stringify({
        type: 'subscribed',
        requestId: msg.requestId,
        data: { filter: validatedFilter },
      } as ServerMessage)
    );

    console.log(`[LiveScoresDO] ${session.id} subscribed to:`, validatedFilter);
  }

  private async handleUnsubscribe(ws: WebSocket, session: SessionData, msg: ClientMessage): Promise<void> {
    // Reset to default filter (all sports)
    session.filter = { sports: ['all'] };
    ws.serializeAttachment(session);
    this.sessions.set(ws, session);

    ws.send(
      JSON.stringify({
        type: 'unsubscribed',
        requestId: msg.requestId,
      } as ServerMessage)
    );
  }

  private async handleGetState(ws: WebSocket, session: SessionData, msg: ClientMessage): Promise<void> {
    ws.send(
      JSON.stringify({
        type: 'state',
        requestId: msg.requestId,
        data: {
          sessionId: session.id,
          filter: session.filter,
          connectedAt: session.connectedAt,
          lastActivity: session.lastActivity,
          totalConnections: this.sessions.size,
        },
      } as ServerMessage)
    );
  }

  // ==========================================================================
  // BROADCAST LOGIC
  // ==========================================================================

  /**
   * Broadcast score update to all matching subscribers
   */
  private async broadcastUpdate(update: ScoreUpdate): Promise<void> {
    const message = JSON.stringify({
      type: 'score_update',
      data: update,
    } as ServerMessage);

    let sentCount = 0;

    for (const [ws, session] of this.sessions) {
      if (this.matchesFilter(update, session.filter)) {
        try {
          ws.send(message);
          sentCount++;
        } catch (error) {
          console.error(`[LiveScoresDO] Failed to send to ${session.id}:`, error);
          // Don't remove here - let webSocketClose/webSocketError handle cleanup
        }
      }
    }

    console.log(`[LiveScoresDO] Broadcast ${update.type} to ${sentCount}/${this.sessions.size} clients`);
  }

  /**
   * Check if update matches subscriber's filter
   */
  private matchesFilter(update: ScoreUpdate, filter: SubscriptionFilter): boolean {
    // Match sport
    const sportMatch =
      filter.sports.includes('all') || filter.sports.includes(update.sport);

    if (!sportMatch) return false;

    // Match teams (if specified)
    if (filter.teams && filter.teams.length > 0) {
      const teamMatch =
        filter.teams.includes(update.data.homeTeamId) ||
        filter.teams.includes(update.data.awayTeamId) ||
        filter.teams.includes(update.data.homeTeamName) ||
        filter.teams.includes(update.data.awayTeamName);

      if (!teamMatch) return false;
    }

    // Match conference (if specified)
    if (filter.conferences && filter.conferences.length > 0 && update.data.conference) {
      const confMatch = filter.conferences.some(
        (c) => c.toLowerCase() === update.data.conference?.toLowerCase()
      );

      if (!confMatch) return false;
    }

    // Live only filter
    if (filter.liveOnly && update.data.status !== 'LIVE') {
      return false;
    }

    return true;
  }

  // ==========================================================================
  // UTILITY METHODS
  // ==========================================================================

  private parseFilterFromUrl(url: URL): SubscriptionFilter {
    const sports = url.searchParams.get('sports')?.split(',') as SportKey[] | undefined;
    const teams = url.searchParams.get('teams')?.split(',');
    const conferences = url.searchParams.get('conferences')?.split(',');
    const liveOnly = url.searchParams.get('liveOnly') === 'true';

    return {
      sports: sports && sports.length > 0 ? sports : ['all'],
      teams: teams || undefined,
      conferences: conferences || undefined,
      liveOnly,
    };
  }

  private validateFilter(filter: SubscriptionFilter): SubscriptionFilter | null {
    const validSports: SportKey[] = [
      'ncaaf', 'ncaab', 'wcbb', 'nfl', 'nba', 'wnba', 'mlb', 'cbb', 'nhl', 'all',
    ];

    if (!filter.sports || filter.sports.length === 0) {
      filter.sports = ['all'];
    }

    // Validate sports
    const invalidSports = filter.sports.filter((s) => !validSports.includes(s));
    if (invalidSports.length > 0) {
      return null;
    }

    return filter;
  }

  private sendError(ws: WebSocket, error: string, requestId?: string): void {
    ws.send(
      JSON.stringify({
        type: 'error',
        error,
        requestId,
      } as ServerMessage)
    );
  }

  private getConnectionStats(): object {
    const sportCounts: Record<string, number> = {};
    let totalConnections = this.sessions.size;

    for (const [, session] of this.sessions) {
      for (const sport of session.filter.sports) {
        sportCounts[sport] = (sportCounts[sport] || 0) + 1;
      }
    }

    return {
      totalConnections,
      sportCounts,
      timestamp: new Date().toISOString(),
    };
  }
}
