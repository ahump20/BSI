/**
 * CFB (College Football) API routes — /api/cfb/*
 * Mounted by the apex router at workers/index.ts
 */

import { Hono } from 'hono';
import type { Env } from '../shared/types';
import { safeESPN } from '../shared/helpers';
import {
  handleCFBTransferPortal,
  handleCFBScores,
  handleCFBStandings,
  handleCFBRankings,
  handleCFBNews,
  handleCFBArticle,
  handleCFBArticlesList,
  handleCFBTeamsList,
  handleCFBTeam,
  handleCFBGame,
  handleCFBPlayer,
} from '../handlers/cfb';

const cfb = new Hono<{ Bindings: Env }>();

cfb.get('/transfer-portal', (c) => handleCFBTransferPortal(c.env));
cfb.get('/scores', (c) => safeESPN(() => handleCFBScores(new URL(c.req.url), c.env), 'games', [], c.env));
cfb.get('/standings', (c) => safeESPN(() => handleCFBStandings(c.env), 'standings', [], c.env));
cfb.get('/rankings', (c) => safeESPN(() => handleCFBRankings(c.env), 'rankings', [], c.env));
cfb.get('/news', (c) => safeESPN(() => handleCFBNews(c.env), 'articles', [], c.env));
cfb.get('/teams', (c) => safeESPN(() => handleCFBTeamsList(c.env), 'teams', [], c.env));
cfb.get('/game/:gameId', (c) => safeESPN(() => handleCFBGame(c.req.param('gameId'), c.env), 'game', null, c.env));
cfb.get('/players/:playerId', (c) => safeESPN(() => handleCFBPlayer(c.req.param('playerId'), c.env), 'player', null, c.env));
cfb.get('/teams/:teamId', (c) => safeESPN(() => handleCFBTeam(c.req.param('teamId'), c.env), 'team', null, c.env));

export { cfb };

// --- College Football editorial (served under /api/college-football/*) ---
const cfbEditorial = new Hono<{ Bindings: Env }>();
cfbEditorial.get('/articles', (c) => handleCFBArticlesList(new URL(c.req.url), c.env));
cfbEditorial.get('/articles/:slug', (c) => handleCFBArticle(c.req.param('slug'), c.env));
export { cfbEditorial };
