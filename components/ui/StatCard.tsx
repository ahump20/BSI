'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, useInView, useSpring, useTransform } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface StatCardProps {
  /** Stat label */
  label: string;
  /** Stat value (number for animation, string for static) */
  value: number | string;
  /** Optional unit suffix (e.g., '%', 'K', 'mph') */
  suffix?: string;
  /** Optional unit prefix (e.g., '$', '#') */
  prefix?: string;
  /** Change indicator (+/-) */
  change?: {
    value: number;
    type: 'positive' | 'negative' | 'neutral';
  };
  /** Progress bar (0-100) */
  progress?: number;
  /** Icon element */
  icon?: React.ReactNode;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Sport theme for accent color */
  theme?: 'default' | 'baseball' | 'football' | 'basketball';
  /** Additional className */
  className?: string;
}

const sizeStyles = {
  sm: {
    container: 'p-3',
    label: 'text-xs',
    value: 'text-xl',
    change: 'text-xs',
    icon: 'w-8 h-8',
  },
  md: {
    container: 'p-4',
    label: 'text-sm',
    value: 'text-2xl',
    change: 'text-sm',
    icon: 'w-10 h-10',
  },
  lg: {
    container: 'p-6',
    label: 'text-base',
    value: 'text-4xl',
    change: 'text-base',
    icon: 'w-12 h-12',
  },
};

const themeColors = {
  default: 'from-burnt-orange to-ember',
  baseball: 'from-[#6b8e23] to-[#228b22]',
  football: 'from-[#355e3b] to-[#228b22]',
  basketball: 'from-[#e25822] to-[#ff6b35]',
};

// Animated number counter component
function AnimatedNumber({
  value,
  prefix = '',
  suffix = '',
  className,
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  const spring = useSpring(0, {
    mass: 0.8,
    stiffness: 75,
    damping: 15,
  });

  const display = useTransform(spring, (current) => Math.round(current).toLocaleString());

  useEffect(() => {
    if (isInView) {
      spring.set(value);
    }
  }, [isInView, spring, value]);

  const [displayValue, setDisplayValue] = useState('0');

  useEffect(() => {
    const unsubscribe = display.on('change', (v) => setDisplayValue(v));
    return () => unsubscribe();
  }, [display]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {displayValue}
      {suffix}
    </span>
  );
}

// Animated progress bar
function AnimatedProgress({
  value,
  theme = 'default',
}: {
  value: number;
  theme?: 'default' | 'baseball' | 'football' | 'basketball';
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-20px' });

  return (
    <div ref={ref} className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden mt-3">
      <motion.div
        className={cn('h-full rounded-full bg-gradient-to-r', themeColors[theme])}
        initial={{ width: 0 }}
        animate={{ width: isInView ? `${Math.min(value, 100)}%` : 0 }}
        transition={{
          duration: 1,
          ease: [0.25, 0.46, 0.45, 0.94],
          delay: 0.2,
        }}
      />
    </div>
  );
}

/**
 * StatCard - Animated statistics display card
 *
 * Features:
 * - Animated number counters
 * - Progress bar visualization
 * - Change indicators
 * - Sport-themed colors
 */
export function StatCard({
  label,
  value,
  suffix = '',
  prefix = '',
  change,
  progress,
  icon,
  size = 'md',
  theme = 'default',
  className,
}: StatCardProps): JSX.Element {
  const styles = sizeStyles[size];
  const isNumeric = typeof value === 'number';

  return (
    <motion.div
      className={cn(
        'glass-card-hover rounded-xl border border-white/10',
        styles.container,
        className
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      whileHover={{ scale: 1.02 }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {/* Label */}
          <p className={cn('text-text-secondary uppercase tracking-wider mb-1', styles.label)}>
            {label}
          </p>

          {/* Value */}
          <div className={cn('font-mono font-bold text-text-primary', styles.value)}>
            {isNumeric ? (
              <AnimatedNumber value={value} prefix={prefix} suffix={suffix} />
            ) : (
              <>
                {prefix}
                {value}
                {suffix}
              </>
            )}
          </div>

          {/* Change indicator */}
          {change && (
            <div
              className={cn(
                'flex items-center gap-1 mt-1',
                styles.change,
                change.type === 'positive' && 'text-green-400',
                change.type === 'negative' && 'text-red-400',
                change.type === 'neutral' && 'text-text-secondary'
              )}
            >
              {change.type === 'positive' && (
                <svg
                  className="w-3 h-3"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M18 15l-6-6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
              {change.type === 'negative' && (
                <svg
                  className="w-3 h-3"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
              <span>
                {change.value > 0 ? '+' : ''}
                {change.value}%
              </span>
            </div>
          )}
        </div>

        {/* Icon */}
        {icon && (
          <div
            className={cn(
              'flex items-center justify-center rounded-lg bg-gradient-to-br text-white/90',
              themeColors[theme],
              styles.icon
            )}
          >
            {icon}
          </div>
        )}
      </div>

      {/* Progress bar */}
      {progress !== undefined && <AnimatedProgress value={progress} theme={theme} />}
    </motion.div>
  );
}

export default StatCard;
