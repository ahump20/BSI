'use client';

import { useEffect, useState } from 'react';

interface NoiseOverlayProps {
  /** Opacity of the noise overlay (0-1) */
  opacity?: number;
  /** Whether to animate the noise (grain effect) */
  animated?: boolean;
  /** Disable on mobile for performance */
  disableOnMobile?: boolean;
  /** Z-index for layering */
  zIndex?: number;
}

/**
 * NoiseOverlay - SVG-based noise texture (no external PNG required)
 * 
 * Uses an inline SVG filter to generate noise, which is more reliable
 * than depending on an external PNG file.
 */
export function NoiseOverlay({
  opacity = 0.025,
  animated = true,
  disableOnMobile = false,
  zIndex = 9999,
}: NoiseOverlayProps) {
  const [shouldRender, setShouldRender] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    // Check for reduced motion preference
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(motionQuery.matches);

    const handleMotionChange = (e: MediaQueryListEvent) => {
      setReducedMotion(e.matches);
    };
    motionQuery.addEventListener('change', handleMotionChange);

    // Check for mobile if disabled
    if (disableOnMobile) {
      const isMobile = window.innerWidth < 768;
      setShouldRender(!isMobile);

      const handleResize = () => {
        setShouldRender(window.innerWidth >= 768);
      };
      window.addEventListener('resize', handleResize, { passive: true });
      return () => {
        window.removeEventListener('resize', handleResize);
        motionQuery.removeEventListener('change', handleMotionChange);
      };
    }

    return () => {
      motionQuery.removeEventListener('change', handleMotionChange);
    };
  }, [disableOnMobile]);

  if (!shouldRender) return null;

  const showAnimation = animated && !reducedMotion;

  return (
    <>
      {/* SVG filter definition */}
      <svg className="absolute w-0 h-0" aria-hidden="true">
        <defs>
          <filter id="noise-filter">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.8"
              numOctaves="4"
              stitchTiles="stitch"
              result="noise"
            />
            <feColorMatrix
              type="saturate"
              values="0"
              in="noise"
              result="mono"
            />
          </filter>
        </defs>
      </svg>

      {/* Noise overlay */}
      <div
        className="pointer-events-none fixed inset-0"
        style={{ zIndex }}
        aria-hidden="true"
      >
        <div
          className={`absolute inset-0 ${showAnimation ? 'animate-grain' : ''}`}
          style={{
            opacity,
            filter: 'url(#noise-filter)',
            transform: 'scale(1.5)', // Prevent edge artifacts
          }}
        />
      </div>

      {/* Animation keyframes */}
      {showAnimation && (
        <style jsx global>{`
          @keyframes grain {
            0%, 100% { transform: translate(0, 0) scale(1.5); }
            10% { transform: translate(-1%, -1%) scale(1.5); }
            20% { transform: translate(1%, 1%) scale(1.5); }
            30% { transform: translate(-1%, 1%) scale(1.5); }
            40% { transform: translate(1%, -1%) scale(1.5); }
            50% { transform: translate(-1%, 0%) scale(1.5); }
            60% { transform: translate(1%, 0%) scale(1.5); }
            70% { transform: translate(0%, 1%) scale(1.5); }
            80% { transform: translate(0%, -1%) scale(1.5); }
            90% { transform: translate(1%, 1%) scale(1.5); }
          }
          .animate-grain {
            animation: grain 8s steps(10) infinite;
          }
        `}</style>
      )}
    </>
  );
}

export default NoiseOverlay;
