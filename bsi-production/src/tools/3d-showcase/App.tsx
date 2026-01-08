/**
 * 3D Showcase App
 * Interactive demonstration of BSI's 3D visualization components
 */

import React, { useState, Suspense, useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import {
  OrbitControls,
  Stars,
  Float,
  Text,
  Environment,
  MeshDistortMaterial,
  Sparkles,
  Center,
} from '@react-three/drei';
import * as THREE from 'three';

// ============================================================================
// BSI Brand Colors
// ============================================================================
const BSI_COLORS = {
  burntOrange: '#BF5700',
  texasSoil: '#8B4513',
  ember: '#FF6B35',
  gold: '#C9A227',
  charcoal: '#1A1A1A',
  midnight: '#0D0D0D',
  cream: '#FAF8F5',
};

// ============================================================================
// 3D Components
// ============================================================================

/** Animated BSI Logo Orb */
function BSIOrb() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.elapsedTime * 0.3;
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.5;
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
      <mesh ref={meshRef}>
        <icosahedronGeometry args={[1.5, 4]} />
        <MeshDistortMaterial
          color={BSI_COLORS.ember}
          attach="material"
          distort={0.4}
          speed={2}
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>
      <Sparkles
        count={100}
        scale={4}
        size={2}
        speed={0.3}
        color={BSI_COLORS.gold}
      />
    </Float>
  );
}

/** Animated Score Pillars */
function ScorePillars() {
  const pillarsRef = useRef<THREE.Group>(null);
  const scores = [85, 92, 78, 95, 88, 91];

  useFrame((state) => {
    if (pillarsRef.current) {
      pillarsRef.current.rotation.y = state.clock.elapsedTime * 0.1;
    }
  });

  return (
    <group ref={pillarsRef} position={[0, -1, 0]}>
      {scores.map((score, i) => {
        const angle = (i / scores.length) * Math.PI * 2;
        const radius = 3;
        const height = (score / 100) * 2;
        return (
          <Float key={i} speed={1 + i * 0.2} rotationIntensity={0.1}>
            <mesh
              position={[
                Math.cos(angle) * radius,
                height / 2,
                Math.sin(angle) * radius,
              ]}
            >
              <cylinderGeometry args={[0.3, 0.3, height, 16]} />
              <meshStandardMaterial
                color={i % 2 === 0 ? BSI_COLORS.burntOrange : BSI_COLORS.gold}
                metalness={0.6}
                roughness={0.3}
              />
            </mesh>
          </Float>
        );
      })}
    </group>
  );
}

/** Floating Stats Grid */
function StatsGrid() {
  const gridRef = useRef<THREE.Group>(null);
  const stats = [
    { label: 'AVG', value: '.312' },
    { label: 'HR', value: '45' },
    { label: 'RBI', value: '118' },
    { label: 'ERA', value: '2.89' },
    { label: 'W', value: '18' },
    { label: 'K', value: '247' },
  ];

  useFrame((state) => {
    if (gridRef.current) {
      gridRef.current.children.forEach((child, i) => {
        child.position.y = Math.sin(state.clock.elapsedTime + i * 0.5) * 0.2;
      });
    }
  });

  return (
    <group ref={gridRef} position={[0, 0.5, 0]}>
      {stats.map((stat, i) => {
        const col = i % 3;
        const row = Math.floor(i / 3);
        return (
          <group key={i} position={[(col - 1) * 2.5, -row * 1.5, 0]}>
            <Float speed={1.5} rotationIntensity={0.2}>
              <mesh>
                <boxGeometry args={[1.8, 1, 0.1]} />
                <meshStandardMaterial
                  color={BSI_COLORS.charcoal}
                  metalness={0.8}
                  roughness={0.2}
                  transparent
                  opacity={0.8}
                />
              </mesh>
              <Center position={[0, 0.15, 0.1]}>
                <Text
                  fontSize={0.25}
                  color={BSI_COLORS.ember}
                  anchorX="center"
                  anchorY="middle"
                >
                  {stat.value}
                </Text>
              </Center>
              <Center position={[0, -0.2, 0.1]}>
                <Text
                  fontSize={0.15}
                  color={BSI_COLORS.cream}
                  anchorX="center"
                  anchorY="middle"
                >
                  {stat.label}
                </Text>
              </Center>
            </Float>
          </group>
        );
      })}
    </group>
  );
}

/** Main scene with all demos */
function Scene({ activeDemo }: { activeDemo: string }) {
  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} color={BSI_COLORS.ember} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color={BSI_COLORS.gold} />
      <spotLight
        position={[0, 10, 0]}
        angle={0.3}
        penumbra={1}
        intensity={0.8}
        color={BSI_COLORS.burntOrange}
      />

      <Stars radius={50} depth={50} count={2000} factor={4} fade speed={1} />

      {activeDemo === 'orb' && <BSIOrb />}
      {activeDemo === 'pillars' && <ScorePillars />}
      {activeDemo === 'stats' && <StatsGrid />}

      <OrbitControls
        enableZoom={true}
        enablePan={false}
        maxPolarAngle={Math.PI / 2}
        minPolarAngle={Math.PI / 4}
      />
      <Environment preset="night" />
    </>
  );
}

// ============================================================================
// Main App
// ============================================================================

const demos = [
  { id: 'orb', label: 'Data Orb', description: 'Interactive distortion sphere with particle effects' },
  { id: 'pillars', label: 'Score Pillars', description: '3D bar chart with animated height values' },
  { id: 'stats', label: 'Stats Grid', description: 'Floating statistics panels with glass effect' },
];

export default function App() {
  const [activeDemo, setActiveDemo] = useState('orb');

  return (
    <div style={{ width: '100%', height: '100vh', position: 'relative' }}>
      {/* Navigation */}
      <nav style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        padding: '1rem 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'linear-gradient(to bottom, rgba(13,13,13,0.9), transparent)',
      }}>
        <a href="/" style={{
          color: BSI_COLORS.cream,
          textDecoration: 'none',
          fontSize: '1.25rem',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
        }}>
          <span style={{ color: BSI_COLORS.ember }}>Blaze</span> Sports Intel
        </a>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {demos.map((demo) => (
            <button
              key={demo.id}
              onClick={() => setActiveDemo(demo.id)}
              style={{
                background: activeDemo === demo.id ? BSI_COLORS.ember : 'transparent',
                color: BSI_COLORS.cream,
                border: `1px solid ${activeDemo === demo.id ? BSI_COLORS.ember : BSI_COLORS.charcoal}`,
                padding: '0.5rem 1rem',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontFamily: 'Inter, sans-serif',
                fontSize: '0.875rem',
                fontWeight: 500,
                transition: 'all 0.2s ease',
              }}
            >
              {demo.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Demo Info */}
      <div style={{
        position: 'absolute',
        bottom: '2rem',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 100,
        textAlign: 'center',
        color: BSI_COLORS.cream,
      }}>
        <h2 style={{
          fontSize: '2rem',
          fontWeight: 700,
          marginBottom: '0.5rem',
          color: BSI_COLORS.ember,
        }}>
          {demos.find(d => d.id === activeDemo)?.label}
        </h2>
        <p style={{
          fontSize: '1rem',
          opacity: 0.8,
          maxWidth: '400px',
        }}>
          {demos.find(d => d.id === activeDemo)?.description}
        </p>
        <p style={{
          fontSize: '0.75rem',
          opacity: 0.5,
          marginTop: '1rem',
        }}>
          Drag to rotate • Scroll to zoom
        </p>
      </div>

      {/* 3D Canvas */}
      <Canvas
        camera={{ position: [0, 2, 6], fov: 60 }}
        style={{ background: BSI_COLORS.midnight }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
      >
        <Suspense fallback={null}>
          <Scene activeDemo={activeDemo} />
        </Suspense>
      </Canvas>
    </div>
  );
}
