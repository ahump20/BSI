'use client';

/**
 * BSI Motion Hooks
 *
 * Custom hooks for animation configuration and accessibility.
 */

import { useReducedMotion as useFramerReducedMotion } from 'framer-motion';
import { useMemo } from 'react';
import { duration, easing } from './variants';

/**
 * Check if user prefers reduced motion.
 * Wraps Framer Motion's hook for consistent API.
 */
export function useReducedMotion(): boolean {
  return useFramerReducedMotion() ?? false;
}

export interface AnimationConfig {
  /** Whether animations should be disabled */
  disabled: boolean;
  /** Standard duration for transitions */
  duration: number;
  /** Reveal animation duration */
  revealDuration: number;
  /** Standard easing curve */
  easing: readonly number[];
  /** Stagger delay between children */
  staggerDelay: number;
}

/**
 * Get animation configuration based on user preferences.
 * Returns disabled config if user prefers reduced motion.
 */
export function useAnimationConfig(): AnimationConfig {
  const prefersReducedMotion = useReducedMotion();

  return useMemo(
    () => ({
      disabled: prefersReducedMotion,
      duration: prefersReducedMotion ? 0 : duration.normal,
      revealDuration: prefersReducedMotion ? 0 : duration.reveal,
      easing: easing.smooth,
      staggerDelay: prefersReducedMotion ? 0 : 0.08,
    }),
    [prefersReducedMotion]
  );
}

/**
 * Get motion props that respect reduced motion preference.
 * Use this to conditionally disable animations.
 */
export function useMotionProps<T extends object>(
  animatedProps: T,
  staticProps: Partial<T> = {}
): T | Partial<T> {
  const prefersReducedMotion = useReducedMotion();
  return prefersReducedMotion ? staticProps : animatedProps;
}
