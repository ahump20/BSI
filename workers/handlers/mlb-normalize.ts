/**
 * MLB Game Detail Normalization
 *
 * Converts raw ESPN and SDIO transform outputs into the canonical
 * BaseballGameData shape that the frontend expects:
 *
 *   game.teams.{away,home}   — team info + score
 *   game.status              — structured status
 *   game.linescore           — inning-by-inning + totals
 *   game.boxscore.{away,home}.{batting,pitching} — player stats
 *
 * Without this layer, raw API structures leak through and the
 * GameSummaryClient silently renders nothing.
 */

// ── Helpers ──────────────────────────────────────────────────────────────────

type Rec = Record<string, unknown>;

function asRec(v: unknown): Rec {
  return typeof v === 'object' && v !== null ? (v as Rec) : {};
}

function asArr(v: unknown): Rec[] {
  return Array.isArray(v) ? (v as Rec[]) : [];
}

function str(v: unknown, fallback = ''): string {
  return typeof v === 'string' ? v : fallback;
}

function num(v: unknown, fallback = 0): number {
  const n = Number(v);
  return isNaN(n) ? fallback : n;
}

// ── ESPN Boxscore Normalization ─────────────────────────────────────────────

interface BattingStat {
  player: { id: string; name: string; position: string };
  ab: number; r: number; h: number; rbi: number;
  bb: number; so: number; avg: string;
}

interface PitchingStat {
  player: { id: string; name: string };
  decision?: string;
  ip: string; h: number; r: number; er: number;
  bb: number; so: number; pitches?: number;
  strikes?: number; era: string;
}

interface TeamBoxscore {
  batting: BattingStat[];
  pitching: PitchingStat[];
}

interface NormalizedBoxscore {
  away: TeamBoxscore;
  home: TeamBoxscore;
}

/**
 * Parse ESPN boxscore.players[] into canonical batting/pitching arrays.
 *
 * ESPN shape: boxscore.players[i].statistics[j] where
 *   j.name = "batting" | "pitching"
 *   j.keys = ["ab", "r", "h", ...] (column headers)
 *   j.athletes[k].stats = ["4", "1", "2", ...] (string values)
 */
function parseEspnBoxscorePlayers(
  players: Rec[],
  competitors: Rec[],
): NormalizedBoxscore {
  const result: NormalizedBoxscore = {
    away: { batting: [], pitching: [] },
    home: { batting: [], pitching: [] },
  };

  // Build team→side mapping from competitors
  const teamSideMap = new Map<string, 'away' | 'home'>();
  for (const comp of competitors) {
    const team = asRec(comp.team);
    const id = str(team.id);
    const side = comp.homeAway === 'home' ? 'home' : 'away';
    if (id) teamSideMap.set(id, side);
  }

  for (const playerGroup of players) {
    const team = asRec(playerGroup.team);
    const teamId = str(team.id);
    const side = teamSideMap.get(teamId)
      ?? (playerGroup.homeAway === 'home' ? 'home' : 'away');
    const statistics = asArr(playerGroup.statistics);

    for (const statGroup of statistics) {
      const groupName = str(statGroup.name).toLowerCase();
      const keys = asArr(statGroup.keys).map((k) => str(k).toLowerCase());
      const athletes = asArr(statGroup.athletes);

      if (groupName === 'batting') {
        for (const entry of athletes) {
          const athlete = asRec(entry.athlete);
          const stats = asArr(entry.stats);
          const idx = (key: string) => keys.indexOf(key);

          result[side].batting.push({
            player: {
              id: str(athlete.id),
              name: str(athlete.displayName),
              position: str(asRec(athlete.position).abbreviation),
            },
            ab: num(stats[idx('ab')]),
            r: num(stats[idx('r')]),
            h: num(stats[idx('h')]),
            rbi: num(stats[idx('rbi')]),
            bb: num(stats[idx('bb')]),
            so: num(stats[idx('so')] ?? stats[idx('k')]),
            avg: str(stats[idx('avg')] as unknown, '.000'),
          });
        }
      }

      if (groupName === 'pitching') {
        for (const entry of athletes) {
          const athlete = asRec(entry.athlete);
          const stats = asArr(entry.stats);
          const idx = (key: string) => keys.indexOf(key);

          // Extract decision from note field: "W (5-2)", "L (3-4)", "S (15)"
          const note = str(entry.note);
          let decision: string | undefined;
          if (note.startsWith('W')) decision = 'W';
          else if (note.startsWith('L')) decision = 'L';
          else if (note.startsWith('S')) decision = 'S';

          result[side].pitching.push({
            player: {
              id: str(athlete.id),
              name: str(athlete.displayName),
            },
            decision,
            ip: str(stats[idx('ip')] as unknown, '0.0'),
            h: num(stats[idx('h')]),
            r: num(stats[idx('r')]),
            er: num(stats[idx('er')]),
            bb: num(stats[idx('bb')]),
            so: num(stats[idx('so')] ?? stats[idx('k')]),
            pitches: num(stats[idx('pc')] ?? stats[idx('pitches')]) || undefined,
            strikes: num(stats[idx('st')] ?? stats[idx('strikes')]) || undefined,
            era: str(stats[idx('era')] as unknown, '0.00'),
          });
        }
      }
    }
  }

  return result;
}

/**
 * Parse SDIO PlayerGames[] into canonical batting/pitching arrays.
 */
function parseSDIOPlayerGames(playerGames: Rec[]): NormalizedBoxscore {
  const result: NormalizedBoxscore = {
    away: { batting: [], pitching: [] },
    home: { batting: [], pitching: [] },
  };

  for (const pg of playerGames) {
    const side: 'away' | 'home' = str(pg.HomeOrAway).toUpperCase() === 'HOME' ? 'home' : 'away';
    const playerName = str(pg.Name) || `${str(pg.FirstName)} ${str(pg.LastName)}`.trim();
    const playerId = str(pg.PlayerID);
    const position = str(pg.Position);

    const ab = num(pg.AtBats);
    if (ab > 0 || num(pg.Walks) > 0 || num(pg.HitByPitch) > 0) {
      result[side].batting.push({
        player: { id: playerId, name: playerName, position },
        ab,
        r: num(pg.Runs),
        h: num(pg.Hits),
        rbi: num(pg.RunsBattedIn),
        bb: num(pg.Walks),
        so: num(pg.Strikeouts),
        avg: num(pg.BattingAverage) > 0 ? `.${Math.round(num(pg.BattingAverage) * 1000)}` : '.000',
      });
    }

    const ipRaw = pg.InningsPitchedFull ?? pg.InningsPitchedDecimal ?? pg.InningsPitched;
    if (ipRaw != null && num(ipRaw) > 0) {
      let decision: string | undefined;
      if (pg.Win === true || pg.Win === 1) decision = 'W';
      else if (pg.Loss === true || pg.Loss === 1) decision = 'L';
      else if (pg.Save === true || pg.Save === 1) decision = 'S';

      result[side].pitching.push({
        player: { id: playerId, name: playerName },
        decision,
        ip: String(ipRaw),
        h: num(pg.HitsAllowed ?? pg.Hits),
        r: num(pg.RunsAllowed ?? pg.Runs),
        er: num(pg.EarnedRuns),
        bb: num(pg.WalksAllowed ?? pg.Walks),
        so: num(pg.StrikeoutsThrown ?? pg.Strikeouts),
        pitches: num(pg.PitchCount ?? pg.Pitches) || undefined,
        strikes: num(pg.Strikes) || undefined,
        era: num(pg.EarnedRunAverage) > 0 ? num(pg.EarnedRunAverage).toFixed(2) : '0.00',
      });
    }
  }

  return result;
}

// ── Full Game Normalization ─────────────────────────────────────────────────

/**
 * Normalize a raw transform result (ESPN or SDIO) into BaseballGameData.
 *
 * Input:  { game: { id, status, competitors, boxscore, ... }, meta }
 * Output: { game: { id, date, status, teams, linescore, boxscore, ... }, meta }
 */
export function normalizeMLBGamePayload(payload: Rec): Rec {
  const rawGame = asRec(payload.game);
  if (!rawGame.id && !rawGame.competitors) return payload;

  // If already normalized (has teams.away), pass through
  const existingTeams = asRec(rawGame.teams);
  if (existingTeams.away && existingTeams.home) return payload;

  const competitors = asArr(rawGame.competitors);
  const homeComp = competitors.find((c) => c.homeAway === 'home') ?? competitors[1] ?? {};
  const awayComp = competitors.find((c) => c.homeAway === 'away') ?? competitors[0] ?? {};

  const homeTeamRaw = asRec(homeComp.team ?? homeComp);
  const awayTeamRaw = asRec(awayComp.team ?? awayComp);

  const homeScore = num(homeComp.score);
  const awayScore = num(awayComp.score);

  // ── Status ──
  const rawStatus = asRec(rawGame.status);
  const statusType = asRec(rawStatus.type);
  const stateStr = str(statusType.state ?? statusType.name).toLowerCase();
  const isLive = stateStr === 'in';
  const isFinal = stateStr === 'post' || statusType.completed === true;
  const detailedState = str(
    statusType.shortDetail ?? statusType.detail ?? statusType.description ?? rawStatus.detailedState,
    isFinal ? 'Final' : isLive ? 'In Progress' : 'Scheduled',
  );

  // ── Teams ──
  const teams = {
    away: {
      name: str(awayTeamRaw.displayName ?? awayTeamRaw.name, 'Away'),
      abbreviation: str(awayTeamRaw.abbreviation, 'AWY'),
      score: awayScore,
      isWinner: isFinal && awayScore > homeScore,
      record: str(awayTeamRaw.record),
    },
    home: {
      name: str(homeTeamRaw.displayName ?? homeTeamRaw.name, 'Home'),
      abbreviation: str(homeTeamRaw.abbreviation, 'HME'),
      score: homeScore,
      isWinner: isFinal && homeScore > awayScore,
      record: str(homeTeamRaw.record),
    },
  };

  // ── Linescore ──
  let linescore: Rec | undefined;

  // ESPN-style: competitors[].linescores[]
  const homeLinescores = asArr(homeComp.linescores);
  const awayLinescores = asArr(awayComp.linescores);
  if (homeLinescores.length > 0 || awayLinescores.length > 0) {
    const maxInnings = Math.max(homeLinescores.length, awayLinescores.length);
    const innings: Array<{ away: number; home: number }> = [];
    const awayTotals = { runs: 0, hits: 0, errors: 0 };
    const homeTotals = { runs: 0, hits: 0, errors: 0 };

    for (let i = 0; i < maxInnings; i++) {
      const awayInning = num(awayLinescores[i]?.value ?? awayLinescores[i]?.runs);
      const homeInning = num(homeLinescores[i]?.value ?? homeLinescores[i]?.runs);
      innings.push({ away: awayInning, home: homeInning });
      awayTotals.runs += awayInning;
      homeTotals.runs += homeInning;
    }

    // Team-level stats from boxscore.teams[]
    const boxscoreTeams = asArr(asRec(rawGame.boxscore).teams);
    for (const bt of boxscoreTeams) {
      const side = bt.homeAway === 'home' ? 'home' : 'away';
      const teamStats = asArr(bt.statistics);
      for (const s of teamStats) {
        const name = str(s.name).toLowerCase();
        const val = num(s.displayValue ?? s.value);
        if (side === 'home') {
          if (name === 'hits') homeTotals.hits = val;
          if (name === 'errors') homeTotals.errors = val;
          if (name === 'runs') homeTotals.runs = val;
        } else {
          if (name === 'hits') awayTotals.hits = val;
          if (name === 'errors') awayTotals.errors = val;
          if (name === 'runs') awayTotals.runs = val;
        }
      }
    }

    if (awayTotals.runs === 0 && awayScore > 0) awayTotals.runs = awayScore;
    if (homeTotals.runs === 0 && homeScore > 0) homeTotals.runs = homeScore;

    linescore = { innings, totals: { away: awayTotals, home: homeTotals } };
  }

  // SDIO-style: boxscore.innings[]
  const rawBoxscore = asRec(rawGame.boxscore);
  const sdioInnings = asArr(rawBoxscore.innings);
  if (!linescore && sdioInnings.length > 0) {
    const innings: Array<{ away: number; home: number }> = [];
    for (const inn of sdioInnings) {
      innings.push({ away: num(inn.AwayTeamRuns), home: num(inn.HomeTeamRuns) });
    }
    linescore = {
      innings,
      totals: {
        away: { runs: awayScore, hits: 0, errors: 0 },
        home: { runs: homeScore, hits: 0, errors: 0 },
      },
    };
  }

  // ── Boxscore (batting + pitching) ──
  let boxscore: NormalizedBoxscore | undefined;
  const boxscorePlayers = asArr(rawBoxscore.players);

  if (boxscorePlayers.length > 0) {
    const firstPlayer = boxscorePlayers[0];
    if (firstPlayer.statistics && Array.isArray(firstPlayer.statistics)) {
      boxscore = parseEspnBoxscorePlayers(boxscorePlayers, competitors);
    } else if (firstPlayer.PlayerID != null || firstPlayer.HomeOrAway != null) {
      boxscore = parseSDIOPlayerGames(boxscorePlayers);
    }
  }

  // ── Venue ──
  const rawVenue = asRec(rawGame.venue);
  const venue = {
    name: str(rawVenue.fullName ?? rawVenue.name, 'TBD'),
    city: str(rawVenue.city),
    state: str(rawVenue.state),
  };

  // ── Assemble ──
  return {
    game: {
      id: rawGame.id ?? rawGame.gameId,
      date: str(rawGame.date ?? rawGame.gameDate, new Date().toISOString()),
      status: {
        state: stateStr || 'pre',
        detailedState,
        inning: num(rawStatus.period) || undefined,
        inningState: str(rawStatus.inningState) || undefined,
        isLive,
        isFinal,
      },
      teams,
      venue,
      linescore: linescore ?? undefined,
      boxscore: boxscore ?? undefined,
      plays: rawGame.plays ?? [],
      leaders: rawGame.leaders ?? [],
      winProbability: rawGame.winProbability ?? [],
    },
    meta: payload.meta,
  };
}
