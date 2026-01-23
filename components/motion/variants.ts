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
  // Sport-specific curves
  pitchRelease: [0.45, 0.05, 0.55, 0.95] as const, // Quick start, smooth decel (like fastball)
  tackleSnap: [0.87, 0, 0.13, 1] as const, // Explosive start (like off the snap)
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

// =============================================================================
// Blaze Reveal (Signature Animation)
// Element clips in from bottom with subtle scale and elastic easing
// =============================================================================

export const blazeReveal: Variants = {
  hidden: {
    opacity: 0,
    y: 40,
    scale: 0.98,
    clipPath: 'inset(100% 0% 0% 0%)',
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    clipPath: 'inset(0% 0% 0% 0%)',
    transition: {
      duration: 0.8,
      ease: easing.elastic,
      clipPath: {
        duration: 0.6,
        ease: easing.outExpo,
      },
    },
  },
};

export const blazeRevealStagger: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.15,
    },
  },
};

// =============================================================================
// Sport-Specific Reveal Variants
// =============================================================================

export const pitchReveal: Variants = {
  hidden: {
    opacity: 0,
    x: -30,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: easing.pitchRelease,
    },
  },
};

export const tackleReveal: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
    scale: 0.92,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: easing.tackleSnap,
    },
  },
};

// =============================================================================
// Scroll-Triggered Parallax Variants
// =============================================================================

export const cardParallax: Variants = {
  hidden: {
    opacity: 0,
    y: 60,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.7,
      ease: easing.outExpo,
    },
  },
};

export const statCountUp: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.8,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: easing.elastic,
    },
  },
};

// =============================================================================
// Overlapping Card Cluster Variants
// =============================================================================

export const cardCluster: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

export const cardClusterItem: Variants = {
  hidden: {
    opacity: 0,
    y: 30,
    rotate: -2,
  },
  visible: {
    opacity: 1,
    y: 0,
    rotate: 0,
    transition: {
      duration: 0.5,
      ease: easing.outExpo,
    },
  },
  hover: {
    y: -8,
    zIndex: 10,
    boxShadow: '0 20px 50px rgba(191, 87, 0, 0.25)',
    transition: {
      duration: 0.25,
      ease: easing.smooth,
    },
  },
};
