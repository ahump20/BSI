/**
 * MLB Statcast Analytics Component - PHASE 19-C
 * Advanced baseball analytics visualization using Statcast data
 *
 * Features:
 * - Player Statcast summary cards (exit velocity, launch angle, barrel rate)
 * - Leaderboard tables for various metrics
 * - Interactive scatter plots (exit velocity vs launch angle)
 * - Barrel zone visualization
 * - Integration with /api/mlb/statcast/* endpoints
 */

(function() {
    'use strict';

    const StatcastAnalytics = {
        // API endpoints
        API_BASE: '/api/mlb/statcast',

        // UI state
        currentView: 'player', // 'player', 'leaderboard', 'events'
        currentPlayer: null,
        currentSeason: new Date().getFullYear(),

        /**
         * Initialize the Statcast analytics component
         */
        init() {
            console.log('[Statcast Analytics] Initializing...');
            this.createUI();
            this.attachEventListeners();

            // Load default data (Cardinals players)
            this.loadCardinalsPlayers();
        },

        /**
         * Create the UI structure
         */
        createUI() {
            const container = document.createElement('div');
            container.id = 'statcast-analytics';
            container.className = 'statcast-container';
            container.innerHTML = `
                <div class="statcast-header">
                    <h2>
                        <i class="fas fa-baseball-ball"></i>
                        MLB Statcast Analytics
                    </h2>
                    <div class="statcast-tabs">
                        <button class="statcast-tab active" data-view="player">
                            Player Analysis
                        </button>
                        <button class="statcast-tab" data-view="leaderboard">
                            Leaderboards
                        </button>
                        <button class="statcast-tab" data-view="events">
                            Batted Ball Events
                        </button>
                    </div>
                </div>

                <div class="statcast-content">
                    <!-- Player Search -->
                    <div class="player-search" id="player-search">
                        <input
                            type="text"
                            id="player-search-input"
                            placeholder="Search MLB player by ID (e.g., 502671 for Paul Goldschmidt)..."
                            class="search-input"
                        />
                        <button id="search-btn" class="search-btn">
                            <i class="fas fa-search"></i> Search
                        </button>
                        <select id="season-select" class="season-select">
                            <option value="2024">2024 Season</option>
                            <option value="2023">2023 Season</option>
                            <option value="2022">2022 Season</option>
                        </select>
                    </div>

                    <!-- Quick Access: Cardinals Players -->
                    <div class="quick-access" id="quick-access">
                        <h3>Quick Access - Cardinals Players</h3>
                        <div class="quick-access-grid" id="cardinals-grid">
                            <button class="quick-player-btn" data-player-id="502671" data-name="Paul Goldschmidt">
                                Goldschmidt
                            </button>
                            <button class="quick-player-btn" data-player-id="660271" data-name="Nolan Arenado">
                                Arenado
                            </button>
                            <button class="quick-player-btn" data-player-id="666624" data-name="Nolan Gorman">
                                Gorman
                            </button>
                            <button class="quick-player-btn" data-player-id="669127" data-name="Jordan Walker">
                                Walker
                            </button>
                        </div>
                    </div>

                    <!-- Loading State -->
                    <div class="statcast-loading" id="statcast-loading" style="display: none;">
                        <i class="fas fa-spinner fa-spin"></i>
                        Loading Statcast data...
                    </div>

                    <!-- Error State -->
                    <div class="statcast-error" id="statcast-error" style="display: none;">
                        <i class="fas fa-exclamation-triangle"></i>
                        <span id="error-message"></span>
                    </div>

                    <!-- Player View -->
                    <div class="statcast-view" id="player-view">
                        <div id="player-card-container"></div>
                        <div id="player-charts-container"></div>
                    </div>

                    <!-- Leaderboard View -->
                    <div class="statcast-view" id="leaderboard-view" style="display: none;">
                        <div class="leaderboard-selector">
                            <label for="metric-select">Select Metric:</label>
                            <select id="metric-select" class="metric-select">
                                <option value="xBA">Expected Batting Average (xBA)</option>
                                <option value="xSLG">Expected Slugging (xSLG)</option>
                                <option value="xWOBA">Expected wOBA (xWOBA)</option>
                                <option value="barrelRate">Barrel Rate</option>
                                <option value="avgExitVelocity">Avg Exit Velocity</option>
                                <option value="maxExitVelocity">Max Exit Velocity</option>
                                <option value="hardHitPercent">Hard Hit %</option>
                                <option value="sweetSpotPercent">Sweet Spot %</option>
                            </select>
                            <button id="load-leaderboard-btn" class="load-btn">
                                <i class="fas fa-list"></i> Load Leaderboard
                            </button>
                        </div>
                        <div id="leaderboard-table-container"></div>
                    </div>

                    <!-- Events View -->
                    <div class="statcast-view" id="events-view" style="display: none;">
                        <div class="events-filter">
                            <p>Batted ball events require a player ID. Search for a player first.</p>
                        </div>
                        <div id="events-container"></div>
                    </div>
                </div>

                <!-- Data Source Attribution -->
                <div class="statcast-footer">
                    <i class="fas fa-database"></i>
                    Data Source: MLB Stats API + Baseball Savant (Statcast)
                    <span class="phase-badge">PHASE 19</span>
                </div>
            `;

            // Insert into page (look for analytics dashboard or body)
            const analyticsContainer = document.querySelector('#analytics-dashboard') ||
                                      document.querySelector('.analytics-section') ||
                                      document.querySelector('#root');

            if (analyticsContainer) {
                analyticsContainer.appendChild(container);
            } else {
                document.body.appendChild(container);
            }

            this.applyStyles();
        },

        /**
         * Attach event listeners
         */
        attachEventListeners() {
            // Tab switching
            document.querySelectorAll('.statcast-tab').forEach(tab => {
                tab.addEventListener('click', (e) => {
                    this.switchView(e.target.dataset.view);
                });
            });

            // Player search
            const searchBtn = document.getElementById('search-btn');
            const searchInput = document.getElementById('player-search-input');

            if (searchBtn) {
                searchBtn.addEventListener('click', () => {
                    const playerId = searchInput.value.trim();
                    if (playerId) {
                        this.loadPlayerData(playerId);
                    }
                });
            }

            if (searchInput) {
                searchInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        const playerId = searchInput.value.trim();
                        if (playerId) {
                            this.loadPlayerData(playerId);
                        }
                    }
                });
            }

            // Season selection
            const seasonSelect = document.getElementById('season-select');
            if (seasonSelect) {
                seasonSelect.addEventListener('change', (e) => {
                    this.currentSeason = e.target.value;
                    if (this.currentPlayer) {
                        this.loadPlayerData(this.currentPlayer.playerId);
                    }
                });
            }

            // Quick access Cardinals players
            document.querySelectorAll('.quick-player-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const playerId = btn.dataset.playerId;
                    this.loadPlayerData(playerId);
                });
            });

            // Leaderboard loading
            const loadLeaderboardBtn = document.getElementById('load-leaderboard-btn');
            if (loadLeaderboardBtn) {
                loadLeaderboardBtn.addEventListener('click', () => {
                    const metric = document.getElementById('metric-select').value;
                    this.loadLeaderboard(metric);
                });
            }
        },

        /**
         * Switch between views (player/leaderboard/events)
         */
        switchView(view) {
            this.currentView = view;

            // Update active tab
            document.querySelectorAll('.statcast-tab').forEach(tab => {
                tab.classList.toggle('active', tab.dataset.view === view);
            });

            // Show/hide views
            document.querySelectorAll('.statcast-view').forEach(viewEl => {
                viewEl.style.display = 'none';
            });

            const activeView = document.getElementById(`${view}-view`);
            if (activeView) {
                activeView.style.display = 'block';
            }

            // Show/hide player search
            const playerSearch = document.getElementById('player-search');
            const quickAccess = document.getElementById('quick-access');
            if (playerSearch && quickAccess) {
                playerSearch.style.display = (view === 'player' || view === 'events') ? 'block' : 'none';
                quickAccess.style.display = view === 'player' ? 'block' : 'none';
            }
        },

        /**
         * Load Cardinals players list
         */
        async loadCardinalsPlayers() {
            // Cardinals player IDs from 2024 roster
            const cardinalsPlayers = [
                { id: 502671, name: 'Paul Goldschmidt' },
                { id: 660271, name: 'Nolan Arenado' },
                { id: 666624, name: 'Nolan Gorman' },
                { id: 669127, name: 'Jordan Walker' }
            ];

            // Quick access already has these in the UI
            console.log('[Statcast] Cardinals players available:', cardinalsPlayers.length);
        },

        /**
         * Load player Statcast data
         */
        async loadPlayerData(playerId) {
            this.showLoading(true);
            this.hideError();

            try {
                const response = await fetch(
                    `${this.API_BASE}/player/${playerId}?season=${this.currentSeason}`
                );

                if (!response.ok) {
                    throw new Error(`API returned ${response.status}`);
                }

                const data = await response.json();

                if (!data.success) {
                    throw new Error(data.error || 'Failed to load player data');
                }

                this.currentPlayer = data.data;
                this.displayPlayerCard(data.data);
                this.displayPlayerCharts(data.data);
                this.showLoading(false);
            } catch (error) {
                console.error('[Statcast] Error loading player data:', error);
                this.showError(`Failed to load player data: ${error.message}`);
                this.showLoading(false);
            }
        },

        /**
         * Display player Statcast card
         */
        displayPlayerCard(player) {
            const container = document.getElementById('player-card-container');
            if (!container) return;

            const batting = player.batting;
            const hasStatcast = batting.avgExitVelocity > 0;

            container.innerHTML = `
                <div class="player-card">
                    <div class="player-header">
                        <h3>${player.playerName}</h3>
                        <span class="team-badge">${player.team}</span>
                        <span class="position-badge">${player.position}</span>
                        <span class="season-badge">${player.season}</span>
                    </div>

                    <div class="stats-grid">
                        <!-- Basic Stats -->
                        <div class="stat-group">
                            <h4>Basic Stats</h4>
                            <div class="stat-item">
                                <span class="stat-label">At Bats</span>
                                <span class="stat-value">${batting.atBats}</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Hits</span>
                                <span class="stat-value">${batting.hits}</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Home Runs</span>
                                <span class="stat-value">${batting.homeRuns}</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Batting Average</span>
                                <span class="stat-value">${batting.battingAverage.toFixed(3)}</span>
                            </div>
                        </div>

                        <!-- Statcast Exit Velocity -->
                        <div class="stat-group">
                            <h4>Exit Velocity</h4>
                            ${hasStatcast ? `
                                <div class="stat-item">
                                    <span class="stat-label">Avg Exit Velocity</span>
                                    <span class="stat-value highlight">${batting.avgExitVelocity} mph</span>
                                </div>
                                <div class="stat-item">
                                    <span class="stat-label">Max Exit Velocity</span>
                                    <span class="stat-value highlight">${batting.maxExitVelocity} mph</span>
                                </div>
                            ` : `
                                <div class="stat-pending">
                                    <i class="fas fa-clock"></i>
                                    Baseball Savant integration pending
                                </div>
                            `}
                        </div>

                        <!-- Statcast Barrel/Sweet Spot -->
                        <div class="stat-group">
                            <h4>Quality of Contact</h4>
                            ${hasStatcast ? `
                                <div class="stat-item">
                                    <span class="stat-label">Barrel Rate</span>
                                    <span class="stat-value highlight">${batting.barrelRate.toFixed(1)}%</span>
                                </div>
                                <div class="stat-item">
                                    <span class="stat-label">Hard Hit %</span>
                                    <span class="stat-value">${batting.hardHitPercent.toFixed(1)}%</span>
                                </div>
                                <div class="stat-item">
                                    <span class="stat-label">Sweet Spot %</span>
                                    <span class="stat-value">${batting.sweetSpotPercent.toFixed(1)}%</span>
                                </div>
                            ` : `
                                <div class="stat-pending">
                                    <i class="fas fa-clock"></i>
                                    Coming Soon
                                </div>
                            `}
                        </div>

                        <!-- Expected Stats -->
                        <div class="stat-group">
                            <h4>Expected Outcomes</h4>
                            ${hasStatcast ? `
                                <div class="stat-item">
                                    <span class="stat-label">xBA</span>
                                    <span class="stat-value">${batting.xBA.toFixed(3)}</span>
                                </div>
                                <div class="stat-item">
                                    <span class="stat-label">xSLG</span>
                                    <span class="stat-value">${batting.xSLG.toFixed(3)}</span>
                                </div>
                                <div class="stat-item">
                                    <span class="stat-label">xWOBA</span>
                                    <span class="stat-value">${batting.xWOBA.toFixed(3)}</span>
                                </div>
                            ` : `
                                <div class="stat-pending">
                                    <i class="fas fa-clock"></i>
                                    Coming Soon
                                </div>
                            `}
                        </div>
                    </div>

                    <div class="data-info">
                        <i class="fas fa-info-circle"></i>
                        <strong>Data Source:</strong> ${player.dataSource}
                        <br>
                        <strong>Last Updated:</strong> ${new Date(player.lastUpdated).toLocaleString('en-US', { timeZone: 'America/Chicago' })} CT
                    </div>
                </div>
            `;
        },

        /**
         * Display player charts (exit velocity distribution, launch angle, etc.)
         */
        displayPlayerCharts(player) {
            const container = document.getElementById('player-charts-container');
            if (!container) return;

            const batting = player.batting;
            const hasStatcast = batting.avgExitVelocity > 0;

            if (!hasStatcast) {
                container.innerHTML = `
                    <div class="charts-pending">
                        <i class="fas fa-chart-line"></i>
                        <h3>Advanced Visualizations Coming Soon</h3>
                        <p>Exit velocity distribution, launch angle scatter plots, and barrel zone heatmaps will be available once Baseball Savant integration is complete.</p>
                    </div>
                `;
                return;
            }

            // Create chart containers
            container.innerHTML = `
                <div class="charts-grid">
                    <div class="chart-container">
                        <h4>Exit Velocity Comparison</h4>
                        <canvas id="exit-velocity-chart"></canvas>
                    </div>
                    <div class="chart-container">
                        <h4>Barrel Zone Visualization</h4>
                        <canvas id="barrel-zone-chart"></canvas>
                    </div>
                </div>
            `;

            // Create charts with Chart.js
            this.createExitVelocityChart(player);
            this.createBarrelZoneChart(player);
        },

        /**
         * Create exit velocity comparison chart
         */
        createExitVelocityChart(player) {
            const canvas = document.getElementById('exit-velocity-chart');
            if (!canvas) return;

            const ctx = canvas.getContext('2d');
            const batting = player.batting;

            new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: ['Player Avg', 'MLB Avg', 'Hard Hit (95+)', 'Elite (110+)'],
                    datasets: [{
                        label: 'Exit Velocity (mph)',
                        data: [
                            batting.avgExitVelocity || 0,
                            87.5, // MLB average
                            95,   // Hard hit threshold
                            110   // Elite threshold
                        ],
                        backgroundColor: [
                            'rgba(191, 87, 0, 0.8)',   // Player (orange)
                            'rgba(75, 192, 192, 0.8)', // MLB avg (teal)
                            'rgba(255, 206, 86, 0.8)', // Hard hit (yellow)
                            'rgba(255, 99, 132, 0.8)'  // Elite (red)
                        ],
                        borderColor: [
                            'rgba(191, 87, 0, 1)',
                            'rgba(75, 192, 192, 1)',
                            'rgba(255, 206, 86, 1)',
                            'rgba(255, 99, 132, 1)'
                        ],
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                        legend: {
                            display: false
                        },
                        title: {
                            display: true,
                            text: `${player.playerName} - Exit Velocity vs MLB Standards`,
                            color: 'rgba(255, 255, 255, 0.9)',
                            font: {
                                size: 14
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: false,
                            min: 75,
                            max: 115,
                            ticks: {
                                color: 'rgba(255, 255, 255, 0.7)'
                            },
                            grid: {
                                color: 'rgba(255, 255, 255, 0.1)'
                            }
                        },
                        x: {
                            ticks: {
                                color: 'rgba(255, 255, 255, 0.7)'
                            },
                            grid: {
                                color: 'rgba(255, 255, 255, 0.1)'
                            }
                        }
                    }
                }
            });
        },

        /**
         * Create barrel zone visualization (launch angle vs exit velocity)
         */
        createBarrelZoneChart(player) {
            const canvas = document.getElementById('barrel-zone-chart');
            if (!canvas) return;

            const ctx = canvas.getContext('2d');
            const batting = player.batting;

            // Barrel zone: 98+ mph exit velocity, 26-30 degree launch angle
            new Chart(ctx, {
                type: 'scatter',
                data: {
                    datasets: [
                        {
                            label: 'Barrel Zone',
                            data: [
                                { x: 26, y: 98 },
                                { x: 30, y: 98 },
                                { x: 30, y: 115 },
                                { x: 26, y: 115 }
                            ],
                            backgroundColor: 'rgba(255, 99, 132, 0.2)',
                            borderColor: 'rgba(255, 99, 132, 1)',
                            borderWidth: 2,
                            showLine: true,
                            fill: true,
                            pointRadius: 0
                        },
                        {
                            label: 'Player Average',
                            data: [{
                                x: batting.avgLaunchAngle || 15,
                                y: batting.avgExitVelocity || 87
                            }],
                            backgroundColor: 'rgba(191, 87, 0, 1)',
                            borderColor: 'rgba(191, 87, 0, 1)',
                            pointRadius: 10,
                            pointHoverRadius: 12
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                        legend: {
                            display: true,
                            labels: {
                                color: 'rgba(255, 255, 255, 0.9)'
                            }
                        },
                        title: {
                            display: true,
                            text: 'Barrel Zone (26-30° Launch Angle, 98+ mph)',
                            color: 'rgba(255, 255, 255, 0.9)',
                            font: {
                                size: 14
                            }
                        }
                    },
                    scales: {
                        x: {
                            type: 'linear',
                            position: 'bottom',
                            title: {
                                display: true,
                                text: 'Launch Angle (degrees)',
                                color: 'rgba(255, 255, 255, 0.9)'
                            },
                            min: -10,
                            max: 60,
                            ticks: {
                                color: 'rgba(255, 255, 255, 0.7)'
                            },
                            grid: {
                                color: 'rgba(255, 255, 255, 0.1)'
                            }
                        },
                        y: {
                            title: {
                                display: true,
                                text: 'Exit Velocity (mph)',
                                color: 'rgba(255, 255, 255, 0.9)'
                            },
                            min: 75,
                            max: 120,
                            ticks: {
                                color: 'rgba(255, 255, 255, 0.7)'
                            },
                            grid: {
                                color: 'rgba(255, 255, 255, 0.1)'
                            }
                        }
                    }
                }
            });
        },

        /**
         * Load Statcast leaderboard
         */
        async loadLeaderboard(metric) {
            this.showLoading(true);
            this.hideError();

            try {
                const response = await fetch(
                    `${this.API_BASE}/leaderboard/${metric}?season=${this.currentSeason}&limit=25`
                );

                if (!response.ok) {
                    throw new Error(`API returned ${response.status}`);
                }

                const data = await response.json();

                if (!data.success) {
                    throw new Error(data.error || 'Failed to load leaderboard');
                }

                this.displayLeaderboard(data.data, metric);
                this.showLoading(false);
            } catch (error) {
                console.error('[Statcast] Error loading leaderboard:', error);
                this.showError(`Failed to load leaderboard: ${error.message}`);
                this.showLoading(false);
            }
        },

        /**
         * Display leaderboard table
         */
        displayLeaderboard(leaders, metric) {
            const container = document.getElementById('leaderboard-table-container');
            if (!container) return;

            if (!leaders || leaders.length === 0) {
                container.innerHTML = `
                    <div class="leaderboard-empty">
                        <i class="fas fa-database"></i>
                        <h3>Leaderboard Data Pending</h3>
                        <p>Baseball Savant leaderboard integration is in progress. Leaderboards will be available once the full Statcast data pipeline is complete.</p>
                        <p class="integration-note">
                            <i class="fas fa-info-circle"></i>
                            Current data source: MLB Stats API (basic stats only). Statcast metrics require Baseball Savant scraping integration.
                        </p>
                    </div>
                `;
                return;
            }

            // Display leaderboard table (when data is available)
            let tableHTML = `
                <table class="leaderboard-table">
                    <thead>
                        <tr>
                            <th>Rank</th>
                            <th>Player</th>
                            <th>Team</th>
                            <th>Position</th>
                            <th>${this.getMetricDisplayName(metric)}</th>
                        </tr>
                    </thead>
                    <tbody>
            `;

            leaders.forEach(leader => {
                tableHTML += `
                    <tr>
                        <td>${leader.rank}</td>
                        <td class="player-name">${leader.playerName}</td>
                        <td>${leader.team}</td>
                        <td>${leader.position || 'N/A'}</td>
                        <td class="metric-value">${this.formatMetricValue(leader.value, metric)}</td>
                    </tr>
                `;
            });

            tableHTML += `
                    </tbody>
                </table>
            `;

            container.innerHTML = tableHTML;
        },

        /**
         * Get display name for metric
         */
        getMetricDisplayName(metric) {
            const displayNames = {
                xBA: 'Expected BA',
                xSLG: 'Expected SLG',
                xWOBA: 'Expected wOBA',
                barrelRate: 'Barrel Rate',
                avgExitVelocity: 'Avg Exit Velo',
                maxExitVelocity: 'Max Exit Velo',
                hardHitPercent: 'Hard Hit %',
                sweetSpotPercent: 'Sweet Spot %'
            };
            return displayNames[metric] || metric;
        },

        /**
         * Format metric value based on type
         */
        formatMetricValue(value, metric) {
            if (metric.includes('Percent') || metric.includes('Rate')) {
                return `${value.toFixed(1)}%`;
            } else if (metric.includes('Velocity')) {
                return `${value.toFixed(1)} mph`;
            } else {
                return value.toFixed(3);
            }
        },

        /**
         * Show/hide loading state
         */
        showLoading(show) {
            const loader = document.getElementById('statcast-loading');
            if (loader) {
                loader.style.display = show ? 'block' : 'none';
            }
        },

        /**
         * Show error message
         */
        showError(message) {
            const errorEl = document.getElementById('statcast-error');
            const errorMsg = document.getElementById('error-message');

            if (errorEl && errorMsg) {
                errorMsg.textContent = message;
                errorEl.style.display = 'block';
            }
        },

        /**
         * Hide error message
         */
        hideError() {
            const errorEl = document.getElementById('statcast-error');
            if (errorEl) {
                errorEl.style.display = 'none';
            }
        },

        /**
         * Apply component styles
         */
        applyStyles() {
            const style = document.createElement('style');
            style.textContent = `
                /* Statcast Analytics Container */
                .statcast-container {
                    background: rgba(26, 26, 26, 0.95);
                    border: 1px solid rgba(191, 87, 0, 0.3);
                    border-radius: 12px;
                    padding: 2rem;
                    margin: 2rem 0;
                    box-shadow: 0 8px 32px rgba(191, 87, 0, 0.2);
                }

                .statcast-header {
                    margin-bottom: 2rem;
                }

                .statcast-header h2 {
                    color: rgba(255, 255, 255, 0.95);
                    font-size: 1.75rem;
                    margin: 0 0 1rem 0;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }

                .statcast-header h2 i {
                    color: #BF5700;
                }

                /* Tabs */
                .statcast-tabs {
                    display: flex;
                    gap: 0.5rem;
                    border-bottom: 2px solid rgba(255, 255, 255, 0.1);
                }

                .statcast-tab {
                    background: none;
                    border: none;
                    color: rgba(255, 255, 255, 0.6);
                    padding: 0.75rem 1.5rem;
                    font-size: 1rem;
                    font-weight: 600;
                    cursor: pointer;
                    border-bottom: 3px solid transparent;
                    transition: all 0.3s ease;
                }

                .statcast-tab:hover {
                    color: rgba(255, 255, 255, 0.9);
                    background: rgba(255, 255, 255, 0.05);
                }

                .statcast-tab.active {
                    color: #BF5700;
                    border-bottom-color: #BF5700;
                }

                /* Player Search */
                .player-search {
                    display: flex;
                    gap: 1rem;
                    margin-bottom: 1.5rem;
                }

                .search-input {
                    flex: 1;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    border-radius: 8px;
                    padding: 0.75rem 1rem;
                    color: rgba(255, 255, 255, 0.9);
                    font-size: 1rem;
                }

                .search-input:focus {
                    outline: none;
                    border-color: #BF5700;
                    background: rgba(255, 255, 255, 0.08);
                }

                .search-btn, .load-btn {
                    background: linear-gradient(135deg, #BF5700, #FF8C00);
                    border: none;
                    border-radius: 8px;
                    padding: 0.75rem 1.5rem;
                    color: white;
                    font-weight: 600;
                    cursor: pointer;
                    transition: transform 0.2s ease;
                }

                .search-btn:hover, .load-btn:hover {
                    transform: translateY(-2px);
                }

                .season-select, .metric-select {
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    border-radius: 8px;
                    padding: 0.75rem 1rem;
                    color: rgba(255, 255, 255, 0.9);
                    font-size: 1rem;
                    cursor: pointer;
                }

                /* Quick Access */
                .quick-access {
                    margin-bottom: 2rem;
                }

                .quick-access h3 {
                    color: rgba(255, 255, 255, 0.8);
                    font-size: 1rem;
                    margin: 0 0 0.75rem 0;
                }

                .quick-access-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
                    gap: 0.75rem;
                }

                .quick-player-btn {
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(191, 87, 0, 0.3);
                    border-radius: 8px;
                    padding: 0.75rem;
                    color: rgba(255, 255, 255, 0.9);
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }

                .quick-player-btn:hover {
                    background: rgba(191, 87, 0, 0.2);
                    border-color: #BF5700;
                    transform: translateY(-2px);
                }

                /* Loading/Error States */
                .statcast-loading, .statcast-error {
                    text-align: center;
                    padding: 3rem;
                    color: rgba(255, 255, 255, 0.7);
                    font-size: 1.125rem;
                }

                .statcast-loading i {
                    font-size: 3rem;
                    color: #BF5700;
                    margin-bottom: 1rem;
                }

                .statcast-error {
                    background: rgba(220, 53, 69, 0.1);
                    border: 1px solid rgba(220, 53, 69, 0.3);
                    border-radius: 8px;
                }

                .statcast-error i {
                    color: #dc3545;
                    font-size: 2rem;
                    margin-bottom: 0.5rem;
                }

                /* Player Card */
                .player-card {
                    background: rgba(255, 255, 255, 0.03);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 12px;
                    padding: 2rem;
                    margin-bottom: 2rem;
                }

                .player-header {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    margin-bottom: 1.5rem;
                    flex-wrap: wrap;
                }

                .player-header h3 {
                    color: rgba(255, 255, 255, 0.95);
                    font-size: 1.5rem;
                    margin: 0;
                }

                .team-badge, .position-badge, .season-badge {
                    padding: 0.375rem 0.75rem;
                    border-radius: 6px;
                    font-size: 0.875rem;
                    font-weight: 600;
                }

                .team-badge {
                    background: rgba(191, 87, 0, 0.2);
                    color: #FF8C00;
                    border: 1px solid rgba(191, 87, 0, 0.3);
                }

                .position-badge {
                    background: rgba(75, 192, 192, 0.2);
                    color: #4bc0c0;
                    border: 1px solid rgba(75, 192, 192, 0.3);
                }

                .season-badge {
                    background: rgba(153, 102, 255, 0.2);
                    color: #9966ff;
                    border: 1px solid rgba(153, 102, 255, 0.3);
                }

                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                    gap: 1.5rem;
                    margin-bottom: 1.5rem;
                }

                .stat-group {
                    background: rgba(255, 255, 255, 0.02);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 8px;
                    padding: 1.25rem;
                }

                .stat-group h4 {
                    color: rgba(255, 255, 255, 0.8);
                    font-size: 1rem;
                    margin: 0 0 1rem 0;
                    padding-bottom: 0.5rem;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                }

                .stat-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 0.5rem 0;
                }

                .stat-label {
                    color: rgba(255, 255, 255, 0.6);
                    font-size: 0.875rem;
                }

                .stat-value {
                    color: rgba(255, 255, 255, 0.95);
                    font-weight: 700;
                    font-size: 1.125rem;
                }

                .stat-value.highlight {
                    color: #FF8C00;
                }

                .stat-pending {
                    text-align: center;
                    padding: 2rem 1rem;
                    color: rgba(255, 255, 255, 0.5);
                    font-size: 0.875rem;
                }

                .stat-pending i {
                    font-size: 2rem;
                    margin-bottom: 0.5rem;
                    display: block;
                }

                .data-info {
                    background: rgba(255, 255, 255, 0.02);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 6px;
                    padding: 1rem;
                    font-size: 0.875rem;
                    color: rgba(255, 255, 255, 0.7);
                }

                /* Charts */
                .charts-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
                    gap: 2rem;
                    margin-bottom: 2rem;
                }

                .chart-container {
                    background: rgba(255, 255, 255, 0.03);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 12px;
                    padding: 1.5rem;
                }

                .chart-container h4 {
                    color: rgba(255, 255, 255, 0.9);
                    font-size: 1.125rem;
                    margin: 0 0 1rem 0;
                }

                .charts-pending {
                    text-align: center;
                    padding: 4rem 2rem;
                }

                .charts-pending i {
                    font-size: 4rem;
                    color: rgba(191, 87, 0, 0.5);
                    margin-bottom: 1rem;
                }

                .charts-pending h3 {
                    color: rgba(255, 255, 255, 0.9);
                    margin-bottom: 0.5rem;
                }

                .charts-pending p {
                    color: rgba(255, 255, 255, 0.6);
                    font-size: 1rem;
                    max-width: 600px;
                    margin: 0 auto;
                }

                /* Leaderboard */
                .leaderboard-selector {
                    display: flex;
                    gap: 1rem;
                    align-items: center;
                    margin-bottom: 2rem;
                }

                .leaderboard-selector label {
                    color: rgba(255, 255, 255, 0.8);
                    font-weight: 600;
                }

                .leaderboard-table {
                    width: 100%;
                    border-collapse: collapse;
                    background: rgba(255, 255, 255, 0.02);
                    border-radius: 8px;
                    overflow: hidden;
                }

                .leaderboard-table thead {
                    background: rgba(191, 87, 0, 0.2);
                }

                .leaderboard-table th {
                    padding: 1rem;
                    text-align: left;
                    color: rgba(255, 255, 255, 0.9);
                    font-weight: 700;
                    text-transform: uppercase;
                    font-size: 0.875rem;
                    letter-spacing: 0.5px;
                }

                .leaderboard-table td {
                    padding: 1rem;
                    border-top: 1px solid rgba(255, 255, 255, 0.1);
                    color: rgba(255, 255, 255, 0.8);
                }

                .leaderboard-table .player-name {
                    font-weight: 600;
                    color: rgba(255, 255, 255, 0.95);
                }

                .leaderboard-table .metric-value {
                    font-weight: 700;
                    color: #FF8C00;
                }

                .leaderboard-empty {
                    text-align: center;
                    padding: 4rem 2rem;
                }

                .leaderboard-empty i {
                    font-size: 4rem;
                    color: rgba(191, 87, 0, 0.5);
                    margin-bottom: 1rem;
                }

                .leaderboard-empty h3 {
                    color: rgba(255, 255, 255, 0.9);
                    margin-bottom: 0.5rem;
                }

                .leaderboard-empty p {
                    color: rgba(255, 255, 255, 0.6);
                    font-size: 1rem;
                    max-width: 600px;
                    margin: 0 auto 1rem auto;
                }

                .integration-note {
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 6px;
                    padding: 1rem;
                    margin-top: 1.5rem;
                    font-size: 0.875rem;
                }

                /* Footer */
                .statcast-footer {
                    margin-top: 2rem;
                    padding-top: 1.5rem;
                    border-top: 1px solid rgba(255, 255, 255, 0.1);
                    color: rgba(255, 255, 255, 0.6);
                    font-size: 0.875rem;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }

                .statcast-footer i {
                    color: #BF5700;
                }

                .phase-badge {
                    background: rgba(191, 87, 0, 0.2);
                    color: #FF8C00;
                    padding: 0.25rem 0.625rem;
                    border-radius: 4px;
                    font-weight: 700;
                    font-size: 0.75rem;
                    margin-left: auto;
                }

                /* Responsive */
                @media (max-width: 768px) {
                    .statcast-container {
                        padding: 1rem;
                        margin: 1rem 0;
                    }

                    .player-search {
                        flex-direction: column;
                    }

                    .stats-grid, .charts-grid {
                        grid-template-columns: 1fr;
                    }

                    .quick-access-grid {
                        grid-template-columns: repeat(2, 1fr);
                    }
                }
            `;
            document.head.appendChild(style);
        }
    };

    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            StatcastAnalytics.init();
        });
    } else {
        StatcastAnalytics.init();
    }

    // Expose globally for external access
    window.StatcastAnalytics = StatcastAnalytics;
})();
