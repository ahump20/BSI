/**
 * BSI Graphics Engine - Sports Visualizations
 *
 * 3D visualizations for sports data analytics including
 * baseball diamonds, pitch tunnels, stat comparisons,
 * strike zones, stat pylons, and heatmap terrains.
 *
 * @author Austin Humphrey
 * @version 2.0.0
 */

// =============================================================================
// SPECTACULAR 3D VISUALIZATIONS
// =============================================================================

// Strike Zone 3D - K-Zone style pitch tracking
export { StrikeZone3D, StrikeZone3DPresets } from './StrikeZone3D';
export type { StrikeZone3DConfig, PitchData3D, PitchType } from './StrikeZone3D';

// Stat Pylon 3D - Animated 3D stat bars
export { StatPylon3D, StatPylon3DPresets } from './StatPylon3D';
export type { StatPylon3DConfig, StatPylonData } from './StatPylon3D';

// Heatmap Terrain 3D - Terrain deformation visualization
export { HeatmapTerrain3D, HeatmapTerrain3DPresets } from './HeatmapTerrain3D';
export type { HeatmapTerrain3DConfig, HeatmapDataPoint } from './HeatmapTerrain3D';

// =============================================================================
// LEGACY VISUALIZATIONS (backwards compatibility)
// =============================================================================

export { BaseballDiamond } from './BaseballDiamond';
export type { HitData, DiamondConfig } from './BaseballDiamond';

export { PitchTunnel } from './PitchTunnel';
export type { PitchData, PitchTunnelConfig } from './PitchTunnel';

export { StatComparison3D } from './StatComparison3D';
export type { StatData, PlayerStats, StatComparison3DConfig } from './StatComparison3D';

// Visualization presets
export const VisualizationPresets = {
  // Spray chart for batters
  sprayChart: {
    scale: 0.5,
    showOutfield: true,
    showInfield: true,
    showBases: true,
    showWalls: true,
    interactive: true,
    glowIntensity: 1.2,
  },

  // Pitch tunnel for pitchers
  pitchTunnel: {
    scale: 2,
    showStrikeZone: true,
    showTunnelPoint: true,
    tunnelPointDistance: 20,
    showGrid: true,
    animated: true,
  },

  // Player comparison bar chart
  playerComparison: {
    type: 'bar' as const,
    animated: true,
    animationDuration: 1.5,
    showLabels: true,
    showValues: true,
    holographic: false,
    glowIntensity: 1.0,
  },

  // Radar chart for multi-stat comparison
  radarChart: {
    type: 'radial' as const,
    animated: true,
    showLabels: true,
    radialRadius: 30,
    radialInnerRadius: 8,
  },

  // 3D floating data cloud
  dataCloud: {
    type: 'floating' as const,
    animated: true,
    holographic: true,
    glowIntensity: 1.5,
  },
};

// Common stat configurations for baseball
export const BaseballStatPresets = {
  batting: [
    { name: 'AVG', max: 0.400 },
    { name: 'OBP', max: 0.500 },
    { name: 'SLG', max: 0.800 },
    { name: 'wRC+', max: 200 },
    { name: 'WAR', max: 10 },
    { name: 'HR', max: 60 },
    { name: 'RBI', max: 150 },
    { name: 'SB', max: 60 },
  ],

  pitching: [
    { name: 'ERA', max: 5.0, inverted: true },
    { name: 'WHIP', max: 1.5, inverted: true },
    { name: 'K/9', max: 15 },
    { name: 'BB/9', max: 5.0, inverted: true },
    { name: 'FIP', max: 5.0, inverted: true },
    { name: 'WAR', max: 8 },
    { name: 'K%', max: 40 },
    { name: 'GB%', max: 60 },
  ],

  pitch: [
    { name: 'Velocity', max: 105 },
    { name: 'Spin Rate', max: 3000 },
    { name: 'H-Break', max: 20 },
    { name: 'V-Break', max: 20 },
    { name: 'Extension', max: 8 },
    { name: 'xwOBA', max: 0.500, inverted: true },
  ],
};
