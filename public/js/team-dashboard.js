/**
 * Team Dashboard Live Data Module
 * Fetches and renders live data from the BSI API
 *
 * Usage: Include this script in team dashboard HTML pages
 * <script src="/js/team-dashboard.js" data-team-id="texas"></script>
 */

(function() {
  'use strict';

  const API_BASE = '/api/college-baseball/teams';

  // Get team ID from script tag data attribute
  const script = document.currentScript;
  const teamId = script?.dataset?.teamId || getTeamIdFromUrl();

  function getTeamIdFromUrl() {
    // Extract team ID from URL path like /dashboards/sec-baseball/texas.html
    const path = window.location.pathname;
    const match = path.match(/\/([^\/]+)\.html$/);
    return match ? match[1] : null;
  }

  async function fetchTeamData() {
    if (!teamId) {
      console.error('Team ID not found');
      return null;
    }

    try {
      const response = await fetch(`${API_BASE}/${teamId}/dashboard`);
      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch team data:', error);
      return null;
    }
  }

  function updateElement(selector, value) {
    const el = document.querySelector(selector);
    if (el && value !== null && value !== undefined) {
      el.textContent = value;
    }
  }

  function updateRankingBadge(data) {
    const badge = document.querySelector('.ranking-badge');
    if (badge && data.rankings?.d1baseball?.rank) {
      badge.textContent = `#${data.rankings.d1baseball.rank}`;
    }
  }

  function updateOutlookStats(data) {
    const statBoxes = document.querySelectorAll('.outlook-stats .stat-box');
    if (!statBoxes.length || !data.rankings) return;

    // D1Baseball rank
    if (statBoxes[0] && data.rankings.d1baseball) {
      const val = statBoxes[0].querySelector('.stat-value');
      if (val) val.textContent = `#${data.rankings.d1baseball.rank}`;
    }

    // Baseball America rank
    if (statBoxes[1] && data.rankings.baseballAmerica) {
      const val = statBoxes[1].querySelector('.stat-value');
      if (val) val.textContent = `#${data.rankings.baseballAmerica.rank}`;
    }
  }

  function updateCoachInfo(data) {
    if (!data.team?.coach) return;

    const coachName = document.querySelector('.coach-info div div:first-child');
    const coachRecord = document.querySelector('.coach-info div div:nth-child(2)');

    if (coachName && data.team.coach.name) {
      coachName.textContent = data.team.coach.name;
    }
    if (coachRecord && data.team.coach.years && data.team.coach.record) {
      coachRecord.textContent = `Year ${data.team.coach.years} \u2022 ${data.team.coach.record}`;
    }
  }

  function updateHistory(data) {
    if (!data.history) return;

    const historyItems = document.querySelectorAll('.history-grid .history-item');
    if (historyItems.length >= 4) {
      // CWS Appearances
      const cws = historyItems[0].querySelector('.history-value');
      if (cws) cws.textContent = data.history.cwsAppearances || 0;

      // Last CWS
      const lastCws = historyItems[1].querySelector('.history-value');
      if (lastCws) lastCws.textContent = data.history.lastCWS || '-';

      // National Titles
      const titles = historyItems[2].querySelector('.history-value');
      if (titles) titles.textContent = data.history.nationalTitles || 0;

      // Regionals
      const regionals = historyItems[3].querySelector('.history-value');
      if (regionals) regionals.textContent = data.history.regionals || 0;
    }
  }

  function updateStadium(data) {
    if (!data.team?.stadium) return;

    const stadiumName = document.querySelector('.card:has(.card-title span:contains("Home"))');
    // Find stadium card and update
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
      const title = card.querySelector('.card-title');
      if (title && title.textContent.includes('Home Field')) {
        const nameEl = card.querySelector('div > div:first-child');
        const detailEl = card.querySelector('div > div:last-child');
        if (nameEl && data.team.stadium.name) {
          nameEl.textContent = data.team.stadium.name;
        }
        if (detailEl && data.team.stadium.capacity) {
          detailEl.textContent = `Capacity: ${data.team.stadium.capacity.toLocaleString()} \u2022 ${data.team.stadium.surface || 'Grass'}`;
        }
      }
    });
  }

  function updateLiveIndicator() {
    const indicator = document.querySelector('.live-indicator');
    if (indicator) {
      indicator.innerHTML = '<span class="live-dot"></span>Live Data';
    }
  }

  function updateTimestamp(data) {
    const timestampEl = document.getElementById('timestamp');
    if (timestampEl && data.timestamp) {
      timestampEl.textContent = data.timestamp;
    }
  }

  async function init() {
    const data = await fetchTeamData();
    if (!data || !data.success) {
      console.log('Using static data (API unavailable)');
      return;
    }

    console.log('Updating dashboard with live data:', data);

    updateRankingBadge(data);
    updateOutlookStats(data);
    updateCoachInfo(data);
    updateHistory(data);
    updateStadium(data);
    updateTimestamp(data);
    updateLiveIndicator();
  }

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
