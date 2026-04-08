/**
 * Shared standings normalization utilities.
 *
 * The standings API returns nested conference/division/team structures.
 * Hub pages and standalone standings pages both need to flatten these.
 * This module centralizes that logic so it lives in one place.
 */

// ── NFL ─────────────────────────────────────────────────────────────

export interface NFLStandingsTeam {
  teamName: string;
  wins: number;
  losses: number;
  ties: number;
  winPercentage: number;
  division: string;
  conference: string;
  pointsFor: number;
  pointsAgainst: number;
}

export interface NFLApiDivision {
  name: string;
  teams: {
    name: string;
    abbreviation?: string;
    wins: number;
    losses: number;
    ties: number;
    pct: number;
    pf: number;
    pa: number;
    conference?: string;
    division?: string;
  }[];
}

export interface NFLApiConference {
  name: string;
  divisions: NFLApiDivision[];
}

/**
 * Flatten nested NFL API conference/division/team structure into a flat array.
 * Works for both the hub page compact view and the standalone standings page.
 */
export function flattenNFLStandings(conferences: NFLApiConference[]): NFLStandingsTeam[] {
  const flat: NFLStandingsTeam[] = [];
  for (const conf of conferences) {
    if (!conf.divisions) continue;
    for (const div of conf.divisions) {
      for (const t of div.teams) {
        flat.push({
          teamName: t.name,
          wins: t.wins,
          losses: t.losses,
          ties: t.ties,
          winPercentage: t.pct,
          division: t.division || div.name.replace(`${conf.name} `, ''),
          conference: t.conference || conf.name,
          pointsFor: t.pf,
          pointsAgainst: t.pa,
        });
      }
    }
  }
  return flat;
}

export const NFL_DIVISION_ORDER = [
  'AFC East', 'AFC North', 'AFC South', 'AFC West',
  'NFC East', 'NFC North', 'NFC South', 'NFC West',
];

/**
 * Group NFL teams by division key ("AFC East", "NFC West", etc.)
 * and sort each division by wins descending.
 */
export function groupNFLByDivision(teams: NFLStandingsTeam[]): Record<string, NFLStandingsTeam[]> {
  const grouped: Record<string, NFLStandingsTeam[]> = {};
  for (const team of teams) {
    const key = `${team.conference} ${team.division}`;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(team);
  }
  for (const div of Object.values(grouped)) {
    div.sort((a, b) => b.wins - a.wins);
  }
  return grouped;
}

// ── NBA ─────────────────────────────────────────────────────────────

export interface NBAStandingsTeam {
  teamName: string;
  wins: number;
  losses: number;
  winPercentage: number;
  conference: string;
  gamesBack: number;
  streak: string;
  /** ESPN team ID */
  id?: string;
  /** Team abbreviation (e.g. "DET", "OKC") */
  abbreviation?: string;
  /** ESPN logo URL */
  logo?: string;
  /** Home record string (e.g. "30-9") */
  home?: string;
  /** Away record string (e.g. "26-13") */
  away?: string;
  /** Last 10 games record (e.g. "7-3") */
  last10?: string;
}

export interface NBAApiConference {
  name: string;
  teams: {
    name: string;
    abbreviation?: string;
    id?: string;
    logo?: string;
    wins: number;
    losses: number;
    pct: number;
    gb: string;
    streak: string;
    home?: string;
    away?: string;
    last10?: string;
  }[];
}

/**
 * Flatten nested NBA API conference/team structure into a flat array.
 * Parses the `gb` string field into a number (the API returns "-", "6", "8.5" etc.)
 * Conference label detection is case-insensitive and handles variants:
 * "Eastern", "Eastern Conference", "East" → "Eastern"
 * Everything else → "Western"
 */
export function flattenNBAStandings(conferences: NBAApiConference[]): NBAStandingsTeam[] {
  const flat: NBAStandingsTeam[] = [];
  for (const conf of conferences) {
    const nameLower = (conf.name || '').toLowerCase();
    const confLabel = nameLower.includes('east') ? 'Eastern' : 'Western';
    for (const t of conf.teams || []) {
      const gbNum = t.gb === '-' || t.gb == null ? 0 : parseFloat(String(t.gb));
      flat.push({
        teamName: t.name,
        wins: t.wins,
        losses: t.losses,
        winPercentage: t.pct,
        conference: confLabel,
        gamesBack: isNaN(gbNum) ? 0 : gbNum,
        streak: t.streak,
        id: t.id,
        abbreviation: t.abbreviation,
        logo: t.logo,
        home: t.home,
        away: t.away,
        last10: t.last10,
      });
    }
  }
  return flat;
}

/**
 * Split NBA teams by conference. Case-insensitive matching.
 * If no teams match either conference (data integrity issue), returns all teams in both
 * so the page still renders something rather than showing empty space.
 */
export function splitNBAByConference(teams: NBAStandingsTeam[]) {
  const eastern = teams.filter((t) => {
    const c = (t.conference || '').toLowerCase();
    return c === 'eastern' || c === 'east';
  });
  const western = teams.filter((t) => {
    const c = (t.conference || '').toLowerCase();
    return c === 'western' || c === 'west';
  });

  // Fallback: if conference split fails but we have teams, show all in both
  // rather than hiding half the league
  if (teams.length > 0 && eastern.length === 0 && western.length === 0) {
    return { eastern: teams, western: [] };
  }

  return { eastern, western };
}
