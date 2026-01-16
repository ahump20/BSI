/**
 * College Baseball API Clients
 *
 * Multi-source API integration for BlazeSportsIntel.com college baseball data pipeline.
 *
 * Priority Matrix:
 * 1. NCAA API (henrygd/ncaa-api) - Free D1 real-time scores/stats
 * 2. Highlightly API (RapidAPI) - Production D1 with SLA
 * 3. ESPN API (Unofficial) - MVP/backup only (risk of breaking)
 *
 * @author BSI Team
 * @created 2025-01-16
 */

// NCAA API Client (Priority 1 - Free)
export {
  NCAAApiClient,
  createNCAAApiClient,
  type NCAAApiConfig,
  type NCAAGame,
  type NCAATeamScore,
  type NCAAScoreboardResponse,
  type NCAATeamStat,
  type NCAAPlayerStat,
  type NCAAStatsResponse,
  type NCAAStandingsTeam,
  type NCAAStandingsResponse,
  type NCAATeamRanking,
  type NCAAWeeklyRanking,
  type NCAASeasonRankings,
  type NCAABoxScore,
  type NCAABoxScoreTeam,
  type NCAABattingStats,
  type NCAPitchingStats,
  type NCAAFieldingStats,
  type NCAAPlay,
  type NCAAScheduleGame,
  type NCAAScheduleResponse,
  type NCAAApiResponse,
} from './ncaa-api';

// Highlightly API Client (Priority 2 - Paid with SLA)
export {
  HighlightlyApiClient,
  createHighlightlyApiClient,
  type HighlightlyApiConfig,
  type HighlightlyMatch,
  type HighlightlyMatchStatus,
  type HighlightlyTeam,
  type HighlightlyConference,
  type HighlightlyTournament,
  type HighlightlyVenue,
  type HighlightlyWeather,
  type HighlightlyInning,
  type HighlightlyPlayer,
  type HighlightlyPlayerStats,
  type HighlightlyBoxScore,
  type HighlightlyBoxScoreTeam,
  type HighlightlyBattingLine,
  type HighlightlyPitchingLine,
  type HighlightlyPlay,
  type HighlightlyLineup,
  type HighlightlyLineupEntry,
  type HighlightlyStandings,
  type HighlightlyStandingsTeam,
  type HighlightlyOdds,
  type HighlightlyPaginatedResponse,
  type HighlightlyApiResponse,
} from './highlightly-api';

// ESPN API Client (Priority 4 - MVP/backup only)
export {
  ESPNApiClient,
  createESPNApiClient,
  type ESPNApiConfig,
  type ESPNScoreboardResponse,
  type ESPNLeague,
  type ESPNSeason,
  type ESPNWeek,
  type ESPNEvent,
  type ESPNCompetition,
  type ESPNVenue,
  type ESPNCompetitor,
  type ESPNTeam,
  type ESPNLogo,
  type ESPNLink,
  type ESPNStatistic,
  type ESPNRecord,
  type ESPNBroadcast,
  type ESPNStatus,
  type ESPNSituation,
  type ESPNAthlete,
  type ESPNTeamsResponse,
  type ESPNTeamDetailsResponse,
  type ESPNStandingsResponse,
  type ESPNConferenceStandings,
  type ESPNStandingsEntry,
  type ESPNStandingsStatistic,
  type ESPNRankingsResponse,
  type ESPNRankingPoll,
  type ESPNRankedTeam,
  type ESPNGameSummaryResponse,
  type ESPNBoxscore,
  type ESPNBoxscoreTeam,
  type ESPNBoxscorePlayer,
  type ESPNPlay,
  type ESPNApiResponse,
} from './espn-api';
