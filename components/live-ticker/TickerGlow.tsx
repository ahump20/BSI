'use client';
/* eslint-disable react/no-unknown-property */

/**
 * BSI Ticker Glow Effect
 *
 * Three.js visual effect that pulses when breaking news arrives.
 * Designed to integrate with hero headers and add visual urgency.
 */

import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Mesh, ShaderMaterial, Color } from 'three';

interface TickerGlowProps {
  /** Whether breaking news is active */
  isBreaking?: boolean;
  /** Glow color (defaults to ember orange) */
  color?: string;
  /** Intensity multiplier */
  intensity?: number;
  /** Position offset */
  position?: [number, number, number];
}

// Custom shader for smooth glow effect
const glowVertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const glowFragmentShader = `
  uniform vec3 uColor;
  uniform float uIntensity;
  uniform float uTime;
  uniform float uBreaking;
  varying vec2 vUv;

  void main() {
    // Distance from center
    vec2 center = vec2(0.5);
    float dist = distance(vUv, center);

    // Create smooth falloff
    float alpha = smoothstep(0.5, 0.0, dist);

    // Pulsing effect for breaking news
    float pulse = uBreaking > 0.5
      ? 0.7 + 0.3 * sin(uTime * 4.0)
      : 0.8;

    // Apply intensity and pulse
    alpha *= uIntensity * pulse;

    gl_FragColor = vec4(uColor, alpha * 0.6);
  }
`;

export function TickerGlow({
  isBreaking = false,
  color = '#FF6B35',
  intensity = 1.0,
  position = [0, 0, 0],
}: TickerGlowProps) {
  const meshRef = useRef<Mesh>(null);
  const materialRef = useRef<ShaderMaterial>(null);
  const targetIntensity = useRef(0);

  // Animate intensity changes
  useEffect(() => {
    targetIntensity.current = isBreaking ? intensity * 1.5 : intensity * 0.5;
  }, [isBreaking, intensity]);

  // Animation loop
  useFrame((state) => {
    if (!materialRef.current) return;

    // Update time uniform
    materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;

    // Smooth intensity transition
    const currentIntensity = materialRef.current.uniforms.uIntensity.value;
    materialRef.current.uniforms.uIntensity.value +=
      (targetIntensity.current - currentIntensity) * 0.05;

    // Update breaking state
    materialRef.current.uniforms.uBreaking.value = isBreaking ? 1.0 : 0.0;
  });

  return (
    <mesh ref={meshRef} position={position}>
      <planeGeometry args={[4, 1]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={glowVertexShader}
        fragmentShader={glowFragmentShader}
        transparent
        depthWrite={false}
        uniforms={{
          uColor: { value: new Color(color) },
          uIntensity: { value: 0 },
          uTime: { value: 0 },
          uBreaking: { value: 0 },
        }}
      />
    </mesh>
  );
}

export default TickerGlow;
