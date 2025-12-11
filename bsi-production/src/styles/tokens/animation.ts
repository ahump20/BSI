/**
 * BSI Design System - Animation Tokens
 *
 * Smooth, purposeful animations that enhance the experience
 * without being gratuitous.
 *
 * @author Austin Humphrey
 * @version 2.0.0
 */

export const animation = {
  // Duration scales
  duration: {
    instant: '0ms',
    fast: '150ms',
    normal: '300ms',
    slow: '500ms',
    slower: '700ms',
    slowest: '1000ms',

    // Page transitions
    pageTransition: '400ms',

    // 3D animations
    rotationSlow: '20s',
    rotationMedium: '10s',
    rotationFast: '5s',

    // Particle lifetimes
    particleShort: '2s',
    particleMedium: '4s',
    particleLong: '8s',
  },

  // Timing functions (easing)
  easing: {
    // Standard easing
    linear: 'linear',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0.0, 0.0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',

    // Expressive easing for 3D/UI
    spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    smooth: 'cubic-bezier(0.25, 0.1, 0.25, 1)',

    // Entrance/exit
    enter: 'cubic-bezier(0.0, 0.0, 0.2, 1)',
    exit: 'cubic-bezier(0.4, 0, 1, 1)',

    // Dramatic (for 3D scenes)
    dramatic: 'cubic-bezier(0.16, 1, 0.3, 1)',
    cinematic: 'cubic-bezier(0.65, 0, 0.35, 1)',
  },

  // Delay scales
  delay: {
    none: '0ms',
    short: '100ms',
    medium: '200ms',
    long: '400ms',
    stagger1: '100ms',
    stagger2: '200ms',
    stagger3: '300ms',
    stagger4: '400ms',
    stagger5: '500ms',
  },
} as const;

// Keyframe definitions
export const keyframes = {
  // Fade animations
  fadeIn: {
    from: { opacity: 0 },
    to: { opacity: 1 },
  },

  fadeOut: {
    from: { opacity: 1 },
    to: { opacity: 0 },
  },

  fadeInUp: {
    from: { opacity: 0, transform: 'translateY(30px)' },
    to: { opacity: 1, transform: 'translateY(0)' },
  },

  fadeInDown: {
    from: { opacity: 0, transform: 'translateY(-30px)' },
    to: { opacity: 1, transform: 'translateY(0)' },
  },

  // Scale animations
  scaleIn: {
    from: { opacity: 0, transform: 'scale(0.95)' },
    to: { opacity: 1, transform: 'scale(1)' },
  },

  scaleOut: {
    from: { opacity: 1, transform: 'scale(1)' },
    to: { opacity: 0, transform: 'scale(0.95)' },
  },

  // Pulse/glow animations
  pulse: {
    '0%, 100%': { opacity: 1 },
    '50%': { opacity: 0.5 },
  },

  glow: {
    '0%, 100%': { boxShadow: '0 0 20px rgba(191, 87, 0, 0.3)' },
    '50%': { boxShadow: '0 0 40px rgba(191, 87, 0, 0.6)' },
  },

  // 3D rotations
  rotateY: {
    from: { transform: 'rotateY(0deg)' },
    to: { transform: 'rotateY(360deg)' },
  },

  float: {
    '0%, 100%': { transform: 'translateY(0)' },
    '50%': { transform: 'translateY(-10px)' },
  },

  // Ember/fire animations
  flicker: {
    '0%, 100%': { opacity: 1 },
    '25%': { opacity: 0.9 },
    '50%': { opacity: 0.8 },
    '75%': { opacity: 0.95 },
  },

  rise: {
    from: { transform: 'translateY(0) scale(1)', opacity: 1 },
    to: { transform: 'translateY(-100px) scale(0.5)', opacity: 0 },
  },

  // Scroll-reveal
  scrollReveal: {
    from: { opacity: 0, transform: 'translateY(60px) scale(0.95)' },
    to: { opacity: 1, transform: 'translateY(0) scale(1)' },
  },
} as const;

// Predefined transition styles
export const transitions = {
  // Standard transitions
  default: `all ${animation.duration.normal} ${animation.easing.easeOut}`,
  fast: `all ${animation.duration.fast} ${animation.easing.easeOut}`,
  slow: `all ${animation.duration.slow} ${animation.easing.easeOut}`,

  // Property-specific
  opacity: `opacity ${animation.duration.normal} ${animation.easing.easeOut}`,
  transform: `transform ${animation.duration.normal} ${animation.easing.easeOut}`,
  colors: `color ${animation.duration.fast} ${animation.easing.easeOut}, background-color ${animation.duration.fast} ${animation.easing.easeOut}`,
  shadow: `box-shadow ${animation.duration.normal} ${animation.easing.easeOut}`,

  // Interactive
  hover: `all ${animation.duration.fast} ${animation.easing.spring}`,
  active: `transform ${animation.duration.instant} ${animation.easing.linear}`,

  // Page transitions
  pageEnter: `all ${animation.duration.pageTransition} ${animation.easing.cinematic}`,
  pageExit: `all ${animation.duration.pageTransition} ${animation.easing.easeIn}`,
} as const;

export type AnimationToken = typeof animation;
export type KeyframeToken = typeof keyframes;
export type TransitionToken = typeof transitions;
