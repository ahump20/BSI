'use client';

import { useEffect, useState, useRef } from 'react';

interface WinProbData {
  gameId: string;
  timestamp: string;
  winProb: {
    home: number;
    away: number;
  };
  nextPlay?: Record<string, number>;
  finalScoreDist?: Array<{
    homeScore: number;
    awayScore: number;
    probability: number;
  }>;
  leverageIndex?: number;
  numSims: number;
  stateHash: string;
}

interface GameState {
  inning?: number;
  inningHalf?: 'top' | 'bottom';
  outs?: number;
  baseState?: number;
  homeScore: number;
  awayScore: number;
}

interface LiveWinProbabilityProps {
  gameId: string;
  homeTeam?: string;
  awayTeam?: string;
  workerUrl?: string;
  showNextPlay?: boolean;
  showChart?: boolean;
  className?: string;
}

export default function LiveWinProbability({
  gameId,
  homeTeam = 'Home',
  awayTeam = 'Away',
  workerUrl = 'https://blazesports-live-sim.workers.dev',
  showNextPlay = true,
  showChart = false,
  className = ''
}: LiveWinProbabilityProps) {
  const [data, setData] = useState<WinProbData | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<Array<{ timestamp: Date; homeProb: number }>>([]);
  const eventSourceRef = useRef<EventSource | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch initial snapshot
  useEffect(() => {
    async function fetchSnapshot() {
      try {
        const response = await fetch(`${workerUrl}/snapshot/${gameId}`);
        if (response.ok) {
          const snapshot = await response.json();
          if (snapshot.simulation) {
            setData(snapshot.simulation);
            setHistory([{
              timestamp: new Date(snapshot.simulation.timestamp),
              homeProb: snapshot.simulation.winProb.home
            }]);
          }
          if (snapshot.gameState) {
            setGameState(snapshot.gameState);
          }
        }
      } catch (err) {
        console.error('Failed to fetch snapshot:', err);
      }
    }

    fetchSnapshot();
  }, [gameId, workerUrl]);

  // Connect to SSE stream
  useEffect(() => {
    const sseUrl = `${workerUrl}/live/${gameId}`;

    try {
      const eventSource = new EventSource(sseUrl);
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        setConnected(true);
        setError(null);
      };

      eventSource.onmessage = (event) => {
        try {
          const newData = JSON.parse(event.data) as WinProbData;
          setData(newData);

          // Update history (keep last 50 points)
          setHistory(prev => {
            const updated = [...prev, {
              timestamp: new Date(newData.timestamp),
              homeProb: newData.winProb.home
            }];
            return updated.slice(-50);
          });

          setError(null);
        } catch (err) {
          console.error('Failed to parse SSE data:', err);
        }
      };

      eventSource.onerror = (err) => {
        console.error('SSE error:', err);
        setConnected(false);
        setError('Connection lost. Switching to polling...');

        // Fallback to polling
        eventSource.close();
        startPolling();
      };

      return () => {
        eventSource.close();
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
        }
      };
    } catch (err) {
      console.error('Failed to create SSE connection:', err);
      setError('Failed to connect. Using polling mode.');
      startPolling();

      return () => {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
        }
      };
    }
  }, [gameId, workerUrl]);

  function startPolling() {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    pollingIntervalRef.current = setInterval(async () => {
      try {
        const response = await fetch(`${workerUrl}/snapshot/${gameId}`);
        if (response.ok) {
          const snapshot = await response.json();
          if (snapshot.simulation) {
            setData(snapshot.simulation);
            setHistory(prev => {
              const updated = [...prev, {
                timestamp: new Date(snapshot.simulation.timestamp),
                homeProb: snapshot.simulation.winProb.home
              }];
              return updated.slice(-50);
            });
          }
          if (snapshot.gameState) {
            setGameState(snapshot.gameState);
          }
          setError(null);
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 5000);
  }

  function formatBaseState(baseState: number | undefined): string {
    if (baseState === undefined) return '---';
    const bases = [];
    if (baseState & 1) bases.push('1st');
    if (baseState & 2) bases.push('2nd');
    if (baseState & 4) bases.push('3rd');
    return bases.length > 0 ? bases.join(', ') : '---';
  }

  if (!data) {
    return (
      <div className={`animate-pulse bg-slate-800 rounded-lg p-6 ${className}`}>
        <div className="h-6 bg-slate-700 rounded w-1/2 mb-4"></div>
        <div className="h-20 bg-slate-700 rounded"></div>
      </div>
    );
  }

  const homeProb = (data.winProb.home * 100).toFixed(1);
  const awayProb = (data.winProb.away * 100).toFixed(1);

  return (
    <div className={`bg-gradient-to-br from-slate-900 to-slate-800 rounded-lg p-6 shadow-xl ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Live Win Probability</h3>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`} />
          <span className="text-xs text-gray-400">
            {connected ? 'Live' : 'Polling'}
          </span>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-2 bg-yellow-900/30 border border-yellow-700 rounded text-xs text-yellow-400">
          {error}
        </div>
      )}

      {/* Win Probabilities */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="text-center p-4 bg-slate-800/50 rounded-lg">
          <div className="text-sm text-gray-400 mb-1">{homeTeam}</div>
          <div className="text-4xl font-bold text-orange-500">{homeProb}%</div>
          {gameState && (
            <div className="text-sm text-gray-500 mt-1">{gameState.homeScore}</div>
          )}
        </div>
        <div className="text-center p-4 bg-slate-800/50 rounded-lg">
          <div className="text-sm text-gray-400 mb-1">{awayTeam}</div>
          <div className="text-4xl font-bold text-red-500">{awayProb}%</div>
          {gameState && (
            <div className="text-sm text-gray-500 mt-1">{gameState.awayScore}</div>
          )}
        </div>
      </div>

      {/* Game State */}
      {gameState && (
        <div className="mb-6 p-4 bg-slate-800/30 rounded-lg">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <div className="text-xs text-gray-400 mb-1">INNING</div>
              <div className="text-lg font-semibold text-orange-500">
                {gameState.inning ? `${gameState.inning}${gameState.inningHalf?.[0].toUpperCase()}` : '--'}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-400 mb-1">OUTS</div>
              <div className="text-lg font-semibold text-orange-500">
                {gameState.outs ?? '--'}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-400 mb-1">BASES</div>
              <div className="text-sm font-semibold text-orange-500">
                {formatBaseState(gameState.baseState)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Leverage Index */}
      {data.leverageIndex !== undefined && (
        <div className="mb-4 text-center">
          <div className="inline-block px-4 py-2 bg-slate-800/50 rounded-lg">
            <span className="text-xs text-gray-400">LEVERAGE INDEX: </span>
            <span className="text-sm font-bold text-white">{data.leverageIndex.toFixed(2)}</span>
          </div>
        </div>
      )}

      {/* Simple Chart */}
      {showChart && history.length > 1 && (
        <div className="mb-6 p-4 bg-slate-800/30 rounded-lg">
          <div className="text-xs text-gray-400 mb-2">Win Probability Trend</div>
          <div className="h-24 flex items-end gap-1">
            {history.map((point, i) => (
              <div
                key={i}
                className="flex-1 bg-gradient-to-t from-orange-600 to-orange-400 rounded-t"
                style={{ height: `${point.homeProb * 100}%` }}
                title={`${(point.homeProb * 100).toFixed(1)}%`}
              />
            ))}
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </div>
      )}

      {/* Next Play Probabilities */}
      {showNextPlay && data.nextPlay && (
        <div className="pt-4 border-t border-gray-700">
          <div className="text-sm text-gray-400 mb-3">Next Play Probabilities</div>
          <div className="space-y-2">
            {Object.entries(data.nextPlay)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 5)
              .map(([outcome, prob]) => (
                <div key={outcome} className="flex items-center gap-2">
                  <div className="text-xs text-gray-400 w-20 capitalize">
                    {outcome.replace(/([A-Z])/g, ' $1').trim()}
                  </div>
                  <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-orange-500 to-red-500 transition-all duration-300"
                      style={{ width: `${prob * 100}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-400 w-12 text-right">
                    {(prob * 100).toFixed(1)}%
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Metadata */}
      <div className="mt-4 pt-4 border-t border-gray-700 text-xs text-gray-500 text-center">
        {data.numSims.toLocaleString()} simulations • Updated{' '}
        {new Date(data.timestamp).toLocaleTimeString()}
      </div>
    </div>
  );
}
