/**
 * useGameIntel Hook
 *
 * Unified hook for fetching and combining game intelligence data:
 * - Predictions (win probability, spread, key factors)
 * - Sentiment (fanbase mood for both teams)
 * - Insights (combined intelligence from all BSI systems)
 *
 * @author Austin Humphrey - Blaze Sports Intel
 */

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { SupportedSport } from '@/lib/prediction/types';
import type {
  UnifiedInsight,
  GameIntelResponse,
  ScoreCardPrediction,
  ScoreCardSentiment,
} from '@/lib/types/insight';

// ============================================================================
// Types
// ============================================================================

export interface GameIntelState {
  /** Prediction data for the game */
  prediction: ScoreCardPrediction | null;
  /** Sentiment temperatures for both teams */
  sentiment: ScoreCardSentiment | null;
  /** Full intel response from API */
  fullIntel: GameIntelResponse | null;
  /** Top insights for display */
  insights: UnifiedInsight[];
  /** Loading states */
  loading: {
    prediction: boolean;
    sentiment: boolean;
    intel: boolean;
  };
  /** Error message if any */
  error: string | null;
  /** Refresh the data */
  refresh: () => void;
}

export interface UseGameIntelOptions {
  /** Skip fetching prediction data */
  skipPrediction?: boolean;
  /** Skip fetching sentiment data */
  skipSentiment?: boolean;
  /** Auto-refresh interval in ms (0 = disabled) */
  refreshInterval?: number;
}

// ============================================================================
// API Fetchers
// ============================================================================

async function fetchPrediction(
  gameId: string,
  sport: SupportedSport
): Promise<ScoreCardPrediction | null> {
  try {
    const response = await fetch(`/api/predictions/${sport}/${gameId}`);
    if (!response.ok) return null;

    const data = (await response.json()) as { success?: boolean; data?: Record<string, unknown> };
    if (!data.success || !data.data) return null;

    const prediction = data.data;
    const explanation = prediction.explanation as
      | { confidence?: 'high' | 'medium' | 'low'; topFactors?: { displayName?: string }[] }
      | undefined;
    return {
      homeWinProb: prediction.homeWinProbability as number,
      confidence: explanation?.confidence || 'medium',
      topFactor: explanation?.topFactors?.[0]?.displayName,
    };
  } catch {
    return null;
  }
}

async function fetchSentiment(
  homeTeamId: string,
  awayTeamId: string
): Promise<ScoreCardSentiment | null> {
  try {
    // Fetch both team sentiments in parallel
    const [homeRes, awayRes] = await Promise.all([
      fetch(`/api/v1/fanbase/${homeTeamId}/sentiment`),
      fetch(`/api/v1/fanbase/${awayTeamId}/sentiment`),
    ]);

    let homeTemp = 0;
    let awayTemp = 0;

    if (homeRes.ok) {
      const homeData = (await homeRes.json()) as { data?: { overall?: number } };
      homeTemp = homeData.data?.overall ?? 0;
    }

    if (awayRes.ok) {
      const awayData = (await awayRes.json()) as { data?: { overall?: number } };
      awayTemp = awayData.data?.overall ?? 0;
    }

    return { homeTemp, awayTemp };
  } catch {
    return null;
  }
}

async function fetchFullIntel(
  gameId: string,
  sport: SupportedSport
): Promise<GameIntelResponse | null> {
  try {
    const response = await fetch(`/api/v1/intel/${gameId}?sport=${sport}`);
    if (!response.ok) return null;

    const data = (await response.json()) as { success?: boolean; data?: GameIntelResponse };
    return data.success ? (data.data ?? null) : null;
  } catch {
    return null;
  }
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Fetch unified game intelligence data.
 *
 * @param gameId - Game ID to fetch intel for (null to skip)
 * @param sport - Sport type
 * @param homeTeamId - Home team identifier for sentiment
 * @param awayTeamId - Away team identifier for sentiment
 * @param options - Optional configuration
 */
export function useGameIntel(
  gameId: string | null,
  sport: SupportedSport,
  homeTeamId: string,
  awayTeamId: string,
  options: UseGameIntelOptions = {}
): GameIntelState {
  const { skipPrediction = false, skipSentiment = false, refreshInterval = 0 } = options;

  // State
  const [prediction, setPrediction] = useState<ScoreCardPrediction | null>(null);
  const [sentiment, setSentiment] = useState<ScoreCardSentiment | null>(null);
  const [fullIntel, setFullIntel] = useState<GameIntelResponse | null>(null);
  const [loading, setLoading] = useState({
    prediction: false,
    sentiment: false,
    intel: false,
  });
  const [error, setError] = useState<string | null>(null);

  // Fetch prediction data
  const loadPrediction = useCallback(async () => {
    if (!gameId || skipPrediction) return;

    setLoading((prev) => ({ ...prev, prediction: true }));
    try {
      const data = await fetchPrediction(gameId, sport);
      setPrediction(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch prediction');
    } finally {
      setLoading((prev) => ({ ...prev, prediction: false }));
    }
  }, [gameId, sport, skipPrediction]);

  // Fetch sentiment data
  const loadSentiment = useCallback(async () => {
    if (!homeTeamId || !awayTeamId || skipSentiment) return;

    setLoading((prev) => ({ ...prev, sentiment: true }));
    try {
      const data = await fetchSentiment(homeTeamId, awayTeamId);
      setSentiment(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch sentiment');
    } finally {
      setLoading((prev) => ({ ...prev, sentiment: false }));
    }
  }, [homeTeamId, awayTeamId, skipSentiment]);

  // Fetch full intel (unified endpoint)
  const loadFullIntel = useCallback(async () => {
    if (!gameId) return;

    setLoading((prev) => ({ ...prev, intel: true }));
    try {
      const data = await fetchFullIntel(gameId, sport);
      setFullIntel(data);

      // Also extract prediction and sentiment from full intel if available
      if (data?.prediction) {
        setPrediction({
          homeWinProb: data.prediction.homeWinProbability,
          confidence: data.prediction.confidence,
          topFactor: data.prediction.topFactors?.[0],
        });
      }
      if (data?.homeSentiment && data?.awaySentiment) {
        setSentiment({
          homeTemp: data.homeSentiment.overall,
          awayTemp: data.awaySentiment.overall,
        });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch intel');
    } finally {
      setLoading((prev) => ({ ...prev, intel: false }));
    }
  }, [gameId, sport]);

  // Combined refresh function
  const refresh = useCallback(() => {
    setError(null);
    // Prefer full intel endpoint, fallback to individual fetches
    loadFullIntel().catch(() => {
      loadPrediction();
      loadSentiment();
    });
  }, [loadFullIntel, loadPrediction, loadSentiment]);

  // Initial load
  useEffect(() => {
    if (gameId) {
      refresh();
    }
  }, [gameId, refresh]);

  // Auto-refresh
  useEffect(() => {
    if (refreshInterval <= 0 || !gameId) return;

    const interval = setInterval(refresh, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval, gameId, refresh]);

  // Extract insights from full intel
  const insights = useMemo(() => {
    return fullIntel?.insights ?? [];
  }, [fullIntel]);

  return {
    prediction,
    sentiment,
    fullIntel,
    insights,
    loading,
    error,
    refresh,
  };
}

// ============================================================================
// Simplified Hooks for Specific Use Cases
// ============================================================================

/**
 * Fetch only prediction data for a game.
 */
export function usePrediction(
  gameId: string | null,
  sport: SupportedSport
): { prediction: ScoreCardPrediction | null; loading: boolean; error: string | null } {
  const [prediction, setPrediction] = useState<ScoreCardPrediction | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!gameId) return;

    setLoading(true);
    setError(null);

    fetchPrediction(gameId, sport)
      .then(setPrediction)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [gameId, sport]);

  return { prediction, loading, error };
}

/**
 * Fetch sentiment data for a single team.
 */
export function useFanbaseSentiment(teamId: string | null): {
  sentiment: number | null;
  trend: string | null;
  loading: boolean;
  error: string | null;
} {
  const [sentiment, setSentiment] = useState<number | null>(null);
  const [trend, setTrend] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!teamId) return;

    setLoading(true);
    setError(null);

    fetch(`/api/v1/fanbase/${teamId}/sentiment`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch sentiment');
        return res.json() as Promise<{ data?: { overall?: number; trend?: string } }>;
      })
      .then((data) => {
        setSentiment(data.data?.overall ?? null);
        setTrend(data.data?.trend ?? null);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [teamId]);

  return { sentiment, trend, loading, error };
}

export default useGameIntel;
