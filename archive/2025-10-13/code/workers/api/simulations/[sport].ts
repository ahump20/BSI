/**
 * Blaze Sports Intel - Monte Carlo Simulation API
 *
 * Serves pre-computed Monte Carlo simulation results for SEC, NFL, and MLB teams
 * Data generated from 10,000 simulations per team (510,000 total simulations)
 *
 * Endpoints:
 * - /api/simulations/sec - SEC Football teams
 * - /api/simulations/nfl - NFL teams
 * - /api/simulations/mlb - MLB teams
 * - /api/simulations/all - All teams
 */

export async function onRequest(context: any) {
  const { params, request } = context;
  const sport = params.sport?.toLowerCase();

  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
    'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
  };

  // Handle OPTIONS request
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers });
  }

  try {
    // Load simulation data from static file
    const dataPath = '/data/monte-carlo-simulations.json';
    const dataUrl = new URL(dataPath, request.url);

    const response = await fetch(dataUrl);
    if (!response.ok) {
      throw new Error('Simulation data not found');
    }

    const allData = await response.json();

    // Filter by sport if specified
    let filteredData;
    if (sport === 'sec') {
      filteredData = { sec: allData.sec, metadata: allData.metadata };
    } else if (sport === 'nfl') {
      filteredData = { nfl: allData.nfl, metadata: allData.metadata };
    } else if (sport === 'mlb') {
      filteredData = { mlb: allData.mlb, metadata: allData.metadata };
    } else if (sport === 'all') {
      filteredData = allData;
    } else {
      return new Response(
        JSON.stringify({
          error: 'Invalid sport parameter',
          message: 'Valid options: sec, nfl, mlb, all'
        }),
        { status: 400, headers }
      );
    }

    return new Response(JSON.stringify(filteredData), {
      status: 200,
      headers
    });
  } catch (error: any) {
    return new Response(
      JSON.stringify({
        error: 'Failed to load simulation data',
        message: error.message
      }),
      { status: 500, headers }
    );
  }
}