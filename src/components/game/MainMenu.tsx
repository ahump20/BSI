/**
 * MainMenu Component
 * Primary navigation hub for the backyard baseball game
 *
 * Features:
 * - Prominent animated Play button
 * - Settings, Leaderboard, Shop navigation
 * - Character showcase with rotation
 * - Currency display (coins/gems)
 * - Player profile summary
 *
 * Design: BSI extended with playful, kid-friendly aesthetics
 * Layout: Landscape primary, responsive to portrait
 *
 * @version 1.0.0
 * @lastUpdated 2025-11-26
 */

import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Animated,
  StyleSheet,
  Dimensions,
  AccessibilityInfo,
} from 'react-native';
import type { MainMenuProps } from './types';
import { gameTheme } from './tokens';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const IS_LANDSCAPE = SCREEN_WIDTH > SCREEN_HEIGHT;

// ============================================================================
// SUBCOMPONENTS
// ============================================================================

interface CurrencyDisplayProps {
  coins: number;
  gems?: number;
}

const CurrencyDisplay: React.FC<CurrencyDisplayProps> = ({ coins, gems }) => (
  <View style={styles.currencyContainer} accessibilityRole="text">
    <View style={styles.currencyItem}>
      <View style={[styles.currencyIcon, styles.coinIcon]} />
      <Text style={styles.currencyText} accessibilityLabel={`${coins} coins`}>
        {coins.toLocaleString()}
      </Text>
    </View>
    {gems !== undefined && gems > 0 && (
      <View style={styles.currencyItem}>
        <View style={[styles.currencyIcon, styles.gemIcon]} />
        <Text style={styles.currencyText} accessibilityLabel={`${gems} gems`}>
          {gems.toLocaleString()}
        </Text>
      </View>
    )}
  </View>
);

interface NavButtonProps {
  label: string;
  icon: 'settings' | 'leaderboard' | 'shop';
  onPress: () => void;
}

const NavButton: React.FC<NavButtonProps> = ({ label, icon, onPress }) => (
  <TouchableOpacity
    style={styles.navButton}
    onPress={onPress}
    accessibilityRole="button"
    accessibilityLabel={label}
    activeOpacity={0.8}
  >
    <View style={[styles.navIcon, styles[`${icon}Icon`]]} />
    <Text style={styles.navLabel}>{label}</Text>
  </TouchableOpacity>
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const MainMenu: React.FC<MainMenuProps> = ({
  currency,
  playerName,
  playerLevel,
  featuredCharacter,
  onPlayPress,
  onSettingsPress,
  onLeaderboardPress,
  onShopPress,
  onCharacterPress,
}) => {
  // Play button animation
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const characterBobAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Pulse animation for Play button
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );

    // Glow animation
    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    );

    // Character bob animation
    const bobLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(characterBobAnim, {
          toValue: -8,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(characterBobAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );

    // Check for reduced motion preference
    AccessibilityInfo.isReduceMotionEnabled().then((reduceMotion) => {
      if (!reduceMotion) {
        pulseLoop.start();
        glowLoop.start();
        bobLoop.start();
      }
    });

    return () => {
      pulseLoop.stop();
      glowLoop.stop();
      bobLoop.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- animation refs are stable, mount-only effect
  }, []);

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 0.8],
  });

  return (
    <View style={styles.container}>
      {/* Background gradient (simulated with layers) */}
      <View style={styles.backgroundGradient}>
        <View style={styles.skyLayer} />
        <View style={styles.fieldLayer} />
      </View>

      {/* Header: Currency + Player Info */}
      <View style={styles.header}>
        <CurrencyDisplay coins={currency.coins} gems={currency.gems} />
        <View style={styles.playerInfo}>
          <Text style={styles.playerName}>{playerName}</Text>
          <View style={styles.levelBadge}>
            <Text style={styles.levelText}>Lv. {playerLevel}</Text>
          </View>
        </View>
      </View>

      {/* Main Content Area */}
      <View style={styles.mainContent}>
        {/* Character Showcase */}
        <TouchableOpacity
          style={styles.characterShowcase}
          onPress={onCharacterPress}
          accessibilityRole="button"
          accessibilityLabel="View and select characters"
        >
          {featuredCharacter ? (
            <Animated.View
              style={[styles.characterContainer, { transform: [{ translateY: characterBobAnim }] }]}
            >
              <Image
                source={{ uri: featuredCharacter.avatarUri }}
                style={styles.characterImage}
                accessibilityLabel={featuredCharacter.name}
              />
              <View style={styles.characterNameplate}>
                <Text style={styles.characterName}>
                  {featuredCharacter.nickname || featuredCharacter.name}
                </Text>
              </View>
            </Animated.View>
          ) : (
            <View style={styles.characterPlaceholder}>
              <Text style={styles.characterPlaceholderText}>Select Your Star</Text>
            </View>
          )}
          <View style={styles.tapHint}>
            <Text style={styles.tapHintText}>Tap to change</Text>
          </View>
        </TouchableOpacity>

        {/* Play Button (Hero CTA) */}
        <View style={styles.playButtonContainer}>
          <Animated.View style={[styles.playButtonGlow, { opacity: glowOpacity }]} />
          <Animated.View style={[styles.playButtonWrapper, { transform: [{ scale: pulseAnim }] }]}>
            <TouchableOpacity
              style={styles.playButton}
              onPress={onPlayPress}
              accessibilityRole="button"
              accessibilityLabel="Play Game"
              activeOpacity={0.9}
            >
              <Text style={styles.playButtonText}>PLAY</Text>
              <Text style={styles.playButtonSubtext}>Tap to start</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>

      {/* Navigation Bar */}
      <View style={styles.navBar}>
        <NavButton label="Settings" icon="settings" onPress={onSettingsPress} />
        <NavButton label="Leaders" icon="leaderboard" onPress={onLeaderboardPress} />
        <NavButton label="Shop" icon="shop" onPress={onShopPress} />
      </View>

      {/* Logo / Branding */}
      <View style={styles.branding}>
        <Text style={styles.brandingText}>BACKYARD</Text>
        <Text style={styles.brandingTextAccent}>BASEBALL</Text>
        <View style={styles.bsiTag}>
          <Text style={styles.bsiTagText}>Powered by BSI</Text>
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
    flex: 1,
    backgroundColor: gameTheme.colors.game.sky.noon,
  },

  // Background
  backgroundGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  skyLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '60%',
    backgroundColor: gameTheme.colors.game.sky.noon,
  },
  fieldLayer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: gameTheme.colors.game.grass.base,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: gameTheme.spacing[5],
    paddingTop: gameTheme.spacing[4],
    paddingBottom: gameTheme.spacing[2],
    zIndex: gameTheme.zIndex.ui,
  },
  currencyContainer: {
    flexDirection: 'row',
    gap: gameTheme.spacing[4],
  },
  currencyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: gameTheme.spacing[3],
    paddingVertical: gameTheme.spacing[2],
    borderRadius: gameTheme.borderRadius.full,
    ...gameTheme.shadows.md,
  },
  currencyIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: gameTheme.spacing[2],
  },
  coinIcon: {
    backgroundColor: '#FFD700',
  },
  gemIcon: {
    backgroundColor: '#9C27B0',
  },
  currencyText: {
    fontFamily: gameTheme.typography.fontFamily.stats,
    fontSize: gameTheme.typography.fontSize.lg,
    fontWeight: gameTheme.typography.fontWeight.bold,
    color: gameTheme.colors.neutral.charcoal,
  },
  playerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: gameTheme.spacing[2],
  },
  playerName: {
    fontFamily: gameTheme.typography.fontFamily.display,
    fontSize: gameTheme.typography.fontSize.xl,
    fontWeight: gameTheme.typography.fontWeight.bold,
    color: gameTheme.colors.neutral.warmWhite,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  levelBadge: {
    backgroundColor: gameTheme.colors.brand.burntOrange,
    paddingHorizontal: gameTheme.spacing[3],
    paddingVertical: gameTheme.spacing[1],
    borderRadius: gameTheme.borderRadius.full,
  },
  levelText: {
    fontFamily: gameTheme.typography.fontFamily.stats,
    fontSize: gameTheme.typography.fontSize.sm,
    fontWeight: gameTheme.typography.fontWeight.bold,
    color: gameTheme.colors.neutral.warmWhite,
  },

  // Main Content
  mainContent: {
    flex: 1,
    flexDirection: IS_LANDSCAPE ? 'row' : 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: gameTheme.spacing[6],
    gap: gameTheme.spacing[8],
    zIndex: gameTheme.zIndex.ui,
  },

  // Character Showcase
  characterShowcase: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  characterContainer: {
    alignItems: 'center',
  },
  characterImage: {
    width: IS_LANDSCAPE ? 180 : 160,
    height: IS_LANDSCAPE ? 240 : 220,
    resizeMode: 'contain',
  },
  characterNameplate: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: gameTheme.spacing[4],
    paddingVertical: gameTheme.spacing[2],
    borderRadius: gameTheme.borderRadius.md,
    marginTop: -gameTheme.spacing[3],
  },
  characterName: {
    fontFamily: gameTheme.typography.fontFamily.display,
    fontSize: gameTheme.typography.fontSize['2xl'],
    fontWeight: gameTheme.typography.fontWeight.bold,
    color: gameTheme.colors.neutral.warmWhite,
  },
  characterPlaceholder: {
    width: IS_LANDSCAPE ? 180 : 160,
    height: IS_LANDSCAPE ? 240 : 220,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: gameTheme.borderRadius['2xl'],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    borderStyle: 'dashed',
  },
  characterPlaceholderText: {
    fontFamily: gameTheme.typography.fontFamily.body,
    fontSize: gameTheme.typography.fontSize.lg,
    color: gameTheme.colors.neutral.warmWhite,
    textAlign: 'center',
  },
  tapHint: {
    marginTop: gameTheme.spacing[2],
  },
  tapHintText: {
    fontFamily: gameTheme.typography.fontFamily.body,
    fontSize: gameTheme.typography.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.7)',
  },

  // Play Button
  playButtonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButtonGlow: {
    position: 'absolute',
    width: gameTheme.touchTargets.extraLarge * 2.5,
    height: gameTheme.touchTargets.extraLarge * 2.5,
    borderRadius: gameTheme.touchTargets.extraLarge * 1.25,
    backgroundColor: gameTheme.colors.brand.ember,
  },
  playButtonWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButton: {
    width: gameTheme.touchTargets.extraLarge * 2,
    height: gameTheme.touchTargets.extraLarge * 2,
    borderRadius: gameTheme.touchTargets.extraLarge,
    backgroundColor: gameTheme.colors.brand.ember,
    alignItems: 'center',
    justifyContent: 'center',
    ...gameTheme.shadows.xl,
    borderWidth: 4,
    borderColor: gameTheme.colors.neutral.warmWhite,
  },
  playButtonText: {
    fontFamily: gameTheme.typography.fontFamily.display,
    fontSize: gameTheme.typography.fontSize['5xl'],
    fontWeight: gameTheme.typography.fontWeight.black,
    color: gameTheme.colors.neutral.warmWhite,
    letterSpacing: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  playButtonSubtext: {
    fontFamily: gameTheme.typography.fontFamily.body,
    fontSize: gameTheme.typography.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: -gameTheme.spacing[1],
  },

  // Navigation Bar
  navBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: gameTheme.spacing[6],
    paddingVertical: gameTheme.spacing[4],
    paddingHorizontal: gameTheme.spacing[6],
    zIndex: gameTheme.zIndex.ui,
  },
  navButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: gameTheme.touchTargets.large,
    minHeight: gameTheme.touchTargets.large,
  },
  navIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    marginBottom: gameTheme.spacing[1],
    ...gameTheme.shadows.md,
  },
  settingsIcon: {
    // Icon would be rendered inside
  },
  leaderboardIcon: {
    // Icon would be rendered inside
  },
  shopIcon: {
    // Icon would be rendered inside
  },
  navLabel: {
    fontFamily: gameTheme.typography.fontFamily.body,
    fontSize: gameTheme.typography.fontSize.xs,
    fontWeight: gameTheme.typography.fontWeight.semibold,
    color: gameTheme.colors.neutral.warmWhite,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },

  // Branding
  branding: {
    position: 'absolute',
    top: gameTheme.spacing[4],
    left: '50%',
    transform: [{ translateX: -75 }],
    alignItems: 'center',
    zIndex: gameTheme.zIndex.ui,
  },
  brandingText: {
    fontFamily: gameTheme.typography.fontFamily.display,
    fontSize: gameTheme.typography.fontSize['2xl'],
    fontWeight: gameTheme.typography.fontWeight.black,
    color: gameTheme.colors.neutral.warmWhite,
    letterSpacing: 3,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  brandingTextAccent: {
    fontFamily: gameTheme.typography.fontFamily.display,
    fontSize: gameTheme.typography.fontSize['3xl'],
    fontWeight: gameTheme.typography.fontWeight.black,
    color: gameTheme.colors.brand.ember,
    letterSpacing: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
    marginTop: -gameTheme.spacing[2],
  },
  bsiTag: {
    marginTop: gameTheme.spacing[1],
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: gameTheme.spacing[2],
    paddingVertical: gameTheme.spacing[0.5],
    borderRadius: gameTheme.borderRadius.sm,
  },
  bsiTagText: {
    fontFamily: gameTheme.typography.fontFamily.body,
    fontSize: gameTheme.typography.fontSize.tiny,
    color: 'rgba(255, 255, 255, 0.7)',
  },
});

export default MainMenu;
