/**
 * Baseball Diamond 3D Visualization
 *
 * Interactive 3D baseball field with spray chart overlay,
 * zone visualization, and animated hit trajectories.
 *
 * @author Austin Humphrey
 * @version 1.0.0
 */

import * as THREE from 'three';
import { threeColors } from '../../styles/tokens/colors';
import { DataTrailSystem } from '../particles/DataTrailSystem';

// Hit data interface
export interface HitData {
  angle: number;        // Launch angle in degrees
  exitVelocity: number; // mph
  distance: number;     // feet
  result: 'single' | 'double' | 'triple' | 'homerun' | 'out' | 'error';
  x?: number;           // Field x position
  y?: number;           // Field y position
  trajectory?: THREE.Vector3[]; // Optional trajectory points
}

export interface DiamondConfig {
  scale?: number;
  showOutfield?: boolean;
  showInfield?: boolean;
  showFoulLines?: boolean;
  showBases?: boolean;
  showMound?: boolean;
  showWalls?: boolean;
  wallHeight?: number;
  centerFieldDistance?: number;
  leftFieldDistance?: number;
  rightFieldDistance?: number;
  interactive?: boolean;
  glowIntensity?: number;
}

/**
 * 3D Baseball Diamond with spray chart visualization
 */
export class BaseballDiamond extends THREE.Object3D {
  private config: Required<DiamondConfig>;

  // Field elements
  private infieldDirt: THREE.Mesh | null = null;
  private outfieldGrass: THREE.Mesh | null = null;
  private foulLines: THREE.Line[] = [];
  private bases: THREE.Mesh[] = [];
  private mound: THREE.Mesh | null = null;
  private walls: THREE.Mesh | null = null;

  // Hit visualization
  private hitMarkers: THREE.Group;
  private hitTrails: DataTrailSystem[] = [];
  private activeTrajectory: DataTrailSystem | null = null;

  // Spray chart heatmap
  private heatmapTexture: THREE.DataTexture | null = null;
  private heatmapMesh: THREE.Mesh | null = null;
  private heatmapData: Float32Array;
  private heatmapSize: number = 128;

  private static defaultConfig: Required<DiamondConfig> = {
    scale: 1,
    showOutfield: true,
    showInfield: true,
    showFoulLines: true,
    showBases: true,
    showMound: true,
    showWalls: true,
    wallHeight: 10,
    centerFieldDistance: 400,
    leftFieldDistance: 330,
    rightFieldDistance: 330,
    interactive: true,
    glowIntensity: 1.0,
  };

  // Field dimensions (in feet, scaled)
  private readonly BASE_DISTANCE = 90;  // 90 feet between bases
  private readonly MOUND_DISTANCE = 60.5; // 60'6" to mound
  private readonly INFIELD_RADIUS = 95;

  constructor(config?: DiamondConfig) {
    super();
    this.config = { ...BaseballDiamond.defaultConfig, ...config };

    this.hitMarkers = new THREE.Group();
    this.add(this.hitMarkers);

    // Initialize heatmap data
    this.heatmapData = new Float32Array(this.heatmapSize * this.heatmapSize * 4);

    this.createField();
  }

  /**
   * Create the complete baseball field
   */
  private createField(): void {
    const s = this.config.scale;

    // Create outfield grass
    if (this.config.showOutfield) {
      this.createOutfield(s);
    }

    // Create infield dirt
    if (this.config.showInfield) {
      this.createInfield(s);
    }

    // Create foul lines
    if (this.config.showFoulLines) {
      this.createFoulLines(s);
    }

    // Create bases
    if (this.config.showBases) {
      this.createBases(s);
    }

    // Create pitcher's mound
    if (this.config.showMound) {
      this.createMound(s);
    }

    // Create outfield walls
    if (this.config.showWalls) {
      this.createWalls(s);
    }

    // Create spray chart heatmap overlay
    this.createHeatmapOverlay(s);
  }

  /**
   * Create outfield grass
   */
  private createOutfield(scale: number): void {
    const shape = new THREE.Shape();

    // Start at home plate
    shape.moveTo(0, 0);

    // Left field line
    const leftAngle = (Math.PI / 4) + (Math.PI / 2);
    const rightAngle = -(Math.PI / 4) + (Math.PI / 2);

    shape.lineTo(
      Math.cos(leftAngle) * this.config.leftFieldDistance * scale,
      Math.sin(leftAngle) * this.config.leftFieldDistance * scale
    );

    // Outfield arc
    const arcPoints = 32;
    for (let i = 0; i <= arcPoints; i++) {
      const t = i / arcPoints;
      const angle = leftAngle + (rightAngle - leftAngle) * t;
      const dist = this.interpolateOutfieldDistance(t) * scale;
      shape.lineTo(Math.cos(angle) * dist, Math.sin(angle) * dist);
    }

    // Back to home
    shape.lineTo(0, 0);

    const geometry = new THREE.ShapeGeometry(shape);
    geometry.rotateX(-Math.PI / 2);

    const material = new THREE.MeshStandardMaterial({
      color: 0x228B22, // Forest green
      roughness: 0.8,
      metalness: 0.0,
    });

    this.outfieldGrass = new THREE.Mesh(geometry, material);
    this.outfieldGrass.receiveShadow = true;
    this.add(this.outfieldGrass);
  }

  /**
   * Interpolate outfield distance for realistic fence shape
   */
  private interpolateOutfieldDistance(t: number): number {
    // t: 0 = left field, 0.5 = center, 1 = right field
    const left = this.config.leftFieldDistance;
    const center = this.config.centerFieldDistance;
    const right = this.config.rightFieldDistance;

    if (t <= 0.5) {
      // Left to center
      const localT = t * 2;
      return left + (center - left) * Math.sin(localT * Math.PI / 2);
    } else {
      // Center to right
      const localT = (t - 0.5) * 2;
      return center + (right - center) * (1 - Math.cos(localT * Math.PI / 2));
    }
  }

  /**
   * Create infield dirt
   */
  private createInfield(scale: number): void {
    const shape = new THREE.Shape();

    // Diamond shape with rounded paths
    const baseRadius = this.BASE_DISTANCE * scale;
    const arcRadius = this.INFIELD_RADIUS * scale;

    // Start behind home plate
    shape.moveTo(-15 * scale, -5 * scale);

    // To first base area
    shape.quadraticCurveTo(
      baseRadius * 0.7, -5 * scale,
      baseRadius, baseRadius * 0.3
    );

    // Arc around second base
    shape.quadraticCurveTo(
      baseRadius * 1.1, baseRadius,
      baseRadius * 0.5, baseRadius * 1.3
    );

    shape.quadraticCurveTo(
      0, baseRadius * 1.4,
      -baseRadius * 0.5, baseRadius * 1.3
    );

    // To third base area
    shape.quadraticCurveTo(
      -baseRadius * 1.1, baseRadius,
      -baseRadius, baseRadius * 0.3
    );

    // Back to start
    shape.quadraticCurveTo(
      -baseRadius * 0.7, -5 * scale,
      -15 * scale, -5 * scale
    );

    const geometry = new THREE.ShapeGeometry(shape);
    geometry.rotateX(-Math.PI / 2);

    const material = new THREE.MeshStandardMaterial({
      color: 0xC4A35A, // Dirt brown
      roughness: 0.9,
      metalness: 0.0,
    });

    this.infieldDirt = new THREE.Mesh(geometry, material);
    this.infieldDirt.position.y = 0.1;
    this.infieldDirt.receiveShadow = true;
    this.add(this.infieldDirt);
  }

  /**
   * Create foul lines
   */
  private createFoulLines(scale: number): void {
    const material = new THREE.LineBasicMaterial({
      color: 0xFFFFFF,
      linewidth: 2,
    });

    // Left field line
    const leftPoints = [
      new THREE.Vector3(0, 0.2, 0),
      new THREE.Vector3(
        -this.config.leftFieldDistance * scale * Math.sin(Math.PI / 4),
        0.2,
        this.config.leftFieldDistance * scale * Math.cos(Math.PI / 4)
      ),
    ];
    const leftGeometry = new THREE.BufferGeometry().setFromPoints(leftPoints);
    const leftLine = new THREE.Line(leftGeometry, material);
    this.foulLines.push(leftLine);
    this.add(leftLine);

    // Right field line
    const rightPoints = [
      new THREE.Vector3(0, 0.2, 0),
      new THREE.Vector3(
        this.config.rightFieldDistance * scale * Math.sin(Math.PI / 4),
        0.2,
        this.config.rightFieldDistance * scale * Math.cos(Math.PI / 4)
      ),
    ];
    const rightGeometry = new THREE.BufferGeometry().setFromPoints(rightPoints);
    const rightLine = new THREE.Line(rightGeometry, material);
    this.foulLines.push(rightLine);
    this.add(rightLine);
  }

  /**
   * Create bases
   */
  private createBases(scale: number): void {
    const baseSize = 15 * scale;
    const baseGeometry = new THREE.BoxGeometry(baseSize, 2, baseSize);
    const baseMaterial = new THREE.MeshStandardMaterial({
      color: 0xFFFFFF,
      roughness: 0.5,
      metalness: 0.1,
    });

    // Base positions (rotated 45 degrees)
    const dist = this.BASE_DISTANCE * scale * Math.SQRT1_2;
    const positions = [
      new THREE.Vector3(0, 1, 0), // Home plate
      new THREE.Vector3(dist, 1, dist), // First base
      new THREE.Vector3(0, 1, dist * 2), // Second base
      new THREE.Vector3(-dist, 1, dist), // Third base
    ];

    // Home plate is pentagon shaped
    const homeShape = new THREE.Shape();
    const hs = baseSize / 2;
    homeShape.moveTo(0, -hs);
    homeShape.lineTo(hs, -hs / 2);
    homeShape.lineTo(hs, hs / 2);
    homeShape.lineTo(-hs, hs / 2);
    homeShape.lineTo(-hs, -hs / 2);
    homeShape.lineTo(0, -hs);

    const homeGeometry = new THREE.ExtrudeGeometry(homeShape, {
      depth: 2,
      bevelEnabled: false,
    });
    homeGeometry.rotateX(-Math.PI / 2);

    const homePlate = new THREE.Mesh(homeGeometry, baseMaterial);
    homePlate.position.copy(positions[0]);
    homePlate.castShadow = true;
    this.bases.push(homePlate);
    this.add(homePlate);

    // Other bases
    for (let i = 1; i < positions.length; i++) {
      const base = new THREE.Mesh(baseGeometry, baseMaterial.clone());
      base.position.copy(positions[i]);
      base.rotation.y = Math.PI / 4;
      base.castShadow = true;
      this.bases.push(base);
      this.add(base);
    }
  }

  /**
   * Create pitcher's mound
   */
  private createMound(scale: number): void {
    const moundGeometry = new THREE.CylinderGeometry(
      10 * scale, // top radius
      18 * scale, // bottom radius
      10 * scale, // height
      32
    );

    const moundMaterial = new THREE.MeshStandardMaterial({
      color: 0xC4A35A,
      roughness: 0.9,
    });

    this.mound = new THREE.Mesh(moundGeometry, moundMaterial);
    this.mound.position.set(0, 5 * scale, this.MOUND_DISTANCE * scale);
    this.mound.castShadow = true;
    this.mound.receiveShadow = true;
    this.add(this.mound);

    // Rubber on mound
    const rubberGeometry = new THREE.BoxGeometry(24 * scale, 1, 6 * scale);
    const rubberMaterial = new THREE.MeshStandardMaterial({
      color: 0xFFFFFF,
      roughness: 0.5,
    });
    const rubber = new THREE.Mesh(rubberGeometry, rubberMaterial);
    rubber.position.set(0, 10.5 * scale, this.MOUND_DISTANCE * scale);
    this.add(rubber);
  }

  /**
   * Create outfield walls
   */
  private createWalls(scale: number): void {
    const wallMaterial = new THREE.MeshStandardMaterial({
      color: 0x1A472A, // Dark green padding
      roughness: 0.7,
    });

    const wallShape = new THREE.Shape();
    const arcPoints = 64;

    const leftAngle = (Math.PI / 4) + (Math.PI / 2);
    const rightAngle = -(Math.PI / 4) + (Math.PI / 2);

    // Create wall path
    const points: THREE.Vector2[] = [];
    for (let i = 0; i <= arcPoints; i++) {
      const t = i / arcPoints;
      const angle = leftAngle + (rightAngle - leftAngle) * t;
      const dist = this.interpolateOutfieldDistance(t) * scale;
      points.push(new THREE.Vector2(Math.cos(angle) * dist, Math.sin(angle) * dist));
    }

    const wallPath = new THREE.CatmullRomCurve3(
      points.map((p) => new THREE.Vector3(p.x, 0, p.y))
    );

    const wallGeometry = new THREE.TubeGeometry(
      wallPath,
      64,
      this.config.wallHeight * scale / 2,
      8,
      false
    );

    this.walls = new THREE.Mesh(wallGeometry, wallMaterial);
    this.walls.position.y = this.config.wallHeight * scale / 2;
    this.walls.castShadow = true;
    this.walls.receiveShadow = true;
    this.add(this.walls);
  }

  /**
   * Create spray chart heatmap overlay
   */
  private createHeatmapOverlay(scale: number): void {
    // Create data texture for heatmap
    this.heatmapTexture = new THREE.DataTexture(
      this.heatmapData,
      this.heatmapSize,
      this.heatmapSize,
      THREE.RGBAFormat,
      THREE.FloatType
    );
    this.heatmapTexture.needsUpdate = true;

    const heatmapMaterial = new THREE.ShaderMaterial({
      uniforms: {
        heatmap: { value: this.heatmapTexture },
        colorCold: { value: new THREE.Color(threeColors.gold) },
        colorMid: { value: new THREE.Color(threeColors.ember) },
        colorHot: { value: new THREE.Color(threeColors.burntOrange) },
        opacity: { value: 0.6 },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D heatmap;
        uniform vec3 colorCold;
        uniform vec3 colorMid;
        uniform vec3 colorHot;
        uniform float opacity;

        varying vec2 vUv;

        void main() {
          float value = texture2D(heatmap, vUv).r;
          if (value < 0.01) discard;

          vec3 color;
          if (value < 0.5) {
            color = mix(colorCold, colorMid, value * 2.0);
          } else {
            color = mix(colorMid, colorHot, (value - 0.5) * 2.0);
          }

          gl_FragColor = vec4(color, value * opacity);
        }
      `,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
    });

    const heatmapGeometry = new THREE.PlaneGeometry(
      this.config.centerFieldDistance * scale * 2,
      this.config.centerFieldDistance * scale * 2
    );
    heatmapGeometry.rotateX(-Math.PI / 2);

    this.heatmapMesh = new THREE.Mesh(heatmapGeometry, heatmapMaterial);
    this.heatmapMesh.position.y = 0.5;
    this.heatmapMesh.visible = false; // Hidden by default
    this.add(this.heatmapMesh);
  }

  /**
   * Add a hit to the spray chart
   */
  public addHit(hit: HitData): void {
    const s = this.config.scale;

    // Calculate landing position from angle and distance
    let x: number, z: number;

    if (hit.x !== undefined && hit.y !== undefined) {
      x = hit.x * s;
      z = hit.y * s;
    } else {
      // Calculate from launch angle and distance
      const fieldAngle = (hit.angle * Math.PI) / 180;
      x = Math.sin(fieldAngle) * hit.distance * s;
      z = Math.cos(fieldAngle) * hit.distance * s;
    }

    // Create hit marker
    const markerGeometry = new THREE.SphereGeometry(3 * s, 16, 16);
    const markerColor = this.getHitResultColor(hit.result);
    const markerMaterial = new THREE.MeshBasicMaterial({
      color: markerColor,
      transparent: true,
      opacity: 0.8,
    });

    const marker = new THREE.Mesh(markerGeometry, markerMaterial);
    marker.position.set(x, 5 * s, z);
    this.hitMarkers.add(marker);

    // Add glow ring
    const glowGeometry = new THREE.RingGeometry(4 * s, 8 * s, 32);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: markerColor,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide,
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    glow.rotation.x = -Math.PI / 2;
    glow.position.set(x, 0.5 * s, z);
    this.hitMarkers.add(glow);

    // Update heatmap
    this.updateHeatmap(x, z);

    // Create trajectory if provided
    if (hit.trajectory && hit.trajectory.length > 0) {
      const trail = new DataTrailSystem({
        color: markerColor,
        glowColor: markerColor,
        trailLength: hit.trajectory.length,
      });
      trail.setPath(hit.trajectory);
      this.hitTrails.push(trail);
      this.add(trail);
    }
  }

  /**
   * Get color based on hit result
   */
  private getHitResultColor(result: HitData['result']): number {
    switch (result) {
      case 'homerun':
        return threeColors.ember;
      case 'triple':
        return threeColors.burntOrange;
      case 'double':
        return threeColors.gold;
      case 'single':
        return 0x22C55E; // Green
      case 'out':
        return 0x6B7280; // Gray
      case 'error':
        return 0xEF4444; // Red
      default:
        return threeColors.cream;
    }
  }

  /**
   * Update heatmap with new hit data
   */
  private updateHeatmap(x: number, z: number): void {
    if (!this.heatmapTexture) return;

    const fieldSize = this.config.centerFieldDistance * this.config.scale * 2;

    // Convert world coordinates to texture coordinates
    const u = (x / fieldSize + 0.5) * this.heatmapSize;
    const v = (z / fieldSize + 0.5) * this.heatmapSize;

    // Gaussian splat
    const radius = 10;
    const intensity = 0.2;

    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const px = Math.floor(u + dx);
        const py = Math.floor(v + dy);

        if (px < 0 || px >= this.heatmapSize || py < 0 || py >= this.heatmapSize) continue;

        const dist = Math.sqrt(dx * dx + dy * dy);
        const falloff = Math.exp(-(dist * dist) / (radius * radius * 0.5));

        const idx = (py * this.heatmapSize + px) * 4;
        this.heatmapData[idx] = Math.min(1, this.heatmapData[idx] + intensity * falloff);
      }
    }

    this.heatmapTexture.needsUpdate = true;
  }

  /**
   * Show/hide spray chart heatmap
   */
  public setHeatmapVisible(visible: boolean): void {
    if (this.heatmapMesh) {
      this.heatmapMesh.visible = visible;
    }
  }

  /**
   * Clear all hit markers and trails
   */
  public clearHits(): void {
    while (this.hitMarkers.children.length > 0) {
      const child = this.hitMarkers.children[0];
      this.hitMarkers.remove(child);
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        (child.material as THREE.Material).dispose();
      }
    }

    for (const trail of this.hitTrails) {
      trail.dispose();
      this.remove(trail);
    }
    this.hitTrails = [];

    // Clear heatmap
    this.heatmapData.fill(0);
    if (this.heatmapTexture) {
      this.heatmapTexture.needsUpdate = true;
    }
  }

  /**
   * Animate trajectory
   */
  public animateTrajectory(
    start: THREE.Vector3,
    end: THREE.Vector3,
    peakHeight: number,
    duration: number,
    onComplete?: () => void
  ): void {
    if (this.activeTrajectory) {
      this.activeTrajectory.dispose();
      this.remove(this.activeTrajectory);
    }

    this.activeTrajectory = new DataTrailSystem({
      color: threeColors.ember,
      glowColor: threeColors.burntOrange,
      trailLength: 100,
      animated: true,
    });
    this.add(this.activeTrajectory);

    // Generate parabolic trajectory
    const points: THREE.Vector3[] = [];
    const segments = 100;

    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const pos = new THREE.Vector3().lerpVectors(start, end, t);

      // Parabolic height
      const heightT = 4 * t * (1 - t);
      pos.y += peakHeight * heightT;

      points.push(pos);
    }

    // Animate adding points
    let currentPoint = 0;
    const interval = setInterval(() => {
      if (currentPoint < points.length) {
        this.activeTrajectory!.addPoint(points[currentPoint]);
        currentPoint++;
      } else {
        clearInterval(interval);
        if (onComplete) onComplete();
      }
    }, duration / segments);
  }

  /**
   * Update animation
   */
  public update(delta: number): void {
    for (const trail of this.hitTrails) {
      trail.update(delta);
    }
    if (this.activeTrajectory) {
      this.activeTrajectory.update(delta);
    }
  }

  /**
   * Dispose all resources
   */
  public dispose(): void {
    this.clearHits();

    if (this.infieldDirt) {
      this.infieldDirt.geometry.dispose();
      (this.infieldDirt.material as THREE.Material).dispose();
    }

    if (this.outfieldGrass) {
      this.outfieldGrass.geometry.dispose();
      (this.outfieldGrass.material as THREE.Material).dispose();
    }

    for (const line of this.foulLines) {
      line.geometry.dispose();
      (line.material as THREE.Material).dispose();
    }

    for (const base of this.bases) {
      base.geometry.dispose();
      (base.material as THREE.Material).dispose();
    }

    if (this.mound) {
      this.mound.geometry.dispose();
      (this.mound.material as THREE.Material).dispose();
    }

    if (this.walls) {
      this.walls.geometry.dispose();
      (this.walls.material as THREE.Material).dispose();
    }

    if (this.heatmapMesh) {
      this.heatmapMesh.geometry.dispose();
      (this.heatmapMesh.material as THREE.Material).dispose();
    }

    if (this.heatmapTexture) {
      this.heatmapTexture.dispose();
    }
  }
}

export default BaseballDiamond;
