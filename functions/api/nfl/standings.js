// NFL Standings API - Cloudflare Pages Function
// Fetches real-time NFL standings with validation and caching

import { ok, err, cache, withRetry, validateNFLRecord, fetchWithTimeout, getCurrentNFLWeek, rateLimit, rateLimitError, corsHeaders } from '../_utils.js';

/**
 * NFL Standings endpoint
 * GET /api/nfl/standings?week=5&division=AFC_East
 */
export async function onRequestGet(context) {
    const { request, env } = context;

    // Handle OPTIONS request
    if (request.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    // Rate limiting: 100 requests per minute per IP
    const limit = await rateLimit(env, request, 100, 60000);
    if (!limit.allowed) {
        return rateLimitError(limit.resetAt, limit.retryAfter);
    }

    const url = new URL(request.url);

    const week = url.searchParams.get('week') || 'current';
    const division = url.searchParams.get('division');

    try {
        const cacheKey = `nfl:standings:${week}:${division || 'all'}`;

        const standings = await cache(env, cacheKey, async () => {
            return await fetchNFLStandings(week, division);
        }, 300); // 5 minute cache

        return ok({
            league: 'NFL',
            season: '2025',
            week: week === 'current' ? getCurrentNFLWeek() : parseInt(week),
            standings,
            meta: {
                dataSource: 'ESPN NFL API',
                lastUpdated: new Date().toISOString(),
                timezone: 'America/Chicago'
            }
        });
    } catch (error) {
        return err(error);
    }
}

/**
 * Fetch NFL standings from ESPN API with retry logic
 */
async function fetchNFLStandings(week, division) {
    return await withRetry(async () => {
        const headers = {
            'User-Agent': 'BlazeSportsIntel/1.0 (https://blazesportsintel.com)',
            Accept: 'application/json',
            Referer: 'https://blazesportsintel.com/'
        };

        // ESPN NFL API endpoint
        const standingsUrl = 'https://site.api.espn.com/apis/v2/sports/football/nfl/standings';

        const response = await fetchWithTimeout(standingsUrl, { headers }, 10000);

        if (!response.ok) {
            throw new Error(`ESPN API returned ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        // Process standings by conference and division
        const processed = processStandingsData(data, division);

        return processed;
    }, 3, 250); // 3 retries with 250ms base delay
}

/**
 * NFL Division Mapping (2025 Season)
 * Maps team IDs to their divisions since ESPN standings API doesn't include this
 */
const NFL_DIVISIONS = {
    // AFC East
    2: 'AFC East',   // Buffalo Bills
    15: 'AFC East',  // Miami Dolphins
    17: 'AFC East',  // New England Patriots
    20: 'AFC East',  // New York Jets

    // AFC North
    4: 'AFC North',  // Baltimore Ravens
    5: 'AFC North',  // Cincinnati Bengals
    6: 'AFC North',  // Cleveland Browns
    23: 'AFC North', // Pittsburgh Steelers

    // AFC South
    34: 'AFC South', // Houston Texans
    11: 'AFC South', // Indianapolis Colts
    30: 'AFC South', // Jacksonville Jaguars
    10: 'AFC South', // Tennessee Titans

    // AFC West
    7: 'AFC West',   // Denver Broncos
    12: 'AFC West',  // Kansas City Chiefs
    13: 'AFC West',  // Las Vegas Raiders
    24: 'AFC West',  // Los Angeles Chargers

    // NFC East
    8: 'NFC East',   // Dallas Cowboys
    19: 'NFC East',  // New York Giants
    21: 'NFC East',  // Philadelphia Eagles
    28: 'NFC East',  // Washington Commanders

    // NFC North
    3: 'NFC North',  // Chicago Bears
    9: 'NFC North',  // Detroit Lions
    14: 'NFC North', // Green Bay Packers
    16: 'NFC North', // Minnesota Vikings

    // NFC South
    1: 'NFC South',  // Atlanta Falcons
    29: 'NFC South', // Carolina Panthers
    18: 'NFC South', // New Orleans Saints
    27: 'NFC South', // Tampa Bay Buccaneers

    // NFC West
    22: 'NFC West',  // Arizona Cardinals
    25: 'NFC West',  // Los Angeles Rams
    26: 'NFC West',  // San Francisco 49ers
    33: 'NFC West'   // Seattle Seahawks
};

/**
 * Process and validate standings data
 */
function processStandingsData(data, filterDivision) {
    const allTeams = [];

    // ESPN standings structure: children array contains conferences
    const standingsData = data.children || [];

    standingsData.forEach(conference => {
        const confAbbr = conference.abbreviation; // 'AFC' or 'NFC'

        // Process divisions within conference
        const divisions = conference.standings?.entries || [];

        divisions.forEach(entry => {
            const team = entry.team;
            const stats = entry.stats || [];

            // Get division name using team ID mapping
            const fullDivisionName = NFL_DIVISIONS[team.id] || 'Unknown';

            // Extract simple division name (e.g., "East" from "AFC East")
            const simpleDivisionName = fullDivisionName.split(' ')[1] || fullDivisionName;

            if (filterDivision && !fullDivisionName.includes(filterDivision)) {
                return; // Skip if filtering by division
            }

            // Extract team statistics
            const wins = getStatValue(stats, 'wins');
            const losses = getStatValue(stats, 'losses');
            const ties = getStatValue(stats, 'ties');
            const gamesPlayed = wins + losses + ties;
            const winPercent = getStatValue(stats, 'winPercent');
            const pointsFor = getStatValue(stats, 'pointsFor');
            const pointsAgainst = getStatValue(stats, 'pointsAgainst');

            const teamData = {
                teamName: team.displayName,
                wins,
                losses,
                ties,
                winPercentage: parseFloat((winPercent || 0).toFixed(3)),
                division: simpleDivisionName,
                conference: confAbbr,
                pointsFor,
                pointsAgainst
            };

            // Validate record
            const validation = validateNFLRecord({
                currentWins: wins,
                gamesPlayed,
                games: 17,
                name: team.displayName
            });
            if (!validation.valid) {
                console.warn(`Invalid record for ${team.displayName}:`, validation.errors);
            }

            allTeams.push(teamData);
        });
    });

    // Sort by conference, division, then wins
    return allTeams.sort((a, b) => {
        // Sort by conference (AFC first)
        if (a.conference !== b.conference) {
            return a.conference === 'AFC' ? -1 : 1;
        }
        // Then by division
        const divOrder = ['East', 'North', 'South', 'West'];
        const divCompare = divOrder.indexOf(a.division) - divOrder.indexOf(b.division);
        if (divCompare !== 0) {
            return divCompare;
        }
        // Then by wins (descending)
        return b.wins - a.wins;
    });
}

/**
 * Helper: Get stat value by name
 */
function getStatValue(stats, name) {
    const stat = stats.find(s => s.name === name);
    return stat?.value || 0;
}

/**
 * Helper: Get stat display value by name
 */
function getStatDisplay(stats, name) {
    const stat = stats.find(s => s.name === name);
    return stat?.displayValue || 'N/A';
}

