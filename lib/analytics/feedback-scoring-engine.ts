/**
 * Feedback Scoring Engine
 *
 * Multi-dimensional scoring system for communication feedback
 * Inspired by the Diamond Certainty Engine architecture
 *
 * Calculates 5 core scores:
 * 1. Confidence Score (0-100)
 * 2. Engagement Score (0-100)
 * 3. Clarity Score (0-100)
 * 4. Authenticity Score (0-100)
 * 5. Professional Presence (0-100)
 */

export interface ToneMetrics {
  pitch_hz: number;
  pitch_variance: number;
  pitch_range: [number, number];
  volume_db: number;
  volume_variance: number;
  speaking_rate_wpm: number;
  pitch_contour: string;
  voice_quality: {
    breathiness: number;
    tenseness: number;
    brightness: number;
  };
  energy: number;
  zero_crossing_rate: number;
}

export interface EmotionMetrics {
  dominant_emotion: string;
  emotion_confidence: number;
  emotion_scores: Record<string, number>;
  stress_level: number;
  arousal: number;
  valence: number;
}

export interface SpeechMetrics {
  transcript: string;
  confidence: number;
  word_count: number;
  filler_words: Array<{ word: string; count: number }>;
  pause_count: number;
  pause_data: Array<{ start_ms: number; duration_ms: number; type: string }>;
  articulation_score: number;
  speaking_rate: number;
  is_speaking: boolean;
}

export interface FacialMetrics {
  dominant_emotion: string;
  emotion_confidence: number;
  emotion_scores: Record<string, number>;
  micro_expressions: Array<{ emotion: string; intensity: number; duration_ms: number }>;
  eye_contact: number;
  gaze_direction: { x: number; y: number };
  blink_rate: number;
  smile_genuineness: number;
  eyebrow_position: string;
  mouth_openness: number;
  head_pose: { pitch: number; yaw: number; roll: number };
}

export interface BodyMetrics {
  posture: string;
  posture_confidence: number;
  gesture_count: number;
  gestures: Array<{ type: string; hand: string; confidence: number }>;
  fidgeting_level: number;
  energy_level: number;
  head_tilt: number;
  shoulder_tension: number;
  lean_in: number;
  centering: number;
  symmetry: number;
  hand_positions: Record<string, Record<string, number>>;
}

export interface ProfessionalPresenceMetrics {
  frame_positioning: number;
  lighting_quality: number;
  background_appropriateness: number;
  attire_professionalism: number;
  overall_polish: number;
}

export interface FeedbackInput {
  audio?: {
    tone: ToneMetrics;
    emotion: EmotionMetrics;
    speech: SpeechMetrics;
  };
  vision?: {
    facial: FacialMetrics;
    body: BodyMetrics;
    professional: ProfessionalPresenceMetrics;
  };
  baseline?: UserBaseline;
}

export interface UserBaseline {
  baseline_confidence: number;
  baseline_engagement: number;
  baseline_clarity: number;
  baseline_authenticity: number;
  baseline_pitch: number;
  baseline_speaking_rate: number;
  baseline_blink_rate: number;
  baseline_gesture_frequency: number;
}

export interface FeedbackScores {
  confidence: number;
  engagement: number;
  clarity: number;
  authenticity: number;
  professionalPresence: number;
}

export interface FeedbackSuggestion {
  category: string;
  priority: 'high' | 'medium' | 'low';
  message: string;
  improvement: string;
  triggerMetric?: string;
  triggerValue?: number;
  targetValue?: number;
}

export interface FeedbackResult {
  scores: FeedbackScores;
  suggestions: FeedbackSuggestion[];
  trends: {
    confidenceDelta: number;
    engagementDelta: number;
    clarityDelta: number;
  };
  charismaScore?: number;
}

export class FeedbackScoringEngine {
  private previousScores: FeedbackScores[] = [];
  private readonly maxHistoryLength = 10; // Keep last 10 scores for trending

  /**
   * Calculate comprehensive feedback scores from multi-modal input
   */
  calculateScores(input: FeedbackInput): FeedbackResult {
    const { audio, vision, baseline } = input;

    // Calculate individual dimension scores
    const confidence = this.calculateConfidenceScore(audio, vision, baseline);
    const engagement = this.calculateEngagementScore(audio, vision, baseline);
    const clarity = this.calculateClarityScore(audio, vision, baseline);
    const authenticity = this.calculateAuthenticityScore(audio, vision);
    const professionalPresence = vision?.professional.overall_polish || 70;

    const scores: FeedbackScores = {
      confidence,
      engagement,
      clarity,
      authenticity,
      professionalPresence,
    };

    // Generate suggestions
    const suggestions = this.generateSuggestions(input, scores);

    // Calculate trends
    const trends = this.calculateTrends(scores);

    // Calculate charisma score (meta-score)
    const charismaScore = this.calculateCharismaScore(scores, input);

    // Store scores for trending
    this.previousScores.push(scores);
    if (this.previousScores.length > this.maxHistoryLength) {
      this.previousScores.shift();
    }

    return {
      scores,
      suggestions,
      trends,
      charismaScore,
    };
  }

  /**
   * Confidence Score (0-100)
   * Components:
   * - Vocal steadiness: 25%
   * - Posture openness: 25%
   * - Eye contact: 20%
   * - Gesture decisiveness: 15%
   * - Filler word frequency (inverse): 15%
   */
  private calculateConfidenceScore(
    audio?: FeedbackInput['audio'],
    vision?: FeedbackInput['vision'],
    baseline?: UserBaseline
  ): number {
    let score = 0;
    let totalWeight = 0;

    // Vocal steadiness (low pitch variance = higher confidence)
    if (audio?.tone) {
      const pitchVariance = audio.tone.pitch_variance;
      const vocalSteadiness = Math.max(0, 100 - pitchVariance * 2);
      score += vocalSteadiness * 0.25;
      totalWeight += 0.25;
    }

    // Posture openness
    if (vision?.body) {
      const postureScore =
        vision.body.posture === 'open' ? 90 : vision.body.posture === 'neutral' ? 70 : 50;
      score += postureScore * 0.25;
      totalWeight += 0.25;
    }

    // Eye contact
    if (vision?.facial) {
      const eyeContactScore = vision.facial.eye_contact;
      score += eyeContactScore * 0.2;
      totalWeight += 0.2;
    }

    // Gesture decisiveness (moderate gestures = confident)
    if (vision?.body) {
      const gestureScore = Math.min(vision.body.gesture_count * 15, 100);
      score += gestureScore * 0.15;
      totalWeight += 0.15;
    }

    // Filler words (inverse)
    if (audio?.speech) {
      const totalFillerWords = audio.speech.filler_words.reduce((sum, fw) => sum + fw.count, 0);
      const wordCount = audio.speech.word_count || 1;
      const fillerRatio = totalFillerWords / wordCount;
      const fillerScore = Math.max(0, 100 - fillerRatio * 300);
      score += fillerScore * 0.15;
      totalWeight += 0.15;
    }

    // Normalize by total weight
    const finalScore = totalWeight > 0 ? score / totalWeight : 70;

    // Apply baseline adjustment if available
    if (baseline?.baseline_confidence) {
      return this.applyBaselineAdjustment(finalScore, baseline.baseline_confidence);
    }

    return Math.round(Math.max(0, Math.min(100, finalScore)));
  }

  /**
   * Engagement Score (0-100)
   * Components:
   * - Facial expressiveness: 30%
   * - Energy level (movement): 25%
   * - Vocal variety (pitch/volume range): 25%
   * - Lean-in behavior: 20%
   */
  private calculateEngagementScore(
    audio?: FeedbackInput['audio'],
    vision?: FeedbackInput['vision'],
    baseline?: UserBaseline
  ): number {
    let score = 0;
    let totalWeight = 0;

    // Facial expressiveness
    if (vision?.facial) {
      const emotionVariety = Object.keys(vision.facial.emotion_scores).length;
      const maxEmotion = Math.max(...Object.values(vision.facial.emotion_scores));
      const expressiveness = (emotionVariety * 10 + maxEmotion * 50) / 1.5;
      score += Math.min(expressiveness, 100) * 0.3;
      totalWeight += 0.3;
    }

    // Energy level
    if (vision?.body) {
      score += vision.body.energy_level * 0.25;
      totalWeight += 0.25;
    }

    // Vocal variety
    if (audio?.tone) {
      const pitchRange = audio.tone.pitch_range[1] - audio.tone.pitch_range[0];
      const volumeRange = audio.tone.volume_variance;
      const vocalVariety = Math.min((pitchRange / 3 + volumeRange * 5) / 2, 100);
      score += vocalVariety * 0.25;
      totalWeight += 0.25;
    }

    // Lean-in behavior
    if (vision?.body) {
      const leanScore = ((vision.body.lean_in + 1) / 2) * 100; // Convert -1 to 1 → 0 to 100
      score += leanScore * 0.2;
      totalWeight += 0.2;
    }

    const finalScore = totalWeight > 0 ? score / totalWeight : 70;

    if (baseline?.baseline_engagement) {
      return this.applyBaselineAdjustment(finalScore, baseline.baseline_engagement);
    }

    return Math.round(Math.max(0, Math.min(100, finalScore)));
  }

  /**
   * Clarity Score (0-100)
   * Components:
   * - Articulation quality: 30%
   * - Speaking pace (optimal 140-160 WPM): 25%
   * - Logical flow (topic coherence): 25%
   * - Filler word ratio (inverse): 20%
   */
  private calculateClarityScore(
    audio?: FeedbackInput['audio'],
    vision?: FeedbackInput['vision'],
    baseline?: UserBaseline
  ): number {
    let score = 0;
    let totalWeight = 0;

    // Articulation quality
    if (audio?.speech) {
      score += audio.speech.articulation_score * 0.3;
      totalWeight += 0.3;
    }

    // Speaking pace (optimal range: 140-160 WPM)
    if (audio?.tone || audio?.speech) {
      const wpm = audio.speech?.speaking_rate || audio.tone?.speaking_rate_wpm || 0;
      const optimal = 150;
      const deviation = Math.abs(wpm - optimal);
      const paceScore = Math.max(0, 100 - deviation * 2);
      score += paceScore * 0.25;
      totalWeight += 0.25;
    }

    // Logical flow (approximated by pause patterns)
    if (audio?.speech) {
      const strategicPauses = audio.speech.pause_data.filter((p) => p.type === 'strategic').length;
      const hesitationPauses = audio.speech.pause_data.filter(
        (p) => p.type === 'hesitation'
      ).length;
      const flowScore = Math.min(strategicPauses * 15 - hesitationPauses * 10, 100);
      score += Math.max(flowScore, 50) * 0.25;
      totalWeight += 0.25;
    }

    // Filler word ratio (inverse)
    if (audio?.speech) {
      const totalFillerWords = audio.speech.filler_words.reduce((sum, fw) => sum + fw.count, 0);
      const wordCount = audio.speech.word_count || 1;
      const fillerRatio = totalFillerWords / wordCount;
      const fillerScore = Math.max(0, 100 - fillerRatio * 400);
      score += fillerScore * 0.2;
      totalWeight += 0.2;
    }

    const finalScore = totalWeight > 0 ? score / totalWeight : 70;

    if (baseline?.baseline_clarity) {
      return this.applyBaselineAdjustment(finalScore, baseline.baseline_clarity);
    }

    return Math.round(Math.max(0, Math.min(100, finalScore)));
  }

  /**
   * Authenticity Score (0-100)
   * Components:
   * - Micro-expression congruence: 30%
   * - Vocal-visual emotion alignment: 30%
   * - Natural gesture patterns: 20%
   * - Smile genuineness (Duchenne markers): 20%
   */
  private calculateAuthenticityScore(
    audio?: FeedbackInput['audio'],
    vision?: FeedbackInput['vision']
  ): number {
    let score = 0;
    let totalWeight = 0;

    // Micro-expression congruence (presence of micro-expressions = authentic)
    if (vision?.facial) {
      const microExprCount = vision.facial.micro_expressions.length;
      const congruenceScore = Math.min(microExprCount * 25, 100);
      score += congruenceScore * 0.3;
      totalWeight += 0.3;
    }

    // Vocal-visual emotion alignment
    if (audio?.emotion && vision?.facial) {
      const vocalEmotion = audio.emotion.dominant_emotion;
      const visualEmotion = vision.facial.dominant_emotion;

      // Map similar emotions
      const emotionGroups = {
        positive: ['happy', 'calm', 'surprised'],
        negative: ['angry', 'sad', 'fearful', 'disgusted'],
        neutral: ['neutral'],
      };

      const getGroup = (emotion: string) => {
        for (const [group, emotions] of Object.entries(emotionGroups)) {
          if (emotions.includes(emotion)) return group;
        }
        return 'neutral';
      };

      const vocalGroup = getGroup(vocalEmotion);
      const visualGroup = getGroup(visualEmotion);

      const alignmentScore = vocalGroup === visualGroup ? 90 : 50;
      score += alignmentScore * 0.3;
      totalWeight += 0.3;
    }

    // Natural gesture patterns (not too many, not too few)
    if (vision?.body) {
      const gestureCount = vision.body.gesture_count;
      const optimalGestures = 3;
      const deviation = Math.abs(gestureCount - optimalGestures);
      const gestureScore = Math.max(0, 100 - deviation * 15);
      score += gestureScore * 0.2;
      totalWeight += 0.2;
    }

    // Smile genuineness
    if (vision?.facial) {
      score += vision.facial.smile_genuineness * 100 * 0.2;
      totalWeight += 0.2;
    }

    const finalScore = totalWeight > 0 ? score / totalWeight : 70;

    return Math.round(Math.max(0, Math.min(100, finalScore)));
  }

  /**
   * Calculate overall charisma score
   * Meta-score combining all dimensions with special weighting
   */
  private calculateCharismaScore(scores: FeedbackScores, input: FeedbackInput): number {
    // Base charisma from core scores
    const baseCharisma =
      scores.confidence * 0.25 +
      scores.engagement * 0.3 +
      scores.clarity * 0.2 +
      scores.authenticity * 0.15 +
      scores.professionalPresence * 0.1;

    // Charisma multipliers
    let multiplier = 1.0;

    // High energy + high authenticity = charisma boost
    if (
      input.vision?.body?.energy_level &&
      input.vision.body.energy_level > 70 &&
      scores.authenticity > 75
    ) {
      multiplier *= 1.15;
    }

    // Strong vocal variety + good eye contact = charisma boost
    if (
      input.audio?.tone?.pitch_variance &&
      input.audio.tone.pitch_variance > 15 &&
      input.vision?.facial?.eye_contact &&
      input.vision.facial.eye_contact > 75
    ) {
      multiplier *= 1.1;
    }

    // Genuine smile = charisma boost
    if (input.vision?.facial?.smile_genuineness && input.vision.facial.smile_genuineness > 0.7) {
      multiplier *= 1.1;
    }

    const charismaScore = baseCharisma * multiplier;

    return Math.round(Math.max(0, Math.min(100, charismaScore)));
  }

  /**
   * Generate actionable suggestions based on scores and metrics
   */
  private generateSuggestions(input: FeedbackInput, scores: FeedbackScores): FeedbackSuggestion[] {
    const suggestions: FeedbackSuggestion[] = [];

    // Confidence suggestions
    if (scores.confidence < 60) {
      if (input.audio?.speech) {
        const fillerCount = input.audio.speech.filler_words.reduce((sum, fw) => sum + fw.count, 0);
        if (fillerCount > 5) {
          suggestions.push({
            category: 'speech',
            priority: 'high',
            message: `You used ${fillerCount} filler words in this segment`,
            improvement: 'Try pausing instead of using filler words. Silence is powerful!',
            triggerMetric: 'filler_word_count',
            triggerValue: fillerCount,
            targetValue: 3,
          });
        }
      }

      if (input.vision?.facial && input.vision.facial.eye_contact < 50) {
        suggestions.push({
          category: 'facial',
          priority: 'high',
          message: 'Eye contact is low',
          improvement: 'Look directly at the camera more often to engage your audience',
          triggerMetric: 'eye_contact',
          triggerValue: input.vision.facial.eye_contact,
          targetValue: 75,
        });
      }
    }

    // Engagement suggestions
    if (scores.engagement < 60) {
      if (input.vision?.body && input.vision.body.energy_level < 50) {
        suggestions.push({
          category: 'body',
          priority: 'medium',
          message: 'Energy level appears low',
          improvement: 'Try standing up, using more gestures, and varying your movement',
          triggerMetric: 'energy_level',
          triggerValue: input.vision.body.energy_level,
          targetValue: 70,
        });
      }

      if (input.audio?.tone && input.audio.tone.pitch_variance < 10) {
        suggestions.push({
          category: 'voice',
          priority: 'medium',
          message: 'Your voice sounds monotone',
          improvement: 'Vary your pitch and volume to sound more engaging',
          triggerMetric: 'pitch_variance',
          triggerValue: input.audio.tone.pitch_variance,
          targetValue: 20,
        });
      }
    }

    // Clarity suggestions
    if (scores.clarity < 60) {
      if (input.audio?.speech && input.audio.speech.speaking_rate > 180) {
        suggestions.push({
          category: 'speech',
          priority: 'high',
          message: `Speaking too fast at ${Math.round(input.audio.speech.speaking_rate)} WPM`,
          improvement: 'Slow down to 140-160 words per minute for better clarity',
          triggerMetric: 'speaking_rate',
          triggerValue: input.audio.speech.speaking_rate,
          targetValue: 150,
        });
      }

      if (input.audio?.speech && input.audio.speech.articulation_score < 60) {
        suggestions.push({
          category: 'speech',
          priority: 'medium',
          message: 'Articulation could be clearer',
          improvement: 'Enunciate more clearly, especially consonants at word endings',
          triggerMetric: 'articulation_score',
          triggerValue: input.audio.speech.articulation_score,
          targetValue: 75,
        });
      }
    }

    // Authenticity suggestions
    if (scores.authenticity < 60) {
      suggestions.push({
        category: 'engagement',
        priority: 'low',
        message: 'Your delivery could feel more natural',
        improvement: 'Relax and be yourself. Authenticity comes from genuine expression',
      });
    }

    // Professional presence suggestions
    if (scores.professionalPresence < 60) {
      if (input.vision?.professional && input.vision.professional.lighting_quality < 50) {
        suggestions.push({
          category: 'professional',
          priority: 'medium',
          message: 'Lighting quality is poor',
          improvement: 'Add front lighting (ring light or window) to improve visibility',
          triggerMetric: 'lighting_quality',
          triggerValue: input.vision.professional.lighting_quality,
          targetValue: 75,
        });
      }

      if (input.vision?.body && input.vision.body.centering < 0.6) {
        suggestions.push({
          category: 'professional',
          priority: 'low',
          message: 'Not centered in frame',
          improvement: 'Adjust your camera position to center yourself',
          triggerMetric: 'centering',
          triggerValue: input.vision.body.centering * 100,
          targetValue: 85,
        });
      }
    }

    // Stress detection
    if (input.audio?.emotion && input.audio.emotion.stress_level > 70) {
      suggestions.push({
        category: 'voice',
        priority: 'high',
        message: 'High stress level detected in your voice',
        improvement: 'Take a deep breath and pause. Relax your shoulders',
        triggerMetric: 'stress_level',
        triggerValue: input.audio.emotion.stress_level,
        targetValue: 40,
      });
    }

    // Fidgeting detection
    if (input.vision?.body && input.vision.body.fidgeting_level > 60) {
      suggestions.push({
        category: 'body',
        priority: 'medium',
        message: 'Fidgeting detected',
        improvement: 'Keep your hands still or use purposeful gestures',
        triggerMetric: 'fidgeting_level',
        triggerValue: input.vision.body.fidgeting_level,
        targetValue: 30,
      });
    }

    return suggestions;
  }

  /**
   * Calculate score trends from history
   */
  private calculateTrends(currentScores: FeedbackScores): {
    confidenceDelta: number;
    engagementDelta: number;
    clarityDelta: number;
  } {
    if (this.previousScores.length === 0) {
      return {
        confidenceDelta: 0,
        engagementDelta: 0,
        clarityDelta: 0,
      };
    }

    const recentScores = this.previousScores.slice(-5); // Last 5 scores
    const avgPrevious = {
      confidence: recentScores.reduce((sum, s) => sum + s.confidence, 0) / recentScores.length,
      engagement: recentScores.reduce((sum, s) => sum + s.engagement, 0) / recentScores.length,
      clarity: recentScores.reduce((sum, s) => sum + s.clarity, 0) / recentScores.length,
    };

    return {
      confidenceDelta: Math.round(currentScores.confidence - avgPrevious.confidence),
      engagementDelta: Math.round(currentScores.engagement - avgPrevious.engagement),
      clarityDelta: Math.round(currentScores.clarity - avgPrevious.clarity),
    };
  }

  /**
   * Apply baseline adjustment to personalize scores
   */
  private applyBaselineAdjustment(score: number, baseline: number): number {
    // Adjust score relative to user's baseline
    // If performing above baseline, boost score
    // If performing below baseline, reduce score

    const delta = score - baseline;
    const adjustment = delta * 0.2; // 20% adjustment factor

    return Math.round(Math.max(0, Math.min(100, score + adjustment)));
  }

  /**
   * Reset score history (e.g., for new session)
   */
  resetHistory(): void {
    this.previousScores = [];
  }
}

/**
 * Singleton instance
 */
let _engineInstance: FeedbackScoringEngine | null = null;

export function getFeedbackScoringEngine(): FeedbackScoringEngine {
  if (!_engineInstance) {
    _engineInstance = new FeedbackScoringEngine();
  }
  return _engineInstance;
}
