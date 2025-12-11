/**
 * BSI Graphics Engine
 *
 * World-class 3D graphics engine for Blaze Sports Intel.
 * Built on Three.js with custom shaders, particle systems,
 * and sports-specific visualizations.
 *
 * Features:
 * - GPU-accelerated rendering with WebGL/WebGPU
 * - Custom GLSL shaders (holographic, molten metal, neon glow, glass, fire)
 * - Post-processing pipeline (bloom, chromatic aberration, DOF, film grain)
 * - Advanced particle systems (data rivers, explosions, aurora, dust)
 * - Sports visualizations (strike zone, stat pylons, heatmap terrain)
 * - React integration (BlazeCanvas, useBlaze3D, BlazeBackground)
 * - Automatic performance scaling for all devices
 *
 * @author Austin Humphrey
 * @version 4.0.0
 */

// =============================================================================
// MASTER ENGINE
// =============================================================================

// New BlazeGraphicsEngine - WebGPU-first with WebGL fallback
export { BlazeGraphicsEngine, BLAZE_COLORS } from './engine/BlazeGraphicsEngine';
export type {
  BlazeGraphicsEngineConfig,
  BlazeGraphicsEnginePerformanceTier,
  LODLevel,
  PerformanceProfile,
} from './engine/BlazeGraphicsEngine';

// Legacy BlazeEngine (backwards compatibility)
export { BlazeEngine, PerformanceTier } from './engine/BlazeEngine';
export type { BlazeEngineConfig, PerformanceMetrics } from './engine/BlazeEngine';

// =============================================================================
// SHADERS
// =============================================================================
export * from './shaders';

// =============================================================================
// PARTICLE SYSTEMS
// =============================================================================
export * from './particles';

// =============================================================================
// SPORTS VISUALIZATIONS
// =============================================================================
export * from './visualizations';

// =============================================================================
// POST-PROCESSING
// =============================================================================
export * from './postprocessing';

// =============================================================================
// REACT INTEGRATION
// =============================================================================
export * from './react';

// =============================================================================
// UI EFFECTS
// =============================================================================
export * from './effects';

// =============================================================================
// THREE.JS RE-EXPORT
// =============================================================================
export * as THREE from 'three';

/**
 * Quick start function to create a complete visualization scene
 */
export function createBlazeScene(container: HTMLElement, options?: {
  type?: 'hero' | 'analytics' | 'loading';
  embers?: boolean;
  postProcessing?: boolean;
}): {
  engine: import('./engine/BlazeEngine').BlazeEngine;
  dispose: () => void;
} {
  const { BlazeEngine } = require('./engine/BlazeEngine');
  const { EmberParticleSystem, ParticlePresets } = require('./particles');
  const { threeColors } = require('../styles/tokens/colors');

  const defaults = {
    type: 'hero',
    embers: true,
    postProcessing: true,
  };

  const config = { ...defaults, ...options };

  const engine = new BlazeEngine({
    container,
    postProcessing: config.postProcessing,
    shadows: config.type !== 'loading',
    onInit: () => {
      // Add default lighting
      engine.addDefaultLighting();
    },
  });

  // Add embers if enabled
  let embers: typeof EmberParticleSystem | null = null;
  if (config.embers) {
    embers = new EmberParticleSystem(ParticlePresets.backgroundEmbers);
    engine.scene.add(embers);

    engine.onUpdate((delta) => {
      embers?.update(delta);
    });
  }

  // Configure based on type
  switch (config.type) {
    case 'hero':
      engine.setBloom(0.5, 0.4, 0.85);
      engine.setChromaticAberration(0.0015);
      engine.setFilmGrain(0.08);
      break;
    case 'analytics':
      engine.setBloom(0.3, 0.3, 0.9);
      engine.setFilmGrain(0.05);
      break;
    case 'loading':
      engine.setBloom(0.8, 0.5, 0.8);
      break;
  }

  engine.start();

  return {
    engine,
    dispose: () => {
      embers?.dispose();
      engine.dispose();
    },
  };
}

// Version
export const VERSION = '3.0.0';
