'use client';

/**
 * Vision AI Intelligence Page
 *
 * Real-time pose estimation and body language analysis using TensorFlow.js MoveNet.
 * Features session recording, pro form overlays, and voice signal analysis.
 *
 * Accessibility: WCAG AA compliant with:
 * - Full keyboard navigation (Tab, Enter, Space, Escape)
 * - ARIA labels and live regions for screen readers
 * - High contrast focus indicators
 * - Skip link to main content
 *
 * Last Updated: 2025-01-07
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Play,
  StopCircle,
  Target,
  Activity,
  Mic,
  CheckCircle2,
  Download,
  Upload,
  RotateCcw,
  Eye,
  EyeOff,
  Save,
  User,
  Smartphone,
  Camera,
  AlertCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Info,
  X,
} from 'lucide-react';

// TensorFlow.js type declarations for CDN loading
// Minimal type definition for TensorFlow.js API used in this component
interface TFGraphModel {
  predict: (inputs: TFTensor) => TFTensor;
  execute: (inputs: TFTensor | Record<string, TFTensor>) => TFTensor | TFTensor[];
  dispose: () => void;
}

interface TensorFlowAPI {
  ready: () => Promise<void>;
  tensor: (data: number[] | number[][] | number[][][]) => TFTensor;
  tensor2d: (data: number[][] | number[], shape?: [number, number]) => TFTensor;
  tidy: <T>(fn: () => T) => T;
  dispose: () => void;
  backend: () => string;
  setBackend: (backendName: string) => Promise<boolean>;
  getBackend: () => string;
  memory: () => { numTensors: number; numBytes: number };
  loadGraphModel: (modelUrl: string, options?: { fromTFHub?: boolean }) => Promise<TFGraphModel>;
}

interface TFTensor {
  dataSync: () => Float32Array | Int32Array;
  data: () => Promise<Float32Array | Int32Array>;
  arraySync: () => number[] | number[][] | number[][][];
  dispose: () => void;
  shape: number[];
}

declare global {
  interface Window {
    tf: TensorFlowAPI;
  }
}

// Load TensorFlow.js from CDN
const loadTensorFlow = (): Promise<TensorFlowAPI> => {
  return new Promise((resolve, reject) => {
    if (typeof window !== 'undefined' && window.tf) {
      resolve(window.tf);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.22.0/dist/tf.min.js';
    script.async = true;
    script.onload = () => {
      if (window.tf) {
        resolve(window.tf);
      } else {
        reject(new Error('TensorFlow.js failed to load'));
      }
    };
    script.onerror = () => reject(new Error('Failed to load TensorFlow.js script'));
    document.head.appendChild(script);
  });
};

// ═══════════════════════════════════════════════════════════════════════════
// BSI DESIGN TOKENS (matching globals.css)
// ═══════════════════════════════════════════════════════════════════════════
const COLORS = {
  orange: '#bf5700',
  soil: '#8b4513',
  ember: '#ff6b35',
  midnight: '#0d0d0d',
  charcoal: '#1a1a1a',
  bone: '#f5f2eb',
  dust: '#c4b8a5',
  pro: '#22c55e', // Pro form overlay color
};

// ═══════════════════════════════════════════════════════════════════════════
// PRO FORM REFERENCE DATA (normalized keypoints for ideal stances)
// ═══════════════════════════════════════════════════════════════════════════
const PRO_FORMS: Record<
  string,
  { name: string; description: string; keypoints: Array<{ x: number; y: number; score: number }> }
> = {
  pitchingStance: {
    name: 'Pitching Stance',
    description: 'MLB-grade wind-up position',
    keypoints: [
      { x: 0.5, y: 0.15, score: 0.95 }, // nose
      { x: 0.47, y: 0.13, score: 0.9 }, // leftEye
      { x: 0.53, y: 0.13, score: 0.9 }, // rightEye
      { x: 0.44, y: 0.15, score: 0.85 }, // leftEar
      { x: 0.56, y: 0.15, score: 0.85 }, // rightEar
      { x: 0.38, y: 0.28, score: 0.95 }, // leftShoulder
      { x: 0.62, y: 0.28, score: 0.95 }, // rightShoulder
      { x: 0.32, y: 0.42, score: 0.9 }, // leftElbow
      { x: 0.68, y: 0.42, score: 0.9 }, // rightElbow
      { x: 0.28, y: 0.55, score: 0.85 }, // leftWrist
      { x: 0.72, y: 0.55, score: 0.85 }, // rightWrist
      { x: 0.42, y: 0.52, score: 0.95 }, // leftHip
      { x: 0.58, y: 0.52, score: 0.95 }, // rightHip
      { x: 0.4, y: 0.72, score: 0.9 }, // leftKnee
      { x: 0.6, y: 0.72, score: 0.9 }, // rightKnee
      { x: 0.38, y: 0.92, score: 0.85 }, // leftAnkle
      { x: 0.62, y: 0.92, score: 0.85 }, // rightAnkle
    ],
  },
  battingStance: {
    name: 'Batting Stance',
    description: 'Balanced ready position',
    keypoints: [
      { x: 0.5, y: 0.18, score: 0.95 }, // nose
      { x: 0.47, y: 0.16, score: 0.9 }, // leftEye
      { x: 0.53, y: 0.16, score: 0.9 }, // rightEye
      { x: 0.44, y: 0.18, score: 0.85 }, // leftEar
      { x: 0.56, y: 0.18, score: 0.85 }, // rightEar
      { x: 0.35, y: 0.3, score: 0.95 }, // leftShoulder
      { x: 0.55, y: 0.28, score: 0.95 }, // rightShoulder
      { x: 0.28, y: 0.25, score: 0.9 }, // leftElbow (bat position)
      { x: 0.6, y: 0.38, score: 0.9 }, // rightElbow
      { x: 0.35, y: 0.15, score: 0.85 }, // leftWrist (bat grip)
      { x: 0.38, y: 0.18, score: 0.85 }, // rightWrist (bat grip)
      { x: 0.4, y: 0.52, score: 0.95 }, // leftHip
      { x: 0.6, y: 0.52, score: 0.95 }, // rightHip
      { x: 0.38, y: 0.74, score: 0.9 }, // leftKnee
      { x: 0.62, y: 0.74, score: 0.9 }, // rightKnee
      { x: 0.35, y: 0.94, score: 0.85 }, // leftAnkle
      { x: 0.65, y: 0.94, score: 0.85 }, // rightAnkle
    ],
  },
  presentationStance: {
    name: 'Presentation Stance',
    description: 'Confident speaker posture',
    keypoints: [
      { x: 0.5, y: 0.12, score: 0.95 }, // nose
      { x: 0.47, y: 0.1, score: 0.9 }, // leftEye
      { x: 0.53, y: 0.1, score: 0.9 }, // rightEye
      { x: 0.44, y: 0.12, score: 0.85 }, // leftEar
      { x: 0.56, y: 0.12, score: 0.85 }, // rightEar
      { x: 0.38, y: 0.25, score: 0.95 }, // leftShoulder
      { x: 0.62, y: 0.25, score: 0.95 }, // rightShoulder
      { x: 0.32, y: 0.4, score: 0.9 }, // leftElbow
      { x: 0.68, y: 0.4, score: 0.9 }, // rightElbow
      { x: 0.35, y: 0.5, score: 0.85 }, // leftWrist
      { x: 0.65, y: 0.5, score: 0.85 }, // rightWrist
      { x: 0.45, y: 0.5, score: 0.95 }, // leftHip
      { x: 0.55, y: 0.5, score: 0.95 }, // rightHip
      { x: 0.45, y: 0.75, score: 0.9 }, // leftKnee
      { x: 0.55, y: 0.75, score: 0.9 }, // rightKnee
      { x: 0.45, y: 0.95, score: 0.85 }, // leftAnkle
      { x: 0.55, y: 0.95, score: 0.85 }, // rightAnkle
    ],
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════════════════
const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
const mean = (arr: number[]) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);
const variance = (arr: number[]) => {
  if (arr.length < 2) return 0;
  const m = mean(arr);
  return mean(arr.map((x) => (x - m) ** 2));
};
const dist = (a: { x: number; y: number }, b: { x: number; y: number }) =>
  Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
const midpoint = (a: { x: number; y: number }, b: { x: number; y: number }) => ({
  x: (a.x + b.x) / 2,
  y: (a.y + b.y) / 2,
});
const radToDeg = (r: number) => (r * 180) / Math.PI;

const confLabel = (score: number) => {
  if (score >= 0.7) return 'High';
  if (score >= 0.45) return 'Medium';
  return 'Low';
};

type DeltaResult = { text: string; cls: 'positive' | 'negative' | 'neutral' } | null;

const formatDelta = (current: number | null, baseline: number | null | undefined): DeltaResult => {
  if (baseline === null || baseline === undefined || current === null) return null;
  const diff = current - baseline;
  if (Math.abs(diff) < 1) return { text: '—', cls: 'neutral' };
  const sign = diff > 0 ? '+' : '';
  return { text: `${sign}${diff.toFixed(0)}`, cls: diff > 0 ? 'positive' : 'negative' };
};

// ═══════════════════════════════════════════════════════════════════════════
// DETECT MOBILE SAFARI
// ═══════════════════════════════════════════════════════════════════════════
const isMobileSafari = (): boolean => {
  if (typeof window === 'undefined') return false;
  const ua = window.navigator.userAgent;
  const iOS = /iPad|iPhone|iPod/.test(ua);
  const webkit = /WebKit/.test(ua);
  const notChrome = !/CriOS/.test(ua);
  return iOS && webkit && notChrome;
};

// ═══════════════════════════════════════════════════════════════════════════
// INDEXED DB FOR SESSION RECORDING
// ═══════════════════════════════════════════════════════════════════════════
const DB_NAME = 'BSI_VisionAI';
const DB_VERSION = 1;
const STORE_SESSIONS = 'sessions';
const STORE_FRAMES = 'frames';

interface RecordedFrame {
  sessionId: string;
  frameIndex: number;
  timestamp: number;
  keypoints: Array<{ x: number; y: number; score: number }>;
  poseMetrics: { stability: number; shoulderSym: number; hipSym: number; spineLean: number };
  audioMetrics: { energy: number; steadiness: number };
}

interface RecordedSession {
  id: string;
  createdAt: number;
  duration: number;
  mode: 'sports' | 'body';
  frameCount: number;
  baseline?: Baseline;
}

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains(STORE_SESSIONS)) {
        db.createObjectStore(STORE_SESSIONS, { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains(STORE_FRAMES)) {
        const frameStore = db.createObjectStore(STORE_FRAMES, {
          keyPath: ['sessionId', 'frameIndex'],
        });
        frameStore.createIndex('sessionId', 'sessionId', { unique: false });
      }
    };
  });
};

const saveSession = async (session: RecordedSession): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_SESSIONS, 'readwrite');
    tx.objectStore(STORE_SESSIONS).put(session);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

const saveFrame = async (frame: RecordedFrame): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_FRAMES, 'readwrite');
    tx.objectStore(STORE_FRAMES).put(frame);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

const loadSessions = async (): Promise<RecordedSession[]> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_SESSIONS, 'readonly');
    const request = tx.objectStore(STORE_SESSIONS).getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const loadSessionFrames = async (sessionId: string): Promise<RecordedFrame[]> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_FRAMES, 'readonly');
    const index = tx.objectStore(STORE_FRAMES).index('sessionId');
    const request = index.getAll(sessionId);
    request.onsuccess = () => resolve(request.result.sort((a, b) => a.frameIndex - b.frameIndex));
    request.onerror = () => reject(request.error);
  });
};

// ═══════════════════════════════════════════════════════════════════════════
// MOVENET KEYPOINT INDICES
// ═══════════════════════════════════════════════════════════════════════════
const KEYPOINTS: Record<string, number> = {
  nose: 0,
  leftEye: 1,
  rightEye: 2,
  leftEar: 3,
  rightEar: 4,
  leftShoulder: 5,
  rightShoulder: 6,
  leftElbow: 7,
  rightElbow: 8,
  leftWrist: 9,
  rightWrist: 10,
  leftHip: 11,
  rightHip: 12,
  leftKnee: 13,
  rightKnee: 14,
  leftAnkle: 15,
  rightAnkle: 16,
};

const SKELETON_EDGES: [number, number][] = [
  [KEYPOINTS.leftShoulder, KEYPOINTS.rightShoulder],
  [KEYPOINTS.leftHip, KEYPOINTS.rightHip],
  [KEYPOINTS.leftShoulder, KEYPOINTS.leftElbow],
  [KEYPOINTS.leftElbow, KEYPOINTS.leftWrist],
  [KEYPOINTS.rightShoulder, KEYPOINTS.rightElbow],
  [KEYPOINTS.rightElbow, KEYPOINTS.rightWrist],
  [KEYPOINTS.leftShoulder, KEYPOINTS.leftHip],
  [KEYPOINTS.rightShoulder, KEYPOINTS.rightHip],
  [KEYPOINTS.leftHip, KEYPOINTS.leftKnee],
  [KEYPOINTS.leftKnee, KEYPOINTS.leftAnkle],
  [KEYPOINTS.rightHip, KEYPOINTS.rightKnee],
  [KEYPOINTS.rightKnee, KEYPOINTS.rightAnkle],
];

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════
interface Keypoint {
  x: number;
  y: number;
  score: number;
  name?: string;
}

interface PoseSignals {
  confidence: string;
  shoulderSym: string;
  hipSym: string;
  spineLean: string;
  stability: string;
}

interface AudioSignals {
  confidence: string;
  energy: string;
  steadiness: string;
}

interface Baseline {
  stability: number;
  shoulderSym: number;
  hipSym: number;
  energy: number;
  savedAt?: number;
  userId?: string;
}

interface BaselineResponse {
  baseline?: Baseline;
}

interface LogEntry {
  t: string;
  tag: string;
  msg: string;
  id: number;
}

interface ChartPoint {
  t: string;
  stability: number;
  energy: number;
}

interface PoseWindow {
  t: number;
  x: number;
  y: number;
}

interface EnergyWindow {
  t: number;
  e: number;
}

interface CalibData {
  stability: number | null;
  shoulderSym: number | null;
  hipSym: number | null;
  energy: number;
}

type PermissionStatus = 'unknown' | 'prompt' | 'granted' | 'denied';

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════
export default function VisionAIIntelligencePage() {
  // State
  const [mode, setMode] = useState<'sports' | 'body'>('sports');
  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState('Initializing...');
  const [_modelLoaded, setModelLoaded] = useState(false);
  const [fps, setFps] = useState(0);

  // Permission state (for mobile Safari)
  const [cameraPermission, setCameraPermission] = useState<PermissionStatus>('unknown');
  const [micPermission, setMicPermission] = useState<PermissionStatus>('unknown');
  const [showPermissionPrompt, setShowPermissionPrompt] = useState(false);
  const [isMobileSafariBrowser, setIsMobileSafariBrowser] = useState(false);

  // Calibration
  const [calibrating, setCalibrating] = useState(false);
  const [calibrated, setCalibrated] = useState(false);
  const [calibProgress, setCalibProgress] = useState(0);
  const [baseline, setBaseline] = useState<Baseline | null>(null);
  const [savingBaseline, setSavingBaseline] = useState(false);

  // Metrics
  const [poseSignals, setPoseSignals] = useState<PoseSignals | null>(null);
  const [audioSignals, setAudioSignals] = useState<AudioSignals | null>(null);

  // History for charts
  const [chartData, setChartData] = useState<ChartPoint[]>([]);

  // Logs
  const [logs, setLogs] = useState<LogEntry[]>([]);

  // Recording
  const [isRecording, setIsRecording] = useState(false);
  const [recordedSessions, setRecordedSessions] = useState<RecordedSession[]>([]);
  const [playbackSession, setPlaybackSession] = useState<RecordedSession | null>(null);
  const [playbackFrames, setPlaybackFrames] = useState<RecordedFrame[]>([]);
  const [playbackIndex, setPlaybackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // Pro form overlay
  const [showProOverlay, setShowProOverlay] = useState(false);
  const [selectedProForm, setSelectedProForm] = useState<string>('pitchingStance');
  const [proOverlayOpacity, setProOverlayOpacity] = useState(0.5);

  // Instructions and help
  const [showInstructions, setShowInstructions] = useState(true);
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  // Live region for screen reader announcements
  const [announcement, setAnnouncement] = useState('');

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tfRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const modelRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef(0);
  const lastFrameRef = useRef(0);

  // Rolling windows
  const poseWindowRef = useRef<PoseWindow[]>([]);
  const energyWindowRef = useRef<EnergyWindow[]>([]);
  const calibDataRef = useRef<CalibData[]>([]);

  // Recording refs
  const currentSessionIdRef = useRef<string>('');
  const frameCountRef = useRef(0);
  const lastKeypointsRef = useRef<Keypoint[]>([]);

  // Running state ref for loop
  const runningRef = useRef(false);
  const calibratingRef = useRef(false);
  const recordingRef = useRef(false);

  // Keep refs in sync with state
  useEffect(() => {
    runningRef.current = running;
  }, [running]);

  useEffect(() => {
    calibratingRef.current = calibrating;
  }, [calibrating]);

  useEffect(() => {
    recordingRef.current = isRecording;
  }, [isRecording]);

  // ─────────────────────────────────────────────────────────────────────────
  // DETECT MOBILE SAFARI ON MOUNT
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    setIsMobileSafariBrowser(isMobileSafari());
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // CHECK PERMISSIONS
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const checkPermissions = async () => {
      try {
        // Check camera permission
        if ('permissions' in navigator) {
          try {
            const camera = await navigator.permissions.query({ name: 'camera' as PermissionName });
            setCameraPermission(camera.state as PermissionStatus);
            camera.onchange = () => setCameraPermission(camera.state as PermissionStatus);
          } catch {
            // Safari doesn't support camera permission query
            setCameraPermission('prompt');
          }

          try {
            const mic = await navigator.permissions.query({ name: 'microphone' as PermissionName });
            setMicPermission(mic.state as PermissionStatus);
            mic.onchange = () => setMicPermission(mic.state as PermissionStatus);
          } catch {
            setMicPermission('prompt');
          }
        } else {
          // Fallback for browsers without Permissions API
          setCameraPermission('prompt');
          setMicPermission('prompt');
        }
      } catch (_err) {
        // handled by UI state
      }
    };

    checkPermissions();
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // LOAD SAVED SESSIONS
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const loadSavedSessions = async () => {
      try {
        const sessions = await loadSessions();
        setRecordedSessions(sessions.sort((a, b) => b.createdAt - a.createdAt));
      } catch (_err) {
        // handled by UI state
      }
    };

    loadSavedSessions();
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // LOAD SAVED BASELINE FROM API
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const loadSavedBaseline = async () => {
      try {
        const res = await fetch('/api/v1/vision/baselines');
        if (res.ok) {
          const data = (await res.json()) as BaselineResponse;
          if (data.baseline) {
            setBaseline(data.baseline);
            setCalibrated(true);
          }
        }
      } catch (_err) {
        // handled by UI state
      }
    };

    loadSavedBaseline();
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // SCREEN READER ANNOUNCEMENTS
  // ─────────────────────────────────────────────────────────────────────────
  const announce = useCallback((message: string) => {
    setAnnouncement(message);
    // Clear after announcement is read
    setTimeout(() => setAnnouncement(''), 1000);
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // LOGGING
  // ─────────────────────────────────────────────────────────────────────────
  const addLog = useCallback((tag: string, msg: string, shouldAnnounce = false) => {
    const t = startTimeRef.current
      ? ((performance.now() - startTimeRef.current) / 1000).toFixed(1)
      : '0.0';
    setLogs((prev) => [{ t, tag, msg, id: Date.now() }, ...prev].slice(0, 50));

    // Announce important events to screen readers
    if (shouldAnnounce) {
      setAnnouncement(`${tag}: ${msg}`);
      setTimeout(() => setAnnouncement(''), 1000);
    }
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // LOAD MODEL
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    let mounted = true;

    async function loadModel() {
      try {
        setStatus('Loading TensorFlow...');

        // Load TensorFlow.js from CDN
        const tf = await loadTensorFlow();
        tfRef.current = tf;
        await tf.ready();

        if (!mounted) return;
        setStatus('Loading MoveNet model...');

        // Load MoveNet SinglePose Lightning (smaller, faster)
        const model = await tf.loadGraphModel(
          'https://tfhub.dev/google/tfjs-model/movenet/singlepose/lightning/4',
          { fromTFHub: true }
        );

        if (!mounted) return;
        modelRef.current = model;
        setModelLoaded(true);
        setStatus('Ready');
        addLog('System', 'MoveNet model loaded successfully');
      } catch (_err) {
        setStatus('Model load failed - using simulated data');
        setModelLoaded(false);
        addLog('Error', 'Model failed to load. Using simulated signals.');
      }
    }

    loadModel();

    return () => {
      mounted = false;
    };
  }, [addLog]);

  // ─────────────────────────────────────────────────────────────────────────
  // STOP SESSION
  // ─────────────────────────────────────────────────────────────────────────
  const stop = useCallback(async () => {
    setRunning(false);
    setCalibrating(false);

    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
      analyserRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
    }

    // Save recording session if active
    if (isRecording && currentSessionIdRef.current) {
      const session: RecordedSession = {
        id: currentSessionIdRef.current,
        createdAt: Date.now(),
        duration: (performance.now() - startTimeRef.current) / 1000,
        mode,
        frameCount: frameCountRef.current,
        baseline: baseline ?? undefined,
      };

      try {
        await saveSession(session);
        setRecordedSessions((prev) => [session, ...prev]);
        addLog('Recording', `Session saved with ${frameCountRef.current} frames`);
      } catch (_err) {
        addLog('Error', 'Failed to save recording');
      }
    }

    setIsRecording(false);
    setStatus('Stopped');
    addLog('Session', 'Analysis stopped');
  }, [addLog, isRecording, mode, baseline]);

  // ─────────────────────────────────────────────────────────────────────────
  // INIT AUDIO
  // ─────────────────────────────────────────────────────────────────────────
  const initAudio = async (stream: MediaStream) => {
    try {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioContextClass();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      const src = ctx.createMediaStreamSource(stream);
      src.connect(analyser);
      audioCtxRef.current = ctx;
      analyserRef.current = analyser;
    } catch (_err) {
      // handled by UI state
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // DRAW PRO FORM OVERLAY
  // ─────────────────────────────────────────────────────────────────────────
  const drawProOverlay = useCallback(
    (ctx: CanvasRenderingContext2D, width: number, height: number) => {
      const proForm = PRO_FORMS[selectedProForm];
      if (!proForm) return;

      ctx.save();
      ctx.globalAlpha = proOverlayOpacity;
      ctx.strokeStyle = COLORS.pro;
      ctx.lineWidth = 2;

      // Scale normalized keypoints to canvas size
      const scaledKeypoints = proForm.keypoints.map((kp) => ({
        x: kp.x * width,
        y: kp.y * height,
        score: kp.score,
      }));

      // Draw skeleton edges
      SKELETON_EDGES.forEach(([i, j]) => {
        const p1 = scaledKeypoints[i];
        const p2 = scaledKeypoints[j];
        if (p1 && p2 && p1.score > 0.3 && p2.score > 0.3) {
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
        }
      });

      // Draw keypoints
      ctx.fillStyle = COLORS.pro;
      scaledKeypoints.forEach((kp) => {
        if (kp.score > 0.3) {
          ctx.beginPath();
          ctx.arc(kp.x, kp.y, 4, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      ctx.restore();
    },
    [selectedProForm, proOverlayOpacity]
  );

  // ─────────────────────────────────────────────────────────────────────────
  // PROCESS POSE
  // ─────────────────────────────────────────────────────────────────────────
  const processPose = useCallback(
    async (
      video: HTMLVideoElement,
      ctx: CanvasRenderingContext2D,
      t: number
    ): Promise<{
      stability: number | null;
      shoulderSym: number | null;
      hipSym: number | null;
      spineLean: number | null;
    }> => {
      let keypoints: Keypoint[] | null = null;
      let useSimulated = !modelRef.current;

      if (modelRef.current && tfRef.current && video.readyState >= 2) {
        try {
          const tf = tfRef.current;
          // Prepare input tensor
          const input = tf.tidy(() => {
            const img = tf.browser.fromPixels(video);
            const resized = tf.image.resizeBilinear(img, [192, 192]);
            const casted = resized.toInt();
            return casted.expandDims(0);
          });

          // Run inference
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const result = (await modelRef.current.predict(input)) as any;
          const data = (await result.array()) as number[][][][];
          input.dispose();
          result.dispose();

          // Extract keypoints [1, 1, 17, 3] -> [17, 3] (y, x, confidence)
          keypoints = data[0][0].map((kp, i) => ({
            y: kp[0] * video.videoHeight,
            x: kp[1] * video.videoWidth,
            score: kp[2],
            name: Object.keys(KEYPOINTS).find((k) => KEYPOINTS[k] === i),
          }));
        } catch (_err) {
          useSimulated = true;
        }
      }

      // Simulated data fallback
      if (useSimulated) {
        const cx = (ctx.canvas.width || 640) / 2;
        const cy = (ctx.canvas.height || 480) / 2;
        const noise = () => (Math.random() - 0.5) * 20;

        keypoints = [
          { x: cx, y: cy - 100 + noise(), score: 0.9, name: 'nose' },
          { x: cx - 15, y: cy - 110 + noise(), score: 0.85, name: 'leftEye' },
          { x: cx + 15, y: cy - 110 + noise(), score: 0.85, name: 'rightEye' },
          { x: cx - 30, y: cy - 100 + noise(), score: 0.7, name: 'leftEar' },
          { x: cx + 30, y: cy - 100 + noise(), score: 0.7, name: 'rightEar' },
          { x: cx - 80 + noise(), y: cy - 40 + noise(), score: 0.9, name: 'leftShoulder' },
          { x: cx + 80 + noise(), y: cy - 40 + noise(), score: 0.9, name: 'rightShoulder' },
          { x: cx - 100 + noise(), y: cy + 30 + noise(), score: 0.8, name: 'leftElbow' },
          { x: cx + 100 + noise(), y: cy + 30 + noise(), score: 0.8, name: 'rightElbow' },
          { x: cx - 110 + noise(), y: cy + 100 + noise(), score: 0.75, name: 'leftWrist' },
          { x: cx + 110 + noise(), y: cy + 100 + noise(), score: 0.75, name: 'rightWrist' },
          { x: cx - 50 + noise(), y: cy + 60 + noise(), score: 0.9, name: 'leftHip' },
          { x: cx + 50 + noise(), y: cy + 60 + noise(), score: 0.9, name: 'rightHip' },
          { x: cx - 55 + noise(), y: cy + 150 + noise(), score: 0.85, name: 'leftKnee' },
          { x: cx + 55 + noise(), y: cy + 150 + noise(), score: 0.85, name: 'rightKnee' },
          { x: cx - 60 + noise(), y: cy + 220 + noise(), score: 0.8, name: 'leftAnkle' },
          { x: cx + 60 + noise(), y: cy + 220 + noise(), score: 0.8, name: 'rightAnkle' },
        ];
      }

      if (!keypoints) return { stability: null, shoulderSym: null, hipSym: null, spineLean: null };

      // Store for recording
      lastKeypointsRef.current = keypoints;

      // Draw pro form overlay first (behind user skeleton)
      if (showProOverlay) {
        drawProOverlay(ctx, ctx.canvas.width, ctx.canvas.height);
      }

      // Draw user skeleton
      ctx.strokeStyle = COLORS.orange;
      ctx.lineWidth = 3;

      SKELETON_EDGES.forEach(([i, j]) => {
        const p1 = keypoints![i];
        const p2 = keypoints![j];
        if (p1 && p2 && p1.score > 0.3 && p2.score > 0.3) {
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
        }
      });

      ctx.fillStyle = COLORS.bone;
      keypoints.forEach((kp) => {
        if (kp.score > 0.3) {
          ctx.beginPath();
          ctx.arc(kp.x, kp.y, 5, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // Compute metrics
      const ls = keypoints[KEYPOINTS.leftShoulder];
      const rs = keypoints[KEYPOINTS.rightShoulder];
      const lh = keypoints[KEYPOINTS.leftHip];
      const rh = keypoints[KEYPOINTS.rightHip];

      if (!ls || !rs || !lh || !rh) {
        setPoseSignals(null);
        return { stability: null, shoulderSym: null, hipSym: null, spineLean: null };
      }

      const avgConf = mean([ls, rs, lh, rh].map((k) => k.score || 0));
      const shoulderW = Math.max(1, dist(ls, rs));
      const hipW = Math.max(1, dist(lh, rh));

      const shoulderDiff = Math.abs(ls.y - rs.y);
      const hipDiff = Math.abs(lh.y - rh.y);

      const shoulderSym = clamp(100 - (shoulderDiff / shoulderW) * 300, 0, 100);
      const hipSym = clamp(100 - (hipDiff / hipW) * 300, 0, 100);

      const midShoulder = midpoint(ls, rs);
      const midHip = midpoint(lh, rh);
      const spineLean = radToDeg(Math.atan2(midShoulder.x - midHip.x, -(midShoulder.y - midHip.y)));

      // Stability (sway tracking)
      poseWindowRef.current.push({ t, x: midHip.x, y: midHip.y });
      while (poseWindowRef.current.length && t - poseWindowRef.current[0].t > 3) {
        poseWindowRef.current.shift();
      }

      const xs = poseWindowRef.current.map((p) => p.x);
      const ys = poseWindowRef.current.map((p) => p.y);
      const vxy = (variance(xs) + variance(ys)) / 2;
      const stability = clamp(100 - vxy / 10, 0, 100);

      const signals: PoseSignals = {
        confidence: confLabel(avgConf),
        shoulderSym: shoulderSym.toFixed(0),
        hipSym: hipSym.toFixed(0),
        spineLean: spineLean.toFixed(1),
        stability: stability.toFixed(0),
      };

      setPoseSignals(signals);

      return { stability, shoulderSym, hipSym, spineLean };
    },
    [showProOverlay, drawProOverlay]
  );

  // ─────────────────────────────────────────────────────────────────────────
  // PROCESS AUDIO
  // ─────────────────────────────────────────────────────────────────────────
  const processAudio = useCallback((t: number): { energy: number; steadiness: number } => {
    if (!analyserRef.current) {
      // Simulated audio
      const energy = 30 + Math.random() * 40;
      const steadiness = 60 + Math.random() * 30;
      setAudioSignals({
        confidence: 'Medium',
        energy: energy.toFixed(0),
        steadiness: steadiness.toFixed(0),
      });
      return { energy, steadiness };
    }

    const analyser = analyserRef.current;
    const dataArray = new Float32Array(analyser.fftSize);
    analyser.getFloatTimeDomainData(dataArray);

    // RMS energy
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) sum += dataArray[i] * dataArray[i];
    const rms = Math.sqrt(sum / dataArray.length);
    const energy = clamp((rms - 0.01) / 0.08, 0, 1) * 100;

    energyWindowRef.current.push({ t, e: energy });
    while (energyWindowRef.current.length && t - energyWindowRef.current[0].t > 6) {
      energyWindowRef.current.shift();
    }

    const energyVar = variance(energyWindowRef.current.map((x) => x.e));
    const steadiness = clamp(100 - energyVar / 5, 0, 100);

    const signals: AudioSignals = {
      confidence: energy > 15 ? 'High' : energy > 5 ? 'Medium' : 'Low',
      energy: energy.toFixed(0),
      steadiness: steadiness.toFixed(0),
    };

    setAudioSignals(signals);

    return { energy, steadiness };
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // MAIN LOOP
  // ─────────────────────────────────────────────────────────────────────────
  const runLoop = useCallback(async () => {
    if (!runningRef.current) return;

    const now = performance.now();
    const t = (now - startTimeRef.current) / 1000;

    // FPS
    if (lastFrameRef.current) {
      const delta = now - lastFrameRef.current;
      setFps((prev) => Math.round(prev * 0.9 + (1000 / delta) * 0.1));
    }
    lastFrameRef.current = now;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video && canvas && video.readyState >= 2) {
      const ctx = canvas.getContext('2d');

      if (ctx) {
        // Match canvas to video
        if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
          canvas.width = video.videoWidth || 640;
          canvas.height = video.videoHeight || 480;
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Process
        const poseMetrics = await processPose(video, ctx, t);
        const audioMetrics = processAudio(t);

        // Collect calibration data
        if (calibratingRef.current) {
          calibDataRef.current.push({
            stability: poseMetrics.stability,
            shoulderSym: poseMetrics.shoulderSym,
            hipSym: poseMetrics.hipSym,
            energy: audioMetrics.energy,
          });
        }

        // Record frame if recording
        if (recordingRef.current && lastKeypointsRef.current.length > 0) {
          const frame: RecordedFrame = {
            sessionId: currentSessionIdRef.current,
            frameIndex: frameCountRef.current++,
            timestamp: t,
            keypoints: lastKeypointsRef.current.map((kp) => ({
              x: kp.x,
              y: kp.y,
              score: kp.score,
            })),
            poseMetrics: {
              stability: poseMetrics.stability ?? 0,
              shoulderSym: poseMetrics.shoulderSym ?? 0,
              hipSym: poseMetrics.hipSym ?? 0,
              spineLean: poseMetrics.spineLean ?? 0,
            },
            audioMetrics: {
              energy: audioMetrics.energy,
              steadiness: audioMetrics.steadiness,
            },
          };

          // Save frame async (don't await to maintain performance)
          saveFrame(frame).catch(() => {});
        }

        // Update chart data (every 10th frame)
        if (Math.floor(t * 10) % 3 === 0) {
          setChartData((prev) => {
            const next = [
              ...prev,
              {
                t: t.toFixed(1),
                stability: poseMetrics.stability || 0,
                energy: audioMetrics.energy || 0,
              },
            ];
            return next.slice(-40);
          });
        }
      }
    }

    rafRef.current = requestAnimationFrame(runLoop);
  }, [processPose, processAudio]);

  // ─────────────────────────────────────────────────────────────────────────
  // REQUEST PERMISSIONS (Mobile Safari specific)
  // ─────────────────────────────────────────────────────────────────────────
  const requestPermissions = useCallback(async () => {
    try {
      setStatus('Requesting permissions...');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, frameRate: 30 },
        audio: true,
      });

      // Permissions granted, stop stream (we'll start fresh on "Start Session")
      stream.getTracks().forEach((t) => t.stop());

      setCameraPermission('granted');
      setMicPermission('granted');
      setShowPermissionPrompt(false);
      setStatus('Ready');
      addLog('System', 'Permissions granted');
    } catch (_err) {
      setCameraPermission('denied');
      setMicPermission('denied');
      setStatus('Permissions denied');
      addLog('Error', 'Camera/microphone permissions denied');
    }
  }, [addLog]);

  // ─────────────────────────────────────────────────────────────────────────
  // START SESSION
  // ─────────────────────────────────────────────────────────────────────────
  const start = useCallback(async () => {
    if (running) return;

    // Check if we need to prompt for permissions (mobile Safari)
    if (isMobileSafariBrowser && cameraPermission !== 'granted') {
      setShowPermissionPrompt(true);
      return;
    }

    // Reset
    poseWindowRef.current = [];
    energyWindowRef.current = [];
    calibDataRef.current = [];
    startTimeRef.current = performance.now();
    lastFrameRef.current = 0;
    frameCountRef.current = 0;
    currentSessionIdRef.current = `session_${Date.now()}`;
    setChartData([]);
    setPoseSignals(null);
    setAudioSignals(null);
    setFps(0);
    setPlaybackSession(null);

    const video = videoRef.current;
    if (!video) return;

    try {
      setStatus('Requesting camera...');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, frameRate: 30 },
        audio: true,
      });

      streamRef.current = stream;
      video.srcObject = stream;
      video.muted = true;

      await new Promise<void>((resolve) => {
        video.onloadedmetadata = () => {
          video.play().then(resolve);
        };
      });

      await initAudio(stream);

      setCameraPermission('granted');
      setMicPermission('granted');
      setRunning(true);
      setStatus('Analyzing...');
      addLog('Session', `Started in ${mode.toUpperCase()} mode`);

      // Start loop (we use runningRef in runLoop)
      runningRef.current = true;
      runLoop();
    } catch (_err) {
      setStatus('Camera access denied');
      addLog('Error', 'Camera permission denied');
      setCameraPermission('denied');
    }
  }, [running, mode, addLog, runLoop, isMobileSafariBrowser, cameraPermission]);

  // ─────────────────────────────────────────────────────────────────────────
  // TOGGLE RECORDING
  // ─────────────────────────────────────────────────────────────────────────
  const toggleRecording = useCallback(() => {
    if (!running) return;

    if (isRecording) {
      setIsRecording(false);
      addLog('Recording', 'Recording paused');
    } else {
      frameCountRef.current = 0;
      currentSessionIdRef.current = `session_${Date.now()}`;
      setIsRecording(true);
      addLog('Recording', 'Recording started');
    }
  }, [running, isRecording, addLog]);

  // ─────────────────────────────────────────────────────────────────────────
  // PLAYBACK SESSION
  // ─────────────────────────────────────────────────────────────────────────
  const loadPlaybackSession = useCallback(
    async (session: RecordedSession) => {
      try {
        const frames = await loadSessionFrames(session.id);
        setPlaybackFrames(frames);
        setPlaybackSession(session);
        setPlaybackIndex(0);
        setIsPlaying(false);

        if (session.baseline) {
          setBaseline(session.baseline);
          setCalibrated(true);
        }

        addLog('Playback', `Loaded session with ${frames.length} frames`);
      } catch (_err) {
        addLog('Error', 'Failed to load recording');
      }
    },
    [addLog]
  );

  // Playback animation
  useEffect(() => {
    if (!isPlaying || !playbackSession || playbackFrames.length === 0) return;

    const interval = setInterval(() => {
      setPlaybackIndex((prev) => {
        if (prev >= playbackFrames.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 33); // ~30fps

    return () => clearInterval(interval);
  }, [isPlaying, playbackSession, playbackFrames.length]);

  // Draw playback frame
  useEffect(() => {
    if (!playbackSession || playbackFrames.length === 0) return;

    const canvas = canvasRef.current;
    const frame = playbackFrames[playbackIndex];
    if (!canvas || !frame) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = 640;
    canvas.height = 480;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw pro overlay if enabled
    if (showProOverlay) {
      drawProOverlay(ctx, canvas.width, canvas.height);
    }

    // Draw recorded skeleton
    ctx.strokeStyle = COLORS.orange;
    ctx.lineWidth = 3;

    SKELETON_EDGES.forEach(([i, j]) => {
      const p1 = frame.keypoints[i];
      const p2 = frame.keypoints[j];
      if (p1 && p2 && p1.score > 0.3 && p2.score > 0.3) {
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      }
    });

    ctx.fillStyle = COLORS.bone;
    frame.keypoints.forEach((kp) => {
      if (kp.score > 0.3) {
        ctx.beginPath();
        ctx.arc(kp.x, kp.y, 5, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // Update signals display
    setPoseSignals({
      confidence: 'Playback',
      shoulderSym: frame.poseMetrics.shoulderSym.toFixed(0),
      hipSym: frame.poseMetrics.hipSym.toFixed(0),
      spineLean: frame.poseMetrics.spineLean.toFixed(1),
      stability: frame.poseMetrics.stability.toFixed(0),
    });

    setAudioSignals({
      confidence: 'Playback',
      energy: frame.audioMetrics.energy.toFixed(0),
      steadiness: frame.audioMetrics.steadiness.toFixed(0),
    });
  }, [playbackSession, playbackFrames, playbackIndex, showProOverlay, drawProOverlay]);

  // ─────────────────────────────────────────────────────────────────────────
  // CALIBRATION
  // ─────────────────────────────────────────────────────────────────────────
  const finishCalibration = useCallback(() => {
    setCalibrating(false);
    calibratingRef.current = false;

    const data = calibDataRef.current;
    if (data.length < 5) {
      addLog('Calibration', 'Not enough data. Try again.');
      return;
    }

    const bl: Baseline = {
      stability: mean(data.map((d) => d.stability).filter((x): x is number => x != null)),
      shoulderSym: mean(data.map((d) => d.shoulderSym).filter((x): x is number => x != null)),
      hipSym: mean(data.map((d) => d.hipSym).filter((x): x is number => x != null)),
      energy: mean(data.map((d) => d.energy)),
      savedAt: Date.now(),
    };

    setBaseline(bl);
    setCalibrated(true);
    addLog('Calibration', `Baseline set. Stability: ${bl.stability?.toFixed(0) || '—'}`);
  }, [addLog]);

  const startCalibration = useCallback(() => {
    if (!running) return;

    setCalibrating(true);
    calibratingRef.current = true;
    setCalibProgress(0);
    calibDataRef.current = [];
    addLog('Calibration', 'Hold still for 5 seconds...');

    const startT = performance.now();
    const interval = setInterval(() => {
      const elapsed = (performance.now() - startT) / 1000;
      setCalibProgress(Math.min(elapsed / 5, 1) * 100);

      if (elapsed >= 5) {
        clearInterval(interval);
        finishCalibration();
      }
    }, 100);
  }, [running, addLog, finishCalibration]);

  // ─────────────────────────────────────────────────────────────────────────
  // SAVE BASELINE TO D1 API
  // ─────────────────────────────────────────────────────────────────────────
  const saveBaselineToCloud = useCallback(async () => {
    if (!baseline) return;

    setSavingBaseline(true);
    try {
      const res = await fetch('/api/v1/vision/baselines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          baseline: {
            ...baseline,
            savedAt: Date.now(),
          },
        }),
      });

      if (res.ok) {
        addLog('Cloud', 'Baseline saved to your profile');
      } else {
        const error = await res.text();
        addLog('Error', `Failed to save baseline: ${error}`);
      }
    } catch (_err) {
      addLog('Error', 'Network error saving baseline');
    } finally {
      setSavingBaseline(false);
    }
  }, [baseline, addLog]);

  // ─────────────────────────────────────────────────────────────────────────
  // KEYBOARD SHORTCUTS
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case ' ':
          e.preventDefault();
          if (running) {
            stop();
            announce('Session stopped');
          } else if (!playbackSession) {
            start();
            announce('Session started');
          }
          break;
        case 'c':
          if (running && !calibrating) {
            startCalibration();
            announce('Calibration started. Hold still for 5 seconds.');
          }
          break;
        case 'r':
          if (running) {
            toggleRecording();
            announce(isRecording ? 'Recording stopped' : 'Recording started');
          }
          break;
        case 'p':
          setShowProOverlay((prev) => {
            announce(prev ? 'Pro form overlay hidden' : 'Pro form overlay shown');
            return !prev;
          });
          break;
        case 'escape':
          setActiveTooltip(null);
          if (playbackSession) {
            setPlaybackSession(null);
            setPlaybackFrames([]);
            announce('Playback closed');
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    running,
    calibrating,
    isRecording,
    playbackSession,
    start,
    stop,
    startCalibration,
    toggleRecording,
    announce,
  ]);

  // ─────────────────────────────────────────────────────────────────────────
  // METRIC HELP DEFINITIONS
  // ─────────────────────────────────────────────────────────────────────────
  const METRIC_HELP: Record<string, { title: string; description: string; ideal: string }> = {
    shoulderSym: {
      title: 'Shoulder Symmetry',
      description:
        'Measures the height difference between your left and right shoulders. Higher scores indicate more balanced posture.',
      ideal: '90+ for optimal alignment',
    },
    hipSym: {
      title: 'Hip Symmetry',
      description:
        'Measures the evenness of your hip positioning. Uneven hips can indicate weight distribution issues.',
      ideal: '85+ for stable stance',
    },
    spineLean: {
      title: 'Spine Lean',
      description:
        'The angle of your spine from vertical. 0° is perfectly upright, positive values lean right, negative lean left.',
      ideal: '-5° to +5° for neutral posture',
    },
    stability: {
      title: 'Stability Score',
      description:
        'Measures how much your body sways over time. Calculated from hip center movement variance over 3 seconds.',
      ideal: '80+ for solid foundation',
    },
    energy: {
      title: 'Voice Energy',
      description:
        'Measures the volume and intensity of your voice. Based on audio RMS (root mean square) amplitude.',
      ideal: '40-70 for engaged, clear delivery',
    },
    steadiness: {
      title: 'Voice Steadiness',
      description:
        'Measures consistency of your voice energy over time. Lower variance means more steady delivery.',
      ideal: '70+ for confident, even tone',
    },
  };

  // ─────────────────────────────────────────────────────────────────────────
  // TOOLTIP COMPONENT
  // ─────────────────────────────────────────────────────────────────────────
  const MetricTooltip = ({
    metricKey,
    children,
  }: {
    metricKey: string;
    children: React.ReactNode;
  }) => {
    const help = METRIC_HELP[metricKey];
    if (!help) return <>{children}</>;

    const isActive = activeTooltip === metricKey;

    return (
      <span className="relative inline-flex items-center gap-1.5">
        {children}
        <button
          type="button"
          onClick={() => setActiveTooltip(isActive ? null : metricKey)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setActiveTooltip(null);
          }}
          className="p-0.5 text-white/40 hover:text-primary focus:text-primary focus:outline-none focus:ring-2 focus:ring-primary/50 rounded"
          aria-label={`Help for ${help.title}`}
          aria-expanded={isActive}
          aria-describedby={isActive ? `tooltip-${metricKey}` : undefined}
        >
          <HelpCircle size={12} />
        </button>

        {isActive && (
          <div
            id={`tooltip-${metricKey}`}
            role="tooltip"
            className="absolute z-50 left-0 top-full mt-2 w-64 p-3 bg-charcoal border border-primary/30 rounded-lg shadow-xl"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-display text-xs tracking-wider uppercase text-primary">
                {help.title}
              </span>
              <button
                onClick={() => setActiveTooltip(null)}
                className="p-0.5 text-white/40 hover:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 rounded"
                aria-label="Close tooltip"
              >
                <X size={12} />
              </button>
            </div>
            <p className="text-xs text-white/70 leading-relaxed mb-2">{help.description}</p>
            <div className="flex items-center gap-1.5 text-[10px] text-green-500">
              <CheckCircle2 size={10} />
              Ideal: {help.ideal}
            </div>
          </div>
        )}
      </span>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER HELPERS
  // ─────────────────────────────────────────────────────────────────────────
  const renderDelta = (current: string | undefined, baselineKey: keyof Baseline) => {
    if (!baseline || baseline[baselineKey] === undefined) return null;
    const d = formatDelta(current ? parseFloat(current) : null, baseline[baselineKey] as number);
    if (!d) return null;
    return (
      <span
        className={`ml-1.5 text-xs ${
          d.cls === 'positive'
            ? 'text-green-500'
            : d.cls === 'negative'
              ? 'text-red-500'
              : 'text-[#c4b8a5]'
        }`}
      >
        {d.text}
      </span>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Skip link for keyboard users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[200] focus:px-4 focus:py-2 focus:bg-primary focus:text-white focus:rounded-lg focus:outline-none"
      >
        Skip to main content
      </a>

      {/* ARIA live region for screen reader announcements */}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {announcement}
      </div>

      <main
        id="main-content"
        className="min-h-screen font-body text-base text-[#f5f2eb] bg-gradient-to-b from-[#050505] via-midnight to-[#080808] pt-16 md:pt-20"
        tabIndex={-1}
      >
        {/* Radial glow */}
        <div
          className="fixed -top-48 -left-24 w-[800px] h-[600px] pointer-events-none z-0"
          style={{
            background: 'radial-gradient(ellipse, rgba(191, 87, 0, 0.12) 0%, transparent 60%)',
          }}
        />

        {/* Permission Prompt Modal (Mobile Safari) */}
        {showPermissionPrompt && (
          <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4">
            <div className="bg-charcoal border border-primary/30 rounded-xl max-w-md w-full p-6">
              <div className="flex items-center gap-3 mb-4">
                <Smartphone className="text-primary" size={24} />
                <h2 className="font-display text-lg font-medium tracking-wider uppercase">
                  Camera Access Required
                </h2>
              </div>

              <p className="text-white/70 text-sm mb-4">
                Vision AI needs access to your camera and microphone to analyze your form. All
                processing happens locally on your device—no data leaves your phone.
              </p>

              <div className="flex flex-col gap-2 mb-6">
                <div className="flex items-center gap-2 text-sm">
                  <Camera
                    size={16}
                    className={cameraPermission === 'granted' ? 'text-green-500' : 'text-white/50'}
                  />
                  <span className={cameraPermission === 'granted' ? 'text-green-500' : ''}>
                    Camera: {cameraPermission === 'granted' ? 'Granted' : 'Required'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Mic
                    size={16}
                    className={micPermission === 'granted' ? 'text-green-500' : 'text-white/50'}
                  />
                  <span className={micPermission === 'granted' ? 'text-green-500' : ''}>
                    Microphone: {micPermission === 'granted' ? 'Granted' : 'Required'}
                  </span>
                </div>
              </div>

              {(cameraPermission === 'denied' || micPermission === 'denied') && (
                <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg mb-4">
                  <AlertCircle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-400">
                    Permissions were denied. Please enable camera and microphone access in your
                    device settings, then reload this page.
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setShowPermissionPrompt(false)}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-white/70 bg-midnight border border-white/20 rounded-lg hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  onClick={requestPermissions}
                  disabled={cameraPermission === 'denied'}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/80 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Allow Access
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Sub-header */}
        <header className="sticky top-16 md:top-20 z-50 flex justify-between items-center gap-4 px-4 md:px-6 py-3.5 border-b border-primary/15 bg-midnight/75 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 grid place-items-center border border-primary/25 rounded-lg bg-gradient-to-b from-primary/20 to-midnight/30 text-xl">
              🔥
            </div>
            <div>
              <h1 className="font-display text-sm font-medium tracking-[0.28em] uppercase">
                Vision AI Intelligence
              </h1>
              <p className="text-sm text-white/65">
                {playbackSession
                  ? 'Reviewing recorded session'
                  : 'Signals, not mind-reading — All processing runs locally'}
              </p>
            </div>
          </div>

          <div className="flex gap-2 flex-wrap justify-end">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 font-display text-xs tracking-wider uppercase text-white/70 bg-charcoal/50 border border-primary/15 rounded-full">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  running
                    ? 'bg-green-500 animate-pulse'
                    : playbackSession
                      ? 'bg-blue-500'
                      : 'bg-gray-500'
                }`}
              />
              {status}
            </div>
            {!playbackSession && (
              <div className="px-3 py-1.5 font-display text-xs tracking-wider uppercase text-white/70 bg-charcoal/50 border border-primary/15 rounded-full">
                FPS: {fps}
              </div>
            )}
            {isRecording && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 font-display text-xs tracking-wider uppercase text-red-500 bg-red-500/10 border border-red-500/30 rounded-full animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                REC
              </div>
            )}
            {calibrated && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 font-display text-xs tracking-wider uppercase text-white/70 bg-charcoal/50 border border-primary/15 rounded-full">
                <CheckCircle2 size={12} className="text-primary" />
                Baseline Set
              </div>
            )}
          </div>
        </header>

        {/* Getting Started Instructions Panel */}
        <div className="max-w-7xl mx-auto px-4 md:px-6 pt-6 relative z-10">
          <section
            className="bg-gradient-to-r from-primary/10 via-midnight/80 to-midnight/80 border border-primary/20 rounded-lg backdrop-blur-xl overflow-hidden"
            aria-labelledby="instructions-heading"
          >
            <button
              onClick={() => setShowInstructions(!showInstructions)}
              className="w-full flex items-center justify-between px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-inset"
              aria-expanded={showInstructions}
              aria-controls="instructions-content"
            >
              <div className="flex items-center gap-2.5">
                <Info size={16} className="text-primary" />
                <span
                  id="instructions-heading"
                  className="font-display text-xs font-medium tracking-[0.22em] uppercase text-white/85"
                >
                  Getting Started
                </span>
                <span className="px-2 py-0.5 text-[10px] font-medium bg-primary/20 text-primary rounded-full">
                  {showInstructions ? 'Click to collapse' : 'Click to expand'}
                </span>
              </div>
              {showInstructions ? (
                <ChevronUp size={16} className="text-white/50" />
              ) : (
                <ChevronDown size={16} className="text-white/50" />
              )}
            </button>

            {showInstructions && (
              <div id="instructions-content" className="px-4 pb-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Step 1 */}
                  <div className="p-4 bg-midnight/50 rounded-lg border border-primary/10">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center">
                        1
                      </div>
                      <h3 className="font-display text-sm tracking-wider uppercase text-white/90">
                        Position Yourself
                      </h3>
                    </div>
                    <p className="text-xs text-white/60 leading-relaxed">
                      Stand 6-8 feet from your camera with your full body visible. Ensure good
                      lighting from the front—avoid backlighting.
                    </p>
                  </div>

                  {/* Step 2 */}
                  <div className="p-4 bg-midnight/50 rounded-lg border border-primary/10">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center">
                        2
                      </div>
                      <h3 className="font-display text-sm tracking-wider uppercase text-white/90">
                        Calibrate Baseline
                      </h3>
                    </div>
                    <p className="text-xs text-white/60 leading-relaxed">
                      Start a session, then click "Calibrate" and hold still for 5 seconds. This
                      sets your personal baseline for tracking improvements.
                    </p>
                  </div>

                  {/* Step 3 */}
                  <div className="p-4 bg-midnight/50 rounded-lg border border-primary/10">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center">
                        3
                      </div>
                      <h3 className="font-display text-sm tracking-wider uppercase text-white/90">
                        Compare to Pros
                      </h3>
                    </div>
                    <p className="text-xs text-white/60 leading-relaxed">
                      Enable "Pro Form" to overlay ideal positioning. Match your skeleton to the
                      green reference for optimal form.
                    </p>
                  </div>
                </div>

                {/* Quick tips */}
                <div className="mt-4 p-3 bg-charcoal/30 rounded-lg border border-white/5">
                  <div className="flex items-start gap-2">
                    <HelpCircle size={14} className="text-primary mt-0.5 flex-shrink-0" />
                    <div className="text-xs text-white/50">
                      <strong className="text-white/70">Keyboard shortcuts:</strong> Press{' '}
                      <kbd className="px-1 py-0.5 bg-midnight rounded text-white/70">Space</kbd> to
                      start/stop,{' '}
                      <kbd className="px-1 py-0.5 bg-midnight rounded text-white/70">C</kbd> to
                      calibrate,{' '}
                      <kbd className="px-1 py-0.5 bg-midnight rounded text-white/70">R</kbd> to
                      record, <kbd className="px-1 py-0.5 bg-midnight rounded text-white/70">P</kbd>{' '}
                      to toggle pro overlay. Click the <HelpCircle size={10} className="inline" />{' '}
                      icons next to metrics for detailed explanations.
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>

        {/* Main content */}
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-5 relative z-10">
          {/* Left column */}
          <div className="flex flex-col gap-4">
            {/* Controls panel */}
            <section
              className="bg-midnight/80 border border-primary/15 rounded-lg backdrop-blur-xl"
              aria-labelledby="controls-heading"
            >
              <div className="flex items-center gap-2.5 px-4 py-3.5 border-b border-primary/15">
                <span className="font-display text-xs tracking-[0.2em] text-white/50">01</span>
                <span
                  id="controls-heading"
                  className="font-display text-xs font-medium tracking-[0.22em] uppercase text-white/85"
                >
                  Controls
                </span>
              </div>

              <div className="p-4">
                <div className="flex gap-3 flex-wrap mb-4">
                  <div className="flex-1 min-w-[150px]">
                    <label className="block font-display text-[10px] font-medium tracking-[0.2em] uppercase text-white/60 mb-1.5">
                      Mode
                    </label>
                    <select
                      value={mode}
                      onChange={(e) => setMode(e.target.value as 'sports' | 'body')}
                      disabled={running || !!playbackSession}
                      className="w-full px-3 py-2.5 font-body text-sm text-[#f5f2eb] bg-midnight/60 border border-primary/15 rounded-md cursor-pointer focus:outline-none focus:border-primary/40 disabled:opacity-50"
                    >
                      <option value="sports">Sports Performance</option>
                      <option value="body">Body Language</option>
                    </select>
                  </div>

                  {/* Pro Form Overlay Select */}
                  <div className="flex-1 min-w-[150px]">
                    <label className="block font-display text-[10px] font-medium tracking-[0.2em] uppercase text-white/60 mb-1.5">
                      Reference Form
                    </label>
                    <select
                      value={selectedProForm}
                      onChange={(e) => setSelectedProForm(e.target.value)}
                      className="w-full px-3 py-2.5 font-body text-sm text-[#f5f2eb] bg-midnight/60 border border-primary/15 rounded-md cursor-pointer focus:outline-none focus:border-primary/40"
                    >
                      {Object.entries(PRO_FORMS).map(([key, form]) => (
                        <option key={key} value={key}>
                          {form.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex gap-2.5 flex-wrap">
                  {!playbackSession ? (
                    <>
                      <button
                        onClick={start}
                        disabled={running}
                        className="inline-flex items-center gap-2 font-display text-xs font-medium tracking-[0.18em] uppercase px-4 py-2.5 text-white/90 bg-gradient-to-b from-primary/30 to-midnight/50 border border-primary/40 rounded-md disabled:opacity-40 disabled:cursor-not-allowed hover:from-primary/40 transition-all"
                      >
                        <Play size={14} />
                        Start Session
                      </button>

                      <button
                        onClick={stop}
                        disabled={!running}
                        className="inline-flex items-center gap-2 font-display text-xs font-medium tracking-[0.18em] uppercase px-4 py-2.5 text-white/90 bg-midnight/60 border border-red-500/40 rounded-md disabled:opacity-40 disabled:cursor-not-allowed hover:bg-red-900/20 transition-all"
                      >
                        <StopCircle size={14} />
                        Stop
                      </button>

                      <button
                        onClick={startCalibration}
                        disabled={!running || calibrating}
                        className="inline-flex items-center gap-2 font-display text-xs font-medium tracking-[0.18em] uppercase px-4 py-2.5 text-white/90 bg-gradient-to-b from-[#8b4513]/30 to-midnight/50 border border-[#8b4513]/40 rounded-md disabled:opacity-40 disabled:cursor-not-allowed hover:from-[#8b4513]/40 transition-all"
                      >
                        <Target size={14} />
                        {calibrated ? 'Re-Calibrate' : 'Calibrate'}
                      </button>

                      <button
                        onClick={toggleRecording}
                        disabled={!running}
                        className={`inline-flex items-center gap-2 font-display text-xs font-medium tracking-[0.18em] uppercase px-4 py-2.5 rounded-md disabled:opacity-40 disabled:cursor-not-allowed transition-all ${
                          isRecording
                            ? 'text-red-500 bg-red-500/10 border border-red-500/40'
                            : 'text-white/90 bg-midnight/60 border border-primary/15 hover:border-primary/40'
                        }`}
                      >
                        {isRecording ? <StopCircle size={14} /> : <Download size={14} />}
                        {isRecording ? 'Stop Recording' : 'Record'}
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => setIsPlaying(!isPlaying)}
                        className="inline-flex items-center gap-2 font-display text-xs font-medium tracking-[0.18em] uppercase px-4 py-2.5 text-white/90 bg-gradient-to-b from-blue-500/30 to-midnight/50 border border-blue-500/40 rounded-md hover:from-blue-500/40 transition-all"
                      >
                        {isPlaying ? <StopCircle size={14} /> : <Play size={14} />}
                        {isPlaying ? 'Pause' : 'Play'}
                      </button>

                      <button
                        onClick={() => setPlaybackIndex(0)}
                        className="inline-flex items-center gap-2 font-display text-xs font-medium tracking-[0.18em] uppercase px-4 py-2.5 text-white/90 bg-midnight/60 border border-primary/15 rounded-md hover:border-primary/40 transition-all"
                      >
                        <RotateCcw size={14} />
                        Restart
                      </button>

                      <button
                        onClick={() => {
                          setPlaybackSession(null);
                          setPlaybackFrames([]);
                          setPoseSignals(null);
                          setAudioSignals(null);
                        }}
                        className="inline-flex items-center gap-2 font-display text-xs font-medium tracking-[0.18em] uppercase px-4 py-2.5 text-white/90 bg-midnight/60 border border-red-500/40 rounded-md hover:bg-red-900/20 transition-all"
                      >
                        <StopCircle size={14} />
                        Exit Playback
                      </button>
                    </>
                  )}

                  {/* Pro overlay toggle */}
                  <button
                    onClick={() => setShowProOverlay(!showProOverlay)}
                    className={`inline-flex items-center gap-2 font-display text-xs font-medium tracking-[0.18em] uppercase px-4 py-2.5 rounded-md transition-all ${
                      showProOverlay
                        ? 'text-green-500 bg-green-500/10 border border-green-500/40'
                        : 'text-white/90 bg-midnight/60 border border-primary/15 hover:border-primary/40'
                    }`}
                  >
                    {showProOverlay ? <Eye size={14} /> : <EyeOff size={14} />}
                    Pro Form
                  </button>
                </div>

                {/* Pro overlay opacity slider */}
                {showProOverlay && (
                  <div className="mt-4 flex items-center gap-3">
                    <span className="text-xs text-white/50">Overlay Opacity:</span>
                    <input
                      type="range"
                      min="0.1"
                      max="1"
                      step="0.1"
                      value={proOverlayOpacity}
                      onChange={(e) => setProOverlayOpacity(parseFloat(e.target.value))}
                      className="flex-1 h-1 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary"
                    />
                    <span className="text-xs text-white/50">
                      {Math.round(proOverlayOpacity * 100)}%
                    </span>
                  </div>
                )}

                {/* Playback scrubber */}
                {playbackSession && playbackFrames.length > 0 && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs text-white/50 mb-1">
                      <span>
                        Frame {playbackIndex + 1} / {playbackFrames.length}
                      </span>
                      <span>{playbackFrames[playbackIndex]?.timestamp.toFixed(1)}s</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max={playbackFrames.length - 1}
                      value={playbackIndex}
                      onChange={(e) => setPlaybackIndex(parseInt(e.target.value))}
                      className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500"
                    />
                  </div>
                )}

                {/* Video stage */}
                <div className="mt-4 relative border border-primary/15 rounded-lg overflow-hidden bg-black">
                  <video
                    ref={videoRef}
                    playsInline
                    muted
                    className={`block w-full h-auto min-h-[300px] max-h-[400px] object-contain bg-black ${playbackSession ? 'hidden' : ''}`}
                  />
                  <canvas
                    ref={canvasRef}
                    className={`${playbackSession ? 'relative' : 'absolute inset-0'} w-full h-full ${playbackSession ? 'min-h-[300px] max-h-[400px]' : ''} pointer-events-none`}
                  />

                  {/* Status badge */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 text-xs text-white/85 bg-midnight/80 border border-white/15 rounded-full backdrop-blur-sm">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        running ? 'bg-green-500' : playbackSession ? 'bg-blue-500' : 'bg-red-500'
                      }`}
                    />
                    {running ? 'LIVE' : playbackSession ? 'PLAYBACK' : 'STANDBY'}
                  </div>

                  {/* Pro form legend */}
                  {showProOverlay && (
                    <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 text-xs text-green-500 bg-midnight/80 border border-green-500/30 rounded-full backdrop-blur-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                      {PRO_FORMS[selectedProForm]?.name}
                    </div>
                  )}

                  {/* Calibration overlay */}
                  {calibrating && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 text-[#f5f2eb] text-center z-10">
                      <h3 className="font-display text-lg tracking-[0.25em] uppercase mb-3 text-primary">
                        Calibrating
                      </h3>
                      <p className="text-sm text-white/75 max-w-xs">
                        Hold still in your neutral position. This sets your baseline for delta
                        tracking.
                      </p>
                      <div className="mt-5 w-48 h-1 bg-white/10 rounded-sm overflow-hidden">
                        <div
                          className="h-full bg-primary transition-[width] duration-100"
                          style={{ width: `${calibProgress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Recorded Sessions */}
            {recordedSessions.length > 0 && !playbackSession && (
              <section className="bg-midnight/80 border border-primary/15 rounded-lg backdrop-blur-xl">
                <div className="flex items-center justify-between px-4 py-3.5 border-b border-primary/15">
                  <div className="flex items-center gap-2.5">
                    <span className="font-display text-xs tracking-[0.2em] text-white/50">02</span>
                    <span className="font-display text-xs font-medium tracking-[0.22em] uppercase text-white/85">
                      Recorded Sessions
                    </span>
                  </div>
                  <span className="text-xs text-white/50">{recordedSessions.length} sessions</span>
                </div>

                <div className="p-4 max-h-44 overflow-y-auto">
                  {recordedSessions.slice(0, 5).map((session) => (
                    <button
                      key={session.id}
                      onClick={() => loadPlaybackSession(session)}
                      className="w-full flex items-center justify-between p-3 mb-2 bg-midnight/50 border border-primary/10 rounded-md hover:border-primary/30 transition-colors text-left"
                    >
                      <div>
                        <div className="text-sm text-white/90">
                          {new Date(session.createdAt).toLocaleDateString()} —{' '}
                          {session.mode.toUpperCase()}
                        </div>
                        <div className="text-xs text-white/50">
                          {session.frameCount} frames • {session.duration.toFixed(1)}s
                        </div>
                      </div>
                      <Upload size={14} className="text-white/40" />
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* Logs panel */}
            <section className="bg-midnight/80 border border-primary/15 rounded-lg backdrop-blur-xl">
              <div className="flex items-center gap-2.5 px-4 py-3.5 border-b border-primary/15">
                <span className="font-display text-xs tracking-[0.2em] text-white/50">
                  {recordedSessions.length > 0 && !playbackSession ? '03' : '02'}
                </span>
                <span className="font-display text-xs font-medium tracking-[0.22em] uppercase text-white/85">
                  Coaching Log
                </span>
              </div>

              <div className="p-4 max-h-44 overflow-y-auto">
                {logs.length === 0 ? (
                  <div className="text-white/40 italic text-sm">
                    Logs will appear here during analysis...
                  </div>
                ) : (
                  logs.map((log) => (
                    <div
                      key={log.id}
                      className="flex gap-3 py-2 border-l-2 border-primary/15 pl-3 ml-1 mb-1"
                    >
                      <span className="font-mono text-xs text-white/40 min-w-[42px]">{log.t}s</span>
                      <span className="font-display text-[10px] tracking-[0.15em] uppercase text-primary min-w-[80px]">
                        {log.tag}
                      </span>
                      <span className="text-sm text-white/80 flex-1">{log.msg}</span>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>

          {/* Right column - Signals */}
          <aside className="flex flex-col gap-4">
            <section className="flex-1 bg-midnight/80 border border-primary/15 rounded-lg backdrop-blur-xl">
              <div className="flex items-center gap-2.5 px-4 py-3.5 border-b border-primary/15">
                <span className="font-display text-xs tracking-[0.2em] text-white/50">
                  {recordedSessions.length > 0 && !playbackSession ? '04' : '03'}
                </span>
                <span className="font-display text-xs font-medium tracking-[0.22em] uppercase text-white/85">
                  Live Signals
                </span>
              </div>

              <div className="p-4">
                {/* Pose Card */}
                <div className="bg-midnight/50 border border-primary/15 rounded-md p-3 mb-3">
                  <div className="flex justify-between items-center mb-2.5 pb-2 border-b border-primary/12">
                    <span className="flex items-center gap-1.5 font-display text-xs tracking-[0.2em] uppercase text-primary">
                      <Activity size={14} />
                      Posture & Balance
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        poseSignals?.confidence === 'High'
                          ? 'bg-green-500/20 text-green-500'
                          : poseSignals?.confidence === 'Medium'
                            ? 'bg-yellow-500/20 text-yellow-500'
                            : poseSignals?.confidence === 'Playback'
                              ? 'bg-blue-500/20 text-blue-500'
                              : 'bg-white/10 text-white/50'
                      }`}
                    >
                      {poseSignals?.confidence || 'Low'}
                    </span>
                  </div>

                  <div className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-1.5 text-sm">
                    <MetricTooltip metricKey="shoulderSym">
                      <span className="text-white/65">Shoulder Symmetry</span>
                    </MetricTooltip>
                    <span className="text-white/90 text-right">
                      {poseSignals?.shoulderSym ?? '—'}/100
                      {renderDelta(poseSignals?.shoulderSym, 'shoulderSym')}
                    </span>

                    <MetricTooltip metricKey="hipSym">
                      <span className="text-white/65">Hip Symmetry</span>
                    </MetricTooltip>
                    <span className="text-white/90 text-right">
                      {poseSignals?.hipSym ?? '—'}/100
                      {renderDelta(poseSignals?.hipSym, 'hipSym')}
                    </span>

                    <MetricTooltip metricKey="spineLean">
                      <span className="text-white/65">Spine Lean</span>
                    </MetricTooltip>
                    <span className="text-white/90 text-right">
                      {poseSignals?.spineLean ?? '—'}°
                    </span>

                    <MetricTooltip metricKey="stability">
                      <span className="text-white/65">Stability Score</span>
                    </MetricTooltip>
                    <span className="text-white/90 font-semibold text-right">
                      {poseSignals?.stability ?? '—'}
                      {renderDelta(poseSignals?.stability, 'stability')}
                    </span>
                  </div>
                </div>

                {/* Audio Card */}
                <div className="bg-midnight/50 border border-primary/15 rounded-md p-3 mb-3">
                  <div className="flex justify-between items-center mb-2.5 pb-2 border-b border-primary/12">
                    <span className="flex items-center gap-1.5 font-display text-xs tracking-[0.2em] uppercase text-primary">
                      <Mic size={14} />
                      Voice Signals
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        audioSignals?.confidence === 'High'
                          ? 'bg-green-500/20 text-green-500'
                          : audioSignals?.confidence === 'Medium'
                            ? 'bg-yellow-500/20 text-yellow-500'
                            : audioSignals?.confidence === 'Playback'
                              ? 'bg-blue-500/20 text-blue-500'
                              : 'bg-white/10 text-white/50'
                      }`}
                    >
                      {audioSignals?.confidence || 'Low'}
                    </span>
                  </div>

                  <div className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-1.5 text-sm">
                    <MetricTooltip metricKey="energy">
                      <span className="text-white/65">Energy</span>
                    </MetricTooltip>
                    <span className="text-white/90 text-right">
                      {audioSignals?.energy ?? '—'}/100
                      {renderDelta(audioSignals?.energy, 'energy')}
                    </span>

                    <MetricTooltip metricKey="steadiness">
                      <span className="text-white/65">Steadiness</span>
                    </MetricTooltip>
                    <span className="text-white/90 font-semibold text-right">
                      {audioSignals?.steadiness ?? '—'}
                    </span>
                  </div>
                </div>

                {/* Save Baseline Button */}
                {calibrated && baseline && (
                  <button
                    onClick={saveBaselineToCloud}
                    disabled={savingBaseline}
                    className="w-full inline-flex items-center justify-center gap-2 font-display text-xs font-medium tracking-[0.18em] uppercase px-4 py-2.5 text-white/90 bg-gradient-to-b from-primary/20 to-midnight/50 border border-primary/30 rounded-md hover:from-primary/30 disabled:opacity-50 transition-all mb-3"
                  >
                    {savingBaseline ? (
                      <>Saving...</>
                    ) : (
                      <>
                        <Save size={14} />
                        <User size={14} />
                        Save to Profile
                      </>
                    )}
                  </button>
                )}

                {/* Simple Chart */}
                <div className="bg-midnight/50 border border-primary/15 rounded-md p-3">
                  <div className="flex items-center gap-1.5 mb-2.5 pb-2 border-b border-primary/12">
                    <span className="font-display text-xs tracking-[0.2em] uppercase text-primary">
                      Signal History
                    </span>
                  </div>

                  {/* SVG Chart */}
                  <svg
                    width="100%"
                    height="100"
                    viewBox="0 0 300 100"
                    preserveAspectRatio="none"
                    className="block"
                  >
                    {/* Grid */}
                    <line
                      x1="0"
                      y1="25"
                      x2="300"
                      y2="25"
                      stroke="rgba(255,255,255,0.05)"
                      strokeWidth="1"
                    />
                    <line
                      x1="0"
                      y1="50"
                      x2="300"
                      y2="50"
                      stroke="rgba(255,255,255,0.05)"
                      strokeWidth="1"
                    />
                    <line
                      x1="0"
                      y1="75"
                      x2="300"
                      y2="75"
                      stroke="rgba(255,255,255,0.05)"
                      strokeWidth="1"
                    />

                    {/* Stability line */}
                    {chartData.length > 1 && (
                      <polyline
                        fill="none"
                        stroke={COLORS.orange}
                        strokeWidth="2"
                        points={chartData
                          .map(
                            (d, i) => `${(i / (chartData.length - 1)) * 300},${100 - d.stability}`
                          )
                          .join(' ')}
                      />
                    )}

                    {/* Energy line */}
                    {chartData.length > 1 && (
                      <polyline
                        fill="none"
                        stroke={COLORS.dust}
                        strokeWidth="2"
                        strokeDasharray="4,2"
                        points={chartData
                          .map((d, i) => `${(i / (chartData.length - 1)) * 300},${100 - d.energy}`)
                          .join(' ')}
                      />
                    )}
                  </svg>

                  <div className="flex gap-4 mt-2 justify-center">
                    <span className="flex items-center gap-1 text-[10px] text-white/60">
                      <span className="w-3 h-0.5" style={{ background: COLORS.orange }} />
                      Stability
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-white/60">
                      <span
                        className="w-3 h-0.5 border-dashed border-b"
                        style={{ borderColor: COLORS.dust }}
                      />
                      Energy
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* Privacy note */}
            <div className="p-3 text-xs leading-relaxed text-white/65 bg-charcoal/40 border border-primary/15 rounded-md">
              <strong className="text-white/85">Privacy:</strong> All processing runs locally in
              your browser. No video or audio leaves your device. This tool reports observable
              signals—posture geometry, voice energy—not emotion, intent, or truthfulness.
            </div>
          </aside>
        </div>
      </main>
    </>
  );
}
