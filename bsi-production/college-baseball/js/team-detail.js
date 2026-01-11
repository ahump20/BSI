// ============================================================================
// BSI Team Detail Page - JavaScript
// Premium design with dark/light mode, enhanced stats, and live data
// ============================================================================

// ----------------------------------------------------------------------------
// Theme Management
// ----------------------------------------------------------------------------
function initTheme() {
    const savedTheme = localStorage.getItem('bsi-theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
}

function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('bsi-theme', next);
    updateThemeIcon(next);
}

function updateThemeIcon(theme) {
    const btn = document.getElementById('theme-toggle');
    if (!btn) return;
    btn.textContent = '';
    const icon = theme === 'dark' ? createSunIcon() : createMoonIcon();
    btn.appendChild(icon);
}

// ----------------------------------------------------------------------------
// SVG Icon Helpers (Safe DOM creation)
// ----------------------------------------------------------------------------
function createSvgIcon(paths, viewBox) {
    viewBox = viewBox || '0 0 24 24';
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', viewBox);
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '2');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    svg.setAttribute('width', '20');
    svg.setAttribute('height', '20');
    
    paths.forEach(function(d) {
        var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', d);
        svg.appendChild(path);
    });
    
    return svg;
}

function createSunIcon() {
    return createSvgIcon([
        'M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42',
        'M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10z'
    ]);
}

function createMoonIcon() {
    return createSvgIcon(['M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z']);
}

function createCalendarIcon() {
    return createSvgIcon([
        'M19 4H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z',
        'M16 2v4M8 2v4M3 10h18'
    ]);
}

function createClockIcon() {
    return createSvgIcon([
        'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z',
        'M12 6v6l4 2'
    ]);
}

function createMapPinIcon() {
    return createSvgIcon([
        'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z',
        'M12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6z'
    ]);
}

function createTrendingUpIcon() {
    return createSvgIcon(['M23 6l-9.5 9.5-5-5L1 18', 'M17 6h6v6']);
}

function createUsersIcon() {
    return createSvgIcon([
        'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2',
        'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
        'M23 21v-2a4 4 0 0 0-3-3.87',
        'M16 3.13a4 4 0 0 1 0 7.75'
    ]);
}

// ----------------------------------------------------------------------------
// Stats Calculation
// ----------------------------------------------------------------------------
function calculateStats(games) {
    var stats = {
        overall: { wins: 0, losses: 0 },
        conference: { wins: 0, losses: 0 },
        home: { wins: 0, losses: 0 },
        away: { wins: 0, losses: 0 },
        streak: { type: null, count: 0 },
        lastFive: []
    };
    
    if (!games || games.length === 0) return stats;
    
    // Sort by date descending for streak calculation
    var sortedGames = games.slice().filter(function(g) { return g.result; }).sort(function(a, b) {
        return new Date(b.date) - new Date(a.date);
    });
    
    sortedGames.forEach(function(game, index) {
        if (!game.result) return;
        
        var isWin = game.result === 'W';
        
        // Overall
        if (isWin) stats.overall.wins++;
        else stats.overall.losses++;
        
        // Conference
        if (game.conference) {
            if (isWin) stats.conference.wins++;
            else stats.conference.losses++;
        }
        
        // Home/Away
        if (game.location === 'home' || game.home) {
            if (isWin) stats.home.wins++;
            else stats.home.losses++;
        } else {
            if (isWin) stats.away.wins++;
            else stats.away.losses++;
        }
        
        // Last 5
        if (index < 5) {
            stats.lastFive.push(game.result);
        }
        
        // Streak (only count consecutive from most recent)
        if (index === 0) {
            stats.streak.type = game.result;
            stats.streak.count = 1;
        } else if (game.result === stats.streak.type && index === stats.streak.count) {
            stats.streak.count++;
        }
    });
    
    return stats;
}

// ----------------------------------------------------------------------------
// Game Helpers
// ----------------------------------------------------------------------------
function findNextGame(games) {
    if (!games) return null;
    var now = new Date();
    var upcoming = games
        .filter(function(g) { return new Date(g.date) > now && !g.result; })
        .sort(function(a, b) { return new Date(a.date) - new Date(b.date); });
    return upcoming[0] || null;
}

function findLiveGame(games) {
    if (!games) return null;
    return games.find(function(g) { return g.status === 'live' || g.status === 'in_progress'; });
}

function getCountdown(targetDate) {
    var now = new Date();
    var target = new Date(targetDate);
    var diff = target - now;
    
    if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    
    var days = Math.floor(diff / (1000 * 60 * 60 * 24));
    var hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    var minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    var seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    return { days: days, hours: hours, minutes: minutes, seconds: seconds };
}

function formatDate(dateStr) {
    var date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
    });
}

function formatTime(dateStr) {
    var date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
    });
}

// ----------------------------------------------------------------------------
// Render Functions
// ----------------------------------------------------------------------------
function renderTeamHero(team, stats) {
    var hero = document.getElementById('team-hero');
    if (!hero) return;
    
    hero.textContent = '';
    hero.style.display = 'flex';
    
    // Team colors gradient background
    var colors = team.colors || { primary: '#BF5700', secondary: '#8B4513' };
    hero.style.background = 'linear-gradient(135deg, ' + colors.primary + '22 0%, ' + colors.secondary + '22 100%)';
    
    // Logo container
    var logoContainer = document.createElement('div');
    logoContainer.className = 'hero-logo';
    
    var logo = document.createElement('img');
    logo.src = team.logo || '/images/placeholder-team.svg';
    logo.alt = (team.name || 'Team') + ' logo';
    logo.onerror = function() { this.src = '/images/placeholder-team.svg'; };
    logoContainer.appendChild(logo);
    
    // Ranking badge
    if (team.ranking && team.ranking <= 25) {
        var badge = document.createElement('div');
        badge.className = 'ranking-badge';
        badge.textContent = '#' + team.ranking;
        logoContainer.appendChild(badge);
    }
    
    hero.appendChild(logoContainer);
    
    // Team info
    var info = document.createElement('div');
    info.className = 'hero-info';
    
    var name = document.createElement('h1');
    name.className = 'hero-title';
    name.textContent = team.name || 'Team';
    info.appendChild(name);
    
    var conference = document.createElement('p');
    conference.className = 'hero-subtitle';
    conference.textContent = team.conference || '';
    info.appendChild(conference);
    
    // Record display
    if (stats && stats.overall) {
        var record = document.createElement('div');
        record.className = 'hero-record';
        record.textContent = stats.overall.wins + '-' + stats.overall.losses;
        if (stats.conference.wins || stats.conference.losses) {
            record.textContent += ' (' + stats.conference.wins + '-' + stats.conference.losses + ' Conf)';
        }
        info.appendChild(record);
    }
    
    // Follow button placeholder
    var followBtn = document.createElement('button');
    followBtn.className = 'follow-btn';
    followBtn.textContent = 'Follow Team';
    followBtn.onclick = function() {
        alert('Follow feature coming soon!');
    };
    info.appendChild(followBtn);
    
    hero.appendChild(info);
}

function renderNextGameWidget(games) {
    var container = document.getElementById('next-game-widget');
    if (!container) return;
    
    container.textContent = '';
    
    var liveGame = findLiveGame(games);
    var nextGame = liveGame || findNextGame(games);
    
    if (!nextGame) {
        var empty = document.createElement('p');
        empty.className = 'empty-state';
        empty.textContent = 'No upcoming games scheduled';
        container.appendChild(empty);
        return;
    }
    
    // Header
    var header = document.createElement('div');
    header.className = 'widget-header';
    
    var title = document.createElement('h3');
    title.textContent = liveGame ? 'Live Now' : 'Next Game';
    header.appendChild(title);
    
    if (liveGame) {
        var liveIndicator = document.createElement('span');
        liveIndicator.className = 'live-indicator';
        liveIndicator.textContent = 'LIVE';
        header.appendChild(liveIndicator);
    }
    
    container.appendChild(header);
    
    // Game info
    var gameInfo = document.createElement('div');
    gameInfo.className = 'next-game-info';
    
    // Opponent
    var opponent = document.createElement('div');
    opponent.className = 'opponent-info';
    
    var oppName = document.createElement('span');
    oppName.className = 'opponent-name';
    var isHome = nextGame.location === 'home' || nextGame.home;
    oppName.textContent = (isHome ? 'vs ' : '@ ') + (nextGame.opponent || 'TBD');
    opponent.appendChild(oppName);
    
    if (nextGame.opponentRanking && nextGame.opponentRanking <= 25) {
        var oppRank = document.createElement('span');
        oppRank.className = 'opponent-rank';
        oppRank.textContent = ' #' + nextGame.opponentRanking;
        opponent.appendChild(oppRank);
    }
    
    gameInfo.appendChild(opponent);
    
    // Date and time
    var datetime = document.createElement('div');
    datetime.className = 'game-datetime';
    
    var dateSpan = document.createElement('span');
    dateSpan.appendChild(createCalendarIcon());
    dateSpan.appendChild(document.createTextNode(' ' + formatDate(nextGame.date)));
    datetime.appendChild(dateSpan);
    
    if (nextGame.time || nextGame.date) {
        var timeSpan = document.createElement('span');
        timeSpan.appendChild(createClockIcon());
        timeSpan.appendChild(document.createTextNode(' ' + formatTime(nextGame.date)));
        datetime.appendChild(timeSpan);
    }
    
    gameInfo.appendChild(datetime);
    
    // Location
    if (nextGame.venue) {
        var venue = document.createElement('div');
        venue.className = 'game-venue';
        venue.appendChild(createMapPinIcon());
        venue.appendChild(document.createTextNode(' ' + nextGame.venue));
        gameInfo.appendChild(venue);
    }
    
    container.appendChild(gameInfo);
    
    // Countdown (if not live)
    if (!liveGame) {
        var countdown = document.createElement('div');
        countdown.className = 'countdown';
        countdown.id = 'game-countdown';
        container.appendChild(countdown);
        
        // Start countdown timer
        updateCountdown(nextGame.date);
        setInterval(function() { updateCountdown(nextGame.date); }, 1000);
    }
}

function updateCountdown(targetDate) {
    var container = document.getElementById('game-countdown');
    if (!container) return;
    
    var times = getCountdown(targetDate);
    
    container.textContent = '';
    
    var items = [
        { value: times.days, label: 'Days' },
        { value: times.hours, label: 'Hrs' },
        { value: times.minutes, label: 'Min' },
        { value: times.seconds, label: 'Sec' }
    ];
    
    items.forEach(function(item) {
        var div = document.createElement('div');
        div.className = 'countdown-item';
        
        var val = document.createElement('span');
        val.className = 'countdown-value';
        val.textContent = String(item.value).padStart(2, '0');
        div.appendChild(val);
        
        var lbl = document.createElement('span');
        lbl.className = 'countdown-label';
        lbl.textContent = item.label;
        div.appendChild(lbl);
        
        container.appendChild(div);
    });
}

function renderQuickStats(stats) {
    var container = document.getElementById('quick-stats');
    if (!container) return;
    
    container.textContent = '';
    
    var statItems = [
        { 
            label: 'Overall', 
            value: stats.overall.wins + '-' + stats.overall.losses,
            icon: createTrendingUpIcon()
        },
        { 
            label: 'Conference', 
            value: stats.conference.wins + '-' + stats.conference.losses,
            icon: createUsersIcon()
        },
        { 
            label: 'Home', 
            value: stats.home.wins + '-' + stats.home.losses,
            icon: createMapPinIcon()
        },
        { 
            label: 'Away', 
            value: stats.away.wins + '-' + stats.away.losses,
            icon: createMapPinIcon()
        }
    ];
    
    statItems.forEach(function(item) {
        var card = document.createElement('div');
        card.className = 'stat-card';
        
        var iconDiv = document.createElement('div');
        iconDiv.className = 'stat-icon';
        iconDiv.appendChild(item.icon);
        card.appendChild(iconDiv);
        
        var value = document.createElement('div');
        value.className = 'stat-value';
        value.textContent = item.value;
        card.appendChild(value);
        
        var label = document.createElement('div');
        label.className = 'stat-label';
        label.textContent = item.label;
        card.appendChild(label);
        
        container.appendChild(card);
    });
    
    // Current streak
    if (stats.streak.type && stats.streak.count > 0) {
        var streakCard = document.createElement('div');
        streakCard.className = 'stat-card';
        if (stats.streak.type === 'W') streakCard.classList.add('win-streak');
        else streakCard.classList.add('loss-streak');
        
        var value = document.createElement('div');
        value.className = 'stat-value';
        value.textContent = stats.streak.type + stats.streak.count;
        streakCard.appendChild(value);
        
        var label = document.createElement('div');
        label.className = 'stat-label';
        label.textContent = stats.streak.type === 'W' ? 'Win Streak' : 'Loss Streak';
        streakCard.appendChild(label);
        
        container.appendChild(streakCard);
    }
}

function renderSchedule(games, teamId) {
    var container = document.getElementById('schedule-table');
    if (!container) return;
    
    container.textContent = '';
    
    if (!games || games.length === 0) {
        var empty = document.createElement('p');
        empty.className = 'empty-state';
        empty.textContent = 'No games scheduled';
        container.appendChild(empty);
        return;
    }
    
    var table = document.createElement('table');
    
    // Header
    var thead = document.createElement('thead');
    var headerRow = document.createElement('tr');
    ['Date', 'Opponent', 'Result', 'Score', 'Series'].forEach(function(text) {
        var th = document.createElement('th');
        th.textContent = text;
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);
    
    // Body
    var tbody = document.createElement('tbody');
    
    // Track series records
    var seriesRecords = {};
    
    games.forEach(function(game) {
        var row = document.createElement('tr');
        
        // Date
        var dateCell = document.createElement('td');
        dateCell.textContent = formatDate(game.date);
        row.appendChild(dateCell);
        
        // Opponent with home/away indicator
        var oppCell = document.createElement('td');
        oppCell.className = 'opponent-cell';
        
        var isHome = game.location === 'home' || game.home;
        var prefix = isHome ? 'vs ' : '@ ';
        
        if (game.opponentRanking && game.opponentRanking <= 25) {
            var rankSpan = document.createElement('span');
            rankSpan.className = 'opp-rank';
            rankSpan.textContent = '#' + game.opponentRanking + ' ';
            oppCell.appendChild(rankSpan);
        }
        
        oppCell.appendChild(document.createTextNode(prefix + (game.opponent || 'TBD')));
        row.appendChild(oppCell);
        
        // Result with color coding
        var resultCell = document.createElement('td');
        if (game.result) {
            resultCell.className = game.result === 'W' ? 'result-win' : 'result-loss';
            resultCell.textContent = game.result;
            
            // Track series
            var oppKey = game.opponent;
            if (!seriesRecords[oppKey]) {
                seriesRecords[oppKey] = { wins: 0, losses: 0 };
            }
            if (game.result === 'W') seriesRecords[oppKey].wins++;
            else seriesRecords[oppKey].losses++;
        } else {
            resultCell.textContent = '-';
        }
        row.appendChild(resultCell);
        
        // Score
        var scoreCell = document.createElement('td');
        if (game.score) {
            scoreCell.textContent = game.score;
        } else if (game.teamScore !== undefined && game.opponentScore !== undefined) {
            scoreCell.textContent = game.teamScore + '-' + game.opponentScore;
        } else {
            scoreCell.textContent = '-';
        }
        row.appendChild(scoreCell);
        
        // Series record
        var seriesCell = document.createElement('td');
        var oppKey2 = game.opponent;
        if (seriesRecords[oppKey2] && (seriesRecords[oppKey2].wins || seriesRecords[oppKey2].losses)) {
            seriesCell.textContent = seriesRecords[oppKey2].wins + '-' + seriesRecords[oppKey2].losses;
        } else {
            seriesCell.textContent = '-';
        }
        row.appendChild(seriesCell);
        
        tbody.appendChild(row);
    });
    
    table.appendChild(tbody);
    container.appendChild(table);
}

function renderRelatedContent(team) {
    var container = document.getElementById('related-content');
    if (!container) return;
    
    container.textContent = '';
    
    var links = [
        {
            title: 'Conference Standings',
            description: 'See where ' + (team.name || 'this team') + ' ranks in the ' + (team.conference || 'conference'),
            url: '/college-baseball/standings.html?conference=' + encodeURIComponent(team.conference || ''),
            icon: createTrendingUpIcon()
        },
        {
            title: 'Full Scoreboard',
            description: 'Live scores from across college baseball',
            url: '/college-baseball/scores.html',
            icon: createCalendarIcon()
        },
        {
            title: 'Team Directory',
            description: 'Browse all Division I baseball programs',
            url: '/college-baseball/teams.html',
            icon: createUsersIcon()
        }
    ];
    
    links.forEach(function(link) {
        var card = document.createElement('a');
        card.className = 'related-card';
        card.href = link.url;
        
        var iconDiv = document.createElement('div');
        iconDiv.className = 'related-icon';
        iconDiv.appendChild(link.icon);
        card.appendChild(iconDiv);
        
        var content = document.createElement('div');
        content.className = 'related-info';
        
        var title = document.createElement('h4');
        title.textContent = link.title;
        content.appendChild(title);
        
        var desc = document.createElement('p');
        desc.textContent = link.description;
        content.appendChild(desc);
        
        card.appendChild(content);
        
        var arrow = document.createElement('span');
        arrow.className = 'related-arrow';
        arrow.textContent = '\u2192';
        card.appendChild(arrow);
        
        container.appendChild(card);
    });
}

// ----------------------------------------------------------------------------
// API Functions
// ----------------------------------------------------------------------------
function fetchTeam(teamId) {
    return fetch('https://blaze-sports-api.austinhumphrey6.workers.dev/api/college-baseball/team/' + teamId)
        .then(function(response) {
            if (!response.ok) throw new Error('Failed to fetch team');
            return response.json();
        })
        .catch(function(error) {
            console.error('Error fetching team:', error);
            return null;
        });
}

function fetchSchedule(teamId) {
    return fetch('https://blaze-sports-api.austinhumphrey6.workers.dev/api/college-baseball/team/' + teamId + '/schedule')
        .then(function(response) {
            if (!response.ok) throw new Error('Failed to fetch schedule');
            return response.json();
        })
        .then(function(data) {
            return data.games || data;
        })
        .catch(function(error) {
            console.error('Error fetching schedule:', error);
            return [];
        });
}

// ----------------------------------------------------------------------------
// Initialization
// ----------------------------------------------------------------------------
function init() {
    // Initialize theme
    initTheme();
    
    // Setup theme toggle
    var themeBtn = document.getElementById('theme-toggle');
    if (themeBtn) {
        themeBtn.addEventListener('click', toggleTheme);
    }
    
    // Setup mobile menu toggle
    var menuToggle = document.querySelector('.mobile-menu-btn');
    var navLinks = document.querySelector('.nav-links');
    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', function() {
            navLinks.classList.toggle('open');
            menuToggle.classList.toggle('active');
        });
    }
    
    // Get team ID from URL
    var params = new URLSearchParams(window.location.search);
    var teamId = params.get('team') || params.get('id');
    
    if (!teamId) {
        var loadingEl = document.getElementById('loading');
        if (loadingEl) loadingEl.style.display = 'none';
        
        var mainContent = document.querySelector('.content-inner');
        if (mainContent) {
            var error = document.createElement('div');
            error.className = 'error-state';
            error.textContent = 'No team specified. Please select a team from the directory.';
            mainContent.insertBefore(error, mainContent.firstChild.nextSibling);
        }
        return;
    }
    
    // Fetch data
    Promise.all([
        fetchTeam(teamId),
        fetchSchedule(teamId)
    ]).then(function(results) {
        var team = results[0];
        var games = results[1];
        
        // Hide loading
        var loadingEl = document.getElementById('loading');
        if (loadingEl) loadingEl.style.display = 'none';
        
        if (!team) {
            var mainContent = document.querySelector('.content-inner');
            if (mainContent) {
                var errorDiv = document.createElement('div');
                errorDiv.className = 'error-state';
                errorDiv.textContent = 'Team not found. Please try again.';
                mainContent.insertBefore(errorDiv, mainContent.firstChild.nextSibling);
            }
            return;
        }
        
        // Calculate stats
        var stats = calculateStats(games);
        
        // Update page title
        document.title = (team.name || 'Team') + ' - BSI College Baseball';
        
        // Render all sections
        renderTeamHero(team, stats);
        renderNextGameWidget(games);
        renderQuickStats(stats);
        renderSchedule(games, teamId);
        renderRelatedContent(team);
        
    }).catch(function(error) {
        console.error('Error loading team data:', error);
        
        var loadingEl = document.getElementById('loading');
        if (loadingEl) loadingEl.style.display = 'none';
        
        var mainContent = document.querySelector('.content-inner');
        if (mainContent) {
            var errorDiv = document.createElement('div');
            errorDiv.className = 'error-state';
            errorDiv.textContent = 'Error loading team data. Please try again later.';
            mainContent.insertBefore(errorDiv, mainContent.firstChild.nextSibling);
        }
    });
}

// Run on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
