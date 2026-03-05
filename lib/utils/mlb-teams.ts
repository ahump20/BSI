export interface MLBTeamInfo {
  id: string;
  name: string;
  shortName: string;
  abbreviation: string;
  abbrev: string;
  city: string;
  league: 'AL' | 'NL';
  division: 'East' | 'Central' | 'West';
  slug: string;
  primaryColor: string;
  venue: string;
}

export const MLB_TEAMS: MLBTeamInfo[] = [
  // AL East
  { id: '1', name: 'Yankees', shortName: 'Yankees', abbreviation: 'NYY', abbrev: 'NYY', city: 'New York', league: 'AL', division: 'East', slug: 'yankees', primaryColor: '#003087', venue: 'Yankee Stadium' },
  { id: '2', name: 'Red Sox', shortName: 'Red Sox', abbreviation: 'BOS', abbrev: 'BOS', city: 'Boston', league: 'AL', division: 'East', slug: 'red-sox', primaryColor: '#BD3039', venue: 'Fenway Park' },
  { id: '3', name: 'Blue Jays', shortName: 'Blue Jays', abbreviation: 'TOR', abbrev: 'TOR', city: 'Toronto', league: 'AL', division: 'East', slug: 'blue-jays', primaryColor: '#134A8E', venue: 'Rogers Centre' },
  { id: '4', name: 'Orioles', shortName: 'Orioles', abbreviation: 'BAL', abbrev: 'BAL', city: 'Baltimore', league: 'AL', division: 'East', slug: 'orioles', primaryColor: '#DF4601', venue: 'Oriole Park at Camden Yards' },
  { id: '5', name: 'Rays', shortName: 'Rays', abbreviation: 'TB', abbrev: 'TB', city: 'Tampa Bay', league: 'AL', division: 'East', slug: 'rays', primaryColor: '#092C5C', venue: 'Tropicana Field' },
  // AL Central
  { id: '6', name: 'White Sox', shortName: 'White Sox', abbreviation: 'CWS', abbrev: 'CWS', city: 'Chicago', league: 'AL', division: 'Central', slug: 'white-sox', primaryColor: '#27251F', venue: 'Guaranteed Rate Field' },
  { id: '7', name: 'Guardians', shortName: 'Guardians', abbreviation: 'CLE', abbrev: 'CLE', city: 'Cleveland', league: 'AL', division: 'Central', slug: 'guardians', primaryColor: '#00385D', venue: 'Progressive Field' },
  { id: '8', name: 'Twins', shortName: 'Twins', abbreviation: 'MIN', abbrev: 'MIN', city: 'Minnesota', league: 'AL', division: 'Central', slug: 'twins', primaryColor: '#002B5C', venue: 'Target Field' },
  { id: '9', name: 'Tigers', shortName: 'Tigers', abbreviation: 'DET', abbrev: 'DET', city: 'Detroit', league: 'AL', division: 'Central', slug: 'tigers', primaryColor: '#0C2340', venue: 'Comerica Park' },
  { id: '10', name: 'Royals', shortName: 'Royals', abbreviation: 'KC', abbrev: 'KC', city: 'Kansas City', league: 'AL', division: 'Central', slug: 'royals', primaryColor: '#004687', venue: 'Kauffman Stadium' },
  // AL West
  { id: '11', name: 'Astros', shortName: 'Astros', abbreviation: 'HOU', abbrev: 'HOU', city: 'Houston', league: 'AL', division: 'West', slug: 'astros', primaryColor: '#002D62', venue: 'Minute Maid Park' },
  { id: '12', name: 'Rangers', shortName: 'Rangers', abbreviation: 'TEX', abbrev: 'TEX', city: 'Texas', league: 'AL', division: 'West', slug: 'rangers', primaryColor: '#003278', venue: 'Globe Life Field' },
  { id: '13', name: 'Mariners', shortName: 'Mariners', abbreviation: 'SEA', abbrev: 'SEA', city: 'Seattle', league: 'AL', division: 'West', slug: 'mariners', primaryColor: '#0C2C56', venue: 'T-Mobile Park' },
  { id: '14', name: 'Angels', shortName: 'Angels', abbreviation: 'LAA', abbrev: 'LAA', city: 'Los Angeles', league: 'AL', division: 'West', slug: 'angels', primaryColor: '#BA0021', venue: 'Angel Stadium' },
  { id: '15', name: 'Athletics', shortName: "A's", abbreviation: 'OAK', abbrev: 'OAK', city: 'Oakland', league: 'AL', division: 'West', slug: 'athletics', primaryColor: '#003831', venue: 'Sutter Health Park' },
  // NL East
  { id: '16', name: 'Braves', shortName: 'Braves', abbreviation: 'ATL', abbrev: 'ATL', city: 'Atlanta', league: 'NL', division: 'East', slug: 'braves', primaryColor: '#CE1141', venue: 'Truist Park' },
  { id: '17', name: 'Mets', shortName: 'Mets', abbreviation: 'NYM', abbrev: 'NYM', city: 'New York', league: 'NL', division: 'East', slug: 'mets', primaryColor: '#002D72', venue: 'Citi Field' },
  { id: '18', name: 'Phillies', shortName: 'Phillies', abbreviation: 'PHI', abbrev: 'PHI', city: 'Philadelphia', league: 'NL', division: 'East', slug: 'phillies', primaryColor: '#E81828', venue: 'Citizens Bank Park' },
  { id: '19', name: 'Marlins', shortName: 'Marlins', abbreviation: 'MIA', abbrev: 'MIA', city: 'Miami', league: 'NL', division: 'East', slug: 'marlins', primaryColor: '#00A3E0', venue: 'LoanDepot Park' },
  { id: '20', name: 'Nationals', shortName: 'Nationals', abbreviation: 'WSH', abbrev: 'WSH', city: 'Washington', league: 'NL', division: 'East', slug: 'nationals', primaryColor: '#AB0003', venue: 'Nationals Park' },
  // NL Central
  { id: '21', name: 'Cardinals', shortName: 'Cardinals', abbreviation: 'STL', abbrev: 'STL', city: 'St. Louis', league: 'NL', division: 'Central', slug: 'cardinals', primaryColor: '#C41E3A', venue: 'Busch Stadium' },
  { id: '22', name: 'Brewers', shortName: 'Brewers', abbreviation: 'MIL', abbrev: 'MIL', city: 'Milwaukee', league: 'NL', division: 'Central', slug: 'brewers', primaryColor: '#FFC52F', venue: 'American Family Field' },
  { id: '23', name: 'Cubs', shortName: 'Cubs', abbreviation: 'CHC', abbrev: 'CHC', city: 'Chicago', league: 'NL', division: 'Central', slug: 'cubs', primaryColor: '#0E3386', venue: 'Wrigley Field' },
  { id: '24', name: 'Reds', shortName: 'Reds', abbreviation: 'CIN', abbrev: 'CIN', city: 'Cincinnati', league: 'NL', division: 'Central', slug: 'reds', primaryColor: '#C6011F', venue: 'Great American Ball Park' },
  { id: '25', name: 'Pirates', shortName: 'Pirates', abbreviation: 'PIT', abbrev: 'PIT', city: 'Pittsburgh', league: 'NL', division: 'Central', slug: 'pirates', primaryColor: '#27251F', venue: 'PNC Park' },
  // NL West
  { id: '26', name: 'Dodgers', shortName: 'Dodgers', abbreviation: 'LAD', abbrev: 'LAD', city: 'Los Angeles', league: 'NL', division: 'West', slug: 'dodgers', primaryColor: '#005A9C', venue: 'Dodger Stadium' },
  { id: '27', name: 'Padres', shortName: 'Padres', abbreviation: 'SD', abbrev: 'SD', city: 'San Diego', league: 'NL', division: 'West', slug: 'padres', primaryColor: '#2F241D', venue: 'Petco Park' },
  { id: '28', name: 'Giants', shortName: 'Giants', abbreviation: 'SF', abbrev: 'SF', city: 'San Francisco', league: 'NL', division: 'West', slug: 'giants', primaryColor: '#FD5A1E', venue: 'Oracle Park' },
  { id: '29', name: 'Diamondbacks', shortName: 'D-backs', abbreviation: 'ARI', abbrev: 'ARI', city: 'Arizona', league: 'NL', division: 'West', slug: 'diamondbacks', primaryColor: '#A71930', venue: 'Chase Field' },
  { id: '30', name: 'Rockies', shortName: 'Rockies', abbreviation: 'COL', abbrev: 'COL', city: 'Colorado', league: 'NL', division: 'West', slug: 'rockies', primaryColor: '#33006F', venue: 'Coors Field' },
];

export const DIVISION_ORDER = ['AL East', 'AL Central', 'AL West', 'NL East', 'NL Central', 'NL West'];

export function getTeamBySlug(slug: string): MLBTeamInfo | undefined {
  return MLB_TEAMS.find((t) => t.slug === slug);
}

export function getTeamById(id: string): MLBTeamInfo | undefined {
  return MLB_TEAMS.find((t) => t.id === id);
}

export function getTeamByAbbreviation(abbrev: string): MLBTeamInfo | undefined {
  return MLB_TEAMS.find((t) => t.abbreviation === abbrev);
}
