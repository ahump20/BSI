/**
 * BSI Sticky Score Ticker Component
 * ESPN-style live score ticker that displays across all sports
 *
 * Usage: Include this script and call initScoreTicker() after DOM ready
 */

(function() {
  'use strict';

  const TICKER_STYLES = `
    .bsi-ticker {
      position: fixed;
      top: 60px;
      left: 0;
      right: 0;
      z-index: 90;
      background: linear-gradient(180deg, #0D0D0D 0%, #1A1A1A 100%);
      border-bottom: 1px solid rgba(191, 87, 0, 0.3);
      height: 56px;
      overflow: hidden;
      font-family: 'Oswald', sans-serif;
    }

    .bsi-ticker-inner {
      display: flex;
      align-items: center;
      height: 100%;
      max-width: 100%;
      overflow-x: auto;
      scrollbar-width: none;
      -ms-overflow-style: none;
      gap: 0;
    }

    .bsi-ticker-inner::-webkit-scrollbar {
      display: none;
    }

    .bsi-ticker-sport {
      display: flex;
      align-items: center;
      padding: 0 0.75rem;
      height: 100%;
      border-right: 1px solid rgba(255, 255, 255, 0.1);
      flex-shrink: 0;
    }

    .bsi-ticker-sport-label {
      font-size: 0.625rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      padding: 0.25rem 0.5rem;
      border-radius: 3px;
      margin-right: 0.5rem;
      flex-shrink: 0;
    }

    .bsi-ticker-sport-label.nfl { background: #013369; color: white; }
    .bsi-ticker-sport-label.nba { background: #C9082A; color: white; }
    .bsi-ticker-sport-label.mlb { background: #002D72; color: white; }
    .bsi-ticker-sport-label.ncaab { background: #FF6B00; color: white; }
    .bsi-ticker-sport-label.ncaaf { background: #333; color: white; }

    .bsi-ticker-game {
      display: flex;
      align-items: center;
      padding: 0.5rem 1rem;
      cursor: pointer;
      transition: background 0.15s ease;
      border-right: 1px solid rgba(255, 255, 255, 0.05);
      flex-shrink: 0;
      min-width: 180px;
    }

    .bsi-ticker-game:hover {
      background: rgba(191, 87, 0, 0.1);
    }

    .bsi-ticker-game.live {
      background: rgba(16, 185, 129, 0.08);
    }

    .bsi-ticker-teams {
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 90px;
    }

    .bsi-ticker-team {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.75rem;
      color: rgba(250, 248, 245, 0.9);
    }

    .bsi-ticker-team.winner {
      font-weight: 700;
      color: #FAF8F5;
    }

    .bsi-ticker-team img {
      width: 16px;
      height: 16px;
      object-fit: contain;
    }

    .bsi-ticker-team-abbr {
      min-width: 32px;
    }

    .bsi-ticker-team-record {
      font-size: 0.625rem;
      color: rgba(250, 248, 245, 0.5);
      margin-left: 0.25rem;
    }

    .bsi-ticker-score {
      font-weight: 700;
      min-width: 24px;
      text-align: right;
    }

    .bsi-ticker-status {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      margin-left: 0.75rem;
      min-width: 60px;
    }

    .bsi-ticker-time {
      font-size: 0.625rem;
      font-weight: 600;
      color: rgba(250, 248, 245, 0.7);
      text-transform: uppercase;
    }

    .bsi-ticker-time.live {
      color: #10B981;
    }

    .bsi-ticker-detail {
      font-size: 0.5625rem;
      color: rgba(250, 248, 245, 0.5);
      white-space: nowrap;
    }

    .bsi-ticker-network {
      font-size: 0.5rem;
      font-weight: 700;
      color: rgba(250, 248, 245, 0.4);
      margin-top: 2px;
      text-transform: uppercase;
    }

    .bsi-ticker-nav {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 100%;
      background: rgba(13, 13, 13, 0.95);
      border: none;
      color: rgba(250, 248, 245, 0.6);
      cursor: pointer;
      flex-shrink: 0;
      transition: all 0.15s ease;
    }

    .bsi-ticker-nav:hover {
      color: #BF5700;
      background: rgba(191, 87, 0, 0.1);
    }

    .bsi-ticker-nav svg {
      width: 16px;
      height: 16px;
    }

    .bsi-ticker-expand {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0 1rem;
      height: 100%;
      font-size: 0.6875rem;
      font-weight: 600;
      color: #BF5700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      cursor: pointer;
      flex-shrink: 0;
      transition: all 0.15s ease;
      border-left: 1px solid rgba(255, 255, 255, 0.1);
    }

    .bsi-ticker-expand:hover {
      background: rgba(191, 87, 0, 0.1);
    }

    /* Adjust page content when ticker is present */
    body.has-ticker .page-header {
      padding-top: 9rem;
    }

    body.has-ticker .sub-nav {
      top: 116px;
    }

    @media (max-width: 768px) {
      .bsi-ticker {
        top: 52px;
        height: 48px;
      }

      .bsi-ticker-game {
        padding: 0.375rem 0.75rem;
        min-width: 150px;
      }

      .bsi-ticker-team {
        font-size: 0.6875rem;
      }

      .bsi-ticker-team img {
        width: 14px;
        height: 14px;
      }

      body.has-ticker .page-header {
        padding-top: 7.5rem;
      }

      body.has-ticker .sub-nav {
        top: 100px;
      }
    }

    /* Light theme support */
    [data-theme="light"] .bsi-ticker {
      background: linear-gradient(180deg, #FFFFFF 0%, #F5F5F5 100%);
      border-bottom-color: rgba(191, 87, 0, 0.2);
    }

    [data-theme="light"] .bsi-ticker-team {
      color: rgba(26, 26, 26, 0.9);
    }

    [data-theme="light"] .bsi-ticker-team.winner {
      color: #1A1A1A;
    }

    [data-theme="light"] .bsi-ticker-time {
      color: rgba(26, 26, 26, 0.7);
    }

    [data-theme="light"] .bsi-ticker-detail,
    [data-theme="light"] .bsi-ticker-network,
    [data-theme="light"] .bsi-ticker-team-record {
      color: rgba(26, 26, 26, 0.5);
    }
  `;

  // Team abbreviations mapping
  const TEAM_ABBREVS = {
    // NFL
    'Cardinals': 'ARI', 'Falcons': 'ATL', 'Ravens': 'BAL', 'Bills': 'BUF',
    'Panthers': 'CAR', 'Bears': 'CHI', 'Bengals': 'CIN', 'Browns': 'CLE',
    'Cowboys': 'DAL', 'Broncos': 'DEN', 'Lions': 'DET', 'Packers': 'GB',
    'Texans': 'HOU', 'Colts': 'IND', 'Jaguars': 'JAX', 'Chiefs': 'KC',
    'Raiders': 'LV', 'Chargers': 'LAC', 'Rams': 'LAR', 'Dolphins': 'MIA',
    'Vikings': 'MIN', 'Patriots': 'NE', 'Saints': 'NO', 'Giants': 'NYG',
    'Jets': 'NYJ', 'Eagles': 'PHI', 'Steelers': 'PIT', 'Seahawks': 'SEA',
    '49ers': 'SF', 'Buccaneers': 'TB', 'Titans': 'TEN', 'Commanders': 'WAS',
    // NBA
    'Hawks': 'ATL', 'Celtics': 'BOS', 'Nets': 'BKN', 'Hornets': 'CHA',
    'Bulls': 'CHI', 'Cavaliers': 'CLE', 'Mavericks': 'DAL', 'Nuggets': 'DEN',
    'Pistons': 'DET', 'Warriors': 'GSW', 'Rockets': 'HOU', 'Pacers': 'IND',
    'Clippers': 'LAC', 'Lakers': 'LAL', 'Grizzlies': 'MEM', 'Heat': 'MIA',
    'Bucks': 'MIL', 'Timberwolves': 'MIN', 'Pelicans': 'NOP', 'Knicks': 'NYK',
    'Thunder': 'OKC', 'Magic': 'ORL', '76ers': 'PHI', 'Suns': 'PHX',
    'Trail Blazers': 'POR', 'Kings': 'SAC', 'Spurs': 'SAS', 'Raptors': 'TOR',
    'Jazz': 'UTA', 'Wizards': 'WAS'
  };

  function getTeamAbbrev(teamName) {
    for (const [name, abbrev] of Object.entries(TEAM_ABBREVS)) {
      if (teamName && teamName.includes(name)) return abbrev;
    }
    return teamName ? teamName.substring(0, 3).toUpperCase() : '???';
  }

  function createTickerHTML(gamesData) {
    const sports = [
      { key: 'nfl', label: 'NFL', games: gamesData.nfl || [] },
      { key: 'nba', label: 'NBA', games: gamesData.nba || [] },
      { key: 'mlb', label: 'MLB', games: gamesData.mlb || [] }
    ].filter(s => s.games.length > 0);

    if (sports.length === 0) return '';

    let html = `
      <div class="bsi-ticker">
        <button class="bsi-ticker-nav" id="tickerPrev" aria-label="Previous">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
        </button>
        <div class="bsi-ticker-inner" id="tickerScroll">
    `;

    sports.forEach(sport => {
      html += `<div class="bsi-ticker-sport"><span class="bsi-ticker-sport-label ${sport.key}">${sport.label}</span></div>`;

      sport.games.forEach(game => {
        // Handle status as string or object
        const statusStr = typeof game.status === 'string' ? game.status : (game.status?.type || game.status?.detail || '');
        const isLive = game.isLive || (statusStr && statusStr.includes('Progress'));
        const isFinal = game.isFinal || (statusStr && statusStr.includes('Final'));
        const awayScore = game.awayScore ?? game.away?.score ?? '--';
        const homeScore = game.homeScore ?? game.home?.score ?? '--';
        const awayWinner = isFinal && Number(awayScore) > Number(homeScore);
        const homeWinner = isFinal && Number(homeScore) > Number(awayScore);
        const awayName = game.awayTeam || game.away?.name || 'Away';
        const homeName = game.homeTeam || game.home?.name || 'Home';
        const awayLogo = game.awayLogo || game.away?.logo || '';
        const homeLogo = game.homeLogo || game.home?.logo || '';
        const awayRecord = game.awayRecord || game.away?.record || '';
        const homeRecord = game.homeRecord || game.home?.record || '';
        const network = game.network || game.broadcast || '';
        const gameState = game.gameState || game.situation || '';
        const gameId = game.id || game.GameID || '';
        const gameUrl = `/${sport.key}/game.html?id=${encodeURIComponent(gameId)}`;

        html += `
          <div class="bsi-ticker-game ${isLive ? 'live' : ''}" onclick="window.location.href='${gameUrl}'">
            <div class="bsi-ticker-teams">
              <div class="bsi-ticker-team ${awayWinner ? 'winner' : ''}">
                ${awayLogo ? `<img src="${awayLogo}" alt="" loading="lazy">` : ''}
                <span class="bsi-ticker-team-abbr">${getTeamAbbrev(awayName)}</span>
                ${awayRecord ? `<span class="bsi-ticker-team-record">${awayRecord}</span>` : ''}
                <span class="bsi-ticker-score">${awayScore}</span>
              </div>
              <div class="bsi-ticker-team ${homeWinner ? 'winner' : ''}">
                ${homeLogo ? `<img src="${homeLogo}" alt="" loading="lazy">` : ''}
                <span class="bsi-ticker-team-abbr">${getTeamAbbrev(homeName)}</span>
                ${homeRecord ? `<span class="bsi-ticker-team-record">${homeRecord}</span>` : ''}
                <span class="bsi-ticker-score">${homeScore}</span>
              </div>
            </div>
            <div class="bsi-ticker-status">
              <span class="bsi-ticker-time ${isLive ? 'live' : ''}">${game.status || 'TBD'}</span>
              ${gameState ? `<span class="bsi-ticker-detail">${gameState}</span>` : ''}
              ${network ? `<span class="bsi-ticker-network">${network}</span>` : ''}
            </div>
          </div>
        `;
      });
    });

    html += `
        </div>
        <button class="bsi-ticker-nav" id="tickerNext" aria-label="Next">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
        </button>
        <div class="bsi-ticker-expand" onclick="window.location.href='/scores'">
          Full Scoreboard &rarr;
        </div>
      </div>
    `;

    return html;
  }

  async function fetchAllScores() {
    const results = { nfl: [], nba: [], mlb: [] };

    try {
      const [nflRes, nbaRes, mlbRes] = await Promise.allSettled([
        fetch('/api/nfl/scores').then(r => r.json()),
        fetch('/api/nba/scores').then(r => r.json()),
        fetch('/api/mlb/scores').then(r => r.json())
      ]);

      if (nflRes.status === 'fulfilled') results.nfl = nflRes.value.games || nflRes.value.events || [];
      if (nbaRes.status === 'fulfilled') results.nba = nbaRes.value.games || nbaRes.value.events || [];
      if (mlbRes.status === 'fulfilled') results.mlb = mlbRes.value.games || mlbRes.value.events || [];
    } catch (err) {
      console.warn('Ticker fetch error:', err);
    }

    return results;
  }

  function initScrollControls() {
    const scroll = document.getElementById('tickerScroll');
    const prev = document.getElementById('tickerPrev');
    const next = document.getElementById('tickerNext');

    if (!scroll || !prev || !next) return;

    const scrollAmount = 200;

    prev.addEventListener('click', () => {
      scroll.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    });

    next.addEventListener('click', () => {
      scroll.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    });
  }

  // Store current ticker state to avoid unnecessary DOM updates
  let currentTickerData = null;
  let isRefreshing = false;

  function dataChanged(oldData, newData) {
    if (!oldData) return true;
    return JSON.stringify(oldData) !== JSON.stringify(newData);
  }

  async function refreshTicker() {
    if (isRefreshing) return;
    isRefreshing = true;

    try {
      const newData = await fetchAllScores();

      // Only update if data actually changed
      if (!dataChanged(currentTickerData, newData)) {
        return;
      }

      const ticker = document.querySelector('.bsi-ticker');
      if (ticker) {
        // Preserve scroll position
        const scroll = document.getElementById('tickerScroll');
        const scrollLeft = scroll ? scroll.scrollLeft : 0;

        const newHTML = createTickerHTML(newData);
        ticker.outerHTML = newHTML;
        initScrollControls();

        // Restore scroll position
        const newScroll = document.getElementById('tickerScroll');
        if (newScroll && scrollLeft > 0) {
          newScroll.scrollLeft = scrollLeft;
        }

        currentTickerData = newData;
      }
    } finally {
      isRefreshing = false;
    }
  }

  window.initScoreTicker = async function() {
    // Inject styles
    if (!document.getElementById('bsi-ticker-styles')) {
      const style = document.createElement('style');
      style.id = 'bsi-ticker-styles';
      style.textContent = TICKER_STYLES;
      document.head.appendChild(style);
    }

    // Fetch scores
    const gamesData = await fetchAllScores();
    currentTickerData = gamesData;

    // Only show ticker if there are games
    const totalGames = (gamesData.nfl?.length || 0) + (gamesData.nba?.length || 0) + (gamesData.mlb?.length || 0);
    if (totalGames === 0) return;

    // Create and insert ticker
    const tickerHTML = createTickerHTML(gamesData);
    const header = document.querySelector('.header');

    if (header && tickerHTML) {
      header.insertAdjacentHTML('afterend', tickerHTML);
      document.body.classList.add('has-ticker');
      initScrollControls();

      // Auto-refresh every 30 seconds (with state comparison and scroll preservation)
      setInterval(refreshTicker, 30000);
    }
  };

  // Auto-init when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', window.initScoreTicker);
  } else {
    window.initScoreTicker();
  }
})();
