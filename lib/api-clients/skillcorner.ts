/**
 * SkillCorner Broadcast-Derived Tracking Data Client
 *
 * SkillCorner uses computer vision to extract player tracking data from
 * standard broadcast video — no stadium-installed cameras required. This
 * makes it the primary tracking solution for leagues without dedicated
 * optical systems (college football, college baseball, international leagues).
 *
 * Per the CV sports survey:
 *   - SkillCorner raised $60M Series B (2024) and covers 80+ leagues
 *   - Broadcast-derived tracking is the only viable path for D1 sports
 *     where installing 30+ Hawk-Eye cameras at 300 venues is impractical
 *   - Metrics: player speed, distance covered, sprint counts, positioning
 *
 * This client handles:
 *   - Match-level tracking summaries (team & player physical output)
 *   - Player speed/distance profiles
 *   - Team tactical positioning data
 *   - Season-level physical benchmarks
 *
 * Authentication: SkillCorner uses Bearer tokens.
 * Fallback: Returns structured seed data when no API key is configured.
 */

// ─── Configuration ──────────────────────────────────────────────────────────

export interface SkillCornerConfig {
  apiKey?: string;
  baseUrl?: string;
  timeout?: number;
  maxRetries?: number;
  userAgent?: string;
}

const DEFAULTS = {
  baseUrl: 'https://api.skillcorner.com/v2',
  timeout: 15_000,
  maxRetries: 3,
  userAgent: 'BSI-SkillCorner-Client/1.0',
} as const;

// ─── Types ──────────────────────────────────────────────────────────────────

export interface PlayerTrackingData {
  playerId: string;
  playerName: string;
  teamId: string;
  teamName: string;
  position: string;
  metrics: {
    totalDistanceM: number;
    sprintDistanceM: number;
    highSpeedRunDistanceM: number;
    topSpeedKmh: number;
    avgSpeedKmh: number;
    sprintCount: number;
    highIntensityEfforts: number;
    minutesPlayed: number;
  };
}

export interface TeamTrackingData {
  teamId: string;
  teamName: string;
  abbreviation: string;
  metrics: {
    avgTotalDistanceM: number;
    avgSprintDistanceM: number;
    avgTopSpeedKmh: number;
    avgSprintCount: number;
    avgHighIntensityEfforts: number;
    possessionPct: number;
  };
  players: PlayerTrackingData[];
}

export interface MatchTrackingSummary {
  matchId: string;
  date: string;
  competition: string;
  season: string;
  awayTeam: TeamTrackingData;
  homeTeam: TeamTrackingData;
  conditions?: {
    temperature?: number;
    humidity?: number;
    surface?: string;
  };
}

export interface PlayerSpeedProfile {
  playerId: string;
  playerName: string;
  position: string;
  seasonAvg: {
    topSpeedKmh: number;
    avgSprintSpeedKmh: number;
    sprintsPerGame: number;
    distancePerGame: number;
    highSpeedDistancePerGame: number;
  };
  percentileRank: {
    topSpeed: number;
    sprintCount: number;
    distance: number;
  };
  trend: 'improving' | 'stable' | 'declining';
}

export interface SkillCornerResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  source: 'skillcorner' | 'seed';
  timestamp: string;
  duration_ms: number;
}

// ─── Seed Data (Representative College Football Tracking Metrics) ───────────

function generateSeedMatchTracking(): MatchTrackingSummary {
  return {
    matchId: 'seed-cfb-001',
    date: '2026-09-05',
    competition: 'NCAA FBS',
    season: '2026',
    awayTeam: {
      teamId: 'osu', teamName: 'Ohio State Buckeyes', abbreviation: 'OSU',
      metrics: {
        avgTotalDistanceM: 10245, avgSprintDistanceM: 892, avgTopSpeedKmh: 33.4,
        avgSprintCount: 48, avgHighIntensityEfforts: 67, possessionPct: 54.2,
      },
      players: [
        { playerId: 'p1', playerName: 'Sample QB', teamId: 'osu', teamName: 'Ohio State', position: 'QB',
          metrics: { totalDistanceM: 8420, sprintDistanceM: 312, highSpeedRunDistanceM: 620, topSpeedKmh: 28.9, avgSpeedKmh: 8.1, sprintCount: 12, highIntensityEfforts: 22, minutesPlayed: 60 } },
        { playerId: 'p2', playerName: 'Sample WR', teamId: 'osu', teamName: 'Ohio State', position: 'WR',
          metrics: { totalDistanceM: 10890, sprintDistanceM: 1420, highSpeedRunDistanceM: 2100, topSpeedKmh: 35.2, avgSpeedKmh: 9.8, sprintCount: 68, highIntensityEfforts: 84, minutesPlayed: 58 } },
        { playerId: 'p3', playerName: 'Sample RB', teamId: 'osu', teamName: 'Ohio State', position: 'RB',
          metrics: { totalDistanceM: 9200, sprintDistanceM: 980, highSpeedRunDistanceM: 1560, topSpeedKmh: 33.8, avgSpeedKmh: 8.9, sprintCount: 42, highIntensityEfforts: 58, minutesPlayed: 45 } },
      ],
    },
    homeTeam: {
      teamId: 'tex', teamName: 'Texas Longhorns', abbreviation: 'TEX',
      metrics: {
        avgTotalDistanceM: 9870, avgSprintDistanceM: 845, avgTopSpeedKmh: 32.8,
        avgSprintCount: 44, avgHighIntensityEfforts: 62, possessionPct: 45.8,
      },
      players: [
        { playerId: 'p4', playerName: 'Sample QB', teamId: 'tex', teamName: 'Texas', position: 'QB',
          metrics: { totalDistanceM: 7890, sprintDistanceM: 280, highSpeedRunDistanceM: 540, topSpeedKmh: 27.5, avgSpeedKmh: 7.6, sprintCount: 10, highIntensityEfforts: 18, minutesPlayed: 60 } },
        { playerId: 'p5', playerName: 'Sample WR', teamId: 'tex', teamName: 'Texas', position: 'WR',
          metrics: { totalDistanceM: 10420, sprintDistanceM: 1380, highSpeedRunDistanceM: 2040, topSpeedKmh: 34.5, avgSpeedKmh: 9.4, sprintCount: 62, highIntensityEfforts: 78, minutesPlayed: 55 } },
      ],
    },
    conditions: { temperature: 88, humidity: 62, surface: 'natural grass' },
  };
}

const SEED_SPEED_PROFILES: PlayerSpeedProfile[] = [
  { playerId: 'sp1', playerName: 'Example WR (Top-Tier)', position: 'WR', seasonAvg: { topSpeedKmh: 35.8, avgSprintSpeedKmh: 31.2, sprintsPerGame: 72, distancePerGame: 10950, highSpeedDistancePerGame: 2240 }, percentileRank: { topSpeed: 95, sprintCount: 92, distance: 88 }, trend: 'improving' },
  { playerId: 'sp2', playerName: 'Example RB (Power)', position: 'RB', seasonAvg: { topSpeedKmh: 33.2, avgSprintSpeedKmh: 29.8, sprintsPerGame: 38, distancePerGame: 8200, highSpeedDistancePerGame: 1420 }, percentileRank: { topSpeed: 72, sprintCount: 55, distance: 45 }, trend: 'stable' },
  { playerId: 'sp3', playerName: 'Example CB (Elite)', position: 'CB', seasonAvg: { topSpeedKmh: 34.9, avgSprintSpeedKmh: 30.6, sprintsPerGame: 58, distancePerGame: 10200, highSpeedDistancePerGame: 1980 }, percentileRank: { topSpeed: 90, sprintCount: 80, distance: 82 }, trend: 'stable' },
];

// ─── Client ─────────────────────────────────────────────────────────────────

export class SkillCornerClient {
  private config: Required<Pick<SkillCornerConfig, 'timeout' | 'maxRetries' | 'userAgent'>> & SkillCornerConfig;
  private isLive: boolean;

  constructor(config: SkillCornerConfig = {}) {
    this.config = { ...DEFAULTS, ...config };
    this.isLive = Boolean(config.apiKey);
  }

  private async fetchWithRetry<T>(path: string): Promise<SkillCornerResponse<T>> {
    const start = Date.now();
    const url = `${this.config.baseUrl ?? DEFAULTS.baseUrl}${path}`;

    for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), this.config.timeout);

        const res = await fetch(url, {
          signal: controller.signal,
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Accept': 'application/json',
            'User-Agent': this.config.userAgent,
          },
        });
        clearTimeout(timeout);

        if (res.status === 429) {
          const retryAfter = parseInt(res.headers.get('Retry-After') || '2', 10);
          await new Promise((r) => setTimeout(r, retryAfter * 1000));
          continue;
        }

        if (res.status >= 500 && attempt < this.config.maxRetries) {
          await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt)));
          continue;
        }

        if (!res.ok) {
          return {
            success: false,
            error: `HTTP ${res.status}: ${res.statusText}`,
            source: 'skillcorner',
            timestamp: new Date().toISOString(),
            duration_ms: Date.now() - start,
          };
        }

        const data = (await res.json()) as T;
        return {
          success: true,
          data,
          source: 'skillcorner',
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - start,
        };
      } catch (err) {
        if (attempt === this.config.maxRetries) {
          return {
            success: false,
            error: err instanceof Error ? err.message : 'Unknown error',
            source: 'skillcorner',
            timestamp: new Date().toISOString(),
            duration_ms: Date.now() - start,
          };
        }
        await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt)));
      }
    }

    return {
      success: false,
      error: 'Max retries exhausted',
      source: 'skillcorner',
      timestamp: new Date().toISOString(),
      duration_ms: Date.now() - start,
    };
  }

  // ─── Public API ───────────────────────────────────────────────────────

  /**
   * Get tracking data for a specific match.
   */
  async getMatchTracking(matchId: string): Promise<SkillCornerResponse<MatchTrackingSummary>> {
    if (!this.isLive) {
      return {
        success: true,
        data: generateSeedMatchTracking(),
        source: 'seed',
        timestamp: new Date().toISOString(),
        duration_ms: 0,
      };
    }
    return this.fetchWithRetry<MatchTrackingSummary>(`/matches/${matchId}/tracking`);
  }

  /**
   * Get speed/distance profiles for players in a competition/season.
   */
  async getSpeedProfiles(competition: string, season: string): Promise<SkillCornerResponse<PlayerSpeedProfile[]>> {
    if (!this.isLive) {
      return {
        success: true,
        data: SEED_SPEED_PROFILES,
        source: 'seed',
        timestamp: new Date().toISOString(),
        duration_ms: 0,
      };
    }
    return this.fetchWithRetry<PlayerSpeedProfile[]>(`/competitions/${competition}/seasons/${season}/speed-profiles`);
  }

  /**
   * Get a single player's tracking profile.
   */
  async getPlayerProfile(playerId: string): Promise<SkillCornerResponse<PlayerSpeedProfile | null>> {
    if (!this.isLive) {
      const profile = SEED_SPEED_PROFILES.find((p) => p.playerId === playerId) || null;
      return {
        success: true,
        data: profile,
        source: 'seed',
        timestamp: new Date().toISOString(),
        duration_ms: 0,
      };
    }
    return this.fetchWithRetry<PlayerSpeedProfile>(`/players/${playerId}/speed-profile`);
  }

  async healthCheck(): Promise<{ ok: boolean; source: string; latency_ms: number }> {
    const start = Date.now();
    if (!this.isLive) return { ok: true, source: 'seed', latency_ms: 0 };
    try {
      const result = await this.fetchWithRetry<unknown>('/health');
      return { ok: result.success, source: 'skillcorner', latency_ms: Date.now() - start };
    } catch {
      return { ok: false, source: 'skillcorner', latency_ms: Date.now() - start };
    }
  }
}

export function createSkillCornerClient(config?: SkillCornerConfig): SkillCornerClient {
  return new SkillCornerClient({
    apiKey: config?.apiKey || process.env.SKILLCORNER_API_KEY || process.env.NEXT_PUBLIC_SKILLCORNER_KEY,
    ...config,
  });
}
