/**
 * Blaze Sports Intel - Real Sports Data Integration
 * Using actual API keys from environment for live data
 *
 * API Sources:
 * - SportsDataIO: NFL, MLB, NBA, NCAA Basketball
 * - CollegeFootballData: NCAA Football rankings and stats
 * - TheOddsAPI: Live odds and betting data
 */

export interface RealSportsConfig {
  sportsDataIOKey: string;
  collegeFBDataKey: string;
  theOddsAPIKey: string;
}

export interface LiveGame {
  id: string;
  sport: 'football' | 'baseball' | 'basketball';
  homeTeam: {
    id: string;
    name: string;
    score: number;
    logo?: string;
  };
  awayTeam: {
    id: string;
    name: string;
    score: number;
    logo?: string;
  };
  status: 'scheduled' | 'in_progress' | 'final';
  quarter?: string;
  timeRemaining?: string;
  venue?: string;
  date: string;
}

export interface TeamRanking {
  rank: number;
  team: string;
  school: string;
  city: string;
  state: string;
  region: string;
  classification: string;
  record: string;
  wins: number;
  losses: number;
  winPct: number;
  rating: number;
  trend: number;
  lastGame?: {
    opponent: string;
    result: string;
    score: string;
    date: string;
  };
}

export class RealSportsDataClient {
  private config: RealSportsConfig;
  private cache: Map<string, { data: any; expires: number }>;

  constructor(config: RealSportsConfig) {
    this.config = config;
    this.cache = new Map();
  }

  /**
   * Fetch with retry logic and exponential backoff
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
      if (attempt < 3) {
        const delay = 1000 * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.fetchWithRetry<T>(url, options, attempt + 1);
      }
      throw error;
    }
  }

  /**
   * Get from cache or fetch fresh
   */
  private async getCached<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number = 300
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
   * Fetch NCAA Football Rankings from CollegeFootballData API
   */
  async getNCAAFootballRankings(year: number = 2025, week?: number): Promise<TeamRanking[]> {
    const cacheKey = `cfb:rankings:${year}:${week || 'latest'}`;

    const { data } = await this.getCached(cacheKey, async () => {
      const weekParam = week ? `&week=${week}` : '';
      const url = `https://api.collegefootballdata.com/rankings?year=${year}${weekParam}`;

      const response = await this.fetchWithRetry<any>(url, {
        headers: {
          Authorization: `Bearer ${this.config.collegeFBDataKey}`,
        },
      });

      return response;
    });

    // Transform to our format
    const rankings: TeamRanking[] = [];

    if (data && data.length > 0) {
      const latestPoll = data[0];
      const apPoll = latestPoll.polls?.find((p: any) => p.poll === 'AP Top 25');

      if (apPoll) {
        apPoll.ranks?.forEach((rank: any, index: number) => {
          rankings.push({
            rank: rank.rank,
            team: rank.school,
            school: rank.school,
            city: rank.conference || '',
            state: this.getStateFromConference(rank.conference),
            region: this.getRegionFromConference(rank.conference),
            classification: 'FBS',
            record: `${rank.wins || 0}-${rank.losses || 0}`,
            wins: rank.wins || 0,
            losses: rank.losses || 0,
            winPct: rank.wins / (rank.wins + rank.losses || 1),
            rating: this.calculateCompositeRating(rank),
            trend: 0, // Would need historical data
          });
        });
      }
    }

    return rankings;
  }

  /**
   * Fetch High School Football Rankings (Texas focus)
   */
  async getHighSchoolFootballRankings(state: string = 'TX'): Promise<TeamRanking[]> {
    // Note: Would need to integrate MaxPreps or similar API
    // For now, return placeholder structure with note
    return [];
  }

  /**
   * Fetch Live MLB Scores from SportsDataIO
   */
  async getLiveMLBScores(date?: string): Promise<LiveGame[]> {
    const gameDate = date || new Date().toISOString().split('T')[0];
    const cacheKey = `mlb:live:${gameDate}`;

    const { data } = await this.getCached(
      cacheKey,
      async () => {
        const url = `https://api.sportsdata.io/v3/mlb/scores/json/GamesByDate/${gameDate}`;

        return await this.fetchWithRetry<any>(url, {
          headers: {
            'Ocp-Apim-Subscription-Key': this.config.sportsDataIOKey,
          },
        });
      },
      30 // 30-second TTL for live data
    );

    return (data || []).map((game: any) => ({
      id: game.GameID.toString(),
      sport: 'baseball' as const,
      homeTeam: {
        id: game.HomeTeamID?.toString(),
        name: game.HomeTeam,
        score: game.HomeTeamRuns || 0,
        logo: `https://cdn.sportsdata.io/mlb/logos/${game.HomeTeam}.png`,
      },
      awayTeam: {
        id: game.AwayTeamID?.toString(),
        name: game.AwayTeam,
        score: game.AwayTeamRuns || 0,
        logo: `https://cdn.sportsdata.io/mlb/logos/${game.AwayTeam}.png`,
      },
      status: game.Status === 'Final' ? 'final' : game.Status === 'InProgress' ? 'in_progress' : 'scheduled',
      quarter: game.Inning ? `Inning ${game.Inning}` : undefined,
      timeRemaining: game.InningHalf,
      venue: game.Stadium,
      date: game.DateTime,
    }));
  }

  /**
   * Fetch Live NFL Scores from SportsDataIO
   */
  async getLiveNFLScores(season: number = 2025, week?: number): Promise<LiveGame[]> {
    const cacheKey = `nfl:live:${season}:${week || 'current'}`;

    const { data } = await this.getCached(
      cacheKey,
      async () => {
        const weekParam = week || 'current';
        const url = `https://api.sportsdata.io/v3/nfl/scores/json/ScoresByWeek/${season}/${weekParam}`;

        return await this.fetchWithRetry<any>(url, {
          headers: {
            'Ocp-Apim-Subscription-Key': this.config.sportsDataIOKey,
          },
        });
      },
      30 // 30-second TTL for live data
    );

    return (data || []).map((game: any) => ({
      id: game.ScoreID?.toString(),
      sport: 'football' as const,
      homeTeam: {
        id: game.HomeTeamID?.toString(),
        name: game.HomeTeam,
        score: game.HomeScore || 0,
        logo: `https://cdn.sportsdata.io/nfl/logos/${game.HomeTeam}.png`,
      },
      awayTeam: {
        id: game.AwayTeamID?.toString(),
        name: game.AwayTeam,
        score: game.AwayScore || 0,
        logo: `https://cdn.sportsdata.io/nfl/logos/${game.AwayTeam}.png`,
      },
      status: game.Status === 'Final' ? 'final' : game.Status === 'InProgress' ? 'in_progress' : 'scheduled',
      quarter: game.Quarter ? `Q${game.Quarter}` : undefined,
      timeRemaining: game.TimeRemaining,
      venue: game.Stadium,
      date: game.DateTime,
    }));
  }

  /**
   * Fetch Live NBA Scores from SportsDataIO
   */
  async getLiveNBAScores(date?: string): Promise<LiveGame[]> {
    const gameDate = date || new Date().toISOString().split('T')[0];
    const cacheKey = `nba:live:${gameDate}`;

    const { data } = await this.getCached(
      cacheKey,
      async () => {
        const url = `https://api.sportsdata.io/v3/nba/scores/json/GamesByDate/${gameDate}`;

        return await this.fetchWithRetry<any>(url, {
          headers: {
            'Ocp-Apim-Subscription-Key': this.config.sportsDataIOKey,
          },
        });
      },
      30 // 30-second TTL for live data
    );

    return (data || []).map((game: any) => ({
      id: game.GameID?.toString(),
      sport: 'basketball' as const,
      homeTeam: {
        id: game.HomeTeamID?.toString(),
        name: game.HomeTeam,
        score: game.HomeTeamScore || 0,
        logo: `https://cdn.sportsdata.io/nba/logos/${game.HomeTeam}.png`,
      },
      awayTeam: {
        id: game.AwayTeamID?.toString(),
        name: game.AwayTeam,
        score: game.AwayTeamScore || 0,
        logo: `https://cdn.sportsdata.io/nba/logos/${game.AwayTeam}.png`,
      },
      status: game.Status === 'Final' ? 'final' : game.Status === 'InProgress' ? 'in_progress' : 'scheduled',
      quarter: game.Quarter ? `Q${game.Quarter}` : undefined,
      timeRemaining: game.TimeRemaining,
      venue: game.Stadium,
      date: game.DateTime,
    }));
  }

  /**
   * Fetch NCAA Teams by Conference
   */
  async getNCAATeamsByConference(conference: string, year: number = 2025): Promise<any[]> {
    const cacheKey = `cfb:teams:${conference}:${year}`;

    const { data } = await this.getCached(cacheKey, async () => {
      const url = `https://api.collegefootballdata.com/teams?conference=${encodeURIComponent(conference)}&year=${year}`;

      return await this.fetchWithRetry<any>(url, {
        headers: {
          Authorization: `Bearer ${this.config.collegeFBDataKey}`,
        },
      });
    });

    return data || [];
  }

  /**
   * Fetch Team Records
   */
  async getNCAATeamRecords(year: number = 2025, team?: string, conference?: string): Promise<any[]> {
    const cacheKey = `cfb:records:${year}:${team || 'all'}:${conference || 'all'}`;

    const { data } = await this.getCached(cacheKey, async () => {
      let url = `https://api.collegefootballdata.com/records?year=${year}`;
      if (team) url += `&team=${encodeURIComponent(team)}`;
      if (conference) url += `&conference=${encodeURIComponent(conference)}`;

      return await this.fetchWithRetry<any>(url, {
        headers: {
          Authorization: `Bearer ${this.config.collegeFBDataKey}`,
        },
      });
    });

    return data || [];
  }

  /**
   * Helper: Calculate composite rating
   */
  private calculateCompositeRating(team: any): number {
    const wins = team.wins || 0;
    const losses = team.losses || 0;
    const totalGames = wins + losses || 1;
    const winPct = wins / totalGames;

    const performance = winPct * 40;
    const talent = 75 * 0.3; // Default 75 if no data
    const historical = 75 * 0.2;
    const sos = 75 * 0.1;

    return Math.round((performance + talent + historical + sos) * 10) / 10;
  }

  /**
   * Helper: Get state from conference
   */
  private getStateFromConference(conference: string): string {
    const conferenceStates: Record<string, string> = {
      SEC: 'AL',
      'Big 12': 'TX',
      ACC: 'NC',
      'Big Ten': 'MI',
      'Pac-12': 'CA',
    };
    return conferenceStates[conference] || 'US';
  }

  /**
   * Helper: Get region from conference
   */
  private getRegionFromConference(conference: string): string {
    const deepSouthConferences = ['SEC', 'American Athletic'];
    return deepSouthConferences.includes(conference) ? 'Deep South' : 'Other';
  }

  /**
   * Clear cache
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
}

// Export singleton with environment variables
// SECURITY: All API keys MUST be set via environment variables
// No fallback keys allowed in production code
export const realSportsDataClient = new RealSportsDataClient({
  sportsDataIOKey: process.env.SPORTSDATAIO_API_KEY || (() => {
    throw new Error('SPORTSDATAIO_API_KEY environment variable is required');
  })(),
  collegeFBDataKey: process.env.CFBDATA_API_KEY || (() => {
    throw new Error('CFBDATA_API_KEY environment variable is required');
  })(),
  theOddsAPIKey: process.env.THEODDS_API_KEY || (() => {
    throw new Error('THEODDS_API_KEY environment variable is required');
  })(),
});