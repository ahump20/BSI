"""
Real-Time Feedback Processing Service

Orchestrates audio and vision analysis, calculates scores,
and generates real-time feedback.
"""

import asyncio
import json
import time
from typing import Dict, Optional, List
from dataclasses import dataclass, asdict
import numpy as np
import cv2
import base64

from .audio_analyzer import AudioAnalyzer, get_audio_analyzer
from .vision_analyzer import VisionAnalyzer, get_vision_analyzer

# Redis for caching and pub/sub
try:
    import redis.asyncio as redis
    HAS_REDIS = True
except ImportError:
    HAS_REDIS = False
    print("Warning: Redis not available. Caching disabled.")


@dataclass
class FeedbackMessage:
    """Real-time feedback message"""
    timestamp_ms: int
    session_id: str
    type: str  # 'realtime', 'summary', 'alert'

    # Aggregate scores
    scores: Dict[str, float]

    # Detailed metrics
    metrics: Dict[str, any]

    # Actionable suggestions
    suggestions: List[Dict[str, any]]

    # Trends
    trends: Dict[str, float]


class FeedbackProcessor:
    """
    Real-time feedback processor
    Coordinates audio and vision analysis
    """

    def __init__(
        self,
        enable_audio: bool = True,
        enable_vision: bool = True,
        redis_url: Optional[str] = None,
        frame_sample_rate: int = 3  # Process every Nth frame
    ):
        self.enable_audio = enable_audio
        self.enable_vision = enable_vision
        self.frame_sample_rate = frame_sample_rate
        self.frame_counter = 0

        # Initialize analyzers
        self.audio_analyzer = get_audio_analyzer() if enable_audio else None
        self.vision_analyzer = get_vision_analyzer() if enable_vision else None

        # Redis connection for caching and pub/sub
        self.redis_client = None
        if HAS_REDIS and redis_url:
            self.redis_client = redis.from_url(redis_url)

        # Session state
        self.sessions: Dict[str, Dict] = {}

    async def start_session(
        self,
        session_id: str,
        user_id: str,
        session_type: str = 'practice'
    ) -> Dict:
        """Start a new feedback session"""
        session_data = {
            'session_id': session_id,
            'user_id': user_id,
            'session_type': session_type,
            'start_time': time.time(),
            'frame_count': 0,
            'audio_chunk_count': 0,
            'baseline': await self._load_user_baseline(user_id),
            'score_history': []
        }

        self.sessions[session_id] = session_data

        # Cache in Redis
        if self.redis_client:
            await self.redis_client.setex(
                f'feedback_session:{session_id}',
                3600,  # 1 hour TTL
                json.dumps(session_data, default=str)
            )

        return session_data

    async def stop_session(self, session_id: str) -> Dict:
        """Stop a feedback session"""
        if session_id not in self.sessions:
            raise ValueError(f"Session {session_id} not found")

        session_data = self.sessions[session_id]
        session_data['end_time'] = time.time()
        session_data['duration'] = session_data['end_time'] - session_data['start_time']

        # Calculate session summary
        summary = self._calculate_session_summary(session_data)

        # Remove from active sessions
        del self.sessions[session_id]

        # Remove from Redis
        if self.redis_client:
            await self.redis_client.delete(f'feedback_session:{session_id}')

        return summary

    async def process_frame(
        self,
        session_id: str,
        frame_data: bytes,
        timestamp_ms: int,
        frame_number: Optional[int] = None
    ) -> Optional[Dict]:
        """
        Process a video frame

        Args:
            session_id: Session ID
            frame_data: Encoded frame (JPEG or PNG)
            timestamp_ms: Frame timestamp
            frame_number: Optional frame sequence number

        Returns:
            Vision analysis result or None if frame was skipped
        """
        if not self.enable_vision:
            return None

        # Sample frames (don't process every frame)
        self.frame_counter += 1
        if self.frame_counter % self.frame_sample_rate != 0:
            return None

        if session_id not in self.sessions:
            raise ValueError(f"Session {session_id} not found")

        # Decode frame
        frame = self._decode_frame(frame_data)

        if frame is None:
            return None

        # Analyze vision
        vision_result = self.vision_analyzer.analyze(
            frame,
            frame_number or self.frame_counter,
            timestamp_ms
        )

        # Convert to dict
        result_dict = self.vision_analyzer.to_dict(vision_result)

        # Update session
        self.sessions[session_id]['frame_count'] += 1

        # Cache in Redis with short TTL
        if self.redis_client:
            await self.redis_client.setex(
                f'feedback_frame:{session_id}:{timestamp_ms}',
                60,  # 1 minute TTL
                json.dumps(result_dict, default=str)
            )

        return result_dict

    async def process_audio(
        self,
        session_id: str,
        audio_data: bytes,
        timestamp_ms: int,
        sample_rate: int = 16000
    ) -> Optional[Dict]:
        """
        Process an audio chunk

        Args:
            session_id: Session ID
            audio_data: Raw audio samples
            timestamp_ms: Audio timestamp
            sample_rate: Audio sample rate

        Returns:
            Audio analysis result
        """
        if not self.enable_audio:
            return None

        if session_id not in self.sessions:
            raise ValueError(f"Session {session_id} not found")

        # Convert bytes to numpy array
        audio_array = np.frombuffer(audio_data, dtype=np.float32)

        # Analyze audio
        audio_result = self.audio_analyzer.analyze(
            audio_array,
            timestamp_ms,
            sample_rate
        )

        # Convert to dict
        result_dict = self.audio_analyzer.to_dict(audio_result)

        # Update session
        self.sessions[session_id]['audio_chunk_count'] += 1

        # Cache in Redis with short TTL
        if self.redis_client:
            await self.redis_client.setex(
                f'feedback_audio:{session_id}:{timestamp_ms}',
                60,  # 1 minute TTL
                json.dumps(result_dict, default=str)
            )

        return result_dict

    async def generate_feedback(
        self,
        session_id: str,
        audio_metrics: Optional[Dict] = None,
        vision_metrics: Optional[Dict] = None,
        timestamp_ms: Optional[int] = None
    ) -> FeedbackMessage:
        """
        Generate comprehensive feedback from audio and vision metrics

        Args:
            session_id: Session ID
            audio_metrics: Audio analysis metrics
            vision_metrics: Vision analysis metrics
            timestamp_ms: Timestamp for this feedback

        Returns:
            FeedbackMessage with scores and suggestions
        """
        if session_id not in self.sessions:
            raise ValueError(f"Session {session_id} not found")

        session = self.sessions[session_id]
        baseline = session.get('baseline')

        if timestamp_ms is None:
            timestamp_ms = int(time.time() * 1000)

        # Calculate scores (this would call TypeScript scoring engine in production)
        # For now, implement Python version
        scores = self._calculate_scores(audio_metrics, vision_metrics, baseline)

        # Generate suggestions
        suggestions = self._generate_suggestions(audio_metrics, vision_metrics, scores)

        # Calculate trends
        trends = self._calculate_trends(session, scores)

        # Store scores in history
        session['score_history'].append({
            'timestamp_ms': timestamp_ms,
            'scores': scores
        })

        # Keep only last 50 scores
        if len(session['score_history']) > 50:
            session['score_history'] = session['score_history'][-50:]

        # Build metrics object
        metrics = {
            'facial': vision_metrics.get('facial') if vision_metrics else None,
            'body': vision_metrics.get('body') if vision_metrics else None,
            'voice': audio_metrics.get('tone') if audio_metrics else None,
            'speech': audio_metrics.get('speech') if audio_metrics else None,
        }

        feedback = FeedbackMessage(
            timestamp_ms=timestamp_ms,
            session_id=session_id,
            type='realtime',
            scores=scores,
            metrics=metrics,
            suggestions=suggestions,
            trends=trends
        )

        # Publish to Redis channel
        if self.redis_client:
            await self.redis_client.publish(
                f'feedback_channel:{session_id}',
                json.dumps(asdict(feedback), default=str)
            )

        return feedback

    def _decode_frame(self, frame_data: bytes) -> Optional[np.ndarray]:
        """Decode frame from bytes"""
        try:
            # Decode from bytes
            nparr = np.frombuffer(frame_data, np.uint8)
            frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            return frame
        except Exception as e:
            print(f"Error decoding frame: {e}")
            return None

    async def _load_user_baseline(self, user_id: str) -> Optional[Dict]:
        """Load user baseline from database/cache"""
        # TODO: Implement database lookup
        # For now, return None (no baseline)
        return None

    def _calculate_scores(
        self,
        audio_metrics: Optional[Dict],
        vision_metrics: Optional[Dict],
        baseline: Optional[Dict]
    ) -> Dict[str, float]:
        """Calculate feedback scores (simplified Python version)"""
        scores = {
            'confidence': 70.0,
            'engagement': 70.0,
            'clarity': 70.0,
            'authenticity': 70.0,
            'professionalPresence': 70.0
        }

        # Confidence score
        confidence_components = []

        if audio_metrics and 'tone' in audio_metrics:
            tone = audio_metrics['tone']
            # Vocal steadiness
            pitch_variance = tone.get('pitch_variance', 20)
            vocal_steadiness = max(0, 100 - pitch_variance * 2)
            confidence_components.append(vocal_steadiness * 0.4)

        if vision_metrics and 'facial' in vision_metrics:
            facial = vision_metrics['facial']
            # Eye contact
            eye_contact = facial.get('eye_contact', 50)
            confidence_components.append(eye_contact * 0.3)

        if vision_metrics and 'body' in vision_metrics:
            body = vision_metrics['body']
            # Posture
            posture = body.get('posture', 'neutral')
            posture_score = 90 if posture == 'open' else (70 if posture == 'neutral' else 50)
            confidence_components.append(posture_score * 0.3)

        if confidence_components:
            scores['confidence'] = sum(confidence_components)

        # Engagement score
        engagement_components = []

        if vision_metrics and 'body' in vision_metrics:
            body = vision_metrics['body']
            energy_level = body.get('energy_level', 50)
            engagement_components.append(energy_level * 0.5)

        if audio_metrics and 'tone' in audio_metrics:
            tone = audio_metrics['tone']
            pitch_range = tone.get('pitch_range', [0, 0])
            vocal_variety = min((pitch_range[1] - pitch_range[0]) / 3, 100)
            engagement_components.append(vocal_variety * 0.5)

        if engagement_components:
            scores['engagement'] = sum(engagement_components)

        # Clarity score
        clarity_components = []

        if audio_metrics and 'speech' in audio_metrics:
            speech = audio_metrics['speech']
            articulation = speech.get('articulation_score', 70)
            clarity_components.append(articulation * 0.5)

            speaking_rate = speech.get('speaking_rate', 150)
            optimal = 150
            deviation = abs(speaking_rate - optimal)
            pace_score = max(0, 100 - deviation * 2)
            clarity_components.append(pace_score * 0.5)

        if clarity_components:
            scores['clarity'] = sum(clarity_components)

        # Authenticity score
        if vision_metrics and 'facial' in vision_metrics:
            facial = vision_metrics['facial']
            smile_genuineness = facial.get('smile_genuineness', 0.5)
            scores['authenticity'] = smile_genuineness * 100

        # Professional presence
        if vision_metrics and 'professional' in vision_metrics:
            professional = vision_metrics['professional']
            scores['professionalPresence'] = professional.get('overall_polish', 70)

        # Clamp all scores to 0-100
        for key in scores:
            scores[key] = max(0, min(100, scores[key]))

        return scores

    def _generate_suggestions(
        self,
        audio_metrics: Optional[Dict],
        vision_metrics: Optional[Dict],
        scores: Dict[str, float]
    ) -> List[Dict[str, any]]:
        """Generate actionable suggestions"""
        suggestions = []

        # Low confidence suggestions
        if scores['confidence'] < 60:
            if audio_metrics and 'speech' in audio_metrics:
                speech = audio_metrics['speech']
                filler_words = speech.get('filler_words', [])
                total_fillers = sum(fw['count'] for fw in filler_words)

                if total_fillers > 5:
                    suggestions.append({
                        'category': 'speech',
                        'priority': 'high',
                        'message': f'You used {total_fillers} filler words',
                        'improvement': 'Try pausing instead of using filler words'
                    })

        # Low engagement suggestions
        if scores['engagement'] < 60:
            if vision_metrics and 'body' in vision_metrics:
                body = vision_metrics['body']
                if body.get('energy_level', 100) < 50:
                    suggestions.append({
                        'category': 'body',
                        'priority': 'medium',
                        'message': 'Energy level appears low',
                        'improvement': 'Try standing up or using more gestures'
                    })

        # Low clarity suggestions
        if scores['clarity'] < 60:
            if audio_metrics and 'speech' in audio_metrics:
                speech = audio_metrics['speech']
                speaking_rate = speech.get('speaking_rate', 150)

                if speaking_rate > 180:
                    suggestions.append({
                        'category': 'speech',
                        'priority': 'high',
                        'message': f'Speaking too fast at {int(speaking_rate)} WPM',
                        'improvement': 'Slow down to 140-160 WPM for clarity'
                    })

        # Stress detection
        if audio_metrics and 'emotion' in audio_metrics:
            emotion = audio_metrics['emotion']
            stress_level = emotion.get('stress_level', 0)

            if stress_level > 70:
                suggestions.append({
                    'category': 'voice',
                    'priority': 'high',
                    'message': 'High stress detected in your voice',
                    'improvement': 'Take a deep breath and pause'
                })

        return suggestions

    def _calculate_trends(
        self,
        session: Dict,
        current_scores: Dict[str, float]
    ) -> Dict[str, float]:
        """Calculate score trends"""
        history = session.get('score_history', [])

        if len(history) < 5:
            return {
                'confidenceDelta': 0,
                'engagementDelta': 0,
                'clarityDelta': 0
            }

        # Calculate average of last 5 scores
        recent = history[-5:]
        avg_confidence = sum(h['scores']['confidence'] for h in recent) / len(recent)
        avg_engagement = sum(h['scores']['engagement'] for h in recent) / len(recent)
        avg_clarity = sum(h['scores']['clarity'] for h in recent) / len(recent)

        return {
            'confidenceDelta': round(current_scores['confidence'] - avg_confidence, 1),
            'engagementDelta': round(current_scores['engagement'] - avg_engagement, 1),
            'clarityDelta': round(current_scores['clarity'] - avg_clarity, 1)
        }

    def _calculate_session_summary(self, session_data: Dict) -> Dict:
        """Calculate session summary statistics"""
        score_history = session_data.get('score_history', [])

        if not score_history:
            return {
                'session_id': session_data['session_id'],
                'duration': session_data.get('duration', 0),
                'message': 'No data collected'
            }

        # Calculate averages
        avg_scores = {
            'confidence': sum(h['scores']['confidence'] for h in score_history) / len(score_history),
            'engagement': sum(h['scores']['engagement'] for h in score_history) / len(score_history),
            'clarity': sum(h['scores']['clarity'] for h in score_history) / len(score_history),
            'authenticity': sum(h['scores']['authenticity'] for h in score_history) / len(score_history),
            'professionalPresence': sum(h['scores']['professionalPresence'] for h in score_history) / len(score_history)
        }

        # Find peak performance moment
        peak_moment = max(score_history, key=lambda h: sum(h['scores'].values()))

        return {
            'session_id': session_data['session_id'],
            'user_id': session_data['user_id'],
            'duration': session_data.get('duration', 0),
            'frames_processed': session_data['frame_count'],
            'audio_chunks_processed': session_data['audio_chunk_count'],
            'average_scores': avg_scores,
            'peak_moment': peak_moment,
            'start_time': session_data['start_time'],
            'end_time': session_data.get('end_time')
        }


# Singleton instance
_processor_instance: Optional[FeedbackProcessor] = None


def get_feedback_processor(**kwargs) -> FeedbackProcessor:
    """Get or create feedback processor singleton"""
    global _processor_instance

    if _processor_instance is None:
        _processor_instance = FeedbackProcessor(**kwargs)

    return _processor_instance
