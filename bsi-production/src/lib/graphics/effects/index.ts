/**
 * BSI Graphics Engine - UI Effects
 *
 * Interactive 3D effects for UI components including
 * parallax backgrounds, card animations, and loading states.
 *
 * @author Austin Humphrey
 * @version 1.0.0
 */

export { ParallaxBackground } from './ParallaxBackground';
export type { ParallaxConfig } from './ParallaxBackground';

export { Card3DFlip } from './Card3DFlip';
export type { Card3DConfig } from './Card3DFlip';

export { LoadingAnimation } from './LoadingAnimation';
export type { LoadingConfig } from './LoadingAnimation';

// Effect presets
export const EffectPresets = {
  // Hero section parallax
  heroParallax: {
    mouseParallax: true,
    parallaxStrength: 0.05,
    autoRotate: true,
    autoRotateSpeed: 0.1,
    embers: true,
    emberCount: 100,
    layers: 5,
    depth: 200,
    fogDensity: 0.003,
  },

  // Subtle background
  subtleBackground: {
    mouseParallax: true,
    parallaxStrength: 0.02,
    autoRotate: true,
    autoRotateSpeed: 0.05,
    embers: true,
    emberCount: 50,
    layers: 3,
    depth: 100,
    fogDensity: 0.005,
  },

  // Player card
  playerCard: {
    borderRadius: 12,
    tiltAmount: 15,
    flipDuration: 0.6,
    holographic: false,
    glowIntensity: 0.5,
  },

  // Holographic card
  holographicCard: {
    borderRadius: 12,
    tiltAmount: 20,
    flipDuration: 0.8,
    holographic: true,
    glowIntensity: 0.8,
  },

  // Standard loading
  standardLoading: {
    type: 'ring' as const,
    speed: 1,
    showProgress: false,
  },

  // Ember loading
  emberLoading: {
    type: 'ember' as const,
    speed: 1,
    showProgress: false,
  },
};
