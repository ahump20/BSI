'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

interface CameraPreset {
  id: string;
  label: string;
}

interface BackyardFieldViewerProps {
  glbUrl?: string;
  initialCameraName?: string;
  cameraPresets?: CameraPreset[];
  backgroundColor?: string;
  showControls?: boolean;
  onAnchorsReady?: (anchors: Map<string, THREE.Object3D>) => void;
  onCamerasReady?: (cameras: Map<string, THREE.Camera>) => void;
}

const DEFAULT_CAMERA_PRESETS: CameraPreset[] = [
  { id: 'SYB_Cam_BehindBatter', label: 'Behind Batter' },
  { id: 'SYB_Cam_StrikeZoneHigh', label: 'Strike Zone High' },
  { id: 'SYB_Cam_Isometric', label: 'Isometric' },
];

const DEFAULT_GLTF_URL = '/assets/syb/SYB_BackyardField.glb';

export function BackyardFieldViewer({
  glbUrl = DEFAULT_GLTF_URL,
  initialCameraName,
  cameraPresets = DEFAULT_CAMERA_PRESETS,
  backgroundColor = '#0b0f16',
  showControls = true,
  onAnchorsReady,
  onCamerasReady,
}: BackyardFieldViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const animationRef = useRef<number | null>(null);
  const activeCameraRef = useRef<THREE.Camera | null>(null);
  const camerasRef = useRef<Map<string, THREE.Camera>>(new Map());
  const anchorsRef = useRef<Map<string, THREE.Object3D>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const initialCameraSelection = initialCameraName ?? cameraPresets[0]?.id ?? null;
  const [activeCameraName, setActiveCameraName] = useState<string | null>(
    initialCameraSelection
  );

  const setCameraByName = useCallback(
    (name: string) => {
      const camera = camerasRef.current.get(name);
      if (!camera) return false;
      const container = containerRef.current;
      if (camera instanceof THREE.PerspectiveCamera && container) {
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
      }
      activeCameraRef.current = camera;
      setActiveCameraName(name);
      return true;
    },
    [setActiveCameraName]
  );

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    rendererRef.current = renderer;
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(backgroundColor);
    sceneRef.current = scene;

    const fallbackCamera = new THREE.PerspectiveCamera(45, 1, 0.1, 5000);
    fallbackCamera.position.set(0, -10, 3);
    fallbackCamera.lookAt(0, 0, 1.2);
    activeCameraRef.current = fallbackCamera;

    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    const directional = new THREE.DirectionalLight(0xffffff, 1.0);
    directional.position.set(10, -20, 25);
    scene.add(ambient, directional);

    const loader = new GLTFLoader();
    loader.load(
      glbUrl,
      (gltf) => {
        scene.add(gltf.scene);
        camerasRef.current.clear();
        anchorsRef.current.clear();

        gltf.scene.traverse((obj) => {
          if ((obj as THREE.Camera).isCamera) {
            camerasRef.current.set(obj.name, obj as THREE.Camera);
          }
          if (obj.name.startsWith('SYB_Anchor_')) {
            anchorsRef.current.set(obj.name, obj);
          }
        });

        onAnchorsReady?.(anchorsRef.current);
        onCamerasReady?.(camerasRef.current);

        const desiredCamera =
          camerasRef.current.get(initialCameraSelection ?? '') ||
          cameraPresets.find((preset) => camerasRef.current.has(preset.id))?.id ||
          null;

        if (desiredCamera) {
          setCameraByName(desiredCamera);
        }

        setLoading(false);
      },
      undefined,
      (loadError) => {
        setError(loadError.message || 'Failed to load GLB.');
        setLoading(false);
      }
    );

    const resize = () => {
      if (!rendererRef.current || !containerRef.current || !activeCameraRef.current) return;
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      rendererRef.current.setSize(width, height);
      const camera = activeCameraRef.current;
      if (camera instanceof THREE.PerspectiveCamera) {
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
      }
    };

    const animate = () => {
      animationRef.current = requestAnimationFrame(animate);
      if (!rendererRef.current || !sceneRef.current || !activeCameraRef.current) return;
      rendererRef.current.render(sceneRef.current, activeCameraRef.current);
    };

    window.addEventListener('resize', resize);
    resize();
    animate();

    return () => {
      window.removeEventListener('resize', resize);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      renderer.dispose();
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          if (Array.isArray(obj.material)) {
            obj.material.forEach((material) => material.dispose());
          } else {
            obj.material.dispose();
          }
        }
      });
      container.removeChild(renderer.domElement);
    };
  }, [
    backgroundColor,
    cameraPresets,
    glbUrl,
    initialCameraName,
    initialCameraSelection,
    onAnchorsReady,
    onCamerasReady,
    setCameraByName,
  ]);

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="absolute inset-0" />
      {showControls && (
        <div className="absolute left-4 top-4 z-10 space-y-3 rounded-2xl border border-white/10 bg-black/40 p-4 text-xs text-white shadow-lg backdrop-blur">
          <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-burnt-orange">
            Camera Presets
          </div>
          <div className="flex flex-wrap gap-2">
            {cameraPresets.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => setCameraByName(preset.id)}
                className={`rounded-full border px-3 py-1 text-[11px] font-semibold transition ${
                  activeCameraName === preset.id
                    ? 'border-burnt-orange bg-burnt-orange/20 text-white'
                    : 'border-white/20 text-white/70 hover:border-white/50 hover:text-white'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
          <div className="text-[11px] text-white/60">
            Active: {activeCameraName ?? 'Fallback'}
          </div>
        </div>
      )}
      {(loading || error) && (
        <div className="absolute inset-x-4 bottom-4 z-10 rounded-xl border border-white/10 bg-black/50 p-4 text-sm text-white/80 shadow-lg backdrop-blur">
          {loading && <p>Loading GLB from {glbUrl}…</p>}
          {error && <p className="text-red-200">{error}</p>}
        </div>
      )}
      <div className="pointer-events-none absolute inset-0 border border-white/5" />
    </div>
  );
}
