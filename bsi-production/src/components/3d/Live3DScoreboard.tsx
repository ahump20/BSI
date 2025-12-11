/**
 * Live3DScoreboard.tsx
 * Real-time 3D scoreboard with floating glass panels, holographic team logos,
 * animated score transitions, and particle bursts on scoring plays.
 *
 * @module components/3d/Live3DScoreboard
 * @requires @react-three/fiber
 * @requires @react-three/drei
 */

import React, { useRef, useMemo, useState, useEffect, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import {
  Text,
  RoundedBox,
  Float,
  MeshTransmissionMaterial,
  Environment,
  useTexture,
  Html,
  Sparkles,
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
} as const;

// ============================================================================
// Type Definitions
// ============================================================================

/** Team data for scoreboard display */
export interface TeamData {
  /** Unique team identifier */
  id: string;
  /** Team display name */
  name: string;
  /** Team abbreviation (3 chars) */
  abbreviation: string;
  /** Primary team color (hex) */
  primaryColor: string;
  /** Secondary team color (hex) */
  secondaryColor: string;
  /** URL to team logo image */
  logoUrl?: string;
  /** Current score */
  score: number;
}

/** Game state information */
export interface GameState {
  /** Current inning number */
  inning: number;
  /** Top or bottom of inning */
  halfInning: 'top' | 'bottom';
  /** Number of outs */
  outs: number;
  /** Ball count */
  balls: number;
  /** Strike count */
  strikes: number;
  /** Base runners */
  runners: {
    first: boolean;
    second: boolean;
    third: boolean;
  };
  /** Game status */
  status: 'pregame' | 'live' | 'final' | 'delayed';
}

/** Props for the Live3DScoreboard component */
export interface Live3DScoreboardProps {
  /** Home team data */
  homeTeam: TeamData;
  /** Away team data */
  awayTeam: TeamData;
  /** Current game state */
  gameState: GameState;
  /** Callback when score changes (for sound effects, etc.) */
  onScoreChange?: (team: 'home' | 'away', newScore: number) => void;
  /** Enable particle effects */
  enableParticles?: boolean;
  /** Panel style variant */
  variant?: 'glass' | 'solid' | 'holographic';
  /** Custom className for canvas container */
  className?: string;
  /** Custom inline styles */
  style?: React.CSSProperties;
}

// ============================================================================
// Shader Definitions
// ============================================================================

/** Holographic distortion vertex shader */
const holoVertexShader = `
  varying vec2 vUv;
  varying vec3 vPosition;
  varying vec3 vNormal;

  void main() {
    vUv = uv;
    vPosition = position;
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

/** Holographic distortion fragment shader */
const holoFragmentShader = `
  uniform float uTime;
  uniform vec3 uColor;
  uniform float uOpacity;

  varying vec2 vUv;
  varying vec3 vPosition;
  varying vec3 vNormal;

  void main() {
    // Fresnel effect for edge glow
    float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 2.0);

    // Scanline effect
    float scanline = sin(vUv.y * 100.0 + uTime * 2.0) * 0.5 + 0.5;
    scanline = smoothstep(0.3, 0.7, scanline) * 0.15;

    // Rainbow chromatic aberration
    float r = sin(uTime + vUv.x * 3.14159) * 0.5 + 0.5;
    float g = sin(uTime * 0.7 + vUv.y * 3.14159) * 0.5 + 0.5;
    float b = sin(uTime * 1.3 + (vUv.x + vUv.y) * 1.57) * 0.5 + 0.5;
    vec3 rainbow = vec3(r, g, b) * 0.3;

    // Combine effects
    vec3 color = uColor + rainbow * fresnel + scanline;
    float alpha = (uOpacity + fresnel * 0.5) * (1.0 - scanline * 0.5);

    gl_FragColor = vec4(color, alpha);
  }
`;

// ============================================================================
// Particle Burst Component
// ============================================================================

interface ParticleBurstProps {
  position: [number, number, number];
  color: string;
  active: boolean;
  onComplete?: () => void;
}

function ParticleBurst({ position, color, active, onComplete }: ParticleBurstProps) {
  const particlesRef = useRef<THREE.Points>(null);
  const [isVisible, setIsVisible] = useState(false);
  const startTime = useRef(0);

  const particleCount = 100;

  const { positions, velocities, colors } = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    const baseColor = new THREE.Color(color);
    const emberColor = new THREE.Color(BSI_COLORS.ember);
    const goldColor = new THREE.Color(BSI_COLORS.gold);

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;

      // Start at center
      positions[i3] = 0;
      positions[i3 + 1] = 0;
      positions[i3 + 2] = 0;

      // Random velocity in sphere
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const speed = 2 + Math.random() * 3;

      velocities[i3] = Math.sin(phi) * Math.cos(theta) * speed;
      velocities[i3 + 1] = Math.sin(phi) * Math.sin(theta) * speed;
      velocities[i3 + 2] = Math.cos(phi) * speed;

      // Mix colors
      const colorMix = Math.random();
      const mixedColor = colorMix < 0.5
        ? baseColor.clone().lerp(emberColor, colorMix * 2)
        : emberColor.clone().lerp(goldColor, (colorMix - 0.5) * 2);

      colors[i3] = mixedColor.r;
      colors[i3 + 1] = mixedColor.g;
      colors[i3 + 2] = mixedColor.b;
    }

    return { positions, velocities, colors };
  }, [color]);

  useEffect(() => {
    if (active) {
      setIsVisible(true);
      startTime.current = 0;

      // Reset positions
      const posAttr = particlesRef.current?.geometry.attributes.position;
      if (posAttr) {
        for (let i = 0; i < particleCount * 3; i++) {
          (posAttr.array as Float32Array)[i] = 0;
        }
        posAttr.needsUpdate = true;
      }
    }
  }, [active]);

  useFrame((state, delta) => {
    if (!isVisible || !particlesRef.current) return;

    startTime.current += delta;
    const elapsed = startTime.current;
    const duration = 1.5;

    if (elapsed > duration) {
      setIsVisible(false);
      onComplete?.();
      return;
    }

    const progress = elapsed / duration;
    const posAttr = particlesRef.current.geometry.attributes.position;
    const posArray = posAttr.array as Float32Array;

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;

      // Apply velocity with gravity
      posArray[i3] += velocities[i3] * delta * (1 - progress * 0.5);
      posArray[i3 + 1] += (velocities[i3 + 1] - 9.8 * elapsed * 0.5) * delta;
      posArray[i3 + 2] += velocities[i3 + 2] * delta * (1 - progress * 0.5);
    }

    posAttr.needsUpdate = true;

    // Fade out
    const material = particlesRef.current.material as THREE.PointsMaterial;
    material.opacity = 1 - progress;
  });

  if (!isVisible) return null;

  return (
    <points ref={particlesRef} position={position}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={particleCount}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.08}
        vertexColors
        transparent
        opacity={1}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

// ============================================================================
// Animated Score Display
// ============================================================================

interface AnimatedScoreProps {
  score: number;
  color: string;
  position: [number, number, number];
  previousScore?: number;
}

function AnimatedScore({ score, color, position, previousScore }: AnimatedScoreProps) {
  const textRef = useRef<THREE.Mesh>(null);
  const [displayScore, setDisplayScore] = useState(score);
  const [isAnimating, setIsAnimating] = useState(false);
  const animationProgress = useRef(0);
  const targetScale = useRef(1);

  useEffect(() => {
    if (previousScore !== undefined && previousScore !== score) {
      setIsAnimating(true);
      animationProgress.current = 0;
      targetScale.current = 1.5;
    }
    setDisplayScore(score);
  }, [score, previousScore]);

  useFrame((state, delta) => {
    if (!textRef.current) return;

    if (isAnimating) {
      animationProgress.current += delta * 3;

      if (animationProgress.current >= 1) {
        setIsAnimating(false);
        textRef.current.scale.setScalar(1);
        targetScale.current = 1;
      } else {
        // Bounce effect
        const bounce = Math.sin(animationProgress.current * Math.PI);
        const scale = 1 + bounce * 0.5;
        textRef.current.scale.setScalar(scale);
      }
    }

    // Subtle pulse animation
    const pulse = Math.sin(state.clock.elapsedTime * 2) * 0.02;
    if (!isAnimating) {
      textRef.current.scale.setScalar(1 + pulse);
    }
  });

  return (
    <Text
      ref={textRef}
      position={position}
      fontSize={0.8}
      fontWeight="bold"
      color={color}
      anchorX="center"
      anchorY="middle"
      outlineWidth={0.02}
      outlineColor={BSI_COLORS.midnight}
    >
      {displayScore}
    </Text>
  );
}

// ============================================================================
// Glass Panel Component
// ============================================================================

interface GlassPanelProps {
  width: number;
  height: number;
  depth?: number;
  position: [number, number, number];
  color?: string;
  children?: React.ReactNode;
  variant?: 'glass' | 'solid' | 'holographic';
}

function GlassPanel({
  width,
  height,
  depth = 0.1,
  position,
  color = BSI_COLORS.charcoal,
  children,
  variant = 'glass',
}: GlassPanelProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  const holoUniforms = useMemo(() => ({
    uTime: { value: 0 },
    uColor: { value: new THREE.Color(color) },
    uOpacity: { value: 0.6 },
  }), [color]);

  useFrame((state) => {
    if (variant === 'holographic') {
      holoUniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  return (
    <Float
      speed={1.5}
      rotationIntensity={0.05}
      floatIntensity={0.1}
      floatingRange={[-0.02, 0.02]}
    >
      <group position={position}>
        <RoundedBox
          ref={meshRef}
          args={[width, height, depth]}
          radius={0.05}
          smoothness={4}
        >
          {variant === 'glass' && (
            <MeshTransmissionMaterial
              backside
              samples={4}
              thickness={0.5}
              chromaticAberration={0.025}
              anisotropy={0.1}
              distortion={0.1}
              distortionScale={0.2}
              temporalDistortion={0.1}
              iridescence={1}
              iridescenceIOR={1}
              iridescenceThicknessRange={[100, 400]}
              color={color}
              roughness={0.1}
              toneMapped={true}
            />
          )}
          {variant === 'solid' && (
            <meshStandardMaterial
              color={color}
              metalness={0.3}
              roughness={0.4}
            />
          )}
          {variant === 'holographic' && (
            <shaderMaterial
              vertexShader={holoVertexShader}
              fragmentShader={holoFragmentShader}
              uniforms={holoUniforms}
              transparent
              side={THREE.DoubleSide}
            />
          )}
        </RoundedBox>

        {/* Edge glow */}
        <mesh position={[0, 0, depth / 2 + 0.01]}>
          <planeGeometry args={[width + 0.05, height + 0.05]} />
          <meshBasicMaterial
            color={BSI_COLORS.ember}
            transparent
            opacity={0.1}
            blending={THREE.AdditiveBlending}
          />
        </mesh>

        {children}
      </group>
    </Float>
  );
}

// ============================================================================
// Holographic Team Logo
// ============================================================================

interface HolographicLogoProps {
  teamColor: string;
  abbreviation: string;
  position: [number, number, number];
  size?: number;
}

function HolographicLogo({ teamColor, abbreviation, position, size = 0.6 }: HolographicLogoProps) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Outer ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[size, 0.03, 16, 32]} />
        <meshStandardMaterial
          color={teamColor}
          emissive={teamColor}
          emissiveIntensity={0.5}
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>

      {/* Team abbreviation */}
      <Text
        fontSize={size * 0.8}
        fontWeight="bold"
        color={teamColor}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.01}
        outlineColor={BSI_COLORS.cream}
      >
        {abbreviation}
      </Text>

      {/* Holographic particles */}
      <Sparkles
        count={20}
        scale={size * 2}
        size={2}
        speed={0.3}
        color={teamColor}
        opacity={0.6}
      />
    </group>
  );
}

// ============================================================================
// Base Runner Indicator
// ============================================================================

interface BaseIndicatorProps {
  base: 'first' | 'second' | 'third';
  occupied: boolean;
  position: [number, number, number];
}

function BaseIndicator({ base, occupied, position }: BaseIndicatorProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current && occupied) {
      const pulse = Math.sin(state.clock.elapsedTime * 3) * 0.1 + 1;
      meshRef.current.scale.setScalar(pulse);
    }
  });

  return (
    <mesh
      ref={meshRef}
      position={position}
      rotation={[0, 0, Math.PI / 4]}
    >
      <planeGeometry args={[0.1, 0.1]} />
      <meshStandardMaterial
        color={occupied ? BSI_COLORS.gold : BSI_COLORS.charcoal}
        emissive={occupied ? BSI_COLORS.gold : '#000000'}
        emissiveIntensity={occupied ? 0.8 : 0}
        transparent
        opacity={occupied ? 1 : 0.3}
      />
    </mesh>
  );
}

// ============================================================================
// Inning Display
// ============================================================================

interface InningDisplayProps {
  inning: number;
  halfInning: 'top' | 'bottom';
  position: [number, number, number];
}

function InningDisplay({ inning, halfInning, position }: InningDisplayProps) {
  return (
    <group position={position}>
      {/* Half inning indicator */}
      <mesh
        position={[0, halfInning === 'top' ? 0.15 : -0.15, 0]}
        scale={halfInning === 'top' ? [1, 1, 1] : [1, -1, 1]}
      >
        <coneGeometry args={[0.08, 0.12, 3]} />
        <meshStandardMaterial
          color={BSI_COLORS.ember}
          emissive={BSI_COLORS.ember}
          emissiveIntensity={0.5}
        />
      </mesh>

      {/* Inning number */}
      <Text
        position={[0.25, 0, 0]}
        fontSize={0.25}
        fontWeight="bold"
        color={BSI_COLORS.cream}
        anchorX="center"
        anchorY="middle"
      >
        {inning}
      </Text>
    </group>
  );
}

// ============================================================================
// Out Indicator
// ============================================================================

interface OutIndicatorProps {
  outs: number;
  position: [number, number, number];
}

function OutIndicator({ outs, position }: OutIndicatorProps) {
  return (
    <group position={position}>
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[(i - 1) * 0.15, 0, 0]}>
          <circleGeometry args={[0.05, 16]} />
          <meshStandardMaterial
            color={i < outs ? BSI_COLORS.burntOrange : BSI_COLORS.charcoal}
            emissive={i < outs ? BSI_COLORS.burntOrange : '#000000'}
            emissiveIntensity={i < outs ? 0.5 : 0}
            transparent
            opacity={i < outs ? 1 : 0.3}
          />
        </mesh>
      ))}
    </group>
  );
}

// ============================================================================
// Count Display (Balls/Strikes)
// ============================================================================

interface CountDisplayProps {
  balls: number;
  strikes: number;
  position: [number, number, number];
}

function CountDisplay({ balls, strikes, position }: CountDisplayProps) {
  return (
    <group position={position}>
      {/* Balls */}
      <group position={[-0.2, 0, 0]}>
        {[0, 1, 2, 3].map((i) => (
          <mesh key={`ball-${i}`} position={[i * 0.1, 0, 0]}>
            <circleGeometry args={[0.03, 16]} />
            <meshStandardMaterial
              color={i < balls ? '#22c55e' : BSI_COLORS.charcoal}
              emissive={i < balls ? '#22c55e' : '#000000'}
              emissiveIntensity={i < balls ? 0.5 : 0}
              transparent
              opacity={i < balls ? 1 : 0.3}
            />
          </mesh>
        ))}
      </group>

      {/* Strikes */}
      <group position={[0.3, 0, 0]}>
        {[0, 1, 2].map((i) => (
          <mesh key={`strike-${i}`} position={[i * 0.1, 0, 0]}>
            <circleGeometry args={[0.03, 16]} />
            <meshStandardMaterial
              color={i < strikes ? '#ef4444' : BSI_COLORS.charcoal}
              emissive={i < strikes ? '#ef4444' : '#000000'}
              emissiveIntensity={i < strikes ? 0.5 : 0}
              transparent
              opacity={i < strikes ? 1 : 0.3}
            />
          </mesh>
        ))}
      </group>
    </group>
  );
}

// ============================================================================
// Main Scoreboard Scene
// ============================================================================

interface ScoreboardSceneProps {
  homeTeam: TeamData;
  awayTeam: TeamData;
  gameState: GameState;
  enableParticles: boolean;
  variant: 'glass' | 'solid' | 'holographic';
  onScoreChange?: (team: 'home' | 'away', newScore: number) => void;
}

function ScoreboardScene({
  homeTeam,
  awayTeam,
  gameState,
  enableParticles,
  variant,
  onScoreChange,
}: ScoreboardSceneProps) {
  const [previousScores, setPreviousScores] = useState({
    home: homeTeam.score,
    away: awayTeam.score,
  });
  const [particleBurst, setParticleBurst] = useState<{
    team: 'home' | 'away';
    active: boolean;
  } | null>(null);

  // Track score changes for animations
  useEffect(() => {
    if (homeTeam.score !== previousScores.home) {
      if (enableParticles && homeTeam.score > previousScores.home) {
        setParticleBurst({ team: 'home', active: true });
      }
      onScoreChange?.('home', homeTeam.score);
      setPreviousScores((prev) => ({ ...prev, home: homeTeam.score }));
    }
    if (awayTeam.score !== previousScores.away) {
      if (enableParticles && awayTeam.score > previousScores.away) {
        setParticleBurst({ team: 'away', active: true });
      }
      onScoreChange?.('away', awayTeam.score);
      setPreviousScores((prev) => ({ ...prev, away: awayTeam.score }));
    }
  }, [homeTeam.score, awayTeam.score, previousScores, enableParticles, onScoreChange]);

  const handleParticleComplete = useCallback(() => {
    setParticleBurst(null);
  }, []);

  return (
    <>
      {/* Main scoreboard panel */}
      <GlassPanel
        width={4}
        height={2}
        position={[0, 0, 0]}
        color={BSI_COLORS.charcoal}
        variant={variant}
      >
        {/* Away team section */}
        <group position={[-1.2, 0.4, 0.1]}>
          <HolographicLogo
            teamColor={awayTeam.primaryColor}
            abbreviation={awayTeam.abbreviation}
            position={[-0.6, 0, 0]}
            size={0.35}
          />
          <Text
            position={[0.3, 0, 0]}
            fontSize={0.2}
            color={BSI_COLORS.cream}
            anchorX="left"
            anchorY="middle"
          >
            {awayTeam.name}
          </Text>
          <AnimatedScore
            score={awayTeam.score}
            color={awayTeam.primaryColor}
            position={[1.5, 0, 0]}
            previousScore={previousScores.away}
          />
        </group>

        {/* Home team section */}
        <group position={[-1.2, -0.4, 0.1]}>
          <HolographicLogo
            teamColor={homeTeam.primaryColor}
            abbreviation={homeTeam.abbreviation}
            position={[-0.6, 0, 0]}
            size={0.35}
          />
          <Text
            position={[0.3, 0, 0]}
            fontSize={0.2}
            color={BSI_COLORS.cream}
            anchorX="left"
            anchorY="middle"
          >
            {homeTeam.name}
          </Text>
          <AnimatedScore
            score={homeTeam.score}
            color={homeTeam.primaryColor}
            position={[1.5, 0, 0]}
            previousScore={previousScores.home}
          />
        </group>

        {/* Divider line */}
        <mesh position={[0, 0, 0.06]}>
          <planeGeometry args={[3.5, 0.01]} />
          <meshBasicMaterial color={BSI_COLORS.ember} />
        </mesh>

        {/* Game state info panel */}
        <group position={[0, -0.85, 0.1]}>
          {/* Inning display */}
          <InningDisplay
            inning={gameState.inning}
            halfInning={gameState.halfInning}
            position={[-1.3, 0, 0]}
          />

          {/* Base runners diamond */}
          <group position={[-0.5, 0, 0]} rotation={[0, 0, Math.PI / 4]}>
            <BaseIndicator
              base="first"
              occupied={gameState.runners.first}
              position={[0.12, 0, 0]}
            />
            <BaseIndicator
              base="second"
              occupied={gameState.runners.second}
              position={[0, 0.12, 0]}
            />
            <BaseIndicator
              base="third"
              occupied={gameState.runners.third}
              position={[-0.12, 0, 0]}
            />
          </group>

          {/* Outs */}
          <OutIndicator outs={gameState.outs} position={[0.3, 0, 0]} />

          {/* Count */}
          <CountDisplay
            balls={gameState.balls}
            strikes={gameState.strikes}
            position={[1, 0, 0]}
          />
        </group>

        {/* Status badge */}
        {gameState.status !== 'live' && (
          <group position={[1.5, 0.7, 0.1]}>
            <RoundedBox args={[0.6, 0.2, 0.02]} radius={0.05}>
              <meshStandardMaterial
                color={
                  gameState.status === 'final'
                    ? '#ef4444'
                    : gameState.status === 'pregame'
                    ? '#22c55e'
                    : '#f59e0b'
                }
              />
            </RoundedBox>
            <Text
              position={[0, 0, 0.02]}
              fontSize={0.1}
              fontWeight="bold"
              color={BSI_COLORS.cream}
              anchorX="center"
              anchorY="middle"
            >
              {gameState.status.toUpperCase()}
            </Text>
          </group>
        )}
      </GlassPanel>

      {/* Particle bursts */}
      {particleBurst && (
        <ParticleBurst
          position={particleBurst.team === 'home' ? [0.8, -0.4, 0.5] : [0.8, 0.4, 0.5]}
          color={particleBurst.team === 'home' ? homeTeam.primaryColor : awayTeam.primaryColor}
          active={particleBurst.active}
          onComplete={handleParticleComplete}
        />
      )}

      {/* Ambient particles */}
      {enableParticles && (
        <Sparkles
          count={50}
          scale={6}
          size={1.5}
          speed={0.2}
          color={BSI_COLORS.ember}
          opacity={0.3}
        />
      )}

      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <pointLight position={[5, 5, 5]} intensity={1} color={BSI_COLORS.cream} />
      <pointLight position={[-5, 5, 5]} intensity={0.5} color={BSI_COLORS.ember} />
      <spotLight
        position={[0, 5, 3]}
        angle={0.3}
        penumbra={0.5}
        intensity={0.8}
        color={BSI_COLORS.gold}
        castShadow
      />

      {/* Environment for reflections */}
      <Environment preset="city" />
    </>
  );
}

// ============================================================================
// Main Component Export
// ============================================================================

/**
 * Live3DScoreboard - A real-time 3D scoreboard component with glass panels,
 * holographic team logos, animated score transitions, and particle effects.
 *
 * @example
 * ```tsx
 * <Live3DScoreboard
 *   homeTeam={{
 *     id: 'stl',
 *     name: 'Cardinals',
 *     abbreviation: 'STL',
 *     primaryColor: '#C41E3A',
 *     secondaryColor: '#0C2340',
 *     score: 5,
 *   }}
 *   awayTeam={{
 *     id: 'chc',
 *     name: 'Cubs',
 *     abbreviation: 'CHC',
 *     primaryColor: '#0E3386',
 *     secondaryColor: '#CC3433',
 *     score: 3,
 *   }}
 *   gameState={{
 *     inning: 7,
 *     halfInning: 'bottom',
 *     outs: 2,
 *     balls: 3,
 *     strikes: 2,
 *     runners: { first: true, second: false, third: true },
 *     status: 'live',
 *   }}
 *   enableParticles
 *   variant="glass"
 * />
 * ```
 */
export function Live3DScoreboard({
  homeTeam,
  awayTeam,
  gameState,
  onScoreChange,
  enableParticles = true,
  variant = 'glass',
  className = '',
  style = {},
}: Live3DScoreboardProps) {
  return (
    <div
      className={`w-full h-full min-h-[300px] ${className}`}
      style={{
        background: `linear-gradient(135deg, ${BSI_COLORS.midnight} 0%, ${BSI_COLORS.charcoal} 100%)`,
        ...style,
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 4], fov: 50 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
      >
        <ScoreboardScene
          homeTeam={homeTeam}
          awayTeam={awayTeam}
          gameState={gameState}
          enableParticles={enableParticles}
          variant={variant}
          onScoreChange={onScoreChange}
        />
      </Canvas>
    </div>
  );
}

export default Live3DScoreboard;
