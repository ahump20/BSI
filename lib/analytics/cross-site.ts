/**
 * Lightweight cross-site analytics -- fire-and-forget event tracking.
 * No PII collected. Events: page_view, feature_click, cross_site_referral.
 */

interface AnalyticsEvent {
  event: string;
  properties: {
    path: string;
    referrer: string;
    site: 'bsi' | 'portfolio' | 'blazecraft';
    session_id: string;
    timestamp: string;
    [key: string]: string | number | boolean;
  };
}

const ANALYTICS_ENDPOINT = 'https://blazesportsintel.com/api/analytics/event';

/** Generate a stable session ID (hash of date + random, stored in sessionStorage) */
export function getSessionId(): string {
  if (typeof window === 'undefined') return 'server';
  const existing = sessionStorage.getItem('bsi_session');
  if (existing) return existing;
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  sessionStorage.setItem('bsi_session', id);
  return id;
}

function detectSite(): AnalyticsEvent['properties']['site'] {
  if (typeof window === 'undefined') return 'bsi';
  const host = window.location.hostname;
  if (host.includes('blazecraft')) return 'blazecraft';
  if (host.includes('austinhumphrey') || host.includes('portfolio')) return 'portfolio';
  return 'bsi';
}

/** Fire-and-forget analytics event */
export function trackEvent(event: string, properties: Record<string, string | number | boolean> = {}): void {
  if (typeof window === 'undefined') return;

  const payload: AnalyticsEvent = {
    event,
    properties: {
      path: window.location.pathname,
      referrer: document.referrer,
      site: detectSite(),
      session_id: getSessionId(),
      timestamp: new Date().toISOString(),
      ...properties,
    },
  };

  // Fire and forget -- don't await, don't block
  if (!navigator.sendBeacon?.(ANALYTICS_ENDPOINT, JSON.stringify(payload))) {
    void fetch(ANALYTICS_ENDPOINT, {
      method: 'POST',
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {});
  }
}

/** Track page view */
export function trackPageView(path?: string): void {
  trackEvent('page_view', { page: path || window.location.pathname });
}

/** Track cross-site referral (e.g. portfolio -> BSI link click) */
export function trackCrossSiteReferral(destination: string): void {
  trackEvent('cross_site_referral', { destination });
}
