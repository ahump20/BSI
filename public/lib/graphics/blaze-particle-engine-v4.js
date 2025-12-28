/**
 * Blaze Particle Engine V4
 *
 * WebGL2-based particle system for BSI branded visual effects.
 * Provides ember/fire particle effects with graceful fallback.
 *
 * @version 4.0.0
 */

(function(global) {
  'use strict';

  // Check dependencies
  const hasThree = typeof global.THREE !== 'undefined';

  // Logging utility
  function log(level, message) {
    const prefix = '[BlazeParticleEngine]';
    if (level === 'error') {
      console.error(prefix, message);
    } else if (level === 'warn') {
      console.warn(prefix, message);
    } else {
      console.log(prefix, message);
    }
  }

  // BSI Brand colors
  const BLAZE_COLORS = {
    burntOrange: 0xBF5700,
    ember: 0xFF6B35,
    gold: 0xC9A227,
    copper: 0xD97B38
  };

  // Stub class for when Three.js is not available
  class StubParticleEngine {
    constructor() {
      this.enabled = false;
    }
    start() {}
    stop() {}
    update() {}
    resize() {}
    dispose() {}
    setIntensity() {}
  }

  // Main Particle Engine class
  class BlazeParticleEngine {
    constructor(container, options = {}) {
      this.container = container;
      this.options = {
        particleCount: options.particleCount || 150,
        baseSpeed: options.baseSpeed || 0.5,
        spread: options.spread || 10,
        colors: options.colors || [BLAZE_COLORS.burntOrange, BLAZE_COLORS.ember, BLAZE_COLORS.gold],
        opacity: options.opacity || 0.7,
        size: options.size || 0.15,
        ...options
      };

      this.enabled = false;
      this.scene = null;
      this.camera = null;
      this.renderer = null;
      this.particles = null;
      this.animationId = null;
      this.clock = null;

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
        const THREE = global.THREE;

        // Create scene
        this.scene = new THREE.Scene();

        // Create camera
        this.camera = new THREE.PerspectiveCamera(
          60,
          this.container.clientWidth / this.container.clientHeight,
          0.1,
          1000
        );
        this.camera.position.z = 15;

        // Create renderer
        this.renderer = new THREE.WebGLRenderer({
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance'
        });
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setClearColor(0x000000, 0);

        this.container.appendChild(this.renderer.domElement);

        // Create particles
        this._createParticles();

        // Clock for animation
        this.clock = new THREE.Clock();

        this.enabled = true;
        log('info', 'Particle engine initialized with ' + this.options.particleCount + ' particles');

        // Handle resize
        this._boundResize = this.resize.bind(this);
        window.addEventListener('resize', this._boundResize);

      } catch (error) {
        log('error', 'Failed to initialize particle engine: ' + error.message);
        this.enabled = false;
      }
    }

    _createParticles() {
      if (!hasThree || !this.scene) return;

      const THREE = global.THREE;
      const count = this.options.particleCount;

      // Geometry
      const geometry = new THREE.BufferGeometry();
      const positions = new Float32Array(count * 3);
      const colors = new Float32Array(count * 3);
      const velocities = new Float32Array(count * 3);
      const sizes = new Float32Array(count);

      for (let i = 0; i < count; i++) {
        const i3 = i * 3;

        // Random position
        positions[i3] = (Math.random() - 0.5) * this.options.spread * 2;
        positions[i3 + 1] = (Math.random() - 0.5) * this.options.spread * 2;
        positions[i3 + 2] = (Math.random() - 0.5) * this.options.spread;

        // Random velocity (upward bias)
        velocities[i3] = (Math.random() - 0.5) * 0.5;
        velocities[i3 + 1] = Math.random() * this.options.baseSpeed + 0.2;
        velocities[i3 + 2] = (Math.random() - 0.5) * 0.3;

        // Random color from palette
        const colorHex = this.options.colors[Math.floor(Math.random() * this.options.colors.length)];
        const color = new THREE.Color(colorHex);
        colors[i3] = color.r;
        colors[i3 + 1] = color.g;
        colors[i3 + 2] = color.b;

        // Random size
        sizes[i] = Math.random() * this.options.size + 0.05;
      }

      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

      // Store velocities for animation
      this._velocities = velocities;

      // Material
      const material = new THREE.PointsMaterial({
        size: this.options.size,
        vertexColors: true,
        transparent: true,
        opacity: this.options.opacity,
        blending: THREE.AdditiveBlending,
        depthWrite: false
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
        const positions = this.particles.geometry.attributes.position.array;
        const count = positions.length / 3;

        for (let i = 0; i < count; i++) {
          const i3 = i * 3;

          // Update position based on velocity
          positions[i3] += this._velocities[i3] * delta;
          positions[i3 + 1] += this._velocities[i3 + 1] * delta;
          positions[i3 + 2] += this._velocities[i3 + 2] * delta;

          // Reset particle if it goes too high
          if (positions[i3 + 1] > this.options.spread) {
            positions[i3] = (Math.random() - 0.5) * this.options.spread * 2;
            positions[i3 + 1] = -this.options.spread;
            positions[i3 + 2] = (Math.random() - 0.5) * this.options.spread;
          }
        }

        this.particles.geometry.attributes.position.needsUpdate = true;

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
        if (this.renderer.domElement && this.renderer.domElement.parentNode) {
          this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
        }
      }

      this.scene = null;
      this.camera = null;
      this.renderer = null;
      this.particles = null;
      this.enabled = false;

      log('info', 'Particle engine disposed');
    }

    isEnabled() {
      return this.enabled;
    }
  }

  // Export to global scope
  global.BlazeParticleEngine = hasThree ? BlazeParticleEngine : StubParticleEngine;
  global.BlazeParticleEngine.hasThree = hasThree;
  global.BlazeParticleEngine.COLORS = BLAZE_COLORS;

})(typeof window !== 'undefined' ? window : this);
