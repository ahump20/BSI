/**
 * FilmGrain - Subtle cinematic overlay
 *
 * Adds film grain texture at 3.5% opacity for that premium feel.
 * Uses SVG turbulence filter for performance.
 * Respects prefers-reduced-motion.
 *
 * Toggle via window.BSIGrain.disable() or BSIGrain.toggle()
 */

import { useEffect, useState, type ReactElement } from "react";

const GRAIN_OPACITY = 0.035;

const styles = {
  container: {
    position: "fixed" as const,
    inset: 0,
    pointerEvents: "none" as const,
    zIndex: 9999,
    mixBlendMode: "overlay" as const,
  },
  svg: {
    width: "100%",
    height: "100%",
    opacity: GRAIN_OPACITY,
  },
};

interface FilmGrainProps {
  enabled?: boolean;
  opacity?: number;
  animate?: boolean;
}

export function FilmGrain({
  enabled = true,
  opacity = GRAIN_OPACITY,
  animate = true,
}: FilmGrainProps): ReactElement | null {
  const [isVisible, setIsVisible] = useState(enabled);
  const [baseFrequency, setBaseFrequency] = useState(0.65);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    if (mediaQuery.matches) {
      setIsVisible(false);
    }

    const handler = (e: MediaQueryListEvent): void => {
      setIsVisible(!e.matches && enabled);
    };

    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, [enabled]);

  useEffect(() => {
    if (!animate || !isVisible) return;

    let frameId: number;
    let lastTime = 0;

    const animateGrain = (time: number): void => {
      if (time - lastTime > 100) {
        setBaseFrequency(0.65 + Math.random() * 0.05);
        lastTime = time;
      }
      frameId = requestAnimationFrame(animateGrain);
    };

    frameId = requestAnimationFrame(animateGrain);

    return () => cancelAnimationFrame(frameId);
  }, [animate, isVisible]);

  useEffect(() => {
    const unsubscribe = BSIGrain.subscribe(setIsVisible);
    return unsubscribe;
  }, []);

  if (!isVisible) return null;

  return (
    <div style={styles.container} aria-hidden="true">
      <svg style={{ ...styles.svg, opacity }} xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="bsi-grain" x="0%" y="0%" width="100%" height="100%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency={baseFrequency}
              numOctaves={4}
              seed={Math.floor(Math.random() * 1000)}
              stitchTiles="stitch"
              result="noise"
            />
            <feColorMatrix type="saturate" values="0" in="noise" result="monoNoise" />
            <feBlend in="SourceGraphic" in2="monoNoise" mode="multiply" />
          </filter>
        </defs>
        <rect width="100%" height="100%" filter="url(#bsi-grain)" fill="transparent" />
      </svg>
    </div>
  );
}

/**
 * Global control for film grain effect.
 * Access via window.BSIGrain or import directly.
 */
export const BSIGrain = {
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
    this._listeners.forEach((fn) => fn(this._enabled));
  },
};

if (typeof window !== "undefined") {
  (window as Window & { BSIGrain?: typeof BSIGrain }).BSIGrain = BSIGrain;
}
