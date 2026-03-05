import type { IntelGame } from '@/lib/intel/types';

export function isPregameNoScore(game: IntelGame): boolean {
  return game.status === 'scheduled' && game.home.score === 0 && game.away.score === 0;
}

export function scoreColor(game: IntelGame, side: 'home' | 'away', accent: string): string {
  const isLiveOrFinal = game.status === 'live' || game.status === 'final';
  if (!isLiveOrFinal) return 'rgba(255,255,255,0.75)';

  const home = game.home.score;
  const away = game.away.score;
  if (home === away) return 'rgba(255,255,255,0.92)';

  const teamScore = side === 'home' ? home : away;
  const oppScore = side === 'home' ? away : home;
  return teamScore > oppScore ? accent : 'rgba(255,255,255,0.5)';
}

export function rankPrefix(rank?: number): string {
  return rank && rank > 0 ? `#${rank} ` : '';
}
