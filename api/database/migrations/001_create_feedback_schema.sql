-- Migration: Create AI Feedback System Schema
-- Description: Tables for real-time communication feedback analysis
-- Created: 2025-10-23

-- ============================================================================
-- FEEDBACK SESSIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS feedback_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  session_type VARCHAR(50) NOT NULL CHECK (session_type IN ('practice', 'live', 'review', 'calibration')),
  start_time TIMESTAMP NOT NULL DEFAULT NOW(),
  end_time TIMESTAMP,
  duration_seconds INTEGER,

  -- Aggregate scores (0-100 scale)
  avg_confidence_score DECIMAL(5,2) CHECK (avg_confidence_score >= 0 AND avg_confidence_score <= 100),
  avg_engagement_score DECIMAL(5,2) CHECK (avg_engagement_score >= 0 AND avg_engagement_score <= 100),
  avg_clarity_score DECIMAL(5,2) CHECK (avg_clarity_score >= 0 AND avg_clarity_score <= 100),
  avg_authenticity_score DECIMAL(5,2) CHECK (avg_authenticity_score >= 0 AND avg_authenticity_score <= 100),
  avg_professional_presence DECIMAL(5,2) CHECK (avg_professional_presence >= 0 AND avg_professional_presence <= 100),

  -- Overall performance metrics
  total_frames_processed INTEGER DEFAULT 0,
  total_audio_chunks_processed INTEGER DEFAULT 0,
  total_words_spoken INTEGER DEFAULT 0,
  total_filler_words INTEGER DEFAULT 0,

  -- Media storage URLs
  video_url TEXT,
  audio_url TEXT,
  thumbnail_url TEXT,

  -- Session context
  title VARCHAR(255),
  description TEXT,
  tags TEXT[], -- Array of tags for categorization

  -- Privacy settings
  recording_enabled BOOLEAN DEFAULT TRUE,
  data_retention_days INTEGER DEFAULT 30,

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP -- Soft delete
);

CREATE INDEX idx_feedback_sessions_user_id ON feedback_sessions(user_id);
CREATE INDEX idx_feedback_sessions_start_time ON feedback_sessions(start_time DESC);
CREATE INDEX idx_feedback_sessions_session_type ON feedback_sessions(session_type);
CREATE INDEX idx_feedback_sessions_deleted ON feedback_sessions(deleted_at) WHERE deleted_at IS NULL;

-- ============================================================================
-- FEEDBACK FRAMES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS feedback_frames (
  id BIGSERIAL PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES feedback_sessions(id) ON DELETE CASCADE,
  frame_number INTEGER NOT NULL,
  timestamp_ms BIGINT NOT NULL,

  -- Vision metrics (JSONB for flexibility)
  facial_data JSONB DEFAULT '{}'::jsonb,
  /*
  Structure:
  {
    "dominantEmotion": "neutral",
    "emotionConfidence": 0.92,
    "emotions": {"happy": 0.1, "sad": 0.05, "angry": 0.02, ...},
    "microExpressions": [{"emotion": "surprise", "intensity": 0.8, "duration_ms": 150}],
    "landmarks": [...], // 468 face landmarks
    "eyeContact": 85,
    "gazeDirection": {"x": 0.1, "y": -0.2},
    "blinkRate": 18,
    "smileGenuineness": 0.75 // Duchenne marker
  }
  */

  body_data JSONB DEFAULT '{}'::jsonb,
  /*
  Structure:
  {
    "posture": "open",
    "postureConfidence": 0.88,
    "landmarks": [...], // 33 pose landmarks
    "gestureCount": 3,
    "gestures": [{"type": "pointing", "confidence": 0.9, "hand": "right"}],
    "fidgetingLevel": 15,
    "energyLevel": 72,
    "headTilt": 3.5,
    "shoulderTension": 25,
    "leanIn": 0.15,
    "centering": 0.92,
    "handPositions": {"left": {"x": 0.3, "y": 0.5}, "right": {"x": 0.7, "y": 0.5}}
  }
  */

  -- Audio metrics
  audio_data JSONB DEFAULT '{}'::jsonb,
  /*
  Structure:
  {
    "pitch": 180.5, // Hz
    "pitchVariance": 25.3,
    "volume": -12.5, // dB
    "volumeVariance": 8.2,
    "speakingRate": 145, // words per minute
    "emotionalTone": "confident",
    "emotionConfidence": 0.85,
    "stressLevel": 22,
    "voiceQuality": {"breathiness": 0.2, "tenseness": 0.3},
    "isSpeaking": true
  }
  */

  -- Real-time scores at this frame
  confidence_score DECIMAL(5,2),
  engagement_score DECIMAL(5,2),
  clarity_score DECIMAL(5,2),
  authenticity_score DECIMAL(5,2),
  professional_presence DECIMAL(5,2),

  -- Processing metadata
  processing_time_ms INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_feedback_frames_session_id ON feedback_frames(session_id);
CREATE INDEX idx_feedback_frames_timestamp ON feedback_frames(session_id, timestamp_ms);
CREATE INDEX idx_feedback_frames_frame_number ON feedback_frames(session_id, frame_number);

-- ============================================================================
-- FEEDBACK TRANSCRIPTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS feedback_transcripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES feedback_sessions(id) ON DELETE CASCADE,
  start_time_ms BIGINT NOT NULL,
  end_time_ms BIGINT NOT NULL,

  -- Transcription
  text TEXT NOT NULL,
  confidence DECIMAL(5,2),
  words JSONB, -- Array of {word, start_ms, end_ms, confidence}

  -- Speech analysis
  filler_words JSONB DEFAULT '[]'::jsonb, -- [{"word": "um", "count": 3, "timestamps": [1000, 2500, 4200]}]
  pause_count INTEGER DEFAULT 0,
  pause_data JSONB DEFAULT '[]'::jsonb, -- [{"start_ms": 1000, "duration_ms": 500, "type": "hesitation"}]
  articulation_score DECIMAL(5,2),
  vocabulary_complexity DECIMAL(5,2),
  sentence_count INTEGER DEFAULT 0,

  -- Linguistic features
  reading_level DECIMAL(4,2), -- Flesch-Kincaid grade level
  jargon_words TEXT[],
  sentiment_score DECIMAL(5,2), -- -1 to 1 scale

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_feedback_transcripts_session_id ON feedback_transcripts(session_id);
CREATE INDEX idx_feedback_transcripts_time_range ON feedback_transcripts(session_id, start_time_ms, end_time_ms);

-- ============================================================================
-- FEEDBACK SUGGESTIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS feedback_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES feedback_sessions(id) ON DELETE CASCADE,
  timestamp_ms BIGINT NOT NULL,

  category VARCHAR(50) NOT NULL CHECK (category IN ('voice', 'body', 'facial', 'speech', 'engagement', 'professional')),
  priority VARCHAR(20) NOT NULL CHECK (priority IN ('high', 'medium', 'low')),

  message TEXT NOT NULL,
  improvement_suggestion TEXT,

  -- Specific metric that triggered suggestion
  trigger_metric VARCHAR(100),
  trigger_value DECIMAL(10,2),
  target_value DECIMAL(10,2),

  -- User interaction
  dismissed BOOLEAN DEFAULT FALSE,
  dismissed_at TIMESTAMP,
  helpful_rating INTEGER CHECK (helpful_rating >= 1 AND helpful_rating <= 5),
  user_notes TEXT,

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_feedback_suggestions_session_id ON feedback_suggestions(session_id);
CREATE INDEX idx_feedback_suggestions_category ON feedback_suggestions(session_id, category);
CREATE INDEX idx_feedback_suggestions_priority ON feedback_suggestions(priority) WHERE NOT dismissed;

-- ============================================================================
-- DIALECT PROFILES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS dialect_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,

  -- Detected dialect information
  detected_region VARCHAR(100), -- e.g., "Southern US", "British RP", "Australian"
  confidence DECIMAL(5,2),

  -- Phonetic features
  accent_features JSONB DEFAULT '{}'::jsonb,
  /*
  Structure:
  {
    "rhoticity": 0.85, // R-dropping tendency
    "vowelShifts": {"lot": "low-back", "thought": "rounded"},
    "intonationPattern": "falling",
    "speechRate": "moderate",
    "diagnosticWords": {
      "water": "wah-ter",
      "car": "cah",
      "caught": "cot"
    }
  }
  */

  -- Baseline recordings
  baseline_recording_url TEXT,
  calibration_session_id UUID REFERENCES feedback_sessions(id),

  -- Accent modification tracking
  target_accent VARCHAR(100),
  progress_score DECIMAL(5,2),

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_dialect_profiles_user_id ON dialect_profiles(user_id);

-- ============================================================================
-- USER BASELINES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_feedback_baselines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,

  -- Baseline scores (established after 3+ calibration sessions)
  baseline_confidence DECIMAL(5,2),
  baseline_engagement DECIMAL(5,2),
  baseline_clarity DECIMAL(5,2),
  baseline_authenticity DECIMAL(5,2),

  -- Physical baseline metrics
  baseline_pitch DECIMAL(6,2), -- Average pitch in Hz
  baseline_speaking_rate DECIMAL(6,2), -- Words per minute
  baseline_blink_rate DECIMAL(5,2), -- Blinks per minute
  baseline_gesture_frequency DECIMAL(5,2), -- Gestures per minute

  -- Calibration metadata
  calibration_sessions INTEGER DEFAULT 0,
  last_calibration_date TIMESTAMP,
  is_calibrated BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_user_feedback_baselines_user_id ON user_feedback_baselines(user_id);

-- ============================================================================
-- SESSION TRENDS TABLE (Pre-aggregated for performance)
-- ============================================================================
CREATE TABLE IF NOT EXISTS feedback_session_trends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES feedback_sessions(id) ON DELETE CASCADE,
  time_bucket TIMESTAMP NOT NULL, -- 5-second buckets

  -- Averaged scores for this time bucket
  avg_confidence DECIMAL(5,2),
  avg_engagement DECIMAL(5,2),
  avg_clarity DECIMAL(5,2),
  avg_authenticity DECIMAL(5,2),

  -- Key metrics
  avg_pitch DECIMAL(6,2),
  avg_volume DECIMAL(6,2),
  avg_energy_level DECIMAL(5,2),
  dominant_emotion VARCHAR(50),
  words_spoken INTEGER DEFAULT 0,
  filler_word_count INTEGER DEFAULT 0,

  -- Deltas from previous bucket
  confidence_delta DECIMAL(6,2),
  engagement_delta DECIMAL(6,2),

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_feedback_session_trends_session_id ON feedback_session_trends(session_id);
CREATE INDEX idx_feedback_session_trends_time_bucket ON feedback_session_trends(session_id, time_bucket);

-- ============================================================================
-- CHARISMA MOMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS charisma_moments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES feedback_sessions(id) ON DELETE CASCADE,
  timestamp_ms BIGINT NOT NULL,
  duration_ms INTEGER NOT NULL,

  -- Charisma score for this moment
  charisma_score DECIMAL(5,2) NOT NULL,

  -- Contributing factors
  factors JSONB DEFAULT '{}'::jsonb,
  /*
  Structure:
  {
    "emotionalPeak": true,
    "energySpike": true,
    "perfectTiming": true,
    "authenticExpression": true,
    "engagingGesture": true
  }
  */

  -- Clip information
  clip_url TEXT,
  thumbnail_url TEXT,

  -- User interaction
  bookmarked BOOLEAN DEFAULT FALSE,
  replay_count INTEGER DEFAULT 0,

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_charisma_moments_session_id ON charisma_moments(session_id);
CREATE INDEX idx_charisma_moments_score ON charisma_moments(charisma_score DESC);

-- ============================================================================
-- ACHIEVEMENTS TABLE (Gamification)
-- ============================================================================
CREATE TABLE IF NOT EXISTS feedback_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  achievement_type VARCHAR(100) NOT NULL,

  -- Achievement details
  name VARCHAR(255) NOT NULL,
  description TEXT,
  icon_url TEXT,

  -- Requirements
  requirement_value INTEGER,
  current_value INTEGER DEFAULT 0,
  is_unlocked BOOLEAN DEFAULT FALSE,

  unlocked_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_feedback_achievements_user_id ON feedback_achievements(user_id);
CREATE INDEX idx_feedback_achievements_unlocked ON feedback_achievements(user_id, is_unlocked);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to update session duration and aggregate scores
CREATE OR REPLACE FUNCTION update_feedback_session_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.end_time IS NOT NULL THEN
    NEW.duration_seconds := EXTRACT(EPOCH FROM (NEW.end_time - NEW.start_time));

    -- Calculate aggregate scores from frames
    SELECT
      AVG(confidence_score),
      AVG(engagement_score),
      AVG(clarity_score),
      AVG(authenticity_score),
      AVG(professional_presence),
      COUNT(*)
    INTO
      NEW.avg_confidence_score,
      NEW.avg_engagement_score,
      NEW.avg_clarity_score,
      NEW.avg_authenticity_score,
      NEW.avg_professional_presence,
      NEW.total_frames_processed
    FROM feedback_frames
    WHERE session_id = NEW.id;

    -- Calculate word counts from transcripts
    SELECT
      SUM(sentence_count),
      SUM(jsonb_array_length(filler_words))
    INTO
      NEW.total_words_spoken,
      NEW.total_filler_words
    FROM feedback_transcripts
    WHERE session_id = NEW.id;
  END IF;

  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_feedback_session_stats
  BEFORE UPDATE ON feedback_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_feedback_session_stats();

-- Function to create session trend buckets
CREATE OR REPLACE FUNCTION create_feedback_trend_bucket()
RETURNS TRIGGER AS $$
DECLARE
  bucket_timestamp TIMESTAMP;
BEGIN
  -- Round to nearest 5-second bucket
  bucket_timestamp := date_trunc('minute', NEW.created_at) +
                      ((EXTRACT(SECOND FROM NEW.created_at)::int / 5) * 5 || ' seconds')::interval;

  INSERT INTO feedback_session_trends (
    session_id,
    time_bucket,
    avg_confidence,
    avg_engagement,
    avg_clarity,
    avg_authenticity
  )
  VALUES (
    NEW.session_id,
    bucket_timestamp,
    NEW.confidence_score,
    NEW.engagement_score,
    NEW.clarity_score,
    NEW.authenticity_score
  )
  ON CONFLICT (session_id, time_bucket) DO UPDATE SET
    avg_confidence = (feedback_session_trends.avg_confidence + EXCLUDED.avg_confidence) / 2,
    avg_engagement = (feedback_session_trends.avg_engagement + EXCLUDED.avg_engagement) / 2,
    avg_clarity = (feedback_session_trends.avg_clarity + EXCLUDED.avg_clarity) / 2,
    avg_authenticity = (feedback_session_trends.avg_authenticity + EXCLUDED.avg_authenticity) / 2;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Note: Removed trigger creation for now - will add unique constraint first if needed

-- ============================================================================
-- SAMPLE DATA FOR TESTING
-- ============================================================================

-- Insert sample user baseline (for testing)
INSERT INTO user_feedback_baselines (
  user_id,
  baseline_confidence,
  baseline_engagement,
  baseline_clarity,
  baseline_authenticity,
  baseline_pitch,
  baseline_speaking_rate,
  baseline_blink_rate,
  baseline_gesture_frequency,
  calibration_sessions,
  is_calibrated
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid, -- Placeholder user ID
  65.5,
  72.3,
  68.9,
  70.1,
  180.5,
  145.0,
  18.5,
  12.3,
  3,
  true
) ON CONFLICT (user_id) DO NOTHING;

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE feedback_sessions IS 'Stores feedback session metadata and aggregate scores';
COMMENT ON TABLE feedback_frames IS 'Frame-by-frame vision and audio analysis data';
COMMENT ON TABLE feedback_transcripts IS 'Speech transcriptions with linguistic analysis';
COMMENT ON TABLE feedback_suggestions IS 'Real-time actionable suggestions provided to users';
COMMENT ON TABLE dialect_profiles IS 'User-specific dialect and accent characteristics';
COMMENT ON TABLE user_feedback_baselines IS 'Calibrated baseline metrics for personalized feedback';
COMMENT ON TABLE feedback_session_trends IS 'Pre-aggregated 5-second trend buckets for performance';
COMMENT ON TABLE charisma_moments IS 'High-impact moments worthy of replay and study';
COMMENT ON TABLE feedback_achievements IS 'Gamification achievements to motivate improvement';
