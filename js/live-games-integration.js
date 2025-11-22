/**
 * Live Games Real-Time Integration Module
 * Phase 3: Real-Time Data Integration
 *
 * Fetches live sports data from Cloudflare Functions API
 * Updates DOM with real scores, win probabilities, and game states
 * Auto-refreshes every 30 seconds
 *
 * @author Blaze Sports Intel
 * @version 3.0.0 - Championship Edition
 */

class LiveGamesIntegration {
  constructor() {
    this.apiEndpoint = '/api/live-games';
    this.refreshInterval = 30000; // 30 seconds
    this.retryDelay = 5000; // 5 seconds on error
    this.maxRetries = 3;
    this.retryCount = 0;
    this.intervalId = null;
    this.isUpdating = false;
  }

  /**
   * Initialize the live games integration
   */
  async init() {
    console.log('🔥 Blaze Intelligence: Initializing live games integration...');

    // Initial fetch
    await this.fetchAndUpdate();

    // Set up auto-refresh
    this.startAutoRefresh();

    // Handle visibility change (pause when tab not active)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.stopAutoRefresh();
      } else {
        this.startAutoRefresh();
        this.fetchAndUpdate(); // Immediate refresh when tab becomes active
      }
    });
  }

  /**
   * Fetch live games data from API
   */
  async fetchLiveGames() {
    try {
      const response = await fetch(this.apiEndpoint, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });

      if (!response.ok) {
        throw new Error(`API returned ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'API returned unsuccessful response');
      }

      this.retryCount = 0; // Reset retry counter on success
      return data;
    } catch (error) {
      console.error('❌ Failed to fetch live games:', error);
      throw error;
    }
  }

  /**
   * Fetch and update the UI
   */
  async fetchAndUpdate() {
    if (this.isUpdating) {
      console.log('⏳ Update already in progress, skipping...');
      return;
    }

    this.isUpdating = true;

    try {
      const data = await this.fetchLiveGames();

      console.log(`✅ Fetched ${data.count} live games from ${data.meta.dataSource}`);

      if (data.games && data.games.length > 0) {
        this.updateUI(data.games, data.meta);
        this.updateStatusAnnouncer(`${data.count} live games updated`);
      } else {
        this.showNoLiveGames();
      }
    } catch (error) {
      this.retryCount++;

      if (this.retryCount <= this.maxRetries) {
        console.log(`🔄 Retrying in ${this.retryDelay / 1000}s (attempt ${this.retryCount}/${this.maxRetries})...`);
        setTimeout(() => this.fetchAndUpdate(), this.retryDelay);
      } else {
        console.error('❌ Max retries reached. Showing error state.');
        this.showErrorState(error);
      }
    } finally {
      this.isUpdating = false;
    }
  }

  /**
   * Update the UI with live games data
   */
  updateUI(games, meta) {
    const section = document.querySelector('.live-games-section');
    if (!section) {
      console.error('❌ Live games section not found in DOM');
      return;
    }

    // Update header with game count
    const header = section.querySelector('h2');
    if (header) {
      const count = games.length;
      const gameText = count === 1 ? 'Game' : 'Games';
      header.innerHTML = `
        <span style="display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; background: linear-gradient(135deg, #FF2D55 0%, #FF4066 100%); color: white; font-size: 0.75rem; font-weight: 700; letter-spacing: 0.05em; border-radius: 999px; box-shadow: 0 0 12px rgba(255,45,85,0.4);">
          <span style="width: 8px; height: 8px; background: white; border-radius: 50%; animation: blink 1s ease-in-out infinite;" aria-hidden="true"></span>
          LIVE
        </span>
        ${count} ${gameText} In Progress
      `;
    }

    // Update games grid
    const gamesGrid = section.querySelector('[role="list"]');
    if (!gamesGrid) {
      console.error('❌ Games grid not found in DOM');
      return;
    }

    // Clear existing games
    gamesGrid.innerHTML = '';

    // Render new games (limit to first 3 for performance)
    games.slice(0, 3).forEach(game => {
      const gameCard = this.createGameCard(game);
      gamesGrid.appendChild(gameCard);
    });

    // Update last updated timestamp (add if doesn't exist)
    let timestamp = section.querySelector('.last-updated');
    if (!timestamp) {
      timestamp = document.createElement('div');
      timestamp.className = 'last-updated';
      timestamp.style.cssText = 'text-align: center; font-size: 0.75rem; color: rgba(255,255,255,0.45); margin-top: 1rem;';
      section.querySelector('div[style*="max-width"]').appendChild(timestamp);
    }

    const updateTime = new Date(meta.lastUpdated).toLocaleTimeString('en-US', {
      timeZone: 'America/Chicago',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit'
    });
    timestamp.innerHTML = `
      <span aria-live="polite">Last updated: ${updateTime} CT</span> •
      <span>Data: ${meta.dataSource}</span>
    `;
  }

  /**
   * Create a game card element
   */
  createGameCard(game) {
    const article = document.createElement('article');
    article.style.cssText = 'background: rgba(255,255,255,0.05); backdrop-filter: blur(16px); border: 2px solid #FF2D55; border-radius: 12px; padding: 1rem; box-shadow: 0 0 24px rgba(255,45,85,0.4); position: relative; animation: live-pulse 2s ease-in-out infinite;';
    article.setAttribute('role', 'listitem');
    article.setAttribute('aria-label', `Live game: ${game.awayTeam.name} ${game.awayTeam.score}, ${game.homeTeam.name} ${game.homeTeam.score}`);

    // Determine winning team for color coding
    const awayWinning = game.awayTeam.score > game.homeTeam.score;
    const homeWinning = game.homeTeam.score > game.awayTeam.score;

    // Format status text based on league
    let statusText = game.status.shortDetail || game.status.detail;
    if (game.league === 'MLB') {
      statusText = game.status.detail; // "Bot 7th", "Top 5th", etc.
    } else if (game.league === 'NFL' || game.league === 'NBA') {
      const period = game.status.period;
      const clock = game.status.clock;
      const periodName = game.league === 'NFL' ? `Q${period}` : `${period}${this.getOrdinalSuffix(period)}`;
      statusText = `${periodName} ${clock}`;
    }

    article.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
        <span style="font-size: 0.75rem; font-weight: 600; font-family: 'Bebas Neue', sans-serif; color: #FF2D55;">${game.league}</span>
        <time style="font-size: 0.875rem; font-weight: 600; font-family: 'Bebas Neue', sans-serif; color: #FF2D55;">${this.escapeHtml(statusText)}</time>
      </div>

      <!-- Away Team -->
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
        <div>
          <div style="font-size: clamp(1rem, 2vw, 1.125rem); font-weight: 600; color: #FFFFFF;">${this.escapeHtml(game.awayTeam.name)}</div>
          <div style="font-size: 0.75rem; color: rgba(255,255,255,0.65); font-variant-numeric: tabular-nums;">${this.escapeHtml(game.awayTeam.record)} • ${this.escapeHtml(this.getConferenceName(game.awayTeam.conference, game.league))}</div>
        </div>
        <div style="font-size: clamp(2rem, 4vw, 2.5rem); font-weight: 900; font-family: 'Bebas Neue', sans-serif; color: ${awayWinning ? '#00FF88' : 'rgba(255,255,255,0.87)'}; ${awayWinning ? 'text-shadow: 0 0 12px rgba(0,255,136,0.3);' : ''} line-height: 1; font-variant-numeric: tabular-nums;">${game.awayTeam.score}</div>
      </div>

      <!-- Home Team -->
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 0;">
        <div>
          <div style="font-size: clamp(1rem, 2vw, 1.125rem); font-weight: 600; color: #FFFFFF;">${this.escapeHtml(game.homeTeam.name)}</div>
          <div style="font-size: 0.75rem; color: rgba(255,255,255,0.65); font-variant-numeric: tabular-nums;">${this.escapeHtml(game.homeTeam.record)} • ${this.escapeHtml(this.getConferenceName(game.homeTeam.conference, game.league))}</div>
        </div>
        <div style="font-size: clamp(2rem, 4vw, 2.5rem); font-weight: 900; font-family: 'Bebas Neue', sans-serif; color: ${homeWinning ? '#00FF88' : 'rgba(255,255,255,0.87)'}; ${homeWinning ? 'text-shadow: 0 0 12px rgba(0,255,136,0.3);' : ''} line-height: 1; font-variant-numeric: tabular-nums;">${game.homeTeam.score}</div>
      </div>

      ${game.winProbability ? this.createWinProbabilityHTML(game.winProbability) : ''}

      ${game.broadcast ? `<div style="margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid rgba(255,255,255,0.1); font-size: 0.75rem; color: rgba(255,255,255,0.45);">📺 ${this.escapeHtml(game.broadcast)}</div>` : ''}
    `;

    return article;
  }

  /**
   * Create win probability HTML
   */
  createWinProbabilityHTML(winProb) {
    const percentage = winProb.percentage;
    const team = winProb.team;

    // Color based on probability
    const color = percentage >= 70 ? '#00FF88' : (percentage >= 50 ? '#FFB800' : '#FF6B6B');

    return `
      <div style="margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid rgba(255,255,255,0.1);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
          <span style="font-size: 0.7rem; color: rgba(255,255,255,0.65); text-transform: uppercase; letter-spacing: 0.05em;">${this.escapeHtml(team)} Win Probability</span>
          <span style="font-size: 1.25rem; font-weight: 700; font-family: 'Bebas Neue', sans-serif; color: ${color}; font-variant-numeric: tabular-nums; ${percentage >= 70 ? 'text-shadow: 0 0 12px ' + color + ';' : ''}">${percentage}%</span>
        </div>
        <div style="height: 6px; background: rgba(255,255,255,0.1); border-radius: 999px; overflow: hidden;">
          <div style="width: ${percentage}%; height: 100%; background: linear-gradient(90deg, ${color} 0%, ${color}dd 100%); box-shadow: 0 0 12px ${color}; border-radius: 999px; transition: width 0.5s ease;"></div>
        </div>
      </div>
    `;
  }

  /**
   * Show "no live games" state
   */
  showNoLiveGames() {
    const section = document.querySelector('.live-games-section');
    if (!section) return;

    const gamesGrid = section.querySelector('[role="list"]');
    if (!gamesGrid) return;

    gamesGrid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 3rem 1rem; color: rgba(255,255,255,0.65);">
        <div style="font-size: 3rem; margin-bottom: 1rem;">🏆</div>
        <h3 style="font-family: 'Bebas Neue', sans-serif; font-size: 1.5rem; color: rgba(255,255,255,0.87); margin-bottom: 0.5rem;">No Live Games</h3>
        <p>Check back soon for live scores and real-time updates</p>
        <p style="font-size: 0.875rem; margin-top: 1rem;">Next check in 30 seconds...</p>
      </div>
    `;
  }

  /**
   * Show error state
   */
  showErrorState(error) {
    const section = document.querySelector('.live-games-section');
    if (!section) return;

    const gamesGrid = section.querySelector('[role="list"]');
    if (!gamesGrid) return;

    gamesGrid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 3rem 1rem; color: rgba(255,255,255,0.65);">
        <div style="font-size: 3rem; margin-bottom: 1rem;">⚠️</div>
        <h3 style="font-family: 'Bebas Neue', sans-serif; font-size: 1.5rem; color: #FF6B6B; margin-bottom: 0.5rem;">Unable to Load Live Games</h3>
        <p style="margin-bottom: 1rem;">We're experiencing issues fetching live data</p>
        <button onclick="window.liveGamesIntegration.fetchAndUpdate()" style="padding: 0.75rem 1.5rem; background: linear-gradient(135deg, #D96200 0%, #BF5700 100%); color: white; border: none; border-radius: 8px; font-family: 'Bebas Neue', sans-serif; font-size: 1rem; cursor: pointer; letter-spacing: 0.05em;">
          Retry Now
        </button>
        <p style="font-size: 0.75rem; margin-top: 1rem; color: rgba(255,255,255,0.45);">Auto-retry in 30 seconds...</p>
      </div>
    `;

    this.updateStatusAnnouncer('Error loading live games', true);
  }

  /**
   * Update ARIA live region for screen readers
   */
  updateStatusAnnouncer(message, isAlert = false) {
    const regionId = isAlert ? 'alert-announcer' : 'status-announcer';
    const region = document.getElementById(regionId);
    if (region) {
      region.textContent = message;
    }
  }

  /**
   * Start auto-refresh timer
   */
  startAutoRefresh() {
    if (this.intervalId) {
      console.log('⏸️ Auto-refresh already running');
      return;
    }

    console.log(`🔄 Starting auto-refresh (every ${this.refreshInterval / 1000}s)`);
    this.intervalId = setInterval(() => {
      this.fetchAndUpdate();
    }, this.refreshInterval);
  }

  /**
   * Stop auto-refresh timer
   */
  stopAutoRefresh() {
    if (this.intervalId) {
      console.log('⏸️ Stopping auto-refresh');
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Utility: Get ordinal suffix for numbers (1st, 2nd, 3rd, 4th)
   */
  getOrdinalSuffix(num) {
    const j = num % 10;
    const k = num % 100;
    if (j === 1 && k !== 11) return num + 'st';
    if (j === 2 && k !== 12) return num + 'nd';
    if (j === 3 && k !== 13) return num + 'rd';
    return num + 'th';
  }

  /**
   * Utility: Get conference/division name
   */
  getConferenceName(conferenceId, league) {
    // Simplified conference mapping
    const conferences = {
      'NFL': {
        '1': 'AFC East', '2': 'AFC North', '3': 'AFC South', '4': 'AFC West',
        '5': 'NFC East', '6': 'NFC North', '7': 'NFC South', '8': 'NFC West'
      },
      'NBA': {
        'Atlantic': 'Atlantic', 'Central': 'Central', 'Southeast': 'Southeast',
        'Northwest': 'Northwest', 'Pacific': 'Pacific', 'Southwest': 'Southwest'
      },
      'MLB': {
        'AL East': 'AL East', 'AL Central': 'AL Central', 'AL West': 'AL West',
        'NL East': 'NL East', 'NL Central': 'NL Central', 'NL West': 'NL West'
      }
    };

    return conferences[league]?.[conferenceId] || conferenceId || 'Unknown';
  }

  /**
   * Utility: Escape HTML to prevent XSS
   */
  escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.liveGamesIntegration = new LiveGamesIntegration();
    window.liveGamesIntegration.init();
  });
} else {
  // DOM already loaded
  window.liveGamesIntegration = new LiveGamesIntegration();
  window.liveGamesIntegration.init();
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LiveGamesIntegration;
}
