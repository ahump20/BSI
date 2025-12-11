/**
 * DataOrb3D.tsx
 * Spherical 3D data visualization with stats plotted on a sphere, rotation
 * controls, connection lines between related stats, pulsing outlier nodes,
 * and multiple view modes (scatter, network, surface).
 *
 * @module components/3d/DataOrb3D
 * @requires @react-three/fiber
 * @requires @react-three/drei
 */

import React, { useRef, useMemo, useState, useCallback, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import {
  Text,
  OrbitControls,
  Sphere,
  Line,
  Environment,
  Html,
  Sparkles,
  MeshDistortMaterial,
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

/** Data point for the orb visualization */
export interface DataPoint {
  /** Unique identifier */
  id: string;
  /** Display label */
  label: string;
  /** Primary value (used for positioning) */
  value: number;
  /** Secondary value (used for size/color) */
  secondaryValue?: number;
  /** Category/group */
  category?: string;
  /** Custom color override */
  color?: string;
  /** Is this an outlier value */
  isOutlier?: boolean;
  /** Additional metadata */
  metadata?: Record<string, string | number>;
  /** Related point IDs for network connections */
  connections?: string[];
}

/** Category configuration */
export interface CategoryConfig {
  /** Category identifier */
  id: string;
  /** Display name */
  name: string;
  /** Category color */
  color: string;
}

/** View mode for the orb */
export type ViewMode = 'scatter' | 'network' | 'surface';

/** Props for DataOrb3D */
export interface DataOrb3DProps {
  /** Data points to visualize */
  data: DataPoint[];
  /** Category configurations */
  categories?: CategoryConfig[];
  /** Title of the visualization */
  title?: string;
  /** Current view mode */
  viewMode?: ViewMode;
  /** Enable auto-rotation */
  autoRotate?: boolean;
  /** Auto-rotation speed */
  autoRotateSpeed?: number;
  /** Show connection lines */
  showConnections?: boolean;
  /** Show labels on nodes */
  showLabels?: boolean;
  /** Enable controls */
  enableControls?: boolean;
  /** Highlight outliers */
  highlightOutliers?: boolean;
  /** Sphere radius */
  radius?: number;
  /** Selected data point ID */
  selectedPoint?: string;
  /** Callback when point is clicked */
  onPointClick?: (point: DataPoint) => void;
  /** Callback when point is hovered */
  onPointHover?: (point: DataPoint | null) => void;
  /** Custom className */
  className?: string;
  /** Custom styles */
  style?: React.CSSProperties;
}

// ============================================================================
// Utility Functions
// ============================================================================

/** Convert normalized values to spherical coordinates */
function toSphericalPosition(
  phi: number,
  theta: number,
  radius: number
): [number, number, number] {
  const x = radius * Math.sin(phi) * Math.cos(theta);
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.sin(theta);
  return [x, y, z];
}

/** Map value to angle (0-1 to 0-2PI) */
function valueToAngle(value: number, min: number, max: number): number {
  const normalized = (value - min) / (max - min);
  return normalized * Math.PI * 2;
}

/** Map value to elevation (0-1 to 0-PI) */
function valueToElevation(value: number, min: number, max: number): number {
  const normalized = (value - min) / (max - min);
  return normalized * Math.PI;
}

/** Get color based on category or value */
function getPointColor(point: DataPoint, categories: CategoryConfig[]): string {
  if (point.color) return point.color;
  if (point.category) {
    const cat = categories.find((c) => c.id === point.category);
    if (cat) return cat.color;
  }
  if (point.isOutlier) return BSI_COLORS.gold;
  return BSI_COLORS.ember;
}

// ============================================================================
// Shader Definitions
// ============================================================================

/** Surface mode vertex shader */
const surfaceVertexShader = `
  varying vec2 vUv;
  varying vec3 vPosition;
  varying vec3 vNormal;
  uniform float uTime;
  uniform sampler2D uDataTexture;

  void main() {
    vUv = uv;
    vPosition = position;
    vNormal = normalize(normalMatrix * normal);

    // Sample data texture for displacement
    vec4 data = texture2D(uDataTexture, vUv);
    vec3 displaced = position + normal * data.r * 0.3;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
  }
`;

const surfaceFragmentShader = `
  uniform float uTime;
  uniform vec3 uBaseColor;
  uniform vec3 uHighlightColor;

  varying vec2 vUv;
  varying vec3 vPosition;
  varying vec3 vNormal;

  void main() {
    // Fresnel effect
    float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 2.0);

    // Grid pattern
    float gridX = step(0.98, fract(vUv.x * 20.0));
    float gridY = step(0.98, fract(vUv.y * 20.0));
    float grid = max(gridX, gridY) * 0.3;

    // Pulse
    float pulse = sin(uTime * 2.0 + vUv.y * 10.0) * 0.5 + 0.5;

    vec3 color = mix(uBaseColor, uHighlightColor, fresnel * 0.5 + grid + pulse * 0.1);
    float alpha = 0.6 + fresnel * 0.3;

    gl_FragColor = vec4(color, alpha);
  }
`;

// ============================================================================
// Data Point Node Component
// ============================================================================

interface DataNodeProps {
  point: DataPoint;
  position: [number, number, number];
  size: number;
  color: string;
  showLabel: boolean;
  isSelected: boolean;
  highlightOutlier: boolean;
  onClick?: () => void;
  onHover?: (hovered: boolean) => void;
}

function DataNode({
  point,
  position,
  size,
  color,
  showLabel,
  isSelected,
  highlightOutlier,
  onClick,
  onHover,
}: DataNodeProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (!meshRef.current) return;

    // Pulse animation for outliers
    if (point.isOutlier && highlightOutlier) {
      const pulse = Math.sin(state.clock.elapsedTime * 4) * 0.2 + 1;
      meshRef.current.scale.setScalar(size * pulse);
    } else {
      const targetScale = hovered || isSelected ? size * 1.3 : size;
      meshRef.current.scale.lerp(
        new THREE.Vector3(targetScale, targetScale, targetScale),
        0.1
      );
    }
  });

  const handlePointerOver = useCallback(() => {
    setHovered(true);
    onHover?.(true);
  }, [onHover]);

  const handlePointerOut = useCallback(() => {
    setHovered(false);
    onHover?.(false);
  }, [onHover]);

  return (
    <group position={position}>
      {/* Main node */}
      <mesh
        ref={meshRef}
        onClick={onClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        <sphereGeometry args={[1, 16, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={hovered || isSelected ? 0.8 : point.isOutlier ? 0.5 : 0.2}
          metalness={0.3}
          roughness={0.4}
          transparent
          opacity={0.9}
        />
      </mesh>

      {/* Glow effect */}
      <mesh scale={1.5}>
        <sphereGeometry args={[size, 16, 16]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={hovered || isSelected ? 0.4 : 0.15}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Outlier ring */}
      {point.isOutlier && highlightOutlier && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[size * 1.5, size * 1.8, 32]} />
          <meshBasicMaterial
            color={BSI_COLORS.gold}
            transparent
            opacity={0.6}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* Label */}
      {showLabel && (hovered || isSelected) && (
        <Text
          position={[0, size + 0.3, 0]}
          fontSize={0.2}
          color={BSI_COLORS.cream}
          anchorX="center"
          anchorY="bottom"
          outlineWidth={0.02}
          outlineColor={BSI_COLORS.midnight}
        >
          {point.label}
        </Text>
      )}

      {/* Tooltip */}
      {hovered && (
        <Html position={[0, size + 0.8, 0]} center>
          <div
            className="px-3 py-2 rounded-lg text-xs whitespace-nowrap shadow-xl"
            style={{
              background: `${BSI_COLORS.charcoal}f5`,
              border: `2px solid ${color}`,
              color: BSI_COLORS.cream,
              minWidth: '120px',
            }}
          >
            <div className="font-bold mb-1" style={{ color }}>
              {point.label}
            </div>
            <div className="text-gray-300">
              Value: {point.value.toFixed(2)}
            </div>
            {point.secondaryValue !== undefined && (
              <div className="text-gray-300">
                Secondary: {point.secondaryValue.toFixed(2)}
              </div>
            )}
            {point.category && (
              <div className="text-gray-400 text-xs mt-1">
                {point.category}
              </div>
            )}
            {point.isOutlier && (
              <div className="mt-1" style={{ color: BSI_COLORS.gold }}>
                OUTLIER
              </div>
            )}
          </div>
        </Html>
      )}

      {/* Selection sparkles */}
      {isSelected && (
        <Sparkles
          count={20}
          scale={size * 3}
          size={2}
          speed={0.5}
          color={color}
          opacity={0.8}
        />
      )}
    </group>
  );
}

// ============================================================================
// Connection Lines Component
// ============================================================================

interface ConnectionLinesProps {
  data: DataPoint[];
  positions: Map<string, [number, number, number]>;
  categories: CategoryConfig[];
}

function ConnectionLines({ data, positions, categories }: ConnectionLinesProps) {
  const connections = useMemo(() => {
    const lines: { start: [number, number, number]; end: [number, number, number]; color: string }[] = [];

    data.forEach((point) => {
      if (!point.connections) return;

      const startPos = positions.get(point.id);
      if (!startPos) return;

      point.connections.forEach((connId) => {
        const endPos = positions.get(connId);
        if (!endPos) return;

        // Avoid duplicate connections
        const existingConnection = lines.find(
          (l) =>
            (l.start === startPos && l.end === endPos) ||
            (l.start === endPos && l.end === startPos)
        );
        if (existingConnection) return;

        lines.push({
          start: startPos,
          end: endPos,
          color: getPointColor(point, categories),
        });
      });
    });

    return lines;
  }, [data, positions, categories]);

  return (
    <group>
      {connections.map((conn, i) => (
        <Line
          key={`connection-${i}`}
          points={[conn.start, conn.end]}
          color={conn.color}
          lineWidth={1}
          transparent
          opacity={0.4}
          dashed
          dashScale={10}
          dashSize={0.1}
          dashOffset={0}
        />
      ))}
    </group>
  );
}

// ============================================================================
// Surface Sphere Component
// ============================================================================

interface SurfaceSphereProps {
  data: DataPoint[];
  radius: number;
}

function SurfaceSphere({ data, radius }: SurfaceSphereProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  // Create data texture for surface displacement
  const dataTexture = useMemo(() => {
    const size = 64;
    const data = new Float32Array(size * size * 4);

    // Simple random data for demo - in production, map actual data points
    for (let i = 0; i < size * size * 4; i += 4) {
      data[i] = Math.random() * 0.5;
      data[i + 1] = Math.random();
      data[i + 2] = Math.random();
      data[i + 3] = 1;
    }

    const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat, THREE.FloatType);
    texture.needsUpdate = true;
    return texture;
  }, []);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uBaseColor: { value: new THREE.Color(BSI_COLORS.charcoal) },
      uHighlightColor: { value: new THREE.Color(BSI_COLORS.ember) },
      uDataTexture: { value: dataTexture },
    }),
    [dataTexture]
  );

  useFrame((state) => {
    uniforms.uTime.value = state.clock.elapsedTime;
  });

  return (
    <Sphere ref={meshRef} args={[radius, 64, 64]}>
      <MeshDistortMaterial
        color={BSI_COLORS.charcoal}
        emissive={BSI_COLORS.ember}
        emissiveIntensity={0.1}
        metalness={0.5}
        roughness={0.3}
        transparent
        opacity={0.7}
        distort={0.2}
        speed={2}
        wireframe
      />
    </Sphere>
  );
}

// ============================================================================
// Orb Shell Component
// ============================================================================

interface OrbShellProps {
  radius: number;
  viewMode: ViewMode;
}

function OrbShell({ radius, viewMode }: OrbShellProps) {
  const shellRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (shellRef.current && viewMode !== 'surface') {
      shellRef.current.rotation.y = state.clock.elapsedTime * 0.1;
    }
  });

  return (
    <group>
      {/* Outer wireframe sphere */}
      <Sphere ref={shellRef} args={[radius, 32, 32]}>
        <meshBasicMaterial
          color={BSI_COLORS.ember}
          wireframe
          transparent
          opacity={0.15}
        />
      </Sphere>

      {/* Inner core glow */}
      <Sphere args={[radius * 0.3, 16, 16]}>
        <meshBasicMaterial
          color={BSI_COLORS.ember}
          transparent
          opacity={0.2}
          blending={THREE.AdditiveBlending}
        />
      </Sphere>

      {/* Equator ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[radius * 0.99, radius * 1.01, 64]} />
        <meshBasicMaterial
          color={BSI_COLORS.gold}
          transparent
          opacity={0.3}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Vertical meridian */}
      <mesh>
        <ringGeometry args={[radius * 0.99, radius * 1.01, 64]} />
        <meshBasicMaterial
          color={BSI_COLORS.gold}
          transparent
          opacity={0.3}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

// ============================================================================
// Category Legend Component
// ============================================================================

interface CategoryLegendProps {
  categories: CategoryConfig[];
}

function CategoryLegend({ categories }: CategoryLegendProps) {
  if (categories.length === 0) return null;

  return (
    <Html position={[-4, 3, 0]}>
      <div
        className="px-4 py-3 rounded-lg text-sm"
        style={{
          background: `${BSI_COLORS.charcoal}ee`,
          border: `1px solid ${BSI_COLORS.ember}40`,
          color: BSI_COLORS.cream,
        }}
      >
        <div className="font-bold mb-2" style={{ color: BSI_COLORS.gold }}>
          CATEGORIES
        </div>
        {categories.map((cat) => (
          <div key={cat.id} className="flex items-center gap-2 mb-1">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: cat.color }}
            />
            <span>{cat.name}</span>
          </div>
        ))}
      </div>
    </Html>
  );
}

// ============================================================================
// Main Scene Component
// ============================================================================

interface OrbSceneProps {
  data: DataPoint[];
  categories: CategoryConfig[];
  title: string;
  viewMode: ViewMode;
  autoRotate: boolean;
  autoRotateSpeed: number;
  showConnections: boolean;
  showLabels: boolean;
  enableControls: boolean;
  highlightOutliers: boolean;
  radius: number;
  selectedPoint: string;
  onPointClick?: (point: DataPoint) => void;
  onPointHover?: (point: DataPoint | null) => void;
}

function OrbScene({
  data,
  categories,
  title,
  viewMode,
  autoRotate,
  autoRotateSpeed,
  showConnections,
  showLabels,
  enableControls,
  highlightOutliers,
  radius,
  selectedPoint,
  onPointClick,
  onPointHover,
}: OrbSceneProps) {
  // Calculate min/max values for normalization
  const { minValue, maxValue, minSecondary, maxSecondary } = useMemo(() => {
    const values = data.map((d) => d.value);
    const secondary = data.map((d) => d.secondaryValue ?? 0);
    return {
      minValue: Math.min(...values),
      maxValue: Math.max(...values),
      minSecondary: Math.min(...secondary),
      maxSecondary: Math.max(...secondary),
    };
  }, [data]);

  // Calculate positions for all data points
  const { positions, nodes } = useMemo(() => {
    const positions = new Map<string, [number, number, number]>();
    const nodes: {
      point: DataPoint;
      position: [number, number, number];
      size: number;
      color: string;
    }[] = [];

    data.forEach((point, index) => {
      // Distribute points on sphere surface
      // Use golden angle for even distribution
      const goldenAngle = Math.PI * (3 - Math.sqrt(5));
      const theta = goldenAngle * index;
      const phi = Math.acos(1 - (2 * (index + 0.5)) / data.length);

      // Add some variation based on value
      const valueOffset = (point.value - minValue) / (maxValue - minValue || 1) * 0.3;
      const adjustedRadius = radius * (0.85 + valueOffset);

      const position = toSphericalPosition(phi, theta, adjustedRadius);
      positions.set(point.id, position);

      // Calculate size based on secondary value
      const sizeNorm = point.secondaryValue !== undefined
        ? (point.secondaryValue - minSecondary) / (maxSecondary - minSecondary || 1)
        : 0.5;
      const size = 0.08 + sizeNorm * 0.12;

      nodes.push({
        point,
        position,
        size,
        color: getPointColor(point, categories),
      });
    });

    return { positions, nodes };
  }, [data, categories, radius, minValue, maxValue, minSecondary, maxSecondary]);

  return (
    <>
      {/* Controls */}
      {enableControls && (
        <OrbitControls
          autoRotate={autoRotate}
          autoRotateSpeed={autoRotateSpeed}
          minDistance={radius + 1}
          maxDistance={radius * 4}
          enablePan={false}
        />
      )}

      {/* Title */}
      <Text
        position={[0, radius + 1.5, 0]}
        fontSize={0.5}
        fontWeight="bold"
        color={BSI_COLORS.gold}
        anchorX="center"
        anchorY="middle"
      >
        {title}
      </Text>

      {/* View mode label */}
      <Text
        position={[0, radius + 1, 0]}
        fontSize={0.25}
        color={BSI_COLORS.cream}
        anchorX="center"
        anchorY="middle"
      >
        {viewMode.toUpperCase()} VIEW
      </Text>

      {/* Orb shell */}
      <OrbShell radius={radius} viewMode={viewMode} />

      {/* Surface mode sphere */}
      {viewMode === 'surface' && <SurfaceSphere data={data} radius={radius * 0.9} />}

      {/* Connection lines (network mode) */}
      {(viewMode === 'network' || showConnections) && (
        <ConnectionLines data={data} positions={positions} categories={categories} />
      )}

      {/* Data nodes */}
      {nodes.map((node) => (
        <DataNode
          key={node.point.id}
          point={node.point}
          position={node.position}
          size={node.size}
          color={node.color}
          showLabel={showLabels}
          isSelected={node.point.id === selectedPoint}
          highlightOutlier={highlightOutliers}
          onClick={() => onPointClick?.(node.point)}
          onHover={(hovered) => onPointHover?.(hovered ? node.point : null)}
        />
      ))}

      {/* Category legend */}
      <CategoryLegend categories={categories} />

      {/* Ambient particles */}
      <Sparkles
        count={50}
        scale={radius * 3}
        size={1.5}
        speed={0.2}
        color={BSI_COLORS.ember}
        opacity={0.2}
      />

      {/* Lighting */}
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} intensity={0.8} color={BSI_COLORS.cream} />
      <pointLight position={[-10, -10, -10]} intensity={0.4} color={BSI_COLORS.ember} />
      <spotLight
        position={[0, 15, 0]}
        angle={0.5}
        penumbra={0.5}
        intensity={0.5}
        color={BSI_COLORS.gold}
      />

      <Environment preset="night" />
    </>
  );
}

// ============================================================================
// Main Component Export
// ============================================================================

/**
 * DataOrb3D - Spherical 3D data visualization with stats plotted on a sphere,
 * rotation controls, connection lines, pulsing outlier nodes, and multiple
 * view modes.
 *
 * @example
 * ```tsx
 * <DataOrb3D
 *   data={[
 *     {
 *       id: 'avg',
 *       label: 'Batting Average',
 *       value: 0.295,
 *       secondaryValue: 0.8,
 *       category: 'offense',
 *       isOutlier: false,
 *     },
 *     {
 *       id: 'hr',
 *       label: 'Home Runs',
 *       value: 45,
 *       secondaryValue: 0.9,
 *       category: 'power',
 *       isOutlier: true,
 *       connections: ['rbi', 'slg'],
 *     },
 *     // ... more points
 *   ]}
 *   categories={[
 *     { id: 'offense', name: 'Offense', color: '#22c55e' },
 *     { id: 'power', name: 'Power', color: '#ef4444' },
 *     { id: 'speed', name: 'Speed', color: '#3b82f6' },
 *   ]}
 *   title="Player Profile Orb"
 *   viewMode="network"
 *   autoRotate
 *   showConnections
 *   highlightOutliers
 * />
 * ```
 */
export function DataOrb3D({
  data,
  categories = [],
  title = 'DATA ORB',
  viewMode = 'scatter',
  autoRotate = true,
  autoRotateSpeed = 0.5,
  showConnections = false,
  showLabels = true,
  enableControls = true,
  highlightOutliers = true,
  radius = 2.5,
  selectedPoint = '',
  onPointClick,
  onPointHover,
  className = '',
  style = {},
}: DataOrb3DProps) {
  return (
    <div
      className={`w-full h-full min-h-[400px] ${className}`}
      style={{
        background: `radial-gradient(ellipse at center, ${BSI_COLORS.charcoal} 0%, ${BSI_COLORS.midnight} 100%)`,
        ...style,
      }}
    >
      <Canvas
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
        camera={{ position: [0, 0, radius * 3], fov: 50 }}
      >
        <OrbScene
          data={data}
          categories={categories}
          title={title}
          viewMode={viewMode}
          autoRotate={autoRotate}
          autoRotateSpeed={autoRotateSpeed}
          showConnections={showConnections}
          showLabels={showLabels}
          enableControls={enableControls}
          highlightOutliers={highlightOutliers}
          radius={radius}
          selectedPoint={selectedPoint}
          onPointClick={onPointClick}
          onPointHover={onPointHover}
        />
      </Canvas>
    </div>
  );
}

export default DataOrb3D;
