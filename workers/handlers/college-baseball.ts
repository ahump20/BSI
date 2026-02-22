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
import { teamMetadata } from '../../lib/data/team-metadata';
import { getLeaders, getScoreboard, getGameSummary } from '../../lib/api-clients/espn-api';

/**
 * ESPN doesn't include conference in scoreboard responses.
 * Build a lowercase display name → conference lookup from teamMetadata.
 */
const conferenceByName: Record<string, string> = {};
for (const meta of Object.values(teamMetadata)) {
  conferenceByName[meta.name.toLowerCase()] = meta.conference;
  conferenceByName[meta.shortName.toLowerCase()] = meta.conference;
}
function lookupConference(displayName: string): string {
  if (!displayName) return '';
  const lower = displayName.toLowerCase();
  return conferenceByName[lower] || conferenceByName[lower.replace(/ (university|college)$/i, '')] || '';
}

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
    } catch (err) {
      console.error('[highlightly] scores fallback:', err instanceof Error ? err.message : err);
    }
  }

  // ESPN college baseball scoreboard fallback
  try {
    const espnDate = date ? date.replace(/-/g, '') : undefined;
    const espnUrl = `https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball/scoreboard${espnDate ? `?dates=${espnDate}` : ''}`;
    const espnRes = await fetch(espnUrl, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(8000),
    });
    if (espnRes.ok) {
      const espnRaw = await espnRes.json() as { events?: unknown[] };
      if (espnRaw.events && espnRaw.events.length > 0) {
        const espnData = { data: espnRaw.events, totalCount: espnRaw.events.length };
        await kvPut(env.KV, cacheKey, espnData, CACHE_TTL.scores);
        return cachedJson(espnData, 200, HTTP_CACHE.scores, {
          ...dataHeaders(now, 'espn'), 'X-Cache': 'MISS',
        });
      }
    }
  } catch (err) {
    console.error('[espn] college baseball scores fallback:', err instanceof Error ? err.message : err);
  }

  // NCAA client fallback
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
    } catch (err) {
      console.error('[highlightly] standings fallback:', err instanceof Error ? err.message : err);
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
  const prevKey = 'cb:rankings:prev';
  const now = new Date().toISOString();

  // Rotate current → previous before fetching new data
  async function rotatePrevious() {
    try {
      const current = await kvGet<unknown>(env.KV, cacheKey);
      if (current) {
        await kvPut(env.KV, prevKey, current, 604800); // 7 days
      }
    } catch { /* non-critical */ }
  }

  const cached = await kvGet<Record<string, unknown>>(env.KV, cacheKey);
  if (cached) {
    const prev = await kvGet<unknown>(env.KV, prevKey);
    return cachedJson({ ...cached, previousRankings: prev || null }, 200, HTTP_CACHE.rankings, { ...dataHeaders(now, 'cache'), 'X-Cache': 'HIT' });
  }

  // Try Highlightly first
  const hlClient = getHighlightlyClient(env);
  if (hlClient) {
    try {
      const result = await hlClient.getRankings();
      if (result.success && result.data) {
        await rotatePrevious();
        const payload = { rankings: result.data, meta: { dataSource: 'highlightly', lastUpdated: result.timestamp, sport: 'college-baseball' } };
        await kvPut(env.KV, cacheKey, payload, CACHE_TTL.rankings);
        return cachedJson({ ...payload, previousRankings: null }, 200, HTTP_CACHE.rankings, {
          ...dataHeaders(result.timestamp, 'highlightly'), 'X-Cache': 'MISS',
        });
      }
    } catch (err) {
      console.error('[highlightly] rankings fallback:', err instanceof Error ? err.message : err);
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
      await rotatePrevious();
      const payload = {
        rankings,
        timestamp: now,
        meta: { dataSource: 'espn', lastUpdated: now, sport: 'college-baseball' },
      };
      await kvPut(env.KV, cacheKey, payload, CACHE_TTL.rankings);
      return cachedJson({ ...payload, previousRankings: null }, 200, HTTP_CACHE.rankings, {
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
    await rotatePrevious();
    const payload = {
      rankings,
      timestamp: result.timestamp,
      meta: { dataSource: 'ncaa', lastUpdated: result.timestamp, sport: 'college-baseball' },
    };

    if (result.success) {
      await kvPut(env.KV, cacheKey, payload, CACHE_TTL.rankings);
    }

    return cachedJson({ ...payload, previousRankings: null }, result.success ? 200 : 502, HTTP_CACHE.rankings, {
      ...dataHeaders(result.timestamp, 'ncaa'), 'X-Cache': 'MISS',
    });
  } catch {
    return json({ rankings: [], previousRankings: null, meta: { dataSource: 'error', lastUpdated: now, sport: 'college-baseball' } }, 502, { ...dataHeaders(now, 'error'), 'X-Cache': 'ERROR' });
  }
}

/**
 * Enrich a team payload with D1 accumulated stats.
 * - Merges per-player stats onto the roster
 * - Adds team-level aggregate stats as `teamStats`
 */
async function enrichTeamWithD1Stats(
  payload: Record<string, unknown>,
  espnTeamId: string,
  env: Env,
): Promise<void> {
  try {
    const { results: playerRows } = await env.DB.prepare(
      `SELECT espn_id, name, position, headshot,
              games_bat, at_bats, runs, hits, home_runs, rbis,
              walks_bat, strikeouts_bat, stolen_bases,
              games_pitch, innings_pitched_thirds, earned_runs,
              strikeouts_pitch, walks_pitch, hits_allowed
       FROM player_season_stats
       WHERE sport = 'college-baseball' AND season = 2026 AND team_id = ?`
    ).bind(espnTeamId).all<D1PlayerStats>();

    if (!playerRows || playerRows.length === 0) return;

    // Build lookup by ESPN ID
    const statsMap = new Map<string, D1PlayerStats>();
    for (const r of playerRows) {
      statsMap.set(r.espn_id, r);
    }

    // Enrich roster players
    const team = payload.team as Record<string, unknown> | undefined;
    const roster = (team?.roster ?? []) as Record<string, unknown>[];
    for (const player of roster) {
      const pid = String(player.id || '');
      const d1 = statsMap.get(pid);
      if (!d1) continue;

      const avg = d1.at_bats > 0 ? Math.round((d1.hits / d1.at_bats) * 1000) / 1000 : 0;
      const ip = d1.innings_pitched_thirds / 3;
      const era = ip > 0 ? Math.round((d1.earned_runs * 9 / ip) * 100) / 100 : 0;

      if (d1.at_bats > 0 || d1.games_bat > 0) {
        player.stats = { avg, hr: d1.home_runs, rbi: d1.rbis };
      } else if (d1.innings_pitched_thirds > 0 || d1.games_pitch > 0) {
        player.stats = { era, wins: 0, so: d1.strikeouts_pitch };
      }

      if (!player.headshot && d1.headshot) {
        (player as Record<string, unknown>).headshot = d1.headshot;
      }
    }

    // Compute team aggregate stats
    let teamAB = 0, teamH = 0, teamHR = 0, teamRBI = 0, teamR = 0, teamK = 0;
    let teamIP3 = 0, teamER = 0, teamPitchK = 0, teamPitchBB = 0, teamHA = 0;

    for (const r of playerRows) {
      teamAB += r.at_bats; teamH += r.hits; teamHR += r.home_runs;
      teamRBI += r.rbis; teamR += r.runs; teamK += r.strikeouts_bat;
      teamIP3 += r.innings_pitched_thirds; teamER += r.earned_runs;
      teamPitchK += r.strikeouts_pitch; teamPitchBB += r.walks_pitch;
      teamHA += r.hits_allowed;
    }

    const teamAvg = teamAB > 0 ? Math.round((teamH / teamAB) * 1000) / 1000 : 0;
    const teamIP = teamIP3 / 3;
    const teamERA = teamIP > 0 ? Math.round((teamER * 9 / teamIP) * 100) / 100 : 0;
    const teamWHIP = teamIP > 0 ? Math.round(((teamHA + teamPitchBB) / teamIP) * 100) / 100 : 0;

    payload.teamStats = {
      batting: {
        atBats: teamAB, hits: teamH, homeRuns: teamHR, rbi: teamRBI,
        runs: teamR, strikeouts: teamK, battingAverage: teamAvg,
        players: playerRows.filter((r) => r.at_bats > 0).length,
      },
      pitching: {
        inningsPitched: Math.round(teamIP * 10) / 10, earnedRuns: teamER,
        strikeouts: teamPitchK, walks: teamPitchBB, hitsAllowed: teamHA,
        era: teamERA, whip: teamWHIP,
        pitchers: playerRows.filter((r) => r.innings_pitched_thirds > 0).length,
      },
    };
  } catch (err) {
    console.error('[d1] team stats enrichment failed:', err instanceof Error ? err.message : err);
  }
}

export async function handleCollegeBaseballTeam(
  teamId: string,
  env: Env
): Promise<Response> {
  // Resolve slug → ESPN numeric ID via team metadata
  const slugMeta = teamMetadata[teamId];
  const espnId = slugMeta?.espnId ?? teamId;
  const numericId = parseInt(espnId, 10);

  if (isNaN(numericId)) {
    return json({ team: null, error: 'Unknown team' }, 404);
  }

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
        hlClient.getTeam(numericId),
        hlClient.getTeamPlayers(numericId),
      ]);

      if (teamResult.success && teamResult.data) {
        const team = transformHighlightlyTeam(
          teamResult.data,
          playersResult.success ? (playersResult.data?.data ?? []) : []
        );
        if (team.name) {
          const payload: Record<string, unknown> = { team, meta: { dataSource: 'highlightly', lastUpdated: teamResult.timestamp, timezone: 'America/Chicago' } };
          await enrichTeamWithD1Stats(payload, String(numericId), env);
          await kvPut(env.KV, cacheKey, payload, CACHE_TTL.teams);
          return cachedJson(payload, 200, HTTP_CACHE.team, {
            ...dataHeaders(teamResult.timestamp, 'highlightly'), 'X-Cache': 'MISS',
          });
        }
      }
    } catch (err) {
      console.error('[highlightly] team fallback:', err instanceof Error ? err.message : err);
    }
  }

  // ESPN/NCAA fallback
  try {
    const client = getCollegeClient();
    const [teamResult, playersResult] = await Promise.all([
      client.getTeam(numericId),
      client.getTeamPlayers(numericId),
    ]);

    if (teamResult.success && teamResult.data) {
      const team = transformEspnTeam(
        teamResult.data as Record<string, unknown>,
        playersResult.data?.data ?? []
      );
      const payload: Record<string, unknown> = { team, meta: { dataSource: 'espn', lastUpdated: teamResult.timestamp, timezone: 'America/Chicago' } };
      await enrichTeamWithD1Stats(payload, String(numericId), env);
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

// ---------------------------------------------------------------------------
// Team Schedule Transform — ESPN events → clean schedule shape
// ---------------------------------------------------------------------------

function transformTeamSchedule(events: Record<string, unknown>[], teamShortName: string) {
  return events.map((e) => {
    const competitions = (e.competitions as Record<string, unknown>[]) ?? [];
    const comp = competitions[0] ?? {};
    const competitors = (comp.competitors as Record<string, unknown>[]) ?? [];
    const date = (e.date as string) ?? '';
    const statusObj = (comp.status ?? e.status) as Record<string, unknown> | undefined;
    const statusType = (statusObj?.type as Record<string, unknown>) ?? {};
    const state = (statusType.state as string) ?? 'pre';

    const home = competitors.find((c) => c.homeAway === 'home') as Record<string, unknown> | undefined;
    const away = competitors.find((c) => c.homeAway === 'away') as Record<string, unknown> | undefined;
    const homeTeam = (home?.team as Record<string, unknown>) ?? {};
    const awayTeam = (away?.team as Record<string, unknown>) ?? {};
    const rawHomeScore = home?.score as Record<string, unknown> | number | string | undefined;
    const rawAwayScore = away?.score as Record<string, unknown> | number | string | undefined;
    const homeScore = typeof rawHomeScore === 'object' && rawHomeScore !== null
      ? Number((rawHomeScore as Record<string, unknown>).value ?? (rawHomeScore as Record<string, unknown>).displayValue ?? 0)
      : Number(rawHomeScore ?? 0);
    const awayScore = typeof rawAwayScore === 'object' && rawAwayScore !== null
      ? Number((rawAwayScore as Record<string, unknown>).value ?? (rawAwayScore as Record<string, unknown>).displayValue ?? 0)
      : Number(rawAwayScore ?? 0);
    const isFinal = state === 'post';
    const shortLower = teamShortName.toLowerCase();
    const isHome = (homeTeam.abbreviation as string)?.toLowerCase() === shortLower
      || (homeTeam.displayName as string)?.toLowerCase().includes(shortLower);

    const opponent = isHome ? awayTeam : homeTeam;
    const teamScore = isHome ? homeScore : awayScore;
    const oppScore = isHome ? awayScore : homeScore;

    return {
      id: String(e.id ?? ''),
      date,
      opponent: {
        name: ((opponent.displayName ?? opponent.name ?? '') as string),
        abbreviation: ((opponent.abbreviation ?? '') as string),
      },
      isHome,
      status: state,
      detail: ((statusType.shortDetail ?? statusType.detail ?? '') as string),
      score: isFinal || state === 'in' ? { team: teamScore, opponent: oppScore } : null,
      result: isFinal ? (teamScore > oppScore ? 'W' : teamScore < oppScore ? 'L' : 'T') : null,
    };
  });
}

// ---------------------------------------------------------------------------
// Team Schedule handler
// ---------------------------------------------------------------------------

export async function handleCollegeBaseballTeamSchedule(
  teamId: string,
  env: Env
): Promise<Response> {
  const scheduleMeta = teamMetadata[teamId];
  const espnId = scheduleMeta?.espnId ?? teamId;
  const numericId = parseInt(espnId, 10);
  if (isNaN(numericId)) return json({ schedule: null, error: 'Unknown team' }, 404);

  const cacheKey = `cb:team-schedule:${teamId}`;
  const now = new Date().toISOString();

  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) {
    return cachedJson(cached, 200, HTTP_CACHE.schedule, { ...dataHeaders(now, 'cache'), 'X-Cache': 'HIT' });
  }

  try {
    const client = getCollegeClient();
    const result = await client.getTeamSchedule(numericId);
    if (result.success && result.data) {
      const raw = result.data as Record<string, unknown>;
      const events = (raw.events ?? []) as Record<string, unknown>[];
      const schedule = transformTeamSchedule(events, scheduleMeta?.shortName ?? '');
      const payload = { schedule, meta: { source: 'espn', fetched_at: now, timezone: 'America/Chicago' } };
      await kvPut(env.KV, cacheKey, payload, CACHE_TTL.schedule);
      return cachedJson(payload, 200, HTTP_CACHE.schedule, { ...dataHeaders(now, 'espn'), 'X-Cache': 'MISS' });
    }
  } catch (err) {
    console.error('[espn] team schedule:', err instanceof Error ? err.message : err);
  }

  return json({ schedule: [], meta: { source: 'error', fetched_at: now, timezone: 'America/Chicago' } }, 502);
}

// ---------------------------------------------------------------------------
// D1 Stats Enrichment — query accumulated season stats for a player
// ---------------------------------------------------------------------------

interface D1PlayerStats {
  espn_id: string;
  name: string;
  team: string;
  team_id: string;
  position: string;
  headshot: string;
  games_bat: number;
  at_bats: number;
  runs: number;
  hits: number;
  rbis: number;
  home_runs: number;
  walks_bat: number;
  strikeouts_bat: number;
  stolen_bases: number;
  games_pitch: number;
  innings_pitched_thirds: number;
  hits_allowed: number;
  runs_allowed: number;
  earned_runs: number;
  walks_pitch: number;
  strikeouts_pitch: number;
  home_runs_allowed: number;
}

/**
 * Query D1 for a player's accumulated season stats and format them
 * to match the statistics shape the PlayerDetailClient expects.
 */
async function getD1PlayerStats(
  espnId: string,
  env: Env,
): Promise<Record<string, unknown> | null> {
  try {
    const row = await env.DB.prepare(
      `SELECT * FROM player_season_stats
       WHERE espn_id = ? AND sport = 'college-baseball' AND season = 2026`
    ).bind(espnId).first<D1PlayerStats>();

    if (!row) return null;

    const stats: Record<string, unknown> = {};

    if (row.at_bats > 0 || row.games_bat > 0) {
      const avg = row.at_bats > 0 ? row.hits / row.at_bats : 0;
      const obp = (row.at_bats + row.walks_bat) > 0
        ? (row.hits + row.walks_bat) / (row.at_bats + row.walks_bat)
        : 0;
      stats.batting = {
        games: row.games_bat,
        atBats: row.at_bats,
        runs: row.runs,
        hits: row.hits,
        doubles: 0,
        triples: 0,
        homeRuns: row.home_runs,
        rbi: row.rbis,
        walks: row.walks_bat,
        strikeouts: row.strikeouts_bat,
        stolenBases: row.stolen_bases,
        battingAverage: Math.round(avg * 1000) / 1000,
        onBasePercentage: Math.round(obp * 1000) / 1000,
        sluggingPercentage: 0,
        ops: 0,
      };
    }

    if (row.innings_pitched_thirds > 0 || row.games_pitch > 0) {
      const ip = row.innings_pitched_thirds / 3;
      const era = ip > 0 ? (row.earned_runs * 9) / ip : 0;
      const whip = ip > 0 ? (row.hits_allowed + row.walks_pitch) / ip : 0;
      stats.pitching = {
        games: row.games_pitch,
        gamesStarted: 0,
        wins: 0,
        losses: 0,
        saves: 0,
        inningsPitched: Math.round(ip * 10) / 10,
        hits: row.hits_allowed,
        earnedRuns: row.earned_runs,
        walks: row.walks_pitch,
        strikeouts: row.strikeouts_pitch,
        era: Math.round(era * 100) / 100,
        whip: Math.round(whip * 100) / 100,
      };
    }

    return Object.keys(stats).length > 0 ? stats : null;
  } catch (err) {
    console.error('[d1] player stats lookup failed:', err instanceof Error ? err.message : err);
    return null;
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
        // Enrich with D1 stats if Highlightly returned no statistics
        if (!payload.statistics) {
          const d1Stats = await getD1PlayerStats(playerId, env);
          if (d1Stats) payload.statistics = d1Stats;
        }
        const source = payload.statistics && !(statsResult.success && statsResult.data) ? 'highlightly+d1' : 'highlightly';
        const wrapped = { ...payload, meta: { dataSource: source, lastUpdated: playerResult.timestamp, timezone: 'America/Chicago' } };
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
      const wrapped = { ...payload, meta: { dataSource: source, lastUpdated: playerResult.timestamp, timezone: 'America/Chicago' } };
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
       WHERE espn_id = ? AND sport = 'college-baseball' AND season = 2026`
    ).bind(playerId).first<D1PlayerStats>();

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
        meta: { dataSource: 'd1', lastUpdated: now, timezone: 'America/Chicago' },
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
    } catch (err) {
      console.error('[highlightly] game fallback:', err instanceof Error ? err.message : err);
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
        conference: (homeTeam.conference as string) || lookupConference((homeTeam.name || '') as string),
        score: gameStatus !== 'scheduled' ? (e.homeScore ?? null) : null,
        record: (homeTeam.record as { wins: number; losses: number }) ?? { wins: 0, losses: 0 },
      },
      awayTeam: {
        id: String(awayTeam.id || ''),
        name: (awayTeam.name || '') as string,
        shortName: (awayTeam.abbreviation || '') as string,
        conference: (awayTeam.conference as string) || lookupConference((awayTeam.name || '') as string),
        score: gameStatus !== 'scheduled' ? (e.awayScore ?? null) : null,
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

/**
 * Query D1 accumulated stats for the players list endpoint.
 * Returns players in the frontend Player shape with inline stats.
 */
async function queryPlayersFromD1(
  env: Env,
  opts: { search: string; team: string; position: string; sortBy: string; limit: number; offset: number },
): Promise<Record<string, unknown>[] | null> {
  const conditions = [`sport = 'college-baseball'`, `season = 2026`];
  const binds: (string | number)[] = [];

  if (opts.search) {
    conditions.push(`(name LIKE ? OR team LIKE ?)`);
    const q = `%${opts.search}%`;
    binds.push(q, q);
  }

  if (opts.team) {
    conditions.push(`team LIKE ?`);
    binds.push(`%${opts.team}%`);
  }

  if (opts.position) {
    if (opts.position === 'IF') {
      conditions.push(`position IN ('1B','2B','3B','SS','IF')`);
    } else if (opts.position === 'OF') {
      conditions.push(`position IN ('LF','CF','RF','OF')`);
    } else if (opts.position === 'P') {
      conditions.push(`(position IN ('P','SP','RP','LHP','RHP') OR innings_pitched_thirds > 0)`);
    } else {
      conditions.push(`position = ?`);
      binds.push(opts.position.toUpperCase());
    }
  }

  // Order by descending impact — different for pitchers vs batters
  let orderClause: string;
  switch (opts.sortBy) {
    case 'avg':
      conditions.push(`at_bats >= 10`);
      orderClause = `CAST(hits AS REAL) / at_bats DESC`;
      break;
    case 'homeRuns':
      orderClause = `home_runs DESC`;
      break;
    case 'rbi':
      orderClause = `rbis DESC`;
      break;
    case 'era':
      conditions.push(`innings_pitched_thirds >= 9`);
      orderClause = `CAST(earned_runs AS REAL) * 27 / innings_pitched_thirds ASC`;
      break;
    case 'strikeouts':
      orderClause = `strikeouts_pitch DESC`;
      break;
    default:
      // Default sort: composite batting value
      orderClause = `(hits + home_runs * 3 + rbis) DESC`;
      break;
  }

  const where = conditions.join(' AND ');
  const sql = `SELECT espn_id, name, team, team_id, position, headshot,
    games_bat, at_bats, runs, hits, rbis, home_runs, walks_bat, strikeouts_bat, stolen_bases,
    games_pitch, innings_pitched_thirds, earned_runs, walks_pitch, strikeouts_pitch, hits_allowed
    FROM player_season_stats
    WHERE ${where}
    ORDER BY ${orderClause}
    LIMIT ? OFFSET ?`;

  binds.push(opts.limit, opts.offset);

  const { results } = await env.DB.prepare(sql).bind(...binds).all<D1PlayerStats>();

  if (!results || results.length === 0) return null;

  return results.map((r) => {
    const avg = r.at_bats > 0 ? Math.round((r.hits / r.at_bats) * 1000) / 1000 : 0;
    const obp = (r.at_bats + r.walks_bat) > 0
      ? Math.round(((r.hits + r.walks_bat) / (r.at_bats + r.walks_bat)) * 1000) / 1000
      : 0;
    const ip = r.innings_pitched_thirds / 3;
    const era = ip > 0 ? Math.round((r.earned_runs * 9 / ip) * 100) / 100 : 0;
    const whip = ip > 0 ? Math.round(((r.hits_allowed + r.walks_pitch) / ip) * 100) / 100 : 0;

    const player: Record<string, unknown> = {
      id: r.espn_id,
      name: r.name,
      team: r.team,
      jersey: '',
      position: r.position,
      classYear: '',
      conference: '',
      headshot: r.headshot || '',
      bio: { height: '', weight: 0, bats: '', throws: '', hometown: '' },
    };

    if (r.at_bats > 0 || r.games_bat > 0) {
      player.battingStats = {
        avg, homeRuns: r.home_runs, rbi: r.rbis, ops: 0, games: r.games_bat,
        atBats: r.at_bats, runs: r.runs, hits: r.hits, doubles: 0, triples: 0,
        walks: r.walks_bat, strikeouts: r.strikeouts_bat, stolenBases: r.stolen_bases,
        obp, slg: 0,
      };
    }

    if (r.innings_pitched_thirds > 0 || r.games_pitch > 0) {
      player.pitchingStats = {
        era, wins: 0, losses: 0, strikeouts: r.strikeouts_pitch, whip,
        games: r.games_pitch, gamesStarted: 0, completeGames: 0, shutouts: 0, saves: 0,
        inningsPitched: Math.round(ip * 10) / 10, hits: r.hits_allowed,
        runs: r.runs_allowed ?? 0, earnedRuns: r.earned_runs, walks: r.walks_pitch,
      };
    }

    return player;
  });
}

// --- College Baseball Enhanced News (ESPN + Highlightly) ---

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  scores: ['score', 'scored', 'final', 'walk-off', 'walkoff', 'shutout', 'no-hitter', 'run-rule', 'sweep', 'swept', 'wins', 'defeats', 'beats', 'rout', 'rally', 'comeback'],
  transfers: ['transfer', 'portal', 'commit', 'committed', 'decommit', 'enters portal', 'flip', 'destination', 'leaving'],
  recruiting: ['recruit', 'signee', 'prospect', 'class of', 'signing day', 'nli', 'verbal', 'commitment', 'five-star', 'four-star'],
  editorial: ['preview', 'column', 'opinion', 'take', 'breakdown', 'deep dive', 'outlook', 'hot take', 'editorial'],
  analysis: ['analytics', 'stat', 'metric', 'sabermetric', 'rpi', 'sos', 'projection', 'model', 'era', 'whip', 'slugging', 'war'],
  rankings: ['rank', 'poll', 'top 25', 'ranked', 'power rankings', 'coaches poll', 'usa today', 'preseason', 'postseason'],
};

function categorizeArticle(title: string, description: string): string {
  const text = `${title} ${description}`.toLowerCase();
  let bestCategory = 'general';
  let bestCount = 0;
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    const count = keywords.filter((kw) => text.includes(kw)).length;
    if (count > bestCount) {
      bestCount = count;
      bestCategory = category;
    }
  }
  return bestCategory;
}

function titleSimilarity(a: string, b: string): number {
  const wordsA = new Set(a.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean));
  const wordsB = new Set(b.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean));
  if (wordsA.size === 0 || wordsB.size === 0) return 0;
  let overlap = 0;
  for (const w of wordsA) { if (wordsB.has(w)) overlap++; }
  return overlap / Math.max(wordsA.size, wordsB.size);
}

interface EnhancedArticle {
  id: string;
  title: string;
  description: string;
  source: 'espn' | 'highlightly' | 'bsi';
  url: string;
  imageUrl?: string;
  publishedAt: string;
  category: string;
  team?: string;
}

export async function handleCollegeBaseballNewsEnhanced(env: Env): Promise<Response> {
  const now = new Date().toISOString();
  const cacheKey = 'cb:news:enhanced';
  const cached = await kvGet<string>(env.KV, cacheKey);
  if (cached) {
    try {
      return cachedJson(JSON.parse(cached), 200, HTTP_CACHE.news);
    } catch { /* corrupted cache — rebuild */ }
  }

  async function fetchEspnNews(): Promise<EnhancedArticle[]> {
    try {
      const resp = await fetch('https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball/news?limit=30');
      if (!resp.ok) return [];
      const data = await resp.json() as { articles?: Array<{ headline?: string; description?: string; links?: { web?: { href?: string } }; images?: Array<{ url?: string }>; published?: string }> };
      return (data.articles || []).map((a, i) => ({
        id: `espn-${i}-${Date.now()}`,
        title: a.headline || '',
        description: a.description || '',
        source: 'espn' as const,
        url: a.links?.web?.href || '#',
        imageUrl: a.images?.[0]?.url,
        publishedAt: a.published || now,
        category: categorizeArticle(a.headline || '', a.description || ''),
      }));
    } catch {
      return [];
    }
  }

  async function fetchHighlightlyNews(): Promise<EnhancedArticle[]> {
    const key = env.RAPIDAPI_KEY;
    if (!key) return [];
    try {
      const resp = await fetch('https://highlightly.p.rapidapi.com/baseball/matches?league=NCAA&status=complete&limit=20', {
        headers: { 'x-rapidapi-key': key, 'x-rapidapi-host': 'highlightly.p.rapidapi.com' },
      });
      if (!resp.ok) return [];
      const data = await resp.json() as { matches?: Array<{ id?: string; homeTeam?: { name?: string }; awayTeam?: { name?: string }; homeScore?: number; awayScore?: number; date?: string; status?: string }> };
      return (data.matches || []).map((m, i) => {
        const home = m.homeTeam?.name || 'Home';
        const away = m.awayTeam?.name || 'Away';
        const title = `${away} ${m.awayScore ?? 0} @ ${home} ${m.homeScore ?? 0} — Final`;
        return {
          id: `hl-${m.id || i}-${Date.now()}`,
          title,
          description: `${away} at ${home} — Final Score ${m.awayScore ?? 0}-${m.homeScore ?? 0}`,
          source: 'highlightly' as const,
          url: '#',
          publishedAt: m.date || now,
          category: 'scores',
          team: home,
        };
      });
    } catch {
      return [];
    }
  }

  const [espn, highlightly] = await Promise.all([fetchEspnNews(), fetchHighlightlyNews()]);

  // Deduplicate by title similarity > 70%
  const merged: EnhancedArticle[] = [...espn];
  for (const hl of highlightly) {
    const isDupe = merged.some((existing) => titleSimilarity(existing.title, hl.title) > 0.7);
    if (!isDupe) merged.push(hl);
  }
  merged.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  const payload = {
    articles: merged,
    sources: { espn: espn.length, highlightly: highlightly.length, total: merged.length },
    meta: { source: 'espn+highlightly', fetched_at: now, timezone: 'America/Chicago' },
  };

  await kvPut(env.KV, cacheKey, JSON.stringify(payload), 120);

  return cachedJson(payload, 200, HTTP_CACHE.news);
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

// ---------------------------------------------------------------------------
// Editorial List handler (D1-backed, KV-cached)
// ---------------------------------------------------------------------------

export async function handleCollegeBaseballEditorialList(env: Env): Promise<Response> {
  const cacheKey = 'cb:editorial:list';
  const now = new Date().toISOString();

  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) {
    return cachedJson(cached, 200, HTTP_CACHE.news, {
      ...dataHeaders(now, 'cache'), 'X-Cache': 'HIT',
    });
  }

  try {
    const { results } = await env.DB.prepare(
      `SELECT id, slug, date, title, preview, teams, word_count, created_at
       FROM editorials
       ORDER BY date DESC
       LIMIT 30`
    ).all<{
      id: number;
      slug: string;
      date: string;
      title: string;
      preview: string | null;
      teams: string | null;
      word_count: number;
      created_at: string;
    }>();

    const editorials = (results ?? []).map((row) => {
      let teams: string[] = [];
      try { teams = JSON.parse(row.teams || '[]'); } catch { /* fallback */ }
      if (!Array.isArray(teams)) teams = row.teams ? row.teams.split(',').map((t) => t.trim()) : [];
      return {
        id: row.id,
        slug: row.slug,
        date: row.date,
        title: row.title,
        preview: row.preview ?? '',
        teams,
        wordCount: row.word_count,
        createdAt: row.created_at,
      };
    });

    const payload = {
      editorials,
      meta: { source: 'bsi-d1', fetched_at: now, timezone: 'America/Chicago' },
    };

    await kvPut(env.KV, cacheKey, payload, 300); // 5 min cache
    return cachedJson(payload, 200, HTTP_CACHE.news, {
      ...dataHeaders(now, 'bsi-d1'), 'X-Cache': 'MISS',
    });
  } catch (err) {
    console.error('[editorial] D1 query failed:', err instanceof Error ? err.message : err);
    return json({
      editorials: [],
      meta: { source: 'bsi-d1', fetched_at: now, timezone: 'America/Chicago' },
      message: 'Editorial content is being set up.',
    }, 200);
  }
}

// ---------------------------------------------------------------------------
// Editorial Content handler (R2-backed)
// ---------------------------------------------------------------------------

export async function handleCollegeBaseballEditorialContent(
  date: string,
  env: Env
): Promise<Response> {
  const now = new Date().toISOString();

  // Validate date format (YYYY-MM-DD)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return json({
      error: 'Invalid date format. Use YYYY-MM-DD.',
      meta: { source: 'bsi-r2', fetched_at: now, timezone: 'America/Chicago' },
    }, 400);
  }

  const r2Key = `editorial/cbb/${date}.md`;

  try {
    const object = await env.ASSETS_BUCKET.get(r2Key);

    if (!object) {
      return json({
        content: null,
        date,
        meta: { source: 'bsi-r2', fetched_at: now, timezone: 'America/Chicago' },
        message: `No editorial found for ${date}. Content is generated daily by the digest pipeline.`,
      }, 404);
    }

    const content = await object.text();

    return json({
      content,
      date,
      contentType: object.httpMetadata?.contentType ?? 'text/markdown',
      size: object.size,
      meta: { source: 'bsi-r2', fetched_at: now, timezone: 'America/Chicago' },
    });
  } catch (err) {
    console.error('[editorial] R2 read failed:', err instanceof Error ? err.message : err);
    return json({
      content: null,
      date,
      meta: { source: 'bsi-r2', fetched_at: now, timezone: 'America/Chicago' },
      error: 'Failed to retrieve editorial content from storage.',
    }, 500);
  }
}

// =============================================================================
// Player Comparison
// =============================================================================

function computeBattingDifferentials(p1: Record<string, number>, p2: Record<string, number>): Record<string, number> {
  const stats = ['avg', 'obp', 'slg', 'hr', 'rbi', 'sb', 'runs', 'hits', 'ab', 'bb', 'so'];
  const result: Record<string, number> = {};
  for (const s of stats) {
    if (p1[s] != null && p2[s] != null) {
      const diff = p1[s] - p2[s];
      result[`batting_${s}`] = ['avg', 'obp', 'slg'].includes(s) ? Math.round(diff * 1000) / 1000 : Math.round(diff);
    }
  }
  return result;
}

function computePitchingDifferentials(p1: Record<string, number>, p2: Record<string, number>): Record<string, number> {
  const stats = ['era', 'whip', 'wins', 'losses', 'saves', 'strikeouts', 'ip', 'k9'];
  const result: Record<string, number> = {};
  for (const s of stats) {
    if (p1[s] != null && p2[s] != null) {
      const diff = p1[s] - p2[s];
      result[`pitching_${s}`] = ['era', 'whip', 'k9'].includes(s) ? Math.round(diff * 100) / 100 : Math.round(diff);
    }
  }
  return result;
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

export async function handleCollegeBaseballTrends(teamId: string, env: Env): Promise<Response> {
  const now = new Date().toISOString();

  try {
    const result = await env.DB.prepare(
      'SELECT * FROM standings_snapshots WHERE team_id = ? ORDER BY snapshot_date DESC LIMIT 30'
    ).bind(teamId).all();

    const rows = (result?.results ?? []) as Array<{
      team_id: string; team_name: string; conference: string;
      wins: number; losses: number; conference_wins: number; conference_losses: number;
      rpi: number | null; ranking: number | null; run_differential: number; snapshot_date: string;
    }>;

    const snapshots = rows.reverse().map(r => ({
      date: r.snapshot_date,
      wins: r.wins,
      losses: r.losses,
      winPct: r.wins + r.losses > 0 ? Math.round((r.wins / (r.wins + r.losses)) * 1000) / 1000 : 0,
      ranking: r.ranking,
      rpi: r.rpi,
      runDifferential: r.run_differential,
    }));

    const team = rows.length > 0
      ? { id: rows[0].team_id, name: rows[0].team_name, conference: rows[0].conference }
      : { id: teamId, name: 'Unknown', conference: 'Unknown' };

    const summary = computeTrendSummary(snapshots.map(s => ({ wins: s.wins, losses: s.losses, ranking: s.ranking })));

    return json({
      team,
      snapshots,
      summary,
      meta: { source: 'bsi-d1', fetched_at: now, timezone: 'America/Chicago' },
    });
  } catch (err) {
    console.error('[trends] D1 query failed:', err instanceof Error ? err.message : err);
    return json({
      team: { id: teamId, name: 'Unknown', conference: 'Unknown' },
      snapshots: [],
      summary: { currentStreak: 'N/A', last10: 'N/A', rankingChange: null },
      message: 'Trend data temporarily unavailable.',
      meta: { source: 'bsi-d1', fetched_at: now, timezone: 'America/Chicago' },
    }, 503);
  }
}

// ---------------------------------------------------------------------------
// Stat Ingestion — accumulate player stats from ESPN box scores into D1
// ---------------------------------------------------------------------------

/**
 * Parse ESPN's IP notation (e.g. "6.1" = 6 and 1/3 innings) into integer thirds.
 * 6.0 = 18, 6.1 = 19, 6.2 = 20, 7.0 = 21, etc.
 */
function parseInningsToThirds(ip: string): number {
  const num = parseFloat(ip);
  if (isNaN(num)) return 0;
  const whole = Math.floor(num);
  const frac = Math.round((num - whole) * 10); // .1 = 1, .2 = 2
  return whole * 3 + frac;
}

/**
 * Process finished college baseball games from today's scoreboard.
 * Fetches box scores for each final game not yet processed, and upserts
 * player stats into D1.
 *
 * Returns a summary of what was processed.
 */
export async function processFinishedGames(
  env: Env,
  dateStr?: string,
): Promise<{ processed: number; skipped: number; errors: string[] }> {
  const date = dateStr || new Date().toLocaleString('en-CA', { timeZone: 'America/Chicago' }).split(',')[0];
  const espnDate = date.replace(/-/g, '');
  const result = { processed: 0, skipped: 0, errors: [] as string[] };

  // 1. Fetch today's scoreboard
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const scoreboard = await getScoreboard('college-baseball', espnDate) as any;
  const events = scoreboard?.events || [];

  // 2. Filter for completed games
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const finals = events.filter((e: any) => {
    const st = e?.status?.type || e?.competitions?.[0]?.status?.type || {};
    return st.completed === true;
  });

  if (finals.length === 0) return result;

  // 3. Check which games are already processed (chunk to stay under D1's 100-param limit)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const gameIds = finals.map((e: any) => String(e.id));
  const processedSet = new Set<string>();
  const PARAM_CHUNK = 80;
  for (let i = 0; i < gameIds.length; i += PARAM_CHUNK) {
    const chunk = gameIds.slice(i, i + PARAM_CHUNK);
    const placeholders = chunk.map(() => '?').join(',');
    const existing = await env.DB.prepare(
      `SELECT game_id FROM processed_games WHERE game_id IN (${placeholders})`
    ).bind(...chunk).all<{ game_id: string }>();
    for (const r of existing.results) processedSet.add(r.game_id);
  }

  // 4. Process each unprocessed final
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const event of finals as any[]) {
    const gameId = String(event.id);
    if (processedSet.has(gameId)) {
      result.skipped++;
      continue;
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const summary = await getGameSummary('college-baseball', gameId) as any;
      const boxPlayers = summary?.boxscore?.players || [];

      // Each entry in boxPlayers is a team: { team: {...}, statistics: [batting, pitching] }
      const stmts: D1PreparedStatement[] = [];

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const teamBox of boxPlayers as any[]) {
        const teamName = teamBox.team?.displayName || teamBox.team?.shortDisplayName || '';
        const teamId = String(teamBox.team?.id || '');

        for (const statGroup of (teamBox.statistics || [])) {
          const labels: string[] = statGroup.labels || [];
          const isBatting = labels.includes('AB') || labels.includes('H-AB');
          const isPitching = labels.includes('IP') || labels.includes('ERA');

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          for (const athleteEntry of (statGroup.athletes || []) as any[]) {
            const athlete = athleteEntry.athlete || {};
            const espnId = String(athlete.id || '');
            if (!espnId) continue;

            const name = athlete.displayName || '';
            const position = athlete.position?.abbreviation || '';
            const headshot = athlete.headshot?.href || '';
            const stats: string[] = athleteEntry.stats || [];

            if (isBatting && stats.length > 0) {
              // Batting labels: ['H-AB', 'AB', 'R', 'H', 'RBI', 'HR', 'BB', 'K', '#P', 'AVG', 'OBP', 'SLG']
              const idx = (label: string) => labels.indexOf(label);
              const num = (label: string) => parseInt(stats[idx(label)] || '0', 10) || 0;

              const ab = num('AB');
              if (ab === 0 && num('R') === 0 && num('H') === 0) continue; // skip DNP entries

              stmts.push(env.DB.prepare(`
                INSERT INTO player_season_stats
                  (espn_id, season, sport, name, team, team_id, position, headshot,
                   games_bat, at_bats, runs, hits, rbis, home_runs, walks_bat, strikeouts_bat, stolen_bases)
                VALUES (?, 2026, 'college-baseball', ?, ?, ?, ?, ?,
                        1, ?, ?, ?, ?, ?, ?, ?, 0)
                ON CONFLICT(espn_id, season, sport) DO UPDATE SET
                  name = excluded.name,
                  team = excluded.team,
                  team_id = excluded.team_id,
                  position = excluded.position,
                  headshot = CASE WHEN excluded.headshot != '' THEN excluded.headshot ELSE player_season_stats.headshot END,
                  games_bat = player_season_stats.games_bat + 1,
                  at_bats = player_season_stats.at_bats + excluded.at_bats,
                  runs = player_season_stats.runs + excluded.runs,
                  hits = player_season_stats.hits + excluded.hits,
                  rbis = player_season_stats.rbis + excluded.rbis,
                  home_runs = player_season_stats.home_runs + excluded.home_runs,
                  walks_bat = player_season_stats.walks_bat + excluded.walks_bat,
                  strikeouts_bat = player_season_stats.strikeouts_bat + excluded.strikeouts_bat,
                  updated_at = datetime('now')
              `).bind(
                espnId, name, teamName, teamId, position, headshot,
                ab, num('R'), num('H'), num('RBI'), num('HR'), num('BB'), num('K'),
              ));
            }

            if (isPitching && stats.length > 0) {
              const idx = (label: string) => labels.indexOf(label);
              const num = (label: string) => parseInt(stats[idx(label)] || '0', 10) || 0;
              const ipStr = stats[idx('IP')] || '0';
              const ipThirds = parseInningsToThirds(ipStr);

              if (ipThirds === 0) continue; // skip pitchers who didn't record an out

              stmts.push(env.DB.prepare(`
                INSERT INTO player_season_stats
                  (espn_id, season, sport, name, team, team_id, position, headshot,
                   games_pitch, innings_pitched_thirds, hits_allowed, runs_allowed,
                   earned_runs, walks_pitch, strikeouts_pitch, home_runs_allowed)
                VALUES (?, 2026, 'college-baseball', ?, ?, ?, ?, ?,
                        1, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(espn_id, season, sport) DO UPDATE SET
                  name = excluded.name,
                  team = excluded.team,
                  team_id = excluded.team_id,
                  position = CASE WHEN excluded.position != '' THEN excluded.position ELSE player_season_stats.position END,
                  headshot = CASE WHEN excluded.headshot != '' THEN excluded.headshot ELSE player_season_stats.headshot END,
                  games_pitch = player_season_stats.games_pitch + 1,
                  innings_pitched_thirds = player_season_stats.innings_pitched_thirds + excluded.innings_pitched_thirds,
                  hits_allowed = player_season_stats.hits_allowed + excluded.hits_allowed,
                  runs_allowed = player_season_stats.runs_allowed + excluded.runs_allowed,
                  earned_runs = player_season_stats.earned_runs + excluded.earned_runs,
                  walks_pitch = player_season_stats.walks_pitch + excluded.walks_pitch,
                  strikeouts_pitch = player_season_stats.strikeouts_pitch + excluded.strikeouts_pitch,
                  home_runs_allowed = player_season_stats.home_runs_allowed + excluded.home_runs_allowed,
                  updated_at = datetime('now')
              `).bind(
                espnId, name, teamName, teamId, position, headshot,
                ipThirds, num('H'), num('R'), num('ER'), num('BB'), num('K'), num('HR'),
              ));
            }
          }
        }
      }

      // Batch upsert player stats + mark game as processed
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const competitions = event.competitions || [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const competitors = competitions[0]?.competitors || [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const homeTeam = competitors.find((c: any) => c.homeAway === 'home')?.team?.displayName || '';
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const awayTeam = competitors.find((c: any) => c.homeAway === 'away')?.team?.displayName || '';

      stmts.push(env.DB.prepare(
        `INSERT OR IGNORE INTO processed_games (game_id, sport, game_date, home_team, away_team) VALUES (?, 'college-baseball', ?, ?, ?)`
      ).bind(gameId, date, homeTeam, awayTeam));

      // D1 batch limit is 100 statements; chunk conservatively
      for (let i = 0; i < stmts.length; i += 50) {
        await env.DB.batch(stmts.slice(i, i + 50));
      }

      result.processed++;
    } catch (err) {
      const msg = `Game ${gameId}: ${err instanceof Error ? err.message : 'unknown error'}`;
      result.errors.push(msg);
    }
  }

  return result;
}

/**
 * HTTP handler for manual stat ingestion trigger.
 * GET /api/college-baseball/ingest-stats?date=2026-02-21
 */
export async function handleIngestStats(env: Env, dateStr?: string): Promise<Response> {
  try {
    const result = await processFinishedGames(env, dateStr);
    return json({
      ...result,
      meta: { timestamp: new Date().toISOString(), source: 'espn-boxscores' },
    });
  } catch (err) {
    return json({
      error: err instanceof Error ? err.message : 'Ingestion failed',
      meta: { timestamp: new Date().toISOString() },
    }, 500);
  }
}

// ---------------------------------------------------------------------------
// Leaders — queries accumulated D1 stats
// ---------------------------------------------------------------------------

export async function handleCollegeBaseballLeaders(env: Env): Promise<Response> {
  const cacheKey = 'cb:leaders';
  const now = new Date().toISOString();

  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) return cachedJson(cached, 200, HTTP_CACHE.standings, { 'X-Cache': 'HIT' });

  try {
    // Query D1 for accumulated season leaders
    const categories = await buildLeaderCategories(env);

    const payload = {
      categories,
      meta: { lastUpdated: now, dataSource: 'd1-accumulated' },
    };

    await kvPut(env.KV, cacheKey, payload, 300); // 5 min TTL
    return cachedJson(payload, 200, HTTP_CACHE.standings, { 'X-Cache': 'MISS' });
  } catch {
    // Fallback: empty categories so the UI renders its placeholder state
    const empty = { categories: [], meta: { lastUpdated: now, dataSource: 'unavailable' } };
    await kvPut(env.KV, cacheKey, empty, 300);
    return cachedJson(empty, 200, HTTP_CACHE.standings, { 'X-Cache': 'MISS' });
  }
}

interface LeaderRow {
  espn_id: string;
  name: string;
  team: string;
  team_id: string;
  headshot: string;
  computed_value: number;
}

/**
 * Build the 6 leader categories from D1 accumulated stats.
 * Batting: AVG (min 15 AB), HR, RBI. Pitching: ERA (min 5 IP), K, SB.
 */
async function buildLeaderCategories(env: Env) {
  const queries = [
    {
      name: 'Batting Average',
      abbreviation: 'battingAverage',
      sql: `SELECT espn_id, name, team, team_id, headshot,
              ROUND(CAST(hits AS REAL) / at_bats, 3) AS computed_value
            FROM player_season_stats
            WHERE sport = 'college-baseball' AND season = 2026
              AND at_bats >= 15
            ORDER BY computed_value DESC
            LIMIT 10`,
      format: (v: number) => v.toFixed(3).replace(/^0/, ''),
    },
    {
      name: 'Home Runs',
      abbreviation: 'homeRuns',
      sql: `SELECT espn_id, name, team, team_id, headshot, home_runs AS computed_value
            FROM player_season_stats
            WHERE sport = 'college-baseball' AND season = 2026
              AND at_bats > 0
            ORDER BY home_runs DESC
            LIMIT 10`,
      format: (v: number) => String(v),
    },
    {
      name: 'RBI',
      abbreviation: 'RBIs',
      sql: `SELECT espn_id, name, team, team_id, headshot, rbis AS computed_value
            FROM player_season_stats
            WHERE sport = 'college-baseball' AND season = 2026
              AND at_bats > 0
            ORDER BY rbis DESC
            LIMIT 10`,
      format: (v: number) => String(v),
    },
    {
      name: 'Earned Run Average',
      abbreviation: 'earnedRunAverage',
      sql: `SELECT espn_id, name, team, team_id, headshot,
              ROUND(CAST(earned_runs AS REAL) * 27 / innings_pitched_thirds, 2) AS computed_value
            FROM player_season_stats
            WHERE sport = 'college-baseball' AND season = 2026
              AND innings_pitched_thirds >= 15
            ORDER BY computed_value ASC
            LIMIT 10`,
      format: (v: number) => v.toFixed(2),
    },
    {
      name: 'Strikeouts',
      abbreviation: 'strikeouts',
      sql: `SELECT espn_id, name, team, team_id, headshot, strikeouts_pitch AS computed_value
            FROM player_season_stats
            WHERE sport = 'college-baseball' AND season = 2026
              AND innings_pitched_thirds > 0
            ORDER BY strikeouts_pitch DESC
            LIMIT 10`,
      format: (v: number) => String(v),
    },
    {
      name: 'Hits',
      abbreviation: 'hits',
      sql: `SELECT espn_id, name, team, team_id, headshot, hits AS computed_value
            FROM player_season_stats
            WHERE sport = 'college-baseball' AND season = 2026
              AND at_bats > 0
            ORDER BY hits DESC
            LIMIT 10`,
      format: (v: number) => String(v),
    },
  ];

  const categories = [];
  for (const q of queries) {
    const { results } = await env.DB.prepare(q.sql).all<LeaderRow>();

    if (results.length === 0) continue;

    categories.push({
      name: q.name,
      abbreviation: q.abbreviation,
      leaders: results.map((r) => ({
        name: r.name,
        id: r.espn_id,
        team: r.team,
        teamId: r.team_id,
        headshot: r.headshot || '',
        value: q.format(r.computed_value),
        stat: q.abbreviation,
      })),
    });
  }

  return categories;
}
