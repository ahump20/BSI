/**
 * MLB API routes — /api/mlb/*
 * Mounted by the apex router at workers/index.ts
 */

import { Hono } from 'hono';
import type { Env } from '../shared/types';
import { safeESPN } from '../shared/helpers';
import {
  handleMLBScores,
  handleMLBStandings,
  handleMLBGame,
  handleMLBPlayer,
  handleMLBTeam,
  handleMLBTeamsList,
  handleMLBNews,
  handleMLBStatsLeaders,
  handleMLBLeaderboard,
  handleMLBSpringScores,
  handleMLBSpringStandings,
  handleMLBSpringSchedule,
  handleMLBSpringRoster,
  handleMLBAbs,
} from '../handlers/mlb';
import {
  handleShowSourceStatus,
  handleShowMarketOverview,
  handleShowCards,
  handleShowCardDetail,
  handleShowCardHistory,
  handleShowCollections,
  handleShowCollectionDetail,
  handleShowWatchEvents,
  handleShowTeamBuilderReference,
  handleShowBuildCreate,
  handleShowBuildGet,
} from '../handlers/mlb-the-show';

const mlb = new Hono<{ Bindings: Env }>();

// --- Core ---
mlb.get('/scores', (c) => safeESPN(() => handleMLBScores(new URL(c.req.url), c.env), 'games', [], c.env));
mlb.get('/standings', (c) => safeESPN(() => handleMLBStandings(c.env), 'standings', [], c.env));
mlb.get('/news', (c) => safeESPN(() => handleMLBNews(c.env), 'articles', [], c.env));
mlb.get('/stats', (c) => safeESPN(() => handleMLBStatsLeaders(new URL(c.req.url), c.env), 'leaders', [], c.env));
mlb.get('/stats/leaders', (c) => safeESPN(() => handleMLBStatsLeaders(new URL(c.req.url), c.env), 'leaders', [], c.env));
mlb.get('/leaderboards/:category', (c) => safeESPN(() => handleMLBLeaderboard(c.req.param('category'), new URL(c.req.url), c.env), 'data', [], c.env));
mlb.get('/teams', (c) => safeESPN(() => handleMLBTeamsList(c.env), 'teams', [], c.env));

// --- Spring Training ---
mlb.get('/spring-training/scores', (c) => safeESPN(() => handleMLBSpringScores(new URL(c.req.url), c.env), 'games', [], c.env));
mlb.get('/spring-training/standings', (c) => safeESPN(() => handleMLBSpringStandings(c.env), 'standings', {}, c.env));
mlb.get('/spring-training/schedule', (c) => safeESPN(() => handleMLBSpringSchedule(new URL(c.req.url), c.env), 'schedule', [], c.env));
mlb.get('/spring-training/roster/:teamKey', (c) => safeESPN(() => handleMLBSpringRoster(c.req.param('teamKey'), c.env), 'roster', [], c.env));

// --- ABS Challenge Tracker ---
mlb.get('/abs', (c) => handleMLBAbs(c.env));

// --- Detail ---
mlb.get('/game/:gameId', (c) => safeESPN(() => handleMLBGame(c.req.param('gameId'), c.env), 'game', null, c.env));
mlb.get('/players/:playerId', (c) => safeESPN(() => handleMLBPlayer(c.req.param('playerId'), c.env), 'player', null, c.env));
mlb.get('/teams/:teamId', (c) => safeESPN(() => handleMLBTeam(c.req.param('teamId'), c.env), 'team', null, c.env));

// --- MLB The Show 26 / Diamond Dynasty ---
mlb.get('/the-show-26/source-status', (c) => handleShowSourceStatus(c.env));
mlb.get('/the-show-26/market/overview', (c) => handleShowMarketOverview(c.env));
mlb.get('/the-show-26/cards', (c) => handleShowCards(new URL(c.req.url), c.env));
mlb.get('/the-show-26/cards/:cardId', (c) => handleShowCardDetail(c.req.param('cardId'), c.env));
mlb.get('/the-show-26/cards/:cardId/history', (c) => handleShowCardHistory(c.req.param('cardId'), new URL(c.req.url), c.env));
mlb.get('/the-show-26/collections', (c) => handleShowCollections(c.env));
mlb.get('/the-show-26/collections/:collectionId', (c) => handleShowCollectionDetail(c.req.param('collectionId'), new URL(c.req.url), c.env));
mlb.get('/the-show-26/watch-events', (c) => handleShowWatchEvents(new URL(c.req.url), c.env));
mlb.get('/the-show-26/team-builder/reference', (c) => handleShowTeamBuilderReference(c.env));
mlb.post('/the-show-26/builds', (c) => handleShowBuildCreate(c.req.raw, c.env));
mlb.get('/the-show-26/builds/:buildId', (c) => handleShowBuildGet(c.req.param('buildId'), c.env));

export { mlb };
