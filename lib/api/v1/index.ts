/**
 * API v1 Barrel Exports
 *
 * Centralized export point for all API v1 handlers.
 * This enables clean imports in Next.js API routes:
 *
 * @example
 * ```typescript
 * import { getGames, getTeams, getPlayerById } from '@/lib/api/v1';
 * ```
 *
 * Instead of:
 * ```typescript
 * import { getGames } from '@/lib/api/v1/games';
 * import { getTeams } from '@/lib/api/v1/teams';
 * import { getPlayerById } from '@/lib/api/v1/players';
 * ```
 */

// ============================================================================
// Games API
// ============================================================================
export {
  getGames,
  getGameById,
  type GamesQueryParams,
  type GamesResponse,
  type GameDetailResponse,
} from './games';

// ============================================================================
// Teams API
// ============================================================================
export {
  getTeams,
  getTeamBySlug,
  type TeamsQueryParams,
  type TeamsResponse,
  type TeamDetailResponse,
} from './teams';

// ============================================================================
// Conferences API
// ============================================================================
export {
  getConferences,
  getConferenceBySlug,
  getConferenceStandings,
  type ConferencesQueryParams,
  type ConferencesResponse,
  type ConferenceDetailResponse,
  type StandingsQueryParams,
  type TeamStanding,
  type ConferenceStandingsResponse,
} from './conferences';

// ============================================================================
// Players API
// ============================================================================
export {
  getPlayerById,
  type PlayerDetailResponse,
} from './players';

// ============================================================================
// Rankings API
// ============================================================================
export {
  getRankings,
  getRankingsHistory,
  getCompositeRankings,
  type RankingsQueryParams,
  type RankingEntry,
  type RankingsResponse,
  type RankingsHistoryQueryParams,
  type RankingsHistoryEntry,
  type RankingsHistoryResponse,
} from './rankings';
