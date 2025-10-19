import React, { useEffect, useMemo, useState } from 'react';
import './Standings.css';

const FREE_SIM_CAP = 400;
const PRO_SIM_MAX = 2000;

function Standings() {
  const [conference, setConference] = useState('sec');
  const [standingsData, setStandingsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [draftMatchup, setDraftMatchup] = useState({
    opponentId: '',
    location: 'home',
    winProbability: 0.55,
  });
  const [prospectiveMatchups, setProspectiveMatchups] = useState([]);
  const [simulationCount, setSimulationCount] = useState(300);
  const [optimizerResult, setOptimizerResult] = useState(null);
  const [optimizerLoading, setOptimizerLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [membershipTier, setMembershipTier] = useState('free');
  const [upsellPayload, setUpsellPayload] = useState(null);
  const [showUpsell, setShowUpsell] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedTier = window.localStorage.getItem('bsi.membershipTier');
      if (storedTier) {
        setMembershipTier(storedTier.toLowerCase());
      }
    }
  }, []);

  useEffect(() => {
    fetchStandings();
  }, [conference]);

  useEffect(() => {
    if (membershipTier !== 'diamond-pro' && simulationCount > FREE_SIM_CAP) {
      setSimulationCount(FREE_SIM_CAP);
    }
  }, [membershipTier, simulationCount]);

  useEffect(() => {
    if (standingsData?.teams?.length) {
      const defaultTeam = standingsData.teams[0];
      setSelectedTeamId(defaultTeam?.id || defaultTeam?.teamId || defaultTeam?.slug || '');
      const fallbackOpponent = standingsData.teams[1];
      setDraftMatchup((prev) => ({
        ...prev,
        opponentId: fallbackOpponent?.id || fallbackOpponent?.teamId || fallbackOpponent?.slug || '',
      }));
    }
  }, [standingsData]);

  const fetchStandings = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const response = await fetch(`/api/standings/${conference}`);
      const data = await response.json();
      setStandingsData(data);
      setProspectiveMatchups([]);
      setOptimizerResult(null);
      setUpsellPayload(null);
      setShowUpsell(false);
    } catch (error) {
      console.error('Error fetching standings:', error);
      setErrorMessage('Unable to load standings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const availableTeams = useMemo(() => standingsData?.teams ?? [], [standingsData]);
  const selectedTeam = useMemo(
    () => availableTeams.find((team) => (team.id || team.teamId || team.slug) === selectedTeamId),
    [availableTeams, selectedTeamId]
  );
  const opponents = useMemo(
    () => availableTeams.filter((team) => (team.id || team.teamId || team.slug) !== selectedTeamId),
    [availableTeams, selectedTeamId]
  );
  const isProUser = membershipTier === 'diamond-pro';
  const simulationMax = isProUser ? PRO_SIM_MAX : FREE_SIM_CAP;

  const handleTierChange = (tier) => {
    setMembershipTier(tier);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('bsi.membershipTier', tier);
    }
  };

  const handleAddMatchup = () => {
    if (!draftMatchup.opponentId) {
      setErrorMessage('Select an opponent to add.');
      return;
    }
    if (prospectiveMatchups.some((matchup) => matchup.opponentId === draftMatchup.opponentId)) {
      setErrorMessage('This opponent is already in your simulation set.');
      return;
    }
    const opponent = opponents.find(
      (team) => (team.id || team.teamId || team.slug) === draftMatchup.opponentId
    );
    const opponentName = opponent?.name || opponent?.team || opponent?.school || 'Opponent';
    setProspectiveMatchups((prev) => [
      ...prev,
      {
        opponentId: draftMatchup.opponentId,
        opponentName,
        location: draftMatchup.location,
        winProbability: Number(draftMatchup.winProbability.toFixed(2)),
      },
    ]);
    setErrorMessage('');
  };

  const handleRemoveMatchup = (index) => {
    setProspectiveMatchups((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleRunSimulation = async () => {
    if (!selectedTeamId) {
      setErrorMessage('Select a team to model.');
      return;
    }
    if (prospectiveMatchups.length === 0) {
      setErrorMessage('Add at least one prospective matchup.');
      return;
    }

    setOptimizerLoading(true);
    setErrorMessage('');

    try {
      const response = await fetch('/api/v1/scheduling/optimizer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Membership-Tier': membershipTier,
        },
        body: JSON.stringify({
          teamId: selectedTeamId,
          conferenceId: conference,
          teams: availableTeams,
          historicalGames: standingsData?.historicalGames || [],
          prospectiveMatchups,
          season: standingsData?.season,
          membershipTier,
          simulations: simulationCount,
          includeAdvanced: !isProUser && (simulationCount > FREE_SIM_CAP || prospectiveMatchups.length > 2),
        }),
      });

      const payload = await response.json();
      if (!response.ok || payload.success === false) {
        throw new Error(payload.error || 'Unable to run the optimizer');
      }

      setOptimizerResult(payload.data);
      setUpsellPayload(payload.upsell || null);
      setShowUpsell(Boolean(payload.upsell));
    } catch (error) {
      console.error('Scheduling optimizer failed', error);
      setErrorMessage(error.message || 'Unable to run optimization. Please try again later.');
    } finally {
      setOptimizerLoading(false);
    }
  };

  if (loading) {
    return <div className="loading-state">Loading standings...</div>;
  }

  return (
    <div className="standings">
      <div className="standings-header">
        <div>
          <h2>Conference Standings</h2>
          <p className="standings-subhead">Explore projected RPI shifts and postseason odds in real time.</p>
        </div>
        <div className="standings-controls">
          <select
            value={conference}
            onChange={(e) => setConference(e.target.value)}
            className="conference-select"
          >
            <option value="sec">SEC</option>
            <option value="acc">ACC</option>
            <option value="big12">Big 12</option>
            <option value="pac12">Pac-12</option>
            <option value="big10">Big Ten</option>
          </select>
          <div className="tier-toggle" role="group" aria-label="Membership tier selector">
            <button
              type="button"
              className={`tier-pill ${membershipTier === 'free' ? 'tier-pill--active' : ''}`}
              onClick={() => handleTierChange('free')}
            >
              Free
            </button>
            <button
              type="button"
              className={`tier-pill ${membershipTier === 'diamond-pro' ? 'tier-pill--active' : ''}`}
              onClick={() => handleTierChange('diamond-pro')}
            >
              Diamond Pro
            </button>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="standings-error" role="alert">
          {errorMessage}
        </div>
      )}

      <div className="standings-table-wrapper">
        <table className="standings-table">
          <thead>
            <tr>
              <th className="rank-col">#</th>
              <th className="team-col">Team</th>
              <th>Conf</th>
              <th>Overall</th>
              <th>RPI</th>
              <th className="hide-mobile">Home</th>
              <th className="hide-mobile">Away</th>
              <th className="hide-mobile">Streak</th>
            </tr>
          </thead>
          <tbody>
            {availableTeams.map((team, idx) => {
              const teamKey = team.id || team.teamId || team.slug || team.name;
              return (
                <tr key={teamKey} className={idx < 2 ? 'tournament-team' : ''}>
                  <td className="rank-col">{idx + 1}</td>
                  <td className="team-col">
                    <span className="team-name">{team.name}</span>
                  </td>
                  <td className="record">
                    <span className="wins">{team.confWins}</span>-
                    <span className="losses">{team.confLosses}</span>
                    {team.confPct && (
                      <span className="pct">{team.confPct}</span>
                    )}
                  </td>
                  <td className="record">
                    <span className="wins">{team.overallWins}</span>-
                    <span className="losses">{team.overallLosses}</span>
                    {team.overallPct && (
                      <span className="pct">{team.overallPct}</span>
                    )}
                  </td>
                  <td className="rpi">
                    <span className="rpi-rank">{team.rpiRank}</span>
                    <span className="rpi-value">({team.rpiValue})</span>
                  </td>
                  <td className="hide-mobile record-small">
                    {team.homeWins}-{team.homeLosses}
                  </td>
                  <td className="hide-mobile record-small">
                    {team.awayWins}-{team.awayLosses}
                  </td>
                  <td className="hide-mobile streak">
                    <span className={team.streak?.startsWith('W') ? 'win-streak' : 'loss-streak'}>
                      {team.streak}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="standings-legend">
        <span className="tournament-indicator">■</span> NCAA Tournament Position
      </div>

      <section className="optimizer-card" aria-labelledby="optimizer-heading">
        <div className="optimizer-header">
          <div>
            <h3 id="optimizer-heading">Schedule Optimizer</h3>
            <p className="optimizer-subhead">
              Build what-if matchups to forecast conference strength, RPI movement, and postseason odds.
            </p>
          </div>
          <span className={`membership-pill ${isProUser ? 'membership-pill--pro' : ''}`}>
            {isProUser ? 'Diamond Pro Active' : 'Diamond Pro Preview'}
          </span>
        </div>

        <div className="optimizer-grid">
          <div className="optimizer-panel">
            <label className="optimizer-label" htmlFor="team-select">Focus team</label>
            <select
              id="team-select"
              value={selectedTeamId}
              onChange={(e) => {
                setSelectedTeamId(e.target.value);
                setProspectiveMatchups([]);
                setOptimizerResult(null);
              }}
              className="optimizer-select"
            >
              {availableTeams.map((team) => {
                const key = team.id || team.teamId || team.slug || team.name;
                return (
                  <option key={key} value={key}>
                    {team.name}
                  </option>
                );
              })}
            </select>

            <div className="optimizer-input-row">
              <div className="optimizer-field">
                <label htmlFor="opponent-select">Prospective opponent</label>
                <select
                  id="opponent-select"
                  value={draftMatchup.opponentId}
                  onChange={(e) => setDraftMatchup((prev) => ({ ...prev, opponentId: e.target.value }))}
                >
                  <option value="">Select opponent</option>
                  {opponents.map((team) => {
                    const key = team.id || team.teamId || team.slug || team.name;
                    return (
                      <option key={key} value={key}>
                        {team.name}
                      </option>
                    );
                  })}
                </select>
              </div>
              <div className="optimizer-field">
                <label htmlFor="matchup-location">Venue</label>
                <select
                  id="matchup-location"
                  value={draftMatchup.location}
                  onChange={(e) => setDraftMatchup((prev) => ({ ...prev, location: e.target.value }))}
                >
                  <option value="home">Home</option>
                  <option value="away">Road</option>
                  <option value="neutral">Neutral</option>
                </select>
              </div>
            </div>

            <div className="optimizer-slider">
              <label htmlFor="win-slider">Expected win probability</label>
              <input
                id="win-slider"
                type="range"
                min="35"
                max="75"
                step="1"
                value={Math.round(draftMatchup.winProbability * 100)}
                onChange={(e) => setDraftMatchup((prev) => ({ ...prev, winProbability: Number(e.target.value) / 100 }))}
              />
              <span className="slider-value">{Math.round(draftMatchup.winProbability * 100)}%</span>
            </div>

            <button type="button" className="optimizer-add" onClick={handleAddMatchup}>
              Add matchup
            </button>
          </div>

          <div className="optimizer-panel">
            <h4 className="optimizer-panel-title">Scenario builder</h4>
            {prospectiveMatchups.length === 0 ? (
              <p className="optimizer-empty">Add opponents to simulate RPI movement.</p>
            ) : (
              <ul className="matchup-list">
                {prospectiveMatchups.map((matchup, index) => (
                  <li key={`${matchup.opponentId}-${index}`} className="matchup-item">
                    <div>
                      <span className="matchup-team">{matchup.opponentName}</span>
                      <span className="matchup-meta">
                        {matchup.location.charAt(0).toUpperCase() + matchup.location.slice(1)} · {Math.round(matchup.winProbability * 100)}% win prob
                      </span>
                    </div>
                    <button
                      type="button"
                      className="matchup-remove"
                      onClick={() => handleRemoveMatchup(index)}
                      aria-label={`Remove matchup versus ${matchup.opponentName}`}
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <div className="optimizer-slider">
              <label htmlFor="simulation-slider">Simulation paths</label>
              <input
                id="simulation-slider"
                type="range"
                min="100"
                max={simulationMax}
                step="50"
                value={simulationCount}
                onChange={(e) => setSimulationCount(Number(e.target.value))}
              />
              <span className="slider-value">{simulationCount.toLocaleString()}</span>
            </div>

            <button
              type="button"
              className="optimizer-run"
              onClick={handleRunSimulation}
              disabled={optimizerLoading}
            >
              {optimizerLoading ? 'Running simulations…' : 'Run optimization'}
            </button>
          </div>
        </div>

        {upsellPayload && showUpsell && (
          <div className="diamond-upsell" role="note">
            <div>
              <h4>{upsellPayload.headline}</h4>
              <p>{upsellPayload.message}</p>
              {Array.isArray(upsellPayload.bullets) && (
                <ul>
                  {upsellPayload.bullets.map((bullet, idx) => (
                    <li key={idx}>{bullet}</li>
                  ))}
                </ul>
              )}
            </div>
            <div className="upsell-actions">
              {Array.isArray(upsellPayload.actions) && upsellPayload.actions.map((action) => (
                <a key={action.href} className="upsell-link" href={action.href}>
                  {action.label}
                </a>
              ))}
            </div>
          </div>
        )}

        {optimizerResult && (
          <div className="optimizer-results">
            <div className="result-grid">
              <div className="result-card">
                <span className="result-label">Projected RPI</span>
                <strong>{optimizerResult.rpiProjection?.projectedRpi?.toFixed(3) ?? '—'}</strong>
                <span className="result-subtext">
                  Δ {optimizerResult.rpiProjection?.rpiDelta?.toFixed(3) ?? '0.000'} · Rank {optimizerResult.rpiProjection?.projectedRank ?? '—'}
                </span>
              </div>
              <div className="result-card">
                <span className="result-label">Conference Power</span>
                <strong>{optimizerResult.conferenceStrength?.rating ?? '—'}</strong>
                <span className="result-subtext">Confidence {optimizerResult.conferenceStrength?.confidence ?? '—'}</span>
              </div>
              <div className="result-card">
                <span className="result-label">Postseason Odds</span>
                <strong>{optimizerResult.scheduleImpact?.postseasonOdds?.projected ?? '—'}%</strong>
                <span className="result-subtext">
                  Δ {optimizerResult.scheduleImpact?.postseasonOdds?.delta ?? 0}%
                </span>
              </div>
            </div>

            <div className="result-table">
              <h4>Scenario Breakdown</h4>
              <table>
                <thead>
                  <tr>
                    <th>Opponent</th>
                    <th>Venue</th>
                    <th>Win %</th>
                    <th>RPI Impact</th>
                  </tr>
                </thead>
                <tbody>
                  {optimizerResult.rpiProjection?.scenarioBreakdown?.map((scenario) => (
                    <tr key={`${scenario.opponentId}-${scenario.location}`}>
                      <td>{scenario.opponentName}</td>
                      <td>{scenario.location}</td>
                      <td>{scenario.winProbability}%</td>
                      <td>{scenario.rpiContribution}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="distribution-table">
              <h4>Win Distribution</h4>
              <table>
                <thead>
                  <tr>
                    <th>Wins</th>
                    <th>Probability</th>
                  </tr>
                </thead>
                <tbody>
                  {optimizerResult.scheduleImpact?.distribution?.map((entry) => (
                    <tr key={entry.wins}>
                      <td>{entry.wins}</td>
                      <td>{entry.probability}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      <div className="stat-leaders">
        <h3>Conference Leaders</h3>
        <div className="leaders-grid">
          <div className="leader-category">
            <h4>Batting Average</h4>
            {standingsData.leaders.batting.map((player, idx) => (
              <div key={idx} className="leader-item">
                <span className="player-rank">{idx + 1}.</span>
                <span className="player-name">{player.name}</span>
                <span className="player-team">{player.team}</span>
                <span className="player-stat">{player.avg}</span>
              </div>
            ))}
          </div>

          <div className="leader-category">
            <h4>Home Runs</h4>
            {standingsData.leaders.homeruns.map((player, idx) => (
              <div key={idx} className="leader-item">
                <span className="player-rank">{idx + 1}.</span>
                <span className="player-name">{player.name}</span>
                <span className="player-team">{player.team}</span>
                <span className="player-stat">{player.hr}</span>
              </div>
            ))}
          </div>

          <div className="leader-category">
            <h4>ERA</h4>
            {standingsData.leaders.era.map((player, idx) => (
              <div key={idx} className="leader-item">
                <span className="player-rank">{idx + 1}.</span>
                <span className="player-name">{player.name}</span>
                <span className="player-team">{player.team}</span>
                <span className="player-stat">{player.era}</span>
              </div>
            ))}
          </div>

          <div className="leader-category">
            <h4>Strikeouts</h4>
            {standingsData.leaders.strikeouts.map((player, idx) => (
              <div key={idx} className="leader-item">
                <span className="player-rank">{idx + 1}.</span>
                <span className="player-name">{player.name}</span>
                <span className="player-team">{player.team}</span>
                <span className="player-stat">{player.k}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Standings;
