/**
 * CharacterSelect Component
 * Grid-based character selection with stats radar chart
 *
 * Features:
 * - Character grid with lock/unlock states
 * - Stats radar chart visualization
 * - Team builder with roster slots
 * - Rarity indicators
 * - Smooth selection animations
 *
 * @version 1.0.0
 * @lastUpdated 2025-11-26
 */

import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  Animated,
  StyleSheet,
  Dimensions,
} from 'react-native';
import Svg, { Polygon, Circle, Line, Text as SvgText } from 'react-native-svg';
import type { CharacterSelectProps, Player, PlayerStats } from './types';
import { gameTheme } from './tokens';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_COLUMNS = SCREEN_WIDTH > 700 ? 4 : 3;
const CARD_GAP = gameTheme.spacing[3];
const CARD_WIDTH =
  (SCREEN_WIDTH - gameTheme.spacing[8] * 2 - CARD_GAP * (GRID_COLUMNS - 1)) / GRID_COLUMNS;

// ============================================================================
// RADAR CHART COMPONENT
// ============================================================================

interface RadarChartProps {
  stats: PlayerStats;
  size?: number;
}

const RadarChart: React.FC<RadarChartProps> = ({ stats, size = 160 }) => {
  const center = size / 2;
  const radius = (size - 40) / 2;
  const statLabels = ['BAT', 'PWR', 'SPD', 'FLD', 'ACC', 'PIT'];
  const statValues = [
    stats.batting,
    stats.power,
    stats.speed,
    stats.fielding,
    stats.accuracy,
    stats.pitching,
  ];

  // Calculate polygon points
  const getPoint = (value: number, index: number): { x: number; y: number } => {
    const angle = (Math.PI * 2 * index) / 6 - Math.PI / 2;
    const scaledRadius = (value / 100) * radius;
    return {
      x: center + Math.cos(angle) * scaledRadius,
      y: center + Math.sin(angle) * scaledRadius,
    };
  };

  const getLabelPoint = (index: number): { x: number; y: number } => {
    const angle = (Math.PI * 2 * index) / 6 - Math.PI / 2;
    const labelRadius = radius + 16;
    return {
      x: center + Math.cos(angle) * labelRadius,
      y: center + Math.sin(angle) * labelRadius,
    };
  };

  const polygonPoints = statValues
    .map((value, index) => {
      const point = getPoint(value, index);
      return `${point.x},${point.y}`;
    })
    .join(' ');

  // Grid lines (25%, 50%, 75%, 100%)
  const gridLevels = [0.25, 0.5, 0.75, 1];

  return (
    <View style={radarStyles.container}>
      <Svg width={size} height={size}>
        {/* Grid circles */}
        {gridLevels.map((level, i) => (
          <Circle
            key={`grid-${i}`}
            cx={center}
            cy={center}
            r={radius * level}
            fill="none"
            stroke="rgba(255, 255, 255, 0.2)"
            strokeWidth={1}
          />
        ))}

        {/* Axis lines */}
        {[0, 1, 2, 3, 4, 5].map((index) => {
          const point = getPoint(100, index);
          return (
            <Line
              key={`axis-${index}`}
              x1={center}
              y1={center}
              x2={point.x}
              y2={point.y}
              stroke="rgba(255, 255, 255, 0.15)"
              strokeWidth={1}
            />
          );
        })}

        {/* Stats polygon */}
        <Polygon
          points={polygonPoints}
          fill={`${gameTheme.colors.brand.ember}66`}
          stroke={gameTheme.colors.brand.ember}
          strokeWidth={2}
        />

        {/* Stat value dots */}
        {statValues.map((value, index) => {
          const point = getPoint(value, index);
          return (
            <Circle
              key={`dot-${index}`}
              cx={point.x}
              cy={point.y}
              r={4}
              fill={gameTheme.colors.brand.ember}
              stroke={gameTheme.colors.neutral.warmWhite}
              strokeWidth={2}
            />
          );
        })}

        {/* Labels */}
        {statLabels.map((label, index) => {
          const point = getLabelPoint(index);
          return (
            <SvgText
              key={`label-${index}`}
              x={point.x}
              y={point.y + 4}
              fontSize={10}
              fontWeight="600"
              fill={gameTheme.colors.neutral.warmWhite}
              textAnchor="middle"
            >
              {label}
            </SvgText>
          );
        })}
      </Svg>

      {/* Stat values below */}
      <View style={radarStyles.statsRow}>
        {statLabels.map((label, index) => (
          <View key={label} style={radarStyles.statItem}>
            <Text style={radarStyles.statValue}>{statValues[index]}</Text>
            <Text style={radarStyles.statLabel}>{label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const radarStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: gameTheme.spacing[3],
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: gameTheme.spacing[2],
    paddingHorizontal: gameTheme.spacing[2],
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontFamily: gameTheme.typography.fontFamily.stats,
    fontSize: gameTheme.typography.fontSize.lg,
    fontWeight: gameTheme.typography.fontWeight.bold,
    color: gameTheme.colors.brand.ember,
  },
  statLabel: {
    fontFamily: gameTheme.typography.fontFamily.mono,
    fontSize: gameTheme.typography.fontSize.tiny,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 2,
  },
});

// ============================================================================
// CHARACTER CARD COMPONENT
// ============================================================================

interface CharacterCardProps {
  character: Player;
  isSelected: boolean;
  onPress: () => void;
}

const CharacterCard: React.FC<CharacterCardProps> = ({ character, isSelected, onPress }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
      ...gameTheme.animations.spring.bouncy,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      ...gameTheme.animations.spring.gentle,
    }).start();
  };

  const rarityColor = {
    common: '#9E9E9E',
    uncommon: '#4CAF50',
    rare: '#2196F3',
    epic: '#9C27B0',
    legendary: '#FFD700',
  }[character.rarity];

  const teamColors = gameTheme.colors.game.team[character.teamColor];

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={[
          cardStyles.container,
          isSelected && cardStyles.selected,
          !character.unlocked && cardStyles.locked,
        ]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={!character.unlocked}
        accessibilityRole="button"
        accessibilityLabel={`${character.name}, ${character.rarity} ${character.position}${
          !character.unlocked ? ', locked' : ''
        }${isSelected ? ', selected' : ''}`}
        accessibilityState={{ selected: isSelected, disabled: !character.unlocked }}
      >
        {/* Rarity border glow */}
        <View style={[cardStyles.rarityGlow, { backgroundColor: rarityColor }]} />

        {/* Card content */}
        <View style={[cardStyles.inner, { backgroundColor: teamColors.secondary }]}>
          {/* Avatar */}
          <View style={cardStyles.avatarContainer}>
            <Image
              source={{ uri: character.avatarUri }}
              style={[cardStyles.avatar, !character.unlocked && cardStyles.avatarLocked]}
            />
            {!character.unlocked && (
              <View style={cardStyles.lockOverlay}>
                <View style={cardStyles.lockIcon} />
              </View>
            )}
          </View>

          {/* Name & Position */}
          <Text style={cardStyles.name} numberOfLines={1}>
            {character.nickname || character.name}
          </Text>
          <Text style={[cardStyles.position, { color: teamColors.primary }]}>
            {character.position}
          </Text>

          {/* Rarity badge */}
          <View style={[cardStyles.rarityBadge, { backgroundColor: rarityColor }]}>
            <Text style={cardStyles.rarityText}>{character.rarity.toUpperCase()}</Text>
          </View>
        </View>

        {/* Selection indicator */}
        {isSelected && (
          <View style={cardStyles.selectionIndicator}>
            <Text style={cardStyles.checkmark}>CHECK</Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const cardStyles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    borderRadius: gameTheme.borderRadius.card,
    overflow: 'hidden',
    ...gameTheme.shadows.md,
  },
  selected: {
    borderWidth: 3,
    borderColor: gameTheme.colors.brand.ember,
  },
  locked: {
    opacity: 0.6,
  },
  rarityGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
  },
  inner: {
    padding: gameTheme.spacing[2],
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: gameTheme.spacing[2],
  },
  avatar: {
    width: CARD_WIDTH - gameTheme.spacing[4],
    height: CARD_WIDTH - gameTheme.spacing[4],
    borderRadius: gameTheme.borderRadius.lg,
    resizeMode: 'cover',
  },
  avatarLocked: {
    opacity: 0.4,
  },
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: gameTheme.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockIcon: {
    width: 32,
    height: 40,
    backgroundColor: '#757575',
    borderRadius: 4,
  },
  name: {
    fontFamily: gameTheme.typography.fontFamily.display,
    fontSize: gameTheme.typography.fontSize.base,
    fontWeight: gameTheme.typography.fontWeight.bold,
    color: gameTheme.colors.neutral.charcoal,
    textAlign: 'center',
  },
  position: {
    fontFamily: gameTheme.typography.fontFamily.stats,
    fontSize: gameTheme.typography.fontSize.sm,
    fontWeight: gameTheme.typography.fontWeight.semibold,
    marginTop: 2,
  },
  rarityBadge: {
    position: 'absolute',
    top: gameTheme.spacing[1],
    right: gameTheme.spacing[1],
    paddingHorizontal: gameTheme.spacing[1.5],
    paddingVertical: 2,
    borderRadius: gameTheme.borderRadius.badge,
  },
  rarityText: {
    fontFamily: gameTheme.typography.fontFamily.mono,
    fontSize: 8,
    fontWeight: gameTheme.typography.fontWeight.bold,
    color: gameTheme.colors.neutral.warmWhite,
    letterSpacing: 0.5,
  },
  selectionIndicator: {
    position: 'absolute',
    top: gameTheme.spacing[2],
    left: gameTheme.spacing[2],
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: gameTheme.colors.game.status.win,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    color: gameTheme.colors.neutral.warmWhite,
    fontSize: 10,
    fontWeight: gameTheme.typography.fontWeight.bold,
  },
});

// ============================================================================
// TEAM ROSTER COMPONENT
// ============================================================================

interface TeamRosterProps {
  team: Player[];
  maxSize: number;
  onRemove: (character: Player) => void;
}

const TeamRoster: React.FC<TeamRosterProps> = ({ team, maxSize, onRemove }) => {
  const emptySlots = maxSize - team.length;

  return (
    <View style={rosterStyles.container}>
      <Text style={rosterStyles.title}>
        YOUR ROSTER ({team.length}/{maxSize})
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={rosterStyles.scrollContent}
      >
        {team.map((player) => (
          <TouchableOpacity
            key={player.id}
            style={rosterStyles.slot}
            onPress={() => onRemove(player)}
            accessibilityRole="button"
            accessibilityLabel={`Remove ${player.name} from roster`}
          >
            <Image source={{ uri: player.avatarUri }} style={rosterStyles.slotAvatar} />
            <View style={rosterStyles.removeButton}>
              <Text style={rosterStyles.removeText}>X</Text>
            </View>
          </TouchableOpacity>
        ))}
        {Array(emptySlots)
          .fill(null)
          .map((_, index) => (
            <View key={`empty-${index}`} style={rosterStyles.emptySlot}>
              <Text style={rosterStyles.emptyText}>+</Text>
            </View>
          ))}
      </ScrollView>
    </View>
  );
};

const rosterStyles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingVertical: gameTheme.spacing[3],
    paddingHorizontal: gameTheme.spacing[4],
  },
  title: {
    fontFamily: gameTheme.typography.fontFamily.stats,
    fontSize: gameTheme.typography.fontSize.sm,
    fontWeight: gameTheme.typography.fontWeight.bold,
    color: gameTheme.colors.neutral.warmWhite,
    marginBottom: gameTheme.spacing[2],
    letterSpacing: 1,
  },
  scrollContent: {
    gap: gameTheme.spacing[2],
  },
  slot: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: gameTheme.colors.brand.ember,
    position: 'relative',
  },
  slotAvatar: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  removeButton: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: gameTheme.colors.game.status.loss,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeText: {
    color: gameTheme.colors.neutral.warmWhite,
    fontSize: 12,
    fontWeight: gameTheme.typography.fontWeight.bold,
  },
  emptySlot: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 24,
    color: 'rgba(255, 255, 255, 0.3)',
  },
});

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const CharacterSelect: React.FC<CharacterSelectProps> = ({
  characters,
  selectedTeam,
  maxTeamSize,
  onCharacterSelect,
  onCharacterDeselect,
  onConfirm,
  onBack,
}) => {
  const [previewCharacter, setPreviewCharacter] = useState<Player | null>(
    selectedTeam[0] || characters.find((c) => c.unlocked) || null
  );

  const isTeamFull = selectedTeam.length >= maxTeamSize;
  const canConfirm = selectedTeam.length > 0;

  const handleCardPress = (character: Player) => {
    setPreviewCharacter(character);

    const isSelected = selectedTeam.some((p) => p.id === character.id);
    if (isSelected) {
      onCharacterDeselect(character);
    } else if (!isTeamFull) {
      onCharacterSelect(character);
    }
  };

  const sortedCharacters = useMemo(() => {
    const rarityOrder = { legendary: 0, epic: 1, rare: 2, uncommon: 3, common: 4 };
    return [...characters].sort((a, b) => {
      // Unlocked first
      if (a.unlocked !== b.unlocked) return a.unlocked ? -1 : 1;
      // Then by rarity
      return rarityOrder[a.rarity] - rarityOrder[b.rarity];
    });
  }, [characters]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Text style={styles.backButtonText}>BACK</Text>
        </TouchableOpacity>
        <Text style={styles.title}>PICK YOUR TEAM</Text>
        <TouchableOpacity
          style={[styles.confirmButton, !canConfirm && styles.confirmButtonDisabled]}
          onPress={onConfirm}
          disabled={!canConfirm}
          accessibilityRole="button"
          accessibilityLabel="Confirm team selection"
          accessibilityState={{ disabled: !canConfirm }}
        >
          <Text style={styles.confirmButtonText}>READY</Text>
        </TouchableOpacity>
      </View>

      {/* Main content area */}
      <View style={styles.content}>
        {/* Character Grid */}
        <ScrollView
          style={styles.gridContainer}
          contentContainerStyle={styles.gridContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.grid}>
            {sortedCharacters.map((character) => (
              <CharacterCard
                key={character.id}
                character={character}
                isSelected={selectedTeam.some((p) => p.id === character.id)}
                onPress={() => handleCardPress(character)}
              />
            ))}
          </View>
        </ScrollView>

        {/* Preview Panel */}
        {previewCharacter && (
          <View style={styles.previewPanel}>
            <View style={styles.previewHeader}>
              <Image source={{ uri: previewCharacter.avatarUri }} style={styles.previewAvatar} />
              <View style={styles.previewInfo}>
                <Text style={styles.previewName}>
                  {previewCharacter.nickname || previewCharacter.name}
                </Text>
                <Text style={styles.previewPosition}>{previewCharacter.position}</Text>
              </View>
            </View>
            <RadarChart stats={previewCharacter.stats} size={180} />
          </View>
        )}
      </View>

      {/* Team Roster */}
      <TeamRoster team={selectedTeam} maxSize={maxTeamSize} onRemove={onCharacterDeselect} />
    </View>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: gameTheme.colors.neutral.charcoal,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: gameTheme.spacing[4],
    paddingVertical: gameTheme.spacing[3],
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  backButton: {
    paddingHorizontal: gameTheme.spacing[4],
    paddingVertical: gameTheme.spacing[2],
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: gameTheme.borderRadius.button,
    minWidth: gameTheme.touchTargets.minimum,
    minHeight: gameTheme.touchTargets.minimum,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontFamily: gameTheme.typography.fontFamily.stats,
    fontSize: gameTheme.typography.fontSize.sm,
    fontWeight: gameTheme.typography.fontWeight.bold,
    color: gameTheme.colors.neutral.warmWhite,
  },
  title: {
    fontFamily: gameTheme.typography.fontFamily.display,
    fontSize: gameTheme.typography.fontSize['2xl'],
    fontWeight: gameTheme.typography.fontWeight.black,
    color: gameTheme.colors.neutral.warmWhite,
    letterSpacing: 2,
  },
  confirmButton: {
    paddingHorizontal: gameTheme.spacing[5],
    paddingVertical: gameTheme.spacing[2],
    backgroundColor: gameTheme.colors.brand.ember,
    borderRadius: gameTheme.borderRadius.button,
    minWidth: gameTheme.touchTargets.minimum,
    minHeight: gameTheme.touchTargets.minimum,
    alignItems: 'center',
    justifyContent: 'center',
    ...gameTheme.shadows.md,
  },
  confirmButtonDisabled: {
    backgroundColor: gameTheme.colors.game.ui.buttonDisabled,
  },
  confirmButtonText: {
    fontFamily: gameTheme.typography.fontFamily.stats,
    fontSize: gameTheme.typography.fontSize.base,
    fontWeight: gameTheme.typography.fontWeight.bold,
    color: gameTheme.colors.neutral.warmWhite,
    letterSpacing: 1,
  },

  // Content
  content: {
    flex: 1,
    flexDirection: 'row',
  },
  gridContainer: {
    flex: 1,
  },
  gridContent: {
    padding: gameTheme.spacing[4],
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: CARD_GAP,
  },

  // Preview Panel
  previewPanel: {
    width: 220,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: gameTheme.spacing[4],
    alignItems: 'center',
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: gameTheme.spacing[3],
  },
  previewAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: gameTheme.colors.brand.ember,
  },
  previewInfo: {
    marginLeft: gameTheme.spacing[3],
  },
  previewName: {
    fontFamily: gameTheme.typography.fontFamily.display,
    fontSize: gameTheme.typography.fontSize.lg,
    fontWeight: gameTheme.typography.fontWeight.bold,
    color: gameTheme.colors.neutral.warmWhite,
  },
  previewPosition: {
    fontFamily: gameTheme.typography.fontFamily.stats,
    fontSize: gameTheme.typography.fontSize.sm,
    color: gameTheme.colors.brand.ember,
    marginTop: 2,
  },
});

export default CharacterSelect;
