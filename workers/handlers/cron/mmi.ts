/**
 * MMI (Momentum Magnitude Index) computation for finished college baseball games.
 *
 * Uses Highlightly play-by-play when available, falls back to per-inning data
 * or ESPN linescore. Writes snapshots + game summaries to D1.
 */

import type { Env } from '../../shared/types';
import { getHighlightlyClient } from '../../shared/helpers';
import {
  computeMMI,
  computeGameSummary,
  type MMIInput,
  type InningScore,
  type MMISnapshot,
} from '../../../lib/analytics/mmi';
import type {
  HighlightlyMatch,
  HighlightlyPlay,
  HighlightlyInning,
} from '../../../lib/api-clients/highlightly-api';

/** Today's date in YYYY-MM-DD format (America/Chicago). */
function todayCST(): string {
  return new Date().toLocaleString('en-CA', { timeZone: 'America/Chicago' }).split(',')[0];
}

/** Build cumulative inning scores from a Highlightly innings array. */
function buildCumulativeInnings(innings: HighlightlyInning[]): InningScore[] {
  return innings.map((inn) => ({
    inning: inn.inning,
    homeRuns: inn.homeRuns,
    awayRuns: inn.awayRuns,
  }));
}

/** Derive recent completed innings relative to the current inning. */
function deriveRecentInnings(innings: InningScore[], currentInning: number): InningScore[] {
  return innings.filter((inn) => inn.inning < currentInning).slice(-2);
}

/** Convert a Highlightly play to an MMIInput. */
function playToMMIInput(gameId: string, play: HighlightlyPlay, innings: InningScore[]): MMIInput {
  return {
    gameId,
    inning: play.inning,
    inningHalf: play.half,
    outs: play.outs,
    homeScore: play.homeScore,
    awayScore: play.awayScore,
    runnersOn: [
      play.bases?.first ?? false,
      play.bases?.second ?? false,
      play.bases?.third ?? false,
    ],
    recentInnings: deriveRecentInnings(innings, play.inning),
  };
}

/** Convert a Highlightly inning entry to an end-of-inning MMIInput (fallback). */
function inningToMMIInput(
  gameId: string,
  innings: InningScore[],
  index: number,
): MMIInput {
  // Accumulate scores through this inning
  let cumulativeHome = 0;
  let cumulativeAway = 0;
  for (let i = 0; i <= index; i++) {
    cumulativeHome += innings[i].homeRuns;
    cumulativeAway += innings[i].awayRuns;
  }

  return {
    gameId,
    inning: innings[index].inning,
    inningHalf: 'bottom',
    outs: 3,
    homeScore: cumulativeHome,
    awayScore: cumulativeAway,
    runnersOn: [false, false, false],
    recentInnings: innings.slice(Math.max(0, index - 1), index + 1),
  };
}

/**
 * Compute MMI for finished games and write snapshots + summaries to D1.
 * Uses Highlightly play-by-play when available, falls back to per-inning data.
 */
export async function computeAndStoreMMI(env: Env): Promise<{ processed: number; errors: string[] }> {
  const hlClient = getHighlightlyClient(env);
  if (!hlClient) return { processed: 0, errors: ['No Highlightly API key'] };

  const date = todayCST();
  const matchesResult = await hlClient.getMatches('NCAA', date);

  if (!matchesResult.success || !matchesResult.data) {
    return { processed: 0, errors: [matchesResult.error || 'Failed to fetch matches'] };
  }

  const finishedGames = matchesResult.data.data.filter(
    (m: HighlightlyMatch) => m.status.type === 'finished',
  );

  if (finishedGames.length === 0) {
    return { processed: 0, errors: [] };
  }

  let processed = 0;
  const errors: string[] = [];

  for (const game of finishedGames) {
    const gameId = String(game.id);

    try {
      // Check if we already computed MMI for this game
      const existing = await env.DB.prepare(
        'SELECT game_id FROM mmi_game_summary WHERE game_id = ?',
      ).bind(gameId).first();

      if (existing) continue; // Already processed

      const boxResult = await hlClient.getBoxScore(game.id);
      if (!boxResult.success || !boxResult.data) {
        errors.push(`Box score fetch failed for game ${gameId}`);
        continue;
      }

      const box = boxResult.data;
      const innings = buildCumulativeInnings(box.linescores || []);
      let snapshots: MMISnapshot[];

      if (box.plays && box.plays.length > 0) {
        // Source A: play-by-play (max granularity)
        snapshots = box.plays.map((play: HighlightlyPlay) =>
          computeMMI(playToMMIInput(gameId, play, innings)),
        );
      } else if (innings.length > 0) {
        // Source B: per-inning linescore (fallback)
        snapshots = innings.map((_inn: InningScore, i: number) =>
          computeMMI(inningToMMIInput(gameId, innings, i)),
        );
      } else {
        continue; // No data to compute from
      }

      if (snapshots.length === 0) continue;

      const summary = computeGameSummary(gameId, snapshots);

      // Write snapshots to D1
      const snapshotStmt = env.DB.prepare(
        `INSERT INTO mmi_snapshots
         (game_id, league, inning, inning_half, outs, home_score, away_score,
          mmi_value, sd_component, rs_component, gp_component, bs_component,
          runners_on, computed_at)
         VALUES (?, 'college-baseball', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      );

      // Batch in chunks of 50 to stay within D1 batch limits
      const CHUNK = 50;
      for (let i = 0; i < snapshots.length; i += CHUNK) {
        const chunk = snapshots.slice(i, i + CHUNK);
        const batch = chunk.map((snap: MMISnapshot, idx: number) => {
          // Reconstruct inning info from original inputs where possible
          const inputIdx = i + idx;
          const play = box.plays?.[inputIdx];
          const inning = play?.inning ?? (innings[inputIdx]?.inning ?? 1);
          const half = play?.half ?? 'bottom';
          const outs = play?.outs ?? 3;
          const homeScore = play?.homeScore ?? game.homeScore;
          const awayScore = play?.awayScore ?? game.awayScore;
          const runners = play?.bases
            ? [play.bases.first, play.bases.second, play.bases.third].filter(Boolean).map((_, ri) => ri + 1).join(',')
            : null;

          return snapshotStmt.bind(
            gameId, inning, half, outs, homeScore, awayScore,
            snap.value, snap.components.sd, snap.components.rs,
            snap.components.gp, snap.components.bs,
            runners, snap.meta.computed_at,
          );
        });
        await env.DB.batch(batch);
      }

      // Upsert game summary
      await env.DB.prepare(
        `INSERT OR REPLACE INTO mmi_game_summary
         (game_id, league, game_date, home_team, away_team,
          final_home_score, final_away_score,
          max_mmi, min_mmi, avg_mmi, mmi_volatility,
          lead_changes, max_swing, swing_inning,
          excitement_rating, computed_at)
         VALUES (?, 'college-baseball', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).bind(
        gameId, date,
        game.homeTeam?.name || 'Unknown',
        game.awayTeam?.name || 'Unknown',
        game.homeScore, game.awayScore,
        summary.maxMmi, summary.minMmi, summary.avgMmi, summary.volatility,
        summary.leadChanges, summary.maxSwing, summary.swingInning,
        summary.excitementRating,
        new Date().toISOString(),
      ).run();

      processed++;
    } catch (err) {
      errors.push(`Game ${gameId}: ${err instanceof Error ? err.message : 'unknown'}`);
    }
  }

  return { processed, errors };
}

/**
 * Extract inning-by-inning run totals from an ESPN game summary.
 * Returns [{home: N, away: N}, ...] for each inning, or null if linescore is absent.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractLinescore(summary: any): Array<{ home: number; away: number }> | null {
  // ESPN format: header.competitions[0].competitors[].linescores[{value}]
  const comps = summary?.header?.competitions?.[0]?.competitors
    ?? summary?.competitions?.[0]?.competitors
    ?? [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const home = comps.find((c: any) => c.homeAway === 'home');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const away = comps.find((c: any) => c.homeAway === 'away');

  if (!home?.linescores?.length || !away?.linescores?.length) return null;

  const innings = Math.min(home.linescores.length, away.linescores.length);
  if (innings === 0) return null;

  const result: Array<{ home: number; away: number }> = [];
  for (let i = 0; i < innings; i++) {
    result.push({
      home: Number(home.linescores[i]?.value ?? 0),
      away: Number(away.linescores[i]?.value ?? 0),
    });
  }

  return result;
}

/**
 * Compute MMI snapshots for recently finished games that don't have momentum data yet.
 * Reads linescore from ESPN game summaries archived in R2 (or re-fetches if missing),
 * reconstructs game state inning by inning, and writes snapshots + summary to D1.
 */
export async function computeMMIForNewGames(env: Env, date: string): Promise<number> {
  if (!env.DB) return 0;

  // Find recently processed games that lack MMI summaries (look back 7 days)
  const { results: unprocessed } = await env.DB.prepare(
    `SELECT pg.game_id, pg.home_team, pg.away_team, pg.home_score, pg.away_score, pg.game_date
     FROM processed_games pg
     LEFT JOIN mmi_game_summary ms ON pg.game_id = ms.game_id
     WHERE pg.game_date >= date(?, '-7 days') AND ms.game_id IS NULL
     LIMIT 20`
  ).bind(date).all<{
    game_id: string; home_team: string; away_team: string;
    home_score: number; away_score: number; game_date: string;
  }>();

  if (!unprocessed || unprocessed.length === 0) return 0;

  let computed = 0;

  for (const game of unprocessed) {
    try {
      // Try to read linescore from R2 archive first, fall back to live fetch
      let linescore: Array<{ home: number; away: number }> | null = null;

      if (env.DATA_LAKE) {
        try {
          const r2Key = `espn/college-baseball/games/${game.game_id}/${date}.json`;
          const obj = await env.DATA_LAKE.get(r2Key);
          if (obj) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const archived = JSON.parse(await obj.text()) as any;
            linescore = extractLinescore(archived);
          }
        } catch {
          // R2 read failed — will try live fetch below
        }
      }

      if (!linescore) {
        // Fetch fresh from ESPN
        try {
          const url = `https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball/summary?event=${game.game_id}`;
          const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
          if (res.ok) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const data = await res.json() as any;
            linescore = extractLinescore(data);
          }
        } catch {
          // ESPN fetch failed — skip this game
        }
      }

      if (!linescore || linescore.length === 0) continue;

      // Reconstruct game state inning-by-inning and compute MMI at each point
      const snapshots = [];
      let homeRunning = 0;
      let awayRunning = 0;
      const totalInnings = linescore.length;

      for (let inn = 0; inn < totalInnings; inn++) {
        const { home: homeRuns, away: awayRuns } = linescore[inn];

        // Top of inning — away scores
        awayRunning += awayRuns;
        const recentTop: InningScore[] = [];
        for (let r = Math.max(0, inn - 1); r <= inn; r++) {
          recentTop.push({
            inning: r + 1,
            homeRuns: r < inn ? linescore[r].home : 0,
            awayRuns: linescore[r].away,
          });
        }

        const topInput: MMIInput = {
          gameId: game.game_id,
          inning: inn + 1,
          inningHalf: 'top',
          outs: 3,
          homeScore: homeRunning,
          awayScore: awayRunning,
          runnersOn: [false, false, false],
          recentInnings: recentTop,
          totalInnings: Math.max(9, totalInnings),
        };
        const topSnap = computeMMI(topInput);
        snapshots.push({
          ...topSnap,
          inning: inn + 1,
          inningHalf: 'top' as const,
          homeScore: homeRunning,
          awayScore: awayRunning,
          eventDescription: awayRuns > 0 ? `${awayRuns} run${awayRuns > 1 ? 's' : ''} scored` : undefined,
        });

        // Bottom of inning — home scores
        homeRunning += homeRuns;
        const recentBottom: InningScore[] = [];
        for (let r = Math.max(0, inn - 1); r <= inn; r++) {
          recentBottom.push({
            inning: r + 1,
            homeRuns: linescore[r].home,
            awayRuns: linescore[r].away,
          });
        }

        const bottomInput: MMIInput = {
          gameId: game.game_id,
          inning: inn + 1,
          inningHalf: 'bottom',
          outs: 3,
          homeScore: homeRunning,
          awayScore: awayRunning,
          runnersOn: [false, false, false],
          recentInnings: recentBottom,
          totalInnings: Math.max(9, totalInnings),
        };
        const bottomSnap = computeMMI(bottomInput);
        snapshots.push({
          ...bottomSnap,
          inning: inn + 1,
          inningHalf: 'bottom' as const,
          homeScore: homeRunning,
          awayScore: awayRunning,
          eventDescription: homeRuns > 0 ? `${homeRuns} run${homeRuns > 1 ? 's' : ''} scored` : undefined,
        });
      }

      // Write snapshots to D1
      const CHUNK = 25;
      for (let i = 0; i < snapshots.length; i += CHUNK) {
        const chunk = snapshots.slice(i, i + CHUNK);
        const stmts = chunk.map(s =>
          env.DB.prepare(
            `INSERT INTO mmi_snapshots
             (game_id, league, inning, inning_half, outs, home_score, away_score,
              mmi_value, sd_component, rs_component, gp_component, bs_component,
              runners_on, computed_at)
             VALUES (?, 'college-baseball', ?, ?, 3, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
          ).bind(
            game.game_id, s.inning, s.inningHalf,
            s.homeScore, s.awayScore,
            s.value, s.components.sd, s.components.rs,
            s.components.gp, s.components.bs,
            null, s.meta.computed_at,
          )
        );
        await env.DB.batch(stmts);
      }

      // Write game summary
      const summary = computeGameSummary(
        game.game_id,
        snapshots.map(s => ({
          value: s.value,
          direction: s.direction,
          magnitude: s.magnitude,
          components: s.components,
          meta: s.meta,
        })),
      );

      await env.DB.prepare(
        `INSERT OR IGNORE INTO mmi_game_summary
         (game_id, league, game_date, home_team, away_team, final_home_score, final_away_score,
          max_mmi, min_mmi, avg_mmi, mmi_volatility, lead_changes, max_swing,
          swing_inning, excitement_rating)
         VALUES (?, 'college-baseball', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        game.game_id, game.game_date, game.home_team, game.away_team,
        game.home_score, game.away_score,
        summary.maxMmi, summary.minMmi, summary.avgMmi, summary.volatility,
        summary.leadChanges, summary.maxSwing, summary.swingInning,
        summary.excitementRating,
      ).run();

      computed++;
    } catch (err) {
      console.error(`[mmi] Failed for game ${game.game_id}:`, err instanceof Error ? err.message : err);
    }
  }

  return computed;
}
