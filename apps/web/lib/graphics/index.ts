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

// Advanced Animation Utilities
export {
  createSpring,
  animateSequence,
  animateParallel,
  morphPath,
  animateAlongPath,
  createParallax,
  makeDraggable,
  createMagnetic,
  animateNumber,
  createRipple,
} from './advanced-animations';

export type {
  SpringConfig,
  SpringAnimation,
  AnimationStep,
  SequenceConfig,
  ParallelAnimationConfig,
  FollowPathConfig,
  ParallaxConfig,
  DragConfig,
  MagneticConfig,
} from './advanced-animations';

// Advanced Animation Hooks
export {
  useSpring,
  useParallax,
  useDraggable,
  useMagnetic,
  useRipple,
  useSequentialReveal,
  useScrollProgress,
  usePageTransition,
  useMousePosition,
  useAnimatedPresence,
  useGesture,
} from './advanced-hooks';

// Real-Time Data Utilities
export {
  usePolling,
  useWebSocket,
  useLiveData,
  useDataRefresh,
  useDataFlash,
  useOptimisticUpdate,
  useBatchedUpdates,
} from './realtime';

export type {
  PollingConfig,
  WebSocketConfig,
  LiveDataConfig,
} from './realtime';
