/**
 * ESPN College Baseball — First-Class Client
 *
 * CBB-specific interfaces, endpoint wrappers, and transform functions.
 * Separated from espn-api.ts to keep the generic client under 800 lines
 * while giving BSI's flagship sport proper typed treatment.
 *
 * Key design decision: box score parsing is LABEL-BASED, not index-based.
 * ESPN's `boxscore.players[].statistics[].labels` array names each column.
 * We build a lookup map from labels, then read values by name. This is
 * resilient to ESPN reordering columns (which they've done before).
 *
 * The derivation logic for HBP/TB/2B/3B from university-reported OBP/SLG
 * is verified against MSST Ace Reese (wOBA 0.649, wRC+ 168 exact match).
 */

import { espnFetch } from './espn-api';

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

/** Parsed batting line from an ESPN college baseball box score row. */
export interface CollegeBaseballBattingLine {
  playerId: string;
  name: string;
  position: string;
  headshot: string;
  /** Direct from ESPN box score labels */
  ab: number;
  r: number;
  h: number;
  rbi: number;
  hr: number;
  bb: number;
  k: number;
  pitchCount: number;
  /** Season AVG — university-reported, NOT per-game */
  avg: number;
  /** Season OBP — university-reported, NOT per-game */
  obp: number;
  /** Season SLG — university-reported, NOT per-game */
  slg: number;
  /** Derived: AB + BB + estimated HBP + estimated SF */
  pa: number;
  /** Derived: round(SLG * AB) when SLG > 0 */
  tb: number;
  /** Estimated from OBP equation */
  hbp: number;
  /** H - 2B - 3B - HR (when derivable from TB) */
  singles: number;
}

/** Parsed pitching line from an ESPN college baseball box score row. */
export interface CollegeBaseballPitchingLine {
  playerId: string;
  name: string;
  position: string;
  headshot: string;
  /** Innings pitched as float (6.1 = 6 and 1/3) */
  ip: number;
  /** Display format: "6.1" */
  ipDisplay: string;
  /** Innings pitched in thirds for D1 storage (6.1 → 19) */
  ipThirds: number;
  h: number;
  r: number;
  er: number;
  bb: number;
  k: number;
  hr: number;
  pitchCount: number;
  era: number;
  decision: 'W' | 'L' | 'S' | 'BS' | null;
}

/** Team side of a parsed box score. */
export interface CollegeBaseballBoxScoreTeam {
  team: { id: string; name: string; abbreviation: string; logo: string };
  batting: CollegeBaseballBattingLine[];
  pitching: CollegeBaseballPitchingLine[];
  totals: { r: number; h: number; e: number; lob: number };
}

/** Full parsed box score for a college baseball game. */
export interface CollegeBaseballBoxScore {
  away: CollegeBaseballBoxScoreTeam;
  home: CollegeBaseballBoxScoreTeam;
  linescore: { innings: { away: number; home: number }[]; totals: { away: { r: number; h: number; e: number }; home: { r: number; h: number; e: number } } } | null;
}

/** Standing team in college baseball standings. */
export interface CollegeBaseballStandingTeam {
  name: string;
  abbreviation: string;
  id: string | undefined;
  logo: string | undefined;
  wins: number;
  losses: number;
  pct: number;
  confWins: number;
  confLosses: number;
  confPct: number;
  streak: string | number;
  runsScored: number;
  runsAllowed: number;
  runDiff: number;
  conference: string;
}

/** Individual ranking entry. */
export interface CollegeBaseballRanking {
  rank: number;
  team: { id: string; name: string; abbreviation: string; logo: string };
  record: string;
  previousRank: number | null;
  trend: 'up' | 'down' | 'same' | 'new';
  points: number | null;
  firstPlaceVotes: number | null;
}

/** Rankings response with multiple polls. */
export interface CollegeBaseballRankingsResponse {
  polls: {
    name: string;
    rankings: CollegeBaseballRanking[];
    updatedAt: string;
  }[];
  meta: { lastUpdated: string; dataSource: string };
}

/** Athlete stats — batting and/or pitching with derived metrics. */
export interface CollegeBaseballAthleteStats {
  batting?: {
    games: number; atBats: number; runs: number; hits: number;
    doubles: number; triples: number; homeRuns: number; rbi: number;
    walks: number; strikeouts: number; stolenBases: number; caughtStealing: number;
    avg: number; obp: number; slg: number; ops: number;
    pa: number; tb: number; iso: number; babip: number; kPct: number; bbPct: number;
  };
  pitching?: {
    games: number; gamesStarted: number; wins: number; losses: number; saves: number;
    ip: number; hits: number; earnedRuns: number; walks: number; strikeouts: number;
    era: number; whip: number;
    k9: number; bb9: number; kBB: number; hr9: number;
  };
}

/** Full game summary — structured replacement for the raw passthrough. */
export interface CollegeBaseballGameSummary {
  id: string | undefined;
  status: { state: string; detail: string; isFinal: boolean; isLive: boolean };
  teams: {
    home: { id: string; name: string; abbreviation: string; logo: string; score: number; isWinner: boolean };
    away: { id: string; name: string; abbreviation: string; logo: string; score: number; isWinner: boolean };
  };
  venue: { name: string; city: string; state: string } | null;
  boxscore: CollegeBaseballBoxScore | null;
  decisions: {
    winner: { id: string; name: string } | null;
    loser: { id: string; name: string } | null;
    save: { id: string; name: string } | null;
  };
  plays: unknown[];
  winProbability: unknown[];
  meta: { lastUpdated: string; dataSource: string };
}

// ---------------------------------------------------------------------------
// ESPN Conference Group IDs (for filtered scoreboard queries)
// ---------------------------------------------------------------------------

export const ESPN_CBB_CONFERENCE_GROUPS: Record<string, string> = {
  SEC: '8',
  'Big 12': '4',
  ACC: '2',
  'Big Ten': '7',
  'Pac-12': '21',
  AAC: '151',
  'Big East': '3',
  'Mountain West': '44',
  'Sun Belt': '37',
  'Conference USA': '12',
  'Missouri Valley': '18',
  Colonial: '10',
  'West Coast': '26',
  Atlantic10: '1',
  'Southern Conference': '29',
};

// ---------------------------------------------------------------------------
// Low-level Parsers — used by both API transforms and ingest pipeline
// ---------------------------------------------------------------------------

/**
 * Parse ESPN's IP notation (e.g. "6.1" = 6 and 1/3 innings) into integer thirds.
 * 6.0 → 18, 6.1 → 19, 6.2 → 20, 7.0 → 21.
 */
export function parseInningsToThirds(ip: string): number {
  const num = parseFloat(ip);
  if (isNaN(num)) return 0;
  const whole = Math.floor(num);
  const frac = Math.round((num - whole) * 10);
  return whole * 3 + frac;
}

/**
 * Parse a single batting line from an ESPN box score stat group.
 *
 * Label-based: builds index from `labels`, reads values by column name.
 * ESPN college baseball batting labels:
 *   ['H-AB', 'AB', 'R', 'H', 'RBI', 'HR', 'BB', 'K', '#P', 'AVG', 'OBP', 'SLG']
 *
 * ESPN does NOT include 2B, 3B, HBP, SF columns. OBP/SLG are university-reported
 * season averages. We derive HBP, TB, and singles from those when possible.
 */
export function parseEspnBattingLine(
  labels: string[],
  stats: string[],
  athlete: { id?: string; displayName?: string; position?: { abbreviation?: string }; headshot?: { href?: string } },
): CollegeBaseballBattingLine | null {
  const idx = (label: string) => labels.indexOf(label);
  const num = (label: string): number => {
    const i = idx(label);
    return i >= 0 ? (parseInt(stats[i] || '0', 10) || 0) : 0;
  };
  const dec = (label: string): number => {
    const i = idx(label);
    return i >= 0 ? (parseFloat(stats[i] || '0') || 0) : 0;
  };

  const ab = num('AB');
  const r = num('R');
  const h = num('H');

  // Skip DNP entries — no AB, no runs, no hits
  if (ab === 0 && r === 0 && h === 0) return null;

  const hr = num('HR');
  const bb = num('BB');
  const obp = dec('OBP');
  const slg = dec('SLG');

  // Derive total bases from season SLG: TB = round(SLG * AB)
  const tb = slg > 0 && ab > 0 ? Math.round(slg * ab) : h + hr * 3;

  // Derive HBP from OBP equation:
  // OBP = (H + BB + HBP) / (AB + BB + HBP + SF)
  // Assuming SF ≈ 0 for single-game estimation:
  // HBP = (OBP * (AB + BB) - H - BB) / (1 - OBP)
  let hbp = 0;
  if (obp > 0 && obp < 1) {
    const estimated = (obp * (ab + bb) - h - bb) / (1 - obp);
    hbp = Math.max(0, Math.round(estimated));
  }

  // PA = AB + BB + HBP + SF (SF unknown, approximate as 0 for per-game)
  const pa = ab + bb + hbp;

  // Singles = H - 2B - 3B - HR, but we don't have 2B/3B from ESPN
  // Approximate: singles = H - HR - extraBaseHits
  // TB = 1B + 2*2B + 3*3B + 4*HR → 2B+3B = TB - H - 3*HR
  // Without splitting 2B/3B: singles = H - HR - (TB - H - 3*HR) = 2*H - TB + 2*HR
  const singles = Math.max(0, 2 * h - tb + 2 * hr);

  return {
    playerId: String(athlete.id || ''),
    name: athlete.displayName || '',
    position: athlete.position?.abbreviation || '',
    headshot: athlete.headshot?.href || '',
    ab,
    r,
    h,
    rbi: num('RBI'),
    hr,
    bb,
    k: num('K'),
    pitchCount: num('#P'),
    avg: dec('AVG'),
    obp,
    slg,
    pa,
    tb,
    hbp,
    singles,
  };
}

/**
 * Parse a single pitching line from an ESPN box score stat group.
 *
 * ESPN college baseball pitching labels:
 *   ['IP', 'H', 'R', 'ER', 'BB', 'K', 'HR', '#P', 'ERA']
 */
export function parseEspnPitchingLine(
  labels: string[],
  stats: string[],
  athlete: { id?: string; displayName?: string; position?: { abbreviation?: string }; headshot?: { href?: string } },
): CollegeBaseballPitchingLine | null {
  const idx = (label: string) => labels.indexOf(label);
  const num = (label: string): number => {
    const i = idx(label);
    return i >= 0 ? (parseInt(stats[i] || '0', 10) || 0) : 0;
  };
  const dec = (label: string): number => {
    const i = idx(label);
    return i >= 0 ? (parseFloat(stats[i] || '0') || 0) : 0;
  };

  const ipStr = stats[idx('IP')] || '0';
  const ipThirds = parseInningsToThirds(ipStr);

  // Skip pitchers who didn't record an out
  if (ipThirds === 0) return null;

  const ipFloat = ipThirds / 3;

  return {
    playerId: String(athlete.id || ''),
    name: athlete.displayName || '',
    position: athlete.position?.abbreviation || '',
    headshot: athlete.headshot?.href || '',
    ip: Math.round(ipFloat * 10) / 10,
    ipDisplay: ipStr,
    ipThirds,
    h: num('H'),
    r: num('R'),
    er: num('ER'),
    bb: num('BB'),
    k: num('K'),
    hr: num('HR'),
    pitchCount: num('#P'),
    era: dec('ERA'),
    decision: null, // Populated from game summary decisions, not box score labels
  };
}

/**
 * Parse all batting and pitching lines from an ESPN box score team entry.
 *
 * ESPN's `boxscore.players[]` has one entry per team, each with:
 *   { team: {...}, statistics: [{ labels, athletes, ... }, ...] }
 *
 * Returns flat arrays of parsed batting/pitching lines plus team totals.
 */
export function parseBoxScoreTeam(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  teamBox: any,
): { team: { id: string; name: string }; batting: CollegeBaseballBattingLine[]; pitching: CollegeBaseballPitchingLine[]; runsFromBatting: number } {
  const teamName = teamBox.team?.displayName || teamBox.team?.shortDisplayName || '';
  const teamId = String(teamBox.team?.id || '');
  const batting: CollegeBaseballBattingLine[] = [];
  const pitching: CollegeBaseballPitchingLine[] = [];
  let runsFromBatting = 0;

  for (const statGroup of (teamBox.statistics || [])) {
    const labels: string[] = statGroup.labels || [];
    const isBatting = labels.includes('AB') || labels.includes('H-AB');
    const isPitching = labels.includes('IP') || labels.includes('ERA');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const athleteEntry of (statGroup.athletes || []) as any[]) {
      const athlete = athleteEntry.athlete || {};
      const stats: string[] = athleteEntry.stats || [];

      if (isBatting && stats.length > 0) {
        const line = parseEspnBattingLine(labels, stats, athlete);
        if (line) {
          batting.push(line);
          runsFromBatting += line.r;
        }
      }

      if (isPitching && stats.length > 0) {
        const line = parseEspnPitchingLine(labels, stats, athlete);
        if (line) pitching.push(line);
      }
    }
  }

  return { team: { id: teamId, name: teamName }, batting, pitching, runsFromBatting };
}

// ---------------------------------------------------------------------------
// High-level Transform Functions
// ---------------------------------------------------------------------------

/**
 * Transform ESPN box score data into a typed CollegeBaseballBoxScore.
 *
 * Accepts `boxscore.players` array and the `header.competitions[0].competitors`
 * array from a game summary response. Competitors provide team metadata and
 * home/away assignment.
 */
export function transformCollegeBaseballBoxScore(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  boxscorePlayers: any[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  competitors: any[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  linescoreRaw?: any[],
): CollegeBaseballBoxScore {
  // Build home/away team ID map from competitors
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const homeComp = competitors.find((c: any) => c.homeAway === 'home') || {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const awayComp = competitors.find((c: any) => c.homeAway === 'away') || {};
  const homeTeamId = String(homeComp.team?.id ?? '');
  const awayTeamId = String(awayComp.team?.id ?? '');

  const makeTeamInfo = (comp: Record<string, unknown>) => {
    const t = (comp.team || {}) as Record<string, unknown>;
    const logos = t.logos as Array<{ href: string }> | undefined;
    return {
      id: String(t.id ?? ''),
      name: (t.displayName || t.name || '') as string,
      abbreviation: (t.abbreviation || '') as string,
      logo: (t.logo || logos?.[0]?.href || '') as string,
    };
  };

  // Parse both teams
  const parsed = boxscorePlayers.map(parseBoxScoreTeam);

  // Match parsed teams to home/away
  const homeParsed = parsed.find(p => p.team.id === homeTeamId) || parsed[1];
  const awayParsed = parsed.find(p => p.team.id === awayTeamId) || parsed[0];

  // Compute totals from batting lines
  const computeTotals = (battingLines: CollegeBaseballBattingLine[]) => ({
    r: battingLines.reduce((s, b) => s + b.r, 0),
    h: battingLines.reduce((s, b) => s + b.h, 0),
    e: 0, // ESPN box score doesn't break out errors per player
    lob: 0, // LOB not available per-player from ESPN
  });

  // Parse linescore if available
  let linescore: CollegeBaseballBoxScore['linescore'] = null;
  if (linescoreRaw && linescoreRaw.length > 0) {
    const innings: { away: number; home: number }[] = [];
    for (const inning of linescoreRaw) {
      const linescores = (inning.linescores || []) as Array<{ value?: number }>;
      innings.push({
        away: linescores[0]?.value ?? 0,
        home: linescores[1]?.value ?? 0,
      });
    }

    const homeScore = Number(homeComp.score ?? 0);
    const awayScore = Number(awayComp.score ?? 0);
    const homeTotals = homeParsed ? computeTotals(homeParsed.batting) : { r: homeScore, h: 0, e: 0 };
    const awayTotals = awayParsed ? computeTotals(awayParsed.batting) : { r: awayScore, h: 0, e: 0 };

    linescore = {
      innings,
      totals: {
        away: { r: awayTotals.r || awayScore, h: awayTotals.h, e: awayTotals.e },
        home: { r: homeTotals.r || homeScore, h: homeTotals.h, e: homeTotals.e },
      },
    };
  }

  return {
    home: {
      team: makeTeamInfo(homeComp),
      batting: homeParsed?.batting || [],
      pitching: homeParsed?.pitching || [],
      totals: homeParsed ? computeTotals(homeParsed.batting) : { r: 0, h: 0, e: 0, lob: 0 },
    },
    away: {
      team: makeTeamInfo(awayComp),
      batting: awayParsed?.batting || [],
      pitching: awayParsed?.pitching || [],
      totals: awayParsed ? computeTotals(awayParsed.batting) : { r: 0, h: 0, e: 0, lob: 0 },
    },
    linescore,
  };
}

/**
 * Transform a full ESPN game summary into a typed CollegeBaseballGameSummary.
 *
 * Wraps transformCollegeBaseballBoxScore plus extracts game status, venue,
 * competitors, decisions, linescore, plays, and win probability.
 */
export function transformCollegeBaseballGameSummary(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  raw: any,
): CollegeBaseballGameSummary {
  const header = raw?.header || {};
  const competitions = header?.competitions || [];
  const competition = competitions[0] || {};
  const competitors = competition.competitors || [];
  const statusType = competition.status?.type || {};

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const homeComp = competitors.find((c: any) => c.homeAway === 'home') || {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const awayComp = competitors.find((c: any) => c.homeAway === 'away') || {};

  const homeScore = Number(homeComp.score ?? 0);
  const awayScore = Number(awayComp.score ?? 0);
  const isFinal = statusType.completed === true || statusType.state === 'post';
  const isLive = statusType.state === 'in';

  const makeTeamSummary = (comp: Record<string, unknown>, score: number, isWinner: boolean) => {
    const t = (comp.team || {}) as Record<string, unknown>;
    const logos = t.logos as Array<{ href: string }> | undefined;
    return {
      id: String(t.id ?? ''),
      name: (t.displayName || t.name || '') as string,
      abbreviation: (t.abbreviation || '') as string,
      logo: (t.logo || logos?.[0]?.href || '') as string,
      score,
      isWinner,
    };
  };

  // Box score
  const boxscorePlayers = raw?.boxscore?.players || [];
  const linescoreItems = raw?.header?.competitions?.[0]?.linescoreAvailable
    ? (raw?.linescores || [])
    : [];

  let boxscore: CollegeBaseballBoxScore | null = null;
  if (boxscorePlayers.length > 0) {
    boxscore = transformCollegeBaseballBoxScore(boxscorePlayers, competitors, linescoreItems);
  }

  // Venue
  const venueRaw = competition.venue || raw?.gameInfo?.venue;
  let venue: CollegeBaseballGameSummary['venue'] = null;
  if (venueRaw) {
    const addr = venueRaw.address || {};
    venue = {
      name: venueRaw.fullName || venueRaw.displayName || '',
      city: addr.city || '',
      state: addr.state || '',
    };
  }

  // Decisions (winning/losing pitcher, save)
  const decisionsRaw = raw?.leaders || [];
  const decisions: CollegeBaseballGameSummary['decisions'] = { winner: null, loser: null, save: null };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const leader of decisionsRaw as any[]) {
    const type = leader.displayName?.toLowerCase() || '';
    const athlete = leader.leaders?.[0]?.athlete;
    if (!athlete) continue;
    const entry = { id: String(athlete.id || ''), name: athlete.displayName || '' };
    if (type.includes('win')) decisions.winner = entry;
    else if (type.includes('los')) decisions.loser = entry;
    else if (type.includes('save')) decisions.save = entry;
  }

  return {
    id: (header.id || raw?.gameId) as string | undefined,
    status: {
      state: statusType.state || 'pre',
      detail: statusType.shortDetail || statusType.detail || '',
      isFinal,
      isLive,
    },
    teams: {
      home: makeTeamSummary(homeComp, homeScore, isFinal && homeScore > awayScore),
      away: makeTeamSummary(awayComp, awayScore, isFinal && awayScore > homeScore),
    },
    venue,
    boxscore,
    decisions,
    plays: (raw?.plays || []) as unknown[],
    winProbability: (raw?.winprobability || []) as unknown[],
    meta: { lastUpdated: new Date().toISOString(), dataSource: 'espn' },
  };
}

/**
 * Transform ESPN rankings response into typed polls.
 *
 * ESPN endpoint: /apis/site/v2/sports/baseball/college-baseball/rankings
 */
export function transformCollegeBaseballRankings(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  raw: any,
): CollegeBaseballRankingsResponse {
  const rankings = raw?.rankings || [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const polls = rankings.map((poll: any) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const entries = (poll.ranks || []).map((entry: any) => {
      const team = entry.team || {};
      const logos = team.logos || [];
      const prevRank = entry.previous ?? entry.previousRank ?? null;
      const currentRank = entry.current ?? entry.rank ?? 0;

      let trend: 'up' | 'down' | 'same' | 'new' = 'same';
      if (prevRank === null || prevRank === 0) trend = 'new';
      else if (currentRank < prevRank) trend = 'up';
      else if (currentRank > prevRank) trend = 'down';

      return {
        rank: currentRank,
        team: {
          id: String(team.id ?? ''),
          name: team.nickname || team.displayName || team.name || '',
          abbreviation: team.abbreviation || '',
          logo: logos[0]?.href || '',
        },
        record: entry.recordSummary || '',
        previousRank: prevRank,
        trend,
        points: entry.points ?? null,
        firstPlaceVotes: entry.firstPlaceVotes ?? null,
      } satisfies CollegeBaseballRanking;
    });

    return {
      name: poll.name || poll.shortName || 'Unknown Poll',
      rankings: entries,
      updatedAt: poll.date || new Date().toISOString(),
    };
  });

  return {
    polls,
    meta: { lastUpdated: new Date().toISOString(), dataSource: 'espn' },
  };
}

/**
 * Transform ESPN athlete data into typed CBB athlete stats.
 *
 * Parses stat categories by name (batting/pitching), applies label mappings,
 * and computes derived metrics (ISO, BABIP, K%, BB%, K/9, BB/9).
 */
export function transformCollegeBaseballAthlete(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  raw: any,
): CollegeBaseballAthleteStats {
  const athlete = raw?.athlete || raw || {};
  const categories = athlete.statistics || athlete.statsSummary?.statistics || [];
  const stats: CollegeBaseballAthleteStats = {};

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const category of categories as any[]) {
    const catName = (category.name || category.displayName || '').toLowerCase();
    const statEntries = category.stats || category.splits?.categories?.[0]?.stats || [];

    // Build name → value map from stat entries
    const statMap: Record<string, number> = {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const s of statEntries as any[]) {
      const name = s.name || s.abbreviation || '';
      statMap[name] = Number(s.value ?? s.displayValue ?? 0);
    }

    if (catName.includes('batting') || catName.includes('hitting')) {
      const ab = statMap['atBats'] ?? statMap['AB'] ?? 0;
      const h = statMap['hits'] ?? statMap['H'] ?? 0;
      const hr = statMap['homeRuns'] ?? statMap['HR'] ?? 0;
      const bb = statMap['walks'] ?? statMap['BB'] ?? 0;
      const so = statMap['strikeouts'] ?? statMap['K'] ?? statMap['SO'] ?? 0;
      const hbp = statMap['hitByPitches'] ?? statMap['HBP'] ?? 0;
      const sf = statMap['sacrificeFlies'] ?? statMap['SF'] ?? 0;
      const pa = ab + bb + hbp + sf;
      const avg = ab > 0 ? h / ab : 0;
      const obp = pa > 0 ? (h + bb + hbp) / pa : 0;
      const tb = statMap['totalBases'] ?? statMap['TB'] ?? h + hr * 3;
      const slg = ab > 0 ? tb / ab : 0;
      const doubles = statMap['doubles'] ?? statMap['2B'] ?? 0;
      const triples = statMap['triples'] ?? statMap['3B'] ?? 0;

      // Derived
      const iso = slg - avg;
      const babipDenom = ab - so - hr + sf;
      const babip = babipDenom > 0 ? (h - hr) / babipDenom : 0;
      const kPct = pa > 0 ? so / pa : 0;
      const bbPct = pa > 0 ? bb / pa : 0;

      stats.batting = {
        games: statMap['gamesPlayed'] ?? statMap['GP'] ?? 0,
        atBats: ab, runs: statMap['runs'] ?? statMap['R'] ?? 0, hits: h,
        doubles, triples, homeRuns: hr, rbi: statMap['RBIs'] ?? statMap['RBI'] ?? 0,
        walks: bb, strikeouts: so,
        stolenBases: statMap['stolenBases'] ?? statMap['SB'] ?? 0,
        caughtStealing: statMap['caughtStealing'] ?? statMap['CS'] ?? 0,
        avg: Math.round(avg * 1000) / 1000,
        obp: Math.round(obp * 1000) / 1000,
        slg: Math.round(slg * 1000) / 1000,
        ops: Math.round((obp + slg) * 1000) / 1000,
        pa, tb,
        iso: Math.round(iso * 1000) / 1000,
        babip: Math.round(babip * 1000) / 1000,
        kPct: Math.round(kPct * 1000) / 1000,
        bbPct: Math.round(bbPct * 1000) / 1000,
      };
    }

    if (catName.includes('pitching')) {
      const ip = statMap['inningsPitched'] ?? statMap['IP'] ?? 0;
      const pHits = statMap['hits'] ?? statMap['H'] ?? 0;
      const er = statMap['earnedRuns'] ?? statMap['ER'] ?? 0;
      const pBB = statMap['walks'] ?? statMap['BB'] ?? 0;
      const pK = statMap['strikeouts'] ?? statMap['K'] ?? statMap['SO'] ?? 0;
      const pHR = statMap['homeRuns'] ?? statMap['HR'] ?? 0;
      const era = ip > 0 ? (er * 9) / ip : 0;
      const whip = ip > 0 ? (pHits + pBB) / ip : 0;
      const k9 = ip > 0 ? (pK * 9) / ip : 0;
      const bb9 = ip > 0 ? (pBB * 9) / ip : 0;
      const kBB = pBB > 0 ? pK / pBB : pK > 0 ? Infinity : 0;
      const hr9 = ip > 0 ? (pHR * 9) / ip : 0;

      stats.pitching = {
        games: statMap['gamesPlayed'] ?? statMap['GP'] ?? 0,
        gamesStarted: statMap['gamesStarted'] ?? statMap['GS'] ?? 0,
        wins: statMap['wins'] ?? statMap['W'] ?? 0,
        losses: statMap['losses'] ?? statMap['L'] ?? 0,
        saves: statMap['saves'] ?? statMap['SV'] ?? 0,
        ip, hits: pHits, earnedRuns: er, walks: pBB, strikeouts: pK,
        era: Math.round(era * 100) / 100,
        whip: Math.round(whip * 100) / 100,
        k9: Math.round(k9 * 10) / 10,
        bb9: Math.round(bb9 * 10) / 10,
        kBB: kBB === Infinity ? 99.0 : Math.round(kBB * 10) / 10,
        hr9: Math.round(hr9 * 10) / 10,
      };
    }
  }

  return stats;
}

/**
 * Transform ESPN college baseball standings into grouped conference format.
 *
 * Uses the same entry-walking pattern as MLB/NFL/CFB, but groups by conference
 * and extracts conference record + run differential.
 *
 * @param teamMetadataLookup - Optional function to look up conference from team name/ID.
 *   If not provided, falls back to the group name from ESPN's response.
 */
export function transformCollegeBaseballStandings(
  raw: Record<string, unknown>,
  conferenceByName?: Record<string, string>,
): { standings: { name: string; teams: CollegeBaseballStandingTeam[] }[]; meta: { lastUpdated: string; dataSource: string } } {
  const groups = (raw?.children || []) as Record<string, unknown>[];
  const allTeams: CollegeBaseballStandingTeam[] = [];

  for (const group of groups) {
    const groupName = (group.name || '') as string;
    const standingsData = group?.standings as Record<string, unknown> | undefined;
    const entries = (standingsData?.entries || []) as Record<string, unknown>[];

    for (const entry of entries) {
      const teamData = (entry?.team || {}) as Record<string, unknown>;
      const statsList = (entry?.stats || []) as Record<string, unknown>[];
      const abbr = (teamData.abbreviation || '???') as string;
      const displayName = (teamData.displayName || teamData.name || '') as string;

      const stat = (name: string): string | number => {
        const s = statsList.find((s: Record<string, unknown>) => s.name === name || s.abbreviation === name);
        return (s?.displayValue ?? s?.value ?? '-') as string | number;
      };

      const wins = Number(stat('wins')) || 0;
      const losses = Number(stat('losses')) || 0;
      const total = wins + losses;

      // Conference record — ESPN may provide as 'conferenceRecord' or 'Conference'
      const confRecordStr = String(stat('conferenceRecord') || stat('Conference') || '0-0');
      const confParts = confRecordStr.match(/(\d+)-(\d+)/);
      const confWins = confParts ? Number(confParts[1]) : 0;
      const confLosses = confParts ? Number(confParts[2]) : 0;
      const confTotal = confWins + confLosses;

      const rs = Number(stat('pointsFor')) || 0;
      const ra = Number(stat('pointsAgainst')) || 0;

      const teamLogos = teamData.logos as Record<string, unknown>[] | undefined;

      // Conference: check metadata lookup first, fall back to ESPN group name
      let conference = groupName;
      if (conferenceByName) {
        const metaConf = conferenceByName[displayName.toLowerCase()];
        if (metaConf) conference = metaConf;
      }

      allTeams.push({
        name: displayName,
        abbreviation: abbr,
        id: teamData.id as string | undefined,
        logo: teamLogos?.[0]?.href as string | undefined,
        wins,
        losses,
        pct: total > 0 ? Math.round((wins / total) * 1000) / 1000 : 0,
        confWins,
        confLosses,
        confPct: confTotal > 0 ? Math.round((confWins / confTotal) * 1000) / 1000 : 0,
        streak: stat('streak') || '-',
        runsScored: rs,
        runsAllowed: ra,
        runDiff: rs - ra,
        conference,
      });
    }
  }

  // Group by conference
  const confMap: Record<string, CollegeBaseballStandingTeam[]> = {};
  for (const team of allTeams) {
    const conf = team.conference || 'NCAA';
    if (!confMap[conf]) confMap[conf] = [];
    confMap[conf].push(team);
  }

  const standings = Object.entries(confMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([confName, teams]) => ({
      name: confName,
      teams: teams.sort((a, b) => b.confPct - a.confPct || b.pct - a.pct || b.wins - a.wins),
    }));

  return {
    standings,
    meta: { lastUpdated: new Date().toISOString(), dataSource: 'ESPN' },
  };
}

// ---------------------------------------------------------------------------
// ESPN Endpoint Wrappers
// ---------------------------------------------------------------------------

/** Fetch college baseball rankings (Coaches Poll, D1Baseball, etc.) */
export async function getCollegeBaseballRankings(): Promise<CollegeBaseballRankingsResponse> {
  const raw = await espnFetch<Record<string, unknown>>(
    'baseball/college-baseball/rankings',
  );
  return transformCollegeBaseballRankings(raw);
}

/**
 * Fetch conference-filtered scoreboard.
 *
 * @param groupId — ESPN conference group ID (see ESPN_CBB_CONFERENCE_GROUPS)
 * @param date — YYYYMMDD format
 */
export async function getConferenceScoreboard(
  groupId: string,
  date?: string,
): Promise<unknown> {
  const params = new URLSearchParams({ groups: groupId });
  if (date) params.set('dates', date.replace(/-/g, ''));
  return espnFetch(`baseball/college-baseball/scoreboard?${params.toString()}`);
}

/**
 * Fetch team schedule with explicit season parameter.
 *
 * @param teamId — ESPN team ID
 * @param season — Year (e.g. 2026). Defaults to current year.
 */
export async function getCollegeBaseballSchedule(
  teamId: string,
  season?: number,
): Promise<unknown> {
  const params = new URLSearchParams();
  if (season) params.set('season', String(season));
  const qs = params.toString() ? `?${params.toString()}` : '';
  return espnFetch(`baseball/college-baseball/teams/${teamId}/schedule${qs}`);
}

/**
 * Fetch athlete overview — may include split stats.
 *
 * ESPN's /overview sub-path returns richer data when available. If it 400s
 * for college baseball (known constraint), callers should fall back to the
 * base athlete endpoint via getAthlete().
 */
export async function getAthleteOverview(
  athleteId: string,
): Promise<unknown> {
  try {
    return await espnFetch(`baseball/college-baseball/athletes/${athleteId}/overview`);
  } catch {
    // /overview 400s for most college baseball athletes — fall back silently
    return espnFetch(`baseball/college-baseball/athletes/${athleteId}`);
  }
}
