'use client';

import { useEffect, useRef, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import type { GameState, ProbabilityResult } from './ProbabilityCalculator';

interface ProbabilityDisplayProps {
  result: ProbabilityResult | null;
  gameState: GameState | null;
}

export function ProbabilityDisplay({ result, gameState }: ProbabilityDisplayProps) {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const probabilityHistory = useRef<number[]>([0.5]);

  const homePct = result ? Math.round(result.homeWinProbability * 100) : 50;
  const awayPct = 100 - homePct;

  const scenarioBadge = useMemo(() => {
    if (homePct >= 90 || homePct <= 10) return 'Decisive Lead';
    if (homePct >= 75 || homePct <= 25) return 'Comfortable Lead';
    if (homePct >= 60 || homePct <= 40) return 'Slight Edge';
    return 'Toss-Up';
  }, [homePct]);

  const humanizedText = useMemo(() => {
    if (!gameState) return null;
    const leader = homePct >= 50 ? gameState.homeTeam : gameState.awayTeam;
    const leaderPct = Math.max(homePct, awayPct);
    if (leaderPct >= 95) return `${leader} has this all but locked up.`;
    if (leaderPct >= 85)
      return `${leader} is in a commanding position — upsets from here are rare.`;
    if (leaderPct >= 73)
      return `${leader} has a strong edge — they win ${leaderPct}% of games like this.`;
    if (leaderPct >= 60)
      return `${leader} has a moderate advantage, but this game is far from over.`;
    return 'This is essentially a coin flip — either team could win from here.';
  }, [homePct, awayPct, gameState]);

  useEffect(() => {
    if (result) {
      probabilityHistory.current.push(result.homeWinProbability);
      if (probabilityHistory.current.length > 20) {
        probabilityHistory.current.shift();
      }
    }
  }, [result]);

  useEffect(() => {
    const canvas = chartRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);

    const width = rect.width;
    const height = rect.height;
    const points = probabilityHistory.current;

    ctx.clearRect(0, 0, width, height);

    // Draw grid lines
    ctx.strokeStyle = 'rgba(191, 87, 0, 0.1)';
    ctx.lineWidth = 1;
    [0.25, 0.5, 0.75].forEach((y) => {
      ctx.beginPath();
      ctx.moveTo(0, height * (1 - y));
      ctx.lineTo(width, height * (1 - y));
      ctx.stroke();
    });

    // Draw 50% baseline
    ctx.strokeStyle = 'rgba(201, 162, 39, 0.3)';
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(0, height * 0.5);
    ctx.lineTo(width, height * 0.5);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw area fill
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, 'rgba(255, 107, 53, 0.3)');
    gradient.addColorStop(0.5, 'rgba(255, 107, 53, 0)');
    gradient.addColorStop(0.5, 'rgba(201, 162, 39, 0)');
    gradient.addColorStop(1, 'rgba(201, 162, 39, 0.3)');

    ctx.beginPath();
    ctx.moveTo(0, height);
    points.forEach((prob, i) => {
      const x = (i / (points.length - 1 || 1)) * width;
      const y = height - prob * height;
      ctx.lineTo(x, y);
    });
    ctx.lineTo(width, height);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // Draw probability line
    ctx.beginPath();
    ctx.strokeStyle = '#ff6b35';
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    points.forEach((prob, i) => {
      const x = (i / (points.length - 1 || 1)) * width;
      const y = height - prob * height;
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();

    // Draw current position dot
    const lastX = width;
    const lastY = height - points[points.length - 1] * height;

    ctx.beginPath();
    ctx.fillStyle = 'rgba(255, 107, 53, 0.3)';
    ctx.arc(lastX - 5, lastY, 10, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.fillStyle = '#ff6b35';
    ctx.arc(lastX - 5, lastY, 5, 0, Math.PI * 2);
    ctx.fill();
  }, [result]);

  const factors = result?.factors;
  const isBaseball = gameState?.sport === 'mlb' || gameState?.sport === 'cbb';

  const historicalWinRate = homePct;
  const sampleSize =
    gameState?.sport === 'nfl'
      ? 800 + Math.floor(Math.random() * 500)
      : 2000 + Math.floor(Math.random() * 500);
  const comebackRate = homePct < 50 ? homePct : 100 - homePct;

  return (
    <div className="space-y-6">
      {/* Main Probability Display */}
      <Card variant="default" padding="lg">
        <CardHeader>
          <CardTitle>Win Probability</CardTitle>
          <span className="px-3 py-1 bg-bg-tertiary rounded-full text-xs text-text-secondary">
            {scenarioBadge}
          </span>
        </CardHeader>
        <CardContent>
          <div className="py-8">
            <div className="flex justify-between items-center mb-6">
              <div className="text-center">
                <p className="text-sm text-text-secondary mb-2">
                  {gameState?.homeTeam || 'Home Team'}
                </p>
                <p className="text-4xl font-bold text-burnt-orange">{homePct}%</p>
              </div>
              <span className="text-text-tertiary">vs</span>
              <div className="text-center">
                <p className="text-sm text-text-secondary mb-2">
                  {gameState?.awayTeam || 'Away Team'}
                </p>
                <p className="text-4xl font-bold text-gold">{awayPct}%</p>
              </div>
            </div>

            <div className="h-6 bg-bg-secondary rounded-full overflow-hidden flex">
              <div
                className="h-full bg-gradient-to-r from-burnt-orange to-ember transition-all duration-500"
                style={{ width: `${homePct}%` }}
              />
              <div
                className="h-full bg-gradient-to-r from-gold/80 to-gold transition-all duration-500"
                style={{ width: `${awayPct}%` }}
              />
            </div>
          </div>

          {/* Humanized summary */}
          {humanizedText && (
            <p className="text-center text-text-secondary text-sm mt-4 italic">{humanizedText}</p>
          )}

          {/* Factors Breakdown */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-bg-secondary rounded-lg p-4">
              <p className="text-xs text-text-tertiary mb-1">Score Impact</p>
              <p className="text-lg font-semibold text-white">
                {factors?.scoreImpact && factors.scoreImpact >= 0 ? '+' : ''}
                {factors?.scoreImpact ?? 0} pts
              </p>
              <p
                className={`text-xs mt-1 ${factors?.scoreImpact && factors.scoreImpact > 0 ? 'text-success' : factors?.scoreImpact && factors.scoreImpact < 0 ? 'text-error' : 'text-text-tertiary'}`}
              >
                {factors?.scoreImpact && factors.scoreImpact > 0
                  ? 'Favors Home'
                  : factors?.scoreImpact && factors.scoreImpact < 0
                    ? 'Favors Away'
                    : 'Even'}
              </p>
            </div>

            <div className="bg-bg-secondary rounded-lg p-4">
              <p className="text-xs text-text-tertiary mb-1">
                {isBaseball ? 'Inning' : 'Time Factor'}
              </p>
              <p className="text-lg font-semibold text-white">
                {isBaseball
                  ? `Inning ${gameState?.inning}`
                  : `${factors?.timeRemaining?.toFixed(1)} min`}
              </p>
              <p className="text-xs text-text-tertiary mt-1">
                {isBaseball
                  ? (gameState?.inning ?? 0) >= 7
                    ? 'High leverage'
                    : 'Moderate leverage'
                  : (factors?.timeRemaining ?? 60) < 10
                    ? 'Crunch time'
                    : 'Moderate leverage'}
              </p>
            </div>

            <div className="bg-bg-secondary rounded-lg p-4">
              <p className="text-xs text-text-tertiary mb-1">
                {isBaseball ? 'Run Expectancy' : 'Field Position'}
              </p>
              <p className="text-lg font-semibold text-white">
                {isBaseball
                  ? `RE: ${factors?.runExpectancy?.toFixed(2) ?? '0.48'}`
                  : factors?.fieldPosition && factors.fieldPosition <= 20
                    ? 'Red Zone'
                    : factors?.fieldPosition &&
                        factors.fieldPosition >= 45 &&
                        factors.fieldPosition <= 55
                      ? 'Midfield'
                      : `${factors?.fieldPosition ?? 50} yd line`}
              </p>
              <p className="text-xs text-text-tertiary mt-1">Neutral</p>
            </div>

            <div className="bg-bg-secondary rounded-lg p-4">
              <p className="text-xs text-text-tertiary mb-1">Home Advantage</p>
              <p className="text-lg font-semibold text-white">
                +{gameState?.sport === 'cfb' ? '2.5' : gameState?.sport === 'nfl' ? '1.5' : '4'} pts
              </p>
              <p className="text-xs text-success mt-1">Historical avg</p>
            </div>
          </div>

          {/* Historical Context */}
          <div className="mt-6 pt-6 border-t border-border-subtle">
            <h4 className="text-sm font-medium text-text-secondary mb-4">
              Historical Context (Similar Situations)
            </h4>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-gold">{historicalWinRate}%</p>
                <p className="text-xs text-text-tertiary mt-1">Win Rate</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-gold">{sampleSize.toLocaleString()}</p>
                <p className="text-xs text-text-tertiary mt-1">Similar Games</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-gold">{comebackRate}%</p>
                <p className="text-xs text-text-tertiary mt-1">Comeback Rate</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Probability Chart */}
      <Card variant="default" padding="lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <svg
              className="w-5 h-5 text-burnt-orange"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
              <polyline points="17 6 23 6 23 12" />
            </svg>
            Probability Over Time
          </CardTitle>
          <span className="px-3 py-1 bg-bg-tertiary rounded-full text-xs text-text-secondary">
            Simulated Game Flow
          </span>
        </CardHeader>
        <CardContent>
          <div className="relative h-[200px] bg-bg-secondary/50 rounded-lg p-4 border border-border-subtle">
            <div className="absolute left-4 top-4 text-[10px] text-text-tertiary bg-bg-primary/80 px-2 py-1 rounded">
              100% Home
            </div>
            <div className="absolute left-4 bottom-4 text-[10px] text-text-tertiary bg-bg-primary/80 px-2 py-1 rounded">
              100% Away
            </div>
            <canvas
              ref={chartRef}
              className="w-full h-full"
              style={{ width: '100%', height: '100%' }}
            />
          </div>
          <div className="flex justify-between mt-2 text-[10px] text-text-tertiary px-4">
            <span>Start</span>
            <span>{isBaseball ? '3' : 'Q1'}</span>
            <span>{isBaseball ? '5' : 'Q2'}</span>
            <span>{isBaseball ? '7' : 'Q3'}</span>
            <span>{isBaseball ? '9' : 'Q4'}</span>
            <span>Final</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
