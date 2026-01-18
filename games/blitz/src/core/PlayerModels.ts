/**
 * Blaze Blitz Football - Enhanced Player Models
 *
 * Creates stylized football player meshes with:
 * - Team-colored uniforms
 * - Jersey numbers
 * - Position-based sizing
 * - Animated idle poses
 */

import {
  Scene,
  MeshBuilder,
  Mesh,
  StandardMaterial,
  PBRMaterial,
  Color3,
  Vector3,
  DynamicTexture,
  Animation,
  TransformNode,
} from '@babylonjs/core';
import type { BlitzTeam } from '@data/teams';

/** Position ID type - string ID for player position */
export type PositionId = string;

/** Player size by position group */
const POSITION_SIZES = {
  // Offensive
  QB: { height: 1.85, width: 0.45 },
  RB: { height: 1.75, width: 0.5 },
  WR: { height: 1.8, width: 0.4 },
  TE: { height: 1.9, width: 0.55 },
  OL: { height: 1.9, width: 0.7 },

  // Defensive
  DL: { height: 1.9, width: 0.7 },
  LB: { height: 1.85, width: 0.6 },
  CB: { height: 1.78, width: 0.4 },
  S: { height: 1.82, width: 0.45 },
} as const;

/** Player mesh configuration */
export interface PlayerMeshConfig {
  position: PositionId;
  jerseyNumber: number;
  team: BlitzTeam;
  isOffense: boolean;
}

export class PlayerModelFactory {
  private scene: Scene;

  constructor(scene: Scene) {
    this.scene = scene;
  }

  /** Create a complete player mesh */
  public createPlayer(config: PlayerMeshConfig): Mesh {
    const { position, jerseyNumber, team, isOffense } = config;
    const size = this.getSizeForPosition(position);

    // Root transform
    const player = new TransformNode(`player_${position}_${jerseyNumber}`, this.scene);

    // Body (capsule-like shape)
    const body = this.createBody(size, team, isOffense);
    body.parent = player;

    // Head/helmet
    const helmet = this.createHelmet(size, team);
    helmet.parent = player;

    // Jersey number (front and back)
    const numberFront = this.createJerseyNumber(jerseyNumber, size, team, true);
    numberFront.parent = player;

    const numberBack = this.createJerseyNumber(jerseyNumber, size, team, false);
    numberBack.parent = player;

    // Shoulders/pads
    const pads = this.createShoulderPads(size, team);
    pads.parent = player;

    // Merge into single mesh for performance
    const merged = Mesh.MergeMeshes(
      [body, helmet, numberFront, numberBack, pads],
      true,
      true,
      undefined,
      false,
      true
    );

    if (!merged) {
      // Fallback to simple mesh
      return this.createSimplePlayer(config);
    }

    merged.name = `player_${position}_${jerseyNumber}`;
    merged.checkCollisions = true;

    // Add idle animation
    this.addIdleAnimation(merged);

    return merged;
  }

  /** Create simplified player (fallback) */
  public createSimplePlayer(config: PlayerMeshConfig): Mesh {
    const size = this.getSizeForPosition(config.position);

    const player = MeshBuilder.CreateCapsule(
      `player_${config.position}_${config.jerseyNumber}`,
      {
        height: size.height,
        radius: size.width / 2,
      },
      this.scene
    );

    const mat = new PBRMaterial(`playerMat_${config.jerseyNumber}`, this.scene);
    mat.albedoColor = Color3.FromHexString(config.team.primaryColor);
    mat.roughness = 0.7;
    mat.metallic = 0.1;

    player.material = mat;
    player.position.y = size.height / 2;
    player.checkCollisions = true;

    return player;
  }

  /** Get size configuration for position */
  private getSizeForPosition(position: PositionId): { height: number; width: number } {
    // Map position to size category
    const positionCategory = this.getPositionCategory(position);
    return POSITION_SIZES[positionCategory] || POSITION_SIZES.WR;
  }

  /** Map position to size category */
  private getPositionCategory(position: PositionId): keyof typeof POSITION_SIZES {
    const mapping: Record<string, keyof typeof POSITION_SIZES> = {
      QB: 'QB',
      RB: 'RB',
      HB: 'RB',
      FB: 'RB',
      WR1: 'WR',
      WR2: 'WR',
      WR3: 'WR',
      WR4: 'WR',
      TE: 'TE',
      LT: 'OL',
      LG: 'OL',
      C: 'OL',
      RG: 'OL',
      RT: 'OL',
      DE: 'DL',
      DT: 'DL',
      NT: 'DL',
      OLB: 'LB',
      ILB: 'LB',
      MLB: 'LB',
      CB1: 'CB',
      CB2: 'CB',
      FS: 'S',
      SS: 'S',
    };

    return mapping[position] || 'WR';
  }

  /** Create player body */
  private createBody(
    size: { height: number; width: number },
    team: BlitzTeam,
    isOffense: boolean
  ): Mesh {
    const body = MeshBuilder.CreateCapsule(
      'body',
      {
        height: size.height * 0.65,
        radius: size.width / 2,
        tessellation: 12,
        subdivisions: 2,
      },
      this.scene
    );

    const bodyMat = new PBRMaterial('bodyMat', this.scene);
    bodyMat.albedoColor = Color3.FromHexString(team.primaryColor);
    bodyMat.roughness = 0.8;
    bodyMat.metallic = 0;

    body.material = bodyMat;
    body.position.y = size.height * 0.35;

    return body;
  }

  /** Create helmet */
  private createHelmet(size: { height: number; width: number }, team: BlitzTeam): Mesh {
    const helmet = MeshBuilder.CreateSphere(
      'helmet',
      {
        diameter: size.width * 1.1,
        segments: 12,
      },
      this.scene
    );

    const helmetMat = new PBRMaterial('helmetMat', this.scene);
    helmetMat.albedoColor = Color3.FromHexString(team.secondaryColor);
    helmetMat.roughness = 0.3;
    helmetMat.metallic = 0.5;

    helmet.material = helmetMat;
    helmet.position.y = size.height * 0.85;
    helmet.scaling.y = 0.8; // Slightly flattened

    // Facemask (simple bar)
    const facemask = MeshBuilder.CreateBox(
      'facemask',
      {
        width: size.width * 0.6,
        height: size.width * 0.3,
        depth: size.width * 0.2,
      },
      this.scene
    );

    const facemaskMat = new StandardMaterial('facemaskMat', this.scene);
    facemaskMat.diffuseColor = new Color3(0.3, 0.3, 0.3);

    facemask.material = facemaskMat;
    facemask.position.y = size.height * 0.82;
    facemask.position.z = size.width * 0.4;

    // Merge helmet and facemask
    const merged = Mesh.MergeMeshes([helmet, facemask], true);
    if (!merged) return helmet;

    merged.name = 'helmet';
    return merged;
  }

  /** Create jersey number */
  private createJerseyNumber(
    number: number,
    size: { height: number; width: number },
    team: BlitzTeam,
    isFront: boolean
  ): Mesh {
    const plane = MeshBuilder.CreatePlane(
      isFront ? 'numberFront' : 'numberBack',
      {
        width: size.width * 0.8,
        height: size.width * 0.6,
      },
      this.scene
    );

    // Dynamic texture for number
    const texture = new DynamicTexture(
      `numberTex_${number}_${isFront ? 'F' : 'B'}`,
      { width: 128, height: 96 },
      this.scene,
      true
    );

    const ctx = texture.getContext();
    ctx.clearRect(0, 0, 128, 96);

    ctx.font = 'bold 72px Arial';
    ctx.fillStyle = team.accentColor || '#FFFFFF';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 4;
    (ctx as CanvasRenderingContext2D).textAlign = 'center';
    (ctx as CanvasRenderingContext2D).textBaseline = 'middle';
    ctx.strokeText(number.toString(), 64, 48);
    ctx.fillText(number.toString(), 64, 48);

    texture.update();

    const mat = new StandardMaterial(`numberMat_${number}`, this.scene);
    mat.diffuseTexture = texture;
    mat.diffuseTexture.hasAlpha = true;
    mat.useAlphaFromDiffuseTexture = true;
    mat.backFaceCulling = false;
    mat.emissiveColor = Color3.White().scale(0.2);

    plane.material = mat;
    plane.position.y = size.height * 0.45;
    plane.position.z = isFront ? size.width * 0.26 : -size.width * 0.26;

    if (!isFront) {
      plane.rotation.y = Math.PI;
    }

    return plane;
  }

  /** Create shoulder pads */
  private createShoulderPads(size: { height: number; width: number }, team: BlitzTeam): Mesh {
    const pads = MeshBuilder.CreateBox(
      'shoulderPads',
      {
        width: size.width * 1.4,
        height: size.height * 0.1,
        depth: size.width * 0.8,
      },
      this.scene
    );

    const padsMat = new PBRMaterial('padsMat', this.scene);
    padsMat.albedoColor = Color3.FromHexString(team.secondaryColor);
    padsMat.roughness = 0.5;
    padsMat.metallic = 0.3;

    pads.material = padsMat;
    pads.position.y = size.height * 0.65;

    return pads;
  }

  /** Add subtle idle animation */
  private addIdleAnimation(mesh: Mesh): void {
    const idle = new Animation(
      'idleBreathe',
      'scaling.y',
      30,
      Animation.ANIMATIONTYPE_FLOAT,
      Animation.ANIMATIONLOOPMODE_CYCLE
    );

    idle.setKeys([
      { frame: 0, value: 1 },
      { frame: 30, value: 1.02 },
      { frame: 60, value: 1 },
    ]);

    mesh.animations.push(idle);
    this.scene.beginAnimation(mesh, 0, 60, true);
  }

  /** Create football mesh */
  public createFootball(): Mesh {
    // Prolate spheroid (football shape)
    const ball = MeshBuilder.CreateSphere(
      'football',
      {
        diameter: 0.3,
        segments: 16,
      },
      this.scene
    );

    // Stretch to football shape
    ball.scaling = new Vector3(0.5, 0.5, 1);

    const ballMat = new PBRMaterial('footballMat', this.scene);
    ballMat.albedoColor = new Color3(0.4, 0.25, 0.1); // Brown leather
    ballMat.roughness = 0.7;
    ballMat.metallic = 0;

    ball.material = ballMat;

    // Add laces
    const laces = MeshBuilder.CreateBox(
      'laces',
      {
        width: 0.02,
        height: 0.15,
        depth: 0.01,
      },
      this.scene
    );

    const lacesMat = new StandardMaterial('lacesMat', this.scene);
    lacesMat.diffuseColor = Color3.White();

    laces.material = lacesMat;
    laces.parent = ball;
    laces.position.y = 0.08;

    return ball;
  }
}

/** Quick factory function for creating players */
export function createPlayerMesh(scene: Scene, config: PlayerMeshConfig): Mesh {
  const factory = new PlayerModelFactory(scene);
  return factory.createPlayer(config);
}

/** Quick factory function for football */
export function createFootballMesh(scene: Scene): Mesh {
  const factory = new PlayerModelFactory(scene);
  return factory.createFootball();
}
