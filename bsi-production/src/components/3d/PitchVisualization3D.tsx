/**
 * PitchVisualization3D.tsx
 * Real-time 3D pitch tracking visualization with holographic strike zone,
 * pitch trails with ember glow, spin rate wireframe, exit velocity effects,
 * and historical pitch overlay.
 *
 * @module components/3d/PitchVisualization3D
 * @requires @react-three/fiber
 * @requires @react-three/drei
 */

import React, { useRef, useMemo, useState, useEffect, useCallback } from 'react';
import { Canvas, useFrame, extend, useThree } from '@react-three/fiber';
import {
  Text,
  Line,
  OrbitControls,
  PerspectiveCamera,
  Environment,
  Trail,
  Sparkles,
  Html,
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

/** Pitch type classification */
export type PitchType =
  | 'fastball'
  | 'curveball'
  | 'slider'
  | 'changeup'
  | 'cutter'
  | 'sinker'
  | 'splitter'
  | 'knuckleball';

/** Pitch result classification */
export type PitchResult =
  | 'ball'
  | 'called_strike'
  | 'swinging_strike'
  | 'foul'
  | 'in_play'
  | 'hit_by_pitch';

/** Single pitch data */
export interface PitchData {
  /** Unique pitch identifier */
  id: string;
  /** Type of pitch thrown */
  type: PitchType;
  /** Velocity in MPH */
  velocity: number;
  /** Spin rate in RPM */
  spinRate: number;
  /** Horizontal break in inches */
  horizontalBreak: number;
  /** Vertical break in inches */
  verticalBreak: number;
  /** Final location X (-1 to 1, relative to strike zone center) */
  locationX: number;
  /** Final location Y (-1 to 1, relative to strike zone center) */
  locationY: number;
  /** Result of the pitch */
  result: PitchResult;
  /** Release point [x, y, z] in feet from rubber */
  releasePoint?: [number, number, number];
  /** Exit velocity if ball was hit */
  exitVelocity?: number;
  /** Launch angle if ball was hit */
  launchAngle?: number;
  /** Timestamp */
  timestamp?: number;
}

/** Strike zone dimensions */
export interface StrikeZone {
  /** Top of zone in feet */
  top: number;
  /** Bottom of zone in feet */
  bottom: number;
  /** Width in feet (17 inches standard = 1.417 ft) */
  width: number;
}

/** Props for PitchVisualization3D */
export interface PitchVisualization3DProps {
  /** Array of pitch data to display */
  pitches: PitchData[];
  /** Currently active/highlighted pitch */
  activePitch?: PitchData | null;
  /** Strike zone dimensions */
  strikeZone?: StrikeZone;
  /** Show pitch trails */
  showTrails?: boolean;
  /** Show spin visualization */
  showSpinRate?: boolean;
  /** Show exit velocity effects */
  showExitVelocity?: boolean;
  /** Show historical overlay */
  showHistory?: boolean;
  /** Filter history by pitch type */
  historyFilter?: PitchType[];
  /** Camera view preset */
  viewAngle?: 'catcher' | 'pitcher' | 'broadcast' | 'overhead';
  /** Enable camera controls */
  enableControls?: boolean;
  /** Callback when pitch is selected */
  onPitchSelect?: (pitch: PitchData) => void;
  /** Custom className */
  className?: string;
  /** Custom styles */
  style?: React.CSSProperties;
}

// ============================================================================
// Utility Functions
// ============================================================================

/** Get color for pitch type */
function getPitchColor(type: PitchType): string {
  const colors: Record<PitchType, string> = {
    fastball: '#ef4444', // Red
    curveball: '#8b5cf6', // Purple
    slider: '#3b82f6', // Blue
    changeup: '#22c55e', // Green
    cutter: '#f97316', // Orange
    sinker: '#ec4899', // Pink
    splitter: '#14b8a6', // Teal
    knuckleball: '#a3a3a3', // Gray
  };
  return colors[type];
}

/** Get result indicator color */
function getResultColor(result: PitchResult): string {
  const colors: Record<PitchResult, string> = {
    ball: '#22c55e', // Green
    called_strike: '#ef4444', // Red
    swinging_strike: '#f97316', // Orange
    foul: '#eab308', // Yellow
    in_play: '#3b82f6', // Blue
    hit_by_pitch: '#a855f7', // Purple
  };
  return colors[result];
}

// ============================================================================
// Shader Definitions
// ============================================================================

/** Ember glow shader for pitch trails */
const emberTrailVertexShader = `
  attribute float alpha;
  varying float vAlpha;
  varying vec2 vUv;

  void main() {
    vAlpha = alpha;
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const emberTrailFragmentShader = `
  uniform vec3 uColor;
  uniform float uTime;

  varying float vAlpha;
  varying vec2 vUv;

  void main() {
    // Core glow
    float core = 1.0 - length(vUv - 0.5) * 2.0;
    core = smoothstep(0.0, 0.5, core);

    // Flicker effect
    float flicker = sin(uTime * 10.0 + vUv.x * 20.0) * 0.1 + 0.9;

    // Color gradient from center to edge
    vec3 coreColor = uColor * 1.5;
    vec3 edgeColor = uColor * 0.5;
    vec3 color = mix(edgeColor, coreColor, core) * flicker;

    float alpha = vAlpha * core * 0.8;

    gl_FragColor = vec4(color, alpha);
  }
`;

/** Holographic strike zone shader */
const holoZoneVertexShader = `
  varying vec2 vUv;
  varying vec3 vNormal;

  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const holoZoneFragmentShader = `
  uniform float uTime;
  uniform vec3 uColor;

  varying vec2 vUv;
  varying vec3 vNormal;

  void main() {
    // Grid pattern
    float gridX = step(0.98, fract(vUv.x * 10.0));
    float gridY = step(0.98, fract(vUv.y * 10.0));
    float grid = max(gridX, gridY) * 0.5;

    // Edge glow
    float edgeX = smoothstep(0.0, 0.05, vUv.x) * smoothstep(1.0, 0.95, vUv.x);
    float edgeY = smoothstep(0.0, 0.05, vUv.y) * smoothstep(1.0, 0.95, vUv.y);
    float edge = 1.0 - (edgeX * edgeY);

    // Scanline
    float scanline = sin(vUv.y * 50.0 + uTime * 3.0) * 0.5 + 0.5;
    scanline = smoothstep(0.4, 0.6, scanline) * 0.1;

    // Fresnel
    float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 2.0);

    vec3 color = uColor + edge * 0.5 + scanline;
    float alpha = (0.1 + grid * 0.3 + edge * 0.4 + fresnel * 0.3) * 0.8;

    gl_FragColor = vec4(color, alpha);
  }
`;

// ============================================================================
// Strike Zone Component
// ============================================================================

interface StrikeZoneDisplayProps {
  zone: StrikeZone;
}

function StrikeZoneDisplay({ zone }: StrikeZoneDisplayProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uColor: { value: new THREE.Color(BSI_COLORS.ember) },
  }), []);

  useFrame((state) => {
    uniforms.uTime.value = state.clock.elapsedTime;
  });

  const height = zone.top - zone.bottom;
  const centerY = (zone.top + zone.bottom) / 2;

  return (
    <group position={[0, centerY, 0]}>
      {/* Main zone plane */}
      <mesh ref={meshRef}>
        <planeGeometry args={[zone.width, height]} />
        <shaderMaterial
          vertexShader={holoZoneVertexShader}
          fragmentShader={holoZoneFragmentShader}
          uniforms={uniforms}
          transparent
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Zone frame */}
      <Line
        points={[
          [-zone.width / 2, -height / 2, 0],
          [zone.width / 2, -height / 2, 0],
          [zone.width / 2, height / 2, 0],
          [-zone.width / 2, height / 2, 0],
          [-zone.width / 2, -height / 2, 0],
        ]}
        color={BSI_COLORS.ember}
        lineWidth={2}
        transparent
        opacity={0.8}
      />

      {/* Inner grid lines */}
      {[1, 2].map((i) => (
        <React.Fragment key={`grid-${i}`}>
          <Line
            points={[
              [-zone.width / 2 + (zone.width / 3) * i, -height / 2, 0],
              [-zone.width / 2 + (zone.width / 3) * i, height / 2, 0],
            ]}
            color={BSI_COLORS.ember}
            lineWidth={1}
            transparent
            opacity={0.3}
          />
          <Line
            points={[
              [-zone.width / 2, -height / 2 + (height / 3) * i, 0],
              [zone.width / 2, -height / 2 + (height / 3) * i, 0],
            ]}
            color={BSI_COLORS.ember}
            lineWidth={1}
            transparent
            opacity={0.3}
          />
        </React.Fragment>
      ))}

      {/* Zone labels */}
      <Text
        position={[0, height / 2 + 0.15, 0]}
        fontSize={0.1}
        color={BSI_COLORS.cream}
        anchorX="center"
      >
        K-ZONE
      </Text>
    </group>
  );
}

// ============================================================================
// Pitch Ball Component
// ============================================================================

interface PitchBallProps {
  pitch: PitchData;
  zone: StrikeZone;
  isActive: boolean;
  showSpinRate: boolean;
  onClick?: () => void;
}

function PitchBall({ pitch, zone, isActive, showSpinRate, onClick }: PitchBallProps) {
  const groupRef = useRef<THREE.Group>(null);
  const spinRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  const pitchColor = getPitchColor(pitch.type);
  const zoneHeight = zone.top - zone.bottom;
  const zoneCenterY = (zone.top + zone.bottom) / 2;

  // Convert normalized location to 3D position
  const position: [number, number, number] = [
    pitch.locationX * (zone.width / 2),
    zoneCenterY + pitch.locationY * (zoneHeight / 2),
    0.1,
  ];

  useFrame((state, delta) => {
    if (spinRef.current && showSpinRate) {
      // Spin rate visualization: rotate based on RPM
      const rotationSpeed = (pitch.spinRate / 2000) * 10;
      spinRef.current.rotation.z += delta * rotationSpeed;
    }

    if (groupRef.current && (isActive || hovered)) {
      const pulse = Math.sin(state.clock.elapsedTime * 4) * 0.1 + 1;
      groupRef.current.scale.setScalar(pulse);
    }
  });

  return (
    <group
      ref={groupRef}
      position={position}
      onClick={onClick}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      {/* Main ball */}
      <mesh>
        <sphereGeometry args={[0.06, 16, 16]} />
        <meshStandardMaterial
          color={pitchColor}
          emissive={pitchColor}
          emissiveIntensity={isActive || hovered ? 0.8 : 0.3}
          metalness={0.3}
          roughness={0.4}
        />
      </mesh>

      {/* Spin rate wireframe visualization */}
      {showSpinRate && (
        <mesh ref={spinRef}>
          <torusGeometry args={[0.1, 0.01, 8, 16]} />
          <meshBasicMaterial
            color={pitchColor}
            wireframe
            transparent
            opacity={0.6}
          />
        </mesh>
      )}

      {/* Glow effect */}
      <mesh>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshBasicMaterial
          color={pitchColor}
          transparent
          opacity={isActive || hovered ? 0.3 : 0.1}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Info tooltip on hover */}
      {hovered && (
        <Html position={[0.2, 0.2, 0]} center>
          <div
            className="px-3 py-2 rounded-lg text-xs whitespace-nowrap"
            style={{
              background: `${BSI_COLORS.charcoal}ee`,
              border: `1px solid ${pitchColor}`,
              color: BSI_COLORS.cream,
            }}
          >
            <div className="font-bold" style={{ color: pitchColor }}>
              {pitch.type.toUpperCase()}
            </div>
            <div>{pitch.velocity} MPH</div>
            <div>{pitch.spinRate} RPM</div>
            <div className="mt-1" style={{ color: getResultColor(pitch.result) }}>
              {pitch.result.replace('_', ' ').toUpperCase()}
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

// ============================================================================
// Pitch Trail Component
// ============================================================================

interface PitchTrailProps {
  pitch: PitchData;
  zone: StrikeZone;
  isActive: boolean;
}

function PitchTrail({ pitch, zone, isActive }: PitchTrailProps) {
  const lineRef = useRef<THREE.Line>(null);
  const pitchColor = getPitchColor(pitch.type);

  const zoneHeight = zone.top - zone.bottom;
  const zoneCenterY = (zone.top + zone.bottom) / 2;

  // Generate curved trajectory based on pitch breaks
  const points = useMemo(() => {
    const startZ = -6; // ~60 feet from plate
    const endZ = 0;
    const segments = 30;

    const pts: THREE.Vector3[] = [];

    // Release point (or default)
    const releaseX = pitch.releasePoint?.[0] ?? 0;
    const releaseY = pitch.releasePoint?.[1] ?? 6;

    // End point
    const endX = pitch.locationX * (zone.width / 2);
    const endY = zoneCenterY + pitch.locationY * (zoneHeight / 2);

    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const z = startZ + (endZ - startZ) * t;

      // Apply break curves (quadratic easing for realistic break)
      const breakT = t * t; // More break near the plate
      const x = releaseX + (endX - releaseX) * t +
        (pitch.horizontalBreak / 12) * breakT * Math.sin(t * Math.PI);
      const y = releaseY + (endY - releaseY) * t +
        (pitch.verticalBreak / 12) * breakT * Math.sin(t * Math.PI);

      pts.push(new THREE.Vector3(x, y, z));
    }

    return pts;
  }, [pitch, zone, zoneHeight, zoneCenterY]);

  return (
    <group>
      <Line
        points={points}
        color={pitchColor}
        lineWidth={isActive ? 3 : 1.5}
        transparent
        opacity={isActive ? 0.9 : 0.4}
      />

      {/* Glowing trail effect */}
      {isActive && (
        <Line
          points={points}
          color={pitchColor}
          lineWidth={8}
          transparent
          opacity={0.15}
        />
      )}
    </group>
  );
}

// ============================================================================
// Exit Velocity Explosion Component
// ============================================================================

interface ExitVelocityEffectProps {
  pitch: PitchData;
  zone: StrikeZone;
}

function ExitVelocityEffect({ pitch, zone }: ExitVelocityEffectProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [visible, setVisible] = useState(true);

  const zoneHeight = zone.top - zone.bottom;
  const zoneCenterY = (zone.top + zone.bottom) / 2;

  const position: [number, number, number] = [
    pitch.locationX * (zone.width / 2),
    zoneCenterY + pitch.locationY * (zoneHeight / 2),
    0.2,
  ];

  const exitVelocity = pitch.exitVelocity ?? 0;
  const intensity = Math.min(exitVelocity / 110, 1); // Normalize to 110 MPH max

  useFrame((state) => {
    if (groupRef.current) {
      const scale = 1 + Math.sin(state.clock.elapsedTime * 5) * 0.2 * intensity;
      groupRef.current.scale.setScalar(scale);
    }
  });

  if (!pitch.exitVelocity || pitch.result !== 'in_play') return null;

  // Color based on exit velocity
  const getExitVelocityColor = (ev: number): string => {
    if (ev >= 100) return '#ef4444'; // Hard hit - Red
    if (ev >= 95) return '#f97316'; // Well hit - Orange
    if (ev >= 85) return '#eab308'; // Medium - Yellow
    return '#22c55e'; // Soft - Green
  };

  const color = getExitVelocityColor(exitVelocity);

  return (
    <group ref={groupRef} position={position}>
      {/* Explosion ring */}
      <mesh>
        <ringGeometry args={[0.15 * intensity, 0.2 * intensity, 32]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.6}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Inner burst */}
      <mesh>
        <circleGeometry args={[0.1 * intensity, 16]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.4}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Exit velocity label */}
      <Text
        position={[0, 0.25, 0]}
        fontSize={0.08}
        color={color}
        anchorX="center"
        fontWeight="bold"
      >
        {exitVelocity} MPH
      </Text>

      {/* Launch angle indicator */}
      {pitch.launchAngle !== undefined && (
        <Text
          position={[0, 0.35, 0]}
          fontSize={0.06}
          color={BSI_COLORS.cream}
          anchorX="center"
        >
          {pitch.launchAngle}deg
        </Text>
      )}

      {/* Sparkles for hard-hit balls */}
      {exitVelocity >= 95 && (
        <Sparkles
          count={20}
          scale={0.5}
          size={3}
          speed={1}
          color={color}
          opacity={0.8}
        />
      )}
    </group>
  );
}

// ============================================================================
// Home Plate Component
// ============================================================================

function HomePlate() {
  const shape = useMemo(() => {
    const s = new THREE.Shape();
    const w = 0.708; // 17 inches in feet / 2
    const h = 0.708;

    s.moveTo(0, h / 2);
    s.lineTo(w, h / 4);
    s.lineTo(w, -h / 4);
    s.lineTo(0, -h / 2);
    s.lineTo(-w, -h / 4);
    s.lineTo(-w, h / 4);
    s.closePath();

    return s;
  }, []);

  return (
    <group position={[0, 0, 0.5]} rotation={[-Math.PI / 2, 0, 0]}>
      <mesh>
        <shapeGeometry args={[shape]} />
        <meshStandardMaterial
          color={BSI_COLORS.cream}
          metalness={0.1}
          roughness={0.8}
        />
      </mesh>
      <Line
        points={[
          [0, 0.354, 0.01],
          [0.354, 0.177, 0.01],
          [0.354, -0.177, 0.01],
          [0, -0.354, 0.01],
          [-0.354, -0.177, 0.01],
          [-0.354, 0.177, 0.01],
          [0, 0.354, 0.01],
        ]}
        color={BSI_COLORS.charcoal}
        lineWidth={2}
      />
    </group>
  );
}

// ============================================================================
// Pitch Type Legend Component
// ============================================================================

interface PitchLegendProps {
  pitchTypes: PitchType[];
}

function PitchLegend({ pitchTypes }: PitchLegendProps) {
  const uniqueTypes = [...new Set(pitchTypes)];

  return (
    <Html position={[-2.5, 3, 0]}>
      <div
        className="px-3 py-2 rounded-lg text-xs"
        style={{
          background: `${BSI_COLORS.charcoal}ee`,
          border: `1px solid ${BSI_COLORS.ember}40`,
          color: BSI_COLORS.cream,
        }}
      >
        <div className="font-bold mb-2 text-center" style={{ color: BSI_COLORS.gold }}>
          PITCH TYPES
        </div>
        <div className="space-y-1">
          {uniqueTypes.map((type) => (
            <div key={type} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: getPitchColor(type) }}
              />
              <span className="capitalize">{type}</span>
            </div>
          ))}
        </div>
      </div>
    </Html>
  );
}

// ============================================================================
// Camera Controller
// ============================================================================

interface CameraControllerProps {
  viewAngle: 'catcher' | 'pitcher' | 'broadcast' | 'overhead';
}

function CameraController({ viewAngle }: CameraControllerProps) {
  const { camera } = useThree();

  useEffect(() => {
    const positions: Record<string, [number, number, number]> = {
      catcher: [0, 3, 5],
      pitcher: [0, 6, -8],
      broadcast: [4, 4, 4],
      overhead: [0, 8, 0],
    };

    const lookAt: Record<string, [number, number, number]> = {
      catcher: [0, 2.5, 0],
      pitcher: [0, 2.5, 0],
      broadcast: [0, 2.5, 0],
      overhead: [0, 2.5, -3],
    };

    const pos = positions[viewAngle];
    const target = lookAt[viewAngle];

    camera.position.set(...pos);
    camera.lookAt(...target);
  }, [viewAngle, camera]);

  return null;
}

// ============================================================================
// Main Scene Component
// ============================================================================

interface PitchSceneProps {
  pitches: PitchData[];
  activePitch: PitchData | null;
  strikeZone: StrikeZone;
  showTrails: boolean;
  showSpinRate: boolean;
  showExitVelocity: boolean;
  showHistory: boolean;
  historyFilter: PitchType[];
  viewAngle: 'catcher' | 'pitcher' | 'broadcast' | 'overhead';
  enableControls: boolean;
  onPitchSelect?: (pitch: PitchData) => void;
}

function PitchScene({
  pitches,
  activePitch,
  strikeZone,
  showTrails,
  showSpinRate,
  showExitVelocity,
  showHistory,
  historyFilter,
  viewAngle,
  enableControls,
  onPitchSelect,
}: PitchSceneProps) {
  // Filter pitches for display
  const displayPitches = useMemo(() => {
    if (!showHistory) {
      return activePitch ? [activePitch] : [];
    }
    if (historyFilter.length > 0) {
      return pitches.filter((p) => historyFilter.includes(p.type));
    }
    return pitches;
  }, [pitches, activePitch, showHistory, historyFilter]);

  const pitchTypes = useMemo(() => pitches.map((p) => p.type), [pitches]);

  return (
    <>
      {/* Camera setup */}
      <CameraController viewAngle={viewAngle} />
      {enableControls && (
        <OrbitControls
          minDistance={3}
          maxDistance={15}
          minPolarAngle={Math.PI / 6}
          maxPolarAngle={Math.PI / 2}
          target={[0, 2.5, 0]}
        />
      )}

      {/* Strike zone */}
      <StrikeZoneDisplay zone={strikeZone} />

      {/* Home plate */}
      <HomePlate />

      {/* Pitch trails */}
      {showTrails &&
        displayPitches.map((pitch) => (
          <PitchTrail
            key={`trail-${pitch.id}`}
            pitch={pitch}
            zone={strikeZone}
            isActive={activePitch?.id === pitch.id}
          />
        ))}

      {/* Pitch balls */}
      {displayPitches.map((pitch) => (
        <PitchBall
          key={`ball-${pitch.id}`}
          pitch={pitch}
          zone={strikeZone}
          isActive={activePitch?.id === pitch.id}
          showSpinRate={showSpinRate}
          onClick={() => onPitchSelect?.(pitch)}
        />
      ))}

      {/* Exit velocity effects */}
      {showExitVelocity &&
        displayPitches
          .filter((p) => p.exitVelocity && p.result === 'in_play')
          .map((pitch) => (
            <ExitVelocityEffect
              key={`exit-${pitch.id}`}
              pitch={pitch}
              zone={strikeZone}
            />
          ))}

      {/* Legend */}
      {showHistory && pitchTypes.length > 0 && (
        <PitchLegend pitchTypes={pitchTypes} />
      )}

      {/* Ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[10, 15]} />
        <meshStandardMaterial
          color={BSI_COLORS.texasSoil}
          metalness={0}
          roughness={1}
          transparent
          opacity={0.3}
        />
      </mesh>

      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[5, 10, 5]}
        intensity={0.8}
        color={BSI_COLORS.cream}
        castShadow
      />
      <pointLight
        position={[0, 5, 0]}
        intensity={0.5}
        color={BSI_COLORS.ember}
      />
      <spotLight
        position={[0, 8, -5]}
        angle={0.4}
        penumbra={0.5}
        intensity={0.6}
        color={BSI_COLORS.gold}
      />

      {/* Background particles */}
      <Sparkles
        count={30}
        scale={10}
        size={2}
        speed={0.1}
        color={BSI_COLORS.ember}
        opacity={0.2}
      />

      <Environment preset="night" />
    </>
  );
}

// ============================================================================
// Main Component Export
// ============================================================================

/**
 * PitchVisualization3D - Real-time 3D pitch tracking visualization with
 * holographic strike zone, pitch trails, spin rate visualization, and
 * exit velocity effects.
 *
 * @example
 * ```tsx
 * <PitchVisualization3D
 *   pitches={[
 *     {
 *       id: '1',
 *       type: 'fastball',
 *       velocity: 96,
 *       spinRate: 2400,
 *       horizontalBreak: 3,
 *       verticalBreak: 12,
 *       locationX: 0.2,
 *       locationY: 0.3,
 *       result: 'swinging_strike',
 *     },
 *     // ... more pitches
 *   ]}
 *   activePitch={selectedPitch}
 *   showTrails
 *   showSpinRate
 *   showHistory
 *   viewAngle="catcher"
 *   enableControls
 *   onPitchSelect={(pitch) => setSelectedPitch(pitch)}
 * />
 * ```
 */
export function PitchVisualization3D({
  pitches,
  activePitch = null,
  strikeZone = { top: 3.5, bottom: 1.5, width: 1.417 },
  showTrails = true,
  showSpinRate = true,
  showExitVelocity = true,
  showHistory = true,
  historyFilter = [],
  viewAngle = 'catcher',
  enableControls = true,
  onPitchSelect,
  className = '',
  style = {},
}: PitchVisualization3DProps) {
  return (
    <div
      className={`w-full h-full min-h-[400px] ${className}`}
      style={{
        background: `linear-gradient(180deg, ${BSI_COLORS.midnight} 0%, ${BSI_COLORS.charcoal} 100%)`,
        ...style,
      }}
    >
      <Canvas
        shadows
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
        camera={{ position: [0, 3, 5], fov: 60 }}
      >
        <PitchScene
          pitches={pitches}
          activePitch={activePitch}
          strikeZone={strikeZone}
          showTrails={showTrails}
          showSpinRate={showSpinRate}
          showExitVelocity={showExitVelocity}
          showHistory={showHistory}
          historyFilter={historyFilter}
          viewAngle={viewAngle}
          enableControls={enableControls}
          onPitchSelect={onPitchSelect}
        />
      </Canvas>
    </div>
  );
}

export default PitchVisualization3D;
