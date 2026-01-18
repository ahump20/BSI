import * as THREE from 'three';
import type { SceneIndex } from './scene';
import { tryGetNode, worldPos } from './scene';

export type UpAxis = 'Y' | 'Z';
export type BatterHand = 'R' | 'L';

export type PitchLane =
  | 'MID_MID'
  | 'IN_MID'
  | 'OUT_MID'
  | 'MID_HIGH'
  | 'MID_LOW'
  | 'IN_HIGH'
  | 'IN_LOW'
  | 'OUT_HIGH'
  | 'OUT_LOW';

export type StrikeCrossEvent = {
  tNorm: number; // 0..1 along pitch time
  timeSec: number; // seconds since pitch start
  point: THREE.Vector3; // world-space intersection point
  isInZone: boolean;
  zoneHalfWidthM: number;
  zoneHalfHeightM: number;
};

export type PitchOutcome =
  | { kind: 'pending' }
  | { kind: 'ball'; cross: StrikeCrossEvent }
  | { kind: 'strike'; cross: StrikeCrossEvent }
  | { kind: 'no_cross' };

export type PitchController = {
  ball: THREE.Mesh;
  lane: PitchLane;
  active: boolean;
  duration: number;
  elapsed: number;
  lastCross: StrikeCrossEvent | null;
  outcome: PitchOutcome;
  update(dt: number): void;
  stop(): void;
  reset(): void;
};

// ------------------------------------------------------------
// Deterministic RNG
// ------------------------------------------------------------
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

function smoothstep(t: number) {
  return t * t * (3 - 2 * t);
}

function getUpVector(upAxis: UpAxis) {
  return upAxis === 'Z' ? new THREE.Vector3(0, 0, 1) : new THREE.Vector3(0, 1, 0);
}

function makeBasis(from: THREE.Vector3, to: THREE.Vector3, upAxis: UpAxis) {
  const dir = to.clone().sub(from).normalize();
  const up = getUpVector(upAxis);

  const right = new THREE.Vector3().crossVectors(dir, up);
  if (right.lengthSq() < 1e-8) {
    right.set(1, 0, 0);
  } else {
    right.normalize();
  }

  const upOrtho = new THREE.Vector3().crossVectors(right, dir).normalize();
  return { dir, right, upOrtho };
}

// ------------------------------------------------------------
// Ball pool (avoids churn)
// ------------------------------------------------------------
export class BallPool {
  private pool: THREE.Mesh[] = [];

  constructor(private create: () => THREE.Mesh) {}

  acquire(scene: THREE.Scene): THREE.Mesh {
    const ball = this.pool.pop() ?? this.create();
    if (!scene.getObjectByName(ball.name)) scene.add(ball);
    ball.visible = true;
    return ball;
  }

  release(ball: THREE.Mesh) {
    ball.visible = false;
    this.pool.push(ball);
  }
}

export function createBallMesh(params?: {
  radius?: number;
  segments?: number;
  material?: THREE.Material;
}): THREE.Mesh {
  const radius = params?.radius ?? 0.085; // slightly oversized for readability
  const segments = params?.segments ?? 12;
  const material =
    params?.material ??
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.75, metalness: 0.0 });

  const geo = new THREE.SphereGeometry(radius, segments, segments);
  const ball = new THREE.Mesh(geo, material);
  ball.name = 'SYB_Ball';
  ball.castShadow = false;
  ball.receiveShadow = false;
  ball.visible = false;
  return ball;
}

// ------------------------------------------------------------
// Lane profiles
// ------------------------------------------------------------
type PitchProfile = {
  plateH: number;
  plateV: number;
  arc: number;
  breakH: number;
  duration: number;
};

function pitchProfileForLane(lane: PitchLane): PitchProfile {
  switch (lane) {
    case 'MID_MID':
      return { plateH: 0.0, plateV: 0.0, arc: 0.55, breakH: 0.0, duration: 0.62 };
    case 'IN_MID':
      return { plateH: 0.28, plateV: 0.0, arc: 0.55, breakH: 0.18, duration: 0.64 };
    case 'OUT_MID':
      return { plateH: -0.28, plateV: 0.0, arc: 0.55, breakH: -0.18, duration: 0.64 };

    case 'MID_HIGH':
      return { plateH: 0.0, plateV: 0.28, arc: 0.62, breakH: 0.0, duration: 0.66 };
    case 'MID_LOW':
      return { plateH: 0.0, plateV: -0.22, arc: 0.45, breakH: 0.0, duration: 0.6 };

    case 'IN_HIGH':
      return { plateH: 0.28, plateV: 0.28, arc: 0.62, breakH: 0.2, duration: 0.68 };
    case 'IN_LOW':
      return { plateH: 0.28, plateV: -0.22, arc: 0.45, breakH: 0.2, duration: 0.62 };

    case 'OUT_HIGH':
      return { plateH: -0.28, plateV: 0.28, arc: 0.62, breakH: -0.2, duration: 0.68 };
    case 'OUT_LOW':
      return { plateH: -0.28, plateV: -0.22, arc: 0.45, breakH: -0.2, duration: 0.62 };
  }
}

// ------------------------------------------------------------
// Pitch spawner with strike-plane crossing event
// ------------------------------------------------------------
export function spawnPitch(params: {
  index: SceneIndex;
  scene: THREE.Scene;
  lane: PitchLane;
  seed: number;
  upAxis: UpAxis;
  batterHand?: BatterHand;
  startNodeName?: string;
  targetNodeName?: string;
  // strike zone size (meters)
  zoneHalfWidthM?: number;
  zoneHalfHeightM?: number;
  // pooling
  ballPool?: BallPool;
  autoReleaseToPool?: boolean;
  // callback
  onStrikeCross?: (ev: StrikeCrossEvent) => void;
}): PitchController {
  const {
    index,
    scene,
    lane,
    seed,
    upAxis,
    batterHand = 'R',
    startNodeName = 'SYB_Anchor_Mound',
    targetNodeName = 'SYB_Aim_StrikeZone',
    zoneHalfWidthM = 0.25,
    zoneHalfHeightM = 0.3,
    ballPool,
    autoReleaseToPool = true,
    onStrikeCross,
  } = params;

  const startNode =
    tryGetNode(index, startNodeName) ??
    tryGetNode(index, 'SYB_Aim_Mound') ??
    tryGetNode(index, 'SYB_Anchor_Mound');

  if (!startNode) {
    throw new Error(`Pitch start node not found: ${startNodeName} (and no fallback)`);
  }

  const targetNode = tryGetNode(index, targetNodeName) ?? tryGetNode(index, 'SYB_Aim_StrikeZone');

  const home = tryGetNode(index, 'SYB_Anchor_Home');
  const fallbackTarget = home
    ? worldPos(home).add(getUpVector(upAxis).clone().multiplyScalar(1.0))
    : new THREE.Vector3(0, 1.2, 1.0);

  const start = worldPos(startNode);
  const strikeCenter = targetNode ? worldPos(targetNode) : fallbackTarget;

  const { dir, right, upOrtho } = makeBasis(start, strikeCenter, upAxis);

  const prof = pitchProfileForLane(lane);
  const rng = mulberry32(seed);

  const jitterH = (rng() - 0.5) * 0.06;
  const jitterV = (rng() - 0.5) * 0.06;
  const jitterBreak = (rng() - 0.5) * 0.08;

  const handSign = batterHand === 'R' ? 1 : -1;

  const end = strikeCenter
    .clone()
    .add(right.clone().multiplyScalar((prof.plateH + jitterH) * handSign))
    .add(upOrtho.clone().multiplyScalar(prof.plateV + jitterV));

  const startLift = 1.25; // release height relative to strikeCenter basis
  const startPos = start.clone().add(upOrtho.clone().multiplyScalar(startLift));

  const duration = Math.max(0.25, prof.duration + (rng() - 0.5) * 0.06);
  const arcMag = prof.arc + (rng() - 0.5) * 0.08;
  const breakMag = (prof.breakH + jitterBreak) * handSign;

  const ball = ballPool ? ballPool.acquire(scene) : createBallMesh();
  if (!ballPool && !scene.getObjectByName(ball.name)) scene.add(ball);
  ball.visible = true;
  ball.position.copy(startPos);

  // Strike plane: perpendicular to pitch direction passing through strikeCenter
  const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(dir.clone(), strikeCenter);

  // Internal state
  let tNorm = 0;
  let prevPos = startPos.clone();
  let prevDist = plane.distanceToPoint(prevPos);

  const controller: PitchController = {
    ball,
    lane,
    active: true,
    duration,
    elapsed: 0,
    lastCross: null,
    outcome: { kind: 'pending' },
    update: () => {},
    stop: () => {},
    reset: () => {},
  };

  function positionAt(tt: number): THREE.Vector3 {
    const base = startPos.clone().lerp(end, tt);
    const arc = Math.sin(Math.PI * tt) * arcMag;
    const late = smoothstep(THREE.MathUtils.clamp((tt - 0.4) / 0.6, 0, 1));
    const brk = late * breakMag;

    base.add(upOrtho.clone().multiplyScalar(arc));
    base.add(right.clone().multiplyScalar(brk));
    return base;
  }

  function evaluateInZone(p: THREE.Vector3): boolean {
    const rel = p.clone().sub(strikeCenter);
    const h = rel.dot(right);
    const v = rel.dot(upOrtho);
    return Math.abs(h) <= zoneHalfWidthM && Math.abs(v) <= zoneHalfHeightM;
  }

  controller.update = (dt: number) => {
    if (!controller.active) return;

    controller.elapsed += dt;
    tNorm += dt / duration;
    const tt = THREE.MathUtils.clamp(tNorm, 0, 1);

    const currPos = positionAt(tt);
    ball.position.copy(currPos);

    // Strike-plane crossing detection (once)
    if (!controller.lastCross) {
      const currDist = plane.distanceToPoint(currPos);
      const crosses = (prevDist <= 0 && currDist >= 0) || (prevDist >= 0 && currDist <= 0);
      const near = Math.abs(currDist) < 1e-3;

      if (crosses || near) {
        const denom = prevDist - currDist;
        const u = Math.abs(denom) < 1e-8 ? 0.0 : prevDist / denom;
        const clampedU = THREE.MathUtils.clamp(u, 0, 1);
        const hit = prevPos.clone().lerp(currPos, clampedU);

        const isInZone = evaluateInZone(hit);
        const cross: StrikeCrossEvent = {
          tNorm: tt,
          timeSec: controller.elapsed,
          point: hit,
          isInZone,
          zoneHalfWidthM,
          zoneHalfHeightM,
        };

        controller.lastCross = cross;
        controller.outcome = isInZone ? { kind: 'strike', cross } : { kind: 'ball', cross };
        onStrikeCross?.(cross);
      }

      prevPos.copy(currPos);
      prevDist = currDist;
    }

    if (tt >= 1) {
      controller.active = false;
      if (!controller.lastCross) controller.outcome = { kind: 'no_cross' };
      if (ballPool && autoReleaseToPool) ballPool.release(ball);
    }
  };

  controller.stop = () => {
    controller.active = false;
    if (ballPool) ballPool.release(ball);
  };

  controller.reset = () => {
    tNorm = 0;
    controller.elapsed = 0;
    controller.active = true;
    controller.lastCross = null;
    controller.outcome = { kind: 'pending' };

    prevPos.copy(startPos);
    prevDist = plane.distanceToPoint(prevPos);

    ball.visible = true;
    ball.position.copy(startPos);
  };

  return controller;
}
