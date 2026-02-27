/**
 * College Baseball — barrel re-exports.
 *
 * workers/index.ts imports from './handlers/college-baseball' which resolves
 * to this file. No import changes needed in the router.
 */

// Transforms (used by other handlers, sometimes directly by tests)
export { transformHighlightlyTeam, transformEspnTeam, transformCollegeBaseballTeamDetail, transformHighlightlyPlayer, transformEspnPlayer, transformHighlightlyGame, transformEspnGameSummary } from './transforms';

// Scores, game detail, schedule
export { handleCollegeBaseballScores, handleCollegeBaseballGame, handleCollegeBaseballSchedule } from './scores';

// Standings, rankings, leaders
export { handleCollegeBaseballStandings, handleCollegeBaseballRankings, handleCollegeBaseballLeaders } from './standings';

// Teams
export { handleCollegeBaseballTeam, handleCollegeBaseballTeamSchedule, handleCollegeBaseballTrends, handleCollegeBaseballTeamsAll } from './teams';

// Players
export { handleCollegeBaseballPlayer, handleCollegeBaseballPlayersList, handleCollegeBaseballPlayerCompare, handlePlayerGameLog } from './players';

// Editorial, news, trending
export { handleCollegeBaseballTrending, handleCollegeBaseballDaily, handleCollegeBaseballNews, handleCollegeBaseballNewsEnhanced, handleCollegeBaseballTransferPortal, handleCollegeBaseballEditorialList, handleCollegeBaseballEditorialContent } from './editorial';

// Ingestion pipeline
export { processFinishedGames, handleIngestStats, syncTeamCumulativeStats, handleCBBBulkSync, handleHighlightlySync, handleGameLogBackfill } from './ingest';

// Sabermetrics
export { handleCBBLeagueSabermetrics, handleCBBTeamSabermetrics, handleCBBTeamSOS, handleCBBConferencePowerIndex } from './savant';
