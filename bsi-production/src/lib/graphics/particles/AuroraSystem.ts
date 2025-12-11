/**
 * AuroraSystem
 *
 * Northern lights effect using BSI brand colors.
 * Creates flowing, ethereal curtains of light perfect
 * for atmospheric backgrounds and celebration moments.
 *
 * @author Austin Humphrey
 * @version 1.0.0
 */

import * as THREE from 'three';

/**
 * Brand colors
 */
const AURORA_COLORS = {
  ember: 0xFF6B35,
  burntOrange: 0xBF5700,
  gold: 0xC9A227,
  texasSoil: 0x8B4513,
  cream: 0xFAF8F5,
};

/**
 * Configuration for aurora system
 */
export interface AuroraConfig {
  /** Number of aurora bands/curtains */
  bandCount?: number;
  /** Points per band for smooth curves */
  bandResolution?: number;
  /** Width of the aurora display */
  width?: number;
  /** Height range of the aurora */
  minHeight?: number;
  maxHeight?: number;
  /** Depth range (Z position) */
  depth?: number;
  /** Primary aurora color */
  primaryColor?: number;
  /** Secondary aurora color */
  secondaryColor?: number;
  /** Accent color for highlights */
  accentColor?: number;
  /** Base opacity */
  opacity?: number;
  /** Flow speed */
  flowSpeed?: number;
  /** Wave amplitude */
  waveAmplitude?: number;
  /** Wave frequency */
  waveFrequency?: number;
  /** Vertical undulation speed */
  undulationSpeed?: number;
  /** Brightness/intensity */
  intensity?: number;
  /** Enable particle overlay */
  particles?: boolean;
  /** Particle count if enabled */
  particleCount?: number;
}

/**
 * Individual aurora band
 */
interface AuroraBand {
  mesh: THREE.Mesh;
  geometry: THREE.PlaneGeometry;
  material: THREE.ShaderMaterial;
  baseY: number;
  phase: number;
  speed: number;
}

/**
 * Aurora Borealis Effect System
 */
export class AuroraSystem extends THREE.Object3D {
  private config: Required<AuroraConfig>;
  private bands: AuroraBand[] = [];
  private time: number = 0;

  // Optional particle overlay
  private particleSystem: THREE.Points | null = null;
  private particleGeometry: THREE.BufferGeometry | null = null;
  private particleMaterial: THREE.ShaderMaterial | null = null;

  private static defaultConfig: Required<AuroraConfig> = {
    bandCount: 5,
    bandResolution: 64,
    width: 200,
    minHeight: 50,
    maxHeight: 150,
    depth: 100,
    primaryColor: AURORA_COLORS.ember,
    secondaryColor: AURORA_COLORS.burntOrange,
    accentColor: AURORA_COLORS.gold,
    opacity: 0.6,
    flowSpeed: 0.3,
    waveAmplitude: 30,
    waveFrequency: 2,
    undulationSpeed: 0.5,
    intensity: 1.5,
    particles: true,
    particleCount: 500,
  };

  constructor(config?: AuroraConfig) {
    super();
    this.config = { ...AuroraSystem.defaultConfig, ...config };

    this.createAuroraBands();

    if (this.config.particles) {
      this.createParticleOverlay();
    }
  }

  /**
   * Create the aurora band meshes
   */
  private createAuroraBands(): void {
    for (let i = 0; i < this.config.bandCount; i++) {
      const band = this.createBand(i);
      this.bands.push(band);
      this.add(band.mesh);
    }
  }

  /**
   * Create a single aurora band
   */
  private createBand(index: number): AuroraBand {
    const t = index / (this.config.bandCount - 1);

    // Vary position along depth
    const zPos = -this.config.depth / 2 + t * this.config.depth;
    const baseY = this.config.minHeight + Math.random() * (this.config.maxHeight - this.config.minHeight);

    // Create geometry
    const geometry = new THREE.PlaneGeometry(
      this.config.width,
      this.config.maxHeight - this.config.minHeight,
      this.config.bandResolution,
      32
    );

    // Create material
    const material = this.createBandMaterial(index);

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(0, baseY, zPos);
    mesh.rotation.x = -0.2; // Slight tilt

    return {
      mesh,
      geometry,
      material,
      baseY,
      phase: Math.random() * Math.PI * 2,
      speed: 0.8 + Math.random() * 0.4,
    };
  }

  /**
   * Create shader material for aurora band
   */
  private createBandMaterial(index: number): THREE.ShaderMaterial {
    const t = index / (this.config.bandCount - 1);

    return new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        primaryColor: { value: new THREE.Color(this.config.primaryColor) },
        secondaryColor: { value: new THREE.Color(this.config.secondaryColor) },
        accentColor: { value: new THREE.Color(this.config.accentColor) },
        opacity: { value: this.config.opacity * (0.5 + t * 0.5) },
        flowSpeed: { value: this.config.flowSpeed },
        waveAmplitude: { value: this.config.waveAmplitude },
        waveFrequency: { value: this.config.waveFrequency },
        intensity: { value: this.config.intensity },
        bandIndex: { value: index },
        totalBands: { value: this.config.bandCount },
      },

      vertexShader: `
        uniform float time;
        uniform float flowSpeed;
        uniform float waveAmplitude;
        uniform float waveFrequency;
        uniform float bandIndex;

        varying vec2 vUv;
        varying float vWave;
        varying float vHeight;

        // Simplex noise
        vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
        vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

        float snoise(vec3 v) {
          const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
          const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

          vec3 i = floor(v + dot(v, C.yyy));
          vec3 x0 = v - i + dot(i, C.xxx);

          vec3 g = step(x0.yzx, x0.xyz);
          vec3 l = 1.0 - g;
          vec3 i1 = min(g.xyz, l.zxy);
          vec3 i2 = max(g.xyz, l.zxy);

          vec3 x1 = x0 - i1 + C.xxx;
          vec3 x2 = x0 - i2 + C.yyy;
          vec3 x3 = x0 - D.yyy;

          i = mod289(i);
          vec4 p = permute(permute(permute(
              i.z + vec4(0.0, i1.z, i2.z, 1.0))
            + i.y + vec4(0.0, i1.y, i2.y, 1.0))
            + i.x + vec4(0.0, i1.x, i2.x, 1.0));

          float n_ = 0.142857142857;
          vec3 ns = n_ * D.wyz - D.xzx;

          vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
          vec4 x_ = floor(j * ns.z);
          vec4 y_ = floor(j - 7.0 * x_);

          vec4 x = x_ * ns.x + ns.yyyy;
          vec4 y = y_ * ns.x + ns.yyyy;
          vec4 h = 1.0 - abs(x) - abs(y);

          vec4 b0 = vec4(x.xy, y.xy);
          vec4 b1 = vec4(x.zw, y.zw);

          vec4 s0 = floor(b0) * 2.0 + 1.0;
          vec4 s1 = floor(b1) * 2.0 + 1.0;
          vec4 sh = -step(h, vec4(0.0));

          vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
          vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

          vec3 p0 = vec3(a0.xy, h.x);
          vec3 p1 = vec3(a0.zw, h.y);
          vec3 p2 = vec3(a1.xy, h.z);
          vec3 p3 = vec3(a1.zw, h.w);

          vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
          p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;

          vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
          m = m * m;
          return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
        }

        void main() {
          vUv = uv;

          // Create flowing wave displacement
          float t = time * flowSpeed;
          vec3 noisePos = vec3(position.x * 0.02 + t, position.y * 0.01, bandIndex * 0.5);

          float wave = snoise(noisePos) * waveAmplitude;
          wave += snoise(noisePos * 2.0) * waveAmplitude * 0.5;
          wave += snoise(noisePos * 4.0) * waveAmplitude * 0.25;

          vWave = wave / waveAmplitude;
          vHeight = uv.y;

          // Apply wave to position
          vec3 newPosition = position;
          newPosition.y += wave * uv.y; // More displacement at top
          newPosition.x += sin(uv.y * waveFrequency * 3.14159 + t) * waveAmplitude * 0.5;

          gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
        }
      `,

      fragmentShader: `
        uniform float time;
        uniform vec3 primaryColor;
        uniform vec3 secondaryColor;
        uniform vec3 accentColor;
        uniform float opacity;
        uniform float intensity;
        uniform float bandIndex;
        uniform float totalBands;

        varying vec2 vUv;
        varying float vWave;
        varying float vHeight;

        float hash(vec2 p) {
          return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
        }

        float noise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          f = f * f * (3.0 - 2.0 * f);

          float a = hash(i);
          float b = hash(i + vec2(1.0, 0.0));
          float c = hash(i + vec2(0.0, 1.0));
          float d = hash(i + vec2(1.0, 1.0));

          return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
        }

        void main() {
          // Vertical gradient (brighter at bottom)
          float vertGrad = 1.0 - pow(vUv.y, 0.7);

          // Horizontal variation
          float horizVar = sin(vUv.x * 3.14159 * 4.0 + time * 0.5 + bandIndex) * 0.5 + 0.5;

          // Color mixing based on position and wave
          float colorMix = (vWave + 1.0) * 0.5;
          colorMix = mix(colorMix, noise(vUv * 5.0 + time * 0.2), 0.3);

          vec3 color = mix(primaryColor, secondaryColor, colorMix);

          // Add accent color highlights
          float accentMask = pow(noise(vUv * 10.0 + time * 0.3), 2.0);
          color = mix(color, accentColor, accentMask * 0.5);

          // Apply intensity
          color *= intensity;

          // Add shimmer
          float shimmer = noise(vUv * 50.0 + time * 2.0) * 0.2 + 0.9;
          color *= shimmer;

          // Calculate alpha
          float alpha = vertGrad * horizVar * opacity;

          // Fade edges
          float edgeFade = smoothstep(0.0, 0.1, vUv.x) * smoothstep(0.0, 0.1, 1.0 - vUv.x);
          alpha *= edgeFade;

          // Fade bottom
          alpha *= smoothstep(0.0, 0.3, vUv.y);

          gl_FragColor = vec4(color, alpha);
        }
      `,

      transparent: true,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
  }

  /**
   * Create particle overlay for sparkle effect
   */
  private createParticleOverlay(): void {
    const count = this.config.particleCount;
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const seeds = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;

      // Random position within aurora volume
      positions[i3] = (Math.random() - 0.5) * this.config.width;
      positions[i3 + 1] = this.config.minHeight + Math.random() * (this.config.maxHeight - this.config.minHeight);
      positions[i3 + 2] = (Math.random() - 0.5) * this.config.depth;

      sizes[i] = 2 + Math.random() * 4;
      seeds[i] = Math.random();
    }

    this.particleGeometry = new THREE.BufferGeometry();
    this.particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.particleGeometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    this.particleGeometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));

    this.particleMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        color: { value: new THREE.Color(this.config.accentColor) },
      },

      vertexShader: `
        uniform float time;

        attribute float aSize;
        attribute float aSeed;

        varying float vAlpha;

        void main() {
          // Twinkle effect
          float twinkle = sin(time * 3.0 + aSeed * 6.28) * 0.5 + 0.5;
          twinkle *= sin(time * 7.0 + aSeed * 12.0) * 0.5 + 0.5;
          vAlpha = twinkle;

          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);

          float finalSize = aSize * twinkle;
          finalSize *= (200.0 / -mvPosition.z);

          gl_PointSize = max(finalSize, 0.0);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,

      fragmentShader: `
        uniform vec3 color;

        varying float vAlpha;

        void main() {
          vec2 center = gl_PointCoord - vec2(0.5);
          float dist = length(center);

          if (dist > 0.5) discard;

          float falloff = 1.0 - smoothstep(0.0, 0.5, dist);
          falloff = pow(falloff, 2.0);

          gl_FragColor = vec4(color * 2.0, falloff * vAlpha);
        }
      `,

      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.particleSystem = new THREE.Points(this.particleGeometry, this.particleMaterial);
    this.add(this.particleSystem);
  }

  /**
   * Update aurora system (call each frame)
   */
  public update(delta: number): void {
    this.time += delta;

    // Update band materials
    for (const band of this.bands) {
      band.material.uniforms.time.value = this.time * band.speed;

      // Subtle vertical undulation
      const undulation = Math.sin(this.time * this.config.undulationSpeed + band.phase) * 5;
      band.mesh.position.y = band.baseY + undulation;
    }

    // Update particle overlay
    if (this.particleMaterial) {
      this.particleMaterial.uniforms.time.value = this.time;
    }
  }

  /**
   * Set aurora colors
   */
  public setColors(primary: number, secondary: number, accent: number): void {
    for (const band of this.bands) {
      band.material.uniforms.primaryColor.value = new THREE.Color(primary);
      band.material.uniforms.secondaryColor.value = new THREE.Color(secondary);
      band.material.uniforms.accentColor.value = new THREE.Color(accent);
    }

    if (this.particleMaterial) {
      this.particleMaterial.uniforms.color.value = new THREE.Color(accent);
    }
  }

  /**
   * Set intensity
   */
  public setIntensity(intensity: number): void {
    for (const band of this.bands) {
      band.material.uniforms.intensity.value = intensity;
    }
  }

  /**
   * Set opacity
   */
  public setOpacity(opacity: number): void {
    for (let i = 0; i < this.bands.length; i++) {
      const t = i / (this.bands.length - 1);
      this.bands[i].material.uniforms.opacity.value = opacity * (0.5 + t * 0.5);
    }
  }

  /**
   * Dispose of all resources
   */
  public dispose(): void {
    for (const band of this.bands) {
      band.geometry.dispose();
      band.material.dispose();
      this.remove(band.mesh);
    }

    if (this.particleSystem) {
      this.particleGeometry?.dispose();
      this.particleMaterial?.dispose();
      this.remove(this.particleSystem);
    }
  }
}

/**
 * Preset configurations for aurora effects
 */
export const AuroraPresets = {
  /** BSI brand aurora */
  brand: {
    primaryColor: AURORA_COLORS.ember,
    secondaryColor: AURORA_COLORS.burntOrange,
    accentColor: AURORA_COLORS.gold,
    intensity: 1.5,
    opacity: 0.6,
  },

  /** Subtle background */
  subtle: {
    bandCount: 3,
    primaryColor: AURORA_COLORS.burntOrange,
    secondaryColor: AURORA_COLORS.texasSoil,
    accentColor: AURORA_COLORS.ember,
    intensity: 0.8,
    opacity: 0.3,
    particles: false,
  },

  /** Championship celebration */
  championship: {
    bandCount: 7,
    primaryColor: AURORA_COLORS.gold,
    secondaryColor: AURORA_COLORS.ember,
    accentColor: AURORA_COLORS.cream,
    intensity: 2.5,
    opacity: 0.8,
    flowSpeed: 0.5,
    waveAmplitude: 50,
    particleCount: 800,
  },

  /** Intense dramatic */
  dramatic: {
    bandCount: 6,
    primaryColor: AURORA_COLORS.ember,
    secondaryColor: AURORA_COLORS.gold,
    accentColor: AURORA_COLORS.cream,
    intensity: 2.0,
    opacity: 0.7,
    flowSpeed: 0.4,
    waveAmplitude: 40,
  },

  /** Night sky ambient */
  nightSky: {
    bandCount: 4,
    primaryColor: AURORA_COLORS.burntOrange,
    secondaryColor: AURORA_COLORS.texasSoil,
    accentColor: AURORA_COLORS.gold,
    intensity: 1.0,
    opacity: 0.4,
    flowSpeed: 0.2,
    minHeight: 80,
    maxHeight: 200,
  },
};

export default AuroraSystem;
