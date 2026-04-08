/**
 * College Baseball API routes — /api/college-baseball/*
 * Mounted by the apex router at workers/index.ts
 */

import { Hono } from 'hono';
import type { Env } from '../shared/types';
import { safeESPN } from '../shared/helpers';
import { requireApiKey } from '../shared/auth';
import {
  handleCollegeBaseballScores,
  handleCollegeBaseballStandings,
  handleCollegeBaseballRankings,
  handleCollegeBaseballTeam,
  handleCollegeBaseballPlayer,
  handleCollegeBaseballGame,
  handleCollegeBaseballSchedule,
  handleCollegeBaseballTrending,
  handleCollegeBaseballDaily,
  handleCollegeBaseballNews,
  handleCollegeBaseballPlayersList,
  handleCollegeBaseballTransferPortal,
  handlePortalPlayerDetail,
  handleCollegeBaseballEditorialList,
  handleCollegeBaseballEditorialContent,
  handleCollegeBaseballNewsEnhanced,
  handleCollegeBaseballPlayerCompare,
  handlePlayerGameLog,
  handleCollegeBaseballTrends,
  handleCollegeBaseballTeamSchedule,
  handleCollegeBaseballTeamsAll,
  handleCollegeBaseballLeaders,
  handleIngestStats,
  handleCBBLeagueSabermetrics,
  handleCBBTeamSabermetrics,
  handleCBBTeamSOS,
  handleCBBConferencePowerIndex,
  handleCBBSeasonArc,
  handleCBBBulkSync,
  handleHighlightlySync,
  handleGameLogBackfill,
  handleSocialIntelFeed,
  handleSocialIntelTeam,
} from '../handlers/college-baseball';
import { handleScoutingReport } from '../handlers/scouting';
import { handlePowerRankings } from '../handlers/college-baseball/power-rankings';
import { handleWeeklyPulse } from '../handlers/weekly-pulse';
import {
  handleTexasIntelVideos,
  handleTexasIntelNews,
  handleTexasIntelDigest,
  handleTexasPlayerProfile,
  handleTexasOpponentScout,
  handleTexasGameAnalysisGenerate,
  handleTexasGameAnalyses,
  handleTexasPitchingStaff,
  handleTexasScheduleHeatMap,
  handleTexasMatchup,
  handleTexasDraftBoard,
  handleTexasPortalIntel,
  handleTexasTrends,
} from '../handlers/texas-intel';

const cbb = new Hono<{ Bindings: Env }>();

// --- Core ---
cbb.get('/scores', (c) => {
  let ctx: ExecutionContext | undefined;
  try { ctx = c.executionCtx; } catch { /* test env */ }
  return handleCollegeBaseballScores(new URL(c.req.url), c.env, ctx);
});
cbb.get('/standings', (c) => {
  let ctx: ExecutionContext | undefined;
  try { ctx = c.executionCtx; } catch { /* test env */ }
  return handleCollegeBaseballStandings(new URL(c.req.url), c.env, ctx);
});
cbb.get('/rankings', (c) => handleCollegeBaseballRankings(c.env));
cbb.get('/power-rankings', (c) => handlePowerRankings(new URL(c.req.url), c.env));
cbb.get('/leaders', (c) => handleCollegeBaseballLeaders(c.env));
cbb.get('/schedule', (c) => handleCollegeBaseballSchedule(new URL(c.req.url), c.env));
cbb.get('/trending', (c) => handleCollegeBaseballTrending(c.env));
cbb.get('/news', (c) => handleCollegeBaseballNews(c.env));
cbb.get('/news/enhanced', (c) => handleCollegeBaseballNewsEnhanced(c.env));
cbb.get('/players', (c) => handleCollegeBaseballPlayersList(new URL(c.req.url), c.env));
cbb.get('/transfer-portal', (c) => handleCollegeBaseballTransferPortal(c.env));
cbb.get('/daily', (c) => handleCollegeBaseballDaily(new URL(c.req.url), c.env));
cbb.get('/sabermetrics', (c) => handleCBBLeagueSabermetrics(c.env));
cbb.get('/weekly-pulse', (c) => handleWeeklyPulse(c.env));
cbb.get('/social-intel', (c) => handleSocialIntelFeed(c.env));

// --- Ingest / Sync ---
cbb.get('/ingest-stats', (c) => {
  const url = new URL(c.req.url);
  return handleIngestStats(c.env, url.searchParams.get('date') || undefined);
});
cbb.get('/sync-stats', (c) => handleCBBBulkSync(new URL(c.req.url), c.env));
cbb.get('/sync-highlightly', (c) => handleHighlightlySync(new URL(c.req.url), c.env));
cbb.get('/backfill-game-log', (c) => handleGameLogBackfill(new URL(c.req.url), c.env));

// --- Teams ---
cbb.get('/teams/all', (c) => handleCollegeBaseballTeamsAll(c.env));
cbb.get('/teams/:teamId/schedule', (c) => handleCollegeBaseballTeamSchedule(c.req.param('teamId'), c.env));
cbb.get('/teams/:teamId/sabermetrics', (c) => handleCBBTeamSabermetrics(c.req.param('teamId'), c.env));
cbb.get('/teams/:teamId/sos', (c) => handleCBBTeamSOS(c.req.param('teamId'), c.env));
cbb.get('/teams/:teamId/season-arc', (c) => handleCBBSeasonArc(c.req.param('teamId'), new URL(c.req.url), c.env));
cbb.get('/teams/:teamId', (c) => {
  let ctx: ExecutionContext | undefined;
  try { ctx = c.executionCtx; } catch { /* test env */ }
  return handleCollegeBaseballTeam(c.req.param('teamId'), c.env, ctx);
});

// --- Conferences ---
cbb.get('/conferences/:conf/power-index', (c) => handleCBBConferencePowerIndex(c.req.param('conf'), c.env));

// --- Players ---
cbb.get('/players/compare/:p1/:p2', (c) => handleCollegeBaseballPlayerCompare(c.req.param('p1'), c.req.param('p2'), c.env));
cbb.get('/players/:playerId/game-log', (c) => handlePlayerGameLog(c.req.param('playerId'), c.env));
cbb.get('/players/:playerId/scouting-report', (c) => handleScoutingReport(c.req.param('playerId'), c.req.raw, c.env));
cbb.get('/players/:playerId', (c) => handleCollegeBaseballPlayer(c.req.param('playerId'), c.env));

// --- Games ---
cbb.get('/game/:gameId', (c) => handleCollegeBaseballGame(c.req.param('gameId'), c.env));
cbb.get('/games/:gameId', (c) => handleCollegeBaseballGame(c.req.param('gameId'), c.env));

// --- Trends ---
cbb.get('/trends/:teamId', (c) => handleCollegeBaseballTrends(c.req.param('teamId'), c.env));

// --- Editorial ---
cbb.get('/editorial/list', (c) => handleCollegeBaseballEditorialList(c.env));
cbb.get('/editorial/daily/:date', (c) => handleCollegeBaseballEditorialContent(c.req.param('date'), c.env));

// --- Social Intel ---
cbb.get('/social-intel/team/:teamId', (c) => handleSocialIntelTeam(c.req.param('teamId'), c.env));

// --- Texas Intelligence ---
cbb.get('/texas-intelligence/videos', (c) => handleTexasIntelVideos(c.env));
cbb.get('/texas-intelligence/news', (c) => handleTexasIntelNews(c.env));
cbb.get('/texas-intelligence/digest', (c) => handleTexasIntelDigest(c.env));
cbb.get('/texas-intelligence/pitching', (c) => handleTexasPitchingStaff(c.env));
cbb.get('/texas-intelligence/schedule', (c) => handleTexasScheduleHeatMap(c.env));
cbb.get('/texas-intelligence/draft', (c) => handleTexasDraftBoard(c.env));
cbb.get('/texas-intelligence/portal', (c) => handleTexasPortalIntel(c.env));
cbb.get('/texas-intelligence/trends', (c) => handleTexasTrends(c.env));
cbb.get('/texas-intelligence/game-analyses', (c) => handleTexasGameAnalyses(c.env));
cbb.get('/texas-intelligence/game-analysis/:gameId', (c) => handleTexasGameAnalysisGenerate(c.env, c.req.param('gameId')));
cbb.get('/texas-intelligence/players/:playerId', (c) => handleTexasPlayerProfile(c.env, c.req.param('playerId')));
cbb.get('/texas-intelligence/scouting/:opponentId', (c) => handleTexasOpponentScout(c.env, c.req.param('opponentId')));
cbb.get('/texas-intelligence/matchup/:opponentId', (c) => handleTexasMatchup(c.env, c.req.param('opponentId')));

// --- WebSocket stub ---
cbb.get('/scores/ws', (c) => {
  if (c.req.header('Upgrade') !== 'websocket') {
    return c.json({ error: 'Expected websocket upgrade' }, 400);
  }
  return c.json({ error: 'WebSocket scores available at bsi-live-scores worker', redirect: true }, 501);
});

export { cbb };
