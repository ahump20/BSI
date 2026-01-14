/**
 * PredictionCard Component
 * Display game prediction with confidence
 */

'use client';

import React from 'react';
import { Card } from '../ui/Card';
import { ProgressBar } from '../ui/ProgressBar';
import type { GamePrediction } from '@/lib/types/predictions';

export interface PredictionCardProps {
  prediction: GamePrediction;
}

const confidenceColors = {
  high: 'success',
  medium: 'warning',
  low: 'danger',
} as const;

export function PredictionCard({ prediction }: PredictionCardProps) {
  return (
    <Card variant="default" padding="lg">
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-xl font-display font-bold text-white mb-1">
              Game Prediction
            </h3>
            <p className="text-sm text-text-secondary">
              Model: {prediction.modelVersion} • {new Date(prediction.generatedAt).toLocaleString()}
            </p>
          </div>

          <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
            prediction.confidence === 'high' ? 'bg-green-500/20 text-green-500' :
            prediction.confidence === 'medium' ? 'bg-yellow-500/20 text-yellow-500' :
            'bg-red-500/20 text-red-500'
          }`}>
            {prediction.confidence.toUpperCase()} CONFIDENCE
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-charcoal rounded-lg p-4">
            <p className="text-text-tertiary text-xs uppercase tracking-wider mb-2">
              Predicted Winner
            </p>
            <p className="text-2xl font-bold text-burnt-orange">{prediction.predictedWinner}</p>
          </div>

          <div className="bg-charcoal rounded-lg p-4">
            <p className="text-text-tertiary text-xs uppercase tracking-wider mb-2">
              Spread
            </p>
            <p className="text-2xl font-bold text-white">
              {prediction.predictedSpread > 0 ? '+' : ''}
              {prediction.predictedSpread}
            </p>
          </div>

          <div className="bg-charcoal rounded-lg p-4">
            <p className="text-text-tertiary text-xs uppercase tracking-wider mb-2">
              Total
            </p>
            <p className="text-2xl font-bold text-white">{prediction.predictedTotal}</p>
          </div>
        </div>

        <div>
          <p className="text-sm text-text-secondary mb-2">Win Probability</p>
          <ProgressBar
            value={prediction.winProbability * 100}
            max={100}
            color={confidenceColors[prediction.confidence]}
            showLabel
            size="lg"
          />
        </div>

        <div>
          <p className="text-sm font-semibold text-white mb-3">Key Factors</p>
          <div className="space-y-2">
            {prediction.factors.slice(0, 3).map((factor, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  factor.impact > 0 ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'
                }`}>
                  {factor.impact > 0 ? '↑' : '↓'}
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{factor.name}</p>
                  <p className="text-xs text-text-tertiary">{factor.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}
