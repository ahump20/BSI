/**
 * Blaze Backyard Baseball - Original Character Definitions
 *
 * 100% Original IP - No Humongous Entertainment content
 * Each character has unique stats affecting gameplay
 */

/** Character stats interface */
export interface BackyardCharacter {
  id: string;
  name: string;
  nickname: string;
  age: number;
  description: string;

  // Core batting stats (1-10 scale)
  power: number;      // Affects hit distance and home run potential
  contact: number;    // Affects timing window and hit consistency
  speed: number;      // Affects base running (future feature)

  // Visual properties
  uniformColor: string;
  skinTone: string;
  hairColor: string;
  accessory?: string;

  // Special ability (future feature)
  specialAbility: {
    name: string;
    description: string;
    effect: string;
  };

  // Unlock requirements
  unlockRequirement?: {
    type: 'score' | 'games' | 'homeRuns' | 'streak' | 'default';
    value: number;
  };
}

/** Default starting characters (available immediately) */
export const STARTER_CHARACTERS: BackyardCharacter[] = [
  {
    id: 'char_blaze_001',
    name: 'Ember Ellis',
    nickname: 'The Spark',
    age: 11,
    description: 'A fiery competitor from Austin who never gives up. Her quick reflexes make her a natural at the plate.',
    power: 6,
    contact: 8,
    speed: 7,
    uniformColor: '#BF5700', // Burnt orange
    skinTone: '#D4A574',
    hairColor: '#8B4513',
    specialAbility: {
      name: 'Hot Streak',
      description: 'Multiplier increases 50% faster during hitting streaks',
      effect: 'streak_boost',
    },
    unlockRequirement: { type: 'default', value: 0 },
  },
  {
    id: 'char_blaze_002',
    name: 'Marcus "Mack" Jackson',
    nickname: 'Big Mac',
    age: 12,
    description: 'The strongest kid on the block. When Mack connects, the ball is gone.',
    power: 10,
    contact: 4,
    speed: 3,
    uniformColor: '#1A1A1A', // Charcoal
    skinTone: '#8D5524',
    hairColor: '#1A1A1A',
    specialAbility: {
      name: 'Power Surge',
      description: 'Home runs are worth double points',
      effect: 'double_hr',
    },
    unlockRequirement: { type: 'default', value: 0 },
  },
  {
    id: 'char_blaze_003',
    name: 'Sofia "Speedy" Ramirez',
    nickname: 'Speedy',
    age: 10,
    description: 'The fastest runner in three counties. She can turn any hit into extra bases.',
    power: 4,
    contact: 7,
    speed: 10,
    uniformColor: '#FF6B35', // Ember
    skinTone: '#C68642',
    hairColor: '#2C1810',
    specialAbility: {
      name: 'Speed Demon',
      description: 'Singles count as doubles 25% of the time',
      effect: 'speed_bonus',
    },
    unlockRequirement: { type: 'default', value: 0 },
  },
  {
    id: 'char_blaze_004',
    name: 'Tommy "T-Bone" Chen',
    nickname: 'T-Bone',
    age: 11,
    description: 'A balanced player who studies the game like a scientist. Rarely makes mistakes.',
    power: 6,
    contact: 6,
    speed: 6,
    uniformColor: '#228B22', // Baseball green
    skinTone: '#F1C27D',
    hairColor: '#1A1A1A',
    specialAbility: {
      name: 'Student of the Game',
      description: 'Timing window is 20% wider',
      effect: 'wide_window',
    },
    unlockRequirement: { type: 'default', value: 0 },
  },
];

/** Unlockable characters (earned through gameplay) */
export const UNLOCKABLE_CHARACTERS: BackyardCharacter[] = [
  {
    id: 'char_blaze_005',
    name: 'Jasmine "Jazz" Williams',
    nickname: 'Jazz',
    age: 12,
    description: 'Cool under pressure, Jazz plays her best when the game is on the line.',
    power: 7,
    contact: 8,
    speed: 6,
    uniformColor: '#C9A227', // Gold
    skinTone: '#8D5524',
    hairColor: '#1A1A1A',
    accessory: 'gold_chain',
    specialAbility: {
      name: 'Clutch Player',
      description: 'Points doubled when at 2 outs',
      effect: 'clutch_bonus',
    },
    unlockRequirement: { type: 'score', value: 2500 },
  },
  {
    id: 'char_blaze_006',
    name: 'Diego "Diesel" Martinez',
    nickname: 'Diesel',
    age: 13,
    description: 'The oldest kid on the field. Diesel brings raw power and experience.',
    power: 9,
    contact: 5,
    speed: 4,
    uniformColor: '#4A4A4A', // Gray
    skinTone: '#C68642',
    hairColor: '#2C1810',
    accessory: 'backwards_cap',
    specialAbility: {
      name: 'Veteran Power',
      description: 'Extra base hits are 30% more likely',
      effect: 'extra_base',
    },
    unlockRequirement: { type: 'homeRuns', value: 10 },
  },
  {
    id: 'char_blaze_007',
    name: 'Riley "Radar" O\'Brien',
    nickname: 'Radar',
    age: 11,
    description: 'Has an uncanny ability to read pitches. The ball looks like a beach ball to Radar.',
    power: 5,
    contact: 10,
    speed: 5,
    uniformColor: '#F5F5DC', // Cream
    skinTone: '#FFDFC4',
    hairColor: '#D4A574',
    accessory: 'glasses',
    specialAbility: {
      name: 'Eagle Eye',
      description: 'Perfect timing window is 50% wider',
      effect: 'eagle_eye',
    },
    unlockRequirement: { type: 'streak', value: 8 },
  },
  {
    id: 'char_blaze_008',
    name: 'Kai "Hurricane" Nakamura',
    nickname: 'Hurricane',
    age: 12,
    description: 'A whirlwind of energy. Hurricane swings hard and runs fast.',
    power: 8,
    contact: 6,
    speed: 8,
    uniformColor: '#CC0000', // Baseball red
    skinTone: '#F1C27D',
    hairColor: '#1A1A1A',
    accessory: 'headband',
    specialAbility: {
      name: 'Whirlwind',
      description: 'Gain bonus points for consecutive extra-base hits',
      effect: 'xbh_streak',
    },
    unlockRequirement: { type: 'games', value: 10 },
  },
  {
    id: 'char_blaze_009',
    name: 'Olivia "Ollie" Santos',
    nickname: 'Ollie',
    age: 10,
    description: 'The youngest but one of the best. Ollie has natural talent that defies her age.',
    power: 5,
    contact: 9,
    speed: 8,
    uniformColor: '#FFD700', // Yellow
    skinTone: '#D4A574',
    hairColor: '#8B4513',
    accessory: 'ponytail',
    specialAbility: {
      name: 'Natural Talent',
      description: 'All stats get +1 bonus',
      effect: 'stat_boost',
    },
    unlockRequirement: { type: 'score', value: 5000 },
  },
  {
    id: 'char_blaze_010',
    name: 'Zeke "Zeus" Thunders',
    nickname: 'Zeus',
    age: 13,
    description: 'A legendary slugger. When Zeus swings, lightning strikes.',
    power: 10,
    contact: 7,
    speed: 5,
    uniformColor: '#4169E1', // Royal blue
    skinTone: '#FFDFC4',
    hairColor: '#D4A574',
    accessory: 'lightning_bolt_patch',
    specialAbility: {
      name: 'Thunder Crack',
      description: 'Home runs trigger a lightning effect and bonus 100 points',
      effect: 'thunder_bonus',
    },
    unlockRequirement: { type: 'homeRuns', value: 25 },
  },
];

/** Secret/special characters (hardest to unlock) */
export const SECRET_CHARACTERS: BackyardCharacter[] = [
  {
    id: 'char_blaze_secret_001',
    name: 'Blaze the Dog',
    nickname: 'Good Boy',
    age: 4, // Dog years
    description: 'The official mascot of Blaze Sports Intel. A golden retriever who loves baseball.',
    power: 7,
    contact: 7,
    speed: 10,
    uniformColor: '#BF5700', // Burnt orange
    skinTone: '#D4A574', // Fur color
    hairColor: '#C9A227', // Golden
    accessory: 'bandana',
    specialAbility: {
      name: 'Fetch!',
      description: 'Automatically catches any ball hit to the outfield (for bonus points)',
      effect: 'fetch_bonus',
    },
    unlockRequirement: { type: 'score', value: 10000 },
  },
  {
    id: 'char_blaze_secret_002',
    name: 'Austin "Ace" Maverick',
    nickname: 'Ace',
    age: 12,
    description: 'A Texas legend in the making. Born to play baseball under the hot sun.',
    power: 9,
    contact: 9,
    speed: 7,
    uniformColor: '#BF5700', // Burnt orange
    skinTone: '#D4A574',
    hairColor: '#8B4513',
    accessory: 'cowboy_hat',
    specialAbility: {
      name: 'Lone Star Power',
      description: 'All scoring is increased by 25%',
      effect: 'texas_bonus',
    },
    unlockRequirement: { type: 'score', value: 25000 },
  },
];

/** Get all characters */
export function getAllCharacters(): BackyardCharacter[] {
  return [...STARTER_CHARACTERS, ...UNLOCKABLE_CHARACTERS, ...SECRET_CHARACTERS];
}

/** Get character by ID */
export function getCharacterById(id: string): BackyardCharacter | undefined {
  return getAllCharacters().find((char) => char.id === id);
}

/** Check if character is unlocked based on player stats */
export function isCharacterUnlocked(
  character: BackyardCharacter,
  playerStats: {
    highScore: number;
    gamesPlayed: number;
    totalHomeRuns: number;
    longestStreak: number;
  }
): boolean {
  const req = character.unlockRequirement;
  if (!req || req.type === 'default') return true;

  switch (req.type) {
    case 'score':
      return playerStats.highScore >= req.value;
    case 'games':
      return playerStats.gamesPlayed >= req.value;
    case 'homeRuns':
      return playerStats.totalHomeRuns >= req.value;
    case 'streak':
      return playerStats.longestStreak >= req.value;
    default:
      return false;
  }
}

/** Get unlock progress for a character */
export function getUnlockProgress(
  character: BackyardCharacter,
  playerStats: {
    highScore: number;
    gamesPlayed: number;
    totalHomeRuns: number;
    longestStreak: number;
  }
): { current: number; required: number; percent: number } {
  const req = character.unlockRequirement;
  if (!req || req.type === 'default') {
    return { current: 0, required: 0, percent: 100 };
  }

  let current: number;
  switch (req.type) {
    case 'score':
      current = playerStats.highScore;
      break;
    case 'games':
      current = playerStats.gamesPlayed;
      break;
    case 'homeRuns':
      current = playerStats.totalHomeRuns;
      break;
    case 'streak':
      current = playerStats.longestStreak;
      break;
    default:
      current = 0;
  }

  return {
    current,
    required: req.value,
    percent: Math.min(100, Math.floor((current / req.value) * 100)),
  };
}
