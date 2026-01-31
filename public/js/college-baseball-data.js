/**
 * College Baseball Live Data Service
 * Client-side API integration for team pages
 *
 * Data Sources:
 * - ESPN API (live scores, standings)
 * - NCAA Stats (official statistics)
 * - D1Baseball (rankings, RPI)
 *
 * @author Blaze Sports Intel
 * @version 2.0.0
 * @license MIT
 */

const CollegeBaseballAPI = {
  baseUrl: '/api/college-baseball',
  espnBaseUrl: 'https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball',
  cachePrefix: 'bsi-cbb-',
  cacheTTL: 300000, // 5 minutes

  /**
   * Fetch with caching and error handling
   */
  async fetchWithCache(url, cacheKey, ttl = this.cacheTTL) {
    const cached = localStorage.getItem(this.cachePrefix + cacheKey);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < ttl) {
        return { data, cached: true };
      }
    }

    try {
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'BlazeSportsIntel/2.0'
        }
      });

      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }

      const data = await response.json();

      localStorage.setItem(this.cachePrefix + cacheKey, JSON.stringify({
        data,
        timestamp: Date.now()
      }));

      return { data, cached: false };
    } catch (error) {
      console.error(`[BSI] API Error: ${error.message}`);

      // Return stale cache if available
      if (cached) {
        const { data } = JSON.parse(cached);
        return { data, cached: true, stale: true };
      }

      throw error;
    }
  },

  /**
   * Get team data by ESPN ID
   */
  async getTeam(espnId) {
    const url = `${this.espnBaseUrl}/teams/${espnId}`;
    return this.fetchWithCache(url, `team-${espnId}`);
  },

  /**
   * Get team schedule
   */
  async getTeamSchedule(espnId) {
    const url = `${this.espnBaseUrl}/teams/${espnId}/schedule`;
    return this.fetchWithCache(url, `schedule-${espnId}`, 600000); // 10 min cache
  },

  /**
   * Get team roster
   */
  async getTeamRoster(espnId) {
    const url = `${this.espnBaseUrl}/teams/${espnId}/roster`;
    return this.fetchWithCache(url, `roster-${espnId}`, 3600000); // 1 hour cache
  },

  /**
   * Get live scoreboard
   */
  async getScoreboard(date = null) {
    const dateParam = date || new Date().toISOString().split('T')[0].replace(/-/g, '');
    const url = `${this.espnBaseUrl}/scoreboard?dates=${dateParam}`;
    return this.fetchWithCache(url, `scoreboard-${dateParam}`, 60000); // 1 min cache for live
  },

  /**
   * Get conference standings
   */
  async getStandings(conference = 'all') {
    const url = `${this.baseUrl}/standings?conference=${conference}`;
    return this.fetchWithCache(url, `standings-${conference}`);
  },

  /**
   * Get D1 rankings (AP, Coaches, RPI)
   */
  async getRankings(type = 'd1baseball') {
    const url = `${this.baseUrl}/rankings?type=${type}`;
    return this.fetchWithCache(url, `rankings-${type}`, 1800000); // 30 min cache
  },

  /**
   * Get player stats
   */
  async getPlayerStats(playerId) {
    const url = `${this.baseUrl}/players/${playerId}/stats`;
    return this.fetchWithCache(url, `player-${playerId}`, 3600000);
  },

  /**
   * Get game boxscore
   */
  async getBoxscore(gameId) {
    const url = `${this.espnBaseUrl}/summary?event=${gameId}`;
    return this.fetchWithCache(url, `boxscore-${gameId}`, 60000);
  },

  /**
   * Format timestamp to America/Chicago timezone
   */
  formatTimestamp(date = new Date()) {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Chicago',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).format(date);
  },

  /**
   * Get season status
   */
  getSeasonStatus() {
    const now = new Date();
    const year = now.getFullYear();
    const seasonStart = new Date(year, 1, 14); // Feb 14
    const seasonEnd = new Date(year, 5, 30); // June 30

    if (now < seasonStart) {
      return {
        status: 'preseason',
        message: `2026 Season opens Feb 14`,
        daysUntil: Math.ceil((seasonStart - now) / (1000 * 60 * 60 * 24))
      };
    } else if (now > seasonEnd) {
      return {
        status: 'offseason',
        message: 'Season complete',
        nextSeason: year + 1
      };
    } else {
      return {
        status: 'active',
        message: 'Season in progress',
        week: Math.ceil((now - seasonStart) / (1000 * 60 * 60 * 24 * 7))
      };
    }
  }
};

/**
 * Team Page Data Loader
 * Automatically loads data for team pages
 */
class TeamPageLoader {
  constructor(espnId, teamSlug) {
    this.espnId = espnId;
    this.teamSlug = teamSlug;
    this.api = CollegeBaseballAPI;
  }

  async loadAll() {
    const results = await Promise.allSettled([
      this.loadTeamInfo(),
      this.loadSchedule(),
      this.loadRoster(),
      this.loadStandings()
    ]);

    return {
      team: results[0].status === 'fulfilled' ? results[0].value : null,
      schedule: results[1].status === 'fulfilled' ? results[1].value : null,
      roster: results[2].status === 'fulfilled' ? results[2].value : null,
      standings: results[3].status === 'fulfilled' ? results[3].value : null,
      timestamp: this.api.formatTimestamp(),
      seasonStatus: this.api.getSeasonStatus()
    };
  }

  async loadTeamInfo() {
    const { data } = await this.api.getTeam(this.espnId);
    return this.transformTeamData(data);
  }

  async loadSchedule() {
    const { data } = await this.api.getTeamSchedule(this.espnId);
    return this.transformScheduleData(data);
  }

  async loadRoster() {
    const { data } = await this.api.getTeamRoster(this.espnId);
    return this.transformRosterData(data);
  }

  async loadStandings() {
    const { data } = await this.api.getStandings();
    return data;
  }

  transformTeamData(data) {
    if (!data?.team) return null;
    const team = data.team;
    return {
      id: team.id,
      name: team.displayName,
      abbreviation: team.abbreviation,
      nickname: team.nickname,
      location: team.location,
      logo: team.logos?.[0]?.href,
      color: team.color,
      alternateColor: team.alternateColor,
      record: team.record?.items?.[0]?.summary || '0-0',
      conferenceRecord: team.record?.items?.[1]?.summary || '0-0',
      ranking: team.rank || null,
      conference: team.groups?.parent?.name || 'Unknown'
    };
  }

  transformScheduleData(data) {
    if (!data?.events) return [];
    return data.events.map(event => {
      const competition = event.competitions?.[0];
      const homeTeam = competition?.competitors?.find(c => c.homeAway === 'home');
      const awayTeam = competition?.competitors?.find(c => c.homeAway === 'away');

      return {
        id: event.id,
        date: event.date,
        name: event.name,
        status: competition?.status?.type?.name,
        home: {
          id: homeTeam?.id,
          name: homeTeam?.team?.displayName,
          score: homeTeam?.score,
          logo: homeTeam?.team?.logos?.[0]?.href
        },
        away: {
          id: awayTeam?.id,
          name: awayTeam?.team?.displayName,
          score: awayTeam?.score,
          logo: awayTeam?.team?.logos?.[0]?.href
        },
        venue: competition?.venue?.fullName,
        broadcast: competition?.broadcasts?.[0]?.names?.[0]
      };
    });
  }

  transformRosterData(data) {
    if (!data?.athletes) return [];
    return data.athletes.map(athlete => ({
      id: athlete.id,
      name: athlete.displayName,
      jersey: athlete.jersey,
      position: athlete.position?.abbreviation,
      height: athlete.displayHeight,
      weight: athlete.displayWeight,
      year: athlete.experience?.displayValue,
      hometown: athlete.birthPlace?.city && athlete.birthPlace?.state
        ? `${athlete.birthPlace.city}, ${athlete.birthPlace.state}`
        : null
    }));
  }
}

/**
 * UI Update Helpers
 */
const TeamPageUI = {
  updateRecord(record, confRecord) {
    const recordEl = document.getElementById('team-record');
    const confEl = document.getElementById('team-conf-record');
    if (recordEl) recordEl.textContent = record || '--';
    if (confEl) confEl.textContent = confRecord || '--';
  },

  updateRanking(ranking) {
    const rankEl = document.getElementById('team-ranking');
    if (rankEl) {
      if (ranking) {
        rankEl.textContent = `#${ranking}`;
        rankEl.classList.remove('hidden');
      } else {
        rankEl.classList.add('hidden');
      }
    }
  },

  updateScheduleTable(games) {
    const tbody = document.getElementById('schedule-body');
    if (!tbody || !games?.length) return;

    tbody.innerHTML = games.slice(0, 20).map(game => {
      const dateStr = new Date(game.date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
      const isCompleted = game.status === 'STATUS_FINAL';
      const isLive = game.status === 'STATUS_IN_PROGRESS';

      return `
        <tr class="${isLive ? 'bg-amber-900/20' : ''}">
          <td class="px-4 py-3">${dateStr}</td>
          <td class="px-4 py-3">
            <div class="flex items-center gap-2">
              ${game.away.logo ? `<img src="${game.away.logo}" class="w-6 h-6" alt="">` : ''}
              <span>${game.away.name || 'TBD'}</span>
            </div>
          </td>
          <td class="px-4 py-3 text-center">
            ${isCompleted ? `${game.away.score}-${game.home.score}` :
              isLive ? `<span class="text-amber-400 animate-pulse">LIVE</span>` :
              new Date(game.date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
          </td>
          <td class="px-4 py-3">${game.venue || 'TBD'}</td>
        </tr>
      `;
    }).join('');
  },

  updateRosterTable(players) {
    const tbody = document.getElementById('roster-body');
    if (!tbody || !players?.length) return;

    tbody.innerHTML = players.map(player => `
      <tr>
        <td class="px-4 py-3">#${player.jersey || '--'}</td>
        <td class="px-4 py-3 font-medium">${player.name}</td>
        <td class="px-4 py-3">${player.position || '--'}</td>
        <td class="px-4 py-3">${player.year || '--'}</td>
        <td class="px-4 py-3">${player.height || '--'}</td>
        <td class="px-4 py-3">${player.hometown || '--'}</td>
      </tr>
    `).join('');
  },

  updateDataTimestamp(timestamp) {
    const el = document.getElementById('data-timestamp');
    if (el) {
      el.textContent = `Last updated: ${timestamp}`;
    }
  },

  showLoading(show = true) {
    const loader = document.getElementById('data-loader');
    if (loader) {
      loader.classList.toggle('hidden', !show);
    }
  },

  showError(message) {
    const errorEl = document.getElementById('data-error');
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.classList.remove('hidden');
    }
  }
};

/**
 * Initialize team page with live data
 * Call this from each team page with the ESPN ID
 */
async function initTeamPage(espnId, teamSlug) {
  TeamPageUI.showLoading(true);

  try {
    const loader = new TeamPageLoader(espnId, teamSlug);
    const data = await loader.loadAll();

    if (data.team) {
      TeamPageUI.updateRecord(data.team.record, data.team.conferenceRecord);
      TeamPageUI.updateRanking(data.team.ranking);
    }

    if (data.schedule) {
      TeamPageUI.updateScheduleTable(data.schedule);
    }

    if (data.roster) {
      TeamPageUI.updateRosterTable(data.roster);
    }

    TeamPageUI.updateDataTimestamp(data.timestamp);
    TeamPageUI.showLoading(false);

    // Log season status
    console.log('[BSI] Season Status:', data.seasonStatus);

    return data;
  } catch (error) {
    console.error('[BSI] Failed to load team data:', error);
    TeamPageUI.showLoading(false);
    TeamPageUI.showError('Unable to load live data. Showing cached information.');
    return null;
  }
}

/**
 * Auto-initialize team page from URL
 * Extracts team slug from URL and initializes with correct ESPN ID
 */
async function autoInitTeamPage() {
  // Get team slug from URL
  const path = window.location.pathname;
  const match = path.match(/\/college-baseball\/teams\/([^\/\.]+)/);
  if (!match) return null;

  const slug = match[1];

  // Get ESPN ID from mapping (requires team-espn-ids.js to be loaded first)
  if (typeof getTeamESPNId !== 'function') {
    console.warn('[BSI] team-espn-ids.js not loaded');
    return null;
  }

  const espnId = getTeamESPNId(slug);
  if (!espnId) {
    console.warn('[BSI] No ESPN ID found for team:', slug);
    return null;
  }

  return initTeamPage(espnId, slug);
}

// Export for use in team pages
window.CollegeBaseballAPI = CollegeBaseballAPI;
window.TeamPageLoader = TeamPageLoader;
window.TeamPageUI = TeamPageUI;
window.initTeamPage = initTeamPage;
window.autoInitTeamPage = autoInitTeamPage;
