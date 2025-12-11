/**
 * BlazeEngine - Core 3D Graphics Engine
 *
 * World-class WebGL/WebGPU rendering engine for Blaze Sports Intel.
 * Built on Three.js with custom optimizations for sports data visualization.
 *
 * Features:
 * - GPU-accelerated particle systems
 * - Custom shader pipeline
 * - Post-processing effects (bloom, chromatic aberration, film grain)
 * - LOD system for performance
 * - Mobile-first with graceful degradation
 * - Automatic performance scaling
 *
 * @author Austin Humphrey
 * @version 3.0.0
 */

import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { threeColors } from '../../styles/tokens/colors';

// Performance tiers
export enum PerformanceTier {
  ULTRA = 'ultra',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
  MINIMAL = 'minimal',
}

// Engine configuration
export interface BlazeEngineConfig {
  container: HTMLElement;
  width?: number;
  height?: number;
  backgroundColor?: number;
  antialias?: boolean;
  alpha?: boolean;
  shadows?: boolean;
  postProcessing?: boolean;
  autoResize?: boolean;
  performanceTier?: PerformanceTier;
  maxFPS?: number;
  onInit?: () => void;
  onRender?: (delta: number) => void;
  onResize?: (width: number, height: number) => void;
}

// Performance metrics
export interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  drawCalls: number;
  triangles: number;
  points: number;
  lines: number;
  memory: {
    geometries: number;
    textures: number;
  };
}

/**
 * Main 3D Graphics Engine Class
 */
export class BlazeEngine {
  // Core Three.js components
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  public controls: OrbitControls | null = null;

  // Post-processing
  public composer: EffectComposer | null = null;
  private bloomPass: UnrealBloomPass | null = null;
  private chromaticPass: ShaderPass | null = null;
  private filmGrainPass: ShaderPass | null = null;

  // Configuration
  private config: Required<BlazeEngineConfig>;
  private performanceTier: PerformanceTier;

  // Animation state
  private animationId: number | null = null;
  private clock: THREE.Clock;
  private isRunning: boolean = false;

  // Performance tracking
  private frameCount: number = 0;
  private fpsTimer: number = 0;
  private currentFPS: number = 60;
  private targetFrameTime: number;

  // Callbacks storage
  private updateCallbacks: Array<(delta: number, elapsed: number) => void> = [];

  // Default configuration
  private static defaultConfig: Omit<Required<BlazeEngineConfig>, 'container'> = {
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: threeColors.midnight,
    antialias: true,
    alpha: true,
    shadows: true,
    postProcessing: true,
    autoResize: true,
    performanceTier: PerformanceTier.HIGH,
    maxFPS: 60,
    onInit: () => {},
    onRender: () => {},
    onResize: () => {},
  };

  constructor(config: BlazeEngineConfig) {
    // Merge configurations
    this.config = { ...BlazeEngine.defaultConfig, ...config } as Required<BlazeEngineConfig>;

    // Detect performance tier if not specified
    this.performanceTier = this.config.performanceTier || this.detectPerformanceTier();
    this.targetFrameTime = 1000 / this.config.maxFPS;

    // Initialize clock
    this.clock = new THREE.Clock();

    // Initialize Three.js components
    this.scene = this.createScene();
    this.camera = this.createCamera();
    this.renderer = this.createRenderer();

    // Setup post-processing if enabled and supported
    if (this.config.postProcessing && this.performanceTier !== PerformanceTier.MINIMAL) {
      this.setupPostProcessing();
    }

    // Setup event listeners
    if (this.config.autoResize) {
      this.setupResizeHandler();
    }

    // Append to container
    this.config.container.appendChild(this.renderer.domElement);

    // Call init callback
    this.config.onInit();
  }

  /**
   * Detect the appropriate performance tier based on device capabilities
   */
  private detectPerformanceTier(): PerformanceTier {
    // Check for WebGL2 support
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');

    if (!gl) {
      return PerformanceTier.MINIMAL;
    }

    // Check device pixel ratio (high DPR suggests capable device)
    const dpr = window.devicePixelRatio || 1;

    // Check for mobile
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );

    // Check GPU info if available
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    const gpuRenderer = debugInfo
      ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
      : 'unknown';

    // Performance heuristics
    if (isMobile) {
      if (dpr >= 3) return PerformanceTier.MEDIUM;
      if (dpr >= 2) return PerformanceTier.LOW;
      return PerformanceTier.MINIMAL;
    }

    // Desktop heuristics
    const isHighEndGPU =
      /NVIDIA|GeForce RTX|Radeon RX 6|Radeon RX 7|Apple M[1-3]/i.test(gpuRenderer);
    const isMidRangeGPU = /GeForce GTX|Radeon RX 5|Intel Iris|Apple M/i.test(gpuRenderer);

    if (isHighEndGPU && dpr <= 2) return PerformanceTier.ULTRA;
    if (isHighEndGPU || isMidRangeGPU) return PerformanceTier.HIGH;
    return PerformanceTier.MEDIUM;
  }

  /**
   * Create the Three.js scene
   */
  private createScene(): THREE.Scene {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(this.config.backgroundColor);

    // Add fog for depth (subtle)
    if (this.performanceTier !== PerformanceTier.MINIMAL) {
      scene.fog = new THREE.FogExp2(this.config.backgroundColor, 0.0008);
    }

    return scene;
  }

  /**
   * Create the camera
   */
  private createCamera(): THREE.PerspectiveCamera {
    const aspect = this.config.width / this.config.height;
    const camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 10000);
    camera.position.set(0, 50, 150);
    camera.lookAt(0, 0, 0);
    return camera;
  }

  /**
   * Create the WebGL renderer with optimizations based on performance tier
   */
  private createRenderer(): THREE.WebGLRenderer {
    const tierSettings = this.getRendererSettings();

    const renderer = new THREE.WebGLRenderer({
      antialias: tierSettings.antialias,
      alpha: this.config.alpha,
      powerPreference: tierSettings.powerPreference,
      stencil: false,
      depth: true,
    });

    renderer.setSize(this.config.width, this.config.height);
    renderer.setPixelRatio(tierSettings.pixelRatio);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;

    // Shadow settings
    if (this.config.shadows && this.performanceTier !== PerformanceTier.MINIMAL) {
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type =
        this.performanceTier === PerformanceTier.ULTRA
          ? THREE.PCFSoftShadowMap
          : THREE.PCFShadowMap;
    }

    return renderer;
  }

  /**
   * Get renderer settings based on performance tier
   */
  private getRendererSettings(): {
    antialias: boolean;
    pixelRatio: number;
    powerPreference: 'high-performance' | 'low-power' | 'default';
  } {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    switch (this.performanceTier) {
      case PerformanceTier.ULTRA:
        return { antialias: true, pixelRatio: dpr, powerPreference: 'high-performance' };
      case PerformanceTier.HIGH:
        return { antialias: true, pixelRatio: Math.min(dpr, 1.5), powerPreference: 'high-performance' };
      case PerformanceTier.MEDIUM:
        return { antialias: true, pixelRatio: 1, powerPreference: 'default' };
      case PerformanceTier.LOW:
        return { antialias: false, pixelRatio: 1, powerPreference: 'low-power' };
      case PerformanceTier.MINIMAL:
        return { antialias: false, pixelRatio: 0.75, powerPreference: 'low-power' };
    }
  }

  /**
   * Setup post-processing pipeline
   */
  private setupPostProcessing(): void {
    this.composer = new EffectComposer(this.renderer);

    // Render pass (base scene)
    const renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(renderPass);

    // Bloom pass (brand glow effect)
    if (this.performanceTier === PerformanceTier.ULTRA || this.performanceTier === PerformanceTier.HIGH) {
      this.bloomPass = new UnrealBloomPass(
        new THREE.Vector2(this.config.width, this.config.height),
        0.5,  // strength
        0.4,  // radius
        0.85  // threshold
      );
      this.composer.addPass(this.bloomPass);
    }

    // Chromatic aberration (cinematic effect)
    if (this.performanceTier === PerformanceTier.ULTRA) {
      this.chromaticPass = new ShaderPass(ChromaticAberrationShader);
      this.chromaticPass.uniforms['amount'].value = 0.0015;
      this.composer.addPass(this.chromaticPass);
    }

    // Film grain (editorial aesthetic)
    if (this.performanceTier === PerformanceTier.ULTRA || this.performanceTier === PerformanceTier.HIGH) {
      this.filmGrainPass = new ShaderPass(FilmGrainShader);
      this.filmGrainPass.uniforms['intensity'].value = 0.08;
      this.composer.addPass(this.filmGrainPass);
    }
  }

  /**
   * Setup window resize handler
   */
  private setupResizeHandler(): void {
    const resizeHandler = () => {
      const width = this.config.container.clientWidth || window.innerWidth;
      const height = this.config.container.clientHeight || window.innerHeight;

      this.resize(width, height);
    };

    window.addEventListener('resize', resizeHandler);
    window.addEventListener('orientationchange', () => {
      setTimeout(resizeHandler, 100);
    });
  }

  /**
   * Resize the renderer and camera
   */
  public resize(width: number, height: number): void {
    this.config.width = width;
    this.config.height = height;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);

    if (this.composer) {
      this.composer.setSize(width, height);
    }

    this.config.onResize(width, height);
  }

  /**
   * Enable orbital camera controls
   */
  public enableControls(options?: {
    enableDamping?: boolean;
    dampingFactor?: number;
    enableZoom?: boolean;
    minDistance?: number;
    maxDistance?: number;
    autoRotate?: boolean;
    autoRotateSpeed?: number;
  }): OrbitControls {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);

    const defaults = {
      enableDamping: true,
      dampingFactor: 0.05,
      enableZoom: true,
      minDistance: 10,
      maxDistance: 1000,
      autoRotate: false,
      autoRotateSpeed: 0.5,
    };

    const settings = { ...defaults, ...options };

    this.controls.enableDamping = settings.enableDamping;
    this.controls.dampingFactor = settings.dampingFactor;
    this.controls.enableZoom = settings.enableZoom;
    this.controls.minDistance = settings.minDistance;
    this.controls.maxDistance = settings.maxDistance;
    this.controls.autoRotate = settings.autoRotate;
    this.controls.autoRotateSpeed = settings.autoRotateSpeed;

    return this.controls;
  }

  /**
   * Add an update callback to the render loop
   */
  public onUpdate(callback: (delta: number, elapsed: number) => void): () => void {
    this.updateCallbacks.push(callback);
    return () => {
      const index = this.updateCallbacks.indexOf(callback);
      if (index > -1) {
        this.updateCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Add default lighting setup
   */
  public addDefaultLighting(): void {
    // Ambient light
    const ambient = new THREE.AmbientLight(0xffffff, 0.4);
    this.scene.add(ambient);

    // Key light (warm - ember glow)
    const keyLight = new THREE.DirectionalLight(threeColors.ember, 1.0);
    keyLight.position.set(50, 100, 50);
    keyLight.castShadow = this.config.shadows;
    if (keyLight.castShadow) {
      keyLight.shadow.mapSize.width = this.performanceTier === PerformanceTier.ULTRA ? 2048 : 1024;
      keyLight.shadow.mapSize.height = this.performanceTier === PerformanceTier.ULTRA ? 2048 : 1024;
      keyLight.shadow.camera.near = 0.5;
      keyLight.shadow.camera.far = 500;
    }
    this.scene.add(keyLight);

    // Fill light (burnt orange accent)
    const fillLight = new THREE.DirectionalLight(threeColors.burntOrange, 0.5);
    fillLight.position.set(-50, 50, -50);
    this.scene.add(fillLight);

    // Rim light (gold highlight)
    const rimLight = new THREE.DirectionalLight(threeColors.gold, 0.3);
    rimLight.position.set(0, -50, -100);
    this.scene.add(rimLight);
  }

  /**
   * Start the animation loop
   */
  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.clock.start();
    this.animate();
  }

  /**
   * Stop the animation loop
   */
  public stop(): void {
    if (!this.isRunning) return;
    this.isRunning = false;
    this.clock.stop();
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  /**
   * Main animation loop
   */
  private animate = (): void => {
    if (!this.isRunning) return;

    this.animationId = requestAnimationFrame(this.animate);

    const delta = this.clock.getDelta();
    const elapsed = this.clock.getElapsedTime();

    // Update FPS counter
    this.frameCount++;
    this.fpsTimer += delta;
    if (this.fpsTimer >= 1) {
      this.currentFPS = this.frameCount;
      this.frameCount = 0;
      this.fpsTimer = 0;
    }

    // Update film grain time
    if (this.filmGrainPass) {
      this.filmGrainPass.uniforms['time'].value = elapsed;
    }

    // Update controls
    if (this.controls) {
      this.controls.update();
    }

    // Execute update callbacks
    for (const callback of this.updateCallbacks) {
      callback(delta, elapsed);
    }

    // Call render callback
    this.config.onRender(delta);

    // Render
    if (this.composer && this.config.postProcessing) {
      this.composer.render();
    } else {
      this.renderer.render(this.scene, this.camera);
    }
  };

  /**
   * Get current performance metrics
   */
  public getPerformanceMetrics(): PerformanceMetrics {
    const info = this.renderer.info;
    return {
      fps: this.currentFPS,
      frameTime: 1000 / this.currentFPS,
      drawCalls: info.render.calls,
      triangles: info.render.triangles,
      points: info.render.points,
      lines: info.render.lines,
      memory: {
        geometries: info.memory.geometries,
        textures: info.memory.textures,
      },
    };
  }

  /**
   * Get current performance tier
   */
  public getPerformanceTier(): PerformanceTier {
    return this.performanceTier;
  }

  /**
   * Update bloom settings
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
      this.chromaticPass.uniforms['amount'].value = amount;
    }
  }

  /**
   * Set film grain intensity
   */
  public setFilmGrain(intensity: number): void {
    if (this.filmGrainPass) {
      this.filmGrainPass.uniforms['intensity'].value = intensity;
    }
  }

  /**
   * Dispose of all resources
   */
  public dispose(): void {
    this.stop();

    // Remove from DOM
    if (this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }

    // Dispose controls
    if (this.controls) {
      this.controls.dispose();
    }

    // Dispose renderer
    this.renderer.dispose();

    // Clear scene
    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.geometry.dispose();
        if (Array.isArray(object.material)) {
          object.material.forEach((m) => m.dispose());
        } else {
          object.material.dispose();
        }
      }
    });

    this.scene.clear();
  }
}

/**
 * Chromatic Aberration Shader
 */
const ChromaticAberrationShader = {
  uniforms: {
    tDiffuse: { value: null },
    amount: { value: 0.002 },
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
 * Film Grain Shader
 */
const FilmGrainShader = {
  uniforms: {
    tDiffuse: { value: null },
    time: { value: 0.0 },
    intensity: { value: 0.1 },
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
    uniform float intensity;
    varying vec2 vUv;

    float random(vec2 co) {
      return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
    }

    void main() {
      vec4 color = texture2D(tDiffuse, vUv);
      float noise = random(vUv + time) * 2.0 - 1.0;
      color.rgb += noise * intensity;
      gl_FragColor = color;
    }
  `,
};

export default BlazeEngine;
