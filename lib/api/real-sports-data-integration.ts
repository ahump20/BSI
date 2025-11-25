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
  // College football specific fields
  homeWinProb?: number;
  awayWinProb?: number;
  excitement?: number;
  possession?: 'home' | 'away';
  situation?: {
    down?: number;
    distance?: number;
    yardLine?: number;
    yardsToGoal?: number;
  };
}

export interface CFBGame {
  id: number;
  season: number;
  week: number;
  seasonType: 'regular' | 'postseason';
  startDate: string;
  homeTeam: string;
  homeConference?: string;
  homeScore?: number;
  awayTeam: string;
  awayConference?: string;
  awayScore?: number;
  venue?: string;
  venueId?: number;
  homeId: number;
  awayId: number;
  completed: boolean;
  neutralSite?: boolean;
  conferenceGame?: boolean;
  attendance?: number;
  highlights?: string;
  notes?: string;
}

export interface CFBTeam {
  id: number;
  school: string;
  mascot: string;
  abbreviation: string;
  altName?: string;
  conference: string;
  division: string;
  classification: string;
  color: string;
  altColor: string;
  logos: string[];
  location: {
    venueId: number;
    name: string;
    city: string;
    state: string;
    zip: string;
    countryCode: string;
    timezone: string;
    latitude: number;
    longitude: number;
    elevation: number;
    capacity: number;
    yearConstructed: number;
    grass: boolean;
    dome: boolean;
  };
}

export interface CFBTeamStats {
  team: string;
  conference?: string;
  season: number;
  games: number;
  stats: {
    category: string;
    stat: number;
  }[];
}

export interface CFBPlayByPlay {
  id: string;
  gameId: number;
  driveId: number;
  playNumber: number;
  period: number;
  clock: {
    minutes: number;
    seconds: number;
  };
  offense: string;
  offenseConference?: string;
  defense: string;
  defenseConference?: string;
  down?: number;
  distance?: number;
  yardLine?: number;
  yardsToGoal?: number;
  yardsGained?: number;
  playType: string;
  playText: string;
  ppa?: number;
  scoring: boolean;
  homeScore: number;
  awayScore: number;
  wallclock?: string;
}

export interface CFBPlayerStats {
  season: number;
  team: string;
  conference?: string;
  player: string;
  playerId: number;
  category: string;
  statType: string;
  stat: number;
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
        await new Promise((resolve) => setTimeout(resolve, delay));
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
      expires: now + ttl * 1000,
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
      status:
        game.Status === 'Final'
          ? 'final'
          : game.Status === 'InProgress'
            ? 'in_progress'
            : 'scheduled',
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
      status:
        game.Status === 'Final'
          ? 'final'
          : game.Status === 'InProgress'
            ? 'in_progress'
            : 'scheduled',
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
      status:
        game.Status === 'Final'
          ? 'final'
          : game.Status === 'InProgress'
            ? 'in_progress'
            : 'scheduled',
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
  async getNCAATeamRecords(
    year: number = 2025,
    team?: string,
    conference?: string
  ): Promise<any[]> {
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
   * Fetch College Football Games
   */
  async getCFBGames(params: {
    year: number;
    week?: number;
    seasonType?: 'regular' | 'postseason' | 'both';
    team?: string;
    conference?: string;
    division?: string;
  }): Promise<CFBGame[]> {
    const cacheKey = `cfb:games:${params.year}:${params.week || 'all'}:${params.team || 'all'}:${params.conference || 'all'}`;

    const { data } = await this.getCached(
      cacheKey,
      async () => {
        let url = `https://api.collegefootballdata.com/games?year=${params.year}`;
        if (params.week) url += `&week=${params.week}`;
        if (params.seasonType) url += `&seasonType=${params.seasonType}`;
        if (params.team) url += `&team=${encodeURIComponent(params.team)}`;
        if (params.conference) url += `&conference=${encodeURIComponent(params.conference)}`;
        if (params.division) url += `&division=${params.division}`;

        return await this.fetchWithRetry<any[]>(url, {
          headers: {
            Authorization: `Bearer ${this.config.collegeFBDataKey}`,
          },
        });
      },
      300
    ); // 5-minute cache

    return (data || []).map((game: any) => ({
      id: game.id,
      season: game.season,
      week: game.week,
      seasonType: game.season_type,
      startDate: game.start_date,
      homeTeam: game.home_team,
      homeConference: game.home_conference,
      homeScore: game.home_points,
      awayTeam: game.away_team,
      awayConference: game.away_conference,
      awayScore: game.away_points,
      venue: game.venue,
      venueId: game.venue_id,
      homeId: game.home_id,
      awayId: game.away_id,
      completed: game.completed,
      neutralSite: game.neutral_site,
      conferenceGame: game.conference_game,
      attendance: game.attendance,
      highlights: game.highlights,
      notes: game.notes,
    }));
  }

  /**
   * Fetch Live College Football Scores
   */
  async getLiveCFBScores(year: number = 2025, week?: number): Promise<LiveGame[]> {
    const currentWeek = week || this.getCurrentCFBWeek();
    const cacheKey = `cfb:live:${year}:${currentWeek}`;

    const { data } = await this.getCached(
      cacheKey,
      async () => {
        const url = `https://api.collegefootballdata.com/games?year=${year}&week=${currentWeek}`;

        return await this.fetchWithRetry<any[]>(url, {
          headers: {
            Authorization: `Bearer ${this.config.collegeFBDataKey}`,
          },
        });
      },
      30 // 30-second TTL for live data
    );

    return (data || []).map((game: any) => ({
      id: game.id.toString(),
      sport: 'football' as const,
      homeTeam: {
        id: game.home_id?.toString(),
        name: game.home_team,
        score: game.home_points || 0,
        logo: game.home_logo,
      },
      awayTeam: {
        id: game.away_id?.toString(),
        name: game.away_team,
        score: game.away_points || 0,
        logo: game.away_logo,
      },
      status: game.completed
        ? 'final'
        : game.start_date && new Date(game.start_date) < new Date()
          ? 'in_progress'
          : 'scheduled',
      venue: game.venue,
      date: game.start_date,
    }));
  }

  /**
   * Fetch College Football Teams
   */
  async getCFBTeams(params?: { conference?: string; year?: number }): Promise<CFBTeam[]> {
    const year = params?.year || new Date().getFullYear();
    const cacheKey = `cfb:teams:${params?.conference || 'all'}:${year}`;

    const { data } = await this.getCached(
      cacheKey,
      async () => {
        let url = `https://api.collegefootballdata.com/teams`;
        const queryParams = [];
        if (params?.conference)
          queryParams.push(`conference=${encodeURIComponent(params.conference)}`);
        if (queryParams.length) url += `?${queryParams.join('&')}`;

        return await this.fetchWithRetry<any[]>(url, {
          headers: {
            Authorization: `Bearer ${this.config.collegeFBDataKey}`,
          },
        });
      },
      3600
    ); // 1-hour cache for team data

    return (data || []).map((team: any) => ({
      id: team.id,
      school: team.school,
      mascot: team.mascot,
      abbreviation: team.abbreviation,
      altName: team.alt_name,
      conference: team.conference,
      division: team.division,
      classification: team.classification,
      color: team.color,
      altColor: team.alt_color,
      logos: team.logos || [],
      location: team.location
        ? {
            venueId: team.location.venue_id,
            name: team.location.name,
            city: team.location.city,
            state: team.location.state,
            zip: team.location.zip,
            countryCode: team.location.country_code,
            timezone: team.location.timezone,
            latitude: team.location.latitude,
            longitude: team.location.longitude,
            elevation: team.location.elevation,
            capacity: team.location.capacity,
            yearConstructed: team.location.year_constructed,
            grass: team.location.grass,
            dome: team.location.dome,
          }
        : null,
    }));
  }

  /**
   * Fetch Team Season Stats
   */
  async getCFBTeamStats(params: {
    year: number;
    team?: string;
    conference?: string;
    startWeek?: number;
    endWeek?: number;
  }): Promise<CFBTeamStats[]> {
    const cacheKey = `cfb:teamstats:${params.year}:${params.team || 'all'}:${params.conference || 'all'}`;

    const { data } = await this.getCached(
      cacheKey,
      async () => {
        let url = `https://api.collegefootballdata.com/stats/season?year=${params.year}`;
        if (params.team) url += `&team=${encodeURIComponent(params.team)}`;
        if (params.conference) url += `&conference=${encodeURIComponent(params.conference)}`;
        if (params.startWeek) url += `&startWeek=${params.startWeek}`;
        if (params.endWeek) url += `&endWeek=${params.endWeek}`;

        return await this.fetchWithRetry<any[]>(url, {
          headers: {
            Authorization: `Bearer ${this.config.collegeFBDataKey}`,
          },
        });
      },
      600
    ); // 10-minute cache

    return (data || []).map((teamStats: any) => ({
      team: teamStats.team,
      conference: teamStats.conference,
      season: params.year,
      games: teamStats.games,
      stats: Object.keys(teamStats)
        .filter((key) => !['team', 'conference', 'games'].includes(key))
        .map((key) => ({
          category: key,
          stat: teamStats[key],
        })),
    }));
  }

  /**
   * Fetch Player Season Stats
   */
  async getCFBPlayerStats(params: {
    year: number;
    seasonType?: 'regular' | 'postseason' | 'both';
    team?: string;
    conference?: string;
    category?: string;
  }): Promise<CFBPlayerStats[]> {
    const cacheKey = `cfb:playerstats:${params.year}:${params.team || 'all'}:${params.category || 'all'}`;

    const { data } = await this.getCached(
      cacheKey,
      async () => {
        let url = `https://api.collegefootballdata.com/stats/player/season?year=${params.year}`;
        if (params.seasonType) url += `&seasonType=${params.seasonType}`;
        if (params.team) url += `&team=${encodeURIComponent(params.team)}`;
        if (params.conference) url += `&conference=${encodeURIComponent(params.conference)}`;
        if (params.category) url += `&category=${params.category}`;

        return await this.fetchWithRetry<any[]>(url, {
          headers: {
            Authorization: `Bearer ${this.config.collegeFBDataKey}`,
          },
        });
      },
      600
    ); // 10-minute cache

    return (data || []).map((player: any) => ({
      season: player.season,
      team: player.team,
      conference: player.conference,
      player: player.player,
      playerId: player.playerId,
      category: player.category,
      statType: player.statType,
      stat: player.stat,
    }));
  }

  /**
   * Fetch Play-by-Play Data
   */
  async getCFBPlayByPlay(params: {
    gameId: number;
    seasonType?: 'regular' | 'postseason' | 'both';
    week?: number;
    team?: string;
    offense?: string;
    defense?: string;
    conference?: string;
    playType?: number;
  }): Promise<CFBPlayByPlay[]> {
    const cacheKey = `cfb:plays:${params.gameId}`;

    const { data } = await this.getCached(
      cacheKey,
      async () => {
        let url = `https://api.collegefootballdata.com/plays?gameId=${params.gameId}`;
        if (params.seasonType) url += `&seasonType=${params.seasonType}`;
        if (params.week) url += `&week=${params.week}`;
        if (params.team) url += `&team=${encodeURIComponent(params.team)}`;
        if (params.offense) url += `&offense=${encodeURIComponent(params.offense)}`;
        if (params.defense) url += `&defense=${encodeURIComponent(params.defense)}`;
        if (params.conference) url += `&conference=${encodeURIComponent(params.conference)}`;
        if (params.playType) url += `&playType=${params.playType}`;

        return await this.fetchWithRetry<any[]>(url, {
          headers: {
            Authorization: `Bearer ${this.config.collegeFBDataKey}`,
          },
        });
      },
      60
    ); // 1-minute cache for live plays

    return (data || []).map((play: any) => ({
      id: play.id,
      gameId: play.game_id,
      driveId: play.drive_id,
      playNumber: play.play_number,
      period: play.period,
      clock: {
        minutes: play.clock?.minutes || 0,
        seconds: play.clock?.seconds || 0,
      },
      offense: play.offense,
      offenseConference: play.offense_conference,
      defense: play.defense,
      defenseConference: play.defense_conference,
      down: play.down,
      distance: play.distance,
      yardLine: play.yard_line,
      yardsToGoal: play.yards_to_goal,
      yardsGained: play.yards_gained,
      playType: play.play_type,
      playText: play.play_text,
      ppa: play.ppa,
      scoring: play.scoring,
      homeScore: play.home_score,
      awayScore: play.away_score,
      wallclock: play.wallclock,
    }));
  }

  /**
   * Fetch Live Play-by-Play for In-Progress Games
   */
  async getLiveCFBPlays(year: number = 2025, week?: number): Promise<CFBPlayByPlay[]> {
    const currentWeek = week || this.getCurrentCFBWeek();
    const cacheKey = `cfb:liveplays:${year}:${currentWeek}`;

    const { data } = await this.getCached(
      cacheKey,
      async () => {
        const url = `https://api.collegefootballdata.com/live/plays?year=${year}&week=${currentWeek}`;

        return await this.fetchWithRetry<any[]>(url, {
          headers: {
            Authorization: `Bearer ${this.config.collegeFBDataKey}`,
          },
        });
      },
      15 // 15-second TTL for live plays
    );

    return (data || []).map((play: any) => ({
      id: play.id,
      gameId: play.game_id,
      driveId: play.drive_id,
      playNumber: play.play_number,
      period: play.period,
      clock: {
        minutes: play.clock?.minutes || 0,
        seconds: play.clock?.seconds || 0,
      },
      offense: play.offense,
      offenseConference: play.offense_conference,
      defense: play.defense,
      defenseConference: play.defense_conference,
      down: play.down,
      distance: play.distance,
      yardLine: play.yard_line,
      yardsToGoal: play.yards_to_goal,
      yardsGained: play.yards_gained,
      playType: play.play_type,
      playText: play.play_text,
      ppa: play.ppa,
      scoring: play.scoring,
      homeScore: play.home_score,
      awayScore: play.away_score,
      wallclock: play.wallclock,
    }));
  }

  /**
   * Get current CFB week (estimated based on date)
   */
  private getCurrentCFBWeek(): number {
    const now = new Date();
    const seasonStart = new Date(now.getFullYear(), 7, 25); // August 25 typical season start

    if (now < seasonStart) {
      return 1;
    }

    const diffTime = Math.abs(now.getTime() - seasonStart.getTime());
    const diffWeeks = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7));

    return Math.min(diffWeeks, 15); // Regular season is typically 12-15 weeks
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
  sportsDataIOKey:
    process.env.SPORTSDATAIO_API_KEY ||
    (() => {
      throw new Error('SPORTSDATAIO_API_KEY environment variable is required');
    })(),
  // Support both old and new environment variable names for CFBD API key
  collegeFBDataKey:
    process.env['CollegeFootballData.com_API_KEY'] ||
    process.env.CFBDATA_API_KEY ||
    (() => {
      throw new Error(
        'CollegeFootballData.com_API_KEY or CFBDATA_API_KEY environment variable is required'
      );
    })(),
  theOddsAPIKey:
    process.env.THEODDS_API_KEY ||
    (() => {
      throw new Error('THEODDS_API_KEY environment variable is required');
    })(),
});
