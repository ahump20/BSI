/**
 * Team Page Auto-Initialization
 * Handles live data loading and scoreboard for all team pages
 *
 * @author Blaze Sports Intel
 * @version 1.0.0
 */

document.addEventListener('DOMContentLoaded', async function() {
  // Check season status
  const seasonStatus = CollegeBaseballAPI.getSeasonStatus();
  console.log('[BSI] Season status:', seasonStatus);

  // Get team slug from URL
  const path = window.location.pathname;
  const match = path.match(/\/college-baseball\/teams\/([^\/\.]+)/);
  const slug = match ? match[1] : null;

  // Initialize live scoreboard (shows on desktop during season)
  const scoreboardSidebar = document.getElementById('scoreboard-sidebar');
  if (scoreboardSidebar && window.innerWidth >= 1400) {
    if (seasonStatus.status === 'active') {
      scoreboardSidebar.style.display = 'block';
      window.liveScoreboard = new LiveScoreboard('live-scoreboard', {
        maxGames: 8,
        refreshInterval: 60000
      });
      window.liveScoreboard.init();
    } else {
      // Show "offseason" message in scoreboard area
      const scoreboardEl = document.getElementById('live-scoreboard');
      if (scoreboardEl) {
        scoreboardEl.innerHTML = `
          <div class="text-center py-4">
            <h3 class="text-lg font-bold text-white mb-2">Live Scores</h3>
            <p class="text-sm text-gray-400">Season opens Feb 14, 2026</p>
            <p class="text-xs text-gray-500 mt-2">${seasonStatus.daysUntil ? `${seasonStatus.daysUntil} days until opening day` : ''}</p>
          </div>
        `;
        scoreboardSidebar.style.display = 'block';
      }
    }
  }

  // Auto-load team data during active season
  if (slug && seasonStatus.status === 'active') {
    try {
      const data = await autoInitTeamPage();
      if (data) {
        console.log('[BSI] Live data loaded for', slug);

        // Update hero stats if elements exist
        updateHeroStats(data);
      }
    } catch (error) {
      console.log('[BSI] Using static data for', slug);
    }
  }

  // Update season banner message
  const seasonBanner = document.querySelector('.season-banner p');
  if (seasonBanner) {
    if (seasonStatus.status === 'active') {
      seasonBanner.innerHTML = `<span class="text-green-400">●</span> Live data active • Week ${seasonStatus.week} of the 2026 season`;
    } else if (seasonStatus.status === 'preseason') {
      seasonBanner.innerHTML = `Data reflects 2025 season results. Live updates begin ${seasonStatus.message}.`;
    } else {
      seasonBanner.innerHTML = `2025 season complete. ${seasonStatus.nextSeason} season preview coming soon.`;
    }
  }

  // Update page timestamp
  const timestamp = CollegeBaseballAPI.formatTimestamp();
  const timestampEl = document.getElementById('data-timestamp');
  if (timestampEl) {
    timestampEl.textContent = `Last updated: ${timestamp}`;
  }
});

/**
 * Update hero stats from live data
 */
function updateHeroStats(data) {
  if (!data.team) return;

  // Find hero stat elements and update
  const heroStats = document.querySelectorAll('.hero-stat');
  heroStats.forEach(stat => {
    const label = stat.querySelector('.hero-stat-label')?.textContent?.toLowerCase();
    const valueEl = stat.querySelector('.hero-stat-value');

    if (!label || !valueEl) return;

    if (label.includes('record') && data.team.record) {
      valueEl.textContent = data.team.record;
    } else if ((label.includes('sec') || label.includes('conf')) && data.team.conferenceRecord) {
      valueEl.textContent = data.team.conferenceRecord;
    }
  });

  // Update ranking badge if exists
  const rankBadge = document.querySelector('.team-badge');
  if (rankBadge && data.team.ranking) {
    rankBadge.textContent = `#${data.team.ranking} Ranking`;
  }
}

/**
 * Toggle scoreboard sidebar visibility (for mobile toggle button)
 */
function toggleScoreboard() {
  const sidebar = document.getElementById('scoreboard-sidebar');
  if (sidebar) {
    sidebar.style.display = sidebar.style.display === 'none' ? 'block' : 'none';
  }
}

// Export toggle function
window.toggleScoreboard = toggleScoreboard;
