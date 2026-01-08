/**
 * MLB Team Utilities
 *
 * Centralized team data with mappings between abbreviations and MLB Stats API IDs.
 * Single source of truth for team information across the app.
 *
 * Last Updated: 2025-01-07
 */

export interface MLBTeamInfo {
  id: number; // MLB Stats API numeric ID
  abbrev: string; // Short abbreviation (e.g., "STL")
  slug: string; // URL-safe slug (e.g., "stl")
  name: string; // Full team name (e.g., "St. Louis Cardinals")
  shortName: string; // Short name (e.g., "Cardinals")
  city: string; // City name (e.g., "St. Louis")
  league: 'AL' | 'NL';
  division: 'East' | 'Central' | 'West';
  venue: string; // Stadium name
  primaryColor: string; // Team's primary hex color
}

/**
 * Complete MLB team data
 * MLB Stats API IDs sourced from statsapi.mlb.com
 */
export const MLB_TEAMS: MLBTeamInfo[] = [
  // American League East
  {
    id: 110,
    abbrev: 'BAL',
    slug: 'bal',
    name: 'Baltimore Orioles',
    shortName: 'Orioles',
    city: 'Baltimore',
    league: 'AL',
    division: 'East',
    venue: 'Oriole Park at Camden Yards',
    primaryColor: '#DF4601',
  },
  {
    id: 111,
    abbrev: 'BOS',
    slug: 'bos',
    name: 'Boston Red Sox',
    shortName: 'Red Sox',
    city: 'Boston',
    league: 'AL',
    division: 'East',
    venue: 'Fenway Park',
    primaryColor: '#BD3039',
  },
  {
    id: 147,
    abbrev: 'NYY',
    slug: 'nyy',
    name: 'New York Yankees',
    shortName: 'Yankees',
    city: 'New York',
    league: 'AL',
    division: 'East',
    venue: 'Yankee Stadium',
    primaryColor: '#003087',
  },
  {
    id: 139,
    abbrev: 'TB',
    slug: 'tb',
    name: 'Tampa Bay Rays',
    shortName: 'Rays',
    city: 'Tampa Bay',
    league: 'AL',
    division: 'East',
    venue: 'Tropicana Field',
    primaryColor: '#092C5C',
  },
  {
    id: 141,
    abbrev: 'TOR',
    slug: 'tor',
    name: 'Toronto Blue Jays',
    shortName: 'Blue Jays',
    city: 'Toronto',
    league: 'AL',
    division: 'East',
    venue: 'Rogers Centre',
    primaryColor: '#134A8E',
  },

  // American League Central
  {
    id: 145,
    abbrev: 'CWS',
    slug: 'cws',
    name: 'Chicago White Sox',
    shortName: 'White Sox',
    city: 'Chicago',
    league: 'AL',
    division: 'Central',
    venue: 'Guaranteed Rate Field',
    primaryColor: '#27251F',
  },
  {
    id: 114,
    abbrev: 'CLE',
    slug: 'cle',
    name: 'Cleveland Guardians',
    shortName: 'Guardians',
    city: 'Cleveland',
    league: 'AL',
    division: 'Central',
    venue: 'Progressive Field',
    primaryColor: '#00385D',
  },
  {
    id: 116,
    abbrev: 'DET',
    slug: 'det',
    name: 'Detroit Tigers',
    shortName: 'Tigers',
    city: 'Detroit',
    league: 'AL',
    division: 'Central',
    venue: 'Comerica Park',
    primaryColor: '#0C2340',
  },
  {
    id: 118,
    abbrev: 'KC',
    slug: 'kc',
    name: 'Kansas City Royals',
    shortName: 'Royals',
    city: 'Kansas City',
    league: 'AL',
    division: 'Central',
    venue: 'Kauffman Stadium',
    primaryColor: '#004687',
  },
  {
    id: 142,
    abbrev: 'MIN',
    slug: 'min',
    name: 'Minnesota Twins',
    shortName: 'Twins',
    city: 'Minnesota',
    league: 'AL',
    division: 'Central',
    venue: 'Target Field',
    primaryColor: '#002B5C',
  },

  // American League West
  {
    id: 117,
    abbrev: 'HOU',
    slug: 'hou',
    name: 'Houston Astros',
    shortName: 'Astros',
    city: 'Houston',
    league: 'AL',
    division: 'West',
    venue: 'Minute Maid Park',
    primaryColor: '#002D62',
  },
  {
    id: 108,
    abbrev: 'LAA',
    slug: 'laa',
    name: 'Los Angeles Angels',
    shortName: 'Angels',
    city: 'Los Angeles',
    league: 'AL',
    division: 'West',
    venue: 'Angel Stadium',
    primaryColor: '#003263',
  },
  {
    id: 133,
    abbrev: 'OAK',
    slug: 'oak',
    name: 'Oakland Athletics',
    shortName: 'Athletics',
    city: 'Oakland',
    league: 'AL',
    division: 'West',
    venue: 'Oakland Coliseum',
    primaryColor: '#003831',
  },
  {
    id: 136,
    abbrev: 'SEA',
    slug: 'sea',
    name: 'Seattle Mariners',
    shortName: 'Mariners',
    city: 'Seattle',
    league: 'AL',
    division: 'West',
    venue: 'T-Mobile Park',
    primaryColor: '#0C2C56',
  },
  {
    id: 140,
    abbrev: 'TEX',
    slug: 'tex',
    name: 'Texas Rangers',
    shortName: 'Rangers',
    city: 'Texas',
    league: 'AL',
    division: 'West',
    venue: 'Globe Life Field',
    primaryColor: '#003278',
  },

  // National League East
  {
    id: 144,
    abbrev: 'ATL',
    slug: 'atl',
    name: 'Atlanta Braves',
    shortName: 'Braves',
    city: 'Atlanta',
    league: 'NL',
    division: 'East',
    venue: 'Truist Park',
    primaryColor: '#CE1141',
  },
  {
    id: 146,
    abbrev: 'MIA',
    slug: 'mia',
    name: 'Miami Marlins',
    shortName: 'Marlins',
    city: 'Miami',
    league: 'NL',
    division: 'East',
    venue: 'loanDepot park',
    primaryColor: '#00A3E0',
  },
  {
    id: 121,
    abbrev: 'NYM',
    slug: 'nym',
    name: 'New York Mets',
    shortName: 'Mets',
    city: 'New York',
    league: 'NL',
    division: 'East',
    venue: 'Citi Field',
    primaryColor: '#002D72',
  },
  {
    id: 143,
    abbrev: 'PHI',
    slug: 'phi',
    name: 'Philadelphia Phillies',
    shortName: 'Phillies',
    city: 'Philadelphia',
    league: 'NL',
    division: 'East',
    venue: 'Citizens Bank Park',
    primaryColor: '#E81828',
  },
  {
    id: 120,
    abbrev: 'WSH',
    slug: 'wsh',
    name: 'Washington Nationals',
    shortName: 'Nationals',
    city: 'Washington',
    league: 'NL',
    division: 'East',
    venue: 'Nationals Park',
    primaryColor: '#AB0003',
  },

  // National League Central
  {
    id: 112,
    abbrev: 'CHC',
    slug: 'chc',
    name: 'Chicago Cubs',
    shortName: 'Cubs',
    city: 'Chicago',
    league: 'NL',
    division: 'Central',
    venue: 'Wrigley Field',
    primaryColor: '#0E3386',
  },
  {
    id: 113,
    abbrev: 'CIN',
    slug: 'cin',
    name: 'Cincinnati Reds',
    shortName: 'Reds',
    city: 'Cincinnati',
    league: 'NL',
    division: 'Central',
    venue: 'Great American Ball Park',
    primaryColor: '#C6011F',
  },
  {
    id: 158,
    abbrev: 'MIL',
    slug: 'mil',
    name: 'Milwaukee Brewers',
    shortName: 'Brewers',
    city: 'Milwaukee',
    league: 'NL',
    division: 'Central',
    venue: 'American Family Field',
    primaryColor: '#12284B',
  },
  {
    id: 134,
    abbrev: 'PIT',
    slug: 'pit',
    name: 'Pittsburgh Pirates',
    shortName: 'Pirates',
    city: 'Pittsburgh',
    league: 'NL',
    division: 'Central',
    venue: 'PNC Park',
    primaryColor: '#27251F',
  },
  {
    id: 138,
    abbrev: 'STL',
    slug: 'stl',
    name: 'St. Louis Cardinals',
    shortName: 'Cardinals',
    city: 'St. Louis',
    league: 'NL',
    division: 'Central',
    venue: 'Busch Stadium',
    primaryColor: '#C41E3A',
  },

  // National League West
  {
    id: 109,
    abbrev: 'ARI',
    slug: 'ari',
    name: 'Arizona Diamondbacks',
    shortName: 'Diamondbacks',
    city: 'Arizona',
    league: 'NL',
    division: 'West',
    venue: 'Chase Field',
    primaryColor: '#A71930',
  },
  {
    id: 115,
    abbrev: 'COL',
    slug: 'col',
    name: 'Colorado Rockies',
    shortName: 'Rockies',
    city: 'Colorado',
    league: 'NL',
    division: 'West',
    venue: 'Coors Field',
    primaryColor: '#33006F',
  },
  {
    id: 119,
    abbrev: 'LAD',
    slug: 'lad',
    name: 'Los Angeles Dodgers',
    shortName: 'Dodgers',
    city: 'Los Angeles',
    league: 'NL',
    division: 'West',
    venue: 'Dodger Stadium',
    primaryColor: '#005A9C',
  },
  {
    id: 135,
    abbrev: 'SD',
    slug: 'sd',
    name: 'San Diego Padres',
    shortName: 'Padres',
    city: 'San Diego',
    league: 'NL',
    division: 'West',
    venue: 'Petco Park',
    primaryColor: '#2F241D',
  },
  {
    id: 137,
    abbrev: 'SF',
    slug: 'sf',
    name: 'San Francisco Giants',
    shortName: 'Giants',
    city: 'San Francisco',
    league: 'NL',
    division: 'West',
    venue: 'Oracle Park',
    primaryColor: '#FD5A1E',
  },
];

// Build lookup maps for fast access
const teamBySlug = new Map<string, MLBTeamInfo>();
const teamByAbbrev = new Map<string, MLBTeamInfo>();
const teamById = new Map<number, MLBTeamInfo>();

MLB_TEAMS.forEach((team) => {
  teamBySlug.set(team.slug, team);
  teamByAbbrev.set(team.abbrev, team);
  teamById.set(team.id, team);
});

/**
 * Get team by URL slug (e.g., "stl")
 */
export function getTeamBySlug(slug: string): MLBTeamInfo | undefined {
  return teamBySlug.get(slug.toLowerCase());
}

/**
 * Get team by abbreviation (e.g., "STL")
 */
export function getTeamByAbbrev(abbrev: string): MLBTeamInfo | undefined {
  return teamByAbbrev.get(abbrev.toUpperCase());
}

/**
 * Get team by MLB Stats API ID (e.g., 138)
 */
export function getTeamById(id: number): MLBTeamInfo | undefined {
  return teamById.get(id);
}

/**
 * Get MLB API ID from slug (e.g., "stl" → 138)
 */
export function getTeamIdFromSlug(slug: string): number | undefined {
  return teamBySlug.get(slug.toLowerCase())?.id;
}

/**
 * Get all teams for a league
 */
export function getTeamsByLeague(league: 'AL' | 'NL'): MLBTeamInfo[] {
  return MLB_TEAMS.filter((team) => team.league === league);
}

/**
 * Get all teams for a division
 */
export function getTeamsByDivision(
  league: 'AL' | 'NL',
  division: 'East' | 'Central' | 'West'
): MLBTeamInfo[] {
  return MLB_TEAMS.filter((team) => team.league === league && team.division === division);
}

/**
 * Get teams grouped by division
 */
export function getTeamsGroupedByDivision(): Record<string, MLBTeamInfo[]> {
  const grouped: Record<string, MLBTeamInfo[]> = {};

  MLB_TEAMS.forEach((team) => {
    const key = `${team.league} ${team.division}`;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(team);
  });

  return grouped;
}

/**
 * Division ordering for display
 */
export const DIVISION_ORDER = [
  'AL East',
  'AL Central',
  'AL West',
  'NL East',
  'NL Central',
  'NL West',
] as const;

export type DivisionKey = (typeof DIVISION_ORDER)[number];
