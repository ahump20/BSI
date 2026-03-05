/**
 * Blaze Blitz Football - Play Definitions
 *
 * Offensive and defensive formations/routes for 7-on-7
 * Simplified for arcade gameplay
 */

import type { PlayerPosition } from './teams';

/** Route type for receivers */
export type RouteType =
  | 'streak'      // Straight deep
  | 'slant'       // Quick diagonal inside
  | 'out'         // Run then cut outside
  | 'in'          // Run then cut inside (dig)
  | 'corner'      // Run deep then cut to corner
  | 'post'        // Run deep then cut to middle
  | 'curl'        // Run then turn back toward QB
  | 'flat'        // Quick out to flat
  | 'drag'        // Shallow cross
  | 'wheel'       // RB/TE out then up
  | 'block'       // Stay and block
  | 'checkdown';  // Short safety valve

/** Individual player route in a play */
export interface PlayerRoute {
  positionId: string;
  routeType: RouteType;
  routeDepth: number;     // How far downfield (yards)
  routeWidth: number;     // How far to side (yards, positive = right)
  breakDelay: number;     // Time before route break (0-1, percentage of route)
  isPrimary: boolean;     // Is this the main target
}

/** Offensive play definition */
export interface OffensivePlay {
  id: string;
  name: string;
  category: 'short' | 'medium' | 'deep' | 'run';
  description: string;
  routes: PlayerRoute[];
  difficulty: 1 | 2 | 3;  // 1 = easy, 3 = hard to execute
  unlockRequirement?: {
    type: 'games' | 'touchdowns' | 'yards' | 'score';
    value: number;
  };
}

/** Defensive play/coverage */
export interface DefensivePlay {
  id: string;
  name: string;
  type: 'man' | 'zone' | 'blitz';
  description: string;
  blitzers: string[];           // Position IDs that will rush
  coverageDepths: Record<string, number>; // Position ID to coverage depth
}

/** Default offensive plays */
export const OFFENSIVE_PLAYS: OffensivePlay[] = [
  // SHORT PASSES (Quick game)
  {
    id: 'play_slants',
    name: 'Quick Slants',
    category: 'short',
    description: 'Fast-breaking slant routes for quick gains',
    difficulty: 1,
    routes: [
      { positionId: 'wr1', routeType: 'slant', routeDepth: 8, routeWidth: -5, breakDelay: 0.2, isPrimary: true },
      { positionId: 'wr2', routeType: 'slant', routeDepth: 8, routeWidth: 5, breakDelay: 0.2, isPrimary: false },
      { positionId: 'wr3', routeType: 'flat', routeDepth: 2, routeWidth: 10, breakDelay: 0.1, isPrimary: false },
      { positionId: 'te', routeType: 'drag', routeDepth: 5, routeWidth: 12, breakDelay: 0.3, isPrimary: false },
      { positionId: 'rb', routeType: 'checkdown', routeDepth: 3, routeWidth: -5, breakDelay: 0, isPrimary: false },
      { positionId: 'c', routeType: 'block', routeDepth: 0, routeWidth: 0, breakDelay: 0, isPrimary: false },
    ],
  },
  {
    id: 'play_screen',
    name: 'Screen Pass',
    category: 'short',
    description: 'Dump it to the RB and let blockers lead the way',
    difficulty: 2,
    routes: [
      { positionId: 'rb', routeType: 'flat', routeDepth: -2, routeWidth: 12, breakDelay: 0.4, isPrimary: true },
      { positionId: 'wr1', routeType: 'streak', routeDepth: 20, routeWidth: 0, breakDelay: 0, isPrimary: false },
      { positionId: 'wr2', routeType: 'streak', routeDepth: 20, routeWidth: 0, breakDelay: 0, isPrimary: false },
      { positionId: 'wr3', routeType: 'block', routeDepth: 5, routeWidth: 8, breakDelay: 0.5, isPrimary: false },
      { positionId: 'te', routeType: 'block', routeDepth: 5, routeWidth: 5, breakDelay: 0.5, isPrimary: false },
      { positionId: 'c', routeType: 'block', routeDepth: 3, routeWidth: 10, breakDelay: 0.3, isPrimary: false },
    ],
  },

  // MEDIUM PASSES (Timing routes)
  {
    id: 'play_curls',
    name: 'Curl Routes',
    category: 'medium',
    description: 'Receivers run and turn back for the ball',
    difficulty: 1,
    routes: [
      { positionId: 'wr1', routeType: 'curl', routeDepth: 12, routeWidth: 0, breakDelay: 0.7, isPrimary: true },
      { positionId: 'wr2', routeType: 'curl', routeDepth: 12, routeWidth: 0, breakDelay: 0.7, isPrimary: false },
      { positionId: 'wr3', routeType: 'out', routeDepth: 8, routeWidth: 8, breakDelay: 0.5, isPrimary: false },
      { positionId: 'te', routeType: 'in', routeDepth: 10, routeWidth: -10, breakDelay: 0.6, isPrimary: false },
      { positionId: 'rb', routeType: 'checkdown', routeDepth: 5, routeWidth: 5, breakDelay: 0, isPrimary: false },
      { positionId: 'c', routeType: 'block', routeDepth: 0, routeWidth: 0, breakDelay: 0, isPrimary: false },
    ],
  },
  {
    id: 'play_cross',
    name: 'Crossers',
    category: 'medium',
    description: 'Crossing routes to create traffic for defenders',
    difficulty: 2,
    routes: [
      { positionId: 'wr1', routeType: 'drag', routeDepth: 8, routeWidth: -25, breakDelay: 0.3, isPrimary: true },
      { positionId: 'wr2', routeType: 'drag', routeDepth: 6, routeWidth: 25, breakDelay: 0.2, isPrimary: false },
      { positionId: 'wr3', routeType: 'post', routeDepth: 15, routeWidth: -8, breakDelay: 0.5, isPrimary: false },
      { positionId: 'te', routeType: 'corner', routeDepth: 12, routeWidth: 12, breakDelay: 0.5, isPrimary: false },
      { positionId: 'rb', routeType: 'wheel', routeDepth: 10, routeWidth: 15, breakDelay: 0.4, isPrimary: false },
      { positionId: 'c', routeType: 'block', routeDepth: 0, routeWidth: 0, breakDelay: 0, isPrimary: false },
    ],
  },

  // DEEP PASSES (Big play potential)
  {
    id: 'play_four_verts',
    name: 'Four Verticals',
    category: 'deep',
    description: 'Stretch the defense deep with four go routes',
    difficulty: 3,
    routes: [
      { positionId: 'wr1', routeType: 'streak', routeDepth: 30, routeWidth: 0, breakDelay: 0, isPrimary: true },
      { positionId: 'wr2', routeType: 'streak', routeDepth: 30, routeWidth: 0, breakDelay: 0, isPrimary: false },
      { positionId: 'wr3', routeType: 'streak', routeDepth: 25, routeWidth: 5, breakDelay: 0, isPrimary: false },
      { positionId: 'te', routeType: 'streak', routeDepth: 20, routeWidth: -5, breakDelay: 0, isPrimary: false },
      { positionId: 'rb', routeType: 'checkdown', routeDepth: 5, routeWidth: 0, breakDelay: 0, isPrimary: false },
      { positionId: 'c', routeType: 'block', routeDepth: 0, routeWidth: 0, breakDelay: 0, isPrimary: false },
    ],
  },
  {
    id: 'play_bomb',
    name: 'Hail Mary',
    category: 'deep',
    description: 'All receivers go deep - throw it up and pray',
    difficulty: 3,
    routes: [
      { positionId: 'wr1', routeType: 'post', routeDepth: 35, routeWidth: -10, breakDelay: 0.6, isPrimary: true },
      { positionId: 'wr2', routeType: 'corner', routeDepth: 30, routeWidth: 15, breakDelay: 0.5, isPrimary: false },
      { positionId: 'wr3', routeType: 'streak', routeDepth: 35, routeWidth: 0, breakDelay: 0, isPrimary: false },
      { positionId: 'te', routeType: 'post', routeDepth: 25, routeWidth: -5, breakDelay: 0.4, isPrimary: false },
      { positionId: 'rb', routeType: 'streak', routeDepth: 20, routeWidth: 8, breakDelay: 0.3, isPrimary: false },
      { positionId: 'c', routeType: 'block', routeDepth: 0, routeWidth: 0, breakDelay: 0, isPrimary: false },
    ],
    unlockRequirement: { type: 'touchdowns', value: 5 },
  },

  // SPECIAL PLAYS (Unlockable)
  {
    id: 'play_trick',
    name: 'Flea Flicker',
    category: 'deep',
    description: 'Hand off then get the ball back - big play potential',
    difficulty: 3,
    routes: [
      { positionId: 'wr1', routeType: 'streak', routeDepth: 35, routeWidth: 0, breakDelay: 0, isPrimary: true },
      { positionId: 'wr2', routeType: 'post', routeDepth: 30, routeWidth: -12, breakDelay: 0.6, isPrimary: false },
      { positionId: 'wr3', routeType: 'corner', routeDepth: 25, routeWidth: 15, breakDelay: 0.5, isPrimary: false },
      { positionId: 'te', routeType: 'streak', routeDepth: 20, routeWidth: 0, breakDelay: 0, isPrimary: false },
      { positionId: 'rb', routeType: 'block', routeDepth: 2, routeWidth: 0, breakDelay: 0.8, isPrimary: false },
      { positionId: 'c', routeType: 'block', routeDepth: 0, routeWidth: 0, breakDelay: 0, isPrimary: false },
    ],
    unlockRequirement: { type: 'score', value: 2000 },
  },
];

/** Default defensive plays */
export const DEFENSIVE_PLAYS: DefensivePlay[] = [
  {
    id: 'def_cover2',
    name: 'Cover 2',
    type: 'zone',
    description: 'Two deep safeties, corners in flats',
    blitzers: [],
    coverageDepths: {
      dl1: 2,
      dl2: 2,
      lb: 8,
      cb1: 5,
      cb2: 5,
      ss: 20,
      fs: 20,
    },
  },
  {
    id: 'def_cover3',
    name: 'Cover 3',
    type: 'zone',
    description: 'Three deep, four underneath',
    blitzers: [],
    coverageDepths: {
      dl1: 2,
      dl2: 2,
      lb: 10,
      cb1: 20,
      cb2: 20,
      ss: 8,
      fs: 25,
    },
  },
  {
    id: 'def_man',
    name: 'Man Coverage',
    type: 'man',
    description: 'Each defender covers a receiver',
    blitzers: [],
    coverageDepths: {
      dl1: 2,
      dl2: 2,
      lb: 5,
      cb1: 0,  // Man coverage - follows WR
      cb2: 0,
      ss: 0,
      fs: 15,
    },
  },
  {
    id: 'def_blitz',
    name: 'All-Out Blitz',
    type: 'blitz',
    description: 'Bring the heat - 5 rushers',
    blitzers: ['dl1', 'dl2', 'lb', 'ss', 'cb2'],
    coverageDepths: {
      dl1: 0,  // Rush
      dl2: 0,
      lb: 0,
      cb1: 0,  // Man
      cb2: 0,
      ss: 0,
      fs: 20,
    },
  },
];

/** Get all offensive plays */
export function getAllOffensivePlays(): OffensivePlay[] {
  return OFFENSIVE_PLAYS;
}

/** Get plays by category */
export function getPlaysByCategory(category: OffensivePlay['category']): OffensivePlay[] {
  return OFFENSIVE_PLAYS.filter((play) => play.category === category);
}

/** Get unlocked plays based on player stats */
export function getUnlockedPlays(playerStats: {
  gamesPlayed: number;
  totalTouchdowns: number;
  totalYards: number;
  highScore: number;
}): OffensivePlay[] {
  return OFFENSIVE_PLAYS.filter((play) => {
    if (!play.unlockRequirement) return true;

    const { type, value } = play.unlockRequirement;
    switch (type) {
      case 'games':
        return playerStats.gamesPlayed >= value;
      case 'touchdowns':
        return playerStats.totalTouchdowns >= value;
      case 'yards':
        return playerStats.totalYards >= value;
      case 'score':
        return playerStats.highScore >= value;
      default:
        return true;
    }
  });
}

/** Get a random defensive play (for AI) */
export function getRandomDefensivePlay(): DefensivePlay {
  const index = Math.floor(Math.random() * DEFENSIVE_PLAYS.length);
  return DEFENSIVE_PLAYS[index];
}

/** Get defensive play based on down and distance (smarter AI) */
export function getSmartDefensivePlay(down: number, yardsToGo: number): DefensivePlay {
  // Short yardage - expect run or short pass
  if (yardsToGo <= 3) {
    return DEFENSIVE_PLAYS.find((p) => p.id === 'def_blitz') || DEFENSIVE_PLAYS[0];
  }

  // Long yardage - expect deep pass
  if (yardsToGo >= 15) {
    return DEFENSIVE_PLAYS.find((p) => p.id === 'def_cover3') || DEFENSIVE_PLAYS[0];
  }

  // 4th down - blitz
  if (down === 4) {
    return DEFENSIVE_PLAYS.find((p) => p.id === 'def_blitz') || DEFENSIVE_PLAYS[0];
  }

  // Default - mix it up
  return getRandomDefensivePlay();
}
