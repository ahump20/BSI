/**
 * SportsBridge - Connects BlazeCraft to BlazeSportsIntel live scores
 *
 * Transforms real-time sports events into city gameplay:
 * - Home runs → Workshop upgrades with gold sparks
 * - Touchdowns → Barracks upgrades with red flash
 * - 3-pointers → Library upgrades with blue glow
 * - Game start → New agent spawns
 * - Game end → Agent completes task batch
 * - Lead change → Camera shake + alert
 *
 * Part of Phase 4: BSI Sports Data Integration
 */

import type { BuildingKind } from './BuildingSystem';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export type SportType = 'mlb' | 'nfl' | 'nba' | 'college-baseball' | 'college-football';

export interface SportsScore {
  gameId: string;
  sport: SportType;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  status: 'scheduled' | 'in_progress' | 'final' | 'delayed';
  inning?: string; // For baseball
  quarter?: string; // For football/basketball
  clock?: string;
  lastUpdate: number;
}

export interface SportsEvent {
  type: 'score' | 'game_start' | 'game_end' | 'lead_change' | 'big_play' | 'injury';
  sport: SportType;
  gameId: string;
  team: string;
  description: string;
  points?: number;
  timestamp: number;
  data?: {
    player?: string;
    playType?: string; // 'home_run' | 'touchdown' | 'three_pointer' | etc.
    previousLead?: string;
  };
}

export interface CityEventMapping {
  buildingKind: BuildingKind;
  flashColor: number;
  upgradePoints: number;
  effectType: 'sparkle' | 'flash' | 'shake' | 'glow';
  soundEffect?: string;
}

export interface SportsBridgeCallbacks {
  onSportsEvent?: (event: SportsEvent) => void;
  onScoreUpdate?: (scores: SportsScore[]) => void;
  onCityEffect?: (effect: CityEventMapping, event: SportsEvent) => void;
  onStatusChange?: (status: 'connected' | 'disconnected' | 'error') => void;
}

export interface SportsBridgeConfig {
  apiBaseUrl?: string;
  enabledSports?: SportType[];
  favoriteTeams?: string[];
  pollingInterval?: number;
  sseEnabled?: boolean;
}

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────

const COLORS = {
  gold: 0xFFD700,
  burntOrange: 0xBF5700,
  red: 0xE74C3C,
  blue: 0x3498DB,
  green: 0x2ECC71,
  purple: 0x9B59B6,
};

// Sports → Building mapping
const SPORT_BUILDING_MAP: Record<SportType, BuildingKind> = {
  mlb: 'townhall',
  nfl: 'workshop',
  nba: 'library',
  'college-baseball': 'stables',
  'college-football': 'barracks',
};

// Play type → City effect mapping
const PLAY_EFFECT_MAP: Record<string, CityEventMapping> = {
  home_run: {
    buildingKind: 'workshop',
    flashColor: COLORS.gold,
    upgradePoints: 3,
    effectType: 'sparkle',
    soundEffect: 'upgrade',
  },
  touchdown: {
    buildingKind: 'barracks',
    flashColor: COLORS.red,
    upgradePoints: 4,
    effectType: 'flash',
    soundEffect: 'upgrade',
  },
  three_pointer: {
    buildingKind: 'library',
    flashColor: COLORS.blue,
    upgradePoints: 2,
    effectType: 'glow',
    soundEffect: 'click',
  },
  field_goal: {
    buildingKind: 'market',
    flashColor: COLORS.green,
    upgradePoints: 1,
    effectType: 'sparkle',
  },
  strikeout: {
    buildingKind: 'townhall',
    flashColor: COLORS.burntOrange,
    upgradePoints: 1,
    effectType: 'glow',
  },
  interception: {
    buildingKind: 'barracks',
    flashColor: COLORS.red,
    upgradePoints: 2,
    effectType: 'flash',
  },
  slam_dunk: {
    buildingKind: 'library',
    flashColor: COLORS.purple,
    upgradePoints: 2,
    effectType: 'sparkle',
  },
  lead_change: {
    buildingKind: 'townhall',
    flashColor: COLORS.gold,
    upgradePoints: 0,
    effectType: 'shake',
    soundEffect: 'notify',
  },
};

// ─────────────────────────────────────────────────────────────
// SportsBridge Class
// ─────────────────────────────────────────────────────────────

export class SportsBridge {
  private eventSource: EventSource | null = null;
  private pollingInterval: ReturnType<typeof setInterval> | null = null;
  private status: 'connected' | 'disconnected' | 'error' = 'disconnected';
  private scores: Map<string, SportsScore> = new Map();
  private callbacks: SportsBridgeCallbacks;
  private config: Required<SportsBridgeConfig>;
  private favoriteTeams: Set<string>;

  constructor(callbacks: SportsBridgeCallbacks = {}, config: SportsBridgeConfig = {}) {
    this.callbacks = callbacks;
    this.config = {
      apiBaseUrl: config.apiBaseUrl ?? 'https://blazesportsintel.com/api',
      enabledSports: config.enabledSports ?? ['mlb', 'nfl', 'nba'],
      favoriteTeams: config.favoriteTeams ?? [],
      pollingInterval: config.pollingInterval ?? 30000, // 30 seconds
      sseEnabled: config.sseEnabled ?? true,
    };
    this.favoriteTeams = new Set(this.config.favoriteTeams);
  }

  // ─────────────────────────────────────────────────────────────
  // Connection Management
  // ─────────────────────────────────────────────────────────────

  /**
   * Connect to BSI sports data via SSE or polling
   */
  connect(): void {
    if (this.config.sseEnabled) {
      this.connectSSE();
    } else {
      this.startPolling();
    }
  }

  /**
   * Disconnect from sports data
   */
  disconnect(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    this.setStatus('disconnected');
  }

  /**
   * Get current scores
   */
  getScores(): SportsScore[] {
    return Array.from(this.scores.values());
  }

  /**
   * Get scores for a specific sport
   */
  getScoresBySport(sport: SportType): SportsScore[] {
    return this.getScores().filter((s) => s.sport === sport);
  }

  /**
   * Check if a team is in favorites
   */
  isFavoriteTeam(team: string): boolean {
    return this.favoriteTeams.has(team);
  }

  /**
   * Add a team to favorites
   */
  addFavoriteTeam(team: string): void {
    this.favoriteTeams.add(team);
    this.saveFavorites();
  }

  /**
   * Remove a team from favorites
   */
  removeFavoriteTeam(team: string): void {
    this.favoriteTeams.delete(team);
    this.saveFavorites();
  }

  /**
   * Get all favorite teams
   */
  getFavoriteTeams(): string[] {
    return Array.from(this.favoriteTeams);
  }

  // ─────────────────────────────────────────────────────────────
  // Event Mapping
  // ─────────────────────────────────────────────────────────────

  /**
   * Map a sports event to a city effect
   */
  mapEventToCity(event: SportsEvent): CityEventMapping | null {
    // Check for specific play types
    if (event.data?.playType) {
      const mapping = PLAY_EFFECT_MAP[event.data.playType];
      if (mapping) return mapping;
    }

    // Check for lead change
    if (event.type === 'lead_change') {
      return PLAY_EFFECT_MAP.lead_change;
    }

    // Default mapping by sport
    const building = SPORT_BUILDING_MAP[event.sport];
    if (!building) return null;

    return {
      buildingKind: building,
      flashColor: COLORS.burntOrange,
      upgradePoints: 1,
      effectType: 'glow',
    };
  }

  /**
   * Get building for a sport
   */
  getBuildingForSport(sport: SportType): BuildingKind {
    return SPORT_BUILDING_MAP[sport];
  }

  // ─────────────────────────────────────────────────────────────
  // Private Methods
  // ─────────────────────────────────────────────────────────────

  private setStatus(status: 'connected' | 'disconnected' | 'error'): void {
    this.status = status;
    this.callbacks.onStatusChange?.(status);
  }

  private connectSSE(): void {
    const sports = this.config.enabledSports.join(',');
    const url = `${this.config.apiBaseUrl}/scores/stream?sports=${sports}`;

    try {
      this.eventSource = new EventSource(url);

      this.eventSource.onopen = () => {
        this.setStatus('connected');
      };

      this.eventSource.addEventListener('score', (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data);
          this.handleScoreUpdate(data);
        } catch (err) {
          console.error('[SportsBridge] Failed to parse score:', err);
        }
      });

      this.eventSource.addEventListener('event', (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data) as SportsEvent;
          this.handleSportsEvent(data);
        } catch (err) {
          console.error('[SportsBridge] Failed to parse event:', err);
        }
      });

      this.eventSource.onerror = () => {
        this.setStatus('error');
        // Fall back to polling
        this.eventSource?.close();
        this.eventSource = null;
        this.startPolling();
      };
    } catch (err) {
      console.error('[SportsBridge] SSE connect failed:', err);
      this.startPolling();
    }
  }

  private startPolling(): void {
    if (this.pollingInterval) return;

    // Initial fetch
    this.fetchScores();

    // Poll periodically
    this.pollingInterval = setInterval(() => {
      this.fetchScores();
    }, this.config.pollingInterval);

    this.setStatus('connected');
  }

  private async fetchScores(): Promise<void> {
    try {
      for (const sport of this.config.enabledSports) {
        const response = await fetch(`${this.config.apiBaseUrl}/scores/${sport}`);
        if (!response.ok) continue;

        const data = await response.json() as { games?: Record<string, unknown>[] };
        if (data.games) {
          for (const game of data.games) {
            this.handleScoreUpdate(this.normalizeScore(game, sport));
          }
        }
      }
    } catch (err) {
      console.error('[SportsBridge] Fetch failed:', err);
    }
  }

  private normalizeScore(raw: Record<string, unknown>, sport: SportType): SportsScore {
    return {
      gameId: String(raw.id || raw.gameId || `${sport}-${Date.now()}`),
      sport,
      homeTeam: String(raw.homeTeam || raw.home_team || 'Home'),
      awayTeam: String(raw.awayTeam || raw.away_team || 'Away'),
      homeScore: Number(raw.homeScore || raw.home_score || 0),
      awayScore: Number(raw.awayScore || raw.away_score || 0),
      status: this.normalizeStatus(String(raw.status || 'scheduled')),
      inning: raw.inning ? String(raw.inning) : undefined,
      quarter: raw.quarter ? String(raw.quarter) : undefined,
      clock: raw.clock ? String(raw.clock) : undefined,
      lastUpdate: Date.now(),
    };
  }

  private normalizeStatus(status: string): SportsScore['status'] {
    const s = status.toLowerCase();
    if (s.includes('progress') || s.includes('live') || s.includes('active')) {
      return 'in_progress';
    }
    if (s.includes('final') || s.includes('complete') || s.includes('ended')) {
      return 'final';
    }
    if (s.includes('delay') || s.includes('postpone')) {
      return 'delayed';
    }
    return 'scheduled';
  }

  private handleScoreUpdate(score: SportsScore): void {
    const prevScore = this.scores.get(score.gameId);
    this.scores.set(score.gameId, score);

    // Check for lead change
    if (prevScore) {
      const prevLead = prevScore.homeScore > prevScore.awayScore ? 'home' : prevScore.awayScore > prevScore.homeScore ? 'away' : 'tie';
      const newLead = score.homeScore > score.awayScore ? 'home' : score.awayScore > score.homeScore ? 'away' : 'tie';

      if (prevLead !== newLead && newLead !== 'tie') {
        const event: SportsEvent = {
          type: 'lead_change',
          sport: score.sport,
          gameId: score.gameId,
          team: newLead === 'home' ? score.homeTeam : score.awayTeam,
          description: `${newLead === 'home' ? score.homeTeam : score.awayTeam} takes the lead!`,
          timestamp: Date.now(),
          data: { previousLead: prevLead },
        };
        this.handleSportsEvent(event);
      }

      // Check for game end
      if (prevScore.status === 'in_progress' && score.status === 'final') {
        const event: SportsEvent = {
          type: 'game_end',
          sport: score.sport,
          gameId: score.gameId,
          team: score.homeScore > score.awayScore ? score.homeTeam : score.awayTeam,
          description: `Game Over: ${score.awayTeam} ${score.awayScore} @ ${score.homeTeam} ${score.homeScore}`,
          timestamp: Date.now(),
        };
        this.handleSportsEvent(event);
      }

      // Check for game start
      if (prevScore.status === 'scheduled' && score.status === 'in_progress') {
        const event: SportsEvent = {
          type: 'game_start',
          sport: score.sport,
          gameId: score.gameId,
          team: score.homeTeam,
          description: `Game Started: ${score.awayTeam} @ ${score.homeTeam}`,
          timestamp: Date.now(),
        };
        this.handleSportsEvent(event);
      }
    }

    this.callbacks.onScoreUpdate?.(this.getScores());
  }

  private handleSportsEvent(event: SportsEvent): void {
    this.callbacks.onSportsEvent?.(event);

    // Map to city effect
    const cityEffect = this.mapEventToCity(event);
    if (cityEffect) {
      // Boost effect for favorite teams
      if (this.isFavoriteTeam(event.team)) {
        cityEffect.upgradePoints *= 2;
      }

      this.callbacks.onCityEffect?.(cityEffect, event);
    }
  }

  private saveFavorites(): void {
    try {
      localStorage.setItem('blazecraft_favorite_teams', JSON.stringify(Array.from(this.favoriteTeams)));
    } catch {
      // localStorage might be disabled
    }
  }
}

// ─────────────────────────────────────────────────────────────
// Factory
// ─────────────────────────────────────────────────────────────

export function createSportsBridge(
  callbacks: SportsBridgeCallbacks = {},
  config: SportsBridgeConfig = {}
): SportsBridge {
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

  return new SportsBridge(callbacks, config);
}
