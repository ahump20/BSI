/**
 * BLAZE SPORTS INTEL - AUTH EVENTS LOGGER
 *
 * Logs authentication events for observability and debugging
 *
 * @version 1.0.0
 * @updated 2025-01-14
 */

export type AuthEventType =
  | 'signup_success'
  | 'signup_failed'
  | 'login_success'
  | 'login_failed'
  | 'logout'
  | 'session_validated'
  | 'session_expired'
  | 'password_reset_requested'
  | 'password_reset_completed'
  | 'tier_upgraded'
  | 'tier_downgraded'
  | 'google_oauth_success'
  | 'google_oauth_failed';

interface AuthEventEnv {
  DB: D1Database;
}

interface AuthEventData {
  userId?: string;
  email?: string;
  eventType: AuthEventType;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Generate a unique request ID for tracing
 */
export function generateRequestId(): string {
  return `req_${Date.now().toString(36)}_${crypto.randomUUID().slice(0, 8)}`;
}

/**
 * Extract IP address from request
 */
export function getClientIP(request: Request): string {
  return (
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

/**
 * Log an authentication event to the database
 * Non-blocking - failures are logged but don't throw
 */
export async function logAuthEvent(
  data: AuthEventData,
  env: AuthEventEnv,
  request?: Request
): Promise<string> {
  const eventId = generateRequestId();

  try {
    const ipAddress = request ? getClientIP(request) : data.ipAddress || null;
    const userAgent = request ? request.headers.get('user-agent') : data.userAgent || null;

    await env.DB.prepare(
      `INSERT INTO auth_events (id, user_id, email, event_type, ip_address, user_agent, metadata)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        eventId,
        data.userId || null,
        data.email || null,
        data.eventType,
        ipAddress,
        userAgent,
        data.metadata ? JSON.stringify(data.metadata) : null
      )
      .run();
  } catch (error) {
    // Log to console but don't fail the request
    console.error('Failed to log auth event:', error);
  }

  return eventId;
}

/**
 * Get recent auth events for a user (for admin/debugging)
 */
export async function getRecentAuthEvents(
  userId: string,
  env: AuthEventEnv,
  limit = 50
): Promise<unknown[]> {
  try {
    const result = await env.DB.prepare(
      `SELECT id, event_type, ip_address, user_agent, metadata, created_at
       FROM auth_events
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT ?`
    )
      .bind(userId, limit)
      .all();

    return result.results || [];
  } catch (error) {
    console.error('Failed to fetch auth events:', error);
    return [];
  }
}

/**
 * Get auth events summary (for admin dashboard)
 */
export async function getAuthEventsSummary(
  env: AuthEventEnv,
  daysBack = 7
): Promise<{
  signups: number;
  logins: number;
  failures: number;
  lastEvent?: string;
}> {
  try {
    const cutoff = Math.floor(Date.now() / 1000) - daysBack * 86400;

    const result = await env.DB.prepare(
      `SELECT
         SUM(CASE WHEN event_type = 'signup_success' THEN 1 ELSE 0 END) as signups,
         SUM(CASE WHEN event_type = 'login_success' THEN 1 ELSE 0 END) as logins,
         SUM(CASE WHEN event_type IN ('signup_failed', 'login_failed') THEN 1 ELSE 0 END) as failures,
         MAX(created_at) as last_event
       FROM auth_events
       WHERE created_at > ?`
    )
      .bind(cutoff)
      .first<{
        signups: number;
        logins: number;
        failures: number;
        last_event: number | null;
      }>();

    return {
      signups: result?.signups || 0,
      logins: result?.logins || 0,
      failures: result?.failures || 0,
      lastEvent: result?.last_event ? new Date(result.last_event * 1000).toISOString() : undefined,
    };
  } catch (error) {
    console.error('Failed to fetch auth summary:', error);
    return { signups: 0, logins: 0, failures: 0 };
  }
}
