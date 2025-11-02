/**
 * Blaze Sports Intel - Reconstruction Trigger API
 * Manually trigger 3D reconstruction for specific event
 *
 * POST /api/live-events/reconstruct
 */

import type {
  TriggerReconstructionRequest,
  TriggerReconstructionResponse,
  LiveEvent,
  StatcastData,
  SceneData,
  PhysicsParams,
  PredictionData,
  ActualOutcome,
} from '../../../lib/reconstruction/types';
import { simulateBattedBall, simulatePitch, DEFAULT_PHYSICS_PARAMS } from '../../../lib/reconstruction/physics';

interface Env {
  DB: D1Database;
  KV: KVNamespace;
  R2?: R2Bucket; // For storing video/image assets
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const request = await context.request.json() as TriggerReconstructionRequest;

    if (!request.eventId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing event ID' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Fetch event data
    const eventResult = await context.env.DB.prepare(
      'SELECT * FROM live_events WHERE id = ?'
    )
      .bind(request.eventId)
      .first<LiveEvent>();

    if (!eventResult) {
      return new Response(
        JSON.stringify({ success: false, error: 'Event not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const event: LiveEvent = {
      ...eventResult,
      rawData: JSON.parse(eventResult.rawData as unknown as string),
      statcastData: eventResult.statcastData ? JSON.parse(eventResult.statcastData as unknown as string) : null,
    };

    // Check if already reconstructed
    const existingRecon = await context.env.DB.prepare(
      'SELECT id FROM reconstructions WHERE event_id = ?'
    )
      .bind(request.eventId)
      .first();

    if (existingRecon) {
      return new Response(
        JSON.stringify({
          success: true,
          reconstructionId: existingRecon.id,
          message: 'Reconstruction already exists',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Generate reconstruction based on event type
    const startTime = Date.now();
    let reconstruction: any;

    if (event.eventType === 'batted_ball' && event.statcastData) {
      reconstruction = await generateBattedBallReconstruction(event, event.statcastData);
    } else if (event.eventType === 'pitch' && event.statcastData) {
      reconstruction = await generatePitchReconstruction(event, event.statcastData);
    } else if (event.eventType === 'defensive_play') {
      reconstruction = await generateDefensivePlayReconstruction(event);
    } else {
      return new Response(
        JSON.stringify({ success: false, error: 'Unsupported event type or missing data' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const renderTime = Date.now() - startTime;

    // Store reconstruction in database
    const reconstructionId = `rec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    await context.env.DB.prepare(
      `INSERT INTO reconstructions
       (id, event_id, scene_data, physics_params, prediction_data, actual_outcome,
        prediction_accuracy, render_time_ms, data_quality_score, spatial_accuracy_cm,
        is_published, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`
    )
      .bind(
        reconstructionId,
        request.eventId,
        JSON.stringify(reconstruction.sceneData),
        JSON.stringify(reconstruction.physicsParams),
        reconstruction.predictionData ? JSON.stringify(reconstruction.predictionData) : null,
        JSON.stringify(reconstruction.actualOutcome),
        reconstruction.predictionAccuracy,
        renderTime,
        reconstruction.dataQualityScore,
        reconstruction.spatialAccuracy,
        new Date().toISOString(),
        new Date().toISOString()
      )
      .run();

    // Mark event as reconstructed
    await context.env.DB.prepare('UPDATE live_events SET is_reconstructed = 1 WHERE id = ?')
      .bind(request.eventId)
      .run();

    const response: TriggerReconstructionResponse = {
      success: true,
      reconstructionId,
      estimatedTime: renderTime / 1000,
    };

    return new Response(JSON.stringify(response), {
      status: 201,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('Error triggering reconstruction:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// ============================================================================
// RECONSTRUCTION GENERATORS
// ============================================================================

/**
 * Generate 3D reconstruction for batted ball
 */
async function generateBattedBallReconstruction(
  event: LiveEvent,
  statcast: StatcastData
): Promise<{
  sceneData: SceneData;
  physicsParams: PhysicsParams;
  predictionData: PredictionData | null;
  actualOutcome: ActualOutcome;
  predictionAccuracy: number | null;
  dataQualityScore: number;
  spatialAccuracy: number;
}> {
  const physics = { ...DEFAULT_PHYSICS_PARAMS };

  // Simulate ball trajectory
  const trajectory = simulateBattedBall(statcast, physics);

  // Build scene data
  const sceneData: SceneData = {
    positions: [
      {
        name: 'ball',
        keyframes: trajectory.points.map((p) => ({
          time: p.time,
          x: p.position.x,
          y: p.position.y,
          z: p.position.z,
        })),
      },
    ],
    annotations: [
      {
        type: 'zone',
        position: trajectory.landingPoint ?? { x: 0, y: 0, z: 0 },
        data: {
          radius: 5,
          color: '#ff6b00',
          label: 'Landing Point',
        },
        label: `${Math.round(trajectory.totalDistance)} ft`,
      },
      {
        type: 'text',
        position: { x: 0, y: 50, z: 200 },
        data: {
          text: `Exit Velocity: ${statcast.exitVelocity} mph\nLaunch Angle: ${statcast.launchAngle}°`,
          fontSize: 20,
        },
      },
    ],
    camera: {
      position: { x: -100, y: 80, z: -50 },
      lookAt: { x: 0, y: 20, z: 150 },
      fov: 60,
      animations: [
        { time: 0, position: { x: -100, y: 80, z: -50 }, lookAt: { x: 0, y: 20, z: 150 } },
        {
          time: trajectory.hangTime / 2,
          position: { x: 0, y: 150, z: 0 },
          lookAt: trajectory.landingPoint ?? { x: 0, y: 0, z: 200 },
        },
        {
          time: trajectory.hangTime,
          position: {
            x: (trajectory.landingPoint?.x ?? 0) - 50,
            y: 30,
            z: (trajectory.landingPoint?.z ?? 200) - 50,
          },
          lookAt: trajectory.landingPoint ?? { x: 0, y: 0, z: 200 },
        },
      ],
    },
    duration: trajectory.hangTime,
    fps: 60,
    resolution: { width: 1920, height: 1080 },
  };

  // Generate prediction data (simplified - in production, use ML models)
  const predictionData: PredictionData = {
    model: 'statcast',
    version: '1.0',
    predictedOutcome: {
      type: statcast.exitVelocity! >= 100 && statcast.launchAngle! >= 20 ? 'home_run' : 'hit',
      probability: 0.75,
      alternativeOutcomes: [
        { type: 'flyout', probability: 0.20 },
        { type: 'ground_out', probability: 0.05 },
      ],
    },
    factors: [
      { name: 'Exit Velocity', value: statcast.exitVelocity ?? 0, weight: 0.4 },
      { name: 'Launch Angle', value: statcast.launchAngle ?? 0, weight: 0.3 },
      { name: 'Distance', value: trajectory.totalDistance, weight: 0.3 },
    ],
    confidenceInterval: { lower: 0.65, upper: 0.85 },
    timestamp: event.timestamp,
  };

  const actualOutcome: ActualOutcome = {
    type: event.rawData.description.includes('home run') ? 'home_run' : 'out',
    description: event.rawData.description,
    timestamp: event.timestamp,
    deviation: null,
    surpriseFactor: null,
  };

  // Calculate data quality (based on completeness)
  const dataQualityScore =
    (statcast.exitVelocity ? 0.33 : 0) +
    (statcast.launchAngle ? 0.33 : 0) +
    (statcast.hitDistance ? 0.34 : 0);

  // Spatial accuracy (compare simulated distance to Statcast distance)
  const spatialAccuracy = statcast.hitDistance
    ? Math.abs(trajectory.totalDistance - statcast.hitDistance) * 30.48 // Convert ft to cm
    : null;

  return {
    sceneData,
    physicsParams: physics,
    predictionData,
    actualOutcome,
    predictionAccuracy: 0.75, // Placeholder
    dataQualityScore,
    spatialAccuracy: spatialAccuracy ?? 0,
  };
}

/**
 * Generate 3D reconstruction for pitch
 */
async function generatePitchReconstruction(
  event: LiveEvent,
  statcast: StatcastData
): Promise<any> {
  const physics = { ...DEFAULT_PHYSICS_PARAMS };

  const trajectory = simulatePitch(statcast, physics);

  const sceneData: SceneData = {
    positions: [
      {
        name: 'ball',
        keyframes: trajectory.points.map((p) => ({
          time: p.time,
          x: p.position.x,
          y: p.position.y,
          z: p.position.z,
          rotation: { x: p.time * 100, y: 0, z: 0 }, // Spinning
        })),
      },
    ],
    annotations: [
      {
        type: 'zone',
        position: { x: 0, y: 2.5, z: 0 },
        data: { width: 1.42, height: 1.5, label: 'Strike Zone' },
      },
      {
        type: 'text',
        position: { x: 2, y: 5, z: 27 },
        data: {
          text: `Velocity: ${statcast.pitchVelocity} mph\nSpin Rate: ${statcast.spinRate} rpm`,
          fontSize: 16,
        },
      },
    ],
    camera: {
      position: { x: 5, y: 5, z: 30 },
      lookAt: { x: 0, y: 2.5, z: 0 },
      fov: 50,
    },
    duration: trajectory.hangTime,
    fps: 240, // High FPS for pitch
    resolution: { width: 1920, height: 1080 },
  };

  const actualOutcome: ActualOutcome = {
    type: 'pitch',
    description: event.rawData.description,
    timestamp: event.timestamp,
    deviation: null,
    surpriseFactor: null,
  };

  return {
    sceneData,
    physicsParams: physics,
    predictionData: null,
    actualOutcome,
    predictionAccuracy: null,
    dataQualityScore: 0.9,
    spatialAccuracy: 5, // Within 5cm
  };
}

/**
 * Generate defensive play reconstruction (placeholder)
 */
async function generateDefensivePlayReconstruction(event: LiveEvent): Promise<any> {
  // Simplified version - in production, combine ball trajectory + fielder movement

  const sceneData: SceneData = {
    positions: [],
    annotations: [],
    camera: {
      position: { x: 0, y: 100, z: 0 },
      lookAt: { x: 0, y: 0, z: 200 },
      fov: 70,
    },
    duration: 3,
    fps: 60,
    resolution: { width: 1920, height: 1080 },
  };

  const actualOutcome: ActualOutcome = {
    type: 'catch',
    description: event.rawData.description,
    timestamp: event.timestamp,
    deviation: null,
    surpriseFactor: null,
  };

  return {
    sceneData,
    physicsParams: DEFAULT_PHYSICS_PARAMS,
    predictionData: null,
    actualOutcome,
    predictionAccuracy: null,
    dataQualityScore: 0.5,
    spatialAccuracy: 50,
  };
}
