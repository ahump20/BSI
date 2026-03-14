'use client';

import { useEffect, useRef } from 'react';
import type { NormalizedLandmark } from '@mediapipe/tasks-vision';
import { PHASE_COLORS, type SwingPhase } from '@/lib/swing/swing-phases';

interface SkeletonOverlayProps {
  landmarks: NormalizedLandmark[];
  width: number;
  height: number;
  phase?: SwingPhase;
  showLabels?: boolean;
}

/** MediaPipe Pose landmark connections for drawing the skeleton */
const CONNECTIONS: [number, number][] = [
  // Torso
  [11, 12], [11, 23], [12, 24], [23, 24],
  // Left arm
  [11, 13], [13, 15],
  // Right arm
  [12, 14], [14, 16],
  // Left leg
  [23, 25], [25, 27], [27, 31],
  // Right leg
  [24, 26], [26, 28], [28, 32],
];

/** Joint groups for color coding */
const JOINT_GROUPS: Record<string, number[]> = {
  shoulder: [11, 12],
  arm: [13, 14, 15, 16],
  hip: [23, 24],
  leg: [25, 26, 27, 28, 31, 32],
};

export function SkeletonOverlay({ landmarks, width, height, phase, showLabels }: SkeletonOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !landmarks.length) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = width;
    canvas.height = height;
    ctx.clearRect(0, 0, width, height);

    const phaseColor = phase ? PHASE_COLORS[phase] : '#BF5700';

    // Draw connections
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';

    for (const [a, b] of CONNECTIONS) {
      const la = landmarks[a];
      const lb = landmarks[b];
      if (!la || !lb) continue;
      if ((la.visibility ?? 1) < 0.3 || (lb.visibility ?? 1) < 0.3) continue;

      const ax = la.x * width;
      const ay = la.y * height;
      const bx = lb.x * width;
      const by = lb.y * height;

      // Gradient along each bone
      const gradient = ctx.createLinearGradient(ax, ay, bx, by);
      gradient.addColorStop(0, phaseColor);
      gradient.addColorStop(1, `${phaseColor}CC`);

      ctx.beginPath();
      ctx.strokeStyle = gradient;
      ctx.moveTo(ax, ay);
      ctx.lineTo(bx, by);
      ctx.stroke();
    }

    // Draw joints
    for (let i = 0; i < landmarks.length; i++) {
      const lm = landmarks[i];
      if (!lm || (lm.visibility ?? 1) < 0.3) continue;

      // Skip face landmarks (0-10) for cleaner visualization
      if (i < 11) continue;

      const x = lm.x * width;
      const y = lm.y * height;

      // Determine joint size and color
      const isKeyJoint = JOINT_GROUPS.shoulder.includes(i) || JOINT_GROUPS.hip.includes(i);
      const radius = isKeyJoint ? 5 : 3;

      // Glow effect for key joints
      if (isKeyJoint) {
        ctx.beginPath();
        ctx.arc(x, y, radius + 4, 0, 2 * Math.PI);
        ctx.fillStyle = `${phaseColor}22`;
        ctx.fill();
      }

      // Joint dot
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, 2 * Math.PI);
      ctx.fillStyle = phaseColor;
      ctx.fill();

      // Inner highlight
      ctx.beginPath();
      ctx.arc(x, y, radius * 0.4, 0, 2 * Math.PI);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();
    }

    // Draw hip-shoulder separation line if in power phase
    if (phase === 'power' || phase === 'contact') {
      const hipMidX = ((landmarks[23]?.x ?? 0) + (landmarks[24]?.x ?? 0)) / 2 * width;
      const hipMidY = ((landmarks[23]?.y ?? 0) + (landmarks[24]?.y ?? 0)) / 2 * height;
      const shoulderMidX = ((landmarks[11]?.x ?? 0) + (landmarks[12]?.x ?? 0)) / 2 * width;
      const shoulderMidY = ((landmarks[11]?.y ?? 0) + (landmarks[12]?.y ?? 0)) / 2 * height;

      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = '#F59E0B88';
      ctx.beginPath();
      ctx.moveTo(hipMidX, hipMidY);
      ctx.lineTo(shoulderMidX, shoulderMidY);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }, [landmarks, width, height, phase, showLabels]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{ width, height }}
    />
  );
}
