/**
 * BSI Team Logo Utility
 *
 * Provides team logo URLs from ESPN CDN for NFL, NBA, and MLB teams.
 * Uses team abbreviations to fetch consistent logo assets.
 */

type Sport = 'nfl' | 'nba' | 'mlb' | 'ncaaf' | 'ncaab';

interface TeamLogoConfig {
  espnId: string;
  abbreviation: string;
}

// ESPN team ID mappings for each sport
const NFL_TEAMS: Record<string, TeamLogoConfig> = {
  ARI: { espnId: '22', abbreviation: 'ARI' },
  ATL: { espnId: '1', abbreviation: 'ATL' },
  BAL: { espnId: '33', abbreviation: 'BAL' },
  BUF: { espnId: '2', abbreviation: 'BUF' },
  CAR: { espnId: '29', abbreviation: 'CAR' },
  CHI: { espnId: '3', abbreviation: 'CHI' },
  CIN: { espnId: '4', abbreviation: 'CIN' },
  CLE: { espnId: '5', abbreviation: 'CLE' },
  DAL: { espnId: '6', abbreviation: 'DAL' },
  DEN: { espnId: '7', abbreviation: 'DEN' },
  DET: { espnId: '8', abbreviation: 'DET' },
  GB: { espnId: '9', abbreviation: 'GB' },
  HOU: { espnId: '34', abbreviation: 'HOU' },
  IND: { espnId: '11', abbreviation: 'IND' },
  JAX: { espnId: '30', abbreviation: 'JAX' },
  KC: { espnId: '12', abbreviation: 'KC' },
  LV: { espnId: '13', abbreviation: 'LV' },
  LAC: { espnId: '24', abbreviation: 'LAC' },
  LAR: { espnId: '14', abbreviation: 'LAR' },
  MIA: { espnId: '15', abbreviation: 'MIA' },
  MIN: { espnId: '16', abbreviation: 'MIN' },
  NE: { espnId: '17', abbreviation: 'NE' },
  NO: { espnId: '18', abbreviation: 'NO' },
  NYG: { espnId: '19', abbreviation: 'NYG' },
  NYJ: { espnId: '20', abbreviation: 'NYJ' },
  PHI: { espnId: '21', abbreviation: 'PHI' },
  PIT: { espnId: '23', abbreviation: 'PIT' },
  SF: { espnId: '25', abbreviation: 'SF' },
  SEA: { espnId: '26', abbreviation: 'SEA' },
  TB: { espnId: '27', abbreviation: 'TB' },
  TEN: { espnId: '10', abbreviation: 'TEN' },
  WAS: { espnId: '28', abbreviation: 'WAS' },
};

const NBA_TEAMS: Record<string, TeamLogoConfig> = {
  ATL: { espnId: '1', abbreviation: 'ATL' },
  BOS: { espnId: '2', abbreviation: 'BOS' },
  BKN: { espnId: '17', abbreviation: 'BKN' },
  CHA: { espnId: '30', abbreviation: 'CHA' },
  CHI: { espnId: '4', abbreviation: 'CHI' },
  CLE: { espnId: '5', abbreviation: 'CLE' },
  DAL: { espnId: '6', abbreviation: 'DAL' },
  DEN: { espnId: '7', abbreviation: 'DEN' },
  DET: { espnId: '8', abbreviation: 'DET' },
  GSW: { espnId: '9', abbreviation: 'GSW' },
  HOU: { espnId: '10', abbreviation: 'HOU' },
  IND: { espnId: '11', abbreviation: 'IND' },
  LAC: { espnId: '12', abbreviation: 'LAC' },
  LAL: { espnId: '13', abbreviation: 'LAL' },
  MEM: { espnId: '29', abbreviation: 'MEM' },
  MIA: { espnId: '14', abbreviation: 'MIA' },
  MIL: { espnId: '15', abbreviation: 'MIL' },
  MIN: { espnId: '16', abbreviation: 'MIN' },
  NOP: { espnId: '3', abbreviation: 'NOP' },
  NYK: { espnId: '18', abbreviation: 'NYK' },
  OKC: { espnId: '25', abbreviation: 'OKC' },
  ORL: { espnId: '19', abbreviation: 'ORL' },
  PHI: { espnId: '20', abbreviation: 'PHI' },
  PHX: { espnId: '21', abbreviation: 'PHX' },
  POR: { espnId: '22', abbreviation: 'POR' },
  SAC: { espnId: '23', abbreviation: 'SAC' },
  SAS: { espnId: '24', abbreviation: 'SAS' },
  TOR: { espnId: '28', abbreviation: 'TOR' },
  UTA: { espnId: '26', abbreviation: 'UTA' },
  WAS: { espnId: '27', abbreviation: 'WAS' },
};

const MLB_TEAMS: Record<string, TeamLogoConfig> = {
  ARI: { espnId: '29', abbreviation: 'ARI' },
  ATL: { espnId: '15', abbreviation: 'ATL' },
  BAL: { espnId: '1', abbreviation: 'BAL' },
  BOS: { espnId: '2', abbreviation: 'BOS' },
  CHC: { espnId: '16', abbreviation: 'CHC' },
  CWS: { espnId: '4', abbreviation: 'CWS' },
  CIN: { espnId: '17', abbreviation: 'CIN' },
  CLE: { espnId: '5', abbreviation: 'CLE' },
  COL: { espnId: '27', abbreviation: 'COL' },
  DET: { espnId: '6', abbreviation: 'DET' },
  HOU: { espnId: '18', abbreviation: 'HOU' },
  KC: { espnId: '7', abbreviation: 'KC' },
  LAA: { espnId: '3', abbreviation: 'LAA' },
  LAD: { espnId: '19', abbreviation: 'LAD' },
  MIA: { espnId: '28', abbreviation: 'MIA' },
  MIL: { espnId: '8', abbreviation: 'MIL' },
  MIN: { espnId: '9', abbreviation: 'MIN' },
  NYM: { espnId: '21', abbreviation: 'NYM' },
  NYY: { espnId: '10', abbreviation: 'NYY' },
  OAK: { espnId: '11', abbreviation: 'OAK' },
  PHI: { espnId: '22', abbreviation: 'PHI' },
  PIT: { espnId: '23', abbreviation: 'PIT' },
  SD: { espnId: '25', abbreviation: 'SD' },
  SF: { espnId: '26', abbreviation: 'SF' },
  SEA: { espnId: '12', abbreviation: 'SEA' },
  STL: { espnId: '24', abbreviation: 'STL' },
  TB: { espnId: '30', abbreviation: 'TB' },
  TEX: { espnId: '13', abbreviation: 'TEX' },
  TOR: { espnId: '14', abbreviation: 'TOR' },
  WSH: { espnId: '20', abbreviation: 'WSH' },
};

/**
 * Get ESPN CDN URL for a team logo
 */
export function getTeamLogoUrl(
  abbreviation: string,
  sport: Sport,
  size: 'small' | 'medium' | 'large' = 'medium'
): string | null {
  const sizeMap = {
    small: '100',
    medium: '500',
    large: '500-dark',
  };

  const dimension = sizeMap[size];
  const abbr = abbreviation.toUpperCase();

  let teamConfig: TeamLogoConfig | undefined;
  let sportPath: string;

  switch (sport) {
    case 'nfl':
      teamConfig = NFL_TEAMS[abbr];
      sportPath = 'nfl';
      break;
    case 'nba':
      teamConfig = NBA_TEAMS[abbr];
      sportPath = 'nba';
      break;
    case 'mlb':
      teamConfig = MLB_TEAMS[abbr];
      sportPath = 'mlb';
      break;
    case 'ncaaf':
      sportPath = 'college-football';
      return `https://a.espncdn.com/i/teamlogos/ncaa/500/${abbr.toLowerCase()}.png`;
    case 'ncaab':
      sportPath = 'college-basketball';
      return `https://a.espncdn.com/i/teamlogos/ncaa/500/${abbr.toLowerCase()}.png`;
    default:
      return null;
  }

  if (!teamConfig) {
    return null;
  }

  return `https://a.espncdn.com/i/teamlogos/${sportPath}/${dimension}/${teamConfig.espnId}.png`;
}

/**
 * Get team logo URL with fallback to abbreviation badge
 */
export function getTeamLogo(
  abbreviation: string,
  sport: Sport = 'nfl'
): { url: string | null; fallback: string } {
  return {
    url: getTeamLogoUrl(abbreviation, sport),
    fallback: abbreviation.toUpperCase().slice(0, 3),
  };
}

/**
 * TeamLogo component props helper
 */
export interface TeamLogoProps {
  abbreviation: string;
  sport: Sport;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

export default {
  getTeamLogoUrl,
  getTeamLogo,
  NFL_TEAMS,
  NBA_TEAMS,
  MLB_TEAMS,
};
