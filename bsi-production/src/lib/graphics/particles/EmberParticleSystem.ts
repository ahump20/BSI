/**
 * Ember Particle System
 *
 * GPU-accelerated particle system for creating floating ember effects
 * that embody the BSI brand identity. Uses instanced rendering for
 * optimal performance.
 *
 * @author Austin Humphrey
 * @version 1.0.0
 */

import * as THREE from 'three';
import { threeColors } from '../../styles/tokens/colors';

export interface EmberSystemConfig {
  count?: number;
  emitterPosition?: THREE.Vector3;
  emitterRadius?: number;
  emitterHeight?: number;
  particleSize?: number;
  sizeVariation?: number;
  lifespan?: number;
  lifespanVariation?: number;
  riseSpeed?: number;
  riseSpeedVariation?: number;
  drift?: number;
  turbulence?: number;
  colorCore?: number;
  colorGlow?: number;
  colorFade?: number;
  glowIntensity?: number;
  fadeInDuration?: number;
  fadeOutDuration?: number;
}

interface Particle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
  size: number;
  seed: number;
}

/**
 * High-performance ember particle system using GPU instancing
 */
export class EmberParticleSystem extends THREE.Object3D {
  private config: Required<EmberSystemConfig>;
  private particles: Particle[] = [];
  private geometry: THREE.BufferGeometry;
  private material: THREE.ShaderMaterial;
  private points: THREE.Points;
  private time: number = 0;

  // Buffer arrays
  private positions: Float32Array;
  private lifetimes: Float32Array;
  private sizes: Float32Array;
  private seeds: Float32Array;

  private static defaultConfig: Required<EmberSystemConfig> = {
    count: 200,
    emitterPosition: new THREE.Vector3(0, 0, 0),
    emitterRadius: 30,
    emitterHeight: 10,
    particleSize: 8,
    sizeVariation: 0.5,
    lifespan: 4,
    lifespanVariation: 0.5,
    riseSpeed: 15,
    riseSpeedVariation: 0.3,
    drift: 5,
    turbulence: 2,
    colorCore: threeColors.ember,
    colorGlow: threeColors.burntOrange,
    colorFade: threeColors.gold,
    glowIntensity: 1.5,
    fadeInDuration: 0.2,
    fadeOutDuration: 0.3,
  };

  constructor(config?: EmberSystemConfig) {
    super();
    this.config = { ...EmberParticleSystem.defaultConfig, ...config };

    // Initialize buffer arrays
    this.positions = new Float32Array(this.config.count * 3);
    this.lifetimes = new Float32Array(this.config.count);
    this.sizes = new Float32Array(this.config.count);
    this.seeds = new Float32Array(this.config.count);

    // Initialize particles
    this.initializeParticles();

    // Create geometry and material
    this.geometry = this.createGeometry();
    this.material = this.createMaterial();

    // Create points mesh
    this.points = new THREE.Points(this.geometry, this.material);
    this.points.frustumCulled = false; // Particles can be anywhere
    this.add(this.points);
  }

  /**
   * Initialize particle pool
   */
  private initializeParticles(): void {
    for (let i = 0; i < this.config.count; i++) {
      this.particles.push(this.createParticle());
    }
  }

  /**
   * Create a new particle with randomized properties
   */
  private createParticle(): Particle {
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.random() * this.config.emitterRadius;

    const maxLife = this.config.lifespan * (1 - this.config.lifespanVariation / 2 + Math.random() * this.config.lifespanVariation);

    const riseSpeed = this.config.riseSpeed * (1 - this.config.riseSpeedVariation / 2 + Math.random() * this.config.riseSpeedVariation);

    return {
      position: new THREE.Vector3(
        this.config.emitterPosition.x + Math.cos(angle) * radius,
        this.config.emitterPosition.y + Math.random() * this.config.emitterHeight,
        this.config.emitterPosition.z + Math.sin(angle) * radius
      ),
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * this.config.drift,
        riseSpeed,
        (Math.random() - 0.5) * this.config.drift
      ),
      life: Math.random() * maxLife, // Stagger initial spawn
      maxLife: maxLife,
      size: this.config.particleSize * (1 - this.config.sizeVariation / 2 + Math.random() * this.config.sizeVariation),
      seed: Math.random(),
    };
  }

  /**
   * Create buffer geometry with attributes
   */
  private createGeometry(): THREE.BufferGeometry {
    const geometry = new THREE.BufferGeometry();

    // Initial position update
    this.updateBuffers();

    geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    geometry.setAttribute('aLifetime', new THREE.BufferAttribute(this.lifetimes, 1));
    geometry.setAttribute('aSize', new THREE.BufferAttribute(this.sizes, 1));
    geometry.setAttribute('aRandomSeed', new THREE.BufferAttribute(this.seeds, 1));

    return geometry;
  }

  /**
   * Create shader material for ember particles
   */
  private createMaterial(): THREE.ShaderMaterial {
    return new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        pointSize: { value: this.config.particleSize },
        colorCore: { value: new THREE.Color(this.config.colorCore) },
        colorGlow: { value: new THREE.Color(this.config.colorGlow) },
        colorFade: { value: new THREE.Color(this.config.colorFade) },
        glowIntensity: { value: this.config.glowIntensity },
        fadeIn: { value: this.config.fadeInDuration },
        fadeOut: { value: this.config.fadeOutDuration },
      },

      vertexShader: `
        uniform float time;
        uniform float pointSize;
        uniform float fadeIn;
        uniform float fadeOut;

        attribute float aLifetime;
        attribute float aSize;
        attribute float aRandomSeed;

        varying float vLifetime;
        varying float vFlicker;
        varying float vAlpha;

        float hash(float n) {
          return fract(sin(n) * 43758.5453123);
        }

        void main() {
          vLifetime = aLifetime;

          // Flicker effect
          float flickerPhase = time * 2.0 + aRandomSeed * 6.28;
          vFlicker = 0.7 + 0.3 * sin(flickerPhase);
          vFlicker += hash(aRandomSeed + floor(time * 10.0)) * 0.1;

          // Fade in/out
          float fadeInAlpha = smoothstep(0.0, fadeIn, aLifetime);
          float fadeOutAlpha = 1.0 - smoothstep(1.0 - fadeOut, 1.0, aLifetime);
          vAlpha = fadeInAlpha * fadeOutAlpha;

          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);

          // Size based on lifetime (grow then shrink)
          float lifetimeSize = sin(aLifetime * 3.14159);
          float finalSize = pointSize * aSize * lifetimeSize * vFlicker;
          finalSize *= (300.0 / -mvPosition.z);

          gl_PointSize = max(finalSize, 1.0);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,

      fragmentShader: `
        uniform vec3 colorCore;
        uniform vec3 colorGlow;
        uniform vec3 colorFade;
        uniform float glowIntensity;

        varying float vLifetime;
        varying float vFlicker;
        varying float vAlpha;

        void main() {
          // Distance from center
          vec2 center = gl_PointCoord - vec2(0.5);
          float dist = length(center);

          if (dist > 0.5) discard;

          // Soft radial gradient
          float falloff = 1.0 - smoothstep(0.0, 0.5, dist);

          // Color layers
          vec3 color;
          if (dist < 0.15) {
            color = colorCore * 1.5;
          } else if (dist < 0.3) {
            float t = (dist - 0.15) / 0.15;
            color = mix(colorCore, colorGlow, t);
          } else {
            float t = (dist - 0.3) / 0.2;
            color = mix(colorGlow, colorFade, t);
          }

          // Apply glow and flicker
          color *= glowIntensity * vFlicker;

          // Temperature variation based on lifetime (hotter when young)
          float tempShift = vLifetime * 0.2;
          color.r += (1.0 - vLifetime) * 0.1;
          color.b -= (1.0 - vLifetime) * 0.1;

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
   * Update particle positions to buffers
   */
  private updateBuffers(): void {
    for (let i = 0; i < this.config.count; i++) {
      const p = this.particles[i];
      const i3 = i * 3;

      this.positions[i3] = p.position.x;
      this.positions[i3 + 1] = p.position.y;
      this.positions[i3 + 2] = p.position.z;

      this.lifetimes[i] = p.life / p.maxLife;
      this.sizes[i] = p.size / this.config.particleSize;
      this.seeds[i] = p.seed;
    }
  }

  /**
   * Reset a particle to initial state
   */
  private resetParticle(particle: Particle): void {
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.random() * this.config.emitterRadius;

    particle.position.set(
      this.config.emitterPosition.x + Math.cos(angle) * radius,
      this.config.emitterPosition.y + Math.random() * this.config.emitterHeight,
      this.config.emitterPosition.z + Math.sin(angle) * radius
    );

    const riseSpeed = this.config.riseSpeed * (1 - this.config.riseSpeedVariation / 2 + Math.random() * this.config.riseSpeedVariation);

    particle.velocity.set(
      (Math.random() - 0.5) * this.config.drift,
      riseSpeed,
      (Math.random() - 0.5) * this.config.drift
    );

    particle.life = 0;
    particle.maxLife = this.config.lifespan * (1 - this.config.lifespanVariation / 2 + Math.random() * this.config.lifespanVariation);
    particle.size = this.config.particleSize * (1 - this.config.sizeVariation / 2 + Math.random() * this.config.sizeVariation);
    particle.seed = Math.random();
  }

  /**
   * Update particle system (call each frame)
   */
  public update(delta: number): void {
    this.time += delta;
    this.material.uniforms.time.value = this.time;

    for (let i = 0; i < this.config.count; i++) {
      const p = this.particles[i];

      // Update life
      p.life += delta;

      // Reset if dead
      if (p.life >= p.maxLife) {
        this.resetParticle(p);
        continue;
      }

      // Apply turbulence
      const turbX = Math.sin(this.time * 2 + p.seed * 10) * this.config.turbulence;
      const turbZ = Math.cos(this.time * 2 + p.seed * 10) * this.config.turbulence;

      // Update position
      p.position.x += (p.velocity.x + turbX) * delta;
      p.position.y += p.velocity.y * delta;
      p.position.z += (p.velocity.z + turbZ) * delta;

      // Slow down rise over time
      p.velocity.y *= 0.995;
    }

    // Update GPU buffers
    this.updateBuffers();

    const posAttr = this.geometry.getAttribute('position') as THREE.BufferAttribute;
    const lifeAttr = this.geometry.getAttribute('aLifetime') as THREE.BufferAttribute;
    const sizeAttr = this.geometry.getAttribute('aSize') as THREE.BufferAttribute;
    const seedAttr = this.geometry.getAttribute('aRandomSeed') as THREE.BufferAttribute;

    posAttr.needsUpdate = true;
    lifeAttr.needsUpdate = true;
    sizeAttr.needsUpdate = true;
    seedAttr.needsUpdate = true;
  }

  /**
   * Set emitter position
   */
  public setEmitterPosition(position: THREE.Vector3): void {
    this.config.emitterPosition.copy(position);
  }

  /**
   * Set particle count (reinitializes system)
   */
  public setParticleCount(count: number): void {
    this.config.count = count;
    this.positions = new Float32Array(count * 3);
    this.lifetimes = new Float32Array(count);
    this.sizes = new Float32Array(count);
    this.seeds = new Float32Array(count);
    this.particles = [];
    this.initializeParticles();

    // Recreate geometry
    this.remove(this.points);
    this.geometry.dispose();
    this.geometry = this.createGeometry();
    this.points = new THREE.Points(this.geometry, this.material);
    this.add(this.points);
  }

  /**
   * Update configuration
   */
  public setConfig(config: Partial<EmberSystemConfig>): void {
    Object.assign(this.config, config);

    // Update material uniforms
    if (config.colorCore !== undefined) {
      this.material.uniforms.colorCore.value = new THREE.Color(config.colorCore);
    }
    if (config.colorGlow !== undefined) {
      this.material.uniforms.colorGlow.value = new THREE.Color(config.colorGlow);
    }
    if (config.colorFade !== undefined) {
      this.material.uniforms.colorFade.value = new THREE.Color(config.colorFade);
    }
    if (config.glowIntensity !== undefined) {
      this.material.uniforms.glowIntensity.value = config.glowIntensity;
    }
    if (config.particleSize !== undefined) {
      this.material.uniforms.pointSize.value = config.particleSize;
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

export default EmberParticleSystem;
