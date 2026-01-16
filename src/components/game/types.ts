/**
 * Backyard Baseball Game Type Definitions
 * All TypeScript interfaces for game UI components
 *
 * @version 1.0.0
 * @lastUpdated 2025-11-26
 */

import type { ViewStyle, TextStyle, ImageStyle as _ImageStyle } from 'react-native';

// ============================================================================
// CORE GAME TYPES
// ============================================================================

export interface Player {
  id: string;
  name: string;
  nickname?: string;
  avatarUri: string;
  position: Position;
  stats: PlayerStats;
  rarity: Rarity;
  unlocked: boolean;
  teamColor: TeamColor;
}

export interface PlayerStats {
  batting: number; // 1-100
  pitching: number; // 1-100
  fielding: number; // 1-100
  speed: number; // 1-100
  power: number; // 1-100
  accuracy: number; // 1-100
}

export type Position =
  | 'P' // Pitcher
  | 'C' // Catcher
  | '1B' // First Base
  | '2B' // Second Base
  | '3B' // Third Base
  | 'SS' // Shortstop
  | 'LF' // Left Field
  | 'CF' // Center Field
  | 'RF'; // Right Field

export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export type TeamColor = 'red' | 'blue' | 'green' | 'orange' | 'purple' | 'yellow';

// ============================================================================
// GAME STATE TYPES
// ============================================================================

export interface GameState {
  inning: number;
  isTopOfInning: boolean;
  homeScore: number;
  awayScore: number;
  outs: number;
  strikes: number;
  balls: number;
  runners: RunnerPositions;
  pitchCount: number;
  currentBatter: Player | null;
  currentPitcher: Player | null;
}

export interface RunnerPositions {
  first: Player | null;
  second: Player | null;
  third: Player | null;
}

export type PowerUpType =
  | 'super_hit'
  | 'speed_boost'
  | 'precision_pitch'
  | 'golden_glove'
  | 'clutch_time'
  | 'power_surge';

export interface PowerUp {
  id: string;
  type: PowerUpType;
  name: string;
  description: string;
  iconUri: string;
  duration?: number; // In seconds, if timed
  uses?: number; // If limited use
  active: boolean;
}

// ============================================================================
// STADIUM TYPES
// ============================================================================

export interface Stadium {
  id: string;
  name: string;
  description: string;
  previewUri: string;
  unlocked: boolean;
  unlockRequirement?: string;
  specialRules: SpecialRule[];
  timeOfDay: TimeOfDay;
  weather: Weather;
}

export interface SpecialRule {
  id: string;
  name: string;
  description: string;
  iconUri: string;
}

export type TimeOfDay = 'morning' | 'noon' | 'sunset' | 'dusk' | 'night';
export type Weather = 'sunny' | 'cloudy' | 'overcast' | 'rain' | 'snow';

// ============================================================================
// GAME RESULTS TYPES
// ============================================================================

export interface GameResult {
  outcome: 'win' | 'loss' | 'tie';
  finalScore: {
    home: number;
    away: number;
  };
  playerStats: GamePlayerStats;
  xpEarned: number;
  coinsEarned: number;
  newUnlocks?: string[];
  achievements?: Achievement[];
}

export interface GamePlayerStats {
  hits: number;
  runs: number;
  rbis: number;
  strikeouts: number;
  walks: number;
  homeRuns: number;
  stolenBases: number;
  errors: number;
  pitchingStats?: {
    strikeouts: number;
    walks: number;
    earnedRuns: number;
    innings: number;
  };
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  iconUri: string;
  rarity: Rarity;
}

// ============================================================================
// CURRENCY & SHOP TYPES
// ============================================================================

export interface Currency {
  coins: number;
  gems?: number;
}

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  iconUri: string;
  price: number;
  currencyType: 'coins' | 'gems';
  category: 'character' | 'stadium' | 'powerup' | 'cosmetic';
  unlocked: boolean;
  owned: boolean;
}

// ============================================================================
// COMPONENT PROP TYPES
// ============================================================================

// MainMenu Props
export interface MainMenuProps {
  currency: Currency;
  playerName: string;
  playerLevel: number;
  featuredCharacter?: Player;
  onPlayPress: () => void;
  onSettingsPress: () => void;
  onLeaderboardPress: () => void;
  onShopPress: () => void;
  onCharacterPress: () => void;
}

// CharacterSelect Props
export interface CharacterSelectProps {
  characters: Player[];
  selectedTeam: Player[];
  maxTeamSize: number;
  onCharacterSelect: (character: Player) => void;
  onCharacterDeselect: (character: Player) => void;
  onConfirm: () => void;
  onBack: () => void;
}

// GameHUD Props
export interface GameHUDProps {
  gameState: GameState;
  powerUps: PowerUp[];
  isPaused: boolean;
  onPausePress: () => void;
  onPowerUpUse: (powerUp: PowerUp) => void;
}

// ResultsScreen Props
export interface ResultsScreenProps {
  result: GameResult;
  onContinue: () => void;
  onRematch: () => void;
  onShare: () => void;
}

// StadiumSelect Props
export interface StadiumSelectProps {
  stadiums: Stadium[];
  selectedStadium: Stadium | null;
  onStadiumSelect: (stadium: Stadium) => void;
  onConfirm: () => void;
  onBack: () => void;
}

// ============================================================================
// STYLE PROP TYPES
// ============================================================================

export interface BaseStyleProps {
  style?: ViewStyle;
  testID?: string;
}

export interface ButtonStyleProps extends BaseStyleProps {
  textStyle?: TextStyle;
  disabled?: boolean;
  loading?: boolean;
}

export interface CardStyleProps extends BaseStyleProps {
  variant?: 'default' | 'elevated' | 'outlined';
  selected?: boolean;
  locked?: boolean;
}

export interface BadgeStyleProps extends BaseStyleProps {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md' | 'lg';
}
