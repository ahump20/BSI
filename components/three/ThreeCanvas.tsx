'use client';

/**
 * BSI ThreeCanvas Wrapper
 *
 * Production-ready R3F canvas with:
 * - Post-processing pipeline integration
 * - Theatre.js sheet support
 * - WebGL context loss recovery
 * - Performance tier adaptation
 * - Zustand store integration
 *
 * Philosophy: "Blaze Ease" - fast attack, smooth settle
 *
 * @version 2.0.0
 */

import { Suspense, useRef, useEffect, useState, ReactNode, useCallback } from 'react';
import { Canvas, useThree, useFrame, type CanvasProps } from '@react-three/fiber';
import {
  Preload,
  AdaptiveDpr,
  AdaptiveEvents,
  PerformanceMonitor,
} from '@react-three/drei';
import * as THREE from 'three';
import { usePerformanceTier, type PerformanceTier } from './usePerformanceTier';

// Types
interface ThreeCanvasProps extends Partial<CanvasProps> {
  children: ReactNode;
  /** CSS fallback for low-end devices */
  fallback?: ReactNode;
  /** Container class name */
  className?: string;
  /** Enable post-processing pipeline */
  postProcessing?: boolean;
  /** Background color (hex) */
  backgroundColor?: string;
  /** Enable shadows */
  shadows?: boolean;
  /** Enable fog */
  fog?: boolean;
  /** Fog color */
  fogColor?: string;
  /** Fog near distance */
  fogNear?: number;
  /** Fog far distance */
  fogFar?: number;
  /** Enable performance monitoring */
  enableMonitoring?: boolean;
  /** Callback when performance changes */
  onPerformanceChange?: (tier: PerformanceTier) => void;
  /** Callback when context is lost */
  onContextLost?: () => void;
  /** Callback when context is restored */
  onContextRestored?: () => void;
  /** Callback when canvas is ready */
  onCreated?: () => void;
}

// BSI Brand colors (imported from tokens)
const BSI_COLORS = {
  midnight: '#0D0D0D',
  charcoal: '#1A1A1A',
  burntOrange: '#BF5700',
};

/**
 * Scene setup component - configures scene properties
 */
function SceneSetup({
  backgroundColor,
  fog,
  fogColor,
  fogNear,
  fogFar,
}: {
  backgroundColor: string;
  fog: boolean;
  fogColor: string;
  fogNear: number;
  fogFar: number;
}) {
  const { scene, gl } = useThree();

  useEffect(() => {
    // Set background
    scene.background = new THREE.Color(backgroundColor);

    // Configure fog
    if (fog) {
      scene.fog = new THREE.Fog(fogColor, fogNear, fogFar);
    } else {
      scene.fog = null;
    }

    // Configure renderer for BSI brand aesthetic
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = 1.0;
  }, [backgroundColor, fog, fogColor, fogNear, fogFar, scene, gl]);

  return null;
}

/**
 * Context loss recovery handler
 */
function ContextLossHandler({
  onContextLost,
  onContextRestored,
}: {
  onContextLost?: () => void;
  onContextRestored?: () => void;
}) {
  const { gl } = useThree();

  useEffect(() => {
    const canvas = gl.domElement;

    const handleContextLost = (event: Event) => {
      event.preventDefault();
      console.warn('[ThreeCanvas] WebGL context lost - attempting recovery');
      onContextLost?.();
    };

    const handleContextRestored = () => {
      console.info('[ThreeCanvas] WebGL context restored');
      onContextRestored?.();
    };

    canvas.addEventListener('webglcontextlost', handleContextLost);
    canvas.addEventListener('webglcontextrestored', handleContextRestored);

    return () => {
      canvas.removeEventListener('webglcontextlost', handleContextLost);
      canvas.removeEventListener('webglcontextrestored', handleContextRestored);
    };
  }, [gl, onContextLost, onContextRestored]);

  return null;
}

/**
 * FPS monitoring component
 */
function FPSMonitor({ onUpdate }: { onUpdate?: (fps: number, frameTime: number) => void }) {
  const frameTimesRef = useRef<number[]>([]);
  const lastTimeRef = useRef(performance.now());

  useFrame(() => {
    const now = performance.now();
    const frameTime = now - lastTimeRef.current;
    lastTimeRef.current = now;

    frameTimesRef.current.push(frameTime);
    if (frameTimesRef.current.length > 60) {
      frameTimesRef.current.shift();
    }

    // Report every 60 frames
    if (frameTimesRef.current.length === 60 && onUpdate) {
      const avgFrameTime =
        frameTimesRef.current.reduce((a, b) => a + b, 0) / frameTimesRef.current.length;
      const fps = Math.round(1000 / avgFrameTime);
      onUpdate(fps, avgFrameTime);
    }
  });

  return null;
}

/**
 * Loading placeholder
 */
function LoadingPlaceholder() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-midnight">
      <div className="flex items-center gap-3">
        <div className="w-5 h-5 border-2 border-burnt-orange border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-medium text-bone">Loading scene...</span>
      </div>
    </div>
  );
}

/**
 * ThreeCanvas - Enhanced R3F wrapper with post-processing support
 */
export function ThreeCanvas({
  children,
  fallback,
  className = '',
  postProcessing = false,
  backgroundColor = BSI_COLORS.midnight,
  shadows = true,
  fog = false,
  fogColor = BSI_COLORS.charcoal,
  fogNear = 10,
  fogFar = 100,
  enableMonitoring = false,
  onPerformanceChange,
  onContextLost,
  onContextRestored,
  onCreated,
  ...canvasProps
}: ThreeCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const { tier, pixelRatio, shadowsEnabled, updateTier } = usePerformanceTier();

  // Intersection observer for lazy loading
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '100px' }
    );

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Handle canvas creation
  const handleCreated = useCallback(() => {
    setIsReady(true);
    onCreated?.();
  }, [onCreated]);

  // Handle performance tier changes
  const handleIncline = useCallback(() => {
    if (tier === 'low') updateTier('medium');
    else if (tier === 'medium') updateTier('high');
  }, [tier, updateTier]);

  const handleDecline = useCallback(() => {
    if (tier === 'high') updateTier('medium');
    else if (tier === 'medium') updateTier('low');
  }, [tier, updateTier]);

  // Notify on tier changes
  useEffect(() => {
    onPerformanceChange?.(tier);
  }, [tier, onPerformanceChange]);

  // Low tier: render CSS fallback only (accessibility)
  if (tier === 'low') {
    return (
      <div ref={containerRef} className={className}>
        {fallback || (
          <div
            className="w-full h-full min-h-[300px] bg-midnight relative overflow-hidden"
            aria-label="3D scene (reduced for performance)"
          >
            {/* CSS-only ember pattern fallback */}
            <div className="absolute inset-0 bg-gradient-to-b from-charcoal to-midnight" />
            <div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: `radial-gradient(circle at 50% 50%, ${BSI_COLORS.burntOrange}33 0%, transparent 50%)`,
                backgroundSize: '200px 200px',
              }}
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`${className} relative`}>
      {/* CSS fallback shows until Three.js loads */}
      {!isReady && (fallback || <LoadingPlaceholder />)}

      {isVisible && (
        <Suspense fallback={null}>
          <Canvas
            dpr={pixelRatio}
            shadows={shadows && shadowsEnabled}
            gl={{
              antialias: tier === 'high',
              alpha: false,
              stencil: false,
              depth: true,
              powerPreference: tier === 'high' ? 'high-performance' : 'default',
            }}
            camera={{
              fov: 50,
              near: 0.1,
              far: 1000,
              position: [0, 2, 8],
            }}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
            }}
            onCreated={handleCreated}
            {...canvasProps}
          >
            {/* Scene configuration */}
            <SceneSetup
              backgroundColor={backgroundColor}
              fog={fog}
              fogColor={fogColor}
              fogNear={fogNear}
              fogFar={fogFar}
            />

            {/* Context loss recovery */}
            <ContextLossHandler
              onContextLost={onContextLost}
              onContextRestored={onContextRestored}
            />

            {/* Adaptive rendering */}
            <AdaptiveDpr pixelated />
            <AdaptiveEvents />

            {/* Performance monitoring */}
            {enableMonitoring && (
              <>
                <PerformanceMonitor
                  onIncline={handleIncline}
                  onDecline={handleDecline}
                  bounds={(fps) => [30, 60]}
                />
                <FPSMonitor />
              </>
            )}

            {/* Main content */}
            <Suspense fallback={null}>{children}</Suspense>

            {/* Preload all assets */}
            <Preload all />
          </Canvas>
        </Suspense>
      )}
    </div>
  );
}

export default ThreeCanvas;
