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

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // No IntersectionObserver — reveal immediately
    if (typeof IntersectionObserver === 'undefined') {
      el.classList.add('revealed');
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('revealed');
          observer.unobserve(el);
          clearTimeout(fallbackTimer);
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );

    observer.observe(el);

    // Above-fold elements: reveal on next frame if already in viewport
    requestAnimationFrame(() => {
      if (el && !el.classList.contains('revealed')) {
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight) {
          el.classList.add('revealed');
          observer.unobserve(el);
        }
      }
    });

    // Fallback: force reveal after 1.5s if observer never fired
    const fallbackTimer = setTimeout(() => {
      if (!el.classList.contains('revealed')) {
        el.classList.add('revealed');
        observer.unobserve(el);
      }
    }, 1500);

    return () => {
      observer.disconnect();
      clearTimeout(fallbackTimer);
    };
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
