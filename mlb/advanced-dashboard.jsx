const { useState, useEffect, useMemo } = React;

const DEFAULT_PLAYER = { id: '518692', name: 'Shohei Ohtani' };
const DEFAULT_COMPARISONS = ['Mookie Betts'];

const STATUS_CLASS_MAP = {
  elite: 'status-elite',
  'above-average': 'status-above-average',
  average: 'status-average',
  'below-average': 'status-below-average',
  neutral: 'status-neutral'
};

const SPRAY_COLORS = {
  Single: '#38bdf8',
  Double: '#22c55e',
  Triple: '#a855f7',
  'Home Run': '#f97316'
};

const formatMetricValue = (value, digits = 3) => {
  if (value === null || value === undefined || value === '') {
    return '—';
  }
  const numeric = Number(value);
  if (Number.isFinite(numeric)) {
    return Number(digits) >= 0 ? numeric.toFixed(digits) : `${numeric}`;
  }
  return value;
};

async function lookupPlayer(name) {
  if (!name) return null;
  const response = await fetch(
    `https://statsapi.mlb.com/api/v1/people/search?name=${encodeURIComponent(name)}`
  );
  if (!response.ok) {
    throw new Error(`Player search failed (${response.status})`);
  }
  const data = await response.json();
  const person = data.people?.[0];
  return person ? { id: String(person.id), name: person.fullName } : null;
}

async function resolveComparisonsFromNames(names) {
  const selections = [];
  const seen = new Set();
  for (const rawName of names) {
    const name = rawName.trim();
    if (!name) continue;
    try {
      const result = await lookupPlayer(name);
      if (result && !seen.has(result.id)) {
        seen.add(result.id);
        selections.push(result);
      }
    } catch (error) {
      console.warn('Comparison lookup failed:', name, error);
    }
  }
  return selections;
}

const MetricCard = ({ label, value, digits = 3, suffix = '', hint }) => {
  const formatted = formatMetricValue(value, digits);
  return (
    <div className="metric-card">
      <span className="metric-label">{label}</span>
      <span className="metric-value">{formatted}{formatted !== '—' ? suffix : ''}</span>
      {hint ? <span className="metric-hint">{hint}</span> : null}
    </div>
  );
};

const StatusPill = ({ status, children }) => (
  <span className={`status-pill ${STATUS_CLASS_MAP[status] || 'status-neutral'}`}>{children}</span>
);

const SprayChart = ({ data }) => {
  if (!data || !Array.isArray(data.points) || data.points.length === 0) {
    return (
      <div className="chart-shell">
        <h3>Spray Chart</h3>
        <p style={{ color: 'var(--text-tertiary)' }}>
          Spray chart data is not available for this season.
        </p>
      </div>
    );
  }

  const points = data.points.slice(0, 220);
  return (
    <div className="chart-shell">
      <h3>Spray Chart</h3>
      <svg
        viewBox="-180 -180 360 220"
        role="img"
        aria-label="Spray chart showing batted ball distribution"
      >
        <path
          d="M -170 0 A 170 170 0 0 1 170 0"
          stroke="rgba(148, 163, 184, 0.35)"
          strokeWidth="2"
          fill="none"
        />
        <line x1="0" y1="0" x2="0" y2="-170" stroke="rgba(148, 163, 184, 0.25)" strokeDasharray="4 6" />
        <line x1="0" y1="0" x2="150" y2="-30" stroke="rgba(148, 163, 184, 0.25)" strokeDasharray="4 6" />
        <line x1="0" y1="0" x2="-150" y2="-30" stroke="rgba(148, 163, 184, 0.25)" strokeDasharray="4 6" />
        {points.map((point, index) => {
          const color = SPRAY_COLORS[point.type] || '#38bdf8';
          const radius = Math.max(3.2, 5.5 - index * 0.015);
          return (
            <circle
              key={`${point.type}-${index}`}
              cx={point.x}
              cy={-point.y}
              r={radius}
              fill={color}
              fillOpacity="0.8"
            >
              <title>{`${point.type} • ${point.sprayAngle}°`}</title>
            </circle>
          );
        })}
      </svg>
      <div className="legend">
        {Object.entries(SPRAY_COLORS).map(([label, color]) => (
          <span key={label}>
            <i style={{ background: color }}></i>
            {label}
          </span>
        ))}
      </div>
    </div>
  );
};

const PitchBreakPlot = ({ data }) => {
  const pitches = data?.pitches || [];
  if (pitches.length === 0) {
    return (
      <div className="chart-shell">
        <h3>Pitch Break Plot</h3>
        <p style={{ color: 'var(--text-tertiary)' }}>Pitch break visuals are not available.</p>
      </div>
    );
  }

  const horizontalMax = Math.max(...pitches.map((p) => Math.abs(p.horizontalBreak)), 1);
  const verticalMax = Math.max(...pitches.map((p) => Math.abs(p.verticalBreak)), 1);
  return (
    <div className="chart-shell">
      <h3>Pitch Break Plot</h3>
      <svg viewBox="0 0 120 120" role="img" aria-label="Pitch break by pitch type">
        <rect
          x="10"
          y="10"
          width="100"
          height="100"
          fill="rgba(148, 163, 184, 0.08)"
          stroke="rgba(148, 163, 184, 0.35)"
        />
        <line x1="60" y1="10" x2="60" y2="110" stroke="rgba(148, 163, 184, 0.2)" strokeDasharray="4 6" />
        <line x1="10" y1="60" x2="110" y2="60" stroke="rgba(148, 163, 184, 0.2)" strokeDasharray="4 6" />
        {pitches.map((pitch) => {
          const x = 60 + (pitch.horizontalBreak / (horizontalMax || 1)) * 40;
          const y = 60 - (pitch.verticalBreak / (verticalMax || 1)) * 40;
          const radius = Math.max(6, pitch.usage || 0);
          return (
            <g key={pitch.pitch}>
              <circle cx={x} cy={y} r={radius / 2.5} fill="rgba(249, 115, 22, 0.75)" />
              <text x={x + 8} y={y} fill="var(--text-secondary)" fontSize="10" dominantBaseline="middle">
                {pitch.pitch}
              </text>
            </g>
          );
        })}
      </svg>
      <p style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>
        Usage size scales with pitch frequency. Coordinates normalised to the largest horizontal and vertical break.
      </p>
    </div>
  );
};

const VelocityHistogram = ({ data }) => {
  const bins = data?.bins || [];
  if (bins.length === 0) {
    return (
      <div className="chart-shell">
        <h3>Velocity Distribution</h3>
        <p style={{ color: 'var(--text-tertiary)' }}>Velocity distribution data is not available.</p>
      </div>
    );
  }

  const maxDensity = Math.max(...bins.map((bin) => bin.density), 1);
  return (
    <div className="chart-shell">
      <h3>Velocity Distribution</h3>
      <svg viewBox="0 0 320 200" role="img" aria-label="Pitch velocity histogram">
        <line x1="20" y1="170" x2="300" y2="170" stroke="rgba(148, 163, 184, 0.35)" />
        {bins.map((bin, index) => {
          const barHeight = (bin.density / (maxDensity || 1)) * 140;
          const x = 30 + index * 24;
          return (
            <rect
              key={`${bin.velocity}-${index}`}
              x={x}
              y={170 - barHeight}
              width={18}
              height={barHeight}
              rx={4}
              fill="rgba(56, 189, 248, 0.7)"
            >
              <title>{`${bin.velocity} mph • ${bin.density} events`}</title>
            </rect>
          );
        })}
      </svg>
      <p style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>
        Derived from pitch usage and strikeout volume. Higher bars indicate more pitch events at that velocity bucket.
      </p>
    </div>
  );
};

const RollingChart = ({ data, title, color = '#38bdf8', description }) => {
  if (!Array.isArray(data) || data.length === 0) {
    return (
      <div className="chart-shell">
        <h3>{title}</h3>
        <p style={{ color: 'var(--text-tertiary)' }}>Insufficient rolling data.</p>
      </div>
    );
  }

  const series = data
    .map((point) => point.rollingValue ?? point.gameValue)
    .filter((value) => value !== null && value !== undefined && !Number.isNaN(value));

  if (series.length === 0) {
    return (
      <div className="chart-shell">
        <h3>{title}</h3>
        <p style={{ color: 'var(--text-tertiary)' }}>Insufficient rolling data.</p>
      </div>
    );
  }

  const min = Math.min(...series);
  const max = Math.max(...series);
  const width = 360;
  const height = 200;
  const padding = 28;
  const viewBox = `0 0 ${width} ${height}`;

  const buildPath = (key) => {
    return data
      .map((point, index) => {
        const raw = point[key];
        if (raw === null || raw === undefined || Number.isNaN(raw)) {
          return null;
        }
        const normalized = (raw - min) / ((max - min) || 1);
        const x = padding + (index / Math.max(1, data.length - 1)) * (width - padding * 2);
        const y = height - padding - normalized * (height - padding * 2);
        return `${index === 0 ? 'M' : 'L'}${x},${y}`;
      })
      .filter(Boolean)
      .join(' ');
  };

  const rollingPath = buildPath('rollingValue');
  const gamePath = buildPath('gameValue');

  return (
    <div className="chart-shell">
      <h3>{title}</h3>
      <svg viewBox={viewBox} role="img" aria-label={`${title} rolling chart`}>
        <rect
          x={padding}
          y={padding}
          width={width - padding * 2}
          height={height - padding * 2}
          fill="rgba(148, 163, 184, 0.05)"
          stroke="rgba(148, 163, 184, 0.2)"
        />
        {gamePath && (
          <path d={gamePath} fill="none" stroke="rgba(250, 204, 21, 0.35)" strokeWidth={2} strokeDasharray="6 4" />
        )}
        {rollingPath && <path d={rollingPath} fill="none" stroke={color} strokeWidth={3} />}
      </svg>
      {description ? (
        <p style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>{description}</p>
      ) : null}
    </div>
  );
};

const ComparisonTable = ({ comparisons }) => {
  if (!comparisons || comparisons.length === 0) {
    return (
      <div className="card">
        <h2 className="card-title">
          <i className="fas fa-user-friends"></i>
          Player Comparison
        </h2>
        <p style={{ color: 'var(--text-tertiary)' }}>
          Add comparison players to benchmark advanced metrics side-by-side.
        </p>
      </div>
    );
  }

  return (
    <div className="card">
      <h2 className="card-title">
        <i className="fas fa-user-friends"></i>
        Player Comparison
      </h2>
      <div className="table-responsive">
        <table className="comparison-table">
          <thead>
            <tr>
              <th>Player</th>
              <th>Team</th>
              <th>wOBA</th>
              <th>wRC+</th>
              <th>WAR</th>
              <th>FIP</th>
              <th>Avg EV</th>
              <th>Launch Angle</th>
              <th>ΔwOBA</th>
              <th>ΔWAR</th>
            </tr>
          </thead>
          <tbody>
            {comparisons.map((comp) => (
              <tr key={comp.playerId}>
                <td className="team-name">{comp.name}</td>
                <td>{comp.team || '—'}</td>
                <td>{formatMetricValue(comp.metrics?.wOBA)}</td>
                <td>{formatMetricValue(comp.metrics?.wRCPlus, 0)}</td>
                <td>{formatMetricValue(comp.metrics?.WAR, 2)}</td>
                <td>{formatMetricValue(comp.metrics?.FIP, 2)}</td>
                <td>{formatMetricValue(comp.metrics?.exitVelocity, 1)}</td>
                <td>{formatMetricValue(comp.metrics?.launchAngle, 1)}</td>
                <td>{formatMetricValue(comp.differential?.wOBA)}</td>
                <td>{formatMetricValue(comp.differential?.WAR, 2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const LeaderboardTable = ({ title, columns, rows }) => (
  <div className="card">
    <h2 className="card-title">
      <i className="fas fa-list-ol"></i>
      {title}
    </h2>
    <div className="table-responsive">
      <table className="standings-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key}>{column.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} style={{ padding: '16px', color: 'var(--text-tertiary)' }}>
                No data available.
              </td>
            </tr>
          ) : (
            rows.map((row, index) => (
              <tr key={row.playerId || row.teamId || index}>
                {columns.map((column) => (
                  <td key={column.key}>
                    {column.render ? column.render(row, index) : row[column.key] ?? '—'}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  </div>
);

const MLBIntelligenceHub = () => {
  const currentSeason = new Date().getFullYear();
  const [season, setSeason] = useState(currentSeason);
  const [playerInput, setPlayerInput] = useState(DEFAULT_PLAYER.name);
  const [compareInput, setCompareInput] = useState(DEFAULT_COMPARISONS.join(', '));
  const [selection, setSelection] = useState({ player: DEFAULT_PLAYER, comparisons: [] });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('profile');
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadData = async (playerSelection, comparisonSelections, seasonValue) => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      params.set('playerId', playerSelection.id);
      params.set('season', seasonValue);
      comparisonSelections.forEach((item) => params.append('compare', item.id));
      const response = await fetch(`/api/mlb-advanced?${params.toString()}`);
      if (!response.ok) {
        const message = await response.text();
        throw new Error(`Advanced data request failed (${response.status}): ${message}`);
      }
      const payload = await response.json();
      setData(payload);
      setSelection({ player: playerSelection, comparisons: comparisonSelections });
      setLastUpdated(new Date().toISOString());
    } catch (err) {
      console.error('Advanced MLB dashboard error:', err);
      setError(err.message || 'Unable to load advanced MLB data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const comparisons = await resolveComparisonsFromNames(DEFAULT_COMPARISONS);
        await loadData(DEFAULT_PLAYER, comparisons, currentSeason);
      } catch (err) {
        console.error('Initial MLB intelligence load failed:', err);
        setError(err.message || 'Failed to load initial intelligence data');
        setLoading(false);
      }
    })();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const query = playerInput.trim();
    if (!query) {
      setError('Please enter a player name.');
      return;
    }
    try {
      setLoading(true);
      setError('');
      const playerResult = await lookupPlayer(query);
      if (!playerResult) {
        throw new Error(`No MLB player found for "${query}"`);
      }
      const comparisonNames = compareInput
        .split(',')
        .map((name) => name.trim())
        .filter(Boolean);
      const comparisonSelections = await resolveComparisonsFromNames(comparisonNames);
      await loadData(playerResult, comparisonSelections, season);
    } catch (err) {
      console.error('Player selection failed:', err);
      setError(err.message || 'Failed to resolve player selection');
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    if (selection.player) {
      loadData(selection.player, selection.comparisons, season);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Advanced Player Profile' },
    { id: 'dashboard', label: 'Real-Time Dashboard' },
    { id: 'statcast', label: 'Statcast Deep Dive' },
    { id: 'scouting', label: 'Scouting & Splits' },
    { id: 'team', label: 'Team Analysis' },
    { id: 'batch', label: 'Batch & API Services' }
  ];

  const playerProfile = data?.player;
  const hittingMetrics = playerProfile?.advancedMetrics?.hitting || {};
  const pitchingMetrics = playerProfile?.advancedMetrics?.pitching || {};
  const teamModule = data?.team;

  const hitterColumns = useMemo(
    () => [
      { key: 'rank', header: '#', render: (_, index) => index + 1 },
      { key: 'name', header: 'Player' },
      { key: 'team', header: 'Team' },
      { key: 'wOBA', header: 'wOBA', render: (row) => formatMetricValue(row.wOBA) },
      { key: 'wRCPlus', header: 'wRC+', render: (row) => formatMetricValue(row.wRCPlus, 0) },
      { key: 'plateAppearances', header: 'PA' },
      { key: 'homeRuns', header: 'HR' }
    ],
    []
  );

  const pitcherColumns = useMemo(
    () => [
      { key: 'rank', header: '#', render: (_, index) => index + 1 },
      { key: 'name', header: 'Player' },
      { key: 'team', header: 'Team' },
      { key: 'era', header: 'ERA', render: (row) => formatMetricValue(row.era, 2) },
      { key: 'fip', header: 'FIP', render: (row) => formatMetricValue(row.fip, 2) },
      { key: 'strikeouts', header: 'K' },
      { key: 'inningsPitched', header: 'IP', render: (row) => formatMetricValue(row.inningsPitched, 1) }
    ],
    []
  );

  const teamHittingColumns = useMemo(
    () => [
      { key: 'rank', header: '#', render: (_, index) => index + 1 },
      { key: 'team', header: 'Team' },
      { key: 'runs', header: 'Runs' },
      { key: 'homeRuns', header: 'HR' },
      { key: 'battingAverage', header: 'AVG', render: (row) => formatMetricValue(row.battingAverage) },
      { key: 'slugging', header: 'SLG', render: (row) => formatMetricValue(row.slugging) }
    ],
    []
  );

  const teamPitchingColumns = useMemo(
    () => [
      { key: 'rank', header: '#', render: (_, index) => index + 1 },
      { key: 'team', header: 'Team' },
      { key: 'era', header: 'ERA', render: (row) => formatMetricValue(row.era, 2) },
      { key: 'whip', header: 'WHIP', render: (row) => formatMetricValue(row.whip, 2) },
      { key: 'strikeouts', header: 'K' }
    ],
    []
  );

  const renderProfile = () => (
    <>
      <div className="card">
        <div className="player-header">
          <img
            src={playerProfile?.profile?.headshot}
            alt={`${playerProfile?.profile?.name || 'Player'} headshot`}
          />
          <div className="player-meta">
            <h2>{playerProfile?.profile?.name || '—'}</h2>
            <span>{playerProfile?.profile?.team || 'Free Agent'} • {playerProfile?.profile?.primaryPosition || '—'}</span>
            {selection.player ? <span className="badge">Active Player: {selection.player.name}</span> : null}
            {lastUpdated ? (
              <span style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>
                Last updated {new Date(lastUpdated).toLocaleString()}
              </span>
            ) : null}
          </div>
          {playerProfile?.profile?.teamLogo ? (
            <img
              className="team-emblem"
              src={playerProfile.profile.teamLogo}
              alt={`${playerProfile.profile.team} logo`}
            />
          ) : null}
        </div>
        <div className="metrics-grid">
          <MetricCard label="wOBA" value={hittingMetrics.wOBA} digits={3} hint="Weighted On-Base Average" />
          <MetricCard label="wRC+" value={hittingMetrics.wRCPlus} digits={0} hint="Run Creation Index" />
          <MetricCard label="WAR" value={hittingMetrics.WAR} digits={2} hint="Wins Above Replacement (Batting)" />
          <MetricCard label="xwOBA" value={hittingMetrics.xwOBA} digits={3} hint="Modeled Expected wOBA" />
          <MetricCard label="Avg EV" value={hittingMetrics.avgExitVelocity} digits={1} suffix=" mph" hint="Average Exit Velocity" />
          <MetricCard label="Launch°" value={hittingMetrics.avgLaunchAngle} digits={1} suffix="°" hint="Average Launch Angle" />
          <MetricCard label="FIP" value={pitchingMetrics.fip} digits={2} hint="Fielding Independent Pitching" />
          <MetricCard label="Pitch WAR" value={pitchingMetrics.WAR} digits={2} hint="Wins Above Replacement (Pitching)" />
        </div>
      </div>
      <ComparisonTable comparisons={data?.comparisons} />
    </>
  );

  const renderStatcast = () => {
    const statcastModule = data?.statcast || {};
    const battedBall = statcastModule.battedBall || {};
    const pitchSummary = statcastModule.pitchLevel?.summary || {};

    const xwobaDisplay = formatMetricValue(battedBall.xwOBA ?? hittingMetrics.xwOBA);
    const exitVelocityDisplay = formatMetricValue(
      battedBall.exitVelocity ?? hittingMetrics.avgExitVelocity,
      1
    );
    const hardHitDisplay = formatMetricValue(
      battedBall.hardHitRate ?? hittingMetrics.hardContactRate,
      1
    );
    const barrelDisplay = formatMetricValue(
      battedBall.barrelRate ?? hittingMetrics.barrelRate,
      1
    );
    const avgSpinDisplay = formatMetricValue(pitchSummary.avgSpinRate, 0);
    const topVeloDisplay = formatMetricValue(pitchSummary.maxVelocity, 1);
    const avgVeloDisplay = formatMetricValue(pitchSummary.avgVelocity, 1);
    const totalPitchesDisplay = formatMetricValue(pitchSummary.totalPitches, 0);
    const totalBattedBallsDisplay = formatMetricValue(battedBall.totalBattedBalls, 0);

    return (
      <div className="chart-grid">
        <div className="chart-shell">
          <h3>Statcast Snapshot</h3>
          <div className="snapshot-grid" style={{ marginTop: '12px' }}>
            <div className="snapshot-card">
              <span>xwOBA</span>
              <span className="snapshot-value">{xwobaDisplay}</span>
            </div>
            <div className="snapshot-card">
              <span>Avg EV</span>
              <span className="snapshot-value">
                {exitVelocityDisplay}
                {exitVelocityDisplay !== '—' ? ' mph' : ''}
              </span>
            </div>
            <div className="snapshot-card">
              <span>Hard Hit%</span>
              <span className="snapshot-value">
                {hardHitDisplay}
                {hardHitDisplay !== '—' ? '%' : ''}
              </span>
            </div>
            <div className="snapshot-card">
              <span>Barrel%</span>
              <span className="snapshot-value">
                {barrelDisplay}
                {barrelDisplay !== '—' ? '%' : ''}
              </span>
            </div>
            <div className="snapshot-card">
              <span>Avg Spin</span>
              <span className="snapshot-value">
                {avgSpinDisplay}
                {avgSpinDisplay !== '—' ? ' rpm' : ''}
              </span>
            </div>
            <div className="snapshot-card">
              <span>Top Velo</span>
              <span className="snapshot-value">
                {topVeloDisplay}
                {topVeloDisplay !== '—' ? ' mph' : ''}
              </span>
            </div>
            <div className="snapshot-card">
              <span>Avg Velo</span>
              <span className="snapshot-value">
                {avgVeloDisplay}
                {avgVeloDisplay !== '—' ? ' mph' : ''}
              </span>
            </div>
            <div className="snapshot-card">
              <span>Total Pitches</span>
              <span className="snapshot-value">{totalPitchesDisplay}</span>
            </div>
            <div className="snapshot-card">
              <span>Batted Balls</span>
              <span className="snapshot-value">{totalBattedBallsDisplay}</span>
            </div>
          </div>
        </div>
        <SprayChart data={playerProfile?.visualizations?.sprayChart} />
        <PitchBreakPlot data={playerProfile?.visualizations?.pitchBreak} />
        <VelocityHistogram data={playerProfile?.visualizations?.velocityDistribution} />
        <RollingChart
          data={playerProfile?.visualizations?.rolling?.offense}
          title="Rolling wOBA (7-game)"
          color="#38bdf8"
          description="Seven-game rolling wOBA to identify hot and cold streaks across the season."
        />
        <RollingChart
          data={playerProfile?.visualizations?.rolling?.pitching}
          title="Rolling FIP (5-game)"
          color="#f97316"
          description="Five-game rolling Fielding Independent Pitching for stability of command and bat-missing ability."
        />
      </div>
    );
  };

  const renderDashboard = () => {
    const dashboard = data?.realtimeDashboard;
    const snapshot = dashboard?.playerSnapshot || {};
    const colorLegend = dashboard?.colorLegend || {};

    return (
      <>
        <div className="card">
          <h2 className="card-title">
            <i className="fas fa-gauge-high"></i>
            Player Snapshot vs League Averages
          </h2>
          <div className="snapshot-grid">
            <div className="snapshot-card">
              <span>wOBA</span>
              <span className="snapshot-value">{formatMetricValue(snapshot.wOBA)}</span>
              <StatusPill status={snapshot.wOBAColor}>League Index</StatusPill>
            </div>
            <div className="snapshot-card">
              <span>wRC+</span>
              <span className="snapshot-value">{formatMetricValue(snapshot.wRCPlus, 0)}</span>
            </div>
            <div className="snapshot-card">
              <span>WAR</span>
              <span className="snapshot-value">{formatMetricValue(snapshot.war, 2)}</span>
            </div>
            <div className="snapshot-card">
              <span>FIP</span>
              <span className="snapshot-value">{formatMetricValue(snapshot.fip, 2)}</span>
              <StatusPill status={snapshot.fipColor}>Run Prevention</StatusPill>
            </div>
          </div>
          <div className="legend" style={{ marginTop: '16px' }}>
            {Object.entries(colorLegend).map(([label, color]) => (
              <span key={label}>
                <i style={{ background: color }}></i>
                {label.replace('-', ' ')}
              </span>
            ))}
          </div>
        </div>
        <div className="leaderboard-grid">
          <LeaderboardTable
            title="League Batting Leaders"
            columns={hitterColumns}
            rows={dashboard?.leagueLeaders?.hitters || []}
          />
          <LeaderboardTable
            title="League Pitching Leaders"
            columns={pitcherColumns}
            rows={dashboard?.leagueLeaders?.pitchers || []}
          />
          <LeaderboardTable
            title="Team Hitting Leaderboard"
            columns={teamHittingColumns}
            rows={dashboard?.teamLeaderboards?.hitting || []}
          />
          <LeaderboardTable
            title="Team Pitching Leaderboard"
            columns={teamPitchingColumns}
            rows={dashboard?.teamLeaderboards?.pitching || []}
          />
        </div>
      </>
    );
  };

  const renderScouting = () => (
    <div className="card">
      <h2 className="card-title">
        <i className="fas fa-binoculars"></i>
        Scouting Report & Splits
      </h2>
      <div style={{ display: 'grid', gap: '20px' }}>
        {playerProfile?.scoutingReport?.map((paragraph, index) => (
          <p key={index} style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            {paragraph}
          </p>
        )) || (
          <p style={{ color: 'var(--text-tertiary)' }}>Scouting narrative not available.</p>
        )}
        <div className="split-grid">
          <div>
            <h3 style={{ marginBottom: '12px' }}>Hitting Splits</h3>
            <table className="standings-table">
              <thead>
                <tr>
                  <th>Split</th>
                  <th>AVG</th>
                  <th>OBP</th>
                  <th>OPS</th>
                </tr>
              </thead>
              <tbody>
                {playerProfile?.splits?.hitting?.map((split) => (
                  <tr key={split.label}>
                    <td className="team-name">{split.label}</td>
                    <td>{formatMetricValue(split.avg)}</td>
                    <td>{formatMetricValue(split.obp)}</td>
                    <td>{formatMetricValue(split.ops)}</td>
                  </tr>
                )) || (
                  <tr>
                    <td colSpan={4} style={{ color: 'var(--text-tertiary)' }}>
                      No hitting split data.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div>
            <h3 style={{ marginBottom: '12px' }}>Pitching Splits</h3>
            <table className="standings-table">
              <thead>
                <tr>
                  <th>Split</th>
                  <th>ERA</th>
                  <th>WHIP</th>
                  <th>K/9</th>
                </tr>
              </thead>
              <tbody>
                {playerProfile?.splits?.pitching?.map((split) => (
                  <tr key={split.label}>
                    <td className="team-name">{split.label}</td>
                    <td>{formatMetricValue(split.era, 2)}</td>
                    <td>{formatMetricValue(split.whip, 2)}</td>
                    <td>{formatMetricValue(split.kPerNine, 2)}</td>
                  </tr>
                )) || (
                  <tr>
                    <td colSpan={4} style={{ color: 'var(--text-tertiary)' }}>
                      No pitching split data.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTeam = () => {
    if (!teamModule) {
      return (
        <div className="card">
          <h2 className="card-title">
            <i className="fas fa-users"></i>
            Team Intelligence
          </h2>
          <p style={{ color: 'var(--text-tertiary)' }}>Team-level data is not available for this player.</p>
        </div>
      );
    }

    const roster = (teamModule.roster || []).slice(0, 25);
    const upcoming = teamModule.schedule?.upcoming || [];
    const recent = teamModule.schedule?.recent || [];

    return (
      <>
        <div className="card">
          <h2 className="card-title">
            <i className="fas fa-flag"></i>
            {teamModule.team?.name || 'Team Overview'}
          </h2>
          <div className="metrics-grid" style={{ marginBottom: '20px' }}>
            <MetricCard label="Team wOBA" value={teamModule.hitting?.wOBA} digits={3} hint="Team hitting efficiency" />
            <MetricCard label="Team wRC+" value={teamModule.hitting?.wRCPlus} digits={0} hint="Run creation vs league" />
            <MetricCard label="Team FIP" value={teamModule.pitching?.fip} digits={2} hint="Pitching quality" />
            <MetricCard label="Pitch WAR" value={teamModule.pitching?.WAR} digits={2} hint="Rotation & bullpen WAR" />
          </div>
          <div className="table-responsive">
            <table className="standings-table">
              <thead>
                <tr>
                  <th>Player</th>
                  <th>Position</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {roster.map((player) => (
                  <tr key={player.id}>
                    <td className="team-name">{player.name}</td>
                    <td>{player.position || '—'}</td>
                    <td style={{ color: player.status === 'Active' ? '#22c55e' : '#fbbf24' }}>
                      {player.status || 'Unknown'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="card">
          <h2 className="card-title">
            <i className="fas fa-calendar-alt"></i>
            Schedule & Results
          </h2>
          <div className="schedule-grid">
            <div>
              <h3 style={{ marginBottom: '12px' }}>Upcoming</h3>
              {upcoming.length === 0 ? (
                <p style={{ color: 'var(--text-tertiary)' }}>No upcoming games recorded.</p>
              ) : (
                upcoming.map((game) => (
                  <div key={game.gamePk} className="schedule-card">
                    <span className="team-name">{game.opponent || 'TBD'}</span>
                    <span style={{ color: 'var(--text-tertiary)' }}>
                      {new Date(game.date).toLocaleString()}
                    </span>
                    <span>{game.home ? 'Home' : 'Away'}</span>
                    <span style={{ color: 'var(--text-tertiary)' }}>{game.result || 'Scheduled'}</span>
                  </div>
                ))
              )}
            </div>
            <div>
              <h3 style={{ marginBottom: '12px' }}>Recent</h3>
              {recent.length === 0 ? (
                <p style={{ color: 'var(--text-tertiary)' }}>No recent results recorded.</p>
              ) : (
                recent.map((game) => (
                  <div key={game.gamePk} className="schedule-card">
                    <span className="team-name">{game.opponent || 'TBD'}</span>
                    <span style={{ color: 'var(--text-tertiary)' }}>
                      {new Date(game.date).toLocaleDateString()}
                    </span>
                    <span>{game.home ? 'Home' : 'Away'}</span>
                    <span style={{ color: 'var(--text-tertiary)' }}>{game.result || 'Final'}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </>
    );
  };

  const renderBatch = () => {
    const batch = data?.batchProcessing;
    const apiDirectory = data?.apiDirectory;
    const exports = data?.exports;

    return (
      <>
        <div className="card">
          <h2 className="card-title">
            <i className="fas fa-layer-group"></i>
            Batch Reporting Summary
          </h2>
          <div className="metrics-grid" style={{ marginBottom: '16px' }}>
            <MetricCard label="Season" value={batch?.season} digits={0} hint="Data window" />
            <MetricCard label="Division Reports" value={batch?.divisionReports?.length || 0} digits={0} hint="Prepared opponents" />
            <MetricCard label="Matchup Outlooks" value={batch?.matchupOutlook?.length || 0} digits={0} hint="Comparative snapshots" />
          </div>
          <div className="table-responsive">
            <table className="standings-table">
              <thead>
                <tr>
                  <th>Opponent</th>
                  <th>Runs</th>
                  <th>Home Runs</th>
                  <th>SLG</th>
                  <th>Slugging Δ</th>
                </tr>
              </thead>
              <tbody>
                {(batch?.divisionReports || []).map((report, index) => {
                  const delta = batch?.matchupOutlook?.[index];
                  return (
                    <tr key={report.team}>
                      <td className="team-name">{report.team}</td>
                      <td>{report.runs}</td>
                      <td>{report.homeRuns}</td>
                      <td>{formatMetricValue(report.slugging)}</td>
                      <td>{formatMetricValue(delta?.sluggingDelta)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        <div className="card">
          <h2 className="card-title">
            <i className="fas fa-plug"></i>
            API & Data Services
          </h2>
          <div className="api-grid">
            {(apiDirectory?.rest || []).map((endpoint) => (
              <div key={endpoint.url} className="schedule-card">
                <span className="team-name">{endpoint.name}</span>
                <span style={{ fontFamily: 'monospace', color: 'var(--text-tertiary)' }}>{endpoint.method}</span>
                <code style={{ fontSize: '0.85rem', wordBreak: 'break-word' }}>{endpoint.url}</code>
              </div>
            ))}
          </div>
          <div style={{ marginTop: '20px' }}>
            <h3>Database Integration</h3>
            <p style={{ color: 'var(--text-tertiary)' }}>
              Schema: <strong>{apiDirectory?.database?.schema || 'analytics'}</strong> • Tables: {apiDirectory?.database?.tables?.join(', ') || '—'}
            </p>
            <pre
              style={{
                background: 'rgba(15, 23, 42, 0.9)',
                border: '1px solid var(--glass-border)',
                borderRadius: '8px',
                padding: '12px',
                color: 'var(--text-primary)',
                overflowX: 'auto'
              }}
            >
{apiDirectory?.database?.sampleQuery || 'SELECT ...'}
            </pre>
          </div>
        </div>
        <div className="card">
          <h2 className="card-title">
            <i className="fas fa-file-export"></i>
            Exports
          </h2>
          <div className="export-block">
            <span className="metric-label">Player CSV Snapshot</span>
            <textarea readOnly value={exports?.playerCsv || 'No export generated yet.'}></textarea>
          </div>
        </div>
      </>
    );
  };

  return (
    <div>
      <div className="card control-panel">
        <form onSubmit={handleSubmit}>
          <div>
            <label htmlFor="playerName">Player</label>
            <input
              id="playerName"
              value={playerInput}
              onChange={(event) => setPlayerInput(event.target.value)}
              placeholder="Shohei Ohtani"
            />
          </div>
          <div>
            <label htmlFor="comparisonNames">Comparison Players</label>
            <input
              id="comparisonNames"
              value={compareInput}
              onChange={(event) => setCompareInput(event.target.value)}
              placeholder="Mookie Betts, Juan Soto"
            />
          </div>
          <div>
            <label htmlFor="season">Season</label>
            <input
              id="season"
              type="number"
              min="2008"
              max={currentSeason}
              value={season}
              onChange={(event) => setSeason(Number(event.target.value) || currentSeason)}
            />
          </div>
          <div className="control-actions" style={{ gridColumn: '1 / -1' }}>
            <button type="submit" className="primary-btn" disabled={loading}>
              {loading ? 'Loading…' : 'Load Intelligence'}
            </button>
            <button type="button" className="ghost-btn" onClick={handleRefresh} disabled={loading}>
              Refresh
            </button>
          </div>
        </form>
      </div>

      {error && (
        <div className="card" style={{ border: '1px solid rgba(220, 38, 38, 0.4)', background: 'rgba(220, 38, 38, 0.08)' }}>
          <strong style={{ color: '#f87171' }}>⚠️ {error}</strong>
        </div>
      )}

      {loading && (
        <div className="card">
          <div className="loading">
            <i className="fas fa-baseball-ball"></i>
            <p style={{ marginTop: '20px' }}>Synchronizing MLB intelligence data…</p>
          </div>
        </div>
      )}

      {!loading && data && (
        <>
          <div className="tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={`tab ${activeTab === tab.id ? 'active' : ''}`}
                type="button"
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'profile' && renderProfile()}
          {activeTab === 'dashboard' && renderDashboard()}
          {activeTab === 'statcast' && renderStatcast()}
          {activeTab === 'scouting' && renderScouting()}
          {activeTab === 'team' && renderTeam()}
          {activeTab === 'batch' && renderBatch()}
        </>
      )}
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(<MLBIntelligenceHub />);
