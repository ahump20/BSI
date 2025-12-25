/**
 * BSI Post-Processing Pipeline
 *
 * Cinematic post-processing effects for the BSI 3D engine:
 * - SMAA antialiasing
 * - Vignette (darkness at edges)
 * - Custom color grading (warm shift)
 * - Selective bloom (Ember sources)
 * - Depth of field (optional)
 * - Chromatic aberration (optional)
 * - Film grain (optional)
 *
 * Effect intensity adapts to performance tier.
 *
 * @version 1.0.0
 */

'use client';

import { useRef, useMemo } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import {
  EffectComposer,
  Bloom,
  Vignette,
  ChromaticAberration,
  DepthOfField,
  Noise,
  SMAA,
} from '@react-three/postprocessing';
import { BlendFunction, KernelSize } from 'postprocessing';
import { usePerformanceTier } from '../usePerformanceTier';

// Types
interface BSIPostProcessingProps {
  /** Enable bloom effect */
  bloom?: boolean;
  /** Bloom intensity (0-2) */
  bloomIntensity?: number;
  /** Bloom luminance threshold */
  bloomThreshold?: number;
  /** Enable vignette */
  vignette?: boolean;
  /** Vignette darkness */
  vignetteDarkness?: number;
  /** Vignette offset */
  vignetteOffset?: number;
  /** Enable depth of field */
  depthOfField?: boolean;
  /** DOF focus distance */
  focusDistance?: number;
  /** DOF focal length */
  focalLength?: number;
  /** DOF bokeh scale */
  bokehScale?: number;
  /** Enable chromatic aberration */
  chromaticAberration?: boolean;
  /** Chromatic aberration offset */
  chromaticOffset?: number;
  /** Enable film grain */
  filmGrain?: boolean;
  /** Film grain opacity */
  grainOpacity?: number;
  /** Disable all effects (override) */
  disabled?: boolean;
}

/**
 * Default effect presets based on performance tier
 */
const TIER_PRESETS = {
  low: {
    bloom: false,
    vignette: false,
    depthOfField: false,
    chromaticAberration: false,
    filmGrain: false,
    smaa: false,
  },
  medium: {
    bloom: true,
    bloomIntensity: 0.4,
    vignette: true,
    vignetteDarkness: 0.3,
    depthOfField: false,
    chromaticAberration: false,
    filmGrain: false,
    smaa: true,
  },
  high: {
    bloom: true,
    bloomIntensity: 0.8,
    vignette: true,
    vignetteDarkness: 0.4,
    depthOfField: true,
    chromaticAberration: true,
    chromaticOffset: 0.002,
    filmGrain: true,
    grainOpacity: 0.08,
    smaa: true,
  },
};

/**
 * BSI Post-Processing Component
 */
export function BSIPostProcessing({
  bloom,
  bloomIntensity,
  bloomThreshold = 0.9,
  vignette,
  vignetteDarkness,
  vignetteOffset = 0.3,
  depthOfField,
  focusDistance = 0.02,
  focalLength = 0.05,
  bokehScale = 3,
  chromaticAberration,
  chromaticOffset,
  filmGrain,
  grainOpacity,
  disabled = false,
}: BSIPostProcessingProps) {
  const { tier } = usePerformanceTier();

  // Get tier-appropriate defaults
  const preset = TIER_PRESETS[tier] || TIER_PRESETS.medium;

  // Merge props with tier defaults
  const effectConfig = useMemo(
    () => ({
      bloom: bloom ?? preset.bloom,
      bloomIntensity: bloomIntensity ?? preset.bloomIntensity ?? 0.6,
      vignette: vignette ?? preset.vignette,
      vignetteDarkness: vignetteDarkness ?? preset.vignetteDarkness ?? 0.35,
      depthOfField: depthOfField ?? preset.depthOfField,
      chromaticAberration: chromaticAberration ?? preset.chromaticAberration,
      chromaticOffset: chromaticOffset ?? preset.chromaticOffset ?? 0.002,
      filmGrain: filmGrain ?? preset.filmGrain,
      grainOpacity: grainOpacity ?? preset.grainOpacity ?? 0.08,
      smaa: preset.smaa,
    }),
    [
      tier,
      bloom,
      bloomIntensity,
      vignette,
      vignetteDarkness,
      depthOfField,
      chromaticAberration,
      chromaticOffset,
      filmGrain,
      grainOpacity,
      preset,
    ]
  );

  // Don't render effects if disabled or low tier
  if (disabled || tier === 'low') {
    return null;
  }

  return (
    <EffectComposer multisampling={0}>
      {/* SMAA Antialiasing */}
      {effectConfig.smaa && <SMAA />}

      {/* Bloom - Ember glow effect */}
      {effectConfig.bloom && (
        <Bloom
          intensity={effectConfig.bloomIntensity}
          luminanceThreshold={bloomThreshold}
          luminanceSmoothing={0.9}
          kernelSize={tier === 'high' ? KernelSize.LARGE : KernelSize.MEDIUM}
          mipmapBlur
        />
      )}

      {/* Vignette - Cinematic darkening at edges */}
      {effectConfig.vignette && (
        <Vignette
          offset={vignetteOffset}
          darkness={effectConfig.vignetteDarkness}
          blendFunction={BlendFunction.NORMAL}
        />
      )}

      {/* Depth of Field - Focus effect (HIGH tier only) */}
      {effectConfig.depthOfField && tier === 'high' && (
        <DepthOfField
          focusDistance={focusDistance}
          focalLength={focalLength}
          bokehScale={bokehScale}
        />
      )}

      {/* Chromatic Aberration - Color fringing (HIGH tier only) */}
      {effectConfig.chromaticAberration && tier === 'high' && (
        <ChromaticAberration
          offset={[effectConfig.chromaticOffset, effectConfig.chromaticOffset]}
          radialModulation
          modulationOffset={0.5}
        />
      )}

      {/* Film Grain - Subtle texture (HIGH tier only) */}
      {effectConfig.filmGrain && tier === 'high' && (
        <Noise opacity={effectConfig.grainOpacity} blendFunction={BlendFunction.OVERLAY} />
      )}
    </EffectComposer>
  );
}

export default BSIPostProcessing;
