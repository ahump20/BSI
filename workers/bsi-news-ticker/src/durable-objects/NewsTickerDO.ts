/**
 * NewsTickerDO - Durable Object for managing live sports ticker state
 *
 * Handles:
 * - WebSocket connections for real-time updates
 * - State persistence across requests
 * - Item deduplication and expiry
 * - Priority-based sorting
 */

export interface TickerItem {
  id: string;
  type: 'score' | 'news' | 'alert' | 'injury' | 'trade';
  sport: 'MLB' | 'NFL' | 'NBA' | 'CFB' | 'COLLEGE_BASEBALL';
  headline: string;
  subtext?: string;
  priority: number; // 1 = breaking, 2 = important, 3 = standard
  timestamp: number;
  ttl: number; // seconds until expiry
  source: string;
}

interface TickerState {
  items: TickerItem[];
  lastUpdated: number;
}

export class NewsTickerDO {
  private state: DurableObjectState;
  private sessions: Set<WebSocket>;
  private tickerItems: Map<string, TickerItem>;

  constructor(state: DurableObjectState) {
    this.state = state;
    this.sessions = new Set();
    this.tickerItems = new Map();

    // Load persisted state on init
    this.state.blockConcurrencyWhile(async () => {
      const stored = await this.state.storage.get<TickerState>('ticker');
      if (stored) {
        for (const item of stored.items) {
          this.tickerItems.set(item.id, item);
        }
      }
    });

    // Set up alarm for cleanup (runs every minute)
    this.state.storage.setAlarm(Date.now() + 60000);
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // WebSocket upgrade for live connections
    if (request.headers.get('Upgrade') === 'websocket') {
      const pair = new WebSocketPair();
      const [client, server] = Object.values(pair);

      this.handleWebSocket(server);

      return new Response(null, {
        status: 101,
        webSocket: client,
      });
    }

    // REST: Get all current items
    if (url.pathname === '/items' || url.pathname === '/') {
      const items = this.getSortedItems();
      return new Response(
        JSON.stringify({ items, count: items.length, connected: this.sessions.size }),
        {
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // REST: Add a new item
    if (url.pathname === '/add' && request.method === 'POST') {
      const item = (await request.json()) as TickerItem;
      await this.addItem(item);
      return new Response(JSON.stringify({ success: true, id: item.id }));
    }

    // REST: Remove an item
    if (url.pathname === '/remove' && request.method === 'POST') {
      const { id } = (await request.json()) as { id: string };
      this.tickerItems.delete(id);
      await this.persistState();
      this.broadcast({ type: 'remove', id });
      return new Response(JSON.stringify({ success: true }));
    }

    // REST: Clear all items
    if (url.pathname === '/clear' && request.method === 'POST') {
      this.tickerItems.clear();
      await this.persistState();
      this.broadcast({ type: 'clear' });
      return new Response(JSON.stringify({ success: true }));
    }

    return new Response('NewsTickerDO - Blaze Sports Intel', { status: 200 });
  }

  private handleWebSocket(ws: WebSocket): void {
    ws.accept();
    this.sessions.add(ws);

    // Send current items immediately on connection
    const items = this.getSortedItems();
    ws.send(
      JSON.stringify({
        type: 'init',
        items,
        timestamp: Date.now(),
      })
    );

    ws.addEventListener('message', async (event) => {
      try {
        const data = JSON.parse(event.data as string);

        // Handle ping/pong for keepalive
        if (data.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
        }

        // Handle client requesting refresh
        if (data.type === 'refresh') {
          const items = this.getSortedItems();
          ws.send(JSON.stringify({ type: 'refresh', items }));
        }
      } catch (e) {
        // Ignore malformed messages
      }
    });

    ws.addEventListener('close', () => {
      this.sessions.delete(ws);
    });

    ws.addEventListener('error', () => {
      this.sessions.delete(ws);
    });
  }

  private async addItem(item: TickerItem): Promise<void> {
    // Dedupe: check if item already exists
    if (this.tickerItems.has(item.id)) {
      const existing = this.tickerItems.get(item.id)!;
      // Only update if newer timestamp
      if (item.timestamp <= existing.timestamp) {
        return;
      }
    }

    // Add/update the item
    this.tickerItems.set(item.id, item);

    // Keep only most recent 50 items to prevent unbounded growth
    if (this.tickerItems.size > 50) {
      const sorted = Array.from(this.tickerItems.entries()).sort(
        (a, b) => b[1].timestamp - a[1].timestamp
      );

      // Remove oldest items beyond 50
      for (let i = 50; i < sorted.length; i++) {
        this.tickerItems.delete(sorted[i][0]);
      }
    }

    // Persist to durable storage
    await this.persistState();

    // Broadcast to all connected clients
    this.broadcast({
      type: 'add',
      item,
      timestamp: Date.now(),
    });
  }

  private getSortedItems(): TickerItem[] {
    const now = Date.now();
    const items: TickerItem[] = [];

    // Filter out expired items
    for (const item of this.tickerItems.values()) {
      const expiresAt = item.timestamp + item.ttl * 1000;
      if (expiresAt > now) {
        items.push(item);
      }
    }

    // Sort by priority (1 first), then by timestamp (newest first)
    items.sort((a, b) => {
      if (a.priority !== b.priority) {
        return a.priority - b.priority;
      }
      return b.timestamp - a.timestamp;
    });

    // Return top 20 items for display
    return items.slice(0, 20);
  }

  private broadcast(message: object): void {
    const json = JSON.stringify(message);
    const deadSessions: WebSocket[] = [];

    for (const ws of this.sessions) {
      try {
        ws.send(json);
      } catch {
        deadSessions.push(ws);
      }
    }

    // Clean up dead sessions
    for (const ws of deadSessions) {
      this.sessions.delete(ws);
    }
  }

  private async persistState(): Promise<void> {
    const items = Array.from(this.tickerItems.values());
    await this.state.storage.put<TickerState>('ticker', {
      items,
      lastUpdated: Date.now(),
    });
  }

  // Alarm handler for periodic cleanup
  async alarm(): Promise<void> {
    const now = Date.now();
    let changed = false;

    // Remove expired items
    for (const [id, item] of this.tickerItems) {
      const expiresAt = item.timestamp + item.ttl * 1000;
      if (expiresAt <= now) {
        this.tickerItems.delete(id);
        changed = true;
      }
    }

    if (changed) {
      await this.persistState();

      // Notify clients of refresh
      this.broadcast({
        type: 'refresh',
        items: this.getSortedItems(),
        timestamp: Date.now(),
      });
    }

    // Schedule next alarm (every 60 seconds)
    await this.state.storage.setAlarm(Date.now() + 60000);
  }
}
