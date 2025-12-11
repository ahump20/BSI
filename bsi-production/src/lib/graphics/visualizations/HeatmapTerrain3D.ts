/**
 * HeatmapTerrain3D
 *
 * Player positioning as 3D terrain deformation.
 * Creates dramatic landscape visualizations from
 * statistical data, perfect for spray charts,
 * defensive positioning, and game flow analysis.
 *
 * @author Austin Humphrey
 * @version 1.0.0
 */

import * as THREE from 'three';

/**
 * Brand colors
 */
const TERRAIN_COLORS = {
  ember: 0xFF6B35,
  burntOrange: 0xBF5700,
  gold: 0xC9A227,
  texasSoil: 0x8B4513,
  cream: 0xFAF8F5,
  charcoal: 0x1A1A1A,
  midnight: 0x0D0D0D,
};

/**
 * Data point for heatmap
 */
export interface HeatmapDataPoint {
  /** X position (normalized 0-1) */
  x: number;
  /** Y position (normalized 0-1) */
  y: number;
  /** Intensity/value (0-1) */
  value: number;
  /** Optional: category for color coding */
  category?: string;
}

/**
 * Configuration for heatmap terrain
 */
export interface HeatmapTerrain3DConfig {
  /** Width of terrain */
  width?: number;
  /** Depth of terrain */
  depth?: number;
  /** Maximum height of terrain deformation */
  maxHeight?: number;
  /** Resolution (segments per axis) */
  resolution?: number;
  /** Cold color (low values) */
  coldColor?: number;
  /** Mid color (medium values) */
  midColor?: number;
  /** Hot color (high values) */
  hotColor?: number;
  /** Enable wireframe overlay */
  wireframe?: boolean;
  /** Wireframe color */
  wireframeColor?: number;
  /** Enable contour lines */
  contours?: boolean;
  /** Number of contour levels */
  contourLevels?: number;
  /** Enable point markers */
  showPoints?: boolean;
  /** Point size */
  pointSize?: number;
  /** Smoothing factor for height interpolation */
  smoothing?: number;
  /** Enable animated updates */
  animated?: boolean;
  /** Animation speed */
  animationSpeed?: number;
  /** Enable glow effect */
  glow?: boolean;
  /** Terrain style */
  style?: 'smooth' | 'stepped' | 'crystalline';
}

/**
 * 3D Heatmap Terrain Visualization
 */
export class HeatmapTerrain3D extends THREE.Object3D {
  private config: Required<HeatmapTerrain3DConfig>;

  // Terrain mesh
  private terrain: THREE.Mesh | null = null;
  private terrainGeometry: THREE.PlaneGeometry | null = null;
  private terrainMaterial: THREE.ShaderMaterial | null = null;

  // Wireframe overlay
  private wireframeMesh: THREE.LineSegments | null = null;

  // Contour lines
  private contourGroup: THREE.Group;

  // Data points
  private pointsGroup: THREE.Group;
  private dataPoints: HeatmapDataPoint[] = [];

  // Height data
  private heightData: Float32Array;
  private targetHeightData: Float32Array;

  // Animation
  private time: number = 0;

  private static defaultConfig: Required<HeatmapTerrain3DConfig> = {
    width: 100,
    depth: 100,
    maxHeight: 30,
    resolution: 64,
    coldColor: TERRAIN_COLORS.midnight,
    midColor: TERRAIN_COLORS.burntOrange,
    hotColor: TERRAIN_COLORS.ember,
    wireframe: true,
    wireframeColor: TERRAIN_COLORS.gold,
    contours: true,
    contourLevels: 5,
    showPoints: true,
    pointSize: 2,
    smoothing: 2,
    animated: true,
    animationSpeed: 2,
    glow: true,
    style: 'smooth',
  };

  constructor(config?: HeatmapTerrain3DConfig) {
    super();
    this.config = { ...HeatmapTerrain3D.defaultConfig, ...config };

    this.contourGroup = new THREE.Group();
    this.pointsGroup = new THREE.Group();

    this.add(this.contourGroup);
    this.add(this.pointsGroup);

    // Initialize height data arrays
    const count = (this.config.resolution + 1) * (this.config.resolution + 1);
    this.heightData = new Float32Array(count);
    this.targetHeightData = new Float32Array(count);

    this.createTerrain();
  }

  /**
   * Create the terrain mesh
   */
  private createTerrain(): void {
    this.terrainGeometry = new THREE.PlaneGeometry(
      this.config.width,
      this.config.depth,
      this.config.resolution,
      this.config.resolution
    );

    // Rotate to horizontal
    this.terrainGeometry.rotateX(-Math.PI / 2);

    this.terrainMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        coldColor: { value: new THREE.Color(this.config.coldColor) },
        midColor: { value: new THREE.Color(this.config.midColor) },
        hotColor: { value: new THREE.Color(this.config.hotColor) },
        maxHeight: { value: this.config.maxHeight },
        glow: { value: this.config.glow },
        style: { value: this.getStyleValue() },
      },
      vertexShader: `
        uniform float time;
        uniform float maxHeight;
        uniform int style;

        varying vec3 vPosition;
        varying vec3 vNormal;
        varying float vHeight;
        varying vec2 vUv;

        void main() {
          vPosition = position;
          vNormal = normalize(normalMatrix * normal);
          vHeight = position.y / maxHeight;
          vUv = uv;

          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform vec3 coldColor;
        uniform vec3 midColor;
        uniform vec3 hotColor;
        uniform float maxHeight;
        uniform bool glow;
        uniform int style;

        varying vec3 vPosition;
        varying vec3 vNormal;
        varying float vHeight;
        varying vec2 vUv;

        void main() {
          // Height-based color gradient
          float h = clamp(vHeight, 0.0, 1.0);

          vec3 color;
          if (h < 0.5) {
            color = mix(coldColor, midColor, h * 2.0);
          } else {
            color = mix(midColor, hotColor, (h - 0.5) * 2.0);
          }

          // Lighting
          vec3 lightDir = normalize(vec3(1.0, 2.0, 1.0));
          float diff = max(dot(vNormal, lightDir), 0.0);
          color *= 0.5 + diff * 0.5;

          // Fresnel rim
          vec3 viewDir = normalize(cameraPosition - vPosition);
          float fresnel = pow(1.0 - max(dot(vNormal, viewDir), 0.0), 2.0);

          if (glow) {
            color += hotColor * fresnel * h * 0.5;
          }

          // Stepped style
          if (style == 1) {
            float steps = 8.0;
            float stepped = floor(h * steps) / steps;
            color = mix(coldColor, hotColor, stepped);
          }

          // Crystalline style - add faceted look
          if (style == 2) {
            float facet = abs(dot(vNormal, vec3(0.0, 1.0, 0.0)));
            color *= 0.7 + facet * 0.6;
          }

          // Pulse effect at peaks
          float pulse = 0.9 + 0.1 * sin(time * 3.0 + vHeight * 10.0);
          color *= pulse;

          gl_FragColor = vec4(color, 1.0);
        }
      `,
      side: THREE.DoubleSide,
    });

    this.terrain = new THREE.Mesh(this.terrainGeometry, this.terrainMaterial);
    this.terrain.receiveShadow = true;
    this.terrain.castShadow = true;
    this.add(this.terrain);

    // Create wireframe
    if (this.config.wireframe) {
      this.createWireframe();
    }
  }

  /**
   * Get style value for shader
   */
  private getStyleValue(): number {
    switch (this.config.style) {
      case 'stepped':
        return 1;
      case 'crystalline':
        return 2;
      default:
        return 0;
    }
  }

  /**
   * Create wireframe overlay
   */
  private createWireframe(): void {
    if (!this.terrainGeometry) return;

    const wireframeGeometry = new THREE.WireframeGeometry(this.terrainGeometry);

    const wireframeMaterial = new THREE.ShaderMaterial({
      uniforms: {
        color: { value: new THREE.Color(this.config.wireframeColor) },
        opacity: { value: 0.3 },
      },
      vertexShader: `
        void main() {
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 color;
        uniform float opacity;
        void main() {
          gl_FragColor = vec4(color, opacity);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.wireframeMesh = new THREE.LineSegments(wireframeGeometry, wireframeMaterial);
    this.wireframeMesh.position.y = 0.1; // Slight offset to prevent z-fighting
    this.add(this.wireframeMesh);
  }

  /**
   * Set data points and update terrain
   */
  public setData(points: HeatmapDataPoint[]): void {
    this.dataPoints = points;
    this.updateHeightData();

    if (this.config.showPoints) {
      this.updatePointMarkers();
    }

    if (this.config.contours) {
      this.updateContours();
    }
  }

  /**
   * Add a single data point
   */
  public addPoint(point: HeatmapDataPoint): void {
    this.dataPoints.push(point);
    this.updateHeightData();

    if (this.config.showPoints) {
      this.addPointMarker(point);
    }

    if (this.config.contours) {
      this.updateContours();
    }
  }

  /**
   * Update height data from points
   */
  private updateHeightData(): void {
    const res = this.config.resolution + 1;

    // Reset target height data
    this.targetHeightData.fill(0);

    // For each data point, apply gaussian splat
    this.dataPoints.forEach((point) => {
      const px = point.x * res;
      const py = point.y * res;
      const radius = this.config.smoothing * (res / 10);
      const intensity = point.value * this.config.maxHeight;

      for (let y = 0; y < res; y++) {
        for (let x = 0; x < res; x++) {
          const dx = x - px;
          const dy = y - py;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < radius * 3) {
            const falloff = Math.exp(-(dist * dist) / (radius * radius));
            const idx = y * res + x;
            this.targetHeightData[idx] = Math.max(
              this.targetHeightData[idx],
              intensity * falloff
            );
          }
        }
      }
    });
  }

  /**
   * Update point markers
   */
  private updatePointMarkers(): void {
    // Clear existing markers
    while (this.pointsGroup.children.length > 0) {
      const child = this.pointsGroup.children[0];
      this.pointsGroup.remove(child);
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        (child.material as THREE.Material).dispose();
      }
    }

    // Add new markers
    this.dataPoints.forEach((point) => {
      this.addPointMarker(point);
    });
  }

  /**
   * Add a single point marker
   */
  private addPointMarker(point: HeatmapDataPoint): void {
    const x = (point.x - 0.5) * this.config.width;
    const z = (point.y - 0.5) * this.config.depth;
    const y = point.value * this.config.maxHeight + 1;

    const geometry = new THREE.SphereGeometry(this.config.pointSize, 16, 16);

    // Color based on value
    const colorValue = point.value;
    const color = colorValue < 0.5
      ? new THREE.Color(this.config.midColor).lerp(new THREE.Color(this.config.coldColor), (0.5 - colorValue) * 2)
      : new THREE.Color(this.config.midColor).lerp(new THREE.Color(this.config.hotColor), (colorValue - 0.5) * 2);

    const material = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.9,
    });

    const marker = new THREE.Mesh(geometry, material);
    marker.position.set(x, y, z);
    this.pointsGroup.add(marker);

    // Add glow ring
    const ringGeometry = new THREE.RingGeometry(
      this.config.pointSize * 1.2,
      this.config.pointSize * 2,
      32
    );
    const ringMaterial = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.4,
      side: THREE.DoubleSide,
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.position.set(x, y, z);
    ring.rotation.x = -Math.PI / 2;
    this.pointsGroup.add(ring);
  }

  /**
   * Update contour lines
   */
  private updateContours(): void {
    // Clear existing contours
    while (this.contourGroup.children.length > 0) {
      const child = this.contourGroup.children[0];
      this.contourGroup.remove(child);
      if (child instanceof THREE.Line) {
        child.geometry.dispose();
        (child.material as THREE.Material).dispose();
      }
    }

    // Generate contour lines at each level
    for (let level = 1; level <= this.config.contourLevels; level++) {
      const height = (level / this.config.contourLevels) * this.config.maxHeight;
      const contour = this.generateContourLine(height, level / this.config.contourLevels);
      if (contour) {
        this.contourGroup.add(contour);
      }
    }
  }

  /**
   * Generate a single contour line at given height
   */
  private generateContourLine(height: number, normalizedHeight: number): THREE.Line | null {
    const res = this.config.resolution + 1;
    const points: THREE.Vector3[] = [];

    // Simple marching squares for contour extraction
    const cellWidth = this.config.width / this.config.resolution;
    const cellDepth = this.config.depth / this.config.resolution;

    for (let y = 0; y < this.config.resolution; y++) {
      for (let x = 0; x < this.config.resolution; x++) {
        // Get corner heights
        const h00 = this.targetHeightData[y * res + x];
        const h10 = this.targetHeightData[y * res + (x + 1)];
        const h01 = this.targetHeightData[(y + 1) * res + x];
        const h11 = this.targetHeightData[(y + 1) * res + (x + 1)];

        // Check if contour passes through this cell
        const above00 = h00 >= height;
        const above10 = h10 >= height;
        const above01 = h01 >= height;
        const above11 = h11 >= height;

        const count = (above00 ? 1 : 0) + (above10 ? 1 : 0) + (above01 ? 1 : 0) + (above11 ? 1 : 0);

        if (count > 0 && count < 4) {
          // Contour passes through this cell
          const worldX = (x / this.config.resolution - 0.5) * this.config.width;
          const worldZ = (y / this.config.resolution - 0.5) * this.config.depth;

          points.push(new THREE.Vector3(
            worldX + cellWidth / 2,
            height + 0.5,
            worldZ + cellDepth / 2
          ));
        }
      }
    }

    if (points.length < 2) return null;

    const geometry = new THREE.BufferGeometry().setFromPoints(points);

    // Color based on height
    const color = new THREE.Color(this.config.midColor).lerp(
      new THREE.Color(this.config.hotColor),
      normalizedHeight
    );

    const material = new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity: 0.6,
    });

    return new THREE.Line(geometry, material);
  }

  /**
   * Update terrain geometry from height data
   */
  private updateTerrainGeometry(): void {
    if (!this.terrainGeometry) return;

    const positions = this.terrainGeometry.attributes.position as THREE.BufferAttribute;
    const res = this.config.resolution + 1;

    for (let i = 0; i < positions.count; i++) {
      const targetY = this.targetHeightData[i];

      if (this.config.animated) {
        // Smooth interpolation
        this.heightData[i] += (targetY - this.heightData[i]) * 0.1;
      } else {
        this.heightData[i] = targetY;
      }

      // Update Y position (index 1 in the position attribute)
      // PlaneGeometry is X-Z, we rotate it, so Y becomes height
      positions.setY(i, this.heightData[i]);
    }

    positions.needsUpdate = true;
    this.terrainGeometry.computeVertexNormals();

    // Update wireframe
    if (this.wireframeMesh) {
      const wireGeom = new THREE.WireframeGeometry(this.terrainGeometry);
      this.wireframeMesh.geometry.dispose();
      this.wireframeMesh.geometry = wireGeom;
    }
  }

  /**
   * Update animation (call each frame)
   */
  public update(delta: number): void {
    this.time += delta;

    // Update terrain material
    if (this.terrainMaterial) {
      this.terrainMaterial.uniforms.time.value = this.time;
    }

    // Animate terrain deformation
    if (this.config.animated) {
      this.updateTerrainGeometry();
    }

    // Animate point markers
    this.pointsGroup.children.forEach((child, i) => {
      if (child instanceof THREE.Mesh) {
        const scale = 1 + 0.1 * Math.sin(this.time * 2 + i * 0.5);
        child.scale.setScalar(scale);
      }
    });
  }

  /**
   * Set terrain colors
   */
  public setColors(cold: number, mid: number, hot: number): void {
    if (this.terrainMaterial) {
      this.terrainMaterial.uniforms.coldColor.value = new THREE.Color(cold);
      this.terrainMaterial.uniforms.midColor.value = new THREE.Color(mid);
      this.terrainMaterial.uniforms.hotColor.value = new THREE.Color(hot);
    }
  }

  /**
   * Toggle wireframe visibility
   */
  public setWireframeVisible(visible: boolean): void {
    if (this.wireframeMesh) {
      this.wireframeMesh.visible = visible;
    }
  }

  /**
   * Toggle contour visibility
   */
  public setContoursVisible(visible: boolean): void {
    this.contourGroup.visible = visible;
  }

  /**
   * Toggle points visibility
   */
  public setPointsVisible(visible: boolean): void {
    this.pointsGroup.visible = visible;
  }

  /**
   * Clear all data
   */
  public clear(): void {
    this.dataPoints = [];
    this.targetHeightData.fill(0);
    this.heightData.fill(0);

    // Clear point markers
    while (this.pointsGroup.children.length > 0) {
      const child = this.pointsGroup.children[0];
      this.pointsGroup.remove(child);
    }

    // Clear contours
    while (this.contourGroup.children.length > 0) {
      const child = this.contourGroup.children[0];
      this.contourGroup.remove(child);
    }

    this.updateTerrainGeometry();
  }

  /**
   * Dispose all resources
   */
  public dispose(): void {
    this.clear();

    if (this.terrain) {
      this.terrain.geometry.dispose();
      (this.terrain.material as THREE.Material).dispose();
      this.remove(this.terrain);
    }

    if (this.wireframeMesh) {
      this.wireframeMesh.geometry.dispose();
      (this.wireframeMesh.material as THREE.Material).dispose();
      this.remove(this.wireframeMesh);
    }
  }
}

/**
 * Preset configurations for heatmap terrains
 */
export const HeatmapTerrain3DPresets = {
  /** Spray chart visualization */
  sprayChart: {
    width: 150,
    depth: 150,
    maxHeight: 20,
    resolution: 48,
    coldColor: TERRAIN_COLORS.midnight,
    midColor: TERRAIN_COLORS.burntOrange,
    hotColor: TERRAIN_COLORS.ember,
    wireframe: true,
    contours: true,
    style: 'smooth' as const,
  },

  /** Defensive positioning */
  defensive: {
    width: 200,
    depth: 200,
    maxHeight: 15,
    resolution: 64,
    coldColor: TERRAIN_COLORS.charcoal,
    midColor: TERRAIN_COLORS.gold,
    hotColor: TERRAIN_COLORS.ember,
    wireframe: false,
    contours: true,
    contourLevels: 8,
    style: 'smooth' as const,
  },

  /** Statistical analysis */
  analytical: {
    width: 100,
    depth: 100,
    maxHeight: 40,
    resolution: 32,
    coldColor: TERRAIN_COLORS.midnight,
    midColor: TERRAIN_COLORS.gold,
    hotColor: TERRAIN_COLORS.cream,
    wireframe: true,
    wireframeColor: TERRAIN_COLORS.ember,
    contours: false,
    style: 'stepped' as const,
  },

  /** Dramatic presentation */
  dramatic: {
    width: 120,
    depth: 120,
    maxHeight: 50,
    resolution: 64,
    coldColor: TERRAIN_COLORS.midnight,
    midColor: TERRAIN_COLORS.burntOrange,
    hotColor: TERRAIN_COLORS.cream,
    wireframe: true,
    contours: true,
    glow: true,
    style: 'crystalline' as const,
  },
};

export default HeatmapTerrain3D;
