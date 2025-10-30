/**
 * Graphics Engine - Main Export
 *
 * Central export point for all graphics engine utilities, components, and hooks.
 *
 * @example
 * ```tsx
 * import { LineChart, graphicsTheme, useFadeIn } from '@/lib/graphics';
 * ```
 */

// Theme and Configuration
export {
  graphicsTheme,
  chartDefaults,
  getChartColor,
  createGradient,
  hexToRgba,
} from './theme';

// Animation Utilities
export {
  prefersReducedMotion,
  getAnimationDuration,
  fadeIn,
  fadeOut,
  slideIn,
  scale,
  staggerAnimation,
  reveal,
  shimmer,
  bounce,
  rotate,
  observeIntersection,
  AnimationFrameScheduler,
  easings,
  animateValue,
} from './animations';

export type {
  AnimationConfig,
  StaggerConfig,
} from './animations';

// React Hooks
export {
  useFadeIn,
  useSlideIn,
  useRevealOnScroll,
  useStaggerChildren,
  useIntersectionObserver,
  useElementSize,
  useDebounce,
  useHover,
  useFocus,
  usePrefersReducedMotion,
  useCountUp,
  useScrollPosition,
  useMediaQuery,
  usePrevious,
  useToggle,
  useLocalStorage,
} from './hooks';
