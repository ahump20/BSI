export function trackEvent(event: string, properties?: Record<string, string>) {
  // Fire-and-forget POST to /api/analytics
  const payload = { event, properties, timestamp: new Date().toISOString(), page: window.location.pathname };
  navigator.sendBeacon?.('/api/analytics', JSON.stringify(payload));
}

export function trackPageView() {
  trackEvent('page_view', { referrer: document.referrer });
}
