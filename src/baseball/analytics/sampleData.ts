import type {
  PitcherWorkloadRiskResponse,
  UmpireZoneProbabilityResponse,
} from '../api/types';

export const samplePitcherWorkload: PitcherWorkloadRiskResponse[] = [
  {
    pitcherId: 'pitcher_texas_001',
    season: '2025',
    workloadIndex: 82,
    riskTier: 'medium',
    recommendedRestDays: 3,
    rollingAveragePitches: 98,
    shortRestAppearances: 2,
    recentAppearances: [
      { gameId: 101, gameDate: '2025-05-12', pitches: 94, innings: 6.1, strikeouts: 8, walks: 2 },
      { gameId: 108, gameDate: '2025-05-16', pitches: 88, innings: 5.0, strikeouts: 6, walks: 3 },
    ],
    seasonTotals: { totalPitches: 1850, totalInnings: 126.2, appearances: 24 },
    lastUpdated: '2025-05-18T17:45:00-05:00',
  },
  {
    pitcherId: 'pitcher_texas_002',
    season: '2025',
    workloadIndex: 58,
    riskTier: 'low',
    recommendedRestDays: 2,
    rollingAveragePitches: 82,
    shortRestAppearances: 1,
    recentAppearances: [
      { gameId: 102, gameDate: '2025-05-11', pitches: 76, innings: 5.2, strikeouts: 7, walks: 1 },
      { gameId: 111, gameDate: '2025-05-17', pitches: 87, innings: 7.0, strikeouts: 9, walks: 1 },
    ],
    seasonTotals: { totalPitches: 1625, totalInnings: 118.0, appearances: 22 },
    lastUpdated: '2025-05-18T17:45:00-05:00',
  },
  {
    pitcherId: 'pitcher_texas_003',
    season: '2025',
    workloadIndex: 90,
    riskTier: 'high',
    recommendedRestDays: 4,
    rollingAveragePitches: 104,
    shortRestAppearances: 3,
    recentAppearances: [
      { gameId: 99, gameDate: '2025-05-09', pitches: 110, innings: 7.2, strikeouts: 10, walks: 2 },
      { gameId: 110, gameDate: '2025-05-15', pitches: 101, innings: 6.0, strikeouts: 7, walks: 4 },
    ],
    seasonTotals: { totalPitches: 1975, totalInnings: 134.1, appearances: 25 },
    lastUpdated: '2025-05-18T17:45:00-05:00',
  },
];

export const sampleUmpireReport: UmpireZoneProbabilityResponse = {
  gameId: 'game-sec-2025-0519',
  umpireId: 'ump-4521',
  sampleSize: 212,
  baselineStrikeProbability: 0.43,
  zones: [
    { zone: 'inner', calledStrikeProbability: 0.58, chaseRate: 0.21, swingRate: 0.44, sampleSize: 55 },
    { zone: 'outer', calledStrikeProbability: 0.48, chaseRate: 0.25, swingRate: 0.39, sampleSize: 69 },
    { zone: 'high', calledStrikeProbability: 0.34, chaseRate: 0.18, swingRate: 0.42, sampleSize: 46 },
    { zone: 'low', calledStrikeProbability: 0.51, chaseRate: 0.31, swingRate: 0.47, sampleSize: 42 },
  ],
  confidence: 0.78,
  updatedAt: '2025-05-18T19:00:00-05:00',
  source: 'derived',
};
