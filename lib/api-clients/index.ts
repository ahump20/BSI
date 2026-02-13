/**
 * BSI API Clients — barrel export
 */
export { HighlightlyApiClient, createHighlightlyClient } from './highlightly-api';
export type {
  HighlightlyApiConfig,
  HighlightlyApiResponse,
  HighlightlyMatch,
  HighlightlyMatchStatus,
  HighlightlyTeamDetail,
  HighlightlyConference,
  HighlightlyVenue,
  HighlightlyInning,
  HighlightlyPlayer,
  HighlightlyPlayerStats,
  HighlightlyBoxScore,
  HighlightlyBoxScoreTeam,
  HighlightlyBattingLine,
  HighlightlyPitchingLine,
  HighlightlyPlay,
  HighlightlyStandings,
  HighlightlyStandingsTeam,
  HighlightlyPaginatedResponse,
} from './highlightly-api';

export { HighlightlyAdapter } from './highlightly-adapter';
export type {
  HighlightlySport,
  GameStatus,
  HighlightlyConfig,
  HighlightlyGame,
  HighlightlyTeam,
  HighlightlyStanding,
  HighlightlyRanking,
  HighlightlyResponse,
} from './highlightly-adapter';

// ─── Sportradar ABS Client ─────────────────────────────────────────────────
export { SportradarABSClient, createSportradarABSClient } from './sportradar-abs';
export type {
  SportradarABSConfig,
  SportradarABSResponse,
  ABSChallenge,
  ABSGameSummary,
  ABSRoleStats,
  ABSUmpireAccuracy,
  ABSSeasonAggregates,
  ChallengeRole,
  ChallengeOutcome,
} from './sportradar-abs';

// ─── SkillCorner Broadcast Tracking Client ──────────────────────────────────
export { SkillCornerClient, createSkillCornerClient } from './skillcorner';
export type {
  SkillCornerConfig,
  SkillCornerResponse,
  MatchTrackingSummary,
  TeamTrackingData,
  PlayerTrackingData,
  PlayerSpeedProfile,
} from './skillcorner';

// ─── PitcherNet / Biomechanics Client ───────────────────────────────────────
export { BiomechanicsClient, createBiomechanicsClient } from './pitchernet-biomechanics';
export type {
  BiomechanicsConfig,
  BiomechanicsProfile,
  BiomechanicsResponse,
  PitchBiomechanics,
} from './pitchernet-biomechanics';
export { MLB_BENCHMARKS, D1_BENCHMARKS } from './pitchernet-biomechanics';

// ─── Driveline Open Biomechanics (real data, no key required) ──────────────
export {
  fetchDrivelineData,
  computeDrivelineBenchmarks,
  getDrivelinePitcherSession,
  getDrivelineSessions,
  drivelineSessionToProfile,
} from './driveline-biomechanics';
export type { DrivelineBenchmarks } from './driveline-biomechanics';

// ─── Baseball Savant / Statcast CSV (public, no key required) ──────────────
export {
  fetchStatcastPitches,
  fetchPitcherStatcast,
  fetchStatcastLeaderboard,
} from './baseball-savant';
export type {
  StatcastPitch,
  StatcastPitcherSummary,
  SavantLeaderEntry,
  SavantResponse,
} from './baseball-savant';

// ─── SkillCorner Open Data (real tracking, no key required) ────────────────
export {
  fetchOpenMatchTracking,
  fetchMatchInfo,
  fetchTrackingData,
  getAvailableMatches,
  AVAILABLE_MATCHES,
} from './skillcorner-opendata';
