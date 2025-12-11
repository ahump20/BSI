/**
 * StrikeZone3D
 *
 * K-Zone style pitch tracking, but holographic.
 * Creates an immersive 3D strike zone visualization
 * with pitch trails, location heatmaps, and
 * real-time tracking animations.
 *
 * @author Austin Humphrey
 * @version 1.0.0
 */

import * as THREE from 'three';

/**
 * Brand colors
 */
const ZONE_COLORS = {
  ember: 0xFF6B35,
  burntOrange: 0xBF5700,
  gold: 0xC9A227,
  cream: 0xFAF8F5,
  charcoal: 0x1A1A1A,
  strike: 0x22C55E, // Green for strikes
  ball: 0xEF4444,   // Red for balls
  edge: 0xC9A227,   // Gold for edge pitches
};

/**
 * Pitch types with their characteristics
 */
export type PitchType =
  | 'FF' | 'SI' | 'FC' // Fastballs
  | 'SL' | 'CU' | 'KC' | 'CS' // Breaking
  | 'CH' | 'FS' | 'SC';       // Offspeed

/**
 * Pitch data for visualization
 */
export interface PitchData3D {
  /** Pitch type code */
  type: PitchType;
  /** Velocity in mph */
  velocity: number;
  /** Horizontal position at plate (-1 to 1, center = 0) */
  plateX: number;
  /** Vertical position at plate (0 to 1, bottom to top of zone) */
  plateZ: number;
  /** Horizontal break (inches) */
  horizontalBreak: number;
  /** Vertical break (inches) */
  verticalBreak: number;
  /** Spin rate (rpm) */
  spinRate: number;
  /** Whether it was a strike (called/swinging) */
  isStrike: boolean;
  /** Whether batter swung */
  swing: boolean;
  /** Whether contact was made */
  contact: boolean;
  /** Result: ball, strike_called, strike_swinging, foul, hit */
  result: 'ball' | 'strike_called' | 'strike_swinging' | 'foul' | 'hit';
  /** Optional player name */
  pitcher?: string;
}

/**
 * Configuration for strike zone visualization
 */
export interface StrikeZone3DConfig {
  /** Scale factor */
  scale?: number;
  /** Zone width in real feet (17 inches = 1.417 feet) */
  zoneWidth?: number;
  /** Zone bottom height (varies by batter) */
  zoneBottom?: number;
  /** Zone top height (varies by batter) */
  zoneTop?: number;
  /** Distance from plate to mound (60.5 feet) */
  moundDistance?: number;
  /** Show grid lines on zone */
  showGrid?: boolean;
  /** Show zone outline */
  showOutline?: boolean;
  /** Show pitch trails */
  showTrails?: boolean;
  /** Show heatmap overlay */
  showHeatmap?: boolean;
  /** Holographic effect intensity */
  holoIntensity?: number;
  /** Animation speed for pitch trails */
  trailSpeed?: number;
  /** Trail length (0-1) */
  trailLength?: number;
  /** Whether the zone glows */
  glow?: boolean;
  /** Zone glow color */
  glowColor?: number;
}

/**
 * 3D Strike Zone Visualization
 */
export class StrikeZone3D extends THREE.Object3D {
  private config: Required<StrikeZone3DConfig>;

  // Zone elements
  private zoneFrame: THREE.Group;
  private zoneGrid: THREE.LineSegments | null = null;
  private zonePlane: THREE.Mesh | null = null;
  private pitchMarkers: THREE.Group;
  private trailsGroup: THREE.Group;
  private heatmapMesh: THREE.Mesh | null = null;

  // Heatmap data
  private heatmapData: Float32Array;
  private heatmapTexture: THREE.DataTexture | null = null;
  private heatmapSize: number = 64;

  // Stored pitches
  private pitches: PitchData3D[] = [];
  private activeTrails: Array<{
    line: THREE.Line;
    material: THREE.ShaderMaterial;
    progress: number;
    maxProgress: number;
  }> = [];

  // Animation
  private time: number = 0;

  private static defaultConfig: Required<StrikeZone3DConfig> = {
    scale: 10,
    zoneWidth: 1.417, // 17 inches
    zoneBottom: 1.5,  // About knee height
    zoneTop: 3.5,     // About letters
    moundDistance: 60.5,
    showGrid: true,
    showOutline: true,
    showTrails: true,
    showHeatmap: false,
    holoIntensity: 0.8,
    trailSpeed: 2.0,
    trailLength: 0.7,
    glow: true,
    glowColor: ZONE_COLORS.ember,
  };

  constructor(config?: StrikeZone3DConfig) {
    super();
    this.config = { ...StrikeZone3D.defaultConfig, ...config };

    this.zoneFrame = new THREE.Group();
    this.pitchMarkers = new THREE.Group();
    this.trailsGroup = new THREE.Group();

    this.add(this.zoneFrame);
    this.add(this.pitchMarkers);
    this.add(this.trailsGroup);

    // Initialize heatmap data
    this.heatmapData = new Float32Array(this.heatmapSize * this.heatmapSize * 4);

    this.createZone();
  }

  /**
   * Create the strike zone visualization
   */
  private createZone(): void {
    const s = this.config.scale;
    const w = this.config.zoneWidth * s;
    const h = (this.config.zoneTop - this.config.zoneBottom) * s;
    const y = ((this.config.zoneTop + this.config.zoneBottom) / 2) * s;

    // Create zone outline
    if (this.config.showOutline) {
      this.createZoneOutline(w, h, y);
    }

    // Create grid
    if (this.config.showGrid) {
      this.createGrid(w, h, y);
    }

    // Create holographic zone plane
    this.createHolographicPlane(w, h, y);

    // Create heatmap
    if (this.config.showHeatmap) {
      this.createHeatmap(w, h, y);
    }
  }

  /**
   * Create zone outline with holographic effect
   */
  private createZoneOutline(width: number, height: number, centerY: number): void {
    const hw = width / 2;
    const hh = height / 2;

    // Main frame
    const frameGeometry = new THREE.BufferGeometry();
    const framePoints = [
      -hw, centerY - hh, 0,
      hw, centerY - hh, 0,
      hw, centerY + hh, 0,
      -hw, centerY + hh, 0,
      -hw, centerY - hh, 0,
    ];
    frameGeometry.setAttribute('position', new THREE.Float32BufferAttribute(framePoints, 3));

    const frameMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        color: { value: new THREE.Color(this.config.glowColor) },
        intensity: { value: this.config.holoIntensity },
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
        uniform float intensity;
        varying vec2 vUv;

        void main() {
          float pulse = 0.7 + 0.3 * sin(time * 2.0);
          vec3 finalColor = color * intensity * pulse;
          gl_FragColor = vec4(finalColor, 1.0);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
    });

    const frame = new THREE.Line(frameGeometry, frameMaterial);
    this.zoneFrame.add(frame);

    // Corner brackets for visual flair
    const bracketSize = Math.min(width, height) * 0.15;
    const corners = [
      { x: -hw, y: centerY - hh },
      { x: hw, y: centerY - hh },
      { x: hw, y: centerY + hh },
      { x: -hw, y: centerY + hh },
    ];

    corners.forEach((corner, i) => {
      const bracket = this.createCornerBracket(corner.x, corner.y, bracketSize, i);
      this.zoneFrame.add(bracket);
    });
  }

  /**
   * Create corner bracket decoration
   */
  private createCornerBracket(x: number, y: number, size: number, corner: number): THREE.Line {
    const geometry = new THREE.BufferGeometry();

    // Direction based on corner
    const dirX = corner === 0 || corner === 3 ? 1 : -1;
    const dirY = corner < 2 ? 1 : -1;

    const points = [
      x, y + size * dirY, 0,
      x, y, 0,
      x + size * dirX, y, 0,
    ];

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));

    const material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        color: { value: new THREE.Color(ZONE_COLORS.gold) },
      },
      vertexShader: `
        void main() {
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform vec3 color;
        void main() {
          float pulse = 0.8 + 0.2 * sin(time * 3.0);
          gl_FragColor = vec4(color * pulse, 1.0);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
    });

    return new THREE.Line(geometry, material);
  }

  /**
   * Create grid lines
   */
  private createGrid(width: number, height: number, centerY: number): void {
    const hw = width / 2;
    const hh = height / 2;

    const gridPoints: number[] = [];

    // Vertical lines (3 columns)
    for (let i = 1; i < 3; i++) {
      const x = -hw + (width / 3) * i;
      gridPoints.push(x, centerY - hh, 0, x, centerY + hh, 0);
    }

    // Horizontal lines (3 rows)
    for (let i = 1; i < 3; i++) {
      const y = centerY - hh + (height / 3) * i;
      gridPoints.push(-hw, y, 0, hw, y, 0);
    }

    const gridGeometry = new THREE.BufferGeometry();
    gridGeometry.setAttribute('position', new THREE.Float32BufferAttribute(gridPoints, 3));

    const gridMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        color: { value: new THREE.Color(ZONE_COLORS.ember) },
        opacity: { value: 0.3 },
      },
      vertexShader: `
        void main() {
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform vec3 color;
        uniform float opacity;
        void main() {
          float pulse = 0.7 + 0.3 * sin(time * 1.5);
          gl_FragColor = vec4(color * pulse, opacity);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
    });

    this.zoneGrid = new THREE.LineSegments(gridGeometry, gridMaterial);
    this.zoneFrame.add(this.zoneGrid);
  }

  /**
   * Create holographic background plane
   */
  private createHolographicPlane(width: number, height: number, centerY: number): void {
    const geometry = new THREE.PlaneGeometry(width * 1.5, height * 1.5);

    const material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        color: { value: new THREE.Color(this.config.glowColor) },
        opacity: { value: 0.1 },
        scanlineCount: { value: 50 },
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
        uniform float opacity;
        uniform float scanlineCount;

        varying vec2 vUv;

        void main() {
          // Scanlines
          float scanline = sin(vUv.y * scanlineCount * 3.14159 + time) * 0.5 + 0.5;
          scanline = pow(scanline, 4.0);

          // Radial fade
          vec2 center = vUv - vec2(0.5);
          float radial = 1.0 - length(center) * 1.5;
          radial = clamp(radial, 0.0, 1.0);

          // Combine
          float alpha = opacity * radial * (1.0 - scanline * 0.3);

          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.zonePlane = new THREE.Mesh(geometry, material);
    this.zonePlane.position.y = centerY;
    this.zonePlane.position.z = -0.1;
    this.zoneFrame.add(this.zonePlane);
  }

  /**
   * Create heatmap overlay
   */
  private createHeatmap(width: number, height: number, centerY: number): void {
    this.heatmapTexture = new THREE.DataTexture(
      this.heatmapData,
      this.heatmapSize,
      this.heatmapSize,
      THREE.RGBAFormat,
      THREE.FloatType
    );
    this.heatmapTexture.needsUpdate = true;

    const geometry = new THREE.PlaneGeometry(width, height);

    const material = new THREE.ShaderMaterial({
      uniforms: {
        heatmap: { value: this.heatmapTexture },
        coldColor: { value: new THREE.Color(ZONE_COLORS.cream) },
        warmColor: { value: new THREE.Color(ZONE_COLORS.gold) },
        hotColor: { value: new THREE.Color(ZONE_COLORS.ember) },
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
        uniform vec3 coldColor;
        uniform vec3 warmColor;
        uniform vec3 hotColor;
        uniform float opacity;

        varying vec2 vUv;

        void main() {
          float value = texture2D(heatmap, vUv).r;
          if (value < 0.01) discard;

          vec3 color;
          if (value < 0.5) {
            color = mix(coldColor, warmColor, value * 2.0);
          } else {
            color = mix(warmColor, hotColor, (value - 0.5) * 2.0);
          }

          gl_FragColor = vec4(color, value * opacity);
        }
      `,
      transparent: true,
      depthWrite: false,
    });

    this.heatmapMesh = new THREE.Mesh(geometry, material);
    this.heatmapMesh.position.y = centerY;
    this.heatmapMesh.position.z = 0.1;
    this.add(this.heatmapMesh);
  }

  /**
   * Add a pitch to the visualization
   */
  public addPitch(pitch: PitchData3D, animate: boolean = true): void {
    this.pitches.push(pitch);

    const s = this.config.scale;
    const w = this.config.zoneWidth * s;
    const h = (this.config.zoneTop - this.config.zoneBottom) * s;
    const yBase = this.config.zoneBottom * s;

    // Convert pitch location to 3D position
    const x = pitch.plateX * (w / 2);
    const y = yBase + pitch.plateZ * h;
    const z = 0;

    // Create pitch marker
    const markerColor = this.getPitchColor(pitch);
    const marker = this.createPitchMarker(x, y, z, markerColor, pitch);
    this.pitchMarkers.add(marker);

    // Create pitch trail if enabled
    if (this.config.showTrails && animate) {
      this.createPitchTrail(x, y, z, pitch, markerColor);
    }

    // Update heatmap
    this.updateHeatmap(pitch.plateX, pitch.plateZ);
  }

  /**
   * Get color based on pitch result
   */
  private getPitchColor(pitch: PitchData3D): number {
    // Edge of zone (within 1 inch)
    const edgeX = Math.abs(pitch.plateX) > 0.9 && Math.abs(pitch.plateX) < 1.1;
    const edgeZ = (pitch.plateZ < 0.1 && pitch.plateZ > -0.1) ||
                  (pitch.plateZ > 0.9 && pitch.plateZ < 1.1);

    if (edgeX || edgeZ) {
      return ZONE_COLORS.edge;
    }

    return pitch.isStrike ? ZONE_COLORS.strike : ZONE_COLORS.ball;
  }

  /**
   * Create pitch marker (location dot)
   */
  private createPitchMarker(
    x: number,
    y: number,
    z: number,
    color: number,
    pitch: PitchData3D
  ): THREE.Group {
    const group = new THREE.Group();

    // Main sphere
    const sphereGeometry = new THREE.SphereGeometry(0.3 * this.config.scale * 0.1, 16, 16);
    const sphereMaterial = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.9,
    });
    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    group.add(sphere);

    // Glow ring
    const ringGeometry = new THREE.RingGeometry(
      0.35 * this.config.scale * 0.1,
      0.5 * this.config.scale * 0.1,
      32
    );
    const ringMaterial = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.4,
      side: THREE.DoubleSide,
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    group.add(ring);

    group.position.set(x, y, z);

    // Store pitch data on the group for interaction
    (group as THREE.Group & { pitchData: PitchData3D }).pitchData = pitch;

    return group;
  }

  /**
   * Create animated pitch trail from mound to plate
   */
  private createPitchTrail(
    targetX: number,
    targetY: number,
    targetZ: number,
    pitch: PitchData3D,
    color: number
  ): void {
    const s = this.config.scale;
    const moundZ = -this.config.moundDistance * s * 0.1;

    // Create curved path based on pitch movement
    const startX = 0; // Pitches start centered
    const startY = targetY + 0.5 * s; // Slight height offset at release
    const startZ = moundZ;

    // Control points for bezier based on break
    const breakFactor = 0.5;
    const controlX1 = startX + pitch.horizontalBreak * 0.05 * breakFactor;
    const controlY1 = startY + pitch.verticalBreak * 0.05 * breakFactor;
    const controlZ1 = moundZ * 0.5;

    // Create curve
    const curve = new THREE.CubicBezierCurve3(
      new THREE.Vector3(startX, startY, startZ),
      new THREE.Vector3(controlX1, controlY1, controlZ1),
      new THREE.Vector3(targetX * 0.5, targetY + 0.2 * s, targetZ - moundZ * 0.3),
      new THREE.Vector3(targetX, targetY, targetZ)
    );

    const points = curve.getPoints(50);
    const positions = new Float32Array(points.length * 3);
    const progress = new Float32Array(points.length);

    points.forEach((p, i) => {
      positions[i * 3] = p.x;
      positions[i * 3 + 1] = p.y;
      positions[i * 3 + 2] = p.z;
      progress[i] = i / (points.length - 1);
    });

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('aProgress', new THREE.BufferAttribute(progress, 1));

    const material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        progress: { value: 0 },
        color: { value: new THREE.Color(color) },
        trailLength: { value: this.config.trailLength },
      },
      vertexShader: `
        attribute float aProgress;
        uniform float progress;
        uniform float trailLength;

        varying float vAlpha;

        void main() {
          float trailStart = progress - trailLength;
          float visible = step(trailStart, aProgress) * step(aProgress, progress);
          float fade = (aProgress - trailStart) / trailLength;

          vAlpha = visible * fade;

          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 color;
        varying float vAlpha;

        void main() {
          if (vAlpha < 0.01) discard;
          gl_FragColor = vec4(color * 2.0, vAlpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const line = new THREE.Line(geometry, material);
    this.trailsGroup.add(line);

    this.activeTrails.push({
      line,
      material,
      progress: 0,
      maxProgress: 1 + this.config.trailLength,
    });
  }

  /**
   * Update heatmap with new pitch location
   */
  private updateHeatmap(plateX: number, plateZ: number): void {
    if (!this.heatmapTexture) return;

    // Convert to texture coordinates (0-1)
    const u = (plateX + 1) / 2;
    const v = plateZ;

    const px = Math.floor(u * this.heatmapSize);
    const py = Math.floor(v * this.heatmapSize);

    // Gaussian splat
    const radius = 8;
    const intensity = 0.15;

    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const x = px + dx;
        const y = py + dy;

        if (x < 0 || x >= this.heatmapSize || y < 0 || y >= this.heatmapSize) continue;

        const dist = Math.sqrt(dx * dx + dy * dy);
        const falloff = Math.exp(-(dist * dist) / (radius * radius * 0.5));

        const idx = (y * this.heatmapSize + x) * 4;
        this.heatmapData[idx] = Math.min(1, this.heatmapData[idx] + intensity * falloff);
      }
    }

    this.heatmapTexture.needsUpdate = true;
  }

  /**
   * Toggle heatmap visibility
   */
  public setHeatmapVisible(visible: boolean): void {
    if (this.heatmapMesh) {
      this.heatmapMesh.visible = visible;
    }
  }

  /**
   * Clear all pitches
   */
  public clearPitches(): void {
    this.pitches = [];

    // Clear markers
    while (this.pitchMarkers.children.length > 0) {
      const child = this.pitchMarkers.children[0];
      this.pitchMarkers.remove(child);
    }

    // Clear trails
    while (this.trailsGroup.children.length > 0) {
      const child = this.trailsGroup.children[0];
      this.trailsGroup.remove(child);
    }
    this.activeTrails = [];

    // Clear heatmap
    this.heatmapData.fill(0);
    if (this.heatmapTexture) {
      this.heatmapTexture.needsUpdate = true;
    }
  }

  /**
   * Update animation (call each frame)
   */
  public update(delta: number): void {
    this.time += delta;

    // Update zone frame materials
    this.zoneFrame.traverse((child) => {
      if (child instanceof THREE.Line || child instanceof THREE.LineSegments || child instanceof THREE.Mesh) {
        const mat = child.material as THREE.ShaderMaterial;
        if (mat.uniforms && mat.uniforms.time) {
          mat.uniforms.time.value = this.time;
        }
      }
    });

    // Update active trails
    for (let i = this.activeTrails.length - 1; i >= 0; i--) {
      const trail = this.activeTrails[i];
      trail.progress += delta * this.config.trailSpeed;
      trail.material.uniforms.progress.value = trail.progress;

      // Remove completed trails
      if (trail.progress >= trail.maxProgress) {
        this.trailsGroup.remove(trail.line);
        trail.line.geometry.dispose();
        trail.material.dispose();
        this.activeTrails.splice(i, 1);
      }
    }
  }

  /**
   * Get pitches in a specific zone region
   */
  public getPitchesInRegion(
    xMin: number,
    xMax: number,
    zMin: number,
    zMax: number
  ): PitchData3D[] {
    return this.pitches.filter(
      (p) => p.plateX >= xMin && p.plateX <= xMax && p.plateZ >= zMin && p.plateZ <= zMax
    );
  }

  /**
   * Dispose all resources
   */
  public dispose(): void {
    this.clearPitches();

    this.zoneFrame.traverse((child) => {
      if (child instanceof THREE.Mesh || child instanceof THREE.Line || child instanceof THREE.LineSegments) {
        child.geometry.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach((m) => m.dispose());
        } else {
          child.material.dispose();
        }
      }
    });

    if (this.heatmapTexture) {
      this.heatmapTexture.dispose();
    }
  }
}

/**
 * Preset configurations for strike zones
 */
export const StrikeZone3DPresets = {
  /** Standard broadcast view */
  broadcast: {
    scale: 10,
    showGrid: true,
    showOutline: true,
    showTrails: true,
    showHeatmap: false,
    holoIntensity: 0.8,
  },

  /** Analytical with heatmap */
  analytical: {
    scale: 10,
    showGrid: true,
    showOutline: true,
    showTrails: false,
    showHeatmap: true,
    holoIntensity: 0.5,
  },

  /** Minimal clean view */
  minimal: {
    scale: 10,
    showGrid: false,
    showOutline: true,
    showTrails: true,
    showHeatmap: false,
    holoIntensity: 0.6,
    glow: false,
  },

  /** Full immersive */
  immersive: {
    scale: 15,
    showGrid: true,
    showOutline: true,
    showTrails: true,
    showHeatmap: true,
    holoIntensity: 1.0,
    trailSpeed: 1.5,
  },
};

export default StrikeZone3D;
