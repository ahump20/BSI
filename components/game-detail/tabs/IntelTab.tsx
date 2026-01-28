'use client';

/**
 * Intel Tab Component
 *
 * Unified intelligence view for game detail modal.
 * Displays predictions, sentiment, insights, and portal activity.
 *
 * Three views based on game status:
 * - Pre-game: Prediction breakdown, sentiment charts, recent portal impact
 * - Live: Win probability chart, momentum tracker
 * - Post-game: Prediction accuracy, sentiment delta
 *
 * @author Austin Humphrey - Blaze Sports Intel
 */

import { useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { useGameIntel } from '@/lib/hooks/useGameIntel';
import type { UnifiedGame, UnifiedSportKey } from '@/lib/types/adapters';
import type { SupportedSport } from '@/lib/prediction/types';

/** Maps UnifiedSportKey to SupportedSport for prediction API */
const toSupportedSport = (sport: UnifiedSportKey): SupportedSport => {
  const mapping: Record<string, SupportedSport> = {
    ncaaf: 'cfb',
    ncaab: 'cbb',
    cfb: 'cfb',
    cbb: 'cbb',
    nfl: 'nfl',
    nba: 'nba',
    mlb: 'mlb',
  };
  return mapping[sport] || 'cfb';
};
import type { UnifiedInsight } from '@/lib/types/insight';

// ============================================================================
// Types
// ============================================================================

export interface IntelTabProps {
  game: UnifiedGame;
  sport: UnifiedSportKey;
}

// ============================================================================
// Main Component
// ============================================================================

export function IntelTab({ game, sport }: IntelTabProps) {
  const { prediction, sentiment, insights, loading, error, fullIntel } = useGameIntel(
    game.id,
    toSupportedSport(sport),
    game.homeTeam.id,
    game.awayTeam.id
  );

  // Determine view type based on game status
  const viewType = useMemo((): 'pre_game' | 'live' | 'post_game' => {
    if (game.status === 'LIVE') return 'live';
    if (game.status === 'FINAL') return 'post_game';
    return 'pre_game';
  }, [game.status]);

  // Filter insights by timing
  const relevantInsights = useMemo(() => {
    const timingMap: Record<string, string[]> = {
      pre_game: ['pre_game', 'always'],
      live: ['live', 'always'],
      post_game: ['post_game', 'always'],
    };
    const validTimings = timingMap[viewType];
    return insights.filter((i) => validTimings.includes(i.timing));
  }, [insights, viewType]);

  if (loading.intel && !fullIntel) {
    return <IntelTabSkeleton />;
  }

  if (error) {
    return (
      <div className="p-4">
        <Card variant="default">
          <div className="text-center py-8">
            <p className="text-white/50">Unable to load intelligence data</p>
            <p className="text-white/30 text-sm mt-1">{error}</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Pre-game View */}
      {viewType === 'pre_game' && (
        <>
          {/* Prediction Card */}
          {prediction && (
            <PredictionCard
              homeTeam={game.homeTeam.name}
              awayTeam={game.awayTeam.name}
              homeWinProb={prediction.homeWinProb}
              confidence={prediction.confidence}
              topFactor={prediction.topFactor}
              fullPrediction={fullIntel?.prediction}
            />
          )}

          {/* Sentiment Comparison */}
          {sentiment && (
            <SentimentCard
              homeTeam={game.homeTeam.name}
              awayTeam={game.awayTeam.name}
              homeTemp={sentiment.homeTemp}
              awayTemp={sentiment.awayTemp}
              homeSentiment={fullIntel?.homeSentiment}
              awaySentiment={fullIntel?.awaySentiment}
            />
          )}

          {/* Insights */}
          {relevantInsights.length > 0 && <InsightsCard insights={relevantInsights} />}

          {/* Portal Activity */}
          {fullIntel?.portalMoves && fullIntel.portalMoves.length > 0 && (
            <PortalActivityCard moves={fullIntel.portalMoves} />
          )}

          {/* No Data State */}
          {!prediction && !sentiment && relevantInsights.length === 0 && (
            <Card variant="default">
              <div className="text-center py-8">
                <p className="text-white/50">No intelligence data available yet</p>
                <p className="text-white/30 text-sm mt-1">Check back closer to game time</p>
              </div>
            </Card>
          )}
        </>
      )}

      {/* Live View */}
      {viewType === 'live' && (
        <>
          {/* Live Win Probability */}
          {prediction && (
            <Card variant="default" className="border border-success/30">
              <h3 className="text-sm font-semibold text-success mb-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-success rounded-full animate-pulse" />
                Live Win Probability
              </h3>
              <div className="flex items-center justify-between mb-4">
                <div className="text-center flex-1">
                  <p className="text-xs text-white/50 mb-1">{game.awayTeam.abbreviation}</p>
                  <p className="text-2xl font-bold text-white">
                    {Math.round((1 - prediction.homeWinProb) * 100)}%
                  </p>
                </div>
                <div className="w-px h-12 bg-white/10" />
                <div className="text-center flex-1">
                  <p className="text-xs text-white/50 mb-1">{game.homeTeam.abbreviation}</p>
                  <p className="text-2xl font-bold text-burnt-orange">
                    {Math.round(prediction.homeWinProb * 100)}%
                  </p>
                </div>
              </div>
              <ProbabilityBar homeProb={prediction.homeWinProb} />
              {prediction.topFactor && (
                <p className="text-xs text-white/50 mt-3 text-center">
                  Key factor: {prediction.topFactor}
                </p>
              )}
            </Card>
          )}

          {/* Live Insights */}
          {relevantInsights.length > 0 && (
            <InsightsCard insights={relevantInsights} title="Live Updates" />
          )}
        </>
      )}

      {/* Post-game View */}
      {viewType === 'post_game' && (
        <>
          {/* Calibration Feedback */}
          {prediction && (
            <CalibrationCard
              homeTeam={game.homeTeam.name}
              awayTeam={game.awayTeam.name}
              homeWinProb={prediction.homeWinProb}
              homeScore={game.homeScore ?? 0}
              awayScore={game.awayScore ?? 0}
            />
          )}

          {/* Post-game Insights */}
          {relevantInsights.length > 0 && (
            <InsightsCard insights={relevantInsights} title="Post-Game Analysis" />
          )}
        </>
      )}
    </div>
  );
}

// ============================================================================
// Sub-components
// ============================================================================

/**
 * Prediction Card - Pre-game prediction breakdown
 */
interface PredictionCardProps {
  homeTeam: string;
  awayTeam: string;
  homeWinProb: number;
  confidence: 'high' | 'medium' | 'low';
  topFactor?: string;
  fullPrediction?: {
    predictedSpread?: number;
    predictedTotal?: number;
    topFactors?: string[];
    humanSummary?: string;
  };
}

function PredictionCard({
  homeTeam,
  awayTeam,
  homeWinProb,
  confidence,
  topFactor,
  fullPrediction,
}: PredictionCardProps) {
  const homePercent = Math.round(homeWinProb * 100);
  const awayPercent = 100 - homePercent;
  const favored = homeWinProb >= 0.5 ? homeTeam : awayTeam;
  const favoredProb = Math.max(homePercent, awayPercent);

  return (
    <Card variant="default">
      <h3 className="text-sm font-semibold text-burnt-orange mb-3">Prediction</h3>

      {/* Main Probability */}
      <div className="text-center mb-4">
        <p className="text-3xl font-bold text-white">{favoredProb}%</p>
        <p className="text-white/50 text-sm">{favored} favored</p>
        <ConfidenceBadge confidence={confidence} />
      </div>

      {/* Probability Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-white/50 mb-1">
          <span>{awayTeam}</span>
          <span>{homeTeam}</span>
        </div>
        <ProbabilityBar homeProb={homeWinProb} />
        <div className="flex justify-between text-xs text-white/70 mt-1">
          <span>{awayPercent}%</span>
          <span>{homePercent}%</span>
        </div>
      </div>

      {/* Key Factors */}
      {(topFactor || fullPrediction?.topFactors) && (
        <div className="border-t border-white/10 pt-3">
          <p className="text-xs text-white/50 mb-2">Key Factors</p>
          <ul className="space-y-1">
            {(fullPrediction?.topFactors || [topFactor])
              .filter(Boolean)
              .slice(0, 3)
              .map((factor, i) => (
                <li key={i} className="text-sm text-white/70 flex items-start gap-2">
                  <span className="text-burnt-orange mt-0.5">•</span>
                  {factor}
                </li>
              ))}
          </ul>
        </div>
      )}

      {/* Summary */}
      {fullPrediction?.humanSummary && (
        <p className="text-xs text-white/50 mt-3 italic">{fullPrediction.humanSummary}</p>
      )}
    </Card>
  );
}

/**
 * Sentiment Card - Fanbase sentiment comparison
 */
interface SentimentCardProps {
  homeTeam: string;
  awayTeam: string;
  homeTemp: number;
  awayTemp: number;
  homeSentiment?: { optimism: number; trend: string; volatility: number };
  awaySentiment?: { optimism: number; trend: string; volatility: number };
}

function SentimentCard({
  homeTeam,
  awayTeam,
  homeTemp,
  awayTemp,
  homeSentiment,
  awaySentiment,
}: SentimentCardProps) {
  const getTempLabel = (temp: number): string => {
    if (temp > 0.3) return 'Positive';
    if (temp < -0.3) return 'Negative';
    return 'Neutral';
  };

  const getTempColor = (temp: number): string => {
    if (temp > 0.3) return 'text-success';
    if (temp < -0.3) return 'text-error';
    return 'text-white/50';
  };

  return (
    <Card variant="default">
      <h3 className="text-sm font-semibold text-burnt-orange mb-3">Fanbase Sentiment</h3>

      <div className="grid grid-cols-2 gap-4">
        {/* Away Team */}
        <div className="text-center">
          <p className="text-xs text-white/50 mb-2">{awayTeam}</p>
          <p className={`text-xl font-bold ${getTempColor(awayTemp)}`}>{getTempLabel(awayTemp)}</p>
          {awaySentiment && (
            <div className="mt-2 space-y-1 text-xs">
              <p className="text-white/50">
                Trend: <span className="text-white/70">{awaySentiment.trend}</span>
              </p>
              <p className="text-white/50">
                Optimism:{' '}
                <span className="text-white/70">{Math.round(awaySentiment.optimism * 100)}%</span>
              </p>
            </div>
          )}
        </div>

        {/* Home Team */}
        <div className="text-center">
          <p className="text-xs text-white/50 mb-2">{homeTeam}</p>
          <p className={`text-xl font-bold ${getTempColor(homeTemp)}`}>{getTempLabel(homeTemp)}</p>
          {homeSentiment && (
            <div className="mt-2 space-y-1 text-xs">
              <p className="text-white/50">
                Trend: <span className="text-white/70">{homeSentiment.trend}</span>
              </p>
              <p className="text-white/50">
                Optimism:{' '}
                <span className="text-white/70">{Math.round(homeSentiment.optimism * 100)}%</span>
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Sentiment Bar */}
      <div className="mt-4 pt-3 border-t border-white/10">
        <div className="h-2 bg-white/10 rounded-full overflow-hidden flex">
          <div
            className="bg-gradient-to-r from-error to-white/50"
            style={{ width: `${50 - awayTemp * 50}%` }}
          />
          <div
            className="bg-gradient-to-r from-white/50 to-success"
            style={{ width: `${50 + homeTemp * 50}%` }}
          />
        </div>
      </div>
    </Card>
  );
}

/**
 * Insights Card - Display relevant insights
 */
interface InsightsCardProps {
  insights: UnifiedInsight[];
  title?: string;
}

function InsightsCard({ insights, title = 'Key Insights' }: InsightsCardProps) {
  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'critical':
        return 'border-error bg-error/5';
      case 'high':
        return 'border-burnt-orange bg-burnt-orange/5';
      case 'medium':
        return 'border-white/20 bg-white/5';
      default:
        return 'border-white/10 bg-white/3';
    }
  };

  const getSourceIcon = (source: string): string => {
    switch (source) {
      case 'prediction':
        return '📊';
      case 'sentiment':
        return '📈';
      case 'portal':
        return '🔄';
      case 'calibration':
        return '🎯';
      default:
        return '💡';
    }
  };

  return (
    <Card variant="default">
      <h3 className="text-sm font-semibold text-burnt-orange mb-3">{title}</h3>
      <div className="space-y-2">
        {insights.slice(0, 5).map((insight) => (
          <div
            key={insight.id}
            className={`p-3 rounded-lg border-l-2 ${getPriorityColor(insight.priority)}`}
          >
            <div className="flex items-start gap-2">
              <span className="text-sm">{getSourceIcon(insight.source)}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white font-medium">{insight.headline}</p>
                <p className="text-xs text-white/50 mt-1">{insight.summary}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

/**
 * Portal Activity Card - Recent portal moves affecting teams
 */
interface PortalActivityCardProps {
  moves: Array<{
    playerName: string;
    position: string;
    fromSchool: string;
    toSchool?: string;
    moveType: 'gain' | 'loss';
    affectedTeam: 'home' | 'away';
  }>;
}

function PortalActivityCard({ moves }: PortalActivityCardProps) {
  return (
    <Card variant="default">
      <h3 className="text-sm font-semibold text-burnt-orange mb-3">Recent Portal Activity</h3>
      <div className="space-y-2">
        {moves.slice(0, 5).map((move, i) => (
          <div key={i} className="flex items-center gap-3 p-2 bg-white/5 rounded">
            <div
              className={`w-2 h-2 rounded-full ${
                move.moveType === 'gain' ? 'bg-success' : 'bg-error'
              }`}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white truncate">
                {move.playerName} ({move.position})
              </p>
              <p className="text-xs text-white/50">
                {move.moveType === 'gain'
                  ? `From ${move.fromSchool}`
                  : `To ${move.toSchool || 'TBD'}`}
              </p>
            </div>
            <span
              className={`text-xs font-semibold ${
                move.moveType === 'gain' ? 'text-success' : 'text-error'
              }`}
            >
              {move.moveType === 'gain' ? '+' : '-'}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}

/**
 * Calibration Card - Post-game prediction accuracy feedback
 */
interface CalibrationCardProps {
  homeTeam: string;
  awayTeam: string;
  homeWinProb: number;
  homeScore: number;
  awayScore: number;
}

function CalibrationCard({
  homeTeam,
  awayTeam,
  homeWinProb,
  homeScore,
  awayScore,
}: CalibrationCardProps) {
  const homeWon = homeScore > awayScore;
  const predictedHome = homeWinProb >= 0.5;
  const wasCorrect = predictedHome === homeWon;
  const predictedProb = predictedHome ? homeWinProb : 1 - homeWinProb;
  const predictedWinner = predictedHome ? homeTeam : awayTeam;
  const actualWinner = homeWon ? homeTeam : awayTeam;

  return (
    <Card
      variant="default"
      className={wasCorrect ? 'border border-success/30' : 'border border-error/30'}
    >
      <h3 className="text-sm font-semibold text-burnt-orange mb-3">Prediction Result</h3>

      <div className="text-center mb-4">
        <div
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${
            wasCorrect ? 'bg-success/10 text-success' : 'bg-error/10 text-error'
          }`}
        >
          <span className="text-lg">{wasCorrect ? '✓' : '✗'}</span>
          <span className="font-semibold">{wasCorrect ? 'Correct' : 'Incorrect'}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 text-center">
        <div>
          <p className="text-xs text-white/50 mb-1">Predicted</p>
          <p className="text-white font-semibold">{predictedWinner}</p>
          <p className="text-xs text-white/50">{Math.round(predictedProb * 100)}% chance</p>
        </div>
        <div>
          <p className="text-xs text-white/50 mb-1">Actual</p>
          <p className="text-white font-semibold">{actualWinner}</p>
          <p className="text-xs text-white/50">
            {awayScore} - {homeScore}
          </p>
        </div>
      </div>
    </Card>
  );
}

// ============================================================================
// Utility Components
// ============================================================================

function ProbabilityBar({ homeProb }: { homeProb: number }) {
  const homePercent = homeProb * 100;

  return (
    <div className="h-3 bg-white/10 rounded-full overflow-hidden flex">
      <div
        className="bg-white/30 transition-all duration-300"
        style={{ width: `${100 - homePercent}%` }}
      />
      <div
        className="bg-burnt-orange transition-all duration-300"
        style={{ width: `${homePercent}%` }}
      />
    </div>
  );
}

function ConfidenceBadge({ confidence }: { confidence: 'high' | 'medium' | 'low' }) {
  const colors = {
    high: 'bg-success/20 text-success',
    medium: 'bg-burnt-orange/20 text-burnt-orange',
    low: 'bg-white/10 text-white/50',
  };

  return (
    <span
      className={`inline-block mt-2 px-2 py-0.5 rounded text-xs font-medium ${colors[confidence]}`}
    >
      {confidence.charAt(0).toUpperCase() + confidence.slice(1)} Confidence
    </span>
  );
}

function IntelTabSkeleton() {
  return (
    <div className="p-4 space-y-4">
      <div className="skeleton w-full h-48 rounded" />
      <div className="skeleton w-full h-32 rounded" />
      <div className="skeleton w-full h-24 rounded" />
    </div>
  );
}

export default IntelTab;
