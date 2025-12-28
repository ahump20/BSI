'use client';

import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from 'react';
import Script from 'next/script';

// =============================================================================
// TYPES
// =============================================================================

type Mode = 'sports' | 'body';
type InputSource = 'camera' | 'upload';

interface PoseKeypoint {
  x: number;
  y: number;
  score?: number;
  name?: string;
}

interface Pose {
  keypoints: PoseKeypoint[];
  score?: number;
}

interface FaceKeypoint {
  x: number;
  y: number;
  z?: number;
  name?: string;
}

interface Face {
  keypoints: FaceKeypoint[];
  box?: { xMin: number; yMin: number; xMax: number; yMax: number };
}

interface PoseSignals {
  confidence: 'High' | 'Medium' | 'Low';
  shoulderSymScore: number;
  hipSymScore: number;
  spineLeanDeg: number;
  swayScore: number;
}

interface FaceSignals {
  confidence: 'High' | 'Medium' | 'Low';
  headRollDeg: number;
  headYawProxy: number;
  gazeStabilityScore: number;
  blinkPerMin: number;
}

interface AudioSignals {
  confidence: 'High' | 'Medium' | 'Low';
  energyScore: number;
  pitchHz: number | null;
  steadinessScore: number;
}

interface CalibrationBaseline {
  pose: PoseSignals | null;
  face: FaceSignals | null;
  audio: AudioSignals | null;
  timestamp: number;
}

interface TimelineShot {
  time: number;
  thumbnail: string;
  diffScore: number;
}

interface LogEntry {
  time: number;
  tag: string;
  message: string;
}

interface ChartDataPoint {
  time: number;
  balance: number;
  smoothness: number;
  vocal: number;
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

function clamp(val: number, min: number, max: number): number {
  return Math.min(Math.max(val, min), max);
}

function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x));
}

function mean(xs: number[]): number {
  if (xs.length === 0) return 0;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

function variance(xs: number[]): number {
  if (xs.length < 2) return 0;
  const m = mean(xs);
  return mean(xs.map((x) => (x - m) ** 2));
}

function dist(a: { x: number; y: number }, b: { x: number; y: number }): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function midpoint(
  a: { x: number; y: number },
  b: { x: number; y: number }
): { x: number; y: number } {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

function radToDeg(r: number): number {
  return (r * 180) / Math.PI;
}

function confidenceLabel(x: number): 'High' | 'Medium' | 'Low' {
  if (x >= 0.75) return 'High';
  if (x >= 0.5) return 'Medium';
  return 'Low';
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Audio helpers
function autoCorrelatePitch(buf: Float32Array, sampleRate: number): number {
  const rms = rootMeanSquare(buf);
  if (rms < 0.015) return 0;

  let bestOffset = -1;
  let bestCorr = 0;

  const minHz = 80;
  const maxHz = 300;
  const minOffset = Math.floor(sampleRate / maxHz);
  const maxOffset = Math.floor(sampleRate / minHz);

  for (let offset = minOffset; offset <= maxOffset; offset++) {
    let corr = 0;
    for (let i = 0; i < buf.length - offset; i++) {
      corr += buf[i] * buf[i + offset];
    }
    corr /= buf.length - offset;

    if (corr > bestCorr) {
      bestCorr = corr;
      bestOffset = offset;
    }
  }

  if (bestCorr < 0.02 || bestOffset === -1) return 0;
  return sampleRate / bestOffset;
}

function rootMeanSquare(buf: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < buf.length; i++) {
    sum += buf[i] * buf[i];
  }
  return Math.sqrt(sum / buf.length);
}

function roughCentroid(buf: Float32Array, sampleRate: number): number {
  let num = 0;
  let den = 0;
  for (let i = 1; i < buf.length; i++) {
    const d = Math.abs(buf[i] - buf[i - 1]);
    const f = (i / buf.length) * (sampleRate / 2);
    num += f * d;
    den += d;
  }
  return den ? num / den : 0;
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

declare global {
  interface Window {
    tf: any;
    poseDetection: any;
    faceLandmarksDetection: any;
    Chart: any;
  }
}

export default function VisionCoachClient() {
  // ---------------------------------------------------------------------------
  // STATE
  // ---------------------------------------------------------------------------
  const [scriptsLoaded, setScriptsLoaded] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [mode, setMode] = useState<Mode>('sports');
  const [inputSource, setInputSource] = useState<InputSource>('camera');
  const [isRunning, setIsRunning] = useState(false);
  const [statusMsg, setStatusMsg] = useState('Loading...');
  const [backendName, setBackendName] = useState('—');
  const [fps, setFps] = useState('—');

  // Calibration
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [calibrationProgress, setCalibrationProgress] = useState(0);
  const [baseline, setBaseline] = useState<CalibrationBaseline | null>(null);

  // Metrics
  const [poseSignals, setPoseSignals] = useState<PoseSignals | null>(null);
  const [faceSignals, setFaceSignals] = useState<FaceSignals | null>(null);
  const [audioSignals, setAudioSignals] = useState<AudioSignals | null>(null);

  // Deltas (vs baseline)
  const [poseDeltas, setPoseDeltas] = useState<Partial<PoseSignals> | null>(null);
  const [faceDeltas, setFaceDeltas] = useState<Partial<FaceSignals> | null>(null);
  const [audioDeltas, setAudioDeltas] = useState<Partial<AudioSignals> | null>(null);

  // Timeline & Logs
  const [timelineShots, setTimelineShots] = useState<TimelineShot[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([
    { time: 0, tag: 'System', message: 'Vision Coach v2 initialized.' },
  ]);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);

  // File handling
  const [fileReady, setFileReady] = useState(false);
  const [buildingTimeline, setBuildingTimeline] = useState(false);

  // ---------------------------------------------------------------------------
  // REFS
  // ---------------------------------------------------------------------------
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstanceRef = useRef<any>(null);

  const poseDetectorRef = useRef<any>(null);
  const faceDetectorRef = useRef<any>(null);

  const mediaStreamRef = useRef<MediaStream | null>(null);
  const objectUrlRef = useRef<string>('');

  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const timeDomainRef = useRef<Float32Array | null>(null);
  const sampleRateRef = useRef<number>(48000);

  // Rolling windows for smoothing
  const poseWindowRef = useRef<
    Array<{
      t: number;
      midHip: { x: number; y: number };
      midShoulder: { x: number; y: number };
      shoulderSym: number;
      hipSym: number;
      spineDeg: number;
    }>
  >([]);
  const energyWindowRef = useRef<Array<{ t: number; e: number }>>([]);
  const yawWindowRef = useRef<Array<{ t: number; yaw: number }>>([]);
  const centroidWindowRef = useRef<Array<{ t: number; c: number }>>([]);

  // Calibration collection
  const calibrationSamplesRef = useRef<{
    pose: PoseSignals[];
    face: FaceSignals[];
    audio: AudioSignals[];
  }>({ pose: [], face: [], audio: [] });

  // Blink tracking
  const blinkCountRef = useRef(0);
  const lastBlinkAtRef = useRef(0);

  // Timing
  const startedAtRef = useRef<number>(0);
  const lastFrameAtRef = useRef<number>(0);
  const lastInferAtRef = useRef<number>(0);
  const animationFrameRef = useRef<number>(0);

  // ---------------------------------------------------------------------------
  // LOGGING
  // ---------------------------------------------------------------------------
  const addLog = useCallback((tag: string, message: string) => {
    const time = (performance.now() - startedAtRef.current) / 1000;
    setLogs((prev) => [{ time, tag, message }, ...prev].slice(0, 100));
  }, []);

  // ---------------------------------------------------------------------------
  // SCRIPT LOADING
  // ---------------------------------------------------------------------------
  const scriptUrls = useMemo(
    () => [
      'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-core@4.10.0/dist/tf-core.min.js',
      'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-converter@4.10.0/dist/tf-converter.min.js',
      'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-webgl@4.10.0/dist/tf-backend-webgl.min.js',
      'https://cdn.jsdelivr.net/npm/@tensorflow-models/pose-detection@2.1.0/dist/pose-detection.min.js',
      'https://cdn.jsdelivr.net/npm/@tensorflow-models/face-landmarks-detection@1.0.5/dist/face-landmarks-detection.min.js',
      'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js',
    ],
    []
  );

  const [loadedScripts, setLoadedScripts] = useState<number>(0);

  const handleScriptLoad = useCallback(() => {
    setLoadedScripts((prev) => {
      const newCount = prev + 1;
      if (newCount >= scriptUrls.length) {
        setScriptsLoaded(true);
      }
      return newCount;
    });
  }, [scriptUrls.length]);

  // ---------------------------------------------------------------------------
  // MODEL INITIALIZATION
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!scriptsLoaded) return;

    let alive = true;

    const initModels = async () => {
      setStatusMsg('Initializing TensorFlow...');

      try {
        const tf = window.tf;
        await tf.setBackend('webgl');
        await tf.ready();

        if (!alive) return;
        setBackendName(tf.getBackend());

        setStatusMsg('Loading pose model...');
        poseDetectorRef.current = await window.poseDetection.createDetector(
          window.poseDetection.SupportedModels.MoveNet,
          {
            modelType: window.poseDetection.movenet.modelType.SINGLEPOSE_THUNDER,
            enableSmoothing: true,
          }
        );

        if (!alive) return;

        setStatusMsg('Loading face model...');
        faceDetectorRef.current =
          await window.faceLandmarksDetection.createDetector(
            window.faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh,
            { runtime: 'tfjs', refineLandmarks: true, maxFaces: 1 }
          );

        if (!alive) return;

        setModelsLoaded(true);
        setStatusMsg('Ready');
        addLog('System', 'TensorFlow models loaded successfully.');
      } catch (err) {
        console.error('Model loading error:', err);
        setStatusMsg('Model load failed');
        addLog('Error', 'Failed to load TensorFlow models.');
      }
    };

    initModels();

    return () => {
      alive = false;
    };
  }, [scriptsLoaded, addLog]);

  // ---------------------------------------------------------------------------
  // CHART INITIALIZATION
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!scriptsLoaded || !chartCanvasRef.current || chartInstanceRef.current) return;

    const ctx = chartCanvasRef.current.getContext('2d');
    if (!ctx || !window.Chart) return;

    chartInstanceRef.current = new window.Chart(ctx, {
      type: 'line',
      data: {
        labels: [],
        datasets: [
          {
            label: 'Balance',
            data: [],
            borderColor: '#bf5700',
            backgroundColor: 'rgba(191, 87, 0, 0.1)',
            borderWidth: 2,
            pointRadius: 0,
            tension: 0.4,
            fill: true,
          },
          {
            label: 'Smoothness',
            data: [],
            borderColor: '#8b4513',
            backgroundColor: 'rgba(139, 69, 19, 0.1)',
            borderWidth: 2,
            pointRadius: 0,
            tension: 0.4,
            fill: true,
          },
          {
            label: 'Vocal',
            data: [],
            borderColor: '#c4b8a5',
            backgroundColor: 'rgba(196, 184, 165, 0.1)',
            borderWidth: 2,
            pointRadius: 0,
            tension: 0.4,
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        interaction: {
          intersect: false,
          mode: 'index',
        },
        scales: {
          x: {
            display: false,
          },
          y: {
            min: 0,
            max: 100,
            grid: {
              color: 'rgba(255, 255, 255, 0.05)',
            },
            ticks: {
              color: 'rgba(245, 242, 235, 0.5)',
            },
          },
        },
        plugins: {
          legend: {
            labels: {
              color: '#f5f2eb',
              font: { family: 'Oswald', size: 11 },
            },
          },
          tooltip: {
            backgroundColor: 'rgba(13, 13, 13, 0.9)',
            titleColor: '#f5f2eb',
            bodyColor: '#f5f2eb',
            borderColor: 'rgba(191, 87, 0, 0.3)',
            borderWidth: 1,
          },
        },
      },
    });

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
    };
  }, [scriptsLoaded]);

  // ---------------------------------------------------------------------------
  // AUDIO INITIALIZATION
  // ---------------------------------------------------------------------------
  const initAudioFromStream = useCallback(async (stream: MediaStream) => {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    const audioCtx = new AudioContext();
    audioCtxRef.current = audioCtx;
    sampleRateRef.current = audioCtx.sampleRate;

    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 2048;
    analyserRef.current = analyser;

    const src = audioCtx.createMediaStreamSource(stream);
    src.connect(analyser);

    timeDomainRef.current = new Float32Array(analyser.fftSize);
  }, []);

  // ---------------------------------------------------------------------------
  // CLEANUP
  // ---------------------------------------------------------------------------
  const stopAll = useCallback(() => {
    setIsRunning(false);
    setIsCalibrating(false);
    setStatusMsg('Stopped');

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }

    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => void 0);
      audioCtxRef.current = null;
      analyserRef.current = null;
      timeDomainRef.current = null;
    }

    const v = videoRef.current;
    if (v) {
      v.pause();
      v.srcObject = null;
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = '';
      }
    }
  }, []);

  useEffect(() => {
    return () => stopAll();
  }, [stopAll]);

  // ---------------------------------------------------------------------------
  // CAMERA / FILE START
  // ---------------------------------------------------------------------------
  const startCamera = useCallback(async () => {
    const v = videoRef.current;
    if (!v) return;

    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: 1280, height: 720, frameRate: 30 },
      audio: true,
    });

    mediaStreamRef.current = stream;
    v.muted = true;
    v.srcObject = stream;

    await initAudioFromStream(stream);
  }, [initAudioFromStream]);

  const startUpload = useCallback(async () => {
    const v = videoRef.current;
    if (!v) return;

    try {
      await v.play();
      const stream = (v as any).captureStream?.() as MediaStream | undefined;
      if (stream) await initAudioFromStream(stream);
      v.pause();
    } catch {
      // Audio might be unavailable
    }
  }, [initAudioFromStream]);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const v = videoRef.current;
    if (!file || !v) return;

    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
    }

    const url = URL.createObjectURL(file);
    objectUrlRef.current = url;
    v.srcObject = null;
    v.src = url;
    v.muted = true;

    setFileReady(true);
    setTimelineShots([]);
  }, []);

  // ---------------------------------------------------------------------------
  // CANVAS RESIZE
  // ---------------------------------------------------------------------------
  const resizeCanvas = useCallback(() => {
    const v = videoRef.current;
    const c = canvasRef.current;
    if (!v || !c) return;

    const w = v.videoWidth || 1280;
    const h = v.videoHeight || 720;
    c.width = w;
    c.height = h;
  }, []);

  // ---------------------------------------------------------------------------
  // TIME HELPERS
  // ---------------------------------------------------------------------------
  const nowSeconds = useCallback(() => {
    return (performance.now() - startedAtRef.current) / 1000;
  }, []);

  const trimWindow = useCallback(
    <T extends { t: number }>(arr: T[], seconds: number, t: number) => {
      while (arr.length && t - arr[0].t > seconds) arr.shift();
    },
    []
  );

  // ---------------------------------------------------------------------------
  // SIGNAL COMPUTATION
  // ---------------------------------------------------------------------------
  const computePoseSignals = useCallback(
    (pose: Pose, t: number): PoseSignals => {
      const kps = pose.keypoints;
      const byName = new Map<string, PoseKeypoint>();
      for (const kp of kps) {
        if (kp.name) byName.set(kp.name, kp);
      }

      const ls = byName.get('left_shoulder');
      const rs = byName.get('right_shoulder');
      const lh = byName.get('left_hip');
      const rh = byName.get('right_hip');

      const keyForConf = [ls, rs, lh, rh].filter(Boolean) as PoseKeypoint[];
      const confRaw = mean(keyForConf.map((x) => x.score ?? 0));
      const conf = confidenceLabel(confRaw);

      if (!ls || !rs || !lh || !rh) {
        return {
          confidence: 'Low',
          shoulderSymScore: 0,
          hipSymScore: 0,
          spineLeanDeg: 0,
          swayScore: 0,
        };
      }

      const shoulderWidth = Math.max(1e-6, dist(ls, rs));
      const hipWidth = Math.max(1e-6, dist(lh, rh));

      const shoulderSym = Math.abs(ls.y - rs.y) / shoulderWidth;
      const hipSym = Math.abs(lh.y - rh.y) / hipWidth;

      const midShoulder = midpoint(ls, rs);
      const midHip = midpoint(lh, rh);

      const dx = midShoulder.x - midHip.x;
      const dy = midShoulder.y - midHip.y;
      const spineLeanDeg = radToDeg(Math.atan2(dx, -dy));

      poseWindowRef.current.push({
        t,
        midHip,
        midShoulder,
        shoulderSym,
        hipSym,
        spineDeg: spineLeanDeg,
      });
      trimWindow(poseWindowRef.current, 3.0, t);

      const xs = poseWindowRef.current.map((x) => x.midHip.x);
      const ys = poseWindowRef.current.map((x) => x.midHip.y);
      const vxy = (variance(xs) + variance(ys)) / 2;
      const swayScore = clamp01(1 - vxy / 900) * 100;

      const shoulderSymScore = clamp01(1 - shoulderSym * 1.6) * 100;
      const hipSymScore = clamp01(1 - hipSym * 1.6) * 100;

      return { confidence: conf, shoulderSymScore, hipSymScore, spineLeanDeg, swayScore };
    },
    [trimWindow]
  );

  const computeFaceSignals = useCallback(
    (face: Face, t: number): FaceSignals | null => {
      const pts = face.keypoints;

      const leftEyeOuter = pts[33];
      const leftEyeInner = pts[133];
      const rightEyeInner = pts[362];
      const rightEyeOuter = pts[263];
      const noseTip = pts[1];

      if (
        !leftEyeOuter ||
        !leftEyeInner ||
        !rightEyeInner ||
        !rightEyeOuter ||
        !noseTip
      )
        return null;

      const headRollDeg = radToDeg(
        Math.atan2(
          rightEyeOuter.y - leftEyeOuter.y,
          rightEyeOuter.x - leftEyeOuter.x
        )
      );

      const leftEyeCenter = midpoint(leftEyeOuter, leftEyeInner);
      const rightEyeCenter = midpoint(rightEyeOuter, rightEyeInner);

      const dL = dist(noseTip, leftEyeCenter);
      const dR = dist(noseTip, rightEyeCenter);

      const yaw = clamp01((dR - dL) / Math.max(1e-6, dR + dL)) * 200 - 100;

      yawWindowRef.current.push({ t, yaw });
      trimWindow(yawWindowRef.current, 3.0, t);

      const v = variance(yawWindowRef.current.map((x) => x.yaw));
      const gazeStabilityScore = clamp01(1 - v / 600) * 100;

      // Blink EAR proxy
      const a = pts[159];
      const b = pts[145];
      const c = pts[33];
      const d = pts[133];
      let ear = 0.3;
      if (a && b && c && d) {
        const vert = Math.abs(a.y - b.y);
        const horiz = Math.max(1e-6, Math.abs(c.x - d.x));
        ear = vert / horiz;
      }

      const blinkThresh = 0.16;
      const minGap = 0.18;
      const didBlink = ear < blinkThresh && t - lastBlinkAtRef.current > minGap;
      if (didBlink) {
        lastBlinkAtRef.current = t;
        blinkCountRef.current += 1;
      }

      const blinkPerMin = t > 0 ? (blinkCountRef.current / t) * 60 : 0;

      return {
        confidence: 'Medium',
        headRollDeg,
        headYawProxy: yaw,
        gazeStabilityScore,
        blinkPerMin,
      };
    },
    [trimWindow]
  );

  const computeAudioSignals = useCallback(
    (t: number): AudioSignals | null => {
      const analyser = analyserRef.current;
      const buf = timeDomainRef.current;
      if (!analyser || !buf) return null;

      analyser.getFloatTimeDomainData(buf);

      let sum = 0;
      for (let i = 0; i < buf.length; i++) {
        sum += buf[i] * buf[i];
      }
      const rms = Math.sqrt(sum / buf.length);
      const energyScore = clamp01((rms - 0.01) / 0.08) * 100;

      const sr = sampleRateRef.current;
      const pitchHz = autoCorrelatePitch(buf, sr);

      const c = roughCentroid(buf, sr);
      centroidWindowRef.current.push({ t, c });
      trimWindow(centroidWindowRef.current, 6.0, t);

      const v = variance(centroidWindowRef.current.map((x) => x.c));
      const steadinessScore = clamp01(1 - v / 400000) * 100;

      const confidence: 'High' | 'Medium' | 'Low' =
        energyScore < 12 ? 'Low' : energyScore < 25 ? 'Medium' : 'High';

      return { confidence, energyScore, pitchHz: pitchHz || null, steadinessScore };
    },
    [trimWindow]
  );

  // ---------------------------------------------------------------------------
  // DRAWING
  // ---------------------------------------------------------------------------
  const drawOverlay = useCallback((pose: Pose | null, face: Face | null) => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, c.width, c.height);

    // Draw pose skeleton
    if (pose?.keypoints?.length) {
      ctx.fillStyle = 'rgba(245, 242, 235, 0.85)';
      for (const kp of pose.keypoints) {
        if (!kp || (kp.score ?? 0) < 0.35) continue;
        ctx.beginPath();
        ctx.arc(kp.x, kp.y, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.strokeStyle = 'rgba(191, 87, 0, 0.85)';
      ctx.lineWidth = 3;

      const edges: Array<[string, string]> = [
        ['left_shoulder', 'right_shoulder'],
        ['left_hip', 'right_hip'],
        ['left_shoulder', 'left_elbow'],
        ['left_elbow', 'left_wrist'],
        ['right_shoulder', 'right_elbow'],
        ['right_elbow', 'right_wrist'],
        ['left_hip', 'left_knee'],
        ['left_knee', 'left_ankle'],
        ['right_hip', 'right_knee'],
        ['right_knee', 'right_ankle'],
        ['left_shoulder', 'left_hip'],
        ['right_shoulder', 'right_hip'],
        ['nose', 'left_eye'],
        ['nose', 'right_eye'],
        ['left_eye', 'left_ear'],
        ['right_eye', 'right_ear'],
      ];

      const byName = new Map<string, PoseKeypoint>();
      for (const kp of pose.keypoints) {
        if (kp.name) byName.set(kp.name, kp);
      }

      for (const [a, b] of edges) {
        const A = byName.get(a);
        const B = byName.get(b);
        if (!A || !B || (A.score ?? 0) < 0.35 || (B.score ?? 0) < 0.35) continue;
        ctx.beginPath();
        ctx.moveTo(A.x, A.y);
        ctx.lineTo(B.x, B.y);
        ctx.stroke();
      }
    }

    // Draw face mesh (sparse)
    if (face?.keypoints?.length) {
      ctx.fillStyle = 'rgba(139, 69, 19, 0.6)';
      for (let i = 0; i < face.keypoints.length; i += 6) {
        const p = face.keypoints[i];
        if (!p) continue;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }, []);

  // ---------------------------------------------------------------------------
  // CHART UPDATE
  // ---------------------------------------------------------------------------
  const updateChart = useCallback(
    (balance: number, smoothness: number, vocal: number) => {
      const chart = chartInstanceRef.current;
      if (!chart) return;

      const now = formatTime(nowSeconds());

      chart.data.labels.push(now);
      chart.data.datasets[0].data.push(balance);
      chart.data.datasets[1].data.push(smoothness);
      chart.data.datasets[2].data.push(vocal);

      if (chart.data.labels.length > 60) {
        chart.data.labels.shift();
        chart.data.datasets.forEach((d: any) => d.data.shift());
      }

      chart.update('none');
    },
    [nowSeconds]
  );

  // ---------------------------------------------------------------------------
  // DELTA COMPUTATION
  // ---------------------------------------------------------------------------
  const computeDeltas = useCallback(
    (
      current: { pose: PoseSignals | null; face: FaceSignals | null; audio: AudioSignals | null },
      base: CalibrationBaseline | null
    ) => {
      if (!base) {
        setPoseDeltas(null);
        setFaceDeltas(null);
        setAudioDeltas(null);
        return;
      }

      if (current.pose && base.pose) {
        setPoseDeltas({
          shoulderSymScore: current.pose.shoulderSymScore - base.pose.shoulderSymScore,
          hipSymScore: current.pose.hipSymScore - base.pose.hipSymScore,
          spineLeanDeg: current.pose.spineLeanDeg - base.pose.spineLeanDeg,
          swayScore: current.pose.swayScore - base.pose.swayScore,
        });
      }

      if (current.face && base.face) {
        setFaceDeltas({
          headRollDeg: current.face.headRollDeg - base.face.headRollDeg,
          headYawProxy: current.face.headYawProxy - base.face.headYawProxy,
          gazeStabilityScore: current.face.gazeStabilityScore - base.face.gazeStabilityScore,
        });
      }

      if (current.audio && base.audio) {
        setAudioDeltas({
          energyScore: current.audio.energyScore - base.audio.energyScore,
          steadinessScore: current.audio.steadinessScore - base.audio.steadinessScore,
        });
      }
    },
    []
  );

  // ---------------------------------------------------------------------------
  // MAIN ANALYSIS LOOP
  // ---------------------------------------------------------------------------
  const loop = useCallback(async () => {
    if (!isRunning) return;

    const now = performance.now();

    // FPS calculation
    if (lastFrameAtRef.current) {
      const inst = 1000 / (now - lastFrameAtRef.current);
      const currentFps = parseFloat(fps === '—' ? '0' : fps) || inst;
      const smoothed = currentFps * 0.9 + inst * 0.1;
      setFps(smoothed.toFixed(1));
    }
    lastFrameAtRef.current = now;

    // Inference throttle ~10Hz
    const doInfer = now - lastInferAtRef.current > 100;
    if (doInfer) {
      lastInferAtRef.current = now;

      const v = videoRef.current;
      if (v && v.readyState >= 2) {
        resizeCanvas();

        const t = nowSeconds();
        const poseDet = poseDetectorRef.current;
        const faceDet = faceDetectorRef.current;

        let poseRaw: Pose | null = null;
        let faceRaw: Face | null = null;

        try {
          const poses = await poseDet?.estimatePoses(v, {
            maxPoses: 1,
            flipHorizontal: false,
          });
          poseRaw = poses?.[0] ?? null;
        } catch {}

        try {
          const faces = await faceDet?.estimateFaces(v, {
            flipHorizontal: false,
          });
          faceRaw = faces?.[0] ?? null;
        } catch {}

        drawOverlay(poseRaw, faceRaw);

        // Compute signals
        const poseSig = poseRaw ? computePoseSignals(poseRaw, t) : null;
        const faceSig = faceRaw ? computeFaceSignals(faceRaw, t) : null;
        const audioSig = computeAudioSignals(t);

        setPoseSignals(poseSig);
        setFaceSignals(faceSig);
        setAudioSignals(audioSig);

        // Calibration collection
        if (isCalibrating) {
          if (poseSig) calibrationSamplesRef.current.pose.push(poseSig);
          if (faceSig) calibrationSamplesRef.current.face.push(faceSig);
          if (audioSig) calibrationSamplesRef.current.audio.push(audioSig);
        }

        // Compute deltas
        computeDeltas({ pose: poseSig, face: faceSig, audio: audioSig }, baseline);

        // Update chart
        const balance = poseSig?.swayScore ?? 0;
        const smoothness = poseSig?.shoulderSymScore ?? 0;
        const vocal = audioSig?.steadinessScore ?? 0;
        updateChart(balance, smoothness, vocal);

        // Status
        setStatusMsg(
          `Pose ${poseSig?.confidence ?? 'Low'} · Face ${faceSig?.confidence ?? 'Low'} · Audio ${audioSig?.confidence ?? 'Low'}`
        );

        // Coaching tips (occasional)
        if (Math.random() > 0.995 && poseSig) {
          if (Math.abs(poseSig.spineLeanDeg) > 12) {
            addLog('Coach', 'Significant spine lean detected. Center your stance.');
          }
          if (poseSig.swayScore < 50) {
            addLog('Coach', 'High sway detected. Ground your feet and stabilize.');
          }
        }
      }
    }

    animationFrameRef.current = requestAnimationFrame(loop);
  }, [
    isRunning,
    fps,
    isCalibrating,
    baseline,
    resizeCanvas,
    nowSeconds,
    drawOverlay,
    computePoseSignals,
    computeFaceSignals,
    computeAudioSignals,
    computeDeltas,
    updateChart,
    addLog,
  ]);

  // ---------------------------------------------------------------------------
  // START SESSION
  // ---------------------------------------------------------------------------
  const startSession = useCallback(async () => {
    if (isRunning) return;

    startedAtRef.current = performance.now();
    blinkCountRef.current = 0;
    lastBlinkAtRef.current = 0;
    poseWindowRef.current = [];
    energyWindowRef.current = [];
    yawWindowRef.current = [];
    centroidWindowRef.current = [];

    setPoseSignals(null);
    setFaceSignals(null);
    setAudioSignals(null);
    setFps('—');

    setIsRunning(true);
    setStatusMsg('Starting...');
    addLog('Session', `Started in ${mode} mode.`);

    try {
      if (inputSource === 'camera') {
        await startCamera();
      } else {
        await startUpload();
      }

      const v = videoRef.current;
      if (v) {
        await v.play().catch(() => void 0);
      }

      animationFrameRef.current = requestAnimationFrame(loop);
    } catch (err) {
      console.error('Start error:', err);
      setStatusMsg('Failed to start');
      setIsRunning(false);
    }
  }, [isRunning, mode, inputSource, startCamera, startUpload, loop, addLog]);

  // ---------------------------------------------------------------------------
  // CALIBRATION
  // ---------------------------------------------------------------------------
  const startCalibration = useCallback(() => {
    if (!isRunning) return;

    setIsCalibrating(true);
    setCalibrationProgress(0);
    calibrationSamplesRef.current = { pose: [], face: [], audio: [] };
    addLog('Calibration', 'Started 10-second baseline capture...');

    const duration = 10000; // 10 seconds
    const interval = 100;
    let elapsed = 0;

    const timer = setInterval(() => {
      elapsed += interval;
      setCalibrationProgress(Math.min(100, (elapsed / duration) * 100));

      if (elapsed >= duration) {
        clearInterval(timer);
        finishCalibration();
      }
    }, interval);
  }, [isRunning, addLog]);

  const finishCalibration = useCallback(() => {
    setIsCalibrating(false);
    setCalibrationProgress(0);

    const samples = calibrationSamplesRef.current;

    // Average the samples
    const avgPose: PoseSignals | null =
      samples.pose.length > 0
        ? {
            confidence: 'High',
            shoulderSymScore: mean(samples.pose.map((s) => s.shoulderSymScore)),
            hipSymScore: mean(samples.pose.map((s) => s.hipSymScore)),
            spineLeanDeg: mean(samples.pose.map((s) => s.spineLeanDeg)),
            swayScore: mean(samples.pose.map((s) => s.swayScore)),
          }
        : null;

    const avgFace: FaceSignals | null =
      samples.face.length > 0
        ? {
            confidence: 'Medium',
            headRollDeg: mean(samples.face.map((s) => s.headRollDeg)),
            headYawProxy: mean(samples.face.map((s) => s.headYawProxy)),
            gazeStabilityScore: mean(samples.face.map((s) => s.gazeStabilityScore)),
            blinkPerMin: mean(samples.face.map((s) => s.blinkPerMin)),
          }
        : null;

    const avgAudio: AudioSignals | null =
      samples.audio.length > 0
        ? {
            confidence: 'Medium',
            energyScore: mean(samples.audio.map((s) => s.energyScore)),
            pitchHz: mean(samples.audio.filter((s) => s.pitchHz).map((s) => s.pitchHz!)) || null,
            steadinessScore: mean(samples.audio.map((s) => s.steadinessScore)),
          }
        : null;

    setBaseline({
      pose: avgPose,
      face: avgFace,
      audio: avgAudio,
      timestamp: Date.now(),
    });

    addLog('Calibration', 'Baseline captured! Deltas will now show changes vs. baseline.');
  }, [addLog]);

  const clearBaseline = useCallback(() => {
    setBaseline(null);
    setPoseDeltas(null);
    setFaceDeltas(null);
    setAudioDeltas(null);
    addLog('Calibration', 'Baseline cleared.');
  }, [addLog]);

  // ---------------------------------------------------------------------------
  // TIMELINE BUILDER (SHOT DETECTION)
  // ---------------------------------------------------------------------------
  const buildTimeline = useCallback(async () => {
    if (inputSource !== 'upload' || !videoRef.current) return;

    const video = videoRef.current;
    const duration = video.duration;
    if (!duration || duration === Infinity) {
      addLog('Timeline', 'Video not ready or invalid duration.');
      return;
    }

    setBuildingTimeline(true);
    setTimelineShots([]);
    addLog('Timeline', 'Scanning video for scene changes...');

    const shots: TimelineShot[] = [];
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = 160;
    tempCanvas.height = 90;
    const ctx = tempCanvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) {
      setBuildingTimeline(false);
      return;
    }

    video.pause();
    const originalTime = video.currentTime;

    let prevData: Uint8ClampedArray | null = null;
    const scanInterval = 1.5; // seconds between samples
    const maxDuration = Math.min(duration, 120); // Cap at 2 minutes

    for (let t = 0; t < maxDuration; t += scanInterval) {
      video.currentTime = t;
      await new Promise<void>((resolve) => {
        const handler = () => {
          video.removeEventListener('seeked', handler);
          resolve();
        };
        video.addEventListener('seeked', handler);
      });

      ctx.drawImage(video, 0, 0, 160, 90);
      const imageData = ctx.getImageData(0, 0, 160, 90);
      const data = imageData.data;

      let diff = 0;
      if (prevData) {
        for (let i = 0; i < data.length; i += 4) {
          diff += Math.abs(data[i] - prevData[i]);
          diff += Math.abs(data[i + 1] - prevData[i + 1]);
          diff += Math.abs(data[i + 2] - prevData[i + 2]);
        }
        diff /= (data.length / 4) * 3;
      }

      // Scene change threshold
      if (!prevData || diff > 15) {
        shots.push({
          time: t,
          thumbnail: tempCanvas.toDataURL('image/jpeg', 0.6),
          diffScore: diff,
        });
      }

      prevData = new Uint8ClampedArray(data);
    }

    video.currentTime = originalTime;
    setTimelineShots(shots);
    setBuildingTimeline(false);
    addLog('Timeline', `Detected ${shots.length} keyframes.`);
  }, [inputSource, addLog]);

  // ---------------------------------------------------------------------------
  // JUMP TO TIME
  // ---------------------------------------------------------------------------
  const jumpToTime = useCallback((time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  }, []);

  // ---------------------------------------------------------------------------
  // PDF EXPORT
  // ---------------------------------------------------------------------------
  const exportPDF = useCallback(async () => {
    // Dynamic import jsPDF
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF();

    doc.setFillColor(13, 13, 13);
    doc.rect(0, 0, 210, 297, 'F');

    doc.setTextColor(245, 242, 235);
    doc.setFontSize(22);
    doc.text('BLAZE SPORTS INTEL', 20, 20);

    doc.setFontSize(12);
    doc.setTextColor(191, 87, 0);
    doc.text('VISION COACH V2 REPORT', 20, 28);

    doc.setTextColor(200, 200, 200);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 40);
    doc.text(`Mode: ${mode.toUpperCase()}`, 20, 46);

    doc.setDrawColor(191, 87, 0);
    doc.line(20, 55, 190, 55);

    doc.setFontSize(14);
    doc.text('Session Summary', 20, 65);

    doc.setFontSize(10);
    doc.text(`Balance Score: ${poseSignals?.swayScore?.toFixed(0) ?? '—'}/100`, 20, 75);
    doc.text(`Smoothness: ${poseSignals?.shoulderSymScore?.toFixed(0) ?? '—'}/100`, 20, 81);
    doc.text(`Vocal Steadiness: ${audioSignals?.steadinessScore?.toFixed(0) ?? '—'}/100`, 20, 87);

    if (baseline) {
      doc.text('Baseline Established: Yes', 20, 97);
    }

    doc.text('Session Logs:', 20, 115);
    let y = 125;
    logs.slice(0, 15).forEach((l) => {
      doc.text(`[${l.time.toFixed(1)}s] ${l.tag}: ${l.message}`, 20, y);
      y += 6;
    });

    // Chart image
    if (chartCanvasRef.current) {
      const img = chartCanvasRef.current.toDataURL('image/png');
      doc.addImage(img, 'PNG', 20, y + 10, 170, 70);
    }

    doc.save('Blaze_Vision_Report.pdf');
    addLog('Export', 'PDF report generated.');
  }, [mode, poseSignals, audioSignals, baseline, logs, addLog]);

  // ---------------------------------------------------------------------------
  // CAN START
  // ---------------------------------------------------------------------------
  const canStart = useMemo(() => {
    if (!modelsLoaded) return false;
    if (inputSource === 'camera') return true;
    return fileReady;
  }, [modelsLoaded, inputSource, fileReady]);

  // ---------------------------------------------------------------------------
  // RENDER HELPERS
  // ---------------------------------------------------------------------------
  const renderDelta = (val: number | undefined, suffix = '') => {
    if (val === undefined) return null;
    const sign = val >= 0 ? '+' : '';
    const color = val >= 0 ? 'text-green-400' : 'text-red-400';
    return (
      <span className={`text-xs ${color} ml-2`}>
        ({sign}{val.toFixed(1)}{suffix})
      </span>
    );
  };

  // ---------------------------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------------------------
  return (
    <>
      {/* Script Loading */}
      {scriptUrls.map((url, i) => (
        <Script key={i} src={url} strategy="afterInteractive" onLoad={handleScriptLoad} />
      ))}

      <div className="min-h-screen bg-bsi-midnight text-bsi-bone">
        {/* Film Grain Overlay */}
        <div
          className="fixed inset-0 pointer-events-none z-0 opacity-[0.12]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.75' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)' opacity='.55'/%3E%3C/svg%3E")`,
            animation: 'grain 7s steps(10) infinite',
          }}
        />

        {/* Header */}
        <header className="sticky top-0 z-50 flex justify-between items-center px-4 md:px-6 py-4 border-b border-bsi-orange/20 bg-bsi-midnight/80 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 border border-bsi-orange/30 rounded-lg flex items-center justify-center shadow-lg bg-gradient-to-b from-bsi-orange/20 to-bsi-midnight">
              <span className="text-xl">🔥</span>
            </div>
            <div>
              <h1 className="font-oswald tracking-[0.25em] text-sm uppercase text-white">
                Blaze Sports Intel
              </h1>
              <p className="text-bsi-bone/70 text-xs">
                Vision Coach v2 · Signals, not mind-reading
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex gap-2 items-center text-bsi-bone/60 text-xs font-oswald tracking-widest uppercase">
              <span>Mode</span>
              <div className="flex border border-bsi-orange/20 rounded-lg overflow-hidden bg-bsi-charcoal/40">
                <button
                  onClick={() => setMode('sports')}
                  className={`px-3 py-1.5 hover:text-white transition ${
                    mode === 'sports' ? 'bg-bsi-orange/20 text-white' : ''
                  }`}
                >
                  Sports
                </button>
                <div className="w-px bg-bsi-orange/20" />
                <button
                  onClick={() => setMode('body')}
                  className={`px-3 py-1.5 hover:text-white transition ${
                    mode === 'body' ? 'bg-bsi-orange/20 text-white' : ''
                  }`}
                >
                  Body Lang
                </button>
              </div>
            </div>

            <div className="hidden md:flex gap-2">
              <span className="px-3 py-1 bg-bsi-charcoal/50 border border-bsi-orange/10 rounded-full text-xs text-bsi-bone/60">
                {backendName}
              </span>
              <span className="px-3 py-1 bg-bsi-charcoal/50 border border-bsi-orange/10 rounded-full text-xs text-bsi-bone/60">
                FPS: {fps}
              </span>
            </div>
          </div>
        </header>

        <main className="max-w-[1400px] mx-auto w-full p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">
          {/* LEFT COLUMN */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            {/* Controls Panel */}
            <div className="glass-panel p-5 rounded-xl">
              <div className="flex flex-wrap gap-4 items-end justify-between">
                <div className="flex flex-wrap gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="font-oswald text-xs tracking-widest text-bsi-bone/60 uppercase">
                      Input Source
                    </label>
                    <select
                      className="bg-bsi-midnight/60 border border-bsi-orange/20 rounded px-3 py-2 text-sm focus:outline-none focus:border-bsi-orange"
                      value={inputSource}
                      onChange={(e) => {
                        stopAll();
                        setInputSource(e.target.value as InputSource);
                        setFileReady(false);
                        setTimelineShots([]);
                      }}
                    >
                      <option value="camera">Live Camera + Mic</option>
                      <option value="upload">Video Upload</option>
                    </select>
                  </div>

                  {inputSource === 'upload' && (
                    <div className="flex flex-col gap-1">
                      <label className="font-oswald text-xs tracking-widest text-bsi-bone/60 uppercase">
                        File
                      </label>
                      <input
                        type="file"
                        accept="video/*"
                        onChange={handleFileUpload}
                        className="text-xs text-bsi-bone/60 file:bg-bsi-charcoal file:text-bsi-bone file:border-0 file:rounded file:px-2 file:py-1"
                      />
                    </div>
                  )}
                </div>

                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={isRunning ? stopAll : startSession}
                    disabled={!canStart}
                    className={`font-oswald tracking-widest text-xs uppercase px-5 py-2.5 rounded-lg border transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${
                      isRunning
                        ? 'border-red-500/50 bg-red-900/20 text-red-200'
                        : 'border-bsi-orange/40 bg-bsi-orange/20 text-white hover:bg-bsi-orange/30'
                    }`}
                  >
                    {isRunning ? 'Stop' : 'Start Session'}
                  </button>

                  {isRunning && !isCalibrating && (
                    <button
                      onClick={startCalibration}
                      className="font-oswald tracking-widest text-xs uppercase px-4 py-2.5 rounded-lg border border-green-500/30 bg-green-900/20 text-green-200 hover:bg-green-900/30 transition"
                    >
                      Calibrate
                    </button>
                  )}

                  {baseline && (
                    <button
                      onClick={clearBaseline}
                      className="font-oswald tracking-widest text-xs uppercase px-4 py-2.5 rounded-lg border border-bsi-bone/10 bg-bsi-charcoal/50 text-bsi-bone/70 hover:text-white transition"
                    >
                      Clear Baseline
                    </button>
                  )}

                  {inputSource === 'upload' && fileReady && (
                    <button
                      onClick={buildTimeline}
                      disabled={buildingTimeline}
                      className="font-oswald tracking-widest text-xs uppercase px-4 py-2.5 rounded-lg border border-bsi-bone/10 bg-bsi-charcoal/50 text-bsi-bone/70 hover:text-white transition disabled:opacity-50"
                    >
                      {buildingTimeline ? 'Building...' : 'Build Timeline'}
                    </button>
                  )}

                  <button
                    onClick={exportPDF}
                    disabled={logs.length < 2}
                    className="p-2 border border-bsi-bone/10 rounded-lg text-bsi-bone/60 hover:text-white hover:border-bsi-bone/30 disabled:opacity-30 transition"
                    title="Export PDF Report"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Calibration Progress */}
              {isCalibrating && (
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-bsi-bone/70 mb-1">
                    <span>Calibrating baseline...</span>
                    <span>{calibrationProgress.toFixed(0)}%</span>
                  </div>
                  <div className="h-2 bg-bsi-charcoal rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 transition-all duration-100"
                      style={{ width: `${calibrationProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Video Stage */}
            <div className="glass-panel p-1 rounded-xl relative overflow-hidden bg-black aspect-video group">
              <video
                ref={videoRef}
                className="w-full h-full object-contain"
                playsInline
                muted
                crossOrigin="anonymous"
              />
              <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full pointer-events-none"
              />

              {/* Status Badge */}
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                <span className="bg-bsi-midnight/80 backdrop-blur border border-bsi-bone/10 px-3 py-1 rounded-full text-xs text-bsi-bone/80 flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isRunning ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                    }`}
                  />
                  {statusMsg}
                </span>
                {baseline && (
                  <span className="bg-green-900/60 backdrop-blur border border-green-500/30 px-3 py-1 rounded-full text-xs text-green-300">
                    Baseline Active
                  </span>
                )}
              </div>

              {/* Privacy Note */}
              <div className="absolute bottom-4 left-4 text-xs text-bsi-bone/50 max-w-md bg-black/60 p-2 rounded backdrop-blur-sm opacity-0 group-hover:opacity-100 transition duration-500">
                <strong>Privacy Note:</strong> Video processing happens entirely on-device (Edge
                Compute). No imagery is sent to the cloud.
              </div>
            </div>

            {/* Timeline */}
            <div className="glass-panel p-4 rounded-xl min-h-[140px]">
              <div className="flex justify-between items-end mb-3 border-b border-bsi-orange/10 pb-2">
                <h3 className="font-oswald text-xs tracking-[0.2em] text-bsi-bone/60 uppercase">
                  02. Shot / Scene Timeline
                </h3>
                <span className="text-[10px] text-bsi-bone/40 uppercase">
                  {timelineShots.length} Keyframes Detected
                </span>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {timelineShots.length === 0 ? (
                  <div className="w-full h-20 flex items-center justify-center text-bsi-bone/20 text-sm italic border border-dashed border-bsi-bone/10 rounded-lg">
                    {buildingTimeline
                      ? 'Scanning video for scene changes...'
                      : inputSource === 'upload'
                        ? 'Upload video and click "Build Timeline"'
                        : 'Timeline available in Upload Mode'}
                  </div>
                ) : (
                  timelineShots.map((shot, i) => (
                    <div
                      key={i}
                      className="flex-none w-32 group/shot cursor-pointer"
                      onClick={() => jumpToTime(shot.time)}
                    >
                      <div className="rounded-lg overflow-hidden border border-bsi-bone/10 group-hover/shot:border-bsi-orange/50 transition relative">
                        <img
                          src={shot.thumbnail}
                          alt={`Scene at ${formatTime(shot.time)}`}
                          className="w-full h-20 object-cover opacity-80 group-hover/shot:opacity-100"
                        />
                        <div className="absolute bottom-0 right-0 bg-black/80 text-[10px] px-1.5 py-0.5 text-white">
                          {formatTime(shot.time)}
                        </div>
                        {shot.diffScore > 0 && (
                          <div className="absolute top-0 left-0 bg-bsi-orange/80 text-[9px] px-1 py-0.5 text-white">
                            Δ{shot.diffScore.toFixed(0)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Logs */}
            <div className="glass-panel p-4 rounded-xl flex-1 max-h-[250px] overflow-y-auto">
              <h3 className="font-oswald text-xs tracking-[0.2em] text-bsi-bone/60 uppercase mb-3 border-b border-bsi-orange/10 pb-2">
                03. Coaching Log
              </h3>
              <div className="flex flex-col gap-2">
                {logs.map((l, i) => (
                  <div
                    key={i}
                    className="flex gap-3 text-sm border-l-2 border-bsi-bone/10 pl-3 py-1 hover:border-bsi-orange/50 transition"
                  >
                    <span className="font-mono text-bsi-bone/40 text-xs w-12">
                      {l.time.toFixed(1)}s
                    </span>
                    <span className="text-bsi-orange/80 font-oswald text-xs tracking-wider uppercase w-20">
                      {l.tag}
                    </span>
                    <span className="text-bsi-bone/80">{l.message}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            {/* Signals Dashboard */}
            <div className="glass-panel p-5 rounded-xl">
              <h3 className="font-oswald text-xs tracking-[0.2em] text-bsi-bone/60 uppercase mb-4 border-b border-bsi-orange/10 pb-2">
                04. Signals Dashboard
              </h3>

              <div className="grid grid-cols-1 gap-4">
                {/* Pose Card */}
                <div className="bg-bsi-charcoal/40 border border-bsi-bone/5 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-bsi-orange font-oswald text-xs tracking-widest uppercase">
                      Posture & Balance
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full ${
                        poseSignals?.confidence === 'High'
                          ? 'bg-green-900/30 text-green-400'
                          : 'bg-bsi-bone/10 text-bsi-bone/40'
                      }`}
                    >
                      {poseSignals?.confidence ?? 'Low'} Conf
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-y-2 text-sm">
                    <span className="text-bsi-bone/50">Shoulder Sym</span>
                    <span className="text-right tabular-nums text-bsi-bone/90">
                      {poseSignals?.shoulderSymScore?.toFixed(0) ?? '—'}%
                      {renderDelta(poseDeltas?.shoulderSymScore, '%')}
                    </span>
                    <span className="text-bsi-bone/50">Hip Sym</span>
                    <span className="text-right tabular-nums text-bsi-bone/90">
                      {poseSignals?.hipSymScore?.toFixed(0) ?? '—'}%
                      {renderDelta(poseDeltas?.hipSymScore, '%')}
                    </span>
                    <span className="text-bsi-bone/50">Spine Lean</span>
                    <span className="text-right tabular-nums text-bsi-bone/90">
                      {poseSignals?.spineLeanDeg?.toFixed(1) ?? '—'}°
                      {renderDelta(poseDeltas?.spineLeanDeg, '°')}
                    </span>
                    <span className="text-bsi-bone/50">Stability Score</span>
                    <span className="text-right tabular-nums text-white font-bold">
                      {poseSignals?.swayScore?.toFixed(0) ?? '—'}
                      {renderDelta(poseDeltas?.swayScore)}
                    </span>
                  </div>
                </div>

                {/* Face Card */}
                <div className="bg-bsi-charcoal/40 border border-bsi-bone/5 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-bsi-orange font-oswald text-xs tracking-widest uppercase">
                      Head & Gaze
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full ${
                        faceSignals?.confidence === 'High'
                          ? 'bg-green-900/30 text-green-400'
                          : faceSignals?.confidence === 'Medium'
                            ? 'bg-yellow-900/30 text-yellow-400'
                            : 'bg-bsi-bone/10 text-bsi-bone/40'
                      }`}
                    >
                      {faceSignals?.confidence ?? 'Low'} Conf
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-y-2 text-sm">
                    <span className="text-bsi-bone/50">Head Roll</span>
                    <span className="text-right tabular-nums text-bsi-bone/90">
                      {faceSignals?.headRollDeg?.toFixed(1) ?? '—'}°
                      {renderDelta(faceDeltas?.headRollDeg, '°')}
                    </span>
                    <span className="text-bsi-bone/50">Yaw (Est)</span>
                    <span className="text-right tabular-nums text-bsi-bone/90">
                      {faceSignals?.headYawProxy?.toFixed(0) ?? '—'}
                      {renderDelta(faceDeltas?.headYawProxy)}
                    </span>
                    <span className="text-bsi-bone/50">Gaze Stability</span>
                    <span className="text-right tabular-nums text-white font-bold">
                      {faceSignals?.gazeStabilityScore?.toFixed(0) ?? '—'}
                      {renderDelta(faceDeltas?.gazeStabilityScore)}
                    </span>
                    <span className="text-bsi-bone/50">Blink Rate</span>
                    <span className="text-right tabular-nums text-bsi-bone/90">
                      {faceSignals?.blinkPerMin?.toFixed(1) ?? '—'}/min
                    </span>
                  </div>
                </div>

                {/* Audio Card */}
                <div className="bg-bsi-charcoal/40 border border-bsi-bone/5 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-bsi-orange font-oswald text-xs tracking-widest uppercase">
                      Voice Signals
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full ${
                        audioSignals?.confidence === 'High'
                          ? 'bg-green-900/30 text-green-400'
                          : audioSignals?.confidence === 'Medium'
                            ? 'bg-yellow-900/30 text-yellow-400'
                            : 'bg-bsi-bone/10 text-bsi-bone/40'
                      }`}
                    >
                      {audioSignals?.confidence ?? 'Low'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-y-2 text-sm">
                    <span className="text-bsi-bone/50">Energy</span>
                    <span className="text-right tabular-nums text-bsi-bone/90">
                      {audioSignals?.energyScore?.toFixed(0) ?? '—'}
                      {renderDelta(audioDeltas?.energyScore)}
                    </span>
                    <span className="text-bsi-bone/50">Pitch (Est)</span>
                    <span className="text-right tabular-nums text-bsi-bone/90">
                      {audioSignals?.pitchHz ? `${audioSignals.pitchHz.toFixed(0)} Hz` : '—'}
                    </span>
                    <span className="text-bsi-bone/50">Steadiness</span>
                    <span className="text-right tabular-nums text-white font-bold">
                      {audioSignals?.steadinessScore?.toFixed(0) ?? '—'}
                      {renderDelta(audioDeltas?.steadinessScore)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Chart */}
            <div className="glass-panel p-5 rounded-xl flex-1 min-h-[250px] flex flex-col">
              <h3 className="font-oswald text-xs tracking-[0.2em] text-bsi-bone/60 uppercase mb-2">
                Signals over Time
              </h3>
              <div className="relative flex-1 w-full">
                <canvas ref={chartCanvasRef} />
              </div>
            </div>

            {/* Disclaimer */}
            <div className="border border-bsi-bone/10 bg-bsi-charcoal/30 p-4 rounded-xl">
              <h4 className="font-oswald text-xs text-bsi-bone/50 uppercase tracking-widest mb-1">
                Disclaimer
              </h4>
              <p className="text-[11px] text-bsi-bone/40 leading-relaxed">
                This engine reports observable signals (motion, posture geometry, head direction,
                audio energy). It does not diagnose emotion, intent, or truthfulness. Analysis is
                performed locally in your browser.
              </p>
            </div>
          </div>
        </main>
      </div>

      {/* Grain Animation Keyframes */}
      <style jsx global>{`
        @keyframes grain {
          0% { transform: translate(0, 0); }
          10% { transform: translate(-2%, -3%); }
          20% { transform: translate(-4%, 2%); }
          30% { transform: translate(3%, -2%); }
          40% { transform: translate(2%, 4%); }
          50% { transform: translate(-3%, 1%); }
          60% { transform: translate(4%, 0%); }
          70% { transform: translate(0%, 3%); }
          80% { transform: translate(-2%, 0%); }
          90% { transform: translate(2%, -3%); }
          100% { transform: translate(0, 0); }
        }

        .glass-panel {
          background: rgba(13, 13, 13, 0.78);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(191, 87, 0, 0.18);
          box-shadow: 0 18px 50px rgba(0, 0, 0, 0.55);
        }
      `}</style>
    </>
  );
}
