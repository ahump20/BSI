/**
 * Sandlot Sluggers - Camera System
 * Manages camera switching and interpolation using GLB-defined camera nodes.
 */

import * as THREE from 'three';
import { applyCameraViewport, SceneIndex, tryGetNode, worldPos } from './scene';

// ============================================================================
// Types
// ============================================================================

export type CameraName = 'SYB_Cam_BehindBatter' | 'SYB_Cam_StrikeZoneHigh' | 'SYB_Cam_Isometric';

export type CameraMode =
  | 'behindBatter'
  | 'strikeZoneHigh'
  | 'isometric'
  | 'pitcherView'
  | 'fieldOverview';

export type CameraState = {
  mode: CameraMode;
  position: THREE.Vector3;
  target: THREE.Vector3;
  fov: number;
  transitionProgress: number;
};

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_FOV = 50;
const TRANSITION_DURATION = 0.4;

const FALLBACK_CAMERAS: Record<
  CameraMode,
  { pos: [number, number, number]; target: [number, number, number]; fov: number }
> = {
  behindBatter: { pos: [0, -3, 1.8], target: [0, 18, 0.8], fov: 55 },
  strikeZoneHigh: { pos: [0, -2, 2.5], target: [0, 0, 0.8], fov: 40 },
  isometric: { pos: [25, -25, 20], target: [0, 15, 0], fov: 50 },
  pitcherView: { pos: [0, 18.3, 1.5], target: [0, 0, 0.8], fov: 45 },
  fieldOverview: { pos: [0, 0, 45], target: [0, 20, 0], fov: 60 },
};

const MODE_TO_NODE: Partial<Record<CameraMode, CameraName>> = {
  behindBatter: 'SYB_Cam_BehindBatter',
  strikeZoneHigh: 'SYB_Cam_StrikeZoneHigh',
  isometric: 'SYB_Cam_Isometric',
};

// ============================================================================
// Legacy Camera Rig (for basic GLB camera switching)
// ============================================================================

export class SYBCameraRig {
  private index: SceneIndex;
  public active: THREE.Camera;

  constructor(index: SceneIndex, viewport: { w: number; h: number }) {
    this.index = index;

    const cam =
      index.cameras.get('SYB_Cam_BehindBatter') ??
      index.cameras.get('SYB_Cam_StrikeZoneHigh') ??
      index.cameras.get('SYB_Cam_Isometric');

    if (!cam) {
      const fallback = new THREE.PerspectiveCamera(45, viewport.w / viewport.h, 0.1, 500);
      fallback.position.set(0, -10, 3);
      fallback.lookAt(0, 10, 1);
      this.active = fallback;
    } else {
      this.active = cam;
      applyCameraViewport(this.active, viewport.w, viewport.h);
    }
  }

  setActive(name: CameraName, viewport: { w: number; h: number }): boolean {
    const cam = this.index.cameras.get(name);
    if (!cam) return false;
    this.active = cam;
    applyCameraViewport(this.active, viewport.w, viewport.h);
    return true;
  }

  resize(viewport: { w: number; h: number }) {
    applyCameraViewport(this.active, viewport.w, viewport.h);
  }
}

// ============================================================================
// Enhanced Camera Rig with Interpolation
// ============================================================================

export class CameraRig {
  private camera: THREE.PerspectiveCamera;
  private state: CameraState;
  private targetState: CameraState | null = null;
  private index: SceneIndex | null = null;
  private shakeOffset = new THREE.Vector3();
  private shakeDecay = 0;

  constructor(aspect: number) {
    this.camera = new THREE.PerspectiveCamera(DEFAULT_FOV, aspect, 0.1, 500);
    this.state = {
      mode: 'behindBatter',
      position: new THREE.Vector3(...FALLBACK_CAMERAS.behindBatter.pos),
      target: new THREE.Vector3(...FALLBACK_CAMERAS.behindBatter.target),
      fov: FALLBACK_CAMERAS.behindBatter.fov,
      transitionProgress: 1,
    };
    this.applyState();
  }

  get threeCamera(): THREE.PerspectiveCamera {
    return this.camera;
  }

  get currentMode(): CameraMode {
    return this.state.mode;
  }

  bindIndex(index: SceneIndex): void {
    this.index = index;
  }

  setAspect(aspect: number): void {
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
  }

  switchTo(mode: CameraMode, instant = false): void {
    if (mode === this.state.mode && this.state.transitionProgress >= 1) return;

    const newState = this.getStateForMode(mode);

    if (instant) {
      this.state = newState;
      this.targetState = null;
      this.applyState();
    } else {
      this.targetState = newState;
      this.state.transitionProgress = 0;
    }
  }

  private getStateForMode(mode: CameraMode): CameraState {
    const nodeName = MODE_TO_NODE[mode];

    if (nodeName && this.index) {
      const camNode = this.index.cameras.get(nodeName) ?? tryGetNode(this.index, nodeName);
      if (camNode) {
        const pos = camNode instanceof THREE.Camera ? camNode.position.clone() : worldPos(camNode);

        const forward = new THREE.Vector3(0, 1, 0);
        forward.applyQuaternion(camNode.quaternion);
        const target = pos.clone().add(forward.multiplyScalar(20));

        let fov = FALLBACK_CAMERAS[mode].fov;
        if (camNode instanceof THREE.PerspectiveCamera) {
          fov = camNode.fov;
        }

        return { mode, position: pos, target, fov, transitionProgress: 1 };
      }
    }

    const fb = FALLBACK_CAMERAS[mode];
    return {
      mode,
      position: new THREE.Vector3(...fb.pos),
      target: new THREE.Vector3(...fb.target),
      fov: fb.fov,
      transitionProgress: 1,
    };
  }

  update(dt: number): void {
    // Handle transitions
    if (this.targetState) {
      const progress = Math.min(this.state.transitionProgress + dt / TRANSITION_DURATION, 1);
      this.state.transitionProgress = progress;
      const t = 1 - Math.pow(1 - progress, 3); // Ease out cubic

      this.state.position.lerpVectors(this.state.position, this.targetState.position, t);
      this.state.target.lerpVectors(this.state.target, this.targetState.target, t);
      this.state.fov = THREE.MathUtils.lerp(this.state.fov, this.targetState.fov, t);

      if (progress >= 1) {
        this.state = { ...this.targetState };
        this.targetState = null;
      }
    }

    // Handle shake decay
    if (this.shakeDecay > 0) {
      this.shakeDecay -= dt * 8;
      if (this.shakeDecay <= 0) {
        this.shakeOffset.set(0, 0, 0);
        this.shakeDecay = 0;
      }
    }

    this.applyState();
  }

  private applyState(): void {
    this.camera.position.copy(this.state.position).add(this.shakeOffset);
    this.camera.lookAt(this.state.target);
    this.camera.fov = this.state.fov;
    this.camera.updateProjectionMatrix();
  }

  shake(intensity: number): void {
    this.shakeOffset.set(
      (Math.random() - 0.5) * intensity,
      (Math.random() - 0.5) * intensity,
      (Math.random() - 0.5) * intensity * 0.5
    );
    this.shakeDecay = 1;
  }
}

// ============================================================================
// Camera Presets for Game Events
// ============================================================================

export const CAMERA_PRESETS = {
  atBat: 'behindBatter' as CameraMode,
  pitchWatch: 'strikeZoneHigh' as CameraMode,
  fieldPlay: 'isometric' as CameraMode,
  homeRun: 'fieldOverview' as CameraMode,
} as const;
