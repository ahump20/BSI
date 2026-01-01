'use client';

/**
 * BSI Hero Embers
 *
 * Cinematic floating ember particles with Three.js 3D rendering
 * on capable devices, CSS fallback for mobile/low-end.
 *
 * Colors: Burnt Orange (#BF5700) -> Ember (#FF6B35) -> Gold (#C9A227)
 */

import { useEffect, useState, useRef, useMemo, Suspense } from 'react';
import dynamic from 'next/dynamic';
import type * as THREE from 'three';

// Lazy load Three.js components to reduce bundle size
const Canvas = dynamic(() => import('@react-three/fiber').then((mod) => mod.Canvas), {
  ssr: false,
});

interface HeroEmbersProps {
  className?: string;
  particleCount?: number;
}

type PerformanceTier = 'low' | 'medium' | 'high';

function detectPerformanceTier(): PerformanceTier {
  if (typeof window === 'undefined') return 'low';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) return 'low';

  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );

  const deviceMemory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  const cores = navigator.hardwareConcurrency || 2;

  if (isMobile) {
    if (deviceMemory && deviceMemory < 4) return 'low';
    if (cores < 4) return 'low';
    return 'medium';
  }

  if (deviceMemory && deviceMemory >= 8 && cores >= 8) return 'high';
  if (deviceMemory && deviceMemory >= 4 && cores >= 4) return 'medium';

  return 'medium';
}

export function HeroEmbers({ className = '', particleCount }: HeroEmbersProps) {
  const [tier, setTier] = useState<PerformanceTier>('low');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setTier(detectPerformanceTier());
  }, []);

  // Low tier or SSR: CSS fallback only
  if (!mounted || tier === 'low') {
    return <CSSFallback className={className} reducedMotion={tier === 'low'} />;
  }

  // Medium/High tier: Three.js with CSS fallback during load
  const count = particleCount ?? (tier === 'high' ? 400 : 200);

  return (
    <div className={`absolute inset-0 -z-5 overflow-hidden ${className}`} aria-hidden="true">
      {/* CSS fallback visible while Three.js loads */}
      <CSSFallback className="" reducedMotion={false} />

      {/* Three.js overlay */}
      <Suspense fallback={null}>
        <Canvas
          dpr={tier === 'high' ? Math.min(2, window.devicePixelRatio) : 1}
          gl={{ antialias: tier === 'high', alpha: true, powerPreference: 'default' }}
          style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
          camera={{ position: [0, 0, 8], fov: 60 }}
        >
          <EmberParticles count={count} />
        </Canvas>
      </Suspense>
    </div>
  );
}

/**
 * Three.js Ember Particles with instanced rendering
 */
function EmberParticles({ count = 200 }: { count?: number }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);

  // Import Three.js dynamically
  // eslint-disable-next-line @typescript-eslint/no-var-requires -- dynamic import for SSR
  const THREE = useMemo(() => {
    if (typeof window === 'undefined') return null;
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require('three');
  }, []);

  const particles = useMemo(() => {
    if (!THREE) return null;

    const temp = new THREE.Object3D();
    const positions: THREE.Matrix4[] = [];
    const velocities: THREE.Vector3[] = [];
    const lifetimes: number[] = [];
    const sizes: number[] = [];

    for (let i = 0; i < count; i++) {
      temp.position.set(
        (Math.random() - 0.5) * 12,
        (Math.random() - 0.5) * 8 - 3,
        (Math.random() - 0.5) * 4
      );
      temp.updateMatrix();
      positions.push(temp.matrix.clone());

      velocities.push(
        new THREE.Vector3(
          (Math.random() - 0.5) * 0.3,
          Math.random() * 0.5 + 0.3,
          (Math.random() - 0.5) * 0.2
        )
      );

      lifetimes.push(Math.random() * Math.PI * 2);
      sizes.push(Math.random() * 0.04 + 0.02);
    }

    return { positions, velocities, lifetimes, sizes };
  }, [count, THREE]);

  // Set initial matrices
  useEffect(() => {
    if (!meshRef.current || !particles || !THREE) return;

    particles.positions.forEach((matrix, i) => {
      meshRef.current!.setMatrixAt(i, matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;

    // Set colors
    const colorAttr = new Float32Array(count * 3);
    const colors = [
      [0.75, 0.34, 0], // Burnt Orange
      [1, 0.42, 0.21], // Ember
      [0.79, 0.64, 0.15], // Gold
      [0.55, 0.27, 0.07], // Texas Soil
    ];

    for (let i = 0; i < count; i++) {
      const color = colors[Math.floor(Math.random() * colors.length)];
      colorAttr[i * 3] = color[0];
      colorAttr[i * 3 + 1] = color[1];
      colorAttr[i * 3 + 2] = color[2];
    }

    meshRef.current.geometry.setAttribute(
      'color',
      new THREE.InstancedBufferAttribute(colorAttr, 3)
    );
  }, [particles, count, THREE]);

  // Animation with useFrame from r3f
  // eslint-disable-next-line @typescript-eslint/no-var-requires -- dynamic import for R3F hook
  const { useFrame } = require('@react-three/fiber');

  useFrame((state: { clock: { elapsedTime: number } }, delta: number) => {
    if (!meshRef.current || !particles || !THREE) return;

    const mesh = meshRef.current;
    const temp = new THREE.Object3D();
    const time = state.clock.elapsedTime;

    for (let i = 0; i < count; i++) {
      mesh.getMatrixAt(i, temp.matrix);
      temp.matrix.decompose(temp.position, temp.quaternion, temp.scale);

      temp.position.x += particles.velocities[i].x * delta * 0.4;
      temp.position.y += particles.velocities[i].y * delta * 0.4;
      temp.position.z += particles.velocities[i].z * delta * 0.4;

      temp.position.x += Math.sin(time * 2 + particles.lifetimes[i]) * 0.003;

      const pulse = Math.sin(time * 3 + particles.lifetimes[i]) * 0.3 + 0.7;
      temp.scale.setScalar(particles.sizes[i] * pulse);

      if (temp.position.y > 5) {
        temp.position.y = -4;
        temp.position.x = (Math.random() - 0.5) * 12;
        temp.position.z = (Math.random() - 0.5) * 4;
      }

      temp.updateMatrix();
      mesh.setMatrixAt(i, temp.matrix);
    }

    mesh.instanceMatrix.needsUpdate = true;
  });

  if (!THREE) return null;

  return (
    // eslint-disable-next-line react/no-unknown-property -- R3F props
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]} frustumCulled={false}>
      {/* eslint-disable-next-line react/no-unknown-property -- R3F props */}
      <circleGeometry args={[1, 8]} />
      {/* eslint-disable react/no-unknown-property -- R3F material props */}
      <meshBasicMaterial
        transparent
        opacity={0.6}
        vertexColors
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
      {/* eslint-enable react/no-unknown-property */}
    </instancedMesh>
  );
}

/**
 * CSS-only fallback with rising ember particles
 */
function CSSFallback({
  className,
  reducedMotion,
}: {
  className?: string;
  reducedMotion?: boolean;
}) {
  if (reducedMotion) {
    // Static version for reduced motion preference
    return (
      <div
        className={`absolute inset-0 -z-5 overflow-hidden ${className}`}
        aria-hidden="true"
      >
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-burnt-orange/20 rounded-full blur-[120px]" />
      </div>
    );
  }

  return (
    <div
      className={`absolute inset-0 -z-5 overflow-hidden ${className}`}
      aria-hidden="true"
    >
      {/* Animated gradient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-burnt-orange/20 rounded-full blur-[120px] animate-pulse-slow" />

      {/* Rising ember dots */}
      <div className="ember-container">
        {Array.from({ length: 25 }).map((_, i) => (
          <div
            key={i}
            className="ember-dot"
            style={{
              left: `${10 + Math.random() * 80}%`,
              animationDelay: `${Math.random() * 6}s`,
              animationDuration: `${4 + Math.random() * 4}s`,
              opacity: 0.4 + Math.random() * 0.4,
            }}
          />
        ))}
      </div>

      <style jsx>{`
        .ember-container {
          position: absolute;
          inset: 0;
          overflow: hidden;
          pointer-events: none;
        }

        .ember-dot {
          position: absolute;
          bottom: -20px;
          width: 4px;
          height: 4px;
          background: linear-gradient(135deg, #ff6b35, #bf5700);
          border-radius: 50%;
          animation: ember-rise linear infinite;
          box-shadow:
            0 0 6px #ff6b35,
            0 0 12px rgba(255, 107, 53, 0.5);
        }

        .ember-dot:nth-child(odd) {
          width: 3px;
          height: 3px;
        }

        .ember-dot:nth-child(3n) {
          width: 5px;
          height: 5px;
        }

        @keyframes ember-rise {
          0% {
            transform: translateY(0) translateX(0) scale(1);
            opacity: 0;
          }
          10% {
            opacity: 0.8;
          }
          50% {
            transform: translateY(-50vh) translateX(20px) scale(0.8);
            opacity: 0.6;
          }
          100% {
            transform: translateY(-100vh) translateX(-10px) scale(0.3);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}

export default HeroEmbers;
