'use client';

/**
 * BSI Gradient Mesh Backgrounds
 *
 * Atmospheric gradient backgrounds for section treatments.
 * Stadium Lights, Texas Sunset, Midnight Intel variants.
 */

import { cn } from '@/lib/utils';

export type GradientPreset = 'stadium-lights' | 'texas-sunset' | 'midnight-intel' | 'ember-glow';

export interface GradientMeshProps {
  /** Preset gradient style */
  preset?: GradientPreset;
  /** Additional class names */
  className?: string;
  /** Animate the gradient */
  animate?: boolean;
  /** Render as absolute positioned background */
  absolute?: boolean;
}

const presetStyles: Record<GradientPreset, string> = {
  // Stadium lights: Top-down with burnt-orange hotspots
  'stadium-lights': `
    radial-gradient(ellipse 80% 50% at 50% 0%, rgba(191, 87, 0, 0.15) 0%, transparent 60%),
    radial-gradient(ellipse 40% 30% at 20% 10%, rgba(255, 107, 53, 0.1) 0%, transparent 50%),
    radial-gradient(ellipse 40% 30% at 80% 10%, rgba(255, 107, 53, 0.1) 0%, transparent 50%),
    linear-gradient(180deg, #0d0d12 0%, #0d0d12 100%)
  `,
  // Texas sunset: Horizontal soil-to-orange transition
  'texas-sunset': `
    linear-gradient(135deg, rgba(139, 69, 19, 0.2) 0%, transparent 40%),
    linear-gradient(225deg, rgba(191, 87, 0, 0.15) 0%, transparent 50%),
    radial-gradient(ellipse 100% 80% at 100% 100%, rgba(255, 107, 53, 0.1) 0%, transparent 60%),
    linear-gradient(180deg, #0d0d12 0%, #161620 100%)
  `,
  // Midnight intel: Deep blue-black with ember accents
  'midnight-intel': `
    radial-gradient(ellipse 60% 40% at 50% 80%, rgba(191, 87, 0, 0.08) 0%, transparent 60%),
    radial-gradient(ellipse 80% 60% at 30% 50%, rgba(30, 64, 175, 0.05) 0%, transparent 50%),
    radial-gradient(ellipse 80% 60% at 70% 50%, rgba(30, 64, 175, 0.05) 0%, transparent 50%),
    linear-gradient(180deg, #0d0d12 0%, #0a0a10 100%)
  `,
  // Ember glow: Central orange hotspot
  'ember-glow': `
    radial-gradient(ellipse 50% 50% at 50% 50%, rgba(191, 87, 0, 0.12) 0%, transparent 70%),
    radial-gradient(ellipse 80% 40% at 50% 100%, rgba(255, 107, 53, 0.08) 0%, transparent 60%),
    linear-gradient(180deg, #0d0d12 0%, #0d0d12 100%)
  `,
};

export function GradientMesh({
  preset = 'stadium-lights',
  className,
  animate = false,
  absolute = true,
}: GradientMeshProps): JSX.Element {
  return (
    <div
      className={cn(
        absolute && 'absolute inset-0 -z-10 pointer-events-none',
        animate && 'animate-gradient-shift',
        className
      )}
      style={{ background: presetStyles[preset] }}
      aria-hidden="true"
    />
  );
}

export default GradientMesh;
