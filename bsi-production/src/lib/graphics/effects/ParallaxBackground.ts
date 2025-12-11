/**
 * Parallax Background Effect
 *
 * Interactive 3D parallax background with ember particles,
 * depth layers, and mouse/touch responsiveness.
 *
 * @author Austin Humphrey
 * @version 1.0.0
 */

import * as THREE from 'three';
import { BlazeEngine, BlazeEngineConfig } from '../engine/BlazeEngine';
import { EmberParticleSystem, ParticlePresets } from '../particles';
import { threeColors } from '../../styles/tokens/colors';

export interface ParallaxConfig {
  container: HTMLElement;
  mouseParallax?: boolean;
  parallaxStrength?: number;
  autoRotate?: boolean;
  autoRotateSpeed?: number;
  embers?: boolean;
  emberCount?: number;
  layers?: number;
  depth?: number;
  fogDensity?: number;
  backgroundColor?: number;
}

/**
 * Interactive parallax background with 3D depth and particles
 */
export class ParallaxBackground {
  private engine: BlazeEngine;
  private config: Required<ParallaxConfig>;

  // Layers
  private layers: THREE.Group[] = [];
  private embers: EmberParticleSystem | null = null;

  // Mouse tracking
  private mouseX: number = 0;
  private mouseY: number = 0;
  private targetRotationX: number = 0;
  private targetRotationY: number = 0;

  // Animation
  private layerGroup: THREE.Group;
  private time: number = 0;

  private static defaultConfig: Omit<Required<ParallaxConfig>, 'container'> = {
    mouseParallax: true,
    parallaxStrength: 0.05,
    autoRotate: true,
    autoRotateSpeed: 0.1,
    embers: true,
    emberCount: 100,
    layers: 5,
    depth: 200,
    fogDensity: 0.003,
    backgroundColor: threeColors.midnight,
  };

  constructor(config: ParallaxConfig) {
    this.config = { ...ParallaxBackground.defaultConfig, ...config } as Required<ParallaxConfig>;

    // Initialize engine
    this.engine = new BlazeEngine({
      container: this.config.container,
      backgroundColor: this.config.backgroundColor,
      postProcessing: true,
      shadows: false,
      onRender: this.onRender.bind(this),
    });

    // Create layer group
    this.layerGroup = new THREE.Group();
    this.engine.scene.add(this.layerGroup);

    // Setup
    this.createLayers();
    this.setupEmbers();
    this.setupMouseTracking();
    this.setupFog();

    // Start
    this.engine.start();
  }

  /**
   * Create depth layers with geometric shapes
   */
  private createLayers(): void {
    const layerDepth = this.config.depth / this.config.layers;

    for (let i = 0; i < this.config.layers; i++) {
      const layer = new THREE.Group();
      const z = -i * layerDepth;
      const scale = 1 - i * 0.1; // Layers get smaller with depth

      // Add shapes to each layer
      this.addLayerShapes(layer, z, scale, i);

      this.layers.push(layer);
      this.layerGroup.add(layer);
    }
  }

  /**
   * Add geometric shapes to a layer
   */
  private addLayerShapes(
    layer: THREE.Group,
    z: number,
    scale: number,
    layerIndex: number
  ): void {
    const numShapes = 3 + Math.floor(Math.random() * 4);

    for (let i = 0; i < numShapes; i++) {
      const shape = this.createRandomShape(scale, layerIndex);
      shape.position.set(
        (Math.random() - 0.5) * 300 * scale,
        (Math.random() - 0.5) * 200 * scale,
        z + (Math.random() - 0.5) * 20
      );
      shape.rotation.set(
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2
      );

      // Store animation parameters
      shape.userData = {
        rotationSpeed: (Math.random() - 0.5) * 0.5,
        floatSpeed: 0.5 + Math.random() * 0.5,
        floatAmplitude: 2 + Math.random() * 3,
        initialY: shape.position.y,
      };

      layer.add(shape);
    }
  }

  /**
   * Create a random geometric shape
   */
  private createRandomShape(scale: number, layerIndex: number): THREE.Mesh {
    const shapeTypes = [
      () => new THREE.IcosahedronGeometry(10 * scale, 0),
      () => new THREE.OctahedronGeometry(12 * scale, 0),
      () => new THREE.TetrahedronGeometry(15 * scale, 0),
      () => new THREE.TorusGeometry(8 * scale, 3 * scale, 8, 16),
      () => new THREE.TorusKnotGeometry(6 * scale, 2 * scale, 32, 8),
    ];

    const geometry = shapeTypes[Math.floor(Math.random() * shapeTypes.length)]();

    // Color based on layer depth
    const hue = 0.05 + layerIndex * 0.02; // Orange range
    const saturation = 0.8 - layerIndex * 0.1;
    const lightness = 0.4 - layerIndex * 0.05;

    const color = new THREE.Color().setHSL(hue, saturation, lightness);

    const material = new THREE.MeshBasicMaterial({
      color: color,
      wireframe: Math.random() > 0.5,
      transparent: true,
      opacity: 0.3 + (this.config.layers - layerIndex) * 0.1,
    });

    return new THREE.Mesh(geometry, material);
  }

  /**
   * Setup ember particle system
   */
  private setupEmbers(): void {
    if (!this.config.embers) return;

    this.embers = new EmberParticleSystem({
      ...ParticlePresets.backgroundEmbers,
      count: this.config.emberCount,
      emitterRadius: 150,
      emitterHeight: 100,
      emitterPosition: new THREE.Vector3(0, -50, 0),
    });

    this.engine.scene.add(this.embers);
  }

  /**
   * Setup fog for depth effect
   */
  private setupFog(): void {
    this.engine.scene.fog = new THREE.FogExp2(
      this.config.backgroundColor,
      this.config.fogDensity
    );
  }

  /**
   * Setup mouse/touch tracking for parallax
   */
  private setupMouseTracking(): void {
    if (!this.config.mouseParallax) return;

    const container = this.config.container;

    // Mouse move
    container.addEventListener('mousemove', (e) => {
      const rect = container.getBoundingClientRect();
      this.mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouseY = ((e.clientY - rect.top) / rect.height) * 2 - 1;
    });

    // Touch move
    container.addEventListener('touchmove', (e) => {
      if (e.touches.length === 0) return;
      const rect = container.getBoundingClientRect();
      const touch = e.touches[0];
      this.mouseX = ((touch.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouseY = ((touch.clientY - rect.top) / rect.height) * 2 - 1;
    });

    // Reset on leave
    container.addEventListener('mouseleave', () => {
      this.mouseX = 0;
      this.mouseY = 0;
    });
  }

  /**
   * Render callback
   */
  private onRender(delta: number): void {
    this.time += delta;

    // Update parallax
    if (this.config.mouseParallax) {
      this.targetRotationX = this.mouseY * this.config.parallaxStrength;
      this.targetRotationY = this.mouseX * this.config.parallaxStrength;

      this.layerGroup.rotation.x += (this.targetRotationX - this.layerGroup.rotation.x) * 0.05;
      this.layerGroup.rotation.y += (this.targetRotationY - this.layerGroup.rotation.y) * 0.05;
    }

    // Auto rotation
    if (this.config.autoRotate) {
      this.layerGroup.rotation.y += delta * this.config.autoRotateSpeed;
    }

    // Animate layer shapes
    this.layers.forEach((layer, layerIndex) => {
      // Parallax depth effect
      const parallaxFactor = (layerIndex + 1) / this.config.layers;
      layer.position.x = this.mouseX * 10 * parallaxFactor;
      layer.position.y = -this.mouseY * 10 * parallaxFactor;

      // Animate individual shapes
      layer.children.forEach((shape) => {
        if (shape.userData.rotationSpeed) {
          shape.rotation.x += delta * shape.userData.rotationSpeed;
          shape.rotation.y += delta * shape.userData.rotationSpeed * 0.7;
        }
        if (shape.userData.floatAmplitude) {
          shape.position.y =
            shape.userData.initialY +
            Math.sin(this.time * shape.userData.floatSpeed) *
              shape.userData.floatAmplitude;
        }
      });
    });

    // Update embers
    if (this.embers) {
      this.embers.update(delta);
    }
  }

  /**
   * Set parallax strength
   */
  public setParallaxStrength(strength: number): void {
    this.config.parallaxStrength = strength;
  }

  /**
   * Toggle embers
   */
  public setEmbers(enabled: boolean): void {
    if (this.embers) {
      this.embers.visible = enabled;
    }
  }

  /**
   * Resize handler (called automatically if autoResize is true)
   */
  public resize(width: number, height: number): void {
    this.engine.resize(width, height);
  }

  /**
   * Dispose all resources
   */
  public dispose(): void {
    if (this.embers) {
      this.embers.dispose();
    }

    this.layers.forEach((layer) => {
      layer.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          (child.material as THREE.Material).dispose();
        }
      });
    });

    this.engine.dispose();
  }
}

export default ParallaxBackground;
