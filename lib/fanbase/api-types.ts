/**
 * BSI Fanbase Sentiment API Response Types
 *
 * Types matching the bsi-fanbase-sentiment Cloudflare Worker API.
 * These differ from the frontend types.ts which defines display models.
 */

// ============================================================================
// API Response Wrappers
// ============================================================================

export interface APIResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

// ============================================================================
// School & Profile Types
// ============================================================================

export interface APISchool {
  id: string;
  name: string;
  mascot: string;
  conference: string;
  primary_color: string;
  secondary_color: string;
  location_city: string;
  location_state: string;
  created_at: string;
  updated_at: string;
}

export interface APICharacteristic {
  id: number;
  school_id: string;
  characteristic_type: 'identity' | 'trigger' | 'tradition';
  characteristic_key: string;
  characteristic_value: string;
  intensity_score: number;
  source_type: 'twitter' | 'forum' | 'observed' | 'manual';
  source_url: string | null;
  last_verified: string | null;
  created_at: string;
}

export interface APICurrentState {
  id: number;
  school_id: string;
  overall_sentiment: string;
  confidence_level: number;
  primary_concerns: string;
  primary_hopes: string;
  last_updated: string;
}

export interface APIRivalry {
  id: number;
  school_id: string;
  rival_school_id: string;
  rivalry_name: string | null;
  intensity_score: number;
  primary_sport: string;
  trophy_name: string | null;
  rivalry_type: 'historic' | 'in-state' | 'conference';
  rival_name: string;
  created_at: string;
}

export interface APILexicon {
  id: number;
  school_id: string;
  term: string;
  meaning: string;
  usage_context: string;
  emotional_weight: 'positive' | 'negative' | 'neutral';
  created_at: string;
}

export interface APITriggerWithSchool extends APICharacteristic {
  school_name: string;
}

// ============================================================================
// Full Profile Response
// ============================================================================

export interface APIFanbaseProfile {
  school: APISchool;
  characteristics: {
    identity: APICharacteristic[];
    triggers: APICharacteristic[];
    traditions: APICharacteristic[];
  };
  currentState: APICurrentState;
  sportSentiment: unknown[];
  rivalries: APIRivalry[];
  definingMoments: unknown[];
  lexicon: APILexicon[];
}

// ============================================================================
// API Client
// ============================================================================

const WORKER_API_BASE = 'https://bsi-fanbase-sentiment.humphrey-austin20.workers.dev';
const PAGES_API_BASE = '/api/v1/fanbase';

/** Schools with data in the old Worker API (SEC) */
const WORKER_API_SCHOOLS = new Set([
  'texas',
  'oklahoma',
  'georgia',
  'alabama',
  'lsu',
  'ole-miss',
  'tennessee',
  'texas-am',
  'florida',
  'auburn',
  'missouri',
  'kentucky',
  'arkansas',
  'mississippi-state',
  'south-carolina',
  'vanderbilt',
]);

export async function fetchSchools(): Promise<APISchool[]> {
  const res = await fetch(`${WORKER_API_BASE}/schools`);
  const json: APIResponse<APISchool[]> = await res.json();
  if (!json.success) throw new Error(json.error ?? 'Failed to fetch schools');
  return json.data;
}

/** D1 API response format */
interface D1ProfileResponse {
  profile: {
    id: string;
    school: string;
    shortName: string;
    mascot: string;
    conference: string;
    primaryColor: string;
    secondaryColor: string;
    logo?: string;
    sentiment: { overall: number; optimism: number; loyalty: number; volatility: number };
    personality: { traits: string[]; rivalries: string[]; traditions: string[]; quirks: string[] };
    engagement: {
      socialMediaActivity: number;
      gameAttendance: number;
      travelSupport: number;
      merchandisePurchasing: number;
    };
    demographics: { primaryAge: string; geographicSpread: string[]; alumniPercentage: number };
    meta: { lastUpdated: string; dataSource: string; confidence: number; sampleSize: number };
  };
  recentSnapshots: unknown[];
  sentimentTrend: string;
  weekOverWeekChange: unknown;
}

/** Transform D1 API response to match Worker API format */
function transformD1ToWorkerFormat(d1Response: D1ProfileResponse): APIFanbaseProfile {
  const p = d1Response.profile;
  return {
    school: {
      id: p.id,
      name: p.school,
      mascot: p.mascot,
      conference: p.conference,
      primary_color: p.primaryColor,
      secondary_color: p.secondaryColor,
      location_city: '',
      location_state: '',
      created_at: p.meta.lastUpdated,
      updated_at: p.meta.lastUpdated,
    },
    characteristics: {
      identity: p.personality.traits.map((trait, i) => ({
        id: i,
        school_id: p.id,
        characteristic_type: 'identity' as const,
        characteristic_key: trait,
        characteristic_value: trait,
        intensity_score: 7,
        source_type: 'manual' as const,
        source_url: null,
        last_verified: p.meta.lastUpdated,
        created_at: p.meta.lastUpdated,
      })),
      triggers: p.personality.quirks.map((quirk, i) => ({
        id: i,
        school_id: p.id,
        characteristic_type: 'trigger' as const,
        characteristic_key: quirk.split(' ')[0].toLowerCase(),
        characteristic_value: quirk,
        intensity_score: 6,
        source_type: 'manual' as const,
        source_url: null,
        last_verified: p.meta.lastUpdated,
        created_at: p.meta.lastUpdated,
      })),
      traditions: p.personality.traditions.map((tradition, i) => ({
        id: i,
        school_id: p.id,
        characteristic_type: 'tradition' as const,
        characteristic_key: tradition.split(' ')[0].toLowerCase(),
        characteristic_value: tradition,
        intensity_score: 8,
        source_type: 'manual' as const,
        source_url: null,
        last_verified: p.meta.lastUpdated,
        created_at: p.meta.lastUpdated,
      })),
    },
    currentState: {
      id: 1,
      school_id: p.id,
      overall_sentiment:
        p.sentiment.overall > 0 ? 'optimistic' : p.sentiment.overall < 0 ? 'cautious' : 'neutral',
      confidence_level: p.meta.confidence,
      primary_concerns: 'Offseason',
      primary_hopes: 'Strong season ahead',
      last_updated: p.meta.lastUpdated,
    },
    sportSentiment: [],
    rivalries: p.personality.rivalries.map((rival, i) => ({
      id: i,
      school_id: p.id,
      rival_school_id: rival,
      rivalry_name: null,
      intensity_score: 7,
      primary_sport: 'football',
      trophy_name: null,
      rivalry_type: 'conference' as const,
      rival_name: rival.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
      created_at: p.meta.lastUpdated,
    })),
    definingMoments: [],
    lexicon: [],
  };
}

export async function fetchProfile(schoolId: string): Promise<APIFanbaseProfile> {
  // Try D1 API first for non-SEC schools (Big 12, etc.)
  if (!WORKER_API_SCHOOLS.has(schoolId)) {
    try {
      const res = await fetch(`${PAGES_API_BASE}/${schoolId}`);
      if (res.ok) {
        const json = (await res.json()) as {
          status: string;
          data: D1ProfileResponse;
          error?: string;
        };
        // D1 API returns status: "ok" not success: true
        if (json.status === 'ok' && json.data?.profile) {
          return transformD1ToWorkerFormat(json.data);
        }
      }
    } catch {
      // Fall through to Worker API
    }
  }

  // Fallback to Worker API (SEC schools)
  const res = await fetch(`${WORKER_API_BASE}/profile/${schoolId}`);
  const json: APIResponse<APIFanbaseProfile> = await res.json();
  if (!json.success) throw new Error(json.error ?? 'School not found');
  return json.data;
}

export async function fetchSECTriggers(): Promise<APITriggerWithSchool[]> {
  const res = await fetch(`${WORKER_API_BASE}/sec/triggers`);
  const json: APIResponse<APITriggerWithSchool[]> = await res.json();
  if (!json.success) throw new Error(json.error ?? 'Failed to fetch triggers');
  return json.data;
}

// ============================================================================
// Trending API (via Pages Function)
// ============================================================================

import type { TrendingFanbase } from './types';

/**
 * Fetch trending fanbases with biggest sentiment changes.
 * Uses the Pages Function which queries the v_trending_fanbases D1 view.
 */
export async function fetchTrending(): Promise<TrendingFanbase[]> {
  const res = await fetch(`${PAGES_API_BASE}/trending`);
  const json = (await res.json()) as { success: boolean; data: TrendingFanbase[]; error?: string };
  if (!json.success) {
    // Return empty array if no trending data (offseason)
    if (json.error?.includes('NOT_FOUND') || json.error?.includes('no data')) {
      return [];
    }
    throw new Error(json.error ?? 'Failed to fetch trending');
  }
  return json.data ?? [];
}
