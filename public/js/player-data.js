/**
 * Blaze Sports Intel | Player Data Utilities
 *
 * Handles player data fetching from ESPN API and BSI endpoints
 * @author Blaze Sports Intel
 * @version 1.0.0
 */

const PlayerAPI = {
  /**
   * Get list of players with optional filters
   * @param {Object} options - Filter options
   * @param {string} options.team - Team slug filter
   * @param {string} options.conference - Conference filter (SEC, BIG12, ACC, etc.)
   * @param {number} options.limit - Max results (default: 100)
   */
  async getPlayers(options = {}) {
    const params = new URLSearchParams();
    if (options.team) params.set('team', options.team);
    if (options.conference) params.set('conference', options.conference);
    if (options.limit) params.set('limit', options.limit);

    const cacheKey = `bsi_players_${params.toString() || 'all'}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const response = await fetch(`/api/college-baseball/players?${params}`);
      if (!response.ok) throw new Error('Failed to fetch players');

      const players = await response.json();
      this.setCache(cacheKey, players, 30 * 60 * 1000); // 30 min cache
      return players;
    } catch (error) {
      console.error('[PlayerAPI] Error fetching players:', error);
      return [];
    }
  },

  /**
   * Get single player details from ESPN
   * @param {string} playerId - ESPN player ID
   */
  async getPlayer(playerId) {
    const cacheKey = `bsi_player_${playerId}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const response = await fetch(
        `https://site.api.espn.com/apis/common/v3/sports/baseball/college-baseball/athletes/${playerId}`
      );

      if (!response.ok) {
        // Try alternate endpoint
        const altResponse = await fetch(
          `https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball/athletes/${playerId}`
        );
        if (!altResponse.ok) throw new Error('Player not found');
        const data = await altResponse.json();
        this.setCache(cacheKey, data, 15 * 60 * 1000);
        return data;
      }

      const data = await response.json();
      this.setCache(cacheKey, data, 15 * 60 * 1000);
      return data;
    } catch (error) {
      console.error(`[PlayerAPI] Error fetching player ${playerId}:`, error);
      return null;
    }
  },

  /**
   * Get player statistics
   * @param {string} playerId - ESPN player ID
   * @param {string} season - Season year (default: current)
   */
  async getPlayerStats(playerId, season = '2025') {
    const cacheKey = `bsi_player_stats_${playerId}_${season}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const response = await fetch(
        `https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball/athletes/${playerId}/statistics`
      );

      if (!response.ok) return null;

      const data = await response.json();
      this.setCache(cacheKey, data, 60 * 60 * 1000); // 1 hour cache
      return data;
    } catch (error) {
      console.error(`[PlayerAPI] Error fetching stats for ${playerId}:`, error);
      return null;
    }
  },

  /**
   * Get player game log
   * @param {string} playerId - ESPN player ID
   */
  async getPlayerGameLog(playerId) {
    const cacheKey = `bsi_player_gamelog_${playerId}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const response = await fetch(
        `https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball/athletes/${playerId}/gamelog`
      );

      if (!response.ok) return null;

      const data = await response.json();
      this.setCache(cacheKey, data, 30 * 60 * 1000);
      return data;
    } catch (error) {
      console.error(`[PlayerAPI] Error fetching game log for ${playerId}:`, error);
      return null;
    }
  },

  /**
   * Search players by name
   * @param {string} query - Search query
   */
  async searchPlayers(query) {
    if (!query || query.length < 2) return [];

    try {
      // Use ESPN search API
      const response = await fetch(
        `https://site.api.espn.com/apis/common/v3/search?query=${encodeURIComponent(query)}&limit=20&type=player&sport=baseball&league=college-baseball`
      );

      if (!response.ok) return [];

      const data = await response.json();
      return data.items || data.results || [];
    } catch (error) {
      console.error('[PlayerAPI] Search error:', error);
      return [];
    }
  },

  /**
   * Get team roster
   * @param {string} teamId - ESPN team ID
   */
  async getTeamRoster(teamId) {
    const cacheKey = `bsi_roster_${teamId}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const response = await fetch(
        `https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball/teams/${teamId}/roster`
      );

      if (!response.ok) throw new Error('Failed to fetch roster');

      const data = await response.json();
      this.setCache(cacheKey, data, 60 * 60 * 1000); // 1 hour cache
      return data;
    } catch (error) {
      console.error(`[PlayerAPI] Error fetching roster for team ${teamId}:`, error);
      return null;
    }
  },

  // Cache helpers
  getFromCache(key) {
    try {
      const item = localStorage.getItem(key);
      if (!item) return null;

      const { data, expiry } = JSON.parse(item);
      if (Date.now() > expiry) {
        localStorage.removeItem(key);
        return null;
      }
      return data;
    } catch {
      return null;
    }
  },

  setCache(key, data, ttl) {
    try {
      localStorage.setItem(key, JSON.stringify({
        data,
        expiry: Date.now() + ttl
      }));
    } catch (e) {
      // Storage full or unavailable
    }
  },

  /**
   * Format player height from inches to readable format
   */
  formatHeight(inches) {
    if (!inches) return '-';
    const feet = Math.floor(inches / 12);
    const remainingInches = inches % 12;
    return `${feet}'${remainingInches}"`;
  },

  /**
   * Format weight to readable format
   */
  formatWeight(lbs) {
    return lbs ? `${lbs} lbs` : '-';
  },

  /**
   * Get position display name
   */
  getPositionDisplay(position) {
    const positions = {
      'P': 'Pitcher',
      'C': 'Catcher',
      '1B': 'First Base',
      '2B': 'Second Base',
      '3B': 'Third Base',
      'SS': 'Shortstop',
      'LF': 'Left Field',
      'CF': 'Center Field',
      'RF': 'Right Field',
      'DH': 'Designated Hitter',
      'OF': 'Outfield',
      'IF': 'Infield',
      'UT': 'Utility',
      'LHP': 'Left-Handed Pitcher',
      'RHP': 'Right-Handed Pitcher',
      'RP': 'Relief Pitcher',
      'SP': 'Starting Pitcher',
      'CL': 'Closer'
    };
    return positions[position] || position || 'Unknown';
  }
};

// Export for use
window.PlayerAPI = PlayerAPI;
