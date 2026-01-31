/**
 * College Baseball Standings - Real API Integration
 * Fetches conference standings data from NCAA API endpoints and renders dynamically
 *
 * Data Source: /api/college-baseball/standings
 * Caching: 5 minutes
 * Timezone: America/Chicago
 */

const API_BASE = '/api/college-baseball';
let currentConference = 'SEC';
let currentView = 'conference';

/**
 * Initialize the standings page with API data
 */
async function initStandingsPage() {
    console.log('[Standings API] Initializing with real NCAA data...');

    // Initial load - fetch SEC standings
    await fetchAndRenderStandings();

    // Set up conference tab listeners
    setupConferenceTabs();

    // Set up view toggle listeners
    setupViewToggle();

    console.log('[Standings API] Initialization complete');
}

/**
 * Fetch standings from API and render
 */
async function fetchAndRenderStandings() {
    const standingsContainer = document.getElementById('sec-standings');
    if (!standingsContainer) return;

    // Show loading state
    const tableWrapper = standingsContainer.querySelector('.table-wrapper');
    if (tableWrapper) {
        tableWrapper.innerHTML = '<div class="loading-spinner" style="text-align: center; padding: 3rem; color: var(--bsi-cream);">Loading standings...</div>';
    }

    try {
        // Build query parameters
        const params = new URLSearchParams();
        params.set('conference', currentConference);
        params.set('division', 'D1');

        const url = `${API_BASE}/standings?${params.toString()}`;
        console.log('[Standings API] Fetching from:', url);

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`API returned ${response.status}`);
        }

        const result = await response.json();
        console.log('[Standings API] Received:', result);

        if (!result.success) {
            throw new Error(result.error || 'Failed to fetch standings');
        }

        const standings = result.data || [];

        // Update header with conference info
        updateConferenceHeader(result.conference || currentConference, standings);

        // Render standings table
        if (standings.length === 0) {
            tableWrapper.innerHTML = `
                <div class="no-data-message" style="text-align: center; padding: 3rem; color: var(--bsi-cream);">
                    <h3>No Standings Available</h3>
                    <p>Standings for ${currentConference} are not available at this time.</p>
                    <p class="note" style="font-size: 0.9rem; font-style: italic; color: var(--bsi-burnt-orange); margin-top: 1rem;">
                        Note: College baseball is currently in off-season (October). Standings will be available when the 2026 season begins in February.
                    </p>
                </div>
            `;
        } else {
            tableWrapper.innerHTML = renderStandingsTable(standings);
        }

    } catch (error) {
        console.error('[Standings API] Error:', error);
        if (tableWrapper) {
            tableWrapper.innerHTML = `
                <div class="error-message" style="text-align: center; padding: 3rem; color: var(--bsi-cream);">
                    <h3>Unable to Load Standings</h3>
                    <p>${error.message}</p>
                    <button onclick="location.reload()" class="retry-btn" style="
                        background: linear-gradient(135deg, var(--bsi-burnt-orange), var(--bsi-texas-soil));
                        color: white;
                        padding: 0.75rem 2rem;
                        border-radius: 8px;
                        border: none;
                        font-weight: 700;
                        cursor: pointer;
                        margin-top: 1rem;
                        transition: all 0.3s ease;
                    ">Retry</button>
                </div>
            `;
        }
    }
}

/**
 * Update conference header with metadata
 */
function updateConferenceHeader(conference, standings) {
    const header = document.querySelector('.standings-header');
    if (!header) return;

    const conferenceInfo = header.querySelector('.conference-info');
    if (!conferenceInfo) return;

    // Calculate stats from standings data
    const teamCount = standings.length;
    const avgRPI = teamCount > 0
        ? (standings.reduce((sum, team) => sum + parseFloat(team.rpi || 0), 0) / teamCount).toFixed(4)
        : '0.0000';

    // Estimate tournament bids based on RPI (simplified)
    const tournamentBids = standings.filter(team => parseFloat(team.rpi) > 0.5000).length;

    // Get full conference name
    const conferenceNames = {
        'SEC': 'Southeastern Conference (SEC)',
        'ACC': 'Atlantic Coast Conference (ACC)',
        'Big12': 'Big 12 Conference',
        'Pac-12': 'Pacific-12 Conference',
        'Big Ten': 'Big Ten Conference',
        'American': 'American Athletic Conference',
        'C-USA': 'Conference USA',
        'Sun Belt': 'Sun Belt Conference',
        'MAC': 'Mid-American Conference',
        'MWC': 'Mountain West Conference'
    };

    conferenceInfo.innerHTML = `
        <h2 class="conference-name">${conferenceNames[conference] || conference}</h2>
        <div class="conference-meta">
            <div class="meta-item">
                <span>Teams:</span>
                <span class="meta-value">${teamCount}</span>
            </div>
            <div class="meta-item">
                <span>Avg RPI:</span>
                <span class="meta-value">${avgRPI}</span>
            </div>
            <div class="meta-item">
                <span>Tournament Bids:</span>
                <span class="meta-value">${tournamentBids} projected</span>
            </div>
        </div>
    `;
}

/**
 * Render standings table HTML
 */
function renderStandingsTable(standings) {
    return `
        <table class="standings-table">
            <thead>
                <tr>
                    <th scope="col">Rk</th>
                    <th scope="col">Team</th>
                    <th scope="col" title="Overall Wins">W</th>
                    <th scope="col" title="Overall Losses">L</th>
                    <th scope="col" title="Win Percentage">PCT</th>
                    <th scope="col" title="Conference Record">Conf</th>
                    <th scope="col" title="Home Record">Home</th>
                    <th scope="col" title="Away Record">Away</th>
                    <th scope="col" title="Ratings Percentage Index">RPI</th>
                    <th scope="col" title="Strength of Schedule">SOS</th>
                    <th scope="col" title="Current Streak">Strk</th>
                    <th scope="col" title="Last 10 Games">L10</th>
                </tr>
            </thead>
            <tbody>
                ${standings.map((team, index) => renderStandingsRow(team, index + 1)).join('')}
            </tbody>
        </table>
    `;
}

/**
 * Render a single standings row
 */
function renderStandingsRow(team, rank) {
    const overallWins = team.overallRecord?.wins || 0;
    const overallLosses = team.overallRecord?.losses || 0;
    const totalGames = overallWins + overallLosses || 1;
    const winPct = (overallWins / totalGames).toFixed(3);

    const confWins = team.conferenceRecord?.wins || 0;
    const confLosses = team.conferenceRecord?.losses || 0;
    const confRecord = `${confWins}-${confLosses}`;

    const rpi = team.rpi || '—';
    const sos = team.sos || '—';
    const last10 = team.last10 || '—';

    // Determine tournament status
    const rpiValue = parseFloat(rpi);
    let rowClass = '';
    let tournamentIndicator = '';

    if (rpiValue > 0.5500) {
        rowClass = 'tournament-bound';
        tournamentIndicator = '<span class="tournament-indicator lock" title="Tournament Lock"></span>';
    } else if (rpiValue > 0.4800) {
        rowClass = 'bubble-team';
        tournamentIndicator = '<span class="tournament-indicator bubble" title="Bubble Team"></span>';
    }

    // Format streak
    let streakHtml = '—';
    if (team.streakType && team.streakCount) {
        const streakClass = team.streakType === 'W' ? 'win' : 'loss';
        streakHtml = `<span class="streak ${streakClass}">${team.streakType}${team.streakCount}</span>`;
    }

    // Rank badge styling
    const rankBadgeClass = rank <= 5 ? 'rank-badge top-5' : 'rank-badge';

    // Team logo (use placeholder if not available)
    const logoUrl = team.team?.logo || `https://via.placeholder.com/32x32?text=${team.team?.shortName || '?'}`;

    return `
        <tr class="${rowClass}">
            <td><div class="${rankBadgeClass}">${rank}</div></td>
            <td>
                <div class="team-cell">
                    <img src="${logoUrl}" alt="${team.team?.name}" class="team-logo" loading="lazy" onerror="this.src='https://via.placeholder.com/32x32?text=${team.team?.shortName}'">
                    <div class="team-info-column">
                        <span class="team-name">${team.team?.name || 'Unknown Team'} ${tournamentIndicator}</span>
                        <span class="team-mascot">${team.team?.shortName || ''}</span>
                    </div>
                </div>
            </td>
            <td>${overallWins}</td>
            <td>${overallLosses}</td>
            <td class="win-pct">${winPct}</td>
            <td class="conf-record">${confRecord}</td>
            <td>—</td>
            <td>—</td>
            <td class="rpi-badge">${rpi}</td>
            <td>${sos}</td>
            <td>${streakHtml}</td>
            <td>${last10}</td>
        </tr>
    `;
}

/**
 * Setup conference tab event listeners
 */
function setupConferenceTabs() {
    document.querySelectorAll('.conference-tab').forEach(tab => {
        tab.addEventListener('click', async function() {
            // Update active state
            document.querySelectorAll('.conference-tab').forEach(t => t.classList.remove('active'));
            this.classList.add('active');

            // Update current conference and fetch data
            const conference = this.dataset.conference;
            currentConference = conference.toUpperCase();

            console.log('[Standings API] Conference changed to:', currentConference);

            await fetchAndRenderStandings();
        });
    });
}

/**
 * Setup view toggle event listeners
 */
function setupViewToggle() {
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            const view = this.dataset.view;
            currentView = view;

            console.log('[Standings API] View changed to:', view);

            // In production, this would adjust the API query or display format
            // For now, we'll just log it
        });
    });
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initStandingsPage);
} else {
    initStandingsPage();
}
