/**
 * MediaPipe Pose Landmarker wrapper — runs in-browser to extract
 * 33 body landmarks per frame from swing video.
 */

import { PoseLandmarker, FilesetResolver, type NormalizedLandmark } from '@mediapipe/tasks-vision';

let landmarker: PoseLandmarker | null = null;

/** Initialize the MediaPipe Pose Landmarker (call once) */
export async function initPoseLandmarker(): Promise<PoseLandmarker> {
  if (landmarker) return landmarker;

  const vision = await FilesetResolver.forVisionTasks(
    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm',
  );

  landmarker = await PoseLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath:
        'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_heavy/float16/latest/pose_landmarker_heavy.task',
      delegate: 'GPU',
    },
    runningMode: 'VIDEO',
    numPoses: 1,
    minPoseDetectionConfidence: 0.5,
    minPosePresenceConfidence: 0.5,
    minTrackingConfidence: 0.5,
  });

  return landmarker;
}

export interface PoseFrame {
  frameIndex: number;
  timestamp: number;
  landmarks: NormalizedLandmark[];
  worldLandmarks: NormalizedLandmark[];
}

export interface ExtractionProgress {
  currentFrame: number;
  totalFrames: number;
  percentage: number;
}

/**
 * Extract pose landmarks from every frame of a video element.
 * Yields progress callbacks as it processes.
 */
export async function extractPosesFromVideo(
  video: HTMLVideoElement,
  onProgress?: (progress: ExtractionProgress) => void,
): Promise<PoseFrame[]> {
  const pose = await initPoseLandmarker();
  const frames: PoseFrame[] = [];

  const fps = 30; // target extraction FPS
  const duration = video.duration;
  const totalFrames = Math.floor(duration * fps);
  const frameInterval = 1 / fps;

  // Create offscreen canvas for frame extraction
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Cannot create canvas context');

  for (let i = 0; i < totalFrames; i++) {
    const timestamp = i * frameInterval;
    video.currentTime = timestamp;

    // Wait for the video to seek to the target frame
    await new Promise<void>((resolve) => {
      const onSeeked = () => {
        video.removeEventListener('seeked', onSeeked);
        resolve();
      };
      video.addEventListener('seeked', onSeeked);
    });

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const result = pose.detectForVideo(video, timestamp * 1000);

    if (result.landmarks.length > 0) {
      frames.push({
        frameIndex: i,
        timestamp: timestamp * 1000,
        landmarks: result.landmarks[0],
        worldLandmarks: result.worldLandmarks?.[0] ?? result.landmarks[0],
      });
    }

    onProgress?.({
      currentFrame: i + 1,
      totalFrames,
      percentage: Math.round(((i + 1) / totalFrames) * 100),
    });
  }

  return frames;
}

/** Clean up the landmarker when done */
export function disposePoseLandmarker(): void {
  if (landmarker) {
    landmarker.close();
    landmarker = null;
  }
}
