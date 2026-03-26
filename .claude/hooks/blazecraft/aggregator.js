#!/usr/bin/env node
/**
 * BlazeCraft event aggregator - local WebSocket server + production relay.
 *
 * Receives events via HTTP POST from emit.js hooks,
 * broadcasts them to connected BlazeCraft UI clients via WebSocket,
 * AND forwards them to the production BlazeCraft API.
 *
 * Architecture:
 *   Claude Code → hooks/emit.js → HTTP POST → aggregator (this)
 *                                                  ↓
 *                                  ┌───────────────┼───────────────┐
 *                                  ↓               ↓               ↓
 *                           WebSocket         blazecraft.app     Local UI
 *                           broadcast         /api/events        clients
 */

const http = require('http');
const https = require('https');
const WebSocket = require('ws');

// Production BlazeCraft API endpoint
const BLAZECRAFT_API = 'https://blazecraft.app/api/blazecraft/events';

const HTTP_PORT = 7777;
const WS_PORT = 7778;

// Event buffer for new clients
const EVENT_BUFFER_SIZE = 100;
const eventBuffer = [];

// Session statistics
const sessionStats = {
  spawns: 0,
  commands: 0,
  production: 0,
  research: 0,
  repairs: 0,
  storage: 0,
  defense: 0,
  startTime: Date.now(),
};

// WebSocket server
const wss = new WebSocket.Server({ port: WS_PORT });

wss.on('connection', (ws) => {
  console.log(`[WS] Client connected (total: ${wss.clients.size})`);

  // Send current stats and recent events
  ws.send(JSON.stringify({
    type: 'init',
    stats: sessionStats,
    events: eventBuffer.slice(-20),
  }));

  ws.on('close', () => {
    console.log(`[WS] Client disconnected (total: ${wss.clients.size})`);
  });

  ws.on('error', (err) => {
    console.error('[WS] Client error:', err.message);
  });
});

wss.on('listening', () => {
  console.log(`[WS] WebSocket server listening on port ${WS_PORT}`);
});

// Broadcast to all connected clients
function broadcast(data) {
  const message = JSON.stringify(data);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

// Forward event to production BlazeCraft API
function forwardToProduction(event) {
  const payload = JSON.stringify({
    type: event.type === 'spawn' ? 'agent_spawn' : event.type,
    agentId: event.sessionId || 'claude-' + Date.now(),
    agentName: event.context?.tool || 'Claude Agent',
    sessionId: event.sessionId || 'local-session',
    timestamp: new Date(event.timestamp).toISOString(),
    data: {
      filePath: event.context?.input?.slice(0, 500),
      taskDescription: `${event.type}: ${event.category}`,
      buildingKind: mapCategoryToBuilding(event.category),
      message: event.context?.tool ? `Tool: ${event.context.tool}` : undefined,
    },
  });

  const url = new URL(BLAZECRAFT_API);
  const options = {
    hostname: url.hostname,
    port: 443,
    path: url.pathname,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload),
    },
    timeout: 3000,
  };

  const req = https.request(options, (res) => {
    if (res.statusCode !== 200) {
      console.log(`[PROD] Forward failed: ${res.statusCode}`);
    }
  });

  req.on('error', (err) => {
    // Fail silently - don't block local events
    console.log(`[PROD] Forward error: ${err.message}`);
  });

  req.on('timeout', () => {
    req.destroy();
  });

  req.write(payload);
  req.end();
}

// Map event category to BlazeCraft building
function mapCategoryToBuilding(category) {
  const map = {
    spawns: 'townhall',
    commands: 'barracks',
    production: 'workshop',
    research: 'library',
    storage: 'stables',
    defense: 'market',
    repairs: 'workshop',
  };
  return map[category] || 'townhall';
}

// HTTP server for receiving events from emit.js
const httpServer = http.createServer((req, res) => {
  // CORS headers for local development
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.method === 'POST' && req.url === '/event') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });

    req.on('end', () => {
      try {
        const event = JSON.parse(body);
        handleEvent(event);
        res.writeHead(200);
        res.end('OK');
      } catch (err) {
        console.error('[HTTP] Parse error:', err.message);
        res.writeHead(400);
        res.end('Invalid JSON');
      }
    });
    return;
  }

  if (req.method === 'GET' && req.url === '/stats') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      stats: sessionStats,
      clients: wss.clients.size,
      uptime: Date.now() - sessionStats.startTime,
    }));
    return;
  }

  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200);
    res.end('OK');
    return;
  }

  res.writeHead(404);
  res.end('Not Found');
});

// Handle incoming event
function handleEvent(event) {
  console.log(`[EVENT] ${event.type} (${event.category})`);

  // Update stats
  if (sessionStats[event.category] !== undefined) {
    sessionStats[event.category]++;
  }

  // Add to buffer
  eventBuffer.push(event);
  if (eventBuffer.length > EVENT_BUFFER_SIZE) {
    eventBuffer.shift();
  }

  // Broadcast to local WebSocket clients
  broadcast({
    type: 'event',
    event,
    stats: sessionStats,
  });

  // Forward to production BlazeCraft API
  forwardToProduction(event);
}

// Start HTTP server
httpServer.listen(HTTP_PORT, () => {
  console.log(`[HTTP] Event receiver listening on port ${HTTP_PORT}`);
  console.log('');
  console.log('BlazeCraft Aggregator running');
  console.log(`  Events: http://localhost:${HTTP_PORT}/event (POST)`);
  console.log(`  Stats:  http://localhost:${HTTP_PORT}/stats (GET)`);
  console.log(`  WebSocket: ws://localhost:${WS_PORT}`);
  console.log('');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down...');
  wss.close();
  httpServer.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\nShutting down...');
  wss.close();
  httpServer.close();
  process.exit(0);
});
