'use client';

import type { JSX } from 'react';
import { useRef, ReactNode } from 'react';
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

/**
 * ScrollReveal component
 *
 * Renders children in a wrapper element. Scroll animations are disabled
 * to prevent invisible content on static/SSR pages.
 */
export function ScrollReveal({ children, className, as: Component = 'div' }: ScrollRevealProps) {
  const ref = useRef<HTMLElement>(null);
  const Wrapper = Component as any;

  return (
    <Wrapper ref={ref} className={cn(className)}>
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

export function ScrollRevealGroup({ children, className }: ScrollRevealGroupProps) {
  return <div className={cn('revealed', className)}>{children}</div>;
}

export default ScrollReveal;
