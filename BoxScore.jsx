import React, { useState, useEffect } from 'react';
import './BoxScore.css';
import AdvancedMetricsTable from './components/AdvancedMetricsTable';

function BoxScore({ game, onBack }) {
  const [activeTab, setActiveTab] = useState('batting');
  const [boxScoreData, setBoxScoreData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [entitlements, setEntitlements] = useState({
    loading: true,
    isPro: false,
    plan: 'free',
    error: null,
    features: [],
  });

  useEffect(() => {
    fetchBoxScore();
    // Poll for updates if game is live
    if (game.status === 'live') {
      const interval = setInterval(fetchBoxScore, 15000);
      return () => clearInterval(interval);
    }
  }, [game.id]);

  useEffect(() => {
    const loadEntitlements = async () => {
      try {
        const userId =
          (typeof window !== 'undefined' && window.__APP_USER?.id) ||
          (typeof window !== 'undefined' && window.localStorage?.getItem('bsi:userId')) ||
          null;
        const query = userId ? `?userId=${encodeURIComponent(userId)}` : '';
        const response = await fetch(`/api/billing/entitlements${query}`, {
          credentials: 'include',
        });
        const data = await response.json();
        setEntitlements({
          loading: false,
          isPro: Boolean(data.isPro),
          plan: data.plan || 'free',
          error: null,
          features: data.features || [],
        });
      } catch (error) {
        console.error('Error loading entitlements:', error);
        setEntitlements({
          loading: false,
          isPro: false,
          plan: 'free',
          error: 'Unable to verify Diamond Pro status. Showing limited view.',
          features: [],
        });
      }
    };

    loadEntitlements();
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

  if (loading) {
    return <div className="loading-state">Loading box score...</div>;
  }

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

  const handleUpgradeClick = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/auth/sign-up?plan=diamond-pro';
    }
  };

  const renderAdvancedStats = () => {
    if (!boxScoreData?.advanced) {
      return (
        <div className="advanced-placeholder">
          Advanced tracking feeds are syncing. Check back soon for Diamond Pro metrics.
        </div>
      );
    }

    if (entitlements.loading) {
      return <div className="loading-state">Confirming Diamond Pro access…</div>;
    }

    if (entitlements.error) {
      return (
        <div className="advanced-error" role="alert">
          {entitlements.error}
        </div>
      );
    }

    if (!entitlements.isPro) {
      return (
        <div className="advanced-upgrade">
          <h3>Diamond Pro Exclusive</h3>
          <p>
            Unlock xBA, xSLG, Stuff+, defender range, and signed highlight breakdowns with a Diamond Pro
            subscription.
          </p>
          <button className="upgrade-button" onClick={handleUpgradeClick}>
            Upgrade with Stripe
          </button>
          <p className="upgrade-helper">
            Already subscribed? <a href="/auth/sign-in">Sign in</a> to refresh your Stripe entitlements.
          </p>
        </div>
      );
    }

    return <AdvancedMetricsTable data={boxScoreData.advanced} />;
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
        <button
          className={`${activeTab === 'advanced' ? 'active' : ''} ${entitlements.isPro ? 'pro-active' : 'pro-locked'}`}
          onClick={() => setActiveTab('advanced')}
          title="Diamond Pro unlocks advanced tracking metrics and signed highlights"
        >
          Advanced
          <span className="pro-badge" aria-hidden="true">PRO</span>
        </button>
      </div>

      <div className="stats-content">
        {activeTab === 'batting' && renderBattingStats()}
        {activeTab === 'pitching' && renderPitchingStats()}
        {activeTab === 'advanced' && renderAdvancedStats()}
      </div>
    </div>
  );
}

export default BoxScore;
