/**
 * HeroBackground3D.tsx
 * Site hero section 3D background with procedural ember particles, volumetric
 * light rays, scroll-responsive effects, mouse parallax, and mobile-optimized
 * performance with auto-throttling.
 *
 * @module components/3d/HeroBackground3D
 * @requires @react-three/fiber
 * @requires @react-three/drei
 */

import React, {
  useRef,
  useMemo,
  useState,
  useEffect,
  useCallback,
  Suspense,
} from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import {
  Environment,
  Stars,
  Float,
  PerformanceMonitor,
  AdaptiveDpr,
  AdaptiveEvents,
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

/** Performance quality level */
export type QualityLevel = 'low' | 'medium' | 'high' | 'ultra';

/** Props for HeroBackground3D */
export interface HeroBackground3DProps {
  /** Enable particle effects */
  enableParticles?: boolean;
  /** Enable volumetric light rays */
  enableLightRays?: boolean;
  /** Enable mouse parallax effect */
  enableParallax?: boolean;
  /** Enable scroll responsiveness */
  enableScrollEffect?: boolean;
  /** Current scroll position (0-1) */
  scrollPosition?: number;
  /** Mouse position for parallax (normalized -1 to 1) */
  mousePosition?: { x: number; y: number };
  /** Initial quality level */
  qualityLevel?: QualityLevel;
  /** Auto-adjust quality based on performance */
  autoAdjustQuality?: boolean;
  /** Particle density multiplier */
  particleDensity?: number;
  /** Primary color override */
  primaryColor?: string;
  /** Secondary color override */
  secondaryColor?: string;
  /** Callback when quality level changes */
  onQualityChange?: (level: QualityLevel) => void;
  /** Custom className */
  className?: string;
  /** Custom styles */
  style?: React.CSSProperties;
  /** Children to render over the background */
  children?: React.ReactNode;
}

// ============================================================================
// Shader Definitions
// ============================================================================

/** Volumetric light ray vertex shader */
const lightRayVertexShader = `
  varying vec2 vUv;
  varying vec3 vPosition;

  void main() {
    vUv = uv;
    vPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

/** Volumetric light ray fragment shader */
const lightRayFragmentShader = `
  uniform float uTime;
  uniform float uIntensity;
  uniform vec3 uColor;
  uniform vec2 uResolution;
  uniform float uScrollOffset;

  varying vec2 vUv;
  varying vec3 vPosition;

  #define NUM_RAYS 8.0
  #define RAY_DECAY 0.96

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);

    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));

    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  void main() {
    vec2 uv = vUv;
    vec2 center = vec2(0.5, 0.3 - uScrollOffset * 0.2);

    // Radial distance from center
    float dist = length(uv - center);

    // Create ray pattern
    float angle = atan(uv.y - center.y, uv.x - center.x);
    float rays = sin(angle * NUM_RAYS + uTime * 0.5);
    rays = smoothstep(0.2, 1.0, rays);

    // Add noise for organic feel
    float n = noise(uv * 5.0 + uTime * 0.2);

    // Radial falloff
    float falloff = 1.0 - smoothstep(0.0, 0.7, dist);
    falloff = pow(falloff, 1.5);

    // Combine effects
    float intensity = rays * falloff * uIntensity * (0.5 + n * 0.5);
    intensity *= 1.0 - uScrollOffset * 0.5;

    // Slight color shift based on angle
    vec3 color = uColor;
    color = mix(color, color * 1.2, rays * 0.3);

    gl_FragColor = vec4(color, intensity * 0.4);
  }
`;

/** Ember particle shader */
const emberVertexShader = `
  attribute float size;
  attribute float alpha;
  attribute vec3 velocity;

  uniform float uTime;
  uniform float uScrollOffset;

  varying float vAlpha;
  varying vec3 vColor;

  void main() {
    vAlpha = alpha;

    // Animate position
    vec3 pos = position;
    pos += velocity * uTime * 0.1;

    // Add turbulence
    pos.x += sin(uTime * 2.0 + position.y * 5.0) * 0.1;
    pos.z += cos(uTime * 1.5 + position.x * 3.0) * 0.1;

    // Rise effect
    pos.y += uTime * velocity.y * 0.5;
    pos.y = mod(pos.y + 5.0, 10.0) - 5.0;

    // Scroll parallax
    pos.y -= uScrollOffset * 3.0 * (1.0 + position.z * 0.5);

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = size * (300.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;

    // Color based on height
    float heightFactor = (pos.y + 5.0) / 10.0;
    vColor = mix(vec3(1.0, 0.3, 0.1), vec3(1.0, 0.8, 0.2), heightFactor);
  }
`;

const emberFragmentShader = `
  uniform float uTime;

  varying float vAlpha;
  varying vec3 vColor;

  void main() {
    // Circular particle shape
    vec2 center = gl_PointCoord - vec2(0.5);
    float dist = length(center);

    if (dist > 0.5) discard;

    // Soft edge
    float alpha = vAlpha * (1.0 - smoothstep(0.2, 0.5, dist));

    // Flicker
    float flicker = sin(uTime * 10.0 + gl_PointCoord.x * 20.0) * 0.2 + 0.8;

    // Core glow
    float core = 1.0 - smoothstep(0.0, 0.3, dist);
    vec3 color = mix(vColor, vec3(1.0, 1.0, 0.9), core * 0.5);

    gl_FragColor = vec4(color * flicker, alpha);
  }
`;

// ============================================================================
// Quality Settings
// ============================================================================

interface QualitySettings {
  particleCount: number;
  lightRayResolution: number;
  enableStars: boolean;
  enablePostProcessing: boolean;
  pixelRatio: number;
}

function getQualitySettings(level: QualityLevel): QualitySettings {
  const settings: Record<QualityLevel, QualitySettings> = {
    low: {
      particleCount: 100,
      lightRayResolution: 0.5,
      enableStars: false,
      enablePostProcessing: false,
      pixelRatio: 1,
    },
    medium: {
      particleCount: 300,
      lightRayResolution: 0.75,
      enableStars: true,
      enablePostProcessing: false,
      pixelRatio: 1.5,
    },
    high: {
      particleCount: 600,
      lightRayResolution: 1,
      enableStars: true,
      enablePostProcessing: true,
      pixelRatio: 2,
    },
    ultra: {
      particleCount: 1000,
      lightRayResolution: 1,
      enableStars: true,
      enablePostProcessing: true,
      pixelRatio: 2,
    },
  };
  return settings[level];
}

// ============================================================================
// Ember Particle System Component
// ============================================================================

interface EmberParticlesProps {
  count: number;
  scrollOffset: number;
  primaryColor: string;
}

function EmberParticles({ count, scrollOffset, primaryColor }: EmberParticlesProps) {
  const pointsRef = useRef<THREE.Points>(null);

  const { positions, sizes, alphas, velocities } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const alphas = new Float32Array(count);
    const velocities = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;

      // Random position in a wide area
      positions[i3] = (Math.random() - 0.5) * 15;
      positions[i3 + 1] = Math.random() * 10 - 5;
      positions[i3 + 2] = (Math.random() - 0.5) * 10;

      // Vary sizes
      sizes[i] = 0.5 + Math.random() * 1.5;

      // Vary opacity
      alphas[i] = 0.3 + Math.random() * 0.7;

      // Random velocities (mostly upward)
      velocities[i3] = (Math.random() - 0.5) * 0.5;
      velocities[i3 + 1] = 0.3 + Math.random() * 0.7;
      velocities[i3 + 2] = (Math.random() - 0.5) * 0.3;
    }

    return { positions, sizes, alphas, velocities };
  }, [count]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uScrollOffset: { value: 0 },
    }),
    []
  );

  useFrame((state) => {
    uniforms.uTime.value = state.clock.elapsedTime;
    uniforms.uScrollOffset.value = scrollOffset;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-size"
          count={count}
          array={sizes}
          itemSize={1}
        />
        <bufferAttribute
          attach="attributes-alpha"
          count={count}
          array={alphas}
          itemSize={1}
        />
        <bufferAttribute
          attach="attributes-velocity"
          count={count}
          array={velocities}
          itemSize={3}
        />
      </bufferGeometry>
      <shaderMaterial
        vertexShader={emberVertexShader}
        fragmentShader={emberFragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

// ============================================================================
// Volumetric Light Rays Component
// ============================================================================

interface LightRaysProps {
  scrollOffset: number;
  intensity: number;
  primaryColor: string;
}

function LightRays({ scrollOffset, intensity, primaryColor }: LightRaysProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uIntensity: { value: intensity },
      uColor: { value: new THREE.Color(primaryColor) },
      uResolution: { value: new THREE.Vector2(1, 1) },
      uScrollOffset: { value: 0 },
    }),
    [intensity, primaryColor]
  );

  useFrame((state) => {
    uniforms.uTime.value = state.clock.elapsedTime;
    uniforms.uScrollOffset.value = scrollOffset;
  });

  return (
    <mesh ref={meshRef} position={[0, 2, -5]} scale={[20, 15, 1]}>
      <planeGeometry args={[1, 1, 1, 1]} />
      <shaderMaterial
        vertexShader={lightRayVertexShader}
        fragmentShader={lightRayFragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

// ============================================================================
// Floating Orbs Component
// ============================================================================

interface FloatingOrbsProps {
  scrollOffset: number;
  mousePosition: { x: number; y: number };
  primaryColor: string;
  secondaryColor: string;
}

function FloatingOrbs({
  scrollOffset,
  mousePosition,
  primaryColor,
  secondaryColor,
}: FloatingOrbsProps) {
  const groupRef = useRef<THREE.Group>(null);

  const orbs = useMemo(
    () => [
      { position: [-3, 1, -2], size: 0.4, speed: 1.2, color: primaryColor },
      { position: [4, -1, -3], size: 0.3, speed: 0.8, color: secondaryColor },
      { position: [-2, 2, -4], size: 0.5, speed: 1.0, color: primaryColor },
      { position: [3, 0, -2], size: 0.25, speed: 1.4, color: BSI_COLORS.gold },
      { position: [0, -2, -3], size: 0.35, speed: 0.9, color: secondaryColor },
    ],
    [primaryColor, secondaryColor]
  );

  useFrame((state) => {
    if (groupRef.current) {
      // Mouse parallax
      groupRef.current.rotation.y = mousePosition.x * 0.1;
      groupRef.current.rotation.x = -mousePosition.y * 0.05;

      // Scroll effect
      groupRef.current.position.y = -scrollOffset * 2;
    }
  });

  return (
    <group ref={groupRef}>
      {orbs.map((orb, i) => (
        <Float
          key={`orb-${i}`}
          speed={orb.speed}
          rotationIntensity={0.5}
          floatIntensity={0.5}
        >
          <mesh position={orb.position as [number, number, number]}>
            <sphereGeometry args={[orb.size, 32, 32]} />
            <meshStandardMaterial
              color={orb.color}
              emissive={orb.color}
              emissiveIntensity={0.3}
              metalness={0.8}
              roughness={0.2}
              transparent
              opacity={0.7}
            />
          </mesh>

          {/* Glow */}
          <mesh position={orb.position as [number, number, number]}>
            <sphereGeometry args={[orb.size * 1.5, 16, 16]} />
            <meshBasicMaterial
              color={orb.color}
              transparent
              opacity={0.1}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        </Float>
      ))}
    </group>
  );
}

// ============================================================================
// Background Gradient Plane
// ============================================================================

function BackgroundGradient() {
  return (
    <mesh position={[0, 0, -10]}>
      <planeGeometry args={[50, 30]} />
      <meshBasicMaterial color={BSI_COLORS.midnight} />
    </mesh>
  );
}

// ============================================================================
// Camera Controller
// ============================================================================

interface CameraControllerProps {
  scrollOffset: number;
  mousePosition: { x: number; y: number };
  enableParallax: boolean;
}

function CameraController({
  scrollOffset,
  mousePosition,
  enableParallax,
}: CameraControllerProps) {
  const { camera } = useThree();

  useFrame(() => {
    // Scroll effect
    camera.position.y = 2 - scrollOffset * 3;
    camera.position.z = 8 - scrollOffset * 2;

    // Mouse parallax
    if (enableParallax) {
      camera.position.x = THREE.MathUtils.lerp(
        camera.position.x,
        mousePosition.x * 0.5,
        0.05
      );
      camera.rotation.y = THREE.MathUtils.lerp(
        camera.rotation.y,
        -mousePosition.x * 0.02,
        0.05
      );
    }

    camera.lookAt(0, 0 - scrollOffset * 2, 0);
  });

  return null;
}

// ============================================================================
// Main Scene Component
// ============================================================================

interface HeroSceneProps {
  settings: QualitySettings;
  scrollOffset: number;
  mousePosition: { x: number; y: number };
  enableParticles: boolean;
  enableLightRays: boolean;
  enableParallax: boolean;
  primaryColor: string;
  secondaryColor: string;
  particleDensity: number;
}

function HeroScene({
  settings,
  scrollOffset,
  mousePosition,
  enableParticles,
  enableLightRays,
  enableParallax,
  primaryColor,
  secondaryColor,
  particleDensity,
}: HeroSceneProps) {
  const adjustedParticleCount = Math.floor(settings.particleCount * particleDensity);

  return (
    <>
      {/* Camera */}
      <CameraController
        scrollOffset={scrollOffset}
        mousePosition={mousePosition}
        enableParallax={enableParallax}
      />

      {/* Background */}
      <BackgroundGradient />

      {/* Stars */}
      {settings.enableStars && (
        <Stars
          radius={50}
          depth={50}
          count={500}
          factor={4}
          saturation={0}
          fade
          speed={0.5}
        />
      )}

      {/* Volumetric light rays */}
      {enableLightRays && (
        <LightRays
          scrollOffset={scrollOffset}
          intensity={1}
          primaryColor={primaryColor}
        />
      )}

      {/* Ember particles */}
      {enableParticles && (
        <EmberParticles
          count={adjustedParticleCount}
          scrollOffset={scrollOffset}
          primaryColor={primaryColor}
        />
      )}

      {/* Floating orbs */}
      <FloatingOrbs
        scrollOffset={scrollOffset}
        mousePosition={mousePosition}
        primaryColor={primaryColor}
        secondaryColor={secondaryColor}
      />

      {/* Lighting */}
      <ambientLight intensity={0.2} />
      <pointLight
        position={[0, 5, 5]}
        intensity={0.5}
        color={primaryColor}
      />
      <pointLight
        position={[-5, -3, 3]}
        intensity={0.3}
        color={secondaryColor}
      />
    </>
  );
}

// ============================================================================
// Main Component Export
// ============================================================================

/**
 * HeroBackground3D - Site hero section 3D background with procedural ember
 * particles, volumetric light rays, scroll-responsive effects, mouse parallax,
 * and mobile-optimized performance.
 *
 * @example
 * ```tsx
 * const [scrollY, setScrollY] = useState(0);
 * const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
 *
 * useEffect(() => {
 *   const handleScroll = () => setScrollY(window.scrollY / window.innerHeight);
 *   const handleMouse = (e) => setMousePos({
 *     x: (e.clientX / window.innerWidth) * 2 - 1,
 *     y: (e.clientY / window.innerHeight) * 2 - 1,
 *   });
 *
 *   window.addEventListener('scroll', handleScroll);
 *   window.addEventListener('mousemove', handleMouse);
 *   return () => {
 *     window.removeEventListener('scroll', handleScroll);
 *     window.removeEventListener('mousemove', handleMouse);
 *   };
 * }, []);
 *
 * <HeroBackground3D
 *   scrollPosition={scrollY}
 *   mousePosition={mousePos}
 *   enableParticles
 *   enableLightRays
 *   enableParallax
 *   autoAdjustQuality
 * >
 *   <div className="relative z-10">
 *     <h1>Welcome to BSI</h1>
 *   </div>
 * </HeroBackground3D>
 * ```
 */
export function HeroBackground3D({
  enableParticles = true,
  enableLightRays = true,
  enableParallax = true,
  enableScrollEffect = true,
  scrollPosition = 0,
  mousePosition = { x: 0, y: 0 },
  qualityLevel = 'medium',
  autoAdjustQuality = true,
  particleDensity = 1,
  primaryColor = BSI_COLORS.ember,
  secondaryColor = BSI_COLORS.burntOrange,
  onQualityChange,
  className = '',
  style = {},
  children,
}: HeroBackground3DProps) {
  const [currentQuality, setCurrentQuality] = useState<QualityLevel>(qualityLevel);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || 'ontouchstart' in window);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Auto-adjust quality for mobile
  useEffect(() => {
    if (isMobile && currentQuality !== 'low') {
      setCurrentQuality('low');
      onQualityChange?.('low');
    }
  }, [isMobile, currentQuality, onQualityChange]);

  const settings = useMemo(() => getQualitySettings(currentQuality), [currentQuality]);

  const handlePerformanceChange = useCallback(
    (factor: number) => {
      if (!autoAdjustQuality) return;

      let newQuality: QualityLevel;
      if (factor < 0.5) {
        newQuality = 'low';
      } else if (factor < 0.8) {
        newQuality = 'medium';
      } else if (factor < 0.95) {
        newQuality = 'high';
      } else {
        newQuality = 'ultra';
      }

      if (newQuality !== currentQuality) {
        setCurrentQuality(newQuality);
        onQualityChange?.(newQuality);
      }
    },
    [autoAdjustQuality, currentQuality, onQualityChange]
  );

  const effectiveScrollOffset = enableScrollEffect
    ? Math.min(scrollPosition, 1)
    : 0;

  return (
    <div
      className={`relative w-full h-full ${className}`}
      style={{
        background: `linear-gradient(180deg, ${BSI_COLORS.midnight} 0%, ${BSI_COLORS.charcoal} 100%)`,
        ...style,
      }}
    >
      {/* 3D Canvas */}
      <div className="absolute inset-0">
        <Canvas
          dpr={[1, settings.pixelRatio]}
          gl={{
            antialias: currentQuality !== 'low',
            alpha: true,
            powerPreference: 'high-performance',
          }}
          camera={{ position: [0, 2, 8], fov: 50 }}
        >
          {autoAdjustQuality && (
            <PerformanceMonitor
              onIncline={() => handlePerformanceChange(1)}
              onDecline={() => handlePerformanceChange(0.3)}
            />
          )}

          <AdaptiveDpr pixelated />
          <AdaptiveEvents />

          <Suspense fallback={null}>
            <HeroScene
              settings={settings}
              scrollOffset={effectiveScrollOffset}
              mousePosition={mousePosition}
              enableParticles={enableParticles}
              enableLightRays={enableLightRays}
              enableParallax={enableParallax}
              primaryColor={primaryColor}
              secondaryColor={secondaryColor}
              particleDensity={particleDensity}
            />
          </Suspense>
        </Canvas>
      </div>

      {/* Content overlay */}
      <div className="relative z-10">{children}</div>

      {/* Quality indicator (development only) */}
      {process.env.NODE_ENV === 'development' && (
        <div
          className="absolute bottom-4 right-4 px-2 py-1 rounded text-xs"
          style={{
            background: `${BSI_COLORS.charcoal}cc`,
            color: BSI_COLORS.cream,
          }}
        >
          Quality: {currentQuality.toUpperCase()}
        </div>
      )}
    </div>
  );
}

export default HeroBackground3D;
