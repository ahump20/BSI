/**
 * Blaze Blitz Football - Playbook System
 *
 * Formations, expanded route tree, offensive/defensive plays,
 * smart play-calling AI, and visual formation picker data.
 *
 * 7-on-7 arcade football. Coordinates use X = depth (negative = behind LOS),
 * Z = lateral (positive = right). Babylon.js Vector3(x, 0, z) for flat field.
 */

import { Vector3 } from '@babylonjs/core';
import type {
  RouteType,
  PlayerRoute,
  OffensivePlay,
  DefensivePlay,
} from '../data/plays';

// ---------------------------------------------------------------------------
// Route Tree
// ---------------------------------------------------------------------------

/** Extended route types beyond the base set */
export type ExtendedRouteType = RouteType | 'screen' | 'seam' | 'comeback' | 'dig';

// ---------------------------------------------------------------------------
// Formations
// ---------------------------------------------------------------------------

export type FormationType =
  | 'shotgun'
  | 'iform'
  | 'trips'
  | 'spread'
  | 'singleback';

/** Per-position offset from the default position for a given formation */
export interface FormationOffset {
  positionId: string;
  offsetX: number;
  offsetZ: number;
}

export interface Formation {
  id: FormationType;
  name: string;
  description: string;
  offsets: FormationOffset[];
  /** Flat Vector3 array for the formation picker preview (x,0,z per player) */
  preview: Vector3[];
}

// Offset helpers — only positions that move relative to the base OFFENSIVE_POSITIONS.
// Positions not listed keep their defaults.

const SHOTGUN_OFFSETS: FormationOffset[] = [
  { positionId: 'qb', offsetX: -2, offsetZ: 0 },
  { positionId: 'rb', offsetX: 0, offsetZ: -3 },
];

const IFORM_OFFSETS: FormationOffset[] = [
  { positionId: 'qb', offsetX: 1, offsetZ: 0 },
  { positionId: 'rb', offsetX: -4, offsetZ: 0 },
  { positionId: 'te', offsetX: 0, offsetZ: -4 },
];

const TRIPS_OFFSETS: FormationOffset[] = [
  { positionId: 'qb', offsetX: -2, offsetZ: 0 },
  { positionId: 'wr1', offsetX: 0, offsetZ: 18 },
  { positionId: 'wr2', offsetX: -1, offsetZ: 12 },
  { positionId: 'wr3', offsetX: 0, offsetZ: 15 },
  { positionId: 'te', offsetX: 0, offsetZ: -6 },
];

const SPREAD_OFFSETS: FormationOffset[] = [
  { positionId: 'qb', offsetX: -3, offsetZ: 0 },
  { positionId: 'wr1', offsetX: 0, offsetZ: 25 },
  { positionId: 'wr2', offsetX: 0, offsetZ: -25 },
  { positionId: 'wr3', offsetX: -1, offsetZ: 12 },
  { positionId: 'te', offsetX: -1, offsetZ: -12 },
  { positionId: 'rb', offsetX: -1, offsetZ: -4 },
];

const SINGLEBACK_OFFSETS: FormationOffset[] = [
  { positionId: 'qb', offsetX: 0, offsetZ: 0 },
  { positionId: 'rb', offsetX: -4, offsetZ: 0 },
  { positionId: 'te', offsetX: 0, offsetZ: -6 },
];

function buildPreview(offsets: FormationOffset[]): Vector3[] {
  // Base positions for the 7 offensive players (from teams.ts defaults)
  const base: Record<string, { x: number; z: number }> = {
    qb: { x: -5, z: 0 },
    rb: { x: -7, z: 0 },
    wr1: { x: 0, z: 20 },
    wr2: { x: 0, z: -20 },
    wr3: { x: -1, z: 8 },
    te: { x: -1, z: -8 },
    c: { x: 0, z: 0 },
  };

  const applied = { ...base };
  for (const o of offsets) {
    if (applied[o.positionId]) {
      applied[o.positionId] = {
        x: base[o.positionId].x + o.offsetX,
        z: base[o.positionId].z + o.offsetZ,
      };
    }
  }

  return Object.values(applied).map((p) => new Vector3(p.x, 0, p.z));
}

export const FORMATIONS: Record<FormationType, Formation> = {
  shotgun: {
    id: 'shotgun',
    name: 'Shotgun',
    description: 'QB lined up 7 yards back, RB beside him',
    offsets: SHOTGUN_OFFSETS,
    preview: buildPreview(SHOTGUN_OFFSETS),
  },
  iform: {
    id: 'iform',
    name: 'I-Formation',
    description: 'QB under center, RB directly behind',
    offsets: IFORM_OFFSETS,
    preview: buildPreview(IFORM_OFFSETS),
  },
  trips: {
    id: 'trips',
    name: 'Trips',
    description: 'Three receivers stacked to one side',
    offsets: TRIPS_OFFSETS,
    preview: buildPreview(TRIPS_OFFSETS),
  },
  spread: {
    id: 'spread',
    name: 'Spread',
    description: 'Receivers split wide, 5-wide look',
    offsets: SPREAD_OFFSETS,
    preview: buildPreview(SPREAD_OFFSETS),
  },
  singleback: {
    id: 'singleback',
    name: 'Singleback',
    description: 'Balanced with one back behind QB',
    offsets: SINGLEBACK_OFFSETS,
    preview: buildPreview(SINGLEBACK_OFFSETS),
  },
};

// ---------------------------------------------------------------------------
// Enhanced Play Types
// ---------------------------------------------------------------------------

export interface EnhancedOffensivePlay extends OffensivePlay {
  formation: FormationType;
  tempo: 'hurry' | 'normal' | 'slow';
  /** Tags for the AI play recommender */
  tags: string[];
}

export interface EnhancedDefensivePlay extends DefensivePlay {
  /** Which offensive categories this scheme is strong against */
  strongAgainst: Array<OffensivePlay['category']>;
  /** Which categories it's weak against */
  weakAgainst: Array<OffensivePlay['category']>;
  riskLevel: 1 | 2 | 3;
}

// ---------------------------------------------------------------------------
// Offensive Plays (12+)
// ---------------------------------------------------------------------------

export const PLAYBOOK_OFFENSE: EnhancedOffensivePlay[] = [
  // --- SHORT ---
  {
    id: 'pb_quick_slants',
    name: 'Quick Slants',
    category: 'short',
    formation: 'spread',
    tempo: 'hurry',
    description: 'Two slants off the snap for a fast 5-8 yard gain',
    difficulty: 1,
    tags: ['quick', 'safe', 'short_yardage'],
    routes: [
      { positionId: 'wr1', routeType: 'slant', routeDepth: 7, routeWidth: -5, breakDelay: 0.15, isPrimary: true },
      { positionId: 'wr2', routeType: 'slant', routeDepth: 7, routeWidth: 5, breakDelay: 0.2, isPrimary: false },
      { positionId: 'wr3', routeType: 'flat', routeDepth: 2, routeWidth: 10, breakDelay: 0.1, isPrimary: false },
      { positionId: 'te', routeType: 'drag', routeDepth: 5, routeWidth: 12, breakDelay: 0.25, isPrimary: false },
      { positionId: 'rb', routeType: 'checkdown', routeDepth: 3, routeWidth: -5, breakDelay: 0, isPrimary: false },
      { positionId: 'c', routeType: 'block', routeDepth: 0, routeWidth: 0, breakDelay: 0, isPrimary: false },
    ],
  },
  {
    id: 'pb_rb_screen',
    name: 'RB Screen',
    category: 'short',
    formation: 'shotgun',
    tempo: 'normal',
    description: 'Dump to the back and let blockers lead',
    difficulty: 2,
    tags: ['screen', 'run_after_catch', 'blitz_beater'],
    routes: [
      { positionId: 'rb', routeType: 'flat', routeDepth: -1, routeWidth: 14, breakDelay: 0.4, isPrimary: true },
      { positionId: 'wr1', routeType: 'streak', routeDepth: 20, routeWidth: 0, breakDelay: 0, isPrimary: false },
      { positionId: 'wr2', routeType: 'streak', routeDepth: 20, routeWidth: 0, breakDelay: 0, isPrimary: false },
      { positionId: 'wr3', routeType: 'block', routeDepth: 4, routeWidth: 10, breakDelay: 0.5, isPrimary: false },
      { positionId: 'te', routeType: 'block', routeDepth: 4, routeWidth: 6, breakDelay: 0.5, isPrimary: false },
      { positionId: 'c', routeType: 'block', routeDepth: 3, routeWidth: 12, breakDelay: 0.3, isPrimary: false },
    ],
  },
  {
    id: 'pb_flat_out',
    name: 'Flat & Out',
    category: 'short',
    formation: 'singleback',
    tempo: 'hurry',
    description: 'Quick flat to the TE with a WR out route underneath',
    difficulty: 1,
    tags: ['quick', 'safe', 'sideline'],
    routes: [
      { positionId: 'te', routeType: 'flat', routeDepth: 3, routeWidth: -10, breakDelay: 0.15, isPrimary: true },
      { positionId: 'wr1', routeType: 'out', routeDepth: 6, routeWidth: 8, breakDelay: 0.4, isPrimary: false },
      { positionId: 'wr2', routeType: 'slant', routeDepth: 8, routeWidth: 5, breakDelay: 0.2, isPrimary: false },
      { positionId: 'wr3', routeType: 'drag', routeDepth: 5, routeWidth: 15, breakDelay: 0.3, isPrimary: false },
      { positionId: 'rb', routeType: 'block', routeDepth: 0, routeWidth: 0, breakDelay: 0, isPrimary: false },
      { positionId: 'c', routeType: 'block', routeDepth: 0, routeWidth: 0, breakDelay: 0, isPrimary: false },
    ],
  },

  // --- MEDIUM ---
  {
    id: 'pb_curl_flat',
    name: 'Curl-Flat Combo',
    category: 'medium',
    formation: 'singleback',
    tempo: 'normal',
    description: 'High-low read: curl at 12 yards with a flat underneath',
    difficulty: 1,
    tags: ['read', 'safe', 'zone_beater'],
    routes: [
      { positionId: 'wr1', routeType: 'curl', routeDepth: 12, routeWidth: 0, breakDelay: 0.7, isPrimary: true },
      { positionId: 'wr3', routeType: 'flat', routeDepth: 3, routeWidth: 10, breakDelay: 0.15, isPrimary: false },
      { positionId: 'wr2', routeType: 'curl', routeDepth: 12, routeWidth: 0, breakDelay: 0.7, isPrimary: false },
      { positionId: 'te', routeType: 'in', routeDepth: 10, routeWidth: -10, breakDelay: 0.55, isPrimary: false },
      { positionId: 'rb', routeType: 'checkdown', routeDepth: 4, routeWidth: 5, breakDelay: 0, isPrimary: false },
      { positionId: 'c', routeType: 'block', routeDepth: 0, routeWidth: 0, breakDelay: 0, isPrimary: false },
    ],
  },
  {
    id: 'pb_mesh_cross',
    name: 'Mesh Crossers',
    category: 'medium',
    formation: 'spread',
    tempo: 'normal',
    description: 'Crossing routes that create pick-style traffic',
    difficulty: 2,
    tags: ['crossing', 'man_beater', 'rac'],
    routes: [
      { positionId: 'wr1', routeType: 'drag', routeDepth: 6, routeWidth: -25, breakDelay: 0.25, isPrimary: true },
      { positionId: 'wr2', routeType: 'drag', routeDepth: 5, routeWidth: 25, breakDelay: 0.2, isPrimary: false },
      { positionId: 'wr3', routeType: 'in', routeDepth: 14, routeWidth: -12, breakDelay: 0.55, isPrimary: false },
      { positionId: 'te', routeType: 'out', routeDepth: 10, routeWidth: -10, breakDelay: 0.5, isPrimary: false },
      { positionId: 'rb', routeType: 'wheel', routeDepth: 12, routeWidth: 14, breakDelay: 0.4, isPrimary: false },
      { positionId: 'c', routeType: 'block', routeDepth: 0, routeWidth: 0, breakDelay: 0, isPrimary: false },
    ],
  },
  {
    id: 'pb_smash',
    name: 'Smash Concept',
    category: 'medium',
    formation: 'trips',
    tempo: 'normal',
    description: 'Corner-hitch combo to beat Cover 2',
    difficulty: 2,
    tags: ['cover2_beater', 'read', 'sideline'],
    routes: [
      { positionId: 'wr1', routeType: 'corner', routeDepth: 14, routeWidth: 10, breakDelay: 0.55, isPrimary: true },
      { positionId: 'wr3', routeType: 'curl', routeDepth: 6, routeWidth: 0, breakDelay: 0.5, isPrimary: false },
      { positionId: 'wr2', routeType: 'post', routeDepth: 16, routeWidth: -8, breakDelay: 0.55, isPrimary: false },
      { positionId: 'te', routeType: 'drag', routeDepth: 5, routeWidth: -15, breakDelay: 0.3, isPrimary: false },
      { positionId: 'rb', routeType: 'checkdown', routeDepth: 3, routeWidth: -5, breakDelay: 0, isPrimary: false },
      { positionId: 'c', routeType: 'block', routeDepth: 0, routeWidth: 0, breakDelay: 0, isPrimary: false },
    ],
  },

  // --- DEEP ---
  {
    id: 'pb_four_verts',
    name: 'Four Verticals',
    category: 'deep',
    formation: 'spread',
    tempo: 'normal',
    description: 'Four receivers streak deep to stress the safeties',
    difficulty: 3,
    tags: ['vertical', 'aggressive', 'cover3_beater'],
    routes: [
      { positionId: 'wr1', routeType: 'streak', routeDepth: 30, routeWidth: 0, breakDelay: 0, isPrimary: true },
      { positionId: 'wr2', routeType: 'streak', routeDepth: 30, routeWidth: 0, breakDelay: 0, isPrimary: false },
      { positionId: 'wr3', routeType: 'streak', routeDepth: 25, routeWidth: 3, breakDelay: 0, isPrimary: false },
      { positionId: 'te', routeType: 'streak', routeDepth: 22, routeWidth: -3, breakDelay: 0, isPrimary: false },
      { positionId: 'rb', routeType: 'checkdown', routeDepth: 5, routeWidth: 0, breakDelay: 0, isPrimary: false },
      { positionId: 'c', routeType: 'block', routeDepth: 0, routeWidth: 0, breakDelay: 0, isPrimary: false },
    ],
  },
  {
    id: 'pb_post_wheel',
    name: 'Post-Wheel',
    category: 'deep',
    formation: 'shotgun',
    tempo: 'normal',
    description: 'Deep post with a wheel route to hold the safety',
    difficulty: 2,
    tags: ['deep', 'cover1_beater', 'big_play'],
    routes: [
      { positionId: 'wr1', routeType: 'post', routeDepth: 22, routeWidth: -10, breakDelay: 0.55, isPrimary: true },
      { positionId: 'rb', routeType: 'wheel', routeDepth: 18, routeWidth: 16, breakDelay: 0.35, isPrimary: false },
      { positionId: 'wr2', routeType: 'curl', routeDepth: 12, routeWidth: 0, breakDelay: 0.65, isPrimary: false },
      { positionId: 'wr3', routeType: 'slant', routeDepth: 8, routeWidth: -5, breakDelay: 0.2, isPrimary: false },
      { positionId: 'te', routeType: 'drag', routeDepth: 6, routeWidth: 15, breakDelay: 0.3, isPrimary: false },
      { positionId: 'c', routeType: 'block', routeDepth: 0, routeWidth: 0, breakDelay: 0, isPrimary: false },
    ],
  },
  {
    id: 'pb_corner_post',
    name: 'Corner-Post',
    category: 'deep',
    formation: 'trips',
    tempo: 'slow',
    description: 'Corner route with a deep post to split the coverage',
    difficulty: 3,
    tags: ['deep', 'cover2_beater', 'aggressive'],
    routes: [
      { positionId: 'wr1', routeType: 'corner', routeDepth: 25, routeWidth: 15, breakDelay: 0.5, isPrimary: false },
      { positionId: 'wr2', routeType: 'post', routeDepth: 28, routeWidth: -10, breakDelay: 0.55, isPrimary: true },
      { positionId: 'wr3', routeType: 'in', routeDepth: 12, routeWidth: -8, breakDelay: 0.5, isPrimary: false },
      { positionId: 'te', routeType: 'flat', routeDepth: 3, routeWidth: -10, breakDelay: 0.15, isPrimary: false },
      { positionId: 'rb', routeType: 'checkdown', routeDepth: 4, routeWidth: 4, breakDelay: 0, isPrimary: false },
      { positionId: 'c', routeType: 'block', routeDepth: 0, routeWidth: 0, breakDelay: 0, isPrimary: false },
    ],
  },

  // --- RUN ---
  {
    id: 'pb_hb_dive',
    name: 'HB Dive',
    category: 'run',
    formation: 'iform',
    tempo: 'hurry',
    description: 'Quick handoff up the middle',
    difficulty: 1,
    tags: ['run', 'short_yardage', 'safe'],
    routes: [
      { positionId: 'rb', routeType: 'streak', routeDepth: 5, routeWidth: 0, breakDelay: 0, isPrimary: true },
      { positionId: 'wr1', routeType: 'block', routeDepth: 5, routeWidth: 0, breakDelay: 0, isPrimary: false },
      { positionId: 'wr2', routeType: 'block', routeDepth: 5, routeWidth: 0, breakDelay: 0, isPrimary: false },
      { positionId: 'wr3', routeType: 'block', routeDepth: 3, routeWidth: 5, breakDelay: 0, isPrimary: false },
      { positionId: 'te', routeType: 'block', routeDepth: 3, routeWidth: -5, breakDelay: 0, isPrimary: false },
      { positionId: 'c', routeType: 'block', routeDepth: 2, routeWidth: 0, breakDelay: 0, isPrimary: false },
    ],
  },
  {
    id: 'pb_stretch',
    name: 'Outside Stretch',
    category: 'run',
    formation: 'singleback',
    tempo: 'normal',
    description: 'RB bounces it to the outside',
    difficulty: 2,
    tags: ['run', 'outside', 'rac'],
    routes: [
      { positionId: 'rb', routeType: 'flat', routeDepth: 2, routeWidth: 18, breakDelay: 0.1, isPrimary: true },
      { positionId: 'wr1', routeType: 'block', routeDepth: 5, routeWidth: 0, breakDelay: 0, isPrimary: false },
      { positionId: 'wr2', routeType: 'block', routeDepth: 5, routeWidth: 0, breakDelay: 0, isPrimary: false },
      { positionId: 'wr3', routeType: 'block', routeDepth: 3, routeWidth: 10, breakDelay: 0, isPrimary: false },
      { positionId: 'te', routeType: 'block', routeDepth: 3, routeWidth: 12, breakDelay: 0, isPrimary: false },
      { positionId: 'c', routeType: 'block', routeDepth: 2, routeWidth: 5, breakDelay: 0, isPrimary: false },
    ],
  },
  {
    id: 'pb_pa_deep',
    name: 'Play Action Deep',
    category: 'deep',
    formation: 'iform',
    tempo: 'slow',
    description: 'Fake the run, hit the post',
    difficulty: 3,
    tags: ['play_action', 'deep', 'big_play'],
    unlockRequirement: { type: 'touchdowns', value: 3 },
    routes: [
      { positionId: 'wr1', routeType: 'post', routeDepth: 30, routeWidth: -10, breakDelay: 0.6, isPrimary: true },
      { positionId: 'wr2', routeType: 'corner', routeDepth: 25, routeWidth: 14, breakDelay: 0.55, isPrimary: false },
      { positionId: 'wr3', routeType: 'drag', routeDepth: 8, routeWidth: -20, breakDelay: 0.3, isPrimary: false },
      { positionId: 'te', routeType: 'streak', routeDepth: 18, routeWidth: -4, breakDelay: 0.1, isPrimary: false },
      { positionId: 'rb', routeType: 'block', routeDepth: 1, routeWidth: 0, breakDelay: 0.8, isPrimary: false },
      { positionId: 'c', routeType: 'block', routeDepth: 0, routeWidth: 0, breakDelay: 0, isPrimary: false },
    ],
  },
];

// ---------------------------------------------------------------------------
// Defensive Schemes (10)
// ---------------------------------------------------------------------------

export const PLAYBOOK_DEFENSE: EnhancedDefensivePlay[] = [
  {
    id: 'def_cover0',
    name: 'Cover 0',
    type: 'man',
    description: 'Pure man, no deep safety. All-in.',
    blitzers: ['dl1', 'dl2'],
    coverageDepths: { dl1: 0, dl2: 0, lb: 0, cb1: 0, cb2: 0, ss: 0, fs: 0 },
    strongAgainst: ['run', 'short'],
    weakAgainst: ['deep'],
    riskLevel: 3,
  },
  {
    id: 'def_cover1',
    name: 'Cover 1',
    type: 'man',
    description: 'Man coverage with a single high safety',
    blitzers: ['dl1', 'dl2'],
    coverageDepths: { dl1: 0, dl2: 0, lb: 5, cb1: 0, cb2: 0, ss: 0, fs: 25 },
    strongAgainst: ['short', 'run'],
    weakAgainst: ['deep'],
    riskLevel: 2,
  },
  {
    id: 'def_cover2',
    name: 'Cover 2',
    type: 'zone',
    description: 'Two deep safeties, corners in flats',
    blitzers: [],
    coverageDepths: { dl1: 2, dl2: 2, lb: 8, cb1: 5, cb2: 5, ss: 20, fs: 20 },
    strongAgainst: ['short', 'medium'],
    weakAgainst: ['deep', 'run'],
    riskLevel: 1,
  },
  {
    id: 'def_cover3',
    name: 'Cover 3',
    type: 'zone',
    description: 'Three deep zones, four underneath',
    blitzers: [],
    coverageDepths: { dl1: 2, dl2: 2, lb: 10, cb1: 20, cb2: 20, ss: 8, fs: 25 },
    strongAgainst: ['deep', 'medium'],
    weakAgainst: ['short', 'run'],
    riskLevel: 1,
  },
  {
    id: 'def_cover4',
    name: 'Cover 4',
    type: 'zone',
    description: 'Four deep zones, prevent the big play',
    blitzers: [],
    coverageDepths: { dl1: 2, dl2: 2, lb: 12, cb1: 22, cb2: 22, ss: 22, fs: 28 },
    strongAgainst: ['deep'],
    weakAgainst: ['short', 'run'],
    riskLevel: 1,
  },
  {
    id: 'def_tampa2',
    name: 'Tampa 2',
    type: 'zone',
    description: 'Cover 2 shell with the LB dropping deep middle',
    blitzers: [],
    coverageDepths: { dl1: 2, dl2: 2, lb: 18, cb1: 5, cb2: 5, ss: 20, fs: 20 },
    strongAgainst: ['medium', 'deep'],
    weakAgainst: ['run', 'short'],
    riskLevel: 1,
  },
  {
    id: 'def_zone_blitz',
    name: 'Zone Blitz',
    type: 'blitz',
    description: 'Blitz from unexpected spots, drop a lineman into coverage',
    blitzers: ['dl1', 'lb', 'ss'],
    coverageDepths: { dl1: 0, dl2: 8, lb: 0, cb1: 12, cb2: 12, ss: 0, fs: 22 },
    strongAgainst: ['medium', 'short'],
    weakAgainst: ['deep'],
    riskLevel: 2,
  },
  {
    id: 'def_man_blitz',
    name: 'Man Blitz',
    type: 'blitz',
    description: 'Man coverage with an extra rusher',
    blitzers: ['dl1', 'dl2', 'lb', 'ss'],
    coverageDepths: { dl1: 0, dl2: 0, lb: 0, cb1: 0, cb2: 0, ss: 0, fs: 18 },
    strongAgainst: ['short', 'run'],
    weakAgainst: ['deep'],
    riskLevel: 3,
  },
  {
    id: 'def_nickel',
    name: 'Nickel',
    type: 'zone',
    description: 'Extra DB for passing downs, balanced coverage',
    blitzers: [],
    coverageDepths: { dl1: 2, dl2: 2, lb: 7, cb1: 10, cb2: 10, ss: 15, fs: 22 },
    strongAgainst: ['medium', 'short'],
    weakAgainst: ['run'],
    riskLevel: 1,
  },
  {
    id: 'def_dime',
    name: 'Dime',
    type: 'zone',
    description: 'Maximum pass coverage for obvious passing downs',
    blitzers: [],
    coverageDepths: { dl1: 2, dl2: 2, lb: 12, cb1: 14, cb2: 14, ss: 18, fs: 25 },
    strongAgainst: ['deep', 'medium'],
    weakAgainst: ['run', 'short'],
    riskLevel: 1,
  },
];

// ---------------------------------------------------------------------------
// Visual Formation Picker Data
// ---------------------------------------------------------------------------

export interface FormationPickerEntry {
  formation: FormationType;
  label: string;
  playCount: number;
  categories: Array<OffensivePlay['category']>;
  avgDifficulty: number;
  preview: Vector3[];
}

function buildPickerEntries(): FormationPickerEntry[] {
  const types: FormationType[] = ['shotgun', 'iform', 'trips', 'spread', 'singleback'];
  return types.map((ft) => {
    const plays = PLAYBOOK_OFFENSE.filter((p) => p.formation === ft);
    const cats = [...new Set(plays.map((p) => p.category))];
    const avg = plays.length > 0
      ? plays.reduce((s, p) => s + p.difficulty, 0) / plays.length
      : 0;
    return {
      formation: ft,
      label: FORMATIONS[ft].name,
      playCount: plays.length,
      categories: cats,
      avgDifficulty: Math.round(avg * 10) / 10,
      preview: FORMATIONS[ft].preview,
    };
  });
}

export const FORMATION_PICKER: FormationPickerEntry[] = buildPickerEntries();

// ---------------------------------------------------------------------------
// Game Situation (input to AI)
// ---------------------------------------------------------------------------

export interface GameSituation {
  down: number;           // 1-4
  yardsToGo: number;
  yardLine: number;       // 0-100, distance to opponent end zone
  scoreDiff: number;      // positive = winning
  timeRemaining: number;  // seconds
  quarter: number;        // 1-4
}

// ---------------------------------------------------------------------------
// PlaybookSystem Class
// ---------------------------------------------------------------------------

export class PlaybookSystem {
  private offensivePlays: EnhancedOffensivePlay[];
  private defensivePlays: EnhancedDefensivePlay[];

  constructor(
    offensivePlays: EnhancedOffensivePlay[] = PLAYBOOK_OFFENSE,
    defensivePlays: EnhancedDefensivePlay[] = PLAYBOOK_DEFENSE,
  ) {
    this.offensivePlays = offensivePlays;
    this.defensivePlays = defensivePlays;
  }

  /** Get a formation definition by type */
  getFormation(type: FormationType): Formation {
    return FORMATIONS[type];
  }

  /** Get all offensive plays that use a given formation */
  getPlaysForFormation(type: FormationType): EnhancedOffensivePlay[] {
    return this.offensivePlays.filter((p) => p.formation === type);
  }

  /**
   * AI defensive play selection based on game situation.
   * Considers down, distance, field position, score differential, and time.
   */
  selectDefensivePlay(situation: GameSituation): EnhancedDefensivePlay {
    const scores = this.defensivePlays.map((play) => ({
      play,
      score: this.scoreDefensivePlay(play, situation),
    }));

    scores.sort((a, b) => b.score - a.score);

    // Top-2 weighted random to avoid being perfectly predictable
    const top = scores.slice(0, 2);
    const totalWeight = top.reduce((s, t) => s + t.score, 0);
    if (totalWeight <= 0) return scores[0].play;

    const roll = Math.random() * totalWeight;
    let acc = 0;
    for (const entry of top) {
      acc += entry.score;
      if (roll <= acc) return entry.play;
    }
    return scores[0].play;
  }

  /**
   * Recommend offensive plays for the current situation.
   * Returns up to `limit` plays sorted by relevance score descending.
   */
  getPlayRecommendations(situation: GameSituation, limit = 4): EnhancedOffensivePlay[] {
    const scored = this.offensivePlays.map((play) => ({
      play,
      score: this.scoreOffensivePlay(play, situation),
    }));
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, limit).map((s) => s.play);
  }

  // --- Private scoring helpers ---

  private scoreDefensivePlay(play: EnhancedDefensivePlay, sit: GameSituation): number {
    let score = 10;

    // Predict likely offensive category from situation
    const likelyCategory = this.predictOffensiveCategory(sit);

    if (play.strongAgainst.includes(likelyCategory)) score += 8;
    if (play.weakAgainst.includes(likelyCategory)) score -= 6;

    // Short yardage: favor blitzes and man
    if (sit.yardsToGo <= 3) {
      if (play.type === 'blitz') score += 5;
      if (play.type === 'man') score += 3;
    }

    // Long yardage: favor deep zones
    if (sit.yardsToGo >= 15) {
      if (play.id === 'def_cover4' || play.id === 'def_cover3') score += 5;
      if (play.type === 'blitz') score -= 3;
    }

    // 4th down: aggressive
    if (sit.down === 4) {
      if (play.type === 'blitz') score += 4;
    }

    // Losing late: take risks
    if (sit.scoreDiff < 0 && sit.timeRemaining < 120) {
      score += play.riskLevel * 2;
    }

    // Winning late: play safe prevent
    if (sit.scoreDiff > 0 && sit.timeRemaining < 120) {
      if (play.id === 'def_cover4') score += 6;
      if (play.type === 'blitz') score -= 4;
    }

    // Red zone offense (opponent close to scoring): tighten coverage
    if (sit.yardLine <= 20) {
      if (play.type === 'zone') score += 2;
    }

    return Math.max(score, 0);
  }

  private scoreOffensivePlay(play: EnhancedOffensivePlay, sit: GameSituation): number {
    let score = 10;

    // Category fit for situation
    const needed = this.predictOffensiveCategory(sit);
    if (play.category === needed) score += 10;

    // Short yardage: prefer safe/short/run
    if (sit.yardsToGo <= 3) {
      if (play.category === 'short' || play.category === 'run') score += 5;
      if (play.tags.includes('safe')) score += 3;
    }

    // Long yardage: deep or medium
    if (sit.yardsToGo >= 15) {
      if (play.category === 'deep') score += 6;
      if (play.category === 'medium') score += 3;
      if (play.category === 'run') score -= 4;
    }

    // 4th down short: safe plays
    if (sit.down === 4 && sit.yardsToGo <= 3) {
      if (play.tags.includes('safe')) score += 5;
      if (play.difficulty === 1) score += 3;
    }

    // Losing late: aggressive
    if (sit.scoreDiff < -7 && sit.timeRemaining < 180) {
      if (play.category === 'deep') score += 6;
      if (play.tempo === 'hurry') score += 3;
    }

    // Winning late: run clock
    if (sit.scoreDiff > 7 && sit.timeRemaining < 180) {
      if (play.category === 'run') score += 8;
      if (play.tempo === 'slow') score += 3;
    }

    // Red zone: short passes and runs
    if (sit.yardLine <= 10) {
      if (play.category === 'short' || play.category === 'run') score += 4;
      if (play.category === 'deep') score -= 4;
    }

    // Penalize high difficulty on early downs
    if (sit.down <= 2 && play.difficulty === 3) score -= 2;

    return Math.max(score, 0);
  }

  private predictOffensiveCategory(sit: GameSituation): OffensivePlay['category'] {
    // Short yardage situations
    if (sit.yardsToGo <= 3) return 'run';

    // Long yardage
    if (sit.yardsToGo >= 15) return 'deep';

    // Medium yardage
    if (sit.yardsToGo >= 7) return 'medium';

    // Default to short for manageable distances
    return 'short';
  }
}
