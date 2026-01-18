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
 *
 * @author BSI Team
 * @created 2026-01-09
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
  } else {
    return month >= 8 ? year : year - 1;
  }
}

function isInSeason(sport: HighlightlySport): boolean {
  const month = new Date().getMonth() + 1;

  if (sport === 'college_baseball') {
    return month >= BASEBALL_SEASON_START_MONTH && month <= BASEBALL_SEASON_END_MONTH;
  } else {
    return month >= FOOTBALL_SEASON_START_MONTH || month <= FOOTBALL_SEASON_END_MONTH;
  }
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
      this.config = {
        apiKey: apiKeyOrConfig,
        ...DEFAULT_CONFIG,
      };
    } else {
      this.config = {
        ...DEFAULT_CONFIG,
        ...apiKeyOrConfig,
      } as Required<HighlightlyConfig>;
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
          console.warn(
            '[highlightly] Rate limited. Waiting ' + delay + 'ms before retry ' + (attempt + 1)
          );
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
        console.warn(
          '[highlightly] Retry ' +
            (attempt + 1) +
            '/' +
            this.config.maxRetries +
            ' in ' +
            delay +
            'ms'
        );
        await sleep(delay);
      }
    }

    throw lastError;
  }

  private getBaseUrl(sport: HighlightlySport): string {
    return sport === 'college_baseball' ? this.config.baseUrlBaseball : this.config.baseUrlFootball;
  }

  async getCollegeBaseballScores(date?: string): Promise<HighlightlyResponse<HighlightlyGame>> {
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
      console.error('[highlightly] College baseball scores fetch failed:', error);
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
      console.error('[highlightly] College baseball standings fetch failed:', error);
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
      console.error('[highlightly] College baseball rankings fetch failed:', error);
      return this.errorResponse(
        'college_baseball',
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  async getCollegeFootballScores(
    date?: string,
    week?: number
  ): Promise<HighlightlyResponse<HighlightlyGame>> {
    const baseUrl = this.getBaseUrl('college_football');
    let url = baseUrl + '/matches?league=ncaa';

    if (week) {
      url += '&week=' + week;
    } else if (date) {
      url += '&date=' + date;
    } else {
      url += '&date=' + getCurrentDateCST();
    }

    try {
      const response = await this.fetchWithRetry(url);

      if (!response.ok) {
        return this.errorResponse('college_football', 'API returned ' + response.status);
      }

      const rawData = await response.json();
      const games = this.normalizeGames(rawData, 'college_football');

      return {
        data: games,
        lastUpdated: getCurrentTimestampCST(),
        source: 'highlightly',
        season: String(getCurrentSeason('college_football')),
        status: 'ok',
        count: games.length,
      };
    } catch (error) {
      console.error('[highlightly] College football scores fetch failed:', error);
      return this.errorResponse(
        'college_football',
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  async getCollegeFootballStandings(
    conference?: string
  ): Promise<HighlightlyResponse<HighlightlyStanding>> {
    const baseUrl = this.getBaseUrl('college_football');
    const url = conference
      ? baseUrl + '/standings?league=ncaa&conference=' + encodeURIComponent(conference)
      : baseUrl + '/standings?league=ncaa';

    try {
      const response = await this.fetchWithRetry(url);

      if (!response.ok) {
        return this.errorResponse('college_football', 'API returned ' + response.status);
      }

      const rawData = await response.json();
      const standings = this.normalizeStandings(rawData, 'college_football');

      return {
        data: standings,
        lastUpdated: getCurrentTimestampCST(),
        source: 'highlightly',
        season: String(getCurrentSeason('college_football')),
        status: 'ok',
        count: standings.length,
      };
    } catch (error) {
      console.error('[highlightly] College football standings fetch failed:', error);
      return this.errorResponse(
        'college_football',
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  async getCollegeFootballRankings(): Promise<HighlightlyResponse<HighlightlyRanking>> {
    const baseUrl = this.getBaseUrl('college_football');
    const url = baseUrl + '/rankings?league=ncaa';

    try {
      const response = await this.fetchWithRetry(url);

      if (!response.ok) {
        return this.errorResponse('college_football', 'API returned ' + response.status);
      }

      const rawData = await response.json();
      const rankings = this.normalizeRankings(rawData, 'college_football');

      return {
        data: rankings,
        lastUpdated: getCurrentTimestampCST(),
        source: 'highlightly',
        season: String(getCurrentSeason('college_football')),
        status: 'ok',
        count: rankings.length,
      };
    } catch (error) {
      console.error('[highlightly] College football rankings fetch failed:', error);
      return this.errorResponse(
        'college_football',
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  private normalizeGames(rawData: any, sport: HighlightlySport): HighlightlyGame[] {
    const games: HighlightlyGame[] = [];
    const now = getCurrentTimestampCST();
    const season = getCurrentSeason(sport);

    const rawGames = rawData?.matches || rawData?.games || rawData?.events || rawData?.data || [];

    for (const raw of rawGames) {
      try {
        const game: HighlightlyGame = {
          id: 'highlightly-' + sport + '-' + (raw.id || raw.matchId || raw.gameId),
          sourceId: String(raw.id || raw.matchId || raw.gameId),
          sport,
          season,
          date: this.extractDate(raw),
          startTime: raw.startTime || raw.scheduledAt || raw.date || '',
          status: this.normalizeStatus(raw.status || raw.state),
          homeTeam: this.normalizeTeam(raw.homeTeam || raw.home, raw.homeRank),
          awayTeam: this.normalizeTeam(raw.awayTeam || raw.away, raw.awayRank),
          homeScore: this.extractScore(raw.homeScore ?? raw.home?.score),
          awayScore: this.extractScore(raw.awayScore ?? raw.away?.score),
          period: raw.period ?? raw.inning ?? raw.quarter ?? null,
          periodDetail: raw.periodDetail ?? raw.inningHalf ?? raw.clock ?? null,
          clock: raw.clock ?? raw.timeRemaining ?? null,
          venue: raw.venue?.name || raw.venue || null,
          broadcast: raw.broadcast || raw.tv || null,
          isConferenceGame: Boolean(raw.isConferenceGame ?? raw.conferenceGame),
          lastUpdated: now,
        };
        games.push(game);
      } catch (e) {
        console.warn('[highlightly] Failed to normalize game:', e);
      }
    }

    return games;
  }

  private normalizeStandings(rawData: any, sport: HighlightlySport): HighlightlyStanding[] {
    const standings: HighlightlyStanding[] = [];

    const rawStandings = rawData?.standings || rawData?.teams || rawData?.data || [];

    for (const raw of rawStandings) {
      try {
        const standing: HighlightlyStanding = {
          team: this.normalizeTeam(raw.team || raw, raw.rank),
          conference: raw.conference || raw.team?.conference || 'Unknown',
          division: raw.division || null,
          wins: raw.wins ?? raw.overallWins ?? 0,
          losses: raw.losses ?? raw.overallLosses ?? 0,
          conferenceWins: raw.conferenceWins ?? raw.confWins ?? 0,
          conferenceLosses: raw.conferenceLosses ?? raw.confLosses ?? 0,
          winPct: raw.winPct ?? raw.pct ?? 0,
          conferenceWinPct: raw.conferenceWinPct ?? raw.confPct ?? 0,
          streak: raw.streak || null,
          gamesBack: raw.gamesBack ?? raw.gb ?? null,
          pointsFor: sport === 'college_football' ? (raw.pointsFor ?? raw.pf ?? 0) : 0,
          pointsAgainst: sport === 'college_football' ? (raw.pointsAgainst ?? raw.pa ?? 0) : 0,
          runsScored: sport === 'college_baseball' ? (raw.runsScored ?? raw.rs ?? 0) : 0,
          runsAllowed: sport === 'college_baseball' ? (raw.runsAllowed ?? raw.ra ?? 0) : 0,
          rpi: sport === 'college_baseball' ? (raw.rpi ?? null) : null,
          conferenceRank: raw.conferenceRank ?? raw.confRank ?? null,
        };
        standings.push(standing);
      } catch (e) {
        console.warn('[highlightly] Failed to normalize standing:', e);
      }
    }

    return standings;
  }

  private normalizeRankings(rawData: any, sport: HighlightlySport): HighlightlyRanking[] {
    const rankings: HighlightlyRanking[] = [];

    const rawRankings = rawData?.rankings || rawData?.ranks || rawData?.data || [];

    for (const raw of rawRankings) {
      try {
        const ranking: HighlightlyRanking = {
          rank: raw.rank ?? raw.current ?? 0,
          previousRank: raw.previousRank ?? raw.previous ?? null,
          team: this.normalizeTeam(raw.team || raw, raw.rank),
          record: raw.record ?? raw.recordSummary ?? '',
          points: raw.points ?? null,
          firstPlaceVotes: raw.firstPlaceVotes ?? raw.fpv ?? null,
          source:
            raw.source ?? raw.poll ?? (sport === 'college_baseball' ? 'D1Baseball' : 'AP Poll'),
        };
        rankings.push(ranking);
      } catch (e) {
        console.warn('[highlightly] Failed to normalize ranking:', e);
      }
    }

    return rankings;
  }

  private normalizeTeam(raw: any, rank?: number): HighlightlyTeam {
    return {
      id: String(raw?.id || raw?.teamId || 'unknown'),
      name: raw?.name || raw?.teamName || 'Unknown',
      displayName: raw?.displayName || raw?.fullName || raw?.name || 'Unknown',
      abbreviation: raw?.abbreviation || raw?.abbrev || raw?.shortName || '',
      logo: raw?.logo || raw?.logoUrl || raw?.logos?.[0]?.href || null,
      conference: raw?.conference || null,
      rank: rank ?? raw?.rank ?? raw?.curatedRank?.current ?? null,
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

  private extractDate(raw: any): string {
    const dateStr = raw.date || raw.startTime || raw.scheduledAt || '';
    if (!dateStr) return getCurrentDateCST();
    return dateStr.substring(0, 10);
  }

  private extractScore(score: any): number | null {
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

  static getCurrentFootballSeason(): number {
    return getCurrentSeason('college_football');
  }

  static getCurrentDateCST(): string {
    return getCurrentDateCST();
  }

  static getCurrentTimestampCST(): string {
    return getCurrentTimestampCST();
  }
}

export default HighlightlyAdapter;
