'use client';

/**
 * BSI Scroll Reveal
 *
 * Reveals content with animation when scrolled into view.
 * Uses Framer Motion's useInView for performance.
 */

import { motion, useInView, type Variants } from 'framer-motion';
import { useRef, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { useReducedMotion } from './hooks';
import {
  directionVariants,
  duration as defaultDurations,
  easing,
  blazeReveal,
  pitchReveal,
  tackleReveal,
} from './variants';

export type RevealDirection =
  | 'up'
  | 'down'
  | 'left'
  | 'right'
  | 'scale'
  | 'fade'
  | 'blaze'
  | 'pitch'
  | 'tackle';

export interface ScrollRevealProps {
  /** Content to reveal */
  children: ReactNode;
  /** Animation direction */
  direction?: RevealDirection;
  /** Animation delay in seconds */
  delay?: number;
  /** Animation duration in seconds */
  duration?: number;
  /** Only animate once */
  once?: boolean;
  /** Additional class names */
  className?: string;
  /** HTML element to render */
  as?: 'div' | 'section' | 'article' | 'aside' | 'header' | 'footer' | 'main' | 'span';
}

/**
 * Scroll-triggered reveal animation.
 * Uses IntersectionObserver via Framer Motion's useInView.
 */
export function ScrollReveal({
  children,
  direction = 'up',
  delay = 0,
  duration = defaultDurations.reveal,
  once = true,
  className,
  as = 'div',
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once, margin: '-100px 0px' });
  const prefersReducedMotion = useReducedMotion();

  // Render without animation if user prefers reduced motion
  if (prefersReducedMotion) {
    const Component = as;
    return <Component className={className}>{children}</Component>;
  }

  // Extended variants map including new reveal styles
  const extendedVariants: Partial<Record<RevealDirection, Variants>> = {
    ...directionVariants,
    blaze: blazeReveal,
    pitch: pitchReveal,
    tackle: tackleReveal,
  };
  const variants = extendedVariants[direction];
  const MotionComponent = motion[as];

  return (
    <MotionComponent
      ref={ref}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={variants}
      transition={{
        delay,
        duration,
        ease: easing.smooth,
      }}
      className={cn(className)}
    >
      {children}
    </MotionComponent>
  );
}

// =============================================================================
// Scroll Reveal Group (Staggered Children)
// =============================================================================

export interface ScrollRevealGroupProps {
  children: ReactNode;
  /** Base delay before stagger starts (seconds) */
  baseDelay?: number;
  /** Delay between each child (seconds) */
  stagger?: number;
  /** Animation direction for children */
  direction?: RevealDirection;
  /** Animation duration for each child */
  duration?: number;
  /** Additional class names */
  className?: string;
}

/**
 * Container that staggers child reveal animations.
 */
export function ScrollRevealGroup({
  children,
  baseDelay = 0,
  stagger = 0.08,
  direction = 'up',
  duration = defaultDurations.reveal,
  className,
}: ScrollRevealGroupProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-50px 0px' });
  const prefersReducedMotion = useReducedMotion();

  // Render without animation if user prefers reduced motion
  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  const extendedVariants: Partial<Record<RevealDirection, Variants>> = {
    ...directionVariants,
    blaze: blazeReveal,
    pitch: pitchReveal,
    tackle: tackleReveal,
  };
  const childVariants = extendedVariants[direction];

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            delayChildren: baseDelay,
            staggerChildren: stagger,
          },
        },
      }}
      className={cn(className)}
    >
      {Array.isArray(children)
        ? children.map((child, index) => (
            <motion.div key={index} variants={childVariants} transition={{ duration }}>
              {child}
            </motion.div>
          ))
        : children}
    </motion.div>
  );
}

export default ScrollReveal;
