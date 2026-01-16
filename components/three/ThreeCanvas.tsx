'use client';

/**
 * BSI ThreeCanvas Wrapper
 *
 * Performance-aware Three.js canvas that:
 * - Detects device capabilities
 * - Provides CSS fallback for low-end devices
 * - Respects prefers-reduced-motion
 * - Lazy loads Three.js bundle
 */

import { Suspense, useRef, useEffect, useState, ReactNode } from 'react';
import { Canvas, type CanvasProps } from '@react-three/fiber';
import { usePerformanceTier } from './usePerformanceTier';

interface ThreeCanvasProps extends Partial<CanvasProps> {
  children: ReactNode;
  fallback?: ReactNode;
  className?: string;
}

export function ThreeCanvas({
  children,
  fallback,
  className = '',
  ...canvasProps
}: ThreeCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const { tier, pixelRatio } = usePerformanceTier();

  // Intersection observer for lazy loading
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '100px' }
    );

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Low tier: render CSS fallback only
  if (tier === 'low') {
    return (
      <div ref={containerRef} className={className}>
        {fallback}
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`${className} relative`}>
      {/* CSS fallback shows until Three.js loads */}
      {!isVisible && fallback}

      {isVisible && (
        <Suspense fallback={fallback}>
          <Canvas
            dpr={pixelRatio}
            gl={{
              antialias: tier === 'high',
              alpha: true,
              powerPreference: tier === 'high' ? 'high-performance' : 'default',
            }}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none',
            }}
            {...canvasProps}
          >
            {children}
          </Canvas>
        </Suspense>
      )}
    </div>
  );
}
