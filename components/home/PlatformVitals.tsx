'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * PlatformVitals — thin broadcast info bar.
 * Heritage IBM Plex Mono styling with animated counters.
 * Sits between CTA and footer as a platform credibility strip.
 */

function AnimatedCount({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (hasAnimated.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          const duration = 1200;
          const start = performance.now();

          function tick(now: number) {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            // Ease-out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.round(target * eased));
            if (progress < 1) requestAnimationFrame(tick);
          }

          requestAnimationFrame(tick);
          observer.disconnect();
        }
      },
      { threshold: 0.5 },
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);

  return (
    <span ref={ref} className="text-[var(--bsi-bone)] font-semibold">
      {count}{suffix}
    </span>
  );
}

export function PlatformVitals() {
  return (
    <div
      className="py-3 px-4 sm:px-6"
      style={{
        background: 'var(--surface-scoreboard)',
        borderTop: '1px solid var(--border-vintage)',
        borderBottom: '1px solid var(--border-vintage)',
        fontFamily: 'var(--bsi-font-data)',
      }}
    >
      <div className="max-w-4xl mx-auto flex items-center justify-center gap-4 sm:gap-8 flex-wrap text-[10px] uppercase tracking-[0.15em] text-[var(--heritage-bronze)]">
        <span>
          <AnimatedCount target={300} suffix="+" /> D1 Teams
        </span>
        <span className="text-[var(--border-vintage)]">&#9670;</span>
        <span>
          <AnimatedCount target={5} /> Sports
        </span>
        <span className="text-[var(--border-vintage)]">&#9670;</span>
        <span>
          <AnimatedCount target={22} /> Conferences
        </span>
        <span className="hidden sm:inline text-[var(--border-vintage)]">&#9670;</span>
        <span className="hidden sm:inline">
          Updated Every <AnimatedCount target={6} />h
        </span>
      </div>
    </div>
  );
}
