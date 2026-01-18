/**
 * BuildingSystem - Maps file path events to city building upgrades
 *
 * Core concept: Claude Code agent activity (file edits, task completions)
 * drive the upgrade of buildings in the city visualization.
 *
 * Buildings:
 * - townhall:  Config/root files - the command center
 * - workshop:  src/core - where core logic is forged
 * - market:    src/ui - where interfaces are traded
 * - barracks:  tests - where code is battle-tested
 * - stables:   workers/src/api - external integrations
 * - library:   docs - knowledge storage
 *
 * Tiers:
 * - Tier 0: Foundation (0-2 completions)
 * - Tier 1: Built (3-7 completions)
 * - Tier 2: Upgraded (8+ completions)
 */

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export type BuildingKind = 'townhall' | 'workshop' | 'market' | 'barracks' | 'stables' | 'library';
export type Tier = 0 | 1 | 2;

export interface BuildingState {
  kind: BuildingKind;
  tier: Tier;
  completions: number;
  lastUpdate: number;
  files: string[];
}

export interface CityState {
  buildings: Record<BuildingKind, BuildingState>;
  totalCompletions: number;
  lastUpdate: number;
}

export interface BuildingConfig {
  kind: BuildingKind;
  name: string;
  description: string;
  tierNames: [string, string, string];
  gridPosition: { x: number; y: number };
  color: string;
}

/**
 * Building gameplay function configuration
 */
export interface BuildingFunction {
  kind: BuildingKind;
  passiveEffect: string;
  activeEffect: string;
  tierBonuses: [string, string, string];
  upgradeCost: [number, number, number]; // Intel cost per tier
}

/**
 * Building modifiers that affect gameplay systems
 */
export interface BuildingModifiers {
  passiveIntelPerMin: number;      // Town Hall
  taskDurationMultiplier: number;  // Workshop (lower = faster)
  momentumBonus: number;           // Market
  analystCapacity: number;         // Barracks
  refreshRateBonus: number;        // Stables (seconds)
  influenceMultiplier: number;     // Library
}

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────

/**
 * Path prefix to building kind mapping.
 * More specific paths are checked first (order matters).
 */
export const PATH_TO_BUILDING: [string, BuildingKind][] = [
  // Core logic
  ['src/core', 'workshop'],
  ['core/', 'workshop'],

  // UI components
  ['src/ui', 'market'],
  ['src/components', 'market'],
  ['components/', 'market'],
  ['ui/', 'market'],

  // Tests
  ['tests/', 'barracks'],
  ['test/', 'barracks'],
  ['__tests__/', 'barracks'],
  ['spec/', 'barracks'],
  ['.test.', 'barracks'],
  ['.spec.', 'barracks'],

  // External integrations
  ['src/api', 'stables'],
  ['workers/', 'stables'],
  ['api/', 'stables'],
  ['functions/', 'stables'],

  // Documentation
  ['docs/', 'library'],
  ['doc/', 'library'],
  ['.md', 'library'],
  ['README', 'library'],

  // Config/root (catch-all for root files)
  ['config/', 'townhall'],
  ['.config.', 'townhall'],
  ['package.json', 'townhall'],
  ['tsconfig', 'townhall'],
  ['wrangler.toml', 'townhall'],
];

/**
 * Building configurations with display info
 */
export const BUILDING_CONFIGS: Record<BuildingKind, BuildingConfig> = {
  townhall: {
    kind: 'townhall',
    name: 'Town Hall',
    description: 'Command center for configuration',
    tierNames: ['Foundation', 'Town Hall', 'Citadel'],
    gridPosition: { x: 2, y: 2 },
    color: '#FFD700',
  },
  workshop: {
    kind: 'workshop',
    name: 'Workshop',
    description: 'Core logic forge',
    tierNames: ['Shack', 'Workshop', 'Foundry'],
    gridPosition: { x: 1, y: 1 },
    color: '#BF5700',
  },
  market: {
    kind: 'market',
    name: 'Market',
    description: 'UI component marketplace',
    tierNames: ['Stall', 'Market', 'Bazaar'],
    gridPosition: { x: 3, y: 1 },
    color: '#2ECC71',
  },
  barracks: {
    kind: 'barracks',
    name: 'Barracks',
    description: 'Test battle grounds',
    tierNames: ['Camp', 'Barracks', 'Fortress'],
    gridPosition: { x: 0, y: 2 },
    color: '#E74C3C',
  },
  stables: {
    kind: 'stables',
    name: 'Stables',
    description: 'API & worker integration',
    tierNames: ['Pen', 'Stables', 'Embassy'],
    gridPosition: { x: 4, y: 2 },
    color: '#3498DB',
  },
  library: {
    kind: 'library',
    name: 'Library',
    description: 'Documentation archive',
    tierNames: ['Shelf', 'Library', 'Academy'],
    gridPosition: { x: 2, y: 3 },
    color: '#9B59B6',
  },
};

/**
 * Tier thresholds
 */
export const TIER_THRESHOLDS = {
  TIER_1: 3,
  TIER_2: 8,
};

/**
 * Building gameplay functions
 */
export const BUILDING_FUNCTIONS: Record<BuildingKind, BuildingFunction> = {
  townhall: {
    kind: 'townhall',
    passiveEffect: 'Generates Intel passively',
    activeEffect: 'Unlocks dashboard slots',
    tierBonuses: ['+1 Intel/min', '+2 Intel/min', '+3 Intel/min'],
    upgradeCost: [25, 75, 150],
  },
  workshop: {
    kind: 'workshop',
    passiveEffect: 'Reduces task duration',
    activeEffect: 'Analytics lab boosts research',
    tierBonuses: ['-10% task time', '-20% task time', '-30% task time'],
    upgradeCost: [30, 100, 200],
  },
  market: {
    kind: 'market',
    passiveEffect: 'Boosts Momentum from odds',
    activeEffect: 'Trade hub for predictions',
    tierBonuses: ['+20% Momentum', '+40% Momentum', '+60% Momentum'],
    upgradeCost: [20, 60, 120],
  },
  barracks: {
    kind: 'barracks',
    passiveEffect: 'Increases analyst capacity',
    activeEffect: 'Operations center',
    tierBonuses: ['+1 analyst', '+2 analysts', '+3 analysts'],
    upgradeCost: [35, 100, 200],
  },
  stables: {
    kind: 'stables',
    passiveEffect: 'Faster data refresh',
    activeEffect: 'Scout network for alerts',
    tierBonuses: ['-5s refresh', '-10s refresh', '-15s refresh'],
    upgradeCost: [25, 75, 150],
  },
  library: {
    kind: 'library',
    passiveEffect: 'Boosts Influence generation',
    activeEffect: 'Research archive for unlocks',
    tierBonuses: ['+10% Influence', '+20% Influence', '+30% Influence'],
    upgradeCost: [30, 90, 180],
  },
};

/**
 * Calculate building modifiers from current city state
 */
export function calculateBuildingModifiers(state: CityState): BuildingModifiers {
  const buildings = state.buildings;

  return {
    // Town Hall: +1/+2/+3 Intel per minute
    passiveIntelPerMin: buildings.townhall.tier,

    // Workshop: 1.0 / 0.9 / 0.8 / 0.7 multiplier
    taskDurationMultiplier: 1 - buildings.workshop.tier * 0.1,

    // Market: 0% / 20% / 40% / 60% bonus
    momentumBonus: buildings.market.tier * 0.2,

    // Barracks: 2 + tier
    analystCapacity: 2 + buildings.barracks.tier,

    // Stables: 0 / 5 / 10 / 15 seconds faster
    refreshRateBonus: buildings.stables.tier * 5,

    // Library: 1.0 / 1.1 / 1.2 / 1.3 multiplier
    influenceMultiplier: 1 + buildings.library.tier * 0.1,
  };
}

/**
 * Get upgrade cost for a building at its current tier
 */
export function getUpgradeCost(kind: BuildingKind, currentTier: Tier): number | null {
  if (currentTier >= 2) return null; // Max tier
  return BUILDING_FUNCTIONS[kind].upgradeCost[currentTier];
}

/**
 * Get the bonus description for a tier
 */
export function getTierBonusDescription(kind: BuildingKind, tier: Tier): string {
  if (tier === 0) return 'No bonus yet';
  return BUILDING_FUNCTIONS[kind].tierBonuses[tier - 1];
}

// ─────────────────────────────────────────────────────────────
// Functions
// ─────────────────────────────────────────────────────────────

/**
 * Determine building kind from a file path
 */
export function getBuildingFromPath(filePath: string): BuildingKind {
  const normalizedPath = filePath.toLowerCase().replace(/\\/g, '/');

  for (const [pattern, kind] of PATH_TO_BUILDING) {
    if (normalizedPath.includes(pattern.toLowerCase())) {
      return kind;
    }
  }

  // Default to townhall for unmatched root files
  return 'townhall';
}

/**
 * Calculate tier from completion count
 */
export function getTier(completions: number): Tier {
  if (completions >= TIER_THRESHOLDS.TIER_2) return 2;
  if (completions >= TIER_THRESHOLDS.TIER_1) return 1;
  return 0;
}

/**
 * Get progress to next tier (0-1)
 */
export function getTierProgress(completions: number): number {
  const currentTier = getTier(completions);

  if (currentTier === 2) {
    // Max tier - show full progress
    return 1;
  }

  if (currentTier === 0) {
    // Progress toward tier 1
    return completions / TIER_THRESHOLDS.TIER_1;
  }

  // Progress toward tier 2
  const progressInTier = completions - TIER_THRESHOLDS.TIER_1;
  const tierRange = TIER_THRESHOLDS.TIER_2 - TIER_THRESHOLDS.TIER_1;
  return progressInTier / tierRange;
}

/**
 * Create initial city state
 */
export function createInitialCityState(): CityState {
  const buildings: Record<BuildingKind, BuildingState> = {} as Record<BuildingKind, BuildingState>;

  for (const kind of Object.keys(BUILDING_CONFIGS) as BuildingKind[]) {
    buildings[kind] = {
      kind,
      tier: 0,
      completions: 0,
      lastUpdate: Date.now(),
      files: [],
    };
  }

  return {
    buildings,
    totalCompletions: 0,
    lastUpdate: Date.now(),
  };
}

/**
 * Process a task completion event and update city state
 */
export function processTaskCompletion(
  state: CityState,
  files: string[]
): { state: CityState; upgrades: BuildingKind[] } {
  const upgrades: BuildingKind[] = [];
  const newState = { ...state, buildings: { ...state.buildings } };

  // Track which buildings were affected
  const affectedBuildings = new Set<BuildingKind>();

  for (const file of files) {
    const buildingKind = getBuildingFromPath(file);
    affectedBuildings.add(buildingKind);

    const building = { ...newState.buildings[buildingKind] };
    const oldTier = building.tier;

    building.completions += 1;
    building.lastUpdate = Date.now();
    building.files = [...building.files.slice(-9), file]; // Keep last 10 files
    building.tier = getTier(building.completions);

    newState.buildings[buildingKind] = building;

    // Check for upgrade
    if (building.tier > oldTier) {
      upgrades.push(buildingKind);
    }
  }

  newState.totalCompletions += files.length;
  newState.lastUpdate = Date.now();

  return { state: newState, upgrades };
}

/**
 * Serialize city state for storage
 */
export function serializeCityState(state: CityState): string {
  return JSON.stringify(state);
}

/**
 * Deserialize city state from storage
 */
export function deserializeCityState(json: string): CityState | null {
  try {
    const parsed = JSON.parse(json);
    // Validate structure
    if (parsed && typeof parsed.buildings === 'object' && typeof parsed.totalCompletions === 'number') {
      return parsed as CityState;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Get display name for a building at its current tier
 */
export function getBuildingDisplayName(kind: BuildingKind, tier: Tier): string {
  return BUILDING_CONFIGS[kind].tierNames[tier];
}

/**
 * Calculate "city level" based on total building tiers
 */
export function getCityLevel(state: CityState): number {
  let totalTiers = 0;
  for (const building of Object.values(state.buildings)) {
    totalTiers += building.tier;
  }
  // Max level = 6 buildings × 2 max tier = 12
  // Level 1 = 0-2, Level 2 = 3-5, etc.
  return Math.floor(totalTiers / 2) + 1;
}
