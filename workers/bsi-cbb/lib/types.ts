/**
 * BSI College Baseball Types
 * Zod schemas for runtime validation of external API responses
 * 
 * Sources:
 * - NCAA API (henrygd/ncaa-api)
 * - Highlightly Baseball API (RapidAPI)
 * - Manual NIL imports
 */

import { z } from 'zod';

// =============================================================================
// COMMON TYPES
// =============================================================================

export const GameStatus = z.enum([
  'scheduled',
  'pre_game',
  'in_progress',
  'delayed',
  'final',
  'postponed',
  'canceled',
  'suspended'
]);
export type GameStatus = z.infer<typeof GameStatus>;

export const DataSource = z.enum([
  'ncaa',
  'highlightly',
  'espn',
  'd1baseball',
  'manual'
]);
export type DataSource = z.infer<typeof DataSource>;

export const EntityType = z.enum(['team', 'player', 'game']);
export type EntityType = z.infer<typeof EntityType>;

// =============================================================================
// NCAA API SCHEMAS (henrygd/ncaa-api)
// =============================================================================

export const NcaaTeamSchema = z.object({
  id: z.coerce.string(),
  school: z.string(),
  name: z.string().optional(),
  shortName: z.string().optional(),
  abbreviation: z.string().optional(),
  logo: z.string().optional(),
  color: z.string().optional(),
  alternateColor: z.string().optional(),
  conference: z.string().optional(),
  conferenceId: z.coerce.string().optional(),
  record: z.object({
    wins: z.number().optional(),
    losses: z.number().optional(),
    confWins: z.number().optional(),
    confLosses: z.number().optional(),
  }).optional(),
});
export type NcaaTeam = z.infer<typeof NcaaTeamSchema>;

export const NcaaGameSchema = z.object({
  id: z.coerce.string(),
  uid: z.string().optional(),
  date: z.string(),
  name: z.string().optional(),
  shortName: z.string().optional(),
  season: z.number().optional(),
  seasonType: z.number().optional(),
  week: z.number().optional(),
  status: z.object({
    clock: z.number().optional(),
    displayClock: z.string().optional(),
    period: z.number().optional(),
    type: z.object({
      id: z.string().or(z.number()).optional(),
      name: z.string().optional(),
      state: z.string().optional(),
      completed: z.boolean().optional(),
      description: z.string().optional(),
      detail: z.string().optional(),
      shortDetail: z.string().optional(),
    }).optional(),
  }).optional(),
  competitions: z.array(z.object({
    id: z.coerce.string(),
    date: z.string(),
    attendance: z.number().optional(),
    venue: z.object({
      id: z.string().or(z.number()).optional(),
      fullName: z.string().optional(),
      address: z.object({
        city: z.string().optional(),
        state: z.string().optional(),
      }).optional(),
    }).optional(),
    competitors: z.array(z.object({
      id: z.coerce.string(),
      homeAway: z.enum(['home', 'away']),
      score: z.coerce.string().optional(),
      winner: z.boolean().optional(),
      team: NcaaTeamSchema.optional(),
      records: z.array(z.object({
        name: z.string().optional(),
        summary: z.string().optional(),
        type: z.string().optional(),
      })).optional(),
      linescores: z.array(z.object({
        value: z.number(),
      })).optional(),
    })),
    status: z.object({
      type: z.object({
        id: z.string().or(z.number()).optional(),
        name: z.string().optional(),
        state: z.string().optional(),
        completed: z.boolean().optional(),
      }).optional(),
    }).optional(),
  })).optional(),
});
export type NcaaGame = z.infer<typeof NcaaGameSchema>;

export const NcaaScoreboardResponseSchema = z.object({
  events: z.array(NcaaGameSchema),
  day: z.object({
    date: z.string(),
  }).optional(),
});
export type NcaaScoreboardResponse = z.infer<typeof NcaaScoreboardResponseSchema>;

// =============================================================================
// HIGHLIGHTLY API SCHEMAS (RapidAPI)
// =============================================================================

export const HighlightlyTeamSchema = z.object({
  id: z.coerce.string(),
  name: z.string(),
  shortName: z.string().optional(),
  slug: z.string().optional(),
  abbreviation: z.string().optional(),
  gender: z.string().optional(),
  sport: z.object({
    id: z.number().optional(),
    name: z.string().optional(),
    slug: z.string().optional(),
  }).optional(),
  tournament: z.object({
    id: z.number().optional(),
    name: z.string().optional(),
    slug: z.string().optional(),
    category: z.object({
      id: z.number().optional(),
      name: z.string().optional(),
      slug: z.string().optional(),
      flag: z.string().optional(),
    }).optional(),
  }).optional(),
  country: z.object({
    name: z.string().optional(),
    alpha2: z.string().optional(),
  }).optional(),
  teamColors: z.object({
    primary: z.string().optional(),
    secondary: z.string().optional(),
  }).optional(),
});
export type HighlightlyTeam = z.infer<typeof HighlightlyTeamSchema>;

// Simplified team object used in match responses
export const HighlightlyMatchTeamSchema = z.object({
  id: z.coerce.string(),
  displayName: z.string().optional(),
  name: z.string(),
  logo: z.string().optional(),
  abbreviation: z.string().optional(),
});
export type HighlightlyMatchTeam = z.infer<typeof HighlightlyMatchTeamSchema>;

export const HighlightlyPlayerSchema = z.object({
  id: z.coerce.string(),
  name: z.string(),
  slug: z.string().optional(),
  shortName: z.string().optional(),
  position: z.string().optional(),
  jerseyNumber: z.string().optional(),
  height: z.number().optional(),
  weight: z.number().optional(),
  dateOfBirthTimestamp: z.number().optional(),
  country: z.object({
    name: z.string().optional(),
    alpha2: z.string().optional(),
  }).optional(),
  team: z.object({
    id: z.number().optional(),
    name: z.string().optional(),
  }).optional(),
});
export type HighlightlyPlayer = z.infer<typeof HighlightlyPlayerSchema>;

export const HighlightlyMatchSchema = z.object({
  id: z.coerce.string(),
  league: z.string().optional(),
  season: z.number().optional(),
  date: z.string(), // ISO date string
  round: z.string().optional(),
  state: z.object({
    score: z.record(z.unknown()).optional(),
    report: z.string().optional(),
    description: z.string().optional(),
  }).optional(),
  homeTeam: HighlightlyMatchTeamSchema.optional(),
  awayTeam: HighlightlyMatchTeamSchema.optional(),
});
export type HighlightlyMatch = z.infer<typeof HighlightlyMatchSchema>;

export const HighlightlyStandingsRowSchema = z.object({
  team: HighlightlyTeamSchema,
  position: z.number().optional(),
  matches: z.number().optional(),
  wins: z.number().optional(),
  losses: z.number().optional(),
  draws: z.number().optional(),
  points: z.number().optional(),
  percentage: z.number().optional(),
  streak: z.string().optional(),
  runsScored: z.number().optional(),
  runsAllowed: z.number().optional(),
});
export type HighlightlyStandingsRow = z.infer<typeof HighlightlyStandingsRowSchema>;

export const HighlightlyPlayerStatsSchema = z.object({
  player: HighlightlyPlayerSchema,
  statistics: z.object({
    // Batting
    atBats: z.number().optional(),
    runs: z.number().optional(),
    hits: z.number().optional(),
    doubles: z.number().optional(),
    triples: z.number().optional(),
    homeRuns: z.number().optional(),
    rbi: z.number().optional(),
    walks: z.number().optional(),
    strikeouts: z.number().optional(),
    stolenBases: z.number().optional(),
    battingAverage: z.number().optional(),
    onBasePercentage: z.number().optional(),
    sluggingPercentage: z.number().optional(),
    ops: z.number().optional(),
    // Pitching
    gamesPlayed: z.number().optional(),
    gamesStarted: z.number().optional(),
    inningsPitched: z.number().optional(),
    wins: z.number().optional(),
    losses: z.number().optional(),
    saves: z.number().optional(),
    earnedRuns: z.number().optional(),
    era: z.number().optional(),
    whip: z.number().optional(),
    strikeoutsPitching: z.number().optional(),
    walksPitching: z.number().optional(),
  }).optional(),
});
export type HighlightlyPlayerStats = z.infer<typeof HighlightlyPlayerStatsSchema>;

// =============================================================================
// INTERNAL BSI TYPES
// =============================================================================

export const BsiTeamSchema = z.object({
  id: z.string(),
  name: z.string(),
  displayName: z.string().optional(),
  abbreviation: z.string().optional(),
  mascot: z.string().optional(),
  conference: z.string(),
  division: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  primaryColor: z.string().optional(),
  secondaryColor: z.string().optional(),
  logoUrl: z.string().optional(),
  stadiumName: z.string().optional(),
  ncaaId: z.string().optional(),
  highlightlyId: z.string().optional(),
  espnId: z.string().optional(),
  updatedAt: z.string().optional(),
});
export type BsiTeam = z.infer<typeof BsiTeamSchema>;

export const BsiPlayerSchema = z.object({
  id: z.string(),
  teamId: z.string().nullable(),
  fullName: z.string(),
  position: z.string().optional(),
  jerseyNumber: z.string().optional(),
  classYear: z.string().optional(),
  height: z.string().optional(),
  weight: z.number().optional(),
  bats: z.string().optional(),
  throws: z.string().optional(),
  hometown: z.string().optional(),
  highSchool: z.string().optional(),
  isActive: z.boolean().default(true),
  isTransfer: z.boolean().default(false),
  transferFrom: z.string().optional(),
  transferStatus: z.string().optional(),
  ncaaId: z.string().optional(),
  highlightlyId: z.string().optional(),
  updatedAt: z.string().optional(),
});
export type BsiPlayer = z.infer<typeof BsiPlayerSchema>;

export const BsiGameSchema = z.object({
  id: z.string(),
  homeTeamId: z.string(),
  awayTeamId: z.string(),
  date: z.string(),
  time: z.string().optional(),
  season: z.number(),
  status: GameStatus,
  homeScore: z.number().nullable(),
  awayScore: z.number().nullable(),
  inning: z.number().optional(),
  inningHalf: z.enum(['top', 'bottom']).optional(),
  venue: z.string().optional(),
  attendance: z.number().optional(),
  tvBroadcast: z.string().optional(),
  isConferenceGame: z.boolean().default(false),
  isTournamentGame: z.boolean().default(false),
  tournamentName: z.string().optional(),
  ncaaId: z.string().optional(),
  highlightlyId: z.string().optional(),
  updatedAt: z.string().optional(),
});
export type BsiGame = z.infer<typeof BsiGameSchema>;

// =============================================================================
// NIL TYPES
// =============================================================================

export const NilDealImportSchema = z.object({
  playerId: z.string().optional(),          // BSI player ID if known
  playerName: z.string(),                   // For matching if ID unknown
  teamName: z.string().optional(),          // For context
  brandName: z.string(),
  dealType: z.string(),                     // 'endorsement', 'appearance', 'merchandise', etc
  dealValue: z.number().optional(),
  dealValueTier: z.string().optional(),     // 'under_10k', '10k_50k', '50k_100k', 'over_100k'
  announcedDate: z.string().optional(),
  source: z.string(),
  sourceUrl: z.string().optional(),
  verified: z.boolean().default(false),
});
export type NilDealImport = z.infer<typeof NilDealImportSchema>;

export const NilValuationImportSchema = z.object({
  playerId: z.string().optional(),
  playerName: z.string(),
  teamName: z.string().optional(),
  estimatedValue: z.number().optional(),
  valueRangeLow: z.number().optional(),
  valueRangeHigh: z.number().optional(),
  socialFollowing: z.number().optional(),
  instagramFollowers: z.number().optional(),
  twitterFollowers: z.number().optional(),
  tiktokFollowers: z.number().optional(),
  engagementRate: z.number().optional(),
  marketabilityScore: z.number().optional(),
  performanceScore: z.number().optional(),
  source: z.string(),
});
export type NilValuationImport = z.infer<typeof NilValuationImportSchema>;

// =============================================================================
// API RESPONSE TYPES
// =============================================================================

export const ApiErrorSchema = z.object({
  error: z.string(),
  message: z.string(),
  code: z.string().optional(),
  details: z.record(z.unknown()).optional(),
});
export type ApiError = z.infer<typeof ApiErrorSchema>;

export const PaginatedResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    data: z.array(itemSchema),
    pagination: z.object({
      page: z.number(),
      pageSize: z.number(),
      total: z.number(),
      totalPages: z.number(),
      hasMore: z.boolean(),
    }),
  });

// =============================================================================
// SYNC TYPES
// =============================================================================

export const SyncResultSchema = z.object({
  source: DataSource,
  entityType: z.string(),
  operation: z.string(),
  status: z.enum(['success', 'partial', 'failed', 'rate_limited']),
  recordsFetched: z.number(),
  recordsInserted: z.number(),
  recordsUpdated: z.number(),
  recordsSkipped: z.number(),
  errors: z.array(z.string()).optional(),
  durationMs: z.number(),
});
export type SyncResult = z.infer<typeof SyncResultSchema>;

// =============================================================================
// WORKER ENVIRONMENT TYPES
// =============================================================================

export interface CbbEnv {
  // D1 Database
  BSI_DB: D1Database;
  
  // KV Namespace
  BSI_CACHE: KVNamespace;
  
  // R2 Bucket (optional, for NIL imports)
  BSI_NIL_BUCKET?: R2Bucket;
  
  // Secrets
  BSI_SYNC_TOKEN: string;
  HIGHLIGHTLY_API_KEY?: string;
  
  // Environment
  ENVIRONMENT: string;
  
  // Feature flags
  ENABLE_OFFSEASON_SYNC?: string;
}
