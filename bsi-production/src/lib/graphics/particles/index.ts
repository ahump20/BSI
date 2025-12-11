/**
 * BSI Graphics Engine - Particle Systems
 *
 * GPU-accelerated particle systems for creating stunning
 * visual effects in sports data visualization.
 *
 * @author Austin Humphrey
 * @version 2.0.0
 */

// =============================================================================
// SPECTACULAR PARTICLE SYSTEMS
// =============================================================================

// Data River - Flowing statistics streams
export { DataRiverSystem, createCircularRiverPath, createSpiralRiverPath, createWaveRiverPath, DataRiverPresets } from './DataRiverSystem';
export type { DataRiverConfig } from './DataRiverSystem';

// Explosion - Celebration particle bursts
export { ExplosionSystem, createFireworkSequence, ExplosionPresets } from './ExplosionSystem';
export type { ExplosionConfig } from './ExplosionSystem';

// Aurora - Northern lights ambient effect
export { AuroraSystem, AuroraPresets } from './AuroraSystem';
export type { AuroraConfig } from './AuroraSystem';

// Volumetric Dust - Stadium atmosphere particles
export { VolumetricDustSystem, VolumetricDustPresets } from './VolumetricDustSystem';
export type { VolumetricDustConfig } from './VolumetricDustSystem';

// =============================================================================
// LEGACY PARTICLE SYSTEMS (backwards compatibility)
// =============================================================================

export { EmberParticleSystem } from './EmberParticleSystem';
export type { EmberSystemConfig } from './EmberParticleSystem';

export { DataTrailSystem, createCurvedTrail, createSpiralTrail } from './DataTrailSystem';
export type { DataTrailConfig, TrailPoint } from './DataTrailSystem';

// Particle system presets for common use cases
export const ParticlePresets = {
  // Subtle background embers
  backgroundEmbers: {
    count: 100,
    emitterRadius: 100,
    emitterHeight: 50,
    particleSize: 4,
    lifespan: 6,
    riseSpeed: 8,
    drift: 3,
    turbulence: 1,
    glowIntensity: 1.0,
  },

  // Intense fire effect
  intenseFire: {
    count: 300,
    emitterRadius: 20,
    emitterHeight: 5,
    particleSize: 10,
    lifespan: 3,
    riseSpeed: 25,
    drift: 8,
    turbulence: 4,
    glowIntensity: 2.0,
  },

  // Celebration burst
  celebration: {
    count: 500,
    emitterRadius: 5,
    emitterHeight: 0,
    particleSize: 6,
    sizeVariation: 0.8,
    lifespan: 2,
    riseSpeed: 40,
    riseSpeedVariation: 0.5,
    drift: 15,
    turbulence: 3,
    glowIntensity: 2.5,
  },

  // Data accent particles
  dataAccent: {
    count: 50,
    emitterRadius: 10,
    emitterHeight: 2,
    particleSize: 3,
    lifespan: 4,
    riseSpeed: 5,
    drift: 2,
    turbulence: 0.5,
    glowIntensity: 1.2,
  },
};

export const TrailPresets = {
  // Pitch trajectory
  pitchTrajectory: {
    trailLength: 80,
    lineWidth: 4,
    fadeSpeed: 1.5,
    pulseSpeed: 2.0,
    animated: true,
  },

  // Hit trajectory (spray chart)
  hitTrajectory: {
    trailLength: 100,
    lineWidth: 3,
    fadeSpeed: 2.0,
    pulseSpeed: 1.0,
    animated: true,
  },

  // Connection line (between data points)
  dataConnection: {
    trailLength: 50,
    lineWidth: 2,
    fadeSpeed: 1.0,
    pulseSpeed: 0.5,
    animated: true,
  },

  // Stats flow
  statsFlow: {
    trailLength: 200,
    lineWidth: 2,
    fadeSpeed: 3.0,
    pulseSpeed: 1.5,
    animated: true,
  },
};
