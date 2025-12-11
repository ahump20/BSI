/**
 * 3D Components Barrel Export
 *
 * Production-ready 3D visualization components for Blaze Sports Intel.
 * Built with React Three Fiber and Drei for jaw-dropping sports analytics.
 *
 * @module components/3d
 * @requires @react-three/fiber
 * @requires @react-three/drei
 * @requires three
 */

// ============================================================================
// Component Exports
// ============================================================================

/**
 * Live3DScoreboard - Real-time 3D scoreboard with floating glass panels,
 * holographic team logos, animated score transitions, and particle bursts.
 */
export {
  Live3DScoreboard,
  default as Live3DScoreboardDefault,
} from './Live3DScoreboard';
export type {
  Live3DScoreboardProps,
  TeamData,
  GameState,
} from './Live3DScoreboard';

/**
 * PitchVisualization3D - Real-time 3D pitch tracking with holographic K-zone,
 * pitch trails with ember glow, spin rate visualization, and exit velocity effects.
 */
export {
  PitchVisualization3D,
  default as PitchVisualization3DDefault,
} from './PitchVisualization3D';
export type {
  PitchVisualization3DProps,
  PitchData,
  PitchType,
  PitchResult,
  StrikeZone,
} from './PitchVisualization3D';

/**
 * PlayerCard3D - Rotating 3D player stat card with glass morphism,
 * illuminating stats, player silhouette, particle aura, and flip animation.
 */
export {
  PlayerCard3D,
  default as PlayerCard3DDefault,
} from './PlayerCard3D';
export type {
  PlayerCard3DProps,
  PlayerData,
  PlayerPosition,
  PlayerBasicStats,
  PlayerAdvancedStats,
} from './PlayerCard3D';

/**
 * StadiumOverview3D - Bird's eye 3D stadium view with low-poly model,
 * player positions, heat map overlay, camera controls, and day/night cycle.
 */
export {
  StadiumOverview3D,
  default as StadiumOverview3DDefault,
} from './StadiumOverview3D';
export type {
  StadiumOverview3DProps,
  FieldPosition,
  HeatMapPoint,
  HeatMapConfig,
  StadiumConfig,
  TimeOfDay,
  CameraView,
} from './StadiumOverview3D';

/**
 * StandingsChart3D - 3D bar chart for team standings with rising pillars,
 * team colors, animated growth, comparison mode, and hover details.
 */
export {
  StandingsChart3D,
  default as StandingsChart3DDefault,
} from './StandingsChart3D';
export type {
  StandingsChart3DProps,
  TeamStanding,
  SeasonComparison,
  SortBy,
  ChartMode,
} from './StandingsChart3D';

/**
 * DataOrb3D - Spherical data visualization with stats plotted on sphere,
 * rotation controls, connection lines, pulsing outliers, and view modes.
 */
export {
  DataOrb3D,
  default as DataOrb3DDefault,
} from './DataOrb3D';
export type {
  DataOrb3DProps,
  DataPoint,
  CategoryConfig,
  ViewMode,
} from './DataOrb3D';

/**
 * HeroBackground3D - Site hero section with procedural ember particles,
 * volumetric light rays, scroll/mouse parallax, and mobile optimization.
 */
export {
  HeroBackground3D,
  default as HeroBackground3DDefault,
} from './HeroBackground3D';
export type {
  HeroBackground3DProps,
  QualityLevel,
} from './HeroBackground3D';

// ============================================================================
// BSI Brand Colors (Shared)
// ============================================================================

/**
 * BSI brand color palette for consistent theming across 3D components.
 */
export const BSI_COLORS = {
  /** Burnt Orange - Primary brand color, UT Official */
  burntOrange: '#BF5700',
  /** Texas Soil - Earthy accent, heritage */
  texasSoil: '#8B4513',
  /** Ember - Interactive accent, energy */
  ember: '#FF6B35',
  /** Gold - Highlights, achievements */
  gold: '#C9A227',
  /** Charcoal - Premium dark surfaces */
  charcoal: '#1A1A1A',
  /** Midnight - True dark backgrounds */
  midnight: '#0D0D0D',
  /** Cream - Warm text, highlights */
  cream: '#FAF8F5',
} as const;

export type BSIColorKey = keyof typeof BSI_COLORS;
export type BSIColorValue = (typeof BSI_COLORS)[BSIColorKey];

// ============================================================================
// Default Export
// ============================================================================

/**
 * Default export containing all 3D components.
 *
 * @example
 * ```tsx
 * import Components3D from '@/components/3d';
 *
 * <Components3D.Live3DScoreboard {...props} />
 * <Components3D.PitchVisualization3D {...props} />
 * ```
 */
const Components3D = {
  Live3DScoreboard: () => import('./Live3DScoreboard').then((m) => m.default),
  PitchVisualization3D: () => import('./PitchVisualization3D').then((m) => m.default),
  PlayerCard3D: () => import('./PlayerCard3D').then((m) => m.default),
  StadiumOverview3D: () => import('./StadiumOverview3D').then((m) => m.default),
  StandingsChart3D: () => import('./StandingsChart3D').then((m) => m.default),
  DataOrb3D: () => import('./DataOrb3D').then((m) => m.default),
  HeroBackground3D: () => import('./HeroBackground3D').then((m) => m.default),
  BSI_COLORS,
};

export default Components3D;
