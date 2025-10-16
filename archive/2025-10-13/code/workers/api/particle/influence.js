/**
 * 🔥 Particle Influence API
 * Returns team/player influence scores for data-driven particle sizing
 */

const TEAM_INFLUENCE_DB = {
    MLB: [
        // Historical powerhouses
        { key: 'NYY', name: 'New York Yankees', historicalPrestige: 100 },
        { key: 'STL', name: 'St. Louis Cardinals', historicalPrestige: 95 },
        { key: 'BOS', name: 'Boston Red Sox', historicalPrestige: 93 },
        { key: 'LAD', name: 'Los Angeles Dodgers', historicalPrestige: 92 },
        { key: 'SF', name: 'San Francisco Giants', historicalPrestige: 88 },
        { key: 'OAK', name: 'Oakland Athletics', historicalPrestige: 82 },
        { key: 'CIN', name: 'Cincinnati Reds', historicalPrestige: 80 },
        { key: 'DET', name: 'Detroit Tigers', historicalPrestige: 78 },
        // Modern contenders
        { key: 'ATL', name: 'Atlanta Braves', historicalPrestige: 85 },
        { key: 'HOU', name: 'Houston Astros', historicalPrestige: 72 },
        { key: 'PHI', name: 'Philadelphia Phillies', historicalPrestige: 76 },
        { key: 'NYM', name: 'New York Mets', historicalPrestige: 70 },
        { key: 'CHC', name: 'Chicago Cubs', historicalPrestige: 84 },
        { key: 'MIN', name: 'Minnesota Twins', historicalPrestige: 68 },
        { key: 'TB', name: 'Tampa Bay Rays', historicalPrestige: 55 },
        // Mid-tier historical
        { key: 'BAL', name: 'Baltimore Orioles', historicalPrestige: 73 },
        { key: 'TOR', name: 'Toronto Blue Jays', historicalPrestige: 62 },
        { key: 'CHW', name: 'Chicago White Sox', historicalPrestige: 71 },
        { key: 'CLE', name: 'Cleveland Guardians', historicalPrestige: 75 },
        { key: 'MIL', name: 'Milwaukee Brewers', historicalPrestige: 60 },
        { key: 'SD', name: 'San Diego Padres', historicalPrestige: 52 },
        { key: 'LAA', name: 'Los Angeles Angels', historicalPrestige: 58 },
        { key: 'SEA', name: 'Seattle Mariners', historicalPrestige: 48 },
        { key: 'TEX', name: 'Texas Rangers', historicalPrestige: 53 },
        // Smaller market teams
        { key: 'PIT', name: 'Pittsburgh Pirates', historicalPrestige: 74 },
        { key: 'KC', name: 'Kansas City Royals', historicalPrestige: 56 },
        { key: 'WSH', name: 'Washington Nationals', historicalPrestige: 47 },
        { key: 'MIA', name: 'Miami Marlins', historicalPrestige: 45 },
        { key: 'COL', name: 'Colorado Rockies', historicalPrestige: 38 },
        { key: 'ARI', name: 'Arizona Diamondbacks', historicalPrestige: 42 }
    ],
    NFL: [
        // Historic dynasties
        { key: 'GB', name: 'Green Bay Packers', historicalPrestige: 98 },
        { key: 'PIT', name: 'Pittsburgh Steelers', historicalPrestige: 97 },
        { key: 'NE', name: 'New England Patriots', historicalPrestige: 96 },
        { key: 'DAL', name: 'Dallas Cowboys', historicalPrestige: 95 },
        { key: 'SF', name: 'San Francisco 49ers', historicalPrestige: 94 },
        // Modern powerhouses
        { key: 'KC', name: 'Kansas City Chiefs', historicalPrestige: 88 },
        { key: 'BAL', name: 'Baltimore Ravens', historicalPrestige: 82 },
        { key: 'DEN', name: 'Denver Broncos', historicalPrestige: 85 },
        { key: 'MIA', name: 'Miami Dolphins', historicalPrestige: 83 },
        { key: 'OAK', name: 'Las Vegas Raiders', historicalPrestige: 86 },
        // Strong franchises
        { key: 'NYG', name: 'New York Giants', historicalPrestige: 87 },
        { key: 'PHI', name: 'Philadelphia Eagles', historicalPrestige: 78 },
        { key: 'CHI', name: 'Chicago Bears', historicalPrestige: 89 },
        { key: 'LA', name: 'Los Angeles Rams', historicalPrestige: 76 },
        { key: 'IND', name: 'Indianapolis Colts', historicalPrestige: 74 },
        { key: 'SEA', name: 'Seattle Seahawks', historicalPrestige: 68 },
        { key: 'NO', name: 'New Orleans Saints', historicalPrestige: 65 },
        { key: 'MIN', name: 'Minnesota Vikings', historicalPrestige: 70 },
        { key: 'TB', name: 'Tampa Bay Buccaneers', historicalPrestige: 63 },
        { key: 'LAC', name: 'Los Angeles Chargers', historicalPrestige: 60 },
        // Mid-tier teams
        { key: 'TEN', name: 'Tennessee Titans', historicalPrestige: 58 },
        { key: 'BUF', name: 'Buffalo Bills', historicalPrestige: 72 },
        { key: 'CLE', name: 'Cleveland Browns', historicalPrestige: 67 },
        { key: 'CIN', name: 'Cincinnati Bengals', historicalPrestige: 55 },
        { key: 'ATL', name: 'Atlanta Falcons', historicalPrestige: 52 },
        { key: 'CAR', name: 'Carolina Panthers', historicalPrestige: 48 },
        { key: 'ARI', name: 'Arizona Cardinals', historicalPrestige: 50 },
        { key: 'DET', name: 'Detroit Lions', historicalPrestige: 54 },
        { key: 'WAS', name: 'Washington Commanders', historicalPrestige: 71 },
        { key: 'NYJ', name: 'New York Jets', historicalPrestige: 62 },
        { key: 'HOU', name: 'Houston Texans', historicalPrestige: 42 },
        { key: 'JAX', name: 'Jacksonville Jaguars', historicalPrestige: 38 }
    ],
    CFB: [
        // Blue blood programs
        { key: 'ALA', name: 'Alabama Crimson Tide', historicalPrestige: 100 },
        { key: 'ND', name: 'Notre Dame Fighting Irish', historicalPrestige: 98 },
        { key: 'OSU', name: 'Ohio State Buckeyes', historicalPrestige: 97 },
        { key: 'OU', name: 'Oklahoma Sooners', historicalPrestige: 96 },
        { key: 'USC', name: 'USC Trojans', historicalPrestige: 95 },
        { key: 'TEX', name: 'Texas Longhorns', historicalPrestige: 94 },
        { key: 'MICH', name: 'Michigan Wolverines', historicalPrestige: 96 },
        { key: 'PSU', name: 'Penn State Nittany Lions', historicalPrestige: 90 },
        // Elite modern programs
        { key: 'UGA', name: 'Georgia Bulldogs', historicalPrestige: 88 },
        { key: 'CLEM', name: 'Clemson Tigers', historicalPrestige: 82 },
        { key: 'LSU', name: 'LSU Tigers', historicalPrestige: 89 },
        { key: 'FLA', name: 'Florida Gators', historicalPrestige: 87 },
        { key: 'FSU', name: 'Florida State Seminoles', historicalPrestige: 85 },
        { key: 'MIAMI', name: 'Miami Hurricanes', historicalPrestige: 86 },
        { key: 'AUB', name: 'Auburn Tigers', historicalPrestige: 80 },
        { key: 'TENN', name: 'Tennessee Volunteers', historicalPrestige: 83 },
        // Strong historic programs
        { key: 'NEB', name: 'Nebraska Cornhuskers', historicalPrestige: 91 },
        { key: 'MSST', name: 'Mississippi State Bulldogs', historicalPrestige: 68 },
        { key: 'MISS', name: 'Ole Miss Rebels', historicalPrestige: 72 },
        { key: 'ARK', name: 'Arkansas Razorbacks', historicalPrestige: 74 },
        { key: 'TAMU', name: 'Texas A&M Aggies', historicalPrestige: 76 },
        { key: 'WIS', name: 'Wisconsin Badgers', historicalPrestige: 75 },
        { key: 'IOWA', name: 'Iowa Hawkeyes', historicalPrestige: 70 },
        { key: 'WASH', name: 'Washington Huskies', historicalPrestige: 78 },
        { key: 'ORE', name: 'Oregon Ducks', historicalPrestige: 73 }
    ],
    NBA: [
        // Historic franchises
        { key: 'BOS', name: 'Boston Celtics', historicalPrestige: 100 },
        { key: 'LAL', name: 'Los Angeles Lakers', historicalPrestige: 99 },
        { key: 'CHI', name: 'Chicago Bulls', historicalPrestige: 90 },
        { key: 'SA', name: 'San Antonio Spurs', historicalPrestige: 88 },
        { key: 'GSW', name: 'Golden State Warriors', historicalPrestige: 86 },
        // Strong franchises
        { key: 'MIA', name: 'Miami Heat', historicalPrestige: 78 },
        { key: 'DET', name: 'Detroit Pistons', historicalPrestige: 82 },
        { key: 'PHI', name: 'Philadelphia 76ers', historicalPrestige: 84 },
        { key: 'NYK', name: 'New York Knicks', historicalPrestige: 80 },
        { key: 'MIL', name: 'Milwaukee Bucks', historicalPrestige: 72 },
        { key: 'PHX', name: 'Phoenix Suns', historicalPrestige: 68 },
        { key: 'DAL', name: 'Dallas Mavericks', historicalPrestige: 65 },
        { key: 'DEN', name: 'Denver Nuggets', historicalPrestige: 58 },
        { key: 'POR', name: 'Portland Trail Blazers', historicalPrestige: 62 },
        { key: 'SEA', name: 'Seattle SuperSonics', historicalPrestige: 74 },
        // Mid-tier teams
        { key: 'HOU', name: 'Houston Rockets', historicalPrestige: 70 },
        { key: 'ATL', name: 'Atlanta Hawks', historicalPrestige: 60 },
        { key: 'UTA', name: 'Utah Jazz', historicalPrestige: 64 },
        { key: 'CLE', name: 'Cleveland Cavaliers', historicalPrestige: 56 },
        { key: 'TOR', name: 'Toronto Raptors', historicalPrestige: 48 },
        { key: 'IND', name: 'Indiana Pacers', historicalPrestige: 63 },
        { key: 'ORL', name: 'Orlando Magic', historicalPrestige: 50 },
        { key: 'WAS', name: 'Washington Wizards', historicalPrestige: 55 },
        { key: 'SAC', name: 'Sacramento Kings', historicalPrestige: 52 },
        { key: 'MIN', name: 'Minnesota Timberwolves', historicalPrestige: 42 },
        { key: 'LAC', name: 'Los Angeles Clippers', historicalPrestige: 38 },
        { key: 'BKN', name: 'Brooklyn Nets', historicalPrestige: 54 },
        { key: 'MEM', name: 'Memphis Grizzlies', historicalPrestige: 45 },
        { key: 'NO', name: 'New Orleans Pelicans', historicalPrestige: 40 },
        { key: 'CHA', name: 'Charlotte Hornets', historicalPrestige: 35 }
    ]
};

const CURRENT_MULTIPLIERS = {
    // MLB 2024 season performance (post-season complete)
    MLB: {
        'LAD': 1.9,  // World Series champions
        'NYY': 1.7,  // World Series runners-up
        'HOU': 1.6,  // Strong playoff run
        'PHI': 1.5,  // NLCS appearance
        'BAL': 1.6,  // 101 wins, division winner
        'ATL': 1.4,  // Solid season
        'CLE': 1.5,  // AL Central champions
        'SD': 1.3,   // Wild card team
        'NYM': 1.2,  // Wild card team
        'TB': 1.3,   // Competitive season
        'MIN': 1.2,  // Playoff contender
        'MIL': 1.3,  // NL Central contender
        'BOS': 0.9,  // Disappointing season
        'SF': 0.8,   // Rebuild year
        'STL': 0.7,  // Below .500
        'CHC': 0.8,  // Rebuilding
        'ARI': 1.1,  // Competitive
        'TEX': 0.9,  // Defending champs slump
        'KC': 0.6,   // Last in division
        'CHW': 0.3,  // Worst record in MLB
        'COL': 0.4,  // Bottom of NL West
        'OAK': 0.5,  // Worst in AL
        'MIA': 0.6,  // Rebuild mode
        'WSH': 0.7,  // Development year
        'PIT': 0.8   // Young team developing
    },
    // NFL 2024 season (through Week 6)
    NFL: {
        'KC': 2.0,    // 5-0, undefeated
        'MIN': 1.9,   // 5-0, surprise team
        'DET': 1.8,   // 4-1, NFC North leader
        'WAS': 1.7,   // 4-1, rookie QB success
        'BAL': 1.7,   // 4-2, Lamar MVP candidate
        'SF': 1.6,    // 3-3, Super Bowl hangover
        'BUF': 1.6,   // 4-2, AFC contender
        'HOU': 1.5,   // 4-1, AFC South leader
        'GB': 1.5,    // 4-2, Love's breakout
        'PHI': 1.4,   // 3-2, NFC East battle
        'TB': 1.4,    // 4-2, Baker's resurgence
        'SEA': 1.3,   // 3-2, new coaching staff
        'PIT': 1.3,   // 3-2, defense strong
        'NO': 1.2,    // 2-3, injuries mounting
        'ATL': 1.2,   // 3-2, NFC South race
        'CHI': 1.1,   // 3-2, rookie QB promise
        'LAC': 0.8,   // 2-3, Herbert injured
        'IND': 1.0,   // 2-3, Richardson developing
        'DAL': 0.9,   // 3-2, inconsistent
        'LA': 0.8,    // 1-4, regression
        'NYG': 0.7,   // 2-4, rebuilding
        'CIN': 0.7,   // 1-4, disappointing
        'ARI': 0.9,   // 2-4, young team
        'NE': 0.6,    // 1-5, rebuild year
        'DEN': 1.0,   // 3-3, new QB evaluation
        'CLE': 0.7,   // 1-5, Watson struggles
        'JAX': 0.6,   // 1-5, massive regression
        'CAR': 0.5,   // 1-5, Young's development
        'TEN': 0.6,   // 1-4, complete rebuild
        'MIA': 1.0,   // 2-3, Tua injury concerns
        'NYJ': 0.7    // 2-4, Rodgers aging
    },
    // CFB 2024 season (through Week 7)
    CFB: {
        'TEX': 2.0,   // #1 ranked, undefeated
        'OSU': 1.9,   // Top 5, CFP bound
        'ORE': 1.9,   // Undefeated, Heisman QB
        'UGA': 1.8,   // SEC powerhouse
        'PSU': 1.7,   // Big Ten contender
        'MIAMI': 1.8, // ACC leader
        'CLEM': 1.6,  // ACC contender
        'USC': 1.4,   // Pac-12 strong
        'MICH': 1.5,  // Defending champs
        'ALA': 1.6,   // DeBoer's first year
        'ND': 1.5,    // Independent success
        'LSU': 1.4,   // SEC West solid
        'OU': 1.3,    // SEC transition
        'TAMU': 1.3,  // Weigman era
        'OLE': 1.5,   // Lane Kiffin offense
        'TENN': 1.4,  // Iamaleava's emergence
        'FLA': 1.2,   // Napier on hot seat
        'AUB': 1.0,   // Freeze building
        'FSU': 0.8,   // Transfer portal losses
        'WIS': 1.1,   // Fickell's second year
        'IOWA': 1.0,  // Kirk Ferentz steady
        'NEB': 0.9,   // Rhule year 2
        'WASH': 1.3,  // Rebuilding without stars
        'ARK': 1.1,   // Competitive
        'MSST': 0.9   // Rebuild year
    },
    // NBA 2024-25 season (pre-season projections)
    NBA: {
        'BOS': 2.0,   // Defending champions, Banner 18
        'DEN': 1.7,   // Jokic MVP favorite
        'PHX': 1.6,   // Big 3 with Beal healthy
        'MIL': 1.6,   // Dame + Giannis chemistry
        'LAL': 1.4,   // LeBron + AD aging
        'GSW': 1.3,   // Warriors retooling
        'DAL': 1.5,   // Luka + Kyrie year 2
        'MIA': 1.4,   // Butler's last run
        'NYK': 1.5,   // Brunson's breakout
        'PHI': 1.5,   // Embiid + Maxey
        'MEM': 1.3,   // Ja returns from suspension
        'SAC': 1.2,   // Fox + Sabonis continuity
        'CLE': 1.4,   // Mitchell + Mobley growth
        'NO': 1.2,    // Zion health question
        'MIN': 1.3,   // Gobert experiment year 2
        'LAC': 1.2,   // Kawhi health concerns
        'ATL': 1.1,   // Trae + Murray development
        'ORL': 1.2,   // Young core rising
        'IND': 1.1,   // Haliburton's emergence
        'TOR': 0.9,   // Rebuild begins
        'CHI': 0.8,   // Play-in bubble
        'BKN': 1.0,   // Post-Durant era
        'POR': 0.7,   // Full rebuild
        'DET': 0.8,   // Cade development year
        'HOU': 1.1,   // Jabari + Amen growth
        'WAS': 0.6,   // Bottom of East
        'CHA': 0.6,   // LaMelo injuries
        'SA': 1.4,    // Wembanyama hype
        'UTA': 0.7    // Tanking for Cooper Flagg
    }
};

export async function onRequest(context) {
    const { request } = context;
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Content-Type': 'application/json'
    };

    if (request.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const url = new URL(request.url);
        const limit = parseInt(url.searchParams.get('limit') || '80');

        const influenceData = {
            meta: {
                generated: new Date().toISOString(),
                algorithm: 'historical_prestige_0.6_current_0.4',
                version: '1.0.0'
            },
            sports: {}
        };

        for (const [sport, teams] of Object.entries(TEAM_INFLUENCE_DB)) {
            const sportMultipliers = CURRENT_MULTIPLIERS[sport] || {};
            const teamsWithInfluence = teams.map(team => {
                const currentMultiplier = sportMultipliers[team.key] || 1.0;
                const currentScore = team.historicalPrestige * currentMultiplier;
                const influenceScore = (team.historicalPrestige * 0.6) + (currentScore * 0.4);

                return {
                    ...team,
                    currentMultiplier,
                    influenceScore: Math.round(influenceScore * 10) / 10
                };
            });

            teamsWithInfluence.sort((a, b) => b.influenceScore - a.influenceScore);
            influenceData.sports[sport] = teamsWithInfluence.slice(0, limit);
        }

        return new Response(JSON.stringify(influenceData, null, 2), {
            headers: { ...corsHeaders, 'Cache-Control': 'public, max-age=300' }
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: corsHeaders
        });
    }
}
