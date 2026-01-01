/**
 * ResultsScreen Component
 * Post-game celebration and stats display
 *
 * Features:
 * - Win/Loss/Tie celebration animation
 * - Final score display
 * - Stats breakdown (hits, runs, strikeouts, etc.)
 * - XP and coins earned with animation
 * - New unlocks showcase
 * - Share button for social
 * - Continue/Rematch actions
 *
 * @version 1.0.0
 * @lastUpdated 2025-11-26
 */

import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Animated,
  StyleSheet,
  Dimensions,
  Share,
  AccessibilityInfo,
} from 'react-native';
import type { ResultsScreenProps, GameResult } from './types';
import { gameTheme } from './tokens';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ============================================================================
// CELEBRATION HEADER COMPONENT
// ============================================================================

interface CelebrationHeaderProps {
  outcome: 'win' | 'loss' | 'tie';
  homeScore: number;
  awayScore: number;
}

const CelebrationHeader: React.FC<CelebrationHeaderProps> = ({ outcome, homeScore, awayScore }) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const _rotateAnim = useRef(new Animated.Value(0)).current;
  const confettiAnims = useRef(
    Array(12)
      .fill(0)
      .map(() => ({
        x: new Animated.Value(Math.random() * SCREEN_WIDTH),
        y: new Animated.Value(-50),
        rotate: new Animated.Value(0),
      }))
  ).current;

  useEffect(() => {
    // Title animation
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 1.2,
        tension: 100,
        friction: 5,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 200,
        friction: 10,
        useNativeDriver: true,
      }),
    ]).start();

    // Confetti for wins
    if (outcome === 'win') {
      AccessibilityInfo.isReduceMotionEnabled().then((reduceMotion) => {
        if (!reduceMotion) {
          confettiAnims.forEach((anim, index) => {
            Animated.loop(
              Animated.parallel([
                Animated.timing(anim.y, {
                  toValue: SCREEN_HEIGHT + 50,
                  duration: 3000 + Math.random() * 2000,
                  useNativeDriver: true,
                }),
                Animated.timing(anim.rotate, {
                  toValue: 360 * (Math.random() > 0.5 ? 1 : -1),
                  duration: 2000 + Math.random() * 1000,
                  useNativeDriver: true,
                }),
              ])
            ).start();
          });
        }
      });
    }
  }, [outcome]);

  const outcomeConfig = {
    win: {
      text: 'VICTORY!',
      color: gameTheme.colors.game.status.win,
      subtext: 'You crushed it!',
    },
    loss: {
      text: 'DEFEAT',
      color: gameTheme.colors.game.status.loss,
      subtext: 'Better luck next time!',
    },
    tie: {
      text: 'TIE GAME',
      color: gameTheme.colors.game.status.tie,
      subtext: 'What a battle!',
    },
  }[outcome];

  return (
    <View style={celebrationStyles.container}>
      {/* Confetti (wins only) */}
      {outcome === 'win' &&
        confettiAnims.map((anim, index) => (
          <Animated.View
            key={`confetti-${index}`}
            style={[
              celebrationStyles.confetti,
              {
                backgroundColor: [
                  gameTheme.colors.brand.ember,
                  gameTheme.colors.game.status.win,
                  '#FFD700',
                  gameTheme.colors.brand.titanBlue,
                ][index % 4],
                transform: [
                  { translateX: anim.x },
                  { translateY: anim.y },
                  {
                    rotate: anim.rotate.interpolate({
                      inputRange: [0, 360],
                      outputRange: ['0deg', '360deg'],
                    }),
                  },
                ],
              },
            ]}
          />
        ))}

      {/* Outcome Text */}
      <Animated.Text
        style={[
          celebrationStyles.outcomeText,
          { color: outcomeConfig.color, transform: [{ scale: scaleAnim }] },
        ]}
        accessibilityRole="header"
      >
        {outcomeConfig.text}
      </Animated.Text>
      <Text style={celebrationStyles.subtext}>{outcomeConfig.subtext}</Text>

      {/* Final Score */}
      <View style={celebrationStyles.scoreContainer}>
        <View style={celebrationStyles.scoreTeam}>
          <Text style={celebrationStyles.scoreLabel}>YOU</Text>
          <Text style={celebrationStyles.scoreValue}>{homeScore}</Text>
        </View>
        <Text style={celebrationStyles.scoreDivider}>-</Text>
        <View style={celebrationStyles.scoreTeam}>
          <Text style={celebrationStyles.scoreLabel}>OPP</Text>
          <Text style={celebrationStyles.scoreValue}>{awayScore}</Text>
        </View>
      </View>
    </View>
  );
};

const celebrationStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: gameTheme.spacing[8],
    position: 'relative',
    overflow: 'hidden',
  },
  confetti: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 2,
  },
  outcomeText: {
    fontFamily: gameTheme.typography.fontFamily.display,
    fontSize: gameTheme.typography.fontSize['7xl'],
    fontWeight: gameTheme.typography.fontWeight.black,
    letterSpacing: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 3, height: 3 },
    textShadowRadius: 6,
  },
  subtext: {
    fontFamily: gameTheme.typography.fontFamily.body,
    fontSize: gameTheme.typography.fontSize.xl,
    color: gameTheme.colors.neutral.warmWhite,
    marginTop: gameTheme.spacing[1],
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: gameTheme.spacing[6],
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: gameTheme.spacing[8],
    paddingVertical: gameTheme.spacing[4],
    borderRadius: gameTheme.borderRadius['3xl'],
  },
  scoreTeam: {
    alignItems: 'center',
    minWidth: 80,
  },
  scoreLabel: {
    fontFamily: gameTheme.typography.fontFamily.mono,
    fontSize: gameTheme.typography.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.6)',
    letterSpacing: 1,
  },
  scoreValue: {
    fontFamily: gameTheme.typography.fontFamily.stats,
    fontSize: gameTheme.typography.fontSize['6xl'],
    fontWeight: gameTheme.typography.fontWeight.black,
    color: gameTheme.colors.neutral.warmWhite,
  },
  scoreDivider: {
    fontFamily: gameTheme.typography.fontFamily.stats,
    fontSize: gameTheme.typography.fontSize['4xl'],
    color: 'rgba(255, 255, 255, 0.4)',
    marginHorizontal: gameTheme.spacing[4],
  },
});

// ============================================================================
// STATS BREAKDOWN COMPONENT
// ============================================================================

interface StatRowProps {
  label: string;
  value: number | string;
  highlight?: boolean;
  delay?: number;
}

const StatRow: React.FC<StatRowProps> = ({ label, value, highlight = false, delay = 0 }) => {
  const slideAnim = useRef(new Animated.Value(-50)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 80,
          friction: 12,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [delay]);

  return (
    <Animated.View
      style={[
        statStyles.row,
        highlight && statStyles.rowHighlight,
        { transform: [{ translateX: slideAnim }], opacity: opacityAnim },
      ]}
    >
      <Text style={statStyles.label}>{label}</Text>
      <Text style={[statStyles.value, highlight && statStyles.valueHighlight]}>{value}</Text>
    </Animated.View>
  );
};

interface StatsBreakdownProps {
  stats: GameResult['playerStats'];
}

const StatsBreakdown: React.FC<StatsBreakdownProps> = ({ stats }) => (
  <View style={statStyles.container}>
    <Text style={statStyles.title}>GAME STATS</Text>
    <View style={statStyles.grid}>
      <View style={statStyles.column}>
        <StatRow label="Hits" value={stats.hits} delay={100} />
        <StatRow label="Runs" value={stats.runs} highlight delay={150} />
        <StatRow label="RBIs" value={stats.rbis} delay={200} />
        <StatRow
          label="Home Runs"
          value={stats.homeRuns}
          highlight={stats.homeRuns > 0}
          delay={250}
        />
      </View>
      <View style={statStyles.column}>
        <StatRow label="Strikeouts" value={stats.strikeouts} delay={300} />
        <StatRow label="Walks" value={stats.walks} delay={350} />
        <StatRow label="Stolen Bases" value={stats.stolenBases} delay={400} />
        <StatRow label="Errors" value={stats.errors} delay={450} />
      </View>
    </View>
    {stats.pitchingStats && (
      <View style={statStyles.pitchingSection}>
        <Text style={statStyles.pitchingTitle}>PITCHING</Text>
        <View style={statStyles.pitchingGrid}>
          <StatRow label="K" value={stats.pitchingStats.strikeouts} delay={500} />
          <StatRow label="BB" value={stats.pitchingStats.walks} delay={550} />
          <StatRow label="ER" value={stats.pitchingStats.earnedRuns} delay={600} />
          <StatRow label="IP" value={stats.pitchingStats.innings} delay={650} />
        </View>
      </View>
    )}
  </View>
);

const statStyles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: gameTheme.borderRadius['2xl'],
    padding: gameTheme.spacing[5],
    marginHorizontal: gameTheme.spacing[4],
  },
  title: {
    fontFamily: gameTheme.typography.fontFamily.stats,
    fontSize: gameTheme.typography.fontSize.lg,
    fontWeight: gameTheme.typography.fontWeight.bold,
    color: gameTheme.colors.brand.ember,
    letterSpacing: 2,
    marginBottom: gameTheme.spacing[4],
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    gap: gameTheme.spacing[4],
  },
  column: {
    flex: 1,
    gap: gameTheme.spacing[2],
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: gameTheme.spacing[2],
    paddingHorizontal: gameTheme.spacing[3],
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: gameTheme.borderRadius.md,
  },
  rowHighlight: {
    backgroundColor: 'rgba(191, 87, 0, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(191, 87, 0, 0.4)',
  },
  label: {
    fontFamily: gameTheme.typography.fontFamily.body,
    fontSize: gameTheme.typography.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  value: {
    fontFamily: gameTheme.typography.fontFamily.stats,
    fontSize: gameTheme.typography.fontSize.lg,
    fontWeight: gameTheme.typography.fontWeight.bold,
    color: gameTheme.colors.neutral.warmWhite,
  },
  valueHighlight: {
    color: gameTheme.colors.brand.ember,
  },
  pitchingSection: {
    marginTop: gameTheme.spacing[4],
    paddingTop: gameTheme.spacing[4],
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  pitchingTitle: {
    fontFamily: gameTheme.typography.fontFamily.mono,
    fontSize: gameTheme.typography.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.5)',
    letterSpacing: 1,
    marginBottom: gameTheme.spacing[2],
  },
  pitchingGrid: {
    flexDirection: 'row',
    gap: gameTheme.spacing[2],
  },
});

// ============================================================================
// REWARDS COMPONENT
// ============================================================================

interface RewardsProps {
  xpEarned: number;
  coinsEarned: number;
}

const Rewards: React.FC<RewardsProps> = ({ xpEarned, coinsEarned }) => {
  const [displayXP, setDisplayXP] = useState(0);
  const [displayCoins, setDisplayCoins] = useState(0);
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entrance animation
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 80,
      friction: 8,
      delay: 700,
      useNativeDriver: true,
    }).start();

    // Count-up animation for XP
    const xpInterval = setInterval(() => {
      setDisplayXP((prev) => {
        if (prev >= xpEarned) {
          clearInterval(xpInterval);
          return xpEarned;
        }
        return Math.min(prev + Math.ceil(xpEarned / 30), xpEarned);
      });
    }, 50);

    // Count-up animation for Coins
    const coinsInterval = setInterval(() => {
      setDisplayCoins((prev) => {
        if (prev >= coinsEarned) {
          clearInterval(coinsInterval);
          return coinsEarned;
        }
        return Math.min(prev + Math.ceil(coinsEarned / 30), coinsEarned);
      });
    }, 50);

    return () => {
      clearInterval(xpInterval);
      clearInterval(coinsInterval);
    };
  }, [xpEarned, coinsEarned]);

  return (
    <Animated.View style={[rewardStyles.container, { transform: [{ scale: scaleAnim }] }]}>
      <Text style={rewardStyles.title}>REWARDS</Text>
      <View style={rewardStyles.rewardsRow}>
        <View style={rewardStyles.rewardItem}>
          <View style={[rewardStyles.icon, rewardStyles.xpIcon]} />
          <Text style={rewardStyles.rewardValue}>+{displayXP}</Text>
          <Text style={rewardStyles.rewardLabel}>XP</Text>
        </View>
        <View style={rewardStyles.rewardItem}>
          <View style={[rewardStyles.icon, rewardStyles.coinIcon]} />
          <Text style={rewardStyles.rewardValue}>+{displayCoins}</Text>
          <Text style={rewardStyles.rewardLabel}>COINS</Text>
        </View>
      </View>
    </Animated.View>
  );
};

const rewardStyles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: gameTheme.borderRadius['2xl'],
    padding: gameTheme.spacing[5],
    marginHorizontal: gameTheme.spacing[4],
    marginTop: gameTheme.spacing[4],
    borderWidth: 2,
    borderColor: 'rgba(191, 87, 0, 0.4)',
  },
  title: {
    fontFamily: gameTheme.typography.fontFamily.stats,
    fontSize: gameTheme.typography.fontSize.lg,
    fontWeight: gameTheme.typography.fontWeight.bold,
    color: gameTheme.colors.brand.ember,
    letterSpacing: 2,
    marginBottom: gameTheme.spacing[4],
    textAlign: 'center',
  },
  rewardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  rewardItem: {
    alignItems: 'center',
  },
  icon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginBottom: gameTheme.spacing[2],
  },
  xpIcon: {
    backgroundColor: '#7B1FA2',
  },
  coinIcon: {
    backgroundColor: '#FFD700',
  },
  rewardValue: {
    fontFamily: gameTheme.typography.fontFamily.stats,
    fontSize: gameTheme.typography.fontSize['3xl'],
    fontWeight: gameTheme.typography.fontWeight.black,
    color: gameTheme.colors.neutral.warmWhite,
  },
  rewardLabel: {
    fontFamily: gameTheme.typography.fontFamily.mono,
    fontSize: gameTheme.typography.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.6)',
    letterSpacing: 1,
  },
});

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const ResultsScreen: React.FC<ResultsScreenProps> = ({
  result,
  onContinue,
  onRematch,
  onShare,
}) => {
  const handleShare = async () => {
    try {
      const message = `I just ${
        result.outcome === 'win' ? 'won' : result.outcome === 'tie' ? 'tied' : 'played'
      } a game of Backyard Baseball!\n\nScore: ${result.finalScore.home} - ${result.finalScore.away}\nHits: ${result.playerStats.hits}\nRuns: ${result.playerStats.runs}\n\nPlay now on Blaze Sports Intel!`;

      await Share.share({
        message,
        title: 'Backyard Baseball Results',
      });
    } catch (error) {
      console.error('Share failed:', error);
    }
    onShare();
  };

  const backgroundStyle = {
    win: { backgroundColor: '#1B4332' }, // Deep green
    loss: { backgroundColor: '#3C1518' }, // Deep red
    tie: { backgroundColor: '#4A3F35' }, // Deep brown/amber
  }[result.outcome];

  return (
    <View style={[styles.container, backgroundStyle]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <CelebrationHeader
          outcome={result.outcome}
          homeScore={result.finalScore.home}
          awayScore={result.finalScore.away}
        />

        <StatsBreakdown stats={result.playerStats} />

        <Rewards xpEarned={result.xpEarned} coinsEarned={result.coinsEarned} />

        {/* New Unlocks */}
        {result.newUnlocks && result.newUnlocks.length > 0 && (
          <View style={styles.unlocksContainer}>
            <Text style={styles.unlocksTitle}>NEW UNLOCKS!</Text>
            <View style={styles.unlocksList}>
              {result.newUnlocks.map((unlock, index) => (
                <View key={index} style={styles.unlockItem}>
                  <View style={styles.unlockIcon} />
                  <Text style={styles.unlockText}>{unlock}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.continueButton}
            onPress={onContinue}
            accessibilityRole="button"
            accessibilityLabel="Continue to main menu"
          >
            <Text style={styles.continueButtonText}>CONTINUE</Text>
          </TouchableOpacity>

          <View style={styles.secondaryActions}>
            <TouchableOpacity
              style={styles.rematchButton}
              onPress={onRematch}
              accessibilityRole="button"
              accessibilityLabel="Play rematch"
            >
              <Text style={styles.rematchButtonText}>REMATCH</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.shareButton}
              onPress={handleShare}
              accessibilityRole="button"
              accessibilityLabel="Share results"
            >
              <Text style={styles.shareButtonText}>SHARE</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: gameTheme.spacing[10],
  },

  // Unlocks
  unlocksContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: gameTheme.borderRadius['2xl'],
    padding: gameTheme.spacing[5],
    marginHorizontal: gameTheme.spacing[4],
    marginTop: gameTheme.spacing[4],
    borderWidth: 2,
    borderColor: 'rgba(255, 215, 0, 0.4)',
  },
  unlocksTitle: {
    fontFamily: gameTheme.typography.fontFamily.stats,
    fontSize: gameTheme.typography.fontSize.lg,
    fontWeight: gameTheme.typography.fontWeight.bold,
    color: '#FFD700',
    letterSpacing: 2,
    marginBottom: gameTheme.spacing[4],
    textAlign: 'center',
  },
  unlocksList: {
    gap: gameTheme.spacing[2],
  },
  unlockItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    padding: gameTheme.spacing[3],
    borderRadius: gameTheme.borderRadius.lg,
  },
  unlockIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFD700',
    marginRight: gameTheme.spacing[3],
  },
  unlockText: {
    fontFamily: gameTheme.typography.fontFamily.body,
    fontSize: gameTheme.typography.fontSize.base,
    fontWeight: gameTheme.typography.fontWeight.semibold,
    color: gameTheme.colors.neutral.warmWhite,
  },

  // Actions
  actionsContainer: {
    marginTop: gameTheme.spacing[8],
    paddingHorizontal: gameTheme.spacing[4],
    alignItems: 'center',
  },
  continueButton: {
    width: '100%',
    maxWidth: 320,
    paddingVertical: gameTheme.spacing[4],
    backgroundColor: gameTheme.colors.brand.ember,
    borderRadius: gameTheme.borderRadius.xl,
    alignItems: 'center',
    ...gameTheme.shadows.lg,
    minHeight: gameTheme.touchTargets.large,
  },
  continueButtonText: {
    fontFamily: gameTheme.typography.fontFamily.display,
    fontSize: gameTheme.typography.fontSize['2xl'],
    fontWeight: gameTheme.typography.fontWeight.black,
    color: gameTheme.colors.neutral.warmWhite,
    letterSpacing: 2,
  },
  secondaryActions: {
    flexDirection: 'row',
    marginTop: gameTheme.spacing[4],
    gap: gameTheme.spacing[4],
  },
  rematchButton: {
    flex: 1,
    maxWidth: 150,
    paddingVertical: gameTheme.spacing[3],
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: gameTheme.borderRadius.lg,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    minHeight: gameTheme.touchTargets.standard,
  },
  rematchButtonText: {
    fontFamily: gameTheme.typography.fontFamily.stats,
    fontSize: gameTheme.typography.fontSize.base,
    fontWeight: gameTheme.typography.fontWeight.bold,
    color: gameTheme.colors.neutral.warmWhite,
    letterSpacing: 1,
  },
  shareButton: {
    flex: 1,
    maxWidth: 150,
    paddingVertical: gameTheme.spacing[3],
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: gameTheme.borderRadius.lg,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    minHeight: gameTheme.touchTargets.standard,
  },
  shareButtonText: {
    fontFamily: gameTheme.typography.fontFamily.stats,
    fontSize: gameTheme.typography.fontSize.base,
    fontWeight: gameTheme.typography.fontWeight.bold,
    color: gameTheme.colors.neutral.warmWhite,
    letterSpacing: 1,
  },
});

export default ResultsScreen;
