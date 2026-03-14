/**
 * Swing Metrics Engine — computes 12 analysis dimensions
 * from MediaPipe landmark time-series data.
 */

import type { NormalizedLandmark } from '@mediapipe/tasks-vision';
import { LANDMARK, angle2D, distance2D, midpoint } from './swing-phases';
import { type SwingSport, type MetricKey, METRIC_KEYS, scoreMetric } from './sport-models';
import { detectSwingPhases, type SwingPhaseResult } from './swing-phases';

export interface MetricResult {
  key: MetricKey;
  value: number;
  score: number; // 0-100
  label: string;
  unit: string;
}

export interface SwingAnalysis {
  sport: SwingSport;
  metrics: MetricResult[];
  phases: SwingPhaseResult;
  overallScore: number;
  keyFrames: KeyFrame[];
  landmarkCount: number;
  frameCount: number;
}

export interface KeyFrame {
  frameIndex: number;
  timestamp: number;
  label: string;
  landmarks: NormalizedLandmark[];
}

/** Compute the full 12-dimension swing analysis */
export function analyzeSwing(
  frames: NormalizedLandmark[][],
  fps: number,
  sport: SwingSport,
): SwingAnalysis {
  const phases = detectSwingPhases(frames, fps);
  const phaseMap = new Map(phases.phases.map((p) => [p.phase, p]));

  const loadFrame = phaseMap.get('load')?.frameIndex ?? Math.floor(frames.length * 0.2);
  const strideFrame = phaseMap.get('stride')?.frameIndex ?? Math.floor(frames.length * 0.35);
  const powerFrame = phaseMap.get('power')?.frameIndex ?? Math.floor(frames.length * 0.5);
  const contactFrame = phaseMap.get('contact')?.frameIndex ?? Math.floor(frames.length * 0.7);
  const followFrame = phaseMap.get('followthrough')?.frameIndex ?? Math.floor(frames.length * 0.85);

  const lmLoad = frames[loadFrame];
  const lmStride = frames[strideFrame];
  const lmPower = frames[powerFrame];
  const lmContact = frames[contactFrame];
  const lmFollow = frames[followFrame];

  // Compute each metric
  const rawMetrics: Record<string, number> = {};

  // 1. Weight Distribution — compare ankle pressure (estimated via knee angle ratio)
  const frontKneeAngle = angle2D(
    lmLoad[LANDMARK.LEFT_HIP],
    lmLoad[LANDMARK.LEFT_KNEE],
    lmLoad[LANDMARK.LEFT_ANKLE],
  );
  const backKneeAngle = angle2D(
    lmLoad[LANDMARK.RIGHT_HIP],
    lmLoad[LANDMARK.RIGHT_KNEE],
    lmLoad[LANDMARK.RIGHT_ANKLE],
  );
  const totalAngle = frontKneeAngle + backKneeAngle;
  rawMetrics.weightDistribution = totalAngle > 0 ? (backKneeAngle / totalAngle) * 100 : 50;

  // 2. Load Timing — hand depth relative to stride start (ms offset)
  const loadTs = (loadFrame / fps) * 1000;
  const strideTs = (strideFrame / fps) * 1000;
  rawMetrics.loadTiming = loadTs - strideTs;

  // 3. Posture at Load — spine angle from vertical
  const hipMid = midpoint(lmLoad[LANDMARK.LEFT_HIP], lmLoad[LANDMARK.RIGHT_HIP]);
  const shoulderMid = midpoint(lmLoad[LANDMARK.LEFT_SHOULDER], lmLoad[LANDMARK.RIGHT_SHOULDER]);
  const spineAngle = Math.abs(
    Math.atan2(shoulderMid.x - hipMid.x, hipMid.y - shoulderMid.y) * (180 / Math.PI),
  );
  rawMetrics.postureAngle = spineAngle;

  // 4. Stride Length — as percentage of body height
  const bodyHeight = distance2D(
    midpoint(lmStride[LANDMARK.LEFT_SHOULDER], lmStride[LANDMARK.RIGHT_SHOULDER]),
    midpoint(lmStride[LANDMARK.LEFT_ANKLE], lmStride[LANDMARK.RIGHT_ANKLE]),
  );
  const strideDist = distance2D(lmStride[LANDMARK.LEFT_ANKLE], lmStride[LANDMARK.RIGHT_ANKLE]);
  rawMetrics.strideLength = bodyHeight > 0 ? (strideDist / bodyHeight) * 100 : 50;

  // 5. Stride Direction — deviation from straight line (hip-to-hip baseline)
  const hipLine = Math.atan2(
    lmStride[LANDMARK.RIGHT_HIP].y - lmStride[LANDMARK.LEFT_HIP].y,
    lmStride[LANDMARK.RIGHT_HIP].x - lmStride[LANDMARK.LEFT_HIP].x,
  );
  const footLine = Math.atan2(
    lmStride[LANDMARK.LEFT_FOOT].y - lmStride[LANDMARK.RIGHT_FOOT].y,
    lmStride[LANDMARK.LEFT_FOOT].x - lmStride[LANDMARK.RIGHT_FOOT].x,
  );
  rawMetrics.strideDirection = ((footLine - hipLine) * 180) / Math.PI;

  // 6. Foot Plant — front foot orientation at stride completion
  const footAngle = Math.atan2(
    lmStride[LANDMARK.LEFT_FOOT].y - lmStride[LANDMARK.LEFT_ANKLE].y,
    lmStride[LANDMARK.LEFT_FOOT].x - lmStride[LANDMARK.LEFT_ANKLE].x,
  );
  rawMetrics.footPlantAngle = (footAngle * 180) / Math.PI;

  // 7. Hip Rotation Velocity — peak rotational speed through power phase
  let maxHipVelocity = 0;
  const searchStart = Math.max(0, powerFrame - 5);
  const searchEnd = Math.min(frames.length - 1, contactFrame + 3);
  for (let i = searchStart + 1; i <= searchEnd; i++) {
    const prevAngle = Math.atan2(
      frames[i - 1][LANDMARK.RIGHT_HIP].y - frames[i - 1][LANDMARK.LEFT_HIP].y,
      frames[i - 1][LANDMARK.RIGHT_HIP].x - frames[i - 1][LANDMARK.LEFT_HIP].x,
    );
    const currAngle = Math.atan2(
      frames[i][LANDMARK.RIGHT_HIP].y - frames[i][LANDMARK.LEFT_HIP].y,
      frames[i][LANDMARK.RIGHT_HIP].x - frames[i][LANDMARK.LEFT_HIP].x,
    );
    const angularVel = Math.abs(((currAngle - prevAngle) * 180) / Math.PI) * fps;
    maxHipVelocity = Math.max(maxHipVelocity, angularVel);
  }
  rawMetrics.hipRotationVelocity = maxHipVelocity;

  // 8. Hip-Shoulder Separation — max angle difference between hip and shoulder lines
  let maxSeparation = 0;
  for (let i = searchStart; i <= searchEnd; i++) {
    const hAngle = Math.atan2(
      frames[i][LANDMARK.RIGHT_HIP].y - frames[i][LANDMARK.LEFT_HIP].y,
      frames[i][LANDMARK.RIGHT_HIP].x - frames[i][LANDMARK.LEFT_HIP].x,
    );
    const sAngle = Math.atan2(
      frames[i][LANDMARK.RIGHT_SHOULDER].y - frames[i][LANDMARK.LEFT_SHOULDER].y,
      frames[i][LANDMARK.RIGHT_SHOULDER].x - frames[i][LANDMARK.LEFT_SHOULDER].x,
    );
    const sep = Math.abs(((hAngle - sAngle) * 180) / Math.PI);
    maxSeparation = Math.max(maxSeparation, sep);
  }
  rawMetrics.hipShoulderSeparation = maxSeparation;

  // 9. Barrel Path — estimated from hand path efficiency (straight-line vs actual path)
  let actualPath = 0;
  for (let i = powerFrame + 1; i <= contactFrame; i++) {
    actualPath += distance2D(frames[i][LANDMARK.LEFT_WRIST], frames[i - 1][LANDMARK.LEFT_WRIST]);
  }
  const directPath = distance2D(
    frames[powerFrame][LANDMARK.LEFT_WRIST],
    frames[contactFrame][LANDMARK.LEFT_WRIST],
  );
  rawMetrics.barrelPath = directPath > 0 ? Math.min(100, (directPath / actualPath) * 100) : 50;

  // 10. Contact Point — wrist position relative to front hip at contact
  const frontHip = lmContact[LANDMARK.LEFT_HIP];
  const avgWrist = midpoint(lmContact[LANDMARK.LEFT_WRIST], lmContact[LANDMARK.RIGHT_WRIST]);
  rawMetrics.contactPoint = (avgWrist.x - frontHip.x) * 100; // normalize

  // 11. Extension — arm straightness at contact
  const elbowAngle = angle2D(
    lmContact[LANDMARK.LEFT_SHOULDER],
    lmContact[LANDMARK.LEFT_ELBOW],
    lmContact[LANDMARK.LEFT_WRIST],
  );
  rawMetrics.extension = Math.min(100, (elbowAngle / 180) * 100);

  // 12. Finish Balance — compare body position stability after contact
  const followHipMid = midpoint(lmFollow[LANDMARK.LEFT_HIP], lmFollow[LANDMARK.RIGHT_HIP]);
  const followShoulderMid = midpoint(
    lmFollow[LANDMARK.LEFT_SHOULDER],
    lmFollow[LANDMARK.RIGHT_SHOULDER],
  );
  const followSpine = Math.abs(
    Math.atan2(followShoulderMid.x - followHipMid.x, followHipMid.y - followShoulderMid.y) *
      (180 / Math.PI),
  );
  rawMetrics.finishBalance = Math.max(0, 100 - followSpine * 2);

  // Build scored metric results
  const metrics: MetricResult[] = METRIC_KEYS.map((key) => {
    const value = Math.round((rawMetrics[key] ?? 0) * 10) / 10;
    return {
      key,
      value,
      score: scoreMetric(sport, key, value),
      label: key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase()),
      unit: '',
    };
  });

  const overallScore = Math.round(
    metrics.reduce((sum, m) => sum + m.score, 0) / metrics.length,
  );

  // Extract key frames for visualization
  const keyFrames: KeyFrame[] = [
    { frameIndex: loadFrame, timestamp: loadTs, label: 'Load', landmarks: lmLoad },
    { frameIndex: strideFrame, timestamp: strideTs, label: 'Stride', landmarks: lmStride },
    { frameIndex: powerFrame, timestamp: (powerFrame / fps) * 1000, label: 'Power Move', landmarks: lmPower },
    { frameIndex: contactFrame, timestamp: (contactFrame / fps) * 1000, label: 'Contact', landmarks: lmContact },
    { frameIndex: followFrame, timestamp: (followFrame / fps) * 1000, label: 'Follow-Through', landmarks: lmFollow },
  ];

  return {
    sport,
    metrics,
    phases,
    overallScore,
    keyFrames,
    landmarkCount: 33,
    frameCount: frames.length,
  };
}
