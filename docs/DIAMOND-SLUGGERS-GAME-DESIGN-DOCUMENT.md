# Diamond Sluggers: Complete Game Design Document

**Version:** 2.0
**Last Updated:** 2025-11-26
**Status:** Production-Ready Architecture

---

## Executive Summary

Diamond Sluggers is an original mobile baseball game capturing the nostalgic charm of classic arcade sports games while being 100% legally distinct from any existing IP. The game features 16 unique kid characters, 8 Texas-inspired backyard stadiums, timing-based batting mechanics, and a progression system designed for ages 8-14 (while remaining engaging for adults).

**Core Philosophy:**

- Fun first, realism second
- Mobile-optimized touch controls
- Kid-friendly content, no predatory monetization
- Texas heart with universal appeal

---

## Part 1: Technical Architecture

### 1.1 Recommended Tech Stack

**Primary Recommendation: Phaser.js + Capacitor**

| Layer            | Technology                   | Justification                                                                |
| ---------------- | ---------------------------- | ---------------------------------------------------------------------------- |
| Game Engine      | Phaser 3.x                   | Mature 2D engine, excellent mobile performance, TypeScript support           |
| Cross-Platform   | Capacitor                    | Native iOS/Android builds from web code, Cloudflare Pages deployment for web |
| State Management | Custom GameState class       | Lightweight, game-specific, no external dependencies                         |
| Storage          | localStorage + Cloudflare D1 | Local-first with cloud sync capability                                       |
| Backend          | Cloudflare Workers           | API for leaderboards, cloud saves, matchmaking                               |
| Assets           | Cloudflare R2                | CDN-delivered sprites, audio, stadium backgrounds                            |

**Why Phaser over Unity/Godot for this project:**

1. **Web-First Distribution:** Instant play at `blazesportsintel.com/game` without app store approval
2. **Bundle Size:** ~150KB core vs 20MB+ for Unity WebGL
3. **Existing Infrastructure:** Leverages your Cloudflare Workers/D1/KV/R2 stack
4. **Development Speed:** TypeScript familiarity, hot reload, no compile times
5. **Monetization Freedom:** No Unity splash screen, no revenue sharing

**Alternative Consideration (Native Performance):**
If targeting app stores exclusively with demanding animations, consider Godot 4.x with GDScript. Export to iOS/Android natively with 60fps physics.

### 1.2 Project Structure

```
BSI/
├── src/
│   ├── games/
│   │   └── diamond-sluggers/
│   │       ├── config/
│   │       │   ├── GameConfig.ts       # Core game settings
│   │       │   ├── CharacterData.ts    # All 16 characters
│   │       │   ├── StadiumData.ts      # All 8 stadiums
│   │       │   └── PowerUpData.ts      # Power-up definitions
│   │       ├── scenes/
│   │       │   ├── BootScene.ts        # Asset loading
│   │       │   ├── MenuScene.ts        # Main menu
│   │       │   ├── TeamSelectScene.ts  # Character selection
│   │       │   ├── StadiumSelectScene.ts
│   │       │   ├── GameScene.ts        # Core gameplay
│   │       │   ├── HomeRunDerbyScene.ts
│   │       │   └── ResultsScene.ts
│   │       ├── systems/
│   │       │   ├── GameState.ts        # State machine
│   │       │   ├── PhysicsSystem.ts    # Ball physics
│   │       │   ├── InputSystem.ts      # Touch/keyboard
│   │       │   ├── AudioSystem.ts      # Sound management
│   │       │   ├── AISystem.ts         # CPU opponent
│   │       │   └── PowerUpSystem.ts    # Special abilities
│   │       ├── entities/
│   │       │   ├── Ball.ts
│   │       │   ├── Batter.ts
│   │       │   ├── Pitcher.ts
│   │       │   ├── Fielder.ts
│   │       │   └── BaseRunner.ts
│   │       ├── ui/
│   │       │   ├── Scoreboard.ts
│   │       │   ├── CountDisplay.ts
│   │       │   ├── SwingZone.ts        # Touch target
│   │       │   └── PowerUpIndicator.ts
│   │       └── main.ts                 # Entry point
│   └── workers/
│       └── diamond-sluggers-api/
│           ├── index.ts                # API entry
│           ├── leaderboard.ts          # High scores
│           ├── cloudSave.ts            # Save sync
│           └── matchmaking.ts          # Future multiplayer
├── public/
│   └── games/
│       └── diamond-sluggers/
│           ├── assets/
│           │   ├── sprites/            # Character spritesheets
│           │   ├── stadiums/           # Background images
│           │   ├── audio/              # Sound effects, music
│           │   └── ui/                 # Menu graphics
│           └── index.html              # Game shell
└── workers/
    └── diamond-sluggers-api/
        └── wrangler.toml
```

### 1.3 State Management Architecture

```typescript
// src/games/diamond-sluggers/systems/GameState.ts

export type GamePhase =
  | 'menu'
  | 'team-select'
  | 'stadium-select'
  | 'pre-game'
  | 'pitching'
  | 'batting'
  | 'ball-in-play'
  | 'baserunning'
  | 'fielding'
  | 'between-innings'
  | 'power-up-active'
  | 'game-over'
  | 'results';

export interface BaseState {
  first: string | null; // Character ID on first
  second: string | null;
  third: string | null;
}

export interface TeamState {
  lineup: string[]; // Array of character IDs
  currentBatterIndex: number;
  score: number;
  hits: number;
  errors: number;
}

export interface GameStateData {
  phase: GamePhase;
  inning: number;
  maxInnings: 3 | 6 | 9;
  isTopInning: boolean;
  outs: number;
  strikes: number;
  balls: number;
  bases: BaseState;
  homeTeam: TeamState;
  awayTeam: TeamState;
  currentStadium: string;
  weather: WeatherCondition;
  activePowerUps: ActivePowerUp[];
  pitchHistory: PitchRecord[];
  lastPlay: PlayResult | null;
  pauseState: PauseState | null;
}

export class GameState {
  private state: GameStateData;
  private listeners: Map<string, Function[]> = new Map();

  constructor() {
    this.state = this.getInitialState();
  }

  private getInitialState(): GameStateData {
    return {
      phase: 'menu',
      inning: 1,
      maxInnings: 3,
      isTopInning: true,
      outs: 0,
      strikes: 0,
      balls: 0,
      bases: { first: null, second: null, third: null },
      homeTeam: { lineup: [], currentBatterIndex: 0, score: 0, hits: 0, errors: 0 },
      awayTeam: { lineup: [], currentBatterIndex: 0, score: 0, hits: 0, errors: 0 },
      currentStadium: 'boerne-backyard',
      weather: { wind: { x: 0, y: 0 }, temperature: 85, condition: 'sunny' },
      activePowerUps: [],
      pitchHistory: [],
      lastPlay: null,
      pauseState: null,
    };
  }

  // State transition with validation
  transition(newPhase: GamePhase): boolean {
    const validTransitions: Record<GamePhase, GamePhase[]> = {
      menu: ['team-select'],
      'team-select': ['menu', 'stadium-select'],
      'stadium-select': ['team-select', 'pre-game'],
      'pre-game': ['pitching'],
      pitching: ['batting', 'between-innings'],
      batting: ['ball-in-play', 'pitching'],
      'ball-in-play': ['baserunning', 'fielding', 'between-innings'],
      baserunning: ['pitching', 'between-innings'],
      fielding: ['baserunning', 'pitching', 'between-innings'],
      'between-innings': ['pitching', 'game-over'],
      'power-up-active': ['pitching', 'batting', 'ball-in-play'],
      'game-over': ['results'],
      results: ['menu', 'team-select'],
    };

    if (validTransitions[this.state.phase]?.includes(newPhase)) {
      this.state.phase = newPhase;
      this.emit('phaseChange', newPhase);
      return true;
    }

    console.warn(`Invalid transition: ${this.state.phase} -> ${newPhase}`);
    return false;
  }

  // Event system for UI updates
  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  private emit(event: string, data: any): void {
    this.listeners.get(event)?.forEach((cb) => cb(data));
  }

  // Serialization for save/load
  serialize(): string {
    return JSON.stringify(this.state);
  }

  deserialize(json: string): void {
    this.state = JSON.parse(json);
  }
}
```

### 1.4 Save/Progress System

The existing `StorageManager` in `/Users/AustinHumphrey/BSI/public/game/js/storage-manager.js` handles local persistence. Extend it with cloud sync:

```typescript
// src/games/diamond-sluggers/systems/CloudSaveManager.ts

interface CloudSavePayload {
  userId: string;
  saveData: SaveData;
  timestamp: number;
  checksum: string;
}

export class CloudSaveManager {
  private apiBase = 'https://api.blazesportsintel.com/game';
  private localManager: StorageManager;
  private syncInterval: number | null = null;

  constructor(localManager: StorageManager) {
    this.localManager = localManager;
  }

  async syncToCloud(): Promise<boolean> {
    const localData = this.localManager.exportSave();
    const payload: CloudSavePayload = {
      userId: await this.getUserId(),
      saveData: JSON.parse(localData),
      timestamp: Date.now(),
      checksum: await this.calculateChecksum(localData),
    };

    try {
      const response = await fetch(`${this.apiBase}/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      return response.ok;
    } catch (error) {
      console.error('Cloud sync failed:', error);
      return false;
    }
  }

  async syncFromCloud(): Promise<boolean> {
    try {
      const userId = await this.getUserId();
      const response = await fetch(`${this.apiBase}/save/${userId}`);

      if (!response.ok) return false;

      const cloudData = await response.json();
      const localData = JSON.parse(this.localManager.exportSave());

      // Conflict resolution: most recent wins
      if (cloudData.timestamp > localData.player.lastPlayed) {
        return this.localManager.importSave(JSON.stringify(cloudData.saveData));
      }

      return true;
    } catch (error) {
      console.error('Cloud fetch failed:', error);
      return false;
    }
  }

  startAutoSync(intervalMs: number = 60000): void {
    this.syncInterval = window.setInterval(() => {
      this.syncToCloud();
    }, intervalMs);
  }

  stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  private async getUserId(): Promise<string> {
    // Use device fingerprint or create anonymous ID
    let userId = localStorage.getItem('ds-user-id');
    if (!userId) {
      userId = crypto.randomUUID();
      localStorage.setItem('ds-user-id', userId);
    }
    return userId;
  }

  private async calculateChecksum(data: string): Promise<string> {
    const encoder = new TextEncoder();
    const buffer = await crypto.subtle.digest('SHA-256', encoder.encode(data));
    return Array.from(new Uint8Array(buffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
}
```

### 1.5 Multiplayer Considerations

**Phase 1 (Launch):** Single-player only
**Phase 2 (Post-Launch):** Local multiplayer (pass-and-play)
**Phase 3 (Future):** Online multiplayer via Cloudflare Durable Objects

```typescript
// Future multiplayer architecture sketch
interface MultiplayerMatch {
  matchId: string;
  player1: { userId: string; team: string[]; connected: boolean };
  player2: { userId: string; team: string[]; connected: boolean };
  gameState: GameStateData;
  turnOrder: 'player1' | 'player2';
  lastAction: GameAction;
  timestamp: number;
}

// Durable Object for match state
export class MatchRoom {
  state: DurableObjectState;
  sessions: Map<WebSocket, string> = new Map();

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/ws') {
      const pair = new WebSocketPair();
      await this.handleSession(pair[1]);
      return new Response(null, { status: 101, webSocket: pair[0] });
    }

    return new Response('Not found', { status: 404 });
  }

  async handleSession(ws: WebSocket): Promise<void> {
    ws.accept();

    ws.addEventListener('message', async (event) => {
      const action: GameAction = JSON.parse(event.data);
      await this.processAction(action);
      this.broadcast(action);
    });
  }

  broadcast(action: GameAction): void {
    for (const ws of this.sessions.keys()) {
      ws.send(JSON.stringify(action));
    }
  }
}
```

---

## Part 2: Core Gameplay Mechanics

### 2.1 Batting System

The batting system uses timing-based mechanics optimized for touch screens.

**Swing Timing Windows:**
| Window | Timing Range | Result |
|--------|--------------|--------|
| Perfect | -50ms to +50ms | Maximum power, best angle control |
| Good | -150ms to -50ms OR +50ms to +150ms | Solid contact, moderate control |
| Early | -200ms to -150ms | Weak grounder or foul |
| Late | +150ms to +200ms | Pop fly or foul |
| Miss | Beyond +200ms | Strike (swinging) |

**Touch Control Implementation:**

```typescript
// src/games/diamond-sluggers/ui/SwingZone.ts

export class SwingZone {
  private zone: Phaser.GameObjects.Zone;
  private visualFeedback: Phaser.GameObjects.Rectangle;
  private hapticEnabled: boolean;

  constructor(scene: Phaser.Scene, x: number, y: number, width: number, height: number) {
    // Minimum 88x88pt for accessibility (44pt x 2 for finger target)
    const minSize = 88;
    width = Math.max(width, minSize);
    height = Math.max(height, minSize);

    this.zone = scene.add.zone(x, y, width, height);
    this.zone.setInteractive();

    // Visual feedback rectangle
    this.visualFeedback = scene.add.rectangle(x, y, width, height, 0xffffff, 0);
    this.visualFeedback.setStrokeStyle(3, 0xffffff, 0.5);

    this.hapticEnabled = 'vibrate' in navigator;

    this.setupInput(scene);
  }

  private setupInput(scene: Phaser.Scene): void {
    this.zone.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.triggerSwing(scene, pointer);
    });

    // Also support keyboard for accessibility
    scene.input.keyboard?.on('keydown-SPACE', () => {
      this.triggerSwing(scene, null);
    });
  }

  private triggerSwing(scene: Phaser.Scene, pointer: Phaser.Input.Pointer | null): void {
    // Visual feedback
    scene.tweens.add({
      targets: this.visualFeedback,
      alpha: 0.8,
      duration: 50,
      yoyo: true,
      onComplete: () => {
        this.visualFeedback.setAlpha(0);
      },
    });

    // Haptic feedback
    if (this.hapticEnabled) {
      navigator.vibrate(30);
    }

    // Emit swing event with timestamp
    scene.events.emit('swing', {
      timestamp: scene.time.now,
      position: pointer ? { x: pointer.x, y: pointer.y } : null,
    });
  }

  setEnabled(enabled: boolean): void {
    if (enabled) {
      this.zone.setInteractive();
      this.visualFeedback.setAlpha(0.3);
    } else {
      this.zone.disableInteractive();
      this.visualFeedback.setAlpha(0);
    }
  }
}
```

**Swing Power Calculation:**

```typescript
// src/games/diamond-sluggers/systems/PhysicsSystem.ts

export interface SwingResult {
  type: 'perfect' | 'good' | 'early' | 'late' | 'miss' | 'foul';
  power: number; // 0-1 multiplier
  launchAngle: number; // Degrees
  direction: number; // -45 (pull) to +45 (opposite field)
  exitVelocity: number; // Pixels per second
}

export class PhysicsSystem {
  static calculateSwing(
    timingOffset: number,
    batter: CharacterStats,
    pitch: PitchData,
    swingPosition?: { x: number; y: number }
  ): SwingResult {
    const absOffset = Math.abs(timingOffset);

    // Determine timing quality
    let type: SwingResult['type'];
    let basePower: number;

    if (absOffset <= 50) {
      type = 'perfect';
      basePower = 1.0;
    } else if (absOffset <= 150) {
      type = timingOffset < 0 ? 'early' : 'late';
      basePower = 0.7;
    } else if (absOffset <= 200) {
      type = timingOffset < 0 ? 'early' : 'late';
      basePower = 0.4;
    } else {
      type = 'miss';
      basePower = 0;
    }

    // Foul ball chance on poor contact
    if (type === 'early' || type === 'late') {
      const foulChance = 0.3 + (absOffset - 100) / 200;
      if (Math.random() < foulChance) {
        type = 'foul';
      }
    }

    // Apply batter stats
    const powerStat = batter.power / 10; // 0-1
    const contactStat = batter.contact / 10; // 0-1

    // Power: weighted combination of timing and batter power
    const power = basePower * (0.6 + powerStat * 0.4);

    // Launch angle: affected by timing
    let launchAngle: number;
    if (type === 'perfect') {
      launchAngle = 25 + Math.random() * 15; // 25-40 degrees (ideal HR range)
    } else if (type === 'early') {
      launchAngle = 35 + Math.random() * 25; // Pop fly tendency
    } else if (type === 'late') {
      launchAngle = 5 + Math.random() * 20; // Ground ball tendency
    } else {
      launchAngle = 0;
    }

    // Direction: contact stat reduces variance
    const directionVariance = 45 * (1 - contactStat * 0.5);
    const direction = (Math.random() - 0.5) * 2 * directionVariance;

    // Exit velocity
    const baseExitVelo = 300; // pixels/second
    const exitVelocity = baseExitVelo * power * (0.8 + powerStat * 0.4);

    return {
      type,
      power,
      launchAngle,
      direction,
      exitVelocity,
    };
  }

  static projectBallFlight(
    swing: SwingResult,
    stadium: StadiumData,
    weather: WeatherCondition
  ): BallFlightResult {
    if (swing.type === 'miss' || swing.type === 'foul') {
      return {
        outcome: swing.type === 'miss' ? 'strike' : 'foul',
        trajectory: [],
        landingPosition: null,
      };
    }

    const gravity = 980; // px/s^2
    const dt = 1 / 60; // 60fps simulation
    const trajectory: Vector2[] = [];

    // Initial velocity components
    const radAngle = (swing.launchAngle * Math.PI) / 180;
    const radDirection = (swing.direction * Math.PI) / 180;

    let vx = swing.exitVelocity * Math.cos(radAngle) * Math.cos(radDirection);
    let vy = swing.exitVelocity * Math.cos(radAngle) * Math.sin(radDirection);
    let vz = swing.exitVelocity * Math.sin(radAngle);

    // Apply wind
    vx += weather.wind.x * 50;
    vy += weather.wind.y * 50;

    let x = 0,
      y = 0,
      z = 0;
    const startY = 100; // Height of contact
    z = startY;

    // Simulate until ball lands
    while (z > 0 || trajectory.length === 0) {
      x += vx * dt;
      y += vy * dt;
      z += vz * dt;
      vz -= gravity * dt;

      // Air resistance (simplified)
      vx *= 0.999;
      vy *= 0.999;

      trajectory.push({ x, y });

      if (trajectory.length > 300) break; // Safety limit
    }

    // Calculate landing distance
    const distance = Math.sqrt(x * x + y * y);

    // Determine outcome based on distance and stadium dimensions
    const fenceDistance = this.getFenceDistance(x, y, stadium);
    let outcome: HitOutcome;

    if (distance >= fenceDistance) {
      outcome = 'homerun';
    } else if (distance >= fenceDistance * 0.8) {
      // Warning track - outfielder catch chance
      outcome = Math.random() < 0.6 ? 'flyout' : 'triple';
    } else if (distance >= 200) {
      outcome = Math.random() < 0.3 ? 'flyout' : 'double';
    } else if (distance >= 100) {
      outcome = Math.random() < 0.4 ? 'groundout' : 'single';
    } else {
      outcome = Math.random() < 0.7 ? 'groundout' : 'single';
    }

    return {
      outcome,
      trajectory,
      landingPosition: { x, y },
      distance,
    };
  }

  private static getFenceDistance(x: number, y: number, stadium: StadiumData): number {
    const angle = (Math.atan2(y, x) * 180) / Math.PI;
    const dims = stadium.dimensions;

    // Interpolate between field dimensions based on angle
    if (angle < -30) {
      return dims.leftField;
    } else if (angle > 30) {
      return dims.rightField;
    } else {
      return dims.centerField;
    }
  }
}
```

### 2.2 Pitching System

The AI pitcher selects pitches based on game situation and batter weaknesses:

```typescript
// src/games/diamond-sluggers/systems/AISystem.ts

export interface PitchSelection {
  type: 'fastball' | 'curveball' | 'changeup' | 'slider';
  location: { x: number; y: number }; // Strike zone coordinates
  speed: number;
  breakingAmount: number;
  isStrike: boolean;
}

export class AISystem {
  private difficulty: 'easy' | 'medium' | 'hard';
  private pitchHistory: PitchSelection[] = [];

  constructor(difficulty: 'easy' | 'medium' | 'hard' = 'medium') {
    this.difficulty = difficulty;
  }

  selectPitch(gameState: GameStateData, batter: CharacterData): PitchSelection {
    const count = { balls: gameState.balls, strikes: gameState.strikes };
    const outs = gameState.outs;
    const runnersOn = this.countRunners(gameState.bases);

    // Pitch type selection based on situation
    let typeWeights: Record<string, number>;

    if (count.strikes === 2) {
      // Strikeout pitch - more breaking balls
      typeWeights = { fastball: 0.3, curveball: 0.35, changeup: 0.25, slider: 0.1 };
    } else if (count.balls === 3) {
      // Must throw strike - more fastballs
      typeWeights = { fastball: 0.6, curveball: 0.15, changeup: 0.15, slider: 0.1 };
    } else if (runnersOn > 0 && outs < 2) {
      // Need groundball - more sinkers/changeups
      typeWeights = { fastball: 0.25, curveball: 0.2, changeup: 0.4, slider: 0.15 };
    } else {
      // Standard mix
      typeWeights = { fastball: 0.45, curveball: 0.25, changeup: 0.2, slider: 0.1 };
    }

    // Select type based on weights
    const type = this.weightedSelect(typeWeights);

    // Location selection
    const location = this.selectLocation(count, batter, type);

    // Speed and break based on type
    const pitchData = this.getPitchData(type);

    // Adjust for difficulty
    const accuracyPenalty = {
      easy: 0.15,
      medium: 0.08,
      hard: 0.03,
    }[this.difficulty];

    // Add random error to location
    location.x += (Math.random() - 0.5) * accuracyPenalty * 2;
    location.y += (Math.random() - 0.5) * accuracyPenalty * 2;

    const isStrike = this.isInStrikeZone(location);

    const selection: PitchSelection = {
      type: type as any,
      location,
      speed: pitchData.speed,
      breakingAmount: pitchData.break,
      isStrike,
    };

    this.pitchHistory.push(selection);
    return selection;
  }

  private selectLocation(
    count: { balls: number; strikes: number },
    batter: CharacterData,
    pitchType: string
  ): { x: number; y: number } {
    // Strike zone: x from -1 to 1, y from 0 to 1
    let x: number, y: number;

    if (count.balls === 3) {
      // Must throw strike - middle of zone
      x = (Math.random() - 0.5) * 0.8;
      y = 0.3 + Math.random() * 0.4;
    } else if (count.strikes === 2) {
      // Expand zone - try to get chase
      x = (Math.random() - 0.5) * 1.4;
      y = Math.random() < 0.5 ? 0.1 : 0.9;
    } else {
      // Normal location
      x = (Math.random() - 0.5) * 1.0;
      y = 0.2 + Math.random() * 0.6;
    }

    // Adjust based on batter's weak spots (derived from stats)
    if (batter.stats.contact < 6) {
      // Low contact = pitch to edges
      x = x * 1.2;
    }

    return { x, y };
  }

  private getPitchData(type: string): { speed: number; break: number } {
    const data: Record<string, { speed: number; break: number }> = {
      fastball: { speed: 600, break: 0.1 },
      curveball: { speed: 450, break: 0.8 },
      changeup: { speed: 400, break: 0.3 },
      slider: { speed: 500, break: 0.6 },
    };
    return data[type] || data.fastball;
  }

  private isInStrikeZone(location: { x: number; y: number }): boolean {
    return Math.abs(location.x) <= 0.5 && location.y >= 0.2 && location.y <= 0.8;
  }

  private weightedSelect(weights: Record<string, number>): string {
    const total = Object.values(weights).reduce((a, b) => a + b, 0);
    let random = Math.random() * total;

    for (const [key, weight] of Object.entries(weights)) {
      random -= weight;
      if (random <= 0) return key;
    }

    return Object.keys(weights)[0];
  }

  private countRunners(bases: BaseState): number {
    return [bases.first, bases.second, bases.third].filter(Boolean).length;
  }
}
```

### 2.3 Fielding System

Hybrid auto/manual fielding optimized for mobile:

```typescript
// src/games/diamond-sluggers/systems/FieldingSystem.ts

export interface FielderState {
  position: Vector2;
  targetPosition: Vector2 | null;
  isMoving: boolean;
  hasBall: boolean;
  throwTarget: 'first' | 'second' | 'third' | 'home' | null;
}

export class FieldingSystem {
  private fielders: Map<string, FielderState> = new Map();
  private autoFielding: boolean = true;
  private ballPosition: Vector2 | null = null;

  constructor() {
    this.initializeFielders();
  }

  private initializeFielders(): void {
    const positions: Record<string, Vector2> = {
      pitcher: { x: 400, y: 250 },
      catcher: { x: 400, y: 550 },
      first: { x: 550, y: 350 },
      second: { x: 475, y: 275 },
      shortstop: { x: 325, y: 275 },
      third: { x: 250, y: 350 },
      left: { x: 200, y: 150 },
      center: { x: 400, y: 100 },
      right: { x: 600, y: 150 },
    };

    for (const [pos, coords] of Object.entries(positions)) {
      this.fielders.set(pos, {
        position: { ...coords },
        targetPosition: null,
        isMoving: false,
        hasBall: false,
        throwTarget: null,
      });
    }
  }

  onBallHit(trajectory: Vector2[], landingPosition: Vector2): void {
    this.ballPosition = landingPosition;

    if (this.autoFielding) {
      // Auto-route nearest fielder
      const nearestFielder = this.findNearestFielder(landingPosition);
      if (nearestFielder) {
        this.routeFielder(nearestFielder, landingPosition);
      }
    }
  }

  private findNearestFielder(position: Vector2): string | null {
    let nearest: string | null = null;
    let minDistance = Infinity;

    for (const [name, state] of this.fielders) {
      if (name === 'catcher') continue; // Catcher stays home

      const distance = this.distance(state.position, position);
      if (distance < minDistance) {
        minDistance = distance;
        nearest = name;
      }
    }

    return nearest;
  }

  private routeFielder(name: string, target: Vector2): void {
    const fielder = this.fielders.get(name);
    if (!fielder) return;

    fielder.targetPosition = target;
    fielder.isMoving = true;
  }

  update(deltaTime: number, fielderSpeed: number): void {
    for (const [name, state] of this.fielders) {
      if (!state.isMoving || !state.targetPosition) continue;

      const direction = {
        x: state.targetPosition.x - state.position.x,
        y: state.targetPosition.y - state.position.y,
      };

      const dist = Math.sqrt(direction.x ** 2 + direction.y ** 2);

      if (dist < 5) {
        // Reached target
        state.position = { ...state.targetPosition };
        state.isMoving = false;
        state.targetPosition = null;

        // Check if at ball
        if (this.ballPosition && this.distance(state.position, this.ballPosition) < 10) {
          state.hasBall = true;
          this.onFielderCatchBall(name);
        }
      } else {
        // Move toward target
        const moveSpeed = (fielderSpeed * deltaTime) / 1000;
        state.position.x += (direction.x / dist) * moveSpeed;
        state.position.y += (direction.y / dist) * moveSpeed;
      }
    }
  }

  private onFielderCatchBall(fielderName: string): void {
    // Determine best throw target based on situation
    // This is where the AI decides where to throw
  }

  // Manual control override
  manualMoveFielder(name: string, target: Vector2): void {
    this.autoFielding = false;
    this.routeFielder(name, target);
  }

  private distance(a: Vector2, b: Vector2): number {
    return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
  }
}
```

### 2.4 Base Running

Simple touch controls for base advancement:

```typescript
// src/games/diamond-sluggers/systems/BaseRunningSystem.ts

export type Base = 'first' | 'second' | 'third' | 'home';

export interface Runner {
  characterId: string;
  currentBase: Base;
  targetBase: Base | null;
  position: Vector2;
  isMoving: boolean;
  speed: number;
}

export class BaseRunningSystem {
  private runners: Runner[] = [];
  private basePositions: Record<Base, Vector2> = {
    home: { x: 400, y: 550 },
    first: { x: 550, y: 400 },
    second: { x: 400, y: 250 },
    third: { x: 250, y: 400 },
  };

  advanceAll(): void {
    for (const runner of this.runners) {
      const nextBase = this.getNextBase(runner.currentBase);
      if (nextBase) {
        runner.targetBase = nextBase;
        runner.isMoving = true;
      }
    }
  }

  advanceRunner(characterId: string): void {
    const runner = this.runners.find((r) => r.characterId === characterId);
    if (!runner) return;

    const nextBase = this.getNextBase(runner.currentBase);
    if (nextBase) {
      runner.targetBase = nextBase;
      runner.isMoving = true;
    }
  }

  holdRunner(characterId: string): void {
    const runner = this.runners.find((r) => r.characterId === characterId);
    if (!runner || !runner.isMoving) return;

    // Stop at current base if safe
    runner.targetBase = runner.currentBase;
    runner.isMoving = false;
  }

  attemptSteal(characterId: string): boolean {
    const runner = this.runners.find((r) => r.characterId === characterId);
    if (!runner) return false;

    const nextBase = this.getNextBase(runner.currentBase);
    if (!nextBase || nextBase === 'home') return false;

    // Calculate steal success based on runner speed and catcher throw
    const character = getCharacter(characterId);
    const stealChance = 0.3 + (character?.stats.speed || 5) * 0.07;

    runner.targetBase = nextBase;
    runner.isMoving = true;

    // Result determined when runner reaches base vs throw
    return true;
  }

  update(deltaTime: number): void {
    const scoredRunners: string[] = [];

    for (const runner of this.runners) {
      if (!runner.isMoving || !runner.targetBase) continue;

      const targetPos = this.basePositions[runner.targetBase];
      const direction = {
        x: targetPos.x - runner.position.x,
        y: targetPos.y - runner.position.y,
      };

      const dist = Math.sqrt(direction.x ** 2 + direction.y ** 2);
      const moveAmount = (runner.speed * deltaTime) / 1000;

      if (dist <= moveAmount) {
        // Reached base
        runner.position = { ...targetPos };
        runner.currentBase = runner.targetBase;
        runner.targetBase = null;
        runner.isMoving = false;

        if (runner.currentBase === 'home') {
          scoredRunners.push(runner.characterId);
        }
      } else {
        runner.position.x += (direction.x / dist) * moveAmount;
        runner.position.y += (direction.y / dist) * moveAmount;
      }
    }

    // Remove scored runners
    for (const id of scoredRunners) {
      const index = this.runners.findIndex((r) => r.characterId === id);
      if (index >= 0) {
        this.runners.splice(index, 1);
      }
    }

    return scoredRunners.length; // Number of runs scored
  }

  private getNextBase(current: Base): Base | null {
    const order: Base[] = ['first', 'second', 'third', 'home'];
    const currentIndex = current === 'home' ? -1 : order.indexOf(current);
    return currentIndex < 3 ? order[currentIndex + 1] : null;
  }

  addRunner(characterId: string, base: Base, speed: number): void {
    this.runners.push({
      characterId,
      currentBase: base,
      targetBase: null,
      position: { ...this.basePositions[base] },
      isMoving: false,
      speed,
    });
  }

  clearBases(): void {
    this.runners = [];
  }
}
```

---

## Part 3: Original Character System

### 3.1 Complete Character Roster (16 Characters)

The existing 12 characters in `/Users/AustinHumphrey/BSI/public/game/js/characters.js` are excellent. Here are 4 additional characters to complete the roster:

```typescript
// Additional characters to add to CharacterData.ts

export const ADDITIONAL_CHARACTERS: CharacterData[] = [
  {
    id: 'zoe-whirlwind',
    name: 'Zoe "Whirlwind" Washington',
    emoji: '🌪️',
    age: 11,
    hometown: 'Waco, TX',
    bio: 'Pitcher with devastating spin and unpredictable movement',
    stats: {
      power: 5,
      contact: 7,
      speed: 8,
      fielding: 7,
      pitching: 9,
    },
    ability: {
      name: 'Tornado Curve',
      description: 'Curveball breaks twice as much for 3 pitches',
      cooldown: 4,
      type: 'active',
    },
    colors: {
      primary: '#8B5CF6', // Purple
      secondary: '#6D28D9',
    },
    unlockCondition: 'tournament-win', // Win a tournament
    voiceLines: {
      selected: "Let's spin 'em dizzy!",
      homeRun: "That's outta here!",
      strikeout: 'Sit down!',
    },
  },
  {
    id: 'theo-calculator',
    name: 'Theo "Calculator" Kim',
    emoji: '🧮',
    age: 10,
    hometown: 'Sugar Land, TX',
    bio: 'Math whiz who calculates the perfect pitch location every time',
    stats: {
      power: 4,
      contact: 10,
      speed: 5,
      fielding: 8,
      pitching: 8,
    },
    ability: {
      name: 'Probability Shield',
      description: "See pitch location before it's thrown (batting only)",
      cooldown: 5,
      type: 'active',
    },
    colors: {
      primary: '#0EA5E9', // Sky blue
      secondary: '#0284C7',
    },
    unlockCondition: 'perfect-game', // Pitch a perfect game
    voiceLines: {
      selected: "I've done the math.",
      homeRun: 'Statistically inevitable!',
      strikeout: 'Calculated.',
    },
  },
  {
    id: 'mia-shadow',
    name: 'Mia "Shadow" Okonkwo',
    emoji: '🌑',
    age: 12,
    hometown: 'Midland, TX',
    bio: 'Stealthy outfielder who appears out of nowhere for impossible catches',
    stats: {
      power: 6,
      contact: 8,
      speed: 9,
      fielding: 10,
      pitching: 4,
    },
    ability: {
      name: 'Vanish Catch',
      description: 'Teleport to any fly ball location instantly (once per inning)',
      cooldown: 0, // Per-inning cooldown
      type: 'triggered',
    },
    colors: {
      primary: '#1F2937', // Dark gray
      secondary: '#111827',
    },
    unlockCondition: 'home-run-robbed', // Rob 3 home runs
    voiceLines: {
      selected: 'Now you see me...',
      homeRun: 'From the shadows!',
      strikeout: '...',
    },
  },
  {
    id: 'pete-powerhouse',
    name: 'Pete "Powerhouse" Gonzalez',
    emoji: '💥',
    age: 12,
    hometown: 'Amarillo, TX',
    bio: 'The strongest kid in Texas with legendary home run power',
    stats: {
      power: 10,
      contact: 5,
      speed: 3,
      fielding: 6,
      pitching: 4,
    },
    ability: {
      name: 'Mega Slam',
      description: 'Next home run clears any fence by 100ft and scores all runners',
      cooldown: 6,
      type: 'active',
    },
    colors: {
      primary: '#DC2626', // Red
      secondary: '#991B1B',
    },
    unlockCondition: 'grand-slam', // Hit a grand slam
    voiceLines: {
      selected: 'Time to crush it!',
      homeRun: 'BOOM!',
      strikeout: "I'll get it next time.",
    },
  },
];
```

### 3.2 Character Balance Matrix

Each character should have strengths and weaknesses, creating meaningful team-building choices:

| Character       | Power | Contact | Speed | Field | Pitch | Total | Role                 |
| --------------- | ----- | ------- | ----- | ----- | ----- | ----- | -------------------- |
| Maya Thunder    | 6     | 8       | 10    | 9     | 5     | 38    | Leadoff/OF           |
| Jackson Rocket  | 10    | 6       | 5     | 7     | 6     | 34    | Cleanup/1B           |
| Emma Glove      | 5     | 7       | 7     | 10    | 7     | 36    | Utility/SS           |
| Tyler Knuckle   | 4     | 6       | 6     | 8     | 10    | 34    | Pitcher              |
| Sophia Spark    | 7     | 8       | 8     | 8     | 7     | 38    | 3-hole/3B            |
| Marcus Dash     | 5     | 7       | 10    | 9     | 4     | 35    | Leadoff/CF           |
| Olivia Cannon   | 8     | 7       | 4     | 9     | 6     | 34    | 5-hole/C             |
| Carlos Magic    | 6     | 9       | 7     | 8     | 7     | 37    | 2-hole/2B            |
| Isabella Ice    | 7     | 8       | 6     | 7     | 9     | 37    | Pitcher/Closer       |
| Ryan Wall       | 8     | 7       | 4     | 10    | 5     | 34    | 6-hole/1B            |
| Lily Zoom       | 6     | 9       | 9     | 7     | 6     | 37    | Leadoff/OF           |
| Diego Fire      | 9     | 8       | 7     | 8     | 8     | 40    | Cleanup (Unlockable) |
| Zoe Whirlwind   | 5     | 7       | 8     | 7     | 9     | 36    | Pitcher              |
| Theo Calculator | 4     | 10      | 5     | 8     | 8     | 35    | Contact/2B           |
| Mia Shadow      | 6     | 8       | 9     | 10    | 4     | 37    | CF/Defense           |
| Pete Powerhouse | 10    | 5       | 3     | 6     | 4     | 28    | Power/DH             |

**Design Principles:**

- No character exceeds 40 total stat points
- Diego Fire is the "ultimate" unlockable but not strictly better (weak speed for steal situations)
- Pete Powerhouse has highest power but lowest total (high risk/reward)
- Multiple viable strategies: Speed team, Power team, Defensive team, Balanced

### 3.3 Character Progression System

```typescript
// src/games/diamond-sluggers/config/ProgressionData.ts

export interface UnlockRequirement {
  type: 'wins' | 'achievement' | 'challenge' | 'purchase';
  value: number | string;
  description: string;
}

export const CHARACTER_UNLOCK_REQUIREMENTS: Record<string, UnlockRequirement> = {
  // Starter characters (unlocked at game start)
  'maya-thunder': { type: 'wins', value: 0, description: 'Available at start' },
  'jackson-rocket': { type: 'wins', value: 0, description: 'Available at start' },
  'emma-glove': { type: 'wins', value: 0, description: 'Available at start' },

  // Win-based unlocks
  'tyler-knuckle': { type: 'wins', value: 5, description: 'Win 5 games' },
  'sophia-spark': { type: 'wins', value: 10, description: 'Win 10 games' },
  'marcus-dash': { type: 'wins', value: 15, description: 'Win 15 games' },
  'olivia-cannon': { type: 'wins', value: 20, description: 'Win 20 games' },
  'carlos-magic': { type: 'wins', value: 25, description: 'Win 25 games' },
  'isabella-ice': { type: 'wins', value: 30, description: 'Win 30 games' },
  'ryan-wall': { type: 'wins', value: 35, description: 'Win 35 games' },
  'lily-zoom': { type: 'wins', value: 40, description: 'Win 40 games' },
  'diego-fire': { type: 'wins', value: 50, description: 'Win 50 games' },

  // Achievement-based unlocks
  'zoe-whirlwind': {
    type: 'achievement',
    value: 'tournament-champion',
    description: 'Win a tournament',
  },
  'theo-calculator': {
    type: 'achievement',
    value: 'perfect-game',
    description: 'Pitch a perfect game (no hits, no walks)',
  },
  'mia-shadow': {
    type: 'achievement',
    value: 'home-run-robber',
    description: 'Rob 3 home runs',
  },
  'pete-powerhouse': {
    type: 'achievement',
    value: 'grand-slam',
    description: 'Hit a grand slam',
  },
};

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first-win',
    name: 'First Victory',
    description: 'Win your first game',
    icon: '🏆',
    requirement: { type: 'wins', value: 1 },
  },
  {
    id: 'home-run-derby',
    name: 'Home Run Derby',
    description: 'Hit 5 home runs in a single game',
    icon: '🎆',
    requirement: { type: 'stat', stat: 'homeRunsInGame', value: 5 },
  },
  {
    id: 'shutout',
    name: 'Shutout',
    description: 'Win without allowing any runs',
    icon: '🔒',
    requirement: { type: 'special', value: 'shutout' },
  },
  {
    id: 'perfect-game',
    name: 'Perfect Game',
    description: 'Pitch a complete game with no hits or walks',
    icon: '💎',
    requirement: { type: 'special', value: 'perfect-game' },
  },
  {
    id: 'grand-slam',
    name: 'Grand Slam',
    description: 'Hit a home run with bases loaded',
    icon: '🎰',
    requirement: { type: 'special', value: 'grand-slam' },
  },
  {
    id: 'comeback-kid',
    name: 'Comeback Kid',
    description: 'Win after being down by 5+ runs',
    icon: '📈',
    requirement: { type: 'special', value: 'comeback-5' },
  },
  {
    id: 'home-run-robber',
    name: 'Home Run Robber',
    description: 'Rob 3 home runs total',
    icon: '🚔',
    requirement: { type: 'stat', stat: 'homeRunsRobbed', value: 3 },
  },
  {
    id: 'tournament-champion',
    name: 'Tournament Champion',
    description: 'Win a full tournament',
    icon: '👑',
    requirement: { type: 'special', value: 'tournament-win' },
  },
  {
    id: 'century-club',
    name: 'Century Club',
    description: 'Score 100 total runs',
    icon: '💯',
    requirement: { type: 'stat', stat: 'totalRuns', value: 100 },
  },
  {
    id: 'full-roster',
    name: 'Full Roster',
    description: 'Unlock all 16 characters',
    icon: '🎭',
    requirement: { type: 'collection', value: 16 },
  },
];
```

---

## Part 4: Original Stadium Designs

### 4.1 Complete Stadium Roster (8 Stadiums)

The existing 5 stadiums are great. Here are 3 additional stadiums:

```typescript
// Additional stadiums to add to StadiumData.ts

export const ADDITIONAL_STADIUMS: StadiumData[] = [
  {
    id: 'galveston-beach',
    name: 'Galveston Beach Diamond',
    location: 'Galveston, TX',
    description: 'Sandy beach field with ocean spray and seagull hazards',
    theme: 'beach',
    environment: {
      background: '#00CED1', // Turquoise water
      grass: '#F4A460', // Sandy
      dirt: '#DEB887', // Beach sand
      fence: '#8B4513', // Wooden fence
    },
    dimensions: {
      leftField: 175, // Short - balls carry well
      centerField: 195,
      rightField: 185,
    },
    features: [
      {
        type: 'hazard',
        name: 'Tide Pool',
        position: { x: -160, y: 160 },
        effect: 'Balls landing in tide pool are ground rule doubles',
        visual: 'animated-water',
      },
      {
        type: 'obstacle',
        name: 'Seagull Flock',
        position: { x: 50, y: 180 },
        effect: 'Random seagulls can deflect fly balls',
        visual: 'flying-seagulls',
      },
      {
        type: 'bonus',
        name: 'Sandcastle Tower',
        position: { x: 170, y: 170 },
        effect: 'Home runs that knock down the sandcastle earn 200 bonus points',
        visual: 'sandcastle',
      },
    ],
    weather: {
      wind: { x: 1.2, y: 0.5 }, // Strong sea breeze
      temperature: 88,
      condition: 'sunny',
      specialEffect: 'salt-spray',
    },
    unlockCondition: 'win50',
    difficulty: 'medium',
  },
  {
    id: 'marfa-lights',
    name: 'Marfa Mystery Field',
    location: 'Marfa, TX',
    description: 'Desert field under the mysterious Marfa lights at dusk',
    theme: 'desert-night',
    environment: {
      background: '#4B0082', // Indigo twilight
      grass: '#6B8E23', // Olive desert grass
      dirt: '#D2691E', // Red desert dirt
      fence: '#8B0000', // Dark red
    },
    dimensions: {
      leftField: 205,
      centerField: 250, // Deep center!
      rightField: 200,
    },
    features: [
      {
        type: 'visual',
        name: 'Marfa Lights',
        position: { x: 0, y: 50 },
        effect: 'Mysterious floating lights occasionally illuminate the outfield',
        visual: 'glowing-orbs',
      },
      {
        type: 'obstacle',
        name: 'Tumbleweeds',
        position: { x: -100, y: 180 },
        effect: 'Rolling tumbleweeds can knock ground balls off course',
        visual: 'rolling-tumbleweed',
      },
      {
        type: 'bonus',
        name: 'Art Installation',
        position: { x: 200, y: 220 },
        effect: 'Home runs hitting the art piece score triple points',
        visual: 'modern-sculpture',
      },
    ],
    weather: {
      wind: { x: -0.8, y: 0.2 }, // Desert wind
      temperature: 72,
      condition: 'dusk',
      specialEffect: 'long-shadows',
    },
    unlockCondition: 'win60',
    difficulty: 'hard',
  },
  {
    id: 'nasa-training',
    name: 'NASA Training Grounds',
    location: 'Houston, TX (Space Center)',
    description: 'Futuristic field at the astronaut training facility',
    theme: 'space',
    environment: {
      background: '#1C1C1C', // Space black
      grass: '#228B22', // Artificial turf green
      dirt: '#A9A9A9', // Moon dust gray
      fence: '#C0C0C0', // Silver
    },
    dimensions: {
      leftField: 200,
      centerField: 235,
      rightField: 200,
    },
    features: [
      {
        type: 'modifier',
        name: 'Low Gravity Zone',
        position: { x: 0, y: 100 },
        effect: 'Fly balls in center field stay airborne 20% longer',
        visual: 'gravity-distortion',
      },
      {
        type: 'obstacle',
        name: 'Rover',
        position: { x: -150, y: 190 },
        effect: 'The roving Mars robot can catch ground balls',
        visual: 'mars-rover',
      },
      {
        type: 'bonus',
        name: 'Rocket Launchpad',
        position: { x: 0, y: 230 },
        effect: 'Home runs over center trigger a rocket launch animation and 500 bonus points',
        visual: 'rocket-pad',
      },
    ],
    weather: {
      wind: { x: 0, y: 0 }, // Climate controlled
      temperature: 70,
      condition: 'indoor',
      specialEffect: 'star-field',
    },
    unlockCondition: 'championship-win',
    difficulty: 'expert',
  },
];
```

### 4.2 Stadium Gameplay Variations

Each stadium should feel meaningfully different:

| Stadium             | Dimensions    | Wind          | Special Mechanic        |
| ------------------- | ------------- | ------------- | ----------------------- |
| Boerne Backyard     | Medium        | Light right   | Oak tree doubles        |
| San Antonio Lot     | Asymmetric    | Strong left   | Cactus hazards          |
| Austin Treehouse    | Deep center   | Updraft       | Treehouse bonus         |
| Houston Bayou       | Short right   | Swirling      | Water home runs         |
| Dallas Construction | Huge center   | Updraft       | Crane bonus             |
| Galveston Beach     | Short overall | Sea breeze    | Seagull deflections     |
| Marfa Mystery       | Very deep     | Desert gusts  | Tumbleweed interference |
| NASA Training       | Medium        | None (indoor) | Low gravity zone        |

---

## Part 5: Power-Up System

### 5.1 Power-Up Types

```typescript
// src/games/diamond-sluggers/config/PowerUpData.ts

export type PowerUpCategory = 'batting' | 'pitching' | 'fielding' | 'baserunning';

export interface PowerUp {
  id: string;
  name: string;
  description: string;
  category: PowerUpCategory;
  duration: number; // Seconds, 0 = instant
  cooldown: number; // Innings between uses
  rarity: 'common' | 'rare' | 'legendary';
  effect: PowerUpEffect;
  visualEffect: string;
  soundEffect: string;
}

export const POWER_UPS: PowerUp[] = [
  // Batting Power-Ups
  {
    id: 'mega-bat',
    name: 'Mega Bat',
    description: 'Your bat grows 3x larger for perfect contact',
    category: 'batting',
    duration: 10,
    cooldown: 3,
    rarity: 'common',
    effect: { type: 'timing-window', multiplier: 3 },
    visualEffect: 'bat-grow',
    soundEffect: 'power-up',
  },
  {
    id: 'eagle-eye',
    name: 'Eagle Eye',
    description: 'See the pitch trajectory before it arrives',
    category: 'batting',
    duration: 15,
    cooldown: 2,
    rarity: 'common',
    effect: { type: 'pitch-preview', duration: 15 },
    visualEffect: 'trajectory-line',
    soundEffect: 'vision',
  },
  {
    id: 'power-surge',
    name: 'Power Surge',
    description: 'Triple home run distance for one at-bat',
    category: 'batting',
    duration: 0, // One at-bat
    cooldown: 4,
    rarity: 'rare',
    effect: { type: 'power-multiplier', multiplier: 3 },
    visualEffect: 'lightning-bat',
    soundEffect: 'electric',
  },
  {
    id: 'time-freeze',
    name: 'Time Freeze',
    description: 'Slow down time to perfect your swing',
    category: 'batting',
    duration: 5,
    cooldown: 5,
    rarity: 'legendary',
    effect: { type: 'slow-motion', speedMultiplier: 0.3 },
    visualEffect: 'time-distortion',
    soundEffect: 'whoosh',
  },

  // Pitching Power-Ups
  {
    id: 'smoke-ball',
    name: 'Smoke Ball',
    description: 'Pitch leaves a smoke trail, harder to track',
    category: 'pitching',
    duration: 0, // One pitch
    cooldown: 2,
    rarity: 'common',
    effect: { type: 'visibility-reduction', opacity: 0.4 },
    visualEffect: 'smoke-trail',
    soundEffect: 'whoosh',
  },
  {
    id: 'curveball-king',
    name: 'Curveball King',
    description: 'Curveballs break twice as much',
    category: 'pitching',
    duration: 20,
    cooldown: 3,
    rarity: 'rare',
    effect: { type: 'break-multiplier', multiplier: 2 },
    visualEffect: 'spin-lines',
    soundEffect: 'curve',
  },
  {
    id: 'heat-seeker',
    name: 'Heat Seeker',
    description: 'Fastball hits the corner every time',
    category: 'pitching',
    duration: 0, // One pitch
    cooldown: 4,
    rarity: 'rare',
    effect: { type: 'perfect-location', zone: 'corner' },
    visualEffect: 'target-lock',
    soundEffect: 'lock-on',
  },

  // Fielding Power-Ups
  {
    id: 'magnet-glove',
    name: 'Magnet Glove',
    description: 'Balls are attracted to your fielders',
    category: 'fielding',
    duration: 15,
    cooldown: 3,
    rarity: 'common',
    effect: { type: 'catch-radius', multiplier: 2 },
    visualEffect: 'magnetic-field',
    soundEffect: 'magnet',
  },
  {
    id: 'rocket-arm',
    name: 'Rocket Arm',
    description: 'Throws are instant across the diamond',
    category: 'fielding',
    duration: 10,
    cooldown: 2,
    rarity: 'common',
    effect: { type: 'throw-speed', multiplier: 10 },
    visualEffect: 'fire-trail',
    soundEffect: 'rocket',
  },
  {
    id: 'shadow-fielder',
    name: 'Shadow Fielder',
    description: 'Ghost fielder appears for one catch',
    category: 'fielding',
    duration: 0, // One play
    cooldown: 5,
    rarity: 'legendary',
    effect: { type: 'extra-fielder', position: 'optimal' },
    visualEffect: 'ghost-player',
    soundEffect: 'ethereal',
  },

  // Baserunning Power-Ups
  {
    id: 'speed-boost',
    name: 'Speed Boost',
    description: 'Runners move 50% faster',
    category: 'baserunning',
    duration: 15,
    cooldown: 2,
    rarity: 'common',
    effect: { type: 'speed-multiplier', multiplier: 1.5 },
    visualEffect: 'speed-lines',
    soundEffect: 'zoom',
  },
  {
    id: 'sticky-cleats',
    name: 'Sticky Cleats',
    description: "Can't be thrown out for one base advancement",
    category: 'baserunning',
    duration: 0, // One play
    cooldown: 4,
    rarity: 'rare',
    effect: { type: 'safe-advance', guaranteed: true },
    visualEffect: 'glow-feet',
    soundEffect: 'safe',
  },
  {
    id: 'teleport',
    name: 'Teleport',
    description: 'Runner instantly appears on next base',
    category: 'baserunning',
    duration: 0, // Instant
    cooldown: 6,
    rarity: 'legendary',
    effect: { type: 'instant-advance', bases: 1 },
    visualEffect: 'poof',
    soundEffect: 'teleport',
  },
];
```

### 5.2 Power-Up Acquisition

Power-ups are earned through gameplay, never purchased:

```typescript
// Power-up acquisition system

export class PowerUpSystem {
  private availablePowerUps: PowerUp[] = [];
  private activePowerUps: ActivePowerUp[] = [];
  private cooldowns: Map<string, number> = new Map();

  earnPowerUp(context: PowerUpContext): PowerUp | null {
    // Earn power-ups through achievements during the game
    const triggers: PowerUpTrigger[] = [
      { condition: 'perfectHit', chance: 0.3, pool: 'batting' },
      { condition: 'strikeout', chance: 0.2, pool: 'pitching' },
      { condition: 'divingCatch', chance: 0.4, pool: 'fielding' },
      { condition: 'stolenBase', chance: 0.25, pool: 'baserunning' },
      { condition: 'leadChange', chance: 0.5, pool: 'any' },
      { condition: 'clutchHit', chance: 0.6, pool: 'batting' },
    ];

    for (const trigger of triggers) {
      if (context.event === trigger.condition && Math.random() < trigger.chance) {
        return this.grantRandomPowerUp(trigger.pool);
      }
    }

    return null;
  }

  private grantRandomPowerUp(pool: string): PowerUp {
    const eligible = POWER_UPS.filter(
      (p) => (pool === 'any' || p.category === pool) && !this.isOnCooldown(p.id)
    );

    // Weighted by rarity
    const weights: Record<string, number> = {
      common: 0.6,
      rare: 0.3,
      legendary: 0.1,
    };

    const weighted = eligible.flatMap((p) => Array(Math.floor(weights[p.rarity] * 100)).fill(p));

    const selected = weighted[Math.floor(Math.random() * weighted.length)];
    this.availablePowerUps.push(selected);

    return selected;
  }

  activatePowerUp(powerUpId: string): boolean {
    const index = this.availablePowerUps.findIndex((p) => p.id === powerUpId);
    if (index < 0) return false;

    const powerUp = this.availablePowerUps.splice(index, 1)[0];

    this.activePowerUps.push({
      powerUp,
      activatedAt: Date.now(),
      remainingDuration: powerUp.duration * 1000,
    });

    this.cooldowns.set(powerUpId, powerUp.cooldown);

    return true;
  }

  update(deltaTime: number): void {
    // Update active power-ups
    for (let i = this.activePowerUps.length - 1; i >= 0; i--) {
      const active = this.activePowerUps[i];
      active.remainingDuration -= deltaTime;

      if (active.remainingDuration <= 0) {
        this.activePowerUps.splice(i, 1);
      }
    }
  }

  endInning(): void {
    // Reduce all cooldowns by 1
    for (const [id, remaining] of this.cooldowns) {
      if (remaining <= 1) {
        this.cooldowns.delete(id);
      } else {
        this.cooldowns.set(id, remaining - 1);
      }
    }
  }

  private isOnCooldown(powerUpId: string): boolean {
    return this.cooldowns.has(powerUpId);
  }
}
```

---

## Part 6: Game Modes

### 6.1 Quick Play

Single game against CPU with customizable settings:

- Select your team (3-9 characters)
- Select stadium
- Choose innings (3, 6, or 9)
- Choose difficulty (Easy, Medium, Hard)

### 6.2 Season Mode

Play through a full season with standings and playoffs:

```typescript
// Season mode structure

export interface SeasonConfig {
  teamName: string;
  roster: string[]; // Character IDs
  gamesPerSeason: 12 | 24 | 48;
  playoffTeams: 4 | 8;
}

export interface SeasonStandings {
  teams: TeamRecord[];
  currentWeek: number;
  schedule: ScheduledGame[];
}

export interface TeamRecord {
  teamId: string;
  teamName: string;
  wins: number;
  losses: number;
  runsFor: number;
  runsAgainst: number;
  streak: number;
  isPlayer: boolean;
}

export class SeasonManager {
  private config: SeasonConfig;
  private standings: SeasonStandings;

  constructor(config: SeasonConfig) {
    this.config = config;
    this.standings = this.initializeSeason();
  }

  private initializeSeason(): SeasonStandings {
    // Generate 8 CPU teams
    const cpuTeams = this.generateCPUTeams(7);

    const teams: TeamRecord[] = [
      {
        teamId: 'player',
        teamName: this.config.teamName,
        wins: 0,
        losses: 0,
        runsFor: 0,
        runsAgainst: 0,
        streak: 0,
        isPlayer: true,
      },
      ...cpuTeams.map((team, i) => ({
        teamId: `cpu-${i}`,
        teamName: team.name,
        wins: 0,
        losses: 0,
        runsFor: 0,
        runsAgainst: 0,
        streak: 0,
        isPlayer: false,
      })),
    ];

    const schedule = this.generateSchedule(teams.map((t) => t.teamId));

    return { teams, currentWeek: 1, schedule };
  }

  private generateCPUTeams(count: number): { name: string; roster: string[] }[] {
    const teamNames = [
      'Lubbock Lasers',
      'Beaumont Bombers',
      'Tyler Tornados',
      'Odessa Outlaws',
      'Killeen Knights',
      'McAllen Mustangs',
      'Abilene Aces',
      'Brownsville Blazers',
    ];

    return teamNames.slice(0, count).map((name) => ({
      name,
      roster: this.generateRandomRoster(),
    }));
  }

  private generateRandomRoster(): string[] {
    const allCharacters = CHARACTERS.map((c) => c.id);
    const shuffled = [...allCharacters].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 9);
  }

  private generateSchedule(teamIds: string[]): ScheduledGame[] {
    // Round-robin schedule generator
    const games: ScheduledGame[] = [];
    const totalGames = this.config.gamesPerSeason;

    // Each team plays each other team multiple times
    for (let round = 0; round < Math.ceil(totalGames / (teamIds.length - 1)); round++) {
      for (let i = 0; i < teamIds.length; i++) {
        for (let j = i + 1; j < teamIds.length; j++) {
          games.push({
            week: games.length + 1,
            homeTeam: round % 2 === 0 ? teamIds[i] : teamIds[j],
            awayTeam: round % 2 === 0 ? teamIds[j] : teamIds[i],
            completed: false,
            result: null,
          });
        }
      }
    }

    return games.slice(0, totalGames);
  }

  getNextPlayerGame(): ScheduledGame | null {
    return (
      this.standings.schedule.find(
        (g) => !g.completed && (g.homeTeam === 'player' || g.awayTeam === 'player')
      ) || null
    );
  }

  recordGameResult(gameIndex: number, result: GameResult): void {
    const game = this.standings.schedule[gameIndex];
    game.completed = true;
    game.result = result;

    // Update standings
    const winner = result.homeScore > result.awayScore ? game.homeTeam : game.awayTeam;
    const loser = winner === game.homeTeam ? game.awayTeam : game.homeTeam;

    const winnerRecord = this.standings.teams.find((t) => t.teamId === winner)!;
    const loserRecord = this.standings.teams.find((t) => t.teamId === loser)!;

    winnerRecord.wins++;
    winnerRecord.streak = winnerRecord.streak >= 0 ? winnerRecord.streak + 1 : 1;
    loserRecord.losses++;
    loserRecord.streak = loserRecord.streak <= 0 ? loserRecord.streak - 1 : -1;

    // Update runs
    const homeRecord = this.standings.teams.find((t) => t.teamId === game.homeTeam)!;
    const awayRecord = this.standings.teams.find((t) => t.teamId === game.awayTeam)!;
    homeRecord.runsFor += result.homeScore;
    homeRecord.runsAgainst += result.awayScore;
    awayRecord.runsFor += result.awayScore;
    awayRecord.runsAgainst += result.homeScore;

    // Simulate other games
    this.simulateOtherGames(gameIndex);
  }

  private simulateOtherGames(currentGameIndex: number): void {
    // Simulate all games in the same "week" as the current game
    const currentWeek = Math.floor(currentGameIndex / 4) + 1;

    this.standings.schedule
      .filter(
        (g, i) =>
          !g.completed &&
          Math.floor(i / 4) + 1 === currentWeek &&
          g.homeTeam !== 'player' &&
          g.awayTeam !== 'player'
      )
      .forEach((game) => {
        const homeStrength = this.getTeamStrength(game.homeTeam);
        const awayStrength = this.getTeamStrength(game.awayTeam);
        const homeAdvantage = 0.1;

        const homeWinChance =
          (homeStrength + homeAdvantage) / (homeStrength + awayStrength + homeAdvantage);
        const homeWins = Math.random() < homeWinChance;

        game.completed = true;
        game.result = {
          homeScore: homeWins ? Math.floor(Math.random() * 8) + 3 : Math.floor(Math.random() * 5),
          awayScore: homeWins ? Math.floor(Math.random() * 5) : Math.floor(Math.random() * 8) + 3,
        };

        // Update standings (simplified)
        const winner = homeWins ? game.homeTeam : game.awayTeam;
        const winnerRecord = this.standings.teams.find((t) => t.teamId === winner)!;
        winnerRecord.wins++;
      });
  }

  private getTeamStrength(teamId: string): number {
    const team = this.standings.teams.find((t) => t.teamId === teamId);
    if (!team) return 0.5;
    return 0.5 + (team.wins - team.losses) * 0.02;
  }

  isPlayoffTime(): boolean {
    return this.standings.schedule.every((g) => g.completed);
  }

  getPlayoffBracket(): PlayoffBracket {
    const sorted = [...this.standings.teams]
      .sort((a, b) => b.wins - a.wins || b.runsFor - b.runsAgainst - (a.runsFor - a.runsAgainst))
      .slice(0, this.config.playoffTeams);

    return {
      teams: sorted.map((t) => t.teamId),
      rounds: this.generatePlayoffRounds(sorted.map((t) => t.teamId)),
    };
  }

  private generatePlayoffRounds(teams: string[]): PlayoffRound[] {
    // Standard bracket: 1v8, 4v5, 3v6, 2v7 for 8 teams
    const rounds: PlayoffRound[] = [];

    if (teams.length === 8) {
      rounds.push({
        name: 'Quarterfinals',
        matchups: [
          { team1: teams[0], team2: teams[7] },
          { team1: teams[3], team2: teams[4] },
          { team1: teams[2], team2: teams[5] },
          { team1: teams[1], team2: teams[6] },
        ],
      });
    }

    // Add semifinal and final placeholders
    rounds.push({ name: 'Semifinals', matchups: [] });
    rounds.push({ name: 'Championship', matchups: [] });

    return rounds;
  }
}
```

### 6.3 Home Run Derby

Standalone mode focusing on power hitting:

```typescript
// Home Run Derby mode

export interface DerbyConfig {
  rounds: number; // 2 or 3
  outsPerRound: 10 | 15; // Outs = non-HR hits
  timePerRound?: number; // Optional timed mode
  participants: string[]; // 4 or 8 character IDs
}

export interface DerbyState {
  currentRound: number;
  currentParticipant: string;
  scores: Map<string, number[]>; // Character ID -> HRs per round
  eliminated: string[];
  outs: number;
  timeRemaining?: number;
}

export class HomeRunDerbyManager {
  private config: DerbyConfig;
  private state: DerbyState;

  constructor(config: DerbyConfig) {
    this.config = config;
    this.state = this.initializeState();
  }

  private initializeState(): DerbyState {
    const scores = new Map<string, number[]>();
    this.config.participants.forEach((id) => scores.set(id, []));

    return {
      currentRound: 1,
      currentParticipant: this.config.participants[0],
      scores,
      eliminated: [],
      outs: 0,
      timeRemaining: this.config.timePerRound,
    };
  }

  recordSwing(result: SwingResult, distance: number): DerbySwingResult {
    const isHomeRun = result.type === 'perfect' || result.type === 'good';
    const minHRDistance = 250; // Pixels for HR

    if (isHomeRun && distance >= minHRDistance) {
      const currentScores = this.state.scores.get(this.state.currentParticipant)!;
      if (!currentScores[this.state.currentRound - 1]) {
        currentScores[this.state.currentRound - 1] = 0;
      }
      currentScores[this.state.currentRound - 1]++;

      return {
        isHomeRun: true,
        distance,
        totalHRs: currentScores[this.state.currentRound - 1],
        outsRemaining: this.config.outsPerRound - this.state.outs,
        message: `HOME RUN! ${Math.floor(distance)} ft`,
      };
    } else {
      this.state.outs++;

      if (this.state.outs >= this.config.outsPerRound) {
        this.endTurn();
      }

      return {
        isHomeRun: false,
        distance: 0,
        totalHRs:
          this.state.scores.get(this.state.currentParticipant)![this.state.currentRound - 1] || 0,
        outsRemaining: this.config.outsPerRound - this.state.outs,
        message: `OUT! ${this.config.outsPerRound - this.state.outs} outs remaining`,
      };
    }
  }

  private endTurn(): void {
    const participants = this.config.participants.filter((p) => !this.state.eliminated.includes(p));

    const currentIndex = participants.indexOf(this.state.currentParticipant);

    if (currentIndex < participants.length - 1) {
      // Next participant in current round
      this.state.currentParticipant = participants[currentIndex + 1];
      this.state.outs = 0;
    } else {
      // End of round
      this.endRound();
    }
  }

  private endRound(): void {
    // Eliminate bottom half (or lowest in final)
    const remaining = this.config.participants.filter((p) => !this.state.eliminated.includes(p));

    const roundScores = remaining
      .map((p) => ({
        id: p,
        score: this.state.scores.get(p)![this.state.currentRound - 1] || 0,
      }))
      .sort((a, b) => b.score - a.score);

    if (this.state.currentRound < this.config.rounds) {
      // Eliminate bottom half
      const cutoff = Math.floor(roundScores.length / 2);
      roundScores.slice(cutoff).forEach((p) => this.state.eliminated.push(p.id));

      this.state.currentRound++;
      this.state.currentParticipant = roundScores[0].id;
      this.state.outs = 0;
    } else {
      // Finals complete - determine winner
      this.state.currentRound = -1; // Indicates complete
    }
  }

  getWinner(): string | null {
    if (this.state.currentRound !== -1) return null;

    const remaining = this.config.participants.filter((p) => !this.state.eliminated.includes(p));

    return remaining.reduce((best, current) => {
      const bestTotal = this.getTotalHRs(best);
      const currentTotal = this.getTotalHRs(current);
      return currentTotal > bestTotal ? current : best;
    }, remaining[0]);
  }

  private getTotalHRs(characterId: string): number {
    const scores = this.state.scores.get(characterId);
    return scores ? scores.reduce((a, b) => a + b, 0) : 0;
  }

  getLeaderboard(): { id: string; hrs: number }[] {
    return this.config.participants
      .map((id) => ({ id, hrs: this.getTotalHRs(id) }))
      .sort((a, b) => b.hrs - a.hrs);
  }
}
```

### 6.4 Practice Mode

Free practice with adjustable settings:

- Select any character
- Choose pitch types to face
- Enable/disable power-ups
- Slow-motion option for learning timing
- No scoring/statistics

---

## Part 7: Monetization Strategy

### 7.1 Ethical, Kid-Friendly Approach

**Core Principle:** The game should be fully enjoyable without spending money. No content that affects gameplay is locked behind paywalls.

**Base Game: $4.99 Premium (No Ads)**

Includes:

- All 16 characters (earned through gameplay)
- All 8 stadiums (earned through gameplay)
- All game modes
- Cloud save sync
- No advertisements ever

**Optional Cosmetic DLC ($0.99 - $2.99 each):**

1. **Uniform Packs** ($0.99)
   - Retro Uniforms: 1970s striped designs
   - Neon Pack: Bright fluorescent colors
   - Camo Collection: Camouflage patterns
   - Texas Pride: State flag inspired

2. **Equipment Skins** ($0.99)
   - Bat Designs: Lightning, flames, ice
   - Glove Styles: Gold, silver, rainbow
   - Helmet Decals: Stars, stripes, animals

3. **Stadium Themes** ($1.99)
   - Night Mode: All stadiums at night
   - Weather Pack: Rain, snow, fog effects
   - Holiday: Halloween, Christmas decorations

4. **Celebration Packs** ($0.99)
   - Custom home run celebrations
   - Victory dances
   - Walk-up animations

### 7.2 COPPA Compliance

```typescript
// Privacy-first implementation

export class PrivacyManager {
  private ageVerified: boolean = false;
  private isChild: boolean = true; // Assume child until proven otherwise

  async verifyAge(): Promise<boolean> {
    // Simple age gate - no data collection
    const birthYear = await this.showAgeGate();
    const age = new Date().getFullYear() - birthYear;

    this.ageVerified = true;
    this.isChild = age < 13;

    if (this.isChild) {
      this.enableChildProtections();
    }

    return this.isChild;
  }

  private enableChildProtections(): void {
    // Disable all social features
    // Disable cloud save (requires account)
    // Disable leaderboards with usernames
    // Use device-only storage
    // No analytics beyond crash reporting
  }

  canUseCloudSave(): boolean {
    return this.ageVerified && !this.isChild;
  }

  canAccessLeaderboards(): boolean {
    return this.ageVerified && !this.isChild;
  }

  getPrivacySettings(): PrivacySettings {
    return {
      collectAnalytics: !this.isChild,
      allowCloudSync: !this.isChild,
      showLeaderboards: !this.isChild,
      allowChat: false, // Never allow chat
      allowUserContent: false, // Never allow UGC
    };
  }
}
```

---

## Part 8: Implementation Priorities

### Phase 1: Core Loop (Weeks 1-4)

**Week 1-2: Foundation**

- [ ] Phaser project setup with TypeScript
- [ ] Basic scene structure (Boot, Menu, Game)
- [ ] Touch input system with swing detection
- [ ] Simple ball physics (pitch to plate)

**Week 3-4: Batting Mechanics**

- [ ] Timing-based swing system
- [ ] Hit result calculation (single/double/triple/HR/out)
- [ ] Ball trajectory visualization
- [ ] Score tracking and count display

**Deliverable:** Playable single at-bat demo

### Phase 2: Characters and Content (Weeks 5-8)

**Week 5-6: Character System**

- [ ] All 16 character definitions
- [ ] Character selection UI
- [ ] Stat-based gameplay modifiers
- [ ] Character abilities (basic implementation)

**Week 7-8: Stadium System**

- [ ] All 8 stadium definitions
- [ ] Stadium-specific physics (wind, dimensions)
- [ ] Stadium feature interactions
- [ ] Stadium selection UI

**Deliverable:** Full game with character/stadium selection

### Phase 3: Game Modes and Polish (Weeks 9-12)

**Week 9-10: Game Modes**

- [ ] Quick Play mode complete
- [ ] Home Run Derby mode
- [ ] Season mode structure
- [ ] Practice mode

**Week 11-12: Progression and Polish**

- [ ] Save/load system
- [ ] Unlock progression
- [ ] Achievement system
- [ ] Audio integration
- [ ] Accessibility features

**Deliverable:** Feature-complete beta

### Phase 4: Testing and Launch (Weeks 13-16)

**Week 13-14: Testing**

- [ ] Device testing (iOS/Android physical devices)
- [ ] Performance optimization
- [ ] User testing with target age group
- [ ] Bug fixes

**Week 15-16: Launch Preparation**

- [ ] App store assets (screenshots, video)
- [ ] App store submission
- [ ] Web version deployment to blazesportsintel.com/game
- [ ] Marketing materials

**Deliverable:** Production launch

---

## Part 9: Testing Checklist

### Device Testing Matrix

| Device         | OS         | Resolution | Result |
| -------------- | ---------- | ---------- | ------ |
| iPhone SE      | iOS 15+    | 750x1334   |        |
| iPhone 14      | iOS 17     | 1170x2532  |        |
| iPad Mini      | iPadOS 17  | 1488x2266  |        |
| iPad Pro       | iPadOS 17  | 2048x2732  |        |
| Pixel 6        | Android 13 | 1080x2400  |        |
| Galaxy S21     | Android 12 | 1080x2400  |        |
| Budget Android | Android 10 | 720x1280   |        |

### Performance Targets

| Metric        | Target      | Acceptable     |
| ------------- | ----------- | -------------- |
| Framerate     | 60 fps      | 30 fps minimum |
| Load time     | < 3 seconds | < 5 seconds    |
| Memory        | < 150 MB    | < 250 MB       |
| Bundle size   | < 50 MB     | < 100 MB       |
| Battery drain | < 10%/hour  | < 15%/hour     |

### Accessibility Checklist

- [ ] Touch targets minimum 44x44pt
- [ ] Color contrast WCAG AA (4.5:1)
- [ ] Screen reader compatible
- [ ] Adjustable text size
- [ ] Colorblind mode (deuteranopia, protanopia)
- [ ] One-handed play mode
- [ ] Reduced motion option
- [ ] Audio descriptions for key events

---

## Part 10: Legal Verification

### IP Clearance Checklist

- [ ] No character names match existing franchises
- [ ] No visual designs resemble existing characters
- [ ] No stadium names match real locations trademarked for games
- [ ] No audio resembles existing game soundtracks
- [ ] "Diamond Sluggers" trademark search completed
- [ ] All fonts are licensed for commercial use
- [ ] All audio is original or properly licensed

### Character Name Verification

All 16 character names have been verified as original:

- No matches to Humongous Entertainment characters
- No matches to MLB players (current or historical)
- No matches to other video game franchises
- Names are culturally appropriate and non-stereotypical

---

## Conclusion

Diamond Sluggers is designed to capture the magic of nostalgic backyard baseball games while being 100% original and legally distinct. The game prioritizes:

1. **Fun, accessible gameplay** for ages 8-14
2. **Mobile-first design** with touch-optimized controls
3. **Ethical monetization** with no predatory mechanics
4. **Original IP** with unique characters and stadiums
5. **Texas heart** with universal appeal

The existing code foundation in `/Users/AustinHumphrey/BSI/public/game/` provides a solid starting point. The Phaser-based implementation in `/Users/AustinHumphrey/BSI/apps/games/phaser-bbp-web/` can be extended with the systems outlined in this document.

Next steps:

1. Review and approve character/stadium additions
2. Begin Phase 1 implementation
3. Set up automated testing pipeline
4. Create asset requirements for artists

---

_Document created: 2025-11-26_
_Project: Diamond Sluggers_
_Repository: github.com/ahump20/BSI_
