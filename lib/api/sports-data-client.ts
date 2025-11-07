/**
 * Blaze Sports Intel - Real Sports Data Integration Client
 * Professional-grade API client with retry logic, caching, and error handling
 *
 * Data Sources:
 * - MaxPreps: High school football rankings
 * - Perfect Game: Youth baseball data
 * - Athletic.net: Track & field results
 * - ESPN API: Live scores and stats
 */

export interface SportsDataConfig {
  maxPrepsApiKey?: string;
  perfectGameApiKey?: string;
  athleticNetApiKey?: string;
  espnApiKey?: string;
  cacheTTL?: number;
  retryAttempts?: number;
  retryDelay?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  cached?: boolean;
  timestamp: string;
  source: string;
}

export interface Team {
  id: string;
  name: string;
  school: string;
  city: string;
  state: string;
  classification: string;
  record: {
    wins: number;
    losses: number;
    ties?: number;
  };
  ranking?: number;
  rating?: number;
}

export interface Player {
  id: string;
  name: string;
  position: string;
  jerseyNumber?: string;
  year: string;
  stats: Record<string, number | string>;
  collegeCommitment?: string;
}

export interface GameScore {
  id: string;
  homeTeam: Team;
  awayTeam: Team;
  homeScore: number;
  awayScore: number;
  status: 'scheduled' | 'in_progress' | 'final';
  quarter?: string;
  timeRemaining?: string;
  venue?: string;
  date: string;
}

export class SportsDataClient {
  private config: Required<SportsDataConfig>;
  private cache: Map<string, { data: any; expires: number }>;

  constructor(config: SportsDataConfig = {}) {
    this.config = {
      maxPrepsApiKey: config.maxPrepsApiKey || process.env.MAXPREPS_API_KEY || '',
      perfectGameApiKey: config.perfectGameApiKey || process.env.PERFECT_GAME_API_KEY || '',
      athleticNetApiKey: config.athleticNetApiKey || process.env.ATHLETIC_NET_API_KEY || '',
      espnApiKey: config.espnApiKey || process.env.ESPN_API_KEY || '',
      cacheTTL: config.cacheTTL || 300, // 5 minutes default
      retryAttempts: config.retryAttempts || 3,
      retryDelay: config.retryDelay || 1000, // 1 second
    };
    this.cache = new Map();
  }

  /**
   * Generic fetch with retry logic and exponential backoff
   */
  private async fetchWithRetry<T>(
    url: string,
    options: RequestInit = {},
    attempt: number = 1
  ): Promise<T> {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'User-Agent': 'BlazeSportsIntel/1.0',
          Accept: 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      if (attempt < this.config.retryAttempts) {
        const delay = this.config.retryDelay * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.fetchWithRetry<T>(url, options, attempt + 1);
      }
      throw error;
    }
  }

  /**
   * Get from cache or fetch fresh data
   */
  private async getCached<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number = this.config.cacheTTL
  ): Promise<{ data: T; cached: boolean }> {
    const cached = this.cache.get(key);
    const now = Date.now();

    if (cached && cached.expires > now) {
      return { data: cached.data, cached: true };
    }

    const data = await fetcher();
    this.cache.set(key, {
      data,
      expires: now + (ttl * 1000),
    });

    return { data, cached: false };
  }

  /**
   * Fetch MaxPreps football rankings
   */
  async getFootballRankings(
    state: string = 'TX',
    classification: string = '6A'
  ): Promise<ApiResponse<Team[]>> {
    const cacheKey = `maxpreps:football:${state}:${classification}`;

    try {
      const { data, cached } = await this.getCached(cacheKey, async () => {
        // MaxPreps API endpoint (actual endpoint would need to be confirmed)
        const url = `https://api.maxpreps.com/rankings/football?state=${state}&classification=${classification}`;

        return await this.fetchWithRetry<any>(url, {
          headers: {
            'X-API-Key': this.config.maxPrepsApiKey,
          },
        });
      });

      // Transform MaxPreps response to our Team format
      const teams: Team[] = (data.rankings || []).map((team: any) => ({
        id: team.id || team.teamId,
        name: team.name || team.mascot,
        school: team.school || team.schoolName,
        city: team.city,
        state: team.state,
        classification: team.classification || classification,
        record: {
          wins: team.wins || 0,
          losses: team.losses || 0,
          ties: team.ties || 0,
        },
        ranking: team.rank,
        rating: team.rating || this.calculateCompositeRating(team),
      }));

      return {
        success: true,
        data: teams,
        cached,
        timestamp: new Date().toISOString(),
        source: 'MaxPreps',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        source: 'MaxPreps',
      };
    }
  }

  /**
   * Fetch Perfect Game baseball rankings
   */
  async getBaseballRankings(
    state: string = 'TX',
    graduationYear?: number
  ): Promise<ApiResponse<Team[]>> {
    const cacheKey = `perfectgame:baseball:${state}:${graduationYear || 'all'}`;

    try {
      const { data, cached } = await this.getCached(cacheKey, async () => {
        // Perfect Game API endpoint
        const url = graduationYear
          ? `https://api.perfectgame.org/teams?state=${state}&grad_year=${graduationYear}`
          : `https://api.perfectgame.org/teams?state=${state}`;

        return await this.fetchWithRetry<any>(url, {
          headers: {
            Authorization: `Bearer ${this.config.perfectGameApiKey}`,
          },
        });
      });

      const teams: Team[] = (data.teams || []).map((team: any) => ({
        id: team.team_id,
        name: team.team_name,
        school: team.school_name,
        city: team.city,
        state: team.state,
        classification: team.age_division || 'HS',
        record: {
          wins: team.wins || 0,
          losses: team.losses || 0,
        },
        ranking: team.national_rank,
        rating: team.pg_rating,
      }));

      return {
        success: true,
        data: teams,
        cached,
        timestamp: new Date().toISOString(),
        source: 'Perfect Game',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        source: 'Perfect Game',
      };
    }
  }

  /**
   * Fetch Athletic.net track & field rankings
   */
  async getTrackFieldRankings(
    state: string = 'TX',
    gender: 'boys' | 'girls' = 'boys'
  ): Promise<ApiResponse<Team[]>> {
    const cacheKey = `athletic:track:${state}:${gender}`;

    try {
      const { data, cached } = await this.getCached(cacheKey, async () => {
        // Athletic.net API endpoint
        const url = `https://www.athletic.net/api/v1/School/GetSchoolRankings?state=${state}&gender=${gender}`;

        return await this.fetchWithRetry<any>(url, {
          headers: {
            'X-API-Key': this.config.athleticNetApiKey,
          },
        });
      });

      const teams: Team[] = (data.schools || []).map((school: any) => ({
        id: school.SchoolID.toString(),
        name: school.SchoolName,
        school: school.SchoolName,
        city: school.City,
        state: school.State,
        classification: school.Division || 'HS',
        record: {
          wins: school.MeetWins || 0,
          losses: 0, // Track doesn't use W/L
        },
        ranking: school.StateRank,
        rating: school.PowerRating,
      }));

      return {
        success: true,
        data: teams,
        cached,
        timestamp: new Date().toISOString(),
        source: 'Athletic.net',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        source: 'Athletic.net',
      };
    }
  }

  /**
   * Fetch ESPN live scores
   */
  async getLiveScores(sport: 'football' | 'basketball' | 'baseball'): Promise<ApiResponse<GameScore[]>> {
    const cacheKey = `espn:live:${sport}`;

    try {
      const { data, cached } = await this.getCached(
        cacheKey,
        async () => {
          const sportPaths = {
            football: 'college-football',
            basketball: 'mens-college-basketball',
            baseball: 'college-baseball',
          };

          const url = `https://site.api.espn.com/apis/site/v2/sports/${sportPaths[sport]}/scoreboard`;
          return await this.fetchWithRetry<any>(url);
        },
        30 // 30 second TTL for live scores
      );

      const games: GameScore[] = (data.events || []).map((event: any) => {
        const competition = event.competitions[0];
        const homeTeam = competition.competitors.find((c: any) => c.homeAway === 'home');
        const awayTeam = competition.competitors.find((c: any) => c.homeAway === 'away');

        return {
          id: event.id,
          homeTeam: this.transformESPNTeam(homeTeam),
          awayTeam: this.transformESPNTeam(awayTeam),
          homeScore: parseInt(homeTeam.score) || 0,
          awayScore: parseInt(awayTeam.score) || 0,
          status: competition.status.type.completed ? 'final' :
                  competition.status.type.state === 'in' ? 'in_progress' : 'scheduled',
          quarter: competition.status.period?.toString(),
          timeRemaining: competition.status.displayClock,
          venue: competition.venue?.fullName,
          date: event.date,
        };
      });

      return {
        success: true,
        data: games,
        cached,
        timestamp: new Date().toISOString(),
        source: 'ESPN',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        source: 'ESPN',
      };
    }
  }

  /**
   * Calculate composite rating using Blaze algorithm
   */
  private calculateCompositeRating(team: any): number {
    const performance = (team.wins / (team.wins + team.losses || 1)) * 40;
    const talent = (team.avg_player_rating || 75) * 0.3;
    const historical = (team.historical_success || 75) * 0.2;
    const strength = (team.sos || 75) * 0.1;

    return Math.round((performance + talent + historical + strength) * 10) / 10;
  }

  /**
   * Transform ESPN team data to our format
   */
  private transformESPNTeam(competitor: any): Team {
    return {
      id: competitor.team.id,
      name: competitor.team.displayName,
      school: competitor.team.name,
      city: competitor.team.location || '',
      state: '',
      classification: '',
      record: {
        wins: parseInt(competitor.records?.[0]?.summary?.split('-')[0]) || 0,
        losses: parseInt(competitor.records?.[0]?.summary?.split('-')[1]) || 0,
      },
      ranking: competitor.curatedRank?.current,
    };
  }

  /**
   * Clear cache manually
   */
  clearCache(pattern?: string): void {
    if (!pattern) {
      this.cache.clear();
      return;
    }

    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// Export singleton instance
export const sportsDataClient = new SportsDataClient();