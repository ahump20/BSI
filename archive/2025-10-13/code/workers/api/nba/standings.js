// NBA Standings API - Cloudflare Pages Function
// Fetches real-time NBA standings with validation and caching

import { ok, err, cache, withRetry, validateNBARecord, fetchWithTimeout } from '../_utils.js';

/**
 * NBA Standings endpoint
 * GET /api/nba/standings?conference=Eastern&division=Atlantic
 */
export async function onRequestGet(context) {
    const { request, env } = context;
    const url = new URL(request.url);

    const conference = url.searchParams.get('conference'); // 'Eastern' or 'Western'
    const division = url.searchParams.get('division');

    try {
        const cacheKey = `nba:standings:${conference || division || 'all'}`;

        const standings = await cache(env, cacheKey, async () => {
            return await fetchNBAStandings(conference, division);
        }, 300); // 5 minute cache

        return ok({
            league: 'NBA',
            season: '2025-26',
            standings,
            meta: {
                dataSource: 'ESPN NBA API',
                lastUpdated: new Date().toISOString(),
                timezone: 'America/Chicago'
            }
        });
    } catch (error) {
        return err(error);
    }
}

/**
 * Fetch NBA standings from ESPN API with retry logic
 */
async function fetchNBAStandings(filterConference, filterDivision) {
    return await withRetry(async () => {
        const headers = {
            'User-Agent': 'BlazeSportsIntel/1.0 (https://blazesportsintel.com)',
            'Accept': 'application/json'
        };

        // ESPN NBA API endpoint
        const standingsUrl = 'https://site.api.espn.com/apis/v2/sports/basketball/nba/standings';

        const response = await fetchWithTimeout(standingsUrl, { headers }, 10000);

        if (!response.ok) {
            throw new Error(`ESPN API returned ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        // Process standings data
        const processed = processNBAStandingsData(data, filterConference, filterDivision);

        return processed;
    }, 3, 250); // 3 retries with 250ms base delay
}

/**
 * Process and validate NBA standings data
 */
function processNBAStandingsData(data, filterConference, filterDivision) {
    const conferences = {};

    // ESPN NBA API structure: children array contains conferences
    const conferenceData = data.children || [];

    conferenceData.forEach(conf => {
        const conferenceName = conf.name; // "Eastern Conference" or "Western Conference"
        const conferenceAbbr = conferenceName?.includes('Eastern') ? 'East' : 'West';

        // Filter by conference if specified
        if (filterConference && conferenceAbbr !== filterConference) {
            return;
        }

        // Initialize conference structure
        if (!conferences[conferenceAbbr]) {
            conferences[conferenceAbbr] = {
                name: conferenceName,
                abbreviation: conferenceAbbr,
                divisions: []
            };
        }

        // Process divisions
        const divisions = conf.children || [];
        divisions.forEach(division => {
            const divisionName = division.name; // e.g., "Atlantic Division"
            const divisionAbbr = divisionName?.split(' ')[0]; // "Atlantic", "Central", "Southeast", etc.

            // Filter by division if specified
            if (filterDivision && !divisionName?.includes(filterDivision)) {
                return;
            }

            // Process teams in this division
            const teams = (division.standings?.entries || []).map(entry => {
                const team = entry.team;
                const stats = entry.stats || [];

                const wins = stats.find(s => s.name === 'wins')?.value || 0;
                const losses = stats.find(s => s.name === 'losses')?.value || 0;
                const gamesPlayed = stats.find(s => s.name === 'gamesPlayed')?.value || 0;
                const winPercent = stats.find(s => s.name === 'winPercent')?.value || 0;
                const gamesBehind = stats.find(s => s.name === 'gamesBehind')?.displayValue || '0.0';
                const streak = stats.find(s => s.name === 'streak')?.displayValue || '-';
                const pointsFor = stats.find(s => s.name === 'pointsFor')?.value || 0;
                const pointsAgainst = stats.find(s => s.name === 'pointsAgainst')?.value || 0;

                // Get division and conference records
                const vsConf = stats.find(s => s.name === 'vs. Conf.')?.displayValue || 'N/A';
                const vsDiv = stats.find(s => s.name === 'vs. Div.')?.displayValue || 'N/A';
                const home = stats.find(s => s.name === 'home')?.displayValue || 'N/A';
                const road = stats.find(s => s.name === 'road')?.displayValue || 'N/A';
                const lastTen = stats.find(s => s.name === 'L10')?.displayValue || 'N/A';

                const teamData = {
                    id: team.id,
                    name: team.displayName,
                    abbreviation: team.abbreviation,
                    logo: team.logos?.[0]?.href,
                    wins,
                    losses,
                    gamesPlayed,
                    games: 82,
                    record: {
                        wins,
                        losses,
                        winningPercentage: winPercent.toFixed(3),
                        displayRecord: `${wins}-${losses}`
                    },
                    division: divisionName,
                    divisionAbbr: divisionAbbr,
                    conference: conferenceAbbr,
                    standings: {
                        gamesBack: gamesBehind,
                        streak,
                        clinched: entry.note?.description?.includes('Clinched') || false
                    },
                    stats: {
                        pointsFor,
                        pointsAgainst,
                        pointDifferential: pointsFor - pointsAgainst,
                        conferenceRecord: vsConf,
                        divisionRecord: vsDiv,
                        homeRecord: home,
                        roadRecord: road,
                        lastTenRecord: lastTen
                    }
                };

                // Validate record
                const validation = validateNBARecord(teamData);
                if (!validation.valid) {
                    console.warn(`Invalid NBA record for ${team.displayName}:`, validation.errors);
                }

                return teamData;
            });

            // Add division to conference
            conferences[conferenceAbbr].divisions.push({
                name: divisionName,
                abbreviation: divisionAbbr,
                teams: teams.sort((a, b) => {
                    // Sort by wins descending, then by winning percentage
                    if (b.wins !== a.wins) {
                        return b.wins - a.wins;
                    }
                    return parseFloat(b.record.winningPercentage) - parseFloat(a.record.winningPercentage);
                })
            });
        });
    });

    return Object.values(conferences);
}
