/**
 * Blaze Blitz Football - Field Generation
 *
 * Creates the 100-yard football field with yard lines,
 * end zones, hash marks, and team branding
 */

import {
  Scene,
  MeshBuilder,
  StandardMaterial,
  PBRMaterial,
  Color3,
  Vector3,
  Mesh,
  DynamicTexture,
  PointLight,
} from '@babylonjs/core';
import type { BlitzTeam } from '@data/teams';

/** Field dimensions in game units (1 unit = 1 yard) */
export const FIELD_CONFIG = {
  length: 100,        // 100 yards
  width: 53.33,       // 53 1/3 yards (160 feet)
  endZoneDepth: 10,   // 10 yards each end zone
  hashWidth: 18.5,    // Distance between hash marks
  yardLineInterval: 5, // Yard lines every 5 yards
  numberInterval: 10,  // Numbers every 10 yards
} as const;

/** Colors for field elements */
const FIELD_COLORS = {
  grass: '#2E7D32',
  grassDark: '#1B5E20',
  yardLine: '#FFFFFF',
  hashMark: '#FFFFFF',
  endZoneText: '#FFFFFF',
} as const;

/** Field builder class */
export class FootballField {
  private scene: Scene;
  private homeTeam: BlitzTeam;
  private awayTeam: BlitzTeam;
  private fieldMeshes: Mesh[] = [];
  private _jumbotronTexture: DynamicTexture | null = null;

  constructor(scene: Scene, homeTeam: BlitzTeam, awayTeam: BlitzTeam) {
    this.scene = scene;
    this.homeTeam = homeTeam;
    this.awayTeam = awayTeam;
  }

  /** Build the complete field */
  public build(): void {
    this.createGround();
    this.createEndZones();
    this.createYardLines();
    this.createHashMarks();
    this.createFieldNumbers();
    this.createSidelines();
    this.createStadiumShell();
  }

  /** Create the main grass surface */
  private createGround(): void {
    const totalLength = FIELD_CONFIG.length + FIELD_CONFIG.endZoneDepth * 2;

    // Main playing surface
    const ground = MeshBuilder.CreateGround(
      'field',
      {
        width: FIELD_CONFIG.width,
        height: totalLength,
        subdivisions: 20,
      },
      this.scene
    );

    // Create striped grass texture pattern
    const grassMat = new PBRMaterial('grassMat', this.scene);
    grassMat.albedoColor = Color3.FromHexString(FIELD_COLORS.grass);
    grassMat.roughness = 0.95;
    grassMat.metallic = 0;

    ground.material = grassMat;
    ground.receiveShadows = true;
    ground.position.z = FIELD_CONFIG.length / 2; // Center field at z=50

    this.fieldMeshes.push(ground);

    // Add alternating grass stripes for visual appeal
    for (let i = 0; i < 20; i++) {
      if (i % 2 === 0) continue; // Skip even stripes

      const stripe = MeshBuilder.CreateGround(
        `grassStripe_${i}`,
        {
          width: FIELD_CONFIG.width,
          height: 5,
        },
        this.scene
      );

      const stripeMat = new PBRMaterial(`stripeMat_${i}`, this.scene);
      stripeMat.albedoColor = Color3.FromHexString(FIELD_COLORS.grassDark);
      stripeMat.roughness = 0.95;
      stripeMat.metallic = 0;

      stripe.material = stripeMat;
      stripe.position.y = 0.001;
      stripe.position.z = i * 5 + 2.5;
      stripe.receiveShadows = true;

      this.fieldMeshes.push(stripe);
    }
  }

  /** Create the end zones with team colors */
  private createEndZones(): void {
    // Home end zone (z < 0)
    const homeEndZone = MeshBuilder.CreateGround(
      'homeEndZone',
      {
        width: FIELD_CONFIG.width,
        height: FIELD_CONFIG.endZoneDepth,
      },
      this.scene
    );

    const homeMat = new PBRMaterial('homeEndZoneMat', this.scene);
    homeMat.albedoColor = Color3.FromHexString(this.homeTeam.primaryColor);
    homeMat.roughness = 0.9;
    homeMat.metallic = 0;

    homeEndZone.material = homeMat;
    homeEndZone.position.y = 0.002;
    homeEndZone.position.z = -FIELD_CONFIG.endZoneDepth / 2;
    homeEndZone.receiveShadows = true;

    this.fieldMeshes.push(homeEndZone);

    // Away end zone (z > 100)
    const awayEndZone = MeshBuilder.CreateGround(
      'awayEndZone',
      {
        width: FIELD_CONFIG.width,
        height: FIELD_CONFIG.endZoneDepth,
      },
      this.scene
    );

    const awayMat = new PBRMaterial('awayEndZoneMat', this.scene);
    awayMat.albedoColor = Color3.FromHexString(this.awayTeam.primaryColor);
    awayMat.roughness = 0.9;
    awayMat.metallic = 0;

    awayEndZone.material = awayMat;
    awayEndZone.position.y = 0.002;
    awayEndZone.position.z = FIELD_CONFIG.length + FIELD_CONFIG.endZoneDepth / 2;
    awayEndZone.receiveShadows = true;

    this.fieldMeshes.push(awayEndZone);

    // Add team name text to end zones
    this.createEndZoneText(this.homeTeam, -FIELD_CONFIG.endZoneDepth / 2, false);
    this.createEndZoneText(this.awayTeam, FIELD_CONFIG.length + FIELD_CONFIG.endZoneDepth / 2, true);
  }

  /** Create end zone team text */
  private createEndZoneText(team: BlitzTeam, zPos: number, flip: boolean): void {
    const textPlane = MeshBuilder.CreatePlane(
      `endZoneText_${team.id}`,
      { width: 40, height: 8 },
      this.scene
    );

    // Create dynamic texture for text
    const textureResolution = 1024;
    const texture = new DynamicTexture(
      `endZoneTexture_${team.id}`,
      { width: textureResolution, height: textureResolution / 5 },
      this.scene,
      true
    );

    const ctx = texture.getContext();
    ctx.fillStyle = 'transparent';
    ctx.clearRect(0, 0, textureResolution, textureResolution / 5);

    ctx.font = 'bold 120px Arial';
    ctx.fillStyle = team.secondaryColor;
    (ctx as unknown as CanvasRenderingContext2D).textAlign = 'center';
    (ctx as unknown as CanvasRenderingContext2D).textBaseline = 'middle';
    ctx.fillText(team.shortName, textureResolution / 2, textureResolution / 10);

    texture.update();

    const textMat = new StandardMaterial(`endZoneTextMat_${team.id}`, this.scene);
    textMat.diffuseTexture = texture;
    textMat.diffuseTexture.hasAlpha = true;
    textMat.useAlphaFromDiffuseTexture = true;
    textMat.backFaceCulling = false;
    textMat.emissiveColor = Color3.White();

    textPlane.material = textMat;
    textPlane.rotation.x = Math.PI / 2;
    textPlane.position.y = 0.003;
    textPlane.position.z = zPos;

    if (flip) {
      textPlane.rotation.y = Math.PI;
    }

    this.fieldMeshes.push(textPlane);
  }

  /** Create yard lines */
  private createYardLines(): void {
    const lineMat = new StandardMaterial('yardLineMat', this.scene);
    lineMat.diffuseColor = Color3.White();
    lineMat.emissiveColor = new Color3(0.2, 0.2, 0.2);

    // Create yard lines every 5 yards
    for (let yard = 0; yard <= FIELD_CONFIG.length; yard += FIELD_CONFIG.yardLineInterval) {
      const lineWidth = yard % 10 === 0 ? 0.3 : 0.15; // Thicker lines every 10 yards

      const line = MeshBuilder.CreateBox(
        `yardLine_${yard}`,
        {
          width: FIELD_CONFIG.width,
          height: 0.01,
          depth: lineWidth,
        },
        this.scene
      );

      line.material = lineMat;
      line.position.y = 0.005;
      line.position.z = yard;

      this.fieldMeshes.push(line);
    }

    // Goal lines (thicker)
    const goalLineMat = new StandardMaterial('goalLineMat', this.scene);
    goalLineMat.diffuseColor = Color3.White();
    goalLineMat.emissiveColor = new Color3(0.5, 0.5, 0.5);

    [0, FIELD_CONFIG.length].forEach((zPos, idx) => {
      const goalLine = MeshBuilder.CreateBox(
        `goalLine_${idx}`,
        {
          width: FIELD_CONFIG.width,
          height: 0.01,
          depth: 0.5,
        },
        this.scene
      );

      goalLine.material = goalLineMat;
      goalLine.position.y = 0.006;
      goalLine.position.z = zPos;

      this.fieldMeshes.push(goalLine);
    });
  }

  /** Create hash marks */
  private createHashMarks(): void {
    const hashMat = new StandardMaterial('hashMat', this.scene);
    hashMat.diffuseColor = Color3.White();

    const hashLength = 0.75;
    const hashWidth = 0.1;

    // Hash marks every yard
    for (let yard = 1; yard < FIELD_CONFIG.length; yard++) {
      // Skip where yard lines exist
      if (yard % FIELD_CONFIG.yardLineInterval === 0) continue;

      // Left hash marks
      const leftHash = MeshBuilder.CreateBox(
        `hashLeft_${yard}`,
        {
          width: hashLength,
          height: 0.01,
          depth: hashWidth,
        },
        this.scene
      );

      leftHash.material = hashMat;
      leftHash.position.x = -FIELD_CONFIG.hashWidth / 2;
      leftHash.position.y = 0.004;
      leftHash.position.z = yard;

      this.fieldMeshes.push(leftHash);

      // Right hash marks
      const rightHash = MeshBuilder.CreateBox(
        `hashRight_${yard}`,
        {
          width: hashLength,
          height: 0.01,
          depth: hashWidth,
        },
        this.scene
      );

      rightHash.material = hashMat;
      rightHash.position.x = FIELD_CONFIG.hashWidth / 2;
      rightHash.position.y = 0.004;
      rightHash.position.z = yard;

      this.fieldMeshes.push(rightHash);
    }
  }

  /** Create field numbers */
  private createFieldNumbers(): void {
    const numbers = [10, 20, 30, 40, 50, 40, 30, 20, 10];

    numbers.forEach((num, idx) => {
      const zPos = (idx + 1) * 10;

      // Left side number
      this.createFieldNumber(num, -FIELD_CONFIG.width / 2 + 6, zPos, false);

      // Right side number
      this.createFieldNumber(num, FIELD_CONFIG.width / 2 - 6, zPos, true);
    });
  }

  /** Create a single field number */
  private createFieldNumber(
    num: number,
    xPos: number,
    zPos: number,
    flip: boolean
  ): void {
    const numberPlane = MeshBuilder.CreatePlane(
      `fieldNumber_${num}_${xPos > 0 ? 'R' : 'L'}_${zPos}`,
      { width: 4, height: 6 },
      this.scene
    );

    const texture = new DynamicTexture(
      `numberTexture_${num}_${xPos}_${zPos}`,
      { width: 256, height: 384 },
      this.scene,
      true
    );

    const ctx = texture.getContext();
    ctx.clearRect(0, 0, 256, 384);

    ctx.font = 'bold 280px Arial';
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 8;
    (ctx as unknown as CanvasRenderingContext2D).textAlign = 'center';
    (ctx as unknown as CanvasRenderingContext2D).textBaseline = 'middle';
    ctx.strokeText(num.toString(), 128, 192);
    ctx.fillText(num.toString(), 128, 192);

    texture.update();

    const numMat = new StandardMaterial(`numberMat_${num}_${xPos}_${zPos}`, this.scene);
    numMat.diffuseTexture = texture;
    numMat.diffuseTexture.hasAlpha = true;
    numMat.useAlphaFromDiffuseTexture = true;
    numMat.backFaceCulling = false;
    numMat.emissiveColor = new Color3(0.3, 0.3, 0.3);

    numberPlane.material = numMat;
    numberPlane.rotation.x = Math.PI / 2;
    numberPlane.position.x = xPos;
    numberPlane.position.y = 0.007;
    numberPlane.position.z = zPos;

    if (flip) {
      numberPlane.rotation.y = Math.PI;
    }

    this.fieldMeshes.push(numberPlane);
  }

  /** Create sidelines and out-of-bounds markers */
  private createSidelines(): void {
    const sidelineMat = new StandardMaterial('sidelineMat', this.scene);
    sidelineMat.diffuseColor = Color3.White();
    sidelineMat.emissiveColor = new Color3(0.3, 0.3, 0.3);

    const totalLength = FIELD_CONFIG.length + FIELD_CONFIG.endZoneDepth * 2;

    // Left sideline
    const leftSideline = MeshBuilder.CreateBox(
      'leftSideline',
      {
        width: 0.3,
        height: 0.01,
        depth: totalLength,
      },
      this.scene
    );

    leftSideline.material = sidelineMat;
    leftSideline.position.x = -FIELD_CONFIG.width / 2;
    leftSideline.position.y = 0.005;
    leftSideline.position.z = FIELD_CONFIG.length / 2;

    this.fieldMeshes.push(leftSideline);

    // Right sideline
    const rightSideline = MeshBuilder.CreateBox(
      'rightSideline',
      {
        width: 0.3,
        height: 0.01,
        depth: totalLength,
      },
      this.scene
    );

    rightSideline.material = sidelineMat;
    rightSideline.position.x = FIELD_CONFIG.width / 2;
    rightSideline.position.y = 0.005;
    rightSideline.position.z = FIELD_CONFIG.length / 2;

    this.fieldMeshes.push(rightSideline);

    // Out of bounds areas (darker)
    const oobMat = new PBRMaterial('oobMat', this.scene);
    oobMat.albedoColor = new Color3(0.15, 0.15, 0.15);
    oobMat.roughness = 1;
    oobMat.metallic = 0;

    [-1, 1].forEach((side) => {
      const oob = MeshBuilder.CreateGround(
        `oob_${side > 0 ? 'right' : 'left'}`,
        {
          width: 10,
          height: totalLength,
        },
        this.scene
      );

      oob.material = oobMat;
      oob.position.x = side * (FIELD_CONFIG.width / 2 + 5);
      oob.position.y = -0.01;
      oob.position.z = FIELD_CONFIG.length / 2;

      this.fieldMeshes.push(oob);
    });
  }

  /** Get yard line position (0-100) from world Z coordinate */
  public static worldZToYardLine(z: number): number {
    return Math.max(0, Math.min(100, z));
  }

  /** Get world Z coordinate from yard line (0-100) */
  public static yardLineToWorldZ(yardLine: number): number {
    return yardLine;
  }

  /** Check if position is in bounds */
  public static isInBounds(x: number, z: number): boolean {
    const halfWidth = FIELD_CONFIG.width / 2;
    return (
      x >= -halfWidth &&
      x <= halfWidth &&
      z >= -FIELD_CONFIG.endZoneDepth &&
      z <= FIELD_CONFIG.length + FIELD_CONFIG.endZoneDepth
    );
  }

  /** Check if position is in end zone */
  public static isInEndZone(z: number): 'home' | 'away' | null {
    if (z <= 0) return 'home';
    if (z >= FIELD_CONFIG.length) return 'away';
    return null;
  }

  /** Create stadium grandstands, light towers, and jumbotron */
  private createStadiumShell(): void {
    const totalLength = FIELD_CONFIG.length + FIELD_CONFIG.endZoneDepth * 2;
    const halfWidth = FIELD_CONFIG.width / 2;

    // Grandstand material - dark concrete look
    const standMat = new PBRMaterial('standMat', this.scene);
    standMat.albedoColor = new Color3(0.3, 0.3, 0.32);
    standMat.roughness = 0.85;
    standMat.metallic = 0.1;

    // 4 grandstands around field perimeter
    const stands: Array<{ w: number; h: number; d: number; pos: [number, number, number] }> = [
      { w: 200, h: 15, d: 8, pos: [-(halfWidth + 12), 7.5, FIELD_CONFIG.length / 2] }, // Left
      { w: 200, h: 15, d: 8, pos: [halfWidth + 12, 7.5, FIELD_CONFIG.length / 2] },    // Right
      { w: 8, h: 15, d: FIELD_CONFIG.width + 24, pos: [0, 7.5, -FIELD_CONFIG.endZoneDepth - 8] }, // Behind home
      { w: 8, h: 15, d: FIELD_CONFIG.width + 24, pos: [0, 7.5, FIELD_CONFIG.length + FIELD_CONFIG.endZoneDepth + 8] }, // Behind away
    ];

    stands.forEach((s, i) => {
      const stand = MeshBuilder.CreateBox(`grandstand_${i}`, { width: s.d, height: s.h, depth: s.w }, this.scene);
      stand.material = standMat;
      stand.position.set(s.pos[0], s.pos[1], s.pos[2]);
      stand.receiveShadows = true;
      this.fieldMeshes.push(stand);
    });

    // 4 corner light towers
    const towerMat = new PBRMaterial('towerMat', this.scene);
    towerMat.albedoColor = new Color3(0.4, 0.4, 0.4);
    towerMat.roughness = 0.6;
    towerMat.metallic = 0.5;

    const corners: Array<[number, number]> = [
      [-(halfWidth + 8), -FIELD_CONFIG.endZoneDepth],
      [halfWidth + 8, -FIELD_CONFIG.endZoneDepth],
      [-(halfWidth + 8), FIELD_CONFIG.length + FIELD_CONFIG.endZoneDepth],
      [halfWidth + 8, FIELD_CONFIG.length + FIELD_CONFIG.endZoneDepth],
    ];

    corners.forEach(([x, z], i) => {
      const tower = MeshBuilder.CreateCylinder(`lightTower_${i}`, { diameter: 2, height: 40 }, this.scene);
      tower.material = towerMat;
      tower.position.set(x, 20, z);
      this.fieldMeshes.push(tower);

      const light = new PointLight(`towerLight_${i}`, new Vector3(x, 40, z), this.scene);
      light.intensity = 0.6;
      light.range = 80;
      light.diffuse = Color3.White();
    });

    // Jumbotron behind away end zone
    const jumbotronPlane = MeshBuilder.CreatePlane(
      'jumbotron',
      { width: 20, height: 8 },
      this.scene
    );
    jumbotronPlane.position.set(0, 18, FIELD_CONFIG.length + FIELD_CONFIG.endZoneDepth + 3);

    const jumbotronTexture = new DynamicTexture('jumbotronTex', { width: 512, height: 256 }, this.scene, false);
    const jumbotronMat = new StandardMaterial('jumbotronMat', this.scene);
    jumbotronMat.diffuseTexture = jumbotronTexture;
    jumbotronMat.emissiveColor = new Color3(0.8, 0.8, 0.8);
    jumbotronMat.backFaceCulling = false;
    jumbotronPlane.material = jumbotronMat;

    // Initial text
    this.updateJumbotron(jumbotronTexture, 0, 0);
    this.fieldMeshes.push(jumbotronPlane);

    // Store reference for updates
    this._jumbotronTexture = jumbotronTexture;
  }

  /** Update jumbotron score display */
  public updateJumbotron(texture: DynamicTexture | null = null, home: number = 0, away: number = 0): void {
    const tex = texture || this._jumbotronTexture;
    if (!tex) return;
    const ctx = tex.getContext();
    ctx.fillStyle = '#111111';
    ctx.fillRect(0, 0, 512, 256);
    ctx.font = 'bold 60px Arial';
    ctx.fillStyle = '#FFFFFF';
    (ctx as unknown as CanvasRenderingContext2D).textAlign = 'center';
    (ctx as unknown as CanvasRenderingContext2D).textBaseline = 'middle';
    ctx.fillText(`SCORE: ${home} - ${away}`, 256, 128);
    tex.update();
  }

  /** Dispose all field meshes */
  public dispose(): void {
    this.fieldMeshes.forEach((mesh) => mesh.dispose());
    this.fieldMeshes = [];
  }
}
