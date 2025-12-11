/**
 * StatPylon3D
 *
 * Towering 3D stat bars rising from the ground.
 * Creates dramatic, animated statistical comparisons
 * with holographic effects and responsive interactions.
 *
 * @author Austin Humphrey
 * @version 1.0.0
 */

import * as THREE from 'three';

/**
 * Brand colors
 */
const PYLON_COLORS = {
  ember: 0xFF6B35,
  burntOrange: 0xBF5700,
  gold: 0xC9A227,
  texasSoil: 0x8B4513,
  cream: 0xFAF8F5,
  charcoal: 0x1A1A1A,
};

/**
 * Individual stat data for a pylon
 */
export interface StatPylonData {
  /** Stat label (e.g., "AVG", "ERA", "HR") */
  label: string;
  /** Current value */
  value: number;
  /** Maximum possible value (for percentage calculation) */
  maxValue: number;
  /** Optional: display format */
  format?: 'decimal' | 'integer' | 'percentage';
  /** Optional: decimal places for display */
  decimals?: number;
  /** Optional: custom color override */
  color?: number;
  /** Optional: is this stat inverted (lower is better, like ERA) */
  inverted?: boolean;
  /** Optional: player/team name */
  name?: string;
}

/**
 * Configuration for stat pylon group
 */
export interface StatPylon3DConfig {
  /** Scale factor */
  scale?: number;
  /** Base width of each pylon */
  pylonWidth?: number;
  /** Maximum height of pylons */
  maxHeight?: number;
  /** Spacing between pylons */
  spacing?: number;
  /** Primary color */
  primaryColor?: number;
  /** Secondary color for gradient */
  secondaryColor?: number;
  /** Accent color for highlights */
  accentColor?: number;
  /** Enable glow effect */
  glow?: boolean;
  /** Glow intensity */
  glowIntensity?: number;
  /** Enable animation */
  animated?: boolean;
  /** Rise animation duration (seconds) */
  riseDuration?: number;
  /** Enable hover effects */
  interactive?: boolean;
  /** Show value labels */
  showLabels?: boolean;
  /** Show comparison lines */
  showComparison?: boolean;
  /** Holographic overlay effect */
  holographic?: boolean;
  /** Base platform style */
  baseStyle?: 'none' | 'circle' | 'square' | 'hexagon';
  /** Pylon geometry style */
  pylonStyle?: 'bar' | 'cylinder' | 'hexagonal' | 'tapered';
}

/**
 * Individual pylon mesh data
 */
interface PylonMesh {
  group: THREE.Group;
  bar: THREE.Mesh;
  glow: THREE.Mesh | null;
  cap: THREE.Mesh;
  base: THREE.Mesh;
  label: THREE.Group | null;
  data: StatPylonData;
  targetHeight: number;
  currentHeight: number;
  animating: boolean;
}

/**
 * 3D Stat Pylon Visualization
 */
export class StatPylon3D extends THREE.Object3D {
  private config: Required<StatPylon3DConfig>;
  private pylons: PylonMesh[] = [];
  private time: number = 0;
  private comparisonLine: THREE.Line | null = null;

  private static defaultConfig: Required<StatPylon3DConfig> = {
    scale: 1,
    pylonWidth: 5,
    maxHeight: 50,
    spacing: 10,
    primaryColor: PYLON_COLORS.ember,
    secondaryColor: PYLON_COLORS.burntOrange,
    accentColor: PYLON_COLORS.gold,
    glow: true,
    glowIntensity: 1.2,
    animated: true,
    riseDuration: 1.5,
    interactive: true,
    showLabels: true,
    showComparison: true,
    holographic: true,
    baseStyle: 'hexagon',
    pylonStyle: 'hexagonal',
  };

  constructor(config?: StatPylon3DConfig) {
    super();
    this.config = { ...StatPylon3D.defaultConfig, ...config };
  }

  /**
   * Set stats to display
   */
  public setStats(stats: StatPylonData[]): void {
    // Clear existing pylons
    this.clear();

    const totalWidth = stats.length * (this.config.pylonWidth + this.config.spacing) - this.config.spacing;
    const startX = -totalWidth / 2 + this.config.pylonWidth / 2;

    stats.forEach((stat, index) => {
      const pylon = this.createPylon(stat, index);
      pylon.group.position.x = startX + index * (this.config.pylonWidth + this.config.spacing);
      this.pylons.push(pylon);
      this.add(pylon.group);
    });

    // Create comparison line if enabled
    if (this.config.showComparison && stats.length > 1) {
      this.createComparisonLine();
    }

    // Start rise animation
    if (this.config.animated) {
      this.startRiseAnimation();
    }
  }

  /**
   * Create a single pylon
   */
  private createPylon(stat: StatPylonData, index: number): PylonMesh {
    const group = new THREE.Group();
    const s = this.config.scale;
    const width = this.config.pylonWidth * s;
    const percentage = stat.inverted
      ? 1 - (stat.value / stat.maxValue)
      : stat.value / stat.maxValue;
    const targetHeight = Math.max(0.1, percentage) * this.config.maxHeight * s;

    const color = stat.color || this.config.primaryColor;

    // Create base platform
    const base = this.createBase(width);
    group.add(base);

    // Create main pylon bar
    const bar = this.createBar(width, targetHeight, color);
    bar.position.y = 0; // Start at ground
    bar.scale.y = 0.01; // Start nearly flat
    group.add(bar);

    // Create glow effect
    let glow: THREE.Mesh | null = null;
    if (this.config.glow) {
      glow = this.createGlow(width, targetHeight, color);
      glow.position.y = 0;
      glow.scale.y = 0.01;
      group.add(glow);
    }

    // Create cap
    const cap = this.createCap(width, color);
    cap.position.y = 0.01;
    group.add(cap);

    // Create label
    let label: THREE.Group | null = null;
    if (this.config.showLabels) {
      label = this.createLabel(stat, width);
      label.position.y = 0.01;
      group.add(label);
    }

    return {
      group,
      bar,
      glow,
      cap,
      base,
      label,
      data: stat,
      targetHeight,
      currentHeight: 0.01,
      animating: this.config.animated,
    };
  }

  /**
   * Create base platform
   */
  private createBase(width: number): THREE.Mesh {
    let geometry: THREE.BufferGeometry;
    const baseWidth = width * 1.2;
    const baseHeight = width * 0.1;

    switch (this.config.baseStyle) {
      case 'hexagon':
        geometry = new THREE.CylinderGeometry(baseWidth / 2, baseWidth / 2, baseHeight, 6);
        break;
      case 'circle':
        geometry = new THREE.CylinderGeometry(baseWidth / 2, baseWidth / 2, baseHeight, 32);
        break;
      case 'square':
        geometry = new THREE.BoxGeometry(baseWidth, baseHeight, baseWidth);
        break;
      default:
        geometry = new THREE.BoxGeometry(0, 0, 0);
    }

    const material = new THREE.MeshStandardMaterial({
      color: PYLON_COLORS.charcoal,
      metalness: 0.8,
      roughness: 0.3,
    });

    const base = new THREE.Mesh(geometry, material);
    base.position.y = baseHeight / 2;
    base.receiveShadow = true;

    return base;
  }

  /**
   * Create main bar
   */
  private createBar(width: number, height: number, color: number): THREE.Mesh {
    let geometry: THREE.BufferGeometry;
    const barWidth = width * 0.8;

    switch (this.config.pylonStyle) {
      case 'hexagonal':
        geometry = new THREE.CylinderGeometry(barWidth / 2, barWidth / 2, height, 6);
        break;
      case 'cylinder':
        geometry = new THREE.CylinderGeometry(barWidth / 2, barWidth / 2, height, 32);
        break;
      case 'tapered':
        geometry = new THREE.CylinderGeometry(barWidth / 3, barWidth / 2, height, 32);
        break;
      default:
        geometry = new THREE.BoxGeometry(barWidth, height, barWidth);
    }

    // Center geometry at bottom
    geometry.translate(0, height / 2, 0);

    const material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        primaryColor: { value: new THREE.Color(color) },
        secondaryColor: { value: new THREE.Color(this.config.secondaryColor) },
        accentColor: { value: new THREE.Color(this.config.accentColor) },
        height: { value: height },
        holographic: { value: this.config.holographic },
      },
      vertexShader: `
        varying vec3 vPosition;
        varying vec3 vNormal;
        varying vec2 vUv;

        void main() {
          vPosition = position;
          vNormal = normalize(normalMatrix * normal);
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform vec3 primaryColor;
        uniform vec3 secondaryColor;
        uniform vec3 accentColor;
        uniform float height;
        uniform bool holographic;

        varying vec3 vPosition;
        varying vec3 vNormal;
        varying vec2 vUv;

        void main() {
          // Height-based gradient
          float heightFactor = vPosition.y / height;

          // Mix colors based on height
          vec3 color = mix(secondaryColor, primaryColor, heightFactor);

          // Add accent at top
          color = mix(color, accentColor, smoothstep(0.85, 1.0, heightFactor) * 0.5);

          // Fresnel rim lighting
          vec3 viewDir = normalize(cameraPosition - vPosition);
          float fresnel = pow(1.0 - max(dot(vNormal, viewDir), 0.0), 2.0);
          color += accentColor * fresnel * 0.3;

          // Holographic scanlines
          if (holographic) {
            float scanline = sin(vPosition.y * 20.0 + time * 5.0) * 0.5 + 0.5;
            scanline = pow(scanline, 8.0);
            color += accentColor * scanline * 0.1;
          }

          // Energy pulse from bottom
          float pulse = sin(heightFactor * 3.14159 - time * 2.0) * 0.5 + 0.5;
          pulse *= (1.0 - heightFactor);
          color += primaryColor * pulse * 0.2;

          gl_FragColor = vec4(color, 1.0);
        }
      `,
      side: THREE.DoubleSide,
    });

    const bar = new THREE.Mesh(geometry, material);
    bar.castShadow = true;

    return bar;
  }

  /**
   * Create glow effect mesh
   */
  private createGlow(width: number, height: number, color: number): THREE.Mesh {
    const glowWidth = width * 1.0;
    const geometry = new THREE.CylinderGeometry(glowWidth / 2, glowWidth / 2, height, 6);
    geometry.translate(0, height / 2, 0);

    const material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        color: { value: new THREE.Color(color) },
        intensity: { value: this.config.glowIntensity },
      },
      vertexShader: `
        varying vec3 vPosition;
        varying vec3 vNormal;

        void main() {
          vPosition = position;
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform vec3 color;
        uniform float intensity;

        varying vec3 vPosition;
        varying vec3 vNormal;

        void main() {
          vec3 viewDir = normalize(cameraPosition - vPosition);
          float fresnel = pow(1.0 - max(dot(vNormal, viewDir), 0.0), 3.0);

          float pulse = 0.8 + 0.2 * sin(time * 2.0);

          vec3 glowColor = color * intensity * fresnel * pulse;

          gl_FragColor = vec4(glowColor, fresnel * 0.5);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.BackSide,
    });

    return new THREE.Mesh(geometry, material);
  }

  /**
   * Create cap (top of pylon)
   */
  private createCap(width: number, color: number): THREE.Mesh {
    const capWidth = width * 0.9;
    let geometry: THREE.BufferGeometry;

    switch (this.config.pylonStyle) {
      case 'hexagonal':
        geometry = new THREE.CylinderGeometry(capWidth / 2, capWidth / 2, width * 0.1, 6);
        break;
      case 'cylinder':
      case 'tapered':
        geometry = new THREE.CylinderGeometry(capWidth / 2, capWidth / 2, width * 0.1, 32);
        break;
      default:
        geometry = new THREE.BoxGeometry(capWidth, width * 0.1, capWidth);
    }

    const material = new THREE.MeshStandardMaterial({
      color: this.config.accentColor,
      metalness: 0.9,
      roughness: 0.2,
      emissive: new THREE.Color(color),
      emissiveIntensity: 0.3,
    });

    const cap = new THREE.Mesh(geometry, material);
    cap.castShadow = true;

    return cap;
  }

  /**
   * Create label group (stat name and value)
   */
  private createLabel(stat: StatPylonData, width: number): THREE.Group {
    const group = new THREE.Group();

    // Create floating label plane
    const labelGeometry = new THREE.PlaneGeometry(width * 1.5, width * 0.8);
    const labelMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        backgroundColor: { value: new THREE.Color(PYLON_COLORS.charcoal) },
        borderColor: { value: new THREE.Color(this.config.accentColor) },
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
        uniform vec3 backgroundColor;
        uniform vec3 borderColor;
        varying vec2 vUv;

        void main() {
          float border = 0.05;
          float edgeX = step(border, vUv.x) * step(vUv.x, 1.0 - border);
          float edgeY = step(border, vUv.y) * step(vUv.y, 1.0 - border);
          float inside = edgeX * edgeY;

          vec3 color = mix(borderColor, backgroundColor, inside);
          float alpha = 0.85;

          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
    });

    const labelPlane = new THREE.Mesh(labelGeometry, labelMaterial);
    labelPlane.position.z = width * 0.6;
    group.add(labelPlane);

    // Store stat data for text rendering
    (group as THREE.Group & { statData: StatPylonData }).statData = stat;

    return group;
  }

  /**
   * Create comparison line across pylons
   */
  private createComparisonLine(): void {
    if (this.pylons.length < 2) return;

    // Find average height
    const avgHeight = this.pylons.reduce((sum, p) => sum + p.targetHeight, 0) / this.pylons.length;

    const points: number[] = [];
    this.pylons.forEach((pylon) => {
      points.push(pylon.group.position.x, avgHeight, 0);
    });

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));

    const material = new THREE.LineDashedMaterial({
      color: this.config.accentColor,
      dashSize: 1,
      gapSize: 0.5,
      transparent: true,
      opacity: 0.6,
    });

    this.comparisonLine = new THREE.Line(geometry, material);
    this.comparisonLine.computeLineDistances();
    this.comparisonLine.visible = false; // Show after animation
    this.add(this.comparisonLine);
  }

  /**
   * Start rise animation for all pylons
   */
  private startRiseAnimation(): void {
    this.pylons.forEach((pylon, index) => {
      pylon.animating = true;
      pylon.currentHeight = 0.01;

      // Stagger animation start
      setTimeout(() => {
        pylon.animating = true;
      }, index * 100);
    });
  }

  /**
   * Update animations (call each frame)
   */
  public update(delta: number): void {
    this.time += delta;

    let allComplete = true;

    this.pylons.forEach((pylon) => {
      // Update shader uniforms
      const barMaterial = pylon.bar.material as THREE.ShaderMaterial;
      if (barMaterial.uniforms) {
        barMaterial.uniforms.time.value = this.time;
      }

      if (pylon.glow) {
        const glowMaterial = pylon.glow.material as THREE.ShaderMaterial;
        if (glowMaterial.uniforms) {
          glowMaterial.uniforms.time.value = this.time;
        }
      }

      if (pylon.label) {
        const labelMaterial = (pylon.label.children[0] as THREE.Mesh).material as THREE.ShaderMaterial;
        if (labelMaterial.uniforms) {
          labelMaterial.uniforms.time.value = this.time;
        }
      }

      // Rise animation
      if (pylon.animating) {
        const speed = pylon.targetHeight / this.config.riseDuration;
        pylon.currentHeight = Math.min(
          pylon.currentHeight + speed * delta,
          pylon.targetHeight
        );

        const scaleY = pylon.currentHeight / pylon.targetHeight;
        pylon.bar.scale.y = scaleY;
        if (pylon.glow) pylon.glow.scale.y = scaleY;

        // Move cap and label to top
        pylon.cap.position.y = pylon.currentHeight;
        if (pylon.label) {
          pylon.label.position.y = pylon.currentHeight + this.config.pylonWidth * 0.6;
        }

        if (pylon.currentHeight >= pylon.targetHeight) {
          pylon.animating = false;
        } else {
          allComplete = false;
        }
      }
    });

    // Show comparison line when all animations complete
    if (allComplete && this.comparisonLine) {
      this.comparisonLine.visible = true;
    }
  }

  /**
   * Highlight a specific pylon
   */
  public highlightPylon(index: number): void {
    if (index < 0 || index >= this.pylons.length) return;

    this.pylons.forEach((pylon, i) => {
      const barMaterial = pylon.bar.material as THREE.ShaderMaterial;
      if (i === index) {
        barMaterial.uniforms.intensity = { value: 1.5 };
      } else {
        barMaterial.uniforms.intensity = { value: 0.7 };
      }
    });
  }

  /**
   * Reset highlights
   */
  public resetHighlights(): void {
    this.pylons.forEach((pylon) => {
      const barMaterial = pylon.bar.material as THREE.ShaderMaterial;
      barMaterial.uniforms.intensity = { value: 1.0 };
    });
  }

  /**
   * Clear all pylons
   */
  public clear(): void {
    this.pylons.forEach((pylon) => {
      this.remove(pylon.group);
      pylon.bar.geometry.dispose();
      (pylon.bar.material as THREE.Material).dispose();
      if (pylon.glow) {
        pylon.glow.geometry.dispose();
        (pylon.glow.material as THREE.Material).dispose();
      }
      pylon.cap.geometry.dispose();
      (pylon.cap.material as THREE.Material).dispose();
      pylon.base.geometry.dispose();
      (pylon.base.material as THREE.Material).dispose();
    });

    this.pylons = [];

    if (this.comparisonLine) {
      this.remove(this.comparisonLine);
      this.comparisonLine.geometry.dispose();
      (this.comparisonLine.material as THREE.Material).dispose();
      this.comparisonLine = null;
    }
  }

  /**
   * Dispose all resources
   */
  public dispose(): void {
    this.clear();
  }
}

/**
 * Preset configurations for stat pylons
 */
export const StatPylon3DPresets = {
  /** Standard comparison */
  standard: {
    pylonStyle: 'hexagonal' as const,
    baseStyle: 'hexagon' as const,
    glow: true,
    holographic: true,
    animated: true,
  },

  /** Minimal clean */
  minimal: {
    pylonStyle: 'bar' as const,
    baseStyle: 'square' as const,
    glow: false,
    holographic: false,
    animated: true,
  },

  /** Dramatic presentation */
  dramatic: {
    pylonStyle: 'tapered' as const,
    baseStyle: 'hexagon' as const,
    glow: true,
    glowIntensity: 2.0,
    holographic: true,
    riseDuration: 2.0,
  },

  /** Cylinder style */
  cylinder: {
    pylonStyle: 'cylinder' as const,
    baseStyle: 'circle' as const,
    glow: true,
    holographic: false,
  },
};

export default StatPylon3D;
