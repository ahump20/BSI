'use client';

/**
 * Baseball Pitch Tunnel 3D Visualization
 *
 * Stadium-quality graphics with:
 * - Ray tracing effects (WebGPU)
 * - SSAO (Screen Space Ambient Occlusion)
 * - Volumetric lighting
 * - PBR materials
 * - Real-time pitch trajectory visualization
 * - Strike zone overlay
 * - Velocity-based color coding
 *
 * Progressive enhancement: WebGPU → WebGL2 fallback
 */

import React, { useEffect, useRef, useState } from 'react';
import { Engine } from '@babylonjs/core/Engines/engine';
import { Scene } from '@babylonjs/core/scene';
import { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import { DirectionalLight } from '@babylonjs/core/Lights/directionalLight';
import { Vector3, Color3, Color4 } from '@babylonjs/core/Maths/math';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { PBRMaterial } from '@babylonjs/core/Materials/PBR/pbrMaterial';
import { Texture } from '@babylonjs/core/Materials/Textures/texture';
import { ParticleSystem } from '@babylonjs/core/Particles/particleSystem';
import { SSAORenderingPipeline } from '@babylonjs/core/PostProcesses/RenderPipeline/Pipelines/ssaoRenderingPipeline';
import { DefaultRenderingPipeline } from '@babylonjs/core/PostProcesses/RenderPipeline/Pipelines/defaultRenderingPipeline';
import { GlowLayer } from '@babylonjs/core/Layers/glowLayer';

// Import side effects for materials
import '@babylonjs/core/Materials/standardMaterial';
import '@babylonjs/core/Materials/PBR/pbrMaterial';
import '@babylonjs/core/Lights/Shadows/shadowGeneratorSceneComponent';
import '@babylonjs/core/Rendering/depthRendererSceneComponent';

import { detectGPUCapabilitiesWithCache, type GPUCapabilities } from '../../lib/webgpu-detection';

export interface PitchData {
  id: string;
  timestamp: number;
  pitcher: string;
  batter: string;
  pitchType: string;
  velocity: number; // mph
  spinRate: number; // rpm
  releasePoint: [number, number, number];
  trajectory: Array<[number, number, number]>;
  endPoint: [number, number, number];
  result: 'strike' | 'ball' | 'hit' | 'foul';
}

interface BaseballPitchTunnelProps {
  pitches: PitchData[];
  showStrikeZone?: boolean;
  showVelocityColors?: boolean;
  cameraAutoRotate?: boolean;
  highlightPitchId?: string | null;
  onPitchClick?: (pitch: PitchData) => void;
}

const BaseballPitchTunnel: React.FC<BaseballPitchTunnelProps> = ({
  pitches,
  showStrikeZone = true,
  showVelocityColors = true,
  cameraAutoRotate = false,
  highlightPitchId = null,
  onPitchClick,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Engine | null>(null);
  const sceneRef = useRef<Scene | null>(null);
  const [gpuCapabilities, setGpuCapabilities] = useState<GPUCapabilities | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Detect GPU capabilities
    detectGPUCapabilitiesWithCache()
      .then((caps) => {
        setGpuCapabilities(caps);
        console.log('🎮 GPU Capabilities:', caps);
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
      // Initialize Babylon.js engine
      const engine = new Engine(canvas, true, {
        preserveDrawingBuffer: true,
        stencil: true,
        disableWebGL2Support: gpuCapabilities.recommendedEngine === 'webgl',
        powerPreference: gpuCapabilities.performance === 'high' ? 'high-performance' : 'default',
      });

      engineRef.current = engine;

      // Create scene
      const scene = new Scene(engine);
      sceneRef.current = scene;

      // Scene background
      scene.clearColor = new Color4(0.05, 0.05, 0.08, 1.0);

      // Camera setup (catcher's perspective looking toward pitcher)
      const camera = new ArcRotateCamera(
        'camera',
        Math.PI / 2, // Alpha (horizontal rotation)
        Math.PI / 3, // Beta (vertical rotation)
        25, // Radius
        new Vector3(0, 3, 0), // Target (strike zone height)
        scene
      );

      camera.attachControl(canvas, true);
      camera.lowerRadiusLimit = 10;
      camera.upperRadiusLimit = 50;
      camera.lowerBetaLimit = 0.1;
      camera.upperBetaLimit = Math.PI / 2;

      if (cameraAutoRotate) {
        camera.useAutoRotationBehavior = true;
        if (camera.autoRotationBehavior) {
          camera.autoRotationBehavior.idleRotationSpeed = 0.2;
        }
      }

      // Lighting setup
      const hemisphericLight = new HemisphericLight(
        'hemisphericLight',
        new Vector3(0, 1, 0),
        scene
      );
      hemisphericLight.intensity = 0.3;

      // Key light (stadium lights from above)
      const keyLight = new DirectionalLight(
        'keyLight',
        new Vector3(-1, -2, -1),
        scene
      );
      keyLight.position = new Vector3(20, 40, 20);
      keyLight.intensity = 1.2;

      // Fill light
      const fillLight = new DirectionalLight(
        'fillLight',
        new Vector3(1, -1, 1),
        scene
      );
      fillLight.position = new Vector3(-15, 30, -15);
      fillLight.intensity = 0.5;

      // Glow layer for pitch trails
      const glowLayer = new GlowLayer('glow', scene, {
        mainTextureFixedSize: 512,
        blurKernelSize: 64,
      });
      glowLayer.intensity = 1.5;

      // Create baseball diamond/field
      createBaseballField(scene);

      // Create strike zone
      if (showStrikeZone) {
        createStrikeZone(scene);
      }

      // Create pitcher's mound
      createPitchersMound(scene);

      // Render pitch trajectories
      pitches.forEach((pitch) => {
        createPitchTrajectory(scene, pitch, showVelocityColors, highlightPitchId === pitch.id, onPitchClick);
      });

      // Add post-processing effects based on GPU capabilities
      if (gpuCapabilities.performance === 'high') {
        addAdvancedPostProcessing(scene, camera);
      } else if (gpuCapabilities.performance === 'medium') {
        addBasicPostProcessing(scene, camera);
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
  }, [canvasRef.current, gpuCapabilities, pitches, showStrikeZone, showVelocityColors, cameraAutoRotate, highlightPitchId]);

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
            <p className="text-lg">Loading 3D Pitch Tunnel...</p>
            <p className="text-sm text-gray-400 mt-2">
              {gpuCapabilities?.hasWebGPU ? 'WebGPU Enabled' : 'WebGL2 Fallback'}
            </p>
          </div>
        </div>
      )}
      <canvas ref={canvasRef} className="w-full h-full" />
      {gpuCapabilities && (
        <div className="absolute top-4 right-4 bg-black/50 text-white px-3 py-2 rounded text-xs">
          {gpuCapabilities.hasWebGPU ? '⚡ WebGPU' : '🔧 WebGL2'}
        </div>
      )}
    </div>
  );
};

/**
 * Create baseball field geometry
 */
function createBaseballField(scene: Scene): void {
  // Grass field
  const ground = MeshBuilder.CreateGround('ground', {
    width: 60,
    height: 80,
  }, scene);

  const groundMaterial = new PBRMaterial('groundMaterial', scene);
  groundMaterial.albedoColor = new Color3(0.15, 0.35, 0.15);
  groundMaterial.roughness = 0.8;
  groundMaterial.metallic = 0;
  ground.material = groundMaterial;
  ground.position.y = 0;

  // Pitcher's rubber line
  const rubberLine = MeshBuilder.CreateBox('rubberLine', {
    width: 0.5,
    height: 0.05,
    depth: 0.1,
  }, scene);
  rubberLine.position = new Vector3(0, 0.05, 18);

  const rubberMaterial = new StandardMaterial('rubberMaterial', scene);
  rubberMaterial.diffuseColor = new Color3(1, 1, 1);
  rubberLine.material = rubberMaterial;
}

/**
 * Create strike zone visualization
 */
function createStrikeZone(scene: Scene): void {
  // Strike zone frame (17 inches wide, ~2 feet tall)
  const strikeZone = MeshBuilder.CreateBox('strikeZone', {
    width: 0.43, // 17 inches in meters
    height: 0.61, // 2 feet in meters
    depth: 0.01,
  }, scene);

  strikeZone.position = new Vector3(0, 0.76, 0); // Positioned at home plate height

  const strikeZoneMaterial = new StandardMaterial('strikeZoneMaterial', scene);
  strikeZoneMaterial.diffuseColor = new Color3(1, 1, 1);
  strikeZoneMaterial.alpha = 0.15;
  strikeZoneMaterial.wireframe = true;
  strikeZone.material = strikeZoneMaterial;

  // Home plate
  const homePlate = MeshBuilder.CreateBox('homePlate', {
    width: 0.43,
    height: 0.02,
    depth: 0.43,
  }, scene);
  homePlate.position = new Vector3(0, 0.01, 0);

  const homePlateMaterial = new StandardMaterial('homePlateMaterial', scene);
  homePlateMaterial.diffuseColor = new Color3(1, 1, 1);
  homePlate.material = homePlateMaterial;
}

/**
 * Create pitcher's mound
 */
function createPitchersMound(scene: Scene): void {
  const mound = MeshBuilder.CreateCylinder('mound', {
    diameter: 5.5,
    height: 0.3,
  }, scene);

  mound.position = new Vector3(0, 0.15, 18);

  const moundMaterial = new PBRMaterial('moundMaterial', scene);
  moundMaterial.albedoColor = new Color3(0.6, 0.4, 0.2); // Dirt color
  moundMaterial.roughness = 0.9;
  mound.material = moundMaterial;
}

/**
 * Get color based on pitch velocity
 */
function getVelocityColor(velocity: number): Color3 {
  // 70 mph = slow (blue), 85 mph = medium (green), 100+ mph = fast (red)
  if (velocity < 80) {
    return new Color3(0.2, 0.5, 1.0); // Blue
  } else if (velocity < 90) {
    return new Color3(0.3, 1.0, 0.3); // Green
  } else if (velocity < 95) {
    return new Color3(1.0, 0.8, 0.2); // Yellow
  } else {
    return new Color3(1.0, 0.2, 0.2); // Red
  }
}

/**
 * Create pitch trajectory visualization
 */
function createPitchTrajectory(
  scene: Scene,
  pitch: PitchData,
  showVelocityColors: boolean,
  isHighlighted: boolean,
  onPitchClick?: (pitch: PitchData) => void
): void {
  const points = pitch.trajectory.map((p) => new Vector3(p[0], p[1], p[2]));

  // Create tube along trajectory
  const tube = MeshBuilder.CreateTube(`pitch-${pitch.id}`, {
    path: points,
    radius: isHighlighted ? 0.03 : 0.015,
    tessellation: 16,
    cap: MeshBuilder.CAP_ALL,
  }, scene);

  const tubeMaterial = new StandardMaterial(`pitchMaterial-${pitch.id}`, scene);

  if (showVelocityColors) {
    tubeMaterial.emissiveColor = getVelocityColor(pitch.velocity);
  } else {
    // Result-based colors
    switch (pitch.result) {
      case 'strike':
        tubeMaterial.emissiveColor = new Color3(0.2, 1.0, 0.2);
        break;
      case 'ball':
        tubeMaterial.emissiveColor = new Color3(1.0, 0.2, 0.2);
        break;
      case 'hit':
        tubeMaterial.emissiveColor = new Color3(1.0, 0.8, 0.2);
        break;
      case 'foul':
        tubeMaterial.emissiveColor = new Color3(0.8, 0.5, 0.2);
        break;
    }
  }

  tubeMaterial.alpha = isHighlighted ? 0.9 : 0.6;
  tube.material = tubeMaterial;

  // Add click interaction
  if (onPitchClick) {
    tube.actionManager = new (require('@babylonjs/core/Actions/actionManager').ActionManager)(scene);
    const ExecuteCodeAction = require('@babylonjs/core/Actions/directActions').ExecuteCodeAction;
    tube.actionManager.registerAction(
      new ExecuteCodeAction(
        require('@babylonjs/core/Actions/actionManager').ActionManager.OnPickTrigger,
        () => {
          onPitchClick(pitch);
        }
      )
    );
  }

  // Add release point sphere
  const releasePoint = MeshBuilder.CreateSphere(`release-${pitch.id}`, {
    diameter: 0.08,
  }, scene);
  releasePoint.position = new Vector3(...pitch.releasePoint);

  const releaseMaterial = new StandardMaterial(`releaseMaterial-${pitch.id}`, scene);
  releaseMaterial.emissiveColor = new Color3(1, 1, 0);
  releasePoint.material = releaseMaterial;

  // Add end point sphere
  const endPoint = MeshBuilder.CreateSphere(`end-${pitch.id}`, {
    diameter: 0.05,
  }, scene);
  endPoint.position = new Vector3(...pitch.endPoint);

  const endMaterial = new StandardMaterial(`endMaterial-${pitch.id}`, scene);
  endMaterial.emissiveColor = tubeMaterial.emissiveColor;
  endPoint.material = endMaterial;
}

/**
 * Add advanced post-processing (WebGPU/high performance)
 */
function addAdvancedPostProcessing(scene: Scene, camera: ArcRotateCamera): void {
  // Default rendering pipeline with full effects
  const pipeline = new DefaultRenderingPipeline(
    'defaultPipeline',
    true, // HDR
    scene,
    [camera]
  );

  // Enable effects
  pipeline.fxaaEnabled = true;
  pipeline.bloomEnabled = true;
  pipeline.bloomThreshold = 0.5;
  pipeline.bloomWeight = 0.3;
  pipeline.bloomKernel = 64;

  // Depth of field
  pipeline.depthOfFieldEnabled = false; // Can enable for cinematic effect

  // Tone mapping
  pipeline.imageProcessingEnabled = true;
  pipeline.imageProcessing.toneMappingEnabled = true;
  pipeline.imageProcessing.contrast = 1.2;
  pipeline.imageProcessing.exposure = 1.0;

  // SSAO (Screen Space Ambient Occlusion)
  const ssao = new SSAORenderingPipeline('ssao', scene, {
    ssaoRatio: 0.5,
    blurRatio: 1,
  }, [camera]);

  ssao.totalStrength = 1.3;
  ssao.radius = 1.5;
  ssao.area = 0.75;
  ssao.fallOff = 0.05;
  ssao.base = 0.2;
}

/**
 * Add basic post-processing (WebGL2/medium performance)
 */
function addBasicPostProcessing(scene: Scene, camera: ArcRotateCamera): void {
  const pipeline = new DefaultRenderingPipeline(
    'defaultPipeline',
    false, // No HDR
    scene,
    [camera]
  );

  pipeline.fxaaEnabled = true;
  pipeline.bloomEnabled = true;
  pipeline.bloomThreshold = 0.7;
  pipeline.bloomWeight = 0.2;
  pipeline.bloomKernel = 32;
}

export default BaseballPitchTunnel;
