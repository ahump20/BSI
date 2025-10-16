/**
 * Championship Dashboard Integration
 * Deep South Sports Authority - Blaze Intelligence
 * Texas • SEC • Every Player • Every Level
 */

import DeepSouthSportsAuthority from './api/deep-south-authority.js';

class ChampionshipDashboardIntegration {
    constructor() {
        this.authority = new DeepSouthSportsAuthority();
        this.updateInterval = 5000; // 5 seconds
        this.widgets = new Map();
        this.isInitialized = false;
    }

    async initialize() {
        if (this.isInitialized) return;


        try {
            // Initialize dashboard widgets
            await this.initializeWidgets();

            // Start real-time updates
            this.startRealTimeUpdates();

            // Initialize sports hierarchy display
            this.initializeSportsHierarchy();

            this.isInitialized = true;
        } catch (error) {
            console.error('❌ Failed to initialize dashboard:', error);
        }
    }

    async initializeWidgets() {
        const widgets = [
            { id: 'championship-race', component: 'ChampionshipRaceWidget' },
            { id: 'recruiting-pipeline', component: 'RecruitingPipelineWidget' },
            { id: 'live-scores', component: 'LiveScoresWidget' },
            { id: 'texas-football', component: 'TexasFootballWidget' },
            { id: 'perfect-game', component: 'PerfectGameWidget' },
            { id: 'sec-standings', component: 'SECStandingsWidget' }
        ];

        for (const widget of widgets) {
            try {
                const element = document.getElementById(widget.id);
                if (element) {
                    this.widgets.set(widget.id, await this.createWidget(widget));
                }
            } catch (error) {
                console.warn(`⚠️ Widget failed to load: ${widget.component}`, error);
            }
        }
    }

    async createWidget(config) {
        const { id, component } = config;

        switch (component) {
            case 'ChampionshipRaceWidget':
                return new ChampionshipRaceWidget(id, this.authority);
            case 'RecruitingPipelineWidget':
                return new RecruitingPipelineWidget(id, this.authority);
            case 'LiveScoresWidget':
                return new LiveScoresWidget(id, this.authority);
            case 'TexasFootballWidget':
                return new TexasFootballWidget(id, this.authority);
            case 'PerfectGameWidget':
                return new PerfectGameWidget(id, this.authority);
            case 'SECStandingsWidget':
                return new SECStandingsWidget(id, this.authority);
            default:
                throw new Error(`Unknown widget type: ${component}`);
        }
    }

    initializeSportsHierarchy() {
        const hierarchyElement = document.querySelector('.sports-hierarchy');
        if (hierarchyElement) {
            const sportsOrder = ['Baseball', 'Football', 'Basketball', 'Track & Field'];
            hierarchyElement.innerHTML = sportsOrder.map((sport, index) =>
                `<div class="sport-level" data-order="${index + 1}">
                    <span class="sport-number">${index + 1}</span>
                    <span class="sport-name">${sport}</span>
                </div>`
            ).join('');
        }
    }

    startRealTimeUpdates() {
        setInterval(async () => {
            try {
                await this.updateAllWidgets();
            } catch (error) {
                console.error('❌ Update failed:', error);
            }
        }, this.updateInterval);
    }

    async updateAllWidgets() {
        const updatePromises = Array.from(this.widgets.values()).map(widget =>
            widget.update().catch(error =>
                console.warn(`Widget update failed: ${widget.constructor.name}`, error)
            )
        );

        await Promise.allSettled(updatePromises);
    }

    // Expose global methods
    async getComprehensiveDashboard() {
        return await this.authority.getComprehensiveDashboard();
    }

    async getChampionshipPredictions() {
        return await this.authority.getChampionshipPredictions();
    }

    async getLiveScores(sport = 'all') {
        return await this.authority.getLiveScores(sport);
    }
}

// Base Widget Class
class BaseWidget {
    constructor(elementId, authority) {
        this.elementId = elementId;
        this.authority = authority;
        this.element = document.getElementById(elementId);
        this.lastUpdate = null;
    }

    async update() {
        try {
            const data = await this.fetchData();
            this.render(data);
            this.lastUpdate = new Date();
        } catch (error) {
            this.renderError(error);
        }
    }

    async fetchData() {
        throw new Error('fetchData must be implemented by subclass');
    }

    render(data) {
        throw new Error('render must be implemented by subclass');
    }

    renderError(error) {
        if (this.element) {
            this.element.innerHTML = `
                <div class="widget-error">
                    <i class="fas fa-exclamation-triangle"></i>
                    <span>Data temporarily unavailable</span>
                </div>
            `;
        }
    }
}

// Championship Race Widget
class ChampionshipRaceWidget extends BaseWidget {
    async fetchData() {
        return await this.authority.getChampionshipPredictions();
    }

    render(data) {
        if (!this.element) return;

        const { predictions } = data;

        this.element.innerHTML = `
            <div class="championship-race">
                <h3>Championship Race</h3>
                <div class="sport-predictions">
                    ${this.renderSportPredictions(predictions.baseball, 'Baseball')}
                    ${this.renderSportPredictions(predictions.football, 'Football')}
                    ${this.renderSportPredictions(predictions.basketball, 'Basketball')}
                </div>
            </div>
        `;
    }

    renderSportPredictions(sportData, sportName) {
        return `
            <div class="sport-prediction" data-sport="${sportName.toLowerCase()}">
                <h4>${sportName}</h4>
                <div class="predictions-content">
                    ${JSON.stringify(sportData, null, 2)}
                </div>
            </div>
        `;
    }
}

// Live Scores Widget
class LiveScoresWidget extends BaseWidget {
    async fetchData() {
        return await this.authority.getLiveScores();
    }

    render(data) {
        if (!this.element) return;

        const { games } = data;

        this.element.innerHTML = `
            <div class="live-scores">
                <h3>Live Scores</h3>
                <div class="scores-container">
                    ${this.renderGamesByDay(games)}
                </div>
            </div>
        `;
    }

    renderGamesByDay(games) {
        let html = '';

        // Baseball first
        if (games.baseball) {
            html += this.renderSportGames(games.baseball, 'Baseball');
        }

        // Football second
        if (games.football) {
            html += this.renderSportGames(games.football, 'Football');
        }

        // Basketball third
        if (games.basketball) {
            html += this.renderSportGames(games.basketball, 'Basketball');
        }

        return html;
    }

    renderSportGames(sportGames, sportName) {
        return `
            <div class="sport-games" data-sport="${sportName.toLowerCase()}">
                <h4>${sportName}</h4>
                ${Object.entries(sportGames).map(([league, games]) =>
                    this.renderLeagueGames(league, games)
                ).join('')}
            </div>
        `;
    }

    renderLeagueGames(league, games) {
        return `
            <div class="league-games" data-league="${league}">
                <h5>${league.toUpperCase()}</h5>
                ${games.map(game => this.renderGame(game)).join('')}
            </div>
        `;
    }

    renderGame(game) {
        return `
            <div class="game-score">
                <div class="teams">
                    <span class="away">${game.away}</span>
                    <span class="vs">@</span>
                    <span class="home">${game.home}</span>
                </div>
                <div class="score">${game.score}</div>
                <div class="status">${game.status}</div>
            </div>
        `;
    }
}

// Texas Football Widget
class TexasFootballWidget extends BaseWidget {
    async fetchData() {
        return await this.authority.texasFootball.getStateRankings();
    }

    render(data) {
        if (!this.element) return;

        this.element.innerHTML = `
            <div class="texas-football">
                <h3>Texas High School Football</h3>
                <div class="rankings">
                    ${data.teams.slice(0, 10).map(team => `
                        <div class="team-rank">
                            <span class="rank">${team.rank}</span>
                            <span class="team">${team.team}</span>
                            <span class="class">${team.class}</span>
                            <span class="record">${team.record}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
}

// Perfect Game Widget
class PerfectGameWidget extends BaseWidget {
    async fetchData() {
        return await this.authority.perfectGame.getTopProspects();
    }

    render(data) {
        if (!this.element) return;

        this.element.innerHTML = `
            <div class="perfect-game">
                <h3>Perfect Game Pipeline</h3>
                <div class="prospects">
                    ${data.prospects.slice(0, 5).map(prospect => `
                        <div class="prospect">
                            <span class="rank">${prospect.rank}</span>
                            <span class="name">${prospect.name}</span>
                            <span class="position">${prospect.position}</span>
                            <span class="grade">${prospect.perfectGameGrade}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
}

// SEC Standings Widget
class SECStandingsWidget extends BaseWidget {
    async fetchData() {
        return await this.authority.secChampionship.getChampionshipRace();
    }

    render(data) {
        if (!this.element) return;

        this.element.innerHTML = `
            <div class="sec-standings">
                <h3>SEC Championship Race</h3>
                <div class="standings-content">
                    ${JSON.stringify(data, null, 2)}
                </div>
            </div>
        `;
    }
}

// Recruiting Pipeline Widget
class RecruitingPipelineWidget extends BaseWidget {
    async fetchData() {
        return await this.authority.getPlayerPipeline();
    }

    render(data) {
        if (!this.element) return;

        this.element.innerHTML = `
            <div class="recruiting-pipeline">
                <h3>Recruiting Pipeline</h3>
                <div class="pipeline-content">
                    ${JSON.stringify(data, null, 2)}
                </div>
            </div>
        `;
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
    try {
        window.championshipDashboard = new ChampionshipDashboardIntegration();
        await window.championshipDashboard.initialize();
    } catch (error) {
        console.error('Failed to initialize championship dashboard:', error);
    }
});

// Export for external use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChampionshipDashboardIntegration;
}