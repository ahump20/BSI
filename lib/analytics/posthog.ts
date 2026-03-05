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

  const { default: posthog } = await import('posthog-js');

  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    person_profiles: 'identified_only',
    capture_pageview: false,
    capture_pageleave: true,
    autocapture: true,
    persistence: 'localStorage+cookie',
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
