"""
Real-Time Audio Analysis Engine for Communication Feedback

Capabilities:
- Tone analysis (pitch, volume, prosody)
- Emotion recognition from voice
- Speech-to-text transcription
- Dialect and accent detection
- Filler word detection
- Articulation quality assessment
"""

import numpy as np
import librosa
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass, asdict
from scipy import signal
from scipy.stats import kurtosis, skew
import re

# Optional imports with fallback
try:
    import torch
    from transformers import Wav2Vec2ForSequenceClassification, Wav2Vec2Processor
    HAS_TRANSFORMERS = True
except ImportError:
    HAS_TRANSFORMERS = False
    print("Warning: transformers not available. Emotion recognition will be limited.")

try:
    import whisper
    HAS_WHISPER = True
except ImportError:
    HAS_WHISPER = False
    print("Warning: Whisper not available. Transcription will be unavailable.")


@dataclass
class ToneMetrics:
    """Vocal tone characteristics"""
    pitch_hz: float
    pitch_variance: float
    pitch_range: Tuple[float, float]
    volume_db: float
    volume_variance: float
    speaking_rate_wpm: float
    pitch_contour: str  # 'rising', 'falling', 'flat', 'dynamic'
    voice_quality: Dict[str, float]  # breathiness, tenseness, etc.
    energy: float
    zero_crossing_rate: float


@dataclass
class EmotionMetrics:
    """Emotion detected from voice"""
    dominant_emotion: str
    emotion_confidence: float
    emotion_scores: Dict[str, float]
    stress_level: float  # 0-100
    arousal: float  # 0-1
    valence: float  # -1 to 1


@dataclass
class SpeechMetrics:
    """Speech and language characteristics"""
    transcript: str
    confidence: float
    word_count: int
    filler_words: List[Dict[str, any]]
    pause_count: int
    pause_data: List[Dict[str, any]]
    articulation_score: float
    speaking_rate: float
    is_speaking: bool


@dataclass
class DialectMetrics:
    """Dialect and accent characteristics"""
    detected_region: str
    confidence: float
    accent_features: Dict[str, any]
    rhoticity: float  # R-pronunciation tendency


@dataclass
class AudioAnalysisResult:
    """Complete audio analysis result"""
    tone: ToneMetrics
    emotion: EmotionMetrics
    speech: SpeechMetrics
    dialect: Optional[DialectMetrics]
    timestamp_ms: int
    processing_time_ms: float


class AudioAnalyzer:
    """
    Real-time audio analysis for communication feedback
    """

    def __init__(
        self,
        sample_rate: int = 16000,
        enable_transcription: bool = True,
        enable_emotion: bool = True,
        enable_dialect: bool = True,
        whisper_model: str = "base",
        device: str = "cpu"
    ):
        self.sample_rate = sample_rate
        self.enable_transcription = enable_transcription and HAS_WHISPER
        self.enable_emotion = enable_emotion and HAS_TRANSFORMERS
        self.enable_dialect = enable_dialect
        self.device = device

        # Load models
        self._load_models(whisper_model)

        # Filler words dictionary
        self.filler_words = {
            'um', 'uh', 'er', 'ah', 'like', 'you know', 'I mean',
            'basically', 'actually', 'literally', 'sort of', 'kind of',
            'right', 'okay', 'so', 'well', 'yeah', 'mmm', 'hmm'
        }

        # Dialect markers (simplified)
        self.dialect_markers = {
            'southern_us': ['y\'all', 'ain\'t', 'fixin\'', 'reckon'],
            'british': ['whilst', 'bloody', 'brilliant', 'cheers'],
            'australian': ['g\'day', 'mate', 'arvo', 'barbie']
        }

    def _load_models(self, whisper_model: str):
        """Load ML models for analysis"""
        # Load Whisper for transcription
        if self.enable_transcription:
            try:
                self.whisper_model = whisper.load_model(whisper_model, device=self.device)
                print(f"Loaded Whisper model: {whisper_model}")
            except Exception as e:
                print(f"Failed to load Whisper: {e}")
                self.enable_transcription = False

        # Load emotion model
        if self.enable_emotion:
            try:
                model_name = "ehcalabres/wav2vec2-lg-xlsr-en-speech-emotion-recognition"
                self.emotion_processor = Wav2Vec2Processor.from_pretrained(model_name)
                self.emotion_model = Wav2Vec2ForSequenceClassification.from_pretrained(model_name)
                self.emotion_model.to(self.device)
                self.emotion_model.eval()
                self.emotion_labels = ['angry', 'calm', 'disgust', 'fearful', 'happy', 'neutral', 'sad', 'surprised']
                print("Loaded emotion recognition model")
            except Exception as e:
                print(f"Failed to load emotion model: {e}")
                self.enable_emotion = False

    def analyze(
        self,
        audio_data: np.ndarray,
        timestamp_ms: int,
        sample_rate: Optional[int] = None
    ) -> AudioAnalysisResult:
        """
        Analyze audio chunk and return comprehensive metrics

        Args:
            audio_data: Audio samples as numpy array
            timestamp_ms: Timestamp of this audio chunk
            sample_rate: Sample rate of audio (if different from default)

        Returns:
            AudioAnalysisResult with all metrics
        """
        import time
        start_time = time.time()

        if sample_rate is None:
            sample_rate = self.sample_rate

        # Resample if needed
        if sample_rate != self.sample_rate:
            audio_data = librosa.resample(
                audio_data,
                orig_sr=sample_rate,
                target_sr=self.sample_rate
            )

        # Normalize audio
        audio_data = audio_data.astype(np.float32)
        if np.max(np.abs(audio_data)) > 0:
            audio_data = audio_data / np.max(np.abs(audio_data))

        # Analyze different aspects
        tone = self._analyze_tone(audio_data)
        emotion = self._analyze_emotion(audio_data)
        speech = self._analyze_speech(audio_data)
        dialect = self._analyze_dialect(speech.transcript) if self.enable_dialect else None

        processing_time = (time.time() - start_time) * 1000

        return AudioAnalysisResult(
            tone=tone,
            emotion=emotion,
            speech=speech,
            dialect=dialect,
            timestamp_ms=timestamp_ms,
            processing_time_ms=processing_time
        )

    def _analyze_tone(self, audio: np.ndarray) -> ToneMetrics:
        """Analyze vocal tone characteristics"""
        # Pitch analysis using YIN algorithm
        pitch = librosa.yin(
            audio,
            fmin=librosa.note_to_hz('C2'),
            fmax=librosa.note_to_hz('C7'),
            sr=self.sample_rate
        )

        # Remove NaN values
        valid_pitch = pitch[~np.isnan(pitch)]

        if len(valid_pitch) > 0:
            pitch_hz = float(np.median(valid_pitch))
            pitch_variance = float(np.std(valid_pitch))
            pitch_range = (float(np.min(valid_pitch)), float(np.max(valid_pitch)))
        else:
            pitch_hz = 0.0
            pitch_variance = 0.0
            pitch_range = (0.0, 0.0)

        # Volume analysis (RMS energy)
        rms = librosa.feature.rms(y=audio)[0]
        volume_db = float(librosa.amplitude_to_db(np.mean(rms)))
        volume_variance = float(np.std(librosa.amplitude_to_db(rms)))

        # Energy
        energy = float(np.sum(audio ** 2) / len(audio))

        # Zero crossing rate (relates to voice quality)
        zcr = float(np.mean(librosa.feature.zero_crossing_rate(audio)[0]))

        # Pitch contour
        pitch_contour = self._classify_pitch_contour(valid_pitch)

        # Voice quality estimation
        voice_quality = self._estimate_voice_quality(audio, pitch)

        # Speaking rate (rough estimate from syllables)
        speaking_rate = self._estimate_speaking_rate(audio)

        return ToneMetrics(
            pitch_hz=pitch_hz,
            pitch_variance=pitch_variance,
            pitch_range=pitch_range,
            volume_db=volume_db,
            volume_variance=volume_variance,
            speaking_rate_wpm=speaking_rate,
            pitch_contour=pitch_contour,
            voice_quality=voice_quality,
            energy=energy,
            zero_crossing_rate=zcr
        )

    def _classify_pitch_contour(self, pitch: np.ndarray) -> str:
        """Classify overall pitch movement pattern"""
        if len(pitch) < 2:
            return 'flat'

        # Calculate trend
        x = np.arange(len(pitch))
        z = np.polyfit(x, pitch, 1)
        slope = z[0]

        # Calculate variance
        variance = np.std(pitch)

        if variance < 5:
            return 'flat'
        elif slope > 1:
            return 'rising'
        elif slope < -1:
            return 'falling'
        else:
            return 'dynamic'

    def _estimate_voice_quality(self, audio: np.ndarray, pitch: np.ndarray) -> Dict[str, float]:
        """
        Estimate voice quality characteristics
        Note: This is a simplified estimation
        """
        # Spectral features
        spectral_centroid = np.mean(librosa.feature.spectral_centroid(y=audio, sr=self.sample_rate))
        spectral_rolloff = np.mean(librosa.feature.spectral_rolloff(y=audio, sr=self.sample_rate))
        spectral_bandwidth = np.mean(librosa.feature.spectral_bandwidth(y=audio, sr=self.sample_rate))

        # Normalize to 0-1 scale
        breathiness = float(min(spectral_rolloff / 4000, 1.0))
        tenseness = float(min(spectral_bandwidth / 3000, 1.0))
        brightness = float(min(spectral_centroid / 2000, 1.0))

        return {
            'breathiness': breathiness,
            'tenseness': tenseness,
            'brightness': brightness
        }

    def _estimate_speaking_rate(self, audio: np.ndarray) -> float:
        """
        Estimate speaking rate in words per minute
        Based on syllable detection
        """
        # Onset detection (approximates syllables)
        onset_env = librosa.onset.onset_strength(y=audio, sr=self.sample_rate)
        onsets = librosa.onset.onset_detect(
            onset_envelope=onset_env,
            sr=self.sample_rate,
            units='time'
        )

        # Assume average 1.5 syllables per word
        syllable_count = len(onsets)
        duration_minutes = len(audio) / self.sample_rate / 60

        if duration_minutes > 0:
            words_per_minute = (syllable_count / 1.5) / duration_minutes
            return min(words_per_minute, 300)  # Cap at reasonable maximum
        else:
            return 0.0

    def _analyze_emotion(self, audio: np.ndarray) -> EmotionMetrics:
        """Analyze emotion from voice using ML model"""
        if not self.enable_emotion:
            return EmotionMetrics(
                dominant_emotion='neutral',
                emotion_confidence=0.0,
                emotion_scores={},
                stress_level=0.0,
                arousal=0.5,
                valence=0.0
            )

        try:
            # Prepare input
            inputs = self.emotion_processor(
                audio,
                sampling_rate=self.sample_rate,
                return_tensors="pt",
                padding=True
            )

            # Get predictions
            with torch.no_grad():
                logits = self.emotion_model(**inputs).logits

            # Convert to probabilities
            probs = torch.nn.functional.softmax(logits, dim=-1)[0]
            emotion_scores = {
                label: float(prob) for label, prob in zip(self.emotion_labels, probs)
            }

            # Get dominant emotion
            dominant_idx = torch.argmax(probs).item()
            dominant_emotion = self.emotion_labels[dominant_idx]
            emotion_confidence = float(probs[dominant_idx])

            # Estimate arousal and valence from emotions
            arousal = self._estimate_arousal(emotion_scores)
            valence = self._estimate_valence(emotion_scores)

            # Estimate stress level
            stress_level = self._estimate_stress(emotion_scores, audio)

            return EmotionMetrics(
                dominant_emotion=dominant_emotion,
                emotion_confidence=emotion_confidence,
                emotion_scores=emotion_scores,
                stress_level=stress_level,
                arousal=arousal,
                valence=valence
            )

        except Exception as e:
            print(f"Emotion analysis error: {e}")
            return EmotionMetrics(
                dominant_emotion='neutral',
                emotion_confidence=0.0,
                emotion_scores={},
                stress_level=0.0,
                arousal=0.5,
                valence=0.0
            )

    def _estimate_arousal(self, emotion_scores: Dict[str, float]) -> float:
        """Estimate arousal level from emotion scores"""
        high_arousal = ['angry', 'fearful', 'surprised', 'happy']
        low_arousal = ['calm', 'sad', 'neutral']

        high_score = sum(emotion_scores.get(e, 0) for e in high_arousal)
        low_score = sum(emotion_scores.get(e, 0) for e in low_arousal)

        return float(high_score / (high_score + low_score + 1e-6))

    def _estimate_valence(self, emotion_scores: Dict[str, float]) -> float:
        """Estimate valence (positive/negative) from emotion scores"""
        positive = ['happy', 'calm', 'surprised']
        negative = ['angry', 'sad', 'fearful', 'disgust']

        pos_score = sum(emotion_scores.get(e, 0) for e in positive)
        neg_score = sum(emotion_scores.get(e, 0) for e in negative)

        # Scale to -1 to 1
        return float((pos_score - neg_score) / (pos_score + neg_score + 1e-6))

    def _estimate_stress(self, emotion_scores: Dict[str, float], audio: np.ndarray) -> float:
        """
        Estimate stress level combining emotional and acoustic features
        """
        # Stress-related emotions
        stress_emotions = ['angry', 'fearful', 'disgust']
        emotion_stress = sum(emotion_scores.get(e, 0) for e in stress_emotions)

        # Acoustic stress markers
        # - High zero crossing rate
        # - High spectral flux
        # - Irregular pitch
        zcr = np.mean(librosa.feature.zero_crossing_rate(audio))
        spectral_flux = np.mean(np.diff(librosa.feature.spectral_centroid(y=audio, sr=self.sample_rate)))

        acoustic_stress = min((zcr * 100 + abs(spectral_flux) / 10) / 2, 1.0)

        # Combine
        stress_level = (emotion_stress * 0.7 + acoustic_stress * 0.3) * 100

        return float(min(stress_level, 100))

    def _analyze_speech(self, audio: np.ndarray) -> SpeechMetrics:
        """Analyze speech content and characteristics"""
        # Voice Activity Detection
        is_speaking = self._detect_speech(audio)

        if not is_speaking:
            return SpeechMetrics(
                transcript='',
                confidence=0.0,
                word_count=0,
                filler_words=[],
                pause_count=0,
                pause_data=[],
                articulation_score=0.0,
                speaking_rate=0.0,
                is_speaking=False
            )

        # Transcription
        if self.enable_transcription:
            transcript, confidence = self._transcribe(audio)
        else:
            transcript = "[Transcription unavailable]"
            confidence = 0.0

        # Filler word detection
        filler_words = self._detect_filler_words(transcript)

        # Pause detection
        pause_count, pause_data = self._detect_pauses(audio)

        # Articulation score
        articulation_score = self._calculate_articulation_score(audio, transcript)

        # Word count
        word_count = len(transcript.split()) if transcript else 0

        # Speaking rate (from transcript)
        duration_minutes = len(audio) / self.sample_rate / 60
        speaking_rate = word_count / duration_minutes if duration_minutes > 0 else 0.0

        return SpeechMetrics(
            transcript=transcript,
            confidence=confidence,
            word_count=word_count,
            filler_words=filler_words,
            pause_count=pause_count,
            pause_data=pause_data,
            articulation_score=articulation_score,
            speaking_rate=speaking_rate,
            is_speaking=is_speaking
        )

    def _detect_speech(self, audio: np.ndarray, threshold: float = 0.01) -> bool:
        """Detect if audio contains speech (Voice Activity Detection)"""
        # Simple energy-based VAD
        rms = np.sqrt(np.mean(audio ** 2))
        return rms > threshold

    def _transcribe(self, audio: np.ndarray) -> Tuple[str, float]:
        """Transcribe audio using Whisper"""
        try:
            result = self.whisper_model.transcribe(
                audio,
                fp16=False,
                language='en'
            )
            transcript = result['text'].strip()

            # Calculate average confidence from segments
            if 'segments' in result and len(result['segments']) > 0:
                confidences = [seg.get('no_speech_prob', 0.5) for seg in result['segments']]
                avg_confidence = 1.0 - np.mean(confidences)
            else:
                avg_confidence = 0.8  # Default confidence

            return transcript, float(avg_confidence)

        except Exception as e:
            print(f"Transcription error: {e}")
            return "", 0.0

    def _detect_filler_words(self, transcript: str) -> List[Dict[str, any]]:
        """Detect filler words in transcript"""
        filler_counts = {}
        transcript_lower = transcript.lower()

        for filler in self.filler_words:
            # Use regex for word boundaries
            pattern = r'\b' + re.escape(filler) + r'\b'
            matches = re.findall(pattern, transcript_lower)
            count = len(matches)

            if count > 0:
                filler_counts[filler] = count

        # Convert to list format
        filler_list = [
            {'word': word, 'count': count}
            for word, count in filler_counts.items()
        ]

        return filler_list

    def _detect_pauses(self, audio: np.ndarray) -> Tuple[int, List[Dict[str, any]]]:
        """Detect pauses in speech"""
        # Simple energy-based pause detection
        frame_length = int(0.05 * self.sample_rate)  # 50ms frames
        hop_length = int(0.025 * self.sample_rate)  # 25ms hop

        rms = librosa.feature.rms(
            y=audio,
            frame_length=frame_length,
            hop_length=hop_length
        )[0]

        # Threshold for silence
        threshold = np.mean(rms) * 0.3

        # Find silent regions
        is_silent = rms < threshold

        # Find contiguous silent regions
        pauses = []
        in_pause = False
        pause_start = 0

        for i, silent in enumerate(is_silent):
            if silent and not in_pause:
                in_pause = True
                pause_start = i
            elif not silent and in_pause:
                in_pause = False
                pause_duration = i - pause_start

                # Only count pauses > 200ms
                if pause_duration > 8:  # 8 frames * 25ms = 200ms
                    start_ms = int(pause_start * hop_length / self.sample_rate * 1000)
                    duration_ms = int(pause_duration * hop_length / self.sample_rate * 1000)

                    pause_type = 'strategic' if duration_ms > 500 else 'hesitation'

                    pauses.append({
                        'start_ms': start_ms,
                        'duration_ms': duration_ms,
                        'type': pause_type
                    })

        return len(pauses), pauses

    def _calculate_articulation_score(self, audio: np.ndarray, transcript: str) -> float:
        """
        Calculate articulation quality score
        Based on spectral clarity and consonant detection
        """
        # Spectral contrast (higher = clearer articulation)
        spectral_contrast = librosa.feature.spectral_contrast(
            y=audio,
            sr=self.sample_rate
        )
        clarity_score = float(np.mean(spectral_contrast) / 50)

        # Consonant-to-vowel ratio estimation
        # Higher zero-crossing rate indicates more consonants
        zcr = np.mean(librosa.feature.zero_crossing_rate(audio))
        consonant_score = float(min(zcr * 100, 1.0))

        # Combine metrics
        articulation = (clarity_score * 0.6 + consonant_score * 0.4) * 100

        return float(min(max(articulation, 0), 100))

    def _analyze_dialect(self, transcript: str) -> DialectMetrics:
        """
        Analyze dialect and accent characteristics
        Note: This is a simplified rule-based approach
        For production, use a trained model
        """
        transcript_lower = transcript.lower()

        # Check for dialect markers
        dialect_scores = {}

        for region, markers in self.dialect_markers.items():
            score = sum(1 for marker in markers if marker in transcript_lower)
            if score > 0:
                dialect_scores[region] = score

        if dialect_scores:
            detected_region = max(dialect_scores, key=dialect_scores.get)
            confidence = min(dialect_scores[detected_region] * 20, 100)
        else:
            detected_region = 'general_american'
            confidence = 50.0

        # Placeholder accent features
        accent_features = {
            'markers_detected': list(dialect_scores.keys()),
            'formality': 'neutral',
            'code_switching': False
        }

        # Rhoticity estimation (very simplified)
        r_words = len(re.findall(r'\b\w*r\w*\b', transcript_lower))
        total_words = len(transcript_lower.split())
        rhoticity = r_words / max(total_words, 1)

        return DialectMetrics(
            detected_region=detected_region,
            confidence=float(confidence),
            accent_features=accent_features,
            rhoticity=float(rhoticity)
        )

    def to_dict(self, result: AudioAnalysisResult) -> Dict:
        """Convert result to dictionary for JSON serialization"""
        return {
            'tone': asdict(result.tone),
            'emotion': asdict(result.emotion),
            'speech': asdict(result.speech),
            'dialect': asdict(result.dialect) if result.dialect else None,
            'timestamp_ms': result.timestamp_ms,
            'processing_time_ms': result.processing_time_ms
        }


# Singleton instance
_analyzer_instance: Optional[AudioAnalyzer] = None


def get_audio_analyzer(**kwargs) -> AudioAnalyzer:
    """Get or create audio analyzer singleton"""
    global _analyzer_instance

    if _analyzer_instance is None:
        _analyzer_instance = AudioAnalyzer(**kwargs)

    return _analyzer_instance
