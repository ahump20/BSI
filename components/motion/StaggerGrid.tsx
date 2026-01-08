'use client';

/**
 * BSI Stagger Grid
 *
 * Grid container with staggered reveal animation for children.
 * Perfect for card grids, team lists, stat displays.
 */

import { motion, useInView } from 'framer-motion';
import { useRef, Children, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { useReducedMotion } from './hooks';
import { staggerContainer, staggerItem, easing } from './variants';

export interface StaggerGridProps {
  children: ReactNode;
  /** Grid column classes (Tailwind) */
  columns?: string;
  /** Gap between items (Tailwind) */
  gap?: string;
  /** Delay between each item reveal (seconds) */
  stagger?: number;
  /** Additional class names */
  className?: string;
}

/**
 * Grid with staggered child animations.
 * Children fade in with a slight upward motion, one after another.
 */
export function StaggerGrid({
  children,
  columns = 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  gap = 'gap-6',
  stagger = 0.08,
  className,
}: StaggerGridProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-50px 0px' });
  const prefersReducedMotion = useReducedMotion();

  // Render static grid if user prefers reduced motion
  if (prefersReducedMotion) {
    return <div className={cn('grid', columns, gap, className)}>{children}</div>;
  }

  const childrenArray = Children.toArray(children);

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
            staggerChildren: stagger,
            delayChildren: 0.1,
          },
        },
      }}
      className={cn('grid', columns, gap, className)}
    >
      {childrenArray.map((child, index) => (
        <motion.div
          key={index}
          variants={staggerItem}
          transition={{
            duration: 0.5,
            ease: easing.smooth,
          }}
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
}

export default StaggerGrid;
