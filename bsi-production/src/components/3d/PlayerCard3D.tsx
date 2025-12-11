/**
 * PlayerCard3D.tsx
 * Rotating 3D player stat card with glass morphism, illuminating stats on hover,
 * 3D player silhouette, particle aura for high performers, and flip animation
 * for advanced stats.
 *
 * @module components/3d/PlayerCard3D
 * @requires @react-three/fiber
 * @requires @react-three/drei
 */

import React, { useRef, useMemo, useState, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import {
  Text,
  RoundedBox,
  Float,
  MeshTransmissionMaterial,
  Environment,
  Sparkles,
  Html,
  useTexture,
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

/** Player position type */
export type PlayerPosition =
  | 'P'
  | 'C'
  | '1B'
  | '2B'
  | '3B'
  | 'SS'
  | 'LF'
  | 'CF'
  | 'RF'
  | 'DH'
  | 'OF'
  | 'IF'
  | 'UT';

/** Basic player stats */
export interface PlayerBasicStats {
  /** Games played */
  games: number;
  /** Batting average */
  avg?: number;
  /** Home runs */
  hr?: number;
  /** Runs batted in */
  rbi?: number;
  /** Stolen bases */
  sb?: number;
  /** On-base percentage */
  obp?: number;
  /** Slugging percentage */
  slg?: number;
  /** Earned run average (pitchers) */
  era?: number;
  /** Wins (pitchers) */
  wins?: number;
  /** Losses (pitchers) */
  losses?: number;
  /** Strikeouts (pitchers) */
  strikeouts?: number;
  /** WHIP (pitchers) */
  whip?: number;
  /** Innings pitched (pitchers) */
  ip?: number;
}

/** Advanced player stats */
export interface PlayerAdvancedStats {
  /** Wins Above Replacement */
  war?: number;
  /** On-base Plus Slugging */
  ops?: number;
  /** Weighted On-Base Average */
  woba?: number;
  /** Weighted Runs Created Plus */
  wrcPlus?: number;
  /** Barrel percentage */
  barrelPct?: number;
  /** Hard hit percentage */
  hardHitPct?: number;
  /** Exit velocity average */
  exitVelocity?: number;
  /** Launch angle average */
  launchAngle?: number;
  /** Sprint speed (ft/sec) */
  sprintSpeed?: number;
  /** Fielding Runs Above Average */
  fraa?: number;
  /** Expected batting average */
  xba?: number;
  /** Expected slugging */
  xslg?: number;
  /** Stuff+ (pitchers) */
  stuffPlus?: number;
  /** Location+ (pitchers) */
  locationPlus?: number;
  /** Pitching+ (pitchers) */
  pitchingPlus?: number;
}

/** Complete player data */
export interface PlayerData {
  /** Unique player identifier */
  id: string;
  /** First name */
  firstName: string;
  /** Last name */
  lastName: string;
  /** Jersey number */
  number: number;
  /** Primary position */
  position: PlayerPosition;
  /** Team ID */
  teamId: string;
  /** Team name */
  teamName: string;
  /** Team primary color */
  teamColor: string;
  /** Player headshot URL */
  imageUrl?: string;
  /** Basic stats */
  basicStats: PlayerBasicStats;
  /** Advanced stats */
  advancedStats?: PlayerAdvancedStats;
  /** Is this player a high performer (top 10% in key metrics) */
  isHighPerformer?: boolean;
  /** Player handedness */
  bats?: 'L' | 'R' | 'S';
  throws?: 'L' | 'R';
  /** Height in inches */
  height?: number;
  /** Weight in pounds */
  weight?: number;
  /** Age */
  age?: number;
}

/** Props for PlayerCard3D */
export interface PlayerCard3DProps {
  /** Player data to display */
  player: PlayerData;
  /** Whether card is flipped to show advanced stats */
  flipped?: boolean;
  /** Enable auto-rotation */
  autoRotate?: boolean;
  /** Enable hover interactions */
  interactive?: boolean;
  /** Card size scale */
  scale?: number;
  /** Callback when card is clicked */
  onClick?: (player: PlayerData) => void;
  /** Callback when card flip is toggled */
  onFlip?: (flipped: boolean) => void;
  /** Custom className */
  className?: string;
  /** Custom styles */
  style?: React.CSSProperties;
}

// ============================================================================
// Utility Functions
// ============================================================================

/** Format stat value for display */
function formatStat(value: number | undefined, decimals: number = 3): string {
  if (value === undefined) return '-';
  if (decimals === 0) return Math.round(value).toString();
  return value.toFixed(decimals).replace(/^0\./, '.');
}

/** Get WAR color based on value */
function getWarColor(war: number | undefined): string {
  if (war === undefined) return BSI_COLORS.cream;
  if (war >= 6) return '#22c55e'; // MVP caliber
  if (war >= 4) return '#84cc16'; // All-Star
  if (war >= 2) return '#eab308'; // Starter
  if (war >= 0) return '#f97316'; // Bench
  return '#ef4444'; // Below replacement
}

/** Check if player is a pitcher */
function isPitcher(position: PlayerPosition): boolean {
  return position === 'P';
}

// ============================================================================
// Player Silhouette Component
// ============================================================================

interface PlayerSilhouetteProps {
  position: PlayerPosition;
  color: string;
  scale?: number;
}

function PlayerSilhouette({ position, color, scale = 1 }: PlayerSilhouetteProps) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      // Subtle breathing animation
      const breath = Math.sin(state.clock.elapsedTime * 2) * 0.02 + 1;
      groupRef.current.scale.y = breath * scale;
    }
  });

  // Simple geometric silhouette based on position
  const isPitch = isPitcher(position);

  return (
    <group ref={groupRef} position={[0, 0, 0.1]} scale={scale}>
      {/* Head */}
      <mesh position={[0, 0.9, 0]}>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.2}
          metalness={0.3}
          roughness={0.7}
        />
      </mesh>

      {/* Body */}
      <mesh position={[0, 0.4, 0]}>
        <capsuleGeometry args={[0.18, 0.4, 8, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.2}
          metalness={0.3}
          roughness={0.7}
        />
      </mesh>

      {/* Arms - different pose for pitchers */}
      {isPitch ? (
        <>
          {/* Pitching arm raised */}
          <mesh position={[0.25, 0.6, 0]} rotation={[0, 0, -Math.PI / 3]}>
            <capsuleGeometry args={[0.06, 0.3, 8, 16]} />
            <meshStandardMaterial
              color={color}
              emissive={color}
              emissiveIntensity={0.2}
            />
          </mesh>
          {/* Glove arm */}
          <mesh position={[-0.2, 0.35, 0]} rotation={[0, 0, Math.PI / 4]}>
            <capsuleGeometry args={[0.06, 0.25, 8, 16]} />
            <meshStandardMaterial
              color={color}
              emissive={color}
              emissiveIntensity={0.2}
            />
          </mesh>
        </>
      ) : (
        <>
          {/* Batting stance */}
          <mesh position={[0.22, 0.5, 0]} rotation={[0, 0, -Math.PI / 6]}>
            <capsuleGeometry args={[0.06, 0.28, 8, 16]} />
            <meshStandardMaterial
              color={color}
              emissive={color}
              emissiveIntensity={0.2}
            />
          </mesh>
          <mesh position={[-0.22, 0.5, 0]} rotation={[0, 0, Math.PI / 6]}>
            <capsuleGeometry args={[0.06, 0.28, 8, 16]} />
            <meshStandardMaterial
              color={color}
              emissive={color}
              emissiveIntensity={0.2}
            />
          </mesh>
          {/* Bat */}
          <mesh position={[0.35, 0.75, 0]} rotation={[0, 0, Math.PI / 4]}>
            <cylinderGeometry args={[0.02, 0.04, 0.5, 8]} />
            <meshStandardMaterial color={BSI_COLORS.texasSoil} />
          </mesh>
        </>
      )}

      {/* Legs */}
      <mesh position={[0.1, -0.15, 0]} rotation={[0, 0, Math.PI / 24]}>
        <capsuleGeometry args={[0.07, 0.35, 8, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.2}
        />
      </mesh>
      <mesh position={[-0.1, -0.15, 0]} rotation={[0, 0, -Math.PI / 24]}>
        <capsuleGeometry args={[0.07, 0.35, 8, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.2}
        />
      </mesh>
    </group>
  );
}

// ============================================================================
// Stat Row Component
// ============================================================================

interface StatRowProps {
  label: string;
  value: string;
  color?: string;
  position: [number, number, number];
  highlighted?: boolean;
}

function StatRow({ label, value, color = BSI_COLORS.cream, position, highlighted = false }: StatRowProps) {
  const [hovered, setHovered] = useState(false);
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current && (highlighted || hovered)) {
      const pulse = Math.sin(state.clock.elapsedTime * 3) * 0.1 + 1;
      groupRef.current.scale.setScalar(pulse);
    }
  });

  return (
    <group
      ref={groupRef}
      position={position}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      {/* Label */}
      <Text
        position={[-0.5, 0, 0]}
        fontSize={0.08}
        color={BSI_COLORS.cream}
        anchorX="left"
        anchorY="middle"
      >
        {label}
      </Text>

      {/* Value */}
      <Text
        position={[0.5, 0, 0]}
        fontSize={0.1}
        fontWeight="bold"
        color={color}
        anchorX="right"
        anchorY="middle"
      >
        {value}
      </Text>

      {/* Highlight bar */}
      {(highlighted || hovered) && (
        <mesh position={[0, -0.06, -0.01]}>
          <planeGeometry args={[1.1, 0.02]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={0.5}
          />
        </mesh>
      )}
    </group>
  );
}

// ============================================================================
// Card Front Component
// ============================================================================

interface CardFrontProps {
  player: PlayerData;
  hovered: boolean;
}

function CardFront({ player, hovered }: CardFrontProps) {
  const isPitch = isPitcher(player.position);
  const stats = player.basicStats;

  return (
    <group position={[0, 0, 0.06]}>
      {/* Player name */}
      <Text
        position={[0, 1.15, 0]}
        fontSize={0.12}
        fontWeight="bold"
        color={player.teamColor}
        anchorX="center"
        anchorY="middle"
      >
        {player.firstName} {player.lastName}
      </Text>

      {/* Number and position */}
      <group position={[-0.7, 0.95, 0]}>
        <Text
          fontSize={0.2}
          fontWeight="bold"
          color={BSI_COLORS.gold}
          anchorX="center"
          anchorY="middle"
        >
          #{player.number}
        </Text>
      </group>

      <group position={[0.7, 0.95, 0]}>
        <Text
          fontSize={0.12}
          color={BSI_COLORS.cream}
          anchorX="center"
          anchorY="middle"
        >
          {player.position}
        </Text>
      </group>

      {/* Team name */}
      <Text
        position={[0, 0.8, 0]}
        fontSize={0.08}
        color={BSI_COLORS.cream}
        anchorX="center"
        anchorY="middle"
      >
        {player.teamName}
      </Text>

      {/* Player silhouette */}
      <PlayerSilhouette
        position={player.position}
        color={player.teamColor}
        scale={0.6}
      />

      {/* Divider */}
      <mesh position={[0, -0.3, 0]}>
        <planeGeometry args={[1.4, 0.01]} />
        <meshBasicMaterial color={BSI_COLORS.ember} />
      </mesh>

      {/* Stats section */}
      {isPitch ? (
        <group position={[0, -0.55, 0]}>
          <StatRow
            label="ERA"
            value={formatStat(stats.era, 2)}
            position={[0, 0.15, 0]}
            color={stats.era && stats.era < 3 ? '#22c55e' : BSI_COLORS.cream}
            highlighted={hovered && stats.era !== undefined && stats.era < 3}
          />
          <StatRow
            label="W-L"
            value={`${stats.wins ?? 0}-${stats.losses ?? 0}`}
            position={[0, 0, 0]}
          />
          <StatRow
            label="K"
            value={formatStat(stats.strikeouts, 0)}
            position={[0, -0.15, 0]}
            color={stats.strikeouts && stats.strikeouts > 150 ? BSI_COLORS.gold : BSI_COLORS.cream}
            highlighted={hovered && stats.strikeouts !== undefined && stats.strikeouts > 150}
          />
          <StatRow
            label="WHIP"
            value={formatStat(stats.whip, 2)}
            position={[0, -0.3, 0]}
          />
          <StatRow
            label="IP"
            value={formatStat(stats.ip, 1)}
            position={[0, -0.45, 0]}
          />
        </group>
      ) : (
        <group position={[0, -0.55, 0]}>
          <StatRow
            label="AVG"
            value={formatStat(stats.avg)}
            position={[0, 0.15, 0]}
            color={stats.avg && stats.avg >= 0.3 ? '#22c55e' : BSI_COLORS.cream}
            highlighted={hovered && stats.avg !== undefined && stats.avg >= 0.3}
          />
          <StatRow
            label="HR"
            value={formatStat(stats.hr, 0)}
            position={[0, 0, 0]}
            color={stats.hr && stats.hr >= 30 ? BSI_COLORS.gold : BSI_COLORS.cream}
            highlighted={hovered && stats.hr !== undefined && stats.hr >= 30}
          />
          <StatRow
            label="RBI"
            value={formatStat(stats.rbi, 0)}
            position={[0, -0.15, 0]}
          />
          <StatRow
            label="OBP"
            value={formatStat(stats.obp)}
            position={[0, -0.3, 0]}
          />
          <StatRow
            label="SLG"
            value={formatStat(stats.slg)}
            position={[0, -0.45, 0]}
          />
        </group>
      )}

      {/* Flip hint */}
      <Text
        position={[0, -1.15, 0]}
        fontSize={0.06}
        color={BSI_COLORS.ember}
        anchorX="center"
        anchorY="middle"
      >
        Click to flip
      </Text>
    </group>
  );
}

// ============================================================================
// Card Back Component (Advanced Stats)
// ============================================================================

interface CardBackProps {
  player: PlayerData;
  hovered: boolean;
}

function CardBack({ player, hovered }: CardBackProps) {
  const isPitch = isPitcher(player.position);
  const advStats = player.advancedStats ?? {};

  return (
    <group position={[0, 0, -0.06]} rotation={[0, Math.PI, 0]}>
      {/* Header */}
      <Text
        position={[0, 1.15, 0]}
        fontSize={0.1}
        fontWeight="bold"
        color={BSI_COLORS.gold}
        anchorX="center"
        anchorY="middle"
      >
        ADVANCED METRICS
      </Text>

      {/* Player name */}
      <Text
        position={[0, 0.95, 0]}
        fontSize={0.08}
        color={player.teamColor}
        anchorX="center"
        anchorY="middle"
      >
        {player.firstName} {player.lastName}
      </Text>

      {/* WAR prominently displayed */}
      <group position={[0, 0.65, 0]}>
        <Text
          position={[0, 0.1, 0]}
          fontSize={0.06}
          color={BSI_COLORS.cream}
          anchorX="center"
        >
          WAR
        </Text>
        <Text
          position={[0, -0.08, 0]}
          fontSize={0.2}
          fontWeight="bold"
          color={getWarColor(advStats.war)}
          anchorX="center"
        >
          {formatStat(advStats.war, 1)}
        </Text>
      </group>

      {/* Divider */}
      <mesh position={[0, 0.4, 0]}>
        <planeGeometry args={[1.4, 0.01]} />
        <meshBasicMaterial color={BSI_COLORS.ember} />
      </mesh>

      {/* Advanced stats grid */}
      {isPitch ? (
        <group position={[0, -0.1, 0]}>
          <StatRow
            label="Stuff+"
            value={formatStat(advStats.stuffPlus, 0)}
            position={[0, 0.35, 0]}
            color={advStats.stuffPlus && advStats.stuffPlus > 100 ? '#22c55e' : BSI_COLORS.cream}
            highlighted={hovered}
          />
          <StatRow
            label="Location+"
            value={formatStat(advStats.locationPlus, 0)}
            position={[0, 0.2, 0]}
          />
          <StatRow
            label="Pitching+"
            value={formatStat(advStats.pitchingPlus, 0)}
            position={[0, 0.05, 0]}
          />
          <StatRow
            label="xBA Against"
            value={formatStat(advStats.xba)}
            position={[0, -0.1, 0]}
          />
          <StatRow
            label="Barrel %"
            value={advStats.barrelPct ? `${formatStat(advStats.barrelPct, 1)}%` : '-'}
            position={[0, -0.25, 0]}
          />
          <StatRow
            label="Hard Hit %"
            value={advStats.hardHitPct ? `${formatStat(advStats.hardHitPct, 1)}%` : '-'}
            position={[0, -0.4, 0]}
          />
        </group>
      ) : (
        <group position={[0, -0.1, 0]}>
          <StatRow
            label="OPS"
            value={formatStat(advStats.ops)}
            position={[0, 0.35, 0]}
            color={advStats.ops && advStats.ops >= 0.9 ? '#22c55e' : BSI_COLORS.cream}
            highlighted={hovered}
          />
          <StatRow
            label="wOBA"
            value={formatStat(advStats.woba)}
            position={[0, 0.2, 0]}
          />
          <StatRow
            label="wRC+"
            value={formatStat(advStats.wrcPlus, 0)}
            position={[0, 0.05, 0]}
            color={advStats.wrcPlus && advStats.wrcPlus >= 130 ? BSI_COLORS.gold : BSI_COLORS.cream}
          />
          <StatRow
            label="Barrel %"
            value={advStats.barrelPct ? `${formatStat(advStats.barrelPct, 1)}%` : '-'}
            position={[0, -0.1, 0]}
          />
          <StatRow
            label="Exit Velo"
            value={advStats.exitVelocity ? `${formatStat(advStats.exitVelocity, 1)} mph` : '-'}
            position={[0, -0.25, 0]}
          />
          <StatRow
            label="Sprint"
            value={advStats.sprintSpeed ? `${formatStat(advStats.sprintSpeed, 1)} ft/s` : '-'}
            position={[0, -0.4, 0]}
          />
          <StatRow
            label="FRAA"
            value={formatStat(advStats.fraa, 1)}
            position={[0, -0.55, 0]}
          />
        </group>
      )}

      {/* Flip hint */}
      <Text
        position={[0, -1.15, 0]}
        fontSize={0.06}
        color={BSI_COLORS.ember}
        anchorX="center"
        anchorY="middle"
      >
        Click to flip back
      </Text>
    </group>
  );
}

// ============================================================================
// Main Card Component
// ============================================================================

interface CardMeshProps {
  player: PlayerData;
  flipped: boolean;
  interactive: boolean;
  autoRotate: boolean;
  onClick?: () => void;
}

function CardMesh({ player, flipped, interactive, autoRotate, onClick }: CardMeshProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const targetRotation = useRef(0);

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    // Handle flip animation
    const targetY = flipped ? Math.PI : 0;
    targetRotation.current = THREE.MathUtils.lerp(
      targetRotation.current,
      targetY,
      delta * 5
    );
    groupRef.current.rotation.y = targetRotation.current;

    // Auto-rotate when not flipped and not hovered
    if (autoRotate && !flipped && !hovered) {
      groupRef.current.rotation.y += Math.sin(state.clock.elapsedTime * 0.5) * 0.002;
    }

    // Hover scale
    const targetScale = hovered ? 1.05 : 1;
    groupRef.current.scale.lerp(
      new THREE.Vector3(targetScale, targetScale, targetScale),
      delta * 5
    );
  });

  return (
    <Float
      speed={2}
      rotationIntensity={autoRotate && !hovered ? 0.1 : 0}
      floatIntensity={0.2}
      floatingRange={[-0.05, 0.05]}
    >
      <group
        ref={groupRef}
        onClick={interactive ? onClick : undefined}
        onPointerOver={() => interactive && setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        {/* Card body */}
        <RoundedBox args={[1.6, 2.6, 0.1]} radius={0.08} smoothness={4}>
          <MeshTransmissionMaterial
            backside
            samples={4}
            thickness={0.3}
            chromaticAberration={0.05}
            anisotropy={0.1}
            distortion={0.05}
            distortionScale={0.1}
            temporalDistortion={0.05}
            iridescence={0.5}
            iridescenceIOR={1}
            iridescenceThicknessRange={[100, 400]}
            color={BSI_COLORS.charcoal}
            roughness={0.2}
          />
        </RoundedBox>

        {/* Border glow */}
        <mesh position={[0, 0, 0.051]}>
          <planeGeometry args={[1.65, 2.65]} />
          <meshBasicMaterial
            color={player.teamColor}
            transparent
            opacity={hovered ? 0.3 : 0.15}
            blending={THREE.AdditiveBlending}
          />
        </mesh>

        {/* Front content */}
        <CardFront player={player} hovered={hovered && !flipped} />

        {/* Back content */}
        <CardBack player={player} hovered={hovered && flipped} />

        {/* High performer aura */}
        {player.isHighPerformer && (
          <Sparkles
            count={30}
            scale={2}
            size={3}
            speed={0.5}
            color={BSI_COLORS.gold}
            opacity={hovered ? 0.8 : 0.4}
          />
        )}
      </group>
    </Float>
  );
}

// ============================================================================
// Scene Component
// ============================================================================

interface CardSceneProps {
  player: PlayerData;
  flipped: boolean;
  autoRotate: boolean;
  interactive: boolean;
  onFlip: () => void;
}

function CardScene({ player, flipped, autoRotate, interactive, onFlip }: CardSceneProps) {
  return (
    <>
      <CardMesh
        player={player}
        flipped={flipped}
        interactive={interactive}
        autoRotate={autoRotate}
        onClick={onFlip}
      />

      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <pointLight position={[3, 3, 3]} intensity={0.8} color={BSI_COLORS.cream} />
      <pointLight position={[-3, 3, 3]} intensity={0.5} color={player.teamColor} />
      <spotLight
        position={[0, 5, 2]}
        angle={0.4}
        penumbra={0.5}
        intensity={0.6}
        color={BSI_COLORS.gold}
        castShadow
      />

      <Environment preset="city" />
    </>
  );
}

// ============================================================================
// Main Component Export
// ============================================================================

/**
 * PlayerCard3D - Rotating 3D player stat card with glass morphism,
 * illuminating stats on hover, player silhouette, particle aura for
 * high performers, and flip animation for advanced stats.
 *
 * @example
 * ```tsx
 * <PlayerCard3D
 *   player={{
 *     id: 'goldschmidt',
 *     firstName: 'Paul',
 *     lastName: 'Goldschmidt',
 *     number: 46,
 *     position: '1B',
 *     teamId: 'stl',
 *     teamName: 'Cardinals',
 *     teamColor: '#C41E3A',
 *     basicStats: {
 *       games: 150,
 *       avg: 0.317,
 *       hr: 35,
 *       rbi: 115,
 *       obp: 0.404,
 *       slg: 0.578,
 *     },
 *     advancedStats: {
 *       war: 7.2,
 *       ops: 0.982,
 *       woba: 0.412,
 *       wrcPlus: 168,
 *       barrelPct: 15.2,
 *       exitVelocity: 93.1,
 *     },
 *     isHighPerformer: true,
 *   }}
 *   autoRotate
 *   interactive
 * />
 * ```
 */
export function PlayerCard3D({
  player,
  flipped: controlledFlipped,
  autoRotate = true,
  interactive = true,
  scale = 1,
  onClick,
  onFlip,
  className = '',
  style = {},
}: PlayerCard3DProps) {
  const [internalFlipped, setInternalFlipped] = useState(false);
  const isControlled = controlledFlipped !== undefined;
  const flipped = isControlled ? controlledFlipped : internalFlipped;

  const handleFlip = useCallback(() => {
    if (isControlled) {
      onFlip?.(!flipped);
    } else {
      setInternalFlipped((prev) => !prev);
    }
    onClick?.(player);
  }, [isControlled, flipped, onFlip, onClick, player]);

  return (
    <div
      className={`w-full h-full min-h-[400px] ${className}`}
      style={{
        background: `radial-gradient(ellipse at center, ${BSI_COLORS.charcoal} 0%, ${BSI_COLORS.midnight} 100%)`,
        ...style,
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 3.5], fov: 50 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
      >
        <CardScene
          player={player}
          flipped={flipped}
          autoRotate={autoRotate}
          interactive={interactive}
          onFlip={handleFlip}
        />
      </Canvas>
    </div>
  );
}

export default PlayerCard3D;
