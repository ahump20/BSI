/**
 * useBlaze3D
 *
 * Custom hook for accessing the BSI graphics engine.
 * Provides easy access to scene, camera, and rendering
 * utilities for building custom 3D visualizations.
 *
 * @author Austin Humphrey
 * @version 1.0.0
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import * as THREE from 'three';

/**
 * Brand colors as Three.js-compatible values
 */
export const BLAZE_THREE_COLORS = {
  burntOrange: 0xBF5700,
  texasSoil: 0x8B4513,
  ember: 0xFF6B35,
  gold: 0xC9A227,
  charcoal: 0x1A1A1A,
  midnight: 0x0D0D0D,
  cream: 0xFAF8F5,
} as const;

/**
 * Performance tier
 */
export type PerformanceTier = 'low' | 'medium' | 'high' | 'ultra';

/**
 * Configuration for useBlaze3D
 */
export interface UseBlaze3DConfig {
  /** Container element or ref */
  container: HTMLElement | null;
  /** Enable post-processing */
  postProcessing?: boolean;
  /** Enable shadows */
  shadows?: boolean;
  /** Initial camera position */
  cameraPosition?: THREE.Vector3;
  /** Background color */
  backgroundColor?: number;
  /** Enable fog */
  fog?: boolean;
  /** Fog density */
  fogDensity?: number;
  /** Force performance tier */
  forceTier?: PerformanceTier;
  /** Called each frame */
  onFrame?: (delta: number) => void;
  /** Called when ready */
  onReady?: () => void;
}

/**
 * Return value from useBlaze3D
 */
export interface UseBlaze3DReturn {
  /** Three.js scene */
  scene: THREE.Scene | null;
  /** Three.js camera */
  camera: THREE.PerspectiveCamera | null;
  /** Three.js renderer */
  renderer: THREE.WebGLRenderer | null;
  /** Whether the engine is ready */
  isReady: boolean;
  /** Current performance tier */
  tier: PerformanceTier;
  /** Current FPS */
  fps: number;
  /** Add object to scene */
  addObject: (object: THREE.Object3D) => void;
  /** Remove object from scene */
  removeObject: (object: THREE.Object3D) => void;
  /** Set camera position */
  setCameraPosition: (position: THREE.Vector3 | [number, number, number]) => void;
  /** Set camera look-at target */
  setCameraTarget: (target: THREE.Vector3 | [number, number, number]) => void;
  /** Take screenshot */
  screenshot: () => string | null;
  /** Start render loop */
  start: () => void;
  /** Stop render loop */
  stop: () => void;
  /** Dispose all resources */
  dispose: () => void;
}

/**
 * Detect performance tier
 */
function detectTier(): PerformanceTier {
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );

  if (isMobile) {
    return 'low';
  }

  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');

  if (gl) {
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (debugInfo) {
      const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
      const highEndGPUs = ['RTX', 'GTX 10', 'GTX 16', 'GTX 20', 'GTX 30', 'GTX 40', 'M1', 'M2', 'M3'];
      if (highEndGPUs.some((gpu) => renderer.includes(gpu))) {
        return 'ultra';
      }
    }
  }

  return 'high';
}

/**
 * useBlaze3D - Hook for BSI 3D graphics
 */
export function useBlaze3D(config: UseBlaze3DConfig): UseBlaze3DReturn {
  const {
    container,
    postProcessing = true,
    shadows = true,
    cameraPosition = new THREE.Vector3(0, 50, 100),
    backgroundColor = BLAZE_THREE_COLORS.midnight,
    fog = true,
    fogDensity = 0.002,
    forceTier,
    onFrame,
    onReady,
  } = config;

  // State
  const [isReady, setIsReady] = useState(false);
  const [fps, setFps] = useState(60);

  // Refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const clockRef = useRef<THREE.Clock | null>(null);
  const animationRef = useRef<number | null>(null);
  const isRunningRef = useRef(false);
  const frameCountRef = useRef(0);
  const lastFpsUpdateRef = useRef(0);

  // Performance tier
  const tier = useMemo(() => forceTier || detectTier(), [forceTier]);

  // Initialize
  useEffect(() => {
    if (!container) return;

    // Create scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(backgroundColor);

    if (fog) {
      scene.fog = new THREE.FogExp2(backgroundColor, fogDensity);
    }

    sceneRef.current = scene;

    // Create camera
    const aspect = container.clientWidth / container.clientHeight;
    const camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 2000);
    camera.position.copy(
      cameraPosition instanceof THREE.Vector3
        ? cameraPosition
        : new THREE.Vector3(...cameraPosition)
    );
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Create renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: tier !== 'low',
      powerPreference: tier === 'low' ? 'low-power' : 'high-performance',
    });

    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, tier === 'ultra' ? 2 : 1.5));

    if (shadows && tier !== 'low') {
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }

    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Create clock
    clockRef.current = new THREE.Clock();

    // Add default lighting
    const ambient = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambient);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.0);
    keyLight.position.set(50, 100, 50);
    keyLight.castShadow = shadows && tier !== 'low';

    if (keyLight.castShadow) {
      keyLight.shadow.mapSize.width = tier === 'ultra' ? 4096 : 2048;
      keyLight.shadow.mapSize.height = tier === 'ultra' ? 4096 : 2048;
      keyLight.shadow.camera.near = 0.5;
      keyLight.shadow.camera.far = 500;
    }

    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(BLAZE_THREE_COLORS.ember, 0.4);
    rimLight.position.set(0, 30, -80);
    scene.add(rimLight);

    setIsReady(true);

    if (onReady) {
      onReady();
    }

    // Handle resize
    const handleResize = () => {
      if (!container || !renderer || !camera) return;

      const width = container.clientWidth;
      const height = container.clientHeight;

      camera.aspect = width / height;
      camera.updateProjectionMatrix();

      renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);

      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }

      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          if (Array.isArray(object.material)) {
            object.material.forEach((mat) => mat.dispose());
          } else {
            object.material.dispose();
          }
        }
      });

      renderer.dispose();
      renderer.forceContextLoss();

      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, [container, tier]);

  // Animation loop
  const animate = useCallback(() => {
    if (!isRunningRef.current) return;

    animationRef.current = requestAnimationFrame(animate);

    const scene = sceneRef.current;
    const camera = cameraRef.current;
    const renderer = rendererRef.current;
    const clock = clockRef.current;

    if (!scene || !camera || !renderer || !clock) return;

    const delta = clock.getDelta();

    // FPS counter
    frameCountRef.current++;
    const now = performance.now();
    if (now - lastFpsUpdateRef.current >= 1000) {
      setFps(frameCountRef.current);
      frameCountRef.current = 0;
      lastFpsUpdateRef.current = now;
    }

    // Call frame callback
    if (onFrame) {
      onFrame(delta);
    }

    // Render
    renderer.render(scene, camera);
  }, [onFrame]);

  // Start render loop
  const start = useCallback(() => {
    if (isRunningRef.current) return;
    isRunningRef.current = true;
    clockRef.current?.start();
    lastFpsUpdateRef.current = performance.now();
    animate();
  }, [animate]);

  // Stop render loop
  const stop = useCallback(() => {
    isRunningRef.current = false;
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
  }, []);

  // Add object to scene
  const addObject = useCallback((object: THREE.Object3D) => {
    sceneRef.current?.add(object);
  }, []);

  // Remove object from scene
  const removeObject = useCallback((object: THREE.Object3D) => {
    sceneRef.current?.remove(object);
  }, []);

  // Set camera position
  const setCameraPosition = useCallback(
    (position: THREE.Vector3 | [number, number, number]) => {
      if (cameraRef.current) {
        if (Array.isArray(position)) {
          cameraRef.current.position.set(...position);
        } else {
          cameraRef.current.position.copy(position);
        }
      }
    },
    []
  );

  // Set camera target
  const setCameraTarget = useCallback(
    (target: THREE.Vector3 | [number, number, number]) => {
      if (cameraRef.current) {
        if (Array.isArray(target)) {
          cameraRef.current.lookAt(...target);
        } else {
          cameraRef.current.lookAt(target);
        }
      }
    },
    []
  );

  // Take screenshot
  const screenshot = useCallback(() => {
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    const renderer = rendererRef.current;

    if (!scene || !camera || !renderer) return null;

    renderer.render(scene, camera);
    return renderer.domElement.toDataURL('image/png');
  }, []);

  // Dispose
  const dispose = useCallback(() => {
    stop();

    const scene = sceneRef.current;
    const renderer = rendererRef.current;

    if (scene) {
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          if (Array.isArray(object.material)) {
            object.material.forEach((mat) => mat.dispose());
          } else {
            object.material.dispose();
          }
        }
      });
    }

    if (renderer) {
      renderer.dispose();
      renderer.forceContextLoss();
    }
  }, [stop]);

  // Auto-start
  useEffect(() => {
    if (isReady) {
      start();
    }
    return () => stop();
  }, [isReady, start, stop]);

  return {
    scene: sceneRef.current,
    camera: cameraRef.current,
    renderer: rendererRef.current,
    isReady,
    tier,
    fps,
    addObject,
    removeObject,
    setCameraPosition,
    setCameraTarget,
    screenshot,
    start,
    stop,
    dispose,
  };
}

export default useBlaze3D;
