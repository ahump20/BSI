'use client';

/**
 * Performance Sphere 3D Visualization
 *
 * Real-time 3D performance metrics visualization with:
 * - Rotating sphere showing team performance
 * - Momentum rings
 * - Particle ambient fields
 * - Color-coded performance indicators
 */

import React, { useEffect, useRef } from 'react';
import { Engine } from '@babylonjs/core/Engines/engine';
import { Scene } from '@babylonjs/core/scene';
import { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import { Vector3, Color3, Color4 } from '@babylonjs/core/Maths/math';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { GlowLayer } from '@babylonjs/core/Layers/glowLayer';
import { ParticleSystem } from '@babylonjs/core/Particles/particleSystem';

interface PerformanceSphere3DProps {
  performance: number; // 0-1
  momentum: number; // -1 to 1
  teamColor?: string; // Hex color
  autoRotate?: boolean;
}

const PerformanceSphere3D: React.FC<PerformanceSphere3DProps> = ({
  performance,
  momentum,
  teamColor = '#3b82f6',
  autoRotate = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const engine = new Engine(canvas, true);
    const scene = new Scene(engine);

    scene.clearColor = new Color4(0, 0, 0, 0); // Transparent

    // Camera
    const camera = new ArcRotateCamera(
      'camera',
      Math.PI / 4,
      Math.PI / 3,
      5,
      Vector3.Zero(),
      scene
    );
    camera.attachControl(canvas, true);

    if (autoRotate) {
      camera.useAutoRotationBehavior = true;
      if (camera.autoRotationBehavior) {
        camera.autoRotationBehavior.idleRotationSpeed = 0.3;
      }
    }

    // Lighting
    const light = new HemisphericLight('light', new Vector3(0, 1, 0), scene);
    light.intensity = 0.7;

    // Glow layer
    const glow = new GlowLayer('glow', scene);
    glow.intensity = 1.5;

    // Performance sphere
    const sphere = MeshBuilder.CreateSphere('sphere', { diameter: 1.5 }, scene);

    const sphereMaterial = new StandardMaterial('sphereMaterial', scene);

    // Color based on performance
    const performanceColor = getPerformanceColor(performance);
    sphereMaterial.diffuseColor = performanceColor;
    sphereMaterial.emissiveColor = performanceColor.scale(0.5);
    sphereMaterial.alpha = 0.8;
    sphere.material = sphereMaterial;

    // Momentum rings
    const ringCount = 3;
    for (let i = 0; i < ringCount; i++) {
      const ring = MeshBuilder.CreateTorus(`ring-${i}`, {
        diameter: 2 + i * 0.5,
        thickness: 0.02,
        tessellation: 64,
      }, scene);

      ring.rotation.x = Math.PI / 2;

      const ringMaterial = new StandardMaterial(`ringMaterial-${i}`, scene);
      const momentumColor = getMomentumColor(momentum);
      ringMaterial.emissiveColor = momentumColor;
      ringMaterial.alpha = 0.3 - i * 0.08;
      ring.material = ringMaterial;

      // Animate rings
      const speed = 0.5 + i * 0.2;
      scene.registerBeforeRender(() => {
        ring.rotation.y += 0.01 * speed;
      });
    }

    // Particle system
    const particleSystem = new ParticleSystem('particles', 500, scene);
    particleSystem.particleTexture = null;

    particleSystem.emitter = Vector3.Zero();
    particleSystem.minEmitBox = new Vector3(-2, -2, -2);
    particleSystem.maxEmitBox = new Vector3(2, 2, 2);

    particleSystem.color1 = new Color4(...hexToRgb(teamColor), 0.5);
    particleSystem.color2 = new Color4(...hexToRgb(teamColor), 0.3);
    particleSystem.colorDead = new Color4(0, 0, 0, 0);

    particleSystem.minSize = 0.02;
    particleSystem.maxSize = 0.05;

    particleSystem.minLifeTime = 2;
    particleSystem.maxLifeTime = 4;

    particleSystem.emitRate = 100;

    particleSystem.direction1 = new Vector3(-0.5, -0.5, -0.5);
    particleSystem.direction2 = new Vector3(0.5, 0.5, 0.5);

    particleSystem.minEmitPower = 0.1;
    particleSystem.maxEmitPower = 0.3;

    particleSystem.start();

    // Render loop
    engine.runRenderLoop(() => {
      scene.render();
    });

    // Resize handler
    const handleResize = () => {
      engine.resize();
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      scene.dispose();
      engine.dispose();
    };
  }, [performance, momentum, teamColor, autoRotate]);

  return <canvas ref={canvasRef} className="w-full h-full" />;
};

/**
 * Get color based on performance (0-1)
 */
function getPerformanceColor(performance: number): Color3 {
  if (performance > 0.7) {
    return new Color3(0.2, 1.0, 0.2); // Green
  } else if (performance > 0.4) {
    return new Color3(1.0, 0.8, 0.2); // Yellow
  } else {
    return new Color3(1.0, 0.2, 0.2); // Red
  }
}

/**
 * Get color based on momentum (-1 to 1)
 */
function getMomentumColor(momentum: number): Color3 {
  if (momentum > 0) {
    return new Color3(0.2, 1.0, 0.2); // Green (positive momentum)
  } else if (momentum < 0) {
    return new Color3(1.0, 0.2, 0.2); // Red (negative momentum)
  } else {
    return new Color3(0.5, 0.5, 0.5); // Gray (neutral)
  }
}

/**
 * Convert hex color to RGB array
 */
function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return [0.5, 0.5, 0.5];

  return [
    parseInt(result[1], 16) / 255,
    parseInt(result[2], 16) / 255,
    parseInt(result[3], 16) / 255,
  ];
}

export default PerformanceSphere3D;
