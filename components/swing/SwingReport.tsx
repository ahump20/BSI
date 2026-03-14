'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { MetricsPanel } from './MetricsPanel';
import { SideBySideViewer } from './SideBySideViewer';
import { SwingChat } from './SwingChat';
import { DrillCard, getRecommendedDrills, AIPersonalizedDrills } from './DrillCard';
import { AINarration } from './AINarration';
import type { SwingAnalysis } from '@/lib/swing/metrics-engine';
import type { SwingChatContext } from '@/lib/swing/chat-context';
import { SPORT_MODELS } from '@/lib/swing/sport-models';
import type { NormalizedLandmark } from '@mediapipe/tasks-vision';

interface SwingReportProps {
  analysis: SwingAnalysis;
  chatContext: SwingChatContext;
  videoUrl: string;
  frames: { frameIndex: number; timestamp: number; landmarks: NormalizedLandmark[] }[];
  narrationText?: string | null;
  isPro?: boolean;
}

type ReportTab = 'overview' | 'metrics' | 'drills' | 'chat';

export function SwingReport({ analysis, chatContext, videoUrl, frames, narrationText, isPro }: SwingReportProps) {
  const [activeTab, setActiveTab] = useState<ReportTab>('overview');
  const [seekFrame, setSeekFrame] = useState<number | null>(null);

  const model = SPORT_MODELS[analysis.sport];

  const weakMetrics = useMemo(
    () =>
      analysis.metrics
        .filter((m) => m.score < 60)
        .sort((a, b) => a.score - b.score)
        .map((m) => m.key),
    [analysis.metrics],
  );

  const drills = useMemo(() => getRecommendedDrills(weakMetrics), [weakMetrics]);

  const tabs: { id: ReportTab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'metrics', label: 'Metrics' },
    { id: 'drills', label: 'Drills' },
    { id: 'chat', label: 'Ask Coach' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="heritage-stamp text-xs">{model.displayName}</span>
            <span className="text-[10px] font-mono text-text-muted">
              {analysis.frameCount} frames at {analysis.phases.fps}fps
            </span>
          </div>
          <h2 className="font-display text-2xl font-bold uppercase tracking-wide text-bsi-bone">
            Swing Analysis
          </h2>
        </div>
        <div className="text-right">
          <div
            className={`text-3xl font-bold font-display ${
              analysis.overallScore >= 80
                ? 'text-emerald-400'
                : analysis.overallScore >= 50
                  ? 'text-amber-400'
                  : 'text-red-400'
            }`}
          >
            {analysis.overallScore}
          </div>
          <span className="text-[10px] text-text-muted font-mono uppercase tracking-wider">
            Overall Score
          </span>
        </div>
      </motion.div>

      {/* Video Player */}
      <SideBySideViewer
        videoUrl={videoUrl}
        frames={frames}
        phases={analysis.phases}
        seekToFrame={seekFrame}
      />

      {/* AI Narration — initial walkthrough */}
      {narrationText && (
        <AINarration narrationText={narrationText} onSeekToFrame={setSeekFrame} />
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b-2 border-border-subtle">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-sm font-medium transition-all relative ${
              activeTab === tab.id
                ? 'text-burnt-orange'
                : 'text-text-muted hover:text-bsi-dust'
            }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <motion.div
                layoutId="report-tab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-burnt-orange"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'overview' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            {/* Quick summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {analysis.metrics.slice(0, 4).map((m) => (
                <div
                  key={m.key}
                  className="rounded-xl bg-surface-dugout border border-border-subtle p-3 text-center"
                >
                  <div
                    className={`text-xl font-bold font-display ${
                      m.score >= 80
                        ? 'text-emerald-400'
                        : m.score >= 50
                          ? 'text-amber-400'
                          : 'text-red-400'
                    }`}
                  >
                    {m.value}
                  </div>
                  <div className="text-[10px] text-text-muted mt-1 truncate">{m.label}</div>
                </div>
              ))}
            </div>

            {/* Key findings */}
            <div className="rounded-xl bg-surface-dugout border border-border-subtle p-5">
              <h3 className="heritage-stamp text-xs mb-3">Key Findings</h3>
              <div className="space-y-3">
                {/* Strengths */}
                {analysis.metrics
                  .filter((m) => m.score >= 80)
                  .slice(0, 3)
                  .map((m) => (
                    <div key={m.key} className="flex items-center gap-2 text-sm">
                      <svg viewBox="0 0 16 16" className="w-4 h-4 text-emerald-400 shrink-0" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 8l3 3 7-7" />
                      </svg>
                      <span className="text-bsi-dust">
                        <strong className="text-bsi-bone">{m.label}</strong> — {m.value}{m.unit} (score: {m.score})
                      </span>
                    </div>
                  ))}

                {/* Issues */}
                {analysis.metrics
                  .filter((m) => m.score < 50)
                  .slice(0, 3)
                  .map((m) => (
                    <div key={m.key} className="flex items-center gap-2 text-sm">
                      <svg viewBox="0 0 16 16" className="w-4 h-4 text-red-400 shrink-0" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="8" cy="8" r="6" />
                        <path d="M8 5v3M8 10.5h.01" />
                      </svg>
                      <span className="text-bsi-dust">
                        <strong className="text-bsi-bone">{m.label}</strong> — {m.value}{m.unit} (score: {m.score})
                      </span>
                    </div>
                  ))}
              </div>
            </div>

            {/* Sport-specific notes */}
            <div className="rounded-xl bg-surface-dugout border border-border-subtle p-5">
              <h3 className="heritage-stamp text-xs mb-3">{model.displayName} Notes</h3>
              <ul className="space-y-2">
                {model.analysisNotes.map((note, i) => (
                  <li key={i} className="flex gap-2 text-xs text-bsi-dust">
                    <span className="text-burnt-orange mt-0.5 shrink-0">•</span>
                    {note}
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        )}

        {activeTab === 'metrics' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <MetricsPanel metrics={analysis.metrics} overallScore={analysis.overallScore} />
          </motion.div>
        )}

        {activeTab === 'drills' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            {isPro && (
              <AIPersonalizedDrills
                swingId={chatContext.swingId}
                systemPrompt={chatContext.systemPrompt}
                weakMetrics={analysis.metrics
                  .filter((m) => m.score < 60)
                  .sort((a, b) => a.score - b.score)
                  .slice(0, 4)
                  .map((m) => ({ key: m.key, label: m.label, value: m.value, score: m.score }))}
                sport={model.displayName}
              />
            )}
            <div className="space-y-3">
              <span className="heritage-stamp text-[10px]">Drill Library</span>
              <p className="text-xs text-text-muted">
                {isPro ? 'Supplementary drills from our curated library.' : 'Based on your weakest metrics, here are targeted drills to improve your swing.'}
              </p>
              {drills.map((drill, i) => (
                <DrillCard key={drill.name} drill={drill} index={i} />
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === 'chat' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <SwingChat
              swingId={chatContext.swingId}
              systemPrompt={chatContext.systemPrompt}
              onSeekToFrame={setSeekFrame}
              isPro={isPro}
            />
          </motion.div>
        )}
      </div>
    </div>
  );
}
