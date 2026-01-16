/**
 * BSI Motion System
 *
 * Unified animation components using Framer Motion.
 * All components respect prefers-reduced-motion.
 */

// Core Components
export { MotionProvider } from './MotionProvider';
export { PageTransition } from './PageTransition';
export { ScrollReveal, ScrollRevealGroup } from './ScrollReveal';
export { StaggerGrid } from './StaggerGrid';
export { AnimatedCard } from './AnimatedCard';
export { AnimatedButton } from './AnimatedButton';

// Types
export type { ScrollRevealProps, ScrollRevealGroupProps } from './ScrollReveal';
export type { StaggerGridProps } from './StaggerGrid';
export type { AnimatedCardProps } from './AnimatedCard';
export type { AnimatedButtonProps } from './AnimatedButton';

// Hooks
export { useReducedMotion, useAnimationConfig, useMotionProps } from './hooks';
export type { AnimationConfig } from './hooks';

// Variants (for custom animations)
export {
  // Easing & Timing
  easing,
  duration,
  // Reveal variants
  fadeIn,
  fadeInUp,
  fadeInDown,
  fadeInLeft,
  fadeInRight,
  scaleIn,
  // Container variants
  staggerContainer,
  staggerItem,
  // Page transition
  pageTransition,
  // Micro-interaction
  buttonHover,
  buttonTap,
  cardHover,
  cardRest,
  // Direction map
  directionVariants,
} from './variants';
