/**
 * Blaze Blitz Football - Original Team Definitions
 *
 * 100% Original IP - No NFL content
 * Generic team names without city affiliations
 */

/** Team interface */
export interface BlitzTeam {
  id: string;
  name: string;
  shortName: string;
  mascot: string;
  description: string;

  // Visual properties
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  helmetColor: string;

  // Team stats (affect AI behavior when playing against)
  offense: number; // 1-10: Affects QB accuracy, WR speed
  defense: number; // 1-10: Affects DB coverage, pass rush
  speed: number; // 1-10: Overall team speed
  power: number; // 1-10: Tackle strength, blocking

  // Special ability
  specialAbility: {
    name: string;
    description: string;
    effect: string;
  };
}

/** Home team - Blaze Firebirds (player's team) */
export const FIREBIRDS: BlitzTeam = {
  id: 'team_firebirds',
  name: 'Blaze Firebirds',
  shortName: 'FIRE',
  mascot: 'Phoenix',
  description: 'Rising from the flames with explosive offense and fiery determination.',

  primaryColor: '#BF5700', // Burnt orange
  secondaryColor: '#FF6B35', // Ember
  accentColor: '#C9A227', // Gold
  helmetColor: '#BF5700',

  offense: 8,
  defense: 6,
  speed: 8,
  power: 7,

  specialAbility: {
    name: 'Phoenix Rising',
    description: 'Turbo regenerates 50% faster when behind',
    effect: 'turbo_regen',
  },
};

/** Away team - Shadow Wolves (AI opponent) */
export const SHADOW_WOLVES: BlitzTeam = {
  id: 'team_wolves',
  name: 'Shadow Wolves',
  shortName: 'WOLF',
  mascot: 'Wolf',
  description: 'A relentless pack that hunts quarterbacks and terrorizes offenses.',

  primaryColor: '#1A1A1A', // Midnight
  secondaryColor: '#4169E1', // Royal blue
  accentColor: '#C0C0C0', // Silver
  helmetColor: '#1A1A1A',

  offense: 6,
  defense: 9,
  speed: 7,
  power: 8,

  specialAbility: {
    name: 'Pack Hunter',
    description: 'Defenders converge 25% faster on ball carrier',
    effect: 'pack_hunt',
  },
};

/** Additional unlockable teams */
export const UNLOCKABLE_TEAMS: BlitzTeam[] = [
  {
    id: 'team_thunder',
    name: 'Storm Thunder',
    shortName: 'THDR',
    mascot: 'Lightning Bolt',
    description: 'Electrifying speed that strikes before you can react.',

    primaryColor: '#FFD700', // Gold/Yellow
    secondaryColor: '#000080', // Navy
    accentColor: '#FFFFFF', // White
    helmetColor: '#FFD700',

    offense: 9,
    defense: 5,
    speed: 10,
    power: 5,

    specialAbility: {
      name: 'Lightning Strike',
      description: 'Big plays (20+ yards) give 2x bonus points',
      effect: 'big_play_bonus',
    },
  },
  {
    id: 'team_ironclad',
    name: 'Iron Titans',
    shortName: 'IRON',
    mascot: 'Titan',
    description: 'An unstoppable ground game built on raw power.',

    primaryColor: '#4A4A4A', // Iron gray
    secondaryColor: '#8B0000', // Dark red
    accentColor: '#C0C0C0', // Silver
    helmetColor: '#4A4A4A',

    offense: 7,
    defense: 7,
    speed: 5,
    power: 10,

    specialAbility: {
      name: 'Iron Will',
      description: 'Cannot be tackled for loss on first contact',
      effect: 'no_tfl',
    },
  },
  {
    id: 'team_vipers',
    name: 'Venom Vipers',
    shortName: 'VIPE',
    mascot: 'Viper',
    description: 'Quick-strike offense that leaves opponents paralyzed.',

    primaryColor: '#228B22', // Forest green
    secondaryColor: '#000000', // Black
    accentColor: '#FFD700', // Gold fangs
    helmetColor: '#228B22',

    offense: 8,
    defense: 8,
    speed: 9,
    power: 6,

    specialAbility: {
      name: 'Venom Strike',
      description: 'Stiff-arms have 100% success rate',
      effect: 'super_stiff_arm',
    },
  },
];

/** Get all teams */
export function getAllTeams(): BlitzTeam[] {
  return [FIREBIRDS, SHADOW_WOLVES, ...UNLOCKABLE_TEAMS];
}

/** Get team by ID */
export function getTeamById(id: string): BlitzTeam | undefined {
  return getAllTeams().find((team) => team.id === id);
}

/** Get player selectable teams (home teams) */
export function getPlayableTeams(): BlitzTeam[] {
  return [FIREBIRDS, ...UNLOCKABLE_TEAMS];
}

/** Get AI opponent teams */
export function getOpponentTeams(): BlitzTeam[] {
  return [SHADOW_WOLVES, ...UNLOCKABLE_TEAMS];
}

/** Player position definitions for 7-on-7 */
export interface PlayerPosition {
  id: string;
  name: string;
  shortName: string;
  role: 'offense' | 'defense';
  defaultX: number; // Relative to ball/line of scrimmage
  defaultZ: number; // Relative to center of field
}

/** Offensive positions (7 players) */
export const OFFENSIVE_POSITIONS: PlayerPosition[] = [
  { id: 'qb', name: 'Quarterback', shortName: 'QB', role: 'offense', defaultX: -5, defaultZ: 0 },
  { id: 'rb', name: 'Running Back', shortName: 'RB', role: 'offense', defaultX: -7, defaultZ: 0 },
  {
    id: 'wr1',
    name: 'Wide Receiver 1',
    shortName: 'WR',
    role: 'offense',
    defaultX: 0,
    defaultZ: 20,
  },
  {
    id: 'wr2',
    name: 'Wide Receiver 2',
    shortName: 'WR',
    role: 'offense',
    defaultX: 0,
    defaultZ: -20,
  },
  { id: 'wr3', name: 'Slot Receiver', shortName: 'SL', role: 'offense', defaultX: -1, defaultZ: 8 },
  { id: 'te', name: 'Tight End', shortName: 'TE', role: 'offense', defaultX: -1, defaultZ: -8 },
  { id: 'c', name: 'Center', shortName: 'C', role: 'offense', defaultX: 0, defaultZ: 0 },
];

/** Defensive positions (7 players) */
export const DEFENSIVE_POSITIONS: PlayerPosition[] = [
  {
    id: 'dl1',
    name: 'Defensive Line 1',
    shortName: 'DL',
    role: 'defense',
    defaultX: 1,
    defaultZ: -3,
  },
  {
    id: 'dl2',
    name: 'Defensive Line 2',
    shortName: 'DL',
    role: 'defense',
    defaultX: 1,
    defaultZ: 3,
  },
  { id: 'lb', name: 'Linebacker', shortName: 'LB', role: 'defense', defaultX: 4, defaultZ: 0 },
  { id: 'cb1', name: 'Cornerback 1', shortName: 'CB', role: 'defense', defaultX: 2, defaultZ: 18 },
  { id: 'cb2', name: 'Cornerback 2', shortName: 'CB', role: 'defense', defaultX: 2, defaultZ: -18 },
  { id: 'ss', name: 'Strong Safety', shortName: 'SS', role: 'defense', defaultX: 8, defaultZ: 6 },
  { id: 'fs', name: 'Free Safety', shortName: 'FS', role: 'defense', defaultX: 12, defaultZ: 0 },
];
