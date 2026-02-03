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
  Mesh,
  DynamicTexture,
  Vector3,
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

const STADIUM_COLORS = {
  concrete: '#2A2D33',
  steel: '#4B535E',
  crowdBase: '#1B1F26',
  ribbon: '#FF6B35',
  goalPost: '#F7C948',
  pylon: '#FF6B35',
} as const;

/** Field builder class */
export class FootballField {
  private scene: Scene;
  private homeTeam: BlitzTeam;
  private awayTeam: BlitzTeam;
  private fieldMeshes: Mesh[] = [];
  private jumbotronScreen: Mesh | null = null;
  private jumbotronTexture: DynamicTexture | null = null;

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
    this.createGoalPosts();
    this.createPylons();
    this.createStadiumBowl();
    this.createLightTowers();
    this.createJumbotron();
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

  /** Create goal posts at each end zone */
  private createGoalPosts(): void {
    const goalMat = new PBRMaterial('goalPostMat', this.scene);
    goalMat.albedoColor = Color3.FromHexString(STADIUM_COLORS.goalPost);
    goalMat.metallic = 0.6;
    goalMat.roughness = 0.2;

    const postHeight = 9;
    const uprightHeight = 8;
    const crossbarHeight = 3;
    const uprightSpacing = 6.5;

    const createPost = (zPos: number, rotationY: number): void => {
      const base = MeshBuilder.CreateCylinder(
        `goalPostBase_${zPos}`,
        { diameter: 0.35, height: postHeight },
        this.scene
      );
      base.material = goalMat;
      base.position = new Vector3(0, postHeight / 2, zPos);
      base.rotation.y = rotationY;

      const crossbar = MeshBuilder.CreateCylinder(
        `goalPostCross_${zPos}`,
        { diameter: 0.25, height: uprightSpacing },
        this.scene
      );
      crossbar.material = goalMat;
      crossbar.position = base.position.clone();
      crossbar.position.y = postHeight + crossbarHeight;
      crossbar.rotation.z = Math.PI / 2;

      const leftUpright = MeshBuilder.CreateCylinder(
        `goalPostLeft_${zPos}`,
        { diameter: 0.25, height: uprightHeight },
        this.scene
      );
      leftUpright.material = goalMat;
      leftUpright.position = base.position.clone();
      leftUpright.position.y = postHeight + crossbarHeight + uprightHeight / 2;
      leftUpright.position.x -= uprightSpacing / 2;

      const rightUpright = leftUpright.clone(`goalPostRight_${zPos}`);
      rightUpright.position.x += uprightSpacing;

      this.fieldMeshes.push(base, crossbar, leftUpright, rightUpright);
    };

    createPost(-FIELD_CONFIG.endZoneDepth + 1.5, Math.PI);
    createPost(FIELD_CONFIG.length + FIELD_CONFIG.endZoneDepth - 1.5, 0);
  }

  /** Create pylons at end zone corners */
  private createPylons(): void {
    const pylonMat = new StandardMaterial('pylonMat', this.scene);
    pylonMat.diffuseColor = Color3.FromHexString(STADIUM_COLORS.pylon);
    pylonMat.emissiveColor = new Color3(0.4, 0.2, 0.1);

    const halfWidth = FIELD_CONFIG.width / 2;
    const cornerZ = [0, FIELD_CONFIG.length];

    cornerZ.forEach((zPos) => {
      [-1, 1].forEach((xSide) => {
        const pylon = MeshBuilder.CreateCylinder(
          `pylon_${zPos}_${xSide}`,
          { diameterTop: 0.1, diameterBottom: 0.2, height: 0.8 },
          this.scene
        );
        pylon.material = pylonMat;
        pylon.position.x = xSide * (halfWidth - 0.4);
        pylon.position.y = 0.4;
        pylon.position.z = zPos;
        this.fieldMeshes.push(pylon);
      });
    });
  }

  /** Create stadium bowl and crowd */
  private createStadiumBowl(): void {
    const totalLength = FIELD_CONFIG.length + FIELD_CONFIG.endZoneDepth * 2;
    const standDepth = 14;
    const standHeight = 14;
    const standOffset = FIELD_CONFIG.width / 2 + 8 + standDepth / 2;

    const standMat = new StandardMaterial('standMat', this.scene);
    standMat.diffuseColor = Color3.FromHexString(STADIUM_COLORS.concrete);
    standMat.emissiveColor = new Color3(0.05, 0.05, 0.06);

    const crowdMat = new StandardMaterial('crowdMat', this.scene);
    const crowdTexture = this.createCrowdTexture('crowdTexture');
    crowdMat.diffuseTexture = crowdTexture;
    crowdMat.emissiveColor = new Color3(0.4, 0.4, 0.5);
    crowdMat.specularColor = Color3.Black();
    crowdMat.backFaceCulling = false;

    const createSideStand = (side: number): void => {
      const stand = MeshBuilder.CreateBox(
        `stand_${side > 0 ? 'right' : 'left'}`,
        { width: standDepth, height: standHeight, depth: totalLength + 6 },
        this.scene
      );
      stand.material = standMat;
      stand.position.x = side * standOffset;
      stand.position.y = standHeight / 2 - 1;
      stand.position.z = FIELD_CONFIG.length / 2;

      const crowdPlane = MeshBuilder.CreatePlane(
        `crowd_${side > 0 ? 'right' : 'left'}`,
        { width: totalLength + 6, height: 8 },
        this.scene
      );
      crowdPlane.material = crowdMat;
      crowdPlane.position.x = side * (FIELD_CONFIG.width / 2 + 8);
      crowdPlane.position.y = 8;
      crowdPlane.position.z = FIELD_CONFIG.length / 2;
      crowdPlane.rotation.y = side > 0 ? -Math.PI / 2 : Math.PI / 2;

      this.fieldMeshes.push(stand, crowdPlane);
    };

    createSideStand(-1);
    createSideStand(1);

    const endZoneStand = MeshBuilder.CreateBox(
      'endZoneStand',
      { width: FIELD_CONFIG.width + 20, height: standHeight, depth: standDepth },
      this.scene
    );
    endZoneStand.material = standMat;
    endZoneStand.position.z = FIELD_CONFIG.length + FIELD_CONFIG.endZoneDepth + standDepth / 2;
    endZoneStand.position.y = standHeight / 2 - 1;
    this.fieldMeshes.push(endZoneStand);

    const ribbon = MeshBuilder.CreateBox(
      'stadiumRibbon',
      { width: FIELD_CONFIG.width + 20, height: 1, depth: totalLength + 6 },
      this.scene
    );
    const ribbonMat = new StandardMaterial('ribbonMat', this.scene);
    ribbonMat.diffuseColor = Color3.FromHexString(STADIUM_COLORS.ribbon);
    ribbonMat.emissiveColor = Color3.FromHexString(STADIUM_COLORS.ribbon);
    ribbon.material = ribbonMat;
    ribbon.position.y = 5;
    ribbon.position.z = FIELD_CONFIG.length / 2;
    this.fieldMeshes.push(ribbon);
  }

  /** Create stadium light towers */
  private createLightTowers(): void {
    const towerMat = new PBRMaterial('towerMat', this.scene);
    towerMat.albedoColor = Color3.FromHexString(STADIUM_COLORS.steel);
    towerMat.metallic = 0.7;
    towerMat.roughness = 0.3;

    const towerHeight = 22;
    const towerPositions = [
      { x: -FIELD_CONFIG.width / 2 - 18, z: -5 },
      { x: FIELD_CONFIG.width / 2 + 18, z: -5 },
      { x: -FIELD_CONFIG.width / 2 - 18, z: FIELD_CONFIG.length + 5 },
      { x: FIELD_CONFIG.width / 2 + 18, z: FIELD_CONFIG.length + 5 },
    ];

    towerPositions.forEach((pos, index) => {
      const tower = MeshBuilder.CreateCylinder(
        `lightTower_${index}`,
        { diameter: 1.2, height: towerHeight },
        this.scene
      );
      tower.material = towerMat;
      tower.position.x = pos.x;
      tower.position.y = towerHeight / 2;
      tower.position.z = pos.z;

      const lightPanel = MeshBuilder.CreateBox(
        `lightPanel_${index}`,
        { width: 4, height: 1, depth: 1.5 },
        this.scene
      );
      const lightMat = new StandardMaterial(`lightPanelMat_${index}`, this.scene);
      lightMat.diffuseColor = Color3.White();
      lightMat.emissiveColor = new Color3(1, 1, 1);
      lightPanel.material = lightMat;
      lightPanel.position.x = pos.x;
      lightPanel.position.y = towerHeight - 1;
      lightPanel.position.z = pos.z;

      this.fieldMeshes.push(tower, lightPanel);
    });
  }

  /** Create the jumbotron scoreboard */
  private createJumbotron(): void {
    const frame = MeshBuilder.CreateBox(
      'jumbotronFrame',
      { width: 30, height: 12, depth: 2 },
      this.scene
    );
    const frameMat = new StandardMaterial('jumbotronFrameMat', this.scene);
    frameMat.diffuseColor = Color3.FromHexString(STADIUM_COLORS.concrete);
    frameMat.emissiveColor = new Color3(0.1, 0.1, 0.1);
    frame.material = frameMat;
    frame.position = new Vector3(0, 12, FIELD_CONFIG.length + FIELD_CONFIG.endZoneDepth + 10);

    this.jumbotronScreen = MeshBuilder.CreatePlane(
      'jumbotronScreen',
      { width: 26, height: 7 },
      this.scene
    );
    this.jumbotronScreen.position = frame.position.clone();
    this.jumbotronScreen.position.z -= 1.1;
    this.jumbotronScreen.position.y += 0.5;
    this.jumbotronScreen.rotation.y = Math.PI;

    this.jumbotronTexture = new DynamicTexture(
      'jumbotronTexture',
      { width: 1024, height: 256 },
      this.scene,
      true
    );

    const screenMat = new StandardMaterial('jumbotronScreenMat', this.scene);
    screenMat.diffuseTexture = this.jumbotronTexture;
    screenMat.emissiveColor = new Color3(0.8, 0.8, 0.9);
    screenMat.specularColor = Color3.Black();
    this.jumbotronScreen.material = screenMat;

    this.fieldMeshes.push(frame, this.jumbotronScreen);
    this.updateJumbotron(0, 0);
  }

  private createCrowdTexture(name: string): DynamicTexture {
    const texture = new DynamicTexture(name, { width: 512, height: 128 }, this.scene, true);
    const ctx = texture.getContext();
    ctx.fillStyle = STADIUM_COLORS.crowdBase;
    ctx.fillRect(0, 0, 512, 128);

    for (let i = 0; i < 1200; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 128;
      const color = Math.random() > 0.5 ? '#FFB703' : '#A8DADC';
      ctx.fillStyle = color;
      ctx.fillRect(x, y, 2, 2);
    }

    texture.update();
    return texture;
  }

  /** Update jumbotron score display */
  public updateJumbotron(homeScore: number, awayScore: number): void {
    if (!this.jumbotronTexture) return;
    const ctx = this.jumbotronTexture.getContext() as CanvasRenderingContext2D;
    ctx.clearRect(0, 0, 1024, 256);

    const gradient = ctx.createLinearGradient(0, 0, 1024, 0);
    gradient.addColorStop(0, this.homeTeam.primaryColor);
    gradient.addColorStop(0.5, '#111827');
    gradient.addColorStop(1, this.awayTeam.primaryColor);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1024, 256);

    ctx.fillStyle = '#0B0F14';
    ctx.fillRect(20, 20, 984, 216);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('BLAZE BLITZ', 512, 70);

    ctx.font = 'bold 60px Arial';
    ctx.fillStyle = this.homeTeam.primaryColor;
    ctx.fillText(this.homeTeam.shortName.toUpperCase(), 240, 160);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(homeScore.toString(), 400, 160);

    ctx.fillStyle = this.awayTeam.primaryColor;
    ctx.fillText(this.awayTeam.shortName.toUpperCase(), 640, 160);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(awayScore.toString(), 800, 160);

    this.jumbotronTexture.update();
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

  /** Dispose all field meshes */
  public dispose(): void {
    this.jumbotronTexture?.dispose();
    this.fieldMeshes.forEach((mesh) => mesh.dispose());
    this.fieldMeshes = [];
  }
}
