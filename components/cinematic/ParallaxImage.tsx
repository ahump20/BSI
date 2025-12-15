'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Image, { ImageProps } from 'next/image';
import { cn } from '@/lib/utils';

export interface ParallaxImageProps extends Omit<ImageProps, 'onMouseMove'> {
  /** Enable parallax effect on scroll */
  parallax?: boolean;
  /** Parallax intensity (0-1) */
  parallaxIntensity?: number;
  /** Enable hover lift effect */
  hoverLift?: boolean;
  /** Enable tilt effect on hover */
  tilt?: boolean;
  /** Tilt intensity in degrees */
  tiltIntensity?: number;
  /** Container class names */
  containerClassName?: string;
  /** Overlay gradient */
  overlay?: 'none' | 'bottom' | 'full' | 'vignette';
}

const overlayClasses = {
  none: '',
  bottom:
    'after:absolute after:inset-0 after:bg-gradient-to-t after:from-midnight after:via-transparent after:to-transparent',
  full: 'after:absolute after:inset-0 after:bg-midnight/40',
  vignette:
    'after:absolute after:inset-0 after:bg-[radial-gradient(ellipse_at_center,_transparent_0%,_rgba(0,0,0,0.4)_100%)]',
};

/**
 * ParallaxImage component
 *
 * Enhanced image with hover lift, parallax scroll, and tilt effects.
 * Uses next/image for optimization.
 * Respects prefers-reduced-motion.
 */
export function ParallaxImage({
  parallax = false,
  parallaxIntensity = 0.1,
  hoverLift = true,
  tilt = false,
  tiltIntensity = 10,
  containerClassName,
  overlay = 'none',
  className,
  alt,
  ...imageProps
}: ParallaxImageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const rafId = useRef<number | null>(null);

  // Check reduced motion preference
  useEffect(() => {
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(motionQuery.matches);

    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    motionQuery.addEventListener('change', handler);
    return () => motionQuery.removeEventListener('change', handler);
  }, []);

  // Parallax scroll effect
  useEffect(() => {
    if (!parallax || prefersReducedMotion || !containerRef.current) return;

    const handleScroll = () => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;

      // Calculate how far through viewport the element has scrolled
      const progress = (viewportHeight - rect.top) / (viewportHeight + rect.height);
      const clampedProgress = Math.max(0, Math.min(1, progress));

      // Calculate parallax offset
      const offset = (clampedProgress - 0.5) * rect.height * parallaxIntensity;

      setTransform((prev) => ({ ...prev, y: offset }));
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial calculation

    return () => window.removeEventListener('scroll', handleScroll);
  }, [parallax, parallaxIntensity, prefersReducedMotion]);

  // Tilt effect on hover
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!tilt || prefersReducedMotion || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;

      const tiltX = (y - 0.5) * tiltIntensity;
      const tiltY = (x - 0.5) * -tiltIntensity;

      setTransform((prev) => ({ ...prev, x: tiltX, y: tiltY }));
    },
    [tilt, tiltIntensity, prefersReducedMotion]
  );

  const handleMouseEnter = useCallback(() => {
    if (hoverLift && !prefersReducedMotion) {
      setTransform((prev) => ({ ...prev, scale: 1.02 }));
    }
  }, [hoverLift, prefersReducedMotion]);

  const handleMouseLeave = useCallback(() => {
    setTransform({ x: 0, y: 0, scale: 1 });
  }, []);

  // If reduced motion, just render normal image
  if (prefersReducedMotion) {
    return (
      <div className={cn('relative overflow-hidden', containerClassName)}>
        <Image alt={alt} className={cn('w-full h-full object-cover', className)} {...imageProps} />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative overflow-hidden group',
        overlayClasses[overlay],
        hoverLift && 'cursor-pointer',
        containerClassName
      )}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div
        ref={imageRef}
        className="w-full h-full transition-transform duration-300 ease-out"
        style={{
          transform: `
            perspective(1000px)
            rotateX(${tilt ? transform.x : 0}deg)
            rotateY(${tilt ? transform.y : 0}deg)
            translateY(${parallax ? transform.y : 0}px)
            scale(${transform.scale})
          `,
          transformOrigin: 'center center',
        }}
      >
        <Image
          alt={alt}
          className={cn(
            'w-full h-full object-cover transition-transform duration-300',
            hoverLift && 'group-hover:shadow-2xl',
            className
          )}
          {...imageProps}
        />
      </div>
    </div>
  );
}

export default ParallaxImage;
