/**
 * Blaze Sports Intel - Comprehensive Dashboard Builder
 *
 * Creates customizable, multi-sport analytics dashboards with real-time data.
 *
 * Features:
 * - Multi-sport support (NFL, MLB, NBA, NCAA)
 * - Customizable widgets and layouts
 * - Real-time data updates
 * - Responsive design
 * - Export capabilities
 */

/**
 * Dashboard configuration structure
 */
export const DashboardConfig = {
  layout: 'grid', // 'grid', 'rows', 'custom'
  columns: 3,
  refreshInterval: 30000, // 30 seconds
  theme: 'dark', // 'dark', 'light'
  widgets: [], // Array of widget configurations
};

/**
 * Available widget types
 */
export const WidgetTypes = {
  STANDINGS: 'standings',
  LIVE_SCORES: 'live_scores',
  PLAYER_STATS: 'player_stats',
  TEAM_COMPARISON: 'team_comparison',
  WIN_PROBABILITY: 'win_probability',
  BETTING_LINES: 'betting_lines',
  INJURY_REPORT: 'injury_report',
  PREDICTIONS: 'predictions',
  HISTORICAL_TRENDS: 'historical_trends',
  PERFORMANCE_METRICS: 'performance_metrics',
};

/**
 * Create a comprehensive dashboard
 */
export async function createDashboard(config, env) {
  validateDashboardConfig(config);

  const dashboard = {
    id: generateDashboardId(),
    name: config.name || 'Untitled Dashboard',
    description: config.description || '',
    layout: config.layout || DashboardConfig.layout,
    columns: config.columns || DashboardConfig.columns,
    refreshInterval: config.refreshInterval || DashboardConfig.refreshInterval,
    theme: config.theme || DashboardConfig.theme,
    widgets: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Create widgets
  for (const widgetConfig of config.widgets || []) {
    const widget = await createWidget(widgetConfig, env);
    dashboard.widgets.push(widget);
  }

  // Store dashboard configuration in KV
  await env.SPORTS_DATA_KV.put(
    `dashboard:${dashboard.id}`,
    JSON.stringify(dashboard),
    { expirationTtl: 2592000 } // 30 days
  );

  return dashboard;
}

/**
 * Create a widget
 */
export async function createWidget(widgetConfig, env) {
  const widget = {
    id: generateWidgetId(),
    type: widgetConfig.type,
    title: widgetConfig.title || getDefaultWidgetTitle(widgetConfig.type),
    sport: widgetConfig.sport || null,
    team: widgetConfig.team || null,
    player: widgetConfig.player || null,
    size: widgetConfig.size || 'medium', // 'small', 'medium', 'large'
    position: widgetConfig.position || { row: 0, col: 0 },
    settings: widgetConfig.settings || {},
    data: null,
    lastUpdated: null,
  };

  // Fetch initial data for the widget
  widget.data = await fetchWidgetData(widget, env);
  widget.lastUpdated = new Date().toISOString();

  return widget;
}

/**
 * Fetch data for a specific widget
 */
export async function fetchWidgetData(widget, env) {
  switch (widget.type) {
    case WidgetTypes.STANDINGS:
      return await fetchStandingsData(widget, env);

    case WidgetTypes.LIVE_SCORES:
      return await fetchLiveScoresData(widget, env);

    case WidgetTypes.PLAYER_STATS:
      return await fetchPlayerStatsData(widget, env);

    case WidgetTypes.TEAM_COMPARISON:
      return await fetchTeamComparisonData(widget, env);

    case WidgetTypes.WIN_PROBABILITY:
      return await fetchWinProbabilityData(widget, env);

    case WidgetTypes.BETTING_LINES:
      return await fetchBettingLinesData(widget, env);

    case WidgetTypes.INJURY_REPORT:
      return await fetchInjuryReportData(widget, env);

    case WidgetTypes.PREDICTIONS:
      return await fetchPredictionsData(widget, env);

    case WidgetTypes.HISTORICAL_TRENDS:
      return await fetchHistoricalTrendsData(widget, env);

    case WidgetTypes.PERFORMANCE_METRICS:
      return await fetchPerformanceMetricsData(widget, env);

    default:
      throw new Error(`Unknown widget type: ${widget.type}`);
  }
}

/**
 * Fetch standings data
 */
async function fetchStandingsData(widget, env) {
  const { sport, team } = widget;

  if (!sport) {
    throw new Error('Sport required for standings widget');
  }

  // Query database for standings
  const query = team
    ? `SELECT * FROM standings WHERE sport = ? AND team_id = ? ORDER BY wins DESC`
    : `SELECT * FROM standings WHERE sport = ? ORDER BY wins DESC`;

  const bindings = team ? [sport, team] : [sport];

  const results = await env.DB.prepare(query)
    .bind(...bindings)
    .all();

  return {
    sport,
    teams: results.results.map((row) => ({
      teamId: row.team_id,
      teamName: row.team_name,
      wins: row.wins,
      losses: row.losses,
      winPct: (row.wins / (row.wins + row.losses)).toFixed(3),
      gamesBehind: row.games_behind,
      streak: row.streak,
      lastTen: row.last_ten,
      home: row.home_record,
      away: row.away_record,
    })),
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Fetch live scores data
 */
async function fetchLiveScoresData(widget, env) {
  const { sport } = widget;

  if (!sport) {
    throw new Error('Sport required for live scores widget');
  }

  // Query database for live and recent games
  const results = await env.DB.prepare(
    `
    SELECT *
    FROM games
    WHERE sport = ?
      AND (status = 'live' OR status = 'in_progress' OR game_date >= date('now', '-1 day'))
    ORDER BY game_date DESC, game_time DESC
    LIMIT 20
  `
  )
    .bind(sport)
    .all();

  return {
    sport,
    games: results.results.map((row) => ({
      gameId: row.game_id,
      homeTeam: row.home_team_name,
      homeScore: row.home_score,
      awayTeam: row.away_team_name,
      awayScore: row.away_score,
      status: row.status,
      period: row.period,
      timeRemaining: row.time_remaining,
      gameDate: row.game_date,
      gameTime: row.game_time,
    })),
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Fetch player stats data
 */
async function fetchPlayerStatsData(widget, env) {
  const { sport, player, team } = widget;
  const statType = widget.settings?.statType || 'season';
  const limit = widget.settings?.limit || 10;

  let query = `
    SELECT *
    FROM player_stats
    WHERE sport = ?
  `;
  const bindings = [sport];

  if (player) {
    query += ` AND player_id = ?`;
    bindings.push(player);
  }

  if (team) {
    query += ` AND team_id = ?`;
    bindings.push(team);
  }

  if (statType === 'season') {
    query += ` AND stat_type = 'season'`;
  } else if (statType === 'game') {
    query += ` AND stat_type = 'game' ORDER BY game_date DESC`;
  }

  query += ` LIMIT ?`;
  bindings.push(limit);

  const results = await env.DB.prepare(query)
    .bind(...bindings)
    .all();

  return {
    sport,
    statType,
    players: results.results.map((row) => ({
      playerId: row.player_id,
      playerName: row.player_name,
      teamName: row.team_name,
      position: row.position,
      stats: JSON.parse(row.stats_json),
    })),
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Fetch team comparison data
 */
async function fetchTeamComparisonData(widget, env) {
  const { sport } = widget;
  const team1 = widget.settings?.team1;
  const team2 = widget.settings?.team2;

  if (!team1 || !team2) {
    throw new Error('Two teams required for comparison widget');
  }

  // Fetch team stats
  const [team1Stats, team2Stats] = await Promise.all([
    env.DB.prepare(
      `
      SELECT * FROM team_stats WHERE sport = ? AND team_id = ?
    `
    )
      .bind(sport, team1)
      .first(),
    env.DB.prepare(
      `
      SELECT * FROM team_stats WHERE sport = ? AND team_id = ?
    `
    )
      .bind(sport, team2)
      .first(),
  ]);

  // Calculate comparison metrics
  const comparison = {
    team1: {
      teamId: team1Stats.team_id,
      teamName: team1Stats.team_name,
      stats: JSON.parse(team1Stats.stats_json),
    },
    team2: {
      teamId: team2Stats.team_id,
      teamName: team2Stats.team_name,
      stats: JSON.parse(team2Stats.stats_json),
    },
    advantages: calculateAdvantages(
      JSON.parse(team1Stats.stats_json),
      JSON.parse(team2Stats.stats_json)
    ),
  };

  return comparison;
}

/**
 * Fetch win probability data
 */
async function fetchWinProbabilityData(widget, env) {
  const { sport } = widget;
  const gameId = widget.settings?.gameId;

  if (!gameId) {
    // Return latest games with win probabilities
    const results = await env.DB.prepare(
      `
      SELECT *
      FROM prediction_streams
      WHERE sport = ?
        AND status = 'active'
      ORDER BY last_update DESC
      LIMIT 5
    `
    )
      .bind(sport)
      .all();

    return {
      games: results.results.map((row) => ({
        gameId: row.game_id,
        homeTeam: row.home_team,
        awayTeam: row.away_team,
        homeWinProb: row.home_win_prob,
        awayWinProb: row.away_win_prob,
        confidence: row.confidence,
        lastUpdate: row.last_update,
      })),
    };
  }

  // Fetch specific game prediction history
  const history = await env.SPORTS_DATA_KV.get(`prediction_history:${gameId}`, 'json');

  return {
    gameId,
    history: history || [],
    current: history?.[history.length - 1] || null,
  };
}

/**
 * Fetch betting lines data
 */
async function fetchBettingLinesData(widget, env) {
  const { sport } = widget;
  const gameId = widget.settings?.gameId;

  let query = `
    SELECT *
    FROM betting_analysis
    WHERE sport = ?
  `;
  const bindings = [sport];

  if (gameId) {
    query += ` AND game_id = ?`;
    bindings.push(gameId);
  } else {
    query += ` ORDER BY game_date DESC LIMIT 10`;
  }

  const results = await env.DB.prepare(query)
    .bind(...bindings)
    .all();

  return {
    games: results.results.map((row) => ({
      gameId: row.game_id,
      homeTeam: row.home_team,
      awayTeam: row.away_team,
      spread: row.spread,
      moneyline: row.moneyline,
      overUnder: row.over_under,
      edge: row.edge,
      recommendation: row.recommendation,
    })),
  };
}

/**
 * Fetch injury report data
 */
async function fetchInjuryReportData(widget, env) {
  const { sport, team } = widget;

  let query = `
    SELECT *
    FROM injury_reports
    WHERE sport = ?
      AND status != 'returned'
  `;
  const bindings = [sport];

  if (team) {
    query += ` AND team_id = ?`;
    bindings.push(team);
  }

  query += ` ORDER BY severity DESC, injury_date DESC`;

  const results = await env.DB.prepare(query)
    .bind(...bindings)
    .all();

  return {
    injuries: results.results.map((row) => ({
      playerId: row.player_id,
      playerName: row.player_name,
      teamName: row.team_name,
      position: row.position,
      injury: row.injury,
      status: row.status,
      severity: row.severity,
      projectedImpact: row.projected_impact,
      injuryDate: row.injury_date,
      expectedReturn: row.expected_return,
    })),
  };
}

/**
 * Fetch predictions data
 */
async function fetchPredictionsData(widget, env) {
  const { sport } = widget;

  // Get recent predictions with actual outcomes
  const results = await env.DB.prepare(
    `
    SELECT *
    FROM prediction_records
    WHERE sport = ?
      AND actual_outcome IS NOT NULL
    ORDER BY timestamp DESC
    LIMIT 20
  `
  )
    .bind(sport)
    .all();

  return {
    predictions: results.results.map((row) => ({
      gameId: row.game_id,
      homeTeam: row.home_team,
      awayTeam: row.away_team,
      predictedHomeWinProb: row.predicted_home_win_prob,
      actualOutcome: row.actual_outcome,
      correct: row.correct === 1,
      brierScore: row.brier_score,
      confidence: row.confidence,
    })),
    accuracy:
      (results.results.filter((r) => r.correct === 1).length / results.results.length) * 100,
  };
}

/**
 * Fetch historical trends data
 */
async function fetchHistoricalTrendsData(widget, env) {
  const { sport, team } = widget;
  const metric = widget.settings?.metric || 'wins';
  const period = widget.settings?.period || 'season';

  let query = `
    SELECT *
    FROM historical_stats
    WHERE sport = ?
  `;
  const bindings = [sport];

  if (team) {
    query += ` AND team_id = ?`;
    bindings.push(team);
  }

  if (period === 'season') {
    query += ` AND period_type = 'season' ORDER BY season DESC LIMIT 10`;
  } else if (period === 'month') {
    query += ` AND period_type = 'month' ORDER BY period_start DESC LIMIT 12`;
  }

  const results = await env.DB.prepare(query)
    .bind(...bindings)
    .all();

  return {
    sport,
    team,
    metric,
    period,
    data: results.results.map((row) => ({
      periodLabel: row.period_label,
      value: JSON.parse(row.stats_json)[metric],
      comparison: row.comparison_value,
    })),
  };
}

/**
 * Fetch performance metrics data
 */
async function fetchPerformanceMetricsData(widget, env) {
  const { sport } = widget;

  // Get model performance metrics
  const filters = { sport };

  const [accuracy, calibration, trend] = await Promise.all([
    getAccuracyMetrics(env, filters),
    analyzeCalibration(env, sport),
    getAccuracyTrend(env, sport, 30),
  ]);

  return {
    sport,
    accuracy: accuracy.overall,
    calibration: {
      error: calibration.overallCalibrationError,
      quality: calibration.calibrationQuality,
    },
    trend: trend.trend.slice(-7), // Last 7 days
  };
}

/**
 * Update dashboard
 */
export async function updateDashboard(dashboardId, updates, env) {
  // Retrieve existing dashboard
  const existing = await env.SPORTS_DATA_KV.get(`dashboard:${dashboardId}`, 'json');

  if (!existing) {
    throw new Error(`Dashboard not found: ${dashboardId}`);
  }

  // Apply updates
  const updated = {
    ...existing,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  // Store updated dashboard
  await env.SPORTS_DATA_KV.put(`dashboard:${dashboardId}`, JSON.stringify(updated), {
    expirationTtl: 2592000,
  });

  return updated;
}

/**
 * Refresh all widgets in a dashboard
 */
export async function refreshDashboard(dashboardId, env) {
  const dashboard = await env.SPORTS_DATA_KV.get(`dashboard:${dashboardId}`, 'json');

  if (!dashboard) {
    throw new Error(`Dashboard not found: ${dashboardId}`);
  }

  // Refresh each widget
  for (const widget of dashboard.widgets) {
    widget.data = await fetchWidgetData(widget, env);
    widget.lastUpdated = new Date().toISOString();
  }

  dashboard.updatedAt = new Date().toISOString();

  // Store refreshed dashboard
  await env.SPORTS_DATA_KV.put(`dashboard:${dashboardId}`, JSON.stringify(dashboard), {
    expirationTtl: 2592000,
  });

  return dashboard;
}

/**
 * Delete dashboard
 */
export async function deleteDashboard(dashboardId, env) {
  await env.SPORTS_DATA_KV.delete(`dashboard:${dashboardId}`);
  return { success: true, dashboardId };
}

/**
 * List all dashboards
 */
export async function listDashboards(env) {
  const list = await env.SPORTS_DATA_KV.list({ prefix: 'dashboard:' });

  const dashboards = [];
  for (const key of list.keys) {
    const dashboard = await env.SPORTS_DATA_KV.get(key.name, 'json');
    if (dashboard) {
      dashboards.push({
        id: dashboard.id,
        name: dashboard.name,
        description: dashboard.description,
        widgetCount: dashboard.widgets.length,
        createdAt: dashboard.createdAt,
        updatedAt: dashboard.updatedAt,
      });
    }
  }

  return dashboards;
}

/**
 * Helper functions
 */

function validateDashboardConfig(config) {
  if (!config) {
    throw new Error('Dashboard configuration required');
  }

  if (!config.name) {
    throw new Error('Dashboard name required');
  }

  if (config.widgets && !Array.isArray(config.widgets)) {
    throw new Error('Widgets must be an array');
  }

  for (const widget of config.widgets || []) {
    if (!widget.type) {
      throw new Error('Widget type required');
    }

    if (!Object.values(WidgetTypes).includes(widget.type)) {
      throw new Error(`Invalid widget type: ${widget.type}`);
    }
  }
}

function generateDashboardId() {
  return `dash_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function generateWidgetId() {
  return `widget_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function getDefaultWidgetTitle(widgetType) {
  const titles = {
    [WidgetTypes.STANDINGS]: 'Standings',
    [WidgetTypes.LIVE_SCORES]: 'Live Scores',
    [WidgetTypes.PLAYER_STATS]: 'Player Stats',
    [WidgetTypes.TEAM_COMPARISON]: 'Team Comparison',
    [WidgetTypes.WIN_PROBABILITY]: 'Win Probability',
    [WidgetTypes.BETTING_LINES]: 'Betting Lines',
    [WidgetTypes.INJURY_REPORT]: 'Injury Report',
    [WidgetTypes.PREDICTIONS]: 'Predictions',
    [WidgetTypes.HISTORICAL_TRENDS]: 'Historical Trends',
    [WidgetTypes.PERFORMANCE_METRICS]: 'Performance Metrics',
  };

  return titles[widgetType] || 'Widget';
}

function calculateAdvantages(stats1, stats2) {
  const advantages = {
    team1: [],
    team2: [],
  };

  for (const stat in stats1) {
    if (stats2[stat] !== undefined) {
      const value1 = parseFloat(stats1[stat]);
      const value2 = parseFloat(stats2[stat]);

      if (!isNaN(value1) && !isNaN(value2)) {
        if (value1 > value2) {
          advantages.team1.push({
            stat,
            value1,
            value2,
            difference: value1 - value2,
          });
        } else if (value2 > value1) {
          advantages.team2.push({
            stat,
            value1,
            value2,
            difference: value2 - value1,
          });
        }
      }
    }
  }

  return advantages;
}

// Import dependencies (these would be from other modules in real implementation)
import {
  getAccuracyMetrics,
  analyzeCalibration,
  getAccuracyTrend,
} from '../ml/prediction-accuracy-tracker.js';
