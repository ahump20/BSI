/**
 * BSI Motion System - Animation Timing & Easings
 *
 * Philosophy: "Blaze Ease" - fast attack, smooth settle
 * Like striking a match: quick ignition, lingering warmth
 */

/**
 * Duration Scale (milliseconds)
 *
 * micro: Hover states, small feedback
 * fast: UI transitions, selections
 * medium: Page transitions, reveals
 * slow: Hero animations, loading states
 * cinematic: Intro sequences, major reveals
 */
export const duration = {
  micro: 150,
  fast: 300,
  medium: 500,
  slow: 800,
  cinematic: 1500,
  // Extended durations for Theatre.js sequences
  intro: 2400,
  heroSequence: 3500,
} as const;

/**
 * Duration as CSS-ready strings
 */
export const durationCSS = {
  micro: '150ms',
  fast: '300ms',
  medium: '500ms',
  slow: '800ms',
  cinematic: '1500ms',
  intro: '2400ms',
  heroSequence: '3500ms',
} as const;

/**
 * Easing Functions
 *
 * blazeEase: Fast attack, smooth settle (signature BSI easing)
 * snapBack: Slight overshoot, playful
 * smooth: Standard ease-in-out
 * sharp: Quick, snappy
 * bounce: Physics-based bounce
 */
export const easing = {
  // BSI Signature - fast attack, lingering finish
  blazeEase: 'cubic-bezier(0.16, 1, 0.3, 1)',

  // Alternatives
  snapBack: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
  sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
  bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',

  // Standard CSS
  linear: 'linear',
  easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
  easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
  easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
} as const;

/**
 * Easing Functions as JavaScript functions
 * For use with GSAP, Theatre.js, or manual animations
 */
export const easingFn = {
  // BSI Signature - fast attack, lingering finish
  blazeEase: (t: number): number => {
    // Custom approximation of cubic-bezier(0.16, 1, 0.3, 1)
    return 1 - Math.pow(1 - t, 4);
  },

  // Exponential out
  easeOutExpo: (t: number): number => {
    return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
  },

  // Cubic in-out
  easeInOutCubic: (t: number): number => {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  },

  // Back out (overshoot)
  easeOutBack: (t: number): number => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },

  // Elastic out
  easeOutElastic: (t: number): number => {
    if (t === 0 || t === 1) return t;
    return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1;
  },

  // Linear
  linear: (t: number): number => t,
} as const;

/**
 * Spring configurations for Framer Motion
 */
export const spring = {
  // Snappy but smooth
  snappy: {
    type: 'spring' as const,
    stiffness: 400,
    damping: 30,
  },
  // Bouncy, playful
  bouncy: {
    type: 'spring' as const,
    stiffness: 300,
    damping: 20,
  },
  // Gentle, slow settle
  gentle: {
    type: 'spring' as const,
    stiffness: 100,
    damping: 15,
  },
  // Quick response
  quick: {
    type: 'spring' as const,
    stiffness: 500,
    damping: 40,
  },
} as const;

/**
 * Transition presets for Framer Motion
 */
export const transition = {
  // Fast micro-interactions
  micro: {
    duration: duration.micro / 1000,
    ease: [0.16, 1, 0.3, 1], // blazeEase as array
  },
  // Standard UI transitions
  fast: {
    duration: duration.fast / 1000,
    ease: [0.16, 1, 0.3, 1],
  },
  // Page transitions
  medium: {
    duration: duration.medium / 1000,
    ease: [0.16, 1, 0.3, 1],
  },
  // Hero reveals
  slow: {
    duration: duration.slow / 1000,
    ease: [0.16, 1, 0.3, 1],
  },
  // Cinematic sequences
  cinematic: {
    duration: duration.cinematic / 1000,
    ease: [0.16, 1, 0.3, 1],
  },
} as const;

/**
 * Stagger delays for list/grid animations
 */
export const stagger = {
  fast: 0.03, // 30ms between items
  normal: 0.05, // 50ms between items
  slow: 0.1, // 100ms between items
  dramatic: 0.15, // 150ms between items
} as const;

/**
 * GSAP-compatible easing strings
 */
export const gsapEasing = {
  blazeEase: 'power4.out',
  smooth: 'power2.inOut',
  sharp: 'power3.out',
  bounce: 'back.out(1.7)',
  elastic: 'elastic.out(1, 0.3)',
} as const;

/**
 * Theatre.js keyframe timing helpers
 */
export const theatreKeyframes = {
  // Standard intro sequence timing (in seconds)
  intro: {
    fadeIn: { start: 0, end: 0.5 },
    coreAppear: { start: 0.5, end: 1.5 },
    ringsExpand: { start: 1.5, end: 2.5 },
    nodesAppear: { start: 2.5, end: 3.0 },
    textTypeIn: { start: 3.0, end: 3.5 },
    idleLoopStart: 3.5,
  },
} as const;

/**
 * CSS Custom Properties for motion
 */
export const motionCSSVars = `
  --duration-micro: ${durationCSS.micro};
  --duration-fast: ${durationCSS.fast};
  --duration-medium: ${durationCSS.medium};
  --duration-slow: ${durationCSS.slow};
  --duration-cinematic: ${durationCSS.cinematic};
  --ease-blaze: ${easing.blazeEase};
  --ease-snap-back: ${easing.snapBack};
  --ease-smooth: ${easing.smooth};
`;

// Type exports
export type Duration = keyof typeof duration;
export type Easing = keyof typeof easing;
export type Spring = keyof typeof spring;
export type Transition = keyof typeof transition;
