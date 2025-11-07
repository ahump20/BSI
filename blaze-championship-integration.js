/**
 * Blaze Sports Intel - Championship Data Integration
 * Deep South Sports Authority
 * Integrates MCP server data with Cloudflare Pages platform
 */

class BlazeChampionshipPlatform {
  constructor() {
    this.apiBase = 'https://blazesportsintel.com/api';
    this.teams = ['cardinals', 'titans', 'grizzlies', 'longhorns'];
    this.sports = ['mlb', 'nfl', 'nba', 'ncaa'];
    this.updateInterval = 60000; // Update every minute
    this.init();
  }

  async init() {
    await this.loadChampionshipData();
    this.startRealTimeUpdates();
    this.initializeUIComponents();
  }

  async loadChampionshipData() {
    try {
      const response = await fetch(`${this.apiBase}/championship`);
      const data = await response.json();

      this.updateDashboard(data);
      return data;
    } catch (error) {
      console.error('Failed to load championship data:', error);
      // Fallback to MCP data if API fails
      return this.getMCPFallbackData();
    }
  }

  async loadLiveScores(sport = 'all') {
    try {
      const response = await fetch(`${this.apiBase}/live-scores?sport=${sport}`);
      const scores = await response.json();

      this.updateScoreboard(scores);
      return scores;
    } catch (error) {
      console.error('Failed to load live scores:', error);
    }
  }

  updateDashboard(data) {
    // Update team cards
    this.teams.forEach(team => {
      const teamData = data.featuredTeams[team];
      if (teamData) {
        this.updateTeamCard(team, teamData);
      }
    });

    // Update analytics section
    if (data.analytics) {
      this.updateAnalytics(data.analytics);
    }

    // Update pipeline metrics
    if (data.pipeline) {
      this.updatePipeline(data.pipeline);
    }
  }

  updateTeamCard(teamId, data) {
    const card = document.getElementById(`${teamId}-card`);
    if (!card) return;

    // Update record
    const recordEl = card.querySelector('.team-record');
    if (recordEl && data.record) {
      recordEl.textContent = data.record;
    }

    // Update win percentage
    const winPctEl = card.querySelector('.win-percentage');
    if (winPctEl && data.winPercentage) {
      winPctEl.textContent = `${(data.winPercentage * 100).toFixed(1)}%`;
    }

    // Update rank
    const rankEl = card.querySelector('.team-rank');
    if (rankEl) {
      const rank = data.divisionRank || data.conferenceRank || data.ranking;
      if (rank) rankEl.textContent = `Rank: ${rank}`;
    }

    // Update key stats based on sport
    this.updateSportSpecificStats(card, data);
  }

  updateSportSpecificStats(card, data) {
    const statsContainer = card.querySelector('.team-stats');
    if (!statsContainer) return;

    let statsHTML = '';

    switch(data.sport) {
      case 'MLB':
        statsHTML = `
          <div class="stat">
            <span class="stat-label">Runs Scored:</span>
            <span class="stat-value">${data.runsScored || 0}</span>
          </div>
          <div class="stat">
            <span class="stat-label">Team ERA:</span>
            <span class="stat-value">${data.analytics?.teamERA || 'N/A'}</span>
          </div>
          <div class="stat">
            <span class="stat-label">Home Record:</span>
            <span class="stat-value">${data.homeRecord || 'N/A'}</span>
          </div>
        `;
        break;

      case 'NFL':
        statsHTML = `
          <div class="stat">
            <span class="stat-label">Points For:</span>
            <span class="stat-value">${data.pointsFor || 0}</span>
          </div>
          <div class="stat">
            <span class="stat-label">Points Against:</span>
            <span class="stat-value">${data.pointsAgainst || 0}</span>
          </div>
          <div class="stat">
            <span class="stat-label">Differential:</span>
            <span class="stat-value">${data.differential || 0}</span>
          </div>
        `;
        break;

      case 'NBA':
        statsHTML = `
          <div class="stat">
            <span class="stat-label">PPG:</span>
            <span class="stat-value">${data.pointsPerGame || 0}</span>
          </div>
          <div class="stat">
            <span class="stat-label">Opp PPG:</span>
            <span class="stat-value">${data.pointsAgainstPerGame || 0}</span>
          </div>
          <div class="stat">
            <span class="stat-label">Net Rating:</span>
            <span class="stat-value">${data.analytics?.netRating || 0}</span>
          </div>
        `;
        break;

      case 'NCAA Athletics':
        statsHTML = `
          <div class="stat">
            <span class="stat-label">Football:</span>
            <span class="stat-value">${data.footballRecord || 'N/A'}</span>
          </div>
          <div class="stat">
            <span class="stat-label">CFP Rank:</span>
            <span class="stat-value">${data.ranking || 'N/A'}</span>
          </div>
          <div class="stat">
            <span class="stat-label">Recruiting:</span>
            <span class="stat-value">${data.analytics?.recruitingRank || 'N/A'}</span>
          </div>
        `;
        break;
    }

    statsContainer.innerHTML = statsHTML;
  }

  updateAnalytics(analytics) {
    // Update performance index
    const perfIndex = document.getElementById('performance-index');
    if (perfIndex) {
      perfIndex.textContent = analytics.performanceIndex || 'N/A';
    }

    // Update championship probabilities
    if (analytics.championshipProbability) {
      Object.entries(analytics.championshipProbability).forEach(([team, prob]) => {
        const probEl = document.getElementById(`${team}-championship-prob`);
        if (probEl) {
          probEl.textContent = prob;
        }
      });
    }

    // Update recommendations
    const recsContainer = document.getElementById('recommendations');
    if (recsContainer && analytics.recommendations) {
      recsContainer.innerHTML = analytics.recommendations
        .map(rec => `<li class="recommendation">${rec}</li>`)
        .join('');
    }
  }

  updatePipeline(pipeline) {
    // Update Perfect Game metrics
    if (pipeline.perfectGame) {
      const pgProspects = document.getElementById('pg-prospects');
      if (pgProspects) {
        pgProspects.textContent = pipeline.perfectGame.topProspects || 0;
      }
    }

    // Update high school metrics
    if (pipeline.highSchool) {
      const hsAthletes = document.getElementById('hs-athletes');
      if (hsAthletes) {
        hsAthletes.textContent = pipeline.highSchool.trackedAthletes || 0;
      }
    }
  }

  updateScoreboard(scores) {
    const scoreboard = document.getElementById('live-scoreboard');
    if (!scoreboard) return;

    let scoresHTML = '<h3>Live Scores</h3>';

    Object.entries(scores.games || {}).forEach(([sport, games]) => {
      if (games.length > 0) {
        scoresHTML += `<div class="sport-scores" data-sport="${sport}">`;
        scoresHTML += `<h4>${sport.toUpperCase()}</h4>`;

        games.forEach(game => {
          scoresHTML += `
            <div class="game-score">
              <span class="teams">${game.team} vs ${game.opponent}</span>
              <span class="score">${game.score.home} - ${game.score.away}</span>
              <span class="status">${game.status}</span>
            </div>
          `;
        });

        scoresHTML += '</div>';
      }
    });

    scoreboard.innerHTML = scoresHTML;
  }

  startRealTimeUpdates() {
    // Update championship data every minute
    setInterval(() => {
      this.loadChampionshipData();
      this.loadLiveScores();
    }, this.updateInterval);

  }

  initializeUIComponents() {
    // Initialize interactive elements
    this.initializeCharts();
    this.initializeFilters();
    this.initializeAnimations();
  }

  initializeCharts() {
    // Championship probability chart
    const chartCanvas = document.getElementById('championship-chart');
    if (chartCanvas && window.Chart) {
      new Chart(chartCanvas, {
        type: 'bar',
        data: {
          labels: ['Cardinals', 'Titans', 'Grizzlies', 'Longhorns'],
          datasets: [{
            label: 'Championship Probability',
            data: [12.3, 8.7, 15.6, 42.1],
            backgroundColor: [
              'rgba(191, 87, 0, 0.8)',   // Cardinals - Burnt Orange
              'rgba(0, 34, 68, 0.8)',     // Titans - Navy
              'rgba(0, 178, 169, 0.8)',   // Grizzlies - Teal
              'rgba(191, 87, 0, 0.8)'     // Longhorns - Burnt Orange
            ],
            borderColor: '#FFB81C',
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: {
              display: false
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              max: 50,
              ticks: {
                callback(value) {
                  return value + '%';
                }
              }
            }
          }
        }
      });
    }
  }

  initializeFilters() {
    // Sport filter buttons
    const filterButtons = document.querySelectorAll('.sport-filter');
    filterButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const sport = e.target.dataset.sport;
        this.loadLiveScores(sport);

        // Update active state
        filterButtons.forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');
      });
    });
  }

  initializeAnimations() {
    // Scroll animations
    if (window.AOS) {
      AOS.init({
        duration: 800,
        once: true,
        offset: 100
      });
    }

    // Number counter animations
    const counters = document.querySelectorAll('.stat-counter');
    counters.forEach(counter => {
      const target = parseInt(counter.dataset.target);
      const duration = 2000;
      const step = target / (duration / 16);
      let current = 0;

      const updateCounter = () => {
        current += step;
        if (current < target) {
          counter.textContent = Math.floor(current);
          requestAnimationFrame(updateCounter);
        } else {
          counter.textContent = target;
        }
      };

      updateCounter();
    });
  }

  // Utility method to get MCP fallback data
  getMCPFallbackData() {
    return {
      timestamp: new Date().toISOString(),
      featuredTeams: {
        cardinals: {
          sport: "MLB",
          record: "83-79",
          winPercentage: 0.512,
          divisionRank: 2
        },
        titans: {
          sport: "NFL",
          record: "6-11",
          divisionRank: 3
        },
        grizzlies: {
          sport: "NBA",
          record: "27-55",
          winPercentage: 0.329
        },
        longhorns: {
          sport: "NCAA",
          ranking: "#3 CFP Final"
        }
      },
      analytics: {
        performanceIndex: 78.4,
        championshipProbability: {
          cardinals: "12.3%",
          titans: "8.7%",
          grizzlies: "15.6%",
          longhorns: "42.1%"
        }
      }
    };
  }
}

// Initialize platform when DOM is ready
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.blazePlatform = new BlazeChampionshipPlatform();
    });
  } else {
    window.blazePlatform = new BlazeChampionshipPlatform();
  }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BlazeChampionshipPlatform;
}