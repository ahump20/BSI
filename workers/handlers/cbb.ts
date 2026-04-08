/**
 * College Basketball (CBB) Handlers
 *
 * Minimal coverage for March Madness timing. Uses SportsDataIO as
 * the primary data source. ESPN available as fallback for scores.
 */

import type { Env } from '../shared/types';
import { cachedJson, kvGet, kvPut, getSDIOClient, withMeta, freshDataHeaders, cachedPayloadHeaders } from '../shared/helpers';
import { HTTP_CACHE, CACHE_TTL } from '../shared/constants';
import { getScoreboard, getStandings, transformScoreboard, transformStandings } from '../../lib/api-clients/espn-api';

export async function handleCBBScores(url: URL, env: Env): Promise<Response> {
  try {
    const date = url.searchParams.get('date') || undefined;
    const dateKey = date?.replace(/-/g, '') || 'today';
    const cacheKey = `cbb:scores:${dateKey}`;

    const cached = await kvGet<unknown>(env.KV, cacheKey);
    if (cached) return cachedJson(cached, 200, HTTP_CACHE.scores, cachedPayloadHeaders(cached));

    // Try SportsDataIO first
    const sdio = getSDIOClient(env);
    if (sdio) {
      try {
        const games = await sdio.getCBBScores(date);
        const payload = withMeta({
          games: games.map(g => ({
            id: g.GameID,
            date: g.DateTime || g.Day,
            status: g.Status,
            homeTeam: { name: g.HomeTeam, score: g.HomeTeamScore, id: g.HomeTeamID },
            awayTeam: { name: g.AwayTeam, score: g.AwayTeamScore, id: g.AwayTeamID },
            period: g.Period,
            channel: g.Channel,
            season: g.Season,
          })),
        }, 'sportsdataio');
        await kvPut(env.KV, cacheKey, payload, CACHE_TTL.scores);
        return cachedJson(payload, 200, HTTP_CACHE.scores, freshDataHeaders('sportsdataio'));
      } catch {
        // Fall through to ESPN
      }
    }

    // ESPN fallback
    try {
      const espnDate = date ? date.replace(/-/g, '') : undefined;
      const raw = await getScoreboard('mens-college-basketball' as Parameters<typeof getScoreboard>[0], espnDate);
      const payload = withMeta(transformScoreboard(raw as Record<string, unknown>));
      await kvPut(env.KV, cacheKey, payload, CACHE_TTL.scores);
      return cachedJson(payload, 200, HTTP_CACHE.scores, freshDataHeaders('espn'));
    } catch {
      return cachedJson(withMeta({ games: [] }, 'error'), 200, 0);
    }
  } catch (err) {
    console.error('[handleCBBScores]', err instanceof Error ? err.message : err);
    return cachedJson({ error: 'Internal server error', status: 500 }, 500, 0);
  }
}

export async function handleCBBStandings(env: Env): Promise<Response> {
  try {
    const cacheKey = 'cbb:standings';

    const cached = await kvGet<unknown>(env.KV, cacheKey);
    if (cached) return cachedJson(cached, 200, HTTP_CACHE.standings, cachedPayloadHeaders(cached));

    const sdio = getSDIOClient(env);
    if (sdio) {
      try {
        const standings = await sdio.getCBBStandings();
        const payload = withMeta({
          standings: standings.map(s => ({
            team: s.Name || s.Key,
            conference: s.Conference,
            wins: s.Wins,
            losses: s.Losses,
            conferenceWins: s.ConferenceWins,
            conferenceLosses: s.ConferenceLosses,
            winPct: s.Percentage,
          })),
        }, 'sportsdataio');
        await kvPut(env.KV, cacheKey, payload, CACHE_TTL.standings);
        return cachedJson(payload, 200, HTTP_CACHE.standings, freshDataHeaders('sportsdataio'));
      } catch {
        // Fall through
      }
    }

    return cachedJson(withMeta({ standings: [] }, 'error'), 200, 0);
  } catch (err) {
    console.error('[handleCBBStandings]', err instanceof Error ? err.message : err);
    return cachedJson({ error: 'Internal server error', status: 500 }, 500, 0);
  }
}

export async function handleCBBTeams(env: Env): Promise<Response> {
  try {
    const cacheKey = 'cbb:teams';

    const cached = await kvGet<unknown>(env.KV, cacheKey);
    if (cached) return cachedJson(cached, 200, HTTP_CACHE.team, cachedPayloadHeaders(cached));

    const sdio = getSDIOClient(env);
    if (sdio) {
      try {
        const teams = await sdio.getCBBTeams();
        const payload = withMeta({
          teams: teams.map(t => ({
            id: t.TeamID,
            name: t.School || t.Name,
            shortName: t.ShortDisplayName || t.Key,
            conference: t.Conference,
            logo: t.TeamLogoUrl,
          })),
        }, 'sportsdataio');
        await kvPut(env.KV, cacheKey, payload, CACHE_TTL.teams);
        return cachedJson(payload, 200, HTTP_CACHE.team, freshDataHeaders('sportsdataio'));
      } catch {
        // Fall through
      }
    }

    return cachedJson(withMeta({ teams: [] }, 'error'), 200, 0);
  } catch (err) {
    console.error('[handleCBBTeams]', err instanceof Error ? err.message : err);
    return cachedJson({ error: 'Internal server error', status: 500 }, 500, 0);
  }
}
