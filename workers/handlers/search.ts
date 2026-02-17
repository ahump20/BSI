import type { Env } from '../shared/types';
import { json, kvGet } from '../shared/helpers';

export async function handleSearch(url: URL, env: Env): Promise<Response> {
  const query = url.searchParams.get('q')?.trim();
  if (!query || query.length < 2) {
    return json({ results: [], message: 'Query must be at least 2 characters' }, 400);
  }

  const lowerQuery = query.toLowerCase();
  const results: Array<{ type: string; id: string; name: string; url: string; sport?: string }> = [];

  // Static pro-sport team index — instant match, no API calls
  const PRO_TEAMS: Array<{ name: string; abv: string; sport: 'mlb' | 'nfl' | 'nba'; slug: string }> = [
    // MLB (30 teams)
    { name: 'Arizona Diamondbacks', abv: 'ARI', sport: 'mlb', slug: 'ari' },
    { name: 'Atlanta Braves', abv: 'ATL', sport: 'mlb', slug: 'atl' },
    { name: 'Baltimore Orioles', abv: 'BAL', sport: 'mlb', slug: 'bal' },
    { name: 'Boston Red Sox', abv: 'BOS', sport: 'mlb', slug: 'bos' },
    { name: 'Chicago Cubs', abv: 'CHC', sport: 'mlb', slug: 'chc' },
    { name: 'Chicago White Sox', abv: 'CWS', sport: 'mlb', slug: 'cws' },
    { name: 'Cincinnati Reds', abv: 'CIN', sport: 'mlb', slug: 'cin' },
    { name: 'Cleveland Guardians', abv: 'CLE', sport: 'mlb', slug: 'cle' },
    { name: 'Colorado Rockies', abv: 'COL', sport: 'mlb', slug: 'col' },
    { name: 'Detroit Tigers', abv: 'DET', sport: 'mlb', slug: 'det' },
    { name: 'Houston Astros', abv: 'HOU', sport: 'mlb', slug: 'hou' },
    { name: 'Kansas City Royals', abv: 'KC', sport: 'mlb', slug: 'kc' },
    { name: 'Los Angeles Angels', abv: 'LAA', sport: 'mlb', slug: 'laa' },
    { name: 'Los Angeles Dodgers', abv: 'LAD', sport: 'mlb', slug: 'lad' },
    { name: 'Miami Marlins', abv: 'MIA', sport: 'mlb', slug: 'mia' },
    { name: 'Milwaukee Brewers', abv: 'MIL', sport: 'mlb', slug: 'mil' },
    { name: 'Minnesota Twins', abv: 'MIN', sport: 'mlb', slug: 'min' },
    { name: 'New York Mets', abv: 'NYM', sport: 'mlb', slug: 'nym' },
    { name: 'New York Yankees', abv: 'NYY', sport: 'mlb', slug: 'nyy' },
    { name: 'Oakland Athletics', abv: 'OAK', sport: 'mlb', slug: 'oak' },
    { name: 'Philadelphia Phillies', abv: 'PHI', sport: 'mlb', slug: 'phi' },
    { name: 'Pittsburgh Pirates', abv: 'PIT', sport: 'mlb', slug: 'pit' },
    { name: 'San Diego Padres', abv: 'SD', sport: 'mlb', slug: 'sd' },
    { name: 'San Francisco Giants', abv: 'SF', sport: 'mlb', slug: 'sf' },
    { name: 'Seattle Mariners', abv: 'SEA', sport: 'mlb', slug: 'sea' },
    { name: 'St. Louis Cardinals', abv: 'STL', sport: 'mlb', slug: 'stl' },
    { name: 'Tampa Bay Rays', abv: 'TB', sport: 'mlb', slug: 'tb' },
    { name: 'Texas Rangers', abv: 'TEX', sport: 'mlb', slug: 'tex' },
    { name: 'Toronto Blue Jays', abv: 'TOR', sport: 'mlb', slug: 'tor' },
    { name: 'Washington Nationals', abv: 'WSH', sport: 'mlb', slug: 'wsh' },
    // NFL (32 teams)
    { name: 'Arizona Cardinals', abv: 'ARI', sport: 'nfl', slug: 'cardinals' },
    { name: 'Atlanta Falcons', abv: 'ATL', sport: 'nfl', slug: 'falcons' },
    { name: 'Baltimore Ravens', abv: 'BAL', sport: 'nfl', slug: 'ravens' },
    { name: 'Buffalo Bills', abv: 'BUF', sport: 'nfl', slug: 'bills' },
    { name: 'Carolina Panthers', abv: 'CAR', sport: 'nfl', slug: 'panthers' },
    { name: 'Chicago Bears', abv: 'CHI', sport: 'nfl', slug: 'bears' },
    { name: 'Cincinnati Bengals', abv: 'CIN', sport: 'nfl', slug: 'bengals' },
    { name: 'Cleveland Browns', abv: 'CLE', sport: 'nfl', slug: 'browns' },
    { name: 'Dallas Cowboys', abv: 'DAL', sport: 'nfl', slug: 'cowboys' },
    { name: 'Denver Broncos', abv: 'DEN', sport: 'nfl', slug: 'broncos' },
    { name: 'Detroit Lions', abv: 'DET', sport: 'nfl', slug: 'lions' },
    { name: 'Green Bay Packers', abv: 'GB', sport: 'nfl', slug: 'packers' },
    { name: 'Houston Texans', abv: 'HOU', sport: 'nfl', slug: 'texans' },
    { name: 'Indianapolis Colts', abv: 'IND', sport: 'nfl', slug: 'colts' },
    { name: 'Jacksonville Jaguars', abv: 'JAX', sport: 'nfl', slug: 'jaguars' },
    { name: 'Kansas City Chiefs', abv: 'KC', sport: 'nfl', slug: 'chiefs' },
    { name: 'Las Vegas Raiders', abv: 'LV', sport: 'nfl', slug: 'raiders' },
    { name: 'Los Angeles Chargers', abv: 'LAC', sport: 'nfl', slug: 'chargers' },
    { name: 'Los Angeles Rams', abv: 'LAR', sport: 'nfl', slug: 'rams' },
    { name: 'Miami Dolphins', abv: 'MIA', sport: 'nfl', slug: 'dolphins' },
    { name: 'Minnesota Vikings', abv: 'MIN', sport: 'nfl', slug: 'vikings' },
    { name: 'New England Patriots', abv: 'NE', sport: 'nfl', slug: 'patriots' },
    { name: 'New Orleans Saints', abv: 'NO', sport: 'nfl', slug: 'saints' },
    { name: 'New York Giants', abv: 'NYG', sport: 'nfl', slug: 'giants' },
    { name: 'New York Jets', abv: 'NYJ', sport: 'nfl', slug: 'jets' },
    { name: 'Philadelphia Eagles', abv: 'PHI', sport: 'nfl', slug: 'eagles' },
    { name: 'Pittsburgh Steelers', abv: 'PIT', sport: 'nfl', slug: 'steelers' },
    { name: 'San Francisco 49ers', abv: 'SF', sport: 'nfl', slug: '49ers' },
    { name: 'Seattle Seahawks', abv: 'SEA', sport: 'nfl', slug: 'seahawks' },
    { name: 'Tampa Bay Buccaneers', abv: 'TB', sport: 'nfl', slug: 'buccaneers' },
    { name: 'Tennessee Titans', abv: 'TEN', sport: 'nfl', slug: 'titans' },
    { name: 'Washington Commanders', abv: 'WAS', sport: 'nfl', slug: 'commanders' },
    // NBA (30 teams)
    { name: 'Atlanta Hawks', abv: 'ATL', sport: 'nba', slug: 'atl' },
    { name: 'Boston Celtics', abv: 'BOS', sport: 'nba', slug: 'bos' },
    { name: 'Brooklyn Nets', abv: 'BKN', sport: 'nba', slug: 'bkn' },
    { name: 'Charlotte Hornets', abv: 'CHA', sport: 'nba', slug: 'cha' },
    { name: 'Chicago Bulls', abv: 'CHI', sport: 'nba', slug: 'chi' },
    { name: 'Cleveland Cavaliers', abv: 'CLE', sport: 'nba', slug: 'cle' },
    { name: 'Dallas Mavericks', abv: 'DAL', sport: 'nba', slug: 'dal' },
    { name: 'Denver Nuggets', abv: 'DEN', sport: 'nba', slug: 'den' },
    { name: 'Detroit Pistons', abv: 'DET', sport: 'nba', slug: 'det' },
    { name: 'Golden State Warriors', abv: 'GS', sport: 'nba', slug: 'gs' },
    { name: 'Houston Rockets', abv: 'HOU', sport: 'nba', slug: 'hou' },
    { name: 'Indiana Pacers', abv: 'IND', sport: 'nba', slug: 'ind' },
    { name: 'LA Clippers', abv: 'LAC', sport: 'nba', slug: 'lac' },
    { name: 'Los Angeles Lakers', abv: 'LAL', sport: 'nba', slug: 'lal' },
    { name: 'Memphis Grizzlies', abv: 'MEM', sport: 'nba', slug: 'mem' },
    { name: 'Miami Heat', abv: 'MIA', sport: 'nba', slug: 'mia' },
    { name: 'Milwaukee Bucks', abv: 'MIL', sport: 'nba', slug: 'mil' },
    { name: 'Minnesota Timberwolves', abv: 'MIN', sport: 'nba', slug: 'min' },
    { name: 'New Orleans Pelicans', abv: 'NOP', sport: 'nba', slug: 'nop' },
    { name: 'New York Knicks', abv: 'NYK', sport: 'nba', slug: 'nyk' },
    { name: 'Oklahoma City Thunder', abv: 'OKC', sport: 'nba', slug: 'okc' },
    { name: 'Orlando Magic', abv: 'ORL', sport: 'nba', slug: 'orl' },
    { name: 'Philadelphia 76ers', abv: 'PHI', sport: 'nba', slug: 'phi' },
    { name: 'Phoenix Suns', abv: 'PHX', sport: 'nba', slug: 'phx' },
    { name: 'Portland Trail Blazers', abv: 'POR', sport: 'nba', slug: 'por' },
    { name: 'Sacramento Kings', abv: 'SAC', sport: 'nba', slug: 'sac' },
    { name: 'San Antonio Spurs', abv: 'SA', sport: 'nba', slug: 'sa' },
    { name: 'Toronto Raptors', abv: 'TOR', sport: 'nba', slug: 'tor' },
    { name: 'Utah Jazz', abv: 'UTA', sport: 'nba', slug: 'uta' },
    { name: 'Washington Wizards', abv: 'WAS', sport: 'nba', slug: 'was' },
  ];

  // Match pro teams by name or abbreviation
  for (const team of PRO_TEAMS) {
    if (
      team.name.toLowerCase().includes(lowerQuery) ||
      team.abv.toLowerCase() === lowerQuery
    ) {
      results.push({
        type: 'team',
        id: team.slug,
        name: team.name,
        url: `/${team.sport}/teams/${team.slug}`,
        sport: team.sport.toUpperCase(),
      });
    }
    if (results.length >= 20) break;
  }

  // College baseball teams from KV (existing behavior)
  if (results.length < 20) {
    const teamList = await env.KV.list({ prefix: 'cb:team:', limit: 50 });
    for (const key of teamList.keys) {
      const data = await kvGet<{ team: { name: string; id: number } }>(env.KV, key.name);
      if (data?.team?.name?.toLowerCase().includes(lowerQuery)) {
        results.push({
          type: 'team',
          id: String(data.team.id),
          name: data.team.name,
          url: `/college-baseball/teams/${data.team.id}`,
          sport: 'College Baseball',
        });
      }
      if (results.length >= 20) break;
    }
  }

  // Sport pages (hubs)
  const SPORT_PAGES = [
    { name: 'MLB Baseball', url: '/mlb' },
    { name: 'NFL Football', url: '/nfl' },
    { name: 'NBA Basketball', url: '/nba' },
    { name: 'College Football', url: '/cfb' },
    { name: 'College Baseball', url: '/college-baseball' },
    { name: 'Arcade Games', url: '/arcade' },
    { name: 'Dashboard', url: '/dashboard' },
  ];
  for (const page of SPORT_PAGES) {
    if (page.name.toLowerCase().includes(lowerQuery)) {
      results.push({ type: 'page', id: page.url, name: page.name, url: page.url });
    }
  }

  return json({ results, query });
}
