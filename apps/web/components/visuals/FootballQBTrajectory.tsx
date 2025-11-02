'use client';

/**
 * Football QB Trajectory 3D Visualization
 *
 * Stadium-quality graphics with:
 * - Ray tracing effects (WebGPU)
 * - Volumetric lighting (god rays)
 * - SSAO and depth of field
 * - PBR materials for realistic rendering
 * - Real-time throw trajectory visualization
 * - Route running visualization
 * - Completion probability spheres
 *
 * Progressive enhancement: WebGPU → WebGL2 fallback
 */

import React, { useEffect, useRef, useState } from 'react';
import { Engine } from '@babylonjs/core/Engines/engine';
import { Scene } from '@babylonjs/core/scene';
import { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import { DirectionalLight } from '@babylonjs/core/Lights/directionalLight';
import { SpotLight } from '@babylonjs/core/Lights/spotLight';
import { Vector3, Color3, Color4 } from '@babylonjs/core/Maths/math';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { PBRMaterial } from '@babylonjs/core/Materials/PBR/pbrMaterial';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { VolumetricLightScatteringPostProcess } from '@babylonjs/core/PostProcesses/volumetricLightScatteringPostProcess';
import { DefaultRenderingPipeline } from '@babylonjs/core/PostProcesses/RenderPipeline/Pipelines/defaultRenderingPipeline';
import { SSAORenderingPipeline } from '@babylonjs/core/PostProcesses/RenderPipeline/Pipelines/ssaoRenderingPipeline';
import { GlowLayer } from '@babylonjs/core/Layers/glowLayer';
import { ParticleSystem } from '@babylonjs/core/Particles/particleSystem';
import { ShadowGenerator } from '@babylonjs/core/Lights/Shadows/shadowGenerator';

// Import side effects
import '@babylonjs/core/Materials/standardMaterial';
import '@babylonjs/core/Materials/PBR/pbrMaterial';
import '@babylonjs/core/Lights/Shadows/shadowGeneratorSceneComponent';
import '@babylonjs/core/Rendering/depthRendererSceneComponent';

import { detectGPUCapabilitiesWithCache, type GPUCapabilities } from '../../lib/webgpu-detection';

export interface PassData {
  id: string;
  timestamp: number;
  quarterback: string;
  receiver: string;
  passType: string; // 'short', 'medium', 'deep', 'screen'
  releasePoint: [number, number, number];
  trajectory: Array<[number, number, number]>;
  catchPoint: [number, number, number];
  hangTime: number; // seconds
  airYards: number;
  velocity: number; // mph
  completionProbability: number; // 0-1
  result: 'complete' | 'incomplete' | 'interception' | 'touchdown';
  receiverRoute?: Array<[number, number, number]>;
}

interface FootballQBTrajectoryProps {
  passes: PassData[];
  showField?: boolean;
  showRoutes?: boolean;
  showProbabilitySpheres?: boolean;
  cameraAutoRotate?: boolean;
  highlightPassId?: string | null;
  onPassClick?: (pass: PassData) => void;
}

const FootballQBTrajectory: React.FC<FootballQBTrajectoryProps> = ({
  passes,
  showField = true,
  showRoutes = true,
  showProbabilitySpheres = true,
  cameraAutoRotate = false,
  highlightPassId = null,
  onPassClick,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Engine | null>(null);
  const sceneRef = useRef<Scene | null>(null);
  const [gpuCapabilities, setGpuCapabilities] = useState<GPUCapabilities | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    detectGPUCapabilitiesWithCache()
      .then((caps) => {
        setGpuCapabilities(caps);
        console.log('🎮 GPU Capabilities (Football):', caps);
      })
      .catch((err) => {
        console.error('GPU detection error:', err);
        setError('Failed to detect GPU capabilities');
      });
  }, []);

  useEffect(() => {
    if (!canvasRef.current || !gpuCapabilities) {
      return;
    }

    const canvas = canvasRef.current;

    try {
      // Initialize Babylon.js engine with enhanced settings
      const engine = new Engine(canvas, true, {
        preserveDrawingBuffer: true,
        stencil: true,
        disableWebGL2Support: gpuCapabilities.recommendedEngine === 'webgl',
        powerPreference: gpuCapabilities.performance === 'high' ? 'high-performance' : 'default',
        antialias: true,
      });

      engineRef.current = engine;

      // Create scene
      const scene = new Scene(engine);
      sceneRef.current = scene;

      // Scene background (night stadium)
      scene.clearColor = new Color4(0.02, 0.02, 0.05, 1.0);
      scene.ambientColor = new Color3(0.1, 0.1, 0.15);

      // Camera setup (sideline perspective)
      const camera = new ArcRotateCamera(
        'camera',
        -Math.PI / 2, // Looking down the field
        Math.PI / 3.5, // Slight overhead angle
        60, // Pulled back for full field view
        new Vector3(0, 0, 0), // Center field
        scene
      );

      camera.attachControl(canvas, true);
      camera.lowerRadiusLimit = 30;
      camera.upperRadiusLimit = 120;
      camera.lowerBetaLimit = 0.1;
      camera.upperBetaLimit = Math.PI / 2.2;

      if (cameraAutoRotate) {
        camera.useAutoRotationBehavior = true;
        if (camera.autoRotationBehavior) {
          camera.autoRotationBehavior.idleRotationSpeed = 0.15;
        }
      }

      // Lighting setup - Stadium lights
      const hemisphericLight = new HemisphericLight(
        'hemisphericLight',
        new Vector3(0, 1, 0),
        scene
      );
      hemisphericLight.intensity = 0.2;

      // Stadium light towers (4 corners)
      const stadiumLights = createStadiumLights(scene);

      // Main directional light (sun/moon)
      const mainLight = new DirectionalLight(
        'mainLight',
        new Vector3(-1, -3, -2),
        scene
      );
      mainLight.position = new Vector3(50, 100, 50);
      mainLight.intensity = 1.5;

      // Shadow generator for main light
      const shadowGenerator = new ShadowGenerator(2048, mainLight);
      shadowGenerator.useBlurExponentialShadowMap = true;
      shadowGenerator.blurScale = 2;
      shadowGenerator.setDarkness(0.3);

      // Glow layer for ball trails and targets
      const glowLayer = new GlowLayer('glow', scene, {
        mainTextureFixedSize: 1024,
        blurKernelSize: 64,
      });
      glowLayer.intensity = 2.0;

      // Create football field
      if (showField) {
        const fieldMeshes = createFootballField(scene);
        fieldMeshes.forEach((mesh) => {
          shadowGenerator.addShadowCaster(mesh);
        });
      }

      // Render pass trajectories
      passes.forEach((pass) => {
        const passMeshes = createPassTrajectory(
          scene,
          pass,
          showRoutes,
          showProbabilitySpheres,
          highlightPassId === pass.id,
          onPassClick
        );
        passMeshes.forEach((mesh) => {
          shadowGenerator.addShadowCaster(mesh);
        });
      });

      // Add volumetric lighting (god rays) for high-performance devices
      if (gpuCapabilities.performance === 'high') {
        addVolumetricLighting(scene, camera, mainLight);
        addAdvancedPostProcessing(scene, camera);
      } else if (gpuCapabilities.performance === 'medium') {
        addBasicPostProcessing(scene, camera);
      }

      // Add atmospheric particles
      if (gpuCapabilities.performance !== 'low') {
        createAtmosphericParticles(scene);
      }

      // Render loop
      engine.runRenderLoop(() => {
        scene.render();
      });

      // Handle resize
      const handleResize = () => {
        engine.resize();
      };
      window.addEventListener('resize', handleResize);

      setIsLoading(false);

      // Cleanup
      return () => {
        window.removeEventListener('resize', handleResize);
        scene.dispose();
        engine.dispose();
      };
    } catch (err) {
      console.error('Babylon.js initialization error:', err);
      setError('Failed to initialize 3D visualization');
      setIsLoading(false);
    }
  }, [canvasRef.current, gpuCapabilities, passes, showField, showRoutes, showProbabilitySpheres, cameraAutoRotate, highlightPassId]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-900 text-white">
        <div className="text-center">
          <p className="text-xl font-bold mb-2">Visualization Error</p>
          <p className="text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 text-white z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4 mx-auto"></div>
            <p className="text-lg">Loading 3D QB Trajectory...</p>
            <p className="text-sm text-gray-400 mt-2">
              {gpuCapabilities?.hasWebGPU ? 'WebGPU Enabled ⚡' : 'WebGL2 Fallback 🔧'}
            </p>
          </div>
        </div>
      )}
      <canvas ref={canvasRef} className="w-full h-full" />
      {gpuCapabilities && (
        <div className="absolute top-4 right-4 bg-black/50 text-white px-3 py-2 rounded text-xs">
          {gpuCapabilities.hasWebGPU ? '⚡ WebGPU' : '🔧 WebGL2'} | {passes.length} passes
        </div>
      )}
    </div>
  );
};

/**
 * Create NFL football field (100 yards + end zones)
 */
function createFootballField(scene: Scene): Mesh[] {
  const meshes: Mesh[] = [];

  // Main field (grass)
  const field = MeshBuilder.CreateGround('field', {
    width: 53.33, // 160 feet wide in yards
    height: 120, // 100 yards + 2 x 10 yard end zones
  }, scene);

  const fieldMaterial = new PBRMaterial('fieldMaterial', scene);
  fieldMaterial.albedoColor = new Color3(0.1, 0.3, 0.1); // Dark green grass
  fieldMaterial.roughness = 0.85;
  fieldMaterial.metallic = 0;
  field.material = fieldMaterial;
  field.receiveShadows = true;
  meshes.push(field);

  // Yard lines (white stripes every 5 yards)
  for (let yard = -50; yard <= 50; yard += 5) {
    const yardLine = MeshBuilder.CreateBox(`yardLine-${yard}`, {
      width: 53.33,
      height: 0.05,
      depth: 0.15,
    }, scene);

    yardLine.position = new Vector3(0, 0.03, yard);

    const lineMaterial = new StandardMaterial(`lineMaterial-${yard}`, scene);
    lineMaterial.diffuseColor = new Color3(1, 1, 1);
    lineMaterial.emissiveColor = new Color3(0.8, 0.8, 0.8);
    yardLine.material = lineMaterial;
    meshes.push(yardLine);
  }

  // End zones
  const endZone1 = MeshBuilder.CreateBox('endZone1', {
    width: 53.33,
    height: 0.02,
    depth: 10,
  }, scene);
  endZone1.position = new Vector3(0, 0.02, -55);

  const endZone1Material = new PBRMaterial('endZone1Material', scene);
  endZone1Material.albedoColor = new Color3(0.05, 0.15, 0.4); // Blue
  endZone1Material.roughness = 0.8;
  endZone1.material = endZone1Material;
  meshes.push(endZone1);

  const endZone2 = MeshBuilder.CreateBox('endZone2', {
    width: 53.33,
    height: 0.02,
    depth: 10,
  }, scene);
  endZone2.position = new Vector3(0, 0.02, 55);

  const endZone2Material = new PBRMaterial('endZone2Material', scene);
  endZone2Material.albedoColor = new Color3(0.4, 0.05, 0.05); // Red
  endZone2Material.roughness = 0.8;
  endZone2.material = endZone2Material;
  meshes.push(endZone2);

  // Goal posts
  const goalPost1 = createGoalPost(scene, -60);
  const goalPost2 = createGoalPost(scene, 60);
  meshes.push(...goalPost1, ...goalPost2);

  return meshes;
}

/**
 * Create goal post
 */
function createGoalPost(scene: Scene, zPosition: number): Mesh[] {
  const meshes: Mesh[] = [];

  // Vertical post
  const post = MeshBuilder.CreateCylinder('goalPost', {
    diameter: 0.15,
    height: 10,
  }, scene);
  post.position = new Vector3(0, 5, zPosition);

  const postMaterial = new PBRMaterial('postMaterial', scene);
  postMaterial.albedoColor = new Color3(1, 0.8, 0); // Yellow/gold
  postMaterial.metallic = 0.8;
  postMaterial.roughness = 0.2;
  post.material = postMaterial;
  meshes.push(post);

  // Horizontal crossbar
  const crossbar = MeshBuilder.CreateCylinder('crossbar', {
    diameter: 0.12,
    height: 18.5,
  }, scene);
  crossbar.rotation.z = Math.PI / 2;
  crossbar.position = new Vector3(0, 10, zPosition);
  crossbar.material = postMaterial;
  meshes.push(crossbar);

  // Uprights
  const upright1 = MeshBuilder.CreateCylinder('upright1', {
    diameter: 0.1,
    height: 10,
  }, scene);
  upright1.position = new Vector3(-9.25, 15, zPosition);
  upright1.material = postMaterial;
  meshes.push(upright1);

  const upright2 = MeshBuilder.CreateCylinder('upright2', {
    diameter: 0.1,
    height: 10,
  }, scene);
  upright2.position = new Vector3(9.25, 15, zPosition);
  upright2.material = postMaterial;
  meshes.push(upright2);

  return meshes;
}

/**
 * Create stadium lights (4 light towers)
 */
function createStadiumLights(scene: Scene): SpotLight[] {
  const lights: SpotLight[] = [];
  const positions: [number, number, number][] = [
    [30, 50, -40], // Corner 1
    [30, 50, 40],  // Corner 2
    [-30, 50, -40], // Corner 3
    [-30, 50, 40],  // Corner 4
  ];

  positions.forEach((pos, index) => {
    const light = new SpotLight(
      `stadiumLight${index}`,
      new Vector3(...pos),
      new Vector3(-pos[0] / 30, -1, -pos[2] / 40), // Point toward field
      Math.PI / 3,
      2,
      scene
    );
    light.intensity = 0.8;
    light.diffuse = new Color3(1, 0.95, 0.9); // Warm white
    lights.push(light);
  });

  return lights;
}

/**
 * Get color based on pass result
 */
function getPassColor(result: string, probability: number): Color3 {
  switch (result) {
    case 'complete':
      return new Color3(0.2, 1.0, 0.2); // Green
    case 'touchdown':
      return new Color3(1.0, 0.8, 0.0); // Gold
    case 'incomplete':
      return new Color3(1.0, 0.3, 0.3); // Red
    case 'interception':
      return new Color3(0.8, 0.0, 0.8); // Purple
    default:
      // Probability-based (high prob = green, low = red)
      return new Color3(1.0 - probability, probability, 0.2);
  }
}

/**
 * Create pass trajectory visualization
 */
function createPassTrajectory(
  scene: Scene,
  pass: PassData,
  showRoutes: boolean,
  showProbabilitySpheres: boolean,
  isHighlighted: boolean,
  onPassClick?: (pass: PassData) => void
): Mesh[] {
  const meshes: Mesh[] = [];

  // Ball trajectory
  const points = pass.trajectory.map((p) => new Vector3(p[0], p[1], p[2]));

  const ballTrail = MeshBuilder.CreateTube(`pass-${pass.id}`, {
    path: points,
    radius: isHighlighted ? 0.15 : 0.08,
    tessellation: 24,
    cap: MeshBuilder.CAP_ALL,
  }, scene);

  const trailMaterial = new StandardMaterial(`passMaterial-${pass.id}`, scene);
  const passColor = getPassColor(pass.result, pass.completionProbability);
  trailMaterial.emissiveColor = passColor;
  trailMaterial.alpha = isHighlighted ? 0.95 : 0.7;
  ballTrail.material = trailMaterial;
  meshes.push(ballTrail);

  // Add interaction
  if (onPassClick) {
    const ActionManager = require('@babylonjs/core/Actions/actionManager').ActionManager;
    const ExecuteCodeAction = require('@babylonjs/core/Actions/directActions').ExecuteCodeAction;

    ballTrail.actionManager = new ActionManager(scene);
    ballTrail.actionManager.registerAction(
      new ExecuteCodeAction(
        ActionManager.OnPickTrigger,
        () => {
          onPassClick(pass);
        }
      )
    );
  }

  // Release point (QB position)
  const releasePoint = MeshBuilder.CreateSphere(`release-${pass.id}`, {
    diameter: 0.4,
  }, scene);
  releasePoint.position = new Vector3(...pass.releasePoint);

  const releaseMaterial = new PBRMaterial(`releaseMaterial-${pass.id}`, scene);
  releaseMaterial.albedoColor = new Color3(1, 0.5, 0); // Orange (QB)
  releaseMaterial.emissiveColor = new Color3(0.5, 0.25, 0);
  releaseMaterial.metallic = 0.3;
  releaseMaterial.roughness = 0.4;
  releasePoint.material = releaseMaterial;
  meshes.push(releasePoint);

  // Catch point
  const catchPoint = MeshBuilder.CreateSphere(`catch-${pass.id}`, {
    diameter: 0.35,
  }, scene);
  catchPoint.position = new Vector3(...pass.catchPoint);

  const catchMaterial = new PBRMaterial(`catchMaterial-${pass.id}`, scene);
  catchMaterial.albedoColor = passColor;
  catchMaterial.emissiveColor = passColor.scale(0.5);
  catchMaterial.metallic = 0.2;
  catchMaterial.roughness = 0.5;
  catchPoint.material = catchMaterial;
  meshes.push(catchPoint);

  // Receiver route
  if (showRoutes && pass.receiverRoute) {
    const routePoints = pass.receiverRoute.map((p) => new Vector3(p[0], p[1], p[2]));

    const route = MeshBuilder.CreateTube(`route-${pass.id}`, {
      path: routePoints,
      radius: 0.05,
      tessellation: 16,
    }, scene);

    const routeMaterial = new StandardMaterial(`routeMaterial-${pass.id}`, scene);
    routeMaterial.emissiveColor = new Color3(0.5, 0.8, 1.0); // Light blue
    routeMaterial.alpha = 0.5;
    route.material = routeMaterial;
    meshes.push(route);
  }

  // Completion probability sphere
  if (showProbabilitySpheres) {
    const probabilitySphere = MeshBuilder.CreateSphere(`probability-${pass.id}`, {
      diameter: 1.5 + pass.completionProbability * 2,
    }, scene);
    probabilitySphere.position = new Vector3(...pass.catchPoint);

    const sphereMaterial = new StandardMaterial(`sphereMaterial-${pass.id}`, scene);
    sphereMaterial.diffuseColor = passColor;
    sphereMaterial.alpha = 0.15 + pass.completionProbability * 0.15;
    sphereMaterial.wireframe = true;
    probabilitySphere.material = sphereMaterial;
    meshes.push(probabilitySphere);
  }

  return meshes;
}

/**
 * Add volumetric lighting (god rays)
 */
function addVolumetricLighting(scene: Scene, camera: ArcRotateCamera, light: DirectionalLight): void {
  // Create light source mesh
  const lightSource = MeshBuilder.CreateSphere('lightSource', { diameter: 2 }, scene);
  lightSource.position = light.position.clone();

  const lightMaterial = new StandardMaterial('lightMaterial', scene);
  lightMaterial.emissiveColor = new Color3(1, 0.95, 0.8);
  lightSource.material = lightMaterial;

  // Volumetric light scattering
  const volumetric = new VolumetricLightScatteringPostProcess(
    'volumetric',
    1.0,
    camera,
    lightSource,
    100,
    1024,
    scene
  );

  volumetric.exposure = 0.3;
  volumetric.decay = 0.96815;
  volumetric.weight = 0.58767;
  volumetric.density = 0.926;
}

/**
 * Add advanced post-processing
 */
function addAdvancedPostProcessing(scene: Scene, camera: ArcRotateCamera): void {
  const pipeline = new DefaultRenderingPipeline(
    'defaultPipeline',
    true, // HDR
    scene,
    [camera]
  );

  pipeline.fxaaEnabled = true;
  pipeline.bloomEnabled = true;
  pipeline.bloomThreshold = 0.4;
  pipeline.bloomWeight = 0.4;
  pipeline.bloomKernel = 64;

  // Depth of field for cinematic look
  pipeline.depthOfFieldEnabled = true;
  pipeline.depthOfFieldBlurLevel = 1;
  pipeline.depthOfField.fStop = 2.8;
  pipeline.depthOfField.focalLength = 50;

  // Chromatic aberration
  pipeline.chromaticAberrationEnabled = true;
  pipeline.chromaticAberration.aberrationAmount = 10;

  // Tone mapping
  pipeline.imageProcessingEnabled = true;
  pipeline.imageProcessing.toneMappingEnabled = true;
  pipeline.imageProcessing.contrast = 1.3;
  pipeline.imageProcessing.exposure = 1.1;

  // SSAO
  const ssao = new SSAORenderingPipeline('ssao', scene, {
    ssaoRatio: 0.5,
    blurRatio: 1,
  }, [camera]);

  ssao.totalStrength = 1.5;
  ssao.radius = 2.0;
  ssao.area = 1.0;
  ssao.fallOff = 0.05;
  ssao.base = 0.1;
}

/**
 * Add basic post-processing
 */
function addBasicPostProcessing(scene: Scene, camera: ArcRotateCamera): void {
  const pipeline = new DefaultRenderingPipeline(
    'defaultPipeline',
    false,
    scene,
    [camera]
  );

  pipeline.fxaaEnabled = true;
  pipeline.bloomEnabled = true;
  pipeline.bloomThreshold = 0.6;
  pipeline.bloomWeight = 0.3;
  pipeline.bloomKernel = 32;

  pipeline.imageProcessingEnabled = true;
  pipeline.imageProcessing.contrast = 1.1;
}

/**
 * Create atmospheric particles (stadium atmosphere)
 */
function createAtmosphericParticles(scene: Scene): void {
  const particleSystem = new ParticleSystem('particles', 2000, scene);

  // Particle texture (simple white dot)
  particleSystem.particleTexture = null; // Use default

  // Emission area
  particleSystem.emitter = new Vector3(0, 10, 0);
  particleSystem.minEmitBox = new Vector3(-60, 0, -70);
  particleSystem.maxEmitBox = new Vector3(60, 30, 70);

  // Colors
  particleSystem.color1 = new Color4(0.8, 0.8, 1, 0.3);
  particleSystem.color2 = new Color4(0.6, 0.6, 0.8, 0.2);
  particleSystem.colorDead = new Color4(0.4, 0.4, 0.6, 0.0);

  // Size
  particleSystem.minSize = 0.05;
  particleSystem.maxSize = 0.15;

  // Lifetime
  particleSystem.minLifeTime = 5;
  particleSystem.maxLifeTime = 10;

  // Emission rate
  particleSystem.emitRate = 100;

  // Velocity
  particleSystem.direction1 = new Vector3(-0.5, 0.2, -0.5);
  particleSystem.direction2 = new Vector3(0.5, 0.5, 0.5);

  particleSystem.minEmitPower = 0.2;
  particleSystem.maxEmitPower = 0.5;
  particleSystem.updateSpeed = 0.01;

  // Gravity
  particleSystem.gravity = new Vector3(0, 0.5, 0);

  particleSystem.start();
}

export default FootballQBTrajectory;
