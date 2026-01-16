'use client';

/**
 * BSI Animated Button
 *
 * Button with micro-interaction animations.
 * Subtle scale on hover and tap for tactile feedback.
 */

import { motion, type HTMLMotionProps } from 'framer-motion';
import { forwardRef, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { useReducedMotion } from './hooks';
import { buttonHover, buttonTap } from './variants';

export interface AnimatedButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  children: ReactNode;
  /** Button variant */
  variant?: 'primary' | 'secondary' | 'ghost';
  /** Button size */
  size?: 'sm' | 'md' | 'lg';
  /** Disable hover/tap animations */
  disableAnimation?: boolean;
  /** Additional class names */
  className?: string;
}

const variantStyles = {
  primary: 'bg-burnt-orange text-white hover:bg-burnt-orange/90 shadow-lg shadow-burnt-orange/20',
  secondary:
    'bg-transparent border-2 border-burnt-orange text-burnt-orange hover:bg-burnt-orange/10',
  ghost: 'bg-transparent text-white hover:bg-white/5',
};

const sizeStyles = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-3 text-base',
  lg: 'px-8 py-4 text-lg',
};

/**
 * Button with hover and tap micro-interactions.
 * - Scales up slightly on hover (1.02x)
 * - Scales down on tap (0.98x) for tactile feel
 * - Respects reduced motion preferences
 */
export const AnimatedButton = forwardRef<HTMLButtonElement, AnimatedButtonProps>(
  function AnimatedButton(
    { children, variant = 'primary', size = 'md', disableAnimation = false, className, ...props },
    ref
  ) {
    const prefersReducedMotion = useReducedMotion();
    const shouldAnimate = !prefersReducedMotion && !disableAnimation;

    return (
      <motion.button
        ref={ref}
        whileHover={shouldAnimate ? buttonHover : undefined}
        whileTap={shouldAnimate ? buttonTap : undefined}
        className={cn(
          'inline-flex items-center justify-center font-medium rounded-lg',
          'transition-colors duration-200',
          'focus:outline-none focus:ring-2 focus:ring-burnt-orange focus:ring-offset-2 focus:ring-offset-midnight',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {children}
      </motion.button>
    );
  }
);

export default AnimatedButton;
