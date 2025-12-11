/**
 * BSI 3D Graphics Engine
 *
 * A cutting-edge WebGL/Three.js engine designed for Blaze Sports Intel.
 * Features advanced particle systems, custom shaders, and real-time visualizations.
 *
 * @author Austin Humphrey
 * @version 1.0.0
 */

import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { FilmPass } from 'three/examples/jsm/postprocessing/FilmPass.js';
import { GlitchPass } from 'three/examples/jsm/postprocessing/GlitchPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { threeColors } from '../../../styles/tokens/colors.js';

export class BSI3DEngine {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
      stencil: false,
      depth: true,
      logarithmicDepthBuffer: false,
      ...options,
    };

    // Core Three.js components
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.composer = null;

    // Animation
    this.clock = new THREE.Clock();
    this.animationId = null;
    this.isAnimating = false;

    // Systems
    this.particleSystems = [];
    this.postProcessing = [];
    this.interactiveObjects = [];

    // Performance
    this.frameCount = 0;
    this.lastFPS = 60;

    // Event handlers
    this.resizeHandler = this.handleResize.bind(this);
    this.mouseHandler = this.handleMouseMove.bind(this);
    this.touchHandler = this.handleTouchMove.bind(this);

    // Initialize
    this.init();
  }

  init() {
    this.createScene();
    this.createCamera();
    this.createRenderer();
    this.createLights();
    this.createPostProcessing();
    this.setupEventListeners();
    this.animate();
  }

  createScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(threeColors.midnight);
    this.scene.fog = new THREE.FogExp2(threeColors.midnight, 0.0005);
  }

  createCamera() {
    const aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 10000);
    this.camera.position.set(0, 0, 5);
  }

  createRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.container,
      antialias: this.options.antialias,
      alpha: this.options.alpha,
      powerPreference: this.options.powerPreference,
      stencil: this.options.stencil,
      depth: this.options.depth,
      logarithmicDepthBuffer: this.options.logarithmicDepthBuffer,
    });

    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  }

  createLights() {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    this.scene.add(ambientLight);

    // Main directional light (simulating sun)
    const mainLight = new THREE.DirectionalLight(threeColors.ember, 1.5);
    mainLight.position.set(5, 10, 5);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 2048;
    mainLight.shadow.mapSize.height = 2048;
    mainLight.shadow.camera.near = 0.5;
    mainLight.shadow.camera.far = 50;
    mainLight.shadow.camera.left = -10;
    mainLight.shadow.camera.right = 10;
    mainLight.shadow.camera.top = 10;
    mainLight.shadow.camera.bottom = -10;
    this.scene.add(mainLight);

    // Ember glow lights
    const emberLight1 = new THREE.PointLight(threeColors.ember, 2, 20);
    emberLight1.position.set(-3, 2, 3);
    this.scene.add(emberLight1);

    const emberLight2 = new THREE.PointLight(threeColors.burntOrange, 1.5, 15);
    emberLight2.position.set(3, -2, -3);
    this.scene.add(emberLight2);

    // Hemisphere light for ambient fill
    const hemiLight = new THREE.HemisphereLight(threeColors.ember, threeColors.midnight, 0.5);
    this.scene.add(hemiLight);
  }

  createPostProcessing() {
    this.composer = new EffectComposer(this.renderer);

    // Base render pass
    const renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(renderPass);

    // Bloom pass for ember glow effects
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(this.container.clientWidth, this.container.clientHeight),
      1.5, // strength
      0.4, // radius
      0.85 // threshold
    );
    this.composer.addPass(bloomPass);

    // Film grain for texture
    const filmPass = new FilmPass(
      0.35, // noise intensity
      0.025, // scanline intensity
      648, // scanline count
      false // grayscale
    );
    this.composer.addPass(filmPass);

    // Custom color grading pass
    const colorGradingPass = new ShaderPass({
      uniforms: {
        tDiffuse: { value: null },
        uIntensity: { value: 1.0 },
        uEmberTint: { value: new THREE.Vector3(1.0, 0.4, 0.1) },
        uContrast: { value: 1.1 },
        uSaturation: { value: 1.2 },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform float uIntensity;
        uniform vec3 uEmberTint;
        uniform float uContrast;
        uniform float uSaturation;
        varying vec2 vUv;

        void main() {
          vec4 texel = texture2D(tDiffuse, vUv);
          vec3 color = texel.rgb;

          // Apply ember tint
          color = mix(color, color * uEmberTint, 0.15);

          // Enhance contrast
          color = (color - 0.5) * uContrast + 0.5;

          // Boost saturation
          float gray = dot(color, vec3(0.299, 0.587, 0.114));
          color = mix(vec3(gray), color, uSaturation);

          gl_FragColor = vec4(color, texel.a);
        }
      `,
    });
    this.composer.addPass(colorGradingPass);
  }

  setupEventListeners() {
    window.addEventListener('resize', this.resizeHandler, { passive: true });
    window.addEventListener('mousemove', this.mouseHandler, { passive: true });
    window.addEventListener('touchmove', this.touchHandler, { passive: true });
  }

  handleResize() {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    if (this.composer) {
      this.composer.setSize(width, height);
    }

    // Notify particle systems
    this.particleSystems.forEach((system) => {
      if (system.onResize) system.onResize(width, height);
    });
  }

  handleMouseMove(event) {
    const rect = this.container.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.updateInteractiveObjects(x, y);
  }

  handleTouchMove(event) {
    if (event.touches.length > 0) {
      const touch = event.touches[0];
      const rect = this.container.getBoundingClientRect();
      const x = ((touch.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((touch.clientY - rect.top) / rect.height) * 2 + 1;

      this.updateInteractiveObjects(x, y);
    }
  }

  updateInteractiveObjects(x, y) {
    this.interactiveObjects.forEach((obj) => {
      if (obj.onMouseMove) {
        obj.onMouseMove(x, y);
      }
    });
  }

  animate() {
    this.animationId = requestAnimationFrame(() => this.animate());
    this.isAnimating = true;

    const delta = this.clock.getDelta();
    const elapsed = this.clock.getElapsedTime();

    // Update particle systems
    this.particleSystems.forEach((system) => {
      if (system.update) {
        system.update(delta, elapsed);
      }
    });

    // Update interactive objects
    this.interactiveObjects.forEach((obj) => {
      if (obj.update) {
        obj.update(delta, elapsed);
      }
    });

    // Render
    if (this.composer) {
      this.composer.render();
    } else {
      this.renderer.render(this.scene, this.camera);
    }

    // FPS tracking
    this.frameCount++;
    if (this.frameCount % 60 === 0) {
      this.lastFPS = Math.round(1 / delta);
    }
  }

  addParticleSystem(system) {
    this.particleSystems.push(system);
    if (system.mesh) {
      this.scene.add(system.mesh);
    }
  }

  removeParticleSystem(system) {
    const index = this.particleSystems.indexOf(system);
    if (index > -1) {
      this.particleSystems.splice(index, 1);
      if (system.mesh) {
        this.scene.remove(system.mesh);
      }
    }
  }

  addInteractiveObject(obj) {
    this.interactiveObjects.push(obj);
    if (obj.mesh) {
      this.scene.add(obj.mesh);
    }
  }

  removeInteractiveObject(obj) {
    const index = this.interactiveObjects.indexOf(obj);
    if (index > -1) {
      this.interactiveObjects.splice(index, 1);
      if (obj.mesh) {
        this.scene.remove(obj.mesh);
      }
    }
  }

  dispose() {
    // Cancel animation
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }

    // Remove event listeners
    window.removeEventListener('resize', this.resizeHandler);
    window.removeEventListener('mousemove', this.mouseHandler);
    window.removeEventListener('touchmove', this.touchHandler);

    // Dispose particle systems
    this.particleSystems.forEach((system) => {
      if (system.dispose) system.dispose();
    });

    // Dispose interactive objects
    this.interactiveObjects.forEach((obj) => {
      if (obj.dispose) obj.dispose();
    });

    // Dispose Three.js resources
    this.scene.traverse((object) => {
      if (object.geometry) object.geometry.dispose();
      if (object.material) {
        if (Array.isArray(object.material)) {
          object.material.forEach((mat) => mat.dispose());
        } else {
          object.material.dispose();
        }
      }
    });

    // Dispose renderer
    if (this.renderer) {
      this.renderer.dispose();
    }

    // Dispose composer
    if (this.composer) {
      this.composer.dispose();
    }
  }

  // Utility methods
  getFPS() {
    return this.lastFPS;
  }

  getScene() {
    return this.scene;
  }

  getCamera() {
    return this.camera;
  }

  getRenderer() {
    return this.renderer;
  }
}

export default BSI3DEngine;
