/**
 * VolumetricDustSystem
 *
 * Stadium dirt particles for atmospheric effects.
 * Creates realistic floating dust, mist, and atmospheric
 * particles that respond to wind and camera position.
 *
 * @author Austin Humphrey
 * @version 1.0.0
 */

import * as THREE from 'three';

/**
 * Brand colors
 */
const DUST_COLORS = {
  texasSoil: 0x8B4513,
  burntOrange: 0xBF5700,
  cream: 0xFAF8F5,
  gold: 0xC9A227,
  charcoal: 0x1A1A1A,
};

/**
 * Configuration for volumetric dust system
 */
export interface VolumetricDustConfig {
  /** Number of dust particles */
  particleCount?: number;
  /** Volume width */
  volumeWidth?: number;
  /** Volume height */
  volumeHeight?: number;
  /** Volume depth */
  volumeDepth?: number;
  /** Base particle size */
  particleSize?: number;
  /** Size variation */
  sizeVariation?: number;
  /** Primary dust color */
  color?: number;
  /** Secondary color for variation */
  secondaryColor?: number;
  /** Base opacity */
  opacity?: number;
  /** Wind direction and strength */
  wind?: THREE.Vector3;
  /** Wind variation (turbulence) */
  windTurbulence?: number;
  /** Gravity effect */
  gravity?: number;
  /** Particle drift speed */
  driftSpeed?: number;
  /** Depth fade distance */
  depthFade?: number;
  /** Enable fog interaction */
  fogInteraction?: boolean;
  /** Particle brightness */
  brightness?: number;
  /** Respawn rate (0-1) */
  respawnRate?: number;
  /** Follow camera */
  followCamera?: boolean;
}

/**
 * Individual dust particle
 */
interface DustParticle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  baseSize: number;
  seed: number;
  life: number;
  maxLife: number;
  colorBlend: number;
}

/**
 * Volumetric Dust Particle System
 */
export class VolumetricDustSystem extends THREE.Object3D {
  private config: Required<VolumetricDustConfig>;
  private particles: DustParticle[] = [];
  private geometry: THREE.BufferGeometry;
  private material: THREE.ShaderMaterial;
  private points: THREE.Points;
  private time: number = 0;
  private camera: THREE.Camera | null = null;

  // Buffer arrays
  private positions: Float32Array;
  private sizes: Float32Array;
  private opacities: Float32Array;
  private seeds: Float32Array;
  private colorBlends: Float32Array;

  // Volume bounds for respawning
  private volumeMin: THREE.Vector3;
  private volumeMax: THREE.Vector3;

  private static defaultConfig: Required<VolumetricDustConfig> = {
    particleCount: 2000,
    volumeWidth: 200,
    volumeHeight: 100,
    volumeDepth: 200,
    particleSize: 2,
    sizeVariation: 0.8,
    color: DUST_COLORS.texasSoil,
    secondaryColor: DUST_COLORS.cream,
    opacity: 0.4,
    wind: new THREE.Vector3(5, 0, 2),
    windTurbulence: 3,
    gravity: -0.5,
    driftSpeed: 1,
    depthFade: 100,
    fogInteraction: true,
    brightness: 1.0,
    respawnRate: 1.0,
    followCamera: true,
  };

  constructor(config?: VolumetricDustConfig) {
    super();
    this.config = { ...VolumetricDustSystem.defaultConfig, ...config };

    // Calculate volume bounds
    this.volumeMin = new THREE.Vector3(
      -this.config.volumeWidth / 2,
      0,
      -this.config.volumeDepth / 2
    );
    this.volumeMax = new THREE.Vector3(
      this.config.volumeWidth / 2,
      this.config.volumeHeight,
      this.config.volumeDepth / 2
    );

    // Initialize arrays
    const count = this.config.particleCount;
    this.positions = new Float32Array(count * 3);
    this.sizes = new Float32Array(count);
    this.opacities = new Float32Array(count);
    this.seeds = new Float32Array(count);
    this.colorBlends = new Float32Array(count);

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
   * Initialize particle pool
   */
  private initializeParticles(): void {
    for (let i = 0; i < this.config.particleCount; i++) {
      this.particles.push(this.createParticle());
    }
  }

  /**
   * Create a new particle with randomized properties
   */
  private createParticle(): DustParticle {
    const sizeVar = this.config.sizeVariation;

    return {
      position: new THREE.Vector3(
        this.volumeMin.x + Math.random() * (this.volumeMax.x - this.volumeMin.x),
        this.volumeMin.y + Math.random() * (this.volumeMax.y - this.volumeMin.y),
        this.volumeMin.z + Math.random() * (this.volumeMax.z - this.volumeMin.z)
      ),
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * this.config.driftSpeed,
        (Math.random() - 0.5) * this.config.driftSpeed * 0.5,
        (Math.random() - 0.5) * this.config.driftSpeed
      ),
      baseSize: this.config.particleSize * (1 - sizeVar / 2 + Math.random() * sizeVar),
      seed: Math.random(),
      life: Math.random(), // Start at random point in lifecycle
      maxLife: 10 + Math.random() * 20,
      colorBlend: Math.random(),
    };
  }

  /**
   * Create buffer geometry
   */
  private createGeometry(): THREE.BufferGeometry {
    const geometry = new THREE.BufferGeometry();

    this.updateBuffers();

    geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    geometry.setAttribute('aSize', new THREE.BufferAttribute(this.sizes, 1));
    geometry.setAttribute('aOpacity', new THREE.BufferAttribute(this.opacities, 1));
    geometry.setAttribute('aSeed', new THREE.BufferAttribute(this.seeds, 1));
    geometry.setAttribute('aColorBlend', new THREE.BufferAttribute(this.colorBlends, 1));

    return geometry;
  }

  /**
   * Create shader material
   */
  private createMaterial(): THREE.ShaderMaterial {
    return new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        color: { value: new THREE.Color(this.config.color) },
        secondaryColor: { value: new THREE.Color(this.config.secondaryColor) },
        opacity: { value: this.config.opacity },
        brightness: { value: this.config.brightness },
        cameraPosition: { value: new THREE.Vector3() },
        depthFade: { value: this.config.depthFade },
        fogDensity: { value: 0.002 },
        fogColor: { value: new THREE.Color(0x0D0D0D) },
        useFog: { value: this.config.fogInteraction },
      },

      vertexShader: `
        uniform float time;
        uniform float depthFade;
        uniform vec3 cameraPosition;

        attribute float aSize;
        attribute float aOpacity;
        attribute float aSeed;
        attribute float aColorBlend;

        varying float vOpacity;
        varying float vColorBlend;
        varying float vDepthFade;

        void main() {
          vColorBlend = aColorBlend;

          vec4 worldPos = modelMatrix * vec4(position, 1.0);
          vec4 mvPosition = viewMatrix * worldPos;

          // Calculate distance from camera for depth fade
          float dist = length(worldPos.xyz - cameraPosition);
          vDepthFade = 1.0 - smoothstep(depthFade * 0.3, depthFade, dist);

          // Subtle size variation over time
          float sizeVar = 0.8 + 0.2 * sin(time * 2.0 + aSeed * 6.28);
          float finalSize = aSize * sizeVar;

          // Distance-based size
          finalSize *= (150.0 / -mvPosition.z);

          // Apply opacity
          vOpacity = aOpacity * vDepthFade;

          gl_PointSize = max(finalSize, 0.5);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,

      fragmentShader: `
        uniform vec3 color;
        uniform vec3 secondaryColor;
        uniform float opacity;
        uniform float brightness;
        uniform bool useFog;
        uniform float fogDensity;
        uniform vec3 fogColor;

        varying float vOpacity;
        varying float vColorBlend;
        varying float vDepthFade;

        void main() {
          vec2 center = gl_PointCoord - vec2(0.5);
          float dist = length(center);

          if (dist > 0.5) discard;

          // Soft circular falloff
          float falloff = 1.0 - smoothstep(0.0, 0.5, dist);
          falloff = pow(falloff, 1.5);

          // Mix colors
          vec3 finalColor = mix(color, secondaryColor, vColorBlend);
          finalColor *= brightness;

          // Apply fog
          if (useFog) {
            float fogFactor = 1.0 - vDepthFade;
            finalColor = mix(finalColor, fogColor, fogFactor * 0.5);
          }

          float alpha = falloff * vOpacity * opacity;

          gl_FragColor = vec4(finalColor, alpha);
        }
      `,

      transparent: true,
      blending: THREE.NormalBlending,
      depthTest: true,
      depthWrite: false,
    });
  }

  /**
   * Update buffer arrays
   */
  private updateBuffers(): void {
    for (let i = 0; i < this.config.particleCount; i++) {
      const p = this.particles[i];
      const i3 = i * 3;

      this.positions[i3] = p.position.x;
      this.positions[i3 + 1] = p.position.y;
      this.positions[i3 + 2] = p.position.z;

      this.sizes[i] = p.baseSize;
      this.opacities[i] = 1.0 - Math.abs(p.life - 0.5) * 2; // Fade in/out
      this.seeds[i] = p.seed;
      this.colorBlends[i] = p.colorBlend;
    }
  }

  /**
   * Respawn particle at random edge position
   */
  private respawnParticle(particle: DustParticle): void {
    // Respawn at edge of volume based on wind direction
    const wind = this.config.wind;
    const edge = Math.random();

    if (edge < 0.5 && Math.abs(wind.x) > 0.1) {
      // Spawn on opposite side of wind X
      particle.position.x = wind.x > 0 ? this.volumeMin.x : this.volumeMax.x;
      particle.position.y = this.volumeMin.y + Math.random() * (this.volumeMax.y - this.volumeMin.y);
      particle.position.z = this.volumeMin.z + Math.random() * (this.volumeMax.z - this.volumeMin.z);
    } else if (edge < 0.8 && Math.abs(wind.z) > 0.1) {
      // Spawn on opposite side of wind Z
      particle.position.x = this.volumeMin.x + Math.random() * (this.volumeMax.x - this.volumeMin.x);
      particle.position.y = this.volumeMin.y + Math.random() * (this.volumeMax.y - this.volumeMin.y);
      particle.position.z = wind.z > 0 ? this.volumeMin.z : this.volumeMax.z;
    } else {
      // Random position
      particle.position.set(
        this.volumeMin.x + Math.random() * (this.volumeMax.x - this.volumeMin.x),
        this.volumeMin.y + Math.random() * (this.volumeMax.y - this.volumeMin.y),
        this.volumeMin.z + Math.random() * (this.volumeMax.z - this.volumeMin.z)
      );
    }

    particle.life = 0;
    particle.maxLife = 10 + Math.random() * 20;
    particle.velocity.set(
      (Math.random() - 0.5) * this.config.driftSpeed,
      (Math.random() - 0.5) * this.config.driftSpeed * 0.5,
      (Math.random() - 0.5) * this.config.driftSpeed
    );
  }

  /**
   * Set camera reference for following
   */
  public setCamera(camera: THREE.Camera): void {
    this.camera = camera;
  }

  /**
   * Update dust system (call each frame)
   */
  public update(delta: number): void {
    this.time += delta;
    this.material.uniforms.time.value = this.time;

    // Update camera position uniform
    if (this.camera) {
      this.material.uniforms.cameraPosition.value.copy(this.camera.position);

      // Follow camera if enabled
      if (this.config.followCamera) {
        this.position.x = this.camera.position.x;
        this.position.z = this.camera.position.z;
      }
    }

    const wind = this.config.wind;
    const turbulence = this.config.windTurbulence;

    for (let i = 0; i < this.config.particleCount; i++) {
      const p = this.particles[i];

      // Update life
      p.life += delta / p.maxLife;

      // Check respawn
      if (p.life >= 1.0 || this.isOutOfBounds(p.position)) {
        if (Math.random() < this.config.respawnRate) {
          this.respawnParticle(p);
        } else {
          p.life = 1.0; // Keep dead until respawn
        }
        continue;
      }

      // Apply wind with turbulence
      const turbX = Math.sin(this.time * 2 + p.seed * 10) * turbulence;
      const turbY = Math.cos(this.time * 1.5 + p.seed * 8) * turbulence * 0.5;
      const turbZ = Math.sin(this.time * 1.8 + p.seed * 12) * turbulence;

      p.velocity.x += (wind.x + turbX - p.velocity.x) * delta;
      p.velocity.y += (wind.y + turbY + this.config.gravity - p.velocity.y) * delta;
      p.velocity.z += (wind.z + turbZ - p.velocity.z) * delta;

      // Update position
      p.position.addScaledVector(p.velocity, delta);
    }

    // Update buffers
    this.updateBuffers();

    const posAttr = this.geometry.getAttribute('position') as THREE.BufferAttribute;
    const opacityAttr = this.geometry.getAttribute('aOpacity') as THREE.BufferAttribute;

    posAttr.needsUpdate = true;
    opacityAttr.needsUpdate = true;
  }

  /**
   * Check if position is outside volume
   */
  private isOutOfBounds(position: THREE.Vector3): boolean {
    return (
      position.x < this.volumeMin.x - 10 ||
      position.x > this.volumeMax.x + 10 ||
      position.y < this.volumeMin.y - 10 ||
      position.y > this.volumeMax.y + 10 ||
      position.z < this.volumeMin.z - 10 ||
      position.z > this.volumeMax.z + 10
    );
  }

  /**
   * Set wind direction and strength
   */
  public setWind(wind: THREE.Vector3): void {
    this.config.wind.copy(wind);
  }

  /**
   * Set dust colors
   */
  public setColors(primary: number, secondary: number): void {
    this.material.uniforms.color.value = new THREE.Color(primary);
    this.material.uniforms.secondaryColor.value = new THREE.Color(secondary);
  }

  /**
   * Set brightness
   */
  public setBrightness(brightness: number): void {
    this.config.brightness = brightness;
    this.material.uniforms.brightness.value = brightness;
  }

  /**
   * Set opacity
   */
  public setOpacity(opacity: number): void {
    this.config.opacity = opacity;
    this.material.uniforms.opacity.value = opacity;
  }

  /**
   * Trigger dust burst at position
   */
  public burst(position: THREE.Vector3, count: number = 200, force: number = 20): void {
    const burstCount = Math.min(count, this.config.particleCount);

    for (let i = 0; i < burstCount; i++) {
      const p = this.particles[i];

      p.position.copy(position);
      p.position.x += (Math.random() - 0.5) * 5;
      p.position.y += Math.random() * 3;
      p.position.z += (Math.random() - 0.5) * 5;

      // Radial burst velocity
      const angle = Math.random() * Math.PI * 2;
      const upAngle = Math.random() * Math.PI * 0.5;
      const burstForce = force * (0.5 + Math.random() * 0.5);

      p.velocity.set(
        Math.cos(angle) * Math.sin(upAngle) * burstForce,
        Math.cos(upAngle) * burstForce,
        Math.sin(angle) * Math.sin(upAngle) * burstForce
      );

      p.life = 0;
      p.maxLife = 2 + Math.random() * 3;
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
 * Preset configurations for dust effects
 */
export const VolumetricDustPresets = {
  /** Baseball infield dirt */
  infieldDirt: {
    particleCount: 1500,
    color: DUST_COLORS.texasSoil,
    secondaryColor: DUST_COLORS.cream,
    opacity: 0.3,
    brightness: 1.2,
    wind: new THREE.Vector3(3, 0, 1),
    windTurbulence: 2,
  },

  /** Stadium atmosphere */
  stadiumHaze: {
    particleCount: 3000,
    volumeWidth: 400,
    volumeHeight: 150,
    volumeDepth: 400,
    particleSize: 3,
    color: DUST_COLORS.cream,
    secondaryColor: DUST_COLORS.charcoal,
    opacity: 0.15,
    brightness: 0.8,
    wind: new THREE.Vector3(2, 0.5, 1),
    windTurbulence: 1,
    depthFade: 200,
  },

  /** Light mist */
  mist: {
    particleCount: 2500,
    particleSize: 4,
    color: DUST_COLORS.cream,
    secondaryColor: DUST_COLORS.cream,
    opacity: 0.1,
    brightness: 0.6,
    wind: new THREE.Vector3(1, 0.2, 0.5),
    windTurbulence: 0.5,
    gravity: -0.1,
  },

  /** Intense dust storm */
  dustStorm: {
    particleCount: 4000,
    particleSize: 2.5,
    color: DUST_COLORS.texasSoil,
    secondaryColor: DUST_COLORS.burntOrange,
    opacity: 0.5,
    brightness: 1.0,
    wind: new THREE.Vector3(15, 2, 5),
    windTurbulence: 8,
    gravity: -2,
  },

  /** Golden hour particles */
  goldenHour: {
    particleCount: 1000,
    particleSize: 2,
    color: DUST_COLORS.gold,
    secondaryColor: DUST_COLORS.cream,
    opacity: 0.25,
    brightness: 1.5,
    wind: new THREE.Vector3(2, 0.5, 1),
    windTurbulence: 1.5,
  },

  /** Slide dust burst */
  slideDust: {
    particleCount: 500,
    volumeWidth: 20,
    volumeHeight: 10,
    volumeDepth: 20,
    particleSize: 3,
    color: DUST_COLORS.texasSoil,
    secondaryColor: DUST_COLORS.burntOrange,
    opacity: 0.6,
    brightness: 1.3,
    wind: new THREE.Vector3(0, 5, 0),
    windTurbulence: 5,
    gravity: -10,
    respawnRate: 0,
  },
};

export default VolumetricDustSystem;
