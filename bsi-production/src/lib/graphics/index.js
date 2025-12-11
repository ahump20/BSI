/**
 * BSI 3D Graphics Library
 *
 * Main entry point for the BSI 3D graphics engine.
 * Provides easy access to all 3D visualization components.
 *
 * @author Austin Humphrey
 * @version 1.0.0
 */

// Core Engine
export { BSI3DEngine } from './engine/BSI3DEngine.js';

// Particle Systems
export { EmberParticleSystem } from './particles/EmberParticleSystem.js';

// Visualizations
export { DataVisualization3D } from './visualizations/DataVisualization3D.js';

// Effects
export { HeroBackground3D } from './effects/HeroBackground3D.js';

// Shaders
export {
  createEmberFireMaterial,
  emberFireVertex,
  emberFireFragment,
} from './shaders/emberFire.js';

export {
  createHeatDistortionMaterial,
  heatDistortionVertex,
  heatDistortionFragment,
} from './shaders/heatDistortion.js';

// Re-export Three.js for convenience
export * as THREE from 'three';
