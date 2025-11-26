/**
 * Diamond Sluggers - Type Definitions
 */

// Player/Character types
export interface PlayerStats {
  power: number; // 1-10, affects exit velocity
  contact: number; // 1-10, affects timing window
  speed: number; // 1-10, affects base running
  fielding: number; // 1-10, affects catch range
  pitching: number; // 1-10, affects pitch accuracy
}

export interface PlayerAbility {
  name: string;
  description: string;
  cooldown: number; // Innings between uses
  isActive: boolean;
  turnsUntilReady: number;
}

export interface Player {
  id: string;
  name: string;
  emoji: string;
  age: number;
  hometown: string;
  bio: string;
  stats: PlayerStats;
  ability: PlayerAbility;
  colors: { primary: string; secondary: string };
  unlocked: boolean;
  spriteKey?: string;
}

// Game state types
export type GamePhase =
  | 'pregame'
  | 'pitching'
  | 'batting'
  | 'fielding'
  | 'baserunning'
  | 'inning_change'
  | 'game_over';
export type HalfInning = 'top' | 'bottom';
export type Base = 'first' | 'second' | 'third' | 'home';

export interface Runner {
  playerId: string;
  base: Base;
  isAdvancing: boolean;
}

export interface Count {
  balls: number;
  strikes: number;
  outs: number;
}

export interface Inning {
  number: number;
  half: HalfInning;
}

export interface Score {
  home: number;
  away: number;
  homeHits: number;
  awayHits: number;
  homeErrors: number;
  awayErrors: number;
}

export interface GameState {
  phase: GamePhase;
  inning: Inning;
  count: Count;
  score: Score;
  runners: Runner[];
  currentBatter: Player | null;
  currentPitcher: Player | null;
  battingOrder: Player[];
  battingOrderIndex: number;
  isUserBatting: boolean;
  stadium: Stadium | null;
}

// Pitch types
export type PitchType = 'fastball' | 'curveball' | 'changeup' | 'slider' | 'knuckleball';

export interface Pitch {
  type: PitchType;
  speed: number;
  movement: { x: number; y: number };
  location: { x: number; y: number };
  isStrike: boolean;
}

// Hit types
export type HitResult =
  | 'strike'
  | 'ball'
  | 'foul'
  | 'out'
  | 'single'
  | 'double'
  | 'triple'
  | 'home_run'
  | 'walk'
  | 'strikeout';

export interface BatSwing {
  timing: number; // -1 (early) to 1 (late), 0 is perfect
  contact: number; // 0-1, quality of contact
  angle: number; // Launch angle in degrees
  exitVelocity: number; // mph
}

export interface HitOutcome {
  result: HitResult;
  distance: number;
  landingPosition: { x: number; y: number };
  isHomeRun: boolean;
  rbiCount: number;
}

// Stadium types
export interface StadiumFeature {
  type: 'tree' | 'obstacle' | 'bonus' | 'hazard' | 'structure' | 'weather' | 'feature';
  name: string;
  position: { x: number; y: number };
  effect: string;
  hitbox?: { width: number; height: number };
}

export interface StadiumEnvironment {
  background: string;
  grass: string;
  dirt: string;
  fence: string;
}

export interface StadiumDimensions {
  leftField: number;
  centerField: number;
  rightField: number;
}

export interface StadiumWeather {
  wind: { x: number; y: number };
  temperature: number;
  condition: string;
}

export interface Stadium {
  id: string;
  name: string;
  location: string;
  description: string;
  theme: string;
  environment: StadiumEnvironment;
  dimensions: StadiumDimensions;
  features: StadiumFeature[];
  weather: StadiumWeather;
  unlocked: boolean;
  imageKey?: string;
}

// Power-up types
export type PowerUpCategory = 'batting' | 'pitching' | 'fielding' | 'baserunning';

export interface PowerUp {
  id: string;
  name: string;
  emoji: string;
  description: string;
  category: PowerUpCategory;
  duration: number;
  uses: number;
  isActive: boolean;
  effect: (gameState: GameState) => GameState;
}

// Match result types
export interface MatchStats {
  hits: number;
  homeRuns: number;
  strikeouts: number;
  walks: number;
  innings: number;
  pitchesThrown: number;
  pitchesSeen: number;
}

export interface MatchResult {
  matchId: string;
  result: 'win' | 'loss' | 'tie';
  userScore: number;
  opponentScore: number;
  stats: MatchStats;
  xpEarned: number;
  coinsEarned: number;
  newUnlocks: {
    characters: Player[];
    stadiums: Stadium[];
  };
}

// UI types
export interface ButtonConfig {
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  style?: Phaser.Types.GameObjects.Text.TextStyle;
  onClick: () => void;
}

export interface HUDState {
  score: Score;
  count: Count;
  inning: Inning;
  runners: Runner[];
  powerUps: PowerUp[];
}

// API response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

export interface SaveGameData {
  userId: string;
  username: string;
  progress: {
    unlocked_characters: string[];
    unlocked_stadiums: string[];
    coins: number;
    total_games: number;
    total_wins: number;
    season_progress: {
      current_season: number;
      games_played: number;
      wins: number;
      losses: number;
      championship_wins: number;
    };
  };
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  score: number;
  category: string;
}
