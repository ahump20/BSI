'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, useInView, useAnimation } from 'framer-motion';

export interface AnimatedChartWrapperProps {
  children: React.ReactNode;
  animationType?: 'fade' | 'slide' | 'scale' | 'rotate' | 'blur';
  delay?: number;
  duration?: number;
  className?: string;
  style?: React.CSSProperties;
  triggerOnce?: boolean;
}

/**
 * Animated Chart Wrapper Component
 * Adds smooth entrance animations to any chart component
 * Uses Framer Motion with intersection observer for scroll-triggered animations
 */
export default function AnimatedChartWrapper({
  children,
  animationType = 'fade',
  delay = 0,
  duration = 0.6,
  className = '',
  style = {},
  triggerOnce = true
}: AnimatedChartWrapperProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: triggerOnce, margin: '-100px' });
  const controls = useAnimation();

  useEffect(() => {
    if (isInView) {
      controls.start('visible');
    } else if (!triggerOnce) {
      controls.start('hidden');
    }
  }, [isInView, controls, triggerOnce]);

  const variants = {
    fade: {
      hidden: { opacity: 0 },
      visible: { opacity: 1 }
    },
    slide: {
      hidden: { opacity: 0, y: 50 },
      visible: { opacity: 1, y: 0 }
    },
    scale: {
      hidden: { opacity: 0, scale: 0.8 },
      visible: { opacity: 1, scale: 1 }
    },
    rotate: {
      hidden: { opacity: 0, rotate: -5, scale: 0.95 },
      visible: { opacity: 1, rotate: 0, scale: 1 }
    },
    blur: {
      hidden: { opacity: 0, filter: 'blur(10px)' },
      visible: { opacity: 1, filter: 'blur(0px)' }
    }
  };

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={controls}
      variants={variants[animationType]}
      transition={{
        duration,
        delay,
        ease: [0.25, 0.1, 0.25, 1] // Custom easing curve
      }}
      className={className}
      style={style}
    >
      {children}
    </motion.div>
  );
}

/**
 * Staggered Container for multiple charts
 * Animates child elements in sequence
 */
export function StaggeredChartContainer({
  children,
  staggerDelay = 0.1,
  className = '',
  style = {}
}: {
  children: React.ReactNode;
  staggerDelay?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={{
        visible: {
          transition: {
            staggerChildren: staggerDelay
          }
        }
      }}
      className={className}
      style={style}
    >
      {React.Children.map(children, (child, index) => (
        <motion.div
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 }
          }}
          transition={{ duration: 0.5 }}
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
}

/**
 * Counter Animation Component
 * Animates numbers counting up from 0
 */
export function AnimatedCounter({
  from = 0,
  to,
  duration = 2,
  decimals = 0,
  suffix = '',
  prefix = '',
  className = '',
  style = {}
}: {
  from?: number;
  to: number;
  duration?: number;
  decimals?: number;
  suffix?: string;
  prefix?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const [count, setCount] = useState(from);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;

    const startTime = Date.now();
    const endTime = startTime + duration * 1000;

    const updateCount = () => {
      const now = Date.now();
      const progress = Math.min((now - startTime) / (endTime - startTime), 1);

      // Easing function (easeOutExpo)
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const currentCount = from + (to - from) * eased;

      setCount(currentCount);

      if (progress < 1) {
        requestAnimationFrame(updateCount);
      }
    };

    requestAnimationFrame(updateCount);
  }, [isInView, from, to, duration]);

  return (
    <span ref={ref} className={className} style={style}>
      {prefix}{count.toFixed(decimals)}{suffix}
    </span>
  );
}

/**
 * Chart Loading Skeleton
 * Displays an animated placeholder while chart loads
 */
export function ChartLoadingSkeleton({
  height = 400,
  width = '100%',
  variant = 'rectangular'
}: {
  height?: number | string;
  width?: number | string;
  variant?: 'rectangular' | 'circular';
}) {
  return (
    <motion.div
      style={{
        height,
        width,
        borderRadius: variant === 'circular' ? '50%' : '12px',
        background: 'linear-gradient(90deg, rgba(15, 23, 42, 0.3) 0%, rgba(148, 163, 184, 0.2) 50%, rgba(15, 23, 42, 0.3) 100%)',
        backgroundSize: '200% 100%',
        position: 'relative',
        overflow: 'hidden'
      }}
      animate={{
        backgroundPosition: ['0% 0%', '100% 0%']
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: 'linear'
      }}
    >
      {/* Shimmer effect */}
      <motion.div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(90deg, transparent, rgba(248, 250, 252, 0.1), transparent)',
        }}
        animate={{
          x: ['-100%', '100%']
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'linear'
        }}
      />
    </motion.div>
  );
}

/**
 * Pulse Animation for Live Updates
 * Adds a pulsing effect to indicate real-time data
 */
export function LiveUpdateIndicator({
  isLive = true,
  label = 'LIVE',
  className = ''
}: {
  isLive?: boolean;
  label?: string;
  className?: string;
}) {
  if (!isLive) return null;

  return (
    <motion.div
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.25rem 0.75rem',
        borderRadius: '9999px',
        background: 'rgba(220, 38, 38, 0.2)',
        border: '1px solid rgba(220, 38, 38, 0.5)',
        fontSize: '0.75rem',
        fontWeight: 600,
        color: 'rgba(248, 250, 252, 0.95)',
        textTransform: 'uppercase',
        letterSpacing: '0.05em'
      }}
    >
      <motion.div
        style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: '#dc2626'
        }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [1, 0.7, 1]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
      />
      {label}
    </motion.div>
  );
}
