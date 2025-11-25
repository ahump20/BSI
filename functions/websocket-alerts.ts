/**
 * Cloudflare Durable Objects for WebSocket Alert Broadcasting
 * Manages persistent WebSocket connections and real-time alert delivery
 *
 * Features:
 * - Distributed state management across Cloudflare edge network
 * - Real-time game state broadcasting to connected clients
 * - Smart alert delivery with user preference filtering
 * - Connection health monitoring with automatic cleanup
 * - Hibernation API support for efficient resource usage
 *
 * Integration Points:
 * - WinProbabilityChart.tsx (live game updates)
 * - SmartAlertEngine (alert delivery)
 * - LiveWinProbabilityEngine (win probability updates)
 *
 * Architecture:
 * - One Durable Object per game for game state broadcasting
 * - One Durable Object per user for personalized alerts
 * - Automatic hibernation for inactive connections
 * - Memory-efficient state management with periodic snapshots
 *
 * Data Source: Real-time game feeds via WebSocket upstream
 * Last Updated: October 19, 2025
 * Timezone: America/Chicago
 */

import { DurableObject } from 'cloudflare:workers';
import type { GameState, WinProbability, Alert, AlertPreferences } from '../lib/types';
import { LiveWinProbabilityEngine } from '../lib/analytics/baseball/win-probability-engine';
import { alertEngine } from '../lib/notifications/smart-alert-engine';

// ============================================================================
// Type Definitions
// ============================================================================

interface WebSocketMessage {
  type: 'game_update' | 'alert' | 'subscribe' | 'unsubscribe' | 'ping' | 'pong';
  data?: any;
  timestamp: string;
}

interface ConnectionMetadata {
  userId?: string;
  gameIds: Set<string>;
  alertPreferences?: AlertPreferences;
  connectedAt: string;
  lastActivity: string;
}

interface GameStateSnapshot {
  gameState: GameState;
  winProbability: WinProbability;
  lastUpdated: string;
  subscriberCount: number;
}

// ============================================================================
// GameBroadcaster Durable Object
// Manages WebSocket connections for a single game's live updates
// ============================================================================

export class GameBroadcaster extends DurableObject {
  private sessions: Map<WebSocket, ConnectionMetadata>;
  private gameState: GameState | null;
  private winProbability: WinProbability | null;
  private lastBroadcast: number;
  private broadcastInterval: number = 1000; // 1 second minimum between broadcasts

  constructor(state: DurableObjectState, env: Env) {
    super(state, env);
    this.sessions = new Map();
    this.gameState = null;
    this.winProbability = null;
    this.lastBroadcast = 0;

    // Initialize state from storage
    this.state.blockConcurrencyWhile(async () => {
      const stored = await this.state.storage.get<GameStateSnapshot>('snapshot');
      if (stored) {
        this.gameState = stored.gameState;
        this.winProbability = stored.winProbability;
      }
    });
  }

  /**
   * Handle incoming HTTP requests for WebSocket upgrades
   */
  async fetch(request: Request): Promise<Response> {
    // Handle WebSocket upgrade
    if (request.headers.get('Upgrade') === 'websocket') {
      const pair = new WebSocketPair();
      const [client, server] = Object.values(pair);

      await this.handleWebSocketConnection(server, request);

      return new Response(null, {
        status: 101,
        webSocket: client,
      });
    }

    // Handle HTTP requests for game state queries
    const url = new URL(request.url);

    if (url.pathname.endsWith('/state')) {
      return this.getGameState();
    }

    if (url.pathname.endsWith('/subscribers')) {
      return this.getSubscriberCount();
    }

    return new Response('Not found', { status: 404 });
  }

  /**
   * Handle new WebSocket connection
   */
  private async handleWebSocketConnection(webSocket: WebSocket, request: Request): Promise<void> {
    // Accept the WebSocket connection
    this.ctx.acceptWebSocket(webSocket);

    // Extract user info from request
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId') || undefined;

    // Initialize connection metadata
    const metadata: ConnectionMetadata = {
      userId,
      gameIds: new Set(),
      connectedAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
    };

    this.sessions.set(webSocket, metadata);

    // Send current game state immediately if available
    if (this.gameState && this.winProbability) {
      this.sendMessage(webSocket, {
        type: 'game_update',
        data: {
          gameState: this.gameState,
          winProbability: this.winProbability,
        },
        timestamp: new Date().toISOString(),
      });
    }

    console.log(`WebSocket connected: ${this.sessions.size} active connections`);
  }

  /**
   * Handle WebSocket messages
   */
  async webSocketMessage(webSocket: WebSocket, message: string | ArrayBuffer): Promise<void> {
    try {
      const data: WebSocketMessage =
        typeof message === 'string'
          ? JSON.parse(message)
          : JSON.parse(new TextDecoder().decode(message as ArrayBuffer));

      const metadata = this.sessions.get(webSocket);
      if (!metadata) {
        console.error('WebSocket metadata not found');
        return;
      }

      // Update last activity
      metadata.lastActivity = new Date().toISOString();

      switch (data.type) {
        case 'subscribe':
          await this.handleSubscribe(webSocket, metadata, data.data);
          break;

        case 'unsubscribe':
          await this.handleUnsubscribe(webSocket, metadata, data.data);
          break;

        case 'ping':
          this.sendMessage(webSocket, {
            type: 'pong',
            timestamp: new Date().toISOString(),
          });
          break;

        default:
          console.warn('Unknown message type:', data.type);
      }
    } catch (error) {
      console.error('Error processing WebSocket message:', error);
    }
  }

  /**
   * Handle WebSocket close
   */
  async webSocketClose(
    webSocket: WebSocket,
    code: number,
    reason: string,
    wasClean: boolean
  ): Promise<void> {
    this.sessions.delete(webSocket);
    console.log(`WebSocket closed: ${this.sessions.size} active connections`);

    // Clean up if no more connections
    if (this.sessions.size === 0) {
      // Persist final state before hibernation
      await this.persistState();
    }
  }

  /**
   * Handle WebSocket error
   */
  async webSocketError(webSocket: WebSocket, error: Error): Promise<void> {
    console.error('WebSocket error:', error);
    this.sessions.delete(webSocket);
  }

  /**
   * Handle subscribe request
   */
  private async handleSubscribe(
    webSocket: WebSocket,
    metadata: ConnectionMetadata,
    data: any
  ): Promise<void> {
    const { gameId } = data;

    if (!gameId) {
      this.sendError(webSocket, 'Missing gameId in subscribe request');
      return;
    }

    metadata.gameIds.add(gameId);

    this.sendMessage(webSocket, {
      type: 'subscribe',
      data: { gameId, success: true },
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Handle unsubscribe request
   */
  private async handleUnsubscribe(
    webSocket: WebSocket,
    metadata: ConnectionMetadata,
    data: any
  ): Promise<void> {
    const { gameId } = data;

    if (!gameId) {
      this.sendError(webSocket, 'Missing gameId in unsubscribe request');
      return;
    }

    metadata.gameIds.delete(gameId);

    this.sendMessage(webSocket, {
      type: 'unsubscribe',
      data: { gameId, success: true },
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Broadcast game state update to all connected clients
   */
  async broadcastGameUpdate(gameState: GameState): Promise<void> {
    // Rate limiting: only broadcast once per second
    const now = Date.now();
    if (now - this.lastBroadcast < this.broadcastInterval) {
      return;
    }
    this.lastBroadcast = now;

    // Calculate win probability
    const winProbability = LiveWinProbabilityEngine.calculateWinProbability(gameState);

    // Update internal state
    this.gameState = gameState;
    this.winProbability = winProbability;

    // Broadcast to all connected clients
    const message: WebSocketMessage = {
      type: 'game_update',
      data: {
        gameState,
        winProbability,
      },
      timestamp: new Date().toISOString(),
    };

    let activeCount = 0;
    this.sessions.forEach((metadata, webSocket) => {
      if (metadata.gameIds.has(gameState.gameId)) {
        this.sendMessage(webSocket, message);
        activeCount++;
      }
    });

    console.log(`Broadcasted game update to ${activeCount} clients`);

    // Persist state periodically
    await this.persistState();
  }

  /**
   * Send message to specific WebSocket client
   */
  private sendMessage(webSocket: WebSocket, message: WebSocketMessage): void {
    try {
      webSocket.send(JSON.stringify(message));
    } catch (error) {
      console.error('Error sending WebSocket message:', error);
    }
  }

  /**
   * Send error message to client
   */
  private sendError(webSocket: WebSocket, error: string): void {
    this.sendMessage(webSocket, {
      type: 'error' as any,
      data: { error },
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Get current game state (HTTP endpoint)
   */
  private getGameState(): Response {
    if (!this.gameState || !this.winProbability) {
      return Response.json({ error: 'No game state available' }, { status: 404 });
    }

    return Response.json({
      gameState: this.gameState,
      winProbability: this.winProbability,
      subscriberCount: this.sessions.size,
      lastUpdated: this.winProbability.lastUpdated,
    });
  }

  /**
   * Get subscriber count (HTTP endpoint)
   */
  private getSubscriberCount(): Response {
    return Response.json({
      count: this.sessions.size,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Persist state to Durable Object storage
   */
  private async persistState(): Promise<void> {
    if (!this.gameState || !this.winProbability) {
      return;
    }

    const snapshot: GameStateSnapshot = {
      gameState: this.gameState,
      winProbability: this.winProbability,
      lastUpdated: new Date().toISOString(),
      subscriberCount: this.sessions.size,
    };

    await this.state.storage.put('snapshot', snapshot);
  }

  /**
   * Alarm handler for periodic cleanup
   */
  async alarm(): Promise<void> {
    // Clean up stale connections (no activity in 5 minutes)
    const staleThreshold = Date.now() - 5 * 60 * 1000;
    const staleConnections: WebSocket[] = [];

    this.sessions.forEach((metadata, webSocket) => {
      const lastActivity = new Date(metadata.lastActivity).getTime();
      if (lastActivity < staleThreshold) {
        staleConnections.push(webSocket);
      }
    });

    staleConnections.forEach((webSocket) => {
      webSocket.close(1000, 'Connection timeout');
      this.sessions.delete(webSocket);
    });

    if (staleConnections.length > 0) {
      console.log(`Cleaned up ${staleConnections.length} stale connections`);
    }

    // Schedule next alarm
    await this.state.storage.setAlarm(Date.now() + 60 * 1000); // 1 minute
  }
}

// ============================================================================
// AlertBroadcaster Durable Object
// Manages personalized alerts for a single user
// ============================================================================

export class AlertBroadcaster extends DurableObject {
  private webSocket: WebSocket | null;
  private userId: string | null;
  private alertPreferences: AlertPreferences | null;
  private connectedAt: string | null;
  private alertQueue: Alert[];

  constructor(state: DurableObjectState, env: Env) {
    super(state, env);
    this.webSocket = null;
    this.userId = null;
    this.alertPreferences = null;
    this.connectedAt = null;
    this.alertQueue = [];

    // Initialize from storage
    this.state.blockConcurrencyWhile(async () => {
      const stored = await this.state.storage.get<{
        userId: string;
        preferences: AlertPreferences;
        queue: Alert[];
      }>('user_data');

      if (stored) {
        this.userId = stored.userId;
        this.alertPreferences = stored.preferences;
        this.alertQueue = stored.queue || [];
      }
    });
  }

  /**
   * Handle incoming HTTP requests
   */
  async fetch(request: Request): Promise<Response> {
    // Handle WebSocket upgrade
    if (request.headers.get('Upgrade') === 'websocket') {
      const pair = new WebSocketPair();
      const [client, server] = Object.values(pair);

      await this.handleWebSocketConnection(server, request);

      return new Response(null, {
        status: 101,
        webSocket: client,
      });
    }

    const url = new URL(request.url);

    // Handle alert preferences update
    if (url.pathname.endsWith('/preferences') && request.method === 'PUT') {
      return this.updatePreferences(request);
    }

    // Handle alert queue query
    if (url.pathname.endsWith('/queue')) {
      return this.getAlertQueue();
    }

    return new Response('Not found', { status: 404 });
  }

  /**
   * Handle WebSocket connection
   */
  private async handleWebSocketConnection(webSocket: WebSocket, request: Request): Promise<void> {
    this.ctx.acceptWebSocket(webSocket);

    const url = new URL(request.url);
    this.userId = url.searchParams.get('userId');
    this.connectedAt = new Date().toISOString();

    this.webSocket = webSocket;

    // Send any queued alerts
    await this.flushAlertQueue();

    console.log(`Alert WebSocket connected for user: ${this.userId}`);
  }

  /**
   * Handle WebSocket messages
   */
  async webSocketMessage(webSocket: WebSocket, message: string | ArrayBuffer): Promise<void> {
    try {
      const data: WebSocketMessage =
        typeof message === 'string'
          ? JSON.parse(message)
          : JSON.parse(new TextDecoder().decode(message as ArrayBuffer));

      switch (data.type) {
        case 'ping':
          this.sendMessage({
            type: 'pong',
            timestamp: new Date().toISOString(),
          });
          break;

        default:
          console.warn('Unknown message type:', data.type);
      }
    } catch (error) {
      console.error('Error processing WebSocket message:', error);
    }
  }

  /**
   * Handle WebSocket close
   */
  async webSocketClose(
    webSocket: WebSocket,
    code: number,
    reason: string,
    wasClean: boolean
  ): Promise<void> {
    this.webSocket = null;
    console.log(`Alert WebSocket closed for user: ${this.userId}`);

    // Persist state before hibernation
    await this.persistState();
  }

  /**
   * Handle WebSocket error
   */
  async webSocketError(webSocket: WebSocket, error: Error): Promise<void> {
    console.error('Alert WebSocket error:', error);
    this.webSocket = null;
  }

  /**
   * Send alert to user
   */
  async sendAlert(alert: Alert): Promise<void> {
    // Check if alert matches user preferences
    if (this.alertPreferences && !this.shouldSendAlert(alert)) {
      console.log(`Alert filtered by preferences: ${alert.type}`);
      return;
    }

    // If WebSocket is connected, send immediately
    if (this.webSocket) {
      this.sendMessage({
        type: 'alert',
        data: alert,
        timestamp: new Date().toISOString(),
      });
    } else {
      // Otherwise, queue for later delivery
      this.alertQueue.push(alert);
      await this.persistState();
    }
  }

  /**
   * Check if alert should be sent based on preferences
   */
  private shouldSendAlert(alert: Alert): boolean {
    if (!this.alertPreferences) {
      return true;
    }

    // Check if alert type is enabled
    const alertTypeKey = alert.type.replace('_', '') as keyof AlertPreferences['alertTypes'];
    if (!this.alertPreferences.alertTypes[alertTypeKey]) {
      return false;
    }

    // Check quiet hours
    if (this.alertPreferences.quietHours) {
      const now = new Date()
        .toLocaleString('en-US', {
          timeZone: 'America/Chicago',
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
        })
        .split(', ')[1];

      const { start, end } = this.alertPreferences.quietHours;

      // Handle overnight quiet hours
      const isQuietTime = start > end ? now >= start || now < end : now >= start && now < end;

      if (isQuietTime) {
        return false;
      }
    }

    return true;
  }

  /**
   * Send queued alerts
   */
  private async flushAlertQueue(): Promise<void> {
    if (!this.webSocket || this.alertQueue.length === 0) {
      return;
    }

    const alerts = [...this.alertQueue];
    this.alertQueue = [];

    for (const alert of alerts) {
      this.sendMessage({
        type: 'alert',
        data: alert,
        timestamp: new Date().toISOString(),
      });
    }

    await this.persistState();
  }

  /**
   * Send message to WebSocket client
   */
  private sendMessage(message: WebSocketMessage): void {
    if (!this.webSocket) {
      return;
    }

    try {
      this.webSocket.send(JSON.stringify(message));
    } catch (error) {
      console.error('Error sending alert message:', error);
    }
  }

  /**
   * Update alert preferences (HTTP endpoint)
   */
  private async updatePreferences(request: Request): Promise<Response> {
    try {
      const preferences: AlertPreferences = await request.json();
      this.alertPreferences = preferences;
      await this.persistState();

      return Response.json({
        success: true,
        preferences,
      });
    } catch (error) {
      return Response.json({ error: 'Invalid preferences data' }, { status: 400 });
    }
  }

  /**
   * Get alert queue (HTTP endpoint)
   */
  private getAlertQueue(): Response {
    return Response.json({
      queue: this.alertQueue,
      count: this.alertQueue.length,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Persist state to storage
   */
  private async persistState(): Promise<void> {
    if (!this.userId) {
      return;
    }

    await this.state.storage.put('user_data', {
      userId: this.userId,
      preferences: this.alertPreferences,
      queue: this.alertQueue,
    });
  }

  /**
   * Alarm handler for queue management
   */
  async alarm(): Promise<void> {
    // Clear old alerts from queue (older than 1 hour)
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    this.alertQueue = this.alertQueue.filter((alert) => {
      const alertTime = new Date(alert.timestamp).getTime();
      return alertTime > oneHourAgo;
    });

    if (this.alertQueue.length > 0) {
      await this.persistState();
    }

    // Schedule next alarm
    await this.state.storage.setAlarm(Date.now() + 60 * 1000); // 1 minute
  }
}

// ============================================================================
// Worker Script for Routing
// ============================================================================

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // Route to GameBroadcaster for game-specific WebSocket connections
    if (url.pathname.startsWith('/ws/game/')) {
      const gameId = url.pathname.split('/').pop();
      if (!gameId) {
        return new Response('Missing game ID', { status: 400 });
      }

      const id = env.GAME_BROADCASTER.idFromName(gameId);
      const stub = env.GAME_BROADCASTER.get(id);
      return stub.fetch(request);
    }

    // Route to AlertBroadcaster for user-specific alert connections
    if (url.pathname.startsWith('/ws/alerts/')) {
      const userId = url.pathname.split('/').pop();
      if (!userId) {
        return new Response('Missing user ID', { status: 400 });
      }

      const id = env.ALERT_BROADCASTER.idFromName(userId);
      const stub = env.ALERT_BROADCASTER.get(id);
      return stub.fetch(request);
    }

    // Health check endpoint
    if (url.pathname === '/health') {
      return Response.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
      });
    }

    return new Response('Not found', { status: 404 });
  },
};

// ============================================================================
// Environment Types
// ============================================================================

interface Env {
  GAME_BROADCASTER: DurableObjectNamespace;
  ALERT_BROADCASTER: DurableObjectNamespace;
}
