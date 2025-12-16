/**
 * BSI Motion Variants
 *
 * Shared animation variants for Framer Motion components.
 * All timings and easings match BSI design system.
 */

import type { Variants } from 'framer-motion';

// BSI custom easing curves (matching tailwind.config.ts)
export const easing = {
  smooth: [0.25, 0.1, 0.25, 1] as const,
  outExpo: [0.16, 1, 0.3, 1] as const,
  elastic: [0.34, 1.56, 0.64, 1] as const,
  bounce: [0.68, -0.55, 0.265, 1.55] as const,
};

// Standard durations
export const duration = {
  fast: 0.15,
  normal: 0.3,
  slow: 0.5,
  reveal: 0.6,
};

// =============================================================================
// Scroll Reveal Variants
// =============================================================================

export const fadeInUp: Variants = {
  hidden: {
    opacity: 0,
    y: 24,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: duration.reveal,
      ease: easing.smooth,
    },
  },
};

export const fadeInDown: Variants = {
  hidden: {
    opacity: 0,
    y: -24,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: duration.reveal,
      ease: easing.smooth,
    },
  },
};

export const fadeInLeft: Variants = {
  hidden: {
    opacity: 0,
    x: -24,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: duration.reveal,
      ease: easing.smooth,
    },
  },
};

export const fadeInRight: Variants = {
  hidden: {
    opacity: 0,
    x: 24,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: duration.reveal,
      ease: easing.smooth,
    },
  },
};

export const scaleIn: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: duration.reveal,
      ease: easing.smooth,
    },
  },
};

export const fadeIn: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      duration: duration.slow,
      ease: easing.smooth,
    },
  },
};

// =============================================================================
// Stagger Container Variants
// =============================================================================

export const staggerContainer: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

export const staggerItem: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: duration.slow,
      ease: easing.smooth,
    },
  },
};

// =============================================================================
// Page Transition Variants
// =============================================================================

export const pageTransition: Variants = {
  initial: {
    opacity: 0,
    y: 8,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: duration.normal,
      ease: easing.smooth,
    },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: {
      duration: duration.normal,
      ease: easing.smooth,
    },
  },
};

// =============================================================================
// Micro-interaction Variants
// =============================================================================

export const buttonTap = {
  scale: 0.98,
  transition: {
    duration: duration.fast,
    ease: easing.smooth,
  },
};

export const buttonHover = {
  scale: 1.02,
  transition: {
    duration: duration.fast,
    ease: easing.smooth,
  },
};

export const cardHover = {
  y: -4,
  boxShadow: '0 0 40px rgba(191, 87, 0, 0.3)',
  transition: {
    duration: 0.2,
    ease: easing.smooth,
  },
};

export const cardRest = {
  y: 0,
  boxShadow: '0 0 0px rgba(191, 87, 0, 0)',
  transition: {
    duration: 0.2,
    ease: easing.smooth,
  },
};

// =============================================================================
// Direction Map (for ScrollReveal component)
// =============================================================================

export const directionVariants: Record<string, Variants> = {
  up: fadeInUp,
  down: fadeInDown,
  left: fadeInLeft,
  right: fadeInRight,
  scale: scaleIn,
  fade: fadeIn,
};
