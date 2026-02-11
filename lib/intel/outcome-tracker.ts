'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { IntelGame, GameStatus } from './types';

const OUTCOMES_KEY = 'bsi-game-outcomes';
const MAX_STORED = 500; // Cap storage to prevent bloat

export interface TrackedPrediction {
    gameId: string;
    sport: string;
    predictedWinner: 'home' | 'away';
    homeProb: number;
    timestamp: string;
}

export interface GameOutcome {
    gameId: string;
    sport: string;
    actualWinner: 'home' | 'away';
    homeScore: number;
    awayScore: number;
    predictedWinner: 'home' | 'away';
    homeProb: number;
    correct: boolean;
    resolvedAt: string;
}

interface OutcomeStore {
    predictions: TrackedPrediction[];
    outcomes: GameOutcome[];
}

function loadStore(): OutcomeStore {
    if (typeof window === 'undefined') return { predictions: [], outcomes: [] };
    try {
          const raw = localStorage.getItem(OUTCOMES_KEY);
          if (!raw) return { predictions: [], outcomes: [] };
          return JSON.parse(raw) as OutcomeStore;
    } catch {
          return { predictions: [], outcomes: [] };
    }
}

function saveStore(store: OutcomeStore): void {
    try {
          // Trim old data to prevent storage bloat
      const trimmed: OutcomeStore = {
              predictions: store.predictions.slice(-MAX_STORED),
              outcomes: store.outcomes.slice(-MAX_STORED),
      };
          localStorage.setItem(OUTCOMES_KEY, JSON.stringify(trimmed));
    } catch {
          // Storage full — fail silently
    }
}

/**
 * Tracks game predictions and resolves outcomes when games finish.
 * Computes historical accuracy for the model health display.
 */
export function useOutcomeTracker(games: IntelGame[]) {
    const [store, setStore] = useState<OutcomeStore>({ predictions: [], outcomes: [] });

  // Load on mount
  useEffect(() => {
        setStore(loadStore());
  }, []);

  // Track new predictions for scheduled games with win probability
  useEffect(() => {
        const scheduled = games.filter(
                (g) => g.status === 'scheduled' && g.winProbability,
              );

                if (scheduled.length === 0) return;

                setStore((prev) => {
                        const existing = new Set(prev.predictions.map((p) => p.gameId));
                        const newPredictions: TrackedPrediction[] = [];

                               for (const game of scheduled) {
                                         if (existing.has(game.id) || !game.winProbability) continue;
                                         const predictedWinner = game.winProbability.home >= 50 ? 'home' : 'away';
                                         newPredictions.push({
                                                     gameId: game.id,
                                                     sport: game.sport,
                                                     predictedWinner,
                                                     homeProb: game.winProbability.home,
                                                     timestamp: new Date().toISOString(),
                                         });
                               }

                               if (newPredictions.length === 0) return prev;

                               const updated = {
                                         ...prev,
                                         predictions: [...prev.predictions, ...newPredictions],
                               };
                        saveStore(updated);
                        return updated;
                });
  }, [games]);

  // Resolve outcomes for final games
  useEffect(() => {
        const finals = games.filter((g) => g.status === 'final');
        if (finals.length === 0) return;

                setStore((prev) => {
                        const resolvedIds = new Set(prev.outcomes.map((o) => o.gameId));
                        const predMap = new Map(prev.predictions.map((p) => [p.gameId, p]));
                        const newOutcomes: GameOutcome[] = [];

                               for (const game of finals) {
                                         if (resolvedIds.has(game.id)) continue;
                                         const pred = predMap.get(game.id);
                                         if (!pred) continue;

                          const actualWinner = game.home.score > game.away.score ? 'home' : 'away';
                                         newOutcomes.push({
                                                     gameId: game.id,
                                                     sport: game.sport,
                                                     actualWinner,
                                                     homeScore: game.home.score,
                                                     awayScore: game.away.score,
                                                     predictedWinner: pred.predictedWinner,
                                                     homeProb: pred.homeProb,
                                                     correct: pred.predictedWinner === actualWinner,
                                                     resolvedAt: new Date().toISOString(),
                                         });
                               }

                               if (newOutcomes.length === 0) return prev;

                               const updated = {
                                         ...prev,
                                         outcomes: [...prev.outcomes, ...newOutcomes],
                               };
                        saveStore(updated);
                        return updated;
                });
  }, [games]);

  // Compute accuracy stats
  const stats = useMemo(() => {
        const total = store.outcomes.length;
        const correct = store.outcomes.filter((o) => o.correct).length;
        const accuracy = total > 0 ? (correct / total) * 100 : 0;

                            // Weekly breakdown for chart
                            const weeklyMap = new Map<string, { correct: number; total: number }>();
        for (const o of store.outcomes) {
                const date = new Date(o.resolvedAt);
                const weekStart = new Date(date);
                weekStart.setDate(date.getDate() - date.getDay());
                const key = weekStart.toISOString().slice(0, 10);
                const entry = weeklyMap.get(key) ?? { correct: 0, total: 0 };
                entry.total++;
                if (o.correct) entry.correct++;
                weeklyMap.set(key, entry);
        }

                            const weekly = [...weeklyMap.entries()]
          .sort(([a], [b]) => a.localeCompare(b))
          .slice(-12)
          .map(([week, { correct: c, total: t }]) => ({
                    week: week.slice(5), // "MM-DD"
                    accuracy: Math.round((c / t) * 100),
          }));

                            return {
                                    total,
                                    correct,
                                    accuracy: Math.round(accuracy * 10) / 10,
                                    weekly,
                                    pendingPredictions: store.predictions.length - store.outcomes.length,
                            };
  }, [store]);

  const clearHistory = useCallback(() => {
        const empty: OutcomeStore = { predictions: [], outcomes: [] };
        setStore(empty);
        saveStore(empty);
  }, []);

  return { stats, outcomes: store.outcomes, clearHistory };
}
