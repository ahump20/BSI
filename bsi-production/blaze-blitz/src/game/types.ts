/**
 * Blaze Blitz Type Definitions
 * Core game types for the arcade football microgame
 */

export type Team = 'home' | 'away';
export type GamePhase = 'loading' | 'menu' | 'playSelect' | 'presnap' | 'playing' | 'tackle' | 'touchdown' | 'turnover' | 'halftime' | 'gameover';
export type PlayerRole = 'qb' | 'wr' | 'rb' | 'ol' | 'dl' | 'lb' | 'db';

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface PlayerState {
  id: string;
  team: Team;
  role: PlayerRole;
  position: Vec3;
  velocity: Vec3;
  rotation: number;
  hasBall: boolean;
  isControlled: boolean;
  onFire: boolean;
  stamina: number;
  consecutiveSuccesses: number;
}

export interface BallState {
  position: Vec3;
  velocity: Vec3;
  isThrown: boolean;
  isSnapped: boolean;
  carrier: string | null;
  target: string | null;
}

export interface GameState {
  phase: GamePhase;
  homeScore: number;
  awayScore: number;
  down: number;
  yardsToGo: number;
  lineOfScrimmage: number;
  possession: Team;
  quarter: number;
  timeRemaining: number;
  players: Map<string, PlayerState>;
  ball: BallState;
}

export interface Play {
  id: string;
  name: string;
  icon: string;
  type: 'pass' | 'run';
  routes: Map<PlayerRole, Route>;
}

export interface Route {
  waypoints: Vec3[];
  timing: number;
}

export interface InputState {
  moveX: number;
  moveZ: number;
  turbo: boolean;
  action: boolean;
  actionJustPressed: boolean;
}

export interface PhysicsConfig {
  gravity: number;
  playerRadius: number;
  tackleRadius: number;
  catchRadius: number;
  maxSpeed: number;
  turboMultiplier: number;
  accelerationTime: number;
  launchForce: number;
}

export const PHYSICS_CONFIG: PhysicsConfig = {
  gravity: -20,
  playerRadius: 0.5,
  tackleRadius: 1.5,
  catchRadius: 2.0,
  maxSpeed: 12,
  turboMultiplier: 1.5,
  accelerationTime: 0.2,
  launchForce: 15
};

export const FIELD_CONFIG = {
  length: 60, // 60-yard field (half gridiron per spec)
  width: 26.67, // Standard width scaled
  yardLineInterval: 10,
  firstDownDistance: 30, // Blitz-style 30-yard first downs
  endZoneDepth: 10
};
