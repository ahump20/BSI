/**
 * PostHog Event Helpers — typed, centralized event tracking
 *
 * Usage: track.sportSelected('mlb')
 */
import { getPostHog } from './posthog';

function capture(event: string, properties?: Record<string, unknown>) {
  const ph = getPostHog();
  if (!ph) return;
  ph.capture(event, properties);
}

export const track = {
  sportSelected(sport: string) {
    capture('sport_selected', { sport });
  },

  gameViewed(gameId: string, sport: string) {
    capture('game_viewed', { game_id: gameId, sport });
  },

  searchPerformed(query: string, resultCount?: number) {
    capture('search_performed', { query, result_count: resultCount });
  },

  arcadeGamePlayed(gameName: string) {
    capture('arcade_game_played', { game_name: gameName });
  },
};

export function identifyUser(userId: string, properties?: { email?: string; name?: string }) {
  const ph = getPostHog();
  if (!ph) return;
  ph.identify(userId, properties);
}

export function resetUser() {
  const ph = getPostHog();
  if (!ph) return;
  ph.reset();
}
