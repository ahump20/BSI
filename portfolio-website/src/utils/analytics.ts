/** Page view + feature tracking for austinhumphrey.com */

const BSI_ANALYTICS = 'https://blazesportsintel.com/api/analytics/event';

function getSessionId(): string {
  const existing = sessionStorage.getItem('portfolio_session');
  if (existing) return existing;
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  sessionStorage.setItem('portfolio_session', id);
  return id;
}

function send(payload: Record<string, unknown>): void {
  const body = JSON.stringify(payload);
  const sent = navigator.sendBeacon?.(BSI_ANALYTICS, body);
  if (!sent) {
    fetch(BSI_ANALYTICS, { method: 'POST', body, keepalive: true }).catch(() => {});
  }
}

export function trackPageView(path: string): void {
  send({
    event: 'page_view',
    properties: {
      path,
      site: 'portfolio',
      referrer: document.referrer,
      session_id: getSessionId(),
      timestamp: new Date().toISOString(),
    },
  });
}

export function trackClick(element: string): void {
  send({
    event: 'feature_click',
    properties: {
      element,
      path: window.location.pathname,
      site: 'portfolio',
      session_id: getSessionId(),
      timestamp: new Date().toISOString(),
    },
  });
}
