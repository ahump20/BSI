/**
 * BlazeComposer
 *
 * Custom post-processing pipeline with bloom, DOF,
 * motion blur, and chromatic aberration. Designed
 * for cinematic sports visualization.
 *
 * @author Austin Humphrey
 * @version 1.0.0
 */

import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { BokehPass } from 'three/examples/jsm/postprocessing/BokehPass.js';

/**
 * Brand colors
 */
const COMPOSER_COLORS = {
  ember: 0xFF6B35,
  burntOrange: 0xBF5700,
  gold: 0xC9A227,
  midnight: 0x0D0D0D,
};

/**
 * Configuration for BlazeComposer
 */
export interface BlazeComposerConfig {
  /** Enable bloom effect */
  bloom?: boolean;
  /** Bloom strength */
  bloomStrength?: number;
  /** Bloom radius */
  bloomRadius?: number;
  /** Bloom threshold */
  bloomThreshold?: number;
  /** Enable chromatic aberration */
  chromaticAberration?: boolean;
  /** Chromatic aberration intensity */
  chromaticIntensity?: number;
  /** Enable film grain */
  filmGrain?: boolean;
  /** Film grain amount */
  filmGrainAmount?: number;
  /** Film grain speed */
  filmGrainSpeed?: number;
  /** Enable vignette */
  vignette?: boolean;
  /** Vignette darkness */
  vignetteDarkness?: number;
  /** Vignette offset */
  vignetteOffset?: number;
  /** Enable color grading */
  colorGrading?: boolean;
  /** Color grading saturation */
  saturation?: number;
  /** Color grading contrast */
  contrast?: number;
  /** Color grading brightness */
  brightness?: number;
  /** Color tint */
  tint?: number;
  /** Tint intensity */
  tintIntensity?: number;
  /** Enable depth of field */
  depthOfField?: boolean;
  /** DOF focus distance */
  dofFocus?: number;
  /** DOF aperture */
  dofAperture?: number;
  /** DOF max blur */
  dofMaxBlur?: number;
  /** Enable scanlines */
  scanlines?: boolean;
  /** Scanline count */
  scanlineCount?: number;
  /** Scanline intensity */
  scanlineIntensity?: number;
  /** Enable glow pass */
  glowPass?: boolean;
  /** Glow color */
  glowColor?: number;
  /** Glow intensity */
  glowIntensity?: number;
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
      float dist = length(vUv - vec2(0.5));
      offset *= dist * dist;

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

      // Generate noise
      float noise = rand(vUv + vec2(time * speed)) * 2.0 - 1.0;

      // Apply noise to color
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
      float vignette = 1.0 - dot(uv, uv);
      vignette = clamp(vignette, 0.0, 1.0);
      vignette = pow(vignette, darkness);

      gl_FragColor = vec4(texel.rgb * vignette, texel.a);
    }
  `,
};

/**
 * Custom color grading shader
 */
const ColorGradingShader = {
  name: 'ColorGradingShader',
  uniforms: {
    tDiffuse: { value: null },
    saturation: { value: 1.0 },
    contrast: { value: 1.0 },
    brightness: { value: 1.0 },
    tint: { value: new THREE.Color(0xFFFFFF) },
    tintIntensity: { value: 0.0 },
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
    uniform float saturation;
    uniform float contrast;
    uniform float brightness;
    uniform vec3 tint;
    uniform float tintIntensity;
    varying vec2 vUv;

    vec3 rgb2hsv(vec3 c) {
      vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
      vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
      vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));

      float d = q.x - min(q.w, q.y);
      float e = 1.0e-10;
      return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
    }

    vec3 hsv2rgb(vec3 c) {
      vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
      vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
      return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
    }

    void main() {
      vec4 texel = texture2D(tDiffuse, vUv);
      vec3 color = texel.rgb;

      // Apply brightness
      color *= brightness;

      // Apply contrast
      color = (color - 0.5) * contrast + 0.5;

      // Apply saturation
      vec3 hsv = rgb2hsv(color);
      hsv.y *= saturation;
      color = hsv2rgb(hsv);

      // Apply tint
      color = mix(color, color * tint, tintIntensity);

      gl_FragColor = vec4(color, texel.a);
    }
  `,
};

/**
 * Custom scanline shader
 */
const ScanlineShader = {
  name: 'ScanlineShader',
  uniforms: {
    tDiffuse: { value: null },
    time: { value: 0.0 },
    count: { value: 100.0 },
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
    uniform float count;
    uniform float intensity;
    varying vec2 vUv;

    void main() {
      vec4 texel = texture2D(tDiffuse, vUv);

      // Scanlines
      float scanline = sin((vUv.y + time * 0.05) * count * 3.14159) * 0.5 + 0.5;
      scanline = pow(scanline, 3.0);

      // Apply scanlines
      texel.rgb *= 1.0 - scanline * intensity;

      gl_FragColor = texel;
    }
  `,
};

/**
 * Custom glow shader for brand color enhancement
 */
const GlowShader = {
  name: 'GlowShader',
  uniforms: {
    tDiffuse: { value: null },
    glowColor: { value: new THREE.Color(0xFF6B35) },
    intensity: { value: 0.5 },
    threshold: { value: 0.5 },
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
    uniform vec3 glowColor;
    uniform float intensity;
    uniform float threshold;
    varying vec2 vUv;

    void main() {
      vec4 texel = texture2D(tDiffuse, vUv);

      // Calculate luminance
      float luminance = dot(texel.rgb, vec3(0.299, 0.587, 0.114));

      // Apply glow to bright areas
      float glowMask = smoothstep(threshold, 1.0, luminance);

      vec3 glow = glowColor * glowMask * intensity;

      gl_FragColor = vec4(texel.rgb + glow, texel.a);
    }
  `,
};

/**
 * BlazeComposer - Custom post-processing pipeline
 */
export class BlazeComposer {
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.Camera;
  private composer: EffectComposer;
  private config: Required<BlazeComposerConfig>;
  private time: number = 0;

  // Passes
  private bloomPass: UnrealBloomPass | null = null;
  private chromaticPass: ShaderPass | null = null;
  private filmGrainPass: ShaderPass | null = null;
  private vignettePass: ShaderPass | null = null;
  private colorGradingPass: ShaderPass | null = null;
  private scanlinePass: ShaderPass | null = null;
  private glowPass: ShaderPass | null = null;
  private dofPass: BokehPass | null = null;

  private static defaultConfig: Required<BlazeComposerConfig> = {
    bloom: true,
    bloomStrength: 0.6,
    bloomRadius: 0.5,
    bloomThreshold: 0.8,
    chromaticAberration: true,
    chromaticIntensity: 0.002,
    filmGrain: true,
    filmGrainAmount: 0.06,
    filmGrainSpeed: 0.5,
    vignette: true,
    vignetteDarkness: 0.5,
    vignetteOffset: 1.2,
    colorGrading: true,
    saturation: 1.1,
    contrast: 1.05,
    brightness: 1.0,
    tint: COMPOSER_COLORS.burntOrange,
    tintIntensity: 0.05,
    depthOfField: false,
    dofFocus: 50,
    dofAperture: 0.025,
    dofMaxBlur: 0.01,
    scanlines: false,
    scanlineCount: 100,
    scanlineIntensity: 0.1,
    glowPass: true,
    glowColor: COMPOSER_COLORS.ember,
    glowIntensity: 0.3,
  };

  constructor(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.Camera,
    config?: BlazeComposerConfig
  ) {
    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;
    this.config = { ...BlazeComposer.defaultConfig, ...config };

    // Create composer
    this.composer = new EffectComposer(this.renderer);

    // Setup passes
    this.setupPasses();
  }

  /**
   * Setup all post-processing passes
   */
  private setupPasses(): void {
    // Render pass (always first)
    const renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(renderPass);

    // Bloom
    if (this.config.bloom) {
      this.bloomPass = new UnrealBloomPass(
        new THREE.Vector2(
          this.renderer.domElement.clientWidth,
          this.renderer.domElement.clientHeight
        ),
        this.config.bloomStrength,
        this.config.bloomRadius,
        this.config.bloomThreshold
      );
      this.composer.addPass(this.bloomPass);
    }

    // Depth of field
    if (this.config.depthOfField) {
      this.dofPass = new BokehPass(this.scene, this.camera, {
        focus: this.config.dofFocus,
        aperture: this.config.dofAperture,
        maxblur: this.config.dofMaxBlur,
      });
      this.composer.addPass(this.dofPass);
    }

    // Glow pass
    if (this.config.glowPass) {
      this.glowPass = new ShaderPass(GlowShader);
      this.glowPass.uniforms.glowColor.value = new THREE.Color(this.config.glowColor);
      this.glowPass.uniforms.intensity.value = this.config.glowIntensity;
      this.composer.addPass(this.glowPass);
    }

    // Color grading
    if (this.config.colorGrading) {
      this.colorGradingPass = new ShaderPass(ColorGradingShader);
      this.colorGradingPass.uniforms.saturation.value = this.config.saturation;
      this.colorGradingPass.uniforms.contrast.value = this.config.contrast;
      this.colorGradingPass.uniforms.brightness.value = this.config.brightness;
      this.colorGradingPass.uniforms.tint.value = new THREE.Color(this.config.tint);
      this.colorGradingPass.uniforms.tintIntensity.value = this.config.tintIntensity;
      this.composer.addPass(this.colorGradingPass);
    }

    // Chromatic aberration
    if (this.config.chromaticAberration) {
      this.chromaticPass = new ShaderPass(ChromaticAberrationShader);
      this.chromaticPass.uniforms.amount.value = this.config.chromaticIntensity;
      this.composer.addPass(this.chromaticPass);
    }

    // Film grain
    if (this.config.filmGrain) {
      this.filmGrainPass = new ShaderPass(FilmGrainShader);
      this.filmGrainPass.uniforms.amount.value = this.config.filmGrainAmount;
      this.filmGrainPass.uniforms.speed.value = this.config.filmGrainSpeed;
      this.composer.addPass(this.filmGrainPass);
    }

    // Scanlines
    if (this.config.scanlines) {
      this.scanlinePass = new ShaderPass(ScanlineShader);
      this.scanlinePass.uniforms.count.value = this.config.scanlineCount;
      this.scanlinePass.uniforms.intensity.value = this.config.scanlineIntensity;
      this.composer.addPass(this.scanlinePass);
    }

    // Vignette
    if (this.config.vignette) {
      this.vignettePass = new ShaderPass(VignetteShader);
      this.vignettePass.uniforms.darkness.value = this.config.vignetteDarkness;
      this.vignettePass.uniforms.offset.value = this.config.vignetteOffset;
      this.composer.addPass(this.vignettePass);
    }

    // Output pass (always last for correct color space)
    const outputPass = new OutputPass();
    this.composer.addPass(outputPass);
  }

  /**
   * Update time-based effects
   */
  public update(delta: number): void {
    this.time += delta;

    if (this.filmGrainPass) {
      this.filmGrainPass.uniforms.time.value = this.time;
    }

    if (this.scanlinePass) {
      this.scanlinePass.uniforms.time.value = this.time;
    }
  }

  /**
   * Render the scene with post-processing
   */
  public render(): void {
    this.composer.render();
  }

  /**
   * Set bloom parameters
   */
  public setBloom(strength: number, radius: number, threshold: number): void {
    if (this.bloomPass) {
      this.bloomPass.strength = strength;
      this.bloomPass.radius = radius;
      this.bloomPass.threshold = threshold;
    }
  }

  /**
   * Set chromatic aberration intensity
   */
  public setChromaticAberration(intensity: number): void {
    if (this.chromaticPass) {
      this.chromaticPass.uniforms.amount.value = intensity;
    }
  }

  /**
   * Set film grain parameters
   */
  public setFilmGrain(amount: number, speed?: number): void {
    if (this.filmGrainPass) {
      this.filmGrainPass.uniforms.amount.value = amount;
      if (speed !== undefined) {
        this.filmGrainPass.uniforms.speed.value = speed;
      }
    }
  }

  /**
   * Set vignette parameters
   */
  public setVignette(darkness: number, offset?: number): void {
    if (this.vignettePass) {
      this.vignettePass.uniforms.darkness.value = darkness;
      if (offset !== undefined) {
        this.vignettePass.uniforms.offset.value = offset;
      }
    }
  }

  /**
   * Set color grading parameters
   */
  public setColorGrading(
    saturation: number,
    contrast: number,
    brightness: number,
    tint?: number,
    tintIntensity?: number
  ): void {
    if (this.colorGradingPass) {
      this.colorGradingPass.uniforms.saturation.value = saturation;
      this.colorGradingPass.uniforms.contrast.value = contrast;
      this.colorGradingPass.uniforms.brightness.value = brightness;
      if (tint !== undefined) {
        this.colorGradingPass.uniforms.tint.value = new THREE.Color(tint);
      }
      if (tintIntensity !== undefined) {
        this.colorGradingPass.uniforms.tintIntensity.value = tintIntensity;
      }
    }
  }

  /**
   * Set depth of field parameters
   */
  public setDepthOfField(focus: number, aperture: number, maxBlur: number): void {
    if (this.dofPass) {
      this.dofPass.uniforms.focus.value = focus;
      this.dofPass.uniforms.aperture.value = aperture;
      this.dofPass.uniforms.maxblur.value = maxBlur;
    }
  }

  /**
   * Set glow parameters
   */
  public setGlow(color: number, intensity: number): void {
    if (this.glowPass) {
      this.glowPass.uniforms.glowColor.value = new THREE.Color(color);
      this.glowPass.uniforms.intensity.value = intensity;
    }
  }

  /**
   * Handle window resize
   */
  public setSize(width: number, height: number): void {
    this.composer.setSize(width, height);

    if (this.bloomPass) {
      this.bloomPass.setSize(width, height);
    }
  }

  /**
   * Get the effect composer
   */
  public getComposer(): EffectComposer {
    return this.composer;
  }

  /**
   * Dispose all resources
   */
  public dispose(): void {
    this.composer.dispose();
  }
}

/**
 * Preset configurations for BlazeComposer
 */
export const BlazeComposerPresets = {
  /** Cinematic broadcast quality */
  broadcast: {
    bloom: true,
    bloomStrength: 0.5,
    chromaticAberration: true,
    chromaticIntensity: 0.001,
    filmGrain: true,
    filmGrainAmount: 0.04,
    vignette: true,
    vignetteDarkness: 0.4,
    colorGrading: true,
    saturation: 1.1,
    contrast: 1.05,
  },

  /** Dramatic highlight reel */
  dramatic: {
    bloom: true,
    bloomStrength: 0.8,
    bloomRadius: 0.6,
    chromaticAberration: true,
    chromaticIntensity: 0.003,
    filmGrain: true,
    filmGrainAmount: 0.08,
    vignette: true,
    vignetteDarkness: 0.6,
    colorGrading: true,
    contrast: 1.1,
    tintIntensity: 0.08,
  },

  /** Clean analytical */
  analytical: {
    bloom: true,
    bloomStrength: 0.3,
    chromaticAberration: false,
    filmGrain: false,
    vignette: true,
    vignetteDarkness: 0.3,
    colorGrading: true,
    saturation: 1.0,
    contrast: 1.0,
  },

  /** Retro broadcast */
  retro: {
    bloom: true,
    bloomStrength: 0.4,
    chromaticAberration: true,
    chromaticIntensity: 0.004,
    filmGrain: true,
    filmGrainAmount: 0.12,
    vignette: true,
    vignetteDarkness: 0.7,
    scanlines: true,
    scanlineIntensity: 0.15,
    colorGrading: true,
    saturation: 0.9,
  },

  /** Minimal clean */
  minimal: {
    bloom: true,
    bloomStrength: 0.2,
    chromaticAberration: false,
    filmGrain: false,
    vignette: false,
    colorGrading: false,
  },
};

export default BlazeComposer;
