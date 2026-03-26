'use client';

import { useEffect, useRef, ReactNode } from 'react';

/* ==========================================================================
   Cinematic barrel — ScrollReveal (intersection-observer reveal)
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

    // Immediate check: if already in viewport on mount, reveal now
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
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

    // Above-fold double-check after layout settles (rAF + microtask)
    requestAnimationFrame(() => {
      if (!revealed.current && el.getBoundingClientRect().top < window.innerHeight) {
        reveal();
        observer.disconnect();
      }
    });

    // Hard fallback: if observer hasn't fired within 500ms, force reveal
    const fallbackTimer = setTimeout(() => {
      if (!revealed.current) {
        reveal();
        observer.disconnect();
      }
    }, 500);

    return () => {
      clearTimeout(fallbackTimer);
      observer.disconnect();
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

