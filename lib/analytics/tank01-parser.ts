/**
 * Tank01 Raw Data Parser
 *
 * Parses raw Tank01 API roster/player responses into typed batting and pitching
 * records for downstream sabermetric computation.
 */

export interface RawBatter {
  playerID: string;
  name: string;
  pos: string;
  ab: number;
  pa: number;
  h: number;
  doubles: number;
  triples: number;
  hr: number;
  rbi: number;
  bb: number;
  hbp: number;
  so: number;
  sb: number;
  cs: number;
  sf: number;
  avg: number;
  obp: number;
  slg: number;
  ops: number;
}

export interface RawPitcher {
  playerID: string;
  name: string;
  pos: string;
  w: number;
  l: number;
  era: number;
  ip: number;
  h: number;
  r: number;
  er: number;
  hr: number;
  bb: number;
  so: number;
  hbp: number;
  whip: number;
  k9: number;
  bb9: number;
}

function safeNum(val: unknown, fallback = 0): number {
  if (typeof val === 'number' && Number.isFinite(val)) return val;
  if (typeof val === 'string') {
    const parsed = parseFloat(val);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function safeStr(val: unknown, fallback = ''): string {
  return typeof val === 'string' ? val : fallback;
}

/**
 * Parse a Tank01 player record into a batter, or null if not a position player.
 */
export function parseTank01Batting(raw: Record<string, unknown>): RawBatter | null {
  const pos = safeStr(raw.pos || raw.position);
  const ab = safeNum(raw.AB || raw.ab || raw.atBats);
  const pa = safeNum(raw.PA || raw.pa || raw.plateAppearances);

  // Skip pitchers (unless DH-ing) and players with no at-bats
  if (pos === 'P' && ab === 0) return null;
  if (ab === 0 && pa === 0) return null;

  return {
    playerID: safeStr(raw.playerID || raw.mlbID || raw.espnID),
    name: safeStr(raw.longName || raw.name || raw.espnName),
    pos,
    ab,
    pa: pa || ab, // Fallback PA to AB if not provided
    h: safeNum(raw.H || raw.h || raw.hits),
    doubles: safeNum(raw['2B'] || raw.doubles),
    triples: safeNum(raw['3B'] || raw.triples),
    hr: safeNum(raw.HR || raw.hr || raw.homeRuns),
    rbi: safeNum(raw.RBI || raw.rbi),
    bb: safeNum(raw.BB || raw.bb || raw.walks),
    hbp: safeNum(raw.HBP || raw.hbp),
    so: safeNum(raw.SO || raw.so || raw.strikeouts),
    sb: safeNum(raw.SB || raw.sb || raw.stolenBases),
    cs: safeNum(raw.CS || raw.cs || raw.caughtStealing),
    sf: safeNum(raw.SF || raw.sf || raw.sacFlies),
    avg: safeNum(raw.AVG || raw.avg || raw.battingAvg),
    obp: safeNum(raw.OBP || raw.obp),
    slg: safeNum(raw.SLG || raw.slg),
    ops: safeNum(raw.OPS || raw.ops),
  };
}

/**
 * Parse a Tank01 player record into a pitcher, or null if not a pitcher.
 */
export function parseTank01Pitching(raw: Record<string, unknown>): RawPitcher | null {
  const pos = safeStr(raw.pos || raw.position);
  const ip = safeNum(raw.InningsPitched || raw.ip || raw.IP);

  // Only pitchers or players with IP
  if (pos !== 'P' && pos !== 'SP' && pos !== 'RP' && pos !== 'CL' && ip === 0) return null;

  return {
    playerID: safeStr(raw.playerID || raw.mlbID || raw.espnID),
    name: safeStr(raw.longName || raw.name || raw.espnName),
    pos,
    w: safeNum(raw.W || raw.w || raw.wins),
    l: safeNum(raw.L || raw.l || raw.losses),
    era: safeNum(raw.ERA || raw.era),
    ip,
    h: safeNum(raw.H || raw.h || raw.hitsAllowed),
    r: safeNum(raw.R || raw.r || raw.runs),
    er: safeNum(raw.ER || raw.er || raw.earnedRuns),
    hr: safeNum(raw.HR || raw.hr || raw.homeRunsAllowed),
    bb: safeNum(raw.BB || raw.bb || raw.walks),
    so: safeNum(raw.SO || raw.so || raw.strikeouts),
    hbp: safeNum(raw.HBP || raw.hbp),
    whip: safeNum(raw.WHIP || raw.whip),
    k9: safeNum(raw.K9 || raw.k9 || raw.strikeoutsPerNine),
    bb9: safeNum(raw.BB9 || raw.bb9 || raw.walksPerNine),
  };
}

/**
 * Split a Tank01 roster array into batters and pitchers.
 */
export function parseRoster(roster: Record<string, unknown>[]): {
  batters: RawBatter[];
  pitchers: RawPitcher[];
} {
  const batters: RawBatter[] = [];
  const pitchers: RawPitcher[] = [];

  for (const player of roster) {
    const batter = parseTank01Batting(player);
    if (batter) batters.push(batter);

    const pitcher = parseTank01Pitching(player);
    if (pitcher) pitchers.push(pitcher);
  }

  return { batters, pitchers };
}
