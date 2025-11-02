# Real-Time AI Feedback System Architecture

## Overview

A comprehensive real-time communication feedback system that analyzes multiple modalities:
- **Tone Analysis**: Vocal pitch, pace, volume, emotion
- **Body Language**: Posture, gestures, movement patterns
- **Facial Expressions**: Micro-expressions, emotional states
- **Speech Analysis**: Dialect variation, articulation, filler words
- **Engagement Metrics**: Eye contact, attention, energy levels
- **Communication Quality**: Clarity, confidence, authenticity

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    CLIENT (Browser)                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────┐         ┌──────────────────┐             │
│  │  Video Capture   │         │  Audio Capture   │             │
│  │  (MediaStream)   │         │  (Web Audio API) │             │
│  └────────┬─────────┘         └────────┬─────────┘             │
│           │                             │                        │
│           ▼                             ▼                        │
│  ┌─────────────────────────────────────────────────┐           │
│  │     Edge Processing (TensorFlow.js)              │           │
│  │  - Face landmarks (real-time)                    │           │
│  │  - Basic pose detection                          │           │
│  │  - Audio feature extraction                      │           │
│  └─────────────────┬───────────────────────────────┘           │
│                    │                                             │
│                    ▼                                             │
│  ┌─────────────────────────────────────────────────┐           │
│  │         WebSocket Client                         │           │
│  │  - Sends video frames (compressed)               │           │
│  │  - Sends audio chunks (16kHz, mono)              │           │
│  │  - Receives real-time feedback                   │           │
│  └─────────────────┬───────────────────────────────┘           │
│                    │                                             │
└────────────────────┼─────────────────────────────────────────────┘
                     │
                     │ WebSocket (wss://)
                     │
┌────────────────────▼─────────────────────────────────────────────┐
│                 BACKEND SERVICES                                  │
├───────────────────────────────────────────────────────────────────┤
│                                                                    │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │          WebSocket Feedback Server (Node.js)             │    │
│  │  - Connection management                                 │    │
│  │  - Frame/audio buffer management                         │    │
│  │  - Real-time feedback routing                            │    │
│  └────────────┬──────────────────────────┬──────────────────┘    │
│               │                          │                        │
│               ▼                          ▼                        │
│  ┌────────────────────┐    ┌───────────────────────────┐        │
│  │  Video Processing   │    │   Audio Processing        │        │
│  │  Queue (Redis)      │    │   Queue (Redis)           │        │
│  └──────────┬──────────┘    └────────────┬──────────────┘        │
│             │                            │                        │
│             ▼                            ▼                        │
│  ┌──────────────────────────────────────────────────────┐       │
│  │         AI Analysis Workers (Python/FastAPI)          │       │
│  │                                                        │       │
│  │  ┌──────────────────────────────────────────────┐   │       │
│  │  │  Vision Analysis (MediaPipe + OpenCV)        │   │       │
│  │  │  - Face mesh (468 landmarks)                 │   │       │
│  │  │  - Pose detection (33 landmarks)             │   │       │
│  │  │  - Hand tracking (21 landmarks per hand)     │   │       │
│  │  │  - Gaze direction                            │   │       │
│  │  │  - Micro-expression classification           │   │       │
│  │  └──────────────────────────────────────────────┘   │       │
│  │                                                        │       │
│  │  ┌──────────────────────────────────────────────┐   │       │
│  │  │  Audio Analysis (librosa + transformers)     │   │       │
│  │  │  - Pitch tracking (F0 extraction)            │   │       │
│  │  │  - Speech-to-text (Whisper)                  │   │       │
│  │  │  - Emotion recognition (wav2vec2)            │   │       │
│  │  │  - Prosody analysis (pace, volume, pauses)   │   │       │
│  │  │  - Dialect/accent detection                  │   │       │
│  │  │  - Filler word detection                     │   │       │
│  │  └──────────────────────────────────────────────┘   │       │
│  │                                                        │       │
│  │  ┌──────────────────────────────────────────────┐   │       │
│  │  │  Feedback Scoring Engine                     │   │       │
│  │  │  - Confidence score (0-100)                  │   │       │
│  │  │  - Engagement score (0-100)                  │   │       │
│  │  │  - Clarity score (0-100)                     │   │       │
│  │  │  - Authenticity score (0-100)                │   │       │
│  │  │  - Professional presence (0-100)             │   │       │
│  │  └──────────────────────────────────────────────┘   │       │
│  │                                                        │       │
│  └────────────────────────┬───────────────────────────────┘       │
│                           │                                        │
│                           ▼                                        │
│  ┌─────────────────────────────────────────────────────────┐     │
│  │              Feedback Storage Layer                      │     │
│  │  - PostgreSQL (structured feedback history)             │     │
│  │  - Redis (real-time metrics cache)                      │     │
│  │  - MinIO (video/audio recordings)                       │     │
│  └─────────────────────────────────────────────────────────┘     │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

## Component Details

### 1. Video/Audio Capture Module
**Location**: `/apps/web/lib/feedback/capture.ts`

**Features**:
- MediaStream API for camera/microphone access
- Configurable quality settings (720p, 30fps default)
- Audio resampling to 16kHz mono
- Frame extraction and compression
- Privacy controls (blur background, audio-only mode)

### 2. Vision Analysis Engine
**Location**: `/api/feedback/vision_analyzer.py`

**Capabilities**:
- **Facial Expression Analysis**:
  - 7 basic emotions (happy, sad, angry, fearful, disgusted, surprised, neutral)
  - Micro-expression detection (fleeting emotions <500ms)
  - Eye contact tracking (gaze direction)
  - Blink rate analysis (stress indicator)
  - Eyebrow position (engagement marker)

- **Body Language Analysis**:
  - Posture classification (open, closed, neutral)
  - Gesture recognition (hand movements, pointing)
  - Fidgeting detection (self-touching, repetitive movements)
  - Shoulder tension analysis
  - Energy level estimation (movement magnitude)

- **Professional Presence**:
  - Centering in frame
  - Head tilt (confidence indicator)
  - Lean-in behavior (engagement)
  - Symmetry analysis

### 3. Audio Analysis Engine
**Location**: `/api/feedback/audio_analyzer.py`

**Capabilities**:
- **Tone Analysis**:
  - Pitch (F0) tracking and variance
  - Volume levels and dynamic range
  - Speaking rate (words per minute)
  - Pitch contour analysis (intonation patterns)
  - Voice quality (breathiness, tenseness)

- **Speech Analysis**:
  - Transcription (OpenAI Whisper)
  - Filler word detection ("um", "uh", "like", "you know")
  - Pause analysis (hesitation vs. strategic pauses)
  - Articulation clarity
  - Word choice sophistication

- **Dialect/Accent Analysis**:
  - Regional accent classification (US, UK, Australian, etc.)
  - Accent strength estimation
  - Phoneme-level analysis
  - Code-switching detection

- **Emotion from Voice**:
  - Emotional prosody (angry, happy, sad, neutral)
  - Stress level detection
  - Confidence markers (vocal fry, upspeak)

### 4. Feedback Scoring Engine
**Location**: `/lib/analytics/feedback-scoring-engine.ts`

**Multi-Dimensional Scoring** (inspired by Diamond Certainty Engine):

1. **Confidence Score (0-100)**
   - Vocal steadiness: 25%
   - Posture openness: 25%
   - Eye contact: 20%
   - Gesture decisiveness: 15%
   - Filler word frequency (inverse): 15%

2. **Engagement Score (0-100)**
   - Facial expressiveness: 30%
   - Energy level (movement): 25%
   - Vocal variety (pitch/volume range): 25%
   - Lean-in behavior: 20%

3. **Clarity Score (0-100)**
   - Articulation quality: 30%
   - Speaking pace (optimal 140-160 WPM): 25%
   - Logical flow (topic coherence): 25%
   - Filler word ratio (inverse): 20%

4. **Authenticity Score (0-100)**
   - Micro-expression congruence: 30%
   - Vocal-visual emotion alignment: 30%
   - Natural gesture patterns: 20%
   - Smile genuineness (Duchenne markers): 20%

5. **Professional Presence (0-100)**
   - Grooming/attire appropriateness: 20%
   - Background professionalism: 20%
   - Frame positioning: 20%
   - Lighting quality: 20%
   - Overall polish: 20%

### 5. Real-Time Feedback Delivery
**WebSocket Message Format**:

```typescript
interface FeedbackMessage {
  timestamp: number;
  sessionId: string;
  type: 'realtime' | 'summary' | 'alert';

  // Aggregate scores
  scores: {
    confidence: number;
    engagement: number;
    clarity: number;
    authenticity: number;
    professionalPresence: number;
  };

  // Detailed metrics
  metrics: {
    facial: {
      dominantEmotion: string;
      emotionConfidence: number;
      microExpressions: Array<{emotion: string, intensity: number}>;
      eyeContact: number; // 0-100
      blinkRate: number; // per minute
    };

    body: {
      posture: 'open' | 'closed' | 'neutral';
      gestureCount: number;
      fidgetingLevel: number; // 0-100
      energyLevel: number; // 0-100
      headTilt: number; // degrees
    };

    voice: {
      pitch: number; // Hz
      pitchVariance: number;
      volume: number; // dB
      speakingRate: number; // WPM
      emotionalTone: string;
      stressLevel: number; // 0-100
    };

    speech: {
      transcript: string;
      fillerWords: Array<{word: string, count: number}>;
      pauseCount: number;
      articulationScore: number; // 0-100
      dialect: {
        region: string;
        confidence: number;
      };
    };
  };

  // Actionable suggestions
  suggestions: Array<{
    category: string;
    priority: 'high' | 'medium' | 'low';
    message: string;
    improvement: string;
  }>;

  // Trends (5-second rolling window)
  trends: {
    confidenceDelta: number; // +/- change
    engagementDelta: number;
    clarityDelta: number;
  };
}
```

### 6. Creative Novel Features

**A. Charisma Heatmap**
- Tracks which moments elicited strongest positive response
- Visual timeline showing engagement peaks/valleys
- Identifies "charisma moments" for replay

**B. Mirror Mode**
- Side-by-side comparison with exemplar speakers
- Overlay expert body language patterns
- Real-time deviation highlighting

**C. Cognitive Load Detection**
- Pupil dilation tracking
- Increased blink rate
- Speech hesitations
- Suggests when to pause or simplify

**D. Cultural Adaptation Insights**
- Detects audience cultural context
- Suggests gesture modifications (e.g., avoid "thumbs up" in certain cultures)
- Adapts formality recommendations

**E. Voice Signature Analysis**
- Creates unique vocal fingerprint
- Tracks consistency across sessions
- Detects stress-induced voice changes

**F. Micro-Learning Moments**
- Pauses session to deliver 5-second coaching tips
- Gamified improvement challenges
- Achievement unlocks for mastery

**G. Audience Simulation Mode**
- AI-generated virtual audience reactions
- Adaptive difficulty (friendly → challenging)
- Prepares for high-stakes presentations

**H. Breath Pattern Analysis**
- Respiratory rate from chest movement
- Breath control quality
- Anxiety detection from shallow breathing

**I. Linguistic Complexity Scoring**
- Vocabulary sophistication
- Sentence structure variety
- Reading level estimation
- Jargon detection

**J. Energy Pacing Coach**
- Tracks energy expenditure over session
- Suggests when to modulate intensity
- Prevents burnout in long presentations

## Database Schema

### feedback_sessions
```sql
CREATE TABLE feedback_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  session_type VARCHAR(50) NOT NULL, -- 'practice', 'live', 'review'
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP,
  duration_seconds INTEGER,

  -- Aggregate scores
  avg_confidence_score DECIMAL(5,2),
  avg_engagement_score DECIMAL(5,2),
  avg_clarity_score DECIMAL(5,2),
  avg_authenticity_score DECIMAL(5,2),
  avg_professional_presence DECIMAL(5,2),

  -- Media storage
  video_url TEXT,
  audio_url TEXT,

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_feedback_sessions_user_id ON feedback_sessions(user_id);
CREATE INDEX idx_feedback_sessions_start_time ON feedback_sessions(start_time);
```

### feedback_frames
```sql
CREATE TABLE feedback_frames (
  id BIGSERIAL PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES feedback_sessions(id),
  frame_number INTEGER NOT NULL,
  timestamp_ms BIGINT NOT NULL,

  -- Vision metrics (JSONB for flexibility)
  facial_data JSONB, -- emotions, landmarks, gaze
  body_data JSONB,   -- pose, gestures, posture

  -- Audio metrics
  audio_data JSONB,  -- pitch, volume, prosody

  -- Scores at this moment
  confidence_score DECIMAL(5,2),
  engagement_score DECIMAL(5,2),
  clarity_score DECIMAL(5,2),

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_feedback_frames_session_id ON feedback_frames(session_id);
CREATE INDEX idx_feedback_frames_timestamp ON feedback_frames(session_id, timestamp_ms);
```

### feedback_suggestions
```sql
CREATE TABLE feedback_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES feedback_sessions(id),
  timestamp_ms BIGINT NOT NULL,

  category VARCHAR(50) NOT NULL, -- 'voice', 'body', 'facial', 'speech'
  priority VARCHAR(20) NOT NULL, -- 'high', 'medium', 'low'
  message TEXT NOT NULL,
  improvement_suggestion TEXT,

  -- User interaction
  dismissed BOOLEAN DEFAULT FALSE,
  helpful_rating INTEGER, -- 1-5 stars

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_feedback_suggestions_session_id ON feedback_suggestions(session_id);
```

### dialect_profiles
```sql
CREATE TABLE dialect_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,

  detected_region VARCHAR(100),
  confidence DECIMAL(5,2),
  accent_features JSONB, -- phonetic markers

  -- Tracking changes over time
  baseline_recording_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_dialect_profiles_user_id ON dialect_profiles(user_id);
```

## API Endpoints

### Session Management
```
POST   /api/v1/feedback/sessions/start
POST   /api/v1/feedback/sessions/:id/stop
GET    /api/v1/feedback/sessions/:id
GET    /api/v1/feedback/sessions (list with filters)
DELETE /api/v1/feedback/sessions/:id
```

### Real-Time Feedback
```
WS     /api/feedback/stream (WebSocket connection)
POST   /api/v1/feedback/process-frame (single frame analysis)
POST   /api/v1/feedback/process-audio (audio chunk analysis)
```

### Analytics
```
GET    /api/v1/feedback/analytics/:userId/trends
GET    /api/v1/feedback/analytics/:sessionId/summary
GET    /api/v1/feedback/analytics/:sessionId/timeline
GET    /api/v1/feedback/analytics/leaderboard
```

### Calibration
```
POST   /api/v1/feedback/calibrate/baseline (establish user baseline)
POST   /api/v1/feedback/calibrate/dialect (dialect profiling)
GET    /api/v1/feedback/calibrate/status/:userId
```

## Deployment Considerations

### Performance Targets
- **Latency**: <200ms frame-to-feedback
- **Throughput**: 100 concurrent sessions
- **Frame Rate**: 10 FPS processing (30 FPS capture with sampling)
- **Audio Chunk**: 1-second buffers

### Scalability
- **Horizontal scaling**: Multiple AI worker instances
- **Load balancing**: Redis-based job distribution
- **Caching**: Aggressive Redis caching for user baselines
- **CDN**: Video/audio storage via MinIO + CDN

### Privacy & Security
- **Encryption**: End-to-end encryption for video/audio streams
- **Data retention**: 30-day automatic deletion
- **Opt-in recording**: Explicit consent for session recording
- **Anonymization**: Face blurring option for privacy mode
- **GDPR compliance**: Right to deletion, data export

## Technology Stack Summary

### Frontend
- React 19 + TypeScript
- MediaStream API (video/audio capture)
- Web Audio API (audio processing)
- TensorFlow.js (edge inference)
- Canvas API (visualization)
- WebSocket (real-time communication)

### Backend
- **WebSocket Server**: Node.js + Express + ws library
- **AI Processing**: Python 3.11 + FastAPI
- **Computer Vision**: MediaPipe, OpenCV
- **Audio Processing**: librosa, Whisper, wav2vec2
- **Job Queue**: Redis + Bull/Celery
- **Database**: PostgreSQL 15+
- **Storage**: MinIO S3

### ML Models
- **Face Analysis**: MediaPipe Face Mesh + custom emotion classifier
- **Pose Detection**: MediaPipe Pose
- **Speech-to-Text**: OpenAI Whisper (base or small model)
- **Emotion from Audio**: wav2vec2-large-xlsr-53-emotion
- **Dialect Detection**: Custom fine-tuned transformer model

## Next Steps

1. Implement core capture module
2. Build vision and audio analyzers
3. Extend WebSocket server
4. Create feedback scoring engine
5. Build frontend dashboard
6. Deploy and test at scale
