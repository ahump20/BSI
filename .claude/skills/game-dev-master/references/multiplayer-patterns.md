# Multiplayer Patterns

Networking architecture for online games: netcode, prediction, lobbies.

## Architecture Models

| Model | Authority | Best For | Latency Tolerance |
|-------|-----------|----------|-------------------|
| **Client-Server Authoritative** | Server | Competitive, anti-cheat critical | Low-Medium |
| **Client-Server Relaxed** | Server + Client hints | Co-op, casual | Medium |
| **Peer-to-Peer** | Distributed | Fighting games, small lobbies | Very Low |
| **Relay Server** | Clients via relay | NAT traversal, P2P fallback | Medium |

**Default Choice:** Client-server authoritative for most games.

## Client-Server Authoritative

Server is the source of truth. Clients send inputs, server validates and broadcasts state.

```
Client A                    Server                     Client B
   |                          |                          |
   |--[Input: Move Right]---->|                          |
   |                          |--[Validate]              |
   |                          |--[Update State]          |
   |<----[State Update]-------|------[State Update]----->|
   |                          |                          |
```

### Server Loop

```typescript
// Server tick rate: 20-60 Hz
const TICK_RATE = 60;
const TICK_INTERVAL = 1000 / TICK_RATE;

interface PlayerInput {
  clientId: string;
  tick: number;
  moveX: number;
  moveY: number;
  actions: string[];
}

interface GameState {
  tick: number;
  players: Map<string, PlayerState>;
  entities: Entity[];
}

class GameServer {
  private state: GameState;
  private inputBuffer: Map<string, PlayerInput[]> = new Map();

  tick(): void {
    // Process buffered inputs
    for (const [clientId, inputs] of this.inputBuffer) {
      const input = inputs.shift();
      if (input) {
        this.processInput(clientId, input);
      }
    }

    // Update physics, AI, etc.
    this.updateWorld();

    // Broadcast state to all clients
    this.broadcastState();

    this.state.tick++;
  }

  processInput(clientId: string, input: PlayerInput): void {
    const player = this.state.players.get(clientId);
    if (!player) return;

    // Validate input (anti-cheat)
    if (Math.abs(input.moveX) > 1 || Math.abs(input.moveY) > 1) {
      return; // Invalid input
    }

    // Apply movement
    player.x += input.moveX * player.speed;
    player.y += input.moveY * player.speed;
  }
}
```

### Client-Side Prediction

Client predicts movement locally, reconciles with server state.

```typescript
interface PredictedState {
  tick: number;
  x: number;
  y: number;
}

class GameClient {
  private serverState: PlayerState | null = null;
  private predictedStates: PredictedState[] = [];
  private pendingInputs: PlayerInput[] = [];

  update(dt: number): void {
    // Gather input
    const input = this.gatherInput();
    input.tick = this.currentTick;

    // Send to server
    this.sendInput(input);

    // Predict locally
    this.applyInput(input);

    // Store for reconciliation
    this.pendingInputs.push(input);
    this.predictedStates.push({
      tick: this.currentTick,
      x: this.player.x,
      y: this.player.y
    });

    this.currentTick++;
  }

  onServerState(state: PlayerState, serverTick: number): void {
    this.serverState = state;

    // Remove acknowledged inputs
    this.pendingInputs = this.pendingInputs.filter(i => i.tick > serverTick);

    // Check if prediction was correct
    const predicted = this.predictedStates.find(p => p.tick === serverTick);
    if (predicted) {
      const errorX = Math.abs(predicted.x - state.x);
      const errorY = Math.abs(predicted.y - state.y);

      if (errorX > 0.01 || errorY > 0.01) {
        // Reconcile: snap to server state, replay pending inputs
        this.player.x = state.x;
        this.player.y = state.y;

        for (const input of this.pendingInputs) {
          this.applyInput(input);
        }
      }
    }

    // Cleanup old predictions
    this.predictedStates = this.predictedStates.filter(p => p.tick > serverTick);
  }
}
```

## Entity Interpolation

Smooth rendering of other players between server updates.

```typescript
interface InterpolationBuffer {
  states: Array<{ tick: number; state: PlayerState }>;
}

class EntityInterpolator {
  private buffer: InterpolationBuffer = { states: [] };
  private interpolationDelay = 100; // ms

  addState(tick: number, state: PlayerState): void {
    this.buffer.states.push({ tick, state });

    // Keep last N states
    if (this.buffer.states.length > 20) {
      this.buffer.states.shift();
    }
  }

  getInterpolatedState(renderTime: number): PlayerState | null {
    const targetTime = renderTime - this.interpolationDelay;

    // Find two states to interpolate between
    let before: { tick: number; state: PlayerState } | null = null;
    let after: { tick: number; state: PlayerState } | null = null;

    for (const s of this.buffer.states) {
      const stateTime = s.tick * TICK_INTERVAL;
      if (stateTime <= targetTime) {
        before = s;
      } else if (!after) {
        after = s;
        break;
      }
    }

    if (!before || !after) return before?.state ?? null;

    // Interpolate
    const beforeTime = before.tick * TICK_INTERVAL;
    const afterTime = after.tick * TICK_INTERVAL;
    const t = (targetTime - beforeTime) / (afterTime - beforeTime);

    return {
      x: before.state.x + (after.state.x - before.state.x) * t,
      y: before.state.y + (after.state.y - before.state.y) * t,
      // ... other properties
    };
  }
}
```

## Lag Compensation

Server rewinds time to validate hits at client's perceived time.

```typescript
class LagCompensation {
  private stateHistory: Map<number, GameState> = new Map();
  private maxHistoryTicks = 60; // 1 second at 60 tick

  saveState(tick: number, state: GameState): void {
    this.stateHistory.set(tick, structuredClone(state));

    // Cleanup old states
    const oldestTick = tick - this.maxHistoryTicks;
    for (const t of this.stateHistory.keys()) {
      if (t < oldestTick) this.stateHistory.delete(t);
    }
  }

  validateHit(
    shooterClientTick: number,
    shooterPos: Vector2,
    targetId: string
  ): boolean {
    // Get world state at shooter's perceived time
    const historicalState = this.stateHistory.get(shooterClientTick);
    if (!historicalState) return false;

    const target = historicalState.players.get(targetId);
    if (!target) return false;

    // Check if shot would have hit at that time
    return this.raycast(shooterPos, target);
  }
}
```

## WebSocket Transport

```typescript
// Server (Node.js with ws)
import { WebSocketServer, WebSocket } from 'ws';

const wss = new WebSocketServer({ port: 8080 });
const clients: Map<string, WebSocket> = new Map();

wss.on('connection', (ws) => {
  const clientId = generateId();
  clients.set(clientId, ws);

  ws.on('message', (data) => {
    const message = JSON.parse(data.toString());
    handleMessage(clientId, message);
  });

  ws.on('close', () => {
    clients.delete(clientId);
    broadcastPlayerLeft(clientId);
  });
});

function broadcast(message: object): void {
  const data = JSON.stringify(message);
  for (const ws of clients.values()) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(data);
    }
  }
}

// Client
const ws = new WebSocket('ws://localhost:8080');

ws.onopen = () => {
  ws.send(JSON.stringify({ type: 'join', name: playerName }));
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  handleServerMessage(message);
};

function sendInput(input: PlayerInput): void {
  ws.send(JSON.stringify({ type: 'input', data: input }));
}
```

## Lobby System

Track lobbies with: `id`, `host`, `players[]`, `maxPlayers`, `state` ('waiting'|'starting'|'playing'), `settings`.

Key operations:
- `createLobby(hostId, settings)`: Initialize lobby, add host as first player
- `joinLobby(lobbyId, playerId)`: Validate capacity/state before adding
- `startGame(lobbyId, requesterId)`: Only host can start

## Matchmaking

Rating-based matching with expanding tolerance over wait time:
```typescript
const tolerance = baseTolerance + (waitTimeSeconds * toleranceGrowthRate);
```
Compare all queued players, match when `Math.abs(p1.rating - p2.rating) <= tolerance`.

## Message Protocol

```typescript
// Define message types
type MessageType =
  | { type: 'join'; name: string }
  | { type: 'input'; data: PlayerInput }
  | { type: 'state'; tick: number; players: PlayerState[]; entities: Entity[] }
  | { type: 'chat'; from: string; text: string }
  | { type: 'rpc'; method: string; args: unknown[] };

// Binary encoding for bandwidth (optional)
// Use MessagePack, Protocol Buffers, or FlatBuffers for production

// Delta compression
interface StateDelta {
  tick: number;
  baseTick: number;
  changes: Array<{
    entityId: string;
    property: string;
    value: unknown;
  }>;
}
```

## Anti-Cheat Basics

Server-side validation checklist:
- **Movement speed**: Reject if `abs(input.move) > player.speed * 1.1`
- **Cooldowns**: Track `lastFireTime`, reject if cooldown not elapsed
- **Position sanity**: Compare to last known position, reject teleports
- **Rate limiting**: Track request timestamps per client, reject if >N/second

## Engine-Specific

**Unity:** Use Netcode for GameObjects or Mirror
**Unreal:** Use built-in replication (UFUNCTION(Server), UPROPERTY(Replicated))
**Godot:** Use MultiplayerPeer, MultiplayerSpawner, MultiplayerSynchronizer
**Web:** WebSocket + custom or Colyseus/Socket.io

## Development Tips

1. **Start single-player first** - Add networking last
2. **Simulate latency locally** - Test with artificial delay
3. **Log everything** - Debugging networked games is hard
4. **Bandwidth budget** - Mobile: ~10KB/s, Desktop: ~50KB/s
5. **Graceful disconnection** - Handle drops, reconnection
