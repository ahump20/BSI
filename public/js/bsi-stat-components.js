/**
 * BSI Reusable Stat & Score Components
 * Drop-in components for dashboards and analytics pages
 */

(function() {
  'use strict';

  // Stat Card Component
  window.BSIStatCard = function(container, options) {
    const defaults = {
      value: '0',
      label: 'Stat',
      trend: null, // 'up', 'down', or null
      trendValue: null,
      color: 'burnt-orange'
    };
    const opts = { ...defaults, ...options };

    const trendHTML = opts.trend ? `
      <span class="bsi-stat-trend bsi-stat-trend--${opts.trend}">
        ${opts.trend === 'up' ? '↑' : '↓'} ${opts.trendValue || ''}
      </span>
    ` : '';

    container.innerHTML = `
      <div class="bsi-stat-card" data-color="${opts.color}">
        <div class="bsi-stat-card__value">${opts.value}</div>
        <div class="bsi-stat-card__label">${opts.label}</div>
        ${trendHTML}
      </div>
    `;
  };

  // Score Card Component (for live games)
  window.BSIScoreCard = function(container, options) {
    const defaults = {
      homeTeam: 'Home',
      awayTeam: 'Away',
      homeScore: 0,
      awayScore: 0,
      homeLogo: '',
      awayLogo: '',
      status: 'Final',
      inning: null,
      time: null
    };
    const opts = { ...defaults, ...options };

    const statusClass = opts.status === 'Live' ? 'bsi-score-card--live' : '';
    const statusHTML = opts.inning
      ? `<span class="bsi-score-card__inning">${opts.inning}</span>`
      : `<span class="bsi-score-card__status">${opts.status}</span>`;

    container.innerHTML = `
      <div class="bsi-score-card ${statusClass}">
        <div class="bsi-score-card__header">
          ${statusHTML}
          ${opts.time ? `<span class="bsi-score-card__time">${opts.time}</span>` : ''}
        </div>
        <div class="bsi-score-card__teams">
          <div class="bsi-score-card__team ${opts.awayScore > opts.homeScore ? 'winner' : ''}">
            ${opts.awayLogo ? `<img src="${opts.awayLogo}" alt="${opts.awayTeam}" class="bsi-score-card__logo">` : ''}
            <span class="bsi-score-card__name">${opts.awayTeam}</span>
            <span class="bsi-score-card__score">${opts.awayScore}</span>
          </div>
          <div class="bsi-score-card__team ${opts.homeScore > opts.awayScore ? 'winner' : ''}">
            ${opts.homeLogo ? `<img src="${opts.homeLogo}" alt="${opts.homeTeam}" class="bsi-score-card__logo">` : ''}
            <span class="bsi-score-card__name">${opts.homeTeam}</span>
            <span class="bsi-score-card__score">${opts.homeScore}</span>
          </div>
        </div>
      </div>
    `;
  };

  // Player Card Component
  window.BSIPlayerCard = function(container, options) {
    const defaults = {
      name: 'Player Name',
      position: 'POS',
      number: '',
      team: '',
      photo: '',
      stats: []
    };
    const opts = { ...defaults, ...options };

    const statsHTML = opts.stats.map(s => `
      <div class="bsi-player-card__stat">
        <span class="bsi-player-card__stat-value">${s.value}</span>
        <span class="bsi-player-card__stat-label">${s.label}</span>
      </div>
    `).join('');

    const initials = opts.name.split(' ').map(n => n[0]).join('');

    container.innerHTML = `
      <div class="bsi-player-card">
        <div class="bsi-player-card__header">
          ${opts.photo
            ? `<img src="${opts.photo}" alt="${opts.name}" class="bsi-player-card__photo">`
            : `<div class="bsi-player-card__avatar">${initials}</div>`
          }
          <div class="bsi-player-card__info">
            <div class="bsi-player-card__name">${opts.name}</div>
            <div class="bsi-player-card__meta">
              ${opts.number ? `#${opts.number} · ` : ''}${opts.position}${opts.team ? ` · ${opts.team}` : ''}
            </div>
          </div>
        </div>
        ${opts.stats.length ? `<div class="bsi-player-card__stats">${statsHTML}</div>` : ''}
      </div>
    `;
  };

  // Standings Table Component
  window.BSIStandingsTable = function(container, options) {
    const defaults = {
      title: 'Standings',
      teams: [],
      columns: ['Team', 'W', 'L', 'PCT', 'GB']
    };
    const opts = { ...defaults, ...options };

    const headerHTML = opts.columns.map(c => `<th>${c}</th>`).join('');
    const rowsHTML = opts.teams.map((team, i) => `
      <tr>
        <td class="bsi-standings__rank">${i + 1}</td>
        <td class="bsi-standings__team">
          ${team.logo ? `<img src="${team.logo}" alt="${team.name}" class="bsi-standings__logo">` : ''}
          <span>${team.name}</span>
        </td>
        <td>${team.wins || 0}</td>
        <td>${team.losses || 0}</td>
        <td>${team.pct || '.000'}</td>
        <td>${team.gb || '-'}</td>
      </tr>
    `).join('');

    container.innerHTML = `
      <div class="bsi-standings">
        <h3 class="bsi-standings__title">${opts.title}</h3>
        <table class="bsi-standings__table">
          <thead><tr><th>#</th>${headerHTML}</tr></thead>
          <tbody>${rowsHTML}</tbody>
        </table>
      </div>
    `;
  };

  // Rankings List Component
  window.BSIRankingsList = function(container, options) {
    const defaults = {
      title: 'Rankings',
      source: '',
      teams: []
    };
    const opts = { ...defaults, ...options };

    const teamsHTML = opts.teams.map(team => `
      <div class="bsi-ranking-item">
        <span class="bsi-ranking-item__rank">${team.rank}</span>
        <div class="bsi-ranking-item__team">
          ${team.logo ? `<img src="${team.logo}" alt="${team.name}" class="bsi-ranking-item__logo">` : ''}
          <span class="bsi-ranking-item__name">${team.name}</span>
        </div>
        ${team.record ? `<span class="bsi-ranking-item__record">${team.record}</span>` : ''}
        ${team.change ? `<span class="bsi-ranking-item__change bsi-ranking-item__change--${team.change > 0 ? 'up' : 'down'}">${team.change > 0 ? '+' : ''}${team.change}</span>` : ''}
      </div>
    `).join('');

    container.innerHTML = `
      <div class="bsi-rankings">
        <div class="bsi-rankings__header">
          <h3 class="bsi-rankings__title">${opts.title}</h3>
          ${opts.source ? `<span class="bsi-rankings__source">${opts.source}</span>` : ''}
        </div>
        <div class="bsi-rankings__list">${teamsHTML}</div>
      </div>
    `;
  };

})();
