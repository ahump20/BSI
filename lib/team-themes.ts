/**
 * BSI Team Color Theming System
 *
 * Provides dynamic team color theming for cards, badges, and UI elements.
 * Supports major college and pro teams with fallback colors.
 */

export interface TeamColors {
  primary: string;
  secondary: string;
  accent?: string;
  text?: string;
}

export interface TeamTheme {
  name: string;
  abbreviation: string;
  colors: TeamColors;
  logo?: string;
}

// College Baseball Teams
export const collegeBaseballTeams: Record<string, TeamTheme> = {
  // SEC
  texas: {
    name: 'Texas Longhorns',
    abbreviation: 'TEX',
    colors: { primary: '#bf5700', secondary: '#ffffff', accent: '#333f48' },
  },
  lsu: {
    name: 'LSU Tigers',
    abbreviation: 'LSU',
    colors: { primary: '#461d7c', secondary: '#fdd023' },
  },
  tennessee: {
    name: 'Tennessee Volunteers',
    abbreviation: 'TENN',
    colors: { primary: '#ff8200', secondary: '#ffffff' },
  },
  arkansas: {
    name: 'Arkansas Razorbacks',
    abbreviation: 'ARK',
    colors: { primary: '#9d2235', secondary: '#ffffff' },
  },
  florida: {
    name: 'Florida Gators',
    abbreviation: 'FLA',
    colors: { primary: '#0021a5', secondary: '#fa4616' },
  },
  vanderbilt: {
    name: 'Vanderbilt Commodores',
    abbreviation: 'VAN',
    colors: { primary: '#866d4b', secondary: '#000000' },
  },
  olemiss: {
    name: 'Ole Miss Rebels',
    abbreviation: 'MISS',
    colors: { primary: '#ce1126', secondary: '#14213d' },
  },
  mississippiState: {
    name: 'Mississippi State Bulldogs',
    abbreviation: 'MSST',
    colors: { primary: '#660000', secondary: '#ffffff' },
  },
  texasAM: {
    name: 'Texas A&M Aggies',
    abbreviation: 'TAMU',
    colors: { primary: '#500000', secondary: '#ffffff' },
  },
  auburn: {
    name: 'Auburn Tigers',
    abbreviation: 'AUB',
    colors: { primary: '#0c2340', secondary: '#e87722' },
  },
  alabama: {
    name: 'Alabama Crimson Tide',
    abbreviation: 'ALA',
    colors: { primary: '#9e1b32', secondary: '#828a8f' },
  },
  georgia: {
    name: 'Georgia Bulldogs',
    abbreviation: 'UGA',
    colors: { primary: '#ba0c2f', secondary: '#000000' },
  },
  kentucky: {
    name: 'Kentucky Wildcats',
    abbreviation: 'UK',
    colors: { primary: '#0033a0', secondary: '#ffffff' },
  },
  missouri: {
    name: 'Missouri Tigers',
    abbreviation: 'MIZ',
    colors: { primary: '#f1b82d', secondary: '#000000' },
  },
  southCarolina: {
    name: 'South Carolina Gamecocks',
    abbreviation: 'SC',
    colors: { primary: '#73000a', secondary: '#000000' },
  },
  oklahoma: {
    name: 'Oklahoma Sooners',
    abbreviation: 'OU',
    colors: { primary: '#841617', secondary: '#fdf9d8' },
  },

  // Big 12
  texasTech: {
    name: 'Texas Tech Red Raiders',
    abbreviation: 'TTU',
    colors: { primary: '#cc0000', secondary: '#000000' },
  },
  tcu: {
    name: 'TCU Horned Frogs',
    abbreviation: 'TCU',
    colors: { primary: '#4d1979', secondary: '#a3a9ac' },
  },
  oklahomaState: {
    name: 'Oklahoma State Cowboys',
    abbreviation: 'OKST',
    colors: { primary: '#ff7300', secondary: '#000000' },
  },
  westVirginia: {
    name: 'West Virginia Mountaineers',
    abbreviation: 'WVU',
    colors: { primary: '#002855', secondary: '#eaaa00' },
  },
  kansas: {
    name: 'Kansas Jayhawks',
    abbreviation: 'KU',
    colors: { primary: '#0051ba', secondary: '#e8000d' },
  },
  kansasState: {
    name: 'Kansas State Wildcats',
    abbreviation: 'KSU',
    colors: { primary: '#512888', secondary: '#d1d1d1' },
  },
  baylor: {
    name: 'Baylor Bears',
    abbreviation: 'BAY',
    colors: { primary: '#003015', secondary: '#ffc72c' },
  },

  // ACC
  miami: {
    name: 'Miami Hurricanes',
    abbreviation: 'MIA',
    colors: { primary: '#f47321', secondary: '#005030' },
  },
  floridaState: {
    name: 'Florida State Seminoles',
    abbreviation: 'FSU',
    colors: { primary: '#782f40', secondary: '#ceb888' },
  },
  clemson: {
    name: 'Clemson Tigers',
    abbreviation: 'CLEM',
    colors: { primary: '#f56600', secondary: '#522d80' },
  },
  northCarolina: {
    name: 'North Carolina Tar Heels',
    abbreviation: 'UNC',
    colors: { primary: '#7bafd4', secondary: '#13294b' },
  },
  ncState: {
    name: 'NC State Wolfpack',
    abbreviation: 'NCST',
    colors: { primary: '#cc0000', secondary: '#000000' },
  },
  duke: {
    name: 'Duke Blue Devils',
    abbreviation: 'DUKE',
    colors: { primary: '#003087', secondary: '#ffffff' },
  },
  virginia: {
    name: 'Virginia Cavaliers',
    abbreviation: 'UVA',
    colors: { primary: '#232d4b', secondary: '#f84c1e' },
  },
  virginiatech: {
    name: 'Virginia Tech Hokies',
    abbreviation: 'VT',
    colors: { primary: '#630031', secondary: '#cf4420' },
  },
  wakeForest: {
    name: 'Wake Forest Demon Deacons',
    abbreviation: 'WAKE',
    colors: { primary: '#9e7e38', secondary: '#000000' },
  },
  louisville: {
    name: 'Louisville Cardinals',
    abbreviation: 'LOU',
    colors: { primary: '#ad0000', secondary: '#000000' },
  },
  notredame: {
    name: 'Notre Dame Fighting Irish',
    abbreviation: 'ND',
    colors: { primary: '#0c2340', secondary: '#c99700' },
  },

  // Pac-12 / Big Ten additions
  stanford: {
    name: 'Stanford Cardinal',
    abbreviation: 'STAN',
    colors: { primary: '#8c1515', secondary: '#ffffff' },
  },
  oregon: {
    name: 'Oregon Ducks',
    abbreviation: 'ORE',
    colors: { primary: '#154733', secondary: '#fee123' },
  },
  oregonState: {
    name: 'Oregon State Beavers',
    abbreviation: 'ORST',
    colors: { primary: '#dc4405', secondary: '#000000' },
  },
  ucla: {
    name: 'UCLA Bruins',
    abbreviation: 'UCLA',
    colors: { primary: '#2d68c4', secondary: '#f2a900' },
  },
  arizona: {
    name: 'Arizona Wildcats',
    abbreviation: 'ARIZ',
    colors: { primary: '#cc0033', secondary: '#003366' },
  },
  arizonaState: {
    name: 'Arizona State Sun Devils',
    abbreviation: 'ASU',
    colors: { primary: '#8c1d40', secondary: '#ffc627' },
  },
};

// MLB Teams
export const mlbTeams: Record<string, TeamTheme> = {
  cardinals: {
    name: 'St. Louis Cardinals',
    abbreviation: 'STL',
    colors: { primary: '#c41e3a', secondary: '#0c2340', accent: '#fedb00' },
  },
  rangers: {
    name: 'Texas Rangers',
    abbreviation: 'TEX',
    colors: { primary: '#003278', secondary: '#c0111f' },
  },
  astros: {
    name: 'Houston Astros',
    abbreviation: 'HOU',
    colors: { primary: '#002d62', secondary: '#eb6e1f' },
  },
  dodgers: {
    name: 'Los Angeles Dodgers',
    abbreviation: 'LAD',
    colors: { primary: '#005a9c', secondary: '#ef3e42' },
  },
  yankees: {
    name: 'New York Yankees',
    abbreviation: 'NYY',
    colors: { primary: '#003087', secondary: '#e4002c' },
  },
  braves: {
    name: 'Atlanta Braves',
    abbreviation: 'ATL',
    colors: { primary: '#ce1141', secondary: '#13274f' },
  },
  phillies: {
    name: 'Philadelphia Phillies',
    abbreviation: 'PHI',
    colors: { primary: '#e81828', secondary: '#002d72' },
  },
  orioles: {
    name: 'Baltimore Orioles',
    abbreviation: 'BAL',
    colors: { primary: '#df4601', secondary: '#000000' },
  },
  // Add more as needed
};

// NFL Teams
export const nflTeams: Record<string, TeamTheme> = {
  titans: {
    name: 'Tennessee Titans',
    abbreviation: 'TEN',
    colors: { primary: '#002244', secondary: '#4b92db', accent: '#c8102e' },
  },
  cowboys: {
    name: 'Dallas Cowboys',
    abbreviation: 'DAL',
    colors: { primary: '#003594', secondary: '#869397' },
  },
  texans: {
    name: 'Houston Texans',
    abbreviation: 'HOU',
    colors: { primary: '#03202f', secondary: '#a71930' },
  },
  chiefs: {
    name: 'Kansas City Chiefs',
    abbreviation: 'KC',
    colors: { primary: '#e31837', secondary: '#ffb612' },
  },
  eagles: {
    name: 'Philadelphia Eagles',
    abbreviation: 'PHI',
    colors: { primary: '#004c54', secondary: '#a5acaf' },
  },
  // Add more as needed
};

// Utility functions
export function getTeamTheme(teamId: string): TeamTheme | null {
  const normalizedId = teamId.toLowerCase().replace(/[^a-z]/g, '');

  return (
    collegeBaseballTeams[normalizedId] || mlbTeams[normalizedId] || nflTeams[normalizedId] || null
  );
}

export function getTeamColors(teamId: string): TeamColors {
  const theme = getTeamTheme(teamId);
  return theme?.colors || { primary: '#bf5700', secondary: '#ffffff' };
}

/**
 * Generate CSS custom properties for a team
 */
export function getTeamCSSVars(teamId: string): Record<string, string> {
  const colors = getTeamColors(teamId);
  return {
    '--team-primary': colors.primary,
    '--team-secondary': colors.secondary,
    '--team-accent': colors.accent || colors.primary,
    '--team-text': colors.text || '#ffffff',
  };
}

/**
 * Generate Tailwind-compatible gradient class
 */
export function getTeamGradient(teamId: string): string {
  const colors = getTeamColors(teamId);
  return `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`;
}

/**
 * Get contrasting text color for a background
 */
export function getContrastText(hexColor: string): string {
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#000000' : '#ffffff';
}

export default {
  collegeBaseballTeams,
  mlbTeams,
  nflTeams,
  getTeamTheme,
  getTeamColors,
  getTeamCSSVars,
  getTeamGradient,
  getContrastText,
};
