/**
 * StadiumOverview3D.tsx
 * Bird's eye 3D stadium view with low-poly stylized model, real-time player
 * position dots, heat map overlay capability, camera controls, and day/night
 * lighting cycle.
 *
 * @module components/3d/StadiumOverview3D
 * @requires @react-three/fiber
 * @requires @react-three/drei
 */

import React, { useRef, useMemo, useState, useEffect, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import {
  OrbitControls,
  PerspectiveCamera,
  Text,
  Line,
  Environment,
  Sky,
  Stars,
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

/** Player position on field */
export interface FieldPosition {
  /** Player identifier */
  playerId: string;
  /** Player name for display */
  playerName: string;
  /** Defensive position */
  position: string;
  /** X coordinate (feet from home plate, positive = right field) */
  x: number;
  /** Y coordinate (feet from home plate, positive = outfield) */
  y: number;
  /** Team identifier */
  teamId: 'home' | 'away';
  /** Color override */
  color?: string;
}

/** Heat map data point */
export interface HeatMapPoint {
  /** X coordinate */
  x: number;
  /** Y coordinate */
  y: number;
  /** Intensity value (0-1) */
  intensity: number;
}

/** Heat map configuration */
export interface HeatMapConfig {
  /** Heat map data points */
  data: HeatMapPoint[];
  /** Display label */
  label: string;
  /** Color gradient start */
  colorStart?: string;
  /** Color gradient end */
  colorEnd?: string;
  /** Opacity */
  opacity?: number;
}

/** Stadium configuration */
export interface StadiumConfig {
  /** Stadium name */
  name: string;
  /** Left field wall distance (feet) */
  leftFieldDistance: number;
  /** Center field wall distance (feet) */
  centerFieldDistance: number;
  /** Right field wall distance (feet) */
  rightFieldDistance: number;
  /** Left field wall height (feet) */
  leftFieldWallHeight?: number;
  /** Right field wall height (feet) */
  rightFieldWallHeight?: number;
  /** Team primary color */
  primaryColor?: string;
  /** Team secondary color */
  secondaryColor?: string;
}

/** Time of day setting */
export type TimeOfDay = 'day' | 'sunset' | 'night';

/** Camera view preset */
export type CameraView = 'overview' | 'home_plate' | 'center_field' | 'press_box' | 'first_base' | 'third_base';

/** Props for StadiumOverview3D */
export interface StadiumOverview3DProps {
  /** Stadium configuration */
  stadium?: StadiumConfig;
  /** Player positions on field */
  playerPositions?: FieldPosition[];
  /** Heat map overlay data */
  heatMap?: HeatMapConfig | null;
  /** Time of day for lighting */
  timeOfDay?: TimeOfDay;
  /** Camera view preset */
  cameraView?: CameraView;
  /** Enable camera controls */
  enableControls?: boolean;
  /** Show distance markers */
  showDistanceMarkers?: boolean;
  /** Show zone labels */
  showZoneLabels?: boolean;
  /** Home team color */
  homeColor?: string;
  /** Away team color */
  awayColor?: string;
  /** Callback when player position is clicked */
  onPlayerClick?: (position: FieldPosition) => void;
  /** Callback when camera view changes */
  onViewChange?: (view: CameraView) => void;
  /** Custom className */
  className?: string;
  /** Custom styles */
  style?: React.CSSProperties;
}

// ============================================================================
// Default Stadium Configuration (Generic MLB Park)
// ============================================================================
const DEFAULT_STADIUM: StadiumConfig = {
  name: 'Baseball Stadium',
  leftFieldDistance: 330,
  centerFieldDistance: 400,
  rightFieldDistance: 330,
  leftFieldWallHeight: 8,
  rightFieldWallHeight: 8,
  primaryColor: BSI_COLORS.burntOrange,
  secondaryColor: BSI_COLORS.charcoal,
};

// ============================================================================
// Utility Functions
// ============================================================================

/** Convert feet to Three.js units (1 unit = 10 feet) */
function feetToUnits(feet: number): number {
  return feet / 10;
}

/** Get camera position for view preset */
function getCameraPosition(view: CameraView): [number, number, number] {
  const positions: Record<CameraView, [number, number, number]> = {
    overview: [0, 80, 20],
    home_plate: [0, 15, -5],
    center_field: [0, 20, 50],
    press_box: [0, 40, -20],
    first_base: [25, 20, 10],
    third_base: [-25, 20, 10],
  };
  return positions[view];
}

/** Get camera look-at target for view preset */
function getCameraTarget(view: CameraView): [number, number, number] {
  const targets: Record<CameraView, [number, number, number]> = {
    overview: [0, 0, 20],
    home_plate: [0, 0, 15],
    center_field: [0, 0, 10],
    press_box: [0, 0, 20],
    first_base: [0, 0, 15],
    third_base: [0, 0, 15],
  };
  return targets[view];
}

// ============================================================================
// Infield Diamond Component
// ============================================================================

function InfieldDiamond() {
  const baseDistance = feetToUnits(90); // 90 feet between bases

  // Base positions (diamond rotated 45 degrees)
  const homePos: [number, number, number] = [0, 0.1, 0];
  const firstPos: [number, number, number] = [baseDistance * 0.707, 0.1, baseDistance * 0.707];
  const secondPos: [number, number, number] = [0, 0.1, baseDistance * 1.414];
  const thirdPos: [number, number, number] = [-baseDistance * 0.707, 0.1, baseDistance * 0.707];

  return (
    <group>
      {/* Infield dirt */}
      <mesh rotation={[-Math.PI / 2, 0, Math.PI / 4]} position={[0, 0.01, baseDistance * 0.707]}>
        <ringGeometry args={[0, feetToUnits(95), 32]} />
        <meshStandardMaterial color={BSI_COLORS.texasSoil} />
      </mesh>

      {/* Base paths */}
      <Line
        points={[homePos, firstPos, secondPos, thirdPos, homePos]}
        color={BSI_COLORS.cream}
        lineWidth={2}
      />

      {/* Home plate */}
      <mesh position={homePos} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.3, 5]} />
        <meshStandardMaterial color={BSI_COLORS.cream} />
      </mesh>

      {/* Bases */}
      {[firstPos, secondPos, thirdPos].map((pos, i) => (
        <mesh key={`base-${i}`} position={pos} rotation={[-Math.PI / 2, 0, Math.PI / 4]}>
          <planeGeometry args={[0.5, 0.5]} />
          <meshStandardMaterial color={BSI_COLORS.cream} />
        </mesh>
      ))}

      {/* Pitcher's mound */}
      <mesh position={[0, 0.2, feetToUnits(60.5)]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[feetToUnits(9), 32]} />
        <meshStandardMaterial color={BSI_COLORS.texasSoil} />
      </mesh>

      {/* Pitcher's rubber */}
      <mesh position={[0, 0.25, feetToUnits(60.5)]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.2, 0.5]} />
        <meshStandardMaterial color={BSI_COLORS.cream} />
      </mesh>
    </group>
  );
}

// ============================================================================
// Outfield Grass Component
// ============================================================================

interface OutfieldGrassProps {
  stadium: StadiumConfig;
}

function OutfieldGrass({ stadium }: OutfieldGrassProps) {
  const shape = useMemo(() => {
    const s = new THREE.Shape();
    const lf = feetToUnits(stadium.leftFieldDistance);
    const cf = feetToUnits(stadium.centerFieldDistance);
    const rf = feetToUnits(stadium.rightFieldDistance);

    // Create outfield arc
    s.moveTo(-lf * 0.8, 0);

    // Curved outfield wall (bezier curves for realistic shape)
    s.quadraticCurveTo(-lf * 0.5, lf * 0.5, -cf * 0.2, cf * 0.95);
    s.quadraticCurveTo(0, cf, cf * 0.2, cf * 0.95);
    s.quadraticCurveTo(rf * 0.5, rf * 0.5, rf * 0.8, 0);

    // Close back to home
    s.lineTo(0, -2);
    s.lineTo(-lf * 0.8, 0);

    return s;
  }, [stadium]);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, feetToUnits(200)]}>
      <shapeGeometry args={[shape]} />
      <meshStandardMaterial color="#2d5a27" />
    </mesh>
  );
}

// ============================================================================
// Outfield Wall Component
// ============================================================================

interface OutfieldWallProps {
  stadium: StadiumConfig;
}

function OutfieldWall({ stadium }: OutfieldWallProps) {
  const wallHeight = feetToUnits(stadium.leftFieldWallHeight ?? 8);

  const points = useMemo(() => {
    const lf = feetToUnits(stadium.leftFieldDistance);
    const cf = feetToUnits(stadium.centerFieldDistance);
    const rf = feetToUnits(stadium.rightFieldDistance);

    const pts: [number, number, number][] = [];
    const segments = 50;

    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const angle = Math.PI * 0.1 + Math.PI * 0.8 * t;

      // Interpolate distance based on angle
      let distance: number;
      if (t < 0.33) {
        distance = THREE.MathUtils.lerp(lf, cf, t * 3);
      } else if (t < 0.67) {
        distance = cf;
      } else {
        distance = THREE.MathUtils.lerp(cf, rf, (t - 0.67) * 3);
      }

      const x = Math.cos(angle) * distance * 0.85;
      const z = Math.sin(angle) * distance * 0.9 + feetToUnits(100);

      pts.push([x, 0, z]);
    }

    return pts;
  }, [stadium]);

  return (
    <group>
      {/* Wall base */}
      {points.slice(0, -1).map((pt, i) => {
        const nextPt = points[i + 1];
        const midX = (pt[0] + nextPt[0]) / 2;
        const midZ = (pt[2] + nextPt[2]) / 2;
        const angle = Math.atan2(nextPt[0] - pt[0], nextPt[2] - pt[2]);
        const width = Math.sqrt(
          Math.pow(nextPt[0] - pt[0], 2) + Math.pow(nextPt[2] - pt[2], 2)
        );

        return (
          <mesh
            key={`wall-${i}`}
            position={[midX, wallHeight / 2, midZ]}
            rotation={[0, angle, 0]}
          >
            <boxGeometry args={[width * 1.1, wallHeight, 0.3]} />
            <meshStandardMaterial
              color={stadium.secondaryColor ?? BSI_COLORS.charcoal}
            />
          </mesh>
        );
      })}

      {/* Warning track */}
      <Line
        points={points}
        color={BSI_COLORS.texasSoil}
        lineWidth={8}
      />
    </group>
  );
}

// ============================================================================
// Distance Markers Component
// ============================================================================

interface DistanceMarkersProps {
  stadium: StadiumConfig;
}

function DistanceMarkers({ stadium }: DistanceMarkersProps) {
  const markers = [
    { distance: stadium.leftFieldDistance, angle: Math.PI * 0.2, label: 'LF' },
    { distance: Math.round((stadium.leftFieldDistance + stadium.centerFieldDistance) / 2), angle: Math.PI * 0.35, label: 'LCF' },
    { distance: stadium.centerFieldDistance, angle: Math.PI * 0.5, label: 'CF' },
    { distance: Math.round((stadium.rightFieldDistance + stadium.centerFieldDistance) / 2), angle: Math.PI * 0.65, label: 'RCF' },
    { distance: stadium.rightFieldDistance, angle: Math.PI * 0.8, label: 'RF' },
  ];

  return (
    <group>
      {markers.map((marker, i) => {
        const x = Math.cos(marker.angle) * feetToUnits(marker.distance) * 0.8;
        const z = Math.sin(marker.angle) * feetToUnits(marker.distance) * 0.85 + feetToUnits(100);

        return (
          <group key={`marker-${i}`} position={[x, feetToUnits(12), z]}>
            <Text
              fontSize={1.5}
              color={BSI_COLORS.gold}
              anchorX="center"
              anchorY="middle"
              outlineWidth={0.1}
              outlineColor={BSI_COLORS.midnight}
            >
              {marker.distance}'
            </Text>
            <Text
              position={[0, -1.2, 0]}
              fontSize={1}
              color={BSI_COLORS.cream}
              anchorX="center"
              anchorY="middle"
            >
              {marker.label}
            </Text>
          </group>
        );
      })}
    </group>
  );
}

// ============================================================================
// Player Position Dot Component
// ============================================================================

interface PlayerDotProps {
  position: FieldPosition;
  homeColor: string;
  awayColor: string;
  onClick?: () => void;
}

function PlayerDot({ position, homeColor, awayColor, onClick }: PlayerDotProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  const color = position.color ?? (position.teamId === 'home' ? homeColor : awayColor);

  // Convert field coordinates to 3D position
  const x = feetToUnits(position.x);
  const z = feetToUnits(position.y);

  useFrame((state) => {
    if (meshRef.current) {
      // Pulse animation
      const pulse = Math.sin(state.clock.elapsedTime * 3) * 0.1 + 1;
      const scale = hovered ? 1.5 : pulse;
      meshRef.current.scale.setScalar(scale);
    }
  });

  return (
    <group
      position={[x, 0.5, z]}
      onClick={onClick}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      {/* Main dot */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.5, 16, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={hovered ? 0.8 : 0.4}
        />
      </mesh>

      {/* Glow ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.6, 0.8, 32]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={hovered ? 0.6 : 0.3}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Position label */}
      <Text
        position={[0, 1.2, 0]}
        fontSize={0.6}
        color={BSI_COLORS.cream}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.05}
        outlineColor={BSI_COLORS.midnight}
      >
        {position.position}
      </Text>

      {/* Tooltip on hover */}
      {hovered && (
        <Html position={[0, 2, 0]} center>
          <div
            className="px-3 py-2 rounded-lg text-xs whitespace-nowrap"
            style={{
              background: `${BSI_COLORS.charcoal}ee`,
              border: `1px solid ${color}`,
              color: BSI_COLORS.cream,
            }}
          >
            <div className="font-bold" style={{ color }}>
              {position.playerName}
            </div>
            <div>{position.position}</div>
          </div>
        </Html>
      )}
    </group>
  );
}

// ============================================================================
// Heat Map Overlay Component
// ============================================================================

interface HeatMapOverlayProps {
  config: HeatMapConfig;
}

function HeatMapOverlay({ config }: HeatMapOverlayProps) {
  const { data, colorStart = '#22c55e', colorEnd = '#ef4444', opacity = 0.6 } = config;

  const startColor = useMemo(() => new THREE.Color(colorStart), [colorStart]);
  const endColor = useMemo(() => new THREE.Color(colorEnd), [colorEnd]);

  return (
    <group>
      {data.map((point, i) => {
        const x = feetToUnits(point.x);
        const z = feetToUnits(point.y);
        const color = startColor.clone().lerp(endColor, point.intensity);
        const size = 2 + point.intensity * 3;

        return (
          <mesh
            key={`heat-${i}`}
            position={[x, 0.2, z]}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <circleGeometry args={[size, 32]} />
            <meshBasicMaterial
              color={color}
              transparent
              opacity={opacity * point.intensity}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
        );
      })}

      {/* Legend */}
      <Html position={[feetToUnits(-300), 10, 0]}>
        <div
          className="px-3 py-2 rounded-lg text-xs"
          style={{
            background: `${BSI_COLORS.charcoal}ee`,
            border: `1px solid ${BSI_COLORS.ember}40`,
            color: BSI_COLORS.cream,
          }}
        >
          <div className="font-bold mb-2" style={{ color: BSI_COLORS.gold }}>
            {config.label}
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: colorStart }}
            />
            <span>Low</span>
            <div
              className="w-16 h-2 rounded"
              style={{
                background: `linear-gradient(to right, ${colorStart}, ${colorEnd})`,
              }}
            />
            <span>High</span>
            <div
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: colorEnd }}
            />
          </div>
        </div>
      </Html>
    </group>
  );
}

// ============================================================================
// Stadium Stands Component
// ============================================================================

interface StadiumStandsProps {
  stadium: StadiumConfig;
}

function StadiumStands({ stadium }: StadiumStandsProps) {
  const standColor = stadium.primaryColor ?? BSI_COLORS.burntOrange;

  return (
    <group>
      {/* Home plate area stands */}
      <mesh position={[0, 2, -8]} rotation={[Math.PI / 6, 0, 0]}>
        <boxGeometry args={[30, 0.5, 15]} />
        <meshStandardMaterial color={standColor} />
      </mesh>

      {/* First base stands */}
      <mesh position={[20, 3, 5]} rotation={[Math.PI / 8, -Math.PI / 6, 0]}>
        <boxGeometry args={[20, 0.5, 15]} />
        <meshStandardMaterial color={standColor} />
      </mesh>

      {/* Third base stands */}
      <mesh position={[-20, 3, 5]} rotation={[Math.PI / 8, Math.PI / 6, 0]}>
        <boxGeometry args={[20, 0.5, 15]} />
        <meshStandardMaterial color={standColor} />
      </mesh>

      {/* Outfield bleachers (simplified) */}
      <mesh position={[0, 4, feetToUnits(450)]} rotation={[-Math.PI / 8, 0, 0]}>
        <boxGeometry args={[50, 0.5, 10]} />
        <meshStandardMaterial color={standColor} />
      </mesh>
    </group>
  );
}

// ============================================================================
// Zone Labels Component
// ============================================================================

function ZoneLabels() {
  const zones = [
    { label: 'LEFT FIELD', position: [-15, 1, 25] as [number, number, number] },
    { label: 'CENTER FIELD', position: [0, 1, 35] as [number, number, number] },
    { label: 'RIGHT FIELD', position: [15, 1, 25] as [number, number, number] },
    { label: 'INFIELD', position: [0, 1, 8] as [number, number, number] },
  ];

  return (
    <group>
      {zones.map((zone, i) => (
        <Text
          key={`zone-${i}`}
          position={zone.position}
          fontSize={1.2}
          color={BSI_COLORS.cream}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.1}
          outlineColor={BSI_COLORS.midnight}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          {zone.label}
        </Text>
      ))}
    </group>
  );
}

// ============================================================================
// Lighting System Component
// ============================================================================

interface LightingSystemProps {
  timeOfDay: TimeOfDay;
}

function LightingSystem({ timeOfDay }: LightingSystemProps) {
  const configs = {
    day: {
      ambientIntensity: 0.6,
      sunIntensity: 1.2,
      sunPosition: [50, 100, 50] as [number, number, number],
      sunColor: '#fff5e6',
      showStars: false,
      skyProps: { sunPosition: [50, 100, 50] },
    },
    sunset: {
      ambientIntensity: 0.3,
      sunIntensity: 0.8,
      sunPosition: [100, 20, 0] as [number, number, number],
      sunColor: '#ff7e33',
      showStars: false,
      skyProps: { sunPosition: [100, 20, 0] },
    },
    night: {
      ambientIntensity: 0.1,
      sunIntensity: 0,
      sunPosition: [0, -100, 0] as [number, number, number],
      sunColor: '#ffffff',
      showStars: true,
      skyProps: { sunPosition: [0, -100, 0] },
    },
  };

  const config = configs[timeOfDay];

  return (
    <>
      {/* Ambient light */}
      <ambientLight intensity={config.ambientIntensity} />

      {/* Sun/main light */}
      {config.sunIntensity > 0 && (
        <directionalLight
          position={config.sunPosition}
          intensity={config.sunIntensity}
          color={config.sunColor}
          castShadow
          shadow-mapSize={[2048, 2048]}
        />
      )}

      {/* Stadium lights for night games */}
      {timeOfDay === 'night' && (
        <>
          {/* Four corner light towers */}
          {[
            [25, 30, -10],
            [-25, 30, -10],
            [35, 30, 30],
            [-35, 30, 30],
          ].map((pos, i) => (
            <spotLight
              key={`light-${i}`}
              position={pos as [number, number, number]}
              angle={0.6}
              penumbra={0.3}
              intensity={2}
              color={BSI_COLORS.cream}
              castShadow
              target-position={[0, 0, 15]}
            />
          ))}

          {/* Visible light fixtures */}
          {[
            [25, 28, -10],
            [-25, 28, -10],
            [35, 28, 30],
            [-35, 28, 30],
          ].map((pos, i) => (
            <mesh key={`fixture-${i}`} position={pos as [number, number, number]}>
              <boxGeometry args={[3, 1, 2]} />
              <meshStandardMaterial
                color={BSI_COLORS.cream}
                emissive={BSI_COLORS.cream}
                emissiveIntensity={1}
              />
            </mesh>
          ))}
        </>
      )}

      {/* Sky */}
      {timeOfDay !== 'night' && <Sky {...config.skyProps} />}

      {/* Stars for night */}
      {config.showStars && (
        <Stars radius={100} depth={50} count={5000} factor={4} fade speed={1} />
      )}
    </>
  );
}

// ============================================================================
// Camera Controller Component
// ============================================================================

interface CameraControllerProps {
  view: CameraView;
  enableControls: boolean;
}

function CameraController({ view, enableControls }: CameraControllerProps) {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);

  useEffect(() => {
    const position = getCameraPosition(view);
    const target = getCameraTarget(view);

    camera.position.set(...position);
    camera.lookAt(...target);

    if (controlsRef.current) {
      controlsRef.current.target.set(...target);
      controlsRef.current.update();
    }
  }, [view, camera]);

  return enableControls ? (
    <OrbitControls
      ref={controlsRef}
      minDistance={10}
      maxDistance={150}
      minPolarAngle={Math.PI / 8}
      maxPolarAngle={Math.PI / 2.2}
      enablePan
      panSpeed={0.5}
    />
  ) : null;
}

// ============================================================================
// Main Scene Component
// ============================================================================

interface StadiumSceneProps {
  stadium: StadiumConfig;
  playerPositions: FieldPosition[];
  heatMap: HeatMapConfig | null;
  timeOfDay: TimeOfDay;
  cameraView: CameraView;
  enableControls: boolean;
  showDistanceMarkers: boolean;
  showZoneLabels: boolean;
  homeColor: string;
  awayColor: string;
  onPlayerClick?: (position: FieldPosition) => void;
}

function StadiumScene({
  stadium,
  playerPositions,
  heatMap,
  timeOfDay,
  cameraView,
  enableControls,
  showDistanceMarkers,
  showZoneLabels,
  homeColor,
  awayColor,
  onPlayerClick,
}: StadiumSceneProps) {
  return (
    <>
      {/* Camera */}
      <CameraController view={cameraView} enableControls={enableControls} />

      {/* Lighting */}
      <LightingSystem timeOfDay={timeOfDay} />

      {/* Ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 20]} receiveShadow>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial color="#1a3d15" />
      </mesh>

      {/* Infield */}
      <InfieldDiamond />

      {/* Outfield grass */}
      <OutfieldGrass stadium={stadium} />

      {/* Outfield wall */}
      <OutfieldWall stadium={stadium} />

      {/* Stadium stands */}
      <StadiumStands stadium={stadium} />

      {/* Distance markers */}
      {showDistanceMarkers && <DistanceMarkers stadium={stadium} />}

      {/* Zone labels */}
      {showZoneLabels && <ZoneLabels />}

      {/* Heat map overlay */}
      {heatMap && <HeatMapOverlay config={heatMap} />}

      {/* Player positions */}
      {playerPositions.map((position) => (
        <PlayerDot
          key={position.playerId}
          position={position}
          homeColor={homeColor}
          awayColor={awayColor}
          onClick={() => onPlayerClick?.(position)}
        />
      ))}

      {/* Stadium name */}
      <Html position={[0, 15, -15]}>
        <div
          className="text-2xl font-bold px-4 py-2 rounded-lg"
          style={{
            background: `${BSI_COLORS.charcoal}cc`,
            color: stadium.primaryColor ?? BSI_COLORS.gold,
            textShadow: '0 2px 4px rgba(0,0,0,0.5)',
          }}
        >
          {stadium.name}
        </div>
      </Html>
    </>
  );
}

// ============================================================================
// Main Component Export
// ============================================================================

/**
 * StadiumOverview3D - Bird's eye 3D stadium view with low-poly stylized model,
 * real-time player positions, heat map overlay, camera controls, and day/night
 * lighting cycle.
 *
 * @example
 * ```tsx
 * <StadiumOverview3D
 *   stadium={{
 *     name: 'Busch Stadium',
 *     leftFieldDistance: 336,
 *     centerFieldDistance: 400,
 *     rightFieldDistance: 335,
 *     primaryColor: '#C41E3A',
 *     secondaryColor: '#0C2340',
 *   }}
 *   playerPositions={[
 *     { playerId: '1', playerName: 'Paul Goldschmidt', position: '1B', x: 60, y: 60, teamId: 'home' },
 *     // ... more positions
 *   ]}
 *   timeOfDay="night"
 *   cameraView="overview"
 *   enableControls
 *   showDistanceMarkers
 * />
 * ```
 */
export function StadiumOverview3D({
  stadium = DEFAULT_STADIUM,
  playerPositions = [],
  heatMap = null,
  timeOfDay = 'day',
  cameraView = 'overview',
  enableControls = true,
  showDistanceMarkers = true,
  showZoneLabels = false,
  homeColor = BSI_COLORS.burntOrange,
  awayColor = '#3b82f6',
  onPlayerClick,
  onViewChange,
  className = '',
  style = {},
}: StadiumOverview3DProps) {
  return (
    <div
      className={`w-full h-full min-h-[400px] ${className}`}
      style={{
        background: timeOfDay === 'night'
          ? `linear-gradient(180deg, #0a0a1a 0%, ${BSI_COLORS.midnight} 100%)`
          : timeOfDay === 'sunset'
          ? `linear-gradient(180deg, #ff7e33 0%, #1a0a00 100%)`
          : `linear-gradient(180deg, #87ceeb 0%, #b0e0e6 100%)`,
        ...style,
      }}
    >
      <Canvas
        shadows
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
        camera={{ position: getCameraPosition(cameraView), fov: 50 }}
      >
        <StadiumScene
          stadium={stadium}
          playerPositions={playerPositions}
          heatMap={heatMap}
          timeOfDay={timeOfDay}
          cameraView={cameraView}
          enableControls={enableControls}
          showDistanceMarkers={showDistanceMarkers}
          showZoneLabels={showZoneLabels}
          homeColor={homeColor}
          awayColor={awayColor}
          onPlayerClick={onPlayerClick}
        />
      </Canvas>
    </div>
  );
}

export default StadiumOverview3D;
