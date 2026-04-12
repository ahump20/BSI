/**
 * Adapts a loosely-typed Baseball game.boxscore (Record<string, unknown>)
 * into the strict BoxScoreData shape consumed by BoxScoreTable.
 *
 * Used by both MLB and College Baseball box-score pages so the underlying
 * table component stays single-sourced. Unknown / missing fields fall
 * through as safe defaults; extra properties (year, ranking, position)
 * survive on each row via the permissive `[key: string]: unknown` map.
 */

import type { BoxScoreData, BattingLine, PitchingLine } from '@/components/box-score';

interface RawBatter {
  player?: {
    id?: string;
    name?: string;
    position?: string;
    year?: string;
    ranking?: number;
    jerseyNumber?: string;
  };
  ab?: number;
  r?: number;
  h?: number;
  rbi?: number;
  bb?: number;
  so?: number;
  hr?: number;
  avg?: string;
  obp?: string;
  slg?: string;
  sb?: number;
}

interface RawPitcher {
  player?: {
    id?: string;
    name?: string;
    year?: string;
    jerseyNumber?: string;
  };
  ip?: string;
  h?: number;
  r?: number;
  er?: number;
  bb?: number;
  so?: number;
  era?: string;
  decision?: string;
  pitches?: number;
  strikes?: number;
  whip?: string;
}

interface RawBoxscore {
  away?: {
    batting?: RawBatter[];
    pitching?: RawPitcher[];
  };
  home?: {
    batting?: RawBatter[];
    pitching?: RawPitcher[];
  };
}

function adaptBatter(raw: RawBatter): BattingLine {
  return {
    player: {
      id: raw.player?.id,
      name: raw.player?.name ?? '-',
      position: raw.player?.position,
      jerseyNumber: raw.player?.jerseyNumber,
      ...(raw.player?.year ? { year: raw.player.year } : {}),
      ...(raw.player?.ranking !== undefined ? { ranking: raw.player.ranking } : {}),
    } as BattingLine['player'],
    ab: raw.ab ?? 0,
    r: raw.r ?? 0,
    h: raw.h ?? 0,
    rbi: raw.rbi ?? 0,
    bb: raw.bb ?? 0,
    so: raw.so ?? 0,
    avg: raw.avg ?? '-',
    hr: raw.hr,
    obp: raw.obp,
    slg: raw.slg,
    sb: raw.sb,
  };
}

function adaptPitcher(raw: RawPitcher): PitchingLine {
  return {
    player: {
      id: raw.player?.id,
      name: raw.player?.name ?? '-',
      jerseyNumber: raw.player?.jerseyNumber,
      ...(raw.player?.year ? { year: raw.player.year } : {}),
    } as PitchingLine['player'],
    ip: raw.ip ?? '0.0',
    h: raw.h ?? 0,
    r: raw.r ?? 0,
    er: raw.er ?? 0,
    bb: raw.bb ?? 0,
    so: raw.so ?? 0,
    era: raw.era ?? '-',
    decision: raw.decision,
    pitches: raw.pitches,
    strikes: raw.strikes,
    whip: raw.whip,
  };
}

/**
 * Convert a raw baseball game.boxscore payload into BoxScoreData.
 * Returns undefined if the payload is missing or malformed — callers
 * render BoxScoreEmptyState in that case.
 */
export function adaptBaseballBoxscore(
  raw: Record<string, unknown> | null | undefined,
): BoxScoreData | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const box = raw as RawBoxscore;
  const awayBatting = box.away?.batting ?? [];
  const homeBatting = box.home?.batting ?? [];
  const awayPitching = box.away?.pitching ?? [];
  const homePitching = box.home?.pitching ?? [];

  // If every collection is empty, treat it as no data so the empty
  // state surfaces instead of a card of empty tables.
  if (
    awayBatting.length === 0 &&
    homeBatting.length === 0 &&
    awayPitching.length === 0 &&
    homePitching.length === 0
  ) {
    return undefined;
  }

  return {
    away: {
      batting: awayBatting.map(adaptBatter),
      pitching: awayPitching.map(adaptPitcher),
    },
    home: {
      batting: homeBatting.map(adaptBatter),
      pitching: homePitching.map(adaptPitcher),
    },
  };
}
