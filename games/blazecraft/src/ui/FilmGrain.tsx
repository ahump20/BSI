/**
 * FilmGrain - Subtle cinematic overlay
 *
 * Adds film grain texture at 3.5% opacity for that premium feel.
 * Uses SVG turbulence filter for performance.
 * Respects prefers-reduced-motion.
 */

import React, { useEffect, useState } from 'react';

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────

const GRAIN_OPACITY = 0.035; // 3.5% per design spec
const ANIMATION_SPEED = 0.15; // Subtle movement

// ─────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────

const styles = {
  container: {
    position: 'fixed' as const,
    inset: 0,
    pointerEvents: 'none' as const,
    zIndex: 9999,
    mixBlendMode: 'overlay' as const,
  },
  svg: {
    width: '100%',
    height: '100%',
    opacity: GRAIN_OPACITY,
  },
};

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

interface FilmGrainProps {
  enabled?: boolean;
  opacity?: number;
  animate?: boolean;
}

export function FilmGrain({
  enabled = true,
  opacity = GRAIN_OPACITY,
  animate = true,
}: FilmGrainProps): React.ReactElement | null {
  const [isVisible, setIsVisible] = useState(enabled);
  const [baseFrequency, setBaseFrequency] = useState(0.65);

  // Check for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    if (mediaQuery.matches) {
      setIsVisible(false);
    }

    const handler = (e: MediaQueryListEvent) => {
      setIsVisible(!e.matches && enabled);
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [enabled]);

  // Subtle animation
  useEffect(() => {
    if (!animate || !isVisible) return;

    let frameId: number;
    let lastTime = 0;

    const animateGrain = (time: number) => {
      if (time - lastTime > 100) { // ~10fps for subtle effect
        setBaseFrequency(0.65 + Math.random() * 0.05);
        lastTime = time;
      }
      frameId = requestAnimationFrame(animateGrain);
    };

    frameId = requestAnimationFrame(animateGrain);

    return () => cancelAnimationFrame(frameId);
  }, [animate, isVisible]);

  if (!isVisible) return null;

  return (
    <div style={styles.container} aria-hidden="true">
      <svg style={{ ...styles.svg, opacity }} xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="blazecraft-grain" x="0%" y="0%" width="100%" height="100%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency={baseFrequency}
              numOctaves={4}
              seed={Math.floor(Math.random() * 1000)}
              stitchTiles="stitch"
              result="noise"
            />
            <feColorMatrix
              type="saturate"
              values="0"
              in="noise"
              result="monoNoise"
            />
            <feBlend
              in="SourceGraphic"
              in2="monoNoise"
              mode="multiply"
            />
          </filter>
        </defs>
        <rect
          width="100%"
          height="100%"
          filter="url(#blazecraft-grain)"
          fill="transparent"
        />
      </svg>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Control API (for user toggle)
// ─────────────────────────────────────────────────────────────

/**
 * Global control for film grain effect.
 * Access via window.BlazecraftGrain or import directly.
 */
export const BlazecraftGrain = {
  _enabled: true,
  _listeners: new Set<(enabled: boolean) => void>(),

  enable(): void {
    this._enabled = true;
    this._notify();
  },

  disable(): void {
    this._enabled = false;
    this._notify();
  },

  toggle(): boolean {
    this._enabled = !this._enabled;
    this._notify();
    return this._enabled;
  },

  isEnabled(): boolean {
    return this._enabled;
  },

  subscribe(listener: (enabled: boolean) => void): () => void {
    this._listeners.add(listener);
    return () => this._listeners.delete(listener);
  },

  _notify(): void {
    this._listeners.forEach(fn => fn(this._enabled));
  },
};

// Expose globally for user control
if (typeof window !== 'undefined') {
  (window as any).BlazecraftGrain = BlazecraftGrain;
}
