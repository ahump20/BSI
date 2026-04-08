import type {
  IntelGame,
  IntelMode,
  IntelSignal,
  IntelSport,
  GameStatus,
  StandingsTeam,
  NewsItem,
} from './types';
import { SIGNAL_TYPES_BY_MODE } from './sample-data';
import { estimatePregameWinProbability } from '@/lib/analytics/pregame-win-prob';

// ─── Utility Helpers ───────────────────────────────────────────────────────

function parseStatus(status: unknown): { gameStatus: GameStatus; detail?: string } {
  if (typeof status === 'string') {
    const low = status.toLowerCase();
    if (low.includes('in progress') || low.includes('in ')) return { gameStatus: 'live', detail: status };
    if (low.includes('final')) return { gameStatus: 'final', detail: status };
    return { gameStatus: 'scheduled', detail: status };
  }
  if (typeof status === 'object' && status) {
    const s = status as Record<string, unknown>;
    const type = s.type as Record<string, unknown> | undefined;
    const state = type?.state as string | undefined;
    const desc =
      (s.detailedState as string) ||
      (type?.detail as string) ||
      (type?.shortDetail as string) ||
      (type?.description as string) ||
      'Scheduled';
    if (state === 'in' || s.isLive === true) return { gameStatus: 'live', detail: desc };
    if (state === 'post' || s.isFinal === true) return { gameStatus: 'final', detail: desc };
    return { gameStatus: 'scheduled', detail: desc };
  }
  return { gameStatus: 'scheduled' };
}

export function dig(obj: unknown, ...paths: string[]): unknown {
  for (const p of paths) {
    const v = p.split('.').reduce<unknown>((o, k) => {
      if (typeof o === 'object' && o !== null) return (o as Record<string, unknown>)[k];
      return undefined;
    }, obj);
    if (v !== undefined && v !== null && v !== '') return v;
  }
  return undefined;
}

export function asObject(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : null;
}

export function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

export function asNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value.replace(/[^0-9.-]/g, ''));
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

function parseRecordSummary(record?: string): { wins: number; losses: number } | null {
  if (!record) return null;
  const m = record.match(/(\d+)\s*-\s*(\d+)/);
  if (!m) return null;
  const wins = Number(m[1]);
  const losses = Number(m[2]);
  if (!Number.isFinite(wins) || !Number.isFinite(losses)) return null;
  return { wins, losses };
}

function extractRecordSummary(raw: Record<string, unknown>): string {
  const direct = dig(raw, 'record', 'team.record');
  if (typeof direct === 'string' && direct.trim()) return direct.trim();

  const records = asArray(dig(raw, 'records', 'team.records'));
  const normalized = records
    .map((r) => asObject(r))
    .filter((r): r is Record<string, unknown> => r !== null);

  if (normalized.length === 0) return '';

  const overall =
    normalized.find((r) => String(r.name || '').toLowerCase() === 'overall') ||
    normalized.find((r) => String(r.type || '').toLowerCase() === 'total') ||
    normalized[0];

  const summary = String(overall.summary || '').trim();
  return summary;
}

/** Merge nested .team fields to top level so normalizeTeam finds them directly. */
function unwrapCompetitor(raw: Record<string, unknown>): Record<string, unknown> {
  const team = asObject(raw.team);
  if (!team) return raw;
  return { ...team, ...raw };
}

function normalizeTeam(raw: Record<string, unknown>, fallbackName: string): IntelGame['home'] {
  const nameCandidate = dig(
    raw,
    'displayName',
    'name',
    'team.displayName',
    'team.name',
    'team.shortDisplayName',
    'abbreviation',
  );
  const displayName = (typeof nameCandidate === 'string' ? nameCandidate : String(nameCandidate || fallbackName)).trim();

  const abbreviation = String(dig(raw, 'abbreviation', 'team.abbreviation') || '').trim().toUpperCase();
  const score = asNumber(dig(raw, 'score', 'team.score')) ?? 0;
  const logo = String(dig(raw, 'team.logo', 'logo', 'team.logos.0.href', 'logos.0.href') || '').trim();

  const rankCandidate = asNumber(
    dig(
      raw,
      'curatedRank.current',
      'team.curatedRank.current',
      'curatedRank',
      'team.curatedRank',
      'rank',
      'team.rank',
      'seed',
      'team.seed',
    ),
  );

  return {
    name: displayName || fallbackName,
    abbreviation,
    score,
    logo: logo || undefined,
    rank: rankCandidate && rankCandidate > 0 ? rankCandidate : undefined,
    record: extractRecordSummary(raw) || undefined,
  };
}

// ─── Normalize ESPN Data -> IntelGame ───────────────────────────────────────

export function normalizeToIntelGames(sport: Exclude<IntelSport, 'all'>, data: Record<string, unknown>): IntelGame[] {
  const sb = data.scoreboard as Record<string, unknown> | undefined;
  const raw = (data.games || sb?.games || data.events || []) as Record<string, unknown>[];

  return raw.map((g, i) => {
    // Handle teams as either object {away, home} or array [{homeAway: 'home'}, ...]
    const teamsValue = g.teams;
    const teamsObj = !Array.isArray(teamsValue) ? asObject(teamsValue) as Record<string, Record<string, unknown>> | null : null;
    const teamsArr = Array.isArray(teamsValue)
      ? teamsValue.map((t) => asObject(t)).filter((t): t is Record<string, unknown> => t !== null)
      : [];

    const competition = asObject(asArray(g.competitions)[0]) ?? {};
    const competitors = asArray(competition.competitors)
      .map((c) => asObject(c))
      .filter((c): c is Record<string, unknown> => c !== null);

    // Merge teams-array and competitors into a single pool for home/away lookup
    const allCandidates = [...teamsArr, ...competitors];
    const awayFromPool = allCandidates.find((c) => String(c.homeAway || '').toLowerCase() === 'away');
    const homeFromPool = allCandidates.find((c) => String(c.homeAway || '').toLowerCase() === 'home');

    const awayRaw =
      teamsObj?.away ||
      asObject(g.awayTeam) ||
      awayFromPool ||
      allCandidates[1] ||
      {};
    const homeRaw =
      teamsObj?.home ||
      asObject(g.homeTeam) ||
      homeFromPool ||
      allCandidates[0] ||
      {};

    const away = normalizeTeam(unwrapCompetitor(awayRaw), 'Away');
    const home = normalizeTeam(unwrapCompetitor(homeRaw), 'Home');
    const { gameStatus, detail } = parseStatus(g.status || competition.status);
    const headline = String(
      dig(g, 'competitions.0.notes.0.headline', 'notes.0.headline', 'headline', 'shortDetail') || '',
    ).trim();
    const venueRaw = dig(g, 'venue', 'competitions.0.venue');
    const venue = typeof venueRaw === 'string'
      ? venueRaw.trim()
      : String((asObject(venueRaw) as Record<string, unknown> | null)?.fullName || (asObject(venueRaw) as Record<string, unknown> | null)?.name || '').trim();
    const startTime = String(
      dig(g, 'startTime', 'time', 'startDate', 'date', 'competitions.0.date') || '',
    ).trim();
    const isPregameNoScore = gameStatus === 'scheduled' && away.score === 0 && home.score === 0;

    return {
      id: String(g.id ?? i),
      sport,
      away,
      home,
      status: gameStatus,
      statusDetail: detail,
      headline: headline || undefined,
      venue: venue || undefined,
      startTime: startTime || undefined,
      tier: 'standard' as const,
      signalCount: 0,
      winProbability: isPregameNoScore
        ? estimatePregameWinProbability(sport, home.record, away.record)
        : undefined,
    };
  });
}

// ─── Normalize College Baseball (Highlightly/NCAA) -> IntelGame ────────────

export function normalizeCollegeBaseballGames(data: Record<string, unknown>): IntelGame[] {
  // The /api/college-baseball/scores endpoint returns { data: Match[], totalCount }
  const matches = asArray(data.data || data.games || data.matches || []);

  return matches.map((m, i) => {
    const match = asObject(m);
    if (!match) {
      return null;
    }

    const homeTeam = asObject(match.homeTeam) ?? {};
    const awayTeam = asObject(match.awayTeam) ?? {};
    const status = asObject(match.status) ?? {};

    const homeScore = asNumber(match.homeScore) ?? 0;
    const awayScore = asNumber(match.awayScore) ?? 0;

    // Parse status
    const statusType = String(status.type || '').toLowerCase();
    let gameStatus: GameStatus = 'scheduled';
    let statusDetail = String(status.description || '');
    if (statusType === 'inprogress' || statusType === 'in_progress') {
      gameStatus = 'live';
      const inning = asNumber(match.currentInning);
      const half = String(match.currentInningHalf || '').toLowerCase();
      if (inning) {
        statusDetail = `${half === 'top' ? 'Top' : 'Bot'} ${inning}`;
      }
    } else if (statusType === 'finished' || statusType === 'final') {
      gameStatus = 'final';
      statusDetail = 'Final';
    } else if (statusType === 'postponed') {
      gameStatus = 'scheduled';
      statusDetail = 'Postponed';
    }

    // Team info
    const homeRecord = asObject(homeTeam.record);
    const awayRecord = asObject(awayTeam.record);
    const homeRecordStr = homeRecord
      ? `${asNumber(homeRecord.wins) ?? 0}-${asNumber(homeRecord.losses) ?? 0}`
      : undefined;
    const awayRecordStr = awayRecord
      ? `${asNumber(awayRecord.wins) ?? 0}-${asNumber(awayRecord.losses) ?? 0}`
      : undefined;

    const home: IntelGame['home'] = {
      name: String(homeTeam.name || homeTeam.shortName || 'Home').trim(),
      abbreviation: String(homeTeam.shortName || homeTeam.slug || '').trim().toUpperCase().slice(0, 6),
      score: homeScore,
      logo: typeof homeTeam.logo === 'string' ? homeTeam.logo : undefined,
      rank: asNumber(homeTeam.ranking) ?? undefined,
      record: homeRecordStr,
    };

    const away: IntelGame['away'] = {
      name: String(awayTeam.name || awayTeam.shortName || 'Away').trim(),
      abbreviation: String(awayTeam.shortName || awayTeam.slug || '').trim().toUpperCase().slice(0, 6),
      score: awayScore,
      logo: typeof awayTeam.logo === 'string' ? awayTeam.logo : undefined,
      rank: asNumber(awayTeam.ranking) ?? undefined,
      record: awayRecordStr,
    };

    // Venue
    const venue = asObject(match.venue);
    const venueName = venue ? String(venue.name || venue.city || '').trim() : undefined;

    // Start time
    const startTimestamp = asNumber(match.startTimestamp);
    const startTime = startTimestamp
      ? new Date(startTimestamp * 1000).toISOString()
      : undefined;

    // Innings for scoring breakdown
    const innings = asArray(match.innings);
    const scoring = innings.length > 0
      ? innings.map((inn) => {
          const inning = asObject(inn);
          if (!inning) return {};
          return {
            inning: asNumber(inning.inning) ?? 0,
            away: asNumber(inning.awayRuns) ?? 0,
            home: asNumber(inning.homeRuns) ?? 0,
          };
        })
      : undefined;

    // Conference info for headline
    const homeConf = asObject(homeTeam.conference);
    const awayConf = asObject(awayTeam.conference);
    const confNote =
      homeConf && awayConf && homeConf.name === awayConf.name
        ? String(homeConf.shortName || homeConf.name || '')
        : '';
    const headline = confNote ? `${confNote} matchup` : undefined;

    // Win probability for pregame
    const isPregame = gameStatus === 'scheduled' && homeScore === 0 && awayScore === 0;
    const winProbability = isPregame
      ? estimatePregameWinProbability('d1bb', homeRecordStr, awayRecordStr)
      : undefined;

    return {
      id: `d1bb-${String(match.id ?? i)}`,
      sport: 'd1bb' as const,
      away,
      home,
      status: gameStatus,
      statusDetail: statusDetail || undefined,
      headline,
      venue: venueName || undefined,
      startTime,
      tier: 'standard' as const,
      signalCount: 0,
      winProbability,
      scoring: scoring as IntelGame['scoring'],
    };
  }).filter(Boolean) as IntelGame[];
}

// ─── Normalize College Baseball Standings -> StandingsTeam[] ───────────────

export function normalizeCollegeBaseballStandings(data: Record<string, unknown>): StandingsTeam[] {
  const result: StandingsTeam[] = [];

  // The /api/college-baseball/standings returns conference-grouped data
  // Shape: HighlightlyStandings[] = [{ conference, teams: [...] }]
  const conferences = asArray(data);

  // If the top-level isn't an array, check for nested data
  const standingsArray = conferences.length > 0
    ? conferences
    : asArray(data.standings || data.data || []);

  for (const confRaw of standingsArray) {
    const conf = asObject(confRaw);
    if (!conf) continue;

    const confInfo = asObject(conf.conference);
    const confName = confInfo ? String(confInfo.name || confInfo.shortName || '') : undefined;
    const teams = asArray(conf.teams);

    for (const teamRaw of teams) {
      const t = asObject(teamRaw);
      if (!t) continue;

      const teamInfo = asObject(t.team) ?? {};
      const teamName = String(teamInfo.name || t.name || '').trim();
      if (!teamName) continue;

      result.push({
        teamName,
        abbreviation: String(teamInfo.shortName || teamInfo.slug || '').trim().toUpperCase().slice(0, 6) || undefined,
        logo: typeof teamInfo.logo === 'string' ? teamInfo.logo : undefined,
        rank: asNumber(teamInfo.ranking || t.rank) ?? undefined,
        wins: asNumber(t.wins) ?? 0,
        losses: asNumber(t.losses) ?? 0,
        winPct: asNumber(t.winPercentage) ?? undefined,
        netRating: asNumber(t.runDifferential) ?? undefined,
        conference: confName || undefined,
      });
    }
  }

  return result
    .sort((a, b) => {
      // Sort by rank first, then win percentage
      if (a.rank && b.rank) return a.rank - b.rank;
      if (a.rank) return -1;
      if (b.rank) return 1;
      const aPct = a.winPct ?? a.wins / Math.max(a.wins + a.losses, 1);
      const bPct = b.winPct ?? b.wins / Math.max(b.wins + b.losses, 1);
      return bPct - aPct;
    })
    .slice(0, 20);
}

// ─── Normalize Generic Standings ───────────────────────────────────────────

export function normalizeStandings(data: Record<string, unknown>): StandingsTeam[] {
  const normalized: StandingsTeam[] = [];

  // Grouped format (NBA/MLB SDIO): { standings: [{ name, teams: [...] }] }
  // Detect by checking if standings is an array of objects that each have a `teams` array.
  const standingsValue = asArray(dig(data, 'standings'));
  if (standingsValue.length > 0 && standingsValue.every(g => {
    const obj = asObject(g);
    return obj !== null && Array.isArray(obj.teams);
  })) {
    for (const groupRaw of standingsValue) {
      const group = asObject(groupRaw);
      if (!group) continue;
      const conference = String(group.name || '').trim() || undefined;
      for (const teamRaw of asArray(group.teams)) {
        const t = asObject(teamRaw);
        if (!t) continue;
        const teamName = String(t.displayName || t.name || '').trim();
        if (!teamName) continue;
        normalized.push({
          teamName,
          abbreviation: String(t.abbreviation || '').toUpperCase() || undefined,
          logo: typeof t.logo === 'string' ? t.logo : undefined,
          wins: asNumber(t.wins) ?? 0,
          losses: asNumber(t.losses) ?? 0,
          winPct: asNumber(t.pct) ?? asNumber(t.winPercentage) ?? undefined,
          netRating: asNumber(t.netRating) ?? undefined,
          conference,
        });
      }
    }
    if (normalized.length > 0) return normalized;
    // Fall through to generic parsing if grouped format yielded nothing
  }

  const directList = asArray(dig(data, 'standings', 'teams', 'entries'));
  const blocks = directList.length > 0
    ? directList
    : asArray(dig(data, 'standings.children', 'children'));

  function parseEntry(entryRaw: unknown, conference?: string, division?: string) {
    const entry = asObject(entryRaw);
    if (!entry) return;

    const team = asObject(entry.team) ?? entry;
    const teamName = String(
      dig(team, 'displayName', 'name', 'shortDisplayName', 'location') ||
      dig(entry, 'teamName', 'name') ||
      '',
    ).trim();

    if (!teamName) return;

    const abbreviation = String(dig(team, 'abbreviation', 'abbrev') || '').trim().toUpperCase() || undefined;
    const logo = String(dig(team, 'logo', 'logos.0.href') || '').trim() || undefined;
    const rankValue = asNumber(dig(entry, 'curatedRank.current', 'team.curatedRank.current', 'seed'));

    const stats = asArray(entry.stats)
      .map((s) => asObject(s))
      .filter((s): s is Record<string, unknown> => s !== null);

    const getStat = (...keys: string[]) =>
      stats.find((s) => keys.includes(String(s.name || '').toLowerCase()) || keys.includes(String(s.abbreviation || '').toLowerCase()));
    const statNumber = (...keys: string[]) => {
      const stat = getStat(...keys);
      return asNumber(stat?.value ?? stat?.displayValue);
    };
    const statDisplay = (...keys: string[]) => {
      const stat = getStat(...keys);
      const value = stat?.displayValue ?? stat?.summary;
      return typeof value === 'string' ? value : '';
    };

    const summary = statDisplay('overall', 'record');
    const parsedSummary = parseRecordSummary(summary);
    const wins = statNumber('wins', 'w') ?? parsedSummary?.wins ?? asNumber(entry.wins) ?? 0;
    const losses = statNumber('losses', 'l') ?? parsedSummary?.losses ?? asNumber(entry.losses) ?? 0;
    const winPct = statNumber('winpercent', 'winpercentage', 'winpct', 'pct') ?? asNumber(entry.winPct);
    const netRating = statNumber('netrating', 'netrtg', 'pointdifferential', 'pointdiff') ?? asNumber(entry.netRating);

    normalized.push({
      teamName,
      abbreviation,
      logo,
      rank: rankValue && rankValue > 0 ? rankValue : undefined,
      wins,
      losses,
      winPct: winPct ?? undefined,
      netRating: netRating ?? undefined,
      conference,
      division,
    });
  }

  for (const blockRaw of blocks) {
    const block = asObject(blockRaw);
    if (!block) continue;

    // Already normalized row shape
    if (typeof block.teamName === 'string' && (typeof block.wins === 'number' || typeof block.losses === 'number')) {
      normalized.push({
        teamName: block.teamName as string,
        abbreviation: typeof block.abbreviation === 'string' ? block.abbreviation : undefined,
        logo: typeof block.logo === 'string' ? block.logo : undefined,
        rank: asNumber(block.rank),
        wins: asNumber(block.wins) ?? 0,
        losses: asNumber(block.losses) ?? 0,
        winPct: asNumber(block.winPct),
        netRating: asNumber(block.netRating),
        conference: typeof block.conference === 'string' ? block.conference : undefined,
        division: typeof block.division === 'string' ? block.division : undefined,
      });
      continue;
    }

    const conference = String(block.name || block.abbreviation || '').trim() || undefined;
    const entries = asArray(dig(block, 'standings.entries', 'entries'));

    if (entries.length > 0) {
      for (const entry of entries) parseEntry(entry, conference);
      continue;
    }

    // Some payloads place a single entry at this level
    parseEntry(block, conference);
  }

  return normalized
    .filter((t) => t.teamName && Number.isFinite(t.wins) && Number.isFinite(t.losses));
}

// ─── Normalize News ────────────────────────────────────────────────────────

export function normalizeNews(
  payloads: Array<{ sport: Exclude<IntelSport, 'all'>; data: Record<string, unknown> }>,
): NewsItem[] {
  const allArticles = payloads.flatMap(({ sport, data }) => {
    const items = asArray(dig(data, 'articles', 'news')).map((a) => asObject(a)).filter((a): a is Record<string, unknown> => a !== null);
    return items.map((a, i) => {
      const images = asArray(a.images).map((img) => asObject(img)).filter((img): img is Record<string, unknown> => img !== null);
      const published = String(a.published || a.lastModified || '');
      return {
        id: `${sport}-${String(a.id ?? i)}`,
        headline: String(a.headline || ''),
        description: String(a.description || ''),
        link: String(dig(a, 'links.web.href', 'links.mobile.href', 'link') || '#'),
        image: images[0] ? String(images[0].url || images[0].href || '') || undefined : undefined,
        published: published || undefined,
      };
    });
  });

  return allArticles
    .filter((a) => a.headline && a.link)
    .sort((a, b) => {
      const ta = a.published ? Date.parse(a.published) : 0;
      const tb = b.published ? Date.parse(b.published) : 0;
      return tb - ta;
    })
    .slice(0, 16);
}

// ─── Assign Game Tiers ─────────────────────────────────────────────────────

export function assignTiers(games: IntelGame[]): IntelGame[] {
  if (games.length === 0) return games;

  // Live games get priority. Then finals. Then scheduled.
  const sorted = [...games].sort((a, b) => {
    const order: Record<GameStatus, number> = { live: 0, final: 1, scheduled: 2 };
    return order[a.status] - order[b.status];
  });

  return sorted.map((g, i) => ({
    ...g,
    tier: i === 0 ? 'hero' : i <= 3 ? 'marquee' : 'standard',
  }));
}

// ─── Signal Generation ─────────────────────────────────────────────────────

export function generateSignals(
  games: IntelGame[],
  standings: StandingsTeam[],
  mode: IntelMode,
): IntelSignal[] {
  const signals: IntelSignal[] = [];
  const types = SIGNAL_TYPES_BY_MODE[mode];
  let idx = 0;

  for (const game of games) {
    const diff = Math.abs(game.home.score - game.away.score);
    const leader = game.home.score >= game.away.score ? game.home : game.away;
    const trailer = game.home.score >= game.away.score ? game.away : game.home;

    // Sport-specific thresholds: baseball uses tighter margins than basketball
    const isBaseball = game.sport === 'mlb' || game.sport === 'd1bb';
    const clutchThreshold = isBaseball ? 2 : 5;
    const blowoutThreshold = isBaseball ? 8 : 20;
    const nailbiterThreshold = isBaseball ? 1 : 3;

    // Live game, close score -> clutch time
    if (game.status === 'live' && diff <= clutchThreshold) {
      signals.push({
        id: `sig-clutch-${game.id}`,
        text: `${leader.abbreviation || leader.name} leads ${trailer.abbreviation || trailer.name} by ${diff}. Clutch time.`,
        sport: game.sport,
        priority: 'high',
        type: types[idx % types.length],
        modes: ['coach', 'fan'],
        gameId: game.id,
        teamTags: [leader.abbreviation, trailer.abbreviation].filter(Boolean),
        timestamp: 'Live',
      });
      idx++;
    }

    // Blowout
    if (game.status === 'live' && diff >= blowoutThreshold) {
      signals.push({
        id: `sig-blowout-${game.id}`,
        text: `${leader.abbreviation || leader.name} up ${diff} over ${trailer.abbreviation || trailer.name}. Blowout territory.`,
        sport: game.sport,
        priority: 'medium',
        type: 'RECAP',
        modes: ['coach', 'fan'],
        gameId: game.id,
        teamTags: [leader.abbreviation, trailer.abbreviation].filter(Boolean),
        timestamp: 'Live',
      });
      idx++;
    }

    // Final game with narrow margin
    if (game.status === 'final' && diff <= nailbiterThreshold) {
      signals.push({
        id: `sig-nail-${game.id}`,
        text: `${leader.abbreviation || leader.name} edged ${trailer.abbreviation || trailer.name} ${leader.score}-${trailer.score}. Nail-biter.`,
        sport: game.sport,
        priority: 'medium',
        type: 'RECAP',
        modes: ['coach', 'fan', 'scout'],
        gameId: game.id,
        teamTags: [leader.abbreviation, trailer.abbreviation].filter(Boolean),
        timestamp: 'Final',
      });
      idx++;
    }

    // College baseball ranked team upset alert
    if (game.sport === 'd1bb' && game.status === 'final') {
      const rankedHome = game.home.rank && game.home.rank <= 25;
      const rankedAway = game.away.rank && game.away.rank <= 25;
      const homeWon = game.home.score > game.away.score;
      const upsetOccurred =
        (rankedHome && !rankedAway && !homeWon) ||
        (rankedAway && !rankedHome && homeWon);

      if (upsetOccurred) {
        const upset = homeWon ? game.home : game.away;
        const favorite = homeWon ? game.away : game.home;
        signals.push({
          id: `sig-upset-${game.id}`,
          text: `UPSET: ${upset.name} takes down #${favorite.rank} ${favorite.name} ${upset.score}-${favorite.score}.`,
          sport: game.sport,
          priority: 'high',
          type: 'UPSET ALERT',
          modes: ['coach', 'fan', 'scout'],
          gameId: game.id,
          teamTags: [upset.abbreviation, favorite.abbreviation].filter(Boolean),
          timestamp: 'Final',
        });
        idx++;
      }
    }
  }

  // ─── Baseball Pitching & Workload Signals (CV Survey: pitcher biomechanics) ─
  // High-scoring baseball games imply bullpen stress -- a proxy for pitcher
  // fatigue that the CV survey identifies as a key injury-prevention signal.
  // These signals surface for coach (game-plan) and scout (prospect evaluation)
  // modes across MLB and college baseball.
  for (const game of games) {
    const isBaseball = game.sport === 'mlb' || game.sport === 'd1bb';
    if (!isBaseball) continue;

    const totalRuns = game.home.score + game.away.score;

    // High-scoring game -> bullpen taxed
    if (game.status === 'final' && totalRuns >= 15) {
      signals.push({
        id: `sig-bullpen-${game.id}`,
        text: `Bullpen alert: ${game.away.abbreviation || game.away.name} @ ${game.home.abbreviation || game.home.name} combined for ${totalRuns} runs. Both staffs taxed -- monitor tomorrow's arms.`,
        sport: game.sport,
        priority: 'medium',
        type: 'INJURY',
        modes: ['coach', 'scout'],
        gameId: game.id,
        teamTags: [game.home.abbreviation, game.away.abbreviation].filter(Boolean),
        timestamp: 'Final',
      });
      idx++;
    }

    // Extra innings -> workload spike (live or final)
    if (game.statusDetail && /extra|1[0-9]th|2[0-9]th/i.test(game.statusDetail)) {
      signals.push({
        id: `sig-extras-${game.id}`,
        text: `Extra innings: ${game.away.abbreviation || game.away.name} @ ${game.home.abbreviation || game.home.name} (${game.statusDetail}). Extended workload for both pitching staffs.`,
        sport: game.sport,
        priority: 'medium',
        type: 'INJURY',
        modes: ['coach', 'scout'],
        gameId: game.id,
        teamTags: [game.home.abbreviation, game.away.abbreviation].filter(Boolean),
        timestamp: game.status === 'live' ? 'Live' : 'Final',
      });
      idx++;
    }

    // Shutout -> dominant pitching performance (scout interest)
    if (game.status === 'final') {
      const loser = game.home.score < game.away.score ? game.home : game.away;
      const winner = game.home.score < game.away.score ? game.away : game.home;
      if (loser.score === 0 && winner.score > 0) {
        signals.push({
          id: `sig-shutout-${game.id}`,
          text: `Shutout: ${winner.abbreviation || winner.name} blanks ${loser.abbreviation || loser.name} ${winner.score}-0. Staff dominance worth scouting.`,
          sport: game.sport,
          priority: 'medium',
          type: 'PROSPECT',
          modes: ['scout', 'fan'],
          gameId: game.id,
          teamTags: [winner.abbreviation, loser.abbreviation].filter(Boolean),
          timestamp: 'Final',
        });
        idx++;
      }
    }
  }

  // Standings-based signals
  for (const team of standings.slice(0, 3)) {
    const pct = team.winPct ?? (team.wins / Math.max(team.wins + team.losses, 1));
    if (pct > 0.65) {
      signals.push({
        id: `sig-standing-${team.teamName}`,
        text: `${team.teamName}: ${team.wins}-${team.losses} (.${Math.round(pct * 1000)}). Top of the standings.`,
        sport: games[0]?.sport ?? 'nba',
        priority: 'low',
        type: 'TREND',
        modes: ['fan', 'scout'],
        teamTags: [team.abbreviation || team.teamName.split(' ').pop() || ''],
        timestamp: 'Season',
      });
    }
  }

  // Filter by mode
  return signals
    .filter((s) => s.modes.includes(mode))
    .sort((a, b) => {
      const order: Record<string, number> = { high: 0, medium: 1, low: 2 };
      return (order[a.priority] ?? 2) - (order[b.priority] ?? 2);
    });
}
