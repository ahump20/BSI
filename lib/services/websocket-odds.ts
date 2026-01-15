/**
 * WebSocket Odds Service
 * Real-time odds updates with connection management
 */

import type {
  OddsUpdate,
  WebSocketConfig,
  WebSocketMessage,
  OddsSubscription,
  OddsHistory,
} from '../types/websocket-odds';
import { DateTime } from 'luxon';

export class WebSocketOddsService {
  private ws: WebSocket | null = null;
  private config: WebSocketConfig;
  private reconnectAttempts = 0;
  private heartbeatTimer?: NodeJS.Timeout;
  private reconnectTimer?: NodeJS.Timeout;
  private messageHandlers: Map<string, (data: any) => void> = new Map();
  private oddsHistory: Map<string, OddsUpdate[]> = new Map();

  constructor(config?: Partial<WebSocketConfig>) {
    this.config = {
      url: config?.url || 'wss://api.sportsgameodds.com/v1/stream',
      reconnectInterval: config?.reconnectInterval || 5000,
      maxRetries: config?.maxRetries || 10,
      heartbeatInterval: config?.heartbeatInterval || 30000,
    };
  }

  /**
   * Connect to WebSocket server
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.config.url);

        this.ws.onopen = () => {
          console.log('[WebSocket] Connected to odds feed');
          this.reconnectAttempts = 0;
          this.startHeartbeat();
          resolve();
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event.data);
        };

        this.ws.onerror = (error) => {
          console.error('[WebSocket] Error:', error);
          reject(error);
        };

        this.ws.onclose = () => {
          console.log('[WebSocket] Connection closed');
          this.stopHeartbeat();
          this.attemptReconnect();
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect(): void {
    this.stopHeartbeat();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * Subscribe to odds updates for specific games
   */
  subscribe(subscription: OddsSubscription): void {
    this.send({
      type: 'subscription',
      data: subscription,
    });
  }

  /**
   * Register handler for odds updates
   */
  onOddsUpdate(handler: (update: OddsUpdate) => void): void {
    this.messageHandlers.set('odds_update', handler);
  }

  /**
   * Get odds history for a game
   */
  getOddsHistory(gameId: string): OddsHistory | null {
    const updates = this.oddsHistory.get(gameId);
    if (!updates || updates.length === 0) {
      return null;
    }

    const currentOdds = updates[updates.length - 1];
    const trend = this.calculateTrend(updates);

    return {
      gameId,
      updates,
      currentOdds,
      trend,
    };
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(data: string): void {
    try {
      const message: WebSocketMessage = JSON.parse(data);

      if (message.type === 'odds_update' && message.data) {
        this.processOddsUpdate(message.data);
      } else if (message.type === 'heartbeat') {
        // Heartbeat received, connection is alive
      } else if (message.type === 'error') {
        console.error('[WebSocket] Server error:', message.error);
      }

      const handler = this.messageHandlers.get(message.type);
      if (handler) {
        handler(message.data);
      }
    } catch (error) {
      console.error('[WebSocket] Failed to parse message:', error);
    }
  }

  /**
   * Process odds update and store in history
   */
  private processOddsUpdate(update: OddsUpdate): void {
    const history = this.oddsHistory.get(update.gameId) || [];
    history.push(update);

    // Keep only last 100 updates per game
    if (history.length > 100) {
      history.shift();
    }

    this.oddsHistory.set(update.gameId, history);
  }

  /**
   * Calculate trend from odds history
   */
  private calculateTrend(
    updates: OddsUpdate[]
  ): 'increasing' | 'decreasing' | 'stable' {
    if (updates.length < 2) {
      return 'stable';
    }

    const recent = updates.slice(-5);
    let increases = 0;
    let decreases = 0;

    for (let i = 1; i < recent.length; i++) {
      const prev = recent[i - 1].odds.spread.line;
      const curr = recent[i].odds.spread.line;

      if (curr > prev) increases++;
      if (curr < prev) decreases++;
    }

    if (increases > decreases) return 'increasing';
    if (decreases > increases) return 'decreasing';
    return 'stable';
  }

  /**
   * Send message to WebSocket server
   */
  private send(message: WebSocketMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('[WebSocket] Cannot send message, not connected');
    }
  }

  /**
   * Start heartbeat to keep connection alive
   */
  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      this.send({ type: 'heartbeat' });
    }, this.config.heartbeatInterval);
  }

  /**
   * Stop heartbeat timer
   */
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
    }
  }

  /**
   * Attempt to reconnect with exponential backoff
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.config.maxRetries) {
      console.error('[WebSocket] Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(
      this.config.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1),
      30000
    );

    console.log(
      `[WebSocket] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.config.maxRetries})`
    );

    this.reconnectTimer = setTimeout(() => {
      this.connect().catch((error) => {
        console.error('[WebSocket] Reconnection failed:', error);
      });
    }, delay);
  }
}

export const webSocketOddsService = new WebSocketOddsService();
