/**
 * College Baseball Games - Real API Integration
 * Fetches live game data from NCAA API endpoints and renders dynamically
 *
 * Data Source: /api/college-baseball/games
 * Caching: 30s live games, 5m scheduled games
 * Timezone: America/Chicago
 */

const API_BASE = '/api/college-baseball';
const REFRESH_INTERVAL = 30000; // 30 seconds for live games
let currentFilters = {
    conference: 'all',
    status: 'all',
    date: 'today'
};
let refreshTimer = null;

/**
 * Initialize the games page with API data
 */
async function initGamesPage() {
    console.log('[Games API] Initializing with real NCAA data...');

    // Initial load
    await fetchAndRenderGames();

    // Set up filters
    setupFilters();

    // Auto-refresh for live games
    startAutoRefresh();

    console.log('[Games API] Initialization complete');
}

/**
 * Fetch games from API with current filters
 */
async function fetchAndRenderGames() {
    const gamesContainer = document.querySelector('.games-grid');
    if (!gamesContainer) return;

    // Show loading state
    gamesContainer.innerHTML = '<div class="loading-spinner">Loading games...</div>';

    try {
        // Build query parameters
        const params = new URLSearchParams();
        if (currentFilters.date !== 'today') {
            const date = getDateFromFilter(currentFilters.date);
            params.set('date', date);
        }
        if (currentFilters.conference !== 'all') {
            params.set('conference', currentFilters.conference.toUpperCase());
        }
        if (currentFilters.status !== 'all') {
            params.set('status', currentFilters.status);
        }

        const url = `${API_BASE}/games?${params.toString()}`;
        console.log('[Games API] Fetching from:', url);

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`API returned ${response.status}`);
        }

        const result = await response.json();
        console.log('[Games API] Received:', result);

        if (!result.success) {
            throw new Error(result.error || 'Failed to fetch games');
        }

        const games = result.data || [];

        // Update live indicator
        updateLiveIndicator(games);

        // Render games
        if (games.length === 0) {
            gamesContainer.innerHTML = `
                <div class="no-games-message">
                    <h3>No Games Found</h3>
                    <p>No college baseball games match your current filters. Try adjusting your search criteria.</p>
                    <p class="note">Note: It's currently college baseball off-season (October). Games will be available when the 2026 season begins in February.</p>
                </div>
            `;
        } else {
            gamesContainer.innerHTML = games.map((game, index) => renderGameCard(game, index)).join('');
            attachGameCardListeners();
        }

    } catch (error) {
        console.error('[Games API] Error:', error);
        gamesContainer.innerHTML = `
            <div class="error-message">
                <h3>Unable to Load Games</h3>
                <p>${error.message}</p>
                <button onclick="location.reload()" class="retry-btn">Retry</button>
            </div>
        `;
    }
}

/**
 * Render a single game card
 */
function renderGameCard(game, index) {
    const statusBadge = getStatusBadge(game.status);
    const statusClass = `status-${game.status}`;
    const delay = (index + 1) * 100; // Stagger animations

    // Determine if there's a winner
    const awayWinner = game.awayTeam.score > game.homeTeam.score ? 'winner' : '';
    const homeWinner = game.homeTeam.score > game.awayTeam.score ? 'winner' : '';

    return `
        <article class="game-card" data-aos="fade-up" data-aos-delay="${delay}" data-game-id="${game.id}">
            <div class="game-card-header">
                <div class="game-status-badge">
                    <span class="status-badge ${statusClass}">${statusBadge}</span>
                    ${game.situation ? `<span>${game.situation}</span>` : ''}
                </div>
                <div class="game-meta">
                    ${game.tv ? `<span>📺 ${game.tv}</span>` : ''}
                    <span>${game.venue || 'TBD'}</span>
                </div>
            </div>
            <div class="game-matchup">
                ${renderTeamRow(game.awayTeam, awayWinner, game.status)}
                ${renderTeamRow(game.homeTeam, homeWinner, game.status)}
            </div>
            <div class="game-card-footer">
                <div class="game-meta">
                    <span>${game.time}</span>
                    ${game.status === 'live' ? `<span>Last Update: ${new Date().toLocaleTimeString('en-US', { timeZone: 'America/Chicago', hour: 'numeric', minute: '2-digit' })}</span>` : ''}
                </div>
                ${game.status !== 'scheduled' ? `
                    <button class="box-score-btn" data-game-id="${game.id}">Full Box Score →</button>
                ` : `
                    <button class="box-score-btn" disabled style="opacity: 0.5; cursor: not-allowed;">Preview Available</button>
                `}
            </div>
        </article>
    `;
}

/**
 * Render a team row within a game card
 */
function renderTeamRow(team, winnerClass = '', gameStatus) {
    const logo = team.logo || `https://a.espncdn.com/i/teamlogos/ncaa/500/default-team-logo-500.png`;
    const score = team.score !== null ? team.score : '—';
    const record = team.record ? `${team.record.wins}-${team.record.losses}` : '';

    return `
        <div class="team-row">
            <div class="team-info">
                <img src="${logo}" alt="${team.name}" class="team-logo" loading="lazy" onerror="this.src='https://via.placeholder.com/40x40?text=${team.shortName}'">
                <div class="team-details">
                    <div class="team-name">${team.name}</div>
                    ${record ? `<div class="team-record">${record} ${team.conference ? `(${team.conference})` : ''}</div>` : ''}
                </div>
            </div>
            <div class="team-hits-errors">—</div>
            <div class="team-score ${winnerClass}">${score}</div>
        </div>
    `;
}

/**
 * Get status badge text
 */
function getStatusBadge(status) {
    const badges = {
        'live': 'LIVE',
        'final': 'FINAL',
        'scheduled': 'Scheduled',
        'postponed': 'Postponed',
        'canceled': 'Canceled'
    };
    return badges[status] || status.toUpperCase();
}

/**
 * Update live indicator
 */
function updateLiveIndicator(games) {
    const liveIndicator = document.querySelector('.live-indicator');
    if (!liveIndicator) return;

    const liveGames = games.filter(g => g.status === 'live');

    if (liveGames.length > 0) {
        liveIndicator.textContent = `${liveGames.length} Game${liveGames.length !== 1 ? 's' : ''} Live Now`;
        liveIndicator.style.display = 'inline-flex';
    } else {
        liveIndicator.style.display = 'none';
    }
}

/**
 * Setup filter event listeners
 */
function setupFilters() {
    // Conference filter
    document.getElementById('conference-filter')?.addEventListener('change', function() {
        currentFilters.conference = this.value;
        console.log('[Games API] Filter changed:', currentFilters);
        fetchAndRenderGames();
    });

    // Status filter
    document.getElementById('status-filter')?.addEventListener('change', function() {
        currentFilters.status = this.value;
        console.log('[Games API] Filter changed:', currentFilters);
        fetchAndRenderGames();
    });

    // Date filter
    document.getElementById('date-filter')?.addEventListener('change', function() {
        currentFilters.date = this.value;
        console.log('[Games API] Filter changed:', currentFilters);
        fetchAndRenderGames();
    });
}

/**
 * Attach event listeners to game cards
 */
function attachGameCardListeners() {
    document.querySelectorAll('.box-score-btn').forEach(btn => {
        if (btn.disabled) return;

        btn.addEventListener('click', async function() {
            const gameId = this.dataset.gameId;
            if (!gameId) return;

            console.log('[Games API] Loading box score for game:', gameId);

            try {
                const response = await fetch(`${API_BASE}/boxscore?gameId=${gameId}`);
                const result = await response.json();

                if (result.success && result.data) {
                    // Box score rendering will be implemented in Phase 2
                    alert('Box Score Feature: Coming soon!\n\nWe\'re implementing detailed box scores with batting/pitching stats, play-by-play, and everything ESPN won\'t show you for college baseball.');
                } else {
                    alert('Box score data temporarily unavailable. Please try again later.');
                }
            } catch (error) {
                console.error('[Games API] Box score error:', error);
                alert('Unable to load box score. Please try again later.');
            }
        });
    });
}

/**
 * Start auto-refresh for live games
 */
function startAutoRefresh() {
    if (refreshTimer) clearInterval(refreshTimer);

    refreshTimer = setInterval(async () => {
        // Only auto-refresh if there are live games
        const gamesContainer = document.querySelector('.games-grid');
        if (!gamesContainer) return;

        const hasLiveGames = gamesContainer.querySelector('.status-live');
        if (hasLiveGames) {
            console.log('[Games API] Auto-refreshing live games...');
            await fetchAndRenderGames();
        }
    }, REFRESH_INTERVAL);
}

/**
 * Get date string from filter value
 */
function getDateFromFilter(filter) {
    const today = new Date();
    const chicagoDate = new Date(today.toLocaleString('en-US', { timeZone: 'America/Chicago' }));

    switch (filter) {
        case 'yesterday':
            chicagoDate.setDate(chicagoDate.getDate() - 1);
            break;
        case 'week':
            // Return today's date (API will handle week filtering if implemented)
            break;
        default:
            // today
            break;
    }

    return chicagoDate.toISOString().split('T')[0]; // YYYY-MM-DD
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGamesPage);
} else {
    initGamesPage();
}

// Add CSS for loading/error states
const style = document.createElement('style');
style.textContent = `
    .loading-spinner {
        text-align: center;
        padding: 4rem 2rem;
        font-size: 1.25rem;
        color: var(--blaze-platinum);
        animation: pulse 2s infinite;
    }

    .no-games-message,
    .error-message {
        background: var(--glass-white);
        border: 1px solid var(--glass-border);
        border-radius: 16px;
        padding: 3rem 2rem;
        text-align: center;
        backdrop-filter: blur(10px);
    }

    .no-games-message h3,
    .error-message h3 {
        font-size: 1.5rem;
        font-weight: 900;
        margin-bottom: 1rem;
        color: var(--blaze-orange);
    }

    .no-games-message p,
    .error-message p {
        color: var(--blaze-platinum);
        margin-bottom: 0.75rem;
    }

    .no-games-message .note {
        font-size: 0.9rem;
        font-style: italic;
        color: var(--blaze-sky);
        margin-top: 1rem;
    }

    .retry-btn {
        background: linear-gradient(135deg, var(--blaze-orange), var(--blaze-orange-dark));
        color: white;
        padding: 0.75rem 2rem;
        border-radius: 8px;
        border: none;
        font-weight: 700;
        cursor: pointer;
        margin-top: 1rem;
        transition: all 0.3s ease;
    }

    .retry-btn:hover {
        transform: translateY(-2px);
        box-shadow: var(--shadow-lg);
    }
`;
document.head.appendChild(style);
