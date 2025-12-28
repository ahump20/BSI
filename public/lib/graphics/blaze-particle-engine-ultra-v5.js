/**
 * Blaze Particle Engine Ultra V5
 *
 * Advanced WebGL2-based particle system with ES module support.
 * Features GPU-accelerated particles with graceful fallback.
 *
 * @version 5.0.0
 */

// Check dependencies
const hasThree = typeof window !== 'undefined' && typeof window.THREE !== 'undefined';

// Logging utility
function log(level, message) {
  const prefix = '[BlazeParticleEngineUltra]';
  if (level === 'error') console.error(prefix, message);
  else if (level === 'warn') console.warn(prefix, message);
  else console.log(prefix, message);
}

// BSI Brand colors
const BLAZE_COLORS = {
  burntOrange: 0xBF5700,
  ember: 0xFF6B35,
  gold: 0xC9A227,
  copper: 0xD97B38,
  sunset: 0xE69551
};

// Color palette presets
const PALETTES = {
  blaze: [BLAZE_COLORS.burntOrange, BLAZE_COLORS.ember, BLAZE_COLORS.gold],
  ember: [BLAZE_COLORS.ember, BLAZE_COLORS.copper, BLAZE_COLORS.sunset],
  gold: [BLAZE_COLORS.gold, BLAZE_COLORS.copper, BLAZE_COLORS.ember]
};

// Stub class for graceful degradation
class StubParticleEngine {
  constructor() { this.enabled = false; }
  start() {}
  stop() {}
  update() {}
  resize() {}
  dispose() {}
  setIntensity() {}
  setPalette() {}
}

/**
 * BlazeParticleEngineUltra - Advanced particle system
 */
export class BlazeParticleEngineUltra {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      particleCount: options.particleCount ?? 200,
      baseSpeed: options.baseSpeed ?? 0.4,
      spread: options.spread ?? 12,
      palette: options.palette ?? 'blaze',
      opacity: options.opacity ?? 0.65,
      size: options.size ?? 0.12,
      turbulence: options.turbulence ?? 0.3,
      responsive: options.responsive !== false,
      ...options
    };

    this.enabled = false;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.particles = null;
    this.animationId = null;
    this.clock = null;
    this._velocities = null;
    this._lifetimes = null;

    this._initialize();
  }

  _initialize() {
    if (!hasThree) {
      log('warn', 'Three.js not available - particle effects disabled');
      return;
    }

    if (!this.container) {
      log('error', 'No container element provided');
      return;
    }

    try {
      const THREE = window.THREE;

      // Create scene
      this.scene = new THREE.Scene();

      // Create camera
      this.camera = new THREE.PerspectiveCamera(
        55,
        this.container.clientWidth / this.container.clientHeight,
        0.1,
        1000
      );
      this.camera.position.z = 18;

      // Create renderer with WebGL2
      this.renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
        stencil: false,
        depth: false
      });
      this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      this.renderer.setClearColor(0x000000, 0);

      // Style canvas
      this.renderer.domElement.style.position = 'absolute';
      this.renderer.domElement.style.top = '0';
      this.renderer.domElement.style.left = '0';
      this.renderer.domElement.style.pointerEvents = 'none';

      this.container.appendChild(this.renderer.domElement);

      // Create particles
      this._createParticles();

      // Clock for animation
      this.clock = new THREE.Clock();

      this.enabled = true;
      log('info', `Particle engine Ultra initialized with ${this.options.particleCount} particles`);

      // Handle resize
      if (this.options.responsive) {
        this._boundResize = this.resize.bind(this);
        window.addEventListener('resize', this._boundResize);
      }

    } catch (error) {
      log('error', 'Failed to initialize particle engine: ' + error.message);
      this.enabled = false;
    }
  }

  _createParticles() {
    if (!hasThree || !this.scene) return;

    const THREE = window.THREE;
    const count = this.options.particleCount;
    const colors = PALETTES[this.options.palette] || PALETTES.blaze;

    // Geometry
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colorAttr = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const lifetimes = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;

      // Random position across spread
      positions[i3] = (Math.random() - 0.5) * this.options.spread * 2.5;
      positions[i3 + 1] = (Math.random() - 0.5) * this.options.spread * 2;
      positions[i3 + 2] = (Math.random() - 0.5) * this.options.spread * 0.5;

      // Velocity with upward bias and turbulence
      velocities[i3] = (Math.random() - 0.5) * this.options.turbulence;
      velocities[i3 + 1] = Math.random() * this.options.baseSpeed + 0.15;
      velocities[i3 + 2] = (Math.random() - 0.5) * this.options.turbulence * 0.5;

      // Random color from palette
      const colorHex = colors[Math.floor(Math.random() * colors.length)];
      const color = new THREE.Color(colorHex);
      colorAttr[i3] = color.r;
      colorAttr[i3 + 1] = color.g;
      colorAttr[i3 + 2] = color.b;

      // Random size with variation
      sizes[i] = (Math.random() * 0.5 + 0.5) * this.options.size;

      // Random lifetime phase
      lifetimes[i] = Math.random();
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colorAttr, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    // Store for animation
    this._velocities = velocities;
    this._lifetimes = lifetimes;

    // Material with additive blending for glow effect
    const material = new THREE.PointsMaterial({
      size: this.options.size,
      vertexColors: true,
      transparent: true,
      opacity: this.options.opacity,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true
    });

    // Points mesh
    this.particles = new THREE.Points(geometry, material);
    this.scene.add(this.particles);
  }

  start() {
    if (!this.enabled || this.animationId) return;

    const animate = () => {
      this.animationId = requestAnimationFrame(animate);
      this.update();
    };

    animate();
    log('info', 'Animation started');
  }

  stop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
      log('info', 'Animation stopped');
    }
  }

  update() {
    if (!this.enabled || !this.particles) return;

    try {
      const delta = this.clock.getDelta();
      const time = this.clock.getElapsedTime();
      const positions = this.particles.geometry.attributes.position.array;
      const sizes = this.particles.geometry.attributes.size.array;
      const count = positions.length / 3;

      for (let i = 0; i < count; i++) {
        const i3 = i * 3;

        // Update position with velocity
        positions[i3] += this._velocities[i3] * delta;
        positions[i3 + 1] += this._velocities[i3 + 1] * delta;
        positions[i3 + 2] += this._velocities[i3 + 2] * delta;

        // Add subtle horizontal sway
        positions[i3] += Math.sin(time * 2 + i * 0.1) * 0.002;

        // Update lifetime and fade size
        this._lifetimes[i] += delta * 0.3;
        if (this._lifetimes[i] > 1) {
          this._lifetimes[i] = 0;
        }

        // Size based on lifetime (fade out at end)
        const lifePhase = this._lifetimes[i];
        const fadeMultiplier = lifePhase < 0.2 ? lifePhase / 0.2 :
                               lifePhase > 0.8 ? (1 - lifePhase) / 0.2 : 1;
        sizes[i] = this.options.size * (0.5 + Math.random() * 0.5) * fadeMultiplier;

        // Reset particle if it goes too high
        if (positions[i3 + 1] > this.options.spread) {
          positions[i3] = (Math.random() - 0.5) * this.options.spread * 2.5;
          positions[i3 + 1] = -this.options.spread;
          positions[i3 + 2] = (Math.random() - 0.5) * this.options.spread * 0.5;
          this._lifetimes[i] = 0;
        }
      }

      this.particles.geometry.attributes.position.needsUpdate = true;
      this.particles.geometry.attributes.size.needsUpdate = true;

      // Render
      this.renderer.render(this.scene, this.camera);

    } catch (error) {
      log('error', 'Update error: ' + error.message);
      this.stop();
    }
  }

  resize() {
    if (!this.enabled || !this.container) return;

    try {
      const width = this.container.clientWidth;
      const height = this.container.clientHeight;

      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height);
    } catch (error) {
      log('error', 'Resize error: ' + error.message);
    }
  }

  setIntensity(intensity) {
    if (!this.enabled || !this.particles) return;

    try {
      this.particles.material.opacity = Math.max(0, Math.min(1, intensity * this.options.opacity));
    } catch (error) {
      log('error', 'setIntensity error: ' + error.message);
    }
  }

  setPalette(paletteName) {
    if (!this.enabled || !this.particles) return;
    if (!PALETTES[paletteName]) return;

    try {
      const colors = PALETTES[paletteName];
      const colorAttr = this.particles.geometry.attributes.color.array;
      const count = colorAttr.length / 3;
      const THREE = window.THREE;

      for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        const colorHex = colors[Math.floor(Math.random() * colors.length)];
        const color = new THREE.Color(colorHex);
        colorAttr[i3] = color.r;
        colorAttr[i3 + 1] = color.g;
        colorAttr[i3 + 2] = color.b;
      }

      this.particles.geometry.attributes.color.needsUpdate = true;
      this.options.palette = paletteName;
    } catch (error) {
      log('error', 'setPalette error: ' + error.message);
    }
  }

  dispose() {
    this.stop();

    if (this._boundResize) {
      window.removeEventListener('resize', this._boundResize);
    }

    if (this.particles) {
      if (this.particles.geometry) this.particles.geometry.dispose();
      if (this.particles.material) this.particles.material.dispose();
      if (this.scene) this.scene.remove(this.particles);
    }

    if (this.renderer) {
      this.renderer.dispose();
      if (this.renderer.domElement?.parentNode) {
        this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
      }
    }

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.particles = null;
    this._velocities = null;
    this._lifetimes = null;
    this.enabled = false;

    log('info', 'Particle engine Ultra disposed');
  }

  isEnabled() {
    return this.enabled;
  }

  // Static helpers
  static get hasThree() { return hasThree; }
  static get COLORS() { return BLAZE_COLORS; }
  static get PALETTES() { return PALETTES; }
}

// Export as default
export default BlazeParticleEngineUltra;

// Make available globally
if (typeof window !== 'undefined') {
  window.BlazeParticleEngineUltra = hasThree ? BlazeParticleEngineUltra : StubParticleEngine;
}
