/** Cumulative XP required to reach level N */
export function xpForLevel(level: number): number {
  if (level <= 0) return 0;
  return Math.floor(100 * Math.pow(level, 1.5));
}

/** Current level from total XP */
export function levelFromXp(xp: number): number {
  if (xp <= 0) return 0;
  return Math.floor(Math.pow(xp / 100, 2 / 3));
}

/** XP needed to reach the next level from current XP */
export function xpToNextLevel(xp: number): number {
  const current = levelFromXp(xp);
  return xpForLevel(current + 1) - xp;
}
