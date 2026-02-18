/**
 * BSI Live Game Widget
 * 
 * Self-contained Web Component for embedding live baseball game data.
 * No external dependencies — works anywhere.
 * 
 * Usage:
 *   <script src="https://blazesportsintel.com/widget.js" data-game-id="GAME_ID"></script>
 * 
 * Or:
 *   <bsi-live-game data-game-id="GAME_ID" tier="pro"></bsi-live-game>
 */

(function() {
  'use strict';

  // =============================================================================
  // Web Component Definition
  // =============================================================================

  class BSILiveGame extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this._gameId = null;
      this._tier = null;
      this._pollInterval = null;
      this._expanded = false;
      this._data = null;
      this._isLoading = true;
    }

    static get observedAttributes() {
      return ['data-game-id', 'tier'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
      if (name === 'data-game-id') {
        this._gameId = newValue;
        if (this.isConnected) {
          this._startPolling();
        }
      } else if (name === 'tier') {
        this._tier = newValue;
        this._render();
      }
    }

    connectedCallback() {
      this._injectStyles();
      this._render();
      this._startPolling();
    }

    disconnectedCallback() {
      this._stopPolling();
    }

    _startPolling() {
      this._stopPolling();
      if (!this._gameId) return;
      
      // Initial fetch
      this._fetchData();
      
      // Poll every 15 seconds
      this._pollInterval = setInterval(() => {
        this._fetchData();
      }, 15000);
    }

    _stopPolling() {
      if (this._pollInterval) {
        clearInterval(this._pollInterval);
        this._pollInterval = null;
      }
    }

    async _fetchData() {
      if (!this._gameId) return;
      
      try {
        const response = await fetch(`https://blazesportsintel.com/api/live/${this._gameId}`);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const newData = await response.json();
        
        // Check if data changed (trigger flash animation)
        const dataChanged = this._data && (
          this._data.home.score !== newData.home.score ||
          this._data.away.score !== newData.away.score ||
          this._data.inning !== newData.inning ||
          this._data.half !== newData.half
        );
        
        this._data = newData;
        this._isLoading = false;
        this._render();
        
        if (dataChanged) {
          this._flashUpdate();
        }
      } catch (err) {
        console.error('[BSI Widget] Fetch error:', err);
        // Keep showing last data or skeleton
        if (!this._data) {
          this._isLoading = true;
          this._render();
        }
      }
    }

    _flashUpdate() {
      const scores = this.shadowRoot.querySelectorAll('.score');
      scores.forEach(el => {
        el.classList.add('flash');
        setTimeout(() => el.classList.remove('flash'), 300);
      });
    }

    _toggleExpanded() {
      this._expanded = !this._expanded;
      this._render();
    }

    _copyEmbed() {
      const embedCode = `<script src="https://blazesportsintel.com/widget.js" data-game-id="${this._gameId}"><\/script>`;
      
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(embedCode).then(() => {
          const btn = this.shadowRoot.querySelector('.copy-btn');
          if (btn) {
            const original = btn.textContent;
            btn.textContent = 'Copied!';
            btn.classList.add('copied');
            setTimeout(() => {
              btn.textContent = original;
              btn.classList.remove('copied');
            }, 2000);
          }
        }).catch(() => {
          // Fallback: just show message
          alert('Embed code: ' + embedCode);
        });
      } else {
        // Old browser fallback
        alert('Embed code: ' + embedCode);
      }
    }

    _injectStyles() {
      const style = document.createElement('style');
      style.textContent = `
        :host {
          display: block;
          font-family: system-ui, -apple-system, sans-serif;
          max-width: 600px;
          margin: 0 auto;
        }

        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        .card {
          background: #0D0D0D;
          border: 1px solid rgba(245, 240, 235, 0.08);
          border-radius: 8px;
          box-shadow: 0 4px 24px rgba(0, 0, 0, 0.6);
          overflow: hidden;
          cursor: pointer;
          transition: box-shadow 0.3s ease;
        }

        .card:hover {
          box-shadow: 0 6px 32px rgba(0, 0, 0, 0.8);
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          background: linear-gradient(135deg, rgba(191, 87, 0, 0.1) 0%, rgba(13, 13, 13, 0) 100%);
          border-bottom: 1px solid rgba(245, 240, 235, 0.05);
        }

        .team {
          display: flex;
          align-items: center;
          gap: 12px;
          font-family: 'Oswald', system-ui, sans-serif;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .team-name {
          color: #F5F0EB;
          font-size: 18px;
        }

        .score {
          color: #BF5700;
          font-size: 28px;
          font-weight: 700;
          transition: color 0.3s ease, background 0.3s ease;
        }

        .score.flash {
          color: #FF6B35;
          text-shadow: 0 0 8px rgba(255, 107, 53, 0.6);
        }

        .inning {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #888;
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .inning-arrow {
          color: #BF5700;
          font-size: 16px;
        }

        .situation-box {
          padding: 16px 20px;
          border-bottom: 1px solid rgba(245, 240, 235, 0.05);
        }

        .situation-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
        }

        .bases-outs {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .bases {
          display: grid;
          grid-template-columns: 18px 18px;
          grid-template-rows: 18px 18px;
          gap: 2px;
          transform: rotate(45deg);
        }

        .base {
          width: 18px;
          height: 18px;
          background: #333;
          border: 1px solid rgba(245, 240, 235, 0.1);
        }

        .base.occupied {
          background: #BF5700;
          box-shadow: 0 0 8px rgba(191, 87, 0, 0.6);
        }

        .base:nth-child(1) { grid-column: 2; grid-row: 1; } /* 2B */
        .base:nth-child(2) { grid-column: 1; grid-row: 2; } /* 3B */
        .base:nth-child(3) { grid-column: 2; grid-row: 2; } /* 1B */

        .outs {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #888;
          font-size: 14px;
        }

        .out-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #333;
          border: 1px solid rgba(245, 240, 235, 0.1);
        }

        .out-dot.filled {
          background: #BF5700;
        }

        .leverage-badge {
          padding: 4px 10px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .leverage-LOW {
          background: #333;
          color: #888;
        }

        .leverage-MEDIUM {
          background: #5C4A00;
          color: #FFB800;
        }

        .leverage-HIGH {
          background: #5C2500;
          color: #BF5700;
        }

        .leverage-CRITICAL {
          background: #3D0000;
          color: #FF6B35;
          animation: pulse 1.2s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }

        .situation-text {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-style: italic;
          color: #CCC;
          font-size: 15px;
          line-height: 1.5;
        }

        .win-prob-box {
          padding: 16px 20px;
          border-bottom: 1px solid rgba(245, 240, 235, 0.05);
        }

        .win-prob-bar {
          position: relative;
          height: 24px;
          background: #333;
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 8px;
        }

        .win-prob-fill {
          position: absolute;
          top: 0;
          left: 0;
          height: 100%;
          background: #BF5700;
          transition: width 0.6s ease;
        }

        .win-prob-labels {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .win-prob-label {
          color: #888;
        }

        .footer-box {
          padding: 12px 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 13px;
          color: #888;
          border-bottom: 1px solid rgba(245, 240, 235, 0.05);
        }

        .pitcher-info {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .pitcher-stat {
          color: #BF5700;
          font-weight: 600;
        }

        .last-play {
          color: #CCC;
          font-style: italic;
        }

        .expand-section {
          background: rgba(13, 13, 13, 0.5);
        }

        .expand-btn {
          width: 100%;
          padding: 12px 20px;
          background: transparent;
          border: none;
          color: #BF5700;
          font-size: 13px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          cursor: pointer;
          transition: background 0.2s ease;
          text-align: center;
        }

        .expand-btn:hover {
          background: rgba(191, 87, 0, 0.1);
        }

        .expand-content {
          padding: 16px 20px;
        }

        .pitch-list {
          list-style: none;
          margin-bottom: 16px;
        }

        .pitch-item {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid rgba(245, 240, 235, 0.05);
          font-size: 13px;
        }

        .pitch-item:last-child {
          border-bottom: none;
        }

        .pitch-type {
          color: #BF5700;
          font-weight: 700;
          font-family: 'JetBrains Mono', monospace;
          width: 40px;
        }

        .pitch-velocity {
          color: #888;
          width: 60px;
        }

        .pitch-result {
          color: #CCC;
          flex: 1;
          text-align: right;
        }

        .upsell-card {
          background: linear-gradient(135deg, rgba(191, 87, 0, 0.1) 0%, rgba(13, 13, 13, 0) 100%);
          border: 1px solid rgba(191, 87, 0, 0.3);
          border-radius: 6px;
          padding: 20px;
          text-align: center;
        }

        .upsell-title {
          color: #F5F0EB;
          font-size: 16px;
          font-weight: 700;
          margin-bottom: 8px;
        }

        .upsell-text {
          color: #888;
          font-size: 14px;
          margin-bottom: 16px;
        }

        .upsell-link {
          display: inline-block;
          padding: 10px 24px;
          background: #BF5700;
          color: #FFF;
          text-decoration: none;
          border-radius: 4px;
          font-weight: 600;
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          transition: background 0.2s ease;
        }

        .upsell-link:hover {
          background: #FF6B35;
        }

        .branding {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 20px;
          background: rgba(13, 13, 13, 0.8);
        }

        .copy-embed {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .embed-code {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          color: #666;
          background: rgba(255, 255, 255, 0.03);
          padding: 4px 8px;
          border-radius: 3px;
          border: 1px solid rgba(245, 240, 235, 0.05);
          user-select: all;
        }

        .copy-btn {
          padding: 4px 10px;
          background: rgba(191, 87, 0, 0.2);
          border: 1px solid rgba(191, 87, 0, 0.4);
          color: #BF5700;
          border-radius: 3px;
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .copy-btn:hover {
          background: rgba(191, 87, 0, 0.3);
          border-color: rgba(191, 87, 0, 0.6);
        }

        .copy-btn.copied {
          background: rgba(191, 87, 0, 0.4);
          color: #FF6B35;
        }

        .bsi-link {
          font-family: 'JetBrains Mono', monospace;
          font-size: 12px;
          color: #666;
          text-decoration: none;
          transition: color 0.2s ease;
        }

        .bsi-link:hover {
          color: #BF5700;
        }

        /* Skeleton loader */
        .skeleton {
          background: linear-gradient(90deg, #1a1a1a 25%, #2a2a2a 50%, #1a1a1a 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
          border-radius: 4px;
        }

        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        .skeleton-header {
          height: 60px;
          margin-bottom: 1px;
        }

        .skeleton-situation {
          height: 80px;
          margin-bottom: 1px;
        }

        .skeleton-bar {
          height: 50px;
          margin-bottom: 1px;
        }

        .skeleton-footer {
          height: 40px;
        }
      `;
      this.shadowRoot.appendChild(style);
    }

    _render() {
      if (!this.shadowRoot) return;

      // Clear and rebuild
      const existingStyle = this.shadowRoot.querySelector('style');
      this.shadowRoot.innerHTML = '';
      if (existingStyle) {
        this.shadowRoot.appendChild(existingStyle);
      }

      const container = document.createElement('div');
      container.className = 'card';

      if (this._isLoading || !this._data) {
        container.innerHTML = `
          <div class="skeleton skeleton-header"></div>
          <div class="skeleton skeleton-situation"></div>
          <div class="skeleton skeleton-bar"></div>
          <div class="skeleton skeleton-footer"></div>
        `;
      } else {
        const data = this._data;
        
        // Determine bases
        const runners = data.situation?.runners || [];
        const has1B = runners.includes('1B');
        const has2B = runners.includes('2B');
        const has3B = runners.includes('3B');

        // Determine outs
        const outs = data.situation?.outs || 0;

        // Leverage badge
        const leverage = data.situation?.leverage || 'LOW';

        // Win probability
        const homeWinProb = (data.win_probability?.home || 0.5) * 100;
        const awayWinProb = (data.win_probability?.away || 0.5) * 100;

        // Inning arrow
        const inningArrow = data.half === 'top' ? '▲' : '▼';
        const halfText = data.half === 'top' ? 'TOP' : 'BOT';

        container.innerHTML = `
          <div class="header">
            <div class="team">
              <span class="team-name">${data.away.abbr || 'AWAY'}</span>
              <span class="score">${data.away.score}</span>
            </div>
            <div class="inning">
              <span class="inning-arrow">${inningArrow}</span>
              <span>${halfText} ${data.inning}</span>
            </div>
            <div class="team">
              <span class="score">${data.home.score}</span>
              <span class="team-name">${data.home.abbr || 'HOME'}</span>
            </div>
          </div>

          <div class="situation-box">
            <div class="situation-top">
              <div class="bases-outs">
                <div class="bases">
                  <div class="base ${has2B ? 'occupied' : ''}"></div>
                  <div class="base ${has3B ? 'occupied' : ''}"></div>
                  <div class="base ${has1B ? 'occupied' : ''}"></div>
                </div>
                <div class="outs">
                  <div class="out-dot ${outs >= 1 ? 'filled' : ''}"></div>
                  <div class="out-dot ${outs >= 2 ? 'filled' : ''}"></div>
                  <div class="out-dot ${outs >= 3 ? 'filled' : ''}"></div>
                </div>
              </div>
              <div class="leverage-badge leverage-${leverage}">${leverage}</div>
            </div>
            <div class="situation-text">
              ${data.situation?.description || 'Game in progress...'}
            </div>
          </div>

          <div class="win-prob-box">
            <div class="win-prob-bar">
              <div class="win-prob-fill" style="width: ${homeWinProb}%"></div>
            </div>
            <div class="win-prob-labels">
              <span class="win-prob-label">${data.home.abbr} ${Math.round(homeWinProb)}%</span>
              <span class="win-prob-label">${data.away.abbr} ${Math.round(awayWinProb)}%</span>
            </div>
          </div>

          <div class="footer-box">
            <div class="pitcher-info">
              <span>${data.current_pitcher?.name || '—'}</span>
              <span class="pitcher-stat">${data.current_pitcher?.pitch_count || 0} pitches</span>
              <span class="pitcher-stat">${data.current_pitcher?.era?.toFixed(2) || '0.00'} ERA</span>
            </div>
            <div class="last-play">
              ${data.last_play || '—'}
            </div>
          </div>

          <div class="expand-section">
            <button class="expand-btn" id="expand-btn">
              ${this._expanded ? 'Hide pitch data ▲' : 'Show pitch data ▼'}
            </button>
            ${this._expanded ? this._renderExpandedContent(data) : ''}
          </div>

          <div class="branding">
            <div class="copy-embed">
              <code class="embed-code">&lt;script src="https://blazesportsintel.com/widget.js" data-game-id="${this._gameId}"&gt;&lt;/script&gt;</code>
              <button class="copy-btn" id="copy-btn">Copy</button>
            </div>
            <a href="https://blazesportsintel.com" target="_blank" class="bsi-link">// BSI</a>
          </div>
        `;

        // Add event listeners
        const expandBtn = container.querySelector('#expand-btn');
        if (expandBtn) {
          expandBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this._toggleExpanded();
          });
        }

        const copyBtn = container.querySelector('#copy-btn');
        if (copyBtn) {
          copyBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this._copyEmbed();
          });
        }
      }

      this.shadowRoot.appendChild(container);
    }

    _renderExpandedContent(data) {
      // Check if pro tier
      if (this._tier === 'pro') {
        const pitches = data.recent_pitches || [];
        if (pitches.length === 0) {
          return `
            <div class="expand-content">
              <p style="color: #888; text-align: center; font-size: 13px;">No recent pitch data available</p>
            </div>
          `;
        }

        const pitchItems = pitches.map(p => `
          <li class="pitch-item">
            <span class="pitch-type">${p.type}</span>
            <span class="pitch-velocity">${p.velocity} mph</span>
            <span class="pitch-result">${p.result}</span>
          </li>
        `).join('');

        return `
          <div class="expand-content">
            <ul class="pitch-list">
              ${pitchItems}
            </ul>
          </div>
        `;
      } else {
        // Upsell card
        return `
          <div class="expand-content">
            <div class="upsell-card">
              <div class="upsell-title">Unlock Pitch-by-Pitch Data</div>
              <div class="upsell-text">Get live pitch tracking, velocities, and outcomes with BSI Pro</div>
              <a href="https://blazesportsintel.com/pro" target="_blank" class="upsell-link">Get BSI Pro — $12/mo</a>
            </div>
          </div>
        `;
      }
    }
  }

  // Register the custom element
  if (!customElements.get('bsi-live-game')) {
    customElements.define('bsi-live-game', BSILiveGame);
  }

  // =============================================================================
  // Auto-initialization
  // =============================================================================

  function initializeWidgets() {
    // Find all script tags with data-game-id
    const scripts = document.querySelectorAll('script[data-game-id]');
    scripts.forEach(script => {
      const gameId = script.getAttribute('data-game-id');
      const tier = script.getAttribute('data-tier');
      
      if (!gameId) return;

      // Check if we already created an element for this script
      if (script.hasAttribute('data-initialized')) return;
      script.setAttribute('data-initialized', 'true');

      // Create the widget element
      const widget = document.createElement('bsi-live-game');
      widget.setAttribute('data-game-id', gameId);
      if (tier) widget.setAttribute('tier', tier);

      // Insert before the script tag
      script.parentNode.insertBefore(widget, script);
    });
  }

  // Run initialization when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeWidgets);
  } else {
    initializeWidgets();
  }

})();
