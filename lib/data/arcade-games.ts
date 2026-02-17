/**
 * Arcade Game Manifest
 *
 * Single source of truth for all BSI arcade games.
 * The arcade hub page, game routes, and leaderboard API all reference this.
 */

export interface ArcadeGame {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  category: 'sports' | 'strategy' | 'action' | 'tool';
  status: 'live' | 'coming-soon' | 'beta';
  url: string;         // Next.js route under /arcade/games/
  assetPath?: string;  // Static path for iframe embed (e.g. /games/blitz/)
  hasLeaderboard: boolean;
  features?: string[];
}

export const ARCADE_GAMES: ArcadeGame[] = [
  {
    id: 'blitz',
    title: 'Blaze Blitz',
    description: 'Call plays and drive downfield in this fast-paced football strategy game.',
    icon: '\uD83C\uDFC8',
    color: '#FF6B35',
    category: 'sports',
    status: 'live',
    url: '/arcade/games/blitz',
    assetPath: '/games/blitz/',
    hasLeaderboard: true,
    features: ['3D Babylon.js', 'Play calling', 'Drive mode'],
  },
  {
    id: 'sandlot-sluggers',
    title: 'Sandlot Sluggers',
    description: 'Time your swing to crush pitches. Streak multipliers and home run bonuses.',
    icon: '\u26BE',
    color: '#BF5700',
    category: 'sports',
    status: 'live',
    url: '/arcade/games/sandlot-sluggers',
    assetPath: '/games/sandlot-sluggers/',
    hasLeaderboard: true,
    features: ['Swing timing', 'Streak multipliers', 'Home run bonuses'],
  },
  {
    id: 'downtown-doggies',
    title: 'Downtown Doggies',
    description: '3-point contest. 5 racks, 25 shots. Hit the green zone to drain threes.',
    icon: '\uD83C\uDFC0',
    color: '#FDB913',
    category: 'sports',
    status: 'live',
    url: '/arcade/games/downtown-doggies',
    assetPath: '/games/downtown-doggies/',
    hasLeaderboard: true,
    features: ['5 racks', '25 shots', 'Green zone accuracy'],
  },
  {
    id: 'hotdog-dash',
    title: 'Blaze Hot Dog',
    description: 'Guide your dachshund through the stadium. Dodge obstacles, collect hot dogs.',
    icon: '\uD83C\uDF2D',
    color: '#CD5C5C',
    category: 'action',
    status: 'live',
    url: '/arcade/games/hotdog-dash',
    assetPath: '/games/hotdog-dash/',
    hasLeaderboard: true,
    features: ['11 chonk levels', 'Obstacle dodging', 'Hot dog collecting'],
  },
  {
    id: 'leadership-capital',
    title: 'Leadership Capital Index',
    description: '23 intangible leadership metrics mapped to 5 academic frameworks. Quantify the It Factor.',
    icon: '\uD83D\uDCCA',
    color: '#BF5700',
    category: 'tool',
    status: 'live',
    url: '/arcade/games/leadership-capital',
    assetPath: '/games/leadership-capital/',
    hasLeaderboard: false,
    features: ['23 metrics', '5 frameworks', 'Leadership scoring'],
  },
  {
    id: 'lone-star-legends',
    title: 'Lone Star Legends Championship',
    description: 'Full championship simulation with roster management and multi-stadium play.',
    icon: '\u2B50',
    color: '#BF5700',
    category: 'strategy',
    status: 'coming-soon',
    url: '/arcade/games/lone-star-legends',
    hasLeaderboard: true,
    features: ['Championship mode', 'Roster management', '14 stadiums'],
  },
  {
    id: 'blazecraft',
    title: 'BlazeCraft',
    description: 'Real-time strategy meets system health monitoring. MicroRTS-inspired.',
    icon: '\u2694\uFE0F',
    color: '#8B4513',
    category: 'strategy',
    status: 'coming-soon',
    url: '/arcade/games/blazecraft',
    hasLeaderboard: true,
    features: ['RTS mechanics', 'System health visualization', 'Resource management'],
  },
];

export const ARCADE_CATEGORIES = ['all', 'sports', 'strategy', 'action', 'tool'] as const;
export type ArcadeCategory = typeof ARCADE_CATEGORIES[number];

export function getGamesByCategory(category: ArcadeCategory): ArcadeGame[] {
  if (category === 'all') return ARCADE_GAMES;
  return ARCADE_GAMES.filter(g => g.category === category);
}

export function getGameById(id: string): ArcadeGame | undefined {
  return ARCADE_GAMES.find(g => g.id === id);
}

export function getLiveGames(): ArcadeGame[] {
  return ARCADE_GAMES.filter(g => g.status === 'live');
}

export function getGamesWithLeaderboards(): ArcadeGame[] {
  return ARCADE_GAMES.filter(g => g.hasLeaderboard);
}
