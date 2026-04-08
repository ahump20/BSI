'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

interface StatValueProps {
  /** Target numeric value */
  value: number;
  /** Format function for display (default: round to integer) */
  format?: (v: number) => string;
  /** Label shown below the value */
  label: ReactNode;
  /** Count-up animation duration in ms */
  duration?: number;
  /** Override text color (CSS value or variable) */
  color?: string;
  /** Large display size for hero stats */
  large?: boolean;
  className?: string;
}

/**
 * Animated stat counter — counts up from 0 to target value on mount.
 * Uses requestAnimationFrame with ease-out cubic for smooth 60fps.
 * Respects prefers-reduced-motion.
 */
export function StatValue({
  value,
  format = (v) => String(Math.round(v)),
  label,
  duration = 800,
  color,
  large = false,
  className = '',
}: StatValueProps) {
  const [display, setDisplay] = useState(value);
  const ref = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);
  const mounted = useRef(false);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;

      // Respect reduced motion preference
      if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        setDisplay(value);
        hasAnimated.current = true;
        return;
      }

      // Start from 0 for first animation
      setDisplay(0);
    }

    if (hasAnimated.current) {
      setDisplay(value);
      return;
    }

    const start = performance.now();
    let raf: number;

    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic — fast start, gentle landing
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(value * eased);

      if (progress < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        hasAnimated.current = true;
      }
    }

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return (
    <div className={`flex flex-col ${className}`}>
      <span
        ref={ref}
        className={`${large ? 'text-3xl md:text-4xl' : 'text-2xl'} font-bold tabular-nums transition-opacity duration-300`}
        style={{
          fontFamily: 'var(--font-mono)',
          color: color ?? undefined,
          opacity: !hasAnimated.current && display === 0 ? 0.3 : 1,
        }}
      >
        {format(display)}
      </span>
      <span
        className="text-[10px] uppercase tracking-wider mt-0.5"
        style={{
          fontFamily: 'var(--font-display)',
          color: 'var(--bsi-dust)',
        }}
      >
        {label}
      </span>
    </div>
  );
}
