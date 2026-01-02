'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Sparkles, TrendingUp, AlertCircle, RefreshCw } from 'lucide-react';

interface PreviewResult {
  headline: string;
  analysis: string;
  keyFactors: string[];
  outlook: 'Omaha Contender' | 'Regional Host' | 'Tournament Team' | 'Bubble Watch' | 'Rebuilding';
  confidence: number;
}

interface AITeamPreviewProps {
  teamId: string;
  teamName: string;
}

interface PreviewResponse {
  preview: PreviewResult;
  cached?: boolean;
}

const outlookConfig: Record<
  PreviewResult['outlook'],
  { variant: 'primary' | 'secondary' | 'success' | 'warning' | 'error'; label: string }
> = {
  'Omaha Contender': { variant: 'success', label: 'Omaha Contender' },
  'Regional Host': { variant: 'primary', label: 'Regional Host' },
  'Tournament Team': { variant: 'secondary', label: 'Tournament Team' },
  'Bubble Watch': { variant: 'warning', label: 'Bubble Watch' },
  Rebuilding: { variant: 'error', label: 'Rebuilding' },
};

export function AITeamPreview({ teamId, teamName }: AITeamPreviewProps) {
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cached, setCached] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  async function fetchPreview(forceRefresh = false) {
    try {
      if (forceRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const url = `/api/college-baseball/teams/${encodeURIComponent(teamId)}/preview`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Failed to fetch preview: ${response.status}`);
      }

      const data = (await response.json()) as PreviewResponse;
      setPreview(data.preview);
      setCached(data.cached || false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load AI preview');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    fetchPreview();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fetchPreview is intentionally not a dependency to prevent infinite loops
  }, [teamId]);

  if (loading) {
    return (
      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-burnt-orange animate-pulse" />
            <span className="text-sm font-semibold uppercase tracking-wider text-burnt-orange">
              AI Preview
            </span>
            <Badge variant="secondary" className="text-[10px]">
              Workers AI
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="animate-pulse space-y-3">
            <div className="h-6 bg-charcoal rounded w-3/4" />
            <div className="h-4 bg-charcoal rounded w-full" />
            <div className="h-4 bg-charcoal rounded w-5/6" />
            <div className="flex gap-2 pt-2">
              <div className="h-5 bg-charcoal rounded w-24" />
              <div className="h-5 bg-charcoal rounded w-16" />
            </div>
            <div className="space-y-2 pt-2">
              <div className="h-4 bg-charcoal rounded w-full" />
              <div className="h-4 bg-charcoal rounded w-full" />
              <div className="h-4 bg-charcoal rounded w-3/4" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="overflow-hidden border-red-500/30">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <span className="text-sm font-semibold uppercase tracking-wider text-red-500">
              Preview Unavailable
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-text-tertiary text-sm mb-3">{error}</p>
          <button
            onClick={() => fetchPreview(true)}
            className="text-burnt-orange text-sm font-medium hover:underline flex items-center gap-1"
          >
            <RefreshCw className="w-4 h-4" />
            Try again
          </button>
        </CardContent>
      </Card>
    );
  }

  if (!preview) {
    return null;
  }

  const outlookStyle = outlookConfig[preview.outlook] || outlookConfig['Tournament Team'];

  return (
    <Card className="overflow-hidden hover:border-burnt-orange/30 transition-colors">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-burnt-orange" />
            <span className="text-sm font-semibold uppercase tracking-wider text-burnt-orange">
              AI 2026 Preview
            </span>
            <Badge variant="secondary" className="text-[10px]">
              Workers AI
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            {cached && <span className="text-[10px] text-text-tertiary">Cached</span>}
            <button
              onClick={() => fetchPreview(true)}
              disabled={refreshing}
              className="text-text-tertiary hover:text-burnt-orange transition-colors disabled:opacity-50"
              title="Refresh preview"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Headline */}
        <h3 className="font-display text-xl font-bold text-white uppercase tracking-display">
          {preview.headline}
        </h3>

        {/* Outlook Badge & Confidence */}
        <div className="flex items-center gap-3">
          <Badge variant={outlookStyle.variant}>{outlookStyle.label}</Badge>
          <div className="flex items-center gap-1 text-xs text-text-tertiary">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{preview.confidence}% confidence</span>
          </div>
        </div>

        {/* Analysis */}
        <p className="text-text-secondary leading-relaxed">{preview.analysis}</p>

        {/* Key Factors */}
        <div className="border-t border-border-subtle pt-4">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-text-tertiary mb-3">
            Key Factors for 2026
          </h4>
          <ul className="space-y-2">
            {preview.keyFactors.map((factor, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-text-secondary">
                <span className="text-burnt-orange font-bold mt-0.5">{index + 1}.</span>
                <span>{factor}</span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

export default AITeamPreview;
