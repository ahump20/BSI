/**
 * Blaze Sports Intel - Natural Language Query Parser
 *
 * Parses natural language questions about sports history into
 * structured query objects that can be executed against D1/R2.
 *
 * Examples:
 * - "Show me Cardinals vs Cubs games in 2023"
 * - "What's the Dodgers' record against division rivals?"
 * - "How often does Texas beat Oklahoma at home?"
 * - "Find all games where the Ravens scored over 30 points"
 */

/**
 * Parse natural language query into structured format
 *
 * @param {string} query - User's natural language question
 * @returns {Object} Parsed query structure
 */
export function parseNaturalLanguageQuery(query) {
  const normalizedQuery = query.toLowerCase().trim();

  // Initialize query structure
  const parsedQuery = {
    type: detectQueryType(normalizedQuery),
    sport: extractSport(normalizedQuery),
    teams: extractTeams(normalizedQuery),
    seasons: extractSeasons(normalizedQuery),
    location: extractLocation(normalizedQuery),
    filters: extractFilters(normalizedQuery),
    aggregation: extractAggregation(normalizedQuery),
    timeframe: extractTimeframe(normalizedQuery),
  };

  return parsedQuery;
}

/**
 * Detect query type (matchup, record, performance, trends, comparison)
 */
function detectQueryType(query) {
  // Matchup queries
  if (/\b(vs|versus|against|played)\b/.test(query)) {
    return 'matchup';
  }

  // Record queries
  if (/\b(record|win|loss|won|lost|streak)\b/.test(query)) {
    return 'record';
  }

  // Performance queries
  if (/\b(score|scored|points|runs|yards|stats|performance)\b/.test(query)) {
    return 'performance';
  }

  // Trend queries
  if (/\b(trend|over time|recent|lately|this season)\b/.test(query)) {
    return 'trend';
  }

  // Comparison queries
  if (/\b(compare|better|worse|best|worst|most|least)\b/.test(query)) {
    return 'comparison';
  }

  // Default to general search
  return 'search';
}

/**
 * Extract sport from query
 */
function extractSport(query) {
  const sportPatterns = {
    mlb: /\b(baseball|mlb|pitcher|batter|inning|home run)\b/i,
    nfl: /\b(football|nfl|quarterback|touchdown|yards|super bowl)\b/i,
    nba: /\b(basketball|nba|points|rebounds|assists|three-pointer)\b/i,
    ncaa_football: /\b(college football|ncaa football|cfb|bowl game)\b/i,
    ncaa_baseball: /\b(college baseball|ncaa baseball|college world series)\b/i,
  };

  for (const [sport, pattern] of Object.entries(sportPatterns)) {
    if (pattern.test(query)) {
      return sport.toUpperCase();
    }
  }

  return null; // All sports
}

/**
 * Extract team names/identifiers from query
 */
function extractTeams(query) {
  const teams = [];

  // Common team name patterns
  const teamPatterns = [
    // MLB teams
    { name: 'Cardinals', aliases: ['cards', 'stl', 'st. louis'], sport: 'MLB' },
    { name: 'Cubs', aliases: ['chicago cubs', 'chc'], sport: 'MLB' },
    { name: 'Dodgers', aliases: ['la dodgers', 'lad', 'los angeles'], sport: 'MLB' },
    { name: 'Yankees', aliases: ['ny yankees', 'nyy', 'bronx bombers'], sport: 'MLB' },
    { name: 'Red Sox', aliases: ['boston', 'bos'], sport: 'MLB' },

    // NFL teams
    { name: 'Chiefs', aliases: ['kansas city', 'kc'], sport: 'NFL' },
    { name: 'Ravens', aliases: ['baltimore', 'bal'], sport: 'NFL' },
    { name: 'Patriots', aliases: ['new england', 'ne', 'pats'], sport: 'NFL' },
    { name: 'Cowboys', aliases: ['dallas', 'dal'], sport: 'NFL' },
    { name: 'Packers', aliases: ['green bay', 'gb'], sport: 'NFL' },

    // NCAA Football teams
    { name: 'Texas', aliases: ['longhorns', 'ut', 'university of texas'], sport: 'NCAA_FOOTBALL' },
    { name: 'Oklahoma', aliases: ['sooners', 'ou'], sport: 'NCAA_FOOTBALL' },
    { name: 'Alabama', aliases: ['crimson tide', 'bama', 'ua'], sport: 'NCAA_FOOTBALL' },
    { name: 'Georgia', aliases: ['bulldogs', 'uga'], sport: 'NCAA_FOOTBALL' },
    { name: 'Ohio State', aliases: ['buckeyes', 'osu'], sport: 'NCAA_FOOTBALL' },
  ];

  for (const team of teamPatterns) {
    const patterns = [team.name.toLowerCase(), ...team.aliases];

    for (const pattern of patterns) {
      if (query.includes(pattern)) {
        // Avoid duplicate entries
        if (!teams.some((t) => t.name === team.name)) {
          teams.push({
            name: team.name,
            sport: team.sport,
            matched_alias: pattern,
          });
        }
        break;
      }
    }
  }

  return teams;
}

/**
 * Extract seasons/years from query
 */
function extractSeasons(query) {
  const seasons = [];

  // Match 4-digit years
  const yearPattern = /\b(19|20)\d{2}\b/g;
  const matches = query.match(yearPattern);

  if (matches) {
    for (const year of matches) {
      const season = parseInt(year);
      if (season >= 1900 && season <= 2100) {
        seasons.push(season);
      }
    }
  }

  // Handle relative timeframes
  if (/\b(this year|current season)\b/.test(query)) {
    seasons.push(new Date().getFullYear());
  }

  if (/\b(last year|previous season)\b/.test(query)) {
    seasons.push(new Date().getFullYear() - 1);
  }

  if (/\b(last (\d+) years)\b/.test(query)) {
    const match = query.match(/last (\d+) years/);
    const count = parseInt(match[1]);
    const currentYear = new Date().getFullYear();

    for (let i = 0; i < count; i++) {
      seasons.push(currentYear - i);
    }
  }

  return seasons.length > 0 ? seasons : null;
}

/**
 * Extract location constraints (home/away/neutral)
 */
function extractLocation(query) {
  if (/\b(at home|home games)\b/.test(query)) {
    return 'home';
  }

  if (/\b(on the road|away games|on road)\b/.test(query)) {
    return 'away';
  }

  if (/\b(neutral site|neutral)\b/.test(query)) {
    return 'neutral';
  }

  return null; // All locations
}

/**
 * Extract filters (score thresholds, win/loss, overtime, etc.)
 */
function extractFilters(query) {
  const filters = {};

  // Score thresholds
  const scorePattern = /\b(over|more than|above|greater than)\s+(\d+)\s+(points|runs)\b/;
  const scoreMatch = query.match(scorePattern);
  if (scoreMatch) {
    filters.min_score = parseInt(scoreMatch[2]);
  }

  const scoreLessPattern = /\b(under|less than|below|fewer than)\s+(\d+)\s+(points|runs)\b/;
  const scoreLessMatch = query.match(scoreLessPattern);
  if (scoreLessMatch) {
    filters.max_score = parseInt(scoreLessMatch[2]);
  }

  // Win/Loss filter
  if (/\b(wins|won|victories)\b/.test(query)) {
    filters.result = 'win';
  }

  if (/\b(losses|lost|defeats)\b/.test(query)) {
    filters.result = 'loss';
  }

  // Close games
  if (/\b(close games?|one-score|tight)\b/.test(query)) {
    filters.close_game = true; // Margin <= 7 (football) or 3 (baseball)
  }

  // Blowouts
  if (/\b(blowout|dominant|crushing)\b/.test(query)) {
    filters.blowout = true; // Margin >= 21 (football) or 10 (baseball)
  }

  // Overtime/Extra innings
  if (/\b(overtime|ot|extra innings)\b/.test(query)) {
    filters.overtime = true;
  }

  // Playoffs
  if (/\b(playoff|postseason)\b/.test(query)) {
    filters.season_type = 'POST';
  }

  // Regular season
  if (/\b(regular season)\b/.test(query)) {
    filters.season_type = 'REG';
  }

  return Object.keys(filters).length > 0 ? filters : null;
}

/**
 * Extract aggregation request (count, average, total, etc.)
 */
function extractAggregation(query) {
  if (/\b(how many|count|number of)\b/.test(query)) {
    return 'count';
  }

  if (/\b(average|avg|mean)\b/.test(query)) {
    return 'average';
  }

  if (/\b(total|sum|combined)\b/.test(query)) {
    return 'sum';
  }

  if (/\b(highest|maximum|max|most|best)\b/.test(query)) {
    return 'max';
  }

  if (/\b(lowest|minimum|min|least|worst)\b/.test(query)) {
    return 'min';
  }

  return null;
}

/**
 * Extract timeframe (all-time, last N games, etc.)
 */
function extractTimeframe(query) {
  // All-time
  if (/\b(all-time|all time|ever|history)\b/.test(query)) {
    return { type: 'all-time' };
  }

  // Last N games
  const lastNPattern = /\b(last|past|recent)\s+(\d+)\s+(games?|matches?)\b/;
  const lastNMatch = query.match(lastNPattern);
  if (lastNMatch) {
    return {
      type: 'last_n_games',
      count: parseInt(lastNMatch[2]),
    };
  }

  // Since date
  const sincePattern =
    /\bsince\s+(january|february|march|april|may|june|july|august|september|october|november|december)?\s*(19|20)\d{2}\b/i;
  const sinceMatch = query.match(sincePattern);
  if (sinceMatch) {
    return {
      type: 'since_date',
      date: sinceMatch[0].replace('since', '').trim(),
    };
  }

  // Current/this season
  if (/\b(this season|current season|this year)\b/.test(query)) {
    return {
      type: 'current_season',
      season: new Date().getFullYear(),
    };
  }

  return null; // No timeframe specified
}

/**
 * Validate and clean parsed query
 */
export function validateParsedQuery(parsedQuery) {
  const errors = [];

  // Matchup queries require at least 2 teams
  if (parsedQuery.type === 'matchup' && parsedQuery.teams.length < 2) {
    errors.push('Matchup queries require at least two teams');
  }

  // Comparison queries require teams or timeframes
  if (parsedQuery.type === 'comparison' && !parsedQuery.teams.length && !parsedQuery.seasons) {
    errors.push('Comparison queries require teams or timeframes to compare');
  }

  return {
    valid: errors.length === 0,
    errors,
    cleaned: errors.length === 0 ? parsedQuery : null,
  };
}

/**
 * Generate human-readable explanation of parsed query
 */
export function explainParsedQuery(parsedQuery) {
  const parts = [];

  // Query type
  parts.push(`Query Type: ${parsedQuery.type}`);

  // Sport
  if (parsedQuery.sport) {
    parts.push(`Sport: ${parsedQuery.sport}`);
  }

  // Teams
  if (parsedQuery.teams.length > 0) {
    const teamNames = parsedQuery.teams.map((t) => t.name).join(' vs ');
    parts.push(`Teams: ${teamNames}`);
  }

  // Seasons
  if (parsedQuery.seasons) {
    parts.push(`Seasons: ${parsedQuery.seasons.join(', ')}`);
  }

  // Location
  if (parsedQuery.location) {
    parts.push(`Location: ${parsedQuery.location} games`);
  }

  // Filters
  if (parsedQuery.filters) {
    const filterDesc = [];

    if (parsedQuery.filters.min_score) {
      filterDesc.push(`scoring over ${parsedQuery.filters.min_score}`);
    }
    if (parsedQuery.filters.result) {
      filterDesc.push(`${parsedQuery.filters.result}s only`);
    }
    if (parsedQuery.filters.season_type) {
      filterDesc.push(parsedQuery.filters.season_type === 'POST' ? 'playoffs' : 'regular season');
    }

    if (filterDesc.length > 0) {
      parts.push(`Filters: ${filterDesc.join(', ')}`);
    }
  }

  // Aggregation
  if (parsedQuery.aggregation) {
    parts.push(`Aggregation: ${parsedQuery.aggregation}`);
  }

  // Timeframe
  if (parsedQuery.timeframe) {
    parts.push(`Timeframe: ${JSON.stringify(parsedQuery.timeframe)}`);
  }

  return parts.join(' | ');
}
