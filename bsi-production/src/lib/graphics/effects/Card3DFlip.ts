/**
 * 3D Card Flip Effect
 *
 * Interactive card with 3D flip animation, tilt effects,
 * and holographic shader options.
 *
 * @author Austin Humphrey
 * @version 1.0.0
 */

import * as THREE from 'three';
import { BlazeEngine } from '../engine/BlazeEngine';
import { threeColors } from '../../styles/tokens/colors';

export interface Card3DConfig {
  container: HTMLElement;
  width?: number;
  height?: number;
  frontTexture?: string | THREE.Texture;
  backTexture?: string | THREE.Texture;
  frontContent?: HTMLElement;
  backContent?: HTMLElement;
  borderRadius?: number;
  borderColor?: number;
  borderWidth?: number;
  tiltAmount?: number;
  flipDuration?: number;
  holographic?: boolean;
  glowColor?: number;
  glowIntensity?: number;
  autoFlip?: boolean;
  autoFlipInterval?: number;
}

/**
 * 3D Card with flip animation and tilt effects
 */
export class Card3DFlip {
  private engine: BlazeEngine;
  private config: Required<Card3DConfig>;

  // Card mesh
  private card: THREE.Group;
  private frontMesh: THREE.Mesh;
  private backMesh: THREE.Mesh;

  // State
  private isFlipped: boolean = false;
  private isAnimating: boolean = false;
  private targetRotation: number = 0;
  private currentRotation: number = 0;

  // Mouse tracking
  private mouseX: number = 0;
  private mouseY: number = 0;
  private isHovering: boolean = false;

  // Animation
  private time: number = 0;
  private autoFlipTimer: number = 0;

  private static defaultConfig: Omit<Required<Card3DConfig>, 'container'> = {
    width: 300,
    height: 400,
    frontTexture: '',
    backTexture: '',
    frontContent: null as unknown as HTMLElement,
    backContent: null as unknown as HTMLElement,
    borderRadius: 12,
    borderColor: threeColors.burntOrange,
    borderWidth: 2,
    tiltAmount: 15,
    flipDuration: 0.6,
    holographic: false,
    glowColor: threeColors.ember,
    glowIntensity: 0.5,
    autoFlip: false,
    autoFlipInterval: 5,
  };

  constructor(config: Card3DConfig) {
    this.config = { ...Card3DFlip.defaultConfig, ...config } as Required<Card3DConfig>;

    // Initialize engine
    this.engine = new BlazeEngine({
      container: this.config.container,
      backgroundColor: 0x000000,
      alpha: true,
      postProcessing: false,
      shadows: false,
      onRender: this.onRender.bind(this),
    });

    // Setup camera for card view
    this.engine.camera.position.set(0, 0, 500);
    this.engine.camera.lookAt(0, 0, 0);

    // Create card
    this.card = new THREE.Group();
    this.frontMesh = this.createCardFace(true);
    this.backMesh = this.createCardFace(false);
    this.backMesh.rotation.y = Math.PI;

    this.card.add(this.frontMesh);
    this.card.add(this.backMesh);
    this.engine.scene.add(this.card);

    // Add lighting
    this.setupLighting();

    // Setup interactions
    this.setupInteractions();

    // Start
    this.engine.start();
  }

  /**
   * Create a card face
   */
  private createCardFace(isFront: boolean): THREE.Mesh {
    // Create rounded rectangle shape
    const shape = this.createRoundedRectShape(
      this.config.width,
      this.config.height,
      this.config.borderRadius
    );

    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth: 5,
      bevelEnabled: true,
      bevelThickness: 2,
      bevelSize: 1,
      bevelSegments: 3,
    });

    // Center geometry
    geometry.center();

    let material: THREE.Material;

    if (this.config.holographic) {
      material = this.createHolographicMaterial(isFront);
    } else {
      material = new THREE.MeshStandardMaterial({
        color: isFront ? threeColors.charcoal : threeColors.midnight,
        metalness: 0.3,
        roughness: 0.4,
        side: isFront ? THREE.FrontSide : THREE.BackSide,
      });
    }

    const mesh = new THREE.Mesh(geometry, material);

    // Add border
    this.addCardBorder(mesh, isFront);

    return mesh;
  }

  /**
   * Create rounded rectangle shape
   */
  private createRoundedRectShape(
    width: number,
    height: number,
    radius: number
  ): THREE.Shape {
    const shape = new THREE.Shape();
    const x = -width / 2;
    const y = -height / 2;

    shape.moveTo(x + radius, y);
    shape.lineTo(x + width - radius, y);
    shape.quadraticCurveTo(x + width, y, x + width, y + radius);
    shape.lineTo(x + width, y + height - radius);
    shape.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    shape.lineTo(x + radius, y + height);
    shape.quadraticCurveTo(x, y + height, x, y + height - radius);
    shape.lineTo(x, y + radius);
    shape.quadraticCurveTo(x, y, x + radius, y);

    return shape;
  }

  /**
   * Add glowing border to card
   */
  private addCardBorder(card: THREE.Mesh, isFront: boolean): void {
    const borderShape = this.createRoundedRectShape(
      this.config.width + this.config.borderWidth * 2,
      this.config.height + this.config.borderWidth * 2,
      this.config.borderRadius + this.config.borderWidth
    );

    const borderGeometry = new THREE.ShapeGeometry(borderShape);
    borderGeometry.center();

    const borderMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        color: { value: new THREE.Color(this.config.borderColor) },
        glowIntensity: { value: this.config.glowIntensity },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform vec3 color;
        uniform float glowIntensity;
        varying vec2 vUv;

        void main() {
          vec2 center = vUv - 0.5;
          float dist = length(center);

          // Animated glow
          float pulse = 0.8 + 0.2 * sin(time * 2.0);
          float glow = (1.0 - smoothstep(0.3, 0.5, dist)) * glowIntensity * pulse;

          gl_FragColor = vec4(color * glow, glow);
        }
      `,
      transparent: true,
      depthWrite: false,
      side: isFront ? THREE.FrontSide : THREE.BackSide,
    });

    const border = new THREE.Mesh(borderGeometry, borderMaterial);
    border.position.z = isFront ? 3 : -3;
    card.add(border);
  }

  /**
   * Create holographic material
   */
  private createHolographicMaterial(isFront: boolean): THREE.ShaderMaterial {
    return new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        baseColor: { value: new THREE.Color(threeColors.charcoal) },
        holoColor1: { value: new THREE.Color(threeColors.burntOrange) },
        holoColor2: { value: new THREE.Color(threeColors.ember) },
        holoColor3: { value: new THREE.Color(threeColors.gold) },
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vViewPosition;

        void main() {
          vUv = uv;
          vNormal = normalize(normalMatrix * normal);

          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          vViewPosition = -mvPosition.xyz;

          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform vec3 baseColor;
        uniform vec3 holoColor1;
        uniform vec3 holoColor2;
        uniform vec3 holoColor3;

        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vViewPosition;

        void main() {
          vec3 viewDir = normalize(vViewPosition);

          // Fresnel for rainbow edge effect
          float fresnel = pow(1.0 - abs(dot(viewDir, vNormal)), 3.0);

          // Animated holographic pattern
          float pattern = sin(vUv.x * 30.0 + time * 2.0) * sin(vUv.y * 30.0 + time * 1.5);
          pattern = pattern * 0.5 + 0.5;

          // Color cycling
          float hue = fract(vUv.x + vUv.y + time * 0.1);
          vec3 holoColor;
          if (hue < 0.33) {
            holoColor = mix(holoColor1, holoColor2, hue * 3.0);
          } else if (hue < 0.66) {
            holoColor = mix(holoColor2, holoColor3, (hue - 0.33) * 3.0);
          } else {
            holoColor = mix(holoColor3, holoColor1, (hue - 0.66) * 3.0);
          }

          vec3 color = mix(baseColor, holoColor, fresnel * 0.7 + pattern * 0.2);

          gl_FragColor = vec4(color, 1.0);
        }
      `,
      side: isFront ? THREE.FrontSide : THREE.BackSide,
    });
  }

  /**
   * Setup lighting
   */
  private setupLighting(): void {
    const ambient = new THREE.AmbientLight(0xffffff, 0.5);
    this.engine.scene.add(ambient);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1);
    keyLight.position.set(200, 200, 300);
    this.engine.scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(threeColors.burntOrange, 0.3);
    fillLight.position.set(-200, -100, 200);
    this.engine.scene.add(fillLight);
  }

  /**
   * Setup mouse interactions
   */
  private setupInteractions(): void {
    const container = this.config.container;

    // Mouse move for tilt
    container.addEventListener('mousemove', (e) => {
      const rect = container.getBoundingClientRect();
      this.mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouseY = ((e.clientY - rect.top) / rect.height) * 2 - 1;
    });

    // Hover state
    container.addEventListener('mouseenter', () => {
      this.isHovering = true;
    });

    container.addEventListener('mouseleave', () => {
      this.isHovering = false;
      this.mouseX = 0;
      this.mouseY = 0;
    });

    // Click to flip
    container.addEventListener('click', () => {
      this.flip();
    });

    // Touch support
    container.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        this.flip();
      }
    });
  }

  /**
   * Flip the card
   */
  public flip(): void {
    if (this.isAnimating) return;

    this.isFlipped = !this.isFlipped;
    this.targetRotation = this.isFlipped ? Math.PI : 0;
    this.isAnimating = true;
  }

  /**
   * Render callback
   */
  private onRender(delta: number): void {
    this.time += delta;

    // Update flip animation
    if (this.isAnimating) {
      const speed = Math.PI / this.config.flipDuration;
      const diff = this.targetRotation - this.currentRotation;

      if (Math.abs(diff) < 0.01) {
        this.currentRotation = this.targetRotation;
        this.isAnimating = false;
      } else {
        this.currentRotation += Math.sign(diff) * speed * delta;
      }
    }

    // Apply rotation
    this.card.rotation.y = this.currentRotation;

    // Tilt effect on hover
    if (this.isHovering) {
      const tiltX = -this.mouseY * this.config.tiltAmount * (Math.PI / 180);
      const tiltY = this.mouseX * this.config.tiltAmount * (Math.PI / 180);

      this.card.rotation.x += (tiltX - this.card.rotation.x) * 0.1;
      // Don't override Y rotation during flip
      if (!this.isAnimating) {
        this.card.rotation.y += (tiltY + this.currentRotation - this.card.rotation.y) * 0.1;
      }
    } else {
      this.card.rotation.x += (0 - this.card.rotation.x) * 0.1;
    }

    // Auto flip
    if (this.config.autoFlip) {
      this.autoFlipTimer += delta;
      if (this.autoFlipTimer >= this.config.autoFlipInterval) {
        this.autoFlipTimer = 0;
        this.flip();
      }
    }

    // Update shader uniforms
    this.card.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material instanceof THREE.ShaderMaterial) {
        if (child.material.uniforms.time) {
          child.material.uniforms.time.value = this.time;
        }
      }
    });
  }

  /**
   * Set front/back textures
   */
  public setTextures(front?: string | THREE.Texture, back?: string | THREE.Texture): void {
    const loader = new THREE.TextureLoader();

    if (front) {
      const frontTexture = typeof front === 'string' ? loader.load(front) : front;
      if (this.frontMesh.material instanceof THREE.MeshStandardMaterial) {
        this.frontMesh.material.map = frontTexture;
        this.frontMesh.material.needsUpdate = true;
      }
    }

    if (back) {
      const backTexture = typeof back === 'string' ? loader.load(back) : back;
      if (this.backMesh.material instanceof THREE.MeshStandardMaterial) {
        this.backMesh.material.map = backTexture;
        this.backMesh.material.needsUpdate = true;
      }
    }
  }

  /**
   * Check if card is flipped
   */
  public getIsFlipped(): boolean {
    return this.isFlipped;
  }

  /**
   * Set flip state without animation
   */
  public setFlipped(flipped: boolean): void {
    this.isFlipped = flipped;
    this.currentRotation = flipped ? Math.PI : 0;
    this.targetRotation = this.currentRotation;
    this.card.rotation.y = this.currentRotation;
  }

  /**
   * Dispose resources
   */
  public dispose(): void {
    this.card.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (child.material instanceof THREE.Material) {
          child.material.dispose();
        }
      }
    });

    this.engine.dispose();
  }
}

export default Card3DFlip;
