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
