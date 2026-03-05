/**
 * GhostRenderer3D — Babylon.js ghost mesh rendering for Blaze Blitz.
 *
 * Renders predicted receiver positions as transparent capsules
 * and predicted routes as dashed trajectory lines.
 */

import {
  Scene,
  Vector3,
  MeshBuilder,
  StandardMaterial,
  Color3,
  Color4,
  Mesh,
  GlowLayer,
  LinesBuilder,
} from '@babylonjs/core';

const MAX_GHOST_MESHES = 16;
const MAX_TRAIL_LINES = 8;

const GHOST_COLORS: Record<number, string> = {
  1: '#39FF14', // WR1 - neon green
  2: '#FF6EC7', // WR2 - hot pink
  3: '#00BFFF', // WR3 - deep sky blue
  4: '#FFD700', // TE - gold
  5: '#FF6B35', // RB - ember
};

export class GhostRenderer3D {
  private scene: Scene;
  private glowLayer: GlowLayer | null;
  private ghostPool: Mesh[] = [];
  private trailPool: Mesh[] = [];
  private activeGhosts: number = 0;
  private activeTrails: number = 0;

  constructor(scene: Scene, glowLayer: GlowLayer | null = null) {
    this.scene = scene;
    this.glowLayer = glowLayer;
    this._initPool();
  }

  private _initPool(): void {
    for (let i = 0; i < MAX_GHOST_MESHES; i++) {
      const mesh = MeshBuilder.CreateCapsule(
        `ghost_receiver_${i}`,
        { radius: 0.4, height: 1.8 },
        this.scene
      );
      mesh.isVisible = false;

      const mat = new StandardMaterial(`ghostMat_${i}`, this.scene);
      mat.alpha = 0;
      mat.disableLighting = true;
      mesh.material = mat;

      if (this.glowLayer) {
        this.glowLayer.addIncludedOnlyMesh(mesh);
      }

      this.ghostPool.push(mesh);
    }
  }

  /**
   * Place a ghost receiver at a predicted position.
   */
  placeGhost(
    position: Vector3,
    probability: number,
    playerType: number = 1
  ): void {
    if (this.activeGhosts >= MAX_GHOST_MESHES) return;

    const mesh = this.ghostPool[this.activeGhosts];
    mesh.position = position.clone();
    mesh.position.y = 1;
    mesh.isVisible = true;

    const mat = mesh.material as StandardMaterial;
    const colorHex = GHOST_COLORS[playerType] ?? '#39FF14';
    mat.diffuseColor = Color3.FromHexString(colorHex);
    mat.emissiveColor = Color3.FromHexString(colorHex).scale(0.4);
    mat.alpha = Math.min(0.5, probability * 0.6);

    this.activeGhosts++;
  }

  /**
   * Render a predicted route as a dashed line from current to predicted position.
   */
  renderRoutePrediction(
    fromPos: Vector3,
    toPos: Vector3,
    probability: number,
    playerType: number = 1
  ): void {
    if (this.activeTrails >= MAX_TRAIL_LINES) return;

    // Build dashed-line points
    const steps = 12;
    const points: Vector3[] = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      // Slight arc upward
      const arcHeight = Math.sin(t * Math.PI) * 1.5;
      const pos = Vector3.Lerp(fromPos, toPos, t);
      pos.y = 1 + arcHeight;
      // Only add every other segment for dash effect
      if (i % 2 === 0 || i === steps) {
        points.push(pos);
      }
    }

    if (points.length < 2) return;

    const colorHex = GHOST_COLORS[playerType] ?? '#39FF14';
    const color = Color3.FromHexString(colorHex);
    const alpha = Math.min(0.6, probability * 0.7);

    const colors = points.map(() => new Color4(color.r, color.g, color.b, alpha));

    const line = MeshBuilder.CreateLines(
      `ghostRoute_${this.activeTrails}`,
      { points, colors, updatable: false },
      this.scene
    );

    this.trailPool.push(line);
    this.activeTrails++;
  }

  /**
   * Clear all ghost meshes and trails. Call at start of each frame.
   */
  clear(): void {
    for (let i = 0; i < this.activeGhosts; i++) {
      this.ghostPool[i].isVisible = false;
    }
    this.activeGhosts = 0;

    for (const trail of this.trailPool) {
      trail.dispose();
    }
    this.trailPool = [];
    this.activeTrails = 0;
  }

  dispose(): void {
    this.clear();
    for (const mesh of this.ghostPool) {
      mesh.dispose();
    }
    this.ghostPool = [];
  }
}
