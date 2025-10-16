// NBA Standings API - Cloudflare Pages Function
// DUAL-SCHEMA ADAPTER: Supports both legacy (divisions) and new (flat) ESPN structures
// Last Updated: 2025-10-12 - Added support for ESPN's 2025 schema change

import { ok, err, cache, withRetry, validateNBARecord, fetchWithTimeout } from '../_utils.js';

/**
 * NBA Standings endpoint with dual-schema support
 * GET /api/nba/standings?conference=Eastern&division=Atlantic
 *
 * SCHEMA VERSIONS SUPPORTED:
 * - Legacy (pre-2025): conf.children[] contains divisions
 * - New (2025): conf.standings.entries contains teams directly
 */
export async function onRequestGet(context) {
    const { request, env } = context;
    const url = new URL(request.url);

    const conference = url.searchParams.get('conference'); // 'Eastern' or 'Western'
    const division = url.searchParams.get('division');

    try {
        const cacheKey = `nba:standings:${conference || division || 'all'}`;

        const standings = await cache(env, cacheKey, async () => {
            return await fetchNBAStandings(conference, division, env);
        }, 300); // 5 minute cache

        return ok({
            league: 'NBA',
            season: '2025-26',
            standings,
            meta: {
                dataSource: 'ESPN NBA API',
                schemaVersion: standings.schemaVersion || 'unknown',
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
async function fetchNBAStandings(filterConference, filterDivision, env) {
    return await withRetry(async () => {
        const headers = {
            'User-Agent': 'BlazeSportsIntel/1.0 (https://blazesportsintel.com)',
            'Accept': 'application/json'
        };

        const standingsUrl = 'https://site.api.espn.com/apis/v2/sports/basketball/nba/standings';

        const response = await fetchWithTimeout(standingsUrl, { headers }, 10000);

        if (!response.ok) {
            throw new Error(`ESPN API returned ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        // Detect schema version
        const schemaVersion = detectSchemaVersion(data);

        // Log to analytics if available
        if (env?.ANALYTICS) {
            try {
                env.ANALYTICS.writeDataPoint({
                    blobs: ['nba_schema_version'],
                    doubles: [schemaVersion === 'new_2025' ? 1 : 0],
                    indexes: [schemaVersion]
                });
            } catch (e) {
                console.warn('[Analytics] Failed to write schema version:', e);
            }
        }

        // Process standings data with appropriate handler
        const processed = processNBAStandingsData(data, filterConference, filterDivision, schemaVersion);

        // Add schema version to response
        processed.schemaVersion = schemaVersion;

        return processed;
    }, 3, 250); // 3 retries with 250ms base delay
}

/**
 * Detect which schema version ESPN is using
 */
function detectSchemaVersion(data) {
    const firstConf = data?.children?.[0];

    if (!firstConf) {
        return 'unknown';
    }

    // New schema (2025): Conference has isConference flag and direct standings
    if (firstConf.isConference === true && firstConf.standings?.entries) {
        return 'new_2025';
    }

    // Legacy schema: Conference has children (divisions)
    if (Array.isArray(firstConf.children) && firstConf.children.length > 0) {
        return 'legacy_divisions';
    }

    return 'unknown';
}

/**
 * Process and validate NBA standings data (DUAL-SCHEMA SUPPORT)
 */
function processNBAStandingsData(data, filterConference, filterDivision, schemaVersion) {
    const conferences = {};
    const conferenceData = Array.isArray(data.children) ? data.children : [];

    conferenceData.forEach(conf => {
        const conferenceName = conf.name;
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

        // NEW SCHEMA (2025): Teams directly under conference
        if (schemaVersion === 'new_2025' && conf.standings?.entries) {

            const teams = (conf.standings.entries || [])
                .map(entry => processTeamEntry(entry, conferenceAbbr, conferenceName, filterDivision))
                .filter(Boolean); // Remove nulls (filtered teams)

            if (teams.length > 0) {
                // Create a synthetic division containing all teams
                conferences[conferenceAbbr].divisions.push({
                    name: conferenceName,
                    abbreviation: conferenceAbbr,
                    teams: teams.sort(sortTeamsByWins)
                });
            }

            return; // Skip legacy processing
        }

        // LEGACY SCHEMA (pre-2025): Divisions contain teams
        if (schemaVersion === 'legacy_divisions' || schemaVersion === 'unknown') {

            const divisions = Array.isArray(conf.children) ? conf.children : [];

            divisions.forEach(division => {
                const divisionName = division.name;
                const divisionAbbr = divisionName?.split(' ')[0];

                // Filter by division if specified
                if (filterDivision && !divisionName?.includes(filterDivision)) {
                    return;
                }

                const teams = (division.standings?.entries || [])
                    .map(entry => processTeamEntry(entry, conferenceAbbr, divisionName, null))
                    .filter(Boolean);

                if (teams.length > 0) {
                    conferences[conferenceAbbr].divisions.push({
                        name: divisionName,
                        abbreviation: divisionAbbr,
                        teams: teams.sort(sortTeamsByWins)
                    });
                }
            });
        }
    });

    return Object.values(conferences);
}

/**
 * Process a single team entry (works for both schemas)
 */
function processTeamEntry(entry, conferenceAbbr, divisionName, filterDivision) {
    if (!entry || !entry.team) {
        return null;
    }

    const team = entry.team;
    const stats = Array.isArray(entry.stats) ? entry.stats : [];

    // Extract stats (identical in both schemas)
    const wins = getStat(stats, 'wins') || 0;
    const losses = getStat(stats, 'losses') || 0;
    const gamesPlayed = getStat(stats, 'gamesPlayed') || 0;
    const winPercent = getStat(stats, 'winPercent') || 0;
    const gamesBehind = getDisplayStat(stats, 'gamesBehind') || '0.0';
    const streak = getDisplayStat(stats, 'streak') || '-';
    const pointsFor = getStat(stats, 'pointsFor') || 0;
    const pointsAgainst = getStat(stats, 'pointsAgainst') || 0;

    // Get split records
    const vsConf = getDisplayStat(stats, 'vs. Conf.') || 'N/A';
    const vsDiv = getDisplayStat(stats, 'vs. Div.') || 'N/A';
    const home = getDisplayStat(stats, 'home') || 'N/A';
    const road = getDisplayStat(stats, 'road') || 'N/A';
    const lastTen = getDisplayStat(stats, 'L10') || 'N/A';

    // In new schema, division filter might be applied at team level
    if (filterDivision) {
        // Check if team belongs to requested division (if stored in team data)
        const teamDivision = team.division || divisionName;
        if (!teamDivision?.toLowerCase().includes(filterDivision.toLowerCase())) {
            return null; // Filtered out
        }
    }

    const teamData = {
        id: team.id,
        name: team.displayName,
        abbreviation: team.abbreviation,
        logo: team.logos?.[0]?.href ?? null,
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
        divisionAbbr: divisionName?.split(' ')[0] || conferenceAbbr,
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
        console.warn(`[NBA Adapter] Invalid record for ${team.displayName}:`, validation.errors);
    }

    return teamData;
}

/**
 * Extract numeric stat value
 */
function getStat(stats, name) {
    const stat = stats.find(s => s?.name === name);
    return stat?.value ?? null;
}

/**
 * Extract display stat value (string)
 */
function getDisplayStat(stats, name) {
    const stat = stats.find(s => s?.name === name);
    return stat?.displayValue ?? null;
}

/**
 * Sort teams by wins (descending), then by winning percentage
 */
function sortTeamsByWins(a, b) {
    if (b.wins !== a.wins) {
        return b.wins - a.wins;
    }
    return parseFloat(b.record.winningPercentage) - parseFloat(a.record.winningPercentage);
}
