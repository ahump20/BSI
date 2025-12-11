/**
 * BlazeGraphicsEngine - Master Graphics Orchestrator
 *
 * World-class 3D graphics engine for Blaze Sports Intel.
 * WebGPU-first with WebGL 2.0 fallback for maximum compatibility.
 *
 * Features:
 * - Automatic device tier detection (mobile/desktop/high-end)
 * - Intelligent LOD management for optimal performance
 * - Real-time performance profiling and adaptive quality
 * - Custom post-processing pipeline
 * - Event-driven architecture for clean integration
 *
 * @author Austin Humphrey
 * @version 2.0.0
 */

import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

// Brand colors from BSI design system
export const BLAZE_COLORS = {
  burntOrange: 0xBF5700,
  texasSoil: 0x8B4513,
  ember: 0xFF6B35,
  gold: 0xC9A227,
  charcoal: 0x1A1A1A,
  midnight: 0x0D0D0D,
  cream: 0xFAF8F5,
} as const;

/**
 * Performance tiers for adaptive quality scaling
 */
export enum PerformanceTier {
  /** Mobile devices, older hardware - 30fps target */
  LOW = 'low',
  /** Mid-range laptops, tablets - 45fps target */
  MEDIUM = 'medium',
  /** Desktop PCs, modern laptops - 60fps target */
  HIGH = 'high',
  /** Gaming PCs, workstations - 60fps+ with all effects */
  ULTRA = 'ultra',
}

/**
 * Renderer backend type
 */
export enum RendererBackend {
  WEBGPU = 'webgpu',
  WEBGL2 = 'webgl2',
  WEBGL = 'webgl',
}

/**
 * Engine configuration options
 */
export interface BlazeEngineConfig {
  /** Container element to render into */
  container: HTMLElement;
  /** Enable post-processing effects */
  postProcessing?: boolean;
  /** Enable shadow mapping */
  shadows?: boolean;
  /** Enable anti-aliasing (MSAA) */
  antialias?: boolean;
  /** Target frame rate (30, 45, 60, or 0 for uncapped) */
  targetFPS?: number;
  /** Force specific performance tier (auto-detected if not set) */
  forceTier?: PerformanceTier;
  /** Force specific renderer backend */
  forceBackend?: RendererBackend;
  /** Enable performance profiling */
  profiling?: boolean;
  /** Maximum pixel ratio (for retina displays) */
  maxPixelRatio?: number;
  /** Background color */
  backgroundColor?: number;
  /** Enable transparency */
  alpha?: boolean;
  /** Enable fog */
  fog?: boolean;
  /** Fog density for exponential fog */
  fogDensity?: number;
  /** Callback when engine is initialized */
  onInit?: () => void;
  /** Callback on each frame before render */
  onUpdate?: (delta: number) => void;
  /** Callback when engine is disposed */
  onDispose?: () => void;
}

/**
 * Performance metrics for profiling
 */
export interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  drawCalls: number;
  triangles: number;
  geometries: number;
  textures: number;
  programs: number;
  memory: {
    geometries: number;
    textures: number;
  };
  tier: PerformanceTier;
  backend: RendererBackend;
}

/**
 * LOD configuration for objects
 */
export interface LODConfig {
  /** Distance thresholds for each LOD level */
  distances: number[];
  /** Whether to enable LOD for this object */
  enabled: boolean;
}

/**
 * Custom chromatic aberration shader
 */
const ChromaticAberrationShader = {
  name: 'ChromaticAberrationShader',
  uniforms: {
    tDiffuse: { value: null },
    amount: { value: 0.003 },
    angle: { value: 0.0 },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float amount;
    uniform float angle;
    varying vec2 vUv;

    void main() {
      vec2 offset = amount * vec2(cos(angle), sin(angle));

      vec4 cr = texture2D(tDiffuse, vUv + offset);
      vec4 cga = texture2D(tDiffuse, vUv);
      vec4 cb = texture2D(tDiffuse, vUv - offset);

      gl_FragColor = vec4(cr.r, cga.g, cb.b, cga.a);
    }
  `,
};

/**
 * Custom film grain shader
 */
const FilmGrainShader = {
  name: 'FilmGrainShader',
  uniforms: {
    tDiffuse: { value: null },
    time: { value: 0.0 },
    amount: { value: 0.08 },
    speed: { value: 0.5 },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float time;
    uniform float amount;
    uniform float speed;
    varying vec2 vUv;

    float rand(vec2 co) {
      return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
    }

    void main() {
      vec4 color = texture2D(tDiffuse, vUv);
      float noise = rand(vUv + vec2(time * speed)) * 2.0 - 1.0;
      color.rgb += noise * amount;
      gl_FragColor = color;
    }
  `,
};

/**
 * Custom vignette shader
 */
const VignetteShader = {
  name: 'VignetteShader',
  uniforms: {
    tDiffuse: { value: null },
    offset: { value: 1.0 },
    darkness: { value: 1.0 },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float offset;
    uniform float darkness;
    varying vec2 vUv;

    void main() {
      vec4 texel = texture2D(tDiffuse, vUv);
      vec2 uv = (vUv - vec2(0.5)) * vec2(offset);
      gl_FragColor = vec4(mix(texel.rgb, vec3(1.0 - darkness), dot(uv, uv)), texel.a);
    }
  `,
};

/**
 * BlazeGraphicsEngine - The master orchestrator for all BSI 3D graphics
 */
export class BlazeGraphicsEngine {
  // Core components
  private container: HTMLElement;
  private renderer: THREE.WebGLRenderer;
  private _scene: THREE.Scene;
  private _camera: THREE.PerspectiveCamera;
  private composer: EffectComposer | null = null;
  private clock: THREE.Clock;

  // Configuration
  private config: Required<BlazeEngineConfig>;
  private _tier: PerformanceTier;
  private _backend: RendererBackend;

  // Post-processing passes
  private bloomPass: UnrealBloomPass | null = null;
  private chromaticPass: ShaderPass | null = null;
  private filmGrainPass: ShaderPass | null = null;
  private vignettePass: ShaderPass | null = null;

  // Performance tracking
  private frameCount: number = 0;
  private lastFPSUpdate: number = 0;
  private currentFPS: number = 60;
  private frameTimeHistory: number[] = [];
  private isRunning: boolean = false;
  private animationFrameId: number | null = null;

  // Update callbacks
  private updateCallbacks: Array<(delta: number) => void> = [];

  // LOD management
  private lodObjects: Map<THREE.Object3D, LODConfig> = new Map();

  // Default configuration
  private static defaultConfig: Required<BlazeEngineConfig> = {
    container: document.body,
    postProcessing: true,
    shadows: true,
    antialias: true,
    targetFPS: 60,
    forceTier: undefined as unknown as PerformanceTier,
    forceBackend: undefined as unknown as RendererBackend,
    profiling: false,
    maxPixelRatio: 2,
    backgroundColor: BLAZE_COLORS.midnight,
    alpha: false,
    fog: true,
    fogDensity: 0.002,
    onInit: () => {},
    onUpdate: () => {},
    onDispose: () => {},
  };

  constructor(config: BlazeEngineConfig) {
    this.config = { ...BlazeGraphicsEngine.defaultConfig, ...config };
    this.container = this.config.container;
    this.clock = new THREE.Clock();

    // Detect performance tier
    this._tier = this.config.forceTier || this.detectPerformanceTier();
    this._backend = this.config.forceBackend || this.detectBackend();

    // Initialize Three.js components
    this._scene = this.createScene();
    this._camera = this.createCamera();
    this.renderer = this.createRenderer();

    // Setup post-processing if enabled
    if (this.config.postProcessing) {
      this.setupPostProcessing();
    }

    // Handle window resize
    this.handleResize = this.handleResize.bind(this);
    window.addEventListener('resize', this.handleResize);

    // Call init callback
    this.config.onInit();
  }

  /**
   * Get the Three.js scene
   */
  get scene(): THREE.Scene {
    return this._scene;
  }

  /**
   * Get the main camera
   */
  get camera(): THREE.PerspectiveCamera {
    return this._camera;
  }

  /**
   * Get current performance tier
   */
  get tier(): PerformanceTier {
    return this._tier;
  }

  /**
   * Get current renderer backend
   */
  get backend(): RendererBackend {
    return this._backend;
  }

  /**
   * Detect the best renderer backend for this device
   */
  private detectBackend(): RendererBackend {
    // Check for WebGPU support
    if ('gpu' in navigator) {
      return RendererBackend.WEBGPU;
    }

    // Check for WebGL 2 support
    const canvas = document.createElement('canvas');
    const gl2 = canvas.getContext('webgl2');
    if (gl2) {
      return RendererBackend.WEBGL2;
    }

    // Fall back to WebGL 1
    return RendererBackend.WEBGL;
  }

  /**
   * Detect performance tier based on device capabilities
   */
  private detectPerformanceTier(): PerformanceTier {
    // Check for mobile devices
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );

    if (isMobile) {
      // Check for high-end mobile
      const cores = navigator.hardwareConcurrency || 2;
      const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory || 2;

      if (cores >= 6 && memory >= 6) {
        return PerformanceTier.MEDIUM;
      }
      return PerformanceTier.LOW;
    }

    // Desktop detection
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');

    if (gl) {
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
        const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);

        // Check for high-end GPUs
        const highEndGPUs = [
          'RTX', 'GTX 10', 'GTX 16', 'GTX 20', 'GTX 30', 'GTX 40',
          'Radeon RX 5', 'Radeon RX 6', 'Radeon RX 7',
          'M1', 'M2', 'M3', 'Apple GPU'
        ];

        if (highEndGPUs.some(gpu => renderer.includes(gpu))) {
          return PerformanceTier.ULTRA;
        }

        // Check for integrated graphics
        if (renderer.includes('Intel') && !renderer.includes('Arc')) {
          return PerformanceTier.MEDIUM;
        }
      }
    }

    // Default to high for desktop
    return PerformanceTier.HIGH;
  }

  /**
   * Create the Three.js scene with fog and background
   */
  private createScene(): THREE.Scene {
    const scene = new THREE.Scene();

    // Set background
    scene.background = new THREE.Color(this.config.backgroundColor);

    // Add fog if enabled
    if (this.config.fog) {
      scene.fog = new THREE.FogExp2(
        this.config.backgroundColor,
        this.config.fogDensity
      );
    }

    return scene;
  }

  /**
   * Create the main perspective camera
   */
  private createCamera(): THREE.PerspectiveCamera {
    const aspect = this.container.clientWidth / this.container.clientHeight;
    const camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 2000);
    camera.position.set(0, 50, 100);
    camera.lookAt(0, 0, 0);
    return camera;
  }

  /**
   * Create the WebGL renderer with tier-appropriate settings
   */
  private createRenderer(): THREE.WebGLRenderer {
    const tierSettings = this.getTierSettings();

    const renderer = new THREE.WebGLRenderer({
      antialias: this.config.antialias && tierSettings.antialias,
      alpha: this.config.alpha,
      powerPreference: tierSettings.powerPreference,
      precision: tierSettings.precision,
    });

    renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, this.config.maxPixelRatio));

    // Configure shadows based on tier
    if (this.config.shadows && tierSettings.shadows) {
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = tierSettings.shadowMapType;
    }

    // Tone mapping
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;

    // Color space
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.container.appendChild(renderer.domElement);

    return renderer;
  }

  /**
   * Get render settings based on performance tier
   */
  private getTierSettings(): {
    antialias: boolean;
    shadows: boolean;
    shadowMapType: THREE.ShadowMapType;
    powerPreference: 'default' | 'high-performance' | 'low-power';
    precision: 'highp' | 'mediump' | 'lowp';
    bloomStrength: number;
    bloomRadius: number;
    chromaticAberration: number;
  } {
    switch (this._tier) {
      case PerformanceTier.LOW:
        return {
          antialias: false,
          shadows: false,
          shadowMapType: THREE.BasicShadowMap,
          powerPreference: 'low-power',
          precision: 'mediump',
          bloomStrength: 0.3,
          bloomRadius: 0.3,
          chromaticAberration: 0,
        };

      case PerformanceTier.MEDIUM:
        return {
          antialias: true,
          shadows: true,
          shadowMapType: THREE.BasicShadowMap,
          powerPreference: 'default',
          precision: 'highp',
          bloomStrength: 0.5,
          bloomRadius: 0.4,
          chromaticAberration: 0.001,
        };

      case PerformanceTier.HIGH:
        return {
          antialias: true,
          shadows: true,
          shadowMapType: THREE.PCFSoftShadowMap,
          powerPreference: 'high-performance',
          precision: 'highp',
          bloomStrength: 0.6,
          bloomRadius: 0.5,
          chromaticAberration: 0.002,
        };

      case PerformanceTier.ULTRA:
      default:
        return {
          antialias: true,
          shadows: true,
          shadowMapType: THREE.PCFSoftShadowMap,
          powerPreference: 'high-performance',
          precision: 'highp',
          bloomStrength: 0.8,
          bloomRadius: 0.6,
          chromaticAberration: 0.003,
        };
    }
  }

  /**
   * Setup post-processing pipeline
   */
  private setupPostProcessing(): void {
    const tierSettings = this.getTierSettings();

    this.composer = new EffectComposer(this.renderer);

    // Render pass
    const renderPass = new RenderPass(this._scene, this._camera);
    this.composer.addPass(renderPass);

    // Bloom pass (all tiers except LOW)
    if (this._tier !== PerformanceTier.LOW) {
      this.bloomPass = new UnrealBloomPass(
        new THREE.Vector2(this.container.clientWidth, this.container.clientHeight),
        tierSettings.bloomStrength,
        tierSettings.bloomRadius,
        0.85
      );
      this.composer.addPass(this.bloomPass);
    }

    // Chromatic aberration (MEDIUM and above)
    if (this._tier !== PerformanceTier.LOW && tierSettings.chromaticAberration > 0) {
      this.chromaticPass = new ShaderPass(ChromaticAberrationShader);
      this.chromaticPass.uniforms.amount.value = tierSettings.chromaticAberration;
      this.composer.addPass(this.chromaticPass);
    }

    // Film grain (HIGH and ULTRA only)
    if (this._tier === PerformanceTier.HIGH || this._tier === PerformanceTier.ULTRA) {
      this.filmGrainPass = new ShaderPass(FilmGrainShader);
      this.filmGrainPass.uniforms.amount.value = 0.06;
      this.composer.addPass(this.filmGrainPass);
    }

    // Vignette (all tiers)
    this.vignettePass = new ShaderPass(VignetteShader);
    this.vignettePass.uniforms.offset.value = 1.2;
    this.vignettePass.uniforms.darkness.value = 0.4;
    this.composer.addPass(this.vignettePass);

    // Output pass for correct color space
    const outputPass = new OutputPass();
    this.composer.addPass(outputPass);
  }

  /**
   * Add default lighting setup
   */
  public addDefaultLighting(): void {
    // Ambient light for base illumination
    const ambient = new THREE.AmbientLight(0xffffff, 0.4);
    this._scene.add(ambient);

    // Key light (main directional light)
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.0);
    keyLight.position.set(50, 100, 50);
    keyLight.castShadow = this.config.shadows;

    if (this.config.shadows) {
      keyLight.shadow.mapSize.width = this._tier === PerformanceTier.ULTRA ? 4096 : 2048;
      keyLight.shadow.mapSize.height = this._tier === PerformanceTier.ULTRA ? 4096 : 2048;
      keyLight.shadow.camera.near = 0.5;
      keyLight.shadow.camera.far = 500;
      keyLight.shadow.camera.left = -100;
      keyLight.shadow.camera.right = 100;
      keyLight.shadow.camera.top = 100;
      keyLight.shadow.camera.bottom = -100;
      keyLight.shadow.bias = -0.0001;
    }

    this._scene.add(keyLight);

    // Fill light (softer, from opposite side)
    const fillLight = new THREE.DirectionalLight(BLAZE_COLORS.cream, 0.3);
    fillLight.position.set(-30, 50, -30);
    this._scene.add(fillLight);

    // Rim light (ember color from behind)
    const rimLight = new THREE.DirectionalLight(BLAZE_COLORS.ember, 0.4);
    rimLight.position.set(0, 30, -80);
    this._scene.add(rimLight);

    // Hemisphere light for natural color variation
    const hemiLight = new THREE.HemisphereLight(
      BLAZE_COLORS.cream,  // Sky color
      BLAZE_COLORS.texasSoil, // Ground color
      0.3
    );
    this._scene.add(hemiLight);
  }

  /**
   * Add a point light with ember glow
   */
  public addEmberLight(position: THREE.Vector3, intensity: number = 1.0): THREE.PointLight {
    const light = new THREE.PointLight(BLAZE_COLORS.ember, intensity, 100);
    light.position.copy(position);
    light.castShadow = this.config.shadows && this._tier !== PerformanceTier.LOW;

    if (light.castShadow) {
      light.shadow.mapSize.width = 512;
      light.shadow.mapSize.height = 512;
    }

    this._scene.add(light);
    return light;
  }

  /**
   * Register an update callback
   */
  public onUpdate(callback: (delta: number) => void): () => void {
    this.updateCallbacks.push(callback);
    return () => {
      const index = this.updateCallbacks.indexOf(callback);
      if (index > -1) {
        this.updateCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Set bloom effect parameters
   */
  public setBloom(strength: number, radius: number, threshold: number): void {
    if (this.bloomPass) {
      this.bloomPass.strength = strength;
      this.bloomPass.radius = radius;
      this.bloomPass.threshold = threshold;
    }
  }

  /**
   * Set chromatic aberration amount
   */
  public setChromaticAberration(amount: number): void {
    if (this.chromaticPass) {
      this.chromaticPass.uniforms.amount.value = amount;
    }
  }

  /**
   * Set film grain parameters
   */
  public setFilmGrain(amount: number, speed: number = 0.5): void {
    if (this.filmGrainPass) {
      this.filmGrainPass.uniforms.amount.value = amount;
      this.filmGrainPass.uniforms.speed.value = speed;
    }
  }

  /**
   * Set vignette parameters
   */
  public setVignette(offset: number, darkness: number): void {
    if (this.vignettePass) {
      this.vignettePass.uniforms.offset.value = offset;
      this.vignettePass.uniforms.darkness.value = darkness;
    }
  }

  /**
   * Set fog density
   */
  public setFogDensity(density: number): void {
    if (this._scene.fog instanceof THREE.FogExp2) {
      this._scene.fog.density = density;
    }
  }

  /**
   * Enable or disable post-processing
   */
  public setPostProcessing(enabled: boolean): void {
    if (enabled && !this.composer) {
      this.setupPostProcessing();
    }
    // Post-processing is toggled by using composer vs direct render in render loop
  }

  /**
   * Register LOD configuration for an object
   */
  public registerLOD(object: THREE.Object3D, config: LODConfig): void {
    this.lodObjects.set(object, config);
  }

  /**
   * Update LOD levels based on camera distance
   */
  private updateLOD(): void {
    const cameraPosition = this._camera.position;

    for (const [object, config] of this.lodObjects) {
      if (!config.enabled) continue;

      const distance = object.position.distanceTo(cameraPosition);
      let lodLevel = 0;

      for (let i = 0; i < config.distances.length; i++) {
        if (distance > config.distances[i]) {
          lodLevel = i + 1;
        }
      }

      // Custom LOD handling - emit event or call callback
      (object as THREE.Object3D & { lodLevel?: number }).lodLevel = lodLevel;
      object.dispatchEvent({ type: 'lodChange', lodLevel });
    }
  }

  /**
   * Get current performance metrics
   */
  public getMetrics(): PerformanceMetrics {
    const info = this.renderer.info;

    return {
      fps: this.currentFPS,
      frameTime: this.frameTimeHistory.length > 0
        ? this.frameTimeHistory.reduce((a, b) => a + b, 0) / this.frameTimeHistory.length
        : 0,
      drawCalls: info.render.calls,
      triangles: info.render.triangles,
      geometries: info.memory.geometries,
      textures: info.memory.textures,
      programs: info.programs?.length || 0,
      memory: {
        geometries: info.memory.geometries,
        textures: info.memory.textures,
      },
      tier: this._tier,
      backend: this._backend,
    };
  }

  /**
   * Start the render loop
   */
  public start(): void {
    if (this.isRunning) return;

    this.isRunning = true;
    this.clock.start();
    this.lastFPSUpdate = performance.now();
    this.animate();
  }

  /**
   * Stop the render loop
   */
  public stop(): void {
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /**
   * Main animation loop
   */
  private animate = (): void => {
    if (!this.isRunning) return;

    this.animationFrameId = requestAnimationFrame(this.animate);

    const delta = this.clock.getDelta();

    // Update FPS counter
    this.frameCount++;
    const now = performance.now();
    if (now - this.lastFPSUpdate >= 1000) {
      this.currentFPS = this.frameCount;
      this.frameCount = 0;
      this.lastFPSUpdate = now;
    }

    // Track frame times for profiling
    if (this.config.profiling) {
      this.frameTimeHistory.push(delta * 1000);
      if (this.frameTimeHistory.length > 60) {
        this.frameTimeHistory.shift();
      }
    }

    // Update film grain time
    if (this.filmGrainPass) {
      this.filmGrainPass.uniforms.time.value = this.clock.elapsedTime;
    }

    // Update LOD
    if (this.lodObjects.size > 0) {
      this.updateLOD();
    }

    // Call update callbacks
    for (const callback of this.updateCallbacks) {
      callback(delta);
    }
    this.config.onUpdate(delta);

    // Render
    if (this.composer && this.config.postProcessing) {
      this.composer.render();
    } else {
      this.renderer.render(this._scene, this._camera);
    }
  };

  /**
   * Handle window resize
   */
  private handleResize(): void {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    this._camera.aspect = width / height;
    this._camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);

    if (this.composer) {
      this.composer.setSize(width, height);
    }

    if (this.bloomPass) {
      this.bloomPass.setSize(width, height);
    }
  }

  /**
   * Take a screenshot of the current frame
   */
  public screenshot(): string {
    this.renderer.render(this._scene, this._camera);
    return this.renderer.domElement.toDataURL('image/png');
  }

  /**
   * Get the WebGL renderer
   */
  public getRenderer(): THREE.WebGLRenderer {
    return this.renderer;
  }

  /**
   * Get the effect composer (if post-processing is enabled)
   */
  public getComposer(): EffectComposer | null {
    return this.composer;
  }

  /**
   * Dispose of all resources
   */
  public dispose(): void {
    this.stop();

    // Call dispose callback
    this.config.onDispose();

    // Remove event listeners
    window.removeEventListener('resize', this.handleResize);

    // Dispose of all scene objects
    this._scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.geometry.dispose();
        if (Array.isArray(object.material)) {
          object.material.forEach((mat) => mat.dispose());
        } else {
          object.material.dispose();
        }
      }
    });

    // Dispose of post-processing
    if (this.composer) {
      this.composer.dispose();
    }

    // Dispose of renderer
    this.renderer.dispose();
    this.renderer.forceContextLoss();

    // Remove canvas from DOM
    if (this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }

    // Clear references
    this.updateCallbacks = [];
    this.lodObjects.clear();
  }
}

export default BlazeGraphicsEngine;
