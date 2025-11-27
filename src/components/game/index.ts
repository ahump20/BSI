/**
 * Backyard Baseball Game Components
 * Re-exports for clean imports throughout the application
 *
 * Usage:
 * import { MainMenu, CharacterSelect, GameHUD } from '@/components/game';
 * import { gameTheme, gameColors } from '@/components/game';
 *
 * @version 1.0.0
 * @lastUpdated 2025-11-26
 */

// ============================================================================
// COMPONENT EXPORTS
// ============================================================================

export { MainMenu } from './MainMenu';
export { CharacterSelect } from './CharacterSelect';
export { GameHUD } from './GameHUD';
export { ResultsScreen } from './ResultsScreen';
export { StadiumSelect } from './StadiumSelect';

// ============================================================================
// TOKEN EXPORTS
// ============================================================================

export {
  gameTheme,
  gameColors,
  gameTypography,
  gameSpacing,
  gameBorderRadius,
  gameShadows,
  gameAnimations,
  gameZIndex,
  gameBreakpoints,
  touchTargets,
  bsiColors,
} from './tokens';

export type { GameTheme, GameColors, GameTypography } from './tokens';

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type {
  // Core game types
  Player,
  PlayerStats,
  Position,
  Rarity,
  TeamColor,

  // Game state
  GameState,
  RunnerPositions,
  PowerUpType,
  PowerUp,

  // Stadium
  Stadium,
  SpecialRule,
  TimeOfDay,
  Weather,

  // Results
  GameResult,
  GamePlayerStats,
  Achievement,

  // Currency & Shop
  Currency,
  ShopItem,

  // Component props
  MainMenuProps,
  CharacterSelectProps,
  GameHUDProps,
  ResultsScreenProps,
  StadiumSelectProps,

  // Style props
  BaseStyleProps,
  ButtonStyleProps,
  CardStyleProps,
  BadgeStyleProps,
} from './types';
