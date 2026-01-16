/**
 * QB Challenge - Quarterback Data
 *
 * Each QB has unique stats affecting gameplay:
 * - accuracy: Base throw accuracy (affects ball trajectory)
 * - armStrength: Throw power (affects velocity and distance)
 * - release: Release speed (affects aim time)
 * - mobility: Movement speed in pocket
 */

export interface Quarterback {
  id: string;
  name: string;
  nickname: string;
  jerseyColor: string;
  accuracy: number; // 1-10 scale
  armStrength: number; // 1-10 scale
  release: number; // 1-10 scale (higher = faster)
  mobility: number; // 1-10 scale
  unlockRequirement?: {
    type: 'score' | 'completions' | 'games';
    value: number;
  };
}

const STARTER_QBS: Quarterback[] = [
  {
    id: 'blaze_qb_001',
    name: 'Blaze Rookie',
    nickname: 'The Rookie',
    jerseyColor: '#FF6B35',
    accuracy: 6,
    armStrength: 6,
    release: 6,
    mobility: 6,
  },
  {
    id: 'blaze_qb_002',
    name: 'Field General',
    nickname: 'General',
    jerseyColor: '#1a472a',
    accuracy: 8,
    armStrength: 5,
    release: 6,
    mobility: 5,
  },
  {
    id: 'blaze_qb_003',
    name: 'Cannon Arm',
    nickname: 'Cannon',
    jerseyColor: '#4169E1',
    accuracy: 5,
    armStrength: 9,
    release: 5,
    mobility: 5,
  },
  {
    id: 'blaze_qb_004',
    name: 'Quick Release',
    nickname: 'Flash',
    jerseyColor: '#FFD700',
    accuracy: 6,
    armStrength: 6,
    release: 9,
    mobility: 7,
  },
];

const UNLOCKABLE_QBS: Quarterback[] = [
  {
    id: 'blaze_qb_005',
    name: 'Elite Passer',
    nickname: 'Elite',
    jerseyColor: '#8B4513',
    accuracy: 9,
    armStrength: 8,
    release: 8,
    mobility: 6,
    unlockRequirement: { type: 'score', value: 5000 },
  },
  {
    id: 'blaze_qb_006',
    name: 'Legend',
    nickname: 'GOAT',
    jerseyColor: '#C9A227',
    accuracy: 9,
    armStrength: 9,
    release: 9,
    mobility: 8,
    unlockRequirement: { type: 'completions', value: 100 },
  },
];

export function getAllQBs(): Quarterback[] {
  return [...STARTER_QBS, ...UNLOCKABLE_QBS];
}

export function getStarterQBs(): Quarterback[] {
  return [...STARTER_QBS];
}

export function isQBUnlocked(
  qb: Quarterback,
  stats: { highScore: number; totalCompletions: number; gamesPlayed: number }
): boolean {
  if (!qb.unlockRequirement) return true;

  switch (qb.unlockRequirement.type) {
    case 'score':
      return stats.highScore >= qb.unlockRequirement.value;
    case 'completions':
      return stats.totalCompletions >= qb.unlockRequirement.value;
    case 'games':
      return stats.gamesPlayed >= qb.unlockRequirement.value;
    default:
      return false;
  }
}

export function getDefaultQB(): Quarterback {
  return STARTER_QBS[0];
}
