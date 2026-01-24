'use client';

/**
 * Vision AI Intelligence - Neural Coach v2
 *
 * Real-time neural presence coach using:
 * - MediaPipe Face Mesh for facial landmark detection
 * - Web Audio API for voice energy and pitch analysis
 * - Pattern learning for predictive drift detection
 * - Escalating coach feedback system
 *
 * Last Updated: 2025-01-19
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface BiometricMetrics {
  bodyStability: number;
  facingCamera: number;
  headTilt: number;
  shoulderLevel: number;
  voiceEnergy: number;
  pitchStability: number;
  speechPresence: number;
  eyeContact: number;
  smileScore: number;
  browTension: number;
  faceDetected: boolean;
}

interface ChannelState {
  score: number;
  state: 'optimal' | 'drift' | 'alert';
}

interface FusionResult {
  score: number;
  grade: string;
  state: 'optimal' | 'drift' | 'alert';
  stateColor: string;
  channels: {
    posture: ChannelState;
    voice: ChannelState;
    face: ChannelState;
    attention: ChannelState;
  };
}

interface Prediction {
  type: string;
  eta: number;
  confidence: number;
  imminent: boolean;
}

interface LearnedPattern {
  type: string;
  frequency: number;
  avgInterval: number;
  confidence: number;
  trend: 'improving' | 'worsening' | 'neutral';
}

interface PatternData {
  history: number[];
  avgOnset: number;
  confidence: number;
}

interface FaceLandmarks {
  leftEye: { x: number; y: number };
  rightEye: { x: number; y: number };
  nose: { x: number; y: number };
  leftMouth: { x: number; y: number };
  rightMouth: { x: number; y: number };
  leftBrow: { x: number; y: number };
  rightBrow: { x: number; y: number };
  chin: { x: number; y: number };
}

interface SessionData {
  id: string;
  startTime: number;
  endTime?: number;
  avgScore: number;
  patterns: LearnedPattern[];
  metrics: BiometricMetrics[];
}

// MediaPipe types (external library has incomplete TS definitions)
interface NormalizedLandmark {
  x: number;
  y: number;
  z?: number;
  visibility?: number;
}

interface MediaPipeFaceMeshResults {
  multiFaceLandmarks?: NormalizedLandmark[][];
  image?: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement;
}

interface MediaPipeFaceMesh {
  setOptions: (options: Record<string, unknown>) => void;
  onResults: (callback: (results: MediaPipeFaceMeshResults) => void) => void;
  send: (input: { image: HTMLVideoElement }) => Promise<void>;
  close: () => void;
}

interface MediaPipeCamera {
  start: () => Promise<void>;
  stop: () => void;
}

// ═══════════════════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

const clamp = (v: number, min: number, max: number): number => Math.max(min, Math.min(max, v));
const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
const formatTime = (s: number): string =>
  `${Math.floor(s / 60)}:${String(Math.floor(s) % 60).padStart(2, '0')}`;
const mean = (arr: number[]): number =>
  arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

// ═══════════════════════════════════════════════════════════════════════════
// MEDIAPIPE FACE DETECTION
// ═══════════════════════════════════════════════════════════════════════════

interface FaceDetectionResult {
  landmarks: FaceLandmarks | null;
  faceDetected: boolean;
  boundingBox: { x: number; y: number; width: number; height: number } | null;
}

class FaceDetector {
  private faceMesh: MediaPipeFaceMesh | null = null;
  private camera: MediaPipeCamera | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private onResults: ((results: FaceDetectionResult) => void) | null = null;
  private isInitialized = false;

  async initialize(
    videoElement: HTMLVideoElement,
    onResults: (results: FaceDetectionResult) => void
  ): Promise<boolean> {
    this.videoElement = videoElement;
    this.onResults = onResults;

    try {
      // Load MediaPipe Face Mesh
      const { FaceMesh } = await import('@mediapipe/face_mesh');
      const { Camera } = await import('@mediapipe/camera_utils');

      this.faceMesh = new FaceMesh({
        locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
      }) as unknown as MediaPipeFaceMesh;

      this.faceMesh.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      this.faceMesh.onResults((results: MediaPipeFaceMeshResults) => {
        this.processResults(results);
      });

      this.camera = new Camera(videoElement, {
        onFrame: async () => {
          if (this.faceMesh && this.videoElement) {
            await this.faceMesh.send({ image: this.videoElement });
          }
        },
        width: 640,
        height: 480,
      });

      await this.camera.start();
      this.isInitialized = true;
      return true;
    } catch {
      // Fallback: use basic camera without MediaPipe
      return this.initializeFallback(videoElement);
    }
  }

  private async initializeFallback(videoElement: HTMLVideoElement): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
        audio: false,
      });
      videoElement.srcObject = stream;
      await videoElement.play();
      this.isInitialized = true;

      // Simple face detection fallback using canvas analysis
      this.startFallbackDetection();
      return true;
    } catch {
      return false;
    }
  }

  private startFallbackDetection(): void {
    const detect = () => {
      if (!this.isInitialized || !this.onResults) return;

      // Simulated detection when MediaPipe unavailable
      this.onResults({
        landmarks: null,
        faceDetected: true,
        boundingBox: { x: 0.25, y: 0.15, width: 0.5, height: 0.6 },
      });

      requestAnimationFrame(detect);
    };
    detect();
  }

  private processResults(results: MediaPipeFaceMeshResults): void {
    if (!this.onResults) return;

    if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) {
      this.onResults({ landmarks: null, faceDetected: false, boundingBox: null });
      return;
    }

    const landmarks = results.multiFaceLandmarks[0];

    // Extract key landmark indices
    const leftEye = landmarks[33];
    const rightEye = landmarks[263];
    const nose = landmarks[1];
    const leftMouth = landmarks[61];
    const rightMouth = landmarks[291];
    const leftBrow = landmarks[70];
    const rightBrow = landmarks[300];
    const chin = landmarks[152];

    // Calculate bounding box
    const xs = landmarks.map((l: NormalizedLandmark) => l.x);
    const ys = landmarks.map((l: NormalizedLandmark) => l.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    this.onResults({
      landmarks: {
        leftEye: { x: leftEye.x, y: leftEye.y },
        rightEye: { x: rightEye.x, y: rightEye.y },
        nose: { x: nose.x, y: nose.y },
        leftMouth: { x: leftMouth.x, y: leftMouth.y },
        rightMouth: { x: rightMouth.x, y: rightMouth.y },
        leftBrow: { x: leftBrow.x, y: leftBrow.y },
        rightBrow: { x: rightBrow.x, y: rightBrow.y },
        chin: { x: chin.x, y: chin.y },
      },
      faceDetected: true,
      boundingBox: {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY,
      },
    });
  }

  stop(): void {
    if (this.camera) {
      this.camera.stop();
    }
    if (this.videoElement?.srcObject) {
      const tracks = (this.videoElement.srcObject as MediaStream).getTracks();
      tracks.forEach((track) => track.stop());
    }
    this.isInitialized = false;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// VOICE ANALYZER
// ═══════════════════════════════════════════════════════════════════════════

interface VoiceMetrics {
  energy: number;
  pitchStability: number;
  speechPresence: number;
  fillerCount: number;
}

class VoiceAnalyzer {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private mediaStream: MediaStream | null = null;
  private dataArray: Uint8Array<ArrayBuffer> | null = null;
  private pitchHistory: number[] = [];
  private isInitialized = false;

  async initialize(): Promise<boolean> {
    try {
      this.audioContext = new AudioContext();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 2048;
      this.analyser.smoothingTimeConstant = 0.8;

      this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const source = this.audioContext.createMediaStreamSource(this.mediaStream);
      source.connect(this.analyser);

      this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
      this.isInitialized = true;
      return true;
    } catch {
      return false;
    }
  }

  getMetrics(): VoiceMetrics {
    if (!this.isInitialized || !this.analyser || !this.dataArray) {
      return { energy: 0, pitchStability: 50, speechPresence: 0, fillerCount: 0 };
    }

    this.analyser.getByteFrequencyData(this.dataArray);

    // Calculate RMS energy
    let sum = 0;
    for (let i = 0; i < this.dataArray.length; i++) {
      sum += this.dataArray[i] * this.dataArray[i];
    }
    const rms = Math.sqrt(sum / this.dataArray.length);
    const energy = clamp((rms / 128) * 100, 0, 100);

    // Speech presence (voice frequency range 80-300 Hz)
    const voiceRangeStart = Math.floor((80 / 22050) * this.dataArray.length);
    const voiceRangeEnd = Math.floor((300 / 22050) * this.dataArray.length);
    let voiceSum = 0;
    for (let i = voiceRangeStart; i < voiceRangeEnd; i++) {
      voiceSum += this.dataArray[i];
    }
    const speechPresence = clamp(voiceSum / ((voiceRangeEnd - voiceRangeStart) * 255), 0, 1);

    // Pitch stability (based on dominant frequency consistency)
    const dominantFreq = this.getDominantFrequency();
    this.pitchHistory.push(dominantFreq);
    if (this.pitchHistory.length > 30) this.pitchHistory.shift();

    let pitchStability = 50;
    if (this.pitchHistory.length > 5 && speechPresence > 0.1) {
      const avgPitch = mean(this.pitchHistory);
      const variance =
        this.pitchHistory.reduce((sum, p) => sum + Math.pow(p - avgPitch, 2), 0) /
        this.pitchHistory.length;
      pitchStability = clamp(100 - Math.sqrt(variance) * 2, 30, 100);
    }

    return {
      energy,
      pitchStability,
      speechPresence,
      fillerCount: 0,
    };
  }

  private getDominantFrequency(): number {
    if (!this.dataArray) return 0;

    let maxIndex = 0;
    let maxValue = 0;
    for (let i = 0; i < this.dataArray.length; i++) {
      if (this.dataArray[i] > maxValue) {
        maxValue = this.dataArray[i];
        maxIndex = i;
      }
    }
    return (maxIndex * 22050) / this.dataArray.length;
  }

  stop(): void {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
    }
    if (this.audioContext) {
      this.audioContext.close();
    }
    this.isInitialized = false;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// BIOMETRIC PROCESSOR
// Converts raw sensor data to normalized metrics
// ═══════════════════════════════════════════════════════════════════════════

function processLandmarksToMetrics(
  landmarks: FaceLandmarks | null,
  faceDetected: boolean,
  voiceMetrics: VoiceMetrics,
  prevMetrics: BiometricMetrics
): BiometricMetrics {
  if (!landmarks || !faceDetected) {
    return {
      ...prevMetrics,
      faceDetected: false,
      eyeContact: lerp(prevMetrics.eyeContact, 30, 0.1),
      facingCamera: lerp(prevMetrics.facingCamera, 40, 0.1),
    };
  }

  // Eye contact: based on eye position relative to center
  const eyeCenterX = (landmarks.leftEye.x + landmarks.rightEye.x) / 2;
  const eyeCenterY = (landmarks.leftEye.y + landmarks.rightEye.y) / 2;
  const eyeOffsetX = Math.abs(eyeCenterX - 0.5);
  const eyeOffsetY = Math.abs(eyeCenterY - 0.35);
  const eyeContact = clamp(100 - eyeOffsetX * 200 - eyeOffsetY * 150, 0, 100);

  // Head tilt: angle between eyes
  const eyeDeltaY = landmarks.rightEye.y - landmarks.leftEye.y;
  const eyeDeltaX = landmarks.rightEye.x - landmarks.leftEye.x;
  const headTilt = Math.atan2(eyeDeltaY, eyeDeltaX) * (180 / Math.PI);

  // Facing camera: based on nose position relative to eye midpoint
  const noseCenterOffset = Math.abs(landmarks.nose.x - eyeCenterX);
  const facingCamera = clamp(100 - noseCenterOffset * 400, 0, 100);

  // Smile score: mouth width relative to face width
  const mouthWidth = Math.abs(landmarks.rightMouth.x - landmarks.leftMouth.x);
  const faceWidth = Math.abs(landmarks.rightEye.x - landmarks.leftEye.x) * 2;
  const smileRatio = mouthWidth / faceWidth;
  const smileScore = clamp((smileRatio - 0.3) * 200, 0, 100);

  // Brow tension: vertical distance between brows and eyes
  const leftBrowDist = landmarks.leftBrow.y - landmarks.leftEye.y;
  const rightBrowDist = landmarks.rightBrow.y - landmarks.rightEye.y;
  const avgBrowDist = (leftBrowDist + rightBrowDist) / 2;
  const browTension = clamp((0.05 - avgBrowDist) * 1000, 0, 100);

  // Body stability: based on face position consistency (smoothed)
  const bodyStability = lerp(
    prevMetrics.bodyStability,
    clamp(90 - Math.abs(eyeCenterX - 0.5) * 100 - Math.abs(eyeCenterY - 0.35) * 80, 40, 100),
    0.15
  );

  // Shoulder level: estimated from chin position relative to face center
  const shoulderLevel = (landmarks.chin.y - 0.7) * 50;

  return {
    bodyStability,
    facingCamera: lerp(prevMetrics.facingCamera, facingCamera, 0.2),
    headTilt: lerp(prevMetrics.headTilt, headTilt, 0.3),
    shoulderLevel: lerp(prevMetrics.shoulderLevel, shoulderLevel, 0.15),
    voiceEnergy: lerp(prevMetrics.voiceEnergy, voiceMetrics.energy, 0.3),
    pitchStability: lerp(prevMetrics.pitchStability, voiceMetrics.pitchStability, 0.2),
    speechPresence: voiceMetrics.speechPresence,
    eyeContact: lerp(prevMetrics.eyeContact, eyeContact, 0.25),
    smileScore: lerp(prevMetrics.smileScore, smileScore, 0.15),
    browTension: lerp(prevMetrics.browTension, browTension, 0.2),
    faceDetected: true,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// NEURAL PATTERN PREDICTOR
// ═══════════════════════════════════════════════════════════════════════════

class NeuralPatternPredictor {
  patterns: Record<string, PatternData>;
  sessionStart: number;
  lastMetrics: BiometricMetrics | null;
  driftBuffer: Array<{ time: number } & BiometricMetrics>;
  scoreHistory: number[];

  constructor() {
    this.patterns = {
      postureDrift: { history: [], avgOnset: 45, confidence: 0 },
      gazeDrift: { history: [], avgOnset: 30, confidence: 0 },
      voiceFade: { history: [], avgOnset: 60, confidence: 0 },
      browTension: { history: [], avgOnset: 20, confidence: 0 },
      shoulderRise: { history: [], avgOnset: 35, confidence: 0 },
    };
    this.sessionStart = Date.now();
    this.lastMetrics = null;
    this.driftBuffer = [];
    this.scoreHistory = [];
  }

  update(metrics: BiometricMetrics, score: number): void {
    const elapsed = (Date.now() - this.sessionStart) / 1000;
    this.scoreHistory.push(score);

    if (this.lastMetrics) {
      if (metrics.bodyStability < 60 && this.lastMetrics.bodyStability >= 60) {
        this.patterns.postureDrift.history.push(elapsed);
        this.recalculatePattern('postureDrift');
      }
      if (metrics.eyeContact < 50 && this.lastMetrics.eyeContact >= 50) {
        this.patterns.gazeDrift.history.push(elapsed);
        this.recalculatePattern('gazeDrift');
      }
      if (metrics.voiceEnergy < 30 && this.lastMetrics.voiceEnergy >= 30) {
        this.patterns.voiceFade.history.push(elapsed);
        this.recalculatePattern('voiceFade');
      }
      if (metrics.browTension > 40 && this.lastMetrics.browTension <= 40) {
        this.patterns.browTension.history.push(elapsed);
        this.recalculatePattern('browTension');
      }
      if (Math.abs(metrics.shoulderLevel) > 8 && Math.abs(this.lastMetrics.shoulderLevel) <= 8) {
        this.patterns.shoulderRise.history.push(elapsed);
        this.recalculatePattern('shoulderRise');
      }
    }

    this.lastMetrics = { ...metrics };
    this.driftBuffer.push({ time: elapsed, ...metrics });
    if (this.driftBuffer.length > 100) this.driftBuffer.shift();
  }

  recalculatePattern(patternKey: string): void {
    const pattern = this.patterns[patternKey];
    if (pattern.history.length < 2) {
      pattern.confidence = 0.3;
      return;
    }
    const intervals: number[] = [];
    for (let i = 1; i < pattern.history.length; i++) {
      intervals.push(pattern.history[i] - pattern.history[i - 1]);
    }
    pattern.avgOnset = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const stdDev = Math.sqrt(
      intervals.reduce((sum, x) => sum + Math.pow(x - pattern.avgOnset, 2), 0) / intervals.length
    );
    pattern.confidence = clamp(1 - stdDev / pattern.avgOnset, 0.3, 0.95);
  }

  getPredictions(): Prediction[] {
    const elapsed = (Date.now() - this.sessionStart) / 1000;
    const predictions: Prediction[] = [];
    Object.entries(this.patterns).forEach(([key, pattern]) => {
      if (pattern.history.length === 0) return;
      const lastEvent = pattern.history[pattern.history.length - 1];
      const timeSinceEvent = elapsed - lastEvent;
      const timeUntilPredicted = pattern.avgOnset - timeSinceEvent;
      if (timeUntilPredicted > 0 && timeUntilPredicted < 30 && pattern.confidence > 0.4) {
        predictions.push({
          type: key,
          eta: Math.round(timeUntilPredicted),
          confidence: Math.round(pattern.confidence * 100),
          imminent: timeUntilPredicted < 10,
        });
      }
    });
    return predictions.sort((a, b) => a.eta - b.eta);
  }

  getLearnedPatterns(): LearnedPattern[] {
    return Object.entries(this.patterns)
      .filter(([, p]) => p.history.length >= 2)
      .map(([key, pattern]) => ({
        type: key,
        frequency: pattern.history.length,
        avgInterval: Math.round(pattern.avgOnset),
        confidence: Math.round(pattern.confidence * 100),
        trend: this.calculateTrend(pattern),
      }));
  }

  calculateTrend(pattern: PatternData): 'improving' | 'worsening' | 'neutral' {
    if (pattern.history.length < 3) return 'neutral';
    const recent = pattern.history.slice(-3);
    const intervals: number[] = [];
    for (let i = 1; i < recent.length; i++) {
      intervals.push(recent[i] - recent[i - 1]);
    }
    const firstInterval = intervals[0];
    const lastInterval = intervals[intervals.length - 1];
    if (lastInterval > firstInterval * 1.2) return 'improving';
    if (lastInterval < firstInterval * 0.8) return 'worsening';
    return 'neutral';
  }

  getSessionSummary(): { avgScore: number; patterns: LearnedPattern[] } {
    return {
      avgScore: this.scoreHistory.length ? mean(this.scoreHistory) : 0,
      patterns: this.getLearnedPatterns(),
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// BIOMETRIC FUSION ENGINE
// ═══════════════════════════════════════════════════════════════════════════

function computeNeuralFusion(metrics: BiometricMetrics): FusionResult {
  const {
    bodyStability = 50,
    facingCamera = 50,
    headTilt = 0,
    shoulderLevel = 0,
    voiceEnergy = 0,
    pitchStability = 50,
    speechPresence = 0,
    eyeContact = 50,
    smileScore = 0,
    browTension = 0,
  } = metrics;

  const postureScore =
    bodyStability * 0.3 +
    facingCamera * 0.3 +
    clamp(100 - Math.abs(headTilt) * 4, 0, 100) * 0.2 +
    clamp(100 - Math.abs(shoulderLevel) * 5, 0, 100) * 0.2;

  const voiceScore = speechPresence > 0.2 ? voiceEnergy * 0.5 + pitchStability * 0.5 : 60;

  const faceScore =
    eyeContact * 0.5 +
    clamp(60 + smileScore * 0.3, 0, 100) * 0.3 +
    clamp(100 - browTension * 0.8, 0, 100) * 0.2;

  const attentionScore = eyeContact * 0.6 + facingCamera * 0.4;

  const fusionScore =
    postureScore * 0.2 + voiceScore * 0.25 + faceScore * 0.3 + attentionScore * 0.25;

  let state: 'optimal' | 'drift' | 'alert' = 'optimal';
  let stateColor = '#10B981';
  if (fusionScore < 50) {
    state = 'alert';
    stateColor = '#EF4444';
  } else if (fusionScore < 70) {
    state = 'drift';
    stateColor = '#F59E0B';
  }

  let grade: string;
  if (fusionScore >= 93) grade = 'A';
  else if (fusionScore >= 85) grade = 'A-';
  else if (fusionScore >= 80) grade = 'B+';
  else if (fusionScore >= 75) grade = 'B';
  else if (fusionScore >= 70) grade = 'B-';
  else if (fusionScore >= 65) grade = 'C+';
  else if (fusionScore >= 60) grade = 'C';
  else grade = 'D';

  const getChannelState = (score: number): 'optimal' | 'drift' | 'alert' =>
    score >= 70 ? 'optimal' : score >= 50 ? 'drift' : 'alert';

  return {
    score: Math.round(fusionScore),
    grade,
    state,
    stateColor,
    channels: {
      posture: { score: Math.round(postureScore), state: getChannelState(postureScore) },
      voice: { score: Math.round(voiceScore), state: getChannelState(voiceScore) },
      face: { score: Math.round(faceScore), state: getChannelState(faceScore) },
      attention: { score: Math.round(attentionScore), state: getChannelState(attentionScore) },
    },
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// COACH FEEDBACK
// ═══════════════════════════════════════════════════════════════════════════

const COACHING_MESSAGES: Record<string, { subtle: null; mid: string; explicit: string }> = {
  postureDrift: {
    subtle: null,
    mid: 'Center yourself',
    explicit: 'Your posture is drifting - sit tall, shoulders back',
  },
  gazeDrift: {
    subtle: null,
    mid: 'Eyes forward',
    explicit: "You're looking away - reconnect with the camera",
  },
  voiceFade: {
    subtle: null,
    mid: 'Project your voice',
    explicit: 'Your energy is fading - speak with more presence',
  },
  browTension: {
    subtle: null,
    mid: 'Relax your face',
    explicit: "You're tensing up - soften your brow and breathe",
  },
  shoulderRise: {
    subtle: null,
    mid: 'Drop your shoulders',
    explicit: 'Shoulders are rising - release the tension',
  },
  noFace: {
    subtle: null,
    mid: 'Move into frame',
    explicit: 'I cannot see you - adjust your camera position',
  },
};

const PATTERN_LABELS: Record<string, { name: string; icon: string }> = {
  postureDrift: { name: 'Posture Drift', icon: '🧘' },
  gazeDrift: { name: 'Gaze Wander', icon: '👁️' },
  voiceFade: { name: 'Voice Fade', icon: '🎤' },
  browTension: { name: 'Brow Tension', icon: '😤' },
  shoulderRise: { name: 'Shoulder Rise', icon: '🤷' },
};

// ═══════════════════════════════════════════════════════════════════════════
// API SERVICE
// ═══════════════════════════════════════════════════════════════════════════

const API_BASE = '/api/v1/neural-coach';

async function saveSession(session: SessionData): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(session),
    });
    return response.ok;
  } catch {
    // Store locally if API unavailable
    const sessions = JSON.parse(localStorage.getItem('neural-coach-sessions') || '[]');
    sessions.push(session);
    localStorage.setItem('neural-coach-sessions', JSON.stringify(sessions.slice(-50)));
    return true;
  }
}

async function getSessionHistory(): Promise<SessionData[]> {
  try {
    const response = await fetch(`${API_BASE}/sessions`);
    if (response.ok) return response.json();
  } catch {
    // Fallback to local storage
  }
  return JSON.parse(localStorage.getItem('neural-coach-sessions') || '[]');
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

function FusionRing({ score, grade }: { score: number; grade: string }) {
  const circumference = 2 * Math.PI * 58;
  const offset = circumference - (score / 100) * circumference;
  return (
    <div className="nc-fusion-ring">
      <svg viewBox="0 0 140 140">
        <defs>
          <linearGradient id="fusionGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8B5CF6" />
            <stop offset="100%" stopColor="#FF6B35" />
          </linearGradient>
        </defs>
        <circle className="nc-fusion-ring-bg" cx="70" cy="70" r="58" />
        <circle
          className="nc-fusion-ring-value"
          cx="70"
          cy="70"
          r="58"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="nc-fusion-ring-center">
        <div className="nc-fusion-value">{score}</div>
        <div className="nc-fusion-grade">{grade}</div>
      </div>
    </div>
  );
}

function BiometricChannel({
  name,
  icon,
  score,
  state,
}: {
  name: string;
  icon: string;
  score: number;
  state: 'optimal' | 'drift' | 'alert';
}) {
  return (
    <div className={`nc-channel ${state}`}>
      <div className="nc-channel-header">
        <span className="nc-channel-name">
          <span className="nc-channel-icon">{icon}</span>
          {name}
        </span>
        <span
          className="nc-channel-value"
          style={{
            color: state === 'optimal' ? '#10B981' : state === 'drift' ? '#F59E0B' : '#EF4444',
          }}
        >
          {score}%
        </span>
      </div>
      <div className="nc-channel-bar">
        <div className={`nc-channel-fill ${state}`} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

function PredictionItem({ type, eta, confidence, imminent }: Prediction) {
  const label = PATTERN_LABELS[type] || { name: type, icon: '⚡' };
  return (
    <div className={`nc-prediction-item ${imminent ? 'imminent' : ''}`}>
      <span className="nc-prediction-eta">{eta}s</span>
      <span className="nc-prediction-desc">
        {label.icon} {label.name} predicted
      </span>
      <span className="nc-prediction-conf">{confidence}%</span>
    </div>
  );
}

function PatternItem({ type, frequency, avgInterval, trend }: LearnedPattern) {
  const label = PATTERN_LABELS[type] || { name: type, icon: '📊' };
  return (
    <div className="nc-pattern-item">
      <div className="nc-pattern-icon">{label.icon}</div>
      <div className="nc-pattern-info">
        <div className="nc-pattern-name">{label.name}</div>
        <div className="nc-pattern-freq">
          {frequency}x detected - avg {avgInterval}s interval
        </div>
      </div>
      <span className={`nc-pattern-trend ${trend}`}>
        {trend === 'improving' ? '↑' : trend === 'worsening' ? '↓' : '→'}
      </span>
    </div>
  );
}

function CoachToast({
  message,
  level,
  visible,
}: {
  message: string | null;
  level: string;
  visible: boolean;
}) {
  return (
    <div className={`nc-coach-toast ${visible ? 'visible' : ''} ${level}`}>
      <span className="nc-coach-message">{message}</span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════════════════

export default function VisionAIIntelligencePage() {
  const [isRunning, setIsRunning] = useState(false);
  const [sessionTime, setSessionTime] = useState(0);
  const [coachMessage, setCoachMessage] = useState<string | null>(null);
  const [coachLevel, setCoachLevel] = useState('subtle');
  const [escalationLevel, setEscalationLevel] = useState(0);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isDemo, setIsDemo] = useState(false);
  const [faceBox, setFaceBox] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);

  const [metrics, setMetrics] = useState<BiometricMetrics>({
    bodyStability: 85,
    facingCamera: 90,
    headTilt: 0,
    shoulderLevel: 0,
    voiceEnergy: 60,
    pitchStability: 75,
    speechPresence: 0.5,
    eyeContact: 85,
    smileScore: 30,
    browTension: 10,
    faceDetected: false,
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const faceDetectorRef = useRef<FaceDetector | null>(null);
  const voiceAnalyzerRef = useRef<VoiceAnalyzer | null>(null);
  const predictorRef = useRef<NeuralPatternPredictor>(new NeuralPatternPredictor());
  const sessionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const coachTimerRef = useRef<NodeJS.Timeout | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const sessionIdRef = useRef<string>('');
  const metricsBufferRef = useRef<BiometricMetrics[]>([]);

  const fusion = useMemo(() => computeNeuralFusion(metrics), [metrics]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [learnedPatterns, setLearnedPatterns] = useState<LearnedPattern[]>([]);

  // Start real camera session
  const startRealSession = useCallback(async () => {
    if (!videoRef.current) return;

    setCameraError(null);
    setIsDemo(false);

    // Initialize face detector
    faceDetectorRef.current = new FaceDetector();
    const faceSuccess = await faceDetectorRef.current.initialize(videoRef.current, (result) => {
      if (result.boundingBox) {
        setFaceBox(result.boundingBox);
      } else {
        setFaceBox(null);
      }

      const voiceMetrics = voiceAnalyzerRef.current?.getMetrics() || {
        energy: 0,
        pitchStability: 50,
        speechPresence: 0,
        fillerCount: 0,
      };

      setMetrics((prev) =>
        processLandmarksToMetrics(result.landmarks, result.faceDetected, voiceMetrics, prev)
      );
    });

    if (!faceSuccess) {
      setCameraError('Camera access denied. Using demo mode.');
      startDemoMode();
      return;
    }

    // Initialize voice analyzer
    voiceAnalyzerRef.current = new VoiceAnalyzer();
    await voiceAnalyzerRef.current.initialize();

    // Start session
    predictorRef.current = new NeuralPatternPredictor();
    sessionIdRef.current = `session-${Date.now()}`;
    metricsBufferRef.current = [];
    setSessionTime(0);
    setIsRunning(true);
  }, []);

  // Demo mode simulation
  const startDemoMode = useCallback(() => {
    setIsDemo(true);
    predictorRef.current = new NeuralPatternPredictor();
    sessionIdRef.current = `demo-${Date.now()}`;
    metricsBufferRef.current = [];
    setSessionTime(0);
    setIsRunning(true);

    let driftPhase: 'stable' | 'drifting' | 'alert' = 'stable';
    const phases: Array<'stable' | 'drifting' | 'alert'> = [
      'stable',
      'stable',
      'drifting',
      'drifting',
      'stable',
      'alert',
      'stable',
    ];
    let phaseIndex = 0;

    const phaseInterval = setInterval(() => {
      phaseIndex = (phaseIndex + 1) % phases.length;
      driftPhase = phases[phaseIndex];
    }, 8000);

    const tick = () => {
      if (!isRunning) return;

      setMetrics((prev) => {
        const noise = () => (Math.random() - 0.5) * 4;
        const drift = driftPhase === 'drifting' ? -0.5 : driftPhase === 'alert' ? -1 : 0.3;

        return {
          bodyStability: clamp(prev.bodyStability + drift + noise(), 40, 95),
          facingCamera: clamp(prev.facingCamera + drift * 0.5 + noise(), 50, 98),
          headTilt: clamp(
            prev.headTilt + (driftPhase === 'drifting' ? 0.3 : -0.2) + noise() * 0.5,
            -15,
            15
          ),
          shoulderLevel: clamp(
            prev.shoulderLevel + (driftPhase === 'alert' ? 0.2 : -0.1) + noise() * 0.3,
            -10,
            10
          ),
          voiceEnergy: clamp(prev.voiceEnergy + drift + noise() * 2, 20, 90),
          pitchStability: clamp(prev.pitchStability + noise(), 50, 95),
          speechPresence: clamp(prev.speechPresence + (Math.random() - 0.5) * 0.1, 0.2, 0.8),
          eyeContact: clamp(prev.eyeContact + drift * 1.5 + noise(), 30, 95),
          smileScore: clamp(prev.smileScore + noise() * 2, 0, 60),
          browTension: clamp(
            prev.browTension + (driftPhase === 'alert' ? 1 : -0.3) + noise(),
            0,
            60
          ),
          faceDetected: true,
        };
      });

      animationFrameRef.current = requestAnimationFrame(tick);
    };

    // Slower tick rate for demo
    const demoInterval = setInterval(tick, 200);

    // Store cleanup refs
    (animationFrameRef as any).demoInterval = demoInterval;
    (animationFrameRef as any).phaseInterval = phaseInterval;
  }, [isRunning]);

  // Stop session
  const stopSession = useCallback(async () => {
    setIsRunning(false);

    // Stop detectors
    if (faceDetectorRef.current) {
      faceDetectorRef.current.stop();
      faceDetectorRef.current = null;
    }
    if (voiceAnalyzerRef.current) {
      voiceAnalyzerRef.current.stop();
      voiceAnalyzerRef.current = null;
    }

    // Clear intervals
    if (sessionTimerRef.current) clearInterval(sessionTimerRef.current);
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if ((animationFrameRef as any).demoInterval)
      clearInterval((animationFrameRef as any).demoInterval);
    if ((animationFrameRef as any).phaseInterval)
      clearInterval((animationFrameRef as any).phaseInterval);

    // Save session
    const summary = predictorRef.current.getSessionSummary();
    const sessionData: SessionData = {
      id: sessionIdRef.current,
      startTime: predictorRef.current.sessionStart,
      endTime: Date.now(),
      avgScore: summary.avgScore,
      patterns: summary.patterns,
      metrics: metricsBufferRef.current.slice(-100),
    };
    await saveSession(sessionData);
  }, []);

  // Toggle session
  const handleToggleSession = () => {
    if (isRunning) {
      stopSession();
    } else {
      startRealSession();
    }
  };

  // Session timer
  useEffect(() => {
    if (isRunning) {
      sessionTimerRef.current = setInterval(() => {
        setSessionTime((t) => t + 1);
      }, 1000);
    }
    return () => {
      if (sessionTimerRef.current) clearInterval(sessionTimerRef.current);
    };
  }, [isRunning]);

  // Update predictor
  useEffect(() => {
    if (!isRunning) return;
    predictorRef.current.update(metrics, fusion.score);
    setPredictions(predictorRef.current.getPredictions());
    setLearnedPatterns(predictorRef.current.getLearnedPatterns());
    metricsBufferRef.current.push(metrics);
    if (metricsBufferRef.current.length > 500) metricsBufferRef.current.shift();
  }, [metrics, isRunning, fusion.score]);

  // Coach feedback
  useEffect(() => {
    if (!isRunning) return;

    let newLevel = 0;
    if (fusion.state === 'drift') newLevel = 1;
    if (fusion.state === 'alert') newLevel = 2;
    if (!metrics.faceDetected && !isDemo) newLevel = 2;

    setEscalationLevel(newLevel);

    if (newLevel > 0) {
      let messageKey = 'postureDrift';

      if (!metrics.faceDetected && !isDemo) {
        messageKey = 'noFace';
      } else {
        const problemChannel = Object.entries(fusion.channels).find(
          ([, ch]) => ch.state !== 'optimal'
        );
        if (problemChannel) {
          const [channelName] = problemChannel;
          messageKey =
            channelName === 'posture'
              ? 'postureDrift'
              : channelName === 'attention'
                ? 'gazeDrift'
                : channelName === 'voice'
                  ? 'voiceFade'
                  : 'browTension';
        }
      }

      const messages = COACHING_MESSAGES[messageKey];
      const levelKey = newLevel === 1 ? 'mid' : 'explicit';
      const message = messages?.[levelKey];

      if (message) {
        setCoachMessage(message);
        setCoachLevel(newLevel === 2 ? 'urgent' : 'normal');

        if (coachTimerRef.current) clearTimeout(coachTimerRef.current);
        coachTimerRef.current = setTimeout(
          () => setCoachMessage(null),
          newLevel === 2 ? 5000 : 3000
        );
      }
    } else {
      setCoachMessage(null);
    }
  }, [fusion, isRunning, metrics.faceDetected, isDemo]);

  const neuralState =
    fusion.state === 'optimal' ? 'tracking' : predictions.length > 0 ? 'predicting' : fusion.state;

  return (
    <>
      <style jsx global>{`
        :root {
          --bsi-burnt-orange: #bf5700;
          --bsi-ember: #ff6b35;
          --bsi-gold: #c9a227;
          --bsi-texas-soil: #8b4513;
          --bsi-cream: #faf8f5;
          --bsi-bone: #f5f2eb;
          --bsi-charcoal: #1a1a1a;
          --bsi-charcoal-light: #2a2a2a;
          --bsi-midnight: #0d0d0d;
          --bsi-white: #ffffff;
          --bsi-success: #10b981;
          --bsi-warning: #f59e0b;
          --bsi-error: #ef4444;
          --bsi-gray-300: #d1d5db;
          --bsi-gray-400: #9ca3af;
          --bsi-gray-500: #6b7280;
          --bsi-gray-600: #4b5563;
          --neural-optimal: #10b981;
          --neural-drift: #f59e0b;
          --neural-alert: #ef4444;
          --neural-predict: #8b5cf6;
          --font-display: 'Oswald', sans-serif;
          --font-heading: 'Oswald', sans-serif;
          --font-body: 'Cormorant Garamond', serif;
          --font-mono: 'IBM Plex Mono', monospace;
          --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
          --glow-ember: 0 0 30px rgba(255, 107, 53, 0.25);
        }

        .nc-app {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
          font-family: var(--font-body);
          background: var(--bsi-midnight);
          color: var(--bsi-bone);
        }

        .nc-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 20px;
          background: rgba(26, 26, 26, 0.95);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid var(--bsi-charcoal-light);
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .nc-logo {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .nc-logo-icon {
          width: 32px;
          height: 32px;
          background: linear-gradient(135deg, var(--bsi-burnt-orange), var(--bsi-ember));
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
        }

        .nc-logo-text {
          font-family: var(--font-heading);
          font-size: 18px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .nc-logo-badge {
          font-family: var(--font-mono);
          font-size: 9px;
          background: var(--neural-predict);
          color: white;
          padding: 2px 6px;
          border-radius: 3px;
          text-transform: uppercase;
        }

        .nc-status {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .nc-neural-indicator {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 12px;
          background: var(--bsi-charcoal);
          border-radius: 20px;
          border: 1px solid var(--bsi-charcoal-light);
        }

        .nc-neural-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--neural-optimal);
          animation: neuralPulse 2s infinite;
        }

        .nc-neural-dot.predicting {
          background: var(--neural-predict);
          animation: neuralPredict 1s infinite;
        }

        .nc-neural-dot.drift {
          background: var(--neural-drift);
          animation: neuralWarn 0.5s infinite;
        }

        .nc-neural-dot.alert {
          background: var(--neural-alert);
          animation: neuralAlert 0.3s infinite;
        }

        @keyframes neuralPulse {
          0%,
          100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.6;
            transform: scale(0.9);
          }
        }

        @keyframes neuralPredict {
          0%,
          100% {
            opacity: 1;
            box-shadow: 0 0 0 0 rgba(139, 92, 246, 0.4);
          }
          50% {
            opacity: 0.8;
            box-shadow: 0 0 0 6px rgba(139, 92, 246, 0);
          }
        }

        @keyframes neuralWarn {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }

        @keyframes neuralAlert {
          0%,
          100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.7;
            transform: scale(1.2);
          }
        }

        .nc-neural-label {
          font-family: var(--font-mono);
          font-size: 11px;
          color: var(--bsi-gray-400);
          text-transform: uppercase;
        }

        .nc-main {
          flex: 1;
          display: grid;
          grid-template-columns: 1fr 320px;
          gap: 0;
          max-height: calc(100vh - 57px);
        }

        @media (max-width: 900px) {
          .nc-main {
            grid-template-columns: 1fr;
            max-height: none;
          }
        }

        .nc-video-section {
          position: relative;
          background: var(--bsi-midnight);
          display: flex;
          flex-direction: column;
        }

        .nc-video-container {
          position: relative;
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          padding: 16px;
        }

        .nc-video-wrap {
          position: relative;
          width: 100%;
          max-width: 800px;
          aspect-ratio: 4/3;
          background: var(--bsi-charcoal);
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        }

        .nc-video {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transform: scaleX(-1);
        }

        .nc-video-placeholder {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, var(--bsi-charcoal), var(--bsi-midnight));
          gap: 16px;
        }

        .nc-placeholder-icon {
          font-size: 48px;
          opacity: 0.5;
        }

        .nc-placeholder-text {
          font-family: var(--font-heading);
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: var(--bsi-gray-500);
        }

        .nc-face-box {
          position: absolute;
          border: 2px solid var(--neural-optimal);
          border-radius: 8px;
          transition: all 0.15s ease-out;
          opacity: 0.7;
          pointer-events: none;
        }

        .nc-face-box.drift {
          border-color: var(--neural-drift);
          box-shadow: 0 0 20px rgba(245, 158, 11, 0.3);
        }

        .nc-face-box.alert {
          border-color: var(--neural-alert);
          box-shadow: 0 0 30px rgba(239, 68, 68, 0.4);
        }

        .nc-state-badge {
          position: absolute;
          top: 16px;
          left: 16px;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 14px;
          background: rgba(0, 0, 0, 0.8);
          backdrop-filter: blur(10px);
          border-radius: 20px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          z-index: 20;
        }

        .nc-state-icon {
          width: 10px;
          height: 10px;
          border-radius: 50%;
        }

        .nc-state-text {
          font-family: var(--font-mono);
          font-size: 11px;
          text-transform: uppercase;
        }

        .nc-prediction-badge {
          position: absolute;
          top: 16px;
          right: 16px;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 14px;
          background: rgba(139, 92, 246, 0.2);
          backdrop-filter: blur(10px);
          border-radius: 20px;
          border: 1px solid rgba(139, 92, 246, 0.4);
          z-index: 20;
          opacity: 0;
          transform: translateY(-10px);
          transition: all 0.3s var(--ease-spring);
        }

        .nc-prediction-badge.active {
          opacity: 1;
          transform: translateY(0);
        }

        .nc-prediction-text {
          font-family: var(--font-mono);
          font-size: 11px;
          color: var(--neural-predict);
        }

        .nc-coach-toast {
          position: absolute;
          bottom: 24px;
          left: 50%;
          transform: translateX(-50%) translateY(20px);
          padding: 12px 24px;
          background: rgba(0, 0, 0, 0.9);
          backdrop-filter: blur(20px);
          border-radius: 30px;
          border: 1px solid var(--bsi-burnt-orange);
          box-shadow: var(--glow-ember);
          opacity: 0;
          transition: all 0.4s var(--ease-spring);
          z-index: 30;
          max-width: 90%;
          text-align: center;
        }

        .nc-coach-toast.visible {
          opacity: 1;
          transform: translateX(-50%) translateY(0);
        }

        .nc-coach-toast.urgent {
          border-color: var(--neural-alert);
          box-shadow: 0 0 40px rgba(239, 68, 68, 0.3);
        }

        .nc-coach-message {
          font-family: var(--font-body);
          font-size: 15px;
          color: var(--bsi-bone);
        }

        .nc-controls {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 16px;
          background: var(--bsi-charcoal);
          border-top: 1px solid var(--bsi-charcoal-light);
        }

        .nc-btn-record {
          width: 56px;
          height: 56px;
          background: var(--neural-alert);
          border-radius: 50%;
          position: relative;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
        }

        .nc-btn-record::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 20px;
          height: 20px;
          background: white;
          border-radius: 4px;
          transition: all 0.2s;
        }

        .nc-btn-record.recording::before {
          width: 16px;
          height: 16px;
          border-radius: 2px;
        }

        .nc-btn-record.recording {
          animation: recordPulse 1.5s infinite;
        }

        @keyframes recordPulse {
          0%,
          100% {
            box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4);
          }
          50% {
            box-shadow: 0 0 0 12px rgba(239, 68, 68, 0);
          }
        }

        .nc-btn-demo {
          padding: 10px 20px;
          background: var(--bsi-charcoal-light);
          border: 1px solid var(--bsi-gray-600);
          border-radius: 8px;
          color: var(--bsi-bone);
          font-family: var(--font-heading);
          font-size: 12px;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.2s;
        }

        .nc-btn-demo:hover {
          border-color: var(--bsi-burnt-orange);
        }

        .nc-error {
          position: absolute;
          bottom: 80px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(239, 68, 68, 0.2);
          border: 1px solid var(--neural-alert);
          padding: 8px 16px;
          border-radius: 8px;
          font-family: var(--font-mono);
          font-size: 11px;
          color: var(--neural-alert);
        }

        .nc-escalation {
          position: absolute;
          bottom: 16px;
          left: 16px;
          display: flex;
          align-items: center;
          gap: 6px;
          z-index: 20;
        }

        .nc-escalation-step {
          width: 24px;
          height: 4px;
          background: var(--bsi-gray-600);
          border-radius: 2px;
          transition: all 0.3s;
        }

        .nc-escalation-step.active {
          background: var(--neural-optimal);
        }

        .nc-escalation-step.warning {
          background: var(--neural-drift);
        }

        .nc-escalation-step.alert {
          background: var(--neural-alert);
        }

        .nc-panel {
          background: var(--bsi-charcoal);
          border-left: 1px solid var(--bsi-charcoal-light);
          display: flex;
          flex-direction: column;
          overflow-y: auto;
        }

        .nc-panel-header {
          padding: 16px;
          border-bottom: 1px solid var(--bsi-charcoal-light);
        }

        .nc-panel-title {
          font-family: var(--font-heading);
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: var(--bsi-bone);
          margin-bottom: 4px;
        }

        .nc-panel-subtitle {
          font-family: var(--font-mono);
          font-size: 11px;
          color: var(--bsi-gray-500);
        }

        .nc-panel-content {
          flex: 1;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          overflow-y: auto;
        }

        .nc-fusion-score {
          background: linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(191, 87, 0, 0.1));
          border: 1px solid rgba(139, 92, 246, 0.3);
          border-radius: 12px;
          padding: 20px;
          text-align: center;
        }

        .nc-fusion-label {
          font-family: var(--font-heading);
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: var(--neural-predict);
          margin-bottom: 8px;
        }

        .nc-fusion-ring {
          width: 140px;
          height: 140px;
          margin: 0 auto 12px;
          position: relative;
        }

        .nc-fusion-ring svg {
          width: 100%;
          height: 100%;
          transform: rotate(-90deg);
        }

        .nc-fusion-ring-bg {
          fill: none;
          stroke: var(--bsi-charcoal-light);
          stroke-width: 8;
        }

        .nc-fusion-ring-value {
          fill: none;
          stroke: url(#fusionGradient);
          stroke-width: 8;
          stroke-linecap: round;
          transition: stroke-dashoffset 0.5s ease-out;
        }

        .nc-fusion-ring-center {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        .nc-fusion-value {
          font-family: var(--font-display);
          font-size: 56px;
          font-weight: 700;
          background: linear-gradient(135deg, var(--neural-predict), var(--bsi-ember));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          line-height: 1;
        }

        .nc-fusion-grade {
          font-family: var(--font-heading);
          font-size: 18px;
          color: var(--bsi-bone);
          margin-top: 4px;
        }

        .nc-channels {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .nc-channel {
          background: var(--bsi-charcoal-light);
          border-radius: 8px;
          padding: 12px;
          border: 1px solid transparent;
          transition: all 0.2s;
        }

        .nc-channel.drift {
          border-color: var(--neural-drift);
          background: rgba(245, 158, 11, 0.05);
        }

        .nc-channel.alert {
          border-color: var(--neural-alert);
          background: rgba(239, 68, 68, 0.05);
        }

        .nc-channel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .nc-channel-name {
          display: flex;
          align-items: center;
          gap: 8px;
          font-family: var(--font-heading);
          font-size: 12px;
          text-transform: uppercase;
          color: var(--bsi-gray-300);
        }

        .nc-channel-icon {
          font-size: 14px;
        }

        .nc-channel-value {
          font-family: var(--font-mono);
          font-size: 14px;
          font-weight: 500;
        }

        .nc-channel-bar {
          height: 6px;
          background: var(--bsi-midnight);
          border-radius: 3px;
          overflow: hidden;
        }

        .nc-channel-fill {
          height: 100%;
          border-radius: 3px;
          transition: width 0.3s ease-out;
        }

        .nc-channel-fill.optimal {
          background: linear-gradient(90deg, var(--neural-optimal), #34d399);
        }

        .nc-channel-fill.drift {
          background: linear-gradient(90deg, var(--neural-drift), #fbbf24);
        }

        .nc-channel-fill.alert {
          background: linear-gradient(90deg, var(--neural-alert), #f87171);
        }

        .nc-predictions {
          background: var(--bsi-charcoal-light);
          border-radius: 8px;
          padding: 12px;
        }

        .nc-predictions-header {
          margin-bottom: 12px;
        }

        .nc-predictions-title {
          font-family: var(--font-heading);
          font-size: 11px;
          text-transform: uppercase;
          color: var(--neural-predict);
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .nc-predictions-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .nc-prediction-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px;
          background: var(--bsi-midnight);
          border-radius: 6px;
          border-left: 3px solid var(--neural-predict);
        }

        .nc-prediction-item.imminent {
          border-left-color: var(--neural-drift);
          background: rgba(245, 158, 11, 0.1);
        }

        .nc-prediction-eta {
          font-family: var(--font-mono);
          font-size: 12px;
          color: var(--neural-predict);
          min-width: 40px;
        }

        .nc-prediction-item.imminent .nc-prediction-eta {
          color: var(--neural-drift);
        }

        .nc-prediction-desc {
          font-size: 12px;
          color: var(--bsi-gray-300);
          flex: 1;
        }

        .nc-prediction-conf {
          font-family: var(--font-mono);
          font-size: 10px;
          color: var(--bsi-gray-500);
        }

        .nc-patterns {
          background: var(--bsi-charcoal-light);
          border-radius: 8px;
          padding: 12px;
        }

        .nc-patterns-header {
          font-family: var(--font-heading);
          font-size: 11px;
          text-transform: uppercase;
          color: var(--bsi-gray-400);
          margin-bottom: 12px;
        }

        .nc-pattern-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 0;
          border-bottom: 1px solid var(--bsi-midnight);
        }

        .nc-pattern-item:last-child {
          border-bottom: none;
        }

        .nc-pattern-icon {
          width: 28px;
          height: 28px;
          background: var(--bsi-midnight);
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
        }

        .nc-pattern-info {
          flex: 1;
        }

        .nc-pattern-name {
          font-size: 12px;
          color: var(--bsi-bone);
          margin-bottom: 2px;
        }

        .nc-pattern-freq {
          font-family: var(--font-mono);
          font-size: 10px;
          color: var(--bsi-gray-500);
        }

        .nc-pattern-trend {
          font-family: var(--font-mono);
          font-size: 11px;
        }

        .nc-pattern-trend.improving {
          color: var(--neural-optimal);
        }

        .nc-pattern-trend.worsening {
          color: var(--neural-alert);
        }

        .nc-timer {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px;
          background: var(--bsi-charcoal-light);
          border-radius: 8px;
        }

        .nc-timer-value {
          font-family: var(--font-mono);
          font-size: 24px;
          font-weight: 500;
          color: var(--bsi-bone);
        }

        .nc-coach-note {
          background: var(--bsi-charcoal-light);
          border-radius: 8px;
          padding: 12px;
          border-left: 3px solid var(--bsi-burnt-orange);
        }

        .nc-coach-note-header {
          font-family: var(--font-heading);
          font-size: 11px;
          text-transform: uppercase;
          color: var(--bsi-burnt-orange);
          margin-bottom: 8px;
        }

        .nc-coach-note-text {
          font-size: 13px;
          color: var(--bsi-gray-300);
          line-height: 1.5;
        }

        .nc-mode-badge {
          position: fixed;
          top: 70px;
          right: 20px;
          background: rgba(139, 92, 246, 0.9);
          color: white;
          padding: 8px 16px;
          border-radius: 20px;
          font-family: var(--font-mono);
          font-size: 11px;
          text-transform: uppercase;
          z-index: 200;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .nc-mode-badge.live {
          background: rgba(16, 185, 129, 0.9);
        }

        .nc-mode-dot {
          width: 8px;
          height: 8px;
          background: white;
          border-radius: 50%;
          animation: modePulse 1s infinite;
        }

        @keyframes modePulse {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }

        @media (max-width: 900px) {
          .nc-main {
            grid-template-columns: 1fr;
          }
          .nc-panel {
            border-left: none;
            border-top: 1px solid var(--bsi-charcoal-light);
            max-height: 50vh;
          }
        }
      `}</style>

      <div className="nc-app">
        {isRunning && (
          <div className={`nc-mode-badge ${isDemo ? '' : 'live'}`}>
            <div className="nc-mode-dot" />
            {isDemo ? 'Demo Mode' : 'Live'}
          </div>
        )}

        <header className="nc-header">
          <div className="nc-logo">
            <div className="nc-logo-icon">🧠</div>
            <span className="nc-logo-text">Vision AI Intelligence</span>
            <span className="nc-logo-badge">v2</span>
          </div>
          <div className="nc-status">
            <div className="nc-neural-indicator">
              <div className={`nc-neural-dot ${neuralState}`} />
              <span className="nc-neural-label">
                {neuralState === 'tracking'
                  ? 'Neural Tracking'
                  : neuralState === 'predicting'
                    ? 'Predicting Drift'
                    : neuralState === 'drift'
                      ? 'Drift Detected'
                      : neuralState === 'alert'
                        ? 'Attention Needed'
                        : 'Ready'}
              </span>
            </div>
          </div>
        </header>

        <main className="nc-main">
          <section className="nc-video-section">
            <div className="nc-video-container">
              <div className="nc-video-wrap">
                <video ref={videoRef} className="nc-video" playsInline muted />

                {!isRunning && (
                  <div className="nc-video-placeholder">
                    <div className="nc-placeholder-icon">👤</div>
                    <div className="nc-placeholder-text">Click Start to Begin</div>
                  </div>
                )}

                {isRunning && faceBox && (
                  <div
                    className={`nc-face-box ${fusion.state}`}
                    style={{
                      left: `${(1 - faceBox.x - faceBox.width) * 100}%`,
                      top: `${faceBox.y * 100}%`,
                      width: `${faceBox.width * 100}%`,
                      height: `${faceBox.height * 100}%`,
                    }}
                  />
                )}

                {isRunning && (
                  <div className="nc-state-badge">
                    <div className="nc-state-icon" style={{ background: fusion.stateColor }} />
                    <span className="nc-state-text" style={{ color: fusion.stateColor }}>
                      {fusion.state === 'optimal'
                        ? 'Optimal'
                        : fusion.state === 'drift'
                          ? 'Drifting'
                          : 'Alert'}
                    </span>
                  </div>
                )}

                {isRunning && predictions.length > 0 && (
                  <div
                    className={`nc-prediction-badge ${predictions[0]?.imminent ? 'active' : ''}`}
                  >
                    <span className="nc-prediction-text">
                      ⚡ {PATTERN_LABELS[predictions[0]?.type]?.name} in {predictions[0]?.eta}s
                    </span>
                  </div>
                )}

                {isRunning && (
                  <div className="nc-escalation">
                    <div className={`nc-escalation-step ${escalationLevel >= 0 ? 'active' : ''}`} />
                    <div
                      className={`nc-escalation-step ${escalationLevel >= 1 ? 'warning' : ''}`}
                    />
                    <div className={`nc-escalation-step ${escalationLevel >= 2 ? 'alert' : ''}`} />
                  </div>
                )}

                {cameraError && <div className="nc-error">{cameraError}</div>}

                <CoachToast message={coachMessage} level={coachLevel} visible={!!coachMessage} />
              </div>
            </div>

            <div className="nc-controls">
              <button
                className={`nc-btn-record ${isRunning ? 'recording' : ''}`}
                onClick={handleToggleSession}
                title={isRunning ? 'Stop Session' : 'Start Session'}
              />
              {!isRunning && (
                <button className="nc-btn-demo" onClick={startDemoMode}>
                  Demo Mode
                </button>
              )}
            </div>
          </section>

          <aside className="nc-panel">
            <div className="nc-panel-header">
              <div className="nc-panel-title">Neural Fusion</div>
              <div className="nc-panel-subtitle">Biometric synthesis in real-time</div>
            </div>

            <div className="nc-panel-content">
              <div className="nc-fusion-score">
                <div className="nc-fusion-label">Presence Score</div>
                <FusionRing score={fusion.score} grade={fusion.grade} />
              </div>

              {isRunning && (
                <div className="nc-timer">
                  <span>⏱️</span>
                  <span className="nc-timer-value">{formatTime(sessionTime)}</span>
                </div>
              )}

              <div className="nc-channels">
                <BiometricChannel
                  name="Posture"
                  icon="🧘"
                  score={fusion.channels.posture.score}
                  state={fusion.channels.posture.state}
                />
                <BiometricChannel
                  name="Voice"
                  icon="🎤"
                  score={fusion.channels.voice.score}
                  state={fusion.channels.voice.state}
                />
                <BiometricChannel
                  name="Face"
                  icon="😊"
                  score={fusion.channels.face.score}
                  state={fusion.channels.face.state}
                />
                <BiometricChannel
                  name="Attention"
                  icon="👁️"
                  score={fusion.channels.attention.score}
                  state={fusion.channels.attention.state}
                />
              </div>

              {predictions.length > 0 && (
                <div className="nc-predictions">
                  <div className="nc-predictions-header">
                    <span className="nc-predictions-title">⚡ Neural Predictions</span>
                  </div>
                  <div className="nc-predictions-list">
                    {predictions.slice(0, 3).map((pred, i) => (
                      <PredictionItem key={i} {...pred} />
                    ))}
                  </div>
                </div>
              )}

              {learnedPatterns.length > 0 && (
                <div className="nc-patterns">
                  <div className="nc-patterns-header">🧬 Your Patterns (Learning...)</div>
                  {learnedPatterns.map((pattern, i) => (
                    <PatternItem key={i} {...pattern} />
                  ))}
                </div>
              )}

              <div className="nc-coach-note">
                <div className="nc-coach-note-header">💡 Vision AI Coach</div>
                <div className="nc-coach-note-text">
                  {isRunning
                    ? "I'm learning your patterns. The longer we train, the better I can predict and prevent drift before you notice it."
                    : 'Start a session to begin neural presence training. Grant camera and microphone access for real-time biometric tracking.'}
                </div>
              </div>
            </div>
          </aside>
        </main>
      </div>
    </>
  );
}
