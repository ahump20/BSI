/**
 * PerformanceHUD - Real-time performance monitoring overlay
 *
 * Displays:
 * - FPS (frames per second)
 * - Frame time (ms per frame)
 * - Memory usage (if available)
 * - Render stats
 *
 * Press F3 to toggle visibility.
 */

import React, { useState, useEffect, useRef } from 'react';

interface PerformanceStats {
  fps: number;
  frameTime: number;
  memory: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
  } | null;
  timestamp: number;
}

interface PerformanceHUDProps {
  visible?: boolean;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  showMemory?: boolean;
}

const styles = {
  container: {
    position: 'fixed' as const,
    padding: '0.5rem 0.75rem',
    background: 'rgba(0, 0, 0, 0.85)',
    borderRadius: '6px',
    border: '1px solid #333',
    fontFamily: 'monospace',
    fontSize: '0.7rem',
    color: '#00FF00',
    zIndex: 9999,
    minWidth: '140px',
    backdropFilter: 'blur(4px)',
    pointerEvents: 'none' as const,
  },
  title: {
    fontSize: '0.6rem',
    color: '#888',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.1em',
    marginBottom: '0.4rem',
    borderBottom: '1px solid #333',
    paddingBottom: '0.3rem',
  },
  row: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '0.2rem',
  },
  label: {
    color: '#888',
  },
  value: {
    fontWeight: 600,
  },
  good: {
    color: '#00FF00',
  },
  warning: {
    color: '#FFD700',
  },
  bad: {
    color: '#FF4444',
  },
};

const positions = {
  'top-left': { top: '60px', left: '8px' },
  'top-right': { top: '60px', right: '8px' },
  'bottom-left': { bottom: '130px', left: '8px' },
  'bottom-right': { bottom: '130px', right: '8px' },
};

export function PerformanceHUD({
  visible = true,
  position = 'top-left',
  showMemory = true,
}: PerformanceHUDProps): React.ReactElement | null {
  const [stats, setStats] = useState<PerformanceStats>({
    fps: 0,
    frameTime: 0,
    memory: null,
    timestamp: performance.now(),
  });

  const frameTimesRef = useRef<number[]>([]);
  const lastFrameRef = useRef<number>(performance.now());
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!visible) return;

    let frameCount = 0;
    let lastSecond = performance.now();

    const measure = () => {
      const now = performance.now();
      const delta = now - lastFrameRef.current;
      lastFrameRef.current = now;

      // Track frame times (keep last 60)
      frameTimesRef.current.push(delta);
      if (frameTimesRef.current.length > 60) {
        frameTimesRef.current.shift();
      }

      frameCount++;

      // Update stats every second
      if (now - lastSecond >= 1000) {
        const avgFrameTime =
          frameTimesRef.current.reduce((a, b) => a + b, 0) /
          frameTimesRef.current.length;

        // Get memory if available
        let memory = null;
        if (showMemory && (performance as any).memory) {
          const mem = (performance as any).memory;
          memory = {
            usedJSHeapSize: mem.usedJSHeapSize,
            totalJSHeapSize: mem.totalJSHeapSize,
          };
        }

        setStats({
          fps: frameCount,
          frameTime: avgFrameTime,
          memory,
          timestamp: now,
        });

        frameCount = 0;
        lastSecond = now;
      }

      rafRef.current = requestAnimationFrame(measure);
    };

    rafRef.current = requestAnimationFrame(measure);

    return () => {
      cancelAnimationFrame(rafRef.current);
    };
  }, [visible, showMemory]);

  if (!visible) return null;

  const getFPSColor = (fps: number) => {
    if (fps >= 55) return styles.good;
    if (fps >= 30) return styles.warning;
    return styles.bad;
  };

  const formatMemory = (bytes: number): string => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  return (
    <div style={{ ...styles.container, ...positions[position] }}>
      <div style={styles.title}>Performance</div>

      <div style={styles.row}>
        <span style={styles.label}>FPS</span>
        <span style={{ ...styles.value, ...getFPSColor(stats.fps) }}>
          {stats.fps}
        </span>
      </div>

      <div style={styles.row}>
        <span style={styles.label}>Frame</span>
        <span style={styles.value}>
          {stats.frameTime.toFixed(1)}ms
        </span>
      </div>

      {stats.memory && (
        <>
          <div style={styles.row}>
            <span style={styles.label}>Heap</span>
            <span style={styles.value}>
              {formatMemory(stats.memory.usedJSHeapSize)}
            </span>
          </div>
          <div style={styles.row}>
            <span style={styles.label}>Total</span>
            <span style={styles.value}>
              {formatMemory(stats.memory.totalJSHeapSize)}
            </span>
          </div>
        </>
      )}
    </div>
  );
}
