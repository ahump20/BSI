'use client';

import { useEffect, useRef, ReactNode } from 'react';

/* ==========================================================================
   Cinematic barrel — ScrollReveal is real, NoiseOverlay/CustomCursor are stubs
   (noise and cursor removed in the Labs-structure redesign)
   ========================================================================== */

interface ScrollRevealProps {
  children: ReactNode;
  direction?: 'up' | 'left' | 'right' | 'scale';
  delay?: number;
  className?: string;
}

/**
 * Intersection-observer scroll reveal.
 * Applies CSS `.reveal` / `.revealed` classes defined in globals.css.
 */
export function ScrollReveal({ children, direction = 'up', delay = 0, className = '' }: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const revealed = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || revealed.current) return;

    const reveal = () => {
      if (revealed.current) return;
      revealed.current = true;
      el.classList.add('revealed');
    };

    // No IntersectionObserver — reveal immediately
    if (typeof IntersectionObserver === 'undefined') {
      reveal();
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          reveal();
          observer.disconnect();
        }
      },
      { threshold: 0.05, rootMargin: '0px 0px -20px 0px' }
    );

    observer.observe(el);

    // Above-fold: check on next frame
    requestAnimationFrame(() => {
      if (!revealed.current && el.getBoundingClientRect().top < window.innerHeight) {
        reveal();
        observer.disconnect();
      }
    });

    return () => { observer.disconnect(); };
  }, []);

  // Fallback outside effect cleanup — survives React strict mode double-mount.
  // Polls briefly to catch elements freed from Suspense hidden containers.
  useEffect(() => {
    if (revealed.current) return;
    const checks = [500, 1200, 2500];
    const timers = checks.map(ms =>
      setTimeout(() => {
        if (!revealed.current && ref.current) {
          ref.current.classList.add('revealed');
          revealed.current = true;
        }
      }, ms)
    );
    return () => { timers.forEach(clearTimeout); };
  }, []);

  const dirClass =
    direction === 'left'
      ? 'reveal reveal-left'
      : direction === 'right'
        ? 'reveal reveal-right'
        : direction === 'scale'
          ? 'reveal reveal-scale'
          : 'reveal';

  return (
    <div
      ref={ref}
      className={`${dirClass} ${className}`}
      style={{ transitionDelay: delay ? `${delay}ms` : undefined }}
    >
      {children}
    </div>
  );
}

/** Stub — noise overlay removed in redesign */
export function NoiseOverlay(_props: { cssOnly?: boolean }) {
  return null;
}

/** Stub — custom cursor removed in redesign */
export function CustomCursor() {
  return null;
}
