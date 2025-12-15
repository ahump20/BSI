'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';

export interface StatCounterProps {
  /** Target number to count to */
  value: number;
  /** Optional prefix (e.g., "$") */
  prefix?: string;
  /** Optional suffix (e.g., "%", "+") */
  suffix?: string;
  /** Animation duration in ms */
  duration?: number;
  /** Decimal places */
  decimals?: number;
  /** Thousand separator */
  separator?: string;
  /** Start animation when in view */
  startOnView?: boolean;
  /** Label text below number */
  label?: string;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Additional class names */
  className?: string;
}

const sizeClasses = {
  sm: 'text-2xl md:text-3xl',
  md: 'text-3xl md:text-4xl',
  lg: 'text-4xl md:text-5xl lg:text-6xl',
  xl: 'text-5xl md:text-6xl lg:text-7xl',
};

const labelSizeClasses = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
  xl: 'text-lg',
};

// Easing function (ease-out cubic)
function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

// Format number with separators
function formatNumber(num: number, decimals: number = 0, separator: string = ','): string {
  const fixed = num.toFixed(decimals);
  const [integer, decimal] = fixed.split('.');
  const formatted = integer.replace(/\B(?=(\d{3})+(?!\d))/g, separator);
  return decimal ? `${formatted}.${decimal}` : formatted;
}

/**
 * StatCounter component
 *
 * Animated counter that counts up to a target number.
 * Only animates with REAL data - no placeholder values.
 * Respects prefers-reduced-motion.
 */
export function StatCounter({
  value,
  prefix = '',
  suffix = '',
  duration = 2000,
  decimals = 0,
  separator = ',',
  startOnView = true,
  label,
  size = 'lg',
  className,
}: StatCounterProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [displayValue, setDisplayValue] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const rafId = useRef<number | null>(null);

  // Check reduced motion preference
  useEffect(() => {
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(motionQuery.matches);

    // If reduced motion, show final value immediately
    if (motionQuery.matches) {
      setDisplayValue(value);
      setHasAnimated(true);
    }

    const handler = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
      if (e.matches) {
        setDisplayValue(value);
        setHasAnimated(true);
      }
    };

    motionQuery.addEventListener('change', handler);
    return () => motionQuery.removeEventListener('change', handler);
  }, [value]);

  // Animation function
  const animate = useCallback(() => {
    if (hasAnimated || prefersReducedMotion) return;

    const startTime = performance.now();
    const startValue = 0;

    const tick = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutCubic(progress);

      const currentValue = startValue + (value - startValue) * easedProgress;
      setDisplayValue(currentValue);

      if (progress < 1) {
        rafId.current = requestAnimationFrame(tick);
      } else {
        setDisplayValue(value);
        setHasAnimated(true);
      }
    };

    rafId.current = requestAnimationFrame(tick);

    return () => {
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, [value, duration, hasAnimated, prefersReducedMotion]);

  // Intersection Observer for triggering animation
  useEffect(() => {
    if (!startOnView || hasAnimated || prefersReducedMotion) {
      if (!hasAnimated && !prefersReducedMotion) {
        animate();
      }
      return;
    }

    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          animate();
          observer.unobserve(element);
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [startOnView, hasAnimated, animate, prefersReducedMotion]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, []);

  return (
    <div ref={ref} className={cn('text-center', className)}>
      <div
        className={cn(
          'font-display font-bold tracking-tight text-text-primary tabular-nums',
          sizeClasses[size]
        )}
      >
        <span className="text-burnt-orange">{prefix}</span>
        <span>{formatNumber(displayValue, decimals, separator)}</span>
        <span className="text-burnt-orange">{suffix}</span>
      </div>
      {label && (
        <p
          className={cn(
            'mt-2 text-text-secondary uppercase tracking-wider font-medium',
            labelSizeClasses[size]
          )}
        >
          {label}
        </p>
      )}
    </div>
  );
}

// Stat group for multiple counters
export interface StatGroupProps {
  stats: Array<{
    value: number;
    label: string;
    prefix?: string;
    suffix?: string;
    decimals?: number;
  }>;
  size?: StatCounterProps['size'];
  className?: string;
}

export function StatGroup({ stats, size = 'md', className }: StatGroupProps) {
  return (
    <div className={cn('grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12', className)}>
      {stats.map((stat, index) => (
        <StatCounter
          key={index}
          value={stat.value}
          label={stat.label}
          prefix={stat.prefix}
          suffix={stat.suffix}
          decimals={stat.decimals}
          size={size}
          duration={2000 + index * 200} // Stagger animations
        />
      ))}
    </div>
  );
}

export default StatCounter;
