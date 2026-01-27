'use client';

import type { JSX } from 'react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { FactorBar } from './FactorBar';
import { AccuracyBadge } from './AccuracyBadge';
import type { ConfidenceLevel, SupportedSport } from '@/lib/prediction/types';

interface PredictionFactor {
  feature: string;
  displayName: string;
  shapValue: number;
  direction: 'positive' | 'negative';
}

interface PredictionData {
  homeWinProbability: number;
  awayWinProbability: number;
  predictedSpread: number;
  spreadConfidence: number;
  confidence: ConfidenceLevel;
  topFactors: PredictionFactor[];
  allFactors?: PredictionFactor[];
  humanSummary: string;
  calibration?: {
    brierScore: number;
    sampleSize: number;
  };
}

interface PredictionCardProps {
  gameId: string;
  sport: SupportedSport;
  homeTeam: { name: string; abbreviation: string };
  awayTeam: { name: string; abbreviation: string };
  tier?: 'free' | 'pro' | 'enterprise';
}

function getConfidenceLabel(confidence: ConfidenceLevel): string {
  switch (confidence) {
    case 'high':
      return 'High Confidence';
    case 'medium':
      return 'Medium Confidence';
    case 'low':
      return 'Low Confidence';
    default:
      return 'Confidence';
  }
}

function getConfidenceColor(confidence: ConfidenceLevel): string {
  switch (confidence) {
    case 'high':
      return 'text-success';
    case 'medium':
      return 'text-gold';
    case 'low':
      return 'text-text-tertiary';
    default:
      return 'text-text-secondary';
  }
}

export function PredictionCard({
  gameId,
  sport,
  homeTeam,
  awayTeam,
  tier = 'free',
}: PredictionCardProps): JSX.Element {
  const [prediction, setPrediction] = useState<PredictionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPrediction(): Promise<void> {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`/api/predictions/${sport}/${gameId}?tier=${tier}`);

        if (!response.ok) {
          if (response.status === 404) {
            setError('Prediction not available for this game');
          } else {
            setError('Failed to load prediction');
          }
          return;
        }

        const data = (await response.json()) as { data: PredictionData };
        setPrediction(data.data);
      } catch {
        setError('Failed to load prediction');
      } finally {
        setIsLoading(false);
      }
    }

    fetchPrediction();
  }, [gameId, sport, tier]);

  if (isLoading) {
    return (
      <Card variant="default" padding="lg">
        <CardHeader>
          <CardTitle size="sm">BSI Prediction</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8">
            <div className="w-8 h-8 border-2 border-burnt-orange border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-sm text-text-tertiary">Calculating prediction...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !prediction) {
    return (
      <Card variant="default" padding="lg">
        <CardHeader>
          <CardTitle size="sm">BSI Prediction</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <p className="text-text-tertiary text-sm">{error || 'No prediction available'}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const homeProb = Math.round(prediction.homeWinProbability * 100);
  const awayProb = Math.round(prediction.awayWinProbability * 100);
  const homeFavored = prediction.homeWinProbability > 0.5;
  const spread = prediction.predictedSpread;
  const spreadDisplay = spread > 0 ? `-${spread.toFixed(1)}` : `+${Math.abs(spread).toFixed(1)}`;

  const visibleFactors =
    tier === 'free' ? prediction.topFactors.slice(0, 3) : prediction.topFactors;
  const hiddenFactorCount = tier === 'free' ? Math.max(0, prediction.topFactors.length - 3) : 0;
  const hasHiddenFactors = hiddenFactorCount > 0;

  return (
    <Card variant="default" padding="lg">
      <CardHeader>
        <CardTitle size="sm">BSI Prediction</CardTitle>
        {prediction.calibration && (
          <AccuracyBadge
            brierScore={prediction.calibration.brierScore}
            sampleSize={prediction.calibration.sampleSize}
          />
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-5">
          {/* Win Probability Bar */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-white">{homeTeam.abbreviation}</span>
                <span className="text-lg font-bold text-burnt-orange">{homeProb}%</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-gold">{awayProb}%</span>
                <span className="text-sm font-medium text-white">{awayTeam.abbreviation}</span>
              </div>
            </div>
            <div className="h-3 bg-bg-tertiary rounded-full overflow-hidden flex">
              <div
                className="h-full bg-burnt-orange transition-all duration-500"
                style={{ width: `${homeProb}%` }}
              />
              <div
                className="h-full bg-gold transition-all duration-500"
                style={{ width: `${awayProb}%` }}
              />
            </div>
          </div>

          {/* Spread & Confidence */}
          <div className="flex items-center justify-between py-3 px-4 bg-bg-secondary rounded-lg">
            <div className="text-center">
              <p className="text-xs text-text-tertiary mb-1">Spread</p>
              <p className="text-lg font-bold text-white">
                {homeFavored ? homeTeam.abbreviation : awayTeam.abbreviation} {spreadDisplay}
              </p>
            </div>
            <div className="w-px h-8 bg-border-subtle" />
            <div className="text-center">
              <p className="text-xs text-text-tertiary mb-1">Model Confidence</p>
              <p className={`text-sm font-semibold ${getConfidenceColor(prediction.confidence)}`}>
                {getConfidenceLabel(prediction.confidence)}
              </p>
            </div>
          </div>

          {/* Key Factors */}
          <div>
            <p className="text-sm font-medium text-white mb-3">Key Factors</p>
            <div className="space-y-2">
              {visibleFactors.map((factor) => (
                <FactorBar
                  key={factor.feature}
                  label={factor.displayName}
                  impact={factor.shapValue * 100}
                />
              ))}
            </div>

            {/* Upgrade CTA for hidden factors */}
            {hasHiddenFactors && (
              <div className="mt-4 p-3 bg-bg-secondary rounded-lg border border-border-subtle">
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <p className="text-sm text-white mb-0.5">+{hiddenFactorCount} more factors</p>
                    <p className="text-xs text-text-tertiary">Unlock full analysis with BSI Pro</p>
                  </div>
                  <Link
                    href="/pricing"
                    className="px-3 py-1.5 bg-burnt-orange text-white text-xs font-semibold rounded hover:bg-burnt-orange/90 transition-colors"
                  >
                    Upgrade
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Human Summary */}
          {prediction.humanSummary && (
            <p className="text-sm text-text-secondary leading-relaxed border-t border-border-subtle pt-4">
              {prediction.humanSummary}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
