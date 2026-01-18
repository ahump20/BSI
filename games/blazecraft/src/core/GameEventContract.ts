/**
 * GameEventContract - Type definitions for BlazeCraft game events
 *
 * Defines the contract between BSI backend and BlazeCraft frontend.
 * All game events flow through this schema via SSE from /api/game/events.
 */

import type { BuildingKind } from './BuildingSystem';

// Re-export types shared with SportsBridge for backwards compatibility
export type SportType = 'mlb' | 'nfl' | 'nba' | 'college-baseball' | 'college-football';

// ─────────────────────────────────────────────────────────────
// Event Types
// ─────────────────────────────────────────────────────────────

export type GameEventType =
  | 'WORLD_TICK'        // Heartbeat (5s interval)
  | 'GAME_START'        // Game begins
  | 'GAME_UPDATE'       // Score change
  | 'GAME_FINAL'        // Game ends
  | 'STANDINGS_DELTA'   // Division/standings change
  | 'LINEUP_POSTED'     // Premium: lineup available
  | 'ODDS_SHIFT'        // Premium: line movement
  | 'HIGHLIGHT_CLIP'    // Premium: video ready
  | 'INJURY_ALERT';     // Injury report

export type EventSource = 'bsi' | 'agent' | 'system' | 'demo';
export type PremiumTier = 'pro' | 'elite' | null;

// ─────────────────────────────────────────────────────────────
// Payload Types
// ─────────────────────────────────────────────────────────────

export interface WorldTickPayload {
  serverTime: string;
  activeGames: number;
  connectedClients: number;
}

export interface GameStartPayload {
  gameId: string;
  sport: SportType;
  homeTeam: string;
  awayTeam: string;
  venue?: string;
  startTime: string;
}

export interface GameUpdatePayload {
  gameId: string;
  sport: SportType;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  period?: string;       // Inning, quarter, period
  clock?: string;        // Game clock if applicable
  playType?: string;     // 'home_run' | 'touchdown' | 'three_pointer' | etc.
  playDescription?: string;
  player?: string;
  previousLead?: 'home' | 'away' | 'tie';
}

export interface GameFinalPayload {
  gameId: string;
  sport: SportType;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  winner: string;
  duration?: string;
}

export interface StandingsDeltaPayload {
  sport: SportType;
  division: string;
  team: string;
  previousRank: number;
  newRank: number;
  wins: number;
  losses: number;
}

export interface LineupPostedPayload {
  gameId: string;
  sport: SportType;
  team: string;
  lineup: Array<{
    position: string;
    player: string;
    battingOrder?: number;
  }>;
}

export interface OddsShiftPayload {
  gameId: string;
  sport: SportType;
  homeTeam: string;
  awayTeam: string;
  previousLine: number;
  currentLine: number;
  movement: 'home' | 'away';
  source: string;
}

export interface HighlightClipPayload {
  gameId: string;
  sport: SportType;
  clipUrl: string;
  thumbnailUrl: string;
  description: string;
  duration: number;
}

export interface InjuryAlertPayload {
  sport: SportType;
  team: string;
  player: string;
  status: 'questionable' | 'doubtful' | 'out' | 'ir';
  description: string;
}

// ─────────────────────────────────────────────────────────────
// Payload Map
// ─────────────────────────────────────────────────────────────

export interface GameEventPayloadMap {
  WORLD_TICK: WorldTickPayload;
  GAME_START: GameStartPayload;
  GAME_UPDATE: GameUpdatePayload;
  GAME_FINAL: GameFinalPayload;
  STANDINGS_DELTA: StandingsDeltaPayload;
  LINEUP_POSTED: LineupPostedPayload;
  ODDS_SHIFT: OddsShiftPayload;
  HIGHLIGHT_CLIP: HighlightClipPayload;
  INJURY_ALERT: InjuryAlertPayload;
}

// ─────────────────────────────────────────────────────────────
// Base Event Structure
// ─────────────────────────────────────────────────────────────

export interface GameEvent<T extends GameEventType = GameEventType> {
  id: string;
  type: T;
  source: EventSource;
  timestamp: string;       // ISO 8601, America/Chicago
  seq: number;             // For ordering/dedup
  payload: GameEventPayloadMap[T];
  premiumTier: PremiumTier;
}

// Convenience type aliases
export type WorldTickEvent = GameEvent<'WORLD_TICK'>;
export type GameStartEvent = GameEvent<'GAME_START'>;
export type GameUpdateEvent = GameEvent<'GAME_UPDATE'>;
export type GameFinalEvent = GameEvent<'GAME_FINAL'>;
export type StandingsDeltaEvent = GameEvent<'STANDINGS_DELTA'>;
export type LineupPostedEvent = GameEvent<'LINEUP_POSTED'>;
export type OddsShiftEvent = GameEvent<'ODDS_SHIFT'>;
export type HighlightClipEvent = GameEvent<'HIGHLIGHT_CLIP'>;
export type InjuryAlertEvent = GameEvent<'INJURY_ALERT'>;

// Union of all concrete event types
export type AnyGameEvent =
  | WorldTickEvent
  | GameStartEvent
  | GameUpdateEvent
  | GameFinalEvent
  | StandingsDeltaEvent
  | LineupPostedEvent
  | OddsShiftEvent
  | HighlightClipEvent
  | InjuryAlertEvent;

// ─────────────────────────────────────────────────────────────
// City Effect Mapping (shared with SportsBridge)
// ─────────────────────────────────────────────────────────────

export interface CityEventMapping {
  buildingKind: BuildingKind;
  flashColor: number;
  upgradePoints: number;
  effectType: 'sparkle' | 'flash' | 'shake' | 'glow';
  soundEffect?: string;
}

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────

export const COLORS = {
  gold: 0xFFD700,
  burntOrange: 0xBF5700,
  red: 0xE74C3C,
  blue: 0x3498DB,
  green: 0x2ECC71,
  purple: 0x9B59B6,
} as const;

export const SPORT_BUILDING_MAP: Record<SportType, BuildingKind> = {
  mlb: 'townhall',
  nfl: 'workshop',
  nba: 'library',
  'college-baseball': 'stables',
  'college-football': 'barracks',
};

export const PLAY_EFFECT_MAP: Record<string, CityEventMapping> = {
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

// Premium event types
const PREMIUM_EVENT_TYPES: Set<GameEventType> = new Set([
  'LINEUP_POSTED',
  'ODDS_SHIFT',
  'HIGHLIGHT_CLIP',
]);

// ─────────────────────────────────────────────────────────────
// Type Guards
// ─────────────────────────────────────────────────────────────

const VALID_EVENT_TYPES: Set<string> = new Set([
  'WORLD_TICK',
  'GAME_START',
  'GAME_UPDATE',
  'GAME_FINAL',
  'STANDINGS_DELTA',
  'LINEUP_POSTED',
  'ODDS_SHIFT',
  'HIGHLIGHT_CLIP',
  'INJURY_ALERT',
]);

const VALID_SOURCES: Set<string> = new Set(['bsi', 'agent', 'system', 'demo']);

export function isGameEvent(value: unknown): value is AnyGameEvent {
  if (!value || typeof value !== 'object') return false;
  const obj = value as Record<string, unknown>;

  return (
    typeof obj.id === 'string' &&
    typeof obj.type === 'string' &&
    VALID_EVENT_TYPES.has(obj.type) &&
    typeof obj.source === 'string' &&
    VALID_SOURCES.has(obj.source) &&
    typeof obj.timestamp === 'string' &&
    typeof obj.seq === 'number' &&
    obj.payload !== undefined
  );
}

export function isPremiumEvent(event: AnyGameEvent): boolean {
  return PREMIUM_EVENT_TYPES.has(event.type);
}

export function isEventAllowedForTier(event: AnyGameEvent, userTier: PremiumTier): boolean {
  if (!isPremiumEvent(event)) return true;
  if (event.premiumTier === null) return true;
  if (userTier === 'elite') return true;
  if (userTier === 'pro' && event.premiumTier === 'pro') return true;
  return false;
}

export function isGameUpdateEvent(event: AnyGameEvent): event is GameUpdateEvent {
  return event.type === 'GAME_UPDATE';
}

export function isGameStartEvent(event: AnyGameEvent): event is GameStartEvent {
  return event.type === 'GAME_START';
}

export function isGameFinalEvent(event: AnyGameEvent): event is GameFinalEvent {
  return event.type === 'GAME_FINAL';
}

// ─────────────────────────────────────────────────────────────
// City Effect Helpers
// ─────────────────────────────────────────────────────────────

export function mapEventToCityEffect(event: AnyGameEvent): CityEventMapping | null {
  if (event.type !== 'GAME_UPDATE') return null;

  const payload = event.payload as GameUpdatePayload;

  // Check for specific play types
  if (payload.playType) {
    const mapping = PLAY_EFFECT_MAP[payload.playType];
    if (mapping) return mapping;
  }

  // Check for lead change
  if (payload.previousLead !== undefined) {
    const homeLeading = payload.homeScore > payload.awayScore;
    const awayLeading = payload.awayScore > payload.homeScore;
    const currentLead = homeLeading ? 'home' : awayLeading ? 'away' : 'tie';
    if (currentLead !== payload.previousLead && currentLead !== 'tie') {
      return PLAY_EFFECT_MAP.lead_change;
    }
  }

  // Default mapping by sport
  const building = SPORT_BUILDING_MAP[payload.sport];
  if (!building) return null;

  return {
    buildingKind: building,
    flashColor: COLORS.burntOrange,
    upgradePoints: 1,
    effectType: 'glow',
  };
}

// ─────────────────────────────────────────────────────────────
// Resource Reward Mapping
// ─────────────────────────────────────────────────────────────

/**
 * Resource reward for game events
 */
export interface ResourceReward {
  intel: number;
  influence: number;
  momentum: number;
}

/**
 * Base rewards per event type
 */
export const EVENT_BASE_REWARDS: Record<GameEventType, Partial<ResourceReward>> = {
  WORLD_TICK: {},
  GAME_START: { intel: 5, momentum: 10 },
  GAME_UPDATE: { intel: 2, momentum: 5 },
  GAME_FINAL: { intel: 5 },
  STANDINGS_DELTA: { intel: 15, influence: 5, momentum: 8 },
  LINEUP_POSTED: { intel: 3 },
  ODDS_SHIFT: { intel: 10, influence: 8, momentum: 15 },
  HIGHLIGHT_CLIP: { intel: 5, influence: 2 },
  INJURY_ALERT: { intel: 8 },
};

/**
 * Bonus rewards for play types
 */
export const PLAY_TYPE_REWARDS: Record<string, Partial<ResourceReward>> = {
  home_run: { intel: 5, momentum: 15 },
  touchdown: { intel: 8, momentum: 20 },
  three_pointer: { intel: 3, momentum: 8 },
  slam_dunk: { intel: 4, momentum: 12 },
  strikeout: { intel: 2, momentum: 3 },
  interception: { intel: 6, momentum: 10 },
  field_goal: { intel: 2, momentum: 5 },
  lead_change: { momentum: 25 },
};

/**
 * Calculate total resource reward for an event
 */
export function calculateEventReward(
  event: AnyGameEvent,
  isFavoriteTeam: boolean = false
): ResourceReward {
  const baseReward = EVENT_BASE_REWARDS[event.type] || {};
  let intel = baseReward.intel || 0;
  let influence = baseReward.influence || 0;
  let momentum = baseReward.momentum || 0;

  // Add play type bonus
  if (event.type === 'GAME_UPDATE') {
    const payload = event.payload as GameUpdatePayload;
    if (payload.playType) {
      const bonus = PLAY_TYPE_REWARDS[payload.playType];
      if (bonus) {
        intel += bonus.intel || 0;
        influence += bonus.influence || 0;
        momentum += bonus.momentum || 0;
      }
    }
  }

  // Favorite team multiplier (2x)
  if (isFavoriteTeam) {
    intel *= 2;
    influence *= 2;
    momentum *= 2;
  }

  return { intel, influence, momentum };
}

/**
 * Check if event generates a task opportunity
 */
export function shouldGenerateTask(event: AnyGameEvent): boolean {
  return event.type === 'GAME_START' || event.type === 'GAME_UPDATE';
}
