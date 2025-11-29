/**
 * Blaze Hoops Shootout - Shooter Characters
 *
 * 100% Original IP - No NBA likenesses
 */

export interface HoopsShooter {
  id: string;
  name: string;
  nickname: string;
  jerseyColor: string;
  accuracy: number;      // Base accuracy (1-10)
  release: number;       // Shot release speed (1-10, higher = faster meter)
  range: number;         // Deep range bonus (1-10)
  streakBonus: number;   // Streak multiplier bonus
}

/** Starter shooters - available from the start */
export const STARTER_SHOOTERS: HoopsShooter[] = [
  {
    id: 'blaze_shooter_001',
    name: 'Blaze Rivers',
    nickname: 'The Flame',
    jerseyColor: '#BF5700',
    accuracy: 7,
    release: 6,
    range: 7,
    streakBonus: 1.2,
  },
  {
    id: 'blaze_shooter_002',
    name: 'Marcus Quick',
    nickname: 'Quickdraw',
    jerseyColor: '#1E90FF',
    accuracy: 6,
    release: 9,
    range: 6,
    streakBonus: 1.1,
  },
  {
    id: 'blaze_shooter_003',
    name: 'Tommy Sniper',
    nickname: 'Dead Eye',
    jerseyColor: '#228B22',
    accuracy: 9,
    release: 5,
    range: 8,
    streakBonus: 1.0,
  },
  {
    id: 'blaze_shooter_004',
    name: 'DJ Thunder',
    nickname: 'Boom',
    jerseyColor: '#9932CC',
    accuracy: 6,
    release: 7,
    range: 9,
    streakBonus: 1.3,
  },
];

/** Unlockable shooters */
export const UNLOCKABLE_SHOOTERS: HoopsShooter[] = [
  {
    id: 'blaze_shooter_005',
    name: 'Ice Cole',
    nickname: 'Cold Blooded',
    jerseyColor: '#00CED1',
    accuracy: 8,
    release: 8,
    range: 7,
    streakBonus: 1.4,
  },
  {
    id: 'blaze_shooter_006',
    name: 'Rex Clutch',
    nickname: 'Mr. Automatic',
    jerseyColor: '#FFD700',
    accuracy: 10,
    release: 6,
    range: 9,
    streakBonus: 1.5,
  },
];

/** Get all shooters */
export function getAllShooters(): HoopsShooter[] {
  return [...STARTER_SHOOTERS, ...UNLOCKABLE_SHOOTERS];
}

/** Get default shooter */
export function getDefaultShooter(): HoopsShooter {
  return STARTER_SHOOTERS[0];
}

/** Check if shooter is unlocked */
export function isShooterUnlocked(
  shooter: HoopsShooter,
  stats: { highScore: number; gamesPlayed: number; totalThrees: number }
): boolean {
  // Starter shooters are always unlocked
  if (STARTER_SHOOTERS.some((s) => s.id === shooter.id)) {
    return true;
  }

  // Ice Cole: Score 5000+ points
  if (shooter.id === 'blaze_shooter_005') {
    return stats.highScore >= 5000;
  }

  // Rex Clutch: Hit 100 total 3-pointers
  if (shooter.id === 'blaze_shooter_006') {
    return stats.totalThrees >= 100;
  }

  return false;
}
