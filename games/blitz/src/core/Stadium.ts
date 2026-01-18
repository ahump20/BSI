/**
 * Blaze Blitz Football - Stadium Environment
 *
 * Creates an immersive stadium atmosphere with:
 * - Stadium lights with dynamic glow
 * - Crowd stands with animated noise
 * - Skybox for outdoor feel
 * - Fog and atmosphere effects
 * - Goal posts with collision
 */

import {
  Scene,
  MeshBuilder,
  StandardMaterial,
  PBRMaterial,
  Color3,
  Color4,
  Mesh,
  Vector3,
  PointLight,
  SpotLight,
  GlowLayer,
  ParticleSystem,
  Texture,
  CubeTexture,
  Animation,
} from '@babylonjs/core';
import { FIELD_CONFIG } from './Field';

/** Stadium configuration */
export const STADIUM_CONFIG = {
  // Stands
  standsHeight: 15,
  standsDepth: 20,
  standsOffset: 5, // Distance from sideline

  // Lights
  lightPoleHeight: 25,
  lightIntensity: 1.2,
  lightCount: 8, // Per side

  // Goal posts
  goalPostHeight: 10,
  crossbarHeight: 3,
  crossbarWidth: 5.6, // 18.5 feet in yards

  // Atmosphere
  fogDensity: 0.002,
  ambientLight: 0.3,
} as const;

/** Stadium colors */
const STADIUM_COLORS = {
  stands: '#2a2a2a',
  standsSeat: '#333344',
  lightPole: '#555555',
  lightGlow: '#ffffcc',
  goalPost: '#ffff00',
  crowd: '#1a1a22',
} as const;

export class Stadium {
  private scene: Scene;
  private meshes: Mesh[] = [];
  private lights: (PointLight | SpotLight)[] = [];
  private crowdParticles: ParticleSystem[] = [];

  constructor(scene: Scene) {
    this.scene = scene;
  }

  /** Build complete stadium */
  public build(): void {
    this.createSkybox();
    this.createStands();
    this.createStadiumLights();
    this.createGoalPosts();
    this.createAtmosphere();
    this.createCrowdEffect();
  }

  /** Create skybox for outdoor feel */
  private createSkybox(): void {
    // Simple gradient sky using hemisphere
    this.scene.clearColor = new Color4(0.05, 0.05, 0.15, 1); // Night sky

    // Add subtle fog
    this.scene.fogMode = Scene.FOGMODE_EXP2;
    this.scene.fogDensity = STADIUM_CONFIG.fogDensity;
    this.scene.fogColor = new Color3(0.1, 0.1, 0.15);
  }

  /** Create crowd stands on both sides */
  private createStands(): void {
    const totalLength = FIELD_CONFIG.length + FIELD_CONFIG.endZoneDepth * 2;
    const standsMat = new PBRMaterial('standsMat', this.scene);
    standsMat.albedoColor = Color3.FromHexString(STADIUM_COLORS.stands);
    standsMat.roughness = 0.9;
    standsMat.metallic = 0.1;

    // Seat rows material
    const seatMat = new PBRMaterial('seatMat', this.scene);
    seatMat.albedoColor = Color3.FromHexString(STADIUM_COLORS.standsSeat);
    seatMat.roughness = 0.8;
    seatMat.metallic = 0;

    [-1, 1].forEach((side) => {
      // Main stands structure (angled)
      const stands = MeshBuilder.CreateBox(
        `stands_${side > 0 ? 'right' : 'left'}`,
        {
          width: STADIUM_CONFIG.standsDepth,
          height: STADIUM_CONFIG.standsHeight,
          depth: totalLength,
        },
        this.scene
      );

      stands.material = standsMat;
      stands.position.x =
        side *
        (FIELD_CONFIG.width / 2 + STADIUM_CONFIG.standsOffset + STADIUM_CONFIG.standsDepth / 2);
      stands.position.y = STADIUM_CONFIG.standsHeight / 2 - 2;
      stands.position.z = FIELD_CONFIG.length / 2;
      stands.rotation.z = side * -0.3; // Angled for stadium look

      this.meshes.push(stands);

      // Add seat rows (horizontal stripes)
      for (let row = 0; row < 5; row++) {
        const seatRow = MeshBuilder.CreateBox(
          `seatRow_${side}_${row}`,
          {
            width: STADIUM_CONFIG.standsDepth,
            height: 0.5,
            depth: totalLength,
          },
          this.scene
        );

        seatRow.material = seatMat;
        seatRow.position.x =
          side *
          (FIELD_CONFIG.width / 2 + STADIUM_CONFIG.standsOffset + STADIUM_CONFIG.standsDepth / 2);
        seatRow.position.y = row * 3 + 1;
        seatRow.position.z = FIELD_CONFIG.length / 2;
        seatRow.rotation.z = side * -0.3;

        this.meshes.push(seatRow);
      }
    });

    // End zone stands
    [-1, 1].forEach((endSide) => {
      const endStands = MeshBuilder.CreateBox(
        `endStands_${endSide > 0 ? 'away' : 'home'}`,
        {
          width: FIELD_CONFIG.width * 0.6,
          height: STADIUM_CONFIG.standsHeight * 0.7,
          depth: STADIUM_CONFIG.standsDepth * 0.8,
        },
        this.scene
      );

      endStands.material = standsMat;
      endStands.position.x = 0;
      endStands.position.y = (STADIUM_CONFIG.standsHeight * 0.7) / 2 - 2;
      endStands.position.z =
        endSide > 0
          ? FIELD_CONFIG.length + FIELD_CONFIG.endZoneDepth + STADIUM_CONFIG.standsDepth / 2
          : -FIELD_CONFIG.endZoneDepth - STADIUM_CONFIG.standsDepth / 2;
      endStands.rotation.x = endSide * 0.2;

      this.meshes.push(endStands);
    });
  }

  /** Create stadium lights */
  private createStadiumLights(): void {
    const lightPoleMat = new StandardMaterial('lightPoleMat', this.scene);
    lightPoleMat.diffuseColor = Color3.FromHexString(STADIUM_COLORS.lightPole);

    const lightHousingMat = new StandardMaterial('lightHousingMat', this.scene);
    lightHousingMat.diffuseColor = Color3.White();
    lightHousingMat.emissiveColor = Color3.FromHexString(STADIUM_COLORS.lightGlow);

    // Add glow layer for lights
    const glowLayer = new GlowLayer('stadiumGlow', this.scene);
    glowLayer.intensity = 0.8;

    const totalLength = FIELD_CONFIG.length + FIELD_CONFIG.endZoneDepth * 2;
    const lightSpacing = totalLength / (STADIUM_CONFIG.lightCount + 1);

    [-1, 1].forEach((side) => {
      for (let i = 1; i <= STADIUM_CONFIG.lightCount; i++) {
        const zPos = -FIELD_CONFIG.endZoneDepth + i * lightSpacing;
        const xPos = side * (FIELD_CONFIG.width / 2 + STADIUM_CONFIG.standsOffset + 8);

        // Light pole
        const pole = MeshBuilder.CreateCylinder(
          `lightPole_${side}_${i}`,
          {
            height: STADIUM_CONFIG.lightPoleHeight,
            diameter: 0.5,
          },
          this.scene
        );

        pole.material = lightPoleMat;
        pole.position.set(xPos, STADIUM_CONFIG.lightPoleHeight / 2, zPos);
        this.meshes.push(pole);

        // Light housing
        const housing = MeshBuilder.CreateBox(
          `lightHousing_${side}_${i}`,
          {
            width: 3,
            height: 1,
            depth: 2,
          },
          this.scene
        );

        housing.material = lightHousingMat;
        housing.position.set(xPos - side * 1.5, STADIUM_CONFIG.lightPoleHeight, zPos);
        housing.rotation.z = side * 0.3;
        this.meshes.push(housing);

        // Spotlight
        const light = new SpotLight(
          `stadiumLight_${side}_${i}`,
          new Vector3(xPos - side * 1.5, STADIUM_CONFIG.lightPoleHeight, zPos),
          new Vector3(side * 0.5, -1, 0).normalize(),
          Math.PI / 3,
          2,
          this.scene
        );

        light.intensity = STADIUM_CONFIG.lightIntensity;
        light.diffuse = Color3.FromHexString(STADIUM_COLORS.lightGlow);
        this.lights.push(light);
      }
    });
  }

  /** Create goal posts */
  private createGoalPosts(): void {
    const goalPostMat = new StandardMaterial('goalPostMat', this.scene);
    goalPostMat.diffuseColor = Color3.FromHexString(STADIUM_COLORS.goalPost);
    goalPostMat.emissiveColor = Color3.FromHexString(STADIUM_COLORS.goalPost).scale(0.3);

    [0, FIELD_CONFIG.length].forEach((zBase) => {
      const zOffset = zBase === 0 ? -2 : 2;

      // Uprights
      [-STADIUM_CONFIG.crossbarWidth / 2, STADIUM_CONFIG.crossbarWidth / 2].forEach((xOffset) => {
        const upright = MeshBuilder.CreateCylinder(
          `goalUpright_${zBase}_${xOffset}`,
          {
            height: STADIUM_CONFIG.goalPostHeight,
            diameter: 0.15,
          },
          this.scene
        );

        upright.material = goalPostMat;
        upright.position.set(
          xOffset,
          STADIUM_CONFIG.crossbarHeight + STADIUM_CONFIG.goalPostHeight / 2,
          zBase + zOffset
        );

        this.meshes.push(upright);
      });

      // Crossbar
      const crossbar = MeshBuilder.CreateCylinder(
        `goalCrossbar_${zBase}`,
        {
          height: STADIUM_CONFIG.crossbarWidth,
          diameter: 0.15,
        },
        this.scene
      );

      crossbar.material = goalPostMat;
      crossbar.rotation.z = Math.PI / 2;
      crossbar.position.set(0, STADIUM_CONFIG.crossbarHeight, zBase + zOffset);
      this.meshes.push(crossbar);

      // Support post
      const support = MeshBuilder.CreateCylinder(
        `goalSupport_${zBase}`,
        {
          height: STADIUM_CONFIG.crossbarHeight,
          diameter: 0.2,
        },
        this.scene
      );

      support.material = goalPostMat;
      support.position.set(0, STADIUM_CONFIG.crossbarHeight / 2, zBase + zOffset);
      this.meshes.push(support);
    });
  }

  /** Create atmospheric effects */
  private createAtmosphere(): void {
    // Add slight camera grain/noise effect via post-processing
    // This would be done in the main engine with DefaultRenderingPipeline

    // Add ambient particles (dust/atmosphere)
    const dustParticles = new ParticleSystem('atmosphereDust', 100, this.scene);

    // Use built-in particle texture
    dustParticles.particleTexture = new Texture(
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAAGklEQVQYV2NkYGD4z4AEGBkZGRkZcAkQkwQAMkgBAfNBgJwAAAAASUVORK5CYII=',
      this.scene
    );

    dustParticles.emitter = new Vector3(0, 10, FIELD_CONFIG.length / 2);
    dustParticles.minEmitBox = new Vector3(-40, 0, -60);
    dustParticles.maxEmitBox = new Vector3(40, 20, 60);

    dustParticles.color1 = new Color4(1, 1, 1, 0.1);
    dustParticles.color2 = new Color4(1, 1, 0.8, 0.05);
    dustParticles.colorDead = new Color4(1, 1, 1, 0);

    dustParticles.minSize = 0.05;
    dustParticles.maxSize = 0.2;

    dustParticles.minLifeTime = 2;
    dustParticles.maxLifeTime = 5;

    dustParticles.emitRate = 30;

    dustParticles.direction1 = new Vector3(-0.5, -0.1, -0.5);
    dustParticles.direction2 = new Vector3(0.5, 0.1, 0.5);

    dustParticles.minEmitPower = 0.2;
    dustParticles.maxEmitPower = 0.5;

    dustParticles.start();
    this.crowdParticles.push(dustParticles);
  }

  /** Create animated crowd effect */
  private createCrowdEffect(): void {
    // Crowd noise particle system (simulates moving crowd)
    const totalLength = FIELD_CONFIG.length + FIELD_CONFIG.endZoneDepth * 2;

    [-1, 1].forEach((side) => {
      const crowdParticles = new ParticleSystem(
        `crowd_${side > 0 ? 'right' : 'left'}`,
        200,
        this.scene
      );

      // Small dots for crowd movement
      crowdParticles.particleTexture = new Texture(
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAEklEQVQIW2NkYGD4D8QMIAwGABqYAQGXMFz5AAAAAElFTkSuQmCC',
        this.scene
      );

      const xPos = side * (FIELD_CONFIG.width / 2 + STADIUM_CONFIG.standsOffset + 10);
      crowdParticles.emitter = new Vector3(xPos, 5, FIELD_CONFIG.length / 2);
      crowdParticles.minEmitBox = new Vector3(-5, -3, -totalLength / 2);
      crowdParticles.maxEmitBox = new Vector3(5, 8, totalLength / 2);

      // Team-ish colors
      crowdParticles.color1 = new Color4(0.8, 0.4, 0.1, 0.6);
      crowdParticles.color2 = new Color4(0.9, 0.6, 0.2, 0.4);
      crowdParticles.colorDead = new Color4(0.5, 0.3, 0.1, 0);

      crowdParticles.minSize = 0.3;
      crowdParticles.maxSize = 0.6;

      crowdParticles.minLifeTime = 0.5;
      crowdParticles.maxLifeTime = 1.5;

      crowdParticles.emitRate = 100;

      crowdParticles.direction1 = new Vector3(-0.2, 0.5, -0.2);
      crowdParticles.direction2 = new Vector3(0.2, 1, 0.2);

      crowdParticles.minEmitPower = 0.5;
      crowdParticles.maxEmitPower = 1;

      crowdParticles.gravity = new Vector3(0, -2, 0);

      crowdParticles.start();
      this.crowdParticles.push(crowdParticles);
    });
  }

  /** Trigger crowd cheer effect (for big plays) */
  public triggerCrowdCheer(): void {
    // Boost crowd particles temporarily
    this.crowdParticles.forEach((ps) => {
      const originalRate = ps.emitRate;
      ps.emitRate = originalRate * 3;
      ps.minEmitPower *= 2;
      ps.maxEmitPower *= 2;

      setTimeout(() => {
        ps.emitRate = originalRate;
        ps.minEmitPower /= 2;
        ps.maxEmitPower /= 2;
      }, 2000);
    });
  }

  /** Trigger touchdown celebration */
  public triggerTouchdownCelebration(position: Vector3): void {
    // Create firework-like particle burst
    const celebration = new ParticleSystem('tdCelebration', 500, this.scene);

    celebration.particleTexture = new Texture(
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAAGklEQVQYV2NkYGD4z4AEGBkZGRkZcAkQkwQAMkgBAfNBgJwAAAAASUVORK5CYII=',
      this.scene
    );

    celebration.emitter = position.add(new Vector3(0, 5, 0));

    celebration.color1 = new Color4(1, 0.8, 0, 1);
    celebration.color2 = new Color4(1, 0.4, 0, 1);
    celebration.colorDead = new Color4(1, 0, 0, 0);

    celebration.minSize = 0.2;
    celebration.maxSize = 0.8;

    celebration.minLifeTime = 1;
    celebration.maxLifeTime = 3;

    celebration.emitRate = 500;

    celebration.createSphereEmitter(2);

    celebration.minEmitPower = 5;
    celebration.maxEmitPower = 15;

    celebration.gravity = new Vector3(0, -5, 0);

    celebration.targetStopDuration = 0.5;
    celebration.disposeOnStop = true;

    celebration.start();

    // Also boost crowd
    this.triggerCrowdCheer();
  }

  /** Dispose all stadium elements */
  public dispose(): void {
    this.meshes.forEach((mesh) => mesh.dispose());
    this.lights.forEach((light) => light.dispose());
    this.crowdParticles.forEach((ps) => ps.dispose());
    this.meshes = [];
    this.lights = [];
    this.crowdParticles = [];
  }
}
