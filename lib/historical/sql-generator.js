/**
 * Blaze Sports Intel - SQL Query Generator
 *
 * Converts parsed natural language queries into executable SQL
 * for querying historical game data from D1 database.
 *
 * Handles:
 * - Matchup queries (head-to-head records)
 * - Record queries (win/loss records with filters)
 * - Performance queries (scoring, stats)
 * - Trend queries (patterns over time)
 * - Comparison queries (team vs team analysis)
 */

/**
 * Generate SQL query from parsed NL query structure
 *
 * @param {Object} parsedQuery - Output from nl-query-parser
 * @returns {Object} SQL query with params
 */
export function generateSQLFromParsedQuery(parsedQuery) {
  switch (parsedQuery.type) {
    case 'matchup':
      return generateMatchupQuery(parsedQuery);
    case 'record':
      return generateRecordQuery(parsedQuery);
    case 'performance':
      return generatePerformanceQuery(parsedQuery);
    case 'trend':
      return generateTrendQuery(parsedQuery);
    case 'comparison':
      return generateComparisonQuery(parsedQuery);
    default:
      return generateSearchQuery(parsedQuery);
  }
}

/**
 * Generate matchup query (team vs team)
 */
function generateMatchupQuery(parsedQuery) {
  const { teams, seasons, location, filters } = parsedQuery;

  if (teams.length < 2) {
    throw new Error('Matchup query requires at least 2 teams');
  }

  const team1 = teams[0].name;
  const team2 = teams[1].name;

  let sql = `
    SELECT
      game_id,
      sport,
      season,
      season_type,
      week,
      game_date,
      home_team_id,
      home_team_name,
      away_team_id,
      away_team_name,
      home_score,
      away_score,
      venue,
      attendance,
      CASE
        WHEN home_team_name = ? THEN home_score
        WHEN away_team_name = ? THEN away_score
      END as team1_score,
      CASE
        WHEN home_team_name = ? THEN away_score
        WHEN away_team_name = ? THEN home_score
      END as team2_score,
      CASE
        WHEN home_team_name = ? AND home_score > away_score THEN 'W'
        WHEN away_team_name = ? AND away_score > home_score THEN 'W'
        ELSE 'L'
      END as team1_result
    FROM historical_games
    WHERE status = 'final'
      AND (
        (home_team_name = ? AND away_team_name = ?)
        OR
        (home_team_name = ? AND away_team_name = ?)
      )
  `;

  const params = [team1, team1, team1, team1, team1, team1, team1, team2, team2, team1];

  // Add sport filter
  if (parsedQuery.sport) {
    sql += ' AND sport = ?';
    params.push(parsedQuery.sport);
  }

  // Add season filter
  if (seasons && seasons.length > 0) {
    sql += ` AND season IN (${seasons.map(() => '?').join(',')})`;
    params.push(...seasons);
  }

  // Add location filter
  if (location === 'home') {
    sql += ' AND home_team_name = ?';
    params.push(team1);
  } else if (location === 'away') {
    sql += ' AND away_team_name = ?';
    params.push(team1);
  }

  // Add score filters
  if (filters) {
    sql += applyFilters(filters, params);
  }

  sql += ' ORDER BY game_date DESC';

  return { sql, params };
}

/**
 * Generate record query
 */
function generateRecordQuery(parsedQuery) {
  const { teams, seasons, location, filters } = parsedQuery;

  if (teams.length === 0) {
    throw new Error('Record query requires at least one team');
  }

  const teamName = teams[0].name;

  let sql = `
    SELECT
      game_id,
      sport,
      season,
      season_type,
      game_date,
      home_team_name,
      away_team_name,
      home_score,
      away_score,
      CASE
        WHEN home_team_name = ? THEN 'home'
        ELSE 'away'
      END as location,
      CASE
        WHEN home_team_name = ? AND home_score > away_score THEN 'W'
        WHEN away_team_name = ? AND away_score > home_score THEN 'W'
        ELSE 'L'
      END as result,
      CASE
        WHEN home_team_name = ? THEN home_score
        ELSE away_score
      END as team_score,
      CASE
        WHEN home_team_name = ? THEN away_score
        ELSE home_score
      END as opponent_score,
      ABS(home_score - away_score) as margin
    FROM historical_games
    WHERE status = 'final'
      AND (home_team_name = ? OR away_team_name = ?)
  `;

  const params = [teamName, teamName, teamName, teamName, teamName, teamName, teamName];

  // Add sport filter
  if (parsedQuery.sport) {
    sql += ' AND sport = ?';
    params.push(parsedQuery.sport);
  }

  // Add season filter
  if (seasons && seasons.length > 0) {
    sql += ` AND season IN (${seasons.map(() => '?').join(',')})`;
    params.push(...seasons);
  }

  // Add location filter
  if (location === 'home') {
    sql += ' AND home_team_name = ?';
    params.push(teamName);
  } else if (location === 'away') {
    sql += ' AND away_team_name = ?';
    params.push(teamName);
  }

  // Add filters
  if (filters) {
    sql += applyFilters(filters, params, teamName);
  }

  sql += ' ORDER BY game_date DESC';

  return { sql, params };
}

/**
 * Generate performance query (scoring stats)
 */
function generatePerformanceQuery(parsedQuery) {
  const { teams, seasons, aggregation } = parsedQuery;

  if (teams.length === 0) {
    throw new Error('Performance query requires at least one team');
  }

  const teamName = teams[0].name;

  let sql;
  const params = [teamName, teamName];

  if (aggregation === 'average') {
    sql = `
      SELECT
        AVG(
          CASE
            WHEN home_team_name = ? THEN home_score
            ELSE away_score
          END
        ) as avg_points_scored,
        AVG(
          CASE
            WHEN home_team_name = ? THEN away_score
            ELSE home_score
          END
        ) as avg_points_allowed,
        COUNT(*) as games_played
      FROM historical_games
      WHERE status = 'final'
        AND (home_team_name = ? OR away_team_name = ?)
    `;
    params.push(teamName, teamName);
  } else if (aggregation === 'max') {
    sql = `
      SELECT
        MAX(
          CASE
            WHEN home_team_name = ? THEN home_score
            ELSE away_score
          END
        ) as highest_score,
        game_id,
        game_date,
        home_team_name,
        away_team_name,
        home_score,
        away_score
      FROM historical_games
      WHERE status = 'final'
        AND (home_team_name = ? OR away_team_name = ?)
    `;
    params.push(teamName, teamName);
  } else {
    // Default: show all games with scoring
    sql = `
      SELECT
        game_id,
        game_date,
        home_team_name,
        away_team_name,
        home_score,
        away_score,
        CASE
          WHEN home_team_name = ? THEN home_score
          ELSE away_score
        END as team_score
      FROM historical_games
      WHERE status = 'final'
        AND (home_team_name = ? OR away_team_name = ?)
    `;
    params.push(teamName, teamName);
  }

  // Add sport filter
  if (parsedQuery.sport) {
    sql += ' AND sport = ?';
    params.push(parsedQuery.sport);
  }

  // Add season filter
  if (seasons && seasons.length > 0) {
    sql += ` AND season IN (${seasons.map(() => '?').join(',')})`;
    params.push(...seasons);
  }

  if (!aggregation || aggregation === 'max') {
    sql += ' ORDER BY game_date DESC';
  }

  return { sql, params };
}

/**
 * Generate trend query (patterns over time)
 */
function generateTrendQuery(parsedQuery) {
  const { teams, seasons } = parsedQuery;

  if (teams.length === 0) {
    throw new Error('Trend query requires at least one team');
  }

  const teamName = teams[0].name;

  const sql = `
    SELECT
      season,
      COUNT(*) as games_played,
      SUM(
        CASE
          WHEN (home_team_name = ? AND home_score > away_score)
            OR (away_team_name = ? AND away_score > home_score)
          THEN 1 ELSE 0
        END
      ) as wins,
      SUM(
        CASE
          WHEN (home_team_name = ? AND home_score < away_score)
            OR (away_team_name = ? AND away_score < home_score)
          THEN 1 ELSE 0
        END
      ) as losses,
      AVG(
        CASE
          WHEN home_team_name = ? THEN home_score
          ELSE away_score
        END
      ) as avg_points_scored,
      AVG(
        CASE
          WHEN home_team_name = ? THEN away_score
          ELSE home_score
        END
      ) as avg_points_allowed
    FROM historical_games
    WHERE status = 'final'
      AND (home_team_name = ? OR away_team_name = ?)
  `;

  const params = [teamName, teamName, teamName, teamName, teamName, teamName, teamName, teamName];

  // Add sport filter
  if (parsedQuery.sport) {
    sql += ' AND sport = ?';
    params.push(parsedQuery.sport);
  }

  // Add season filter
  if (seasons && seasons.length > 0) {
    sql += ` AND season IN (${seasons.map(() => '?').join(',')})`;
    params.push(...seasons);
  }

  sql += ' GROUP BY season ORDER BY season DESC';

  return { sql, params };
}

/**
 * Generate comparison query
 */
function generateComparisonQuery(parsedQuery) {
  const { teams, seasons } = parsedQuery;

  if (teams.length < 2) {
    throw new Error('Comparison query requires at least 2 teams');
  }

  const team1 = teams[0].name;
  const team2 = teams[1].name;

  const sql = `
    SELECT
      CASE
        WHEN home_team_name = ? OR away_team_name = ? THEN ?
        ELSE ?
      END as team,
      COUNT(*) as games_played,
      SUM(
        CASE
          WHEN (home_team_name = ? AND home_score > away_score)
            OR (away_team_name = ? AND away_score > home_score)
          THEN 1
          WHEN (home_team_name = ? AND home_score > away_score)
            OR (away_team_name = ? AND away_score > home_score)
          THEN 1
          ELSE 0
        END
      ) as wins,
      AVG(
        CASE
          WHEN home_team_name = ? THEN home_score
          WHEN away_team_name = ? THEN away_score
          WHEN home_team_name = ? THEN home_score
          ELSE away_score
        END
      ) as avg_points_scored
    FROM historical_games
    WHERE status = 'final'
      AND (
        home_team_name IN (?, ?)
        OR away_team_name IN (?, ?)
      )
  `;

  const params = [
    team1,
    team1,
    team1,
    team2,
    team1,
    team1,
    team2,
    team2,
    team1,
    team1,
    team2,
    team1,
    team2,
    team1,
    team2,
  ];

  // Add sport filter
  if (parsedQuery.sport) {
    sql += ' AND sport = ?';
    params.push(parsedQuery.sport);
  }

  // Add season filter
  if (seasons && seasons.length > 0) {
    sql += ` AND season IN (${seasons.map(() => '?').join(',')})`;
    params.push(...seasons);
  }

  sql += ' GROUP BY team';

  return { sql, params };
}

/**
 * Generate general search query
 */
function generateSearchQuery(parsedQuery) {
  const { teams, seasons, sport } = parsedQuery;

  let sql = `
    SELECT
      game_id,
      sport,
      season,
      season_type,
      game_date,
      home_team_name,
      away_team_name,
      home_score,
      away_score,
      venue,
      attendance
    FROM historical_games
    WHERE status = 'final'
  `;

  const params = [];

  // Add team filter
  if (teams.length > 0) {
    const teamNames = teams.map((t) => t.name);
    sql += ` AND (home_team_name IN (${teamNames.map(() => '?').join(',')}) OR away_team_name IN (${teamNames.map(() => '?').join(',')}))`;
    params.push(...teamNames, ...teamNames);
  }

  // Add sport filter
  if (sport) {
    sql += ' AND sport = ?';
    params.push(sport);
  }

  // Add season filter
  if (seasons && seasons.length > 0) {
    sql += ` AND season IN (${seasons.map(() => '?').join(',')})`;
    params.push(...seasons);
  }

  sql += ' ORDER BY game_date DESC LIMIT 100';

  return { sql, params };
}

/**
 * Apply filters to SQL query
 */
function applyFilters(filters, params, teamName = null) {
  let filterSQL = '';

  // Result filter (wins/losses)
  if (filters.result && teamName) {
    if (filters.result === 'win') {
      filterSQL += ` AND ((home_team_name = ? AND home_score > away_score) OR (away_team_name = ? AND away_score > home_score))`;
      params.push(teamName, teamName);
    } else if (filters.result === 'loss') {
      filterSQL += ` AND ((home_team_name = ? AND home_score < away_score) OR (away_team_name = ? AND away_score < home_score))`;
      params.push(teamName, teamName);
    }
  }

  // Score thresholds
  if (filters.min_score && teamName) {
    filterSQL += ` AND ((home_team_name = ? AND home_score >= ?) OR (away_team_name = ? AND away_score >= ?))`;
    params.push(teamName, filters.min_score, teamName, filters.min_score);
  }

  if (filters.max_score && teamName) {
    filterSQL += ` AND ((home_team_name = ? AND home_score <= ?) OR (away_team_name = ? AND away_score <= ?))`;
    params.push(teamName, filters.max_score, teamName, filters.max_score);
  }

  // Close game filter
  if (filters.close_game) {
    filterSQL += ` AND ABS(home_score - away_score) <= 7`; // 7 for football, adjust by sport
  }

  // Blowout filter
  if (filters.blowout) {
    filterSQL += ` AND ABS(home_score - away_score) >= 21`; // 21 for football, adjust by sport
  }

  // Season type filter
  if (filters.season_type) {
    filterSQL += ` AND season_type = ?`;
    params.push(filters.season_type);
  }

  return filterSQL;
}

/**
 * Execute SQL query against D1 database
 */
export async function executeSQLQuery(db, sqlQuery) {
  try {
    const { sql, params } = sqlQuery;

    const results = await db
      .prepare(sql)
      .bind(...params)
      .all();

    return {
      success: true,
      rows: results.results || [],
      count: results.results?.length || 0,
    };
  } catch (error) {
    console.error('SQL execution error:', error);
    return {
      success: false,
      error: error.message,
      rows: [],
      count: 0,
    };
  }
}
