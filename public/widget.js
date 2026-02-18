/**
 * BSI Live Game Widget — <bsi-live-game>
 *
 * Self-contained Web Component. Zero external dependencies.
 * Polls /api/live/{gameId} every 15 seconds.
 *
 * Usage:
 *   <script src="https://blazesportsintel.com/widget.js"></script>
 *   <bsi-live-game game-id="tex-lam-20260217"></bsi-live-game>
 *
 * Optional attributes:
 *   data-api-key="bsi_..."  — BSI Pro key, unlocks pitch data in the drawer
 *
 * Expected API response shape from GET /api/live/:gameId:
 *   { game_id, home, away, inning, half, situation, win_probability,
 *     current_pitcher, last_play, pitches? }
 */

(function () {
  'use strict';

  const API_BASE = 'https://blazesportsintel.com/api/live';
  const POLL_MS = 15000;

  // -------------------------------------------------------------------------
  // HTML escaping — all API data must pass through esc() before innerHTML
  // -------------------------------------------------------------------------

  function esc(val) {
    if (val == null) return '';
    return String(val)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // -------------------------------------------------------------------------
  // Styles (injected into Shadow DOM — isolated from host page)
  // -------------------------------------------------------------------------

  const STYLES = `
    @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;600;700&family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :host { display: block; font-family: 'Oswald', 'Arial Narrow', sans-serif; }

    .widget {
      background: #0D0D0D;
      color: #fff;
      border: 1px solid rgba(191, 87, 0, 0.4);
      border-radius: 8px;
      padding: 16px;
      max-width: 420px;
      min-width: 280px;
      position: relative;
      overflow: hidden;
      cursor: pointer;
      user-select: none;
      transition: border-color 0.2s ease;
    }
    .widget:hover { border-color: #BF5700; }

    /* Film grain via pseudo-element */
    .widget::before {
      content: '';
      position: absolute;
      inset: 0;
      pointer-events: none;
      opacity: 0.025;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
      background-size: 80px;
    }

    .scoreline {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;
    }
    .team {
      font-family: 'Oswald', sans-serif;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      font-size: 0.85rem;
      color: #ccc;
      flex: 1;
    }
    .team.home { text-align: right; }
    .score {
      font-family: 'Oswald', sans-serif;
      font-size: 2rem;
      font-weight: 700;
      color: #BF5700;
      min-width: 2ch;
      text-align: center;
      line-height: 1;
    }
    .inning-block {
      display: flex;
      flex-direction: column;
      align-items: center;
      min-width: 36px;
    }
    .inning-arrow { font-size: 0.5rem; color: #BF5700; line-height: 1; height: 8px; }
    .inning-num   { font-size: 0.75rem; color: #888; line-height: 1; }

    .situation {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 10px;
    }
    .bases-svg { flex-shrink: 0; }
    .outs {
      font-size: 0.7rem;
      color: #888;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .leverage {
      margin-left: auto;
      padding: 2px 8px;
      border-radius: 3px;
      font-size: 0.6rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }
    .leverage-low      { background: #222; color: #666; }
    .leverage-medium   { background: #8B4513; color: #fff; }
    .leverage-high     { background: #BF5700; color: #fff; }
    .leverage-critical { background: #FF6B35; color: #fff; animation: pulse 1s ease-in-out infinite; }
    @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.6; } }

    .wp-wrap  { height: 4px; background: #222; border-radius: 2px; overflow: hidden; margin-bottom: 10px; }
    .wp-fill  { height: 100%; background: #BF5700; border-radius: 2px; transition: width 0.6s ease; }
    .wp-labels {
      display: flex;
      justify-content: space-between;
      font-size: 0.65rem;
      color: #555;
      margin-bottom: 4px;
    }

    .narrative {
      font-family: 'Cormorant Garamond', Georgia, serif;
      font-style: italic;
      font-size: 0.88rem;
      color: #bbb;
      line-height: 1.4;
      margin-bottom: 10px;
    }

    .footer {
      display: flex;
      justify-content: space-between;
      font-size: 0.68rem;
      color: #555;
      gap: 8px;
    }
    .last-play {
      text-align: right;
      color: #777;
      font-style: italic;
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .bsi-brand { margin-top: 10px; text-align: right; font-size: 0.6rem; color: #333; letter-spacing: 0.08em; text-transform: uppercase; }
    .bsi-brand a { color: #BF5700; text-decoration: none; }
    .bsi-brand a:hover { color: #FF6B35; }

    .drawer { overflow: hidden; transition: max-height 0.3s ease, opacity 0.3s ease; max-height: 0; opacity: 0; }
    .drawer.open { max-height: 400px; opacity: 1; }
    .drawer-inner { border-top: 1px solid #1a1a1a; padding-top: 12px; margin-top: 12px; }

    .pitch-log { list-style: none; }
    .pitch-row { display: flex; justify-content: space-between; align-items: center; padding: 4px 0; border-bottom: 1px solid #111; font-size: 0.7rem; color: #888; }
    .pitch-type { color: #ccc; font-weight: 600; width: 80px; }
    .pitch-velo { color: #BF5700; width: 50px; text-align: right; }
    .pitch-result { text-align: right; flex: 1; }

    .upsell { background: #111; border: 1px solid rgba(191, 87, 0, 0.3); border-radius: 6px; padding: 12px; text-align: center; }
    .upsell p { font-size: 0.78rem; color: #888; margin-bottom: 10px; font-family: 'Cormorant Garamond', Georgia, serif; font-style: italic; }
    .upsell-btn { display: inline-block; background: #BF5700; color: #fff; font-family: 'Oswald', sans-serif; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; padding: 6px 16px; border-radius: 4px; text-decoration: none; transition: background 0.2s ease; }
    .upsell-btn:hover { background: #FF6B35; }

    .embed-section { margin-top: 12px; }
    .embed-label { font-size: 0.65rem; color: #444; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 6px; }
    .embed-code { background: #111; border: 1px solid #1a1a1a; border-radius: 4px; padding: 8px; font-family: 'JetBrains Mono', 'Courier New', monospace; font-size: 0.65rem; color: #BF5700; white-space: pre; overflow-x: auto; cursor: pointer; transition: border-color 0.2s; }
    .embed-code:hover { border-color: #BF5700; }
    .embed-copied { font-size: 0.65rem; color: #4ade80; margin-top: 4px; height: 14px; }

    .skeleton { background: #111; border-radius: 8px; height: 160px; animation: shimmer 1.5s ease-in-out infinite; }
    @keyframes shimmer { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }
    .error-state { padding: 16px; text-align: center; color: #555; font-size: 0.8rem; }
  `;

  // -------------------------------------------------------------------------
  // SVG base diagram — only SVG attributes, no API data injected
  // -------------------------------------------------------------------------

  function baseDiagram(runners) {
    const r = new Set(runners || []);
    const c1 = r.has('1B') ? '#BF5700' : '#1a1a1a';
    const c2 = r.has('2B') ? '#BF5700' : '#1a1a1a';
    const c3 = r.has('3B') ? '#BF5700' : '#1a1a1a';
    const s = '#333';
    // All values are hardcoded SVG geometry — no API data here
    return (
      '<svg class="bases-svg" viewBox="0 0 48 48" width="40" height="40" aria-label="Base diagram">' +
      '<polygon points="24,44 20,40 24,36 28,40" fill="#222" stroke="' + s + '" stroke-width="1"/>' +
      '<rect x="32" y="22" width="10" height="10" fill="' + c1 + '" stroke="' + s + '" stroke-width="1" transform="rotate(45 37 27)"/>' +
      '<rect x="19" y="9" width="10" height="10" fill="' + c2 + '" stroke="' + s + '" stroke-width="1" transform="rotate(45 24 14)"/>' +
      '<rect x="6" y="22" width="10" height="10" fill="' + c3 + '" stroke="' + s + '" stroke-width="1" transform="rotate(45 11 27)"/>' +
      '</svg>'
    );
  }

  // -------------------------------------------------------------------------
  // Template builders — all API data values go through esc()
  // -------------------------------------------------------------------------

  function skeletonTemplate() {
    return '<style>' + STYLES + '</style><div class="skeleton" role="status" aria-label="Loading game data"></div>';
  }

  function errorTemplate(gameId) {
    return (
      '<style>' + STYLES + '</style>' +
      '<div class="widget error-state">' +
      '<p>Game data unavailable</p>' +
      '<p style="font-size:0.65rem;margin-top:4px;color:#333;">' + esc(gameId) + '</p>' +
      '</div>'
    );
  }

  function leverageClass(lev) {
    var l = (lev || '').toUpperCase();
    if (l === 'CRITICAL') return 'leverage leverage-critical';
    if (l === 'HIGH')     return 'leverage leverage-high';
    if (l === 'MEDIUM')   return 'leverage leverage-medium';
    return 'leverage leverage-low';
  }

  function pitchRowsHtml(pitches) {
    if (!pitches || !pitches.length) return '';
    return pitches.slice(0, 5).map(function (p) {
      return (
        '<li class="pitch-row">' +
        '<span class="pitch-type">' + esc(p.type || '—') + '</span>' +
        '<span class="pitch-velo">' + (p.velocity ? esc(p.velocity) + ' mph' : '—') + '</span>' +
        '<span class="pitch-result">' + esc(p.result || '—') + '</span>' +
        '</li>'
      );
    }).join('');
  }

  function drawerHtml(state, apiKey) {
    if (apiKey) {
      var rows = pitchRowsHtml(state.pitches);
      return rows
        ? '<div class="drawer-inner"><p class="embed-label">Last Pitches</p><ul class="pitch-log">' + rows + '</ul></div>'
        : '<div class="drawer-inner"><p style="font-size:0.7rem;color:#555;font-style:italic;padding:4px 0;">No pitch data for this game.</p></div>';
    }
    return (
      '<div class="drawer-inner">' +
      '<div class="upsell">' +
      '<p>Unlock pitch-by-pitch data, velocity, and leverage history</p>' +
      '<a class="upsell-btn" href="https://blazesportsintel.com/pro" target="_blank" rel="noopener noreferrer">BSI Pro &mdash; $12/mo</a>' +
      '</div>' +
      '</div>'
    );
  }

  function liveTemplate(state, gameId, apiKey) {
    var home = state.home || {};
    var away = state.away || {};
    var sit  = state.situation || {};
    var wp   = state.win_probability || {};
    var pitcher = state.current_pitcher || {};

    var homeWP = Math.round((wp.home != null ? wp.home : 0.5) * 100);
    var awayWP = 100 - homeWP;
    var inningHalf = state.half === 'bottom' ? '&#9660;' : '&#9650;';

    // Embed code uses esc() to prevent injected game IDs from breaking markup
    var embedCode =
      '<script src="https://blazesportsintel.com/widget.js"><\/script>\n' +
      '<bsi-live-game game-id="' + esc(gameId) + '"><\/bsi-live-game>';

    var narrativeHtml = sit.description
      ? '<p class="narrative">' + esc(sit.description) + '</p>'
      : '';

    var leverageHtml = sit.leverage
      ? '<span class="' + leverageClass(sit.leverage) + '">' + esc(sit.leverage) + '</span>'
      : '';

    var lastPlayHtml = state.last_play
      ? '<span class="last-play">' + esc(state.last_play) + '</span>'
      : '';

    var pitcherHtml = pitcher.name
      ? esc(pitcher.name) + ' &middot; ' + esc(pitcher.pitch_count || 0) + 'p &middot; ' + esc(pitcher.era || '—') + ' ERA'
      : '—';

    return (
      '<style>' + STYLES + '</style>' +
      '<div class="widget" id="widget-root" role="region" aria-label="Live game: ' + esc(away.abbr || 'Away') + ' vs ' + esc(home.abbr || 'Home') + '">' +

      // Score header
      '<div class="scoreline">' +
        '<span class="team away">' + esc(away.abbr || '—') + '</span>' +
        '<span class="score">' + esc(away.score != null ? away.score : 0) + '</span>' +
        '<div class="inning-block">' +
          '<span class="inning-arrow">' + inningHalf + '</span>' +
          '<span class="inning-num">' + esc(state.inning || '—') + '</span>' +
        '</div>' +
        '<span class="score">' + esc(home.score != null ? home.score : 0) + '</span>' +
        '<span class="team home">' + esc(home.abbr || '—') + '</span>' +
      '</div>' +

      // Situation
      '<div class="situation">' +
        baseDiagram(sit.runners) +
        '<span class="outs">' + esc(sit.outs != null ? sit.outs : 0) + ' out</span>' +
        leverageHtml +
      '</div>' +

      // Win probability
      '<div class="wp-labels">' +
        '<span>' + esc(away.abbr || 'Away') + ' ' + awayWP + '%</span>' +
        '<span>' + homeWP + '% ' + esc(home.abbr || 'Home') + '</span>' +
      '</div>' +
      '<div class="wp-wrap"><div class="wp-fill" style="width:' + homeWP + '%"></div></div>' +

      narrativeHtml +

      // Footer
      '<div class="footer">' +
        '<span>' + pitcherHtml + '</span>' +
        lastPlayHtml +
      '</div>' +

      // Expandable drawer
      '<div class="drawer" id="bsi-drawer">' + drawerHtml(state, apiKey) + '</div>' +

      // Embed code block
      '<div class="embed-section">' +
        '<p class="embed-label">Embed this widget</p>' +
        '<pre class="embed-code" id="bsi-embed-code" title="Click to copy">' + esc(embedCode) + '</pre>' +
        '<p class="embed-copied" id="bsi-embed-copied"></p>' +
      '</div>' +

      // Attribution
      '<p class="bsi-brand"><a href="https://blazesportsintel.com" target="_blank" rel="noopener noreferrer">Blaze Sports Intel</a></p>' +

      '</div>'
    );
  }

  // -------------------------------------------------------------------------
  // Custom Element
  // -------------------------------------------------------------------------

  class BsiLiveGame extends HTMLElement {
    constructor() {
      super();
      this._shadow = this.attachShadow({ mode: 'open' });
      this._gameId = null;
      this._apiKey = null;
      this._interval = null;
      this._state = null;
      this._drawerOpen = false;
    }

    static get observedAttributes() {
      return ['game-id', 'data-api-key'];
    }

    attributeChangedCallback(name, _old, val) {
      if (name === 'game-id') {
        this._gameId = val;
        this._restart();
      } else if (name === 'data-api-key') {
        this._apiKey = val;
      }
    }

    connectedCallback() {
      this._gameId = this.getAttribute('game-id');
      this._apiKey = this.getAttribute('data-api-key');
      this._shadow.innerHTML = skeletonTemplate();
      this._restart();
    }

    disconnectedCallback() {
      this._stop();
    }

    _restart() {
      this._stop();
      if (!this._gameId) return;
      this._fetch();
      this._interval = setInterval(() => this._fetch(), POLL_MS);
    }

    _stop() {
      if (this._interval) {
        clearInterval(this._interval);
        this._interval = null;
      }
    }

    async _fetch() {
      if (!this._gameId) return;
      try {
        var headers = { Accept: 'application/json' };
        if (this._apiKey) headers['X-BSI-Key'] = this._apiKey;

        var res = await fetch(API_BASE + '/' + encodeURIComponent(this._gameId), { headers });
        if (!res.ok) throw new Error('not found');

        this._state = await res.json();
        this._render();
      } catch (_e) {
        // Keep stale data on refresh failures; only show error on first load
        if (!this._state) {
          this._shadow.innerHTML = errorTemplate(this._gameId);
        }
      }
    }

    _render() {
      if (!this._state) return;
      // All API data passes through esc() inside liveTemplate
      this._shadow.innerHTML = liveTemplate(this._state, this._gameId, this._apiKey);
      this._attachListeners();
    }

    _attachListeners() {
      var root = this._shadow.getElementById('widget-root');
      var drawer = this._shadow.getElementById('bsi-drawer');
      var embedCode = this._shadow.getElementById('bsi-embed-code');
      var embedCopied = this._shadow.getElementById('bsi-embed-copied');

      if (root && drawer) {
        root.addEventListener('click', (e) => {
          var t = e.target;
          // Don't toggle drawer when clicking embed code or external links
          var inEmbed = embedCode && (t === embedCode || embedCode.contains(t));
          var isLink = t && t.tagName === 'A';
          if (inEmbed || isLink) return;

          this._drawerOpen = !this._drawerOpen;
          drawer.classList.toggle('open', this._drawerOpen);
        });
      }

      if (embedCode && embedCopied) {
        embedCode.addEventListener('click', async (e) => {
          e.stopPropagation();
          try {
            await navigator.clipboard.writeText(embedCode.textContent || '');
            embedCopied.textContent = '✓ Copied to clipboard';
            setTimeout(() => { embedCopied.textContent = ''; }, 2000);
          } catch (_e) {
            embedCopied.textContent = 'Copy failed — select manually';
          }
        });
      }
    }
  }

  if (!customElements.get('bsi-live-game')) {
    customElements.define('bsi-live-game', BsiLiveGame);
  }
})();
