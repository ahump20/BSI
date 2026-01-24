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

const API_BASE = 'https://bsi-fanbase-sentiment.humphrey-austin20.workers.dev';

export async function fetchSchools(): Promise<APISchool[]> {
  const res = await fetch(`${API_BASE}/schools`);
  const json: APIResponse<APISchool[]> = await res.json();
  if (!json.success) throw new Error(json.error ?? 'Failed to fetch schools');
  return json.data;
}

export async function fetchProfile(schoolId: string): Promise<APIFanbaseProfile> {
  const res = await fetch(`${API_BASE}/profile/${schoolId}`);
  const json: APIResponse<APIFanbaseProfile> = await res.json();
  if (!json.success) throw new Error(json.error ?? 'Failed to fetch profile');
  return json.data;
}

export async function fetchSECTriggers(): Promise<APITriggerWithSchool[]> {
  const res = await fetch(`${API_BASE}/sec/triggers`);
  const json: APIResponse<APITriggerWithSchool[]> = await res.json();
  if (!json.success) throw new Error(json.error ?? 'Failed to fetch triggers');
  return json.data;
}
