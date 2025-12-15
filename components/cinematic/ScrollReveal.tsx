'use client';

import { useEffect, useRef, useState, ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface ScrollRevealProps {
  /** Content to reveal */
  children: ReactNode;
  /** Animation direction */
  direction?: 'up' | 'down' | 'left' | 'right' | 'scale' | 'fade';
  /** Animation delay in ms */
  delay?: number;
  /** Animation duration in ms */
  duration?: number;
  /** Distance to travel in px */
  distance?: number;
  /** Trigger threshold (0-1) */
  threshold?: number;
  /** Only animate once */
  once?: boolean;
  /** Additional class names */
  className?: string;
  /** Wrapper element */
  as?: keyof JSX.IntrinsicElements;
  /** Disable animation (just show content) */
  disabled?: boolean;
}

const directionTransforms = {
  up: 'translateY(VAR)',
  down: 'translateY(-VAR)',
  left: 'translateX(VAR)',
  right: 'translateX(-VAR)',
  scale: 'scale(0.95)',
  fade: 'none',
};

/**
 * ScrollReveal component
 *
 * Reveals content with animation when scrolled into view.
 * Uses IntersectionObserver for performance.
 * Respects prefers-reduced-motion.
 */
export function ScrollReveal({
  children,
  direction = 'up',
  delay = 0,
  duration = 600,
  distance = 30,
  threshold = 0.1,
  once = true,
  className,
  as: Component = 'div',
  disabled = false,
}: ScrollRevealProps) {
  const ref = useRef<HTMLElement>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Check reduced motion preference
  useEffect(() => {
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(motionQuery.matches);

    const handler = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
      if (e.matches) setIsRevealed(true);
    };

    motionQuery.addEventListener('change', handler);
    return () => motionQuery.removeEventListener('change', handler);
  }, []);

  // Set up IntersectionObserver
  useEffect(() => {
    if (disabled || prefersReducedMotion) {
      setIsRevealed(true);
      return;
    }

    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsRevealed(true);
          if (once) {
            observer.unobserve(element);
          }
        } else if (!once) {
          setIsRevealed(false);
        }
      },
      { threshold, rootMargin: '0px 0px -50px 0px' }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [threshold, once, disabled, prefersReducedMotion]);

  // Calculate transform
  const getInitialTransform = () => {
    if (direction === 'scale') return 'scale(0.95)';
    if (direction === 'fade') return 'none';
    return directionTransforms[direction].replace('VAR', `${distance}px`);
  };

  const Wrapper = Component as any;

  return (
    <Wrapper
      ref={ref}
      className={cn(className)}
      style={{
        opacity: isRevealed ? 1 : 0,
        transform: isRevealed ? 'none' : getInitialTransform(),
        transition: prefersReducedMotion
          ? 'none'
          : `opacity ${duration}ms cubic-bezier(0.25, 0.1, 0.25, 1) ${delay}ms, transform ${duration}ms cubic-bezier(0.25, 0.1, 0.25, 1) ${delay}ms`,
        willChange: isRevealed ? 'auto' : 'opacity, transform',
      }}
    >
      {children}
    </Wrapper>
  );
}

// Staggered children reveal
export interface ScrollRevealGroupProps {
  children: ReactNode;
  /** Base delay in ms */
  baseDelay?: number;
  /** Stagger increment in ms */
  stagger?: number;
  /** Animation direction */
  direction?: ScrollRevealProps['direction'];
  /** Animation duration in ms */
  duration?: number;
  /** Additional class names */
  className?: string;
}

export function ScrollRevealGroup({
  children,
  baseDelay = 0,
  stagger = 100,
  direction = 'up',
  duration = 600,
  className,
}: ScrollRevealGroupProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(motionQuery.matches);
    if (motionQuery.matches) setIsRevealed(true);
  }, []);

  useEffect(() => {
    if (prefersReducedMotion) return;

    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsRevealed(true);
          observer.unobserve(element);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [prefersReducedMotion]);

  return (
    <div ref={ref} className={cn('reveal-stagger', isRevealed && 'revealed', className)}>
      {children}
    </div>
  );
}

export default ScrollReveal;
