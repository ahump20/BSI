// MLB Standings API - Cloudflare Pages Function
// Fetches real-time MLB standings with validation and caching

import { ok, err, cache, withRetry, validateMLBRecord, fetchWithTimeout } from '../_utils.js';

/**
 * MLB Standings endpoint
 * GET /api/mlb/standings?division=AL_East
 */
export async function onRequestGet(context) {
    const { request, env } = context;
    const url = new URL(request.url);

    const division = url.searchParams.get('division');
    const league = url.searchParams.get('league'); // 'AL' or 'NL'

    try {
        const cacheKey = `mlb:standings:${division || league || 'all'}`;

        const standings = await cache(env, cacheKey, async () => {
            return await fetchMLBStandings(division, league);
        }, 300); // 5 minute cache

        return ok({
            league: 'MLB',
            season: '2025',
            standings,
            meta: {
                dataSource: 'MLB Stats API',
                lastUpdated: new Date().toISOString(),
                timezone: 'America/Chicago'
            }
        });
    } catch (error) {
        return err(error);
    }
}

/**
 * Fetch MLB standings from MLB Stats API with retry logic
 */
async function fetchMLBStandings(filterDivision, filterLeague) {
    return await withRetry(async () => {
        const headers = {
            'User-Agent': 'BlazeSportsIntel/1.0 (https://blazesportsintel.com)',
            'Accept': 'application/json'
        };

        // MLB Stats API endpoint
        const standingsUrl = 'https://statsapi.mlb.com/api/v1/standings?leagueId=103,104&season=2025&standingsTypes=regularSeason';

        const response = await fetchWithTimeout(standingsUrl, { headers }, 10000);

        if (!response.ok) {
            throw new Error(`MLB API returned ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        // Process standings data
        const processed = processMLBStandingsData(data, filterDivision, filterLeague);

        return processed;
    }, 3, 250); // 3 retries with 250ms base delay
}

/**
 * Process and validate MLB standings data
 */
function processMLBStandingsData(data, filterDivision, filterLeague) {
    const leagues = {};

    // MLB Stats API structure: records array contains divisions
    const records = data.records || [];

    records.forEach(division => {
        const divisionName = division.division?.name; // e.g., "American League East"
        const divisionAbbr = division.division?.abbreviation; // e.g., "ALE"
        const leagueName = division.league?.name; // "American League" or "National League"
        const leagueAbbr = leagueName?.includes('American') ? 'AL' : 'NL';

        // Filter by division or league if specified
        if (filterDivision && !divisionAbbr?.includes(filterDivision)) {
            return;
        }
        if (filterLeague && leagueAbbr !== filterLeague) {
            return;
        }

        // Initialize league structure
        if (!leagues[leagueAbbr]) {
            leagues[leagueAbbr] = {
                name: leagueName,
                abbreviation: leagueAbbr,
                divisions: []
            };
        }

        // Process teams in this division
        const teams = (division.teamRecords || []).map(teamRecord => {
            const team = teamRecord.team;
            const wins = teamRecord.wins || 0;
            const losses = teamRecord.losses || 0;
            const gamesPlayed = teamRecord.gamesPlayed || 0;
            const winningPercentage = teamRecord.leagueRecord?.pct || '.000';
            const gamesBack = teamRecord.gamesBack || '0.0';
            const wildCardGamesBack = teamRecord.wildCardGamesBack || '-';
            const streak = teamRecord.streak?.streakCode || '-';
            const runsScored = teamRecord.runsScored || 0;
            const runsAllowed = teamRecord.runsAllowed || 0;
            const divisionLeader = teamRecord.divisionLeader || false;
            const wildCardRank = teamRecord.wildCardRank || null;

            // Division and league records
            const divisionRecord = teamRecord.records?.divisionRecords?.[0];
            const leagueRecord = teamRecord.leagueRecord;

            const teamData = {
                id: team.id,
                name: team.name,
                abbreviation: team.abbreviation,
                teamName: team.teamName,
                locationName: team.locationName,
                wins,
                losses,
                gamesPlayed,
                games: 162,
                record: {
                    wins,
                    losses,
                    winningPercentage,
                    displayRecord: `${wins}-${losses}`
                },
                division: divisionName,
                divisionAbbr: divisionAbbr,
                league: leagueAbbr,
                standings: {
                    gamesBack,
                    wildCardGamesBack,
                    wildCardRank,
                    divisionLeader,
                    streak,
                    clinched: teamRecord.clinched || false
                },
                stats: {
                    runsScored,
                    runsAllowed,
                    runDifferential: runsScored - runsAllowed,
                    homeRecord: teamRecord.records?.splitRecords?.find(r => r.type === 'home')?.wins + '-' +
                               teamRecord.records?.splitRecords?.find(r => r.type === 'home')?.losses || 'N/A',
                    awayRecord: teamRecord.records?.splitRecords?.find(r => r.type === 'away')?.wins + '-' +
                               teamRecord.records?.splitRecords?.find(r => r.type === 'away')?.losses || 'N/A',
                    lastTenRecord: teamRecord.records?.splitRecords?.find(r => r.type === 'lastTen')?.wins + '-' +
                                  teamRecord.records?.splitRecords?.find(r => r.type === 'lastTen')?.losses || 'N/A'
                }
            };

            // Validate record
            const validation = validateMLBRecord(teamData);
            if (!validation.valid) {
                console.warn(`Invalid MLB record for ${team.name}:`, validation.errors);
            }

            return teamData;
        });

        // Add division to league
        leagues[leagueAbbr].divisions.push({
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

    return Object.values(leagues);
}
