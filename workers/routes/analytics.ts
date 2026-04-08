/**
 * Analytics, Savant, NIL, and CV routes — /api/analytics/*, /api/savant/*, /api/nil/*, /api/cv/*
 * Mounted by the apex router at workers/index.ts
 */

import { Hono } from 'hono';
import type { Env } from '../shared/types';
import { requireApiKey } from '../shared/auth';
import {
  handleHAVFLeaderboard,
  handleHAVFPlayer,
  handleHAVFCompare,
  handleHAVFCompute,
  handleMMILive,
  handleMMIGame,
  handleMMITrending,
  handleMMITeam,
  handleWinProbExample,
  handleMonteCarloExample,
} from '../handlers/analytics';
import {
  handleSavantBattingLeaderboard,
  handleSavantPitchingLeaderboard,
  handleSavantPlayer,
  handleSavantParkFactors,
  handleSavantConferenceStrength,
  handleSavantExport,
  handleSavantPlayerDirectory,
} from '../handlers/savant';
import { handleLeagueContext } from '../handlers/college-baseball';
import {
  handleNILLeaderboard,
  handleNILPlayer,
  handleNILComparables,
  handleNILUndervalued,
  handleNILTrends,
  handleWARToNIL,
  handleNILCollectiveROI,
  handleNILDraftLeverage,
} from '../handlers/nil';

// --- Analytics: HAV-F ---
const analytics = new Hono<{ Bindings: Env }>();
analytics.get('/havf/leaderboard', (c) => handleHAVFLeaderboard(new URL(c.req.url), c.env));
analytics.get('/havf/player/:id', (c) => handleHAVFPlayer(c.req.param('id'), c.env));
analytics.get('/havf/compare/:p1/:p2', (c) => handleHAVFCompare(c.req.param('p1'), c.req.param('p2'), c.env));
analytics.post('/havf/compute', requireApiKey, (c) => handleHAVFCompute(c.req.raw, c.env));
analytics.get('/mmi/live/:gameId', (c) => handleMMILive(c.req.param('gameId'), c.env));
analytics.get('/mmi/game/:gameId', (c) => handleMMIGame(c.req.param('gameId'), c.env));
analytics.get('/mmi/trending', (c) => handleMMITrending(c.env));
analytics.get('/mmi/team/:teamId', (c) => handleMMITeam(c.req.param('teamId'), c.env));
export { analytics };

// --- Savant ---
const savant = new Hono<{ Bindings: Env }>();
savant.get('/batting/leaderboard', (c) => handleSavantBattingLeaderboard(new URL(c.req.url), c.env, c.req.raw.headers));
savant.get('/pitching/leaderboard', (c) => handleSavantPitchingLeaderboard(new URL(c.req.url), c.env, c.req.raw.headers));
savant.get('/player/:id', (c) => handleSavantPlayer(c.req.param('id'), new URL(c.req.url), c.env, c.req.raw.headers));
savant.get('/park-factors', (c) => handleSavantParkFactors(new URL(c.req.url), c.env, c.req.raw.headers));
savant.get('/conference-strength', (c) => handleSavantConferenceStrength(new URL(c.req.url), c.env, c.req.raw.headers));
savant.get('/batting/export', (c) => handleSavantExport('batting', new URL(c.req.url), c.env, c.req.raw.headers));
savant.get('/pitching/export', (c) => handleSavantExport('pitching', new URL(c.req.url), c.env, c.req.raw.headers));
savant.get('/league-context', (c) => handleLeagueContext(c.env));
savant.get('/directory', (c) => handleSavantPlayerDirectory(new URL(c.req.url), c.env, c.req.raw.headers));
export { savant };

// --- NIL ---
const nil = new Hono<{ Bindings: Env }>();
nil.get('/leaderboard', (c) => handleNILLeaderboard(new URL(c.req.url), c.env, c.req.raw.headers));
nil.get('/player/:id', (c) => handleNILPlayer(c.req.param('id'), new URL(c.req.url), c.env, c.req.raw.headers));
nil.get('/comparables/:id', (c) => handleNILComparables(c.req.param('id'), new URL(c.req.url), c.env, c.req.raw.headers));
nil.get('/undervalued', (c) => handleNILUndervalued(new URL(c.req.url), c.env, c.req.raw.headers));
nil.get('/trends', (c) => handleNILTrends(new URL(c.req.url), c.env, c.req.raw.headers));
nil.get('/war-to-nil', (c) => handleWARToNIL(new URL(c.req.url)));
nil.get('/collective-roi', (c) => handleNILCollectiveROI(new URL(c.req.url), c.env, c.req.raw.headers));
nil.get('/draft-leverage', (c) => handleNILDraftLeverage(new URL(c.req.url), c.env, c.req.raw.headers));
export { nil };


// --- Model Examples ---
const models = new Hono<{ Bindings: Env }>();
models.get('/win-probability/example', (c) => handleWinProbExample(c.env));
models.get('/monte-carlo/example', (c) => handleMonteCarloExample(c.env));
export { models };
