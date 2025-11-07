/**
 * College Football Playoff Worker
 *
 * Features:
 * - Top 25 CFP Rankings Board
 * - Monte Carlo Playoff Predictions
 * - 12-team Playoff Bracket Simulation
 *
 * @author Blaze Sports Intel
 */

import rankingsData from '../../data/cfp/rankings.json';

interface RankingEntry {
  rank: number;
  team: string;
  conference: string;
  record: string;
  previousRank?: number | null;
  movement?: string;
  pointsFor: number;
  pointsAgainst: number;
  wins: number;
  losses: number;
  strengthOfSchedule: number;
  playoffChance: number;
}

interface RankingsPayload {
  poll: string;
  season: number;
  lastUpdated: string;
  timezone?: string;
  source?: string;
  dataFreshness?: string;
  dataStatus?: string;
  rankings: RankingEntry[];
  playoffFormat?: {
    teams: number;
    autoQualifiers: number;
    description: string;
  };
  conferenceDistribution?: Record<string, number>;
  notes?: string[];
}

type Env = Record<string, never>;

const data = rankingsData as RankingsPayload;

// Monte Carlo Simulation for Playoff Predictions
interface PlayoffSimulation {
  team: string;
  rank: number;
  makePlayoff: number;
  firstRoundBye: number;
  semiFinal: number;
  championship: number;
  winner: number;
}

/**
 * Run Monte Carlo simulation for playoff predictions
 */
function runPlayoffSimulation(teams: RankingEntry[], simulations = 10000): PlayoffSimulation[] {
  const results: Map<string, PlayoffSimulation> = new Map();

  teams.forEach(team => {
    results.set(team.team, {
      team: team.team,
      rank: team.rank,
      makePlayoff: 0,
      firstRoundBye: 0,
      semiFinal: 0,
      championship: 0,
      winner: 0,
    });
  });

  // Run simulations
  for (let i = 0; i < simulations; i++) {
    const simulatedRankings = simulateSeasonOutcome(teams);
    const playoffTeams = determinePlayoffTeams(simulatedRankings);

    // Track playoff appearances
    playoffTeams.forEach((team, index) => {
      const result = results.get(team.team)!;
      result.makePlayoff++;

      // Top 4 get first-round byes
      if (index < 4) {
        result.firstRoundBye++;
      }

      // Simulate playoff rounds based on seed strength
      const advanceProb = calculateAdvanceProbability(team, index);

      if (Math.random() < advanceProb) {
        result.semiFinal++;

        if (Math.random() < advanceProb * 0.7) {
          result.championship++;

          if (Math.random() < advanceProb * 0.5) {
            result.winner++;
          }
        }
      }
    });
  }

  // Convert counts to percentages
  const simulationResults: PlayoffSimulation[] = [];
  results.forEach(result => {
    simulationResults.push({
      team: result.team,
      rank: result.rank,
      makePlayoff: Math.round((result.makePlayoff / simulations) * 1000) / 10,
      firstRoundBye: Math.round((result.firstRoundBye / simulations) * 1000) / 10,
      semiFinal: Math.round((result.semiFinal / simulations) * 1000) / 10,
      championship: Math.round((result.championship / simulations) * 1000) / 10,
      winner: Math.round((result.winner / simulations) * 1000) / 10,
    });
  });

  return simulationResults.sort((a, b) => a.rank - b.rank);
}

/**
 * Simulate remaining season outcomes with variance
 */
function simulateSeasonOutcome(teams: RankingEntry[]): RankingEntry[] {
  return teams.map(team => {
    // Add variance to current win probability based on SOS
    const baseWinProb = team.wins / (team.wins + team.losses);
    const variance = (Math.random() - 0.5) * 0.15;
    const adjustedWinProb = Math.max(0.3, Math.min(0.95, baseWinProb + variance));

    // Simulate remaining 3 games
    let simulatedWins = team.wins;
    const remainingGames = 3;

    for (let i = 0; i < remainingGames; i++) {
      const gameProb = adjustedWinProb * (1 - team.strengthOfSchedule * 0.3);
      if (Math.random() < gameProb) {
        simulatedWins++;
      }
    }

    return {
      ...team,
      wins: simulatedWins,
    };
  }).sort((a, b) => {
    // Sort by wins, then by SOS
    if (b.wins !== a.wins) return b.wins - a.wins;
    return b.strengthOfSchedule - a.strengthOfSchedule;
  });
}

/**
 * Determine 12-team playoff field
 */
function determinePlayoffTeams(teams: RankingEntry[]): RankingEntry[] {
  // 5 conference champions (top team from each power conference)
  const conferenceChamps = new Map<string, RankingEntry>();

  teams.forEach(team => {
    if (!conferenceChamps.has(team.conference)) {
      conferenceChamps.set(team.conference, team);
    }
  });

  const playoffTeams = Array.from(conferenceChamps.values()).slice(0, 5);

  // Fill remaining 7 spots with highest-ranked teams
  const remaining = teams.filter(t => !playoffTeams.includes(t));
  playoffTeams.push(...remaining.slice(0, 7));

  return playoffTeams.slice(0, 12);
}

/**
 * Calculate advancement probability based on seed and team strength
 */
function calculateAdvanceProbability(team: RankingEntry, seed: number): number {
  const baseProb = 0.85 - (seed * 0.05);
  const sosBonus = team.strengthOfSchedule * 0.1;
  return Math.max(0.25, Math.min(0.85, baseProb + sosBonus));
}

function formatCentralTimeTimestamp(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return 'Unavailable';
  }

  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  }).format(date);
}

function renderMovement(entry: RankingEntry): { label: string; direction: 'up' | 'down' | 'steady' | 'new'; } {
  const raw = entry.movement?.trim();

  if (!raw || raw === '0' || raw === '—' || raw === '-') {
    return { label: '—', direction: 'steady' };
  }

  if (raw === 'NR' || raw === 'NEW') {
    return { label: 'NEW', direction: 'new' };
  }

  const numeric = Number.parseInt(raw, 10);
  if (Number.isNaN(numeric) || numeric === 0) {
    return { label: '—', direction: 'steady' };
  }

  if (numeric > 0) {
    return { label: `▲ ${numeric}`, direction: 'up' };
  }

  return { label: `▼ ${Math.abs(numeric)}`, direction: 'down' };
}

function buildPlayoffPredictionCards(): string {
  const playoffSims = runPlayoffSimulation(data.rankings);
  const top12 = playoffSims.slice(0, 12);

  const cards = top12.map((sim, index) => {
    const isAutoQualifier = index < 4;
    const badgeClass = isAutoQualifier ? 'bye-badge' : 'playoff-badge';
    const badgeText = isAutoQualifier ? 'BYE' : `#${index + 1}`;

    return `
      <div class="prediction-card ${isAutoQualifier ? 'has-bye' : ''}">
        <div class="card-header">
          <span class="team-rank">#${sim.rank}</span>
          <span class="${badgeClass}">${badgeText}</span>
        </div>
        <h3 class="team-name-card">${sim.team}</h3>
        <div class="prob-grid">
          <div class="prob-item">
            <span class="prob-label">Playoff</span>
            <span class="prob-value">${sim.makePlayoff}%</span>
          </div>
          <div class="prob-item">
            <span class="prob-label">Semi</span>
            <span class="prob-value">${sim.semiFinal}%</span>
          </div>
          <div class="prob-item">
            <span class="prob-label">Final</span>
            <span class="prob-value">${sim.championship}%</span>
          </div>
          <div class="prob-item">
            <span class="prob-label">Champion</span>
            <span class="prob-value champion">${sim.winner}%</span>
          </div>
        </div>
      </div>
    `;
  }).join('');

  return `
    <section class="playoff-predictions">
      <div class="section-header">
        <h2>Monte Carlo Playoff Predictions</h2>
        <p class="section-subtitle">10,000 simulations of remaining season + playoff scenarios</p>
      </div>
      <div class="predictions-grid">
        ${cards}
      </div>
    </section>
  `;
}

function buildSummaryCards(entries: RankingEntry[]): string {
  const secTeams = entries.filter((team) => team.conference === 'SEC').length;
  const bigTenTeams = entries.filter((team) => team.conference === 'Big Ten').length;
  const undefeated = entries.filter(team => team.losses === 0).length;
  const topFive = entries
    .filter((team) => team.rank <= 5)
    .map((team) => team.team.split(' ').slice(-1)[0]) // Get last word (mascot)
    .join(', ');

  return `
    <section class="metrics">
      <div class="metric-card">
        <span class="metric-label">SEC Teams</span>
        <span class="metric-value">${secTeams}</span>
      </div>
      <div class="metric-card">
        <span class="metric-label">Big Ten Teams</span>
        <span class="metric-value">${bigTenTeams}</span>
      </div>
      <div class="metric-card">
        <span class="metric-label">Undefeated</span>
        <span class="metric-value">${undefeated}</span>
      </div>
      <div class="metric-card top-five-card">
        <span class="metric-label">Top 5</span>
        <span class="metric-value-text">${topFive}</span>
      </div>
    </section>
  `;
}

function buildRankingsTable(entries: RankingEntry[]): string {
  const rows = entries
    .map((entry) => {
      const movement = renderMovement(entry);
      const previous = entry.previousRank ?? '—';
      const playoffBadge = entry.rank <= 12 ? '<span class="playoff-indicator">PLAYOFF</span>' : '';

      return `
        <tr class="${entry.rank <= 12 ? 'in-playoff' : ''}">
          <td class="rank">${entry.rank}</td>
          <td class="team">
            <div class="team-info">
              <span class="team-name">${entry.team} ${playoffBadge}</span>
              <span class="conference">${entry.conference}</span>
            </div>
          </td>
          <td class="record">${entry.record}</td>
          <td class="sos">${(entry.strengthOfSchedule * 100).toFixed(0)}</td>
          <td class="playoff-chance">
            <div class="chance-bar-container">
              <div class="chance-bar" style="width: ${entry.playoffChance}%"></div>
              <span class="chance-text">${entry.playoffChance}%</span>
            </div>
          </td>
          <td class="previous">${previous}</td>
          <td class="movement ${movement.direction}">${movement.label}</td>
        </tr>
      `;
    })
    .join('');

  return `
    <section aria-labelledby="rankings-heading" class="table-wrapper">
      <div class="table-header">
        <h2 id="rankings-heading">${data.poll} &mdash; Top 25</h2>
        <p class="table-subtitle">Week 10 rankings • ${data.season} Season • 12-Team Playoff Format</p>
      </div>
      <div class="table-container" role="region" aria-live="polite">
        <table>
          <thead>
            <tr>
              <th scope="col">Rank</th>
              <th scope="col">Team</th>
              <th scope="col">Record</th>
              <th scope="col">SOS</th>
              <th scope="col">Playoff Chance</th>
              <th scope="col">Prev.</th>
              <th scope="col">Change</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function buildPage(entries: RankingEntry[]): string {
  const lastUpdated = formatCentralTimeTimestamp(data.lastUpdated);
  const freshness = data.dataFreshness ?? '';
  const status = data.dataStatus ?? '';

  const head = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>College Football Playoff Rankings &amp; Predictions &mdash; Blaze Sports Intel</title>
        <meta name="description" content="CFP Top 25 rankings with Monte Carlo playoff predictions, strength of schedule analysis, and 12-team playoff projections." />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet" />
        <style>
          :root {
            color-scheme: light dark;
            --bg: #05080f;
            --card-bg: rgba(255, 255, 255, 0.04);
            --text: #f7f9fc;
            --muted: rgba(247, 249, 252, 0.65);
            --accent: #ff7a18;
            --accent-soft: rgba(255, 122, 24, 0.12);
            --border: rgba(255, 255, 255, 0.08);
            --playoff-green: #3fcf8e;
            --playoff-green-soft: rgba(63, 207, 142, 0.15);
            --champion-gold: #ffd700;
            --bye-blue: #4a9eff;
          }

          * {
            box-sizing: border-box;
          }

          body {
            margin: 0;
            font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: radial-gradient(circle at top left, rgba(255, 122, 24, 0.18), transparent 50%), var(--bg);
            color: var(--text);
            min-height: 100vh;
            display: flex;
            justify-content: center;
          }

          main {
            width: min(1200px, 100%);
            padding: clamp(1.5rem, 2vw + 1rem, 3rem) clamp(1rem, 4vw, 2.75rem) 4rem;
          }

          header.hero {
            display: grid;
            gap: 1rem;
            margin-bottom: clamp(1.5rem, 4vw, 2.5rem);
          }

          header.hero .eyebrow {
            text-transform: uppercase;
            letter-spacing: 0.3rem;
            color: var(--muted);
            font-size: 0.75rem;
            font-weight: 600;
          }

          header.hero h1 {
            font-size: clamp(1.75rem, 2.8vw, 3rem);
            margin: 0;
            font-weight: 800;
            background: linear-gradient(135deg, var(--text), var(--accent));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }

          header.hero p.subtitle {
            margin: 0;
            color: var(--muted);
            font-size: clamp(1rem, 2.5vw, 1.15rem);
            line-height: 1.6;
          }

          .meta {
            display: flex;
            flex-wrap: wrap;
            gap: 1rem;
            margin-top: 0.5rem;
          }

          .meta .pill {
            border-radius: 999px;
            padding: 0.45rem 1rem;
            background: var(--card-bg);
            border: 1px solid var(--border);
            font-size: 0.9rem;
          }

          .meta .pill strong {
            color: var(--text);
          }

          section.metrics {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
            margin-bottom: clamp(1.5rem, 4vw, 2.75rem);
          }

          .metric-card {
            padding: 1.25rem 1.5rem;
            border-radius: 16px;
            background: linear-gradient(145deg, rgba(255, 255, 255, 0.06), rgba(5, 8, 15, 0.65));
            border: 1px solid var(--border);
            display: grid;
            gap: 0.35rem;
          }

          .metric-card.top-five-card {
            grid-column: span 2;
          }

          .metric-label {
            color: var(--muted);
            font-size: 0.8rem;
            letter-spacing: 0.06em;
            text-transform: uppercase;
            font-weight: 600;
          }

          .metric-value {
            font-size: clamp(1.5rem, 2vw, 2rem);
            font-weight: 800;
            color: var(--accent);
          }

          .metric-value-text {
            font-size: clamp(1rem, 1.5vw, 1.25rem);
            font-weight: 700;
          }

          /* Playoff Predictions Section */
          .playoff-predictions {
            margin-bottom: clamp(2rem, 4vw, 3rem);
            padding: clamp(1.5rem, 2vw, 2.5rem);
            background: rgba(5, 8, 15, 0.65);
            border-radius: 20px;
            border: 1px solid var(--border);
          }

          .section-header {
            margin-bottom: 2rem;
          }

          .section-header h2 {
            margin: 0 0 0.5rem 0;
            font-size: clamp(1.5rem, 2.5vw, 2rem);
            font-weight: 800;
          }

          .section-subtitle {
            margin: 0;
            color: var(--muted);
            font-size: 0.95rem;
          }

          .predictions-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 1.25rem;
          }

          .prediction-card {
            background: linear-gradient(145deg, rgba(255, 255, 255, 0.03), rgba(5, 8, 15, 0.8));
            border: 1px solid var(--border);
            border-radius: 12px;
            padding: 1.25rem;
            transition: transform 0.2s, box-shadow 0.2s;
          }

          .prediction-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
          }

          .prediction-card.has-bye {
            border-color: var(--bye-blue);
            background: linear-gradient(145deg, rgba(74, 158, 255, 0.08), rgba(5, 8, 15, 0.8));
          }

          .card-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 0.75rem;
          }

          .team-rank {
            font-size: 0.85rem;
            color: var(--muted);
            font-weight: 700;
          }

          .bye-badge {
            background: var(--bye-blue);
            color: white;
            padding: 0.25rem 0.65rem;
            border-radius: 999px;
            font-size: 0.75rem;
            font-weight: 800;
            letter-spacing: 0.05em;
          }

          .playoff-badge {
            background: var(--playoff-green);
            color: #05080f;
            padding: 0.25rem 0.65rem;
            border-radius: 999px;
            font-size: 0.75rem;
            font-weight: 800;
          }

          .team-name-card {
            margin: 0 0 1rem 0;
            font-size: 1.15rem;
            font-weight: 700;
            line-height: 1.3;
          }

          .prob-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 0.75rem;
          }

          .prob-item {
            display: flex;
            flex-direction: column;
            gap: 0.25rem;
          }

          .prob-label {
            font-size: 0.75rem;
            color: var(--muted);
            text-transform: uppercase;
            letter-spacing: 0.05em;
            font-weight: 600;
          }

          .prob-value {
            font-size: 1.25rem;
            font-weight: 800;
            color: var(--playoff-green);
          }

          .prob-value.champion {
            color: var(--champion-gold);
          }

          /* Rankings Table */
          .table-wrapper {
            background: rgba(5, 8, 15, 0.65);
            border-radius: 20px;
            padding: clamp(1.25rem, 2vw, 2rem);
            border: 1px solid var(--border);
            box-shadow: 0 16px 40px rgba(0, 0, 0, 0.28);
            margin-bottom: 2rem;
          }

          .table-header {
            display: flex;
            flex-direction: column;
            gap: 0.35rem;
            margin-bottom: 1.5rem;
          }

          .table-header h2 {
            margin: 0;
            font-size: clamp(1.25rem, 2.5vw, 1.75rem);
            font-weight: 800;
          }

          .table-header .table-subtitle {
            margin: 0;
            color: var(--muted);
            font-size: 0.95rem;
          }

          .table-container {
            overflow-x: auto;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            min-width: 700px;
          }

          thead th {
            text-align: left;
            font-weight: 700;
            font-size: 0.85rem;
            color: var(--muted);
            padding-bottom: 0.75rem;
            border-bottom: 2px solid var(--border);
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }

          tbody tr {
            border-bottom: 1px solid rgba(255, 255, 255, 0.06);
            transition: background 0.2s;
          }

          tbody tr:hover {
            background: rgba(255, 122, 24, 0.05);
          }

          tbody tr.in-playoff {
            background: var(--playoff-green-soft);
          }

          tbody tr.in-playoff:hover {
            background: rgba(63, 207, 142, 0.25);
          }

          tbody tr:last-of-type {
            border-bottom: none;
          }

          tbody td {
            padding: 1rem 0.5rem;
            font-size: 0.95rem;
            vertical-align: middle;
          }

          td.rank {
            width: 4ch;
            font-weight: 700;
            font-size: 1.1rem;
          }

          td.team .team-info {
            display: flex;
            flex-direction: column;
            gap: 0.3rem;
          }

          td.team .team-name {
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 0.5rem;
          }

          .playoff-indicator {
            background: var(--playoff-green);
            color: #05080f;
            padding: 0.15rem 0.5rem;
            border-radius: 4px;
            font-size: 0.65rem;
            font-weight: 800;
            letter-spacing: 0.05em;
          }

          td.team .conference {
            font-size: 0.8rem;
            color: var(--muted);
            letter-spacing: 0.02em;
          }

          td.record {
            font-weight: 600;
            font-family: 'SF Mono', 'Monaco', monospace;
          }

          td.sos {
            font-weight: 600;
            color: var(--accent);
          }

          .chance-bar-container {
            position: relative;
            width: 100%;
            height: 24px;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 4px;
            overflow: hidden;
          }

          .chance-bar {
            position: absolute;
            left: 0;
            top: 0;
            height: 100%;
            background: linear-gradient(90deg, var(--playoff-green), var(--accent));
            transition: width 0.3s ease;
          }

          .chance-text {
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100%;
            font-size: 0.8rem;
            font-weight: 700;
            color: var(--text);
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
          }

          td.previous {
            width: 6ch;
            font-weight: 600;
          }

          td.movement {
            width: 8ch;
            font-weight: 700;
          }

          td.movement.up {
            color: var(--playoff-green);
          }

          td.movement.down {
            color: #ff6b6b;
          }

          td.movement.steady {
            color: var(--muted);
          }

          td.movement.new {
            color: var(--champion-gold);
          }

          footer.page-footer {
            margin-top: clamp(2rem, 5vw, 3rem);
            color: var(--muted);
            font-size: 0.85rem;
            display: grid;
            gap: 0.5rem;
          }

          footer.page-footer a {
            color: var(--text);
            text-decoration: underline;
            text-decoration-thickness: 2px;
            text-underline-offset: 4px;
          }

          @media (prefers-color-scheme: light) {
            :root {
              --bg: #f1f5ff;
              --card-bg: rgba(255, 255, 255, 0.75);
              --text: #091125;
              --muted: rgba(9, 17, 37, 0.7);
              --accent-soft: rgba(255, 122, 24, 0.1);
              --border: rgba(9, 17, 37, 0.08);
            }

            body {
              background: linear-gradient(180deg, rgba(255, 255, 255, 0.92), rgba(241, 245, 255, 0.95));
            }

            .table-wrapper, .playoff-predictions {
              background: rgba(255, 255, 255, 0.9);
            }

            .prediction-card {
              background: rgba(255, 255, 255, 0.95);
            }

            tbody tr {
              border-bottom: 1px solid rgba(9, 17, 37, 0.08);
            }

            .metric-card {
              background: rgba(255, 255, 255, 0.95);
            }
          }

          @media (max-width: 900px) {
            .metric-card.top-five-card {
              grid-column: span 1;
            }

            .predictions-grid {
              grid-template-columns: 1fr;
            }
          }

          @media (max-width: 600px) {
            header.hero {
              gap: 0.75rem;
            }

            .meta {
              flex-direction: column;
              gap: 0.75rem;
            }

            table {
              min-width: unset;
              font-size: 0.85rem;
            }

            tbody td {
              padding: 0.75rem 0.35rem;
            }

            .table-wrapper, .playoff-predictions {
              padding: 1rem;
            }
          }
        </style>
      </head>
      <body>
        <main>
          <header class="hero">
            <span class="eyebrow">Blaze Sports Intel &bull; College Football Playoff</span>
            <h1>CFP Rankings &amp; Playoff Intelligence</h1>
            <p class="subtitle">Advanced analytics, Monte Carlo simulations, and predictive modeling for the College Football Playoff. Built for analysts and championship contenders.</p>
            <div class="meta">
              <span class="pill"><strong>Last Updated:</strong> ${lastUpdated}</span>
              <span class="pill"><strong>Format:</strong> 12-Team Playoff</span>
              ${freshness ? `<span class="pill"><strong>Status:</strong> ${freshness}</span>` : ''}
            </div>
          </header>
          ${buildSummaryCards(entries)}
          ${buildPlayoffPredictionCards()}
          ${buildRankingsTable(entries)}
          <footer class="page-footer">
            <span>Data Source: <a href="${data.source ?? 'https://collegefootballplayoff.com'}" target="_blank" rel="noopener noreferrer">College Football Playoff Committee</a></span>
            <span>Playoff predictions powered by proprietary Monte Carlo simulation engine (10,000 iterations per scenario). Built for BlazeSportsIntel.com • Edge-rendered via Cloudflare Workers.</span>
          </footer>
        </main>
      </body>
    </html>
  `;

  return head;
}

export default {
  async fetch(request: Request, _env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Health check endpoint
    if (url.pathname === '/health' || url.pathname === '/CFP/health') {
      return new Response(
        JSON.stringify({
          status: 'ok',
          service: 'cfp-worker',
          version: '1.0.0',
          features: ['rankings', 'monte-carlo', 'playoff-predictions'],
          timestamp: new Date().toISOString(),
        }),
        {
          headers: {
            'content-type': 'application/json',
          },
        }
      );
    }

    // API endpoint for raw data
    if (url.pathname === '/api' || url.pathname === '/CFP/api') {
      return new Response(JSON.stringify(data, null, 2), {
        headers: {
          'content-type': 'application/json',
          'cache-control': 'public, max-age=300',
        },
      });
    }

    // Simulations API endpoint
    if (url.pathname === '/api/simulations' || url.pathname === '/CFP/api/simulations') {
      const simulations = runPlayoffSimulation(data.rankings);
      return new Response(JSON.stringify(simulations, null, 2), {
        headers: {
          'content-type': 'application/json',
          'cache-control': 'public, max-age=600',
        },
      });
    }

    // Main page
    if (url.pathname === '/' || url.pathname === '' || url.pathname === '/CFP' || url.pathname === '/CFP/') {
      const html = buildPage(data.rankings);

      return new Response(html, {
        headers: {
          'content-type': 'text/html; charset=utf-8',
          'cache-control': 'public, max-age=300',
        },
      });
    }

    // 404
    return new Response('Not Found', {
      status: 404,
      headers: {
        'content-type': 'text/plain; charset=utf-8',
      },
    });
  },
};
