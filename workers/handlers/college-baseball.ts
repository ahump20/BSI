/**
 * College Baseball route handlers — extracted from workers/index.ts.
 *
 * Every function here is a mechanical copy of the original handler logic.
 * Only import paths have been adjusted to reflect the new file location.
 */

import type { Env } from '../shared/types';
import { json, cachedJson, kvGet, kvPut, dataHeaders, getCollegeClient, getHighlightlyClient } from '../shared/helpers';
import { HTTP_CACHE, CACHE_TTL } from '../shared/constants';
import type {
  HighlightlyMatch,
  HighlightlyTeamDetail,
  HighlightlyPlayer,
  HighlightlyPlayerStats,
  HighlightlyBoxScore,
} from '../../lib/api-clients/highlightly-api';

// ---------------------------------------------------------------------------
// Team Detail Transform — Highlightly → Team interface
// ---------------------------------------------------------------------------

export function transformHighlightlyTeam(
  team: HighlightlyTeamDetail,
  players: HighlightlyPlayer[]
): Record<string, unknown> {
  return {
    id: String(team.id),
    name: team.name,
    abbreviation: team.shortName ?? '',
    mascot: '',
    conference: team.conference?.name ?? '',
    division: 'D1',
    logo: team.logo,
    location: { city: '', state: '', stadium: undefined, capacity: undefined },
    colors: team.primaryColor ? { primary: team.primaryColor, secondary: team.secondaryColor ?? '' } : undefined,
    roster: players.map((p) => ({
      id: String(p.id),
      name: p.name,
      number: p.jerseyNumber ?? '',
      position: p.position ?? '',
      year: '',
      stats: p.statistics?.batting
        ? { avg: p.statistics.batting.battingAverage, hr: p.statistics.batting.homeRuns, rbi: p.statistics.batting.rbi }
        : p.statistics?.pitching
          ? { era: p.statistics.pitching.era, wins: p.statistics.pitching.wins, so: p.statistics.pitching.strikeouts }
          : undefined,
    })),
  };
}

export function transformEspnTeam(
  raw: Record<string, unknown>,
  athletes: unknown[]
): Record<string, unknown> {
  const team = (raw.team ?? raw) as Record<string, unknown>;
  const loc = team.location as Record<string, unknown> | undefined;
  const logos = (team.logos as Array<Record<string, unknown>>) ?? [];
  const colors = (team.color as string) ?? undefined;
  const altColor = (team.alternateColor as string) ?? undefined;
  const record = (team.record as Record<string, unknown>) ?? {};
  const items = (record.items as Array<Record<string, unknown>>) ?? [];
  const overall = items.find((it) => (it.type as string) === 'total') ?? items[0];
  const overallStats = (overall?.stats as Array<Record<string, unknown>>) ?? [];

  const getStat = (name: string): number => {
    const s = overallStats.find((st) => st.name === name || st.abbreviation === name);
    return Number(s?.value ?? 0);
  };

  return {
    id: String(team.id ?? ''),
    name: (team.displayName as string) ?? (team.name as string) ?? '',
    abbreviation: (team.abbreviation as string) ?? '',
    mascot: (team.nickname as string) ?? '',
    conference: ((team.groups as Record<string, unknown>)?.name as string) ?? '',
    division: 'D1',
    logo: logos[0]?.href as string | undefined,
    location: {
      city: (loc?.city as string) ?? '',
      state: (loc?.state as string) ?? '',
      stadium: (team.venue as Record<string, unknown>)?.fullName as string | undefined,
      capacity: (team.venue as Record<string, unknown>)?.capacity as number | undefined,
    },
    colors: colors ? { primary: `#${colors}`, secondary: altColor ? `#${altColor}` : '' } : undefined,
    stats: overall ? {
      wins: getStat('wins'),
      losses: getStat('losses'),
      confWins: 0,
      confLosses: 0,
      rpi: 0,
      streak: undefined,
      runsScored: 0,
      runsAllowed: 0,
      battingAvg: 0,
      era: 0,
    } : undefined,
    roster: (athletes as Record<string, unknown>[]).map((a) => {
      const items2 = (a.items ?? a.athletes ?? [a]) as Record<string, unknown>[];
      return items2.map((p) => ({
        id: String(p.id ?? ''),
        name: (p.displayName as string) ?? (p.fullName as string) ?? '',
        number: String(p.jersey ?? ''),
        position: ((p.position as Record<string, unknown>)?.abbreviation as string) ?? '',
        year: (p.experience as Record<string, unknown>)?.displayValue as string ?? '',
      }));
    }).flat(),
  };
}

// ---------------------------------------------------------------------------
// Player Detail Transform — Highlightly → PlayerData interface
// ---------------------------------------------------------------------------

export function transformHighlightlyPlayer(
  player: HighlightlyPlayer,
  stats: HighlightlyPlayerStats | null
): Record<string, unknown> {
  return {
    player: {
      id: player.id,
      name: player.name,
      firstName: player.firstName,
      lastName: player.lastName,
      position: player.position,
      jerseyNumber: player.jerseyNumber,
      height: player.height,
      weight: player.weight,
      dateOfBirth: player.dateOfBirth,
      team: player.team
        ? { id: player.team.id, name: player.team.name, shortName: player.team.shortName, conference: player.team.conference ? { name: player.team.conference.name } : undefined }
        : undefined,
    },
    statistics: stats
      ? {
            batting: stats.batting
              ? {
                  games: stats.batting.games, atBats: stats.batting.atBats, runs: stats.batting.runs,
                  hits: stats.batting.hits, doubles: stats.batting.doubles, triples: stats.batting.triples,
                  homeRuns: stats.batting.homeRuns, rbi: stats.batting.rbi, walks: stats.batting.walks,
                  strikeouts: stats.batting.strikeouts, stolenBases: stats.batting.stolenBases,
                  battingAverage: stats.batting.battingAverage, onBasePercentage: stats.batting.onBasePercentage,
                  sluggingPercentage: stats.batting.sluggingPercentage, ops: stats.batting.ops,
                }
              : undefined,
            pitching: stats.pitching
              ? {
                  games: stats.pitching.games, gamesStarted: stats.pitching.gamesStarted,
                  wins: stats.pitching.wins, losses: stats.pitching.losses, saves: stats.pitching.saves,
                  inningsPitched: stats.pitching.inningsPitched, hits: stats.pitching.hits,
                  earnedRuns: stats.pitching.earnedRuns, walks: stats.pitching.walks,
                  strikeouts: stats.pitching.strikeouts, era: stats.pitching.era, whip: stats.pitching.whip,
                }
              : undefined,
        }
      : null,
  };
}

export function transformEspnPlayer(
  raw: Record<string, unknown>,
  overview: Record<string, unknown> | null
): Record<string, unknown> {
  const athlete = (raw.athlete ?? raw) as Record<string, unknown>;
  const pos = athlete.position as Record<string, unknown> | undefined;
  const team = athlete.team as Record<string, unknown> | undefined;
  const groups = team?.groups as Record<string, unknown> | undefined;

  const player: Record<string, unknown> = {
    id: Number(athlete.id ?? 0),
    name: (athlete.displayName as string) ?? (athlete.fullName as string) ?? '',
    firstName: athlete.firstName as string | undefined,
    lastName: athlete.lastName as string | undefined,
    position: (pos?.abbreviation as string) ?? (pos?.name as string),
    jerseyNumber: String(athlete.jersey ?? ''),
    height: (athlete.displayHeight as string) ?? undefined,
    weight: athlete.weight != null ? Number(athlete.weight) : undefined,
    dateOfBirth: (athlete.dateOfBirth as string) ?? undefined,
    team: team
      ? {
            id: Number(team.id ?? 0),
            name: (team.displayName as string) ?? (team.name as string) ?? '',
            shortName: (team.abbreviation as string) ?? undefined,
            conference: groups ? { name: (groups.name as string) ?? '' } : undefined,
          }
      : undefined,
  };

  // Extract statistics from overview endpoint
  let statistics: Record<string, unknown> | null = null;
  if (overview) {
    const categories = (overview.splitCategories ?? overview.categories ?? overview.statistics) as Record<string, unknown>[] | undefined;
    if (categories && Array.isArray(categories)) {
      const battingCat = categories.find((c) =>
        ((c.name as string) ?? '').toLowerCase().includes('batting') || ((c.displayName as string) ?? '').toLowerCase().includes('batting')
      );
      const pitchingCat = categories.find((c) =>
        ((c.name as string) ?? '').toLowerCase().includes('pitching') || ((c.displayName as string) ?? '').toLowerCase().includes('pitching')
      );

      const extractStats = (cat: Record<string, unknown> | undefined): Record<string, number> => {
        if (!cat) return {};
        const splits = (cat.splits as Record<string, unknown>[]) ?? [];
        const season = splits[0]; // First split is usually the current season
        if (!season) return {};
        const statNames = (cat.labels as string[]) ?? (cat.names as string[]) ?? [];
        const statValues = (season.stats as (string | number)[]) ?? [];
        const map: Record<string, number> = {};
        statNames.forEach((name, i) => { map[name.toLowerCase()] = Number(statValues[i] ?? 0); });
        return map;
      };

      const bs = extractStats(battingCat);
      if (Object.keys(bs).length > 0) {
        statistics = statistics ?? {};
        (statistics as Record<string, unknown>).batting = {
          games: bs.gp ?? bs.g ?? 0, atBats: bs.ab ?? 0, runs: bs.r ?? 0,
          hits: bs.h ?? 0, doubles: bs['2b'] ?? 0, triples: bs['3b'] ?? 0,
          homeRuns: bs.hr ?? 0, rbi: bs.rbi ?? 0, walks: bs.bb ?? 0,
          strikeouts: bs.so ?? bs.k ?? 0, stolenBases: bs.sb ?? 0,
          battingAverage: bs.avg ?? bs.ba ?? 0, onBasePercentage: bs.obp ?? 0,
          sluggingPercentage: bs.slg ?? 0, ops: bs.ops ?? 0,
        };
      }

      const ps = extractStats(pitchingCat);
      if (Object.keys(ps).length > 0) {
        statistics = statistics ?? {};
        (statistics as Record<string, unknown>).pitching = {
          games: ps.gp ?? ps.g ?? 0, gamesStarted: ps.gs ?? 0,
          wins: ps.w ?? 0, losses: ps.l ?? 0, saves: ps.sv ?? ps.s ?? 0,
          inningsPitched: ps.ip ?? 0, hits: ps.h ?? 0, earnedRuns: ps.er ?? 0,
          walks: ps.bb ?? 0, strikeouts: ps.so ?? ps.k ?? 0,
          era: ps.era ?? 0, whip: ps.whip ?? 0,
        };
      }
    }
  }

  return { player, statistics };
}

// ---------------------------------------------------------------------------
// Game Detail Transform — Highlightly → CollegeGameData
// ---------------------------------------------------------------------------

export function transformHighlightlyGame(
  match: HighlightlyMatch,
  box: HighlightlyBoxScore | null
): Record<string, unknown> {
  const statusType = match.status?.type ?? 'notstarted';
  const isLive = statusType === 'inprogress';
  const isFinal = statusType === 'finished';

  const formatRecord = (r?: { wins: number; losses: number }) =>
    r ? `${r.wins}-${r.losses}` : undefined;

  const game: Record<string, unknown> = {
    id: String(match.id),
    date: new Date(match.startTimestamp * 1000).toISOString(),
    status: {
      state: statusType === 'inprogress' ? 'in' : statusType === 'finished' ? 'post' : 'pre',
      detailedState: match.status?.description ?? statusType,
      inning: match.currentInning,
      inningState: match.currentInningHalf,
      isLive,
      isFinal,
    },
    teams: {
      away: {
        name: match.awayTeam?.name ?? 'Away',
        abbreviation: match.awayTeam?.shortName ?? '',
        score: match.awayScore ?? 0,
        isWinner: isFinal && (match.awayScore ?? 0) > (match.homeScore ?? 0),
        record: formatRecord(match.awayTeam?.record),
        conference: match.awayTeam?.conference?.name,
        ranking: match.awayTeam?.ranking,
      },
      home: {
        name: match.homeTeam?.name ?? 'Home',
        abbreviation: match.homeTeam?.shortName ?? '',
        score: match.homeScore ?? 0,
        isWinner: isFinal && (match.homeScore ?? 0) > (match.awayScore ?? 0),
        record: formatRecord(match.homeTeam?.record),
        conference: match.homeTeam?.conference?.name,
        ranking: match.homeTeam?.ranking,
      },
    },
    venue: match.venue
      ? { name: match.venue.name, city: match.venue.city, state: match.venue.state }
      : { name: 'TBD' },
  };

  // Linescore from box or match innings
  const innings = box?.linescores ?? match.innings ?? [];
  if (innings.length > 0) {
    game.linescore = {
      innings: innings.map((inn) => ({
        away: 'awayRuns' in inn ? inn.awayRuns : 0,
        home: 'homeRuns' in inn ? inn.homeRuns : 0,
      })),
      totals: {
        away: { runs: match.awayScore ?? 0, hits: box?.away?.hits ?? 0, errors: box?.away?.errors ?? 0 },
        home: { runs: match.homeScore ?? 0, hits: box?.home?.hits ?? 0, errors: box?.home?.errors ?? 0 },
      },
    };
  }

  // Box score batting/pitching lines
  if (box) {
    game.boxscore = {
      away: {
        batting: (box.away?.batting ?? []).map((b) => ({
          player: { id: String(b.player?.id ?? ''), name: b.player?.name ?? '', position: b.position ?? '' },
          ab: b.atBats ?? 0, r: b.runs ?? 0, h: b.hits ?? 0, rbi: b.rbi ?? 0,
          bb: b.walks ?? 0, so: b.strikeouts ?? 0, avg: b.average != null ? b.average.toFixed(3) : '.000',
        })),
        pitching: (box.away?.pitching ?? []).map((p) => ({
          player: { id: String(p.player?.id ?? ''), name: p.player?.name ?? '' },
          decision: p.decision ?? undefined,
          ip: String(p.inningsPitched ?? 0), h: p.hits ?? 0, r: p.runs ?? 0,
          er: p.earnedRuns ?? 0, bb: p.walks ?? 0, so: p.strikeouts ?? 0,
          pitches: p.pitchCount, strikes: p.strikes,
          era: p.era != null ? p.era.toFixed(2) : '0.00',
        })),
      },
      home: {
        batting: (box.home?.batting ?? []).map((b) => ({
          player: { id: String(b.player?.id ?? ''), name: b.player?.name ?? '', position: b.position ?? '' },
          ab: b.atBats ?? 0, r: b.runs ?? 0, h: b.hits ?? 0, rbi: b.rbi ?? 0,
          bb: b.walks ?? 0, so: b.strikeouts ?? 0, avg: b.average != null ? b.average.toFixed(3) : '.000',
        })),
        pitching: (box.home?.pitching ?? []).map((p) => ({
          player: { id: String(p.player?.id ?? ''), name: p.player?.name ?? '' },
          decision: p.decision ?? undefined,
          ip: String(p.inningsPitched ?? 0), h: p.hits ?? 0, r: p.runs ?? 0,
          er: p.earnedRuns ?? 0, bb: p.walks ?? 0, so: p.strikeouts ?? 0,
          pitches: p.pitchCount, strikes: p.strikes,
          era: p.era != null ? p.era.toFixed(2) : '0.00',
        })),
      },
    };
  }

  // Plays
  if (box?.plays && box.plays.length > 0) {
    game.plays = box.plays.map((p, i) => ({
      id: `${p.inning}-${p.half}-${i}`,
      inning: p.inning,
      halfInning: p.half,
      description: p.description,
      result: p.description,
      isScoring: i > 0 && (p.homeScore + p.awayScore) > ((box.plays![i - 1]?.homeScore ?? 0) + (box.plays![i - 1]?.awayScore ?? 0)),
      runsScored: i > 0
        ? (p.homeScore + p.awayScore) - ((box.plays![i - 1]?.homeScore ?? 0) + (box.plays![i - 1]?.awayScore ?? 0))
        : 0,
      scoreAfter: { away: p.awayScore, home: p.homeScore },
    }));
  }

  return game;
}

// ---------------------------------------------------------------------------
// Game Detail Transform — ESPN Summary → CollegeGameData
// ---------------------------------------------------------------------------

export function transformEspnGameSummary(summary: Record<string, unknown>): Record<string, unknown> | null {
  const header = summary.header as Record<string, unknown> | undefined;
  const competitions = (header?.competitions as Record<string, unknown>[]) ?? [];
  const comp = competitions[0];
  if (!comp) return null;

  const competitors = (comp.competitors as Record<string, unknown>[]) ?? [];
  const homeSide = competitors.find((c) => c.homeAway === 'home') as Record<string, unknown> | undefined;
  const awaySide = competitors.find((c) => c.homeAway === 'away') as Record<string, unknown> | undefined;

  const homeTeam = (homeSide?.team as Record<string, unknown>) ?? {};
  const awayTeam = (awaySide?.team as Record<string, unknown>) ?? {};
  const homeScore = Number(homeSide?.score ?? 0);
  const awayScore = Number(awaySide?.score ?? 0);

  const statusObj = (comp.status as Record<string, unknown>) ?? {};
  const statusType = (statusObj.type as Record<string, unknown>) ?? {};
  const state = (statusType.state as string) ?? 'pre';
  const isFinal = state === 'post';
  const isLive = state === 'in';

  const homeLinescores = (homeSide?.linescores as Array<Record<string, unknown>>) ?? [];
  const awayLinescores = (awaySide?.linescores as Array<Record<string, unknown>>) ?? [];

  const game: Record<string, unknown> = {
    id: String(header?.id ?? comp.id ?? ''),
    date: (header?.gameNote as string) ?? (comp.date as string) ?? '',
    status: {
      state,
      detailedState: (statusType.detail as string) ?? (statusType.shortDetail as string) ?? state,
      inning: statusObj.period != null ? Number(statusObj.period) : undefined,
      inningState: undefined,
      isLive,
      isFinal,
    },
    teams: {
      away: {
        name: (awayTeam.displayName as string) ?? (awayTeam.name as string) ?? 'Away',
        abbreviation: (awayTeam.abbreviation as string) ?? '',
        score: awayScore,
        isWinner: isFinal && awayScore > homeScore,
        record: (awaySide?.record as Array<Record<string, unknown>>)?.[0]?.summary as string | undefined,
        conference: undefined,
        ranking: awaySide?.rank != null ? Number(awaySide.rank) : undefined,
      },
      home: {
        name: (homeTeam.displayName as string) ?? (homeTeam.name as string) ?? 'Home',
        abbreviation: (homeTeam.abbreviation as string) ?? '',
        score: homeScore,
        isWinner: isFinal && homeScore > awayScore,
        record: (homeSide?.record as Array<Record<string, unknown>>)?.[0]?.summary as string | undefined,
        conference: undefined,
        ranking: homeSide?.rank != null ? Number(homeSide.rank) : undefined,
      },
    },
    venue: { name: 'TBD' },
  };

  // Extract venue from gameInfo
  const gameInfo = summary.gameInfo as Record<string, unknown> | undefined;
  const venue = gameInfo?.venue as Record<string, unknown> | undefined;
  if (venue) {
    const addr = venue.address as Record<string, unknown> | undefined;
    game.venue = { name: venue.fullName ?? venue.shortName ?? 'TBD', city: addr?.city, state: addr?.state };
  }

  // Linescore from competitor linescores
  if (homeLinescores.length > 0 || awayLinescores.length > 0) {
    const count = Math.max(homeLinescores.length, awayLinescores.length);
    game.linescore = {
      innings: Array.from({ length: count }, (_, i) => ({
        away: Number(awayLinescores[i]?.value ?? 0),
        home: Number(homeLinescores[i]?.value ?? 0),
      })),
      totals: {
        away: { runs: awayScore, hits: 0, errors: 0 },
        home: { runs: homeScore, hits: 0, errors: 0 },
      },
    };
  }

  // Box score from ESPN summary format
  const espnBox = summary.boxscore as Record<string, unknown> | undefined;
  if (espnBox) {
    const players = (espnBox.players as Record<string, unknown>[]) ?? [];
    const awayBox = players.find((p) => (p.team as Record<string, unknown>)?.id === String(awayTeam.id));
    const homeBox = players.find((p) => (p.team as Record<string, unknown>)?.id === String(homeTeam.id));

    const extractBattingLines = (teamBox: Record<string, unknown> | undefined) => {
      const stats = (teamBox?.statistics as Record<string, unknown>[]) ?? [];
      const batting = stats.find((s) => (s.name as string) === 'batting' || (s.type as string) === 'batting');
      const athletes = (batting?.athletes as Record<string, unknown>[]) ?? [];
      return athletes.map((a) => {
        const athlete = a.athlete as Record<string, unknown> | undefined;
        const st = (a.stats as string[]) ?? [];
        return {
          player: { id: String(athlete?.id ?? ''), name: (athlete?.displayName as string) ?? '', position: (athlete?.position as Record<string, unknown>)?.abbreviation ?? '' },
          ab: Number(st[0] ?? 0), r: Number(st[1] ?? 0), h: Number(st[2] ?? 0), rbi: Number(st[3] ?? 0),
          bb: Number(st[4] ?? 0), so: Number(st[5] ?? 0), avg: st[6] ?? '.000',
        };
      });
    };

    const extractPitchingLines = (teamBox: Record<string, unknown> | undefined) => {
      const stats = (teamBox?.statistics as Record<string, unknown>[]) ?? [];
      const pitching = stats.find((s) => (s.name as string) === 'pitching' || (s.type as string) === 'pitching');
      const athletes = (pitching?.athletes as Record<string, unknown>[]) ?? [];
      return athletes.map((a) => {
        const athlete = a.athlete as Record<string, unknown> | undefined;
        const st = (a.stats as string[]) ?? [];
        return {
          player: { id: String(athlete?.id ?? ''), name: (athlete?.displayName as string) ?? '' },
          ip: st[0] ?? '0', h: Number(st[1] ?? 0), r: Number(st[2] ?? 0),
          er: Number(st[3] ?? 0), bb: Number(st[4] ?? 0), so: Number(st[5] ?? 0),
          era: st[6] ?? '0.00',
        };
      });
    };

    game.boxscore = {
      away: { batting: extractBattingLines(awayBox), pitching: extractPitchingLines(awayBox) },
      home: { batting: extractBattingLines(homeBox), pitching: extractPitchingLines(homeBox) },
    };
  }

  // Plays
  const drivesArr = (summary.drives as Record<string, unknown> | undefined)?.previous as Record<string, unknown>[] | undefined;
  const playsArr = (summary.plays as Record<string, unknown>[]) ?? [];
  const sourcePlays = playsArr.length > 0 ? playsArr : (drivesArr ?? []);
  if (sourcePlays.length > 0) {
    game.plays = sourcePlays.slice(0, 200).map((p, i) => ({
      id: String(p.id ?? `play-${i}`),
      inning: Number(p.period ?? 1),
      halfInning: (p.halfInning as string) ?? ((p.homeAway as string) === 'home' ? 'bottom' : 'top'),
      description: (p.text as string) ?? (p.description as string) ?? '',
      result: (p.type as Record<string, unknown>)?.text as string ?? (p.text as string) ?? '',
      isScoring: Boolean(p.scoringPlay),
      runsScored: Number(p.scoreValue ?? 0),
      scoreAfter: { away: Number((p.awayScore as number) ?? 0), home: Number((p.homeScore as number) ?? 0) },
    }));
  }

  return game;
}

// ---------------------------------------------------------------------------
// Route Handlers
// ---------------------------------------------------------------------------

export async function handleCollegeBaseballScores(
  url: URL,
  env: Env
): Promise<Response> {
  const date = url.searchParams.get('date') || undefined;
  const cacheKey = `cb:scores:${date || 'today'}`;
  const empty = { data: [], totalCount: 0 };
  const now = new Date().toISOString();

  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) {
    return cachedJson(cached, 200, HTTP_CACHE.scores, { ...dataHeaders(now, 'cache'), 'X-Cache': 'HIT' });
  }

  // Try Highlightly first if key is available
  const hlClient = getHighlightlyClient(env);
  if (hlClient) {
    try {
      const result = await hlClient.getMatches('NCAA', date);
      if (result.success && result.data) {
        await kvPut(env.KV, cacheKey, result.data, CACHE_TTL.scores);
        return cachedJson(result.data, 200, HTTP_CACHE.scores, {
          ...dataHeaders(result.timestamp, 'highlightly'), 'X-Cache': 'MISS',
        });
      }
    } catch {
      // Highlightly failed — fall through to NCAA
    }
  }

  // NCAA fallback
  try {
    const client = getCollegeClient();
    const result = await client.getMatches('NCAA', date);

    if (result.success && result.data) {
      await kvPut(env.KV, cacheKey, result.data, CACHE_TTL.scores);
    }

    return cachedJson(result.data ?? empty, result.success ? 200 : 502, HTTP_CACHE.scores, {
      ...dataHeaders(result.timestamp, 'ncaa'), 'X-Cache': 'MISS',
    });
  } catch {
    return json(empty, 502, { ...dataHeaders(now, 'error'), 'X-Cache': 'ERROR' });
  }
}

export async function handleCollegeBaseballStandings(
  url: URL,
  env: Env
): Promise<Response> {
  const conference = url.searchParams.get('conference') || 'NCAA';
  const cacheKey = `cb:standings:v2:${conference}`;
  const now = new Date().toISOString();

  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) {
    return cachedJson(cached, 200, HTTP_CACHE.standings, { ...dataHeaders(now, 'cache'), 'X-Cache': 'HIT' });
  }

  const wrap = (data: unknown[], source: string, ts: string) => ({
    success: true,
    data,
    conference,
    timestamp: ts,
    meta: { dataSource: source, lastUpdated: ts, sport: 'college-baseball' },
  });

  // Try Highlightly first
  const hlClient = getHighlightlyClient(env);
  if (hlClient) {
    try {
      const result = await hlClient.getStandings(conference);
      if (result.success && result.data) {
        const payload = wrap(Array.isArray(result.data) ? result.data : [], 'highlightly', result.timestamp);
        await kvPut(env.KV, cacheKey, payload, CACHE_TTL.standings);
        return cachedJson(payload, 200, HTTP_CACHE.standings, {
          ...dataHeaders(result.timestamp, 'highlightly'), 'X-Cache': 'MISS',
        });
      }
    } catch {
      // Fall through to NCAA
    }
  }

  const client = getCollegeClient();
  const result = await client.getStandings(conference);
  const data = Array.isArray(result.data) ? result.data : [];
  const payload = wrap(data, 'ncaa', result.timestamp);

  if (result.success) {
    await kvPut(env.KV, cacheKey, payload, CACHE_TTL.standings);
  }

  return cachedJson(payload, result.success ? 200 : 502, HTTP_CACHE.standings, {
    ...dataHeaders(result.timestamp, 'ncaa'), 'X-Cache': 'MISS',
  });
}

export async function handleCollegeBaseballRankings(env: Env): Promise<Response> {
  const cacheKey = 'cb:rankings:v2';
  const now = new Date().toISOString();

  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) {
    return cachedJson(cached, 200, HTTP_CACHE.rankings, { ...dataHeaders(now, 'cache'), 'X-Cache': 'HIT' });
  }

  // Try Highlightly first
  const hlClient = getHighlightlyClient(env);
  if (hlClient) {
    try {
      const result = await hlClient.getRankings();
      if (result.success && result.data) {
        const payload = { rankings: result.data, meta: { dataSource: 'highlightly', lastUpdated: result.timestamp, sport: 'college-baseball' } };
        await kvPut(env.KV, cacheKey, payload, CACHE_TTL.rankings);
        return cachedJson(payload, 200, HTTP_CACHE.rankings, {
          ...dataHeaders(result.timestamp, 'highlightly'), 'X-Cache': 'MISS',
        });
      }
    } catch {
      // Fall through to ESPN
    }
  }

  // ESPN college baseball rankings — returns { rankings: [{ name, ranks: [...] }] }
  try {
    const espnUrl = 'https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball/rankings';
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(espnUrl, { signal: controller.signal });
    clearTimeout(timeout);

    if (res.ok) {
      const raw = (await res.json()) as Record<string, unknown>;
      const rankings = (raw.rankings as unknown[]) || [];
      const payload = {
        rankings,
        timestamp: now,
        meta: { dataSource: 'espn', lastUpdated: now, sport: 'college-baseball' },
      };
      await kvPut(env.KV, cacheKey, payload, CACHE_TTL.rankings);
      return cachedJson(payload, 200, HTTP_CACHE.rankings, {
        ...dataHeaders(now, 'espn'), 'X-Cache': 'MISS',
      });
    }
  } catch {
    // Fall through to ncaa-api client
  }

  // Final fallback: ncaa-api client (returns raw array)
  try {
    const client = getCollegeClient();
    const result = await client.getRankings();
    const rankings = Array.isArray(result.data) ? result.data : [];
    const payload = {
      rankings,
      timestamp: result.timestamp,
      meta: { dataSource: 'ncaa', lastUpdated: result.timestamp, sport: 'college-baseball' },
    };

    if (result.success) {
      await kvPut(env.KV, cacheKey, payload, CACHE_TTL.rankings);
    }

    return cachedJson(payload, result.success ? 200 : 502, HTTP_CACHE.rankings, {
      ...dataHeaders(result.timestamp, 'ncaa'), 'X-Cache': 'MISS',
    });
  } catch {
    return json({ rankings: [], meta: { dataSource: 'error', lastUpdated: now, sport: 'college-baseball' } }, 502, { ...dataHeaders(now, 'error'), 'X-Cache': 'ERROR' });
  }
}

export async function handleCollegeBaseballTeam(
  teamId: string,
  env: Env
): Promise<Response> {
  const cacheKey = `cb:team:${teamId}`;
  const now = new Date().toISOString();

  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) {
    return cachedJson(cached, 200, HTTP_CACHE.team, { ...dataHeaders(now, 'cache'), 'X-Cache': 'HIT' });
  }

  // Highlightly first
  const hlClient = getHighlightlyClient(env);
  if (hlClient) {
    try {
      const [teamResult, playersResult] = await Promise.all([
        hlClient.getTeam(parseInt(teamId, 10)),
        hlClient.getTeamPlayers(parseInt(teamId, 10)),
      ]);

      if (teamResult.success && teamResult.data) {
        const team = transformHighlightlyTeam(
          teamResult.data,
          playersResult.success ? (playersResult.data?.data ?? []) : []
        );
        const payload = { team, meta: { dataSource: 'highlightly', lastUpdated: teamResult.timestamp, timezone: 'America/Chicago' } };
        await kvPut(env.KV, cacheKey, payload, CACHE_TTL.teams);
        return cachedJson(payload, 200, HTTP_CACHE.team, {
          ...dataHeaders(teamResult.timestamp, 'highlightly'), 'X-Cache': 'MISS',
        });
      }
    } catch {
      // Fall through to ESPN
    }
  }

  // ESPN/NCAA fallback
  try {
    const client = getCollegeClient();
    const [teamResult, playersResult] = await Promise.all([
      client.getTeam(parseInt(teamId, 10)),
      client.getTeamPlayers(parseInt(teamId, 10)),
    ]);

    if (teamResult.success && teamResult.data) {
      const team = transformEspnTeam(
        teamResult.data as Record<string, unknown>,
        playersResult.data?.data ?? []
      );
      const payload = { team, meta: { dataSource: 'espn', lastUpdated: teamResult.timestamp, timezone: 'America/Chicago' } };
      await kvPut(env.KV, cacheKey, payload, CACHE_TTL.teams);
      return cachedJson(payload, 200, HTTP_CACHE.team, {
        ...dataHeaders(teamResult.timestamp, 'espn'), 'X-Cache': 'MISS',
      });
    }

    return json({ team: null }, 502, { ...dataHeaders(now, 'error'), 'X-Cache': 'ERROR' });
  } catch {
    return json({ team: null }, 502, { ...dataHeaders(now, 'error'), 'X-Cache': 'ERROR' });
  }
}

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
        const wrapped = { ...payload, meta: { dataSource: 'highlightly', lastUpdated: playerResult.timestamp, timezone: 'America/Chicago' } };
        await kvPut(env.KV, cacheKey, wrapped, CACHE_TTL.players);
        return cachedJson(wrapped, 200, HTTP_CACHE.player, {
          ...dataHeaders(playerResult.timestamp, 'highlightly'), 'X-Cache': 'MISS',
        });
      }
    } catch {
      // Fall through to ESPN
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
      const wrapped = { ...payload, meta: { dataSource: 'espn', lastUpdated: playerResult.timestamp, timezone: 'America/Chicago' } };
      await kvPut(env.KV, cacheKey, wrapped, CACHE_TTL.players);
      return cachedJson(wrapped, 200, HTTP_CACHE.player, {
        ...dataHeaders(playerResult.timestamp, 'espn'), 'X-Cache': 'MISS',
      });
    }

    return json({ player: null, statistics: null }, 502, { ...dataHeaders(now, 'error'), 'X-Cache': 'ERROR' });
  } catch {
    return json({ player: null, statistics: null }, 502, { ...dataHeaders(now, 'error'), 'X-Cache': 'ERROR' });
  }
}

export async function handleCollegeBaseballGame(
  gameId: string,
  env: Env
): Promise<Response> {
  const cacheKey = `cb:game:${gameId}`;
  const now = new Date().toISOString();

  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) {
    return cachedJson(cached, 200, HTTP_CACHE.game, { ...dataHeaders(now, 'cache'), 'X-Cache': 'HIT' });
  }

  // Highlightly first (if API key is set)
  const hlClient = getHighlightlyClient(env);
  if (hlClient) {
    try {
      const [matchResult, boxResult] = await Promise.all([
        hlClient.getMatch(parseInt(gameId, 10)),
        hlClient.getBoxScore(parseInt(gameId, 10)),
      ]);

      if (matchResult.success && matchResult.data) {
        const game = transformHighlightlyGame(
          matchResult.data,
          boxResult.success ? (boxResult.data ?? null) : null
        );
        const payload = { game, meta: { dataSource: 'highlightly', lastUpdated: matchResult.timestamp, timezone: 'America/Chicago' } };
        await kvPut(env.KV, cacheKey, payload, CACHE_TTL.games);
        return cachedJson(payload, 200, HTTP_CACHE.game, {
          ...dataHeaders(matchResult.timestamp, 'highlightly'), 'X-Cache': 'MISS',
        });
      }
    } catch {
      // Highlightly failed — fall through to NCAA/ESPN
    }
  }

  // NCAA/ESPN fallback
  try {
    const client = getCollegeClient();
    const matchResult = await client.getMatch(parseInt(gameId, 10));

    if (matchResult.success && matchResult.data) {
      const summary = matchResult.data as Record<string, unknown>;
      const game = transformEspnGameSummary(summary);

      if (game) {
        const payload = { game, meta: { dataSource: 'espn', lastUpdated: matchResult.timestamp, timezone: 'America/Chicago' } };
        await kvPut(env.KV, cacheKey, payload, CACHE_TTL.games);
        return cachedJson(payload, 200, HTTP_CACHE.game, {
          ...dataHeaders(matchResult.timestamp, 'espn'), 'X-Cache': 'MISS',
        });
      }
    }

    return json(
      { game: null, meta: { dataSource: 'error', lastUpdated: now, timezone: 'America/Chicago' } },
      502, { ...dataHeaders(now, 'error'), 'X-Cache': 'ERROR' }
    );
  } catch {
    return json(
      { game: null, meta: { dataSource: 'error', lastUpdated: now, timezone: 'America/Chicago' } },
      502, { ...dataHeaders(now, 'error'), 'X-Cache': 'ERROR' }
    );
  }
}

export async function handleCollegeBaseballSchedule(
  url: URL,
  env: Env
): Promise<Response> {
  const date = url.searchParams.get('date') || new Date().toISOString().split('T')[0];
  const range = url.searchParams.get('range') || 'week';
  const conference = url.searchParams.get('conference') || '';
  const cacheKey = `cb:schedule:${date}:${range}`;

  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) {
    return cachedJson(cached, 200, HTTP_CACHE.schedule, { ...dataHeaders(new Date().toISOString()), 'X-Cache': 'HIT' });
  }

  const client = getCollegeClient();
  const result = await client.getSchedule(date, range);

  if (!result.success || !result.data) {
    return cachedJson(
      { success: false, data: [], message: 'Failed to fetch schedule', timestamp: result.timestamp },
      502, HTTP_CACHE.schedule, { ...dataHeaders(result.timestamp), 'X-Cache': 'MISS' }
    );
  }

  const rawEvents = (result.data.data || []) as Record<string, unknown>[];

  // Transform ESPN events into the Game shape the scores page expects
  let games = rawEvents.map((e: Record<string, unknown>) => {
    const status = e.status as Record<string, unknown> || {};
    const state = (status.state as string || '').toLowerCase();
    const homeTeam = e.homeTeam as Record<string, unknown> || {};
    const awayTeam = e.awayTeam as Record<string, unknown> || {};
    const venue = e.venue as Record<string, unknown> | undefined;

    // Map ESPN state to frontend status
    let gameStatus: string;
    if (state === 'in' || state === 'live') gameStatus = 'live';
    else if (state === 'post' || (status.type as string || '').includes('FINAL')) gameStatus = 'final';
    else if ((status.type as string || '').includes('POSTPONED')) gameStatus = 'postponed';
    else if ((status.type as string || '').includes('CANCELED')) gameStatus = 'canceled';
    else gameStatus = 'scheduled';

    // Parse time from date field
    const dateStr = (e.date as string) || '';
    let time = '';
    if (dateStr) {
      try {
        const d = new Date(dateStr);
        time = d.toLocaleTimeString('en-US', { timeZone: 'America/Chicago', hour: 'numeric', minute: '2-digit' });
      } catch { /* ignore */ }
    }

    // Extract inning for live games
    const period = status.period as number | undefined;

    return {
      id: String(e.id || ''),
      date: dateStr,
      time,
      status: gameStatus,
      inning: gameStatus === 'live' ? period : undefined,
      homeTeam: {
        id: String(homeTeam.id || ''),
        name: (homeTeam.name || '') as string,
        shortName: (homeTeam.abbreviation || '') as string,
        conference: ((homeTeam.conference || '') as string),
        score: gameStatus !== 'scheduled' ? Number(e.homeScore ?? 0) : null,
        record: (homeTeam.record as { wins: number; losses: number }) ?? { wins: 0, losses: 0 },
      },
      awayTeam: {
        id: String(awayTeam.id || ''),
        name: (awayTeam.name || '') as string,
        shortName: (awayTeam.abbreviation || '') as string,
        conference: ((awayTeam.conference || '') as string),
        score: gameStatus !== 'scheduled' ? Number(e.awayScore ?? 0) : null,
        record: (awayTeam.record as { wins: number; losses: number }) ?? { wins: 0, losses: 0 },
      },
      venue: venue ? (venue.fullName || venue.name || '') as string : '',
      situation: (status.detail as string) || '',
    };
  });

  // Filter by conference if specified
  if (conference) {
    const confLower = conference.toLowerCase();
    games = games.filter((g) =>
      g.homeTeam.conference.toLowerCase().includes(confLower) ||
      g.awayTeam.conference.toLowerCase().includes(confLower) ||
      g.homeTeam.name.toLowerCase().includes(confLower) ||
      g.awayTeam.name.toLowerCase().includes(confLower)
    );
  }

  const payload = {
    success: true,
    data: games,
    live: games.some((g) => g.status === 'live'),
    timestamp: result.timestamp,
  };

  await kvPut(env.KV, cacheKey, payload, CACHE_TTL.schedule);
  return cachedJson(payload, 200, HTTP_CACHE.schedule, {
    ...dataHeaders(result.timestamp), 'X-Cache': 'MISS',
  });
}

export async function handleCollegeBaseballTrending(env: Env): Promise<Response> {
  const cacheKey = 'cb:trending';

  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) {
    return cachedJson(cached, 200, HTTP_CACHE.trending, { ...dataHeaders(new Date().toISOString()), 'X-Cache': 'HIT' });
  }

  // Trending is computed from recent scores — fetch today's games and derive
  const client = getCollegeClient();
  const result = await client.getMatches('NCAA');

  if (!result.success || !result.data) {
    return json({ trendingPlayers: [], topGames: [] }, 502, dataHeaders(result.timestamp));
  }

  const games = (result.data.data || []) as HighlightlyMatch[];

  // Top games: highest combined score, closest margin
  const finishedGames = games
    .filter((g: HighlightlyMatch) => g.status?.type === 'finished')
    .sort((a: HighlightlyMatch, b: HighlightlyMatch) => {
      const marginA = Math.abs(a.homeScore - a.awayScore);
      const marginB = Math.abs(b.homeScore - b.awayScore);
      return marginA - marginB;
    });

  const topGames = finishedGames.slice(0, 5).map((g: HighlightlyMatch) => ({
    id: g.id,
    homeTeam: g.homeTeam?.name,
    awayTeam: g.awayTeam?.name,
    homeScore: g.homeScore,
    awayScore: g.awayScore,
    margin: Math.abs(g.homeScore - g.awayScore),
  }));

  const payload = { trendingPlayers: [], topGames };
  await kvPut(env.KV, cacheKey, payload, CACHE_TTL.trending);

  return cachedJson(payload, 200, HTTP_CACHE.trending, { ...dataHeaders(result.timestamp), 'X-Cache': 'MISS' });
}

// ---------------------------------------------------------------------------
// College Baseball Daily Bundle handler (pregame + recap from verified data)
// ---------------------------------------------------------------------------

export async function handleCollegeBaseballDaily(url: URL, env: Env): Promise<Response> {
  const edition = url.searchParams.get('edition') ?? 'latest';
  const date = url.searchParams.get('date');

  // Resolve KV key: either specific edition+date, or latest
  let kvKey: string;
  if (edition === 'latest' || (!date && edition === 'latest')) {
    kvKey = 'cb:daily:latest';
  } else {
    const resolvedDate = date ?? new Date().toLocaleDateString('en-CA', { timeZone: 'America/Chicago' });
    kvKey = `cb:daily:${edition}:${resolvedDate}`;
  }

  const cached = await kvGet<unknown>(env.KV, kvKey);
  if (cached) {
    return cachedJson(cached, 200, 300, {
      ...dataHeaders(new Date().toISOString(), 'bsi-college-baseball-daily'),
      'X-Cache': 'HIT',
    });
  }

  // Fallback to latest if specific key not found
  if (kvKey !== 'cb:daily:latest') {
    const latest = await kvGet<unknown>(env.KV, 'cb:daily:latest');
    if (latest) {
      return cachedJson(latest, 200, 300, {
        ...dataHeaders(new Date().toISOString(), 'bsi-college-baseball-daily'),
        'X-Cache': 'FALLBACK',
      });
    }
  }

  return json({
    error: 'Daily digest not yet generated. The pipeline runs at 5 AM and 11 PM CT.',
    meta: { source: 'bsi-college-baseball-daily', fetched_at: new Date().toISOString(), timezone: 'America/Chicago' },
  }, 404);
}

// ---------------------------------------------------------------------------
// College Baseball News handler (ESPN college-baseball/news)
// ---------------------------------------------------------------------------

export async function handleCollegeBaseballNews(env: Env): Promise<Response> {
  const cacheKey = 'cb:news';

  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) {
    return cachedJson(cached, 200, HTTP_CACHE.news, { ...dataHeaders(new Date().toISOString(), 'cache'), 'X-Cache': 'HIT' });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(
      'https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball/news',
      { signal: controller.signal }
    );
    clearTimeout(timeout);

    if (!res.ok) {
      return json({ articles: [], meta: { source: 'espn', fetched_at: new Date().toISOString(), timezone: 'America/Chicago' } }, 502);
    }

    const raw = (await res.json()) as Record<string, unknown>;
    const rawArticles = (raw?.articles || []) as Record<string, unknown>[];

    const articles = rawArticles.map((a: Record<string, unknown>, i: number) => {
      const links = a.links as Record<string, unknown> | undefined;
      const web = links?.web as Record<string, unknown> | undefined;
      const cats = (a.categories || []) as Record<string, unknown>[];
      const primaryCat = cats[0];
      const catType = (primaryCat?.type as string) || '';

      // Map ESPN category types to frontend categories
      let category: string = 'general';
      if (catType === 'athlete' || catType === 'player') category = 'recruiting';
      else if (catType === 'team') category = 'game';
      else if (catType === 'topic') {
        const desc = ((primaryCat?.description as string) || '').toLowerCase();
        if (desc.includes('rank')) category = 'rankings';
        else if (desc.includes('transfer') || desc.includes('portal')) category = 'transfer';
        else if (desc.includes('recruit')) category = 'recruiting';
        else category = 'analysis';
      }

      // Extract team/conference from categories if available
      const teamCat = cats.find((c) => c.type === 'team');
      const team = (teamCat?.description as string) || undefined;

      return {
        id: String(a.dataSourceIdentifier || `espn-cbb-${i}`),
        title: (a.headline || a.title || '') as string,
        summary: (a.description || '') as string,
        source: 'ESPN',
        url: (web?.href || a.link || '') as string,
        publishedAt: (a.published || '') as string,
        category,
        team,
      };
    });

    const payload = {
      articles,
      meta: { source: 'espn', fetched_at: new Date().toISOString(), timezone: 'America/Chicago' },
    };

    await kvPut(env.KV, cacheKey, payload, 300); // 5 min cache
    return cachedJson(payload, 200, HTTP_CACHE.news, { ...dataHeaders(new Date().toISOString(), 'espn'), 'X-Cache': 'MISS' });
  } catch {
    return json({ articles: [], meta: { source: 'espn', fetched_at: new Date().toISOString(), timezone: 'America/Chicago' } }, 502);
  }
}

// ---------------------------------------------------------------------------
// College Baseball Players list handler
// ---------------------------------------------------------------------------

export async function handleCollegeBaseballPlayersList(url: URL, env: Env): Promise<Response> {
  const team = url.searchParams.get('team') || '';
  const search = url.searchParams.get('search') || '';
  const position = url.searchParams.get('position') || '';
  const classYear = url.searchParams.get('class') || '';
  const draftOnly = url.searchParams.get('draft') === 'true';
  const cacheKey = `cb:players:list:${team || 'all'}`;

  // Try cache for the base team roster (filter client-side params in memory)
  let roster: Record<string, unknown>[] | null = null;

  const cached = await kvGet<Record<string, unknown>[]>(env.KV, cacheKey);
  if (cached) {
    roster = cached;
  } else {
    // Fetch roster from ESPN via NCAA client
    // If a specific team is requested, fetch that team's roster
    // Otherwise, fetch a set of notable programs for the browsing experience
    const client = getCollegeClient();

    if (team) {
      // Search for team ID by name — use ESPN teams endpoint
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
            const teamId = parseInt(tObj.id as string, 10);
            const teamName = (tObj.displayName || tObj.name || '') as string;
            const result = await client.getTeamPlayers(teamId);
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
      // Default: fetch top programs' rosters for a browsable list
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
          // Attach team context since ESPN roster doesn't embed it per-athlete
          for (const p of players) {
            p._teamName = topTeams[i].name;
            p._teamConf = topTeams[i].conf;
          }
          roster.push(...players);
        }
      }
    }

    // Cache the roster for 1 hour
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

  if (classYear) {
    filtered = filtered.filter((p) => {
      const exp = ((p.experience as Record<string, unknown>)?.abbreviation as string || '').toLowerCase();
      return exp.startsWith(classYear.toLowerCase());
    });
  }

  // Transform to frontend Player shape
  const players = filtered.map((p) => {
    const pos = p.position as Record<string, unknown> | undefined;
    const exp = p.experience as Record<string, unknown> | undefined;
    const team_ = p.team as Record<string, unknown> | undefined;
    const birthPlace = p.birthPlace as Record<string, unknown> | undefined;

    // ESPN returns bats/throws as objects {type, abbreviation, displayValue} or strings
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
    meta: { source: 'espn', fetched_at: new Date().toISOString(), timezone: 'America/Chicago' },
  };

  return cachedJson(payload, 200, HTTP_CACHE.player, { ...dataHeaders(new Date().toISOString(), 'espn'), 'X-Cache': roster === cached ? 'HIT' : 'MISS' });
}

// --- College Baseball Transfer Portal ---

export async function handleCollegeBaseballTransferPortal(env: Env): Promise<Response> {
  const raw = await env.KV.get('portal:college-baseball:entries', 'text');
  if (raw) {
    try {
      const data = JSON.parse(raw) as Record<string, unknown>;
      const entries = (data.entries ?? []) as unknown[];
      return cachedJson({
        entries,
        totalEntries: entries.length,
        lastUpdated: data.lastUpdated ?? null,
        meta: { dataSource: 'portal-sync', lastUpdated: (data.lastUpdated as string) ?? new Date().toISOString(), timezone: 'America/Chicago' },
      }, 200, HTTP_CACHE.trending);
    } catch {
      // Corrupt KV entry — fall through
    }
  }
  return json({
    entries: [], totalEntries: 0, lastUpdated: null,
    meta: { dataSource: 'none', lastUpdated: new Date().toISOString(), timezone: 'America/Chicago' },
    message: 'No portal data available yet',
  }, 200);
}
