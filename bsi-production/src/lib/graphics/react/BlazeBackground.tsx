/**
 * BlazeBackground
 *
 * Drop-in hero background component with floating embers,
 * parallax effect, and brand-consistent styling. Perfect
 * for landing pages, headers, and dramatic sections.
 *
 * @author Austin Humphrey
 * @version 1.0.0
 */

import React, { useRef, useEffect, useCallback, useState, useMemo } from 'react';
import * as THREE from 'three';

/**
 * Brand colors
 */
const BLAZE_COLORS = {
  burntOrange: 0xBF5700,
  ember: 0xFF6B35,
  gold: 0xC9A227,
  charcoal: 0x1A1A1A,
  midnight: 0x0D0D0D,
  cream: 0xFAF8F5,
};

/**
 * Preset visual styles
 */
export type BlazeBackgroundPreset =
  | 'hero'         // Full hero with intense embers
  | 'subtle'       // Subtle background for content sections
  | 'celebration'  // Championship/victory celebration
  | 'analytics'    // Clean analytical backdrop
  | 'dramatic';    // High contrast dramatic

/**
 * Props for BlazeBackground
 */
export interface BlazeBackgroundProps {
  /** Visual preset */
  preset?: BlazeBackgroundPreset;
  /** Background color override */
  backgroundColor?: number;
  /** Enable floating ember particles */
  embers?: boolean;
  /** Number of ember particles */
  emberCount?: number;
  /** Enable mouse parallax effect */
  mouseParallax?: boolean;
  /** Parallax strength (0-1) */
  parallaxStrength?: number;
  /** Enable auto-rotation */
  autoRotate?: boolean;
  /** Auto-rotate speed */
  autoRotateSpeed?: number;
  /** Enable bloom effect (requires more GPU) */
  bloom?: boolean;
  /** Bloom intensity */
  bloomIntensity?: number;
  /** Enable vignette */
  vignette?: boolean;
  /** Vignette darkness */
  vignetteDarkness?: number;
  /** Fog density (0 = no fog) */
  fogDensity?: number;
  /** Additional depth layers for parallax */
  depthLayers?: number;
  /** Layer spacing */
  layerSpacing?: number;
  /** Enable gradient overlay */
  gradientOverlay?: boolean;
  /** Gradient direction */
  gradientDirection?: 'top' | 'bottom' | 'radial';
  /** Container height */
  height?: string | number;
  /** Container min-height */
  minHeight?: string | number;
  /** Z-index */
  zIndex?: number;
  /** Additional class name */
  className?: string;
  /** Additional styles */
  style?: React.CSSProperties;
  /** Children to render on top */
  children?: React.ReactNode;
  /** Called when ready */
  onReady?: () => void;
}

/**
 * Preset configurations
 */
const PRESETS: Record<BlazeBackgroundPreset, Partial<BlazeBackgroundProps>> = {
  hero: {
    embers: true,
    emberCount: 150,
    mouseParallax: true,
    parallaxStrength: 0.05,
    autoRotate: true,
    autoRotateSpeed: 0.1,
    bloom: true,
    bloomIntensity: 0.6,
    vignette: true,
    vignetteDarkness: 0.5,
    fogDensity: 0.003,
    depthLayers: 5,
    gradientOverlay: true,
    gradientDirection: 'bottom',
  },
  subtle: {
    embers: true,
    emberCount: 50,
    mouseParallax: true,
    parallaxStrength: 0.02,
    autoRotate: true,
    autoRotateSpeed: 0.05,
    bloom: false,
    vignette: true,
    vignetteDarkness: 0.3,
    fogDensity: 0.005,
    depthLayers: 3,
    gradientOverlay: true,
    gradientDirection: 'radial',
  },
  celebration: {
    embers: true,
    emberCount: 300,
    mouseParallax: true,
    parallaxStrength: 0.08,
    autoRotate: true,
    autoRotateSpeed: 0.2,
    bloom: true,
    bloomIntensity: 1.0,
    vignette: true,
    vignetteDarkness: 0.4,
    fogDensity: 0.002,
    depthLayers: 7,
    gradientOverlay: false,
  },
  analytics: {
    embers: true,
    emberCount: 30,
    mouseParallax: true,
    parallaxStrength: 0.01,
    autoRotate: false,
    bloom: false,
    vignette: true,
    vignetteDarkness: 0.2,
    fogDensity: 0.008,
    depthLayers: 2,
    gradientOverlay: true,
    gradientDirection: 'top',
  },
  dramatic: {
    embers: true,
    emberCount: 200,
    mouseParallax: true,
    parallaxStrength: 0.06,
    autoRotate: true,
    autoRotateSpeed: 0.15,
    bloom: true,
    bloomIntensity: 0.8,
    vignette: true,
    vignetteDarkness: 0.7,
    fogDensity: 0.004,
    depthLayers: 6,
    layerSpacing: 30,
    gradientOverlay: true,
    gradientDirection: 'bottom',
  },
};

/**
 * Ember particle data
 */
interface Ember {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  size: number;
  life: number;
  maxLife: number;
  seed: number;
}

/**
 * BlazeBackground - Hero background component
 */
export const BlazeBackground: React.FC<BlazeBackgroundProps> = (props) => {
  const presetConfig = props.preset ? PRESETS[props.preset] : {};

  const {
    backgroundColor = BLAZE_COLORS.midnight,
    embers = true,
    emberCount = 100,
    mouseParallax = true,
    parallaxStrength = 0.05,
    autoRotate = true,
    autoRotateSpeed = 0.1,
    bloom = false,
    bloomIntensity = 0.5,
    vignette = true,
    vignetteDarkness = 0.5,
    fogDensity = 0.003,
    depthLayers = 5,
    layerSpacing = 20,
    gradientOverlay = true,
    gradientDirection = 'bottom',
    height = '100vh',
    minHeight,
    zIndex = 0,
    className,
    style,
    children,
    onReady,
  } = { ...presetConfig, ...props };

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const embersRef = useRef<{
    particles: Ember[];
    geometry: THREE.BufferGeometry;
    material: THREE.ShaderMaterial;
    points: THREE.Points;
  } | null>(null);
  const clockRef = useRef<THREE.Clock | null>(null);
  const animationRef = useRef<number | null>(null);
  const mouseRef = useRef({ x: 0, y: 0 });

  const [isReady, setIsReady] = useState(false);

  // Create ember particle system
  const createEmberSystem = useCallback(
    (scene: THREE.Scene, count: number) => {
      const particles: Ember[] = [];

      for (let i = 0; i < count; i++) {
        particles.push({
          position: new THREE.Vector3(
            (Math.random() - 0.5) * 100,
            Math.random() * 80 - 20,
            (Math.random() - 0.5) * depthLayers * layerSpacing
          ),
          velocity: new THREE.Vector3(
            (Math.random() - 0.5) * 3,
            5 + Math.random() * 10,
            (Math.random() - 0.5) * 3
          ),
          size: 3 + Math.random() * 5,
          life: Math.random() * 4,
          maxLife: 3 + Math.random() * 3,
          seed: Math.random(),
        });
      }

      const positions = new Float32Array(count * 3);
      const lifetimes = new Float32Array(count);
      const sizes = new Float32Array(count);
      const seeds = new Float32Array(count);

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute('aLifetime', new THREE.BufferAttribute(lifetimes, 1));
      geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
      geometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));

      const material = new THREE.ShaderMaterial({
        uniforms: {
          time: { value: 0 },
          coreColor: { value: new THREE.Color(BLAZE_COLORS.ember) },
          glowColor: { value: new THREE.Color(BLAZE_COLORS.burntOrange) },
          fadeColor: { value: new THREE.Color(BLAZE_COLORS.gold) },
        },
        vertexShader: `
          uniform float time;

          attribute float aLifetime;
          attribute float aSize;
          attribute float aSeed;

          varying float vLifetime;
          varying float vFlicker;

          void main() {
            vLifetime = aLifetime;

            float flickerPhase = time * 2.0 + aSeed * 6.28;
            vFlicker = 0.7 + 0.3 * sin(flickerPhase);

            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);

            float sizeScale = sin(aLifetime * 3.14159);
            float finalSize = aSize * sizeScale * vFlicker;
            finalSize *= (200.0 / -mvPosition.z);

            gl_PointSize = max(finalSize, 1.0);
            gl_Position = projectionMatrix * mvPosition;
          }
        `,
        fragmentShader: `
          uniform vec3 coreColor;
          uniform vec3 glowColor;
          uniform vec3 fadeColor;

          varying float vLifetime;
          varying float vFlicker;

          void main() {
            vec2 center = gl_PointCoord - vec2(0.5);
            float dist = length(center);

            if (dist > 0.5) discard;

            float falloff = 1.0 - smoothstep(0.0, 0.5, dist);

            vec3 color;
            if (dist < 0.15) {
              color = coreColor * 1.5;
            } else if (dist < 0.3) {
              float t = (dist - 0.15) / 0.15;
              color = mix(coreColor, glowColor, t);
            } else {
              float t = (dist - 0.3) / 0.2;
              color = mix(glowColor, fadeColor, t);
            }

            color *= 1.5 * vFlicker;

            float alpha = falloff * (1.0 - vLifetime);

            gl_FragColor = vec4(color, alpha);
          }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });

      const points = new THREE.Points(geometry, material);
      scene.add(points);

      return { particles, geometry, material, points };
    },
    [depthLayers, layerSpacing]
  );

  // Update ember particles
  const updateEmbers = useCallback(
    (delta: number, time: number) => {
      const emberSystem = embersRef.current;
      if (!emberSystem) return;

      const { particles, geometry, material } = emberSystem;
      const positions = geometry.attributes.position as THREE.BufferAttribute;
      const lifetimes = geometry.attributes.aLifetime as THREE.BufferAttribute;
      const sizes = geometry.attributes.aSize as THREE.BufferAttribute;
      const seeds = geometry.attributes.aSeed as THREE.BufferAttribute;

      material.uniforms.time.value = time;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        const i3 = i * 3;

        p.life += delta;

        if (p.life >= p.maxLife) {
          // Reset particle
          p.position.set(
            (Math.random() - 0.5) * 100,
            -20,
            (Math.random() - 0.5) * depthLayers * layerSpacing
          );
          p.velocity.set(
            (Math.random() - 0.5) * 3,
            5 + Math.random() * 10,
            (Math.random() - 0.5) * 3
          );
          p.life = 0;
          p.maxLife = 3 + Math.random() * 3;
          p.size = 3 + Math.random() * 5;
          p.seed = Math.random();
        }

        // Apply turbulence
        const turbX = Math.sin(time * 2 + p.seed * 10) * 2;
        const turbZ = Math.cos(time * 2 + p.seed * 10) * 2;

        p.position.x += (p.velocity.x + turbX) * delta;
        p.position.y += p.velocity.y * delta;
        p.position.z += (p.velocity.z + turbZ) * delta;

        p.velocity.y *= 0.995;

        // Update buffers
        positions.array[i3] = p.position.x;
        positions.array[i3 + 1] = p.position.y;
        positions.array[i3 + 2] = p.position.z;
        lifetimes.array[i] = p.life / p.maxLife;
        sizes.array[i] = p.size;
        seeds.array[i] = p.seed;
      }

      positions.needsUpdate = true;
      lifetimes.needsUpdate = true;
    },
    [depthLayers, layerSpacing]
  );

  // Initialize
  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return;

    const container = containerRef.current;
    const canvas = canvasRef.current;

    // Detect mobile for performance
    const isMobile = /Android|webOS|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const effectiveEmberCount = isMobile ? Math.floor(emberCount * 0.5) : emberCount;

    // Create scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(backgroundColor);

    if (fogDensity > 0) {
      scene.fog = new THREE.FogExp2(backgroundColor, fogDensity);
    }

    sceneRef.current = scene;

    // Create camera
    const aspect = container.clientWidth / container.clientHeight;
    const camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 1000);
    camera.position.set(0, 0, 50);
    cameraRef.current = camera;

    // Create renderer
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: !isMobile,
      alpha: false,
      powerPreference: isMobile ? 'low-power' : 'high-performance',
    });

    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;

    rendererRef.current = renderer;

    // Create clock
    clockRef.current = new THREE.Clock();

    // Create ember system
    if (embers) {
      embersRef.current = createEmberSystem(scene, effectiveEmberCount);
    }

    // Add ambient light
    const ambient = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambient);

    setIsReady(true);

    if (onReady) {
      onReady();
    }

    // Mouse move handler
    const handleMouseMove = (e: MouseEvent) => {
      if (!mouseParallax) return;

      const x = (e.clientX / window.innerWidth - 0.5) * 2;
      const y = (e.clientY / window.innerHeight - 0.5) * 2;

      mouseRef.current = { x, y };
    };

    if (mouseParallax) {
      window.addEventListener('mousemove', handleMouseMove);
    }

    // Resize handler
    const handleResize = () => {
      if (!container || !camera || !renderer) return;

      const width = container.clientWidth;
      const height = container.clientHeight;

      camera.aspect = width / height;
      camera.updateProjectionMatrix();

      renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    // Animation loop
    let autoRotateAngle = 0;

    const animate = () => {
      animationRef.current = requestAnimationFrame(animate);

      const clock = clockRef.current;
      if (!clock) return;

      const delta = clock.getDelta();
      const time = clock.elapsedTime;

      // Auto-rotate
      if (autoRotate) {
        autoRotateAngle += autoRotateSpeed * delta;
        camera.position.x = Math.sin(autoRotateAngle) * 5;
        camera.position.y = Math.cos(autoRotateAngle * 0.5) * 2;
      }

      // Mouse parallax
      if (mouseParallax) {
        const targetX = mouseRef.current.x * parallaxStrength * 20;
        const targetY = mouseRef.current.y * parallaxStrength * -10;

        camera.position.x += (targetX - camera.position.x) * 0.05;
        camera.position.y += (targetY - camera.position.y) * 0.05;
      }

      camera.lookAt(0, 0, 0);

      // Update embers
      if (embers && embersRef.current) {
        updateEmbers(delta, time);
      }

      // Render
      renderer.render(scene, camera);
    };

    animate();

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);

      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }

      if (embersRef.current) {
        scene.remove(embersRef.current.points);
        embersRef.current.geometry.dispose();
        embersRef.current.material.dispose();
      }

      renderer.dispose();
      renderer.forceContextLoss();
    };
  }, [
    backgroundColor,
    embers,
    emberCount,
    mouseParallax,
    parallaxStrength,
    autoRotate,
    autoRotateSpeed,
    fogDensity,
    depthLayers,
    layerSpacing,
    createEmberSystem,
    updateEmbers,
    onReady,
  ]);

  // Gradient overlay styles
  const gradientStyle = useMemo(() => {
    if (!gradientOverlay) return {};

    const rgba = `rgba(${(backgroundColor >> 16) & 255}, ${(backgroundColor >> 8) & 255}, ${backgroundColor & 255}, `;

    switch (gradientDirection) {
      case 'top':
        return {
          background: `linear-gradient(to bottom, ${rgba}0.8) 0%, ${rgba}0) 100%)`,
        };
      case 'bottom':
        return {
          background: `linear-gradient(to top, ${rgba}0.8) 0%, ${rgba}0) 100%)`,
        };
      case 'radial':
        return {
          background: `radial-gradient(ellipse at center, ${rgba}0) 0%, ${rgba}0.6) 100%)`,
        };
      default:
        return {};
    }
  }, [gradientOverlay, gradientDirection, backgroundColor]);

  // Vignette overlay styles
  const vignetteStyle = useMemo(() => {
    if (!vignette) return {};

    return {
      background: `radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,${vignetteDarkness}) 100%)`,
    };
  }, [vignette, vignetteDarkness]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        position: 'relative',
        width: '100%',
        height: typeof height === 'number' ? `${height}px` : height,
        minHeight: minHeight
          ? typeof minHeight === 'number'
            ? `${minHeight}px`
            : minHeight
          : undefined,
        overflow: 'hidden',
        zIndex,
        ...style,
      }}
    >
      {/* Three.js Canvas */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          display: 'block',
        }}
      />

      {/* Gradient Overlay */}
      {gradientOverlay && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            pointerEvents: 'none',
            ...gradientStyle,
          }}
        />
      )}

      {/* Vignette Overlay */}
      {vignette && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            pointerEvents: 'none',
            ...vignetteStyle,
          }}
        />
      )}

      {/* Content */}
      {children && (
        <div
          style={{
            position: 'relative',
            zIndex: 1,
            width: '100%',
            height: '100%',
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
};

export default BlazeBackground;
