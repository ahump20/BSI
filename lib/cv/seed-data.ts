/**
 * Research-validated baseline data for pitcher biomechanics.
 *
 * Sources:
 * - Fleisig et al. (2011) "Biomechanics of overhand throwing" — ASMI
 * - Driveline Baseball (2023) pitch design research
 * - MLB Statcast public leaderboards (2024 season averages)
 */

// ---------------------------------------------------------------------------
// Pitcher Archetype Baselines
// ---------------------------------------------------------------------------

export interface PitcherArchetypeBaseline {
  archetype: string;
  armSlotAngleRange: [number, number]; // degrees
  typicalStrideLengthPct: [number, number]; // % of height
  avgVelocity: [number, number]; // mph range
  normalVelocityDeltaByPitchCount: Record<string, number>; // pitch range → expected mph drop
}

export const PITCHER_ARCHETYPES: PitcherArchetypeBaseline[] = [
  {
    archetype: 'overhand',
    armSlotAngleRange: [75, 85],
    typicalStrideLengthPct: [80, 87],
    avgVelocity: [91, 97],
    normalVelocityDeltaByPitchCount: {
      '0-30': 0,
      '31-60': 0.3,
      '61-80': 0.7,
      '81-100': 1.2,
      '101-120': 1.8,
      '121+': 2.5,
    },
  },
  {
    archetype: 'three-quarter',
    armSlotAngleRange: [55, 70],
    typicalStrideLengthPct: [78, 85],
    avgVelocity: [89, 95],
    normalVelocityDeltaByPitchCount: {
      '0-30': 0,
      '31-60': 0.4,
      '61-80': 0.8,
      '81-100': 1.3,
      '101-120': 2.0,
      '121+': 2.8,
    },
  },
  {
    archetype: 'sidearm',
    armSlotAngleRange: [20, 40],
    typicalStrideLengthPct: [75, 82],
    avgVelocity: [84, 91],
    normalVelocityDeltaByPitchCount: {
      '0-30': 0,
      '31-60': 0.3,
      '61-80': 0.6,
      '81-100': 1.0,
      '101-120': 1.6,
      '121+': 2.2,
    },
  },
];

// ---------------------------------------------------------------------------
// Global Biomechanics Norms (Fleisig et al.)
// ---------------------------------------------------------------------------

export const BIOMECHANICS_NORMS = {
  /** Stride length as percentage of pitcher height. Fleisig et al. (2011) */
  strideLengthPctRange: [77, 87],

  /** Max shoulder external rotation (degrees). ASMI normative data. */
  shoulderExternalRotationRange: [170, 185],

  /** Hip-shoulder separation at foot contact (degrees). Higher = more elastic energy stored. */
  hipShoulderSeparationRange: [40, 60],

  /** Release point consistency — under 2 inches variation considered stable */
  releasePointStableThreshold: 2.0,

  /** Velocity delta beyond which fatigue is biomechanically significant */
  significantVelocityDrop: 2.0,

  /** ACWR safe zone */
  acwrSafeRange: [0.8, 1.3] as [number, number],

  /** ACWR danger zone */
  acwrDangerThreshold: 1.5,
} as const;

// ---------------------------------------------------------------------------
// CV Adoption Data (for cv_adoption_tracker seeding)
// ---------------------------------------------------------------------------

export interface CVAdoptionSeed {
  sport: string;
  league: string;
  team: string;
  technologyName: string;
  vendor: string;
  deploymentStatus: 'deployed' | 'pilot' | 'announced' | 'rumored';
  cameraCount: number | null;
  capabilities: string[];
  sourceUrl: string;
  verifiedDate: string;
  notes: string | null;
}

export const CV_ADOPTION_SEEDS: CVAdoptionSeed[] = [
  // MLB — Hawk-Eye
  {
    sport: 'mlb',
    league: 'MLB',
    team: 'League-wide (30 stadiums)',
    technologyName: 'Hawk-Eye Innovations',
    vendor: 'Sony / Hawk-Eye',
    deploymentStatus: 'deployed',
    cameraCount: 12,
    capabilities: ['pitch-tracking', 'ball-flight', 'player-tracking', 'strike-zone'],
    sourceUrl: 'https://technology.mlblogs.com/hawk-eye-statcast-era-f39fa3205503',
    verifiedDate: '2024-03-01',
    notes: 'Replaced TrackMan as primary tracking system starting 2020 season',
  },
  // MLB — KinaTrax
  {
    sport: 'mlb',
    league: 'MLB',
    team: 'Select stadiums (~20)',
    technologyName: 'KinaTrax',
    vendor: 'KinaTrax',
    deploymentStatus: 'deployed',
    cameraCount: 8,
    capabilities: ['markerless-motion-capture', 'biomechanics', 'joint-angles', 'injury-prevention'],
    sourceUrl: 'https://www.kinatrax.com/baseball',
    verifiedDate: '2024-06-01',
    notes: 'Markerless biomechanics capture at game speed — primary source for arm slot and stride data',
  },
  // NFL — Digital Athlete
  {
    sport: 'nfl',
    league: 'NFL',
    team: 'League-wide (32 teams)',
    technologyName: 'NFL Digital Athlete / AWS Next Gen Stats',
    vendor: 'Amazon Web Services',
    deploymentStatus: 'deployed',
    cameraCount: 38,
    capabilities: ['player-tracking', 'formation-detection', 'speed-distance', 'expected-yards'],
    sourceUrl: 'https://nextgenstats.nfl.com',
    verifiedDate: '2024-09-01',
    notes: 'Zebra RFID chips in shoulder pads + optical tracking. 38 cameras per stadium.',
  },
  // NCAA Football — Catapult
  {
    sport: 'ncaafb',
    league: 'NCAA FBS',
    team: 'Select P5 programs',
    technologyName: 'Catapult Vector',
    vendor: 'Catapult Sports',
    deploymentStatus: 'deployed',
    cameraCount: null,
    capabilities: ['gps-tracking', 'accelerometer', 'player-load', 'workload-management'],
    sourceUrl: 'https://www.catapultsports.com/sports/american-football',
    verifiedDate: '2024-08-01',
    notes: 'Wearable-based, not pure CV. Used by 80+ FBS programs for practice workload.',
  },
  // NCAA Football — Zebra
  {
    sport: 'ncaafb',
    league: 'NCAA FBS',
    team: 'Select programs',
    technologyName: 'Zebra MotionWorks',
    vendor: 'Zebra Technologies',
    deploymentStatus: 'pilot',
    cameraCount: null,
    capabilities: ['rfid-tracking', 'player-tracking', 'speed', 'acceleration'],
    sourceUrl: 'https://www.zebra.com/us/en/solutions/industry/sports.html',
    verifiedDate: '2024-09-01',
    notes: 'RFID-based tracking similar to NFL deployment, piloted at select venues',
  },
  // College Baseball — KinaTrax
  {
    sport: 'college-baseball',
    league: 'NCAA D1',
    team: 'SEC / ACC programs',
    technologyName: 'KinaTrax',
    vendor: 'KinaTrax',
    deploymentStatus: 'deployed',
    cameraCount: 8,
    capabilities: ['markerless-motion-capture', 'biomechanics', 'pitcher-mechanics'],
    sourceUrl: 'https://www.kinatrax.com/baseball',
    verifiedDate: '2024-04-01',
    notes: 'Limited deployment — Vanderbilt, Wake Forest, and select SEC venues have confirmed installations',
  },
  // College Baseball — Rapsodo
  {
    sport: 'college-baseball',
    league: 'NCAA D1',
    team: 'Widespread (200+ programs)',
    technologyName: 'Rapsodo',
    vendor: 'Rapsodo',
    deploymentStatus: 'deployed',
    cameraCount: 1,
    capabilities: ['pitch-tracking', 'spin-rate', 'ball-flight', 'hitting-metrics'],
    sourceUrl: 'https://rapsodo.com/baseball',
    verifiedDate: '2024-03-01',
    notes: 'Single-camera system widely adopted for bullpen analysis. Not game-speed capture.',
  },
];
