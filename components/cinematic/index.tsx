'use client';

import { useEffect, useRef, ReactNode } from 'react';
import { prefersReducedMotion } from '@/lib/hooks/useReducedMotion';

/* ==========================================================================
   Cinematic barrel — ScrollReveal (intersection-observer reveal)
   ========================================================================== */

interface ScrollRevealProps {
  children: ReactNode;
  direction?: 'up' | 'down' | 'left' | 'right' | 'scale' | 'fade';
  delay?: number;
  /** Enable stagger mode — children animate in sequence */
  stagger?: boolean;
  /** IntersectionObserver threshold (0-1). Default 0.05 */
  threshold?: number;
  /** Root margin for earlier/later trigger. Default '-40px' */
  rootMargin?: string;
  className?: string;
  /** HTML element to render (default: div) */
  as?: 'div' | 'section' | 'article';
}

/**
 * Intersection-observer scroll reveal — CSS Layer of the motion system.
 * Applies CSS `.reveal` / `.revealed` classes defined in globals.css.
 * Respects prefers-reduced-motion automatically.
 *
 * Stagger mode: wraps children in `.reveal-stagger` so each child
 * enters with a calculated delay.
 */
export function ScrollReveal({
  children,
  direction = 'up',
  delay = 0,
  stagger = false,
  threshold = 0.05,
  rootMargin = '0px 0px -40px 0px',
  className = '',
  as: Tag = 'div',
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const revealed = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || revealed.current) return;

    // Skip animation entirely for reduced motion users
    if (prefersReducedMotion()) {
      el.classList.add('revealed');
      revealed.current = true;
      return;
    }

    const reveal = () => {
      if (revealed.current) return;
      revealed.current = true;
      el.classList.add('revealed');
    };

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
      { threshold, rootMargin }
    );

    observer.observe(el);

    // Above-fold double-check after layout settles
    requestAnimationFrame(() => {
      if (!revealed.current && el.getBoundingClientRect().top < window.innerHeight) {
        reveal();
        observer.disconnect();
      }
    });

    // Safety fallback — 800ms (was 500ms, gives more time for data-heavy pages)
    const fallbackTimer = setTimeout(() => {
      if (!revealed.current) {
        reveal();
        observer.disconnect();
      }
    }, 800);

    return () => {
      clearTimeout(fallbackTimer);
      observer.disconnect();
    };
  }, [threshold, rootMargin]);

  const dirClass =
    direction === 'left'
      ? 'reveal reveal-left'
      : direction === 'right'
        ? 'reveal reveal-right'
        : direction === 'scale'
          ? 'reveal reveal-scale'
          : direction === 'down'
            ? 'reveal reveal-down'
            : direction === 'fade'
              ? 'reveal reveal-fade'
              : 'reveal';

  const staggerClass = stagger ? ' reveal-stagger' : '';

  return (
    <div
      ref={ref}
      className={`${dirClass}${staggerClass} ${className}`}
      style={{ transitionDelay: delay ? `${delay}ms` : undefined }}
      role={Tag !== 'div' ? undefined : undefined}
    >
      {children}
    </div>
  );
}

