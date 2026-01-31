/**
 * BSI Unified Search API
 * Searches teams, players, and games across all sports.
 *
 * GET /api/search/unified?q={query}&types=team,player,game&sport={optional}&limit=20
 */

type SearchType = 'team' | 'player' | 'game';

interface Env {
  DB?: D1Database;
  BSI_CACHE?: KVNamespace;
}

interface EventContext<E> {
  request: Request;
  env: E;
  params: Record<string, string>;
}

interface TeamResult {
  id: string;
  name: string;
  abbreviation: string;
  conference?: string;
  division?: string;
  sport: string;
  logo?: string;
  record?: string;
  ranking?: number;
}

interface PlayerResult {
  id: string;
  name: string;
  position: string;
  team: string;
  teamId: string;
  sport: string;
  number?: string;
  headshot?: string;
  stats?: string;
}

interface GameResult {
  id: string;
  homeTeam: { name: string; abbreviation: string; score?: number };
  awayTeam: { name: string; abbreviation: string; score?: number };
  date: string;
  status: string;
  sport: string;
  venue?: string;
}

interface UnifiedSearchResponse {
  results: {
    teams: TeamResult[];
    players: PlayerResult[];
    games: GameResult[];
  };
  totalCount: number;
  query: string;
}

const PRO_TEAMS: TeamResult[] = [
  // MLB Teams
  {
    id: 'mlb-nyy',
    name: 'New York Yankees',
    abbreviation: 'NYY',
    conference: 'American League',
    division: 'East',
    sport: 'mlb',
  },
  {
    id: 'mlb-bos',
    name: 'Boston Red Sox',
    abbreviation: 'BOS',
    conference: 'American League',
    division: 'East',
    sport: 'mlb',
  },
  {
    id: 'mlb-lad',
    name: 'Los Angeles Dodgers',
    abbreviation: 'LAD',
    conference: 'National League',
    division: 'West',
    sport: 'mlb',
  },
  {
    id: 'mlb-tex',
    name: 'Texas Rangers',
    abbreviation: 'TEX',
    conference: 'American League',
    division: 'West',
    sport: 'mlb',
  },
  {
    id: 'mlb-hou',
    name: 'Houston Astros',
    abbreviation: 'HOU',
    conference: 'American League',
    division: 'West',
    sport: 'mlb',
  },
  {
    id: 'mlb-atl',
    name: 'Atlanta Braves',
    abbreviation: 'ATL',
    conference: 'National League',
    division: 'East',
    sport: 'mlb',
  },
  {
    id: 'mlb-chc',
    name: 'Chicago Cubs',
    abbreviation: 'CHC',
    conference: 'National League',
    division: 'Central',
    sport: 'mlb',
  },
  {
    id: 'mlb-stl',
    name: 'St. Louis Cardinals',
    abbreviation: 'STL',
    conference: 'National League',
    division: 'Central',
    sport: 'mlb',
  },
  // NFL Teams
  {
    id: 'nfl-dal',
    name: 'Dallas Cowboys',
    abbreviation: 'DAL',
    conference: 'NFC',
    division: 'East',
    sport: 'nfl',
  },
  {
    id: 'nfl-nyg',
    name: 'New York Giants',
    abbreviation: 'NYG',
    conference: 'NFC',
    division: 'East',
    sport: 'nfl',
  },
  {
    id: 'nfl-phi',
    name: 'Philadelphia Eagles',
    abbreviation: 'PHI',
    conference: 'NFC',
    division: 'East',
    sport: 'nfl',
  },
  {
    id: 'nfl-kc',
    name: 'Kansas City Chiefs',
    abbreviation: 'KC',
    conference: 'AFC',
    division: 'West',
    sport: 'nfl',
  },
  {
    id: 'nfl-sf',
    name: 'San Francisco 49ers',
    abbreviation: 'SF',
    conference: 'NFC',
    division: 'West',
    sport: 'nfl',
  },
  {
    id: 'nfl-det',
    name: 'Detroit Lions',
    abbreviation: 'DET',
    conference: 'NFC',
    division: 'North',
    sport: 'nfl',
  },
  {
    id: 'nfl-buf',
    name: 'Buffalo Bills',
    abbreviation: 'BUF',
    conference: 'AFC',
    division: 'East',
    sport: 'nfl',
  },
  {
    id: 'nfl-mia',
    name: 'Miami Dolphins',
    abbreviation: 'MIA',
    conference: 'AFC',
    division: 'East',
    sport: 'nfl',
  },
  // NBA Teams
  {
    id: 'nba-lal',
    name: 'Los Angeles Lakers',
    abbreviation: 'LAL',
    conference: 'Western',
    division: 'Pacific',
    sport: 'nba',
  },
  {
    id: 'nba-bos',
    name: 'Boston Celtics',
    abbreviation: 'BOS',
    conference: 'Eastern',
    division: 'Atlantic',
    sport: 'nba',
  },
  {
    id: 'nba-gsw',
    name: 'Golden State Warriors',
    abbreviation: 'GSW',
    conference: 'Western',
    division: 'Pacific',
    sport: 'nba',
  },
  {
    id: 'nba-den',
    name: 'Denver Nuggets',
    abbreviation: 'DEN',
    conference: 'Western',
    division: 'Northwest',
    sport: 'nba',
  },
  {
    id: 'nba-mia',
    name: 'Miami Heat',
    abbreviation: 'MIA',
    conference: 'Eastern',
    division: 'Southeast',
    sport: 'nba',
  },
];

const SAMPLE_PLAYERS: PlayerResult[] = [
  {
    id: 'p-mahomes',
    name: 'Patrick Mahomes',
    position: 'QB',
    team: 'Kansas City Chiefs',
    teamId: 'nfl-kc',
    sport: 'nfl',
    number: '15',
  },
  {
    id: 'p-allen',
    name: 'Josh Allen',
    position: 'QB',
    team: 'Buffalo Bills',
    teamId: 'nfl-buf',
    sport: 'nfl',
    number: '17',
  },
  {
    id: 'p-lamar',
    name: 'Lamar Jackson',
    position: 'QB',
    team: 'Baltimore Ravens',
    teamId: 'nfl-bal',
    sport: 'nfl',
    number: '8',
  },
  {
    id: 'p-kelce',
    name: 'Travis Kelce',
    position: 'TE',
    team: 'Kansas City Chiefs',
    teamId: 'nfl-kc',
    sport: 'nfl',
    number: '87',
  },
  {
    id: 'p-ohtani',
    name: 'Shohei Ohtani',
    position: 'DH',
    team: 'Los Angeles Dodgers',
    teamId: 'mlb-lad',
    sport: 'mlb',
    number: '17',
  },
  {
    id: 'p-judge',
    name: 'Aaron Judge',
    position: 'OF',
    team: 'New York Yankees',
    teamId: 'mlb-nyy',
    sport: 'mlb',
    number: '99',
  },
  {
    id: 'p-soto',
    name: 'Juan Soto',
    position: 'OF',
    team: 'New York Yankees',
    teamId: 'mlb-nyy',
    sport: 'mlb',
    number: '22',
  },
  {
    id: 'p-curry',
    name: 'Stephen Curry',
    position: 'PG',
    team: 'Golden State Warriors',
    teamId: 'nba-gsw',
    sport: 'nba',
    number: '30',
  },
  {
    id: 'p-lebron',
    name: 'LeBron James',
    position: 'SF',
    team: 'Los Angeles Lakers',
    teamId: 'nba-lal',
    sport: 'nba',
    number: '23',
  },
  {
    id: 'p-jokic',
    name: 'Nikola Jokic',
    position: 'C',
    team: 'Denver Nuggets',
    teamId: 'nba-den',
    sport: 'nba',
    number: '15',
  },
  {
    id: 'p-ewers',
    name: 'Quinn Ewers',
    position: 'QB',
    team: 'Texas Longhorns',
    teamId: 'cfb-tex',
    sport: 'cfb',
    number: '3',
  },
  {
    id: 'p-sanders',
    name: 'Travis Hunter',
    position: 'WR/CB',
    team: 'Colorado Buffaloes',
    teamId: 'cfb-col',
    sport: 'cfb',
    number: '12',
  },
];

const SAMPLE_GAMES: GameResult[] = [
  {
    id: 'g-1',
    homeTeam: { name: 'Texas Longhorns', abbreviation: 'TEX', score: 28 },
    awayTeam: { name: 'Georgia Bulldogs', abbreviation: 'UGA', score: 24 },
    date: '2024-12-07',
    status: 'Final',
    sport: 'cfb',
    venue: 'Mercedes-Benz Stadium',
  },
  {
    id: 'g-2',
    homeTeam: { name: 'Kansas City Chiefs', abbreviation: 'KC' },
    awayTeam: { name: 'Buffalo Bills', abbreviation: 'BUF' },
    date: '2025-01-26',
    status: 'Scheduled',
    sport: 'nfl',
    venue: 'Arrowhead Stadium',
  },
  {
    id: 'g-3',
    homeTeam: { name: 'Los Angeles Dodgers', abbreviation: 'LAD' },
    awayTeam: { name: 'New York Yankees', abbreviation: 'NYY' },
    date: '2025-03-28',
    status: 'Scheduled',
    sport: 'mlb',
  },
];

function fuzzyMatch(text: string, query: string): boolean {
  const textLower = text.toLowerCase();
  const queryLower = query.toLowerCase();

  if (textLower.includes(queryLower)) return true;

  // Simple fuzzy: check if all chars appear in order
  let j = 0;
  for (let i = 0; i < textLower.length && j < queryLower.length; i++) {
    if (textLower[i] === queryLower[j]) j++;
  }
  return j === queryLower.length;
}

function searchTeams(query: string, sport?: string): TeamResult[] {
  return PRO_TEAMS.filter((team) => {
    if (sport && team.sport !== sport) return false;
    return (
      fuzzyMatch(team.name, query) ||
      fuzzyMatch(team.abbreviation, query) ||
      (team.conference && fuzzyMatch(team.conference, query))
    );
  });
}

function searchPlayers(query: string, sport?: string): PlayerResult[] {
  return SAMPLE_PLAYERS.filter((player) => {
    if (sport && player.sport !== sport) return false;
    return fuzzyMatch(player.name, query) || fuzzyMatch(player.team, query);
  });
}

function searchGames(query: string, sport?: string): GameResult[] {
  return SAMPLE_GAMES.filter((game) => {
    if (sport && game.sport !== sport) return false;
    return (
      fuzzyMatch(game.homeTeam.name, query) ||
      fuzzyMatch(game.awayTeam.name, query) ||
      fuzzyMatch(game.homeTeam.abbreviation, query) ||
      fuzzyMatch(game.awayTeam.abbreviation, query)
    );
  });
}

export async function onRequestGet(context: EventContext<Env>): Promise<Response> {
  const url = new URL(context.request.url);
  const query = url.searchParams.get('q') || '';
  const typesParam = url.searchParams.get('types') || 'team,player,game';
  const sport = url.searchParams.get('sport') || undefined;
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 50);

  if (!query || query.length < 2) {
    return new Response(
      JSON.stringify({
        success: false,
        error: { code: 'QUERY_TOO_SHORT', message: 'Query must be at least 2 characters' },
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const types = typesParam.split(',').map((t) => t.trim() as SearchType);

  const results: UnifiedSearchResponse['results'] = {
    teams: [],
    players: [],
    games: [],
  };

  if (types.includes('team')) {
    results.teams = searchTeams(query, sport).slice(0, limit);

    // Also search D1 database for college teams if available
    if (context.env.DB) {
      try {
        const dbResults = await context.env.DB.prepare(
          `
          SELECT id, name, abbreviation, conference, division, sport, logo_url as logo
          FROM college_baseball_teams
          WHERE LOWER(name) LIKE LOWER(?) OR LOWER(abbreviation) LIKE LOWER(?)
          LIMIT ?
        `
        )
          .bind(`%${query}%`, `%${query}%`, limit)
          .all<TeamResult>();

        if (dbResults.results) {
          const collegeTeams = dbResults.results.map((t) => ({
            ...t,
            sport: 'college_baseball',
          }));
          results.teams = [...results.teams, ...collegeTeams].slice(0, limit);
        }
      } catch {
        // D1 query failed, continue with static data
      }
    }
  }

  if (types.includes('player')) {
    results.players = searchPlayers(query, sport).slice(0, limit);
  }

  if (types.includes('game')) {
    results.games = searchGames(query, sport).slice(0, limit);
  }

  const totalCount = results.teams.length + results.players.length + results.games.length;

  const response: UnifiedSearchResponse = {
    results,
    totalCount,
    query,
  };

  return new Response(
    JSON.stringify({
      success: true,
      data: response,
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300',
      },
    }
  );
}

export default { onRequestGet };
