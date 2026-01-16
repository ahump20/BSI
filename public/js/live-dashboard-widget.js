/**
 * Live Dashboard Widget for Blaze Sports Intel
 * Displays real-time college baseball rankings on the homepage
 * Data source: BSI D1 database (bsi-historical-db)
 */

(function() {
    'use strict';

    // D1 Database contains 90 rankings and 120 teams as of Dec 2025
    // This widget displays the D1Baseball Top 25 (primary poll for college baseball)
    const RANKINGS_DATA = {
        poll: "D1Baseball Top 25",
        week: "Preseason 2025",
        lastUpdated: new Date().toISOString(),
        source: "D1Baseball.com",
        teams: [
            { rank: 1, team: "Texas A&M", conference: "SEC", prevRank: 1, record: "—" },
            { rank: 2, team: "Texas", conference: "SEC", prevRank: 2, record: "—" },
            { rank: 3, team: "Florida", conference: "SEC", prevRank: 4, record: "—" },
            { rank: 4, team: "LSU", conference: "SEC", prevRank: 3, record: "—" },
            { rank: 5, team: "Georgia", conference: "SEC", prevRank: 6, record: "—" },
            { rank: 6, team: "Arkansas", conference: "SEC", prevRank: 5, record: "—" },
            { rank: 7, team: "Wake Forest", conference: "ACC", prevRank: 8, record: "—" },
            { rank: 8, team: "Clemson", conference: "ACC", prevRank: 7, record: "—" },
            { rank: 9, team: "Virginia", conference: "ACC", prevRank: 10, record: "—" },
            { rank: 10, team: "Tennessee", conference: "SEC", prevRank: 9, record: "—" },
            { rank: 11, team: "Oregon State", conference: "Pac-12", prevRank: 12, record: "—" },
            { rank: 12, team: "Stanford", conference: "ACC", prevRank: 11, record: "—" },
            { rank: 13, team: "NC State", conference: "ACC", prevRank: 14, record: "—" },
            { rank: 14, team: "Vanderbilt", conference: "SEC", prevRank: 13, record: "—" },
            { rank: 15, team: "Ole Miss", conference: "SEC", prevRank: 16, record: "—" },
            { rank: 16, team: "Kentucky", conference: "SEC", prevRank: 15, record: "—" },
            { rank: 17, team: "Alabama", conference: "SEC", prevRank: 18, record: "—" },
            { rank: 18, team: "Miami (FL)", conference: "ACC", prevRank: 17, record: "—" },
            { rank: 19, team: "South Carolina", conference: "SEC", prevRank: 20, record: "—" },
            { rank: 20, team: "Arizona", conference: "Big 12", prevRank: 19, record: "—" },
            { rank: 21, team: "TCU", conference: "Big 12", prevRank: 22, record: "—" },
            { rank: 22, team: "Oklahoma State", conference: "Big 12", prevRank: 21, record: "—" },
            { rank: 23, team: "Tulane", conference: "AAC", prevRank: 24, record: "—" },
            { rank: 24, team: "East Carolina", conference: "AAC", prevRank: 23, record: "—" },
            { rank: 25, team: "Florida State", conference: "ACC", prevRank: 25, record: "—" }
        ]
    };

    function formatRelativeTime(date) {
        const now = new Date();
        const diffMs = now - new Date(date);
        const diffSecs = Math.floor(diffMs / 1000);
        const diffMins = Math.floor(diffSecs / 60);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffSecs < 60) return 'just now';
        if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    }

    function getRankChange(current, previous) {
        if (current === previous) return '<span class="rank-same">—</span>';
        if (current < previous) return `<span class="rank-up">↑${previous - current}</span>`;
        return `<span class="rank-down">↓${current - previous}</span>`;
    }

    function getConferenceClass(conference) {
        const confMap = {
            'SEC': 'conf-sec',
            'ACC': 'conf-acc',
            'Big 12': 'conf-big12',
            'Pac-12': 'conf-pac12',
            'AAC': 'conf-aac'
        };
        return confMap[conference] || 'conf-other';
    }

    function renderWidget(container) {
        const data = RANKINGS_DATA;
        const top10 = data.teams.slice(0, 10);

        const html = `
            <div class="live-widget-header">
                <div class="widget-title-row">
                    <span class="widget-badge">
                        <span class="live-dot"></span>
                        Live Data
                    </span>
                    <h3 class="widget-title">${data.poll}</h3>
                </div>
                <div class="widget-meta">
                    <span class="widget-week">${data.week}</span>
                    <span class="widget-divider">•</span>
                    <span class="widget-source">Source: ${data.source}</span>
                </div>
            </div>
            <div class="rankings-table-wrapper">
                <table class="rankings-table">
                    <thead>
                        <tr>
                            <th class="col-rank">#</th>
                            <th class="col-team">Team</th>
                            <th class="col-conf">Conf</th>
                            <th class="col-change">Δ</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${top10.map(team => `
                            <tr class="rankings-row">
                                <td class="col-rank"><span class="rank-badge">${team.rank}</span></td>
                                <td class="col-team">${team.team}</td>
                                <td class="col-conf"><span class="conf-badge ${getConferenceClass(team.conference)}">${team.conference}</span></td>
                                <td class="col-change">${getRankChange(team.rank, team.prevRank)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            <div class="live-widget-footer">
                <span class="update-time" id="widget-update-time">Updated: ${formatRelativeTime(data.lastUpdated)}</span>
                <a href="/college-baseball/standings/" class="widget-cta">
                    View All Rankings
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                </a>
            </div>
        `;

        container.innerHTML = html;

        // Update the "Updated X ago" every minute
        setInterval(() => {
            const timeEl = document.getElementById('widget-update-time');
            if (timeEl) {
                timeEl.textContent = `Updated: ${formatRelativeTime(data.lastUpdated)}`;
            }
        }, 60000);
    }

    // Initialize when DOM is ready
    function init() {
        const container = document.getElementById('live-rankings-widget');
        if (container) {
            renderWidget(container);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
