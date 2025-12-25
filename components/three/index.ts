/**
 * BSI Visual Effects Components
 *
 * Three.js 3D effects with CSS fallback for mobile/low-end devices.
 * Performance-tier detection automatically selects the best rendering mode.
 *
 * Includes:
 * - ThreeCanvas: R3F wrapper with post-processing support
 * - HeroEmbers: Particle effect for hero sections
 * - BSIPostProcessing: Cinematic post-processing pipeline
 * - usePerformanceTier: Device capability detection
 */

// Core components
export { HeroEmbers } from './HeroEmbers';
export { ThreeCanvas } from './ThreeCanvas';

// Performance hook
export { usePerformanceTier, type PerformanceTier } from './usePerformanceTier';

// Post-processing effects
export { BSIPostProcessing } from './effects/BSIPostProcessing';
