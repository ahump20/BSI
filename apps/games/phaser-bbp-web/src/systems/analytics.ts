interface AnalyticsEvent {
  type: 'session:start' | 'session:end' | 'session:update';
  payload: Record<string, unknown>;
}

const SESSION_KEY = 'bbp-session-start';

export function startSession() {
  const timestamp = Date.now();
  window.sessionStorage.setItem(SESSION_KEY, String(timestamp));
  publish({ type: 'session:start', payload: { timestamp } });
}

export function endSession(summary: Record<string, unknown>) {
  const started = Number(window.sessionStorage.getItem(SESSION_KEY) ?? Date.now());
  const durationMs = Date.now() - started;
  publish({ type: 'session:end', payload: { started, durationMs, ...summary } });
  window.sessionStorage.removeItem(SESSION_KEY);
}

export function markProgress(state: Record<string, unknown>) {
  publish({ type: 'session:update', payload: state });
}

function publish(event: AnalyticsEvent) {
  if (navigator.doNotTrack === '1') return;
  window.parent?.postMessage({ source: 'bbp-web', ...event }, '*');
}
