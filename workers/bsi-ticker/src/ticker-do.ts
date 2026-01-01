/**
 * BSI Ticker Room - Durable Object
 * Manages WebSocket connections and real-time ticker broadcasts
 * Supports 1000+ concurrent connections with sub-100ms broadcast latency
 */

import {
  TickerItem,
  WSMessage,
  SubscribeMessage,
  TickerItemMessage,
  TickerBatchMessage,
  HeartbeatMessage,
  ErrorMessage,
  ClientState,
  League,
  TickerType,
  Priority,
  Env,
  ulid,
  MAX_ITEMS,
  HEARTBEAT_INTERVAL_MS,
  CONNECTION_TIMEOUT_MS,
  VALID_LEAGUES,
  VALID_TYPES,
} from './types';

interface WebSocketWithState extends WebSocket {
  clientState?: ClientState;
}

export class TickerRoom implements DurableObject {
  private state: DurableObjectState;
  private env: Env;
  private items: TickerItem[] = [];
  private connections: Map<string, WebSocketWithState> = new Map();
  private heartbeatInterval: number | null = null;

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;

    // Restore items from storage on wake
    this.state.blockConcurrencyWhile(async () => {
      const stored = await this.state.storage.get<TickerItem[]>('items');
      if (stored) {
        this.items = stored;
      }
    });
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // Handle WebSocket upgrade
    if (request.headers.get('Upgrade') === 'websocket') {
      return this.handleWebSocketUpgrade(request);
    }

    // Handle internal API calls from worker
    switch (url.pathname) {
      case '/broadcast':
        return this.handleBroadcast(request);
      case '/items':
        return this.handleGetItems();
      case '/stats':
        return this.handleGetStats();
      default:
        return new Response('Not Found', { status: 404 });
    }
  }

  private handleWebSocketUpgrade(request: Request): Response {
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair) as [WebSocket, WebSocketWithState];

    const connectionId = ulid();
    const clientState: ClientState = {
      id: connectionId,
      subscribedLeagues: new Set(VALID_LEAGUES),
      subscribedTypes: new Set(VALID_TYPES),
      minPriority: 3,
      lastHeartbeat: Date.now(),
      connectedAt: Date.now(),
    };

    server.clientState = clientState;
    this.state.acceptWebSocket(server);
    this.connections.set(connectionId, server);

    // Start heartbeat if first connection
    if (this.connections.size === 1) {
      this.startHeartbeat();
    }

    // Send current items to new client
    this.sendToClient(server, {
      type: 'ticker_batch',
      payload: this.items,
      timestamp: Date.now(),
    } as TickerBatchMessage);

    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(ws: WebSocketWithState, message: string | ArrayBuffer): Promise<void> {
    if (!ws.clientState) return;

    try {
      const data = JSON.parse(message as string) as WSMessage;
      ws.clientState.lastHeartbeat = Date.now();

      switch (data.type) {
        case 'subscribe':
          this.handleSubscribe(ws, data as SubscribeMessage);
          break;
        case 'heartbeat':
          this.sendToClient(ws, {
            type: 'ack',
            timestamp: Date.now(),
          });
          break;
        default:
          this.sendError(ws, 'UNKNOWN_MESSAGE', `Unknown message type: ${data.type}`);
      }
    } catch (error) {
      this.sendError(ws, 'PARSE_ERROR', 'Invalid JSON message');
    }
  }

  async webSocketClose(ws: WebSocketWithState, code: number, reason: string): Promise<void> {
    if (ws.clientState) {
      this.connections.delete(ws.clientState.id);
    }

    // Stop heartbeat if no connections
    if (this.connections.size === 0) {
      this.stopHeartbeat();
    }
  }

  async webSocketError(ws: WebSocketWithState, error: unknown): Promise<void> {
    console.error('WebSocket error:', error);
    if (ws.clientState) {
      this.connections.delete(ws.clientState.id);
    }
  }

  private handleSubscribe(ws: WebSocketWithState, message: SubscribeMessage): void {
    if (!ws.clientState) return;

    const { leagues, types, minPriority } = message.payload || {};

    if (leagues && Array.isArray(leagues)) {
      ws.clientState.subscribedLeagues = new Set(
        leagues.filter((l) => VALID_LEAGUES.includes(l))
      );
    }

    if (types && Array.isArray(types)) {
      ws.clientState.subscribedTypes = new Set(
        types.filter((t) => VALID_TYPES.includes(t))
      );
    }

    if (minPriority && [1, 2, 3].includes(minPriority)) {
      ws.clientState.minPriority = minPriority as Priority;
    }

    // Send filtered items based on new subscription
    const filteredItems = this.items.filter((item) =>
      this.shouldDeliverToClient(ws.clientState!, item)
    );

    this.sendToClient(ws, {
      type: 'ticker_batch',
      payload: filteredItems,
      timestamp: Date.now(),
    } as TickerBatchMessage);

    this.sendToClient(ws, {
      type: 'ack',
      timestamp: Date.now(),
    });
  }

  private async handleBroadcast(request: Request): Promise<Response> {
    try {
      const item = (await request.json()) as TickerItem;

      // Add to items with FIFO eviction
      this.items.unshift(item);
      if (this.items.length > MAX_ITEMS) {
        this.items = this.items.slice(0, MAX_ITEMS);
      }

      // Persist to storage
      await this.state.storage.put('items', this.items);

      // Broadcast to all connected clients
      const message: TickerItemMessage = {
        type: 'ticker_item',
        payload: item,
        timestamp: Date.now(),
      };

      let delivered = 0;
      for (const [id, ws] of this.connections) {
        if (ws.clientState && this.shouldDeliverToClient(ws.clientState, item)) {
          this.sendToClient(ws, message);
          delivered++;
        }
      }

      return Response.json({
        success: true,
        delivered,
        total: this.connections.size,
      });
    } catch (error) {
      return Response.json({ success: false, error: String(error) }, { status: 500 });
    }
  }

  private handleGetItems(): Response {
    return Response.json({
      items: this.items,
      count: this.items.length,
      timestamp: Date.now(),
    });
  }

  private handleGetStats(): Response {
    const stats = {
      connections: this.connections.size,
      items: this.items.length,
      uptime: Date.now() - (this.items[this.items.length - 1]?.timestamp || Date.now()),
      subscriptions: {
        byLeague: {} as Record<string, number>,
        byType: {} as Record<string, number>,
      },
    };

    for (const [, ws] of this.connections) {
      if (ws.clientState) {
        for (const league of ws.clientState.subscribedLeagues) {
          stats.subscriptions.byLeague[league] =
            (stats.subscriptions.byLeague[league] || 0) + 1;
        }
        for (const type of ws.clientState.subscribedTypes) {
          stats.subscriptions.byType[type] =
            (stats.subscriptions.byType[type] || 0) + 1;
        }
      }
    }

    return Response.json(stats);
  }

  private shouldDeliverToClient(clientState: ClientState, item: TickerItem): boolean {
    // Check priority filter
    if (item.priority > clientState.minPriority) {
      return false;
    }

    // Check league filter
    if (!clientState.subscribedLeagues.has(item.league)) {
      return false;
    }

    // Check type filter
    if (!clientState.subscribedTypes.has(item.type)) {
      return false;
    }

    return true;
  }

  private sendToClient(ws: WebSocket, message: WSMessage): void {
    try {
      ws.send(JSON.stringify(message));
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  }

  private sendError(ws: WebSocket, code: string, message: string): void {
    this.sendToClient(ws, {
      type: 'error',
      payload: { code, message },
      timestamp: Date.now(),
    } as ErrorMessage);
  }

  private startHeartbeat(): void {
    if (this.heartbeatInterval) return;

    // Use alarm for hibernation-friendly heartbeat
    this.state.storage.setAlarm(Date.now() + HEARTBEAT_INTERVAL_MS);
  }

  private stopHeartbeat(): void {
    this.state.storage.deleteAlarm();
  }

  async alarm(): Promise<void> {
    const now = Date.now();

    // Send heartbeat to all connections and check for timeouts
    for (const [id, ws] of this.connections) {
      if (!ws.clientState) continue;

      // Check for timeout
      if (now - ws.clientState.lastHeartbeat > CONNECTION_TIMEOUT_MS) {
        ws.close(1000, 'Connection timeout');
        this.connections.delete(id);
        continue;
      }

      // Send heartbeat
      this.sendToClient(ws, {
        type: 'heartbeat',
        payload: {
          serverTime: now,
          connectionId: id,
        },
        timestamp: now,
      } as HeartbeatMessage);
    }

    // Schedule next heartbeat if connections exist
    if (this.connections.size > 0) {
      this.state.storage.setAlarm(now + HEARTBEAT_INTERVAL_MS);
    }
  }
}

export default TickerRoom;
