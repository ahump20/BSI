# Real-Time AI Feedback System

## Overview

A comprehensive real-time communication feedback system that analyzes:
- **Tone Analysis**: Vocal pitch, pace, volume, emotion
- **Body Language**: Posture, gestures, movement patterns
- **Facial Expressions**: Micro-expressions, emotional states, eye contact
- **Speech Analysis**: Dialect variation, articulation, filler words
- **Engagement Metrics**: Energy levels, attention, professional presence

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    CLIENT (Browser)                              │
│  - MediaStream API (Video/Audio Capture)                        │
│  - WebSocket Client (Real-time Streaming)                       │
│  - React Dashboard (Visualization)                              │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           │ WebSocket (wss://)
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│              BACKEND SERVICES (FastAPI)                          │
│  - WebSocket Feedback Server                                    │
│  - Audio Analyzer (librosa, Whisper, wav2vec2)                 │
│  - Vision Analyzer (MediaPipe, OpenCV)                         │
│  - Feedback Scoring Engine                                     │
│  - Redis (Caching & Pub/Sub)                                   │
│  - PostgreSQL (Persistent Storage)                             │
└──────────────────────────────────────────────────────────────────┘
```

## Setup

### Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL 15+
- Redis 7+
- FFmpeg (for audio processing)

### Backend Installation

1. **Install Python dependencies**:
```bash
cd api/feedback
pip install -r requirements.txt
```

2. **Install Whisper (Speech-to-Text)**:
```bash
pip install git+https://github.com/openai/whisper.git
```

3. **Download ML models** (first run will auto-download):
```bash
python -c "from transformers import Wav2Vec2Processor, Wav2Vec2ForSequenceClassification; \
  Wav2Vec2Processor.from_pretrained('ehcalabres/wav2vec2-lg-xlsr-en-speech-emotion-recognition'); \
  Wav2Vec2ForSequenceClassification.from_pretrained('ehcalabres/wav2vec2-lg-xlsr-en-speech-emotion-recognition')"
```

4. **Initialize database**:
```bash
psql -U postgres -d bsi < ../database/migrations/001_create_feedback_schema.sql
```

5. **Start Redis** (if not running):
```bash
redis-server
```

6. **Configure environment variables**:
```bash
export DATABASE_URL="postgresql://user:pass@localhost:5432/bsi"
export REDIS_URL="redis://localhost:6379/0"
export ENABLE_AUDIO=true
export ENABLE_VISION=true
```

### Frontend Installation

1. **Install dependencies**:
```bash
cd apps/web
pnpm install
```

2. **Configure environment**:
```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_HOST=localhost:8000
```

3. **Build and run**:
```bash
pnpm dev
```

## Usage

### Starting a Feedback Session

1. **Navigate to practice page**:
```
http://localhost:3000/feedback/practice
```

2. **Allow camera and microphone access** when prompted

3. **View real-time feedback**:
   - Performance scores (Confidence, Engagement, Clarity, etc.)
   - Actionable suggestions
   - Trend indicators

### API Endpoints

#### Session Management

**Start Session**:
```bash
POST /api/v1/feedback/sessions/start
Content-Type: application/json

{
  "user_id": "uuid",
  "session_type": "practice",
  "title": "Practice Session"
}

Response:
{
  "session_id": "uuid",
  "user_id": "uuid",
  "session_type": "practice",
  "start_time": 1698765432.123,
  "message": "Session started successfully"
}
```

**Stop Session**:
```bash
POST /api/v1/feedback/sessions/{session_id}/stop

Response:
{
  "session_id": "uuid",
  "duration": 300.5,
  "average_scores": {
    "confidence": 75.2,
    "engagement": 82.1,
    ...
  },
  "frames_processed": 1500,
  "audio_chunks_processed": 300
}
```

#### Real-Time Processing

**Process Frame** (HTTP):
```bash
POST /api/v1/feedback/process-frame
Content-Type: multipart/form-data

session_id: uuid
timestamp_ms: 1698765432000
frame: [image file]
```

**Process Audio** (HTTP):
```bash
POST /api/v1/feedback/process-audio
Content-Type: multipart/form-data

session_id: uuid
timestamp_ms: 1698765432000
sample_rate: 16000
audio: [audio file]
```

#### WebSocket Streaming

**Connect**:
```javascript
const ws = new WebSocket('ws://localhost:8000/api/v1/feedback/stream/{session_id}');

ws.onopen = () => {
  console.log('Connected');
};

ws.onmessage = (event) => {
  const feedback = JSON.parse(event.data);
  console.log('Feedback:', feedback);
};
```

**Send Frame**:
```javascript
ws.send(JSON.stringify({
  type: 'frame',
  timestamp_ms: Date.now(),
  frame_number: 123,
  data: base64EncodedImageData
}));
```

**Send Audio**:
```javascript
ws.send(JSON.stringify({
  type: 'audio',
  timestamp_ms: Date.now(),
  sample_rate: 16000,
  data: base64EncodedAudioData
}));
```

**Receive Feedback**:
```javascript
{
  "type": "feedback",
  "timestamp_ms": 1698765432000,
  "scores": {
    "confidence": 75.2,
    "engagement": 82.1,
    "clarity": 68.5,
    "authenticity": 79.3,
    "professionalPresence": 71.8
  },
  "metrics": {
    "facial": { ... },
    "body": { ... },
    "voice": { ... },
    "speech": { ... }
  },
  "suggestions": [
    {
      "category": "speech",
      "priority": "high",
      "message": "You used 8 filler words",
      "improvement": "Try pausing instead of using filler words"
    }
  ],
  "trends": {
    "confidenceDelta": 2.5,
    "engagementDelta": -1.2,
    "clarityDelta": 0.8
  }
}
```

## Components

### Audio Analyzer (`audio_analyzer.py`)

**Features**:
- Pitch tracking (F0 extraction)
- Volume and prosody analysis
- Speech-to-text (Whisper)
- Emotion recognition (wav2vec2)
- Filler word detection
- Dialect/accent detection

**Usage**:
```python
from api.feedback.audio_analyzer import get_audio_analyzer

analyzer = get_audio_analyzer()
result = analyzer.analyze(audio_array, timestamp_ms, sample_rate=16000)

print(f"Tone: {result.tone}")
print(f"Emotion: {result.emotion.dominant_emotion}")
print(f"Transcript: {result.speech.transcript}")
```

### Vision Analyzer (`vision_analyzer.py`)

**Features**:
- Facial expression analysis (7 emotions + micro-expressions)
- Eye contact tracking
- Blink rate detection
- Body language (posture, gestures)
- Energy level estimation
- Professional presence assessment

**Usage**:
```python
from api.feedback.vision_analyzer import get_vision_analyzer
import cv2

analyzer = get_vision_analyzer()
frame = cv2.imread('frame.jpg')
result = analyzer.analyze(frame, frame_number=1, timestamp_ms=1000)

print(f"Emotion: {result.facial.dominant_emotion}")
print(f"Eye contact: {result.facial.eye_contact}")
print(f"Posture: {result.body.posture}")
```

### Feedback Processor (`feedback_processor.py`)

**Features**:
- Session management
- Real-time processing orchestration
- Score calculation
- Suggestion generation
- Trend analysis

**Usage**:
```python
from api.feedback.feedback_processor import get_feedback_processor

processor = get_feedback_processor()

# Start session
session = await processor.start_session(
    session_id="uuid",
    user_id="uuid",
    session_type="practice"
)

# Process frame
vision_result = await processor.process_frame(
    session_id="uuid",
    frame_data=frame_bytes,
    timestamp_ms=1000
)

# Process audio
audio_result = await processor.process_audio(
    session_id="uuid",
    audio_data=audio_bytes,
    timestamp_ms=1000
)

# Generate feedback
feedback = await processor.generate_feedback(
    session_id="uuid",
    audio_metrics=audio_result,
    vision_metrics=vision_result
)
```

### Frontend Components

**MediaCapture** (`capture.ts`):
```typescript
import { MediaCapture, DEFAULT_CAPTURE_CONFIG } from '@/lib/feedback/capture';

const capture = new MediaCapture(DEFAULT_CAPTURE_CONFIG, {
  onFrame: (frameBlob, timestamp) => {
    // Handle frame
  },
  onAudioChunk: (audioData, timestamp) => {
    // Handle audio
  }
});

await capture.start();
```

**FeedbackWebSocketClient** (`websocket-client.ts`):
```typescript
import { createFeedbackWebSocket } from '@/lib/feedback/websocket-client';

const wsClient = await createFeedbackWebSocket(sessionId, {
  onFeedback: (feedback) => {
    console.log('Scores:', feedback.scores);
    console.log('Suggestions:', feedback.suggestions);
  }
});

await wsClient.sendFrame(frameBlob, timestamp);
wsClient.sendAudio(audioData, timestamp);
```

**FeedbackDashboard** (`FeedbackDashboard.tsx`):
```tsx
import FeedbackDashboard from '@/components/feedback/FeedbackDashboard';

<FeedbackDashboard
  sessionId={sessionId}
  userId={userId}
  onSessionEnd={(summary) => {
    console.log('Session ended:', summary);
  }}
/>
```

## Performance Optimization

### Frame Sampling

Process every Nth frame to reduce computational load:

```python
processor = FeedbackProcessor(frame_sample_rate=3)  # Process every 3rd frame
```

### Audio Chunking

Send audio in 1-second chunks:

```typescript
const captureConfig = {
  audio: {
    sampleRate: 16000,
    channelCount: 1  // Mono for efficiency
  }
};
```

### Redis Caching

Cache user baselines and recent metrics:

```python
# Cached for 1 hour
await redis_client.setex(f'user_baseline:{user_id}', 3600, baseline_json)
```

### GPU Acceleration

Enable GPU for ML models:

```python
analyzer = get_audio_analyzer(device='cuda')  # Use GPU
vision_analyzer = get_vision_analyzer()  # MediaPipe auto-uses GPU
```

## Monitoring

### Metrics

Track these metrics:
- Frame processing time
- Audio processing time
- WebSocket latency
- ML model inference time
- Cache hit rate

### Logging

```python
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger('feedback')

logger.info(f"Session started: {session_id}")
logger.debug(f"Processing frame {frame_number}")
logger.error(f"Error processing audio: {error}")
```

## Testing

### Unit Tests

```bash
cd api/feedback
pytest tests/
```

### Integration Tests

```bash
pytest tests/integration/
```

### Load Testing

```bash
# Install locust
pip install locust

# Run load test
locust -f tests/load/locustfile.py
```

## Troubleshooting

### Common Issues

1. **Camera/Microphone not accessible**:
   - Ensure HTTPS or localhost
   - Check browser permissions
   - Verify no other app using devices

2. **High latency**:
   - Reduce frame sample rate
   - Use lighter Whisper model (`tiny` or `base`)
   - Enable GPU acceleration

3. **Model download fails**:
   - Check internet connection
   - Download models manually
   - Use local model cache

4. **WebSocket disconnects**:
   - Check firewall settings
   - Verify Redis is running
   - Increase timeout settings

### Debug Mode

```bash
# Enable debug logging
export DEBUG=true
export LOG_LEVEL=DEBUG

# Run FastAPI with reload
uvicorn api.feedback.routes:app --reload --log-level debug
```

## Future Enhancements

- [ ] Multi-language support (beyond English)
- [ ] Accent modification training mode
- [ ] Group communication analytics (multiple people)
- [ ] AR overlay for real-time coaching
- [ ] Voice cloning for practice scenarios
- [ ] Integration with video conferencing platforms
- [ ] Mobile app (React Native)
- [ ] Offline mode with on-device ML

## License

Copyright © 2025 Blaze Sports Intel. All rights reserved.

## Support

For issues and questions:
- GitHub Issues: https://github.com/your-org/bsi/issues
- Email: support@blazesportsintel.com
- Documentation: https://docs.blazesportsintel.com/feedback
