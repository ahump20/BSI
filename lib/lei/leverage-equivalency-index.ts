import { PlayContext, PlayoffRound, LeverageResponse, ValidationIssue, ValidationResult } from './types';

const ROUND_WEIGHTS: Record<PlayoffRound, number> = {
  wildcard: 1,
  division: 2,
  conference: 4,
  championship: 8,
};

const MAX_SWING = 8;

export class LeverageEquivalencyIndex {
  compute(ctx: PlayContext): number {
    const { lei } = this.computeWithComponents(ctx);
    return lei;
  }

  computeWithComponents(ctx: PlayContext): LeverageResponse {
    const championshipWeight = ROUND_WEIGHTS[ctx.playoffRound];
    const winProbabilityAdded = Math.abs(ctx.postPlayWinProb - ctx.prePlayWinProb);
    const scarcity = this.computeScarcity(ctx);

    const rawScore = championshipWeight * winProbabilityAdded * scarcity;
    const lei = Math.min(100, (100 * rawScore) / MAX_SWING);

    return {
      lei,
      components: { championshipWeight, winProbabilityAdded, scarcity },
    };
  }

  validate(ctx: unknown): ValidationResult {
    if (typeof ctx !== 'object' || ctx === null) {
      return { ok: false, issues: [{ field: 'body', message: 'Request body must be a JSON object.' }] };
    }

    const issues: ValidationIssue[] = [];
    const record = ctx as Record<string, unknown>;

    const sport = record.sport;
    if (sport !== 'baseball' && sport !== 'football') {
      issues.push({ field: 'sport', message: 'sport must be either "baseball" or "football".' });
    }

    const playoffRound = record.playoff_round ?? record.playoffRound;
    if (!['wildcard', 'division', 'conference', 'championship'].includes(String(playoffRound))) {
      issues.push({
        field: 'playoffRound',
        message: 'playoffRound must be one of wildcard, division, conference, championship.',
      });
    }

    const pre = record.pre_play_win_prob ?? record.prePlayWinProb;
    const post = record.post_play_win_prob ?? record.postPlayWinProb;
    if (!isProbabilityInput(pre)) {
      issues.push({ field: 'prePlayWinProb', message: 'prePlayWinProb must be a number between 0 and 1.' });
    }
    if (!isProbabilityInput(post)) {
      issues.push({ field: 'postPlayWinProb', message: 'postPlayWinProb must be a number between 0 and 1.' });
    }

    if (issues.length > 0) {
      return { ok: false, issues };
    }

    return { ok: true };
  }

  parseContext(body: Record<string, unknown>): PlayContext {
    const sport = body.sport;
    if (sport !== 'baseball' && sport !== 'football') {
      throw new Error('Invalid sport provided.');
    }

    const playoffRound = (body.playoff_round ?? body.playoffRound) as PlayoffRound | undefined;
    if (!playoffRound || !(playoffRound in ROUND_WEIGHTS)) {
      throw new Error('Invalid playoffRound provided.');
    }

    const pre = Number(body.pre_play_win_prob ?? body.prePlayWinProb);
    const post = Number(body.post_play_win_prob ?? body.postPlayWinProb);

    if (!isProbabilityInput(pre)) {
      throw new Error('prePlayWinProb must be a probability between 0 and 1.');
    }

    if (!isProbabilityInput(post)) {
      throw new Error('postPlayWinProb must be a probability between 0 and 1.');
    }

    const scoreDifferential = toNumber(body.score_differential ?? body.scoreDifferential, 0);

    return {
      sport,
      playoffRound,
      prePlayWinProb: pre,
      postPlayWinProb: post,
      outsRemaining: normaliseOptionalNumber(body.outs_remaining ?? body.outsRemaining),
      strikesRemaining: normaliseOptionalNumber(body.strikes_remaining ?? body.strikesRemaining),
      timeRemaining: normaliseOptionalNumber(body.time_remaining ?? body.timeRemaining),
      timeoutsRemaining: normaliseOptionalNumber(body.timeouts_remaining ?? body.timeoutsRemaining),
      scoreDifferential,
    };
  }

  private computeScarcity(ctx: PlayContext): number {
    if (ctx.sport === 'baseball') {
      return this.baseballScarcity(ctx);
    }

    return this.footballScarcity(ctx);
  }

  private baseballScarcity(ctx: PlayContext): number {
    const totalOuts = 27;
    const outsRemaining = ctx.outsRemaining ?? totalOuts;
    const outsGone = clamp(totalOuts - outsRemaining, 0, totalOuts);
    const baseScarcity = outsGone / totalOuts;

    let strikeMultiplier = 1;
    if (ctx.strikesRemaining !== undefined && ctx.strikesRemaining !== null && ctx.strikesRemaining <= 0) {
      strikeMultiplier = 1.2;
    }

    const scoreDifferential = ctx.scoreDifferential ?? 0;
    const scoreFactor = 1 / (1 + Math.abs(scoreDifferential) * 0.1);

    return Math.min(1, baseScarcity * strikeMultiplier * scoreFactor);
  }

  private footballScarcity(ctx: PlayContext): number {
    const totalSeconds = 3600;
    const timeRemaining = ctx.timeRemaining ?? totalSeconds;
    const secondsGone = clamp(totalSeconds - timeRemaining, 0, totalSeconds);
    let timeScarcity = secondsGone / totalSeconds;

    if (timeRemaining < 900) {
      const q4Boost = 1 + (900 - timeRemaining) / 900;
      timeScarcity *= q4Boost;
    }

    const timeoutsRemaining = ctx.timeoutsRemaining ?? 3;
    const timeoutFactor = 1 + (3 - clamp(timeoutsRemaining, 0, 3)) * 0.15;

    const scoreDifferential = ctx.scoreDifferential ?? 0;
    const scoreFactor = Math.abs(scoreDifferential) <= 8 ? 1.3 : 1;

    return Math.min(1, timeScarcity * timeoutFactor * scoreFactor);
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function normaliseOptionalNumber(value: unknown): number | null | undefined {
  if (value === null || value === undefined || value === '') {
    return undefined;
  }

  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : undefined;
}

function isProbabilityInput(value: unknown): boolean {
  if (value === null || value === undefined) {
    return false;
  }

  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric >= 0 && numeric <= 1;
}

function toNumber(value: unknown, fallback: number): number {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }

  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}
