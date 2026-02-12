// MLB Standings API - SportsDataIO
// Fetches real-time MLB standings
//
// GET /api/mlb/standings?division=AL_East&league=AL
// Data Source: SportsDataIO MLB API

import { ok, err, rateLimit, rateLimitError, getSportsDataApiKey } from '../_utils.js';

async function fetchMLBStandings(apiKey, season) {
  const url = `https://api.sportsdata.io/v3/mlb/scores/json/Standings/${season}`;
  const res = await fetch(url, {
    headers: { 'Ocp-Apim-Subscription-Key': apiKey },
  });
  if (!res.ok) {
    return { success: false, data: null, error: `SportsDataIO ${res.status}`, source: { provider: 'SportsDataIO', endpoint: url, cacheHit: false, fetchedAt: new Date().toISOString() } };
  }
  const data = await res.json();
  return { success: true, data, source: { provider: 'SportsDataIO', endpoint: url, cacheHit: false, fetchedAt: new Date().toISOString() } };
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  const limit = await rateLimit(env, request, 100, 60000);
  if (!limit.allowed) {
    return rateLimitError(limit.resetAt, limit.retryAfter);
  }

  const divisionFilter = url.searchParams.get('division');
  const leagueFilter = url.searchParams.get('league');
  const season = url.searchParams.get('season')
    ? parseInt(url.searchParams.get('season'))
    : undefined;

  try {
    const apiKey = getSportsDataApiKey(env);
    if (!apiKey) {
      return err(new Error('Missing SPORTS_DATA_IO_API_KEY configuration'), 500);
    }

    let effectiveSeason = season || new Date().getFullYear();
    let response = await fetchMLBStandings(apiKey, effectiveSeason);
    if (!season && response.success && Array.isArray(response.data) && response.data.length === 0) {
      effectiveSeason = new Date().getFullYear() - 1;
      response = await fetchMLBStandings(apiKey, effectiveSeason);
    }

    if (!response.success || !response.data) {
      return err(new Error(response.error || 'Failed to fetch MLB standings'), 502);
    }

    let standings = response.data.map((t) => ({
      teamName: t.City ? `${t.City} ${t.Name}` : t.Name,
      teamKey: t.Key,
      teamAbbreviation: t.Key,
      city: t.City,
      wins: t.Wins,
      losses: t.Losses,
      winPercentage: t.Percentage,
      gamesBack: t.GamesBehind ?? 0,
      division: t.Division,
      league: t.League,
      runsScored: t.RunsScored ?? 0,
      runsAllowed: t.RunsAgainst ?? 0,
      streakCode: t.StreakDescription || '-',
      streak: t.StreakDescription,
      home: t.HomeWins != null ? `${t.HomeWins}-${t.HomeLosses}` : '-',
      away: t.AwayWins != null ? `${t.AwayWins}-${t.AwayLosses}` : '-',
      last10: t.LastTenGamesWins != null ? `${t.LastTenGamesWins}-${t.LastTenGamesLosses}` : '-',
    }));

    if (leagueFilter) {
      standings = standings.filter((t) => {
        if (leagueFilter === 'AL') return t.league === 'AL' || t.league === 'American';
        if (leagueFilter === 'NL') return t.league === 'NL' || t.league === 'National';
        return true;
      });
    }

    if (divisionFilter) {
      standings = standings.filter(
        (t) => t.division && t.division.includes(divisionFilter.replace('_', ' '))
      );
    }

    standings.sort((a, b) => {
      if (a.league !== b.league) return a.league < b.league ? -1 : 1;
      if (a.division !== b.division) return a.division < b.division ? -1 : 1;
      return b.wins - a.wins;
    });

    return ok({
      league: 'MLB',
      season: effectiveSeason,
      standings,
      meta: {
        dataSource: 'SportsDataIO',
        lastUpdated: new Date().toISOString(),
        timezone: 'America/New_York',
        cached: false,
        totalTeams: standings.length,
      },
    });
  } catch (error) {
    return err(error);
  }
}
