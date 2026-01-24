'use client';

/**
 * BLAZE SPORTS INTEL - Scroll Animations
 * ======================================
 * Scroll-triggered animations using Framer Motion
 * Features: Fade in, slide up, stagger children, parallax
 *
 * Last Updated: 2025-11-24
 */

import React from 'react';
import { motion, useScroll, useTransform, useInView, Variants } from 'framer-motion';

// ==================== ANIMATION VARIANTS ====================

export const fadeInUp: Variants = {
  hidden: {
    opacity: 0,
    y: 30,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.23, 1, 0.32, 1] as const,
    },
  },
};

export const fadeInDown: Variants = {
  hidden: {
    opacity: 0,
    y: -30,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.23, 1, 0.32, 1] as const,
    },
  },
};

export const fadeInLeft: Variants = {
  hidden: {
    opacity: 0,
    x: -30,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.5,
      ease: [0.23, 1, 0.32, 1] as const,
    },
  },
};

export const fadeInRight: Variants = {
  hidden: {
    opacity: 0,
    x: 30,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.5,
      ease: [0.23, 1, 0.32, 1] as const,
    },
  },
};

export const scaleIn: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.9,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: [0.23, 1, 0.32, 1] as const,
    },
  },
};

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

// ==================== ANIMATED COMPONENTS ====================

interface AnimatedSectionProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  variants?: Variants;
  once?: boolean;
}

/**
 * Fade in from bottom when scrolled into view
 */
export function FadeInUp({
  children,
  className = '',
  delay = 0,
  once = true,
}: AnimatedSectionProps) {
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once, margin: '-100px' });

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={fadeInUp}
      className={className}
      style={{ transitionDelay: `${delay}s` }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Scale in when scrolled into view
 */
export function ScaleIn({
  children,
  className = '',
  delay = 0,
  once = true,
}: AnimatedSectionProps) {
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once, margin: '-100px' });

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={scaleIn}
      className={className}
      style={{ transitionDelay: `${delay}s` }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Staggered children animation container
 */
export function StaggerContainer({ children, className = '', once = true }: AnimatedSectionProps) {
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once, margin: '-100px' });

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={staggerContainer}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * Individual stagger item - use inside StaggerContainer
 */
export function StaggerItem({
  children,
  className = '',
  variants = fadeInUp,
}: AnimatedSectionProps) {
  return (
    <motion.div variants={variants} className={className}>
      {children}
    </motion.div>
  );
}

// ==================== PARALLAX COMPONENTS ====================

interface ParallaxProps {
  children: React.ReactNode;
  className?: string;
  speed?: number; // -1 to 1, negative = slower, positive = faster
}

/**
 * Parallax container - moves content based on scroll
 */
export function ParallaxSection({ children, className = '', speed = 0.2 }: ParallaxProps) {
  const ref = React.useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  const y = useTransform(scrollYProgress, [0, 1], [-100 * speed, 100 * speed]);

  return (
    <div ref={ref} className={className} style={{ overflow: 'hidden' }}>
      <motion.div style={{ y }}>{children}</motion.div>
    </div>
  );
}

/**
 * Parallax background image
 */
export function ParallaxBackground({
  src,
  className = '',
  speed = 0.3,
}: {
  src: string;
  className?: string;
  speed?: number;
}) {
  const ref = React.useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  const y = useTransform(scrollYProgress, [0, 1], ['0%', `${100 * speed}%`]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.1]);

  return (
    <div ref={ref} className={`relative overflow-hidden ${className}`}>
      <motion.div
        style={{
          y,
          scale,
          backgroundImage: `url(${src})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          position: 'absolute',
          inset: '-20%',
          width: '140%',
          height: '140%',
        }}
      />
    </div>
  );
}

// ==================== CARD ANIMATION ====================

interface AnimatedCardProps {
  children: React.ReactNode;
  className?: string;
  index?: number;
  hoverScale?: number;
}

/**
 * Animated card with stagger effect and hover scale
 */
export function AnimatedCard({
  children,
  className = '',
  index = 0,
  hoverScale = 1.02,
}: AnimatedCardProps) {
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={
        isInView
          ? {
              opacity: 1,
              y: 0,
              transition: {
                duration: 0.5,
                delay: index * 0.08,
                ease: [0.23, 1, 0.32, 1] as const,
              },
            }
          : {}
      }
      whileHover={{
        scale: hoverScale,
        transition: { duration: 0.2 },
      }}
      whileTap={{ scale: 0.98 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ==================== REVEAL TEXT ====================

interface RevealTextProps {
  children: string;
  className?: string;
  delay?: number;
}

/**
 * Text that reveals character by character
 */
export function RevealText({ children, className = '', delay = 0 }: RevealTextProps) {
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: true });

  const words = children.split(' ');

  return (
    <motion.span ref={ref} className={className}>
      {words.map((word, wordIndex) => (
        <span key={wordIndex} className="inline-block">
          {word.split('').map((char, charIndex) => (
            <motion.span
              key={charIndex}
              initial={{ opacity: 0, y: 20 }}
              animate={
                isInView
                  ? {
                      opacity: 1,
                      y: 0,
                      transition: {
                        duration: 0.3,
                        delay: delay + wordIndex * 0.1 + charIndex * 0.03,
                        ease: [0.23, 1, 0.32, 1] as const,
                      },
                    }
                  : {}
              }
              className="inline-block"
            >
              {char}
            </motion.span>
          ))}
          <span className="inline-block">&nbsp;</span>
        </span>
      ))}
    </motion.span>
  );
}

// ==================== GLOW EFFECT ====================

/**
 * Animated glow effect on hover
 */
export function GlowOnHover({
  children,
  className = '',
  glowColor = 'rgba(191, 87, 0, 0.4)',
}: {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
}) {
  return (
    <motion.div className={`relative ${className}`} whileHover="hover" initial="rest">
      <motion.div
        className="absolute inset-0 rounded-inherit pointer-events-none"
        variants={{
          rest: { opacity: 0 },
          hover: {
            opacity: 1,
            boxShadow: `0 0 40px ${glowColor}, 0 0 80px ${glowColor}`,
          },
        }}
        transition={{ duration: 0.3 }}
        style={{ borderRadius: 'inherit' }}
      />
      {children}
    </motion.div>
  );
}
