class BlazeCopilotWidget {
    constructor() {
        if (typeof window === 'undefined' || document.body == null) {
            return;
        }

        this.isOpen = false;
        this.isLoading = false;
        this.abortController = null;
        this.recentQueriesKey = 'blazeCopilotRecentQueries';
        this.maxRecentQueries = 5;

        this.injectStyles();
        this.createWidget();
        this.restoreRecentQueries();
    }

    injectStyles() {
        if (document.getElementById('blaze-copilot-widget-styles')) {
            return;
        }

        const style = document.createElement('style');
        style.id = 'blaze-copilot-widget-styles';
        style.textContent = `
            .blaze-copilot-widget {
                position: fixed;
                bottom: 20px;
                left: 20px;
                z-index: 9998;
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            }

            .blaze-copilot-launcher {
                display: inline-flex;
                align-items: center;
                gap: 10px;
                border-radius: 999px;
                border: 1px solid rgba(255, 107, 53, 0.35);
                padding: 10px 18px;
                color: #ffffff;
                background: rgba(26, 26, 26, 0.92);
                backdrop-filter: blur(12px);
                box-shadow: 0 10px 35px rgba(255, 107, 53, 0.25);
                cursor: pointer;
                transition: transform 0.2s ease, box-shadow 0.3s ease, background 0.3s ease;
            }

            .blaze-copilot-launcher:hover,
            .blaze-copilot-launcher:focus-visible {
                transform: translateY(-2px);
                background: rgba(26, 26, 26, 0.98);
                box-shadow: 0 16px 40px rgba(255, 107, 53, 0.35);
                outline: none;
            }

            .blaze-copilot-launcher-badge {
                width: 36px;
                height: 36px;
                border-radius: 50%;
                background: linear-gradient(135deg, #ff6b35 0%, #f7931e 100%);
                display: grid;
                place-items: center;
                font-weight: 700;
                font-size: 14px;
            }

            .blaze-copilot-panel {
                position: fixed;
                left: 20px;
                bottom: 90px;
                width: 360px;
                max-height: min(70vh, 540px);
                display: flex;
                flex-direction: column;
                background: rgba(15, 15, 15, 0.95);
                border-radius: 18px;
                border: 1px solid rgba(255, 255, 255, 0.12);
                box-shadow: 0 25px 60px rgba(0, 0, 0, 0.55);
                padding: 0;
                transform: translateY(12px);
                opacity: 0;
                pointer-events: none;
                transition: transform 0.25s ease, opacity 0.25s ease;
            }

            .blaze-copilot-panel.open {
                opacity: 1;
                transform: translateY(0);
                pointer-events: auto;
            }

            .blaze-copilot-header {
                padding: 18px 20px 12px;
                border-bottom: 1px solid rgba(255, 255, 255, 0.08);
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                gap: 16px;
            }

            .blaze-copilot-title {
                margin: 0;
                font-size: 18px;
                font-weight: 700;
                background: linear-gradient(135deg, #ffffff 0%, #f3f3f3 100%);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
            }

            .blaze-copilot-subtitle {
                margin: 4px 0 0;
                font-size: 13px;
                color: rgba(255, 255, 255, 0.65);
            }

            .blaze-copilot-close {
                background: none;
                border: 0;
                color: rgba(255, 255, 255, 0.55);
                cursor: pointer;
                font-size: 18px;
                border-radius: 6px;
                padding: 4px 6px;
                transition: background 0.2s ease, color 0.2s ease;
            }

            .blaze-copilot-close:hover,
            .blaze-copilot-close:focus-visible {
                background: rgba(255, 255, 255, 0.08);
                color: #ffffff;
                outline: none;
            }

            .blaze-copilot-form {
                padding: 16px 20px;
                display: flex;
                flex-direction: column;
                gap: 12px;
            }

            .blaze-copilot-input-group {
                display: flex;
                gap: 10px;
            }

            .blaze-copilot-input-group input[type="search"] {
                flex: 1;
                min-width: 0;
                padding: 10px 14px;
                border-radius: 12px;
                border: 1px solid rgba(255, 255, 255, 0.12);
                background: rgba(26, 26, 26, 0.95);
                color: #ffffff;
            }

            .blaze-copilot-input-group input[type="search"]:focus-visible {
                border-color: rgba(255, 107, 53, 0.75);
                outline: none;
                box-shadow: 0 0 0 3px rgba(255, 107, 53, 0.2);
            }

            .blaze-copilot-input-group button[type="submit"] {
                padding: 10px 16px;
                border: none;
                border-radius: 12px;
                background: linear-gradient(135deg, #ff6b35 0%, #f7931e 100%);
                color: #0f0f0f;
                font-weight: 700;
                cursor: pointer;
                transition: transform 0.2s ease, box-shadow 0.3s ease;
            }

            .blaze-copilot-input-group button[type="submit"]:hover,
            .blaze-copilot-input-group button[type="submit"]:focus-visible {
                transform: translateY(-1px);
                box-shadow: 0 12px 20px rgba(255, 107, 53, 0.3);
                outline: none;
            }

            .blaze-copilot-select {
                width: 100%;
                padding: 10px 14px;
                border-radius: 12px;
                border: 1px solid rgba(255, 255, 255, 0.12);
                background: rgba(26, 26, 26, 0.95);
                color: #ffffff;
            }

            .blaze-copilot-status {
                padding: 0 20px 14px;
                min-height: 22px;
                font-size: 13px;
                color: rgba(255, 255, 255, 0.7);
            }

            .blaze-copilot-status[aria-live="assertive"] {
                color: #ff8686;
            }

            .blaze-copilot-results {
                padding: 0 20px 20px;
                overflow-y: auto;
                flex: 1;
                display: flex;
                flex-direction: column;
                gap: 12px;
            }

            .blaze-copilot-result {
                border-radius: 14px;
                padding: 14px;
                background: rgba(26, 26, 26, 0.9);
                border: 1px solid rgba(255, 255, 255, 0.08);
                display: grid;
                gap: 6px;
            }

            .blaze-copilot-result h4 {
                margin: 0;
                font-size: 15px;
                font-weight: 700;
                color: #ffffff;
            }

            .blaze-copilot-meta,
            .blaze-copilot-score {
                font-size: 13px;
                color: rgba(255, 255, 255, 0.65);
            }

            .blaze-copilot-empty {
                margin: 0;
                font-size: 13px;
                color: rgba(255, 255, 255, 0.55);
                text-align: center;
                padding: 20px;
            }

            .blaze-copilot-recent {
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
            }

            .blaze-copilot-recent button {
                border: 1px solid rgba(255, 255, 255, 0.12);
                background: rgba(20, 20, 20, 0.9);
                color: rgba(255, 255, 255, 0.75);
                border-radius: 999px;
                padding: 6px 12px;
                font-size: 12px;
                cursor: pointer;
            }

            .blaze-copilot-recent button:hover,
            .blaze-copilot-recent button:focus-visible {
                border-color: rgba(255, 107, 53, 0.6);
                color: #ffffff;
                outline: none;
            }

            @media (max-width: 600px) {
                .blaze-copilot-widget,
                .blaze-copilot-panel {
                    left: 50%;
                    transform: translate(-50%, 0);
                }

                .blaze-copilot-panel,
                .blaze-copilot-panel.open {
                    width: min(94vw, 420px);
                    bottom: 80px;
                }
            }
        `;

        document.head.appendChild(style);
    }

    createWidget() {
        this.widget = document.createElement('div');
        this.widget.className = 'blaze-copilot-widget';
        this.widget.setAttribute('aria-live', 'polite');

        this.launcher = document.createElement('button');
        this.launcher.type = 'button';
        this.launcher.className = 'blaze-copilot-launcher';
        this.launcher.setAttribute('aria-haspopup', 'dialog');
        this.launcher.setAttribute('aria-expanded', 'false');
        this.launcher.setAttribute('aria-controls', 'blazeCopilotPanel');
        this.launcher.innerHTML = `
            <span class="blaze-copilot-launcher-badge" aria-hidden="true">BI</span>
            <span class="blaze-copilot-launcher-text">Copilot Intel</span>
        `;

        this.panel = document.createElement('section');
        this.panel.id = 'blazeCopilotPanel';
        this.panel.className = 'blaze-copilot-panel';
        this.panel.setAttribute('role', 'dialog');
        this.panel.setAttribute('aria-modal', 'false');
        this.panel.setAttribute('aria-label', 'Blaze Sports Intel Copilot Search');

        const header = document.createElement('header');
        header.className = 'blaze-copilot-header';

        const headingWrapper = document.createElement('div');
        const title = document.createElement('h3');
        title.className = 'blaze-copilot-title';
        title.textContent = 'Copilot Search';
        const subtitle = document.createElement('p');
        subtitle.className = 'blaze-copilot-subtitle';
        subtitle.textContent = 'Query Blaze Intelligence datasets in natural language.';

        headingWrapper.appendChild(title);
        headingWrapper.appendChild(subtitle);

        const closeBtn = document.createElement('button');
        closeBtn.type = 'button';
        closeBtn.className = 'blaze-copilot-close';
        closeBtn.setAttribute('aria-label', 'Close Copilot widget');
        closeBtn.innerHTML = '&times;';

        header.appendChild(headingWrapper);
        header.appendChild(closeBtn);

        const form = document.createElement('form');
        form.className = 'blaze-copilot-form';
        form.noValidate = true;

        const inputGroup = document.createElement('div');
        inputGroup.className = 'blaze-copilot-input-group';

        this.queryInput = document.createElement('input');
        this.queryInput.type = 'search';
        this.queryInput.name = 'query';
        this.queryInput.placeholder = 'Ask about recent performances…';
        this.queryInput.autocomplete = 'off';
        this.queryInput.required = true;
        this.queryInput.setAttribute('aria-label', 'Search games and insights');

        const submitButton = document.createElement('button');
        submitButton.type = 'submit';
        submitButton.textContent = 'Search';

        inputGroup.appendChild(this.queryInput);
        inputGroup.appendChild(submitButton);

        this.sportSelect = document.createElement('select');
        this.sportSelect.className = 'blaze-copilot-select';
        this.sportSelect.name = 'sport';
        this.sportSelect.setAttribute('aria-label', 'Filter by sport');

        const sports = [
            { label: 'All Sports', value: '' },
            { label: 'Baseball (MLB)', value: 'MLB' },
            { label: 'Football (NFL)', value: 'NFL' },
            { label: 'Basketball (CBB)', value: 'CBB' },
            { label: 'Track & Field (TF)', value: 'TF' }
        ];

        sports.forEach(({ label, value }) => {
            const option = document.createElement('option');
            option.value = value;
            option.textContent = label;
            this.sportSelect.appendChild(option);
        });

        this.status = document.createElement('p');
        this.status.className = 'blaze-copilot-status';
        this.status.id = 'blazeCopilotStatus';
        this.status.setAttribute('role', 'status');
        this.status.setAttribute('aria-live', 'polite');

        this.results = document.createElement('div');
        this.results.className = 'blaze-copilot-results';
        this.results.id = 'blazeCopilotResults';

        this.recentContainer = document.createElement('div');
        this.recentContainer.className = 'blaze-copilot-recent';
        this.recentContainer.setAttribute('aria-label', 'Recent Copilot queries');
        this.recentContainer.hidden = true;

        const recentWrapper = document.createElement('div');
        recentWrapper.appendChild(this.recentContainer);

        form.appendChild(inputGroup);
        form.appendChild(this.sportSelect);
        form.appendChild(recentWrapper);

        this.panel.appendChild(header);
        this.panel.appendChild(form);
        this.panel.appendChild(this.status);
        this.panel.appendChild(this.results);

        this.widget.appendChild(this.launcher);
        this.widget.appendChild(this.panel);

        document.body.appendChild(this.widget);

        this.launcher.addEventListener('click', () => this.togglePanel());
        closeBtn.addEventListener('click', () => this.closePanel());
        form.addEventListener('submit', (event) => {
            event.preventDefault();
            this.handleSearch();
        });
    }

    togglePanel() {
        this.isOpen = !this.isOpen;
        this.panel.classList.toggle('open', this.isOpen);
        this.launcher.setAttribute('aria-expanded', this.isOpen ? 'true' : 'false');

        if (this.isOpen) {
            setTimeout(() => {
                this.queryInput.focus();
            }, 120);
        }
    }

    closePanel() {
        if (!this.isOpen) {
            return;
        }

        this.isOpen = false;
        this.panel.classList.remove('open');
        this.launcher.setAttribute('aria-expanded', 'false');
        this.launcher.focus();
    }

    handleSearch() {
        const query = this.queryInput.value.trim();
        const sport = this.sportSelect.value;

        if (query.length === 0) {
            this.setStatus('Please enter a question or search phrase.', true);
            return;
        }

        this.saveRecentQuery(query, sport);
        this.fetchResults(query, sport);
    }

    async fetchResults(query, sport) {
        if (this.isLoading) {
            this.cancelOngoingRequest();
        }

        this.isLoading = true;
        this.setStatus('Searching Blaze Intelligence datasets…', false);
        this.results.textContent = '';

        const controller = new AbortController();
        this.abortController = controller;

        try {
            const url = new URL('/api/copilot/search', window.location.origin);
            url.searchParams.set('query', query);
            if (sport) {
                url.searchParams.set('sport', sport);
            }

            const response = await fetch(url.toString(), {
                method: 'GET',
                headers: {
                    Accept: 'application/json'
                },
                signal: controller.signal
            });

            if (!response.ok) {
                throw new Error(`Search failed (${response.status})`);
            }

            const data = await response.json();
            this.renderResults(data);
            this.setStatus(`Showing ${data.resultsCount ?? (data.results ? data.results.length : 0)} result(s).`, false);
        } catch (error) {
            if (error.name === 'AbortError') {
                return;
            }

            console.error('Copilot search error:', error);
            this.setStatus('Unable to retrieve Copilot results right now. Please try again shortly.', true);
            this.renderEmptyState();
        } finally {
            this.isLoading = false;
            this.abortController = null;
        }
    }

    renderResults(data) {
        const results = Array.isArray(data?.results) ? data.results : [];

        if (results.length === 0) {
            this.renderEmptyState();
            return;
        }

        this.results.innerHTML = '';

        results.forEach((result) => {
            const card = document.createElement('article');
            card.className = 'blaze-copilot-result';

            const heading = document.createElement('h4');
            const homeTeam = this.safeText(result.home_team_name);
            const awayTeam = this.safeText(result.away_team_name);
            heading.textContent = `${awayTeam} at ${homeTeam}`;
            card.appendChild(heading);

            const meta = document.createElement('p');
            meta.className = 'blaze-copilot-meta';
            const date = result.game_date ? new Date(result.game_date).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            }) : 'TBD';
            const sportLabel = result.sport ? result.sport.toUpperCase() : 'ALL';
            meta.textContent = `${sportLabel} • ${date} • ${result.status ?? 'Status unknown'}`;
            card.appendChild(meta);

            const score = document.createElement('p');
            score.className = 'blaze-copilot-score';
            const homeScore = this.formatScore(result.home_score);
            const awayScore = this.formatScore(result.away_score);
            score.textContent = `Score: ${awayTeam} ${awayScore} — ${homeTeam} ${homeScore}`;
            card.appendChild(score);

            if (result.matchReason) {
                const reason = document.createElement('p');
                reason.className = 'blaze-copilot-meta';
                reason.textContent = `Why it matched: ${result.matchReason}`;
                card.appendChild(reason);
            }

            const relevance = typeof result.relevanceScore === 'number'
                ? `${Math.round(result.relevanceScore * 100)}% relevance`
                : null;

            if (relevance) {
                const relevanceEl = document.createElement('p');
                relevanceEl.className = 'blaze-copilot-meta';
                relevanceEl.textContent = relevance;
                card.appendChild(relevanceEl);
            }

            this.results.appendChild(card);
        });
    }

    renderEmptyState() {
        this.results.innerHTML = '';
        const message = document.createElement('p');
        message.className = 'blaze-copilot-empty';
        message.textContent = 'No Copilot insights yet. Try asking about a team, matchup, or performance trend.';
        this.results.appendChild(message);
    }

    setStatus(message, isError) {
        this.status.textContent = message;
        this.status.setAttribute('aria-live', isError ? 'assertive' : 'polite');
    }

    cancelOngoingRequest() {
        if (this.abortController) {
            this.abortController.abort();
        }
    }

    safeText(value) {
        if (typeof value !== 'string') {
            return 'Unknown';
        }

        return value.replace(/[\u0000-\u001f\u007f]/g, '').trim() || 'Unknown';
    }

    formatScore(score) {
        if (score === null || score === undefined || Number.isNaN(Number(score))) {
            return '—';
        }

        return String(score);
    }

    saveRecentQuery(query, sport) {
        try {
            const entry = { query, sport };
            const stored = JSON.parse(localStorage.getItem(this.recentQueriesKey) || '[]');
            const filtered = stored.filter((item) => item.query !== query || item.sport !== sport);
            filtered.unshift(entry);
            const limited = filtered.slice(0, this.maxRecentQueries);
            localStorage.setItem(this.recentQueriesKey, JSON.stringify(limited));
            this.populateRecentQueries(limited);
        } catch (error) {
            console.warn('Unable to persist Copilot query history:', error);
        }
    }

    restoreRecentQueries() {
        try {
            const stored = JSON.parse(localStorage.getItem(this.recentQueriesKey) || '[]');
            this.populateRecentQueries(Array.isArray(stored) ? stored : []);
        } catch (error) {
            console.warn('Unable to load Copilot query history:', error);
        }
    }

    populateRecentQueries(items) {
        this.recentContainer.innerHTML = '';

        if (!items || items.length === 0) {
            this.recentContainer.hidden = true;
            return;
        }

        items.forEach(({ query, sport }) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.textContent = sport ? `${query} (${sport})` : query;
            button.addEventListener('click', () => {
                this.queryInput.value = query;
                this.sportSelect.value = sport || '';
                this.handleSearch();
            });
            this.recentContainer.appendChild(button);
        });

        this.recentContainer.hidden = false;
    }
}

(function initializeCopilotWidget() {
    if (typeof window === 'undefined') {
        return;
    }

    if (window.__blazeCopilotWidgetInitialized) {
        return;
    }

    window.__blazeCopilotWidgetInitialized = true;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.blazeCopilotWidget = new BlazeCopilotWidget();
        });
    } else {
        window.blazeCopilotWidget = new BlazeCopilotWidget();
    }
})();
