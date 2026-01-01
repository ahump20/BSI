/**
 * BSI Ticker WebSocket Client
 * Browser-ready client for consuming live sports ticker
 *
 * Usage:
 *   const ticker = new BSITickerClient('wss://ticker.blazesportsintel.com/ws');
 *   ticker.subscribe({ leagues: ['MLB', 'NFL'], minPriority: 2 });
 *   ticker.onItem((item) => console.log('New item:', item));
 */

import type { TickerItem, League, TickerType, Priority, WSMessage } from './types';

export interface TickerClientOptions {
  /** Auto-reconnect on disconnect */
  reconnect?: boolean;
  /** Max reconnect attempts */
  maxReconnectAttempts?: number;
  /** Reconnect delay in ms */
  reconnectDelay?: number;
  /** Client heartbeat interval in ms */
  heartbeatInterval?: number;
}

export interface SubscriptionOptions {
  leagues?: League[];
  types?: TickerType[];
  minPriority?: Priority;
}

type ItemCallback = (item: TickerItem) => void;
type BatchCallback = (items: TickerItem[]) => void;
type ErrorCallback = (error: { code: string; message: string }) => void;
type ConnectionCallback = () => void;

export class BSITickerClient {
  private ws: WebSocket | null = null;
  private url: string;
  private options: Required<TickerClientOptions>;
  private reconnectAttempts = 0;
  private heartbeatTimer: number | null = null;
  private isIntentionalClose = false;

  // Callbacks
  private onItemCallbacks: ItemCallback[] = [];
  private onBatchCallbacks: BatchCallback[] = [];
  private onErrorCallbacks: ErrorCallback[] = [];
  private onConnectCallbacks: ConnectionCallback[] = [];
  private onDisconnectCallbacks: ConnectionCallback[] = [];

  // Current subscription
  private currentSubscription: SubscriptionOptions = {};

  constructor(url: string, options: TickerClientOptions = {}) {
    this.url = url;
    this.options = {
      reconnect: options.reconnect ?? true,
      maxReconnectAttempts: options.maxReconnectAttempts ?? 10,
      reconnectDelay: options.reconnectDelay ?? 3000,
      heartbeatInterval: options.heartbeatInterval ?? 25000, // Slightly less than server's 30s
    };
  }

  /**
   * Connect to the ticker WebSocket
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }

      this.isIntentionalClose = false;

      try {
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          this.reconnectAttempts = 0;
          this.startHeartbeat();
          this.onConnectCallbacks.forEach((cb) => cb());

          // Re-apply subscription if reconnecting
          if (Object.keys(this.currentSubscription).length > 0) {
            this.subscribe(this.currentSubscription);
          }

          resolve();
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event.data);
        };

        this.ws.onclose = () => {
          this.stopHeartbeat();
          this.onDisconnectCallbacks.forEach((cb) => cb());

          if (!this.isIntentionalClose && this.options.reconnect) {
            this.attemptReconnect();
          }
        };

        this.ws.onerror = (error) => {
          console.error('BSI Ticker WebSocket error:', error);
          reject(error);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Disconnect from the ticker WebSocket
   */
  disconnect(): void {
    this.isIntentionalClose = true;
    this.stopHeartbeat();

    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
  }

  /**
   * Subscribe to specific leagues, types, or priorities
   */
  subscribe(options: SubscriptionOptions): void {
    this.currentSubscription = { ...this.currentSubscription, ...options };

    this.send({
      type: 'subscribe',
      payload: options,
      timestamp: Date.now(),
    });
  }

  /**
   * Register callback for individual ticker items
   */
  onItem(callback: ItemCallback): () => void {
    this.onItemCallbacks.push(callback);
    return () => {
      this.onItemCallbacks = this.onItemCallbacks.filter((cb) => cb !== callback);
    };
  }

  /**
   * Register callback for batch updates (initial load, subscription change)
   */
  onBatch(callback: BatchCallback): () => void {
    this.onBatchCallbacks.push(callback);
    return () => {
      this.onBatchCallbacks = this.onBatchCallbacks.filter((cb) => cb !== callback);
    };
  }

  /**
   * Register callback for errors
   */
  onError(callback: ErrorCallback): () => void {
    this.onErrorCallbacks.push(callback);
    return () => {
      this.onErrorCallbacks = this.onErrorCallbacks.filter((cb) => cb !== callback);
    };
  }

  /**
   * Register callback for connection events
   */
  onConnect(callback: ConnectionCallback): () => void {
    this.onConnectCallbacks.push(callback);
    return () => {
      this.onConnectCallbacks = this.onConnectCallbacks.filter((cb) => cb !== callback);
    };
  }

  /**
   * Register callback for disconnection events
   */
  onDisconnect(callback: ConnectionCallback): () => void {
    this.onDisconnectCallbacks.push(callback);
    return () => {
      this.onDisconnectCallbacks = this.onDisconnectCallbacks.filter((cb) => cb !== callback);
    };
  }

  /**
   * Check if connected
   */
  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  // Private methods

  private handleMessage(data: string): void {
    try {
      const message = JSON.parse(data) as WSMessage;

      switch (message.type) {
        case 'ticker_item':
          const item = message.payload as TickerItem;
          this.onItemCallbacks.forEach((cb) => cb(item));
          break;

        case 'ticker_batch':
          const items = message.payload as TickerItem[];
          this.onBatchCallbacks.forEach((cb) => cb(items));
          break;

        case 'error':
          const error = message.payload as { code: string; message: string };
          this.onErrorCallbacks.forEach((cb) => cb(error));
          break;

        case 'heartbeat':
          // Server heartbeat received, respond
          this.send({ type: 'heartbeat', timestamp: Date.now() });
          break;

        case 'ack':
          // Acknowledgment received, no action needed
          break;

        default:
          console.warn('Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('Failed to parse ticker message:', error);
    }
  }

  private send(message: WSMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  private startHeartbeat(): void {
    this.heartbeatTimer = window.setInterval(() => {
      this.send({ type: 'heartbeat', timestamp: Date.now() });
    }, this.options.heartbeatInterval);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.options.maxReconnectAttempts) {
      console.error('BSI Ticker: Max reconnect attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.options.reconnectDelay * Math.pow(1.5, this.reconnectAttempts - 1);

    console.log(`BSI Ticker: Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);

    setTimeout(() => {
      this.connect().catch((error) => {
        console.error('BSI Ticker: Reconnect failed:', error);
      });
    }, delay);
  }
}

// React hook for Next.js/React apps
export function useTickerClient(url: string, options?: TickerClientOptions) {
  // This would need React imports - included as reference
  // In actual implementation, import { useState, useEffect, useRef, useCallback } from 'react';

  /*
  const clientRef = useRef<BSITickerClient | null>(null);
  const [items, setItems] = useState<TickerItem[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const client = new BSITickerClient(url, options);
    clientRef.current = client;

    client.onConnect(() => setIsConnected(true));
    client.onDisconnect(() => setIsConnected(false));
    client.onBatch((batch) => setItems(batch));
    client.onItem((item) => setItems((prev) => [item, ...prev.slice(0, 49)]));

    client.connect();

    return () => {
      client.disconnect();
    };
  }, [url]);

  const subscribe = useCallback((opts: SubscriptionOptions) => {
    clientRef.current?.subscribe(opts);
  }, []);

  return { items, isConnected, subscribe };
  */
}

// Vanilla JS usage example
export const exampleUsage = `
// Initialize client
const ticker = new BSITickerClient('wss://ticker.blazesportsintel.com/ws');

// Set up callbacks before connecting
ticker.onConnect(() => {
  console.log('Connected to BSI Ticker!');
});

ticker.onBatch((items) => {
  console.log('Initial items:', items);
  renderTicker(items);
});

ticker.onItem((item) => {
  console.log('New item:', item.headline);
  prependToTicker(item);
});

ticker.onError((error) => {
  console.error('Ticker error:', error.code, error.message);
});

// Connect
await ticker.connect();

// Subscribe to specific leagues/types
ticker.subscribe({
  leagues: ['MLB', 'NFL'],
  types: ['score', 'news', 'injury'],
  minPriority: 2  // Only breaking (1) and important (2)
});

// Later: disconnect
ticker.disconnect();
`;
