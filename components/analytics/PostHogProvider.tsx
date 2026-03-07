'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { initPostHog, getPostHog } from '@/lib/analytics/posthog';

/**
 * PostHogProvider — initializes PostHog and captures $pageview on route change.
 *
 * PostHog init has capture_pageview: false (correct for SPAs), so we manually
 * fire $pageview on every client-side navigation via usePathname.
 *
 * The init is async (dynamic import), so we track readiness in state to ensure
 * the first landing-page pageview fires after the library loads — not before.
 *
 * Include once in the root layout alongside PageTracker. They serve different
 * purposes: PageTracker sends to BSI's D1 analytics, this sends to PostHog.
 */
export function PostHogProvider() {
  const pathname = usePathname();
  const initialized = useRef(false);
  const [ready, setReady] = useState(false);

  // Initialize PostHog on first mount, then mark ready
  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      void initPostHog()
        .then((ph) => {
          if (ph) setReady(true);
        })
        .catch(() => {
          // PostHog blocked (ad blocker, network error) — degrade silently
        });
    }
  }, []);

  // Capture $pageview on every route change (and on first load once ready)
  useEffect(() => {
    if (!ready) return;
    const ph = getPostHog();
    if (ph) {
      ph.capture('$pageview');
    }
  }, [pathname, ready]);

  return null;
}
