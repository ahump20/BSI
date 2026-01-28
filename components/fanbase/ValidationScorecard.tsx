'use client';

import { motion } from 'framer-motion';
import { Shield, AlertTriangle, Clock, CheckCircle, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import type { FanbaseResearchMeta, DataSource } from '../../lib/fanbase/types';
import {
  calculateConfidenceLevel,
  getConfidenceColor,
  getDaysSinceUpdate,
  formatRelativeDate,
  type ConfidenceLevel,
} from '../../lib/fanbase/validation';

export interface ValidationScorecardProps {
  meta: FanbaseResearchMeta;
  schoolName: string;
  className?: string;
  compact?: boolean;
}

function ConfidenceBadge({ level, score }: { level: ConfidenceLevel; score: number }) {
  const colors = getConfidenceColor(level);
  const icons = {
    high: CheckCircle,
    medium: Shield,
    low: AlertTriangle,
    stale: Clock,
  };
  const Icon = icons[level];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${colors.bg} ${colors.text}`}
    >
      <Icon className="w-4 h-4" />
      <span className="text-sm font-medium capitalize">{level}</span>
      <span className="text-sm opacity-70">({(score * 100).toFixed(0)}%)</span>
    </motion.div>
  );
}

function ConfidenceBar({ score }: { score: number }) {
  const level = calculateConfidenceLevel(score);
  const colors = getConfidenceColor(level);

  return (
    <div className="w-full">
      <div className="flex justify-between text-xs text-white/50 mb-1">
        <span>Confidence</span>
        <span>{(score * 100).toFixed(0)}%</span>
      </div>
      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score * 100}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className={`h-full rounded-full ${colors.bar}`}
        />
      </div>
    </div>
  );
}

function DataSourceBadge({ source }: { source: DataSource }) {
  const sourceLabels: Record<DataSource, string> = {
    'x-research': 'X/Twitter Research',
    manual: 'Manual Analysis',
    survey: 'Fan Survey',
    aggregated: 'Aggregated Sources',
  };

  const sourceIcons: Record<DataSource, string> = {
    'x-research': 'bg-info/20 text-info',
    manual: 'bg-texas-soil/20 text-texas-soil',
    survey: 'bg-success/20 text-success',
    aggregated: 'bg-burnt-orange/20 text-burnt-orange',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium ${sourceIcons[source]}`}
    >
      <FileText className="w-3 h-3" />
      {sourceLabels[source]}
    </span>
  );
}

function RecencyIndicator({ lastUpdated }: { lastUpdated: string }) {
  const daysSince = getDaysSinceUpdate(lastUpdated);
  const relativeDate = formatRelativeDate(lastUpdated);

  let statusColor = 'text-success';
  let statusText = 'Current';

  if (daysSince > 90) {
    statusColor = 'text-error';
    statusText = 'Stale';
  } else if (daysSince > 30) {
    statusColor = 'text-warning';
    statusText = 'Aging';
  } else if (daysSince > 14) {
    statusColor = 'text-info';
    statusText = 'Recent';
  }

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Clock className="w-4 h-4 text-white/40" />
        <span className="text-sm text-white/70">{relativeDate}</span>
      </div>
      <span className={`text-xs font-medium ${statusColor}`}>{statusText}</span>
    </div>
  );
}

export function ValidationScorecard({
  meta,
  schoolName,
  className = '',
  compact = false,
}: ValidationScorecardProps) {
  const confidenceLevel = calculateConfidenceLevel(meta.confidence);

  if (compact) {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <ConfidenceBadge level={confidenceLevel} score={meta.confidence} />
        <span className="text-xs text-white/40">
          Updated {formatRelativeDate(meta.lastUpdated)}
        </span>
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-burnt-orange" />
          Data Validation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Confidence Score */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-white/70">Confidence Level</span>
          <ConfidenceBadge level={confidenceLevel} score={meta.confidence} />
        </div>

        {/* Confidence Bar */}
        <ConfidenceBar score={meta.confidence} />

        {/* Recency */}
        <RecencyIndicator lastUpdated={meta.lastUpdated} />

        {/* Data Source */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-white/70">Primary Source</span>
          <DataSourceBadge source={meta.dataSource} />
        </div>

        {/* Sample Size */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-white/70">Sample Size</span>
          <span className="text-sm text-white">
            {meta.sampleSize > 0
              ? `${meta.sampleSize.toLocaleString()} data points`
              : 'Not specified'}
          </span>
        </div>

        {/* Action Prompt for Low Confidence */}
        {(confidenceLevel === 'low' || confidenceLevel === 'stale') && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 bg-warning/10 border border-warning/20 rounded-lg"
          >
            <p className="text-xs text-warning">
              <AlertTriangle className="w-3 h-3 inline mr-1" />
              This profile needs review. Data may be outdated or insufficient.
            </p>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}

export interface ValidationSummaryProps {
  profiles: Array<{ meta: FanbaseResearchMeta; schoolName: string }>;
  className?: string;
}

export function ValidationSummary({ profiles, className = '' }: ValidationSummaryProps) {
  const byLevel = profiles.reduce(
    (acc, { meta }) => {
      const level = calculateConfidenceLevel(meta.confidence);
      acc[level] = (acc[level] || 0) + 1;
      return acc;
    },
    {} as Record<ConfidenceLevel, number>
  );

  const total = profiles.length;
  const healthScore = (
    ((byLevel.high || 0) * 1.0 +
      (byLevel.medium || 0) * 0.7 +
      (byLevel.low || 0) * 0.3 +
      (byLevel.stale || 0) * 0.1) /
    total
  ).toFixed(2);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-burnt-orange" />
          Data Health Overview
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 gap-3 mb-4">
          <div className="text-center p-2 bg-success/10 rounded-lg">
            <p className="text-lg font-bold text-success">{byLevel.high || 0}</p>
            <p className="text-xs text-white/50">High</p>
          </div>
          <div className="text-center p-2 bg-warning/10 rounded-lg">
            <p className="text-lg font-bold text-warning">{byLevel.medium || 0}</p>
            <p className="text-xs text-white/50">Medium</p>
          </div>
          <div className="text-center p-2 bg-burnt-orange/10 rounded-lg">
            <p className="text-lg font-bold text-burnt-orange">{byLevel.low || 0}</p>
            <p className="text-xs text-white/50">Low</p>
          </div>
          <div className="text-center p-2 bg-error/10 rounded-lg">
            <p className="text-lg font-bold text-error">{byLevel.stale || 0}</p>
            <p className="text-xs text-white/50">Stale</p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-border-subtle">
          <span className="text-sm text-white/70">Overall Data Health</span>
          <span className="text-lg font-bold text-white">
            {(Number(healthScore) * 100).toFixed(0)}%
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
