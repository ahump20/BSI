/**
 * BLAZE SPORTS INTEL - Historical Stats Viewer
 * View and analyze historical performance data
 */

class HistoricalStatsViewer {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.currentSport = 'baseball';
        this.currentTeam = 'STL';
        this.dateRange = {
            start: new Date(new Date().setMonth(new Date().getMonth() - 6)),
            end: new Date()
        };
        this.cache = new Map();
    }

    async init() {
        this.render();
        await this.loadHistoricalData();
    }

    render() {
        this.container.innerHTML = `
            <div class="historical-stats-viewer">
                <div class="stats-header">
                    <h2>📊 Historical Performance Analysis</h2>
                    <div class="controls">
                        <select id="sportSelect" class="control-select">
                            <option value="baseball">⚾ Baseball</option>
                            <option value="football">🏈 Football</option>
                            <option value="basketball">🏀 Basketball</option>
                        </select>
                        <select id="teamSelect" class="control-select">
                            <option value="STL">Cardinals</option>
                            <option value="TEN">Titans</option>
                            <option value="TEX">Longhorns</option>
                            <option value="MEM">Grizzlies</option>
                        </select>
                        <select id="rangeSelect" class="control-select">
                            <option value="7">Last 7 Days</option>
                            <option value="30">Last 30 Days</option>
                            <option value="90">Last 3 Months</option>
                            <option value="365">Last Year</option>
                            <option value="all">All Time</option>
                        </select>
                        <button id="refreshBtn" class="refresh-btn">🔄 Refresh</button>
                    </div>
                </div>

                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-card-header">Win/Loss Trend</div>
                        <canvas id="winLossChart"></canvas>
                    </div>

                    <div class="stat-card">
                        <div class="stat-card-header">Performance Metrics</div>
                        <canvas id="performanceChart"></canvas>
                    </div>

                    <div class="stat-card">
                        <div class="stat-card-header">Season Comparison</div>
                        <div id="seasonComparison"></div>
                    </div>

                    <div class="stat-card">
                        <div class="stat-card-header">Key Statistics</div>
                        <div id="keyStats"></div>
                    </div>
                </div>

                <div class="detailed-stats">
                    <h3>📈 Detailed Game Log</h3>
                    <div id="gameLog"></div>
                </div>
            </div>
        `;

        this.attachEventListeners();
        this.initCharts();
    }

    attachEventListeners() {
        document.getElementById('sportSelect').addEventListener('change', (e) => {
            this.currentSport = e.target.value;
            this.loadHistoricalData();
        });

        document.getElementById('teamSelect').addEventListener('change', (e) => {
            this.currentTeam = e.target.value;
            this.loadHistoricalData();
        });

        document.getElementById('rangeSelect').addEventListener('change', (e) => {
            const days = e.target.value === 'all' ? 3650 : parseInt(e.target.value);
            this.dateRange.start = new Date(new Date().setDate(new Date().getDate() - days));
            this.loadHistoricalData();
        });

        document.getElementById('refreshBtn').addEventListener('click', () => {
            this.cache.clear();
            this.loadHistoricalData();
        });
    }

    async loadHistoricalData() {
        const cacheKey = `${this.currentSport}-${this.currentTeam}-${this.dateRange.start.getTime()}`;

        if (this.cache.has(cacheKey)) {
            this.displayData(this.cache.get(cacheKey));
            return;
        }

        try {
            // In production, these would be real API calls
            const data = await this.fetchHistoricalData();
            this.cache.set(cacheKey, data);
            this.displayData(data);
        } catch (error) {
            console.error('Failed to load historical data:', error);
            this.showError('Failed to load historical data');
        }
    }

    async fetchHistoricalData() {
        // Simulate API call - in production this would call real endpoints
        await new Promise(resolve => setTimeout(resolve, 500));

        // Generate sample historical data based on sport
        const games = this.generateGameHistory();
        const stats = this.calculateStatistics(games);

        return {
            games,
            stats,
            trends: this.calculateTrends(games),
            comparisons: this.generateComparisons()
        };
    }

    generateGameHistory() {
        const games = [];
        const numGames = this.currentSport === 'baseball' ? 162 :
                        this.currentSport === 'football' ? 17 : 82;

        for (let i = 0; i < Math.min(numGames, 30); i++) {
            const date = new Date();
            date.setDate(date.getDate() - (i * 3));

            const won = Math.random() > 0.45;
            const scoreFor = Math.floor(Math.random() * 10) + 70;
            const scoreAgainst = won ?
                scoreFor - Math.floor(Math.random() * 20) :
                scoreFor + Math.floor(Math.random() * 20);

            games.push({
                date: date.toISOString().split('T')[0],
                opponent: this.getRandomOpponent(),
                result: won ? 'W' : 'L',
                scoreFor,
                scoreAgainst,
                home: Math.random() > 0.5
            });
        }

        return games.reverse();
    }

    getRandomOpponent() {
        const opponents = {
            baseball: ['Cubs', 'Brewers', 'Pirates', 'Reds', 'Dodgers', 'Giants'],
            football: ['Jaguars', 'Colts', 'Texans', 'Chiefs', 'Raiders', 'Chargers'],
            basketball: ['Lakers', 'Warriors', 'Suns', 'Jazz', 'Nuggets', 'Thunder']
        };

        const sportOpponents = opponents[this.currentSport] || opponents.baseball;
        return sportOpponents[Math.floor(Math.random() * sportOpponents.length)];
    }

    calculateStatistics(games) {
        const wins = games.filter(g => g.result === 'W').length;
        const losses = games.length - wins;
        const totalScoreFor = games.reduce((sum, g) => sum + g.scoreFor, 0);
        const totalScoreAgainst = games.reduce((sum, g) => sum + g.scoreAgainst, 0);

        const homeGames = games.filter(g => g.home);
        const awayGames = games.filter(g => !g.home);
        const homeWins = homeGames.filter(g => g.result === 'W').length;
        const awayWins = awayGames.filter(g => g.result === 'W').length;

        // Last 10 games
        const last10 = games.slice(-10);
        const last10Wins = last10.filter(g => g.result === 'W').length;

        // Streaks
        let currentStreak = 0;
        let streakType = '';
        for (let i = games.length - 1; i >= 0; i--) {
            if (i === games.length - 1) {
                streakType = games[i].result;
                currentStreak = 1;
            } else if (games[i].result === streakType) {
                currentStreak++;
            } else {
                break;
            }
        }

        return {
            record: `${wins}-${losses}`,
            winPct: ((wins / games.length) * 100).toFixed(1),
            avgScoreFor: (totalScoreFor / games.length).toFixed(1),
            avgScoreAgainst: (totalScoreAgainst / games.length).toFixed(1),
            pointDiff: ((totalScoreFor - totalScoreAgainst) / games.length).toFixed(1),
            homeRecord: `${homeWins}-${homeGames.length - homeWins}`,
            awayRecord: `${awayWins}-${awayGames.length - awayWins}`,
            last10: `${last10Wins}-${10 - last10Wins}`,
            streak: `${streakType}${currentStreak}`
        };
    }

    calculateTrends(games) {
        // Calculate rolling averages
        const windowSize = 5;
        const trends = [];

        for (let i = windowSize - 1; i < games.length; i++) {
            const window = games.slice(i - windowSize + 1, i + 1);
            const wins = window.filter(g => g.result === 'W').length;
            const avgScore = window.reduce((sum, g) => sum + g.scoreFor, 0) / windowSize;

            trends.push({
                date: games[i].date,
                winPct: (wins / windowSize) * 100,
                avgScore
            });
        }

        return trends;
    }

    generateComparisons() {
        // Generate season-over-season comparisons
        return {
            currentYear: {
                wins: 83,
                losses: 79,
                playoffs: false,
                ranking: 3
            },
            lastYear: {
                wins: 93,
                losses: 69,
                playoffs: true,
                ranking: 1
            },
            change: {
                wins: -10,
                winPct: -6.2,
                ranking: -2
            }
        };
    }

    displayData(data) {
        this.updateCharts(data);
        this.updateKeyStats(data.stats);
        this.updateSeasonComparison(data.comparisons);
        this.updateGameLog(data.games);
    }

    initCharts() {
        // Initialize Chart.js charts
        const winLossCtx = document.getElementById('winLossChart').getContext('2d');
        this.winLossChart = new Chart(winLossCtx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Win %',
                    data: [],
                    borderColor: '#28a745',
                    backgroundColor: 'rgba(40, 167, 69, 0.1)',
                    tension: 0.1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: { callback: (value) => value + '%' }
                    }
                }
            }
        });

        const performanceCtx = document.getElementById('performanceChart').getContext('2d');
        this.performanceChart = new Chart(performanceCtx, {
            type: 'bar',
            data: {
                labels: [],
                datasets: [{
                    label: 'Points For',
                    data: [],
                    backgroundColor: '#ff6b00'
                }, {
                    label: 'Points Against',
                    data: [],
                    backgroundColor: '#dc3545'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'top' }
                }
            }
        });
    }

    updateCharts(data) {
        // Update win/loss trend chart
        if (this.winLossChart && data.trends) {
            this.winLossChart.data.labels = data.trends.map(t => t.date);
            this.winLossChart.data.datasets[0].data = data.trends.map(t => t.winPct);
            this.winLossChart.update();
        }

        // Update performance chart
        if (this.performanceChart && data.games) {
            const last10Games = data.games.slice(-10);
            this.performanceChart.data.labels = last10Games.map(g => g.opponent);
            this.performanceChart.data.datasets[0].data = last10Games.map(g => g.scoreFor);
            this.performanceChart.data.datasets[1].data = last10Games.map(g => g.scoreAgainst);
            this.performanceChart.update();
        }
    }

    updateKeyStats(stats) {
        document.getElementById('keyStats').innerHTML = `
            <div class="stat-item">
                <div class="stat-label">Overall Record</div>
                <div class="stat-value">${stats.record}</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">Win Percentage</div>
                <div class="stat-value">${stats.winPct}%</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">Home Record</div>
                <div class="stat-value">${stats.homeRecord}</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">Away Record</div>
                <div class="stat-value">${stats.awayRecord}</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">Last 10 Games</div>
                <div class="stat-value">${stats.last10}</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">Current Streak</div>
                <div class="stat-value">${stats.streak}</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">Avg Points For</div>
                <div class="stat-value">${stats.avgScoreFor}</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">Avg Points Against</div>
                <div class="stat-value">${stats.avgScoreAgainst}</div>
            </div>
        `;
    }

    updateSeasonComparison(comparisons) {
        const current = comparisons.currentYear;
        const last = comparisons.lastYear;
        const change = comparisons.change;

        document.getElementById('seasonComparison').innerHTML = `
            <table class="comparison-table">
                <thead>
                    <tr>
                        <th>Season</th>
                        <th>Record</th>
                        <th>Win %</th>
                        <th>Playoffs</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Current</td>
                        <td>${current.wins}-${current.losses}</td>
                        <td>${((current.wins / (current.wins + current.losses)) * 100).toFixed(1)}%</td>
                        <td>${current.playoffs ? '✅' : '❌'}</td>
                    </tr>
                    <tr>
                        <td>Last Year</td>
                        <td>${last.wins}-${last.losses}</td>
                        <td>${((last.wins / (last.wins + last.losses)) * 100).toFixed(1)}%</td>
                        <td>${last.playoffs ? '✅' : '❌'}</td>
                    </tr>
                    <tr class="change-row">
                        <td>Change</td>
                        <td>${change.wins > 0 ? '+' : ''}${change.wins}</td>
                        <td>${change.winPct > 0 ? '+' : ''}${change.winPct.toFixed(1)}%</td>
                        <td>-</td>
                    </tr>
                </tbody>
            </table>
        `;
    }

    updateGameLog(games) {
        const gameLogHtml = `
            <table class="game-log-table">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Opponent</th>
                        <th>Result</th>
                        <th>Score</th>
                        <th>Location</th>
                    </tr>
                </thead>
                <tbody>
                    ${games.slice(-20).reverse().map(game => `
                        <tr class="${game.result === 'W' ? 'win-row' : 'loss-row'}">
                            <td>${new Date(game.date).toLocaleDateString()}</td>
                            <td>${game.opponent}</td>
                            <td class="${game.result === 'W' ? 'win' : 'loss'}">${game.result}</td>
                            <td>${game.scoreFor}-${game.scoreAgainst}</td>
                            <td>${game.home ? 'Home' : 'Away'}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;

        document.getElementById('gameLog').innerHTML = gameLogHtml;
    }

    showError(message) {
        this.container.innerHTML = `
            <div class="error-message">
                <h3>⚠️ Error</h3>
                <p>${message}</p>
                <button onclick="location.reload()">Reload Page</button>
            </div>
        `;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HistoricalStatsViewer;
}

// Auto-initialize if on stats page
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('historicalStatsContainer')) {
        const viewer = new HistoricalStatsViewer('historicalStatsContainer');
        viewer.init();
    }
});