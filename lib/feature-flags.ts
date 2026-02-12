/**
 * Feature Flags — Simple runtime feature toggles.
 *
 * Uses environment variables to gate features in development vs production.
 */

export function isPresenceCoachEnabled(): boolean {
  return process.env.NEXT_PUBLIC_PRESENCE_COACH === 'true';
}
