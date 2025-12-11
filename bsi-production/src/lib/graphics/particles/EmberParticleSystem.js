/**
 * Ember Particle System
 *
 * Advanced particle system for creating stunning ember/fire effects
 * using BSI brand colors. Features volumetric rendering, physics-based
 * movement, and dynamic color gradients.
 *
 * @author Austin Humphrey
 */

import * as THREE from 'three';
import { createEmberFireMaterial } from '../shaders/emberFire.js';
import { threeColors } from '../../../styles/tokens/colors.js';

export class EmberParticleSystem {
  constructor(count = 1000, options = {}) {
    this.count = count;
    this.options = {
      spawnRate: 10,
      lifeTime: 3.0,
      size: 0.1,
      speed: 0.5,
      turbulence: 0.5,
      intensity: 1.0,
      ...options,
    };

    this.particles = [];
    this.geometry = null;
    this.material = null;
    this.mesh = null;
    this.time = 0;

    this.init();
  }

  init() {
    // Create geometry
    this.geometry = new THREE.BufferGeometry();

    const positions = new Float32Array(this.count * 3);
    const sizes = new Float32Array(this.count);
    const lives = new Float32Array(this.count);
    const velocities = new Float32Array(this.count * 3);
    const colors = new Float32Array(this.count * 3);

    // Initialize particles
    for (let i = 0; i < this.count; i++) {
      const i3 = i * 3;

      // Random spawn position (can be customized)
      positions[i3] = (Math.random() - 0.5) * 10;
      positions[i3 + 1] = Math.random() * -5;
      positions[i3 + 2] = (Math.random() - 0.5) * 10;

      // Random size
      sizes[i] = this.options.size * (0.5 + Math.random() * 0.5);

      // Random life (0 = dead, 1 = full life)
      lives[i] = Math.random();

      // Random velocity (upward with some spread)
      velocities[i3] = (Math.random() - 0.5) * 0.2;
      velocities[i3 + 1] = Math.random() * this.options.speed + 0.5;
      velocities[i3 + 2] = (Math.random() - 0.5) * 0.2;

      // Brand color gradient
      const colorMix = Math.random();
      if (colorMix > 0.7) {
        // Core ember
        colors[i3] = 1.0;
        colors[i3 + 1] = 0.56;
        colors[i3 + 2] = 0.31;
      } else if (colorMix > 0.4) {
        // Ember
        colors[i3] = 1.0;
        colors[i3 + 1] = 0.42;
        colors[i3 + 2] = 0.21;
      } else {
        // Flame
        colors[i3] = 0.91;
        colors[i3 + 1] = 0.36;
        colors[i3 + 2] = 0.02;
      }
    }

    // Set attributes
    this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    this.geometry.setAttribute('life', new THREE.BufferAttribute(lives, 1));
    this.geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // Create material
    this.material = createEmberFireMaterial({
      uIntensity: { value: this.options.intensity },
      uTurbulence: { value: this.options.turbulence },
    });

    // Create mesh
    this.mesh = new THREE.Points(this.geometry, this.material);
    this.mesh.frustumCulled = false;
  }

  update(delta, elapsed) {
    this.time = elapsed;

    const positions = this.geometry.attributes.position.array;
    const lives = this.geometry.attributes.life.array;
    const velocities = this.geometry.attributes.velocity.array;

    // Update material time
    if (this.material.uniforms) {
      this.material.uniforms.uTime.value = elapsed;
    }

    // Update each particle
    for (let i = 0; i < this.count; i++) {
      const i3 = i * 3;

      // Update life
      lives[i] -= delta / this.options.lifeTime;

      // Respawn dead particles
      if (lives[i] <= 0) {
        lives[i] = 1.0;

        // Reset position (spawn at bottom)
        positions[i3] = (Math.random() - 0.5) * 10;
        positions[i3 + 1] = -5;
        positions[i3 + 2] = (Math.random() - 0.5) * 10;

        // Reset velocity
        velocities[i3] = (Math.random() - 0.5) * 0.2;
        velocities[i3 + 1] = Math.random() * this.options.speed + 0.5;
        velocities[i3 + 2] = (Math.random() - 0.5) * 0.2;
      }

      // Update position based on velocity
      positions[i3] += velocities[i3] * delta;
      positions[i3 + 1] += velocities[i3 + 1] * delta;
      positions[i3 + 2] += velocities[i3 + 2] * delta;

      // Add turbulence
      const turbulence = Math.sin(elapsed * 2.0 + i) * 0.1;
      positions[i3] += turbulence * delta;
      positions[i3 + 2] += Math.cos(elapsed * 1.5 + i) * 0.1 * delta;

      // Gravity effect (slight downward pull)
      velocities[i3 + 1] -= 0.2 * delta;

      // Wind effect
      velocities[i3] += Math.sin(elapsed + i * 0.1) * 0.05 * delta;
    }

    // Mark attributes as needing update
    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.life.needsUpdate = true;
  }

  setIntensity(intensity) {
    this.options.intensity = intensity;
    if (this.material.uniforms) {
      this.material.uniforms.uIntensity.value = intensity;
    }
  }

  setTurbulence(turbulence) {
    this.options.turbulence = turbulence;
    if (this.material.uniforms) {
      this.material.uniforms.uTurbulence.value = turbulence;
    }
  }

  onResize(width, height) {
    // Can adjust particle behavior based on viewport size
  }

  dispose() {
    if (this.geometry) {
      this.geometry.dispose();
    }
    if (this.material) {
      this.material.dispose();
    }
  }
}

export default EmberParticleSystem;
