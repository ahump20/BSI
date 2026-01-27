/**
 * BSI Responsive Hooks
 *
 * Centralized responsive utilities for consistent mobile/desktop detection.
 * Server-safe: All hooks return conservative defaults during SSR.
 *
 * Usage:
 * - useMediaQuery: Generic media query matching
 * - useBreakpoint: Current Tailwind breakpoint name
 * - useMobile: Boolean for mobile detection
 * - useIsTouchDevice: Boolean for touch capability detection
 * - useWindowSize: Current window dimensions
 *
 * Breakpoints (Tailwind defaults):
 * - sm: 640px
 * - md: 768px
 * - lg: 1024px
 * - xl: 1280px
 * - 2xl: 1536px
 */

'use client';

import { useState, useEffect, useCallback } from 'react';

// ============================================================================
// Types
// ============================================================================

export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

export interface WindowSize {
  width: number;
  height: number;
}

// ============================================================================
// Constants
// ============================================================================

/** Tailwind breakpoint values in pixels */
export const BREAKPOINTS = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

/** Common media queries */
export const MEDIA_QUERIES = {
  mobile: '(max-width: 767px)',
  tablet: '(min-width: 768px) and (max-width: 1023px)',
  desktop: '(min-width: 1024px)',
  prefersReducedMotion: '(prefers-reduced-motion: reduce)',
  prefersDark: '(prefers-color-scheme: dark)',
  prefersLight: '(prefers-color-scheme: light)',
  touch: '(pointer: coarse)',
  hover: '(hover: hover)',
} as const;

// ============================================================================
// useMediaQuery
// ============================================================================

/**
 * Generic media query hook
 *
 * @param query - CSS media query string
 * @param defaultValue - Default value for SSR (default: false)
 * @returns Boolean indicating if the media query matches
 *
 * @example
 * const isMobile = useMediaQuery('(max-width: 767px)');
 * const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
 */
export function useMediaQuery(query: string, defaultValue = false): boolean {
  const [matches, setMatches] = useState(defaultValue);

  useEffect(() => {
    // Check if window is defined (client-side)
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia(query);
    setMatches(mediaQuery.matches);

    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [query]);

  return matches;
}

// ============================================================================
// useWindowSize
// ============================================================================

/**
 * Window size hook with debounced updates
 *
 * @returns Current window width and height
 *
 * @example
 * const { width, height } = useWindowSize();
 */
export function useWindowSize(): WindowSize {
  const [size, setSize] = useState<WindowSize>({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let timeoutId: ReturnType<typeof setTimeout>;

    const handleResize = () => {
      // Debounce resize events
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setSize({
          width: window.innerWidth,
          height: window.innerHeight,
        });
      }, 100);
    };

    // Set initial size
    setSize({
      width: window.innerWidth,
      height: window.innerHeight,
    });

    window.addEventListener('resize', handleResize, { passive: true });
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeoutId);
    };
  }, []);

  return size;
}

// ============================================================================
// useBreakpoint
// ============================================================================

/**
 * Current Tailwind breakpoint hook
 *
 * @returns Current breakpoint name and helper functions
 *
 * @example
 * const { breakpoint, isAbove, isBelow } = useBreakpoint();
 * if (isAbove('md')) { // Show desktop layout }
 */
export function useBreakpoint(): {
  breakpoint: Breakpoint;
  isAbove: (bp: Breakpoint) => boolean;
  isBelow: (bp: Breakpoint) => boolean;
  isExact: (bp: Breakpoint) => boolean;
} {
  const { width } = useWindowSize();

  const getBreakpoint = useCallback((w: number): Breakpoint => {
    if (w >= BREAKPOINTS['2xl']) return '2xl';
    if (w >= BREAKPOINTS.xl) return 'xl';
    if (w >= BREAKPOINTS.lg) return 'lg';
    if (w >= BREAKPOINTS.md) return 'md';
    if (w >= BREAKPOINTS.sm) return 'sm';
    return 'xs';
  }, []);

  const breakpoint = getBreakpoint(width);

  const isAbove = useCallback(
    (bp: Breakpoint): boolean => {
      return width >= BREAKPOINTS[bp];
    },
    [width]
  );

  const isBelow = useCallback(
    (bp: Breakpoint): boolean => {
      return width < BREAKPOINTS[bp];
    },
    [width]
  );

  const isExact = useCallback(
    (bp: Breakpoint): boolean => {
      return breakpoint === bp;
    },
    [breakpoint]
  );

  return { breakpoint, isAbove, isBelow, isExact };
}

// ============================================================================
// useMobile
// ============================================================================

/**
 * Mobile detection hook
 *
 * @param breakpoint - Breakpoint threshold (default: 'md' = 768px)
 * @returns Boolean indicating if viewport is below breakpoint
 *
 * @example
 * const isMobile = useMobile(); // true if < 768px
 * const isSmallMobile = useMobile('sm'); // true if < 640px
 */
export function useMobile(breakpoint: Breakpoint = 'md'): boolean {
  const { isBelow } = useBreakpoint();
  return isBelow(breakpoint);
}

// ============================================================================
// useIsTouchDevice
// ============================================================================

/**
 * Touch device detection hook
 *
 * @returns Boolean indicating if device has touch capability
 *
 * @example
 * const isTouch = useIsTouchDevice();
 * if (isTouch) { // Show touch-friendly UI }
 */
export function useIsTouchDevice(): boolean {
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkTouch = () => {
      const hasTouch =
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        // @ts-expect-error - msMaxTouchPoints is IE-specific
        navigator.msMaxTouchPoints > 0;

      // Also check pointer media query for more accurate detection
      const coarsePointer = window.matchMedia('(pointer: coarse)').matches;

      setIsTouch(hasTouch || coarsePointer);
    };

    checkTouch();

    // Re-check on orientation change (some devices report differently)
    window.addEventListener('orientationchange', checkTouch);
    return () => window.removeEventListener('orientationchange', checkTouch);
  }, []);

  return isTouch;
}

// ============================================================================
// usePrefersReducedMotion
// ============================================================================

/**
 * Reduced motion preference hook
 *
 * @returns Boolean indicating if user prefers reduced motion
 *
 * @example
 * const prefersReducedMotion = usePrefersReducedMotion();
 * if (prefersReducedMotion) { // Disable animations }
 */
export function usePrefersReducedMotion(): boolean {
  return useMediaQuery(MEDIA_QUERIES.prefersReducedMotion, true);
}

// ============================================================================
// useOrientation
// ============================================================================

export type Orientation = 'portrait' | 'landscape';

/**
 * Device orientation hook
 *
 * @returns Current orientation ('portrait' or 'landscape')
 *
 * @example
 * const orientation = useOrientation();
 * if (orientation === 'landscape') { // Full-width layout }
 */
export function useOrientation(): Orientation {
  const [orientation, setOrientation] = useState<Orientation>('portrait');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateOrientation = () => {
      setOrientation(window.innerWidth > window.innerHeight ? 'landscape' : 'portrait');
    };

    updateOrientation();

    window.addEventListener('resize', updateOrientation, { passive: true });
    window.addEventListener('orientationchange', updateOrientation);

    return () => {
      window.removeEventListener('resize', updateOrientation);
      window.removeEventListener('orientationchange', updateOrientation);
    };
  }, []);

  return orientation;
}

// ============================================================================
// Server-Safe Utilities
// ============================================================================

/**
 * Check if code is running on client side
 */
export function isClient(): boolean {
  return typeof window !== 'undefined';
}

/**
 * Get initial mobile state for SSR (conservative default)
 * Assumes mobile-first for better UX on unknown devices
 */
export function getInitialMobileState(): boolean {
  if (typeof window === 'undefined') return true;
  return window.innerWidth < BREAKPOINTS.md;
}

/**
 * Get initial breakpoint for SSR
 */
export function getInitialBreakpoint(): Breakpoint {
  if (typeof window === 'undefined') return 'xs';
  const width = window.innerWidth;
  if (width >= BREAKPOINTS['2xl']) return '2xl';
  if (width >= BREAKPOINTS.xl) return 'xl';
  if (width >= BREAKPOINTS.lg) return 'lg';
  if (width >= BREAKPOINTS.md) return 'md';
  if (width >= BREAKPOINTS.sm) return 'sm';
  return 'xs';
}
