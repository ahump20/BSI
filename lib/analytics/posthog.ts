/**
 * PostHog Analytics — Init wrapper
 *
 * Lazy, browser-only, env-gated. If the key is missing, PostHog
 * is never loaded and all calls become no-ops.
 *
 * The posthog-js library is dynamically imported to keep it out of the
 * initial bundle (~40-80KB deferred until first call to initPostHog).
 */
import type posthogLib from 'posthog-js';

export const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY ?? '';
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com';

let posthogInstance: typeof posthogLib | null = null;
let initialized = false;

export async function initPostHog(): Promise<typeof posthogLib | null> {
  if (typeof window === 'undefined') return null;
  if (!POSTHOG_KEY) return null;
  if (initialized) return posthogInstance;

  // Internal traffic opt-out: visit any BSI page with ?bsi_internal=1 to set the flag,
  // or run localStorage.setItem('bsi_internal', 'true') in console.
  // Once set, PostHog never loads — your visits are invisible to analytics.
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get('bsi_internal') === '1') {
      localStorage.setItem('bsi_internal', 'true');
    }
    if (localStorage.getItem('bsi_internal') === 'true') {
      return null;
    }
  } catch {
    // Private browsing or localStorage blocked — proceed normally
  }

  const { default: posthog } = await import('posthog-js');

  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    person_profiles: 'identified_only',
    capture_pageview: false, // Manually fired in PostHogProvider on route change
    capture_pageleave: true,
    autocapture: true,
    persistence: 'localStorage+cookie',
    capture_performance: true, // Web vitals (FCP, LCP, CLS, etc.)
    loaded: (ph) => {
      if (process.env.NODE_ENV === 'development') {
        ph.debug();
      }
    },
  });

  posthogInstance = posthog;
  initialized = true;
  return posthog;
}

export function getPostHog(): typeof posthogLib | null {
  if (!initialized || !POSTHOG_KEY) return null;
  return posthogInstance;
}
