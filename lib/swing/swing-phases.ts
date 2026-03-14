/**
 * Swing phase detection — identifies key moments in a swing
 * from MediaPipe landmark time-series data.
 *
 * Phases: Stance → Load → Stride → Power Move → Contact → Follow-Through
 */

import type { NormalizedLandmark } from '@mediapipe/tasks-vision';

export type SwingPhase = 'stance' | 'load' | 'stride' | 'power' | 'contact' | 'followthrough';

export interface PhaseTimestamp {
  phase: SwingPhase;
  frameIndex: number;
  timestamp: number; // ms from video start
  confidence: number; // 0-1
}

export interface SwingPhaseResult {
  phases: PhaseTimestamp[];
  totalFrames: number;
  fps: number;
  durationMs: number;
}

/** Key landmark indices from MediaPipe Pose (33 landmarks) */
const LANDMARK = {
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
  LEFT_FOOT: 31,
  RIGHT_FOOT: 32,
} as const;

/** Compute the angle between three 2D points (in degrees) */
function angle2D(
  a: { x: number; y: number },
  b: { x: number; y: number },
  c: { x: number; y: number },
): number {
  const ab = { x: a.x - b.x, y: a.y - b.y };
  const cb = { x: c.x - b.x, y: c.y - b.y };
  const dot = ab.x * cb.x + ab.y * cb.y;
  const magAB = Math.sqrt(ab.x * ab.x + ab.y * ab.y);
  const magCB = Math.sqrt(cb.x * cb.x + cb.y * cb.y);
  if (magAB === 0 || magCB === 0) return 0;
  const cosAngle = Math.max(-1, Math.min(1, dot / (magAB * magCB)));
  return (Math.acos(cosAngle) * 180) / Math.PI;
}

/** Distance between two 2D points */
function distance2D(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

/** Midpoint of two landmarks */
function midpoint(a: NormalizedLandmark, b: NormalizedLandmark): { x: number; y: number } {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

/**
 * Detect swing phases from frame-by-frame landmark data.
 * Uses heuristics based on body position changes over time.
 */
export function detectSwingPhases(
  frames: NormalizedLandmark[][],
  fps: number,
): SwingPhaseResult {
  const totalFrames = frames.length;
  const durationMs = (totalFrames / fps) * 1000;
  const phases: PhaseTimestamp[] = [];

  if (totalFrames < 10) {
    return { phases: [], totalFrames, fps, durationMs };
  }

  // Compute per-frame metrics for phase detection
  const handPositions: number[] = [];
  const hipAngles: number[] = [];
  const footDistances: number[] = [];
  const wristVelocities: number[] = [];

  for (let i = 0; i < totalFrames; i++) {
    const lm = frames[i];

    // Hand depth — average wrist Y position (lower Y = higher in frame = hands up)
    const avgWristY = (lm[LANDMARK.LEFT_WRIST].y + lm[LANDMARK.RIGHT_WRIST].y) / 2;
    handPositions.push(avgWristY);

    // Hip rotation — angle between hip line and horizontal
    const hipAngle = Math.atan2(
      lm[LANDMARK.RIGHT_HIP].y - lm[LANDMARK.LEFT_HIP].y,
      lm[LANDMARK.RIGHT_HIP].x - lm[LANDMARK.LEFT_HIP].x,
    ) * (180 / Math.PI);
    hipAngles.push(hipAngle);

    // Foot spread — distance between ankles
    const footDist = distance2D(lm[LANDMARK.LEFT_ANKLE], lm[LANDMARK.RIGHT_ANKLE]);
    footDistances.push(footDist);

    // Wrist velocity — frame-to-frame displacement
    if (i > 0) {
      const prevLm = frames[i - 1];
      const dxL = lm[LANDMARK.LEFT_WRIST].x - prevLm[LANDMARK.LEFT_WRIST].x;
      const dyL = lm[LANDMARK.LEFT_WRIST].y - prevLm[LANDMARK.LEFT_WRIST].y;
      const dxR = lm[LANDMARK.RIGHT_WRIST].x - prevLm[LANDMARK.RIGHT_WRIST].x;
      const dyR = lm[LANDMARK.RIGHT_WRIST].y - prevLm[LANDMARK.RIGHT_WRIST].y;
      const vL = Math.sqrt(dxL * dxL + dyL * dyL);
      const vR = Math.sqrt(dxR * dxR + dyR * dyR);
      wristVelocities.push(Math.max(vL, vR));
    } else {
      wristVelocities.push(0);
    }
  }

  // Smooth wrist velocities (3-frame moving average)
  const smoothedVelocities = wristVelocities.map((_, i) => {
    const start = Math.max(0, i - 1);
    const end = Math.min(wristVelocities.length, i + 2);
    const slice = wristVelocities.slice(start, end);
    return slice.reduce((a, b) => a + b, 0) / slice.length;
  });

  // Find peak wrist velocity = approximate contact point
  let peakVelFrame = 0;
  let peakVel = 0;
  for (let i = 0; i < smoothedVelocities.length; i++) {
    if (smoothedVelocities[i] > peakVel) {
      peakVel = smoothedVelocities[i];
      peakVelFrame = i;
    }
  }

  // Find load position — deepest hand pullback before the swing
  // Look for the frame where hands go deepest (furthest back) before peak velocity
  let loadFrame = 0;
  let maxHandPull = 0;
  const searchEnd = Math.min(peakVelFrame, Math.floor(totalFrames * 0.6));
  for (let i = 0; i < searchEnd; i++) {
    if (handPositions[i] > maxHandPull) {
      maxHandPull = handPositions[i];
      loadFrame = i;
    }
  }

  // Find stride start — when feet start to separate after load
  const baselineFootDist = footDistances[loadFrame] || footDistances[0];
  let strideFrame = loadFrame + 1;
  for (let i = loadFrame + 1; i < peakVelFrame; i++) {
    if (footDistances[i] > baselineFootDist * 1.15) {
      strideFrame = i;
      break;
    }
  }

  // Power move — when hip rotation accelerates (biggest hip angle change)
  let powerFrame = Math.floor((strideFrame + peakVelFrame) / 2);
  let maxHipDelta = 0;
  for (let i = strideFrame; i < peakVelFrame - 1; i++) {
    const delta = Math.abs(hipAngles[i + 1] - hipAngles[i]);
    if (delta > maxHipDelta) {
      maxHipDelta = delta;
      powerFrame = i;
    }
  }

  // Follow-through — starts right after peak velocity
  const followFrame = Math.min(peakVelFrame + Math.floor(fps * 0.1), totalFrames - 1);

  // Stance — first frame
  phases.push({
    phase: 'stance',
    frameIndex: 0,
    timestamp: 0,
    confidence: 0.9,
  });

  if (loadFrame > 0) {
    phases.push({
      phase: 'load',
      frameIndex: loadFrame,
      timestamp: (loadFrame / fps) * 1000,
      confidence: 0.8,
    });
  }

  if (strideFrame > loadFrame) {
    phases.push({
      phase: 'stride',
      frameIndex: strideFrame,
      timestamp: (strideFrame / fps) * 1000,
      confidence: 0.75,
    });
  }

  if (powerFrame > strideFrame) {
    phases.push({
      phase: 'power',
      frameIndex: powerFrame,
      timestamp: (powerFrame / fps) * 1000,
      confidence: 0.7,
    });
  }

  phases.push({
    phase: 'contact',
    frameIndex: peakVelFrame,
    timestamp: (peakVelFrame / fps) * 1000,
    confidence: 0.85,
  });

  if (followFrame > peakVelFrame) {
    phases.push({
      phase: 'followthrough',
      frameIndex: followFrame,
      timestamp: (followFrame / fps) * 1000,
      confidence: 0.8,
    });
  }

  return { phases, totalFrames, fps, durationMs };
}

/** Human-readable label for each phase */
export const PHASE_LABELS: Record<SwingPhase, string> = {
  stance: 'Stance',
  load: 'Load',
  stride: 'Stride',
  power: 'Power Move',
  contact: 'Contact',
  followthrough: 'Follow-Through',
};

/** Color for each phase in visualizations */
export const PHASE_COLORS: Record<SwingPhase, string> = {
  stance: '#C4B8A5',
  load: '#4B9CD3',
  stride: '#3B82F6',
  power: '#BF5700',
  contact: '#F59E0B',
  followthrough: '#10B981',
};

export { LANDMARK, angle2D, distance2D, midpoint };
