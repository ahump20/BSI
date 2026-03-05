'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import {
  trackPageView,
  trackContentRead,
  trackSportSwitch,
} from '@/lib/analytics/tracker';

/**
 * PageTracker — invisible component that fires analytics events.
 *
 * - page_view on mount and route change
 * - sport_switch when navigating between sport sections
 * - content_read when user scrolls past 60% of the page
 *
 * Include once in the root layout. Uses IntersectionObserver for
 * scroll depth — creates a sentinel div at ~60% of viewport.
 */
export function PageTracker() {
  const pathname = usePathname();
  const firedContentRead = useRef(false);
  const pageLoadTime = useRef(0);

  // Track page view + sport switch on every route change
  useEffect(() => {
    trackPageView();
    trackSportSwitch();
    firedContentRead.current = false;
    pageLoadTime.current = performance.now();
  }, [pathname]);

  // Scroll depth observer — fires content_read when 60% of page is visible
  useEffect(() => {
    // Create a sentinel element positioned at 60% of the document
    const sentinel = document.createElement('div');
    sentinel.setAttribute('aria-hidden', 'true');
    sentinel.style.cssText = 'position:absolute;width:1px;height:1px;pointer-events:none;';

    function positionSentinel() {
      const docHeight = document.documentElement.scrollHeight;
      sentinel.style.top = `${Math.floor(docHeight * 0.6)}px`;
    }

    document.body.appendChild(sentinel);
    positionSentinel();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !firedContentRead.current) {
            firedContentRead.current = true;
            const elapsed = Math.floor(performance.now() - pageLoadTime.current);
            trackContentRead(elapsed);
          }
        }
      },
      { threshold: 0 }
    );

    observer.observe(sentinel);

    // Reposition sentinel on resize (content reflow changes document height)
    const handleResize = () => positionSentinel();
    window.addEventListener('resize', handleResize, { passive: true });

    return () => {
      observer.disconnect();
      sentinel.remove();
      window.removeEventListener('resize', handleResize);
    };
  }, [pathname]);

  return null;
}
