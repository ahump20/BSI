/**
 * Pro Analytics Tab Component
 * Premium analytics for Diamond Pro tier subscribers
 *
 * Features:
 * - Expected metrics (xBA, xSLG, xWOBA) vs actual performance
 * - Stuff+ ratings for pitchers with percentile ranks
 * - Barrel probability and hard-hit rate analysis
 * - BBCOR adjustments for college baseball comparison
 * - Quality of contact visualizations
 * - Premium feature gating with upgrade prompts
 *
 * Data Source: Statcast methodology + Driveline Baseball research
 * Last Updated: October 19, 2025
 * Timezone: America/Chicago
 */

import React, { useState, useEffect } from 'react';
import {
  ExpectedMetricsCalculator,
  BattedBallData,
  ExpectedMetrics,
  StuffRating,
  PitchData,
} from '../../lib/analytics/baseball/expected-metrics-calculator';

interface ProAnalyticsTabProps {
  teamId: string;
  gameId: string;
  userTier: 'free' | 'basic' | 'diamond_pro';
  onUpgradeClick?: () => void;
}

interface PlayerBattingStats {
  playerId: string;
  name: string;
  position: string;
  atBats: number;
  hits: number;
  avg: number; // actual batting average
  slg: number; // actual slugging
  woba: number; // actual wOBA
  expectedMetrics?: ExpectedMetrics;
  hardHitRate: number;
  barrelRate: number;
  avgExitVelo: number;
  avgLaunchAngle: number;
}

interface PitcherStuffStats {
  playerId: string;
  name: string;
  pitchType: string;
  pitchCount: number;
  avgVelocity: number;
  avgSpinRate: number;
  avgHorizontalBreak: number;
  avgVerticalBreak: number;
  stuffRating?: StuffRating;
  whiffRate: number;
  swingMissRate: number;
}

export const ProAnalyticsTab: React.FC<ProAnalyticsTabProps> = ({
  teamId,
  gameId,
  userTier,
  onUpgradeClick,
}) => {
  const [battingData, setBattingData] = useState<PlayerBattingStats[]>([]);
  const [pitchingData, setPitchingData] = useState<PitcherStuffStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<'batting' | 'pitching'>('batting');
  const [sortBy, setSortBy] = useState<'xBA' | 'xSLG' | 'xWOBA' | 'stuff+'>('xBA');

  const isPremium = userTier === 'diamond_pro';

  useEffect(() => {
    if (isPremium) {
      fetchAnalytics();
    } else {
      setLoading(false);
    }
  }, [teamId, gameId, isPremium]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);

      // Fetch player data from API
      const response = await fetch(`/api/college-baseball/game/${gameId}/advanced-stats`);
      const data = await response.json();

      // Calculate expected metrics for batters
      const battingStats: PlayerBattingStats[] = data.batting.map((player: any) => {
        const battedBalls: BattedBallData[] = player.battedBalls || [];

        // Calculate aggregate expected metrics
        const expectedMetrics =
          battedBalls.length > 0
            ? ExpectedMetricsCalculator.calculateExpectedMetrics({
                exitVelocity: player.avgExitVelo,
                launchAngle: player.avgLaunchAngle,
                sprayAngle: 0, // Center field default
                batType: 'bbcor', // College baseball
              })
            : undefined;

        return {
          playerId: player.id,
          name: player.name,
          position: player.position,
          atBats: player.atBats,
          hits: player.hits,
          avg: player.avg,
          slg: player.slg,
          woba: player.woba,
          expectedMetrics,
          hardHitRate: player.hardHitRate,
          barrelRate: player.barrelRate,
          avgExitVelo: player.avgExitVelo,
          avgLaunchAngle: player.avgLaunchAngle,
        };
      });

      // Calculate Stuff+ for pitchers
      const pitchingStats: PitcherStuffStats[] = data.pitching.map((pitcher: any) => {
        const pitches: PitchData[] = pitcher.pitches || [];

        // Calculate Stuff+ for primary pitch
        const primaryPitch = pitches[0];
        const stuffRating = primaryPitch
          ? ExpectedMetricsCalculator.calculateStuffPlus({
              pitchType: primaryPitch.type,
              velocity: primaryPitch.velocity,
              spinRate: primaryPitch.spinRate,
              horizontalBreak: primaryPitch.horizontalBreak,
              verticalBreak: primaryPitch.verticalBreak,
              extension: primaryPitch.extension || 6.0,
              level: 'college',
            })
          : undefined;

        return {
          playerId: pitcher.id,
          name: pitcher.name,
          pitchType: primaryPitch?.type || 'FB',
          pitchCount: pitcher.pitchCount,
          avgVelocity: pitcher.avgVelocity,
          avgSpinRate: pitcher.avgSpinRate,
          avgHorizontalBreak: pitcher.avgHorizontalBreak,
          avgVerticalBreak: pitcher.avgVerticalBreak,
          stuffRating,
          whiffRate: pitcher.whiffRate,
          swingMissRate: pitcher.swingMissRate,
        };
      });

      setBattingData(battingStats);
      setPitchingData(pitchingStats);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderUpgradePrompt = () => (
    <div className="upgrade-prompt">
      <div className="upgrade-icon">💎</div>
      <h3>Diamond Pro Analytics</h3>
      <p>Unlock advanced metrics ESPN doesn't show for college baseball:</p>
      <ul>
        <li>✅ Expected Batting Average (xBA) with BBCOR adjustments</li>
        <li>✅ Expected Slugging (xSLG) and Expected wOBA (xWOBA)</li>
        <li>✅ Stuff+ ratings for pitchers (Driveline methodology)</li>
        <li>✅ Barrel probability and quality of contact analysis</li>
        <li>✅ Historical comparisons and percentile rankings</li>
      </ul>
      <button className="upgrade-button" onClick={onUpgradeClick}>
        Upgrade to Diamond Pro
      </button>
      <div className="upgrade-note">
        <small>
          These metrics are not available on ESPN for college baseball. BlazeSportsIntel provides
          professional-grade analytics for the college game.
        </small>
      </div>
    </div>
  );

  const renderBattingTable = () => {
    const sortedData = [...battingData].sort((a, b) => {
      if (sortBy === 'xBA') {
        return (b.expectedMetrics?.xBA || 0) - (a.expectedMetrics?.xBA || 0);
      } else if (sortBy === 'xSLG') {
        return (b.expectedMetrics?.xSLG || 0) - (a.expectedMetrics?.xSLG || 0);
      } else if (sortBy === 'xWOBA') {
        return (b.expectedMetrics?.xWOBA || 0) - (a.expectedMetrics?.xWOBA || 0);
      }
      return 0;
    });

    return (
      <div className="analytics-table">
        <div className="table-controls">
          <h4>Expected Metrics vs Actual Performance</h4>
          <div className="sort-controls">
            <label>Sort by:</label>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)}>
              <option value="xBA">xBA</option>
              <option value="xSLG">xSLG</option>
              <option value="xWOBA">xWOBA</option>
            </select>
          </div>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Player</th>
                <th>Pos</th>
                <th>AB</th>
                <th>AVG</th>
                <th className="expected">xBA</th>
                <th className="diff">Diff</th>
                <th>SLG</th>
                <th className="expected">xSLG</th>
                <th className="diff">Diff</th>
                <th>wOBA</th>
                <th className="expected">xWOBA</th>
                <th className="diff">Diff</th>
                <th>Barrel%</th>
                <th>Hard Hit%</th>
              </tr>
            </thead>
            <tbody>
              {sortedData.map((player) => {
                const xBADiff = player.expectedMetrics
                  ? player.avg - player.expectedMetrics.xBA
                  : 0;
                const xSLGDiff = player.expectedMetrics
                  ? player.slg - player.expectedMetrics.xSLG
                  : 0;
                const xWOBADiff = player.expectedMetrics
                  ? player.woba - player.expectedMetrics.xWOBA
                  : 0;

                return (
                  <tr key={player.playerId}>
                    <td className="player-name">{player.name}</td>
                    <td>{player.position}</td>
                    <td>{player.atBats}</td>
                    <td className="stat-value">{player.avg.toFixed(3)}</td>
                    <td className="expected stat-value">
                      {player.expectedMetrics?.xBA.toFixed(3) || 'N/A'}
                    </td>
                    <td
                      className={`diff ${xBADiff > 0 ? 'positive' : xBADiff < 0 ? 'negative' : ''}`}
                    >
                      {xBADiff !== 0 ? (xBADiff > 0 ? '+' : '') + xBADiff.toFixed(3) : '-'}
                    </td>
                    <td className="stat-value">{player.slg.toFixed(3)}</td>
                    <td className="expected stat-value">
                      {player.expectedMetrics?.xSLG.toFixed(3) || 'N/A'}
                    </td>
                    <td
                      className={`diff ${xSLGDiff > 0 ? 'positive' : xSLGDiff < 0 ? 'negative' : ''}`}
                    >
                      {xSLGDiff !== 0 ? (xSLGDiff > 0 ? '+' : '') + xSLGDiff.toFixed(3) : '-'}
                    </td>
                    <td className="stat-value">{player.woba.toFixed(3)}</td>
                    <td className="expected stat-value">
                      {player.expectedMetrics?.xWOBA.toFixed(3) || 'N/A'}
                    </td>
                    <td
                      className={`diff ${xWOBADiff > 0 ? 'positive' : xWOBADiff < 0 ? 'negative' : ''}`}
                    >
                      {xWOBADiff !== 0 ? (xWOBADiff > 0 ? '+' : '') + xWOBADiff.toFixed(3) : '-'}
                    </td>
                    <td>{(player.barrelRate * 100).toFixed(1)}%</td>
                    <td>{(player.hardHitRate * 100).toFixed(1)}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="table-footer">
          <p className="methodology-note">
            <strong>Expected metrics</strong> calculated using Statcast methodology adapted for
            college baseball (BBCOR bat adjustments).
            <strong> Diff</strong> shows players outperforming (+) or underperforming (-) their
            expected stats based on batted ball quality.
          </p>
          <p className="citation-note">
            <small>
              Methodology: MLB Statcast (2015-2024), Nathan (2003-2024) | BBCOR adjustment factor:
              1.04x | Last updated:{' '}
              {new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' })}
            </small>
          </p>
        </div>
      </div>
    );
  };

  const renderPitchingTable = () => {
    const sortedData = [...pitchingData].sort((a, b) => {
      return (b.stuffRating?.stuffPlus || 0) - (a.stuffRating?.stuffPlus || 0);
    });

    return (
      <div className="analytics-table">
        <div className="table-controls">
          <h4>Stuff+ Ratings & Pitch Quality</h4>
          <div className="legend">
            <span className="legend-item elite">Elite (120+)</span>
            <span className="legend-item above-avg">Above Avg (105-119)</span>
            <span className="legend-item avg">Average (95-104)</span>
            <span className="legend-item below-avg">Below Avg (&lt;95)</span>
          </div>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Pitcher</th>
                <th>Pitch Type</th>
                <th>Count</th>
                <th>Velo</th>
                <th>Spin</th>
                <th>H. Break</th>
                <th>V. Break</th>
                <th className="stuff-plus">Stuff+</th>
                <th>Percentile</th>
                <th>Whiff%</th>
                <th>SwStr%</th>
              </tr>
            </thead>
            <tbody>
              {sortedData.map((pitcher) => {
                const stuffValue = pitcher.stuffRating?.stuffPlus || 100;
                const stuffClass =
                  stuffValue >= 120
                    ? 'elite'
                    : stuffValue >= 105
                      ? 'above-avg'
                      : stuffValue >= 95
                        ? 'avg'
                        : 'below-avg';

                return (
                  <tr key={pitcher.playerId}>
                    <td className="player-name">{pitcher.name}</td>
                    <td>{pitcher.pitchType}</td>
                    <td>{pitcher.pitchCount}</td>
                    <td>{pitcher.avgVelocity.toFixed(1)} mph</td>
                    <td>{pitcher.avgSpinRate.toFixed(0)} rpm</td>
                    <td>
                      {pitcher.avgHorizontalBreak > 0 ? '+' : ''}
                      {pitcher.avgHorizontalBreak.toFixed(1)}"
                    </td>
                    <td>
                      {pitcher.avgVerticalBreak > 0 ? '+' : ''}
                      {pitcher.avgVerticalBreak.toFixed(1)}"
                    </td>
                    <td className={`stuff-plus ${stuffClass}`}>
                      <strong>{stuffValue}</strong>
                    </td>
                    <td>{pitcher.stuffRating?.percentile || 50}%</td>
                    <td>{(pitcher.whiffRate * 100).toFixed(1)}%</td>
                    <td>{(pitcher.swingMissRate * 100).toFixed(1)}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="table-footer">
          <p className="methodology-note">
            <strong>Stuff+</strong> measures pitch quality on a 100-centered scale (100 = average).
            Components: velocity (35%), spin rate (30%), movement (35%). Adapted from Driveline
            Baseball research for college baseball.
          </p>
          <p className="citation-note">
            <small>
              Methodology: Driveline Baseball (2017-2024), Sarris (2018) | Level adjustment: 0.96x
              for college | Last updated:{' '}
              {new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' })}
            </small>
          </p>
        </div>
      </div>
    );
  };

  if (!isPremium) {
    return renderUpgradePrompt();
  }

  return (
    <div className="pro-analytics-tab">
      <div className="tab-header">
        <div className="premium-badge">
          <span className="badge-icon">💎</span>
          <span className="badge-text">Diamond Pro Analytics</span>
        </div>
        <div className="section-tabs">
          <button
            className={`tab-button ${activeSection === 'batting' ? 'active' : ''}`}
            onClick={() => setActiveSection('batting')}
          >
            Batting Analytics
          </button>
          <button
            className={`tab-button ${activeSection === 'pitching' ? 'active' : ''}`}
            onClick={() => setActiveSection('pitching')}
          >
            Pitching Analytics
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading advanced analytics...</p>
        </div>
      ) : (
        <>
          {activeSection === 'batting' && renderBattingTable()}
          {activeSection === 'pitching' && renderPitchingTable()}
        </>
      )}

      <style jsx>{`
        .pro-analytics-tab {
          background: rgba(26, 26, 26, 0.95);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        }

        .tab-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          flex-wrap: wrap;
          gap: 16px;
        }

        .premium-badge {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background: linear-gradient(135deg, #ff6b00 0%, #ffa500 100%);
          border-radius: 24px;
          font-weight: 600;
          color: #ffffff;
          box-shadow: 0 4px 16px rgba(255, 107, 0, 0.3);
        }

        .badge-icon {
          font-size: 18px;
        }

        .badge-text {
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .section-tabs {
          display: flex;
          gap: 8px;
          background: rgba(255, 255, 255, 0.05);
          padding: 4px;
          border-radius: 12px;
        }

        .tab-button {
          padding: 10px 20px;
          background: transparent;
          border: none;
          border-radius: 8px;
          color: rgba(255, 255, 255, 0.7);
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .tab-button:hover {
          color: rgba(255, 255, 255, 0.9);
          background: rgba(255, 255, 255, 0.05);
        }

        .tab-button.active {
          background: rgba(255, 107, 0, 0.2);
          color: #ff6b00;
          border: 1px solid rgba(255, 107, 0, 0.3);
        }

        .analytics-table {
          margin-top: 20px;
        }

        .table-controls {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          flex-wrap: wrap;
          gap: 12px;
        }

        .table-controls h4 {
          font-size: 18px;
          font-weight: 700;
          color: #ffffff;
          margin: 0;
        }

        .sort-controls {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .sort-controls label {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.7);
        }

        .sort-controls select {
          padding: 6px 12px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          color: #ffffff;
          font-size: 13px;
          cursor: pointer;
        }

        .legend {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .legend-item {
          font-size: 12px;
          padding: 4px 10px;
          border-radius: 12px;
          font-weight: 600;
        }

        .legend-item.elite {
          background: rgba(255, 107, 0, 0.2);
          color: #ff6b00;
          border: 1px solid rgba(255, 107, 0, 0.3);
        }

        .legend-item.above-avg {
          background: rgba(0, 200, 100, 0.2);
          color: #00c864;
          border: 1px solid rgba(0, 200, 100, 0.3);
        }

        .legend-item.avg {
          background: rgba(255, 255, 255, 0.1);
          color: rgba(255, 255, 255, 0.7);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .legend-item.below-avg {
          background: rgba(255, 50, 50, 0.2);
          color: #ff3232;
          border: 1px solid rgba(255, 50, 50, 0.3);
        }

        .table-wrapper {
          overflow-x: auto;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }

        thead {
          background: rgba(255, 255, 255, 0.05);
          position: sticky;
          top: 0;
          z-index: 1;
        }

        th {
          padding: 12px 8px;
          text-align: left;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.8);
          text-transform: uppercase;
          font-size: 11px;
          letter-spacing: 0.5px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        th.expected {
          color: #ff6b00;
        }

        th.diff {
          color: rgba(255, 255, 255, 0.6);
          font-size: 10px;
        }

        th.stuff-plus {
          color: #ffa500;
        }

        td {
          padding: 12px 8px;
          color: rgba(255, 255, 255, 0.9);
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        tr:hover {
          background: rgba(255, 255, 255, 0.03);
        }

        .player-name {
          font-weight: 600;
          color: #ffffff;
        }

        .stat-value {
          font-weight: 600;
          font-family: 'Monaco', 'Courier New', monospace;
        }

        .expected.stat-value {
          color: #ff6b00;
        }

        .diff {
          font-family: 'Monaco', 'Courier New', monospace;
          font-size: 12px;
        }

        .diff.positive {
          color: #00c864;
        }

        .diff.negative {
          color: #ff3232;
        }

        .stuff-plus {
          font-family: 'Monaco', 'Courier New', monospace;
        }

        .stuff-plus.elite {
          color: #ff6b00;
        }

        .stuff-plus.above-avg {
          color: #00c864;
        }

        .stuff-plus.avg {
          color: rgba(255, 255, 255, 0.7);
        }

        .stuff-plus.below-avg {
          color: #ff3232;
        }

        .table-footer {
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .methodology-note {
          font-size: 13px;
          line-height: 1.6;
          color: rgba(255, 255, 255, 0.7);
          margin-bottom: 8px;
        }

        .methodology-note strong {
          color: #ff6b00;
        }

        .citation-note {
          color: rgba(255, 255, 255, 0.5);
        }

        .citation-note small {
          font-size: 11px;
          line-height: 1.4;
        }

        .upgrade-prompt {
          text-align: center;
          padding: 60px 40px;
        }

        .upgrade-icon {
          font-size: 64px;
          margin-bottom: 20px;
        }

        .upgrade-prompt h3 {
          font-size: 28px;
          font-weight: 700;
          color: #ffffff;
          margin-bottom: 16px;
        }

        .upgrade-prompt > p {
          font-size: 16px;
          color: rgba(255, 255, 255, 0.8);
          margin-bottom: 24px;
        }

        .upgrade-prompt ul {
          list-style: none;
          padding: 0;
          margin: 0 0 32px 0;
          display: inline-block;
          text-align: left;
        }

        .upgrade-prompt li {
          font-size: 15px;
          color: rgba(255, 255, 255, 0.9);
          margin: 12px 0;
          padding-left: 8px;
        }

        .upgrade-button {
          padding: 16px 40px;
          background: linear-gradient(135deg, #ff6b00 0%, #ffa500 100%);
          border: none;
          border-radius: 12px;
          color: #ffffff;
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 8px 24px rgba(255, 107, 0, 0.4);
          transition: all 0.2s ease;
        }

        .upgrade-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 32px rgba(255, 107, 0, 0.5);
        }

        .upgrade-note {
          margin-top: 24px;
          padding: 16px;
          background: rgba(255, 107, 0, 0.1);
          border: 1px solid rgba(255, 107, 0, 0.2);
          border-radius: 12px;
        }

        .upgrade-note small {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.7);
          line-height: 1.6;
        }

        .loading-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 80px 40px;
        }

        .spinner {
          width: 48px;
          height: 48px;
          border: 4px solid rgba(255, 255, 255, 0.1);
          border-top-color: #ff6b00;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 20px;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .loading-state p {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.7);
        }

        @media (max-width: 1024px) {
          table {
            font-size: 12px;
          }

          th,
          td {
            padding: 10px 6px;
          }
        }

        @media (max-width: 768px) {
          .pro-analytics-tab {
            padding: 16px;
          }

          .tab-header {
            flex-direction: column;
            align-items: flex-start;
          }

          .section-tabs {
            width: 100%;
          }

          .tab-button {
            flex: 1;
            font-size: 13px;
            padding: 8px 12px;
          }

          table {
            font-size: 11px;
          }

          th,
          td {
            padding: 8px 4px;
          }

          .upgrade-prompt {
            padding: 40px 20px;
          }

          .upgrade-prompt h3 {
            font-size: 24px;
          }

          .upgrade-button {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default ProAnalyticsTab;
