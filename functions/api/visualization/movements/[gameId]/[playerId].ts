// Cloudflare Function for player movement heat map data
interface Env {
  DB: D1Database;
  KV: KVNamespace;
}

interface PlayerMovement {
  timestamp: string;
  x_position: number;
  y_position: number;
  velocity_x: number;
  velocity_y: number;
  acceleration: number;
  action_type: string;
}

interface HeatMapData {
  grid: number[][];
  maxValue: number;
}

function generateHeatMapGrid(movements: PlayerMovement[]): HeatMapData {
  const gridSize = 50;
  const grid: number[][] = Array(gridSize).fill(0).map(() => Array(gridSize).fill(0));

  movements.forEach(m => {
    const gridX = Math.floor(((m.x_position + 150) / 300) * gridSize);
    const gridY = Math.floor(((m.y_position + 150) / 300) * gridSize);

    if (gridX >= 0 && gridX < gridSize && gridY >= 0 && gridY < gridSize) {
      grid[gridY][gridX] += m.acceleration || 1;
    }
  });

  const maxValue = Math.max(...grid.flat(), 1);

  return { grid, maxValue };
}

// Generate sample movement data for demonstration
function generateSampleMovements(gameId: string, playerId: string): PlayerMovement[] {
  const movements: PlayerMovement[] = [];
  const numMovements = 100;

  // Simulate player movements in different zones
  for (let i = 0; i < numMovements; i++) {
    const zone = Math.floor(i / 25); // 4 different zones
    let x_base = 0;
    let y_base = 0;

    switch (zone) {
      case 0: // First base area
        x_base = 50 + Math.random() * 30;
        y_base = 50 + Math.random() * 30;
        break;
      case 1: // Second base area
        x_base = -10 + Math.random() * 20;
        y_base = 80 + Math.random() * 20;
        break;
      case 2: // Third base area
        x_base = -50 - Math.random() * 30;
        y_base = 50 + Math.random() * 30;
        break;
      case 3: // Outfield area
        x_base = -30 + Math.random() * 60;
        y_base = 100 + Math.random() * 40;
        break;
    }

    movements.push({
      timestamp: new Date(Date.now() - (numMovements - i) * 30000).toISOString(),
      x_position: x_base + (Math.random() - 0.5) * 10,
      y_position: y_base + (Math.random() - 0.5) * 10,
      velocity_x: (Math.random() - 0.5) * 20,
      velocity_y: (Math.random() - 0.5) * 20,
      acceleration: Math.random() * 5 + 1,
      action_type: ['fielding', 'running', 'positioning', 'catch'][Math.floor(Math.random() * 4)]
    });
  }

  return movements;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { gameId, playerId } = context.params;
  const env = context.env;

  if (!gameId || !playerId || typeof gameId !== 'string' || typeof playerId !== 'string') {
    return new Response(JSON.stringify({ error: 'Invalid game ID or player ID' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Check cache first
  const cacheKey = `movements:${gameId}:${playerId}`;
  const cached = await env.KV.get(cacheKey);

  if (cached) {
    return new Response(cached, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=600',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }

  try {
    // Fetch player movement data from D1 database
    const result = await env.DB.prepare(`
      SELECT
        m.timestamp,
        m.x_position,
        m.y_position,
        m.velocity_x,
        m.velocity_y,
        m.acceleration,
        m.action_type
      FROM player_movements m
      WHERE m.game_id = ? AND m.player_id = ?
      ORDER BY m.timestamp ASC
    `).bind(gameId, playerId).all();

    let movements: PlayerMovement[];

    if (!result.results || result.results.length === 0) {
      // Return sample data for demo purposes if no real data exists
      movements = generateSampleMovements(gameId, playerId);
    } else {
      movements = result.results as PlayerMovement[];
    }

    const heatMapData = generateHeatMapGrid(movements);
    const response = JSON.stringify(heatMapData);

    // Cache for 10 minutes
    await env.KV.put(cacheKey, response, { expirationTtl: 600 });

    return new Response(response, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=600',
        'Access-Control-Allow-Origin': '*',
        'X-Data-Source': result.results?.length === 0 ? 'sample' : 'database'
      }
    });
  } catch (error) {
    console.error('Error fetching player movement data:', error);

    return new Response(JSON.stringify({
      error: 'Failed to fetch player movement data',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
