/**
 * ExplosionSystem
 *
 * Home run, touchdown, and big play celebrations!
 * Creates spectacular particle bursts with customizable
 * colors, physics, and visual effects.
 *
 * @author Austin Humphrey
 * @version 1.0.0
 */

import * as THREE from 'three';

/**
 * Brand colors
 */
const EXPLOSION_COLORS = {
  ember: 0xFF6B35,
  burntOrange: 0xBF5700,
  gold: 0xC9A227,
  texasSoil: 0x8B4513,
  cream: 0xFAF8F5,
  white: 0xFFFFFF,
};

/**
 * Configuration for explosion system
 */
export interface ExplosionConfig {
  /** Number of particles per explosion */
  particleCount?: number;
  /** Initial explosion force */
  explosionForce?: number;
  /** Variation in explosion force */
  forceVariation?: number;
  /** Gravity applied to particles */
  gravity?: number;
  /** Air resistance / drag */
  drag?: number;
  /** Particle lifespan in seconds */
  lifespan?: number;
  /** Variation in lifespan */
  lifespanVariation?: number;
  /** Base particle size */
  particleSize?: number;
  /** Size variation */
  sizeVariation?: number;
  /** Core color (brightest) */
  coreColor?: number;
  /** Primary color */
  primaryColor?: number;
  /** Secondary color (outer) */
  secondaryColor?: number;
  /** Glow intensity */
  glowIntensity?: number;
  /** Whether particles emit sparks */
  sparks?: boolean;
  /** Spark count per particle */
  sparkCount?: number;
  /** Enable smoke trail */
  smoke?: boolean;
  /** Rotation speed of particles */
  rotationSpeed?: number;
  /** Ground bounce */
  bounce?: boolean;
  /** Ground level Y position */
  groundLevel?: number;
  /** Bounce energy retention */
  bounceFactor?: number;
}

/**
 * Individual explosion particle
 */
interface ExplosionParticle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
  size: number;
  rotation: number;
  rotationSpeed: number;
  seed: number;
  colorPhase: number;
  active: boolean;
}

/**
 * Explosion Particle System
 */
export class ExplosionSystem extends THREE.Object3D {
  private config: Required<ExplosionConfig>;
  private particles: ExplosionParticle[] = [];
  private geometry: THREE.BufferGeometry;
  private material: THREE.ShaderMaterial;
  private points: THREE.Points;
  private time: number = 0;
  private isExploding: boolean = false;

  // Buffer arrays
  private positions: Float32Array;
  private lifetimes: Float32Array;
  private sizes: Float32Array;
  private rotations: Float32Array;
  private seeds: Float32Array;
  private colorPhases: Float32Array;

  private static defaultConfig: Required<ExplosionConfig> = {
    particleCount: 300,
    explosionForce: 50,
    forceVariation: 0.5,
    gravity: -30,
    drag: 0.98,
    lifespan: 2.5,
    lifespanVariation: 0.5,
    particleSize: 8,
    sizeVariation: 0.6,
    coreColor: EXPLOSION_COLORS.white,
    primaryColor: EXPLOSION_COLORS.ember,
    secondaryColor: EXPLOSION_COLORS.burntOrange,
    glowIntensity: 2.5,
    sparks: true,
    sparkCount: 3,
    smoke: true,
    rotationSpeed: 5,
    bounce: true,
    groundLevel: 0,
    bounceFactor: 0.3,
  };

  constructor(config?: ExplosionConfig) {
    super();
    this.config = { ...ExplosionSystem.defaultConfig, ...config };

    // Initialize arrays
    const count = this.config.particleCount;
    this.positions = new Float32Array(count * 3);
    this.lifetimes = new Float32Array(count);
    this.sizes = new Float32Array(count);
    this.rotations = new Float32Array(count);
    this.seeds = new Float32Array(count);
    this.colorPhases = new Float32Array(count);

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
   * Initialize particle pool (all inactive)
   */
  private initializeParticles(): void {
    for (let i = 0; i < this.config.particleCount; i++) {
      this.particles.push({
        position: new THREE.Vector3(),
        velocity: new THREE.Vector3(),
        life: 0,
        maxLife: 0,
        size: 0,
        rotation: 0,
        rotationSpeed: 0,
        seed: Math.random(),
        colorPhase: Math.random(),
        active: false,
      });
    }
  }

  /**
   * Create buffer geometry
   */
  private createGeometry(): THREE.BufferGeometry {
    const geometry = new THREE.BufferGeometry();

    geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    geometry.setAttribute('aLifetime', new THREE.BufferAttribute(this.lifetimes, 1));
    geometry.setAttribute('aSize', new THREE.BufferAttribute(this.sizes, 1));
    geometry.setAttribute('aRotation', new THREE.BufferAttribute(this.rotations, 1));
    geometry.setAttribute('aSeed', new THREE.BufferAttribute(this.seeds, 1));
    geometry.setAttribute('aColorPhase', new THREE.BufferAttribute(this.colorPhases, 1));

    return geometry;
  }

  /**
   * Create shader material
   */
  private createMaterial(): THREE.ShaderMaterial {
    return new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        coreColor: { value: new THREE.Color(this.config.coreColor) },
        primaryColor: { value: new THREE.Color(this.config.primaryColor) },
        secondaryColor: { value: new THREE.Color(this.config.secondaryColor) },
        glowIntensity: { value: this.config.glowIntensity },
      },

      vertexShader: `
        uniform float time;

        attribute float aLifetime;
        attribute float aSize;
        attribute float aRotation;
        attribute float aSeed;
        attribute float aColorPhase;

        varying float vLifetime;
        varying float vRotation;
        varying float vColorPhase;
        varying float vFlicker;

        float hash(float n) {
          return fract(sin(n) * 43758.5453123);
        }

        void main() {
          vLifetime = aLifetime;
          vRotation = aRotation;
          vColorPhase = aColorPhase;

          // Flicker effect
          float flickerPhase = time * 15.0 + aSeed * 6.28;
          vFlicker = 0.7 + 0.3 * sin(flickerPhase);
          vFlicker += hash(aSeed + floor(time * 20.0)) * 0.15;

          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);

          // Size based on lifetime (grow quickly, shrink slowly)
          float lifetimeFactor = aLifetime < 0.1
            ? aLifetime / 0.1
            : 1.0 - pow(aLifetime, 0.5);
          float finalSize = aSize * lifetimeFactor * vFlicker;
          finalSize *= (400.0 / -mvPosition.z);

          gl_PointSize = max(finalSize, 0.0);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,

      fragmentShader: `
        uniform vec3 coreColor;
        uniform vec3 primaryColor;
        uniform vec3 secondaryColor;
        uniform float glowIntensity;

        varying float vLifetime;
        varying float vRotation;
        varying float vColorPhase;
        varying float vFlicker;

        mat2 rotate2D(float angle) {
          float s = sin(angle);
          float c = cos(angle);
          return mat2(c, -s, s, c);
        }

        void main() {
          // Rotate UV coordinates
          vec2 center = gl_PointCoord - vec2(0.5);
          center = rotate2D(vRotation) * center;
          float dist = length(center);

          if (dist > 0.5) discard;

          // Create star shape for sparks
          float angle = atan(center.y, center.x);
          float starShape = 0.3 + 0.2 * sin(angle * 5.0 + vRotation);

          // Soft radial gradient with star
          float falloff = 1.0 - smoothstep(0.0, 0.5 * starShape, dist);
          falloff = pow(falloff, 1.5);

          // Color based on lifetime and color phase
          vec3 color;
          float lifetimeColor = vLifetime;

          if (lifetimeColor < 0.15) {
            // Initial flash - core color
            color = coreColor * 2.0;
          } else if (lifetimeColor < 0.4) {
            // Primary phase
            float t = (lifetimeColor - 0.15) / 0.25;
            color = mix(coreColor, primaryColor, t);
          } else if (lifetimeColor < 0.7) {
            // Transition to secondary
            float t = (lifetimeColor - 0.4) / 0.3;
            color = mix(primaryColor, secondaryColor, t);
          } else {
            // Fading out
            float t = (lifetimeColor - 0.7) / 0.3;
            color = mix(secondaryColor, secondaryColor * 0.3, t);
          }

          // Add color phase variation
          color = mix(color, primaryColor, vColorPhase * 0.3);

          // Apply glow and flicker
          color *= glowIntensity * vFlicker;

          // Fade alpha at end of life
          float alpha = falloff * (1.0 - pow(vLifetime, 2.0));

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
   * Trigger an explosion at a position
   */
  public explode(position: THREE.Vector3, intensity: number = 1.0): void {
    this.isExploding = true;

    const force = this.config.explosionForce * intensity;
    const forceVar = this.config.forceVariation;

    for (let i = 0; i < this.config.particleCount; i++) {
      const p = this.particles[i];

      // Reset position to explosion origin
      p.position.copy(position);

      // Random direction on sphere
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      const particleForce = force * (1 - forceVar / 2 + Math.random() * forceVar);

      p.velocity.set(
        Math.sin(phi) * Math.cos(theta) * particleForce,
        Math.sin(phi) * Math.sin(theta) * particleForce * 0.8 + 10, // Bias upward
        Math.cos(phi) * particleForce
      );

      // Randomize properties
      const lifeVar = this.config.lifespanVariation;
      p.maxLife = this.config.lifespan * (1 - lifeVar / 2 + Math.random() * lifeVar);
      p.life = 0;

      const sizeVar = this.config.sizeVariation;
      p.size = this.config.particleSize * (1 - sizeVar / 2 + Math.random() * sizeVar);

      p.rotation = Math.random() * Math.PI * 2;
      p.rotationSpeed = (Math.random() - 0.5) * this.config.rotationSpeed;
      p.seed = Math.random();
      p.colorPhase = Math.random();
      p.active = true;
    }
  }

  /**
   * Update explosion system (call each frame)
   */
  public update(delta: number): void {
    if (!this.isExploding) return;

    this.time += delta;
    this.material.uniforms.time.value = this.time;

    let activeCount = 0;

    for (let i = 0; i < this.config.particleCount; i++) {
      const p = this.particles[i];
      const i3 = i * 3;

      if (!p.active) {
        // Hide inactive particles
        this.positions[i3 + 1] = -10000;
        continue;
      }

      activeCount++;

      // Update life
      p.life += delta;
      if (p.life >= p.maxLife) {
        p.active = false;
        this.positions[i3 + 1] = -10000;
        continue;
      }

      // Apply gravity
      p.velocity.y += this.config.gravity * delta;

      // Apply drag
      p.velocity.multiplyScalar(Math.pow(this.config.drag, delta * 60));

      // Update position
      p.position.addScaledVector(p.velocity, delta);

      // Ground bounce
      if (this.config.bounce && p.position.y < this.config.groundLevel) {
        p.position.y = this.config.groundLevel;
        p.velocity.y *= -this.config.bounceFactor;
        p.velocity.x *= 0.8;
        p.velocity.z *= 0.8;
      }

      // Update rotation
      p.rotation += p.rotationSpeed * delta;

      // Update buffers
      this.positions[i3] = p.position.x;
      this.positions[i3 + 1] = p.position.y;
      this.positions[i3 + 2] = p.position.z;
      this.lifetimes[i] = p.life / p.maxLife;
      this.sizes[i] = p.size;
      this.rotations[i] = p.rotation;
      this.seeds[i] = p.seed;
      this.colorPhases[i] = p.colorPhase;
    }

    // Update geometry attributes
    const posAttr = this.geometry.getAttribute('position') as THREE.BufferAttribute;
    const lifeAttr = this.geometry.getAttribute('aLifetime') as THREE.BufferAttribute;
    const sizeAttr = this.geometry.getAttribute('aSize') as THREE.BufferAttribute;
    const rotAttr = this.geometry.getAttribute('aRotation') as THREE.BufferAttribute;

    posAttr.needsUpdate = true;
    lifeAttr.needsUpdate = true;
    sizeAttr.needsUpdate = true;
    rotAttr.needsUpdate = true;

    // Stop when all particles are dead
    if (activeCount === 0) {
      this.isExploding = false;
    }
  }

  /**
   * Check if explosion is still active
   */
  public get active(): boolean {
    return this.isExploding;
  }

  /**
   * Reset the system (stop all particles)
   */
  public reset(): void {
    for (const p of this.particles) {
      p.active = false;
    }
    this.isExploding = false;
  }

  /**
   * Set colors
   */
  public setColors(core: number, primary: number, secondary: number): void {
    this.material.uniforms.coreColor.value = new THREE.Color(core);
    this.material.uniforms.primaryColor.value = new THREE.Color(primary);
    this.material.uniforms.secondaryColor.value = new THREE.Color(secondary);
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
 * Create multiple synchronized explosions
 */
export function createFireworkSequence(
  system: ExplosionSystem,
  positions: THREE.Vector3[],
  delays: number[] = [],
  intensities: number[] = []
): void {
  positions.forEach((pos, index) => {
    const delay = delays[index] || index * 200;
    const intensity = intensities[index] || 1.0;

    setTimeout(() => {
      system.explode(pos, intensity);
    }, delay);
  });
}

/**
 * Preset configurations for explosions
 */
export const ExplosionPresets = {
  /** Home run celebration */
  homeRun: {
    particleCount: 500,
    explosionForce: 60,
    lifespan: 3.0,
    particleSize: 10,
    glowIntensity: 3.0,
    coreColor: EXPLOSION_COLORS.white,
    primaryColor: EXPLOSION_COLORS.gold,
    secondaryColor: EXPLOSION_COLORS.ember,
  },

  /** Touchdown celebration */
  touchdown: {
    particleCount: 400,
    explosionForce: 50,
    lifespan: 2.5,
    particleSize: 8,
    glowIntensity: 2.5,
    coreColor: EXPLOSION_COLORS.white,
    primaryColor: EXPLOSION_COLORS.ember,
    secondaryColor: EXPLOSION_COLORS.burntOrange,
  },

  /** Strikeout effect */
  strikeout: {
    particleCount: 200,
    explosionForce: 30,
    lifespan: 1.5,
    particleSize: 6,
    glowIntensity: 2.0,
    gravity: -20,
  },

  /** Championship confetti */
  championship: {
    particleCount: 800,
    explosionForce: 40,
    forceVariation: 0.7,
    lifespan: 4.0,
    lifespanVariation: 0.6,
    particleSize: 12,
    sizeVariation: 0.8,
    glowIntensity: 3.5,
    gravity: -15,
    coreColor: EXPLOSION_COLORS.white,
    primaryColor: EXPLOSION_COLORS.gold,
    secondaryColor: EXPLOSION_COLORS.ember,
  },

  /** Subtle hit effect */
  hit: {
    particleCount: 100,
    explosionForce: 20,
    lifespan: 1.0,
    particleSize: 4,
    glowIntensity: 1.5,
    gravity: -40,
  },

  /** Grand slam */
  grandSlam: {
    particleCount: 1000,
    explosionForce: 80,
    lifespan: 4.0,
    particleSize: 12,
    glowIntensity: 4.0,
    coreColor: EXPLOSION_COLORS.white,
    primaryColor: EXPLOSION_COLORS.gold,
    secondaryColor: EXPLOSION_COLORS.ember,
    bounce: true,
    bounceFactor: 0.4,
  },
};

export default ExplosionSystem;
