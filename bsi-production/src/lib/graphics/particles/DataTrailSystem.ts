/**
 * Data Trail Particle System
 *
 * Creates flowing data trails for visualizing statistics,
 * trajectories, and connections. Perfect for pitch tracking,
 * spray charts, and stat comparisons.
 *
 * @author Austin Humphrey
 * @version 1.0.0
 */

import * as THREE from 'three';
import { threeColors } from '../../styles/tokens/colors';

export interface DataTrailConfig {
  maxPoints?: number;
  trailLength?: number;
  lineWidth?: number;
  color?: number;
  glowColor?: number;
  glowIntensity?: number;
  fadeSpeed?: number;
  pulseSpeed?: number;
  animated?: boolean;
}

export interface TrailPoint {
  position: THREE.Vector3;
  time: number;
  value?: number; // Optional data value for color mapping
}

/**
 * Data trail visualization for sports analytics
 */
export class DataTrailSystem extends THREE.Object3D {
  private config: Required<DataTrailConfig>;
  private points: TrailPoint[] = [];
  private line: THREE.Line | null = null;
  private glowLine: THREE.Line | null = null;
  private geometry: THREE.BufferGeometry;
  private material: THREE.ShaderMaterial;
  private glowMaterial: THREE.ShaderMaterial;
  private time: number = 0;

  private static defaultConfig: Required<DataTrailConfig> = {
    maxPoints: 100,
    trailLength: 50,
    lineWidth: 3,
    color: threeColors.ember,
    glowColor: threeColors.burntOrange,
    glowIntensity: 0.8,
    fadeSpeed: 2.0,
    pulseSpeed: 1.0,
    animated: true,
  };

  constructor(config?: DataTrailConfig) {
    super();
    this.config = { ...DataTrailSystem.defaultConfig, ...config };

    this.geometry = new THREE.BufferGeometry();
    this.material = this.createMaterial();
    this.glowMaterial = this.createGlowMaterial();

    this.line = new THREE.Line(this.geometry, this.material);
    this.glowLine = new THREE.Line(this.geometry.clone(), this.glowMaterial);
    this.glowLine.scale.setScalar(1.5);

    this.add(this.glowLine);
    this.add(this.line);
  }

  /**
   * Create main trail material
   */
  private createMaterial(): THREE.ShaderMaterial {
    return new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        color: { value: new THREE.Color(this.config.color) },
        fadeSpeed: { value: this.config.fadeSpeed },
        pulseSpeed: { value: this.config.pulseSpeed },
        totalPoints: { value: 0 },
      },

      vertexShader: `
        attribute float aIndex;
        attribute float aValue;

        uniform float totalPoints;
        uniform float time;
        uniform float pulseSpeed;

        varying float vProgress;
        varying float vValue;
        varying float vPulse;

        void main() {
          vProgress = aIndex / max(totalPoints - 1.0, 1.0);
          vValue = aValue;

          // Pulse animation along the trail
          vPulse = sin((vProgress + time * pulseSpeed) * 6.28) * 0.5 + 0.5;

          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,

      fragmentShader: `
        uniform vec3 color;
        uniform float fadeSpeed;

        varying float vProgress;
        varying float vValue;
        varying float vPulse;

        void main() {
          // Fade alpha along trail (newer = more opaque)
          float alpha = pow(vProgress, fadeSpeed);

          // Pulse brightness
          vec3 finalColor = color * (0.8 + vPulse * 0.4);

          // Value-based color intensity
          finalColor *= 0.5 + vValue * 0.5;

          gl_FragColor = vec4(finalColor, alpha);
        }
      `,

      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
  }

  /**
   * Create glow trail material
   */
  private createGlowMaterial(): THREE.ShaderMaterial {
    return new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        color: { value: new THREE.Color(this.config.glowColor) },
        intensity: { value: this.config.glowIntensity },
        totalPoints: { value: 0 },
      },

      vertexShader: `
        attribute float aIndex;

        uniform float totalPoints;

        varying float vProgress;

        void main() {
          vProgress = aIndex / max(totalPoints - 1.0, 1.0);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,

      fragmentShader: `
        uniform vec3 color;
        uniform float intensity;

        varying float vProgress;

        void main() {
          float alpha = pow(vProgress, 3.0) * intensity * 0.3;
          gl_FragColor = vec4(color, alpha);
        }
      `,

      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
  }

  /**
   * Add a point to the trail
   */
  public addPoint(position: THREE.Vector3, value: number = 1.0): void {
    this.points.push({
      position: position.clone(),
      time: this.time,
      value: Math.max(0, Math.min(1, value)),
    });

    // Limit trail length
    while (this.points.length > this.config.trailLength) {
      this.points.shift();
    }

    this.updateGeometry();
  }

  /**
   * Set trail from array of points
   */
  public setPath(positions: THREE.Vector3[], values?: number[]): void {
    this.points = positions.map((pos, i) => ({
      position: pos.clone(),
      time: this.time,
      value: values ? values[i] : 1.0,
    }));

    if (this.points.length > this.config.maxPoints) {
      this.points = this.points.slice(-this.config.maxPoints);
    }

    this.updateGeometry();
  }

  /**
   * Update geometry from points
   */
  private updateGeometry(): void {
    if (this.points.length < 2) return;

    const positions = new Float32Array(this.points.length * 3);
    const indices = new Float32Array(this.points.length);
    const values = new Float32Array(this.points.length);

    for (let i = 0; i < this.points.length; i++) {
      const p = this.points[i];
      const i3 = i * 3;

      positions[i3] = p.position.x;
      positions[i3 + 1] = p.position.y;
      positions[i3 + 2] = p.position.z;

      indices[i] = i;
      values[i] = p.value || 1.0;
    }

    this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.geometry.setAttribute('aIndex', new THREE.BufferAttribute(indices, 1));
    this.geometry.setAttribute('aValue', new THREE.BufferAttribute(values, 1));

    this.material.uniforms.totalPoints.value = this.points.length;
    this.glowMaterial.uniforms.totalPoints.value = this.points.length;

    // Update glow line geometry
    if (this.glowLine) {
      this.glowLine.geometry.setAttribute('position', new THREE.BufferAttribute(positions.slice(), 3));
      this.glowLine.geometry.setAttribute('aIndex', new THREE.BufferAttribute(indices.slice(), 1));
    }
  }

  /**
   * Update animation (call each frame)
   */
  public update(delta: number): void {
    if (!this.config.animated) return;

    this.time += delta;
    this.material.uniforms.time.value = this.time;
    this.glowMaterial.uniforms.time.value = this.time;
  }

  /**
   * Clear all points
   */
  public clear(): void {
    this.points = [];
    this.geometry.deleteAttribute('position');
    this.geometry.deleteAttribute('aIndex');
    this.geometry.deleteAttribute('aValue');
  }

  /**
   * Set trail color
   */
  public setColor(color: number, glowColor?: number): void {
    this.config.color = color;
    this.material.uniforms.color.value = new THREE.Color(color);

    if (glowColor !== undefined) {
      this.config.glowColor = glowColor;
      this.glowMaterial.uniforms.color.value = new THREE.Color(glowColor);
    }
  }

  /**
   * Dispose resources
   */
  public dispose(): void {
    this.geometry.dispose();
    this.material.dispose();
    this.glowMaterial.dispose();
    if (this.line) this.remove(this.line);
    if (this.glowLine) this.remove(this.glowLine);
  }
}

/**
 * Create a curved data trail between two points
 */
export function createCurvedTrail(
  start: THREE.Vector3,
  end: THREE.Vector3,
  controlHeight: number = 50,
  segments: number = 50,
  config?: DataTrailConfig
): DataTrailSystem {
  const trail = new DataTrailSystem(config);

  // Create bezier curve
  const midPoint = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
  midPoint.y += controlHeight;

  const curve = new THREE.QuadraticBezierCurve3(start, midPoint, end);
  const points = curve.getPoints(segments);

  // Add points with value gradient
  const values = points.map((_, i) => {
    const t = i / (points.length - 1);
    return 0.5 + 0.5 * Math.sin(t * Math.PI); // Peak in middle
  });

  trail.setPath(points, values);

  return trail;
}

/**
 * Create a spiral data trail
 */
export function createSpiralTrail(
  center: THREE.Vector3,
  startRadius: number,
  endRadius: number,
  height: number,
  rotations: number = 3,
  segments: number = 100,
  config?: DataTrailConfig
): DataTrailSystem {
  const trail = new DataTrailSystem(config);

  const points: THREE.Vector3[] = [];
  const values: number[] = [];

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const angle = t * Math.PI * 2 * rotations;
    const radius = startRadius + (endRadius - startRadius) * t;
    const y = center.y + t * height;

    points.push(new THREE.Vector3(
      center.x + Math.cos(angle) * radius,
      y,
      center.z + Math.sin(angle) * radius
    ));

    values.push(t);
  }

  trail.setPath(points, values);

  return trail;
}

export default DataTrailSystem;
