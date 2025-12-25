/**
 * StandingsChart3D.tsx
 * 3D bar chart for team standings with rising pillars, team colors,
 * animated growth on data load, comparison mode, and hover details.
 *
 * @module components/3d/StandingsChart3D
 * @requires @react-three/fiber
 * @requires @react-three/drei
 */

import React, { useRef, useMemo, useState, useEffect, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import {
  Text,
  RoundedBox,
  Float,
  OrbitControls,
  Environment,
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

/** Team standing data */
export interface TeamStanding {
  /** Team identifier */
  teamId: string;
  /** Team name */
  name: string;
  /** Team abbreviation */
  abbreviation: string;
  /** Primary team color */
  primaryColor: string;
  /** Secondary team color */
  secondaryColor?: string;
  /** Wins */
  wins: number;
  /** Losses */
  losses: number;
  /** Winning percentage */
  winPct: number;
  /** Games back from leader */
  gamesBack: number;
  /** Division rank */
  rank: number;
  /** Last 10 games record */
  last10?: string;
  /** Current streak */
  streak?: string;
  /** Run differential */
  runDiff?: number;
  /** Logo URL */
  logoUrl?: string;
}

/** Comparison data for multi-season view */
export interface SeasonComparison {
  /** Season year */
  year: number;
  /** Label for this season */
  label: string;
  /** Standings data */
  standings: TeamStanding[];
}

/** Sort criteria */
export type SortBy = 'winPct' | 'wins' | 'runDiff' | 'rank';

/** Chart display mode */
export type ChartMode = 'standard' | 'comparison' | 'percentage';

/** Props for StandingsChart3D */
export interface StandingsChart3DProps {
  /** Primary standings data */
  standings: TeamStanding[];
  /** Optional comparison data for multi-season view */
  comparisonData?: SeasonComparison[];
  /** Chart title */
  title?: string;
  /** Sort criteria */
  sortBy?: SortBy;
  /** Chart display mode */
  mode?: ChartMode;
  /** Show games back labels */
  showGamesBack?: boolean;
  /** Show win-loss record */
  showRecord?: boolean;
  /** Animate on load */
  animate?: boolean;
  /** Enable camera controls */
  enableControls?: boolean;
  /** Highlight team ID */
  highlightTeam?: string;
  /** Callback when team is clicked */
  onTeamClick?: (team: TeamStanding) => void;
  /** Callback when team is hovered */
  onTeamHover?: (team: TeamStanding | null) => void;
  /** Custom className */
  className?: string;
  /** Custom styles */
  style?: React.CSSProperties;
}

// ============================================================================
// Utility Functions
// ============================================================================

/** Sort standings by criteria */
function sortStandings(standings: TeamStanding[], sortBy: SortBy): TeamStanding[] {
  return [...standings].sort((a, b) => {
    switch (sortBy) {
      case 'winPct':
        return b.winPct - a.winPct;
      case 'wins':
        return b.wins - a.wins;
      case 'runDiff':
        return (b.runDiff ?? 0) - (a.runDiff ?? 0);
      case 'rank':
        return a.rank - b.rank;
      default:
        return b.winPct - a.winPct;
    }
  });
}

/** Calculate bar height based on win percentage */
function getBarHeight(winPct: number, mode: ChartMode): number {
  if (mode === 'percentage') {
    return winPct * 8; // Scale 0-1 to 0-8 units
  }
  return winPct * 8;
}

// ============================================================================
// Single Bar Component
// ============================================================================

interface StandingBarProps {
  team: TeamStanding;
  index: number;
  totalTeams: number;
  mode: ChartMode;
  animate: boolean;
  showGamesBack: boolean;
  showRecord: boolean;
  isHighlighted: boolean;
  comparisonIndex?: number;
  onClick?: () => void;
  onHover?: (hovered: boolean) => void;
}

function StandingBar({
  team,
  index,
  totalTeams,
  mode,
  animate,
  showGamesBack,
  showRecord,
  isHighlighted,
  comparisonIndex = 0,
  onClick,
  onHover,
}: StandingBarProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const [currentHeight, setCurrentHeight] = useState(animate ? 0 : getBarHeight(team.winPct, mode));

  const targetHeight = getBarHeight(team.winPct, mode);
  const barWidth = 1.2;
  const barDepth = 0.8;
  const spacing = 1.8;
  const comparisonOffset = comparisonIndex * 1;

  // Position calculation
  const xPosition = (index - (totalTeams - 1) / 2) * spacing + comparisonOffset;

  // Animate height on mount
  useEffect(() => {
    if (animate) {
      setCurrentHeight(0);
    }
  }, [animate, team.teamId]);

  useFrame((state, delta) => {
    // Animate bar growth
    if (currentHeight < targetHeight) {
      const newHeight = Math.min(currentHeight + delta * 4, targetHeight);
      setCurrentHeight(newHeight);
    }

    if (meshRef.current) {
      // Hover scale effect
      const targetScale = hovered || isHighlighted ? 1.1 : 1;
      meshRef.current.scale.x = THREE.MathUtils.lerp(meshRef.current.scale.x, targetScale, delta * 5);
      meshRef.current.scale.z = THREE.MathUtils.lerp(meshRef.current.scale.z, targetScale, delta * 5);
    }

    if (groupRef.current && (hovered || isHighlighted)) {
      // Subtle bob animation when highlighted
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 3) * 0.05;
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
    <group
      ref={groupRef}
      position={[xPosition, 0, 0]}
      onClick={onClick}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    >
      {/* Bar pillar */}
      <mesh ref={meshRef} position={[0, currentHeight / 2, 0]}>
        <RoundedBox args={[barWidth, currentHeight, barDepth]} radius={0.05} smoothness={4}>
          <meshStandardMaterial
            color={team.primaryColor}
            emissive={team.primaryColor}
            emissiveIntensity={hovered || isHighlighted ? 0.4 : 0.1}
            metalness={0.3}
            roughness={0.4}
          />
        </RoundedBox>
      </mesh>

      {/* Secondary color accent stripe */}
      {team.secondaryColor && (
        <mesh position={[0, currentHeight / 2, barDepth / 2 + 0.01]}>
          <planeGeometry args={[barWidth * 0.9, currentHeight * 0.95]} />
          <meshStandardMaterial
            color={team.secondaryColor}
            transparent
            opacity={0.3}
          />
        </mesh>
      )}

      {/* Team abbreviation */}
      <Text
        position={[0, -0.3, barDepth / 2 + 0.1]}
        fontSize={0.4}
        fontWeight="bold"
        color={team.primaryColor}
        anchorX="center"
        anchorY="top"
      >
        {team.abbreviation}
      </Text>

      {/* Win percentage on top */}
      <Text
        position={[0, currentHeight + 0.3, 0]}
        fontSize={0.35}
        fontWeight="bold"
        color={BSI_COLORS.cream}
        anchorX="center"
        anchorY="bottom"
      >
        {(team.winPct * 100).toFixed(1)}%
      </Text>

      {/* Games back label */}
      {showGamesBack && team.gamesBack > 0 && (
        <Text
          position={[0, currentHeight + 0.7, 0]}
          fontSize={0.25}
          color={BSI_COLORS.gold}
          anchorX="center"
          anchorY="bottom"
        >
          -{team.gamesBack} GB
        </Text>
      )}

      {/* Record label */}
      {showRecord && (
        <Text
          position={[0, -0.7, barDepth / 2 + 0.1]}
          fontSize={0.25}
          color={BSI_COLORS.cream}
          anchorX="center"
          anchorY="top"
        >
          {team.wins}-{team.losses}
        </Text>
      )}

      {/* Highlight sparkles */}
      {(hovered || isHighlighted) && (
        <Sparkles
          count={15}
          scale={[barWidth * 1.5, currentHeight * 1.5, barDepth * 1.5]}
          position={[0, currentHeight / 2, 0]}
          size={2}
          speed={0.5}
          color={BSI_COLORS.gold}
          opacity={0.6}
        />
      )}

      {/* Tooltip on hover */}
      {hovered && (
        <Html position={[0, currentHeight + 1.2, 0]} center>
          <div
            className="px-4 py-3 rounded-lg text-sm whitespace-nowrap shadow-xl"
            style={{
              background: `${BSI_COLORS.charcoal}f5`,
              border: `2px solid ${team.primaryColor}`,
              color: BSI_COLORS.cream,
              minWidth: '160px',
            }}
          >
            <div className="font-bold text-base mb-2" style={{ color: team.primaryColor }}>
              {team.name}
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>Record:</div>
              <div className="text-right font-medium">{team.wins}-{team.losses}</div>
              <div>Win %:</div>
              <div className="text-right font-medium">{(team.winPct * 100).toFixed(1)}%</div>
              {team.gamesBack > 0 && (
                <>
                  <div>Games Back:</div>
                  <div className="text-right font-medium" style={{ color: BSI_COLORS.gold }}>
                    {team.gamesBack}
                  </div>
                </>
              )}
              {team.runDiff !== undefined && (
                <>
                  <div>Run Diff:</div>
                  <div
                    className="text-right font-medium"
                    style={{ color: team.runDiff >= 0 ? '#22c55e' : '#ef4444' }}
                  >
                    {team.runDiff >= 0 ? '+' : ''}{team.runDiff}
                  </div>
                </>
              )}
              {team.last10 && (
                <>
                  <div>Last 10:</div>
                  <div className="text-right font-medium">{team.last10}</div>
                </>
              )}
              {team.streak && (
                <>
                  <div>Streak:</div>
                  <div
                    className="text-right font-medium"
                    style={{
                      color: typeof team.streak === 'string'
                        ? (team.streak.startsWith('W') ? '#22c55e' : '#ef4444')
                        : (team.streak > 0 ? '#22c55e' : '#ef4444'),
                    }}
                  >
                    {typeof team.streak === 'string'
                      ? team.streak
                      : (team.streak > 0 ? `W${team.streak}` : `L${Math.abs(team.streak)}`)}
                  </div>
                </>
              )}
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

// ============================================================================
// Comparison Legend Component
// ============================================================================

interface ComparisonLegendProps {
  comparisons: SeasonComparison[];
}

function ComparisonLegend({ comparisons }: ComparisonLegendProps) {
  return (
    <Html position={[-8, 5, 0]}>
      <div
        className="px-4 py-3 rounded-lg text-sm"
        style={{
          background: `${BSI_COLORS.charcoal}ee`,
          border: `1px solid ${BSI_COLORS.ember}40`,
          color: BSI_COLORS.cream,
        }}
      >
        <div className="font-bold mb-2" style={{ color: BSI_COLORS.gold }}>
          COMPARISON
        </div>
        {comparisons.map((comp, i) => (
          <div key={comp.year} className="flex items-center gap-2 mb-1">
            <div
              className="w-4 h-4 rounded"
              style={{
                backgroundColor: i === 0 ? BSI_COLORS.ember : BSI_COLORS.burntOrange,
                opacity: 1 - i * 0.3,
              }}
            />
            <span>{comp.label}</span>
          </div>
        ))}
      </div>
    </Html>
  );
}

// ============================================================================
// Grid and Axis Component
// ============================================================================

interface ChartGridProps {
  width: number;
  mode: ChartMode;
}

function ChartGrid({ width, mode }: ChartGridProps) {
  const maxHeight = 8;
  const gridLines = 5;

  return (
    <group>
      {/* Floor plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[width + 4, 6]} />
        <meshStandardMaterial
          color={BSI_COLORS.charcoal}
          metalness={0.2}
          roughness={0.8}
          transparent
          opacity={0.8}
        />
      </mesh>

      {/* Horizontal grid lines */}
      {Array.from({ length: gridLines + 1 }).map((_, i) => {
        const y = (i / gridLines) * maxHeight;
        const percentage = Math.round((i / gridLines) * 100);

        return (
          <group key={`grid-${i}`}>
            {/* Grid line */}
            <mesh position={[0, y, -2]}>
              <planeGeometry args={[width + 2, 0.02]} />
              <meshBasicMaterial
                color={BSI_COLORS.cream}
                transparent
                opacity={0.15}
              />
            </mesh>

            {/* Label */}
            <Text
              position={[-(width / 2) - 1.5, y, 0]}
              fontSize={0.3}
              color={BSI_COLORS.cream}
              anchorX="right"
              anchorY="middle"
            >
              {mode === 'percentage' ? `${percentage}%` : `.${String(percentage).padStart(3, '0')}`}
            </Text>
          </group>
        );
      })}

      {/* Y-axis */}
      <mesh position={[-(width / 2) - 0.5, maxHeight / 2, 0]}>
        <boxGeometry args={[0.05, maxHeight, 0.05]} />
        <meshStandardMaterial color={BSI_COLORS.cream} />
      </mesh>

      {/* Y-axis label */}
      <Text
        position={[-(width / 2) - 2.5, maxHeight / 2, 0]}
        fontSize={0.4}
        color={BSI_COLORS.gold}
        anchorX="center"
        anchorY="middle"
        rotation={[0, 0, Math.PI / 2]}
      >
        {mode === 'percentage' ? 'WIN PERCENTAGE' : 'WINNING PCT'}
      </Text>
    </group>
  );
}

// ============================================================================
// Main Scene Component
// ============================================================================

interface ChartSceneProps {
  standings: TeamStanding[];
  comparisonData: SeasonComparison[];
  title: string;
  sortBy: SortBy;
  mode: ChartMode;
  showGamesBack: boolean;
  showRecord: boolean;
  animate: boolean;
  enableControls: boolean;
  highlightTeam: string;
  onTeamClick?: (team: TeamStanding) => void;
  onTeamHover?: (team: TeamStanding | null) => void;
}

function ChartScene({
  standings,
  comparisonData,
  title,
  sortBy,
  mode,
  showGamesBack,
  showRecord,
  animate,
  enableControls,
  highlightTeam,
  onTeamClick,
  onTeamHover,
}: ChartSceneProps) {
  const [hoveredTeam, setHoveredTeam] = useState<string | null>(null);

  const sortedStandings = useMemo(() => sortStandings(standings, sortBy), [standings, sortBy]);
  const chartWidth = sortedStandings.length * 1.8;

  const handleTeamHover = useCallback(
    (team: TeamStanding, hovered: boolean) => {
      setHoveredTeam(hovered ? team.teamId : null);
      onTeamHover?.(hovered ? team : null);
    },
    [onTeamHover]
  );

  return (
    <>
      {/* Camera controls */}
      {enableControls && (
        <OrbitControls
          minDistance={8}
          maxDistance={40}
          minPolarAngle={Math.PI / 6}
          maxPolarAngle={Math.PI / 2.5}
          target={[0, 3, 0]}
        />
      )}

      {/* Title */}
      <Text
        position={[0, 10, 0]}
        fontSize={0.8}
        fontWeight="bold"
        color={BSI_COLORS.gold}
        anchorX="center"
        anchorY="middle"
      >
        {title}
      </Text>

      {/* Grid */}
      <ChartGrid width={chartWidth} mode={mode} />

      {/* Standing bars */}
      {sortedStandings.map((team, index) => (
        <StandingBar
          key={team.teamId}
          team={team}
          index={index}
          totalTeams={sortedStandings.length}
          mode={mode}
          animate={animate}
          showGamesBack={showGamesBack}
          showRecord={showRecord}
          isHighlighted={team.teamId === highlightTeam || team.teamId === hoveredTeam}
          onClick={() => onTeamClick?.(team)}
          onHover={(hovered) => handleTeamHover(team, hovered)}
        />
      ))}

      {/* Comparison bars */}
      {mode === 'comparison' &&
        comparisonData.map((comparison, compIndex) =>
          sortStandings(comparison.standings, sortBy).map((team, index) => (
            <StandingBar
              key={`${comparison.year}-${team.teamId}`}
              team={team}
              index={index}
              totalTeams={comparison.standings.length}
              mode={mode}
              animate={animate}
              showGamesBack={false}
              showRecord={false}
              isHighlighted={team.teamId === highlightTeam}
              comparisonIndex={compIndex + 1}
            />
          ))
        )}

      {/* Comparison legend */}
      {mode === 'comparison' && comparisonData.length > 0 && (
        <ComparisonLegend
          comparisons={[
            { year: new Date().getFullYear(), label: 'Current', standings },
            ...comparisonData,
          ]}
        />
      )}

      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[10, 15, 10]}
        intensity={0.8}
        color={BSI_COLORS.cream}
        castShadow
      />
      <pointLight position={[-10, 10, -5]} intensity={0.4} color={BSI_COLORS.ember} />
      <spotLight
        position={[0, 20, 5]}
        angle={0.4}
        penumbra={0.5}
        intensity={0.5}
        color={BSI_COLORS.gold}
      />

      <Environment preset="city" />
    </>
  );
}

// ============================================================================
// Main Component Export
// ============================================================================

/**
 * StandingsChart3D - 3D bar chart for team standings with rising pillars,
 * team colors, animated growth, comparison mode, and hover details.
 *
 * @example
 * ```tsx
 * <StandingsChart3D
 *   standings={[
 *     {
 *       teamId: 'stl',
 *       name: 'St. Louis Cardinals',
 *       abbreviation: 'STL',
 *       primaryColor: '#C41E3A',
 *       secondaryColor: '#0C2340',
 *       wins: 93,
 *       losses: 69,
 *       winPct: 0.574,
 *       gamesBack: 0,
 *       rank: 1,
 *       last10: '7-3',
 *       streak: 'W3',
 *       runDiff: 125,
 *     },
 *     // ... more teams
 *   ]}
 *   title="NL Central Standings"
 *   sortBy="winPct"
 *   showGamesBack
 *   showRecord
 *   animate
 *   enableControls
 *   highlightTeam="stl"
 * />
 * ```
 */
export function StandingsChart3D({
  standings,
  comparisonData = [],
  title = 'STANDINGS',
  sortBy = 'winPct',
  mode = 'standard',
  showGamesBack = true,
  showRecord = true,
  animate = true,
  enableControls = true,
  highlightTeam = '',
  onTeamClick,
  onTeamHover,
  className = '',
  style = {},
}: StandingsChart3DProps) {
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
        camera={{ position: [0, 8, 18], fov: 50 }}
      >
        <ChartScene
          standings={standings}
          comparisonData={comparisonData}
          title={title}
          sortBy={sortBy}
          mode={mode}
          showGamesBack={showGamesBack}
          showRecord={showRecord}
          animate={animate}
          enableControls={enableControls}
          highlightTeam={highlightTeam}
          onTeamClick={onTeamClick}
          onTeamHover={onTeamHover}
        />
      </Canvas>
    </div>
  );
}

export default StandingsChart3D;
