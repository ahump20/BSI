/**
 * Blaze Field — Multiplayer Durable Object Game Server
 *
 * Room-based (max 6 players: 1 QB + 2 receivers vs 3 defenders).
 * Receives client inputs at 20Hz, broadcasts authoritative state at 20Hz.
 */

export interface Env {
  GAME_ROOM: DurableObjectNamespace;
}

// ── HTTP Router ──────────────────────────────────────────

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const match = url.pathname.match(/^\/room\/([a-zA-Z0-9_-]+)\/ws$/);
    if (!match) {
      return new Response('Not Found', { status: 404 });
    }

    const roomId = match[1];
    const id = env.GAME_ROOM.idFromName(roomId);
    const stub = env.GAME_ROOM.get(id);
    return stub.fetch(request);
  },
};

// ── Types ────────────────────────────────────────────────

interface PlayerSession {
  ws: WebSocket;
  id: string;
  name: string;
  team: 'home' | 'away';
  ready: boolean;
  position: [number, number, number];
  rotation: number;
  velocity: [number, number, number];
  hasBall: boolean;
  stamina: number;
  animation: string;
  lastInput: number;
}

interface ClientMessage {
  type: 'join' | 'input' | 'ready' | 'teamSelect';
  data: any;
}

type GamePhase = 'lobby' | 'playing' | 'ended';

// ── Durable Object ───────────────────────────────────────

export class GameRoom implements DurableObject {
  private sessions = new Map<string, PlayerSession>();
  private phase: GamePhase = 'lobby';
  private score = { home: 0, away: 0 };
  private clock = 900; // 15:00
  private tickInterval: ReturnType<typeof setInterval> | null = null;
  private nextId = 1;

  private ball = {
    position: [0, 1, 50] as [number, number, number],
    heldBy: null as string | null,
    state: 'held' as string,
  };

  constructor(private state: DurableObjectState, private env: Env) {}

  async fetch(request: Request): Promise<Response> {
    const upgrade = request.headers.get('Upgrade');
    if (upgrade !== 'websocket') {
      return new Response('Expected WebSocket', { status: 426 });
    }

    if (this.sessions.size >= 6) {
      return new Response('Room full', { status: 503 });
    }

    const pair = new WebSocketPair();
    const [client, server] = [pair[0], pair[1]];
    const playerId = `p${this.nextId++}`;

    (server as any).accept();

    const session: PlayerSession = {
      ws: server,
      id: playerId,
      name: playerId,
      team: this.sessions.size < 3 ? 'home' : 'away',
      ready: false,
      position: [0, 1, 50],
      rotation: 0,
      velocity: [0, 0, 0],
      hasBall: false,
      stamina: 1,
      animation: 'idle',
      lastInput: Date.now(),
    };

    this.sessions.set(playerId, session);

    server.addEventListener('message', (event) => {
      try {
        const msg: ClientMessage = JSON.parse(event.data as string);
        this.handleMessage(playerId, msg);
      } catch {
        // ignore malformed
      }
    });

    server.addEventListener('close', () => {
      this.sessions.delete(playerId);
      this.broadcast({
        type: 'event',
        data: { event: 'playerLeft', playerId },
      });
      if (this.sessions.size === 0) {
        this.stopTick();
        this.phase = 'lobby';
      }
    });

    // Send init
    this.send(server, {
      type: 'init',
      data: {
        playerId,
        state: {
          players: this.getLobbyPlayers(),
          phase: this.phase,
        },
      },
    });

    // Notify others
    this.broadcast(
      { type: 'event', data: { event: 'playerJoined', player: { id: playerId, name: session.name, team: session.team, ready: false } } },
      playerId,
    );

    return new Response(null, { status: 101, webSocket: client });
  }

  private handleMessage(playerId: string, msg: ClientMessage): void {
    const session = this.sessions.get(playerId);
    if (!session) return;

    switch (msg.type) {
      case 'join':
        session.name = (msg.data.name ?? playerId).slice(0, 20);
        break;

      case 'teamSelect':
        if (msg.data.team === 'home' || msg.data.team === 'away') {
          session.team = msg.data.team;
        }
        break;

      case 'ready':
        session.ready = true;
        if (this.phase === 'lobby' && this.allReady()) {
          this.startGame();
        }
        break;

      case 'input':
        if (this.phase !== 'playing') return;
        session.position = [
          msg.data.moveX ?? session.position[0],
          session.position[1],
          msg.data.moveZ ?? session.position[2],
        ];
        session.rotation = msg.data.rotation ?? session.rotation;
        session.animation = msg.data.animation ?? session.animation;
        session.lastInput = Date.now();
        break;
    }
  }

  private allReady(): boolean {
    if (this.sessions.size < 2) return false;
    for (const s of this.sessions.values()) {
      if (!s.ready) return false;
    }
    return true;
  }

  private startGame(): void {
    this.phase = 'playing';
    this.score = { home: 0, away: 0 };
    this.clock = 900;

    // Assign ball to first home player
    for (const s of this.sessions.values()) {
      if (s.team === 'home') {
        s.hasBall = true;
        this.ball.heldBy = s.id;
        break;
      }
    }

    this.broadcast({ type: 'event', data: { event: 'gameStart' } });
    this.startTick();
  }

  private startTick(): void {
    if (this.tickInterval) return;
    this.tickInterval = setInterval(() => this.tick(), 50); // 20Hz
  }

  private stopTick(): void {
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }
  }

  private tick(): void {
    if (this.phase !== 'playing') return;

    this.clock = Math.max(0, this.clock - 0.05);
    if (this.clock <= 0) {
      this.phase = 'ended';
      this.broadcast({ type: 'event', data: { event: 'gameEnd', score: this.score } });
      this.stopTick();
      return;
    }

    // Build state snapshot
    const players: Record<string, any> = {};
    for (const [id, s] of this.sessions) {
      players[id] = {
        name: s.name,
        team: s.team,
        position: s.position,
        rotation: s.rotation,
        velocity: s.velocity,
        hasBall: s.hasBall,
        stamina: s.stamina,
        animation: s.animation,
      };
    }

    this.broadcast({
      type: 'state',
      data: {
        players,
        ball: this.ball,
        score: this.score,
        clock: this.clock,
      },
    });
  }

  private getLobbyPlayers(): Array<{ id: string; name: string; team: string; ready: boolean }> {
    const list: Array<{ id: string; name: string; team: string; ready: boolean }> = [];
    for (const s of this.sessions.values()) {
      list.push({ id: s.id, name: s.name, team: s.team, ready: s.ready });
    }
    return list;
  }

  private send(ws: WebSocket, msg: any): void {
    try { ws.send(JSON.stringify(msg)); } catch { /* closed */ }
  }

  private broadcast(msg: any, excludeId?: string): void {
    const payload = JSON.stringify(msg);
    for (const s of this.sessions.values()) {
      if (s.id === excludeId) continue;
      try { s.ws.send(payload); } catch { /* closed */ }
    }
  }
}
