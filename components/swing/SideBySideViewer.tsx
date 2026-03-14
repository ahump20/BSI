'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { SkeletonOverlay } from './SkeletonOverlay';
import type { NormalizedLandmark } from '@mediapipe/tasks-vision';
import type { SwingPhaseResult, SwingPhase } from '@/lib/swing/swing-phases';
import { PHASE_LABELS, PHASE_COLORS } from '@/lib/swing/swing-phases';

interface SideBySideViewerProps {
  videoUrl: string;
  frames: { frameIndex: number; timestamp: number; landmarks: NormalizedLandmark[] }[];
  phases: SwingPhaseResult;
  width?: number;
  /** When set, seeks the viewer to this frame index and pauses playback */
  seekToFrame?: number | null;
}

export function SideBySideViewer({ videoUrl, frames, phases, width = 640, seekToFrame }: SideBySideViewerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoDimensions, setVideoDimensions] = useState({ width: 320, height: 240 });
  const animFrameRef = useRef<number>(0);

  const halfWidth = Math.floor(width / 2);

  const getCurrentPhase = useCallback(
    (frameIdx: number): SwingPhase => {
      const sorted = [...phases.phases].sort((a, b) => a.frameIndex - b.frameIndex);
      for (let i = sorted.length - 1; i >= 0; i--) {
        if (frameIdx >= sorted[i].frameIndex) return sorted[i].phase;
      }
      return 'stance';
    },
    [phases],
  );

  const currentPhase = getCurrentPhase(currentFrame);
  const currentLandmarks = frames[currentFrame]?.landmarks ?? [];

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onLoaded = () => {
      setVideoDimensions({
        width: video.videoWidth,
        height: video.videoHeight,
      });
    };

    video.addEventListener('loadedmetadata', onLoaded);
    return () => video.removeEventListener('loadedmetadata', onLoaded);
  }, [videoUrl]);

  // Sync video playback with frame scrubbing
  useEffect(() => {
    const video = videoRef.current;
    if (!video || frames.length === 0) return;

    const targetTime = (frames[currentFrame]?.timestamp ?? 0) / 1000;
    if (Math.abs(video.currentTime - targetTime) > 0.05) {
      video.currentTime = targetTime;
    }
  }, [currentFrame, frames]);

  // External seek: when AI chat references a frame, jump to it and pause
  useEffect(() => {
    if (seekToFrame == null || frames.length === 0) return;
    const clamped = Math.max(0, Math.min(seekToFrame, frames.length - 1));
    setCurrentFrame(clamped);
    if (isPlaying) {
      setIsPlaying(false);
      cancelAnimationFrame(animFrameRef.current);
    }
  }, [seekToFrame, frames.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      setIsPlaying(false);
      cancelAnimationFrame(animFrameRef.current);
    } else {
      setIsPlaying(true);
      let lastFrame = currentFrame;

      const step = () => {
        lastFrame = (lastFrame + 1) % frames.length;
        setCurrentFrame(lastFrame);
        animFrameRef.current = requestAnimationFrame(step);
      };

      animFrameRef.current = requestAnimationFrame(step);
    }
  }, [isPlaying, currentFrame, frames.length]);

  useEffect(() => {
    return () => cancelAnimationFrame(animFrameRef.current);
  }, []);

  const aspectRatio = videoDimensions.height / videoDimensions.width;
  const panelHeight = Math.round(halfWidth * aspectRatio);

  return (
    <div className="rounded-xl overflow-hidden bg-surface-scoreboard border border-border-subtle">
      {/* Phase indicator strip */}
      <div className="flex items-center gap-2 px-4 py-2 bg-surface-press-box border-b border-border-subtle overflow-x-auto">
        {phases.phases.map((p) => (
          <button
            key={p.phase}
            onClick={() => setCurrentFrame(p.frameIndex)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-mono uppercase tracking-wider transition-all whitespace-nowrap ${
              currentPhase === p.phase
                ? 'text-white'
                : 'text-text-muted hover:text-bsi-dust'
            }`}
            style={currentPhase === p.phase ? { backgroundColor: `${PHASE_COLORS[p.phase]}33`, color: PHASE_COLORS[p.phase] } : undefined}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: PHASE_COLORS[p.phase] }}
            />
            {PHASE_LABELS[p.phase]}
          </button>
        ))}
      </div>

      {/* Side-by-side panels (stacked on mobile) */}
      <div className="flex flex-col sm:flex-row" style={{ minHeight: panelHeight }}>
        {/* Left/Top: Original video */}
        <div className="relative flex-1 bg-black overflow-hidden" style={{ minHeight: Math.round(panelHeight * 0.6) }}>
          <video
            ref={videoRef}
            src={videoUrl}
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-contain"
          />
          <span className="absolute top-2 left-2 text-[9px] font-mono uppercase tracking-wider text-white/50 bg-black/50 px-1.5 py-0.5 rounded">
            Original
          </span>
        </div>

        {/* Divider — horizontal on mobile, vertical on desktop */}
        <div className="h-px sm:h-auto sm:w-px bg-border-subtle" />

        {/* Right/Bottom: Skeleton overlay */}
        <div className="relative flex-1 bg-surface-scoreboard overflow-hidden" style={{ minHeight: Math.round(panelHeight * 0.6) }}>
          {currentLandmarks.length > 0 && (
            <SkeletonOverlay
              landmarks={currentLandmarks}
              width={halfWidth}
              height={panelHeight}
              phase={currentPhase}
            />
          )}
          <span className="absolute top-2 left-2 text-[9px] font-mono uppercase tracking-wider text-white/50 bg-black/50 px-1.5 py-0.5 rounded">
            Skeleton
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="px-4 py-3 bg-surface-press-box border-t border-border-subtle">
        <div className="flex items-center gap-3">
          {/* Play/Pause */}
          <button
            onClick={togglePlay}
            className="w-8 h-8 rounded-lg bg-burnt-orange/15 flex items-center justify-center text-burnt-orange hover:bg-burnt-orange/25 transition-colors"
          >
            {isPlaying ? (
              <svg viewBox="0 0 16 16" className="w-4 h-4" fill="currentColor">
                <rect x="3" y="2" width="4" height="12" rx="1" />
                <rect x="9" y="2" width="4" height="12" rx="1" />
              </svg>
            ) : (
              <svg viewBox="0 0 16 16" className="w-4 h-4" fill="currentColor">
                <path d="M4 2l10 6-10 6z" />
              </svg>
            )}
          </button>

          {/* Frame scrubber */}
          <input
            type="range"
            min={0}
            max={frames.length - 1}
            value={currentFrame}
            onChange={(e) => {
              setCurrentFrame(parseInt(e.target.value));
              if (isPlaying) {
                setIsPlaying(false);
                cancelAnimationFrame(animFrameRef.current);
              }
            }}
            className="flex-1 accent-burnt-orange h-1"
          />

          {/* Frame counter */}
          <span className="text-[10px] font-mono text-text-muted tabular-nums w-20 text-right">
            {currentFrame + 1}/{frames.length}
          </span>
        </div>
      </div>
    </div>
  );
}
