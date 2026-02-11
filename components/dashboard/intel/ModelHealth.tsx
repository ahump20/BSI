'use client';

import { Shield } from 'lucide-react';
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip as ReTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { BSI_CHART_COLORS, tooltipProps } from '@/lib/chart-theme';
import { Badge } from '@/components/ui/Badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { SAMPLE_MODEL_HEALTH, SAMPLE_MODEL_AVG } from '@/lib/intel/sample-data';

export function ModelHealth() {
  const avg = SAMPLE_MODEL_AVG.toFixed(1);

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
              {avg}%
            </Badge>
            <Badge variant="outline" className="text-[10px] font-mono">
              Training
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[100px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={SAMPLE_MODEL_HEALTH}>
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
          <span className="font-mono text-[10px] text-white/25">12 weeks rolling</span>
          <span className="font-mono text-[10px] text-white/25">Sample data — model in training</span>
        </div>
      </CardContent>
    </Card>
  );
}
