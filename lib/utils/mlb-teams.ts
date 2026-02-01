export interface MLBTeamInfo {
  id: string;
  name: string;
  abbreviation: string;
  city: string;
  league: 'AL' | 'NL';
  division: 'East' | 'Central' | 'West';
  slug: string;
  primaryColor: string;
}

export const MLB_TEAMS: MLBTeamInfo[] = [
  { id: '1', name: 'Yankees', abbreviation: 'NYY', city: 'New York', league: 'AL', division: 'East', slug: 'yankees', primaryColor: '#003087' },
  { id: '2', name: 'Red Sox', abbreviation: 'BOS', city: 'Boston', league: 'AL', division: 'East', slug: 'red-sox', primaryColor: '#BD3039' },
  { id: '3', name: 'Blue Jays', abbreviation: 'TOR', city: 'Toronto', league: 'AL', division: 'East', slug: 'blue-jays', primaryColor: '#134A8E' },
  { id: '4', name: 'Orioles', abbreviation: 'BAL', city: 'Baltimore', league: 'AL', division: 'East', slug: 'orioles', primaryColor: '#DF4601' },
  { id: '5', name: 'Rays', abbreviation: 'TB', city: 'Tampa Bay', league: 'AL', division: 'East', slug: 'rays', primaryColor: '#092C5C' },
  { id: '6', name: 'White Sox', abbreviation: 'CWS', city: 'Chicago', league: 'AL', division: 'Central', slug: 'white-sox', primaryColor: '#27251F' },
  { id: '7', name: 'Guardians', abbreviation: 'CLE', city: 'Cleveland', league: 'AL', division: 'Central', slug: 'guardians', primaryColor: '#00385D' },
  { id: '8', name: 'Twins', abbreviation: 'MIN', city: 'Minnesota', league: 'AL', division: 'Central', slug: 'twins', primaryColor: '#002B5C' },
  { id: '9', name: 'Tigers', abbreviation: 'DET', city: 'Detroit', league: 'AL', division: 'Central', slug: 'tigers', primaryColor: '#0C2340' },
  { id: '10', name: 'Royals', abbreviation: 'KC', city: 'Kansas City', league: 'AL', division: 'Central', slug: 'royals', primaryColor: '#004687' },
  { id: '11', name: 'Astros', abbreviation: 'HOU', city: 'Houston', league: 'AL', division: 'West', slug: 'astros', primaryColor: '#002D62' },
  { id: '12', name: 'Rangers', abbreviation: 'TEX', city: 'Texas', league: 'AL', division: 'West', slug: 'rangers', primaryColor: '#003278' },
  { id: '13', name: 'Mariners', abbreviation: 'SEA', city: 'Seattle', league: 'AL', division: 'West', slug: 'mariners', primaryColor: '#0C2C56' },
  { id: '14', name: 'Angels', abbreviation: 'LAA', city: 'Los Angeles', league: 'AL', division: 'West', slug: 'angels', primaryColor: '#BA0021' },
  { id: '15', name: 'Athletics', abbreviation: 'OAK', city: 'Oakland', league: 'AL', division: 'West', slug: 'athletics', primaryColor: '#003831' },
  { id: '16', name: 'Braves', abbreviation: 'ATL', city: 'Atlanta', league: 'NL', division: 'East', slug: 'braves', primaryColor: '#CE1141' },
  { id: '17', name: 'Mets', abbreviation: 'NYM', city: 'New York', league: 'NL', division: 'East', slug: 'mets', primaryColor: '#002D72' },
  { id: '18', name: 'Phillies', abbreviation: 'PHI', city: 'Philadelphia', league: 'NL', division: 'East', slug: 'phillies', primaryColor: '#E81828' },
  { id: '19', name: 'Marlins', abbreviation: 'MIA', city: 'Miami', league: 'NL', division: 'East', slug: 'marlins', primaryColor: '#00A3E0' },
  { id: '20', name: 'Nationals', abbreviation: 'WSH', city: 'Washington', league: 'NL', division: 'East', slug: 'nationals', primaryColor: '#AB0003' },
  { id: '21', name: 'Cardinals', abbreviation: 'STL', city: 'St. Louis', league: 'NL', division: 'Central', slug: 'cardinals', primaryColor: '#C41E3A' },
  { id: '22', name: 'Brewers', abbreviation: 'MIL', city: 'Milwaukee', league: 'NL', division: 'Central', slug: 'brewers', primaryColor: '#FFC52F' },
  { id: '23', name: 'Cubs', abbreviation: 'CHC', city: 'Chicago', league: 'NL', division: 'Central', slug: 'cubs', primaryColor: '#0E3386' },
  { id: '24', name: 'Reds', abbreviation: 'CIN', city: 'Cincinnati', league: 'NL', division: 'Central', slug: 'reds', primaryColor: '#C6011F' },
  { id: '25', name: 'Pirates', abbreviation: 'PIT', city: 'Pittsburgh', league: 'NL', division: 'Central', slug: 'pirates', primaryColor: '#27251F' },
  { id: '26', name: 'Dodgers', abbreviation: 'LAD', city: 'Los Angeles', league: 'NL', division: 'West', slug: 'dodgers', primaryColor: '#005A9C' },
  { id: '27', name: 'Padres', abbreviation: 'SD', city: 'San Diego', league: 'NL', division: 'West', slug: 'padres', primaryColor: '#2F241D' },
  { id: '28', name: 'Giants', abbreviation: 'SF', city: 'San Francisco', league: 'NL', division: 'West', slug: 'giants', primaryColor: '#FD5A1E' },
  { id: '29', name: 'Diamondbacks', abbreviation: 'ARI', city: 'Arizona', league: 'NL', division: 'West', slug: 'diamondbacks', primaryColor: '#A71930' },
  { id: '30', name: 'Rockies', abbreviation: 'COL', city: 'Colorado', league: 'NL', division: 'West', slug: 'rockies', primaryColor: '#33006F' },
];

export const DIVISION_ORDER = ['AL East', 'AL Central', 'AL West', 'NL East', 'NL Central', 'NL West'];

export function getTeamBySlug(slug: string): MLBTeamInfo | undefined {
  return MLB_TEAMS.find((t) => t.slug === slug);
}

export function getTeamById(id: string): MLBTeamInfo | undefined {
  return MLB_TEAMS.find((t) => t.id === id);
}
