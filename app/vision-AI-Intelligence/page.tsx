'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, StopCircle, Target, Activity, Mic, CheckCircle2 } from 'lucide-react';

// TensorFlow.js type declarations for CDN loading
declare global {
  interface Window {
    tf: typeof import('@tensorflow/tfjs');
  }
}

// Load TensorFlow.js from CDN
const loadTensorFlow = (): Promise<typeof import('@tensorflow/tfjs')> => {
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
};

// ═══════════════════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════════════════
const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
const mean = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
const variance = (arr: number[]) => {
  if (arr.length < 2) return 0;
  const m = mean(arr);
  return mean(arr.map(x => (x - m) ** 2));
};
const dist = (a: { x: number; y: number }, b: { x: number; y: number }) =>
  Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
const midpoint = (a: { x: number; y: number }, b: { x: number; y: number }) =>
  ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
const radToDeg = (r: number) => r * 180 / Math.PI;

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
// MOVENET KEYPOINT INDICES
// ═══════════════════════════════════════════════════════════════════════════
const KEYPOINTS: Record<string, number> = {
  nose: 0, leftEye: 1, rightEye: 2, leftEar: 3, rightEar: 4,
  leftShoulder: 5, rightShoulder: 6, leftElbow: 7, rightElbow: 8,
  leftWrist: 9, rightWrist: 10, leftHip: 11, rightHip: 12,
  leftKnee: 13, rightKnee: 14, leftAnkle: 15, rightAnkle: 16
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

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════
export default function VisionAIIntelligencePage() {
  // State
  const [mode, setMode] = useState<'sports' | 'body'>('sports');
  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState('Initializing...');
  const [modelLoaded, setModelLoaded] = useState(false);
  const [fps, setFps] = useState(0);

  // Calibration
  const [calibrating, setCalibrating] = useState(false);
  const [calibrated, setCalibrated] = useState(false);
  const [calibProgress, setCalibProgress] = useState(0);
  const [baseline, setBaseline] = useState<Baseline | null>(null);

  // Metrics
  const [poseSignals, setPoseSignals] = useState<PoseSignals | null>(null);
  const [audioSignals, setAudioSignals] = useState<AudioSignals | null>(null);

  // History for charts
  const [chartData, setChartData] = useState<ChartPoint[]>([]);

  // Logs
  const [logs, setLogs] = useState<LogEntry[]>([]);

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

  // Running state ref for loop
  const runningRef = useRef(false);
  const calibratingRef = useRef(false);

  // Keep refs in sync with state
  useEffect(() => {
    runningRef.current = running;
  }, [running]);

  useEffect(() => {
    calibratingRef.current = calibrating;
  }, [calibrating]);

  // ─────────────────────────────────────────────────────────────────────────
  // LOGGING
  // ─────────────────────────────────────────────────────────────────────────
  const addLog = useCallback((tag: string, msg: string) => {
    const t = startTimeRef.current ? ((performance.now() - startTimeRef.current) / 1000).toFixed(1) : '0.0';
    setLogs(prev => [{ t, tag, msg, id: Date.now() }, ...prev].slice(0, 50));
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
      } catch (err) {
        console.error('Model load error:', err);
        setStatus('Model load failed - using simulated data');
        setModelLoaded(false);
        addLog('Error', 'Model failed to load. Using simulated signals.');
      }
    }

    loadModel();

    return () => { mounted = false; };
  }, [addLog]);

  // ─────────────────────────────────────────────────────────────────────────
  // STOP SESSION
  // ─────────────────────────────────────────────────────────────────────────
  const stop = useCallback(() => {
    setRunning(false);
    setCalibrating(false);

    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
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

    setStatus('Stopped');
    addLog('Session', 'Analysis stopped');
  }, [addLog]);

  // ─────────────────────────────────────────────────────────────────────────
  // INIT AUDIO
  // ─────────────────────────────────────────────────────────────────────────
  const initAudio = async (stream: MediaStream) => {
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioContextClass();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      const src = ctx.createMediaStreamSource(stream);
      src.connect(analyser);
      audioCtxRef.current = ctx;
      analyserRef.current = analyser;
    } catch (err) {
      console.warn('Audio init failed:', err);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // PROCESS POSE
  // ─────────────────────────────────────────────────────────────────────────
  const processPose = useCallback(async (
    video: HTMLVideoElement,
    ctx: CanvasRenderingContext2D,
    t: number
  ): Promise<{ stability: number | null; shoulderSym: number | null; hipSym: number | null }> => {
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
        const result = await modelRef.current.predict(input) as any;
        const data = await result.array() as number[][][][];
        input.dispose();
        result.dispose();

        // Extract keypoints [1, 1, 17, 3] -> [17, 3] (y, x, confidence)
        keypoints = data[0][0].map((kp, i) => ({
          y: kp[0] * video.videoHeight,
          x: kp[1] * video.videoWidth,
          score: kp[2],
          name: Object.keys(KEYPOINTS).find(k => KEYPOINTS[k] === i)
        }));
      } catch (err) {
        console.warn('Inference error:', err);
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

    if (!keypoints) return { stability: null, shoulderSym: null, hipSym: null };

    // Draw skeleton
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
    keypoints.forEach(kp => {
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
      return { stability: null, shoulderSym: null, hipSym: null };
    }

    const avgConf = mean([ls, rs, lh, rh].map(k => k.score || 0));
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

    const xs = poseWindowRef.current.map(p => p.x);
    const ys = poseWindowRef.current.map(p => p.y);
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

    return { stability, shoulderSym, hipSym };
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // PROCESS AUDIO
  // ─────────────────────────────────────────────────────────────────────────
  const processAudio = useCallback((t: number): { energy: number; steadiness: number } => {
    if (!analyserRef.current) {
      // Simulated audio
      const energy = 30 + Math.random() * 40;
      const steadiness = 60 + Math.random() * 30;
      setAudioSignals({ confidence: 'Medium', energy: energy.toFixed(0), steadiness: steadiness.toFixed(0) });
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

    const energyVar = variance(energyWindowRef.current.map(x => x.e));
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
      setFps(prev => Math.round(prev * 0.9 + (1000 / delta) * 0.1));
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

        // Update chart data (every 10th frame)
        if (Math.floor(t * 10) % 3 === 0) {
          setChartData(prev => {
            const next = [...prev, {
              t: t.toFixed(1),
              stability: poseMetrics.stability || 0,
              energy: audioMetrics.energy || 0,
            }];
            return next.slice(-40);
          });
        }
      }
    }

    rafRef.current = requestAnimationFrame(runLoop);
  }, [processPose, processAudio]);

  // ─────────────────────────────────────────────────────────────────────────
  // START SESSION
  // ─────────────────────────────────────────────────────────────────────────
  const start = useCallback(async () => {
    if (running) return;

    // Reset
    poseWindowRef.current = [];
    energyWindowRef.current = [];
    calibDataRef.current = [];
    startTimeRef.current = performance.now();
    lastFrameRef.current = 0;
    setChartData([]);
    setPoseSignals(null);
    setAudioSignals(null);
    setFps(0);

    const video = videoRef.current;
    if (!video) return;

    try {
      setStatus('Requesting camera...');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, frameRate: 30 },
        audio: true
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

      setRunning(true);
      setStatus('Analyzing...');
      addLog('Session', `Started in ${mode.toUpperCase()} mode`);

      // Start loop (we use runningRef in runLoop)
      runningRef.current = true;
      runLoop();
    } catch (err) {
      console.error('Camera error:', err);
      setStatus('Camera access denied');
      addLog('Error', 'Camera permission denied');
    }
  }, [running, mode, addLog, runLoop]);

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
      stability: mean(data.map(d => d.stability).filter((x): x is number => x != null)),
      shoulderSym: mean(data.map(d => d.shoulderSym).filter((x): x is number => x != null)),
      hipSym: mean(data.map(d => d.hipSym).filter((x): x is number => x != null)),
      energy: mean(data.map(d => d.energy)),
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
  // RENDER HELPERS
  // ─────────────────────────────────────────────────────────────────────────
  const renderDelta = (current: string | undefined, baselineKey: keyof Baseline) => {
    if (!baseline || baseline[baselineKey] === undefined) return null;
    const d = formatDelta(current ? parseFloat(current) : null, baseline[baselineKey]);
    if (!d) return null;
    return (
      <span className={`ml-1.5 text-xs ${
        d.cls === 'positive' ? 'text-green-500' :
        d.cls === 'negative' ? 'text-red-500' :
        'text-[#c4b8a5]'
      }`}>
        {d.text}
      </span>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <main id="main-content" className="min-h-screen font-body text-base text-[#f5f2eb] bg-gradient-to-b from-[#050505] via-midnight to-[#080808] pt-16 md:pt-20">
      {/* Radial glow */}
      <div className="fixed -top-48 -left-24 w-[800px] h-[600px] pointer-events-none z-0"
           style={{ background: 'radial-gradient(ellipse, rgba(191, 87, 0, 0.12) 0%, transparent 60%)' }} />

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
              Signals, not mind-reading — All processing runs locally
            </p>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap justify-end">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 font-display text-xs tracking-wider uppercase text-white/70 bg-charcoal/50 border border-primary/15 rounded-full">
            <span className={`w-1.5 h-1.5 rounded-full ${running ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} />
            {status}
          </div>
          <div className="px-3 py-1.5 font-display text-xs tracking-wider uppercase text-white/70 bg-charcoal/50 border border-primary/15 rounded-full">
            FPS: {fps}
          </div>
          {calibrated && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 font-display text-xs tracking-wider uppercase text-white/70 bg-charcoal/50 border border-primary/15 rounded-full">
              <CheckCircle2 size={12} className="text-primary" />
              Baseline Set
            </div>
          )}
        </div>
      </header>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-5 relative z-10">
        {/* Left column */}
        <div className="flex flex-col gap-4">

          {/* Controls panel */}
          <section className="bg-midnight/80 border border-primary/15 rounded-lg backdrop-blur-xl">
            <div className="flex items-center gap-2.5 px-4 py-3.5 border-b border-primary/15">
              <span className="font-display text-xs tracking-[0.2em] text-white/50">01</span>
              <span className="font-display text-xs font-medium tracking-[0.22em] uppercase text-white/85">Controls</span>
            </div>

            <div className="p-4">
              <div className="flex gap-3 flex-wrap mb-4">
                <div className="flex-1 min-w-[150px]">
                  <label className="block font-display text-[10px] font-medium tracking-[0.2em] uppercase text-white/60 mb-1.5">
                    Mode
                  </label>
                  <select
                    value={mode}
                    onChange={e => setMode(e.target.value as 'sports' | 'body')}
                    className="w-full px-3 py-2.5 font-body text-sm text-[#f5f2eb] bg-midnight/60 border border-primary/15 rounded-md cursor-pointer focus:outline-none focus:border-primary/40"
                  >
                    <option value="sports">Sports Performance</option>
                    <option value="body">Body Language</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2.5 flex-wrap">
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
                  {calibrated ? 'Re-Calibrate' : 'Calibrate Baseline'}
                </button>
              </div>

              {/* Video stage */}
              <div className="mt-4 relative border border-primary/15 rounded-lg overflow-hidden bg-black">
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  className="block w-full h-auto min-h-[300px] max-h-[400px] object-contain bg-black"
                />
                <canvas
                  ref={canvasRef}
                  className="absolute inset-0 w-full h-full pointer-events-none"
                />

                {/* Status badge */}
                <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 text-xs text-white/85 bg-midnight/80 border border-white/15 rounded-full backdrop-blur-sm">
                  <span className={`w-1.5 h-1.5 rounded-full ${running ? 'bg-green-500' : 'bg-red-500'}`} />
                  {running ? 'LIVE' : 'STANDBY'}
                </div>

                {/* Calibration overlay */}
                {calibrating && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 text-[#f5f2eb] text-center z-10">
                    <h3 className="font-display text-lg tracking-[0.25em] uppercase mb-3 text-primary">
                      Calibrating
                    </h3>
                    <p className="text-sm text-white/75 max-w-xs">
                      Hold still in your neutral position. This sets your baseline for delta tracking.
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

          {/* Logs panel */}
          <section className="bg-midnight/80 border border-primary/15 rounded-lg backdrop-blur-xl">
            <div className="flex items-center gap-2.5 px-4 py-3.5 border-b border-primary/15">
              <span className="font-display text-xs tracking-[0.2em] text-white/50">02</span>
              <span className="font-display text-xs font-medium tracking-[0.22em] uppercase text-white/85">Coaching Log</span>
            </div>

            <div className="p-4 max-h-44 overflow-y-auto">
              {logs.length === 0 ? (
                <div className="text-white/40 italic text-sm">
                  Logs will appear here during analysis...
                </div>
              ) : (
                logs.map(log => (
                  <div key={log.id} className="flex gap-3 py-2 border-l-2 border-primary/15 pl-3 ml-1 mb-1">
                    <span className="font-mono text-xs text-white/40 min-w-[42px]">
                      {log.t}s
                    </span>
                    <span className="font-display text-[10px] tracking-[0.15em] uppercase text-primary min-w-[80px]">
                      {log.tag}
                    </span>
                    <span className="text-sm text-white/80 flex-1">
                      {log.msg}
                    </span>
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
              <span className="font-display text-xs tracking-[0.2em] text-white/50">03</span>
              <span className="font-display text-xs font-medium tracking-[0.22em] uppercase text-white/85">Live Signals</span>
            </div>

            <div className="p-4">
              {/* Pose Card */}
              <div className="bg-midnight/50 border border-primary/15 rounded-md p-3 mb-3">
                <div className="flex justify-between items-center mb-2.5 pb-2 border-b border-primary/12">
                  <span className="flex items-center gap-1.5 font-display text-xs tracking-[0.2em] uppercase text-primary">
                    <Activity size={14} />
                    Posture & Balance
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    poseSignals?.confidence === 'High' ? 'bg-green-500/20 text-green-500' :
                    poseSignals?.confidence === 'Medium' ? 'bg-yellow-500/20 text-yellow-500' :
                    'bg-white/10 text-white/50'
                  }`}>
                    {poseSignals?.confidence || 'Low'}
                  </span>
                </div>

                <div className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-1.5 text-sm">
                  <span className="text-white/65">Shoulder Symmetry</span>
                  <span className="text-white/90 text-right">
                    {poseSignals?.shoulderSym ?? '—'}/100
                    {renderDelta(poseSignals?.shoulderSym, 'shoulderSym')}
                  </span>

                  <span className="text-white/65">Hip Symmetry</span>
                  <span className="text-white/90 text-right">
                    {poseSignals?.hipSym ?? '—'}/100
                    {renderDelta(poseSignals?.hipSym, 'hipSym')}
                  </span>

                  <span className="text-white/65">Spine Lean</span>
                  <span className="text-white/90 text-right">
                    {poseSignals?.spineLean ?? '—'}°
                  </span>

                  <span className="text-white/65">Stability Score</span>
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
                  <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    audioSignals?.confidence === 'High' ? 'bg-green-500/20 text-green-500' :
                    audioSignals?.confidence === 'Medium' ? 'bg-yellow-500/20 text-yellow-500' :
                    'bg-white/10 text-white/50'
                  }`}>
                    {audioSignals?.confidence || 'Low'}
                  </span>
                </div>

                <div className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-1.5 text-sm">
                  <span className="text-white/65">Energy</span>
                  <span className="text-white/90 text-right">
                    {audioSignals?.energy ?? '—'}/100
                    {renderDelta(audioSignals?.energy, 'energy')}
                  </span>

                  <span className="text-white/65">Steadiness</span>
                  <span className="text-white/90 font-semibold text-right">
                    {audioSignals?.steadiness ?? '—'}
                  </span>
                </div>
              </div>

              {/* Simple Chart */}
              <div className="bg-midnight/50 border border-primary/15 rounded-md p-3">
                <div className="flex items-center gap-1.5 mb-2.5 pb-2 border-b border-primary/12">
                  <span className="font-display text-xs tracking-[0.2em] uppercase text-primary">
                    Signal History
                  </span>
                </div>

                {/* SVG Chart */}
                <svg width="100%" height="100" viewBox="0 0 300 100" preserveAspectRatio="none" className="block">
                  {/* Grid */}
                  <line x1="0" y1="25" x2="300" y2="25" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                  <line x1="0" y1="50" x2="300" y2="50" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                  <line x1="0" y1="75" x2="300" y2="75" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />

                  {/* Stability line */}
                  {chartData.length > 1 && (
                    <polyline
                      fill="none"
                      stroke={COLORS.orange}
                      strokeWidth="2"
                      points={chartData.map((d, i) => `${(i / (chartData.length - 1)) * 300},${100 - d.stability}`).join(' ')}
                    />
                  )}

                  {/* Energy line */}
                  {chartData.length > 1 && (
                    <polyline
                      fill="none"
                      stroke={COLORS.dust}
                      strokeWidth="2"
                      strokeDasharray="4,2"
                      points={chartData.map((d, i) => `${(i / (chartData.length - 1)) * 300},${100 - d.energy}`).join(' ')}
                    />
                  )}
                </svg>

                <div className="flex gap-4 mt-2 justify-center">
                  <span className="flex items-center gap-1 text-[10px] text-white/60">
                    <span className="w-3 h-0.5" style={{ background: COLORS.orange }} />
                    Stability
                  </span>
                  <span className="flex items-center gap-1 text-[10px] text-white/60">
                    <span className="w-3 h-0.5 border-dashed border-b" style={{ borderColor: COLORS.dust }} />
                    Energy
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Privacy note */}
          <div className="p-3 text-xs leading-relaxed text-white/65 bg-charcoal/40 border border-primary/15 rounded-md">
            <strong className="text-white/85">Privacy:</strong> All processing runs locally in your browser.
            No video or audio leaves your device. This tool reports observable signals—posture geometry, voice energy—not
            emotion, intent, or truthfulness.
          </div>
        </aside>
      </div>
    </main>
  );
}
