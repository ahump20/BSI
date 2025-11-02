/**
 * Blaze Sports Intel - Physics Simulation Engine
 * Accurate trajectory calculations for batted balls, pitches, and defensive plays
 *
 * @module lib/reconstruction/physics
 * @version 1.0.0
 */

import type { PhysicsParams, TrajectoryCalculation, TrajectoryPoint, StatcastData } from './types';

// ============================================================================
// CONSTANTS
// ============================================================================

const GRAVITY = 32.174; // ft/s² (standard gravity)
const AIR_DENSITY_SEA_LEVEL = 0.0765; // lb/ft³
const BASEBALL_MASS = 0.319; // lb
const BASEBALL_DIAMETER = 0.2396; // ft (2.875 inches)
const BASEBALL_CROSS_SECTION = Math.PI * Math.pow(BASEBALL_DIAMETER / 2, 2); // ft²

const DRAG_COEFFICIENT = 0.3; // Baseball drag coefficient
const MAGNUS_COEFFICIENT = 0.00004; // Spin-induced lift coefficient

const FEET_PER_MILE = 5280;
const SECONDS_PER_HOUR = 3600;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Convert mph to ft/s
 */
function mphToFeetPerSecond(mph: number): number {
  return (mph * FEET_PER_MILE) / SECONDS_PER_HOUR;
}

/**
 * Convert degrees to radians
 */
function degreesToRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Calculate air density based on elevation and temperature
 */
function calculateAirDensity(elevation: number, temperatureF: number): number {
  // Simplified barometric formula
  const seaLevelPressure = 29.92; // inHg
  const pressureRatio = Math.pow(1 - (elevation / 145442), 5.255);
  const pressure = seaLevelPressure * pressureRatio;

  // Ideal gas law adjustment for temperature
  const temperatureK = ((temperatureF - 32) * 5/9) + 273.15;
  const densityRatio = (pressure / seaLevelPressure) * (288.15 / temperatureK);

  return AIR_DENSITY_SEA_LEVEL * densityRatio;
}

/**
 * Calculate drag force on baseball
 */
function calculateDragForce(
  velocity: { x: number; y: number; z: number },
  airDensity: number
): { x: number; y: number; z: number } {
  const speed = Math.sqrt(velocity.x ** 2 + velocity.y ** 2 + velocity.z ** 2);

  if (speed === 0) {
    return { x: 0, y: 0, z: 0 };
  }

  // Drag force magnitude: F = 0.5 * Cd * ρ * A * v²
  const dragMagnitude = 0.5 * DRAG_COEFFICIENT * airDensity * BASEBALL_CROSS_SECTION * speed ** 2;

  // Apply drag in opposite direction of velocity
  return {
    x: -(dragMagnitude / BASEBALL_MASS) * (velocity.x / speed),
    y: -(dragMagnitude / BASEBALL_MASS) * (velocity.y / speed),
    z: -(dragMagnitude / BASEBALL_MASS) * (velocity.z / speed),
  };
}

/**
 * Calculate Magnus force (spin-induced lift)
 */
function calculateMagnusForce(
  velocity: { x: number; y: number; z: number },
  spinRate: number, // rpm
  spinAxis: number, // degrees (0 = pure backspin, 90 = pure sidespin)
  airDensity: number
): { x: number; y: number; z: number } {
  const speed = Math.sqrt(velocity.x ** 2 + velocity.y ** 2 + velocity.z ** 2);

  if (speed === 0 || spinRate === 0) {
    return { x: 0, y: 0, z: 0 };
  }

  // Convert spin rate to rad/s
  const spinRadPerSec = (spinRate * 2 * Math.PI) / 60;

  // Magnus force magnitude
  const magnusMagnitude = MAGNUS_COEFFICIENT * airDensity * BASEBALL_CROSS_SECTION * spinRadPerSec * speed;

  // Decompose spin axis
  const spinAxisRad = degreesToRadians(spinAxis);
  const backspin = Math.cos(spinAxisRad);
  const sidespin = Math.sin(spinAxisRad);

  // Magnus force perpendicular to velocity and spin axis
  // Backspin creates upward lift, sidespin creates lateral movement
  return {
    x: magnusMagnitude * sidespin * (velocity.y / speed), // Lateral movement
    y: magnusMagnitude * backspin, // Vertical lift
    z: -magnusMagnitude * sidespin * (velocity.x / speed), // Forward/backward component
  };
}

/**
 * Calculate wind effect on velocity
 */
function calculateWindEffect(
  windSpeed: number, // mph
  windDirection: number // degrees (0 = towards home plate)
): { x: number; y: number; z: number } {
  const windSpeedFPS = mphToFeetPerSecond(windSpeed);
  const windDirRad = degreesToRadians(windDirection);

  return {
    x: windSpeedFPS * Math.sin(windDirRad), // East-West
    y: 0, // Wind doesn't affect vertical much
    z: windSpeedFPS * Math.cos(windDirRad), // North-South (towards/away from home)
  };
}

// ============================================================================
// TRAJECTORY SIMULATION
// ============================================================================

/**
 * Simulate batted ball trajectory using Statcast data
 */
export function simulateBattedBall(
  statcast: StatcastData,
  physics: PhysicsParams
): TrajectoryCalculation {
  const exitVelocity = statcast.exitVelocity ?? 90; // mph
  const launchAngle = statcast.launchAngle ?? 25; // degrees
  const sprayAngle = statcast.sprayAngle ?? 0; // degrees

  // Convert to ft/s and radians
  const initialSpeed = mphToFeetPerSecond(exitVelocity);
  const launchRad = degreesToRadians(launchAngle);
  const sprayRad = degreesToRadians(sprayAngle);

  // Initial velocity components
  const initialVelocity = {
    x: initialSpeed * Math.cos(launchRad) * Math.sin(sprayRad), // Lateral (left/right)
    y: initialSpeed * Math.sin(launchRad), // Vertical
    z: initialSpeed * Math.cos(launchRad) * Math.cos(sprayRad), // Forward
  };

  // Initial position (home plate, 3 feet high)
  let position = { x: 0, y: 3, z: 0 };
  let velocity = { ...initialVelocity };

  // Physics parameters
  const airDensity = calculateAirDensity(
    physics.stadium.elevation,
    statcast.temperature ?? 70
  );

  const windEffect = calculateWindEffect(
    physics.wind.speed,
    physics.wind.direction
  );

  const spinRate = statcast.spinRate ?? 2000; // rpm (typical backspin)
  const spinAxis = 0; // Pure backspin for batted balls

  // Simulation parameters
  const dt = 0.01; // 10ms time step
  const maxTime = 10; // Maximum 10 seconds
  const points: TrajectoryPoint[] = [];

  let time = 0;
  let landingPoint: { x: number; y: number; z: number } | null = null;
  let peakHeight = position.y;

  // Runge-Kutta 4th order integration
  while (time < maxTime && position.y >= 0) {
    // Record trajectory point
    points.push({
      time,
      position: { ...position },
      velocity: { ...velocity },
    });

    // Calculate forces
    const drag = calculateDragForce(velocity, airDensity);
    const magnus = calculateMagnusForce(velocity, spinRate, spinAxis, airDensity);

    // Total acceleration
    const acceleration = {
      x: drag.x + magnus.x + windEffect.x,
      y: drag.y + magnus.y - physics.gravity,
      z: drag.z + magnus.z + windEffect.z,
    };

    // Update velocity (Euler method for simplicity; RK4 for production)
    velocity.x += acceleration.x * dt;
    velocity.y += acceleration.y * dt;
    velocity.z += acceleration.z * dt;

    // Update position
    position.x += velocity.x * dt;
    position.y += velocity.y * dt;
    position.z += velocity.z * dt;

    // Track peak height
    if (position.y > peakHeight) {
      peakHeight = position.y;
    }

    // Check for landing
    if (position.y <= 0 && !landingPoint) {
      landingPoint = { ...position };
      landingPoint.y = 0; // Ground level
    }

    time += dt;
  }

  // Calculate total distance
  const totalDistance = landingPoint
    ? Math.sqrt(landingPoint.x ** 2 + landingPoint.z ** 2)
    : 0;

  return {
    points,
    landingPoint,
    hangTime: time,
    peakHeight,
    totalDistance,
  };
}

/**
 * Simulate pitch trajectory
 */
export function simulatePitch(
  statcast: StatcastData,
  physics: PhysicsParams
): TrajectoryCalculation {
  const pitchVelocity = statcast.pitchVelocity ?? 90; // mph
  const releasePoint = statcast.releasePoint ?? { x: 0, y: 6, z: 54 }; // Typical release
  const spinRate = statcast.spinRate ?? 2200; // rpm
  const spinAxis = statcast.spinAxis ?? 0; // degrees

  // Convert to ft/s
  const initialSpeed = mphToFeetPerSecond(pitchVelocity);

  // Initial velocity (straight towards home plate with slight downward angle)
  const releaseAngle = degreesToRadians(-3); // Slight downward angle
  const initialVelocity = {
    x: 0, // No lateral velocity initially
    y: initialSpeed * Math.sin(releaseAngle),
    z: -initialSpeed * Math.cos(releaseAngle), // Towards home plate (negative Z)
  };

  let position = { ...releasePoint };
  let velocity = { ...initialVelocity };

  const airDensity = calculateAirDensity(physics.stadium.elevation, 70);

  const dt = 0.001; // 1ms time step (pitches are fast)
  const maxTime = 1; // Max 1 second
  const points: TrajectoryPoint[] = [];

  let time = 0;
  let landingPoint: { x: number; y: number; z: number } | null = null;
  let peakHeight = position.y;

  while (time < maxTime && position.z > 0) {
    points.push({
      time,
      position: { ...position },
      velocity: { ...velocity },
    });

    const drag = calculateDragForce(velocity, airDensity);
    const magnus = calculateMagnusForce(velocity, spinRate, spinAxis, airDensity);

    const acceleration = {
      x: drag.x + magnus.x,
      y: drag.y + magnus.y - physics.gravity,
      z: drag.z + magnus.z,
    };

    velocity.x += acceleration.x * dt;
    velocity.y += acceleration.y * dt;
    velocity.z += acceleration.z * dt;

    position.x += velocity.x * dt;
    position.y += velocity.y * dt;
    position.z += velocity.z * dt;

    if (position.y > peakHeight) {
      peakHeight = position.y;
    }

    // Check if pitch crosses home plate (z = 0)
    if (position.z <= 0 && !landingPoint) {
      landingPoint = { ...position };
    }

    time += dt;
  }

  const totalDistance = Math.abs(releasePoint.z - (landingPoint?.z ?? 0));

  return {
    points,
    landingPoint,
    hangTime: time,
    peakHeight,
    totalDistance,
  };
}

/**
 * Calculate optimal fielder positioning for catch
 */
export function calculateOptimalFielderPosition(
  ballTrajectory: TrajectoryCalculation,
  currentFielderPosition: { x: number; y: number },
  fielderSpeed: number = 27 // ft/s (average MLB outfielder)
): {
  optimalPosition: { x: number; y: number; z: number };
  catchProbability: number;
  routeEfficiency: number;
  timeToIntercept: number;
} {
  const landingPoint = ballTrajectory.landingPoint;

  if (!landingPoint) {
    return {
      optimalPosition: { x: currentFielderPosition.x, y: 0, z: currentFielderPosition.y },
      catchProbability: 0,
      routeEfficiency: 0,
      timeToIntercept: Infinity,
    };
  }

  // Optimal position is where ball lands
  const optimalPosition = { x: landingPoint.x, y: 0, z: landingPoint.z };

  // Calculate distance fielder needs to travel
  const distanceToOptimal = Math.sqrt(
    (optimalPosition.x - currentFielderPosition.x) ** 2 +
    (optimalPosition.z - currentFielderPosition.y) ** 2
  );

  // Time to intercept
  const timeToIntercept = distanceToOptimal / fielderSpeed;

  // Catch probability based on hang time vs time to intercept
  const timeBuffer = ballTrajectory.hangTime - timeToIntercept;
  const catchProbability = Math.max(0, Math.min(1, 1 / (1 + Math.exp(-5 * (timeBuffer - 0.5)))));

  // Route efficiency (1.0 = perfect line, <1.0 = inefficient route)
  const straightLineDistance = distanceToOptimal;
  const actualDistance = distanceToOptimal; // Assume straight line for now
  const routeEfficiency = straightLineDistance / (actualDistance || 1);

  return {
    optimalPosition,
    catchProbability,
    routeEfficiency,
    timeToIntercept,
  };
}

/**
 * Simulate defensive play with fielder movement
 */
export function simulateDefensivePlay(
  ballTrajectory: TrajectoryCalculation,
  fielderStartPosition: { x: number; y: number },
  fielderSpeed: number = 27 // ft/s
): Array<{ time: number; position: { x: number; y: number; z: number } }> {
  const landingPoint = ballTrajectory.landingPoint;

  if (!landingPoint) {
    return [
      { time: 0, position: { x: fielderStartPosition.x, y: 0, z: fielderStartPosition.y } },
    ];
  }

  const fielderPath: Array<{ time: number; position: { x: number; y: number; z: number } }> = [];

  // Fielder runs in straight line to landing point
  const dx = landingPoint.x - fielderStartPosition.x;
  const dz = landingPoint.z - fielderStartPosition.y;
  const totalDistance = Math.sqrt(dx ** 2 + dz ** 2);

  const totalTime = totalDistance / fielderSpeed;
  const dt = 0.1; // 100ms steps

  for (let t = 0; t <= totalTime; t += dt) {
    const progress = t / totalTime;
    fielderPath.push({
      time: t,
      position: {
        x: fielderStartPosition.x + dx * progress,
        y: 0,
        z: fielderStartPosition.y + dz * progress,
      },
    });
  }

  // Add final position
  fielderPath.push({
    time: totalTime,
    position: { x: landingPoint.x, y: 0, z: landingPoint.z },
  });

  return fielderPath;
}

/**
 * Calculate fence clearance for home run determination
 */
export function calculateFenceClearance(
  ballTrajectory: TrajectoryCalculation,
  stadium: PhysicsParams['stadium']
): {
  clearsWall: boolean;
  wallDistance: number;
  wallHeight: number;
  ballHeight: number;
  clearanceMargin: number;
} {
  const landingPoint = ballTrajectory.landingPoint;

  if (!landingPoint) {
    return {
      clearsWall: false,
      wallDistance: 0,
      wallHeight: 0,
      ballHeight: 0,
      clearanceMargin: 0,
    };
  }

  // Calculate angle from home plate to landing point
  const angle = Math.atan2(landingPoint.x, landingPoint.z) * (180 / Math.PI);

  // Find nearest fence segment
  const fenceSegment = stadium.fenceDimensions.reduce((closest, segment) => {
    const angleDiff = Math.abs(segment.angle - angle);
    const closestAngleDiff = Math.abs(closest.angle - angle);
    return angleDiff < closestAngleDiff ? segment : closest;
  });

  const wallDistance = fenceSegment.distance;
  const wallHeight = fenceSegment.height;

  // Find ball height at fence distance
  let ballHeightAtWall = 0;
  for (let i = 0; i < ballTrajectory.points.length - 1; i++) {
    const p1 = ballTrajectory.points[i];
    const p2 = ballTrajectory.points[i + 1];

    const d1 = Math.sqrt(p1.position.x ** 2 + p1.position.z ** 2);
    const d2 = Math.sqrt(p2.position.x ** 2 + p2.position.z ** 2);

    if (d1 <= wallDistance && d2 >= wallDistance) {
      // Interpolate
      const t = (wallDistance - d1) / (d2 - d1);
      ballHeightAtWall = p1.position.y + t * (p2.position.y - p1.position.y);
      break;
    }
  }

  const clearsWall = ballHeightAtWall > wallHeight;
  const clearanceMargin = ballHeightAtWall - wallHeight;

  return {
    clearsWall,
    wallDistance,
    wallHeight,
    ballHeight: ballHeightAtWall,
    clearanceMargin,
  };
}

// ============================================================================
// EXPORT DEFAULT PHYSICS PARAMS
// ============================================================================

export const DEFAULT_PHYSICS_PARAMS: PhysicsParams = {
  gravity: GRAVITY,
  airResistance: DRAG_COEFFICIENT,
  spinEffect: {
    magnus: MAGNUS_COEFFICIENT,
    backspin: 2000, // rpm
    sidespin: 0,
  },
  wind: {
    speed: 0,
    direction: 0,
  },
  stadium: {
    elevation: 0, // Sea level
    fenceDimensions: [
      // Generic MLB stadium
      { angle: -45, distance: 330, height: 8 }, // Left field line
      { angle: -22.5, distance: 375, height: 8 }, // Left-center gap
      { angle: 0, distance: 400, height: 8 }, // Center field
      { angle: 22.5, distance: 375, height: 8 }, // Right-center gap
      { angle: 45, distance: 330, height: 8 }, // Right field line
    ],
  },
};
