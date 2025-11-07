/**
 * Blaze Sports Intel - Dashboards API
 *
 * Comprehensive dashboard management endpoints.
 *
 * Endpoints:
 * - POST /api/v1/dashboards/create
 * - GET /api/v1/dashboards/list
 * - GET /api/v1/dashboards/get?id=xxx
 * - PUT /api/v1/dashboards/update?id=xxx
 * - DELETE /api/v1/dashboards/delete?id=xxx
 * - POST /api/v1/dashboards/refresh?id=xxx
 * - GET /api/v1/dashboards/widget/data?widgetId=xxx
 */

import {
  createDashboard,
  updateDashboard,
  refreshDashboard,
  deleteDashboard,
  listDashboards,
  fetchWidgetData
} from '../../../../lib/dashboards/comprehensive-dashboard-builder.js';
import { rateLimit, rateLimitError, corsHeaders } from '../../_utils.js';

export async function onRequest(context) {
  const { request, env, params } = context;

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  // Rate limiting: 100 requests per minute per IP
  const limit = await rateLimit(env, request, 100, 60000);
  if (!limit.allowed) {
    return rateLimitError(limit.resetAt, limit.retryAfter);
  }

  const url = new URL(request.url);
  const route = params.route ? params.route.join('/') : '';
  const action = route || 'list';

  try {
    let result;

    switch (action) {
      case 'create':
        // POST /api/v1/dashboards/create
        if (request.method !== 'POST') {
          throw new Error('POST method required to create dashboard');
        }

        const createConfig = await request.json();
        result = await createDashboard(createConfig, env);
        break;

      case 'list':
        // GET /api/v1/dashboards/list
        result = await listDashboards(env);
        break;

      case 'get':
        // GET /api/v1/dashboards/get?id=xxx
        const getDashboardId = url.searchParams.get('id');
        if (!getDashboardId) {
          throw new Error('Dashboard ID required');
        }

        const dashboard = await env.SPORTS_DATA_KV.get(`dashboard:${getDashboardId}`, 'json');
        if (!dashboard) {
          throw new Error(`Dashboard not found: ${getDashboardId}`);
        }

        result = dashboard;
        break;

      case 'update':
        // PUT /api/v1/dashboards/update?id=xxx
        if (request.method !== 'PUT') {
          throw new Error('PUT method required to update dashboard');
        }

        const updateDashboardId = url.searchParams.get('id');
        if (!updateDashboardId) {
          throw new Error('Dashboard ID required');
        }

        const updates = await request.json();
        result = await updateDashboard(updateDashboardId, updates, env);
        break;

      case 'delete':
        // DELETE /api/v1/dashboards/delete?id=xxx
        if (request.method !== 'DELETE') {
          throw new Error('DELETE method required to delete dashboard');
        }

        const deleteDashboardId = url.searchParams.get('id');
        if (!deleteDashboardId) {
          throw new Error('Dashboard ID required');
        }

        result = await deleteDashboard(deleteDashboardId, env);
        break;

      case 'refresh':
        // POST /api/v1/dashboards/refresh?id=xxx
        if (request.method !== 'POST') {
          throw new Error('POST method required to refresh dashboard');
        }

        const refreshDashboardId = url.searchParams.get('id');
        if (!refreshDashboardId) {
          throw new Error('Dashboard ID required');
        }

        result = await refreshDashboard(refreshDashboardId, env);
        break;

      case 'widget/data':
        // GET /api/v1/dashboards/widget/data?widgetId=xxx
        const widgetId = url.searchParams.get('widgetId');
        if (!widgetId) {
          throw new Error('Widget ID required');
        }

        // Retrieve widget configuration from dashboard
        const dashboardList = await env.SPORTS_DATA_KV.list({ prefix: 'dashboard:' });

        let widget = null;
        for (const key of dashboardList.keys) {
          const dash = await env.SPORTS_DATA_KV.get(key.name, 'json');
          if (dash) {
            widget = dash.widgets.find(w => w.id === widgetId);
            if (widget) break;
          }
        }

        if (!widget) {
          throw new Error(`Widget not found: ${widgetId}`);
        }

        result = await fetchWidgetData(widget, env);
        break;

      default:
        throw new Error(`Unknown action: ${action}. Valid actions: create, list, get, update, delete, refresh, widget/data`);
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Cache-Control': action === 'list' || action === 'get'
          ? 'public, max-age=60, s-maxage=120'
          : 'no-cache, no-store, must-revalidate'
      }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      error: 'Failed to process dashboard request',
      message: error.message,
      action
    }), {
      status: error.message.includes('required') || error.message.includes('not found') ? 400 : 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
}

/**
 * Example usage:
 *
 * // Create a new dashboard
 * const createResponse = await fetch('/api/v1/dashboards/create', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({
 *     name: 'NFL Analytics Dashboard',
 *     description: 'Comprehensive NFL analytics and predictions',
 *     layout: 'grid',
 *     columns: 3,
 *     theme: 'dark',
 *     widgets: [
 *       {
 *         type: 'standings',
 *         title: 'NFL Standings',
 *         sport: 'NFL',
 *         size: 'large',
 *         position: { row: 0, col: 0 }
 *       },
 *       {
 *         type: 'live_scores',
 *         title: 'Live Scores',
 *         sport: 'NFL',
 *         size: 'medium',
 *         position: { row: 0, col: 1 }
 *       },
 *       {
 *         type: 'win_probability',
 *         title: 'Win Probabilities',
 *         sport: 'NFL',
 *         size: 'medium',
 *         position: { row: 1, col: 0 }
 *       },
 *       {
 *         type: 'betting_lines',
 *         title: 'Betting Analysis',
 *         sport: 'NFL',
 *         size: 'medium',
 *         position: { row: 1, col: 1 }
 *       },
 *       {
 *         type: 'predictions',
 *         title: 'Recent Predictions',
 *         sport: 'NFL',
 *         size: 'large',
 *         position: { row: 2, col: 0 }
 *       }
 *     ]
 *   })
 * });
 * const newDashboard = await createResponse.json();
 * console.log('Dashboard created:', newDashboard.id);
 *
 * // List all dashboards
 * const listResponse = await fetch('/api/v1/dashboards/list');
 * const dashboards = await listResponse.json();
 * console.log('Total dashboards:', dashboards.length);
 *
 * // Get specific dashboard
 * const getResponse = await fetch(`/api/v1/dashboards/get?id=${newDashboard.id}`);
 * const dashboard = await getResponse.json();
 * console.log('Dashboard widgets:', dashboard.widgets.length);
 *
 * // Update dashboard
 * const updateResponse = await fetch(`/api/v1/dashboards/update?id=${newDashboard.id}`, {
 *   method: 'PUT',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({
 *     name: 'Updated NFL Dashboard',
 *     description: 'Updated description'
 *   })
 * });
 * const updatedDashboard = await updateResponse.json();
 *
 * // Refresh dashboard data
 * const refreshResponse = await fetch(`/api/v1/dashboards/refresh?id=${newDashboard.id}`, {
 *   method: 'POST'
 * });
 * const refreshedDashboard = await refreshResponse.json();
 * console.log('Dashboard refreshed at:', refreshedDashboard.updatedAt);
 *
 * // Get widget data
 * const widgetId = dashboard.widgets[0].id;
 * const widgetDataResponse = await fetch(`/api/v1/dashboards/widget/data?widgetId=${widgetId}`);
 * const widgetData = await widgetDataResponse.json();
 * console.log('Widget data:', widgetData);
 *
 * // Delete dashboard
 * const deleteResponse = await fetch(`/api/v1/dashboards/delete?id=${newDashboard.id}`, {
 *   method: 'DELETE'
 * });
 * const deleteResult = await deleteResponse.json();
 * console.log('Dashboard deleted:', deleteResult.success);
 */

/**
 * Pre-configured dashboard templates
 */
export const DashboardTemplates = {
  NFL_ANALYTICS: {
    name: 'NFL Analytics Dashboard',
    description: 'Comprehensive NFL analytics and predictions',
    sport: 'NFL',
    layout: 'grid',
    columns: 3,
    widgets: [
      { type: 'standings', title: 'NFL Standings', sport: 'NFL', size: 'large' },
      { type: 'live_scores', title: 'Live Scores', sport: 'NFL', size: 'medium' },
      { type: 'win_probability', title: 'Win Probabilities', sport: 'NFL', size: 'medium' },
      { type: 'betting_lines', title: 'Betting Analysis', sport: 'NFL', size: 'medium' },
      { type: 'predictions', title: 'Recent Predictions', sport: 'NFL', size: 'large' },
      { type: 'injury_report', title: 'Injury Report', sport: 'NFL', size: 'medium' }
    ]
  },

  MLB_ANALYTICS: {
    name: 'MLB Analytics Dashboard',
    description: 'Comprehensive MLB analytics and predictions',
    sport: 'MLB',
    layout: 'grid',
    columns: 3,
    widgets: [
      { type: 'standings', title: 'MLB Standings', sport: 'MLB', size: 'large' },
      { type: 'live_scores', title: 'Live Scores', sport: 'MLB', size: 'medium' },
      { type: 'player_stats', title: 'Top Hitters', sport: 'MLB', size: 'medium', settings: { statType: 'season' } },
      { type: 'player_stats', title: 'Top Pitchers', sport: 'MLB', size: 'medium', settings: { statType: 'season' } },
      { type: 'predictions', title: 'Game Predictions', sport: 'MLB', size: 'large' },
      { type: 'historical_trends', title: 'Team Trends', sport: 'MLB', size: 'medium' }
    ]
  },

  BETTING_FOCUS: {
    name: 'Sports Betting Dashboard',
    description: 'Betting lines, predictions, and edge analysis',
    layout: 'grid',
    columns: 2,
    widgets: [
      { type: 'betting_lines', title: 'NFL Betting Lines', sport: 'NFL', size: 'large' },
      { type: 'betting_lines', title: 'MLB Betting Lines', sport: 'MLB', size: 'large' },
      { type: 'win_probability', title: 'NFL Win Probabilities', sport: 'NFL', size: 'medium' },
      { type: 'win_probability', title: 'MLB Win Probabilities', sport: 'MLB', size: 'medium' },
      { type: 'predictions', title: 'NFL Predictions', sport: 'NFL', size: 'large' },
      { type: 'predictions', title: 'MLB Predictions', sport: 'MLB', size: 'large' }
    ]
  },

  TEAM_FOCUS: {
    name: 'Team Deep Dive',
    description: 'Comprehensive analysis for a specific team',
    layout: 'grid',
    columns: 2,
    widgets: [
      { type: 'standings', title: 'Standings', size: 'medium' },
      { type: 'player_stats', title: 'Top Performers', size: 'large' },
      { type: 'injury_report', title: 'Injury Report', size: 'medium' },
      { type: 'historical_trends', title: 'Season Trends', size: 'large' },
      { type: 'team_comparison', title: 'Next Opponent', size: 'large', settings: {} }
    ]
  }
};
