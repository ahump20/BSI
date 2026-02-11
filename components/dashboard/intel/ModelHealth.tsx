'use client';

import { useMemo } from 'react';
import { Shield } from 'lucide-react';
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip as ReTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { BSI_CHART_COLORS, tooltipProps } from '@/lib/chart-theme';
import { Badge } from '@/components/ui/Badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { SAMPLE_MODEL_HEALTH, SAMPLE_MODEL_AVG } from '@/lib/intel/sample-data';
import type { ModelHealthPoint } from '@/lib/intel/types';

interface ModelHealthResponse {
  weeks: Array<{
    week: string;
    accuracy: number;
    sport: string;
    recordedAt: string;
  }>;
  lastUpdated: string;
}

/**
 * Fetch real model health data from the API.
 * Falls back to SAMPLE_MODEL_HEALTH if unavailable.
 */
async function fetchModelHealth(): Promise<{ data: ModelHealthPoint[]; avg: number }> {
  try {
    const res = await fetch('/api/model-health');
    if (!res.ok) throw new Error('not available');
    const json = (await res.json()) as ModelHealthResponse;
    if (json.weeks?.length > 0) {
      // Convert to percentage and reverse for chronological order
      const weeks = json.weeks
        .map((w) => ({ week: w.week, accuracy: w.accuracy * 100 }))
        .reverse();
      const avg = weeks.reduce((sum, w) => sum + w.accuracy, 0) / weeks.length;
      return { data: weeks, avg };
    }
  } catch {
    // Fall through to sample data
  }
  return { data: SAMPLE_MODEL_HEALTH, avg: SAMPLE_MODEL_AVG };
}

export function ModelHealth() {
  const { data: healthData } = useQuery({
    queryKey: ['model-health'],
    queryFn: fetchModelHealth,
    refetchInterval: 300_000, // 5 minutes
    staleTime: 120_000,
  });

  const { chartData, avg, isReal } = useMemo(() => {
    const d = healthData?.data ?? SAMPLE_MODEL_HEALTH;
    const a = healthData?.avg ?? SAMPLE_MODEL_AVG;
    const real = healthData?.data !== SAMPLE_MODEL_HEALTH && (healthData?.data?.length ?? 0) > 0;
    return { chartData: d, avg: a, isReal: real };
  }, [healthData]);

  return (
    <Card variant="default" padding="none">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle size="sm" className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-green-400" />
            Model Health
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="success" className="text-[10px] font-mono">
              {avg.toFixed(1)}%
            </Badge>
            <Badge variant={isReal ? 'success' : 'outline'} className="text-[10px] font-mono">
              {isReal ? 'Live' : 'Training'}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[100px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="modelGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={BSI_CHART_COLORS.primary} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={BSI_CHART_COLORS.primary} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="week" hide />
              <YAxis domain={[60, 85]} hide />
              <ReTooltip {...tooltipProps} />
              <Area
                type="monotone"
                dataKey="accuracy"
                name="Accuracy"
                stroke={BSI_CHART_COLORS.primary}
                fill="url(#modelGrad)"
                strokeWidth={2}
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="font-mono text-[10px] text-white/25">
            {chartData.length} weeks rolling
          </span>
          <span className="font-mono text-[10px] text-white/25">
            {isReal ? 'Live prediction accuracy' : 'Sample data — model in training'}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
