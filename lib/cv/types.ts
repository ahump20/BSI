import type { IntelSport } from '@/lib/intel/types';

// ---------------------------------------------------------------------------
// Pitcher Biomechanics — D1 table: pitcher_biomechanics
// ---------------------------------------------------------------------------

export interface PitcherBiomechanics {
  id: number;
  player_id: string;
  player_name: string;
  team: string;
  league: 'mlb' | 'college-baseball';
  game_id: string;
  game_date: string;
  pitch_count: number;
  velocity_start: number;
  velocity_current: number;
  velocity_delta: number;
  release_point_drift_inches: number;
  fatigue_score: number;
  injury_risk_index: number;
  risk_factors: string; // JSON string array
  // CV-ready fields — null until richer data available
  arm_slot_angle: number | null;
  arm_slot_variance: number | null;
  stride_length_pct: number | null;
  stride_length_delta: number | null;
  shoulder_rotation_deg: number | null;
  hip_shoulder_separation: number | null;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Formation Intelligence — D1 table: formation_intelligence
// ---------------------------------------------------------------------------

export interface FormationIntelligence {
  id: number;
  team: string;
  league: 'nfl' | 'ncaafb';
  season: number;
  game_id: string;
  game_date: string;
  formation_name: string;
  personnel_package: string;
  snap_count: number;
  success_rate: number;
  epa_per_play: number;
  play_type_distribution: string; // JSON
  tendencies: string; // JSON
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Movement Profiles — D1 table: movement_profiles
// ---------------------------------------------------------------------------

export interface MovementProfile {
  id: number;
  player_id: string;
  player_name: string;
  team: string;
  sport: Exclude<IntelSport, 'all'>;
  profile_date: string;
  sprint_speed_mph: number | null;
  acceleration_metric: number | null;
  deceleration_metric: number | null;
  change_of_direction: number | null;
  acute_workload: number | null;
  chronic_workload: number | null;
  acwr: number | null;
  baseline_deviation_pct: number | null;
  movement_quality_score: number | null;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// CV Adoption Tracker — D1 table: cv_adoption_tracker
// ---------------------------------------------------------------------------

export interface CVAdoptionEntry {
  id: number;
  sport: Exclude<IntelSport, 'all'>;
  league: string;
  team: string;
  technology_name: string;
  vendor: string;
  deployment_status: 'deployed' | 'pilot' | 'announced' | 'rumored';
  camera_count: number | null;
  capabilities: string; // JSON string array
  source_url: string;
  verified_date: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Fatigue Score Calculation
// ---------------------------------------------------------------------------

export interface FatigueScoreInput {
  pitchCount: number;
  velocityStart: number;
  velocityCurrent: number;
  releasePointDriftInches: number;
  // Optional CV-enriched fields
  armSlotAngle?: number;
  armSlotVariance?: number;
  strideLengthPct?: number;
  strideLengthDelta?: number;
}

export interface FatigueScoreResult {
  fatigueScore: number;
  injuryRiskIndex: number;
  riskFactors: string[];
  components: {
    pitchCountWeight: number;
    velocityDeltaWeight: number;
    releaseDriftWeight: number;
  };
}

// ---------------------------------------------------------------------------
// API Response Wrapper
// ---------------------------------------------------------------------------

export interface CVApiResponse<T> {
  data: T;
  meta: {
    source: string;
    fetched_at: string;
    timezone: 'America/Chicago';
    cache_hit: boolean;
  };
}
