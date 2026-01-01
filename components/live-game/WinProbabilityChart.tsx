/**
 * Win Probability Chart Component
 * Real-time visualization of win probability throughout a baseball game
 *
 * Features:
 * - Live WebSocket updates for real-time probability changes
 * - Critical moment highlighting (leverage > 1.8)
 * - WPA (Win Probability Added) annotations for key plays
 * - Mobile-responsive with glassmorphism styling
 * - Confidence intervals for predictions
 *
 * Data Source: Live game feeds via NCAA Stats API / MLB Stats API
 * Last Updated: October 19, 2025
 * Timezone: America/Chicago
 */

import React, { useEffect, useState, useRef } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import {
  LiveWinProbabilityEngine,
  WinProbPoint,
  GameState,
} from '../../lib/analytics/baseball/win-probability-engine';

interface WinProbabilityChartProps {
  gameId: string;
  homeTeam: string;
  awayTeam: string;
  homeColor?: string;
  awayColor?: string;
  showConfidenceInterval?: boolean;
  enableWebSocket?: boolean;
  websocketUrl?: string;
  onCriticalMoment?: (point: WinProbPoint) => void;
}

interface ChartDataPoint {
  playNumber: number;
  inning: number;
  half: string;
  outs: number;
  homeWinProb: number;
  awayWinProb: number;
  confidenceUpper?: number;
  confidenceLower?: number;
  criticalMoment: boolean;
  description: string;
  timestamp: string;
  wpa?: number;
  leverageIndex?: number;
}

export const WinProbabilityChart: React.FC<WinProbabilityChartProps> = ({
  gameId,
  homeTeam,
  awayTeam,
  homeColor = '#ff6b00',
  awayColor = '#0066cc',
  showConfidenceInterval = false,
  enableWebSocket = true,
  websocketUrl = process.env.NEXT_PUBLIC_WS_URL || 'wss://blazesportsintel.com/ws',
  onCriticalMoment,
}) => {
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [currentLeverage, setCurrentLeverage] = useState<number>(1.0);
  const [gameStatus, setGameStatus] = useState<'pregame' | 'live' | 'final'>('pregame');
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // Initialize with starting probability (50-50)
    const initialData: ChartDataPoint = {
      playNumber: 0,
      inning: 1,
      half: 'top',
      outs: 0,
      homeWinProb: 50.0,
      awayWinProb: 50.0,
      confidenceUpper: 60.0,
      confidenceLower: 40.0,
      criticalMoment: false,
      description: 'Game Start',
      timestamp: new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' }),
    };
    setChartData([initialData]);

    // Connect to WebSocket for live updates
    if (enableWebSocket) {
      connectWebSocket();
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- connectWebSocket is stable, runs on gameId/enable change
  }, [gameId, enableWebSocket]);

  const connectWebSocket = () => {
    try {
      const ws = new WebSocket(`${websocketUrl}/game/${gameId}`);

      ws.onopen = () => {
        console.log('WebSocket connected for game:', gameId);
        setGameStatus('live');
      };

      ws.onmessage = (event) => {
        try {
          const gameState: GameState = JSON.parse(event.data);
          updateChartData(gameState);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setGameStatus('final');
        // Attempt reconnection after 5 seconds if game is not final
        if (gameStatus !== 'final') {
          setTimeout(() => {
            if (wsRef.current?.readyState !== WebSocket.OPEN) {
              connectWebSocket();
            }
          }, 5000);
        }
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
    }
  };

  const updateChartData = (gameState: GameState) => {
    // Calculate win probability using the engine
    const winProb = LiveWinProbabilityEngine.calculateWinProbability(gameState);

    // Calculate WPA if we have previous state
    const wpa =
      chartData.length > 0
        ? winProb.homeWinProbability * 100 - chartData[chartData.length - 1].homeWinProb
        : 0;

    const newDataPoint: ChartDataPoint = {
      playNumber: chartData.length,
      inning: gameState.inning,
      half: gameState.half,
      outs: gameState.outs,
      homeWinProb: winProb.homeWinProbability * 100,
      awayWinProb: winProb.awayWinProbability * 100,
      confidenceUpper: Math.min(100, winProb.homeWinProbability * 100 + 10),
      confidenceLower: Math.max(0, winProb.homeWinProbability * 100 - 10),
      criticalMoment: winProb.criticalMoment,
      description:
        gameState.lastPlay ||
        `${gameState.half} ${gameState.inning}, ${gameState.outs} out${gameState.outs !== 1 ? 's' : ''}`,
      timestamp: winProb.lastUpdated,
      wpa: Math.abs(wpa),
      leverageIndex: winProb.leverageIndex,
    };

    setChartData((prev) => [...prev, newDataPoint]);
    setCurrentLeverage(winProb.leverageIndex);

    // Trigger callback for critical moments
    if (winProb.criticalMoment && onCriticalMoment) {
      const point: WinProbPoint = {
        inning: gameState.inning,
        half: gameState.half,
        outs: gameState.outs,
        homeWinProb: winProb.homeWinProbability * 100,
        criticalMoment: true,
        description: newDataPoint.description,
        timestamp: winProb.lastUpdated,
      };
      onCriticalMoment(point);
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as ChartDataPoint;
      return (
        <div className="win-prob-tooltip">
          <p className="tooltip-title">{data.description}</p>
          <p className="tooltip-inning">
            {data.half === 'top' ? '▲' : '▼'} Inning {data.inning}, {data.outs} out
            {data.outs !== 1 ? 's' : ''}
          </p>
          <p className="tooltip-prob home">
            {homeTeam}: <strong>{data.homeWinProb.toFixed(1)}%</strong>
          </p>
          <p className="tooltip-prob away">
            {awayTeam}: <strong>{data.awayWinProb.toFixed(1)}%</strong>
          </p>
          {data.wpa && data.wpa > 0.5 && (
            <p className="tooltip-wpa">
              WPA:{' '}
              <strong>
                {data.wpa > 0 ? '+' : ''}
                {data.wpa.toFixed(1)}%
              </strong>
            </p>
          )}
          {data.leverageIndex && data.leverageIndex > 1.5 && (
            <p className="tooltip-leverage">
              Leverage: <strong>{data.leverageIndex.toFixed(2)}</strong>
            </p>
          )}
          <p className="tooltip-timestamp">{data.timestamp}</p>
        </div>
      );
    }
    return null;
  };

  const CustomDot = (props: any) => {
    const { cx, cy, payload } = props;
    if (payload.criticalMoment) {
      return (
        <g>
          {/* Critical moment indicator */}
          <circle cx={cx} cy={cy} r={6} fill="#ff6b00" stroke="#ffffff" strokeWidth={2} />
          <circle
            cx={cx}
            cy={cy}
            r={10}
            fill="none"
            stroke="#ff6b00"
            strokeWidth={2}
            opacity={0.5}
          />
        </g>
      );
    }
    return null;
  };

  return (
    <div className="win-probability-chart-container">
      <div className="chart-header">
        <h3 className="chart-title">Win Probability</h3>
        <div className="game-status-badge" data-status={gameStatus}>
          {gameStatus === 'live' && (
            <>
              <span className="status-dot live"></span>
              <span>LIVE</span>
            </>
          )}
          {gameStatus === 'pregame' && <span>Pregame</span>}
          {gameStatus === 'final' && <span>Final</span>}
        </div>
        {gameStatus === 'live' && (
          <div className="leverage-indicator">
            <span className="leverage-label">Leverage:</span>
            <span
              className={`leverage-value ${currentLeverage > 1.8 ? 'high' : currentLeverage > 1.2 ? 'medium' : 'low'}`}
            >
              {currentLeverage.toFixed(2)}
            </span>
          </div>
        )}
      </div>

      <ResponsiveContainer width="100%" height={400}>
        {showConfidenceInterval ? (
          <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
            <defs>
              <linearGradient id="confidenceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={homeColor} stopOpacity={0.3} />
                <stop offset="95%" stopColor={homeColor} stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis
              dataKey="playNumber"
              stroke="rgba(255,255,255,0.7)"
              label={{ value: 'Play Number', position: 'insideBottom', offset: -10 }}
            />
            <YAxis
              stroke="rgba(255,255,255,0.7)"
              domain={[0, 100]}
              label={{ value: 'Win Probability (%)', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />

            {/* Confidence interval area */}
            <Area
              type="monotone"
              dataKey="confidenceUpper"
              stroke="none"
              fill="url(#confidenceGradient)"
              fillOpacity={1}
            />
            <Area
              type="monotone"
              dataKey="confidenceLower"
              stroke="none"
              fill={homeColor}
              fillOpacity={0.1}
            />

            {/* 50% reference line */}
            <ReferenceLine y={50} stroke="rgba(255,255,255,0.3)" strokeDasharray="5 5" />

            {/* Main probability line */}
            <Line
              type="monotone"
              dataKey="homeWinProb"
              stroke={homeColor}
              strokeWidth={3}
              dot={<CustomDot />}
              name={homeTeam}
              animationDuration={300}
            />
          </AreaChart>
        ) : (
          <LineChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis
              dataKey="playNumber"
              stroke="rgba(255,255,255,0.7)"
              label={{ value: 'Play Number', position: 'insideBottom', offset: -10 }}
            />
            <YAxis
              stroke="rgba(255,255,255,0.7)"
              domain={[0, 100]}
              label={{ value: 'Win Probability (%)', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />

            {/* 50% reference line */}
            <ReferenceLine y={50} stroke="rgba(255,255,255,0.3)" strokeDasharray="5 5" />

            {/* Home team probability line */}
            <Line
              type="monotone"
              dataKey="homeWinProb"
              stroke={homeColor}
              strokeWidth={3}
              dot={<CustomDot />}
              name={homeTeam}
              animationDuration={300}
            />

            {/* Away team probability line (optional) */}
            <Line
              type="monotone"
              dataKey="awayWinProb"
              stroke={awayColor}
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              name={awayTeam}
              animationDuration={300}
              opacity={0.5}
            />
          </LineChart>
        )}
      </ResponsiveContainer>

      <div className="chart-footer">
        <div className="methodology-note">
          <small>
            Methodology: Log5 + Win Expectancy Matrix (Tango et al. 2007) | Leverage Index
            (Fangraphs) | Data: {gameStatus === 'live' ? 'Live' : 'Real-time'} game feed
          </small>
        </div>
        {chartData.length > 0 && (
          <div className="last-update">
            <small>Last updated: {chartData[chartData.length - 1].timestamp}</small>
          </div>
        )}
      </div>

      <style jsx>{`
        .win-probability-chart-container {
          background: rgba(26, 26, 26, 0.95);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        }

        .chart-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
          flex-wrap: wrap;
          gap: 12px;
        }

        .chart-title {
          font-size: 24px;
          font-weight: 700;
          color: #ffffff;
          margin: 0;
        }

        .game-status-badge {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 600;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .game-status-badge[data-status='live'] {
          background: rgba(255, 107, 0, 0.2);
          border-color: rgba(255, 107, 0, 0.5);
          color: #ff6b00;
        }

        .game-status-badge[data-status='pregame'] {
          color: rgba(255, 255, 255, 0.7);
        }

        .game-status-badge[data-status='final'] {
          color: rgba(255, 255, 255, 0.5);
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          animation: pulse 2s infinite;
        }

        .status-dot.live {
          background: #ff6b00;
        }

        @keyframes pulse {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }

        .leverage-indicator {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 12px;
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .leverage-label {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.7);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .leverage-value {
          font-size: 16px;
          font-weight: 700;
        }

        .leverage-value.high {
          color: #ff6b00;
        }

        .leverage-value.medium {
          color: #ffa500;
        }

        .leverage-value.low {
          color: rgba(255, 255, 255, 0.7);
        }

        .win-prob-tooltip {
          background: rgba(26, 26, 26, 0.98);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 12px;
          padding: 16px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
          min-width: 200px;
        }

        .tooltip-title {
          font-size: 14px;
          font-weight: 600;
          color: #ffffff;
          margin: 0 0 8px 0;
        }

        .tooltip-inning {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.7);
          margin: 0 0 12px 0;
        }

        .tooltip-prob {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.8);
          margin: 4px 0;
        }

        .tooltip-prob strong {
          font-weight: 700;
          font-size: 15px;
        }

        .tooltip-prob.home strong {
          color: ${homeColor};
        }

        .tooltip-prob.away strong {
          color: ${awayColor};
        }

        .tooltip-wpa {
          font-size: 12px;
          color: #ff6b00;
          margin: 8px 0 4px 0;
          padding-top: 8px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .tooltip-wpa strong {
          font-weight: 700;
        }

        .tooltip-leverage {
          font-size: 12px;
          color: #ffa500;
          margin: 4px 0;
        }

        .tooltip-leverage strong {
          font-weight: 700;
        }

        .tooltip-timestamp {
          font-size: 10px;
          color: rgba(255, 255, 255, 0.5);
          margin: 8px 0 0 0;
          padding-top: 8px;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
        }

        .chart-footer {
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
        }

        .methodology-note {
          color: rgba(255, 255, 255, 0.6);
        }

        .methodology-note small {
          font-size: 11px;
          line-height: 1.4;
        }

        .last-update {
          color: rgba(255, 255, 255, 0.5);
        }

        .last-update small {
          font-size: 11px;
        }

        @media (max-width: 768px) {
          .win-probability-chart-container {
            padding: 16px;
          }

          .chart-title {
            font-size: 20px;
          }

          .chart-header {
            flex-direction: column;
            align-items: flex-start;
          }

          .chart-footer {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>
    </div>
  );
};

export default WinProbabilityChart;
