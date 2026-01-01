/**
 * JSON Export Endpoint for Scouting Reports
 * Returns complete scouting report data in JSON format for API integration
 */

import { ok as _ok, err, rateLimit, rateLimitError, corsHeaders } from '../../../_utils.js';

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  // Rate limiting: 100 requests per minute per IP
  const limit = await rateLimit(env, request, 100, 60000);
  if (!limit.allowed) {
    return rateLimitError(limit.resetAt, limit.retryAfter);
  }

  const playerId = url.searchParams.get('player_id');
  const teamId = url.searchParams.get('team_id');

  if (!playerId) {
    return err(new Error('Missing required parameter: player_id'), 400);
  }

  try {
    // Fetch the complete scouting report
    const reportUrl = new URL('/api/college-baseball/scouting-professional', url.origin);
    reportUrl.searchParams.set('player_id', playerId);
    if (teamId) reportUrl.searchParams.set('team_id', teamId);
    reportUrl.searchParams.set('include_video', 'true');

    const reportResponse = await fetch(reportUrl.toString());

    if (!reportResponse.ok) {
      throw new Error(`Failed to fetch scouting report: ${reportResponse.status}`);
    }

    const reportData = await reportResponse.json();

    // Return as downloadable JSON file
    return new Response(JSON.stringify(reportData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="scouting-report-${playerId}-${Date.now()}.json"`,
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('JSON export error:', error);
    return err(error, 500);
  }
}
