import React, { useState, useEffect } from 'react';
import './BoxScore.css';

const InfoTooltip = ({ description }) => (
  <span className="info-tooltip" tabIndex={0} aria-label={description}>
    <span className="tooltip-icon" aria-hidden="true">ℹ️</span>
    <span className="tooltip-content" role="tooltip">{description}</span>
  </span>
);

const Sparkline = ({ data, color = 'var(--accent-color)' }) => {
  if (!Array.isArray(data) || data.length === 0) {
    return <span className="sparkline-placeholder">—</span>;
  }

  const width = 120;
  const height = 36;
  const padding = 4;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const points = data
    .map((value, index) => {
      const x = padding + ((width - padding * 2) * index) / (data.length - 1 || 1);
      const y = height - padding - ((value - min) / range) * (height - padding * 2);
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg
      className="sparkline"
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      role="img"
      aria-label="Trend over last five games"
    >
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        points={points}
      />
      {data.map((value, index) => {
        const x = padding + ((width - padding * 2) * index) / (data.length - 1 || 1);
        const y = height - padding - ((value - min) / range) * (height - padding * 2);
        return <circle key={index} cx={x} cy={y} r={2} fill={color} aria-hidden="true" />;
      })}
    </svg>
  );
};

function BoxScore({ game, onBack }) {
  const [activeTab, setActiveTab] = useState('batting');
  const [boxScoreData, setBoxScoreData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);
  const [activeProSection, setActiveProSection] = useState('hitting');
  const [activeClip, setActiveClip] = useState(null);

  useEffect(() => {
    fetchBoxScore();
    // Poll for updates if game is live
    if (game.status === 'live') {
      const interval = setInterval(fetchBoxScore, 15000);
      return () => clearInterval(interval);
    }
  }, [game.id]);

  useEffect(() => {
    fetchSubscription();
  }, []);

  const fetchBoxScore = async () => {
    try {
      const response = await fetch(`/api/games/${game.id}/boxscore`);
      const data = await response.json();
      setBoxScoreData(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching box score:', error);
      setLoading(false);
    }
  };

  const fetchSubscription = async () => {
    try {
      const response = await fetch('/api/user/subscription');
      const data = await response.json();
      setSubscription(data);
      setSubscriptionLoading(false);
    } catch (error) {
      console.error('Error fetching subscription status:', error);
      setSubscription(null);
      setSubscriptionLoading(false);
    }
  };

  const isProSubscriber = Boolean(subscription?.isPro);

  const formatMetric = (key, value) => {
    if (value === null || value === undefined) {
      return '—';
    }

    if (['xBA', 'xSLG', 'xwOBA', 'xBAAgainst'].includes(key)) {
      return value.toFixed(3);
    }

    if (key === 'xERA') {
      return value.toFixed(2);
    }

    if (['hardHitRate', 'barrelRate', 'whiffRate', 'chaseRate'].includes(key)) {
      return `${value}%`;
    }

    if (key === 'successRate') {
      return `${(value * 100).toFixed(1)}%`;
    }

    if (key === 'outsAboveAverage') {
      return value.toString();
    }

    if (key === 'armStrength') {
      return `${value} mph`;
    }

    if (key === 'rangeScore') {
      return value.toFixed(1);
    }

    return value;
  };

  if (loading) {
    return <div className="loading-state">Loading box score...</div>;
  }

  const shouldShowProTab = isProSubscriber && boxScoreData?.proInsights;

  const renderProTable = (teamKey, dataSet, columns) => {
    const players = dataSet?.[teamKey] || [];

    return (
      <div className="team-stats pro-team" key={teamKey}>
        <h3>{teamKey === 'away' ? game.awayTeam.name : game.homeTeam.name}</h3>
        <div className="stats-table-wrapper">
          <table className="stats-table pro-table">
            <thead>
              <tr>
                <th className="player-col">Player</th>
                {columns.map((column) => (
                  <th key={column.key}>
                    <span className="column-label">{column.label}</span>
                    {column.tooltip && <InfoTooltip description={column.tooltip} />}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {players.length === 0 && (
                <tr>
                  <td colSpan={columns.length + 1} className="empty-pro-row">
                    Diamond Pro data is being calibrated for this matchup.
                  </td>
                </tr>
              )}
              {players.map((player) => (
                <tr key={player.id}>
                  <td className="player-col">
                    <span className="player-name">{player.name}</span>
                    {player.position && (
                      <span className="player-pos">{player.position}</span>
                    )}
                  </td>
                  {columns.map((column) => {
                    const value = player[column.key];

                    if (column.type === 'sparkline') {
                      return (
                        <td key={column.key}>
                          <Sparkline data={value} />
                        </td>
                      );
                    }

                    if (column.type === 'note') {
                      return (
                        <td key={column.key}>
                          <span className="metric-note">{value || '—'}</span>
                        </td>
                      );
                    }

                    const displayValue = column.format
                      ? column.format(value)
                      : formatMetric(column.key, value);

                    return <td key={column.key}>{displayValue}</td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderExpectedHitting = () => {
    if (!boxScoreData?.proInsights?.expectedHitting) {
      return null;
    }

    const columns = [
      { key: 'xBA', label: 'xBA', tooltip: 'Expected batting average from quality of contact.' },
      { key: 'xSLG', label: 'xSLG', tooltip: 'Expected slugging built from exit velocity + launch angle.' },
      { key: 'xwOBA', label: 'xwOBA', tooltip: 'Expected weighted on-base average (per Statcast profile).' },
      { key: 'hardHitRate', label: 'Hard%', tooltip: 'Percentage of batted balls struck 95+ mph.' },
      { key: 'barrelRate', label: 'Barrel%', tooltip: 'Barrels per batted ball event.' },
      { key: 'trend', label: 'Trend', tooltip: 'Five-game expected batting average trend.', type: 'sparkline' },
      { key: 'note', label: 'Insight', tooltip: 'Diamond Pro scouting note.', type: 'note' },
    ];

    return (
      <div className="pro-grid">
        {renderProTable('away', boxScoreData.proInsights.expectedHitting, columns)}
        {renderProTable('home', boxScoreData.proInsights.expectedHitting, columns)}
      </div>
    );
  };

  const renderExpectedPitching = () => {
    if (!boxScoreData?.proInsights?.expectedPitching) {
      return null;
    }

    const columns = [
      { key: 'role', label: 'Role', tooltip: 'Assigned pitching role for usage planning.' },
      { key: 'xERA', label: 'xERA', tooltip: 'Expected ERA blending strikeouts, walks, and contact.' },
      { key: 'whiffRate', label: 'Whiff%', tooltip: 'Swinging strike percentage.' },
      { key: 'chaseRate', label: 'Chase%', tooltip: 'Swings outside the strike zone.' },
      { key: 'xBAAgainst', label: 'xBA', tooltip: 'Expected batting average allowed.' },
      { key: 'trend', label: 'Trend', tooltip: 'Five-outing expected ERA trend.', type: 'sparkline' },
      { key: 'note', label: 'Insight', tooltip: 'Pitch design + sequencing callout.', type: 'note' },
    ];

    return (
      <div className="pro-grid">
        {renderProTable('away', boxScoreData.proInsights.expectedPitching, columns)}
        {renderProTable('home', boxScoreData.proInsights.expectedPitching, columns)}
      </div>
    );
  };

  const renderDefensiveMetrics = () => {
    if (!boxScoreData?.proInsights?.defensiveQuality) {
      return null;
    }

    const columns = [
      { key: 'position', label: 'POS', tooltip: 'Primary defensive assignment.' },
      { key: 'outsAboveAverage', label: 'OAA', tooltip: 'Estimated outs above average.' },
      { key: 'successRate', label: 'Success%', tooltip: 'Conversion rate on defensive chances.' },
      { key: 'armStrength', label: 'Arm Velo', tooltip: 'Average throw velocity (mph).' },
      { key: 'rangeScore', label: 'Range', tooltip: 'Diamond Pro range score (0-10).' },
      { key: 'trend', label: 'Trend', tooltip: 'Five-game defensive success trend.', type: 'sparkline' },
      { key: 'note', label: 'Insight', tooltip: 'Positioning + coverage summary.', type: 'note' },
    ];

    return (
      <div className="pro-grid">
        {renderProTable('away', boxScoreData.proInsights.defensiveQuality, columns)}
        {renderProTable('home', boxScoreData.proInsights.defensiveQuality, columns)}
      </div>
    );
  };

  const renderMediaHub = () => {
    const clips = boxScoreData?.proInsights?.mediaClips || [];

    if (!clips.length) {
      return null;
    }

    const formatClipMetricValue = (value) => {
      if (typeof value !== 'number') {
        return value;
      }

      if (value >= 100) {
        return value.toFixed(0);
      }

      if (value >= 1) {
        return value.toFixed(2);
      }

      return value.toFixed(3);
    };

    return (
      <section className="media-hub" aria-label="Licensed highlights">
        <div className="media-hub-header">
          <h3>Licensed Highlights</h3>
          <p>Powered by official broadcast partners. Streams load on demand.</p>
        </div>
        <div className="media-grid">
          {clips.map((clip) => (
            <article key={clip.id} className="media-card">
              <button
                type="button"
                className="media-thumbnail"
                onClick={() => setActiveClip(clip)}
                aria-label={`Play ${clip.title}`}
              >
                <img src={clip.thumbnail} alt={clip.title} loading="lazy" />
                <span className="media-duration">{clip.duration}</span>
              </button>
              <div className="media-body">
                <h4>{clip.title}</h4>
                <p className="media-description">{clip.description}</p>
                <div className="media-meta">
                  <span>{clip.provider}</span>
                  <span>•</span>
                  <span>{clip.rights}</span>
                </div>
                {clip.expectedMetrics && (
                  <ul className="media-metrics">
                    {Object.entries(clip.expectedMetrics).map(([metric, metricValue]) => (
                      <li key={metric}>
                        <span className="metric-label">{metric}</span>
                        <span className="metric-value">{formatClipMetricValue(metricValue)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>
    );
  };

  const renderDiamondProTab = () => (
    <div className="diamond-pro-content">
      <div className="pro-section-switcher" role="tablist" aria-label="Diamond Pro insights">
        <button
          type="button"
          className={activeProSection === 'hitting' ? 'active' : ''}
          onClick={() => setActiveProSection('hitting')}
          role="tab"
          aria-selected={activeProSection === 'hitting'}
        >
          Expected Hitting
        </button>
        <button
          type="button"
          className={activeProSection === 'pitching' ? 'active' : ''}
          onClick={() => setActiveProSection('pitching')}
          role="tab"
          aria-selected={activeProSection === 'pitching'}
        >
          Expected Pitching
        </button>
        <button
          type="button"
          className={activeProSection === 'defense' ? 'active' : ''}
          onClick={() => setActiveProSection('defense')}
          role="tab"
          aria-selected={activeProSection === 'defense'}
        >
          Defensive Quality
        </button>
      </div>

      <div className="pro-section-content">
        {activeProSection === 'hitting' && renderExpectedHitting()}
        {activeProSection === 'pitching' && renderExpectedPitching()}
        {activeProSection === 'defense' && renderDefensiveMetrics()}
      </div>

      {renderMediaHub()}
    </div>
  );

  const renderSubscriptionPrompt = () => {
    if (subscriptionLoading || isProSubscriber) {
      return null;
    }

    return (
      <div className="pro-upsell" role="note">
        Unlock Expected Hitting, Pitching, Defensive metrics, and licensed video inside Diamond Pro.
      </div>
    );
  };

  const renderLineScore = () => {
    const innings = boxScoreData.lineScore.innings;
    return (
      <div className="line-score">
        <table>
          <thead>
            <tr>
              <th className="team-header"></th>
              {innings.map((_, idx) => (
                <th key={idx}>{idx + 1}</th>
              ))}
              <th className="total-header">R</th>
              <th className="total-header">H</th>
              <th className="total-header">E</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="team-name">{game.awayTeam.name}</td>
              {boxScoreData.lineScore.away.innings.map((runs, idx) => (
                <td key={idx} className="inning-score">{runs}</td>
              ))}
              <td className="total-score">{boxScoreData.lineScore.away.runs}</td>
              <td className="total-score">{boxScoreData.lineScore.away.hits}</td>
              <td className="total-score">{boxScoreData.lineScore.away.errors}</td>
            </tr>
            <tr>
              <td className="team-name">{game.homeTeam.name}</td>
              {boxScoreData.lineScore.home.innings.map((runs, idx) => (
                <td key={idx} className="inning-score">{runs}</td>
              ))}
              <td className="total-score">{boxScoreData.lineScore.home.runs}</td>
              <td className="total-score">{boxScoreData.lineScore.home.hits}</td>
              <td className="total-score">{boxScoreData.lineScore.home.errors}</td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  };

  const renderBattingStats = () => {
    return (
      <div className="batting-stats">
        <div className="team-stats">
          <h3>{game.awayTeam.name}</h3>
          <div className="stats-table-wrapper">
            <table className="stats-table">
              <thead>
                <tr>
                  <th className="player-col">Player</th>
                  <th>AB</th>
                  <th>R</th>
                  <th>H</th>
                  <th>RBI</th>
                  <th>BB</th>
                  <th>K</th>
                  <th>AVG</th>
                </tr>
              </thead>
              <tbody>
                {boxScoreData.batting.away.map((player) => (
                  <tr key={player.id}>
                    <td className="player-col">
                      <span className="player-name">{player.name}</span>
                      <span className="player-pos">{player.position}</span>
                    </td>
                    <td>{player.ab}</td>
                    <td>{player.r}</td>
                    <td>{player.h}</td>
                    <td>{player.rbi}</td>
                    <td>{player.bb}</td>
                    <td>{player.k}</td>
                    <td className="avg">{player.seasonAvg}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="team-stats">
          <h3>{game.homeTeam.name}</h3>
          <div className="stats-table-wrapper">
            <table className="stats-table">
              <thead>
                <tr>
                  <th className="player-col">Player</th>
                  <th>AB</th>
                  <th>R</th>
                  <th>H</th>
                  <th>RBI</th>
                  <th>BB</th>
                  <th>K</th>
                  <th>AVG</th>
                </tr>
              </thead>
              <tbody>
                {boxScoreData.batting.home.map((player) => (
                  <tr key={player.id}>
                    <td className="player-col">
                      <span className="player-name">{player.name}</span>
                      <span className="player-pos">{player.position}</span>
                    </td>
                    <td>{player.ab}</td>
                    <td>{player.r}</td>
                    <td>{player.h}</td>
                    <td>{player.rbi}</td>
                    <td>{player.bb}</td>
                    <td>{player.k}</td>
                    <td className="avg">{player.seasonAvg}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderPitchingStats = () => {
    return (
      <div className="pitching-stats">
        <div className="team-stats">
          <h3>{game.awayTeam.name}</h3>
          <div className="stats-table-wrapper">
            <table className="stats-table">
              <thead>
                <tr>
                  <th className="player-col">Pitcher</th>
                  <th>IP</th>
                  <th>H</th>
                  <th>R</th>
                  <th>ER</th>
                  <th>BB</th>
                  <th>K</th>
                  <th>PC</th>
                  <th>ERA</th>
                </tr>
              </thead>
              <tbody>
                {boxScoreData.pitching.away.map((player) => (
                  <tr key={player.id} className={player.decision ? 'decision-pitcher' : ''}>
                    <td className="player-col">
                      <span className="player-name">{player.name}</span>
                      {player.decision && (
                        <span className="decision">{player.decision}</span>
                      )}
                    </td>
                    <td>{player.ip}</td>
                    <td>{player.h}</td>
                    <td>{player.r}</td>
                    <td>{player.er}</td>
                    <td>{player.bb}</td>
                    <td>{player.k}</td>
                    <td>{player.pitches}</td>
                    <td className="era">{player.seasonEra}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="team-stats">
          <h3>{game.homeTeam.name}</h3>
          <div className="stats-table-wrapper">
            <table className="stats-table">
              <thead>
                <tr>
                  <th className="player-col">Pitcher</th>
                  <th>IP</th>
                  <th>H</th>
                  <th>R</th>
                  <th>ER</th>
                  <th>BB</th>
                  <th>K</th>
                  <th>PC</th>
                  <th>ERA</th>
                </tr>
              </thead>
              <tbody>
                {boxScoreData.pitching.home.map((player) => (
                  <tr key={player.id} className={player.decision ? 'decision-pitcher' : ''}>
                    <td className="player-col">
                      <span className="player-name">{player.name}</span>
                      {player.decision && (
                        <span className="decision">{player.decision}</span>
                      )}
                    </td>
                    <td>{player.ip}</td>
                    <td>{player.h}</td>
                    <td>{player.r}</td>
                    <td>{player.er}</td>
                    <td>{player.bb}</td>
                    <td>{player.k}</td>
                    <td>{player.pitches}</td>
                    <td className="era">{player.seasonEra}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="box-score">
      <div className="box-score-header">
        <button className="back-button" onClick={onBack}>← Back</button>
        <div className="game-info">
          <h2>{game.awayTeam.name} at {game.homeTeam.name}</h2>
          <span className="game-date">{game.date}</span>
        </div>
      </div>

      {renderLineScore()}

      <div className="stats-tabs">
        <button
          className={activeTab === 'batting' ? 'active' : ''}
          onClick={() => setActiveTab('batting')}
        >
          Batting
        </button>
        <button
          className={activeTab === 'pitching' ? 'active' : ''}
          onClick={() => setActiveTab('pitching')}
        >
          Pitching
        </button>
        {shouldShowProTab && (
          <button
            className={`pro-tab ${activeTab === 'diamondPro' ? 'active' : ''}`}
            onClick={() => setActiveTab('diamondPro')}
          >
            Diamond Pro
          </button>
        )}
      </div>

      {renderSubscriptionPrompt()}

      <div className="stats-content">
        {activeTab === 'batting' && renderBattingStats()}
        {activeTab === 'pitching' && renderPitchingStats()}
        {activeTab === 'diamondPro' && shouldShowProTab && renderDiamondProTab()}
      </div>

      {activeClip && (
        <div
          className="media-modal"
          role="dialog"
          aria-modal="true"
          aria-label={activeClip.title}
          onClick={() => setActiveClip(null)}
        >
          <div
            className="media-modal-content"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="media-modal-close"
              aria-label="Close highlight"
              onClick={() => setActiveClip(null)}
            >
              ×
            </button>
            <h4>{activeClip.title}</h4>
            <p className="media-modal-meta">
              {activeClip.provider} · {activeClip.duration}
            </p>
            <video
              controls
              preload="metadata"
              poster={activeClip.thumbnail}
              src={activeClip.url}
              className="media-modal-video"
            />
            <p className="media-modal-rights">{activeClip.rights}</p>
            {activeClip.expectedMetrics && (
              <ul className="media-modal-metrics">
                {Object.entries(activeClip.expectedMetrics).map(([metric, metricValue]) => (
                  <li key={metric}>
                    <span className="metric-label">{metric}</span>
                    <span className="metric-value">{metricValue}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default BoxScore;
