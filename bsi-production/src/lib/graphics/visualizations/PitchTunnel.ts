/**
 * Pitch Tunnel 3D Visualization
 *
 * Advanced 3D visualization for pitch trajectory analysis,
 * movement comparison, and tunnel optimization.
 *
 * @author Austin Humphrey
 * @version 1.0.0
 */

import * as THREE from 'three';
import { threeColors } from '../../styles/tokens/colors';
import { DataTrailSystem } from '../particles/DataTrailSystem';

// Pitch data interface
export interface PitchData {
  type: 'fastball' | 'curveball' | 'slider' | 'changeup' | 'cutter' | 'sinker' | 'splitter';
  velocity: number;       // mph
  spinRate: number;       // rpm
  horizontalBreak: number; // inches
  verticalBreak: number;  // inches (induced vertical movement)
  releaseHeight: number;  // feet
  releaseAngle: number;   // degrees
  location: { x: number; y: number }; // Strike zone coordinates (-1 to 1)
  result?: 'strike' | 'ball' | 'foul' | 'hit' | 'swinging_strike';
}

export interface PitchTunnelConfig {
  scale?: number;
  moundDistance?: number;       // Distance from rubber to plate (60.5 feet)
  strikeZoneWidth?: number;     // Width in feet
  strikeZoneHeight?: number;    // Height in feet
  strikeZoneBottom?: number;    // Bottom of zone from ground
  showStrikeZone?: boolean;
  showTunnelPoint?: boolean;
  tunnelPointDistance?: number; // Distance from plate where pitches should look similar
  showGrid?: boolean;
  trajectorySegments?: number;
  trailDuration?: number;
  glowIntensity?: number;
}

/**
 * 3D Pitch Tunnel visualization
 */
export class PitchTunnel extends THREE.Object3D {
  private config: Required<PitchTunnelConfig>;

  // Visual elements
  private strikeZone: THREE.Group | null = null;
  private tunnelPoint: THREE.Mesh | null = null;
  private grid: THREE.GridHelper | null = null;
  private mound: THREE.Mesh | null = null;
  private plate: THREE.Mesh | null = null;

  // Pitch trails
  private pitchTrails: Map<string, DataTrailSystem> = new Map();
  private activePitches: Set<string> = new Set();

  // Animation state
  private time: number = 0;

  private static defaultConfig: Required<PitchTunnelConfig> = {
    scale: 1,
    moundDistance: 60.5,
    strikeZoneWidth: 17 / 12, // 17 inches to feet
    strikeZoneHeight: 2.0,
    strikeZoneBottom: 1.5,
    showStrikeZone: true,
    showTunnelPoint: true,
    tunnelPointDistance: 20, // 20 feet from plate
    showGrid: true,
    trajectorySegments: 60,
    trailDuration: 3,
    glowIntensity: 1.2,
  };

  // Pitch type colors
  private static pitchColors: Record<PitchData['type'], number> = {
    fastball: threeColors.ember,
    curveball: 0x8B5CF6, // Purple
    slider: 0x06B6D4,    // Cyan
    changeup: 0x22C55E,  // Green
    cutter: threeColors.gold,
    sinker: threeColors.burntOrange,
    splitter: 0xEC4899, // Pink
  };

  constructor(config?: PitchTunnelConfig) {
    super();
    this.config = { ...PitchTunnel.defaultConfig, ...config };

    this.createScene();
  }

  /**
   * Create the pitch tunnel scene
   */
  private createScene(): void {
    const s = this.config.scale;

    // Create floor grid
    if (this.config.showGrid) {
      this.grid = new THREE.GridHelper(
        this.config.moundDistance * s * 2,
        20,
        0x333333,
        0x222222
      );
      this.grid.position.y = 0;
      this.add(this.grid);
    }

    // Create pitcher's mound
    this.createMound(s);

    // Create home plate
    this.createHomePlate(s);

    // Create strike zone
    if (this.config.showStrikeZone) {
      this.createStrikeZone(s);
    }

    // Create tunnel point visualization
    if (this.config.showTunnelPoint) {
      this.createTunnelPoint(s);
    }
  }

  /**
   * Create pitcher's mound
   */
  private createMound(scale: number): void {
    const rubberGeometry = new THREE.BoxGeometry(
      24 * scale / 12,  // 24 inches
      0.5 * scale / 12, // Half inch
      6 * scale / 12    // 6 inches
    );

    const rubberMaterial = new THREE.MeshStandardMaterial({
      color: 0xFFFFFF,
      roughness: 0.5,
    });

    this.mound = new THREE.Mesh(rubberGeometry, rubberMaterial);
    this.mound.position.set(0, 10 * scale / 12, this.config.moundDistance * scale);
    this.add(this.mound);
  }

  /**
   * Create home plate
   */
  private createHomePlate(scale: number): void {
    const plateShape = new THREE.Shape();
    const pw = 17 / 12 * scale / 2; // 17 inches
    const ph = 8.5 / 12 * scale;

    plateShape.moveTo(0, -pw);
    plateShape.lineTo(pw, -pw / 2);
    plateShape.lineTo(pw, ph);
    plateShape.lineTo(-pw, ph);
    plateShape.lineTo(-pw, -pw / 2);
    plateShape.lineTo(0, -pw);

    const plateGeometry = new THREE.ExtrudeGeometry(plateShape, {
      depth: 0.1 * scale,
      bevelEnabled: false,
    });
    plateGeometry.rotateX(-Math.PI / 2);

    const plateMaterial = new THREE.MeshStandardMaterial({
      color: 0xFFFFFF,
      roughness: 0.5,
    });

    this.plate = new THREE.Mesh(plateGeometry, plateMaterial);
    this.plate.position.set(0, 0.05 * scale, 0);
    this.add(this.plate);
  }

  /**
   * Create strike zone visualization
   */
  private createStrikeZone(scale: number): void {
    this.strikeZone = new THREE.Group();

    const w = this.config.strikeZoneWidth * scale;
    const h = this.config.strikeZoneHeight * scale;
    const bottom = this.config.strikeZoneBottom * scale;

    // Outer frame
    const frameGeometry = new THREE.EdgesGeometry(
      new THREE.BoxGeometry(w, h, 0.01)
    );
    const frameMaterial = new THREE.LineBasicMaterial({
      color: threeColors.ember,
      linewidth: 2,
    });
    const frame = new THREE.LineSegments(frameGeometry, frameMaterial);
    frame.position.set(0, bottom + h / 2, 0);
    this.strikeZone.add(frame);

    // Zone grid (9 sections)
    const gridMaterial = new THREE.LineBasicMaterial({
      color: threeColors.ember,
      transparent: true,
      opacity: 0.3,
    });

    // Vertical lines
    for (let i = 1; i < 3; i++) {
      const points = [
        new THREE.Vector3(-w / 2 + (w * i) / 3, bottom, 0),
        new THREE.Vector3(-w / 2 + (w * i) / 3, bottom + h, 0),
      ];
      const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.Line(lineGeometry, gridMaterial);
      this.strikeZone.add(line);
    }

    // Horizontal lines
    for (let i = 1; i < 3; i++) {
      const points = [
        new THREE.Vector3(-w / 2, bottom + (h * i) / 3, 0),
        new THREE.Vector3(w / 2, bottom + (h * i) / 3, 0),
      ];
      const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.Line(lineGeometry, gridMaterial);
      this.strikeZone.add(line);
    }

    // Glow effect
    const glowGeometry = new THREE.PlaneGeometry(w * 1.2, h * 1.2);
    const glowMaterial = new THREE.ShaderMaterial({
      uniforms: {
        color: { value: new THREE.Color(threeColors.burntOrange) },
        opacity: { value: 0.1 },
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
        uniform float opacity;
        varying vec2 vUv;
        void main() {
          vec2 center = vUv - 0.5;
          float dist = length(center);
          float alpha = (1.0 - smoothstep(0.3, 0.5, dist)) * opacity;
          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
    });

    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    glow.position.set(0, bottom + h / 2, -0.1);
    this.strikeZone.add(glow);

    this.add(this.strikeZone);
  }

  /**
   * Create tunnel point visualization
   */
  private createTunnelPoint(scale: number): void {
    // Sphere at tunnel point
    const sphereGeometry = new THREE.SphereGeometry(0.15 * scale, 32, 32);
    const sphereMaterial = new THREE.MeshBasicMaterial({
      color: threeColors.gold,
      transparent: true,
      opacity: 0.6,
    });

    this.tunnelPoint = new THREE.Mesh(sphereGeometry, sphereMaterial);
    this.tunnelPoint.position.set(
      0,
      this.config.strikeZoneBottom * scale + this.config.strikeZoneHeight * scale / 2,
      this.config.tunnelPointDistance * scale
    );
    this.add(this.tunnelPoint);

    // Rings around tunnel point
    const ringGeometry = new THREE.RingGeometry(0.2 * scale, 0.3 * scale, 32);
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: threeColors.gold,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide,
    });

    for (let i = 0; i < 3; i++) {
      const ring = new THREE.Mesh(ringGeometry.clone(), ringMaterial.clone());
      ring.position.copy(this.tunnelPoint.position);
      ring.scale.setScalar(1 + i * 0.5);
      this.add(ring);
    }
  }

  /**
   * Add a pitch trajectory
   */
  public addPitch(pitch: PitchData, id?: string): string {
    const s = this.config.scale;
    const pitchId = id || `pitch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Calculate trajectory
    const trajectory = this.calculateTrajectory(pitch);

    // Create trail
    const color = PitchTunnel.pitchColors[pitch.type];
    const trail = new DataTrailSystem({
      color: color,
      glowColor: color,
      trailLength: this.config.trajectorySegments,
      glowIntensity: this.config.glowIntensity,
      animated: true,
    });

    trail.setPath(trajectory);
    this.add(trail);
    this.pitchTrails.set(pitchId, trail);
    this.activePitches.add(pitchId);

    // Add endpoint marker
    const endPoint = trajectory[trajectory.length - 1];
    this.addLocationMarker(endPoint, pitch, color);

    return pitchId;
  }

  /**
   * Calculate pitch trajectory from physics
   */
  private calculateTrajectory(pitch: PitchData): THREE.Vector3[] {
    const s = this.config.scale;
    const points: THREE.Vector3[] = [];

    // Start position (release point)
    const startZ = this.config.moundDistance * s;
    const startY = pitch.releaseHeight * s;
    const startX = 0; // Assuming center release

    // End position (at plate)
    const endZ = 0;
    const endX = pitch.location.x * (this.config.strikeZoneWidth * s / 2);
    const endY = this.config.strikeZoneBottom * s +
      (pitch.location.y + 1) / 2 * this.config.strikeZoneHeight * s;

    // Flight time calculation (simplified physics)
    const distance = this.config.moundDistance;
    const flightTime = distance / (pitch.velocity * 1.467); // mph to ft/s

    // Break factors (convert inches to feet, then to scale)
    const hBreak = (pitch.horizontalBreak / 12) * s;
    const vBreak = (pitch.verticalBreak / 12) * s;

    // Generate trajectory points
    for (let i = 0; i <= this.config.trajectorySegments; i++) {
      const t = i / this.config.trajectorySegments;

      // Linear interpolation with break applied
      const x = startX + (endX - startX) * t + hBreak * Math.sin(t * Math.PI);
      const y = startY + (endY - startY) * t + vBreak * Math.sin(t * Math.PI);
      const z = startZ + (endZ - startZ) * t;

      // Add gravity effect
      const gravityDrop = 0.5 * 32.2 * (flightTime * t) ** 2;
      const adjustedY = y - gravityDrop * s * 0.1; // Scaled gravity

      points.push(new THREE.Vector3(x, Math.max(0, adjustedY), z));
    }

    return points;
  }

  /**
   * Add location marker at pitch endpoint
   */
  private addLocationMarker(
    position: THREE.Vector3,
    pitch: PitchData,
    color: number
  ): void {
    const markerGeometry = new THREE.CircleGeometry(0.08 * this.config.scale, 16);
    const markerMaterial = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide,
    });

    const marker = new THREE.Mesh(markerGeometry, markerMaterial);
    marker.position.copy(position);
    marker.position.z -= 0.01; // Slightly in front of strike zone
    this.add(marker);

    // Add result indicator
    if (pitch.result) {
      const ringColor = this.getResultColor(pitch.result);
      const ringGeometry = new THREE.RingGeometry(
        0.09 * this.config.scale,
        0.12 * this.config.scale,
        16
      );
      const ringMaterial = new THREE.MeshBasicMaterial({
        color: ringColor,
        transparent: true,
        opacity: 0.6,
        side: THREE.DoubleSide,
      });

      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.position.copy(position);
      ring.position.z -= 0.02;
      this.add(ring);
    }
  }

  /**
   * Get color for pitch result
   */
  private getResultColor(result: PitchData['result']): number {
    switch (result) {
      case 'strike':
      case 'swinging_strike':
        return 0x22C55E; // Green
      case 'ball':
        return 0xEF4444; // Red
      case 'foul':
        return 0xF59E0B; // Amber
      case 'hit':
        return 0x6366F1; // Indigo
      default:
        return 0x6B7280; // Gray
    }
  }

  /**
   * Remove a pitch trajectory
   */
  public removePitch(pitchId: string): void {
    const trail = this.pitchTrails.get(pitchId);
    if (trail) {
      trail.dispose();
      this.remove(trail);
      this.pitchTrails.delete(pitchId);
      this.activePitches.delete(pitchId);
    }
  }

  /**
   * Clear all pitches
   */
  public clearPitches(): void {
    for (const [id] of this.pitchTrails) {
      this.removePitch(id);
    }
  }

  /**
   * Compare two pitches (overlay)
   */
  public comparePitches(pitch1: PitchData, pitch2: PitchData): void {
    this.clearPitches();
    this.addPitch(pitch1, 'compare_1');
    this.addPitch(pitch2, 'compare_2');
  }

  /**
   * Set tunnel point position
   */
  public setTunnelPoint(distance: number): void {
    this.config.tunnelPointDistance = distance;
    if (this.tunnelPoint) {
      this.tunnelPoint.position.z = distance * this.config.scale;
    }
  }

  /**
   * Update animation
   */
  public update(delta: number): void {
    this.time += delta;

    for (const trail of this.pitchTrails.values()) {
      trail.update(delta);
    }

    // Animate tunnel point
    if (this.tunnelPoint) {
      const pulse = Math.sin(this.time * 2) * 0.1 + 1;
      this.tunnelPoint.scale.setScalar(pulse);
    }
  }

  /**
   * Dispose resources
   */
  public dispose(): void {
    this.clearPitches();

    if (this.strikeZone) {
      this.strikeZone.traverse((child) => {
        if (child instanceof THREE.Mesh || child instanceof THREE.Line) {
          child.geometry.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach((m) => m.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
    }

    if (this.mound) {
      this.mound.geometry.dispose();
      (this.mound.material as THREE.Material).dispose();
    }

    if (this.plate) {
      this.plate.geometry.dispose();
      (this.plate.material as THREE.Material).dispose();
    }

    if (this.tunnelPoint) {
      this.tunnelPoint.geometry.dispose();
      (this.tunnelPoint.material as THREE.Material).dispose();
    }

    if (this.grid) {
      this.grid.geometry.dispose();
      (this.grid.material as THREE.Material).dispose();
    }
  }
}

export default PitchTunnel;
