/**
 * Blaze Backyard Baseball - Field/Environment Configuration
 *
 * 100% Original IP - Unique backyard themed stadiums
 * Each field has different dimensions and visual themes
 */

/** Field theme types */
export type FieldTheme =
  | 'classic'    // Traditional backyard
  | 'beach'      // Sandy beach field
  | 'treehouse'  // Elevated treehouse platform
  | 'junkyard'   // Industrial junkyard
  | 'rooftop'    // City rooftop
  | 'farm';      // Rural farm field

/** Field configuration interface */
export interface BackyardFieldConfig {
  id: string;
  name: string;
  description: string;
  theme: FieldTheme;

  // Field dimensions (in meters)
  dimensions: {
    leftField: number;
    centerField: number;
    rightField: number;
    foulLineLength: number;
  };

  // Visual configuration
  visuals: {
    grassColor: string;
    dirtColor: string;
    skyColor: string;
    ambientIntensity: number;
  };

  // Environmental hazards/bonuses
  environmentalEffects: {
    name: string;
    description: string;
    effect: 'bonus' | 'hazard';
    triggerZone?: string;
  }[];

  // Unlock requirements
  unlockRequirement?: {
    type: 'score' | 'games' | 'homeRuns' | 'default';
    value: number;
  };
}

/** Default starting fields */
export const STARTER_FIELDS: BackyardFieldConfig[] = [
  {
    id: 'field_blaze_001',
    name: 'Dusty Acres Backyard',
    description: 'A classic Texas backyard with a worn-in diamond. Where legends start.',
    theme: 'classic',
    dimensions: {
      leftField: 35,
      centerField: 45,
      rightField: 35,
      foulLineLength: 50,
    },
    visuals: {
      grassColor: '#228B22',
      dirtColor: '#8B4513',
      skyColor: '#87CEEB',
      ambientIntensity: 0.5,
    },
    environmentalEffects: [
      {
        name: 'Home Field Advantage',
        description: 'The familiar surroundings help you focus. +5% to contact.',
        effect: 'bonus',
      },
    ],
    unlockRequirement: { type: 'default', value: 0 },
  },
  {
    id: 'field_blaze_002',
    name: 'Sunset Beach Diamond',
    description: 'Sandy basepaths along the coast. Home runs splash into the waves.',
    theme: 'beach',
    dimensions: {
      leftField: 32,
      centerField: 40,
      rightField: 32,
      foulLineLength: 45,
    },
    visuals: {
      grassColor: '#90EE90',
      dirtColor: '#F4A460',
      skyColor: '#FF7F50',
      ambientIntensity: 0.6,
    },
    environmentalEffects: [
      {
        name: 'Ocean Breeze',
        description: 'Wind from the sea pushes fly balls toward center field.',
        effect: 'bonus',
        triggerZone: 'center',
      },
      {
        name: 'Sandy Footing',
        description: 'The soft sand slows down ground balls.',
        effect: 'hazard',
        triggerZone: 'infield',
      },
    ],
    unlockRequirement: { type: 'default', value: 0 },
  },
];

/** Unlockable fields */
export const UNLOCKABLE_FIELDS: BackyardFieldConfig[] = [
  {
    id: 'field_blaze_003',
    name: 'Treehouse Heights',
    description: 'An elevated platform among giant oaks. Balls that fall off the edge are home runs!',
    theme: 'treehouse',
    dimensions: {
      leftField: 28,
      centerField: 35,
      rightField: 28,
      foulLineLength: 40,
    },
    visuals: {
      grassColor: '#3CB371',
      dirtColor: '#654321',
      skyColor: '#87CEEB',
      ambientIntensity: 0.4,
    },
    environmentalEffects: [
      {
        name: 'Edge of Glory',
        description: 'Balls that clear the platform edge count as home runs, even if short.',
        effect: 'bonus',
        triggerZone: 'outfield',
      },
      {
        name: 'Tricky Branches',
        description: 'High fly balls might hit tree branches and drop unpredictably.',
        effect: 'hazard',
        triggerZone: 'upper',
      },
    ],
    unlockRequirement: { type: 'games', value: 5 },
  },
  {
    id: 'field_blaze_004',
    name: 'Rusty\'s Junkyard',
    description: 'A diamond carved out between car stacks. Hit the bonus targets for extra points!',
    theme: 'junkyard',
    dimensions: {
      leftField: 38,
      centerField: 48,
      rightField: 38,
      foulLineLength: 55,
    },
    visuals: {
      grassColor: '#556B2F',
      dirtColor: '#696969',
      skyColor: '#708090',
      ambientIntensity: 0.3,
    },
    environmentalEffects: [
      {
        name: 'Bonus Targets',
        description: 'Hit the stacked cars in the outfield for bonus 50 points.',
        effect: 'bonus',
        triggerZone: 'targets',
      },
      {
        name: 'Unpredictable Bounces',
        description: 'Balls that hit junk piles bounce wildly.',
        effect: 'hazard',
        triggerZone: 'ground',
      },
    ],
    unlockRequirement: { type: 'score', value: 3000 },
  },
  {
    id: 'field_blaze_005',
    name: 'Downtown Rooftop',
    description: 'A converted rooftop with city skyline views. Don\'t hit it into the street!',
    theme: 'rooftop',
    dimensions: {
      leftField: 30,
      centerField: 38,
      rightField: 30,
      foulLineLength: 42,
    },
    visuals: {
      grassColor: '#228B22',
      dirtColor: '#808080',
      skyColor: '#1E90FF',
      ambientIntensity: 0.5,
    },
    environmentalEffects: [
      {
        name: 'Rooftop Blast',
        description: 'Balls that clear the building count as grand slam home runs (4x points).',
        effect: 'bonus',
        triggerZone: 'deep_outfield',
      },
      {
        name: 'Ventilation Units',
        description: 'AC units on the roof can deflect line drives.',
        effect: 'hazard',
        triggerZone: 'line_drive',
      },
    ],
    unlockRequirement: { type: 'homeRuns', value: 15 },
  },
  {
    id: 'field_blaze_006',
    name: 'Old MacDonald\'s Farm',
    description: 'A rural farm field with a corn maze outfield. Hit it into the corn for doubles!',
    theme: 'farm',
    dimensions: {
      leftField: 40,
      centerField: 52,
      rightField: 40,
      foulLineLength: 60,
    },
    visuals: {
      grassColor: '#7CFC00',
      dirtColor: '#8B4513',
      skyColor: '#87CEEB',
      ambientIntensity: 0.55,
    },
    environmentalEffects: [
      {
        name: 'Corn Maze Hit',
        description: 'Balls lost in the corn count as automatic doubles.',
        effect: 'bonus',
        triggerZone: 'corn',
      },
      {
        name: 'Roaming Animals',
        description: 'Occasionally a cow or chicken wanders onto the field.',
        effect: 'hazard',
        triggerZone: 'random',
      },
    ],
    unlockRequirement: { type: 'games', value: 15 },
  },
];

/** Secret/special fields */
export const SECRET_FIELDS: BackyardFieldConfig[] = [
  {
    id: 'field_blaze_secret_001',
    name: 'Blaze Stadium',
    description: 'The official Blaze Sports Intel stadium. Where champions are made.',
    theme: 'classic',
    dimensions: {
      leftField: 36,
      centerField: 44,
      rightField: 36,
      foulLineLength: 50,
    },
    visuals: {
      grassColor: '#228B22',
      dirtColor: '#BF5700', // Burnt orange dirt!
      skyColor: '#1A1A1A',
      ambientIntensity: 0.7,
    },
    environmentalEffects: [
      {
        name: 'Championship Atmosphere',
        description: 'The crowd energy boosts all scoring by 10%.',
        effect: 'bonus',
      },
      {
        name: 'Bright Lights',
        description: 'Stadium lights create the perfect visibility.',
        effect: 'bonus',
      },
    ],
    unlockRequirement: { type: 'score', value: 15000 },
  },
];

/** Get all fields */
export function getAllFields(): BackyardFieldConfig[] {
  return [...STARTER_FIELDS, ...UNLOCKABLE_FIELDS, ...SECRET_FIELDS];
}

/** Get field by ID */
export function getFieldById(id: string): BackyardFieldConfig | undefined {
  return getAllFields().find((field) => field.id === id);
}

/** Check if field is unlocked based on player stats */
export function isFieldUnlocked(
  field: BackyardFieldConfig,
  playerStats: {
    highScore: number;
    gamesPlayed: number;
    totalHomeRuns: number;
  }
): boolean {
  const req = field.unlockRequirement;
  if (!req || req.type === 'default') return true;

  switch (req.type) {
    case 'score':
      return playerStats.highScore >= req.value;
    case 'games':
      return playerStats.gamesPlayed >= req.value;
    case 'homeRuns':
      return playerStats.totalHomeRuns >= req.value;
    default:
      return false;
  }
}

/** Get unlock progress for a field */
export function getFieldUnlockProgress(
  field: BackyardFieldConfig,
  playerStats: {
    highScore: number;
    gamesPlayed: number;
    totalHomeRuns: number;
  }
): { current: number; required: number; percent: number } {
  const req = field.unlockRequirement;
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
    default:
      current = 0;
  }

  return {
    current,
    required: req.value,
    percent: Math.min(100, Math.floor((current / req.value) * 100)),
  };
}

/** Get default field */
export function getDefaultField(): BackyardFieldConfig {
  return STARTER_FIELDS[0];
}
