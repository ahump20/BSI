'use client';

import { useRef, useEffect } from 'react';

/**
 * ScrollProgress — 2px burnt-orange bar fixed to the top of the viewport.
 * Fills left-to-right as the user scrolls. Uses rAF throttle and direct
 * DOM writes to avoid React re-renders on every scroll event.
 */
export function ScrollProgress() {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      bar.style.display = 'none';
      return;
    }

    let ticking = false;

    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
          const progress = scrollHeight > 0 ? window.scrollY / scrollHeight : 0;
          bar.style.transform = `scaleX(${progress})`;
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div
      ref={barRef}
      className="fixed top-0 left-0 right-0 h-[2px] z-50 pointer-events-none"
      style={{
        background: '#BF5700',
        transformOrigin: 'left',
        transform: 'scaleX(0)',
      }}
      aria-hidden="true"
    />
  );
}
