'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SportSelector } from '@/components/swing/SportSelector';
import { VideoUploader } from '@/components/swing/VideoUploader';
import { SwingReport } from '@/components/swing/SwingReport';
import { extractPosesFromVideo, disposePoseLandmarker, type PoseFrame } from '@/lib/swing/pose-estimation';
import { analyzeSwing, type SwingAnalysis } from '@/lib/swing/metrics-engine';
import { createChatContext, type SwingChatContext } from '@/lib/swing/chat-context';
import type { SwingSport } from '@/lib/swing/sport-models';
import type { NormalizedLandmark } from '@mediapipe/tasks-vision';
import { getSwingUsage, canAnalyze, incrementLocalUsage, FREE_ANALYSES_PER_MONTH, type SwingUsage } from '@/lib/swing/usage-gate';

type Step = 'sport' | 'upload' | 'processing' | 'report';

interface ProcessingState {
  stage: 'loading-model' | 'extracting' | 'analyzing' | 'generating';
  progress: number;
  message: string;
}

export default function SwingAnalysisClient() {
  const [step, setStep] = useState<Step>('sport');
  const [sport, setSport] = useState<SwingSport | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState<ProcessingState | null>(null);
  const [analysis, setAnalysis] = useState<SwingAnalysis | null>(null);
  const [chatContext, setChatContext] = useState<SwingChatContext | null>(null);
  const [frames, setFrames] = useState<PoseFrame[]>([]);
  const [narrationText, setNarrationText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [usage, setUsage] = useState<SwingUsage | null>(null);

  useEffect(() => {
    getSwingUsage()
      .then(setUsage)
      .catch(() => setUsage({ analysesThisMonth: 0, isPro: false }));
  }, []);

  const handleSportSelect = useCallback((s: SwingSport) => {
    setSport(s);
    setStep('upload');
  }, []);

  const handleVideoReady = useCallback((file: File, url: string) => {
    setVideoFile(file);
    setVideoUrl(url);
  }, []);

  const startAnalysis = useCallback(async () => {
    if (!sport || !videoUrl) return;

    setStep('processing');
    setError(null);

    try {
      // Stage 1: Load MediaPipe model
      setProcessing({
        stage: 'loading-model',
        progress: 5,
        message: 'Loading pose detection model...',
      });

      // Create a video element for processing
      const video = document.createElement('video');
      video.src = videoUrl;
      video.muted = true;
      video.playsInline = true;

      await new Promise<void>((resolve, reject) => {
        video.onloadedmetadata = () => resolve();
        video.onerror = () => reject(new Error('Failed to load video'));
      });

      // Stage 2: Extract poses
      setProcessing({
        stage: 'extracting',
        progress: 15,
        message: 'Extracting body positions from video...',
      });

      const extractedFrames = await extractPosesFromVideo(video, (p) => {
        setProcessing({
          stage: 'extracting',
          progress: 15 + Math.round(p.percentage * 0.55),
          message: `Analyzing frame ${p.currentFrame} of ${p.totalFrames}...`,
        });
      });

      setFrames(extractedFrames);

      if (extractedFrames.length < 10) {
        throw new Error(
          'Could not detect enough body positions. Make sure the full body is visible in the video.',
        );
      }

      // Stage 3: Compute metrics
      setProcessing({
        stage: 'analyzing',
        progress: 75,
        message: 'Computing swing metrics...',
      });

      const landmarkFrames = extractedFrames.map((f) => f.landmarks);
      const result = analyzeSwing(landmarkFrames, 30, sport);
      setAnalysis(result);

      // Stage 4: Generate AI analysis
      setProcessing({
        stage: 'generating',
        progress: 90,
        message: 'Generating AI analysis...',
      });

      const swingId = `swing_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;
      const ctx = createChatContext(result, swingId);
      setChatContext(ctx);

      // Fetch AI narration — the "generating" step does real work now
      try {
        const narrationRes = await fetch('/api/swing/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            swingId,
            systemPrompt: ctx.systemPrompt,
            messages: [{ role: 'user', content: 'Walk me through this swing phase by phase. Reference specific frame numbers and metrics. Keep it concise — 3-4 sentences per phase.' }],
          }),
        });

        if (narrationRes.ok) {
          const narrationData = (await narrationRes.json()) as { reply: string };
          setNarrationText(narrationData.reply);
        }
      } catch {
        // Non-critical — report still works without narration
      }

      // Upload to R2 + store in D1 (fire and forget)
      if (videoFile) {
        uploadSwingData(videoFile, result, swingId).catch(console.error);
      }

      // Track usage — increment local counter for anonymous users
      incrementLocalUsage();
      setUsage((prev) => prev ? { ...prev, analysesThisMonth: prev.analysesThisMonth + 1 } : prev);

      setProcessing({ stage: 'generating', progress: 100, message: 'Complete!' });

      // Small delay for the progress bar to finish
      await new Promise((r) => setTimeout(r, 500));
      setStep('report');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Swing analysis couldn\'t complete — try uploading again.');
      setStep('upload');
    } finally {
      disposePoseLandmarker();
    }
  }, [sport, videoUrl, videoFile]);

  const startOver = useCallback(() => {
    setStep('sport');
    setSport(null);
    setVideoUrl(null);
    setVideoFile(null);
    setAnalysis(null);
    setChatContext(null);
    setFrames([]);
    setNarrationText(null);
    setError(null);
    setProcessing(null);
  }, []);

  if (usage === null) {
    return (
      <div className="min-h-screen bg-surface-scoreboard flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[var(--bsi-primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const atLimit = !canAnalyze(usage);

  if (atLimit) {
    return (
      <div className="min-h-screen bg-surface-scoreboard">
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-sm bg-[var(--bsi-primary)]/10 flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-8 h-8 text-[var(--bsi-primary)]" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <h1 className="font-display text-3xl font-bold uppercase tracking-wide text-bsi-bone mb-3">
            Monthly Limit Reached
          </h1>
          <p className="text-sm text-bsi-dust mb-6 max-w-md mx-auto">
            You&apos;ve used all {FREE_ANALYSES_PER_MONTH} free swing analyses this month.
            Upgrade to BSI Pro for unlimited analyses, unlimited coaching questions,
            and AI-personalized drill prescriptions.
          </p>
          <a href="/pricing" className="btn-heritage-fill px-8 py-3 text-sm inline-block">
            Upgrade to Pro
          </a>
          <p className="text-xs text-[rgba(196,184,165,0.35)] mt-4">
            Already a subscriber?{' '}
            <a href="/auth/login" className="text-[var(--bsi-primary)] hover:text-[var(--bsi-primary)] transition-colors">
              Log in
            </a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-scoreboard">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Progress indicator */}
        {step !== 'report' && (
          <div className="flex items-center gap-2 mb-8">
            {(['sport', 'upload', 'processing'] as const).map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                    step === s
                      ? 'bg-[var(--bsi-primary)] text-white'
                      : ['sport', 'upload', 'processing'].indexOf(step) > i
                        ? 'bg-[var(--bsi-primary)]/20 text-[var(--bsi-primary)]'
                        : 'bg-white/[0.06] text-[rgba(196,184,165,0.35)]'
                  }`}
                >
                  {i + 1}
                </div>
                {i < 2 && (
                  <div
                    className={`w-12 sm:w-20 h-px transition-colors ${
                      ['sport', 'upload', 'processing'].indexOf(step) > i
                        ? 'bg-[var(--bsi-primary)]/40'
                        : 'bg-white/[0.06]'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        <AnimatePresence mode="wait">
          {/* Step 1: Sport Selection */}
          {step === 'sport' && (
            <motion.div
              key="sport"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <h1 className="font-display text-3xl sm:text-4xl font-bold uppercase tracking-wide text-bsi-bone mb-2">
                Swing Intelligence
              </h1>
              <p className="text-sm text-bsi-dust mb-8">
                Select your sport to get sport-specific swing analysis.
              </p>
              <SportSelector selected={sport} onSelect={handleSportSelect} />

              {!usage.isPro && (
                <div className="mt-6 text-center">
                  <span className="text-[10px] font-mono text-[rgba(196,184,165,0.35)]">
                    {usage.analysesThisMonth} of {FREE_ANALYSES_PER_MONTH} free analyses used this month
                  </span>
                </div>
              )}
            </motion.div>
          )}

          {/* Step 2: Video Upload */}
          {step === 'upload' && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <button
                    onClick={() => setStep('sport')}
                    className="text-xs text-[rgba(196,184,165,0.35)] hover:text-[var(--bsi-primary)] transition-colors mb-2 flex items-center gap-1"
                  >
                    <svg viewBox="0 0 16 16" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M10 12L6 8l4-4" />
                    </svg>
                    Change sport
                  </button>
                  <h2 className="font-display text-2xl font-bold uppercase tracking-wide text-bsi-bone">
                    Upload Your Swing
                  </h2>
                </div>
                {sport && (
                  <span className="heritage-stamp text-xs">
                    {sport === 'baseball' ? 'Baseball' : sport === 'fastpitch' ? 'Fast-Pitch' : 'Slow-Pitch'}
                  </span>
                )}
              </div>

              <VideoUploader
                onVideoReady={handleVideoReady}
                isProcessing={false}
              />

              {error && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-4 p-4 rounded-sm bg-[var(--bsi-danger)]/10 border border-[var(--bsi-danger)]/20 text-[var(--bsi-danger)] text-sm"
                >
                  {error}
                </motion.div>
              )}

              {videoUrl && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 text-center"
                >
                  <button
                    onClick={startAnalysis}
                    className="btn-heritage-fill text-base px-8 py-3"
                  >
                    Analyze My Swing
                  </button>
                  {!usage.isPro && (
                    <p className="text-[10px] font-mono text-[rgba(196,184,165,0.35)] mt-3">
                      {FREE_ANALYSES_PER_MONTH - usage.analysesThisMonth} free {FREE_ANALYSES_PER_MONTH - usage.analysesThisMonth === 1 ? 'analysis' : 'analyses'} remaining this month
                    </p>
                  )}
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Step 3: Processing */}
          {step === 'processing' && processing && (
            <motion.div
              key="processing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-16"
            >
              <div className="w-20 h-20 mx-auto mb-6 rounded-sm bg-[var(--bsi-primary)]/10 flex items-center justify-center">
                <motion.svg
                  viewBox="0 0 24 24"
                  className="w-10 h-10 text-[var(--bsi-primary)]"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                >
                  <circle cx="12" cy="12" r="10" strokeDasharray="50 20" />
                </motion.svg>
              </div>

              <h2 className="font-display text-xl font-bold uppercase tracking-wide text-bsi-bone mb-2">
                {processing.message}
              </h2>

              <div className="max-w-md mx-auto mt-6">
                <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-[var(--bsi-primary)]"
                    initial={{ width: 0 }}
                    animate={{ width: `${processing.progress}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
                <p className="text-xs text-[rgba(196,184,165,0.35)] mt-2 font-mono">{processing.progress}%</p>
              </div>

              <div className="mt-8 space-y-2 text-xs text-[rgba(196,184,165,0.35)]">
                <p className={processing.stage === 'loading-model' ? 'text-bsi-dust' : ''}>
                  Loading AI model...
                  {processing.stage !== 'loading-model' && ' ✓'}
                </p>
                <p className={processing.stage === 'extracting' ? 'text-bsi-dust' : ''}>
                  Extracting body positions...
                  {['analyzing', 'generating'].includes(processing.stage) && ' ✓'}
                </p>
                <p className={processing.stage === 'analyzing' ? 'text-bsi-dust' : ''}>
                  Computing 12 swing dimensions...
                  {processing.stage === 'generating' && ' ✓'}
                </p>
                <p className={processing.stage === 'generating' ? 'text-bsi-dust' : ''}>
                  Generating AI analysis...
                </p>
              </div>
            </motion.div>
          )}

          {/* Step 4: Report */}
          {step === 'report' && analysis && chatContext && videoUrl && (
            <motion.div
              key="report"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center justify-between mb-6">
                <button
                  onClick={startOver}
                  className="text-xs text-[rgba(196,184,165,0.35)] hover:text-[var(--bsi-primary)] transition-colors flex items-center gap-1"
                >
                  <svg viewBox="0 0 16 16" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10 12L6 8l4-4" />
                  </svg>
                  New Analysis
                </button>
              </div>

              <SwingReport
                analysis={analysis}
                chatContext={chatContext}
                videoUrl={videoUrl}
                frames={frames.map((f) => ({
                  frameIndex: f.frameIndex,
                  timestamp: f.timestamp,
                  landmarks: f.landmarks,
                }))}
                narrationText={narrationText}
                isPro={usage?.isPro ?? false}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/** Upload swing video to R2 and store analysis in D1 (background) */
async function uploadSwingData(
  file: File,
  analysis: SwingAnalysis,
  swingId: string,
): Promise<void> {
  try {
    const formData = new FormData();
    formData.append('video', file);
    formData.append('swingId', swingId);
    formData.append('sport', analysis.sport);
    formData.append('metrics', JSON.stringify(analysis.metrics));
    formData.append('overallScore', String(analysis.overallScore));
    formData.append('frameCount', String(analysis.frameCount));

    const bsiKey = typeof window !== 'undefined' ? localStorage.getItem('bsi-api-key') : null;
    const headers: Record<string, string> = {};
    if (bsiKey) headers['X-BSI-Key'] = bsiKey;

    await fetch('/api/swing/analyze', {
      method: 'POST',
      headers,
      body: formData,
    });
  } catch {
    // Non-critical — analysis still works without server storage
    console.warn('Failed to upload swing data to server');
  }
}
