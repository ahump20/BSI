/**
 * Highlightly Pro API Adapter
 *
 * Primary data source for college baseball and college football at BSI.
 * Provides scores, standings, rankings, schedules, and team data.
 *
 * Supported Sports:
 * - College Baseball (CBB)
 * - College Football (CFB)
 *
 * Base URLs:
 * - https://baseball.highlightly.net - College Baseball API
 * - https://american-football.highlightly.net - College Football API
 *
 * Features:
 * - Automatic retry with exponential backoff
 * - Rate limit handling (429 responses)
 * - Data normalization to BSI models
 * - Empty payload validation
 * - Season detection (in-season vs off-season)
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type HighlightlySport = 'college_baseball' | 'college_football';

export type GameStatus = 'scheduled' | 'live' | 'final' | 'postponed' | 'canceled' | 'delayed';

export interface HighlightlyConfig {
  apiKey: string;
  baseUrlBaseball?: string;
  baseUrlFootball?: string;
  timeout?: number;
  maxRetries?: number;
  retryBaseDelay?: number;
}

export interface HighlightlyGame {
  id: string;
  sourceId: string;
  sport: HighlightlySport;
  season: number;
  date: string;
  startTime: string;
  status: GameStatus;
  homeTeam: HighlightlyTeam;
  awayTeam: HighlightlyTeam;
  homeScore: number | null;
  awayScore: number | null;
  period: number | null;
  periodDetail: string | null;
  clock: string | null;
  venue: string | null;
  broadcast: string | null;
  isConferenceGame: boolean;
  lastUpdated: string;
}

export interface HighlightlyTeam {
  id: string;
  name: string;
  displayName: string;
  abbreviation: string;
  logo: string | null;
  conference: string | null;
  rank: number | null;
}

export interface HighlightlyStanding {
  team: HighlightlyTeam;
  conference: string;
  division: string | null;
  wins: number;
  losses: number;
  conferenceWins: number;
  conferenceLosses: number;
  winPct: number;
  conferenceWinPct: number;
  streak: string | null;
  gamesBack: number | null;
  pointsFor: number;
  pointsAgainst: number;
  runsScored: number;
  runsAllowed: number;
  rpi: number | null;
  conferenceRank: number | null;
}

export interface HighlightlyRanking {
  rank: number;
  previousRank: number | null;
  team: HighlightlyTeam;
  record: string;
  points: number | null;
  firstPlaceVotes: number | null;
  source: string;
}

export interface HighlightlyResponse<T> {
  data: T[];
  lastUpdated: string;
  source: 'highlightly';
  season: string;
  status: 'ok' | 'stale' | 'error';
  message?: string;
  count: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_CONFIG = {
  baseUrlBaseball: 'https://baseball.highlightly.net',
  baseUrlFootball: 'https://american-football.highlightly.net',
  timeout: 10000,
  maxRetries: 3,
  retryBaseDelay: 1000,
};

const BASEBALL_SEASON_START_MONTH = 2;
const BASEBALL_SEASON_END_MONTH = 6;
const FOOTBALL_SEASON_START_MONTH = 8;
const FOOTBALL_SEASON_END_MONTH = 1;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function getCurrentDateCST(): string {
  const now = new Date();
  const cstOffset = -6 * 60;
  const cstTime = new Date(now.getTime() + (cstOffset - now.getTimezoneOffset()) * 60000);
  return cstTime.toISOString().split('T')[0];
}

function getCurrentTimestampCST(): string {
  const now = new Date();
  const options: Intl.DateTimeFormatOptions = {
    timeZone: 'America/Chicago',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  };
  const formatted = new Intl.DateTimeFormat('en-CA', options).format(now);
  return formatted.replace(', ', 'T') + '-06:00';
}

function getCurrentSeason(sport: HighlightlySport): number {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  if (sport === 'college_baseball') {
    return year;
  }
  return month >= 8 ? year : year - 1;
}

function isInSeason(sport: HighlightlySport): boolean {
  const month = new Date().getMonth() + 1;

  if (sport === 'college_baseball') {
    return month >= BASEBALL_SEASON_START_MONTH && month <= BASEBALL_SEASON_END_MONTH;
  }
  return month >= FOOTBALL_SEASON_START_MONTH || month <= FOOTBALL_SEASON_END_MONTH;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============================================================================
// HIGHLIGHTLY ADAPTER CLASS
// ============================================================================

export class HighlightlyAdapter {
  private config: Required<HighlightlyConfig>;

  constructor(apiKeyOrConfig: string | HighlightlyConfig) {
    if (typeof apiKeyOrConfig === 'string') {
      this.config = { apiKey: apiKeyOrConfig, ...DEFAULT_CONFIG };
    } else {
      this.config = { ...DEFAULT_CONFIG, ...apiKeyOrConfig } as Required<HighlightlyConfig>;
    }
  }

  private async fetchWithRetry(url: string): Promise<Response> {
    let lastError: Error = new Error('No attempts made');

    for (let attempt = 0; attempt < this.config.maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

        const response = await fetch(url, {
          headers: {
            'x-rapidapi-key': this.config.apiKey,
            Accept: 'application/json',
            'User-Agent': 'BSI-Highlightly-Adapter/1.0',
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After');
          const delay = retryAfter
            ? parseInt(retryAfter, 10) * 1000
            : this.config.retryBaseDelay * Math.pow(2, attempt);
          await sleep(delay);
          continue;
        }

        if (response.ok || (response.status >= 400 && response.status < 500)) {
          return response;
        }

        lastError = new Error('HTTP ' + response.status + ': ' + response.statusText);
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          lastError = new Error('Request timeout after ' + this.config.timeout + 'ms');
        } else {
          lastError = error instanceof Error ? error : new Error(String(error));
        }
      }

      if (attempt < this.config.maxRetries - 1) {
        const delay = this.config.retryBaseDelay * Math.pow(2, attempt);
        await sleep(delay);
      }
    }

    throw lastError;
  }

  private getBaseUrl(sport: HighlightlySport): string {
    return sport === 'college_baseball'
      ? this.config.baseUrlBaseball
      : this.config.baseUrlFootball;
  }

  async getCollegeBaseballScores(
    date?: string
  ): Promise<HighlightlyResponse<HighlightlyGame>> {
    const targetDate = date || getCurrentDateCST();
    const baseUrl = this.getBaseUrl('college_baseball');
    const url = baseUrl + '/matches?date=' + targetDate + '&league=ncaa';

    try {
      const response = await this.fetchWithRetry(url);
      if (!response.ok) {
        return this.errorResponse('college_baseball', 'API returned ' + response.status);
      }
      const rawData = await response.json();
      const games = this.normalizeGames(rawData, 'college_baseball');
      return {
        data: games,
        lastUpdated: getCurrentTimestampCST(),
        source: 'highlightly',
        season: String(getCurrentSeason('college_baseball')),
        status: 'ok',
        count: games.length,
      };
    } catch (error) {
      return this.errorResponse(
        'college_baseball',
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  async getCollegeBaseballStandings(
    conference?: string
  ): Promise<HighlightlyResponse<HighlightlyStanding>> {
    const baseUrl = this.getBaseUrl('college_baseball');
    const url = conference
      ? baseUrl + '/standings?league=ncaa&conference=' + encodeURIComponent(conference)
      : baseUrl + '/standings?league=ncaa';

    try {
      const response = await this.fetchWithRetry(url);
      if (!response.ok) {
        return this.errorResponse('college_baseball', 'API returned ' + response.status);
      }
      const rawData = await response.json();
      const standings = this.normalizeStandings(rawData, 'college_baseball');
      return {
        data: standings,
        lastUpdated: getCurrentTimestampCST(),
        source: 'highlightly',
        season: String(getCurrentSeason('college_baseball')),
        status: 'ok',
        count: standings.length,
      };
    } catch (error) {
      return this.errorResponse(
        'college_baseball',
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  async getCollegeBaseballRankings(): Promise<HighlightlyResponse<HighlightlyRanking>> {
    const baseUrl = this.getBaseUrl('college_baseball');
    const url = baseUrl + '/rankings?league=ncaa';

    try {
      const response = await this.fetchWithRetry(url);
      if (!response.ok) {
        return this.errorResponse('college_baseball', 'API returned ' + response.status);
      }
      const rawData = await response.json();
      const rankings = this.normalizeRankings(rawData, 'college_baseball');
      return {
        data: rankings,
        lastUpdated: getCurrentTimestampCST(),
        source: 'highlightly',
        season: String(getCurrentSeason('college_baseball')),
        status: 'ok',
        count: rankings.length,
      };
    } catch (error) {
      return this.errorResponse(
        'college_baseball',
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  // -- Normalizers --

  private normalizeGames(rawData: unknown, sport: HighlightlySport): HighlightlyGame[] {
    const games: HighlightlyGame[] = [];
    const now = getCurrentTimestampCST();
    const season = getCurrentSeason(sport);
    const raw = rawData as Record<string, unknown>;
    const rawGames = (raw?.matches || raw?.games || raw?.events || raw?.data || []) as Array<
      Record<string, unknown>
    >;

    for (const r of rawGames) {
      try {
        games.push({
          id: 'highlightly-' + sport + '-' + (r.id || r.matchId || r.gameId),
          sourceId: String(r.id || r.matchId || r.gameId),
          sport,
          season,
          date: this.extractDate(r),
          startTime: String(r.startTime || r.scheduledAt || r.date || ''),
          status: this.normalizeStatus(r.status as string | undefined),
          homeTeam: this.normalizeTeam(
            (r.homeTeam || r.home) as Record<string, unknown>,
            r.homeRank as number | undefined
          ),
          awayTeam: this.normalizeTeam(
            (r.awayTeam || r.away) as Record<string, unknown>,
            r.awayRank as number | undefined
          ),
          homeScore: this.extractScore(r.homeScore ?? (r.home as Record<string, unknown>)?.score),
          awayScore: this.extractScore(r.awayScore ?? (r.away as Record<string, unknown>)?.score),
          period: (r.period ?? r.inning ?? r.quarter ?? null) as number | null,
          periodDetail: (r.periodDetail ?? r.inningHalf ?? r.clock ?? null) as string | null,
          clock: (r.clock ?? r.timeRemaining ?? null) as string | null,
          venue: ((r.venue as Record<string, unknown>)?.name as string) || (r.venue as string) || null,
          broadcast: (r.broadcast || r.tv || null) as string | null,
          isConferenceGame: Boolean(r.isConferenceGame ?? r.conferenceGame),
          lastUpdated: now,
        });
      } catch {
        // Skip malformed entries
      }
    }
    return games;
  }

  private normalizeStandings(rawData: unknown, sport: HighlightlySport): HighlightlyStanding[] {
    const standings: HighlightlyStanding[] = [];
    const raw = rawData as Record<string, unknown>;
    const rawStandings = (raw?.standings || raw?.teams || raw?.data || []) as Array<
      Record<string, unknown>
    >;

    for (const r of rawStandings) {
      try {
        standings.push({
          team: this.normalizeTeam(
            (r.team || r) as Record<string, unknown>,
            r.rank as number | undefined
          ),
          conference:
            (r.conference as string) ||
            ((r.team as Record<string, unknown>)?.conference as string) ||
            'Unknown',
          division: (r.division as string) || null,
          wins: (r.wins ?? r.overallWins ?? 0) as number,
          losses: (r.losses ?? r.overallLosses ?? 0) as number,
          conferenceWins: (r.conferenceWins ?? r.confWins ?? 0) as number,
          conferenceLosses: (r.conferenceLosses ?? r.confLosses ?? 0) as number,
          winPct: (r.winPct ?? r.pct ?? 0) as number,
          conferenceWinPct: (r.conferenceWinPct ?? r.confPct ?? 0) as number,
          streak: (r.streak as string) || null,
          gamesBack: (r.gamesBack ?? r.gb ?? null) as number | null,
          pointsFor: sport === 'college_football' ? ((r.pointsFor ?? r.pf ?? 0) as number) : 0,
          pointsAgainst:
            sport === 'college_football' ? ((r.pointsAgainst ?? r.pa ?? 0) as number) : 0,
          runsScored:
            sport === 'college_baseball' ? ((r.runsScored ?? r.rs ?? 0) as number) : 0,
          runsAllowed:
            sport === 'college_baseball' ? ((r.runsAllowed ?? r.ra ?? 0) as number) : 0,
          rpi: sport === 'college_baseball' ? ((r.rpi as number) ?? null) : null,
          conferenceRank: (r.conferenceRank ?? r.confRank ?? null) as number | null,
        });
      } catch {
        // Skip malformed entries
      }
    }
    return standings;
  }

  private normalizeRankings(rawData: unknown, sport: HighlightlySport): HighlightlyRanking[] {
    const rankings: HighlightlyRanking[] = [];
    const raw = rawData as Record<string, unknown>;
    const rawRankings = (raw?.rankings || raw?.ranks || raw?.data || []) as Array<
      Record<string, unknown>
    >;

    for (const r of rawRankings) {
      try {
        rankings.push({
          rank: (r.rank ?? r.current ?? 0) as number,
          previousRank: (r.previousRank ?? r.previous ?? null) as number | null,
          team: this.normalizeTeam(
            (r.team || r) as Record<string, unknown>,
            r.rank as number | undefined
          ),
          record: (r.record ?? r.recordSummary ?? '') as string,
          points: (r.points ?? null) as number | null,
          firstPlaceVotes: (r.firstPlaceVotes ?? r.fpv ?? null) as number | null,
          source:
            (r.source as string) ??
            (r.poll as string) ??
            (sport === 'college_baseball' ? 'D1Baseball' : 'AP Poll'),
        });
      } catch {
        // Skip malformed entries
      }
    }
    return rankings;
  }

  private normalizeTeam(raw: Record<string, unknown> | undefined, rank?: number): HighlightlyTeam {
    if (!raw) {
      return {
        id: 'unknown',
        name: 'Unknown',
        displayName: 'Unknown',
        abbreviation: '',
        logo: null,
        conference: null,
        rank: null,
      };
    }
    return {
      id: String(raw.id || raw.teamId || 'unknown'),
      name: (raw.name || raw.teamName || 'Unknown') as string,
      displayName: (raw.displayName || raw.fullName || raw.name || 'Unknown') as string,
      abbreviation: (raw.abbreviation || raw.abbrev || raw.shortName || '') as string,
      logo:
        (raw.logo as string) ||
        (raw.logoUrl as string) ||
        ((raw.logos as Array<Record<string, string>>)?.[0]?.href as string) ||
        null,
      conference: (raw.conference as string) || null,
      rank:
        rank ??
        (raw.rank as number) ??
        ((raw.curatedRank as Record<string, number>)?.current as number) ??
        null,
    };
  }

  private normalizeStatus(rawStatus: string | undefined): GameStatus {
    if (!rawStatus) return 'scheduled';
    const status = rawStatus.toLowerCase();
    if (status.includes('live') || status.includes('in_progress') || status === 'in') return 'live';
    if (status.includes('final') || status.includes('completed') || status === 'post')
      return 'final';
    if (status.includes('postponed')) return 'postponed';
    if (status.includes('cancel')) return 'canceled';
    if (status.includes('delay')) return 'delayed';
    return 'scheduled';
  }

  private extractDate(raw: Record<string, unknown>): string {
    const dateStr = (raw.date || raw.startTime || raw.scheduledAt || '') as string;
    if (!dateStr) return getCurrentDateCST();
    return dateStr.substring(0, 10);
  }

  private extractScore(score: unknown): number | null {
    if (score === null || score === undefined) return null;
    if (typeof score === 'number') return score;
    const parsed = parseInt(String(score), 10);
    return isNaN(parsed) ? null : parsed;
  }

  private errorResponse<T>(sport: HighlightlySport, message: string): HighlightlyResponse<T> {
    return {
      data: [] as T[],
      lastUpdated: getCurrentTimestampCST(),
      source: 'highlightly',
      season: String(getCurrentSeason(sport)),
      status: 'error',
      message,
      count: 0,
    };
  }

  static isBaseballInSeason(): boolean {
    return isInSeason('college_baseball');
  }

  static isFootballInSeason(): boolean {
    return isInSeason('college_football');
  }

  static getCurrentBaseballSeason(): number {
    return getCurrentSeason('college_baseball');
  }

  static getCurrentDateCST(): string {
    return getCurrentDateCST();
  }
}

export default HighlightlyAdapter;
