'use client';

/**
 * BSI Animated Card
 *
 * Card component with hover lift and glow effects.
 * Combines scroll reveal with interactive hover states.
 */

import { motion, useInView } from 'framer-motion';
import { useRef, forwardRef, type ReactNode, type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { useReducedMotion } from './hooks';
import { fadeInUp, cardHover, cardRest, easing } from './variants';

export interface AnimatedCardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  children: ReactNode;
  /** Stagger index for grid animations */
  index?: number;
  /** Disable scroll reveal (hover only) */
  disableReveal?: boolean;
  /** Disable hover effects */
  disableHover?: boolean;
  /** Additional class names */
  className?: string;
}

/**
 * Card with scroll reveal and hover animations.
 * - Fades in when scrolled into view
 * - Lifts and glows on hover
 * - Respects reduced motion preferences
 */
export const AnimatedCard = forwardRef<HTMLDivElement, AnimatedCardProps>(
  function AnimatedCard(
    {
      children,
      index = 0,
      disableReveal = false,
      disableHover = false,
      className,
      ...props
    },
    forwardedRef
  ) {
    const internalRef = useRef<HTMLDivElement>(null);
    const ref = forwardedRef || internalRef;
    const isInView = useInView(internalRef, { once: true, margin: '-50px 0px' });
    const prefersReducedMotion = useReducedMotion();

    // Static card for reduced motion preference
    if (prefersReducedMotion) {
      return (
        <div
          ref={ref as React.Ref<HTMLDivElement>}
          className={cn(
            'rounded-xl bg-charcoal/50 backdrop-blur-md border border-white/10',
            'transition-colors duration-200',
            className
          )}
          {...props}
        >
          {children}
        </div>
      );
    }

    // Calculate stagger delay based on index
    const staggerDelay = index * 0.08;

    return (
      <motion.div
        ref={internalRef}
        initial={disableReveal ? false : 'hidden'}
        animate={disableReveal ? undefined : isInView ? 'visible' : 'hidden'}
        variants={disableReveal ? undefined : fadeInUp}
        transition={{
          delay: staggerDelay,
          duration: 0.5,
          ease: easing.smooth,
        }}
        whileHover={disableHover ? undefined : cardHover}
        className={cn(
          'rounded-xl bg-charcoal/50 backdrop-blur-md border border-white/10',
          'cursor-pointer',
          className
        )}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

export default AnimatedCard;
