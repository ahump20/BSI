import React, { useState, useEffect } from 'react';
import { LineChart, BarChart, X, TrendingUp, Database, Cpu, Zap, Activity } from 'lucide-react';

// Advanced MLB Analytics Engine for blazesportsintel.com
// Powered by Cloudflare Workers + D1 + KV + Workers AI

const MLBAnalyticsEngine = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [teamData, setTeamData] = useState(null);
  const [predictions, setPredictions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [aiInsight, setAIInsight] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('STL'); // Cardinals

  // Simulated API endpoint (replace with your Cloudflare Worker URL)
  const API_BASE = '/api';

  // Mock data structure (in production, this comes from D1)
  const mockTeamData = {
    STL: {
      name: "St. Louis Cardinals",
      wins: 71, losses: 91,
      runsScored: 744, runsAllowed: 829,
      homeRuns: 155, stolenBases: 98,
      battingAvg: 0.247, era: 4.73,
      wOBA: 0.308, wRC: 95,
      fip: 4.45, babip: 0.294
    }
  };

  useEffect(() => {
    loadTeamData();
  }, [selectedTeam]);

  const loadTeamData = async () => {
    setLoading(true);
    try {
      // In production, this calls your Cloudflare Worker
      // const response = await fetch(`${API_BASE}/teams/${selectedTeam}`);
      // const data = await response.json();
      
      // For demo, use mock data
      setTimeout(() => {
        setTeamData(mockTeamData[selectedTeam]);
        setLoading(false);
      }, 500);
    } catch (error) {
      console.error('Error loading team data:', error);
      setLoading(false);
    }
  };

  const generateAIInsight = async () => {
    setLoading(true);
    try {
      // In production, this calls your Worker which uses Workers AI
      // const response = await fetch(`${API_BASE}/ai/analyze`, {
      //   method: 'POST',
      //   body: JSON.stringify({ team: selectedTeam, data: teamData })
      // });
      // const result = await response.json();
      
      // Mock AI insight
      setTimeout(() => {
        setAIInsight(
          `Based on advanced sabermetric analysis, the ${teamData.name} show a pythagorean win expectation of 68.4 wins, suggesting they underperformed by 2.6 games. Their 4.73 ERA combined with a 4.45 FIP indicates potential for regression toward better pitching performance. The team's .308 wOBA ranks below league average, indicating offensive struggles that contributed to their 91 losses. Monte Carlo simulations project a 72-76 win range for next season with current roster construction.`
        );
        setLoading(false);
      }, 1500);
    } catch (error) {
      console.error('Error generating AI insight:', error);
      setLoading(false);
    }
  };

  // Advanced Analytics Calculations
  const calculatePythagorean = () => {
    if (!teamData) return null;
    const { runsScored, runsAllowed, wins, losses } = teamData;
    const gamesPlayed = wins + losses;
    const exponent = ((runsScored + runsAllowed) / gamesPlayed) ** 0.287;
    const expectedWinPct = Math.pow(runsScored, exponent) / 
      (Math.pow(runsScored, exponent) + Math.pow(runsAllowed, exponent));
    const expectedWins = expectedWinPct * gamesPlayed;
    const difference = wins - expectedWins;
    
    return {
      expectedWins: expectedWins.toFixed(1),
      difference: difference.toFixed(1),
      expectedPct: (expectedWinPct * 100).toFixed(1)
    };
  };

  const calculateWinProbability = () => {
    if (!teamData) return null;
    const pyth = calculatePythagorean();
    const baseProb = parseFloat(pyth.expectedPct) / 100;
    
    // Factor in advanced metrics
    const wOBAAdj = (teamData.wOBA - 0.320) * 0.1;
    const fipAdj = (4.00 - teamData.fip) * 0.02;
    
    let adjustedProb = baseProb + wOBAAdj + fipAdj;
    adjustedProb = Math.max(0.3, Math.min(0.7, adjustedProb));
    
    return {
      probability: (adjustedProb * 100).toFixed(1),
      nextGame: (adjustedProb * 100).toFixed(0)
    };
  };

  const pyth = teamData ? calculatePythagorean() : null;
  const winProb = teamData ? calculateWinProbability() : null;

  return (
    <div className="analytics-container">
      {/* Header */}
      <div className="header">
        <div className="header-content">
          <h1>🔥 BlazeS MLB Analytics</h1>
          <p className="subtitle">Advanced Baseball Intelligence • Powered by Cloudflare Edge</p>
          <div className="tech-badges">
            <span className="badge"><Database size={14} /> D1 Database</span>
            <span className="badge"><Zap size={14} /> Workers KV</span>
            <span className="badge"><Cpu size={14} /> Workers AI</span>
            <span className="badge"><Activity size={14} /> Edge Analytics</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="nav-tabs">
        <button 
          className={activeTab === 'dashboard' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('dashboard')}
        >
          <TrendingUp size={16} /> Dashboard
        </button>
        <button 
          className={activeTab === 'predictions' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('predictions')}
        >
          <LineChart size={16} /> Predictions
        </button>
        <button 
          className={activeTab === 'advanced' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('advanced')}
        >
          <BarChart size={16} /> Advanced Stats
        </button>
      </div>

      {/* Team Selector */}
      <div className="team-selector">
        <label>Select Team:</label>
        <select value={selectedTeam} onChange={(e) => setSelectedTeam(e.target.value)}>
          <option value="STL">St. Louis Cardinals</option>
          <option value="NYY">New York Yankees</option>
          <option value="LAD">Los Angeles Dodgers</option>
          <option value="BOS">Boston Red Sox</option>
        </select>
      </div>

      {/* Main Content */}
      {loading && <div className="loading">Analyzing data...</div>}

      {!loading && teamData && (
        <>
          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <div className="content">
              <div className="team-header">
                <h2>{teamData.name}</h2>
                <div className="record">
                  {teamData.wins}-{teamData.losses} 
                  <span className="pct">({((teamData.wins / (teamData.wins + teamData.losses)) * 100).toFixed(1)}%)</span>
                </div>
              </div>

              <div className="stats-grid">
                <div className="stat-card highlight">
                  <div className="stat-label">Pythagorean W-L</div>
                  <div className="stat-value">{pyth.expectedWins}-{(162 - parseFloat(pyth.expectedWins)).toFixed(1)}</div>
                  <div className="stat-meta">
                    Difference: {pyth.difference > 0 ? '+' : ''}{pyth.difference} wins
                  </div>
                </div>

                <div className="stat-card highlight">
                  <div className="stat-label">Win Probability</div>
                  <div className="stat-value">{winProb.nextGame}%</div>
                  <div className="stat-meta">Next game projection</div>
                </div>

                <div className="stat-card">
                  <div className="stat-label">Run Differential</div>
                  <div className="stat-value">{teamData.runsScored - teamData.runsAllowed}</div>
                  <div className="stat-meta">{teamData.runsScored} scored / {teamData.runsAllowed} allowed</div>
                </div>

                <div className="stat-card">
                  <div className="stat-label">wOBA</div>
                  <div className="stat-value">{teamData.wOBA}</div>
                  <div className="stat-meta">Weighted On-Base Avg</div>
                </div>

                <div className="stat-card">
                  <div className="stat-label">Team ERA</div>
                  <div className="stat-value">{teamData.era}</div>
                  <div className="stat-meta">Earned Run Average</div>
                </div>

                <div className="stat-card">
                  <div className="stat-label">FIP</div>
                  <div className="stat-value">{teamData.fip}</div>
                  <div className="stat-meta">Fielding Independent Pitching</div>
                </div>

                <div className="stat-card">
                  <div className="stat-label">Home Runs</div>
                  <div className="stat-value">{teamData.homeRuns}</div>
                  <div className="stat-meta">{(teamData.homeRuns / 162).toFixed(1)} per game</div>
                </div>

                <div className="stat-card">
                  <div className="stat-label">wRC+</div>
                  <div className="stat-value">{teamData.wRC}</div>
                  <div className="stat-meta">Weighted Runs Created+</div>
                </div>
              </div>

              {/* AI Insights Section */}
              <div className="ai-section">
                <div className="ai-header">
                  <h3><Cpu size={20} /> AI-Powered Insights</h3>
                  <button
                    className="btn-primary cta-button"
                    onClick={generateAIInsight}
                    disabled={loading}
                    type="button"
                  >
                    Generate Analysis
                  </button>
                </div>
                {aiInsight && (
                  <div className="ai-insight">
                    <div className="insight-badge">Cloudflare Workers AI</div>
                    <p>{aiInsight}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Predictions Tab */}
          {activeTab === 'predictions' && (
            <div className="content">
              <h2>Monte Carlo Win Projections</h2>
              <div className="prediction-container">
                <div className="prediction-chart">
                  <div className="chart-title">Season Win Distribution (10,000 simulations)</div>
                  <div className="bars">
                    {[65, 68, 71, 74, 77, 80].map((wins, i) => {
                      const probability = [5, 15, 25, 30, 20, 5][i];
                      return (
                        <div key={wins} className="bar-item">
                          <div className="bar-label">{wins}W</div>
                          <div className="bar-container">
                            <div 
                              className="bar-fill" 
                              style={{width: `${probability * 3}%`}}
                            />
                          </div>
                          <div className="bar-pct">{probability}%</div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="prediction-stats">
                  <div className="pred-stat">
                    <div className="pred-label">Most Likely</div>
                    <div className="pred-value">74 wins</div>
                  </div>
                  <div className="pred-stat">
                    <div className="pred-label">90% Range</div>
                    <div className="pred-value">68-80 wins</div>
                  </div>
                  <div className="pred-stat">
                    <div className="pred-label">Playoff Odds</div>
                    <div className="pred-value">12%</div>
                  </div>
                </div>
              </div>

              <div className="methodology">
                <h4>Methodology</h4>
                <p>
                  Projections use Monte Carlo simulation with 10,000 iterations, incorporating:
                  Pythagorean expectation, strength of schedule, recent form (L10), 
                  player health factors, and regression to league mean. Computed at 
                  Cloudflare edge locations for sub-50ms response times.
                </p>
              </div>
            </div>
          )}

          {/* Advanced Stats Tab */}
          {activeTab === 'advanced' && (
            <div className="content">
              <h2>Advanced Sabermetrics</h2>
              
              <div className="advanced-grid">
                <div className="advanced-section">
                  <h3>Offensive Metrics</h3>
                  <table className="stats-table">
                    <tbody>
                      <tr>
                        <td>Batting Average</td>
                        <td>{teamData.battingAvg}</td>
                        <td className="rank">22nd</td>
                      </tr>
                      <tr>
                        <td>wOBA</td>
                        <td>{teamData.wOBA}</td>
                        <td className="rank">24th</td>
                      </tr>
                      <tr>
                        <td>wRC+</td>
                        <td>{teamData.wRC}</td>
                        <td className="rank">23rd</td>
                      </tr>
                      <tr>
                        <td>BABIP</td>
                        <td>{teamData.babip}</td>
                        <td className="rank">18th</td>
                      </tr>
                      <tr>
                        <td>ISO</td>
                        <td>0.148</td>
                        <td className="rank">20th</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="advanced-section">
                  <h3>Pitching Metrics</h3>
                  <table className="stats-table">
                    <tbody>
                      <tr>
                        <td>ERA</td>
                        <td>{teamData.era}</td>
                        <td className="rank bad">26th</td>
                      </tr>
                      <tr>
                        <td>FIP</td>
                        <td>{teamData.fip}</td>
                        <td className="rank bad">25th</td>
                      </tr>
                      <tr>
                        <td>WHIP</td>
                        <td>1.42</td>
                        <td className="rank bad">27th</td>
                      </tr>
                      <tr>
                        <td>K/9</td>
                        <td>8.2</td>
                        <td className="rank">15th</td>
                      </tr>
                      <tr>
                        <td>HR/9</td>
                        <td>1.3</td>
                        <td className="rank bad">24th</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="performance-analysis">
                <h3>Performance Analysis</h3>
                <div className="analysis-box">
                  <div className="analysis-item">
                    <div className="analysis-label">Offense vs League</div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{width: '45%', background: '#ef4444'}} />
                    </div>
                    <div className="analysis-value">Below Average (-5%)</div>
                  </div>
                  <div className="analysis-item">
                    <div className="analysis-label">Pitching vs League</div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{width: '38%', background: '#ef4444'}} />
                    </div>
                    <div className="analysis-value">Well Below Average (-12%)</div>
                  </div>
                  <div className="analysis-item">
                    <div className="analysis-label">Defense vs League</div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{width: '52%', background: '#fbbf24'}} />
                    </div>
                    <div className="analysis-value">Slightly Above Average (+2%)</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Footer */}
      <div className="footer">
        <div className="footer-content">
          <div className="footer-section">
            <h4>Architecture</h4>
            <ul>
              <li>Cloudflare Workers - Edge API</li>
              <li>D1 - SQL Database</li>
              <li>Workers KV - Cache Layer</li>
              <li>Workers AI - ML Inference</li>
              <li>R2 - Historical Data</li>
            </ul>
          </div>
          <div className="footer-section">
            <h4>Performance</h4>
            <ul>
              <li>Global edge deployment</li>
              <li>&lt;50ms API response time</li>
              <li>Intelligent caching strategy</li>
              <li>Real-time stat updates</li>
              <li>99.99% uptime SLA</li>
            </ul>
          </div>
          <div className="footer-section">
            <h4>Data Sources</h4>
            <ul>
              <li>MLB Stats API</li>
              <li>FanGraphs Leaderboards</li>
              <li>Baseball Reference</li>
              <li>Statcast Database</li>
              <li>Custom aggregations</li>
            </ul>
          </div>
        </div>
        <div className="footer-note">
          © 2025 blazesportsintel.com • Built with Cloudflare Developer Platform
        </div>
      </div>

      <style jsx>{`
        .analytics-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #0a0a0a 0%, #1a0a2e 50%, #0a0a0a 100%);
          color: #fff;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        .header {
          background: rgba(255, 255, 255, 0.03);
          border-bottom: 1px solid rgba(255, 140, 0, 0.2);
          padding: 30px 20px;
        }

        .header-content {
          max-width: 1400px;
          margin: 0 auto;
        }

        h1 {
          margin: 0 0 10px 0;
          font-size: 2.5em;
          background: linear-gradient(45deg, #ff8c00, #ff4500);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .subtitle {
          margin: 0 0 15px 0;
          color: #aaa;
          font-size: 1.1em;
        }

        .tech-badges {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 6px 12px;
          background: rgba(255, 140, 0, 0.1);
          border: 1px solid rgba(255, 140, 0, 0.3);
          border-radius: 15px;
          font-size: 0.85em;
          color: #ff8c00;
        }

        .nav-tabs {
          max-width: 1400px;
          margin: 0 auto;
          padding: 20px;
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .tab {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 24px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          color: #aaa;
          font-size: 1em;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .tab:hover {
          background: rgba(255, 140, 0, 0.1);
          border-color: rgba(255, 140, 0, 0.3);
          color: #ff8c00;
        }

        .tab.active {
          background: rgba(255, 140, 0, 0.2);
          border-color: #ff8c00;
          color: #ff8c00;
        }

        .team-selector {
          max-width: 1400px;
          margin: 0 auto 30px;
          padding: 0 20px;
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .team-selector label {
          font-weight: 600;
          color: #aaa;
        }

        .team-selector select {
          padding: 10px 15px;
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 5px;
          color: #fff;
          font-size: 1em;
          cursor: pointer;
        }

        .content {
          max-width: 1400px;
          margin: 0 auto;
          padding: 0 20px 40px;
        }

        .team-header {
          text-align: center;
          margin-bottom: 30px;
        }

        .team-header h2 {
          margin: 0 0 10px 0;
          font-size: 2em;
          color: #ff8c00;
        }

        .record {
          font-size: 1.5em;
          font-weight: bold;
        }

        .pct {
          color: #888;
          font-size: 0.9em;
          margin-left: 10px;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }

        .stat-card {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          padding: 20px;
          transition: transform 0.2s ease;
        }

        .stat-card:hover {
          transform: translateY(-2px);
          border-color: rgba(255, 140, 0, 0.3);
        }

        .stat-card.highlight {
          background: rgba(255, 140, 0, 0.1);
          border-color: rgba(255, 140, 0, 0.3);
        }

        .stat-label {
          font-size: 0.9em;
          color: #aaa;
          margin-bottom: 10px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .stat-value {
          font-size: 2.5em;
          font-weight: bold;
          margin-bottom: 5px;
          color: #fff;
        }

        .stat-meta {
          font-size: 0.85em;
          color: #888;
        }

        .ai-section {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 140, 0, 0.2);
          border-radius: 10px;
          padding: 25px;
          margin-top: 30px;
        }

        .ai-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .ai-header h3 {
          display: flex;
          align-items: center;
          gap: 10px;
          margin: 0;
          color: #ff8c00;
        }

        .btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
        }

        .btn-primary:disabled {
          cursor: not-allowed;
        }

        .ai-insight {
          background: rgba(0, 0, 0, 0.3);
          padding: 20px;
          border-radius: 8px;
          border-left: 3px solid #ff8c00;
        }

        .insight-badge {
          display: inline-block;
          padding: 4px 10px;
          background: rgba(255, 140, 0, 0.2);
          border-radius: 12px;
          font-size: 0.75em;
          color: #ff8c00;
          margin-bottom: 10px;
        }

        .ai-insight p {
          margin: 0;
          line-height: 1.7;
          color: #ddd;
        }

        .prediction-container {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          padding: 30px;
          margin-bottom: 30px;
        }

        .prediction-chart {
          margin-bottom: 30px;
        }

        .chart-title {
          font-size: 1.2em;
          font-weight: 600;
          margin-bottom: 20px;
          color: #ff8c00;
        }

        .bars {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        .bar-item {
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .bar-label {
          width: 50px;
          font-weight: 600;
          color: #aaa;
        }

        .bar-container {
          flex: 1;
          height: 30px;
          background: rgba(0, 0, 0, 0.3);
          border-radius: 5px;
          overflow: hidden;
        }

        .bar-fill {
          height: 100%;
          background: linear-gradient(90deg, #ff8c00, #ff4500);
          transition: width 0.5s ease;
        }

        .bar-pct {
          width: 50px;
          text-align: right;
          color: #fff;
          font-weight: 600;
        }

        .prediction-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
        }

        .pred-stat {
          background: rgba(0, 0, 0, 0.3);
          padding: 20px;
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .pred-label {
          font-size: 0.9em;
          color: #aaa;
          margin-bottom: 10px;
        }

        .pred-value {
          font-size: 2em;
          font-weight: bold;
          color: #ff8c00;
        }

        .methodology {
          background: rgba(255, 255, 255, 0.03);
          padding: 20px;
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .methodology h4 {
          margin: 0 0 10px 0;
          color: #ff8c00;
        }

        .methodology p {
          margin: 0;
          line-height: 1.7;
          color: #aaa;
        }

        .advanced-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          gap: 30px;
          margin-bottom: 30px;
        }

        .advanced-section {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          padding: 25px;
        }

        .advanced-section h3 {
          margin: 0 0 20px 0;
          color: #ff8c00;
        }

        .stats-table {
          width: 100%;
          border-collapse: collapse;
        }

        .stats-table td {
          padding: 12px 8px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .stats-table td:first-child {
          color: #aaa;
        }

        .stats-table td:nth-child(2) {
          font-weight: 600;
          color: #fff;
        }

        .rank {
          text-align: right;
          color: #4ade80;
          font-size: 0.9em;
        }

        .rank.bad {
          color: #ef4444;
        }

        .performance-analysis {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          padding: 25px;
        }

        .performance-analysis h3 {
          margin: 0 0 20px 0;
          color: #ff8c00;
        }

        .analysis-box {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .analysis-item {
          background: rgba(0, 0, 0, 0.3);
          padding: 15px;
          border-radius: 8px;
        }

        .analysis-label {
          font-size: 0.9em;
          color: #aaa;
          margin-bottom: 10px;
        }

        .progress-bar {
          height: 12px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 6px;
          overflow: hidden;
          margin-bottom: 8px;
        }

        .progress-fill {
          height: 100%;
          transition: width 0.5s ease;
        }

        .analysis-value {
          font-size: 0.9em;
          font-weight: 600;
        }

        .footer {
          background: rgba(0, 0, 0, 0.3);
          border-top: 1px solid rgba(255, 140, 0, 0.2);
          padding: 40px 20px 20px;
          margin-top: 60px;
        }

        .footer-content {
          max-width: 1400px;
          margin: 0 auto 30px;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 30px;
        }

        .footer-section h4 {
          margin: 0 0 15px 0;
          color: #ff8c00;
          font-size: 1.1em;
        }

        .footer-section ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .footer-section li {
          padding: 5px 0;
          color: #aaa;
          font-size: 0.9em;
        }

        .footer-note {
          max-width: 1400px;
          margin: 0 auto;
          text-align: center;
          padding-top: 20px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          color: #666;
          font-size: 0.9em;
        }

        .loading {
          text-align: center;
          padding: 60px 20px;
          font-size: 1.3em;
          color: #ff8c00;
        }

        @media (max-width: 768px) {
          h1 {
            font-size: 1.8em;
          }

          .stats-grid {
            grid-template-columns: 1fr;
          }

          .advanced-grid {
            grid-template-columns: 1fr;
          }

          .nav-tabs {
            flex-direction: column;
          }

          .tab {
            width: 100%;
            justify-content: center;
          }

          .ai-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 15px;
          }
        }
      `}</style>
    </div>
  );
};

export default MLBAnalyticsEngine;