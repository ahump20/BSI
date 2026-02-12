/**
 * Ghost Renderer 3D — Babylon.js ghost meshes + trajectory trails
 * Creates transparent mesh clones at predicted positions with GlowLayer halos
 * and dashed LinesMesh for trajectory arcs.
 */

import { decode } from './state-tokenizer.js';

const GHOST_MATERIAL_NAME = 'genie_ghost_mat';

export class GhostRenderer3D {
  /**
   * @param {import('@babylonjs/core').Scene} scene
   * @param {import('@babylonjs/core').GlowLayer} [glowLayer]
   */
  constructor(scene, glowLayer = null) {
    this.scene = scene;
    this.glowLayer = glowLayer;
    this.ghostPool = [];
    this.trailPool = [];
    this.activeGhosts = 0;
    this.activeTrails = 0;
    this._initMaterials();
  }

  _initMaterials() {
    // Lazy: we build materials from scene primitives
    if (!this.scene.getMaterialByName(GHOST_MATERIAL_NAME)) {
      // Fallback: use StandardMaterial if PBR not available
      this.ghostMaterial = this._createGhostMaterial();
    } else {
      this.ghostMaterial = this.scene.getMaterialByName(GHOST_MATERIAL_NAME);
    }
  }

  _createGhostMaterial() {
    // Use BABYLON namespace from scene
    const scene = this.scene;
    let mat;
    try {
      // Try StandardMaterial (always available)
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { StandardMaterial, Color3 } = require('@babylonjs/core');
      mat = new StandardMaterial(GHOST_MATERIAL_NAME, scene);
      mat.diffuseColor = new Color3(0.4, 0.6, 1.0);
      mat.alpha = 0.3;
      mat.wireframe = false;
      mat.backFaceCulling = false;
    } catch {
      // If module not found, create material from scene globals
      mat = null;
    }
    return mat;
  }

  /**
   * Render ghost meshes at predicted positions.
   * @param {Map<string, {predictions: Array, currentPos: {x:number,y:number,z:number}}>} entityPredictions
   * @param {object} options
   * @param {Function} options.regionToWorld - (region: number) => {x, y, z}
   * @param {number} [options.minProbability=0.1]
   */
  renderGhosts(entityPredictions, options = {}) {
    const { regionToWorld, minProbability = 0.1 } = options;
    this._resetPool();

    for (const [, data] of entityPredictions) {
      const { predictions } = data;
      for (const pred of predictions) {
        if (pred.probability < minProbability) continue;
        const state = decode(pred.token);
        const worldPos = regionToWorld
          ? regionToWorld(state.region)
          : this._defaultRegionToWorld(state.region);

        this._placeGhost(worldPos, pred.probability);
      }
    }

    // Hide unused pool members
    for (let i = this.activeGhosts; i < this.ghostPool.length; i++) {
      this.ghostPool[i].isVisible = false;
    }
    for (let i = this.activeTrails; i < this.trailPool.length; i++) {
      this.trailPool[i].isVisible = false;
    }
  }

  /**
   * Render trajectory arc from current position through predicted positions.
   * Used for ball paths (pitch prediction, hit prediction).
   * @param {Array<{x:number,y:number,z:number}>} points - World-space trajectory points
   * @param {number} probability - 0-1 opacity scaling
   * @param {object} [options]
   */
  renderTrajectoryArc(points, probability, options = {}) {
    if (points.length < 2) return;
    const { dashSize = 0.3, gapSize = 0.2 } = options;

    let trail = this.trailPool[this.activeTrails];
    if (!trail) {
      trail = this._createTrailMesh();
      this.trailPool.push(trail);
    }

    // Update line points
    const vectors = points.map(p => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { Vector3 } = require('@babylonjs/core');
        return new Vector3(p.x, p.y, p.z);
      } catch {
        return { x: p.x, y: p.y, z: p.z };
      }
    });

    // Recreate mesh with new points (Babylon Lines are immutable)
    trail.dispose();
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { MeshBuilder, Color4 } = require('@babylonjs/core');
      const colors = vectors.map(() =>
        new Color4(0.4, 0.6, 1.0, probability * 0.6)
      );
      trail = MeshBuilder.CreateLines(`genie_trail_${this.activeTrails}`, {
        points: vectors,
        colors,
        dashSize,
        gapSize,
        dashNb: Math.floor(points.length * 2),
        updatable: false,
      }, this.scene);
      if (this.glowLayer) {
        this.glowLayer.addIncludedOnlyMesh(trail);
      }
    } catch {
      // Babylon not available at import time -- will be available at runtime
    }

    this.trailPool[this.activeTrails] = trail;
    trail.isVisible = true;
    this.activeTrails++;
  }

  _placeGhost(worldPos, probability) {
    let ghost = this.ghostPool[this.activeGhosts];
    if (!ghost) {
      ghost = this._createGhostSphere();
      this.ghostPool.push(ghost);
    }

    ghost.position.set(worldPos.x, worldPos.y, worldPos.z);
    ghost.scaling.setAll(0.5 + probability * 0.5);
    ghost.isVisible = true;

    if (ghost.material) {
      ghost.material.alpha = probability * 0.4;
    }

    if (this.glowLayer) {
      this.glowLayer.addIncludedOnlyMesh(ghost);
      this.glowLayer.customEmissiveColorSelector = (mesh, subMesh, material, result) => {
        if (mesh === ghost) {
          result.set(0.4, 0.6, 1.0, probability);
        }
      };
    }

    this.activeGhosts++;
  }

  _createGhostSphere() {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { MeshBuilder, StandardMaterial, Color3 } = require('@babylonjs/core');
      const sphere = MeshBuilder.CreateSphere(
        `genie_ghost_${this.ghostPool.length}`,
        { diameter: 0.5, segments: 8 },
        this.scene
      );
      const mat = new StandardMaterial(`ghost_mat_${this.ghostPool.length}`, this.scene);
      mat.diffuseColor = new Color3(0.4, 0.6, 1.0);
      mat.alpha = 0.3;
      mat.backFaceCulling = false;
      sphere.material = mat;
      sphere.isVisible = false;
      return sphere;
    } catch {
      return { position: { set() {} }, scaling: { setAll() {} }, isVisible: false, material: null, dispose() {} };
    }
  }

  _createTrailMesh() {
    // Placeholder -- replaced on first renderTrajectoryArc call
    return { isVisible: false, dispose() {} };
  }

  _resetPool() {
    this.activeGhosts = 0;
    this.activeTrails = 0;
  }

  _defaultRegionToWorld(region) {
    // 4x4 grid mapped to a 100x100 field
    const gx = region % 4;
    const gy = Math.floor(region / 4);
    return { x: (gx + 0.5) * 25, y: 0, z: (gy + 0.5) * 25 };
  }

  dispose() {
    for (const ghost of this.ghostPool) ghost.dispose?.();
    for (const trail of this.trailPool) trail.dispose?.();
    this.ghostPool = [];
    this.trailPool = [];
  }
}

export default GhostRenderer3D;
