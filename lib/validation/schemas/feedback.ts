/**
 * Zod Validation Schemas for Feedback System
 */

import { z } from 'zod';

// ============================================================================
// Core Type Schemas
// ============================================================================

export const FeedbackScoresSchema = z.object({
  confidence: z.number().min(0).max(100),
  engagement: z.number().min(0).max(100),
  clarity: z.number().min(0).max(100),
  authenticity: z.number().min(0).max(100),
  professionalPresence: z.number().min(0).max(100),
});

export const FeedbackTrendsSchema = z.object({
  confidenceDelta: z.number(),
  engagementDelta: z.number(),
  clarityDelta: z.number(),
});

export const FeedbackSuggestionSchema = z.object({
  category: z.enum(['voice', 'body', 'facial', 'speech', 'engagement', 'professional']),
  priority: z.enum(['high', 'medium', 'low']),
  message: z.string().min(1),
  improvement: z.string().min(1),
  triggerMetric: z.string().optional(),
  triggerValue: z.number().optional(),
  targetValue: z.number().optional(),
});

// ============================================================================
// Session Schemas
// ============================================================================

export const StartSessionRequestSchema = z.object({
  user_id: z.string().uuid(),
  session_type: z.enum(['practice', 'live', 'review', 'calibration']).default('practice'),
  title: z.string().max(255).optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export const StartSessionResponseSchema = z.object({
  session_id: z.string().uuid(),
  user_id: z.string().uuid(),
  session_type: z.string(),
  start_time: z.number(),
  message: z.string(),
});

export const StopSessionResponseSchema = z.object({
  session_id: z.string().uuid(),
  duration: z.number(),
  average_scores: FeedbackScoresSchema,
  frames_processed: z.number(),
  audio_chunks_processed: z.number(),
  message: z.string(),
});

// ============================================================================
// Metrics Schemas
// ============================================================================

export const ToneMetricsSchema = z.object({
  pitch_hz: z.number(),
  pitch_variance: z.number(),
  pitch_range: z.tuple([z.number(), z.number()]),
  volume_db: z.number(),
  volume_variance: z.number(),
  speaking_rate_wpm: z.number(),
  pitch_contour: z.enum(['rising', 'falling', 'flat', 'dynamic']),
  voice_quality: z.object({
    breathiness: z.number().min(0).max(1),
    tenseness: z.number().min(0).max(1),
    brightness: z.number().min(0).max(1),
  }),
  energy: z.number(),
  zero_crossing_rate: z.number(),
});

export const EmotionMetricsSchema = z.object({
  dominant_emotion: z.string(),
  emotion_confidence: z.number().min(0).max(1),
  emotion_scores: z.record(z.string(), z.number()),
  stress_level: z.number().min(0).max(100),
  arousal: z.number().min(0).max(1),
  valence: z.number().min(-1).max(1),
});

export const SpeechMetricsSchema = z.object({
  transcript: z.string(),
  confidence: z.number().min(0).max(1),
  word_count: z.number().int().min(0),
  filler_words: z.array(
    z.object({
      word: z.string(),
      count: z.number().int().min(0),
    })
  ),
  pause_count: z.number().int().min(0),
  pause_data: z.array(
    z.object({
      start_ms: z.number(),
      duration_ms: z.number(),
      type: z.enum(['strategic', 'hesitation']),
    })
  ),
  articulation_score: z.number().min(0).max(100),
  speaking_rate: z.number(),
  is_speaking: z.boolean(),
});

export const FacialMetricsSchema = z.object({
  dominant_emotion: z.string(),
  emotion_confidence: z.number().min(0).max(1),
  emotion_scores: z.record(z.string(), z.number()),
  micro_expressions: z.array(
    z.object({
      emotion: z.string(),
      intensity: z.number().min(0).max(1),
      duration_ms: z.number(),
    })
  ),
  eye_contact: z.number().min(0).max(100),
  gaze_direction: z.object({
    x: z.number(),
    y: z.number(),
  }),
  blink_rate: z.number(),
  smile_genuineness: z.number().min(0).max(1),
  eyebrow_position: z.enum(['raised', 'neutral', 'furrowed']),
  mouth_openness: z.number().min(0).max(1),
  head_pose: z.object({
    pitch: z.number(),
    yaw: z.number(),
    roll: z.number(),
  }),
});

export const BodyMetricsSchema = z.object({
  posture: z.enum(['open', 'closed', 'neutral']),
  posture_confidence: z.number().min(0).max(1),
  gesture_count: z.number().int().min(0),
  gestures: z.array(
    z.object({
      type: z.string(),
      hand: z.enum(['left', 'right']),
      confidence: z.number().min(0).max(1),
    })
  ),
  fidgeting_level: z.number().min(0).max(100),
  energy_level: z.number().min(0).max(100),
  head_tilt: z.number(),
  shoulder_tension: z.number().min(0).max(100),
  lean_in: z.number().min(-1).max(1),
  centering: z.number().min(0).max(1),
  symmetry: z.number().min(0).max(1),
  hand_positions: z.record(z.string(), z.record(z.string(), z.number())),
});

export const ProfessionalPresenceMetricsSchema = z.object({
  frame_positioning: z.number().min(0).max(100),
  lighting_quality: z.number().min(0).max(100),
  background_appropriateness: z.number().min(0).max(100),
  attire_professionalism: z.number().min(0).max(100),
  overall_polish: z.number().min(0).max(100),
});

// ============================================================================
// Complete Feedback Message Schema
// ============================================================================

export const FeedbackMessageSchema = z.object({
  timestamp_ms: z.number(),
  session_id: z.string().uuid(),
  type: z.enum(['realtime', 'summary', 'alert']),
  scores: FeedbackScoresSchema,
  metrics: z.object({
    facial: FacialMetricsSchema.nullable().optional(),
    body: BodyMetricsSchema.nullable().optional(),
    voice: ToneMetricsSchema.nullable().optional(),
    speech: SpeechMetricsSchema.nullable().optional(),
  }),
  suggestions: z.array(FeedbackSuggestionSchema),
  trends: FeedbackTrendsSchema,
});

// ============================================================================
// Database Record Schemas
// ============================================================================

export const FeedbackSessionSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  session_type: z.enum(['practice', 'live', 'review', 'calibration']),
  start_time: z.date(),
  end_time: z.date().nullable(),
  duration_seconds: z.number().int().nullable(),
  avg_confidence_score: z.number().min(0).max(100).nullable(),
  avg_engagement_score: z.number().min(0).max(100).nullable(),
  avg_clarity_score: z.number().min(0).max(100).nullable(),
  avg_authenticity_score: z.number().min(0).max(100).nullable(),
  avg_professional_presence: z.number().min(0).max(100).nullable(),
  total_frames_processed: z.number().int(),
  total_audio_chunks_processed: z.number().int(),
  total_words_spoken: z.number().int().nullable(),
  total_filler_words: z.number().int().nullable(),
  video_url: z.string().url().nullable(),
  audio_url: z.string().url().nullable(),
  thumbnail_url: z.string().url().nullable(),
  title: z.string().max(255).nullable(),
  description: z.string().nullable(),
  tags: z.array(z.string()).nullable(),
  recording_enabled: z.boolean(),
  data_retention_days: z.number().int(),
  created_at: z.date(),
  updated_at: z.date(),
  deleted_at: z.date().nullable(),
});

export const FeedbackFrameSchema = z.object({
  id: z.number().int(),
  session_id: z.string().uuid(),
  frame_number: z.number().int(),
  timestamp_ms: z.number().int(),
  facial_data: z.record(z.string(), z.any()),
  body_data: z.record(z.string(), z.any()),
  audio_data: z.record(z.string(), z.any()),
  confidence_score: z.number().min(0).max(100).nullable(),
  engagement_score: z.number().min(0).max(100).nullable(),
  clarity_score: z.number().min(0).max(100).nullable(),
  authenticity_score: z.number().min(0).max(100).nullable(),
  professional_presence: z.number().min(0).max(100).nullable(),
  processing_time_ms: z.number().int().nullable(),
  created_at: z.date(),
});

export const UserBaselineSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  baseline_confidence: z.number().min(0).max(100).nullable(),
  baseline_engagement: z.number().min(0).max(100).nullable(),
  baseline_clarity: z.number().min(0).max(100).nullable(),
  baseline_authenticity: z.number().min(0).max(100).nullable(),
  baseline_pitch: z.number().nullable(),
  baseline_speaking_rate: z.number().nullable(),
  baseline_blink_rate: z.number().nullable(),
  baseline_gesture_frequency: z.number().nullable(),
  calibration_sessions: z.number().int(),
  last_calibration_date: z.date().nullable(),
  is_calibrated: z.boolean(),
  created_at: z.date(),
  updated_at: z.date(),
});

// ============================================================================
// Type Exports
// ============================================================================

export type FeedbackScores = z.infer<typeof FeedbackScoresSchema>;
export type FeedbackTrends = z.infer<typeof FeedbackTrendsSchema>;
export type FeedbackSuggestion = z.infer<typeof FeedbackSuggestionSchema>;
export type FeedbackMessage = z.infer<typeof FeedbackMessageSchema>;
export type FeedbackSession = z.infer<typeof FeedbackSessionSchema>;
export type FeedbackFrame = z.infer<typeof FeedbackFrameSchema>;
export type UserBaseline = z.infer<typeof UserBaselineSchema>;
export type ToneMetrics = z.infer<typeof ToneMetricsSchema>;
export type EmotionMetrics = z.infer<typeof EmotionMetricsSchema>;
export type SpeechMetrics = z.infer<typeof SpeechMetricsSchema>;
export type FacialMetrics = z.infer<typeof FacialMetricsSchema>;
export type BodyMetrics = z.infer<typeof BodyMetricsSchema>;
export type ProfessionalPresenceMetrics = z.infer<typeof ProfessionalPresenceMetricsSchema>;
