import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { ProviderManager } from '@lib/adapters/provider-manager';
import type { Env, GamesQueryParams } from '../../workers/ingest/types';

const baseEnv: Env = {
  SPORTSDATA_API_KEY: 'primary',
  NCAA_API_KEY: 'backup',
  ESPN_API_KEY: 'tertiary',
} as Env;

const sampleParams: GamesQueryParams = {
  sport: 'baseball',
  division: 'D1',
  date: new Date('2025-02-14T18:00:00Z'),
  status: ['LIVE'],
};

describe('ProviderManager failover', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('falls back to secondary provider when the primary fails', async () => {
    const manager = new ProviderManager(baseEnv);

    const primary = (manager as any).sportsDataIO;
    const secondary = (manager as any).ncaaAPI;
    const tertiary = (manager as any).espnAPI;

    vi.spyOn(primary, 'getGames').mockRejectedValueOnce(new Error('primary unavailable'));
    vi.spyOn(secondary, 'getGames').mockResolvedValueOnce([
      {
        id: 'backup-game',
        scheduledAt: new Date().toISOString(),
        status: 'LIVE',
        homeTeamId: 'home',
        awayTeamId: 'away',
        homeScore: 2,
        awayScore: 1,
        providerName: 'ncaa',
        feedPrecision: 'PLAY',
      },
    ]);
    const tertiarySpy = vi.spyOn(tertiary, 'getGames');

    const games = await manager.getGames(sampleParams);

    expect(games).toHaveLength(1);
    expect(primary.getGames).toHaveBeenCalledTimes(1);
    expect(secondary.getGames).toHaveBeenCalledTimes(1);
    expect(tertiarySpy).not.toHaveBeenCalled();
  });

  it('falls back to tertiary provider when primary and secondary fail', async () => {
    const manager = new ProviderManager(baseEnv);

    const primary = (manager as any).sportsDataIO;
    const secondary = (manager as any).ncaaAPI;
    const tertiary = (manager as any).espnAPI;

    vi.spyOn(primary, 'getGames').mockRejectedValueOnce(new Error('primary unavailable'));
    vi.spyOn(secondary, 'getGames').mockRejectedValueOnce(new Error('secondary unavailable'));
    vi.spyOn(tertiary, 'getGames').mockResolvedValueOnce([
      {
        id: 'tertiary-game',
        scheduledAt: new Date().toISOString(),
        status: 'SCHEDULED',
        homeTeamId: 'home',
        awayTeamId: 'away',
        homeScore: null,
        awayScore: null,
        providerName: 'espn',
        feedPrecision: 'PLAY',
      },
    ]);

    const games = await manager.getGames(sampleParams);

    expect(games).toHaveLength(1);
    expect(primary.getGames).toHaveBeenCalledTimes(1);
    expect(secondary.getGames).toHaveBeenCalledTimes(1);
    expect(tertiary.getGames).toHaveBeenCalledTimes(1);
  });
});
