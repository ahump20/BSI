export type ArcadeCategory = 'sports' | 'strategy' | 'action' | 'tool';

export interface ArcadeGame {
  id: string;
  title: string;
  description: string;
  color: string;
  icon: string;
  url: string;
  deployed: boolean;
  category: ArcadeCategory;
  comingSoon?: boolean;
  external?: boolean;
}

export const ARCADE_GAMES: ArcadeGame[] = [
  {
    id: 'blitz',
    title: 'Blaze Blitz',
    description:
      'Call plays and drive downfield in this fast-paced football strategy game.',
    color: 'var(--bsi-accent)',
    icon: '\u{1F3C8}',
    url: '/arcade/games/blitz',
    deployed: true,
    category: 'sports',
  },
  {
    id: 'sandlot-sluggers',
    title: 'Sandlot Sluggers',
    description:
      '3D backyard baseball — Practice, Quick Play, and HR Derby modes with leaderboard.',
    color: 'var(--bsi-primary)',
    icon: '\u26BE',
    url: '/arcade/games/sandlot-sluggers',
    deployed: true,
    category: 'sports',
  },
  {
    id: 'downtown-doggies',
    title: 'Downtown Doggies',
    description:
      '3-point contest. 5 racks, 25 shots. Hit the green zone to drain threes.',
    color: '#FDB913',
    icon: '\u{1F3C0}',
    url: '/arcade/games/downtown-doggies',
    deployed: true,
    category: 'sports',
  },
  {
    id: 'hotdog-dash',
    title: 'Blaze Hot Dog',
    description:
      'Guide your dachshund through the stadium. Dodge obstacles, collect hot dogs.',
    color: '#CD5C5C',
    icon: '\u{1F32D}',
    url: '/arcade/games/hotdog-dash',
    deployed: true,
    category: 'action',
  },
  {
    id: 'leadership-capital',
    title: 'Leadership Capital Index',
    description:
      '23 intangible leadership metrics mapped to 5 academic frameworks. Quantify the It Factor.',
    color: 'var(--bsi-primary)',
    icon: '\u{1F4CA}',
    url: '/arcade/games/leadership-capital',
    deployed: true,
    category: 'tool',
  },
  {
    id: 'lone-star-legends',
    title: 'Lone Star Legends Championship',
    description:
      'Build your roster, manage your bullpen, and lead a Texas program to the College World Series.',
    color: 'var(--bsi-texas-soil)',
    icon: '\u2B50',
    url: '/arcade/games/lone-star-legends',
    deployed: false,
    category: 'sports',
    comingSoon: true,
  },
  {
    id: 'blazecraft',
    title: 'BlazeCraft',
    description:
      'Real-time system health dashboard disguised as a Warcraft III-style strategy game.',
    color: 'var(--bsi-accent)',
    icon: '\u{1F525}',
    url: 'https://blazecraft.app',
    deployed: true,
    category: 'tool',
    external: true,
  },
];

export const ARCADE_CATEGORIES: { id: ArcadeCategory; label: string }[] = [
  { id: 'sports', label: 'Sports' },
  { id: 'action', label: 'Action' },
  { id: 'strategy', label: 'Strategy' },
  { id: 'tool', label: 'Tools' },
];

export function getGamesByCategory(
  category: ArcadeCategory | 'all'
): ArcadeGame[] {
  if (category === 'all') return ARCADE_GAMES;
  return ARCADE_GAMES.filter((game) => game.category === category);
}

export function getDeployedGames(): ArcadeGame[] {
  return ARCADE_GAMES.filter((game) => game.deployed && !game.comingSoon);
}
