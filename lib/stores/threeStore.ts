/**
 * BSI Three Store - 3D Scene & Graphics State Management
 *
 * Manages WebGL context, camera modes, effects quality, and scene state
 * Integrates with usePerformanceTier for adaptive rendering
 *
 * Philosophy: "Blaze Ease" - fast attack, smooth settle
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { Camera, Vector3 } from 'three';

// Types
export type PerformanceTier = 'LOW' | 'MEDIUM' | 'HIGH' | 'ULTRA';

export type CameraMode =
  | 'orbit' // Damped orbital control
  | 'pan' // Shift+drag panning
  | 'zoom' // Scroll zoom
  | 'auto-rotate' // Pauses on interaction
  | 'focus' // Smooth fly-to target
  | 'cinematic' // Theatre.js track
  | 'locked'; // Fixed position

export type ScenePhase =
  | 'loading'
  | 'intro' // Theatre.js intro sequence
  | 'idle' // Ambient animation loop
  | 'interactive' // User-driven
  | 'transition' // Between scenes
  | 'paused';

export interface EffectsConfig {
  // Core (always enabled)
  antialiasing: 'none' | 'smaa' | 'fxaa';
  vignette: boolean;
  colorGrading: boolean;

  // Enhanced (HIGH/ULTRA)
  bloom: boolean;
  bloomIntensity: number;
  bloomThreshold: number;
  dof: boolean;
  dofFocusDistance: number;
  chromaticAberration: boolean;
  chromaticAberrationOffset: number;
  filmGrain: boolean;
  filmGrainIntensity: number;
}

export interface CameraState {
  mode: CameraMode;
  position: [number, number, number];
  target: [number, number, number];
  fov: number;
  near: number;
  far: number;
  // Constraints
  minDistance: number;
  maxDistance: number;
  minPolarAngle: number;
  maxPolarAngle: number;
  // Animation
  isAnimating: boolean;
  animationDuration: number;
}

export interface SceneConfig {
  id: string;
  name: string;
  backgroundType: 'solid' | 'gradient' | 'environment';
  backgroundColor?: string;
  environmentMap?: string;
  fogEnabled: boolean;
  fogColor?: string;
  fogNear?: number;
  fogFar?: number;
  gridEnabled: boolean;
  gridColor?: string;
}

export interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  drawCalls: number;
  triangles: number;
  geometries: number;
  textures: number;
  programs: number;
  gpuMemory?: number;
}

interface ThreeState {
  // Context
  isContextReady: boolean;
  contextLost: boolean;
  rendererInfo: {
    vendor: string;
    renderer: string;
    webglVersion: number;
  } | null;

  // Performance
  performanceTier: PerformanceTier;
  autoQuality: boolean;
  targetFPS: number;
  metrics: PerformanceMetrics;
  lastMetricsUpdate: string | null;

  // Scene
  activeScene: string;
  scenePhase: ScenePhase;
  sceneConfigs: Map<string, SceneConfig>;

  // Camera
  camera: CameraState;

  // Effects
  effects: EffectsConfig;
  postProcessingEnabled: boolean;

  // Theatre.js
  theatreProjectId: string | null;
  theatreSheetId: string | null;
  theatrePlaybackRate: number;
  isTheatrePlaying: boolean;

  // User preferences
  reducedMotion: boolean;
  preferredQuality: PerformanceTier | 'auto';

  // Actions - Context
  setContextReady: (ready: boolean) => void;
  setContextLost: (lost: boolean) => void;
  setRendererInfo: (info: ThreeState['rendererInfo']) => void;

  // Actions - Performance
  setPerformanceTier: (tier: PerformanceTier) => void;
  setAutoQuality: (auto: boolean) => void;
  updateMetrics: (metrics: Partial<PerformanceMetrics>) => void;
  adjustQualityForPerformance: () => void;

  // Actions - Scene
  setActiveScene: (sceneId: string) => void;
  setScenePhase: (phase: ScenePhase) => void;
  registerScene: (config: SceneConfig) => void;
  unregisterScene: (sceneId: string) => void;
  updateSceneConfig: (sceneId: string, updates: Partial<SceneConfig>) => void;

  // Actions - Camera
  setCameraMode: (mode: CameraMode) => void;
  setCameraPosition: (position: [number, number, number]) => void;
  setCameraTarget: (target: [number, number, number]) => void;
  setCameraFOV: (fov: number) => void;
  resetCamera: () => void;
  flyTo: (
    position: [number, number, number],
    target?: [number, number, number],
    duration?: number
  ) => void;
  shake: (intensity?: number, duration?: number) => void;

  // Actions - Effects
  setEffectsConfig: (config: Partial<EffectsConfig>) => void;
  setPostProcessingEnabled: (enabled: boolean) => void;
  applyEffectsPreset: (preset: 'minimal' | 'balanced' | 'cinematic') => void;

  // Actions - Theatre.js
  setTheatreProject: (projectId: string, sheetId: string) => void;
  setTheatrePlaying: (playing: boolean) => void;
  setTheatrePlaybackRate: (rate: number) => void;

  // Actions - Preferences
  setReducedMotion: (reduced: boolean) => void;
  setPreferredQuality: (quality: PerformanceTier | 'auto') => void;

  // Selectors
  getSceneConfig: (sceneId: string) => SceneConfig | undefined;
  getEffectiveQuality: () => PerformanceTier;
  shouldEnableEffect: (effect: keyof EffectsConfig) => boolean;
}

const defaultCamera: CameraState = {
  mode: 'orbit',
  position: [0, 2, 8],
  target: [0, 0, 0],
  fov: 50,
  near: 0.1,
  far: 1000,
  minDistance: 3,
  maxDistance: 20,
  minPolarAngle: 0.1,
  maxPolarAngle: Math.PI / 2,
  isAnimating: false,
  animationDuration: 1500, // BSI cinematic duration
};

const defaultEffects: EffectsConfig = {
  antialiasing: 'smaa',
  vignette: true,
  colorGrading: true,
  bloom: true,
  bloomIntensity: 0.8,
  bloomThreshold: 0.9,
  dof: false,
  dofFocusDistance: 10,
  chromaticAberration: false,
  chromaticAberrationOffset: 0.002,
  filmGrain: false,
  filmGrainIntensity: 0.1,
};

const defaultMetrics: PerformanceMetrics = {
  fps: 60,
  frameTime: 16.67,
  drawCalls: 0,
  triangles: 0,
  geometries: 0,
  textures: 0,
  programs: 0,
};

// Effects presets based on BSI design spec
const effectsPresets: Record<'minimal' | 'balanced' | 'cinematic', Partial<EffectsConfig>> = {
  minimal: {
    antialiasing: 'fxaa',
    vignette: false,
    colorGrading: false,
    bloom: false,
    dof: false,
    chromaticAberration: false,
    filmGrain: false,
  },
  balanced: {
    antialiasing: 'smaa',
    vignette: true,
    colorGrading: true,
    bloom: true,
    bloomIntensity: 0.6,
    dof: false,
    chromaticAberration: false,
    filmGrain: false,
  },
  cinematic: {
    antialiasing: 'smaa',
    vignette: true,
    colorGrading: true,
    bloom: true,
    bloomIntensity: 1.0,
    bloomThreshold: 0.85,
    dof: true,
    dofFocusDistance: 10,
    chromaticAberration: true,
    chromaticAberrationOffset: 0.003,
    filmGrain: true,
    filmGrainIntensity: 0.08,
  },
};

export const useThreeStore = create<ThreeState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        isContextReady: false,
        contextLost: false,
        rendererInfo: null,
        performanceTier: 'HIGH',
        autoQuality: true,
        targetFPS: 60,
        metrics: defaultMetrics,
        lastMetricsUpdate: null,
        activeScene: 'home-hero',
        scenePhase: 'loading',
        sceneConfigs: new Map(),
        camera: defaultCamera,
        effects: defaultEffects,
        postProcessingEnabled: true,
        theatreProjectId: null,
        theatreSheetId: null,
        theatrePlaybackRate: 1,
        isTheatrePlaying: false,
        reducedMotion: false,
        preferredQuality: 'auto',

        // Context actions
        setContextReady: (isContextReady) => set({ isContextReady }, false, 'setContextReady'),

        setContextLost: (contextLost) => set({ contextLost }, false, 'setContextLost'),

        setRendererInfo: (rendererInfo) => set({ rendererInfo }, false, 'setRendererInfo'),

        // Performance actions
        setPerformanceTier: (performanceTier) => {
          // Auto-adjust effects based on tier
          const effectsForTier: Partial<EffectsConfig> =
            performanceTier === 'LOW'
              ? effectsPresets.minimal
              : performanceTier === 'MEDIUM'
                ? effectsPresets.balanced
                : effectsPresets.cinematic;

          set(
            (state) => ({
              performanceTier,
              effects: state.autoQuality ? { ...state.effects, ...effectsForTier } : state.effects,
            }),
            false,
            'setPerformanceTier'
          );
        },

        setAutoQuality: (autoQuality) => set({ autoQuality }, false, 'setAutoQuality'),

        updateMetrics: (metrics) =>
          set(
            (state) => ({
              metrics: { ...state.metrics, ...metrics },
              lastMetricsUpdate: new Date().toISOString(),
            }),
            false,
            'updateMetrics'
          ),

        adjustQualityForPerformance: () => {
          const { metrics, performanceTier, autoQuality } = get();
          if (!autoQuality) return;

          // Downgrade if FPS drops below threshold
          if (metrics.fps < 30 && performanceTier !== 'LOW') {
            const newTier =
              performanceTier === 'ULTRA' ? 'HIGH' : performanceTier === 'HIGH' ? 'MEDIUM' : 'LOW';
            get().setPerformanceTier(newTier);
          }
          // Upgrade if FPS is consistently high
          else if (metrics.fps >= 58 && performanceTier !== 'ULTRA') {
            const newTier =
              performanceTier === 'LOW'
                ? 'MEDIUM'
                : performanceTier === 'MEDIUM'
                  ? 'HIGH'
                  : 'ULTRA';
            get().setPerformanceTier(newTier);
          }
        },

        // Scene actions
        setActiveScene: (activeScene) =>
          set({ activeScene, scenePhase: 'loading' }, false, 'setActiveScene'),

        setScenePhase: (scenePhase) => set({ scenePhase }, false, 'setScenePhase'),

        registerScene: (config) =>
          set(
            (state) => {
              const newConfigs = new Map(state.sceneConfigs);
              newConfigs.set(config.id, config);
              return { sceneConfigs: newConfigs };
            },
            false,
            'registerScene'
          ),

        unregisterScene: (sceneId) =>
          set(
            (state) => {
              const newConfigs = new Map(state.sceneConfigs);
              newConfigs.delete(sceneId);
              return { sceneConfigs: newConfigs };
            },
            false,
            'unregisterScene'
          ),

        updateSceneConfig: (sceneId, updates) =>
          set(
            (state) => {
              const existing = state.sceneConfigs.get(sceneId);
              if (!existing) return state;

              const newConfigs = new Map(state.sceneConfigs);
              newConfigs.set(sceneId, { ...existing, ...updates });
              return { sceneConfigs: newConfigs };
            },
            false,
            'updateSceneConfig'
          ),

        // Camera actions
        setCameraMode: (mode) =>
          set((state) => ({ camera: { ...state.camera, mode } }), false, 'setCameraMode'),

        setCameraPosition: (position) =>
          set((state) => ({ camera: { ...state.camera, position } }), false, 'setCameraPosition'),

        setCameraTarget: (target) =>
          set((state) => ({ camera: { ...state.camera, target } }), false, 'setCameraTarget'),

        setCameraFOV: (fov) =>
          set((state) => ({ camera: { ...state.camera, fov } }), false, 'setCameraFOV'),

        resetCamera: () => set({ camera: defaultCamera }, false, 'resetCamera'),

        flyTo: (position, target, duration = 1500) =>
          set(
            (state) => ({
              camera: {
                ...state.camera,
                position,
                target: target || state.camera.target,
                isAnimating: true,
                animationDuration: duration,
              },
            }),
            false,
            'flyTo'
          ),

        shake: (intensity = 0.5, duration = 300) => {
          // Trigger shake - actual implementation in component
          set((state) => ({ camera: { ...state.camera, isAnimating: true } }), false, 'shake');
          setTimeout(() => {
            set(
              (state) => ({ camera: { ...state.camera, isAnimating: false } }),
              false,
              'shakeEnd'
            );
          }, duration);
        },

        // Effects actions
        setEffectsConfig: (config) =>
          set((state) => ({ effects: { ...state.effects, ...config } }), false, 'setEffectsConfig'),

        setPostProcessingEnabled: (postProcessingEnabled) =>
          set({ postProcessingEnabled }, false, 'setPostProcessingEnabled'),

        applyEffectsPreset: (preset) =>
          set(
            (state) => ({
              effects: { ...state.effects, ...effectsPresets[preset] },
            }),
            false,
            'applyEffectsPreset'
          ),

        // Theatre.js actions
        setTheatreProject: (projectId, sheetId) =>
          set({ theatreProjectId: projectId, theatreSheetId: sheetId }, false, 'setTheatreProject'),

        setTheatrePlaying: (isTheatrePlaying) =>
          set({ isTheatrePlaying }, false, 'setTheatrePlaying'),

        setTheatrePlaybackRate: (theatrePlaybackRate) =>
          set({ theatrePlaybackRate }, false, 'setTheatrePlaybackRate'),

        // Preferences actions
        setReducedMotion: (reducedMotion) => {
          set({ reducedMotion }, false, 'setReducedMotion');
          if (reducedMotion) {
            get().applyEffectsPreset('minimal');
          }
        },

        setPreferredQuality: (preferredQuality) =>
          set({ preferredQuality }, false, 'setPreferredQuality'),

        // Selectors
        getSceneConfig: (sceneId) => get().sceneConfigs.get(sceneId),

        getEffectiveQuality: () => {
          const { preferredQuality, performanceTier } = get();
          return preferredQuality === 'auto' ? performanceTier : preferredQuality;
        },

        shouldEnableEffect: (effect) => {
          const { effects, performanceTier, reducedMotion } = get();

          // Reduced motion disables most effects
          if (reducedMotion) {
            return effect === 'antialiasing' || effect === 'vignette';
          }

          // Check if effect is enabled in config
          const effectValue = effects[effect];
          if (typeof effectValue === 'boolean' && !effectValue) return false;

          // Tier-based restrictions
          const heavyEffects: (keyof EffectsConfig)[] = [
            'bloom',
            'dof',
            'chromaticAberration',
            'filmGrain',
          ];

          if (heavyEffects.includes(effect)) {
            return performanceTier === 'HIGH' || performanceTier === 'ULTRA';
          }

          return true;
        },
      }),
      {
        name: 'bsi-three-store',
        partialize: (state) => ({
          preferredQuality: state.preferredQuality,
          reducedMotion: state.reducedMotion,
          effects: state.effects,
          camera: {
            fov: state.camera.fov,
            minDistance: state.camera.minDistance,
            maxDistance: state.camera.maxDistance,
          },
        }),
        storage: {
          getItem: (name) => {
            const str = localStorage.getItem(name);
            if (!str) return null;
            const data = JSON.parse(str);
            return {
              ...data,
              state: {
                ...data.state,
                sceneConfigs: new Map(),
              },
            };
          },
          setItem: (name, value) => {
            localStorage.setItem(name, JSON.stringify(value));
          },
          removeItem: (name) => localStorage.removeItem(name),
        },
      }
    ),
    { name: 'ThreeStore' }
  )
);

export default useThreeStore;
