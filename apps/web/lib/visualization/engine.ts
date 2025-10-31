// 3D rendering engine for pitch visualization using Babylon.js
import * as BABYLON from '@babylonjs/core';
import '@babylonjs/loaders';

export interface PitchData {
  pitch_id: string;
  velocity: number;
  spin_rate: number;
  pitch_type: string;
  result: string;
  trajectory: number[][];
  spinAxis: { x: number; y: number; z: number };
  approachAngle: number;
  pitcher_name: string;
  batter_name: string;
  plate_x: number;
  plate_z: number;
  break_x: number;
  break_z: number;
}

export interface HeatMapData {
  grid: number[][];
  maxValue: number;
}

export class BlazeVisualizationEngine {
  private engine: BABYLON.Engine;
  private scene: BABYLON.Scene;
  private camera: BABYLON.ArcRotateCamera;
  private baseballField: BABYLON.Mesh | null = null;
  private activePitchMeshes: BABYLON.Mesh[] = [];
  private activeParticleSystems: BABYLON.ParticleSystem[] = [];
  private heatMapCells: BABYLON.Mesh[] = [];

  constructor(canvas: HTMLCanvasElement) {
    // Initialize Babylon.js engine with WebGL2 fallback
    this.engine = new BABYLON.Engine(canvas, true, {
      useHighPrecisionMatrix: true,
      preserveDrawingBuffer: true,
      antialias: true
    });

    this.scene = new BABYLON.Scene(this.engine);
    this.setupCamera();
    this.setupLighting();
    this.buildField();

    // Start render loop
    this.engine.runRenderLoop(() => {
      this.scene.render();
    });

    // Handle window resize
    window.addEventListener('resize', () => {
      this.engine.resize();
    });
  }

  private setupCamera(): void {
    this.camera = new BABYLON.ArcRotateCamera(
      'camera',
      Math.PI / 2,
      Math.PI / 3,
      100,
      new BABYLON.Vector3(0, 0, 0),
      this.scene
    );

    const canvas = this.engine.getRenderingCanvas();
    if (canvas) {
      this.camera.attachControl(canvas, true);
    }

    this.camera.lowerRadiusLimit = 30;
    this.camera.upperRadiusLimit = 200;
    this.camera.wheelPrecision = 50;

    // Mobile touch optimization
    this.camera.pinchPrecision = 100;
    this.camera.panningSensibility = 1000;
  }

  private setupLighting(): void {
    const hemiLight = new BABYLON.HemisphericLight(
      'hemiLight',
      new BABYLON.Vector3(0, 1, 0),
      this.scene
    );
    hemiLight.intensity = 0.7;

    const dirLight = new BABYLON.DirectionalLight(
      'dirLight',
      new BABYLON.Vector3(-1, -2, -1),
      this.scene
    );
    dirLight.position = new BABYLON.Vector3(20, 40, 20);
    dirLight.intensity = 0.5;

    // Stadium lighting effect
    const spotLight1 = new BABYLON.SpotLight(
      'spot1',
      new BABYLON.Vector3(30, 60, 30),
      new BABYLON.Vector3(-1, -1, -1),
      Math.PI / 3,
      2,
      this.scene
    );
    spotLight1.intensity = 0.3;
  }

  private buildField(): void {
    // Create baseball diamond
    const groundMat = new BABYLON.StandardMaterial('groundMat', this.scene);
    groundMat.diffuseColor = new BABYLON.Color3(0.2, 0.5, 0.2);

    const ground = BABYLON.MeshBuilder.CreateGround(
      'ground',
      { width: 300, height: 300 },
      this.scene
    );
    ground.material = groundMat;

    // Infield dirt
    const dirtMat = new BABYLON.StandardMaterial('dirtMat', this.scene);
    dirtMat.diffuseColor = new BABYLON.Color3(0.6, 0.4, 0.2);

    // Create bases
    this.createBase(new BABYLON.Vector3(63.64, 0.2, 63.64), 'first');
    this.createBase(new BABYLON.Vector3(0, 0.2, 90), 'second');
    this.createBase(new BABYLON.Vector3(-63.64, 0.2, 63.64), 'third');
    this.createBase(new BABYLON.Vector3(0, 0.2, 0), 'home');

    // Pitcher's mound
    const moundMat = new BABYLON.StandardMaterial('moundMat', this.scene);
    moundMat.diffuseColor = new BABYLON.Color3(0.5, 0.35, 0.2);

    const mound = BABYLON.MeshBuilder.CreateCylinder(
      'mound',
      { diameter: 18, height: 1 },
      this.scene
    );
    mound.position = new BABYLON.Vector3(0, 0.5, 60.5);
    mound.material = moundMat;

    // Pitcher's rubber
    const rubberMat = new BABYLON.StandardMaterial('rubberMat', this.scene);
    rubberMat.diffuseColor = new BABYLON.Color3(0.9, 0.9, 0.9);

    const rubber = BABYLON.MeshBuilder.CreateBox(
      'rubber',
      { width: 2, height: 0.5, depth: 0.5 },
      this.scene
    );
    rubber.position = new BABYLON.Vector3(0, 1.25, 60.5);
    rubber.material = rubberMat;

    this.baseballField = ground;
  }

  private createBase(position: BABYLON.Vector3, name: string): void {
    const baseMat = new BABYLON.StandardMaterial(`${name}Mat`, this.scene);
    baseMat.diffuseColor = new BABYLON.Color3(0.95, 0.95, 0.95);

    const base = BABYLON.MeshBuilder.CreateBox(
      name,
      { width: 1.5, height: 0.3, depth: 1.5 },
      this.scene
    );
    base.position = position;
    base.material = baseMat;
  }

  public clearPitchVisualization(): void {
    // Dispose of all pitch meshes
    this.activePitchMeshes.forEach(mesh => mesh.dispose());
    this.activePitchMeshes = [];

    // Stop and dispose of all particle systems
    this.activeParticleSystems.forEach(ps => {
      ps.stop();
      ps.dispose();
    });
    this.activeParticleSystems = [];
  }

  public renderPitchTrajectory(pitchData: PitchData): void {
    // Clear previous pitch visualization
    this.clearPitchVisualization();

    // Create tube mesh for pitch path
    const path = pitchData.trajectory.map(p =>
      new BABYLON.Vector3(p[0], p[2], p[1])
    );

    const pitchMat = new BABYLON.StandardMaterial('pitchMat', this.scene);
    pitchMat.diffuseColor = this.getPitchColor(pitchData.pitch_type);
    pitchMat.emissiveColor = pitchMat.diffuseColor.scale(0.3);

    const tube = BABYLON.MeshBuilder.CreateTube(
      `pitch_${pitchData.pitch_id}`,
      {
        path: path,
        radius: 0.3,
        cap: BABYLON.Mesh.CAP_ALL
      },
      this.scene
    );
    tube.material = pitchMat;
    this.activePitchMeshes.push(tube);

    // Spin visualization using particle system
    const spinParticles = new BABYLON.ParticleSystem(
      `spin_${pitchData.pitch_id}`,
      2000,
      this.scene
    );

    // Use a simple white texture
    spinParticles.particleTexture = new BABYLON.Texture(
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
      this.scene
    );

    spinParticles.emitter = tube;
    spinParticles.minEmitBox = new BABYLON.Vector3(-0.1, -0.1, -0.1);
    spinParticles.maxEmitBox = new BABYLON.Vector3(0.1, 0.1, 0.1);

    spinParticles.color1 = new BABYLON.Color4(1, 0.8, 0.2, 1);
    spinParticles.color2 = new BABYLON.Color4(1, 0.5, 0.1, 1);
    spinParticles.colorDead = new BABYLON.Color4(0, 0, 0, 0);

    spinParticles.minSize = 0.05;
    spinParticles.maxSize = 0.15;

    spinParticles.minLifeTime = 0.1;
    spinParticles.maxLifeTime = 0.3;

    spinParticles.emitRate = pitchData.spin_rate / 10;

    spinParticles.start();
    this.activeParticleSystems.push(spinParticles);

    // Animate pitch movement
    this.animatePitch(path, 0.6);
  }

  private getPitchColor(pitchType: string): BABYLON.Color3 {
    const colors: Record<string, BABYLON.Color3> = {
      'FF': new BABYLON.Color3(1, 0.2, 0.2), // Fastball - red
      'SI': new BABYLON.Color3(1, 0.5, 0.2), // Sinker - orange
      'SL': new BABYLON.Color3(1, 1, 0.2), // Slider - yellow
      'CU': new BABYLON.Color3(0.2, 0.5, 1), // Curveball - blue
      'CH': new BABYLON.Color3(0.5, 1, 0.5), // Changeup - green
      'FC': new BABYLON.Color3(1, 0.5, 0.8), // Cutter - pink
      'KN': new BABYLON.Color3(0.7, 0.3, 0.9), // Knuckleball - purple
    };

    return colors[pitchType] || new BABYLON.Color3(0.8, 0.8, 0.8);
  }

  private animatePitch(path: BABYLON.Vector3[], duration: number): void {
    const baseball = BABYLON.MeshBuilder.CreateSphere(
      'baseball',
      { diameter: 0.75 },
      this.scene
    );

    const ballMat = new BABYLON.StandardMaterial('ballMat', this.scene);
    ballMat.diffuseColor = new BABYLON.Color3(0.95, 0.95, 0.95);
    baseball.material = ballMat;

    this.activePitchMeshes.push(baseball);

    const animation = new BABYLON.Animation(
      'pitchAnimation',
      'position',
      60,
      BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
      BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
    );

    const keys = path.map((point, i) => ({
      frame: (i / path.length) * 60,
      value: point
    }));

    animation.setKeys(keys);
    baseball.animations.push(animation);

    this.scene.beginAnimation(baseball, 0, 60, false, 1 / duration);
  }

  public clearHeatMap(): void {
    this.heatMapCells.forEach(cell => cell.dispose());
    this.heatMapCells = [];
  }

  public renderHeatMap(heatMapData: HeatMapData): void {
    // Clear previous heat map
    this.clearHeatMap();

    const { grid, maxValue } = heatMapData;
    const cellSize = 6;

    grid.forEach((row: number[], y: number) => {
      row.forEach((value: number, x: number) => {
        if (value > 0) {
          const intensity = value / maxValue;

          const heatMat = new BABYLON.StandardMaterial(
            `heat_${x}_${y}`,
            this.scene
          );

          // Color gradient: blue (cold) -> yellow -> red (hot)
          if (intensity < 0.5) {
            heatMat.diffuseColor = new BABYLON.Color3(
              0,
              intensity * 2,
              1 - (intensity * 2)
            );
          } else {
            heatMat.diffuseColor = new BABYLON.Color3(
              (intensity - 0.5) * 2,
              1 - ((intensity - 0.5) * 2),
              0
            );
          }

          heatMat.alpha = 0.3 + (intensity * 0.5);
          heatMat.backFaceCulling = false;

          const cell = BABYLON.MeshBuilder.CreatePlane(
            `cell_${x}_${y}`,
            { width: cellSize, height: cellSize },
            this.scene
          );

          cell.position = new BABYLON.Vector3(
            (x * cellSize) - 150,
            0.2 + (intensity * 3),
            (y * cellSize) - 150
          );
          cell.rotation.x = Math.PI / 2;
          cell.material = heatMat;

          this.heatMapCells.push(cell);
        }
      });
    });
  }

  public createStrikeZone(batterHeight: number = 72): void {
    const zoneHeight = batterHeight * 0.44; // MLB rulebook
    const zoneWidth = 17; // inches

    const zoneMat = new BABYLON.StandardMaterial('zoneMat', this.scene);
    zoneMat.diffuseColor = new BABYLON.Color3(0.2, 0.8, 0.2);
    zoneMat.alpha = 0.2;
    zoneMat.wireframe = true;

    const zone = BABYLON.MeshBuilder.CreatePlane(
      'strikeZone',
      { width: zoneWidth, height: zoneHeight },
      this.scene
    );

    zone.position = new BABYLON.Vector3(0, (zoneHeight / 2) + 18, 0);
    zone.material = zoneMat;
  }

  public resetCamera(): void {
    this.camera.alpha = Math.PI / 2;
    this.camera.beta = Math.PI / 3;
    this.camera.radius = 100;
  }

  public dispose(): void {
    this.clearPitchVisualization();
    this.clearHeatMap();
    this.scene.dispose();
    this.engine.dispose();
  }
}
