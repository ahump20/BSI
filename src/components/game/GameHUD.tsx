/**
 * GameHUD Component
 * In-game heads-up display for backyard baseball
 *
 * Features:
 * - Score display (home/away)
 * - Inning indicator with top/bottom
 * - Count (balls, strikes, outs)
 * - Base runner positions (diamond diagram)
 * - Power-up slots with cooldowns
 * - Pitch count tracker
 * - Pause button
 *
 * Design: Minimal, high contrast for outdoor visibility
 * Layout: Landscape-optimized with corners for key info
 *
 * @version 1.0.0
 * @lastUpdated 2025-11-26
 */

import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import type { GameHUDProps, PowerUp, RunnerPositions } from './types';
import { gameTheme } from './tokens';

const { width: _SCREEN_WIDTH, height: _SCREEN_HEIGHT } = Dimensions.get('window');

// ============================================================================
// SCOREBOARD COMPONENT
// ============================================================================

interface ScoreboardProps {
  homeScore: number;
  awayScore: number;
  inning: number;
  isTopOfInning: boolean;
}

const Scoreboard: React.FC<ScoreboardProps> = ({ homeScore, awayScore, inning, isTopOfInning }) => (
  <View
    style={scoreStyles.container}
    accessibilityRole="text"
    accessibilityLabel={`Inning ${inning} ${isTopOfInning ? 'top' : 'bottom'}, Away ${awayScore}, Home ${homeScore}`}
  >
    <View style={scoreStyles.inningContainer}>
      <Text style={scoreStyles.inningLabel}>INNING</Text>
      <View style={scoreStyles.inningDisplay}>
        <View style={scoreStyles.inningArrows}>
          <View
            style={[
              scoreStyles.arrow,
              scoreStyles.arrowUp,
              isTopOfInning && scoreStyles.arrowActive,
            ]}
          />
          <View
            style={[
              scoreStyles.arrow,
              scoreStyles.arrowDown,
              !isTopOfInning && scoreStyles.arrowActive,
            ]}
          />
        </View>
        <Text style={scoreStyles.inningNumber}>{inning}</Text>
      </View>
    </View>

    <View style={scoreStyles.scoresContainer}>
      <View style={scoreStyles.teamScore}>
        <Text style={scoreStyles.teamLabel}>AWAY</Text>
        <Text style={scoreStyles.scoreNumber}>{awayScore}</Text>
      </View>
      <Text style={scoreStyles.scoreDivider}>-</Text>
      <View style={scoreStyles.teamScore}>
        <Text style={scoreStyles.teamLabel}>HOME</Text>
        <Text style={scoreStyles.scoreNumber}>{homeScore}</Text>
      </View>
    </View>
  </View>
);

const scoreStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    borderRadius: gameTheme.borderRadius.lg,
    paddingHorizontal: gameTheme.spacing[4],
    paddingVertical: gameTheme.spacing[2],
    ...gameTheme.shadows.lg,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  inningContainer: {
    alignItems: 'center',
    marginRight: gameTheme.spacing[4],
    borderRightWidth: 1,
    borderRightColor: 'rgba(255, 255, 255, 0.2)',
    paddingRight: gameTheme.spacing[4],
  },
  inningLabel: {
    fontFamily: gameTheme.typography.fontFamily.mono,
    fontSize: gameTheme.typography.fontSize.tiny,
    color: 'rgba(255, 255, 255, 0.6)',
    letterSpacing: 1,
  },
  inningDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inningArrows: {
    marginRight: gameTheme.spacing[1],
  },
  arrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginVertical: 1,
  },
  arrowUp: {
    borderBottomWidth: 6,
    borderBottomColor: 'rgba(255, 255, 255, 0.3)',
  },
  arrowDown: {
    borderTopWidth: 6,
    borderTopColor: 'rgba(255, 255, 255, 0.3)',
  },
  arrowActive: {
    borderBottomColor: gameTheme.colors.brand.ember,
    borderTopColor: gameTheme.colors.brand.ember,
  },
  inningNumber: {
    fontFamily: gameTheme.typography.fontFamily.stats,
    fontSize: gameTheme.typography.fontSize['3xl'],
    fontWeight: gameTheme.typography.fontWeight.black,
    color: gameTheme.colors.neutral.warmWhite,
  },
  scoresContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  teamScore: {
    alignItems: 'center',
    minWidth: 50,
  },
  teamLabel: {
    fontFamily: gameTheme.typography.fontFamily.mono,
    fontSize: gameTheme.typography.fontSize.tiny,
    color: 'rgba(255, 255, 255, 0.6)',
    letterSpacing: 1,
  },
  scoreNumber: {
    fontFamily: gameTheme.typography.fontFamily.stats,
    fontSize: gameTheme.typography.fontSize['4xl'],
    fontWeight: gameTheme.typography.fontWeight.black,
    color: gameTheme.colors.neutral.warmWhite,
  },
  scoreDivider: {
    fontFamily: gameTheme.typography.fontFamily.stats,
    fontSize: gameTheme.typography.fontSize['2xl'],
    color: 'rgba(255, 255, 255, 0.4)',
    marginHorizontal: gameTheme.spacing[2],
  },
});

// ============================================================================
// COUNT DISPLAY COMPONENT
// ============================================================================

interface CountDisplayProps {
  balls: number;
  strikes: number;
  outs: number;
}

const CountDisplay: React.FC<CountDisplayProps> = ({ balls, strikes, outs }) => (
  <View
    style={countStyles.container}
    accessibilityRole="text"
    accessibilityLabel={`Count: ${balls} balls, ${strikes} strikes, ${outs} outs`}
  >
    {/* Balls */}
    <View style={countStyles.countRow}>
      <Text style={countStyles.countLabel}>B</Text>
      <View style={countStyles.dotsContainer}>
        {[0, 1, 2, 3].map((i) => (
          <View
            key={`ball-${i}`}
            style={[countStyles.dot, countStyles.ballDot, i < balls && countStyles.ballDotActive]}
          />
        ))}
      </View>
    </View>

    {/* Strikes */}
    <View style={countStyles.countRow}>
      <Text style={countStyles.countLabel}>S</Text>
      <View style={countStyles.dotsContainer}>
        {[0, 1, 2].map((i) => (
          <View
            key={`strike-${i}`}
            style={[
              countStyles.dot,
              countStyles.strikeDot,
              i < strikes && countStyles.strikeDotActive,
            ]}
          />
        ))}
      </View>
    </View>

    {/* Outs */}
    <View style={countStyles.countRow}>
      <Text style={countStyles.countLabel}>O</Text>
      <View style={countStyles.dotsContainer}>
        {[0, 1, 2].map((i) => (
          <View
            key={`out-${i}`}
            style={[countStyles.dot, countStyles.outDot, i < outs && countStyles.outDotActive]}
          />
        ))}
      </View>
    </View>
  </View>
);

const countStyles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    borderRadius: gameTheme.borderRadius.lg,
    padding: gameTheme.spacing[3],
    ...gameTheme.shadows.md,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  countRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
  },
  countLabel: {
    fontFamily: gameTheme.typography.fontFamily.stats,
    fontSize: gameTheme.typography.fontSize.sm,
    fontWeight: gameTheme.typography.fontWeight.bold,
    color: 'rgba(255, 255, 255, 0.7)',
    width: 16,
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 4,
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
  },
  ballDot: {
    borderColor: '#4CAF50',
    backgroundColor: 'transparent',
  },
  ballDotActive: {
    backgroundColor: '#4CAF50',
  },
  strikeDot: {
    borderColor: '#FFC107',
    backgroundColor: 'transparent',
  },
  strikeDotActive: {
    backgroundColor: '#FFC107',
  },
  outDot: {
    borderColor: '#F44336',
    backgroundColor: 'transparent',
  },
  outDotActive: {
    backgroundColor: '#F44336',
  },
});

// ============================================================================
// BASE DIAMOND COMPONENT
// ============================================================================

interface BaseDiamondProps {
  runners: RunnerPositions;
}

const BaseDiamond: React.FC<BaseDiamondProps> = ({ runners }) => {
  const baseSize = 70;
  const center = baseSize / 2;
  const baseRadius = 8;
  const _diamondSize = 28;

  // Base positions (rotated 45 degrees)
  const bases = {
    home: { x: center, y: baseSize - 8 },
    first: { x: baseSize - 8, y: center },
    second: { x: center, y: 8 },
    third: { x: 8, y: center },
  };

  return (
    <View
      style={diamondStyles.container}
      accessibilityRole="image"
      accessibilityLabel={`Runners: ${runners.first ? 'First' : ''}${runners.second ? ' Second' : ''}${runners.third ? ' Third' : ''}${!runners.first && !runners.second && !runners.third ? 'Bases empty' : ''}`}
    >
      <Svg width={baseSize} height={baseSize}>
        {/* Diamond outline */}
        <Path
          d={`M ${bases.home.x} ${bases.home.y} L ${bases.first.x} ${bases.first.y} L ${bases.second.x} ${bases.second.y} L ${bases.third.x} ${bases.third.y} Z`}
          fill="transparent"
          stroke="rgba(255, 255, 255, 0.4)"
          strokeWidth={2}
        />

        {/* Home plate */}
        <Path
          d={`M ${bases.home.x - 6} ${bases.home.y} L ${bases.home.x} ${bases.home.y + 6} L ${bases.home.x + 6} ${bases.home.y} L ${bases.home.x + 4} ${bases.home.y - 4} L ${bases.home.x - 4} ${bases.home.y - 4} Z`}
          fill="#FFFFFF"
        />

        {/* First base */}
        <Circle
          cx={bases.first.x}
          cy={bases.first.y}
          r={baseRadius}
          fill={runners.first ? gameTheme.colors.brand.ember : 'rgba(255, 255, 255, 0.3)'}
          stroke="#FFFFFF"
          strokeWidth={2}
        />

        {/* Second base */}
        <Circle
          cx={bases.second.x}
          cy={bases.second.y}
          r={baseRadius}
          fill={runners.second ? gameTheme.colors.brand.ember : 'rgba(255, 255, 255, 0.3)'}
          stroke="#FFFFFF"
          strokeWidth={2}
        />

        {/* Third base */}
        <Circle
          cx={bases.third.x}
          cy={bases.third.y}
          r={baseRadius}
          fill={runners.third ? gameTheme.colors.brand.ember : 'rgba(255, 255, 255, 0.3)'}
          stroke="#FFFFFF"
          strokeWidth={2}
        />
      </Svg>
    </View>
  );
};

const diamondStyles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    borderRadius: gameTheme.borderRadius.lg,
    padding: gameTheme.spacing[2],
    ...gameTheme.shadows.md,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
});

// ============================================================================
// POWER-UP SLOT COMPONENT
// ============================================================================

interface PowerUpSlotProps {
  powerUp: PowerUp | null;
  onUse: () => void;
  index: number;
}

const PowerUpSlot: React.FC<PowerUpSlotProps> = ({ powerUp, onUse, index }) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (powerUp && !powerUp.active) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [powerUp]);

  if (!powerUp) {
    return (
      <View style={powerUpStyles.emptySlot}>
        <Text style={powerUpStyles.slotNumber}>{index + 1}</Text>
      </View>
    );
  }

  return (
    <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
      <TouchableOpacity
        style={[powerUpStyles.slot, powerUp.active && powerUpStyles.slotActive]}
        onPress={onUse}
        disabled={powerUp.active}
        accessibilityRole="button"
        accessibilityLabel={`${powerUp.name}${powerUp.active ? ', active' : ', tap to use'}`}
      >
        <View style={powerUpStyles.iconPlaceholder}>
          <Text style={powerUpStyles.iconText}>{powerUp.type.charAt(0).toUpperCase()}</Text>
        </View>
        {powerUp.uses !== undefined && (
          <View style={powerUpStyles.usesBadge}>
            <Text style={powerUpStyles.usesText}>{powerUp.uses}</Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const powerUpStyles = StyleSheet.create({
  emptySlot: {
    width: 52,
    height: 52,
    borderRadius: gameTheme.borderRadius.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotNumber: {
    fontFamily: gameTheme.typography.fontFamily.mono,
    fontSize: gameTheme.typography.fontSize.lg,
    color: 'rgba(255, 255, 255, 0.3)',
  },
  slot: {
    width: 52,
    height: 52,
    borderRadius: gameTheme.borderRadius.lg,
    backgroundColor: gameTheme.colors.game.grass.dark,
    borderWidth: 2,
    borderColor: gameTheme.colors.game.grass.light,
    alignItems: 'center',
    justifyContent: 'center',
    ...gameTheme.shadows.md,
  },
  slotActive: {
    backgroundColor: gameTheme.colors.brand.ember,
    borderColor: gameTheme.colors.brand.burntOrange,
  },
  iconPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontFamily: gameTheme.typography.fontFamily.stats,
    fontSize: gameTheme.typography.fontSize.lg,
    fontWeight: gameTheme.typography.fontWeight.bold,
    color: gameTheme.colors.neutral.warmWhite,
  },
  usesBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: gameTheme.colors.brand.ember,
    alignItems: 'center',
    justifyContent: 'center',
  },
  usesText: {
    fontFamily: gameTheme.typography.fontFamily.mono,
    fontSize: 10,
    fontWeight: gameTheme.typography.fontWeight.bold,
    color: gameTheme.colors.neutral.warmWhite,
  },
});

// ============================================================================
// PITCH COUNT COMPONENT
// ============================================================================

interface PitchCountProps {
  count: number;
}

const PitchCount: React.FC<PitchCountProps> = ({ count }) => (
  <View
    style={pitchStyles.container}
    accessibilityRole="text"
    accessibilityLabel={`Pitch count: ${count}`}
  >
    <Text style={pitchStyles.label}>PITCHES</Text>
    <Text style={pitchStyles.count}>{count}</Text>
  </View>
);

const pitchStyles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    borderRadius: gameTheme.borderRadius.lg,
    paddingHorizontal: gameTheme.spacing[3],
    paddingVertical: gameTheme.spacing[2],
    alignItems: 'center',
    ...gameTheme.shadows.md,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  label: {
    fontFamily: gameTheme.typography.fontFamily.mono,
    fontSize: gameTheme.typography.fontSize.tiny,
    color: 'rgba(255, 255, 255, 0.6)',
    letterSpacing: 1,
  },
  count: {
    fontFamily: gameTheme.typography.fontFamily.stats,
    fontSize: gameTheme.typography.fontSize['2xl'],
    fontWeight: gameTheme.typography.fontWeight.black,
    color: gameTheme.colors.neutral.warmWhite,
  },
});

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const GameHUD: React.FC<GameHUDProps> = ({
  gameState,
  powerUps,
  isPaused,
  onPausePress,
  onPowerUpUse,
}) => {
  const paddedPowerUps: (PowerUp | null)[] = [
    ...powerUps,
    ...Array(Math.max(0, 3 - powerUps.length)).fill(null),
  ];

  return (
    <View style={styles.container} pointerEvents="box-none">
      {/* Top Row: Scoreboard + Pause */}
      <View style={styles.topRow}>
        <Scoreboard
          homeScore={gameState.homeScore}
          awayScore={gameState.awayScore}
          inning={gameState.inning}
          isTopOfInning={gameState.isTopOfInning}
        />

        <TouchableOpacity
          style={styles.pauseButton}
          onPress={onPausePress}
          accessibilityRole="button"
          accessibilityLabel={isPaused ? 'Resume game' : 'Pause game'}
        >
          <View style={styles.pauseIcon}>
            {isPaused ? (
              <View style={styles.playTriangle} />
            ) : (
              <>
                <View style={styles.pauseBar} />
                <View style={styles.pauseBar} />
              </>
            )}
          </View>
        </TouchableOpacity>
      </View>

      {/* Left Side: Count + Base Diamond */}
      <View style={styles.leftColumn}>
        <CountDisplay balls={gameState.balls} strikes={gameState.strikes} outs={gameState.outs} />
        <BaseDiamond runners={gameState.runners} />
      </View>

      {/* Right Side: Pitch Count */}
      <View style={styles.rightColumn}>
        <PitchCount count={gameState.pitchCount} />
      </View>

      {/* Bottom: Power-ups */}
      <View style={styles.bottomRow}>
        <View style={styles.powerUpsContainer}>
          {paddedPowerUps.slice(0, 3).map((powerUp, index) => (
            <PowerUpSlot
              key={powerUp?.id || `empty-${index}`}
              powerUp={powerUp}
              onUse={() => powerUp && onPowerUpUse(powerUp)}
              index={index}
            />
          ))}
        </View>
      </View>
    </View>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: gameTheme.zIndex.hud,
  },

  // Top Row
  topRow: {
    position: 'absolute',
    top: gameTheme.spacing[4],
    left: gameTheme.spacing[4],
    right: gameTheme.spacing[4],
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  pauseButton: {
    width: gameTheme.touchTargets.standard,
    height: gameTheme.touchTargets.standard,
    borderRadius: gameTheme.touchTargets.standard / 2,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    ...gameTheme.shadows.md,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  pauseIcon: {
    flexDirection: 'row',
    gap: 4,
  },
  pauseBar: {
    width: 4,
    height: 18,
    backgroundColor: gameTheme.colors.neutral.warmWhite,
    borderRadius: 2,
  },
  playTriangle: {
    width: 0,
    height: 0,
    borderLeftWidth: 14,
    borderTopWidth: 9,
    borderBottomWidth: 9,
    borderLeftColor: gameTheme.colors.neutral.warmWhite,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    marginLeft: 3,
  },

  // Left Column
  leftColumn: {
    position: 'absolute',
    left: gameTheme.spacing[4],
    top: '50%',
    transform: [{ translateY: -60 }],
    gap: gameTheme.spacing[3],
  },

  // Right Column
  rightColumn: {
    position: 'absolute',
    right: gameTheme.spacing[4],
    top: '50%',
    transform: [{ translateY: -30 }],
  },

  // Bottom Row
  bottomRow: {
    position: 'absolute',
    bottom: gameTheme.spacing[4],
    left: gameTheme.spacing[4],
    right: gameTheme.spacing[4],
    alignItems: 'center',
  },
  powerUpsContainer: {
    flexDirection: 'row',
    gap: gameTheme.spacing[2],
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: gameTheme.spacing[2],
    borderRadius: gameTheme.borderRadius.xl,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
});

export default GameHUD;
