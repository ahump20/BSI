/**
 * BlazeCanvas
 *
 * Main React Three Fiber wrapper for BSI graphics.
 * Provides a drop-in component for adding 3D graphics
 * to any React application with automatic performance
 * optimization and brand styling.
 *
 * @author Austin Humphrey
 * @version 1.0.0
 */

import React, { useRef, useEffect, forwardRef, useImperativeHandle, useState, useMemo } from 'react';
import * as THREE from 'three';

/**
 * Brand colors
 */
const BLAZE_COLORS = {
  burntOrange: 0xBF5700,
  ember: 0xFF6B35,
  gold: 0xC9A227,
  charcoal: 0x1A1A1A,
  midnight: 0x0D0D0D,
  cream: 0xFAF8F5,
};

/**
 * Performance tier for adaptive quality
 */
export type PerformanceTier = 'low' | 'medium' | 'high' | 'ultra';

/**
 * Props for BlazeCanvas
 */
export interface BlazeCanvasProps {
  /** Canvas width (default: 100%) */
  width?: string | number;
  /** Canvas height (default: 100%) */
  height?: string | number;
  /** Background color */
  backgroundColor?: number;
  /** Enable post-processing */
  postProcessing?: boolean;
  /** Enable shadows */
  shadows?: boolean;
  /** Enable anti-aliasing */
  antialias?: boolean;
  /** Force specific performance tier */
  performanceTier?: PerformanceTier;
  /** Enable fog */
  fog?: boolean;
  /** Fog density */
  fogDensity?: number;
  /** Camera position */
  cameraPosition?: [number, number, number];
  /** Camera look-at target */
  cameraTarget?: [number, number, number];
  /** Camera field of view */
  cameraFov?: number;
  /** Enable orbit controls */
  orbitControls?: boolean;
  /** Enable automatic camera animation */
  autoRotate?: boolean;
  /** Auto-rotate speed */
  autoRotateSpeed?: number;
  /** Called when canvas is ready */
  onReady?: (api: BlazeCanvasAPI) => void;
  /** Called each frame */
  onFrame?: (delta: number, api: BlazeCanvasAPI) => void;
  /** Children to render in the scene */
  children?: React.ReactNode;
  /** Additional class name */
  className?: string;
  /** Inline styles */
  style?: React.CSSProperties;
}

/**
 * API exposed by BlazeCanvas
 */
export interface BlazeCanvasAPI {
  /** Three.js scene */
  scene: THREE.Scene;
  /** Three.js camera */
  camera: THREE.PerspectiveCamera;
  /** Three.js renderer */
  renderer: THREE.WebGLRenderer;
  /** Current performance tier */
  tier: PerformanceTier;
  /** Take screenshot */
  screenshot: () => string;
  /** Set camera position */
  setCameraPosition: (x: number, y: number, z: number) => void;
  /** Set camera target */
  setCameraTarget: (x: number, y: number, z: number) => void;
  /** Add object to scene */
  addObject: (object: THREE.Object3D) => void;
  /** Remove object from scene */
  removeObject: (object: THREE.Object3D) => void;
  /** Set background color */
  setBackgroundColor: (color: number) => void;
  /** Set fog */
  setFog: (enabled: boolean, density?: number) => void;
  /** Get render info */
  getInfo: () => THREE.WebGLInfo;
}

/**
 * Detect performance tier based on device
 */
function detectPerformanceTier(): PerformanceTier {
  // Check for mobile
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );

  if (isMobile) {
    const cores = navigator.hardwareConcurrency || 2;
    const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory || 2;
    return cores >= 6 && memory >= 6 ? 'medium' : 'low';
  }

  // Desktop detection
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
 * Get tier-specific settings
 */
function getTierSettings(tier: PerformanceTier) {
  const settings = {
    low: {
      antialias: false,
      shadows: false,
      pixelRatio: 1,
      shadowMapSize: 512,
    },
    medium: {
      antialias: true,
      shadows: true,
      pixelRatio: 1.5,
      shadowMapSize: 1024,
    },
    high: {
      antialias: true,
      shadows: true,
      pixelRatio: 2,
      shadowMapSize: 2048,
    },
    ultra: {
      antialias: true,
      shadows: true,
      pixelRatio: Math.min(window.devicePixelRatio, 2),
      shadowMapSize: 4096,
    },
  };

  return settings[tier];
}

/**
 * BlazeCanvas - React component for BSI 3D graphics
 */
export const BlazeCanvas = forwardRef<BlazeCanvasAPI, BlazeCanvasProps>(
  (props, ref) => {
    const {
      width = '100%',
      height = '100%',
      backgroundColor = BLAZE_COLORS.midnight,
      postProcessing = true,
      shadows = true,
      antialias = true,
      performanceTier,
      fog = true,
      fogDensity = 0.002,
      cameraPosition = [0, 50, 100],
      cameraTarget = [0, 0, 0],
      cameraFov = 60,
      orbitControls = false,
      autoRotate = false,
      autoRotateSpeed = 0.5,
      onReady,
      onFrame,
      children,
      className,
      style,
    } = props;

    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Three.js refs
    const sceneRef = useRef<THREE.Scene | null>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const animationRef = useRef<number | null>(null);
    const clockRef = useRef<THREE.Clock | null>(null);

    // State
    const [isReady, setIsReady] = useState(false);
    const tier = useMemo(
      () => performanceTier || detectPerformanceTier(),
      [performanceTier]
    );

    // API ref
    const apiRef = useRef<BlazeCanvasAPI | null>(null);

    // Initialize Three.js
    useEffect(() => {
      if (!containerRef.current || !canvasRef.current) return;

      const tierSettings = getTierSettings(tier);
      const container = containerRef.current;

      // Create scene
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(backgroundColor);

      if (fog) {
        scene.fog = new THREE.FogExp2(backgroundColor, fogDensity);
      }

      sceneRef.current = scene;

      // Create camera
      const aspect = container.clientWidth / container.clientHeight;
      const camera = new THREE.PerspectiveCamera(cameraFov, aspect, 0.1, 2000);
      camera.position.set(...cameraPosition);
      camera.lookAt(...cameraTarget);
      cameraRef.current = camera;

      // Create renderer
      const renderer = new THREE.WebGLRenderer({
        canvas: canvasRef.current,
        antialias: antialias && tierSettings.antialias,
        alpha: false,
        powerPreference: tier === 'low' ? 'low-power' : 'high-performance',
      });

      renderer.setSize(container.clientWidth, container.clientHeight);
      renderer.setPixelRatio(tierSettings.pixelRatio);

      if (shadows && tierSettings.shadows) {
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      }

      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.0;
      renderer.outputColorSpace = THREE.SRGBColorSpace;

      rendererRef.current = renderer;

      // Clock for delta time
      clockRef.current = new THREE.Clock();

      // Add default lighting
      const ambient = new THREE.AmbientLight(0xffffff, 0.4);
      scene.add(ambient);

      const keyLight = new THREE.DirectionalLight(0xffffff, 1.0);
      keyLight.position.set(50, 100, 50);
      keyLight.castShadow = shadows && tierSettings.shadows;

      if (keyLight.castShadow) {
        keyLight.shadow.mapSize.width = tierSettings.shadowMapSize;
        keyLight.shadow.mapSize.height = tierSettings.shadowMapSize;
        keyLight.shadow.camera.near = 0.5;
        keyLight.shadow.camera.far = 500;
        keyLight.shadow.camera.left = -100;
        keyLight.shadow.camera.right = 100;
        keyLight.shadow.camera.top = 100;
        keyLight.shadow.camera.bottom = -100;
      }

      scene.add(keyLight);

      const rimLight = new THREE.DirectionalLight(BLAZE_COLORS.ember, 0.4);
      rimLight.position.set(0, 30, -80);
      scene.add(rimLight);

      // Create API
      const api: BlazeCanvasAPI = {
        scene,
        camera,
        renderer,
        tier,
        screenshot: () => {
          renderer.render(scene, camera);
          return renderer.domElement.toDataURL('image/png');
        },
        setCameraPosition: (x, y, z) => {
          camera.position.set(x, y, z);
        },
        setCameraTarget: (x, y, z) => {
          camera.lookAt(x, y, z);
        },
        addObject: (object) => {
          scene.add(object);
        },
        removeObject: (object) => {
          scene.remove(object);
        },
        setBackgroundColor: (color) => {
          scene.background = new THREE.Color(color);
          if (scene.fog instanceof THREE.FogExp2) {
            scene.fog.color = new THREE.Color(color);
          }
        },
        setFog: (enabled, density = 0.002) => {
          if (enabled) {
            scene.fog = new THREE.FogExp2(
              (scene.background as THREE.Color).getHex(),
              density
            );
          } else {
            scene.fog = null;
          }
        },
        getInfo: () => renderer.info,
      };

      apiRef.current = api;
      setIsReady(true);

      if (onReady) {
        onReady(api);
      }

      // Animation loop
      let autoRotateAngle = 0;

      const animate = () => {
        animationRef.current = requestAnimationFrame(animate);

        const delta = clockRef.current?.getDelta() || 0;

        // Auto-rotate camera
        if (autoRotate) {
          autoRotateAngle += autoRotateSpeed * delta;
          const radius = Math.sqrt(
            cameraPosition[0] ** 2 + cameraPosition[2] ** 2
          );
          camera.position.x = Math.sin(autoRotateAngle) * radius;
          camera.position.z = Math.cos(autoRotateAngle) * radius;
          camera.lookAt(...cameraTarget);
        }

        // Call frame callback
        if (onFrame) {
          onFrame(delta, api);
        }

        // Render
        renderer.render(scene, camera);
      };

      animate();

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

        // Dispose scene objects
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
      };
    }, [tier]); // Only reinitialize on tier change

    // Update camera when props change
    useEffect(() => {
      if (cameraRef.current) {
        cameraRef.current.position.set(...cameraPosition);
        cameraRef.current.lookAt(...cameraTarget);
        cameraRef.current.fov = cameraFov;
        cameraRef.current.updateProjectionMatrix();
      }
    }, [cameraPosition, cameraTarget, cameraFov]);

    // Update background when prop changes
    useEffect(() => {
      if (sceneRef.current) {
        sceneRef.current.background = new THREE.Color(backgroundColor);
        if (sceneRef.current.fog instanceof THREE.FogExp2) {
          sceneRef.current.fog.color = new THREE.Color(backgroundColor);
        }
      }
    }, [backgroundColor]);

    // Expose API via ref
    useImperativeHandle(ref, () => apiRef.current as BlazeCanvasAPI, [isReady]);

    return (
      <div
        ref={containerRef}
        className={className}
        style={{
          width: typeof width === 'number' ? `${width}px` : width,
          height: typeof height === 'number' ? `${height}px` : height,
          position: 'relative',
          overflow: 'hidden',
          ...style,
        }}
      >
        <canvas
          ref={canvasRef}
          style={{
            display: 'block',
            width: '100%',
            height: '100%',
          }}
        />
        {children}
      </div>
    );
  }
);

BlazeCanvas.displayName = 'BlazeCanvas';

export default BlazeCanvas;
