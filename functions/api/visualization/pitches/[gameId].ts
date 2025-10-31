// Cloudflare Function for pitch sequence with 3D trajectory data
import { Router } from 'itty-router';

interface Env {
  DB: D1Database;
  KV: KVNamespace;
}

interface PitchData {
  pitch_id: string;
  pitcher_id: string;
  batter_id: string;
  velocity: number;
  spin_rate: number;
  release_x: number;
  release_y: number;
  release_z: number;
  plate_x: number;
  plate_z: number;
  break_x: number;
  break_z: number;
  pitch_type: string;
  result: string;
  timestamp: string;
  pitcher_name: string;
  batter_name: string;
}

interface EnrichedPitch extends PitchData {
  trajectory: number[][];
  spinAxis: { x: number; y: number; z: number };
  approachAngle: number;
}

function calculateTrajectory(pitch: PitchData): number[][] {
  const g = 32.174; // gravity ft/s²
  const timeToPlate = (60.5 - pitch.release_y) / (pitch.velocity * 1.467); // convert mph to ft/s
  const points: number[][] = [];

  for (let t = 0; t <= timeToPlate; t += 0.01) {
    const x = pitch.release_x + (pitch.plate_x - pitch.release_x) * (t / timeToPlate) +
              pitch.break_x * Math.pow(t / timeToPlate, 2);
    const y = pitch.release_y + (pitch.velocity * 1.467 * t);
    const z = pitch.release_z - (0.5 * g * Math.pow(t, 2)) +
              pitch.break_z * Math.pow(t / timeToPlate, 2);

    points.push([x, y, z]);
  }

  return points;
}

function calculateSpinAxis(pitch: PitchData): { x: number; y: number; z: number } {
  const breakAngle = Math.atan2(pitch.break_z, pitch.break_x);
  return {
    x: Math.cos(breakAngle),
    y: 0,
    z: Math.sin(breakAngle)
  };
}

function calculateApproachAngle(pitch: PitchData): number {
  return Math.atan2(
    pitch.release_z - pitch.plate_z,
    60.5 - pitch.release_y
  ) * (180 / Math.PI);
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { gameId } = context.params;
  const env = context.env;

  if (!gameId || typeof gameId !== 'string') {
    return new Response(JSON.stringify({ error: 'Invalid game ID' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Check cache first
  const cacheKey = `pitches:${gameId}`;
  const cached = await env.KV.get(cacheKey);

  if (cached) {
    return new Response(cached, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }

  try {
    // Fetch pitch data from D1 database
    const result = await env.DB.prepare(`
      SELECT
        p.pitch_id,
        p.pitcher_id,
        p.batter_id,
        p.velocity,
        p.spin_rate,
        p.release_x,
        p.release_y,
        p.release_z,
        p.plate_x,
        p.plate_z,
        p.break_x,
        p.break_z,
        p.pitch_type,
        p.result,
        p.timestamp,
        pi.name as pitcher_name,
        b.name as batter_name
      FROM pitches p
      LEFT JOIN players pi ON p.pitcher_id = pi.player_id
      LEFT JOIN players b ON p.batter_id = b.player_id
      WHERE p.game_id = ?
      ORDER BY p.timestamp ASC
    `).bind(gameId).all();

    if (!result.results || result.results.length === 0) {
      // Return sample data for demo purposes if no real data exists
      const samplePitches = generateSamplePitches(gameId);
      const response = JSON.stringify(samplePitches);

      await env.KV.put(cacheKey, response, { expirationTtl: 300 });

      return new Response(response, {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=300',
          'Access-Control-Allow-Origin': '*',
          'X-Data-Source': 'sample'
        }
      });
    }

    const enriched: EnrichedPitch[] = result.results.map((pitch: any) => ({
      ...pitch,
      trajectory: calculateTrajectory(pitch as PitchData),
      spinAxis: calculateSpinAxis(pitch as PitchData),
      approachAngle: calculateApproachAngle(pitch as PitchData)
    }));

    const response = JSON.stringify(enriched);

    // Cache for 5 minutes
    await env.KV.put(cacheKey, response, { expirationTtl: 300 });

    return new Response(response, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    console.error('Error fetching pitch data:', error);

    return new Response(JSON.stringify({
      error: 'Failed to fetch pitch data',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// Generate sample pitch data for demonstration
function generateSamplePitches(gameId: string): EnrichedPitch[] {
  const pitchTypes = ['FF', 'SL', 'CU', 'CH', 'SI', 'FC'];
  const pitchNames = ['Fastball', 'Slider', 'Curveball', 'Changeup', 'Sinker', 'Cutter'];
  const results = ['Ball', 'Strike', 'Foul', 'In Play'];

  const samplePitches: PitchData[] = Array.from({ length: 20 }, (_, i) => {
    const pitchType = pitchTypes[i % pitchTypes.length];
    const baseVelocity = pitchType === 'FF' ? 95 : pitchType === 'CH' ? 85 : 88;

    return {
      pitch_id: `pitch_${gameId}_${i}`,
      pitcher_id: `pitcher_${Math.floor(i / 6) + 1}`,
      batter_id: `batter_${i % 3 + 1}`,
      velocity: baseVelocity + (Math.random() * 4 - 2),
      spin_rate: 2200 + Math.random() * 400,
      release_x: (Math.random() - 0.5) * 2,
      release_y: 54 + Math.random() * 2,
      release_z: 6 + Math.random() * 0.5,
      plate_x: (Math.random() - 0.5) * 3,
      plate_z: 2 + Math.random() * 2,
      break_x: (Math.random() - 0.5) * 10,
      break_z: pitchType === 'CU' ? -15 - Math.random() * 5 : (Math.random() - 0.5) * 8,
      pitch_type: pitchType,
      result: results[Math.floor(Math.random() * results.length)],
      timestamp: new Date(Date.now() - (20 - i) * 60000).toISOString(),
      pitcher_name: `Pitcher ${Math.floor(i / 6) + 1}`,
      batter_name: `Batter ${i % 3 + 1}`
    };
  });

  return samplePitches.map(pitch => ({
    ...pitch,
    trajectory: calculateTrajectory(pitch),
    spinAxis: calculateSpinAxis(pitch),
    approachAngle: calculateApproachAngle(pitch)
  }));
}
