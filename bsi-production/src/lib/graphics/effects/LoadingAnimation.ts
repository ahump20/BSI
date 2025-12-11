/**
 * 3D Loading Animation
 *
 * WebGL-powered loading spinner with ember effects
 * and BSI brand styling.
 *
 * @author Austin Humphrey
 * @version 1.0.0
 */

import * as THREE from 'three';
import { threeColors } from '../../styles/tokens/colors';

export interface LoadingConfig {
  container: HTMLElement;
  size?: number;
  color?: number;
  secondaryColor?: number;
  speed?: number;
  type?: 'ring' | 'dots' | 'bars' | 'ember';
  text?: string;
  showProgress?: boolean;
}

/**
 * 3D Loading animation
 */
export class LoadingAnimation {
  private container: HTMLElement;
  private config: Required<LoadingConfig>;
  private canvas: HTMLCanvasElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.OrthographicCamera;
  private elements: THREE.Object3D[] = [];
  private time: number = 0;
  private animationId: number | null = null;
  private progress: number = 0;

  private static defaultConfig: Omit<Required<LoadingConfig>, 'container'> = {
    size: 80,
    color: threeColors.burntOrange,
    secondaryColor: threeColors.ember,
    speed: 1,
    type: 'ring',
    text: '',
    showProgress: false,
  };

  constructor(config: LoadingConfig) {
    this.config = { ...LoadingAnimation.defaultConfig, ...config } as Required<LoadingConfig>;
    this.container = this.config.container;

    // Create canvas
    this.canvas = document.createElement('canvas');
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.container.appendChild(this.canvas);

    // Create renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
      antialias: true,
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);

    // Create scene
    this.scene = new THREE.Scene();

    // Create orthographic camera
    const aspect = this.container.clientWidth / this.container.clientHeight;
    const frustumSize = 100;
    this.camera = new THREE.OrthographicCamera(
      (frustumSize * aspect) / -2,
      (frustumSize * aspect) / 2,
      frustumSize / 2,
      frustumSize / -2,
      0.1,
      1000
    );
    this.camera.position.z = 100;

    // Create loading animation
    this.createAnimation();

    // Start
    this.start();
  }

  /**
   * Create loading animation based on type
   */
  private createAnimation(): void {
    switch (this.config.type) {
      case 'ring':
        this.createRingAnimation();
        break;
      case 'dots':
        this.createDotsAnimation();
        break;
      case 'bars':
        this.createBarsAnimation();
        break;
      case 'ember':
        this.createEmberAnimation();
        break;
    }
  }

  /**
   * Create ring spinner animation
   */
  private createRingAnimation(): void {
    const radius = this.config.size / 2;

    // Create ring segments
    const segments = 12;
    for (let i = 0; i < segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      const segmentLength = Math.PI * 2 / segments * 0.7;

      const curve = new THREE.EllipseCurve(
        0, 0,
        radius, radius,
        angle,
        angle + segmentLength,
        false,
        0
      );

      const points = curve.getPoints(16);
      const geometry = new THREE.BufferGeometry().setFromPoints(
        points.map((p) => new THREE.Vector3(p.x, p.y, 0))
      );

      const material = new THREE.LineBasicMaterial({
        color: this.config.color,
        transparent: true,
        opacity: 1 - i / segments * 0.7,
      });

      const segment = new THREE.Line(geometry, material);
      segment.userData.index = i;
      this.scene.add(segment);
      this.elements.push(segment);
    }

    // Add center glow
    const glowGeometry = new THREE.CircleGeometry(radius * 0.3, 32);
    const glowMaterial = new THREE.ShaderMaterial({
      uniforms: {
        color: { value: new THREE.Color(this.config.color) },
        time: { value: 0 },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 color;
        uniform float time;
        varying vec2 vUv;
        void main() {
          vec2 center = vUv - 0.5;
          float dist = length(center);
          float pulse = 0.7 + 0.3 * sin(time * 3.0);
          float alpha = (1.0 - smoothstep(0.0, 0.5, dist)) * 0.5 * pulse;
          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
    });

    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    this.scene.add(glow);
    this.elements.push(glow);
  }

  /**
   * Create dots animation
   */
  private createDotsAnimation(): void {
    const dotCount = 8;
    const radius = this.config.size / 3;
    const dotRadius = this.config.size / 20;

    for (let i = 0; i < dotCount; i++) {
      const geometry = new THREE.CircleGeometry(dotRadius, 16);
      const material = new THREE.MeshBasicMaterial({
        color: this.config.color,
        transparent: true,
        opacity: 1,
      });

      const dot = new THREE.Mesh(geometry, material);
      const angle = (i / dotCount) * Math.PI * 2;
      dot.position.x = Math.cos(angle) * radius;
      dot.position.y = Math.sin(angle) * radius;
      dot.userData.angle = angle;
      dot.userData.index = i;

      this.scene.add(dot);
      this.elements.push(dot);
    }
  }

  /**
   * Create bars animation
   */
  private createBarsAnimation(): void {
    const barCount = 5;
    const barWidth = this.config.size / 8;
    const barMaxHeight = this.config.size / 2;
    const spacing = barWidth * 1.5;
    const startX = -((barCount - 1) * spacing) / 2;

    for (let i = 0; i < barCount; i++) {
      const geometry = new THREE.PlaneGeometry(barWidth, barMaxHeight);
      const material = new THREE.ShaderMaterial({
        uniforms: {
          color: { value: new THREE.Color(this.config.color) },
          secondaryColor: { value: new THREE.Color(this.config.secondaryColor) },
          time: { value: 0 },
          index: { value: i },
          barCount: { value: barCount },
        },
        vertexShader: `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform vec3 color;
          uniform vec3 secondaryColor;
          uniform float time;
          uniform float index;
          uniform float barCount;
          varying vec2 vUv;

          void main() {
            float phase = time * 5.0 + index * 0.5;
            float height = 0.3 + 0.7 * abs(sin(phase));

            if (vUv.y > height) discard;

            vec3 finalColor = mix(secondaryColor, color, vUv.y / height);
            float alpha = 0.8 + 0.2 * sin(phase);

            gl_FragColor = vec4(finalColor, alpha);
          }
        `,
        transparent: true,
      });

      const bar = new THREE.Mesh(geometry, material);
      bar.position.x = startX + i * spacing;
      bar.position.y = -barMaxHeight / 4;

      this.scene.add(bar);
      this.elements.push(bar);
    }
  }

  /**
   * Create ember particle animation
   */
  private createEmberAnimation(): void {
    const particleCount = 30;
    const positions = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    const lifetimes = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * this.config.size;
      positions[i * 3 + 1] = (Math.random() - 0.5) * this.config.size;
      positions[i * 3 + 2] = 0;

      sizes[i] = 2 + Math.random() * 4;
      lifetimes[i] = Math.random();
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('lifetime', new THREE.BufferAttribute(lifetimes, 1));

    const material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        color: { value: new THREE.Color(this.config.color) },
        secondaryColor: { value: new THREE.Color(this.config.secondaryColor) },
      },
      vertexShader: `
        attribute float size;
        attribute float lifetime;
        uniform float time;
        varying float vLifetime;
        varying float vAlpha;

        void main() {
          vLifetime = fract(lifetime + time * 0.3);

          // Rise and fade
          float y = position.y + vLifetime * 50.0;
          vAlpha = sin(vLifetime * 3.14159);

          vec4 mvPosition = modelViewMatrix * vec4(position.x, y, position.z, 1.0);
          gl_PointSize = size * vAlpha * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform vec3 color;
        uniform vec3 secondaryColor;
        varying float vLifetime;
        varying float vAlpha;

        void main() {
          vec2 center = gl_PointCoord - 0.5;
          float dist = length(center);
          if (dist > 0.5) discard;

          float falloff = 1.0 - smoothstep(0.0, 0.5, dist);
          vec3 finalColor = mix(secondaryColor, color, vLifetime);

          gl_FragColor = vec4(finalColor, falloff * vAlpha * 0.8);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const particles = new THREE.Points(geometry, material);
    this.scene.add(particles);
    this.elements.push(particles);

    // Add center logo/text area glow
    const logoGlow = new THREE.Mesh(
      new THREE.CircleGeometry(this.config.size / 4, 32),
      new THREE.ShaderMaterial({
        uniforms: {
          color: { value: new THREE.Color(this.config.color) },
          time: { value: 0 },
        },
        vertexShader: `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform vec3 color;
          uniform float time;
          varying vec2 vUv;
          void main() {
            vec2 center = vUv - 0.5;
            float dist = length(center);
            float pulse = 0.6 + 0.4 * sin(time * 2.0);
            float alpha = (1.0 - smoothstep(0.0, 0.5, dist)) * 0.3 * pulse;
            gl_FragColor = vec4(color, alpha);
          }
        `,
        transparent: true,
      })
    );
    this.scene.add(logoGlow);
    this.elements.push(logoGlow);
  }

  /**
   * Animation loop
   */
  private animate = (): void => {
    this.animationId = requestAnimationFrame(this.animate);
    this.time += 0.016 * this.config.speed;

    // Update based on type
    switch (this.config.type) {
      case 'ring':
        this.updateRing();
        break;
      case 'dots':
        this.updateDots();
        break;
      case 'bars':
      case 'ember':
        this.updateShaders();
        break;
    }

    this.renderer.render(this.scene, this.camera);
  };

  /**
   * Update ring animation
   */
  private updateRing(): void {
    this.elements.forEach((element) => {
      if (element instanceof THREE.Line) {
        element.rotation.z = this.time * 2;
      }
      if (element instanceof THREE.Mesh && element.material instanceof THREE.ShaderMaterial) {
        element.material.uniforms.time.value = this.time;
      }
    });
  }

  /**
   * Update dots animation
   */
  private updateDots(): void {
    this.elements.forEach((element) => {
      if (element instanceof THREE.Mesh && element.userData.index !== undefined) {
        const delay = element.userData.index * 0.1;
        const scale = 0.5 + 0.5 * Math.abs(Math.sin(this.time * 3 - delay));
        element.scale.setScalar(scale);

        const material = element.material as THREE.MeshBasicMaterial;
        material.opacity = 0.3 + 0.7 * scale;
      }
    });
  }

  /**
   * Update shader uniforms
   */
  private updateShaders(): void {
    this.elements.forEach((element) => {
      if (element instanceof THREE.Mesh || element instanceof THREE.Points) {
        const material = element.material as THREE.ShaderMaterial;
        if (material.uniforms && material.uniforms.time) {
          material.uniforms.time.value = this.time;
        }
      }
    });
  }

  /**
   * Start animation
   */
  public start(): void {
    if (this.animationId === null) {
      this.animate();
    }
  }

  /**
   * Stop animation
   */
  public stop(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  /**
   * Set progress (0-1)
   */
  public setProgress(progress: number): void {
    this.progress = Math.max(0, Math.min(1, progress));
  }

  /**
   * Dispose resources
   */
  public dispose(): void {
    this.stop();

    this.elements.forEach((element) => {
      if (element instanceof THREE.Mesh || element instanceof THREE.Line || element instanceof THREE.Points) {
        element.geometry.dispose();
        if (element.material instanceof THREE.Material) {
          element.material.dispose();
        }
      }
    });

    this.renderer.dispose();
    this.container.removeChild(this.canvas);
  }
}

export default LoadingAnimation;
