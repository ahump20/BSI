'use client';

/**
 * BSI Scroll Reveal
 *
 * Pass-through wrapper. Scroll animations disabled to prevent
 * invisible content on static/SSR pages.
 */

import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';

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

export function ScrollReveal({ children, className, as: Component = 'div' }: ScrollRevealProps) {
  return <Component className={cn(className)}>{children}</Component>;
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

export function ScrollRevealGroup({ children, className }: ScrollRevealGroupProps) {
  return <div className={cn(className)}>{children}</div>;
}

export default ScrollReveal;
