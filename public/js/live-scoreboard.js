/**
 * Live Scoreboard Widget
 * Real-time college baseball scores with auto-refresh
 *
 * @author Blaze Sports Intel
 * @version 1.0.0
 */

class LiveScoreboard {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    this.options = {
      refreshInterval: 60000, // 1 minute
      maxGames: 10,
      conference: options.conference || 'all',
      showCompleted: options.showCompleted !== false,
      ...options
    };
    this.refreshTimer = null;
    this.games = [];
  }

  async init() {
    if (!this.container) {
      console.error('[BSI Scoreboard] Container not found');
      return;
    }

    this.renderSkeleton();
    await this.fetchGames();
    this.startAutoRefresh();
  }

  renderSkeleton() {
    this.container.innerHTML = `
      <div class="scoreboard-header flex justify-between items-center mb-4">
        <h3 class="text-lg font-bold text-white">Live Scores</h3>
        <div class="flex items-center gap-2">
          <span class="live-indicator w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          <span class="text-xs text-gray-400" id="scoreboard-timestamp">Loading...</span>
        </div>
      </div>
      <div class="scoreboard-games space-y-2" id="scoreboard-games">
        ${this.renderLoadingState()}
      </div>
    `;
  }

  renderLoadingState() {
    return Array(3).fill(0).map(() => `
      <div class="game-card bg-gray-800/50 rounded-lg p-3 animate-pulse">
        <div class="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
        <div class="h-4 bg-gray-700 rounded w-1/2"></div>
      </div>
    `).join('');
  }

  async fetchGames() {
    try {
      const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
      const url = `https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball/scoreboard?dates=${date}`;

      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();
      this.games = this.transformGames(data.events || []);
      this.render();

    } catch (error) {
      console.error('[BSI Scoreboard] Fetch error:', error);
      this.renderError();
    }
  }

  transformGames(events) {
    return events
      .map(event => {
        const competition = event.competitions?.[0];
        if (!competition) return null;

        const home = competition.competitors?.find(c => c.homeAway === 'home');
        const away = competition.competitors?.find(c => c.homeAway === 'away');
        const status = competition.status;

        return {
          id: event.id,
          name: event.name,
          shortName: event.shortName,
          status: {
            type: status?.type?.name,
            detail: status?.type?.detail,
            inning: status?.period,
            displayClock: status?.displayClock
          },
          home: {
            name: home?.team?.shortDisplayName || home?.team?.displayName,
            abbreviation: home?.team?.abbreviation,
            score: parseInt(home?.score) || 0,
            logo: home?.team?.logos?.[0]?.href,
            ranking: home?.curatedRank?.current,
            winner: home?.winner
          },
          away: {
            name: away?.team?.shortDisplayName || away?.team?.displayName,
            abbreviation: away?.team?.abbreviation,
            score: parseInt(away?.score) || 0,
            logo: away?.team?.logos?.[0]?.href,
            ranking: away?.curatedRank?.current,
            winner: away?.winner
          },
          venue: competition.venue?.fullName,
          broadcast: competition.broadcasts?.[0]?.names?.[0],
          startTime: new Date(event.date)
        };
      })
      .filter(Boolean)
      .slice(0, this.options.maxGames);
  }

  render() {
    const gamesContainer = document.getElementById('scoreboard-games');
    const timestamp = document.getElementById('scoreboard-timestamp');

    if (timestamp) {
      timestamp.textContent = new Date().toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        timeZone: 'America/Chicago'
      }) + ' CT';
    }

    if (!this.games.length) {
      gamesContainer.innerHTML = `
        <div class="text-center py-8 text-gray-400">
          <p>No games scheduled today</p>
          <p class="text-sm mt-2">Check back during the 2026 season (Feb 14 - June)</p>
        </div>
      `;
      return;
    }

    gamesContainer.innerHTML = this.games.map(game => this.renderGame(game)).join('');
  }

  renderGame(game) {
    const isLive = game.status.type === 'STATUS_IN_PROGRESS';
    const isFinal = game.status.type === 'STATUS_FINAL';
    const isScheduled = game.status.type === 'STATUS_SCHEDULED';

    let statusBadge = '';
    if (isLive) {
      statusBadge = `
        <span class="px-2 py-0.5 bg-red-600 text-white text-xs font-bold rounded animate-pulse">
          LIVE - ${game.status.inning ? `${game.status.inning}${this.getOrdinal(game.status.inning)}` : ''}
        </span>
      `;
    } else if (isFinal) {
      statusBadge = `<span class="px-2 py-0.5 bg-gray-600 text-white text-xs rounded">FINAL</span>`;
    } else if (isScheduled) {
      statusBadge = `
        <span class="px-2 py-0.5 bg-blue-600 text-white text-xs rounded">
          ${game.startTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
        </span>
      `;
    }

    return `
      <div class="game-card bg-gray-800/80 rounded-lg p-3 hover:bg-gray-800 transition-colors ${isLive ? 'border border-red-500/50' : ''}">
        <div class="flex justify-between items-center mb-2">
          <span class="text-xs text-gray-400">${game.venue || ''}</span>
          ${statusBadge}
        </div>

        <div class="team-row flex justify-between items-center py-1 ${game.away.winner ? 'font-bold' : ''}">
          <div class="flex items-center gap-2">
            ${game.away.logo ? `<img src="${game.away.logo}" class="w-5 h-5" alt="">` : ''}
            <span class="text-white">
              ${game.away.ranking ? `<span class="text-xs text-amber-400">#${game.away.ranking}</span> ` : ''}
              ${game.away.name}
            </span>
          </div>
          <span class="text-white font-mono ${game.away.winner ? 'text-green-400' : ''}">${isScheduled ? '-' : game.away.score}</span>
        </div>

        <div class="team-row flex justify-between items-center py-1 ${game.home.winner ? 'font-bold' : ''}">
          <div class="flex items-center gap-2">
            ${game.home.logo ? `<img src="${game.home.logo}" class="w-5 h-5" alt="">` : ''}
            <span class="text-white">
              ${game.home.ranking ? `<span class="text-xs text-amber-400">#${game.home.ranking}</span> ` : ''}
              ${game.home.name}
            </span>
          </div>
          <span class="text-white font-mono ${game.home.winner ? 'text-green-400' : ''}">${isScheduled ? '-' : game.home.score}</span>
        </div>

        ${game.broadcast ? `<div class="text-xs text-gray-500 mt-2">📺 ${game.broadcast}</div>` : ''}
      </div>
    `;
  }

  getOrdinal(n) {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return s[(v - 20) % 10] || s[v] || s[0];
  }

  renderError() {
    const gamesContainer = document.getElementById('scoreboard-games');
    if (gamesContainer) {
      gamesContainer.innerHTML = `
        <div class="text-center py-6 text-red-400">
          <p>Unable to load scores</p>
          <button onclick="window.liveScoreboard?.fetchGames()" class="mt-2 text-sm text-amber-400 hover:underline">
            Try again
          </button>
        </div>
      `;
    }
  }

  startAutoRefresh() {
    if (this.refreshTimer) clearInterval(this.refreshTimer);
    this.refreshTimer = setInterval(() => this.fetchGames(), this.options.refreshInterval);
  }

  stopAutoRefresh() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  destroy() {
    this.stopAutoRefresh();
    if (this.container) {
      this.container.innerHTML = '';
    }
  }
}

// Conference standings widget
class ConferenceStandings {
  constructor(containerId, conference) {
    this.container = document.getElementById(containerId);
    this.conference = conference;
  }

  async init() {
    if (!this.container) return;

    try {
      const response = await fetch(`/api/college-baseball/standings?conference=${this.conference}`);
      const data = await response.json();

      if (data.success) {
        this.render(data.data);
      }
    } catch (error) {
      console.error('[BSI Standings] Error:', error);
    }
  }

  render(standings) {
    if (!standings?.length) {
      this.container.innerHTML = '<p class="text-gray-400">No standings available</p>';
      return;
    }

    this.container.innerHTML = `
      <table class="w-full text-sm">
        <thead>
          <tr class="text-gray-400 border-b border-gray-700">
            <th class="text-left py-2">Team</th>
            <th class="text-center py-2">Conf</th>
            <th class="text-center py-2">Overall</th>
            <th class="text-center py-2">RPI</th>
          </tr>
        </thead>
        <tbody>
          ${standings.map((team, i) => `
            <tr class="border-b border-gray-800 hover:bg-gray-800/50">
              <td class="py-2">
                <div class="flex items-center gap-2">
                  <span class="text-gray-500 w-4">${i + 1}</span>
                  <span class="text-white">${team.name}</span>
                </div>
              </td>
              <td class="text-center text-gray-300">${team.confRecord || '--'}</td>
              <td class="text-center text-gray-300">${team.record || '--'}</td>
              <td class="text-center text-amber-400">${team.rpi || '--'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }
}

// Export globally
window.LiveScoreboard = LiveScoreboard;
window.ConferenceStandings = ConferenceStandings;
