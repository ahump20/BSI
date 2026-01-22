'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { colors } from '@/src/styles/tokens/colors';

// ============================================================================
// BLAZE ARCADE - COMPLETE GAME HUB
// Miniclip-style Easter egg collection for Blaze Sports Intel
// ============================================================================

// Design token integration with game-specific additions
const COLORS = {
  burntOrange: colors.brand.burntOrange,
  texasSoil: colors.brand.texasSoil,
  charcoal: colors.background.charcoal,
  midnight: colors.background.midnight,
  ember: colors.brand.ember,
  mustard: '#FFD700',
  ketchup: '#C41E3A',
  grass: '#228B22',
  sky: '#87CEEB',
  dirt: '#8B7355',
};

// ============================================================================
// DAILY CHALLENGE SYSTEM
// ============================================================================

// Seeded random number generator for consistent daily challenges
class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  // Mulberry32 algorithm - fast, good distribution
  next(): number {
    let t = (this.seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  // Get random int in range [min, max]
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  // Get random float in range [min, max]
  nextFloat(min: number, max: number): number {
    return this.next() * (max - min) + min;
  }
}

// Get today's seed (same for all players worldwide)
const getDailySeed = (): number => {
  const now = new Date();
  const dateString = `${now.getUTCFullYear()}-${now.getUTCMonth()}-${now.getUTCDate()}`;
  let hash = 0;
  for (let i = 0; i < dateString.length; i++) {
    const char = dateString.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
};

// Get today's date string for display
const getDailyDateString = (): string => {
  return new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

// Daily challenge storage key
const DAILY_CHALLENGE_KEY = 'blaze_arcade_daily_challenge';

interface DailyChallengeData {
  date: string; // YYYY-MM-DD format
  scores: Record<string, number>; // game id -> best score
  completed: string[]; // game ids completed today
}

const getTodayKey = (): string => {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}`;
};

const getDailyChallengeData = (): DailyChallengeData => {
  if (typeof window === 'undefined') return { date: getTodayKey(), scores: {}, completed: [] };
  const stored = localStorage.getItem(DAILY_CHALLENGE_KEY);
  if (!stored) return { date: getTodayKey(), scores: {}, completed: [] };
  const data = JSON.parse(stored) as DailyChallengeData;
  // Reset if it's a new day
  if (data.date !== getTodayKey()) {
    return { date: getTodayKey(), scores: {}, completed: [] };
  }
  return data;
};

const saveDailyChallengeScore = (gameId: string, score: number): boolean => {
  const data = getDailyChallengeData();
  const isNewBest = !data.scores[gameId] || score > data.scores[gameId];
  if (isNewBest) {
    data.scores[gameId] = score;
  }
  if (!data.completed.includes(gameId)) {
    data.completed.push(gameId);
  }
  localStorage.setItem(DAILY_CHALLENGE_KEY, JSON.stringify(data));
  return isNewBest;
};

// ============================================================================
// TYPESCRIPT INTERFACES
// ============================================================================

// Sound function types from useGameAudio hook
interface GameSounds {
  // Hot Dog Dash
  catch: () => void;
  goldenCatch: () => void;
  powerup: () => void;
  comboMilestone: () => void;
  hotdogMiss: () => void;
  // Sandlot Slugger
  pitchWhoosh: () => void;
  batCrack: () => void;
  batWhiff: () => void;
  homeRun: () => void;
  strikeout: () => void;
  baseHit: () => void;
  // Gridiron Blitz
  snap: () => void;
  touchdown: () => void;
  fieldGoal: () => void;
  fieldGoalMiss: () => void;
  turnover: () => void;
  clockWarning: () => void;
  bigPlay: () => void;
  // Shared
  gameStart: () => void;
  gameOver: () => void;
  menuSelect: () => void;
  menuBack: () => void;
  pause: () => void;
  resume: () => void;
}

interface GameProps {
  onBack: () => void;
  highScore: number;
  onUpdateHighScore: (score: number) => void;
  sounds: GameSounds;
  onGameComplete?: (stats: HotDogStats | SluggerStats | FootballStats) => void;
  // Daily challenge mode
  isDailyChallenge?: boolean;
  dailyRng?: SeededRandom;
  onDailyChallengeComplete?: (gameId: string, score: number) => void;
}

interface Game {
  id: string;
  title: string;
  description: string;
  icon: string;
  component: React.FC<GameProps> | null;
}

interface HotDogItem {
  id: number;
  x: number;
  y: number;
  speed: number;
  isGolden: boolean;
  isPowerUp: boolean;
  powerUpType: string | null;
}

interface PowerUp {
  emoji: string;
  color: string;
  duration: number;
}

interface ChonkLevel {
  threshold: number;
  label: string;
  emoji: string;
}

interface Batter {
  name: string;
  power: number;
  contact: number;
  emoji: string;
}

interface PitchType {
  name: string;
  speed: number;
  movement: number;
  color: string;
}

interface BallFlight {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  duration: number;
}

interface Team {
  name: string;
  emoji: string;
  color: string;
  offense: number;
  defense: number;
}

interface OffensivePlay {
  name: string;
  icon: string;
  type: string;
  distance: string;
  risk: number;
  desc: string;
}

interface DefensivePlay {
  name: string;
  icon: string;
  type: string;
  counters: string[];
  desc: string;
}

interface SpecialTeamsPlay {
  name: string;
  icon: string;
  type: string;
  desc: string;
}

interface PlayResult {
  text: string;
  color: string;
  cpuPlay?: string;
}

interface HitResult {
  type: string;
  points: number;
  color: string;
  distance?: number;
}

interface ScoreBarItem {
  label: string;
  value: string | number;
  color?: string;
}

interface ArcadeHeaderProps {
  title: string;
  onBack?: () => void;
  onClose?: () => void;
  showBack?: boolean;
}

interface GameCardProps {
  game: Game;
  highScore: number;
  onSelect: (id: string) => void;
}

interface GameOverlayProps {
  children: React.ReactNode;
  visible: boolean;
}

interface ActionButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  color?: string;
  small?: boolean;
}

// ============================================================================
// PHYSICS & PARTICLE SYSTEM
// ============================================================================

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  type: 'catch' | 'golden' | 'combo' | 'powerup' | 'hit' | 'homerun' | 'touchdown' | 'fieldgoal';
  rotation: number;
  rotationSpeed: number;
  scale: number;
  emoji: string;
}

interface FloatingText {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
  maxLife: number;
}

interface ScreenShake {
  intensity: number;
  duration: number;
  startTime: number;
}

interface BallAnimation {
  active: boolean;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  progress: number;
  type: 'pass' | 'run' | 'fg' | 'pitch' | 'hit';
  rotation: number;
}

// Game stats for post-game screen
interface HotDogStats {
  finalScore: number;
  highScore: number;
  isNewHighScore: boolean;
  totalCatches: number;
  goldenCatches: number;
  powerupsCollected: number;
  maxCombo: number;
  missedHotdogs: number;
}

interface SluggerStats {
  finalScore: number;
  highScore: number;
  isNewHighScore: boolean;
  totalSwings: number;
  hits: number;
  homeRuns: number;
  maxCombo: number;
  strikeouts: number;
}

interface FootballStats {
  finalScore: number;
  opponentScore: number;
  highScore: number;
  isNewHighScore: boolean;
  touchdowns: number;
  fieldGoals: number;
  turnoversForced: number;
  turnoversLost: number;
  bigPlays: number;
}

// ============================================================================
// PROGRESSION SYSTEM
// ============================================================================

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  game: 'hotdog' | 'slugger' | 'football' | 'global';
  requirement: (stats: HotDogStats | SluggerStats | FootballStats | PlayerProgress) => boolean;
}

interface Cosmetic {
  id: string;
  name: string;
  type: 'skin' | 'trail' | 'background' | 'effect';
  game: 'hotdog' | 'slugger' | 'football';
  emoji?: string;
  color?: string;
  unlockRequirement: string; // Achievement ID or score threshold
}

interface PlayerProgress {
  gamesPlayed: Record<string, number>;
  highScores: Record<string, number>;
  totalScore: number;
  unlockedCosmetics: string[];
  achievements: string[];
  currentStreak: number;
  lastPlayDate: string;
  selectedCosmetics: Record<string, string>; // game -> cosmetic id
  teamsDefeated: string[]; // For Gridiron Blitz
  dailyChallengesCompleted: number; // Times completed all 3 daily challenges
}

const DEFAULT_PROGRESS: PlayerProgress = {
  gamesPlayed: {},
  highScores: {},
  totalScore: 0,
  unlockedCosmetics: ['default-dog', 'default-bat', 'default-team'],
  achievements: [],
  currentStreak: 0,
  lastPlayDate: '',
  selectedCosmetics: {
    hotdog: 'default-dog',
    slugger: 'default-bat',
    football: 'default-team',
  },
  teamsDefeated: [],
  dailyChallengesCompleted: 0,
};

const ACHIEVEMENTS: Achievement[] = [
  // Hot Dog Dash achievements
  {
    id: 'hotdog-rookie',
    name: 'Pup Start',
    description: 'Score 100+ in Hot Dog Dash',
    icon: '🌭',
    game: 'hotdog',
    requirement: (s) => 'finalScore' in s && 'totalCatches' in s && s.finalScore >= 100,
  },
  {
    id: 'hotdog-pro',
    name: 'Hot Dog Hero',
    description: 'Score 200+ in Hot Dog Dash',
    icon: '🏆',
    game: 'hotdog',
    requirement: (s) => 'finalScore' in s && 'totalCatches' in s && s.finalScore >= 200,
  },
  {
    id: 'hotdog-master',
    name: 'Weiner Champion',
    description: 'Score 400+ in Hot Dog Dash',
    icon: '👑',
    game: 'hotdog',
    requirement: (s) => 'finalScore' in s && 'totalCatches' in s && s.finalScore >= 400,
  },
  {
    id: 'hotdog-combo5',
    name: 'Combo Starter',
    description: 'Get a 5× combo',
    icon: '🔥',
    game: 'hotdog',
    requirement: (s) => 'maxCombo' in s && (s as HotDogStats).maxCombo >= 5,
  },
  {
    id: 'hotdog-combo10',
    name: 'Combo Master',
    description: 'Get a 10× combo',
    icon: '⚡',
    game: 'hotdog',
    requirement: (s) => 'maxCombo' in s && (s as HotDogStats).maxCombo >= 10,
  },
  {
    id: 'hotdog-combo15',
    name: 'Combo Legend',
    description: 'Get a 15× combo',
    icon: '🌟',
    game: 'hotdog',
    requirement: (s) => 'maxCombo' in s && (s as HotDogStats).maxCombo >= 15,
  },
  {
    id: 'hotdog-golden5',
    name: 'Gold Rush',
    description: 'Catch 5 golden hot dogs in one game',
    icon: '✨',
    game: 'hotdog',
    requirement: (s) => 'goldenCatches' in s && (s as HotDogStats).goldenCatches >= 5,
  },

  // Sandlot Slugger achievements
  {
    id: 'slugger-rookie',
    name: 'Rookie Slugger',
    description: 'Score 500+ in Sandlot Slugger',
    icon: '⚾',
    game: 'slugger',
    requirement: (s) => 'finalScore' in s && 'hits' in s && s.finalScore >= 500,
  },
  {
    id: 'slugger-pro',
    name: 'Power Hitter',
    description: 'Score 1000+ in Sandlot Slugger',
    icon: '💪',
    game: 'slugger',
    requirement: (s) => 'finalScore' in s && 'hits' in s && s.finalScore >= 1000,
  },
  {
    id: 'slugger-master',
    name: 'Sultan of Swat',
    description: 'Score 2000+ in Sandlot Slugger',
    icon: '👑',
    game: 'slugger',
    requirement: (s) => 'finalScore' in s && 'hits' in s && s.finalScore >= 2000,
  },
  {
    id: 'slugger-hr3',
    name: 'Three True Outcomes',
    description: 'Hit 3 home runs in one game',
    icon: '🏠',
    game: 'slugger',
    requirement: (s) => 'homeRuns' in s && (s as SluggerStats).homeRuns >= 3,
  },
  {
    id: 'slugger-hr5',
    name: 'Homer Happy',
    description: 'Hit 5 home runs in one game',
    icon: '🔥',
    game: 'slugger',
    requirement: (s) => 'homeRuns' in s && (s as SluggerStats).homeRuns >= 5,
  },
  {
    id: 'slugger-perfect',
    name: 'Perfect Contact',
    description: 'Hit 10 times without striking out',
    icon: '🎯',
    game: 'slugger',
    requirement: (s) =>
      'hits' in s &&
      'strikeouts' in s &&
      (s as SluggerStats).hits >= 10 &&
      (s as SluggerStats).strikeouts === 0,
  },

  // Gridiron Blitz achievements
  {
    id: 'football-rookie',
    name: 'Rookie QB',
    description: 'Score 14+ points in a game',
    icon: '🏈',
    game: 'football',
    requirement: (s) => 'finalScore' in s && 'touchdowns' in s && s.finalScore >= 14,
  },
  {
    id: 'football-pro',
    name: 'All-Pro',
    description: 'Score 28+ points in a game',
    icon: '🏆',
    game: 'football',
    requirement: (s) => 'finalScore' in s && 'touchdowns' in s && s.finalScore >= 28,
  },
  {
    id: 'football-master',
    name: 'MVP',
    description: 'Score 42+ points in a game',
    icon: '👑',
    game: 'football',
    requirement: (s) => 'finalScore' in s && 'touchdowns' in s && s.finalScore >= 42,
  },
  {
    id: 'football-blowout',
    name: 'Blowout',
    description: 'Win by 21+ points',
    icon: '💥',
    game: 'football',
    requirement: (s) =>
      'finalScore' in s &&
      'opponentScore' in s &&
      (s as FootballStats).finalScore - (s as FootballStats).opponentScore >= 21,
  },
  {
    id: 'football-shutout',
    name: 'Shutout',
    description: 'Win without allowing any points',
    icon: '🛡️',
    game: 'football',
    requirement: (s) =>
      'opponentScore' in s &&
      (s as FootballStats).opponentScore === 0 &&
      (s as FootballStats).finalScore > 0,
  },
  {
    id: 'football-allteams',
    name: 'League Champion',
    description: 'Defeat all 4 teams',
    icon: '🏅',
    game: 'football',
    requirement: (s) => 'teamsDefeated' in s && (s as PlayerProgress).teamsDefeated.length >= 4,
  },

  // Global achievements
  {
    id: 'global-dedicated',
    name: 'Arcade Regular',
    description: 'Play 10 total games',
    icon: '🎮',
    game: 'global',
    requirement: (s) =>
      'gamesPlayed' in s &&
      Object.values((s as PlayerProgress).gamesPlayed).reduce((a, b) => a + b, 0) >= 10,
  },
  {
    id: 'global-master',
    name: 'Arcade Master',
    description: 'Play 50 total games',
    icon: '🌟',
    game: 'global',
    requirement: (s) =>
      'gamesPlayed' in s &&
      Object.values((s as PlayerProgress).gamesPlayed).reduce((a, b) => a + b, 0) >= 50,
  },
  {
    id: 'global-streak3',
    name: 'Hot Streak',
    description: 'Play 3 days in a row',
    icon: '🔥',
    game: 'global',
    requirement: (s) => 'currentStreak' in s && (s as PlayerProgress).currentStreak >= 3,
  },
  {
    id: 'global-streak7',
    name: 'Week Warrior',
    description: 'Play 7 days in a row',
    icon: '💪',
    game: 'global',
    requirement: (s) => 'currentStreak' in s && (s as PlayerProgress).currentStreak >= 7,
  },
  {
    id: 'global-daily1',
    name: 'Daily Champion',
    description: 'Complete all 3 daily challenges',
    icon: '📅',
    game: 'global',
    requirement: (s) =>
      'dailyChallengesCompleted' in s && (s as PlayerProgress).dailyChallengesCompleted >= 1,
  },
  {
    id: 'global-daily5',
    name: 'Daily Devotee',
    description: 'Complete all daily challenges 5 times',
    icon: '🗓️',
    game: 'global',
    requirement: (s) =>
      'dailyChallengesCompleted' in s && (s as PlayerProgress).dailyChallengesCompleted >= 5,
  },
];

const COSMETICS: Cosmetic[] = [
  // Hot Dog Dash skins
  {
    id: 'default-dog',
    name: 'Blaze',
    type: 'skin',
    game: 'hotdog',
    emoji: '🐕',
    unlockRequirement: 'default',
  },
  {
    id: 'corgi-dog',
    name: 'Corgi',
    type: 'skin',
    game: 'hotdog',
    emoji: '🐶',
    unlockRequirement: 'hotdog-pro',
  },
  {
    id: 'shiba-dog',
    name: 'Shiba',
    type: 'skin',
    game: 'hotdog',
    emoji: '🦊',
    unlockRequirement: 'hotdog-master',
  },
  {
    id: 'dachshund-dog',
    name: 'Dachshund',
    type: 'skin',
    game: 'hotdog',
    emoji: '🌭',
    unlockRequirement: 'hotdog-combo15',
  },
  // Hot Dog Dash trails
  {
    id: 'golden-trail',
    name: 'Golden Trail',
    type: 'trail',
    game: 'hotdog',
    color: '#FFD700',
    unlockRequirement: 'hotdog-combo10',
  },
  {
    id: 'rainbow-trail',
    name: 'Rainbow Trail',
    type: 'trail',
    game: 'hotdog',
    color: 'rainbow',
    unlockRequirement: 'hotdog-golden5',
  },

  // Sandlot Slugger cosmetics
  {
    id: 'default-bat',
    name: 'Classic Bat',
    type: 'skin',
    game: 'slugger',
    emoji: '🏏',
    unlockRequirement: 'default',
  },
  {
    id: 'gold-bat',
    name: 'Gold Bat',
    type: 'skin',
    game: 'slugger',
    emoji: '✨',
    unlockRequirement: 'slugger-pro',
  },
  {
    id: 'night-stadium',
    name: 'Night Game',
    type: 'background',
    game: 'slugger',
    unlockRequirement: 'slugger-hr5',
  },
  {
    id: 'fireworks-hit',
    name: 'Fireworks',
    type: 'effect',
    game: 'slugger',
    unlockRequirement: 'slugger-master',
  },

  // Gridiron Blitz cosmetics
  {
    id: 'default-team',
    name: 'Blaze Hounds',
    type: 'skin',
    game: 'football',
    emoji: '🐕',
    unlockRequirement: 'default',
  },
  {
    id: 'victory-dance',
    name: 'Victory Dance',
    type: 'effect',
    game: 'football',
    unlockRequirement: 'football-blowout',
  },
  {
    id: 'allstar-team',
    name: 'All-Stars',
    type: 'skin',
    game: 'football',
    emoji: '⭐',
    unlockRequirement: 'football-allteams',
  },
];

// Progression hook for localStorage persistence
const useProgression = () => {
  const [progress, setProgress] = useState<PlayerProgress>(DEFAULT_PROGRESS);
  const [newAchievements, setNewAchievements] = useState<Achievement[]>([]);
  const [newCosmetics, setNewCosmetics] = useState<Cosmetic[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('blaze-arcade-progress');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setProgress({ ...DEFAULT_PROGRESS, ...parsed });
      } catch {
        setProgress(DEFAULT_PROGRESS);
      }
    }
    // Update streak
    const today = new Date().toISOString().split('T')[0];
    setProgress((prev) => {
      const lastPlay = prev.lastPlayDate;
      let newStreak = prev.currentStreak;

      if (lastPlay) {
        const lastDate = new Date(lastPlay);
        const todayDate = new Date(today);
        const diffDays = Math.floor(
          (todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (diffDays === 1) {
          newStreak = prev.currentStreak + 1;
        } else if (diffDays > 1) {
          newStreak = 1;
        }
      } else {
        newStreak = 1;
      }

      return { ...prev, currentStreak: newStreak, lastPlayDate: today };
    });
  }, []);

  // Save to localStorage whenever progress changes
  useEffect(() => {
    localStorage.setItem('blaze-arcade-progress', JSON.stringify(progress));
  }, [progress]);

  const recordGamePlayed = useCallback((gameId: string, score: number) => {
    setProgress((prev) => {
      const newGamesPlayed = { ...prev.gamesPlayed, [gameId]: (prev.gamesPlayed[gameId] || 0) + 1 };
      const newHighScores = { ...prev.highScores };
      if (score > (newHighScores[gameId] || 0)) {
        newHighScores[gameId] = score;
      }
      return {
        ...prev,
        gamesPlayed: newGamesPlayed,
        highScores: newHighScores,
        totalScore: prev.totalScore + score,
      };
    });
  }, []);

  const checkAchievements = useCallback((stats: HotDogStats | SluggerStats | FootballStats) => {
    const newlyUnlocked: Achievement[] = [];
    const newCosmeticsUnlocked: Cosmetic[] = [];

    setProgress((prev) => {
      const unlockedIds = [...prev.achievements];
      const unlockedCosmeticIds = [...prev.unlockedCosmetics];

      // Check game-specific achievements
      ACHIEVEMENTS.forEach((achievement) => {
        if (!unlockedIds.includes(achievement.id) && achievement.requirement(stats)) {
          unlockedIds.push(achievement.id);
          newlyUnlocked.push(achievement);

          // Check if this achievement unlocks a cosmetic
          COSMETICS.forEach((cosmetic) => {
            if (
              cosmetic.unlockRequirement === achievement.id &&
              !unlockedCosmeticIds.includes(cosmetic.id)
            ) {
              unlockedCosmeticIds.push(cosmetic.id);
              newCosmeticsUnlocked.push(cosmetic);
            }
          });
        }
      });

      // Check global achievements against progress
      ACHIEVEMENTS.filter((a) => a.game === 'global').forEach((achievement) => {
        if (!unlockedIds.includes(achievement.id) && achievement.requirement(prev)) {
          unlockedIds.push(achievement.id);
          newlyUnlocked.push(achievement);
        }
      });

      if (newlyUnlocked.length > 0) {
        setNewAchievements(newlyUnlocked);
        setNewCosmetics(newCosmeticsUnlocked);
      }

      return { ...prev, achievements: unlockedIds, unlockedCosmetics: unlockedCosmeticIds };
    });

    return { newAchievements: newlyUnlocked, newCosmetics: newCosmeticsUnlocked };
  }, []);

  const recordTeamDefeated = useCallback((teamName: string) => {
    setProgress((prev) => {
      if (prev.teamsDefeated.includes(teamName)) return prev;
      return { ...prev, teamsDefeated: [...prev.teamsDefeated, teamName] };
    });
  }, []);

  const selectCosmetic = useCallback((game: string, cosmeticId: string) => {
    setProgress((prev) => ({
      ...prev,
      selectedCosmetics: { ...prev.selectedCosmetics, [game]: cosmeticId },
    }));
  }, []);

  const clearNewAchievements = useCallback(() => {
    setNewAchievements([]);
    setNewCosmetics([]);
  }, []);

  const getUnlockedCosmetics = useCallback(
    (game: 'hotdog' | 'slugger' | 'football') => {
      return COSMETICS.filter((c) => c.game === game && progress.unlockedCosmetics.includes(c.id));
    },
    [progress.unlockedCosmetics]
  );

  const getSelectedCosmetic = useCallback(
    (game: 'hotdog' | 'slugger' | 'football') => {
      const selectedId = progress.selectedCosmetics[game];
      return (
        COSMETICS.find((c) => c.id === selectedId) ||
        COSMETICS.find((c) => c.game === game && c.unlockRequirement === 'default')
      );
    },
    [progress.selectedCosmetics]
  );

  const recordDailyComplete = useCallback(() => {
    setProgress((prev) => {
      const updated = { ...prev, dailyChallengesCompleted: prev.dailyChallengesCompleted + 1 };

      // Check daily challenge achievements
      const newlyUnlocked: Achievement[] = [];
      const unlockedIds = [...updated.achievements];

      ACHIEVEMENTS.filter((a) => a.id.startsWith('global-daily')).forEach((achievement) => {
        if (!unlockedIds.includes(achievement.id) && achievement.requirement(updated)) {
          unlockedIds.push(achievement.id);
          newlyUnlocked.push(achievement);
        }
      });

      if (newlyUnlocked.length > 0) {
        setNewAchievements(newlyUnlocked);
      }

      return { ...updated, achievements: unlockedIds };
    });
  }, []);

  return {
    progress,
    newAchievements,
    newCosmetics,
    recordGamePlayed,
    checkAchievements,
    recordTeamDefeated,
    recordDailyComplete,
    selectCosmetic,
    clearNewAchievements,
    getUnlockedCosmetics,
    getSelectedCosmetic,
  };
};

// ============================================================================
// DIFFICULTY SYSTEM
// ============================================================================

type DifficultyLevel = 'easy' | 'normal' | 'hard' | 'insane';

interface HotDogDifficulty {
  name: string;
  time: number;
  spawnRate: number;
  hitboxMult: number;
  color: string;
}

interface SluggerDifficulty {
  name: string;
  pitchSpeed: number;
  timingWindow: number;
  color: string;
}

interface FootballDifficulty {
  name: string;
  cpuSmarts: number; // 0 = random, 1 = smart
  quarterTime: number;
  color: string;
}

const HOTDOG_DIFFICULTIES: Record<DifficultyLevel, HotDogDifficulty> = {
  easy: { name: 'Pup Mode', time: 45, spawnRate: 0.7, hitboxMult: 1.3, color: '#4CAF50' },
  normal: { name: 'Normal', time: 45, spawnRate: 1.0, hitboxMult: 1.0, color: '#2196F3' },
  hard: { name: 'Hard', time: 60, spawnRate: 1.5, hitboxMult: 0.8, color: '#FF9800' },
  insane: { name: 'Insane', time: 90, spawnRate: 2.0, hitboxMult: 0.6, color: '#F44336' },
};

const SLUGGER_DIFFICULTIES: Record<DifficultyLevel, SluggerDifficulty> = {
  easy: { name: 'Tee Ball', pitchSpeed: 0.6, timingWindow: 25, color: '#4CAF50' },
  normal: { name: 'Normal', pitchSpeed: 1.0, timingWindow: 15, color: '#2196F3' },
  hard: { name: 'Expert', pitchSpeed: 1.4, timingWindow: 10, color: '#FF9800' },
  insane: { name: 'MLB', pitchSpeed: 1.8, timingWindow: 6, color: '#F44336' },
};

const FOOTBALL_DIFFICULTIES: Record<DifficultyLevel, FootballDifficulty> = {
  easy: { name: 'Rookie', cpuSmarts: 0, quarterTime: 60, color: '#4CAF50' },
  normal: { name: 'Pro', cpuSmarts: 0.3, quarterTime: 60, color: '#2196F3' },
  hard: { name: 'All-Pro', cpuSmarts: 0.6, quarterTime: 45, color: '#FF9800' },
  insane: { name: 'Madden', cpuSmarts: 0.9, quarterTime: 45, color: '#F44336' },
};

// Difficulty selector component
interface DifficultySelectorProps {
  selected?: DifficultyLevel;
  onSelect: (d: DifficultyLevel) => void;
  difficulties: Record<DifficultyLevel, { name: string; color: string }>;
  game?: string;
  difficulty?: DifficultyLevel;
}

const DifficultySelector: React.FC<DifficultySelectorProps> = ({
  selected = 'normal',
  difficulty,
  onSelect,
  difficulties,
}) => (
  <div
    style={{
      display: 'flex',
      gap: '8px',
      justifyContent: 'center',
      marginBottom: '16px',
      flexWrap: 'wrap',
    }}
  >
    {(Object.keys(difficulties) as DifficultyLevel[]).map((level) => {
      const diff = difficulties[level];
      const isSelected = (difficulty ?? selected) === level;
      return (
        <button
          key={level}
          onClick={() => onSelect(level)}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            border: isSelected ? `2px solid ${diff.color}` : '2px solid transparent',
            background: isSelected ? `${diff.color}33` : 'rgba(255,255,255,0.05)',
            color: isSelected ? diff.color : '#888',
            fontWeight: isSelected ? 'bold' : 'normal',
            cursor: 'pointer',
            fontSize: '12px',
            transition: 'all 0.2s',
          }}
        >
          {diff.name}
        </button>
      );
    })}
  </div>
);

const PHYSICS = {
  gravity: 0.35,
  terminalVelocity: 12,
  springStiffness: 0.15,
  springDamping: 0.7,
  easing: {
    player: 0.35, // Snappier than 0.2
    ball: 0.25,
  },
  particleGravity: 0.15,
  particleDrag: 0.98,
};

const PARTICLE_EMOJIS: Record<string, string[]> = {
  catch: ['✨', '⭐', '💫'],
  golden: ['⭐', '✨', '💛', '🌟'],
  combo: ['🔥', '💥', '⚡'],
  powerup: ['💫', '✨', '🎯'],
  hit: ['💨', '✨'],
  homerun: ['🔥', '💥', '⭐', '✨', '🎆', '💫'],
  touchdown: ['🎉', '🔥', '⭐', '💥', '✨'],
  fieldgoal: ['✨', '⭐', '💛'],
};

let particleIdCounter = 0;
let floatingTextIdCounter = 0;

const createParticle = (
  x: number,
  y: number,
  type: Particle['type'],
  velocityScale = 1
): Particle => {
  const emojis = PARTICLE_EMOJIS[type] || ['✨'];
  const angle = Math.random() * Math.PI * 2;
  const speed = (2 + Math.random() * 4) * velocityScale;

  return {
    id: ++particleIdCounter,
    x,
    y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed - 2, // Slight upward bias
    life: 1,
    maxLife: 1,
    type,
    rotation: Math.random() * 360,
    rotationSpeed: (Math.random() - 0.5) * 20,
    scale: 0.8 + Math.random() * 0.4,
    emoji: emojis[Math.floor(Math.random() * emojis.length)],
  };
};

const createParticleBurst = (
  x: number,
  y: number,
  type: Particle['type'],
  count: number,
  velocityScale = 1
): Particle[] => {
  return Array.from({ length: count }, () => createParticle(x, y, type, velocityScale));
};

const createFloatingText = (x: number, y: number, text: string, color: string): FloatingText => ({
  id: ++floatingTextIdCounter,
  x,
  y,
  text,
  color,
  life: 1,
  maxLife: 1,
});

const updateParticles = (particles: Particle[], deltaTime = 1): Particle[] => {
  return particles
    .map((p) => ({
      ...p,
      x: p.x + p.vx * deltaTime,
      y: p.y + p.vy * deltaTime,
      vx: p.vx * PHYSICS.particleDrag,
      vy: p.vy * PHYSICS.particleDrag + PHYSICS.particleGravity,
      rotation: p.rotation + p.rotationSpeed,
      life: p.life - 0.02 * deltaTime,
    }))
    .filter((p) => p.life > 0)
    .slice(-30); // Performance cap
};

const updateFloatingTexts = (texts: FloatingText[], deltaTime = 1): FloatingText[] => {
  return texts
    .map((t) => ({
      ...t,
      y: t.y - 1.5 * deltaTime, // Float upward
      life: t.life - 0.025 * deltaTime,
    }))
    .filter((t) => t.life > 0)
    .slice(-10); // Performance cap
};

const calculateScreenShake = (shake: ScreenShake | null): { x: number; y: number } => {
  if (!shake) return { x: 0, y: 0 };

  const elapsed = Date.now() - shake.startTime;
  if (elapsed >= shake.duration) return { x: 0, y: 0 };

  const progress = elapsed / shake.duration;
  const decay = 1 - progress * progress; // Quadratic decay
  const intensity = shake.intensity * decay;

  return {
    x: (Math.random() - 0.5) * intensity * 2,
    y: (Math.random() - 0.5) * intensity * 2,
  };
};

const springInterp = (
  current: number,
  target: number,
  velocity: number
): { value: number; velocity: number } => {
  const force = (target - current) * PHYSICS.springStiffness;
  const newVelocity = (velocity + force) * PHYSICS.springDamping;
  return {
    value: current + newVelocity,
    velocity: newVelocity,
  };
};

// ============================================================================
// AUDIO SYSTEM - Web Audio API for Miniclip-style game feel
// ============================================================================

interface AudioContextType extends AudioContext {
  webkitAudioContext?: typeof AudioContext;
}

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}

const useGameAudio = () => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const isMutedRef = useRef(false);
  const [isMuted, setIsMuted] = useState(false);

  const getContext = useCallback(() => {
    if (!audioContextRef.current) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioContextRef.current = new AudioContextClass();
      }
    }
    // Resume if suspended (browser autoplay policy)
    if (audioContextRef.current?.state === 'suspended') {
      audioContextRef.current.resume();
    }
    return audioContextRef.current;
  }, []);

  const toggleMute = useCallback(() => {
    isMutedRef.current = !isMutedRef.current;
    setIsMuted(isMutedRef.current);
  }, []);

  // Basic tone generator
  const playTone = useCallback(
    (freq: number, duration: number, type: OscillatorType = 'sine', volume = 0.3) => {
      if (isMutedRef.current) return;
      const ctx = getContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = type;
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    },
    [getContext]
  );

  // Frequency sweep (for powerups, celebrations)
  const playSweep = useCallback(
    (
      startFreq: number,
      endFreq: number,
      duration: number,
      type: OscillatorType = 'sine',
      volume = 0.3
    ) => {
      if (isMutedRef.current) return;
      const ctx = getContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = type;
      osc.frequency.setValueAtTime(startFreq, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(endFreq, ctx.currentTime + duration);
      gain.gain.setValueAtTime(volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    },
    [getContext]
  );

  // Chord (multiple tones for celebrations)
  const playChord = useCallback(
    (frequencies: number[], duration: number, type: OscillatorType = 'sine', volume = 0.2) => {
      if (isMutedRef.current) return;
      frequencies.forEach((freq) => playTone(freq, duration, type, volume / frequencies.length));
    },
    [playTone]
  );

  // White noise burst (for hits, whooshes)
  const playNoise = useCallback(
    (duration: number, volume = 0.2) => {
      if (isMutedRef.current) return;
      const ctx = getContext();
      if (!ctx) return;

      const bufferSize = ctx.sampleRate * duration;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize); // Fade out
      }

      const source = ctx.createBufferSource();
      const gain = ctx.createGain();
      source.buffer = buffer;
      source.connect(gain);
      gain.connect(ctx.destination);
      gain.gain.setValueAtTime(volume, ctx.currentTime);
      source.start();
    },
    [getContext]
  );

  // Beep sequence (for countdowns)
  const playBeepSequence = useCallback(
    (count: number, interval: number, freq: number, finalFreq?: number) => {
      if (isMutedRef.current) return;
      for (let i = 0; i < count; i++) {
        setTimeout(() => {
          const isLast = i === count - 1;
          playTone(isLast && finalFreq ? finalFreq : freq, 0.1, 'square', 0.25);
        }, i * interval);
      }
    },
    [playTone]
  );

  // ===== GAME-SPECIFIC SOUND EFFECTS =====

  // Hot Dog Dash sounds
  const sounds = {
    // Hot Dog Dash
    catch: () => playTone(800, 0.1, 'sine', 0.25),
    goldenCatch: () => playChord([1200, 1600], 0.15, 'sine', 0.3),
    powerup: () => playSweep(400, 800, 0.2, 'sine', 0.25),
    comboMilestone: () => playChord([523, 659, 784], 0.25, 'sine', 0.3), // C-E-G
    hotdogMiss: () => playTone(200, 0.15, 'sine', 0.15),

    // Sandlot Slugger
    pitchWhoosh: () => playNoise(0.15, 0.15),
    batCrack: () => {
      playTone(1000, 0.08, 'square', 0.35);
      playNoise(0.05, 0.2);
    },
    batWhiff: () => playNoise(0.2, 0.1),
    homeRun: () => {
      playChord([523, 659, 784, 1047], 0.4, 'sine', 0.3);
      setTimeout(() => playSweep(400, 1200, 0.3, 'sine', 0.25), 200);
    },
    strikeout: () => playSweep(400, 150, 0.4, 'sine', 0.2),
    baseHit: () => playTone(600, 0.15, 'sine', 0.25),

    // Gridiron Blitz
    snap: () => playTone(1200, 0.05, 'square', 0.2),
    touchdown: () => {
      playChord([392, 494, 587, 784], 0.5, 'sine', 0.35); // G-B-D-G
      setTimeout(() => playSweep(500, 1500, 0.4, 'sawtooth', 0.2), 300);
    },
    fieldGoal: () => {
      playTone(800, 0.1, 'sine', 0.25);
      setTimeout(() => playChord([600, 800, 1000], 0.3, 'sine', 0.25), 150);
    },
    fieldGoalMiss: () => playSweep(600, 200, 0.3, 'sine', 0.2),
    turnover: () => playSweep(800, 300, 0.3, 'sawtooth', 0.25),
    clockWarning: () => playTone(880, 0.1, 'square', 0.2),
    bigPlay: () => playChord([600, 900], 0.2, 'sine', 0.25),

    // Shared
    gameStart: () => playBeepSequence(4, 800, 440, 880),
    gameOver: () => playSweep(400, 150, 0.5, 'sine', 0.25),
    menuSelect: () => playTone(600, 0.08, 'sine', 0.2),
    menuBack: () => playTone(400, 0.08, 'sine', 0.15),
    pause: () => playTone(300, 0.15, 'sine', 0.2),
    resume: () => playTone(500, 0.1, 'sine', 0.2),
  };

  return { sounds, toggleMute, isMuted, getContext };
};

// ============================================================================
// PARTICLE & TEXT RENDERERS
// ============================================================================

const ParticleRenderer: React.FC<{ particles: Particle[]; offsetX?: number; offsetY?: number }> = ({
  particles,
  offsetX = 0,
  offsetY = 0,
}) => (
  <>
    {particles.map((p) => (
      <div
        key={p.id}
        style={{
          position: 'absolute',
          left: `${p.x + offsetX}%`,
          top: `${p.y + offsetY}%`,
          transform: `translate(-50%, -50%) rotate(${p.rotation}deg) scale(${p.scale * p.life})`,
          fontSize: `${16 + p.scale * 8}px`,
          opacity: p.life,
          pointerEvents: 'none',
          willChange: 'transform, opacity',
        }}
      >
        {p.emoji}
      </div>
    ))}
  </>
);

const FloatingTextRenderer: React.FC<{
  texts: FloatingText[];
  offsetX?: number;
  offsetY?: number;
}> = ({ texts, offsetX = 0, offsetY = 0 }) => (
  <>
    {texts.map((t) => (
      <div
        key={t.id}
        style={{
          position: 'absolute',
          left: `${t.x + offsetX}%`,
          top: `${t.y + offsetY}%`,
          transform: 'translate(-50%, -50%)',
          color: t.color,
          fontWeight: 'bold',
          fontSize: `${14 + (1 - t.life) * 4}px`,
          opacity: t.life,
          textShadow: '0 2px 4px rgba(0,0,0,0.5)',
          pointerEvents: 'none',
          whiteSpace: 'nowrap',
          willChange: 'transform, opacity',
        }}
      >
        {t.text}
      </div>
    ))}
  </>
);

// ============================================================================
// SHARED COMPONENTS
// ============================================================================

const ArcadeHeader: React.FC<ArcadeHeaderProps> = ({
  title,
  onBack,
  onClose,
  showBack = false,
}) => (
  <div
    style={{
      background: `linear-gradient(180deg, ${COLORS.midnight} 0%, rgba(13,13,13,0.95) 100%)`,
      padding: '12px 20px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottom: `3px solid ${COLORS.burntOrange}`,
      boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      {showBack && onBack && (
        <button
          onClick={onBack}
          style={{
            background: 'rgba(255,255,255,0.1)',
            border: 'none',
            color: COLORS.burntOrange,
            fontSize: '18px',
            cursor: 'pointer',
            width: '32px',
            height: '32px',
            borderRadius: '8px',
          }}
        >
          ←
        </button>
      )}
      <div
        style={{
          color: COLORS.burntOrange,
          fontWeight: 'bold',
          fontSize: '18px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <span style={{ fontSize: '24px' }}>🕹️</span>
        {title}
      </div>
    </div>
    {onClose && (
      <button
        onClick={onClose}
        style={{
          background: 'rgba(255,255,255,0.1)',
          border: 'none',
          color: '#888',
          fontSize: '20px',
          cursor: 'pointer',
          width: '32px',
          height: '32px',
          borderRadius: '8px',
        }}
      >
        ×
      </button>
    )}
  </div>
);

const GameCard: React.FC<GameCardProps> = ({ game, highScore, onSelect }) => (
  <button
    onClick={() => game.component && onSelect(game.id)}
    style={{
      background: `linear-gradient(135deg, ${COLORS.charcoal} 0%, ${COLORS.midnight} 100%)`,
      border: `2px solid ${COLORS.texasSoil}`,
      borderRadius: '16px',
      padding: '20px',
      cursor: 'pointer',
      textAlign: 'center',
      transition: 'all 0.2s ease',
      width: '100%',
      maxWidth: '280px',
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.borderColor = COLORS.burntOrange;
      e.currentTarget.style.transform = 'scale(1.03)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.borderColor = COLORS.texasSoil;
      e.currentTarget.style.transform = 'scale(1)';
    }}
  >
    <div style={{ fontSize: '48px', marginBottom: '12px' }}>{game.icon}</div>
    <div style={{ color: 'white', fontSize: '18px', fontWeight: 'bold', marginBottom: '6px' }}>
      {game.title}
    </div>
    <div style={{ color: '#888', fontSize: '13px', marginBottom: '12px' }}>{game.description}</div>
    {highScore > 0 && (
      <div
        style={{
          background: 'rgba(255,215,0,0.1)',
          borderRadius: '8px',
          padding: '6px 12px',
          display: 'inline-block',
        }}
      >
        <span style={{ color: COLORS.mustard, fontSize: '12px' }}>🏆 Best: {highScore}</span>
      </div>
    )}
  </button>
);

const ScoreBar: React.FC<{ items: ScoreBarItem[] }> = ({ items }) => (
  <div
    style={{
      background: 'rgba(0,0,0,0.7)',
      padding: '10px 15px',
      display: 'flex',
      justifyContent: 'space-around',
      color: 'white',
    }}
  >
    {items.map((item, i) => (
      <div key={i} style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '10px', color: '#888' }}>{item.label}</div>
        <div style={{ fontSize: '20px', fontWeight: 'bold', color: item.color || 'white' }}>
          {item.value}
        </div>
      </div>
    ))}
  </div>
);

const GameOverlay: React.FC<GameOverlayProps> = ({ children, visible }) => {
  if (!visible) return null;
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: 'rgba(0,0,0,0.92)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        padding: '20px',
        zIndex: 100,
      }}
    >
      {children}
    </div>
  );
};

const ActionButton: React.FC<ActionButtonProps> = ({
  children,
  onClick,
  color = COLORS.burntOrange,
  small = false,
}) => (
  <button
    onClick={onClick}
    style={{
      background: `linear-gradient(180deg, ${color} 0%, ${color}cc 100%)`,
      color: 'white',
      border: 'none',
      padding: small ? '8px 20px' : '14px 44px',
      fontSize: small ? '14px' : '18px',
      fontWeight: 'bold',
      borderRadius: '10px',
      cursor: 'pointer',
      boxShadow: `0 4px 20px ${color}66`,
    }}
  >
    {children}
  </button>
);

// ============================================================================
// GAME TRANSITIONS: COUNTDOWN, STATS SCREEN, PAUSE MENU
// ============================================================================

interface CountdownProps {
  onComplete: () => void;
  sounds: GameSounds;
}

const Countdown: React.FC<CountdownProps> = ({ onComplete, sounds }) => {
  const [count, setCount] = useState(3);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    if (count > 0) {
      // Play beep sound for countdown
      sounds.menuSelect();
      // Animate scale
      setScale(1.5);
      setTimeout(() => setScale(1), 200);
      // Countdown
      const timer = setTimeout(() => setCount((c) => c - 1), 800);
      return () => clearTimeout(timer);
    } else if (count === 0) {
      // GO!
      sounds.gameStart();
      setScale(2);
      setTimeout(() => {
        onComplete();
      }, 500);
    }
  }, [count, sounds, onComplete]);

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: 'rgba(0,0,0,0.85)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 200,
      }}
    >
      <div
        style={{
          fontSize: count === 0 ? '80px' : '120px',
          fontWeight: 'bold',
          color: count === 0 ? COLORS.mustard : 'white',
          textShadow: `0 0 40px ${count === 0 ? COLORS.mustard : COLORS.burntOrange}`,
          transform: `scale(${scale})`,
          transition: 'transform 0.2s ease-out',
        }}
      >
        {count === 0 ? 'GO!' : count}
      </div>
      <div
        style={{
          fontSize: '18px',
          color: '#888',
          marginTop: '20px',
          opacity: count > 0 ? 1 : 0,
        }}
      >
        Get Ready...
      </div>
    </div>
  );
};

// ============================================================================
// ACHIEVEMENT POPUP
// ============================================================================

interface AchievementPopupProps {
  achievements: Achievement[];
  cosmetics: Cosmetic[];
  onClose: () => void;
  sounds: GameSounds;
}

const AchievementPopup: React.FC<AchievementPopupProps> = ({
  achievements,
  cosmetics,
  onClose,
  sounds,
}) => {
  useEffect(() => {
    // Play achievement sound for each unlocked
    achievements.forEach((_, i) => {
      setTimeout(() => sounds.comboMilestone(), i * 300);
    });
  }, [achievements, sounds]);

  if (achievements.length === 0 && cosmetics.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.85)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        animation: 'fadeIn 0.3s ease-out',
      }}
    >
      <div
        style={{
          background: `linear-gradient(135deg, ${COLORS.charcoal} 0%, ${COLORS.midnight} 100%)`,
          borderRadius: '16px',
          padding: '24px',
          maxWidth: '400px',
          width: '90%',
          textAlign: 'center',
          border: `2px solid ${COLORS.mustard}`,
          animation: 'popIn 0.4s ease-out',
        }}
      >
        <div style={{ fontSize: '48px', marginBottom: '12px' }}>🏆</div>
        <h2 style={{ color: COLORS.mustard, marginBottom: '16px' }}>
          {achievements.length === 1
            ? 'Achievement Unlocked!'
            : `${achievements.length} Achievements Unlocked!`}
        </h2>

        <div
          style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}
        >
          {achievements.map((achievement) => (
            <div
              key={achievement.id}
              style={{
                background: 'rgba(255,255,255,0.05)',
                borderRadius: '12px',
                padding: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <span style={{ fontSize: '32px' }}>{achievement.icon}</span>
              <div style={{ textAlign: 'left' }}>
                <div style={{ color: 'white', fontWeight: 'bold', fontSize: '16px' }}>
                  {achievement.name}
                </div>
                <div style={{ color: '#888', fontSize: '12px' }}>{achievement.description}</div>
              </div>
            </div>
          ))}
        </div>

        {cosmetics.length > 0 && (
          <>
            <div style={{ color: COLORS.ember, fontSize: '14px', marginBottom: '12px' }}>
              New unlocks available!
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '8px',
                marginBottom: '16px',
                flexWrap: 'wrap',
              }}
            >
              {cosmetics.map((cosmetic) => (
                <div
                  key={cosmetic.id}
                  style={{
                    background: 'rgba(255,107,53,0.2)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  {cosmetic.emoji && <span>{cosmetic.emoji}</span>}
                  <span style={{ color: 'white', fontSize: '12px' }}>{cosmetic.name}</span>
                </div>
              ))}
            </div>
          </>
        )}

        <ActionButton onClick={onClose} color={COLORS.mustard}>
          Awesome!
        </ActionButton>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  );
};

// ============================================================================
// ACHIEVEMENTS DISPLAY (for Arcade Hub)
// ============================================================================

interface AchievementsDisplayProps {
  progress: PlayerProgress;
  onClose: () => void;
}

const AchievementsDisplay: React.FC<AchievementsDisplayProps> = ({ progress, onClose }) => {
  const unlockedCount = progress.achievements.length;
  const totalCount = ACHIEVEMENTS.length;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.9)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px',
      }}
    >
      <div
        style={{
          background: `linear-gradient(135deg, ${COLORS.charcoal} 0%, ${COLORS.midnight} 100%)`,
          borderRadius: '16px',
          padding: '24px',
          maxWidth: '500px',
          width: '100%',
          maxHeight: '80vh',
          overflow: 'auto',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
          }}
        >
          <h2 style={{ color: COLORS.burntOrange, margin: 0 }}>Achievements</h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'white',
              fontSize: '24px',
              cursor: 'pointer',
            }}
          >
            ×
          </button>
        </div>

        <div style={{ marginBottom: '16px', color: '#888', fontSize: '14px' }}>
          {unlockedCount} / {totalCount} unlocked
        </div>

        <div
          style={{
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '8px',
            height: '8px',
            marginBottom: '20px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${(unlockedCount / totalCount) * 100}%`,
              background: `linear-gradient(90deg, ${COLORS.ember}, ${COLORS.mustard})`,
              transition: 'width 0.5s',
            }}
          />
        </div>

        {['hotdog', 'slugger', 'football', 'global'].map((game) => {
          const gameAchievements = ACHIEVEMENTS.filter((a) => a.game === game);
          const gameName =
            game === 'hotdog'
              ? 'Hot Dog Dash'
              : game === 'slugger'
                ? 'Sandlot Slugger'
                : game === 'football'
                  ? 'Gridiron Blitz'
                  : 'Global';
          return (
            <div key={game} style={{ marginBottom: '20px' }}>
              <h3 style={{ color: COLORS.ember, fontSize: '14px', marginBottom: '10px' }}>
                {gameName}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {gameAchievements.map((achievement) => {
                  const isUnlocked = progress.achievements.includes(achievement.id);
                  return (
                    <div
                      key={achievement.id}
                      style={{
                        background: isUnlocked ? 'rgba(255,215,0,0.1)' : 'rgba(255,255,255,0.03)',
                        borderRadius: '8px',
                        padding: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        opacity: isUnlocked ? 1 : 0.5,
                      }}
                    >
                      <span
                        style={{ fontSize: '24px', filter: isUnlocked ? 'none' : 'grayscale(1)' }}
                      >
                        {achievement.icon}
                      </span>
                      <div>
                        <div
                          style={{
                            color: isUnlocked ? 'white' : '#666',
                            fontWeight: 'bold',
                            fontSize: '14px',
                          }}
                        >
                          {achievement.name}
                        </div>
                        <div style={{ color: '#666', fontSize: '11px' }}>
                          {achievement.description}
                        </div>
                      </div>
                      {isUnlocked && (
                        <span style={{ marginLeft: 'auto', color: COLORS.mustard }}>✓</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

interface StatsScreenProps {
  gameType: 'hotdog' | 'slugger' | 'football';
  stats: HotDogStats | SluggerStats | FootballStats;
  onPlayAgain: () => void;
  onBack: () => void;
  sounds: GameSounds;
  isDailyChallenge?: boolean;
}

const StatsScreen: React.FC<StatsScreenProps> = ({
  gameType,
  stats,
  onPlayAgain,
  onBack,
  sounds,
  isDailyChallenge,
}) => {
  const [animatedScore, setAnimatedScore] = useState(0);
  const [copied, setCopied] = useState(false);

  const getGameName = () => {
    switch (gameType) {
      case 'hotdog':
        return 'Hot Dog Dash';
      case 'slugger':
        return 'Sandlot Slugger';
      case 'football':
        return 'Gridiron Blitz';
      default:
        return 'Blaze Arcade';
    }
  };

  const getGameEmoji = () => {
    switch (gameType) {
      case 'hotdog':
        return '🌭';
      case 'slugger':
        return '⚾';
      case 'football':
        return '🏈';
      default:
        return '🎮';
    }
  };

  const generateShareText = () => {
    const emoji = getGameEmoji();
    const gameName = getGameName();
    const highScoreNote = stats.isNewHighScore ? ' (NEW RECORD!)' : '';
    const dailyNote = isDailyChallenge ? ` [${getDailyDateString()} Daily Challenge]` : '';
    return `${emoji} I scored ${stats.finalScore.toLocaleString()} in ${gameName}${highScoreNote}${dailyNote}\n\nCan you beat me? 🔥\nblazesportsintel.com/arcade`;
  };

  const handleCopyScore = async () => {
    try {
      await navigator.clipboard.writeText(generateShareText());
      setCopied(true);
      sounds.powerup();
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = generateShareText();
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      sounds.powerup();
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleTwitterShare = () => {
    const text = encodeURIComponent(generateShareText());
    const url = `https://twitter.com/intent/tweet?text=${text}`;
    window.open(url, '_blank', 'width=550,height=420');
    sounds.menuSelect();
  };

  useEffect(() => {
    // Animate score counting up
    const duration = 1500;
    const startTime = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      setAnimatedScore(Math.floor(stats.finalScore * progress));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [stats.finalScore]);

  const renderHotDogStats = (s: HotDogStats) => (
    <>
      <StatRow label="Hot Dogs Caught" value={s.totalCatches} />
      <StatRow label="Golden Dogs" value={s.goldenCatches} highlight />
      <StatRow label="Power-ups" value={s.powerupsCollected} />
      <StatRow label="Max Combo" value={`${s.maxCombo}×`} highlight={s.maxCombo >= 10} />
      <StatRow label="Missed" value={s.missedHotdogs} bad={s.missedHotdogs > 5} />
    </>
  );

  const renderSluggerStats = (s: SluggerStats) => (
    <>
      <StatRow label="Total Swings" value={s.totalSwings} />
      <StatRow label="Hits" value={s.hits} />
      <StatRow label="Home Runs" value={s.homeRuns} highlight />
      <StatRow label="Max Combo" value={`${s.maxCombo}×`} highlight={s.maxCombo >= 3} />
      <StatRow label="Strikeouts" value={s.strikeouts} bad={s.strikeouts > 5} />
    </>
  );

  const renderFootballStats = (s: FootballStats) => (
    <>
      <StatRow
        label="Final Score"
        value={`${s.finalScore} - ${s.opponentScore}`}
        highlight={s.finalScore > s.opponentScore}
      />
      <StatRow label="Touchdowns" value={s.touchdowns} highlight />
      <StatRow label="Field Goals" value={s.fieldGoals} />
      <StatRow label="Big Plays" value={s.bigPlays} highlight={s.bigPlays >= 3} />
      <StatRow
        label="Turnovers Forced"
        value={s.turnoversForced}
        highlight={s.turnoversForced > 0}
      />
      <StatRow label="Turnovers Lost" value={s.turnoversLost} bad={s.turnoversLost > 0} />
    </>
  );

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: 'rgba(0,0,0,0.95)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 200,
        padding: '20px',
      }}
    >
      {stats.isNewHighScore && (
        <div
          style={{
            fontSize: '24px',
            color: COLORS.mustard,
            fontWeight: 'bold',
            textShadow: `0 0 20px ${COLORS.mustard}`,
            marginBottom: '10px',
            animation: 'pulse 1s infinite',
          }}
        >
          🏆 NEW HIGH SCORE! 🏆
        </div>
      )}
      <div style={{ fontSize: '18px', color: '#888', marginBottom: '5px' }}>FINAL SCORE</div>
      <div
        style={{
          fontSize: '64px',
          fontWeight: 'bold',
          color: 'white',
          textShadow: `0 0 30px ${COLORS.burntOrange}`,
        }}
      >
        {animatedScore.toLocaleString()}
      </div>
      <div style={{ fontSize: '14px', color: '#666', marginBottom: '20px' }}>
        Personal Best: {stats.highScore.toLocaleString()}
      </div>
      <div
        style={{
          background: 'rgba(255,255,255,0.05)',
          borderRadius: '12px',
          padding: '15px 25px',
          marginBottom: '25px',
          minWidth: '280px',
        }}
      >
        {gameType === 'hotdog' && renderHotDogStats(stats as HotDogStats)}
        {gameType === 'slugger' && renderSluggerStats(stats as SluggerStats)}
        {gameType === 'football' && renderFootballStats(stats as FootballStats)}
      </div>
      {/* Share buttons */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button
          onClick={handleCopyScore}
          style={{
            background: copied ? '#4CAF50' : 'rgba(255,255,255,0.1)',
            border: 'none',
            borderRadius: '8px',
            padding: '10px 16px',
            color: 'white',
            cursor: 'pointer',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.2s',
          }}
        >
          {copied ? '✓ Copied!' : '📋 Copy Score'}
        </button>
        <button
          onClick={handleTwitterShare}
          style={{
            background: '#1DA1F2',
            border: 'none',
            borderRadius: '8px',
            padding: '10px 16px',
            color: 'white',
            cursor: 'pointer',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          𝕏 Share
        </button>
      </div>
      <div style={{ display: 'flex', gap: '15px' }}>
        <ActionButton
          onClick={() => {
            sounds.menuSelect();
            onPlayAgain();
          }}
        >
          Play Again
        </ActionButton>
        <ActionButton
          onClick={() => {
            sounds.menuBack();
            onBack();
          }}
          color="#666"
        >
          Menu
        </ActionButton>
      </div>
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
      `}</style>
    </div>
  );
};

const StatRow: React.FC<{
  label: string;
  value: string | number;
  highlight?: boolean;
  bad?: boolean;
}> = ({ label, value, highlight, bad }) => (
  <div
    style={{
      display: 'flex',
      justifyContent: 'space-between',
      padding: '8px 0',
      borderBottom: '1px solid rgba(255,255,255,0.1)',
    }}
  >
    <span style={{ color: '#aaa' }}>{label}</span>
    <span
      style={{
        fontWeight: 'bold',
        color: bad ? COLORS.ketchup : highlight ? COLORS.mustard : 'white',
      }}
    >
      {value}
    </span>
  </div>
);

interface PauseMenuProps {
  onResume: () => void;
  onRestart: () => void;
  onQuit: () => void;
  sounds: GameSounds;
}

const PauseMenu: React.FC<PauseMenuProps> = ({ onResume, onRestart, onQuit, sounds }) => (
  <div
    style={{
      position: 'absolute',
      inset: 0,
      background: 'rgba(0,0,0,0.9)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 300,
    }}
  >
    <div style={{ fontSize: '48px', marginBottom: '10px' }}>⏸️</div>
    <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'white', marginBottom: '30px' }}>
      PAUSED
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
      <ActionButton
        onClick={() => {
          sounds.resume();
          onResume();
        }}
      >
        Resume
      </ActionButton>
      <ActionButton
        onClick={() => {
          sounds.menuSelect();
          onRestart();
        }}
        color="#666"
      >
        Restart
      </ActionButton>
      <ActionButton
        onClick={() => {
          sounds.menuBack();
          onQuit();
        }}
        color="#444"
      >
        Quit
      </ActionButton>
    </div>
    <div style={{ marginTop: '30px', color: '#666', fontSize: '14px' }}>Press ESC to resume</div>
  </div>
);

// ============================================================================
// GAME 1: HOT DOG DASH
// ============================================================================

const HOTDOG_POWERUPS: Record<string, PowerUp> = {
  MAGNET: { emoji: '🧲', color: '#E74C3C', duration: 5000 },
  DOUBLE: { emoji: '×2', color: '#9B59B6', duration: 6000 },
  SLOW: { emoji: '🐌', color: '#3498DB', duration: 5000 },
};

const CHONK_LEVELS: ChonkLevel[] = [
  { threshold: 0, label: 'Aerodynamic Weiner', emoji: '💨' },
  { threshold: 8, label: 'Snack Enthusiast', emoji: '😋' },
  { threshold: 20, label: 'Pleasantly Plump', emoji: '🐕' },
  { threshold: 35, label: 'Absolute Unit', emoji: '💪' },
  { threshold: 55, label: 'HEFTY GIRL', emoji: '🎺' },
  { threshold: 80, label: 'OH LAWD SHE COMIN', emoji: '🚨' },
  { threshold: 110, label: 'LEGENDARY LOAF', emoji: '🏆' },
];

const getChonkLevel = (score: number): ChonkLevel & { index: number } => {
  for (let i = CHONK_LEVELS.length - 1; i >= 0; i--) {
    if (score >= CHONK_LEVELS[i].threshold) return { ...CHONK_LEVELS[i], index: i };
  }
  return { ...CHONK_LEVELS[0], index: 0 };
};

const HotDog: React.FC<{
  x: number;
  y: number;
  isGolden: boolean;
  isPowerUp: boolean;
  powerUpType: string | null;
}> = ({ x, y, isGolden, isPowerUp, powerUpType }) => {
  if (isPowerUp && powerUpType) {
    const p = HOTDOG_POWERUPS[powerUpType];
    return (
      <div
        style={{
          position: 'absolute',
          left: `${x}%`,
          top: `${y}%`,
          transform: 'translate(-50%, -50%)',
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          background: p.color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '16px',
          boxShadow: `0 0 15px ${p.color}`,
          border: '2px solid white',
        }}
      >
        {p.emoji}
      </div>
    );
  }
  return (
    <div
      style={{
        position: 'absolute',
        left: `${x}%`,
        top: `${y}%`,
        transform: 'translate(-50%, -50%)',
        fontSize: '32px',
        filter: isGolden ? 'drop-shadow(0 0 8px gold)' : 'none',
      }}
    >
      {isGolden ? '⭐🌭' : '🌭'}
    </div>
  );
};

const BlazeSprite: React.FC<{ chonkFactor: number; isMoving: boolean }> = ({
  chonkFactor,
  isMoving,
}) => {
  const cf = Math.min(chonkFactor, 1.8);
  const width = 50 + (cf - 1) * 30;
  return (
    <div
      style={{
        position: 'relative',
        width: `${width}px`,
        height: '40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{ fontSize: `${28 + (cf - 1) * 15}px`, transform: isMoving ? 'scaleX(-1)' : 'none' }}
      >
        🐕
      </div>
      <div
        style={{
          position: 'absolute',
          top: '-8px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '12px',
          height: '6px',
          background: COLORS.burntOrange,
          borderRadius: '3px',
        }}
      />
    </div>
  );
};

const HotDogDashGame: React.FC<GameProps> = ({
  onBack,
  onUpdateHighScore,
  highScore,
  sounds,
  onGameComplete,
  isDailyChallenge,
  dailyRng,
}) => {
  const [gamePhase, setGamePhase] = useState<'idle' | 'countdown' | 'playing' | 'paused' | 'stats'>(
    'idle'
  );
  const [difficulty, setDifficulty] = useState<DifficultyLevel>(
    isDailyChallenge ? 'normal' : 'normal'
  );
  // Store dailyRng in ref to maintain across renders
  const rngRef = useRef(dailyRng);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [hotDogs, setHotDogs] = useState<(HotDogItem & { velocityY: number })[]>([]);
  const [timeLeft, setTimeLeft] = useState(45);
  const [activePowerUps, setActivePowerUps] = useState<Record<string, boolean>>({});
  const diffSettings = HOTDOG_DIFFICULTIES[difficulty];
  const blazeXRef = useRef(50);
  const targetXRef = useRef(50);
  const velocityXRef = useRef(0);
  const [blazeX, setBlazeX] = useState(50);
  // Stats tracking refs
  const statsRef = useRef({
    totalCatches: 0,
    goldenCatches: 0,
    powerupsCollected: 0,
    maxCombo: 0,
    missedHotdogs: 0,
  });
  const [gameStats, setGameStats] = useState<HotDogStats | null>(null);
  const [isMoving, setIsMoving] = useState(false);
  const gameRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number | undefined>(undefined);
  const keysPressed = useRef({ left: false, right: false });
  // Particle and effects state
  const [particles, setParticles] = useState<Particle[]>([]);
  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);
  const [screenShake, setScreenShake] = useState<ScreenShake | null>(null);
  const lastComboMilestoneRef = useRef(0);

  const chonkFactor = Math.min(1.8, 1.0 + score * 0.012);
  const currentChonkLevel = getChonkLevel(score);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (gamePhase === 'playing') setGamePhase('paused');
        else if (gamePhase === 'paused') setGamePhase('playing');
        return;
      }
      if (gamePhase !== 'playing') return;
      if (e.key === 'ArrowLeft') keysPressed.current.left = true;
      if (e.key === 'ArrowRight') keysPressed.current.right = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') keysPressed.current.left = false;
      if (e.key === 'ArrowRight') keysPressed.current.right = false;
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gamePhase]);

  const handleTouch = useCallback(
    (e: React.TouchEvent) => {
      if (gamePhase !== 'playing' || !gameRef.current) return;
      e.preventDefault();
      const rect = gameRef.current.getBoundingClientRect();
      targetXRef.current = Math.max(
        8,
        Math.min(92, ((e.touches[0].clientX - rect.left) / rect.width) * 100)
      );
    },
    [gamePhase]
  );

  useEffect(() => {
    if (gamePhase !== 'playing') return;
    const gameLoop = () => {
      // Keyboard input
      if (keysPressed.current.left) targetXRef.current = Math.max(8, targetXRef.current - 2.5);
      if (keysPressed.current.right) targetXRef.current = Math.min(92, targetXRef.current + 2.5);

      // Spring-based player movement (snappier than before)
      const prevX = blazeXRef.current;
      const spring = springInterp(blazeXRef.current, targetXRef.current, velocityXRef.current);
      blazeXRef.current = Math.max(8, Math.min(92, spring.value));
      velocityXRef.current = spring.velocity;
      setBlazeX(blazeXRef.current);
      setIsMoving(Math.abs(blazeXRef.current - prevX) > 0.3);

      // Spring-based magnet physics
      if (activePowerUps.MAGNET) {
        setHotDogs((prev) =>
          prev.map((dog) => {
            if (dog.isPowerUp) return dog;
            const dist = Math.abs(dog.x - blazeXRef.current);
            if (dist < 30 && dog.y > 25) {
              // Spring-based attraction with distance falloff
              const force = (blazeXRef.current - dog.x) * PHYSICS.springStiffness * (1 - dist / 30);
              return { ...dog, x: dog.x + force * 1.5 };
            }
            return dog;
          })
        );
      }

      // Update hot dogs with gravity acceleration
      const speedMult = activePowerUps.SLOW ? 0.5 : 1;
      setHotDogs((prev) => {
        const hitboxWidth = (15 + (chonkFactor - 1) * 8) * diffSettings.hitboxMult;
        return prev.filter((dog) => {
          // Apply gravity to velocity
          const newVelocity = Math.min(
            dog.velocityY + PHYSICS.gravity * speedMult,
            PHYSICS.terminalVelocity
          );
          const newY = dog.y + newVelocity * speedMult;

          // Check collision with Blaze
          if (newY >= 65 && newY <= 92 && Math.abs(dog.x - blazeXRef.current) < hitboxWidth) {
            if (dog.isPowerUp && dog.powerUpType) {
              const type = dog.powerUpType;
              setActivePowerUps((p) => ({ ...p, [type]: true }));
              setTimeout(
                () =>
                  setActivePowerUps((p) => {
                    const n = { ...p };
                    delete n[type];
                    return n;
                  }),
                HOTDOG_POWERUPS[type].duration
              );
              // Power-up particles
              setParticles((p) => [...p, ...createParticleBurst(dog.x, 85, 'powerup', 5)]);
              setFloatingTexts((t) => [
                ...t,
                createFloatingText(
                  dog.x,
                  80,
                  HOTDOG_POWERUPS[type].emoji,
                  HOTDOG_POWERUPS[type].color
                ),
              ]);
              sounds.powerup();
              statsRef.current.powerupsCollected++;
            } else {
              let points = dog.isGolden ? 5 : 1;
              points += Math.floor(combo / 5);
              if (activePowerUps.DOUBLE) points *= 2;
              setScore((s) => s + points);
              setCombo((c) => {
                const newCombo = c + 1;
                // Track max combo
                if (newCombo > statsRef.current.maxCombo) statsRef.current.maxCombo = newCombo;
                // Screen shake on combo milestones (5, 10, 15, 20...)
                if (
                  newCombo >= 5 &&
                  newCombo % 5 === 0 &&
                  newCombo > lastComboMilestoneRef.current
                ) {
                  lastComboMilestoneRef.current = newCombo;
                  setScreenShake({
                    intensity: 3 + Math.min(newCombo / 5, 4),
                    duration: 200,
                    startTime: Date.now(),
                  });
                  setParticles((p) => [...p, ...createParticleBurst(dog.x, 85, 'combo', 6, 1.2)]);
                  setFloatingTexts((t) => [
                    ...t,
                    createFloatingText(dog.x, 75, `${newCombo}× COMBO!`, COLORS.mustard),
                  ]);
                  sounds.comboMilestone();
                }
                return newCombo;
              });
              // Track stats
              statsRef.current.totalCatches++;
              if (dog.isGolden) statsRef.current.goldenCatches++;
              // Particle burst on catch
              const particleType = dog.isGolden ? 'golden' : 'catch';
              const particleCount = dog.isGolden ? 8 : 3;
              setParticles((p) => [
                ...p,
                ...createParticleBurst(dog.x, 85, particleType, particleCount),
              ]);
              setFloatingTexts((t) => [
                ...t,
                createFloatingText(
                  dog.x,
                  82,
                  `+${points}`,
                  dog.isGolden ? COLORS.mustard : COLORS.ember
                ),
              ]);
              // Play catch sound
              dog.isGolden ? sounds.goldenCatch() : sounds.catch();
            }
            return false;
          }
          // Missed - fell off screen
          if (newY > 105) {
            if (!dog.isPowerUp) {
              setCombo(0);
              lastComboMilestoneRef.current = 0;
              sounds.hotdogMiss();
              statsRef.current.missedHotdogs++;
            }
            return false;
          }
          dog.y = newY;
          dog.velocityY = newVelocity;
          return true;
        });
      });

      // Update particle effects
      setParticles((p) => updateParticles(p));
      setFloatingTexts((t) => updateFloatingTexts(t));

      // Clear expired screen shake
      if (screenShake && Date.now() - screenShake.startTime > screenShake.duration) {
        setScreenShake(null);
      }

      frameRef.current = requestAnimationFrame(gameLoop);
    };
    frameRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [gamePhase, chonkFactor, activePowerUps, combo, screenShake]);

  useEffect(() => {
    if (gamePhase !== 'playing') return;
    // Apply difficulty spawn rate multiplier (higher rate = shorter interval)
    const baseInterval = Math.max(900, 1600 - score * 4);
    const interval = Math.max(500, baseInterval / diffSettings.spawnRate);
    const spawn = setInterval(() => {
      // Use seeded RNG for daily challenges, regular random otherwise
      const rng = rngRef.current;
      const rand = () => (rng ? rng.next() : Math.random());

      const isPowerUp = rand() < 0.06;
      // Initial velocity starts slow, gravity accelerates
      const baseSpeed = 0.4 + rand() * 0.3 + Math.min(score * 0.003, 0.3);
      setHotDogs((prev) => [
        ...prev,
        {
          id: Date.now() + rand(),
          x: rand() * 75 + 12,
          y: -5,
          speed: baseSpeed, // Keep for backwards compat
          velocityY: baseSpeed, // Actual physics velocity
          isGolden: !isPowerUp && rand() < 0.18,
          isPowerUp,
          powerUpType: isPowerUp ? Object.keys(HOTDOG_POWERUPS)[Math.floor(rand() * 3)] : null,
        },
      ]);
    }, interval);
    return () => clearInterval(spawn);
  }, [gamePhase, score]);

  useEffect(() => {
    if (gamePhase !== 'playing' || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Game over - transition to stats screen
          const isNewHigh = score > highScore;
          if (isNewHigh) onUpdateHighScore(score);
          sounds.gameOver();
          const stats: HotDogStats = {
            finalScore: score,
            highScore: isNewHigh ? score : highScore,
            isNewHighScore: isNewHigh,
            totalCatches: statsRef.current.totalCatches,
            goldenCatches: statsRef.current.goldenCatches,
            powerupsCollected: statsRef.current.powerupsCollected,
            maxCombo: statsRef.current.maxCombo,
            missedHotdogs: statsRef.current.missedHotdogs,
          };
          setGameStats(stats);
          onGameComplete?.(stats);
          setGamePhase('stats');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [gamePhase, timeLeft, score, highScore, onUpdateHighScore, sounds]);

  const initiateGame = () => {
    // Reset game state before countdown, using difficulty settings
    setScore(0);
    setCombo(0);
    setTimeLeft(diffSettings.time);
    setHotDogs([]);
    setActivePowerUps({});
    blazeXRef.current = 50;
    targetXRef.current = 50;
    velocityXRef.current = 0;
    setBlazeX(50);
    setParticles([]);
    setFloatingTexts([]);
    setScreenShake(null);
    lastComboMilestoneRef.current = 0;
    statsRef.current = {
      totalCatches: 0,
      goldenCatches: 0,
      powerupsCollected: 0,
      maxCombo: 0,
      missedHotdogs: 0,
    };
    setGameStats(null);
    setGamePhase('countdown');
  };

  const handleCountdownComplete = () => {
    sounds.gameStart();
    setGamePhase('playing');
  };

  const handlePlayAgain = () => {
    initiateGame();
  };

  const handleResume = () => {
    setGamePhase('playing');
  };

  const handleRestart = () => {
    initiateGame();
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: `linear-gradient(180deg, #0a2815 0%, #1a472a 30%, #2d5a27 60%, ${COLORS.texasSoil} 100%)`,
        fontFamily: 'system-ui',
        overflow: 'hidden',
        userSelect: 'none',
      }}
    >
      <ArcadeHeader title="Hot Dog Dash" onBack={onBack} showBack />
      <ScoreBar
        items={[
          { label: 'SCORE', value: score, color: COLORS.ember },
          {
            label: 'TIME',
            value: `${timeLeft}s`,
            color: timeLeft <= 10 ? COLORS.ketchup : 'white',
          },
          { label: 'COMBO', value: `×${combo}`, color: combo > 5 ? COLORS.mustard : 'white' },
          { label: 'BEST', value: highScore, color: COLORS.mustard },
        ]}
      />
      {gamePhase === 'playing' && (
        <div
          style={{
            background: 'rgba(0,0,0,0.5)',
            padding: '6px 15px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span style={{ fontSize: '14px' }}>{currentChonkLevel.emoji}</span>
          <span style={{ color: COLORS.ember, fontSize: '12px', fontWeight: 'bold' }}>
            {currentChonkLevel.label}
          </span>
        </div>
      )}
      <div
        ref={gameRef}
        onTouchMove={handleTouch}
        onTouchStart={handleTouch}
        style={{
          position: 'relative',
          height: 'calc(100vh - 150px)',
          overflow: 'hidden',
          // Screen shake effect
          transform: screenShake
            ? `translate(${calculateScreenShake(screenShake).x}px, ${calculateScreenShake(screenShake).y}px)`
            : undefined,
        }}
      >
        {combo >= 5 && gamePhase === 'playing' && (
          <div
            style={{
              position: 'absolute',
              top: '10%',
              right: '15px',
              fontSize: '28px',
              fontWeight: 'bold',
              color: COLORS.mustard,
              textShadow: '0 0 10px rgba(255,215,0,0.5)',
              animation: combo >= 10 ? 'pulse-glow 0.5s infinite' : undefined,
              zIndex: 10,
            }}
          >
            {combo}× 🔥
          </div>
        )}
        {hotDogs.map((dog) => (
          <HotDog
            key={dog.id}
            x={dog.x}
            y={dog.y}
            isGolden={dog.isGolden}
            isPowerUp={dog.isPowerUp}
            powerUpType={dog.powerUpType}
          />
        ))}
        {/* Particle effects */}
        <ParticleRenderer particles={particles} />
        <FloatingTextRenderer texts={floatingTexts} />
        <div
          style={{
            position: 'absolute',
            left: `${blazeX}%`,
            bottom: '6%',
            transform: 'translateX(-50%)',
          }}
        >
          <BlazeSprite chonkFactor={chonkFactor} isMoving={isMoving} />
        </div>
        {/* Countdown overlay */}
        {gamePhase === 'countdown' && (
          <Countdown onComplete={handleCountdownComplete} sounds={sounds} />
        )}
        {/* Pause menu */}
        {gamePhase === 'paused' && (
          <PauseMenu
            onResume={handleResume}
            onRestart={handleRestart}
            onQuit={onBack}
            sounds={sounds}
          />
        )}
        {/* Stats screen */}
        {gamePhase === 'stats' && gameStats && (
          <StatsScreen
            gameType="hotdog"
            stats={gameStats}
            onPlayAgain={handlePlayAgain}
            onBack={onBack}
            sounds={sounds}
            isDailyChallenge={isDailyChallenge}
          />
        )}
        {/* Start screen */}
        <GameOverlay visible={gamePhase === 'idle'}>
          <div style={{ fontSize: '70px', marginBottom: '12px' }}>🐕🌭</div>
          <h2 style={{ color: COLORS.burntOrange, marginBottom: '8px' }}>Hot Dog Dash</h2>
          <p style={{ color: '#aaa', marginBottom: '12px' }}>
            Catch hot dogs! Watch Blaze get chonky!
          </p>
          <DifficultySelector
            selected={difficulty}
            onSelect={setDifficulty}
            difficulties={HOTDOG_DIFFICULTIES}
          />
          <ActionButton onClick={initiateGame}>🎮 Start Game</ActionButton>
          <p style={{ color: '#555', fontSize: '11px', marginTop: '16px' }}>
            ← → or touch to move • ESC to pause
          </p>
          {highScore > 0 && (
            <p style={{ color: COLORS.mustard, fontSize: '12px', marginTop: '8px' }}>
              🏆 Best: {highScore}
            </p>
          )}
        </GameOverlay>
      </div>
    </div>
  );
};

// ============================================================================
// GAME 2: SANDLOT SLUGGER
// ============================================================================

const PITCH_TYPES: PitchType[] = [
  { name: 'Fastball', speed: 1.8, movement: 0, color: '#FF4444' },
  { name: 'Curveball', speed: 1.2, movement: 0.3, color: '#44FF44' },
  { name: 'Changeup', speed: 0.9, movement: 0.1, color: '#4444FF' },
  { name: 'Slider', speed: 1.4, movement: -0.25, color: '#FFFF44' },
];

const BATTERS: Batter[] = [
  { name: 'Blaze Jr.', power: 85, contact: 90, emoji: '🐕' },
  { name: 'Slugger Steve', power: 95, contact: 70, emoji: '💪' },
  { name: 'Quick Quinn', power: 65, contact: 95, emoji: '⚡' },
  { name: 'Big Bertha', power: 100, contact: 60, emoji: '🎯' },
];

const SandlotSluggerGame: React.FC<GameProps> = ({
  onBack,
  onUpdateHighScore,
  highScore,
  sounds,
  onGameComplete,
  isDailyChallenge,
  dailyRng,
}) => {
  const [gameState, setGameState] = useState<
    'select' | 'countdown' | 'playing' | 'paused' | 'stats'
  >('select');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>(
    isDailyChallenge ? 'normal' : 'normal'
  );
  const [selectedBatter, setSelectedBatter] = useState<number | null>(null);
  const diffSettings = SLUGGER_DIFFICULTIES[difficulty];
  // Store dailyRng in ref to maintain across renders
  const rngRef = useRef(dailyRng);
  const [score, setScore] = useState(0);
  const [outs, setOuts] = useState(0);
  const [pitch, setPitch] = useState<PitchType | null>(null);
  const [pitchY, setPitchY] = useState(-10);
  const [pitchX, setPitchX] = useState(50);
  const [swingTiming, setSwingTiming] = useState<number | null>(null);
  const [hitResult, setHitResult] = useState<HitResult | null>(null);
  const [ballFlight, setBallFlight] = useState<BallFlight | null>(null);
  const [isSwinging, setIsSwinging] = useState(false);
  const [combo, setCombo] = useState(0);
  const [totalHRs, setTotalHRs] = useState(0);
  const frameRef = useRef<number | undefined>(undefined);
  // Enhanced physics state
  const [ballRotation, setBallRotation] = useState(0);
  const [swingPhase, setSwingPhase] = useState<'ready' | 'windup' | 'swing' | 'follow'>('ready');
  const [timingIndicator, setTimingIndicator] = useState(0); // 0-100, green zone is 70-85
  const [particles, setParticles] = useState<Particle[]>([]);
  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);
  const [ballFlightProgress, setBallFlightProgress] = useState(0);
  const startPitchXRef = useRef(50);
  // Stats tracking
  const statsRef = useRef({ totalSwings: 0, hits: 0, homeRuns: 0, maxCombo: 0, strikeouts: 0 });
  const [gameStats, setGameStats] = useState<SluggerStats | null>(null);

  const throwPitch = useCallback(() => {
    // Use seeded RNG for daily challenges, regular random otherwise
    const rng = rngRef.current;
    const rand = () => (rng ? rng.next() : Math.random());

    const pitchType = PITCH_TYPES[Math.floor(rand() * PITCH_TYPES.length)];
    setPitch(pitchType);
    setPitchY(-10);
    const startX = 50 + (rand() - 0.5) * 20;
    setPitchX(startX);
    startPitchXRef.current = startX;
    setSwingTiming(null);
    setHitResult(null);
    setBallFlight(null);
    setBallFlightProgress(0);
    setIsSwinging(false);
    setBallRotation(0);
    setSwingPhase('ready');
    setTimingIndicator(0);
    sounds.pitchWhoosh();
  }, [sounds]);

  useEffect(() => {
    if (gameState !== 'playing' || !pitch) return;
    const animate = () => {
      setPitchY((prev) => {
        const newY = prev + pitch.speed * 1.5 * diffSettings.pitchSpeed;
        const progress = Math.min(1, newY / 85);

        // Parabolic drop instead of sine wave - more realistic pitch trajectory
        const dropFactor = progress * progress; // Accelerating drop
        const lateralMovement = pitch.movement * 30 * progress; // Linear lateral movement

        setPitchX(startPitchXRef.current + lateralMovement);

        // Update timing indicator (0-100 scale, green zone is 70-85)
        setTimingIndicator(Math.min(100, Math.max(0, newY)));

        // Update ball rotation (spins during flight)
        setBallRotation((r) => (r + 15) % 360);

        if (newY > 95 && !swingTiming) {
          statsRef.current.strikeouts++;
          setOuts((o) => {
            const newOuts = o + 1;
            if (newOuts >= 10) {
              // Trigger game over after a delay
              setTimeout(() => {
                const isNewHigh = score > highScore;
                if (isNewHigh) onUpdateHighScore(score);
                sounds.gameOver();
                const stats: SluggerStats = {
                  finalScore: score,
                  highScore: isNewHigh ? score : highScore,
                  isNewHighScore: isNewHigh,
                  totalSwings: statsRef.current.totalSwings,
                  hits: statsRef.current.hits,
                  homeRuns: statsRef.current.homeRuns,
                  maxCombo: statsRef.current.maxCombo,
                  strikeouts: statsRef.current.strikeouts,
                };
                setGameStats(stats);
                onGameComplete?.(stats);
                setGameState('stats');
              }, 1000);
            }
            return newOuts;
          });
          setCombo(0);
          setFloatingTexts((t) => [...t, createFloatingText(50, 60, 'STRIKE!', '#FF4444')]);
          if (outs < 9) setTimeout(() => throwPitch(), 1000);
          return 100;
        }
        return newY + dropFactor * 0.5; // Add drop effect to Y position
      });

      // Update particles
      setParticles((p) => updateParticles(p));
      setFloatingTexts((t) => updateFloatingTexts(t));

      // Animate ball flight if active
      if (ballFlight && ballFlightProgress < 1) {
        setBallFlightProgress((p) => Math.min(1, p + 0.02));
      }

      if (pitchY < 95) frameRef.current = requestAnimationFrame(animate);
    };
    frameRef.current = requestAnimationFrame(animate);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [
    gameState,
    pitch,
    pitchY,
    swingTiming,
    throwPitch,
    score,
    highScore,
    onUpdateHighScore,
    ballFlight,
    ballFlightProgress,
  ]);

  const handleSwing = useCallback(() => {
    if (
      gameState !== 'playing' ||
      !pitch ||
      swingTiming !== null ||
      isSwinging ||
      selectedBatter === null
    )
      return;

    // Use seeded RNG for daily challenges, regular random otherwise
    const rng = rngRef.current;
    const rand = () => (rng ? rng.next() : Math.random());

    // Track swing
    statsRef.current.totalSwings++;

    // Swing phases: windup -> swing -> follow
    setSwingPhase('windup');
    setTimeout(() => setSwingPhase('swing'), 50);

    setIsSwinging(true);
    const perfectZone = 75;
    const timing = (pitchY - perfectZone) / diffSettings.timingWindow;
    setSwingTiming(timing);

    // Helper to trigger game over with stats
    const doGameOver = (finalScore: number) => {
      setTimeout(() => {
        const isNewHigh = finalScore > highScore;
        if (isNewHigh) onUpdateHighScore(finalScore);
        sounds.gameOver();
        const stats: SluggerStats = {
          finalScore,
          highScore: isNewHigh ? finalScore : highScore,
          isNewHighScore: isNewHigh,
          totalSwings: statsRef.current.totalSwings,
          hits: statsRef.current.hits,
          homeRuns: statsRef.current.homeRuns,
          maxCombo: statsRef.current.maxCombo,
          strikeouts: statsRef.current.strikeouts,
        };
        setGameStats(stats);
        onGameComplete?.(stats);
        setGameState('stats');
      }, 1500);
    };

    setTimeout(() => {
      setSwingPhase('follow');
      const batter = BATTERS[selectedBatter];
      const contactRoll = rand() * 100;
      const powerRoll = rand() * 100;

      if (Math.abs(timing) > 0.5 || contactRoll > batter.contact) {
        setHitResult({ type: 'STRIKE!', points: 0, color: '#FF4444' });
        statsRef.current.strikeouts++;
        setOuts((o) => {
          const newOuts = o + 1;
          if (newOuts >= 10) doGameOver(score);
          return newOuts;
        });
        setCombo(0);
        // Swing miss particles
        setParticles((p) => [...p, ...createParticleBurst(50, 75, 'hit', 2, 0.5)]);
        sounds.batWhiff();
      } else {
        const powerFactor = (batter.power / 100) * (1 - Math.abs(timing));
        const distance = 150 + powerFactor * 350 + powerRoll * 2;

        if (Math.abs(timing) < 0.1 && powerFactor > 0.7 && distance > 400) {
          const points = Math.floor(100 + combo * 25 + (distance - 400));
          setHitResult({
            type: '💥 HOME RUN!',
            points,
            color: COLORS.mustard,
            distance: Math.floor(distance),
          });
          setScore((s) => s + points);
          setCombo((c) => {
            const newCombo = c + 1;
            if (newCombo > statsRef.current.maxCombo) statsRef.current.maxCombo = newCombo;
            return newCombo;
          });
          setTotalHRs((t) => t + 1);
          statsRef.current.hits++;
          statsRef.current.homeRuns++;
          setBallFlight({
            startX: 50,
            startY: 75,
            endX: 50 + timing * 40,
            endY: -20,
            duration: 2000,
          });
          setBallFlightProgress(0);
          // Home run explosion! 15 particles
          setParticles((p) => [...p, ...createParticleBurst(50, 75, 'homerun', 15, 1.5)]);
          setFloatingTexts((t) => [...t, createFloatingText(50, 65, '💥 GONE!', COLORS.mustard)]);
          sounds.homeRun();
        } else if (distance > 350) {
          setHitResult({
            type: 'DEEP FLY OUT',
            points: 10,
            color: '#88FF88',
            distance: Math.floor(distance),
          });
          setScore((s) => s + 10);
          setOuts((o) => {
            const newOuts = o + 1;
            if (newOuts >= 10) doGameOver(score + 10);
            return newOuts;
          });
          setCombo(0);
          setBallFlight({
            startX: 50,
            startY: 75,
            endX: 50 + timing * 30,
            endY: 20,
            duration: 1500,
          });
          setBallFlightProgress(0);
          // Deep fly particles
          setParticles((p) => [...p, ...createParticleBurst(50, 75, 'hit', 6, 1.0)]);
          sounds.batCrack();
        } else if (distance > 200) {
          const points = 25 + combo * 5;
          setHitResult({ type: 'BASE HIT!', points, color: '#44FF44' });
          setScore((s) => s + points);
          statsRef.current.hits++;
          setBallFlight({
            startX: 50,
            startY: 75,
            endX: 50 + timing * 25,
            endY: 45,
            duration: 1000,
          });
          setBallFlightProgress(0);
          // Base hit particles
          setParticles((p) => [...p, ...createParticleBurst(50, 75, 'hit', 4, 0.8)]);
          setFloatingTexts((t) => [...t, createFloatingText(50, 70, `+${points}`, '#44FF44')]);
          sounds.baseHit();
        } else {
          setHitResult({ type: 'GROUNDER', points: 5, color: '#AAAAAA' });
          setScore((s) => s + 5);
          setOuts((o) => {
            const newOuts = o + 1;
            if (newOuts >= 10) doGameOver(score + 5);
            return newOuts;
          });
          setCombo(0);
          // Weak contact particles
          setParticles((p) => [...p, ...createParticleBurst(50, 75, 'hit', 3, 0.5)]);
          sounds.batCrack();
        }
      }
      setTimeout(() => {
        if (outs < 9) throwPitch();
        setIsSwinging(false);
        setSwingPhase('ready');
      }, 2000);
    }, 150);
  }, [
    gameState,
    pitch,
    swingTiming,
    pitchY,
    selectedBatter,
    isSwinging,
    combo,
    outs,
    score,
    highScore,
    onUpdateHighScore,
    throwPitch,
    sounds,
  ]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (gameState === 'playing') setGameState('paused');
        else if (gameState === 'paused') setGameState('playing');
        return;
      }
      if (gameState !== 'playing') return;
      if (e.code === 'Space') {
        e.preventDefault();
        handleSwing();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [gameState, handleSwing]);

  const initiateGame = (batterIndex: number) => {
    setSelectedBatter(batterIndex);
    setScore(0);
    setOuts(0);
    setCombo(0);
    setTotalHRs(0);
    setParticles([]);
    setFloatingTexts([]);
    setBallRotation(0);
    setSwingPhase('ready');
    setTimingIndicator(0);
    statsRef.current = { totalSwings: 0, hits: 0, homeRuns: 0, maxCombo: 0, strikeouts: 0 };
    setGameStats(null);
    setGameState('countdown');
  };

  const handleCountdownComplete = () => {
    sounds.gameStart();
    setGameState('playing');
    setTimeout(() => throwPitch(), 500);
  };

  const triggerGameOver = () => {
    const isNewHigh = score > highScore;
    if (isNewHigh) onUpdateHighScore(score);
    sounds.gameOver();
    const stats: SluggerStats = {
      finalScore: score,
      highScore: isNewHigh ? score : highScore,
      isNewHighScore: isNewHigh,
      totalSwings: statsRef.current.totalSwings,
      hits: statsRef.current.hits,
      homeRuns: statsRef.current.homeRuns,
      maxCombo: statsRef.current.maxCombo,
      strikeouts: statsRef.current.strikeouts,
    };
    setGameStats(stats);
    onGameComplete?.(stats);
    setGameState('stats');
  };

  const handlePlayAgain = () => {
    setGameState('select');
  };

  const handleResume = () => {
    setGameState('playing');
  };

  const handleRestart = () => {
    if (selectedBatter !== null) initiateGame(selectedBatter);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: `linear-gradient(180deg, ${COLORS.sky} 0%, #5BA3D9 40%, ${COLORS.grass} 40%, #1B5E20 100%)`,
        fontFamily: 'system-ui',
        overflow: 'hidden',
        userSelect: 'none',
      }}
    >
      <ArcadeHeader title="Sandlot Slugger" onBack={onBack} showBack />
      {gameState !== 'select' && (
        <ScoreBar
          items={[
            { label: 'SCORE', value: score, color: COLORS.ember },
            { label: 'OUTS', value: `${outs}/10`, color: outs >= 7 ? COLORS.ketchup : 'white' },
            { label: 'HRs', value: totalHRs, color: COLORS.mustard },
            { label: 'COMBO', value: `×${combo}`, color: combo > 0 ? COLORS.mustard : 'white' },
          ]}
        />
      )}
      <div
        style={{
          position: 'relative',
          height: gameState === 'select' ? 'calc(100vh - 60px)' : 'calc(100vh - 130px)',
          overflow: 'hidden',
        }}
        onClick={gameState === 'playing' ? handleSwing : undefined}
        onTouchStart={gameState === 'playing' ? handleSwing : undefined}
      >
        {gameState === 'select' && (
          <div style={{ padding: '30px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: '64px', marginBottom: '10px' }}>⚾</div>
            <h2 style={{ color: COLORS.charcoal, marginBottom: '8px' }}>Choose Your Slugger!</h2>
            <p style={{ color: '#555', marginBottom: '16px', fontSize: '14px' }}>
              10 outs per round. Swing for the fences!
            </p>
            <DifficultySelector
              game="slugger"
              difficulty={difficulty}
              onSelect={setDifficulty}
              difficulties={SLUGGER_DIFFICULTIES}
            />
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '12px',
                justifyContent: 'center',
                maxWidth: '400px',
                margin: '0 auto',
              }}
            >
              {BATTERS.map((batter, i) => (
                <button
                  key={i}
                  onClick={() => initiateGame(i)}
                  style={{
                    background: 'white',
                    border: `3px solid ${COLORS.texasSoil}`,
                    borderRadius: '12px',
                    padding: '16px',
                    cursor: 'pointer',
                    width: '150px',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: '36px', marginBottom: '8px' }}>{batter.emoji}</div>
                  <div style={{ fontWeight: 'bold', color: COLORS.charcoal }}>{batter.name}</div>
                  <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
                    PWR: {batter.power} | CON: {batter.contact}
                  </div>
                </button>
              ))}
            </div>
            {highScore > 0 && (
              <p style={{ marginTop: '24px', color: COLORS.mustard }}>🏆 Best Score: {highScore}</p>
            )}
            <p style={{ color: '#888', fontSize: '11px', marginTop: '12px' }}>
              SPACE or TAP to swing • ESC to pause
            </p>
          </div>
        )}

        {/* Countdown overlay */}
        {gameState === 'countdown' && (
          <Countdown onComplete={handleCountdownComplete} sounds={sounds} />
        )}

        {gameState === 'playing' && (
          <>
            {/* Outfield fence */}
            <div
              style={{
                position: 'absolute',
                top: '15%',
                left: '10%',
                right: '10%',
                height: '4px',
                background: '#8B4513',
                borderRadius: '2px',
              }}
            />

            {/* Pitch type indicator */}
            {pitch && (
              <div
                style={{
                  position: 'absolute',
                  top: '5%',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: 'rgba(0,0,0,0.7)',
                  padding: '4px 12px',
                  borderRadius: '8px',
                  color: pitch.color,
                  fontWeight: 'bold',
                  fontSize: '14px',
                }}
              >
                {pitch.name}
              </div>
            )}

            {/* Timing zone indicator - glows green in sweet spot */}
            <div
              style={{
                position: 'absolute',
                left: '50%',
                top: '70%',
                transform: 'translate(-50%, -50%)',
                width: '80px',
                height: '100px',
                border: `3px solid ${timingIndicator >= 70 && timingIndicator <= 85 ? 'rgba(0,255,0,0.7)' : 'rgba(255,255,255,0.3)'}`,
                borderRadius: '4px',
                boxShadow:
                  timingIndicator >= 70 && timingIndicator <= 85
                    ? '0 0 20px rgba(0,255,0,0.5), inset 0 0 15px rgba(0,255,0,0.2)'
                    : 'none',
                transition: 'border-color 0.1s, box-shadow 0.1s',
              }}
            />

            {/* Spinning baseball with seams during pitch */}
            {pitch && pitchY < 95 && !ballFlight && (
              <div
                style={{
                  position: 'absolute',
                  left: `${pitchX}%`,
                  top: `${pitchY}%`,
                  transform: `translate(-50%, -50%) rotate(${ballRotation}deg)`,
                  width: '24px',
                  height: '24px',
                  background: 'radial-gradient(circle at 30% 30%, white, #ddd)',
                  borderRadius: '50%',
                  boxShadow: '2px 2px 4px rgba(0,0,0,0.3)',
                  overflow: 'hidden',
                }}
              >
                {/* Baseball seams */}
                <div
                  style={{
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    border: '2px solid transparent',
                    borderTopColor: '#cc0000',
                    borderBottomColor: '#cc0000',
                    transform: 'rotate(45deg)',
                  }}
                />
              </div>
            )}

            {/* Ball flight animation after hit */}
            {ballFlight && ballFlightProgress < 1 && (
              <div
                style={{
                  position: 'absolute',
                  left: `${ballFlight.startX + (ballFlight.endX - ballFlight.startX) * ballFlightProgress}%`,
                  top: `${ballFlight.startY + (ballFlight.endY - ballFlight.startY) * ballFlightProgress - Math.sin(ballFlightProgress * Math.PI) * 30}%`,
                  transform: `translate(-50%, -50%) rotate(${ballFlightProgress * 720}deg) scale(${1 - ballFlightProgress * 0.5})`,
                  width: '20px',
                  height: '20px',
                  background: 'radial-gradient(circle at 30% 30%, white, #ddd)',
                  borderRadius: '50%',
                  boxShadow: '2px 2px 4px rgba(0,0,0,0.3)',
                }}
              />
            )}

            {/* Batter with swing phases */}
            <div
              style={{
                position: 'absolute',
                left: '50%',
                top: '82%',
                transform: `translateX(-50%) ${swingPhase === 'windup' ? 'rotate(5deg)' : swingPhase === 'follow' ? 'rotate(-10deg)' : ''}`,
                fontSize: '50px',
                transition: 'transform 0.05s',
                transformOrigin: 'bottom center',
              }}
            >
              {selectedBatter !== null ? BATTERS[selectedBatter].emoji : '🧑'}
            </div>

            {/* Bat with swing animation phases */}
            <div
              style={{
                position: 'absolute',
                left: '58%',
                top: '78%',
                width: '60px',
                height: '8px',
                background: 'linear-gradient(90deg, #8B4513 0%, #D2691E 80%, #A0522D 100%)',
                borderRadius: '0 4px 4px 0',
                transformOrigin: 'left center',
                transform:
                  swingPhase === 'ready'
                    ? 'rotate(45deg)'
                    : swingPhase === 'windup'
                      ? 'rotate(60deg)'
                      : swingPhase === 'swing'
                        ? 'rotate(-90deg)'
                        : 'rotate(-60deg)', // follow
                transition: swingPhase === 'swing' ? 'transform 0.08s ease-out' : 'transform 0.1s',
              }}
            />

            {/* Particles */}
            <ParticleRenderer particles={particles} />
            <FloatingTextRenderer texts={floatingTexts} />

            {/* Hit result overlay */}
            {hitResult && (
              <div
                style={{
                  position: 'absolute',
                  top: '40%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  background: 'rgba(0,0,0,0.85)',
                  padding: '20px 40px',
                  borderRadius: '16px',
                  textAlign: 'center',
                  animation: 'popIn 0.3s ease-out',
                }}
              >
                <div
                  style={{
                    fontSize: '28px',
                    fontWeight: 'bold',
                    color: hitResult.color,
                    marginBottom: '8px',
                  }}
                >
                  {hitResult.type}
                </div>
                {hitResult.distance && (
                  <div style={{ color: '#aaa', fontSize: '14px' }}>{hitResult.distance} feet</div>
                )}
                {hitResult.points > 0 && (
                  <div style={{ color: COLORS.ember, fontSize: '20px', marginTop: '8px' }}>
                    +{hitResult.points}
                  </div>
                )}
              </div>
            )}

            {/* Instructions */}
            <div
              style={{
                position: 'absolute',
                bottom: '5%',
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'rgba(0,0,0,0.6)',
                padding: '8px 16px',
                borderRadius: '8px',
                color: 'white',
                fontSize: '14px',
                textAlign: 'center',
              }}
            >
              <div>TAP or SPACE to swing!</div>
              {timingIndicator >= 70 && timingIndicator <= 85 && (
                <div style={{ color: '#44FF44', fontSize: '12px' }}>⚡ NOW!</div>
              )}
            </div>
          </>
        )}

        {/* Pause menu */}
        {gameState === 'paused' && (
          <PauseMenu
            onResume={handleResume}
            onRestart={handleRestart}
            onQuit={onBack}
            sounds={sounds}
          />
        )}

        {/* Stats screen */}
        {gameState === 'stats' && gameStats && (
          <StatsScreen
            gameType="slugger"
            stats={gameStats}
            onPlayAgain={handlePlayAgain}
            onBack={onBack}
            sounds={sounds}
            isDailyChallenge={isDailyChallenge}
          />
        )}
      </div>
      <style>{`
        @keyframes popIn { 0% { transform: translate(-50%, -50%) scale(0); opacity: 0; } 50% { transform: translate(-50%, -50%) scale(1.1); } 100% { transform: translate(-50%, -50%) scale(1); opacity: 1; } }
        @keyframes ballSpin { 0% { transform: translate(-50%, -50%) rotate(0deg); } 100% { transform: translate(-50%, -50%) rotate(360deg); } }
        @keyframes pulseGlow { 0%, 100% { box-shadow: 0 0 10px rgba(255,215,0,0.5); } 50% { box-shadow: 0 0 25px rgba(255,215,0,0.9); } }
        @keyframes swingArc { 0% { transform: rotate(45deg); } 30% { transform: rotate(60deg); } 100% { transform: rotate(-90deg); } }
      `}</style>
    </div>
  );
};

// ============================================================================
// GAME 3: GRIDIRON BLITZ
// ============================================================================

const OFFENSIVE_PLAYS: OffensivePlay[] = [
  { name: 'Hail Mary', icon: '🎯', type: 'pass', distance: 'long', risk: 0.35, desc: 'Deep bomb' },
  {
    name: 'Slant Route',
    icon: '↗️',
    type: 'pass',
    distance: 'short',
    risk: 0.75,
    desc: 'Quick pass',
  },
  { name: 'Power Run', icon: '💪', type: 'run', distance: 'short', risk: 0.65, desc: 'Up the gut' },
  {
    name: 'Screen Pass',
    icon: '🛡️',
    type: 'pass',
    distance: 'short',
    risk: 0.7,
    desc: 'Behind line',
  },
  { name: 'Deep Post', icon: '📮', type: 'pass', distance: 'medium', risk: 0.5, desc: 'Downfield' },
  { name: 'Draw Play', icon: '🎭', type: 'run', distance: 'medium', risk: 0.55, desc: 'Fake pass' },
  { name: 'Out Route', icon: '➡️', type: 'pass', distance: 'medium', risk: 0.6, desc: 'Sideline' },
  { name: 'Sweep', icon: '🏃', type: 'run', distance: 'medium', risk: 0.5, desc: 'Outside run' },
  {
    name: 'Play Action',
    icon: '🎬',
    type: 'pass',
    distance: 'long',
    risk: 0.45,
    desc: 'Fake & throw',
  },
  {
    name: 'QB Sneak',
    icon: '🐍',
    type: 'run',
    distance: 'short',
    risk: 0.8,
    desc: 'Short yardage',
  },
];

const DEFENSIVE_PLAYS: DefensivePlay[] = [
  { name: 'All-Out Blitz', icon: '⚡', type: 'blitz', counters: ['pass'], desc: 'Max rush' },
  { name: 'Zone Cover', icon: '🏰', type: 'zone', counters: ['run', 'pass'], desc: 'Area defense' },
  { name: 'Man Cover', icon: '👤', type: 'man', counters: ['pass'], desc: '1-on-1' },
  { name: 'Run Stuff', icon: '🧱', type: 'stuff', counters: ['run'], desc: 'Load the box' },
  { name: 'Prevent', icon: '🛑', type: 'prevent', counters: ['pass'], desc: 'Deep zone' },
  { name: 'Nickel', icon: '🪙', type: 'nickel', counters: ['pass'], desc: 'Extra DB' },
  { name: 'Goal Line', icon: '🎯', type: 'goalline', counters: ['run'], desc: 'Short D' },
  { name: 'QB Spy', icon: '🕵️', type: 'spy', counters: ['run', 'pass'], desc: 'Contain QB' },
  { name: 'Cover 2', icon: '✌️', type: 'cover2', counters: ['pass'], desc: 'Split safety' },
  { name: 'Press', icon: '🤜', type: 'press', counters: ['pass'], desc: 'Jam WRs' },
];

const SPECIAL_TEAMS: SpecialTeamsPlay[] = [
  { name: 'Field Goal', icon: '🥅', type: 'fg', desc: '3 points' },
  { name: 'Punt', icon: '🦶', type: 'punt', desc: 'Flip field' },
  { name: 'Go For It!', icon: '🎲', type: 'goforit', desc: '4th down try' },
];

const TEAMS: Team[] = [
  { name: 'Blaze Hounds', emoji: '🐕', color: COLORS.burntOrange, offense: 85, defense: 75 },
  { name: 'TX Longshots', emoji: '🤘', color: '#BF5700', offense: 80, defense: 80 },
  { name: 'Grit City', emoji: '💪', color: '#1A472A', offense: 70, defense: 90 },
  { name: 'Air Raiders', emoji: '✈️', color: '#4169E1', offense: 95, defense: 65 },
];

const GridironBlitzGame: React.FC<GameProps> = ({
  onBack,
  onUpdateHighScore,
  highScore,
  sounds,
  onGameComplete,
  isDailyChallenge,
  dailyRng,
}) => {
  const [gamePhase, setGamePhase] = useState<
    'teamSelect' | 'countdown' | 'play' | 'paused' | 'halftime' | 'stats'
  >('teamSelect');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>(
    isDailyChallenge ? 'normal' : 'normal'
  );
  const diffSettings = FOOTBALL_DIFFICULTIES[difficulty];
  // Store dailyRng in ref to maintain across renders
  const rngRef = useRef(dailyRng);
  const [playerTeam, setPlayerTeam] = useState<Team | null>(null);
  const [cpuTeam, setCpuTeam] = useState<Team | null>(null);
  const [playerScore, setPlayerScore] = useState(0);
  const [cpuScore, setCpuScore] = useState(0);
  const [quarter, setQuarter] = useState(1);
  const [timeLeft, setTimeLeft] = useState(60); // Will be set by difficulty on game start
  const [possession, setPossession] = useState<'player' | 'cpu'>('player');
  const [ballPosition, setBallPosition] = useState(20);
  const [down, setDown] = useState(1);
  const [yardsToGo, setYardsToGo] = useState(10);
  const [lineOfScrimmage, setLineOfScrimmage] = useState(20);
  const [playResult, setPlayResult] = useState<PlayResult | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [turboMeter, setTurboMeter] = useState(100);
  const [showPlaybook, setShowPlaybook] = useState(true);
  const [playbookTab, setPlaybookTab] = useState<'plays' | 'special'>('plays');
  // Enhanced animation state
  const [particles, setParticles] = useState<Particle[]>([]);
  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);
  const [ballAnimation, setBallAnimation] = useState<BallAnimation | null>(null);
  const [turboFlash, setTurboFlash] = useState(false);
  const [receiverPositions] = useState(() => [
    { x: 70, y: 30 },
    { x: 75, y: 60 },
    { x: 65, y: 80 },
  ]);
  const animFrameRef = useRef<number | undefined>(undefined);
  // Stats tracking
  const statsRef = useRef({
    touchdowns: 0,
    fieldGoals: 0,
    turnoversForced: 0,
    turnoversLost: 0,
    bigPlays: 0,
  });
  const [gameStats, setGameStats] = useState<FootballStats | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const resetDrive = useCallback((team: 'player' | 'cpu', startPos = 25) => {
    setPossession(team);
    setBallPosition(startPos);
    setLineOfScrimmage(startPos);
    setDown(1);
    setYardsToGo(10);
    setShowPlaybook(true);
    setPlaybookTab('plays');
    setBallAnimation(null);
  }, []);

  // Animation loop for particles and ball animation
  useEffect(() => {
    if (gamePhase !== 'play') return;

    const animate = () => {
      setParticles((p) => updateParticles(p));
      setFloatingTexts((t) => updateFloatingTexts(t));

      // Update ball animation progress
      if (ballAnimation && ballAnimation.active) {
        setBallAnimation((prev) => {
          if (!prev || prev.progress >= 1) return null;
          return {
            ...prev,
            progress: Math.min(1, prev.progress + 0.03),
            rotation: (prev.rotation + 20) % 360,
          };
        });
      }

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [gamePhase, ballAnimation]);

  useEffect(() => {
    if (gamePhase !== 'play' || isAnimating) return;
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        // Clock warning under 10 seconds
        if (prev <= 10 && prev > 1) {
          sounds.clockWarning();
        }
        if (prev <= 1) {
          if (quarter < 4) {
            setQuarter((q) => q + 1);
            if (quarter === 2) {
              setGamePhase('halftime');
              return 60;
            }
            resetDrive(possession === 'player' ? 'cpu' : 'player', 25);
            return 60;
          } else {
            // Game over - transition to stats screen
            const isNewHigh = playerScore > highScore;
            if (isNewHigh) onUpdateHighScore(playerScore);
            sounds.gameOver();
            const stats: FootballStats = {
              finalScore: playerScore,
              opponentScore: cpuScore,
              highScore: isNewHigh ? playerScore : highScore,
              isNewHighScore: isNewHigh,
              touchdowns: statsRef.current.touchdowns,
              fieldGoals: statsRef.current.fieldGoals,
              turnoversForced: statsRef.current.turnoversForced,
              turnoversLost: statsRef.current.turnoversLost,
              bigPlays: statsRef.current.bigPlays,
            };
            setGameStats(stats);
            onGameComplete?.(stats);
            setGamePhase('stats');
            return 0;
          }
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [
    gamePhase,
    quarter,
    isAnimating,
    playerScore,
    cpuScore,
    highScore,
    onUpdateHighScore,
    possession,
    resetDrive,
    sounds,
  ]);

  const selectedTeamRef = useRef<number>(0);

  const initiateGame = (teamIndex: number) => {
    // Use seeded RNG for daily challenges, regular random otherwise
    const rng = rngRef.current;
    const rand = () => (rng ? rng.next() : Math.random());

    selectedTeamRef.current = teamIndex;
    setPlayerTeam(TEAMS[teamIndex]);
    const cpuIndex = (teamIndex + 1 + Math.floor(rand() * 3)) % 4;
    setCpuTeam(TEAMS[cpuIndex]);
    setPlayerScore(0);
    setCpuScore(0);
    setQuarter(1);
    setTimeLeft(diffSettings.quarterTime);
    setTurboMeter(100);
    setParticles([]);
    setFloatingTexts([]);
    setBallAnimation(null);
    setTurboFlash(false);
    statsRef.current = {
      touchdowns: 0,
      fieldGoals: 0,
      turnoversForced: 0,
      turnoversLost: 0,
      bigPlays: 0,
    };
    setGameStats(null);
    resetDrive('player', 25);
    setGamePhase('countdown');
  };

  const handleCountdownComplete = () => {
    sounds.gameStart();
    setGamePhase('play');
  };

  const handlePlayAgain = () => {
    setGamePhase('teamSelect');
  };

  const handleResume = () => {
    setGamePhase('play');
  };

  const handleRestart = () => {
    initiateGame(selectedTeamRef.current);
  };

  // ESC key for pause
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (gamePhase === 'play') setGamePhase('paused');
        else if (gamePhase === 'paused') setGamePhase('play');
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [gamePhase]);

  const executePlay = (
    play: OffensivePlay | DefensivePlay | SpecialTeamsPlay,
    isSpecialTeams = false
  ) => {
    if (isAnimating || !playerTeam || !cpuTeam) return;
    setShowPlaybook(false);
    setIsAnimating(true);

    // Use seeded RNG for daily challenges, regular random otherwise
    const rng = rngRef.current;
    const rand = () => (rng ? rng.next() : Math.random());

    const isPlayerOffense = possession === 'player';
    const offenseTeam = isPlayerOffense ? playerTeam : cpuTeam;
    const defenseTeam = isPlayerOffense ? cpuTeam : playerTeam;

    // Handle special teams
    if (isSpecialTeams && 'type' in play) {
      if (play.type === 'fg') {
        const distance = 100 - ballPosition + 17;
        const makePct = Math.max(0.2, 1 - (distance - 20) * 0.02);

        // Start FG animation - parabolic arc
        setBallAnimation({
          active: true,
          startX: ballPosition,
          startY: 50,
          endX: 100,
          endY: 20,
          progress: 0,
          type: 'fg',
          rotation: 0,
        });

        setTimeout(() => {
          if (rand() < makePct) {
            setPlayResult({ text: '🥅 FIELD GOAL IS GOOD! +3', color: COLORS.mustard });
            if (isPlayerOffense) {
              setPlayerScore((s) => s + 3);
              statsRef.current.fieldGoals++;
            } else setCpuScore((s) => s + 3);
            // Success particles
            setParticles((p) => [...p, ...createParticleBurst(95, 30, 'fieldgoal', 8, 1.2)]);
            setFloatingTexts((t) => [...t, createFloatingText(95, 25, '+3!', COLORS.mustard)]);
            sounds.fieldGoal();
          } else {
            setPlayResult({
              text: '❌ NO GOOD! Wide ' + (rand() > 0.5 ? 'left' : 'right'),
              color: COLORS.ketchup,
            });
            sounds.fieldGoalMiss();
          }

          setTimeout(() => {
            resetDrive(isPlayerOffense ? 'cpu' : 'player', 25);
            setPlayResult(null);
            setIsAnimating(false);
          }, 2000);
        }, 1200);
        return;
      }

      if (play.type === 'punt') {
        setTimeout(() => {
          const puntYards = 35 + Math.floor(rand() * 20);
          const newPos = Math.max(5, Math.min(95, 100 - (ballPosition + puntYards)));
          setPlayResult({ text: `🦶 Punt for ${puntYards} yards!`, color: '#88FF88' });

          setTimeout(() => {
            resetDrive(isPlayerOffense ? 'cpu' : 'player', newPos);
            setPlayResult(null);
            setIsAnimating(false);
          }, 1500);
        }, 800);
        return;
      }
    }

    // CPU picks defense (or offense if defending) - smarter based on difficulty
    let cpuPlay: DefensivePlay | OffensivePlay;
    if (isPlayerOffense) {
      // CPU on defense - use cpuSmarts to pick smarter counters
      const smartChance = diffSettings.cpuSmarts * 0.3; // 0%, 30%, 60%, 90%
      if (rand() < smartChance) {
        // Smart pick: guess run vs pass based on down/distance
        const likelyRun = yardsToGo <= 3 || down === 4;
        const likelyPass = yardsToGo >= 8 || (timeLeft < 30 && quarter >= 3);
        const counterType = likelyRun ? 'run' : likelyPass ? 'pass' : rand() < 0.5 ? 'run' : 'pass';
        const counterPlays = DEFENSIVE_PLAYS.filter((p) => p.counters?.includes(counterType));
        cpuPlay =
          counterPlays.length > 0
            ? counterPlays[Math.floor(rand() * counterPlays.length)]
            : DEFENSIVE_PLAYS[Math.floor(rand() * DEFENSIVE_PLAYS.length)];
      } else {
        cpuPlay = DEFENSIVE_PLAYS[Math.floor(rand() * DEFENSIVE_PLAYS.length)];
      }
    } else {
      // CPU on offense - use cpuSmarts to pick better plays
      const smartChance = diffSettings.cpuSmarts * 0.25;
      if (rand() < smartChance) {
        // Smart pick: short yardage = low risk run, long yardage = pass
        const preferRun = yardsToGo <= 4;
        const smartPlays = OFFENSIVE_PLAYS.filter((p) =>
          preferRun ? p.type === 'run' : p.type === 'pass'
        );
        cpuPlay =
          smartPlays.length > 0
            ? smartPlays[Math.floor(rand() * smartPlays.length)]
            : OFFENSIVE_PLAYS[Math.floor(rand() * OFFENSIVE_PLAYS.length)];
      } else {
        cpuPlay = OFFENSIVE_PLAYS[Math.floor(rand() * OFFENSIVE_PLAYS.length)];
      }
    }

    setTimeout(() => {
      let yards = 0;
      let resultText = '';
      let resultColor = 'white';
      let isTurnover = false;

      if (isPlayerOffense && 'risk' in play) {
        const offPlay = play as OffensivePlay;
        const defPlay = cpuPlay as DefensivePlay;
        const baseSuccess = offPlay.risk + (offenseTeam.offense - defenseTeam.defense) / 200;
        const countered = defPlay.counters && defPlay.counters.includes(offPlay.type);
        const successChance = countered ? baseSuccess * 0.5 : baseSuccess;

        if (rand() < successChance) {
          if (offPlay.distance === 'long') yards = 25 + Math.floor(rand() * 35);
          else if (offPlay.distance === 'medium') yards = 10 + Math.floor(rand() * 15);
          else yards = 3 + Math.floor(rand() * 8);

          if (turboMeter > 50 && rand() < 0.25) {
            yards = Math.floor(yards * 1.5);
            resultText = '🔥 TURBO! ';
            setTurboMeter((t) => Math.max(0, t - 30));
            // Trigger turbo flash effect
            setTurboFlash(true);
            setTimeout(() => setTurboFlash(false), 600);
          }

          // Start ball animation for the play
          setBallAnimation({
            active: true,
            startX: ballPosition,
            startY: 50,
            endX: Math.min(99, ballPosition + yards),
            endY: 50,
            progress: 0,
            type: offPlay.type === 'pass' ? 'pass' : 'run',
            rotation: 0,
          });

          if (yards > 20) {
            resultText += `💥 BIG PLAY! +${yards} yards!`;
            resultColor = COLORS.mustard;
            sounds.bigPlay();
          } else {
            resultText += `Gain of ${yards} yards`;
            resultColor = '#88FF88';
            sounds.snap();
          }
        } else {
          if (countered && defPlay.type === 'blitz' && offPlay.type === 'pass') {
            yards = -8;
            resultText = '💀 SACKED! -8 yards!';
            resultColor = COLORS.ketchup;
            sounds.turnover();
          } else if (rand() < 0.12) {
            isTurnover = true;
            resultText = offPlay.type === 'pass' ? '🏈 INTERCEPTED!' : '🏈 FUMBLE!';
            resultColor = COLORS.ketchup;
            sounds.turnover();
          } else {
            yards = offPlay.type === 'run' ? Math.floor(rand() * 3) : 0;
            resultText = yards > 0 ? `Short gain, ${yards} yards` : 'No gain';
            resultColor = '#AAAAAA';
          }
        }
      } else if (!isPlayerOffense && 'counters' in play) {
        const cpuOffensePlay = cpuPlay as OffensivePlay;
        const playerDefensePlay = play as DefensivePlay;

        const baseSuccess = cpuOffensePlay.risk + (cpuTeam.offense - playerTeam.defense) / 200;
        const countered =
          playerDefensePlay.counters && playerDefensePlay.counters.includes(cpuOffensePlay.type);
        const successChance = countered ? baseSuccess * 0.4 : baseSuccess;

        if (rand() < successChance) {
          if (cpuOffensePlay.distance === 'long') yards = 20 + Math.floor(rand() * 30);
          else if (cpuOffensePlay.distance === 'medium') yards = 8 + Math.floor(rand() * 12);
          else yards = 2 + Math.floor(rand() * 6);
          resultText = `${cpuTeam.emoji} gains ${yards} yards`;
          resultColor = '#FFAA88';
        } else {
          if (countered) {
            if (playerDefensePlay.type === 'blitz' && cpuOffensePlay.type === 'pass') {
              yards = -7;
              resultText = '⚡ SACK! Great call!';
              resultColor = COLORS.mustard;
              sounds.bigPlay();
            } else if (rand() < 0.18) {
              isTurnover = true;
              resultText = '🎉 TURNOVER! Ball is yours!';
              resultColor = COLORS.mustard;
              sounds.bigPlay();
            } else {
              yards = 0;
              resultText = 'STUFFED! No gain!';
              resultColor = '#88FF88';
              sounds.snap();
            }
          } else {
            yards = Math.floor(rand() * 3);
            resultText = yards > 0 ? `${cpuTeam.emoji} gains ${yards}` : 'Stopped for no gain';
            resultColor = '#AAAAAA';
          }
        }
      }

      setPlayResult({ text: resultText, color: resultColor, cpuPlay: cpuPlay.name });

      setTimeout(() => {
        if (isTurnover) {
          const newPos = 100 - ballPosition;
          resetDrive(possession === 'player' ? 'cpu' : 'player', newPos);
          setPlayResult(null);
          setIsAnimating(false);
          return;
        }

        const newPosition = ballPosition + yards;

        if (newPosition >= 100) {
          const scoringTeam = possession;
          if (scoringTeam === 'player') {
            setPlayerScore((s) => s + 7);
            setPlayResult({ text: '🏈 TOUCHDOWN! +7', color: COLORS.mustard });
            // TD celebration particles - 20 particle burst!
            setParticles((p) => [...p, ...createParticleBurst(95, 50, 'touchdown', 20, 1.5)]);
            setFloatingTexts((t) => [
              ...t,
              createFloatingText(95, 40, 'TOUCHDOWN!', COLORS.mustard),
            ]);
            sounds.touchdown();
            statsRef.current.touchdowns++;
          } else {
            setCpuScore((s) => s + 7);
            setPlayResult({ text: `😱 ${cpuTeam.emoji} Touchdown! +7`, color: COLORS.ketchup });
            sounds.turnover(); // CPU touchdown feels like a turnover to the player
          }

          setTimeout(() => {
            resetDrive(scoringTeam === 'player' ? 'cpu' : 'player', 25);
            setTurboMeter((t) => Math.min(100, t + 25));
            setPlayResult(null);
            setIsAnimating(false);
          }, 2000);
          return;
        }

        if (newPosition <= 0) {
          const scoringTeam = possession === 'player' ? 'cpu' : 'player';
          if (scoringTeam === 'player') {
            setPlayerScore((s) => s + 2);
            setPlayResult({ text: '🛡️ SAFETY! +2', color: COLORS.mustard });
          } else {
            setCpuScore((s) => s + 2);
            setPlayResult({ text: `😬 Safety! ${cpuTeam.emoji} +2`, color: COLORS.ketchup });
          }

          setTimeout(() => {
            resetDrive(possession, 20);
            setPlayResult(null);
            setIsAnimating(false);
          }, 2000);
          return;
        }

        setBallPosition(Math.max(1, Math.min(99, newPosition)));
        const yardsGained = newPosition - lineOfScrimmage;

        if (yardsGained >= yardsToGo) {
          setDown(1);
          setYardsToGo(10);
          setLineOfScrimmage(newPosition);
          if (!playResult?.text?.includes('TURBO') && !playResult?.text?.includes('BIG PLAY')) {
            setPlayResult((prev) =>
              prev ? { ...prev, text: prev.text + ' - FIRST DOWN!' } : null
            );
          }
        } else {
          const newDown = down + 1;
          if (newDown > 4) {
            setPlayResult({ text: 'TURNOVER ON DOWNS!', color: COLORS.ketchup });
            setTimeout(() => {
              resetDrive(possession === 'player' ? 'cpu' : 'player', 100 - newPosition);
              setPlayResult(null);
              setIsAnimating(false);
            }, 1500);
            return;
          }
          setDown(newDown);
          setYardsToGo(Math.max(1, yardsToGo - yards));
        }

        setTurboMeter((t) => Math.min(100, t + 5));

        setTimeout(() => {
          setPlayResult(null);
          setIsAnimating(false);
          setShowPlaybook(true);
          setPlaybookTab('plays');
        }, 1500);
      }, 1200);
    }, 800);
  };

  const renderField = () => {
    // Calculate animated ball position for FG and pass animations
    const getBallDisplayPosition = () => {
      if (ballAnimation && ballAnimation.active) {
        const progress = ballAnimation.progress;
        const x = ballAnimation.startX + (ballAnimation.endX - ballAnimation.startX) * progress;
        // Arc height for passes and FG
        const arcHeight =
          ballAnimation.type === 'fg'
            ? Math.sin(progress * Math.PI) * 40
            : ballAnimation.type === 'pass'
              ? Math.sin(progress * Math.PI) * 25
              : 0;
        const y = ballAnimation.startY - arcHeight;
        return { x, y, rotation: ballAnimation.rotation };
      }
      return { x: ballPosition, y: 50, rotation: 0 };
    };

    const ballDisplay = getBallDisplayPosition();

    return (
      <div
        style={{
          position: 'relative',
          height: '180px',
          margin: '10px',
          background: `linear-gradient(90deg,
          ${possession === 'player' ? COLORS.ketchup : COLORS.mustard}44 0%,
          ${possession === 'player' ? COLORS.ketchup : COLORS.mustard}44 10%,
          ${COLORS.grass} 10%, ${COLORS.grass} 90%,
          ${possession === 'player' ? COLORS.mustard : COLORS.ketchup}44 90%,
          ${possession === 'player' ? COLORS.mustard : COLORS.ketchup}44 100%)`,
          borderRadius: '8px',
          border: '4px solid white',
          overflow: 'hidden',
          filter: turboFlash ? 'brightness(1.3) saturate(1.3)' : 'none',
          transition: 'filter 0.15s ease-out',
        }}
      >
        {/* Yard lines */}
        {[10, 20, 30, 40, 50, 60, 70, 80, 90].map((yard) => (
          <div
            key={yard}
            style={{
              position: 'absolute',
              left: `${yard}%`,
              top: 0,
              bottom: 0,
              width: '2px',
              background: 'rgba(255,255,255,0.3)',
            }}
          >
            <span
              style={{
                position: 'absolute',
                top: '50%',
                transform: 'translate(-50%, -50%)',
                color: 'rgba(255,255,255,0.5)',
                fontSize: '10px',
                fontWeight: 'bold',
              }}
            >
              {yard === 50 ? '50' : yard < 50 ? yard : 100 - yard}
            </span>
          </div>
        ))}

        {/* Line of scrimmage */}
        <div
          style={{
            position: 'absolute',
            left: `${lineOfScrimmage}%`,
            top: 0,
            bottom: 0,
            width: '3px',
            background: '#4169E1',
            boxShadow: '0 0 8px #4169E1',
          }}
        />

        {/* First down marker */}
        <div
          style={{
            position: 'absolute',
            left: `${Math.min(100, lineOfScrimmage + yardsToGo)}%`,
            top: 0,
            bottom: 0,
            width: '3px',
            background: COLORS.mustard,
            boxShadow: `0 0 10px ${COLORS.mustard}`,
          }}
        />

        {/* Receiver dots - floating animation during plays */}
        {possession === 'player' &&
          showPlaybook &&
          receiverPositions.map((pos, i) => (
            <div
              key={`receiver-${i}`}
              style={{
                position: 'absolute',
                left: `${pos.x}%`,
                top: `${pos.y}%`,
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: COLORS.mustard,
                boxShadow: `0 0 6px ${COLORS.mustard}`,
                animation: 'receiverFloat 1.5s ease-in-out infinite',
                animationDelay: `${i * 0.2}s`,
                opacity: 0.8,
              }}
            />
          ))}

        {/* Animated football */}
        <div
          style={{
            position: 'absolute',
            left: `${ballDisplay.x}%`,
            top: `${ballDisplay.y}%`,
            transform: `translate(-50%, -50%) rotate(${ballDisplay.rotation}deg)`,
            fontSize: '24px',
            transition: ballAnimation?.active ? 'none' : 'left 0.5s ease-out, top 0.3s ease-out',
            filter: turboFlash ? 'drop-shadow(0 0 8px #FFD700)' : 'none',
          }}
        >
          🏈
        </div>

        {/* Endzone markers */}
        <div style={{ position: 'absolute', left: '2%', top: '10px', fontSize: '20px' }}>
          {possession === 'player' ? '🏰' : cpuTeam?.emoji}
        </div>
        <div style={{ position: 'absolute', right: '2%', top: '10px', fontSize: '20px' }}>
          {possession === 'player' ? playerTeam?.emoji : '🏰'}
        </div>

        {/* Particle renderer for field */}
        {particles.map((particle) => (
          <div
            key={particle.id}
            style={{
              position: 'absolute',
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              transform: `translate(-50%, -50%) rotate(${particle.rotation}deg) scale(${particle.scale * (particle.life / particle.maxLife)})`,
              fontSize: '16px',
              opacity: particle.life / particle.maxLife,
              pointerEvents: 'none',
            }}
          >
            {particle.emoji}
          </div>
        ))}

        {/* Floating text renderer for field */}
        {floatingTexts.map((ft) => (
          <div
            key={ft.id}
            style={{
              position: 'absolute',
              left: `${ft.x}%`,
              top: `${ft.y - (1 - ft.life / ft.maxLife) * 15}%`,
              transform: 'translate(-50%, -50%)',
              color: ft.color,
              fontSize: '14px',
              fontWeight: 'bold',
              opacity: ft.life / ft.maxLife,
              textShadow: '0 0 4px rgba(0,0,0,0.8)',
              pointerEvents: 'none',
            }}
          >
            {ft.text}
          </div>
        ))}
      </div>
    );
  };

  const renderPlaybook = () => {
    const isPlayerOffense = possession === 'player';
    const plays = isPlayerOffense ? OFFENSIVE_PLAYS : DEFENSIVE_PLAYS;
    const canSpecialTeams = isPlayerOffense && down === 4;

    return (
      <div style={{ margin: '10px' }}>
        {canSpecialTeams && (
          <div
            style={{ display: 'flex', gap: '8px', marginBottom: '10px', justifyContent: 'center' }}
          >
            <button
              onClick={() => setPlaybookTab('plays')}
              style={{
                background: playbookTab === 'plays' ? COLORS.burntOrange : 'rgba(255,255,255,0.1)',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 16px',
                color: 'white',
                cursor: 'pointer',
              }}
            >
              📋 Plays
            </button>
            <button
              onClick={() => setPlaybookTab('special')}
              style={{
                background: playbookTab === 'special' ? COLORS.mustard : 'rgba(255,255,255,0.1)',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 16px',
                color: playbookTab === 'special' ? 'black' : 'white',
                cursor: 'pointer',
              }}
            >
              ⭐ Special Teams
            </button>
          </div>
        )}

        <div style={{ color: '#888', fontSize: '11px', marginBottom: '8px', textAlign: 'center' }}>
          {playbookTab === 'special'
            ? '4TH DOWN OPTIONS:'
            : isPlayerOffense
              ? `OFFENSE - ${down}${['st', 'nd', 'rd', 'th'][Math.min(down - 1, 3)]} & ${yardsToGo}`
              : 'PICK YOUR DEFENSE:'}
        </div>

        {playbookTab === 'special' ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            {SPECIAL_TEAMS.map((play, i) => (
              <button
                key={i}
                onClick={() => executePlay(play, true)}
                style={{
                  background: `linear-gradient(135deg, ${COLORS.charcoal} 0%, ${COLORS.midnight} 100%)`,
                  border: `2px solid ${COLORS.mustard}`,
                  borderRadius: '10px',
                  padding: '12px 8px',
                  cursor: 'pointer',
                  color: 'white',
                }}
              >
                <div style={{ fontSize: '24px', marginBottom: '4px' }}>{play.icon}</div>
                <div style={{ fontWeight: 'bold', fontSize: '12px' }}>{play.name}</div>
                <div style={{ fontSize: '9px', color: '#888' }}>{play.desc}</div>
              </button>
            ))}
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '6px',
              maxHeight: '280px',
              overflowY: 'auto',
            }}
          >
            {plays.map((play, i) => (
              <button
                key={i}
                onClick={() => executePlay(play)}
                style={{
                  background: `linear-gradient(135deg, ${COLORS.charcoal} 0%, ${COLORS.midnight} 100%)`,
                  border: `2px solid ${isPlayerOffense ? COLORS.burntOrange : '#4CAF50'}`,
                  borderRadius: '8px',
                  padding: '10px 6px',
                  cursor: 'pointer',
                  color: 'white',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '20px', marginBottom: '2px' }}>{play.icon}</div>
                <div style={{ fontWeight: 'bold', fontSize: '11px' }}>{play.name}</div>
                <div style={{ fontSize: '9px', color: '#666' }}>{play.desc}</div>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background:
          possession === 'player'
            ? `linear-gradient(180deg, ${playerTeam?.color || COLORS.charcoal}44 0%, ${COLORS.midnight} 100%)`
            : `linear-gradient(180deg, ${cpuTeam?.color || COLORS.charcoal}44 0%, ${COLORS.midnight} 100%)`,
        fontFamily: 'system-ui',
        overflow: 'hidden',
        userSelect: 'none',
        transition: 'background 0.5s',
      }}
    >
      <ArcadeHeader title="Gridiron Blitz" onBack={onBack} showBack />

      {gamePhase !== 'teamSelect' && (
        <ScoreBar
          items={[
            {
              label: playerTeam?.name?.split(' ')[0] || 'YOU',
              value: playerScore,
              color: playerTeam?.color || 'white',
            },
            { label: 'QTR', value: quarter, color: 'white' },
            { label: 'TIME', value: timeLeft, color: timeLeft <= 10 ? COLORS.ketchup : 'white' },
            {
              label: cpuTeam?.name?.split(' ')[0] || 'CPU',
              value: cpuScore,
              color: cpuTeam?.color || 'white',
            },
          ]}
        />
      )}

      <div style={{ padding: '5px' }}>
        {gamePhase === 'teamSelect' && (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <div style={{ fontSize: '64px', marginBottom: '10px' }}>🏈</div>
            <h2 style={{ color: COLORS.burntOrange, marginBottom: '8px' }}>GRIDIRON BLITZ</h2>
            <p style={{ color: '#888', marginBottom: '16px', fontSize: '14px' }}>
              4 quarters × {diffSettings.quarterTime} seconds. Call plays. Score big!
            </p>
            <DifficultySelector
              game="football"
              difficulty={difficulty}
              onSelect={setDifficulty}
              difficulties={FOOTBALL_DIFFICULTIES}
            />
            <p style={{ color: 'white', marginBottom: '16px' }}>Choose your team:</p>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '12px',
                justifyContent: 'center',
                maxWidth: '400px',
                margin: '0 auto',
              }}
            >
              {TEAMS.map((team, i) => (
                <button
                  key={i}
                  onClick={() => initiateGame(i)}
                  style={{
                    background: `linear-gradient(135deg, ${team.color}44 0%, ${COLORS.midnight} 100%)`,
                    border: `3px solid ${team.color}`,
                    borderRadius: '12px',
                    padding: '16px',
                    cursor: 'pointer',
                    width: '150px',
                    textAlign: 'center',
                    color: 'white',
                  }}
                >
                  <div style={{ fontSize: '36px', marginBottom: '8px' }}>{team.emoji}</div>
                  <div style={{ fontWeight: 'bold' }}>{team.name}</div>
                  <div style={{ fontSize: '10px', color: '#aaa', marginTop: '4px' }}>
                    OFF: {team.offense} | DEF: {team.defense}
                  </div>
                </button>
              ))}
            </div>
            {highScore > 0 && (
              <p style={{ marginTop: '24px', color: COLORS.mustard }}>🏆 Best: {highScore} pts</p>
            )}
            <p style={{ color: '#666', fontSize: '11px', marginTop: '12px' }}>ESC to pause</p>
          </div>
        )}

        {/* Countdown overlay */}
        {gamePhase === 'countdown' && (
          <Countdown onComplete={handleCountdownComplete} sounds={sounds} />
        )}

        {gamePhase === 'play' && (
          <>
            {renderField()}

            <div
              style={{
                textAlign: 'center',
                padding: '8px',
                background: 'rgba(0,0,0,0.5)',
                borderRadius: '8px',
                margin: '5px 10px',
              }}
            >
              <span
                style={{
                  color: possession === 'player' ? COLORS.mustard : '#FF8888',
                  fontWeight: 'bold',
                  fontSize: '16px',
                }}
              >
                {possession === 'player'
                  ? `${playerTeam?.emoji} YOUR BALL`
                  : `${cpuTeam?.emoji} DEFENSE`}
              </span>
              <span style={{ color: 'white', marginLeft: '12px', fontSize: '14px' }}>
                {down}
                {['st', 'nd', 'rd', 'th'][Math.min(down - 1, 3)]} & {yardsToGo} at the{' '}
                {ballPosition < 50 ? ballPosition : 100 - ballPosition}
              </span>
            </div>

            <div
              style={{
                margin: '5px 10px',
                background: turboFlash ? 'rgba(255,200,0,0.3)' : 'rgba(0,0,0,0.3)',
                borderRadius: '8px',
                padding: '6px 10px',
                transition: 'background 0.15s ease-out',
                boxShadow: turboFlash ? `0 0 15px ${COLORS.mustard}` : 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    color: turboFlash ? COLORS.mustard : COLORS.ember,
                    fontSize: '11px',
                    animation: turboFlash ? 'turboFlash 0.3s ease-in-out infinite' : 'none',
                  }}
                >
                  ⚡ TURBO
                </span>
                <div
                  style={{
                    flex: 1,
                    height: '8px',
                    background: 'rgba(255,255,255,0.1)',
                    borderRadius: '4px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${turboMeter}%`,
                      background: turboFlash
                        ? `linear-gradient(90deg, ${COLORS.mustard} 0%, #FFD700 50%, ${COLORS.ember} 100%)`
                        : `linear-gradient(90deg, ${COLORS.ember} 0%, ${COLORS.mustard} 100%)`,
                      transition: 'width 0.3s, background 0.15s',
                      boxShadow: turboFlash ? `0 0 10px ${COLORS.mustard}` : 'none',
                    }}
                  />
                </div>
              </div>
            </div>

            {playResult && (
              <div
                style={{
                  textAlign: 'center',
                  padding: '14px',
                  margin: '10px',
                  background: 'rgba(0,0,0,0.85)',
                  borderRadius: '12px',
                  animation: 'popIn 0.3s ease-out',
                }}
              >
                <div style={{ color: playResult.color, fontSize: '18px', fontWeight: 'bold' }}>
                  {playResult.text}
                </div>
                {playResult.cpuPlay && (
                  <div style={{ color: '#666', fontSize: '11px', marginTop: '4px' }}>
                    vs {playResult.cpuPlay}
                  </div>
                )}
              </div>
            )}

            {showPlaybook && !isAnimating && renderPlaybook()}
          </>
        )}

        {gamePhase === 'halftime' && (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎺</div>
            <h2 style={{ color: COLORS.burntOrange, marginBottom: '16px' }}>HALFTIME!</h2>
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '40px',
                marginBottom: '24px',
              }}
            >
              <div>
                <div style={{ fontSize: '14px', color: '#888' }}>{playerTeam?.name}</div>
                <div style={{ fontSize: '36px', color: playerTeam?.color, fontWeight: 'bold' }}>
                  {playerScore}
                </div>
              </div>
              <div style={{ color: '#444', fontSize: '24px', alignSelf: 'center' }}>-</div>
              <div>
                <div style={{ fontSize: '14px', color: '#888' }}>{cpuTeam?.name}</div>
                <div style={{ fontSize: '36px', color: cpuTeam?.color, fontWeight: 'bold' }}>
                  {cpuScore}
                </div>
              </div>
            </div>
            <ActionButton
              onClick={() => {
                setQuarter(3);
                setTimeLeft(diffSettings.quarterTime);
                resetDrive(possession === 'player' ? 'cpu' : 'player', 25);
                setGamePhase('play');
              }}
            >
              ▶️ Start 2nd Half
            </ActionButton>
          </div>
        )}

        {/* Pause menu */}
        {gamePhase === 'paused' && (
          <PauseMenu
            onResume={handleResume}
            onRestart={handleRestart}
            onQuit={onBack}
            sounds={sounds}
          />
        )}

        {/* Stats screen */}
        {gamePhase === 'stats' && gameStats && (
          <StatsScreen
            gameType="football"
            stats={gameStats}
            onPlayAgain={handlePlayAgain}
            onBack={onBack}
            sounds={sounds}
            isDailyChallenge={isDailyChallenge}
          />
        )}
      </div>

      <style>{`
        @keyframes popIn { 0% { transform: scale(0); opacity: 0; } 50% { transform: scale(1.1); } 100% { transform: scale(1); opacity: 1; } }
        @keyframes turboFlash { 0%, 100% { filter: brightness(1) saturate(1); } 50% { filter: brightness(1.3) saturate(1.5); } }
        @keyframes receiverFloat { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
        @keyframes ballFly { 0% { transform: translate(0, 0) rotate(0deg); } 100% { transform: translate(var(--endX), var(--endY)) rotate(720deg); } }
        @keyframes celebrateBounce { 0%, 100% { transform: scale(1) translateY(0); } 50% { transform: scale(1.2) translateY(-10px); } }
      `}</style>
    </div>
  );
};

// ============================================================================
// GAME REGISTRY (NO COMING SOON)
// ============================================================================

const GAMES: Game[] = [
  {
    id: 'hotdog-dash',
    title: 'Hot Dog Dash',
    description: 'Help Blaze catch falling hot dogs!',
    icon: '🌭',
    component: HotDogDashGame,
  },
  {
    id: 'sandlot-slugger',
    title: 'Sandlot Slugger',
    description: 'Backyard home run derby!',
    icon: '⚾',
    component: SandlotSluggerGame,
  },
  {
    id: 'gridiron-blitz',
    title: 'Gridiron Blitz',
    description: 'Fast arcade football action!',
    icon: '🏈',
    component: GridironBlitzGame,
  },
];

// ============================================================================
// ARCADE HUB
// ============================================================================

interface ArcadeHubProps {
  onSelectGame: (id: string) => void;
  onSelectDailyChallenge: (id: string) => void;
  onClose: () => void;
  highScores: Record<string, number>;
  dailyChallengeData: DailyChallengeData;
  isMuted: boolean;
  onToggleMute: () => void;
  progress: PlayerProgress;
  onShowAchievements: () => void;
}

const ArcadeHub: React.FC<ArcadeHubProps> = ({
  onSelectGame,
  onSelectDailyChallenge,
  onClose,
  highScores,
  dailyChallengeData,
  isMuted,
  onToggleMute,
  progress,
  onShowAchievements,
}) => {
  const totalGames = Object.values(progress.gamesPlayed).reduce((a, b) => a + b, 0);
  const achievementCount = progress.achievements.length;

  return (
    <div
      style={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${COLORS.midnight} 0%, ${COLORS.charcoal} 50%, #1a1a2e 100%)`,
        fontFamily: 'system-ui',
      }}
    >
      <ArcadeHeader title="Blaze Arcade" onClose={onClose} />
      <div style={{ padding: '30px 20px', textAlign: 'center' }}>
        <div style={{ marginBottom: '30px' }}>
          <div style={{ fontSize: '64px', marginBottom: '10px' }}>🐕🎮</div>
          <h1 style={{ color: COLORS.burntOrange, fontSize: '28px', marginBottom: '8px' }}>
            Blaze Arcade
          </h1>
          <p style={{ color: '#888', fontSize: '14px' }}>
            A Blaze Sports Intel Easter Egg Collection
          </p>
        </div>

        {/* Player stats bar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '16px',
            marginBottom: '24px',
            flexWrap: 'wrap',
          }}
        >
          <div
            style={{
              background: 'rgba(255,255,255,0.05)',
              borderRadius: '8px',
              padding: '8px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span>🎮</span>
            <span style={{ color: '#888', fontSize: '12px' }}>Games:</span>
            <span style={{ color: 'white', fontWeight: 'bold' }}>{totalGames}</span>
          </div>
          <button
            onClick={onShowAchievements}
            style={{
              background: achievementCount > 0 ? 'rgba(255,215,0,0.1)' : 'rgba(255,255,255,0.05)',
              borderRadius: '8px',
              padding: '8px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              border: 'none',
              cursor: 'pointer',
              transition: 'background 0.2s',
            }}
          >
            <span>🏆</span>
            <span style={{ color: '#888', fontSize: '12px' }}>Achievements:</span>
            <span
              style={{ color: achievementCount > 0 ? COLORS.mustard : 'white', fontWeight: 'bold' }}
            >
              {achievementCount}/{ACHIEVEMENTS.length}
            </span>
          </button>
          {progress.currentStreak > 1 && (
            <div
              style={{
                background: 'rgba(255,107,53,0.1)',
                borderRadius: '8px',
                padding: '8px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span>🔥</span>
              <span style={{ color: COLORS.ember, fontWeight: 'bold' }}>
                {progress.currentStreak} day streak!
              </span>
            </div>
          )}
        </div>

        {/* Sound toggle button */}
        <button
          onClick={onToggleMute}
          style={{
            position: 'fixed',
            top: '20px',
            right: '70px',
            background: 'rgba(255,255,255,0.1)',
            border: 'none',
            borderRadius: '50%',
            width: '44px',
            height: '44px',
            cursor: 'pointer',
            fontSize: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            transition: 'background 0.2s',
          }}
          aria-label={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? '🔇' : '🔊'}
        </button>

        {/* Daily Challenge Section */}
        <div
          style={{
            background:
              'linear-gradient(135deg, rgba(255,107,53,0.15) 0%, rgba(255,215,0,0.1) 100%)',
            borderRadius: '16px',
            padding: '20px',
            marginBottom: '30px',
            maxWidth: '640px',
            margin: '0 auto 30px',
            border: '2px solid rgba(255,107,53,0.3)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              marginBottom: '12px',
            }}
          >
            <span style={{ fontSize: '24px' }}>📅</span>
            <h2 style={{ color: COLORS.ember, fontSize: '20px', margin: 0 }}>Daily Challenge</h2>
            <span style={{ fontSize: '24px' }}>🔥</span>
          </div>
          <p style={{ color: '#aaa', fontSize: '13px', marginBottom: '16px' }}>
            {getDailyDateString()} • Same sequence for everyone • Compete globally!
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {GAMES.filter((g) => g.component).map((game) => {
              const isCompleted = dailyChallengeData.completed.includes(game.id);
              const bestScore = dailyChallengeData.scores[game.id];
              return (
                <button
                  key={game.id}
                  onClick={() => onSelectDailyChallenge(game.id)}
                  style={{
                    background: isCompleted ? 'rgba(76,175,80,0.2)' : 'rgba(255,255,255,0.1)',
                    border: isCompleted ? '2px solid #4CAF50' : '2px solid rgba(255,255,255,0.2)',
                    borderRadius: '12px',
                    padding: '12px 16px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    minWidth: '100px',
                    transition: 'all 0.2s',
                  }}
                >
                  <span style={{ fontSize: '28px' }}>{game.icon}</span>
                  <span style={{ color: 'white', fontSize: '12px', fontWeight: 'bold' }}>
                    {game.title.split(' ')[0]}
                  </span>
                  {isCompleted ? (
                    <span style={{ color: '#4CAF50', fontSize: '11px' }}>
                      ✓ {bestScore?.toLocaleString()}
                    </span>
                  ) : (
                    <span style={{ color: COLORS.ember, fontSize: '11px' }}>Play Now!</span>
                  )}
                </button>
              );
            })}
          </div>
          {dailyChallengeData.completed.length === 3 && (
            <div
              style={{
                marginTop: '12px',
                color: COLORS.mustard,
                fontSize: '14px',
                fontWeight: 'bold',
              }}
            >
              🏆 All Daily Challenges Complete! 🏆
            </div>
          )}
        </div>

        <h3
          style={{
            color: '#888',
            fontSize: '14px',
            marginBottom: '16px',
            textTransform: 'uppercase',
            letterSpacing: '1px',
          }}
        >
          Free Play
        </h3>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '20px',
            justifyContent: 'center',
            maxWidth: '640px',
            margin: '0 auto',
          }}
        >
          {GAMES.map((game) => (
            <GameCard
              key={game.id}
              game={game}
              highScore={highScores[game.id] || 0}
              onSelect={onSelectGame}
            />
          ))}
        </div>
        <div style={{ marginTop: '40px', color: '#555', fontSize: '12px' }}>
          <p style={{ marginTop: '8px', opacity: 0.6 }}>blazesportsintel.com</p>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// MAIN EXPORT
// ============================================================================

interface BlazeArcadeProps {
  onClose: () => void;
}

const STORAGE_KEY = 'blaze-arcade-highscores';

export default function BlazeArcade({ onClose }: BlazeArcadeProps) {
  const [currentGame, setCurrentGame] = useState<string | null>(null);
  const [highScores, setHighScores] = useState<Record<string, number>>({});
  const [showAchievements, setShowAchievements] = useState(false);
  // Daily challenge state
  const [isDailyChallenge, setIsDailyChallenge] = useState(false);
  const [dailyRng, setDailyRng] = useState<SeededRandom | null>(null);
  const [dailyChallengeData, setDailyChallengeData] = useState<DailyChallengeData>(() =>
    getDailyChallengeData()
  );

  // Initialize audio system
  const { sounds, toggleMute, isMuted } = useGameAudio();

  // Initialize progression system
  const {
    progress,
    newAchievements,
    newCosmetics,
    recordGamePlayed,
    checkAchievements,
    recordTeamDefeated,
    recordDailyComplete,
    clearNewAchievements,
  } = useProgression();

  // Load high scores from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setHighScores(JSON.parse(saved));
      }
    } catch {
      // localStorage not available
    }
  }, []);

  // Save high scores to localStorage when they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(highScores));
    } catch {
      // localStorage not available
    }
  }, [highScores]);

  const updateHighScore = (gameId: string, score: number) => {
    setHighScores((prev) => {
      const currentHigh = prev[gameId] || 0;
      if (score > currentHigh) {
        return { ...prev, [gameId]: score };
      }
      return prev;
    });
  };

  const handleSelectGame = (id: string) => {
    sounds.menuSelect();
    setIsDailyChallenge(false);
    setDailyRng(null);
    setCurrentGame(id);
  };

  const handleSelectDailyChallenge = (id: string) => {
    sounds.menuSelect();
    // Create seeded RNG for consistent daily sequence
    const seed = getDailySeed() + id.charCodeAt(0); // Different seed per game
    setDailyRng(new SeededRandom(seed));
    setIsDailyChallenge(true);
    setCurrentGame(id);
  };

  const handleDailyChallengeComplete = useCallback(
    (gameId: string, score: number) => {
      const prevData = getDailyChallengeData();
      const wasAllComplete = prevData.completed.length === 3;

      const isNewBest = saveDailyChallengeScore(gameId, score);
      const newData = getDailyChallengeData();
      setDailyChallengeData(newData);

      // If this completion made all 3 done (and wasn't already), record achievement
      if (!wasAllComplete && newData.completed.length === 3) {
        recordDailyComplete();
      }

      return isNewBest;
    },
    [recordDailyComplete]
  );

  const handleBack = () => {
    sounds.menuBack();
    setCurrentGame(null);
    setIsDailyChallenge(false);
    setDailyRng(null);
  };

  // Handle game completion with achievement checking
  const handleGameComplete = useCallback(
    (gameId: string, stats: HotDogStats | SluggerStats | FootballStats) => {
      recordGamePlayed(gameId, stats.finalScore);
      checkAchievements(stats);

      // Check for team defeated in football
      if ('opponentScore' in stats && stats.finalScore > stats.opponentScore) {
        // Record team defeat - we'd need to pass team name from the game
      }
    },
    [recordGamePlayed, checkAchievements]
  );

  if (currentGame) {
    const game = GAMES.find((g) => g.id === currentGame);
    if (game?.component) {
      const GameComponent = game.component;
      return (
        <>
          <GameComponent
            onBack={handleBack}
            highScore={highScores[currentGame] || 0}
            onUpdateHighScore={(score) => updateHighScore(currentGame, score)}
            sounds={sounds}
            onGameComplete={(stats) => {
              recordGamePlayed(currentGame, stats.finalScore);
              checkAchievements(stats);
              // Record daily challenge score if applicable
              if (isDailyChallenge) {
                handleDailyChallengeComplete(currentGame, stats.finalScore);
              }
            }}
            isDailyChallenge={isDailyChallenge}
            dailyRng={dailyRng || undefined}
            onDailyChallengeComplete={handleDailyChallengeComplete}
          />
          {/* Daily challenge banner */}
          {isDailyChallenge && (
            <div
              style={{
                position: 'fixed',
                top: '60px',
                left: '50%',
                transform: 'translateX(-50%)',
                background:
                  'linear-gradient(90deg, rgba(255,107,53,0.9) 0%, rgba(255,215,0,0.9) 100%)',
                padding: '6px 20px',
                borderRadius: '20px',
                color: 'white',
                fontWeight: 'bold',
                fontSize: '12px',
                zIndex: 150,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 4px 15px rgba(255,107,53,0.4)',
              }}
            >
              📅 DAILY CHALLENGE • {getDailyDateString()}
            </div>
          )}
          {/* Achievement popup */}
          {newAchievements.length > 0 && (
            <AchievementPopup
              achievements={newAchievements}
              cosmetics={newCosmetics}
              onClose={clearNewAchievements}
              sounds={sounds}
            />
          )}
        </>
      );
    }
  }

  return (
    <>
      <ArcadeHub
        onSelectGame={handleSelectGame}
        onSelectDailyChallenge={handleSelectDailyChallenge}
        onClose={onClose}
        highScores={highScores}
        dailyChallengeData={dailyChallengeData}
        isMuted={isMuted}
        onToggleMute={toggleMute}
        progress={progress}
        onShowAchievements={() => setShowAchievements(true)}
      />
      {/* Achievement popup on hub */}
      {newAchievements.length > 0 && (
        <AchievementPopup
          achievements={newAchievements}
          cosmetics={newCosmetics}
          onClose={clearNewAchievements}
          sounds={sounds}
        />
      )}
      {/* Achievements display */}
      {showAchievements && (
        <AchievementsDisplay progress={progress} onClose={() => setShowAchievements(false)} />
      )}
    </>
  );
}
