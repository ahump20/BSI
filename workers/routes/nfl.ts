/**
 * NFL API routes — /api/nfl/*
 * Mounted by the apex router at workers/index.ts
 */

import { Hono } from 'hono';
import type { Env } from '../shared/types';
import { safeESPN } from '../shared/helpers';
import {
  handleNFLScores,
  handleNFLStandings,
  handleNFLGame,
  handleNFLPlayer,
  handleNFLTeam,
  handleNFLTeamsList,
  handleNFLNews,
  handleNFLPlayers,
  handleNFLLeaders,
} from '../handlers/nfl';

const nfl = new Hono<{ Bindings: Env }>();

nfl.get('/scores', (c) => safeESPN(() => handleNFLScores(new URL(c.req.url), c.env), 'games', [], c.env));
nfl.get('/standings', (c) => safeESPN(() => handleNFLStandings(c.env), 'standings', [], c.env));
nfl.get('/news', (c) => safeESPN(() => handleNFLNews(c.env), 'articles', [], c.env));
nfl.get('/teams', (c) => safeESPN(() => handleNFLTeamsList(c.env), 'teams', [], c.env));
nfl.get('/players', (c) => safeESPN(() => handleNFLPlayers(new URL(c.req.url), c.env), 'players', [], c.env));
nfl.get('/leaders', (c) => safeESPN(() => handleNFLLeaders(c.env), 'categories', [], c.env));
nfl.get('/game/:gameId', (c) => safeESPN(() => handleNFLGame(c.req.param('gameId'), c.env), 'game', null, c.env));
nfl.get('/players/:playerId', (c) => safeESPN(() => handleNFLPlayer(c.req.param('playerId'), c.env), 'player', null, c.env));
nfl.get('/teams/:teamId', (c) => safeESPN(() => handleNFLTeam(c.req.param('teamId'), c.env), 'team', null, c.env));

export { nfl };
