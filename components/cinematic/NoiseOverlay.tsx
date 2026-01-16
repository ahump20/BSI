'use client';

import { useEffect, useState } from 'react';

export interface NoiseOverlayProps {
  /** Opacity level (0-1) */
  opacity?: number;
  /** Use CSS-only fallback (no image needed) */
  cssOnly?: boolean;
  /** Disable on mobile for performance */
  disableOnMobile?: boolean;
}

/**
 * NoiseOverlay component
 *
 * Adds a subtle film grain texture over the entire viewport.
 * Fixed position, non-interactive, respects prefers-reduced-motion.
 */
export function NoiseOverlay({
  opacity = 0.025,
  cssOnly = false,
  disableOnMobile = false,
}: NoiseOverlayProps) {
  const [mounted, setMounted] = useState(false);
  const [shouldRender, setShouldRender] = useState(true);

  useEffect(() => {
    setMounted(true);

    // Check reduced motion preference
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (motionQuery.matches) {
      setShouldRender(false);
      return;
    }

    // Check mobile if disabled
    if (disableOnMobile) {
      const isMobile = window.matchMedia('(max-width: 768px)').matches;
      if (isMobile) {
        setShouldRender(false);
        return;
      }
    }
  }, [disableOnMobile]);

  // Don't render on server or if disabled
  if (!mounted || !shouldRender) return null;

  // CSS-only fallback using SVG filter
  if (cssOnly) {
    return (
      <div
        aria-hidden="true"
        className="fixed inset-0 pointer-events-none z-[9998]"
        style={{
          opacity,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />
    );
  }

  // Image-based noise (better quality, requires noise.png)
  return <div aria-hidden="true" className="noise-overlay" style={{ opacity }} />;
}

export default NoiseOverlay;
