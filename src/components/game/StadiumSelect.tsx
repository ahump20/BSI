/**
 * StadiumSelect Component
 * Stadium selection with preview and special rules display
 *
 * Features:
 * - Stadium preview cards with images
 * - Time of day/weather indicators
 * - Special rules showcase
 * - Lock/unlock states with requirements
 * - Smooth selection animations
 *
 * @version 1.0.0
 * @lastUpdated 2025-11-26
 */

import React, { useState as _useState, useRef, useEffect } from 'react';
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
import type { StadiumSelectProps, Stadium, SpecialRule, TimeOfDay, Weather } from './types';
import { gameTheme } from './tokens';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const IS_LANDSCAPE = SCREEN_WIDTH > SCREEN_HEIGHT;
const CARD_WIDTH = IS_LANDSCAPE ? 280 : SCREEN_WIDTH * 0.8;
const CARD_HEIGHT = IS_LANDSCAPE ? 200 : 160;

// ============================================================================
// TIME OF DAY INDICATOR
// ============================================================================

interface TimeIndicatorProps {
  timeOfDay: TimeOfDay;
}

const TimeIndicator: React.FC<TimeIndicatorProps> = ({ timeOfDay }) => {
  const config = {
    morning: { color: gameTheme.colors.game.sky.morning, icon: 'sunrise', label: 'Morning' },
    noon: { color: gameTheme.colors.game.sky.noon, icon: 'sun', label: 'Day Game' },
    sunset: { color: gameTheme.colors.game.sky.sunset, icon: 'sunset', label: 'Golden Hour' },
    dusk: { color: gameTheme.colors.game.sky.dusk, icon: 'moon', label: 'Twilight' },
    night: { color: gameTheme.colors.game.sky.night, icon: 'stars', label: 'Night Game' },
  }[timeOfDay];

  return (
    <View style={[timeStyles.container, { backgroundColor: config.color }]}>
      <Text style={timeStyles.label}>{config.label}</Text>
    </View>
  );
};

const timeStyles = StyleSheet.create({
  container: {
    paddingHorizontal: gameTheme.spacing[2],
    paddingVertical: gameTheme.spacing[1],
    borderRadius: gameTheme.borderRadius.badge,
    marginRight: gameTheme.spacing[1],
  },
  label: {
    fontFamily: gameTheme.typography.fontFamily.mono,
    fontSize: gameTheme.typography.fontSize.tiny,
    fontWeight: gameTheme.typography.fontWeight.bold,
    color: gameTheme.colors.neutral.charcoal,
    letterSpacing: 0.5,
  },
});

// ============================================================================
// WEATHER INDICATOR
// ============================================================================

interface WeatherIndicatorProps {
  weather: Weather;
}

const WeatherIndicator: React.FC<WeatherIndicatorProps> = ({ weather }) => {
  const config = {
    sunny: { emoji: 'SUN', label: 'Clear', color: '#FFD700' },
    cloudy: { emoji: 'CLD', label: 'Cloudy', color: '#B0BEC5' },
    overcast: { emoji: 'OVC', label: 'Overcast', color: '#78909C' },
    rain: { emoji: 'RN', label: 'Rainy', color: '#42A5F5' },
    snow: { emoji: 'SNW', label: 'Snow', color: '#E3F2FD' },
  }[weather];

  return (
    <View style={[weatherStyles.container, { backgroundColor: config.color }]}>
      <Text style={weatherStyles.label}>{config.label}</Text>
    </View>
  );
};

const weatherStyles = StyleSheet.create({
  container: {
    paddingHorizontal: gameTheme.spacing[2],
    paddingVertical: gameTheme.spacing[1],
    borderRadius: gameTheme.borderRadius.badge,
  },
  label: {
    fontFamily: gameTheme.typography.fontFamily.mono,
    fontSize: gameTheme.typography.fontSize.tiny,
    fontWeight: gameTheme.typography.fontWeight.bold,
    color: gameTheme.colors.neutral.charcoal,
    letterSpacing: 0.5,
  },
});

// ============================================================================
// SPECIAL RULE BADGE
// ============================================================================

interface SpecialRuleBadgeProps {
  rule: SpecialRule;
}

const SpecialRuleBadge: React.FC<SpecialRuleBadgeProps> = ({ rule }) => (
  <View style={ruleStyles.badge} accessibilityLabel={`${rule.name}: ${rule.description}`}>
    <View style={ruleStyles.icon} />
    <Text style={ruleStyles.name}>{rule.name}</Text>
  </View>
);

const ruleStyles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(191, 87, 0, 0.3)',
    paddingHorizontal: gameTheme.spacing[2],
    paddingVertical: gameTheme.spacing[1],
    borderRadius: gameTheme.borderRadius.badge,
    borderWidth: 1,
    borderColor: 'rgba(191, 87, 0, 0.5)',
    marginRight: gameTheme.spacing[1],
    marginBottom: gameTheme.spacing[1],
  },
  icon: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: gameTheme.colors.brand.ember,
    marginRight: gameTheme.spacing[1],
  },
  name: {
    fontFamily: gameTheme.typography.fontFamily.body,
    fontSize: gameTheme.typography.fontSize.xs,
    fontWeight: gameTheme.typography.fontWeight.semibold,
    color: gameTheme.colors.neutral.warmWhite,
  },
});

// ============================================================================
// STADIUM CARD COMPONENT
// ============================================================================

interface StadiumCardProps {
  stadium: Stadium;
  isSelected: boolean;
  onPress: () => void;
}

const StadiumCard: React.FC<StadiumCardProps> = ({ stadium, isSelected, onPress }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const borderAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(borderAnim, {
      toValue: isSelected ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isSelected]);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
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

  const borderColor = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(255, 255, 255, 0.2)', gameTheme.colors.brand.ember],
  });

  const borderWidth = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [2, 4],
  });

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={!stadium.unlocked}
        accessibilityRole="button"
        accessibilityLabel={`${stadium.name}${!stadium.unlocked ? ', locked' : ''}${isSelected ? ', selected' : ''}`}
        accessibilityState={{ selected: isSelected, disabled: !stadium.unlocked }}
        activeOpacity={0.9}
      >
        <Animated.View
          style={[
            cardStyles.container,
            { borderColor, borderWidth },
            !stadium.unlocked && cardStyles.locked,
          ]}
        >
          {/* Preview Image */}
          <View style={cardStyles.imageContainer}>
            <Image
              source={{ uri: stadium.previewUri }}
              style={cardStyles.image}
              blurRadius={stadium.unlocked ? 0 : 5}
            />

            {/* Lock overlay */}
            {!stadium.unlocked && (
              <View style={cardStyles.lockOverlay}>
                <View style={cardStyles.lockIcon} />
                <Text style={cardStyles.lockText}>LOCKED</Text>
                {stadium.unlockRequirement && (
                  <Text style={cardStyles.requirementText}>{stadium.unlockRequirement}</Text>
                )}
              </View>
            )}

            {/* Time & Weather badges */}
            {stadium.unlocked && (
              <View style={cardStyles.badgesContainer}>
                <TimeIndicator timeOfDay={stadium.timeOfDay} />
                <WeatherIndicator weather={stadium.weather} />
              </View>
            )}
          </View>

          {/* Info Section */}
          <View style={cardStyles.infoSection}>
            <Text style={cardStyles.name}>{stadium.name}</Text>
            <Text style={cardStyles.description} numberOfLines={2}>
              {stadium.description}
            </Text>

            {/* Special Rules */}
            {stadium.unlocked && stadium.specialRules.length > 0 && (
              <View style={cardStyles.rulesContainer}>
                {stadium.specialRules.map((rule) => (
                  <SpecialRuleBadge key={rule.id} rule={rule} />
                ))}
              </View>
            )}
          </View>

          {/* Selection indicator */}
          {isSelected && (
            <View style={cardStyles.selectionIndicator}>
              <Text style={cardStyles.checkText}>SELECTED</Text>
            </View>
          )}
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const cardStyles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    backgroundColor: gameTheme.colors.neutral.charcoal,
    borderRadius: gameTheme.borderRadius.xl,
    overflow: 'hidden',
    ...gameTheme.shadows.lg,
    marginBottom: gameTheme.spacing[4],
  },
  locked: {
    opacity: 0.7,
  },
  imageContainer: {
    width: '100%',
    height: CARD_HEIGHT,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  badgesContainer: {
    position: 'absolute',
    top: gameTheme.spacing[2],
    left: gameTheme.spacing[2],
    flexDirection: 'row',
  },
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockIcon: {
    width: 40,
    height: 50,
    backgroundColor: '#757575',
    borderRadius: 4,
    marginBottom: gameTheme.spacing[2],
  },
  lockText: {
    fontFamily: gameTheme.typography.fontFamily.stats,
    fontSize: gameTheme.typography.fontSize.lg,
    fontWeight: gameTheme.typography.fontWeight.bold,
    color: '#9E9E9E',
    letterSpacing: 2,
  },
  requirementText: {
    fontFamily: gameTheme.typography.fontFamily.body,
    fontSize: gameTheme.typography.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: gameTheme.spacing[1],
    textAlign: 'center',
    paddingHorizontal: gameTheme.spacing[4],
  },
  infoSection: {
    padding: gameTheme.spacing[4],
  },
  name: {
    fontFamily: gameTheme.typography.fontFamily.display,
    fontSize: gameTheme.typography.fontSize.xl,
    fontWeight: gameTheme.typography.fontWeight.bold,
    color: gameTheme.colors.neutral.warmWhite,
    marginBottom: gameTheme.spacing[1],
  },
  description: {
    fontFamily: gameTheme.typography.fontFamily.body,
    fontSize: gameTheme.typography.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 20,
    marginBottom: gameTheme.spacing[2],
  },
  rulesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: gameTheme.spacing[2],
  },
  selectionIndicator: {
    position: 'absolute',
    top: gameTheme.spacing[2],
    right: gameTheme.spacing[2],
    backgroundColor: gameTheme.colors.brand.ember,
    paddingHorizontal: gameTheme.spacing[3],
    paddingVertical: gameTheme.spacing[1],
    borderRadius: gameTheme.borderRadius.full,
    ...gameTheme.shadows.md,
  },
  checkText: {
    fontFamily: gameTheme.typography.fontFamily.mono,
    fontSize: gameTheme.typography.fontSize.tiny,
    fontWeight: gameTheme.typography.fontWeight.bold,
    color: gameTheme.colors.neutral.warmWhite,
    letterSpacing: 1,
  },
});

// ============================================================================
// STADIUM PREVIEW PANEL
// ============================================================================

interface PreviewPanelProps {
  stadium: Stadium;
}

const PreviewPanel: React.FC<PreviewPanelProps> = ({ stadium }) => (
  <View style={previewStyles.container}>
    <Image source={{ uri: stadium.previewUri }} style={previewStyles.image} />
    <View style={previewStyles.overlay}>
      <Text style={previewStyles.name}>{stadium.name}</Text>
      <Text style={previewStyles.description}>{stadium.description}</Text>

      <View style={previewStyles.detailsRow}>
        <TimeIndicator timeOfDay={stadium.timeOfDay} />
        <WeatherIndicator weather={stadium.weather} />
      </View>

      {stadium.specialRules.length > 0 && (
        <View style={previewStyles.rulesSection}>
          <Text style={previewStyles.rulesTitle}>SPECIAL RULES</Text>
          {stadium.specialRules.map((rule) => (
            <View key={rule.id} style={previewStyles.ruleItem}>
              <View style={previewStyles.ruleIcon} />
              <View style={previewStyles.ruleInfo}>
                <Text style={previewStyles.ruleName}>{rule.name}</Text>
                <Text style={previewStyles.ruleDescription}>{rule.description}</Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  </View>
);

const previewStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: gameTheme.colors.neutral.charcoal,
    borderRadius: gameTheme.borderRadius.xl,
    overflow: 'hidden',
    ...gameTheme.shadows.xl,
  },
  image: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  overlay: {
    flex: 1,
    padding: gameTheme.spacing[5],
  },
  name: {
    fontFamily: gameTheme.typography.fontFamily.display,
    fontSize: gameTheme.typography.fontSize['3xl'],
    fontWeight: gameTheme.typography.fontWeight.black,
    color: gameTheme.colors.neutral.warmWhite,
    marginBottom: gameTheme.spacing[2],
  },
  description: {
    fontFamily: gameTheme.typography.fontFamily.body,
    fontSize: gameTheme.typography.fontSize.base,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 24,
    marginBottom: gameTheme.spacing[4],
  },
  detailsRow: {
    flexDirection: 'row',
    marginBottom: gameTheme.spacing[4],
  },
  rulesSection: {
    marginTop: gameTheme.spacing[4],
    paddingTop: gameTheme.spacing[4],
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  rulesTitle: {
    fontFamily: gameTheme.typography.fontFamily.stats,
    fontSize: gameTheme.typography.fontSize.sm,
    fontWeight: gameTheme.typography.fontWeight.bold,
    color: gameTheme.colors.brand.ember,
    letterSpacing: 2,
    marginBottom: gameTheme.spacing[3],
  },
  ruleItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: gameTheme.spacing[3],
  },
  ruleIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: gameTheme.colors.brand.ember,
    marginRight: gameTheme.spacing[3],
  },
  ruleInfo: {
    flex: 1,
  },
  ruleName: {
    fontFamily: gameTheme.typography.fontFamily.body,
    fontSize: gameTheme.typography.fontSize.base,
    fontWeight: gameTheme.typography.fontWeight.bold,
    color: gameTheme.colors.neutral.warmWhite,
    marginBottom: 2,
  },
  ruleDescription: {
    fontFamily: gameTheme.typography.fontFamily.body,
    fontSize: gameTheme.typography.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.6)',
    lineHeight: 20,
  },
});

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const StadiumSelect: React.FC<StadiumSelectProps> = ({
  stadiums,
  selectedStadium,
  onStadiumSelect,
  onConfirm,
  onBack,
}) => {
  const canConfirm = selectedStadium !== null;

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
        <Text style={styles.title}>PICK YOUR FIELD</Text>
        <TouchableOpacity
          style={[styles.confirmButton, !canConfirm && styles.confirmButtonDisabled]}
          onPress={onConfirm}
          disabled={!canConfirm}
          accessibilityRole="button"
          accessibilityLabel="Confirm stadium selection"
          accessibilityState={{ disabled: !canConfirm }}
        >
          <Text style={styles.confirmButtonText}>PLAY BALL!</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Stadium List */}
        <ScrollView
          style={styles.listContainer}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          {stadiums.map((stadium) => (
            <StadiumCard
              key={stadium.id}
              stadium={stadium}
              isSelected={selectedStadium?.id === stadium.id}
              onPress={() => onStadiumSelect(stadium)}
            />
          ))}
        </ScrollView>

        {/* Preview Panel (landscape only) */}
        {IS_LANDSCAPE && selectedStadium && (
          <View style={styles.previewContainer}>
            <PreviewPanel stadium={selectedStadium} />
          </View>
        )}
      </View>
    </View>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: gameTheme.colors.neutral.midnight,
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
    flexDirection: IS_LANDSCAPE ? 'row' : 'column',
  },
  listContainer: {
    flex: IS_LANDSCAPE ? 0.5 : 1,
  },
  listContent: {
    padding: gameTheme.spacing[4],
    alignItems: IS_LANDSCAPE ? 'flex-start' : 'center',
  },
  previewContainer: {
    flex: 0.5,
    padding: gameTheme.spacing[4],
  },
});

export default StadiumSelect;
