/**
 * Blaze Blitz Football - Replay System
 *
 * Records and replays key moments:
 * - Automatic recording during plays
 * - Multiple camera angles
 * - Slow motion playback
 * - Highlight detection
 */

import {
  Scene,
  Vector3,
  Quaternion,
  Camera,
  ArcRotateCamera,
  FollowCamera,
  Animation,
  EasingFunction,
  SineEase,
} from '@babylonjs/core';

/** Recorded frame data */
export interface ReplayFrame {
  timestamp: number;
  ballPosition: Vector3;
  ballRotation: Quaternion;
  playerPositions: Map<string, Vector3>;
  playerRotations: Map<string, number>;
  cameraPosition: Vector3;
  cameraTarget: Vector3;
}

/** Replay camera angle */
export type ReplayAngle = 'broadcast' | 'behind' | 'sideline' | 'endzone' | 'action';

/** Highlight type */
export type HighlightType = 'touchdown' | 'bigPlay' | 'catch' | 'tackle' | 'juke';

/** Recorded highlight */
export interface Highlight {
  type: HighlightType;
  startFrame: number;
  endFrame: number;
  position: Vector3;
  yardsGained?: number;
}

/** Replay configuration */
export interface ReplayConfig {
  maxDurationMs: number;
  frameRate: number;
  autoHighlight: boolean;
}

const DEFAULT_CONFIG: ReplayConfig = {
  maxDurationMs: 15000, // 15 seconds max
  frameRate: 30,
  autoHighlight: true,
};

export class ReplaySystem {
  private scene: Scene;
  private config: ReplayConfig;

  // Recording state
  private isRecording = false;
  private frames: ReplayFrame[] = [];
  private recordStartTime = 0;

  // Playback state
  private isPlaying = false;
  private playbackIndex = 0;
  private playbackSpeed = 1;
  private playbackStartTime = 0;

  // Camera management
  private originalCamera: Camera | null = null;
  private replayCamera: ArcRotateCamera | null = null;
  private currentAngle: ReplayAngle = 'broadcast';

  // Highlights
  private highlights: Highlight[] = [];

  constructor(scene: Scene, config: Partial<ReplayConfig> = {}) {
    this.scene = scene;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // ========================================================================
  // Recording
  // ========================================================================

  /** Start recording */
  public startRecording(): void {
    if (this.isRecording) return;

    this.isRecording = true;
    this.frames = [];
    this.highlights = [];
    this.recordStartTime = performance.now();
  }

  /** Stop recording */
  public stopRecording(): void {
    this.isRecording = false;
  }

  /** Record a frame */
  public recordFrame(
    ballPosition: Vector3,
    ballRotation: Quaternion,
    playerPositions: Map<string, Vector3>,
    playerRotations: Map<string, number>
  ): void {
    if (!this.isRecording) return;

    const now = performance.now();
    const elapsed = now - this.recordStartTime;

    // Check max duration
    if (elapsed > this.config.maxDurationMs) {
      // Remove oldest frames to make room
      const framesToRemove = Math.floor(this.frames.length * 0.2);
      this.frames.splice(0, framesToRemove);
    }

    const frame: ReplayFrame = {
      timestamp: elapsed,
      ballPosition: ballPosition.clone(),
      ballRotation: ballRotation.clone(),
      playerPositions: new Map(
        Array.from(playerPositions.entries()).map(([k, v]) => [k, v.clone()])
      ),
      playerRotations: new Map(playerRotations),
      cameraPosition: this.scene.activeCamera?.position.clone() || Vector3.Zero(),
      cameraTarget: this.getCameraTarget(),
    };

    this.frames.push(frame);
  }

  /** Get camera target position */
  private getCameraTarget(): Vector3 {
    const cam = this.scene.activeCamera;
    if (cam instanceof FollowCamera && cam.lockedTarget) {
      return (cam.lockedTarget as { position: Vector3 }).position?.clone() || Vector3.Zero();
    }
    if (cam instanceof ArcRotateCamera) {
      return cam.target.clone();
    }
    return Vector3.Zero();
  }

  /** Mark a highlight at current frame */
  public markHighlight(type: HighlightType, position: Vector3, yardsGained?: number): void {
    if (!this.isRecording || this.frames.length === 0) return;

    const currentFrame = this.frames.length - 1;

    // Find start frame (2 seconds before or start of recording)
    const msPerFrame = 1000 / this.config.frameRate;
    const framesBack = Math.floor(2000 / msPerFrame);
    const startFrame = Math.max(0, currentFrame - framesBack);

    // Find end frame (1 second after)
    const framesForward = Math.floor(1000 / msPerFrame);
    const endFrame = currentFrame + framesForward;

    this.highlights.push({
      type,
      startFrame,
      endFrame,
      position: position.clone(),
      yardsGained,
    });
  }

  // ========================================================================
  // Playback
  // ========================================================================

  /** Start replay playback */
  public startPlayback(angle: ReplayAngle = 'broadcast', speed: number = 0.5): void {
    if (this.frames.length === 0 || this.isPlaying) return;

    this.isPlaying = true;
    this.playbackSpeed = speed;
    this.playbackIndex = 0;
    this.playbackStartTime = performance.now();
    this.currentAngle = angle;

    // Store original camera
    this.originalCamera = this.scene.activeCamera;

    // Create replay camera
    this.setupReplayCamera(angle);
  }

  /** Stop replay playback */
  public stopPlayback(): void {
    if (!this.isPlaying) return;

    this.isPlaying = false;

    // Restore original camera
    if (this.originalCamera) {
      this.scene.activeCamera = this.originalCamera;
    }

    // Dispose replay camera
    this.replayCamera?.dispose();
    this.replayCamera = null;
  }

  /** Update playback (call in render loop) */
  public updatePlayback(): ReplayFrame | null {
    if (!this.isPlaying || this.frames.length === 0) return null;

    const now = performance.now();
    const playbackElapsed = (now - this.playbackStartTime) * this.playbackSpeed;

    // Find frame at current time
    const frameIndex = this.frames.findIndex((f) => f.timestamp >= playbackElapsed);

    if (frameIndex === -1 || frameIndex >= this.frames.length) {
      // End of replay
      this.stopPlayback();
      return null;
    }

    const frame = this.frames[frameIndex];
    this.playbackIndex = frameIndex;

    // Update replay camera
    this.updateReplayCamera(frame);

    return frame;
  }

  /** Setup replay camera for angle */
  private setupReplayCamera(angle: ReplayAngle): void {
    this.replayCamera = new ArcRotateCamera(
      'replayCamera',
      0,
      Math.PI / 4,
      50,
      Vector3.Zero(),
      this.scene
    );

    switch (angle) {
      case 'broadcast':
        this.replayCamera.alpha = Math.PI / 2;
        this.replayCamera.beta = Math.PI / 4;
        this.replayCamera.radius = 60;
        break;
      case 'behind':
        this.replayCamera.alpha = Math.PI;
        this.replayCamera.beta = Math.PI / 5;
        this.replayCamera.radius = 25;
        break;
      case 'sideline':
        this.replayCamera.alpha = 0;
        this.replayCamera.beta = Math.PI / 3;
        this.replayCamera.radius = 40;
        break;
      case 'endzone':
        this.replayCamera.alpha = Math.PI;
        this.replayCamera.beta = Math.PI / 6;
        this.replayCamera.radius = 35;
        break;
      case 'action':
        // Dynamic - follows action closely
        this.replayCamera.radius = 15;
        break;
    }

    this.scene.activeCamera = this.replayCamera;
  }

  /** Update replay camera for frame */
  private updateReplayCamera(frame: ReplayFrame): void {
    if (!this.replayCamera) return;

    // Follow ball position
    this.replayCamera.target = frame.ballPosition;

    // For action angle, orbit around ball
    if (this.currentAngle === 'action') {
      const t = this.playbackIndex / this.frames.length;
      this.replayCamera.alpha = Math.PI / 2 + Math.sin(t * Math.PI * 2) * 0.5;
      this.replayCamera.beta = Math.PI / 4 + Math.cos(t * Math.PI) * 0.2;
    }
  }

  /** Get playback progress (0-1) */
  public getPlaybackProgress(): number {
    if (!this.isPlaying || this.frames.length === 0) return 0;
    return this.playbackIndex / this.frames.length;
  }

  // ========================================================================
  // Highlights
  // ========================================================================

  /** Play highlight by index */
  public playHighlight(index: number, speed: number = 0.3): void {
    if (index < 0 || index >= this.highlights.length) return;

    const highlight = this.highlights[index];

    // Set frames to highlight range
    const highlightFrames = this.frames.slice(
      highlight.startFrame,
      Math.min(highlight.endFrame, this.frames.length)
    );

    if (highlightFrames.length === 0) return;

    // Store original frames
    const originalFrames = this.frames;
    this.frames = highlightFrames;

    // Start playback
    this.startPlayback('action', speed);

    // Restore frames after playback completes
    const checkEnd = () => {
      if (!this.isPlaying) {
        this.frames = originalFrames;
      } else {
        requestAnimationFrame(checkEnd);
      }
    };
    checkEnd();
  }

  /** Get best highlight */
  public getBestHighlight(): Highlight | null {
    if (this.highlights.length === 0) return null;

    // Priority: touchdown > bigPlay > juke > catch > tackle
    const priority: HighlightType[] = ['touchdown', 'bigPlay', 'juke', 'catch', 'tackle'];

    for (const type of priority) {
      const highlight = this.highlights.find((h) => h.type === type);
      if (highlight) return highlight;
    }

    return this.highlights[0];
  }

  /** Get all highlights */
  public getHighlights(): Highlight[] {
    return [...this.highlights];
  }

  // ========================================================================
  // State
  // ========================================================================

  /** Check if currently recording */
  public isCurrentlyRecording(): boolean {
    return this.isRecording;
  }

  /** Check if currently playing */
  public isCurrentlyPlaying(): boolean {
    return this.isPlaying;
  }

  /** Get frame count */
  public getFrameCount(): number {
    return this.frames.length;
  }

  /** Get recording duration in ms */
  public getRecordingDuration(): number {
    if (this.frames.length === 0) return 0;
    return this.frames[this.frames.length - 1].timestamp;
  }

  /** Clear all recorded data */
  public clear(): void {
    this.stopRecording();
    this.stopPlayback();
    this.frames = [];
    this.highlights = [];
  }

  /** Dispose the replay system */
  public dispose(): void {
    this.clear();
    this.replayCamera?.dispose();
    this.replayCamera = null;
  }
}

/** Quick replay trigger for instant replays */
export function triggerInstantReplay(
  replaySystem: ReplaySystem,
  duration: number = 3000,
  speed: number = 0.5
): void {
  // Only replay last N seconds worth of frames
  const msPerFrame = 1000 / 30;
  const framesToKeep = Math.floor(duration / msPerFrame);

  replaySystem.startPlayback('action', speed);

  // Auto-stop after duration
  setTimeout(() => {
    replaySystem.stopPlayback();
  }, duration / speed);
}
