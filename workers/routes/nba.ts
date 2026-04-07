/**
 * NBA API routes — /api/nba/*
 * Mounted by the apex router at workers/index.ts
 */

import { Hono } from 'hono';
import type { Env } from '../shared/types';
import { safeESPN } from '../shared/helpers';
import {
  handleNBAScores,
  handleNBAStandings,
  handleNBAGame,
  handleNBAPlayer,
  handleNBATeamFull,
  handleNBATeamsList,
  handleNBANews,
  handleNBALeaders,
} from '../handlers/nba';

const nba = new Hono<{ Bindings: Env }>();

nba.get('/scores', (c) => safeESPN(() => handleNBAScores(new URL(c.req.url), c.env), 'games', [], c.env));
nba.get('/scoreboard', (c) => safeESPN(() => handleNBAScores(new URL(c.req.url), c.env), 'games', [], c.env));
nba.get('/standings', (c) => safeESPN(() => handleNBAStandings(c.env), 'standings', [], c.env));
nba.get('/news', (c) => safeESPN(() => handleNBANews(c.env), 'articles', [], c.env));
nba.get('/teams', (c) => safeESPN(() => handleNBATeamsList(c.env), 'teams', [], c.env));
nba.get('/leaders', (c) => safeESPN(() => handleNBALeaders(c.env), 'categories', [], c.env));
nba.get('/game/:gameId', (c) => safeESPN(() => handleNBAGame(c.req.param('gameId'), c.env), 'game', null, c.env));
nba.get('/players/:playerId', (c) => safeESPN(() => handleNBAPlayer(c.req.param('playerId'), c.env), 'player', null, c.env));
nba.get('/teams/:teamId', (c) => safeESPN(() => handleNBATeamFull(c.req.param('teamId'), c.env), 'team', null, c.env));

export { nba };
