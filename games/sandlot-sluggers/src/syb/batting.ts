/**
 * Sandlot Sluggers - Batting & Contact System
 * Handles swing timing, contact quality, and batted ball outcomes.
 */

import * as THREE from 'three';
import type { SceneIndex } from './scene';
import { GLB_CONTRACT, worldPos, tryGetNode } from './scene';
import type { StrikeCrossEvent, UpAxis } from './pitch';

// ============================================================================
// Types
// ============================================================================

export type SwingTiming = 'early' | 'good' | 'late' | 'miss';

export type ContactQuality = 'perfect' | 'good' | 'weak' | 'foul' | 'whiff';

export type BattedBallType = 'groundBall' | 'lineDrive' | 'flyBall' | 'popup' | 'homeRun';

export type BattedBallResult = {
  type: BattedBallType;
  launchAngle: number; // degrees
  exitVelocity: number; // m/s
  direction: number; // degrees from center field (negative = left, positive = right)
  landingPoint: THREE.Vector3;
  hangTime: number; // seconds
  distance: number; // meters from home plate
};

export type SwingResult =
  | { outcome: 'whiff' }
  | { outcome: 'foul' }
  | { outcome: 'contact'; ball: BattedBallResult };

// ============================================================================
// Constants
// ============================================================================

// Timing windows (seconds from strike plane crossing)
const TIMING_EARLY_MAX = -0.08;
const TIMING_GOOD_MIN = -0.04;
const TIMING_GOOD_MAX = 0.04;
const TIMING_LATE_MIN = 0.08;

// Batting parameters
const BASE_EXIT_VELOCITY = 28; // m/s (~63 mph)
const MAX_EXIT_VELOCITY = 42; // m/s (~94 mph, kids won't hit this hard)
const GRAVITY = 9.81;

// Field dimensions (60ft youth field)
const FENCE_DISTANCE_CENTER = 60; // meters (~200ft)
const FENCE_DISTANCE_CORNERS = 50; // meters (~165ft)

// ============================================================================
// Deterministic RNG for batted balls
// ============================================================================

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ============================================================================
// Swing Timing Evaluation
// ============================================================================

export function evaluateSwingTiming(
  swingTime: number,
  crossEvent: StrikeCrossEvent | null
): SwingTiming {
  if (!crossEvent) {
    return 'miss'; // Ball hasn't crossed plate yet or no crossing detected
  }

  const delta = swingTime - crossEvent.timeSec;

  if (delta < TIMING_EARLY_MAX) return 'early';
  if (delta >= TIMING_GOOD_MIN && delta <= TIMING_GOOD_MAX) return 'good';
  if (delta > TIMING_LATE_MIN) return 'late';

  // In-between zones
  return delta < 0 ? 'early' : 'late';
}

// ============================================================================
// Contact Quality
// ============================================================================

export function evaluateContactQuality(
  timing: SwingTiming,
  crossEvent: StrikeCrossEvent | null,
  seed: number
): ContactQuality {
  const rng = mulberry32(seed);

  // No contact if timing is way off
  if (timing === 'miss') {
    return 'whiff';
  }

  // Must have valid cross event
  if (!crossEvent) {
    return 'whiff';
  }

  // If pitch was outside zone, harder to make good contact
  if (!crossEvent.isInZone) {
    const roll = rng();
    if (roll < 0.4) return 'whiff';
    if (roll < 0.7) return 'foul';
    return 'weak';
  }

  // In-zone pitch contact quality
  if (timing === 'good') {
    const roll = rng();
    if (roll < 0.25) return 'perfect';
    if (roll < 0.7) return 'good';
    if (roll < 0.85) return 'weak';
    return 'foul';
  }

  // Early or late timing
  const roll = rng();
  if (roll < 0.15) return 'good';
  if (roll < 0.4) return 'weak';
  if (roll < 0.75) return 'foul';
  return 'whiff';
}

// ============================================================================
// Batted Ball Generation
// ============================================================================

export function generateBattedBall(
  quality: ContactQuality,
  timing: SwingTiming,
  _crossEvent: StrikeCrossEvent,
  seed: number,
  upAxis: UpAxis
): BattedBallResult | null {
  if (quality === 'whiff' || quality === 'foul') {
    return null;
  }

  const rng = mulberry32(seed);

  // Launch angle based on quality
  let baseLaunchAngle: number;
  let launchAngleVariance: number;

  switch (quality) {
    case 'perfect':
      baseLaunchAngle = 22 + rng() * 8; // 22-30 degrees (ideal)
      launchAngleVariance = 3;
      break;
    case 'good':
      baseLaunchAngle = 15 + rng() * 15; // 15-30 degrees
      launchAngleVariance = 8;
      break;
    case 'weak':
      baseLaunchAngle = -5 + rng() * 20; // -5 to 15 degrees (grounders/weak)
      launchAngleVariance = 12;
      break;
    default:
      baseLaunchAngle = 10;
      launchAngleVariance = 15;
  }

  const launchAngle = baseLaunchAngle + (rng() - 0.5) * launchAngleVariance;

  // Exit velocity based on quality
  let exitVelocity: number;
  switch (quality) {
    case 'perfect':
      exitVelocity = MAX_EXIT_VELOCITY * (0.85 + rng() * 0.15);
      break;
    case 'good':
      exitVelocity = BASE_EXIT_VELOCITY + rng() * 10;
      break;
    case 'weak':
      exitVelocity = BASE_EXIT_VELOCITY * (0.5 + rng() * 0.3);
      break;
    default:
      exitVelocity = BASE_EXIT_VELOCITY * 0.7;
  }

  // Direction based on timing
  // Early = pull (left for RHB), Late = opposite field (right for RHB)
  let baseDirection: number;
  switch (timing) {
    case 'early':
      baseDirection = -25 - rng() * 20; // Pull side
      break;
    case 'late':
      baseDirection = 20 + rng() * 25; // Opposite field
      break;
    default:
      baseDirection = (rng() - 0.5) * 50; // Up the middle
  }

  const direction = baseDirection + (rng() - 0.5) * 15;

  // Calculate trajectory
  const launchAngleRad = (launchAngle * Math.PI) / 180;
  const directionRad = (direction * Math.PI) / 180;

  const vHorizontal = exitVelocity * Math.cos(launchAngleRad);
  const vVertical = exitVelocity * Math.sin(launchAngleRad);

  // Time of flight (simplified - doesn't account for air resistance)
  const hangTime = launchAngle > 0 ? (2 * vVertical) / GRAVITY : vHorizontal / 30; // Ground balls roll

  // Distance traveled
  const distance = vHorizontal * Math.max(hangTime, 0.5);

  // Landing point calculation
  const landingX = distance * Math.sin(directionRad);
  const landingY = distance * Math.cos(directionRad);

  const landingPoint = new THREE.Vector3();
  if (upAxis === 'Z') {
    landingPoint.set(landingX, landingY, 0);
  } else {
    landingPoint.set(landingX, 0, landingY);
  }

  // Classify the batted ball type
  let type: BattedBallType;
  if (launchAngle < 5) {
    type = 'groundBall';
  } else if (launchAngle < 18) {
    type = 'lineDrive';
  } else if (launchAngle < 40) {
    // Check if it clears the fence
    const fenceDistAtAngle = interpolateFenceDistance(direction);
    if (distance > fenceDistAtAngle && vVertical > 8) {
      type = 'homeRun';
    } else {
      type = 'flyBall';
    }
  } else {
    type = 'popup';
  }

  return {
    type,
    launchAngle,
    exitVelocity,
    direction,
    landingPoint,
    hangTime,
    distance,
  };
}

function interpolateFenceDistance(direction: number): number {
  // Direction: 0 = center, -45 = left line, +45 = right line
  const absDir = Math.abs(direction);
  const t = Math.min(absDir / 45, 1);
  return FENCE_DISTANCE_CENTER * (1 - t) + FENCE_DISTANCE_CORNERS * t;
}

// ============================================================================
// Fielding Resolution
// ============================================================================

export type FieldingOutcome = 'out' | 'single' | 'double' | 'triple' | 'homeRun' | 'error';

export function resolveFieldingOutcome(
  ball: BattedBallResult,
  index: SceneIndex,
  seed: number,
  _upAxis: UpAxis
): FieldingOutcome {
  const rng = mulberry32(seed);

  // Home runs are automatic
  if (ball.type === 'homeRun') {
    return 'homeRun';
  }

  // Find closest fielder to landing point
  const fielderAnchors = [
    GLB_CONTRACT.ANCHORS.FIRST_BASEMAN,
    GLB_CONTRACT.ANCHORS.SECOND_BASEMAN,
    GLB_CONTRACT.ANCHORS.SHORTSTOP,
    GLB_CONTRACT.ANCHORS.THIRD_BASEMAN,
    GLB_CONTRACT.ANCHORS.LEFT_FIELD,
    GLB_CONTRACT.ANCHORS.CENTER_FIELD,
    GLB_CONTRACT.ANCHORS.RIGHT_FIELD,
  ];

  let closestDist = Infinity;
  let closestFielder: string | null = null;

  for (const anchorName of fielderAnchors) {
    const anchor = tryGetNode(index, anchorName);
    if (!anchor) continue;

    const fielderPos = worldPos(anchor);
    const dist = fielderPos.distanceTo(ball.landingPoint);

    if (dist < closestDist) {
      closestDist = dist;
      closestFielder = anchorName;
    }
  }

  // If no fielders found, use distance-based fallback
  if (!closestFielder) {
    closestDist = ball.distance * 0.6; // Assume fielder is 60% of the way
  }

  // Resolution based on ball type and distance to fielder
  switch (ball.type) {
    case 'groundBall': {
      // Infielders can field grounders within ~8m
      const reachDistance = 8 + rng() * 3;
      if (closestDist < reachDistance) {
        // Error chance on hard hit balls
        if (ball.exitVelocity > 32 && rng() < 0.15) {
          return 'single'; // Bobble = single
        }
        return 'out';
      }
      // Through the infield
      return 'single';
    }

    case 'lineDrive': {
      // Line drives caught within ~12m
      const catchRadius = 12 + rng() * 5;
      if (closestDist < catchRadius && ball.hangTime > 0.8) {
        return 'out';
      }
      // Gap shots
      if (ball.distance > 35) {
        return rng() < 0.3 ? 'triple' : 'double';
      }
      return 'single';
    }

    case 'flyBall': {
      // Outfielders can cover more ground on fly balls
      const coverageRadius = 15 + ball.hangTime * 4;
      if (closestDist < coverageRadius) {
        return 'out';
      }
      // Deep fly that isn't caught
      if (ball.distance > 50) {
        return rng() < 0.4 ? 'triple' : 'double';
      }
      return 'double';
    }

    case 'popup': {
      // Popups almost always caught
      if (rng() < 0.95) {
        return 'out';
      }
      return 'single'; // Rare drop
    }

    default:
      return 'out';
  }
}

// ============================================================================
// Main Swing Resolution
// ============================================================================

export function resolveSwing(params: {
  swingTime: number;
  crossEvent: StrikeCrossEvent | null;
  pitchInZone: boolean;
  seed: number;
}): SwingResult {
  const { swingTime, crossEvent, seed } = params;

  const timing = evaluateSwingTiming(swingTime, crossEvent);
  const quality = evaluateContactQuality(timing, crossEvent, seed + 1);

  if (quality === 'whiff') {
    return { outcome: 'whiff' };
  }

  if (quality === 'foul') {
    return { outcome: 'foul' };
  }

  // Generate batted ball
  if (crossEvent) {
    const ball = generateBattedBall(
      quality,
      timing,
      crossEvent,
      seed + 2,
      'Z' // Default to Z-up
    );

    if (ball) {
      return { outcome: 'contact', ball };
    }
  }

  // Fallback to foul
  return { outcome: 'foul' };
}

// ============================================================================
// Engine.ts Compatibility Types and Functions
// ============================================================================

export type SwingState = {
  swingTriggered: boolean;
  swingStartTime: number;
  contactProcessed: boolean;
};

export function createSwingState(): SwingState {
  return {
    swingTriggered: false,
    swingStartTime: 0,
    contactProcessed: false,
  };
}

export type ContactResult = {
  timing: SwingTiming;
  quality: ContactQuality;
};

export function evaluateContact(
  swingState: SwingState,
  crossEvent: StrikeCrossEvent,
  seed: number
): ContactResult {
  const swingDuration = (performance.now() - swingState.swingStartTime) / 1000;
  const timing = evaluateSwingTiming(crossEvent.timeSec + swingDuration * 0.5, crossEvent);
  const quality = evaluateContactQuality(timing, crossEvent, seed);
  return { timing, quality };
}

export type BattedBall = BattedBallResult;

export type FieldingResult = {
  isOut: boolean;
  basesAdvanced: 'single' | 'double' | 'triple' | 'homeRun';
};

export function resolveFieldingPlay(
  ball: BattedBall,
  index: SceneIndex,
  seed: number
): FieldingResult {
  const outcome = resolveFieldingOutcome(ball, index, seed, 'Z');

  if (outcome === 'out' || outcome === 'error') {
    return { isOut: true, basesAdvanced: 'single' };
  }

  return {
    isOut: false,
    basesAdvanced: outcome as 'single' | 'double' | 'triple' | 'homeRun',
  };
}
