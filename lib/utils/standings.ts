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
}

export interface NBAApiConference {
  name: string;
  teams: {
    name: string;
    abbreviation?: string;
    wins: number;
    losses: number;
    pct: number;
    gb: string;
    streak: string;
  }[];
}

/**
 * Flatten nested NBA API conference/team structure into a flat array.
 * Parses the `gb` string field into a number (the API returns "-", "6", "8.5" etc.)
 */
export function flattenNBAStandings(conferences: NBAApiConference[]): NBAStandingsTeam[] {
  const flat: NBAStandingsTeam[] = [];
  for (const conf of conferences) {
    const confLabel = conf.name.includes('East') ? 'Eastern' : 'Western';
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
      });
    }
  }
  return flat;
}

/**
 * Split NBA teams by conference.
 */
export function splitNBAByConference(teams: NBAStandingsTeam[]) {
  return {
    eastern: teams.filter((t) => t.conference === 'Eastern' || t.conference === 'East'),
    western: teams.filter((t) => t.conference === 'Western' || t.conference === 'West'),
  };
}
