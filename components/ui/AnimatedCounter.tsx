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
 */
export function AnimatedCounter({ end, suffix = '', duration = 1500 }: AnimatedCounterProps) {
  // Initialize with `end` so SSR/crawlers see the real value, not "0"
  const [count, setCount] = useState(end);
  const ref = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);
  const hydrated = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // After hydration, reset to 0 so the animation can play
    if (!hydrated.current) {
      hydrated.current = true;

      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        setCount(end);
        return;
      }

      setCount(0);
    }

    const animate = () => {
      if (hasAnimated.current) return;
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
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) animate();
      },
      { threshold: 0.3, rootMargin: '0px 0px -50px 0px' },
    );

    observer.observe(el);

    // Timeout fallback: if observer hasn't fired in 2s (element above fold),
    // skip animation and show final value
    const timeout = setTimeout(() => {
      if (!hasAnimated.current) {
        hasAnimated.current = true;
        setCount(end);
      }
    }, 2000);

    return () => {
      observer.disconnect();
      clearTimeout(timeout);
    };
  }, [end, duration]);

  return (
    <span ref={ref}>
      {count}
      {suffix}
    </span>
  );
}
