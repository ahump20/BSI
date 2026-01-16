/**
 * Blaze Sports Intel - Live Event Reconstruction Types
 * Type definitions for real-time 3D analytics engine
 *
 * @module lib/reconstruction/types
 * @version 1.0.0
 */

// ============================================================================
// CORE TYPES
// ============================================================================

export type Sport = 'mlb' | 'nfl' | 'nba' | 'ncaa_football' | 'ncaa_baseball';

export type EventType =
  | 'batted_ball'
  | 'pitch'
  | 'defensive_play'
  | 'scoring_play'
  | 'turnover'
  | 'big_play'
  | 'biomechanical_anomaly'
  | 'rare_event';

export type ReconstructionStatus = 'pending' | 'processing' | 'completed' | 'failed';

// ============================================================================
// LIVE GAME MONITORING
// ============================================================================

export interface LiveGame {
  id: string;
  sport: Sport;
  gameId: string;
  homeTeam: string;
  awayTeam: string;
  isActive: boolean;
  gameState: GameState | null;
  startTime: string; // ISO8601
  monitoringStarted: string; // ISO8601
  lastPolled: string | null; // ISO8601
  pollIntervalSeconds: number;
  createdAt: string;
  updatedAt: string;
}

export interface GameState {
  period: number | string; // Inning, quarter, period
  score: {
    home: number;
    away: number;
  };
  clock: string | null; // Game clock (null for baseball)
  status: 'pre' | 'in_progress' | 'final' | 'postponed' | 'suspended';
  outs?: number; // Baseball only
  baseRunners?: {
    first: boolean;
    second: boolean;
    third: boolean;
  };
}

// ============================================================================
// EVENT DETECTION
// ============================================================================

export interface LiveEvent {
  id: string;
  gameId: string;
  sport: Sport;
  eventType: EventType;
  timestamp: string; // ISO8601
  gameTimestamp: string | null; // Human-readable game time
  leverageIndex: number | null;
  winProbDelta: number | null;
  expectedValue: number | null;
  actualValue: number | null;
  significanceScore: number; // 0-100
  rawData: EventRawData;
  statcastData: StatcastData | null;
  isReconstructed: boolean;
  isPublished: boolean;
  createdAt: string;
}

export interface EventRawData {
  playId: string;
  description: string;
  players: Array<{
    id: string;
    name: string;
    position: string;
  }>;
  situation: {
    inning?: number;
    outs?: number;
    runners?: string;
    quarter?: number;
    down?: number;
    distance?: number;
  };
  [key: string]: unknown; // Additional sport-specific data
}

// ============================================================================
// STATCAST DATA (MLB)
// ============================================================================

export interface StatcastData {
  // Batted ball data
  exitVelocity?: number; // mph
  launchAngle?: number; // degrees
  hitDistance?: number; // feet
  hangTime?: number; // seconds
  sprayAngle?: number; // degrees (-45 to 45, 0 = center)

  // Pitch data
  pitchVelocity?: number; // mph
  releasePoint?: {
    x: number; // feet from center of rubber
    y: number; // feet from ground
    z: number; // feet from home plate
  };
  spinRate?: number; // rpm
  spinAxis?: number; // degrees
  breakDistance?: number; // inches
  plateLocation?: {
    x: number; // feet from center of plate
    z: number; // feet from ground
  };

  // Defensive data
  catchProbability?: number; // 0-1
  fielderPosition?: {
    x: number;
    y: number;
  };
  routeEfficiency?: number; // 0-1
  reactionTime?: number; // seconds

  // Environmental
  windSpeed?: number; // mph
  windDirection?: number; // degrees
  temperature?: number; // Fahrenheit
  stadiumFactor?: number; // park effects
}

// ============================================================================
// 3D RECONSTRUCTION
// ============================================================================

export interface Reconstruction {
  id: string;
  eventId: string;
  sceneData: SceneData;
  physicsParams: PhysicsParams | null;
  predictionData: PredictionData | null;
  actualOutcome: ActualOutcome;
  predictionAccuracy: number | null; // 0-1
  videoUrl: string | null;
  thumbnailUrl: string | null;
  gifUrl: string | null;
  embedCode: string | null;
  twitterCardUrl: string | null;
  instagramStoryUrl: string | null;
  renderTimeMs: number | null;
  dataQualityScore: number | null; // 0-1
  spatialAccuracyCm: number | null;
  isPublished: boolean;
  publishedAt: string | null;
  viewCount: number;
  shareCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface SceneData {
  // 3D positions and trajectories
  positions: Array<{
    name: string; // 'ball', 'fielder_1', 'batter', etc.
    keyframes: Array<{
      time: number; // seconds
      x: number; // feet
      y: number; // feet
      z: number; // feet
      rotation?: { x: number; y: number; z: number }; // radians
    }>;
  }>;

  // Annotations
  annotations: Array<{
    type: 'zone' | 'arrow' | 'text' | 'heatmap';
    position: { x: number; y: number; z: number };
    data: unknown; // Type-specific data
    label?: string;
  }>;

  // Camera configuration
  camera: {
    position: { x: number; y: number; z: number };
    lookAt: { x: number; y: number; z: number };
    fov: number; // degrees
    animations?: Array<{
      time: number;
      position: { x: number; y: number; z: number };
      lookAt: { x: number; y: number; z: number };
    }>;
  };

  // Scene metadata
  duration: number; // seconds
  fps: number;
  resolution: { width: number; height: number };
}

export interface PhysicsParams {
  gravity: number; // ft/s²
  airResistance: number; // coefficient
  spinEffect: {
    magnus: number; // coefficient
    backspin: number; // rpm
    sidespin: number; // rpm
  };
  wind: {
    speed: number; // mph
    direction: number; // degrees (0 = towards home plate)
  };
  stadium: {
    elevation: number; // feet above sea level
    fenceDimensions: Array<{
      angle: number; // degrees from center
      distance: number; // feet
      height: number; // feet
    }>;
  };
}

// ============================================================================
// PREDICTION & VALIDATION
// ============================================================================

export interface PredictionData {
  model: string; // 'statcast', 'pythagorean', 'win_probability'
  version: string;
  predictedOutcome: {
    type: string; // 'home_run', 'catch', 'score', etc.
    probability: number; // 0-1
    alternativeOutcomes?: Array<{
      type: string;
      probability: number;
    }>;
  };
  factors: Array<{
    name: string;
    value: number;
    weight: number; // Contribution to prediction
  }>;
  confidenceInterval: {
    lower: number;
    upper: number;
  };
  timestamp: string; // ISO8601 when prediction was made
}

export interface ActualOutcome {
  type: string;
  description: string;
  timestamp: string; // ISO8601
  deviation: number | null; // How far from prediction
  surpriseFactor: number | null; // 0-1 (1 = very unexpected)
}

export interface Prediction {
  id: string;
  eventId: string;
  modelName: string;
  modelVersion: string;
  predictionType: string;
  predictedOutcome: PredictionData['predictedOutcome'];
  predictedProbability: number;
  confidenceScore: number;
  actualOutcome: ActualOutcome | null;
  wasCorrect: boolean | null;
  errorMargin: number | null;
  featuresUsed: Record<string, unknown>;
  predictionTimestamp: string;
  outcomeTimestamp: string | null;
  createdAt: string;
}

// ============================================================================
// HIGHLIGHT LIBRARY
// ============================================================================

export interface Highlight {
  id: string;
  gameId: string;
  reconstructionId: string;
  sport: Sport;
  highlightType: 'top_play' | 'rare_event' | 'leverage_moment' | 'analytical_interest';
  ranking: number | null; // 1-10 per game
  teams: string[]; // Team names
  players: string[] | null;
  tags: string[] | null;
  leverageIndex: number | null;
  winProbAdded: number | null;
  percentileRank: number | null; // Historical percentile
  engagementScore: number | null;
  date: string; // YYYY-MM-DD
  createdAt: string;
}

// ============================================================================
// CONTENT PIPELINE
// ============================================================================

export interface ContentQueueItem {
  id: string;
  reconstructionId: string;
  platform: 'twitter' | 'instagram' | 'facebook' | 'youtube';
  contentType: 'video' | 'image' | 'carousel' | 'story';
  caption: string | null;
  hashtags: string[] | null;
  mediaUrls: string[];
  scheduledFor: string | null; // ISO8601
  publishedAt: string | null; // ISO8601
  status: 'pending' | 'processing' | 'published' | 'failed';
  impressions: number;
  engagements: number;
  shares: number;
  errorMessage: string | null;
  retryCount: number;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// SYSTEM METRICS
// ============================================================================

export interface SystemMetric {
  id: string;
  metricType:
    | 'reconstruction_time'
    | 'prediction_accuracy'
    | 'api_latency'
    | 'event_detection_rate';
  sport: Sport;
  value: number;
  unit: 'milliseconds' | 'percentage' | 'count' | 'events_per_minute';
  metadata: Record<string, unknown> | null;
  timestamp: string; // ISO8601
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

export interface StartMonitoringRequest {
  sport: Sport;
  gameId: string;
  homeTeam: string;
  awayTeam: string;
  startTime: string; // ISO8601
  pollIntervalSeconds?: number;
}

export interface StartMonitoringResponse {
  success: boolean;
  liveGameId: string;
  message: string;
}

export interface GetReconstructionsRequest {
  gameId?: string;
  eventId?: string;
  sport?: Sport;
  date?: string; // YYYY-MM-DD
  limit?: number;
  offset?: number;
}

export interface GetReconstructionsResponse {
  reconstructions: Reconstruction[];
  total: number;
  hasMore: boolean;
}

export interface TriggerReconstructionRequest {
  eventId: string;
  priority?: 'low' | 'normal' | 'high';
}

export interface TriggerReconstructionResponse {
  success: boolean;
  reconstructionId: string;
  estimatedTime: number; // seconds
}

export interface GetHighlightsRequest {
  date?: string; // YYYY-MM-DD
  sport?: Sport;
  team?: string;
  highlightType?: Highlight['highlightType'];
  minLeverageIndex?: number;
  limit?: number;
}

export interface GetHighlightsResponse {
  highlights: Array<Highlight & { reconstruction: Reconstruction }>;
  total: number;
}

// ============================================================================
// PHYSICS CALCULATIONS
// ============================================================================

export interface TrajectoryPoint {
  time: number; // seconds
  position: { x: number; y: number; z: number }; // feet
  velocity: { x: number; y: number; z: number }; // ft/s
}

export interface TrajectoryCalculation {
  points: TrajectoryPoint[];
  landingPoint: { x: number; y: number; z: number } | null;
  hangTime: number;
  peakHeight: number;
  totalDistance: number;
}

// ============================================================================
// UTILITIES
// ============================================================================

export interface DataSource {
  name: string;
  url: string;
  retrievedAt: string; // ISO8601
  confidence: number; // 0-1
}

export interface Citation {
  sources: DataSource[];
  methodology: string;
  lastUpdated: string; // ISO8601
}
