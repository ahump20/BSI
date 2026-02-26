/**
 * College Baseball — player detail, list, and compare handlers.
 */

import type { Env } from './shared';
import { json, cachedJson, kvGet, kvPut, dataHeaders, getCollegeClient, getHighlightlyClient, HTTP_CACHE, CACHE_TTL, SEASON, teamMetadata, getLogoUrl, getD1PlayerStats, queryPlayersFromD1, computeBattingDifferentials, computePitchingDifferentials } from './shared';
import { transformHighlightlyPlayer, transformEspnPlayer } from './transforms';

export async function handleCollegeBaseballPlayer(
  playerId: string,
  env: Env
): Promise<Response> {
  const cacheKey = `cb:player:${playerId}`;
  const now = new Date().toISOString();

  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) {
    return cachedJson(cached, 200, HTTP_CACHE.player, { ...dataHeaders(now, 'cache'), 'X-Cache': 'HIT' });
  }

  // Highlightly first
  const hlClient = getHighlightlyClient(env);
  if (hlClient) {
    try {
      const [playerResult, statsResult] = await Promise.all([
        hlClient.getPlayer(parseInt(playerId, 10)),
        hlClient.getPlayerStatistics(parseInt(playerId, 10)),
      ]);

      if (playerResult.success && playerResult.data) {
        const payload = transformHighlightlyPlayer(
          playerResult.data,
          statsResult.success ? (statsResult.data ?? null) : null
        );
        // Enrich with D1 stats/headshot if Highlightly returned no statistics
        if (!payload.statistics || !(payload.player as Record<string, unknown>)?.headshot) {
          const d1Stats = await getD1PlayerStats(playerId, env);
          if (d1Stats && !payload.statistics) payload.statistics = d1Stats;
          // Backfill headshot from D1 (ESPN CDN URL) if Highlightly doesn't have one
          const pObj = payload.player as Record<string, unknown> | undefined;
          if (pObj && !pObj.headshot) {
            const row = await env.DB.prepare(
              `SELECT headshot FROM player_season_stats WHERE espn_id = ? AND sport = 'college-baseball' AND season = 2026`
            ).bind(playerId).first<{ headshot: string }>();
            if (row?.headshot) pObj.headshot = row.headshot;
          }
        }
        const source = payload.statistics && !(statsResult.success && statsResult.data) ? 'highlightly+d1' : 'highlightly';
        const wrapped = { ...payload, meta: { source, fetched_at: playerResult.timestamp, timezone: 'America/Chicago' } };
        await kvPut(env.KV, cacheKey, wrapped, CACHE_TTL.players);
        return cachedJson(wrapped, 200, HTTP_CACHE.player, {
          ...dataHeaders(playerResult.timestamp, source), 'X-Cache': 'MISS',
        });
      }
    } catch (err) {
      console.error('[highlightly] player fallback:', err instanceof Error ? err.message : err);
    }
  }

  // ESPN/NCAA fallback
  try {
    const client = getCollegeClient();
    const [playerResult, statsResult] = await Promise.all([
      client.getPlayer(parseInt(playerId, 10)),
      client.getPlayerStatistics(parseInt(playerId, 10)),
    ]);

    if (playerResult.success && playerResult.data) {
      const payload = transformEspnPlayer(
        playerResult.data as Record<string, unknown>,
        statsResult.success ? (statsResult.data as Record<string, unknown> | null) : null
      );
      // Enrich with D1 stats if ESPN returned no statistics
      let d1Enriched = false;
      if (!payload.statistics) {
        const d1Stats = await getD1PlayerStats(playerId, env);
        if (d1Stats) {
          payload.statistics = d1Stats;
          d1Enriched = true;
        }
      }
      const source = d1Enriched ? 'espn+d1' : 'espn';
      const wrapped = { ...payload, meta: { source, fetched_at: playerResult.timestamp, timezone: 'America/Chicago' } };
      await kvPut(env.KV, cacheKey, wrapped, CACHE_TTL.players);
      return cachedJson(wrapped, 200, HTTP_CACHE.player, {
        ...dataHeaders(playerResult.timestamp, source), 'X-Cache': 'MISS',
      });
    }
  } catch (err) {
    console.error('[espn] player fallback:', err instanceof Error ? err.message : err);
  }

  // D1-only fallback — player exists in box score data but not in ESPN/Highlightly roster
  try {
    const row = await env.DB.prepare(
      `SELECT * FROM player_season_stats
       WHERE espn_id = ? AND sport = 'college-baseball' AND season = ?`
    ).bind(playerId, SEASON).first<D1PlayerStats>();

    if (row) {
      const d1Stats = await getD1PlayerStats(playerId, env);
      const payload = {
        player: {
          id: Number(row.espn_id),
          name: row.name,
          position: row.position,
          jerseyNumber: undefined,
          team: { id: Number(row.team_id), name: row.team, shortName: undefined, conference: undefined },
          headshot: row.headshot || undefined,
        },
        statistics: d1Stats,
        meta: { source: 'd1', fetched_at: now, timezone: 'America/Chicago' },
      };
      await kvPut(env.KV, cacheKey, payload, CACHE_TTL.players);
      return cachedJson(payload, 200, HTTP_CACHE.player, {
        ...dataHeaders(now, 'd1'), 'X-Cache': 'MISS',
      });
    }
  } catch (err) {
    console.error('[d1] player fallback:', err instanceof Error ? err.message : err);
  }

  return json({ player: null, statistics: null }, 502, { ...dataHeaders(now, 'error'), 'X-Cache': 'ERROR' });
}

export async function handleCollegeBaseballPlayersList(url: URL, env: Env): Promise<Response> {
  const team = url.searchParams.get('team') || '';
  const search = url.searchParams.get('search') || '';
  const position = url.searchParams.get('position') || '';
  const sortBy = url.searchParams.get('sort') || '';
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '50', 10)));
  const offset = (page - 1) * limit;

  // D1 primary path — query accumulated stats directly
  try {
    const d1Result = await queryPlayersFromD1(env, { search, team, position, sortBy, limit, offset });
    if (d1Result && d1Result.length > 0) {
      const payload = {
        players: d1Result,
        meta: { source: 'd1-accumulated', fetched_at: new Date().toISOString(), timezone: 'America/Chicago' },
      };
      return cachedJson(payload, 200, HTTP_CACHE.player, {
        ...dataHeaders(new Date().toISOString(), 'd1'), 'X-Cache': 'MISS',
      });
    }
  } catch (err) {
    console.error('[d1] players list query failed:', err instanceof Error ? err.message : err);
  }

  // ESPN fallback — used when D1 has no data (offseason)
  const now = new Date().toISOString();
  const cacheKey = `cb:players:list:${team || 'all'}`;

  let roster: Record<string, unknown>[] | null = null;
  const cached = await kvGet<Record<string, unknown>[]>(env.KV, cacheKey);
  if (cached) {
    roster = cached;
  } else {
    const client = getCollegeClient();

    if (team) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);
        const teamsRes = await fetch(
          `https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball/teams?limit=400`,
          { signal: controller.signal }
        );
        clearTimeout(timeout);

        if (teamsRes.ok) {
          const teamsData = (await teamsRes.json()) as Record<string, unknown>;
          const teamsList = ((teamsData.sports as Record<string, unknown>[])?.[0]?.leagues as Record<string, unknown>[])?.[0]?.teams as Record<string, unknown>[] || [];
          const matched = teamsList.find((t) => {
            const tObj = (t.team || t) as Record<string, unknown>;
            const name = (tObj.displayName || tObj.name || '') as string;
            return name.toLowerCase().includes(team.toLowerCase());
          });

          if (matched) {
            const tObj = (matched.team || matched) as Record<string, unknown>;
            const teamIdNum = parseInt(tObj.id as string, 10);
            const teamName = (tObj.displayName || tObj.name || '') as string;
            const result = await client.getTeamPlayers(teamIdNum);
            if (result.success && result.data) {
              roster = (result.data.data || []) as Record<string, unknown>[];
              for (const p of roster) {
                p._teamName = teamName;
              }
            }
          }
        }
      } catch {
        // Fall through
      }
    }

    if (!roster) {
      const topTeams = [
        { id: 126, name: 'Texas Longhorns', conf: 'SEC' },
        { id: 85, name: 'LSU Tigers', conf: 'SEC' },
        { id: 123, name: 'Texas A&M Aggies', conf: 'SEC' },
        { id: 58, name: 'Arkansas Razorbacks', conf: 'SEC' },
        { id: 75, name: 'Florida Gators', conf: 'SEC' },
        { id: 120, name: 'Vanderbilt Commodores', conf: 'SEC' },
        { id: 199, name: 'Tennessee Volunteers', conf: 'SEC' },
        { id: 92, name: 'Ole Miss Rebels', conf: 'SEC' },
      ];
      const results = await Promise.allSettled(
        topTeams.map((t) => client.getTeamPlayers(t.id))
      );

      roster = [];
      for (let i = 0; i < results.length; i++) {
        const r = results[i];
        if (r.status === 'fulfilled' && r.value.success && r.value.data) {
          const players = (r.value.data.data || []) as Record<string, unknown>[];
          for (const p of players) {
            p._teamName = topTeams[i].name;
            p._teamConf = topTeams[i].conf;
          }
          roster.push(...players);
        }
      }
    }

    if (roster.length > 0) {
      await kvPut(env.KV, cacheKey, roster, CACHE_TTL.players);
    }
  }

  // Apply filters in memory
  let filtered = roster || [];

  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter((p) => {
      const name = ((p.displayName || p.fullName || p.name || '') as string).toLowerCase();
      const hometown = ((p.birthPlace as Record<string, unknown>)?.city as string || '').toLowerCase();
      return name.includes(q) || hometown.includes(q);
    });
  }

  if (position) {
    filtered = filtered.filter((p) => {
      const pos = ((p.position as Record<string, unknown>)?.abbreviation as string || '').toUpperCase();
      if (position === 'IF') return ['1B', '2B', '3B', 'SS', 'IF'].includes(pos);
      if (position === 'OF') return ['LF', 'CF', 'RF', 'OF'].includes(pos);
      return pos === position.toUpperCase();
    });
  }

  // Transform ESPN roster to frontend Player shape
  const players = filtered.map((p) => {
    const pos = p.position as Record<string, unknown> | undefined;
    const exp = p.experience as Record<string, unknown> | undefined;
    const team_ = p.team as Record<string, unknown> | undefined;
    const birthPlace = p.birthPlace as Record<string, unknown> | undefined;

    const batsRaw = p.bats;
    const throwsRaw = p.throws;
    const batsStr = typeof batsRaw === 'string' ? batsRaw
      : (batsRaw as Record<string, unknown>)?.abbreviation as string || '';
    const throwsStr = typeof throwsRaw === 'string' ? throwsRaw
      : (throwsRaw as Record<string, unknown>)?.abbreviation as string || '';

    return {
      id: String(p.id || ''),
      name: (p.displayName || p.fullName || '') as string,
      team: (team_?.displayName || p._teamName || '') as string,
      jersey: (p.jersey || '') as string,
      position: (pos?.abbreviation || pos?.name || '') as string,
      classYear: (exp?.displayValue || exp?.abbreviation || '') as string,
      conference: (team_?.conference || p._teamConf || '') as string,
      bio: {
        height: (p.displayHeight || '') as string,
        weight: Number(p.weight || 0),
        bats: batsStr,
        throws: throwsStr,
        hometown: birthPlace ? `${birthPlace.city || ''}${birthPlace.state ? `, ${birthPlace.state}` : ''}` : '',
      },
    };
  });

  const payload = {
    players,
    meta: { source: 'espn', fetched_at: now, timezone: 'America/Chicago' },
  };

  return cachedJson(payload, 200, HTTP_CACHE.player, { ...dataHeaders(now, 'espn'), 'X-Cache': roster === cached ? 'HIT' : 'MISS' });
}

export async function handleCollegeBaseballPlayerCompare(
  playerId1: string,
  playerId2: string,
  env: Env,
): Promise<Response> {
  const now = new Date().toISOString();

  try {
    const [res1, res2] = await Promise.all([
      handleCollegeBaseballPlayer(playerId1, env),
      handleCollegeBaseballPlayer(playerId2, env),
    ]);

    const [data1, data2] = await Promise.all([res1.json() as Promise<Record<string, unknown>>, res2.json() as Promise<Record<string, unknown>>]);

    if (!data1?.player || !data2?.player) {
      return json({ error: 'One or both players not found', meta: { source: 'bsi', fetched_at: now, timezone: 'America/Chicago' } }, 404);
    }

    const p1Stats = (data1.stats ?? {}) as Record<string, Record<string, number>>;
    const p2Stats = (data2.stats ?? {}) as Record<string, Record<string, number>>;

    const hasBatting = p1Stats.batting && p2Stats.batting;
    const hasPitching = p1Stats.pitching && p2Stats.pitching;
    const type = hasBatting && hasPitching ? 'mixed' : hasPitching ? 'pitching' : 'batting';

    const differentials: Record<string, number> = {
      ...(hasBatting ? computeBattingDifferentials(p1Stats.batting, p2Stats.batting) : {}),
      ...(hasPitching ? computePitchingDifferentials(p1Stats.pitching, p2Stats.pitching) : {}),
    };

    return json({
      player1: data1,
      player2: data2,
      comparison: { type, differentials },
      meta: { source: 'bsi-compare', fetched_at: now, timezone: 'America/Chicago' },
    });
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : 'Comparison failed', meta: { source: 'bsi', fetched_at: now, timezone: 'America/Chicago' } }, 500);
  }
}

// =============================================================================
// Game Log
// =============================================================================

interface GameLogRow {
  espn_id: string;
  game_id: string;
  game_date: string;
  opponent: string | null;
  is_home: number;
  result: string | null;
  ab: number; r: number; h: number; rbi: number; hr: number; bb: number; k: number; sb: number;
  ip_thirds: number; ha: number; er: number; so: number; bb_p: number; w: number; l: number; sv: number;
}

export async function handlePlayerGameLog(
  playerId: string,
  env: Env,
): Promise<Response> {
  const now = new Date().toISOString();

  try {
    const { results } = await env.DB.prepare(
      `SELECT * FROM player_game_log
       WHERE espn_id = ? AND sport = 'college-baseball'
       ORDER BY game_date DESC
       LIMIT 100`
    ).bind(playerId).all<GameLogRow>();

    const games = (results || []).map((row) => {
      const isBatting = row.ab > 0 || row.h > 0 || row.bb > 0 || row.k > 0;
      const isPitching = row.ip_thirds > 0;
      const ip = row.ip_thirds / 3;

      return {
        gameId: row.game_id,
        date: row.game_date,
        opponent: row.opponent,
        isHome: row.is_home === 1,
        result: row.result,
        batting: isBatting ? {
          ab: row.ab, r: row.r, h: row.h, rbi: row.rbi,
          hr: row.hr, bb: row.bb, k: row.k, sb: row.sb,
          avg: row.ab > 0 ? Math.round((row.h / row.ab) * 1000) / 1000 : 0,
        } : undefined,
        pitching: isPitching ? {
          ip: Math.round(ip * 10) / 10,
          h: row.ha, er: row.er, so: row.so, bb: row.bb_p,
          w: row.w, l: row.l, sv: row.sv,
          era: ip > 0 ? Math.round((row.er * 9 / ip) * 100) / 100 : 0,
        } : undefined,
      };
    });

    return json({
      playerId,
      games,
      meta: { source: 'd1-game-log', fetched_at: now, timezone: 'America/Chicago' },
    });
  } catch (err) {
    console.error('[game-log]', err instanceof Error ? err.message : err);
    return json({
      playerId,
      games: [],
      meta: { source: 'd1-game-log', fetched_at: now, timezone: 'America/Chicago' },
    });
  }
}

// =============================================================================
// Historical Trends
// =============================================================================

function computeTrendSummary(snapshots: Array<{ wins: number; losses: number; ranking: number | null }>) {
  if (snapshots.length === 0) return { currentStreak: 'N/A', last10: 'N/A', rankingChange: null };

  let streakType = '';
  let streakCount = 0;
  for (let i = snapshots.length - 1; i > 0; i--) {
    const winDiff = snapshots[i].wins - snapshots[i - 1].wins;
    const lossDiff = snapshots[i].losses - snapshots[i - 1].losses;
    const dayType = winDiff > 0 ? 'W' : lossDiff > 0 ? 'L' : '';
    if (i === snapshots.length - 1) { streakType = dayType; streakCount = dayType ? 1 : 0; }
    else if (dayType === streakType && dayType) streakCount++;
    else break;
  }

  const last = snapshots[snapshots.length - 1];
  const tenAgo = snapshots.length >= 11 ? snapshots[snapshots.length - 11] : snapshots[0];
  const last10W = last.wins - tenAgo.wins;
  const last10L = last.losses - tenAgo.losses;

  const firstRank = snapshots.find(s => s.ranking != null)?.ranking ?? null;
  const lastRank = [...snapshots].reverse().find(s => s.ranking != null)?.ranking ?? null;
  const rankingChange = firstRank != null && lastRank != null ? firstRank - lastRank : null;

  return {
    currentStreak: streakCount > 0 ? `${streakType}${streakCount}` : 'N/A',
    last10: `${last10W}-${last10L}`,
    rankingChange,
  };
}
