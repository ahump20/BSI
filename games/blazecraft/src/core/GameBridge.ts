/**
 * GameBridge - Frontend SSE client for BlazeCraft game events
 *
 * Connects to /api/game/events SSE stream and transforms game events
 * into city building effects. Falls back to demo mode if connection fails.
 *
 * Replaces direct browser-to-BSI calls with cached, proxied backend.
 */

import {
  AnyGameEvent,
  GameEventType,
  CityEventMapping,
  PremiumTier,
  SportType,
  GameUpdatePayload,
  isGameEvent,
  mapEventToCityEffect,
  PLAY_EFFECT_MAP,
  SPORT_BUILDING_MAP,
  COLORS,
} from './GameEventContract';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error' | 'demo';

export interface GameBridgeCallbacks {
  onGameEvent?: (event: AnyGameEvent) => void;
  onCityEffect?: (effect: CityEventMapping, event: AnyGameEvent) => void;
  onStatusChange?: (status: ConnectionStatus) => void;
  onScoreUpdate?: (scores: ScoreState[]) => void;
}

export interface GameBridgeConfig {
  baseUrl?: string;
  tier?: PremiumTier;
  enabledSports?: SportType[];
  favoriteTeams?: string[];
  demoFallbackTimeout?: number;
  reconnectDelay?: number;
}

export interface ScoreState {
  gameId: string;
  sport: SportType;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  status: 'scheduled' | 'in_progress' | 'final' | 'delayed';
  period?: string;
  clock?: string;
  lastUpdate: number;
}

// ─────────────────────────────────────────────────────────────
// GameBridge Class
// ─────────────────────────────────────────────────────────────

export class GameBridge {
  private eventSource: EventSource | null = null;
  private demoInterval: ReturnType<typeof setInterval> | null = null;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private connectionTimeout: ReturnType<typeof setTimeout> | null = null;
  private status: ConnectionStatus = 'disconnected';
  private scores: Map<string, ScoreState> = new Map();
  private callbacks: GameBridgeCallbacks;
  private config: Required<GameBridgeConfig>;
  private favoriteTeams: Set<string>;
  private clientId: string;
  private lastSeq: number = 0;

  constructor(callbacks: GameBridgeCallbacks = {}, config: GameBridgeConfig = {}) {
    this.callbacks = callbacks;
    this.config = {
      baseUrl: config.baseUrl ?? '/api/game/events',
      tier: config.tier ?? null,
      enabledSports: config.enabledSports ?? ['mlb', 'nfl', 'nba'],
      favoriteTeams: config.favoriteTeams ?? [],
      demoFallbackTimeout: config.demoFallbackTimeout ?? 30000,
      reconnectDelay: config.reconnectDelay ?? 5000,
    };
    this.favoriteTeams = new Set(this.config.favoriteTeams);
    this.clientId = this.loadOrCreateClientId();
  }

  // ─────────────────────────────────────────────────────────────
  // Connection Management
  // ─────────────────────────────────────────────────────────────

  connect(): void {
    if (this.status === 'connected' || this.status === 'connecting') return;

    this.setStatus('connecting');
    this.connectSSE();

    // Fallback to demo mode if no connection after timeout
    this.connectionTimeout = setTimeout(() => {
      if (this.status !== 'connected') {
        this.startDemoMode();
      }
    }, this.config.demoFallbackTimeout);
  }

  disconnect(): void {
    this.clearTimers();

    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }

    if (this.demoInterval) {
      clearInterval(this.demoInterval);
      this.demoInterval = null;
    }

    this.setStatus('disconnected');
  }

  getScores(): ScoreState[] {
    return Array.from(this.scores.values());
  }

  getScoresBySport(sport: SportType): ScoreState[] {
    return this.getScores().filter((s) => s.sport === sport);
  }

  getStatus(): ConnectionStatus {
    return this.status;
  }

  // ─────────────────────────────────────────────────────────────
  // Favorites
  // ─────────────────────────────────────────────────────────────

  isFavoriteTeam(team: string): boolean {
    return this.favoriteTeams.has(team);
  }

  addFavoriteTeam(team: string): void {
    this.favoriteTeams.add(team);
    this.saveFavorites();
  }

  removeFavoriteTeam(team: string): void {
    this.favoriteTeams.delete(team);
    this.saveFavorites();
  }

  getFavoriteTeams(): string[] {
    return Array.from(this.favoriteTeams);
  }

  // ─────────────────────────────────────────────────────────────
  // Private - SSE Connection
  // ─────────────────────────────────────────────────────────────

  private connectSSE(): void {
    const params = new URLSearchParams({
      clientId: this.clientId,
      tier: this.config.tier || '',
    });

    const url = `${this.config.baseUrl}?${params}`;

    try {
      this.eventSource = new EventSource(url);

      this.eventSource.addEventListener('connected', (e: MessageEvent) => {
        this.clearTimers();
        this.setStatus('connected');
        try {
          const data = JSON.parse(e.data) as { clientId: string };
          this.clientId = data.clientId;
          this.saveClientId();
        } catch {
          // Ignore parse errors
        }
      });

      this.eventSource.addEventListener('game_event', (e: MessageEvent) => {
        try {
          const event = JSON.parse(e.data) as AnyGameEvent;
          if (isGameEvent(event)) {
            this.handleGameEvent(event);
          }
        } catch {
          // Ignore parse errors
        }
      });

      this.eventSource.addEventListener('heartbeat', (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data) as { seq: number };
          this.lastSeq = data.seq;
        } catch {
          // Ignore
        }
      });

      this.eventSource.onerror = () => {
        this.setStatus('error');
        this.eventSource?.close();
        this.eventSource = null;
        this.scheduleReconnect();
      };
    } catch {
      this.setStatus('error');
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimeout) return;

    this.reconnectTimeout = setTimeout(() => {
      this.reconnectTimeout = null;
      if (this.status !== 'connected' && this.status !== 'demo') {
        this.connectSSE();
      }
    }, this.config.reconnectDelay);
  }

  private clearTimers(): void {
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }

  // ─────────────────────────────────────────────────────────────
  // Private - Demo Mode
  // ─────────────────────────────────────────────────────────────

  private startDemoMode(): void {
    if (this.demoInterval) return;

    this.setStatus('demo');

    // Generate synthetic events every 3-8 seconds
    const generateEvent = (): void => {
      const event = this.createDemoEvent();
      this.handleGameEvent(event);
    };

    // Initial event
    generateEvent();

    // Periodic events
    this.demoInterval = setInterval(() => {
      generateEvent();
    }, 3000 + Math.random() * 5000);
  }

  private createDemoEvent(): AnyGameEvent {
    const sports: SportType[] = this.config.enabledSports;
    const sport = sports[Math.floor(Math.random() * sports.length)];
    const eventTypes: GameEventType[] = ['GAME_UPDATE', 'GAME_START', 'GAME_FINAL'];
    const type = eventTypes[Math.floor(Math.random() * eventTypes.length)];

    const teams = this.getDemoTeams(sport);
    const homeScore = Math.floor(Math.random() * 10);
    const awayScore = Math.floor(Math.random() * 10);

    this.lastSeq++;

    const baseEvent = {
      id: crypto.randomUUID().slice(0, 8),
      source: 'demo' as const,
      timestamp: new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' }),
      seq: this.lastSeq,
      premiumTier: null,
    };

    if (type === 'GAME_START') {
      return {
        ...baseEvent,
        type: 'GAME_START',
        payload: {
          gameId: `demo-${sport}-${Date.now()}`,
          sport,
          homeTeam: teams.home,
          awayTeam: teams.away,
          startTime: new Date().toISOString(),
        },
      };
    }

    if (type === 'GAME_FINAL') {
      return {
        ...baseEvent,
        type: 'GAME_FINAL',
        payload: {
          gameId: `demo-${sport}-${Date.now()}`,
          sport,
          homeTeam: teams.home,
          awayTeam: teams.away,
          homeScore,
          awayScore,
          winner: homeScore > awayScore ? teams.home : teams.away,
        },
      };
    }

    // GAME_UPDATE with random play type
    const playTypes = sport === 'mlb'
      ? ['home_run', 'strikeout', null]
      : sport === 'nfl'
        ? ['touchdown', 'field_goal', 'interception', null]
        : ['three_pointer', 'slam_dunk', null];

    const playType = playTypes[Math.floor(Math.random() * playTypes.length)];

    return {
      ...baseEvent,
      type: 'GAME_UPDATE',
      payload: {
        gameId: `demo-${sport}-${Date.now()}`,
        sport,
        homeTeam: teams.home,
        awayTeam: teams.away,
        homeScore,
        awayScore,
        period: sport === 'mlb' ? `${Math.floor(Math.random() * 9) + 1}` : `Q${Math.floor(Math.random() * 4) + 1}`,
        playType: playType ?? undefined,
      },
    };
  }

  private getDemoTeams(sport: SportType): { home: string; away: string } {
    const mlbTeams = ['Rangers', 'Astros', 'Yankees', 'Dodgers', 'Cubs', 'Red Sox'];
    const nflTeams = ['Cowboys', 'Texans', 'Chiefs', 'Eagles', 'Patriots', '49ers'];
    const nbaTeams = ['Mavericks', 'Rockets', 'Lakers', 'Celtics', 'Bulls', 'Warriors'];

    const teams = sport === 'mlb' ? mlbTeams : sport === 'nfl' ? nflTeams : nbaTeams;
    const home = teams[Math.floor(Math.random() * teams.length)];
    let away = teams[Math.floor(Math.random() * teams.length)];
    while (away === home) {
      away = teams[Math.floor(Math.random() * teams.length)];
    }

    return { home, away };
  }

  // ─────────────────────────────────────────────────────────────
  // Private - Event Handling
  // ─────────────────────────────────────────────────────────────

  private handleGameEvent(event: AnyGameEvent): void {
    // Update scores cache
    if (event.type === 'GAME_UPDATE' || event.type === 'GAME_START' || event.type === 'GAME_FINAL') {
      this.updateScoreFromEvent(event);
    }

    // Notify callback
    this.callbacks.onGameEvent?.(event);

    // Map to city effect
    const cityEffect = mapEventToCityEffect(event);
    if (cityEffect) {
      // Boost effect for favorite teams
      if (this.isEventForFavoriteTeam(event)) {
        cityEffect.upgradePoints *= 2;
      }

      this.callbacks.onCityEffect?.(cityEffect, event);
    }
  }

  private updateScoreFromEvent(event: AnyGameEvent): void {
    const payload = event.payload as GameUpdatePayload;
    if (!payload.gameId) return;

    const score: ScoreState = {
      gameId: payload.gameId,
      sport: payload.sport,
      homeTeam: payload.homeTeam,
      awayTeam: payload.awayTeam,
      homeScore: payload.homeScore ?? 0,
      awayScore: payload.awayScore ?? 0,
      status: event.type === 'GAME_START'
        ? 'in_progress'
        : event.type === 'GAME_FINAL'
          ? 'final'
          : 'in_progress',
      period: payload.period,
      clock: payload.clock,
      lastUpdate: Date.now(),
    };

    this.scores.set(score.gameId, score);
    this.callbacks.onScoreUpdate?.(this.getScores());
  }

  private isEventForFavoriteTeam(event: AnyGameEvent): boolean {
    const payload = event.payload as { homeTeam?: string; awayTeam?: string; team?: string };
    return Boolean(
      (payload.homeTeam && this.favoriteTeams.has(payload.homeTeam)) ||
      (payload.awayTeam && this.favoriteTeams.has(payload.awayTeam)) ||
      (payload.team && this.favoriteTeams.has(payload.team))
    );
  }

  // ─────────────────────────────────────────────────────────────
  // Private - Persistence
  // ─────────────────────────────────────────────────────────────

  private loadOrCreateClientId(): string {
    try {
      const saved = localStorage.getItem('blazecraft_client_id');
      if (saved) return saved;
    } catch {
      // localStorage might be disabled
    }
    return crypto.randomUUID();
  }

  private saveClientId(): void {
    try {
      localStorage.setItem('blazecraft_client_id', this.clientId);
    } catch {
      // Ignore
    }
  }

  private saveFavorites(): void {
    try {
      localStorage.setItem('blazecraft_favorite_teams', JSON.stringify(Array.from(this.favoriteTeams)));
    } catch {
      // Ignore
    }
  }

  private setStatus(status: ConnectionStatus): void {
    if (this.status === status) return;
    this.status = status;
    this.callbacks.onStatusChange?.(status);
  }
}

// ─────────────────────────────────────────────────────────────
// Factory
// ─────────────────────────────────────────────────────────────

export function createGameBridge(
  callbacks: GameBridgeCallbacks = {},
  config: GameBridgeConfig = {}
): GameBridge {
  // Load saved favorites
  try {
    const saved = localStorage.getItem('blazecraft_favorite_teams');
    if (saved) {
      const favorites = JSON.parse(saved) as string[];
      config.favoriteTeams = [...(config.favoriteTeams ?? []), ...favorites];
    }
  } catch {
    // Ignore
  }

  return new GameBridge(callbacks, config);
}

// Re-export effect mapping utilities for external use
export { mapEventToCityEffect, PLAY_EFFECT_MAP, SPORT_BUILDING_MAP, COLORS };
export type { CityEventMapping } from './GameEventContract';
