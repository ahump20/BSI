/**
 * DataRiverSystem
 *
 * Flowing streams of statistics like a river of fire.
 * Creates animated data visualization with particles that
 * flow along customizable paths, perfect for displaying
 * live stats, rankings, and comparisons.
 *
 * @author Austin Humphrey
 * @version 1.0.0
 */

import * as THREE from 'three';

/**
 * Brand colors
 */
const RIVER_COLORS = {
  ember: 0xFF6B35,
  burntOrange: 0xBF5700,
  gold: 0xC9A227,
  texasSoil: 0x8B4513,
  cream: 0xFAF8F5,
};

/**
 * Configuration for data river system
 */
export interface DataRiverConfig {
  /** Number of particles in the river */
  particleCount?: number;
  /** Path points for the river to follow */
  path?: THREE.Vector3[];
  /** Width of the river */
  width?: number;
  /** Speed of particle flow */
  flowSpeed?: number;
  /** Variation in flow speed */
  flowSpeedVariation?: number;
  /** Size of individual particles */
  particleSize?: number;
  /** Variation in particle size */
  sizeVariation?: number;
  /** Core color of particles */
  coreColor?: number;
  /** Glow color of particles */
  glowColor?: number;
  /** Trail color (faded) */
  trailColor?: number;
  /** Intensity of glow effect */
  glowIntensity?: number;
  /** Amount of turbulence/waviness */
  turbulence?: number;
  /** Frequency of turbulence waves */
  turbulenceFrequency?: number;
  /** Whether particles should loop */
  loop?: boolean;
  /** Fade in distance (percentage of path) */
  fadeIn?: number;
  /** Fade out distance (percentage of path) */
  fadeOut?: number;
}

/**
 * Individual river particle data
 */
interface RiverParticle {
  progress: number;
  speed: number;
  offset: THREE.Vector2;
  size: number;
  seed: number;
}

/**
 * Data River Particle System
 */
export class DataRiverSystem extends THREE.Object3D {
  private config: Required<DataRiverConfig>;
  private particles: RiverParticle[] = [];
  private geometry: THREE.BufferGeometry;
  private material: THREE.ShaderMaterial;
  private points: THREE.Points;
  private time: number = 0;

  // Buffer arrays
  private positions: Float32Array;
  private progress: Float32Array;
  private sizes: Float32Array;
  private offsets: Float32Array;
  private seeds: Float32Array;

  // Path interpolation
  private pathCurve: THREE.CatmullRomCurve3;

  private static defaultConfig: Required<DataRiverConfig> = {
    particleCount: 500,
    path: [
      new THREE.Vector3(-50, 0, 0),
      new THREE.Vector3(-25, 10, 10),
      new THREE.Vector3(0, 5, 0),
      new THREE.Vector3(25, 15, -10),
      new THREE.Vector3(50, 0, 0),
    ],
    width: 5,
    flowSpeed: 0.3,
    flowSpeedVariation: 0.2,
    particleSize: 3,
    sizeVariation: 0.5,
    coreColor: RIVER_COLORS.ember,
    glowColor: RIVER_COLORS.burntOrange,
    trailColor: RIVER_COLORS.gold,
    glowIntensity: 1.5,
    turbulence: 2,
    turbulenceFrequency: 3,
    loop: true,
    fadeIn: 0.1,
    fadeOut: 0.1,
  };

  constructor(config?: DataRiverConfig) {
    super();
    this.config = { ...DataRiverSystem.defaultConfig, ...config };

    // Create path curve
    this.pathCurve = new THREE.CatmullRomCurve3(this.config.path, this.config.loop);

    // Initialize arrays
    const count = this.config.particleCount;
    this.positions = new Float32Array(count * 3);
    this.progress = new Float32Array(count);
    this.sizes = new Float32Array(count);
    this.offsets = new Float32Array(count * 2);
    this.seeds = new Float32Array(count);

    // Initialize particles
    this.initializeParticles();

    // Create geometry and material
    this.geometry = this.createGeometry();
    this.material = this.createMaterial();

    // Create points mesh
    this.points = new THREE.Points(this.geometry, this.material);
    this.points.frustumCulled = false;
    this.add(this.points);
  }

  /**
   * Initialize particle pool with randomized properties
   */
  private initializeParticles(): void {
    for (let i = 0; i < this.config.particleCount; i++) {
      this.particles.push(this.createParticle(true));
    }
  }

  /**
   * Create a new particle
   */
  private createParticle(stagger: boolean = false): RiverParticle {
    const speedVar = this.config.flowSpeedVariation;
    const sizeVar = this.config.sizeVariation;

    return {
      progress: stagger ? Math.random() : 0,
      speed: this.config.flowSpeed * (1 - speedVar / 2 + Math.random() * speedVar),
      offset: new THREE.Vector2(
        (Math.random() - 0.5) * this.config.width,
        (Math.random() - 0.5) * this.config.width
      ),
      size: this.config.particleSize * (1 - sizeVar / 2 + Math.random() * sizeVar),
      seed: Math.random(),
    };
  }

  /**
   * Create buffer geometry with attributes
   */
  private createGeometry(): THREE.BufferGeometry {
    const geometry = new THREE.BufferGeometry();

    this.updateBuffers();

    geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    geometry.setAttribute('aProgress', new THREE.BufferAttribute(this.progress, 1));
    geometry.setAttribute('aSize', new THREE.BufferAttribute(this.sizes, 1));
    geometry.setAttribute('aOffset', new THREE.BufferAttribute(this.offsets, 2));
    geometry.setAttribute('aSeed', new THREE.BufferAttribute(this.seeds, 1));

    return geometry;
  }

  /**
   * Create shader material for river particles
   */
  private createMaterial(): THREE.ShaderMaterial {
    return new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        coreColor: { value: new THREE.Color(this.config.coreColor) },
        glowColor: { value: new THREE.Color(this.config.glowColor) },
        trailColor: { value: new THREE.Color(this.config.trailColor) },
        glowIntensity: { value: this.config.glowIntensity },
        fadeIn: { value: this.config.fadeIn },
        fadeOut: { value: this.config.fadeOut },
        turbulence: { value: this.config.turbulence },
        turbulenceFrequency: { value: this.config.turbulenceFrequency },
      },

      vertexShader: `
        uniform float time;
        uniform float turbulence;
        uniform float turbulenceFrequency;
        uniform float fadeIn;
        uniform float fadeOut;

        attribute float aProgress;
        attribute float aSize;
        attribute vec2 aOffset;
        attribute float aSeed;

        varying float vProgress;
        varying float vAlpha;
        varying float vPulse;

        float hash(float n) {
          return fract(sin(n) * 43758.5453123);
        }

        void main() {
          vProgress = aProgress;

          // Calculate fade based on progress
          float fadeInAlpha = smoothstep(0.0, fadeIn, aProgress);
          float fadeOutAlpha = 1.0 - smoothstep(1.0 - fadeOut, 1.0, aProgress);
          vAlpha = fadeInAlpha * fadeOutAlpha;

          // Pulse effect based on seed
          float pulsePhase = time * 2.0 + aSeed * 6.28;
          vPulse = 0.7 + 0.3 * sin(pulsePhase);

          // Apply turbulence to position
          vec3 pos = position;
          float turb = sin(aProgress * turbulenceFrequency * 3.14159 + time + aSeed * 10.0) * turbulence;
          pos.x += aOffset.x + turb * 0.5;
          pos.y += aOffset.y + turb * 0.5;

          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);

          // Size based on distance and progress
          float sizeScale = sin(aProgress * 3.14159); // Larger in middle
          float finalSize = aSize * sizeScale * vPulse;
          finalSize *= (300.0 / -mvPosition.z);

          gl_PointSize = max(finalSize, 1.0);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,

      fragmentShader: `
        uniform vec3 coreColor;
        uniform vec3 glowColor;
        uniform vec3 trailColor;
        uniform float glowIntensity;

        varying float vProgress;
        varying float vAlpha;
        varying float vPulse;

        void main() {
          vec2 center = gl_PointCoord - vec2(0.5);
          float dist = length(center);

          if (dist > 0.5) discard;

          // Soft radial gradient
          float falloff = 1.0 - smoothstep(0.0, 0.5, dist);

          // Color based on progress and distance from center
          vec3 color;
          if (dist < 0.1) {
            color = coreColor * 1.5;
          } else if (dist < 0.25) {
            float t = (dist - 0.1) / 0.15;
            color = mix(coreColor, glowColor, t);
          } else {
            float t = (dist - 0.25) / 0.25;
            color = mix(glowColor, trailColor, t);
          }

          // Progress-based color shift (hotter at start)
          color = mix(color * 1.2, color * 0.8, vProgress);

          // Apply glow and pulse
          color *= glowIntensity * vPulse;

          float alpha = falloff * vAlpha;

          gl_FragColor = vec4(color, alpha);
        }
      `,

      transparent: true,
      blending: THREE.AdditiveBlending,
      depthTest: true,
      depthWrite: false,
    });
  }

  /**
   * Update buffer arrays from particle data
   */
  private updateBuffers(): void {
    for (let i = 0; i < this.config.particleCount; i++) {
      const p = this.particles[i];
      const i3 = i * 3;
      const i2 = i * 2;

      // Get position on curve
      const point = this.pathCurve.getPoint(p.progress);

      this.positions[i3] = point.x;
      this.positions[i3 + 1] = point.y;
      this.positions[i3 + 2] = point.z;

      this.progress[i] = p.progress;
      this.sizes[i] = p.size;
      this.offsets[i2] = p.offset.x;
      this.offsets[i2 + 1] = p.offset.y;
      this.seeds[i] = p.seed;
    }
  }

  /**
   * Update particle system (call each frame)
   */
  public update(delta: number): void {
    this.time += delta;
    this.material.uniforms.time.value = this.time;

    // Update each particle
    for (let i = 0; i < this.config.particleCount; i++) {
      const p = this.particles[i];

      // Move along path
      p.progress += p.speed * delta;

      // Reset or stop at end
      if (p.progress >= 1) {
        if (this.config.loop) {
          this.particles[i] = this.createParticle(false);
        } else {
          p.progress = 1;
        }
      }
    }

    // Update GPU buffers
    this.updateBuffers();

    const posAttr = this.geometry.getAttribute('position') as THREE.BufferAttribute;
    const progAttr = this.geometry.getAttribute('aProgress') as THREE.BufferAttribute;

    posAttr.needsUpdate = true;
    progAttr.needsUpdate = true;
  }

  /**
   * Set a new path for the river
   */
  public setPath(path: THREE.Vector3[]): void {
    this.config.path = path;
    this.pathCurve = new THREE.CatmullRomCurve3(path, this.config.loop);
  }

  /**
   * Set flow speed
   */
  public setFlowSpeed(speed: number): void {
    this.config.flowSpeed = speed;
    for (const p of this.particles) {
      p.speed = speed * (1 - this.config.flowSpeedVariation / 2 + Math.random() * this.config.flowSpeedVariation);
    }
  }

  /**
   * Set river width
   */
  public setWidth(width: number): void {
    this.config.width = width;
    for (const p of this.particles) {
      p.offset.set(
        (Math.random() - 0.5) * width,
        (Math.random() - 0.5) * width
      );
    }
  }

  /**
   * Set colors
   */
  public setColors(core: number, glow: number, trail: number): void {
    this.material.uniforms.coreColor.value = new THREE.Color(core);
    this.material.uniforms.glowColor.value = new THREE.Color(glow);
    this.material.uniforms.trailColor.value = new THREE.Color(trail);
  }

  /**
   * Set turbulence amount
   */
  public setTurbulence(amount: number, frequency?: number): void {
    this.config.turbulence = amount;
    this.material.uniforms.turbulence.value = amount;

    if (frequency !== undefined) {
      this.config.turbulenceFrequency = frequency;
      this.material.uniforms.turbulenceFrequency.value = frequency;
    }
  }

  /**
   * Burst effect - spawn many particles at once
   */
  public burst(count: number = 100): void {
    const burstCount = Math.min(count, this.config.particleCount);
    for (let i = 0; i < burstCount; i++) {
      this.particles[i] = this.createParticle(false);
      this.particles[i].speed *= 2; // Faster burst
    }
  }

  /**
   * Dispose of all resources
   */
  public dispose(): void {
    this.geometry.dispose();
    this.material.dispose();
    this.remove(this.points);
  }
}

/**
 * Create a circular data river path
 */
export function createCircularRiverPath(
  center: THREE.Vector3,
  radius: number,
  height: number = 0,
  segments: number = 32
): THREE.Vector3[] {
  const points: THREE.Vector3[] = [];

  for (let i = 0; i < segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    const y = center.y + Math.sin(angle * 2) * height;

    points.push(new THREE.Vector3(
      center.x + Math.cos(angle) * radius,
      y,
      center.z + Math.sin(angle) * radius
    ));
  }

  return points;
}

/**
 * Create a spiral data river path
 */
export function createSpiralRiverPath(
  center: THREE.Vector3,
  startRadius: number,
  endRadius: number,
  height: number,
  rotations: number = 3,
  segments: number = 100
): THREE.Vector3[] {
  const points: THREE.Vector3[] = [];

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const angle = t * Math.PI * 2 * rotations;
    const radius = startRadius + (endRadius - startRadius) * t;
    const y = center.y + t * height;

    points.push(new THREE.Vector3(
      center.x + Math.cos(angle) * radius,
      y,
      center.z + Math.sin(angle) * radius
    ));
  }

  return points;
}

/**
 * Create a wave data river path
 */
export function createWaveRiverPath(
  start: THREE.Vector3,
  end: THREE.Vector3,
  amplitude: number,
  frequency: number = 2,
  segments: number = 50
): THREE.Vector3[] {
  const points: THREE.Vector3[] = [];
  const direction = new THREE.Vector3().subVectors(end, start);

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const pos = new THREE.Vector3().lerpVectors(start, end, t);

    // Add sine wave perpendicular to direction
    const wave = Math.sin(t * Math.PI * frequency) * amplitude;
    pos.y += wave;

    points.push(pos);
  }

  return points;
}

/**
 * Preset configurations for data rivers
 */
export const DataRiverPresets = {
  /** Standard stat flow */
  statFlow: {
    particleCount: 400,
    width: 3,
    flowSpeed: 0.25,
    particleSize: 2.5,
    glowIntensity: 1.3,
    turbulence: 1.5,
  },

  /** Intense ranking river */
  rankingRiver: {
    particleCount: 600,
    width: 5,
    flowSpeed: 0.4,
    particleSize: 3,
    glowIntensity: 2.0,
    turbulence: 2.5,
    coreColor: RIVER_COLORS.gold,
    glowColor: RIVER_COLORS.ember,
  },

  /** Subtle background flow */
  backgroundFlow: {
    particleCount: 200,
    width: 8,
    flowSpeed: 0.15,
    particleSize: 2,
    glowIntensity: 0.8,
    turbulence: 3,
    fadeIn: 0.2,
    fadeOut: 0.2,
  },

  /** Celebration stream */
  celebration: {
    particleCount: 800,
    width: 4,
    flowSpeed: 0.5,
    flowSpeedVariation: 0.4,
    particleSize: 4,
    sizeVariation: 0.7,
    glowIntensity: 2.5,
    turbulence: 4,
  },
};

export default DataRiverSystem;
