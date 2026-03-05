/**
 * BSI Behavioral Analytics Tracker
 *
 * Sends structured events to the bsi-analytics-events Worker (D1-backed).
 * Designed for the strategic plan's five queries: cross-sport demand,
 * content conversion, return rates, sport transitions, paywall funnels.
 *
 * Persistent visitor_id in localStorage, session_id in sessionStorage.
 * Fire-and-forget via sendBeacon with fetch fallback.
 */

const EVENTS_ENDPOINT = '/api/events';

// ---------------------------------------------------------------------------
// Identity
// ---------------------------------------------------------------------------

/** Persistent visitor ID — survives sessions, cleared only on storage wipe */
export function getVisitorId(): string {
  if (typeof window === 'undefined') return 'server';
  const existing = localStorage.getItem('bsi_vid');
  if (existing) return existing;
  const id = crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  localStorage.setItem('bsi_vid', id);
  return id;
}

/** Session-scoped ID — reuses existing cross-site.ts pattern */
export function getSessionId(): string {
  if (typeof window === 'undefined') return 'server';
  const existing = sessionStorage.getItem('bsi_session');
  if (existing) return existing;
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  sessionStorage.setItem('bsi_session', id);
  return id;
}

// ---------------------------------------------------------------------------
// Context detection
// ---------------------------------------------------------------------------

const SPORT_PATTERNS: [RegExp, string][] = [
  [/^\/college-baseball/, 'college_baseball'],
  [/^\/mlb/, 'mlb'],
  [/^\/nfl/, 'nfl'],
  [/^\/nba/, 'nba'],
  [/^\/cfb/, 'cfb'],
  [/^\/cbb/, 'cbb'],
  [/^\/nil-valuation/, 'nil'],
];

/** Extract sport from URL path */
export function detectSport(path: string): string | undefined {
  for (const [pattern, sport] of SPORT_PATTERNS) {
    if (pattern.test(path)) return sport;
  }
  return undefined;
}

const CONTENT_PATTERNS: [RegExp, string][] = [
  [/\/players\/[^/]+$/, 'player_page'],
  [/\/players\/?$/, 'player_index'],
  [/\/teams\/[^/]+$/, 'team_page'],
  [/\/teams\/?$/, 'team_index'],
  [/\/standings/, 'standings'],
  [/\/scores/, 'scores'],
  [/\/rankings/, 'rankings'],
  [/\/editorial/, 'editorial'],
  [/\/games\/[^/]+$/, 'game_detail'],
  [/\/games\/?$/, 'game_index'],
  [/\/news/, 'news'],
];

/** Infer content type from URL path segments */
export function detectContentType(path: string): string | undefined {
  for (const [pattern, type] of CONTENT_PATTERNS) {
    if (pattern.test(path)) return type;
  }
  // Fallback: sport hub page (e.g., /mlb, /college-baseball)
  if (SPORT_PATTERNS.some(([p]) => p.test(path)) && path.split('/').filter(Boolean).length === 1) {
    return 'sport_hub';
  }
  return undefined;
}

// ---------------------------------------------------------------------------
// Event dispatch
// ---------------------------------------------------------------------------

interface EventData {
  event_name: string;
  session_id: string;
  visitor_id: string;
  sport?: string;
  content_type?: string;
  path?: string;
  referrer?: string;
  time_on_page_ms?: number;
  plan?: string;
  properties?: Record<string, unknown>;
}

function sendEvent(data: EventData): void {
  if (typeof window === 'undefined') return;

  const payload = JSON.stringify(data);

  // sendBeacon is ideal for analytics — survives page unload
  if (navigator.sendBeacon?.(EVENTS_ENDPOINT, new Blob([payload], { type: 'application/json' }))) {
    return;
  }

  // Fallback: fetch with keepalive
  void fetch(EVENTS_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: payload,
    keepalive: true,
  }).catch(() => {});
}

function buildEvent(eventName: string, extra: Partial<EventData> = {}): EventData {
  const path = typeof window !== 'undefined' ? window.location.pathname : '';
  return {
    event_name: eventName,
    session_id: getSessionId(),
    visitor_id: getVisitorId(),
    sport: detectSport(path),
    content_type: detectContentType(path),
    path,
    referrer: typeof document !== 'undefined' ? document.referrer : '',
    ...extra,
  };
}

// ---------------------------------------------------------------------------
// Public tracking functions
// ---------------------------------------------------------------------------

/** Track page view with full context */
export function trackPageView(): void {
  sendEvent(buildEvent('page_view'));
}

/** Track content read — fires when scroll depth > 60% */
export function trackContentRead(timeOnPageMs: number): void {
  sendEvent(buildEvent('content_read', { time_on_page_ms: timeOnPageMs }));
}

/**
 * Track sport switch — compares current sport to last-seen sport.
 * Only fires when the sport actually changes.
 */
export function trackSportSwitch(): void {
  if (typeof window === 'undefined') return;

  const path = window.location.pathname;
  const currentSport = detectSport(path);
  const lastSport = sessionStorage.getItem('bsi_last_sport');

  if (currentSport && lastSport && currentSport !== lastSport) {
    sendEvent(buildEvent('sport_switch', {
      properties: { from_sport: lastSport, to_sport: currentSport },
    }));
  }

  if (currentSport) {
    sessionStorage.setItem('bsi_last_sport', currentSport);
  }
}

/** Track email signup event */
export function trackEmailSignup(sport?: string): void {
  sendEvent(buildEvent('email_signup', {
    sport: sport ?? detectSport(window.location.pathname),
  }));
}

/** Track paywall hit — shown a gate */
export function trackPaywallHit(path: string, sport?: string, contentType?: string): void {
  sendEvent(buildEvent('paywall_hit', { path, sport, content_type: contentType }));
}

/** Track paywall conversion — user subscribed */
export function trackPaywallConvert(sport?: string, plan?: string): void {
  sendEvent(buildEvent('paywall_convert', { sport, plan }));
}

/** Track trial start — fires on checkout return when trial is active */
export function trackTrialStart(plan?: string): void {
  sendEvent(buildEvent('trial_start', { plan }));
}
