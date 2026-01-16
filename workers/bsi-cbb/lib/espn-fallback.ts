/**
 * ESPN Fallback Provider
 * Provides roster and team data when Highlightly API doesn't support it.
 */

import { z } from 'zod';

export type ESPNSportKey = 'mlb' | 'nfl' | 'college-baseball' | 'college-football';

export interface ESPNPlayer {
  id: string;
  fullName: string;
  displayName: string;
  shortName: string;
  jersey?: string;
  position?: string;
  height?: string;
  weight?: number;
  age?: number;
  birthPlace?: string;
  college?: string;
  experience?: number;
  status?: string;
  headshot?: string;
}

export interface ESPNTeam {
  id: string;
  name: string;
  displayName: string;
  abbreviation: string;
  shortDisplayName: string;
  location?: string;
  color?: string;
  alternateColor?: string;
  logo?: string;
  conference?: string;
  record?: string;
}

const ESPNAthleteSchema = z
  .object({
    id: z.coerce.string(),
    fullName: z.string().optional(),
    displayName: z.string().optional(),
    shortName: z.string().optional(),
    jersey: z.string().optional(),
    position: z
      .object({
        abbreviation: z.string().optional(),
        name: z.string().optional(),
      })
      .optional(),
    headshot: z
      .object({
        href: z.string().optional(),
      })
      .optional(),
    experience: z
      .object({
        years: z.number().optional(),
      })
      .optional(),
    status: z
      .object({
        type: z.string().optional(),
      })
      .optional(),
    birthPlace: z
      .object({
        city: z.string().optional(),
        state: z.string().optional(),
        country: z.string().optional(),
      })
      .optional(),
    college: z
      .object({
        name: z.string().optional(),
      })
      .optional(),
  })
  .passthrough();

const SPORT_CONFIG: Record<ESPNSportKey, { sport: string; league: string }> = {
  mlb: { sport: 'baseball', league: 'mlb' },
  nfl: { sport: 'football', league: 'nfl' },
  'college-baseball': { sport: 'baseball', league: 'college-baseball' },
  'college-football': { sport: 'football', league: 'college-football' },
};

const BASE_URL = 'https://site.api.espn.com/apis/site/v2/sports';

export class ESPNFallbackProvider {
  private kv: KVNamespace;

  constructor(kv: KVNamespace) {
    this.kv = kv;
  }

  private async fetchWithCache<T>(
    url: string,
    cacheKey: string,
    ttlSeconds: number
  ): Promise<T | null> {
    const cached = await this.kv.get(cacheKey, 'json');
    if (cached) {
      return cached as T;
    }

    try {
      const response = await fetch(url, {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'BlazeSportsIntel/2.0 (https://blazesportsintel.com)',
        },
      });

      if (!response.ok) {
        console.error(`ESPN API error ${response.status}: ${url}`);
        return null;
      }

      const data = (await response.json()) as T;
      await this.kv.put(cacheKey, JSON.stringify(data), { expirationTtl: ttlSeconds });
      return data;
    } catch (error) {
      console.error('ESPN fetch error:', error);
      return null;
    }
  }

  async getTeamRoster(sportKey: ESPNSportKey, teamId: string): Promise<ESPNPlayer[]> {
    const config = SPORT_CONFIG[sportKey];
    if (!config) {
      throw new Error(`Unsupported sport: ${sportKey}`);
    }

    const url = `${BASE_URL}/${config.sport}/${config.league}/teams/${teamId}/roster`;
    const cacheKey = `espn:roster:${sportKey}:${teamId}`;
    const data = await this.fetchWithCache<any>(url, cacheKey, 86400);

    if (!data || !data.athletes) {
      return [];
    }

    const players: ESPNPlayer[] = [];
    for (const category of data.athletes || []) {
      for (const athlete of category.items || []) {
        try {
          const parsed = ESPNAthleteSchema.safeParse(athlete);
          if (parsed.success) {
            const a = parsed.data;
            players.push({
              id: a.id,
              fullName: a.fullName || a.displayName || 'Unknown',
              displayName: a.displayName || a.fullName || 'Unknown',
              shortName: a.shortName || a.displayName || '',
              jersey: a.jersey,
              position: a.position?.abbreviation || a.position?.name,
              headshot: a.headshot?.href,
              experience: a.experience?.years,
              status: a.status?.type,
              birthPlace: a.birthPlace
                ? [a.birthPlace.city, a.birthPlace.state, a.birthPlace.country]
                    .filter(Boolean)
                    .join(', ')
                : undefined,
              college: a.college?.name,
            });
          }
        } catch (e) {
          continue;
        }
      }
    }
    return players;
  }

  async getTeam(sportKey: ESPNSportKey, teamId: string): Promise<ESPNTeam | null> {
    const config = SPORT_CONFIG[sportKey];
    if (!config) {
      throw new Error(`Unsupported sport: ${sportKey}`);
    }

    const url = `${BASE_URL}/${config.sport}/${config.league}/teams/${teamId}`;
    const cacheKey = `espn:team:${sportKey}:${teamId}`;
    const data = await this.fetchWithCache<any>(url, cacheKey, 86400);

    if (!data || !data.team) {
      return null;
    }

    const team = data.team;
    return {
      id: team.id?.toString() || teamId,
      name: team.name || '',
      displayName: team.displayName || team.name || '',
      abbreviation: team.abbreviation || '',
      shortDisplayName: team.shortDisplayName || team.name || '',
      location: team.location,
      color: team.color,
      alternateColor: team.alternateColor,
      logo: team.logos?.[0]?.href,
      conference: team.groups?.name,
      record: team.record?.items?.[0]?.summary,
    };
  }

  static mapSportKey(bsiSport: string): ESPNSportKey | null {
    const mapping: Record<string, ESPNSportKey> = {
      mlb: 'mlb',
      nfl: 'nfl',
      'ncaa-baseball': 'college-baseball',
      'ncaa-football': 'college-football',
    };
    return mapping[bsiSport] || null;
  }
}

export function createESPNFallback(kv: KVNamespace): ESPNFallbackProvider {
  return new ESPNFallbackProvider(kv);
}
