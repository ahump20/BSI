/**
 * PitcherNet / Biomechanics Data Client
 *
 * Aggregates pitcher biomechanics data from multiple potential sources:
 *   - KinaTrax (50+ MLB ballparks, markerless motion capture)
 *   - Rapsodo (90% of D1 baseball programs, ball-flight + spin data)
 *   - PitcherNet (CVPR 2024 open-source, smartphone video inference)
 *   - Driveline/TrackMan (pitching lab data, industry-standard metrics)
 *
 * Per the CV sports survey:
 *   - UCL injury prevention is a $300M/year problem for MLB
 *   - KinaTrax tracks 18 joint positions at 300fps
 *   - PitcherNet (Zou et al., CVPR 2024) achieves ~2-degree accuracy
 *     on joint angles from standard broadcast video
 *   - Rapsodo is deployed at D1 programs, making it the most immediate
 *     data source for college baseball pitcher profiling
 *
 * This client provides:
 *   - Pitcher biomechanics profiles (arm slot, hip-shoulder sep, stride, torque)
 *   - Pitch-level mechanics (release point, extension, spin efficiency)
 *   - Workload & fatigue indicators (velocity trends, mechanical drift)
 *   - Injury risk scores (elbow stress proxies)
 *
 * Fallback: Returns benchmark-based seed data when no live API is available.
 */

// ─── Configuration ──────────────────────────────────────────────────────────

export interface BiomechanicsConfig {
  provider?: 'kinatrax' | 'rapsodo' | 'pitchernet' | 'driveline';
  apiKey?: string;
  baseUrl?: string;
  timeout?: number;
  maxRetries?: number;
}

const PROVIDER_DEFAULTS: Record<string, { baseUrl: string; name: string }> = {
  kinatrax: { baseUrl: 'https://api.kinatrax.com/v2', name: 'KinaTrax' },
  rapsodo: { baseUrl: 'https://api.rapsodo.com/v1', name: 'Rapsodo' },
  pitchernet: { baseUrl: 'https://api.pitchernet.ai/v1', name: 'PitcherNet' },
  driveline: { baseUrl: 'https://api.drivelinebaseball.com/v1', name: 'Driveline' },
};

// ─── Types ──────────────────────────────────────────────────────────────────

export interface BiomechanicsProfile {
  playerId: string;
  playerName: string;
  team: string;
  throws: 'L' | 'R';
  level: 'MLB' | 'MiLB' | 'D1' | 'D2' | 'D3' | 'JUCO' | 'HS';
  dataSource: string;
  lastUpdated: string;

  mechanics: {
    armSlotDegrees: number;            // Typical: 15-75 (submarine to over-the-top)
    hipShoulderSeparationDegrees: number; // Typical: 40-65 for elite pitchers
    strideLengthPctHeight: number;     // Typical: 77-87% of height
    trunkTiltDegrees: number;          // Forward lean at release
    shoulderExternalRotationDegrees: number; // "Layback" — typical: 170-185
    elbowFlexionAtReleaseDegrees: number;    // Typical: 15-30
    pelvisRotationSpeedDegSec: number;       // Typical: 600-900 deg/sec
    trunkRotationSpeedDegSec: number;        // Typical: 900-1300 deg/sec
  };

  pitchMetrics: {
    avgFastballVelocityMph: number;
    maxFastballVelocityMph: number;
    avgSpinRateRpm: number;
    spinEfficiencyPct: number;
    extensionFt: number;               // Release distance from rubber
    releasePtHeight: number;           // Feet from ground
    inducedVertBreakIn: number;        // Inches of "rise" vs gravity
    horizontalBreakIn: number;         // Inches of arm-side run
  };

  workload: {
    pitchesLast7Days: number;
    pitchesLast30Days: number;
    highEffortPitchesPct: number;      // % of pitches > 95% max velo
    velocityTrendLast5Starts: number[]; // mph per start
    mechanicalDriftScore: number;      // 0-100 (0 = perfectly consistent)
  };

  injuryRisk: {
    elbowStressProxy: 'low' | 'moderate' | 'elevated' | 'high';
    shoulderLoadProxy: 'low' | 'moderate' | 'elevated' | 'high';
    fatigueIndex: number;              // 0-100 (100 = fully fatigued)
    workloadConcern: boolean;
    notes: string[];
  };
}

export interface PitchBiomechanics {
  pitchId: string;
  pitchType: string;
  velocityMph: number;
  spinRateRpm: number;
  spinAxis: number;
  releasePointX: number;
  releasePointZ: number;
  extensionFt: number;
  armSlotDegrees: number;
  elbowStressNm?: number;             // Newton-meters (if available)
  hipShoulderSep: number;
  trunkRotationSpeed: number;
  isHighEffort: boolean;
}

export interface BiomechanicsResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  source: string;
  timestamp: string;
  duration_ms: number;
}

// ─── Benchmarks ─────────────────────────────────────────────────────────────

export const MLB_BENCHMARKS = {
  armSlotDegrees: { avg: 42, p10: 18, p90: 62 },
  hipShoulderSeparationDegrees: { avg: 52, p10: 40, p90: 65 },
  strideLengthPctHeight: { avg: 82, p10: 77, p90: 87 },
  shoulderExternalRotationDegrees: { avg: 178, p10: 170, p90: 185 },
  pelvisRotationSpeedDegSec: { avg: 750, p10: 620, p90: 890 },
  trunkRotationSpeedDegSec: { avg: 1100, p10: 920, p90: 1300 },
  avgFastballVelocityMph: { avg: 93.8, p10: 90.2, p90: 97.5 },
  spinRateRpm: { avg: 2280, p10: 2020, p90: 2550 },
  extensionFt: { avg: 6.3, p10: 5.8, p90: 6.9 },
} as const;

export const D1_BENCHMARKS = {
  armSlotDegrees: { avg: 40, p10: 16, p90: 60 },
  hipShoulderSeparationDegrees: { avg: 48, p10: 36, p90: 62 },
  strideLengthPctHeight: { avg: 80, p10: 75, p90: 86 },
  shoulderExternalRotationDegrees: { avg: 175, p10: 168, p90: 182 },
  pelvisRotationSpeedDegSec: { avg: 690, p10: 560, p90: 830 },
  trunkRotationSpeedDegSec: { avg: 1020, p10: 850, p90: 1200 },
  avgFastballVelocityMph: { avg: 89.5, p10: 85.0, p90: 94.0 },
  spinRateRpm: { avg: 2120, p10: 1880, p90: 2380 },
  extensionFt: { avg: 6.1, p10: 5.6, p90: 6.7 },
} as const;

// ─── Seed Profiles ──────────────────────────────────────────────────────────

function createSeedProfile(level: 'MLB' | 'D1'): BiomechanicsProfile {
  const isMLB = level === 'MLB';
  return {
    playerId: isMLB ? 'seed-mlb-rhp' : 'seed-d1-rhp',
    playerName: isMLB ? 'MLB Benchmark RHP' : 'D1 Benchmark RHP',
    team: isMLB ? 'League Average' : 'D1 Average',
    throws: 'R',
    level,
    dataSource: 'BSI Benchmarks',
    lastUpdated: new Date().toISOString(),
    mechanics: {
      armSlotDegrees: isMLB ? 42 : 40,
      hipShoulderSeparationDegrees: isMLB ? 52 : 48,
      strideLengthPctHeight: isMLB ? 82 : 80,
      trunkTiltDegrees: isMLB ? 34 : 32,
      shoulderExternalRotationDegrees: isMLB ? 178 : 175,
      elbowFlexionAtReleaseDegrees: isMLB ? 22 : 24,
      pelvisRotationSpeedDegSec: isMLB ? 750 : 690,
      trunkRotationSpeedDegSec: isMLB ? 1100 : 1020,
    },
    pitchMetrics: {
      avgFastballVelocityMph: isMLB ? 93.8 : 89.5,
      maxFastballVelocityMph: isMLB ? 97.2 : 93.0,
      avgSpinRateRpm: isMLB ? 2280 : 2120,
      spinEfficiencyPct: isMLB ? 72 : 68,
      extensionFt: isMLB ? 6.3 : 6.1,
      releasePtHeight: isMLB ? 5.9 : 5.8,
      inducedVertBreakIn: isMLB ? 14.5 : 12.8,
      horizontalBreakIn: isMLB ? 8.2 : 7.5,
    },
    workload: {
      pitchesLast7Days: isMLB ? 102 : 89,
      pitchesLast30Days: isMLB ? 420 : 380,
      highEffortPitchesPct: isMLB ? 18 : 22,
      velocityTrendLast5Starts: isMLB
        ? [94.1, 93.8, 93.5, 93.9, 93.7]
        : [89.8, 89.5, 89.2, 89.6, 89.4],
      mechanicalDriftScore: isMLB ? 12 : 18,
    },
    injuryRisk: {
      elbowStressProxy: 'low',
      shoulderLoadProxy: 'low',
      fatigueIndex: isMLB ? 25 : 30,
      workloadConcern: false,
      notes: [
        'Benchmark profile — represents league-average mechanical profile.',
        `Hip-shoulder separation at ${isMLB ? '52' : '48'}° is within normal range.`,
        'Velocity trends stable over last 5 starts.',
      ],
    },
  };
}

// ─── Client ─────────────────────────────────────────────────────────────────

export class BiomechanicsClient {
  private provider: string;
  private apiKey?: string;
  private baseUrl: string;
  private timeout: number;
  private maxRetries: number;
  private isLive: boolean;

  constructor(config: BiomechanicsConfig = {}) {
    this.provider = config.provider || 'pitchernet';
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || PROVIDER_DEFAULTS[this.provider]?.baseUrl || PROVIDER_DEFAULTS.pitchernet.baseUrl;
    this.timeout = config.timeout || 15_000;
    this.maxRetries = config.maxRetries || 3;
    this.isLive = Boolean(config.apiKey);
  }

  private async fetchWithRetry<T>(path: string): Promise<BiomechanicsResponse<T>> {
    const start = Date.now();
    const url = `${this.baseUrl}${path}`;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), this.timeout);

        const headers: Record<string, string> = {
          'Accept': 'application/json',
          'User-Agent': 'BSI-Biomechanics-Client/1.0',
        };

        if (this.apiKey) {
          if (this.provider === 'rapsodo') {
            headers['X-API-Key'] = this.apiKey;
          } else {
            headers['Authorization'] = `Bearer ${this.apiKey}`;
          }
        }

        const res = await fetch(url, { signal: controller.signal, headers });
        clearTimeout(timeout);

        if (res.status === 429) {
          const retryAfter = parseInt(res.headers.get('Retry-After') || '2', 10);
          await new Promise((r) => setTimeout(r, retryAfter * 1000));
          continue;
        }

        if (res.status >= 500 && attempt < this.maxRetries) {
          await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt)));
          continue;
        }

        if (!res.ok) {
          return {
            success: false,
            error: `HTTP ${res.status}: ${res.statusText}`,
            source: this.provider,
            timestamp: new Date().toISOString(),
            duration_ms: Date.now() - start,
          };
        }

        const data = (await res.json()) as T;
        return {
          success: true, data,
          source: this.provider,
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - start,
        };
      } catch (err) {
        if (attempt === this.maxRetries) {
          return {
            success: false,
            error: err instanceof Error ? err.message : 'Unknown error',
            source: this.provider,
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
      source: this.provider,
      timestamp: new Date().toISOString(),
      duration_ms: Date.now() - start,
    };
  }

  // ─── Public API ───────────────────────────────────────────────────────

  /**
   * Get a pitcher's full biomechanics profile.
   */
  async getPitcherProfile(playerId: string, level: 'MLB' | 'D1' = 'MLB'): Promise<BiomechanicsResponse<BiomechanicsProfile>> {
    if (!this.isLive) {
      return {
        success: true,
        data: createSeedProfile(level),
        source: 'seed',
        timestamp: new Date().toISOString(),
        duration_ms: 0,
      };
    }
    return this.fetchWithRetry<BiomechanicsProfile>(`/pitchers/${playerId}/biomechanics`);
  }

  /**
   * Get pitch-level biomechanics for a specific game appearance.
   */
  async getGamePitches(playerId: string, gameId: string): Promise<BiomechanicsResponse<PitchBiomechanics[]>> {
    if (!this.isLive) {
      return {
        success: true,
        data: [],
        source: 'seed',
        timestamp: new Date().toISOString(),
        duration_ms: 0,
      };
    }
    return this.fetchWithRetry<PitchBiomechanics[]>(`/pitchers/${playerId}/games/${gameId}/pitches`);
  }

  /**
   * Get the injury risk assessment for a pitcher.
   */
  async getInjuryRisk(playerId: string): Promise<BiomechanicsResponse<BiomechanicsProfile['injuryRisk']>> {
    if (!this.isLive) {
      const profile = createSeedProfile('MLB');
      return {
        success: true,
        data: profile.injuryRisk,
        source: 'seed',
        timestamp: new Date().toISOString(),
        duration_ms: 0,
      };
    }
    return this.fetchWithRetry<BiomechanicsProfile['injuryRisk']>(`/pitchers/${playerId}/injury-risk`);
  }

  async healthCheck(): Promise<{ ok: boolean; provider: string; source: string; latency_ms: number }> {
    const start = Date.now();
    if (!this.isLive) return { ok: true, provider: this.provider, source: 'seed', latency_ms: 0 };
    try {
      const result = await this.fetchWithRetry<unknown>('/health');
      return { ok: result.success, provider: this.provider, source: this.provider, latency_ms: Date.now() - start };
    } catch {
      return { ok: false, provider: this.provider, source: this.provider, latency_ms: Date.now() - start };
    }
  }
}

// ─── Factory ────────────────────────────────────────────────────────────────

export function createBiomechanicsClient(config?: BiomechanicsConfig): BiomechanicsClient {
  return new BiomechanicsClient({
    apiKey: config?.apiKey || process.env.BIOMECHANICS_API_KEY || process.env.NEXT_PUBLIC_BIOMECHANICS_KEY,
    ...config,
  });
}
