'use client';

import { useRef, useEffect, useState } from 'react';

interface AnimatedCounterProps {
  end: number;
  suffix?: string;
  duration?: number;
}

/**
 * AnimatedCounter — counts up from 0 to `end` when scrolled into view.
 * Uses IntersectionObserver to trigger once and requestAnimationFrame
 * for smooth 60fps updates. Respects prefers-reduced-motion.
 *
 * SSR-safe: renders the final value on the server so crawlers/static
 * snapshots see real numbers, then hydrates with animation.
 */
export function AnimatedCounter({ end, suffix = '', duration = 1500 }: AnimatedCounterProps) {
  const [count, setCount] = useState(end);
  const [hydrated, setHydrated] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);

  // After hydration, reset to 0 so the count-up animation can play
  useEffect(() => {
    setHydrated(true);
    setCount(0);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setCount(end);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          const start = performance.now();

          const tick = (now: number) => {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.round(eased * end));

            if (progress < 1) {
              requestAnimationFrame(tick);
            }
          };

          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.3, rootMargin: '0px 0px -50px 0px' },
    );

    observer.observe(el);

    // Fallback: if observer hasn't fired after 2s, show final value
    const fallbackTimer = setTimeout(() => {
      if (!hasAnimated.current) {
        hasAnimated.current = true;
        setCount(end);
      }
    }, 2000);

    return () => {
      observer.disconnect();
      clearTimeout(fallbackTimer);
    };
  }, [end, duration, hydrated]);

  return (
    <span ref={ref}>
      {count}
      {suffix}
    </span>
  );
}
