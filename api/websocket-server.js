#!/usr/bin/env node

/**
 * WebSocket Server for Real-time Sports Updates
 * Provides live score updates, game events, and analytics
 */

import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import express from 'express';
import SportsSyncService from '../scripts/sync-sports-data.js';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

class RealTimeServer {
  constructor() {
    this.app = express();
    this.server = createServer(this.app);
    this.wss = new WebSocketServer({ server: this.server });
    this.syncService = new SportsSyncService();

    this.db = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'blazesportsintel',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres'
    });

    this.clients = new Set();
    this.subscriptions = new Map(); // client -> [gameIds]

    this.setupWebSocket();
    this.setupEventListeners();
    this.setupHttpRoutes();
  }

  setupWebSocket() {
    this.wss.on('connection', (ws, req) => {
      const clientId = this.generateClientId();
      const client = { id: clientId, ws, alive: true };

      this.clients.add(client);
      this.subscriptions.set(clientId, []);

      console.log(`✅ Client connected: ${clientId} (Total: ${this.clients.size})`);

      // Send welcome message
      ws.send(JSON.stringify({
        type: 'connection',
        message: 'Connected to BSI Real-time Server',
        clientId,
        timestamp: new Date().toISOString()
      }));

      // Handle client messages
      ws.on('message', (message) => {
        this.handleClientMessage(client, message);
      });

      // Handle pong for keepalive
      ws.on('pong', () => {
        client.alive = true;
      });

      // Handle disconnection
      ws.on('close', () => {
        this.clients.delete(client);
        this.subscriptions.delete(clientId);
        console.log(`❌ Client disconnected: ${clientId} (Total: ${this.clients.size})`);
      });

      // Handle errors
      ws.on('error', (error) => {
        console.error(`WebSocket error for ${clientId}:`, error.message);
      });
    });

    // Keepalive ping every 30 seconds
    setInterval(() => {
      this.wss.clients.forEach((ws) => {
        const client = Array.from(this.clients).find(c => c.ws === ws);
        if (client) {
          if (!client.alive) {
            ws.terminate();
            this.clients.delete(client);
          } else {
            client.alive = false;
            ws.ping();
          }
        }
      });
    }, 30000);
  }

  setupEventListeners() {
    // Listen to sync service events
    this.syncService.on('liveScoreUpdate', (data) => {
      this.broadcastToSubscribers(data.gameId, {
        type: 'liveScore',
        ...data
      });
    });

    this.syncService.on('liveGameUpdate', (data) => {
      this.broadcastToSubscribers(data.gameId, {
        type: 'gameUpdate',
        ...data
      });
    });

    // Poll for live game updates every 10 seconds
    setInterval(() => this.checkLiveGames(), 10000);

    // Poll for score changes every 30 seconds
    setInterval(() => this.checkScoreChanges(), 30000);
  }

  setupHttpRoutes() {
    // SSE endpoint for clients that don't support WebSocket
    this.app.get('/events', (req, res) => {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*'
      });

      const sendSSE = (data) => {
        res.write(`data: ${JSON.stringify(data)}\n\n`);
      };

      // Send initial connection message
      sendSSE({ type: 'connected', timestamp: new Date().toISOString() });

      // Keep connection alive
      const keepAlive = setInterval(() => {
        res.write(':heartbeat\n\n');
      }, 30000);

      req.on('close', () => {
        clearInterval(keepAlive);
      });
    });

    // Health check
    this.app.get('/ws-health', (req, res) => {
      res.json({
        status: 'healthy',
        clients: this.clients.size,
        uptime: process.uptime()
      });
    });
  }

  async handleClientMessage(client, message) {
    try {
      const data = JSON.parse(message);

      switch (data.type) {
        case 'subscribe':
          await this.handleSubscribe(client, data);
          break;

        case 'unsubscribe':
          await this.handleUnsubscribe(client, data);
          break;

        case 'getLiveGames':
          await this.sendLiveGames(client);
          break;

        case 'getGameDetails':
          await this.sendGameDetails(client, data.gameId);
          break;

        case 'ping':
          client.ws.send(JSON.stringify({ type: 'pong' }));
          break;

        default:
          client.ws.send(JSON.stringify({
            type: 'error',
            message: `Unknown message type: ${data.type}`
          }));
      }
    } catch (error) {
      console.error('Error handling client message:', error);
      client.ws.send(JSON.stringify({
        type: 'error',
        message: 'Invalid message format'
      }));
    }
  }

  async handleSubscribe(client, data) {
    const { gameId, sport, team } = data;
    const subscriptions = this.subscriptions.get(client.id) || [];

    if (gameId) {
      // Subscribe to specific game
      if (!subscriptions.includes(gameId)) {
        subscriptions.push(gameId);
        this.subscriptions.set(client.id, subscriptions);

        client.ws.send(JSON.stringify({
          type: 'subscribed',
          gameId,
          message: `Subscribed to game ${gameId}`
        }));

        // Send current game state
        await this.sendGameDetails(client, gameId);
      }
    } else if (team) {
      // Subscribe to all games for a team
      const games = await this.getTeamGames(team);
      games.forEach(game => {
        if (!subscriptions.includes(game.id)) {
          subscriptions.push(game.id);
        }
      });
      this.subscriptions.set(client.id, subscriptions);

      client.ws.send(JSON.stringify({
        type: 'subscribed',
        team,
        games: games.length,
        message: `Subscribed to ${games.length} ${team} games`
      }));
    } else if (sport) {
      // Subscribe to all games for a sport
      const games = await this.getSportGames(sport);
      games.forEach(game => {
        if (!subscriptions.includes(game.id)) {
          subscriptions.push(game.id);
        }
      });
      this.subscriptions.set(client.id, subscriptions);

      client.ws.send(JSON.stringify({
        type: 'subscribed',
        sport,
        games: games.length,
        message: `Subscribed to ${games.length} ${sport} games`
      }));
    }
  }

  async handleUnsubscribe(client, data) {
    const { gameId } = data;
    const subscriptions = this.subscriptions.get(client.id) || [];

    if (gameId === '*') {
      // Unsubscribe from all
      this.subscriptions.set(client.id, []);
      client.ws.send(JSON.stringify({
        type: 'unsubscribed',
        message: 'Unsubscribed from all games'
      }));
    } else {
      // Unsubscribe from specific game
      const index = subscriptions.indexOf(gameId);
      if (index > -1) {
        subscriptions.splice(index, 1);
        this.subscriptions.set(client.id, subscriptions);
        client.ws.send(JSON.stringify({
          type: 'unsubscribed',
          gameId,
          message: `Unsubscribed from game ${gameId}`
        }));
      }
    }
  }

  async sendLiveGames(client) {
    const liveGames = await this.db.query(`
      SELECT
        g.*,
        ht.name as home_team_name,
        at.name as away_team_name,
        ls.period,
        ls.time_remaining,
        ls.home_score as live_home_score,
        ls.away_score as live_away_score
      FROM games g
      JOIN teams ht ON g.home_team_id = ht.id
      JOIN teams at ON g.away_team_id = at.id
      LEFT JOIN live_scores ls ON g.id = ls.game_id
      WHERE g.status IN ('Live', 'In Progress')
      OR (g.game_date::date = CURRENT_DATE AND g.game_date > NOW() - INTERVAL '4 hours')
      ORDER BY g.game_date
    `);

    client.ws.send(JSON.stringify({
      type: 'liveGames',
      games: liveGames.rows,
      timestamp: new Date().toISOString()
    }));
  }

  async sendGameDetails(client, gameId) {
    const gameResult = await this.db.query(`
      SELECT
        g.*,
        ht.name as home_team_name,
        at.name as away_team_name,
        ls.period,
        ls.time_remaining,
        ls.home_score as live_home_score,
        ls.away_score as live_away_score,
        ls.last_play
      FROM games g
      JOIN teams ht ON g.home_team_id = ht.id
      JOIN teams at ON g.away_team_id = at.id
      LEFT JOIN live_scores ls ON g.id = ls.game_id
      WHERE g.id = $1 OR g.external_game_id = $2
    `, [gameId, gameId]);

    if (gameResult.rows.length > 0) {
      const game = gameResult.rows[0];

      // Get recent plays/events
      const events = await this.getGameEvents(game.id);

      // Get player stats if available
      const playerStats = await this.getGamePlayerStats(game.id);

      client.ws.send(JSON.stringify({
        type: 'gameDetails',
        game,
        events,
        playerStats,
        timestamp: new Date().toISOString()
      }));
    } else {
      client.ws.send(JSON.stringify({
        type: 'error',
        message: `Game ${gameId} not found`
      }));
    }
  }

  async getTeamGames(teamName) {
    const result = await this.db.query(`
      SELECT g.*
      FROM games g
      JOIN teams ht ON g.home_team_id = ht.id
      JOIN teams at ON g.away_team_id = at.id
      WHERE (ht.name ILIKE $1 OR at.name ILIKE $1)
      AND g.game_date::date >= CURRENT_DATE - INTERVAL '1 day'
    `, [`%${teamName}%`]);

    return result.rows;
  }

  async getSportGames(sport) {
    const result = await this.db.query(`
      SELECT g.*
      FROM games g
      WHERE g.sport = $1
      AND g.game_date::date >= CURRENT_DATE - INTERVAL '1 day'
    `, [sport]);

    return result.rows;
  }

  async getGameEvents(gameId) {
    const result = await this.db.query(`
      SELECT
        sequence,
        event_ts,
        inning,
        half_inning,
        outs,
        balls,
        strikes,
        event_type,
        description,
        runners,
        metrics,
        source
      FROM game_events
      WHERE game_id = $1
      ORDER BY sequence ASC
      LIMIT 300
    `, [gameId]);

    return result.rows.map(row => ({
      ...row,
      runners: row.runners || [],
      metrics: row.metrics || {}
    }));
  }

  async getGamePlayerStats(gameId) {
    const result = await this.db.query(`
      SELECT
        p.display_name,
        p.position,
        p.jersey_number,
        gs.stats_data
      FROM game_stats gs
      JOIN players p ON gs.player_id = p.id
      WHERE gs.game_id = $1
      ORDER BY p.jersey_number
    `, [gameId]);

    return result.rows;
  }

  async checkLiveGames() {
    const liveGames = await this.db.query(`
      SELECT g.*, ls.updated_at
      FROM games g
      LEFT JOIN live_scores ls ON g.id = ls.game_id
      WHERE g.status IN ('Live', 'In Progress')
      AND (ls.updated_at IS NULL OR ls.updated_at < NOW() - INTERVAL '30 seconds')
    `);

    for (const game of liveGames.rows) {
      // Trigger sync for stale live games
      if (game.sport === 'MLB') {
        await this.syncService.syncMLBLiveGame(game.external_game_id);
      } else {
        await this.syncService.syncESPNLiveGame(game.external_game_id, game.sport);
      }
    }
  }

  async checkScoreChanges() {
    // Monitor for score changes and broadcast updates
    const recentChanges = await this.db.query(`
      SELECT
        g.*,
        ht.name as home_team_name,
        at.name as away_team_name,
        ls.home_score,
        ls.away_score,
        ls.period,
        ls.time_remaining
      FROM games g
      JOIN teams ht ON g.home_team_id = ht.id
      JOIN teams at ON g.away_team_id = at.id
      JOIN live_scores ls ON g.id = ls.game_id
      WHERE ls.updated_at > NOW() - INTERVAL '31 seconds'
    `);

    for (const change of recentChanges.rows) {
      this.broadcastToSubscribers(change.id, {
        type: 'scoreUpdate',
        gameId: change.id,
        homeTeam: change.home_team_name,
        awayTeam: change.away_team_name,
        homeScore: change.home_score,
        awayScore: change.away_score,
        period: change.period,
        timeRemaining: change.time_remaining,
        timestamp: new Date().toISOString()
      });
    }
  }

  broadcastToSubscribers(gameId, data) {
    let broadcastCount = 0;

    this.subscriptions.forEach((gameIds, clientId) => {
      if (gameIds.includes(gameId)) {
        const client = Array.from(this.clients).find(c => c.id === clientId);
        if (client && client.ws.readyState === 1) {
          client.ws.send(JSON.stringify(data));
          broadcastCount++;
        }
      }
    });

    if (broadcastCount > 0) {
      console.log(`📡 Broadcast to ${broadcastCount} clients for game ${gameId}`);
    }
  }

  broadcastToAll(data) {
    this.clients.forEach(client => {
      if (client.ws.readyState === 1) {
        client.ws.send(JSON.stringify(data));
      }
    });
  }

  generateClientId() {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async start(port = 3001) {
    this.server.listen(port, () => {
      console.log(`🚀 WebSocket Server running on ws://localhost:${port}`);
      console.log(`📡 SSE endpoint: http://localhost:${port}/events`);
      console.log(`💚 Health check: http://localhost:${port}/ws-health`);
    });

    // Start the sync service
    await this.syncService.startSync();
  }

  async stop() {
    await this.syncService.stopSync();
    this.wss.close();
    this.server.close();
    await this.db.end();
  }
}

// Export for use in other modules
export default RealTimeServer;

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = new RealTimeServer();

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n⏹️  Shutting down WebSocket server...');
    await server.stop();
    process.exit(0);
  });

  server.start().catch(console.error);
}