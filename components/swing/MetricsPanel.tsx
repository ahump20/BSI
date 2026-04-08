'use client';

import { motion } from 'framer-motion';
import type { MetricResult } from '@/lib/swing/metrics-engine';
import { METRIC_GROUPS } from '@/lib/swing/sport-models';

interface MetricsPanelProps {
  metrics: MetricResult[];
  overallScore: number;
}

function ScoreRing({ score, size = 80 }: { score: number; size?: number }) {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 80 ? '#10B981' : score >= 50 ? '#F59E0B' : '#EF4444';

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="4"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
        />
      </svg>
      <span className="absolute text-lg font-bold font-display" style={{ color }}>
        {score}
      </span>
    </div>
  );
}

function MetricBar({ metric }: { metric: MetricResult }) {
  const color = metric.score >= 80 ? 'bg-success' : metric.score >= 50 ? 'bg-warning' : 'bg-error';
  const label = metric.score >= 80 ? 'Good' : metric.score >= 50 ? 'Needs Work' : 'Issue';

  return (
    <div className="flex items-center gap-3 py-2">
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between mb-1">
          <span className="text-xs font-medium text-bsi-bone truncate">{metric.label}</span>
          <span className="text-[10px] text-text-muted ml-2 shrink-0">
            {metric.value}{metric.unit}
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${color}`}
            initial={{ width: 0 }}
            animate={{ width: `${metric.score}%` }}
            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.5 }}
          />
        </div>
      </div>
      <span
        className={`text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded-sm ${
          metric.score >= 80
            ? 'text-success bg-success/10'
            : metric.score >= 50
              ? 'text-warning bg-warning/10'
              : 'text-error bg-error/10'
        }`}
      >
        {label}
      </span>
    </div>
  );
}

export function MetricsPanel({ metrics, overallScore }: MetricsPanelProps) {
  return (
    <div className="space-y-6">
      {/* Overall Score */}
      <div className="flex items-center gap-5 p-5 rounded-sm bg-surface-dugout border border-border-subtle">
        <ScoreRing score={overallScore} size={88} />
        <div>
          <h3 className="font-display text-lg font-bold uppercase tracking-wide text-bsi-bone">
            Overall Score
          </h3>
          <p className="text-xs text-text-muted mt-1">
            {overallScore >= 80
              ? 'Strong fundamentals across all phases'
              : overallScore >= 50
                ? 'Solid base with areas to improve'
                : 'Key mechanical issues to address'}
          </p>
        </div>
      </div>

      {/* Grouped Metrics */}
      {Object.entries(METRIC_GROUPS).map(([groupName, keys]) => {
        const groupMetrics = keys
          .map((k) => metrics.find((m) => m.key === k))
          .filter(Boolean) as MetricResult[];

        const groupAvg = Math.round(
          groupMetrics.reduce((sum, m) => sum + m.score, 0) / groupMetrics.length,
        );

        return (
          <div key={groupName} className="rounded-sm bg-surface-dugout border border-border-subtle p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="heritage-stamp text-xs">{groupName}</h4>
              <span
                className={`text-xs font-mono font-bold ${
                  groupAvg >= 80 ? 'text-success' : groupAvg >= 50 ? 'text-warning' : 'text-error'
                }`}
              >
                {groupAvg}/100
              </span>
            </div>
            <div className="divide-y divide-white/[0.04]">
              {groupMetrics.map((m) => (
                <MetricBar key={m.key} metric={m} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
