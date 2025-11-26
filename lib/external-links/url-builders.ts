/**
 * BLAZE SPORTS INTEL | External Links URL Builders
 *
 * Generates URLs to authoritative external sources for players and teams.
 * All links open in new tabs for better UX.
 *
 * Sources supported:
 * - MLB: Baseball-Reference, Baseball Savant, FanGraphs, ESPN, Official Team Sites
 * - NFL: Pro-Football-Reference, ESPN, NFL.com, Official Team Sites
 * - College: 247Sports, MaxPreps, SBNation, On3, Rivals, D1Baseball, Official School Sites
 *
 * @module external-links/url-builders
 * @version 1.0.0
 */

// ============================================================================
// MLB External Links
// ============================================================================

export interface MLBPlayerLinks {
  baseballReference?: string;
  baseballSavant?: string;
  fangraphs?: string;
  espn?: string;
  mlbOfficial?: string;
  twitter?: string;
}

export interface MLBTeamLinks {
  baseballReference: string;
  espn: string;
  official: string;
  twitter?: string;
}

/**
 * Generate a Baseball-Reference player URL from name
 * Format: baseball-reference.com/players/{firstLetter}/{firstFiveLast}{firstTwo}{nn}.shtml
 * Example: Aaron Judge -> /players/j/judgear01.shtml
 */
export function getBaseballReferencePlayerUrl(
  firstName: string,
  lastName: string,
  suffix: string = '01'
): string {
  const firstLetter = lastName.charAt(0).toLowerCase();
  const lastPart = lastName.toLowerCase().slice(0, 5).padEnd(5, 'x');
  const firstPart = firstName.toLowerCase().slice(0, 2).padEnd(2, 'x');
  const slug = `${lastPart}${firstPart}${suffix}`;
  return `https://www.baseball-reference.com/players/${firstLetter}/${slug}.shtml`;
}

/**
 * Generate a Baseball Savant (Statcast) player URL from MLBAM ID
 */
export function getBaseballSavantUrl(mlbamId: number, playerName: string): string {
  const slug = playerName
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z-]/g, '');
  return `https://baseballsavant.mlb.com/savant-player/${slug}-${mlbamId}`;
}

/**
 * Generate a FanGraphs player URL
 * Note: FanGraphs uses its own playerid system, not MLBAM IDs
 */
export function getFangraphsSearchUrl(playerName: string): string {
  const query = encodeURIComponent(playerName);
  return `https://www.fangraphs.com/players?s=${query}`;
}

/**
 * Generate ESPN MLB player URL
 */
export function getESPNMLBPlayerUrl(espnId: string | number, playerName: string): string {
  const slug = playerName
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z-]/g, '');
  return `https://www.espn.com/mlb/player/_/id/${espnId}/${slug}`;
}

/**
 * Generate official MLB team URL
 */
export function getMLBTeamUrl(teamAbbrev: string): string {
  const abbrevMap: Record<string, string> = {
    STL: 'cardinals',
    NYY: 'yankees',
    BOS: 'redsox',
    LAD: 'dodgers',
    CHC: 'cubs',
    SF: 'giants',
    ATL: 'braves',
    HOU: 'astros',
    PHI: 'phillies',
    NYM: 'mets',
    SD: 'padres',
    TEX: 'rangers',
    SEA: 'mariners',
    MIN: 'twins',
    CLE: 'guardians',
    TB: 'rays',
    BAL: 'orioles',
    TOR: 'bluejays',
    CWS: 'whitesox',
    KC: 'royals',
    DET: 'tigers',
    OAK: 'athletics',
    LAA: 'angels',
    ARI: 'dbacks',
    COL: 'rockies',
    MIA: 'marlins',
    MIL: 'brewers',
    CIN: 'reds',
    PIT: 'pirates',
    WSH: 'nationals',
  };
  const slug = abbrevMap[teamAbbrev.toUpperCase()] || teamAbbrev.toLowerCase();
  return `https://www.mlb.com/${slug}`;
}

/**
 * Get all MLB external links for a player
 */
export function getMLBPlayerExternalLinks(
  playerName: string,
  mlbamId?: number,
  teamAbbrev?: string
): MLBPlayerLinks {
  const [firstName, ...lastParts] = playerName.split(' ');
  const lastName = lastParts.join(' ');

  return {
    baseballReference: getBaseballReferencePlayerUrl(firstName, lastName),
    baseballSavant: mlbamId ? getBaseballSavantUrl(mlbamId, playerName) : undefined,
    fangraphs: getFangraphsSearchUrl(playerName),
    espn: `https://www.espn.com/mlb/player/_/name/${firstName.toLowerCase()}-${lastName.toLowerCase().replace(/\s+/g, '-')}`,
    mlbOfficial: teamAbbrev ? getMLBTeamUrl(teamAbbrev) : undefined,
  };
}

// ============================================================================
// NFL External Links
// ============================================================================

export interface NFLPlayerLinks {
  proFootballReference?: string;
  espn?: string;
  nflOfficial?: string;
  pfr?: string;
}

/**
 * Generate a Pro-Football-Reference player URL
 * Format: pro-football-reference.com/players/{firstLetter}/{FirstFourLast}{FirstTwo}{nn}.htm
 */
export function getProFootballReferenceUrl(
  firstName: string,
  lastName: string,
  suffix: string = '00'
): string {
  const firstLetter = lastName.charAt(0).toUpperCase();
  const lastPart = lastName.slice(0, 4);
  const firstPart = firstName.slice(0, 2);
  const slug = `${lastPart}${firstPart}${suffix}`;
  return `https://www.pro-football-reference.com/players/${firstLetter}/${slug}.htm`;
}

/**
 * Generate ESPN NFL player URL
 */
export function getESPNNFLPlayerUrl(espnId: string | number, playerName: string): string {
  const slug = playerName
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z-]/g, '');
  return `https://www.espn.com/nfl/player/_/id/${espnId}/${slug}`;
}

/**
 * Generate NFL.com player URL
 */
export function getNFLOfficialPlayerUrl(playerName: string): string {
  const slug = playerName
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z-]/g, '');
  return `https://www.nfl.com/players/${slug}/`;
}

/**
 * Get all NFL external links for a player
 */
export function getNFLPlayerExternalLinks(
  playerName: string,
  espnId?: string | number
): NFLPlayerLinks {
  const [firstName, ...lastParts] = playerName.split(' ');
  const lastName = lastParts.join(' ');

  return {
    proFootballReference: getProFootballReferenceUrl(firstName, lastName),
    espn: espnId ? getESPNNFLPlayerUrl(espnId, playerName) : undefined,
    nflOfficial: getNFLOfficialPlayerUrl(playerName),
  };
}

// ============================================================================
// College Sports External Links
// ============================================================================

export interface CollegeTeamLinks {
  espn: string;
  official: string;
  d1baseball?: string;
  sportsReference?: string;
  '247sports': string;
  on3: string;
  rivals?: string;
  sbnation?: string;
}

/**
 * Map of school slugs to official athletic site domains
 */
const SCHOOL_DOMAINS: Record<string, string> = {
  texas: 'texaslonghorns.com',
  'texas-am': '12thman.com',
  lsu: 'lsusports.net',
  florida: 'floridagators.com',
  tennessee: 'utsports.com',
  vanderbilt: 'vucommodores.com',
  arkansas: 'arkansasrazorbacks.com',
  'ole-miss': 'olemisssports.com',
  'mississippi-state': 'hailstate.com',
  auburn: 'auburntigers.com',
  alabama: 'rolltide.com',
  georgia: 'georgiadogs.com',
  'south-carolina': 'gamecocksonline.com',
  kentucky: 'ukathletics.com',
  missouri: 'mutigers.com',
  oklahoma: 'soonersports.com',
  tcu: 'gofrogs.com',
  'oklahoma-state': 'okstate.com',
  baylor: 'baylorbears.com',
  'texas-tech': 'texastech.com',
  stanford: 'gostanford.com',
  'oregon-state': 'osubeavers.com',
  'wake-forest': 'godeacs.com',
  virginia: 'virginiasports.com',
  'nc-state': 'gopack.com',
  miami: 'miamihurricanes.com',
  clemson: 'clemsontigers.com',
  'notre-dame': 'und.com',
};

/**
 * Map of school slugs to ESPN team IDs
 */
const ESPN_TEAM_IDS: Record<string, string> = {
  texas: '251',
  'texas-am': '245',
  lsu: '99',
  florida: '57',
  tennessee: '2633',
  vanderbilt: '238',
  arkansas: '8',
  'ole-miss': '145',
  'mississippi-state': '344',
  auburn: '2',
  alabama: '333',
  georgia: '61',
  'south-carolina': '2579',
  kentucky: '96',
  missouri: '142',
  oklahoma: '201',
};

/**
 * Get official school athletic site URL for a sport
 */
export function getOfficialSchoolUrl(schoolSlug: string, sport: 'baseball' | 'football'): string {
  const domain = SCHOOL_DOMAINS[schoolSlug] || `${schoolSlug}.com`;
  return `https://${domain}/sports/${sport}`;
}

/**
 * Get D1Baseball team URL
 */
export function getD1BaseballUrl(schoolSlug: string): string {
  return `https://d1baseball.com/team/${schoolSlug}`;
}

/**
 * Get 247Sports school URL
 */
export function get247SportsUrl(schoolSlug: string): string {
  const cleanSlug = schoolSlug.replace(/-/g, '');
  return `https://247sports.com/college/${cleanSlug}/`;
}

/**
 * Get On3 school URL
 */
export function getOn3Url(schoolSlug: string): string {
  return `https://www.on3.com/teams/${schoolSlug}/`;
}

/**
 * Get Rivals school URL
 */
export function getRivalsUrl(schoolSlug: string): string {
  const cleanSlug = schoolSlug.replace(/-/g, '');
  return `https://${cleanSlug}.rivals.com/`;
}

/**
 * Get SBNation team blog URL
 */
const SBNATION_SITES: Record<string, string> = {
  texas: 'burntorangenation.com',
  'texas-am': 'goodbullhunting.com',
  lsu: 'andthevalleyshook.com',
  florida: 'alligatorarmy.com',
  tennessee: 'rockytoptalk.com',
  arkansas: 'arkansasfight.com',
  'ole-miss': 'redfiredmind.com',
  auburn: 'collegeandmagnolia.com',
  alabama: 'rollbamaroll.com',
  georgia: 'dawgsports.com',
  oklahoma: 'crimsonandcreammachine.com',
};

export function getSBNationUrl(schoolSlug: string): string | undefined {
  const site = SBNATION_SITES[schoolSlug];
  return site ? `https://www.${site}/` : undefined;
}

/**
 * Get ESPN college team URL
 */
export function getESPNCollegeUrl(schoolSlug: string, sport: 'baseball' | 'football'): string {
  const espnId = ESPN_TEAM_IDS[schoolSlug];
  const sportPath = sport === 'baseball' ? 'college-baseball' : 'college-football';
  if (espnId) {
    return `https://www.espn.com/${sportPath}/team/_/id/${espnId}`;
  }
  return `https://www.espn.com/${sportPath}/team/_/name/${schoolSlug}`;
}

/**
 * Get all external links for a college team
 */
export function getCollegeTeamExternalLinks(
  schoolSlug: string,
  sport: 'baseball' | 'football'
): CollegeTeamLinks {
  return {
    espn: getESPNCollegeUrl(schoolSlug, sport),
    official: getOfficialSchoolUrl(schoolSlug, sport),
    d1baseball: sport === 'baseball' ? getD1BaseballUrl(schoolSlug) : undefined,
    '247sports': get247SportsUrl(schoolSlug),
    on3: getOn3Url(schoolSlug),
    rivals: getRivalsUrl(schoolSlug),
    sbnation: getSBNationUrl(schoolSlug),
  };
}

// ============================================================================
// Youth/Recruiting External Links
// ============================================================================

/**
 * Get Perfect Game player search URL
 */
export function getPerfectGameSearchUrl(playerName: string): string {
  const query = encodeURIComponent(playerName);
  return `https://www.perfectgame.org/Search/Search.aspx?search=${query}`;
}

/**
 * Get MaxPreps search URL
 */
export function getMaxPrepsSearchUrl(playerName: string): string {
  const query = encodeURIComponent(playerName);
  return `https://www.maxpreps.com/search/default.aspx?type=athlete&search=${query}`;
}

/**
 * Get Prep Baseball Report search URL
 */
export function getPrepBaseballReportSearchUrl(playerName: string): string {
  const query = encodeURIComponent(playerName);
  return `https://www.prepbaseballreport.com/search?q=${query}`;
}

// ============================================================================
// Utility Types for Components
// ============================================================================

export interface ExternalLink {
  name: string;
  url: string;
  icon:
    | 'espn'
    | 'bbref'
    | 'savant'
    | 'fangraphs'
    | 'official'
    | '247'
    | 'on3'
    | 'rivals'
    | 'd1baseball'
    | 'pfr'
    | 'nfl'
    | 'pg'
    | 'maxpreps';
  category: 'stats' | 'news' | 'recruiting' | 'official';
}

/**
 * Get formatted external links array for a player (for use in components)
 */
export function getPlayerExternalLinksArray(
  sport: 'baseball' | 'football',
  playerName: string,
  options?: {
    mlbamId?: number;
    espnId?: string | number;
    teamAbbrev?: string;
  }
): ExternalLink[] {
  const links: ExternalLink[] = [];

  if (sport === 'baseball') {
    const mlbLinks = getMLBPlayerExternalLinks(playerName, options?.mlbamId, options?.teamAbbrev);

    if (mlbLinks.baseballReference) {
      links.push({
        name: 'Baseball-Reference',
        url: mlbLinks.baseballReference,
        icon: 'bbref',
        category: 'stats',
      });
    }
    if (mlbLinks.baseballSavant) {
      links.push({
        name: 'Baseball Savant',
        url: mlbLinks.baseballSavant,
        icon: 'savant',
        category: 'stats',
      });
    }
    if (mlbLinks.fangraphs) {
      links.push({
        name: 'FanGraphs',
        url: mlbLinks.fangraphs,
        icon: 'fangraphs',
        category: 'stats',
      });
    }
    if (mlbLinks.espn) {
      links.push({
        name: 'ESPN',
        url: mlbLinks.espn,
        icon: 'espn',
        category: 'news',
      });
    }
    if (mlbLinks.mlbOfficial) {
      links.push({
        name: 'MLB.com',
        url: mlbLinks.mlbOfficial,
        icon: 'official',
        category: 'official',
      });
    }
  } else if (sport === 'football') {
    const nflLinks = getNFLPlayerExternalLinks(playerName, options?.espnId);

    if (nflLinks.proFootballReference) {
      links.push({
        name: 'Pro-Football-Reference',
        url: nflLinks.proFootballReference,
        icon: 'pfr',
        category: 'stats',
      });
    }
    if (nflLinks.espn) {
      links.push({
        name: 'ESPN',
        url: nflLinks.espn,
        icon: 'espn',
        category: 'news',
      });
    }
    if (nflLinks.nflOfficial) {
      links.push({
        name: 'NFL.com',
        url: nflLinks.nflOfficial,
        icon: 'nfl',
        category: 'official',
      });
    }
  }

  return links;
}
