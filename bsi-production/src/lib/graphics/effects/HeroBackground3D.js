/**
 * Hero Background 3D Effect
 *
 * Creates a stunning 3D background for the hero section
 * featuring ember particles, volumetric lighting, and
 * interactive elements using BSI brand colors.
 *
 * @author Austin Humphrey
 */

import { BSI3DEngine } from '../engine/BSI3DEngine.js';
import { EmberParticleSystem } from '../particles/EmberParticleSystem.js';
import * as THREE from 'three';
import { threeColors } from '../../../styles/tokens/colors.js';

export class HeroBackground3D {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      particleCount: 2000,
      intensity: 1.0,
      interactive: true,
      ...options,
    };

    this.engine = null;
    this.particleSystem = null;
    this.lightOrbs = [];
    this.mouseX = 0;
    this.mouseY = 0;

    this.init();
  }

  init() {
    // Create canvas if container is not a canvas
    if (this.container.tagName !== 'CANVAS') {
      const canvas = document.createElement('canvas');
      canvas.style.position = 'absolute';
      canvas.style.top = '0';
      canvas.style.left = '0';
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      canvas.style.zIndex = '-1';
      canvas.style.pointerEvents = 'none';
      this.container.appendChild(canvas);
      this.container = canvas;
    }

    // Initialize 3D engine
    this.engine = new BSI3DEngine(this.container, {
      alpha: true,
      antialias: true,
    });

    // Create ember particle system
    this.particleSystem = new EmberParticleSystem(this.options.particleCount, {
      intensity: this.options.intensity,
      turbulence: 0.6,
      speed: 0.8,
    });
    this.engine.addParticleSystem(this.particleSystem);

    // Create floating light orbs
    this.createLightOrbs();

    // Set up camera animation
    this.setupCameraAnimation();

    // Handle mouse/touch interaction
    if (this.options.interactive) {
      this.setupInteraction();
    }
  }

  createLightOrbs() {
    const orbCount = 5;
    const scene = this.engine.getScene();

    for (let i = 0; i < orbCount; i++) {
      const geometry = new THREE.SphereGeometry(0.3, 32, 32);
      const material = new THREE.MeshStandardMaterial({
        color: i % 2 === 0 ? threeColors.ember : threeColors.burntOrange,
        emissive: i % 2 === 0 ? threeColors.ember : threeColors.burntOrange,
        emissiveIntensity: 1.5,
        transparent: true,
        opacity: 0.6,
      });

      const orb = new THREE.Mesh(geometry, material);

      // Random position
      orb.position.set(
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 6,
        (Math.random() - 0.5) * 10
      );

      // Add point light
      const light = new THREE.PointLight(
        i % 2 === 0 ? threeColors.ember : threeColors.burntOrange,
        2,
        15
      );
      light.position.copy(orb.position);
      scene.add(light);

      orb.userData = {
        light: light,
        basePosition: orb.position.clone(),
        speed: 0.5 + Math.random() * 0.5,
        offset: Math.random() * Math.PI * 2,
      };

      scene.add(orb);
      this.lightOrbs.push(orb);
    }
  }

  setupCameraAnimation() {
    const camera = this.engine.getCamera();
    camera.position.set(0, 2, 8);
    camera.lookAt(0, 0, 0);
  }

  setupInteraction() {
    this.targetX = 0;
    this.targetY = 0;
    this.currentX = 0;
    this.currentY = 0;

    // Register as interactive object
    this.engine.addInteractiveObject(this);
  }

  onMouseMove(x, y) {
    this.targetX = x * 2;
    this.targetY = y * 1.5;
  }

  update(delta, elapsed) {
    // Smooth camera movement
    this.currentX += (this.targetX - this.currentX) * 0.05;
    this.currentY += (this.targetY - this.currentY) * 0.05;

    const camera = this.engine.getCamera();
    camera.position.x = this.currentX * 0.5;
    camera.position.y = 2 + this.currentY * 0.3;
    camera.lookAt(this.currentX * 0.3, this.currentY * 0.2, 0);

    // Animate light orbs
    this.lightOrbs.forEach((orb, index) => {
      const time = elapsed * orb.userData.speed + orb.userData.offset;
      orb.position.x = orb.userData.basePosition.x + Math.sin(time) * 2;
      orb.position.y = orb.userData.basePosition.y + Math.cos(time * 0.7) * 1.5;
      orb.position.z = orb.userData.basePosition.z + Math.cos(time * 0.5) * 1.5;

      if (orb.userData.light) {
        orb.userData.light.position.copy(orb.position);
      }

      // Pulsing effect
      const pulse = 1 + Math.sin(time * 2) * 0.2;
      orb.scale.setScalar(pulse);
    });
  }

  setIntensity(intensity) {
    this.options.intensity = intensity;
    if (this.particleSystem) {
      this.particleSystem.setIntensity(intensity);
    }
  }

  dispose() {
    if (this.engine) {
      this.engine.removeInteractiveObject(this);
      this.engine.dispose();
    }
  }
}

export default HeroBackground3D;
