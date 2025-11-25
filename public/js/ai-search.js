/**
 * Blaze Sports Intel - AI Search Component
 * Natural language search powered by Workers AI + Vectorize
 */

class BlazeAISearch {
  constructor(options = {}) {
    this.apiEndpoint = options.apiEndpoint || '/api/ai/search';
    this.containerSelector = options.container || '#ai-search';
    this.defaultSport = options.sport || 'all';
    this.placeholder = options.placeholder || 'Ask anything about sports...';
    this.init();
  }

  init() {
    const container = document.querySelector(this.containerSelector);
    if (!container) return;

    container.innerHTML = this.renderSearchBox();
    this.attachEvents(container);
  }

  renderSearchBox() {
    return `
      <div class="bsi-search-wrapper">
        <form class="bsi-search-form" onsubmit="return false;">
          <div class="bsi-search-input-wrapper">
            <svg class="bsi-search-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="M21 21l-4.35-4.35"></path>
            </svg>
            <input
              type="text"
              class="bsi-search-input"
              placeholder="${this.placeholder}"
              aria-label="Search sports data"
            />
            <select class="bsi-sport-select" aria-label="Select sport">
              <option value="all">All Sports</option>
              <option value="mlb">MLB</option>
              <option value="nfl">NFL</option>
              <option value="nba">NBA</option>
              <option value="ncaa">NCAA</option>
            </select>
            <button type="submit" class="bsi-search-btn">
              <span class="bsi-btn-text">Ask</span>
              <span class="bsi-btn-loading" style="display:none;">
                <svg class="bsi-spinner" viewBox="0 0 24 24" width="18" height="18">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" fill="none" stroke-dasharray="30 70" stroke-linecap="round"/>
                </svg>
              </span>
            </button>
          </div>
        </form>
        <div class="bsi-search-results" style="display:none;"></div>
        <div class="bsi-search-examples">
          <span>Try:</span>
          <button class="bsi-example-btn" data-query="Who leads the Cardinals in home runs?">Cardinals HR leader</button>
          <button class="bsi-example-btn" data-query="Texas Longhorns baseball schedule">Longhorns schedule</button>
          <button class="bsi-example-btn" data-query="NFL playoff standings">NFL playoffs</button>
        </div>
      </div>
      <style>
        .bsi-search-wrapper {
          max-width: 700px;
          margin: 0 auto;
          font-family: 'IBM Plex Sans', -apple-system, sans-serif;
        }
        .bsi-search-form {
          margin: 0;
        }
        .bsi-search-input-wrapper {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.15);
          border-radius: 12px;
          padding: 8px 12px;
          transition: all 0.2s ease;
        }
        .bsi-search-input-wrapper:focus-within {
          border-color: #BF5700;
          box-shadow: 0 0 0 3px rgba(191,87,0,0.2);
        }
        .bsi-search-icon {
          color: rgba(255,255,255,0.5);
          flex-shrink: 0;
        }
        .bsi-search-input {
          flex: 1;
          background: transparent;
          border: none;
          color: white;
          font-size: 16px;
          outline: none;
          min-width: 0;
        }
        .bsi-search-input::placeholder {
          color: rgba(255,255,255,0.4);
        }
        .bsi-sport-select {
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.2);
          border-radius: 6px;
          color: white;
          padding: 6px 10px;
          font-size: 13px;
          cursor: pointer;
          outline: none;
        }
        .bsi-sport-select option {
          background: #1a1a1a;
          color: white;
        }
        .bsi-search-btn {
          background: linear-gradient(135deg, #BF5700, #C41E3A);
          border: none;
          border-radius: 8px;
          color: white;
          padding: 10px 20px;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        .bsi-search-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(191,87,0,0.4);
        }
        .bsi-search-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        .bsi-spinner {
          animation: bsi-spin 1s linear infinite;
        }
        @keyframes bsi-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .bsi-search-results {
          margin-top: 20px;
          padding: 20px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
        }
        .bsi-answer {
          color: rgba(255,255,255,0.95);
          line-height: 1.7;
          margin-bottom: 16px;
        }
        .bsi-sources {
          border-top: 1px solid rgba(255,255,255,0.1);
          padding-top: 12px;
          margin-top: 12px;
        }
        .bsi-sources-title {
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: rgba(255,255,255,0.5);
          margin-bottom: 8px;
        }
        .bsi-source {
          font-size: 13px;
          color: rgba(255,255,255,0.6);
          padding: 6px 0;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .bsi-source:last-child {
          border-bottom: none;
        }
        .bsi-source-score {
          color: #BF5700;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
        }
        .bsi-search-examples {
          margin-top: 12px;
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        .bsi-search-examples span {
          color: rgba(255,255,255,0.4);
          font-size: 13px;
        }
        .bsi-example-btn {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 16px;
          color: rgba(255,255,255,0.7);
          padding: 4px 12px;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .bsi-example-btn:hover {
          background: rgba(191,87,0,0.2);
          border-color: rgba(191,87,0,0.4);
          color: white;
        }
        .bsi-error {
          color: #ff6b6b;
          padding: 12px;
          background: rgba(255,107,107,0.1);
          border-radius: 8px;
        }
        .bsi-cached-badge {
          display: inline-block;
          background: rgba(76,175,80,0.2);
          color: #4CAF50;
          font-size: 10px;
          padding: 2px 6px;
          border-radius: 4px;
          margin-left: 8px;
        }
      </style>
    `;
  }

  attachEvents(container) {
    const form = container.querySelector('.bsi-search-form');
    const input = container.querySelector('.bsi-search-input');
    const select = container.querySelector('.bsi-sport-select');
    const btn = container.querySelector('.bsi-search-btn');
    const results = container.querySelector('.bsi-search-results');
    const examples = container.querySelectorAll('.bsi-example-btn');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const query = input.value.trim();
      if (!query) return;

      await this.search(query, select.value, btn, results);
    });

    examples.forEach(example => {
      example.addEventListener('click', async () => {
        const query = example.dataset.query;
        input.value = query;
        await this.search(query, select.value, btn, results);
      });
    });
  }

  async search(query, sport, btn, resultsContainer) {
    const btnText = btn.querySelector('.bsi-btn-text');
    const btnLoading = btn.querySelector('.bsi-btn-loading');

    // Show loading state
    btn.disabled = true;
    btnText.style.display = 'none';
    btnLoading.style.display = 'inline';
    resultsContainer.style.display = 'block';
    resultsContainer.innerHTML = '<div style="color:rgba(255,255,255,0.5);text-align:center;">Searching...</div>';

    try {
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, sport, limit: 5, includeContext: true })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Search failed');
      }

      resultsContainer.innerHTML = this.renderResults(data);

    } catch (error) {
      resultsContainer.innerHTML = `<div class="bsi-error">⚠️ ${error.message}</div>`;
    } finally {
      btn.disabled = false;
      btnText.style.display = 'inline';
      btnLoading.style.display = 'none';
    }
  }

  renderResults(data) {
    const cachedBadge = data.cached ? '<span class="bsi-cached-badge">cached</span>' : '';

    let sourcesHtml = '';
    if (data.sources && data.sources.length > 0) {
      sourcesHtml = `
        <div class="bsi-sources">
          <div class="bsi-sources-title">Sources</div>
          ${data.sources.map(s => `
            <div class="bsi-source">
              <strong>${s.title}</strong>
              <span class="bsi-source-score">${(s.score * 100).toFixed(1)}% match</span>
            </div>
          `).join('')}
        </div>
      `;
    }

    return `
      <div class="bsi-answer">
        ${this.formatAnswer(data.answer)}
        ${cachedBadge}
      </div>
      ${sourcesHtml}
      <div style="font-size:11px;color:rgba(255,255,255,0.3);margin-top:12px;">
        ${new Date(data.timestamp).toLocaleString('en-US', { timeZone: 'America/Chicago' })} CT
      </div>
    `;
  }

  formatAnswer(text) {
    // Basic markdown-like formatting
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>');
  }
}

// Auto-initialize if container exists
document.addEventListener('DOMContentLoaded', () => {
  if (document.querySelector('#ai-search')) {
    window.blazeSearch = new BlazeAISearch();
  }
});

// Export for manual initialization
window.BlazeAISearch = BlazeAISearch;
